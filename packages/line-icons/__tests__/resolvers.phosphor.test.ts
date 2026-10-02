import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { createPhosphorResolver } from '../src/index.js';

const invalidNames = ['../sprite', '../../../package.json?', 'house/../x', 'House', 'house.svg', 'house#', ''];
const weights = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'] as const;
const assets = join(dirname(createRequire(import.meta.url).resolve('@phosphor-icons/core/package.json')), 'assets');

function fileFor(name: string, weight: (typeof weights)[number]): string {
  const file = weight === 'regular' ? name : `${name}-${weight}`;
  return readFileSync(join(assets, weight, `${file}.svg`), 'utf8');
}

describe('createPhosphorResolver', () => {
  test.each(weights)('resolves the %s weight to its own file', async (weight) => {
    const svg = await createPhosphorResolver()('house', { weight });
    expect(svg).toBe(fileFor('house', weight));
    if (weight !== 'regular') expect(svg).not.toBe(fileFor('house', 'regular'));
  });

  test('defaults to regular', async () => {
    expect(await createPhosphorResolver()('house')).toBe(fileFor('house', 'regular'));
  });

  test('applies the factory default weight when options omit it', async () => {
    expect(await createPhosphorResolver({ weight: 'bold' })('house')).toBe(fileFor('house', 'bold'));
  });

  test('options.weight overrides the factory default', async () => {
    const resolve = createPhosphorResolver({ weight: 'bold' });
    expect(await resolve('house', { weight: 'thin' })).toBe(fileFor('house', 'thin'));
  });

  test('rejects an unknown icon name', async () => {
    await expect(createPhosphorResolver()('definitely-not-an-icon')).rejects.toThrow();
  });

  test.each(invalidNames)('rejects the invalid name %p before import()', async (name) => {
    await expect(createPhosphorResolver()(name)).rejects.toThrow(`[line-icons] Invalid icon name "${name}".`);
  });

  test.each(['heavy', '../../x'])('rejects the invalid options.weight %p', async (weight) => {
    await expect(createPhosphorResolver()('house', { weight })).rejects.toThrow(
      `[line-icons] Unknown Phosphor weight "${weight}".`,
    );
  });

  test('rejects an invalid factory default weight', async () => {
    await expect(createPhosphorResolver({ weight: 'heavy' as never })('house')).rejects.toThrow(
      '[line-icons] Unknown Phosphor weight "heavy".',
    );
  });
});
