#!/usr/bin/env bun

/**
 * scripts/verify-palettes-fresh.mjs — line-colors palette freshness guard.
 *
 * Bun script (Node-compatible APIs only) invoked per
 * docs/specs/00-spec-design-system.md §6.C.3 (C4) and §6.F.5 line 1358:
 *   - run: bun run scripts/verify-palettes-fresh.mjs   (zero args)
 *
 * Enforces spec decision D2 (§10, line 1757-1761): the generated line-colors CSS
 * is COMMITTED, and a contributor must never hand-edit it. This guard re-runs the
 * C3 generator (scripts/generate-palettes.mjs) into a throwaway temp directory and
 * byte-compares its output against the committed baseline, failing the PR on any
 * drift — whether a hand-edit to a generated hue file, a stale file the generator
 * no longer emits, or a new file the generator emits that was never committed.
 *
 * DIFF TARGET — packages/line-colors/src/, NOT dist/ (spec §6.C.3 line 661, D2
 * line 1759, AM-013): the generator's default --output is packages/line-colors/src
 * and that is what C3 committed. `dist/` is a gitignored postcss build artifact
 * (.gitignore), absent on a fresh clone — diffing against it is meaningless.
 *
 * MECHANISM — subprocess, not import (spec §6.C.3, generator design note lines
 * 33-36): generate-palettes.mjs has no exports; it self-executes main() at module
 * load with the DEFAULT output = packages/line-colors/src. Importing it would
 * silently regenerate (mutate) the real committed tree. This guard therefore
 * invokes it as `bun run … --output <tmpDir>` and asserts a clean exit. Running it
 * end-to-end also exercises the generator's final `biome format --write` step, so
 * the temp output matches the (biome-formatted) committed src byte-for-byte —
 * Biome formatting is deterministic, keeping this guard green on an unmodified
 * tree.
 *
 * SCOPE — freshness only. The WCAG contrast validator (scripts/validate-contrast.mjs)
 * is a separate deliverable (C5, line-ui-7qm.3.5) with its own §6.F.5 CI line.
 *
 * CI WIRING — out of scope here (spec §6.C.3 lines 663, AM-013): .github/workflows/
 * checks.yml is owned by Stream F → F4 (line-ui-7qm.6.4, infra-supervisor) per
 * §6.F.5, which already enumerates this script's run-line. This guard's C4 surface
 * is purely local: exit 0 on the clean tree, exit non-zero (naming the file) on a
 * hand-edit. This script MUST NOT create or modify the workflow file.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

// The committed baseline the guard diffs against (spec §6.C.3 line 661 / D2).
const COMMITTED_DIR = resolve(REPO_ROOT, 'packages/line-colors/src');
// The generator this guard re-runs into a temp dir.
const GENERATOR = resolve(REPO_ROOT, 'scripts/generate-palettes.mjs');
// Regeneration hint surfaced to the contributor on failure.
const REGEN_CMD = 'bun run scripts/generate-palettes.mjs --output packages/line-colors/src/';

/**
 * Run the C3 generator into `outputDir` as a subprocess, inheriting stdio so the
 * generator's own diagnostics surface in CI. Throws on a non-zero exit so a broken
 * generator fails the guard loudly rather than producing a false "fresh" pass.
 * @param {string} outputDir
 */
