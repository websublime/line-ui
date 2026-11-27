/**
 * C5 contrast validator tests (ledger 01-Z30, Phase 00 spec §6.C.3 C5, AM-092).
 *
 * `collectResults(contrast)` measures every hue × {light, dark} step-9 pair against `contrast(hue, mode)`, which
 * defaults to line-schemas' `contrastFor`, and flags each pair below `TEXT_THRESHOLD`, 4.5:1, with no allowlist.
 * The script itself exits 0 on the committed tables and names the lowest pair.
 *
 * @module scripts/__tests__/validate-contrast
 */

import { describe, expect, test } from 'bun:test';
import { resolve } from 'node:path';
import { PER_HUE_CONTRAST, PER_HUE_CONTRAST_DARK } from '../../packages/line-schemas/src/contrast-table.ts';
import { TEXT_THRESHOLD } from '../../packages/line-utils/src/contrast.ts';
import { collectResults, describePair, solidStep } from '../validate-contrast.mjs';

const SCRIPT = resolve(import.meta.dirname, '../validate-contrast.mjs');

describe('collectResults with contrastFor', () => {
  const { pairs, failures, worst } = collectResults();

  test('measures 62 pairs, 31 hues by two modes, and none is below 4.5:1', () => {
    expect(pairs).toHaveLength(62);
    expect(failures).toEqual([]);
    for (const pair of pairs) expect(pair.ratio).toBeGreaterThanOrEqual(TEXT_THRESHOLD);
  });

  test('reads the light table in light mode and the dark table in dark mode', () => {
    for (const pair of pairs) {
      const table = pair.mode === 'dark' ? PER_HUE_CONTRAST_DARK : PER_HUE_CONTRAST;
      expect(pair.token).toBe(table[pair.hue as keyof typeof table]);
    }
  });

  test('the lowest pair is plum on #fff at 4.75:1', () => {
    expect(worst.hue).toBe('plum');
    expect(worst.token).toBe('#fff');
    expect(worst.ratio.toFixed(2)).toBe('4.75');
  });

  test('orange takes #000 at 7.07:1 in both modes, with no allowlist', () => {
    for (const pair of pairs.filter((p) => p.hue === 'orange')) {
      expect(pair.token).toBe('#000');
      expect(pair.ratio.toFixed(2)).toBe('7.07');
    }
  });
});

describe('collectResults with a failing table', () => {
  test('the former white orange fails in both modes, named with its ratio', () => {
    const { failures } = collectResults((hue, mode) =>
      hue === 'orange' ? '#fff' : (mode === 'dark' ? PER_HUE_CONTRAST_DARK : PER_HUE_CONTRAST)[hue as 'orange'],
    );
    expect(failures.map(describePair)).toEqual([
      `orange/light: step-9 ${solidStep('orange', 'light')} vs #fff = 2.97:1`,
      `orange/dark: step-9 ${solidStep('orange', 'dark')} vs #fff = 2.97:1`,
    ]);
  });

  test('a gray with black in dark mode fails only in dark mode', () => {
    const { failures } = collectResults((hue, mode) =>
      hue === 'neutral' ? '#000' : (mode === 'dark' ? PER_HUE_CONTRAST_DARK : PER_HUE_CONTRAST)[hue as 'neutral'],
    );
    expect(failures.map((pair) => `${pair.hue}/${pair.mode}`)).toEqual(['neutral/dark']);
  });
});

describe('solidStep', () => {
  test('reads the Radix gray objects for neutral and the {H}9 key on the Dark object', () => {
    expect(solidStep('neutral', 'light')).toBe('#8d8d8d');
    expect(solidStep('neutral', 'dark')).toBe('#6e6e6e');
    expect(solidStep('orange', 'dark')).toBe('#f76b15');
  });
});

describe('script', () => {
  test('exits 0 on the committed tables and names the lowest pair', () => {
    const run = Bun.spawnSync([process.execPath, 'run', SCRIPT], { stdout: 'pipe', stderr: 'pipe' });
    const stdout = run.stdout.toString();
    expect(run.exitCode).toBe(0);
    expect(run.stderr.toString()).toBe('');
    expect(stdout).toContain('62 step-9/contrast pairs');
    expect(stdout).toContain('≥ 4.5:1');
    expect(stdout).toContain('lowest plum/light: step-9 #ab4aba vs #fff = 4.75:1');
  });
});
