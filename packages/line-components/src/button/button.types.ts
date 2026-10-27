/** Semantic emphasis of `<line-button>` (ARCH §17.2 C6). */
export type ButtonVariant = 'default' | 'primary' | 'borderless';

/** What activation does to the form owner, as on a native `<button>`. */
export type ButtonType = 'submit' | 'reset' | 'button';

/** The `formmethod` override values. */
export type ButtonFormMethod = 'get' | 'post' | 'dialog';

/** The `formenctype` override values. */
export type ButtonFormEnctype = 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';

/** `detail` of the `line-change` event: the new pressed state of a toggle button. */
export interface LineButtonChangeDetail {
  value: boolean;
}
