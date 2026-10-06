#!/usr/bin/env bun

/**
 * scripts/publish.mjs — Publisher: Changesets versions and tags, Bun packs, npm uploads (AM-036, ledger 00-F9;
 * planning pass and snapshot guard AM-039, stable guard AM-040, ledger 00-F3).
 *
 * Spec: docs/specs/00-spec-design-system.md §6.F.5 "Publish path (AM-036)", "Snapshot guard (AM-039)",
 * "Stable guard (AM-040)".
 *
 *   bun run scripts/publish.mjs [--tag <name>] [--no-git-tag] [--dry-run]
 *
 * 1. discover publishable packages (shared with scripts/verify-pack.mjs)
 * 2. topological order over internal dependencies + peerDependencies; ties by name; cycle fails
 * 3. `npm view <name>@<version> version --json`: exit 0 = published (skip), E404 = new, else fail;
 *    runs for every package before step 4 runs for any
 *    snapshot guard (`--tag canary`): every `publish` row must be `<x.y.z>-<HEAD sha>-SNAPSHOT`;
 *    stable guard (any other tag): no `publish` row may carry a prerelease version;
 *    either fails the run listing every offender, before anything is packed or uploaded
 * 4. stage + `bun pm pack` (shared staging function)
 * 5. pack checks (a)–(e); a failure stops the run before that package uploads
 * 6. `npm publish <tarball> --access public --tag <tag>` (default tag `latest`)
 * 7. `changeset tag` (stdout passed through) unless --no-git-tag
 *
 * Fails fast. `--dry-run` runs steps 1–5 (and the guards) for every package and prints the plan;
 * it never runs `npm publish` or `changeset tag`. Never prints secrets or the environment.
 */

import {
  checkTarball,
  discoverPublishable,
  ROOT,
  readTarball,
  stageAndPack,
  workspaceVersions,
} from './verify-pack.mjs';

const INTERNAL_SCOPE = '@websublime/';
const CANARY_TAG = 'canary';
const SNAPSHOT_VERSION = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)-([0-9a-f]{40})-SNAPSHOT$/;

function parseArgs(argv) {
  const opts = { tag: 'latest', gitTag: true, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--tag') {
      opts.tag = argv[++i];
      if (!opts.tag || opts.tag.startsWith('--')) throw new Error('--tag needs a value');
    } else if (arg === '--no-git-tag') opts.gitTag = false;
    else if (arg === '--dry-run') opts.dryRun = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return opts;
}

/** Dependencies before dependents (dependencies + peerDependencies); ties by name; cycle throws. */
export function topoSort(pkgs) {
  const byName = new Map(pkgs.map((p) => [p.name, p]));
  const deps = new Map(
    pkgs.map((p) => {
      const names = ['dependencies', 'peerDependencies'].flatMap((f) => Object.keys(p.manifest[f] ?? {}));
      return [p.name, new Set(names.filter((n) => n.startsWith(INTERNAL_SCOPE) && byName.has(n) && n !== p.name))];
    }),
  );
  const ordered = [];
  const done = new Set();
  while (ordered.length < pkgs.length) {
    const ready = pkgs
      .filter((p) => !done.has(p.name) && [...deps.get(p.name)].every((d) => done.has(d)))
      .map((p) => p.name)
      .sort();
    if (ready.length === 0) {
      const left = pkgs.filter((p) => !done.has(p.name)).map((p) => p.name);
      throw new Error(`dependency cycle among: ${left.join(', ')}`);
    }
    // Take one at a time so ties always break by name.
    const next = ready[0];
    done.add(next);
    ordered.push(byName.get(next));
  }
  return ordered;
}

function run(cmd, { inherit = false } = {}) {
  const proc = Bun.spawnSync(cmd, {
    cwd: ROOT,
    stdout: inherit ? 'inherit' : 'pipe',
    stderr: inherit ? 'inherit' : 'pipe',
  });
  return {
    exitCode: proc.exitCode,
    stdout: proc.stdout?.toString() ?? '',
    stderr: proc.stderr?.toString() ?? '',
  };
}

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** true = this exact version is published, false = new version (E404); throws otherwise. */
function isPublished(pkg) {
  const spec = `${pkg.name}@${pkg.version}`;
  const res = run(['npm', 'view', spec, 'version', '--json']);
  const json = parseJson(res.stdout);
  if (res.exitCode === 0) {
    const found = Array.isArray(json) ? json.includes(pkg.version) : json === pkg.version;
    if (found) return true;
    throw new Error(`npm view ${spec} exited 0 without reporting version ${pkg.version}`);
  }
  const code = json?.error?.code;
  if (code === 'E404') return false;
  throw new Error(`npm view ${spec} failed (exit ${res.exitCode}${code ? `, ${code}` : ''})`);
}

