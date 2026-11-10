/**
 * The `line` catalog emitters and the `basic` implementation map (Phase 1 spec §6.G.2 Acceptance; ledger 01-G2).
 *
 * The A2UI v0.9.1 schemas come from `fixtures/a2ui-v0_9_1/` (see its `SOURCE.md`). Ajv 2020 loads them as the R2
 * spike did (`docs/research/assets/01-r2/spike/scripts/catalog.ts`): `common_types.json` and
 * `server_to_client.json` reach the catalog through the relative `catalog.json`, which resolves to
 * `https://a2ui.org/specification/v0_9/catalog.json`, so the document under test is added under that `$id`.
 *
 * One test reads the built `@websublime/line-genui/catalog.json` through the package's `exports`, so it needs
 * `bun run build` first, as the CI unit tier has.
 *
 * @module __tests__/catalog-emitters
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { Catalog } from '@a2ui/web_core/catalog';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { z } from 'zod';
import {
  ADVERTISED_VERSIONS,
  BASIC_CATALOG_ID,
  basicImplementations,
  buttonDescriptor,
  type CatalogJson,
  defineDescriptor,
  descriptors,
  iconDescriptor,
  inlineCatalog,
  LINE_CATALOG_ID,
  lineCapabilities,
  lineCatalogDocument,
  separatorDescriptor,
  stackDescriptor,
} from '../src/catalog/index.js';

type Json = Record<string, unknown>;

function fixture(name: string): Json {
  return JSON.parse(readFileSync(new URL(`./fixtures/a2ui-v0_9_1/${name}`, import.meta.url), 'utf8'));
}

const commonTypes = fixture('common_types.json');
const clientCapabilities = fixture('client_capabilities.json');
const serverToClient = fixture('server_to_client.json');

/** The `$id` the published schemas resolve `catalog.json` to. */
const CATALOG_ALIAS = 'https://a2ui.org/specification/v0_9/catalog.json';

/** Ajv 2020 with the published common types and client capabilities, and `catalog` aliased as `catalog.json`. */
function ajvWith(catalog: Json): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(commonTypes);
  ajv.addSchema(clientCapabilities);
  ajv.addSchema({ ...catalog, $id: CATALOG_ALIAS });
  return ajv;
}

const document = lineCatalogDocument(descriptors);

/** The catalog names of the agent-exposed descriptors, in catalog-name order. */
const LINE_COMPONENTS = ['Alert', 'Button', 'ButtonGroup', 'Chip', 'Icon', 'IconButton', 'Separator', 'Stack'];

/** A tree of `line` components, as an agent sends it. */
const components: Json[] = [
  {
    id: 'root',
    component: 'Stack',
    orientation: 'horizontal',
    children: ['save', 'rule', 'close', 'zoom', 'notice', 'in-stock'],
  },
  { id: 'save', component: 'Button', variant: 'primary', child: 'save-icon', action: { event: { name: 'save' } } },
  { id: 'save-icon', component: 'Icon', name: { path: '/icon' } },
  { id: 'rule', component: 'Separator', decorative: true },
  {
    id: 'close',
    component: 'IconButton',
    variant: 'borderless',
    child: 'close-icon',
    accessibility: { label: 'Close dialog' },
    action: { event: { name: 'close' } },
  },
  { id: 'close-icon', component: 'Icon', name: 'close' },
  {
    id: 'zoom',
    component: 'ButtonGroup',
    orientation: 'vertical',
    loop: true,
    children: ['zoom-in', 'zoom-out'],
    accessibility: { label: 'Zoom' },
  },
  { id: 'zoom-in', component: 'Button', child: 'zoom-in-text', action: { event: { name: 'zoomIn' } } },
  { id: 'zoom-in-text', component: 'Icon', name: 'add' },
  { id: 'zoom-out', component: 'IconButton', child: 'close-icon', accessibility: { label: 'Zoom out' } },
  {
    id: 'notice',
    component: 'Alert',
    variant: 'danger',
    icon: 'notice-icon',
    actions: ['notice-retry'],
    dismiss: 'notice-dismiss',
  },
  { id: 'notice-dismiss', component: 'IconButton', child: 'close-icon', accessibility: { label: 'Dismiss' } },
  { id: 'notice-icon', component: 'Icon', name: 'error' },
  {
    id: 'notice-retry',
    component: 'Button',
    accessibility: { label: 'Retry payment' },
    action: { event: { name: 'retry' } },
  },
  { id: 'in-stock', component: 'Chip', label: 'In stock', variant: 'primary', pressed: { path: '/filters/inStock' } },
];

