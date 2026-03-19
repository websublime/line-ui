import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import '../components/sc-section.js';

/* ─────────────────────────────────────────────────────────
   Token data — sourced from packages/theme/src/tokens/
   ───────────────────────────────────────────────────────── */

/** Border size tokens (5). */
const BORDER_SIZES = [
  { token: '--line-border-size-1', value: '1px' },
  { token: '--line-border-size-2', value: '2px' },
  { token: '--line-border-size-3', value: '5px' },
  { token: '--line-border-size-4', value: '10px' },
  { token: '--line-border-size-5', value: '25px' }
] as const;

/** Standard radius tokens (6). */
const RADII_STANDARD = [
  { token: '--line-radius-1', value: '2px' },
  { token: '--line-radius-2', value: '5px' },
  { token: '--line-radius-3', value: '1rem' },
  { token: '--line-radius-4', value: '2rem' },
  { token: '--line-radius-5', value: '4rem' },
  { token: '--line-radius-6', value: '8rem' }
] as const;

/** Drawn radius tokens (6). */
const RADII_DRAWN = [
  { token: '--line-radius-drawn-1', label: 'drawn-1' },
  { token: '--line-radius-drawn-2', label: 'drawn-2' },
  { token: '--line-radius-drawn-3', label: 'drawn-3' },
  { token: '--line-radius-drawn-4', label: 'drawn-4' },
  { token: '--line-radius-drawn-5', label: 'drawn-5' },
  { token: '--line-radius-drawn-6', label: 'drawn-6' }
] as const;

/** Blob radius tokens (5). */
const RADII_BLOB = [
  { token: '--line-radius-blob-1', label: 'blob-1' },
  { token: '--line-radius-blob-2', label: 'blob-2' },
  { token: '--line-radius-blob-3', label: 'blob-3' },
  { token: '--line-radius-blob-4', label: 'blob-4' },
  { token: '--line-radius-blob-5', label: 'blob-5' }
] as const;

/** Conditional radius tokens (6). */
const RADII_CONDITIONAL = [
  { token: '--line-radius-conditional-1', label: 'cond-1', ref: '--line-radius-1' },
  { token: '--line-radius-conditional-2', label: 'cond-2', ref: '--line-radius-2' },
  { token: '--line-radius-conditional-3', label: 'cond-3', ref: '--line-radius-3' },
  { token: '--line-radius-conditional-4', label: 'cond-4', ref: '--line-radius-4' },
  { token: '--line-radius-conditional-5', label: 'cond-5', ref: '--line-radius-5' },
  { token: '--line-radius-conditional-6', label: 'cond-6', ref: '--line-radius-6' }
] as const;

/** Outer shadow tokens (6). */
const SHADOWS_OUTER = [
  { token: '--line-shadow-1', label: 'shadow-1' },
  { token: '--line-shadow-2', label: 'shadow-2' },
  { token: '--line-shadow-3', label: 'shadow-3' },
  { token: '--line-shadow-4', label: 'shadow-4' },
  { token: '--line-shadow-5', label: 'shadow-5' },
  { token: '--line-shadow-6', label: 'shadow-6' }
] as const;

/** Inner shadow tokens (5). */
const SHADOWS_INNER = [
  { token: '--line-inner-shadow-0', label: 'inner-0' },
  { token: '--line-inner-shadow-1', label: 'inner-1' },
  { token: '--line-inner-shadow-2', label: 'inner-2' },
  { token: '--line-inner-shadow-3', label: 'inner-3' },
  { token: '--line-inner-shadow-4', label: 'inner-4' }
] as const;

/** Shadow control variables (2). */
const SHADOW_CONTROLS = [
  { token: '--line-shadow-color', description: 'HSL values for shadow hue/saturation/lightness' },
  { token: '--line-shadow-strength', description: 'Base opacity multiplier for all shadows' }
] as const;

/** Opacity tokens (3). */
const OPACITIES = [
  { token: '--line-opacity-disabled', value: '0.5', label: 'Disabled' },
  { token: '--line-opacity-overlay', value: '0.75', label: 'Overlay' },
  { token: '--line-opacity-placeholder', value: '0.6', label: 'Placeholder' }
] as const;

