/**
 * WCAG 2.1 contrast helpers (ledger 01-Z30, Phase 00 spec §6.C.5, AM-092).
 *
 * `THRESHOLD` stays the 3:1 floor for non-text UI and large text; `TEXT_THRESHOLD` is the 4.5:1 floor for
 * normal-size text that `scripts/validate-contrast.mjs` applies. The ratio math is checked at known WCAG values.
 *
 * @module __tests__/contrast
 */

import { describe, expect, test } from 'bun:test';
import { contrastRatio, hexToRgb, relativeLuminance, SOLID_STEP, TEXT_THRESHOLD, THRESHOLD } from '../src/contrast.ts';
import * as barrel from '../src/index.ts';

describe('thresholds', () => {
  test('THRESHOLD is 3, the non-text and large-text floor', () => {
    expect(THRESHOLD).toBe(3);
  });

  test('TEXT_THRESHOLD is 4.5, the normal-size text floor', () => {
    expect(TEXT_THRESHOLD).toBe(4.5);
  });

  test('SOLID_STEP is 9', () => {
    expect(SOLID_STEP).toBe(9);
  });

  test('the barrel re-exports both thresholds', () => {
    expect(barrel.THRESHOLD).toBe(3);
    expect(barrel.TEXT_THRESHOLD).toBe(4.5);
  });
});

describe('contrastRatio', () => {
  test('black on white is 21:1 and a colour on itself is 1:1', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 10);
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 10);
    expect(contrastRatio('#0090ff', '#0090ff')).toBe(1);
  });

  test('Radix orange-9 measures 2.97:1 on white and 7.07:1 on black (AM-014, AM-092)', () => {
    expect(contrastRatio('#f76b15', '#fff').toFixed(2)).toBe('2.97');
    expect(contrastRatio('#f76b15', '#000').toFixed(2)).toBe('7.07');
  });

  test('Radix plum-9 on white sits above TEXT_THRESHOLD at 4.75:1', () => {
    const ratio = contrastRatio('#ab4aba', '#fff');
    expect(ratio.toFixed(2)).toBe('4.75');
    expect(ratio).toBeGreaterThanOrEqual(TEXT_THRESHOLD);
  });
});

describe('hexToRgb and relativeLuminance', () => {
  test('parse 3- and 6-digit hex and reject anything else', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('0090ff')).toEqual({ r: 0, g: 144, b: 255 });
    expect(() => hexToRgb('#ffff')).toThrow('unparseable hex color');
    expect(() => hexToRgb('#gggggg')).toThrow('non-hex digits');
  });

  test('black is 0 and white is 1', () => {
    expect(relativeLuminance('#000')).toBe(0);
    expect(relativeLuminance('#fff')).toBe(1);
  });
});
