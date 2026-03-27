import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type { PlaygroundBlockConfig } from './playground-config.js';

@customElement('sc-page-playground')
export class ScPagePlayground extends LitElement {
  @property({ type: Boolean, reflect: true }) light = false;
  @property({ type: String }) schema = 'violet';

  static override styles = css`
    :host {
      --_nav-h: 52px;
      --_sidebar-w: 260px;

      display: block;
    }

    /* ── Two-column layout ── */
    .layout {
      display: flex;
      gap: var(--line-size-7, 2rem);
      max-width: 1400px;
      margin: 0 auto;
    }

    /* ── Sidebar ── */
    .sidebar {
      position: sticky;
      top: var(--_nav-h);
      width: var(--_sidebar-w);
      min-width: var(--_sidebar-w);
      height: calc(100dvh - var(--_nav-h));
      overflow-y: auto;
      box-sizing: border-box;
      padding: var(--line-size-6, 1.75rem) 0;
      scrollbar-width: thin;
    }

    .sidebar-title {
      font-size: var(--line-font-size-4, 1.5rem);
      font-weight: var(--line-font-weight-8, 800);
      color: var(--line-high-contrast, #fff);
      /* Tighten tracking for large display headings */
      letter-spacing: -0.02em;
      margin: 0 0 var(--line-size-4, 1.25rem);
    }
    :host([light]) .sidebar-title {
      color: var(--line-high-contrast, #1a1a1a);
    }

    .sidebar-description {
      font-size: var(--line-font-size-1, 0.875rem);
      line-height: var(--line-line-height-3, 1.6);
      color: var(--line-low-contrast, #999);
      margin: 0 0 var(--line-size-5, 1.5rem);
    }
    :host([light]) .sidebar-description {
      color: var(--line-low-contrast, #666);
    }

    .sidebar-accent {
      display: flex;
      align-items: center;
      gap: var(--line-size-2, 0.5rem);
      padding: var(--line-size-3, 1rem);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-active-background, #2e2e2e);
      border-radius: var(--line-radius-2, 4px);
      background: var(--line-subtle-background, #161616);
      margin-bottom: var(--line-size-4, 1.25rem);
    }
    :host([light]) .sidebar-accent {
      background: var(--line-ui-background, #f5f5f5);
      border-color: var(--line-subtle-border, #d4d4d4);
    }

    .accent-dot {
      width: var(--line-size-2, 10px);
      height: var(--line-size-2, 10px);
      border-radius: 50%;
      background: var(--line-solid-background, #c8ff00);
      flex-shrink: 0;
    }

    .accent-label {
      font-size: var(--line-font-size-0, 0.75rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
    }
    :host([light]) .accent-label {
      color: var(--line-low-contrast, #666);
    }

    .accent-name {
      font-size: var(--line-font-size-1, 0.875rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-high-contrast, #fff);
      text-transform: capitalize;
    }
    :host([light]) .accent-name {
      color: var(--line-high-contrast, #1a1a1a);
    }

    .sidebar-note {
      font-size: var(--line-font-size-0, 0.75rem);
      color: var(--line-low-contrast, #777);
      line-height: var(--line-line-height-3, 1.6);
      font-style: italic;
    }
    :host([light]) .sidebar-note {
      color: var(--line-low-contrast, #888);
    }

    .sidebar-block-list {
      margin-top: var(--line-size-5, 1.5rem);
      padding-top: var(--line-size-4, 1.25rem);
      border-top: var(--line-border-size-1, 1px) solid var(--line-ui-active-background, #2e2e2e);
    }
    :host([light]) .sidebar-block-list {
      border-top-color: var(--line-subtle-border, #d4d4d4);
    }

    .sidebar-block-list-title {
      font-size: var(--line-font-size-0, 0.75rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-low-contrast, #999);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0 0 var(--line-size-3, 1rem);
    }
    :host([light]) .sidebar-block-list-title {
      color: var(--line-low-contrast, #666);
    }

    .sidebar-block-item {
      font-size: var(--line-font-size-1, 0.875rem);
      color: var(--line-low-contrast, #777);
      padding: var(--line-size-1, 0.25rem) 0;
    }
    :host([light]) .sidebar-block-item {
      color: var(--line-low-contrast, #555);
    }

    .sidebar-block-item::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--line-ui-active-background, #333);
      margin-right: var(--line-size-2, 0.5rem);
      vertical-align: middle;
    }
    :host([light]) .sidebar-block-item::before {
      background: var(--line-ui-active-background, #ccc);
    }

    /* ── Content column ── */
    .content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--line-size-7, 2rem);
      padding: var(--line-size-6, 1.75rem) 0;
    }

    .block-wrapper {
      border: var(--line-border-size-1, 1px) solid var(--line-ui-active-background, #2e2e2e);
      border-radius: var(--line-radius-3, 8px);
      padding: var(--line-size-6, 1.75rem);
      background: var(--line-subtle-background, #111);
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :host([light]) .block-wrapper {
      background: var(--line-ui-background, #f5f5f5);
      border-color: var(--line-subtle-border, #d4d4d4);
    }

    .block-placeholder {
      font-size: var(--line-font-size-1, 0.875rem);
      color: var(--line-low-contrast, #666);
      font-style: italic;
    }

    /* ── Mobile: top bar instead of sidebar ── */
    .mobile-bar {
      display: none;
      align-items: center;
      gap: var(--line-size-2, 0.5rem);
      padding: var(--line-size-3, 1rem) 0;
      margin-bottom: var(--line-size-4, 1.25rem);
      border-bottom: var(--line-border-size-1, 1px) solid var(--line-ui-active-background, #2e2e2e);
    }
    :host([light]) .mobile-bar {
      border-bottom-color: var(--line-subtle-border, #d4d4d4);
    }

    .mobile-accent-dot {
      width: var(--line-size-1, 8px);
      height: var(--line-size-1, 8px);
      border-radius: 50%;
      background: var(--line-solid-background, #c8ff00);
      flex-shrink: 0;
    }

    .mobile-accent-text {
      font-size: var(--line-font-size-0, 0.75rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
    }
    :host([light]) .mobile-accent-text {
      color: var(--line-low-contrast, #666);
    }

    .mobile-accent-name {
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-high-contrast, #fff);
      text-transform: capitalize;
    }
    :host([light]) .mobile-accent-name {
      color: var(--line-high-contrast, #1a1a1a);
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }

      .mobile-bar {
        display: flex;
      }

      .layout {
        flex-direction: column;
      }

      .block-wrapper {
        padding: var(--line-size-4, 1.25rem);
      }
    }
  `;

