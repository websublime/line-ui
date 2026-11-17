/**
 * `<line-aspect-ratio>` browser tier (spec `0021-aspect-ratio.md` Tests, Browser row; Phase 1 spec §7.8; D16, D20).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `@websublime/line-components/aspect-ratio`, `./center`, `./kbd`,
 * `./stack` and `./grid` with the `aspects`, `sizing` and `layouts` tokens; `no-tokens.html` loads Aspect Ratio
 * alone. Each test mounts its markup into `<main>` inside a wrapper of a set width and reads boxes relative to the
 * host, as probe P2 did, only after every mounted `line-*` element has updated, every `<img>` has loaded and decoded,
 * and two animation frames have passed, because a box read right after mount measures 0 × 0 or its row's height
 * (P4, command 32). Media are inline SVG data URLs and an `<iframe srcdoc>`, so no test reaches the network. No
 * assertion depends on the font: the caption and paragraph cases measure their own boxes first. The tree is read
 * with Playwright's `ariaSnapshot()` in every engine and through a CDP session in chromium; Aspect Ratio sets no
 * internals value, so there is no `INTERNALS` read-back (D20).
 *
 * @module __tests__/integration/aspect-ratio/aspect-ratio.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/aspect-ratio/';
const TAGS = ['line-aspect-ratio', 'line-center', 'line-kbd', 'line-stack', 'line-grid'];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function open(page: Page, path = '', tags = TAGS): Promise<void> {
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.goto(`${FIXTURE_URL}${path}`);
  await page.evaluate((names) => Promise.all(names.map((name) => customElements.whenDefined(name))), tags);
}

/**
 * Replaces the content of `<main>`, then waits for every mounted `line-*` element to update, for every `<img>` to
 * load (or decode once complete), and for two animation frames (D16).
 */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    const lines = [...main.querySelectorAll('*')].filter((el) => el.localName.startsWith('line-'));
    await Promise.all(lines.map((el) => customElements.whenDefined(el.localName)));
    await Promise.all(lines.map((el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete));
    await Promise.all(
      [...main.querySelectorAll('img')].map((img) => {
        if (img.complete) return img.decode().catch(() => undefined);
        const { promise, resolve } = Promise.withResolvers<unknown>();
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
        return promise;
      }),
    );
    for (let frame = 0; frame < 2; frame += 1) {
      const { promise, resolve } = Promise.withResolvers<number>();
      requestAnimationFrame(resolve);
      await promise;
    }
  }, markup);
}

/** An SVG image of `width` × `height` as a data URL. */
function svg(width: number, height: number): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="teal"/></svg>`,
  )}`;
}

const IMG = `<img alt="Mountain at dawn" src="${svg(80, 80)}">`;
const PORTRAIT = `<img alt="" src="${svg(60, 80)}">`;

/** A Kbd centred in a Center, the line catalog's framed hint (P4). */
const CENTRED_KBD = '<line-center><line-kbd keys="mod+k"></line-kbd></line-center>';

/** The box of the element matched by `selector`, relative to the element matched by `relativeTo`. */
function boxOf(page: Page, selector: string, relativeTo = 'main'): Promise<Box> {
  return page.evaluate(
    ([sel, rel]) => {
      const origin = (document.querySelector(rel as string) as Element).getBoundingClientRect();
      const box = (document.querySelector(sel as string) as Element).getBoundingClientRect();
      return { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height };
    },
    [selector, relativeTo],
  );
}

/** The boxes of the element children of the first `main line-aspect-ratio`, relative to the host. */
function children(page: Page): Promise<Box[]> {
  return page.evaluate(() => {
    const host = document.querySelector('main line-aspect-ratio') as Element;
    const origin = host.getBoundingClientRect();
    return [...host.children].map((child) => {
      const box = child.getBoundingClientRect();
      return { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height };
    });
  });
}

function host(page: Page, selector = 'main line-aspect-ratio'): Promise<Box> {
  return boxOf(page, selector);
}

