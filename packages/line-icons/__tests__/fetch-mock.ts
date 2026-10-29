/**
 * A `fetch` mock for the resolver unit tests (spec §6.C.3; §12 AM-020, L3R14-11).
 *
 * It serves the installed peers as a self-hosted base would: `LUCIDE_BASE` maps to the `lucide-static` `icons/`
 * folder and `PHOSPHOR_BASE` to the `@phosphor-icons/core` `assets/` folder. A missing file answers 404, and any
 * other origin rejects with a `TypeError`, as a network, CORS or CSP failure does in a browser.
 *
 * @module __tests__/fetch-mock
 */

import { type Mock, spyOn } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

export const LUCIDE_DIR = join(dirname(require.resolve('lucide-static/package.json')), 'icons');
export const PHOSPHOR_DIR = join(dirname(require.resolve('@phosphor-icons/core/package.json')), 'assets');

export const LUCIDE_BASE = 'https://icons.test/lucide-static/icons/';
export const PHOSPHOR_BASE = 'https://icons.test/phosphor-icons-core/assets/';

const FOLDERS: [string, string][] = [
  [LUCIDE_BASE, LUCIDE_DIR],
  [PHOSPHOR_BASE, PHOSPHOR_DIR],
];

/** The Lucide file for `name`, read from the installed peer. */
export function lucideFile(name: string): string {
  return readFileSync(join(LUCIDE_DIR, `${name}.svg`), 'utf8');
}

/** The Phosphor file for `name` in `weight`, read from the installed peer. */
export function phosphorFile(name: string, weight: string): string {
  const file = weight === 'regular' ? name : `${name}-${weight}`;
  return readFileSync(join(PHOSPHOR_DIR, weight, `${file}.svg`), 'utf8');
}

function respond(input: string | URL | Request): Response {
  const href = input instanceof Request ? input.url : String(input);
  for (const [base, dir] of FOLDERS) {
    if (!href.startsWith(base)) continue;
    const path = join(dir, decodeURIComponent(href.slice(base.length)));
    if (!(path.startsWith(dir) && existsSync(path))) return new Response('Not Found', { status: 404 });
    return new Response(readFileSync(path, 'utf8'), { status: 200, headers: { 'content-type': 'image/svg+xml' } });
  }
  throw new TypeError('Failed to fetch');
}

/** The spied `fetch`. */
export type FetchMock = Mock<typeof fetch>;

/** Replaces `globalThis.fetch` with the mock; restore it with `mockRestore()` after each test. */
export function mockFetch(): FetchMock {
  return spyOn(globalThis, 'fetch').mockImplementation((async (input: string | URL | Request) =>
    respond(input)) as typeof fetch);
}

/** The URLs the mock received, as strings. */
export function fetchedUrls(fetchMock: FetchMock): string[] {
  return fetchMock.mock.calls.map(([input]) => (input instanceof Request ? input.url : String(input)));
}
