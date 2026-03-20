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

    /* ── Hero ── */
    .hero {
      text-align: center;
      padding: var(--line-size-11, 7.5rem) 0 var(--line-size-8, 3rem);
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
