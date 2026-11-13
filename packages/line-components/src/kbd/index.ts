// biome-ignore lint/performance/noBarrelFile: the `./kbd` subpath entry registers `line-kbd` and exposes its class and types (spec 0015-kbd.md Bundle).
export { LineKbd } from './kbd.js';
export type { KbdPlatform } from './kbd.types.js';
