/**
 * Focus-ring contrast validator tests (ledger 01-Z31, Phase 00 spec §6.C.3, AM-093).
 *
 * `parseFocusRingStep(css)` is the parser `scripts/validate-focus-ring.mjs` runs over `focus-ring.css`;
 * `checkFocusRing(step)` is its pair check, step N of the 31 hues against the 68 distinct surfaces in light and dark.
 *
 * @module scripts/__tests__/validate-focus-ring
 */

import { describe, expect, mock, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import * as contrast from '../../packages/line-utils/src/contrast.ts';
import {
  checkFocusRing,
  describePair,
  FOCUS_RING_CSS,
  NON_TEXT_MIN_RATIO,
  parseFocusRingStep,
  surfaces,
} from '../validate-focus-ring.mjs';

const CONTRAST_MODULE = '../../packages/line-utils/src/contrast.ts';
/** The real exports, copied before any mock: `mock.module` updates loaded modules in place. */
const REAL_CONTRAST = { ...contrast };

/** A `focus-ring.css` body with the given `--line-focus-ring-color` declarations. */
function sheet(...values: string[]): string {
  const declarations = values.map((value) => `    --line-focus-ring-color: ${value};`).join('\n');
  return `/* defers to --line-focus-ring-color */
@layer line {
  :where(html) {
    --line-focus-ring-width: 2px;
${declarations}
    --line-focus-ring: var(--line-focus-ring-width) solid var(--line-focus-ring-color);
  }
}
`;
}

describe('parseFocusRingStep', () => {
  test('accepts var(--line-accent-11) and returns step 11', () => {
    expect(parseFocusRingStep(sheet('var(--line-accent-11)'))).toBe(11);
  });

  test('accepts every step from 1 to 12', () => {
    for (let step = 1; step <= 12; step += 1) {
      expect(parseFocusRingStep(sheet(`var(--line-accent-${step})`))).toBe(step);
    }
  });

  test('reads step 11 from the shipped focus-ring.css', () => {
    expect(parseFocusRingStep(readFileSync(FOCUS_RING_CSS, 'utf8'))).toBe(11);
  });

  test.each([
    ['a literal colour', '#3e63dd'],
    ['another role', 'var(--line-gray-11)'],
    ['a hue step', 'var(--line-indigo-11)'],
    ['an alpha step', 'var(--line-accent-a11)'],
    ['a var() fallback', 'var(--line-accent-11, #3e63dd)'],
    ['light-dark()', 'light-dark(var(--line-accent-11), var(--line-accent-10))'],
    ['color-mix()', 'color-mix(in oklab, var(--line-accent-11), white 10%)'],
    ['step 0', 'var(--line-accent-0)'],
    ['step 13', 'var(--line-accent-13)'],
    ['!important', 'var(--line-accent-11) !important'],
  ])('rejects %s and prints the value found', (_form, value) => {
    expect(() => parseFocusRingStep(sheet(value))).toThrow(`--line-focus-ring-color is ${JSON.stringify(value)}`);
  });

  test('rejects a missing declaration', () => {
    expect(() => parseFocusRingStep(sheet())).toThrow('found 0');
  });

  test('rejects a repeated declaration', () => {
    expect(() => parseFocusRingStep(sheet('var(--line-accent-11)', 'var(--line-accent-11)'))).toThrow('found 2');
  });

  test.each([
    ['an invalid value', ['#000\n::add-mask::x']],
    ['a repeated declaration', ['var(--line-accent-11)', '#000\n::add-mask::x']],
  ])('escapes a newline in %s, so no printed line starts a workflow command', (_case, values) => {
    let message = '';
    try {
      parseFocusRingStep(sheet(...values));
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain(JSON.stringify('#000\n::add-mask::x'));
    expect(message.split(/\r?\n/).filter((line) => /^\s*::/.test(line))).toEqual([]);
  });
});

describe('checkFocusRing', () => {
  test('bars at its own 3:1 constant, whatever THRESHOLD the shared contrast module exports', async () => {
    expect(NON_TEXT_MIN_RATIO).toBe(3);
    mock.module(CONTRAST_MODULE, () => ({ ...REAL_CONTRAST, THRESHOLD: 5 }));
    try {
      // A dynamic import on purpose: the script must load after the mock, as a new instance (query string).
      const fresh = await import('../validate-focus-ring.mjs?threshold-5');
      expect(contrast.THRESHOLD).toBe(5);
      const step11 = fresh.checkFocusRing(11);
      expect(step11.pairCount).toBe(4216);
      expect(step11.failures).toEqual([]);
      expect(fresh.checkFocusRing(8).failures.filter((failure) => failure.surfaceStep === 1)).toHaveLength(196);
    } finally {
      mock.module(CONTRAST_MODULE, () => REAL_CONTRAST);
    }
  });

  test('the 84 listed surfaces dedupe to 68', () => {
    const keys = surfaces().map(({ hue, step }) => `${hue}-${step}`);
    expect(keys).toHaveLength(68);
    expect(new Set(keys).size).toBe(68);
    expect(keys).toContain('neutral-1');
    expect(keys).toContain('red-3');
  });

  test('step 11 passes over 4 216 distinct pairs, lowest 3.90:1 light and 6.93:1 dark', () => {
    const { pairCount, failures, lowest } = checkFocusRing(11);
    expect(pairCount).toBe(4216);
    expect(failures).toEqual([]);
    expect(describePair(11, { mode: 'light', ...lowest.light })).toBe('light: ring orange 11 on crimson 3 = 3.90:1');
    expect(describePair(11, { mode: 'dark', ...lowest.dark })).toBe('dark: ring pink 11 on jade 3 = 6.93:1');
  });

  test('step 8 fails, 196 of its 372 pairs on gray step 1 (R10), naming a failing pair', () => {
    const { pairCount, failures } = checkFocusRing(8);
    expect(pairCount).toBe(4216);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.filter((failure) => failure.surfaceStep === 1)).toHaveLength(196);
    expect(failures.map((failure) => describePair(8, failure))).toContain('light: ring yellow 8 on neutral 1 = 2.06:1');
  });
});
