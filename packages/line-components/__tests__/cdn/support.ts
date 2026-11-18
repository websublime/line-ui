/**
 * CDN delivery check — the Node half of `cdn.e2e.ts` (Phase 1 spec §6.P.6, §7.7; §12 AM-105, AM-106).
 *
 * It resolves the exact versions the pages load, builds the unpkg import map from the registry manifests of those
 * versions, and serves the two pages from `127.0.0.1`. Every answer comes from the live npm registry and jsDelivr.
 *
 * @module __tests__/cdn/support
 */

import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { promisify } from 'node:util';

export const JSDELIVR = 'https://cdn.jsdelivr.net/npm';
export const UNPKG = 'https://unpkg.com';
const REGISTRY = 'https://registry.npmjs.org';
const JSDELIVR_DATA = 'https://data.jsdelivr.com/v1/packages/npm';

export const COMPONENTS = '@websublime/line-components';
export const CORE = '@websublime/line-core';

/** An exact semver version: no range operator, no `x`, no tag. */
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/** A `@websublime/*` package at a version inside a CDN URL or a jsDelivr bundle import. */
export const WEBSUBLIME_URL = /\/(@websublime\/[a-z0-9-]+)@([^/"'\s]+)\//g;

async function fetchOk(url: string): Promise<Response> {
  let failure: unknown;
  // The registry and the jsDelivr data API answer reliably, but one cold miss must not fail a release gate.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(2_000 * 2 ** attempt);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (response.ok) return response;
      failure = new Error(`GET ${url} answered HTTP ${response.status}`);
      if (response.status === 404) break;
    } catch (error) {
      failure = error;
    }
  }
  throw failure;
}

const getJson = async <T>(url: string): Promise<T> => (await fetchOk(url)).json() as Promise<T>;

/** The fields of a version manifest the check reads. */
interface Manifest {
  readonly version: string;
  readonly dependencies?: Record<string, string>;
  readonly exports?: Record<string, unknown>;
}

const manifests = new Map<string, Promise<Manifest>>();

/** The registry manifest of `name@version`; a version that is not published fails here. */
export function manifest(name: string, version: string): Promise<Manifest> {
  const key = `${name}@${version}`;
  let pending = manifests.get(key);
  if (!pending) {
    pending = getJson<Manifest>(`${REGISTRY}/${name}/${version}`);
    manifests.set(key, pending);
  }
  return pending;
}

/** The exact version an environment variable names, or `undefined` when it is unset or empty. */
function exactFromEnv(variable: string): string | undefined {
  const value = process.env[variable]?.trim();
  if (!value) return undefined;
  if (!EXACT_VERSION.test(value)) {
    throw new Error(`${variable}="${value}" is not an exact version; ranges and tags are rejected (spec §6.P.6).`);
  }
  return value;
}

export interface CdnVersions {
  /** The `line-components` version under test. */
  readonly components: string;
  /** Each `@websublime/*` package the `line-components` jsDelivr bundles import, at the one version they name. */
  readonly imported: Readonly<Record<string, string>>;
  /** Where each version came from, for the report. */
  readonly sources: Readonly<Record<string, string>>;
}

/**
 * Resolves the versions both pages load (spec §6.P.6; §12 AM-105, AM-106):
 *
 * - `line-components`: `LINE_CDN_COMPONENTS_VERSION`, else the npm `canary` dist-tag.
 * - `line-core` and any other `@websublime/*` package: the one exact version the jsDelivr `+esm` bundles of that
 *   `line-components` version import, read from each bundle in `subpaths`. Two versions of one package fail and
 *   are listed. A set `LINE_CDN_CORE_VERSION` that differs from the bundles' `line-core` fails with both.
 */
export async function resolveVersions(subpaths: readonly string[]): Promise<CdnVersions> {
  const fromEnv = exactFromEnv('LINE_CDN_COMPONENTS_VERSION');
  const components =
    fromEnv ?? (await getJson<Record<string, string>>(`${REGISTRY}/-/package/${COMPONENTS}/dist-tags`)).canary;
  if (components === undefined) throw new Error(`${COMPONENTS} has no canary dist-tag.`);
  await manifest(COMPONENTS, components);

  const imported = await bundleImports(components, subpaths);
  const core = imported[CORE];
  if (core === undefined) {
    throw new Error(`No ${COMPONENTS}@${components} jsDelivr bundle among ${subpaths.join(', ')} imports ${CORE}.`);
  }
  const coreFromEnv = exactFromEnv('LINE_CDN_CORE_VERSION');
  if (coreFromEnv !== undefined && coreFromEnv !== core) {
    throw new Error(
      `LINE_CDN_CORE_VERSION=${coreFromEnv}, but the ${COMPONENTS}@${components} jsDelivr bundles import ${CORE}@${core}.`,
    );
  }
  await manifest(CORE, core);

  const sources: Record<string, string> = {
    [COMPONENTS]: fromEnv === undefined ? 'npm canary dist-tag' : 'LINE_CDN_COMPONENTS_VERSION',
  };
  for (const name of Object.keys(imported)) sources[name] = 'jsDelivr +esm bundle imports';
  if (coreFromEnv !== undefined) sources[CORE] = 'jsDelivr +esm bundle imports, equal to LINE_CDN_CORE_VERSION';
  return { components, imported, sources };
}