/** Focus ring tokens (3). */
const FOCUS_TOKENS = [
  { token: '--line-ring-width', value: '2px', description: 'Ring stroke width' },
  { token: '--line-ring-offset', value: '2px', description: 'Gap between element and ring' },
  { token: '--line-ring-color', value: 'var(--line-ui-border)', description: 'Ring color (semantic)' }
] as const;

/** Aspect ratio tokens (6). */
const ASPECT_RATIOS = [
  { token: '--line-ratio-square', value: '1', label: 'Square', ratio: '1 / 1' },
  { token: '--line-ratio-landscape', value: '4 / 3', label: 'Landscape', ratio: '4 / 3' },
  { token: '--line-ratio-portrait', value: '3 / 4', label: 'Portrait', ratio: '3 / 4' },
  { token: '--line-ratio-widescreen', value: '16 / 9', label: 'Widescreen', ratio: '16 / 9' },
  { token: '--line-ratio-ultrawide', value: '18 / 5', label: 'Ultrawide', ratio: '18 / 5' },
  { token: '--line-ratio-golden', value: '1.618 / 1', label: 'Golden', ratio: '1.618 / 1' }
] as const;

/**
 * Copy a CSS token reference to the clipboard and flash visual feedback.
 */
function copyToken(token: string, el: HTMLElement): void {
  const text = `var(${token})`;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      el.classList.add('copied');
      setTimeout(() => el.classList.remove('copied'), 700);
    })
    .catch(() => {
      /* Clipboard denied — no feedback */
    });
}

@customElement('sc-page-surfaces')
export class ScPageSurfaces extends LitElement {
  /** Track which focus demo button is focused for visual feedback. */
  @state() private _focusDemoActive = false;

