import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Headless e-commerce product card component.
 *
 * Defines structure and layout only — no design system tokens internally.
 * Every visual zone is exposed via `::part()` for external styling.
 *
 * Generic CSS custom properties (no `--line-*` prefix) allow structural
 * customisation from the consumer.
 */
@customElement('sc-product-card')
export class ScProductCard extends LitElement {
  /** Product title */
  @property({ type: String }) heading = '';

  /** Product description text */
  @property({ type: String }) description = '';

  /** Product price display string */
  @property({ type: String }) price = '';

  /** Rating display string (e.g. "★★★★☆") */
  @property({ type: String }) rating = '';

  /** Accessible label for rating (e.g. "4 out of 5 stars") */
  @property({ type: String, attribute: 'rating-label' }) ratingLabel = '';

  /** Image src URL */
  @property({ type: String, attribute: 'image-src' }) imageSrc = '';

  /** Image alt text */
  @property({ type: String, attribute: 'image-alt' }) imageAlt = '';

  /** Button label text */
  @property({ type: String, attribute: 'button-label' }) buttonLabel = 'Add to Cart';

  /** Tracks whether the image failed to load, triggering placeholder rendering */
  @state() private _imageError = false;

  /** Comma-separated list of size chip labels (e.g. "S,M,L,XL") */
  @property({ type: String }) sizes = '';

  /** Index of the active size chip (0-based) */
  @property({ type: Number, attribute: 'active-size' }) activeSize = -1;

  /**
   * Color dot definitions as JSON string array of objects.
   * Each object: { color: string; label: string; selected?: boolean }
   */
  @property({ type: Array }) colors: { color: string; label: string; selected?: boolean }[] = [];

  static override styles = css`
    :host {
      --card-radius: 8px;
      --card-padding: 1.25rem;
      --card-gap: 1rem;
      --card-image-height: 200px;
      --card-border-width: 1px;

      --title-font-size: 1rem;
      --title-font-weight: 700;
      --title-letter-spacing: -0.01em;

      --desc-font-size: 0.875rem;
      --desc-line-height: 1.6;

      --price-font-size: 1.25rem;
      --price-font-weight: 800;

      --rating-font-size: 0.875rem;
      --rating-letter-spacing: 0.05em;

      --chip-min-width: 36px;
      --chip-height: 32px;
      --chip-padding-inline: 0.5rem;
      --chip-radius: 4px;
      --chip-font-size: 0.75rem;
      --chip-font-weight: 600;
      --chip-border-width: 1px;

      --dot-size: 20px;
      --dot-border-width: 2px;

      --button-padding: 1rem;
      --button-radius: 4px;
      --button-font-size: 0.875rem;
      --button-font-weight: 700;

      --placeholder-icon-size: 64px;

      display: block;
    }

    /* ── Card shell ── */
    .card {
      border-radius: var(--card-radius);
      overflow: hidden;
      border: var(--card-border-width) solid;
      border-color: transparent;
      display: flex;
      flex-direction: column;
    }

    /* ── Image ── */
    .image {
      width: 100%;
      height: var(--card-image-height);
      object-fit: cover;
      display: block;
    }

    .image-placeholder {
      width: 100%;
      height: var(--card-image-height);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-placeholder svg {
      width: var(--placeholder-icon-size);
      height: var(--placeholder-icon-size);
      opacity: 0.4;
    }

    /* ── Body ── */
    .body {
      padding: var(--card-padding);
      display: flex;
      flex-direction: column;
      gap: var(--card-gap);
      flex: 1;
    }

    /* ── Title ── */
    .title {
      font-size: var(--title-font-size);
      font-weight: var(--title-font-weight);
      letter-spacing: var(--title-letter-spacing);
      margin: 0;
    }

    /* ── Description ── */
    .description {
      font-size: var(--desc-font-size);
      line-height: var(--desc-line-height);
      margin: 0;
    }

    /* ── Price row ── */
    .price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .price {
      font-size: var(--price-font-size);
      font-weight: var(--price-font-weight);
    }

    .rating {
      font-size: var(--rating-font-size);
      letter-spacing: var(--rating-letter-spacing);
    }

    /* ── Size chips ── */
    .size-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: var(--chip-min-width);
      height: var(--chip-height);
      padding: 0 var(--chip-padding-inline);
      border-radius: var(--chip-radius);
      font-size: var(--chip-font-size);
      font-weight: var(--chip-font-weight);
      cursor: pointer;
      border: var(--chip-border-width) solid;
      border-color: transparent;
      transition: all 150ms ease-in-out;
    }

    /* ── Color dots ── */
    .color-dots {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .dot {
      width: var(--dot-size);
      height: var(--dot-size);
      border-radius: 50%;
      cursor: pointer;
      border: var(--dot-border-width) solid transparent;
      transition: border-color 150ms ease-in-out;
    }

    /* ── Button ── */
    .button {
      width: 100%;
      padding: var(--button-padding);
      border: none;
      border-radius: var(--button-radius);
      font-size: var(--button-font-size);
      font-weight: var(--button-font-weight);
      cursor: pointer;
      transition: background 150ms ease-in-out;
      margin-top: auto;
    }
  `;

