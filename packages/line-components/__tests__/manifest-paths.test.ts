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
  declarations?: {
    tagName?: string;
    members?: { name: string; privacy?: string; inheritedFrom?: { name: string } }[];
    events?: { name: string }[];
    slots?: { name: string }[];
    cssParts?: { name: string }[];
    cssProperties?: { name: string }[];
  }[];
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

  test('line-icon resolves to src/icon/icon.ts', () => {
    const icon = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-icon'),
    );
    expect(icon?.path).toBe('src/icon/icon.ts');
    expect(paths.has('src/icon/icon.ts')).toBe(true);
  });

  test('line-icon-button resolves to src/icon-button/icon-button.ts', () => {
    const iconButton = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-icon-button'),
    );
    expect(iconButton?.path).toBe('src/icon-button/icon-button.ts');
    expect(paths.has('src/icon-button/icon-button.ts')).toBe(true);
  });

  test('line-button-group resolves to src/button-group/button-group.ts', () => {
    const buttonGroup = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-button-group'),
    );
    expect(buttonGroup?.path).toBe('src/button-group/button-group.ts');
    expect(paths.has('src/button-group/button-group.ts')).toBe(true);
  });

  test('line-alert resolves to src/alert/alert.ts', () => {
    const alert = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-alert'),
    );
    expect(alert?.path).toBe('src/alert/alert.ts');
    expect(paths.has('src/alert/alert.ts')).toBe(true);
  });

  test('line-alert lists no role member: its internals role is no element field', () => {
    const declaration = modules
      .flatMap((module) => module.declarations ?? [])
      .find((each) => each.tagName === 'line-alert');
    expect(declaration?.members?.map((member) => member.name)).not.toContain('role');
  });

  test('line-button-group lists no role member: its internals role is no element field', () => {
    const declaration = modules
      .flatMap((module) => module.declarations ?? [])
      .find((each) => each.tagName === 'line-button-group');
    const names = declaration?.members?.map((member) => member.name);
    expect(names).not.toContain('role');
    expect(names).not.toContain('ariaOrientation');
  });

  test('line-chip resolves to src/chip/chip.ts', () => {
    const chip = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-chip'),
    );
    expect(chip?.path).toBe('src/chip/chip.ts');
    expect(paths.has('src/chip/chip.ts')).toBe(true);
  });

  test('line-chip declares its five public fields, the line-change event and no focus-visible field', () => {
    const declaration = modules
      .flatMap((module) => module.declarations ?? [])
      .find((each) => each.tagName === 'line-chip');
    const members = declaration?.members ?? [];
    const fields = members
      .filter((member) => member.privacy === 'public' && member.inheritedFrom === undefined)
      .map((member) => member.name);
    expect(fields).toEqual(['variant', 'pressed', 'disabled', 'ariaLabel', 'ariaDescription']);
    expect(members.map((member) => member.name)).not.toContain('focusVisible');
    expect(declaration?.events?.map((event) => event.name)).toEqual(['line-change']);
  });

  test('line-badge resolves to src/badge/badge.ts', () => {
    const badge = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-badge'),
    );
    expect(badge?.path).toBe('src/badge/badge.ts');
    expect(paths.has('src/badge/badge.ts')).toBe(true);
  });

  test('line-badge declares variant as its only public field, no internals member and no event', () => {
    const declaration = modules
      .flatMap((module) => module.declarations ?? [])
      .find((each) => each.tagName === 'line-badge');
    const members = declaration?.members ?? [];
    const fields = members
      .filter((member) => member.privacy === 'public' && member.inheritedFrom === undefined)
      .map((member) => member.name);
    expect(fields).toEqual(['variant']);
    const names = members.map((member) => member.name);
    expect(names).not.toContain('role');
    expect(names).not.toContain('ariaHidden');
    expect(declaration?.events ?? []).toEqual([]);
    expect(declaration?.slots?.map((slot) => slot.name)).toEqual(['']);
    expect(declaration?.cssParts?.map((part) => part.name)).toEqual(['root']);
    expect(declaration?.cssProperties).toHaveLength(9);
  });

  test('line-avatar resolves to src/avatar/avatar.ts', () => {
    const avatar = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-avatar'),
    );
    expect(avatar?.path).toBe('src/avatar/avatar.ts');
    expect(paths.has('src/avatar/avatar.ts')).toBe(true);
  });

  test('line-avatar declares src and name as its only public fields, three slots, three parts, eleven tokens and no event', () => {
    const declaration = modules
      .flatMap((module) => module.declarations ?? [])
      .find((each) => each.tagName === 'line-avatar');
    const members = declaration?.members ?? [];
    const fields = members
      .filter((member) => member.privacy === 'public' && member.inheritedFrom === undefined)
      .map((member) => member.name);
    expect(fields).toEqual(['src', 'name']);
    expect(declaration?.events ?? []).toEqual([]);
    expect(declaration?.slots?.map((slot) => slot.name)).toEqual(['', 'fallback', 'status']);
    expect(declaration?.cssParts?.map((part) => part.name)).toEqual(['root', 'image', 'fallback']);
    expect(declaration?.cssProperties).toHaveLength(11);
  });

  test('line-avatar-group resolves to src/avatar-group/avatar-group.ts', () => {
    const group = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-avatar-group'),
    );
    expect(group?.path).toBe('src/avatar-group/avatar-group.ts');
    expect(paths.has('src/avatar-group/avatar-group.ts')).toBe(true);
  });

  test('line-avatar-group declares max, size, spacing and overflowLabel, one slot, three parts, thirteen tokens and no event', () => {
    const declaration = modules
      .flatMap((module) => module.declarations ?? [])
      .find((each) => each.tagName === 'line-avatar-group');
    const members = declaration?.members ?? [];
    const fields = members
      .filter((member) => member.privacy === 'public' && member.inheritedFrom === undefined)
      .map((member) => member.name);
    expect(fields).toEqual(['max', 'size', 'spacing', 'overflowLabel']);
    expect(declaration?.events ?? []).toEqual([]);
    expect(declaration?.slots?.map((slot) => slot.name)).toEqual(['']);
    expect(declaration?.cssParts?.map((part) => part.name)).toEqual(['root', 'overflow', 'content']);
    expect(declaration?.cssProperties).toHaveLength(13);
  });

  test('line-visually-hidden resolves to src/visually-hidden/visually-hidden.ts', () => {
    const hidden = modules.find((module) =>
      module.declarations?.some((declaration) => declaration.tagName === 'line-visually-hidden'),
    );
    expect(hidden?.path).toBe('src/visually-hidden/visually-hidden.ts');
    expect(paths.has('src/visually-hidden/visually-hidden.ts')).toBe(true);
  });

  test('line-visually-hidden declares no public field, no event, one default slot, no part and no token', () => {
    const declaration = modules
      .flatMap((module) => module.declarations ?? [])
      .find((each) => each.tagName === 'line-visually-hidden');
    const members = declaration?.members ?? [];
    const fields = members
      .filter((member) => member.privacy === 'public' && member.inheritedFrom === undefined)
      .map((member) => member.name);
    expect(fields).toEqual([]);
    expect(declaration?.events ?? []).toEqual([]);
    expect(declaration?.slots?.map((slot) => slot.name)).toEqual(['']);
    expect(declaration?.cssParts ?? []).toEqual([]);
    expect(declaration?.cssProperties ?? []).toEqual([]);
  });
});
