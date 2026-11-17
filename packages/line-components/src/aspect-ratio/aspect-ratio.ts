import { LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import { type ComplexAttributeConverter, css, html, type PropertyDeclarations, type TemplateResult } from 'lit';
import type { AspectRatioPreset } from './aspect-ratio.types.js';

const RATIOS: readonly AspectRatioPreset[] = ['square', 'landscape', 'portrait', 'widescreen', 'ultrawide', 'golden'];

/** An unknown variant value behaves as no attribute, so the `:host` default of its token applies. */
function variantConverter<T extends string>(values: readonly T[]): ComplexAttributeConverter<T | undefined> {
  return { fromAttribute: (value) => values.find((entry) => entry === value) };
}

/**
 * `<line-aspect-ratio>` holds its content at a fixed width-to-height ratio, such as a 16:9 frame for a video or a
 * square tile for an avatar. The box takes its width from its container and its height from the ratio. `ratio` picks
 * one of the six named ratios of the `line-tokens` `aspects` family; any other ratio goes through
 * `--line-aspect-ratio-ratio`, as in `line-aspect-ratio { --line-aspect-ratio-ratio: 21 / 9; }`.
 *
 * The host is a one-cell grid: every child shares the cell and fills the box unless it sets its own size, and a child
 * that sets a smaller size sits at the start corner. Images and videos are cropped to the box with `object-fit: cover`;
 * an `object-fit` on the child wins. Content taller than the box spills past its bottom edge over what follows,
 * because the box never clips; set `overflow: hidden` on the host to clip it. A bare text node beside an element takes
 * its own row below the cell, so wrap text in an element.
 *
 * In a flex row, such as a horizontal `<line-stack>`, the box is as wide as its content and as tall as the row, so it
 * needs a width or `flex: 1` and start alignment (`align="start"`) to keep its ratio. In a `<line-grid>` at its
 * default `align`, a taller item in the same row stretches the box past its ratio, and `justify-items` other than
 * `stretch` can widen it past its column; keep `justify-items` at `stretch` and set `align="start"` on the Grid.
 *
 * It adds no role, so it stays `generic`, and it takes no focus. A name applies only with an author role that allows
 * one, such as `role="img"` with `alt=""` on any decorative image inside, or `role="group"`. A consumer `display`
 * rule on the host shows a hidden box unless it excludes `[hidden]`, as in
 * `line-aspect-ratio:not([hidden]) { display: inline-grid; inline-size: 10rem; }`.
 *
 * @summary A layout container that holds its content at a fixed width-to-height ratio.
 *
 * @slot - The content of the box; every child shares the one cell and fills it unless it sets its own size.
 *
 * @cssprop [--line-aspect-ratio-ratio=var(--line-aspect-square, 1)] - The ratio of the box; `ratio="landscape" | "portrait" | "widescreen" | "ultrawide" | "golden"` uses `var(--line-aspect-landscape | -portrait | -widescreen | -ultrawide | -golden)`, each with its token value as a fallback. Set it to any other ratio, such as `21 / 9`.
 */
export class LineAspectRatio extends LineElement {
  static override properties: PropertyDeclarations = {
    ratio: { reflect: true, converter: variantConverter(RATIOS) },
  };

  static override styles = [
    commonReset,
    css`
      :host {
        --line-aspect-ratio-ratio: var(--line-aspect-square, 1);

        display: grid;
        grid-template: minmax(0, 1fr) / minmax(0, 1fr);
        aspect-ratio: var(--line-aspect-ratio-ratio);
        min-block-size: 0;
      }

      :host([ratio='landscape']) {
        --line-aspect-ratio-ratio: var(--line-aspect-landscape, 4 / 3);
      }

      :host([ratio='portrait']) {
        --line-aspect-ratio-ratio: var(--line-aspect-portrait, 3 / 4);
      }

      :host([ratio='widescreen']) {
        --line-aspect-ratio-ratio: var(--line-aspect-widescreen, 16 / 9);
      }

      :host([ratio='ultrawide']) {
        --line-aspect-ratio-ratio: var(--line-aspect-ultrawide, 18 / 5);
      }

      :host([ratio='golden']) {
        --line-aspect-ratio-ratio: var(--line-aspect-golden, 1.618 / 1);
      }

      ::slotted(*) {
        grid-area: 1 / 1;
        place-self: stretch;
        max-inline-size: 100%;
        max-block-size: 100%;
      }

      ::slotted(:is(img, video)) {
        object-fit: cover;
      }

      :host([hidden]) {
        display: none;
      }
    `,
  ];

  /** The shape of the box, one of the six named ratios; with none, or an unknown value, the box is square. */
  declare ratio: AspectRatioPreset | undefined;

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}

customElements.define('line-aspect-ratio', LineAspectRatio);

declare global {
  interface HTMLElementTagNameMap {
    'line-aspect-ratio': LineAspectRatio;
  }
}
