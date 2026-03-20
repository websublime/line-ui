import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '../components/sc-code-block.js';

/* ─────────────────────────────────────────────────────────
   Navigation card data — one per non-home panel
   ───────────────────────────────────────────────────────── */

interface NavCard {
  readonly key: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly tokens: number;
}

const NAV_CARDS: readonly NavCard[] = [
  {
    key: 'colors',
    category: 'Foundation',
    title: 'Colors',
    description: 'L0: 28 palettes x 12 levels, contrast tokens, color-mix',
    tokens: 364
  },
  {
    key: 'typography',
    category: 'Foundation',
    title: 'Typography',
    description: '62 tokens: families, sizes, weights, line-heights, spacings',
    tokens: 62
  },
  {
    key: 'spacing',
    category: 'Foundation',
    title: 'Spacing',
    description: '74 tokens: rem, px, fluid, breakpoints, widths',
    tokens: 74
  },
  {
    key: 'motion',
    category: 'Foundation',
    title: 'Motion',
    description: '81 easings, 12 durations, 23 animations',
    tokens: 116
  },
  {
    key: 'surfaces',
    category: 'Foundation',
    title: 'Surfaces',
    description: 'Shadows, borders, radii, opacity, focus, aspects',
    tokens: 65
  },
  {
    key: 'decorative',
    category: 'Visual',
    title: 'Decorative',
    description: 'Gradients, noise, masks, highlights, SVG, layouts',
    tokens: 85
  },
  {
    key: 'semantic',
    category: 'System',
    title: 'Semantic',
    description: 'L2 defaults, L3 aliases, override demo',
    tokens: 68
  },
  {
    key: 'elements',
    category: 'System',
    title: 'Elements',
    description: 'Normalize/reset for all native HTML elements',
    tokens: 0
  },
  {
    key: 'themes',
    category: 'System',
    title: 'Themes',
    description: '28 pre-built palette+schema bundles',
    tokens: 0
  },
  {
    key: 'generator',
    category: 'Tools',
    title: 'Generator',
    description: 'Create custom palettes with OKLCH',
    tokens: 0
  }
] as const;

/* ─────────────────────────────────────────────────────────
   CSS usage snippet — educates about dual-layer theming
   ───────────────────────────────────────────────────────── */

const CSS_SNIPPET = `/* Color schema — pick your palette */
body.line-schema-violet { }

/* Mode: two layers work together */

/* 1. Native browser property — drives CSS light-dark() resolution
      and inherits through shadow DOM boundaries */
html { color-scheme: dark; }

/* 2. Class on <html> — needed because shadow/elevation tokens
      use partial HSL values that cannot use light-dark() */
html.dark { }

/* Semantic tokens adapt to both layers automatically */
.card {
  background: var(--line-subtle-background);
  color: var(--line-high-contrast);
  border: 1px solid var(--line-subtle-border);
  box-shadow: var(--line-shadow-3);
}`;

/* ─────────────────────────────────────────────────────────
   Stats data
   ───────────────────────────────────────────────────────── */

interface Stat {
  readonly value: number;
  readonly label: string;
}

const STATS: readonly Stat[] = [
  { value: 440, label: 'Tokens' },
  { value: 28, label: 'Palettes' },
  { value: 336, label: 'Color Tokens' },
  { value: 54, label: 'Aliases' }
] as const;

@customElement('sc-page-home')
export class ScPageHome extends LitElement {
  @property({ type: Boolean, reflect: true }) light = false;

