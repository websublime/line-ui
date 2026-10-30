#!/usr/bin/env bun

/**
 * scripts/report-size.mjs — Per-component size report (ledger 01-P5).
 *
 * It implements docs/specs/01-spec-core-primitives.md §7.6 and §6.P.5 (§10 SD20, SD21; R9 §2.4 in
 * docs/research/01-research-packaging.md). It runs after `bun run build`, reads `dist/` and uses no network.
 *
 * It packs `line-components` and `line-core` with `stageAndPack` (scripts/verify-pack.mjs) and extracts both
 * tarballs into a scratch `node_modules` under `<repo>/node_modules/.cache/line-p5/`. Each bundle goes through
 * esbuild `--bundle --minify --format=esm --target=es2022`, then `gzip -9 -n`. The report has three tables.
 *   - One row per `line-components` subpath in the packed `exports` whose import target is a `.js` file
 *     (`.` excluded) measures the component alone, with Lit, `line-core` and Zag external (SD21).
 *   - The shared baseline prints once. It covers Lit, `line-core` `LineElement`, `line-core/styles` with all
 *     11 sheets, and Zag core + vanilla (R9 §2.4 table).
 *   - The per-sheet row bundles `commonReset` alone and compares it with R9's 1161 B for all 11 sheets
 *     (§6.P.5 acceptance; R9 §2.1).
 *
 * The report gates nothing (SD21) and only monitors the < 5 KB target. A failed measurement prints in its row
 * and as a GitHub `::warning::` in Actions, and the script still exits 0.
 */

import { mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import { ROOT, readTarball, readWorkspacePackages, stageAndPack } from './verify-pack.mjs';

const COMPONENTS = '@websublime/line-components';
const CORE = '@websublime/line-core';
const R9_ALL_SHEETS_GZIP = 1161;

const LIT_EXTERNAL = ['lit', 'lit/*', 'lit-html', 'lit-html/*', 'lit-element', 'lit-element/*', '@lit/*'];
const CORE_EXTERNAL = [CORE, `${CORE}/*`];
const ZAG_EXTERNAL = ['@zag-js/*'];
const COMPONENT_EXTERNAL = [...LIT_EXTERNAL, ...CORE_EXTERNAL, ...ZAG_EXTERNAL];

// esbuild walks up the parent `node_modules` folders from the scratch root, so it reaches the repo root
// `node_modules` for Lit and Zag and never a shared system temp folder.
const SCRATCH_PARENT = join(ROOT, 'node_modules', '.cache', 'line-p5');

const inActions = process.env.GITHUB_ACTIONS === 'true';
const problems = [];

/** Escapes GitHub workflow-command data, turning `%`, CR and LF into `%25`, `%0D` and `%0A`. */
export const escapeCommandData = (text) => text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

/** Collapses line breaks and their indentation to one space, so no printed line starts with a raw `::` command. */
export const oneLine = (text) => text.replace(/\s*[\r\n]+\s*/g, ' ').trim();

function warn(message) {
  problems.push(oneLine(message));
  if (inActions) console.info(`::warning title=Size report::${escapeCommandData(message)}`);
}

/** Packs a workspace package, extracts its tarball to `<nodeModules>/<name>` and returns the packed manifest. */
async function packInto(name, nodeModules, scratch) {
  const pkg = readWorkspacePackages().find((p) => p.name === name);
  if (!pkg) throw new Error(`${name} is not a packages/* workspace package`);
  const { tarball, cleanup } = stageAndPack(pkg);
  try {
    const { manifest } = await readTarball(tarball);
    const out = mkdtempSync(join(scratch, 'extract-'));
    await new Bun.Archive(await Bun.file(tarball).bytes()).extract(out);
    const target = join(nodeModules, name);
    mkdirSync(join(target, '..'), { recursive: true });
    renameSync(join(out, 'package'), target);
    return manifest;
  } finally {
    cleanup();
  }
}

/** Returns the `gzip -9 -n` byte count of `bytes` from the CLI. Node zlib gives slightly larger numbers (R9 §2.4). */
function gzipSize(bytes) {
  const proc = Bun.spawnSync(['gzip', '-9', '-n', '-c'], { stdin: bytes, stdout: 'pipe', stderr: 'pipe' });
  if (proc.exitCode !== 0) throw new Error(`gzip -9 -n failed: ${proc.stderr.toString().trim()}`);
  return proc.stdout.byteLength;
}

/** Bundles `contents` with esbuild `--bundle --minify --format=esm --target=es2022` and returns its sizes and warnings. */
async function measure(contents, external, resolveDir) {
  const result = await build({
    stdin: { contents, resolveDir, loader: 'js', sourcefile: 'entry.js' },
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2022',
    external,
    write: false,
    logLevel: 'silent',
  });
  const bytes = result.outputFiles[0].contents;
  return { minified: bytes.byteLength, gzip: gzipSize(bytes), warnings: result.warnings };
}

/** Measures each row. A failed row reports its error instead of numbers. */
async function measureRows(rows, resolveDir) {
  const measured = [];
  for (const row of rows) {
    try {
      const m = await measure(row.contents, row.external, resolveDir);
      for (const w of m.warnings) warn(`${row.label}: esbuild warning [${w.id || 'warning'}] ${w.text}`);
      measured.push({ ...row, ...m });
    } catch (err) {
      warn(`${row.label}: ${err.message}`);
      measured.push({ ...row, error: err.message.split('\n')[0] });
    }
  }
  return measured;
}

function printTable(title, headers, rows) {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (cells) =>
    `| ${cells.map((c, i) => (i === 0 ? String(c).padEnd(widths[i]) : String(c).padStart(widths[i]))).join(' | ')} |`;
  console.info(`\n${title}\n`);
  console.info(line(headers));
  console.info(`|${widths.map((w, i) => (i === 0 ? '-'.repeat(w + 2) : `${'-'.repeat(w + 1)}:`)).join('|')}|`);
  for (const r of rows) console.info(line(r));
}

const cells = (m) => (m.error ? [m.label, 'error', m.error] : [m.label, m.minified, m.gzip]);

/** Returns the `import` target of an `exports` entry, given as a bare string or a conditions object. */
const importTarget = (entry) =>
  typeof entry === 'string' ? entry : typeof entry?.import === 'string' ? entry.import : undefined;

/** Lists every `exports` key but `"."` whose import target is a `.js` file, as the P5 tests' `componentSubpaths()` does. */
const componentSubpaths = (manifest) =>
  Object.entries(manifest.exports ?? {})
    .filter(([key, entry]) => key !== '.' && importTarget(entry)?.endsWith('.js'))
    .map(([key]) => key)
    .sort();

async function main() {
  let scratch;
  try {
    mkdirSync(SCRATCH_PARENT, { recursive: true });
    scratch = mkdtempSync(join(SCRATCH_PARENT, 'size-'));
    const nodeModules = join(scratch, 'node_modules');
    const components = await packInto(COMPONENTS, nodeModules, scratch);
    await packInto(CORE, nodeModules, scratch);

    const subpaths = componentSubpaths(components);
    const componentRows = subpaths.map((subpath) => ({
      label: subpath,
      contents: `export * from '${COMPONENTS}/${subpath.slice(2)}';\n`,
      external: COMPONENT_EXTERNAL,
    }));
    const baselineRows = [
      {
        label: 'Lit (LitElement, html, css)',
        contents: `export { LitElement, html, css } from 'lit';\n`,
        external: [],
      },
      {
        label: 'line-core LineElement (Lit, Zag external)',
        contents: `export { LineElement } from '${CORE}';\n`,
        external: [...LIT_EXTERNAL, ...ZAG_EXTERNAL],
      },
      {
        label: 'line-core/styles, all 11 sheets (Lit external)',
        contents: `export * from '${CORE}/styles';\n`,
        external: LIT_EXTERNAL,
      },
      {
        label: 'Zag core + vanilla',
        contents: `export * from '@zag-js/core';\nexport * from '@zag-js/vanilla';\n`,
        external: [],
      },
    ];
    const sheetRow = {
      label: 'commonReset alone (Lit external)',
      contents: `import { commonReset } from '${CORE}/styles';\nexport { commonReset };\n`,
      external: LIT_EXTERNAL,
    };
    const measuredComponents = await measureRows(componentRows, scratch);
    const measuredBaseline = await measureRows(baselineRows, scratch);
    const [sheet] = await measureRows([sheetRow], scratch);

    console.info(
      `Size report (${COMPONENTS}@${components.version}, packed tarball): esbuild --bundle --minify --format=esm --target=es2022, then gzip -9 -n. Bytes. Gates nothing (spec §7.6, SD21).`,
    );
    printTable(
      'Per component — component only; Lit, line-core and Zag external (target < 5 KB gzip, monitored):',
      ['Subpath', 'Minified B', 'gzip -9 -n B'],
      measuredComponents.map(cells),
    );
    printTable(
      'Shared baseline — paid once by the first component (R9 §2.4):',
      ['Bundle', 'Minified B', 'gzip -9 -n B'],
      measuredBaseline.map(cells),
    );
    printTable(
      `line-core/styles per-sheet shaking — import { commonReset } from '${CORE}/styles' (spec §6.P.5, SD20):`,
      ['Bundle', 'Minified B', 'gzip -9 -n B', 'R9 all 11 sheets B'],
      [[...cells(sheet), R9_ALL_SHEETS_GZIP]],
    );
    if (!sheet.error) {
      const delta = sheet.gzip - R9_ALL_SHEETS_GZIP;
      console.info(`\ncommonReset alone: ${sheet.gzip} B gzip, ${delta > 0 ? '+' : ''}${delta} B against R9's 1161 B.`);
    }
  } catch (err) {
    warn(`size report aborted: ${err.message}`);
  } finally {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
  }
  if (problems.length) {
    console.info(`\nSize report: ${problems.length} measurement problem(s), not gating:`);
    for (const p of problems) console.info(`  - ${p}`);
  }
}

if (import.meta.main) await main();
