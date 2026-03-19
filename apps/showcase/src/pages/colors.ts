import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { ALL_SCHEMAS, LEVEL_ROLES, LEVEL_SEMANTIC_TOKENS, PALETTE_LEVELS, type PaletteName } from '../constants.js';

import '../components/sc-section.js';
import '../components/sc-swatch.js';
import '../components/sc-code-block.js';

/**
 * Compute relative luminance from an RGB triplet (0-255).
 * Used for WCAG contrast ratio calculation.
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG contrast ratio between two luminances. */
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse a CSS color string to RGB. Works with rgb(), hsl(), hex, and
 * color function outputs from getComputedStyle.
 */
function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
  // Try using an offscreen canvas to resolve any CSS color to RGB
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const canvas = new OffscreenCanvas(1, 1);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b };
      }
    } catch {
      // Fallback below
    }
  }

  // Regex fallback for rgb(r, g, b) / rgba(r, g, b, a)
  const rgbMatch = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3])
    };
  }

  // Hex fallback
  const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16)
    };
  }

  return null;
}

@customElement('sc-page-colors')
export class ScPageColors extends LitElement {
  /** Currently active/inspected palette. */
  @state() private _activePalette: PaletteName = 'violet';

  /** Color-mix: palette A. */
  @state() private _mixPaletteA: PaletteName = 'blue';
  /** Color-mix: palette B. */
  @state() private _mixPaletteB: PaletteName = 'red';
  /** Color-mix: blend percentage (0 = all A, 100 = all B). */
  @state() private _mixPercent = 50;

  /** Contrast ratio computed for the active palette level-9 vs contrast token. */
  @state() private _contrastRatio = 0;
  @state() private _contrastBgColor = '';
  @state() private _contrastFgColor = '';

  /** Expanded palettes in the full explorer (Section 4). */
  @state() private _expandedPalettes = new Set<PaletteName>();

