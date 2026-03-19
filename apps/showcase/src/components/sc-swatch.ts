import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { PaletteLevel } from '../constants.js';

export type SwatchSize = 'sm' | 'md' | 'lg';

@customElement('sc-swatch')
export class ScSwatch extends LitElement {
  @property({ type: String }) palette = '';
  @property({ type: Number }) level: PaletteLevel = 9;
  @property({ type: String }) size: SwatchSize = 'md';
  /** Optional label shown below the swatch. */
  @property({ type: String }) label = '';
  /** Optional semantic role description for tooltip. */
  @property({ type: String, attribute: 'semantic-role' }) semanticRole = '';
  /** If true, shows the active indicator ring. */
  @property({ type: Boolean, reflect: true }) active = false;

  @state() private _copied = false;
  @state() private _hovered = false;
  @state() private _resolvedColor = '';

  static override styles = css`
    :host {
      display: inline-block;
      position: relative;
    }

    .swatch {
      border-radius: var(--line-radius-2, 4px);
      cursor: pointer;
      position: relative;
      transition:
        transform var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        box-shadow var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }

    .swatch:hover {
      transform: scale(1.08);
      z-index: 1;
    }

    .swatch.sm {
      width: 32px;
      height: 32px;
    }

    .swatch.md {
      width: 56px;
      height: 56px;
    }

    .swatch.lg {
      width: 80px;
      height: 80px;
    }

    :host([active]) .swatch {
      box-shadow:
        0 0 0 2px var(--line-background, #111),
        0 0 0 4px var(--line-solid-background, #c8ff00);
    }

    .label {
      display: block;
      margin-top: var(--line-size-1, 0.25rem);
      font-size: 10px;
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Tooltip ── */
    .tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      padding: var(--line-size-2, 0.5rem) var(--line-size-3, 1rem);
      background: var(--line-subtle-background, #161616);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      border-radius: var(--line-radius-2, 4px);
      font-size: 11px;
      color: var(--line-high-contrast, #fff);
      white-space: nowrap;
      pointer-events: none;
      z-index: var(--line-z-popup, 200);
      opacity: 0;
      transition: opacity var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }

    .tooltip.visible {
      opacity: 1;
    }

    .tooltip-token {
      font-family: 'IBM Plex Mono', monospace;
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-solid-background, #c8ff00);
    }

    .tooltip-resolved {
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      margin-top: 2px;
    }

    .tooltip-role {
      color: var(--line-low-contrast, #999);
      margin-top: 2px;
      font-style: italic;
    }

    /* ── Copy feedback ── */
    .copied-badge {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--line-background, #111) 60%, transparent);
      border-radius: var(--line-radius-2, 4px);
      color: var(--line-high-contrast, #fff);
      font-size: 16px;
      pointer-events: none;
      animation: fade-out 600ms var(--line-ease-2) forwards;
    }

    @keyframes fade-out {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;

  private get _tokenName(): string {
    return `--line-${this.palette}-${this.level}`;
  }

  private get _tokenVar(): string {
    return `var(${this._tokenName})`;
  }

  private _handleClick(): void {
    const text = this._tokenVar;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this._copied = true;
        setTimeout(() => {
          this._copied = false;
        }, 700);
      })
      .catch(() => {
        // Clipboard access denied (iframe sandbox, non-HTTPS).
        // No visual feedback is shown, which signals the failure to the user.
      });
  }

  private _handleMouseEnter(): void {
    this._hovered = true;
    // Resolve computed color value from the host document
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(this._tokenName).trim();
    this._resolvedColor = resolved || '(unresolved)';
  }

  private _handleMouseLeave(): void {
    this._hovered = false;
  }

  override render() {
    const bgStyle = styleMap({
      'background-color': this._tokenVar
    });

    return html`
      <div class="tooltip ${classMap({ visible: this._hovered })}">
        <div class="tooltip-token">${this._tokenName}</div>
        <div class="tooltip-resolved">${this._resolvedColor}</div>
        ${this.semanticRole ? html`<div class="tooltip-role">${this.semanticRole}</div>` : nothing}
      </div>
      <div
        class="swatch ${this.size}"
        style=${bgStyle}
        @click=${this._handleClick}
        @mouseenter=${this._handleMouseEnter}
        @mouseleave=${this._handleMouseLeave}
        title="${this._tokenName}"
      >
        ${this._copied ? html`<div class="copied-badge">&#10003;</div>` : nothing}
      </div>
      ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-swatch': ScSwatch;
  }
}
