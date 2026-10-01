/**
 * Direction mixin unit tests (D4, spec §6.D.4, AM-031).
 *
 * happy-dom's `:dir()` always returns `false`, so the test host overrides
 * `matches(':dir(rtl)')` with a nearest-`dir`-ancestor lookup. That stub stands
 * in for the engine. These tests cover the observer lifecycle and the update
 * contract; real `:dir()` resolution lives in the browser tier
 * (`integration/direction/direction.e2e.ts`).
 *
 * Runs on F2's harness. `bun-test-preload.ts` registers happy-dom globally and
 * runs `@open-wc/testing-helpers` `fixtureCleanup` after each test.
 *
 * @module __tests__/direction
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { LitElement, type PropertyValues } from 'lit';
import { LineElement } from '../src/line-element.js';
import { DirectionMixin } from '../src/mixins/direction.js';

/** Nearest `dir="rtl"`/`dir="ltr"` ancestor-or-self, as the engine resolves explicit `dir`. */
function stubDirRtl(el: Element): boolean {
  return el.closest('[dir="rtl"], [dir="ltr"]')?.getAttribute('dir') === 'rtl';
}

/** Records every `direction` change Lit reports to `updated()`. */
class DirectionHost extends DirectionMixin(LitElement) {
  directionChanges: Array<{ from: unknown; to: string }> = [];
  updates = 0;

  override matches(selectors: string): boolean {
    return selectors === ':dir(rtl)' ? stubDirRtl(this) : super.matches(selectors);
  }

  override updated(changed: PropertyValues<this>): void {
    this.updates += 1;
    if (changed.has('direction')) {
      this.directionChanges.push({ from: changed.get('direction'), to: this.direction });
    }
  }
}

/** `LineElement` subclass, the shape every component takes. */
class LineDirectionHost extends LineElement {
  override matches(selectors: string): boolean {
    return selectors === ':dir(rtl)' ? stubDirRtl(this) : super.matches(selectors);
  }

  override render() {
    return html`<span part="value">${this.direction}</span>`;
  }
}

customElements.define('line-test-direction', DirectionHost);
customElements.define('line-test-direction-element', LineDirectionHost);

/**
 * Waits for the update a `dir` mutation causes. The observer callback runs in
 * a microtask queued by the mutation, so one microtask turn runs it before
 * `updateComplete` is read.
 */
async function settle(el: LitElement): Promise<void> {
  await Promise.resolve();
  await el.updateComplete;
}

/** Records every `MutationObserver` the mixin constructs while installed. */
function spyOnMutationObserver() {
  const Native = globalThis.MutationObserver;
  const calls = {
    constructed: 0,
    observe: [] as Array<{ target: Node; options?: MutationObserverInit }>,
    disconnect: 0,
  };
  class SpyObserver extends Native {
    constructor(callback: MutationCallback) {
      super(callback);
      calls.constructed += 1;
    }
    override observe(target: Node, options?: MutationObserverInit): void {
      calls.observe.push(options ? { target, options } : { target });
      super.observe(target, options);
    }
    override disconnect(): void {
      calls.disconnect += 1;
      super.disconnect();
    }
  }
  globalThis.MutationObserver = SpyObserver;
  return { calls, restore: () => (globalThis.MutationObserver = Native) };
}

afterEach(() => {
  document.documentElement.removeAttribute('dir');
});

