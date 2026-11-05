// biome-ignore lint/performance/noBarrelFile: the `./icon-button` subpath entry registers `line-icon-button` and exposes its class and types (spec 0003-icon-button.md Bundle).
export { LineIconButton } from './icon-button.js';
export type { IconButtonVariant, LineIconButtonChangeDetail } from './icon-button.types.js';
