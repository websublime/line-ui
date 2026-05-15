import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';

import '../components/sc-dashboard-block.js';
import '../components/sc-login-block.js';
import '../components/sc-music-player.js';
import '../components/sc-pricing-block.js';
import '../components/sc-product-card.js';
import '../components/sc-schema-mapper.js';

import type { ScConfigChangeDetail } from '../components/sc-schema-mapper.js';

import { complementSchema, DEFAULT_BLOCK_CONFIGS, type PlaygroundBlockConfig } from './playground-config.js';

export type { PlaygroundBlockConfig } from './playground-config.js';

/**
 * Per-block accent-zone gating.
 *
 * For each disabled zone, the page adds a `zone-off-{selector}` class on
 * the block host. Higher-specificity `.zone-off-{selector}::part(...)`
 * rules in the page's static styles repaint that zone with neutral
 * base-palette tokens, overriding the accent rule above them.
 *
 * Mechanism choice (NORMATIVE rationale): per spec §14.5,
 * `.line-schema-*` classes cannot pierce shadow DOM. We initially
 * attempted both `:not([data-disabled-zones~='<sel>'])` attribute filters
 * and `var(--_zone-*, var(--line-solid-*))` host-custom-property
 * indirection. Both approaches expose a Chromium 146 invalidation bug
 * where `::part()` rules with host attribute / custom-property filters
 * do not re-evaluate after first paint when the host attribute changes
 * (verified manually in the showcase preview). The current approach
 * uses Lit's `keyed()` directive to force the block element to be
 * REPLACED (new identity) whenever its class set changes, so the
 * `zone-off-*` rules are matched on first paint and Chromium correctly
 * resolves the cascade. Re-mount only fires on toggle (not on schema
 * change), so schema reactivity remains a pure cascade-of-inherited
 * tokens via `body.line-schema-{accent}` — the baseline mechanism.
 *
 * Logical selectors translated by the consumer:
 *   - `input-focus` (login) has no real ::part(); the override gates
 *     the page's `::part(input):focus-visible` outline rule.
 *   - `add-to-cart` (product) maps to the real part `button`.
 */
const classListFor = (config: PlaygroundBlockConfig | undefined): string =>
  (config?.elements ?? [])
    .filter((entry) => !entry.accentReactive)
    .map((entry) => `zone-off-${entry.selector}`)
    .join(' ');

/**
 * Compose the static base class and the dynamic `zone-off-*` classes for
 * a block. The base class typically encodes the block's per-instance
 * scope (e.g. `login-block-slate`).
 */
const composeClass = (base: string, config: PlaygroundBlockConfig | undefined): string => {
  const off = classListFor(config);
  return off ? `${base} ${off}` : base;
};

const findConfig = (configs: PlaygroundBlockConfig[], id: string): PlaygroundBlockConfig | undefined =>
  configs.find((entry) => entry.id === id);

/**
 * Per-block `data-disabled-zones` derivation — retained as a debugging
 * aid alongside the functional `zone-off-*` class list. The attribute is
 * reflected on each block host so DevTools / agents can trace which
 * zones are currently disabled.
 */
const disabledZonesFor = (config: PlaygroundBlockConfig | undefined): string =>
  (config?.elements ?? [])
    .filter((entry) => !entry.accentReactive)
    .map((entry) => entry.selector)
    .join(' ');

@customElement('sc-page-playground')
export class ScPagePlayground extends LitElement {
  @property({ type: Boolean, reflect: true }) light = false;
  @property({ type: String }) schema = 'violet';

  /**
   * Mirror of `DEFAULT_BLOCK_CONFIGS`, deep-cloned on construction so toggles
   * do not mutate the exported constant. Page reload re-runs the constructor
   * and resets state to defaults (acceptance: "_configs is reset to
   * DEFAULT_BLOCK_CONFIGS on page reload").
   */
  @state() private _configs: PlaygroundBlockConfig[] = structuredClone(DEFAULT_BLOCK_CONFIGS);

  /**
   * Immutable update — replaces the array reference so Lit picks up the
   * change (mutating in place would not trigger a re-render).
   */
  private _onConfigChange = (event: CustomEvent<ScConfigChangeDetail>) => {
    const { blockId, selector, accentReactive } = event.detail;
    this._configs = this._configs.map((block) => {
      if (block.id !== blockId) return block;
      return {
        ...block,
        elements: block.elements.map((entry) => (entry.selector === selector ? { ...entry, accentReactive } : entry))
      };
    });
  };

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

