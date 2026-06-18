import { LitElement } from 'lit';
import { DirectionMixin } from './mixins/direction.js';
import { InspectorMixin } from './mixins/inspector.js';
import { MetadataMixin } from './mixins/metadata.js';

/**
 * `LineElement` — the base class for every line://ui web component.
 *
 * Composes the Inspector, Metadata, and Direction mixins over `LitElement`.
 * Per spec §6.D.1 it intentionally:
 *
 * - **does NOT** auto-inject `commonReset` (every component declares its
 *   resets explicitly — ARCHITECTURE §14.6 invariant), and
 * - **does NOT** bake in `FormAssociated` (that mixin is opt-in per component,
 *   e.g. `class LineInput extends FormAssociated(LineElement) {}`).
 *
 * @see docs/specs/00-spec-design-system.md §6.D.1
 */
export class LineElement extends DirectionMixin(MetadataMixin(InspectorMixin(LitElement))) {
  /** Static version string surfaced by the Inspector mixin. */
  static version = '0.0.0';

  /**
   * Hook for sub-classes / mixins to declare reflected state, e.g. for
   * `CustomStateSet`. The `FormAssociated` mixin (D5) overrides this under
   * `noImplicitOverride` — the signature must stay exactly as declared here.
   *
   * @see docs/specs/00-spec-design-system.md §6.D.5
   */
  protected reflectState(_name: string, _active: boolean): void {
    /* see §6.D.5 */
  }
}
