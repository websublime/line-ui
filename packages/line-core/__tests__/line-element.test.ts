/**
 * `LineElement` internals and state reflection unit tests (C23, spec §6.C.2, SD19).
 *
 * happy-dom has no `attachInternals`, so `bun-test-preload.ts` gives every element a
 * `FakeInternals` from `mocks/element-internals.ts`. The fake's `states` set stands in
 * for `CustomStateSet`; real `:state()` matching lives in the browser tier
 * (`integration/line-element/line-element.e2e.ts`).
 *
 * Runs on F2's harness. `bun-test-preload.ts` registers happy-dom globally and
 * runs `@open-wc/testing-helpers` `fixtureCleanup` after each test.
 *
 * @module __tests__/line-element
 */

import { describe, expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '../src/index.js';
import { LineElement } from '../src/line-element.js';
import { type FakeInternals, installElementInternals } from './mocks/element-internals.js';

/** Plain `LineElement` subclass, the shape of every non-form component. */
class LineStateHost extends LineElement {
  /** Exposes the protected hook to the tests. */
  toggleState(name: string, active: boolean): void {
    this.reflectState(name, active);
  }
}

customElements.define('line-test-state', LineStateHost);

/** Mounts one host and returns it with the fake internals the preload attached. */
async function mount(): Promise<{ el: LineStateHost; fake: FakeInternals }> {
  const el = await fixture<LineStateHost>(html`<line-test-state></line-test-state>`);
  return { el, fake: Reflect.get(el, INTERNALS) as FakeInternals };
}

describe('LineElement internals', () => {
  test('attaches internals once per instance and reaches them through INTERNALS', () => {
    const { created, restore } = installElementInternals();
    try {
      const first = document.createElement('line-test-state');
      const second = document.createElement('line-test-state');
      expect(created.map((fake) => fake.host)).toEqual([first, second]);
      expect(Reflect.get(first, INTERNALS)).toBe(created[0]);
      expect(Reflect.get(second, INTERNALS)).toBe(created[1]);
    } finally {
      restore();
    }
  });

  test('exposes no internals name or symbol that axe looks up', async () => {
    const { el } = await mount();
    for (const name of ['_internals', 'internals', 'internals_']) {
      expect(name in el).toBe(false);
    }
    const descriptions = Object.getOwnPropertySymbols(el).map((symbol) => symbol.description);
    expect(descriptions).not.toContain('internals');
    expect(descriptions).not.toContain('privateInternals');
    expect(INTERNALS.description).toBe('line.internals');
    expect(Object.hasOwn(el, INTERNALS)).toBe(false);
  });

  test('is not form-associated', () => {
    expect(Reflect.get(LineStateHost, 'formAssociated')).toBeUndefined();
  });
});

describe('LineElement.reflectState', () => {
  test('toggles the data attribute and the custom state', async () => {
    const { el, fake } = await mount();
    el.toggleState('x', true);
    expect(el.getAttribute('data-x')).toBe('');
    expect([...fake.states]).toEqual(['x']);

    el.toggleState('x', false);
    expect(el.hasAttribute('data-x')).toBe(false);
    expect(fake.states.size).toBe(0);
  });

  test('still sets the data attribute when internals have no custom states', async () => {
    const { el, fake } = await mount();
    Reflect.deleteProperty(fake, 'states');
    el.toggleState('dirty', true);
    expect(el.hasAttribute('data-dirty')).toBe(true);
    el.toggleState('dirty', false);
    expect(el.hasAttribute('data-dirty')).toBe(false);
  });
});
