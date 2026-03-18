import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-page-generator')
export class ScPageGenerator extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<h2>Palette Generator</h2><p>Pick a base color and generate a full 12-level palette</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-generator': ScPageGenerator;
  }
}
