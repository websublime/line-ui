import type { LitElement } from 'lit';

/**
 * Generic constructor type used for Lit mixin composition.
 * Matches the shape declared in spec §6.D.5.
 */
// biome-ignore lint/complexity/noBannedTypes: `{}` is the conventional mixin base constraint.
// biome-ignore lint/suspicious/noExplicitAny: spec §6.D.5 mandates `any[]` for the mixin constructor signature.
type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Metadata mixin (D3 — element metadata and lifecycle hooks).
 *
 * D1 ships an identity (pass-through) stub so `LineElement` can compose the
 * full mixin chain, type-check, build, and export now. D3 (line-ui-7qm.4.3)
 * replaces the BODY of {@link MetadataElement} with the real metadata members
 * (`docs`, `qa`, `scope`, …). The file path, export name, and signature must
 * remain stable.
 *
 * @see docs/specs/00-spec-design-system.md §6.D.3
 */
export function MetadataMixin<T extends Constructor<LitElement>>(Base: T): T & Constructor<LitElement> {
  class MetadataElement extends Base {}
  return MetadataElement;
}