/** The stream that renders `components` on a `line` surface. */
const messages = [
  { version: 'v0.9.1', createSurface: { surfaceId: 's', catalogId: LINE_CATALOG_ID } },
  { version: 'v0.9.1', updateComponents: { surfaceId: 's', components } },
];

describe('the line catalog document (§6.G.2; §10 SD42)', () => {
  test('the built @websublime/line-genui/catalog.json is this document', () => {
    const file = Bun.resolveSync('@websublime/line-genui/catalog.json', import.meta.dir);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(document);
  });

  test('carries the line id, $defs/anyFunction false and an open $defs/theme', () => {
    expect(document.catalogId).toBe('https://line-ui.websublime.com/a2ui/catalogs/line/v1/catalog.json');
    const defs = document.$defs as Json;
    expect(defs.anyFunction).toBe(false);
    expect(defs.theme).toMatchObject({ type: 'object' });
    expect(defs.theme).not.toHaveProperty('additionalProperties');
    expect(defs.theme).not.toHaveProperty('unevaluatedProperties');
    expect(Object.keys(document.components as Json)).toEqual(LINE_COMPONENTS);
  });

  test('Ajv 2020 compiles common_types.json and server_to_client.json against it', () => {
    const ajv = ajvWith(document);
    expect(ajv.getSchema(String(commonTypes.$id))).toBeFunction();
    const validate = ajv.compile(serverToClient);
    for (const message of messages)
      expect({ message, valid: validate(message), errors: validate.errors }).toEqual({
        message,
        valid: true,
        errors: null,
      });
    const unknown = {
      version: 'v0.9.1',
      updateComponents: { surfaceId: 's', components: [{ id: 'x', component: 'Portal' }] },
    };
    expect(validate(unknown)).toBe(false);
  });

  test('toJson() as emitted does not compile there, so the added defs are what make it compile (R2 §2.7)', () => {
    const { $defs, ...rest } = document;
    const { anyFunction: _f, theme: _t, ...unions } = $defs as Json;
    expect(() => ajvWith({ ...rest, $defs: unions }).compile(serverToClient)).toThrow();
  });

  test('web_core reads it back with Catalog.fromJson, and its validationSchema compiles', () => {
    const catalog = Catalog.fromJson(document);
    expect(catalog.id).toBe(LINE_CATALOG_ID);
    expect([...catalog.components.keys()]).toEqual(LINE_COMPONENTS);
    expect(catalog.toJson()).toEqual(document);

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    ajv.addSchema({ ...catalog.validationSchema, $id: 'urn:line-genui:validation' });
    const component = ajv.compile({ $ref: 'urn:line-genui:validation#/$defs/anyComponent' });
    expect(components.map((node) => component(node))).toEqual(components.map(() => true));
    expect(component({ id: 'c', component: 'IconButton', child: 'i', type: 'submit' })).toBe(false);
    expect(component({ id: 'b', component: 'Button', variant: 'loud' })).toBe(false);
    expect(component({ id: 'g', component: 'ButtonGroup', orientation: 'diagonal' })).toBe(false);
    expect(component({ id: 'g', component: 'ButtonGroup', action: { event: { name: 'x' } } })).toBe(false);
    expect(component({ id: 'a', component: 'Alert', title: 't', children: ['m'] })).toBe(true);
    expect(component({ id: 'a', component: 'Alert', variant: 'error' })).toBe(false);
    expect(component({ id: 'a', component: 'Alert', live: 'assertive' })).toBe(false);
    expect(component({ id: 'a', component: 'Alert', title: ['t1', 't2'] })).toBe(false);
    expect(component({ id: 'c', component: 'Chip', label: { path: '/label' }, disabled: true })).toBe(true);
    expect(component({ id: 'c', component: 'Chip', pressed: true })).toBe(false);
    expect(component({ id: 'c', component: 'Chip', label: 'x', variant: 'borderless' })).toBe(false);
    expect(component({ id: 'c', component: 'Chip', label: 'x', child: 'text' })).toBe(false);
    expect(component({ id: 'c', component: 'Chip', label: 'x', action: { event: { name: 'x' } } })).toBe(false);
  });

  test('leaves out a descriptor with agentExposed: false', () => {
    const hidden = defineDescriptor({
      name: 'HiddenFixture',
      tag: 'line-hidden-fixture',
      load: async () => undefined,
      description: 'A fixture that agents must not see.',
      props: { tone: z.enum(['a', 'b']).describe('A tone.').optional() },
      slots: {},
      bindings: { props: {} },
      actions: {},
      accessibility: { hostNaming: { kind: 'always' } },
      agentExposed: false,
      agentHiddenReason: 'It escapes the surface.',
    });
    const withHidden = lineCatalogDocument([...descriptors, hidden]);
    expect(Object.keys(withHidden.components as Json)).toEqual(LINE_COMPONENTS);
    expect(JSON.stringify(withHidden)).not.toContain('HiddenFixture');
    expect(withHidden).toEqual(document);
  });
});

