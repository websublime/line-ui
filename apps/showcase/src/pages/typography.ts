import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import '../components/sc-section.js';
import { copyToken } from '../utils/clipboard.js';

/* ─────────────────────────────────────────────────────────
   Token data — sourced from packages/theme/src/tokens/typography.css
   ───────────────────────────────────────────────────────── */

interface TypographyToken {
  readonly token: string;
  readonly value: string;
  readonly label?: string;
}

/** Font families (18). */
const FONT_FAMILIES: readonly TypographyToken[] = [
  { token: '--line-font-system-ui', value: 'system-ui, sans-serif', label: 'System UI' },
  {
    token: '--line-font-transitional',
    value: 'Charter, Bitstream Charter, Sitka Text, Cambria, serif',
    label: 'Transitional'
  },
  {
    token: '--line-font-old-style',
    value: 'Iowan Old Style, Palatino Linotype, URW Palladio L, P052, serif',
    label: 'Old Style'
  },
  {
    token: '--line-font-humanist',
    value: 'Seravek, Gill Sans Nova, Ubuntu, Calibri, DejaVu Sans, source-sans-pro, sans-serif',
    label: 'Humanist'
  },
  {
    token: '--line-font-geometric-humanist',
    value: 'Avenir, Montserrat, Corbel, URW Gothic, source-sans-pro, sans-serif',
    label: 'Geometric Humanist'
  },
  {
    token: '--line-font-classical-humanist',
    value: 'Optima, Candara, Noto Sans, source-sans-pro, sans-serif',
    label: 'Classical Humanist'
  },
  {
    token: '--line-font-neo-grotesque',
    value: 'Inter, Roboto, Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif',
    label: 'Neo-Grotesque'
  },
  {
    token: '--line-font-monospace-slab-serif',
    value: 'Nimbus Mono PS, Courier New, monospace',
    label: 'Monospace Slab Serif'
  },
  {
    token: '--line-font-monospace-code',
    value: 'Dank Mono, Operator Mono, Inconsolata, Fira Mono, ui-monospace, SF Mono, Monaco, ...',
    label: 'Monospace Code'
  },
  {
    token: '--line-font-industrial',
    value: 'Bahnschrift, DIN Alternate, Franklin Gothic Medium, Nimbus Sans Narrow, ...',
    label: 'Industrial'
  },
  {
    token: '--line-font-rounded-sans',
    value: 'ui-rounded, Hiragino Maru Gothic ProN, Quicksand, Comfortaa, Manjari, ...',
    label: 'Rounded Sans'
  },
  {
    token: '--line-font-slab-serif',
    value: 'Rockwell, Rockwell Nova, Roboto Slab, DejaVu Serif, Sitka Small, serif',
    label: 'Slab Serif'
  },
  {
    token: '--line-font-antique',
    value: 'Superclarendon, Bookman Old Style, URW Bookman, URW Bookman L, Georgia Pro, ...',
    label: 'Antique'
  },
  {
    token: '--line-font-didone',
    value: 'Didot, Bodoni MT, Noto Serif Display, URW Palladio L, P052, Sylfaen, serif',
    label: 'Didone'
  },
  {
    token: '--line-font-handwritten',
    value: 'Segoe Print, Bradley Hand, Chilanka, TSCu_Comic, casual, cursive',
    label: 'Handwritten'
  },
  {
    token: '--line-font-sans',
    value: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
    label: 'Sans'
  },
  { token: '--line-font-serif', value: 'ui-serif, serif', label: 'Serif' },
  {
    token: '--line-font-mono',
    value: 'Dank Mono, Operator Mono, Inconsolata, Fira Mono, ui-monospace, SF Mono, Monaco, ...',
    label: 'Mono'
  }
] as const;

/** Font sizes — static (11, numbered 00, 0..9). */
const FONT_SIZES_STATIC: readonly TypographyToken[] = [
  { token: '--line-font-size-0', value: '0.5rem' },
  { token: '--line-font-size-00', value: '0.625rem' },
  { token: '--line-font-size-1', value: '0.75rem' },
  { token: '--line-font-size-2', value: '1rem' },
  { token: '--line-font-size-3', value: '1.1rem' },
  { token: '--line-font-size-4', value: '1.25rem' },
  { token: '--line-font-size-5', value: '1.5rem' },
  { token: '--line-font-size-6', value: '2rem' },
  { token: '--line-font-size-7', value: '2.5rem' },
  { token: '--line-font-size-8', value: '3rem' },
  { token: '--line-font-size-9', value: '3.5rem' }
] as const;

