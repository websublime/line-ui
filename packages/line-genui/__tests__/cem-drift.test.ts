/**
 * The CEM drift test (Phase 1 spec §6.G.5 Acceptance, §7.3; ARCH §17.3; ledger 01-G5).
 *
 * - The descriptors name no attribute, property, slot or event that the built `line-components`
 *   `custom-elements.json` lacks. The names come from the binding, slot and action maps, not the prop schema.
 * - An action-map event marked native passes only when it is a known DOM event; any other event must be a
 *   `@fires` event of the element.
 * - A surface lookup, such as Icon `name` → `iconMap`, is checked through the members it sets.
 * - The §7.3 content rules decide which manifest members count as public API.
 *
 * The manifest is the file the `line-components` build emits, reached by package name, so it needs
 * `bun run build` first, as the CI unit tier has.
 *
 * @module __tests__/cem-drift
 */

import { describe, expect, test } from 'bun:test';
import componentsManifest from '@websublime/line-components/custom-elements.json' with { type: 'json' };
import {
  buttonDescriptor,
  commonProp,
  defineDescriptor,
  descriptors,
  iconDescriptor,
  type LineDescriptor,
} from '../src/catalog/index.js';
import { driftViolations, elementsByTag, type Manifest } from './cem-check.js';

const manifest = componentsManifest as Manifest;

/** `descriptor` holding only the maps `patch` gives, so a fixture checks those names alone. */
const variant = (
  descriptor: LineDescriptor,
  patch: Partial<Pick<LineDescriptor, 'bindings' | 'slots' | 'actions'>>,
): LineDescriptor => ({ ...descriptor, bindings: { props: {} }, slots: {}, actions: {}, ...patch });

/** The names an element declares as attributes and members, private ones included. */
const declaredNames = (tag: string): string[] => {
  const element = elementsByTag(manifest).get(tag);
  return [...(element?.attributes ?? []), ...(element?.members ?? [])].map((item) => item.name);
};

describe('CEM drift: descriptors against the built line-components manifest (§6.G.5)', () => {
  test('every descriptor names only members, slots and events the manifest declares', () => {
    expect(descriptors.length).toBeGreaterThan(0);
    expect(driftViolations(descriptors, manifest)).toEqual([]);
  });

  test('a binding to an attribute the manifest lacks fails', () => {
    const button = variant(buttonDescriptor, { bindings: { props: { variant: { kind: 'attribute', name: 'tone' } } } });
    expect(driftViolations([button], manifest)).toEqual([
      { tag: 'line-button', prop: 'variant', kind: 'attribute', name: 'tone' },
    ]);
  });

  test('a binding to a property, a slot or a commit event the manifest lacks fails', () => {
    const button = variant(buttonDescriptor, {
      bindings: {
        props: { pressed: { kind: 'property', name: 'toggled' } },
        value: { prop: 'pressed', commitEvent: 'line-toggle' },
      },
      slots: { child: 'label' },
    });
    expect(driftViolations([button], manifest)).toEqual([
      { tag: 'line-button', prop: 'pressed', kind: 'property', name: 'toggled' },
      { tag: 'line-button', prop: 'pressed', kind: 'event', name: 'line-toggle' },
      { tag: 'line-button', prop: 'child', kind: 'slot', name: 'label' },
    ]);
  });

  test('a descriptor whose tag the manifest lacks fails', () => {
    const chip = variant({ ...buttonDescriptor, name: 'Chip', tag: 'line-chip' }, {});
    expect(driftViolations([chip], manifest)).toEqual([{ tag: 'line-chip', kind: 'element', name: 'line-chip' }]);
  });
});

