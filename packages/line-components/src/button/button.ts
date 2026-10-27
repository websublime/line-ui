import { FormAssociated, LineElement } from '@websublime/line-core';
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
import type {
  ButtonFormEnctype,
  ButtonFormMethod,
  ButtonType,
  ButtonVariant,
  LineButtonChangeDetail,
} from './button.types.js';

const VARIANTS: readonly ButtonVariant[] = ['default', 'primary', 'borderless'];
const TYPES: readonly ButtonType[] = ['submit', 'reset', 'button'];

/** The host attributes the temporary submitter copies, besides `name` and `value`. */
const FORM_ATTRIBUTES = ['formaction', 'formmethod', 'formenctype', 'formtarget', 'formnovalidate'] as const;

/** An unknown `variant` behaves as `default`; the attribute keeps what the author wrote. */
const variantConverter: ComplexAttributeConverter<ButtonVariant> = {
  fromAttribute: (value) => VARIANTS.find((variant) => variant === value) ?? 'default',
};

/** An unknown or missing `type` behaves as `submit`, as on a native button; the match ignores case. */
const typeConverter: ComplexAttributeConverter<ButtonType> = {
  fromAttribute: (value) => TYPES.find((type) => type === value?.toLowerCase()) ?? 'submit',
};

/** Absent means not a toggle; `"false"` parses to `false` and any other value to `true`. */
const pressedConverter: ComplexAttributeConverter<boolean | undefined> = {
  fromAttribute: (value) => (value === null ? undefined : value !== 'false'),
  toAttribute: (value) => (value === undefined ? null : String(value)),
};

/** Reflects a string and removes the attribute when the string is empty. */
const emptyRemovesConverter: ComplexAttributeConverter<string> = {
  fromAttribute: (value) => value ?? '',
  toAttribute: (value) => value || null,
};

/**
 * `<line-button>` runs an action when the user activates it. It renders a
 * native `<button>` in its shadow root, and the host is a form-associated
 * custom element, so `type="submit"` and `type="reset"` act on its form as a
 * native button does. `pressed` makes it a toggle; `loading` keeps it
 * focusable while it ignores presses.
 *
 * @summary A form-associated button that runs an action, submits or resets its form, or toggles with `pressed`.
 *
 * @slot - The label: text or inline content.
 * @slot prefix - A leading icon.
 * @slot suffix - A trailing icon.
 * @slot loading - A spinner, loading text or both; rendered only while `loading` is on.
 *
 * @csspart root - The inner native `<button>`: box, background, border and focus ring.
 * @csspart label - Wraps the default slot.
 * @csspart loading - Wraps the `loading` slot; present only while `loading` is on.
 *
 * @cssprop [--line-button-radius=var(--line-radius-2)] - Corner radius of `root`.
 * @cssprop [--line-button-bg=var(--line-gray-bg)] - Background of `root`; `primary` uses `var(--line-accent-solid)` and `borderless` uses `transparent`.
 * @cssprop [--line-button-color=var(--line-gray-text)] - Text colour of `root`; `primary` uses `var(--line-accent-contrast)` and `borderless` uses `var(--line-accent-text)`.
 * @cssprop [--line-button-height=var(--line-size-7)] - Minimum block size of `root`.
 * @cssprop [--line-button-padding-inline=var(--line-size-3)] - Inline padding of `root`.
 * @cssprop [--line-button-gap=var(--line-size-2)] - Gap between the prefix, label, suffix and loading zones.
 * @cssprop [--line-button-font-size=var(--line-font-size-1)] - Font size of `root`.
 * @cssprop [--line-button-font-weight=var(--line-font-weight-5)] - Font weight of `root`.
 * @cssprop [--line-button-focus-ring=var(--line-focus-ring, 2px solid currentColor)] - `outline` of `root` while the host has `data-focus-visible`.
 *
 * @fires {CustomEvent<LineButtonChangeDetail>} line-change - A user activation flipped `pressed` on a toggle button; `detail.value` is the new state. Bubbles, not composed.
 *
 * @attr {string} name - The key the submitter value goes under; read through the inherited `name` getter.
 */
export class LineButton extends FormAssociated(LineElement) {
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties: PropertyDeclarations = {
    variant: { reflect: true, converter: variantConverter },
    type: { reflect: true, converter: typeConverter },
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    pressed: { reflect: true, converter: pressedConverter },
    value: { reflect: true, converter: emptyRemovesConverter },
    formAction: { attribute: 'formaction', reflect: true, converter: emptyRemovesConverter },
    formMethod: { attribute: 'formmethod', reflect: true },
    formEnctype: { attribute: 'formenctype', reflect: true },
    formTarget: { attribute: 'formtarget', reflect: true },
    formNoValidate: { attribute: 'formnovalidate', type: Boolean, reflect: true },
    customValidity: { attribute: 'custom-validity' },
    ariaLabel: { attribute: 'aria-label', reflect: true },
    ariaDescription: { attribute: 'aria-description', reflect: true },
  };

