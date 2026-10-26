/**
 * htmx harness — the shared Playwright helper of Phase 00 spec §6.F.4 (AM-063, AM-077).
 *
 * Each `expect…` function takes a Playwright `page` that has htmx loaded and the
 * component under test defined, plus an {@link HtmxFixture} that describes the
 * component. It mounts consumer markup into a harness section of the page and
 * proves one behaviour of PRD Appendix A:
 *
 *   (a) {@link expectFormValue} — the value reaches the request `<form hx-post>` sends;
 *   (b) {@link expectOneRequestPerCommit} — `hx-trigger="<commit event>"` sends one request per commit;
 *   (c) {@link expectNoRequestWithoutCommit} — an interaction that commits nothing sends no request;
 *   (d) {@link expectSlotSwap} — server content swapped into the host's slot renders and the component picks it up.
 *
 * `page.route` answers every harness request, so no extra server runs. Request
 * counts wait on htmx itself, so the harness reads a count only once every
 * request htmx started has finished. htmx starts a queued request in the same task that
 * finishes the previous one, so a settled count is final.
 *
 * The module lives in the private package `@websublime/line-testing`, which declares
 * `htmx2` and `htmx4`. A package whose tests import `@websublime/line-testing/htmx`
 * declares `@websublime/line-testing` as a devDependency (PRD §5.2 rule 4).
 *
 * @module @websublime/line-testing/htmx
 */

import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page, test } from 'playwright/test';

/** The htmx majors the harness runs on. htmx 2 sends XMLHttpRequest, htmx 4 sends fetch. */
export type HtmxMajor = 2 | 4;
export const HTMX_MAJORS: readonly HtmxMajor[] = [2, 4];

/** Marks a behaviour that does not apply to the component, with the reason. */
export interface NotApplicable {
  readonly na: string;
}

/** How the component's value reaches its form (behaviour (a)). */
export interface FormValueSpec {
  /** The `name` the harness gives the host; the value submits under it. */
  readonly name: string;
  /** The value commit `n` leaves in the form. */
  expected(commit: number): string;
}

/** The slot server content is swapped into (behaviour (d)). */
export interface SlotSpec {
  /** The slot name, or `null` for the default slot. */
  readonly name: string | null;
  /**
   * Asserts that the component noticed `assigned` elements in the slot. `assigned`
   * counts the children {@link HtmxFixture.content} put in the slot plus the swapped ones.
   */
  pickedUp(host: Locator, assigned: number): Promise<void>;
}

/** A component under test, as the harness sees it. */
export interface HtmxFixture {
  /** The custom-element tag. */
  readonly tag: `line-${string}`;
  /**
   * Host attributes the component needs. The harness sets `id`, `name` and the
   * `hx-*` attributes it tests, and those win over an entry here.
   */
  readonly attributes?: Readonly<Record<string, string>>;
  /** Light-DOM markup the host holds from the start, such as child items. */
  readonly content?: string;
  /** The commit event that ARCHITECTURE §17.2 rule C9 names. */
  readonly commitEvent: `line-${string}`;
  /** Performs commit number `n` (from 1) on the mounted host. */
  commit(host: Locator, n: number): Promise<void>;
  /** Performs an interaction that commits nothing on the mounted host. */
  nonCommit(host: Locator): Promise<void>;
  readonly formValue: FormValueSpec | NotApplicable;
  readonly slot: SlotSpec | NotApplicable;
}

/** One request the harness route answered. */
export interface HarnessRequest {
  readonly method: string;
  readonly path: string;
  readonly body: URLSearchParams;
  readonly resourceType: string;
}

/** Page-side counters, read in a later task than the one that changed them. */
interface Tracker {
  started: number;
  ended: number;
  xhr: number;
  fetch: number;
}

declare global {
  interface Window {
    htmx?: { readonly version: string; process(elt: Element): void };
    lineHtmxHarness?: Tracker;
  }
}

const ENDPOINT = '/htmx-harness/';
const SECTION = 'section[data-line-htmx-harness]';
const HOST_ID = 'line-htmx-harness-host';
const LOG_ID = 'line-htmx-harness-log';
const SLOTTED = ['First slotted item', 'Second slotted item'];

interface Server {
  readonly requests: HarnessRequest[];
}

const servers = new WeakMap<Page, Server>();

/** Answers `./vendor/htmx.js` on `page` with the given htmx major, resolved from this package's dependencies. */
export async function routeHtmx(page: Page, major: HtmxMajor): Promise<void> {
  const path = fileURLToPath(import.meta.resolve(`htmx${major}/dist/htmx.js`));
  await page.route('**/vendor/htmx.js', (route) => route.fulfill({ path }));
}

