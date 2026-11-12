/**
 * The descriptor API of `@websublime/line-genui/catalog` (Phase 1 spec §6.G.1 Acceptance; ledger 01-G1).
 *
 * - The C1–C11 descriptors compose with the `web_core` common types: a `Catalog` built from them writes each
 *   common-type prop as a `$ref` to `common_types.json` and each enum inline, as the component spec tables type
 *   them, and a node that uses the common types parses.
 * - Button's component description and a property description both appear in `Catalog.toJson()`.
 * - A text binding and a `textProp` name source go together: a descriptor with a text binding has no slot map, and
 *   each `textProp` source names a prop with a text binding (§12 AM-092).
 * - Importing `@websublime/line-genui/catalog` defines no element. The import runs in a fresh Bun process, so no
 *   module this test run loaded earlier hides a definition. It resolves the built `dist/`, so it needs
 *   `bun run build` first, as the CI unit tier has.
 *
 * @module __tests__/catalog
 */

import { describe, expect, test } from 'bun:test';
import { Catalog } from '@a2ui/web_core/catalog';
import { z } from 'zod';
import {
  alertDescriptor,
  avatarDescriptor,
  avatarGroupDescriptor,
  badgeDescriptor,
  buttonDescriptor,
  buttonGroupDescriptor,
  chipDescriptor,
  defineDescriptor,
  descriptors,
  iconButtonDescriptor,
  iconDescriptor,
  portalDescriptor,
  separatorDescriptor,
  stackDescriptor,
  visuallyHiddenDescriptor,
} from '../src/catalog/index.js';

const COMMON_TYPES = 'common_types.json#/$defs/';

/**
 * Each descriptor's own props, as the "Descriptor fields" prop schema of its component spec types them: a common
 * type by its `$defs` name, or `enum` for a literal enum (`0002-button.md`, `0004-button-group.md`, `0006-alert.md`,
 * `0009-avatar.md`, `0010-avatar-group.md`, `0007-badge.md`, `0008-chip.md`, `0014-icon.md`, `0003-icon-button.md`, `0011-separator.md`,
 * `0018-stack.md`, `0012-visually-hidden.md`, `0013-portal.md`).
 */
const PROP_TYPES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  Alert: {
    variant: 'enum',
    icon: 'ComponentId',
    title: 'ComponentId',
    children: 'ChildList',
    actions: 'ChildList',
    dismiss: 'ComponentId',
  },
  Avatar: { src: 'DynamicString', name: 'DynamicString', status: 'ComponentId' },
  AvatarGroup: {
    children: 'ChildList',
    max: 'DynamicNumber',
    size: 'enum',
    spacing: 'enum',
    overflowLabel: 'DynamicString',
  },
  Badge: { label: 'DynamicString', variant: 'enum' },
  Button: {
    variant: 'enum',
    disabled: 'DynamicBoolean',
    loading: 'DynamicBoolean',
    pressed: 'DynamicBoolean',
    child: 'ComponentId',
    action: 'Action',
  },
  ButtonGroup: { orientation: 'enum', loop: 'DynamicBoolean', children: 'ChildList' },
  Chip: { label: 'DynamicString', variant: 'enum', pressed: 'DynamicBoolean', disabled: 'DynamicBoolean' },
  Icon: { name: 'DynamicString', mirror: 'DynamicBoolean', path: 'DynamicString' },
  IconButton: {
    variant: 'enum',
    disabled: 'DynamicBoolean',
    loading: 'DynamicBoolean',
    pressed: 'DynamicBoolean',
    child: 'ComponentId',
    action: 'Action',
  },
  Separator: { orientation: 'enum', decorative: 'DynamicBoolean' },
  Stack: {
    orientation: 'enum',
    justify: 'enum',
    align: 'enum',
    gap: 'enum',
    wrap: 'DynamicBoolean',
    children: 'ChildList',
  },
  Portal: { children: 'ChildList' },
  VisuallyHidden: { children: 'ChildList' },
};

type Json = Record<string, unknown>;

/** The `toJson()` document of a catalog of every descriptor. */
function catalogJson(): Json {
  return new Catalog('urn:line-genui:test', '0.9', [...descriptors]).toJson();
}

