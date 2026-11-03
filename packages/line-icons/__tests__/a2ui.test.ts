/**
 * `@websublime/line-icons/a2ui` (Phase 1 spec §6.C.3, §6.G.2; §10 SD14, SD15; ledger 01-G2).
 *
 * - The map is keyed by the 59 A2UI names in their internal order. Their parity with the vendored A2UI v0.9.1
 *   basic catalog is checked in `packages/line-genui/__tests__/`, which holds the fixture (§7.8).
 * - Every name of both sets resolves to a file of the installed peer through the reference resolvers.
 * - The map has a `null` prototype and is frozen, carries the consumer's `library` in each entry, and mirrors
 *   exactly the nine names R10 lists.
 *
 * @module __tests__/a2ui
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { a2uiIconMap } from '../src/a2ui/index.js';
import { A2UI_ICON_NAMES } from '../src/a2ui/names.js';
import { createLucideResolver, createPhosphorResolver, IconRegistry } from '../src/index.js';
import { type FetchMock, LUCIDE_BASE, lucideFile, mockFetch, PHOSPHOR_BASE, phosphorFile } from './fetch-mock.js';

const SETS = ['lucide', 'phosphor'] as const;

describe('A2uiIconName (§6.C.3; R10 §2.1)', () => {
  test.each(SETS)('the %s map is keyed by the 59 distinct A2UI names, in their order', (set) => {
    expect(new Set(A2UI_ICON_NAMES).size).toBe(59);
    expect(Object.keys(a2uiIconMap(set, { library: 'icons' }))).toEqual([...A2UI_ICON_NAMES]);
  });
});

describe('a2uiIconMap(set, { library }) (§6.C.3; §10 SD15)', () => {
  let fetchMock: FetchMock;
  beforeEach(() => {
    fetchMock = mockFetch();
  });
  afterEach(() => {
    fetchMock.mockRestore();
  });

  test.each(SETS)('every A2UI name of %s resolves to a file of the installed peer', async (set) => {
    const registry = new IconRegistry();
    registry.register('lucide-here', createLucideResolver({ base: LUCIDE_BASE }));
    registry.register('phosphor-here', createPhosphorResolver({ base: PHOSPHOR_BASE }));
    const map = a2uiIconMap(set, { library: `${set}-here` });

    for (const name of A2UI_ICON_NAMES) {
      const entry = map[name];
      const options = entry.weight === undefined ? undefined : { weight: entry.weight };
      const svg = await registry.resolve(entry.library, entry.name, options);
      expect(svg).toBe(set === 'lucide' ? lucideFile(entry.name) : phosphorFile(entry.name, entry.weight ?? ''));
    }
  });

  test('Phosphor entries carry a weight, fill for the three filled names; Lucide entries carry none', () => {
    const phosphor = a2uiIconMap('phosphor', { library: 'p' });
    const filled = A2UI_ICON_NAMES.filter((name) => phosphor[name].weight === 'fill');
    expect(filled).toEqual(['favorite', 'star', 'starHalf']);
    expect(A2UI_ICON_NAMES.every((name) => phosphor[name].weight !== undefined)).toBe(true);

    const lucide = a2uiIconMap('lucide', { library: 'l' });
    expect(A2UI_ICON_NAMES.some((name) => 'weight' in lucide[name])).toBe(false);
  });

  test.each(SETS)('the %s map has a null prototype and is frozen, entries included', (set) => {
    const map = a2uiIconMap(set, { library: 'icons' });
    expect(Object.getPrototypeOf(map)).toBeNull();
    expect(Object.isFrozen(map)).toBe(true);
    expect(Object.hasOwn(map, 'constructor')).toBe(false);
    expect(A2UI_ICON_NAMES.every((name) => Object.isFrozen(map[name]))).toBe(true);
  });

  test('copies library into each entry and returns a new map per call', () => {
    const first = a2uiIconMap('phosphor', { library: 'brand-icons' });
    const second = a2uiIconMap('phosphor', { library: 'other' });
    expect(new Set(Object.values(first).map((entry) => entry.library))).toEqual(new Set(['brand-icons']));
    expect(new Set(Object.values(second).map((entry) => entry.library))).toEqual(new Set(['other']));
    expect(first.home).toEqual({ library: 'brand-icons', name: 'house', weight: 'regular', mirror: false });
  });

  test.each(SETS)('the %s map mirrors the nine RTL names of R10 and no other', (set) => {
    const map = a2uiIconMap(set, { library: 'icons' });
    const mirrored = A2UI_ICON_NAMES.filter((name) => map[name].mirror);
    expect(mirrored).toEqual([
      'arrowBack',
      'arrowForward',
      'help',
      'send',
      'starHalf',
      'volumeDown',
      'volumeMute',
      'volumeOff',
      'volumeUp',
    ]);
  });

  test('rejects a set it does not know', () => {
    expect(() => a2uiIconMap('material' as 'lucide', { library: 'm' })).toThrow(
      '[line-icons] Unknown A2UI icon set "material".',
    );
  });
});
