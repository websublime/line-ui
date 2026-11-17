import { LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import { type ComplexAttributeConverter, css, html, type PropertyDeclarations, type TemplateResult } from 'lit';
import type { CenterAxis } from './center.types.js';

const AXES: readonly CenterAxis[] = ['both', 'horizontal', 'vertical'];

/** An unknown value behaves as `fallback`; the attribute keeps what the author wrote. */
function enumConverter<T extends string>(values: readonly T[], fallback: T): ComplexAttributeConverter<T> {
  return { fromAttribute: (value) => values.find((entry) => entry === value) ?? fallback };
}

/**
 * `<line-center>` centres its content horizontally, vertically or on both axes. The host is a flex container that
 * lays its children out as one column, in source order and with no gap, and centres them in the writing direction.
 * Content larger than the box starts at its start edge, so none of it is cut off.
 *
 * It moves boxes, not lines of text: to centre the lines of a paragraph, set `text-align: center` on the paragraph.
 * It adds no role, so it stays `generic`, and it takes no focus. A name applies only with an author role that allows
 * one, such as `role="group"` or `role="region"`.
 *
 * Vertical centring needs a height: give the host a `block-size` or `min-block-size`, or place it where a parent
 * stretches it. In a flex row or an `auto` grid track the host sizes to its content, so give it `flex: 1` or a width
 * there. A consumer `display` rule on the host shows a hidden Center unless it excludes `[hidden]`, as in
 * `line-center:not([hidden]) { display: inline-flex }`.
 *
 * @summary A layout container that centres its content horizontally, vertically or on both axes.
 *
 * @slot - The content to centre; several children form one centred column in source order.
 */
export class LineCenter extends LineElement {
  static override properties: PropertyDeclarations = {
    axis: { reflect: true, useDefault: true, converter: enumConverter(AXES, 'both') },
  };

  static override styles = [
    commonReset,
    css`
      :host {
        display: flex;
        flex-direction: column;
        justify-content: safe center;
        align-items: safe center;
      }

      :host([axis='horizontal']) {
        justify-content: normal;
      }

      :host([axis='vertical']) {
        align-items: normal;
      }

      :host([hidden]) {
        display: none;
      }
    `,
  ];

  /** The axes to centre on; an unknown value behaves as `both`. */
  declare axis: CenterAxis;

  constructor() {
    super();
    // `useDefault` keeps this initial value out of the attribute, so an unknown author value stays (C8).
    this.axis = 'both';
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}

customElements.define('line-center', LineCenter);

declare global {
  interface HTMLElementTagNameMap {
    'line-center': LineCenter;
  }
}