/** A component's definition in a `toJson()` document: its mixin `$ref`s and its own-props object. */
function definition(doc: Json, name: string): { refs: unknown[]; own: Json } {
  const component = (doc.components as Record<string, { allOf: Json[] }>)[name];
  if (!component) throw new Error(`${name} is not in the catalog`);
  const own = component.allOf.find((part) => part.properties !== undefined);
  if (!own) throw new Error(`${name} has no own-props object`);
  return { refs: component.allOf.filter((part) => part !== own).map((part) => part.$ref), own };
}

describe('descriptors compose with the web_core common types (§6.G.1)', () => {
  test('the catalog holds the thirteen descriptors under their catalog names', () => {
    expect(Object.keys(catalogJson().components as Json).sort()).toEqual([
      'Alert',
      'Avatar',
      'AvatarGroup',
      'Badge',
      'Button',
      'ButtonGroup',
      'Chip',
      'Icon',
      'IconButton',
      'Portal',
      'Separator',
      'Stack',
      'VisuallyHidden',
    ]);
  });

  for (const [name, props] of Object.entries(PROP_TYPES)) {
    test(`${name}: common-type props are $refs, enums are inline, and the ComponentCommon mixin is referenced`, () => {
      const { refs, own } = definition(catalogJson(), name);
      expect(refs).toEqual([`${COMMON_TYPES}ComponentCommon`]);

      const properties = own.properties as Record<string, Json>;
      const { component, ...emitted } = properties;
      expect(component).toEqual({ const: name });
      expect(Object.keys(emitted).sort()).toEqual(Object.keys(props).sort());

      for (const [prop, type] of Object.entries(props)) {
        const json = emitted[prop] ?? {};
        if (type === 'enum') {
          expect(json.$ref).toBeUndefined();
          expect(json.type).toBe('string');
          expect(Array.isArray(json.enum)).toBe(true);
        } else {
          expect(json.$ref).toBe(`${COMMON_TYPES}${type}`);
        }
        expect(typeof json.description).toBe('string');
        expect(json.description).not.toContain('${');
        expect(json.description).not.toStartWith('REF:');
      }
    });
  }

  test('a node using the common types and the accessibility object parses', () => {
    const node = {
      child: 'save-label',
      action: { event: { name: 'save' } },
      pressed: { path: '/form/pinned' },
      disabled: false,
      variant: 'primary',
      accessibility: { label: 'Save', description: 'Saves the form' },
    };
    expect(buttonDescriptor.schema.parse(node)).toEqual(node);
    expect(stackDescriptor.schema.parse({ children: ['a', 'b'], gap: '3' })).toEqual({
      children: ['a', 'b'],
      gap: '3',
    });
    expect(stackDescriptor.schema.parse({ children: { componentId: 'row', path: '/items' } })).toEqual({
      children: { componentId: 'row', path: '/items' },
    });
  });

  test('a prop outside the descriptor is rejected', () => {
    expect(iconDescriptor.schema.safeParse({ name: 'check', library: 'phosphor' }).success).toBe(false);
    expect(separatorDescriptor.schema.safeParse({ orientation: 'diagonal' }).success).toBe(false);
  });
});

describe('the IconButton descriptor (`0003-icon-button.md` Descriptor fields)', () => {
  test('is agent-exposed, requires accessibility.label only and always sets the host name', () => {
    expect(iconButtonDescriptor.agentExposed).toBe(true);
    expect(iconButtonDescriptor.accessibility).toEqual({
      requiredName: [{ kind: 'accessibilityLabel' }],
      hostNaming: { kind: 'always' },
    });
    expect(iconButtonDescriptor.slots).toEqual({ child: '' });
    expect(iconButtonDescriptor.actions).toEqual({ action: { event: 'click', native: true } });
  });

  test('child takes any ComponentId, not only an Icon, and the schema has no form props', () => {
    for (const child of ['close-icon', 'a-stack', 'a-separator', 'not-an-icon-at-all']) {
      expect(iconButtonDescriptor.schema.safeParse({ child, accessibility: { label: 'Close' } }).success).toBe(true);
    }
    expect(iconButtonDescriptor.schema.safeParse({ child: { path: '/icon' } }).success).toBe(false);
    for (const extra of [{ type: 'submit' }, { name: 'intent' }, { value: 'save' }, { icon: 'close' }]) {
      expect(iconButtonDescriptor.schema.safeParse({ child: 'i', ...extra }).success).toBe(false);
    }
  });
});