  static override styles = css`
    :host {
      display: block;
    }

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

    /* ── Section 1: Active palette strip ── */
    .strip-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--line-size-2, 0.5rem);
    }

    .strip-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--line-size-1, 0.25rem);
    }

    .strip-level {
      font-size: 10px;
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      text-align: center;
    }

    .strip-semantic {
      font-size: 9px;
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      text-align: center;
      max-width: 72px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Section 2: Contrast demo ── */
    .contrast-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--line-size-3, 1rem);
      padding: var(--line-size-7, 2rem) var(--line-size-5, 1.5rem);
      border-radius: var(--line-radius-3, 8px);
      min-height: 120px;
    }

    .contrast-text {
      font-size: var(--line-font-size-5, 1.75rem);
      font-weight: var(--line-font-weight-8, 800);
      letter-spacing: -0.02em;
    }

    .contrast-meta {
      display: flex;
      align-items: center;
      gap: var(--line-size-4, 1.25rem);
      flex-wrap: wrap;
      justify-content: center;
    }

    .contrast-ratio-badge {
      font-family: 'IBM Plex Mono', monospace;
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-7, 700);
      padding: var(--line-size-1, 0.25rem) var(--line-size-3, 1rem);
      border-radius: var(--line-radius-2, 4px);
      background: rgba(0, 0, 0, 0.3);
    }

    .contrast-pass {
      font-family: 'IBM Plex Mono', monospace;
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-6, 600);
      padding: var(--line-size-1, 0.25rem) var(--line-size-2, 0.5rem);
      border-radius: var(--line-radius-2, 4px);
    }

    .pass-aa { background: color-mix(in srgb, var(--line-green-9) 20%, transparent); color: var(--line-green-9); }
    .pass-aaa { background: color-mix(in srgb, var(--line-green-9) 30%, transparent); color: var(--line-green-9); }
    .fail { background: color-mix(in srgb, var(--line-red-9) 20%, transparent); color: var(--line-red-9); }

    .contrast-tokens {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      opacity: 0.8;
    }

    /* ── Section 3: All palettes mini grid ── */
    .palettes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: var(--line-size-3, 1rem);
    }

    .palette-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--line-size-1, 0.25rem);
      cursor: pointer;
      padding: var(--line-size-2, 0.5rem);
      border-radius: var(--line-radius-2, 4px);
      border: var(--line-border-size-1, 1px) solid transparent;
      transition:
        border-color var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        background var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }

    .palette-card:hover {
      border-color: var(--line-ui-background, #222);
      background: var(--line-subtle-background, #161616);
    }

    .palette-card.active {
      border-color: var(--line-solid-background, #c8ff00);
      background: var(--line-subtle-background, #161616);
    }

    .palette-dot {
      width: 40px;
      height: 40px;
      border-radius: var(--line-radius-2, 4px);
    }

    .palette-name {
      font-size: 11px;
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      text-align: center;
      font-family: 'IBM Plex Mono', monospace;
    }

    .palette-card.active .palette-name {
      color: var(--line-high-contrast, #fff);
    }

    /* ── Section 4: Full palette explorer ── */
    .explorer-palette {
      margin-bottom: var(--line-size-3, 1rem);
    }

    .explorer-header {
      display: flex;
      align-items: center;
      gap: var(--line-size-3, 1rem);
      padding: var(--line-size-2, 0.5rem) var(--line-size-3, 1rem);
      border-radius: var(--line-radius-2, 4px);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      cursor: pointer;
      background: transparent;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
      transition:
        background var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        border-color var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }

    .explorer-header:hover {
      background: var(--line-subtle-background, #161616);
      border-color: var(--line-ui-active-background, #333);
    }

    .explorer-header.expanded {
      border-color: var(--line-solid-background, #c8ff00);
      background: var(--line-subtle-background, #161616);
    }

    .explorer-preview {
      display: flex;
      gap: 2px;
      flex: 1;
    }

    .explorer-preview-dot {
      flex: 1;
      height: 8px;
      border-radius: 1px;
    }

    .explorer-name {
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-6, 600);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      min-width: 60px;
    }

    .explorer-header.expanded .explorer-name {
      color: var(--line-high-contrast, #fff);
    }

    .explorer-chevron {
      font-size: 12px;
      color: var(--line-low-contrast, #999);
      transition: transform var(--line-duration-quick-2, 120ms) var(--line-ease-2);
    }

    .explorer-chevron.expanded {
      transform: rotate(90deg);
    }

    .explorer-body {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--line-size-2, 0.5rem);
      padding: var(--line-size-3, 1rem) 0;
    }

    /* ── Section 5: Color-mix demo ── */
    .mix-controls {
      display: flex;
      align-items: center;
      gap: var(--line-size-4, 1.25rem);
      margin-bottom: var(--line-size-5, 1.5rem);
      flex-wrap: wrap;
    }

    .mix-selector {
      display: flex;
      align-items: center;
      gap: var(--line-size-2, 0.5rem);
    }

    .mix-selector-label {
      font-size: 11px;
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mix-cycle-btn {
      display: flex;
      align-items: center;
      gap: var(--line-size-1, 0.25rem);
      padding: var(--line-size-1, 0.25rem) var(--line-size-3, 1rem);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      border-radius: var(--line-radius-2, 4px);
      background: transparent;
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-6, 600);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-high-contrast, #fff);
      cursor: pointer;
      transition:
        border-color var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        background var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }

    .mix-cycle-btn:hover {
      border-color: var(--line-ui-border, #444);
      background: var(--line-subtle-background, #161616);
    }

    .mix-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .mix-range-group {
      display: flex;
      align-items: center;
      gap: var(--line-size-2, 0.5rem);
      flex: 1;
      min-width: 200px;
    }

    .mix-range {
      flex: 1;
      accent-color: var(--line-solid-background, #c8ff00);
    }

    .mix-pct {
      font-family: 'IBM Plex Mono', monospace;
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-high-contrast, #fff);
      min-width: 40px;
      text-align: right;
    }

    .mix-strip {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--line-size-1, 0.25rem);
    }

    .mix-swatch {
      height: 56px;
      border-radius: var(--line-radius-2, 4px);
      position: relative;
    }

    .mix-swatch-label {
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 9px;
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-high-contrast, #fff);
      text-shadow: 0 1px 2px color-mix(in srgb, var(--line-background, #111) 50%, transparent);
    }

    .mix-code {
      margin-top: var(--line-size-4, 1.25rem);
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .strip-grid {
        grid-template-columns: repeat(6, 1fr);
      }
      .explorer-body {
        grid-template-columns: repeat(6, 1fr);
      }
      .mix-strip {
        grid-template-columns: repeat(6, 1fr);
      }
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    // Try to use the active schema from body class as the initial palette
    const bodyClasses = document.body.classList;
    for (const cls of bodyClasses) {
      if (cls.startsWith('line-schema-')) {
        const schema = cls.replace('line-schema-', '') as PaletteName;
        if ((ALL_SCHEMAS as readonly string[]).includes(schema)) {
          this._activePalette = schema;
          break;
        }
      }
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has('_activePalette')) {
      this._computeContrast();
    }
  }

  private _computeContrast(): void {
    const root = document.documentElement;
    const style = getComputedStyle(root);

    const bg = style.getPropertyValue(`--line-${this._activePalette}-9`).trim();
    const fg = style.getPropertyValue(`--line-${this._activePalette}-contrast`).trim();

    if (!(bg && fg)) return;

    const bgRgb = parseColorToRgb(bg);
    const fgRgb = parseColorToRgb(fg);

    if (bgRgb && fgRgb) {
      const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
      const fgLum = relativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
      this._contrastRatio = contrastRatio(bgLum, fgLum);
    }

    this._contrastBgColor = bg;
    this._contrastFgColor = fg;
  }

  private _setActivePalette(palette: PaletteName): void {
    this._activePalette = palette;
  }

  private _toggleExplorer(palette: PaletteName): void {
    const next = new Set(this._expandedPalettes);
    if (next.has(palette)) {
      next.delete(palette);
    } else {
      next.add(palette);
    }
    this._expandedPalettes = next;
  }

  private _cycleMixPalette(which: 'a' | 'b'): void {
    const current = which === 'a' ? this._mixPaletteA : this._mixPaletteB;
    const i = (ALL_SCHEMAS as readonly string[]).indexOf(current);
    const next = ALL_SCHEMAS[(i + 1) % ALL_SCHEMAS.length];
    if (which === 'a') {
      this._mixPaletteA = next;
    } else {
      this._mixPaletteB = next;
    }
  }

  private _handleMixRange(e: Event): void {
    this._mixPercent = Number((e.target as HTMLInputElement).value);
  }

  // ── Render helpers ──

  private _renderActivePaletteStrip() {
    return html`
      <sc-section
        heading="Active Palette"
        description="The 12-step scale for ${this._activePalette}. Hover for token details, click to copy."
        .count=${12}
      >
        <div class="strip-grid">
          ${PALETTE_LEVELS.map(
            (level) => html`
            <div class="strip-cell">
              <sc-swatch
                palette=${this._activePalette}
                .level=${level}
                size="md"
                semantic-role=${LEVEL_ROLES[level]}
              ></sc-swatch>
              <span class="strip-level">${level}</span>
              <span class="strip-semantic">${LEVEL_SEMANTIC_TOKENS[level].replace('--line-', '')}</span>
            </div>
          `
          )}
        </div>
      </sc-section>
    `;
  }

  private _renderWcagBadge(label: string, passes: boolean) {
    const cls = passes ? 'pass-aa' : 'fail';
    const text = passes ? 'Pass' : 'Fail';
    return html`<span class="contrast-pass ${cls}">${label} ${text}</span>`;
  }

  private _renderContrastDemo() {
    const ratio = this._contrastRatio;
    const hasRatio = ratio > 0;

    return html`
      <sc-section
        heading="Contrast Token"
        description="The contrast token defines readable text color on solid-9 backgrounds. WCAG 2.1 requires 4.5:1 for normal text (AA) and 7:1 for enhanced (AAA)."
        .count=${1}
      >
        <div
          class="contrast-box"
          style=${styleMap({
            'background-color': `var(--line-${this._activePalette}-9)`,
            color: `var(--line-${this._activePalette}-contrast)`
          })}
        >
          <span class="contrast-text">
            The quick brown fox jumps over the lazy dog
          </span>
          <div class="contrast-meta">
            <span class="contrast-ratio-badge">
              ${hasRatio ? `${ratio.toFixed(2)}:1` : 'Computing...'}
            </span>
            ${
              hasRatio
                ? html`
              ${this._renderWcagBadge('AAA', ratio >= 7)}
              ${this._renderWcagBadge('AA', ratio >= 4.5)}
              ${this._renderWcagBadge('AA Large', ratio >= 3)}
            `
                : nothing
            }
          </div>
          <div class="contrast-tokens">
            bg: --line-${this._activePalette}-9 (${this._contrastBgColor})
            &nbsp;&middot;&nbsp;
            fg: --line-${this._activePalette}-contrast (${this._contrastFgColor})
          </div>
        </div>
      </sc-section>
    `;
  }

  private _renderAllPalettesGrid() {
    return html`
      <sc-section
        heading="All Palettes"
        description="28 palettes at level 9. Click to switch the active palette."
        .count=${28}
      >
        <div class="palettes-grid">
          ${ALL_SCHEMAS.map(
            (name) => html`
            <div
              class=${classMap({
                'palette-card': true,
                active: this._activePalette === name
              })}
              @click=${() => this._setActivePalette(name)}
            >
              <div
                class="palette-dot"
                style=${styleMap({
                  'background-color': `var(--line-${name}-9)`
                })}
              ></div>
              <span class="palette-name">${name}</span>
            </div>
          `
          )}
        </div>
      </sc-section>
    `;
  }

  private _renderFullExplorer() {
    return html`
      <sc-section
        heading="Full Palette Explorer"
        description="Expand any palette to inspect all 12 levels. Click a swatch to copy its token."
        .count=${364}
      >
        ${ALL_SCHEMAS.map((name) => {
          const expanded = this._expandedPalettes.has(name);
          return html`
            <div class="explorer-palette">
              <button
                class=${classMap({
                  'explorer-header': true,
                  expanded
                })}
                @click=${() => this._toggleExplorer(name)}
              >
                <span class=${classMap({
                  'explorer-chevron': true,
                  expanded
                })}>&#9654;</span>
                <span class="explorer-name">${name}</span>
                <div class="explorer-preview">
                  ${PALETTE_LEVELS.map(
                    (level) => html`
                    <div
                      class="explorer-preview-dot"
                      style=${styleMap({
                        'background-color': `var(--line-${name}-${level})`
                      })}
                    ></div>
                  `
                  )}
                </div>
              </button>
              ${
                expanded
                  ? html`
                  <div class="explorer-body">
                    ${PALETTE_LEVELS.map(
                      (level) => html`
                      <sc-swatch
                        palette=${name}
                        .level=${level}
                        size="md"
                        label="${level}"
                        semantic-role=${LEVEL_ROLES[level]}
                      ></sc-swatch>
                    `
                    )}
                  </div>
                `
                  : nothing
              }
            </div>
          `;
        })}
      </sc-section>
    `;
  }

  private _renderColorMixDemo() {
    const pctB = this._mixPercent;
    const code = `/* color-mix in oklch */
.mixed {
  background: color-mix(
    in oklch,
    var(--line-${this._mixPaletteA}-9),
    var(--line-${this._mixPaletteB}-9) ${pctB}%
  );
}`;

    return html`
      <sc-section
        heading="Color-Mix Demo"
        description="Blend two palette scales using CSS color-mix(in oklch). Requires Chrome 111+, Safari 16.2+, Firefox 113+."
      >
        <div class="mix-controls">
          <div class="mix-selector">
            <span class="mix-selector-label">A</span>
            <button
              class="mix-cycle-btn"
              @click=${() => this._cycleMixPalette('a')}
            >
              <span
                class="mix-dot"
                style=${styleMap({
                  'background-color': `var(--line-${this._mixPaletteA}-9)`
                })}
              ></span>
              ${this._mixPaletteA}
            </button>
          </div>

