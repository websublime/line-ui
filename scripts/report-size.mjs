#!/usr/bin/env bun

/**
 * scripts/report-size.mjs — Per-component size report (ledger 01-P5).
 *
 * Spec: docs/specs/01-spec-core-primitives.md §7.6 and §6.P.5; §10 SD20, SD21; R9 §2.4
 * (docs/research/01-research-packaging.md). Runs after `bun run build` (needs `dist/`). No network.
 *
 * Packs `line-components` and `line-core` with `stageAndPack` (scripts/verify-pack.mjs), extracts both
 * tarballs into a temp `node_modules`, and measures with esbuild
 * `--bundle --minify --format=esm --target=es2022`, then `gzip -9 -n`:
 *   - every `line-components` subpath in the packed `exports` (minus `.` and `./custom-elements.json`),
 *     component only, with Lit, `line-core` and Zag external (SD21);
 *   - the shared baseline once: Lit, `line-core` `LineElement`, `line-core/styles` (all 11 sheets),
 *     Zag core + vanilla (R9 §2.4 table);
 *   - `line-core/styles` per-sheet shaking: `commonReset` alone, against R9's 1161 B for all 11 sheets
 *     (§6.P.5 acceptance; R9 §2.1).
 *
 * Gates nothing (SD21): the < 5 KB target is monitored. A measurement problem prints in its row (and as a
 * GitHub `::warning::` in Actions) and the script still exits 0.
 */

import { mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

const inActions = process.env.GITHUB_ACTIONS === 'true';
const problems = [];

function warn(message) {
  problems.push(message);
  if (inActions) console.info(`::warning title=Size report::${message.replace(/\r?\n/g, ' ')}`);
}

/** Pack a workspace package and extract its tarball to `<nodeModules>/<name>`. Returns the packed manifest. */
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

/** `gzip -9 -n` byte count of `bytes`, from the CLI (R9 §2.4: Node zlib gives slightly larger numbers). */
function gzipSize(bytes) {
  const proc = Bun.spawnSync(['gzip', '-9', '-n', '-c'], { stdin: bytes, stdout: 'pipe', stderr: 'pipe' });
  if (proc.exitCode !== 0) throw new Error(`gzip -9 -n failed: ${proc.stderr.toString().trim()}`);
  return proc.stdout.byteLength;
}

/** esbuild `--bundle --minify --format=esm --target=es2022` of `contents`. Returns { minified, gzip, warnings }. */
async function measure(contents, external, resolveDir) {
  const result = await build({
    stdin: { contents, resolveDir, loader: 'js', sourcefile: 'entry.js' },
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2022',
    external,
    nodePaths: [join(ROOT, 'node_modules')],
    write: false,
    logLevel: 'silent',
  });
  const bytes = result.outputFiles[0].contents;
  return { minified: bytes.byteLength, gzip: gzipSize(bytes), warnings: result.warnings };
}

/** Measure each row; a failed row reports its error instead of numbers. */
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

async function main() {
  const scratch = mkdtempSync(join(tmpdir(), 'line-size-'));
  try {
    const nodeModules = join(scratch, 'node_modules');
    const components = await packInto(COMPONENTS, nodeModules, scratch);
    await packInto(CORE, nodeModules, scratch);

    const subpaths = Object.keys(components.exports ?? {}).filter((k) => k !== '.' && k !== './custom-elements.json');
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
    rmSync(scratch, { recursive: true, force: true });
  }
  if (problems.length) {
    console.info(`\nSize report: ${problems.length} measurement problem(s), not gating:`);
    for (const p of problems) console.info(`  - ${p}`);
  }
}

if (import.meta.main) await main();
