/**
 * `<line-center>` unit tier (spec `0020-center.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`. The component comes from `src/` and `line-core` from its built
 * `dist/` (spec §7.8 rules 1 and 3), so this file needs `bun run build` first, as the CI unit tier has. happy-dom lays
 * nothing out, so child positions and the accessibility tree live in the browser tier
 * (`integration/center/center.e2e.ts`). The test names `LineCenter` as a value, so its import, and the tag, stay (P8).
 *
 * @module __tests__/center
 */

import { describe, expect, spyOn, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import { LineCenter } from '../src/center/index.js';

async function mount(template = html`<line-center><p>a</p></line-center>`): Promise<LineCenter> {
  return fixture<LineCenter>(template);
}

/** Builds a Center from markup, so attribute values reach the element unparsed. */
async function mountMarkup(markup: string): Promise<LineCenter> {
  const host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
  const el = host.querySelector('line-center') as LineCenter;
  await el.updateComplete;
  return el;
}

describe('<line-center> registration and anatomy', () => {
  test('registers line-center with the LineCenter class', () => {
    expect(customElements.get('line-center')).toBe(LineCenter);
  });

  test('the shadow root holds only a bare default slot (P8)', async () => {
    const el = await mount();
    const children = [...(el.shadowRoot?.children ?? [])];
    expect(children.map((child) => child.localName)).toEqual(['slot']);
    expect(children[0]?.hasAttribute('name')).toBe(false);
    expect(children[0]?.hasAttribute('part')).toBe(false);
    expect(el.shadowRoot?.querySelectorAll('[part]').length).toBe(0);
  });

  test('renders the C8 empty state with no attributes and no children', async () => {
    const el = await mount(html`<line-center></line-center>`);
    expect(el.axis).toBe('both');
    expect(el.getAttributeNames()).toEqual([]);
    expect(el.children.length).toBe(0);
    expect(getComputedStyle(el).display).toBe('flex');
  });
});

describe('<line-center> axis (F1; D8)', () => {
  test('reflects a set value and leaves no attribute at both', async () => {
    const el = await mount();
    for (const value of ['horizontal', 'vertical'] as const) {
      el.axis = value;
      await el.updateComplete;
      expect(el.getAttribute('axis')).toBe(value);
    }
    const fresh = await mount();
    expect(fresh.axis).toBe('both');
    expect(fresh.hasAttribute('axis')).toBe(false);
  });

  test('parses every known attribute value', async () => {
    for (const value of ['both', 'horizontal', 'vertical']) {
      const el = await mountMarkup(`<line-center axis="${value}"></line-center>`);
      expect(el.axis).toBe(value);
    }
  });

  test('an unknown value falls back to both and the attribute keeps the author value', async () => {
    const el = await mountMarkup('<line-center axis="diagonal"></line-center>');
    expect(el.axis).toBe('both');
    expect(el.getAttribute('axis')).toBe('diagonal');
  });

  test('removing the attribute restores both', async () => {
    const el = await mountMarkup('<line-center axis="vertical"></line-center>');
    el.removeAttribute('axis');
    await el.updateComplete;
    expect(el.axis).toBe('both');
    expect(el.getAttributeNames()).toEqual([]);
  });
});

describe('<line-center> alignment keywords on :host (F2, F8; P8)', () => {
  test('centres on both axes with safe center and no attribute', async () => {
    const el = await mount();
    const style = getComputedStyle(el);
    expect(style.display).toBe('flex');
    expect(style.flexDirection).toBe('column');
    expect(style.justifyContent).toBe('safe center');
    expect(style.alignItems).toBe('safe center');
  });

  test('horizontal resets justify-content to normal', async () => {
    const el = await mountMarkup('<line-center axis="horizontal"></line-center>');
    const style = getComputedStyle(el);
    expect(style.justifyContent).toBe('normal');
    expect(style.alignItems).toBe('safe center');
  });

  test('vertical resets align-items to normal', async () => {
    const el = await mountMarkup('<line-center axis="vertical"></line-center>');
    const style = getComputedStyle(el);
    expect(style.justifyContent).toBe('safe center');
    expect(style.alignItems).toBe('normal');
  });
});

describe('<line-center> writes nothing on the host and fires nothing (D1, D5, D6)', () => {
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
    const el = await mountMarkup('<line-center role="region" aria-label="Empty state"><p>No results</p></line-center>');
    el.axis = 'vertical';
    await el.updateComplete;
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-label')).toBe('Empty state');
    const internals = Reflect.get(el, INTERNALS) as { role?: string | null };
    expect(internals.role ?? null).toBeNull();
  });

  test('hidden hides the host', async () => {
    const el = await mountMarkup('<line-center hidden></line-center>');
    expect(el.hidden).toBe(true);
    expect(getComputedStyle(el).display).toBe('none');
  });

  test('dispatches no event of any kind', async () => {
    const dispatch = spyOn(LineCenter.prototype, 'dispatchEvent');
    try {
      const el = await mountMarkup('<line-center axis="horizontal"><p>a</p></line-center>');
      el.axis = 'vertical';
      await el.updateComplete;
      el.axis = 'both';
      el.setAttribute('axis', 'x');
      el.click();
      await el.updateComplete;
      expect(dispatch.mock.calls.filter(([event]) => event.type !== 'click')).toEqual([]);
    } finally {
      dispatch.mockRestore();
    }
  });
});