describe('the ButtonGroup descriptor (`0004-button-group.md` Descriptor fields)', () => {
  test('is agent-exposed, requires accessibility.label, always sets the host name and has no action or value', () => {
    expect(buttonGroupDescriptor.agentExposed).toBe(true);
    expect(buttonGroupDescriptor.tag).toBe('line-button-group');
    expect(buttonGroupDescriptor.accessibility).toEqual({
      requiredName: [{ kind: 'accessibilityLabel' }],
      hostNaming: { kind: 'always' },
    });
    expect(buttonGroupDescriptor.slots).toEqual({ children: '' });
    expect(buttonGroupDescriptor.actions).toEqual({});
    expect(buttonGroupDescriptor.bindings).toEqual({
      props: {
        orientation: { kind: 'attribute', name: 'orientation' },
        loop: { kind: 'attribute', name: 'loop' },
      },
    });
  });

  test('children take any component ids; the schema rejects an unknown orientation, an action and a value', () => {
    for (const children of [['bold', 'italic', 'underline'], ['a-text', 'a-stack'], []]) {
      expect(buttonGroupDescriptor.schema.safeParse({ children, accessibility: { label: 'Tools' } }).success).toBe(
        true,
      );
    }
    expect(buttonGroupDescriptor.schema.safeParse({ orientation: 'diagonal' }).success).toBe(false);
    for (const extra of [{ action: { event: { name: 'x' } } }, { value: 'bold' }, { disabled: true }]) {
      expect(buttonGroupDescriptor.schema.safeParse({ children: [], ...extra }).success).toBe(false);
    }
  });
});

describe('the Alert descriptor (`0006-alert.md` Descriptor fields)', () => {
  test('is agent-exposed, requires no name, never sets the host name and has no action or value', () => {
    expect(alertDescriptor.agentExposed).toBe(true);
    expect(alertDescriptor.tag).toBe('line-alert');
    expect(alertDescriptor.accessibility).toEqual({ hostNaming: { kind: 'never' } });
    expect(alertDescriptor.slots).toEqual({
      icon: 'icon',
      title: 'title',
      children: '',
      actions: 'actions',
      dismiss: 'dismiss',
    });
    expect(alertDescriptor.actions).toEqual({});
    expect(alertDescriptor.bindings).toEqual({ props: { variant: { kind: 'attribute', name: 'variant' } } });
  });

  test('the agent-facing and tool descriptions both ask for the tone in words (decision D14)', () => {
    expect(alertDescriptor.description).toContain('state the tone in words');
    expect(alertDescriptor.toolDescription).toContain('state the tone in words');
    expect(alertDescriptor.description).toContain('because colour alone does not reach every user');
    expect(alertDescriptor.toolDescription).toContain('because colour alone does not reach every user');
  });

  test('the schema takes the five variants and the child props, and rejects live, an action and a value', () => {
    for (const variant of ['neutral', 'info', 'success', 'warning', 'danger']) {
      expect(alertDescriptor.schema.safeParse({ variant }).success).toBe(true);
    }
    const node = { icon: 'i', title: 't', children: ['m'], actions: ['retry'], dismiss: 'close', variant: 'danger' };
    expect(alertDescriptor.schema.parse(node)).toEqual(node);
    expect(alertDescriptor.schema.safeParse({ children: { componentId: 'line', path: '/lines' } }).success).toBe(true);
    expect(alertDescriptor.schema.safeParse({ variant: 'error' }).success).toBe(false);
    for (const extra of [{ live: 'assertive' }, { action: { event: { name: 'x' } } }, { value: 'x' }, { open: true }]) {
      expect(alertDescriptor.schema.safeParse({ children: [], ...extra }).success).toBe(false);
    }
  });
});

