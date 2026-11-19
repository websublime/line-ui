/**
 * `<line-grid>` browser tier (spec `0019-grid.md` Tests, Browser row; Phase 1 spec §7.8; D16, D20).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `@websublime/line-components/grid` with the `sizing` and `layouts`
 * tokens; `no-tokens.html` loads Grid alone. Each test mounts its markup into `<main>` inside a wrapper of a set
 * inline size and reads the column count from the distinct left offsets of the items, as probe P2 did. The tree is
 * read with Playwright's `ariaSnapshot()` in every engine and through a CDP session in chromium; Grid sets no
 * internals value, so there is no `INTERNALS` read-back (D20).
 *
 * @module __tests__/integration/grid/grid.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/grid/';

async function open(page: Page, path = ''): Promise<void> {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(`${FIXTURE_URL}${path}`);
  await page.evaluate(() => customElements.whenDefined('line-grid'));
}

/** Replaces the content of `<main>` and waits for every `line-grid` to render. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    await Promise.all(
      [...main.querySelectorAll('line-grid')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  }, markup);
}

/** `count` items labelled `Item 1` … `Item n`. */
function items(count: number): string {
  return Array.from({ length: count }, (_, index) => `<div>Item ${index + 1}</div>`).join('');
}

/** A grid with `attributes` and `count` items inside a wrapper `width` px wide. */
function sized(width: number, attributes: string, count = 12, wrapper = ''): string {
  return `<div id="case" style="inline-size: ${width}px" ${wrapper}><line-grid ${attributes}>${items(count)}</line-grid></div>`;
}

/** The distinct left offsets of the children of `selector`, rounded to the pixel; their count is the column count. */
function columns(page: Page, selector = '#case line-grid'): Promise<number> {
  return page.evaluate((sel) => {
    const grid = document.querySelector(sel) as Element;
    const lefts = new Set([...grid.children].map((child) => Math.round(child.getBoundingClientRect().left)));
    return lefts.size;
  }, selector);
}

/** The bounding boxes of the children of the first `line-grid`, relative to the grid. */
function boxes(page: Page): Promise<{ x: number; y: number; width: number; height: number }[]> {
  return page.evaluate(() => {
    const grid = document.querySelector('main line-grid') as Element;
    const origin = grid.getBoundingClientRect();
    return [...grid.children].map((child) => {
      const box = child.getBoundingClientRect();
      return { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height };
    });
  });
}

/** Computed values of the first `line-grid` in `<main>`. */
function computed(page: Page, properties: string[]): Promise<Record<string, string>> {
  return page.evaluate((names) => {
    const style = getComputedStyle(document.querySelector('main line-grid') as Element);
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()]));
  }, properties);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

test.describe('column counts (P2; F1, F2)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  const WIDTHS = [300, 600, 1000, 1400] as const;
  for (const [attributes, expected] of [
    ['', [1, 2, 3, 5]],
    ['columns="4"', [1, 2, 3, 4]],
    ['columns="4" min-column-width="none"', [4, 4, 4, 4]],
    ['columns="3" min-column-width="xxs"', [1, 3, 3, 3]],
    ['min-column-width="sm"', [1, 1, 2, 3]],
    ['columns="1"', [1, 1, 1, 1]],
  ] as const) {
    test(`${attributes || 'no attributes'} gives ${expected.join(', ')} columns at ${WIDTHS.join(', ')} px`, async ({
      page,
    }) => {
      const counts: number[] = [];
      for (const width of WIDTHS) {
        await mount(page, sized(width, attributes));
        counts.push(await columns(page));
      }
      expect(counts).toEqual([...expected]);
    });
  }

  test('auto-fill keeps a quarter-width item in a short row of columns="4" min-column-width="none"', async ({
    page,
  }) => {
    await mount(page, sized(1000, 'columns="4" min-column-width="none"', 2));
    const [first, second] = await boxes(page);
    expect(first?.width).toBeCloseTo(244, 0);
    expect(second?.width).toBeCloseTo(244, 0);
    expect(second?.x).toBeCloseTo(252, 0);
  });

  test('an unknown columns value behaves as no attribute', async ({ page }) => {
    await mount(page, sized(1000, 'columns="13"'));
    expect(await columns(page)).toBe(3);
  });
});

