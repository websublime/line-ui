/**
 * `<line-avatar-group>` unit tier (spec `0010-avatar-group.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`, whose fake internals hold the role and the custom states. The
 * component comes from `src/` and `line-core` from its built `dist/` through the declared dependency (Phase 1 spec
 * §7.8 rules 1 and 3), so this file needs `bun run build` first, as the CI unit tier has. happy-dom leaves
 * `assignedSlot` `null` under manual assignment, so the slots are read through `assignedElements()`; it has no popover
 * API and no `ToggleEvent`, so the panel's `toggle` is a plain event carrying `newState`, and `hidePopover()` is a spy
 * (spec probe P7; D21, D22). Opening the panel, Tab order, focus return, layout and the accessibility tree live in
 * the browser tier (`integration/avatar-group/avatar-group.e2e.ts`).
 *
 * @module __tests__/avatar-group
 */

import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import type { CSSResult } from 'lit';
import { avatarGroupMachine } from '../src/avatar-group/avatar-group-machine.js';
import { LineAvatarGroup } from '../src/avatar-group/index.js';

/**
 * happy-dom 20.14.6 appends to a slot's assigned nodes on `assign()` instead of replacing them, as the DOM standard
 * says (`HTMLSlotElement.js:48-72`; spec AM-002). The tests replace it with a conforming `assign()` for this file: the
 * slot first releases the nodes it holds, through the two internal symbols happy-dom keys them by.
 */
const nativeAssign = HTMLSlotElement.prototype.assign;

function internalSymbol(target: object, description: string): symbol {
  const found = Object.getOwnPropertySymbols(target).find((each) => each.description === description);
  if (!found) throw new Error(`happy-dom has no ${description} symbol on ${String(target)}`);
  return found;
}

beforeAll(() => {
  HTMLSlotElement.prototype.assign = function assign(this: HTMLSlotElement, ...nodes: (Element | Text)[]): void {
    const held = Reflect.get(this, internalSymbol(this, 'assignedNodes')) as Node[];
    for (const node of held.splice(0)) Reflect.set(node, internalSymbol(node, 'assignedToSlot'), null);
    nativeAssign.apply(this, nodes);
  };
});

afterAll(() => {
  HTMLSlotElement.prototype.assign = nativeAssign;
});

/** The fields of the preload's fake internals these tests read. */
interface RecordingInternals {
  role: string | null;
  states: Set<string>;
}

function internals(el: LineAvatarGroup): RecordingInternals {
  return Reflect.get(el, INTERNALS) as RecordingInternals;
}

function shadow(el: LineAvatarGroup): ShadowRoot {
  if (!el.shadowRoot) throw new Error('no shadow root');
  return el.shadowRoot;
}

function button(el: LineAvatarGroup): HTMLButtonElement {
  const found = shadow(el).querySelector<HTMLButtonElement>('[part="overflow"]');
  if (!found) throw new Error('no [part="overflow"] button');
  return found;
}

function panel(el: LineAvatarGroup): HTMLElement {
  const found = shadow(el).querySelector<HTMLElement>('[part="content"]');
  if (!found) throw new Error('no [part="content"] panel');
  return found;
}

/** The ids of the children each item slot holds, in stack order, and of those the panel slot holds. */
function assignment(el: LineAvatarGroup): { stack: string[][]; panel: string[] | null } {
  const ids = (slot: HTMLSlotElement) => slot.assignedElements().map((child) => child.id);
  const items = [...shadow(el).querySelectorAll<HTMLSlotElement>('.item > slot')].map(ids);
  const rest = shadow(el).querySelector<HTMLSlotElement>('[part="content"] > slot');
  return { stack: items, panel: rest ? ids(rest) : null };
}

function parts(el: LineAvatarGroup): (string | null)[] {
  return [...shadow(el).querySelectorAll('[part]')].map((part) => part.getAttribute('part'));
}

/**
 * Lets the machine's microtask sends run, then waits for the host to render. The machine exposes no promise for its
 * queued sends, so a zero-delay task, which runs after every pending microtask, is the signal.
 */
async function settle(el: LineAvatarGroup): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve);
  await promise;
  await el.updateComplete;
}