describe('the inline projection (§6.G.2; plan §5.6 D2)', () => {
  const catalogDef = () => ajvWith(document).getSchema(`${clientCapabilities.$id}#/$defs/Catalog`);

  test('validates against client_capabilities.json#/$defs/Catalog, which the document form fails', () => {
    const validate = catalogDef();
    if (!validate) throw new Error('client_capabilities.json#/$defs/Catalog did not compile');
    const inline = inlineCatalog(document);
    expect({ valid: validate(inline), errors: validate.errors }).toEqual({ valid: true, errors: null });
    expect(inline.catalogId).toBe(LINE_CATALOG_ID);
    expect(Object.keys(inline.components ?? {})).toEqual(LINE_COMPONENTS);
    expect(validate(document)).toBe(false);
  });

  test('web_core reads the projection back with the same components', () => {
    const inline = inlineCatalog(document);
    const catalog = Catalog.fromJson(inline, '0.9');
    expect(catalog.id).toBe(LINE_CATALOG_ID);
    expect([...catalog.components.keys()]).toEqual(LINE_COMPONENTS);
    expect(Object.keys(catalog.validationSchema.$defs as Json)).toContain('anyComponent');
  });
});

describe('client capabilities (§6.G.2 Versions; §10 SD44, SD45)', () => {
  const validateCapabilities = (capabilities: unknown) => {
    const validate = ajvWith(document).getSchema(String(clientCapabilities.$id));
    if (!validate) throw new Error('client_capabilities.json did not compile');
    return { valid: validate(capabilities), errors: validate.errors };
  };

  test('advertise v0.9 and v0.9.1 with the line id and its inline projection, and no basic id by default', () => {
    const capabilities: CatalogJson = lineCapabilities(document);
    expect(validateCapabilities(capabilities)).toEqual({ valid: true, errors: null });
    expect(Object.keys(capabilities)).toEqual([...ADVERTISED_VERSIONS]);
    for (const version of ADVERTISED_VERSIONS) {
      expect(capabilities[version]).toEqual({
        supportedCatalogIds: [LINE_CATALOG_ID],
        inlineCatalogs: [inlineCatalog(document)],
      });
    }
  });

  test('list the v0_9 basic id only on opt-in, never inlined', () => {
    const capabilities = lineCapabilities(document, { basic: true });
    expect(validateCapabilities(capabilities)).toEqual({ valid: true, errors: null });
    for (const version of ADVERTISED_VERSIONS) {
      expect(capabilities[version].supportedCatalogIds).toEqual([LINE_CATALOG_ID, BASIC_CATALOG_ID]);
      expect(capabilities[version].inlineCatalogs.map((inline) => inline.catalogId)).toEqual([LINE_CATALOG_ID]);
    }
  });

  test('v0.9.1 alone fails the published schema, which requires v0.9 (R1 P10)', () => {
    const { 'v0.9.1': only } = lineCapabilities(document);
    expect(validateCapabilities({ 'v0.9.1': only }).valid).toBe(false);
  });
});

