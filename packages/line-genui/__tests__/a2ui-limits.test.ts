/**
 * The surface limits (Phase 1 spec §6.G.4 Limits, "Projection and messages"; §10 SD53, SD56; §12 AM-015, AM-016,
 * AM-075; ledger 01-G4).
 *
 * - `max-nodes`, `max-depth` and `max-data-model-size` are reflected by `maxNodes`, `maxDepth` and
 *   `maxDataModelSize`. Each takes a positive integer; any other value keeps the default and throws nothing.
 * - With a limit set below its default, a message the default accepts is rejected with `LIMIT_EXCEEDED`, and the
 *   rejected message applies nothing. Depth counts from the root; template children count as nodes.
 * - The data-model size is the UTF-8 byte length of `JSON.stringify(dataModel)` after the message (Miguel,
 *   2026-11-03).
 *
 * @module __tests__/a2ui-limits
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { DEFAULT_LIMITS, Session } from '../src/a2ui/index.js';
import { childrenFirst, dataModelSize, positiveInteger, utf8Length } from '../src/a2ui/limits.js';
import { BASIC_CATALOG_ID } from '../src/catalog/index.js';
import { components, create, data, invalidMessages, mount, text } from './a2ui-fixture.js';

afterEach(() => {
  expect(invalidMessages).toEqual([]);
});

describe('limit values (§6.G.4 Limits; MANIFESTO Law 9)', () => {
  test('a positive integer is taken; 0, a negative, a non-integer and text are not', () => {
    expect(['1', '42', ' 7 ', '+3'].map(positiveInteger)).toEqual([1, 42, 7, 3]);
    expect(['0', '-1', '1.5', '1e3', 'abc', '', '9007199254740993', null].map(positiveInteger)).toEqual(
      Array(8).fill(undefined),
    );
  });

  test('the properties reflect the attributes, and an invalid value keeps the default without a throw', () => {
    const { surface } = mount();
    expect([surface.maxNodes, surface.maxDepth, surface.maxDataModelSize]).toEqual([
      DEFAULT_LIMITS.maxNodes,
      DEFAULT_LIMITS.maxDepth,
      DEFAULT_LIMITS.maxDataModelSize,
    ]);
    surface.maxNodes = 10;
    surface.maxDepth = 3;
    surface.maxDataModelSize = 2048;
    expect(surface.getAttribute('max-nodes')).toBe('10');
    expect(surface.getAttribute('max-depth')).toBe('3');
    expect(surface.getAttribute('max-data-model-size')).toBe('2048');
    expect([surface.maxNodes, surface.maxDepth, surface.maxDataModelSize]).toEqual([10, 3, 2048]);
    for (const invalid of [0, -5, 1.5, Number.NaN]) {
      expect(() => {
        surface.maxNodes = invalid;
        surface.maxDepth = invalid;
        surface.maxDataModelSize = invalid;
      }).not.toThrow();
      expect([surface.maxNodes, surface.maxDepth, surface.maxDataModelSize]).toEqual([
        DEFAULT_LIMITS.maxNodes,
        DEFAULT_LIMITS.maxDepth,
        DEFAULT_LIMITS.maxDataModelSize,
      ]);
    }
    surface.setAttribute('max-depth', 'deep');
    expect(surface.maxDepth).toBe(DEFAULT_LIMITS.maxDepth);
  });

  test('the size unit is the UTF-8 byte length of JSON.stringify, as TextEncoder counts it', () => {
    const encoder = new TextEncoder();
    for (const sample of ['plain', 'é', 'ação', '日本語', '😀 ok', '\ud800 lone', 'x\udc00', '']) {
      expect(utf8Length(sample)).toBe(encoder.encode(sample).byteLength);
    }
    const model = { title: 'Olá 😀', items: [1, 2, { label: '日本' }] };
    expect(dataModelSize(model)).toBe(encoder.encode(JSON.stringify(model)).byteLength);
  });
});

/** A Column of `count` Text children. */
const column = (count: number) => [
  { id: 'root', component: 'Column', children: Array.from({ length: count }, (_, i) => `t${i}`) },
  ...Array.from({ length: count }, (_, i) => text(`t${i}`, `Item ${i}`)),
];

