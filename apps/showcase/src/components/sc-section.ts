import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-section')
export class ScSection extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<section><slot></slot></section>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-section': ScSection;
  }
}
