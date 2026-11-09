/**
 * `<line-alert>` unit tier (spec `0006-alert.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`, whose fake internals hold `role`. The component comes from
 * `src/` and `line-core` from its built `dist/` (spec §7.8 rules 1 and 3), so this file needs `bun run build`
 * first, as the CI unit tier has. Layout, computed colours, focus and the accessibility tree live in the browser
 * tier (`integration/alert/alert.e2e.ts`).
 *
 * @module __tests__/alert
 */

import { describe, expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import type { TemplateResult } from 'lit';
import { LineAlert } from '../src/alert/index.js';

const ZONES = ['icon', 'title', 'description', 'actions', 'dismiss'] as const;

function roleOf(el: LineAlert): string | null {
  const internals = Reflect.get(el, INTERNALS) as { role?: string | null } | undefined;
  return internals?.role ?? null;
}

/** Yields one task, after the microtasks that deliver `slotchange` and mutation records. */
function nextTask(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve);
  return promise;
}

async function settle(el: LineAlert): Promise<void> {
  await el.updateComplete;
  await nextTask();
  await el.updateComplete;
}

async function mount(template: TemplateResult = html`<line-alert></line-alert>`): Promise<LineAlert> {
  const el = await fixture<LineAlert>(template);
  await settle(el);
  return el;
}

/** Builds an alert from markup, so attribute values reach the element unparsed. */
async function mountMarkup(markup: string): Promise<LineAlert> {
  const host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
  const el = host.querySelector('line-alert') as LineAlert;
  await settle(el);
  return el;
}

function part(el: LineAlert, name: string): HTMLElement {
  return el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;
}

/** The zones whose wrapper renders without `hidden`. */
function shown(el: LineAlert): string[] {
  return ZONES.filter((zone) => !part(el, zone).hidden);
}

describe('<line-alert> defaults and reflection', () => {
  test('registers line-alert with the LineAlert class', () => {
    expect(customElements.get('line-alert')).toBe(LineAlert);
  });

  test('defaults to a neutral alert with live off', async () => {
    const el = await mount();
    expect(el.variant).toBe('neutral');
    expect(el.live).toBe('off');
  });

  test('writes no attribute for a default, so the :host defaults apply', async () => {
    const el = await mount();
    expect(el.getAttributeNames()).toEqual([]);
  });

  test('reflects every property set from script', async () => {
    const el = await mount();
    el.variant = 'danger';
    el.live = 'assertive';
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('danger');
    expect(el.getAttribute('live')).toBe('assertive');
  });

  test('parses the attributes it reads', async () => {
    const el = await mountMarkup('<line-alert variant="warning" live="polite"></line-alert>');
    expect(el.variant).toBe('warning');
    expect(el.live).toBe('polite');
  });

  test('an unknown variant behaves as neutral and keeps the author value', async () => {
    const el = await mountMarkup('<line-alert variant="error"></line-alert>');
    expect(el.variant).toBe('neutral');
    expect(el.getAttribute('variant')).toBe('error');
  });

  test('an unknown live behaves as off and keeps the author value', async () => {
    const el = await mountMarkup('<line-alert live="loud"></line-alert>');
    expect(el.live).toBe('off');
    expect(el.getAttribute('live')).toBe('loud');
    expect(roleOf(el)).toBeNull();
  });

  test('removing an attribute restores the default', async () => {
    const el = await mountMarkup('<line-alert variant="success" live="assertive"></line-alert>');
    el.removeAttribute('variant');
    el.removeAttribute('live');
    await el.updateComplete;
    expect(el.variant).toBe('neutral');
    expect(el.live).toBe('off');
    expect(el.getAttributeNames()).toEqual([]);
  });
});

