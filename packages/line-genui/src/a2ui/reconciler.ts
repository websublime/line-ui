/**
 * The surface's reconciler: it makes a parent's child list equal the desired nodes and moves only nodes that are
 * out of place, so a focused element keeps focus across a reorder (Phase 1 spec §6.G.4 Accessibility; ARCH §17.4;
 * plan §5.6 D4; R2 §2.8).
 *
 * Under the MANIFESTO Law 5 reading of §6.G.4 this is the surface's rendering cycle: no other code mutates the
 * surface's light DOM (§12 AM-002).
 *
 * @module a2ui/reconciler
 */

/** `Element.moveBefore()`, which moves a connected node without resetting its state, focus included. */
interface MoveBefore {
  moveBefore(node: Node, child: Node | null): void;
}

const hasMoveBefore = (parent: Node): parent is Node & MoveBefore =>
  typeof (parent as Partial<MoveBefore>).moveBefore === 'function';

/**
 * Reconciles the child lists of the surface's elements.
 *
 * A child that leaves its parent is not removed at once: it stays until {@link Reconciler.sweep}, so a node that
 * moves to another parent in the same batch moves while connected. The move uses `moveBefore()` where the browser
 * has it and both ends are connected, which keeps focus; otherwise it is an insertion, and the reconciler records
 * the element that lost focus so the surface can return focus to it at the end of the batch.
 */
export class Reconciler {
  /** The parent each node was last placed under. */
  readonly #placedIn = new WeakMap<Node, Node>();
  /** Nodes that left their parent and wait for the sweep, unless a parent claims them first. */
  readonly #leaving = new Set<Node>();
  /** Whether a move blurred the focused element since the last {@link Reconciler.takeBlurred}. */
  #blurred = false;

  /**
   * Makes the children of `parent` equal `desired`, in order. The child that holds focus never moves; its
   * siblings move around it.
   *
   * @param parent The element whose children change.
   * @param desired The desired child nodes, each at most once.
   */
  reconcile(parent: Node, desired: readonly Node[]): void {
    this.#mark(parent, desired);
    const active = activeElementOf(parent);
    // The anchor never moves: the child that holds focus, else the first desired child already in place.
    const focused = active ? desired.findIndex((child) => child.parentNode === parent && child.contains(active)) : -1;
    const anchor = Math.max(
      focused,
      desired.findIndex((child) => child.parentNode === parent),
      0,
    );
    const first = desired[anchor];
    if (first && first.parentNode !== parent) this.#move(parent, first, null);
    for (let i = anchor - 1; i >= 0; i--) {
      const node = desired[i] as Node;
      const next = desired[i + 1] as Node;
      if (node.nextSibling !== next) this.#move(parent, node, next);
    }
    this.#placeAfter(parent, desired, anchor);
  }

  /**
   * Places `desired[from + 1 …]` after `desired[from]`. Consecutive new nodes, which have no parent yet, go in as one
   * fragment: one insertion per run, not one per node, which WebKit pays for per insertion into a `role="list"`.
   */
  #placeAfter(parent: Node, desired: readonly Node[], from: number): void {
    let run: Node[] = [];
    let runAfter: Node | undefined;
    const flush = () => {
      const before = runAfter?.nextSibling ?? null;
      if (run.length === 1) parent.insertBefore(run[0] as Node, before);
      else if (run.length > 1) {
        const fragment = (parent.ownerDocument ?? document).createDocumentFragment();
        fragment.append(...run);
        parent.insertBefore(fragment, before);
      }
      run = [];
    };
    for (let i = from + 1; i < desired.length; i++) {
      const node = desired[i] as Node;
      const previous = desired[i - 1] as Node;
      if (node.parentNode === null) {
        if (run.length === 0) runAfter = previous;
        run.push(node);
        continue;
      }
      flush();
      if (node.previousSibling !== previous) this.#move(parent, node, previous.nextSibling);
    }
    flush();
  }

  /** Claims the desired nodes for `parent` and marks its other children as leaving. */
  #mark(parent: Node, desired: readonly Node[]): void {
    const wanted = new Set(desired);
    for (const child of parent.childNodes) {
      if (wanted.has(child)) continue;
      if (this.#placedIn.get(child) === parent) this.#placedIn.delete(child);
      this.#leaving.add(child);
    }
    for (const node of desired) {
      this.#placedIn.set(node, parent);
      this.#leaving.delete(node);
    }
  }

  /** Removes every node that left its parent and that no parent claimed since. */
  sweep(): void {
    for (const node of this.#leaving) {
      const parent = node.parentNode;
      if (parent && this.#placedIn.get(node) !== parent) {
        if (node.contains(activeElementOf(parent))) this.#blurred = true;
        parent.removeChild(node);
      }
    }
    this.#leaving.clear();
  }

  /** Whether a move or removal blurred the focused element since the last call; resets the flag. */
  takeBlurred(): boolean {
    const blurred = this.#blurred;
    this.#blurred = false;
    return blurred;
  }

  #move(parent: Node, node: Node, before: Node | null): void {
    if (
      node.isConnected &&
      parent.isConnected &&
      hasMoveBefore(parent) &&
      node.ownerDocument === parent.ownerDocument
    ) {
      try {
        parent.moveBefore(node, before);
        return;
      } catch {
        // A move across roots throws; the insertion below still places the node.
      }
    }
    if (node.contains(activeElementOf(node))) this.#blurred = true;
    parent.insertBefore(node, before);
  }
}

/** The document's focused element, or `null` when focus sits on the body or nowhere. */
function activeElementOf(node: Node): Element | null {
  const active = node.ownerDocument?.activeElement ?? null;
  return active && active !== node.ownerDocument?.body ? active : null;
}
