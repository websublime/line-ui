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

    /* ── E-commerce product card block (T3) ── */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--line-size-5, 1.5rem);
      width: 100%;
    }

    @media (max-width: 640px) {
      .product-grid {
        grid-template-columns: 1fr;
      }
    }

    .product-card {
      border-radius: var(--line-radius-3, 8px);
      overflow: hidden;
      border: var(--line-border-size-1, 1px) solid;
      display: flex;
      flex-direction: column;
    }

    .product-card--slate {
      background: light-dark(var(--line-slate-2), var(--line-slate-11));
      border-color: light-dark(var(--line-slate-6), var(--line-slate-7));
    }

    .product-card--mauve {
      background: light-dark(var(--line-mauve-2), var(--line-mauve-11));
      border-color: light-dark(var(--line-mauve-6), var(--line-mauve-7));
    }

    .product-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
      background: light-dark(var(--line-slate-3), var(--line-slate-10));
    }

    .product-image-placeholder {
      width: 100%;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: light-dark(var(--line-slate-3), var(--line-slate-10));
    }

    .product-image-placeholder svg {
      width: 64px;
      height: 64px;
      opacity: 0.4;
    }

    .card-body {
      padding: var(--line-size-4, 1.25rem);
      display: flex;
      flex-direction: column;
      gap: var(--line-size-3, 1rem);
      flex: 1;
    }

    .product-title {
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-7, 700);
      margin: 0;
      letter-spacing: -0.01em;
    }

    .product-card--slate .product-title {
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    .product-card--mauve .product-title {
      color: light-dark(var(--line-mauve-12), var(--line-mauve-1));
    }

    .product-desc {
      font-size: var(--line-font-size-1, 0.875rem);
      line-height: var(--line-line-height-3, 1.6);
      margin: 0;
    }

    .product-card--slate .product-desc {
      color: light-dark(var(--line-slate-11), var(--line-slate-2));
    }

    .product-card--mauve .product-desc {
      color: light-dark(var(--line-mauve-11), var(--line-mauve-2));
    }

    .price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--line-size-2, 0.5rem);
    }

    .price {
      font-size: var(--line-font-size-3, 1.25rem);
      font-weight: var(--line-font-weight-8, 800);
      color: var(--line-solid-background);
    }

    .rating {
      font-size: var(--line-font-size-1, 0.875rem);
      color: var(--line-warning);
      letter-spacing: 0.05em;
    }

    .size-chips {
      display: flex;
      gap: var(--line-size-2, 0.5rem);
      flex-wrap: wrap;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 32px;
      padding: 0 var(--line-size-2, 0.5rem);
      border-radius: var(--line-radius-2, 4px);
      font-size: var(--line-font-size-0, 0.75rem);
      font-weight: var(--line-font-weight-6, 600);
      cursor: pointer;
      border: var(--line-border-size-1, 1px) solid;
      transition: all 150ms ease-in-out;
    }

    .product-card--slate .chip {
      background: light-dark(var(--line-slate-3), var(--line-slate-10));
      color: light-dark(var(--line-slate-11), var(--line-slate-2));
      border-color: light-dark(var(--line-slate-6), var(--line-slate-7));
    }

    .product-card--mauve .chip {
      background: light-dark(var(--line-mauve-3), var(--line-mauve-10));
      color: light-dark(var(--line-mauve-11), var(--line-mauve-2));
      border-color: light-dark(var(--line-mauve-6), var(--line-mauve-7));
    }

    .chip.active {
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
      border-color: var(--line-solid-background);
    }

    .color-dots {
      display: flex;
      gap: var(--line-size-2, 0.5rem);
      align-items: center;
    }

    .dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 150ms ease-in-out;
    }

    .dot.selected {
      border-color: var(--line-high-contrast, #fff);
    }

    .dot--crimson {
      background: var(--line-crimson-9);
    }

    .dot--violet {
      background: var(--line-violet-9);
    }

    .dot--slate {
      background: var(--line-slate-9);
    }

    .dot--indigo {
      background: var(--line-indigo-9);
    }

    .dot--teal {
      background: var(--line-teal-9);
    }

    .add-to-cart {
      width: 100%;
      padding: var(--line-size-3, 1rem);
      border: none;
      border-radius: var(--line-radius-2, 4px);
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
      font-size: var(--line-font-size-1, 0.875rem);
      font-weight: var(--line-font-weight-7, 700);
      cursor: pointer;
      transition: background 150ms ease-in-out;
      margin-top: auto;
    }

    .add-to-cart:hover {
      background: var(--line-solid-hover);
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

  private _handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    const placeholder = document.createElement('div');
    placeholder.className = 'product-image-placeholder';
    placeholder.innerHTML = `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="12" width="48" height="36" rx="4" stroke="currentColor" stroke-width="2"/>
        <circle cx="22" cy="26" r="5" stroke="currentColor" stroke-width="2"/>
        <path d="M8 40 L24 28 L36 38 L44 32 L56 42" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>
    `;
    img.replaceWith(placeholder);
  }

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
            <div class="product-grid">
              <!-- Card 1: Slate base -->
              <div class="product-card product-card--slate" part="product-card-1">
                <img
                  class="product-image"
                  src="https://picsum.photos/400/300?random=1"
                  alt="Classic Sneaker"
                  loading="lazy"
                  @error=${this._handleImageError}
                />
                <div class="card-body">
                  <h3 class="product-title">Classic Sneaker</h3>
                  <p class="product-desc">
                    Timeless design meets modern comfort. Crafted with premium
                    materials for everyday wear.
                  </p>
                  <div class="price-row">
                    <span class="price">$89.00</span>
                    <span class="rating" aria-label="4 out of 5 stars">★★★★☆</span>
                  </div>
                  <div class="size-chips">
                    <span class="chip">S</span>
                    <span class="chip active">M</span>
                    <span class="chip">L</span>
                    <span class="chip">XL</span>
                  </div>
                  <div class="color-dots">
                    <span class="dot dot--crimson" title="Crimson"></span>
                    <span class="dot dot--violet" title="Violet"></span>
                    <span class="dot dot--slate selected" title="Slate"></span>
                  </div>
                  <button class="add-to-cart" type="button">Add to Cart</button>
                </div>
              </div>

              <!-- Card 2: Mauve base -->
              <div class="product-card product-card--mauve" part="product-card-2">
                <img
                  class="product-image"
                  src="https://picsum.photos/400/300?random=2"
                  alt="Heritage Backpack"
                  loading="lazy"
                  @error=${this._handleImageError}
                />
                <div class="card-body">
                  <h3 class="product-title">Heritage Backpack</h3>
                  <p class="product-desc">
                    Water-resistant canvas with leather accents. Built to carry
                    your essentials in style.
                  </p>
                  <div class="price-row">
                    <span class="price">$129.00</span>
                    <span class="rating" aria-label="5 out of 5 stars">★★★★★</span>
                  </div>
                  <div class="size-chips">
                    <span class="chip active">S</span>
                    <span class="chip">M</span>
                    <span class="chip">L</span>
                    <span class="chip">XL</span>
                  </div>
                  <div class="color-dots">
                    <span class="dot dot--indigo" title="Indigo"></span>
                    <span class="dot dot--teal selected" title="Teal"></span>
                    <span class="dot dot--crimson" title="Crimson"></span>
                  </div>
                  <button class="add-to-cart" type="button">Add to Cart</button>
                </div>
              </div>
            </div>
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
