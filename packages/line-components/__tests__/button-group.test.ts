/**
 * `<line-button-group>` unit tier (spec `0004-button-group.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`, whose fake internals hold
 * `role` and `ariaOrientation`. The component comes from `src/` and
 * `line-core` from its built `dist/` (spec §7.8 rules 1 and 3), so this file
 * needs `bun run build` first, as the CI unit tier has. Slotted `line-button`
 * and `line-icon-button` hosts come from `src/` too; the group itself imports
 * neither. Tab order, real focus, focus-visible, the corners and the
 * accessibility tree live in the browser tier
 * (`integration/button-group/button-group.e2e.ts`).
 *
 * @module __tests__/button-group
 */

import { describe, expect, mock, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import type { CSSResult, TemplateResult } from 'lit';
import '../src/button/index.js';
import '../src/icon-button/index.js';
import { buttonGroupMachine } from '../src/button-group/button-group-machine.js';
import { LineButtonGroup } from '../src/button-group/index.js';

const POSITION = 'data-line-button-group-position';

type InternalsView = { role?: string | null; ariaOrientation?: string | null };

function internalsOf(el: LineButtonGroup): { role: string | null; ariaOrientation: string | null } {
  const internals = Reflect.get(el, INTERNALS) as InternalsView | undefined;
  return { role: internals?.role ?? null, ariaOrientation: internals?.ariaOrientation ?? null };
}

/** Yields one task: the machine applies events in a microtask and the host updates after it. */
function nextTask(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve);
  return promise;
}

async function settle(el: LineButtonGroup): Promise<void> {
  await nextTask();
  await el.updateComplete;
  await nextTask();
  await el.updateComplete;
}

async function mount(template: TemplateResult): Promise<LineButtonGroup> {
  const el = await fixture<LineButtonGroup>(template);
  await settle(el);
  return el;
}

const THREE = html`<line-button-group aria-label="Text formatting">
  <line-button id="b1">Bold</line-button>
  <line-button id="b2">Italic</line-button>
  <line-button id="b3">Underline</line-button>
</line-button-group>`;

/** `id:tabindex:position` of each element child, in order. */
function stops(el: LineButtonGroup): string[] {
  return [...el.children].map(
    (child) => `${child.id}:${child.getAttribute('tabindex')}:${child.getAttribute(POSITION)}`,
  );
}