async function mount(attributes: string, count: number, extra?: (index: number) => string): Promise<LineAvatarGroup> {
  const container = document.createElement('div');
  container.innerHTML = `<line-avatar-group aria-label="Project members" ${attributes}>${Array.from(
    { length: count },
    (_, i) => `<line-avatar id="a${i + 1}" name="Person ${i + 1}"${extra?.(i) ?? ''}></line-avatar>`,
  ).join('')}</line-avatar-group>`;
  const el = await fixture<LineAvatarGroup>(html`${container.firstElementChild}`);
  await settle(el);
  return el;
}

function toggle(el: LineAvatarGroup, newState: 'open' | 'closed', type = 'toggle'): void {
  panel(el).dispatchEvent(Object.assign(new Event(type), { newState }));
}

function pointer(el: LineAvatarGroup, type: 'pointerenter' | 'pointerleave', pointerType: string): void {
  el.dispatchEvent(new PointerEvent(type, { pointerType }));
}

/** A `focusin` from `target`, which reports whether it matches `:focus-visible` (happy-dom matches it nowhere). */
function focusIn(target: Element, visible: boolean): void {
  target.matches = (selector: string) => selector === ':focus-visible' && visible;
  target.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
}

function focusOut(target: Element, relatedTarget: EventTarget | null = null): void {
  target.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true, relatedTarget }));
}

function pressEscape(target: EventTarget): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

/** `collapsed`, `expanded` or `overflow_open`, read from the reflected flags. */
function state(el: LineAvatarGroup): string {
  const expanded = el.hasAttribute('data-expanded');
  const open = el.hasAttribute('data-open');
  if (open && expanded) return 'overflow_open';
  if (expanded) return 'expanded';
  return open ? 'invalid' : 'collapsed';
}

/** The component's own sheet: the last entry of `styles`, after the two reset modules. */
function ownCss(): string {
  const styles = LineAvatarGroup.styles as CSSResult[];
  return (styles.at(-1) as CSSResult).cssText.replace(/\s+/g, ' ');
}

/** Makes the machine fail to start for `run` (MANIFESTO Law 9). */
async function withFailedMachine(run: () => Promise<void>): Promise<void> {
  const { initialState } = avatarGroupMachine;
  const consoleError = console.error;
  console.error = mock();
  avatarGroupMachine.initialState = () => {
    throw new Error('machine start failure');
  };
  try {
    await run();
  } finally {
    avatarGroupMachine.initialState = initialState;
    console.error = consoleError;
  }
}

describe('<line-avatar-group> registration, role and render', () => {
  test('registers line-avatar-group with the LineAvatarGroup class, which is not form-associated', async () => {
    expect(customElements.get('line-avatar-group')).toBe(LineAvatarGroup);
    expect('formAssociated' in LineAvatarGroup).toBe(false);
    const el = await mount('', 2);
    expect(el).toBeInstanceOf(LineAvatarGroup);
  });

  test('sets the group role through INTERNALS and leaves the host attributes alone (F6)', async () => {
    const el = await mount('max="2"', 3);
    expect(internals(el).role).toBe('group');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.getAttribute('aria-label')).toBe('Project members');
  });

  test('uses manual slot assignment and does not delegate focus (F4; D6)', async () => {
    const el = await mount('', 1);
    expect(shadow(el).slotAssignment).toBe('manual');
    expect(shadow(el).delegatesFocus).toBe(false);
  });

  test('with no children renders an empty group with no overflow control (C8)', async () => {
    const el = await fixture<LineAvatarGroup>(html`<line-avatar-group></line-avatar-group>`);
    await settle(el);
    expect(shadow(el).querySelectorAll('.level, .item')).toHaveLength(0);
    expect(parts(el)).toEqual([]);
    expect(internals(el).role).toBe('group');
    expect(state(el)).toBe('collapsed');
  });

  test('renders no root, overflow or content part while every child shows (D3, D5)', async () => {
    for (const attributes of ['', 'max="5"', 'max="9"']) {
      const el = await mount(attributes, 5);
      expect(parts(el)).toEqual([]);
      expect(assignment(el)).toEqual({ stack: [['a1'], ['a2'], ['a3'], ['a4'], ['a5']], panel: null });
    }
  });

  test('renders root around the overflow button, then the content panel, while some child is past max (F15)', async () => {
    const el = await mount('max="3"', 5);
    expect(parts(el)).toEqual(['root', 'overflow', 'content']);
    const root = shadow(el).querySelector('[part="root"]');
    expect(button(el).parentElement).toBe(root as HTMLElement);
    expect(button(el).type).toBe('button');
    expect(panel(el).id).toBe('content');
    expect(panel(el).getAttribute('popover')).toBe('auto');
    expect(button(el).getAttribute('popovertarget')).toBe('content');
    expect(panel(el).hasAttribute('role')).toBe(false);
  });
});

