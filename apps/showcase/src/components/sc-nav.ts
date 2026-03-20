import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { PanelKey } from '../app.js';
import { ALL_SCHEMAS } from '../constants.js';

const NAV_ITEMS: { key: PanelKey; label: string }[] = [
  { key: 'colors', label: 'Colors' },
  { key: 'typography', label: 'Typography' },
  { key: 'spacing', label: 'Spacing' },
  { key: 'motion', label: 'Motion' },
  { key: 'surfaces', label: 'Surfaces' },
  { key: 'decorative', label: 'Decorative' },
  { key: 'semantic', label: 'Semantic' },
  { key: 'elements', label: 'Elements' },
  { key: 'themes', label: 'Themes' },
  { key: 'generator', label: 'Generator' }
];

@customElement('sc-nav')
export class ScNav extends LitElement {
  @property({ type: String }) panel: PanelKey = 'colors';
  @property({ type: String }) schema = 'violet';
  @property({ type: Boolean, reflect: true }) light = false;

  @state() private _open = false;
  @state() private _pillLeft = 0;
  @state() private _pillWidth = 0;

  static override styles = css`
    :host {
      /* Layout-local custom properties for repeated magic numbers */
      --_topbar-h: 52px;
      --_max-w: 1400px;
      --_ctrl-pad-block: var(--line-size-1, 0.25rem);
      --_dot-size: 7px;

      display: block;
      /* Intentional raw rgba for translucent backdrop-filter effect;
         semantic tokens don't support alpha-channel blending. */
      background: rgba(8, 8, 8, 0.92);
      border-bottom: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      position: relative;
      z-index: var(--line-z-sticky, 100);
      transition:
        background var(--line-duration-moderate-1, 180ms) var(--line-ease-2),
        border-color var(--line-duration-moderate-1, 180ms) var(--line-ease-2);
    }

    :host([light]) {
      /* Intentional raw rgba — see :host comment above */
      background: rgba(250, 250, 250, 0.97);
      border-bottom-color: var(--line-ui-background, #e5e5e5);
    }

    /* ── Top bar ── */
    .topbar {
      height: var(--_topbar-h);
      display: flex;
      align-items: center;
      padding: 0 var(--line-size-5, 1.5rem);
      max-width: var(--_max-w);
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .logo {
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-8, 800);
      color: var(--line-high-contrast, #fff);
      letter-spacing: -0.03em;
      white-space: nowrap;
      flex-shrink: 0;
      cursor: pointer;
      transition: color var(--line-duration-moderate-1, 180ms) var(--line-ease-2);
    }
    :host([light]) .logo { color: var(--line-high-contrast, #1a1a1a); }
    .logo-ac { color: var(--line-solid-background, #c8ff00); }

    /* Desktop inline nav — hidden on mobile */
    .nav-inline {
      flex: 1;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      position: relative;
      margin-left: var(--line-size-6, 1.75rem);
    }
    .nav-inline::-webkit-scrollbar { display: none; }

    .nav-row {
      display: flex;
      align-items: center;
      position: relative;
      width: max-content;
      min-width: 100%;
    }

    .pill {
      position: absolute;
      bottom: 0;
      height: 2px;
      background: var(--line-solid-background, #c8ff00);
      border-radius: 2px 2px 0 0;
      transition:
        left  var(--line-duration-moderate-2, 260ms) var(--line-ease-4),
        width var(--line-duration-moderate-2, 260ms) var(--line-ease-4);
      pointer-events: none;
    }

    .nav-btn {
      padding: 0 var(--line-size-3, 1rem);
      height: var(--_topbar-h);
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      letter-spacing: 0.02em;
      white-space: nowrap;
      border: none;
      background: none;
      font-family: inherit;
      transition: color var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }
    .nav-btn:hover { color: var(--line-high-contrast, #ddd); }
    :host([light]) .nav-btn { color: var(--line-low-contrast, #666); }
    :host([light]) .nav-btn:hover { color: var(--line-high-contrast, #222); }
    .nav-btn.active { color: var(--line-solid-background, #c8ff00); }

    /* ── Right controls ── */
    .controls {
      display: flex;
      align-items: center;
      gap: var(--line-size-2, 0.5rem);
      flex-shrink: 0;
      margin-left: var(--line-size-3, 1rem);
    }

    .schema-chip {
      display: flex;
      align-items: center;
      gap: var(--line-size-1, 0.25rem);
      padding: var(--_ctrl-pad-block) var(--line-size-3, 1rem);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-active-background, #2e2e2e);
      border-radius: var(--line-radius-2, 4px);
      font-size: var(--line-font-size-0, 0.5rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      cursor: pointer;
      background: var(--line-subtle-background, #161616);
      font-family: inherit;
      white-space: nowrap;
      transition:
        border-color var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        color var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }
    .schema-chip:hover { border-color: var(--line-ui-border, #444); color: var(--line-high-contrast, #ddd); }
    :host([light]) .schema-chip { background: var(--line-ui-background, #eee); border-color: var(--line-subtle-border, #d4d4d4); color: var(--line-low-contrast, #666); }

    .schema-dot {
      width: var(--_dot-size); height: var(--_dot-size);
      border-radius: 50%;
      background: var(--line-solid-background, #c8ff00);
      flex-shrink: 0;
      transition: background var(--line-duration-moderate-1, 180ms) var(--line-ease-2);
    }

    .mode-btn {
      padding: var(--_ctrl-pad-block) var(--line-size-3, 1rem);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-active-background, #2e2e2e);
      border-radius: var(--line-radius-2, 4px);
      font-size: var(--line-font-size-0, 0.5rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      cursor: pointer;
      background: transparent;
      font-family: inherit;
      white-space: nowrap;
      transition:
        border-color var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        color var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }
    .mode-btn:hover { border-color: var(--line-ui-border, #444); color: var(--line-high-contrast, #ddd); }
    :host([light]) .mode-btn { border-color: var(--line-subtle-border, #d4d4d4); color: var(--line-low-contrast, #666); }

    /* ── Hamburger / menu button ── */
    .menu-btn {
      display: flex;
      align-items: center;
      gap: var(--_dot-size);
      padding: var(--_ctrl-pad-block) var(--line-size-3, 1rem);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-active-background, #2e2e2e);
      border-radius: var(--line-radius-2, 4px);
      font-size: var(--line-font-size-0, 0.5rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-low-contrast, #999);
      background: transparent;
      font-family: inherit;
      cursor: pointer;
      letter-spacing: 0.03em;
      transition:
        border-color var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        color var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }
    .menu-btn:hover { border-color: var(--line-ui-border, #444); color: var(--line-high-contrast, #ddd); }
    .menu-btn.open {
      border-color: var(--line-solid-background, #c8ff00);
      color: var(--line-solid-background, #c8ff00);
    }
    :host([light]) .menu-btn { border-color: var(--line-subtle-border, #d4d4d4); color: var(--line-low-contrast, #666); }
    :host([light]) .menu-btn.open {
      border-color: var(--line-solid-background, #1a1a1a);
      color: var(--line-solid-background, #1a1a1a);
    }

    /* Hamburger icon — 3-bar icon: 14x10px box, 1.5px bars spaced evenly.
       Bars rotate into an X on open: middle bar fades, top/bottom translateY
       by half the box height minus half the bar height (4.25px) and rotate ±45deg. */
    .hb { width: 14px; height: 10px; display: flex; flex-direction: column; justify-content: space-between; flex-shrink: 0; }
    .hb span {
      display: block; height: 1.5px; background: currentColor; border-radius: 1px;
      transition:
        transform var(--line-duration-moderate-1, 180ms) var(--line-ease-2),
        opacity   var(--line-duration-moderate-1, 180ms) var(--line-ease-2);
    }
    .menu-btn.open .hb span:nth-child(1) { transform: translateY(4.25px) rotate(45deg); }
    .menu-btn.open .hb span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .menu-btn.open .hb span:nth-child(3) { transform: translateY(-4.25px) rotate(-45deg); }

    /* ── Dropdown ── */
    .dropdown {
      overflow: hidden;
      max-height: 0;
      transition: max-height var(--line-duration-moderate-2, 260ms) var(--line-ease-4);
      border-bottom: 0px solid transparent;
    }
    .dropdown.open {
      max-height: 360px;
      border-bottom: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
    }
    :host([light]) .dropdown.open { border-bottom-color: var(--line-ui-background, #e5e5e5); }

    .dropdown-inner {
      padding: var(--line-size-5, 1.5rem) var(--line-size-5, 1.5rem) var(--line-size-6, 1.75rem);
      max-width: var(--_max-w);
      margin: 0 auto;
    }

    .dd-label {
      font-size: var(--line-font-size-0, 0.5rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-low-contrast, #999);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: var(--line-size-3, 1rem);
    }
    :host([light]) .dd-label { color: var(--line-low-contrast, #666); }

    .dd-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--line-size-2, 0.5rem);
    }

    .dd-item {
      padding: var(--line-size-3, 1rem) var(--line-size-3, 1rem);
      border-radius: var(--line-radius-2, 4px);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #1e1e1e);
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      cursor: pointer;
      background: transparent;
      font-family: inherit;
      text-align: left;
      letter-spacing: 0.01em;
      transition:
        background var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        border-color var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        color var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }
    .dd-item:hover {
      background: var(--line-subtle-background, #161616);
      border-color: var(--line-ui-active-background, #333);
      color: var(--line-high-contrast, #ddd);
    }
    :host([light]) .dd-item {
      border-color: var(--line-ui-active-background, #e5e5e5);
      color: var(--line-low-contrast, #666);
    }
    :host([light]) .dd-item:hover {
      background: var(--line-ui-background, #eee);
      border-color: var(--line-ui-border, #bbb);
      color: var(--line-high-contrast, #222);
    }
    .dd-item.active {
      border-color: var(--line-solid-background, #c8ff00);
      color: var(--line-solid-background, #c8ff00);
      background: var(--line-subtle-background, #0d0d0d);
    }
    :host([light]) .dd-item.active {
      background: var(--line-ui-background, #f0f0f0);
    }

    .dd-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--line-size-4, 1.25rem);
      padding-top: var(--line-size-4, 1.25rem);
      border-top: var(--line-border-size-1, 1px) solid var(--line-ui-background, #1a1a1a);
    }
    :host([light]) .dd-footer { border-top-color: var(--line-ui-active-background, #e8e8e8); }

    .dd-cur {
      font-size: var(--line-font-size-0, 0.5rem);
      color: var(--line-low-contrast, #999);
    }
    .dd-cur strong { color: var(--line-high-contrast, #ddd); font-weight: var(--line-font-weight-6, 600); }
    :host([light]) .dd-cur { color: var(--line-low-contrast, #666); }
    :host([light]) .dd-cur strong { color: var(--line-high-contrast, #222); }

    /* ── Responsive ── */
    /* Breakpoint matches --line-size-md (768px) from the token system.
       CSS custom properties cannot be used in media queries;
       PostCSS custom media is not available in Lit tagged template styles. */
    /* Desktop: inline nav visible alongside menu button */
    @media (min-width: 769px) {
      .nav-inline { display: block; }
    }

    /* Mobile: inline nav hidden, menu button always visible */
    @media (max-width: 768px) {
      .nav-inline { display: none; }
      .logo       { flex: 1; }
    }
  `;

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('panel') || changed.has('schema')) {
      requestAnimationFrame(() => this._updatePill());
    }
  }

  override firstUpdated(): void {
    requestAnimationFrame(() => this._updatePill());
    // Close dropdown on outside click
    document.addEventListener('click', this._handleOutsideClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
  }

  private _handleOutsideClick = (e: MouseEvent): void => {
    if (this._open && !this.shadowRoot?.contains(e.composedPath()[0] as Node)) {
      this._open = false;
    }
  };

  private _updatePill(): void {
    const row = this.shadowRoot?.querySelector('.nav-row') as HTMLElement | null;
    const active = this.shadowRoot?.querySelector('.nav-btn.active') as HTMLElement | null;
    const scroll = this.shadowRoot?.querySelector('.nav-inline') as HTMLElement | null;
    if (!(row && active)) return;
    const rb = row.getBoundingClientRect();
    const ab = active.getBoundingClientRect();
    const scrollLeft = scroll?.scrollLeft ?? 0;
    this._pillLeft = ab.left - rb.left + scrollLeft;
    this._pillWidth = ab.width;
    active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  private _navigate(key: PanelKey): void {
    this._open = false;
    this.dispatchEvent(
      new CustomEvent('sc-navigate', {
        detail: { panel: key },
        bubbles: true,
        composed: true
      })
    );
  }

  private _cycleSchema(): void {
    const i = (ALL_SCHEMAS as readonly string[]).indexOf(this.schema);
    const next = ALL_SCHEMAS[(i + 1) % ALL_SCHEMAS.length];
    this.dispatchEvent(
      new CustomEvent('sc-schema-change', {
        detail: { schema: next },
        bubbles: true,
        composed: true
      })
    );
  }

  private _toggleMode(): void {
    this.dispatchEvent(
      new CustomEvent('sc-mode-change', {
        detail: { light: !this.light },
        bubbles: true,
        composed: true
      })
    );
  }

  private _toggleMenu(): void {
    this._open = !this._open;
  }

  override render() {
    const currentLabel = NAV_ITEMS.find((n) => n.key === this.panel)?.label ?? '';

    return html`
      <div class="topbar">
        <div class="logo" @click=${() => this._navigate('home' as PanelKey)}>line<span class="logo-ac">://</span>ui</div>

        <!-- Desktop: inline pill nav -->
        <div class="nav-inline">
          <div class="nav-row">
            <div class="pill" style="left:${this._pillLeft}px;width:${this._pillWidth}px"></div>
            ${NAV_ITEMS.map(
              ({ key, label }) => html`
              <button
                class=${classMap({ 'nav-btn': true, active: this.panel === key })}
                @click=${() => this._navigate(key)}
              >${label}</button>
            `
            )}
          </div>
        </div>

        <div class="controls">
          <div class="schema-chip" @click=${this._cycleSchema}>
            <div class="schema-dot"></div>
            <span>${this.schema}</span>
          </div>
          <button class="mode-btn" @click=${this._toggleMode}>
            ${this.light ? 'Dark' : 'Light'}
          </button>
          <!-- Mobile: hamburger -->
          <button
            class=${classMap({ 'menu-btn': true, open: this._open })}
            @click=${this._toggleMenu}
            aria-expanded=${this._open}
            aria-label=${this._open ? 'Close menu' : 'Open menu'}
          >
            <div class="hb">
              <span></span><span></span><span></span>
            </div>
            Menu
          </button>
        </div>
      </div>

      <!-- Mobile: dropdown -->
      <div class=${classMap({ dropdown: true, open: this._open })}>
        <div class="dropdown-inner">
          <div class="dd-label">Navigate</div>
          <div class="dd-grid">
            ${NAV_ITEMS.map(
              ({ key, label }) => html`
              <button
                class=${classMap({ 'dd-item': true, active: this.panel === key })}
                @click=${() => this._navigate(key)}
              >${label}</button>
            `
            )}
          </div>
          <div class="dd-footer">
            <span class="dd-cur">Current: <strong>${currentLabel}</strong></span>
            <span class="dd-cur">tap to navigate</span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-nav': ScNav;
  }
}