describe('<line-alert> internals role (decisions D1, D2, D8, D12)', () => {
  for (const [markup, role] of [
    ['<line-alert></line-alert>', null],
    ['<line-alert live="off"></line-alert>', null],
    ['<line-alert live="bogus"></line-alert>', null],
    ['<line-alert live="polite"></line-alert>', 'status'],
    ['<line-alert live="assertive"></line-alert>', 'alert'],
  ] as const) {
    test(`${markup} sets role ${role}`, async () => {
      const el = await mountMarkup(markup);
      expect(roleOf(el)).toBe(role);
    });
  }

  test('the constructor writes the role before any update', () => {
    const el = document.createElement('line-alert');
    const internals = Reflect.get(el, INTERNALS) as { role?: string | null };
    expect(Object.hasOwn(internals, 'role')).toBe(true);
    expect(internals.role).toBeNull();
    expect(el.hasUpdated).toBe(false);
  });

  test('an attribute change writes the role synchronously, before the update', async () => {
    const el = await mount();
    el.setAttribute('live', 'assertive');
    expect(roleOf(el)).toBe('alert');
    el.setAttribute('live', 'polite');
    expect(roleOf(el)).toBe('status');
    el.setAttribute('live', 'off');
    expect(roleOf(el)).toBeNull();
    el.setAttribute('live', 'assertive');
    el.removeAttribute('live');
    expect(roleOf(el)).toBeNull();
  });

  test('a property set writes the role synchronously, before the update', async () => {
    const el = await mount();
    el.live = 'polite';
    expect(roleOf(el)).toBe('status');
    expect(el.isUpdatePending).toBe(true);
    el.live = 'assertive';
    expect(roleOf(el)).toBe('alert');
    el.live = 'off';
    expect(roleOf(el)).toBeNull();
    el.live = 'unknown' as LineAlert['live'];
    expect(roleOf(el)).toBeNull();
  });

  test('a host created with createElement has its role at append()', () => {
    const el = document.createElement('line-alert');
    el.setAttribute('live', 'assertive');
    expect(roleOf(el)).toBe('alert');
    document.body.append(el);
    expect(roleOf(el)).toBe('alert');
    el.remove();
  });

  test('a host parsed by innerHTML has its role before the first update', () => {
    const host = document.createElement('div');
    host.innerHTML = '<line-alert live="polite"></line-alert>';
    const el = host.querySelector('line-alert') as LineAlert;
    expect(el.hasUpdated).toBe(false);
    expect(roleOf(el)).toBe('status');
  });

  test('variant changes leave the role alone', async () => {
    const el = await mountMarkup('<line-alert live="polite"></line-alert>');
    for (const variant of ['info', 'success', 'warning', 'danger', 'neutral'] as const) {
      el.variant = variant;
      await el.updateComplete;
      expect(roleOf(el)).toBe('status');
    }
  });
});

describe('<line-alert> host attributes (decisions D2, D13)', () => {
  test('writes no role, aria-* or data-* attribute', async () => {
    const el = await mount();
    el.variant = 'danger';
    el.live = 'assertive';
    await el.updateComplete;
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.getAttributeNames().filter((name) => name.startsWith('aria-') || name.startsWith('data-'))).toEqual([]);
  });

  for (const live of ['assertive', 'off'] as const) {
    test(`leaves an author role, aria-live and aria-label unchanged with live="${live}"`, async () => {
      const el = await mountMarkup(
        `<line-alert live="${live}" role="note" aria-live="off" aria-label="Payment error"></line-alert>`,
      );
      el.live = live === 'off' ? 'polite' : 'off';
      el.variant = 'danger';
      await el.updateComplete;
      expect(el.getAttribute('role')).toBe('note');
      expect(el.getAttribute('aria-live')).toBe('off');
      expect(el.getAttribute('aria-label')).toBe('Payment error');
    });
  }
});

