import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

const PALETTES = [
  'amber',
  'blue',
  'bronze',
  'brown',
  'crimson',
  'cyan',
  'gold',
  'grass',
  'gray',
  'green',
  'indigo',
  'lime',
  'mauve',
  'mint',
  'olive',
  'orange',
  'pink',
  'plum',
  'purple',
  'red',
  'sage',
  'sand',
  'sky',
  'slate',
  'teal',
  'tomato',
  'violet',
  'yellow'
] as const;

type Palette = (typeof PALETTES)[number];

interface NavGroup {
  label: string;
  routes: { path: string; label: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Tokens',
    routes: [
      { path: '/tokens/colors', label: 'Colors' },
      { path: '/tokens/typography', label: 'Typography' },
      { path: '/tokens/spacing', label: 'Spacing' },
      { path: '/tokens/motion', label: 'Motion' },
      { path: '/tokens/surfaces', label: 'Surfaces' },
      { path: '/tokens/decorative', label: 'Decorative' }
    ]
  },
  {
    label: 'Semantic',
    routes: [{ path: '/semantic', label: 'Semantic' }]
  },
  {
    label: 'Elements',
    routes: [{ path: '/elements', label: 'Elements' }]
  },
  {
    label: 'Themes',
    routes: [{ path: '/themes', label: 'Themes' }]
  },
  {
    label: 'Tools',
    routes: [{ path: '/generator', label: 'Generator' }]
  }
];

@customElement('sc-nav')
export class ScNav extends LitElement {
  @state() private _darkMode = false;
  @state() private _schema: Palette = 'blue';
  @state() private _mobileOpen = false;
  @state() private _currentPath = '/';

