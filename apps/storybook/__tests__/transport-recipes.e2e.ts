/**
 * The transport recipes in the browser tier (Phase 1 spec §6.G.7 Acceptance; §10 SD59, SD64–SD67; §12 AM-006,
 * AM-040, AM-041, AM-088; ledger 01-G7), on the `storybook-static` that `bun run build` produces, in Chromium,
 * Firefox and WebKit.
 *
 * - Storybook holds one recipe per transport, and each renders C1–C4 (Button, Icon, Separator, Stack) through
 *   `<line-a2ui-surface>`, the A2A recipe from an array DataPart and from single-message DataParts.
 * - AG-UI: `building` and `retrying` show the recipe status line and leave `aria-busy` to the surface, `failed`
 *   sets `inert` on the surface host, and the next operations snapshot clears both. An action goes out as
 *   `forwardedProps.a2uiAction`; `line-a2ui-error` stays local.
 * - A Button action leaves the A2A, MCP and SSE recipes as an `[action]` `application/a2ui+json` DataPart with
 *   the capabilities in the message metadata, a `tools/call` of `a2ui_action` with `_meta.a2ui`, and a POST.
 * - A `line-a2ui-error` leaves them as an `[error]` `application/a2ui+json` DataPart, a `tools/call` of
 *   `a2ui_error`, and a POST of the `error` message as JSON.
 *
 * @module apps/storybook/__tests__/transport-recipes.e2e
 */

import { expect, type Locator, type Page, test } from 'playwright/test';
import { BASIC_CATALOG_ID, LINE_CATALOG_ID } from '../stories/agent-ui/a2ui-fixtures.js';

test.use({ baseURL: 'http://127.0.0.1:4320' });

/** The capabilities every recipe sends (`recipe-kit.ts`). */
const CAPABILITIES = { 'v0.9': { supportedCatalogIds: [LINE_CATALOG_ID, BASIC_CATALOG_ID] } };

/** One wire-log entry of a recipe. */
interface WireEntry {
  direction: string;
  channel: string;
  payload: unknown;
}

type Json = Record<string, unknown>;

/** Collects console errors and uncaught exceptions for the life of the page. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

/** Opens a story in the preview iframe and returns its surface. */
async function open(page: Page, id: string, args = ''): Promise<Locator> {
  await page.goto(`/iframe.html?id=${id}&viewMode=story${args ? `&args=${args}` : ''}`);
  await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
  const surface = page.locator('#storybook-root line-a2ui-surface');
  await expect(surface).toBeAttached();
  return surface;
}

/** Every wire-log entry so far, with its JSON payload parsed. */
async function wire(page: Page): Promise<WireEntry[]> {
  return page.locator('[data-wire-log] > li').evaluateAll((items) =>
    items.map((item) => {
      const text = item.querySelector('pre')?.textContent ?? '';
      let payload: unknown = text;
      try {
        payload = JSON.parse(text);
      } catch {
        // A raw string payload.
      }
      return {
        direction: item.getAttribute('data-direction') ?? '',
        channel: item.getAttribute('data-channel') ?? '',
        payload,
      };
    }),
  );
}

/** Waits for the first wire-log entry that `match` accepts and returns its payload. */
async function waitForWire(page: Page, match: (entry: WireEntry) => boolean): Promise<Json> {
  let found: WireEntry | undefined;
  await expect
    .poll(async () => {
      found = (await wire(page)).find(match);
      return found !== undefined;
    })
    .toBe(true);
  return found?.payload as Json;
}

