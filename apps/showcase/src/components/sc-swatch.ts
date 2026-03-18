import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-swatch')
export class ScSwatch extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<div class="swatch"><slot></slot></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-swatch': ScSwatch;
  }
}
