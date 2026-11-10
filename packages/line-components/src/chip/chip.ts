import { LineElement } from '@websublime/line-core';
import { LineMachineController } from '@websublime/line-core/machine';
import { buttonReset, commonReset } from '@websublime/line-core/styles';
import type { Machine } from '@zag-js/core';
import { connect, machine } from '@zag-js/toggle';
import {
  type ComplexAttributeConverter,
  css,
  html,
  LitElement,
  nothing,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { ChipVariant, LineChipChangeDetail } from './chip.types.js';

/** The schema of the `@zag-js/toggle` machine, which the package does not export by name. */
type ToggleSchema = typeof machine extends Machine<infer T> ? T : never;

const VARIANTS: readonly ChipVariant[] = ['default', 'primary'];

/** An unknown `variant` behaves as `default`; the attribute keeps what the author wrote. */
const variantConverter: ComplexAttributeConverter<ChipVariant> = {
  fromAttribute: (value) => VARIANTS.find((variant) => variant === value) ?? 'default',
};

/** A present attribute is `true`, except `"false"`; `true` reflects as an empty attribute and `false` as none. */
const pressedConverter: ComplexAttributeConverter<boolean> = {
  fromAttribute: (value) => value !== null && value !== 'false',
  toAttribute: (value) => (value ? '' : null),
};

/**
 * The normaliser `connect()` takes. The chip reads only the API's `pressed` and `disabled`, so every element
 * normaliser returns its props unchanged.
 */
const identity = new Proxy({}, { get: () => (props: object) => props }) as Parameters<typeof connect>[1];

/**
 * `<line-chip>` is a compact toggle button for a category, a filter or a
 * selection. Each press turns it on or off and fires `line-change`. It renders
 * a native `<button type="button" aria-pressed>` in its shadow root and is not
 * form-associated, so it never submits or resets a form and adds nothing to the
 * form data. The `@zag-js/toggle` machine holds the pressed state.
 *
 * @summary A compact toggle button for a category or a filter: each press flips `pressed` and fires `line-change`.
 *
 * @slot - The label, usually text; it names the chip.
 * @slot prefix - A leading icon, usually one decorative `<line-icon>`.
 * @slot suffix - Non-interactive trailing content, such as a count or a decorative `<line-icon>`; never a remove button or another control, which a native `<button>` cannot hold.
 * @slot indicator - A pressed mark, usually a decorative check `<line-icon>`; rendered only while `pressed` is on.
 *
 * @csspart root - The inner native `<button>`: box, background, border and focus ring.
 * @csspart indicator - Wraps the `indicator` slot; present only while `pressed` is on.
 * @csspart label - Wraps the default slot.
 *
 * @cssprop [--line-chip-radius=var(--line-radius-round)] - Corner radius of `root`.
 * @cssprop [--line-chip-bg=var(--line-gray-bg)] - Background of `root`; pressed uses `var(--line-accent-bg)`, `primary` uses `transparent` and pressed `primary` uses `var(--line-accent-solid)`.
 * @cssprop [--line-chip-color=var(--line-gray-text)] - Text colour of `root`; pressed and `primary` use `var(--line-accent-text)`, and pressed `primary` uses `var(--line-accent-contrast)`.
 * @cssprop [--line-chip-border-color=var(--line-gray-border)] - Border colour of `root`; pressed and `primary` use `var(--line-accent-border)`, and pressed `primary` uses `var(--line-accent-solid)`.
 * @cssprop [--line-chip-border-width=var(--line-border-1)] - Border width of `root`.
 * @cssprop [--line-chip-height=var(--line-size-6)] - Minimum block size of `root`.
 * @cssprop [--line-chip-padding-inline=var(--line-size-3)] - Inline padding of `root`.
 * @cssprop [--line-chip-gap=var(--line-size-1)] - Gap between the indicator, prefix, label and suffix zones.
 * @cssprop [--line-chip-font-size=var(--line-font-size-1)] - Font size of `root`.
 * @cssprop [--line-chip-font-weight=var(--line-font-weight-5)] - Font weight of `root`.
 * @cssprop [--line-chip-focus-ring=var(--line-focus-ring, 2px solid currentColor)] - `outline` of `root` while the host has `data-focus-visible`.
 *
 * @fires {CustomEvent<LineChipChangeDetail>} line-change - A user press flipped `pressed`; `detail.value` is the new state. Bubbles, not composed. Never fires for a change through the property or the attribute.
 */
export class LineChip extends LineElement {
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties: PropertyDeclarations = {
    variant: { reflect: true, useDefault: true, converter: variantConverter },
    pressed: { reflect: true, useDefault: true, converter: pressedConverter },
    disabled: { type: Boolean, reflect: true },
    ariaLabel: { attribute: 'aria-label', reflect: true },
    ariaDescription: { attribute: 'aria-description', reflect: true },
  };

  static override styles = [
    commonReset,
    buttonReset,
    css`
      :host {
        --line-chip-radius: var(--line-radius-round);
        --line-chip-bg: var(--line-gray-bg);
        --line-chip-color: var(--line-gray-text);
        --line-chip-border-color: var(--line-gray-border);
        --line-chip-border-width: var(--line-border-1);
        --line-chip-height: var(--line-size-6);
        --line-chip-padding-inline: var(--line-size-3);
        --line-chip-gap: var(--line-size-1);
        --line-chip-font-size: var(--line-font-size-1);
        --line-chip-font-weight: var(--line-font-weight-5);
        --line-chip-focus-ring: var(--line-focus-ring, 2px solid currentColor);

        display: inline-block;
      }

      :host([hidden]) {
        display: none;
      }

      :host([data-pressed]) {
        --line-chip-bg: var(--line-accent-bg);
        --line-chip-color: var(--line-accent-text);
        --line-chip-border-color: var(--line-accent-border);
      }

      :host([variant='primary']) {
        --line-chip-bg: transparent;
        --line-chip-color: var(--line-accent-text);
        --line-chip-border-color: var(--line-accent-border);
      }

      :host([variant='primary'][data-pressed]) {
        --line-chip-bg: var(--line-accent-solid);
        --line-chip-color: var(--line-accent-contrast);
        --line-chip-border-color: var(--line-accent-solid);
      }

      [part='root'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--line-chip-gap);
        inline-size: 100%;
        min-block-size: var(--line-chip-height);
        padding-inline: var(--line-chip-padding-inline);
        border-style: solid;
        border-width: var(--line-chip-border-width);
        border-color: var(--line-chip-border-color);
        border-radius: var(--line-chip-radius);
        background: var(--line-chip-bg);
        color: var(--line-chip-color);
        font-size: var(--line-chip-font-size);
        font-weight: var(--line-chip-font-weight);
      }

      :host([data-focus-visible]) [part='root'] {
        outline: var(--line-chip-focus-ring);
      }
    `,
  ];

  /** Semantic emphasis; an unknown value behaves as `default`. */
  declare variant: ChipVariant;
  /** Whether the chip is on; a user press flips it and fires `line-change`. */
  declare pressed: boolean;
  /** Removes the chip from the tab order and blocks activation. */
  declare disabled: boolean;
  /** Copied to the inner button, where it names the role. */
  declare ariaLabel: string | null;
  /** Copied to the inner button. */
  declare ariaDescription: string | null;

  /** Keyboard focus on the inner button; the toggle machine tracks no focus (ARCH §14.9). */
  #focusVisible = false;

  readonly #onPressedChange = (next: boolean): void => {
    this.pressed = next;
    this.dispatchEvent(
      new CustomEvent<LineChipChangeDetail>('line-change', {
        detail: { value: next },
        bubbles: true,
        composed: false,
      }),
    );
  };

  /**
   * The machine props, read live. `pressed` and `disabled` are always booleans, even when code sets `undefined`, so
   * the machine's `pressed` stays controlled by the property.
   */
  readonly #machineProps = () => ({
    pressed: this.pressed === true,
    disabled: this.disabled === true,
    onPressedChange: this.#onPressedChange,
  });

  readonly #ctrl = new LineMachineController<ToggleSchema>(this, { machine, props: this.#machineProps });

  constructor() {
    super();
    // `useDefault` keeps these initial values out of the attributes, so an author value stays as written (C8).
    this.variant = 'default';
    this.pressed = false;
    this.disabled = false;
    this.addEventListener('click', this.#onClick, { capture: true });
  }

  /** The machine's pressed and disabled state, or the host props when the machine failed to start. */
  #state(): { pressed: boolean; disabled: boolean } {
    const service = this.#ctrl.service;
    const { pressed, disabled } = service && !this.#ctrl.fallback ? connect(service, identity) : this.#machineProps();
    return { pressed, disabled };
  }

  /**
   * Stops a click while the chip is disabled. It listens in the capture phase,
   * so it runs before every bubble listener on the host and its ancestors.
   * Otherwise it flips the chip in a later task, once the click dispatch has
   * ended, unless a listener called `preventDefault()`.
   */
  readonly #onClick = (event: MouseEvent): void => {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    setTimeout(() => {
      if (!event.defaultPrevented) this.#toggle();
    });
  };

  /**
   * The toggle machine has no `disabled` guard, so the chip checks it before it
   * sends. Without a machine the chip flips itself (MANIFESTO Law 9).
   */
  #toggle(): void {
    if (this.disabled) return;
    if (this.#ctrl.fallback) this.#onPressedChange(!this.pressed);
    else this.#ctrl.send({ type: 'PRESS.TOGGLE' });
  }

  readonly #onFocus = (event: FocusEvent): void => {
    this.#focusVisible = (event.currentTarget as HTMLButtonElement).matches(':focus-visible');
    this.requestUpdate();
  };

  readonly #onBlur = (): void => {
    this.#focusVisible = false;
    this.requestUpdate();
  };

  protected override update(changed: PropertyValues<this>): void {
    const { pressed, disabled } = this.#state();
    this.reflectState('pressed', pressed);
    this.reflectState('disabled', disabled);
    this.reflectState('focus-visible', this.#focusVisible);
    super.update(changed);
  }

  override render(): TemplateResult {
    const { pressed, disabled } = this.#state();
    return html`<button
      part="root"
      type="button"
      ?disabled=${disabled}
      aria-pressed=${String(pressed)}
      aria-label=${ifDefined(this.ariaLabel ?? undefined)}
      aria-description=${ifDefined(this.ariaDescription ?? undefined)}
      @focus=${this.#onFocus}
      @blur=${this.#onBlur}
    >${
      pressed ? html`<span part="indicator"><slot name="indicator"></slot></span>` : nothing
    }<slot name="prefix"></slot><span part="label"><slot></slot></span><slot name="suffix"></slot></button>`;
  }
}

customElements.define('line-chip', LineChip);

declare global {
  interface HTMLElementTagNameMap {
    'line-chip': LineChip;
  }
}
