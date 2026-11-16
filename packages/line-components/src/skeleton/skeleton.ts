import { LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import { css, html, type PropertyDeclarations, type PropertyValues, type TemplateResult } from 'lit';
import type { SkeletonAnimation, SkeletonShape } from './skeleton.types.js';

/** The most items one host draws, which bounds a hostile `lines` (spec 0016-skeleton.md D8). */
const MAX_LINES = 20;

/**
 * `<line-skeleton>` is a placeholder that stands where content will appear once it loads, so the page keeps its
 * layout while it waits. `shape` draws a block (`rect`, the default), a circle (`circle`) or lines of text sized to the
 * surrounding font (`text`), and `lines` draws that many items, from 1 to 20, the last of several shorter.
 *
 * The placeholder is hidden from assistive technology and takes no label. Put `aria-busy="true"` on the region that is
 * loading, such as the card or the list, while the placeholders show, and remove it when the content arrives; then
 * replace the placeholder with the content. Do not put `aria-label` on the host, because it has no role a name could
 * attach to, and do not put a skeleton alone inside a button or a link, which would leave the control without a name.
 *
 * `animation` is `pulse` (default), `wave` or `none`. The motion stops after two cycles, and it does not run while the
 * user asks the system for reduced motion; a page rule `line-skeleton::part(item) { animation: … }` naming page
 * keyframes brings it back. The keyframe names are internal.
 *
 * The host takes no space until its module runs. Reserve it with a page rule such as
 * `line-skeleton:not(:defined) { display: block; block-size: var(--line-size-4); }`.
 *
 * @summary A loading placeholder that keeps the layout of content still to come.
 *
 * @csspart root - The column of items; its `gap` spaces them.
 * @csspart item - One line or shape: its size, radius, fill, wave band and motion.
 *
 * @cssprop [--line-skeleton-bg=var(--line-gray-bg)] - Fill of each `item` and the ends of the wave band; the consumer sets it on the host to choose the fill. Ignored under forced colors, where `item` paints `GrayText`.
 * @cssprop [--line-skeleton-wave-color=var(--line-gray-surface)] - Middle of the wave band; the consumer sets it on the host to choose the band. Ignored under forced colors, where `item` draws no band.
 * @cssprop [--line-skeleton-radius=var(--line-radius-2)] - Corner radius of each `item`; `50%` for `circle`, `var(--line-radius-1)` for `text`.
 * @cssprop [--line-skeleton-inline-size=100%] - Inline size of each `item`; `var(--line-skeleton-block-size)` for `circle`.
 * @cssprop [--line-skeleton-block-size=var(--line-size-4)] - Block size of each `item`; `var(--line-size-8)` for `circle`, `1em` for `text`.
 * @cssprop [--line-skeleton-line-margin=0px] - Block margin of each `item`; `calc((1lh - 1em) / 2)` for `text`, so a line takes one line box.
 * @cssprop [--line-skeleton-gap=var(--line-size-2)] - Gap of `root`, between items; `0px` for `text`.
 * @cssprop [--line-skeleton-last-line-size=60%] - Inline size of the last `item` of several; `var(--line-skeleton-block-size)` for `circle`.
 * @cssprop [--line-skeleton-keyframes=line-skeleton-pulse] - The internal keyframes `item` runs; `line-skeleton-wave` for `wave`, `none` for `none` and under reduced motion.
 * @cssprop [--line-skeleton-wave-image=linear-gradient(90deg, var(--line-skeleton-bg) 0%, var(--line-skeleton-wave-color) 50%, var(--line-skeleton-bg) 100%)] - The wave band, painted only while the wave keyframes run.
 * @cssprop [--line-skeleton-duration=var(--line-motion-7)] - Duration of one motion cycle.
 * @cssprop [--line-skeleton-easing=var(--line-easing-in-out)] - Timing function of the motion; `var(--line-easing-linear)` for `wave`.
 * @cssprop [--line-skeleton-iteration-count=2] - How many cycles the motion runs; `infinite` keeps it running, and the app then owns WCAG 2.2.2.
 */
export class LineSkeleton extends LineElement {
  static override properties: PropertyDeclarations = {
    shape: { reflect: true, useDefault: true },
    lines: { type: Number },
    animation: { reflect: true, useDefault: true },
  };

  static override styles = [
    commonReset,
    css`
      :host {
        --line-skeleton-bg: var(--line-gray-bg);
        --line-skeleton-wave-color: var(--line-gray-surface);
        --line-skeleton-radius: var(--line-radius-2);
        --line-skeleton-inline-size: 100%;
        --line-skeleton-block-size: var(--line-size-4);
        --line-skeleton-line-margin: 0px;
        --line-skeleton-gap: var(--line-size-2);
        --line-skeleton-last-line-size: 60%;
        --line-skeleton-keyframes: line-skeleton-pulse;
        --line-skeleton-wave-image: linear-gradient(
          90deg,
          var(--line-skeleton-bg) 0%,
          var(--line-skeleton-wave-color) 50%,
          var(--line-skeleton-bg) 100%
        );
        --line-skeleton-duration: var(--line-motion-7);
        --line-skeleton-easing: var(--line-easing-in-out);
        --line-skeleton-iteration-count: 2;

        display: block;
      }

      :host([hidden]) {
        display: none;
      }

      :host([shape='circle']) {
        --line-skeleton-radius: 50%;
        --line-skeleton-block-size: var(--line-size-8);
        --line-skeleton-inline-size: var(--line-skeleton-block-size);
        --line-skeleton-last-line-size: var(--line-skeleton-block-size);
      }

      :host([shape='text']) {
        --line-skeleton-radius: var(--line-radius-1);
        --line-skeleton-block-size: 1em;
        --line-skeleton-line-margin: calc((1lh - 1em) / 2);
        --line-skeleton-gap: 0px;
      }

      :host([animation='wave']) {
        --line-skeleton-keyframes: line-skeleton-wave;
        --line-skeleton-easing: var(--line-easing-linear);
      }

      :host([animation='none']) {
        --line-skeleton-keyframes: none;
      }

      /* Normal importance, so a page ::part(item) rule can opt back in (spec 0016-skeleton.md F3, D18). */
      @media (prefers-reduced-motion: reduce) {
        :host,
        :host([animation]) {
          --line-skeleton-keyframes: none;
        }
      }

      [part='root'] {
        display: flex;
        flex-direction: column;
        gap: var(--line-skeleton-gap);
      }

      [part='item'] {
        inline-size: var(--line-skeleton-inline-size);
        block-size: var(--line-skeleton-block-size);
        margin-block: var(--line-skeleton-line-margin);
        border-radius: var(--line-skeleton-radius);
        background-color: var(--line-skeleton-bg);
        background-size: 200% 100%;
        animation-name: var(--line-skeleton-keyframes);
        animation-duration: var(--line-skeleton-duration);
        animation-timing-function: var(--line-skeleton-easing);
        animation-iteration-count: var(--line-skeleton-iteration-count);
      }

      [part='item']:last-child:not(:first-child) {
        inline-size: var(--line-skeleton-last-line-size);
      }

      :host(:dir(rtl)) [part='item'] {
        animation-direction: reverse;
      }

      /* On item, not the tokens, so a consumer colour on the host cannot bring Canvas back (spec 0016-skeleton.md D20). */
      @media (forced-colors: active) {
        [part='item'] {
          background-color: GrayText;
          background-image: none;
        }
      }

      @keyframes line-skeleton-pulse {
        50% {
          opacity: 0.5;
        }
      }

      /* The band lives only here, so a resting item shows the plain fill (spec 0016-skeleton.md D17). */
      @keyframes line-skeleton-wave {
        from {
          background-image: var(--line-skeleton-wave-image);
          background-position: 100% 0;
        }
        to {
          background-image: var(--line-skeleton-wave-image);
          background-position: -100% 0;
        }
      }
    `,
  ];

  /** The shape of each item; an unknown value behaves as `rect`. */
  declare shape: SkeletonShape;

  /** How many items to draw, from 1 to 20, the last of several shorter; any other value draws one or twenty. */
  declare lines: number;

  /** The motion; an unknown value behaves as `pulse`. */
  declare animation: SkeletonAnimation;

  /** The item count, derived from `lines` in `willUpdate`. */
  #count = 1;

  constructor() {
    super();
    // `useDefault` keeps these initial values out of the attributes, so the stylesheet styles each default without
    // its attribute and an unknown author value stays (spec 0016-skeleton.md D8).
    this.shape = 'rect';
    this.lines = 1;
    this.animation = 'pulse';
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    // `Number.isInteger` rejects NaN, Infinity, fractions and non-numbers, which draw one item; nothing throws (D8).
    const { lines } = this;
    this.#count = Number.isInteger(lines) ? Math.min(Math.max(lines, 1), MAX_LINES) : 1;
  }

  override render(): TemplateResult {
    return html`<div part="root" aria-hidden="true">${Array.from(
      { length: this.#count },
      () => html`<div part="item"></div>`,
    )}</div>`;
  }
}

customElements.define('line-skeleton', LineSkeleton);

declare global {
  interface HTMLElementTagNameMap {
    'line-skeleton': LineSkeleton;
  }
}
