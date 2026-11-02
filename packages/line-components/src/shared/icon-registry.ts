/**
 * The icon registry `<line-icon>` asks for glyphs (Phase 1 spec §6.C.3 "Registry hook"; spec 0014-icon.md).
 *
 * The slot `{ registry, events }` lives at `globalThis[Symbol.for('line.icon-registry')]`, so every copy of this
 * module, such as separate CDN bundles or another version, reads and writes one place. The slot is created on
 * first access, never at module load, so importing the root `"."` or `./icon` writes no global.
 *
 * @module shared/icon-registry
 */

/**
 * Any object that resolves an icon name in a library to SVG markup or an `SVGElement`. The `line-icons`
 * `IconRegistry` satisfies it.
 */
export interface LineIconRegistry {
  resolve(library: string, name: string, options?: { weight?: string }): Promise<string | SVGElement>;
}

/** The slot every module copy shares; a cross-copy and cross-version contract. */
export interface IconRegistrySlot {
  registry: LineIconRegistry | undefined;
  readonly events: EventTarget;
}

/** Dispatched on the slot's `events` each time a setter runs. */
export const ICON_REGISTRY_CHANGE = 'line-icon-registry-change';

const SLOT_KEY = Symbol.for('line.icon-registry');

/** The shared slot, created on the first call. */
export function iconRegistrySlot(): IconRegistrySlot {
  const existing = Reflect.get(globalThis, SLOT_KEY) as IconRegistrySlot | undefined;
  if (existing) {
    return existing;
  }
  const slot: IconRegistrySlot = { registry: undefined, events: new EventTarget() };
  Reflect.set(globalThis, SLOT_KEY, slot);
  return slot;
}

/**
 * Sets the registry every `<line-icon>` resolves `name` and `library` through, from any module copy. Every
 * connected icon resolves again. `undefined` clears the registry, so name icons return to the empty state.
 */
export function setIconRegistry(registry: LineIconRegistry | undefined): void {
  const slot = iconRegistrySlot();
  slot.registry = registry;
  slot.events.dispatchEvent(new Event(ICON_REGISTRY_CHANGE));
}
