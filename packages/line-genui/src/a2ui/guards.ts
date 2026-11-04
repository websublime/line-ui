/**
 * The one object guard of `./a2ui`. Agent messages are raw JSON that `web_core` validates; the surface reads a few
 * fields of them before it does, each with its own `typeof` check.
 *
 * @module a2ui/guards
 */

/** A JSON object: not `null`, not an array. Its fields stay `unknown`. */
export type JsonObject = Record<string, unknown>;

/** Whether `value` is a JSON object. */
export function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
