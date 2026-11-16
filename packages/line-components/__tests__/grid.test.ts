/**
 * `<line-grid>` unit tier (spec `0019-grid.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`. The component comes from `src/` and `line-core` from its built
 * `dist/` (spec §7.8 rules 1 and 3), so this file needs `bun run build` first, as the CI unit tier has. happy-dom lays
 * nothing out (P7), so track sizes, gaps, alignment and the accessibility tree live in the browser tier
 * (`integration/grid/grid.e2e.ts`).
 *
 * @module __tests__/grid
 */

import { describe, expect, spyOn, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import { LineGrid } from '../src/grid/index.js';

async function mount(template = html`<line-grid><p>a</p><p>b</p></line-grid>`): Promise<LineGrid> {
  return fixture<LineGrid>(template);
}

/** Builds a grid from markup, so attribute values reach the element unparsed. */
async function mountMarkup(markup: string): Promise<LineGrid> {
  const host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
  const el = host.querySelector('line-grid') as LineGrid;
  await el.updateComplete;
  return el;
}

describe('<line-grid> registration and anatomy', () => {
  test('registers line-grid with the LineGrid class', () => {
    expect(customElements.get('line-grid')).toBe(LineGrid);
  });

  test('the shadow root holds only a bare default slot (P7)', async () => {
    const el = await mount();
    const children = [...(el.shadowRoot?.children ?? [])];
    expect(children.map((child) => child.localName)).toEqual(['slot']);
    expect(children[0]?.hasAttribute('name')).toBe(false);
    expect(children[0]?.hasAttribute('part')).toBe(false);
    expect(el.shadowRoot?.querySelectorAll('[part]').length).toBe(0);
  });

  test('renders the C8 empty state with no attributes and no children', async () => {
    const el = await mount(html`<line-grid></line-grid>`);
    expect(el.columns).toBeUndefined();
    expect(el.minColumnWidth).toBeUndefined();
    expect(el.gap).toBeUndefined();
    expect(el.align).toBe('stretch');
    expect(el.justifyItems).toBe('stretch');
    expect(el.getAttributeNames()).toEqual([]);
    expect(el.children.length).toBe(0);
    expect(getComputedStyle(el).display).toBe('grid');
  });
});

describe('<line-grid> variants reflect (C6, C8; D9)', () => {
  test.each([
    ['columns', 'columns', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']],
    ['minColumnWidth', 'min-column-width', ['none', 'xxs', 'xs', 'sm', 'md']],
    ['gap', 'gap', ['0', '1', '2', '3', '4', '5']],
  ] as const)(
    '%s reflects a set value to %s and leaves no attribute when unset',
    async (property, attribute, values) => {
      const el = await mount();
      for (const value of values) {
        Reflect.set(el, property, value);
        await el.updateComplete;
        expect(el.getAttribute(attribute)).toBe(value);
      }
      Reflect.set(el, property, undefined);
      await el.updateComplete;
      expect(el.hasAttribute(attribute)).toBe(false);
    },
  );

  test('parses every known attribute value', async () => {
    const el = await mountMarkup(
      '<line-grid columns="3" min-column-width="xxs" gap="4" align="center" justify-items="end"></line-grid>',
    );
    expect([el.columns, el.minColumnWidth, el.gap, el.align, el.justifyItems]).toEqual([
      '3',
      'xxs',
      '4',
      'center',
      'end',
    ]);
  });

  test('an unknown variant value keeps the attribute while the property is undefined', async () => {
    const el = await mountMarkup('<line-grid columns="13" min-column-width="lg" gap="9"></line-grid>');
    expect(el.columns).toBeUndefined();
    expect(el.minColumnWidth).toBeUndefined();
    expect(el.gap).toBeUndefined();
    expect(el.getAttribute('columns')).toBe('13');
    expect(el.getAttribute('min-column-width')).toBe('lg');
    expect(el.getAttribute('gap')).toBe('9');
  });
});

describe('<line-grid> align and justifyItems (F4; D9)', () => {
  test('reflect a set value and leave no attribute at stretch', async () => {
    const el = await mount();
    el.align = 'center';
    el.justifyItems = 'end';
    await el.updateComplete;
    expect(el.getAttribute('align')).toBe('center');
    expect(el.getAttribute('justify-items')).toBe('end');
    const fresh = await mount();
    expect(fresh.align).toBe('stretch');
    expect(fresh.justifyItems).toBe('stretch');
    expect(fresh.hasAttribute('align')).toBe(false);
    expect(fresh.hasAttribute('justify-items')).toBe(false);
  });

  test('an unknown value falls back to stretch and the attribute keeps the author value', async () => {
    const el = await mountMarkup('<line-grid align="baseline" justify-items="space-between"></line-grid>');
    expect(el.align).toBe('stretch');
    expect(el.justifyItems).toBe('stretch');
    expect(el.getAttribute('align')).toBe('baseline');
    expect(el.getAttribute('justify-items')).toBe('space-between');
  });

  test('removing an attribute restores the default', async () => {
    const el = await mountMarkup(
      '<line-grid columns="3" min-column-width="none" gap="0" align="start" justify-items="center"></line-grid>',
    );
    for (const name of ['columns', 'min-column-width', 'gap', 'align', 'justify-items']) el.removeAttribute(name);
    await el.updateComplete;
    expect([el.columns, el.minColumnWidth, el.gap, el.align, el.justifyItems]).toEqual([
      undefined,
      undefined,
      undefined,
      'stretch',
      'stretch',
    ]);
    expect(el.getAttributeNames()).toEqual([]);
  });
});

describe('<line-grid> writes nothing on the host and fires nothing (D1, D5, D6)', () => {
  test('writes no role, aria-*, data-* or internals.role', async () => {
    const el = await mount();
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.getAttributeNames().filter((name) => name.startsWith('aria-') || name.startsWith('data-'))).toEqual([]);
    const internals = Reflect.get(el, INTERNALS) as { role?: string | null; states: Set<string> };
    expect(internals.role ?? null).toBeNull();
    expect([...internals.states]).toEqual([]);
    expect(el.tabIndex).toBe(-1);
  });

  test('leaves an author role and name unchanged', async () => {
    const el = await mountMarkup(
      '<line-grid role="list" aria-label="Products"><div role="listitem">a</div></line-grid>',
    );
    el.columns = '2';
    await el.updateComplete;
    expect(el.getAttribute('role')).toBe('list');
    expect(el.getAttribute('aria-label')).toBe('Products');
    const internals = Reflect.get(el, INTERNALS) as { role?: string | null };
    expect(internals.role ?? null).toBeNull();
  });

  test('hidden hides the host', async () => {
    const el = await mountMarkup('<line-grid hidden></line-grid>');
    expect(el.hidden).toBe(true);
    expect(getComputedStyle(el).display).toBe('none');
  });

  test('dispatches no event of any kind', async () => {
    const dispatch = spyOn(LineGrid.prototype, 'dispatchEvent');
    try {
      const el = await mountMarkup(
        '<line-grid columns="3" min-column-width="xxs" gap="3" align="start" justify-items="end"><p>a</p></line-grid>',
      );
      el.columns = '5';
      el.minColumnWidth = 'none';
      el.gap = '0';
      el.align = 'center';
      el.justifyItems = 'start';
      el.setAttribute('columns', 'x');
      el.click();
      await el.updateComplete;
      expect(dispatch.mock.calls.filter(([event]) => event.type !== 'click')).toEqual([]);
    } finally {
      dispatch.mockRestore();
    }
  });
});