/** A chain of `depth` Columns ending in a Text, the root at depth 1. */
const chain = (depth: number) =>
  Array.from({ length: depth }, (_, i) =>
    i === depth - 1 ? text(`c${i}`, 'Deep') : { id: `c${i}`, component: 'Column', children: [`c${i + 1}`] },
  ).map((node, i) => (i === 0 ? { ...node, id: 'root' } : node));

describe('limit breaches (§6.G.4 Limits)', () => {
  test('the defaults are 1,000 nodes, depth 32 and 1,048,576 UTF-8 bytes (§12 AM-078)', async () => {
    expect(DEFAULT_LIMITS).toEqual({ maxNodes: 1_000, maxDepth: 32, maxDataModelSize: 1_048_576 });
    const room = 1_048_576 - dataModelSize({ blob: '' });
    const cases: [unknown, number, string | undefined][] = [
      [components(column(999)), 2, undefined],
      [components(column(1_000)), 1, 'maxNodes'],
      [components(chain(32)), 2, undefined],
      [components(chain(33)), 1, 'maxDepth'],
      [data('/blob', 'x'.repeat(room)), 2, undefined],
      [data('/blob', 'x'.repeat(room + 1)), 1, 'maxDataModelSize'],
    ];
    for (const [probe, applied, limit] of cases) {
      const { feed, errors, surface } = mount();
      expect(await feed(create(), probe as Parameters<typeof feed>[0])).toBe(applied);
      expect(errors.map((e) => e.error.limit)).toEqual(limit ? [limit] : []);
      surface.remove();
    }
  });

  test('a limit set above its default admits a message the default rejects', async () => {
    const room = 1_048_576 - dataModelSize({ blob: '' });
    const cases: [Record<string, string>, unknown][] = [
      [{ 'max-nodes': '2000' }, components(column(1_000))],
      [{ 'max-depth': '40' }, components(chain(33))],
      [{ 'max-data-model-size': '2000000' }, data('/blob', 'x'.repeat(room + 1))],
    ];
    for (const [attributes, probe] of cases) {
      const { feed, errors, surface } = mount(attributes);
      expect(await feed(create(), probe as Parameters<typeof feed>[0])).toBe(2);
      expect(errors).toEqual([]);
      surface.remove();
    }
  });

  test('with two surfaces on one surface id, the strictest limit wins', async () => {
    const { feed, errors, session, surface } = mount({ 'max-nodes': '2000' });
    const second = document.createElement('line-a2ui-surface');
    second.setAttribute('surface-id', 'main');
    second.setAttribute('max-nodes', '10');
    document.body.append(second);
    second.session = session;
    expect(await feed(create(), components(column(10)))).toBe(1);
    expect(errors.map((e) => e.error.max)).toEqual([10]);
    second.remove();
    surface.remove();
  });

  test('the default accepts each probe message', async () => {
    for (const probe of [components(column(6)), components(chain(6)), data('/blob', 'x'.repeat(4000))]) {
      const { feed, errors, surface } = mount();
      expect(await feed(create(), probe)).toBe(2);
      expect(errors).toEqual([]);
      surface.remove();
    }
  });

  test('max-nodes below the default rejects a message the default accepts, and nothing applies', async () => {
    const { feed, errors, surface } = mount({ 'max-nodes': '5' });
    expect(await feed(create(), components(column(4)))).toBe(2);
    expect(surface.querySelectorAll('p')).toHaveLength(4);
    expect(await feed(components(column(5)))).toBe(0);
    expect(errors).toEqual([
      {
        version: 'v0.9.1',
        error: {
          code: 'LIMIT_EXCEEDED',
          surfaceId: 'main',
          message: expect.any(String),
          limit: 'maxNodes',
          value: 6,
          max: 5,
        },
      },
    ]);
    expect(surface.querySelectorAll('p')).toHaveLength(4);
  });

  test('max-nodes counts component definitions that hang from no root', async () => {
    const { feed, errors } = mount({ 'max-nodes': '3' });
    expect(await feed(create(), components([text('a', 'a'), text('b', 'b'), text('c', 'c'), text('d', 'd')]))).toBe(1);
    expect(errors.map((e) => [e.error.code, e.error.limit, e.error.value])).toEqual([
      ['LIMIT_EXCEEDED', 'maxNodes', 4],
    ]);
  });

  test('max-nodes counts template children, so a data update that grows a List past it is rejected', async () => {
    const { feed, errors, surface } = mount({ 'max-nodes': '6' });
    await feed(
      create(),
      components([
        { id: 'root', component: 'List', children: { componentId: 'item', path: '/items' } },
        text('item', { path: 'label' }),
      ]),
      data('/items', [{ label: 'a' }, { label: 'b' }]),
    );
    expect(surface.querySelectorAll('p')).toHaveLength(2);
    expect(
      await feed(
        data(
          '/items',
          Array.from({ length: 6 }, (_, i) => ({ label: `${i}` })),
        ),
      ),
    ).toBe(0);
    expect(errors.map((e) => [e.error.code, e.error.limit])).toEqual([['LIMIT_EXCEEDED', 'maxNodes']]);
    expect(surface.querySelectorAll('p')).toHaveLength(2);
  });

  test('max-depth below the default rejects a message the default accepts, counting from the root', async () => {
    const { feed, errors, surface } = mount({ 'max-depth': '4' });
    expect(await feed(create(), components(chain(4)))).toBe(2);
    expect(surface.textContent).toBe('Deep');
    expect(await feed(components([{ id: 'c3', component: 'Column', children: ['c4'] }, text('c4', 'Deeper')]))).toBe(0);
    expect(errors.map((e) => [e.error.code, e.error.limit, e.error.value, e.error.max])).toEqual([
      ['LIMIT_EXCEEDED', 'maxDepth', 5, 4],
    ]);
    expect(surface.textContent).toBe('Deep');
  });

  test('max-data-model-size below the default rejects a message the default accepts, and nothing applies', async () => {
    const { feed, errors, session, surface } = mount({ 'max-data-model-size': '64' });
    await feed(create(), components([text('root', { path: '/msg' })]), data('/msg', 'short'));
    expect(surface.textContent).toBe('short');
    expect(await feed(data('/msg', 'é'.repeat(40)))).toBe(0);
    expect(errors.map((e) => [e.error.code, e.error.limit, e.error.value, e.error.max])).toEqual([
      ['LIMIT_EXCEEDED', 'maxDataModelSize', dataModelSize({ msg: 'é'.repeat(40) }), 64],
    ]);
    expect(surface.textContent).toBe('short');
    expect(session.dataModel('main')).toBeUndefined();
  });
});

