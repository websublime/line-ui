/**
 * Consumer matrix — the Node half shared by `consumer-matrix.e2e.ts` and `consumer-matrix.cdn.e2e.ts`
 * (spec §6.C.3 acceptance; §10 SD96).
 *
 * It packs `@websublime/line-icons` the way it publishes, serves folders over a local HTTP server, and checks the
 * results that `harness.js` leaves on a matrix page.
 *
 * @module __tests__/consumer-matrix/support
 */

import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { expect, type Page } from 'playwright/test';

const require = createRequire(import.meta.url);
const versionOf = (dir: string): string => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;

/** This folder: `harness.js`, `main.js` and `index.html`. */
export const FIXTURES = dirname(fileURLToPath(import.meta.url));
export const PACKAGE_DIR = resolve(FIXTURES, '../..');

/** The installed peers, which a self-hosted base serves and a CDN base pins. */
export const LUCIDE_DIR = dirname(require.resolve('lucide-static/package.json'));
// `@phosphor-icons/core` exports no `./package.json` under Node, so resolve an exported icon and climb to the root.
export const PHOSPHOR_DIR = resolve(require.resolve('@phosphor-icons/core/assets/regular/house.svg'), '../../..');
export const LUCIDE_VERSION = versionOf(LUCIDE_DIR);
export const PHOSPHOR_VERSION = versionOf(PHOSPHOR_DIR);
export const LINE_ICONS_VERSION = versionOf(PACKAGE_DIR);

/**
 * Packs the package with `bun pm pack`, as `scripts/verify-pack.mjs` and the publish path do, and extracts the
 * tarball into `<dir>/node_modules/@websublime/line-icons`. Needs the `dist/` that `bun run build` writes.
 */
export function installPackedTarball(dir: string): string {
  if (!existsSync(join(PACKAGE_DIR, 'dist', 'registry.js'))) {
    throw new Error('packages/line-icons/dist/registry.js is missing; run `bun run build` first.');
  }
  // Piped, so Bun's own notices (such as a user `.npmrc` warning) stay out of the test report; a failure still throws.
  execFileSync('bun', ['pm', 'pack', '--destination', dir, '--quiet', '--ignore-scripts'], {
    cwd: PACKAGE_DIR,
    stdio: 'pipe',
  });
  const tarball = readdirSync(dir).find((file) => file.endsWith('.tgz'));
  if (!tarball) throw new Error(`bun pm pack wrote no tarball to ${dir}`);
  const scope = join(dir, 'node_modules', '@websublime');
  mkdirSync(scope, { recursive: true });
  execFileSync('tar', ['-xzf', join(dir, tarball), '-C', scope]);
  const target = join(scope, 'line-icons');
  renameSync(join(scope, 'package'), target);
  return target;
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

export interface StaticServer {
  readonly origin: string;
  close(): Promise<void>;
}

/**
 * Serves each folder under its URL prefix (`/vendor/lucide-static/` → a folder) on `127.0.0.1`. A folder path
 * serves its `index.html`; anything else outside the folders answers 404.
 */
export async function serveFolders(folders: Record<string, string>): Promise<StaticServer> {
  const prefixes = Object.keys(folders).sort((a, b) => b.length - a.length);
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const prefix = prefixes.find((p) => pathname.startsWith(p));
    const root = prefix === undefined ? undefined : folders[prefix];
    let file = root === undefined || prefix === undefined ? undefined : join(root, pathname.slice(prefix.length));
    if (file !== undefined && existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (root === undefined || file === undefined || !file.startsWith(root + sep) || !existsSync(file)) {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('Not Found');
      return;
    }
    const type = CONTENT_TYPES[extname(file)] ?? 'application/octet-stream';
    response.writeHead(200, { 'content-type': type }).end(readFileSync(file));
  });
  await once(server.listen(0, '127.0.0.1'), 'listening');
  const { port } = server.address() as AddressInfo;
  return { origin: `http://127.0.0.1:${port}`, close: promisify(server.close.bind(server)) };
}

/** The SVG text of a case, read from the installed peer. */
function expectedSvg(library: string, name: string, weight = 'regular'): string {
  if (library === 'lucide') return readFileSync(join(LUCIDE_DIR, 'icons', `${name}.svg`), 'utf8');
  const file = weight === 'regular' ? name : `${name}-${weight}`;
  return readFileSync(join(PHOSPHOR_DIR, 'assets', weight, `${file}.svg`), 'utf8');
}

const RESOLVED: [id: string, library: string, name: string, weight?: string][] = [
  ['lucide-house', 'lucide', 'house'],
  ['lucide-rocket', 'lucide', 'rocket'],
  ['phosphor-house', 'phosphor', 'house'],
  ['phosphor-heart-fill', 'phosphor', 'heart', 'fill'],
  ['phosphor-rocket', 'phosphor', 'rocket'],
];
const REJECTED = ['lucide-unknown', 'phosphor-unknown'];

interface CaseResult {
  readonly ok: boolean;
  readonly svg?: string;
  readonly error?: string;
}

/**
 * Opens a matrix page and checks every case of `harness.js`: each in-set icon resolves to the peer's file and
 * renders an `<svg>` with drawn children, the unknown name rejects with a `[line-icons]` error that matches
 * `miss`, and the page throws nothing uncaught.
 */
export async function expectMatrix(page: Page, url: string, miss: RegExp): Promise<void> {
  const uncaught: string[] = [];
  page.on('pageerror', (error) => {
    // WebKit also reports a fetch blocked by CORS as a page error, though the resolver catches the rejection.
    if (!error.message.endsWith('due to access control checks.')) uncaught.push(error.message);
  });
  await page.goto(url);
  await expect(page.locator('html')).toHaveAttribute('data-matrix', 'done', { timeout: 60_000 });
  const results = await page.evaluate<Record<string, CaseResult>>(() => Reflect.get(window, 'lineIconsMatrix'));

  for (const [id, library, name, weight] of RESOLVED) {
    expect.soft(results[id], id).toEqual({ ok: true, svg: expectedSvg(library, name, weight) });
    const svg = page.locator(`#${id} > svg`);
    await expect.soft(svg, id).toBeVisible();
    expect.soft(await svg.locator('> *').count(), `${id} drawn children`).toBeGreaterThan(0);
  }
  for (const id of REJECTED) {
    expect.soft(results[id]?.ok, id).toBe(false);
    expect.soft(results[id]?.error, id).toMatch(/^\[line-icons\] /);
    expect.soft(results[id]?.error, id).toMatch(miss);
    await expect.soft(page.locator(`#${id}`), id).toHaveAttribute('data-state', 'rejected');
  }
  expect(uncaught, 'uncaught page errors').toEqual([]);
}
