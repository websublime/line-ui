import { INTERNALS, LineElement } from '@websublime/line-core';
import { LineMachineController } from '@websublime/line-core/machine';
import { commonReset } from '@websublime/line-core/styles';
import {
  type ComplexAttributeConverter,
  type CSSResult,
  css,
  html,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
  unsafeCSS,
} from 'lit';
import type { ButtonGroupOrientation, ButtonGroupPosition } from './button-group.types.js';
import {
  type ButtonGroupMachineProps,
  type ButtonGroupMachineSchema,
  buttonGroupMachine,
} from './button-group-machine.js';

/** The tags the group treats as its buttons, compared by name: the group imports neither (decision D2). */
const BUTTON_TAGS: ReadonlySet<string> = new Set(['line-button', 'line-icon-button']);

/** The position attribute the group writes on each item host (decision D14). */
const POSITION = 'data-line-button-group-position';

/** An unknown `orientation` behaves as `horizontal`; the attribute keeps what the author wrote. */
const orientationConverter: ComplexAttributeConverter<ButtonGroupOrientation> = {
  fromAttribute: (value) => (value === 'vertical' ? 'vertical' : 'horizontal'),
};

/**
 * The corner rules: each button's own radius token, written per position from the group's shadow root
 * (decisions D9, D14). The tokens take the `border-radius` shorthand (`0002-button.md` AM-009,
 * `0003-icon-button.md` AM-003), whose corners run top-left, top-right, bottom-right, bottom-left.
 */
function cornerRules(): CSSResult {
  const r = 'var(--line-button-group-radius)';
  const start = `${r} 0 0 ${r}`;
  const end = `0 ${r} ${r} 0`;
  const top = `${r} ${r} 0 0`;
  const bottom = `0 0 ${r} ${r}`;
  const layouts: readonly [string, Record<ButtonGroupPosition, string>][] = [
    ['', { first: start, middle: '0', last: end, only: r }],
    [':host(:dir(rtl)) ', { first: end, middle: '0', last: start, only: r }],
    [":host([orientation='vertical']) ", { first: top, middle: '0', last: bottom, only: r }],
  ];
  const rules: string[] = [];
  for (const [scope, corners] of layouts) {
    for (const [position, value] of Object.entries(corners)) {
      for (const tag of BUTTON_TAGS) {
        rules.push(`${scope}::slotted(${tag}[${POSITION}='${position}']) { --${tag}-radius: ${value}; }`);
      }
    }
  }
  return unsafeCSS(rules.join('\n'));
}

/**
 * `<line-button-group>` groups related buttons into one toolbar: one Tab stop, and the arrow keys move
 * focus between its buttons (APG Toolbar). It carries the `toolbar` role on its host through
 * `ElementInternals`, so the host `aria-label` or `aria-labelledby` names it. It imports no button: it
 * finds the `line-button` and `line-icon-button` hosts in its default slot, writes a roving `tabindex`
 * and `data-line-button-group-position` on them, and squares the corners between them.
 *
 * @summary A toolbar of buttons with one Tab stop and arrow-key focus, named by its `aria-label`.
 *
 * @slot - The toolbar's buttons, in order: `<line-button>` and `<line-icon-button>`. Other content renders and takes no part in roving focus.
 *
 * @cssprop [--line-button-group-radius=var(--line-radius-2)] - Radius of the group's outer corners, written into the first and last buttons' radius tokens.
 * @cssprop [--line-button-group-gap=0] - Space between the buttons.
 */
export class LineButtonGroup extends LineElement {
  static override properties: PropertyDeclarations = {
    orientation: { reflect: true, useDefault: true, converter: orientationConverter },
    loop: { type: Boolean, reflect: true },
  };

  static override styles = [
    commonReset,
    css`
      :host {
        --line-button-group-radius: var(--line-radius-2);
        --line-button-group-gap: 0;

        display: inline-flex;
        flex-direction: row;
        gap: var(--line-button-group-gap);
      }

      :host([hidden]) {
        display: none;
      }

      :host([orientation='vertical']) {
        flex-direction: column;
      }

      ::slotted([data-focus-visible]) {
        position: relative;
        z-index: 1;
      }
    `,
    cornerRules(),
  ];

  /** The arrow keys the group handles, its ARIA orientation and its flex direction; an unknown value behaves as `horizontal`. */
  declare orientation: ButtonGroupOrientation;
  /** Lets the arrow keys wrap from the last button to the first and back. */
  declare loop: boolean;

  /** The items: visible `line-button` and `line-icon-button` hosts in the default slot, in order (decisions D2, D16). */
  #items: HTMLElement[] = [];
  /** The item that holds the tab stop, and its index when last written. */
  #active: HTMLElement | null = null;
  #activeIndex = 0;
  /** The item that last took focus, kept while focus is in the group or was lost with the item (decisions D12, D13). */
  #focused: HTMLElement | null = null;
  /**
   * Set when the focused item was disabled or hidden while it still held focus: Firefox and WebKit drop that focus
   * later, with a `focusout` that has no `relatedTarget`, and the group recovers it there (decisions D12, D16).
   */
  #recoverOnFocusOut = false;
  /** Watches `disabled` and `hidden` on every button host, which no `slotchange` reports (decisions D6, D16). */
  readonly #observer = new MutationObserver(() => this.#refresh());

