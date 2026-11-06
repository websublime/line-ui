// biome-ignore lint/performance/noBarrelFile: the `./button-group` subpath entry registers `line-button-group` and exposes its class and types (spec 0004-button-group.md Bundle).
export { LineButtonGroup } from './button-group.js';
export type { ButtonGroupOrientation, ButtonGroupPosition } from './button-group.types.js';
