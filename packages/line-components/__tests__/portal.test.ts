/**
 * `<line-portal>` unit tier (spec `0013-portal.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`. happy-dom has no Popover API (spec probe P13), so this tier checks
 * the shadow tree, the attributes, and that nothing throws without it (D7). The component comes from `src/` and
 * `line-core` from its built `dist/` (spec §7.8 rules 1 and 3), so this file needs `bun run build` first, as the CI
 * unit tier has. The top layer, event paths, inheritance, layout and focus live in the browser tier
 * (`integration/portal/portal.e2e.ts`).
 *
 * @module __tests__/portal
 */

import { describe, expect, spyOn, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import type { TemplateResult } from 'lit';
import { LinePortal } from '../src/portal/index.js';

/** Yields one task, after the microtasks that deliver `slotchange`. */
function nextTask(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve);
  return promise;
}

async function mount(template: TemplateResult = html`<line-portal></line-portal>`): Promise<LinePortal> {
  const el = await fixture<LinePortal>(template);
  await el.updateComplete;
  await nextTask();
  return el;
}

function rootOf(el: LinePortal): HTMLElement {
  return el.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
}

function slotOf(el: LinePortal): HTMLSlotElement {
  return el.shadowRoot?.querySelector('slot') as HTMLSlotElement;
}

describe('<line-portal> registration and shadow tree', () => {
  test('registers line-portal with its class', () => {
    expect(customElements.get('line-portal')).toBe(LinePortal);
    expect(document.createElement('line-portal')).toBeInstanceOf(LinePortal);
  });

  test('the shadow root holds one div[part="root"][popover="manual"] with one default slot', async () => {
    const el = await mount(html`<line-portal>content</line-portal>`);
    const root = el.shadowRoot as ShadowRoot;
    expect([...root.querySelectorAll('*')].map((element) => element.localName)).toEqual(['div', 'slot']);
    const part = rootOf(el);
    expect(part.getAttribute('part')).toBe('root');
    expect(part.getAttribute('popover')).toBe('manual');
    expect(slotOf(el).parentElement).toBe(part);
    expect(slotOf(el).hasAttribute('name')).toBe(false);
  });

  test('the Popover API is missing here, as in happy-dom (P13)', () => {
    expect('showPopover' in HTMLElement.prototype).toBe(false);
  });
});

describe('<line-portal> disabled (F4 (b))', () => {
  test('defaults to false and writes no attribute', async () => {
    const el = await mount();
    expect(el.disabled).toBe(false);
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  test('reflects and removes the popover attribute; clearing it restores the attribute', async () => {
    const el = await mount(html`<line-portal>content</line-portal>`);
    el.disabled = true;
    await el.updateComplete;
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(rootOf(el).hasAttribute('popover')).toBe(false);
    el.disabled = false;
    await el.updateComplete;
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(rootOf(el).getAttribute('popover')).toBe('manual');
  });

  test('the attribute sets the property', async () => {
    const el = await mount(html`<line-portal disabled>content</line-portal>`);
    expect(el.disabled).toBe(true);
    expect(rootOf(el).hasAttribute('popover')).toBe(false);
  });
});

describe('<line-portal> without the Popover API nothing throws (D7)', () => {
  test('connect and update', async () => {
    const el = await mount(html`<line-portal>content</line-portal>`);
    el.disabled = true;
    await el.updateComplete;
    el.disabled = false;
    await el.updateComplete;
    el.remove();
    document.body.append(el);
    await el.updateComplete;
    expect(rootOf(el).getAttribute('popover')).toBe('manual');
    el.remove();
  });

  test('bringToFront() before the first update', async () => {
    const el = document.createElement('line-portal');
    expect(() => el.bringToFront()).not.toThrow();
    document.body.append(el);
    expect(() => el.bringToFront()).not.toThrow();
    await el.updateComplete;
    expect(rootOf(el).getAttribute('popover')).toBe('manual');
    el.remove();
  });

  test('bringToFront() while disabled', async () => {
    const el = await mount(html`<line-portal disabled>content</line-portal>`);
    expect(() => el.bringToFront()).not.toThrow();
    expect(rootOf(el).hasAttribute('popover')).toBe(false);
  });

  test('bringToFront() while disconnected', async () => {
    const el = await mount(html`<line-portal>content</line-portal>`);
    el.remove();
    expect(() => el.bringToFront()).not.toThrow();
  });

  test('bringToFront() right after disabled is cleared in the same task', async () => {
    const el = await mount(html`<line-portal disabled>content</line-portal>`);
    el.disabled = false;
    expect(() => el.bringToFront()).not.toThrow();
    await el.updateComplete;
    expect(rootOf(el).getAttribute('popover')).toBe('manual');
  });

  test('bringToFront() after the first update', async () => {
    const el = await mount(html`<line-portal>content</line-portal>`);
    expect(() => el.bringToFront()).not.toThrow();
  });
});

describe('<line-portal> slot', () => {
  test('assigns text and elements to the default slot', async () => {
    const el = await mount(html`<line-portal> Note <input name="note" /></line-portal>`);
    expect(
      slotOf(el)
        .assignedNodes()
        .map((node) => node.nodeName),
    ).toEqual(['#text', 'INPUT']);
  });

  test('content swapped in later is assigned too, and stays in the light DOM', async () => {
    const el = await mount();
    el.innerHTML = '<ul><li>Rename</li></ul>';
    await nextTask();
    expect(
      slotOf(el)
        .assignedElements()
        .map((element) => element.localName),
    ).toEqual(['ul']);
    expect(el.firstElementChild?.parentNode).toBe(el);
  });
});

describe('<line-portal> writes nothing (D2)', () => {
  test('no attribute, no data-* and no internals value', async () => {
    const el = await mount(html`<line-portal>content</line-portal>`);
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
    const dispatch = spyOn(LinePortal.prototype, 'dispatchEvent');
    try {
      const el = await mount(html`<line-portal>content</line-portal>`);
      el.append(' and more');
      el.disabled = true;
      await el.updateComplete;
      el.disabled = false;
      await el.updateComplete;
      el.bringToFront();
      el.click();
      await nextTask();
      expect(dispatch.mock.calls.filter(([event]) => event.type !== 'click')).toEqual([]);
    } finally {
      dispatch.mockRestore();
    }
  });
});

describe('<line-portal> with no content (C8)', () => {
  test('renders an empty root and slot and writes nothing', async () => {
    const el = await mount();
    expect(slotOf(el).assignedNodes()).toEqual([]);
    expect(rootOf(el).getAttribute('popover')).toBe('manual');
    expect(el.getAttributeNames()).toEqual([]);
  });
});
