import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import '../components/sc-section.js';
import { copyToken } from '../utils/clipboard.js';

/* ─────────────────────────────────────────────────────────
   Token data — sourced from packages/theme/src/tokens/sizing.css
   ───────────────────────────────────────────────────────── */

interface SizeToken {
  readonly token: string;
  readonly value: string;
  readonly negative?: boolean;
}

interface BreakpointToken {
  readonly token: string;
  readonly value: string;
  readonly px: number;
  readonly label: string;
}

/** Rem sizes (17). Sub-zero tokens (000, 00) are true negatives. */
const REM_SIZES: readonly SizeToken[] = [
  { token: '--line-size-000', value: '-0.5rem', negative: true },
  { token: '--line-size-00', value: '-0.25rem', negative: true },
  { token: '--line-size-1', value: '0.25rem' },
  { token: '--line-size-2', value: '0.5rem' },
  { token: '--line-size-3', value: '1rem' },
  { token: '--line-size-4', value: '1.25rem' },
  { token: '--line-size-5', value: '1.5rem' },
  { token: '--line-size-6', value: '1.75rem' },
  { token: '--line-size-7', value: '2rem' },
  { token: '--line-size-8', value: '3rem' },
  { token: '--line-size-9', value: '4rem' },
  { token: '--line-size-10', value: '5rem' },
  { token: '--line-size-11', value: '7.5rem' },
  { token: '--line-size-12', value: '10rem' },
  { token: '--line-size-13', value: '15rem' },
  { token: '--line-size-14', value: '20rem' },
  { token: '--line-size-15', value: '30rem' }
] as const;

/** Px sizes (17). Sub-zero tokens (000, 00) are true negatives. */
const PX_SIZES: readonly SizeToken[] = [
  { token: '--line-size-px-000', value: '-8px', negative: true },
  { token: '--line-size-px-00', value: '-4px', negative: true },
  { token: '--line-size-px-1', value: '4px' },
  { token: '--line-size-px-2', value: '8px' },
  { token: '--line-size-px-3', value: '16px' },
  { token: '--line-size-px-4', value: '20px' },
  { token: '--line-size-px-5', value: '24px' },
  { token: '--line-size-px-6', value: '28px' },
  { token: '--line-size-px-7', value: '32px' },
  { token: '--line-size-px-8', value: '48px' },
  { token: '--line-size-px-9', value: '64px' },
  { token: '--line-size-px-10', value: '80px' },
  { token: '--line-size-px-11', value: '120px' },
  { token: '--line-size-px-12', value: '160px' },
  { token: '--line-size-px-13', value: '240px' },
  { token: '--line-size-px-14', value: '320px' },
  { token: '--line-size-px-15', value: '480px' }
] as const;

/** Fluid sizes (10). Clamp-based responsive values. */
const FLUID_SIZES: readonly SizeToken[] = [
  { token: '--line-size-fluid-1', value: 'clamp(0.5rem, 1vw, 1rem)' },
  { token: '--line-size-fluid-2', value: 'clamp(1rem, 2vw, 1.5rem)' },
  { token: '--line-size-fluid-3', value: 'clamp(1.5rem, 3vw, 2rem)' },
  { token: '--line-size-fluid-4', value: 'clamp(2rem, 4vw, 3rem)' },
  { token: '--line-size-fluid-5', value: 'clamp(4rem, 5vw, 5rem)' },
  { token: '--line-size-fluid-6', value: 'clamp(5rem, 7vw, 7.5rem)' },
  { token: '--line-size-fluid-7', value: 'clamp(7.5rem, 10vw, 10rem)' },
  { token: '--line-size-fluid-8', value: 'clamp(10rem, 20vw, 15rem)' },
  { token: '--line-size-fluid-9', value: 'clamp(15rem, 30vw, 20rem)' },
  { token: '--line-size-fluid-10', value: 'clamp(20rem, 40vw, 30rem)' }
] as const;

/** Content widths (3). */
const CONTENT_WIDTHS: readonly SizeToken[] = [
  { token: '--line-size-content-1', value: '20ch' },
  { token: '--line-size-content-2', value: '45ch' },
  { token: '--line-size-content-3', value: '60ch' }
] as const;

