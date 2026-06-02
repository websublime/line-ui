import { z } from 'zod';

/**
 * The full set of 31 design-system hues.
 *
 * This is the canonical source of truth for every hue-keyed contract in the
 * design system (palette generation, role mappings, contrast validation).
 *
 * Note: the 31-hue tuple is a **superset** that includes the 6 gray-family
 * hues. `ACCENT_HUES` therefore equals `HUES` (all 31) by design — the grays
 * are NOT subtracted.
 */
export const HUES = [
  'amber',
  'blue',
  'bronze',
  'brown',
  'crimson',
  'cyan',
  'gold',
  'grass',
  'gray',
  'green',
  'indigo',
  'iris',
  'jade',
  'lime',
  'mauve',
  'mint',
  'olive',
  'orange',
  'pink',
  'plum',
  'purple',
  'red',
  'ruby',
  'sage',
  'sand',
  'sky',
  'slate',
  'teal',
  'tomato',
  'violet',
  'yellow',
] as const;

export type Hue = (typeof HUES)[number];

export const HueSchema = z.enum(HUES);

/**
 * Accent hues — all 31 hues. An accent role may be assigned any hue, including
 * the gray-family hues, so this is identical to {@link HUES}.
 */
export const ACCENT_HUES = HUES;

export type AccentHue = Hue;

export const AccentHueSchema = HueSchema;

/**
 * The 6 gray-family hues, a strict subset of {@link HUES}.
 */
export const GRAY_HUES = ['gray', 'mauve', 'slate', 'sage', 'olive', 'sand'] as const;

export type GrayHue = (typeof GRAY_HUES)[number];

export const GrayHueSchema = z.enum(GRAY_HUES);