  readonly #onMove = (index: number): void => {
    this.#writeTabStops(index);
    this.#items[index]?.focus({ focusVisible: true } as FocusOptions);
  };

  readonly #machineProps = (): ButtonGroupMachineProps => ({
    count: this.#items.length,
    isSkipped: (index) => this.#items[index]?.hasAttribute('disabled') ?? true,
    loop: this.loop,
    onMove: this.#onMove,
  });

  readonly #ctrl = new LineMachineController<ButtonGroupMachineSchema>(this, {
    machine: buttonGroupMachine,
    props: this.#machineProps,
  });

  constructor() {
    super();
    // `useDefault` keeps this initial value out of the attribute, so an unknown author value stays (C8).
    this.orientation = 'horizontal';
    this.loop = false;
    this[INTERNALS].role = 'toolbar';
    this.addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('focusin', this.#onFocusIn);
    this.addEventListener('focusout', this.#onFocusOut);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // A reconnected group gets a fresh machine and no `slotchange`, so it re-reads its items.
    if (this.hasUpdated) this.#refresh();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  /** Reads the items from the slot, writes their positions, and sends `SYNC` (decisions D2, D12–D16). */
  #refresh(): void {
    const slot = this.renderRoot.querySelector('slot');
    if (!slot) return;
    const buttons = slot
      .assignedElements({ flatten: true })
      .filter((el): el is HTMLElement => BUTTON_TAGS.has(el.localName));
    const items = buttons.filter((el) => !el.hasAttribute('hidden'));

    for (const el of this.#items) {
      if (!items.includes(el)) {
        el.removeAttribute('tabindex');
        el.removeAttribute(POSITION);
      }
    }
    this.#observer.disconnect();
    for (const el of buttons) {
      this.#observer.observe(el, { attributes: true, attributeFilter: ['disabled', 'hidden'] });
    }
    const last = items.length - 1;
    items.forEach((el, i) => {
      el.setAttribute(POSITION, last === 0 ? 'only' : i === 0 ? 'first' : i === last ? 'last' : 'middle');
    });

    const previous = this.#active;
    const kept = previous ? items.indexOf(previous) : -1;
    const lost = previous !== null && (kept < 0 || previous.hasAttribute('disabled'));
    const lostFocus = lost && this.#focused === previous;
    const focusInside = this.matches(':focus-within');
    this.#recoverOnFocusOut = lostFocus && focusInside;
    this.#items = items;
    this.#ctrl.send({ type: 'SYNC', index: kept >= 0 ? kept : this.#activeIndex, focus: lostFocus && !focusInside });
    // The machine applies `SYNC` in a microtask; `updated()` writes the tab stops after it (spec probe P7).
    this.requestUpdate();
  }

  /** `tabindex="0"` on the item at `index`, `-1` on the others (decision D3); none while the machine has failed. */
  #writeTabStops(index: number): void {
    this.#active = this.#items[index] ?? null;
    if (index >= 0) this.#activeIndex = index;
    if (this.#ctrl.fallback) return;
    this.#items.forEach((el, i) => {
      el.setAttribute('tabindex', i === index ? '0' : '-1');
    });
  }

  /** The index of the item the event passed through, across its shadow boundary (spec probe P4). */
  #itemIndex(event: Event): number {
    const path = event.composedPath();
    return this.#items.findIndex((item) => path.includes(item));
  }

  readonly #onFocusIn = (event: FocusEvent): void => {
    const index = this.#itemIndex(event);
    if (index < 0) return;
    this.#focused = this.#items[index] ?? null;
    this.#recoverOnFocusOut = false;
    this.#ctrl.send({ type: 'FOCUS_ITEM', index });
    this.#writeTabStops(index);
  };

  readonly #onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    if (next instanceof Node && this.contains(next)) return;
    if (next) {
      this.#focused = null;
      return;
    }
    // Focus went nowhere: a blur, or the focused button was removed, disabled or hidden. Keep it only in the
    // second case, for the recovery; `focusout` on removal fires only in Chromium (spec probe P5).
    const item = this.#focused;
    queueMicrotask(() => {
      if (!item || this.#focused !== item || this.matches(':focus-within')) return;
      const intact = item.isConnected && !item.hasAttribute('disabled') && !item.hasAttribute('hidden');
      if (intact) {
        this.#focused = null;
      } else if (this.#recoverOnFocusOut) {
        // `#refresh()` already moved the tab stop; the browser dropped focus only now.
        this.#recoverOnFocusOut = false;
        this.#active?.focus({ focusVisible: true } as FocusOptions);
      }
    });
  };

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (this.#ctrl.fallback || this.#itemIndex(event) < 0) return;
    // A key with a modifier is a browser or OS shortcut, such as Alt+Left; the group leaves it alone (decision D18).
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const vertical = this.orientation === 'vertical';
    const rtl = this.direction === 'rtl';
    const next = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const prev = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    let to: 'next' | 'prev' | 'first' | 'last';
    if (event.key === next) to = 'next';
    else if (event.key === prev) to = 'prev';
    else if (event.key === 'Home') to = 'first';
    else if (event.key === 'End') to = 'last';
    else return;
    event.preventDefault();
    this.#ctrl.send({ type: 'MOVE', to });
  };

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    this[INTERNALS].ariaOrientation = this.orientation === 'vertical' ? 'vertical' : null;
  }

  protected override firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    // Reads the items the slot already holds: happy-dom delivers the first `slotchange` before the listener exists.
    this.#refresh();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    const index = this.#ctrl.context?.get('activeIndex');
    if (index !== undefined && this.#items.length > 0) this.#writeTabStops(index);
  }

  override render(): TemplateResult {
    return html`<slot @slotchange=${this.#refresh}></slot>`;
  }
}

customElements.define('line-button-group', LineButtonGroup);

declare global {
  interface HTMLElementTagNameMap {
    'line-button-group': LineButtonGroup;
  }
}
