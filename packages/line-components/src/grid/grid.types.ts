/** The most columns in a row of `<line-grid>`; a C6 variant over `--line-grid-columns` (ARCH §17.2 C6). */
export type GridColumns = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

/** The narrowest column of `<line-grid>` on the `--line-size-*` scale; `none` keeps every column at any width. */
export type GridMinColumnWidth = 'none' | 'xxs' | 'xs' | 'sm' | 'md';

/** Gap step of `<line-grid>` on the `--line-layout-gap-*` scale (ARCH §17.2 C6). */
export type GridGap = '0' | '1' | '2' | '3' | '4' | '5';

/** Placement of each child within its cell of `<line-grid>`, for `align` (`align-items`) and `justify-items`. */
export type GridAlign = 'start' | 'center' | 'end' | 'stretch';
