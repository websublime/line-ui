import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createLucideResolver } from '../src/index.js';
import { type FetchMock, fetchedUrls, LUCIDE_BASE, lucideFile, mockFetch } from './fetch-mock.js';

const invalidNames = ['../sprite', '../../../package.json?', 'house/../x', 'House', 'house.svg', 'house#', ''];

let fetchMock: FetchMock;
beforeEach(() => {
  fetchMock = mockFetch();
});
afterEach(() => {
  fetchMock.mockRestore();
  for (const base of document.querySelectorAll('base')) base.remove();
});

describe('createLucideResolver', () => {
  const resolve = createLucideResolver({ base: LUCIDE_BASE });

  test.each(['house', 'search', 'x', 'check'])('fetches <base>%s.svg and returns its text', async (name) => {
    const svg = await resolve(name);
    expect(svg).toBe(lucideFile(name));
    expect(svg as string).toContain('<svg');
    expect(fetchedUrls(fetchMock)).toEqual([`${LUCIDE_BASE}${name}.svg`]);
  });

  test('accepts a URL object as base', async () => {
    expect(await createLucideResolver({ base: new URL(LUCIDE_BASE) })('house')).toBe(lucideFile('house'));
  });

  test('resolves a path-only base against document.baseURI', async () => {
    const base = document.createElement('base');
    base.href = 'https://icons.test/app/page.html';
    document.head.append(base);
    expect(await createLucideResolver({ base: '/lucide-static/icons/' })('house')).toBe(lucideFile('house'));
    expect(fetchedUrls(fetchMock)).toEqual([`${LUCIDE_BASE}house.svg`]);
  });

  test('rejects an unknown icon name with the 404 status', async () => {
    await expect(resolve('definitely-not-an-icon')).rejects.toThrow(
      `[line-icons] "${LUCIDE_BASE}definitely-not-an-icon.svg" responded with HTTP 404.`,
    );
  });

  test('rejects a network, CORS or CSP failure with a [line-icons] error', async () => {
    const error = await createLucideResolver({ base: 'https://blocked.test/icons/' })('house').catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('[line-icons] Could not fetch "https://blocked.test/icons/house.svg".');
    expect((error as Error).cause).toBeInstanceOf(TypeError);
  });

  test.each([undefined, {}, { base: '' }])('a resolver created with %p rejects without fetching', async (options) => {
    await expect(createLucideResolver(options as never)('house')).rejects.toThrow(
      '[line-icons] The resolver needs a `base` URL',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('rejects a path-only base when the document has no base URL', async () => {
    await expect(createLucideResolver({ base: '/lucide-static/icons/' })('house')).rejects.toThrow(
      '[line-icons] Invalid base URL "/lucide-static/icons/".',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test.each(invalidNames)('rejects the invalid name %p before any fetch', async (name) => {
    await expect(resolve(name)).rejects.toThrow(`[line-icons] Invalid icon name "${name}".`);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('rejects a name whose toString changes between calls', async () => {
    let n = 0;
    const shifty = { toString: () => (n++ ? '../sprite' : 'house') };
    await expect(resolve(shifty as never)).rejects.toThrow('[line-icons] Invalid icon name "house".');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