describe('<line-avatar-group> stack, levels and panel assignment (F3, F4; D3, D14, D20)', () => {
  test('assigns the first max children to the stack and the rest to the panel, for each child count', async () => {
    const cases: [number, string[][], string[] | null][] = [
      [1, [['a1']], null],
      [2, [['a1'], ['a2']], null],
      [3, [['a1'], ['a2'], ['a3']], null],
      [4, [['a1'], ['a2'], ['a3']], ['a4']],
      [6, [['a1'], ['a2'], ['a3']], ['a4', 'a5', 'a6']],
    ];
    for (const [count, stack, rest] of cases) {
      const el = await mount('max="3"', count);
      expect(assignment(el)).toEqual({ stack, panel: rest });
    }
  });

  test('nests one level per stack child: level k holds level k − 1 and the item of child k', async () => {
    const el = await mount('max="3"', 5);
    const outer = shadow(el).firstElementChild as HTMLElement;
    expect(outer.className).toBe('level');
    const shape = (level: Element): unknown => {
      const children = [...level.children];
      return children.map((child) => (child.className === 'level' ? shape(child) : child.className));
    };
    expect(shape(outer)).toEqual([[['item'], 'item'], 'item']);
    expect(outer.nextElementSibling?.getAttribute('part')).toBe('root');
    expect(shadow(el).querySelectorAll('.level')).toHaveLength(3);
  });

  test('a missing, non-integer or sub-1 max means no limit (D3)', async () => {
    for (const max of ['', 'max', 'max="0"', 'max="-2"', 'max="2.5"', 'max="two"', 'max=""']) {
      const el = await mount(max, 4);
      expect(el.max).toBeUndefined();
      expect(assignment(el).stack).toHaveLength(4);
      expect(parts(el)).toEqual([]);
    }
  });

  test('skips a hidden child, the first one included, so level 1 holds the first visible avatar (D14, D20)', async () => {
    const el = await mount('max="2"', 5, (i) => (i === 0 || i === 2 ? ' hidden' : ''));
    expect(assignment(el)).toEqual({ stack: [['a2'], ['a4']], panel: ['a5'] });
    const innermost = shadow(el).querySelector('.level:not(:has(.level))') as HTMLElement;
    const slot = innermost.querySelector('.item > slot') as HTMLSlotElement;
    expect(slot.assignedElements().map((child) => child.id)).toEqual(['a2']);
    expect(button(el).textContent).toBe('+1');
  });

  test('counts any element child, a link around an avatar included, and never assigns text (F5)', async () => {
    const el = await fixture<LineAvatarGroup>(
      html`<line-avatar-group max="1">
        text
        <a id="l1" href="#a"><line-avatar name="Ana Silva"></line-avatar></a>
        <span id="s2">x</span>
      </line-avatar-group>`,
    );
    await settle(el);
    expect(assignment(el)).toEqual({ stack: [['l1']], panel: ['s2'] });
    expect(button(el).textContent).toBe('+1');
  });

  test('writes no attribute on any child (F4)', async () => {
    const el = await mount('max="2"', 4);
    for (const child of el.children) {
      expect(child.getAttributeNames().sort()).toEqual(['id', 'name']);
    }
  });

  test('reads the children before the first render (D13)', async () => {
    const seen: number[] = [];
    class Probe extends LineAvatarGroup {
      protected override firstUpdated(changed: Map<PropertyKey, unknown>): void {
        super.firstUpdated(changed);
        seen.push(this.shadowRoot?.querySelectorAll('.item').length ?? -1);
      }
    }
    customElements.define('probe-avatar-group', Probe);
    const el = document.createElement('probe-avatar-group') as Probe;
    el.max = 2;
    el.append(...Array.from({ length: 4 }, () => document.createElement('line-avatar')));
    document.body.append(el);
    await settle(el);
    expect(seen).toEqual([2]);
    el.remove();
  });
});

