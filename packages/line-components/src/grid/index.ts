// biome-ignore lint/performance/noBarrelFile: the `./grid` subpath entry registers `line-grid` and exposes its class and types (spec 0019-grid.md Bundle).
export { LineGrid } from './grid.js';
export type { GridAlign, GridColumns, GridGap, GridMinColumnWidth } from './grid.types.js';