/** Header widths (3). */
const HEADER_WIDTHS: readonly SizeToken[] = [
  { token: '--line-size-header-1', value: '20ch' },
  { token: '--line-size-header-2', value: '25ch' },
  { token: '--line-size-header-3', value: '35ch' }
] as const;

/** Breakpoints (7). */
const BREAKPOINTS: readonly BreakpointToken[] = [
  { token: '--line-size-xxs', value: '240px', px: 240, label: 'xxs' },
  { token: '--line-size-xs', value: '360px', px: 360, label: 'xs' },
  { token: '--line-size-sm', value: '480px', px: 480, label: 'sm' },
  { token: '--line-size-md', value: '768px', px: 768, label: 'md' },
  { token: '--line-size-lg', value: '1024px', px: 1024, label: 'lg' },
  { token: '--line-size-xl', value: '1440px', px: 1440, label: 'xl' },
  { token: '--line-size-xxl', value: '1920px', px: 1920, label: 'xxl' }
] as const;

/** Relative / ch-based sizes (17). Sub-zero tokens (000, 00) are true negatives. */
const RELATIVE_SIZES: readonly SizeToken[] = [
  { token: '--line-size-relative-000', value: '-0.5ch', negative: true },
  { token: '--line-size-relative-00', value: '-0.25ch', negative: true },
  { token: '--line-size-relative-1', value: '0.25ch' },
  { token: '--line-size-relative-2', value: '0.5ch' },
  { token: '--line-size-relative-3', value: '1ch' },
  { token: '--line-size-relative-4', value: '1.25ch' },
  { token: '--line-size-relative-5', value: '1.5ch' },
  { token: '--line-size-relative-6', value: '1.75ch' },
  { token: '--line-size-relative-7', value: '2ch' },
  { token: '--line-size-relative-8', value: '3ch' },
  { token: '--line-size-relative-9', value: '4ch' },
  { token: '--line-size-relative-10', value: '5ch' },
  { token: '--line-size-relative-11', value: '7.5ch' },
  { token: '--line-size-relative-12', value: '10ch' },
  { token: '--line-size-relative-13', value: '15ch' },
  { token: '--line-size-relative-14', value: '20ch' },
  { token: '--line-size-relative-15', value: '30ch' }
] as const;

/** Maximum breakpoint px value — used to scale the ruler. */
const RULER_MAX = BREAKPOINTS[BREAKPOINTS.length - 1]?.px ?? 1920;

@customElement('sc-page-spacing')
export class ScPageSpacing extends LitElement {
  /** Current viewport width for the breakpoint ruler indicator. */
  @state() private _viewportWidth = 0;

  private _boundResize = this._onResize.bind(this);