describe('<line-avatar-group> MutationObserver (D13)', () => {
  test('reassigns on append, remove and reorder', async () => {
    const el = await mount('max="2"', 3);
    expect(assignment(el)).toEqual({ stack: [['a1'], ['a2']], panel: ['a3'] });
    const fourth = document.createElement('line-avatar');
    fourth.id = 'a4';
    el.append(fourth);
    await settle(el);
    expect(assignment(el)).toEqual({ stack: [['a1'], ['a2']], panel: ['a3', 'a4'] });
    expect(button(el).textContent).toBe('+2');
    el.querySelector('#a1')?.remove();
    await settle(el);
    expect(assignment(el)).toEqual({ stack: [['a2'], ['a3']], panel: ['a4'] });
    el.prepend(el.querySelector('#a4') as Element);
    await settle(el);
    expect(assignment(el)).toEqual({ stack: [['a4'], ['a2']], panel: ['a3'] });
  });

  test("reassigns when a child's hidden turns on or off", async () => {
    const el = await mount('max="2"', 3);
    el.querySelector('#a1')?.setAttribute('hidden', '');
    await settle(el);
    expect(assignment(el)).toEqual({ stack: [['a2'], ['a3']], panel: null });
    expect(parts(el)).toEqual([]);
    el.querySelector('#a1')?.removeAttribute('hidden');
    await settle(el);
    expect(assignment(el)).toEqual({ stack: [['a1'], ['a2']], panel: ['a3'] });
  });

  test('watches a child appended later for hidden too', async () => {
    const el = await mount('max="2"', 2);
    const late = document.createElement('line-avatar');
    late.id = 'late';
    el.append(late);
    await settle(el);
    expect(assignment(el).panel).toEqual(['late']);
    late.hidden = true;
    await settle(el);
    expect(assignment(el).panel).toBeNull();
  });

  test('disconnects on disconnectedCallback and reads the children again on connectedCallback', async () => {
    const el = await mount('max="2"', 3);
    const parent = el.parentElement as HTMLElement;
    el.remove();
    await settle(el);
    const extra = document.createElement('line-avatar');
    extra.id = 'a4';
    el.append(extra);
    await Promise.resolve();
    await Promise.resolve();
    expect(el.isUpdatePending).toBe(false);
    parent.append(el);
    await settle(el);
    expect(assignment(el)).toEqual({ stack: [['a1'], ['a2']], panel: ['a3', 'a4'] });
    el.querySelector('#a1')?.remove();
    await settle(el);
    expect(assignment(el)).toEqual({ stack: [['a2'], ['a3']], panel: ['a4'] });
  });
});

describe('<line-avatar-group> "+N" and overflow-label (F7; D15, D24)', () => {
  test('shows "+N" and names the button by it while overflow-label is blank', async () => {
    for (const label of ['', 'overflow-label=""', 'overflow-label="   "']) {
      const el = await mount(`max="2" ${label}`, 5);
      expect(button(el).textContent).toBe('+3');
      expect(button(el).hasAttribute('aria-label')).toBe(false);
    }
  });

  test('replaces one {count}, and every {count}, with the formatted count', async () => {
    const one = await mount('max="2" overflow-label="+{count} more members"', 5);
    expect(button(one).getAttribute('aria-label')).toBe('+3 more members');
    const two = await mount('max="2" overflow-label="+{count} more, {count} hidden"', 5);
    expect(button(two).getAttribute('aria-label')).toBe('+3 more, 3 hidden');
  });

  test('a label without {count} follows the visible "+N" and a space', async () => {
    const el = await mount('max="2" overflow-label="more members"', 5);
    expect(button(el).getAttribute('aria-label')).toBe('+3 more members');
  });

  test('the label and the text follow the count and the property', async () => {
    const el = await mount('max="2" overflow-label="+{count} more"', 5);
    el.max = 4;
    await settle(el);
    expect(button(el).textContent).toBe('+1');
    expect(button(el).getAttribute('aria-label')).toBe('+1 more');
    el.overflowLabel = '';
    await settle(el);
    expect(button(el).hasAttribute('aria-label')).toBe(false);
  });

  test('formats the count for the nearest lang, and falls back on an invalid tag (D15)', async () => {
    const container = document.createElement('div');
    container.lang = 'ar-EG';
    container.innerHTML = `<line-avatar-group max="1">${'<line-avatar></line-avatar>'.repeat(4)}</line-avatar-group>`;
    const el = await fixture<LineAvatarGroup>(html`${container}`);
    const group = container.querySelector('line-avatar-group') as LineAvatarGroup;
    await settle(group);
    expect(button(group).textContent).toBe(`+${new Intl.NumberFormat('ar-EG').format(3)}`);
    container.lang = 'not a tag!';
    group.requestUpdate();
    await settle(group);
    expect(button(group).textContent).toBe(`+${new Intl.NumberFormat().format(3)}`);
    expect(el).toBe(container as unknown as LineAvatarGroup);
  });
});

