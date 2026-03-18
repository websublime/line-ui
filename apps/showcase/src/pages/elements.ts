import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-page-elements')
export class ScPageElements extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<h2>Elements</h2><p>Normalize/reset: all native HTML elements</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-elements': ScPageElements;
  }
}