          <div class="mix-range-group">
            <input
              class="mix-range"
              type="range"
              min="0"
              max="100"
              .value=${String(this._mixPercent)}
              @input=${this._handleMixRange}
            />
            <span class="mix-pct">${pctB}%</span>
          </div>

          <div class="mix-selector">
            <span class="mix-selector-label">B</span>
            <button
              class="mix-cycle-btn"
              @click=${() => this._cycleMixPalette('b')}
            >
              <span
                class="mix-dot"
                style=${styleMap({
                  'background-color': `var(--line-${this._mixPaletteB}-9)`
                })}
              ></span>
              ${this._mixPaletteB}
            </button>
          </div>
        </div>

        <div class="mix-strip">
          ${PALETTE_LEVELS.map(
            (level) => html`
            <div
              class="mix-swatch"
              style=${styleMap({
                background: `color-mix(in oklch, var(--line-${this._mixPaletteA}-${level}), var(--line-${this._mixPaletteB}-${level}) ${pctB}%)`
              })}
            >
              <span class="mix-swatch-label">${level}</span>
            </div>
          `
          )}
        </div>

        <div class="mix-code">
          <sc-code-block
            .code=${code}
            language="css"
          ></sc-code-block>
        </div>
      </sc-section>
    `;
  }

  override render() {
    return html`
      <h1 class="page-title">Color Palettes</h1>
      <p class="page-subtitle">
        <strong>28 palettes</strong> x <strong>12 levels</strong> + 28 contrast tokens = <strong>364</strong> color tokens.
        Click any swatch to copy its CSS custom property reference.
      </p>

      ${this._renderActivePaletteStrip()}
      ${this._renderContrastDemo()}
      ${this._renderAllPalettesGrid()}
      ${this._renderFullExplorer()}
      ${this._renderColorMixDemo()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-colors': ScPageColors;
  }
}