  static override styles = css`
    :host {
      display: block;
    }

    /* ── Page header ── */

    .page-title {
      font-size: var(--line-font-size-6, 2rem);
      font-weight: var(--line-font-weight-8, 800);
      color: var(--line-high-contrast, #fff);
      letter-spacing: -0.03em;
      margin: 0 0 var(--line-size-2, 0.5rem);
    }

    .page-subtitle {
      font-size: var(--line-font-size-2, 1rem);
      color: var(--line-low-contrast, #999);
      margin: 0 0 var(--line-size-8, 2.5rem);
      line-height: var(--line-lineheight-3, 1.6);
    }

    .page-subtitle strong {
      color: var(--line-high-contrast, #fff);
      font-weight: var(--line-font-weight-6, 600);
    }

    /* ── Shared token box ── */

    .token-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--line-size-2, 0.5rem);
      cursor: pointer;
      position: relative;
    }

    .token-name {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      text-align: center;
      word-break: break-all;
    }

    .token-value {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-solid-background, #c8ff00);
      text-align: center;
    }

    /* Copy flash */
    .token-box.copied .token-name {
      color: var(--line-solid-background, #c8ff00);
    }

    .token-box.copied::after {
      content: '\\2713';
      position: absolute;
      top: 0;
      right: -4px;
      font-size: var(--line-font-size-00, 0.625rem);
      color: var(--line-solid-background, #c8ff00);
      animation: fade-check 700ms var(--line-ease-2) forwards;
    }

    @keyframes fade-check {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }

    /* ── Section 1: Border sizes ── */

    .border-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--line-size-4, 1.25rem);
    }

    .border-demo {
      width: 100%;
      aspect-ratio: 1;
      border-style: solid;
      border-color: var(--line-solid-background, #c8ff00);
      background: var(--line-subtle-background, #161616);
      border-radius: var(--line-radius-2, 5px);
      box-sizing: border-box;
    }

    /* ── Section 2: Border radii ── */

    .radius-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: var(--line-size-4, 1.25rem);
    }

    .radius-demo {
      width: 100%;
      aspect-ratio: 1;
      background: var(--line-ui-background, #222);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-border, #444);
      box-sizing: border-box;
    }

    .radius-subsection {
      margin-bottom: var(--line-size-5, 1.5rem);
    }

    .radius-subsection-title {
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-high-contrast, #fff);
      margin: 0 0 var(--line-size-1, 0.25rem);
    }

    .radius-subsection-desc {
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-low-contrast, #999);
      margin: 0 0 var(--line-size-4, 1.25rem);
    }

    .radius-pill-demo {
      width: 100%;
      height: 48px;
      background: var(--line-ui-background, #222);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-border, #444);
      border-radius: var(--line-radius-round);
      box-sizing: border-box;
    }

    /* ── Section 3: Shadows ── */

    .shadow-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: var(--line-size-5, 1.5rem);
    }

    .shadow-demo {
      width: 100%;
      aspect-ratio: 1;
      border-radius: var(--line-radius-3, 1rem);
      background: var(--line-subtle-background, #161616);
      box-sizing: border-box;
    }

    .inner-shadow-demo {
      width: 100%;
      aspect-ratio: 1;
      border-radius: var(--line-radius-3, 1rem);
      background: var(--line-subtle-background, #161616);
      box-sizing: border-box;
    }

    .shadow-comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--line-size-5, 1.5rem);
      margin-top: var(--line-size-5, 1.5rem);
    }

    .shadow-comparison-panel {
      padding: var(--line-size-5, 1.5rem);
      border-radius: var(--line-radius-3, 1rem);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
    }

    /*
     * Light/dark comparison panels use hardcoded colors intentionally.
     * They simulate fixed light and dark environments regardless of
     * the current theme, so the shadow differences are always visible.
     * --line-shadow-color and --line-shadow-strength mirror the token
     * defaults from shadows.css for each mode.
     */
    .shadow-comparison-panel.light-panel {
      background: #f8f8f8;
      --line-shadow-color: 220 3% 15%;
      --line-shadow-strength: 1%;
    }

    .shadow-comparison-panel.dark-panel {
      background: #111;
      --line-shadow-color: 220 40% 2%;
      --line-shadow-strength: 25%;
    }

    .panel-label {
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-6, 600);
      font-family: 'IBM Plex Mono', monospace;
      margin: 0 0 var(--line-size-4, 1.25rem);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .light-panel .panel-label {
      color: #333; /* hardcoded — fixed light-mode simulation */
    }

    .dark-panel .panel-label {
      color: var(--line-low-contrast, #999);
    }

    .comparison-card-stack {
      display: flex;
      flex-direction: column;
      gap: var(--line-size-3, 1rem);
    }

    .comparison-card {
      padding: var(--line-size-4, 1.25rem);
      border-radius: var(--line-radius-2, 5px);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .light-panel .comparison-card {
      background: #fff; /* hardcoded — fixed light-mode simulation */
    }

    .dark-panel .comparison-card {
      background: var(--line-subtle-background, #161616);
    }

    .comparison-card-label {
      font-size: var(--line-font-size-1, 0.75rem);
      font-family: 'IBM Plex Mono', monospace;
      font-weight: var(--line-font-weight-6, 600);
    }

    .light-panel .comparison-card-label {
      color: #333; /* hardcoded — fixed light-mode simulation */
    }

    .dark-panel .comparison-card-label {
      color: var(--line-low-contrast, #999);
    }

    .shadow-control-row {
      display: flex;
      gap: var(--line-size-5, 1.5rem);
      flex-wrap: wrap;
      margin-top: var(--line-size-4, 1.25rem);
    }

    .shadow-control-card {
      flex: 1;
      min-width: 200px;
      padding: var(--line-size-4, 1.25rem);
      border-radius: var(--line-radius-2, 5px);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      background: var(--line-subtle-background, #161616);
      cursor: pointer;
    }

    .shadow-control-card.copied {
      border-color: var(--line-solid-background, #c8ff00);
    }

    .shadow-control-token {
      font-size: var(--line-font-size-1, 0.75rem);
      font-family: 'IBM Plex Mono', monospace;
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-solid-background, #c8ff00);
      margin: 0 0 var(--line-size-1, 0.25rem);
    }

    .shadow-control-desc {
      font-size: var(--line-font-size-00, 0.625rem);
      color: var(--line-low-contrast, #999);
      margin: 0;
    }

    /* ── Section 4: Opacity ── */

    .opacity-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--line-size-5, 1.5rem);
    }

    .opacity-demo {
      position: relative;
      border-radius: var(--line-radius-3, 1rem);
      overflow: hidden;
      cursor: pointer;
    }

    .opacity-bg {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: var(--line-solid-background, #c8ff00);
    }

    .opacity-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--line-size-2, 0.5rem);
      background: var(--line-background, #111);
    }

    .opacity-label {
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-high-contrast, #fff);
      text-transform: capitalize;
    }

    .opacity-value {
      font-size: var(--line-font-size-1, 0.75rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-high-contrast, #fff);
    }

    /* ── Section 5: Focus ring ── */

    .focus-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--line-size-5, 1.5rem);
      margin-bottom: var(--line-size-5, 1.5rem);
    }

    .focus-token-card {
      padding: var(--line-size-4, 1.25rem);
      border-radius: var(--line-radius-2, 5px);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      background: var(--line-subtle-background, #161616);
      cursor: pointer;
    }

    .focus-token-card.copied {
      border-color: var(--line-solid-background, #c8ff00);
    }

    .focus-token-name {
      font-size: var(--line-font-size-1, 0.75rem);
      font-family: 'IBM Plex Mono', monospace;
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-solid-background, #c8ff00);
      margin: 0 0 var(--line-size-1, 0.25rem);
    }

    .focus-token-value {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      margin: 0 0 var(--line-size-1, 0.25rem);
    }

    .focus-token-desc {
      font-size: var(--line-font-size-00, 0.625rem);
      color: var(--line-low-contrast, #999);
      margin: 0;
    }

    .focus-demo-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--line-size-4, 1.25rem);
      padding: var(--line-size-7, 2rem);
      border-radius: var(--line-radius-3, 1rem);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      background: var(--line-subtle-background, #161616);
    }

    .focus-demo-hint {
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-low-contrast, #999);
      margin: 0;
    }

    .focus-demo-btn {
      padding: var(--line-size-3, 1rem) var(--line-size-6, 1.75rem);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-border, #444);
      border-radius: var(--line-radius-2, 5px);
      background: var(--line-ui-background, #222);
      color: var(--line-high-contrast, #fff);
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-6, 600);
      cursor: pointer;
      transition:
        background var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        border-color var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }

    .focus-demo-btn:hover {
      background: var(--line-ui-hover-background, #2a2a2a);
      border-color: var(--line-ui-border-hover, #555);
    }

    .focus-demo-btn:focus-visible {
      outline: var(--line-ring-width, 2px) solid var(--line-ring-color, var(--line-ui-border, hsl(0 0% 83%)));
      outline-offset: var(--line-ring-offset, 2px);
    }

    .focus-demo-btn.active-ring {
      outline: var(--line-ring-width, 2px) solid var(--line-ring-color, var(--line-ui-border, hsl(0 0% 83%)));
      outline-offset: var(--line-ring-offset, 2px);
    }

    .focus-demo-input {
      padding: var(--line-size-2, 0.5rem) var(--line-size-4, 1.25rem);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-border, #444);
      border-radius: var(--line-radius-2, 5px);
      background: var(--line-background, #111);
      color: var(--line-high-contrast, #fff);
      font-size: var(--line-font-size-2, 1rem);
      font-family: 'IBM Plex Mono', monospace;
      width: min(260px, 100%);
      box-sizing: border-box;
    }

    .focus-demo-input:focus-visible {
      outline: var(--line-ring-width, 2px) solid var(--line-ring-color, var(--line-ui-border, hsl(0 0% 83%)));
      outline-offset: var(--line-ring-offset, 2px);
    }

    .focus-demo-link {
      font-size: var(--line-font-size-2, 1rem);
      color: var(--line-solid-background, #c8ff00);
      text-decoration: underline;
      cursor: pointer;
      background: none;
      border: none;
      font-family: inherit;
    }

    .focus-demo-link:focus-visible {
      outline: var(--line-ring-width, 2px) solid var(--line-ring-color, var(--line-ui-border, hsl(0 0% 83%)));
      outline-offset: var(--line-ring-offset, 2px);
      border-radius: var(--line-radius-1, 2px);
    }

    /* ── Section 6: Aspect ratios ── */

    .aspect-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--line-size-5, 1.5rem);
    }

    .aspect-demo {
      cursor: pointer;
    }

    .aspect-placeholder {
      width: 100%;
      border-radius: var(--line-radius-2, 5px);
      background: var(--line-ui-background, #222);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-border, #444);
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      overflow: hidden;
    }

    .aspect-ratio-label {
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      font-family: 'IBM Plex Mono', monospace;
    }

    /* ── Responsive ── */

    @media (max-width: 768px) {
      .border-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      .radius-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      .shadow-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .shadow-comparison {
        grid-template-columns: 1fr;
      }
      .opacity-grid {
        grid-template-columns: 1fr;
      }
      .focus-grid {
        grid-template-columns: 1fr;
      }
      .aspect-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;

  /* ── Copy helper ── */

  private _copy(token: string, e: Event): void {
    const el = e.currentTarget as HTMLElement;
    copyToken(token, el);
  }

  /* ── Render: Border Sizes ── */

  private _renderBorderSizes() {
    return html`
      <sc-section
        heading="Border Sizes"
        description="5 border width tokens from hairline (1px) to heavy (25px)."
        .count=${5}
      >
        <div class="border-grid">
          ${BORDER_SIZES.map(
            (b) => html`
            <div class="token-box" @click=${(e: Event) => this._copy(b.token, e)}>
              <div
                class="border-demo"
                style=${styleMap({ 'border-width': `var(${b.token})` })}
              ></div>
              <span class="token-name">${b.token}</span>
              <span class="token-value">${b.value}</span>
            </div>
          `
          )}
        </div>
      </sc-section>
    `;
  }

  /* ── Render: Border Radii ── */

  private _renderBorderRadii() {
    return html`
      <sc-section
        heading="Border Radii"
        description="24 radius tokens across 5 categories: standard, drawn, round, blob, and conditional (viewport-responsive)."
        .count=${24}
      >
        <!-- Standard radii -->
        <div class="radius-subsection">
          <h3 class="radius-subsection-title">Standard (6)</h3>
          <p class="radius-subsection-desc">Progressive rounding from subtle to fully round.</p>
          <div class="radius-grid">
            ${RADII_STANDARD.map(
              (r) => html`
              <div class="token-box" @click=${(e: Event) => this._copy(r.token, e)}>
                <div
                  class="radius-demo"
                  style=${styleMap({ 'border-radius': `var(${r.token})` })}
                ></div>
                <span class="token-name">${r.token}</span>
                <span class="token-value">${r.value}</span>
              </div>
            `
            )}
          </div>
        </div>