  static override styles = css`
    :host {
      display: block;
    }

    /* ── Hero (A: gradient background) ── */
    .hero {
      position: relative;
      text-align: center;
      padding: var(--line-size-11, 7.5rem) 0 var(--line-size-8, 3rem);
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(
          ellipse 80% 60% at 50% 0%,
          color-mix(in oklch, var(--line-solid-background, #c8ff00) 12%, transparent) 0%,
          transparent 70%
        ),
        radial-gradient(
          ellipse 50% 40% at 30% 20%,
          color-mix(in oklch, var(--line-solid-background, #c8ff00) 6%, transparent) 0%,
          transparent 60%
        ),
        radial-gradient(
          ellipse 50% 40% at 70% 20%,
          color-mix(in oklch, var(--line-solid-background, #c8ff00) 6%, transparent) 0%,
          transparent 60%
        );
      pointer-events: none;
      z-index: 0;
    }
    :host([light]) .hero::before {
      background:
        radial-gradient(
          ellipse 80% 60% at 50% 0%,
          color-mix(in oklch, var(--line-solid-background, #c8ff00) 8%, transparent) 0%,
          transparent 70%
        ),
        radial-gradient(
          ellipse 50% 40% at 30% 20%,
          color-mix(in oklch, var(--line-solid-background, #c8ff00) 4%, transparent) 0%,
          transparent 60%
        ),
        radial-gradient(
          ellipse 50% 40% at 70% 20%,
          color-mix(in oklch, var(--line-solid-background, #c8ff00) 4%, transparent) 0%,
          transparent 60%
        );
    }

    .hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(
        color-mix(in oklch, var(--line-ui-border, #444) 25%, transparent) 1px,
        transparent 1px
      );
      background-size: 24px 24px;
      opacity: 0.3;
      pointer-events: none;
      z-index: 0;
      mask-image: radial-gradient(ellipse 70% 50% at 50% 30%, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse 70% 50% at 50% 30%, black 0%, transparent 70%);
    }
    :host([light]) .hero::after {
      opacity: 0.4;
    }

    .hero > * {
      position: relative;
      z-index: 1;
    }

    .wordmark {
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 800;
      letter-spacing: -0.04em;
      color: var(--line-high-contrast, #fff);
      margin: 0;
      line-height: 1.1;
    }
    :host([light]) .wordmark { color: var(--line-high-contrast, #1a1a1a); }

    .wordmark-accent {
      color: var(--line-solid-background, #c8ff00);
    }

    .tagline {
      font-size: var(--line-font-size-3, 1.25rem);
      color: var(--line-low-contrast, #999);
      margin: var(--line-size-3, 1rem) 0 0;
      font-weight: var(--line-font-weight-4, 400);
    }
    :host([light]) .tagline { color: var(--line-low-contrast, #666); }

    /* ── Intro blurb ── */
    .intro {
      text-align: center;
      max-width: 600px;
      margin: 0 auto var(--line-size-8, 3rem);
      font-size: var(--line-font-size-2, 1rem);
      line-height: var(--line-lineheight-3, 1.6);
      color: var(--line-low-contrast, #999);
    }
    :host([light]) .intro { color: var(--line-low-contrast, #666); }

    /* ── Code snippet ── */
    .snippet {
      max-width: 640px;
      margin: 0 auto var(--line-size-9, 4rem);
    }

    /* ── Stats ── */
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--line-size-3, 1rem);
      margin-bottom: var(--line-size-9, 4rem);
    }

    @media (max-width: 600px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
    }

    .stat {
      text-align: center;
      padding: var(--line-size-5, 1.5rem) var(--line-size-3, 1rem);
      background: var(--line-subtle-background, #161616);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      border-radius: var(--line-radius-2, 4px);
    }
    :host([light]) .stat {
      background: var(--line-subtle-background, #fafafa);
      border-color: var(--line-ui-background, #e5e5e5);
    }

    .stat-value {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 800;
      color: var(--line-solid-background, #c8ff00);
      font-family: 'IBM Plex Mono', monospace;
      letter-spacing: -0.02em;
    }

    .stat-label {
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-low-contrast, #999);
      margin-top: var(--line-size-1, 0.25rem);
      font-weight: var(--line-font-weight-6, 600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    :host([light]) .stat-label { color: var(--line-low-contrast, #666); }

    /* ── Section title ── */
    .section-title {
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-low-contrast, #999);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: var(--line-size-4, 1.25rem);
    }
    :host([light]) .section-title { color: var(--line-low-contrast, #666); }

    .section-subtitle {
      font-size: var(--line-font-size-2, 1rem);
      color: var(--line-low-contrast, #999);
      margin-top: var(--line-size-1, 0.25rem);
      margin-bottom: var(--line-size-6, 2rem);
      line-height: var(--line-lineheight-3, 1.6);
      max-width: 520px;
    }
    :host([light]) .section-subtitle { color: var(--line-low-contrast, #666); }

    /* ── Built with tokens — compositions grid ── */
    .compositions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--line-size-4, 1.25rem);
      margin-bottom: var(--line-size-9, 4rem);
    }

    @media (max-width: 900px) {
      .compositions-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 560px) {
      .compositions-grid { grid-template-columns: 1fr; }
    }

    /* ── Shared composition card shell ── */
    .comp {
      background: var(--line-subtle-background, #161616);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      border-radius: var(--line-radius-3, 8px);
      overflow: hidden;
    }
    :host([light]) .comp {
      background: var(--line-subtle-background, #fafafa);
      border-color: var(--line-ui-background, #e5e5e5);
    }

    /* ── 1. Content card ── */
    .comp-card {
      display: flex;
      flex-direction: column;
    }
    .comp-card-body {
      padding: var(--line-size-5, 1.5rem);
      flex: 1;
    }
    .comp-card-title {
      font-size: var(--line-font-size-3, 1.25rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-high-contrast, #fff);
      margin: 0 0 var(--line-size-2, 0.5rem);
    }
    :host([light]) .comp-card-title { color: var(--line-high-contrast, #1a1a1a); }

    .comp-card-text {
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-low-contrast, #999);
      line-height: var(--line-lineheight-3, 1.6);
      margin: 0;
    }
    :host([light]) .comp-card-text { color: var(--line-low-contrast, #666); }

    .comp-card-footer {
      padding: var(--line-size-3, 1rem) var(--line-size-5, 1.5rem);
      border-top: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    :host([light]) .comp-card-footer {
      border-color: var(--line-ui-background, #e5e5e5);
    }

    .comp-card-footer-label {
      font-size: var(--line-font-size-00, 0.625rem);
      color: var(--line-low-contrast, #999);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: var(--line-font-weight-6, 600);
    }
    :host([light]) .comp-card-footer-label { color: var(--line-low-contrast, #666); }

    .comp-card-footer-value {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-solid-background, #c8ff00);
      font-weight: var(--line-font-weight-6, 600);
    }

    /* ── 2. Info banner ── */
    .comp-info {
      padding: var(--line-size-4, 1.25rem) var(--line-size-5, 1.5rem);
      display: flex;
      gap: var(--line-size-3, 1rem);
      align-items: flex-start;
    }

    .comp-info-indicator {
      flex-shrink: 0;
      width: var(--line-size-3, 1rem);
      height: var(--line-size-3, 1rem);
      margin-top: var(--line-size-1, 0.25rem);
      border-radius: var(--line-radius-round, 50%);
      background: var(--line-solid-background, #c8ff00);
    }

    .comp-info-title {
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-high-contrast, #fff);
      margin: 0 0 var(--line-size-1, 0.25rem);
    }
    :host([light]) .comp-info-title { color: var(--line-high-contrast, #1a1a1a); }

    .comp-info-text {
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-low-contrast, #999);
      line-height: var(--line-lineheight-3, 1.6);
      margin: 0;
    }
    :host([light]) .comp-info-text { color: var(--line-low-contrast, #666); }

    /* ── 3. Image card ── */
    .comp-image-card {
      display: flex;
      flex-direction: column;
    }

    .comp-image-placeholder {
      height: 140px;
      background: linear-gradient(
        135deg,
        var(--line-subtle-background, #161616) 0%,
        color-mix(in oklch, var(--line-solid-background, #c8ff00) 15%, var(--line-subtle-background, #161616)) 50%,
        var(--line-hover-background, #1e1e1e) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :host([light]) .comp-image-placeholder {
      background: linear-gradient(
        135deg,
        var(--line-subtle-background, #fafafa) 0%,
        color-mix(in oklch, var(--line-solid-background, #c8ff00) 10%, var(--line-subtle-background, #fafafa)) 50%,
        var(--line-hover-background, #eee) 100%
      );
    }

    .comp-image-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--line-radius-2, 4px);
      background: color-mix(in oklch, var(--line-solid-background, #c8ff00) 25%, transparent);
      border: var(--line-border-size-1, 1px) solid color-mix(in oklch, var(--line-solid-background, #c8ff00) 40%, transparent);
    }

    .comp-image-caption {
      padding: var(--line-size-4, 1.25rem) var(--line-size-5, 1.5rem);
    }

    .comp-image-title {
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-high-contrast, #fff);
      margin: 0 0 var(--line-size-1, 0.25rem);
    }
    :host([light]) .comp-image-title { color: var(--line-high-contrast, #1a1a1a); }

    .comp-image-desc {
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-low-contrast, #999);
      margin: 0;
      line-height: var(--line-lineheight-3, 1.6);
    }
    :host([light]) .comp-image-desc { color: var(--line-low-contrast, #666); }

    /* ── 4. Pricing card ── */
    .comp-pricing {
      display: flex;
      flex-direction: column;
      padding: var(--line-size-5, 1.5rem);
    }

    .comp-pricing-plan {
      font-size: var(--line-font-size-00, 0.625rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-solid-background, #c8ff00);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 0 0 var(--line-size-2, 0.5rem);
    }

    .comp-pricing-price {
      font-size: clamp(1.75rem, 3vw, 2.25rem);
      font-weight: 800;
      color: var(--line-high-contrast, #fff);
      font-family: 'IBM Plex Mono', monospace;
      letter-spacing: -0.03em;
      margin: 0 0 var(--line-size-1, 0.25rem);
      line-height: 1.1;
    }
    :host([light]) .comp-pricing-price { color: var(--line-high-contrast, #1a1a1a); }

    .comp-pricing-period {
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-low-contrast, #999);
      font-weight: var(--line-font-weight-4, 400);
      font-family: inherit;
    }

    .comp-pricing-features {
      list-style: none;
      padding: 0;
      margin: var(--line-size-4, 1.25rem) 0;
      display: flex;
      flex-direction: column;
      gap: var(--line-size-2, 0.5rem);
      flex: 1;
    }

    .comp-pricing-features li {
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-low-contrast, #999);
      line-height: var(--line-lineheight-3, 1.6);
      padding-left: var(--line-size-4, 1.25rem);
      position: relative;
    }
    :host([light]) .comp-pricing-features li { color: var(--line-low-contrast, #666); }

    .comp-pricing-features li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.45em;
      width: 6px;
      height: 6px;
      border-radius: var(--line-radius-round, 50%);
      background: var(--line-solid-background, #c8ff00);
    }

    .comp-pricing-cta {
      display: block;
      width: 100%;
      padding: var(--line-size-3, 1rem);
      border: none;
      border-radius: var(--line-radius-2, 4px);
      background: var(--line-solid-background, #c8ff00);
      color: var(--line-solid-foreground, #000);
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-7, 700);
      font-family: inherit;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: opacity var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }

    .comp-pricing-cta:hover {
      opacity: 0.85;
    }

    /* ── 5. Login form ── */
    .comp-login {
      padding: var(--line-size-5, 1.5rem);
      display: flex;
      flex-direction: column;
      gap: var(--line-size-4, 1.25rem);
    }

    .comp-login-heading {
      font-size: var(--line-font-size-3, 1.25rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-high-contrast, #fff);
      margin: 0;
    }
    :host([light]) .comp-login-heading { color: var(--line-high-contrast, #1a1a1a); }

    .comp-login-field {
      display: flex;
      flex-direction: column;
      gap: var(--line-size-1, 0.25rem);
    }

    .comp-login-label {
      font-size: var(--line-font-size-00, 0.625rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    :host([light]) .comp-login-label { color: var(--line-low-contrast, #666); }

    .comp-login-input {
      padding: var(--line-size-3, 1rem);
      background: var(--line-hover-background, #1a1a1a);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-border, #333);
      border-radius: var(--line-radius-2, 4px);
      color: var(--line-high-contrast, #fff);
      font-size: var(--line-font-size-1, 0.75rem);
      font-family: inherit;
      outline: none;
      transition:
        border-color var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        box-shadow var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }
    :host([light]) .comp-login-input {
      background: var(--line-hover-background, #f5f5f5);
      border-color: var(--line-ui-border, #ccc);
      color: var(--line-high-contrast, #1a1a1a);
    }

    .comp-login-input::placeholder {
      color: var(--line-subtle-border, #444);
    }
    :host([light]) .comp-login-input::placeholder {
      color: var(--line-subtle-border, #aaa);
    }

    .comp-login-input:focus {
      border-color: var(--line-solid-background, #c8ff00);
      box-shadow: 0 0 0 2px color-mix(in oklch, var(--line-solid-background, #c8ff00) 20%, transparent);
    }

    .comp-login-submit {
      display: block;
      width: 100%;
      padding: var(--line-size-3, 1rem);
      border: none;
      border-radius: var(--line-radius-2, 4px);
      background: var(--line-solid-background, #c8ff00);
      color: var(--line-solid-foreground, #000);
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-7, 700);
      font-family: inherit;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: opacity var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }

    .comp-login-submit:hover {
      opacity: 0.85;
    }

    .comp-login-divider {
      text-align: center;
      font-size: var(--line-font-size-00, 0.625rem);
      color: var(--line-subtle-border, #444);
      position: relative;
    }
    :host([light]) .comp-login-divider { color: var(--line-subtle-border, #aaa); }

    .comp-login-divider::before,
    .comp-login-divider::after {
      content: '';
      position: absolute;
      top: 50%;
      width: calc(50% - 1.5em);
      height: 1px;
      background: var(--line-ui-background, #222);
    }
    :host([light]) .comp-login-divider::before,
    :host([light]) .comp-login-divider::after {
      background: var(--line-ui-background, #e5e5e5);
    }
    .comp-login-divider::before { left: 0; }
    .comp-login-divider::after { right: 0; }

    .comp-login-ghost {
      display: block;
      width: 100%;
      padding: var(--line-size-3, 1rem);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-border, #333);
      border-radius: var(--line-radius-2, 4px);
      background: transparent;
      color: var(--line-high-contrast, #fff);
      font-size: var(--line-font-size-1, 0.75rem);
      font-weight: var(--line-font-weight-6, 600);
      font-family: inherit;
      cursor: pointer;
      transition:
        background var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        border-color var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }
    :host([light]) .comp-login-ghost {
      border-color: var(--line-ui-border, #ccc);
      color: var(--line-high-contrast, #1a1a1a);
    }

    .comp-login-ghost:hover {
      background: var(--line-hover-background, #1a1a1a);
      border-color: var(--line-solid-background, #c8ff00);
    }
    :host([light]) .comp-login-ghost:hover {
      background: var(--line-hover-background, #f5f5f5);
    }

    /* ── Card grid ── */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--line-size-3, 1rem);
    }

    .card {
      display: flex;
      flex-direction: column;
      padding: var(--line-size-5, 1.5rem);
      background: var(--line-subtle-background, #161616);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-background, #222);
      border-radius: var(--line-radius-2, 4px);
      cursor: pointer;
      transition:
        background var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        border-color var(--line-duration-quick-1, 80ms) var(--line-ease-2),
        transform var(--line-duration-quick-1, 80ms) var(--line-ease-2);
    }

    .card:hover {
      background: var(--line-ui-background, #1e1e1e);
      border-color: var(--line-ui-border, #444);
      transform: translateY(-1px);
    }

    :host([light]) .card {
      background: var(--line-subtle-background, #fafafa);
      border-color: var(--line-ui-background, #e5e5e5);
    }
    :host([light]) .card:hover {
      background: var(--line-ui-background, #eee);
      border-color: var(--line-ui-border, #bbb);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--line-size-2, 0.5rem);
    }

    .card-category {
      font-size: var(--line-font-size-00, 0.625rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-solid-background, #c8ff00);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .card-badge {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-low-contrast, #999);
      background: var(--line-ui-background, #1e1e1e);
      padding: var(--line-size-1, 0.25rem) var(--line-size-2, 0.5rem);
      border-radius: var(--line-radius-2, 4px);
    }
    :host([light]) .card-badge {
      background: var(--line-ui-background, #e5e5e5);
      color: var(--line-low-contrast, #666);
    }

    .card-title {
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-7, 700);
      color: var(--line-high-contrast, #fff);
      margin-bottom: var(--line-size-1, 0.25rem);
    }
    :host([light]) .card-title { color: var(--line-high-contrast, #1a1a1a); }

    .card-desc {
      font-size: var(--line-font-size-1, 0.75rem);
      color: var(--line-low-contrast, #999);
      line-height: var(--line-lineheight-3, 1.6);
      flex: 1;
    }
    :host([light]) .card-desc { color: var(--line-low-contrast, #666); }
  `;

