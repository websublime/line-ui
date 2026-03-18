import { Router } from '@lit-labs/router';
import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

// Validate theme imports resolve correctly
import '@websublime/line-theme';
import '@websublime/line-theme/tokens';
import '@websublime/line-theme/colors/blue';
import '@websublime/line-theme/schemas/blue';
import '@websublime/line-theme/aliases';
import '@websublime/line-theme/normalize';

// Navigation component
import './components/sc-nav.js';

// Page imports
import './pages/home.js';
import './pages/colors.js';
import './pages/typography.js';
import './pages/spacing.js';
import './pages/motion.js';
import './pages/surfaces.js';
import './pages/decorative.js';
import './pages/semantic.js';
import './pages/elements.js';
import './pages/themes.js';
import './pages/generator.js';

@customElement('sc-app')
export class ScApp extends LitElement {
  @state() private _darkMode = false;

  private router = new Router(this, [
    { path: '/', render: () => html`<sc-page-home></sc-page-home>` },
    {
      path: '/tokens/colors',
      render: () => html`<sc-page-colors></sc-page-colors>`
    },
    {
      path: '/tokens/typography',
      render: () => html`<sc-page-typography></sc-page-typography>`
    },
    {
      path: '/tokens/spacing',
      render: () => html`<sc-page-spacing></sc-page-spacing>`
    },
    {
      path: '/tokens/motion',
      render: () => html`<sc-page-motion></sc-page-motion>`
    },
    {
      path: '/tokens/surfaces',
      render: () => html`<sc-page-surfaces></sc-page-surfaces>`
    },
    {
      path: '/tokens/decorative',
      render: () => html`<sc-page-decorative></sc-page-decorative>`
    },
    {
      path: '/semantic',
      render: () => html`<sc-page-semantic></sc-page-semantic>`
    },
    {
      path: '/elements',
      render: () => html`<sc-page-elements></sc-page-elements>`
    },
    {
      path: '/themes',
      render: () => html`<sc-page-themes></sc-page-themes>`
    },
    {
      path: '/generator',
      render: () => html`<sc-page-generator></sc-page-generator>`
    }
  ]);

  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: var(--sc-sidebar-width, 260px) 1fr;
      min-height: 100dvh;
    }

    main {
      padding: var(--line-size-7);
      overflow-y: auto;
      min-height: 100dvh;
    }

    /* Breakpoint: --line-size-md (768px) */
    @media (max-width: 768px) {
      :host {
        grid-template-columns: 1fr;
      }

      main {
        padding: var(--line-size-8) var(--line-size-3) var(--line-size-3);
      }
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    const storedMode = localStorage.getItem('line-mode');
    this._darkMode = storedMode === 'dark';
  }

  private _handleModeChange(e: Event): void {
    const detail = (e as CustomEvent).detail;
    this._darkMode = detail.mode === 'dark';
  }

  override render() {
    return html`
      <sc-nav
        ?dark=${this._darkMode}
        @mode-change=${this._handleModeChange}
      ></sc-nav>
      <main>${this.router.outlet()}</main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-app': ScApp;
  }
}
