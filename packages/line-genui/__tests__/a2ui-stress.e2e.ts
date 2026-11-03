/**
 * G4 stress test of the surface limits (Phase 1 spec §6.G.4 Limits; §10 SD56; ledger 01-G4).
 *
 * Measures, in chromium, firefox and webkit on `storybook-static`, what one A2UI message costs as it grows along
 * each limit, so the finite defaults of `max-nodes`, `max-depth` and `max-data-model-size` can be set from data:
 *
 * - nodes: one `updateComponents` that adds a Column of N Text children, and one `updateDataModel` that grows a
 *   template List to N items; then a one-node update on that N-node surface, which pays the limit walk;
 * - depth: one `updateComponents` with a chain of D nested Columns;
 * - data-model size: one `updateDataModel` of S UTF-8 bytes, then a one-field update on that S-byte model, which
 *   pays the size measure.
 *
 * Each row records `process` (the synchronous `Session.process` call: the limit check and `web_core`), `settle`
 * (from the call until `feed()` resolves: projection, component loads and `aria-busy` cleared) and whether the
 * message applied. The surface runs with each limit set far past its default, and a row that records
 * `LIMIT_EXCEEDED` fails the run, so every row measures the work and not a limit's rejection.
 *
 * Besides that guard it asserts nothing; it runs only with `LINE_A2UI_STRESS=1` and prints one JSON report per engine,
 * also attached to the test result.
 *
 * @module __tests__/a2ui-stress.e2e
 */

import { expect, type Page, test } from 'playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4320' });
test.skip(!process.env.LINE_A2UI_STRESS, 'The G4 stress test runs only with LINE_A2UI_STRESS=1.');
test.setTimeout(1_800_000);

/** A series stops after a message that takes longer than this, well past any default worth considering. */
const STOP_AFTER_MS = 10_000;

const NODES = [250, 500, 1_000, 2_000, 4_000, 8_000, 16_000];
const DEPTHS = [16, 32, 64, 128, 256, 512, 1_024, 2_048];
const SIZES = [64 * 1024, 256 * 1024, 1024 * 1024, 4 * 1024 * 1024, 16 * 1024 * 1024];

interface Row {
  case: string;
  n: number;
  process: number;
  settle: number;
  /** How long building the starting surface took, for the cases that measure an update on a large surface. */
  setup: number;
  applied: number;
  errors: string[];
}

/** Opens the Basic story and installs a measuring harness on a fresh surface. */
async function harness(page: Page): Promise<void> {
  await page.goto('/iframe.html?id=agent-ui-a2ui-surface--basic&viewMode=story');
  await page.waitForFunction(() => document.querySelector('line-a2ui-surface')?.querySelector('line-button'));
  await page.evaluate(() => {
    type Surface = HTMLElement & {
      session: { constructor: new () => Session } | undefined;
      settled(): Promise<void>;
    };
    interface Session {
      process(messages: unknown[], fallback: string): number;
    }
    const story = document.querySelector('line-a2ui-surface') as Surface;
    const SessionClass = story.session?.constructor as new () => Session;
    const stress = {
      async run(caseName: string, n: number, setup: unknown[], measured: unknown[]) {
        const surface = document.createElement('line-a2ui-surface') as Surface;
        surface.setAttribute('surface-id', 's');
        for (const limit of ['max-nodes', 'max-depth', 'max-data-model-size'])
          surface.setAttribute(limit, '1000000000');
        const errors: string[] = [];
        surface.addEventListener('line-a2ui-error', (event) => {
          const { error } = (event as CustomEvent<{ error: { code: string; message: string } }>).detail;
          errors.push(`${error.code}: ${error.message.slice(0, 120)}`);
        });
        document.querySelector('#storybook-root')?.replaceChildren(surface);
        const session = new SessionClass();
        (surface as unknown as { session: Session }).session = session;
        const before = performance.now();
        if (setup.length > 0) {
          session.process(setup, 's');
          await surface.settled();
        }
        const setupTime = performance.now() - before;
        errors.length = 0;
        const start = performance.now();
        const applied = session.process(measured, 's');
        const processed = performance.now();
        await surface.settled();
        const settled = performance.now();
        return {
          case: caseName,
          n,
          process: processed - start,
          settle: settled - start,
          setup: setupTime,
          applied,
          errors,
        };
      },
    };
    Object.assign(window, { stress });
  });
}