/**
 * The `@websublime/*` packages the jsDelivr `+esm` bundles of `line-components@components` import, other than
 * `line-components` itself, each at the one exact version all of `subpaths` name; anything else fails with the list.
 */
async function bundleImports(components: string, subpaths: readonly string[]): Promise<Record<string, string>> {
  // package → version → the subpaths whose bundle imports it at that version
  const seen = new Map<string, Map<string, Set<string>>>();
  for (const subpath of subpaths) {
    const url = `${JSDELIVR}/${COMPONENTS}@${components}/${subpath === '.' ? '' : `${subpath}/`}+esm`;
    for (const [, name, version] of (await (await fetchOk(url)).text()).matchAll(WEBSUBLIME_URL)) {
      if (name === undefined || version === undefined || name === COMPONENTS) continue;
      const versions = seen.get(name) ?? new Map<string, Set<string>>();
      versions.set(version, (versions.get(version) ?? new Set()).add(subpath));
      seen.set(name, versions);
    }
  }

  const imported: Record<string, string> = {};
  for (const [name, versions] of seen) {
    const [version] = versions.keys();
    if (versions.size !== 1 || version === undefined || !EXACT_VERSION.test(version)) {
      const list = [...versions].map(([v, from]) => `${v} (from ${[...from].join(', ')})`).join('; ');
      throw new Error(
        `The ${COMPONENTS}@${components} jsDelivr bundles import ${name} at: ${list}; need one exact version.`,
      );
    }
    imported[name] = version;
  }
  return imported;
}

/** One import map entry: a bare specifier, the package that serves it, and the file or folder in that package. */
export interface ImportMapRow {
  readonly specifier: string;
  readonly package: string;
  /** A file under the package root, or `''` for the package root itself when `specifier` ends in `/`. */
  readonly path: string;
  /** For a `/` prefix entry, one module under it that the page imports to prove the entry. */
  readonly probe?: string;
}

export interface ResolvedImportMap {
  readonly imports: Record<string, string>;
  /** The exact version each mapped package resolved to. */
  readonly versions: Record<string, string>;
}

/** The target of an `exports` entry for a browser module loader; `undefined` when no browser condition matches. */
function browserTarget(entry: unknown): string | undefined {
  if (typeof entry === 'string') return entry;
  if (entry === null || typeof entry !== 'object') return undefined;
  for (const condition of ['browser', 'import', 'default']) {
    const target = browserTarget(Reflect.get(entry, condition));
    if (target !== undefined) return target;
  }
  return undefined;
}

/**
 * Pins every row of `rows` to an exact version and checks it against the registry manifests.
 *
 * The walk starts at the manifests of `pinned` (the `@websublime/*` packages at their exact versions). Each
 * dependency is either mapped by a row or listed in `unmapped`; a third-party range resolves to the version
 * jsDelivr resolves it to, and the walk continues into that version's manifest. A package reached at two versions,
 * a row whose package the walk never reaches, and a dependency that is neither mapped nor `unmapped` fail. Each
 * non-prefix row must name the browser target of its package's `exports`; `./x/*` patterns are expanded from the
 * package listing.
 */
export async function resolveImportMap(
  rows: readonly ImportMapRow[],
  pinned: Readonly<Record<string, string>>,
  unmapped: readonly string[],
): Promise<ResolvedImportMap> {
  const mapped = new Set(rows.map((row) => row.package));
  const versions = await walkVersions(mapped, pinned, unmapped);

  for (const name of mapped) {
    const version = versions[name];
    if (version === undefined) throw new Error(`The import map maps ${name}, which no pinned manifest reaches.`);
    const expected = await exportedTargets(name, version);
    // Each bare (non-prefix) entry must be what the package's `exports` gives that specifier in a browser.
    const bare = rows.filter((row) => row.package === name && !row.specifier.endsWith('/'));
    for (const row of bare) {
      const target = expected.get(row.specifier);
      if (target !== row.path) {
        throw new Error(
          `${row.specifier} maps to ${row.path}, but ${name}@${version} exports it as ${target ?? 'nothing'}.`,
        );
      }
    }
    // `line-core` takes one entry per export (its subpaths, and the `./mixins/*` the docs promise), so none may lack one.
    const missing = [...expected.keys()].filter((specifier) => !bare.some((row) => row.specifier === specifier));
    if (name === CORE && missing.length > 0) {
      throw new Error(`The import map lacks ${missing.join(', ')} from ${name}@${version}.`);
    }
  }

  const imports: Record<string, string> = {};
  for (const row of rows) imports[row.specifier] = `${UNPKG}/${row.package}@${versions[row.package]}/${row.path}`;
  return { imports, versions };
}

