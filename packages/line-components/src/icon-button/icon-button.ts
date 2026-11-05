import { LineElement } from '@websublime/line-core';
import { LineMachineController } from '@websublime/line-core/machine';
import { buttonReset, commonReset } from '@websublime/line-core/styles';
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
import {
  type ButtonApi,
  type ButtonMachineProps,
  type ButtonMachineSchema,
  buttonMachine,
  connect,
  connectStatic,
} from '../shared/button-machine.js';
import type { IconButtonVariant, LineIconButtonChangeDetail } from './icon-button.types.js';

const VARIANTS: readonly IconButtonVariant[] = ['default', 'primary', 'borderless'];

/** An unknown `variant` behaves as `default`; the attribute keeps what the author wrote. */
const variantConverter: ComplexAttributeConverter<IconButtonVariant> = {
  fromAttribute: (value) => VARIANTS.find((variant) => variant === value) ?? 'default',
};

/** Absent means not a toggle; `"false"` parses to `false` and any other value to `true`. */
const pressedConverter: ComplexAttributeConverter<boolean | undefined> = {
  fromAttribute: (value) => (value === null ? undefined : value !== 'false'),
  toAttribute: (value) => (value === undefined ? null : String(value)),
};

/**
 * `<line-icon-button>` runs an action when the user activates it, and shows
 * only an icon. It renders a native `<button type="button">` in its shadow
 * root and is not form-associated, so it never submits or resets a form. It
 * has no visible text: the host `aria-label` names the inner button. `pressed`
 * makes it a toggle; `loading` keeps it focusable while it ignores presses.
 *
 * @summary A square button that shows only an icon, named by its `aria-label`, and runs an action or toggles with `pressed`.
 *
 * @slot - The icon, usually one decorative `<line-icon>`.
 * @slot loading - A spinner, loading text or both; rendered only while `loading` is on.
 *
 * @csspart root - The inner native `<button>`: square box, background, border and focus ring.
 * @csspart icon - Wraps the default slot.
 * @csspart loading - Wraps the `loading` slot; present only while `loading` is on.
 *
 * @cssprop [--line-icon-button-radius=var(--line-radius-2)] - Corner radius of `root`.
 * @cssprop [--line-icon-button-bg=var(--line-gray-bg)] - Background of `root`; `primary` uses `var(--line-accent-solid)` and `borderless` uses `transparent`.
 * @cssprop [--line-icon-button-color=var(--line-gray-text)] - Icon colour of `root`; `primary` uses `var(--line-accent-contrast)` and `borderless` uses `var(--line-accent-text)`.
 * @cssprop [--line-icon-button-size=var(--line-size-7)] - Minimum inline and block size of `root`, which makes the square box.
 * @cssprop [--line-icon-button-font-size=var(--line-font-size-1)] - Font size of `root`; a slotted `<line-icon>` at its `1em` default follows it.
 * @cssprop [--line-icon-button-focus-ring=var(--line-focus-ring, 2px solid currentColor)] - `outline` of `root` while the host has `data-focus-visible`.
 *
 * @fires {CustomEvent<LineIconButtonChangeDetail>} line-change - A user activation flipped `pressed` on a toggle icon button; `detail.value` is the new state. Bubbles, not composed.
 */
export class LineIconButton extends LineElement {
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties: PropertyDeclarations = {
    variant: { reflect: true, useDefault: true, converter: variantConverter },
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    pressed: { reflect: true, converter: pressedConverter },
    ariaLabel: { attribute: 'aria-label', reflect: true },
    ariaDescription: { attribute: 'aria-description', reflect: true },
  };

  static override styles = [
    commonReset,
    buttonReset,
    css`
      :host {
        --line-icon-button-radius: var(--line-radius-2);
        --line-icon-button-bg: var(--line-gray-bg);
        --line-icon-button-color: var(--line-gray-text);
        --line-icon-button-size: var(--line-size-7);
        --line-icon-button-font-size: var(--line-font-size-1);
        --line-icon-button-focus-ring: var(--line-focus-ring, 2px solid currentColor);

        display: inline-block;
      }

      :host([hidden]) {
        display: none;
      }

      :host([variant='primary']) {
        --line-icon-button-bg: var(--line-accent-solid);
        --line-icon-button-color: var(--line-accent-contrast);
      }

      :host([variant='borderless']) {
        --line-icon-button-bg: transparent;
        --line-icon-button-color: var(--line-accent-text);
      }

      [part='root'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-inline-size: var(--line-icon-button-size);
        min-block-size: var(--line-icon-button-size);
        padding-inline: 0;
        border-radius: var(--line-icon-button-radius);
        background: var(--line-icon-button-bg);
        color: var(--line-icon-button-color);
        font-size: var(--line-icon-button-font-size);
      }

      [part='icon'] {
        display: inline-flex;
      }

      :host([data-focus-visible]) [part='root'] {
        outline: var(--line-icon-button-focus-ring);
      }
    `,
  ];

