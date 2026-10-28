/**
 * `<line-stack>` unit tier (spec `0018-stack.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`. The component comes from
 * `src/` and `line-core` from its built `dist/` through the declared dependency
 * (spec §7.8 rules 1 and 3), so this file needs `bun run build` first, as the
 * CI unit tier has. Computed layout lives in the browser tier
 * (`integration/stack/stack.e2e.ts`), because happy-dom lays nothing out.
 *
 * @module __tests__/stack
 */

import { describe, expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import { LineStack } from '../src/stack/index.js';

async function mount(template = html`<line-stack><p>a</p><p>b</p></line-stack>`): Promise<LineStack> {
  return fixture<LineStack>(template);
}

/** Builds a stack from markup, so attribute values reach the element unparsed. */
async function mountMarkup(markup: string): Promise<LineStack> {
  const host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
  const el = host.querySelector('line-stack') as LineStack;
  await el.updateComplete;
  return el;
}

describe('<line-stack> defaults and reflection', () => {
  test('registers line-stack with the LineStack class', () => {
    expect(customElements.get('line-stack')).toBe(LineStack);
  });

  test('renders the C8 empty state with no attributes and no children', async () => {
    const el = await mount(html`<line-stack></line-stack>`);
    expect(el.orientation).toBe('vertical');
    expect(el.justify).toBe('start');
    expect(el.align).toBe('stretch');
    expect(el.gap).toBeUndefined();
    expect(el.wrap).toBe(false);
    expect(el.hasAttribute('gap')).toBe(false);
    expect(el.hasAttribute('wrap')).toBe(false);
    expect(el.children.length).toBe(0);
  });

  test('writes no attribute for a default, so the :host defaults apply', async () => {
    const el = await mount();
    expect(el.getAttributeNames()).toEqual([]);
  });

  test('reflects every property set from script', async () => {
    const el = await mount();
    el.orientation = 'horizontal';
    el.justify = 'spaceBetween';
    el.align = 'center';
    el.gap = '4';
    el.wrap = true;
    await el.updateComplete;
    expect(el.getAttribute('orientation')).toBe('horizontal');
    expect(el.getAttribute('justify')).toBe('spaceBetween');
    expect(el.getAttribute('align')).toBe('center');
    expect(el.getAttribute('gap')).toBe('4');
    expect(el.hasAttribute('wrap')).toBe(true);
    el.gap = undefined;
    el.wrap = false;
    await el.updateComplete;
    expect(el.hasAttribute('gap')).toBe(false);
    expect(el.hasAttribute('wrap')).toBe(false);
  });

  test('parses every known attribute value', async () => {
    const el = await mountMarkup(
      '<line-stack orientation="horizontal" justify="spaceEvenly" align="end" gap="0" wrap></line-stack>',
    );
    expect([el.orientation, el.justify, el.align, el.gap, el.wrap]).toEqual([
      'horizontal',
      'spaceEvenly',
      'end',
      '0',
      true,
    ]);
  });
});

describe('<line-stack> C8 converters', () => {
  test('unknown enum values fall back to the defaults and the attributes keep the author values', async () => {
    const el = await mountMarkup(
      '<line-stack orientation="sideways" justify="space-between" align="baseline" gap="9"></line-stack>',
    );
    expect(el.orientation).toBe('vertical');
    expect(el.justify).toBe('start');
    expect(el.align).toBe('stretch');
    expect(el.gap).toBeUndefined();
    expect(el.getAttribute('orientation')).toBe('sideways');
    expect(el.getAttribute('justify')).toBe('space-between');
    expect(el.getAttribute('align')).toBe('baseline');
    expect(el.getAttribute('gap')).toBe('9');
  });

  test('removing an attribute restores the default', async () => {
    const el = await mountMarkup('<line-stack orientation="horizontal" justify="end" align="center"></line-stack>');
    for (const name of ['orientation', 'justify', 'align']) el.removeAttribute(name);
    await el.updateComplete;
    expect([el.orientation, el.justify, el.align]).toEqual(['vertical', 'start', 'stretch']);
    expect(el.getAttributeNames()).toEqual([]);
  });

  test('wrap is a boolean attribute: present is true, whatever its value', async () => {
    const el = await mountMarkup('<line-stack wrap="false"></line-stack>');
    expect(el.wrap).toBe(true);
    el.removeAttribute('wrap');
    await el.updateComplete;
    expect(el.wrap).toBe(false);
  });
});

describe('<line-stack> shadow tree and accessibility', () => {
  test('the shadow root holds only a bare default slot', async () => {
    const el = await mount();
    const children = [...(el.shadowRoot?.children ?? [])];
    expect(children.map((child) => child.localName)).toEqual(['slot']);
    expect(children[0]?.hasAttribute('name')).toBe(false);
    expect(children[0]?.hasAttribute('part')).toBe(false);
    expect(el.shadowRoot?.querySelectorAll('[part]').length).toBe(0);
  });

  test('writes no role, aria-* or internals.role', async () => {
    const el = await mount();
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);
    const internals = Reflect.get(el, INTERNALS) as { role?: string | null } | undefined;
    expect(internals?.role ?? null).toBeNull();
  });

  test('leaves an author role and name unchanged', async () => {
    const el = await mountMarkup(
      '<line-stack role="list" aria-label="Recent files"><div role="listitem">a</div></line-stack>',
    );
    el.orientation = 'horizontal';
    await el.updateComplete;
    expect(el.getAttribute('role')).toBe('list');
    expect(el.getAttribute('aria-label')).toBe('Recent files');
    const internals = Reflect.get(el, INTERNALS) as { role?: string | null } | undefined;
    expect(internals?.role ?? null).toBeNull();
  });

  test('writes no data-* state attribute', async () => {
    const el = await mount();
    expect(el.getAttributeNames().filter((name) => name.startsWith('data-'))).toEqual([]);
  });
});