function runGenerator(outputDir) {
  const result = spawnSync('bun', ['run', GENERATOR, '--output', outputDir], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  if (result.error) {
    throw new Error(`failed to run generator: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `generator exited with code ${result.status} — cannot verify freshness against a failed generation`,
    );
  }
}

/**
 * List the regular `.css` files directly inside `dir` (the generator emits a flat
 * directory — no nesting), returned as a sorted Set of basenames.
 * @param {string} dir
 * @returns {Promise<Set<string>>}
 */
async function listCssFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const names = entries.filter((e) => e.isFile() && e.name.endsWith('.css')).map((e) => e.name);
  return new Set(names.sort());
}

/**
 * Render a compact unified-style diff (first divergent region) between two file
 * contents, to point the contributor at WHERE the drift is. Kept dependency-free.
 * @param {string} committed
 * @param {string} fresh
 * @param {string} name
 * @returns {string}
 */
function firstDiffRegion(committed, fresh, name) {
  const a = committed.split('\n');
  const b = fresh.split('\n');
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) {
      const ctx = [];
      ctx.push(`  --- committed ${name}:${i + 1}`);
      ctx.push(`  - ${a[i] ?? '(missing line)'}`);
      ctx.push('  +++ freshly generated');
      ctx.push(`  + ${b[i] ?? '(missing line)'}`);
      return ctx.join('\n');
    }
  }
  // Contents differ only by trailing-newline / length with no line-level mismatch.
  return `  (content length differs: committed ${committed.length}B vs fresh ${fresh.length}B)`;
}

/**
 * Compare the committed palette dir against a freshly generated `tmpDir` and
 * return the list of freshness violations (empty when fresh). Checks file-set
 * equality in both directions, then byte-for-byte content of files on both sides.
 * @param {string} tmpDir
 * @returns {Promise<{ errors: string[]; committedCount: number }>}
 */
async function collectDrift(tmpDir) {
  const committedFiles = await listCssFiles(COMMITTED_DIR);
  const freshFiles = await listCssFiles(tmpDir);
  const errors = [];

  // 1. File-SET equality, both directions.
  for (const name of committedFiles) {
    if (!freshFiles.has(name)) {
      errors.push(
        `stale file: '${name}' is committed but the generator no longer emits it — delete it (then regenerate).`,
      );
    }
  }
  for (const name of freshFiles) {
    if (!committedFiles.has(name)) {
      errors.push(
        `missing file: the generator emits '${name}' but it is not committed under packages/line-colors/src/.`,
      );
    }
  }

  // 2. Byte-for-byte content comparison of files present on BOTH sides.
  for (const name of committedFiles) {
    if (!freshFiles.has(name)) continue;
    const [committed, fresh] = await Promise.all([
      readFile(join(COMMITTED_DIR, name), 'utf8'),
      readFile(join(tmpDir, name), 'utf8'),
    ]);
    if (committed !== fresh) {
      errors.push(`drift: '${name}' differs from a fresh generation.\n${firstDiffRegion(committed, fresh, name)}`);
    }
  }

  return { errors, committedCount: committedFiles.size };
}

/**
 * Guard the prerequisite paths. Returns true when both the committed baseline and
 * the generator exist; otherwise sets a failing exit code and returns false.
 * @returns {boolean}
 */
function checkPrerequisites() {
  if (!existsSync(COMMITTED_DIR)) {
    process.stderr.write(
      `verify-palettes-fresh: committed palette dir not found at ${COMMITTED_DIR} — ` +
        'has C3 (line-colors) been merged?\n',
    );
    process.exitCode = 1;
    return false;
  }
  if (!existsSync(GENERATOR)) {
    process.stderr.write(`verify-palettes-fresh: generator not found at ${GENERATOR}\n`);
    process.exitCode = 1;
    return false;
  }
  return true;
}

async function main() {
  if (!checkPrerequisites()) return;

  const tmpDir = await mkdtemp(join(tmpdir(), 'line-palettes-fresh-'));
  try {
    runGenerator(tmpDir);
    const { errors, committedCount } = await collectDrift(tmpDir);

    if (errors.length === 0) {
      console.info(
        `verify-palettes-fresh: OK — ${committedCount} committed palette CSS files match a fresh generation.`,
      );
      return;
    }

    process.stderr.write(`\nverify-palettes-fresh: FAIL — ${errors.length} freshness violation(s):\n`);
    for (const err of errors) {
      process.stderr.write(`  - ${err}\n`);
    }
    process.stderr.write(
      `\nThe generated palette CSS is stale or hand-edited. Regenerate and commit:\n  ${REGEN_CMD}\n`,
    );
    process.exitCode = 1;
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`verify-palettes-fresh: unexpected error: ${error.message}\n`);
  process.exitCode = 1;
});