describe('the Avatar descriptor (`0009-avatar.md` Descriptor fields)', () => {
  test('is agent-exposed, slots status, binds src behind the URL policy and name as an attribute, and has no value', () => {
    expect(avatarDescriptor.agentExposed).toBe(true);
    expect(avatarDescriptor.tag).toBe('line-avatar');
    expect(avatarDescriptor.slots).toEqual({ status: 'status' });
    expect(avatarDescriptor.actions).toEqual({});
    expect(avatarDescriptor.bindings).toEqual({
      props: {
        src: { kind: 'url', use: 'image', name: 'src' },
        name: { kind: 'attribute', name: 'name' },
      },
    });
  });

  test('requires no name and always sets the host name (decision F11)', () => {
    expect(avatarDescriptor.accessibility).toEqual({ hostNaming: { kind: 'always' } });
  });

  test('its 682-character description names status and its 558-character tool description does not (F9)', () => {
    expect(Array.from(avatarDescriptor.description).length).toBe(682);
    expect(Array.from(avatarDescriptor.toolDescription ?? '').length).toBe(558);
    expect(avatarDescriptor.description).toContain('`status`');
    expect(avatarDescriptor.toolDescription).not.toContain('status');
    expect(avatarDescriptor.toolDescription).not.toContain('accessibility');
  });

  test('the schema takes optional src, name and status, bound or literal, and rejects size, shape and fallback', () => {
    expect(avatarDescriptor.schema.safeParse({}).success).toBe(true);
    const node = { src: { path: '/user/photo' }, name: { path: '/user/name' }, status: 'presence' };
    expect(avatarDescriptor.schema.parse(node)).toEqual(node);
    expect(avatarDescriptor.schema.safeParse({ src: 'https://example.com/a.png', name: 'Ana' }).success).toBe(true);
    for (const extra of [{ size: 'lg' }, { shape: 'square' }, { fallback: 'icon' }, { child: 'text' }]) {
      expect(avatarDescriptor.schema.safeParse({ name: 'Ana', ...extra }).success).toBe(false);
    }
  });
});

describe('the AvatarGroup descriptor (`0010-avatar-group.md` Descriptor fields)', () => {
  test('is agent-exposed, slots children, binds max, size, spacing and overflowLabel as attributes, and has no value', () => {
    expect(avatarGroupDescriptor.agentExposed).toBe(true);
    expect(avatarGroupDescriptor.tag).toBe('line-avatar-group');
    expect(avatarGroupDescriptor.slots).toEqual({ children: '' });
    expect(avatarGroupDescriptor.actions).toEqual({});
    expect(avatarGroupDescriptor.bindings).toEqual({
      props: {
        max: { kind: 'attribute', name: 'max' },
        size: { kind: 'attribute', name: 'size' },
        spacing: { kind: 'attribute', name: 'spacing' },
        overflowLabel: { kind: 'attribute', name: 'overflow-label' },
      },
    });
  });

  test('requires no name and always sets the host name (decision F10)', () => {
    expect(avatarGroupDescriptor.accessibility).toEqual({ hostNaming: { kind: 'always' } });
  });

  test('its 854-character description names children and accessibility.label; its 856-character tool description neither', () => {
    expect(Array.from(avatarGroupDescriptor.description).length).toBe(854);
    expect(Array.from(avatarGroupDescriptor.toolDescription ?? '').length).toBe(856);
    expect(avatarGroupDescriptor.description).toContain('`children`');
    expect(avatarGroupDescriptor.description).toContain('`accessibility.label`');
    expect(avatarGroupDescriptor.toolDescription).not.toContain('children');
    expect(avatarGroupDescriptor.toolDescription).not.toContain('accessibility.');
    expect(avatarGroupDescriptor.toolDescription).toContain('`accessibilityLabel`');
  });

  test('the schema takes optional children, max, size, spacing and overflowLabel, and rejects other steps and props', () => {
    expect(avatarGroupDescriptor.schema.safeParse({}).success).toBe(true);
    const node = {
      children: ['ana', 'rui'],
      max: { path: '/team/max' },
      size: '5',
      spacing: '0',
      overflowLabel: '+{count} more members',
    };
    expect(avatarGroupDescriptor.schema.parse(node)).toEqual(node);
    for (const extra of [{ size: '0' }, { spacing: '4' }, { max: 'three' }, { expanded: true }, { open: true }]) {
      expect(avatarGroupDescriptor.schema.safeParse({ ...extra }).success).toBe(false);
    }
  });
});

