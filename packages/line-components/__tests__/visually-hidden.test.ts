/**
 * `<line-visually-hidden>` unit tier (spec `0012-visually-hidden.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`, which applies the adopted `:host` rule, so the hidden-state
 * `position` reads back (spec probe P8). The component comes from `src/` and `line-core` from its built `dist/` (spec
 * §7.8 rules 1 and 3), so this file needs `bun run build` first, as the CI unit tier has. Layout, the focus reveal and
 * `:not(:defined)` live in the browser tier (`integration/visually-hidden/visually-hidden.e2e.ts`).
 *
 * @module __tests__/visually-hidden
 */

import { describe, expect, spyOn, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import type { TemplateResult } from 'lit';
import { LineVisuallyHidden } from '../src/visually-hidden/index.js';

/** Yields one task, after the microtasks that deliver `slotchange`. */
function nextTask(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve);
  return promise;
}

async function mount(
  template: TemplateResult = html`<line-visually-hidden></line-visually-hidden>`,
): Promise<LineVisuallyHidden> {
  const el = await fixture<LineVisuallyHidden>(template);
  await el.updateComplete;
  await nextTask();
  return el;
}

function slotOf(el: LineVisuallyHidden): HTMLSlotElement {
  return el.shadowRoot?.querySelector('slot') as HTMLSlotElement;
}

describe('<line-visually-hidden> registration and shadow tree', () => {
  test('registers line-visually-hidden with its class', () => {
    expect(customElements.get('line-visually-hidden')).toBe(LineVisuallyHidden);
    expect(document.createElement('line-visually-hidden')).toBeInstanceOf(LineVisuallyHidden);
  });

  test('the shadow root holds one default slot and nothing else, and no element carries part', async () => {
    const el = await mount(html`<line-visually-hidden> unread messages</line-visually-hidden>`);
    const root = el.shadowRoot as ShadowRoot;
    const elements = [...root.querySelectorAll('*')];
    expect(elements.map((element) => element.localName)).toEqual(['slot']);
    expect(slotOf(el).hasAttribute('name')).toBe(false);
    expect(root.querySelectorAll('[part]')).toHaveLength(0);
  });

  test('the host is absolutely positioned while nothing inside has focus (P8)', async () => {
    const el = await mount(html`<line-visually-hidden>words</line-visually-hidden>`);
    expect(getComputedStyle(el).position).toBe('absolute');
  });
});

describe('<line-visually-hidden> slot', () => {
  test('assigns text and elements to the default slot', async () => {
    const el = await mount(html`<line-visually-hidden> 5 unread <a href="#inbox">link</a></line-visually-hidden>`);
    const assigned = slotOf(el).assignedNodes();
    expect(assigned.map((node) => node.nodeName)).toEqual(['#text', 'A']);
    expect(el.textContent).toBe(' 5 unread link');
  });

  test('content swapped in later is assigned too', async () => {
    const el = await mount();
    el.innerHTML = '<h2>Account settings</h2>';
    await nextTask();
    expect(
      slotOf(el)
        .assignedElements()
        .map((element) => element.localName),
    ).toEqual(['h2']);
  });
});

describe('<line-visually-hidden> writes nothing (D2, D7)', () => {
  test('no attribute, no data-* and no internals value', async () => {
    const el = await mount(html`<line-visually-hidden>words</line-visually-hidden>`);
    expect(el.getAttributeNames()).toEqual([]);
    const internals = Reflect.get(el, INTERNALS) as {
      role: string | null;
      ariaHidden: string | null;
      ariaLabel: string | null;
      states: Set<string>;
    };
    expect(internals.role ?? null).toBeNull();
    expect(internals.ariaHidden ?? null).toBeNull();
    expect(internals.ariaLabel ?? null).toBeNull();
    expect([...internals.states]).toEqual([]);
  });

  test('dispatches no event of any kind', async () => {
    const dispatch = spyOn(LineVisuallyHidden.prototype, 'dispatchEvent');
    try {
      const el = await mount(html`<line-visually-hidden>words</line-visually-hidden>`);
      el.append(' and more');
      el.click();
      await el.updateComplete;
      await nextTask();
      expect(dispatch.mock.calls.filter(([event]) => event.type !== 'click')).toEqual([]);
    } finally {
      dispatch.mockRestore();
    }
  });
});

describe('<line-visually-hidden> with no content (C8)', () => {
  test('renders an empty slot and stays hidden', async () => {
    const el = await mount();
    expect(slotOf(el).assignedNodes()).toEqual([]);
    expect(el.getAttributeNames()).toEqual([]);
    expect(getComputedStyle(el).position).toBe('absolute');
  });
});
