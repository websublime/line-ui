/**
 * `<line-htmx-value-probe>` — the value-bearing fixture of the §6.F.4 htmx harness (AM-063).
 *
 * Private, never published. Typing in the inner text input fires `line-input`
 * with `detail.value`, which commits nothing. The inner input's native `change`,
 * which Enter and blur both produce, is the only commit. Each commit sets the
 * form value and fires `line-change` with `detail.value` once (ARCHITECTURE
 * §17.2 rules C3 and C9). On `slotchange` the default slot reflects the number
 * of assigned elements as `data-slotted`.
 *
 * @module __tests__/integration/htmx/line-htmx-value-probe
 */

import { html } from 'lit';
import { FormAssociated, LineElement } from '../../../src/index.js';

export class LineHtmxValueProbe extends FormAssociated(LineElement) {
  /** The last committed value; the form submits it under the host's `name`. */
  value = '';

  override render() {
    return html`
      <input part="input" type="text" aria-label="Value" @input=${this.#onInput} @change=${this.#onChange} />
      <slot @slotchange=${this.#onSlotChange}></slot>
    `;
  }

  #onInput(event: Event): void {
    const { value } = event.target as HTMLInputElement;
    this.dispatchEvent(new CustomEvent('line-input', { detail: { value }, bubbles: true }));
  }

  #onChange(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.setFormValue(this.value);
    this.dispatchEvent(new CustomEvent('line-change', { detail: { value: this.value }, bubbles: true }));
  }

  #onSlotChange(event: Event): void {
    this.dataset.slotted = String((event.target as HTMLSlotElement).assignedElements().length);
  }
}

customElements.define('line-htmx-value-probe', LineHtmxValueProbe);

declare global {
  interface HTMLElementTagNameMap {
    'line-htmx-value-probe': LineHtmxValueProbe;
  }
}
