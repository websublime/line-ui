import type { LineElement } from '../line-element.js';

/**
 * Generic constructor type used for Lit mixin composition.
 * Matches the shape declared in spec §6.D.5.
 */
// biome-ignore lint/complexity/noBannedTypes: `{}` is the conventional mixin base constraint.
// biome-ignore lint/suspicious/noExplicitAny: spec §6.D.5 mandates `any[]` for the mixin constructor signature.
type Constructor<T = {}> = new (...args: any[]) => T;

/** Value a form-associated element submits or restores (HTML `ElementInternals.setFormValue`). */
type FormValue = File | string | FormData | null;

/**
 * Public surface `FormAssociated` adds to an element: the `ElementInternals`
 * form API plus the optional form lifecycle callbacks sub-classes implement.
 *
 * @see docs/specs/00-spec-design-system.md §6.D.5 (AM-032)
 */
export interface FormAssociatedMembers {
  /** Sets the value the element submits with its form, and optionally its restore state. */
  setFormValue(value: FormValue, state?: FormValue): void;
  /** Sets the element's validity flags and message; `anchor` receives the validation UI. */
  setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;
  /** Checks validity and, when invalid, fires `invalid` and shows the validation UI. */
  reportValidity(): boolean;
  /** Checks validity and fires `invalid` when invalid, without showing the validation UI. */
  checkValidity(): boolean;
  /** The element's associated form owner. */
  readonly form: HTMLFormElement | null;
  /** The `name` attribute, the key the value submits under. */
  readonly name: string | null;
  /** The element's local name. */
  readonly type: string;
  /** The element's current validity state. */
  readonly validity: ValidityState;
  /** The message `setValidity` set, or `''`. */
  readonly validationMessage: string;
  /** Whether the element is a candidate for constraint validation. */
  readonly willValidate: boolean;
  /** Called when the element's form owner changes. */
  formAssociatedCallback?(form: HTMLFormElement | null): void;
  /** Called when the element is disabled or enabled through an ancestor `fieldset` or its own `disabled`. */
  formDisabledCallback?(disabled: boolean): void;
  /** Called when the form owner resets. */
  formResetCallback?(): void;
  /** Called when the browser restores the element's state (navigation or autofill). */
  formStateRestoreCallback?(state: FormValue, reason: 'autocomplete' | 'restore'): void;
}

/**
 * FormAssociated mixin (D5). Makes a `LineElement` a form-associated custom
 * element backed by `ElementInternals`.
 *
 * Sets `static formAssociated = true`, attaches the element's internals in the
 * constructor, and forwards the form API (`setFormValue`, `setValidity`,
 * `reportValidity`, `checkValidity`, `form`, `validity`, `validationMessage`,
 * `willValidate`) to them. `name` reads the host attribute and `type` is the
 * local name. `reflectState(name, active)` toggles a host `data-*` attribute
 * through `dataset` and the `name` custom state. `name` must be a single-word
 * or camelCase key: `dataset` maps camelCase to a kebab-case attribute
 * (`userInvalid` → `data-user-invalid`) and throws a `SyntaxError` on a
 * kebab-case key, while the custom state keeps `name` verbatim
 * (`:state(userInvalid)`).
 *
 * Opt-in per component: `class LineInput extends FormAssociated(LineElement) {}`.
 * Sub-classes implement the form lifecycle callbacks they need.
 *
 * @see docs/specs/00-spec-design-system.md §6.D.5 (AM-032)
 */
export function FormAssociated<T extends Constructor<LineElement>>(
  Base: T,
): T & Constructor<FormAssociatedMembers> & { readonly formAssociated: true } {
  class FormAssociatedElement extends Base {
    static formAssociated = true as const;

    #internals: ElementInternals;

    // biome-ignore lint/suspicious/noExplicitAny: spec §6.D.5 mandates `any[]` for the mixin constructor signature.
    constructor(...args: any[]) {
      super(...args);
      this.#internals = this.attachInternals();
    }

    setFormValue(value: FormValue, state?: FormValue): void {
      this.#internals.setFormValue(value, state);
    }

    setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void {
      this.#internals.setValidity(flags, message, anchor);
    }

    reportValidity(): boolean {
      return this.#internals.reportValidity();
    }

    checkValidity(): boolean {
      return this.#internals.checkValidity();
    }

    get form(): HTMLFormElement | null {
      return this.#internals.form;
    }

    get name(): string | null {
      return this.getAttribute('name');
    }

    get type(): string {
      return this.localName;
    }

    get validity(): ValidityState {
      return this.#internals.validity;
    }

    get validationMessage(): string {
      return this.#internals.validationMessage;
    }

    get willValidate(): boolean {
      return this.#internals.willValidate;
    }

    /**
     * Toggles `this.dataset[name]` (camelCase `name` → kebab-case `data-*`
     * attribute; a kebab-case `name` throws) and the custom state `name`, verbatim.
     */
    protected override reflectState(name: string, active: boolean): void {
      if (active) {
        this.dataset[name] = '';
      } else {
        delete this.dataset[name];
      }
      if (this.#internals.states) {
        if (active) {
          this.#internals.states.add(name);
        } else {
          this.#internals.states.delete(name);
        }
      }
    }

    formAssociatedCallback?(form: HTMLFormElement | null): void;
    formDisabledCallback?(disabled: boolean): void;
    formResetCallback?(): void;
    formStateRestoreCallback?(state: FormValue, reason: 'autocomplete' | 'restore'): void;
  }
  return FormAssociatedElement;
}
