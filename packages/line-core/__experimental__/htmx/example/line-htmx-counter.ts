/**
 * `<line-htmx-counter>` — the H1 spike's worked example (spec §6.H.1).
 *
 * The server owns the count. The internal form posts a step to `/inc` or
 * `/dec` and swaps the returned readout into the shadow root. Other buttons
 * swap a server fragment into the host's light DOM (`hx-target="host"`) and
 * append one to the page (`hx-target="global #counter-log"`). Two Lit-only
 * controls re-render the template: one switches the form's `hx-post`, and one
 * inserts a reset button. After every settle the element submits the server
 * count as its form value, so a page form that holds it posts the count.
 *
 * Experimental, never built or published (spec D6).
 *
 * @module __experimental__/htmx/example/line-htmx-counter
 */

import { css, html, nothing, type PropertyDeclarations } from 'lit';
import { FormAssociated, LineElement } from '../../../src/index.js';
import { HtmxElement } from '../line-htmx-element.js';

type Operation = 'inc' | 'dec';

export class LineHtmxCounter extends FormAssociated(HtmxElement(LineElement)) {
  static override properties: PropertyDeclarations = {
    operation: { type: String },
    resettable: { type: Boolean },
  };

  static override styles = css`
    :host {
      display: block;
    }
  `;

  /** Endpoint of the internal form, `/inc` or `/dec`. */
  declare operation: Operation;
  /** Whether the template renders the reset button. */
  declare resettable: boolean;
  /** Number of `htmxSettledCallback` calls. */
  settles = 0;

  constructor() {
    super();
    this.operation = 'inc';
    this.resettable = false;
  }

  override htmxSettledCallback(event: Event): void {
    this.settles += 1;
    const value = this.shadowRoot?.querySelector('#readout data')?.getAttribute('value') ?? null;
    this.setFormValue(value);
    const origin = event.composedPath()[0];
    const where = origin instanceof Element ? origin.id || origin.localName : 'document';
    console.info(`[${this.id}] settle #${this.settles} ${event.type} at ${where}, form value ${value}`);
  }

  #toggleOperation = (): void => {
    this.operation = this.operation === 'inc' ? 'dec' : 'inc';
  };

  #toggleResettable = (): void => {
    this.resettable = !this.resettable;
  };

  protected override render() {
    return html`
      <div part="root" data-line-htmx-forward>
        <form part="form" hx-post=${`/${this.operation}`} hx-target="#readout">
          <label part="label">
            Step
            <input part="input" name="step" type="number" min="1" max="100" value="1" required />
          </label>
          <button part="submit" type="submit">${this.operation === 'inc' ? 'Add' : 'Subtract'}</button>
        </form>
        <output id="readout" part="readout" hx-get="/value" hx-trigger="load" aria-live="polite"></output>
        <button part="publish" type="button" hx-post="/publish" hx-target="host">Publish to host</button>
        <button part="log" type="button" hx-post="/log" hx-target="global #counter-log" hx-swap="beforeend">
          Log to page
        </button>
        <button part="operation" type="button" @click=${this.#toggleOperation}>
          Switch to ${this.operation === 'inc' ? 'subtract' : 'add'}
        </button>
        <button part="resettable" type="button" @click=${this.#toggleResettable}>
          ${this.resettable ? 'Hide' : 'Show'} reset
        </button>
        ${
          this.resettable
            ? html`<button part="reset" type="button" hx-post="/reset" hx-target="#readout">Reset</button>`
            : nothing
        }
      </div>
      <slot name="summary"></slot>
    `;
  }
}

customElements.define('line-htmx-counter', LineHtmxCounter);

declare global {
  interface HTMLElementTagNameMap {
    'line-htmx-counter': LineHtmxCounter;
  }
}
