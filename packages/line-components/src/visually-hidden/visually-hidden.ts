import { LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import { css, html, type TemplateResult } from 'lit';

/**
 * `<line-visually-hidden>` holds content that assistive technology reads and
 * the screen does not show. The content stays in the accessibility tree, is
 * read in place, and joins the name of a link, a button or a heading around
 * it. The host draws nothing and takes no space in a block, flex or grid
 * parent. While focus is inside, the content shows, so a skip link appears
 * when a keyboard user reaches it; style that state with
 * `line-visually-hidden:focus-within`.
 *
 * Put hidden words after a control's visible words, as in "Read more about
 * pricing", so the control's name starts with what users see. To remove the
 * words for everyone, use `hidden`, not `aria-hidden`. Do not put
 * `aria-label` on the host, because it has no role a name could attach to.
 *
 * The words show until the module runs. To hide them before the upgrade, add
 * this rule to the page:
 *
 * ```css
 * line-visually-hidden:not(:defined):not(:focus-within) {
 *   position: absolute;
 *   inset-block-start: 0;
 *   inset-inline-start: 0;
 *   inline-size: 1px;
 *   block-size: 1px;
 *   overflow: hidden;
 *   clip-path: inset(50%);
 *   white-space: nowrap;
 * }
 * ```
 *
 * @summary Content that assistive technology reads and the screen does not show.
 *
 * @slot - The hidden content: text and phrasing content, such as words, a link or a heading.
 */
export class LineVisuallyHidden extends LineElement {
  // No `display` on `:host`, so the UA `[hidden]` rule still removes the host. The insets keep the 1px box
  // from adding scrollable overflow at the end edge of its containing block (spec 0012-visually-hidden.md F5).
  static override styles = [
    commonReset,
    css`
      :host(:not(:focus-within)) {
        position: absolute;
        inset-block-start: 0;
        inset-inline-start: 0;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    `,
  ];

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}

customElements.define('line-visually-hidden', LineVisuallyHidden);

declare global {
  interface HTMLElementTagNameMap {
    'line-visually-hidden': LineVisuallyHidden;
  }
}
