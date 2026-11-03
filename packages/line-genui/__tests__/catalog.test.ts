/**
 * The descriptor API of `@websublime/line-genui/catalog` (Phase 1 spec §6.G.1 Acceptance; ledger 01-G1).
 *
 * - The C1–C4 descriptors compose with the `web_core` common types: a `Catalog` built from them writes each
 *   common-type prop as a `$ref` to `common_types.json` and each enum inline, as the component spec tables type
 *   them, and a node that uses the common types parses.
 * - Button's component description and a property description both appear in `Catalog.toJson()`.
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
  buttonDescriptor,
  defineDescriptor,
  descriptors,
  iconDescriptor,
  separatorDescriptor,
  stackDescriptor,
} from '../src/catalog/index.js';

const COMMON_TYPES = 'common_types.json#/$defs/';

/**
 * Each descriptor's own props, as the "Descriptor fields" prop schema of its component spec types them: a common
 * type by its `$defs` name, or `enum` for a literal enum (`0002-button.md`, `0014-icon.md`, `0011-separator.md`,
 * `0018-stack.md`).
 */
const PROP_TYPES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  Button: {
    variant: 'enum',
    disabled: 'DynamicBoolean',
    loading: 'DynamicBoolean',
    pressed: 'DynamicBoolean',
    child: 'ComponentId',
    action: 'Action',
  },
  Icon: { name: 'DynamicString', mirror: 'DynamicBoolean', path: 'DynamicString' },
  Separator: { orientation: 'enum', decorative: 'DynamicBoolean' },
  Stack: {
    orientation: 'enum',
    justify: 'enum',
    align: 'enum',
    gap: 'enum',
    wrap: 'DynamicBoolean',
    children: 'ChildList',
  },
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
  test('the catalog holds the four descriptors under their catalog names', () => {
    expect(Object.keys(catalogJson().components as Json).sort()).toEqual(['Button', 'Icon', 'Separator', 'Stack']);
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

  test('defaults to true, as on every C1–C4 descriptor', () => {
    expect(defineDescriptor(fixture).agentExposed).toBe(true);
    expect(descriptors.map((d) => d.agentExposed)).toEqual([true, true, true, true]);
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
    expect(JSON.parse(stdout)).toEqual({ defined: [], descriptors: 4 });
  });
});
