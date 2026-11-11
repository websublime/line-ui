import { INTERNALS, LineElement } from '@websublime/line-core';
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
import type { AvatarGroupSize, AvatarGroupSpacing } from './avatar-group.types.js';
import {
  type AvatarGroupMachineProps,
  type AvatarGroupMachineSchema,
  avatarGroupMachine,
} from './avatar-group-machine.js';

const SIZES: readonly AvatarGroupSize[] = ['1', '2', '3', '4', '5'];
const SPACINGS: readonly AvatarGroupSpacing[] = ['0', '1', '2', '3'];

/** The placeholder `overflow-label` replaces with the formatted count (decisions F7, D24). */
const COUNT = '{count}';

/** An unknown value behaves as no attribute, so the default applies; the attribute keeps what the author wrote. */
function stepConverter<T extends string>(values: readonly T[]): ComplexAttributeConverter<T | undefined> {
  return { fromAttribute: (value) => values.find((entry) => entry === value) };
}

/** An integer of 1 or more, else `undefined`, which means no limit (decision D3). */
function validMax(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : undefined;
}

/** `max` from its attribute: a missing value, a value that is not an integer and one below 1 mean no limit (D3). */
const maxConverter: ComplexAttributeConverter<number | undefined> = {
  fromAttribute: (value) => (value === null || value.trim() === '' ? undefined : validMax(Number(value))),
};

/** A `toggle` or `beforetoggle` event; happy-dom has no `ToggleEvent`, so its tests send a plain event (D22). */
type PanelToggleEvent = Event & { newState?: string };

/**
 * `<line-avatar-group>` shows a row of overlapping avatars, such as the members of a project, and ends it with a
 * "+N" button when there are more than `max`. Put `<line-avatar>` elements in it, or one link per avatar around a
 * `<line-avatar>`, and set `max` to how many show. The rest move into a panel that the "+N" button opens, a native
 * `popover` that Escape, a click outside or a second press closes; focus returns to the button after Escape from
 * inside the panel. While a mouse or pen pointer rests on the group, or keyboard focus is within it, the avatars spread
 * apart toward inline-start so each face shows whole, and "+N" stays where it is; Escape stacks them again until the
 * pointer and focus have both left. A touch tap never spreads them by itself. While the stack is spread, its avatars
 * overlap the content before the group, so leave that space free or cap the stack with `max`.
 *
 * The group carries the `group` role on its host through `ElementInternals`, so the host `aria-label` or
 * `aria-labelledby` names it; name every group. The "+N" button is a native `<button>` named by its visible text, or
 * by `overflow-label`, a template such as `"+{count} more members"`. The group never writes on its children: it shows
 * each in the stack or in the panel by manual slot assignment, and sets `--line-avatar-size` and
 * `--line-avatar-ring-width` on its own host for the avatars to inherit. A child with `hidden` is left out. It fires
 * no event; `data-expanded` and `data-open`, with `:state(expanded)` and `:state(open)`, follow the stack and the
 * panel, and `data-focus-visible` the button's keyboard focus.
 *
 * @summary A row of overlapping avatars that ends in a "+N" button opening a panel with the rest.
 *
 * @slot - The avatars, in order: `<line-avatar>` elements, or one element per avatar such as `<a href><line-avatar></a>`. Every element child without `hidden` counts as one avatar; the first `max` show in the stack and the rest in the panel.
 *
 * @csspart root - Wraps the "+N" button: its box, radius and default focus ring while the host has `data-focus-visible`.
 * @csspart overflow - The "+N" native `<button>`, an avatar-sized circle that opens the panel.
 * @csspart content - The panel holding the avatars past `max`, a native `popover`: box, background, border, shadow and position.
 *
 * @cssprop [--line-avatar-group-overlap=var(--line-size-2)] - How far each avatar and "+N" overlap the one before while stacked; `spacing="0"` uses `0px` and `spacing="N"` uses `var(--line-size-N)`.
 * @cssprop [--line-avatar-group-gap=var(--line-size-1)] - Space between the avatars while spread.
 * @cssprop [--line-avatar-group-duration=var(--line-motion-fast)] - Duration of the spread and stack transition; `0s` under `prefers-reduced-motion: reduce`.
 * @cssprop [--line-avatar-group-focus-ring=var(--line-focus-ring, 2px solid currentColor)] - `outline` of `root` while the host has `data-focus-visible`.
 * @cssprop [--line-avatar-group-content-bg=var(--line-gray-1, Canvas)] - Background of `content`.
 * @cssprop [--line-avatar-group-content-border-color=var(--line-gray-border)] - Border colour of `content`.
 * @cssprop [--line-avatar-group-content-border-width=var(--line-border-1)] - Border width of `content`.
 * @cssprop [--line-avatar-group-content-radius=var(--line-radius-2)] - Corner radius of `content`.
 * @cssprop [--line-avatar-group-content-shadow=var(--line-shadow-3)] - Shadow of `content`.
 * @cssprop [--line-avatar-group-content-padding=var(--line-size-2)] - Padding of `content`.
 * @cssprop [--line-avatar-group-content-gap=var(--line-size-1)] - Space between the avatars in `content`, which wrap.
 * @cssprop [--line-avatar-group-content-offset=var(--line-size-1)] - Space between the "+N" button and `content`.
 * @cssprop [--line-avatar-group-content-max-inline-size=var(--line-size-xs)] - Maximum inline size of `content`.
 */