function expectSize(box: Box | undefined, width: number, height: number, precision = 1): void {
  // `toBeCloseTo(n, 1)` passes within 0.05.
  expect(box?.width).toBeCloseTo(width, precision);
  expect(box?.height).toBeCloseTo(height, precision);
}

function expectAt(box: Box | undefined, x: number, y: number): void {
  expect(box?.x).toBeCloseTo(x, 0);
  expect(box?.y).toBeCloseTo(y, 0);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

/** A box of `attributes` in a block wrapper `width` px wide. */
function wrapped(attributes: string, content = '', width = 400): string {
  return `<div id="wrap" style="inline-size: ${width}px"><line-aspect-ratio ${attributes}>${content}</line-aspect-ratio></div>`;
}

const RATIO_HEIGHTS = [
  ['ratio="square"', 400],
  ['ratio="landscape"', 300],
  ['ratio="portrait"', 533.33],
  ['ratio="widescreen"', 225],
  ['ratio="ultrawide"', 111.11],
  ['ratio="golden"', 247.22],
  ['ratio="bogus"', 400],
  ['', 400],
] as const;

test.describe('ratios with line-tokens (P3; F1, F5; D8)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  for (const [attributes, height] of RATIO_HEIGHTS) {
    test(`${attributes || 'no ratio'} draws an empty 400 px wide box ${height} px tall`, async ({ page }) => {
      await mount(page, wrapped(attributes));
      expectSize(await host(page), 400, height);
    });
  }

  test('a page rule sets --line-aspect-ratio-ratio: 21 / 9, also over ratio="widescreen"', async ({ page }) => {
    await mount(
      page,
      `<style>line-aspect-ratio.c { --line-aspect-ratio-ratio: 21 / 9; }</style>
      <div style="inline-size: 420px"><line-aspect-ratio id="plain" class="c"></line-aspect-ratio></div>
      <div style="inline-size: 420px"><line-aspect-ratio id="wide" class="c" ratio="widescreen"></line-aspect-ratio></div>`,
    );
    expectSize(await host(page, '#plain'), 420, 180);
    expectSize(await host(page, '#wide'), 420, 180);
  });

  test('an inline aspect-ratio: 2 beats ratio="widescreen"', async ({ page }) => {
    await mount(page, wrapped('ratio="widescreen" style="aspect-ratio: 2"'));
    expectSize(await host(page), 400, 200);
  });
});

test.describe('ratios without line-tokens (P3; F6 (b))', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, 'no-tokens.html', ['line-aspect-ratio']);
  });

  for (const [attributes, height] of RATIO_HEIGHTS) {
    test(`${attributes || 'no ratio'} still draws a 400 px wide box ${height} px tall`, async ({ page }) => {
      await mount(page, wrapped(attributes));
      expectSize(await host(page), 400, height);
    });
  }
});

