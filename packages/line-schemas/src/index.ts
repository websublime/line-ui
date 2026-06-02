// @websublime/line-schemas — design-system TS contracts and Zod schemas.
//
// This barrel re-exports every contract module. The contrast table is also
// available via the `./contrast-table` subpath export (see package.json).

export type { Alias } from './aliases.js';
export { ALIASES, AliasSchema } from './aliases.js';
export type { BlackContrastHue, ContrastColor } from './contrast-table.js';
export {
  BLACK_CONTRAST_HUES,
  ContrastColorSchema,
  PER_HUE_CONTRAST,
  PerHueContrastSchema,
} from './contrast-table.js';
export type { AccentHue, GrayHue, Hue } from './hues.js';
export {
  ACCENT_HUES,
  AccentHueSchema,
  GRAY_HUES,
  GrayHueSchema,
  HUES,
  HueSchema,
} from './hues.js';
export type { Role } from './roles.js';
export { ROLES, RoleSchema } from './roles.js';
export type { SemanticRole } from './semantic-map.js';
export { SEMANTIC_MAP, SemanticMapSchema } from './semantic-map.js';
export type { Step } from './steps.js';
export { STEPS, StepSchema } from './steps.js';
