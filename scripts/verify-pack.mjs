#!/usr/bin/env bun

/**
 * scripts/verify-pack.mjs — Pack guard for published tarballs (AM-036, ledger 00-F9).
 *
 * Spec: docs/specs/00-spec-design-system.md §6.F.5 "Publish path (AM-036)".
 * Runs after `bun run build` (needs `dist/`). No network.
 *
 * For every publishable package (packages/* minus `"private": true` minus the
 * `.changeset/config.json` ignore list) it packs a staged copy (workspace: ranges
 * rewritten from packages/*\/package.json versions) with `bun pm pack` and checks:
 *   (a) every exports target / main / module / types exists in the tarball
 *   (b) every tarball path is on the allowlist (package.json, README*, LICENSE*, LICENCE*, `files` entries)
 *   (c) no tarball path hits the denylist (__tests__/, *.test.*, *.spec.*, tsconfig*.json, vite.config.*, *.tsbuildinfo, .-prefixed segments, *.pem, *.key)
 *   (d) no workspace:/catalog: range in the packed manifest's four dependency fields
 *   (e) every internal @websublime/* range is satisfied by that package's current version
 *
 * Lists every failure and exits non-zero if any. Exports discovery, pack, and check
 * functions for scripts/publish.mjs.
 */

import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dir, '..');
export const DEP_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies'];
const INTERNAL_SCOPE = '@websublime/';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** All workspace packages under packages/*: [{ name, version, dir, manifest }]. */
export function readWorkspacePackages(root = ROOT) {
  const pkgsDir = join(root, 'packages');
  return readdirSync(pkgsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(pkgsDir, d.name, 'package.json')))
    .map((d) => {
      const dir = join(pkgsDir, d.name);
      const manifest = readJson(join(dir, 'package.json'));
      return { name: manifest.name, version: manifest.version, dir, manifest };
    });
}

/** Publishable packages: packages/* minus private minus the changeset ignore list. */
export function discoverPublishable(root = ROOT) {
  const ignore = new Set(readJson(join(root, '.changeset', 'config.json')).ignore ?? []);
  return readWorkspacePackages(root).filter((p) => p.manifest.private !== true && !ignore.has(p.name));
}

/** Map name → version from packages/*\/package.json (never bun.lock). */
export function workspaceVersions(root = ROOT) {
  return new Map(readWorkspacePackages(root).map((p) => [p.name, p.version]));
}

/** Rewrite one `workspace:` range. Throws if the target is not a workspace package. */
export function rewriteWorkspaceRange(dep, range, versions) {
  if (!range.startsWith('workspace:')) return range;
  const version = versions.get(dep);
  if (version === undefined) throw new Error(`workspace dependency ${dep} is not a packages/* workspace package`);
  const spec = range.slice('workspace:'.length);
  if (spec === '^') return `^${version}`;
  if (spec === '~') return `~${version}`;
  if (spec === '*') return version;
  return spec;
}

/**
 * Stage a copy of the package (without node_modules), rewrite workspace: ranges,
 * and run `bun pm pack`. Returns { tarball, cleanup }; cleanup removes the temp dirs.
 */
