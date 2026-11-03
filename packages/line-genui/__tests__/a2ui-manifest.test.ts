/**
 * The `<line-a2ui-surface>` Custom Elements Manifest in the packed `line-genui` tarball (Phase 1 spec §6.G.4
 * Acceptance, §7.3; §10 SD94; §12 AM-032, AM-040; ledger 01-G4).
 *
 * - The tarball `verify-pack` stages holds `custom-elements.json`, and `verify-pack` fails when it is missing.
 * - The module `path` of the `<line-a2ui-surface>` declaration names a file in the tarball. Inherited `line-core`
 *   declarations keep `../line-core/…` paths, which the R4 §2.7 filter (declarations with a `tagName`) leaves out.
 * - The declaration carries the §6.G.4 JSDoc: attributes, properties and both `@fires` events.
 *
 * Needs `bun run build` first, as the CI unit tier has.
 *
 * @module __tests__/a2ui-manifest
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
// @ts-expect-error: the repository script is plain JavaScript without declarations.
import {
  checkTarball,
  discoverPublishable,
  readTarball,
  stageAndPack,
  workspaceVersions,
} from '../../../scripts/verify-pack.mjs';

interface Declaration {
  name: string;
  tagName?: string;
  attributes?: { name: string; default?: string }[];
  members?: { name: string; kind: string }[];
  events?: { name: string }[];
}

interface Manifest {
  modules: { path: string; declarations?: Declaration[] }[];
}

interface Tarball {
  paths: string[];
  manifest: Record<string, unknown>;
}

let tarball: Tarball;
let customElements: Manifest;
let cleanup: () => void = () => {};

beforeAll(async () => {
  const pkg = (discoverPublishable() as { name: string }[]).find((entry) => entry.name === '@websublime/line-genui');
  const packed = stageAndPack(pkg) as { tarball: string; cleanup: () => void };
  cleanup = packed.cleanup;
  tarball = (await readTarball(packed.tarball)) as Tarball;
  const files = await new Bun.Archive(await Bun.file(packed.tarball).bytes()).files();
  const manifest = files.get('package/custom-elements.json');
  if (!manifest) throw new Error('the tarball holds no custom-elements.json');
  customElements = JSON.parse(await manifest.text()) as Manifest;
}, 120_000);

afterAll(() => cleanup());

describe('custom-elements.json in the packed line-genui tarball (§10 SD94)', () => {
  test('verify-pack passes on the tarball, and fails when custom-elements.json is missing', () => {
    const versions = workspaceVersions();
    expect(checkTarball(tarball, versions)).toEqual([]);
    const without = { ...tarball, paths: tarball.paths.filter((path) => path !== 'custom-elements.json') };
    expect(checkTarball(without, versions)).toEqual([
      '(a) export target ./custom-elements.json missing',
      '(a) export target ./custom-elements.json missing',
    ]);
  });

  test('the module path of the <line-a2ui-surface> declaration names a file in the tarball', () => {
    const modules = customElements.modules.filter((module) =>
      module.declarations?.some((declaration) => declaration.tagName !== undefined),
    );
    expect(modules.map((module) => module.path)).toEqual(['src/a2ui/surface.ts']);
    for (const module of modules) expect(tarball.paths).toContain(module.path);
  });

  test('the declaration carries the attributes, properties and events of §6.G.4', () => {
    const surface = customElements.modules
      .flatMap((module) => module.declarations ?? [])
      .find((declaration) => declaration.tagName === 'line-a2ui-surface');
    expect(surface?.attributes?.map((attribute) => attribute.name).sort()).toEqual(
      ['live-error-text', 'live-update-text', 'max-data-model-size', 'max-depth', 'max-nodes', 'surface-id'].sort(),
    );
    const defaults = Object.fromEntries(
      (surface?.attributes ?? []).map((attribute) => [attribute.name, attribute.default]),
    );
    expect([
      defaults['max-nodes'],
      defaults['max-depth'],
      defaults['max-data-model-size'],
      defaults['live-update-text'],
      defaults['live-error-text'],
    ]).toEqual(['1000', '32', '1048576', 'Content updated.', 'Some content could not be shown.']);
    const fields = new Set(surface?.members?.filter((member) => member.kind === 'field').map((member) => member.name));
    for (const name of [
      'iconMap',
      'liveUpdateText',
      'liveErrorText',
      'maxNodes',
      'maxDepth',
      'maxDataModelSize',
      'urlPolicy',
      'markdownRenderer',
      'session',
      'surfaceId',
    ]) {
      expect(fields.has(name)).toBe(true);
    }
    expect(surface?.events?.map((event) => event.name).sort()).toEqual(['line-a2ui-action', 'line-a2ui-error']);
  });
});