        <!-- Drawn radii -->
        <div class="radius-subsection">
          <h3 class="radius-subsection-title">Drawn (6)</h3>
          <p class="radius-subsection-desc">Hand-drawn, organic border shapes using multi-value border-radius.</p>
          <div class="radius-grid">
            ${RADII_DRAWN.map(
              (r) => html`
              <div class="token-box" @click=${(e: Event) => this._copy(r.token, e)}>
                <div
                  class="radius-demo"
                  style=${styleMap({ 'border-radius': `var(${r.token})` })}
                ></div>
                <span class="token-name">${r.token}</span>
              </div>
            `
            )}
          </div>
        </div>

        <!-- Round -->
        <div class="radius-subsection">
          <h3 class="radius-subsection-title">Round (1)</h3>
          <p class="radius-subsection-desc">Pill shape using an extremely large radius value.</p>
          <div class="radius-grid">
            <div class="token-box" @click=${(e: Event) => this._copy('--line-radius-round', e)}>
              <div class="radius-pill-demo"></div>
              <span class="token-name">--line-radius-round</span>
              <span class="token-value">1e5px</span>
            </div>
          </div>
        </div>

        <!-- Blob radii -->
        <div class="radius-subsection">
          <h3 class="radius-subsection-title">Blob (5)</h3>
          <p class="radius-subsection-desc">Organic blob shapes using percentage-based multi-value border-radius.</p>
          <div class="radius-grid">
            ${RADII_BLOB.map(
              (r) => html`
              <div class="token-box" @click=${(e: Event) => this._copy(r.token, e)}>
                <div
                  class="radius-demo"
                  style=${styleMap({ 'border-radius': `var(${r.token})` })}
                ></div>
                <span class="token-name">${r.token}</span>
              </div>
            `
            )}
          </div>
        </div>