describe('the Badge descriptor (`0007-badge.md` Descriptor fields)', () => {
  test('is agent-exposed, has no slot map and no action, binds label as text and variant as an attribute, and has no value', () => {
    expect(badgeDescriptor.agentExposed).toBe(true);
    expect(badgeDescriptor.tag).toBe('line-badge');
    expect(badgeDescriptor.slots).toEqual({});
    expect(badgeDescriptor.actions).toEqual({});
    expect(badgeDescriptor.bindings).toEqual({
      props: {
        label: { kind: 'text' },
        variant: { kind: 'attribute', name: 'variant' },
      },
    });
  });

  test('takes its name from label or accessibility.label, and always sets the host name (decision F10)', () => {
    expect(badgeDescriptor.accessibility).toEqual({
      requiredName: [{ kind: 'textProp', prop: 'label' }, { kind: 'accessibilityLabel' }],
      hostNaming: { kind: 'always' },
    });
  });

  test('its 756-character description names accessibility.label and its 755-character tool description accessibilityLabel', () => {
    expect(Array.from(badgeDescriptor.description).length).toBe(756);
    expect(Array.from(badgeDescriptor.toolDescription ?? '').length).toBe(755);
    expect(badgeDescriptor.toolDescription).toBe(
      badgeDescriptor.description.replace('`accessibility.label`', '`accessibilityLabel`'),
    );
    expect(badgeDescriptor.toolDescription).not.toContain('accessibility.label');
    expect(badgeDescriptor.description).toContain('because colour alone does not reach every user');
  });

  test('the schema takes an optional label, a bound label and the five variants, and rejects child, action and count', () => {
    for (const variant of ['neutral', 'info', 'success', 'warning', 'danger']) {
      expect(badgeDescriptor.schema.safeParse({ label: '5', variant }).success).toBe(true);
    }
    expect(badgeDescriptor.schema.safeParse({}).success).toBe(true);
    const node = { label: { path: '/inbox/unread' }, variant: 'danger' };
    expect(badgeDescriptor.schema.parse(node)).toEqual(node);
    expect(badgeDescriptor.schema.safeParse({ label: 'x', variant: 'accent' }).success).toBe(false);
    for (const extra of [{ child: 'text' }, { action: { event: { name: 'x' } } }, { count: 5 }, { max: 99 }]) {
      expect(badgeDescriptor.schema.safeParse({ label: 'x', ...extra }).success).toBe(false);
    }
  });
});

