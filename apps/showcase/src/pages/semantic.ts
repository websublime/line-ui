import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-page-semantic')
export class ScPageSemantic extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<h2>Semantic</h2><p>L2 semantic defaults + L3 aliases</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-semantic': ScPageSemantic;
  }
}
