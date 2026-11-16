// biome-ignore lint/performance/noBarrelFile: the `./skeleton` subpath entry registers `line-skeleton` and exposes its class and types (spec 0016-skeleton.md Bundle).
export { LineSkeleton } from './skeleton.js';
export type { SkeletonAnimation, SkeletonShape } from './skeleton.types.js';
