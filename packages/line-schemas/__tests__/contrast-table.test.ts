/**
 * Contrast tables (ledger 01-Z30, Phase 00 spec §6.C.1, AM-092).
 *
 * `PER_HUE_CONTRAST` holds the light-mode on-color of each hue, `PER_HUE_CONTRAST_DARK` the dark-mode one, and
 * `contrastFor(hue, mode)` reads the table of `mode`. Every hue × mode reaches 4.5:1 against its Radix step 9, the
 * two tables differ only for the six gray hues, and each value is the better of black and white. The WCAG math and
 * the Radix lookup come from their source modules, as `scripts/validate-contrast.mjs` imports them: `line-utils`
 * depends on `line-schemas`, so this package cannot declare it.
 *
 * @module __tests__/contrast-table
 */

import { describe, expect, test } from 'bun:test';
import * as radixColors from '@radix-ui/colors';
import { radixSource } from '../../../scripts/radix-sources.mjs';
import { contrastRatio, TEXT_THRESHOLD } from '../../line-utils/src/contrast.ts';
import {
  BLACK_CONTRAST_HUES,
  type ContrastColor,
  contrastFor,
  PER_HUE_CONTRAST,
  PER_HUE_CONTRAST_DARK,
  PerHueContrastSchema,
} from '../src/contrast-table.ts';
import { GRAY_HUES, HUES, type Hue } from '../src/hues.ts';

const MODES = ['light', 'dark'] as const;
type Mode = (typeof MODES)[number];

const WHITE_HUES = ['indigo', 'iris', 'plum', 'purple', 'violet'] as const;

/** The base sRGB step 9 of `hue` in `mode`, read as the validator reads it (AM-011, AM-052). */
function step9(hue: Hue, mode: Mode): string {
  const src: string = radixSource(hue);
  const scales = radixColors as unknown as Record<string, Record<string, string>>;
  const value = scales[mode === 'dark' ? `${src}Dark` : src]?.[`${src}9`];
  if (value === undefined) throw new Error(`no Radix step 9 for ${hue}/${mode}`);
  return value;
}

describe('BLACK_CONTRAST_HUES', () => {
  test('lists the 20 black-label saturated hues', () => {
    expect([...BLACK_CONTRAST_HUES]).toEqual([
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
    ]);
  });

  test('holds no gray hue and no white-label hue', () => {
    const black = new Set<string>(BLACK_CONTRAST_HUES);
    for (const hue of [...GRAY_HUES, ...WHITE_HUES]) expect(black.has(hue)).toBe(false);
    expect(BLACK_CONTRAST_HUES.length + GRAY_HUES.length + WHITE_HUES.length).toBe(HUES.length);
  });
});

describe('PER_HUE_CONTRAST and PER_HUE_CONTRAST_DARK', () => {
  test('each table covers all 31 hues and parses with PerHueContrastSchema', () => {
    for (const table of [PER_HUE_CONTRAST, PER_HUE_CONTRAST_DARK]) {
      expect(Object.keys(table).sort()).toEqual([...HUES].sort());
      expect(PerHueContrastSchema.parse(table)).toEqual(table);
    }
  });

  test('light mode: black for the 20 black hues and the 6 grays, white for the other 5', () => {
    for (const hue of BLACK_CONTRAST_HUES) expect(PER_HUE_CONTRAST[hue]).toBe('#000');
    for (const hue of GRAY_HUES) expect(PER_HUE_CONTRAST[hue]).toBe('#000');
    for (const hue of WHITE_HUES) expect(PER_HUE_CONTRAST[hue]).toBe('#fff');
  });

  test('the two tables differ only for the 6 gray hues, which take white in dark mode', () => {
    const differing = HUES.filter((hue) => PER_HUE_CONTRAST[hue] !== PER_HUE_CONTRAST_DARK[hue]);
    expect(differing.sort()).toEqual([...GRAY_HUES].sort());
    for (const hue of GRAY_HUES) expect(PER_HUE_CONTRAST_DARK[hue]).toBe('#fff');
  });
});

describe('contrastFor', () => {
  test('reads PER_HUE_CONTRAST in light mode and PER_HUE_CONTRAST_DARK in dark mode', () => {
    for (const hue of HUES) {
      expect(contrastFor(hue, 'light')).toBe(PER_HUE_CONTRAST[hue]);
      expect(contrastFor(hue, 'dark')).toBe(PER_HUE_CONTRAST_DARK[hue]);
    }
    expect(contrastFor('neutral', 'light')).toBe('#000');
    expect(contrastFor('neutral', 'dark')).toBe('#fff');
  });

  for (const hue of HUES) {
    for (const mode of MODES) {
      test(`${hue}/${mode}: the on-color reaches 4.5:1 on step 9 and is the better of black and white`, () => {
        const solid = step9(hue, mode);
        const color: ContrastColor = contrastFor(hue, mode);
        const other: ContrastColor = color === '#000' ? '#fff' : '#000';
        expect(contrastRatio(solid, color)).toBeGreaterThanOrEqual(TEXT_THRESHOLD);
        expect(contrastRatio(solid, color)).toBeGreaterThan(contrastRatio(solid, other));
      });
    }
  }
});
