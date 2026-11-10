/**
 * `<line-badge>` unit tier (spec `0007-badge.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`, whose fake internals hold `role`, `ariaHidden` and `states`.
 * The component comes from `src/` and `line-core` from its built `dist/` (spec §7.8 rules 1 and 3), so this file
 * needs `bun run build` first, as the CI unit tier has. Layout, computed colours, focus and the accessibility tree
 * live in the browser tier (`integration/badge/badge.e2e.ts`).
 *
 * @module __tests__/badge
 */

import { describe, expect, spyOn, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import type { TemplateResult } from 'lit';
import { LineBadge } from '../src/badge/index.js';

interface Semantics {
  role: string | null;
  ariaHidden: string | null;
}

function internalsOf(el: LineBadge): Semantics & { states: Set<string> } {
  const internals = Reflect.get(el, INTERNALS) as
    | { role?: string | null; ariaHidden?: string | null; states: Set<string> }
    | undefined;
  return {
    role: internals?.role ?? null,
    ariaHidden: internals?.ariaHidden ?? null,
    states: internals?.states ?? new Set(),
  };
}

function semanticsOf(el: LineBadge): Semantics {
  const { role, ariaHidden } = internalsOf(el);
  return { role, ariaHidden };
}

/** Whether the host reflects `empty` as `data-empty` and `:state(empty)` together; throws when they disagree. */
function isEmpty(el: LineBadge): boolean {
  const attribute = el.hasAttribute('data-empty');
  expect(internalsOf(el).states.has('empty')).toBe(attribute);
  return attribute;
}

/** Yields one task, after the microtasks that deliver `slotchange` and mutation records. */
function nextTask(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve);
  return promise;
}

async function settle(el: LineBadge): Promise<void> {
  await el.updateComplete;
  await nextTask();
  await el.updateComplete;
}

async function mount(template: TemplateResult = html`<line-badge></line-badge>`): Promise<LineBadge> {
  const el = await fixture<LineBadge>(template);
  await settle(el);
  return el;
}

/** Builds a badge from markup, so attribute values reach the element unparsed. */
async function mountMarkup(markup: string): Promise<LineBadge> {
  const host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
  const el = host.querySelector('line-badge') as LineBadge;
  await settle(el);
  return el;
}

const HIDDEN: Semantics = { role: null, ariaHidden: 'true' };
const IMG: Semantics = { role: 'img', ariaHidden: null };
const TEXT: Semantics = { role: null, ariaHidden: null };

describe('<line-badge> defaults and reflection (decision D6)', () => {
  test('registers line-badge with the LineBadge class', () => {
    expect(customElements.get('line-badge')).toBe(LineBadge);
  });

  test('renders with no errors and defaults to a neutral variant with no host attribute', async () => {
    const el = await mount();
    expect(el.variant).toBe('neutral');
    expect(el.hasAttribute('variant')).toBe(false);
  });

  test('reflects a variant set from script', async () => {
    const el = await mount();
    for (const variant of ['info', 'success', 'warning', 'danger', 'neutral'] as const) {
      el.variant = variant;
      await el.updateComplete;
      expect(el.getAttribute('variant')).toBe(variant);
    }
  });

  test('parses each known variant attribute', async () => {
    for (const variant of ['neutral', 'info', 'success', 'warning', 'danger'] as const) {
      const el = await mountMarkup(`<line-badge variant="${variant}">5</line-badge>`);
      expect(el.variant).toBe(variant);
    }
  });

  test('an unknown variant behaves as neutral and keeps the author value (C8)', async () => {
    const el = await mountMarkup('<line-badge variant="accent">5</line-badge>');
    expect(el.variant).toBe('neutral');
    expect(el.getAttribute('variant')).toBe('accent');
  });

  test('removing the attribute restores the default', async () => {
    const el = await mountMarkup('<line-badge variant="danger">5</line-badge>');
    el.removeAttribute('variant');
    await el.updateComplete;
    expect(el.variant).toBe('neutral');
    expect(el.hasAttribute('variant')).toBe(false);
  });
});