describe('<line-avatar-group> props: converters and reflection (F8)', () => {
  test('max reads integers of 1 or more and does not reflect', async () => {
    const el = await mount('max="3"', 4);
    expect(el.max).toBe(3);
    el.max = 2;
    await settle(el);
    expect(el.getAttribute('max')).toBe('3');
    expect(assignment(el).stack).toHaveLength(2);
    el.max = 1.5;
    await settle(el);
    expect(assignment(el).stack).toHaveLength(4);
  });

  test('size and spacing read their steps, reflect them, and leave an unknown attribute as written', async () => {
    const el = await mount('size="4" spacing="0"', 2);
    expect(el.size).toBe('4');
    expect(el.spacing).toBe('0');
    el.size = '1';
    el.spacing = '3';
    await settle(el);
    expect(el.getAttribute('size')).toBe('1');
    expect(el.getAttribute('spacing')).toBe('3');
    el.size = undefined;
    el.spacing = undefined;
    await settle(el);
    expect(el.hasAttribute('size')).toBe(false);
    expect(el.hasAttribute('spacing')).toBe(false);
    const unknown = await mount('size="9" spacing="lg"', 2);
    expect(unknown.size).toBeUndefined();
    expect(unknown.spacing).toBeUndefined();
    expect(unknown.getAttribute('size')).toBe('9');
    expect(unknown.getAttribute('spacing')).toBe('lg');
  });

  test('overflowLabel defaults to an empty string and reads overflow-label', async () => {
    const el = await mount('', 1);
    expect(el.overflowLabel).toBe('');
    el.setAttribute('overflow-label', '+{count}');
    expect(el.overflowLabel).toBe('+{count}');
  });
});

describe('<line-avatar-group> custom properties (D10)', () => {
  test('declares the thirteen tokens and the ring width on :host, with their defaults', () => {
    const sheet = ownCss();
    for (const declaration of [
      '--line-avatar-group-overlap: var(--line-size-2);',
      '--line-avatar-group-gap: var(--line-size-1);',
      '--line-avatar-group-duration: var(--line-motion-fast);',
      '--line-avatar-group-focus-ring: var(--line-focus-ring, 2px solid currentColor);',
      '--line-avatar-group-content-bg: var(--line-gray-1, Canvas);',
      '--line-avatar-group-content-border-color: var(--line-gray-border);',
      '--line-avatar-group-content-border-width: var(--line-border-1);',
      '--line-avatar-group-content-radius: var(--line-radius-2);',
      '--line-avatar-group-content-shadow: var(--line-shadow-3);',
      '--line-avatar-group-content-padding: var(--line-size-2);',
      '--line-avatar-group-content-gap: var(--line-size-1);',
      '--line-avatar-group-content-offset: var(--line-size-1);',
      '--line-avatar-group-content-max-inline-size: var(--line-size-xs);',
      '--line-avatar-ring-width: var(--line-border-2);',
    ]) {
      expect(sheet).toContain(declaration);
    }
    expect(sheet).not.toContain('--line-avatar-status-visibility');
  });

  test('size steps set --line-avatar-size and spacing steps the overlap', () => {
    const sheet = ownCss();
    for (const [step, token] of [
      ['1', '5'],
      ['2', '6'],
      ['3', '7'],
      ['4', '8'],
      ['5', '9'],
    ]) {
      expect(sheet).toContain(`:host([size='${step}']) { --line-avatar-size: var(--line-size-${token}); }`);
    }
    expect(sheet).toContain(":host([spacing='0']) { --line-avatar-group-overlap: 0px; }");
    for (const step of ['1', '2', '3']) {
      expect(sheet).toContain(`:host([spacing='${step}']) { --line-avatar-group-overlap: var(--line-size-${step}); }`);
    }
  });

  test('the expansion translates each level toward inline-start, mirrored under rtl, and reduced motion is 0s (F14)', () => {
    const sheet = ownCss();
    expect(sheet).toContain('.level, .item { display: inline-flex; align-items: center; }');
    expect(sheet).toContain(
      ".level + .item, .level + [part='root'] { margin-inline-start: calc(-1 * var(--line-avatar-group-overlap)); }",
    );
    expect(sheet).toContain(
      ':host([data-expanded]) .level { translate: calc(-1 * (var(--line-avatar-group-overlap) + var(--line-avatar-group-gap))) 0; }',
    );
    expect(sheet).toContain(
      ':host([data-expanded]:dir(rtl)) .level { translate: calc(var(--line-avatar-group-overlap) + var(--line-avatar-group-gap)) 0; }',
    );
    expect(sheet).toContain('@media (prefers-reduced-motion: reduce) { :host { --line-avatar-group-duration: 0s; } }');
    expect(sheet).toContain(
      ":host([data-focus-visible]) [part='root'] { outline: var(--line-avatar-group-focus-ring); }",
    );
  });
});