/** The surface shows C1–C4 from the inbox stream: Stack (Column, Row), Separator (Divider), Icon and Button. */
async function expectInbox(surface: Locator, title = 'Inbox'): Promise<void> {
  await expect(surface.getByRole('heading', { level: 2 })).toHaveText(title);
  await expect(surface.locator('line-stack')).toHaveCount(2);
  await expect(surface.locator('line-separator')).toHaveCount(2);
  await expect(surface.locator('line-icon')).toHaveCount(1);
  await expect(surface.locator('line-button')).toHaveCount(2);
  await expect(surface.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect(surface.getByRole('button', { name: 'Like' })).toBeVisible();
  await expect(surface).not.toHaveAttribute('aria-busy', /.*/);
}

/** The A2UI `action` body the Save button raises. */
const SAVE_ACTION = {
  name: 'save',
  surfaceId: 'main',
  sourceComponentId: 'save',
  timestamp: expect.any(String),
  context: { title: 'Inbox' },
};

/** The A2UI `error` body a v0.8 envelope raises. */
const V08_ERROR = { code: 'UNSUPPORTED_MESSAGE', surfaceId: 'main', message: expect.any(String) };

const RECIPES = {
  'AG-UI': ['recipes-ag-ui--building', 'pace:0'],
  'A2A, array DataPart': ['recipes-a2a--array-data-part', ''],
  'A2A, single-message DataParts': ['recipes-a2a--single-message-data-parts', ''],
  MCP: ['recipes-mcp--tool-result', ''],
  SSE: ['recipes-sse--event-stream', ''],
} as const;

test.describe('every recipe renders C1–C4 through <line-a2ui-surface>', () => {
  for (const [name, [id, args]] of Object.entries(RECIPES)) {
    test(name, async ({ page }) => {
      const errors = watchErrors(page);
      const surface = await open(page, id, args);
      await expectInbox(surface);
      expect(errors, 'console errors and uncaught exceptions').toEqual([]);
    });
  }
});

test.describe('A2A DataParts', () => {
  test('the array story answers one application/a2ui+json DataPart holding every message', async ({ page }) => {
    await open(page, 'recipes-a2a--array-data-part');
    const reply = await waitForWire(page, (entry) => entry.channel === 'JSON-RPC SendMessage result');
    const parts = ((reply.result as Json).message as Json).parts as Json[];
    expect(parts).toHaveLength(1);
    expect(parts[0]?.metadata).toEqual({ mimeType: 'application/a2ui+json' });
    expect(parts[0]?.data).toHaveLength(3);
  });

  test('the single-message story answers one application/json+a2ui DataPart per message', async ({ page }) => {
    await open(page, 'recipes-a2a--single-message-data-parts');
    const reply = await waitForWire(page, (entry) => entry.channel === 'JSON-RPC SendMessage result');
    const parts = ((reply.result as Json).message as Json).parts as Json[];
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(part.metadata).toEqual({ mimeType: 'application/json+a2ui' });
      expect(Array.isArray(part.data)).toBe(false);
      expect(part.data).toMatchObject({ version: 'v0.9' });
    }
  });
});

test.describe('AG-UI lifecycle mapping (§10 SD59; §12 AM-006)', () => {
  /** Opens the manual story, records each `aria-busy` value the surface takes, and returns the controls. */
  async function lifecycle(page: Page, story: string) {
    const surface = await open(page, `recipes-ag-ui--${story}`, 'step:manual');
    await surface.evaluate((element) => {
      const values: (string | null)[] = [];
      Reflect.set(window, '__ariaBusy', values);
      new MutationObserver(() => values.push(element.getAttribute('aria-busy'))).observe(element, {
        attributes: true,
        attributeFilter: ['aria-busy'],
      });
    });
    const status = page.locator('[data-recipe-status]');
    const next = page.getByRole('button', { name: 'Next event' });
    const busyValues = () => page.evaluate(() => Reflect.get(window, '__ariaBusy') as (string | null)[]);
    return { surface, status, next, busyValues };
  }

  test('building shows the status line, leaves aria-busy to the surface, and the operations clear it', async ({
    page,
  }) => {
    const { surface, status, next, busyValues } = await lifecycle(page, 'building');
    await next.click();
    await expect(status).toBeVisible();
    await expect(status).toHaveText(/Building the interface/);
    await expect(surface).not.toHaveAttribute('aria-busy', /.*/);
    expect(await busyValues()).toEqual([]);

    await next.click();
    await expect(status).toBeHidden();
    await expect(surface.locator('line-button')).toHaveCount(2);
    await next.click();
    await expectInbox(surface);
    // The surface set and cleared aria-busy around each batch; the recipe never wrote it.
    const values = await busyValues();
    expect(values).toContain('true');
    expect(values.at(-1)).toBeNull();
  });

  test('retrying shows the status line with the attempt, and the operations clear it', async ({ page }) => {
    const { surface, status, next, busyValues } = await lifecycle(page, 'retrying');
    await next.click();
    await expect(status).toHaveText(/Building the interface/);
    await next.click();
    await expect(status).toHaveText('Retrying the interface (attempt 2 of 3)…');
    await expect(surface).not.toHaveAttribute('aria-busy', /.*/);
    expect(await busyValues()).toEqual([]);
    await next.click();
    await expect(status).toBeHidden();
    await next.click();
    await expectInbox(surface);
  });

  test('failed sets inert on the surface host, and the next operations snapshot removes it', async ({ page }) => {
    const { surface, status, next } = await lifecycle(page, 'failed');
    await next.click();
    await expect(status).toBeVisible();
    await next.click();
    await expect(surface).toHaveAttribute('inert', '');
    await expect(status).toBeHidden();
    await expect(surface).not.toHaveAttribute('aria-busy', /.*/);
    await next.click();
    await expect(surface).not.toHaveAttribute('inert', /.*/);
    await expect(status).toBeHidden();
    await next.click();
    await expectInbox(surface);
  });
});