describe('CEM drift: action-map events (§12 AM-067, AM-070)', () => {
  test("Button's native click passes", () => {
    expect(buttonDescriptor.actions.action).toEqual({ event: 'click', native: true });
    expect(driftViolations([variant(buttonDescriptor, { actions: buttonDescriptor.actions })], manifest)).toEqual([]);
  });

  test('an event not marked native that the manifest lacks fails', () => {
    const button = variant(buttonDescriptor, { actions: { action: { event: 'line-press', native: false } } });
    expect(driftViolations([button], manifest)).toEqual([
      { tag: 'line-button', prop: 'action', kind: 'event', name: 'line-press' },
    ]);
  });

  test('a native click not marked native fails, because the manifest lists no DOM event', () => {
    const button = variant(buttonDescriptor, { actions: { action: { event: 'click', native: false } } });
    expect(driftViolations([button], manifest)).toEqual([
      { tag: 'line-button', prop: 'action', kind: 'event', name: 'click' },
    ]);
  });

  test('an unknown event marked native fails', () => {
    const button = variant(buttonDescriptor, { actions: { action: { event: 'clik', native: true } } });
    expect(driftViolations([button], manifest)).toEqual([
      { tag: 'line-button', prop: 'action', kind: 'nativeEvent', name: 'clik' },
    ]);
  });

  test('prop-schema keys with no manifest member, such as accessibility and child, pass', () => {
    const probe = defineDescriptor({
      name: 'Button',
      tag: 'line-button',
      load: async () => undefined,
      description: 'A button.',
      props: {
        child: commonProp('ComponentId', 'The visible text.').optional(),
        action: commonProp('Action', 'The action that runs on activation.').optional(),
      },
      slots: {},
      bindings: { props: {} },
      actions: {},
      accessibility: { hostNaming: { kind: 'always' } },
    });
    for (const name of ['accessibility', 'child']) {
      expect(Object.keys(probe.schema.shape)).toContain(name);
      expect(declaredNames('line-button')).not.toContain(name);
    }
    expect(driftViolations([probe], manifest)).toEqual([]);
  });
});

describe('CEM drift: surface lookups (§12 AM-071, AM-072)', () => {
  test('Icon name → iconMap passes through the members it sets, though line-icon declares no iconMap', () => {
    const lookup = iconDescriptor.bindings.props.name;
    expect(lookup?.kind === 'surfaceLookup' && lookup.surfaceProperty).toBe('iconMap');
    expect(declaredNames('line-icon')).not.toContain('iconMap');
    const icon = variant(iconDescriptor, { bindings: { props: { name: lookup } } });
    expect(driftViolations([icon], manifest)).toEqual([]);
  });

  test('a lookup entry that sets a member the manifest lacks fails', () => {
    const icon = variant(iconDescriptor, {
      bindings: {
        props: {
          name: {
            kind: 'surfaceLookup',
            surfaceProperty: 'iconMap',
            sets: [
              { kind: 'attribute', name: 'name' },
              { kind: 'attribute', name: 'size' },
            ],
            skippedWhen: [],
          },
        },
      },
    });
    expect(driftViolations([icon], manifest)).toEqual([
      { tag: 'line-icon', prop: 'name', kind: 'attribute', name: 'size' },
    ]);
  });
});

describe('CEM drift: §7.3 content rules (§10 SD61; R4 §2.3, §2.4)', () => {
  const probeManifest: Manifest = {
    modules: [
      {
        path: 'src/probe/probe.ts',
        declarations: [
          {
            kind: 'class',
            name: 'LineProbe',
            tagName: 'line-probe',
            members: [
              { kind: 'field', name: 'label' },
              { kind: 'field', name: '#state', privacy: 'private' },
              { kind: 'field', name: 'internals', privacy: 'protected' },
              { kind: 'field', name: 'version', static: true },
              { kind: 'field', name: 'direction', privacy: 'public', inheritedFrom: { name: 'DirectionMixin' } },
            ],
            events: [{ name: 'line-change', description: 'Fires on change.' }, { name: 'line-detected' }],
          },
        ],
      },
    ],
  };
  const probe = (patch: Parameters<typeof variant>[1]): LineDescriptor =>
    variant({ ...buttonDescriptor, tag: 'line-probe' }, patch);
  const bindProperties = (descriptor: LineDescriptor, ...names: string[]): LineDescriptor =>
    variant(descriptor, {
      bindings: { props: Object.fromEntries(names.map((name) => [name, { kind: 'property', name }])) },
    });

  test('private, protected, static and line-core base members are no public API', () => {
    const hidden = ['#state', 'internals', 'version', 'direction'];
    expect(driftViolations([bindProperties(probe({}), 'label')], probeManifest)).toEqual([]);
    expect(
      driftViolations([bindProperties(probe({}), ...hidden)], probeManifest).map((violation) => violation.name),
    ).toEqual(hidden);
  });

  test('members inherited from FormAssociated are public API', () => {
    expect(driftViolations([bindProperties(buttonDescriptor, 'type', 'name', 'form')], manifest)).toEqual([]);
  });

  test('an event without @fires JSDoc does not count', () => {
    const firing = (event: string) => probe({ actions: { action: { event, native: false } } });
    expect(driftViolations([firing('line-change')], probeManifest)).toEqual([]);
    expect(driftViolations([firing('line-detected')], probeManifest)).toEqual([
      { tag: 'line-probe', prop: 'action', kind: 'event', name: 'line-detected' },
    ]);
  });
});