describe('the basic implementation map (§6.G.2; §10 SD43)', () => {
  test('a lookup by the v0_9 basic id returns the 10 Phase 1 types and no other', () => {
    const map = basicImplementations('https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json');
    if (!map) throw new Error('no map under the v0_9 basic id');
    expect(Object.keys(map).sort()).toEqual(
      ['AudioPlayer', 'Button', 'Column', 'Divider', 'Icon', 'Image', 'List', 'Row', 'Text', 'Video'].sort(),
    );
    for (const [name, implementation] of Object.entries(map)) expect(implementation.api.name).toBe(name);
  });

  test('answers to no other basic id', () => {
    expect(basicImplementations('https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json')).toBeUndefined();
    expect(basicImplementations('https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json')).toBeUndefined();
    expect(basicImplementations(LINE_CATALOG_ID)).toBeUndefined();
  });

  test('maps every Image variant to a native <img>, and each type to its ARCH §17.3 target', () => {
    const map = basicImplementations(BASIC_CATALOG_ID);
    if (!map) throw new Error('no map under the v0_9 basic id');
    expect(map.Image.target).toEqual({ kind: 'native', tag: 'img', url: 'image', attributes: {} });
    expect(map.Video.target).toEqual({ kind: 'native', tag: 'video', url: 'video', attributes: {} });
    expect(map.AudioPlayer.target).toEqual({
      kind: 'native',
      tag: 'audio',
      url: 'audio',
      attributes: { controls: '' },
    });
    expect(map.Text.target).toEqual({
      kind: 'text',
      tagByVariant: { h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', caption: 'small', body: 'p' },
      inButton: 'span',
    });
    expect(map.Icon.target).toEqual({ kind: 'component', descriptor: iconDescriptor, attributes: {} });
    expect(map.Divider.target).toEqual({ kind: 'component', descriptor: separatorDescriptor, attributes: {} });
    expect(map.Button.target).toEqual({
      kind: 'component',
      descriptor: buttonDescriptor,
      attributes: { type: 'button' },
    });
    expect(map.Row.target).toEqual({
      kind: 'component',
      descriptor: stackDescriptor,
      attributes: { orientation: 'horizontal' },
    });
    expect(map.Column.target).toEqual({
      kind: 'component',
      descriptor: stackDescriptor,
      attributes: { orientation: 'vertical' },
    });
    expect(map.List.target).toEqual({ kind: 'component', descriptor: stackDescriptor, attributes: { role: 'list' } });
  });

  test('is frozen and has a null prototype, so an agent type such as constructor is not a key', () => {
    const map = basicImplementations(BASIC_CATALOG_ID);
    expect(Object.getPrototypeOf(map)).toBeNull();
    expect(Object.isFrozen(map)).toBe(true);
    expect(Object.hasOwn(map ?? {}, 'constructor')).toBe(false);
    expect(Object.values(map ?? {}).every((entry) => Object.isFrozen(entry) && Object.isFrozen(entry.target))).toBe(
      true,
    );
  });
});