describe('<line-alert> shadow tree (decision D4)', () => {
  test('renders root > icon, content (title, description), actions, each zone wrapping its slot', async () => {
    const el = await mount();
    const root = part(el, 'root');
    expect(el.shadowRoot?.children.length).toBe(1);
    expect(root.parentNode).toBe(el.shadowRoot);
    expect([...root.children].map((child) => child.getAttribute('part'))).toEqual([
      'icon',
      'content',
      'dismiss',
      'actions',
    ]);
    expect([...part(el, 'content').children].map((child) => child.getAttribute('part'))).toEqual([
      'title',
      'description',
    ]);
    const slots = ZONES.map((zone) => {
      const children = [...part(el, zone).children];
      expect(children.length).toBe(1);
      return (children[0] as HTMLSlotElement).localName === 'slot' ? (children[0] as HTMLSlotElement).name : null;
    });
    expect(slots).toEqual(['icon', 'title', '', 'actions', 'dismiss']);
    for (const name of ['root', 'icon', 'content', 'title', 'description', 'actions', 'dismiss']) {
      expect(part(el, name).localName).toBe('div');
    }
  });

  test('takes no focus and does not delegate it', async () => {
    const el = await mount();
    expect(el.shadowRoot?.delegatesFocus).toBe(false);
    expect(el.hasAttribute('tabindex')).toBe(false);
  });
});

describe('<line-alert> empty zones (decision D11)', () => {
  test('an alert with every slot empty hides each zone and keeps root and content shown', async () => {
    const el = await mount();
    expect(shown(el)).toEqual([]);
    expect(part(el, 'root').hidden).toBe(false);
    expect(part(el, 'content').hidden).toBe(false);
  });

  test('whitespace and comments count as empty', async () => {
    const el = await mountMarkup('<line-alert>\n   <!-- note -->\t\n</line-alert>');
    expect(shown(el)).toEqual([]);
  });

  test('every zone with content renders at first update', async () => {
    const el = await mountMarkup(`<line-alert>
      <span slot="icon">!</span>
      <h3 slot="title">Payment failed</h3>
      Check the card number.
      <button slot="actions">Retry</button>
      <button slot="dismiss" aria-label="Dismiss">x</button>
    </line-alert>`);
    expect(shown(el)).toEqual([...ZONES]);
  });

  test('an element counts as content, even an empty one', async () => {
    const el = await mountMarkup('<line-alert><p></p><h3 slot="title"></h3></line-alert>');
    expect(shown(el)).toEqual(['title', 'description']);
  });

  test('a zone shows when content arrives and hides when it leaves, through slotchange', async () => {
    const el = await mount();
    const icon = document.createElement('span');
    icon.slot = 'icon';
    const action = document.createElement('button');
    action.slot = 'actions';
    el.append(icon, action, document.createTextNode('Saved.'));
    await settle(el);
    expect(shown(el)).toEqual(['icon', 'description', 'actions']);
    icon.remove();
    action.remove();
    el.lastChild?.remove();
    await settle(el);
    expect(shown(el)).toEqual([]);
  });

  test('a node moved to another slot moves its zone', async () => {
    const el = await mountMarkup('<line-alert><strong slot="title">Heads up</strong></line-alert>');
    expect(shown(el)).toEqual(['title']);
    el.querySelector('strong')?.removeAttribute('slot');
    await settle(el);
    expect(shown(el)).toEqual(['description']);
  });
});

