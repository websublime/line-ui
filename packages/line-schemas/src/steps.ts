import { z } from 'zod';

/**
 * The 12 palette steps (Radix-style scale). Every hue exposes these 12 steps.
 *
 * This is the canonical source of truth: {@link Step} and {@link StepSchema} are
 * both derived from this tuple, mirroring the const+schema+type pattern used by
 * every other contract module in the package (see e.g. `hues.ts`). `STEPS` is a
 * numeric tuple, so the schema is a `z.union` of numeric literals mapped over the
 * tuple rather than a `z.enum` (which is string-only in Zod).
 */
export const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type Step = (typeof STEPS)[number];

/**
 * Map the readonly `STEPS` tuple to the tuple of `z.literal` schemas that
 * `z.union` expects, preserving each element's literal type so the inferred
 * output of {@link StepSchema} is exactly {@link Step}.
 */
type LiteralSchemas<T extends readonly number[]> = {
  [K in keyof T]: z.ZodLiteral<T[K]>;
};

const stepLiterals = STEPS.map((step) => z.literal(step)) as unknown as LiteralSchemas<typeof STEPS>;

export const StepSchema = z.union(stepLiterals);
