/**
 * `<line-form-test>` — the §6.D.5 browser-tier fixture (AM-032).
 *
 * Private, never published. A minimal form control on `FormAssociated(LineElement)`:
 * the `value` attribute is its default, the `value` property its current value
 * (`null` until set, which falls back to the default). Every update submits the
 * current value with `setFormValue` and, when `required` and empty, reports
 * `valueMissing` with `setValidity`. A form reset clears the current value,
 * restoring the default, and counts the `formResetCallback` call in `resets`.
 *
 * @module __tests__/integration/form-associated/line-form-test
 */

import type { PropertyDeclarations } from 'lit';
import { LineElement } from '../../../src/line-element.js';
import { FormAssociated } from '../../../src/mixins/form-associated.js';

export class LineFormTest extends FormAssociated(LineElement) {
  static override properties: PropertyDeclarations = {
    defaultValue: { attribute: 'value' },
    value: { attribute: false },
    required: { type: Boolean, reflect: true },
  };

  /** Message the fixture reports while `required` and empty. */
  static readonly valueMissingMessage = 'Fill in this field.';

  /** Initial value, from the `value` attribute. */
  declare defaultValue: string;
  /** Current value; `null` until set, then the default applies. */
  declare value: string | null;
  /** Whether an empty value is invalid. */
  declare required: boolean;
  /** Number of `formResetCallback` calls. */
  resets = 0;

  constructor() {
    super();
    this.defaultValue = '';
    this.value = null;
    this.required = false;
  }

  override updated(): void {
    const value = this.value ?? this.defaultValue;
    this.setFormValue(value);
    if (this.required && value === '') {
      this.setValidity({ valueMissing: true }, LineFormTest.valueMissingMessage);
    } else {
      this.setValidity({});
    }
  }

  override formResetCallback(): void {
    this.resets += 1;
    this.value = null;
  }
}

customElements.define('line-form-test', LineFormTest);

declare global {
  interface HTMLElementTagNameMap {
    'line-form-test': LineFormTest;
  }
}