  override render() {
    return html`
      <!-- Mobile: collapsed accent bar -->
      <div class="mobile-bar">
        <div class="mobile-accent-dot"></div>
        <span class="mobile-accent-text">
          Accent: <span class="mobile-accent-name">${this.schema}</span>
        </span>
      </div>

      <div class="layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <h2 class="sidebar-title">Playground</h2>
          <p class="sidebar-description">
            Multi-schema composition blocks demonstrating how
            <code>line://ui</code> components adapt to different color schemas
            within the same page.
          </p>

          <div class="sidebar-accent">
            <div class="accent-dot"></div>
            <div>
              <div class="accent-label">Active accent</div>
              <div class="accent-name">${this.schema}</div>
            </div>
          </div>

          <p class="sidebar-note">
            The accent color reflects the schema selected in the navigation bar
            picker. Each composition block below may use its own base schema
            independently.
          </p>

          <div class="sidebar-block-list">
            <div class="sidebar-block-list-title">Composition blocks</div>
            <div class="sidebar-block-item">Login / Sign-up</div>
            <div class="sidebar-block-item">E-commerce product card</div>
            <div class="sidebar-block-item">Music player / media</div>
            <div class="sidebar-block-item">Dashboard / notifications</div>
            <div class="sidebar-block-item">Pricing / comparison</div>
          </div>
        </aside>

        <!-- Scrollable content column -->
        <div class="content">
          <div class="block-wrapper">
            <span class="block-placeholder">Login / Sign-up block (T2)</span>
          </div>
          <div class="block-wrapper">
            <span class="block-placeholder">E-commerce product card block (T3)</span>
          </div>
          <div class="block-wrapper">
            <span class="block-placeholder">Music player / media block (T4)</span>
          </div>
          <div class="block-wrapper">
            <span class="block-placeholder">Dashboard / notifications block (T5)</span>
          </div>
          <div class="block-wrapper">
            <span class="block-placeholder">Pricing / comparison table block (T6)</span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-playground': ScPagePlayground;
  }
}
