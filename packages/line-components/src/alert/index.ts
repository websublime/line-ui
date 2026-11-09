// biome-ignore lint/performance/noBarrelFile: the `./alert` subpath entry registers `line-alert` and exposes its class and types (spec 0006-alert.md Bundle).
export { LineAlert } from './alert.js';
export type { AlertLive, AlertVariant } from './alert.types.js';
