/**
 * `<line-presence>` unit tier (spec `0017-presence.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`, whose fake internals hold the custom states. The component comes
 * from `src/` and `line-core` from its built `dist/` (spec §7.8 rules 1 and 3), so this file needs `bun run build`
 * first, as the CI unit tier has. happy-dom computes no animation name, so every exit ends one frame after `present`
 * clears (P8; D19). Each change of `present` takes at least two host updates whose count varies, so every assertion
 * on `root` or on an event waits on the outcome with `waitUntil`. Exit timing, the tracked node, focus and the
 * accessibility tree live in the browser tier (`integration/presence/presence.e2e.ts`).
 *
 * @module __tests__/presence
 */

import { describe, expect, mock, spyOn, test } from 'bun:test';
import { fixture, html, waitUntil } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import { machine } from '@zag-js/presence';
import {
  LinePresence,
  type LinePresenceEnterCompleteDetail,
  type LinePresenceExitCompleteDetail,
} from '../src/presence/index.js';

type PropReader = Parameters<typeof machine.initialState>[0]['prop'];

/** The field of the preload's fake internals these tests read. */
interface RecordingInternals {
  states: Set<string>;
}

function internals(el: LinePresence): RecordingInternals {
  return Reflect.get(el, INTERNALS) as RecordingInternals;
}

function rootOf(el: LinePresence): HTMLElement {
  const root = el.shadowRoot?.querySelector<HTMLElement>('[part="root"]');
  if (!root) throw new Error('no [part="root"]');
  return root;
}

/** Yields one task. */
function nextTask(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve);
  return promise;
}

async function mount(template = html`<line-presence><p>Content</p></line-presence>`): Promise<LinePresence> {
  return fixture<LinePresence>(template);
}

interface Recorded {
  type: string;
  detail: unknown;
  bubbles: boolean;
  composed: boolean;
  rootHidden: boolean;
}

/** Records both completion events with the state of `root` their listeners see. */
function record(el: LinePresence): Recorded[] {
  const events: Recorded[] = [];
  for (const type of ['line-exit-complete', 'line-enter-complete']) {
    el.addEventListener(type, (event) => {
      events.push({
        type,
        detail: (event as CustomEvent).detail,
        bubbles: event.bubbles,
        composed: event.composed,
        rootHidden: rootOf(el).hidden,
      });
    });
  }
  return events;
}

/** Mounts with the machine's `prop` reader captured, as `chip.update-rate.test.ts` does. */
async function mountCapturing(
  template = html`<line-presence present><p>Content</p></line-presence>`,
): Promise<{ el: LinePresence; prop: () => PropReader | undefined }> {
  let prop: PropReader | undefined;
  const { initialState } = machine;
  machine.initialState = (params) => {
    prop = params.prop;
    return initialState(params);
  };
  try {
    const el = await mount(template);
    return { el, prop: () => prop };
  } finally {
    machine.initialState = initialState;
  }
}

