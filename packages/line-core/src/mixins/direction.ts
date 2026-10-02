import type { LitElement, PropertyDeclarations } from 'lit';

/**
 * Generic constructor type used for Lit mixin composition.
 * Matches the shape declared in spec §6.D.5.
 */
// biome-ignore lint/complexity/noBannedTypes: `{}` is the conventional mixin base constraint.
// biome-ignore lint/suspicious/noExplicitAny: spec §6.D.5 mandates `any[]` for the mixin constructor signature.
type Constructor<T = {}> = new (...args: any[]) => T;

/** Resolved text direction of a host. */
type Direction = 'ltr' | 'rtl';

/** Recompute callbacks of every connected host. */
const directionSubscribers = new Set<() => void>();

/** The shared document observer. It exists only while at least one host is connected. */
let directionObserver: MutationObserver | null = null;

/** Recompute every connected host once per batch of `dir` mutations. */
function notifyDirectionSubscribers(): void {
  for (const recompute of directionSubscribers) {
    recompute();
  }
}

/** Register a connected host. The first registration starts the observer. */
function subscribeDirection(recompute: () => void): void {
  directionSubscribers.add(recompute);
  if (directionObserver) {
    return;
  }
  directionObserver = new MutationObserver(notifyDirectionSubscribers);
  directionObserver.observe(document, { subtree: true, attributes: true, attributeFilter: ['dir'] });
}

/** Drop a disconnected host. The last removal disconnects the observer. */
function unsubscribeDirection(recompute: () => void): void {
  directionSubscribers.delete(recompute);
  if (directionSubscribers.size > 0 || !directionObserver) {
    return;
  }
  directionObserver.disconnect();
  directionObserver = null;
}

/**
 * Direction mixin (D4). Adds a read-only `direction` with the host's resolved
 * text direction.
 *
 * The value is `this.matches(':dir(rtl)') ? 'rtl' : 'ltr'`, so the engine
 * resolves inheritance, author `dir` on the host, and `dir="auto"`. The mixin
 * recomputes it on connect and on any `dir` attribute mutation in the
 * document, through one `MutationObserver` shared by every connected host. A
 * changed value calls `requestUpdate('direction', oldValue)`.
 *
 * The mixin never writes the host `dir` attribute and leaves the native
 * `HTMLElement.dir` alone. Component CSS targets RTL with `:host(:dir(rtl))`.
 *
 * The observer does not see `dir` changes inside shadow trees, and a text
 * change under `dir="auto"` mutates no attribute. In both cases `direction`
 * stays stale until the next document-level `dir` mutation or reconnect.
 *
 * @see docs/specs/00-spec-design-system.md §6.D.4 (AM-031)
 */
export function DirectionMixin<T extends Constructor<LitElement>>(
  Base: T,
): T & Constructor<LitElement & { readonly direction: Direction }> {
  class DirectionElement extends Base {
    /** `direction` is reactive but owns its accessor and has no attribute. */
    static properties: PropertyDeclarations = {
      direction: { attribute: false, noAccessor: true },
    };

    #direction: Direction = 'ltr';

    readonly #recomputeDirection = (): void => {
      const oldValue = this.#direction;
      const value: Direction = this.matches(':dir(rtl)') ? 'rtl' : 'ltr';
      if (value === oldValue) {
        return;
      }
      this.#direction = value;
      this.requestUpdate('direction', oldValue);
    };

    /** Resolved text direction of the host. */
    get direction(): Direction {
      return this.#direction;
    }

    override connectedCallback(): void {
      super.connectedCallback();
      subscribeDirection(this.#recomputeDirection);
      this.#recomputeDirection();
    }

    override disconnectedCallback(): void {
      unsubscribeDirection(this.#recomputeDirection);
      super.disconnectedCallback();
    }
  }
  return DirectionElement;
}
