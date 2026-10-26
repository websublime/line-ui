/**
 * Role-mapping CSS snapshot tests (C9, spec §6.C.7).
 *
 * For each accent role map (`@websublime/line-themes/accent/{hue}`, 31 files)
 * and each gray role map (`@websublime/line-themes/gray/{hue}`, 6 files), the
 * built file must match a committed snapshot. Each file resolves through the
 * package's own `exports`, so a broken entry fails the suite (PRD §5.2 rule 2).
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
import { fileURLToPath } from 'node:url';
import { ACCENT_HUES, GRAY_HUES } from '@websublime/line-schemas';

/**
 * Resolves `specifier` and returns the file path, or `undefined` when the file
 * is missing. Bun throws on a missing wildcard target, so a throw counts as missing.
 */
function resolveBuilt(specifier: string): string | undefined {
  try {
    const path = fileURLToPath(import.meta.resolve(specifier));
    return existsSync(path) ? path : undefined;
  } catch {
    return undefined;
  }
}

function readRoleMap(entry: string): string {
  const specifier = `@websublime/line-themes/${entry}`;
  const path = resolveBuilt(specifier);
  if (!path) {
    throw new Error(
      `line-themes dist file missing: ${specifier}. Run the upstream build first ` +
        `(bun --filter '@websublime/line-themes' build).`,
    );
  }
  return readFileSync(path, 'utf-8');
}

describe('role-mapping CSS snapshots', () => {
  test('line-themes dist/ exists (upstream build must run first)', () => {
    expect(resolveBuilt('@websublime/line-themes')).toBeDefined();
  });

  describe('accent role maps (31)', () => {
    for (const hue of ACCENT_HUES) {
      test(`dist/accent/${hue}.css matches snapshot`, () => {
        expect(readRoleMap(`accent/${hue}`)).toMatchSnapshot();
      });
    }
  });

  describe('gray role maps (6)', () => {
    for (const hue of GRAY_HUES) {
      test(`dist/gray/${hue}.css matches snapshot`, () => {
        expect(readRoleMap(`gray/${hue}`)).toMatchSnapshot();
      });
    }
  });
});
