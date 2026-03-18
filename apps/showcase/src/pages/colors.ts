import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-page-colors')
export class ScPageColors extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<h2>Colors</h2><p>L0: 28 palettes x 12 levels</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-colors': ScPageColors;
  }
}