  /** Semantic emphasis; an unknown value behaves as `default`. */
  declare variant: IconButtonVariant;
  /** Removes the button from the tab order and blocks activation. */
  declare disabled: boolean;
  /** Keeps focus, sets `aria-disabled="true"`, blocks activation and renders the `loading` part. */
  declare loading: boolean;
  /** `undefined` means not a toggle; a toggle flips it on each activation and fires `line-change`. */
  declare pressed: boolean | undefined;
  /** Copied to the inner button, where it names the role; an icon button needs it. */
  declare ariaLabel: string | null;
  /** Copied to the inner button. */
  declare ariaDescription: string | null;

  readonly #onPressedChange = (next: boolean): void => {
    this.pressed = next;
    this.dispatchEvent(
      new CustomEvent<LineIconButtonChangeDetail>('line-change', {
        detail: { value: next },
        bubbles: true,
        composed: false,
      }),
    );
  };

  readonly #machineProps = (): ButtonMachineProps => ({
    disabled: this.disabled,
    loading: this.loading,
    pressed: this.pressed,
    onPressedChange: this.#onPressedChange,
  });

  readonly #ctrl = new LineMachineController<ButtonMachineSchema>(this, {
    machine: buttonMachine,
    props: this.#machineProps,
  });

  constructor() {
    super();
    // `useDefault` keeps this initial value out of the attribute, so an unknown author value stays (C8).
    this.variant = 'default';
    this.disabled = false;
    this.loading = false;
    this.addEventListener('click', this.#onClick, { capture: true });
  }

  /** The machine view, or the static view from the host props when the machine failed to start. */
  #api(): ButtonApi {
    const service = this.#ctrl.service;
    return service && !this.#ctrl.fallback ? connect(service) : connectStatic(this.#machineProps());
  }

  /**
   * Stops a click while the button is not interactive. It listens in the
   * capture phase, so it runs before every bubble listener on the host,
   * including an inline `onclick` or a listener added before the upgrade.
   * Otherwise it activates in a later task, once the click dispatch has
   * ended, unless a listener called `preventDefault()`.
   */
  readonly #onClick = (event: MouseEvent): void => {
    if (!this.#api().interactive) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    setTimeout(() => {
      if (!event.defaultPrevented) this.#ctrl.send({ type: 'ACTIVATE' });
    });
  };

  readonly #onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    this.#ctrl.send({ type: 'PRESS_START' });
    const release = new AbortController();
    const end = (ended: Event): void => {
      release.abort();
      this.#ctrl.send({ type: ended.type === 'pointerup' ? 'PRESS_END' : 'PRESS_CANCEL' });
    };
    window.addEventListener('pointerup', end, { capture: true, signal: release.signal });
    window.addEventListener('pointercancel', end, { capture: true, signal: release.signal });
  };

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) this.#ctrl.send({ type: 'PRESS_START' });
  };

  readonly #onKeyUp = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') this.#ctrl.send({ type: 'PRESS_END' });
  };

  readonly #onFocus = (event: FocusEvent): void => {
    const visible = (event.currentTarget as HTMLButtonElement).matches(':focus-visible');
    this.#ctrl.send({ type: 'FOCUS', visible });
  };

  readonly #onBlur = (): void => {
    this.#ctrl.send({ type: 'PRESS_CANCEL' });
    this.#ctrl.send({ type: 'BLUR' });
  };

  protected override update(changed: PropertyValues<this>): void {
    const api = this.#api();
    this.reflectState('active', api.active);
    this.reflectState('pressed', api.pressed);
    this.reflectState('loading', api.loading);
    this.reflectState('disabled', api.disabled);
    this.reflectState('focus-visible', api.focusVisible);
    super.update(changed);
  }

  override render(): TemplateResult {
    const { loading, buttonAttrs } = this.#api();
    return html`<button
      part="root"
      type="button"
      ?disabled=${buttonAttrs.disabled}
      aria-pressed=${ifDefined(buttonAttrs['aria-pressed'])}
      aria-disabled=${ifDefined(buttonAttrs['aria-disabled'])}
      aria-label=${ifDefined(this.ariaLabel ?? undefined)}
      aria-description=${ifDefined(this.ariaDescription ?? undefined)}
      @pointerdown=${this.#onPointerDown}
      @keydown=${this.#onKeyDown}
      @keyup=${this.#onKeyUp}
      @focus=${this.#onFocus}
      @blur=${this.#onBlur}
    ><span part="icon"><slot></slot></span>${
      loading ? html`<span part="loading"><slot name="loading"></slot></span>` : nothing
    }</button>`;
  }
}

customElements.define('line-icon-button', LineIconButton);

declare global {
  interface HTMLElementTagNameMap {
    'line-icon-button': LineIconButton;
  }
}
