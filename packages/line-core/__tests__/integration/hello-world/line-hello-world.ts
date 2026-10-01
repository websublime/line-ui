/**
 * `<line-hello-world>` — the §6.D.8 "the platform works" smoke component.
 *
 * Private, never published: it lives under `__tests__/` so `vite build` (which
 * only bundles `src/`) never emits it. It exercises every Phase 00 platform
 * piece end-to-end: `LineElement` (D1), `LineMachineController` over a Zag
 * machine (D6), and a modular reset sheet imported through `?inline` (D7) —
 * under bun's `css-inline` preload plugin and under Vite alike.
 *
 * Anatomy: `::part(root)` wrapper carrying `data-state`, `::part(trigger)`
 * button that sends `TOGGLE`. Zero visual opinion — the only styling is the
 * reset sheet. Law 9: a machine that fails to start renders a static trigger.
 *
 * @module __tests__/integration/hello-world/line-hello-world
 */

import { createMachine } from '@zag-js/core';
import { html } from 'lit';
import { LineElement } from '../../../src/line-element.js';
import { LineMachineController } from '../../../src/machine/index.js';
import { commonReset } from '../../../src/styles/index.js';

interface HelloWorldSchema {
  state: 'idle' | 'active';
  event: { type: 'TOGGLE' };
}

const helloWorldMachine = createMachine<HelloWorldSchema>({
  initialState: () => 'idle',
  states: {
    idle: { on: { TOGGLE: { target: 'active' } } },
    active: { on: { TOGGLE: { target: 'idle' } } },
  },
});

export class LineHelloWorld extends LineElement {
  static override styles = [commonReset];

  readonly ctrl = new LineMachineController<HelloWorldSchema>(this, { machine: helloWorldMachine });

  override render() {
    if (this.ctrl.fallback) {
      return html`<div part="root" data-state="static"><button part="trigger" type="button" disabled>static</button></div>`;
    }
    const state = this.ctrl.state?.get();
    return html`
      <div part="root" data-state=${state}>
        <button part="trigger" type="button" @click=${() => this.ctrl.send({ type: 'TOGGLE' })}>${state}</button>
      </div>
    `;
  }
}

customElements.define('line-hello-world', LineHelloWorld);

declare global {
  interface HTMLElementTagNameMap {
    'line-hello-world': LineHelloWorld;
  }
}
