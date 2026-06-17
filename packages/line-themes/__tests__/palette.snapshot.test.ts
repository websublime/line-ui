/**
 * Palette CSS snapshot tests (C9, spec §6.C.7).
 *
 * For each of the 31 hues, the generated `@websublime/line-colors`
 * `dist/{hue}.css` palette file must match a committed snapshot. The special
 * palette (`special.css`) is snapshotted as well.
 *
 * Snapshots use Bun test's built-in serializer writing to `__snapshots__/`.
 * Baselines auto-create on first run and are committed; subsequent runs detect
 * any unintended drift in the deterministic PostCSS output.
 *
 * Inputs are the BUILT dist files (gitignored, ephemeral) — the upstream
 * packages must be built before this suite runs (see the repo root `test`
 * script, which builds line-* before invoking `bun test`).
 *
 * @module __tests__/palette.snapshot
 */

import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HUES } from '@websublime/line-schemas';

const COLORS_DIST = resolve(import.meta.dirname, '../../line-colors/dist');

function readPalette(file: string): string {
  const path = resolve(COLORS_DIST, file);
  if (!existsSync(path)) {
    throw new Error(
      `line-colors dist file missing: ${path}. Run the upstream build first ` +
        `(bun --filter '@websublime/line-colors' build).`,
    );
  }
  return readFileSync(path, 'utf-8');
}

describe('palette CSS snapshots', () => {
  test('line-colors dist/ exists (upstream build must run first)', () => {
    expect(existsSync(COLORS_DIST)).toBe(true);
  });

  for (const hue of HUES) {
    test(`dist/${hue}.css matches snapshot`, () => {
      expect(readPalette(`${hue}.css`)).toMatchSnapshot();
    });
  }

  test('dist/special.css matches snapshot', () => {
    expect(readPalette('special.css')).toMatchSnapshot();
  });
});
