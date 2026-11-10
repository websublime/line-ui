// biome-ignore lint/performance/noBarrelFile: the `./chip` subpath entry registers `line-chip` and exposes its class and types (spec 0008-chip.md Bundle).
export { LineChip } from './chip.js';
export type { ChipVariant, LineChipChangeDetail } from './chip.types.js';
