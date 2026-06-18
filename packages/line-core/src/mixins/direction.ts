import type { LitElement } from 'lit';

/**
 * Generic constructor type used for Lit mixin composition.
 * Matches the shape declared in spec §6.D.5.
 */
// biome-ignore lint/complexity/noBannedTypes: `{}` is the conventional mixin base constraint.
// biome-ignore lint/suspicious/noExplicitAny: spec §6.D.5 mandates `any[]` for the mixin constructor signature.
type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Direction mixin (D4 — LTR/RTL direction management).
 *
 * D1 ships an identity (pass-through) stub so `LineElement` can compose the
 * full mixin chain, type-check, build, and export now. D4 (line-ui-7qm.4.4)
 * replaces the BODY of {@link DirectionElement} with the real `dir` reflection
 * and `MutationObserver` wiring. The file path, export name, and signature must
 * remain stable.
 *
 * @see docs/specs/00-spec-design-system.md §6.D.4
 */
export function DirectionMixin<T extends Constructor<LitElement>>(Base: T): T & Constructor<LitElement> {
  class DirectionElement extends Base {}
  return DirectionElement;
}