        <!-- Conditional radii -->
        <div class="radius-subsection">
          <h3 class="radius-subsection-title">Conditional (6)</h3>
          <p class="radius-subsection-desc">
            Viewport-responsive radii that collapse to 0 when the element fills the viewport width.
            Uses <code style="font-family: 'IBM Plex Mono', monospace; color: var(--line-solid-background, #c8ff00)">clamp(0px, calc(100vw - 100%) * 1e5, radius)</code>.
          </p>
          <div class="radius-grid">
            ${RADII_CONDITIONAL.map(
              (r) => html`
              <div class="token-box" @click=${(e: Event) => this._copy(r.token, e)}>
                <div
                  class="radius-demo"
                  style=${styleMap({ 'border-radius': `var(${r.token})` })}
                ></div>
                <span class="token-name">${r.token}</span>
                <span class="token-value">ref: ${r.ref}</span>
              </div>
            `
            )}
          </div>
        </div>
      </sc-section>
    `;
  }

  /* ── Render: Shadows ── */

  private _renderShadows() {
    return html`
      <sc-section
        heading="Shadows & Elevation"
        description="6 outer shadows, 5 inner shadows, and 2 control variables. Shadows adapt via --line-shadow-color and --line-shadow-strength."
        .count=${13}
      >
        <!-- Outer shadows -->
        <div class="radius-subsection">
          <h3 class="radius-subsection-title">Outer Shadows (6)</h3>
          <p class="radius-subsection-desc">Progressive elevation from subtle to dramatic.</p>
          <div class="shadow-grid">
            ${SHADOWS_OUTER.map(
              (s) => html`
              <div class="token-box" @click=${(e: Event) => this._copy(s.token, e)}>
                <div
                  class="shadow-demo"
                  style=${styleMap({ 'box-shadow': `var(${s.token})` })}
                ></div>
                <span class="token-name">${s.token}</span>
              </div>
            `
            )}
          </div>
        </div>

