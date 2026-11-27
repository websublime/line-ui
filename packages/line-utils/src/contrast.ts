// @websublime/line-utils — WCAG 2.1 contrast helpers.
//
// Relative-luminance and contrast-ratio math per WCAG 2.1, shared between
// runtime consumers and `scripts/validate-contrast.mjs`. This is the single
// source of truth: the validator imports these helpers rather than inlining its
// own copy (see bead line-ui-7qm.3.7). The math is ported verbatim from the
// former inline implementation — any float change would shift computed ratios
// and could move a step-9 pair across the validator's floor, so it must stay exact.

/**
 * WCAG 2.1 AA contrast floor for non-text UI and large text, 3:1 (SC 1.4.11;
 * SC 1.4.3 large text; spec §6.C.5). An icon on a step-9 solid, such as the
 * IconButton `primary` glyph, needs this floor. Normal-size text needs
 * {@link TEXT_THRESHOLD}.
 */
export const THRESHOLD = 3;

/**
 * WCAG 2.1 AA contrast floor for normal-size text, 4.5:1 (SC 1.4.3; AM-092,
 * spec §6.C.3, §6.C.5). `scripts/validate-contrast.mjs` requires it of every
 * step-9 / contrast-token pair, because the Button and Chip `primary` labels
 * are normal-size text on step 9.
 */
export const TEXT_THRESHOLD = 4.5;

/**
 * Step 9 is the solid brand anchor a contrast token is paired against
 * (PRD §9.6). Hard-coded rather than imported from line-schemas `STEPS` because
 * the contrast token is, by construction, the on-color for step 9 specifically.
 */
export const SOLID_STEP = 9;

/**
 * Parse a CSS hex color (`#rgb`, `#rrggbb`, with or without leading `#`) into
 * 0-255 channels. Throws on any unparseable input so a malformed token surfaces
 * loudly rather than computing a bogus ratio. Covers both the 6-digit Radix
 * step-9 hexes and the 3-digit contrast tokens (`#000` / `#fff`).
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.trim().replace(/^#/, '');
  let full: string;
  if (h.length === 3) {
    full = h
      .split('')
      .map((c) => c + c)
      .join('');
  } else if (h.length === 6) {
    full = h;
  } else {
    throw new Error(`unparseable hex color "${hex}" (expected #rgb or #rrggbb)`);
  }
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`unparseable hex color "${hex}" (non-hex digits)`);
  }
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

/**
 * Linearize one sRGB channel (0-255) per the WCAG 2.1 definition.
 */
export function srgbToLinear(channel8: number): number {
  const c = channel8 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * WCAG 2.1 relative luminance of an sRGB hex color.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/**
 * WCAG 2.1 contrast ratio between two sRGB hex colors, in [1, 21].
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
