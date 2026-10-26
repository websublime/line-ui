/**
 * Palette CSS snapshot tests (C9, spec §6.C.7).
 *
 * For each of the 31 hues, the built `@websublime/line-colors/{hue}` palette
 * file must match a committed snapshot. The special palette
 * (`@websublime/line-colors/special`) is snapshotted as well. Each file
 * resolves through the `line-colors` exports (PRD §5.2 rule 1).
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
import { fileURLToPath } from 'node:url';
import { HUES } from '@websublime/line-schemas';

/**
 * Resolves `specifier` and returns the file path, or `undefined` when the file
 * is missing. Bun throws on a missing export target, so a throw counts as missing.
 */
function resolveBuilt(specifier: string): string | undefined {
  try {
    const path = fileURLToPath(import.meta.resolve(specifier));
    return existsSync(path) ? path : undefined;
  } catch {
    return undefined;
  }
}

function readPalette(entry: string): string {
  const specifier = `@websublime/line-colors/${entry}`;
  const path = resolveBuilt(specifier);
  if (!path) {
    throw new Error(
      `line-colors dist file missing: ${specifier}. Run the upstream build first ` +
        `(bun --filter '@websublime/line-colors' build).`,
    );
  }
  return readFileSync(path, 'utf-8');
}

describe('palette CSS snapshots', () => {
  test('line-colors dist/ exists (upstream build must run first)', () => {
    expect(resolveBuilt('@websublime/line-colors')).toBeDefined();
  });

  for (const hue of HUES) {
    test(`dist/${hue}.css matches snapshot`, () => {
      expect(readPalette(hue)).toMatchSnapshot();
    });
  }

  test('dist/special.css matches snapshot', () => {
    expect(readPalette('special')).toMatchSnapshot();
  });
});