/** Font sizes — fluid (4). */
const FONT_SIZES_FLUID: readonly TypographyToken[] = [
  { token: '--line-font-size-fluid-0', value: 'clamp(0.75rem, 2vw, 1rem)' },
  { token: '--line-font-size-fluid-1', value: 'clamp(1rem, 4vw, 1.5rem)' },
  { token: '--line-font-size-fluid-2', value: 'clamp(1.5rem, 6vw, 2.5rem)' },
  { token: '--line-font-size-fluid-3', value: 'clamp(2rem, 9vw, 3.5rem)' }
] as const;

/** Font weights (9). */
const FONT_WEIGHTS: readonly TypographyToken[] = [
  { token: '--line-font-weight-1', value: '100', label: 'Thin' },
  { token: '--line-font-weight-2', value: '200', label: 'Extra Light' },
  { token: '--line-font-weight-3', value: '300', label: 'Light' },
  { token: '--line-font-weight-4', value: '400', label: 'Regular' },
  { token: '--line-font-weight-5', value: '500', label: 'Medium' },
  { token: '--line-font-weight-6', value: '600', label: 'Semi Bold' },
  { token: '--line-font-weight-7', value: '700', label: 'Bold' },
  { token: '--line-font-weight-8', value: '800', label: 'Extra Bold' },
  { token: '--line-font-weight-9', value: '900', label: 'Black' }
] as const;

/** Line heights (10). */
const LINE_HEIGHTS: readonly TypographyToken[] = [
  { token: '--line-font-lineheight-0', value: '0.95' },
  { token: '--line-font-lineheight-1', value: '1.1' },
  { token: '--line-font-lineheight-2', value: '1.25' },
  { token: '--line-font-lineheight-3', value: '1.375' },
  { token: '--line-font-lineheight-4', value: '1.5' },
  { token: '--line-font-lineheight-5', value: '1.75' },
  { token: '--line-font-lineheight-6', value: '2' },
  { token: '--line-font-lineheight-7', value: '2.25' },
  { token: '--line-font-lineheight-8', value: '2.5' },
  { token: '--line-font-lineheight-9', value: '3' }
] as const;

/** Letter spacings (10). */
const LETTER_SPACINGS: readonly TypographyToken[] = [
  { token: '--line-font-letterspacing-0', value: '-0.05em' },
  { token: '--line-font-letterspacing-1', value: '0.025em' },
  { token: '--line-font-letterspacing-2', value: '0.05em' },
  { token: '--line-font-letterspacing-3', value: '0.075em' },
  { token: '--line-font-letterspacing-4', value: '0.15em' },
  { token: '--line-font-letterspacing-5', value: '0.5em' },
  { token: '--line-font-letterspacing-6', value: '0.75em' },
  { token: '--line-font-letterspacing-7', value: '1em' },
  { token: '--line-font-letterspacing-8', value: '1.5em' },
  { token: '--line-font-letterspacing-9', value: '2em' }
] as const;

const PANGRAM = 'The quick brown fox jumps over the lazy dog';
const WEIGHT_SAMPLE = 'Typography shapes every word you read';
const LINE_HEIGHT_PARAGRAPH =
  'Good typography is invisible. Bad typography is everywhere. Line height controls the vertical rhythm of your text, creating a comfortable reading experience that guides the eye naturally from one line to the next.';

/** Total token count: 18 families + 15 sizes + 9 weights + 10 lineheights + 10 letterspacings = 62 */
const TOTAL_TOKENS =
  FONT_FAMILIES.length +
  FONT_SIZES_STATIC.length +
  FONT_SIZES_FLUID.length +
  FONT_WEIGHTS.length +
  LINE_HEIGHTS.length +
  LETTER_SPACINGS.length;

@customElement('sc-page-typography')
export class ScPageTypography extends LitElement {
  /** Resolved px values for font-size tokens. */
  @state() private _resolvedSizes: Map<string, string> = new Map();

  override firstUpdated(): void {
    this._resolveAllSizes();
  }

