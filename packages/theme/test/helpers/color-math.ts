/**
 * Color math utilities for WCAG contrast validation.
 *
 * Implements:
 * - HSL to sRGB conversion
 * - Hex to sRGB conversion
 * - Relative luminance (WCAG 2.1)
 * - Contrast ratio (WCAG 2.1)
 *
 * @module test/helpers/color-math
 */

/**
 * Parse an HSL color string into [h, s, l] components.
 *
 * Handles formats:
 * - hsl(206, 100%, 50.0%)
 * - hsl(206 100% 50%)
 */
export function parseHsl(hslStr: string): [number, number, number] | null {
  // Match hsl(h, s%, l%) or hsl(h s% l%)
  const match = hslStr.match(/hsl\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%\s*\)/);
  if (!match) return null;

  return [Number.parseFloat(match[1]), Number.parseFloat(match[2]), Number.parseFloat(match[3])];
}

/**
 * Parse a hex color string into [r, g, b] in 0-255 range.
 *
 * Handles: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
 */
export function parseHex(hex: string): [number, number, number] | null {
  const cleaned = hex.trim().replace('#', '');

  let r: number;
  let g: number;
  let b: number;

  if (cleaned.length === 3 || cleaned.length === 4) {
    r = Number.parseInt(cleaned[0] + cleaned[0], 16);
    g = Number.parseInt(cleaned[1] + cleaned[1], 16);
    b = Number.parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6 || cleaned.length === 8) {
    r = Number.parseInt(cleaned.substring(0, 2), 16);
    g = Number.parseInt(cleaned.substring(2, 4), 16);
    b = Number.parseInt(cleaned.substring(4, 6), 16);
  } else {
    return null;
  }

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return [r, g, b];
}

/**
 * Convert HSL to sRGB (0-255 range).
 *
 * @param h - Hue in degrees (0-360)
 * @param s - Saturation as percentage (0-100)
 * @param l - Lightness as percentage (0-100)
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r1: number;
  let g1: number;
  let b1: number;

  if (h < 60) {
    [r1, g1, b1] = [c, x, 0];
  } else if (h < 120) {
    [r1, g1, b1] = [x, c, 0];
  } else if (h < 180) {
    [r1, g1, b1] = [0, c, x];
  } else if (h < 240) {
    [r1, g1, b1] = [0, x, c];
  } else if (h < 300) {
    [r1, g1, b1] = [x, 0, c];
  } else {
    [r1, g1, b1] = [c, 0, x];
  }

  return [Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)];
}

/**
 * Convert an sRGB component (0-255) to linear RGB.
 * Applies the sRGB gamma decoding (IEC 61966-2-1).
 */
function srgbToLinear(c: number): number {
  const srgb = c / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/**
 * Compute the relative luminance of an sRGB color per WCAG 2.1.
 *
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns Relative luminance (0-1)
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Compute the WCAG 2.1 contrast ratio between two colors.
 *
 * @returns Contrast ratio (1 to 21)
 */
export function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse a CSS color value (hsl() or hex) into an RGB tuple.
 */
export function parseColor(value: string): [number, number, number] | null {
  const trimmed = value.trim();

  if (trimmed.startsWith('hsl')) {
    const hsl = parseHsl(trimmed);
    if (!hsl) return null;
    return hslToRgb(...hsl);
  }

  if (trimmed.startsWith('#')) {
    return parseHex(trimmed);
  }

  // Named colors we care about
  if (trimmed === 'white') return [255, 255, 255];
  if (trimmed === 'black') return [0, 0, 0];

  return null;
}