test.describe('children fill the box (P2; F2, F4)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  for (const [name, child] of [
    ['an img', IMG],
    ['a portrait img', PORTRAIT],
    ['an img with width 600 and height 800', `<img alt="" width="600" height="800" src="${svg(80, 80)}">`],
    ['a video with no source', '<video aria-label="Intro"></video>'],
    ['a video with width 640 and height 360', '<video aria-label="Intro" width="640" height="360"></video>'],
    ['an iframe with its default border', '<iframe title="Frame" srcdoc="<p>Hi</p>"></iframe>'],
    ['an iframe with frameborder="0"', '<iframe title="Frame" frameborder="0" srcdoc="<p>Hi</p>"></iframe>'],
    ['a 600 px tall div', '<div style="block-size: 600px"></div>'],
  ] as const) {
    test(`${name} fills the 400 × 225 box at 0,0`, async ({ page }) => {
      await mount(page, wrapped('ratio="widescreen"', child));
      expectSize(await host(page), 400, 225);
      const [only] = await children(page);
      expectAt(only, 0, 0);
      expectSize(only, 400, 225);
    });
  }

  test('media take object-fit: cover, and a consumer object-fit: contain on the child wins', async ({ page }) => {
    await mount(
      page,
      `<style>img.whole { object-fit: contain; }</style>
      <line-aspect-ratio ratio="widescreen" style="inline-size: 400px"><img id="img" alt="" src="${svg(80, 80)}"></line-aspect-ratio>
      <line-aspect-ratio ratio="widescreen" style="inline-size: 400px"><video id="video" aria-label="Intro"></video></line-aspect-ratio>
      <line-aspect-ratio ratio="widescreen" style="inline-size: 400px"><img id="whole" class="whole" alt="" src="${svg(80, 80)}"></line-aspect-ratio>`,
    );
    const fit = (id: string) => page.locator(id).evaluate((el) => getComputedStyle(el).objectFit);
    expect(await fit('#img')).toBe('cover');
    expect(await fit('#video')).toBe('cover');
    expect(await fit('#whole')).toBe('contain');
  });

  test('a sized 50 × 50 img sits at the start corner: 0,0, and 350,0 under dir="rtl"', async ({ page }) => {
    const sized = `<img alt="" style="inline-size: 50px; block-size: 50px" src="${svg(80, 80)}">`;
    await mount(page, wrapped('ratio="widescreen"', sized));
    let [only] = await children(page);
    expectAt(only, 0, 0);
    expectSize(only, 50, 50);
    await mount(page, wrapped('ratio="widescreen" dir="rtl"', sized));
    [only] = await children(page);
    expectAt(only, 350, 0);
    expectSize(only, 50, 50);
  });

  test('a caption with align-self: end sits on the bottom edge of the image', async ({ page }) => {
    await mount(page, wrapped('ratio="widescreen"', `${IMG}<div id="caption" style="align-self: end">Caption</div>`));
    expectSize(await host(page), 400, 225);
    const [image, caption] = await children(page);
    expectAt(image, 0, 0);
    expectSize(image, 400, 225);
    expect(Math.abs((caption?.y ?? 0) - (225 - (caption?.height ?? 0)))).toBeLessThanOrEqual(1);
  });

  test('a 150-word paragraph spills past the bottom edge while the box stays 400 × 225 (P5; F3)', async ({ page }) => {
    const words = Array.from({ length: 150 }, (_, index) => `word${index}`).join(' ');
    await mount(page, wrapped('ratio="widescreen"', `<p id="long" style="margin: 0">${words}</p>`));
    expectSize(await host(page), 400, 225);
    const text = await page.locator('#long').evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect().height;
    });
    expect(text).toBeGreaterThan(225);
    expect(await page.locator('main line-aspect-ratio').evaluate((el) => getComputedStyle(el).overflow)).toBe(
      'visible',
    );
  });
});

