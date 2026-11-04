/**
 * `<line-a2ui-surface>` in the browser tier (Phase 1 spec §6.G.4 Acceptance; ledger 01-G4), on the surface
 * stories of `storybook-static` (port 4320), in chromium, firefox and webkit.
 *
 * - A focused element keeps focus across a reorder and a reparent (`moveBefore()` where the browser has it,
 *   otherwise focus returns to the same `instanceId` at the end of the batch).
 * - Icons through the consumer's registry: a bound `favorite` loads the Phosphor `fill` file through its map entry's
 *   `weight`; under `dir="rtl"` `arrowBack` renders through `<line-icon mirror>` flipped; a mapped name whose file
 *   404s leaves the icon empty and raises no `line-a2ui-error`.
 * - Document `::part()` rules reach the rendered elements; the live region announces the default and the
 *   configured texts; a relative URL resolves against the document base, and `data:` never reaches the DOM.
 * - Every `line-a2ui-error` the tests collect validates against `client_to_server.json`.
 *
 * The axe tier for the same stories is `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts`.
 *
 * @module __tests__/a2ui-surface.e2e
 */

import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { expect, type Page, test } from 'playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4320' });

type Message = Record<string, unknown>;

const BASIC = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';
const message = (body: Message): Message => ({ version: 'v0.9.1', ...body });
const create = (surfaceId: string, catalogId = BASIC) => message({ createSurface: { surfaceId, catalogId } });
const components = (surfaceId: string, list: Message[]) =>
  message({ updateComponents: { surfaceId, components: list } });
const data = (surfaceId: string, path: string, value: unknown) =>
  message({ updateDataModel: { surfaceId, path, value } });
const text = (id: string, value: unknown): Message => ({ id, component: 'Text', text: value });
const button = (id: string, label: string): Message[] => [
  { id, component: 'Button', child: `${id}Label`, action: { event: { name: id } } },
  text(`${id}Label`, label),
];

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const clientToServer = ajv.compile(
  JSON.parse(readFileSync(new URL('./fixtures/a2ui-v0_9_1/client_to_server.json', import.meta.url), 'utf8')),
);

/** Window state the tests add to the story frame. */
interface TestWindow {
  __errors: unknown[];
}

interface SurfaceElement extends HTMLElement {
  session: { constructor: new () => unknown } | undefined;
  iconMap: unknown;
  feed(batch: unknown[]): Promise<number>;
  settled(): Promise<void>;
}

/**
 * Opens a surface story, then replaces its surface with a fresh one on its own session under `surfaceId`, keeping
 * the story's icon map, and records every `line-a2ui-error` it raises.
 */
async function freshSurface(page: Page, surfaceId: string, story = 'basic', attributes: Record<string, string> = {}) {
  await page.goto(`/iframe.html?id=agent-ui-a2ui-surface--${story}&viewMode=story`);
  await expect(page.locator('#storybook-root line-a2ui-surface')).toBeAttached();
  await page.evaluate(
    ({ surfaceId, attributes }) => {
      const story = document.querySelector('line-a2ui-surface') as SurfaceElement;
      const Session = story.session?.constructor as new () => unknown;
      const surface = document.createElement('line-a2ui-surface') as SurfaceElement;
      surface.setAttribute('surface-id', surfaceId);
      for (const [name, value] of Object.entries(attributes)) surface.setAttribute(name, value);
      surface.iconMap = story.iconMap;
      (window as unknown as TestWindow).__errors = [];
      surface.addEventListener('line-a2ui-error', (event) =>
        (window as unknown as TestWindow).__errors.push((event as CustomEvent).detail),
      );
      story.closest('#storybook-root')?.replaceChildren(surface);
      surface.session = new Session() as SurfaceElement['session'];
    },
    { surfaceId, attributes },
  );
}

