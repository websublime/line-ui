import { LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import { type ComplexAttributeConverter, css, html, type PropertyDeclarations, type TemplateResult } from 'lit';
import type { GridAlign, GridColumns, GridGap, GridMinColumnWidth } from './grid.types.js';

const COLUMNS: readonly GridColumns[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MIN_COLUMN_WIDTHS: readonly GridMinColumnWidth[] = ['none', 'xxs', 'xs', 'sm', 'md'];
const GAPS: readonly GridGap[] = ['0', '1', '2', '3', '4', '5'];
const ALIGNS: readonly GridAlign[] = ['start', 'center', 'end', 'stretch'];

/** An unknown value behaves as `fallback`; the attribute keeps what the author wrote. */
function enumConverter<T extends string>(values: readonly T[], fallback: T): ComplexAttributeConverter<T> {
  return { fromAttribute: (value) => values.find((entry) => entry === value) ?? fallback };
}

/** An unknown variant value behaves as no attribute, so the `:host` default of its token applies. */
function variantConverter<T extends string>(values: readonly T[]): ComplexAttributeConverter<T | undefined> {
  return { fromAttribute: (value) => values.find((entry) => entry === value) };
}

/**
 * `<line-grid>` lays out its children in rows of equal columns. The host is the grid container and the slotted
 * children are its grid items, placed in source order, row by row, in the writing direction. The column count adapts
 * to the width the grid has: `columns` caps how many columns a row holds, and `min-column-width` sets how narrow a
 * column may get before the grid moves to fewer columns.
 *
 * It is a layout container, not an interactive data grid: it adds no role, so it stays `generic`, and it takes no
 * focus. Never put `role="grid"` on it. To build a list, put `role="list"` on the host and `role="listitem"` on
 * each child.
 *
 * Write `0px`, never a unitless `0`, when setting a gap or minimum token to zero, because the tokens enter the
 * column formula. `grid-column: span N` on a child adds an implicit column once fewer than `N` columns fit; use
 * `grid-column: 1 / -1` for a full row, or pair a span with `min-column-width="none"`. In a flex row or an `auto`
 * grid track the grid sizes to its content, so give it `flex: 1` or a width there.
 *
 * @summary A layout container that places its children in a grid of equal columns that adapts to its width.
 *
 * @slot - The children; each element becomes a grid item, in source order.
 *
 * @cssprop [--line-grid-columns=12] - The most columns in a row; `columns="N"` sets `N`.
 * @cssprop [--line-grid-min-column-width=var(--line-size-xs)] - The narrowest column; `min-column-width="xxs" | "sm" | "md"` uses `var(--line-size-xxs | -sm | -md)` and `none` uses `0px`. Write `0px`, not `0`.
 * @cssprop [--line-grid-gap=var(--line-layout-gap-2)] - Space between rows and columns; `gap="0"` uses `0px` and `gap="N"` uses `var(--line-layout-gap-N)`.
 * @cssprop [--line-grid-row-gap=var(--line-grid-gap)] - Space between rows.
 * @cssprop [--line-grid-column-gap=var(--line-grid-gap)] - Space between columns; the column formula reads it, so set this token rather than `column-gap`.
 */
export class LineGrid extends LineElement {
  static override properties: PropertyDeclarations = {
    columns: { reflect: true, converter: variantConverter(COLUMNS) },
    minColumnWidth: { attribute: 'min-column-width', reflect: true, converter: variantConverter(MIN_COLUMN_WIDTHS) },
    gap: { reflect: true, converter: variantConverter(GAPS) },
    align: { reflect: true, useDefault: true, converter: enumConverter(ALIGNS, 'stretch') },
    justifyItems: {
      attribute: 'justify-items',
      reflect: true,
      useDefault: true,
      converter: enumConverter(ALIGNS, 'stretch'),
    },
  };

  static override styles = [
    commonReset,
    css`
      :host {
        --line-grid-columns: 12;
        --line-grid-min-column-width: var(--line-size-xs);
        --line-grid-gap: var(--line-layout-gap-2);
        --line-grid-row-gap: var(--line-grid-gap);
        --line-grid-column-gap: var(--line-grid-gap);

        display: grid;
        grid-template-columns: repeat(
          auto-fill,
          minmax(
            max(
              min(100%, var(--line-grid-min-column-width)),
              (100% - (var(--line-grid-columns) - 1) * var(--line-grid-column-gap, 0px)) / var(--line-grid-columns)
            ),
            1fr
          )
        );
        row-gap: var(--line-grid-row-gap);
        column-gap: var(--line-grid-column-gap);
        align-items: stretch;
        justify-items: stretch;
      }

      :host([hidden]) {
        display: none;
      }

      :host([columns='1']) {
        --line-grid-columns: 1;
      }

      :host([columns='2']) {
        --line-grid-columns: 2;
      }

      :host([columns='3']) {
        --line-grid-columns: 3;
      }

      :host([columns='4']) {
        --line-grid-columns: 4;
      }

      :host([columns='5']) {
        --line-grid-columns: 5;
      }

      :host([columns='6']) {
        --line-grid-columns: 6;
      }

      :host([columns='7']) {
        --line-grid-columns: 7;
      }

      :host([columns='8']) {
        --line-grid-columns: 8;
      }

      :host([columns='9']) {
        --line-grid-columns: 9;
      }

      :host([columns='10']) {
        --line-grid-columns: 10;
      }

      :host([columns='11']) {
        --line-grid-columns: 11;
      }

      :host([min-column-width='none']) {
        --line-grid-min-column-width: 0px;
      }

      :host([min-column-width='xxs']) {
        --line-grid-min-column-width: var(--line-size-xxs);
      }

      :host([min-column-width='sm']) {
        --line-grid-min-column-width: var(--line-size-sm);
      }

      :host([min-column-width='md']) {
        --line-grid-min-column-width: var(--line-size-md);
      }

      :host([gap='0']) {
        --line-grid-gap: 0px;
      }

      :host([gap='1']) {
        --line-grid-gap: var(--line-layout-gap-1);
      }

      :host([gap='3']) {
        --line-grid-gap: var(--line-layout-gap-3);
      }

      :host([gap='4']) {
        --line-grid-gap: var(--line-layout-gap-4);
      }

      :host([gap='5']) {
        --line-grid-gap: var(--line-layout-gap-5);
      }

      :host([align='start']) {
        align-items: start;
      }

      :host([align='center']) {
        align-items: center;
      }

      :host([align='end']) {
        align-items: end;
      }

      :host([justify-items='start']) {
        justify-items: start;
      }

      :host([justify-items='center']) {
        justify-items: center;
      }

      :host([justify-items='end']) {
        justify-items: end;
      }
    `,
  ];

  /** The most columns in a row, `1` to `12`; `undefined` or an unknown value gives at most `12`. */
  declare columns: GridColumns | undefined;
  /** The narrowest column before the grid drops one; `none` keeps every column. `undefined` or an unknown value gives `xs`. */
  declare minColumnWidth: GridMinColumnWidth | undefined;
  /** Gap step from `0` to `5`; `undefined` or an unknown value gives step `2`. */
  declare gap: GridGap | undefined;
  /** Each child's place within its row (`align-items`); an unknown value behaves as `stretch`. */
  declare align: GridAlign;
  /** Each child's place within its column (`justify-items`); an unknown value behaves as `stretch`. */
  declare justifyItems: GridAlign;

  constructor() {
    super();
    // `useDefault` keeps these initial values out of the attributes, so an unknown author value stays (C8).
    this.align = 'stretch';
    this.justifyItems = 'stretch';
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}

customElements.define('line-grid', LineGrid);

declare global {
  interface HTMLElementTagNameMap {
    'line-grid': LineGrid;
  }
}
