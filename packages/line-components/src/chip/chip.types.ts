/** Semantic emphasis of `<line-chip>` (ARCH §17.2 C6). */
export type ChipVariant = 'default' | 'primary';

/** `detail` of the `line-change` event: the new pressed state after a user press. */
export interface LineChipChangeDetail {
  value: boolean;
}
