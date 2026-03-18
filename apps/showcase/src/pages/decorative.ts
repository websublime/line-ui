import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-page-decorative')
export class ScPageDecorative extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<h2>Decorative</h2><p>41 gradients/noise, 34 masks, 3 highlights</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-decorative': ScPageDecorative;
  }
}
