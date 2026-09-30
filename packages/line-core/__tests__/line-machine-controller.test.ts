/**
 * `LineMachineController` unit tests (D6, spec §6.D.6).
 *
 * Covers the contract components depend on:
 *   1. machine notifications drive `host.requestUpdate()` (transition → re-render);
 *   2. Manifesto Law 9 — a broken machine flips `fallback` and never throws at
 *      the consumer, `send` becomes a no-op, the reads return `undefined`;
 *   3. `staticFallbackOnFailure: false` opts out and lets the error propagate;
 *   4. disconnect tears the machine down; reconnect starts a fresh one;
 *   5. the `./machine` public surface is exactly the spec'd names (§9.3).
 *
 * `VanillaMachine.send` dispatches on a microtask, so transition assertions
 * await the host's `updateComplete` after sending.
 *
 * @module __tests__/line-machine-controller
 */

import { describe, expect, spyOn, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { createMachine } from '@zag-js/core';
import { html as litHtml } from 'lit';
import { LineElement } from '../src/line-element.js';
import * as machineSurface from '../src/machine/index.js';
import { LineMachineController, type LineMachineControllerOptions } from '../src/machine/index.js';

interface ToggleSchema {
  state: 'off' | 'on';
  event: { type: 'TOGGLE' };
}

const toggleMachine = createMachine<ToggleSchema>({
  initialState: () => 'off',
  states: {
    off: { on: { TOGGLE: { target: 'on' } } },
    on: { on: { TOGGLE: { target: 'off' } } },
  },
});

const brokenMachine = createMachine<ToggleSchema>({
  initialState: () => {
    throw new Error('boom');
  },
  states: { off: {}, on: {} },
});

/** Constructs fine; `start()` throws from the initial state's entry action. */
const brokenStartMachine = createMachine<ToggleSchema>({
  initialState: () => 'off',
  states: {
    off: { entry: ['explode'], on: { TOGGLE: { target: 'on' } } },
    on: { on: { TOGGLE: { target: 'off' } } },
  },
  implementations: {
    actions: {
      explode: () => {
        throw new Error('entry boom');
      },
    },
  },
});

/** Base host; subclasses pick the controller options they mount with. */
class MachineHost extends LineElement {
  readonly ctrl = new LineMachineController<ToggleSchema>(this, this.options());
  renders = 0;
  #rendered = Promise.withResolvers<void>();

  protected options(): LineMachineControllerOptions<ToggleSchema> {
    return { machine: toggleMachine };
  }

  /** Resolves after the next completed update — the real re-render signal, not a guessed delay. */
  nextRender(): Promise<void> {
    return this.#rendered.promise;
  }

  override render() {
    this.renders += 1;
    return this.ctrl.fallback ? litHtml`<p>static</p>` : litHtml`<p>${this.ctrl.state?.get()}</p>`;
  }

  override updated() {
    this.#rendered.resolve();
    this.#rendered = Promise.withResolvers<void>();
  }
}
class BrokenHost extends MachineHost {
  protected override options(): LineMachineControllerOptions<ToggleSchema> {
    return { machine: brokenMachine };
  }
}
class BrokenStartHost extends MachineHost {
  protected override options(): LineMachineControllerOptions<ToggleSchema> {
    return { machine: brokenStartMachine };
  }
}
class StrictHost extends MachineHost {
  protected override options(): LineMachineControllerOptions<ToggleSchema> {
    return { machine: brokenMachine, staticFallbackOnFailure: false };
  }
}

customElements.define('line-test-machine', MachineHost);
customElements.define('line-test-machine-broken', BrokenHost);
customElements.define('line-test-machine-broken-start', BrokenStartHost);
customElements.define('line-test-machine-strict', StrictHost);

const text = (el: Element) => el.shadowRoot?.querySelector('p')?.textContent;

describe('LineMachineController', () => {
  test('starts the machine and re-renders the host on transition', async () => {
    const el = await fixture<MachineHost>(html`<line-test-machine></line-test-machine>`);
    expect(el.ctrl.fallback).toBe(false);
    expect(el.ctrl.state?.get()).toBe('off');
    expect(el.ctrl.service?.getStatus()).toBe('Started');
    expect(text(el)).toBe('off');

    const before = el.renders;
    el.ctrl.send({ type: 'TOGGLE' });
    await el.nextRender();
    expect(el.ctrl.state?.get()).toBe('on');
    expect(el.renders).toBe(before + 1);
    expect(text(el)).toBe('on');
  });

  test('Law 9: a broken machine mounts in static fallback without throwing', async () => {
    const error = spyOn(console, 'error').mockImplementation(() => {});
    try {
      const el = await fixture<MachineHost>(html`<line-test-machine-broken></line-test-machine-broken>`);
      expect(el.ctrl.fallback).toBe(true);
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0]?.[0]).toBe('[line://ui] Machine failed to start — rendering static fallback.');
      expect(error.mock.calls[0]?.[1]).toBeInstanceOf(Error);
      expect(text(el)).toBe('static');
      expect(el.ctrl.state).toBeUndefined();
      expect(el.ctrl.context).toBeUndefined();
      expect(el.ctrl.refs).toBeUndefined();
      expect(el.ctrl.service).toBeUndefined();
      expect(() => el.ctrl.send({ type: 'TOGGLE' })).not.toThrow();
      expect(el.ctrl.fallback).toBe(true);
    } finally {
      error.mockRestore();
    }
  });

  test('Law 9: a machine that throws in start() falls back and send stays inert', async () => {
    const error = spyOn(console, 'error').mockImplementation(() => {});
    try {
      const el = await fixture<MachineHost>(html`<line-test-machine-broken-start></line-test-machine-broken-start>`);
      expect(el.ctrl.fallback).toBe(true);
      expect(error).toHaveBeenCalledTimes(1);
      expect(text(el)).toBe('static');

      // The VanillaMachine was constructed and marked Started before entry threw,
      // so only the `#fallback` guard keeps this send from transitioning.
      const before = el.renders;
      expect(() => el.ctrl.send({ type: 'TOGGLE' })).not.toThrow();
      await Promise.resolve(); // where VanillaMachine.send would have dispatched
      await el.updateComplete;
      expect(el.ctrl.state?.get()).toBe('off');
      expect(el.renders).toBe(before);
      expect(text(el)).toBe('static');
    } finally {
      error.mockRestore();
    }
  });

  test('staticFallbackOnFailure: false rethrows from hostConnected', () => {
    const el = new StrictHost();
    expect(() => el.ctrl.hostConnected()).toThrow('boom');
    expect(el.ctrl.fallback).toBe(false);
    expect(el.ctrl.service).toBeUndefined();
  });

  test('disconnect stops the machine; reconnect starts a fresh one', async () => {
    const el = await fixture<MachineHost>(html`<line-test-machine></line-test-machine>`);
    el.ctrl.send({ type: 'TOGGLE' });
    await el.nextRender();
    expect(el.ctrl.state?.get()).toBe('on');

    const parent = el.parentNode as Node;
    parent.removeChild(el);
    expect(el.ctrl.service).toBeUndefined();
    expect(el.ctrl.state).toBeUndefined();
    expect(() => el.ctrl.send({ type: 'TOGGLE' })).not.toThrow();

    parent.appendChild(el);
    await el.updateComplete;
    expect(el.ctrl.fallback).toBe(false);
    expect(el.ctrl.state?.get()).toBe('off');
    expect(el.ctrl.service?.getStatus()).toBe('Started');
  });

  test('public surface is exactly the spec §9.3 names', () => {
    expect(Object.keys(machineSurface).sort()).toEqual(
      ['LineMachineController', 'VanillaMachine', 'mergeProps', 'normalizeProps', 'spreadProps'].sort(),
    );
    expect('bindable' in machineSurface).toBe(false);
  });
});
