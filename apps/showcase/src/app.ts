import { Router } from '@lit-labs/router';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

// Validate theme imports resolve correctly
import '@websublime/line-theme';
import '@websublime/line-theme/tokens';
import '@websublime/line-theme/colors/blue';
import '@websublime/line-theme/schemas/blue';
import '@websublime/line-theme/aliases';

// Page imports (lazy stubs for now)
import './pages/home.js';

@customElement('sc-app')
export class ScApp extends LitElement {
  private router = new Router(this, [
    { path: '/', render: () => html`<sc-page-home></sc-page-home>` },
    { path: '/tokens/colors', render: () => html`<sc-page-placeholder data-page="colors"></sc-page-placeholder>` },
    {
      path: '/tokens/typography',
      render: () => html`<sc-page-placeholder data-page="typography"></sc-page-placeholder>`
    },
    { path: '/tokens/spacing', render: () => html`<sc-page-placeholder data-page="spacing"></sc-page-placeholder>` },
    { path: '/tokens/motion', render: () => html`<sc-page-placeholder data-page="motion"></sc-page-placeholder>` },
    { path: '/tokens/surfaces', render: () => html`<sc-page-placeholder data-page="surfaces"></sc-page-placeholder>` },
    {
      path: '/tokens/decorative',
      render: () => html`<sc-page-placeholder data-page="decorative"></sc-page-placeholder>`
    },
    { path: '/semantic', render: () => html`<sc-page-placeholder data-page="semantic"></sc-page-placeholder>` },
    { path: '/elements', render: () => html`<sc-page-placeholder data-page="elements"></sc-page-placeholder>` },
    { path: '/themes', render: () => html`<sc-page-placeholder data-page="themes"></sc-page-placeholder>` },
    { path: '/generator', render: () => html`<sc-page-placeholder data-page="generator"></sc-page-placeholder>` }
  ]);

  static override styles = css`
    :host {
      display: block;
      min-height: 100dvh;
    }

    main {
      padding: 1rem;
    }
  `;

  override render() {
    return html`
      <main>${this.router.outlet()}</main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-app': ScApp;
  }
}