describe('<line-presence> registration, defaults and reflection', () => {
  test('registers line-presence with LinePresence', () => {
    expect(customElements.get('line-presence')).toBe(LinePresence);
  });

  test('present and skipAnimationOnMount default to false and reflect', async () => {
    const el = await mount();
    expect(el.present).toBe(false);
    expect(el.skipAnimationOnMount).toBe(false);
    expect(el.hasAttribute('present')).toBe(false);
    expect(el.hasAttribute('skip-animation-on-mount')).toBe(false);

    el.present = true;
    el.skipAnimationOnMount = true;
    await el.updateComplete;
    expect(el.hasAttribute('present')).toBe(true);
    expect(el.hasAttribute('skip-animation-on-mount')).toBe(true);

    el.removeAttribute('present');
    el.setAttribute('skip-animation-on-mount', 'false');
    await el.updateComplete;
    expect(el.present).toBe(false);
    expect(el.skipAnimationOnMount).toBe(true);
  });

  test('renders one root part holding the default slot', async () => {
    const el = await mount();
    const parts = [...(el.shadowRoot?.querySelectorAll('[part]') ?? [])].map((part) => part.getAttribute('part'));
    expect(parts).toEqual(['root']);
    expect(rootOf(el).querySelector('slot:not([name])')).not.toBeNull();
  });

  test('without present the root is hidden and the host has no data-open', async () => {
    const el = await mount();
    expect(rootOf(el).hidden).toBe(true);
    expect(el.hasAttribute('data-open')).toBe(false);
    expect(internals(el).states.has('open')).toBe(false);
  });

  test('with present the host has data-open and :state(open), and the root shows', async () => {
    const el = await mount(html`<line-presence present><p>Content</p></line-presence>`);
    expect(el.hasAttribute('data-open')).toBe(true);
    expect(internals(el).states.has('open')).toBe(true);
    await waitUntil(() => !rootOf(el).hidden);
    expect(rootOf(el).hidden).toBe(false);
  });

  test('open follows present in the update that commits it, before the root changes', async () => {
    const el = await mount(html`<line-presence present><p>Content</p></line-presence>`);
    await waitUntil(() => !rootOf(el).hidden);
    el.present = false;
    await el.updateComplete;
    expect(el.hasAttribute('data-open')).toBe(false);
    expect(internals(el).states.has('open')).toBe(false);
    await waitUntil(() => rootOf(el).hidden);

    el.present = true;
    await el.updateComplete;
    expect(el.hasAttribute('data-open')).toBe(true);
    expect(internals(el).states.has('open')).toBe(true);
    await waitUntil(() => !rootOf(el).hidden);
  });

  test('clearing present hides the root after one frame, and setting it shows the root again', async () => {
    const el = await mount(html`<line-presence present><p>Content</p></line-presence>`);
    await waitUntil(() => !rootOf(el).hidden);
    el.present = false;
    await waitUntil(() => rootOf(el).hidden);
    el.setAttribute('present', '');
    await waitUntil(() => !rootOf(el).hidden);
    expect(el.present).toBe(true);
  });

  test('hidden hides the host', async () => {
    const el = await mount(html`<line-presence present hidden><p>Content</p></line-presence>`);
    expect(el.hidden).toBe(true);
    const own = (LinePresence.styles as { cssText: string }[]).at(-1)?.cssText.replace(/\s+/g, ' ') ?? '';
    expect(own).toContain(':host([hidden]) { display: none; }');
    expect(own).toContain(':host { display: contents; }');
  });
});

describe('<line-presence> events', () => {
  test('line-exit-complete and line-enter-complete fire once each with their detail, bubble and are not composed', async () => {
    const el = await mount(html`<line-presence present><p>Content</p></line-presence>`);
    const events = record(el);
    await waitUntil(() => !rootOf(el).hidden);
    await nextTask();
    expect(events).toEqual([]);

    el.present = false;
    await waitUntil(() => events.length === 1);
    expect(events).toEqual([
      { type: 'line-exit-complete', detail: { present: false }, bubbles: true, composed: false, rootHidden: true },
    ]);
    const exit: LinePresenceExitCompleteDetail = events[0]?.detail as LinePresenceExitCompleteDetail;
    expect(exit.present).toBe(false);

    el.present = true;
    await waitUntil(() => events.length === 2);
    expect(events[1]).toEqual({
      type: 'line-enter-complete',
      detail: { present: true },
      bubbles: true,
      composed: false,
      rootHidden: false,
    });
    const enter: LinePresenceEnterCompleteDetail = events[1]?.detail as LinePresenceEnterCompleteDetail;
    expect(enter.present).toBe(true);

    await nextTask();
    await el.updateComplete;
    expect(events).toHaveLength(2);
  });

  test('neither event fires at the first render, open or closed', async () => {
    const events: string[] = [];
    const listen = (event: Event) => events.push(event.type);
    document.addEventListener('line-exit-complete', listen);
    document.addEventListener('line-enter-complete', listen);
    try {
      const open = await mount(html`<line-presence present><p>Open</p></line-presence>`);
      const closed = await mount();
      await waitUntil(() => !rootOf(open).hidden);
      await nextTask();
      await Promise.all([open.updateComplete, closed.updateComplete]);
      expect(events).toEqual([]);
    } finally {
      document.removeEventListener('line-exit-complete', listen);
      document.removeEventListener('line-enter-complete', listen);
    }
  });

  test('a host removed after its exit callback and before the dispatching update fires no event, nor once appended again', async () => {
    const { el, prop } = await mountCapturing();
    const parent = el.parentElement as HTMLElement;
    await waitUntil(() => !rootOf(el).hidden);
    const events = record(el);

    prop()?.('onExitComplete')?.();
    el.remove();
    await el.updateComplete;
    await nextTask();
    expect(events).toEqual([]);

    parent.append(el);
    await el.updateComplete;
    await nextTask();
    await el.updateComplete;
    expect(events).toEqual([]);
  });

  test('dispatches no event of any other kind', async () => {
    const dispatch = spyOn(LinePresence.prototype, 'dispatchEvent');
    try {
      const el = await mount();
      el.present = true;
      await waitUntil(() => !rootOf(el).hidden);
      el.present = false;
      await waitUntil(() => rootOf(el).hidden);
      el.present = true;
      await waitUntil(() => !rootOf(el).hidden);
      await nextTask();
      await el.updateComplete;
      expect([...new Set(dispatch.mock.calls.map(([event]) => event.type))].sort()).toEqual([
        'line-enter-complete',
        'line-exit-complete',
      ]);
    } finally {
      dispatch.mockRestore();
    }
  });
});

