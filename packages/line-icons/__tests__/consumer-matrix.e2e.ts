/**
 * Consumer matrix, bundler pages — browser tier (spec §6.C.3 acceptance; §10 SD96; R10 round 2 §2.1, §2.2).
 *
 * Packs `@websublime/line-icons` with `bun pm pack`, installs the tarball into a scratch consumer, and builds the
 * consumer entry `consumer-matrix/main.js` with Vite 8, esbuild and webpack in production mode, with no plugin,
 * loader or alias. Each page imports `./registry`, `./resolvers/lucide` and `./resolvers/phosphor` and sets
 * path-only bases to a self-hosted copy of the installed peers' `icons/` and `assets/` folders. In each engine every
 * build must render Lucide and Phosphor `house` and `rocket` and Phosphor `heart` in `fill`, reject
 * `definitely-not-an-icon` with a `[line-icons]` 404 error, throw nothing uncaught, and request nothing outside the
 * page's own origin. `consumer-matrix.cdn.e2e.ts` covers the CDN-base pages.
 *
 * @module __tests__/consumer-matrix.e2e
 */

import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import * as esbuild from 'esbuild';
import { expect, test } from 'playwright/test';
import { build as viteBuild } from 'vite';
import webpack from 'webpack';
import {
  expectMatrix,
  FIXTURES,
  installPackedTarball,
  LUCIDE_DIR,
  PHOSPHOR_DIR,
  type StaticServer,
  serveFolders,
} from './consumer-matrix/support.js';

const BUNDLERS = ['vite', 'esbuild', 'webpack'] as const;
type Bundler = (typeof BUNDLERS)[number];

/** The page shell for the esbuild and webpack outputs; Vite emits its own from `consumer-matrix/index.html`. */
const shell = (script: string): string =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>line-icons consumer matrix</title></head><body>${script}</body></html>`;

async function buildWith(bundler: Bundler, consumer: string, outDir: string): Promise<void> {
  const entry = join(consumer, 'main.js');
  if (bundler === 'vite') {
    await viteBuild({
      root: consumer,
      base: './',
      configFile: false,
      logLevel: 'error',
      build: { outDir, emptyOutDir: true },
    });
    return;
  }
  mkdirSync(outDir, { recursive: true });
  if (bundler === 'esbuild') {
    await esbuild.build({
      absWorkingDir: consumer,
      entryPoints: [entry],
      bundle: true,
      splitting: true,
      format: 'esm',
      minify: true,
      outdir: outDir,
      logLevel: 'error',
    });
    writeFileSync(join(outDir, 'index.html'), shell('<script type="module" src="./main.js"></script>'));
    return;
  }
  const stats = await promisify(webpack)({
    mode: 'production',
    context: consumer,
    entry,
    output: { path: outDir, filename: 'main.js' },
  });
  if (!stats || stats.hasErrors()) throw new Error(`webpack build failed: ${stats?.toString('errors-only')}`);
  writeFileSync(join(outDir, 'index.html'), shell('<script src="./main.js" defer></script>'));
}

let scratch: string;
let server: StaticServer;

test.beforeAll(async () => {
  test.setTimeout(180_000);
  scratch = mkdtempSync(join(tmpdir(), 'line-icons-matrix-'));
  const consumer = join(scratch, 'consumer');
  mkdirSync(consumer);
  installPackedTarball(consumer);
  for (const file of ['index.html', 'main.js', 'harness.js']) cpSync(join(FIXTURES, file), join(consumer, file));
  for (const bundler of BUNDLERS) await buildWith(bundler, consumer, join(scratch, 'out', bundler));
  server = await serveFolders({
    '/vite/': join(scratch, 'out', 'vite'),
    '/esbuild/': join(scratch, 'out', 'esbuild'),
    '/webpack/': join(scratch, 'out', 'webpack'),
    // The self-host recipe: serve the peers' icon folders as they install.
    '/vendor/lucide-static/icons/': join(LUCIDE_DIR, 'icons'),
    '/vendor/phosphor-icons-core/assets/': join(PHOSPHOR_DIR, 'assets'),
  });
});

test.afterAll(async () => {
  await server?.close();
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

for (const bundler of BUNDLERS) {
  test(`${bundler} build of the packed tarball renders icons from a self-hosted base`, async ({ page }) => {
    const foreign: string[] = [];
    page.on('request', (request) => {
      if (!request.url().startsWith(`${server.origin}/`)) foreign.push(request.url());
    });
    await expectMatrix(page, `${server.origin}/${bundler}/`, /responded with HTTP 404\.$/);
    expect(foreign, 'requests outside the page origin').toEqual([]);
  });
}