  private _navigate(panel: string): void {
    this.dispatchEvent(
      new CustomEvent('sc-navigate', {
        detail: { panel },
        bubbles: true,
        composed: true
      })
    );
  }

  override render() {
    return html`
      <section class="hero">
        <h1 class="wordmark">line<span class="wordmark-accent">://</span>ui</h1>
        <p class="tagline">Design System Showcase</p>
      </section>

      <p class="intro">
        The design system for the AI — future is bright!
      </p>

      <div class="snippet">
        <sc-code-block
          language="css"
          .code=${CSS_SNIPPET}
        ></sc-code-block>
      </div>

      <div class="stats">
        ${STATS.map(
          (s) => html`
          <div class="stat">
            <div class="stat-value">${s.value}</div>
            <div class="stat-label">${s.label}</div>
          </div>
        `
        )}
      </div>

      <!-- ── Built with tokens ── -->
      <div class="section-title">Built with tokens</div>
      <p class="section-subtitle">
        Native HTML elements styled purely with
        <span style="font-family: 'IBM Plex Mono', monospace;">--line-*</span>
        design tokens. No components required.
      </p>

      <div class="compositions-grid">

        <!-- 1. Content card -->
        <div class="comp comp-card">
          <div class="comp-card-body">
            <h3 class="comp-card-title">Headless by design</h3>
            <p class="comp-card-text">
              Every component ships zero opinions on visuals.
              Semantic tokens and <span style="font-family: 'IBM Plex Mono', monospace;">::part()</span>
              give you full control over the look and feel.
            </p>
          </div>
          <div class="comp-card-footer">
            <span class="comp-card-footer-label">Tokens used</span>
            <span class="comp-card-footer-value">12</span>
          </div>
        </div>

        <!-- 2. Info banner -->
        <div class="comp comp-info">
          <div class="comp-info-indicator"></div>
          <div>
            <p class="comp-info-title">Schema applied</p>
            <p class="comp-info-text">
              The active color schema automatically maps 12 semantic
              stops to your chosen palette. Switch schemas and every
              surface adapts instantly.
            </p>
          </div>
        </div>

        <!-- 3. Image card -->
        <div class="comp comp-image-card">
          <div class="comp-image-placeholder">
            <div class="comp-image-icon"></div>
          </div>
          <div class="comp-image-caption">
            <h3 class="comp-image-title">Visual tokens</h3>
            <p class="comp-image-desc">
              Gradients, shadows, and radii adapt across light and
              dark modes using semantic color references.
            </p>
          </div>
        </div>

        <!-- 4. Pricing card -->
        <div class="comp comp-pricing">
          <span class="comp-pricing-plan">Pro</span>
          <div class="comp-pricing-price">
            $0<span class="comp-pricing-period"> /forever</span>
          </div>
          <ul class="comp-pricing-features">
            <li>440+ design tokens</li>
            <li>28 color palettes</li>
            <li>Light and dark modes</li>
            <li>Framework-agnostic</li>
            <li>MIT licensed</li>
          </ul>
          <button class="comp-pricing-cta" type="button">Get started</button>
        </div>

        <!-- 5. Login form -->
        <div class="comp comp-login">
          <h3 class="comp-login-heading">Sign in</h3>
          <div class="comp-login-field">
            <label class="comp-login-label">Email</label>
            <input
              class="comp-login-input"
              type="email"
              placeholder="you@example.com"
              autocomplete="off"
            />
          </div>
          <div class="comp-login-field">
            <label class="comp-login-label">Password</label>
            <input
              class="comp-login-input"
              type="password"
              placeholder="Enter password"
              autocomplete="off"
            />
          </div>
          <button class="comp-login-submit" type="button">Continue</button>
          <div class="comp-login-divider">or</div>
          <button class="comp-login-ghost" type="button">Sign in with SSO</button>
        </div>

      </div>

      <div class="section-title">Explore</div>
      <div class="card-grid">
        ${NAV_CARDS.map(
          (card) => html`
          <div class="card" @click=${() => this._navigate(card.key)}>
            <div class="card-header">
              <span class="card-category">${card.category}</span>
              ${card.tokens > 0 ? html`<span class="card-badge">${card.tokens} tokens</span>` : html``}
            </div>
            <div class="card-title">${card.title}</div>
            <div class="card-desc">${card.description}</div>
          </div>
        `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-home': ScPageHome;
  }
}
