import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-nav')
export class ScNav extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<nav><!-- Sidebar navigation --></nav>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-nav': ScNav;
  }
}
