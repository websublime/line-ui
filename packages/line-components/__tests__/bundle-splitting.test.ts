/**
 * Bundle splitting and isolation checks on the packed tarballs (Phase 1 spec §6.P.5, §7.5, §7.6; §10 SD2, SD4,
 * SD20, SD24; ledger 01-P5).
 *
 * `line-core`, `line-components` and `line-genui` are packed with `stageAndPack` and extracted into one temp
 * `node_modules` (`./packed/consumer.ts`). The `line-genui` registration row of §7.5 is G4's (§6.G.4).
 *
 * - Registration harness: each subpath runs in a fresh happy-dom realm with `customElements.define` wrapped; it
 *   must define exactly its `EXPECTED_TAGS` row, and the root `"."` nothing (SD24: this replaces the Phase 00
 *   zero-export smoke step).
 * - Isolation scan: an esbuild `--metafile` bundle per subpath holds no other component's module or tag. Modules
 *   under `src/shared/`, emitted to `dist/shared/**` (§6.P.9), may sit in any bundle.
 * - esbuild consumer bundle: one bare-import bundle of every subpath emits no `ignored-bare-import` warning.
 * - `dist/` of `line-components` imports `@websublime/line-core` and `@websublime/line-core/styles` bare.
 * - Undeclared bare specifiers: every bare import in `dist/**\/*.js` of the three packages names a declared
 *   `dependencies`/`peerDependencies` entry, or the package's own name or `name/…` (a self-reference through its
 *   `exports`, AM-050). A Node built-in such as `fs` or `node:fs` fails unless the manifest declares a package of
 *   that name, as with an `events` polyfill. Its failure line says "(Node built-in)".
 * - `line-core/styles` per-sheet shaking: a §7.6 esbuild bundle of `commonReset` holds the built
 *   `reset.common.css` string and none of the other ten (SD20); its gzip size is logged against R9's 1161 B.
 *
 * Needs `bun run build` first, as the CI unit tier has.
 *
 * @module __tests__/bundle-splitting
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { dirname, join } from 'node:path';
import {
  bundle,
  type Consumer,
  componentSubpaths,
  freshRealm,
  importTarget,
  installPacked,
  jsFiles,
  type PackedManifest,
  runRecordingDefines,
  specifierOf,
} from './packed/consumer.ts';

const COMPONENTS = '@websublime/line-components';
const CORE = '@websublime/line-core';
const GENUI = '@websublime/line-genui';

/**
 * The tags each `line-components` subpath registers: the §4.2 "Entrypoints and tags" rows of the subpaths that
 * ship today, and the root `"."`, which registers nothing (§4.2, SD24). Each C task adds its row here.
 */
const EXPECTED_TAGS: Readonly<Record<string, readonly string[]>> = {
  '.': [],
  './button': ['line-button'],
  './stack': ['line-stack'],
  './separator': ['line-separator'],
};

/** The gzip size of `import { commonReset }` with every sheet kept (R9 §2.1). */
const R9_ALL_SHEETS_GZIP = 1161;

let consumer: Consumer;
let components: PackedManifest;

beforeAll(async () => {
  consumer = await installPacked([CORE, COMPONENTS, GENUI]);
  const packed = consumer.packages.get(COMPONENTS);
  if (!packed) throw new Error(`${COMPONENTS} was not installed`);
  components = packed.manifest;
}, 120_000);

afterAll(() => {
  consumer?.cleanup();
});

/** IIFE bundle of `contents`, ready for `realm.eval`. */
async function iife(contents: string): Promise<string> {
  return (await bundle(consumer, contents, { format: 'iife' })).text;
}

/** `tag` as a whole tag name, so `line-button` does not match inside `line-button-group`. */
const tagPattern = (tag: string) => new RegExp(`(?<![\\w-])${tag}(?![\\w-])`);

describe('registration harness (§7.5)', () => {
  test('every component subpath in the packed exports has an EXPECTED_TAGS row, and every row ships', () => {
    const shipped = componentSubpaths(components);
    const rows = Object.keys(EXPECTED_TAGS)
      .filter((key) => key !== '.')
      .sort();
    expect({
      'subpaths without a row (add the §4.2 row to EXPECTED_TAGS)': shipped.filter((s) => !rows.includes(s)),
      'rows the tarball does not export': rows.filter((r) => !shipped.includes(r)),
    }).toEqual({
      'subpaths without a row (add the §4.2 row to EXPECTED_TAGS)': [],
      'rows the tarball does not export': [],
    });
  });

  for (const [subpath, tags] of Object.entries(EXPECTED_TAGS)) {
    test(`${subpath} defines ${tags.length ? tags.join(', ') : 'nothing'} in a fresh realm`, async () => {
      const code = await iife(`import '${specifierOf(COMPONENTS, subpath)}';\n`);
      const { realm, defined } = runRecordingDefines(code);
      try {
        expect(defined.sort()).toEqual([...tags].sort());
      } finally {
        await realm.happyDOM.close();
      }
    });
  }
});

