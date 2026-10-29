// biome-ignore lint/performance/noBarrelFile: the `./separator` subpath entry registers `line-separator` and exposes its class and types (spec 0011-separator.md Bundle).
export { LineSeparator } from './separator.js';
export type { SeparatorOrientation } from './separator.types.js';