  static override styles = [
    commonReset,
    buttonReset,
    css`
      :host {
        --line-button-radius: var(--line-radius-2);
        --line-button-bg: var(--line-gray-bg);
        --line-button-color: var(--line-gray-text);
        --line-button-height: var(--line-size-7);
        --line-button-padding-inline: var(--line-size-3);
        --line-button-gap: var(--line-size-2);
        --line-button-font-size: var(--line-font-size-1);
        --line-button-font-weight: var(--line-font-weight-5);
        --line-button-focus-ring: var(--line-focus-ring, 2px solid currentColor);

        display: inline-block;
      }

      :host([hidden]) {
        display: none;
      }

      :host([variant='primary']) {
        --line-button-bg: var(--line-accent-solid);
        --line-button-color: var(--line-accent-contrast);
      }

      :host([variant='borderless']) {
        --line-button-bg: transparent;
        --line-button-color: var(--line-accent-text);
      }

      [part='root'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--line-button-gap);
        min-block-size: var(--line-button-height);
        padding-inline: var(--line-button-padding-inline);
        border-radius: var(--line-button-radius);
        background: var(--line-button-bg);
        color: var(--line-button-color);
        font-size: var(--line-button-font-size);
        font-weight: var(--line-button-font-weight);
      }

      :host([data-focus-visible]) [part='root'] {
        outline: var(--line-button-focus-ring);
      }
    `,
  ];

  /** Semantic emphasis; an unknown value behaves as `default`. */
  declare variant: ButtonVariant;
  /** What activation does to the form owner; an unknown value behaves as `submit`. */
  declare type: ButtonType;
  /** Removes the button from the tab order and blocks activation. */
  declare disabled: boolean;
  /** Keeps focus, sets `aria-disabled="true"`, blocks activation and renders the `loading` part. */
  declare loading: boolean;
  /** `undefined` means not a toggle; a toggle flips it on each activation and fires `line-change`. */
  declare pressed: boolean | undefined;
  /** The submitter value; it enters the form data only when this button submits. */
  declare value: string;
  /** Overrides the form's `action` when this button submits. */
  declare formAction: string;
  /** Overrides the form's `method` when this button submits. */
  declare formMethod: ButtonFormMethod | undefined;
  /** Overrides the form's `enctype` when this button submits. */
  declare formEnctype: ButtonFormEnctype | undefined;
  /** Overrides the form's `target` when this button submits. */
  declare formTarget: string | undefined;
  /** Skips constraint validation when this button submits. */
  declare formNoValidate: boolean;
  /** External validity: a non-empty message marks the button invalid while `type` is `submit`. */
  declare customValidity: string;
  /** Copied to the inner button, where it names the role. */
  declare ariaLabel: string | null;
  /** Copied to the inner button. */
  declare ariaDescription: string | null;

  /** A disabled `fieldset` ancestor or the host's own `disabled`, from `formDisabledCallback`. */
  #formDisabled = false;

  readonly #onPressedChange = (next: boolean): void => {
    this.pressed = next;
    this.dispatchEvent(
      new CustomEvent<LineButtonChangeDetail>('line-change', {
        detail: { value: next },
        bubbles: true,
        composed: false,
      }),
    );
  };

  readonly #machineProps = (): ButtonMachineProps => ({
    disabled: this.disabled || this.#formDisabled,
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
    this.variant = 'default';
    this.type = 'submit';
    this.disabled = false;
    this.loading = false;
    this.value = '';
    this.formAction = '';
    this.formNoValidate = false;
    this.customValidity = '';
    this.addEventListener('click', this.#onClick);
  }

  override formDisabledCallback(disabled: boolean): void {
    this.#formDisabled = disabled;
    this.requestUpdate();
  }

  /** The machine view, or the static view from the host props when the machine failed to start. */
  #api(): ButtonApi {
    const service = this.#ctrl.service;
    return service && !this.#ctrl.fallback ? connect(service) : connectStatic(this.#machineProps());
  }

  /**
   * Stops a click while the button is not interactive. Otherwise it activates
   * in a later task, once the click dispatch has ended, unless a listener
   * called `preventDefault()`.
   */
  readonly #onClick = (event: MouseEvent): void => {
    if (!this.#api().interactive) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    setTimeout(() => {
      if (!event.defaultPrevented) this.#activate();
    });
  };

  #activate(): void {
    this.#ctrl.send({ type: 'ACTIVATE' });
    const form = this.form;
    if (!form) return;
    if (this.type === 'reset') {
      // A control with id or name "reset" shadows the method on the form.
      HTMLFormElement.prototype.reset.call(form);
    } else if (this.type === 'submit') {
      this.#submit(form);
    }
  }

  /** Submits through a temporary native submitter, so the submission gets the native submitter semantics. */
  #submit(form: HTMLFormElement): void {
    const submitter = form.ownerDocument.createElement('button');
    submitter.type = 'submit';
    submitter.hidden = true;
    submitter.setAttribute('data-line-button-submitter', '');
    const name = this.getAttribute('name');
    if (name !== null) submitter.name = name;
    submitter.value = this.value;
    for (const attribute of FORM_ATTRIBUTES) {
      const value = this.getAttribute(attribute);
      if (value !== null) submitter.setAttribute(attribute, value);
    }
    form.append(submitter);
    try {
      submitter.click();
    } finally {
      submitter.remove();
    }
  }

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

  protected override updated(changed: PropertyValues<this>): void {
    if (!(changed.has('customValidity') || changed.has('type'))) return;
    const message = this.type === 'submit' ? this.customValidity : '';
    const root = this.renderRoot.querySelector<HTMLButtonElement>('[part="root"]') ?? undefined;
    if (message) {
      this.setValidity({ customError: true }, message, root);
    } else {
      this.setValidity({});
    }
    this.reflectState('invalid', message !== '');
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
    ><slot name="prefix"></slot><span part="label"><slot></slot></span><slot name="suffix"></slot>${
      loading ? html`<span part="loading"><slot name="loading"></slot></span>` : nothing
    }</button>`;
  }
}

customElements.define('line-button', LineButton);

declare global {
  interface HTMLElementTagNameMap {
    'line-button': LineButton;
  }
}
