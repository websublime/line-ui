import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-token-card')
export class ScTokenCard extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<div class="token-card"><slot></slot></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-token-card': ScTokenCard;
  }
}