test.describe('size from the parent (P4; D9)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  const BOX = `<line-aspect-ratio ratio="widescreen">${IMG}</line-aspect-ratio>`;

  test('a 400 px vertical Stack at its default align: 400 × 225', async ({ page }) => {
    await mount(page, `<line-stack style="inline-size: 400px">${BOX}</line-stack>`);
    expectSize(await host(page), 400, 225);
  });

  test('a 400 px vertical Stack with align="center": 80 × 45', async ({ page }) => {
    await mount(page, `<line-stack align="center" style="inline-size: 400px">${BOX}</line-stack>`);
    expectSize(await host(page), 80, 45);
  });

  test('a 400 px plain flex column: 400 × 225, the chromium guard of min-block-size: 0', async ({ page }) => {
    await mount(page, `<div style="display: flex; flex-direction: column; inline-size: 400px">${BOX}</div>`);
    expectSize(await host(page), 400, 225);
  });

  // `flex: none` keeps the sibling at 200 px under `justify="stretch"`, which grows every Stack child (P4).
  const SIBLING = (height: number) => `<div style="flex: none; inline-size: 200px; block-size: ${height}px"></div>`;

  test('a 1000 px horizontal Stack at its defaults beside a 200 × 300 sibling: 80 × 300', async ({ page }) => {
    await mount(
      page,
      `<line-stack orientation="horizontal" style="inline-size: 1000px">${BOX}${SIBLING(300)}</line-stack>`,
    );
    expectSize(await host(page), 80, 300);
  });

  test('the same with justify="stretch": 792 × 445.5', async ({ page }) => {
    await mount(
      page,
      `<line-stack orientation="horizontal" justify="stretch" style="inline-size: 1000px">${BOX}${SIBLING(300)}</line-stack>`,
    );
    expectSize(await host(page), 792, 445.5);
  });

  test('justify="stretch" align="start" beside a 200 × 600 sibling: 792 × 445.5', async ({ page }) => {
    await mount(
      page,
      `<line-stack orientation="horizontal" justify="stretch" align="start" style="inline-size: 1000px">${BOX}${SIBLING(600)}</line-stack>`,
    );
    expectSize(await host(page), 792, 445.5);
  });

  const TEXT_ITEMS = '<div>Two</div><div>Three</div>';
  const TALL = '<div style="block-size: 600px">Tall</div><div>Three</div>';

  test('a 900 px <line-grid columns="3">: 294.66 × 165.73', async ({ page }) => {
    await mount(page, `<line-grid columns="3" style="inline-size: 900px">${BOX}${TEXT_ITEMS}</line-grid>`);
    expectSize(await host(page), 294.66, 165.73);
  });

  test('the same Grid with a 600 px item next at its default align: 294.66 × 600', async ({ page }) => {
    await mount(page, `<line-grid columns="3" style="inline-size: 900px">${BOX}${TALL}</line-grid>`);
    expectSize(await host(page), 294.66, 600);
  });

  test('the same Grid with align="start": 294.66 × 165.73', async ({ page }) => {
    await mount(page, `<line-grid columns="3" align="start" style="inline-size: 900px">${BOX}${TALL}</line-grid>`);
    expectSize(await host(page), 294.66, 165.73);
  });

  test('justify-items="center" beside the 600 px item at the default align: 600 tall, widened past its column in chromium and webkit', async ({
    page,
    browserName,
  }) => {
    await mount(
      page,
      `<line-grid columns="3" justify-items="center" style="inline-size: 900px">${BOX}${TALL}</line-grid>`,
    );
    const box = await host(page);
    expect(box.height).toBeCloseTo(600, 1);
    expect(box.width).toBeCloseTo(browserName === 'firefox' ? 80 : 1066.66, 1);
  });

  test('justify-items="center" align="start" beside the 600 px item keeps the ratio at the content width', async ({
    page,
  }) => {
    const grid = (box: string) =>
      `<line-grid columns="3" justify-items="center" align="start" style="inline-size: 900px">${box}${TALL}</line-grid>`;
    await mount(page, grid(BOX));
    expectSize(await host(page), 80, 45);

    await mount(page, grid(`<line-aspect-ratio ratio="widescreen">${CENTRED_KBD}</line-aspect-ratio>`));
    const kbd = await boxOf(page, 'main line-kbd');
    // An undefined line-kbd measures 0 × 0, which would pass the ratio check vacuously.
    expect(kbd.width).toBeGreaterThan(0);
    expectSize(await host(page), kbd.width, (kbd.width * 9) / 16);

    await mount(page, grid('<line-aspect-ratio ratio="widescreen"></line-aspect-ratio>'));
    expectSize(await host(page), 0, 0);
  });

  test('block-size: 90px sets the width through the ratio: 160 × 90', async ({ page }) => {
    await mount(page, wrapped('ratio="widescreen" style="block-size: 90px"'));
    expectSize(await host(page), 160, 90);
  });

  test('writing-mode: vertical-rl on a 300 px tall parent: 533.33 × 300 (P6; D10)', async ({ page }) => {
    await mount(
      page,
      `<div style="writing-mode: vertical-rl; height: 300px"><line-aspect-ratio ratio="widescreen"></line-aspect-ratio></div>`,
    );
    expectSize(await host(page), 533.33, 300);
  });
});

