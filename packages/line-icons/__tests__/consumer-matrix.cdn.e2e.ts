/**
 * Consumer matrix, CDN-base pages — CDN tier (spec §6.C.3 acceptance; §6.P.6; §10 SD96; R10 round 2 §2.2, §2.6).
 *
 * Runs only under `LINE_E2E_CDN` (the `playwright.config.ts` gate), from `.github/workflows/cdn-check.yml`.
 * Two no-build pages render the `consumer-matrix/harness.js` cases with bases on the live CDNs, pinned to the
 * installed peer versions:
 *
 *   - jsDelivr: the page imports `@websublime/line-icons` subpaths as `+esm` URLs, and the bases are the jsDelivr
 *     `lucide-static` `icons/` and `@phosphor-icons/core` `assets/` folders. A miss is a readable 404, because
 *     jsDelivr's 404 keeps `access-control-allow-origin: *`.
 *   - unpkg: an import map maps the subpaths to raw unpkg `dist/` files, and the bases are the unpkg folders. A miss
 *     is a network `TypeError`, because unpkg's 404 carries no CORS header.
 *
 * The `line-icons` version under test is not on the CDNs before its release, so the test answers the
 * `@websublime/line-icons` CDN URLs from the packed tarball, as each CDN serves a published version: `+esm` as one
 * esbuild ES module per entry, unpkg as the raw files. Every icon request goes to the live CDN.
 *
 * @module __tests__/consumer-matrix.cdn.e2e
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as esbuild from 'esbuild';
import { type Page, test } from 'playwright/test';
import {
  expectMatrix,
  FIXTURES,
  installPackedTarball,
  LINE_ICONS_VERSION,
  LUCIDE_VERSION,
  PHOSPHOR_VERSION,
  type StaticServer,
  serveFolders,
} from './consumer-matrix/support.js';

const PACKAGE = `@websublime/line-icons@${LINE_ICONS_VERSION}`;
const SUBPATHS = ['registry', 'resolvers/lucide', 'resolvers/phosphor'] as const;
const JSDELIVR = 'https://cdn.jsdelivr.net/npm';
const UNPKG = 'https://unpkg.com';

/** A no-build page: an optional import map, the three subpath imports, and the CDN bases. */
function page(specifiers: Record<(typeof SUBPATHS)[number], string>, bases: [string, string], map = ''): string {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>line-icons consumer matrix (CDN)</title>${map}</head>
  <body>
    <script type="module">
      import { IconRegistry } from '${specifiers.registry}';
      import { createLucideResolver } from '${specifiers['resolvers/lucide']}';
      import { createPhosphorResolver } from '${specifiers['resolvers/phosphor']}';
      import { renderCases } from '/harness/harness.js';

      const registry = new IconRegistry();
      registry.register('lucide', createLucideResolver({ base: '${bases[0]}' }));
      registry.register('phosphor', createPhosphorResolver({ base: '${bases[1]}' }));
      renderCases(registry);
    </script>
  </body>
</html>
`;
}

const CORS_JS = { 'access-control-allow-origin': '*', 'content-type': 'application/javascript; charset=utf-8' };

let scratch: string;
let packed: string;
let server: StaticServer;

test.describe.configure({ retries: 2 });

test.beforeAll(async () => {
  test.setTimeout(120_000);
  scratch = mkdtempSync(join(tmpdir(), 'line-icons-matrix-cdn-'));
  packed = installPackedTarball(scratch);
  const pages = join(scratch, 'pages');
  mkdirSync(pages);
  writeFileSync(
    join(pages, 'jsdelivr.html'),
    page(
      {
        registry: `${JSDELIVR}/${PACKAGE}/registry/+esm`,
        'resolvers/lucide': `${JSDELIVR}/${PACKAGE}/resolvers/lucide/+esm`,
        'resolvers/phosphor': `${JSDELIVR}/${PACKAGE}/resolvers/phosphor/+esm`,
      },
      [
        `${JSDELIVR}/lucide-static@${LUCIDE_VERSION}/icons/`,
        `${JSDELIVR}/@phosphor-icons/core@${PHOSPHOR_VERSION}/assets/`,
      ],
    ),
  );
  const imports = Object.fromEntries(
    SUBPATHS.map((subpath) => [`@websublime/line-icons/${subpath}`, `${UNPKG}/${PACKAGE}/dist/${subpath}.js`]),
  );
  writeFileSync(
    join(pages, 'unpkg.html'),
    page(
      {
        registry: '@websublime/line-icons/registry',
        'resolvers/lucide': '@websublime/line-icons/resolvers/lucide',
        'resolvers/phosphor': '@websublime/line-icons/resolvers/phosphor',
      },
      [`${UNPKG}/lucide-static@${LUCIDE_VERSION}/icons/`, `${UNPKG}/@phosphor-icons/core@${PHOSPHOR_VERSION}/assets/`],
      `<script type="importmap">${JSON.stringify({ imports })}</script>`,
    ),
  );
  server = await serveFolders({ '/pages/': pages, '/harness/': FIXTURES });
});

test.afterAll(async () => {
  await server?.close();
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

/** Answers the `@websublime/line-icons` CDN URLs from the packed tarball; every other request goes out. */
async function routePackedTarball(p: Page): Promise<void> {
  const manifest = JSON.parse(readFileSync(join(packed, 'package.json'), 'utf8'));
  await p.route(`${JSDELIVR}/${PACKAGE}/**/+esm`, async (route) => {
    const subpath = new URL(route.request().url()).pathname.slice(`/npm/${PACKAGE}/`.length, -'/+esm'.length);
    const target: string | undefined = manifest.exports[`./${subpath}`]?.import;
    if (!target) return route.fulfill({ status: 404, headers: CORS_JS, body: '' });
    const out = await esbuild.build({
      entryPoints: [join(packed, target)],
      bundle: true,
      format: 'esm',
      minify: true,
      write: false,
    });
    return route.fulfill({ status: 200, headers: CORS_JS, body: out.outputFiles[0]?.text ?? '' });
  });
  await p.route(`${UNPKG}/${PACKAGE}/**`, (route) => {
    const file = new URL(route.request().url()).pathname.slice(`/${PACKAGE}/`.length);
    return route.fulfill({ status: 200, headers: CORS_JS, body: readFileSync(join(packed, file), 'utf8') });
  });
}

test('jsDelivr +esm page renders icons from jsDelivr bases', async ({ page: p }) => {
  test.setTimeout(120_000);
  await routePackedTarball(p);
  await expectMatrix(p, `${server.origin}/pages/jsdelivr.html`, /responded with HTTP 404\.$/);
});

test('unpkg raw page renders icons from unpkg bases', async ({ page: p }) => {
  test.setTimeout(120_000);
  await routePackedTarball(p);
  // unpkg's 404 carries no CORS header, so the miss surfaces as a network TypeError.
  await expectMatrix(p, `${server.origin}/pages/unpkg.html`, /^\[line-icons\] Could not fetch "/);
});