describe('<line-alert> text changed in place (spec AM-001)', () => {
  test("the description shows when its text changes from '' to text, and hides when it changes back", async () => {
    const el = await mount();
    const text = document.createTextNode('');
    el.append(text);
    await settle(el);
    expect(shown(el)).toEqual([]);
    text.data = 'Payment failed.';
    await settle(el);
    expect(shown(el)).toEqual(['description']);
    text.nodeValue = '  ';
    await settle(el);
    expect(shown(el)).toEqual([]);
    text.textContent = 'Saved.';
    await settle(el);
    expect(shown(el)).toEqual(['description']);
  });

  test('a text change inside a slotted element leaves the zones as they are', async () => {
    const el = await mountMarkup('<line-alert><h3 slot="title">Title</h3></line-alert>');
    (el.querySelector('h3')?.firstChild as Text).data = '';
    await settle(el);
    expect(shown(el)).toEqual(['title']);
  });

  test('the observer stops while the host is out of the document and catches up on reinsertion', async () => {
    const el = await mount();
    const text = document.createTextNode('');
    el.append(text);
    await settle(el);
    const parent = el.parentNode as Node;
    el.remove();
    text.data = 'Changed while detached.';
    await settle(el);
    expect(shown(el)).toEqual([]);
    parent.appendChild(el);
    await settle(el);
    expect(shown(el)).toEqual(['description']);
    el.remove();
    parent.appendChild(el);
    text.data = '';
    await settle(el);
    expect(shown(el)).toEqual([]);
  });
});

// happy-dom leaves the assigned slot out of a slotted node's event path, so these tests click the `dismiss` slot
// itself; the browser tier clicks the slotted control.
describe('<line-alert> dismiss (spec AM-006)', () => {
  /** A click as it reaches the `dismiss` slot from its slotted control. */
  function clickSlot(el: LineAlert, init: { cancelled?: boolean } = {}): void {
    const slot = el.shadowRoot?.querySelector('slot[name="dismiss"]') as HTMLSlotElement;
    const click = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
    if (init.cancelled) click.preventDefault();
    slot.dispatchEvent(click);
  }

  async function dismissible(): Promise<{ el: LineAlert; button: HTMLButtonElement }> {
    const el = await mountMarkup(
      '<line-alert>Saved.<button slot="dismiss" aria-label="Dismiss">x</button><button slot="actions">Undo</button></line-alert>',
    );
    return { el, button: el.querySelector('[slot="dismiss"]') as HTMLButtonElement };
  }

  test('the dismiss zone shows while its slot holds a control', async () => {
    const { el, button } = await dismissible();
    expect(shown(el)).toContain('dismiss');
    button.remove();
    await settle(el);
    expect(shown(el)).not.toContain('dismiss');
  });

  test('a click in the dismiss slot fires line-dismiss with {} (bubbling, cancelable, not composed), then hides', async () => {
    const { el, button } = await dismissible();
    const events: CustomEvent[] = [];
    let hiddenDuringDispatch: boolean | undefined;
    document.addEventListener('line-dismiss', (event) => {
      events.push(event as CustomEvent);
      hiddenDuringDispatch = el.hidden;
    });
    clickSlot(el);
    expect(button.isConnected).toBe(true);
    expect(events.length).toBe(1);
    const [event] = events;
    expect([event?.detail, event?.bubbles, event?.cancelable, event?.composed, event?.target]).toEqual([
      {},
      true,
      true,
      false,
      el,
    ]);
    expect(hiddenDuringDispatch).toBe(false);
    expect(el.hidden).toBe(true);
    expect(el.hasAttribute('hidden')).toBe(true);
  });

  test('a cancelled line-dismiss leaves the alert shown', async () => {
    const { el, button } = await dismissible();
    el.addEventListener('line-dismiss', (event) => event.preventDefault());
    clickSlot(el);
    expect(button.isConnected).toBe(true);
    expect(el.hasAttribute('hidden')).toBe(false);
  });

  test('a click outside the dismiss slot, or a click already cancelled, does not dismiss', async () => {
    const { el } = await dismissible();
    let fired = 0;
    el.addEventListener('line-dismiss', () => {
      fired += 1;
    });
    (el.querySelector('[slot="actions"]') as HTMLButtonElement).click();
    el.click();
    clickSlot(el, { cancelled: true });
    expect(fired).toBe(0);
    expect(el.hasAttribute('hidden')).toBe(false);
  });

  test('an alert without a dismiss control writes no hidden attribute', async () => {
    const el = await mountMarkup('<line-alert>Saved.</line-alert>');
    el.click();
    expect(el.getAttributeNames()).toEqual([]);
  });
});
