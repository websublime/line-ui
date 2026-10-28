import { LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import { type ComplexAttributeConverter, css, html, type PropertyDeclarations, type TemplateResult } from 'lit';
import type { StackAlign, StackGap, StackJustify, StackOrientation } from './stack.types.js';

const ORIENTATIONS: readonly StackOrientation[] = ['horizontal', 'vertical'];
const JUSTIFIES: readonly StackJustify[] = [
  'start',
  'center',
  'end',
  'spaceBetween',
  'spaceAround',
  'spaceEvenly',
  'stretch',
];
const ALIGNS: readonly StackAlign[] = ['start', 'center', 'end', 'stretch'];
const GAPS: readonly StackGap[] = ['0', '1', '2', '3', '4', '5'];

/** An unknown value behaves as `fallback`; the attribute keeps what the author wrote. */
function enumConverter<T extends string>(values: readonly T[], fallback: T): ComplexAttributeConverter<T> {
  return { fromAttribute: (value) => values.find((entry) => entry === value) ?? fallback };
}

/** An unknown `gap` behaves as no attribute, so the default step applies. */
const gapConverter: ComplexAttributeConverter<StackGap | undefined> = {
  fromAttribute: (value) => GAPS.find((gap) => gap === value),
};

/**
 * `<line-stack>` lays out its children in one row or one column with a gap
 * between them. The host is the flex container and the slotted children are
 * its flex items. It adds no role, so it stays `generic`; put `role="list"`
 * on the host and `role="listitem"` on the children to build a list.
 *
 * @summary A layout container that places its children in one row or column with even spacing.
 *
 * @slot - The children; each element becomes a flex item.
 *
 * @cssprop [--line-stack-gap=var(--line-layout-gap-2)] - Space between items; `gap="0"` uses `0` and `gap="N"` uses `var(--line-layout-gap-N)`.
 */
export class LineStack extends LineElement {
  static override properties: PropertyDeclarations = {
    orientation: { reflect: true, useDefault: true, converter: enumConverter(ORIENTATIONS, 'vertical') },
    justify: { reflect: true, useDefault: true, converter: enumConverter(JUSTIFIES, 'start') },
    align: { reflect: true, useDefault: true, converter: enumConverter(ALIGNS, 'stretch') },
    gap: { reflect: true, converter: gapConverter },
    wrap: { type: Boolean, reflect: true, useDefault: true },
  };

  static override styles = [
    commonReset,
    css`
      :host {
        --line-stack-gap: var(--line-layout-gap-2);

        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: stretch;
        flex-wrap: nowrap;
        gap: var(--line-stack-gap);
      }

      :host([hidden]) {
        display: none;
      }

      :host([orientation='horizontal']) {
        flex-direction: row;
      }

      :host([justify='center']) {
        justify-content: center;
      }

      :host([justify='end']) {
        justify-content: flex-end;
      }

      :host([justify='spaceBetween']) {
        justify-content: space-between;
      }

      :host([justify='spaceAround']) {
        justify-content: space-around;
      }

      :host([justify='spaceEvenly']) {
        justify-content: space-evenly;
      }

      :host([justify='stretch']) ::slotted(*) {
        flex-grow: 1;
      }

      :host([align='start']) {
        align-items: flex-start;
      }

      :host([align='center']) {
        align-items: center;
      }

      :host([align='end']) {
        align-items: flex-end;
      }

      :host([wrap]) {
        flex-wrap: wrap;
      }

      :host([gap='0']) {
        --line-stack-gap: 0;
      }

      :host([gap='1']) {
        --line-stack-gap: var(--line-layout-gap-1);
      }

      :host([gap='2']) {
        --line-stack-gap: var(--line-layout-gap-2);
      }

      :host([gap='3']) {
        --line-stack-gap: var(--line-layout-gap-3);
      }

      :host([gap='4']) {
        --line-stack-gap: var(--line-layout-gap-4);
      }

      :host([gap='5']) {
        --line-stack-gap: var(--line-layout-gap-5);
      }
    `,
  ];

  /** Main axis; an unknown value behaves as `vertical`. A horizontal stack follows the writing direction. */
  declare orientation: StackOrientation;
  /** Distribution on the main axis; `stretch` grows every item. An unknown value behaves as `start`. */
  declare justify: StackJustify;
  /** Alignment on the cross axis; an unknown value behaves as `stretch`. */
  declare align: StackAlign;
  /** Gap step from `0` to `5`; `undefined` or an unknown value gives step `2`. */
  declare gap: StackGap | undefined;
  /** Lets the items flow onto more lines when they run out of space. */
  declare wrap: boolean;

  constructor() {
    super();
    // `useDefault` keeps these initial values out of the attributes, so an unknown author value stays (C8).
    this.orientation = 'vertical';
    this.justify = 'start';
    this.align = 'stretch';
    this.wrap = false;
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}

customElements.define('line-stack', LineStack);

declare global {
  interface HTMLElementTagNameMap {
    'line-stack': LineStack;
  }
}
