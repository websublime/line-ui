/**
 * Packed-tarball consumer — shared helper for the §7.5 checks (Phase 1 spec §7.5, §10 SD2, SD4; ledger 01-P5).
 *
 * Packs workspace packages with `stageAndPack` from `scripts/verify-pack.mjs`, the publish path's own pack step,
 * and extracts each tarball into `<temp>/node_modules/<name>`, so a check reads the files npm ships (§7.5 intro,
 * SD4). The temp root lives under `<repo>/node_modules/.cache/line-p5/`, so esbuild's walk up the parent
 * `node_modules` folders reaches the root `node_modules` and never a shared system temp folder. Third-party
 * packages (Lit, Zag) resolve from the root `node_modules`. No `@websublime/*` package lives there, so every
 * `@websublime/*` import resolves to an extracted tarball (PRD §5.2, ledger 01-Z5). Needs `bun run build` first,
 * as the CI unit tier has.
 *
 * `freshRealm()` is a new happy-dom `Window` with its own VM context. A module evaluated there gets its own
 * globals and its own `customElements` registry, apart from the global happy-dom of `bun-test-preload.ts`.
 * happy-dom shares its element classes (`HTMLElement` and the rest) between windows, so a check never writes to
 * their prototypes. Such a write would reach every other test in the process.
 *
 * @module __tests__/packed/consumer
 */

import { existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { type BuildOptions, build, type Message, type Metafile } from 'esbuild';

// The repo-root pack script is not a package, and §7.5 names its pack step.

import { ROOT, readTarball, readWorkspacePackages, stageAndPack } from '../../../../scripts/verify-pack.mjs';

/** The `package.json` fields the checks read. */
export interface PackedManifest {
  name: string;
  version: string;
  exports?: Record<string, unknown>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface PackedPackage {
  /** The extracted tarball root, `<temp>/node_modules/<name>`. */
  dir: string;
  manifest: PackedManifest;
}

export interface Consumer {
  /** The temp project root; esbuild resolves from here. */
  root: string;
  packages: Map<string, PackedPackage>;
  cleanup(): void;
}

/** Packs each named workspace package and extracts it into one temp `node_modules` inside the repo. */
export async function installPacked(names: readonly string[]): Promise<Consumer> {
  const cache = join(ROOT, 'node_modules', '.cache', 'line-p5');
  mkdirSync(cache, { recursive: true });
  const root = mkdtempSync(join(cache, 'consumer-'));
  const cleanup = () => rmSync(root, { recursive: true, force: true });
  try {
    const workspace = readWorkspacePackages();
    const packages = new Map<string, PackedPackage>();
    for (const name of names) {
      const pkg = workspace.find((p: { name: string }) => p.name === name);
      if (!pkg) throw new Error(`${name} is not a packages/* workspace package`);
      if (!existsSync(join(pkg.dir, 'dist'))) throw new Error(`${name} has no dist/; run \`bun run build\` first.`);
      const { tarball, cleanup: dropTarball } = stageAndPack(pkg);
      try {
        const { manifest } = await readTarball(tarball);
        const scratch = mkdtempSync(join(root, 'extract-'));
        await new Bun.Archive(await Bun.file(tarball).bytes()).extract(scratch);
        const dir = join(root, 'node_modules', name);
        mkdirSync(dirname(dir), { recursive: true });
        renameSync(join(scratch, 'package'), dir);
        rmSync(scratch, { recursive: true, force: true });
        packages.set(name, { dir, manifest });
      } finally {
        dropTarball();
      }
    }
    return { root, packages, cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
}

export interface Bundle {
  text: string;
  bytes: Uint8Array;
  warnings: Message[];
  metafile: Metafile | undefined;
}

/**
 * esbuild bundle of `contents` as an entry module inside the consumer. Metafile input paths are relative to
 * `consumer.root`, so a tarball module reads `node_modules/<name>/…`.
 */
export async function bundle(consumer: Consumer, contents: string, options: BuildOptions = {}): Promise<Bundle> {
  const result = await build({
    stdin: { contents, resolveDir: consumer.root, loader: 'js', sourcefile: 'consumer.js' },
    absWorkingDir: consumer.root,
    bundle: true,
    platform: 'browser',
    nodePaths: [join(ROOT, 'node_modules')],
    write: false,
    logLevel: 'silent',
    ...options,
  });
  const output = result.outputFiles?.[0];
  if (!output) throw new Error('esbuild wrote no output file');
  return { text: output.text, bytes: output.contents, warnings: result.warnings, metafile: result.metafile };
}

/** The import target of an `exports` entry: the string itself or its `import` condition. */
export function importTarget(entry: unknown): string | undefined {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') {
    const target = Reflect.get(entry, 'import');
    return typeof target === 'string' ? target : undefined;
  }
  return undefined;
}

/** Component subpaths of a packed manifest: every `exports` key but `"."` whose import target is a `.js` file. */
export function componentSubpaths(manifest: PackedManifest): string[] {
  return Object.entries(manifest.exports ?? {})
    .filter(([key, entry]) => key !== '.' && importTarget(entry)?.endsWith('.js'))
    .map(([key]) => key)
    .sort();
}

/** `@websublime/line-components` + `./button` → `@websublime/line-components/button`; `"."` → the bare name. */
export function specifierOf(name: string, subpath: string): string {
  return subpath === '.' ? name : `${name}/${subpath.slice(2)}`;
}

/** Every `.js` file under `dir`, as paths relative to it. */
export function jsFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.js'))
    .sort();
}

/** The happy-dom `Window` surface the checks use. */
export interface Realm {
  eval(code: string): unknown;
  customElements: CustomElementRegistry;
  document: Document;
  happyDOM: { close(): Promise<void> };
}

// `happy-dom` is the dependency of the root devDependency `@happy-dom/global-registrator` that
// `bun-test-preload.ts` uses. Bun's isolated install links no bare `happy-dom` this file could import
// statically, so the path is resolved at runtime from the registrator, the one place the install links it.
const happyDom = Bun.resolveSync('happy-dom', dirname(Bun.resolveSync('@happy-dom/global-registrator', ROOT)));
const { Window } = (await import(happyDom)) as { Window: new () => Realm };

/** A new happy-dom `Window` with its own VM context. Close it with `realm.happyDOM.close()`. */
export function freshRealm(): Realm {
  return new Window();
}

/**
 * Runs `code` (an IIFE bundle) in a fresh realm whose `customElements.define` records each name, and returns
 * the realm with the names in definition order. Close the realm afterwards; a throw closes it here.
 */
export function runRecordingDefines(code: string, setup: (realm: Realm) => void = () => {}) {
  const realm = freshRealm();
  const defined: string[] = [];
  const registry = realm.customElements;
  const define = registry.define.bind(registry);
  registry.define = (name, elementClass, options) => {
    defined.push(name);
    define(name, elementClass, options);
  };
  try {
    setup(realm);
    realm.eval(code);
  } catch (err) {
    void realm.happyDOM.close();
    throw err;
  }
  return { realm, defined };
}
