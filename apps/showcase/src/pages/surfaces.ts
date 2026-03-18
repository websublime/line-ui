import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-page-surfaces')
export class ScPageSurfaces extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<h2>Surfaces</h2><p>24 shadows, 29 borders/radii, 3 opacity, 3 focus ring, 6 aspects</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-surfaces': ScPageSurfaces;
  }
}