  override connectedCallback(): void {
    super.connectedCallback();
    this._viewportWidth = window.innerWidth;
    window.addEventListener('resize', this._boundResize);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._boundResize);
  }

  private _onResize(): void {
    this._viewportWidth = window.innerWidth;
  }

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

    /* ── Shared token row ── */

    .token-row {
      display: flex;
      align-items: center;
      gap: var(--line-size-3, 1rem);
      padding: var(--line-size-2, 0.5rem) 0;
      cursor: pointer;
      border-bottom: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
    }

    .token-row:last-child {
      border-bottom: none;
    }

    .token-row:hover {
      background: var(--line-subtle-background, #161616);
    }

    .token-label {
      min-width: 200px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .token-name {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      word-break: break-all;
    }

    .token-value {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-solid-background, #c8ff00);
    }

    /* Copy flash */
    .token-row.copied .token-name {
      color: var(--line-solid-background, #c8ff00);
    }

    .token-row.copied::after {
      content: '\\2713';
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-8, 800);
      color: var(--line-solid-background, #c8ff00);
      margin-left: auto;
      animation: pop-check 700ms var(--line-ease-2) forwards;
    }

    @keyframes pop-check {
      0% { opacity: 0; transform: scale(0.5); }
      15% { opacity: 1; transform: scale(1.1); }
      30% { transform: scale(1); }
      75% { opacity: 1; }
      100% { opacity: 0; }
    }

    /* ── Size bars ── */

    .bar-track {
      flex: 1;
      min-width: 0;
      position: relative;
      height: 28px;
      display: flex;
      align-items: center;
    }

    .bar {
      height: 100%;
      border-radius: var(--line-radius-1, 2px);
      background: var(--line-solid-background, #c8ff00);
      max-width: 100%;
      transition: width 200ms var(--line-ease-2);
    }

    /* Negative value indicator */
    .bar-negative {
      height: 100%;
      border-radius: var(--line-radius-1, 2px);
      background: var(--line-error-solid-background, #e54d2e);
      opacity: 0.6;
      max-width: 100%;
    }

    .negative-label {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-error-solid-background, #e54d2e);
      margin-left: var(--line-size-2, 0.5rem);
    }

    /* ── Fluid sizes ── */

    .fluid-container {
      resize: horizontal;
      overflow: auto;
      border: var(--line-border-size-1, 1px) dashed var(--line-ui-border, #444);
      border-radius: var(--line-radius-2, 5px);
      padding: var(--line-size-3, 1rem);
      min-width: 200px;
      max-width: 100%;
      position: relative;
    }

    .fluid-hint {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      margin-bottom: var(--line-size-3, 1rem);
      display: flex;
      align-items: center;
      gap: var(--line-size-2, 0.5rem);
    }

    .fluid-hint-icon {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-right: 2px solid var(--line-low-contrast, #999);
      border-bottom: 2px solid var(--line-low-contrast, #999);
      transform: rotate(-45deg);
      flex-shrink: 0;
    }

    /* ── Content & header widths ── */

    .width-demo-stack {
      display: flex;
      flex-direction: column;
      gap: var(--line-size-3, 1rem);
    }

    .width-demo-box {
      padding: var(--line-size-3, 1rem);
      border-radius: var(--line-radius-2, 5px);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-border, #444);
      background: var(--line-subtle-background, #161616);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
    }

    .width-demo-box:hover {
      border-color: var(--line-solid-background, #c8ff00);
    }

    .width-demo-box.copied {
      border-color: var(--line-solid-background, #c8ff00);
    }

    .width-demo-label {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .width-demo-text {
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-low-contrast, #999);
      line-height: var(--line-lineheight-3, 1.6);
    }

    /* ── Breakpoint ruler ── */

    .ruler-container {
      position: relative;
      margin-top: var(--line-size-3, 1rem);
    }

    .ruler-track {
      position: relative;
      height: 48px;
      background: var(--line-subtle-background, #161616);
      border-radius: var(--line-radius-2, 5px);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      overflow: hidden;
    }

    .ruler-tick {
      position: absolute;
      top: 0;
      height: 100%;
      border-left: var(--line-border-size-1, 1px) solid var(--line-ui-border, #444);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      padding-left: var(--line-size-2, 0.5rem);
      box-sizing: border-box;
      cursor: pointer;
    }

    .ruler-tick:hover {
      border-left-color: var(--line-solid-background, #c8ff00);
    }

    .ruler-tick.copied {
      border-left-color: var(--line-solid-background, #c8ff00);
    }

    .ruler-tick-label {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      text-transform: uppercase;
      line-height: 1;
    }

    .ruler-tick-value {
      font-size: 9px;
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      opacity: 0.6;
      line-height: 1;
      margin-top: 2px;
    }

    .ruler-viewport-marker {
      position: absolute;
      top: 0;
      height: 100%;
      width: 2px;
      background: var(--line-solid-background, #c8ff00);
      z-index: 1;
      transition: left 150ms var(--line-ease-2);
    }

    .ruler-viewport-label {
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-solid-background, #c8ff00);
      white-space: nowrap;
    }

    /* ── Relative sizes ── */

    .relative-demo {
      display: flex;
      flex-direction: column;
      gap: var(--line-size-2, 0.5rem);
    }

    .relative-row {
      display: flex;
      align-items: center;
      gap: var(--line-size-3, 1rem);
      cursor: pointer;
      padding: var(--line-size-1, 0.25rem) 0;
      border-bottom: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
    }

    .relative-row:last-child {
      border-bottom: none;
    }

    .relative-row:hover {
      background: var(--line-subtle-background, #161616);
    }

    .relative-row.copied .token-name {
      color: var(--line-solid-background, #c8ff00);
    }

    .relative-sample {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
    }

    .relative-text-block {
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-high-contrast, #fff);
      background: var(--line-subtle-background, #161616);
      border-radius: var(--line-radius-1, 2px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    /* ── Responsive ── */

    @media (max-width: 768px) {
      .token-label {
        min-width: 140px;
      }
    }

    @media (max-width: 480px) {
      .token-label {
        min-width: 100px;
      }
    }
  `;

  /* ── Copy helper ── */

  private _copy(token: string, e: Event): void {
    const el = e.currentTarget as HTMLElement;
    copyToken(token, el);
  }

  /* ── Render: Rem Sizes ── */

  private _renderRemSizes() {
    return html`
      <sc-section
        heading="Rem Sizes"
        description="17 rem-based spacing tokens from negative offsets (-0.5rem) to large layout values (30rem). Sub-zero tokens (000, 00) are true negatives for margins, insets, and offsets."
        .count=${17}
      >
        ${REM_SIZES.map(
          (s) => html`
          <div class="token-row" @click=${(e: Event) => this._copy(s.token, e)}>
            <div class="token-label">
              <span class="token-name">${s.token}</span>
              <span class="token-value">${s.value}</span>
            </div>
            <div class="bar-track">
              ${
                s.negative
                  ? html`
                  <div
                    class="bar-negative"
                    style=${styleMap({ width: `${Math.abs(Number.parseFloat(s.value)) * 16}px` })}
                  ></div>
                  <span class="negative-label">negative</span>
                `
                  : html`
                  <div
                    class="bar"
                    style=${styleMap({ width: `var(${s.token})` })}
                  ></div>
                `
              }
            </div>
          </div>
        `
        )}
      </sc-section>
    `;
  }

  /* ── Render: Px Sizes ── */

  private _renderPxSizes() {
    return html`
      <sc-section
        heading="Pixel Sizes"
        description="17 pixel-based spacing tokens mirroring the rem scale. Sub-zero tokens (000, 00) are true negatives."
        .count=${17}
      >
        ${PX_SIZES.map(
          (s) => html`
          <div class="token-row" @click=${(e: Event) => this._copy(s.token, e)}>
            <div class="token-label">
              <span class="token-name">${s.token}</span>
              <span class="token-value">${s.value}</span>
            </div>
            <div class="bar-track">
              ${
                s.negative
                  ? html`
                  <div
                    class="bar-negative"
                    style=${styleMap({ width: `${Math.abs(Number.parseFloat(s.value))}px` })}
                  ></div>
                  <span class="negative-label">negative</span>
                `
                  : html`
                  <div
                    class="bar"
                    style=${styleMap({ width: `var(${s.token})` })}
                  ></div>
                `
              }
            </div>
          </div>
        `
        )}
      </sc-section>
    `;
  }

  /* ── Render: Fluid Sizes ── */

  private _renderFluidSizes() {
    return html`
      <sc-section
        heading="Fluid Sizes"
        description="10 fluid spacing tokens using clamp() for responsive sizing. Drag the container's right edge to see the values adapt."
        .count=${10}
      >
        <div class="fluid-container">
          <div class="fluid-hint">
            <span class="fluid-hint-icon"></span>
            Drag the right edge to resize this container
          </div>
          ${FLUID_SIZES.map(
            (s) => html`
            <div class="token-row" @click=${(e: Event) => this._copy(s.token, e)}>
              <div class="token-label">
                <span class="token-name">${s.token}</span>
                <span class="token-value">${s.value}</span>
              </div>
              <div class="bar-track">
                <div
                  class="bar"
                  style=${styleMap({ width: `var(${s.token})` })}
                ></div>
              </div>
            </div>
          `
          )}
        </div>
      </sc-section>
    `;
  }

  /* ── Render: Content Widths ── */

  private _renderContentWidths() {
    return html`
      <sc-section
        heading="Content Widths"
        description="3 content width tokens for constraining text blocks. Based on ch units for optimal reading length."
        .count=${3}
      >
        <div class="width-demo-stack">
          ${CONTENT_WIDTHS.map(
            (s) => html`
            <div
              class="width-demo-box"
              style=${styleMap({ 'max-width': `var(${s.token})` })}
              @click=${(e: Event) => this._copy(s.token, e)}
            >
              <div class="width-demo-label">
                <span class="token-name">${s.token}</span>
                <span class="token-value">${s.value}</span>
              </div>
              <span class="width-demo-text">
                The quick brown fox jumps over the lazy dog. This sample text demonstrates
                the maximum width constraint at ${s.value}.
              </span>
            </div>
          `
          )}
        </div>
      </sc-section>
    `;
  }

  /* ── Render: Header Widths ── */

  private _renderHeaderWidths() {
    return html`
      <sc-section
        heading="Header Widths"
        description="3 header width tokens for constraining headings. Based on ch units for balanced headline lengths."
        .count=${3}
      >
        <div class="width-demo-stack">
          ${HEADER_WIDTHS.map(
            (s) => html`
            <div
              class="width-demo-box"
              style=${styleMap({ 'max-width': `var(${s.token})` })}
              @click=${(e: Event) => this._copy(s.token, e)}
            >
              <div class="width-demo-label">
                <span class="token-name">${s.token}</span>
                <span class="token-value">${s.value}</span>
              </div>
              <span class="width-demo-text">
                A Sample Heading Text
              </span>
            </div>
          `
          )}
        </div>
      </sc-section>
    `;
  }

  /* ── Render: Breakpoints ── */

  private _renderBreakpoints() {
    const clampedViewport = Math.min(this._viewportWidth, RULER_MAX);
    const markerPercent = (clampedViewport / RULER_MAX) * 100;

    return html`
      <sc-section
        heading="Breakpoints"
        description="7 breakpoint tokens defining responsive layout thresholds. The yellow marker shows your current viewport width."
        .count=${7}
      >
        <div class="ruler-container">
          <div class="ruler-track">
            <div
              class="ruler-viewport-marker"
              style=${styleMap({ left: `${markerPercent}%` })}
            >
              <span class="ruler-viewport-label">${this._viewportWidth}px</span>
            </div>
            ${BREAKPOINTS.map(
              (bp) => html`
              <div
                class="ruler-tick"
                style=${styleMap({ left: `${(bp.px / RULER_MAX) * 100}%` })}
                @click=${(e: Event) => this._copy(bp.token, e)}
              >
                <span class="ruler-tick-label">${bp.label}</span>
                <span class="ruler-tick-value">${bp.value}</span>
              </div>
            `
            )}
          </div>
        </div>
      </sc-section>
    `;
  }

  /* ── Render: Relative Sizes ── */

  private _renderRelativeSizes() {
    return html`
      <sc-section
        heading="Relative / ch Sizes"
        description="17 character-relative spacing tokens. Sub-zero tokens (000, 00) are true negatives. Padding is applied to the sample text to visualize each value."
        .count=${17}
      >
        <div class="relative-demo">
          ${RELATIVE_SIZES.map(
            (s) => html`
            <div class="relative-row" @click=${(e: Event) => this._copy(s.token, e)}>
              <div class="token-label">
                <span class="token-name">${s.token}</span>
                <span class="token-value">${s.value}</span>
              </div>
              <div class="relative-sample">
                ${
                  s.negative
                    ? html`
                    <span class="negative-label">negative</span>
                  `
                    : html`
                    <span
                      class="relative-text-block"
                      style=${styleMap({ 'padding-left': `var(${s.token})` })}
                    >Sample text</span>
                  `
                }
              </div>
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
      <h1 class="page-title">Spacing</h1>
      <p class="page-subtitle">
        <strong>17</strong> rem sizes,
        <strong>17</strong> pixel sizes,
        <strong>10</strong> fluid sizes,
        <strong>3</strong> content widths,
        <strong>3</strong> header widths,
        <strong>7</strong> breakpoints, and
        <strong>17</strong> relative sizes
        = <strong>74</strong> spacing tokens.
        Click any token to copy its CSS custom property reference.
      </p>

      ${this._renderRemSizes()}
      ${this._renderPxSizes()}
      ${this._renderFluidSizes()}
      ${this._renderContentWidths()}
      ${this._renderHeaderWidths()}
      ${this._renderBreakpoints()}
      ${this._renderRelativeSizes()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-spacing': ScPageSpacing;
  }
}
