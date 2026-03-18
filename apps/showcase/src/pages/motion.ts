import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-page-motion')
export class ScPageMotion extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<h2>Motion</h2><p>81 easings, 12 durations, 23 animations</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-motion': ScPageMotion;
  }
}