/** The 40-character `git rev-parse HEAD` of the repository root; throws otherwise. */
function headSha() {
  const res = run(['git', 'rev-parse', 'HEAD']);
  const sha = res.stdout.trim();
  if (res.exitCode !== 0 || !/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error(`git rev-parse HEAD failed (exit ${res.exitCode})`);
  }
  return sha;
}

/**
 * Snapshot guard (AM-039). Returns the `publish` rows whose version is not
 * `<major>.<minor>.<patch>-<sha>-SNAPSHOT` for exactly `sha`; `skip` rows upload nothing and are never checked.
 * @param {Array<{ name: string, version: string, action: 'publish' | 'skip' }>} rows
 * @param {string} sha 40-character HEAD sha
 */
export function snapshotOffenders(rows, sha) {
  return rows.filter((row) => row.action === 'publish' && SNAPSHOT_VERSION.exec(row.version)?.[1] !== sha);
}

/**
 * Stable guard (AM-040). Returns the `publish` rows whose version has a prerelease part (a `-` after
 * `<major>.<minor>.<patch>`, ignoring `+build` metadata); `skip` rows upload nothing and are never checked.
 * @param {Array<{ name: string, version: string, action: 'publish' | 'skip' }>} rows
 */
export function prereleaseOffenders(rows) {
  return rows.filter((row) => row.action === 'publish' && row.version.split('+', 1)[0].includes('-'));
}

/** Snapshot guard with `--tag canary`, stable guard otherwise; throws listing every offender. */
function assertVersionGuard(rows, tag) {
  const canary = tag === CANARY_TAG;
  const sha = canary ? headSha() : undefined;
  const offenders = canary ? snapshotOffenders(rows, sha) : prereleaseOffenders(rows);
  if (offenders.length === 0) return;
  const rule = canary
    ? `snapshot guard: --tag ${CANARY_TAG} publishes only <x.y.z>-${sha}-SNAPSHOT versions (run snapshot:version at HEAD)`
    : `stable guard: --tag ${tag} publishes no prerelease versions (canaries go out with --tag ${CANARY_TAG})`;
  throw new Error(`${rule}; offending:\n${offenders.map((o) => `  - ${o.name}@${o.version}`).join('\n')}`);
}

/** Steps 4–6 for one package. Returns its plan row. */
async function packCheckUpload(pkg, published, opts, versions, cleanups) {
  const { tarball, cleanup } = stageAndPack(pkg);
  cleanups.push(cleanup);
  const failures = checkTarball(await readTarball(tarball), versions);
  if (failures.length) {
    throw new Error(`pack checks failed for ${pkg.name}:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  }
  if (!opts.dryRun) {
    const res = run(['npm', 'publish', tarball, '--access', 'public', '--tag', opts.tag], { inherit: true });
    if (res.exitCode !== 0) throw new Error(`npm publish failed for ${pkg.name}@${pkg.version}`);
    console.info(`published ${pkg.name}@${pkg.version} under ${opts.tag}`);
  }
  return { name: pkg.name, version: pkg.version, tag: opts.tag, tarball, action: published ? 'skip' : 'publish' };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const pkgs = topoSort(discoverPublishable());
  const versions = workspaceVersions();
  const plan = [];
  const cleanups = [];
  try {
    // Step 3 for every package before step 4 for any (AM-039): the guards see the whole plan first.
    const rows = pkgs.map((pkg) => {
      const published = isPublished(pkg);
      if (published) console.info(`${pkg.name}@${pkg.version} is already published; skipping upload`);
      return { pkg, name: pkg.name, version: pkg.version, action: published ? 'skip' : 'publish' };
    });

    assertVersionGuard(rows, opts.tag);

    for (const row of rows) {
      const published = row.action === 'skip';
      if (published && !opts.dryRun) continue;
      plan.push(await packCheckUpload(row.pkg, published, opts, versions, cleanups));
    }

    if (opts.dryRun) {
      console.info('\nPublish plan (dry run; npm publish and changeset tag not run):');
      for (const p of plan) console.info(`  ${p.action.padEnd(7)} ${p.name}@${p.version}  tag=${p.tag}  ${p.tarball}`);
      return;
    }

    if (opts.gitTag) {
      // Root `changeset` script → local @changesets/cli bin; fails rather than downloading if missing.
      const res = run(['bun', 'run', 'changeset', 'tag'], { inherit: true });
      if (res.exitCode !== 0) throw new Error('changeset tag failed');
    }
  } finally {
    for (const cleanup of cleanups) cleanup();
  }
}

if (import.meta.main) {
  try {
    await main();
  } catch (err) {
    console.error(`publish: ${err.message}`);
    process.exit(1);
  }
}