test.describe('hidden and consumer display (P5; D3, D22)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('<line-aspect-ratio hidden> renders nothing', async ({ page }) => {
    await mount(page, wrapped('hidden ratio="widescreen"', IMG));
    const box = page.locator('main line-aspect-ratio');
    expect(await box.evaluate((el) => getComputedStyle(el).display)).toBe('none');
    expect(await box.boundingBox()).toBeNull();
  });

  test('a consumer display rule shows a hidden box, and its :not([hidden]) form keeps it hidden', async ({ page }) => {
    await mount(
      page,
      `<style>
        line-aspect-ratio.shown { display: inline-grid; inline-size: 160px; }
        line-aspect-ratio.kept:not([hidden]) { display: inline-grid; inline-size: 160px; }
      </style>
      <line-aspect-ratio id="shown" class="shown" ratio="widescreen" hidden></line-aspect-ratio>
      <line-aspect-ratio id="kept" class="kept" ratio="widescreen" hidden></line-aspect-ratio>
      <line-aspect-ratio id="open" class="kept" ratio="widescreen"></line-aspect-ratio>`,
    );
    const display = (id: string) => page.locator(id).evaluate((el) => getComputedStyle(el).display);
    expect(await display('#shown')).toBe('inline-grid');
    expect(await display('#kept')).toBe('none');
    expect(await display('#open')).toBe('inline-grid');
    expectSize(await host(page, '#open'), 160, 90);
  });
});

test.describe('keyboard (SD99; D6)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('Tab skips the host, and enters a slotted button', async ({ page, browserName }) => {
    await mount(
      page,
      `<button type="button" id="before">Before</button><line-aspect-ratio id="plain" style="inline-size: 200px">${IMG}</line-aspect-ratio><button type="button" id="after">After</button>`,
    );
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#after')).toBeFocused();
    expect(await page.locator('#plain').evaluate((el) => el.matches(':focus-within'))).toBe(false);

    await mount(
      page,
      `<button type="button" id="before">Before</button><line-aspect-ratio style="inline-size: 200px"><button type="button" id="inner">Play</button></line-aspect-ratio><button type="button" id="after">After</button>`,
    );
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#inner')).toBeFocused();
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#after')).toBeFocused();
  });
});

test.describe('accessibility tree (ariaSnapshot; P1; D20)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('a role-less box adds no node, and an author role="img" reads as one named image', async ({ page }) => {
    await mount(
      page,
      `<div id="plain"><line-aspect-ratio style="inline-size: 200px">${IMG}</line-aspect-ratio></div>
      <div id="named"><line-aspect-ratio role="img" aria-label="Sales chart" style="inline-size: 200px"><img alt="" src="${svg(80, 80)}"></line-aspect-ratio></div>`,
    );
    expect(await page.locator('#plain').ariaSnapshot()).toBe('- img "Mountain at dawn"');
    expect(await page.locator('#named').ariaSnapshot()).toBe('- img "Sales chart"');
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

/** The full-tree node of the element matched by `selector` and the non-ignored nodes below `wrapper` (probe P1). */
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

  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('a role-less box adds no node and its img reads as image "Mountain at dawn"; role="img" reads as one named image (P1 A, E; D20)', async ({
    page,
  }) => {
    await mount(
      page,
      `<div id="plain"><line-aspect-ratio style="inline-size: 200px">${IMG}</line-aspect-ratio></div>
      <div id="named"><line-aspect-ratio role="img" aria-label="Sales chart" style="inline-size: 200px"><img alt="" src="${svg(80, 80)}"></line-aspect-ratio></div>`,
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const plain = await subtree(cdp, '#plain', '#plain line-aspect-ratio');
    expect(plain.node).toBeUndefined();
    expect(plain.below.map((node) => [node.role?.value, node.name?.value])).toEqual([['image', 'Mountain at dawn']]);
    const named = await subtree(cdp, '#named', '#named line-aspect-ratio');
    expect(named.node?.role?.value).toBe('image');
    expect(named.node?.name?.value).toBe('Sales chart');
    expect(named.below.filter((node) => node.role?.value === 'image')).toHaveLength(1);
  });
});
