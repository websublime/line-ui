/** Semantic emphasis of `<line-icon-button>` (ARCH §17.2 C6). */
export type IconButtonVariant = 'default' | 'primary' | 'borderless';

/** `detail` of the `line-change` event: the new pressed state of a toggle icon button. */
export interface LineIconButtonChangeDetail {
  value: boolean;
}
