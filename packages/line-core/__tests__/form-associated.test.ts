/**
 * FormAssociated mixin unit tests (D5, spec §6.D.5, AM-032).
 *
 * happy-dom 20.10.5 has no `attachInternals`, so every test installs the
 * recording fake from `mocks/element-internals.ts` and checks that the mixin
 * forwards to it. Real form submission, reset, and validation live in the
 * browser tier (`integration/form-associated/form-associated.e2e.ts`).
 *
 * Runs on F2's harness. `bun-test-preload.ts` registers happy-dom globally and
 * runs `@open-wc/testing-helpers` `fixtureCleanup` after each test.
 *
 * @module __tests__/form-associated
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { LineElement } from '../src/line-element.js';
import { FormAssociated } from '../src/mixins/form-associated.js';
import { type FakeInternals, installElementInternals } from './mocks/element-internals.js';

/** Form-associated `LineElement`, the shape every form component takes. */
class LineFormHost extends FormAssociated(LineElement) {
  /** Exposes the protected hook to the tests. */
  toggleState(name: string, active: boolean): void {
    this.reflectState(name, active);
  }
}

customElements.define('line-test-form-associated', LineFormHost);

/** Fakes attached since the current test's install, and the uninstall for its `afterEach`. */
let created: FakeInternals[] = [];
let restore: () => void = () => {};

beforeEach(() => {
  ({ created, restore } = installElementInternals());
});

afterEach(() => {
  restore();
});

/** Mounts one host and returns it with the fake internals its constructor attached. */
async function mount(): Promise<{ el: LineFormHost; fake: FakeInternals }> {
  const el = await fixture<LineFormHost>(html`<line-test-form-associated name="email"></line-test-form-associated>`);
  const fake = created.find((candidate) => candidate.host === el);
  if (!fake) throw new Error('attachInternals was not called for the host');
  return { el, fake };
}

describe('FormAssociated', () => {
  test('declares the class form-associated', () => {
    expect(FormAssociated(LineElement).formAssociated).toBe(true);
    expect(LineFormHost.formAssociated).toBe(true);
  });

  test('attaches internals exactly once per instance', () => {
    const first = document.createElement('line-test-form-associated');
    const second = document.createElement('line-test-form-associated');
    expect(created.map((fake) => fake.host)).toEqual([first, second]);
  });

  test('setFormValue forwards the value and the restore state', async () => {
    const { el, fake } = await mount();
    const state = new FormData();
    el.setFormValue('a@b.c', state);
    el.setFormValue(null);
    expect(fake.calls).toEqual([
      { method: 'setFormValue', args: ['a@b.c', state] },
      { method: 'setFormValue', args: [null, undefined] },
    ]);
  });

  test('setValidity forwards the flags, the message, and the anchor', async () => {
    const { el, fake } = await mount();
    const anchor = document.createElement('input');
    el.setValidity({ valueMissing: true }, 'Required', anchor);
    el.setValidity({});
    expect(fake.calls).toEqual([
      { method: 'setValidity', args: [{ valueMissing: true }, 'Required', anchor] },
      { method: 'setValidity', args: [{}, undefined, undefined] },
    ]);
  });

  test('reportValidity and checkValidity return the internals result', async () => {
    const { el, fake } = await mount();
    expect(el.reportValidity()).toBe(true);
    expect(el.checkValidity()).toBe(true);
    fake.result = false;
    expect(el.reportValidity()).toBe(false);
    expect(el.checkValidity()).toBe(false);
    expect(fake.calls).toEqual([
      { method: 'reportValidity', args: [] },
      { method: 'checkValidity', args: [] },
      { method: 'reportValidity', args: [] },
      { method: 'checkValidity', args: [] },
    ]);
  });

  test('name reads the attribute and type is the local name', async () => {
    const { el } = await mount();
    expect(el.name).toBe('email');
    el.setAttribute('name', 'contact');
    expect(el.name).toBe('contact');
    el.removeAttribute('name');
    expect(el.name).toBeNull();
    expect(el.type).toBe('line-test-form-associated');
  });

  test('form, validity, validationMessage, and willValidate read the internals', async () => {
    const { el, fake } = await mount();
    expect(el.form).toBeNull();
    const form = document.createElement('form');
    const validity = { valid: false, valueMissing: true } as ValidityState;
    Object.assign(fake, { form, validity, validationMessage: 'Required', willValidate: false });
    expect(el.form).toBe(form);
    expect(el.validity).toBe(validity);
    expect(el.validationMessage).toBe('Required');
    expect(el.willValidate).toBe(false);
  });

  test('reflectState toggles the data attribute and the custom state', async () => {
    const { el, fake } = await mount();
    el.toggleState('invalid', true);
    expect(el.hasAttribute('data-invalid')).toBe(true);
    expect(el.getAttribute('data-invalid')).toBe('');
    expect([...fake.states]).toEqual(['invalid']);

    el.toggleState('invalid', false);
    expect(el.hasAttribute('data-invalid')).toBe(false);
    expect(fake.states.size).toBe(0);
  });

  test('reflectState still sets the data attribute when internals have no custom states', async () => {
    const { el, fake } = await mount();
    Reflect.deleteProperty(fake, 'states');
    el.toggleState('dirty', true);
    expect(el.hasAttribute('data-dirty')).toBe(true);
    el.toggleState('dirty', false);
    expect(el.hasAttribute('data-dirty')).toBe(false);
  });
});
