import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-color-picker')
export class ScColorPicker extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<div class="color-picker"><!-- HSL/OKLCH color picker --></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-color-picker': ScColorPicker;
  }
}
