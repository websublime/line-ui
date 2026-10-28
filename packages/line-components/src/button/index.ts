// biome-ignore lint/performance/noBarrelFile: the `./button` subpath entry registers `line-button` and exposes its class and types (spec 0002-button.md Bundle).
export { LineButton } from './button.js';
export type {
  ButtonFormEnctype,
  ButtonFormMethod,
  ButtonType,
  ButtonVariant,
  LineButtonChangeDetail,
} from './button.types.js';
