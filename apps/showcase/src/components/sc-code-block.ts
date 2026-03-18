import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-code-block')
export class ScCodeBlock extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  override render() {
    return html`<pre><code><slot></slot></code></pre>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-code-block': ScCodeBlock;
  }
}