  static override styles = css`
    :host {
      display: block;
    }

    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: var(--sc-sidebar-width, 260px);
      height: 100dvh;
      overflow-y: auto;
      background: var(--line-gray-2, #f5f5f5);
      border-inline-end: 1px solid var(--line-gray-6, #d4d4d4);
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      z-index: 100;
      transition: transform 0.25s ease, background-color 0.2s ease,
        border-color 0.2s ease;
    }

    :host-context(html.dark) .sidebar {
      background: var(--line-gray-2, #1c1c1c);
      border-inline-end-color: var(--line-gray-6, #3a3a3a);
    }

    .logo {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      text-decoration: none;
      color: inherit;
    }

    .logo .accent {
      color: var(--line-blue-9, #3b82f6);
    }

    .nav-group-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--line-gray-9, #a1a1a1);
      padding: 0 0.5rem;
      margin-block-end: 0.25rem;
    }

    .nav-group {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .nav-link {
      display: block;
      padding: 0.375rem 0.5rem;
      border-radius: 0.375rem;
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--line-gray-11, #6b6b6b);
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .nav-link:hover {
      background: var(--line-gray-4, #e5e5e5);
      color: var(--line-gray-12, #1a1a1a);
    }

    :host-context(html.dark) .nav-link:hover {
      background: var(--line-gray-4, #2c2c2c);
      color: var(--line-gray-12, #eeeeee);
    }

    .nav-link.active {
      background: var(--line-blue-4, #dbeafe);
      color: var(--line-blue-11, #1d4ed8);
      font-weight: 600;
    }

    :host-context(html.dark) .nav-link.active {
      background: var(--line-blue-4, #172554);
      color: var(--line-blue-11, #60a5fa);
    }

    .controls {
      margin-block-start: auto;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding-block-start: 1rem;
      border-block-start: 1px solid var(--line-gray-6, #d4d4d4);
    }

    :host-context(html.dark) .controls {
      border-block-start-color: var(--line-gray-6, #3a3a3a);
    }

    .control-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--line-gray-9, #a1a1a1);
    }

    .mode-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .toggle-btn {
      appearance: none;
      background: var(--line-gray-4, #e5e5e5);
      border: 1px solid var(--line-gray-7, #c4c4c4);
      border-radius: 0.375rem;
      padding: 0.375rem 0.75rem;
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--line-gray-12, #1a1a1a);
      transition: background-color 0.15s ease, border-color 0.15s ease,
        color 0.15s ease;
    }

    .toggle-btn:hover {
      background: var(--line-gray-5, #d9d9d9);
    }

    :host-context(html.dark) .toggle-btn {
      background: var(--line-gray-4, #2c2c2c);
      border-color: var(--line-gray-7, #484848);
      color: var(--line-gray-12, #eeeeee);
    }

    :host-context(html.dark) .toggle-btn:hover {
      background: var(--line-gray-5, #363636);
    }

    .schema-select {
      appearance: none;
      width: 100%;
      padding: 0.375rem 0.5rem;
      border-radius: 0.375rem;
      border: 1px solid var(--line-gray-7, #c4c4c4);
      background: var(--line-gray-3, #eeeeee);
      color: var(--line-gray-12, #1a1a1a);
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      text-transform: capitalize;
      transition: background-color 0.15s ease, border-color 0.15s ease,
        color 0.15s ease;
    }

    .schema-select:hover {
      border-color: var(--line-gray-8, #a3a3a3);
    }

    .schema-select:focus-visible {
      outline: 2px solid var(--line-blue-9, #3b82f6);
      outline-offset: 2px;
    }

    :host-context(html.dark) .schema-select {
      background: var(--line-gray-3, #232323);
      border-color: var(--line-gray-7, #484848);
      color: var(--line-gray-12, #eeeeee);
    }

    /* Hamburger (mobile only) */
    .hamburger {
      display: none;
      position: fixed;
      top: 0.75rem;
      left: 0.75rem;
      z-index: 200;
      appearance: none;
      background: var(--line-gray-3, #eeeeee);
      border: 1px solid var(--line-gray-7, #c4c4c4);
      border-radius: 0.375rem;
      padding: 0.5rem;
      cursor: pointer;
      color: var(--line-gray-12, #1a1a1a);
      font-size: 1.25rem;
      line-height: 1;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    :host-context(html.dark) .hamburger {
      background: var(--line-gray-3, #232323);
      border-color: var(--line-gray-7, #484848);
      color: var(--line-gray-12, #eeeeee);
    }

    .overlay {
      display: none;
    }

    @media (max-width: 768px) {
      .hamburger {
        display: block;
      }

      .sidebar {
        transform: translateX(-100%);
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgb(0 0 0 / 0.4);
        z-index: 50;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }

      .overlay.visible {
        opacity: 1;
        pointer-events: auto;
      }
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    this._loadPreferences();
    this._currentPath = window.location.pathname;
    window.addEventListener('popstate', this._onPopState);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this._onPopState);
  }

  private _loadPreferences(): void {
    const storedMode = localStorage.getItem('line-mode');
    this._darkMode = storedMode === 'dark';
    this._applyMode();

    const storedSchema = localStorage.getItem('line-schema');
    if (storedSchema && PALETTES.includes(storedSchema as Palette)) {
      this._schema = storedSchema as Palette;
    }
    this._applySchema();
  }

  private _applyMode(): void {
    const root = document.documentElement;
    if (this._darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }

  private _applySchema(): void {
    const body = document.body;
    // Remove any existing schema classes
    for (const cls of Array.from(body.classList)) {
      if (cls.startsWith('line-schema-')) {
        body.classList.remove(cls);
      }
    }
    body.classList.add(`line-schema-${this._schema}`);
  }

  private _onPopState = (): void => {
    this._currentPath = window.location.pathname;
  };

  private _handleNavClick(e: Event): void {
    // Update the current path for active highlighting
    // The Router in sc-app intercepts the click and handles navigation
    const anchor = (e.composedPath() as Element[]).find((el) => el.tagName === 'A');
    if (anchor) {
      this._currentPath = (anchor as HTMLAnchorElement).pathname;
      // Close mobile nav on route selection
      this._mobileOpen = false;
    }
  }

  private _toggleMode(): void {
    this._darkMode = !this._darkMode;
    localStorage.setItem('line-mode', this._darkMode ? 'dark' : 'light');
    this._applyMode();
    this.dispatchEvent(
      new CustomEvent('mode-change', {
        detail: { mode: this._darkMode ? 'dark' : 'light' },
        bubbles: true,
        composed: true
      })
    );
  }

  private _handleSchemaChange(e: Event): void {
    const select = e.target as HTMLSelectElement;
    this._schema = select.value as Palette;
    localStorage.setItem('line-schema', this._schema);
    this._applySchema();
    this.dispatchEvent(
      new CustomEvent('schema-change', {
        detail: { schema: this._schema },
        bubbles: true,
        composed: true
      })
    );
  }

  private _toggleMobileNav(): void {
    this._mobileOpen = !this._mobileOpen;
  }

  private _closeMobileNav(): void {
    this._mobileOpen = false;
  }

  private _renderNavGroups() {
    return NAV_GROUPS.map(
      (group) => html`
        <div class="nav-section">
          <div class="nav-group-label">${group.label}</div>
          <div class="nav-group" @click=${this._handleNavClick}>
            ${group.routes.map(
              (route) => html`
                <a
                  class=${classMap({
                    'nav-link': true,
                    active: this._currentPath === route.path
                  })}
                  href=${route.path}
                  >${route.label}</a
                >
              `
            )}
          </div>
        </div>
      `
    );
  }

  override render() {
    return html`
      <button
        class="hamburger"
        @click=${this._toggleMobileNav}
        aria-label=${this._mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded=${this._mobileOpen}
      >
        ${this._mobileOpen ? '\u2715' : '\u2630'}
      </button>

      <div
        class=${classMap({ overlay: true, visible: this._mobileOpen })}
        @click=${this._closeMobileNav}
      ></div>

      <nav class=${classMap({ sidebar: true, open: this._mobileOpen })}>
        <a class="logo" href="/"
          >line<span class="accent">://</span>ui</a
        >

        ${this._renderNavGroups()}

        <div class="controls">
          <div class="mode-toggle">
            <span class="control-label">Mode</span>
            <button
              class="toggle-btn"
              @click=${this._toggleMode}
              aria-label=${this._darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              ${this._darkMode ? 'Light' : 'Dark'}
            </button>
          </div>

          <div>
            <span class="control-label">Schema</span>
            <select
              class="schema-select"
              .value=${this._schema}
              @change=${this._handleSchemaChange}
              aria-label="Select color schema"
            >
              ${PALETTES.map(
                (palette) => html`
                  <option value=${palette}>${palette}</option>
                `
              )}
            </select>
          </div>
        </div>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-nav': ScNav;
  }
}