describe('the Chip descriptor (`0008-chip.md` Descriptor fields)', () => {
  test('is agent-exposed, has no slot map and no action, and binds label as text and pressed as its value', () => {
    expect(chipDescriptor.agentExposed).toBe(true);
    expect(chipDescriptor.tag).toBe('line-chip');
    expect(chipDescriptor.slots).toEqual({});
    expect(chipDescriptor.actions).toEqual({});
    expect(chipDescriptor.bindings).toEqual({
      props: {
        label: { kind: 'text' },
        variant: { kind: 'attribute', name: 'variant' },
        pressed: { kind: 'property', name: 'pressed' },
        disabled: { kind: 'attribute', name: 'disabled' },
      },
      value: { prop: 'pressed', commitEvent: 'line-change' },
    });
  });

  test('takes its name from label or accessibility.label, and always sets the host name', () => {
    expect(chipDescriptor.accessibility).toEqual({
      requiredName: [{ kind: 'textProp', prop: 'label' }, { kind: 'accessibilityLabel' }],
      hostNaming: { kind: 'always' },
    });
  });

  test('sets no tool description; its 725-character description names only the tool parameters', () => {
    expect(Object.hasOwn(chipDescriptor, 'toolDescription')).toBe(false);
    expect(Array.from(chipDescriptor.description).length).toBe(725);
    const named = Array.from(chipDescriptor.description.matchAll(/`([^`]+)`/g), (match) => match[1]);
    expect([...new Set(named)]).toEqual([
      'label',
      'pressed',
      'true',
      'false',
      'line-change',
      'variant',
      'primary',
      'default',
      'disabled',
    ]);
  });

  test('the schema requires label, takes a bound label and the two variants, and rejects child, action and value', () => {
    for (const variant of ['default', 'primary']) {
      expect(chipDescriptor.schema.safeParse({ label: 'In stock', variant }).success).toBe(true);
    }
    const node = { label: { path: '/label' }, pressed: { path: '/on' }, disabled: false };
    expect(chipDescriptor.schema.parse(node)).toEqual(node);
    expect(chipDescriptor.schema.safeParse({ pressed: true }).success).toBe(false);
    expect(chipDescriptor.schema.safeParse({ label: 'x', variant: 'borderless' }).success).toBe(false);
    for (const extra of [{ child: 'text' }, { action: { event: { name: 'x' } } }, { value: true }, { loading: true }]) {
      expect(chipDescriptor.schema.safeParse({ label: 'x', ...extra }).success).toBe(false);
    }
  });
});

describe('text bindings and textProp name sources (§6.G.1, §6.G.4; §12 AM-092)', () => {
  const textProps = (descriptor: (typeof descriptors)[number]) =>
    Object.entries(descriptor.bindings.props).flatMap(([prop, binding]) => (binding?.kind === 'text' ? [prop] : []));

  test('a descriptor with a text binding has no slot map', () => {
    const withText = descriptors.filter((descriptor) => textProps(descriptor).length > 0);
    expect(withText.map((descriptor) => descriptor.name)).toEqual(['Badge', 'Chip']);
    for (const descriptor of withText) expect(descriptor.slots).toEqual({});
  });

  test('each textProp name source names a prop with a text binding', () => {
    const sources = descriptors.flatMap((descriptor) =>
      (descriptor.accessibility.requiredName ?? []).flatMap((source) =>
        source.kind === 'textProp' ? [{ name: descriptor.name, prop: source.prop, text: textProps(descriptor) }] : [],
      ),
    );
    expect(sources.map(({ name, prop }) => `${name}.${prop}`)).toEqual(['Badge.label', 'Chip.label']);
    for (const { prop, text } of sources) expect(text).toContain(prop);
  });
});

describe('descriptions reach Catalog.toJson() (§6.G.1; R3 §2.4)', () => {
  test("Button's component description and a property description both appear", () => {
    const { own } = definition(catalogJson(), 'Button');
    expect(own.description).toBe(buttonDescriptor.description);
    expect(own.description).toStartWith('A button that runs an action when the user activates it.');
    const properties = own.properties as Record<string, Json>;
    expect(properties.child?.description).toBe('The ID of the component that holds the visible text, usually a Text.');
  });
});

describe('agentExposed (§6.G.1 Contract)', () => {
  const fixture = {
    name: 'Fixture',
    tag: 'line-fixture',
    load: async () => undefined,
    description: 'A fixture.',
    props: { label: z.enum(['a', 'b']).describe('A label.').optional() },
    slots: {},
    bindings: { props: {} },
    actions: {},
    accessibility: { hostNaming: { kind: 'always' } },
  } as const;

  test('defaults to true, as on every descriptor but Portal and VisuallyHidden', () => {
    expect(defineDescriptor(fixture).agentExposed).toBe(true);
    expect(descriptors).toHaveLength(13);
    expect(descriptors.filter((d) => !d.agentExposed)).toEqual([portalDescriptor, visuallyHiddenDescriptor]);
  });

  test('Portal is not agent-exposed and keeps its reason (0013-portal.md Agent contract)', () => {
    expect(portalDescriptor).toMatchObject({
      agentExposed: false,
      agentHiddenReason:
        "It paints its content above the whole page, outside the surface, so an untrusted agent could cover the host's own UI.",
    });
  });

  test('VisuallyHidden is not agent-exposed and keeps its reason (0012-visually-hidden.md Agent contract)', () => {
    expect(visuallyHiddenDescriptor).toMatchObject({
      agentExposed: false,
      agentHiddenReason: 'An untrusted agent could add text that only screen readers hear.',
    });
  });

  test('false keeps its reason', () => {
    const hidden = defineDescriptor({ ...fixture, agentExposed: false, agentHiddenReason: 'It escapes the surface.' });
    expect(hidden).toMatchObject({ agentExposed: false, agentHiddenReason: 'It escapes the surface.' });
  });
});

describe('importing @websublime/line-genui/catalog (§6.G.1; plan §7.2)', () => {
  test('defines no element', async () => {
    const script = `
      import { GlobalRegistrator } from '@happy-dom/global-registrator';
      GlobalRegistrator.register();
      const defined = [];
      const define = customElements.define.bind(customElements);
      customElements.define = (name, ...rest) => { defined.push(name); define(name, ...rest); };
      const catalog = await import('@websublime/line-genui/catalog');
      console.log(JSON.stringify({ defined, descriptors: catalog.descriptors.length }));
    `;
    const child = Bun.spawn([process.execPath, '--eval', script], {
      cwd: new URL('..', import.meta.url).pathname,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    expect({ code, stderr }).toEqual({ code: 0, stderr: '' });
    expect(JSON.parse(stdout)).toEqual({ defined: [], descriptors: 13 });
  });
});
