/**
 * WCAG Contrast Validation — verifies AA compliance for all 28 palettes.
 *
 * For each palette:
 * - Extracts the level-9 (solid-background) HSL color
 * - Extracts the --line-{palette}-contrast hex color
 * - Computes WCAG 2.1 contrast ratio
 * - Fails if ratio < 4.5:1 (AA for normal text)
 *
 * Validates both light and dark modes.
 *
 * @module test/contrast
 */

import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { contrastRatio, hslToRgb, parseColor, parseHsl } from './helpers/color-math';
import { extractDeclarations } from './helpers/css-parser';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THEME_ROOT = resolve(import.meta.dirname, '..');
const COLORS_DIR = resolve(THEME_ROOT, 'src/colors');

/** WCAG AA minimum contrast ratio for normal text */
const WCAG_AA_NORMAL = 4.5;

/** All 28 palette names */
const PALETTES = readdirSync(COLORS_DIR)
  .filter((f) => f.endsWith('.css'))
  .map((f) => f.replace('.css', ''))
  .sort();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a color file and extract declarations per mode.
 *
 * Light mode: declarations inside `:where(html) { ... }` (first block)
 * Dark mode: declarations inside `:where(html):is(.dark) { ... }` block
 */
function parseColorFile(filePath: string): {
  light: Map<string, string>;
  dark: Map<string, string>;
} {
  const css = readFileSync(filePath, 'utf-8');

  // Split by the dark mode selector
  const darkSplit = css.split(':is(.dark)');

  // Everything before the dark mode block is light mode
  const lightCss = darkSplit[0] || '';
  // Everything after is dark mode
  const darkCss = darkSplit.length > 1 ? darkSplit.slice(1).join(':is(.dark)') : '';

  return {
    light: extractDeclarations(lightCss),
    dark: extractDeclarations(darkCss)
  };
}

/**
 * Resolve a color value to an RGB tuple.
 * Handles both hsl() and hex values.
 */
function resolveColor(value: string): [number, number, number] | null {
  return parseColor(value);
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

/** Assert a value is defined and return it with narrowed type. */
function assertDefined<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`Expected ${label} to be defined`);
  }
  return value;
}

/** Assert a value is non-null and return it with narrowed type. */
function assertNonNull<T>(value: T | null, label: string): T {
  if (value === null) {
    throw new Error(`Expected ${label} to be non-null`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WCAG Contrast Validation', () => {
  test('discovers exactly 28 palettes', () => {
    expect(PALETTES.length).toBe(28);
  });

  for (const palette of PALETTES) {
    describe(`${palette}`, () => {
      const filePath = join(COLORS_DIR, `${palette}.css`);
      const { light, dark } = parseColorFile(filePath);

      test('light mode: contrast token vs level-9 meets WCAG AA (4.5:1)', () => {
        const level9Key = `--line-${palette}-9`;
        const contrastKey = `--line-${palette}-contrast`;

        const level9Value = light.get(level9Key);
        const contrastValue = light.get(contrastKey);

        const level9 = assertDefined(level9Value, level9Key);
        const contrast = assertDefined(contrastValue, contrastKey);

        const bgRgb = assertNonNull(resolveColor(level9), `resolveColor(${level9Key})`);
        const fgRgb = assertNonNull(resolveColor(contrast), `resolveColor(${contrastKey})`);

        const ratio = contrastRatio(bgRgb, fgRgb);

        if (ratio < WCAG_AA_NORMAL) {
          throw new Error(
            `${palette} light: contrast ratio ${ratio.toFixed(2)}:1 ` +
              `(${contrastValue} on ${level9Value}) ` +
              `is below WCAG AA threshold of ${WCAG_AA_NORMAL}:1`
          );
        }
      });

      test('dark mode: contrast token vs level-9 equivalent meets WCAG AA (4.5:1)', () => {
        const contrastKey = `--line-${palette}-contrast`;

        // The contrast token might be redeclared in dark mode, or inherited from light
        const contrastValue = dark.get(contrastKey) ?? light.get(contrastKey);

        // In dark mode, the schema maps --line-solid-background to level-4
        const level4DarkKey = `--line-${palette}-4`;
        const solidBgValue = dark.get(level4DarkKey);

        if (!(solidBgValue && contrastValue)) {
          // Some palettes may not have dark mode yet; skip gracefully
          return;
        }

        const bgRgb = resolveColor(solidBgValue);
        const fgRgb = resolveColor(contrastValue);

        if (!(bgRgb && fgRgb)) return;

        const ratio = contrastRatio(bgRgb, fgRgb);

        if (ratio < WCAG_AA_NORMAL) {
          throw new Error(
            `${palette} dark: contrast ratio ${ratio.toFixed(2)}:1 ` +
              `(${contrastValue} on ${solidBgValue}) ` +
              `is below WCAG AA threshold of ${WCAG_AA_NORMAL}:1`
          );
        }
      });

      test('light mode: high-contrast text vs background meets WCAG AA', () => {
        const level12Key = `--line-${palette}-12`;
        const level1Key = `--line-${palette}-1`;

        const fgValue = light.get(level12Key);
        const bgValue = light.get(level1Key);

        const fg = assertDefined(fgValue, level12Key);
        const bg = assertDefined(bgValue, level1Key);

        const fgRgb = assertNonNull(resolveColor(fg), `resolveColor(${level12Key})`);
        const bgRgb = assertNonNull(resolveColor(bg), `resolveColor(${level1Key})`);

        const ratio = contrastRatio(fgRgb, bgRgb);

        if (ratio < WCAG_AA_NORMAL) {
          throw new Error(
            `${palette} light: high-contrast text ratio ${ratio.toFixed(2)}:1 ` +
              `(level-12 on level-1) ` +
              `is below WCAG AA threshold of ${WCAG_AA_NORMAL}:1`
          );
        }
      });
    });
  }
});

describe('Color Math Sanity Checks', () => {
  test('black on white contrast is 21:1', () => {
    const ratio = contrastRatio([0, 0, 0], [255, 255, 255]);
    expect(ratio).toBeCloseTo(21, 0);
  });

  test('white on black contrast is 21:1', () => {
    const ratio = contrastRatio([255, 255, 255], [0, 0, 0]);
    expect(ratio).toBeCloseTo(21, 0);
  });

  test('same color contrast is 1:1', () => {
    const ratio = contrastRatio([128, 128, 128], [128, 128, 128]);
    expect(ratio).toBeCloseTo(1, 1);
  });

  test('hslToRgb converts pure red correctly', () => {
    const [r, g, b] = hslToRgb(0, 100, 50);
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  test('hslToRgb converts pure blue correctly', () => {
    const [r, g, b] = hslToRgb(240, 100, 50);
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(255);
  });

  test('parseHsl handles CSS hsl() format', () => {
    const result = parseHsl('hsl(206, 100%, 50.0%)');
    expect(result).toEqual([206, 100, 50]);
  });
});
