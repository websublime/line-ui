/**
 * The checks behind the CEM drift and coverage tests (Phase 1 spec §6.G.5, §7.3; ARCH §17.3; ledger 01-G5).
 *
 * Both take the descriptors and a `line-components` `custom-elements.json`, look each element up by `tagName`
 * (R4 §2.7), and return their violations; an empty list passes. The §7.3 content rules apply:
 *
 * - Public members exclude `private` and `protected` members, `static` members, and members inherited from the
 *   `line-core` base (R4 §2.3, OQ6). Members inherited from `FormAssociated` stay, because they are component API
 *   and the analyser also marks overrides with `inheritedFrom`.
 * - Events count only when `@fires` JSDoc describes them (R4 §2.4, OQ3).
 * - ARIA metadata lives in the descriptor, so no check reads it from the manifest (R4 OQ2).
 *
 * @module __tests__/cem-check
 */

import type { LineDescriptor } from '../src/catalog/index.js';

export interface ManifestMember {
  readonly kind: string;
  readonly name: string;
  readonly privacy?: string;
  readonly static?: boolean;
  readonly inheritedFrom?: { readonly name: string };
}

export interface ManifestDeclaration {
  readonly kind: string;
  readonly name: string;
  readonly tagName?: string;
  readonly attributes?: readonly { readonly name: string; readonly inheritedFrom?: { readonly name: string } }[];
  readonly members?: readonly ManifestMember[];
  readonly events?: readonly { readonly name: string; readonly description?: string }[];
  readonly slots?: readonly { readonly name: string }[];
}

export interface Manifest {
  readonly modules: readonly { readonly path: string; readonly declarations?: readonly ManifestDeclaration[] }[];
}

/** The kinds of name a descriptor's binding, slot and action maps hold. */
type NameKind = 'attribute' | 'property' | 'slot' | 'event' | 'nativeEvent';

/** A name a descriptor holds that the manifest lacks, or a tag it lacks (`element`); `prop` is the prop holding it. */
export interface DriftViolation {
  readonly tag: string;
  readonly prop?: string;
  readonly kind: NameKind | 'element';
  readonly name: string;
}

/** A name a descriptor map holds, and the prop that holds it. */
interface NamedItem extends DriftViolation {
  readonly prop: string;
  readonly kind: NameKind;
}

/** The DOM events an action map may mark native, which no manifest lists (§12 AM-067, AM-070). */
const NATIVE_EVENTS: readonly string[] = ['click'];

/** The `line-core` base classes every component inherits, whose members are no component API. */
const LINE_CORE_BASE: readonly string[] = ['LineElement', 'DirectionMixin', 'MetadataMixin', 'InspectorMixin'];

const fromBase = (item: { readonly inheritedFrom?: { readonly name: string } }): boolean =>
  item.inheritedFrom !== undefined && LINE_CORE_BASE.includes(item.inheritedFrom.name);

/** The element declarations of `manifest` by tag; declarations without a `tagName`, such as `LineElement`, are out. */
export function elementsByTag(manifest: Manifest): Map<string, ManifestDeclaration> {
  const elements = new Map<string, ManifestDeclaration>();
  for (const module of manifest.modules) {
    for (const declaration of module.declarations ?? []) {
      if (declaration.tagName !== undefined) elements.set(declaration.tagName, declaration);
    }
  }
  return elements;
}

/** The public names of one element by kind, under the §7.3 content rules. */
function publicNames(element: ManifestDeclaration): Record<NameKind, ReadonlySet<string>> {
  return {
    attribute: new Set((element.attributes ?? []).filter((attribute) => !fromBase(attribute)).map((a) => a.name)),
    property: new Set(
      (element.members ?? [])
        .filter(
          (member) =>
            member.kind === 'field' &&
            member.privacy !== 'private' &&
            member.privacy !== 'protected' &&
            member.static !== true &&
            !fromBase(member),
        )
        .map((member) => member.name),
    ),
    slot: new Set((element.slots ?? []).map((slot) => slot.name)),
    event: new Set((element.events ?? []).filter((event) => event.description).map((event) => event.name)),
    nativeEvent: new Set(NATIVE_EVENTS),
  };
}

/**
 * Every name the binding, slot and action maps of `descriptor` hold, never one from the prop schema. A surface
 * lookup contributes the members it sets, not its surface property (§12 AM-072), a text binding names no member
 * (§12 AM-092), and a URL binding names the attribute it sets (§12 AM-094).
 */
function namedItems(descriptor: LineDescriptor): NamedItem[] {
  const { tag, bindings, slots, actions } = descriptor;
  const members = Object.entries(bindings.props).flatMap(([prop, binding]): NamedItem[] => {
    if (binding === undefined || binding.kind === 'text') return [];
    if (binding.kind === 'url') return [{ tag, prop, kind: 'attribute', name: binding.name }];
    const targets = binding.kind === 'surfaceLookup' ? binding.sets : [binding];
    return targets.map(({ kind, name }) => ({ tag, prop, kind, name }));
  });
  const commit: NamedItem[] =
    bindings.value === undefined
      ? []
      : [{ tag, prop: bindings.value.prop, kind: 'event', name: bindings.value.commitEvent }];
  const slotNames = Object.entries(slots).flatMap(([prop, name]): NamedItem[] =>
    name === undefined ? [] : [{ tag, prop, kind: 'slot', name }],
  );
  const events = Object.entries(actions).flatMap(([prop, action]): NamedItem[] =>
    action === undefined ? [] : [{ tag, prop, kind: action.native ? 'nativeEvent' : 'event', name: action.event }],
  );
  return [...members, ...commit, ...slotNames, ...events];
}

/** Returns every attribute, property, slot and event the descriptors name that the manifest lacks. */
export function driftViolations(descriptors: readonly LineDescriptor[], manifest: Manifest): DriftViolation[] {
  const elements = elementsByTag(manifest);
  return descriptors.flatMap((descriptor): DriftViolation[] => {
    const element = elements.get(descriptor.tag);
    if (element === undefined) return [{ tag: descriptor.tag, kind: 'element', name: descriptor.tag }];
    const known = publicNames(element);
    return namedItems(descriptor).filter((item) => !known[item.kind].has(item.name));
  });
}

/**
 * Returns the tags of the manifest's own elements that no descriptor covers. Declarations of modules outside the
 * package's `src/`, the inherited `line-core` sources, are left out.
 */
export function coverageViolations(descriptors: readonly LineDescriptor[], manifest: Manifest): string[] {
  const covered = new Set(descriptors.map((descriptor) => descriptor.tag));
  return manifest.modules
    .filter((module) => module.path.startsWith('src/'))
    .flatMap((module) => module.declarations ?? [])
    .flatMap((declaration) => (declaration.tagName === undefined ? [] : [declaration.tagName]))
    .filter((tag) => !covered.has(tag))
    .sort();
}
