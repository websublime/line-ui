#!/usr/bin/env bun

/**
 * scripts/verify-peer-ranges.mjs — the SD76 check: fails when the pending Changesets plan releases
 * `line-components` or `line-icons` at a version outside `line-genui`'s peer range (ledger 01-Z14).
 *
 * Spec: docs/specs/01-spec-core-primitives.md §7.2, the SD76 check bullet (§10 SD76; §12 AM-121).
 *
 *   bun run scripts/verify-peer-ranges.mjs
 *
 * Under Changesets 3 a peer bump that leaves the declared range gives `line-genui` a `patch` and rewrites its
 * peer union to `workspace:^<new version>`, so a missed per-phase widening no longer shows in the versions.
 * Early pass: with no `*.md` other than `README.md` in `.changeset/`, nothing is pending and `changeset status`
 * is not run (it exits 1 on every Version PR). Otherwise the script runs `changeset status --output <temp file>`
 * without `--since`, so the plan holds every pending changeset; it needs a local `main` (the `checks.yml` step
 * runs `git branch --force main origin/main` first). `checkPeerRanges` is the pure decision; `verifyPeerRanges`
 * takes the `changeset status` runner as a parameter.
 */

import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GENUI_MANIFEST = 'packages/line-genui/package.json';

export const GENUI = '@websublime/line-genui';
/** The `line-genui` peers whose per-phase widening SD76 requires. */
export const PEERS = ['@websublime/line-components', '@websublime/line-icons'];

const WORKSPACE_PREFIX = 'workspace:';
/** One `^<x.y.z>` arm, or several joined by ` || `: the form SD76 uses. */
const RANGE_FORM = /^\^\d+\.\d+\.\d+( \|\| \^\d+\.\d+\.\d+)*$/;

/** The changeset files pending in `.changeset/`: every `*.md` except `README.md`. */
export function pendingChangesets(files) {
  return files.filter((file) => file.endsWith('.md') && file !== 'README.md');
}

/** The failure message for one peer release against its `peerDependencies` value, or `null` when it passes. */
function checkRelease(release, value) {
  const field = `${GENUI} peerDependencies["${release.name}"]`;
  if (value === undefined || value === null) {
    return `${field} is missing, so it cannot admit ${release.newVersion} (Phase 1 spec §7.2, SD76).`;
  }
  if (value === '') {
    return `${field} is empty, so it cannot admit ${release.newVersion} (Phase 1 spec §7.2, SD76).`;
  }
  const range =
    typeof value === 'string' && value.startsWith(WORKSPACE_PREFIX) ? value.slice(WORKSPACE_PREFIX.length) : value;
  if (typeof range !== 'string' || !RANGE_FORM.test(range)) {
    return `${field} ${JSON.stringify(value)} is not one "^<x.y.z>" arm or several joined by " || ", after one leading "workspace:" (Phase 1 spec §7.2, SD76).`;
  }
  if (Bun.semver.satisfies(release.newVersion, range)) return null;
  return `${field} "${value}" does not admit ${release.newVersion}, which the pending changesets release. Widen both peer ranges in packages/line-genui/package.json, for example "|| ^0.3.0", in this PR (Phase 1 spec §7.2, SD76).`;
}

/**
 * The SD76 decision over the plan's `releases[]` (`changeset status --output`) and `line-genui`'s
 * `peerDependencies`. Returns one message per failing peer release; an empty array passes.
 */
export function checkPeerRanges(releases, peerDependencies) {
  const failures = [];
  for (const release of releases) {
    if (!PEERS.includes(release.name) || release.type === 'none') continue;
    const failure = checkRelease(release, peerDependencies?.[release.name]);
    if (failure) failures.push(failure);
  }
  return failures;
}

/**
 * Runs the check. `runStatus()` returns `{ exitCode, output, plan }`, `plan` being the parsed
 * `changeset status --output` JSON when `exitCode` is 0. Returns `{ exitCode, messages }`.
 */
export function verifyPeerRanges({ changesetDir, runStatus, readPeerDependencies }) {
  if (pendingChangesets(readdirSync(changesetDir)).length === 0) {
    return { exitCode: 0, messages: ['SD76: no pending changeset in .changeset/; nothing to check.'] };
  }
  const status = runStatus();
  if (status.exitCode !== 0) {
    return { exitCode: 1, messages: [`SD76: changeset status exited ${status.exitCode}:`, status.output] };
  }
  const failures = checkPeerRanges(status.plan.releases ?? [], readPeerDependencies());
  if (failures.length > 0) return { exitCode: 1, messages: failures };
  return { exitCode: 0, messages: [`SD76: ${GENUI} peer ranges admit every pending release.`] };
}

/** `bun run changeset status --output <temp file>` from the repository root. */
function runChangesetStatus() {
  const dir = mkdtempSync(join(tmpdir(), 'verify-peer-ranges-'));
  try {
    const file = join(dir, 'status.json');
    const proc = Bun.spawnSync(['bun', 'run', 'changeset', 'status', '--output', file], {
      cwd: ROOT,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const output = `${proc.stdout?.toString() ?? ''}${proc.stderr?.toString() ?? ''}`.trim();
    if (proc.exitCode !== 0) return { exitCode: proc.exitCode, output, plan: null };
    return { exitCode: 0, output, plan: JSON.parse(readFileSync(file, 'utf8')) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  try {
    const { exitCode, messages } = verifyPeerRanges({
      changesetDir: join(ROOT, '.changeset'),
      runStatus: runChangesetStatus,
      readPeerDependencies: () => JSON.parse(readFileSync(join(ROOT, GENUI_MANIFEST), 'utf8')).peerDependencies,
    });
    for (const message of messages) (exitCode === 0 ? console.info : console.error)(message);
    process.exit(exitCode);
  } catch (err) {
    console.error(`verify-peer-ranges: ${err.message}`);
    process.exit(1);
  }
}