/** Feeds one batch to the surface and waits until it settles and its components have updated. */
async function feed(page: Page, batch: Message[]): Promise<void> {
  await page.evaluate(async (messages) => {
    const surface = document.querySelector('line-a2ui-surface') as SurfaceElement;
    await surface.feed(messages);
    await Promise.all(
      [...surface.querySelectorAll('*')]
        .filter((element) => element.localName.startsWith('line-'))
        .map(async (element) => {
          await customElements.whenDefined(element.localName);
          await (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete;
        }),
    );
  }, batch);
}

/** The errors the surface raised, each checked against `client_to_server.json`. */
async function errorsOf(page: Page): Promise<{ error: { code: string } }[]> {
  const errors = await page.evaluate(() => (window as unknown as TestWindow).__errors);
  for (const error of errors) expect(clientToServer(error), JSON.stringify(clientToServer.errors)).toBe(true);
  return errors as { error: { code: string } }[];
}

test.describe('focus (§6.G.4 Accessibility; plan §5.6 D4)', () => {
  const S = 'focus';
  const setup = [
    create(S),
    components(S, [
      { id: 'root', component: 'Row', children: ['a', 'b'] },
      ...button('a', 'Alpha'),
      ...button('b', 'Beta'),
    ]),
  ];
  const steps: [string, Message[]][] = [
    ['a label change', [components(S, [text('bLabel', 'Beta 2')])]],
    [
      'a sibling inserted before',
      [components(S, [{ id: 'root', component: 'Row', children: ['a', 'c', 'b'] }, ...button('c', 'Gamma')])],
    ],
    ['a reorder that moves it first', [components(S, [{ id: 'root', component: 'Row', children: ['b', 'a', 'c'] }])]],
    [
      'a reparent into a new Column',
      [
        components(S, [
          { id: 'root', component: 'Row', children: ['a', 'c', 'wrap'] },
          { id: 'wrap', component: 'Column', children: ['b'] },
        ]),
      ],
    ],
    [
      'a reparent back into the root',
      [
        components(S, [
          { id: 'root', component: 'Row', children: ['b', 'a', 'c', 'wrap'] },
          { id: 'wrap', component: 'Column', children: [] },
        ]),
      ],
    ],
  ];

  test('a focused element keeps focus, as the same element, across each agent update', async ({ page }) => {
    await freshSurface(page, S);
    await feed(page, setup);
    for (const [name, batch] of steps) {
      await page.locator('line-a2ui-surface line-button').filter({ hasText: /^Beta/ }).focus();
      await page.evaluate(() => {
        Object.assign(document.activeElement as Element, { focusMark: true });
      });
      await feed(page, batch);
      const state = await page.evaluate(() => {
        const active = document.activeElement as (Element & { focusMark?: boolean }) | null;
        const result = {
          active: active?.localName,
          sameElement: active?.focusMark === true,
          innerButton: active?.shadowRoot?.activeElement?.localName,
          label: active?.textContent?.trim(),
        };
        if (active) delete active.focusMark;
        return result;
      });
      expect(state, name).toEqual({
        active: 'line-button',
        sameElement: true,
        innerButton: 'button',
        label: expect.stringMatching(/^Beta/),
      });
    }
    const order = await page.locator('line-a2ui-surface line-button').allTextContents();
    expect(order.map((label) => label.trim())).toEqual(['Beta 2', 'Alpha', 'Gamma']);
    expect(await errorsOf(page)).toEqual([]);
  });

  test('an agent update never moves focus into the surface', async ({ page }) => {
    await freshSurface(page, S);
    await page.evaluate(() => {
      const outside = document.createElement('button');
      outside.id = 'outside';
      outside.textContent = 'Outside';
      document.body.prepend(outside);
      outside.focus();
    });
    await feed(page, setup);
    for (const [, batch] of steps) await feed(page, batch);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('outside');
  });
});

test.describe('icons (§6.G.4 Basic mapping; §10 SD15, SD33, SD92)', () => {
  test('a bound favorite loads the Phosphor fill file through its entry weight', async ({ page }) => {
    await freshSurface(page, 'icons');
    const fill = page.waitForResponse((response) => response.url().endsWith('/icons/phosphor/fill/heart-fill.svg'));
    await feed(page, [
      create('icons'),
      components('icons', [{ id: 'root', component: 'Icon', name: { path: '/icon' } }]),
      data('icons', '/icon', 'favorite'),
    ]);
    expect([200, 304]).toContain((await fill).status());
    const icon = page.locator('line-a2ui-surface line-icon');
    await expect(icon).toHaveAttribute('library', 'phosphor');
    await expect(icon).toHaveAttribute('weight', 'fill');
    await expect(icon.locator('svg')).toHaveCount(1);
    expect(await errorsOf(page)).toEqual([]);
  });

  test('under dir="rtl" arrowBack renders through <line-icon mirror>, flipped', async ({ page }) => {
    await page.goto('/iframe.html?id=agent-ui-a2ui-surface--right-to-left&viewMode=story');
    const icon = page.locator('line-a2ui-surface line-icon');
    await expect(icon).toHaveAttribute('mirror', '');
    await expect(icon.locator('svg')).toHaveCount(1);
    expect(await icon.locator('svg').evaluate((svg) => getComputedStyle(svg).scale)).toBe('-1 1');
  });

  test('a mapped name whose file 404s leaves the icon empty and raises no line-a2ui-error', async ({ page }) => {
    await freshSurface(page, 'missing');
    await page.route('**/icons/phosphor/regular/house.svg', (route) => route.fulfill({ status: 404, body: '' }));
    const missing = page.waitForResponse((response) => response.url().endsWith('/icons/phosphor/regular/house.svg'));
    await feed(page, [create('missing'), components('missing', [{ id: 'root', component: 'Icon', name: 'home' }])]);
    expect((await missing).status()).toBe(404);
    const icon = page.locator('line-a2ui-surface line-icon');
    await expect(icon).toHaveAttribute('name', 'house');
    await page.waitForTimeout(100);
    await expect(icon.locator('svg')).toHaveCount(0);
    expect(await errorsOf(page)).toEqual([]);
  });
});

test.describe('Button in a host form (§6.G.4 Button; §12 AM-081)', () => {
  test('a basic and a line Button submit nothing, reset nothing, add no field, and still raise their action', async ({
    page,
  }) => {
    await page.goto('/iframe.html?id=agent-ui-a2ui-surface--basic&viewMode=story');
    await expect(page.locator('#storybook-root line-a2ui-surface')).toBeAttached();
    const result = await page.evaluate(async () => {
      const story = document.querySelector('line-a2ui-surface') as SurfaceElement;
      const Session = story.session?.constructor as new () => unknown;
      const form = document.createElement('form');
      form.innerHTML = '<input name="kept" value="initial">';
      const counts = { submit: 0, reset: 0, actions: [] as string[] };
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        counts.submit++;
      });
      form.addEventListener('reset', () => counts.reset++);
      const surfaces = (['basic', 'line'] as const).map((kind) => {
        const surface = document.createElement('line-a2ui-surface') as SurfaceElement;
        surface.setAttribute('surface-id', kind);
        surface.addEventListener('line-a2ui-action', (event) =>
          counts.actions.push(String((event as CustomEvent<{ action: { name: string } }>).detail.action.name)),
        );
        form.append(surface);
        surface.session = new Session() as SurfaceElement['session'];
        return surface;
      });
      story.closest('#storybook-root')?.replaceChildren(form);
      const [basic, line] = surfaces as [SurfaceElement, SurfaceElement];
      await basic.feed([
        {
          version: 'v0.9.1',
          createSurface: {
            surfaceId: 'basic',
            catalogId: 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json',
          },
        },
        {
          version: 'v0.9.1',
          updateComponents: {
            surfaceId: 'basic',
            components: [
              { id: 'root', component: 'Button', child: 't', action: { event: { name: 'basic' } } },
              { id: 't', component: 'Text', text: 'Basic' },
            ],
          },
        },
      ]);
      await line.feed([
        {
          version: 'v0.9.1',
          createSurface: {
            surfaceId: 'line',
            catalogId: 'https://line-ui.websublime.com/a2ui/catalogs/line/v1/catalog.json',
          },
        },
        {
          version: 'v0.9.1',
          updateComponents: {
            surfaceId: 'line',
            components: [
              {
                id: 'root',
                component: 'Button',
                accessibility: { label: 'Line' },
                action: { event: { name: 'line' } },
              },
            ],
          },
        },
      ]);
      const input = form.querySelector('input') as HTMLInputElement;
      input.value = 'changed';
      const buttons = [...form.querySelectorAll('line-button')] as (HTMLElement & {
        updateComplete: Promise<unknown>;
      })[];
      await Promise.all(buttons.map((button) => button.updateComplete));
      for (const button of buttons) button.shadowRoot?.querySelector('button')?.click();
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        ...counts,
        types: buttons.map((button) => button.getAttribute('type')),
        input: input.value,
        fields: [...new FormData(form).keys()],
      };
    });
    expect(result).toEqual({
      submit: 0,
      reset: 0,
      actions: ['basic', 'line'],
      types: ['button', 'button'],
      input: 'changed',
      fields: ['kept'],
    });
  });
});

