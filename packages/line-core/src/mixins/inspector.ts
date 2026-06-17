import type { LitElement } from 'lit';

/**
 * Generic constructor type used for Lit mixin composition.
 * Matches the shape declared in spec §6.D.5.
 */
// biome-ignore lint/complexity/noBannedTypes: `{}` is the conventional mixin base constraint.
// biome-ignore lint/suspicious/noExplicitAny: spec §6.D.5 mandates `any[]` for the mixin constructor signature.
type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Inspector mixin (D2 — dev-mode element inspection).
 *
 * D1 ships an identity (pass-through) stub so `LineElement` can compose the
 * full mixin chain, type-check, build, and export now. D2 (line-ui-7qm.4.2)
 * replaces the BODY of {@link InspectorElement} with the real inspector
 * behaviour. The file path, export name, and signature must remain stable.
 *
 * @see docs/specs/00-spec-design-system.md §6.D.2
 */
export function InspectorMixin<T extends Constructor<LitElement>>(Base: T): T & Constructor<LitElement> {
  class InspectorElement extends Base {}
  return InspectorElement;
}
