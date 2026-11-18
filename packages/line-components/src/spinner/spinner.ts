import { INTERNALS, LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import {
  type ComplexAttributeConverter,
  css,
  html,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import type { SpinnerSize, SpinnerSpeed } from './spinner.types.js';

const SIZES: readonly SpinnerSize[] = ['1', '2', '3', '4', '5', '6'];
const SPEEDS: readonly SpinnerSpeed[] = ['slow', 'normal', 'fast'];
/** The host attributes that name the spinner besides `label`; a change re-runs the semantics (spec 0022-spinner.md D9). */
const NAME_ATTRIBUTES = ['aria-label', 'aria-labelledby'];

/** An unknown variant value behaves as no attribute, so the `:host` default of its token applies. */
function variantConverter<T extends string>(values: readonly T[]): ComplexAttributeConverter<T | undefined> {
  return { fromAttribute: (value) => values.find((entry) => entry === value) };
}

/**
 * `<line-spinner>` is a loading indicator, a small ring that turns while something is in progress. It draws in the
 * colour and at the size of the surrounding text; `size` picks a size step and `speed` the time of one turn.
 *
 * With a name from `label`, `aria-label` or `aria-labelledby`, assistive technology finds it as an indeterminate
 * progress bar with that name; a host `aria-label` or `aria-labelledby` wins over `label`. Without a name it is
 * decorative and hidden. Leave a spinner in a Button's `loading` slot unnamed and put the loading text beside it,
 * because a named spinner joins the button's name. Put `aria-busy="true"` on the region that is loading while the
 * spinner shows. The component ships no default string; "Loading" is yours to write and localise.
 *
 * When the user asks the system for reduced motion, the ring pulses in place instead of turning; a page rule
 * `line-spinner::part(root) { animation: … }` naming page keyframes brings rotation back. The keyframe names are
 * internal, so custom motion goes through such a rule. `--line-spinner-iteration-count` sets a finite number of turns.
 *
 * @summary A loading indicator, a ring that turns while work is in progress.
 *
 * @csspart root - The ring: its size, border, colours and motion.
 *
 * @cssprop [--line-spinner-size=1em] - Inline and block size of the host; `var(--line-size-3)` … `var(--line-size-8)` for `size="1"` … `"6"`, each with its token value as a fallback.
 * @cssprop [--line-spinner-width=0.125em] - Border width of the ring.
 * @cssprop [--line-spinner-color=currentColor] - Colour of the ring; ignored under forced colors, where `root` paints `CanvasText` with a `Canvas` gap.
 * @cssprop [--line-spinner-keyframes=line-spinner-spin] - The internal keyframes `root` runs; `line-spinner-pulse` under reduced motion; `none` stops the motion.
 * @cssprop [--line-spinner-duration=var(--line-motion-6, 1s)] - Duration of one cycle; `var(--line-motion-7, 2s)` for `speed="slow"` and under reduced motion, `var(--line-motion-slow, 0.75s)` for `speed="fast"`.
 * @cssprop [--line-spinner-easing=var(--line-easing-linear, cubic-bezier(0, 0, 1, 1))] - Timing function of the motion; `var(--line-easing-in-out, cubic-bezier(0.4, 0, 0.2, 1))` under reduced motion.
 * @cssprop [--line-spinner-iteration-count=infinite] - How many cycles the motion runs; a finite count leaves a still ring after the last one.
 */
export class LineSpinner extends LineElement {
  static override properties: PropertyDeclarations = {
    label: {},
    size: { reflect: true, converter: variantConverter(SIZES) },
    speed: { reflect: true, converter: variantConverter(SPEEDS) },
  };

  static override styles = [
    commonReset,
    css`
      :host {
        --line-spinner-size: 1em;
        --line-spinner-width: 0.125em;
        --line-spinner-color: currentColor;
        --line-spinner-keyframes: line-spinner-spin;
        --line-spinner-duration: var(--line-motion-6, 1s);
        --line-spinner-easing: var(--line-easing-linear, cubic-bezier(0, 0, 1, 1));
        --line-spinner-iteration-count: infinite;

        display: inline-block;
        flex-shrink: 0;
        inline-size: var(--line-spinner-size);
        block-size: var(--line-spinner-size);
      }

      :host([size='1']) {
        --line-spinner-size: var(--line-size-3, 1rem);
      }

      :host([size='2']) {
        --line-spinner-size: var(--line-size-4, 1.25rem);
      }

      :host([size='3']) {
        --line-spinner-size: var(--line-size-5, 1.5rem);
      }

      :host([size='4']) {
        --line-spinner-size: var(--line-size-6, 1.75rem);
      }

      :host([size='5']) {
        --line-spinner-size: var(--line-size-7, 2rem);
      }

      :host([size='6']) {
        --line-spinner-size: var(--line-size-8, 3rem);
      }

      :host([speed='slow']) {
        --line-spinner-duration: var(--line-motion-7, 2s);
      }

      :host([speed='fast']) {
        --line-spinner-duration: var(--line-motion-slow, 0.75s);
      }

      /* Normal importance and after the speed rules, so a page ::part(root) rule can opt back in (spec 0022-spinner.md F4). */
      @media (prefers-reduced-motion: reduce) {
        :host,
        :host([speed]) {
          --line-spinner-keyframes: line-spinner-pulse;
          --line-spinner-duration: var(--line-motion-7, 2s);
          --line-spinner-easing: var(--line-easing-in-out, cubic-bezier(0.4, 0, 0.2, 1));
        }
      }

      [part='root'] {
        display: block;
        box-sizing: border-box;
        inline-size: 100%;
        block-size: 100%;
        border: var(--line-spinner-width) solid var(--line-spinner-color);
        border-inline-end-color: transparent;
        border-radius: 50%;
        animation-name: var(--line-spinner-keyframes);
        animation-duration: var(--line-spinner-duration);
        animation-timing-function: var(--line-spinner-easing);
        animation-iteration-count: var(--line-spinner-iteration-count);
      }

      /* On root, not the token, so the gap stays visible whatever colour the consumer set (spec 0022-spinner.md D7). */
      @media (forced-colors: active) {
        [part='root'] {
          border-color: CanvasText;
          border-inline-end-color: Canvas;
        }
      }

      @keyframes line-spinner-spin {
        to {
          transform: rotate(1turn);
        }
      }

      @keyframes line-spinner-pulse {
        50% {
          opacity: 0.4;
        }
      }

      :host([hidden]) {
        display: none;
      }
    `,
  ];

  static override get observedAttributes(): string[] {
    // biome-ignore lint/complexity/noThisInStatic: `super` runs Lit's getter for LineSpinner; `LineElement.observedAttributes` lists LineElement's attributes only.
    return [...super.observedAttributes, ...NAME_ATTRIBUTES];
  }

  /**
   * The accessible name, such as "Loading orders". With no non-blank `label`, `aria-label` or `aria-labelledby` the
   * spinner is decorative and hidden.
   */
  declare label: string | undefined;
  /** A size step, `1`–`6`; with none, or an unknown value, the spinner takes the text size. */
  declare size: SpinnerSize | undefined;
  /** The time of one turn, `slow` (2 s), `normal` (1 s) or `fast` (0.75 s); with none, or an unknown value, 1 s. */
  declare speed: SpinnerSpeed | undefined;

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    if (NAME_ATTRIBUTES.includes(name)) {
      this.#writeSemantics();
    }
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (!this.hasUpdated || changed.has('label')) {
      this.#writeSemantics();
    }
  }

  protected override render(): TemplateResult {
    return html`<span part="root"></span>`;
  }

  /** A `progressbar` named by `label` while any name is present; decorative and hidden with none. */
  #writeSemantics(): void {
    const label = this.label?.trim() ? this.label : null;
    const named = Boolean(
      label || this.getAttribute('aria-label')?.trim() || this.getAttribute('aria-labelledby')?.trim(),
    );
    const internals = this[INTERNALS];
    internals.role = named ? 'progressbar' : null;
    internals.ariaHidden = named ? null : 'true';
    internals.ariaLabel = label;
  }
}

customElements.define('line-spinner', LineSpinner);

declare global {
  interface HTMLElementTagNameMap {
    'line-spinner': LineSpinner;
  }
}
