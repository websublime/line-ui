/**
 * `<line-separator>` browser tier (spec `0011-separator.md` Tests, Browser and Accessibility tree rows;
 * Phase 1 spec §7.8, §6.C.4 notes, §12 AM-058).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third
 * `webServer` of `playwright.config.ts` serves on port 4321. `index.html` loads
 * the built `@websublime/line-components/separator` with `line-tokens/border-width`
 * and `line-themes` (and `line-stack` for the flex cases); `no-tokens.html`
 * loads Separator alone. Each test mounts its markup into `<main>`. The
 * internals values are read back through the `INTERNALS` symbol the fixture
 * re-exports, in every engine; the accessibility tree is read through a CDP
 * session in chromium only.
 *
 * @module __tests__/integration/separator/separator.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/separator/';

async function open(page: Page, path = ''): Promise<void> {
  await page.goto(`${FIXTURE_URL}${path}`);
  await page.evaluate(() => customElements.whenDefined('line-separator'));
}

/** Replaces the content of `<main>` and waits for every line element to render. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    await Promise.all(
      [...main.querySelectorAll('line-separator, line-stack')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  }, markup);
}

/** Computed values of the `line-separator` matched by `selector` inside `<main>`. */
function computed(page: Page, properties: string[], selector = 'line-separator'): Promise<Record<string, string>> {
  return page.evaluate(
    ([names, sel]) => {
      const style = getComputedStyle(document.querySelector(`main ${sel}`) as Element);
      return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]));
    },
    [properties, selector] as const,
  );
}

/** Border-box size of the element matched by `selector` inside `<main>`. */
function box(page: Page, selector = 'line-separator'): Promise<{ width: number; height: number }> {
  return page.evaluate((sel) => {
    const { width, height } = (document.querySelector(`main ${sel}`) as Element).getBoundingClientRect();
    return { width, height };
  }, selector);
}

const HORIZONTAL_LINE = [
  'border-top-style',
  'border-top-width',
  'border-left-style',
  'border-left-width',
  'border-right-style',
  'border-bottom-style',
];

