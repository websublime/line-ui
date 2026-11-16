/**
 * `<line-skeleton>` unit tier (spec `0016-skeleton.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`. The component comes from `src/` and `line-core` from its built
 * `dist/` (spec §7.8 rules 1 and 3), so this file needs `bun run build` first, as the CI unit tier has. happy-dom runs
 * no animation and computes no layout (P9), so motion, sizes, colours and the accessibility tree live in the browser
 * tier (`integration/skeleton/skeleton.e2e.ts`).
 *
 * @module __tests__/skeleton
 */

import { describe, expect, spyOn, test } from 'bun:test';
import { fixture } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import { html } from 'lit';
import { LineSkeleton } from '../src/skeleton/index.js';

/** Mounts `<line-skeleton>` with the given attributes. */
async function mount(attributes: Record<string, string> = {}): Promise<LineSkeleton> {
  const el = document.createElement('line-skeleton');
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  await fixture<LineSkeleton>(html`${el}`);
  await el.updateComplete;
  return el;
}

function rootOf(el: LineSkeleton): HTMLElement {
  return el.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
}

function items(el: LineSkeleton): number {
  return rootOf(el).querySelectorAll('[part="item"]').length;
}

describe('<line-skeleton> registration and anatomy', () => {
  test('registers line-skeleton with LineSkeleton', () => {
    expect(customElements.get('line-skeleton')).toBe(LineSkeleton);
  });

  test('renders the root part holding one item part by default, and nothing else', async () => {
    const el = await mount();
    const root = rootOf(el);
    expect(root.tagName).toBe('DIV');
    expect(items(el)).toBe(1);
    expect(root.children).toHaveLength(1);
    expect(root.firstElementChild?.tagName).toBe('DIV');
    expect(root.textContent).toBe('');
    expect(el.shadowRoot?.querySelector('slot')).toBeNull();
  });

  test('root carries aria-hidden="true" (F1)', async () => {
    expect(rootOf(await mount()).getAttribute('aria-hidden')).toBe('true');
  });
});

describe('<line-skeleton> lines (D8)', () => {
  test('lines from 1 to 20 draws that many items', async () => {
    for (let n = 1; n <= 20; n += 1) {
      expect(items(await mount({ lines: String(n) }))).toBe(n);
    }
  });

  test.each([
    ['0', 1],
    ['-2', 1],
    ['2.5', 1],
    ['NaN', 1],
    ['x', 1],
    [' 3 ', 3],
    ['1e1', 10],
    ['21', 20],
  ])('lines="%s" draws %d', async (value, expected) => {
    expect(items(await mount({ lines: value }))).toBe(expected);
  });

  test('a property set to 2.5, "2.5", NaN or a non-number draws one item and throws nothing', async () => {
    const el = await mount({ lines: '4' });
    for (const value of [2.5, '2.5', Number.NaN, { n: 3 }, null, undefined]) {
      Reflect.set(el, 'lines', value);
      await el.updateComplete;
      expect(items(el)).toBe(1);
    }
  });

  test('a changed lines property redraws the same host', async () => {
    const el = await mount();
    el.lines = 3;
    await el.updateComplete;
    expect(items(el)).toBe(3);
  });
});

describe('<line-skeleton> shape and animation reflect (C6, C8; D8)', () => {
  test('the defaults leave no attribute', async () => {
    const el = await mount();
    expect(el.shape).toBe('rect');
    expect(el.animation).toBe('pulse');
    expect(el.lines).toBe(1);
    expect(el.getAttributeNames()).toEqual([]);
  });

  test('a value set in code is written to the attribute', async () => {
    const el = await mount();
    el.shape = 'circle';
    el.animation = 'wave';
    await el.updateComplete;
    expect(el.getAttribute('shape')).toBe('circle');
    expect(el.getAttribute('animation')).toBe('wave');
  });

  test('an author attribute reaches the property', async () => {
    const el = await mount({ shape: 'text', animation: 'none' });
    expect(el.shape).toBe('text');
    expect(el.animation).toBe('none');
  });

  test('an unknown value stays in the attribute, which no stylesheet rule matches, and draws as the default', async () => {
    const el = await mount({ shape: 'hexagon', animation: 'spin' });
    expect(el.getAttribute('shape')).toBe('hexagon');
    expect(el.getAttribute('animation')).toBe('spin');
    expect(items(el)).toBe(1);
    const sheet = LineSkeleton.styles;
    const text = (Array.isArray(sheet) ? sheet : [sheet]).map((each) => String(each)).join('\n');
    expect(text).not.toContain('hexagon');
    expect(text).not.toContain('spin');
  });
});

describe('<line-skeleton> writes nothing on the host and fires nothing (D1, D2, D7)', () => {
  test('no attribute, no role, no aria-* and no internals value on the host', async () => {
    const el = await mount();
    expect(el.getAttributeNames()).toEqual([]);
    const internals = Reflect.get(el, INTERNALS) as {
      role: string | null;
      ariaHidden: string | null;
      ariaBusy: string | null;
      ariaLabel: string | null;
      states: Set<string>;
    };
    expect(internals.role ?? null).toBeNull();
    expect(internals.ariaHidden ?? null).toBeNull();
    expect(internals.ariaBusy ?? null).toBeNull();
    expect(internals.ariaLabel ?? null).toBeNull();
    expect([...internals.states]).toEqual([]);
    expect(el.tabIndex).toBe(-1);
  });

  test('hidden hides the host', async () => {
    const el = await mount({ hidden: '' });
    expect(el.hidden).toBe(true);
    expect(getComputedStyle(el).display).toBe('none');
  });

  test('dispatches no event of any kind', async () => {
    const dispatch = spyOn(LineSkeleton.prototype, 'dispatchEvent');
    try {
      const el = await mount({ shape: 'text', lines: '2', animation: 'wave' });
      el.shape = 'circle';
      el.lines = 5;
      el.animation = 'none';
      el.setAttribute('lines', 'x');
      el.click();
      await el.updateComplete;
      expect(dispatch.mock.calls.filter(([event]) => event.type !== 'click')).toEqual([]);
    } finally {
      dispatch.mockRestore();
    }
  });
});
