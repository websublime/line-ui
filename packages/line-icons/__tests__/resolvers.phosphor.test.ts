import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createPhosphorResolver } from '../src/index.js';
import { type FetchMock, fetchedUrls, mockFetch, PHOSPHOR_BASE, phosphorFile } from './fetch-mock.js';

const invalidNames = ['../sprite', '../../../package.json?', 'house/../x', 'House', 'house.svg', 'house#', ''];
const weights = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'] as const;

let fetchMock: FetchMock;
beforeEach(() => {
  fetchMock = mockFetch();
});
afterEach(() => {
  fetchMock.mockRestore();
});

describe('createPhosphorResolver', () => {
  test.each(weights)('fetches the %s weight from its own file', async (weight) => {
    const svg = await createPhosphorResolver({ base: PHOSPHOR_BASE })('house', { weight });
    expect(svg).toBe(phosphorFile('house', weight));
    if (weight !== 'regular') expect(svg).not.toBe(phosphorFile('house', 'regular'));
    const file = weight === 'regular' ? 'house.svg' : `house-${weight}.svg`;
    expect(fetchedUrls(fetchMock)).toEqual([`${PHOSPHOR_BASE}${weight}/${file}`]);
  });

  test("options.weight 'fill' fetches the fill file", async () => {
    expect(await createPhosphorResolver({ base: PHOSPHOR_BASE })('heart', { weight: 'fill' })).toBe(
      phosphorFile('heart', 'fill'),
    );
    expect(fetchedUrls(fetchMock)).toEqual([`${PHOSPHOR_BASE}fill/heart-fill.svg`]);
  });

  test('defaults to regular', async () => {
    expect(await createPhosphorResolver({ base: PHOSPHOR_BASE })('house')).toBe(phosphorFile('house', 'regular'));
    expect(fetchedUrls(fetchMock)).toEqual([`${PHOSPHOR_BASE}regular/house.svg`]);
  });

  test('applies the factory default weight when options omit it', async () => {
    expect(await createPhosphorResolver({ base: PHOSPHOR_BASE, weight: 'bold' })('house')).toBe(
      phosphorFile('house', 'bold'),
    );
  });

  test('options.weight overrides the factory default', async () => {
    const resolve = createPhosphorResolver({ base: PHOSPHOR_BASE, weight: 'bold' });
    expect(await resolve('house', { weight: 'thin' })).toBe(phosphorFile('house', 'thin'));
    expect(fetchedUrls(fetchMock)).toEqual([`${PHOSPHOR_BASE}thin/house-thin.svg`]);
  });

  test('rejects an unknown icon name with the 404 status', async () => {
    await expect(createPhosphorResolver({ base: PHOSPHOR_BASE })('definitely-not-an-icon')).rejects.toThrow(
      `[line-icons] "${PHOSPHOR_BASE}regular/definitely-not-an-icon.svg" responded with HTTP 404.`,
    );
  });

  test('rejects a network, CORS or CSP failure with a [line-icons] error', async () => {
    const error = await createPhosphorResolver({ base: 'https://blocked.test/assets/' })('house').catch(
      (e: Error) => e,
    );
    expect((error as Error).message).toBe(
      '[line-icons] Could not fetch "https://blocked.test/assets/regular/house.svg".',
    );
    expect((error as Error).cause).toBeInstanceOf(TypeError);
  });

  test.each([undefined, {}, { weight: 'bold' }, { base: '' }])(
    'a resolver created with %p rejects without fetching',
    async (options) => {
      await expect(createPhosphorResolver(options as never)('house')).rejects.toThrow(
        '[line-icons] The resolver needs a `base` URL',
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  test.each(invalidNames)('rejects the invalid name %p before any fetch', async (name) => {
    await expect(createPhosphorResolver({ base: PHOSPHOR_BASE })(name)).rejects.toThrow(
      `[line-icons] Invalid icon name "${name}".`,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test.each(['heavy', '../../x'])('rejects the invalid options.weight %p before any fetch', async (weight) => {
    await expect(createPhosphorResolver({ base: PHOSPHOR_BASE })('house', { weight })).rejects.toThrow(
      `[line-icons] Unknown Phosphor weight "${weight}".`,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('rejects an invalid factory default weight before any fetch', async () => {
    await expect(createPhosphorResolver({ base: PHOSPHOR_BASE, weight: 'heavy' as never })('house')).rejects.toThrow(
      '[line-icons] Unknown Phosphor weight "heavy".',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
