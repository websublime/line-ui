/**
 * `<line-separator>` unit tier (spec `0011-separator.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`. The component comes from
 * `src/` and `line-core` from its built `dist/` through the declared dependency
 * (spec §7.8 rules 1 and 3), so this file needs `bun run build` first, as the
 * CI unit tier has. Computed drawing and the accessibility tree live in the
 * browser tier (`integration/separator/separator.e2e.ts`).
 *
 * @module __tests__/separator
 */

import { describe, expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import { LineSeparator } from '../src/separator/index.js';

type InternalsView = { role?: string | null; ariaOrientation?: string | null };

function internalsOf(el: LineSeparator): { role: string | null; ariaOrientation: string | null } {
  const internals = Reflect.get(el, INTERNALS) as InternalsView | undefined;
  return { role: internals?.role ?? null, ariaOrientation: internals?.ariaOrientation ?? null };
}

async function mount(template = html`<line-separator></line-separator>`): Promise<LineSeparator> {
  return fixture<LineSeparator>(template);
}

/** Builds a separator from markup, so attribute values reach the element unparsed. */
async function mountMarkup(markup: string): Promise<LineSeparator> {
  const host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
  const el = host.querySelector('line-separator') as LineSeparator;
  await el.updateComplete;
  return el;
}

describe('<line-separator> defaults and reflection', () => {
  test('registers line-separator with the LineSeparator class', () => {
    expect(customElements.get('line-separator')).toBe(LineSeparator);
  });

  test('defaults to a horizontal, non-decorative separator', async () => {
    const el = await mount();
    expect(el.orientation).toBe('horizontal');
    expect(el.decorative).toBe(false);
  });

  test('writes no attribute for a default, so the :host defaults apply', async () => {
    const el = await mount();
    expect(el.getAttributeNames()).toEqual([]);
  });

  test('reflects every property set from script', async () => {
    const el = await mount();
    el.orientation = 'vertical';
    el.decorative = true;
    await el.updateComplete;
    expect(el.getAttribute('orientation')).toBe('vertical');
    expect(el.hasAttribute('decorative')).toBe(true);
  });

  test('an unknown orientation behaves as horizontal and keeps the author value', async () => {
    const el = await mountMarkup('<line-separator orientation="diagonal"></line-separator>');
    expect(el.orientation).toBe('horizontal');
    expect(el.getAttribute('orientation')).toBe('diagonal');
    expect(internalsOf(el)).toEqual({ role: 'separator', ariaOrientation: null });
  });

  test('removing an attribute restores the default', async () => {
    const el = await mountMarkup('<line-separator orientation="vertical" decorative></line-separator>');
    el.removeAttribute('orientation');
    el.removeAttribute('decorative');
    await el.updateComplete;
    expect(el.orientation).toBe('horizontal');
    expect(el.decorative).toBe(false);
    expect(el.getAttributeNames()).toEqual([]);
  });

  test('decorative parses as a boolean attribute', async () => {
    const el = await mountMarkup('<line-separator decorative="false"></line-separator>');
    expect(el.decorative).toBe(true);
  });
});

describe('<line-separator> internals', () => {
  for (const [markup, expected] of [
    ['<line-separator></line-separator>', { role: 'separator', ariaOrientation: null }],
    ['<line-separator orientation="horizontal"></line-separator>', { role: 'separator', ariaOrientation: null }],
    ['<line-separator orientation="bogus"></line-separator>', { role: 'separator', ariaOrientation: null }],
    ['<line-separator orientation="vertical"></line-separator>', { role: 'separator', ariaOrientation: 'vertical' }],
    ['<line-separator decorative></line-separator>', { role: 'none', ariaOrientation: null }],
    ['<line-separator decorative orientation="vertical"></line-separator>', { role: 'none', ariaOrientation: null }],
  ] as const) {
    test(`${markup} sets ${JSON.stringify(expected)}`, async () => {
      const el = await mountMarkup(markup);
      expect(internalsOf(el)).toEqual(expected);
    });
  }

  test('property changes update the internals', async () => {
    const el = await mount();
    el.orientation = 'vertical';
    await el.updateComplete;
    expect(internalsOf(el)).toEqual({ role: 'separator', ariaOrientation: 'vertical' });
    el.decorative = true;
    await el.updateComplete;
    expect(internalsOf(el)).toEqual({ role: 'none', ariaOrientation: null });
    el.decorative = false;
    await el.updateComplete;
    expect(internalsOf(el)).toEqual({ role: 'separator', ariaOrientation: 'vertical' });
    el.orientation = 'horizontal';
    await el.updateComplete;
    expect(internalsOf(el)).toEqual({ role: 'separator', ariaOrientation: null });
  });
});

describe('<line-separator> shadow tree and accessibility', () => {
  test('the shadow root is empty', async () => {
    const el = await mount();
    expect(el.shadowRoot?.children.length).toBe(0);
    expect(el.shadowRoot?.querySelectorAll('slot, [part]').length).toBe(0);
  });

  test('light-DOM children are not rendered through a slot', async () => {
    const el = await mountMarkup('<line-separator><span>ignored</span></line-separator>');
    expect(el.shadowRoot?.querySelector('slot')).toBeNull();
    expect(el.shadowRoot?.children.length).toBe(0);
  });

  test('writes no role, aria-* or data-* attribute', async () => {
    const el = await mount();
    el.orientation = 'vertical';
    el.decorative = true;
    await el.updateComplete;
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.getAttributeNames().filter((name) => name.startsWith('aria-') || name.startsWith('data-'))).toEqual([]);
  });

  test('leaves an author role, aria-orientation and aria-label unchanged', async () => {
    const el = await mountMarkup(
      '<line-separator role="presentation" aria-orientation="vertical" aria-label="Advanced settings"></line-separator>',
    );
    el.orientation = 'vertical';
    el.decorative = true;
    await el.updateComplete;
    expect(el.getAttribute('role')).toBe('presentation');
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
    expect(el.getAttribute('aria-label')).toBe('Advanced settings');
  });
});
