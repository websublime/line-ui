import { describe, expect, mock, test } from 'bun:test';
import { createLucideResolver, createPhosphorResolver, IconRegistry } from '../src/index.js';

describe('IconRegistry', () => {
  test('dispatches to the registered resolver with the exact arguments', async () => {
    const registry = new IconRegistry();
    const lucide = mock(createLucideResolver());
    const phosphor = mock(createPhosphorResolver());
    registry.register('lucide', lucide);
    registry.register('phosphor', phosphor);

    const lucideCalls: [string, Record<string, unknown> | undefined][] = [
      ['house', undefined],
      ['search', {}],
      ['x', { size: 24 }],
    ];
    for (const [name, options] of lucideCalls) {
      const svg = await registry.resolve('lucide', name, options);
      expect(svg).toBe(await createLucideResolver()(name));
    }
    expect(lucide.mock.calls).toEqual(lucideCalls);

    const phosphorCalls: [string, Record<string, unknown> | undefined][] = [
      ['house', undefined],
      ['magnifying-glass', { weight: 'bold' }],
      ['x', { weight: 'duotone' }],
    ];
    for (const [name, options] of phosphorCalls) {
      const svg = await registry.resolve('phosphor', name, options);
      expect(svg).toBe(await createPhosphorResolver()(name, options));
    }
    expect(phosphor.mock.calls).toEqual(phosphorCalls);
  });

  test('has() reports registration', () => {
    const registry = new IconRegistry();
    registry.register('lucide', createLucideResolver());
    expect(registry.has('lucide')).toBe(true);
    expect(registry.has('phosphor')).toBe(false);
  });

  test('resolve rejects for an unregistered library', async () => {
    const registry = new IconRegistry();
    await expect(registry.resolve('missing', 'house')).rejects.toThrow(
      '[line-icons] No resolver registered for library "missing".',
    );
  });

  test('re-registering a library replaces its resolver', async () => {
    const registry = new IconRegistry();
    const first = mock(async () => 'first');
    const second = mock(async () => 'second');
    registry.register('icons', first);
    registry.register('icons', second);
    expect(await registry.resolve('icons', 'house')).toBe('second');
    expect(first).not.toHaveBeenCalled();
  });
});