describe('message shapes (§6.G.4 Projection and messages; §12 AM-082, AM-083)', () => {
  const big = 'x'.repeat(200);
  const codes = (errors: { error: { code: string; limit?: unknown } }[]) =>
    errors.map((e) => `${e.error.code}${e.error.limit ? `:${String(e.error.limit)}` : ''}`);

  test('each v0.9 message of an array element gets its own limit check and its own call', async () => {
    const { surface, errors } = mount({ 'max-nodes': '3' });
    const applied = await surface.feed([
      create(),
      [components(column(5)), components([text('root', { path: '/msg' })]), data('/msg', 'kept')],
    ]);
    expect(applied).toBe(3);
    expect(codes(errors)).toEqual(['LIMIT_EXCEEDED:maxNodes']);
    expect(surface.textContent).toBe('kept');
  });

  test('each v0.9 message of a { messages } wrapper gets its own limit check and its own call', async () => {
    const { surface, errors } = mount({ 'max-depth': '3' });
    const applied = await surface.feed([
      create(),
      { version: 'v0.9.1', messages: [components(chain(4)), components([text('root', 'kept')])] },
    ]);
    expect(applied).toBe(2);
    expect(codes(errors)).toEqual(['LIMIT_EXCEEDED:maxDepth']);
    expect(surface.textContent).toBe('kept');
  });

  const rejected: [string, unknown][] = [
    ['an internal operation', { type: 'updateDataModel', surfaceId: 'main', path: '/blob', value: big }],
    [
      'a v0.8 surfaceUpdate',
      {
        surfaceUpdate: {
          surfaceId: 'main',
          components: [{ id: 'root', component: { Text: { text: { literalString: 'v0.8' } } } }],
        },
      },
    ],
    [
      'a v0.8 dataModelUpdate with two contents entries',
      {
        dataModelUpdate: {
          surfaceId: 'main',
          path: '/',
          contents: [
            { key: 'msg', valueString: 'first' },
            { key: 'blob', valueString: big },
          ],
        },
      },
    ],
    [
      'an internal createSurface with an array dataModel',
      { type: 'createSurface', surfaceId: 'main', catalogId: BASIC_CATALOG_ID, dataModel: ['x'.repeat(5_000)] },
    ],
  ];
  for (const [name, message] of rejected) {
    test(`${name} applies nothing and raises one UNSUPPORTED_MESSAGE`, async () => {
      const { surface, errors, session } = mount({ 'max-data-model-size': '64' });
      await surface.feed([create(), components([text('root', { path: '/msg' })]), data('/msg', 'before')]);
      const surfaces: string[] = [];
      session.onSurface((model) => surfaces.push(model.id));
      expect(await surface.feed([message as Record<string, unknown>])).toBe(0);
      expect(errors.map((e) => [e.error.code, e.error.surfaceId])).toEqual([['UNSUPPORTED_MESSAGE', 'main']]);
      expect(surface.textContent).toBe('before');
      expect(surfaces).toEqual(['main']);
    });
  }

  const strict: [string, Record<string, string>, unknown][] = [
    [
      'a v0.9.1 element with an internal-operation type (probe A)',
      { 'max-data-model-size': '64' },
      { version: 'v0.9.1', type: 'updateDataModel', surfaceId: 'main', path: '/blob', value: 'x'.repeat(500) },
    ],
    [
      'a v0.9.1 createSurface operation with inline components (probe B)',
      { 'max-nodes': '3' },
      {
        version: 'v0.9.1',
        type: 'createSurface',
        surfaceId: 'main',
        catalogId: BASIC_CATALOG_ID,
        components: column(20),
      },
    ],
    [
      'a decoy with a type beside a small updateDataModel body',
      { 'max-data-model-size': '64' },
      {
        version: 'v0.9.1',
        type: 'updateDataModel',
        surfaceId: 'main',
        path: '/blob',
        value: 'x'.repeat(500),
        updateDataModel: { surfaceId: 'main', path: '/msg', value: 'small' },
      },
    ],
    ['a v0.9.1 element with no action key', {}, { version: 'v0.9.1' }],
    [
      'a v0.9.1 element with two action keys',
      {},
      {
        version: 'v0.9.1',
        updateDataModel: { surfaceId: 'main', path: '/msg', value: 'a' },
        deleteSurface: { surfaceId: 'main' },
      },
    ],
  ];
  for (const [name, attributes, message] of strict) {
    test(`${name} applies nothing and raises one UNSUPPORTED_MESSAGE (§12 AM-084)`, async () => {
      const { surface, errors } = mount(attributes);
      await surface.feed([create(), components([text('root', { path: '/msg' })]), data('/msg', 'before')]);
      expect(await surface.feed([message as Record<string, unknown>])).toBe(0);
      expect(codes(errors)).toEqual(['UNSUPPORTED_MESSAGE']);
      expect(surface.textContent).toBe('before');
      expect(surface.querySelectorAll('p')).toHaveLength(1);
    });
  }

  test('an inherited top-level surfaceId cannot steer the limit check off the surface the body names (probe D)', async () => {
    const { surface, errors } = mount({ 'max-data-model-size': '64' });
    await surface.feed([create(), components([text('root', { path: '/msg' })]), data('/msg', 'before')]);
    const probe = Object.assign(Object.create({ surfaceId: 'other' }) as Record<string, unknown>, {
      version: 'v0.9.1',
      updateDataModel: { surfaceId: 'main', path: '/blob', value: 'x'.repeat(500) },
    });
    expect(await surface.feed([probe])).toBe(0);
    expect(errors.map((e) => [e.error.code, e.error.surfaceId, e.error.limit])).toEqual([
      ['LIMIT_EXCEEDED', 'main', 'maxDataModelSize'],
    ]);
    expect(surface.textContent).toBe('before');
  });

  test('a web_core error on an envelope with a top-level surfaceId goes to the surface the body names (probe E)', async () => {
    const { surface, errors } = mount();
    await surface.feed([create(), components([text('root', { path: '/msg' })]), data('/msg', 'before')]);
    expect(await surface.feed([{ ...data('/msg', 'after'), surfaceId: 'other' }])).toBe(0);
    expect(errors.map((e) => [e.error.code, e.error.surfaceId])).toEqual([['VALIDATION_ERROR', 'main']]);
    expect(surface.textContent).toBe('before');
  });

  test('an inherited type or action key neither rejects nor admits an element (§12 AM-084)', async () => {
    const { surface, errors } = mount();
    await surface.feed([create(), components([text('root', { path: '/msg' })])]);
    const proto = { type: 'updateDataModel', deleteSurface: { surfaceId: 'main' } };
    const inherited = Object.assign(Object.create(proto) as Record<string, unknown>, data('/msg', 'own'));
    expect(await surface.feed([inherited])).toBe(1);
    expect(errors).toEqual([]);
    expect(surface.textContent).toBe('own');
  });

  test('a v0.9.1 envelope with one action key and an unknown extra key keeps VALIDATION_ERROR', async () => {
    const { surface, errors } = mount();
    await surface.feed([create(), components([text('root', { path: '/msg' })]), data('/msg', 'before')]);
    expect(await surface.feed([{ ...data('/msg', 'after'), extra: true }])).toBe(0);
    expect(codes(errors)).toEqual(['VALIDATION_ERROR']);
    expect(surface.textContent).toBe('before');
  });

  test('[v0.9 ok, v0.8, v0.9 ok] applies the first and third and raises one error', async () => {
    const { surface, errors } = mount();
    await surface.feed([create(), components([text('root', { path: '/msg' })])]);
    const applied = await surface.feed([
      data('/msg', 'first'),
      { dataModelUpdate: { surfaceId: 'main', path: '/', contents: [{ key: 'msg', valueString: 'v0.8' }] } },
      data('/msg', 'third'),
    ]);
    expect(applied).toBe(2);
    expect(codes(errors)).toEqual(['UNSUPPORTED_MESSAGE']);
    expect(surface.textContent).toBe('third');
  });

  test('a wrapper of mixed shapes applies each v0.9 envelope and rejects each other element on its own', async () => {
    const { surface, errors } = mount();
    await surface.feed([create(), components([text('root', { path: '/msg' })])]);
    const applied = await surface.feed([
      {
        version: 'v0.9.1',
        messages: [
          data('/msg', 'first'),
          { type: 'updateDataModel', surfaceId: 'main', path: '/msg', value: 'internal' },
          [data('/msg', 'nested')],
          { version: 'v0.8', updateDataModel: { surfaceId: 'main', path: '/msg', value: 'v0.8' } },
          data('/msg', 'last'),
        ],
      },
    ]);
    expect(applied).toBe(2);
    expect(codes(errors)).toEqual(['UNSUPPORTED_MESSAGE', 'UNSUPPORTED_MESSAGE', 'UNSUPPORTED_MESSAGE']);
    expect(surface.textContent).toBe('last');
  });
});

