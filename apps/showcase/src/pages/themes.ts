import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-page-themes')
export class ScPageThemes extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<h2>Themes</h2><p>28 pre-built theme bundles</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-themes': ScPageThemes;
  }
}