test.describe('gap (F3; D8)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  for (const [value, expected] of [
    ['0', '0px'],
    ['1', '4px'],
    ['2', '8px'],
    ['3', '16px'],
    ['4', '24px'],
    ['5', '32px'],
    ['9', '8px'],
    [undefined, '8px'],
  ] as const) {
    test(`gap="${value ?? '(none)'}" computes row-gap and column-gap ${expected}`, async ({ page }) => {
      await mount(page, sized(600, `columns="3" min-column-width="none" ${value ? `gap="${value}"` : ''}`, 6));
      expect(await computed(page, ['row-gap', 'column-gap'])).toEqual({ 'row-gap': expected, 'column-gap': expected });
      expect(await columns(page)).toBe(3);
    });
  }

  test('gap="0" and min-column-width="none" write 0px', async ({ page }) => {
    await mount(page, sized(600, 'columns="4" min-column-width="none" gap="0"', 4));
    expect(await computed(page, ['--line-grid-gap', '--line-grid-min-column-width'])).toEqual({
      '--line-grid-gap': '0px',
      '--line-grid-min-column-width': '0px',
    });
    const all = await boxes(page);
    expect(all.map((box) => Math.round(box.x))).toEqual([0, 150, 300, 450]);
  });
});

test.describe('alignment (P5; F4)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  for (const [value, expected] of [
    ['start', 'start'],
    ['center', 'center'],
    ['end', 'end'],
    ['stretch', 'stretch'],
    ['bogus', 'stretch'],
  ] as const) {
    test(`align="${value}" computes align-items ${expected} and justify-items="${value}" computes justify-items ${expected}`, async ({
      page,
    }) => {
      await mount(page, `<line-grid align="${value}"><div>a</div></line-grid>`);
      expect((await computed(page, ['align-items']))['align-items']).toBe(expected);
      await mount(page, `<line-grid justify-items="${value}"><div>a</div></line-grid>`);
      expect((await computed(page, ['justify-items']))['justify-items']).toBe(expected);
    });
  }

  test('align never changes text alignment: host and child inherit text-align, and consumer text-align wins', async ({
    page,
  }) => {
    for (const [value, alignItems] of [
      ['start', 'start'],
      ['center', 'center'],
      ['end', 'end'],
      ['stretch', 'stretch'],
    ] as const) {
      await mount(
        page,
        `<div style="text-align: end"><line-grid align="${value}"><div>a</div></line-grid></div><line-grid id="consumer" align="${value}" style="text-align: right"><div>a</div></line-grid>`,
      );
      const result = await page.evaluate(() => {
        const host = document.querySelector('main div line-grid') as Element;
        const consumer = document.getElementById('consumer') as Element;
        const text = (el: Element) => getComputedStyle(el).textAlign;
        return {
          host: text(host),
          child: text(host.firstElementChild as Element),
          alignItems: getComputedStyle(host).alignItems,
          consumer: text(consumer),
          consumerChild: text(consumer.firstElementChild as Element),
        };
      });
      expect(result.host, value).toBe('end');
      expect(result.child, value).toBe('end');
      expect(result.alignItems, value).toBe(alignItems);
      expect(result.consumer, value).toBe('right');
      expect(result.consumerChild, value).toBe('right');
    }
  });

  const UNEVEN = '<div>One</div><div>Two<br />two<br />two</div><div>Three</div>';

  test('the P5 item boxes: stretched by default, then placed by align and justify-items', async ({ page }) => {
    const grid = (attributes: string) =>
      `<div style="inline-size: 600px"><line-grid columns="3" min-column-width="none" ${attributes}>${UNEVEN}</line-grid></div>`;
    await mount(page, grid(''));
    const [stretched, tall] = await boxes(page);
    const track = (600 - 2 * 8) / 3;
    expect(stretched?.x).toBe(0);
    expect(stretched?.y).toBe(0);
    expect(stretched?.width).toBeCloseTo(track, 0);
    expect(stretched?.height).toBeCloseTo(tall?.height ?? 0, 1);
    const rowHeight = tall?.height ?? 0;

    await mount(page, grid('align="start"'));
    const [start] = await boxes(page);
    expect(start?.y).toBe(0);
    expect(start?.height).toBeLessThan(rowHeight);

    await mount(page, grid('align="center"'));
    const [center] = await boxes(page);
    expect(center?.y).toBeCloseTo((rowHeight - (center?.height ?? 0)) / 2, 0);

    await mount(page, grid('align="end"'));
    const [end] = await boxes(page);
    expect((end?.y ?? 0) + (end?.height ?? 0)).toBeCloseTo(rowHeight, 0);

    await mount(page, grid('justify-items="center"'));
    const [middle] = await boxes(page);
    expect(middle?.width).toBeLessThan(track);
    expect(middle?.x).toBeCloseTo((track - (middle?.width ?? 0)) / 2, 0);
    expect(middle?.height).toBeCloseTo(rowHeight, 1);

    await mount(page, grid('justify-items="end"'));
    const [right] = await boxes(page);
    expect((right?.x ?? 0) + (right?.width ?? 0)).toBeCloseTo(track, 0);
  });
});