describe('apply order (§6.G.4 Projection and messages)', () => {
  /** A surface model of a fresh session, created on the basic catalog. */
  function surfaceModel(): Parameters<typeof childrenFirst>[1] {
    const session = new Session();
    const models: Parameters<typeof childrenFirst>[1][] = [];
    session.onSurface((surface) => models.push(surface));
    session.process([create()], 'main');
    const model = models[0];
    if (!model) throw new Error('no surface model');
    return model;
  }

  test('childrenFirst puts each component after the components of the body it references', () => {
    const body = [
      { id: 'root', component: 'Column', children: ['row', 'list'] },
      { id: 'row', component: 'Row', children: ['a', 'b'] },
      { id: 'list', component: 'List', children: { componentId: 'item', path: '/items' } },
      text('a', 'A'),
      text('b', 'B'),
      text('item', { path: 'label' }),
    ];
    const order = childrenFirst(body, surfaceModel()).map((component) => (component as { id: string }).id);
    expect(order.toSorted()).toEqual(body.map((component) => component.id).toSorted());
    const before = (child: string, parent: string) => order.indexOf(child) < order.indexOf(parent);
    expect([before('a', 'row'), before('b', 'row'), before('item', 'list'), before('row', 'root')]).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  test('childrenFirst leaves a body with a duplicate id as it is, for web_core to reject', () => {
    const body = [text('a', '1'), text('a', '2')];
    expect(childrenFirst(body, surfaceModel())).toBe(body);
  });
});
