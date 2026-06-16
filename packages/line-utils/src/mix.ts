// @websublime/line-utils — CSS `color-mix()` string builders.
//
// Pure string builders that compose CSS `color-mix()` expressions. They never
// parse, evaluate, or resolve colors — they emit the CSS text a stylesheet (or
// inline style) will hand to the browser, which does the actual interpolation.
// API surface is fixed per the C7 pre-implementation decision (bead
// line-ui-7qm.3.7): mix / withAlpha / tint / shade only. lighten/darken,
// multi-stop mixing, and component helpers (cn/mergeRefs) are out of scope for
// Phase 00.

/**
 * CSS `<color-interpolation-method>` color spaces accepted by `color-mix()`.
 * The list mirrors the CSS Color 5 specification; `srgb` is the library
 * default. Rectangular and polar spaces are both included — callers pass the
 * string verbatim into the emitted `in <space>` clause.
 */
export type ColorSpace =
  | 'srgb'
  | 'srgb-linear'
  | 'display-p3'
  | 'a98-rgb'
  | 'prophoto-rgb'
  | 'rec2020'
  | 'lab'
  | 'oklab'
  | 'xyz'
  | 'xyz-d50'
  | 'xyz-d65'
  | 'hsl'
  | 'hwb'
  | 'lch'
  | 'oklch';

/**
 * Shared options for every mix helper.
 */
export interface MixOptions {
  /** Color-interpolation space for the emitted `color-mix()`. Defaults to `srgb`. */
  colorSpace?: ColorSpace;
}

const DEFAULT_COLOR_SPACE: ColorSpace = 'srgb';

/**
 * Resolve the color space from caller options, falling back to the library
 * default. Centralised so every builder shares identical default semantics.
 */
function resolveSpace(options?: MixOptions): ColorSpace {
  return options?.colorSpace ?? DEFAULT_COLOR_SPACE;
}

/**
 * Clamp a percentage value into the CSS-valid `[0, 100]` range. Out-of-range
 * inputs would otherwise emit invalid `color-mix()` text (e.g. a negative or
 * over-100 percentage), which the browser silently rejects. `NaN` coerces to
 * `0` (the lower clamp bound) so non-finite callers never emit invalid `NaN%`
 * CSS. Clamping a numeric percentage is input validation, not color evaluation,
 * so it stays within the "pure string builder, no eval" contract.
 */
function clampPercent(value: number): number {
  return Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
}

/**
 * Build a CSS `color-mix()` of two colors.
 *
 * When `weight` is provided it is attached to `colorA` as a percentage; the
 * second percentage is omitted, letting CSS infer it (`100% - weight`). When
 * `weight` is omitted both colors are mixed at their default (equal) ratio.
 *
 * @param weight - Optional percentage weight applied to `colorA`, clamped to
 *   `[0, 100]`. When omitted, no percentage is emitted (CSS infers an equal
 *   mix); `undefined` is preserved and is not clamped.
 *
 * @example
 * mix('red', 'blue')        // 'color-mix(in srgb, red, blue)'
 * mix('red', 'blue', 30)    // 'color-mix(in srgb, red 30%, blue)'
 * mix('red', 'blue', 30, { colorSpace: 'oklch' })
 *                           // 'color-mix(in oklch, red 30%, blue)'
 */
export function mix(colorA: string, colorB: string, weight?: number, options?: MixOptions): string {
  const space = resolveSpace(options);
  const first = weight === undefined ? colorA : `${colorA} ${clampPercent(weight)}%`;
  return `color-mix(in ${space}, ${first}, ${colorB})`;
}

/**
 * Apply an opacity to a color by mixing it with `transparent`.
 *
 * `alphaPercent` is the desired opacity (0-100): `withAlpha('var(--c)', 40)`
 * yields a color that is 40% opaque. This is expressed as a mix of
 * `transparent` at `100 - alphaPercent` with the color, so the color's own
 * weight is the remaining `alphaPercent`.
 *
 * @param alphaPercent - Desired opacity percentage, clamped to `[0, 100]`.
 *
 * @example
 * withAlpha('var(--c)', 40)  // 'color-mix(in srgb, transparent 60%, var(--c))'
 */
export function withAlpha(color: string, alphaPercent: number, options?: MixOptions): string {
  const space = resolveSpace(options);
  const transparentWeight = 100 - clampPercent(alphaPercent);
  return `color-mix(in ${space}, transparent ${transparentWeight}%, ${color})`;
}

/**
 * Lighten a color by mixing it toward `white`.
 *
 * `amount` (0-100) is the percentage of `white` blended in.
 *
 * @param amount - Percentage of `white` to blend in, clamped to `[0, 100]`.
 *
 * @example
 * tint('var(--c)', 20)  // 'color-mix(in srgb, white 20%, var(--c))'
 */
export function tint(color: string, amount: number, options?: MixOptions): string {
  const space = resolveSpace(options);
  return `color-mix(in ${space}, white ${clampPercent(amount)}%, ${color})`;
}

/**
 * Darken a color by mixing it toward `black`.
 *
 * `amount` (0-100) is the percentage of `black` blended in.
 *
 * @param amount - Percentage of `black` to blend in, clamped to `[0, 100]`.
 *
 * @example
 * shade('var(--c)', 20)  // 'color-mix(in srgb, black 20%, var(--c))'
 */
export function shade(color: string, amount: number, options?: MixOptions): string {
  const space = resolveSpace(options);
  return `color-mix(in ${space}, black ${clampPercent(amount)}%, ${color})`;
}