test.describe('with line-tokens and line-themes', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('a horizontal separator draws a 1px solid top border and nothing else', async ({ page }) => {
    for (const markup of [
      '<line-separator></line-separator>',
      '<line-separator orientation="horizontal"></line-separator>',
      '<line-separator orientation="bogus"></line-separator>',
    ]) {
      await mount(page, markup);
      expect(await computed(page, [...HORIZONTAL_LINE, 'display', 'margin-top'])).toEqual({
        'border-top-style': 'solid',
        'border-top-width': '1px',
        'border-left-style': 'none',
        'border-left-width': '0px',
        'border-right-style': 'none',
        'border-bottom-style': 'none',
        display: 'block',
        'margin-top': '0px',
      });
      expect((await box(page)).height).toBe(1);
    }
  });

  test('a vertical separator draws a 1px solid inline-start border, 0 wide content', async ({ page }) => {
    await mount(page, '<line-separator orientation="vertical"></line-separator>');
    expect(await computed(page, HORIZONTAL_LINE)).toEqual({
      'border-top-style': 'none',
      'border-top-width': '0px',
      'border-left-style': 'solid',
      'border-left-width': '1px',
      'border-right-style': 'none',
      'border-bottom-style': 'none',
    });
    expect((await box(page)).width).toBe(1);
  });

  test('a vertical separator draws on the right under dir="rtl"', async ({ page }) => {
    await mount(page, '<div dir="rtl"><line-separator orientation="vertical"></line-separator></div>');
    expect(await computed(page, ['border-left-style', 'border-right-style', 'border-right-width'])).toEqual({
      'border-left-style': 'none',
      'border-right-style': 'solid',
      'border-right-width': '1px',
    });
  });

  test('the colour is --line-gray-6 from the theme', async ({ page }) => {
    // `line-colors` is not a `line-components` dependency, so the page stands in for the step-6 palette values
    // that `line-themes` points `--line-gray-6` at (spec 0011-separator.md AM-001).
    await mount(
      page,
      `<style>html { --line-sand-6: rgb(10, 20, 30); --line-slate-6: rgb(10, 20, 30); }</style>
      <span id="probe" style="color: var(--line-gray-6)"></span>
      <line-separator></line-separator>
      <line-separator id="v" orientation="vertical"></line-separator>`,
    );
    const probe = await page.evaluate(() => getComputedStyle(document.querySelector('#probe') as Element).color);
    expect(probe).toBe('rgb(10, 20, 30)');
    expect((await computed(page, ['border-top-color']))['border-top-color']).toBe(probe);
    expect((await computed(page, ['border-left-color'], '#v'))['border-left-color']).toBe(probe);
  });

  test('a horizontal separator spans a block container and a column Stack with align="center"', async ({ page }) => {
    await mount(
      page,
      `<div style="inline-size: 300px"><line-separator id="a"></line-separator></div>
      <line-stack align="center" style="inline-size: 300px"><span>x</span><line-separator id="b"></line-separator></line-stack>`,
    );
    expect((await box(page, '#a')).width).toBe(300);
    expect((await box(page, '#b')).width).toBe(300);
  });

  test('a vertical separator spans the row of a horizontal Stack with align="center"', async ({ page }) => {
    await mount(
      page,
      `<line-stack orientation="horizontal" align="center" gap="0">
        <div style="block-size: 60px; inline-size: 20px"></div>
        <line-separator orientation="vertical"></line-separator>
        <div style="block-size: 10px; inline-size: 20px"></div>
      </line-stack>`,
    );
    expect(await box(page)).toEqual({ width: 1, height: 60 });
  });

  test('a vertical separator outside flex is 1em tall', async ({ page }) => {
    await mount(page, '<div style="font-size: 20px"><line-separator orientation="vertical"></line-separator></div>');
    expect((await box(page)).height).toBe(20);
  });

  test('a vertical separator does not shrink in a crowded row', async ({ page }) => {
    await mount(
      page,
      `<line-stack orientation="horizontal" gap="0" style="inline-size: 100px">
        <div style="inline-size: 100px; block-size: 10px"></div>
        <line-separator orientation="vertical"></line-separator>
        <div style="inline-size: 100px; block-size: 10px"></div>
      </line-stack>`,
    );
    expect((await box(page)).width).toBe(1);
  });

  test('a decorative vertical separator still draws vertical', async ({ page }) => {
    await mount(page, '<line-separator decorative orientation="vertical"></line-separator>');
    expect(await computed(page, ['border-top-style', 'border-left-style', 'border-left-width'])).toEqual({
      'border-top-style': 'none',
      'border-left-style': 'solid',
      'border-left-width': '1px',
    });
  });

  test('consumer CSS on line-separator beats the :host rules', async ({ page }) => {
    await mount(
      page,
      `<style>
        line-separator { --line-separator-color: rgb(1, 2, 3); --line-separator-thickness: 3px; margin-block: 7px; }
        line-separator[orientation="vertical"] { margin-block: 0; margin-inline: 5px; }
        line-separator.dashed:not([orientation="vertical"]) { border-block-start-style: dashed; }
        line-separator.dashed[orientation="vertical"] { border-inline-start-style: dashed; }
      </style>
      <line-separator id="h" class="dashed"></line-separator>
      <line-separator id="v" class="dashed" orientation="vertical"></line-separator>`,
    );
    expect(
      await computed(
        page,
        ['border-top-color', 'border-top-width', 'border-top-style', 'border-left-style', 'margin-top', 'margin-left'],
        '#h',
      ),
    ).toEqual({
      'border-top-color': 'rgb(1, 2, 3)',
      'border-top-width': '3px',
      'border-top-style': 'dashed',
      'border-left-style': 'none',
      'margin-top': '7px',
      'margin-left': '0px',
    });
    expect(
      await computed(
        page,
        [
          'border-left-color',
          'border-left-width',
          'border-left-style',
          'border-top-style',
          'margin-top',
          'margin-left',
        ],
        '#v',
      ),
    ).toEqual({
      'border-left-color': 'rgb(1, 2, 3)',
      'border-left-width': '3px',
      'border-left-style': 'dashed',
      'border-top-style': 'none',
      'margin-top': '0px',
      'margin-left': '5px',
    });
  });

  test('<line-separator hidden> renders nothing', async ({ page }) => {
    await mount(page, '<line-separator hidden></line-separator>');
    expect((await computed(page, ['display'])).display).toBe('none');
    await expect(page.locator('main line-separator')).toBeHidden();
  });

  test('the internals hold role and ariaOrientation per the spec table', async ({ page }) => {
    await mount(
      page,
      `<line-separator></line-separator>
      <line-separator orientation="bogus"></line-separator>
      <line-separator orientation="vertical"></line-separator>
      <line-separator decorative></line-separator>
      <line-separator decorative orientation="vertical"></line-separator>`,
    );
    const values = await page.evaluate(async (url) => {
      // Runtime import in the page: the fixture module the page already loaded holds the one matching Symbol.
      const { INTERNALS } = (await import(url)) as { INTERNALS: symbol };
      return [...document.querySelectorAll('main line-separator')].map((el) => {
        const internals = Reflect.get(el, INTERNALS) as ElementInternals | undefined;
        return internals ? { role: internals.role, ariaOrientation: internals.ariaOrientation } : 'missing';
      });
    }, `${FIXTURE_URL}fixture.ts`);
    expect(values).toEqual([
      { role: 'separator', ariaOrientation: null },
      { role: 'separator', ariaOrientation: null },
      { role: 'separator', ariaOrientation: 'vertical' },
      { role: 'none', ariaOrientation: null },
      { role: 'none', ariaOrientation: null },
    ]);
  });
});

