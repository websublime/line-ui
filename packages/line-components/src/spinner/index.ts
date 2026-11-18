// biome-ignore lint/performance/noBarrelFile: the `./spinner` subpath entry registers `line-spinner` and exposes its class and types (spec 0022-spinner.md Bundle).
export { LineSpinner } from './spinner.js';
export type { SpinnerSize, SpinnerSpeed } from './spinner.types.js';