test.describe('a Button action leaves through the transport', () => {
  test('AG-UI: forwardedProps.a2uiAction on the next run', async ({ page }) => {
    const surface = await open(page, 'recipes-ag-ui--building', 'pace:0');
    await expectInbox(surface);
    await surface.getByRole('button', { name: 'Save' }).click();
    const sent = await waitForWire(page, (entry) => entry.direction === 'out' && entry.channel.startsWith('action'));
    expect(sent).toEqual({ a2uiAction: { userAction: SAVE_ACTION } });
    const received = await waitForWire(
      page,
      (entry) => entry.direction === 'in' && JSON.stringify(entry.payload).includes('a2uiAction'),
    );
    expect(received).toEqual({ a2uiAction: { userAction: SAVE_ACTION } });
    await expectInbox(surface, 'Inbox: save received');
  });

  test('A2A: an [action] application/a2ui+json DataPart with the capabilities in the message metadata', async ({
    page,
  }) => {
    const surface = await open(page, 'recipes-a2a--array-data-part');
    await expectInbox(surface);
    await surface.getByRole('button', { name: 'Save' }).click();
    const request = await waitForWire(
      page,
      (entry) => entry.channel === 'JSON-RPC SendMessage' && JSON.stringify(entry.payload).includes('"action"'),
    );
    const message = (request.params as Json).message as Json;
    expect(message.parts).toEqual([
      { data: [{ version: 'v0.9.1', action: SAVE_ACTION }], metadata: { mimeType: 'application/a2ui+json' } },
    ]);
    expect(message.metadata).toEqual({ a2uiClientCapabilities: CAPABILITIES });
    await expectInbox(surface, 'Inbox: save received');
  });

  test('MCP: a tools/call of a2ui_action with the capabilities in _meta.a2ui', async ({ page }) => {
    const surface = await open(page, 'recipes-mcp--tool-result');
    await expectInbox(surface);
    await surface.getByRole('button', { name: 'Save' }).click();
    const request = await waitForWire(page, (entry) => entry.channel === 'tools/call a2ui_action');
    expect(request).toMatchObject({ jsonrpc: '2.0', method: 'tools/call' });
    expect(request.params).toEqual({
      name: 'a2ui_action',
      arguments: SAVE_ACTION,
      _meta: { a2ui: { clientCapabilities: CAPABILITIES } },
    });
    await expectInbox(surface, 'Inbox: save received');
  });

  test('SSE: a POST of the action message, after a GET with the capabilities in the query string', async ({ page }) => {
    const surface = await open(page, 'recipes-sse--event-stream');
    await expectInbox(surface);
    const get = await waitForWire(page, (entry) => entry.channel === 'GET EventSource');
    const query = new URL(String(get.url), 'http://127.0.0.1').searchParams;
    expect(JSON.parse(query.get('capabilities') ?? 'null')).toEqual(CAPABILITIES);
    await waitForWire(page, (entry) => entry.channel === 'SSE end');

    await surface.getByRole('button', { name: 'Save' }).click();
    expect(await waitForWire(page, (entry) => entry.channel === 'POST action')).toEqual({
      version: 'v0.9.1',
      action: SAVE_ACTION,
    });
    expect(await waitForWire(page, (entry) => entry.channel === 'POST action 202')).toEqual({ accepted: 'action' });
  });
});