/** (a) The value of commit 1 reaches the request that `<form hx-post>` sends on submit. */
export async function expectFormValue(page: Page, fixture: HtmxFixture): Promise<void> {
  const spec = applicable(fixture.formValue, '(a)');
  const server = await mount(
    page,
    `<form ${attributes({ 'hx-post': `${ENDPOINT}form`, 'hx-target': `#${LOG_ID}`, 'hx-swap': 'beforeend' })}>
      ${host(fixture, { name: spec.name })}
      <button type="submit">Send</button>
    </form>
    <ul id="${LOG_ID}"></ul>`,
  );

  await fixture.commit(hostLocator(page), 1);
  expect(await settle(page), 'requests before the form submits').toBe(0);

  await page.locator(`${SECTION} form > button[type="submit"]`).click();
  expect(await settle(page), 'requests after the form submits').toBe(1);
  expect(server.requests.map(({ method, path }) => `${method} ${path}`)).toEqual([`POST ${ENDPOINT}form`]);
  expect(server.requests[0]?.body.getAll(spec.name)).toEqual([spec.expected(1)]);
}

/** (b) `hx-trigger="<commit event>"` on the host sends exactly one request per commit. */
export async function expectOneRequestPerCommit(page: Page, fixture: HtmxFixture, commits = 2): Promise<void> {
  const server = await mount(page, commitTriggerMarkup(fixture));

  for (let n = 1; n <= commits; n += 1) {
    await fixture.commit(hostLocator(page), n);
    expect(await settle(page), `requests after commit ${n}`).toBe(n);
  }
  expect(server.requests.map(({ path }) => path)).toEqual(Array(commits).fill(`${ENDPOINT}commit`));
  await expect(page.locator(`#${LOG_ID} > li`)).toHaveCount(commits);
}

/**
 * (c) The non-commit interaction sends no request through `hx-trigger="<commit event>"`.
 * One commit afterwards sends one request, which shows the trigger was live.
 */
export async function expectNoRequestWithoutCommit(page: Page, fixture: HtmxFixture): Promise<void> {
  const server = await mount(page, commitTriggerMarkup(fixture));

  await fixture.nonCommit(hostLocator(page));
  expect(await settle(page), 'requests after the non-commit interaction').toBe(0);
  expect(server.requests).toEqual([]);

  await fixture.commit(hostLocator(page), 1);
  expect(await settle(page), 'requests after one commit').toBe(1);
  expect(server.requests.map(({ path }) => path)).toEqual([`${ENDPOINT}commit`]);
}

/** (d) Server content swapped into the host's slot renders, and the component picks it up. */
export async function expectSlotSwap(page: Page, fixture: HtmxFixture): Promise<void> {
  const spec = applicable(fixture.slot, '(d)');
  const slot = spec.name === null ? {} : { slot: spec.name };
  const fragment = SLOTTED.map((text) => `<span ${attributes(slot)}>${text}</span>`).join('');
  await mount(
    page,
    `${host(fixture)}
    <button type="button" ${attributes({ 'hx-get': `${ENDPOINT}slot?fragment=${encodeURIComponent(fragment)}`, 'hx-target': `#${HOST_ID}`, 'hx-swap': 'beforeend' })}>Load</button>`,
  );

  const seeded = await hostLocator(page).evaluate(
    (element, name) => [...element.children].filter((child) => (child.getAttribute('slot') || null) === name).length,
    spec.name,
  );
  await page.locator(`${SECTION} > button`).click();
  expect(await settle(page), 'requests after the swap trigger').toBe(1);
  for (const text of SLOTTED) await expect(hostLocator(page).getByText(text, { exact: true })).toBeVisible();
  await spec.pickedUp(hostLocator(page), seeded + SLOTTED.length);
}

/** Proves that `page.route` answers htmx's transport: XMLHttpRequest on htmx 2, fetch on htmx 4. */
export async function expectRouteAnswers(page: Page, transport: 'xhr' | 'fetch'): Promise<void> {
  const server = await mount(
    page,
    `<button type="button" ${attributes({ 'hx-get': `${ENDPOINT}transport`, 'hx-target': `#${LOG_ID}`, 'hx-swap': 'beforeend' })}>Ping</button>
    <ul id="${LOG_ID}"></ul>`,
  );

  await page.locator(`${SECTION} > button`).click();
  expect(await settle(page), 'requests after the ping').toBe(1);
  expect(server.requests.map(({ path, resourceType }) => `${resourceType} ${path}`)).toEqual([
    `${transport} ${ENDPOINT}transport`,
  ]);
  const { xhr, fetch } = await tracker(page);
  expect({ xhr, fetch }, 'page-side transport calls').toEqual(
    transport === 'xhr' ? { xhr: 1, fetch: 0 } : { xhr: 0, fetch: 1 },
  );
  await expect(page.locator(`#${LOG_ID} > li`)).toHaveText(['1']);
}

/** Skips the running test with the reason when the behaviour does not apply. */
function applicable<T extends object>(spec: T | NotApplicable, behaviour: string): T {
  if ('na' in spec) {
    test.skip(true, `${behaviour} n/a — ${spec.na}`);
    throw new Error('unreachable: test.skip throws');
  }
  return spec;
}

function hostLocator(page: Page): Locator {
  return page.locator(`#${HOST_ID}`);
}

function host(fixture: HtmxFixture, extra: Record<string, string> = {}): string {
  const values = { ...fixture.attributes, id: HOST_ID, ...extra };
  return `<${fixture.tag} ${attributes(values)}>${fixture.content ?? ''}</${fixture.tag}>`;
}

function commitTriggerMarkup(fixture: HtmxFixture): string {
  return `${host(fixture, {
    'hx-post': `${ENDPOINT}commit`,
    'hx-trigger': fixture.commitEvent,
    'hx-target': `#${LOG_ID}`,
    'hx-swap': 'beforeend',
  })}
  <ul id="${LOG_ID}"></ul>`;
}

function attributes(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([name, value]) => `${name}="${value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`)
    .join(' ');
}

