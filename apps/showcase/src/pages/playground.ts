import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '../components/sc-login-block.js';
import '../components/sc-music-player.js';
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

    /* ── Music player block (T4) ── */
    /*
     * <sc-music-player class="music-player-dark"> is the consumer-applied
     * instance. Per spec §16 D5, the player is forced to a dark surface in
     * BOTH global light and dark modes by setting --surface-color-scheme: dark
     * on the host. The component declares
     *   color-scheme: var(--surface-color-scheme, light dark)
     * inside :host, so flipping that custom property flips the local
     * color-scheme inside the player's shadow root, which in turn makes the
     * light-dark() expressions in the rules below resolve to the DARK branch
     * regardless of <html>'s active color-scheme.
     *
     * Neutral surface zones (card, typography, transport buttons, slider
     * tracks, playlist rows) consume gray-N palette tokens — immune to the
     * nav schema picker. Accent zones (progress-fill, ctrl-play,
     * playlist-item-active) consume --line-solid-* / --line-solid-text — they
     * recolor when the user picks a new accent, matching the §14.2 'player'
     * block entry.
     */

    .music-player-dark {
      width: 100%;
      max-width: 480px;
      /* §16 D5 — force a dark surface inside the player subtree. */
      --surface-color-scheme: dark;
      /*
       * Album art gradient is supplied as a full background string by the
       * consumer. var(--line-solid-background) resolves AT USE TIME inside
       * the player's shadow root, so the gradient stays accent-reactive
       * when the nav schema picker changes.
       */
      --album-art-gradient: linear-gradient(
        135deg,
        var(--line-solid-background),
        var(--line-gray-11)
      );
    }

    /* Card surface, borders */
    sc-music-player::part(card) {
      background: light-dark(var(--line-gray-2), var(--line-gray-12));
      border: 1px solid light-dark(var(--line-gray-4), var(--line-gray-11));
      color: light-dark(var(--line-gray-12), var(--line-gray-1));
    }

    /* Typography */
    sc-music-player::part(track-title) {
      color: light-dark(var(--line-gray-12), var(--line-gray-1));
    }

    sc-music-player::part(artist),
    sc-music-player::part(progress-time) {
      color: light-dark(var(--line-gray-11), var(--line-gray-3));
    }

    /* Album art SVG glyph color (inside the gradient) */
    sc-music-player::part(album-art) {
      color: light-dark(var(--line-gray-1), var(--line-gray-1));
    }

    /* Progress / volume tracks (neutral background) */
    sc-music-player::part(progress-track),
    sc-music-player::part(volume-track) {
      background: light-dark(var(--line-gray-4), var(--line-gray-10));
    }

    /* Volume fill — neutral by default; the spec lists ONLY progress-fill,
       ctrl-play and playlist-item-active as accent-reactive for the player
       block, so the volume fill stays neutral high-contrast. */
    sc-music-player::part(volume-fill) {
      background: light-dark(var(--line-gray-11), var(--line-gray-3));
    }

    sc-music-player::part(volume-icon) {
      color: light-dark(var(--line-gray-11), var(--line-gray-3));
    }

    /* Transport buttons (non-play) — outlined, hover lifts to accent */
    sc-music-player::part(ctrl-btn) {
      background: transparent;
      border-color: light-dark(var(--line-gray-7), var(--line-gray-9));
      color: light-dark(var(--line-gray-12), var(--line-gray-1));
    }

    sc-music-player::part(ctrl-btn):hover {
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
      border-color: var(--line-solid-background);
    }

    /* Playlist rows */
    sc-music-player::part(playlist-item) {
      background: light-dark(var(--line-gray-2), var(--line-gray-12));
      color: light-dark(var(--line-gray-12), var(--line-gray-1));
      border-block-end: 1px solid light-dark(var(--line-gray-4), var(--line-gray-11));
    }

    /* Alternating row tint via :nth-child on the part */
    sc-music-player::part(playlist-item):nth-child(even) {
      background: light-dark(var(--line-gray-3), var(--line-gray-11));
    }

    /* ── Accent-reactive zones (§14.2 player entry) ──
     * progress-fill, ctrl-play, playlist-item-active inherit
     * --line-solid-background / --line-solid-text from body.line-schema-{accent}
     * and recolor whenever the nav picker cycles. */
    sc-music-player::part(progress-fill) {
      background: var(--line-solid-background);
    }

    sc-music-player::part(ctrl-play) {
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
      border-color: var(--line-solid-background);
    }

    sc-music-player::part(ctrl-play):hover {
      background: var(--line-solid-hover);
      border-color: var(--line-solid-hover);
    }

    sc-music-player::part(playlist-item-active) {
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
      border-inline-start-color: var(--line-solid-background);
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
          <div class="block-group">
            <p class="block-note">
              <strong>Music player — forced dark surface + accent overlays.</strong>
              The card surface, transport controls and playlist rows resolve
              through the <strong>gray</strong> palette and stay dark in
              <em>both</em> global light and dark modes — driven by the
              <code>--surface-color-scheme: dark</code> host custom property
              (spec §16 D5). The accent-reactive zones — progress fill, play
              button and active playlist row — inherit
              <code>--line-solid-*</code> from the schema applied on
              <code>document.body</code>, so cycling the nav picker recolors
              them without re-mounting the block.
            </p>
            <div class="block-wrapper">
              <sc-music-player
                class="music-player-dark"
                track-title="Midnight Ocean"
                artist="Aurora Skies"
                progress="38"
                volume="65"
                .playlist=${[
                  { title: 'Midnight Ocean', artist: 'Aurora Skies', active: true },
                  { title: 'Glass Horizon', artist: 'Pale Wing' },
                  { title: 'Soft Static', artist: 'Field Notes' },
                  { title: 'Night Drive', artist: 'Aurora Skies' }
                ]}
              ></sc-music-player>
            </div>
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