test.describe('line-a2ui-error leaves through the transport', () => {
  const askForV08 = (page: Page) => page.getByRole('button', { name: 'Ask for an A2UI v0.8 update' }).click();

  test('AG-UI: logged locally, nothing sent', async ({ page }) => {
    const surface = await open(page, 'recipes-ag-ui--building', 'pace:0');
    await expectInbox(surface);
    const logged: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'info') logged.push(message.text());
    });
    await askForV08(page);
    const kept = await waitForWire(page, (entry) => entry.direction === 'local');
    expect(kept).toEqual({ version: 'v0.9.1', error: V08_ERROR });
    await expect.poll(() => logged.some((text) => text.includes('line-a2ui-error kept local'))).toBe(true);
    expect(
      (await wire(page)).filter((entry) => entry.direction === 'out' && entry.channel.startsWith('error')),
    ).toEqual([]);
    await expectInbox(surface);
  });

  test('A2A: an [error] application/a2ui+json DataPart', async ({ page }) => {
    const surface = await open(page, 'recipes-a2a--array-data-part');
    await expectInbox(surface);
    await askForV08(page);
    const request = await waitForWire(
      page,
      (entry) => entry.channel === 'JSON-RPC SendMessage' && JSON.stringify(entry.payload).includes('"error"'),
    );
    const message = (request.params as Json).message as Json;
    expect(message.parts).toEqual([
      { data: [{ version: 'v0.9.1', error: V08_ERROR }], metadata: { mimeType: 'application/a2ui+json' } },
    ]);
    expect(message.metadata).toEqual({ a2uiClientCapabilities: CAPABILITIES });
    await expectInbox(surface);
  });

  test('MCP: a tools/call of a2ui_error', async ({ page }) => {
    const surface = await open(page, 'recipes-mcp--tool-result');
    await expectInbox(surface);
    await askForV08(page);
    const request = await waitForWire(page, (entry) => entry.channel === 'tools/call a2ui_error');
    expect(request.params).toEqual({
      name: 'a2ui_error',
      arguments: V08_ERROR,
      _meta: { a2ui: { clientCapabilities: CAPABILITIES } },
    });
    await expectInbox(surface);
  });

  test('SSE: a POST of the error message as JSON', async ({ page }) => {
    const surface = await open(page, 'recipes-sse--event-stream');
    await expectInbox(surface);
    await askForV08(page);
    expect(await waitForWire(page, (entry) => entry.channel === 'POST error')).toEqual({
      version: 'v0.9.1',
      error: V08_ERROR,
    });
    expect(await waitForWire(page, (entry) => entry.channel === 'POST error 202')).toEqual({ accepted: 'error' });
    await expectInbox(surface);
  });
});

test.describe('the recipe docs pages', () => {
  const PAGES = {
    'recipes-ag-ui--docs': [
      'AG-UI recipe',
      ['@ag-ui/a2ui-middleware', '0.0.13', 'defaultCatalogId', 'no error channel'],
    ],
    'recipes-a2a--docs': ['A2A recipe', ['@a2a-js/sdk', 'application/json+a2ui', 'a2uiClientCapabilities']],
    'recipes-mcp--docs': ['MCP recipe', ['EmbeddedResource', '_meta.a2ui', 'a2ui_action', 'a2ui_error']],
    'recipes-sse--docs': ['SSE recipe', ['EventSource', 'named end event', 'query string']],
    'recipes-mcp-apps-view--docs': [
      'Loading line://ui into an MCP Apps View',
      ['vite-plugin-singlefile', 'resourceDomains', 'font-src', 'app-with-deps', 'applyHostStyleVariables'],
    ],
  } as const;

  for (const [id, [heading, terms]] of Object.entries(PAGES)) {
    test(id, async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto(`/iframe.html?id=${id}&viewMode=docs`);
      await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      // The docs page renders its code blocks progressively, so each term is awaited.
      const docs = page.locator('#storybook-docs');
      for (const term of terms) await expect(docs).toContainText(term);
      await page.waitForLoadState('networkidle');
      expect(errors, 'console errors and uncaught exceptions').toEqual([]);
    });
  }

  test('the MCP Apps View page shows vite-plugin-singlefile before the CDN alternative', async ({ page }) => {
    await page.goto('/iframe.html?id=recipes-mcp-apps-view--docs&viewMode=docs');
    await expect(page.locator('#storybook-docs h2')).toHaveText([
      'First choice: one inlined file',
      'Alternative: a CDN in resourceDomains',
      'Fonts',
      'Theme: mcp-apps.css and the ext-apps helpers',
    ]);
    const docs = page.locator('#storybook-docs');
    await expect(docs).toContainText("import '@websublime/line-themes/hosts/mcp-apps.css'");
    await expect(docs).toContainText("from '@modelcontextprotocol/ext-apps/app-with-deps'");
    await expect(docs).toContainText('applyHostStyleVariables(context.styles.variables)');
    await expect(docs).toContainText('applyDocumentTheme(context.theme)');
  });
});