test.describe('rendering (§6.G.4; plan §7.2)', () => {
  test('document ::part() rules reach the rendered elements', async ({ page }) => {
    await page.goto('/iframe.html?id=agent-ui-a2ui-surface--basic&viewMode=story');
    await page.addStyleTag({
      content:
        'line-button::part(root) { outline: 3px solid rgb(255, 0, 0); } line-icon::part(svg) { outline: 2px solid rgb(0, 0, 255); }',
    });
    const root = page.locator('line-a2ui-surface line-button').first().locator('[part~="root"]');
    await expect(root).toHaveCSS('outline-color', 'rgb(255, 0, 0)');
    const svg = page.locator('line-a2ui-surface line-icon [part~="svg"]');
    await expect(svg).toHaveCSS('outline-color', 'rgb(0, 0, 255)');
  });

  test('a relative URL resolves against the document base; data: never reaches the DOM', async ({ page }) => {
    await freshSurface(page, 'urls');
    await feed(page, [
      create('urls'),
      components('urls', [
        { id: 'root', component: 'Column', children: ['rel', 'data'] },
        { id: 'rel', component: 'Image', url: 'icons/lucide/star.svg', description: 'A star' },
        {
          id: 'data',
          component: 'Image',
          url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
          description: 'Data',
        },
      ]),
    ]);
    const sources = await page
      .locator('line-a2ui-surface img')
      .evaluateAll((images) =>
        images.map((image) => [image.getAttribute('src'), new URL('icons/lucide/star.svg', document.baseURI).href]),
      );
    expect(sources[0]?.[0]).toBe(sources[0]?.[1]);
    expect(sources[1]?.[0]).toBeNull();
  });

  test('the live region announces the default texts, then the configured ones', async ({ page }) => {
    const live = page.locator('line-a2ui-surface [role="status"]');
    await freshSurface(page, 'live');
    await feed(page, [create('live'), components('live', [text('root', 'x')])]);
    await expect(live).toHaveText('Content updated.');
    await feed(page, [create('live')]);
    await expect(live).toHaveText('Some content could not be shown.');
    expect((await errorsOf(page)).map((e) => e.error.code)).toEqual(['INTEGRITY_ERROR']);

    await freshSurface(page, 'live', 'basic', { 'live-update-text': 'Actualizado.', 'live-error-text': 'Erro.' });
    await feed(page, [create('live'), components('live', [text('root', 'x')])]);
    await expect(live).toHaveText('Actualizado.');
    await feed(page, [components('live', [{ id: 'loop', component: 'Column', children: ['loop'] }])]);
    await expect(live).toHaveText('Erro.');
    expect((await errorsOf(page)).map((e) => e.error.code)).toEqual(['RECURSION_ERROR']);
  });

  test('the Placeholders story raises errors that validate against client_to_server.json', async ({ page }) => {
    await page.goto('/iframe.html?id=agent-ui-a2ui-surface--placeholders&viewMode=story');
    await expect(page.locator('line-a2ui-surface [data-line-a2ui-placeholder]')).toHaveCount(2);
    await freshSurface(page, 'errors');
    await feed(page, [
      create('errors'),
      components('errors', [
        { id: 'root', component: 'Column', children: ['field', 'unnamed', 'icon'] },
        { id: 'field', component: 'TextField', label: 'Name' },
        { id: 'unnamed', component: 'Button', child: 'blank', action: { event: { name: 'x' } } },
        text('blank', ' '),
        { id: 'icon', component: 'Icon', name: { path: '/nope' } },
      ]),
      data('errors', '/nope', 'notAnIcon'),
    ]);
    const codes = (await errorsOf(page)).map((e) => e.error.code).sort();
    expect(codes).toEqual(['MISSING_ACCESSIBLE_NAME', 'UNKNOWN_COMPONENT_TYPE', 'UNMAPPED_ICON'].sort());
  });
});
