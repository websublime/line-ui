import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createLucideResolver } from '../src/index.js';

const require = createRequire(import.meta.url);

function fileFor(name: string): string {
  return readFileSync(require.resolve(`lucide-static/icons/${name}.svg`), 'utf8');
}

const invalidNames = ['../sprite', '../../../package.json?', 'house/../x', 'House', 'house.svg', 'house#', ''];

describe('createLucideResolver', () => {
  const resolve = createLucideResolver();

  test.each(['house', 'search', 'x', 'check'])('resolves %s to its SVG file', async (name) => {
    const svg = await resolve(name);
    expect(svg).toBe(fileFor(name));
    expect(svg as string).toContain('<svg');
  });

  test('rejects an unknown icon name', async () => {
    await expect(resolve('definitely-not-an-icon')).rejects.toThrow();
  });

  test.each(invalidNames)('rejects the invalid name %p before import()', async (name) => {
    await expect(resolve(name)).rejects.toThrow(`[line-icons] Invalid icon name "${name}".`);
  });
});