/**
 * The exact version of every package the walk from `pinned` reaches through mapped dependencies. A `pinned`
 * package keeps its pin; any other range resolves to the version jsDelivr resolves it to.
 */
async function walkVersions(
  mapped: ReadonlySet<string>,
  pinned: Readonly<Record<string, string>>,
  unmapped: readonly string[],
): Promise<Record<string, string>> {
  const versions: Record<string, string> = {};
  const reachedFrom = new Map<string, string>();

  const visit = async (name: string, version: string, from: string): Promise<void> => {
    const known = versions[name];
    if (known !== undefined && known !== version) {
      throw new Error(
        `${name} resolves to ${known} (from ${reachedFrom.get(name)}) and ${version} (from ${from}); one map entry cannot hold both.`,
      );
    }
    if (known !== undefined) return;
    versions[name] = version;
    reachedFrom.set(name, from);
    const { dependencies = {} } = await manifest(name, version);
    for (const [dependency, range] of Object.entries(dependencies)) {
      if (unmapped.includes(dependency)) continue;
      const from = `${name}@${version}`;
      await visit(dependency, await dependencyVersion(dependency, range, from, mapped, pinned), from);
    }
  };
  for (const [name, version] of Object.entries(pinned)) await visit(name, version, 'the pinned versions');
  return versions;
}

/** The pin of a mapped dependency, else the version jsDelivr resolves its range to. */
async function dependencyVersion(
  dependency: string,
  range: string,
  from: string,
  mapped: ReadonlySet<string>,
  pinned: Readonly<Record<string, string>>,
): Promise<string> {
  if (!mapped.has(dependency)) {
    throw new Error(`${from} depends on ${dependency}, which the import map neither maps nor lists as unmapped.`);
  }
  const pin = pinned[dependency];
  if (pin !== undefined) return pin;
  const url = `${JSDELIVR_DATA}/${dependency}/resolved?specifier=${encodeURIComponent(range)}`;
  const { version } = await getJson<{ version: string | null }>(url);
  if (!version) throw new Error(`No published ${dependency} satisfies ${range} (from ${from}).`);
  return version;
}

/** Each specifier the `exports` of `name@version` give a browser, to its file; `./x/*` patterns are expanded. */
async function exportedTargets(name: string, version: string): Promise<Map<string, string>> {
  const { exports } = await manifest(name, version);
  if (exports === undefined) throw new Error(`${name}@${version} has no exports map.`);
  const expected = new Map<string, string>();
  for (const [key, entry] of Object.entries(exports)) {
    const target = browserTarget(entry);
    if (target === undefined || key.endsWith('.json')) continue;
    if (key.includes('*')) {
      for (const [specifier, file] of await expandPattern(name, version, key, target)) expected.set(specifier, file);
    } else {
      expected.set(key === '.' ? name : `${name}/${key.slice(2)}`, target.slice(2));
    }
  }
  return expected;
}

/** The specifiers an `exports` pattern such as `./mixins/*` → `./dist/mixins/*.js` matches, from the file listing. */
async function expandPattern(name: string, version: string, key: string, target: string): Promise<[string, string][]> {
  const [keyHead, keyTail] = key.slice(2).split('*') as [string, string];
  const [targetHead, targetTail] = target.slice(2).split('*') as [string, string];
  const listing = await getJson<{ files: { name: string }[] }>(`${JSDELIVR_DATA}/${name}@${version}?structure=flat`);
  return listing.files
    .map((file) => file.name.slice(1))
    .filter((file) => file.startsWith(targetHead) && file.endsWith(targetTail))
    .map((file) => [file.slice(targetHead.length, file.length - targetTail.length), file] as const)
    .filter(([stem]) => !stem.includes('/'))
    .map(([stem, file]) => [`${name}/${keyHead}${stem}${keyTail}`, file]);
}

export interface PageServer {
  readonly origin: string;
  close(): Promise<void>;
}

/** Serves each page (`/jsdelivr.html` → markup) on `127.0.0.1`; anything else answers 404. */
export async function servePages(pages: Readonly<Record<string, string>>): Promise<PageServer> {
  const server = createServer((request, response) => {
    const body = pages[new URL(request.url ?? '/', 'http://localhost').pathname];
    if (body === undefined) {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('Not Found');
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(body);
  });
  await once(server.listen(0, '127.0.0.1'), 'listening');
  const { port } = server.address() as AddressInfo;
  return { origin: `http://127.0.0.1:${port}`, close: promisify(server.close.bind(server)) };
}
