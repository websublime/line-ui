// biome-ignore lint/performance/noBarrelFile: the `./avatar-group` subpath entry registers `line-avatar-group` and exposes its class and types (spec 0010-avatar-group.md Bundle).
export { LineAvatarGroup } from './avatar-group.js';
export type { AvatarGroupSize, AvatarGroupSpacing } from './avatar-group.types.js';