        <!-- Inner shadows -->
        <div class="radius-subsection">
          <h3 class="radius-subsection-title">Inner Shadows (5)</h3>
          <p class="radius-subsection-desc">Inset shadows for pressed or recessed effects.</p>
          <div class="shadow-grid">
            ${SHADOWS_INNER.map(
              (s) => html`
              <div class="token-box" @click=${(e: Event) => this._copy(s.token, e)}>
                <div
                  class="inner-shadow-demo"
                  style=${styleMap({ 'box-shadow': `var(${s.token})` })}
                ></div>
                <span class="token-name">${s.token}</span>
              </div>
            `
            )}
          </div>
        </div>

        <!-- Shadow control variables -->
        <div class="radius-subsection">
          <h3 class="radius-subsection-title">Control Variables (2)</h3>
          <p class="radius-subsection-desc">Tune shadow appearance globally without changing individual shadow tokens.</p>
          <div class="shadow-control-row">
            ${SHADOW_CONTROLS.map(
              (c) => html`
              <div
                class="shadow-control-card"
                @click=${(e: Event) => this._copy(c.token, e)}
              >
                <p class="shadow-control-token">${c.token}</p>
                <p class="shadow-control-desc">${c.description}</p>
              </div>
            `
            )}
          </div>
        </div>