function key(el: LineButtonGroup, id: string, name: string): KeyboardEvent {
  const target = el.querySelector(`#${id}`) as HTMLElement;
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

/** The component's own sheets: the layout sheet and the corner rules, after the `common` reset module. */
function ownCss(): string {
  const styles = LineButtonGroup.styles as CSSResult[];
  return styles
    .slice(-2)
    .map((sheet) => sheet.cssText.replace(/\s+/g, ' '))
    .join(' ');
}

describe('<line-button-group> defaults and reflection', () => {
  test('registers line-button-group with the LineButtonGroup class, which is not form-associated', () => {
    expect(customElements.get('line-button-group')).toBe(LineButtonGroup);
    expect(Reflect.get(LineButtonGroup, 'formAssociated')).toBeUndefined();
  });

  test('renders the C8 empty state: an unnamed toolbar with only a slot and no tabindex anywhere', async () => {
    const el = await mount(html`<line-button-group></line-button-group>`);
    expect(el.orientation).toBe('horizontal');
    expect(el.loop).toBe(false);
    expect(el.hasAttribute('orientation')).toBe(false);
    expect(el.hasAttribute('loop')).toBe(false);
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(internalsOf(el)).toEqual({ role: 'toolbar', ariaOrientation: null });
    const children = [...(el.shadowRoot?.children ?? [])].filter((child) => child.localName !== 'style');
    expect(children.map((child) => child.localName)).toEqual(['slot']);
    expect(el.shadowRoot?.querySelector('[part]')).toBeNull();
  });

  test('reflects orientation and loop set as properties', async () => {
    const el = await mount(THREE);
    el.orientation = 'vertical';
    el.loop = true;
    await el.updateComplete;
    expect(el.getAttribute('orientation')).toBe('vertical');
    expect(el.hasAttribute('loop')).toBe(true);
    expect(internalsOf(el)).toEqual({ role: 'toolbar', ariaOrientation: 'vertical' });
    el.orientation = 'horizontal';
    await el.updateComplete;
    expect(internalsOf(el).ariaOrientation).toBeNull();
  });

  test('orientation: an unknown value behaves as horizontal and the attribute keeps what the author wrote', async () => {
    const el = await mount(html`<line-button-group orientation="diagonal"></line-button-group>`);
    expect(el.orientation).toBe('horizontal');
    expect(el.getAttribute('orientation')).toBe('diagonal');
    expect(internalsOf(el).ariaOrientation).toBeNull();
    el.setAttribute('orientation', 'vertical');
    await el.updateComplete;
    expect(el.orientation).toBe('vertical');
    expect(internalsOf(el).ariaOrientation).toBe('vertical');
    el.removeAttribute('orientation');
    await el.updateComplete;
    expect(el.orientation).toBe('horizontal');
    expect(el.hasAttribute('orientation')).toBe(false);
  });
});

describe('<line-button-group> items, tab stops and positions', () => {
  test('one tab stop on the first button and a position on each', async () => {
    const el = await mount(THREE);
    expect(stops(el)).toEqual(['b1:0:first', 'b2:-1:middle', 'b3:-1:last']);
  });

  test('line-icon-button hosts are items; other children, hidden buttons and native buttons are not', async () => {
    const el = await mount(html`<line-button-group aria-label="Tools">
      <span id="s0">label</span>
      <line-button id="h1" hidden>Hidden</line-button>
      <line-icon-button id="i1" aria-label="Zoom out"></line-icon-button>
      <button id="n1">Native</button>
      <line-button id="b2">100%</line-button>
      <line-icon-button id="i3" aria-label="Zoom in"></line-icon-button>
      <line-separator id="sep"></line-separator>
    </line-button-group>`);
    expect(stops(el)).toEqual([
      's0:null:null',
      'h1:null:null',
      'i1:0:first',
      'n1:null:null',
      'b2:-1:middle',
      'i3:-1:last',
      'sep:null:null',
    ]);
  });

  test('a single item is "only"', async () => {
    const el = await mount(html`<line-button-group><line-button id="b1">One</line-button></line-button-group>`);
    expect(stops(el)).toEqual(['b1:0:only']);
  });

  test('the first enabled button takes the tab stop when the first is disabled', async () => {
    const el = await mount(html`<line-button-group>
      <line-button id="b1" disabled>Bold</line-button>
      <line-button id="b2">Italic</line-button>
    </line-button-group>`);
    expect(stops(el)).toEqual(['b1:-1:first', 'b2:0:last']);
  });

  test('every item disabled leaves the group without a tab stop', async () => {
    const el = await mount(html`<line-button-group>
      <line-button id="b1" disabled>Bold</line-button>
      <line-button id="b2" disabled>Italic</line-button>
    </line-button-group>`);
    expect(stops(el)).toEqual(['b1:-1:first', 'b2:-1:last']);
  });

  test('append, remove and reorder recompute positions; the tab stop follows the active element', async () => {
    const el = await mount(THREE);
    const b4 = document.createElement('line-button');
    b4.id = 'b4';
    el.append(b4);
    await settle(el);
    expect(stops(el)).toEqual(['b1:0:first', 'b2:-1:middle', 'b3:-1:middle', 'b4:-1:last']);
    el.insertBefore(el.querySelector('#b3') as Element, el.querySelector('#b1'));
    await settle(el);
    expect(stops(el)).toEqual(['b3:-1:first', 'b1:0:middle', 'b2:-1:middle', 'b4:-1:last']);
    el.querySelector('#b2')?.remove();
    await settle(el);
    expect(stops(el)).toEqual(['b3:-1:first', 'b1:0:middle', 'b4:-1:last']);
  });

  test('an element that leaves the group loses the tabindex and position the group wrote', async () => {
    const el = await mount(THREE);
    const b1 = el.querySelector('#b1') as HTMLElement;
    document.body.append(b1);
    await settle(el);
    expect(b1.hasAttribute('tabindex')).toBe(false);
    expect(b1.hasAttribute(POSITION)).toBe(false);
    expect(stops(el)).toEqual(['b2:0:first', 'b3:-1:last']);
    b1.remove();
  });

  test('removing the active item hands the tab stop to the next enabled item, else the previous', async () => {
    const el = await mount(THREE);
    el.querySelector('#b1')?.remove();
    await settle(el);
    expect(stops(el)).toEqual(['b2:0:first', 'b3:-1:last']);
    key(el, 'b2', 'End');
    await settle(el);
    expect(stops(el)).toEqual(['b2:-1:first', 'b3:0:last']);
    el.querySelector('#b3')?.remove();
    await settle(el);
    expect(stops(el)).toEqual(['b2:0:only']);
  });

  test('hidden and disabled changes are observed without a slotchange', async () => {
    const el = await mount(THREE);
    const b1 = el.querySelector('#b1') as HTMLElement;
    b1.setAttribute('disabled', '');
    await settle(el);
    expect(stops(el)).toEqual(['b1:-1:first', 'b2:0:middle', 'b3:-1:last']);
    const b3 = el.querySelector('#b3') as HTMLElement;
    b3.hidden = true;
    await settle(el);
    expect(stops(el)).toEqual(['b1:-1:first', 'b2:0:last', 'b3:null:null']);
    b3.hidden = false;
    await settle(el);
    expect(stops(el)).toEqual(['b1:-1:first', 'b2:0:middle', 'b3:-1:last']);
  });
});

describe('<line-button-group> keys', () => {
  test('horizontal: ArrowRight, ArrowLeft, Home and End move the tab stop; the other pair is not handled', async () => {
    const el = await mount(THREE);
    expect(key(el, 'b1', 'ArrowRight').defaultPrevented).toBe(true);
    await settle(el);
    expect(stops(el)[1]).toBe('b2:0:middle');
    expect(key(el, 'b2', 'ArrowDown').defaultPrevented).toBe(false);
    key(el, 'b2', 'End');
    await settle(el);
    expect(stops(el)[2]).toBe('b3:0:last');
    expect(key(el, 'b3', 'ArrowRight').defaultPrevented).toBe(true);
    await settle(el);
    expect(stops(el)[2]).toBe('b3:0:last');
    key(el, 'b3', 'Home');
    await settle(el);
    expect(stops(el)[0]).toBe('b1:0:first');
    key(el, 'b1', 'ArrowLeft');
    await settle(el);
    expect(stops(el)[0]).toBe('b1:0:first');
  });

  test('loop wraps at both ends', async () => {
    const el = await mount(THREE);
    el.loop = true;
    await el.updateComplete;
    key(el, 'b1', 'ArrowLeft');
    await settle(el);
    expect(stops(el)[2]).toBe('b3:0:last');
    key(el, 'b3', 'ArrowRight');
    await settle(el);
    expect(stops(el)[0]).toBe('b1:0:first');
  });

  test('vertical: ArrowDown and ArrowUp move; ArrowRight is not handled', async () => {
    const el = await mount(THREE);
    el.orientation = 'vertical';
    await el.updateComplete;
    expect(key(el, 'b1', 'ArrowRight').defaultPrevented).toBe(false);
    key(el, 'b1', 'ArrowDown');
    await settle(el);
    expect(stops(el)[1]).toBe('b2:0:middle');
    key(el, 'b2', 'ArrowUp');
    await settle(el);
    expect(stops(el)[0]).toBe('b1:0:first');
  });

  test('the arrows pass over disabled items and keep loading items', async () => {
    const el = await mount(html`<line-button-group>
      <line-button id="b1">Bold</line-button>
      <line-button id="b2" disabled>Italic</line-button>
      <line-button id="b3" loading>Underline</line-button>
    </line-button-group>`);
    key(el, 'b1', 'ArrowRight');
    await settle(el);
    expect(stops(el)).toEqual(['b1:-1:first', 'b2:-1:middle', 'b3:0:last']);
  });

  test('keys from a non-item child are ignored', async () => {
    const el = await mount(html`<line-button-group>
      <button id="n1">Native</button>
      <line-button id="b1">Bold</line-button>
    </line-button-group>`);
    expect(key(el, 'n1', 'ArrowRight').defaultPrevented).toBe(false);
  });
});

describe('<line-button-group> tokens and corners', () => {
  test(':host declares the two token defaults and the flex layout', () => {
    const sheet = ownCss();
    expect(sheet).toContain('--line-button-group-radius: var(--line-radius-2);');
    expect(sheet).toContain('--line-button-group-gap: 0;');
    expect(sheet).toContain('display: inline-flex;');
    expect(sheet).toContain("[orientation='vertical']");
  });

  test('the corner rules write both radius tokens per position, in LTR, RTL and vertical', () => {
    const sheet = ownCss();
    const r = 'var(--line-button-group-radius)';
    for (const tag of ['line-button', 'line-icon-button']) {
      expect(sheet).toContain(`::slotted(${tag}[${POSITION}='first']) { --${tag}-radius: ${r} 0 0 ${r}; }`);
      expect(sheet).toContain(`::slotted(${tag}[${POSITION}='middle']) { --${tag}-radius: 0; }`);
      expect(sheet).toContain(`::slotted(${tag}[${POSITION}='only']) { --${tag}-radius: ${r}; }`);
      expect(sheet).toContain(
        `:host(:dir(rtl)) ::slotted(${tag}[${POSITION}='first']) { --${tag}-radius: 0 ${r} ${r} 0; }`,
      );
      expect(sheet).toContain(
        `:host([orientation='vertical']) ::slotted(${tag}[${POSITION}='last']) { --${tag}-radius: 0 0 ${r} ${r}; }`,
      );
    }
    expect(sheet).toContain('::slotted([data-focus-visible]) { position: relative; z-index: 1; }');
  });
});

describe('<line-button-group> machine-failure fallback', () => {
  test('writes positions but no tabindex, so each button keeps its own tab stop', async () => {
    const { initialState } = buttonGroupMachine;
    const consoleError = console.error;
    console.error = mock();
    buttonGroupMachine.initialState = () => {
      throw new Error('machine start failure');
    };
    try {
      const el = await mount(THREE);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(stops(el)).toEqual(['b1:null:first', 'b2:null:middle', 'b3:null:last']);
      expect(key(el, 'b1', 'ArrowRight').defaultPrevented).toBe(false);
    } finally {
      buttonGroupMachine.initialState = initialState;
      console.error = consoleError;
    }
  });
});
