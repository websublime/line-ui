import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '../components/sc-login-block.js';
import '../components/sc-product-card.js';

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

    /* ── Per-block explanatory note (renders above the block-wrapper) ── */
    /*
     * Note text is intentionally NEUTRAL (slate palette), so the explanation
     * itself does not change colour when the nav accent picker cycles —
     * matching the very pattern it describes for sc-login-block.
     */
    .block-note {
      font-size: var(--line-font-size-2, 0.875rem);
      line-height: var(--line-line-height-3, 1.6);
      color: light-dark(var(--line-slate-11), var(--line-slate-3));
      margin: 0;
      padding: 0 var(--line-size-2, 0.5rem);
      font-style: italic;
      max-width: 70ch;
    }

    .block-note strong {
      font-style: normal;
      font-weight: var(--line-font-weight-7, 700);
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    .block-note code {
      font-family: var(--line-font-mono, ui-monospace, SFMono-Regular, monospace);
      font-size: 0.9em;
      font-style: normal;
      padding: 0 0.25em;
      border-radius: 3px;
      background: light-dark(var(--line-slate-4), var(--line-slate-9));
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    /* Group note + block-wrapper into a single flow item */
    .block-group {
      display: flex;
      flex-direction: column;
      gap: var(--line-size-3, 1rem);
    }

    /* ── E-commerce product card grid (T3) ── */
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

    /*
     * Consumer styles for <sc-product-card> via ::part().
     * All design system tokens (--line-*) are applied HERE, not inside the component.
     */

    /* ── Slate-variant card ── */
    .product-card-slate::part(card) {
      background: light-dark(var(--line-slate-2), var(--line-slate-11));
      border-color: light-dark(var(--line-slate-6), var(--line-slate-7));
    }

    .product-card-slate::part(image),
    .product-card-slate::part(image-placeholder) {
      background: light-dark(var(--line-slate-3), var(--line-slate-10));
    }

    .product-card-slate::part(title) {
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    .product-card-slate::part(description) {
      color: light-dark(var(--line-slate-11), var(--line-slate-2));
    }

    .product-card-slate::part(chip) {
      background: light-dark(var(--line-slate-3), var(--line-slate-10));
      color: light-dark(var(--line-slate-11), var(--line-slate-2));
      border-color: light-dark(var(--line-slate-6), var(--line-slate-7));
    }

    /* ── Mauve-variant card ── */
    .product-card-mauve::part(card) {
      background: light-dark(var(--line-mauve-2), var(--line-mauve-11));
      border-color: light-dark(var(--line-mauve-6), var(--line-mauve-7));
    }

    .product-card-mauve::part(image),
    .product-card-mauve::part(image-placeholder) {
      background: light-dark(var(--line-mauve-3), var(--line-mauve-10));
    }

    .product-card-mauve::part(title) {
      color: light-dark(var(--line-mauve-12), var(--line-mauve-1));
    }

    .product-card-mauve::part(description) {
      color: light-dark(var(--line-mauve-11), var(--line-mauve-2));
    }

    .product-card-mauve::part(chip) {
      background: light-dark(var(--line-mauve-3), var(--line-mauve-10));
      color: light-dark(var(--line-mauve-11), var(--line-mauve-2));
      border-color: light-dark(var(--line-mauve-6), var(--line-mauve-7));
    }

    /* ── Shared accent styles (both variants) ── */
    sc-product-card::part(price) {
      color: var(--line-solid-background);
    }

    sc-product-card::part(rating) {
      color: var(--line-warning);
    }

    sc-product-card::part(chip-active) {
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
      border-color: var(--line-solid-background);
    }

    sc-product-card::part(dot-selected) {
      border-color: var(--line-high-contrast, #fff);
    }

    sc-product-card::part(button) {
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
    }

    sc-product-card::part(button):hover {
      background: var(--line-solid-hover);
    }

    /* ── Login / Sign-up block (T2) ── */
    /*
     * <sc-login-block class="login-block-slate"> is the consumer-applied
     * instance. The slate base zones are painted via slate-N palette tokens
     * (neutral, immune to the nav schema picker). The accent zones
     * (btn-submit, focus-ring, footer link) consume the inherited
     * --line-solid-* semantic tokens that cascade from body.line-schema-{accent}
     * — they change colour whenever the user picks a new accent.
     */

    /* Constrain the block to a reasonable card width inside the centered wrapper */
    .login-block-slate {
      width: 100%;
      max-width: 400px;
    }

    /* Slate neutral base — card surface, borders, typography, divider, SSO ghost */
    .login-block-slate::part(card) {
      background: light-dark(var(--line-slate-2), var(--line-slate-11));
      border-color: light-dark(var(--line-slate-6), var(--line-slate-7));
    }

    .login-block-slate::part(heading) {
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    .login-block-slate::part(subtitle) {
      color: light-dark(var(--line-slate-11), var(--line-slate-2));
    }

    .login-block-slate::part(label) {
      color: light-dark(var(--line-slate-11), var(--line-slate-2));
    }

    .login-block-slate::part(input) {
      background: light-dark(var(--line-slate-1), var(--line-slate-12));
      border-color: light-dark(var(--line-slate-7), var(--line-slate-6));
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    .login-block-slate::part(divider) {
      color: light-dark(var(--line-slate-11), var(--line-slate-2));
    }

    .login-block-slate::part(divider-text) {
      color: light-dark(var(--line-slate-11), var(--line-slate-3));
    }

    .login-block-slate::part(btn-sso) {
      background: transparent;
      border-color: light-dark(var(--line-slate-7), var(--line-slate-6));
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    .login-block-slate::part(btn-sso):hover {
      background: light-dark(var(--line-slate-3), var(--line-slate-10));
    }

    .login-block-slate::part(footer-link) {
      color: light-dark(var(--line-slate-11), var(--line-slate-3));
    }

    /* Shared accent zones — react to nav schema picker through body.line-schema-{accent} */
    sc-login-block::part(btn-submit) {
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
      border-color: var(--line-solid-background);
    }

    sc-login-block::part(btn-submit):hover {
      background: var(--line-solid-hover);
    }

    sc-login-block::part(input):focus-visible {
      outline: var(--input-focus-ring-width, 2px) solid var(--line-ui-border-hover);
      outline-offset: var(--input-focus-ring-offset, 1px);
    }

    sc-login-block::part(footer-link-anchor) {
      color: var(--line-solid-background);
    }

    /*
     * Red scoped error — applied only to the field carrying [data-error] on
     * the host. The class-scoped variant is needed because per-instance class
     * selectors (e.g. .login-block-slate::part(input)) have higher specificity
     * than the tag-only sc-login-block::part(input-error) rule and would
     * otherwise win the border-color cascade.
     */
    sc-login-block::part(input-error),
    .login-block-slate::part(input-error) {
      border-color: light-dark(var(--line-red-7), var(--line-red-6));
    }

    sc-login-block::part(field-error) {
      color: light-dark(var(--line-red-11), var(--line-red-3));
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
          <div class="block-group">
            <p class="block-note">
              <strong>Login / Sign-up — neutral base + accent separation.</strong>
              The card surface, heading, labels, inputs, SSO button and divider
              are painted with the <strong>slate</strong> palette so the visual
              base does <em>not</em> follow the nav accent picker. Only the
              accent-responsive zones — primary CTA background, input focus ring,
              and the "Create account" link — inherit
              <code>--line-solid-*</code> / <code>--line-ui-border-hover</code>
              from the accent schema applied on <code>document.body</code>.
              The errored field opts into the <strong>red</strong> palette
              independently of both.
            </p>
            <div class="block-wrapper">
              <sc-login-block
                class="login-block-slate"
                heading="Sign in"
                subtitle="Welcome back. Enter your credentials to continue."
                submit-label="Sign in"
                sso-label="GitHub"
                .errorField=${'password' as const}
                error-message="Incorrect password."
              ></sc-login-block>
            </div>
          </div>
          <div class="block-wrapper">
            <div class="product-grid">
              <!-- Card 1: Slate base -->
              <sc-product-card
                class="product-card-slate"
                heading="Classic Sneaker"
                description="Timeless design meets modern comfort. Crafted with premium materials for everyday wear."
                price="$89.00"
                rating="★★★★☆"
                rating-label="4 out of 5 stars"
                image-src="https://picsum.photos/400/300?random=1"
                image-alt="Classic Sneaker"
                button-label="Add to Cart"
                sizes="S,M,L,XL"
                active-size="1"
                .colors=${[
                  { color: 'var(--line-crimson-9)', label: 'Crimson' },
                  { color: 'var(--line-violet-9)', label: 'Violet' },
                  { color: 'var(--line-slate-9)', label: 'Slate', selected: true }
                ]}
              ></sc-product-card>

              <!-- Card 2: Mauve base -->
              <sc-product-card
                class="product-card-mauve"
                heading="Heritage Backpack"
                description="Water-resistant canvas with leather accents. Built to carry your essentials in style."
                price="$129.00"
                rating="★★★★★"
                rating-label="5 out of 5 stars"
                image-src="https://picsum.photos/400/300?random=2"
                image-alt="Heritage Backpack"
                button-label="Add to Cart"
                sizes="S,M,L,XL"
                active-size="0"
                .colors=${[
                  { color: 'var(--line-indigo-9)', label: 'Indigo' },
                  { color: 'var(--line-teal-9)', label: 'Teal', selected: true },
                  { color: 'var(--line-crimson-9)', label: 'Crimson' }
                ]}
              ></sc-product-card>
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
