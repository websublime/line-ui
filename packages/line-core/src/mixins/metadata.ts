import type { LitElement } from 'lit';

/**
 * Generic constructor type used for Lit mixin composition.
 * Matches the shape declared in spec §6.D.5.
 */
// biome-ignore lint/complexity/noBannedTypes: `{}` is the conventional mixin base constraint.
// biome-ignore lint/suspicious/noExplicitAny: spec §6.D.5 mandates `any[]` for the mixin constructor signature.
type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Metadata mixin (D3 — static element metadata members).
 *
 * Declares the four static metadata members every line://ui component carries
 * (spec §6.D.3):
 *
 * - `version` — the component's semver string (mirrors / defaults the value the
 *   Inspector mixin surfaces as `data-line-version`).
 * - `docs` — a URL string pointing at the component's documentation.
 * - `qa` — an array of QA tags (`string[]`).
 * - `scope` — a string naming the component's scope.
 *
 * Components override the members declaratively, e.g. `static version = '0.1.0'`.
 *
 * SURFACING the members as host attributes (`data-line-version`,
 * `data-line-docs`, …) is the Inspector mixin's (D2) responsibility — it reads
 * these static members defensively off `this.constructor`. This mixin owns the
 * DECLARATION only; it does not touch the DOM.
 *
 * The file path, export name, and generic signature remain stable from the D1
 * stub (`.d.ts`-determinism invariant; the `LineElement` composition chain in
 * `line-element.ts` depends on them).
 *
 * @see docs/specs/00-spec-design-system.md §6.D.3
 */
export function MetadataMixin<T extends Constructor<LitElement>>(Base: T): T & Constructor<LitElement> {
  class MetadataElement extends Base {
    /** Component semver string. Surfaced by the Inspector as `data-line-version`. */
    static version = '0.0.0';

    /** Documentation URL. Surfaced by the Inspector as `data-line-docs` when set. */
    static docs = '';

    /** QA tags for the component. */
    static qa: string[] = [];

    /** Component scope identifier. */
    static scope = '';
  }
  return MetadataElement;
}
