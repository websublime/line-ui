/**
 * Shipped manifest module paths (Phase 1 spec §6.C.6 stream acceptance, §7.3; §12 AM-040).
 *
 * Packs `line-components` with `bun pm pack` and reads `custom-elements.json`
 * from the tarball. Every module that declares a custom element with a
 * `tagName`, or exports a `custom-element-definition`, must name a file inside
 * the tarball (the R4 §2.7 filter). Inherited `line-core` declarations such as
 * `LineElement` keep `../line-core/…` paths, which this filter leaves out.
 * Needs `bun run build` first, as the CI unit tier has.
 *
 * @module __tests__/manifest-paths
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

interface ManifestModule {
  path: string;
  declarations?: { tagName?: string }[];
  exports?: { kind: string }[];
}

const PACKAGE_DIR = resolve(import.meta.dir, '..');

let outDir = '';
let paths = new Set<string>();
let modules: ManifestModule[] = [];

beforeAll(async () => {
  outDir = mkdtempSync(join(tmpdir(), 'line-components-pack-'));
  const proc = Bun.spawnSync(['bun', 'pm', 'pack', '--quiet', '--destination', outDir], {
    cwd: PACKAGE_DIR,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (proc.exitCode !== 0) throw new Error(`bun pm pack failed: ${proc.stderr.toString().trim()}`);
  const tarball = proc.stdout.toString().trim().split('\n').at(-1)?.trim() ?? '';
  const files = await new Bun.Archive(await Bun.file(tarball).bytes()).files();
  paths = new Set([...files.keys()].map((key) => key.replace(/^package\//, '')));
  const manifest = files.get('package/custom-elements.json');
  if (!manifest) throw new Error('the tarball holds no custom-elements.json');
  modules = (JSON.parse(await manifest.text()) as { modules: ManifestModule[] }).modules;
});

afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

/** Modules that define an element: a declaration with a `tagName` or a `custom-element-definition` export. */
function elementModules(): ManifestModule[] {
  return modules.filter(
    (module) =>
      module.declarations?.some((declaration) => declaration.tagName !== undefined) ||
      module.exports?.some((entry) => entry.kind === 'custom-element-definition'),
  );
}

describe('custom-elements.json in the packed tarball', () => {
  test('every module that defines an element names a file in the tarball', () => {
    const elements = elementModules();
    expect(elements.length).toBeGreaterThan(0);
    expect(elements.map((module) => module.path).filter((path) => !paths.has(path))).toEqual([]);
  });

  test('line-button resolves to src/button/button.ts', () => {
    const button = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-button'),
    );
    expect(button?.path).toBe('src/button/button.ts');
    expect(paths.has('src/button/button.ts')).toBe(true);
  });

  test('line-stack resolves to src/stack/stack.ts', () => {
    const stack = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-stack'),
    );
    expect(stack?.path).toBe('src/stack/stack.ts');
    expect(paths.has('src/stack/stack.ts')).toBe(true);
  });

  test('line-separator resolves to src/separator/separator.ts', () => {
    const separator = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-separator'),
    );
    expect(separator?.path).toBe('src/separator/separator.ts');
    expect(paths.has('src/separator/separator.ts')).toBe(true);
  });
});
