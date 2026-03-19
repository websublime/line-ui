import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('sc-code-block')
export class ScCodeBlock extends LitElement {
  /** Code content to display. */
  @property({ type: String }) code = '';
  /** Optional language label shown in the header. */
  @property({ type: String }) language = 'css';

  @state() private _copied = false;

  static override styles = css`
    :host {
      display: block;
    }

    .block {
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      border-radius: var(--line-radius-2, 4px);
      background: var(--line-subtle-background, #161616);
      overflow: hidden;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--line-size-1, 0.25rem) var(--line-size-3, 1rem);
      border-bottom: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
    }

    .lang {
      font-size: 10px;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .copy-btn {
      border: none;
      background: none;
      font-size: 11px;
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      cursor: pointer;
      padding: var(--line-size-1, 0.25rem) var(--line-size-2, 0.5rem);
      border-radius: var(--line-radius-2, 4px);
      transition: color var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }

    .copy-btn:hover {
      color: var(--line-high-contrast, #fff);
    }

    .copy-btn.copied {
      color: var(--line-solid-background, #c8ff00);
    }

    pre {
      margin: 0;
      padding: var(--line-size-3, 1rem) var(--line-size-4, 1.25rem);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    code {
      font-family: 'IBM Plex Mono', monospace;
      font-size: var(--line-font-size-1, 0.75rem);
      line-height: var(--line-lineheight-3, 1.6);
      color: var(--line-high-contrast, #fff);
      white-space: pre;
    }
  `;

  private _handleCopy(): void {
    navigator.clipboard
      .writeText(this.code)
      .then(() => {
        this._copied = true;
        setTimeout(() => {
          this._copied = false;
        }, 1200);
      })
      .catch(() => {
        // Clipboard access denied (iframe sandbox, non-HTTPS).
        // The button stays as "Copy" (no "Copied!" feedback), signalling the failure.
      });
  }

  override render() {
    return html`
      <div class="block">
        <div class="header">
          <span class="lang">${this.language}</span>
          <button
            class="copy-btn ${this._copied ? 'copied' : ''}"
            @click=${this._handleCopy}
          >${this._copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <pre><code>${this.code}</code></pre>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-code-block': ScCodeBlock;
  }
}
