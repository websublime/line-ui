import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * One feature row consumed by `<sc-pricing-block>`.
 *
 * `available: true` renders the `feature-check` glyph (consumer paints with
 * `--line-success`). `available: false` renders the `feature-dash` glyph
 * (consumer paints with `--line-gray-8` / `--line-low-contrast`).
 */
export interface ScPricingFeature {
  available: boolean;
  text: string;
}

/**
 * Semantic role of a pricing tier.
 *
 * - `'free'` — neutral baseline (no additive card part beyond `tier-card`).
 * - `'featured'` — the "Recommended" / accent-reactive tier; carries the
 *   additive `tier-card-featured` part and a `badge` part.
 * - `'enterprise'` — the complement-schema tier; carries the additive
 *   `tier-card-enterprise` part.
 *
 * Explicit `role` replaces the prior name-based detection so display strings
 * (e.g. localisation) do not couple to which card part is painted.
 */
export type ScPricingTierRole = 'free' | 'featured' | 'enterprise';

/**
 * One pricing tier consumed by `<sc-pricing-block>`.
 *
 * `weight` selects which CTA part the consumer paints (`cta-ghost` /
 * `cta-solid` / `cta-outline`).
 *
 * `role` is the SEMANTIC tier identifier (see {@link ScPricingTierRole}).
 * It is optional for backwards compatibility — when omitted, the role is
 * derived from `name` (`'Pro'` → `'featured'`, `'Enterprise'` → `'enterprise'`,
 * everything else → `'free'`). New call sites should always pass `role`
 * explicitly so display strings remain free to change without breaking which
 * additive card part is painted.
 */
export interface ScPricingTier {
  name: string;
  price: string;
  period?: string;
  features: ScPricingFeature[];
  cta: string;
  weight: 'ghost' | 'solid' | 'outline';
  /**
   * Semantic tier role. If omitted, falls back to name-based detection for
   * backwards compatibility (`'Pro'` → `'featured'`, `'Enterprise'` →
   * `'enterprise'`, otherwise `'free'`).
   */
  role?: ScPricingTierRole;
}

/**
 * Detail payload emitted by `sc-pricing-cta`.
 */
export interface ScPricingCtaDetail {
  tierIndex: number;
}

/**
 * Headless 3-tier pricing / comparison block.
 *
 * Defines structure and layout only — no design system tokens internally.
 * Every visual zone is exposed via `::part()` for external styling. Generic
 * CSS custom properties (without the design system prefix) declared on
 * `:host` allow structural customisation from the consumer.
 *
 * Mirrors the headless contract established by `sc-product-card`,
 * `sc-music-player` and `sc-dashboard-block`. See
 * `docs/specs/00-spec-playground.md` §0 (architectural constraint),
 * §8.6 (API and 17-part contract), §14.5 (shadow-DOM scoping constraint),
 * §15.1 (sc-pricing-block accent / complement application) and §16 D6
 * (2026-05-14 amendment).
 *
 * Three tiers render in display order:
 *
 * 1. **Free** — neutral defaults. No additive part beyond `tier-card`.
 *    The consumer paints the surface from light-DOM neutrals (or the page
 *    base schema).
 * 2. **Pro** — carries the additive `tier-card-featured` part and a
 *    "Recommended" badge (`badge` part). Inherits the active accent via
 *    `--line-solid-*` from `body.line-schema-{accent}` through the shadow
 *    DOM boundary (spec §14.5 mechanism 1).
 * 3. **Enterprise** — carries the additive `tier-card-enterprise` part.
 *    Consumes the six `--complement-*` host custom properties that the
 *    consumer page sets inline, derived from
 *    `complementSchema(accentSchema)` (spec §14.5 mechanism 2).
 *
 * Each CTA is a real `<button type="button">` so Enter / Space activate
 * natively (spec §10). Clicks emit `sc-pricing-cta` with `{ tierIndex }`.
 *
 * Tier cards use `role="group" aria-labelledby="…"` pointing at the
 * tier-name id (spec §11). Feature rows are list items whose icon span
 * is `aria-hidden` while the `<li>` itself carries
 * `aria-label="included"` / `aria-label="not included"`.
 *
 * @fires sc-pricing-cta - User clicked a tier CTA. Detail: `{ tierIndex }`.
 */
@customElement('sc-pricing-block')
export class ScPricingBlock extends LitElement {
  /** Active accent schema (used by the consumer to compute the complement). */
  @property({ type: String, attribute: 'accent-schema' }) accentSchema = '';

  /** Tier cards in display order (Free → Pro → Enterprise). */
  @property({ type: Array }) tiers: ScPricingTier[] = [];

