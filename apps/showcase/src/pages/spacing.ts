import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-page-spacing')
export class ScPageSpacing extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<h2>Spacing</h2><p>74 spacing tokens</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-spacing': ScPageSpacing;
  }
}
