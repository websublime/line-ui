import { z } from 'zod';
import type { Hue } from './hues.js';
import { GRAY_HUES, HUES, HueSchema } from './hues.js';

/**
 * The on-color for a step-9 solid fill: black (`#000`) or white (`#fff`).
 */
export type ContrastColor = '#000' | '#fff';

/**
 * The 20 saturated hues whose step-9 solid takes black text in both modes (AM-092). For each of them `#000` has a
 * higher WCAG 2.1 contrast ratio than `#fff` against the Radix step 9, which is the same colour in light and dark.
 * The other five saturated hues (indigo, iris, plum, purple, violet) take white; the six {@link GRAY_HUES} take
 * black in light mode and white in dark.
 */
export const BLACK_CONTRAST_HUES = [
  'amber',
  'blue',
  'bronze',
  'brown',
  'crimson',
  'cyan',
  'gold',
  'grass',
  'green',
  'jade',
  'lime',
  'mint',
  'orange',
  'pink',
  'red',
  'ruby',
  'sky',
  'teal',
  'tomato',
  'yellow',
] as const;

export type BlackContrastHue = (typeof BLACK_CONTRAST_HUES)[number];

const BLACK_CONTRAST_HUE_SET: ReadonlySet<Hue> = new Set<Hue>(BLACK_CONTRAST_HUES);

const GRAY_HUE_SET: ReadonlySet<Hue> = new Set<Hue>(GRAY_HUES);

/**
 * Light-mode on-color per hue (AM-092): `'#000'` for the {@link BLACK_CONTRAST_HUES} and the {@link GRAY_HUES},
 * `'#fff'` for every other hue. Each value is whichever of black and white has the higher WCAG 2.1 contrast ratio
 * against the hue's light-mode Radix step 9. {@link PER_HUE_CONTRAST_DARK} holds the dark-mode values, and
 * {@link contrastFor} reads the table of a mode. `scripts/validate-contrast.mjs` gates both tables at 4.5:1.
 */
export const PER_HUE_CONTRAST: Record<Hue, ContrastColor> = HUES.reduce(
  (acc, hue) => {
    acc[hue] = BLACK_CONTRAST_HUE_SET.has(hue) || GRAY_HUE_SET.has(hue) ? '#000' : '#fff';
    return acc;
  },
  {} as Record<Hue, ContrastColor>,
);

/**
 * Dark-mode on-color per hue (AM-092): `'#fff'` for the {@link GRAY_HUES}, whose dark step 9 is darker than their
 * light one, and {@link PER_HUE_CONTRAST}'s value for every other hue, whose step 9 is the same in both modes.
 */
export const PER_HUE_CONTRAST_DARK: Record<Hue, ContrastColor> = HUES.reduce(
  (acc, hue) => {
    acc[hue] = GRAY_HUE_SET.has(hue) ? '#fff' : PER_HUE_CONTRAST[hue];
    return acc;
  },
  {} as Record<Hue, ContrastColor>,
);

/**
 * The on-color for `hue`'s step-9 solid in `mode` (AM-092): {@link PER_HUE_CONTRAST} in light mode,
 * {@link PER_HUE_CONTRAST_DARK} in dark. The `line-colors` palette generator emits one value when the two modes
 * agree and `light-dark(light, dark)` when they differ.
 */
export const contrastFor = (hue: Hue, mode: 'light' | 'dark'): ContrastColor =>
  (mode === 'dark' ? PER_HUE_CONTRAST_DARK : PER_HUE_CONTRAST)[hue];

export const ContrastColorSchema = z.union([z.literal('#000'), z.literal('#fff')]);

/** Parses either contrast table. */
export const PerHueContrastSchema = z.record(HueSchema, ContrastColorSchema);
