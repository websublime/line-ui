// biome-ignore lint/performance/noBarrelFile: the `./center` subpath entry registers `line-center` and exposes its class and types (spec 0020-center.md Bundle).
export { LineCenter } from './center.js';
export type { CenterAxis } from './center.types.js';
