/**
 * Shadow-DOM modular reset sheets (D7, spec §6.D.7 / ARCHITECTURE §14.3–§14.5).
 *
 * Each `reset.*.css` file is inlined by Vite (`?inline`) and turned into one
 * singleton `CSSStyleSheet`; components adopt only the sheets for the native
 * elements they actually render. Under `bun test` the `?inline` imports are
 * served by the `css-inline` plugin in `bun-test-preload.ts` (AM-026).
 *
 * @module styles
 */

import buttonCSS from './reset.button.css?inline';
import commonCSS from './reset.common.css?inline';
import fieldsetCSS from './reset.fieldset.css?inline';
import inputCSS from './reset.input.css?inline';
import progressCSS from './reset.progress.css?inline';
import rangeCSS from './reset.range.css?inline';
import scrollbarCSS from './reset.scrollbar.css?inline';
import selectCSS from './reset.select.css?inline';
import summaryCSS from './reset.summary.css?inline';
import tableCSS from './reset.table.css?inline';
import textareaCSS from './reset.textarea.css?inline';

function createSheet(css: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  return sheet;
}

export const commonReset = createSheet(commonCSS);
export const inputReset = createSheet(inputCSS);
export const buttonReset = createSheet(buttonCSS);
export const textareaReset = createSheet(textareaCSS);
export const selectReset = createSheet(selectCSS);
export const rangeReset = createSheet(rangeCSS);
export const progressReset = createSheet(progressCSS);
export const summaryReset = createSheet(summaryCSS);
export const fieldsetReset = createSheet(fieldsetCSS);
export const tableReset = createSheet(tableCSS);
export const scrollbarReset = createSheet(scrollbarCSS);
