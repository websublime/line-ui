import { z } from 'zod';
import type { Hue } from './hues.js';
import { HUES, HueSchema } from './hues.js';

/**
 * The on-color for a step-9 / step-10 solid fill. For most hues the readable
 * foreground is white (`#fff`); for the bright hues listed in
 * {@link BLACK_CONTRAST_HUES} it is black (`#000`).
 */
export type ContrastColor = '#000' | '#fff';

/**
 * Hues whose step-9 solid is light enough that black text is the readable
 * on-color. Every other hue uses white.
 */
export const BLACK_CONTRAST_HUES = ['amber', 'yellow', 'lime', 'mint', 'sky', 'cyan'] as const;

export type BlackContrastHue = (typeof BLACK_CONTRAST_HUES)[number];

const BLACK_CONTRAST_HUE_SET: ReadonlySet<Hue> = new Set<Hue>(BLACK_CONTRAST_HUES);

/**
 * Per-hue on-color lookup. `PER_HUE_CONTRAST[H]` is `'#000'` for the bright
 * hues in {@link BLACK_CONTRAST_HUES} and `'#fff'` for all others. Consumed by
 * `line-colors` palette generation (`line-schemas/contrast-table` subpath).
 */
export const PER_HUE_CONTRAST: Record<Hue, ContrastColor> = HUES.reduce(
  (acc, hue) => {
    acc[hue] = BLACK_CONTRAST_HUE_SET.has(hue) ? '#000' : '#fff';
    return acc;
  },
  {} as Record<Hue, ContrastColor>,
);

export const ContrastColorSchema = z.union([z.literal('#000'), z.literal('#fff')]);

export const PerHueContrastSchema = z.record(HueSchema, ContrastColorSchema);
