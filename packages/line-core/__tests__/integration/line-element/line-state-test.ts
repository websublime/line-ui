/**
 * `<line-state-test>` — the §6.C.2 browser-tier fixture.
 *
 * Private, never published. A plain `LineElement` subclass that exposes the
 * protected `reflectState` hook as `toggleState`, so the e2e can check the
 * host attribute and the custom state in each engine.
 *
 * @module __tests__/integration/line-element/line-state-test
 */

import { LineElement } from '../../../src/line-element.js';

export class LineStateTest extends LineElement {
  /** Calls `reflectState(name, active)`. */
  toggleState(name: string, active: boolean): void {
    this.reflectState(name, active);
  }
}

customElements.define('line-state-test', LineStateTest);

declare global {
  interface HTMLElementTagNameMap {
    'line-state-test': LineStateTest;
  }
}