  private _handleImageError() {
    this._imageError = true;
  }

  private _renderSizeChips() {
    if (!this.sizes) return nothing;
    const labels = this.sizes.split(',').map((s) => s.trim());
    return html`
      <div class="size-chips" part="size-chips">
        ${labels.map(
          (label, i) => html`
            <span
              class="chip ${i === this.activeSize ? 'active' : ''}"
              part="chip ${i === this.activeSize ? 'chip-active' : ''}"
            >${label}</span>
          `
        )}
      </div>
    `;
  }

  private _renderColorDots() {
    if (!this.colors || this.colors.length === 0) return nothing;
    // NOTE: Showcase-only pattern. Color values come from the consumer via .colors
    // property binding and are inserted as inline styles. In production line://ui
    // components, user-supplied values must be sanitized before inline style injection
    // to prevent CSS injection vectors (e.g. url() exfiltration via background-image).
    return html`
      <div class="color-dots" part="color-dots">
        ${this.colors.map(
          (c) => html`
            <span
              class="dot ${c.selected ? 'selected' : ''}"
              part="dot ${c.selected ? 'dot-selected' : ''}"
              title=${c.label}
              style="background: ${c.color}"
            ></span>
          `
        )}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="card" part="card">
        ${
          this.imageSrc && !this._imageError
            ? html`
              <img
                class="image"
                part="image"
                src=${this.imageSrc}
                alt=${this.imageAlt}
                loading="lazy"
                @error=${this._handleImageError}
              />
            `
            : html`
              <div class="image-placeholder" part="image-placeholder">
                <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="12" width="48" height="36" rx="4" stroke="currentColor" stroke-width="2"/>
                  <circle cx="22" cy="26" r="5" stroke="currentColor" stroke-width="2"/>
                  <path d="M8 40 L24 28 L36 38 L44 32 L56 42" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </div>
            `
        }
        <div class="body" part="body">
          <h3 class="title" part="title">${this.heading}</h3>
          ${this.description ? html`<p class="description" part="description">${this.description}</p>` : nothing}
          ${
            this.price || this.rating
              ? html`
                <div class="price-row" part="price-row">
                  ${this.price ? html`<span class="price" part="price">${this.price}</span>` : nothing}
                  ${
                    this.rating
                      ? html`<span class="rating" part="rating" aria-label=${this.ratingLabel || ''}>${this.rating}</span>`
                      : nothing
                  }
                </div>
              `
              : nothing
          }
          ${this._renderSizeChips()}
          ${this._renderColorDots()}
          <button class="button" part="button" type="button">${this.buttonLabel}</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-product-card': ScProductCard;
  }
}
