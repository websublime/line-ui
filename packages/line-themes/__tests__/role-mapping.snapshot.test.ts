/**
 * Role-mapping CSS snapshot tests (C9, spec §6.C.7).
 *
 * For each accent role map (`dist/accent/{hue}.css`, 31 files) and each gray
 * role map (`dist/gray/{hue}.css`, 6 files), the generated
 * `@websublime/line-themes` file must match a committed snapshot.
 *
 * These per-file dist outputs are produced by the line-themes build's
 * `postcss src/accent/*.css -d dist/accent` / `src/gray/*.css -d dist/gray`
 * steps (landed in line-ui-7qm.3.14) and are also the AM-006 dist↔exports-map
 * conformity targets that C9 inherited from B4.
 *
 * dist is gitignored/ephemeral — the line-themes package must be built before
 * this suite runs (handled by the repo root `test` script).
 *
 * @module __tests__/role-mapping.snapshot
 */

import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ACCENT_HUES, GRAY_HUES } from '@websublime/line-schemas';

const THEMES_DIST = resolve(import.meta.dirname, '../dist');

function readRoleMap(relative: string): string {
  const path = resolve(THEMES_DIST, relative);
  if (!existsSync(path)) {
    throw new Error(
      `line-themes dist file missing: ${path}. Run the upstream build first ` +
        `(bun --filter '@websublime/line-themes' build).`,
    );
  }
  return readFileSync(path, 'utf-8');
}

describe('role-mapping CSS snapshots', () => {
  test('line-themes dist/ exists (upstream build must run first)', () => {
    expect(existsSync(THEMES_DIST)).toBe(true);
  });

  describe('accent role maps (31)', () => {
    for (const hue of ACCENT_HUES) {
      test(`dist/accent/${hue}.css matches snapshot`, () => {
        expect(readRoleMap(`accent/${hue}.css`)).toMatchSnapshot();
      });
    }
  });

  describe('gray role maps (6)', () => {
    for (const hue of GRAY_HUES) {
      test(`dist/gray/${hue}.css matches snapshot`, () => {
        expect(readRoleMap(`gray/${hue}.css`)).toMatchSnapshot();
      });
    }
  });
});
