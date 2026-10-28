// biome-ignore lint/performance/noBarrelFile: the `./stack` subpath entry registers `line-stack` and exposes its class and types (spec 0018-stack.md Bundle).
export { LineStack } from './stack.js';
export type { StackAlign, StackGap, StackJustify, StackOrientation } from './stack.types.js';
