import { LitElement } from 'lit';
import { INTERNALS } from './internals.js';
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
 *   e.g. `class LineInput extends FormAssociated(LineElement) {}`), so it never
 *   sets `formAssociated`.
 *
 * Every element attaches its `ElementInternals` once, in its constructor, and
 * keeps them private; subclasses and mixins reach them as `this[INTERNALS]`.
 * `reflectState` writes machine state to the host as `data-<state>` and
 * `:state(<state>)` (ARCHITECTURE §14.8).
 *
 * @see docs/specs/00-spec-design-system.md §6.D.1
 * @see docs/specs/01-spec-core-primitives.md §6.C.2
 */
export class LineElement extends DirectionMixin(MetadataMixin(InspectorMixin(LitElement))) {
  /** Static version string surfaced by the Inspector mixin. */
  static version = '0.0.0';

  #internals: ElementInternals = this.attachInternals();

  /** The element's `ElementInternals`, attached once in the constructor (spec §6.C.2, SD19). */
  protected get [INTERNALS](): ElementInternals {
    return this.#internals;
  }

  /**
   * Reflects machine state `name` on the host as the attribute `data-<name>`
   * and the custom state `:state(<name>)`, both verbatim, so a kebab-case name
   * such as `focus-visible` keeps its spelling. The custom state is skipped
   * where the internals have no `states`.
   *
   * @see docs/ARCHITECTURE.md §14.8
   */
  protected reflectState(name: string, active: boolean): void {
    this.toggleAttribute(`data-${name}`, active);
    if (active) {
      this.#internals.states?.add(name);
    } else {
      this.#internals.states?.delete(name);
    }
  }
}