export function stageAndPack(pkg, root = ROOT) {
  const versions = workspaceVersions(root);
  const stageDir = mkdtempSync(join(tmpdir(), 'line-stage-'));
  const outDir = mkdtempSync(join(tmpdir(), 'line-pack-'));
  const cleanup = () => {
    rmSync(stageDir, { recursive: true, force: true });
    rmSync(outDir, { recursive: true, force: true });
  };
  try {
    cpSync(pkg.dir, stageDir, {
      recursive: true,
      filter: (src) => !relative(pkg.dir, src).split(/[\\/]/).includes('node_modules'),
    });
    const manifest = readJson(join(stageDir, 'package.json'));
    for (const field of DEP_FIELDS) {
      const deps = manifest[field];
      if (!deps) continue;
      for (const [dep, range] of Object.entries(deps)) {
        deps[dep] = rewriteWorkspaceRange(dep, range, versions);
      }
    }
    writeFileSync(join(stageDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    const proc = Bun.spawnSync(['bun', 'pm', 'pack', '--quiet', '--destination', outDir], {
      cwd: stageDir,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    if (proc.exitCode !== 0) {
      throw new Error(`bun pm pack failed for ${pkg.name}: ${proc.stderr.toString().trim()}`);
    }
    const lines = proc.stdout
      .toString()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const tarball = lines.at(-1);
    if (!(tarball && existsSync(tarball))) throw new Error(`bun pm pack for ${pkg.name} produced no tarball`);
    return { tarball, cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
}

/** Read a tarball: { paths: string[] (without `package/`), manifest }. */
export async function readTarball(tarball) {
  const bytes = await Bun.file(tarball).bytes();
  const files = await new Bun.Archive(bytes).files();
  const paths = [];
  let manifest;
  for (const [key, file] of files) {
    if (!key.startsWith('package/')) continue;
    const path = key.slice('package/'.length);
    paths.push(path);
    if (path === 'package.json') manifest = JSON.parse(await file.text());
  }
  return { paths: paths.sort(), manifest };
}

const globToRegExp = (pattern) =>
  new RegExp(
    `^${pattern
      .split('*')
      .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')}$`,
  );

function collectExportTargets(value, out) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectExportTargets(v, out);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) collectExportTargets(v, out);
  return out;
}

const DENY = [
  /(^|\/)__tests__\//,
  /\.test\./,
  /\.spec\./,
  /(^|\/)tsconfig[^/]*\.json$/,
  /(^|\/)vite\.config\.[^/]*$/,
  /\.tsbuildinfo$/,
  /(^|\/)\./,
  /\.pem$/,
  /\.key$/,
];

const norm = (p) => p.replace(/^\.\//, '');

/** (a) every exports target (recursing into conditions; `*` must match ≥1 file) plus main/module/types exists. */
export function checkExports(paths, manifest) {
  const set = new Set(paths);
  const targets = collectExportTargets(manifest.exports, []);
  for (const field of ['main', 'module', 'types']) {
    if (typeof manifest[field] === 'string') targets.push(manifest[field]);
  }
  const failures = [];
  for (const target of targets) {
    const t = norm(target);
    if (t.includes('*')) {
      const re = globToRegExp(t);
      if (!paths.some((p) => re.test(p))) failures.push(`(a) export pattern ${target} matches no file`);
    } else if (!set.has(t)) failures.push(`(a) export target ${target} missing`);
  }
  return failures;
}

/** (b) every path is package.json, README*, LICENSE*, LICENCE*, or under a `files` entry. */
export function checkAllowlist(paths, manifest) {
  const entries = (manifest.files ?? []).map((f) => norm(f).replace(/\/$/, ''));
  const underEntry = (p) =>
    entries.some((f) => p === f || p.startsWith(`${f}/`) || (f.includes('*') && globToRegExp(f).test(p)));
  const allowed = (p) => p === 'package.json' || /^(README|LICENSE|LICENCE)[^/]*$/i.test(p) || underEntry(p);
  return paths.filter((p) => !allowed(p)).map((p) => `(b) ${p} is not on the allowlist`);
}

/** (c) no path hits the denylist (also applies under `files` entries). */
export function checkDenylist(paths) {
  return paths.filter((p) => DENY.some((re) => re.test(p))).map((p) => `(c) ${p} hits the denylist`);
}

function checkRange(field, dep, range, versions) {
  if (range.startsWith('workspace:') || range.startsWith('catalog:')) {
    return `(d) ${field}.${dep} has unrewritten range ${range}`;
  }
  if (!dep.startsWith(INTERNAL_SCOPE)) return null;
  const version = versions.get(dep);
  if (version === undefined) return `(e) ${field}.${dep} is not a workspace package`;
  if (!Bun.semver.satisfies(version, range)) return `(e) ${field}.${dep} range ${range} not satisfied by ${version}`;
  return null;
}

/** (d) no workspace:/catalog: ranges; (e) internal ranges satisfied by packages/* versions. */
export function checkRanges(manifest, versions) {
  return DEP_FIELDS.flatMap((field) =>
    Object.entries(manifest[field] ?? {})
      .map(([dep, range]) => checkRange(field, dep, range, versions))
      .filter(Boolean),
  );
}

/**
 * Checks (a)–(e) on a read tarball. Returns a list of failure strings (empty = pass).
 * `versions` is the name → version map from packages/*\/package.json.
 */
export function checkTarball({ paths, manifest }, versions) {
  if (!manifest) return ['package.json missing from tarball'];
  return [
    ...checkExports(paths, manifest),
    ...checkAllowlist(paths, manifest),
    ...checkDenylist(paths),
    ...checkRanges(manifest, versions),
  ];
}

/** Stage, pack, read, and check one package. Returns { tarball, manifest, failures, cleanup }. */
export async function packAndCheck(pkg, root = ROOT) {
  const { tarball, cleanup } = stageAndPack(pkg, root);
  try {
    const read = await readTarball(tarball);
    return { tarball, manifest: read.manifest, failures: checkTarball(read, workspaceVersions(root)), cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
}

if (import.meta.main) {
  const pkgs = discoverPublishable();
  const failures = [];
  for (const pkg of pkgs) {
    try {
      const result = await packAndCheck(pkg);
      result.cleanup();
      for (const f of result.failures) failures.push(`${pkg.name}: ${f}`);
      console.info(`${result.failures.length ? 'FAIL' : 'ok  '} ${pkg.name}@${pkg.version}`);
    } catch (err) {
      failures.push(`${pkg.name}: ${err.message}`);
      console.info(`FAIL ${pkg.name}@${pkg.version}`);
    }
  }
  if (failures.length) {
    console.error(`\nverify-pack: ${failures.length} failure(s):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.info(`\nverify-pack: ${pkgs.length} package(s) packed and checked, 0 failures`);
}
