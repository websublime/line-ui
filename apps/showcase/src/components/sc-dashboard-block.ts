import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * One notification entry consumed by `<sc-dashboard-block>`.
 *
 * `kind` selects which fixed-intent part the consumer paints:
 * `success`, `warning` or `danger`.
 */
export interface ScDashboardNotification {
  kind: 'success' | 'warning' | 'danger';
  title: string;
  body: string;
}

/**
 * One stat-card entry consumed by `<sc-dashboard-block>`.
 *
 * `intent` selects which fixed-intent part the consumer paints
 * (`info`, `success`, `warning`) — except `accent`, which is the
 * single accent-reactive stat card and inherits the picker schema.
 */
export interface ScDashboardStat {
  value: string;
  label: string;
  intent: 'info' | 'success' | 'warning' | 'accent';
}

/**
 * One toggle row consumed by `<sc-dashboard-block>`.
 */
export interface ScDashboardToggle {
  label: string;
  on: boolean;
}

/**
 * Detail payload emitted by `sc-toggle-change`.
 */
export interface ScDashboardToggleChangeDetail {
  index: number;
  on: boolean;
}

/**
 * Headless dashboard / notifications composition block.
 *
 * Defines structure and layout only — no design system tokens internally.
 * Every visual zone is exposed via `::part()` for external styling. Generic
 * CSS custom properties (without the design system prefix) allow structural
 * customisation from the consumer.
 *
 * Mirrors the headless contract established by `sc-product-card` and
 * `sc-music-player` (see docs/specs/00-spec-playground.md §0, §8.5, §16 D1).
 *
 * Three sections render in order:
 *
 * 1. **Notifications** — fixed-intent alerts (success / warning / danger).
 *    Each notif carries an additive `notif-{kind}` part so the consumer can
 *    paint with L3 intent aliases (`--line-success`, `--line-warning`,
 *    `--line-danger`). `success` and `warning` use `role="status"`;
 *    `danger` uses `role="alert"` per spec §11.
 * 2. **Stats** — a 4-card grid. Three cards are fixed-intent
 *    (`info` / `success` / `warning`); the fourth uses the `accent` intent and
 *    inherits the picker schema via `--line-solid-*`. Each card carries an
 *    additive `stat-card-{intent}` part.
 * 3. **Toggles** — real `<button role="switch" aria-checked>` controls (spec
 *    §11). Space/Enter flips state (spec §10) and emits `sc-toggle-change`
 *    with `{ index, on }`. The active toggle carries an additive
 *    `toggle-on` / `toggle-off` part so the accent-reactive "on" state can
 *    be painted independently. The accessible name is supplied via
 *    `aria-labelledby` pointing at the visible `toggle-label` span so the
 *    a11y name stays in sync with the visible text automatically.
 *
 * @fires sc-toggle-change - User flipped a toggle (click or Space/Enter). Detail: `{ index, on }`.
 */
@customElement('sc-dashboard-block')
export class ScDashboardBlock extends LitElement {
  /** Fixed-intent alerts. */
  @property({ type: Array }) notifications: ScDashboardNotification[] = [];

  /** Stat cards; the entry with `intent: 'accent'` reacts to the picker schema. */
  @property({ type: Array }) stats: ScDashboardStat[] = [];

  /** Settings toggles; flipping mutates the array via re-assignment so Lit re-renders. */
  @property({ type: Array }) toggles: ScDashboardToggle[] = [];

  static override styles = css`
    :host {
      --container-radius: 12px;
      --container-padding: 1.5rem;
      --section-gap: 1.5rem;

      --section-title-font-size: 0.75rem;
      --section-title-font-weight: 700;
      --section-title-letter-spacing: 0.08em;

      --notif-radius: 8px;
      --notif-padding: 0.875rem 1rem;
      --notif-gap: 0.75rem;
      --notif-border-width: 1px;

      --stat-card-radius: 8px;
      --stat-card-padding: 1rem;
      --stat-value-font-size: 1.5rem;
      --stat-value-font-weight: 800;
      --stat-label-font-size: 0.75rem;

      --toggle-row-height: 40px;
      --toggle-width: 40px;
      --toggle-radius: 999px;
      --toggle-thumb-size: 16px;
      /*
       * Focus-ring color for the toggle button. Defaults to currentColor
       * to preserve the prior behaviour; consumers can override via a
       * ::part(toggle) rule (or by setting this property on the host) to
       * supply a contrast-safe color when currentColor resolves close to
       * the surface background (e.g. sand-1 in the off state).
       *
       * Per the headless contract (spec section 0), this is a generic CSS
       * custom property — NO --line-* token is referenced inside the component.
       */
      --toggle-focus-ring-color: currentColor;

      display: block;
    }

    /* ── Shell ── */
    .container {
      box-sizing: border-box;
      border-radius: var(--container-radius);
      padding: var(--container-padding);
      display: flex;
      flex-direction: column;
      gap: var(--section-gap);
      width: 100%;
    }

    /* ── Sections ── */
    .section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .section-title {
      margin: 0;
      font-size: var(--section-title-font-size);
      font-weight: var(--section-title-font-weight);
      letter-spacing: var(--section-title-letter-spacing);
      text-transform: uppercase;
    }

    /* ── Notifications ── */
    .notif-row {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .notif {
      box-sizing: border-box;
      border-radius: var(--notif-radius);
      padding: var(--notif-padding);
      display: flex;
      align-items: flex-start;
      gap: var(--notif-gap);
      border: var(--notif-border-width) solid transparent;
    }

    .notif-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .notif-icon svg {
      width: 100%;
      height: 100%;
    }

    .notif-text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }

    .notif-title {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .notif-body {
      margin: 0;
      font-size: 0.8125rem;
      line-height: 1.4;
    }

    /* ── Stats ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .stat-card {
      box-sizing: border-box;
      border-radius: var(--stat-card-radius);
      padding: var(--stat-card-padding);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-value {
      font-size: var(--stat-value-font-size);
      font-weight: var(--stat-value-font-weight);
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }

    .stat-label {
      font-size: var(--stat-label-font-size);
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    /* ── Toggles ── */
    .toggle-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .toggle-row {
      box-sizing: border-box;
      min-height: var(--toggle-row-height);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.25rem 0;
    }

    .toggle-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .toggle {
      box-sizing: border-box;
      width: var(--toggle-width);
      height: calc(var(--toggle-thumb-size) + 6px);
      border-radius: var(--toggle-radius);
      border: 1px solid transparent;
      background: transparent;
      padding: 2px;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      position: relative;
      transition: background 150ms ease-in-out, border-color 150ms ease-in-out;
    }

    .toggle:focus-visible {
      outline: 2px solid var(--toggle-focus-ring-color);
      outline-offset: 2px;
    }

    .toggle::before {
      content: '';
      display: block;
      width: var(--toggle-thumb-size);
      height: var(--toggle-thumb-size);
      border-radius: 50%;
      background: currentColor;
      transition: transform 150ms ease-in-out;
    }

    .toggle[aria-checked='true']::before {
      transform: translateX(calc(var(--toggle-width) - var(--toggle-thumb-size) - 6px));
    }
  `;

