/** Main axis of `<line-stack>`; the A2UI basic v0.9 `List.direction` values. */
export type StackOrientation = 'horizontal' | 'vertical';

/** Main-axis distribution of `<line-stack>`; the A2UI basic v0.9 `justify` values. */
export type StackJustify = 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly' | 'stretch';

/** Cross-axis alignment of `<line-stack>`; the A2UI basic v0.9 `align` values without `baseline`. */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

/** Gap step of `<line-stack>` on the `--line-layout-gap-*` scale (ARCH §17.2 C6). */
export type StackGap = '0' | '1' | '2' | '3' | '4' | '5';
