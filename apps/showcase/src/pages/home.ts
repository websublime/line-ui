import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sc-page-home')
export class ScPageHome extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    h1 {
      font-size: 2rem;
      margin-block-end: 0.5rem;
    }

    /* TODO(line-ui-6zy.3): Replace raw palette stops with semantic tokens
       (--line-blue-9 -> --line-solid-background, --line-gray-11 -> --line-low-contrast)
       when home page is fully implemented */
    .accent {
      color: var(--line-blue-9, #3b82f6);
    }

    p {
      color: var(--line-gray-11, #6b7280);
    }
  `;

  override render() {
    return html`
      <h1>line<span class="accent">://</span>ui</h1>
      <p>Design System Showcase</p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-home': ScPageHome;
  }
}
