import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-page-typography')
export class ScPageTypography extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<h2>Typography</h2><p>62 typography tokens</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-typography': ScPageTypography;
  }
}