  private _emitToggle(index: number, on: boolean) {
    this.dispatchEvent(
      new CustomEvent<ScDashboardToggleChangeDetail>('sc-toggle-change', {
        detail: { index, on },
        bubbles: true,
        composed: true
      })
    );
  }

  private _flipToggle = (index: number) => {
    const current = this.toggles[index];
    if (!current) return;
    const next = !current.on;
    // Re-assign the array so Lit picks up the property change and re-renders
    // (mirrors sc-music-player's playing-reflect-then-emit pattern).
    this.toggles = this.toggles.map((entry, i) => (i === index ? { ...entry, on: next } : entry));
    this._emitToggle(index, next);
  };

  private _onToggleClick = (event: MouseEvent) => {
    const target = event.currentTarget as HTMLButtonElement;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;
    this._flipToggle(index);
  };

  private _onToggleKeydown = (event: KeyboardEvent) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    const target = event.currentTarget as HTMLButtonElement;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;
    this._flipToggle(index);
  };

  private _renderNotifIcon(kind: ScDashboardNotification['kind']) {
    switch (kind) {
      case 'success':
        return html`
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M7 12.5 L10.5 16 L17 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        `;
      case 'warning':
        return html`
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 3 L22 20 L2 20 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>
            <path d="M12 10 V14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="17" r="1" fill="currentColor"/>
          </svg>
        `;
      case 'danger':
        return html`
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M8 8 L16 16 M16 8 L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;
    }
  }

  private _renderNotifications() {
    if (!this.notifications || this.notifications.length === 0) return nothing;
    return html`
      <section class="section" part="section">
        <h4 class="section-title" part="section-title">Notifications</h4>
        <div class="notif-row" part="notif-row">
          ${this.notifications.map((entry) => {
            const partAttr = `notif notif-${entry.kind}`;
            const role = entry.kind === 'danger' ? 'alert' : 'status';
            return html`
              <div class="notif" part=${partAttr} role=${role}>
                <span class="notif-icon" part="notif-icon" aria-hidden="true">
                  ${this._renderNotifIcon(entry.kind)}
                </span>
                <div class="notif-text">
                  <p class="notif-title" part="notif-title">${entry.title}</p>
                  <p class="notif-body" part="notif-body">${entry.body}</p>
                </div>
              </div>
            `;
          })}
        </div>
      </section>
    `;
  }

  private _renderStats() {
    if (!this.stats || this.stats.length === 0) return nothing;
    return html`
      <section class="section" part="section">
        <h4 class="section-title" part="section-title">Stats</h4>
        <div class="stats-grid" part="stats-grid">
          ${this.stats.map(
            (entry) => html`
              <div class="stat-card" part="stat-card stat-card-${entry.intent}">
                <span class="stat-value" part="stat-value">${entry.value}</span>
                <span class="stat-label" part="stat-label">${entry.label}</span>
              </div>
            `
          )}
        </div>
      </section>
    `;
  }

  private _renderToggles() {
    if (!this.toggles || this.toggles.length === 0) return nothing;
    return html`
      <section class="section" part="section">
        <h4 class="section-title" part="section-title">Settings</h4>
        <ul class="toggle-list" part="toggle-list">
          ${this.toggles.map((entry, index) => {
            const labelId = `sc-dashboard-toggle-label-${index}`;
            return html`
              <li class="toggle-row" part="toggle-row">
                <span class="toggle-label" part="toggle-label" id=${labelId}>${entry.label}</span>
                <button
                  class="toggle"
                  part="toggle ${entry.on ? 'toggle-on' : 'toggle-off'}"
                  type="button"
                  role="switch"
                  aria-checked=${entry.on ? 'true' : 'false'}
                  aria-labelledby=${labelId}
                  data-index=${index}
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
    /*
     * Tab order follows DOM order: notification icons are non-interactive,
     * stat cards are non-interactive, toggle buttons are the only focusable
     * elements. Each toggle is reached via Tab in array order; Space/Enter
     * flips its state per spec §10.
     */
    return html`
      <div class="container" part="container" role="region" aria-label="Dashboard">
        ${this._renderNotifications()}
        ${this._renderStats()}
        ${this._renderToggles()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-dashboard-block': ScDashboardBlock;
  }
}