describe('isolation scan (§7.5)', () => {
  const prefix = `node_modules/${COMPONENTS}/`;

  for (const subpath of Object.keys(EXPECTED_TAGS).filter((key) => key !== '.')) {
    test(`the ${subpath} bundle holds no other component's module or tag`, async () => {
      const target = importTarget(components.exports?.[subpath]);
      if (!target) throw new Error(`${subpath} has no import target in the packed exports`);
      const own = `${prefix}${dirname(target.replace(/^\.\//, ''))}/`;
      const shared = `${prefix}dist/shared/`;
      const { text, metafile } = await bundle(consumer, `export * from '${specifierOf(COMPONENTS, subpath)}';\n`, {
        format: 'esm',
        metafile: true,
      });
      if (!metafile) throw new Error('esbuild returned no metafile');
      const inputs = Object.keys(metafile.inputs);
      const foreignModules = inputs.filter(
        (input) => input.startsWith(prefix) && !input.startsWith(own) && !input.startsWith(shared),
      );
      const otherTags = Object.entries(EXPECTED_TAGS)
        .filter(([key]) => key !== subpath)
        .flatMap(([, tags]) => tags)
        .filter((tag) => tagPattern(tag).test(text));
      expect(inputs.some((input) => input.startsWith(own))).toBe(true);
      expect({ foreignModules, otherTags }).toEqual({ foreignModules: [], otherTags: [] });
      for (const tag of EXPECTED_TAGS[subpath] ?? []) expect(text).toMatch(tagPattern(tag));
    });
  }
});

describe('esbuild consumer bundle (§7.5)', () => {
  test('a bare import of every subpath emits no ignored-bare-import warning', async () => {
    const subpaths = ['.', ...componentSubpaths(components)];
    const contents = subpaths.map((subpath) => `import '${specifierOf(COMPONENTS, subpath)}';\n`).join('');
    const { warnings } = await bundle(consumer, contents, { format: 'esm' });
    expect(warnings.filter((w) => w.id === 'ignored-bare-import').map((w) => w.text)).toEqual([]);
  });
});

/** Every bare specifier `dist/**\/*.js` of a packed package imports, with the file that imports it. */
function bareImports(name: string): { file: string; specifier: string }[] {
  const packed = consumer.packages.get(name);
  if (!packed) throw new Error(`${name} was not installed`);
  const transpiler = new Bun.Transpiler({ loader: 'js' });
  const dist = join(packed.dir, 'dist');
  return jsFiles(dist).flatMap((file) =>
    transpiler
      .scanImports(readFileSync(join(dist, file), 'utf8'))
      .map((entry) => entry.path)
      .filter((specifier) => !(specifier.startsWith('.') || specifier.startsWith('/')))
      .map((specifier) => ({ file: `dist/${file}`, specifier })),
  );
}

/** `@scope/name/sub` → `@scope/name`; `name/sub` → `name`. */
function packageOf(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? specifier);
}

describe('bare specifiers in dist/ (§7.5, SD2)', () => {
  test(`dist/ of ${COMPONENTS} imports ${CORE} and ${CORE}/styles as bare specifiers`, () => {
    const specifiers = new Set(bareImports(COMPONENTS).map((entry) => entry.specifier));
    expect([CORE, `${CORE}/styles`].filter((specifier) => !specifiers.has(specifier))).toEqual([]);
  });

  for (const name of [CORE, COMPONENTS, GENUI]) {
    test(`dist/ of ${name} imports no undeclared bare specifier`, () => {
      const manifest = consumer.packages.get(name)?.manifest;
      if (!manifest) throw new Error(`${name} was not installed`);
      const declared = new Set([
        manifest.name,
        ...Object.keys(manifest.dependencies ?? {}),
        ...Object.keys(manifest.peerDependencies ?? {}),
      ]);
      const undeclared = bareImports(name)
        .filter(({ specifier }) => !declared.has(packageOf(specifier)))
        .map(({ file, specifier }) => `${file} imports ${specifier}${isBuiltin(specifier) ? ' (Node built-in)' : ''}`);
      expect(undeclared).toEqual([]);
    });
  }
});

describe('line-core/styles per-sheet shaking (§7.6, SD20)', () => {
  test('a commonReset bundle holds the built reset.common.css string and none of the other ten', async () => {
    // The built CSS strings, read by running the tarball's dist/styles/index.js with a recording CSSStyleSheet:
    // the minified build renames `createSheet`, so the check reads CSS, not call names.
    const code = await iife(`import * as sheets from '${CORE}/styles';\nglobalThis.__lineSheets = sheets;\n`);
    const realm = freshRealm();
    let built: Record<string, string>;
    try {
      realm.eval('globalThis.CSSStyleSheet = class { replaceSync(css) { this.cssText = css; } };');
      realm.eval(code);
      const sheets = realm.eval('globalThis.__lineSheets') as Record<string, { cssText: string }>;
      built = Object.fromEntries(Object.entries(sheets).map(([name, sheet]) => [name, sheet.cssText]));
    } finally {
      await realm.happyDOM.close();
    }
    const common = built.commonReset;
    expect(Object.keys(built)).toHaveLength(11);
    expect(typeof common).toBe('string');

    const { text, bytes } = await bundle(
      consumer,
      `import { commonReset } from '${CORE}/styles';\nexport { commonReset };\n`,
      { format: 'esm', minify: true, target: 'es2022' },
    );
    expect(text).toContain(common as string);
    const others = Object.entries(built).filter(([name, css]) => name !== 'commonReset' && text.includes(css));
    expect(others.map(([name]) => name)).toEqual([]);

    const gzip = Bun.spawnSync(['gzip', '-9', '-n', '-c'], { stdin: bytes, stdout: 'pipe' }).stdout.byteLength;
    console.info(
      `line-core/styles commonReset alone: ${bytes.byteLength} B minified, ${gzip} B gzip -9 -n (R9, all 11 sheets: ${R9_ALL_SHEETS_GZIP} B).`,
    );
  });
});
