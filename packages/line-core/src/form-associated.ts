import { INTERNALS } from './internals.js';
import type { LineElement } from './line-element.js';

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
 * Sets `static formAssociated = true` and forwards the form API
 * (`setFormValue`, `setValidity`, `reportValidity`, `checkValidity`, `form`,
 * `validity`, `validationMessage`, `willValidate`) to the internals that
 * `LineElement` attached, through `this[INTERNALS]`. `name` reads the host
 * attribute and `type` is the local name. State reflection is the
 * `LineElement` `reflectState` body.
 *
 * Opt-in per component: `class LineInput extends FormAssociated(LineElement) {}`.
 * Sub-classes implement the form lifecycle callbacks they need. The root entry
 * exports it, and `./mixins/form-associated` re-exports it from the root, so
 * both specifiers share one `INTERNALS` Symbol on every delivery path.
 *
 * @see docs/specs/00-spec-design-system.md §6.D.5 (AM-032, AM-080)
 * @see docs/specs/01-spec-core-primitives.md §6.C.2 (AM-050)
 */
export function FormAssociated<T extends Constructor<LineElement>>(
  Base: T,
): T & Constructor<FormAssociatedMembers> & { readonly formAssociated: true } {
  class FormAssociatedElement extends Base {
    static formAssociated = true as const;

    setFormValue(value: FormValue, state?: FormValue): void {
      this[INTERNALS].setFormValue(value, state);
    }

    setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void {
      this[INTERNALS].setValidity(flags, message, anchor);
    }

    reportValidity(): boolean {
      return this[INTERNALS].reportValidity();
    }

    checkValidity(): boolean {
      return this[INTERNALS].checkValidity();
    }

    get form(): HTMLFormElement | null {
      return this[INTERNALS].form;
    }

    get name(): string | null {
      return this.getAttribute('name');
    }

    get type(): string {
      return this.localName;
    }

    get validity(): ValidityState {
      return this[INTERNALS].validity;
    }

    get validationMessage(): string {
      return this[INTERNALS].validationMessage;
    }

    get willValidate(): boolean {
      return this[INTERNALS].willValidate;
    }

    formAssociatedCallback?(form: HTMLFormElement | null): void;
    formDisabledCallback?(disabled: boolean): void;
    formResetCallback?(): void;
    formStateRestoreCallback?(state: FormValue, reason: 'autocomplete' | 'restore'): void;
  }
  return FormAssociatedElement;
}