describe('DirectionMixin', () => {
  test('resolves direction on connect', async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <line-test-direction id="ltr"></line-test-direction>
        <div dir="rtl"><line-test-direction id="rtl"></line-test-direction></div>
      </div>
    `);
    const ltr = wrapper.querySelector<DirectionHost>('#ltr');
    const rtl = wrapper.querySelector<DirectionHost>('#rtl');
    expect(ltr?.direction).toBe('ltr');
    expect(rtl?.direction).toBe('rtl');
  });

  test('recomputes when it reconnects under a different ancestor', async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div><line-test-direction></line-test-direction><div dir="rtl"></div></div>
    `);
    const el = wrapper.querySelector<DirectionHost>('line-test-direction');
    if (!el) throw new Error('host missing');
    expect(el.direction).toBe('ltr');

    wrapper.querySelector('[dir="rtl"]')?.append(el);
    await el.updateComplete;
    expect(el.direction).toBe('rtl');
  });

  test('a flip of an ancestor dir updates direction with the old value', async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div dir="ltr"><line-test-direction></line-test-direction></div>
    `);
    const el = wrapper.querySelector<DirectionHost>('line-test-direction');
    if (!el) throw new Error('host missing');
    el.directionChanges = [];

    wrapper.setAttribute('dir', 'rtl');
    await settle(el);
    expect(el.direction).toBe('rtl');
    expect(el.directionChanges).toEqual([{ from: 'ltr', to: 'rtl' }]);

    wrapper.setAttribute('dir', 'ltr');
    await settle(el);
    expect(el.direction).toBe('ltr');
    expect(el.directionChanges.at(-1)).toEqual({ from: 'rtl', to: 'ltr' });
  });

  test('a flip of the document dir updates every connected host', async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div><line-test-direction></line-test-direction><line-test-direction></line-test-direction></div>
    `);
    const hosts = [...wrapper.querySelectorAll<DirectionHost>('line-test-direction')];

    document.documentElement.setAttribute('dir', 'rtl');
    await Promise.all(hosts.map(settle));
    expect(hosts.map((el) => el.direction)).toEqual(['rtl', 'rtl']);
  });

  test('a dir mutation that leaves the value unchanged triggers no update', async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div><div id="inner"><line-test-direction></line-test-direction></div></div>
    `);
    const el = wrapper.querySelector<DirectionHost>('line-test-direction');
    if (!el) throw new Error('host missing');
    const updatesBefore = el.updates;
    el.directionChanges = [];

    wrapper.querySelector('#inner')?.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('dir', 'ltr');
    await settle(el);
    expect(el.isUpdatePending).toBe(false);
    expect(el.updates).toBe(updatesBefore);
    expect(el.directionChanges).toEqual([]);
  });

  test('one document observer serves every host and stops after the last disconnects', async () => {
    const spy = spyOnMutationObserver();
    try {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div><line-test-direction></line-test-direction><line-test-direction></line-test-direction></div>
      `);
      const [first, second] = [...wrapper.querySelectorAll<DirectionHost>('line-test-direction')];
      if (!(first && second)) throw new Error('hosts missing');

      expect(spy.calls.constructed).toBe(1);
      expect(spy.calls.observe).toEqual([
        { target: document, options: { subtree: true, attributes: true, attributeFilter: ['dir'] } },
      ]);

      first.remove();
      expect(spy.calls.disconnect).toBe(0);
      second.remove();
      expect(spy.calls.disconnect).toBe(1);

      // A host that is gone no longer recomputes.
      document.documentElement.setAttribute('dir', 'rtl');
      await settle(second);
      expect(second.direction).toBe('ltr');

      wrapper.append(first);
      expect(spy.calls.constructed).toBe(2);
      expect(spy.calls.observe).toHaveLength(2);
      expect(first.direction).toBe('rtl');
    } finally {
      spy.restore();
    }
  });

  test('never adds a dir attribute to the host', async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div dir="rtl"><line-test-direction></line-test-direction></div>
    `);
    const el = wrapper.querySelector<DirectionHost>('line-test-direction');
    if (!el) throw new Error('host missing');
    expect(el.direction).toBe('rtl');

    wrapper.setAttribute('dir', 'ltr');
    await settle(el);
    expect(el.direction).toBe('ltr');
    expect(el.hasAttribute('dir')).toBe(false);
  });

  test('leaves the native dir accessor reflecting the attribute', async () => {
    const el = await fixture<DirectionHost>(html`<line-test-direction></line-test-direction>`);
    expect(el.dir).toBe('');

    el.dir = 'auto';
    expect(el.getAttribute('dir')).toBe('auto');
    expect(el.dir).toBe('auto');

    el.setAttribute('dir', 'rtl');
    await settle(el);
    expect(el.dir).toBe('rtl');
    expect(el.direction).toBe('rtl');
  });

  test('direction has no public setter', async () => {
    const el = await fixture<DirectionHost>(html`<line-test-direction></line-test-direction>`);
    const writable = el as { direction: string };
    expect(() => {
      writable.direction = 'rtl';
    }).toThrow(TypeError);
    expect(el.direction).toBe('ltr');
  });

  test('a LineElement subclass renders this.direction and re-renders on change', async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div dir="rtl"><line-test-direction-element></line-test-direction-element></div>
    `);
    const el = wrapper.querySelector<LineDirectionHost>('line-test-direction-element');
    if (!el) throw new Error('host missing');
    const value = () => el.shadowRoot?.querySelector('[part="value"]')?.textContent;
    expect(value()).toBe('rtl');

    wrapper.setAttribute('dir', 'ltr');
    await settle(el);
    expect(value()).toBe('ltr');
  });
});
