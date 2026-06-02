import { z } from 'zod';
import type { Hue } from './hues.js';
import { HueSchema } from './hues.js';

/**
 * Maps each semantic role to its default hue. Consumed by `line-themes` when
 * generating the `semantics.css` role mappings.
 */
export const SEMANTIC_MAP = {
  success: 'green',
  warning: 'amber',
  danger: 'red',
  info: 'blue',
} as const satisfies Record<string, Hue>;

export type SemanticRole = keyof typeof SEMANTIC_MAP;

export const SemanticMapSchema = z.object({
  success: HueSchema,
  warning: HueSchema,
  danger: HueSchema,
  info: HueSchema,
});
