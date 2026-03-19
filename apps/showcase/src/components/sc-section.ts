import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sc-section')
export class ScSection extends LitElement {
  @property({ type: String }) heading = '';
  @property({ type: String }) description = '';
  @property({ type: Number }) count = 0;

  static override styles = css`
    :host {
      display: block;
      margin-bottom: var(--line-size-9, 3rem);
    }

    .header {
      display: flex;
      align-items: baseline;
      gap: var(--line-size-3, 1rem);
      margin-bottom: var(--line-size-2, 0.5rem);
    }

    h2 {
      margin: 0;
      font-size: var(--line-font-size-4, 1.5rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-high-contrast, #fff);
      letter-spacing: -0.02em;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: var(--line-size-1, 0.25rem) var(--line-size-2, 0.5rem);
      border-radius: var(--line-radius-2, 4px);
      background: var(--line-subtle-background, #161616);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      font-size: var(--line-font-size-0, 0.5rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      font-family: 'IBM Plex Mono', monospace;
    }

    .desc {
      margin: 0 0 var(--line-size-5, 1.5rem);
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-low-contrast, #999);
      line-height: var(--line-lineheight-3, 1.6);
      max-width: 64ch;
    }
  `;

  override render() {
    return html`
      <div class="header">
        <h2>${this.heading}</h2>
        ${this.count > 0 ? html`<span class="badge">${this.count} tokens</span>` : nothing}
      </div>
      ${this.description ? html`<p class="desc">${this.description}</p>` : nothing}
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-section': ScSection;
  }
}