        <!-- Light/dark comparison -->
        <div class="radius-subsection">
          <h3 class="radius-subsection-title">Light vs Dark Comparison</h3>
          <p class="radius-subsection-desc">Shadow-color and shadow-strength adapt in dark mode for stronger, cooler shadows.</p>
          <div class="shadow-comparison">
            <div class="shadow-comparison-panel light-panel">
              <p class="panel-label">Light mode</p>
              <div class="comparison-card-stack">
                ${SHADOWS_OUTER.map(
                  (s) => html`
                  <div
                    class="comparison-card"
                    style=${styleMap({ 'box-shadow': `var(${s.token})` })}
                  >
                    <span class="comparison-card-label">${s.label}</span>
                  </div>
                `
                )}
              </div>
            </div>
            <div class="shadow-comparison-panel dark-panel">
              <p class="panel-label">Dark mode</p>
              <div class="comparison-card-stack">
                ${SHADOWS_OUTER.map(
                  (s) => html`
                  <div
                    class="comparison-card"
                    style=${styleMap({ 'box-shadow': `var(${s.token})` })}
                  >
                    <span class="comparison-card-label">${s.label}</span>
                  </div>
                `
                )}
              </div>
            </div>
          </div>
        </div>
      </sc-section>
    `;
  }

  /* ── Render: Opacity ── */

  private _renderOpacity() {
    return html`
      <sc-section
        heading="Opacity"
        description="3 semantic opacity levels for disabled states, overlays, and placeholders."
        .count=${3}
      >
        <div class="opacity-grid">
          ${OPACITIES.map(
            (o) => html`
            <div class="opacity-demo token-box" @click=${(e: Event) => this._copy(o.token, e)}>
              <div class="opacity-bg"></div>
              <div
                class="opacity-overlay"
                style=${styleMap({ opacity: `var(${o.token})` })}
              >
                <span class="opacity-label">${o.label}</span>
                <span class="opacity-value">${o.token}: ${o.value}</span>
              </div>
            </div>
          `
          )}
        </div>
      </sc-section>
    `;
  }

  /* ── Render: Focus Ring ── */

  private _renderFocusRing() {
    return html`
      <sc-section
        heading="Focus Ring"
        description="3 tokens that define the focus-visible ring style. Tab into or click the interactive elements below to see the ring."
        .count=${3}
      >
        <div class="focus-grid">
          ${FOCUS_TOKENS.map(
            (f) => html`
            <div
              class="focus-token-card"
              @click=${(e: Event) => this._copy(f.token, e)}
            >
              <p class="focus-token-name">${f.token}</p>
              <p class="focus-token-value">${f.value}</p>
              <p class="focus-token-desc">${f.description}</p>
            </div>
          `
          )}
        </div>

        <div class="focus-demo-area">
          <p class="focus-demo-hint">
            Tab through or click these elements to see the focus ring in action.
          </p>
          <button
            class="focus-demo-btn ${this._focusDemoActive ? 'active-ring' : ''}"
            @click=${() => {
              this._focusDemoActive = !this._focusDemoActive;
            }}
          >
            Click or Tab to Focus
          </button>
          <input
            class="focus-demo-input"
            type="text"
            placeholder="Tab here to see focus ring"
          />
          <button
            class="focus-demo-link"
            @click=${(e: Event) => {
              (e.target as HTMLElement).focus();
            }}
          >
            Focusable link element
          </button>
        </div>
      </sc-section>
    `;
  }

  /* ── Render: Aspect Ratios ── */

  private _renderAspectRatios() {
    return html`
      <sc-section
        heading="Aspect Ratios"
        description="6 ratio tokens for constraining element proportions."
        .count=${6}
      >
        <div class="aspect-grid">
          ${ASPECT_RATIOS.map(
            (a) => html`
            <div class="token-box aspect-demo" @click=${(e: Event) => this._copy(a.token, e)}>
              <div
                class="aspect-placeholder"
                style=${styleMap({ 'aspect-ratio': `var(${a.token})` })}
              >
                <span class="aspect-ratio-label">${a.ratio}</span>
              </div>
              <span class="token-name">${a.token}</span>
              <span class="token-value">${a.label}</span>
            </div>
          `
          )}
        </div>
      </sc-section>
    `;
  }

  /* ── Main render ── */

  override render() {
    return html`
      <h1 class="page-title">Surfaces</h1>
      <p class="page-subtitle">
        <strong>29</strong> borders &amp; radii,
        <strong>13</strong> shadows,
        <strong>3</strong> opacity,
        <strong>3</strong> focus ring, and
        <strong>6</strong> aspect ratios
        = <strong>54</strong> surface tokens.
        Click any token to copy its CSS custom property reference.
      </p>

      ${this._renderBorderSizes()}
      ${this._renderBorderRadii()}
      ${this._renderShadows()}
      ${this._renderOpacity()}
      ${this._renderFocusRing()}
      ${this._renderAspectRatios()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-surfaces': ScPageSurfaces;
  }
}