describe('<line-badge> shadow tree', () => {
  test('renders root > default slot', async () => {
    const el = await mount();
    const root = el.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
    expect(root.localName).toBe('span');
    expect(el.shadowRoot?.children.length).toBe(1);
    expect(root.children.length).toBe(1);
    const slot = root.firstElementChild as HTMLSlotElement;
    expect(slot.localName).toBe('slot');
    expect(slot.name).toBe('');
  });

  test('takes no focus and does not delegate it', async () => {
    const el = await mount(html`<line-badge>5</line-badge>`);
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.tabIndex).toBe(-1);
    expect(el.shadowRoot?.delegatesFocus).toBe(false);
  });
});

describe('<line-badge> empty flag (decision F1)', () => {
  for (const [markup, empty] of [
    ['<line-badge></line-badge>', true],
    ['<line-badge>  \n </line-badge>', true],
    ['<line-badge><!-- note --></line-badge>', true],
    ['<line-badge>5</line-badge>', false],
    ['<line-badge>Beta</line-badge>', false],
    ['<line-badge><span></span></line-badge>', false],
  ] as const) {
    test(`${JSON.stringify(markup)} reflects empty=${empty}`, async () => {
      const el = await mountMarkup(markup);
      expect(isEmpty(el)).toBe(empty);
    });
  }

  test('content added and removed through slotchange toggles empty', async () => {
    const el = await mount();
    expect(isEmpty(el)).toBe(true);
    const span = document.createElement('span');
    el.append(span);
    await settle(el);
    expect(isEmpty(el)).toBe(false);
    span.remove();
    await settle(el);
    expect(isEmpty(el)).toBe(true);
  });

  test('text changed in place toggles empty, without a slotchange', async () => {
    const el = await mount();
    const text = document.createTextNode('');
    el.append(text);
    await settle(el);
    expect(isEmpty(el)).toBe(true);
    text.data = '5';
    await settle(el);
    expect(isEmpty(el)).toBe(false);
    expect(semanticsOf(el)).toEqual(TEXT);
    text.data = ' ';
    await settle(el);
    expect(isEmpty(el)).toBe(true);
    expect(semanticsOf(el)).toEqual(HIDDEN);
  });

  test('text removed makes the badge a dot', async () => {
    const el = await mountMarkup('<line-badge>5</line-badge>');
    el.textContent = '';
    await settle(el);
    expect(isEmpty(el)).toBe(true);
  });

  test('the observer stops while the host is out of the document and catches up on reinsertion', async () => {
    const el = await mount();
    const text = document.createTextNode('');
    el.append(text);
    await settle(el);
    const parent = el.parentNode as Node;
    el.remove();
    text.data = '7';
    await settle(el);
    parent.appendChild(el);
    await settle(el);
    expect(isEmpty(el)).toBe(false);
  });
});

