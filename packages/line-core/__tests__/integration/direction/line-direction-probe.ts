/**
 * `<line-direction-probe>` — the §6.D.4 browser-tier fixture.
 *
 * Private, never published. It renders `this.direction` into `::part(value)`
 * and sets `--line-test-dir` from `:host(:dir(rtl))`, so the e2e can compare
 * the mixin's value with the engine's own `:dir()` styling.
 *
 * @module __tests__/integration/direction/line-direction-probe
 */

import { css, html } from 'lit';
import { LineElement } from '../../../src/line-element.js';

export class LineDirectionProbe extends LineElement {
  static override styles = css`
    :host {
      --line-test-dir: ltr;
    }

    :host(:dir(rtl)) {
      --line-test-dir: rtl;
    }
  `;

  override render() {
    return html`<span part="value">${this.direction}</span><slot></slot>`;
  }
}

customElements.define('line-direction-probe', LineDirectionProbe);

declare global {
  interface HTMLElementTagNameMap {
    'line-direction-probe': LineDirectionProbe;
  }
}