test.describe('writing direction and consumer CSS (P2; D10)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('a row reverses under dir="rtl"', async ({ page }) => {
    await mount(page, sized(600, 'columns="3" min-column-width="none"', 3, 'dir="rtl"'));
    const lefts = (await boxes(page)).map((box) => Math.round(box.x));
    expect(lefts).toEqual([...lefts].sort((a, b) => b - a));
    expect(lefts[2]).toBe(0);
    expect(lefts[0]).toBeGreaterThan(400);
  });

  test('consumer CSS on line-grid beats the :host defaults', async ({ page }) => {
    await mount(
      page,
      `<style>#case line-grid { grid-template-columns: 1fr 2fr; align-items: end; }</style>${sized(600, 'columns="4"', 4)}`,
    );
    expect(await columns(page)).toBe(2);
    expect((await computed(page, ['align-items']))['align-items']).toBe('end');
    const [first, second] = await boxes(page);
    expect((second?.width ?? 0) / (first?.width ?? 1)).toBeCloseTo(2, 1);
  });

  test('--line-grid-column-gap keeps the count where column-gap does not', async ({ page }) => {
    await mount(
      page,
      `<style>#case line-grid { column-gap: 40px; }</style>${sized(600, 'columns="4" min-column-width="none"', 4)}`,
    );
    expect(await columns(page)).toBe(3);
    await mount(
      page,
      `<style>#case line-grid { --line-grid-column-gap: 40px; }</style>${sized(600, 'columns="4" min-column-width="none"', 4)}`,
    );
    expect(await columns(page)).toBe(4);
    const [first] = await boxes(page);
    expect(first?.width).toBeCloseTo(120, 0);
  });

  test('--line-grid-columns: 2 from an ancestor container query gives 1, 2 and 3 columns', async ({ page }) => {
    await mount(
      page,
      `<style>
        .sidebar { container-type: inline-size; }
        @container (min-width: 40rem) { .sidebar line-grid { --line-grid-columns: 2; } }
      </style>
      <div class="sidebar" id="narrow" style="inline-size: 30rem"><line-grid>${items(4)}</line-grid></div>
      <div class="sidebar" id="wide" style="inline-size: 60rem"><line-grid>${items(4)}</line-grid></div>
      <div id="plain" style="inline-size: 60rem"><line-grid>${items(4)}</line-grid></div>`,
    );
    expect(await columns(page, '#narrow line-grid')).toBe(1);
    expect(await columns(page, '#wide line-grid')).toBe(2);
    expect(await columns(page, '#plain line-grid')).toBe(3);
  });

  test('in a flex row the grid sizes to its widest item, and flex: 1 fills the row (P3 addendum)', async ({ page }) => {
    await mount(
      page,
      `<div id="row" style="display: flex; inline-size: 1000px"><line-grid columns="4" min-column-width="none">${items(4)}</line-grid></div>
      <div id="measure" style="position: absolute; inline-size: max-content"></div>`,
    );
    const { host, widest } = await page.evaluate(() => {
      const grid = document.querySelector('#row line-grid') as HTMLElement;
      const measure = document.querySelector('#measure') as HTMLElement;
      const widths = [...grid.children].map((child) => {
        measure.textContent = child.textContent;
        return measure.getBoundingClientRect().width;
      });
      return { host: grid.getBoundingClientRect().width, widest: Math.max(...widths) };
    });
    expect(Math.abs(host - widest)).toBeLessThanOrEqual(0.5);
    expect(host).toBeLessThan(250);

    await page.evaluate(() => {
      (document.querySelector('#row line-grid') as HTMLElement).style.flex = '1';
    });
    const filled = await page.evaluate(() => {
      const grid = document.querySelector('#row line-grid') as HTMLElement;
      return {
        host: grid.getBoundingClientRect().width,
        tracks: [...grid.children].map((child) => child.getBoundingClientRect().width),
      };
    });
    expect(filled.host).toBe(1000);
    expect(filled.tracks).toHaveLength(4);
    for (const width of filled.tracks) expect(width).toBeCloseTo((1000 - 3 * 8) / 4, 1);
    expect(await columns(page, '#row line-grid')).toBe(4);
  });

  test('<line-grid hidden> renders nothing', async ({ page }) => {
    await mount(page, `<line-grid hidden>${items(3)}</line-grid>`);
    expect((await computed(page, ['display'])).display).toBe('none');
    const box = await page.locator('main line-grid').boundingBox();
    expect(box).toBeNull();
  });
});