describe('<line-badge> internals values (decisions F4, F5; D7)', () => {
  for (const [markup, expected] of [
    ['<line-badge></line-badge>', HIDDEN],
    ['<line-badge>5</line-badge>', TEXT],
    ['<line-badge><span>5</span></line-badge>', TEXT],
    ['<line-badge aria-label="New messages"></line-badge>', IMG],
    ['<line-badge aria-labelledby="caption"></line-badge>', IMG],
    ['<line-badge aria-label="5 unread messages">5</line-badge>', IMG],
    ['<line-badge aria-labelledby="caption">5</line-badge>', IMG],
    ['<line-badge aria-label=" "></line-badge>', HIDDEN],
    ['<line-badge aria-label=""></line-badge>', HIDDEN],
    ['<line-badge aria-labelledby=""></line-badge>', HIDDEN],
    ['<line-badge aria-label=" ">5</line-badge>', TEXT],
    ['<line-badge aria-label=" " aria-labelledby="caption"></line-badge>', IMG],
  ] as const) {
    test(`${markup} sets ${JSON.stringify(expected)}`, async () => {
      const el = await mountMarkup(markup);
      expect(semanticsOf(el)).toEqual(expected);
    });
  }

  test('the constructor writes the dot defaults before any update', () => {
    const el = document.createElement('line-badge');
    expect(el.hasUpdated).toBe(false);
    expect(semanticsOf(el)).toEqual(HIDDEN);
    expect(el.hasAttribute('data-empty')).toBe(false);
  });

  test('a host created with createElement with text has its values at append(), before the first update', () => {
    const el = document.createElement('line-badge');
    el.textContent = '5';
    document.body.append(el);
    expect(el.hasUpdated).toBe(false);
    expect(semanticsOf(el)).toEqual(TEXT);
    expect(isEmpty(el)).toBe(false);
    el.remove();
  });

  test('a host parsed by innerHTML has its values before the first update', () => {
    const host = document.createElement('div');
    host.innerHTML = '<line-badge aria-label="Online"></line-badge>';
    const el = host.querySelector('line-badge') as LineBadge;
    expect(el.hasUpdated).toBe(false);
    expect(semanticsOf(el)).toEqual(IMG);
  });

  test('a change of aria-label or aria-labelledby updates the values synchronously', async () => {
    const el = await mount();
    el.setAttribute('aria-label', 'New messages');
    expect(semanticsOf(el)).toEqual(IMG);
    el.setAttribute('aria-label', '  ');
    expect(semanticsOf(el)).toEqual(HIDDEN);
    el.removeAttribute('aria-label');
    expect(semanticsOf(el)).toEqual(HIDDEN);
    el.setAttribute('aria-labelledby', 'caption');
    expect(semanticsOf(el)).toEqual(IMG);
    el.removeAttribute('aria-labelledby');
    expect(semanticsOf(el)).toEqual(HIDDEN);
  });

  test('a change of the slot updates the values with the empty flag', async () => {
    const el = await mount();
    el.append('5');
    await settle(el);
    expect(semanticsOf(el)).toEqual(TEXT);
    el.setAttribute('aria-label', '5 unread messages');
    expect(semanticsOf(el)).toEqual(IMG);
    el.textContent = '';
    await settle(el);
    expect(semanticsOf(el)).toEqual(IMG);
    el.removeAttribute('aria-label');
    expect(semanticsOf(el)).toEqual(HIDDEN);
  });

  test('variant changes leave the values alone', async () => {
    const el = await mountMarkup('<line-badge aria-label="Online"></line-badge>');
    for (const variant of ['info', 'success', 'warning', 'danger', 'neutral'] as const) {
      el.variant = variant;
      await el.updateComplete;
      expect(semanticsOf(el)).toEqual(IMG);
    }
  });
});

describe('<line-badge> host attributes', () => {
  test('writes no role or aria-* attribute; only data-empty while empty', async () => {
    const el = await mount();
    el.variant = 'danger';
    await settle(el);
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.getAttributeNames().filter((name) => name.startsWith('aria-') || name.startsWith('data-'))).toEqual([
      'data-empty',
    ]);
  });

  test('leaves an author role, aria-hidden and aria-live unchanged', async () => {
    const el = await mountMarkup('<line-badge role="status" aria-hidden="true" aria-live="polite">5</line-badge>');
    el.textContent = '';
    el.setAttribute('aria-label', 'x');
    await settle(el);
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('aria-live')).toBe('polite');
  });

  test('dispatches no event of any kind', async () => {
    const dispatch = spyOn(LineBadge.prototype, 'dispatchEvent');
    try {
      const el = await mount();
      el.append('5');
      el.variant = 'danger';
      el.setAttribute('aria-label', '5 new');
      el.click();
      await settle(el);
      expect(dispatch.mock.calls.filter(([event]) => event.type !== 'click')).toEqual([]);
    } finally {
      dispatch.mockRestore();
    }
  });

  test('C8: no attributes and no content render a neutral dot hidden from assistive technology', async () => {
    const el = await mount();
    expect(el.variant).toBe('neutral');
    expect(isEmpty(el)).toBe(true);
    expect(semanticsOf(el)).toEqual(HIDDEN);
  });
});