interface AXValue {
  value?: unknown;
}
interface AXNode {
  ignored: boolean;
  role?: AXValue;
  name?: AXValue;
  properties?: { name: string; value: AXValue }[];
}

/** The accessibility node Chromium builds for the element matched by `selector`. */
async function axNode(cdp: CDPSession, selector: string): Promise<AXNode> {
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  return nodes[0] as AXNode;
}

const orientationOf = (node: AXNode): unknown =>
  node.properties?.find((property) => property.name === 'orientation')?.value.value;

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('role, orientation and name come from the internals; author attributes win', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<p>Before</p>
      <line-separator id="default"></line-separator>
      <line-separator id="vertical" orientation="vertical"></line-separator>
      <line-separator id="labelled" aria-label="Advanced settings"></line-separator>
      <line-separator id="decorative" decorative></line-separator>
      <line-separator id="decorative-vertical" decorative orientation="vertical"></line-separator>
      <line-separator id="author-role" role="presentation"></line-separator>
      <line-separator id="author-orientation" aria-orientation="vertical"></line-separator>
      <p>After</p>`,
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');

    const plain = await axNode(cdp, '#default');
    expect(plain.role?.value).toBe('separator');
    expect(orientationOf(plain)).toBe('horizontal');

    const vertical = await axNode(cdp, '#vertical');
    expect(vertical.role?.value).toBe('separator');
    expect(orientationOf(vertical)).toBe('vertical');

    const labelled = await axNode(cdp, '#labelled');
    expect(labelled.role?.value).toBe('separator');
    expect(labelled.name?.value).toBe('Advanced settings');

    for (const id of ['#decorative', '#decorative-vertical', '#author-role']) {
      const node = await axNode(cdp, id);
      expect(node.ignored || node.role?.value === 'none', id).toBe(true);
      expect(node.role?.value).not.toBe('separator');
    }

    const authorOrientation = await axNode(cdp, '#author-orientation');
    expect(authorOrientation.role?.value).toBe('separator');
    expect(orientationOf(authorOrientation)).toBe('vertical');
  });

  test('the border colour stays visible in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    await mount(
      page,
      `<div id="text" style="color: rgb(200, 0, 0)">
        <line-separator></line-separator>
      </div>
      <div id="canvas" style="background-color: Canvas"></div>
      <div id="background-line" style="background-color: rgb(200, 0, 0)"></div>`,
    );
    const { line, text, canvas, backgroundLine } = await page.evaluate(() => {
      const color = (selector: string, property: 'color' | 'backgroundColor' | 'borderTopColor') =>
        getComputedStyle(document.querySelector(selector) as Element)[property];
      return {
        line: color('main line-separator', 'borderTopColor'),
        text: color('#text', 'color'),
        canvas: color('#canvas', 'backgroundColor'),
        backgroundLine: color('#background-line', 'backgroundColor'),
      };
    });
    // The UA forces the border to the text colour, and a background-drawn line to Canvas, where it vanishes.
    expect(line).toBe(text);
    expect(line).not.toBe(canvas);
    expect(backgroundLine).toBe(canvas);
  });
});

test.describe('without line-tokens and line-themes', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, 'no-tokens.html');
  });

  test('the line falls back to 1px and currentColor', async ({ page }) => {
    await mount(page, '<div style="color: rgb(200, 0, 0)"><line-separator></line-separator></div>');
    expect(await computed(page, ['border-top-width', 'border-top-style', 'border-top-color'])).toEqual({
      'border-top-width': '1px',
      'border-top-style': 'solid',
      'border-top-color': 'rgb(200, 0, 0)',
    });
  });
});