test.describe('without line-tokens (D8)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, 'no-tokens.html');
  });

  test('no attributes gives one column and zero gaps', async ({ page }) => {
    await mount(page, sized(1000, '', 4));
    expect(await columns(page)).toBe(1);
    const gaps = await computed(page, ['row-gap', 'column-gap']);
    expect(['normal', '0px']).toContain(gaps['row-gap']);
    expect(['normal', '0px']).toContain(gaps['column-gap']);
  });

  test('columns with min-column-width="none" still gives that many columns', async ({ page }) => {
    await mount(page, sized(1000, 'columns="3" min-column-width="none"', 6));
    expect(await columns(page)).toBe(3);
  });
});

test.describe('keyboard (SD99; D6)', () => {
  test('Tab skips the host', async ({ page, browserName }) => {
    await open(page);
    await mount(
      page,
      `<button type="button" id="before">Before</button><line-grid id="g">${items(3)}</line-grid><button type="button" id="after">After</button>`,
    );
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#after')).toBeFocused();
    expect(await page.locator('#g').evaluate((el) => el.matches(':focus-within'))).toBe(false);
  });
});

test.describe('accessibility tree (ariaSnapshot; P1; D20)', () => {
  test('an author list is a list with listitem children, and a role-less grid adds no node', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<div id="list"><line-grid role="list" aria-label="Products" min-column-width="xs">
        <article role="listitem">Lamp</article>
        <article role="listitem">Chair</article>
        <article role="listitem">Desk</article>
      </line-grid></div>
      <div id="plain"><line-grid columns="3" min-column-width="none"><div>One</div><div>Two</div><div>Three</div></line-grid></div>`,
    );
    expect(await page.locator('#list').ariaSnapshot()).toBe(
      '- list "Products":\n  - listitem: Lamp\n  - listitem: Chair\n  - listitem: Desk',
    );
    expect(await page.locator('#plain').ariaSnapshot()).toBe('- text: One Two Three');
  });
});

interface AXValue {
  value?: unknown;
}

interface AXNode {
  nodeId: string;
  ignored: boolean;
  role?: AXValue;
  name?: AXValue;
  childIds?: string[];
  backendDOMNodeId?: number;
}

/** The full-tree node of the element matched by `selector` and the non-ignored nodes below it (probe P1). */
async function subtree(
  cdp: CDPSession,
  wrapper: string,
  selector: string,
): Promise<{ node: AXNode | undefined; below: AXNode[] }> {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeId: wrapperId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: wrapper });
  const { node: wrapperDom } = await cdp.send('DOM.describeNode', { nodeId: wrapperId });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { node: dom } = await cdp.send('DOM.describeNode', { nodeId });
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AXNode[] };
  const byId = new Map(nodes.map((each) => [each.nodeId, each]));
  const start = nodes.find((each) => each.backendDOMNodeId === wrapperDom.backendNodeId);
  const below: AXNode[] = [];
  const queue = [...(start?.childIds ?? [])];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const child = byId.get(id);
    if (!child) continue;
    if (!child.ignored) below.push(child);
    queue.push(...(child.childIds ?? []));
  }
  return { node: below.find((each) => each.backendDOMNodeId === dom.backendNodeId), below };
}

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('a role-less grid adds no node, and a labelled one is a named generic (P1 A, C; D20)', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<div id="plain"><line-grid columns="3" min-column-width="none"><div>One</div><div>Two</div><div>Three</div></line-grid></div>
      <div id="named"><line-grid columns="3" min-column-width="none" aria-label="Products"><div>One</div><div>Two</div><div>Three</div></line-grid></div>`,
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const plain = await subtree(cdp, '#plain', '#plain line-grid');
    expect(plain.node).toBeUndefined();
    expect(plain.below.filter((node) => node.role?.value === 'generic')).toHaveLength(3);
    const named = await subtree(cdp, '#named', '#named line-grid');
    expect(named.node?.role?.value).toBe('generic');
    expect(named.node?.name?.value).toBe('Products');
  });
});