/** Runs one case in the page. */
function run(page: Page, name: string, n: number, setup: unknown[], measured: unknown[]): Promise<Row> {
  return page.evaluate(
    ({ name, n, setup, measured }) =>
      (
        window as unknown as {
          stress: { run(c: string, n: number, s: unknown[], m: unknown[]): Promise<Row> };
        }
      ).stress.run(name, n, setup, measured),
    { name, n, setup, measured },
  );
}

const V = 'v0.9.1';
const BASIC = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';
const create = { version: V, createSurface: { surfaceId: 's', catalogId: BASIC } };
const components = (list: unknown[]) => ({ version: V, updateComponents: { surfaceId: 's', components: list } });
const data = (path: string, value: unknown) => ({ version: V, updateDataModel: { surfaceId: 's', path, value } });
const text = (id: string, value: unknown) => ({ id, component: 'Text', text: value });

const column = (n: number) => [
  { id: 'root', component: 'Column', children: Array.from({ length: n }, (_, i) => `t${i}`) },
  ...Array.from({ length: n }, (_, i) => text(`t${i}`, `Item ${i}`)),
];
const list = [
  { id: 'root', component: 'List', children: { componentId: 'item', path: '/items' } },
  text('item', { path: 'label' }),
];
const items = (n: number) => Array.from({ length: n }, (_, i) => ({ label: `Item ${i}` }));
const chain = (d: number) =>
  Array.from({ length: d }, (_, i) =>
    i === d - 1
      ? text(`c${i}`, 'Deep')
      : { id: i === 0 ? 'root' : `c${i}`, component: 'Column', children: [`c${i + 1}`] },
  );
/** A data value whose JSON text is about `bytes` long: 64-character ASCII strings in an array. */
const blob = (bytes: number) => Array.from({ length: Math.ceil(bytes / 67) }, (_, i) => `${i}`.padEnd(64, 'x'));

test('surface limits stress', async ({ page, browserName }, testInfo) => {
  const rows: Row[] = [];
  await harness(page);
  const series: { name: string; sizes: number[]; setup(n: number): unknown[]; measured(n: number): unknown[] }[] = [
    {
      name: 'nodes: Column of N Text in one message',
      sizes: NODES,
      setup: () => [create],
      measured: (n) => [components(column(n))],
    },
    {
      name: 'nodes: template List grown to N items',
      sizes: NODES,
      setup: () => [create, components(list)],
      measured: (n) => [data('/items', items(n))],
    },
    {
      name: 'nodes: one-node update on an N-node surface',
      sizes: NODES,
      setup: (n) => [create, components(column(n))],
      measured: () => [components([text('t0', 'Changed')])],
    },
    {
      name: 'depth: chain of D Columns in one message',
      sizes: DEPTHS,
      setup: () => [create],
      measured: (d) => [components(chain(d))],
    },
    {
      name: 'data: one message of S bytes',
      sizes: SIZES,
      setup: () => [create, components([text('root', { path: '/title' })])],
      measured: (s) => [data('/blob', blob(s))],
    },
    {
      name: 'data: one-field update on an S-byte model',
      sizes: SIZES,
      setup: (s) => [create, components([text('root', { path: '/title' })]), data('/blob', blob(s))],
      measured: () => [data('/title', 'Changed')],
    },
  ];
  for (const { name, sizes, setup, measured } of series) {
    for (const n of sizes) {
      const row = await run(page, name, n, setup(n), measured(n));
      rows.push(row);
      expect(
        row.errors.filter((error) => error.startsWith('LIMIT_EXCEEDED')),
        `${name} at ${n}`,
      ).toEqual([]);
      console.info(JSON.stringify({ browser: browserName, ...row }));
      // A series stops once one message takes longer than any default could allow.
      if (row.settle > STOP_AFTER_MS || row.setup > STOP_AFTER_MS) break;
    }
  }
  const report = { browser: browserName, version: page.context().browser()?.version(), rows };
  console.info(JSON.stringify(report));
  await testInfo.attach(`a2ui-stress-${browserName}.json`, {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
});
