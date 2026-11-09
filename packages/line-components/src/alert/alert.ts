import { INTERNALS, LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import {
  type ComplexAttributeConverter,
  css,
  html,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import type { AlertLive, AlertVariant } from './alert.types.js';

const VARIANTS: readonly AlertVariant[] = ['neutral', 'info', 'success', 'warning', 'danger'];

/** An unknown `variant` behaves as `neutral`; the attribute keeps what the author wrote (C8). */
const variantConverter: ComplexAttributeConverter<AlertVariant> = {
  fromAttribute: (value) => VARIANTS.find((variant) => variant === value) ?? 'neutral',
};

/** An unknown `live` behaves as `off`; the attribute keeps what the author wrote (C8; decision D12). */
const liveConverter: ComplexAttributeConverter<AlertLive> = {
  fromAttribute: (value) => (value === 'polite' || value === 'assertive' ? value : 'off'),
};

/** The zones that wrap a slot; `description` wraps the default slot (decision D4). */
type Zone = 'icon' | 'title' | 'description' | 'actions';

const DEFAULT_SLOT = 'slot:not([name])';

/**
 * `<line-alert>` is an inline box that tells the user about the state of something on the page. The consumer
 * supplies its icon, title, message and actions through slots, and `variant` colours it by meaning. It takes no
 * focus and never closes itself. A zone whose slot is empty renders no box.
 *
 * `live="polite"` or `live="assertive"` puts the `status` or `alert` role on the host through `ElementInternals`,
 * with the role's live-region properties, from the moment the host is inserted. How a screen reader announces it is
 * not verified by any automated check. Set `live` before the alert is inserted or its text changes. An author `role`
 * or `aria-live` on the host wins. Name only a live alert, because with `live="off"` the host is `generic`, which
 * takes no name. State the tone in words too, such as "Payment failed", because colour alone does not reach every
 * user.
 *
 * @summary An inline message box with a tone, an optional icon, title and actions, and an opt-in live role.
 *
 * @slot icon - One icon, usually a `<line-icon>`; decorative unless the consumer names it.
 * @slot title - A short heading; the consumer picks the element and heading level, such as `<h3 slot="title">`.
 * @slot - The message: text, paragraphs, lists or links.
 * @slot actions - Buttons or links for follow-up actions, in a wrapping row below the message.
 *
 * @csspart root - The box: background, border, radius, padding and the grid of the zones.
 * @csspart icon - Wraps the `icon` slot and sets the icon colour; hidden while the slot is empty.
 * @csspart content - The column that holds the title and the message.
 * @csspart title - Wraps the `title` slot; hidden while the slot is empty.
 * @csspart description - Wraps the default slot; hidden while it holds no element and no text other than whitespace.
 * @csspart actions - Wraps the `actions` slot; a wrapping row, hidden while the slot is empty.
 *
 * @cssprop [--line-alert-bg=var(--line-gray-bg)] - Background of `root`; `info`, `success`, `warning` and `danger` use their role, such as `var(--line-danger-bg)`.
 * @cssprop [--line-alert-color=var(--line-gray-text)] - Text colour of `root`; each variant uses its role, such as `var(--line-danger-text)`.
 * @cssprop [--line-alert-border-color=var(--line-gray-border)] - Border colour of `root`; each variant uses its role, such as `var(--line-danger-border)`.
 * @cssprop [--line-alert-icon-color=var(--line-gray-text-low)] - Colour of the `icon` zone; each variant uses its role, such as `var(--line-danger-text-low)`.
 * @cssprop [--line-alert-border-width=var(--line-border-1)] - Border width of `root`.
 * @cssprop [--line-alert-radius=var(--line-radius-2)] - Corner radius of `root`.
 * @cssprop [--line-alert-padding=var(--line-size-3)] - Padding of `root`.
 * @cssprop [--line-alert-gap=var(--line-size-2)] - Space between the zones: between the rows of `root`, after the icon, between the title and the message, and between the actions.
 */
export class LineAlert extends LineElement {
  static override properties: PropertyDeclarations = {
    variant: { reflect: true, useDefault: true, converter: variantConverter },
    live: { reflect: true, useDefault: true, converter: liveConverter, noAccessor: true },
  };

  // Border style, width and colour stay separate properties, so an invalid var() cannot reset the style to none.
  static override styles = [
    commonReset,
    css`
      :host {
        --line-alert-bg: var(--line-gray-bg);
        --line-alert-color: var(--line-gray-text);
        --line-alert-border-color: var(--line-gray-border);
        --line-alert-icon-color: var(--line-gray-text-low);
        --line-alert-border-width: var(--line-border-1);
        --line-alert-radius: var(--line-radius-2);
        --line-alert-padding: var(--line-size-3);
        --line-alert-gap: var(--line-size-2);

        display: block;
      }

      :host([hidden]) {
        display: none;
      }

      :host([variant='info']) {
        --line-alert-bg: var(--line-info-bg);
        --line-alert-color: var(--line-info-text);
        --line-alert-border-color: var(--line-info-border);
        --line-alert-icon-color: var(--line-info-text-low);
      }

      :host([variant='success']) {
        --line-alert-bg: var(--line-success-bg);
        --line-alert-color: var(--line-success-text);
        --line-alert-border-color: var(--line-success-border);
        --line-alert-icon-color: var(--line-success-text-low);
      }

      :host([variant='warning']) {
        --line-alert-bg: var(--line-warning-bg);
        --line-alert-color: var(--line-warning-text);
        --line-alert-border-color: var(--line-warning-border);
        --line-alert-icon-color: var(--line-warning-text-low);
      }

      :host([variant='danger']) {
        --line-alert-bg: var(--line-danger-bg);
        --line-alert-color: var(--line-danger-text);
        --line-alert-border-color: var(--line-danger-border);
        --line-alert-icon-color: var(--line-danger-text-low);
      }

      [part='root'] {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        column-gap: 0;
        row-gap: var(--line-alert-gap);
        padding: var(--line-alert-padding);
        border-style: solid;
        border-width: var(--line-alert-border-width);
        border-color: var(--line-alert-border-color);
        border-radius: var(--line-alert-radius);
        background-color: var(--line-alert-bg);
        color: var(--line-alert-color);
      }

      [part='icon'] {
        grid-column: 1;
        grid-row: 1;
        align-self: start;
        margin-inline-end: var(--line-alert-gap);
        color: var(--line-alert-icon-color);
      }

      [part='content'] {
        grid-column: 2;
        grid-row: 1;
        display: flex;
        flex-direction: column;
        gap: var(--line-alert-gap);
      }

      [part='actions'] {
        grid-column: 2;
        grid-row: 2;
        display: flex;
        flex-wrap: wrap;
        gap: var(--line-alert-gap);
      }
    `,
  ];

  /** The tone; it sets the colour token defaults, and an unknown value behaves as `neutral`. */
  declare variant: AlertVariant;

  #live: AlertLive = 'off';

  /** Whether each zone's slot holds content; an empty zone renders `hidden` (decision D11). */
  readonly #filled: Record<Zone, boolean> = { icon: false, title: false, description: false, actions: false };

  /**
   * Re-reads the default slot when one of its text nodes changes in place, including text a wrapper forwards through
   * its own slot. Chromium and Firefox fire no `slotchange` for such a change (spec AM-001, AM-003, AM-005).
   */
  readonly #textObserver = new MutationObserver(() => {
    this.#readZone(this.renderRoot.querySelector<HTMLSlotElement>(DEFAULT_SLOT));
  });

  constructor() {
    super();
    // `useDefault` keeps this initial value out of the attribute, so an unknown author value stays (C8).
    this.variant = 'neutral';
    // A method call, because the manifest analyser lists every `x.name =` statement of a constructor as a field.
    this.#writeRole(this.#live);
  }

  /**
   * The live role: `off` sets none, `polite` sets `status` and `assertive` sets `alert`; an unknown value behaves as
   * `off`. Set it before the alert is inserted or its text changes.
   *
   * @default 'off'
   */
  get live(): AlertLive {
    return this.#live;
  }

  set live(value: AlertLive) {
    const old = this.#live;
    this.#live = value;
    // The role changes before the next update, so an inserted host has it at once (decision D8).
    this.#writeRole(value);
    this.requestUpdate('live', old);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Text may have changed in place while the observer was off; the read also restarts the observer.
    if (this.hasUpdated) this.#readZone(this.renderRoot.querySelector<HTMLSlotElement>(DEFAULT_SLOT));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#textObserver.disconnect();
  }

  /** Writes the internals role of `live`; `off` and any unknown value set none (decisions D1, D2, D12). */
  #writeRole(live: AlertLive): void {
    this[INTERNALS].role = live === 'polite' ? 'status' : live === 'assertive' ? 'alert' : null;
  }

  #readZone(slot: HTMLSlotElement | null): void {
    if (!slot) return;
    const zone: Zone = slot.name === '' ? 'description' : (slot.name as Zone);
    const nodes = slot.assignedNodes({ flatten: true });
    // Watches the default slot's current text nodes, forwarded ones included (spec AM-005).
    if (zone === 'description') {
      this.#textObserver.disconnect();
      if (this.isConnected) {
        for (const node of nodes) {
          if (node.nodeType === Node.TEXT_NODE) this.#textObserver.observe(node, { characterData: true });
        }
      }
    }
    // A slot holds content when it holds an element, or text other than whitespace (decision D11).
    const filled = nodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() !== ''),
    );
    if (this.#filled[zone] === filled) return;
    this.#filled[zone] = filled;
    this.requestUpdate();
  }

  readonly #onSlotChange = (event: Event): void => {
    this.#readZone(event.currentTarget as HTMLSlotElement);
  };

  protected override firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    // Reads the slots once: happy-dom delivers the first `slotchange` before the listener exists.
    for (const slot of this.renderRoot.querySelectorAll('slot')) this.#readZone(slot);
  }

  override render(): TemplateResult {
    const filled = this.#filled;
    return html`<div part="root"><div part="icon" ?hidden=${!filled.icon}><slot name="icon" @slotchange=${this.#onSlotChange}></slot></div><div part="content"><div part="title" ?hidden=${!filled.title}><slot name="title" @slotchange=${this.#onSlotChange}></slot></div><div part="description" ?hidden=${!filled.description}><slot @slotchange=${this.#onSlotChange}></slot></div></div><div part="actions" ?hidden=${!filled.actions}><slot name="actions" @slotchange=${this.#onSlotChange}></slot></div></div>`;
  }
}

customElements.define('line-alert', LineAlert);

declare global {
  interface HTMLElementTagNameMap {
    'line-alert': LineAlert;
  }
}
