import { describe, expect, test } from 'bun:test';
import { createLucideResolver } from '../src/index.js';

describe('createLucideResolver', () => {
  const resolve = createLucideResolver();

  test.each(['house', 'search', 'x', 'check'])('resolves %s to SVG text', async (name) => {
    const svg = await resolve(name);
    expect(svg).toBeString();
    expect(svg as string).toContain('<svg');
  });

  test('rejects an unknown icon name', async () => {
    await expect(resolve('definitely-not-an-icon')).rejects.toThrow();
  });
});