  /** Read computed font-size for each size token via a probe element. */
  private _resolveAllSizes(): void {
    const probe = document.createElement('span');
    probe.style.visibility = 'hidden';
    probe.style.position = 'absolute';
    probe.style.pointerEvents = 'none';
    probe.textContent = 'M';
    document.body.appendChild(probe);

    const resolved = new Map<string, string>();

    for (const s of [...FONT_SIZES_STATIC, ...FONT_SIZES_FLUID]) {
      probe.style.fontSize = `var(${s.token})`;
      const computed = getComputedStyle(probe).fontSize;
      resolved.set(s.token, computed);
    }

    document.body.removeChild(probe);
    this._resolvedSizes = resolved;
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
      min-width: 220px;
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

    /* ── Font family section ── */

    .family-sample {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--line-font-size-4, 1.25rem);
      color: var(--line-high-contrast, #fff);
    }

    .family-label-tag {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      padding: 2px var(--line-size-2, 0.5rem);
      border-radius: var(--line-radius-1, 2px);
      background: var(--line-subtle-background, #161616);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      flex-shrink: 0;
    }

    /* ── Font size section ── */

    .size-sample {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: baseline;
      gap: var(--line-size-3, 1rem);
      overflow: hidden;
    }

    .size-text {
      color: var(--line-high-contrast, #fff);
      white-space: nowrap;
      line-height: 1.1;
    }

    .size-resolved {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      flex-shrink: 0;
    }

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

    /* ── Font weight section ── */

    .weight-sample {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--line-font-size-3, 1.1rem);
      color: var(--line-high-contrast, #fff);
    }

    /* ── Line height section ── */

    .lineheight-sample {
      flex: 1;
      min-width: 0;
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-high-contrast, #fff);
      max-width: 50ch;
      background: var(--line-subtle-background, #161616);
      padding: var(--line-size-2, 0.5rem) var(--line-size-3, 1rem);
      border-radius: var(--line-radius-1, 2px);
    }

    /* ── Letter spacing section ── */

    .letterspacing-sample {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--line-font-size-2, 1rem);
      color: var(--line-high-contrast, #fff);
      text-transform: uppercase;
    }

    /* ── Responsive ── */

    @media (max-width: 768px) {
      .token-label {
        min-width: 160px;
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

  /* ── Render: Font Families (19) ── */

  private _renderFontFamilies() {
    return html`
      <sc-section
        heading="Font Families"
        description="18 font family stacks covering system UI, serif, sans-serif, monospace, and decorative typefaces. Each sample renders with its font-family token applied."
        .count=${18}
      >
        ${FONT_FAMILIES.map(
          (f) => html`
          <div class="token-row" @click=${(e: Event) => this._copy(f.token, e)}>
            <div class="token-label">
              <span class="token-name">${f.token}</span>
              <span class="token-value">${f.value}</span>
            </div>
            <span
              class="family-sample"
              style=${styleMap({ fontFamily: `var(${f.token})` })}
            >${PANGRAM}</span>
            ${f.label ? html`<span class="family-label-tag">${f.label}</span>` : ''}
          </div>
        `
        )}
      </sc-section>
    `;
  }

  /* ── Render: Font Sizes — Static (11) ── */

  private _renderStaticSizes() {
    return html`
      <sc-section
        heading="Font Sizes — Static"
        description="11 static font-size tokens from 0.5rem (size-0) to 3.5rem (size-9), including the half-step size-00 (0.625rem)."
        .count=${11}
      >
        ${FONT_SIZES_STATIC.map(
          (s) => html`
          <div class="token-row" @click=${(e: Event) => this._copy(s.token, e)}>
            <div class="token-label">
              <span class="token-name">${s.token}</span>
              <span class="token-value">${s.value}</span>
            </div>
            <div class="size-sample">
              <span
                class="size-text"
                style=${styleMap({ fontSize: `var(${s.token})` })}
              >Ag</span>
              <span class="size-resolved">${this._resolvedSizes.get(s.token) ?? ''}</span>
            </div>
          </div>
        `
        )}
      </sc-section>
    `;
  }

  /* ── Render: Font Sizes — Fluid (4) ── */

  private _renderFluidSizes() {
    return html`
      <sc-section
        heading="Font Sizes — Fluid"
        description="4 fluid font-size tokens using clamp() for responsive scaling. Drag the container edge to see how they adapt."
        .count=${4}
      >
        <div class="fluid-container">
          <div class="fluid-hint">
            <span class="fluid-hint-icon"></span>
            Drag the right edge to resize this container
          </div>
          ${FONT_SIZES_FLUID.map(
            (s) => html`
            <div class="token-row" @click=${(e: Event) => this._copy(s.token, e)}>
              <div class="token-label">
                <span class="token-name">${s.token}</span>
                <span class="token-value">${s.value}</span>
              </div>
              <div class="size-sample">
                <span
                  class="size-text"
                  style=${styleMap({ fontSize: `var(${s.token})` })}
                >Ag</span>
                <span class="size-resolved">${this._resolvedSizes.get(s.token) ?? ''}</span>
              </div>
            </div>
          `
          )}
        </div>
      </sc-section>
    `;
  }

  /* ── Render: Font Weights (9) ── */

  private _renderFontWeights() {
    return html`
      <sc-section
        heading="Font Weights"
        description="9 font-weight tokens from 100 (Thin) to 900 (Black). Sample text rendered at each weight using the Geist variable font."
        .count=${9}
      >
        ${FONT_WEIGHTS.map(
          (w) => html`
          <div class="token-row" @click=${(e: Event) => this._copy(w.token, e)}>
            <div class="token-label">
              <span class="token-name">${w.token}</span>
              <span class="token-value">${w.value}${w.label ? ` (${w.label})` : ''}</span>
            </div>
            <span
              class="weight-sample"
              style=${styleMap({ fontWeight: `var(${w.token})` })}
            >${WEIGHT_SAMPLE}</span>
          </div>
        `
        )}
      </sc-section>
    `;
  }

  /* ── Render: Line Heights (10) ── */

  private _renderLineHeights() {
    return html`
      <sc-section
        heading="Line Heights"
        description="10 line-height tokens from tight (0.95) to spacious (3). Each paragraph demonstrates the vertical rhythm at that line-height value."
        .count=${10}
      >
        ${LINE_HEIGHTS.map(
          (lh) => html`
          <div class="token-row" @click=${(e: Event) => this._copy(lh.token, e)}>
            <div class="token-label">
              <span class="token-name">${lh.token}</span>
              <span class="token-value">${lh.value}</span>
            </div>
            <p
              class="lineheight-sample"
              style=${styleMap({ lineHeight: `var(${lh.token})` })}
            >${LINE_HEIGHT_PARAGRAPH}</p>
          </div>
        `
        )}
      </sc-section>
    `;
  }

  /* ── Render: Letter Spacings (10) ── */

  private _renderLetterSpacings() {
    return html`
      <sc-section
        heading="Letter Spacings"
        description="10 letter-spacing tokens from tight (-0.05em) to ultra-wide (2em). Sample text rendered in uppercase to emphasize the tracking difference."
        .count=${10}
      >
        ${LETTER_SPACINGS.map(
          (ls) => html`
          <div class="token-row" @click=${(e: Event) => this._copy(ls.token, e)}>
            <div class="token-label">
              <span class="token-name">${ls.token}</span>
              <span class="token-value">${ls.value}</span>
            </div>
            <span
              class="letterspacing-sample"
              style=${styleMap({ letterSpacing: `var(${ls.token})` })}
            >Letter Spacing</span>
          </div>
        `
        )}
      </sc-section>
    `;
  }

  /* ── Main render ── */

  override render() {
    return html`
      <h1 class="page-title">Typography</h1>
      <p class="page-subtitle">
        <strong>${FONT_FAMILIES.length}</strong> font families,
        <strong>${FONT_SIZES_STATIC.length}</strong> static sizes,
        <strong>${FONT_SIZES_FLUID.length}</strong> fluid sizes,
        <strong>${FONT_WEIGHTS.length}</strong> weights,
        <strong>${LINE_HEIGHTS.length}</strong> line heights, and
        <strong>${LETTER_SPACINGS.length}</strong> letter spacings
        = <strong>${TOTAL_TOKENS}</strong> typography tokens.
        Click any token to copy its CSS custom property reference.
      </p>

      ${this._renderFontFamilies()}
      ${this._renderStaticSizes()}
      ${this._renderFluidSizes()}
      ${this._renderFontWeights()}
      ${this._renderLineHeights()}
      ${this._renderLetterSpacings()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-typography': ScPageTypography;
  }
}
