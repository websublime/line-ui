// biome-ignore lint/performance/noBarrelFile: the `./presence` subpath entry registers `line-presence` and exposes its class and types (spec 0017-presence.md Bundle).
export { LinePresence } from './presence.js';
export type { LinePresenceEnterCompleteDetail, LinePresenceExitCompleteDetail } from './presence.types.js';
