/**
 * Key of the `ElementInternals` accessor on the `LineElement` prototype. Subclasses and mixins reach the
 * element's internals as `this[INTERNALS]`; no public `internals` property exists.
 *
 * A plain `Symbol`, not `Symbol.for`, so only code that imports it can reach the internals. Its
 * description is `line.internals`, never `internals` or `privateInternals`: axe-core looks up an element's
 * internals through own-property symbols with those two descriptions, and the prototype accessor with this
 * description keeps every line://ui element outside that lookup. This module imports nothing, so
 * `line-element.ts`, `form-associated.ts` and `index.ts` share it without an import cycle.
 *
 * @see docs/specs/01-spec-core-primitives.md §6.C.2, §10 SD19
 */
export const INTERNALS = Symbol('line.internals');
