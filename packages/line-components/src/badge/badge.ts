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
import type { BadgeVariant } from './badge.types.js';

const VARIANTS: readonly BadgeVariant[] = ['neutral', 'info', 'success', 'warning', 'danger'];

/** An unknown `variant` behaves as `neutral`; the attribute keeps what the author wrote (C8; decision D6). */
const variantConverter: ComplexAttributeConverter<BadgeVariant> = {
  fromAttribute: (value) => VARIANTS.find((variant) => variant === value) ?? 'neutral',
};

/** The host attributes that name the badge and switch it to `img` (decisions F4, F5). */
const NAME_ATTRIBUTES = ['aria-label', 'aria-labelledby'];

/** Content is an element, or text other than whitespace (decision F1; Alert's D11 rule). */
const holdsContent = (nodes: Iterable<Node>): boolean => {
  for (const node of nodes) {
    if (node.nodeType === Node.ELEMENT_NODE) return true;
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() !== '') return true;
  }
  return false;
};

/**
 * `<line-badge>` is a small, non-interactive status marker: a count such as "5", a short label such as "Beta",
 * or, while its default slot is empty, a dot. The consumer writes the text, so a capped count such as "99+" is
 * written as "99+". `variant` colours it by meaning. It takes no focus and handles no key.
 *
 * The text is read in place, and inside a button or link it joins that control's name, such as "Inbox 5". An
 * empty badge, a dot, is hidden from assistive technology. A host `aria-label` or `aria-labelledby` makes any badge
 * an `img` with that name: name a dot whose meaning is not stated nearby, such as `aria-label="New messages"`. Both
 * are `ElementInternals` defaults, so an author `role` or `aria-hidden` on the host wins. State the meaning in words
 * too, because colour alone does not reach every user. The badge announces nothing when its text changes; for a
 * count that must be heard, set `aria-live="polite"` on the host before the count changes.
 *
 * @summary A small status marker: a count, a short label or a dot, with a tone.
 *
 * @slot - The count or the label as text, such as "5", "99+" or "Beta", or an element that adds words for assistive technology; empty for a dot.
 *
 * @csspart root - The box: fill, radius, padding and text; the dot while the slot is empty.
 *
 * @cssprop [--line-badge-bg=var(--line-gray-bg)] - Fill of `root` while it holds text; `info`, `success`, `warning` and `danger` use their role, such as `var(--line-danger-bg)`.
 * @cssprop [--line-badge-color=var(--line-gray-text)] - Text colour of `root`; each variant uses its role, such as `var(--line-danger-text)`.
 * @cssprop [--line-badge-dot-color=var(--line-gray-solid)] - Fill of the dot; each variant uses its role, such as `var(--line-danger-solid)`. An unthemed dot falls back to `currentColor`.
 * @cssprop [--line-badge-radius=var(--line-radius-round)] - Corner radius of `root`.
 * @cssprop [--line-badge-height=var(--line-size-4)] - Minimum block and inline size of `root`, so one character draws a circle.
 * @cssprop [--line-badge-padding-inline=var(--line-size-1)] - Inline padding of `root`.
 * @cssprop [--line-badge-font-size=var(--line-font-size-0)] - Font size of the text.
 * @cssprop [--line-badge-font-weight=var(--line-font-weight-5)] - Font weight of the text.
 * @cssprop [--line-badge-dot-size=var(--line-size-2)] - Block and inline size of the dot.
 */
export class LineBadge extends LineElement {
  static override properties: PropertyDeclarations = {
    variant: { reflect: true, useDefault: true, converter: variantConverter },
  };