  static override styles = css`
    :host {
      /* ── Grid / shell geometry ── */
      --grid-gap: 1rem;

      /* ── Tier card shell ── */
      --card-radius: 12px;
      --card-padding: 1.5rem;
      --card-border-width: 1px;

      /* ── "Recommended" badge ── */
      --badge-radius: 999px;
      --badge-padding: 0.25rem 0.75rem;
      --badge-font-size: 0.6875rem;
      --badge-font-weight: 700;

      /* ── Tier heading ── */
      --tier-name-font-size: 1rem;
      --tier-name-font-weight: 700;

      /* ── Price typography ── */
      --amount-font-size: 2rem;
      --amount-font-weight: 800;
      --period-font-size: 0.875rem;

      /* ── Feature list ── */
      --feature-font-size: 0.875rem;
      --feature-gap: 0.5rem;

      /* ── CTA (all weights share these geometric tokens) ── */
      --cta-padding: 0.625rem 1rem;
      --cta-radius: 8px;
      --cta-font-size: 0.875rem;
      --cta-font-weight: 700;
      --cta-border-width: 1px;

      /*
       * Complement host custom properties — neutral defaults. The consumer
       * overrides these inline on the host element using
       * complementSchema(accent) to produce the Enterprise tier accent
       * (spec §14.5 mechanism 2, §15.1).
       */
      --complement-solid: transparent;
      --complement-text: currentColor;
      --complement-hover: transparent;
      --complement-border: currentColor;
      --complement-low-contrast: currentColor;
      --complement-high-contrast: currentColor;

      display: block;
    }

    /* ── Shell ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--grid-gap);
      width: 100%;
      box-sizing: border-box;
    }

    @media (max-width: 640px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }

    /* ── Tier card ── */
    .tier-card {
      position: relative;
      box-sizing: border-box;
      border-radius: var(--card-radius);
      padding: var(--card-padding);
      border: var(--card-border-width) solid transparent;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 0;
    }

    /* ── Badge ── */
    .badge {
      align-self: flex-start;
      border-radius: var(--badge-radius);
      padding: var(--badge-padding);
      font-size: var(--badge-font-size);
      font-weight: var(--badge-font-weight);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      line-height: 1;
    }

    /* ── Tier name ── */
    .tier-name {
      margin: 0;
      font-size: var(--tier-name-font-size);
      font-weight: var(--tier-name-font-weight);
      letter-spacing: 0.02em;
    }

    /* ── Price ── */
    .price {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .price-amount {
      font-size: var(--amount-font-size);
      font-weight: var(--amount-font-weight);
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }

    .price-period {
      font-size: var(--period-font-size);
      font-weight: 500;
    }

    /* ── Features list ── */
    .features {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--feature-gap);
      flex: 1 1 auto;
    }

    .feature {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: var(--feature-font-size);
      line-height: 1.4;
    }

    .feature-check,
    .feature-dash {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.125rem;
    }

    .feature-check svg,
    .feature-dash svg {
      width: 100%;
      height: 100%;
    }

    /* ── CTA ── */
    .cta {
      box-sizing: border-box;
      padding: var(--cta-padding);
      border-radius: var(--cta-radius);
      font-size: var(--cta-font-size);
      font-weight: var(--cta-font-weight);
      font-family: inherit;
      border: var(--cta-border-width) solid transparent;
      cursor: pointer;
      width: 100%;
      transition:
        background 150ms ease-in-out,
        border-color 150ms ease-in-out,
        color 150ms ease-in-out;
    }

    .cta:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
  `;

  private _emitCta(tierIndex: number) {
    this.dispatchEvent(
      new CustomEvent<ScPricingCtaDetail>('sc-pricing-cta', {
        detail: { tierIndex },
        bubbles: true,
        composed: true
      })
    );
  }

  private _onCtaClick = (event: MouseEvent) => {
    const target = event.currentTarget as HTMLButtonElement;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;
    this._emitCta(index);
  };

  private _renderCheckIcon() {
    return html`
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M5 12.5 L10 17 L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    `;
  }

  private _renderDashIcon() {
    return html`
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M5 12 L19 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `;
  }

  private _renderFeatures(features: ScPricingFeature[]) {
    return html`
      <ul class="features" part="features">
        ${features.map((entry) => {
          const label = entry.available ? 'included' : 'not included';
          return html`
            <li class="feature" part="feature" aria-label=${label}>
              ${
                entry.available
                  ? html`
                    <span class="feature-check" part="feature-check">
                      ${this._renderCheckIcon()}
                    </span>
                  `
                  : html`
                    <span class="feature-dash" part="feature-dash">
                      ${this._renderDashIcon()}
                    </span>
                  `
              }
              <span class="feature-text">${entry.text}</span>
            </li>
          `;
        })}
      </ul>
    `;
  }

  private _renderTier(tier: ScPricingTier, index: number) {
    /*
     * Prefer the explicit `role` field; fall back to legacy name-based
     * detection for backwards compatibility with consumers that have not
     * yet been updated.
     */
    const role: ScPricingTierRole =
      tier.role ?? (tier.name === 'Pro' ? 'featured' : tier.name === 'Enterprise' ? 'enterprise' : 'free');
    const isFeatured = role === 'featured';
    const isEnterprise = role === 'enterprise';
    const cardPartTokens = [
      'tier-card',
      isFeatured ? 'tier-card-featured' : '',
      isEnterprise ? 'tier-card-enterprise' : ''
    ].filter(Boolean);
    const cardPart = cardPartTokens.join(' ');
    const ctaPart = `cta cta-${tier.weight}`;
    const headingId = `sc-pricing-tier-${index}`;

    return html`
      <article class="tier-card" part=${cardPart} role="group" aria-labelledby=${headingId}>
        ${isFeatured ? html`<span class="badge" part="badge">Recommended</span>` : nothing}
        <h4 class="tier-name" part="tier-name" id=${headingId}>${tier.name}</h4>
        <div class="price" part="price">
          <span class="price-amount" part="price-amount">${tier.price}</span>
          ${tier.period ? html`<span class="price-period" part="price-period">${tier.period}</span>` : nothing}
        </div>
        ${this._renderFeatures(tier.features)}
        <button
          class="cta"
          part=${ctaPart}
          type="button"
          data-index=${index}
          @click=${this._onCtaClick}
        >
          ${tier.cta}
        </button>
      </article>
    `;
  }

  override render() {
    /*
     * Tab order follows DOM order: each tier CTA is reached via Tab in
     * array order. Enter / Space activates the button natively and emits
     * sc-pricing-cta with { tierIndex } (spec §10).
     */
    return html`
      <div class="grid" part="grid">
        ${this.tiers.map((tier, index) => this._renderTier(tier, index))}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-pricing-block': ScPricingBlock;
  }
}