    /* ── Schema mapper (T7 — sc-schema-mapper) ──
     * Consumer styling for the headless sidebar editor. NO --line-* tokens
     * are used INSIDE sc-schema-mapper — every visual property is applied
     * here via ::part() and via host custom properties. The toggle-on part
     * is intentionally tinted with --line-solid-background so the toggle
     * itself recolors when the nav schema picker cycles (a meta-demo of
     * the very system this editor configures).
     */
    sc-schema-mapper::part(block) {
      background: light-dark(var(--line-slate-2), var(--line-slate-12));
      border: var(--line-border-size-1, 1px) solid
        light-dark(var(--line-slate-5), var(--line-slate-10));
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    sc-schema-mapper::part(block-title) {
      color: light-dark(var(--line-slate-11), var(--line-slate-3));
    }

    sc-schema-mapper::part(base-chip) {
      background: light-dark(var(--line-slate-4), var(--line-slate-10));
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    sc-schema-mapper::part(element-label) {
      color: light-dark(var(--line-slate-11), var(--line-slate-3));
    }

    /* Toggle (off) — neutral slate surface */
    sc-schema-mapper::part(element-toggle) {
      background: light-dark(var(--line-slate-4), var(--line-slate-10));
      color: light-dark(var(--line-slate-1), var(--line-slate-12));
      border-color: light-dark(var(--line-slate-6), var(--line-slate-9));
    }

    /* Toggle (on) — accent-reactive, inherits from body.line-schema-{accent} */
    sc-schema-mapper::part(element-toggle-on) {
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
      border-color: var(--line-solid-background);
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
    /*
     * Each accent rule reads var(--line-solid-*) inherited from
     * body.line-schema-(accent). Disabling a zone is implemented by adding
     * a higher-specificity .zone-off-(selector) rule on the host (see
     * "Zone-off overrides" below). Per spec §14.5 NORMATIVE, .line-schema-*
     * classes do not pierce shadow DOM, so we rely on the consumer-side
     * class+::part() selector to scope the override.
     *
     * The page wraps each block with Lit's keyed() directive so the host
     * element is replaced (not just re-attributed) whenever its class set
     * changes. This works around a Chromium 146 invalidation bug where
     * ::part() rules with host attribute/class filters do not re-evaluate
     * after first paint when the host attribute changes.
     *
     * Note: 'add-to-cart' is the LOGICAL identifier in PlaygroundBlockConfig
     * that maps to the real part 'button' on sc-product-card.
     */
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

    /* Zone-off overrides (product) — higher-specificity rules win over the
     * accent rules above whenever the host carries the matching class. The
     * block is keyed() to force re-mount, so the class is present at first
     * paint and Chromium correctly resolves the cascade. */
    sc-product-card.zone-off-price::part(price) {
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    sc-product-card.zone-off-chip-active::part(chip-active) {
      background: light-dark(var(--line-slate-3), var(--line-slate-10));
      color: light-dark(var(--line-slate-11), var(--line-slate-2));
      border-color: light-dark(var(--line-slate-6), var(--line-slate-7));
    }

    sc-product-card.zone-off-add-to-cart::part(button) {
      background: light-dark(var(--line-slate-3), var(--line-slate-10));
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    sc-product-card.zone-off-add-to-cart::part(button):hover {
      background: light-dark(var(--line-slate-4), var(--line-slate-9));
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

    /* Shared accent zones — see top-of-section comment for gating mechanism.
     * The 'input-focus' selector is a LOGICAL identifier (no real part);
     * toggling it gates the consumer-side focus-ring rule below. */
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

    /* Zone-off overrides (login) — see top-of-section comment for keyed() rationale. */
    sc-login-block.zone-off-btn-submit::part(btn-submit) {
      background: light-dark(var(--line-slate-3), var(--line-slate-10));
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
      border-color: light-dark(var(--line-slate-6), var(--line-slate-7));
    }

    sc-login-block.zone-off-btn-submit::part(btn-submit):hover {
      background: light-dark(var(--line-slate-4), var(--line-slate-9));
    }

    sc-login-block.zone-off-input-focus::part(input):focus-visible {
      outline-color: light-dark(var(--line-slate-7), var(--line-slate-6));
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
      color: var(--line-gray-1);
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

    /* Zone-off overrides (player) — see top-of-section comment for keyed() rationale. */
    sc-music-player.zone-off-progress-fill::part(progress-fill) {
      background: light-dark(var(--line-gray-7), var(--line-gray-6));
    }

    sc-music-player.zone-off-ctrl-play::part(ctrl-play) {
      background: transparent;
      color: light-dark(var(--line-gray-12), var(--line-gray-1));
      border-color: light-dark(var(--line-gray-7), var(--line-gray-9));
    }

    sc-music-player.zone-off-ctrl-play::part(ctrl-play):hover {
      background: light-dark(var(--line-gray-3), var(--line-gray-10));
      border-color: light-dark(var(--line-gray-7), var(--line-gray-9));
    }

    sc-music-player.zone-off-playlist-item-active::part(playlist-item-active) {
      background: light-dark(var(--line-gray-3), var(--line-gray-11));
      color: light-dark(var(--line-gray-12), var(--line-gray-1));
      border-inline-start-color: light-dark(var(--line-gray-7), var(--line-gray-9));
    }

    /* ── Dashboard / notifications block (T5) ── */
    /*
     * <sc-dashboard-block class="dashboard-sand"> is the consumer-applied
     * instance. The outer container is painted with the sand palette so the
     * shell stays NEUTRAL and does NOT follow the nav accent picker — matching
     * the per-variant pattern used by the slate / mauve product cards.
     *
     * Intent zones (success / warning / danger / info) consume the L3 alias
     * tokens (--line-success, --line-warning, --line-danger, --line-info and
     * their -subtle / -text siblings). These aliases resolve from
     * aliases.css INDEPENDENT of any schema class (spec §14.4), so they
     * remain fixed-intent across every nav picker change.
     *
     * The two accent-reactive zones — stat-card-accent and toggle-on —
     * inherit --line-solid-* from body.line-schema-{accent}, so cycling
     * the nav picker recolors them without re-mounting the block (spec
     * §14.2 'dashboard' entry).
     */

    .dashboard-sand {
      width: 100%;
      max-width: 640px;
    }

    /* Sand neutral shell + section titles */
    .dashboard-sand::part(container) {
      background: light-dark(var(--line-sand-2), var(--line-sand-11));
      border: 1px solid light-dark(var(--line-sand-6), var(--line-sand-9));
      color: light-dark(var(--line-sand-12), var(--line-sand-1));
    }

    .dashboard-sand::part(section-title) {
      color: light-dark(var(--line-sand-11), var(--line-sand-3));
    }

    /* Stat cards / toggle rows: neutral card surface on the sand palette */
    .dashboard-sand::part(stat-card),
    .dashboard-sand::part(toggle-row) {
      background: light-dark(var(--line-sand-1), var(--line-sand-12));
      border: 1px solid light-dark(var(--line-sand-6), var(--line-sand-9));
    }

    .dashboard-sand::part(toggle-row) {
      background: transparent;
      border: none;
      border-block-end: 1px solid light-dark(var(--line-sand-6), var(--line-sand-9));
    }

    .dashboard-sand::part(stat-label),
    .dashboard-sand::part(toggle-label) {
      color: light-dark(var(--line-sand-11), var(--line-sand-3));
    }

    /* Toggle thumb track (off state) — neutral sand surface */
    .dashboard-sand::part(toggle) {
      background: light-dark(var(--line-sand-4), var(--line-sand-10));
      color: light-dark(var(--line-sand-1), var(--line-sand-12));
      border-color: light-dark(var(--line-sand-6), var(--line-sand-9));
    }

    /* ── Fixed-intent notifications (success / warning / danger) ── */
    sc-dashboard-block::part(notif-success) {
      background: var(--line-success-subtle);
      border-color: var(--line-success);
      color: var(--line-success-fg);
    }

    sc-dashboard-block::part(notif-warning) {
      background: var(--line-warning-subtle);
      border-color: var(--line-warning);
      color: var(--line-warning-fg);
    }

    sc-dashboard-block::part(notif-danger) {
      background: var(--line-danger-subtle);
      border-color: var(--line-danger);
      color: var(--line-danger-fg);
    }

    /*
     * Notif color (set above) is inherited by descendants in the shadow
     * tree through normal CSS inheritance, so the inline <svg> icon (which
     * uses stroke=currentColor) and the title / body text all pick up the
     * intent hue. No extra ::part(notif-icon) rule is needed.
     */
    .dashboard-sand::part(notif-title) {
      font-weight: 700;
    }

    .dashboard-sand::part(notif-body) {
      opacity: 0.92;
    }

    /*
     * Stat-value color is driven by a private custom property
     * --_stat-value-color set on the parent stat-card-{intent} part.
     * CSS custom properties inherit through the shadow DOM via the normal
     * cascade, so each stat-value resolves the property that was set on its
     * parent stat-card. This is the same inheritance mechanism that lets
     * --line-solid-background cross the shadow boundary from <body>
     * (spec §14.1).
     *
     * The fixed-intent values use explicit light-dark(level-11, level-3)
     * palette tokens rather than the L3 alias (which is level-9 only and
     * renders too dark on dark surfaces under the inverted Radix scale).
     * This mirrors the sc-music-player pattern of using explicit per-mode
     * palette levels for vibrant text on neutral surfaces in both modes.
     * The accent stat uses --line-solid-background, which is the
     * picker-reactive equivalent and resolves correctly on dark surfaces.
     */
    sc-dashboard-block::part(stat-card-info) {
      --_stat-value-color: light-dark(var(--line-cyan-11), var(--line-cyan-3));
    }

    sc-dashboard-block::part(stat-card-success) {
      --_stat-value-color: light-dark(var(--line-green-11), var(--line-green-3));
    }

    sc-dashboard-block::part(stat-card-warning) {
      --_stat-value-color: light-dark(var(--line-amber-11), var(--line-amber-3));
    }

    sc-dashboard-block::part(stat-card-accent) {
      --_stat-value-color: var(--line-solid-background);
    }

    sc-dashboard-block::part(stat-value) {
      color: var(--_stat-value-color, currentColor);
    }

    /* Accent-reactive stat card: tint the card border too so the card itself
       reads as the active accent surface. */
    .dashboard-sand::part(stat-card-accent) {
      border-color: var(--line-solid-background);
      background: light-dark(var(--line-sand-1), var(--line-sand-12));
    }

    /* ── Accent-reactive toggle (on state) ──
     * Inherits --line-solid-background / --line-solid-text from
     * body.line-schema-{accent} and recolors when the nav picker cycles.
     * Scoped via the .dashboard-sand class so it beats the neutral sand
     * toggle rule above on specificity. */
    .dashboard-sand::part(toggle-on) {
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
      border-color: var(--line-solid-background);
    }

    /* Zone-off overrides (dashboard) — see top-of-section comment for keyed() rationale. */
    sc-dashboard-block.zone-off-stat-card-accent::part(stat-card-accent) {
      --_stat-value-color: light-dark(var(--line-sand-11), var(--line-sand-3));
      border-color: light-dark(var(--line-sand-6), var(--line-sand-9));
    }

    sc-dashboard-block.zone-off-toggle-on::part(toggle-on) {
      background: light-dark(var(--line-sand-4), var(--line-sand-10));
      color: light-dark(var(--line-sand-1), var(--line-sand-12));
      border-color: light-dark(var(--line-sand-6), var(--line-sand-9));
    }

    /* ── Pricing / comparison block (T6) ── */
    /*
     * <sc-pricing-block class="pricing-block"> is the consumer-applied
     * instance. The block itself defines structure + layout only; ALL
     * design system tokens are applied externally via ::part() selectors
     * and via the six --complement-* host custom properties set inline
     * on the element by render() (spec §14.5 mechanism 2, §15.1).
     *
     * - Free tier: neutral defaults (slate palette in both modes).
     * - Pro tier (tier-card-featured): consumes --line-solid-* inherited
     *   from body.line-schema-{accent} (spec §14.5 mechanism 1).
     * - Enterprise tier (tier-card-enterprise): consumes the inline
     *   --complement-* host custom properties; recolors live whenever
     *   the picker cycles because render() recomputes them.
     *
     * Feature checks use the L3 alias --line-success (fixed-intent,
     * does NOT react to the picker per spec §14.4). Feature dashes use
     * --line-low-contrast.
     */

    .pricing-block {
      width: 100%;
      max-width: 960px;
    }

    /* ── Neutral tier card shell (slate) ── */
    sc-pricing-block::part(tier-card) {
      background: light-dark(var(--line-slate-2), var(--line-slate-12));
      border-color: light-dark(var(--line-slate-6), var(--line-slate-9));
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    /* Tier name & period text use low-contrast / high-contrast neutrals */
    sc-pricing-block::part(tier-name) {
      color: light-dark(var(--line-slate-11), var(--line-slate-3));
    }

    sc-pricing-block::part(price-amount) {
      color: var(--line-high-contrast);
    }

    sc-pricing-block::part(price-period) {
      color: var(--line-low-contrast);
    }

    /* Feature check (L3 intent, fixed) / dash (neutral muted) */
    sc-pricing-block::part(feature-check) {
      color: var(--line-success);
    }

    sc-pricing-block::part(feature-dash) {
      color: light-dark(var(--line-gray-8), var(--line-gray-8));
    }

    /* ── Ghost CTA (Free tier) — text + border neutral ── */
    sc-pricing-block::part(cta-ghost) {
      background: transparent;
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
      border-color: light-dark(var(--line-slate-7), var(--line-slate-9));
    }

    sc-pricing-block::part(cta-ghost):hover {
      background: light-dark(var(--line-slate-3), var(--line-slate-11));
      border-color: light-dark(var(--line-slate-8), var(--line-slate-8));
    }

    /* ── Pro tier (accent-reactive via inherited --line-solid-*) ── */
    sc-pricing-block::part(tier-card-featured) {
      border-color: var(--line-solid-background);
    }

    sc-pricing-block::part(badge) {
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
    }

    sc-pricing-block::part(cta-solid) {
      background: var(--line-solid-background);
      color: var(--line-solid-text, #fff);
      border-color: var(--line-solid-background);
    }

    sc-pricing-block::part(cta-solid):hover {
      background: var(--line-solid-hover);
      border-color: var(--line-solid-hover);
    }

    /* ── Enterprise tier (complement-reactive via host custom properties) ── */
    sc-pricing-block::part(tier-card-enterprise) {
      border-color: var(--complement-border);
    }

    sc-pricing-block::part(cta-outline) {
      background: transparent;
      color: var(--complement-high-contrast);
      border-color: var(--complement-border);
    }

    sc-pricing-block::part(cta-outline):hover {
      background: var(--complement-solid);
      color: var(--complement-text);
      border-color: var(--complement-solid);
    }

    /* Zone-off overrides (pricing) — see top-of-section comment for keyed() rationale. */
    sc-pricing-block.zone-off-tier-card-featured::part(tier-card-featured) {
      border-color: light-dark(var(--line-slate-6), var(--line-slate-9));
    }

    sc-pricing-block.zone-off-tier-card-featured::part(badge) {
      background: light-dark(var(--line-slate-6), var(--line-slate-9));
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
    }

    sc-pricing-block.zone-off-cta-solid::part(cta-solid) {
      background: light-dark(var(--line-slate-3), var(--line-slate-10));
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
      border-color: light-dark(var(--line-slate-6), var(--line-slate-7));
    }

    sc-pricing-block.zone-off-cta-solid::part(cta-solid):hover {
      background: light-dark(var(--line-slate-4), var(--line-slate-9));
      border-color: light-dark(var(--line-slate-7), var(--line-slate-7));
    }

    sc-pricing-block.zone-off-tier-card-enterprise::part(tier-card-enterprise) {
      border-color: light-dark(var(--line-slate-6), var(--line-slate-9));
    }

    sc-pricing-block.zone-off-tier-card-enterprise::part(cta-outline) {
      background: transparent;
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
      border-color: light-dark(var(--line-slate-6), var(--line-slate-9));
    }

    sc-pricing-block.zone-off-tier-card-enterprise::part(cta-outline):hover {
      background: light-dark(var(--line-slate-3), var(--line-slate-10));
      color: light-dark(var(--line-slate-12), var(--line-slate-1));
      border-color: light-dark(var(--line-slate-7), var(--line-slate-7));
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
    /*
     * Pre-compute per-block configuration, the class lists carrying the
     * `zone-off-*` markers, and the debugging `data-disabled-zones`
     * reflection from the current _configs state. Each block is rendered
     * inside Lit's `keyed()` directive — keyed on its disabled-zone
     * fingerprint so the host element is REPLACED (new identity) every
     * time a toggle flips. The replacement makes the `zone-off-*` rule
     * match on first paint and works around a Chromium 146 ::part()
     * invalidation bug observed when host attribute filters are used
     * with :not(). Schema changes do NOT alter the key, so block state
     * survives picker cycling; the active accent reaches every block via
     * `body.line-schema-{accent}` and inherited custom properties.
     */
    const loginConfig = findConfig(this._configs, 'login');
    const productConfig = findConfig(this._configs, 'product');
    const playerConfig = findConfig(this._configs, 'player');
    const dashboardConfig = findConfig(this._configs, 'dashboard');
    const pricingConfig = findConfig(this._configs, 'pricing');

    const loginDisabled = disabledZonesFor(loginConfig);
    const productDisabled = disabledZonesFor(productConfig);
    const playerDisabled = disabledZonesFor(playerConfig);
    const dashboardDisabled = disabledZonesFor(dashboardConfig);
    const pricingDisabled = disabledZonesFor(pricingConfig);

    const loginClass = composeClass('login-block-slate', loginConfig);
    const productClass = (base: string) => composeClass(base, productConfig);
    const playerClass = composeClass('music-player-dark', playerConfig);
    const dashboardClass = composeClass('dashboard-sand', dashboardConfig);
    const pricingClass = composeClass('pricing-block', pricingConfig);

    // Pricing complement style — recomputed every render so the picker
    // recolors the Enterprise tier live (spec §15.1).
    const complement = complementSchema(this.schema);
    const pricingComplement =
      `--complement-solid: var(--line-${complement}-9); ` +
      `--complement-text: var(--line-${complement}-1); ` +
      `--complement-hover: var(--line-${complement}-10); ` +
      `--complement-border: var(--line-${complement}-8); ` +
      `--complement-low-contrast: var(--line-${complement}-11); ` +
      `--complement-high-contrast: var(--line-${complement}-12);`;

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
            <sc-schema-mapper
              .configs=${this._configs}
              @sc-config-change=${this._onConfigChange}
            ></sc-schema-mapper>
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
              ${keyed(
                loginDisabled,
                html`
                  <sc-login-block
                    class=${loginClass}
                    data-disabled-zones=${loginDisabled}
                    heading="Sign in"
                    subtitle="Welcome back. Enter your credentials to continue."
                    submit-label="Sign in"
                    sso-label="GitHub"
                    .errorField=${'password' as const}
                    error-message="Incorrect password."
                  ></sc-login-block>
                `
              )}
            </div>
          </div>
          <div class="block-wrapper">
            <div class="product-grid">
              <!-- Card 1: Slate base -->
              ${keyed(
                productDisabled,
                html`
                  <sc-product-card
                    class=${productClass('product-card-slate')}
                    data-disabled-zones=${productDisabled}
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
                `
              )}

              <!-- Card 2: Mauve base -->
              ${keyed(
                productDisabled,
                html`
                  <sc-product-card
                    class=${productClass('product-card-mauve')}
                    data-disabled-zones=${productDisabled}
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
                `
              )}
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
              ${keyed(
                playerDisabled,
                html`
                  <sc-music-player
                    class=${playerClass}
                    data-disabled-zones=${playerDisabled}
                    track-title="Midnight Ocean"
                    artist="Aurora Skies"
                    progress="38"
                    volume="65"
                    .duration=${238}
                    .playlist=${[
                      { title: 'Midnight Ocean', artist: 'Aurora Skies', active: true },
                      { title: 'Glass Horizon', artist: 'Pale Wing' },
                      { title: 'Soft Static', artist: 'Field Notes' },
                      { title: 'Night Drive', artist: 'Aurora Skies' }
                    ]}
                  ></sc-music-player>
                `
              )}
            </div>
          </div>
          <div class="block-group">
            <p class="block-note">
              <strong>Dashboard — fixed intent + accent coexistence.</strong>
              The outer container, section headings and toggle rows are
              painted with the <strong>sand</strong> palette so the shell
              stays neutral and does <em>not</em> follow the nav accent
              picker. The three notifications and the first three stat cards
              use the L3 intent aliases — <code>--line-success</code>,
              <code>--line-warning</code>, <code>--line-danger</code>,
              <code>--line-info</code> — which resolve from
              <code>aliases.css</code> independently of any schema class and
              therefore stay fixed across picker changes. Only the fourth
              stat card and any toggle in its <em>on</em> state inherit
              <code>--line-solid-*</code> from the accent schema on
              <code>document.body</code> and recolor whenever the picker
              cycles.
            </p>
            <div class="block-wrapper">
              ${keyed(
                dashboardDisabled,
                html`
                  <sc-dashboard-block
                    class=${dashboardClass}
                    data-disabled-zones=${dashboardDisabled}
                    .notifications=${[
                      {
                        kind: 'success' as const,
                        title: 'Deployment succeeded',
                        body: 'Production updated to v2.4.1'
                      },
                      {
                        kind: 'warning' as const,
                        title: 'High memory usage',
                        body: 'Server is at 87% capacity'
                      },
                      {
                        kind: 'danger' as const,
                        title: 'Payment failed',
                        body: 'Card ending 4242 was declined'
                      }
                    ]}
                    .stats=${[
                      { value: '12,450', label: 'Active Users', intent: 'info' as const },
                      { value: '98.9%', label: 'Uptime', intent: 'success' as const },
                      { value: '24', label: 'Pending', intent: 'warning' as const },
                      { value: '+3.2%', label: 'Growth', intent: 'accent' as const }
                    ]}
                    .toggles=${[
                      { label: 'Notifications', on: true },
                      { label: 'Auto-deploy', on: false },
                      { label: 'Dark mode sync', on: true }
                    ]}
                  ></sc-dashboard-block>
                `
              )}
            </div>
          </div>
          <div class="block-group">
            <p class="block-note">
              <strong>Pricing — accent + complementary schema as visual hierarchy.</strong>
              Three tiers (Free / Pro / Enterprise) demonstrate distinct accent
              roles. The <strong>Free</strong> card stays neutral
              (<strong>slate</strong>) so the entry-level option does
              <em>not</em> compete for attention. The <strong>Pro</strong> card
              is the featured tier: its border, "Recommended" badge and solid
              CTA inherit <code>--line-solid-*</code> from the schema applied
              on <code>document.body</code>, so cycling the nav picker recolors
              it live. The <strong>Enterprise</strong> card consumes a
              <em>complementary</em> schema resolved via
              <code>complementSchema(accent)</code> and passed as inline
              <code>--complement-*</code> host custom properties on the block
              — the only mechanism that pierces shadow DOM with a second
              schema (spec §14.5). Feature checks render via
              <code>--line-success</code> (L3 alias, fixed-intent), independent
              of the picker.
            </p>
            <div class="block-wrapper">
              ${keyed(
                pricingDisabled,
                html`
                  <sc-pricing-block
                    class=${pricingClass}
                    data-disabled-zones=${pricingDisabled}
                    .accentSchema=${this.schema}
                    .tiers=${[
                      {
                        name: 'Free',
                        price: '$0',
                        period: '/ month',
                        weight: 'ghost' as const,
                        cta: 'Get started',
                        features: [
                          { available: true, text: 'Up to 3 projects' },
                          { available: true, text: 'Community support' },
                          { available: false, text: 'Custom domains' },
                          { available: false, text: 'Priority support' },
                          { available: false, text: 'SSO / SAML' }
                        ]
                      },
                      {
                        name: 'Pro',
                        price: '$24',
                        period: '/ month',
                        weight: 'solid' as const,
                        cta: 'Start free trial',
                        features: [
                          { available: true, text: 'Unlimited projects' },
                          { available: true, text: 'Email support' },
                          { available: true, text: 'Custom domains' },
                          { available: true, text: 'Advanced analytics' },
                          { available: false, text: 'SSO / SAML' }
                        ]
                      },
                      {
                        name: 'Enterprise',
                        price: 'Custom',
                        weight: 'outline' as const,
                        cta: 'Contact sales',
                        features: [
                          { available: true, text: 'Unlimited projects' },
                          { available: true, text: 'Dedicated support' },
                          { available: true, text: 'Custom domains' },
                          { available: true, text: 'Advanced analytics' },
                          { available: true, text: 'SSO / SAML' }
                        ]
                      }
                    ]}
                    style=${pricingComplement}
                  ></sc-pricing-block>
                `
              )}
            </div>
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