export class LineAvatarGroup extends LineElement {
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, slotAssignment: 'manual' };

  static override properties: PropertyDeclarations = {
    max: { converter: maxConverter },
    size: { reflect: true, converter: stepConverter(SIZES) },
    spacing: { reflect: true, converter: stepConverter(SPACINGS) },
    overflowLabel: { attribute: 'overflow-label' },
  };

  static override styles = [
    commonReset,
    buttonReset,
    css`
      :host {
        --line-avatar-group-overlap: var(--line-size-2);
        --line-avatar-group-gap: var(--line-size-1);
        --line-avatar-group-duration: var(--line-motion-fast);
        --line-avatar-group-focus-ring: var(--line-focus-ring, 2px solid currentColor);
        --line-avatar-group-content-bg: var(--line-gray-1, Canvas);
        --line-avatar-group-content-border-color: var(--line-gray-border);
        --line-avatar-group-content-border-width: var(--line-border-1);
        --line-avatar-group-content-radius: var(--line-radius-2);
        --line-avatar-group-content-shadow: var(--line-shadow-3);
        --line-avatar-group-content-padding: var(--line-size-2);
        --line-avatar-group-content-gap: var(--line-size-1);
        --line-avatar-group-content-offset: var(--line-size-1);
        --line-avatar-group-content-max-inline-size: var(--line-size-xs);
        --line-avatar-ring-width: var(--line-border-2);

        display: inline-flex;
        align-items: center;
      }

      :host([hidden]) {
        display: none;
      }

      @media (prefers-reduced-motion: reduce) {
        :host {
          --line-avatar-group-duration: 0s;
        }
      }

      :host([size='1']) {
        --line-avatar-size: var(--line-size-5);
      }

      :host([size='2']) {
        --line-avatar-size: var(--line-size-6);
      }

      :host([size='3']) {
        --line-avatar-size: var(--line-size-7);
      }

      :host([size='4']) {
        --line-avatar-size: var(--line-size-8);
      }

      :host([size='5']) {
        --line-avatar-size: var(--line-size-9);
      }

      :host([spacing='0']) {
        --line-avatar-group-overlap: 0px;
      }

      :host([spacing='1']) {
        --line-avatar-group-overlap: var(--line-size-1);
      }

      :host([spacing='2']) {
        --line-avatar-group-overlap: var(--line-size-2);
      }

      :host([spacing='3']) {
        --line-avatar-group-overlap: var(--line-size-3);
      }

      /* Inline-flex, so translate applies to every level and no line box forms around a slotted link (D20). */
      .level,
      .item {
        display: inline-flex;
        align-items: center;
      }

      .level {
        transition: translate var(--line-avatar-group-duration);
      }

      .level + .item,
      .level + [part='root'] {
        margin-inline-start: calc(-1 * var(--line-avatar-group-overlap));
      }

      /* Each level moves one step toward inline-start, so child k of N moves N − k + 1 steps (F14; D4, D20). */
      :host([data-expanded]) .level {
        translate: calc(-1 * (var(--line-avatar-group-overlap) + var(--line-avatar-group-gap))) 0;
      }

      :host([data-expanded]:dir(rtl)) .level {
        translate: calc(var(--line-avatar-group-overlap) + var(--line-avatar-group-gap)) 0;
      }

      /* Positioned, so "+N" paints over the positioned avatars before it, in DOM order. */
      [part='root'] {
        display: inline-flex;
        position: relative;
        anchor-name: --line-avatar-group-trigger;
        border-radius: var(--line-avatar-radius, var(--line-radius-round));
      }

      :host([data-focus-visible]) [part='root'] {
        outline: var(--line-avatar-group-focus-ring);
      }

      [part='overflow'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: var(--line-avatar-size, var(--line-size-7));
        block-size: var(--line-avatar-size, var(--line-size-7));
        border-radius: var(--line-avatar-radius, var(--line-radius-round));
        background-color: var(--line-avatar-bg, var(--line-gray-bg));
        color: var(--line-avatar-color, var(--line-gray-text));
        font-size: var(--line-avatar-font-size, calc(var(--line-avatar-size, var(--line-size-7)) * 0.4));
        font-weight: var(--line-avatar-font-weight, var(--line-font-weight-5));
        line-height: 1;
        white-space: nowrap;
        box-shadow: 0 0 0 var(--line-avatar-ring-width, 0px) var(--line-avatar-ring-color, var(--line-gray-1, Canvas));
      }

      /*
       * The UA centres a popover; the panel sits under "+N" at the host's inline-start instead, through anchor()
       * insets keyed by the host's direction, which hold in a subtree of the other direction (D9; AM-006).
       */
      [part='content'] {
        position-anchor: --line-avatar-group-trigger;
        margin: 0;
        margin-block-start: var(--line-avatar-group-content-offset);
        inset: auto;
        top: anchor(bottom);
        left: anchor(left);
        position-try-fallbacks: flip-block, flip-inline;
        max-inline-size: var(--line-avatar-group-content-max-inline-size);
        padding: var(--line-avatar-group-content-padding);
        border: var(--line-avatar-group-content-border-width) solid var(--line-avatar-group-content-border-color);
        border-radius: var(--line-avatar-group-content-radius);
        background-color: var(--line-avatar-group-content-bg);
        box-shadow: var(--line-avatar-group-content-shadow);
      }

      :host(:dir(rtl)) [part='content'] {
        left: auto;
        right: anchor(right);
      }

      /* Only while open: an author display would override the UA rule that hides a closed popover. */
      [part='content']:popover-open {
        display: flex;
        flex-wrap: wrap;
        gap: var(--line-avatar-group-content-gap);
      }
    `,
  ];

  /** How many avatars show in the stack; the rest go to the panel. Missing, not an integer, or below 1 means no limit. */
  declare max: number | undefined;
  /** The avatar size step, `1` (smallest) to `5` (largest); an unknown value leaves the avatars' own size. */
  declare size: AvatarGroupSize | undefined;
  /** The overlap step of the stacked avatars, `0` (none) to `3` (most); an unknown value keeps the default overlap. */
  declare spacing: AvatarGroupSpacing | undefined;
  /**
   * The "+N" button's accessible name, with every `{count}` replaced by the count, such as `"+{count} more members"`.
   * A label without `{count}` follows the visible "+N" and a space; blank leaves the visible "+N" as the name.
   */
  declare overflowLabel: string;

  /** The counted children: every element child without `hidden`, in order (decisions F5, D14). */
  #children: Element[] = [];
  /** Keyboard focus on the overflow button; a host field, not machine context, so it survives the fallback (D27). */
  #focusVisible = false;
  /** Whether focus was inside the panel at the `beforetoggle` that preceded a close (decision D7). */
  #focusInside = false;
  /** Set once `updated()` asked the panel to close after the overflow emptied, until the panel closes (D21). */
  #hiding = false;
  /** The count formatter, kept for the language it was built for (D15). */
  #formatter: { lang: string | undefined; format: Intl.NumberFormat } | undefined;
  /** Watches the children and their `hidden` attribute: manual assignment fires no `slotchange` on append (D13). */
  readonly #observer = new MutationObserver(() => this.#read());

  readonly #restoreFocus = (): void => {
    this.renderRoot
      .querySelector<HTMLButtonElement>('[part="overflow"]')
      ?.focus({ focusVisible: true } as FocusOptions);
  };

  readonly #machineProps = (): AvatarGroupMachineProps => ({
    overflowCount: this.#overflowCount(),
    restoreFocus: this.#restoreFocus,
  });

  readonly #ctrl = new LineMachineController<AvatarGroupMachineSchema>(this, {
    machine: avatarGroupMachine,
    props: this.#machineProps,
  });

  constructor() {
    super();
    // A method call, because the manifest analyser lists every `x.name =` statement of a constructor as a field.
    this.#initialise();
    this.addEventListener('pointerenter', this.#onPointerEnter);
    this.addEventListener('pointerleave', this.#onPointerLeave);
    this.addEventListener('focusin', this.#onFocusIn);
    this.addEventListener('focusout', this.#onFocusOut);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  #initialise(): void {
    this.overflowLabel = '';
    this[INTERNALS].role = 'group';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Manual assignment involves no slot, so the children are read before the first render (D13).
    this.#read();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  /** Reads the counted children and re-registers the observer on the host and on each element child (D13, D14). */
  #read(): void {
    this.#observer.disconnect();
    const elements = [...this.children];
    this.#children = elements.filter((child) => !child.hasAttribute('hidden'));
    this.#observer.observe(this, { childList: true, subtree: false });
    for (const child of elements) this.#observer.observe(child, { attributes: true, attributeFilter: ['hidden'] });
    this.requestUpdate();
  }

  /** The number of children in the stack: the first `max`, or all of them without a limit (D3). */
  #stackCount(): number {
    const limit = validMax(this.max);
    return limit === undefined ? this.#children.length : Math.min(limit, this.#children.length);
  }

  /** The number of children past `max`; `0` when none (D23). */
  #overflowCount(): number {
    return this.#children.length - this.#stackCount();
  }

  #panel(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('[part="content"]') ?? null;
  }

  #panelSlot(): HTMLSlotElement | null {
    return this.renderRoot?.querySelector<HTMLSlotElement>('[part="content"] > slot') ?? null;
  }

  /** The machine state, or `undefined` while the machine has failed (MANIFESTO Law 9). */
  #state(): AvatarGroupMachineSchema['state'] | undefined {
    return this.#ctrl.fallback ? undefined : this.#ctrl.state?.get();
  }

  /** The panel is open: the machine is in `overflow_open`, or, in the fallback, the panel matches `:popover-open` (D21). */
  #panelOpen(): boolean {
    if (this.#ctrl.fallback) return this.#panel()?.matches(':popover-open') ?? false;
    return this.#state() === 'overflow_open';
  }

  /** Whether the active element of the host's root is a child in the panel or inside one (decision D7). */
  #focusInPanel(): boolean {
    const active = (this.getRootNode() as Document | ShadowRoot).activeElement;
    if (!active) return false;
    return (
      this.#panelSlot()
        ?.assignedElements()
        .some((child) => child === active || child.contains(active)) ?? false
    );
  }

  /** The nearest `lang` of the host, across enclosing shadow roots, else the document's (D15). */
  #language(): string | undefined {
    for (let element: Element | null = this; element; ) {
      const owner = element.closest('[lang]');
      if (owner) return owner.getAttribute('lang') || undefined;
      const root = element.getRootNode();
      element = root instanceof ShadowRoot ? root.host : null;
    }
    return document.documentElement.lang || undefined;
  }

  /** `count` formatted for the host's language (D15); an unknown language tag falls back to the default locale. */
  #format(count: number): string {
    const lang = this.#language();
    let formatter = this.#formatter;
    if (formatter === undefined || formatter.lang !== lang) {
      let format: Intl.NumberFormat;
      try {
        format = new Intl.NumberFormat(lang);
      } catch {
        format = new Intl.NumberFormat();
      }
      formatter = { lang, format };
      this.#formatter = formatter;
    }
    return formatter.format.format(count);
  }

  /** The button's `aria-label` from `overflow-label`, or `''` to leave the visible "+N" as the name (F7; D24). */
  #label(count: string, visible: string): string {
    const template = (this.overflowLabel ?? '').trim();
    if (template === '') return '';
    return template.includes(COUNT) ? template.replaceAll(COUNT, count) : `${visible} ${template}`;
  }

  readonly #onPointerEnter = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') this.#ctrl.send({ type: 'HOVER.START' });
  };

  readonly #onPointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') this.#ctrl.send({ type: 'HOVER.END' });
  };

  /** Only keyboard focus expands the stack: the focused element must match `:focus-visible` (decision F13). */
  readonly #onFocusIn = (event: FocusEvent): void => {
    const target = event.composedPath()[0];
    if (target instanceof Element && target.matches(':focus-visible')) this.#ctrl.send({ type: 'FOCUS.IN' });
  };

  readonly #onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    if (next instanceof Node && (next === this || this.contains(next) || this.renderRoot.contains(next))) return;
    this.#ctrl.send({ type: 'FOCUS.OUT' });
  };

  /** Escape on the host while the panel is closed dismisses the expansion, unless a child handled it (F2; D25). */
  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || event.defaultPrevented || this.#panelOpen()) return;
    this.#ctrl.send({ type: 'DISMISS' });
  };

  readonly #onBeforeToggle = (event: PanelToggleEvent): void => {
    if (event.newState === 'closed') this.#focusInside = this.#focusInPanel();
  };

  /** Follows the panel through `toggle`, reading `newState`, never `:popover-open` (decisions F1, D22). */
  readonly #onToggle = (event: PanelToggleEvent): void => {
    const open = event.newState === 'open';
    const focusInside = !open && this.#focusInside;
    this.#focusInside = false;
    if (this.#ctrl.fallback) this.requestUpdate();
    else this.#ctrl.send({ type: 'OPEN.CHANGE', open, focusInside });
  };

  readonly #onFocus = (event: FocusEvent): void => {
    this.#focusVisible = (event.currentTarget as HTMLButtonElement).matches(':focus-visible');
    this.requestUpdate();
  };

  readonly #onBlur = (): void => {
    this.#focusVisible = false;
    this.requestUpdate();
  };

  protected override update(changed: PropertyValues<this>): void {
    const state = this.#state();
    this.reflectState('expanded', state === 'expanded' || state === 'overflow_open');
    this.reflectState('open', state === 'overflow_open');
    this.reflectState('focus-visible', this.#focusVisible);
    super.update(changed);
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    this.#assign();
    // The overflow emptied while the panel is open: close it, and the toggle that follows lets the next render drop
    // the panel and the control (D21).
    if (this.#panelOpen() && this.#overflowCount() === 0) {
      if (!this.#hiding) {
        this.#hiding = true;
        this.#panel()?.hidePopover?.();
      }
    } else {
      this.#hiding = false;
    }
  }

  /** Assigns each stack child to its item's slot and the rest to the panel slot; writes nothing on them (F3, F4). */
  #assign(): void {
    const stack = this.#stackCount();
    const slots = this.renderRoot.querySelectorAll<HTMLSlotElement>('.item > slot');
    slots.forEach((slot, index) => {
      const child = index < stack ? this.#children[index] : undefined;
      if (child) slot.assign(child);
      else slot.assign();
    });
    this.#panelSlot()?.assign(...this.#children.slice(stack));
  }

  /** Level `k` holds level `k − 1` and the item of child `k`; level 1 holds only the item of child 1 (D20). */
  #level(k: number): TemplateResult {
    return html`<span class="level">${k > 1 ? this.#level(k - 1) : nothing}<span class="item"><slot></slot></span></span>`;
  }

  override render(): TemplateResult {
    const stack = this.#stackCount();
    const overflow = this.#overflowCount();
    const open = this.#panelOpen();
    const count = this.#format(overflow);
    const visible = `+${count}`;
    const label = this.#label(count, visible);
    const control =
      overflow > 0 || open
        ? html`<span part="root"
              ><button
                part="overflow"
                type="button"
                popovertarget="content"
                aria-controls="content"
                aria-expanded=${open ? 'true' : 'false'}
                aria-label=${label || nothing}
                @focus=${this.#onFocus}
                @blur=${this.#onBlur}
              >${visible}</button></span
            ><div part="content" id="content" popover="auto" @beforetoggle=${this.#onBeforeToggle} @toggle=${this.#onToggle}
              ><slot></slot
            ></div>`
        : nothing;
    return html`${stack > 0 ? this.#level(stack) : nothing}${control}`;
  }
}

customElements.define('line-avatar-group', LineAvatarGroup);

declare global {
  interface HTMLElementTagNameMap {
    'line-avatar-group': LineAvatarGroup;
  }
}