  static override styles = [
    commonReset,
    css`
      :host {
        --line-badge-bg: var(--line-gray-bg);
        --line-badge-color: var(--line-gray-text);
        --line-badge-dot-color: var(--line-gray-solid);
        --line-badge-radius: var(--line-radius-round);
        --line-badge-height: var(--line-size-4);
        --line-badge-padding-inline: var(--line-size-1);
        --line-badge-font-size: var(--line-font-size-0);
        --line-badge-font-weight: var(--line-font-weight-5);
        --line-badge-dot-size: var(--line-size-2);

        display: inline-flex;
      }

      :host([hidden]) {
        display: none;
      }

      :host([variant='info']) {
        --line-badge-bg: var(--line-info-bg);
        --line-badge-color: var(--line-info-text);
        --line-badge-dot-color: var(--line-info-solid);
      }

      :host([variant='success']) {
        --line-badge-bg: var(--line-success-bg);
        --line-badge-color: var(--line-success-text);
        --line-badge-dot-color: var(--line-success-solid);
      }

      :host([variant='warning']) {
        --line-badge-bg: var(--line-warning-bg);
        --line-badge-color: var(--line-warning-text);
        --line-badge-dot-color: var(--line-warning-solid);
      }

      :host([variant='danger']) {
        --line-badge-bg: var(--line-danger-bg);
        --line-badge-color: var(--line-danger-text);
        --line-badge-dot-color: var(--line-danger-solid);
      }

      [part='root'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        min-block-size: var(--line-badge-height);
        min-inline-size: var(--line-badge-height);
        padding-inline: var(--line-badge-padding-inline);
        border-radius: var(--line-badge-radius);
        background-color: var(--line-badge-bg);
        color: var(--line-badge-color);
        font-size: var(--line-badge-font-size);
        font-weight: var(--line-badge-font-weight);
      }

      :host([data-empty]) [part='root'] {
        min-block-size: 0;
        min-inline-size: 0;
        block-size: var(--line-badge-dot-size);
        inline-size: var(--line-badge-dot-size);
        padding: 0;
        background-color: var(--line-badge-dot-color, currentColor);
      }
    `,
  ];

  static override get observedAttributes(): string[] {
    // biome-ignore lint/complexity/noThisInStatic: `super` runs Lit's getter for LineBadge; `LineElement.observedAttributes` lists LineElement's attributes only.
    return [...super.observedAttributes, ...NAME_ATTRIBUTES];
  }

  /** The tone; it sets the colour token defaults, and an unknown value behaves as `neutral`. */
  declare variant: BadgeVariant;

  /** Whether the default slot holds no element and no text other than whitespace (decision F1). */
  #empty = true;

  /**
   * Re-reads the slot when one of its text nodes changes in place, including text a wrapper forwards through its own
   * slot; Chromium and Firefox fire no `slotchange` for such a change (`0006-alert.md` AM-003, AM-005).
   */
  readonly #textObserver = new MutationObserver(() => {
    this.#readSlot();
  });

  constructor() {
    super();
    // `useDefault` keeps this initial value out of the attribute, so an unknown author value stays (C8).
    this.variant = 'neutral';
    // A method call, because the manifest analyser lists every `x.name =` statement of a constructor as a field.
    this.#writeSemantics(!holdsContent(this.childNodes), false);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Before the first render the light DOM stands in for the slot, so an inserted host has its semantics at once.
    if (this.hasUpdated) this.#readSlot();
    else this.#writeSemantics(!holdsContent(this.childNodes));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#textObserver.disconnect();
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    if (NAME_ATTRIBUTES.includes(name)) this.#writeSemantics(this.#empty);
  }

  /** Reads the default slot's flattened content, watches its text nodes and writes the result. */
  #readSlot(): void {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot');
    if (!slot) return;
    const nodes = slot.assignedNodes({ flatten: true });
    this.#textObserver.disconnect();
    if (this.isConnected) {
      for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) this.#textObserver.observe(node, { characterData: true });
      }
    }
    this.#writeSemantics(!holdsContent(nodes));
  }

  /**
   * Writes `empty` and the internals defaults: `img` with a non-blank `aria-label` or a non-empty `aria-labelledby`,
   * hidden while empty and unnamed, and nothing otherwise (decisions F4, F5; D7).
   */
  #writeSemantics(empty: boolean, reflect = this.isConnected): void {
    this.#empty = empty;
    const named = Boolean(this.getAttribute('aria-label')?.trim() || this.getAttribute('aria-labelledby'));
    const internals = this[INTERNALS];
    internals.role = named ? 'img' : null;
    internals.ariaHidden = !named && empty ? 'true' : null;
    // A custom element constructor may not add attributes, so the host reflection waits for the connection.
    if (reflect) this.reflectState('empty', empty);
  }

  readonly #onSlotChange = (): void => {
    this.#readSlot();
  };

  protected override firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    // Reads the slot once: happy-dom delivers the first `slotchange` before the listener exists.
    this.#readSlot();
  }

  override render(): TemplateResult {
    return html`<span part="root"><slot @slotchange=${this.#onSlotChange}></slot></span>`;
  }
}

customElements.define('line-badge', LineBadge);

declare global {
  interface HTMLElementTagNameMap {
    'line-badge': LineBadge;
  }
}
