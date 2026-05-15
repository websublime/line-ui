import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { PlaygroundBlockConfig } from '../pages/playground-config.js';

/**
 * Detail payload emitted by `sc-config-change`.
 *
 * Mirrors the public contract documented in
 * `docs/specs/00-spec-playground.md` §8.7.
 */
export interface ScConfigChangeDetail {
  blockId: string;
  selector: string;
  accentReactive: boolean;
}

/**
 * Headless sidebar editor that lets the user toggle per-zone accent
 * reactivity for every block on `<sc-page-playground>`.
 *
 * Defines structure and layout only — NO design system tokens internally.
 * Every visual zone is exposed via `::part()` for external styling, and
 * generic CSS custom properties (without the design system prefix) allow
 * structural customisation from the consumer. Mirrors the headless contract
 * established by `sc-product-card`, `sc-login-block`, `sc-music-player`,
 * `sc-dashboard-block` and `sc-pricing-block` (spec §0, §8.7, §16 D1).
 *
 * The component is a **mirror** of `sc-page-playground._configs`: each
 * toggle flip emits `sc-config-change` with the originating `blockId`,
 * `selector` and the new `accentReactive` value. The page replaces its
 * `_configs` array (immutable update) and pushes the new value back via
 * the `configs` property — the component itself never mutates the prop.
 *
 * Per spec §14, baseSchema chips are **read-only this iteration**:
 * the `base-chip` part renders as a non-interactive `<span>`.
 *
 * @fires sc-config-change - User flipped a toggle (click or Space/Enter). Detail: `{ blockId, selector, accentReactive }`.
 */
@customElement('sc-schema-mapper')
export class ScSchemaMapper extends LitElement {
  /**
   * Block configs to render. Mirrors `sc-page-playground._configs`.
   *
   * The component does NOT mutate this prop; flips emit `sc-config-change`
   * and the parent is expected to recompute the array immutably and push
   * the new value back.
   */
  @property({ type: Array }) configs: PlaygroundBlockConfig[] = [];

  static override styles = css`
    :host {
      /* Shell geometry */
      --mapper-gap: 0.875rem;
      --block-padding: 0.875rem;
      --block-radius: 8px;

      /* Block heading */
      --block-title-font-size: 0.75rem;
      --block-title-font-weight: 700;

      /* Read-only base schema chip */
      --base-chip-radius: 999px;
      --base-chip-padding: 0.125rem 0.5rem;
      --base-chip-font-size: 0.6875rem;

      /* Toggle row geometry */
      --row-height: 32px;
      --row-gap: 0.5rem;

      /* Toggle geometry */
      --toggle-width: 32px;
      --toggle-height: 18px;
      --toggle-thumb-size: 12px;
      --toggle-radius: 999px;

      display: block;
    }

    .mapper {
      display: flex;
      flex-direction: column;
      gap: var(--mapper-gap);
    }

    .block {
      box-sizing: border-box;
      border-radius: var(--block-radius);
      padding: var(--block-padding);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .block-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .block-title {
      margin: 0;
      font-size: var(--block-title-font-size);
      font-weight: var(--block-title-font-weight);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .base-chip {
      display: inline-flex;
      align-items: center;
      border-radius: var(--base-chip-radius);
      padding: var(--base-chip-padding);
      font-size: var(--base-chip-font-size);
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: capitalize;
      /* Non-interactive — base schemas are read-only this iteration (spec §14). */
      user-select: none;
    }

    .element-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .element-row {
      box-sizing: border-box;
      min-height: var(--row-height);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--row-gap);
    }

    .element-label {
      font-size: 0.8125rem;
      font-weight: 500;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .element-toggle {
      box-sizing: border-box;
      width: var(--toggle-width);
      height: var(--toggle-height);
      border-radius: var(--toggle-radius);
      border: 1px solid transparent;
      background: transparent;
      padding: 2px;
      cursor: pointer;
      font-family: inherit;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      position: relative;
      transition:
        background 150ms ease-in-out,
        border-color 150ms ease-in-out;
    }

    .element-toggle:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    .element-toggle::before {
      content: '';
      display: block;
      width: var(--toggle-thumb-size);
      height: var(--toggle-thumb-size);
      border-radius: 50%;
      background: currentColor;
      transition: transform 150ms ease-in-out;
    }

    .element-toggle[aria-checked='true']::before {
      transform: translateX(
        calc(var(--toggle-width) - var(--toggle-thumb-size) - 6px)
      );
    }
  `;

  private _emitChange(blockId: string, selector: string, accentReactive: boolean) {
    this.dispatchEvent(
      new CustomEvent<ScConfigChangeDetail>('sc-config-change', {
        detail: { blockId, selector, accentReactive },
        bubbles: true,
        composed: true
      })
    );
  }

  private _flip = (blockId: string, selector: string, current: boolean) => {
    this._emitChange(blockId, selector, !current);
  };

  private _onToggleClick = (event: MouseEvent) => {
    const target = event.currentTarget as HTMLButtonElement;
    const blockId = target.dataset.blockId;
    const selector = target.dataset.selector;
    const current = target.getAttribute('aria-checked') === 'true';
    if (!(blockId && selector)) return;
    this._flip(blockId, selector, current);
  };

  private _onToggleKeydown = (event: KeyboardEvent) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    const target = event.currentTarget as HTMLButtonElement;
    const blockId = target.dataset.blockId;
    const selector = target.dataset.selector;
    const current = target.getAttribute('aria-checked') === 'true';
    if (!(blockId && selector)) return;
    this._flip(blockId, selector, current);
  };

  private _renderBlock(block: PlaygroundBlockConfig) {
    return html`
      <section class="block" part="block" aria-label=${block.title}>
        <div class="block-head">
          <h4 class="block-title" part="block-title">${block.title}</h4>
          ${block.baseSchema ? html`<span class="base-chip" part="base-chip">${block.baseSchema}</span>` : nothing}
        </div>
        <ul class="element-list">
          ${block.elements.map((entry) => {
            const toggleParts = `element-toggle ${entry.accentReactive ? 'element-toggle-on' : 'element-toggle-off'}`;
            return html`
              <li class="element-row" part="element-row">
                <span class="element-label" part="element-label">${entry.label}</span>
                <button
                  class="element-toggle"
                  part=${toggleParts}
                  type="button"
                  role="switch"
                  aria-checked=${entry.accentReactive ? 'true' : 'false'}
                  aria-label=${`${block.title} — ${entry.label}`}
                  data-block-id=${block.id}
                  data-selector=${entry.selector}
                  @click=${this._onToggleClick}
                  @keydown=${this._onToggleKeydown}
                ></button>
              </li>
            `;
          })}
        </ul>
      </section>
    `;
  }

  override render() {
    if (!this.configs || this.configs.length === 0) return nothing;
    return html`
      <div class="mapper" part="mapper">
        ${this.configs.map((block) => this._renderBlock(block))}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-schema-mapper': ScSchemaMapper;
  }
}