describe('<line-avatar-group> machine (F2, F12, F13; D2, D22, D25)', () => {
  test('a mouse or pen pointer expands and collapses the stack; a touch pointer does nothing (F2)', async () => {
    const el = await mount('max="2"', 4);
    for (const type of ['mouse', 'pen']) {
      pointer(el, 'pointerenter', type);
      await settle(el);
      expect(state(el)).toBe('expanded');
      expect(internals(el).states.has('expanded')).toBe(true);
      pointer(el, 'pointerleave', type);
      await settle(el);
      expect(state(el)).toBe('collapsed');
      expect(internals(el).states.has('expanded')).toBe(false);
    }
    pointer(el, 'pointerenter', 'touch');
    await settle(el);
    expect(state(el)).toBe('collapsed');
  });

  test('only a focusin whose target matches :focus-visible expands; focusout to outside collapses (F13)', async () => {
    const el = await mount('max="2"', 4);
    const avatar = el.querySelector('#a1') as Element;
    focusIn(avatar, false);
    await settle(el);
    expect(state(el)).toBe('collapsed');
    focusIn(avatar, true);
    await settle(el);
    expect(state(el)).toBe('expanded');
    focusOut(avatar, el.querySelector('#a2'));
    await settle(el);
    expect(state(el)).toBe('expanded');
    focusOut(avatar, el);
    await settle(el);
    expect(state(el)).toBe('expanded');
    focusOut(avatar, document.body);
    await settle(el);
    expect(state(el)).toBe('collapsed');
  });

  test('one open passes collapsed → expanded → overflow_open, and one close goes back with no source (F12)', async () => {
    const actions = avatarGroupMachine.implementations?.actions;
    if (!(actions?.forward && actions.settle)) throw new Error('no forward or settle action');
    const { forward, settle: settleAction } = actions;
    const seen: string[] = [];
    actions.forward = (params) => {
      seen.push(`forward in ${params.state.get()}`);
      forward(params);
    };
    actions.settle = (params) => {
      seen.push(`settle in ${params.state.get()}`);
      settleAction(params);
    };
    try {
      const el = await mount('max="2"', 4);
      toggle(el, 'open');
      await settle(el);
      expect(state(el)).toBe('overflow_open');
      expect(internals(el).states.has('open')).toBe(true);
      expect(button(el).getAttribute('aria-expanded')).toBe('true');
      toggle(el, 'closed');
      await settle(el);
      expect(state(el)).toBe('collapsed');
      expect(internals(el).states.has('open')).toBe(false);
      expect(button(el).getAttribute('aria-expanded')).toBe('false');
      expect(seen).toEqual(['forward in expanded', 'settle in expanded']);
    } finally {
      actions.forward = forward;
      actions.settle = settleAction;
    }
  });

  test('a close with a source left stays expanded (D25)', async () => {
    const el = await mount('max="2"', 4);
    pointer(el, 'pointerenter', 'mouse');
    toggle(el, 'open');
    await settle(el);
    expect(state(el)).toBe('overflow_open');
    toggle(el, 'closed');
    await settle(el);
    expect(state(el)).toBe('expanded');
  });

  test('HOVER.END is ignored in overflow_open, and the stack collapses on the close that follows (probe P1)', async () => {
    const el = await mount('max="2"', 4);
    pointer(el, 'pointerenter', 'mouse');
    toggle(el, 'open');
    await settle(el);
    pointer(el, 'pointerleave', 'mouse');
    await settle(el);
    expect(state(el)).toBe('overflow_open');
    toggle(el, 'closed');
    await settle(el);
    expect(state(el)).toBe('collapsed');
  });

  test('hasOverflow blocks an open that arrives with no child past max', async () => {
    const el = await mount('max="2"', 4);
    const target = panel(el);
    el.max = 4;
    await settle(el);
    target.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'open' }));
    await settle(el);
    expect(state(el)).toBe('collapsed');
  });

  test('a close reported while collapsed or expanded changes nothing', async () => {
    const el = await mount('max="2"', 4);
    toggle(el, 'closed');
    await settle(el);
    expect(state(el)).toBe('collapsed');
    pointer(el, 'pointerenter', 'mouse');
    await settle(el);
    toggle(el, 'closed');
    await settle(el);
    expect(state(el)).toBe('expanded');
  });

  test('Escape collapses an expanded stack, unless a child prevented it or the panel is open (F2; D25)', async () => {
    const el = await mount('max="2"', 4);
    pointer(el, 'pointerenter', 'mouse');
    await settle(el);
    const avatar = el.querySelector('#a1') as Element;
    avatar.addEventListener('keydown', (event) => event.preventDefault(), { once: true });
    pressEscape(avatar);
    await settle(el);
    expect(state(el)).toBe('expanded');
    toggle(el, 'open');
    await settle(el);
    pressEscape(button(el));
    await settle(el);
    expect(state(el)).toBe('overflow_open');
    toggle(el, 'closed');
    await settle(el);
    expect(state(el)).toBe('expanded');
    pressEscape(avatar);
    await settle(el);
    expect(state(el)).toBe('collapsed');
  });

  test('dismissed survives an open and a close, and holds while either source remains (D25)', async () => {
    const el = await mount('max="2"', 4);
    const avatar = el.querySelector('#a1') as Element;
    pointer(el, 'pointerenter', 'mouse');
    focusIn(avatar, true);
    await settle(el);
    expect(state(el)).toBe('expanded');
    pressEscape(avatar);
    await settle(el);
    expect(state(el)).toBe('collapsed');

    // An open and a close of the panel keep it.
    toggle(el, 'open');
    await settle(el);
    expect(state(el)).toBe('overflow_open');
    toggle(el, 'closed');
    await settle(el);
    expect(state(el)).toBe('collapsed');

    // The pointer leaves and returns while focus stays: still dismissed.
    pointer(el, 'pointerleave', 'mouse');
    pointer(el, 'pointerenter', 'mouse');
    await settle(el);
    expect(state(el)).toBe('collapsed');

    // Focus leaves while the pointer stays, and returns: still dismissed.
    focusOut(avatar, document.body);
    focusIn(avatar, true);
    await settle(el);
    expect(state(el)).toBe('collapsed');

    // Both leave: cleared, and either source expands again.
    focusOut(avatar, document.body);
    pointer(el, 'pointerleave', 'mouse');
    await settle(el);
    pointer(el, 'pointerenter', 'mouse');
    await settle(el);
    expect(state(el)).toBe('expanded');
  });

  test('a beforetoggle toward closed with focus on a panel child records focusInside, and the close restores focus (D7)', async () => {
    const el = await fixture<LineAvatarGroup>(
      html`<line-avatar-group max="1"
        ><a id="l1" href="#1">One</a><a id="l2" href="#2">Two</a><a id="l3" href="#3">Three</a></line-avatar-group
      >`,
    );
    await settle(el);
    toggle(el, 'open');
    await settle(el);
    const focus = mock();
    button(el).focus = focus;
    (el.querySelector('#l3') as HTMLElement).focus();
    toggle(el, 'closed', 'beforetoggle');
    toggle(el, 'closed');
    await settle(el);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus.mock.calls[0]).toEqual([{ focusVisible: true }]);

    toggle(el, 'open');
    await settle(el);
    (el.querySelector('#l1') as HTMLElement).focus();
    toggle(el, 'closed', 'beforetoggle');
    toggle(el, 'closed');
    await settle(el);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  test('fires no event through a full hover, open and close cycle (C3)', async () => {
    const el = await mount('max="2"', 4);
    const seen: string[] = [];
    const dispatch = el.dispatchEvent.bind(el);
    el.dispatchEvent = (event: Event) => {
      if (event instanceof CustomEvent) seen.push(event.type);
      return dispatch(event);
    };
    pointer(el, 'pointerenter', 'mouse');
    toggle(el, 'open');
    await settle(el);
    toggle(el, 'closed');
    pointer(el, 'pointerleave', 'mouse');
    await settle(el);
    expect(seen).toEqual([]);
  });
});