describe('<line-presence> skip-animation-on-mount', () => {
  test('the skip class sits on the root only while the attribute and the machine skip both hold', async () => {
    const el = await mount(html`<line-presence present skip-animation-on-mount><p>Content</p></line-presence>`);
    expect(rootOf(el).classList.contains('skip')).toBe(true);

    el.present = false;
    await waitUntil(() => !rootOf(el).classList.contains('skip'));
    await waitUntil(() => rootOf(el).hidden);
    el.present = true;
    await waitUntil(() => !rootOf(el).hidden);
    expect(rootOf(el).classList.contains('skip')).toBe(false);

    const plain = await mount(html`<line-presence present><p>Content</p></line-presence>`);
    expect(rootOf(plain).classList.contains('skip')).toBe(false);
  });

  test('a shadow rule blocks any root animation while the skip class holds', () => {
    const own = (LinePresence.styles as { cssText: string }[]).at(-1)?.cssText.replace(/\s+/g, ' ') ?? '';
    expect(own).toContain("[part='root'].skip { animation: none !important; }");
    expect(own).not.toContain('@keyframes');
  });
});

describe('<line-presence> machine-failure fallback and no service', () => {
  // The failed machine leaves the controller with no service, and `connect` on a missing service throws, so a
  // first update and a reconnect that do not throw have called neither `connect` nor `setNode` (D7, D24).
  test('with the machine failing to start, neither the first update nor a reconnect throws, root follows present, each later change fires its event and no skip class renders', async () => {
    const { initialState } = machine;
    const consoleError = console.error;
    console.error = mock();
    machine.initialState = () => {
      throw new Error('machine start failure');
    };
    try {
      const events: string[] = [];
      const listen = (event: Event) => events.push(event.type);
      document.addEventListener('line-exit-complete', listen);
      document.addEventListener('line-enter-complete', listen);
      try {
        const el = await mount(html`<line-presence present skip-animation-on-mount><p>Content</p></line-presence>`);
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(rootOf(el).hidden).toBe(false);
        expect(rootOf(el).classList.contains('skip')).toBe(false);
        expect(events).toEqual([]);

        el.present = false;
        await el.updateComplete;
        expect(rootOf(el).hidden).toBe(true);
        expect(events).toEqual(['line-exit-complete']);

        el.present = true;
        await el.updateComplete;
        expect(rootOf(el).hidden).toBe(false);
        expect(events).toEqual(['line-exit-complete', 'line-enter-complete']);

        const parent = el.parentElement as HTMLElement;
        el.remove();
        expect(() => parent.append(el)).not.toThrow();
        await el.updateComplete;
        expect(rootOf(el).hidden).toBe(false);
        expect(rootOf(el).classList.contains('skip')).toBe(false);
      } finally {
        document.removeEventListener('line-exit-complete', listen);
        document.removeEventListener('line-enter-complete', listen);
      }
    } finally {
      machine.initialState = initialState;
      console.error = consoleError;
    }
  });

  test('a disconnected host, with no service and no fallback, follows present and fires nothing', async () => {
    const el = await mount(html`<line-presence present><p>Content</p></line-presence>`);
    await waitUntil(() => !rootOf(el).hidden);
    const events = record(el);
    el.remove();
    el.present = false;
    await el.updateComplete;
    expect(rootOf(el).hidden).toBe(true);
    el.present = true;
    await el.updateComplete;
    expect(rootOf(el).hidden).toBe(false);
    await nextTask();
    expect(events).toEqual([]);
  });
});