/** Routes harness requests once per page and records them. */
async function serve(page: Page): Promise<Server> {
  const existing = servers.get(page);
  if (existing) return existing;
  const server: Server = { requests: [] };
  servers.set(page, server);
  await page.route(
    (url) => url.pathname.startsWith(ENDPOINT),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      server.requests.push({
        method: request.method(),
        path: url.pathname,
        body: new URLSearchParams(request.postData() ?? ''),
        resourceType: request.resourceType(),
      });
      const body =
        url.pathname === `${ENDPOINT}slot`
          ? (url.searchParams.get('fragment') ?? '')
          : `<li>${server.requests.length}</li>`;
      await route.fulfill({ contentType: 'text/html', body });
    },
  );
  return server;
}

/**
 * Installs the page-side counters once per document. Runs in the page, so it
 * reads nothing from module scope.
 */
function installTracker(endpoint: string): void {
  if (window.lineHtmxHarness) return;
  const counts: Tracker = { started: 0, ended: 0, xhr: 0, fetch: 0 };
  window.lineHtmxHarness = counts;

  // htmx 2 and htmx 4 name the request lifecycle events differently.
  for (const name of ['htmx:beforeRequest', 'htmx:before:request']) {
    document.addEventListener(name, () => (counts.started += 1), true);
  }
  for (const name of ['htmx:afterRequest', 'htmx:finally:request']) {
    document.addEventListener(name, () => (counts.ended += 1), true);
  }

  const harnessed = new WeakSet<XMLHttpRequest>();
  const { open, send } = XMLHttpRequest.prototype;
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: Parameters<typeof open>) {
    if (String(args[1]).includes(endpoint)) harnessed.add(this);
    open.apply(this, args);
  } as typeof open;
  XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...args: Parameters<typeof send>) {
    if (harnessed.has(this)) counts.xhr += 1;
    send.apply(this, args);
  };
  const { fetch } = window;
  window.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.includes(endpoint)) counts.fetch += 1;
    return fetch(input, init);
  };
}

/** Replaces the harness section with `markup`, lets htmx process it and resets every count. */
async function mount(page: Page, markup: string): Promise<Server> {
  const server = await serve(page);
  await page.evaluate(installTracker, ENDPOINT);
  await page.evaluate(
    async ([html, section]) => {
      const { htmx } = window;
      if (!htmx) throw new Error('htmx is not loaded on this page');
      Object.assign(window.lineHtmxHarness as Tracker, { started: 0, ended: 0, xhr: 0, fetch: 0 });

      let root = document.querySelector(section);
      if (!root) {
        root = document.createElement('section');
        root.setAttribute('data-line-htmx-harness', '');
        document.body.append(root);
      }
      root.innerHTML = html;
      htmx.process(root);
      for (const element of root.querySelectorAll('*')) {
        const { updateComplete } = element as Element & { updateComplete?: Promise<unknown> };
        if (updateComplete) await updateComplete;
      }
    },
    [markup, SECTION] as const,
  );
  server.requests.length = 0;
  return server;
}

/** Reads the page-side counters one task after the caller's last action. */
function tracker(page: Page): Promise<Tracker> {
  return page.evaluate(
    () =>
      new Promise<Tracker>((resolve) => {
        setTimeout(() => resolve({ ...(window.lineHtmxHarness as Tracker) }));
      }),
  );
}

/** Waits until every request htmx started has finished, then returns how many htmx started. */
async function settle(page: Page): Promise<number> {
  let started = -1;
  await expect
    .poll(
      async () => {
        const counts = await tracker(page);
        started = counts.started;
        return counts.started === counts.ended;
      },
      { message: 'htmx finishes every request it started' },
    )
    .toBe(true);
  return started;
}