describe('<line-avatar-group> overflow emptied while the panel is open (D21)', () => {
  test('keeps the panel and root, calls hidePopover() once, and drops both after the close', async () => {
    const el = await mount('max="2"', 3);
    toggle(el, 'open');
    await settle(el);
    expect(state(el)).toBe('overflow_open');
    const target = panel(el);
    const hide = mock();
    target.hidePopover = hide;
    el.querySelector('#a3')?.remove();
    await settle(el);
    expect(parts(el)).toEqual(['root', 'overflow', 'content']);
    expect(hide).toHaveBeenCalledTimes(1);
    el.requestUpdate();
    await settle(el);
    expect(hide).toHaveBeenCalledTimes(1);
    target.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }));
    await settle(el);
    expect(parts(el)).toEqual([]);
    expect(state(el)).toBe('collapsed');
  });
});

describe('<line-avatar-group> overflow button ARIA and focus-visible (D8, D27)', () => {
  test('aria-expanded follows the machine and aria-controls names the panel', async () => {
    const el = await mount('max="2"', 4);
    expect(button(el).getAttribute('aria-expanded')).toBe('false');
    expect(button(el).getAttribute('aria-controls')).toBe('content');
  });

  test('focus-visible follows whether the focused button matches :focus-visible, and clears on blur', async () => {
    const el = await mount('max="2"', 4);
    let visible = true;
    button(el).matches = (selector: string) => selector === ':focus-visible' && visible;
    button(el).dispatchEvent(new FocusEvent('focus'));
    await settle(el);
    expect(el.hasAttribute('data-focus-visible')).toBe(true);
    expect(internals(el).states.has('focus-visible')).toBe(true);
    button(el).dispatchEvent(new FocusEvent('blur'));
    await settle(el);
    expect(el.hasAttribute('data-focus-visible')).toBe(false);
    expect(internals(el).states.has('focus-visible')).toBe(false);
    visible = false;
    button(el).dispatchEvent(new FocusEvent('focus'));
    await settle(el);
    expect(el.hasAttribute('data-focus-visible')).toBe(false);
  });
});

describe('<line-avatar-group> machine-failure fallback (MANIFESTO Law 9; D8, D27)', () => {
  test('never expands, keeps the button and the panel, and keeps focus-visible', async () => {
    await withFailedMachine(async () => {
      const el = await mount('max="2"', 4);
      expect(console.error).toHaveBeenCalledTimes(1);
      pointer(el, 'pointerenter', 'mouse');
      focusIn(el.querySelector('#a1') as Element, true);
      await settle(el);
      expect(state(el)).toBe('collapsed');
      expect(parts(el)).toEqual(['root', 'overflow', 'content']);
      expect(button(el).textContent).toBe('+2');
      expect(button(el).getAttribute('aria-expanded')).toBe('false');
      toggle(el, 'open');
      await settle(el);
      expect(el.hasAttribute('data-open')).toBe(false);
      button(el).matches = (selector: string) => selector === ':focus-visible';
      button(el).dispatchEvent(new FocusEvent('focus'));
      await settle(el);
      expect(el.hasAttribute('data-focus-visible')).toBe(true);
      expect(internals(el).states.has('focus-visible')).toBe(true);
    });
  });
});
