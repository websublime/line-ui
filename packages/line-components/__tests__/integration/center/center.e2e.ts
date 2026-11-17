/**
 * `<line-center>` browser tier (spec `0020-center.md` Tests, Browser row; Phase 1 spec §7.8; D15, D19).
 *
 * Runs in chromium, firefox and webkit on the fixture page that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `@websublime/line-components/center` and `./stack` with the
 * `sizing` and `layouts` tokens. Each test mounts its markup into `<main>` inside a wrapper of a set size and reads
 * child offsets relative to the host, as probe P2 did. The tree is read with Playwright's `ariaSnapshot()` in every
 * engine and through a CDP session in chromium; Center sets no internals value, so there is no `INTERNALS`
 * read-back (D19).
 *
 * @module __tests__/integration/center/center.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/center/';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function open(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(FIXTURE_URL);
  await page.evaluate(() =>
    Promise.all([customElements.whenDefined('line-center'), customElements.whenDefined('line-stack')]),
  );
}

/** Replaces the content of `<main>` and waits for every `line-center` and `line-stack` to render. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    await Promise.all(
      [...main.querySelectorAll('line-center, line-stack')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  }, markup);
}

/** A 400 × 300 Center with `attributes` around `children`. */
function sized(attributes: string, children: string): string {
  return `<line-center ${attributes} style="inline-size: 400px; block-size: 300px">${children}</line-center>`;
}

const ONE = '<div style="inline-size: 100px; block-size: 40px"></div>';
const THREE = [60, 120, 90].map((width) => `<div style="inline-size: ${width}px; block-size: 30px"></div>`).join('');

/** The boxes of the element children of the host matched by `selector`, relative to the host's top-left corner. */
function children(page: Page, selector = 'main line-center'): Promise<Box[]> {
  return page.evaluate((sel) => {
    const host = document.querySelector(sel) as Element;
    const origin = host.getBoundingClientRect();
    return [...host.children].map((child) => {
      const box = child.getBoundingClientRect();
      return { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height };
    });
  }, selector);
}

/** The box of the element matched by `selector`, relative to the element matched by `relativeTo`. */
function boxOf(page: Page, selector: string, relativeTo: string): Promise<Box> {
  return page.evaluate(
    ([sel, rel]) => {
      const origin = (document.querySelector(rel as string) as Element).getBoundingClientRect();
      const box = (document.querySelector(sel as string) as Element).getBoundingClientRect();
      return { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height };
    },
    [selector, relativeTo],
  );
}

function expectAt(box: Box | undefined, x: number, y: number): void {
  expect(box?.x).toBeCloseTo(x, 0);
  expect(box?.y).toBeCloseTo(y, 0);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

test.beforeEach(async ({ page }) => {
  await open(page);
});

test.describe('axes (P2; F1, F2, F5; D8)', () => {
  for (const [attributes, x, y] of [
    ['', 150, 130],
    ['axis="both"', 150, 130],
    ['axis="horizontal"', 150, 0],
    ['axis="vertical"', 0, 130],
    ['axis="bogus"', 150, 130],
  ] as const) {
    test(`${attributes || 'no axis'} places one 100 × 40 child at ${x},${y}`, async ({ page }) => {
      await mount(page, sized(attributes, ONE));
      const [only] = await children(page);
      expectAt(only, x, y);
    });
  }

  for (const [attributes, xs, ys] of [
    ['', [170, 140, 155], [105, 135, 165]],
    ['axis="horizontal"', [170, 140, 155], [0, 30, 60]],
    ['axis="vertical"', [0, 0, 0], [105, 135, 165]],
  ] as const) {
    test(`${attributes || 'no axis'} keeps three children as one column at x ${xs.join(', ')} and y ${ys.join(', ')}`, async ({
      page,
    }) => {
      await mount(page, sized(attributes, THREE));
      const boxes = await children(page);
      expect(boxes).toHaveLength(3);
      for (const [index, box] of boxes.entries()) expectAt(box, xs[index] as number, ys[index] as number);
    });
  }

  for (const [attributes, centredX, centredY] of [
    ['', true, true],
    ['axis="horizontal"', true, false],
    ['axis="vertical"', false, true],
  ] as const) {
    test(`${attributes || 'no axis'} places the text node Hello by its measured box`, async ({ page }) => {
      await mount(page, sized(attributes, 'Hello'));
      const text = await page.evaluate(() => {
        const host = document.querySelector('main line-center') as Element;
        const range = document.createRange();
        range.selectNodeContents(host);
        const origin = host.getBoundingClientRect();
        const box = range.getBoundingClientRect();
        return { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height };
      });
      expect(Math.abs(text.x - (centredX ? (400 - text.width) / 2 : 0))).toBeLessThanOrEqual(1);
      // At the start, the text sits inside its 24 px line box (16px/1.5), so its top is half the leading below 0.
      expect(Math.abs(text.y - ((centredY ? 300 : 24) - text.height) / 2)).toBeLessThanOrEqual(1);
    });
  }
});

test.describe('overflow (P3; F8)', () => {
  // `flex: none` keeps the empty box at 400 px tall: a column flex item would otherwise shrink to the host's height,
  // because an empty box has no content to set its automatic minimum size.
  const BIG = '<div style="flex: none; inline-size: 600px; block-size: 400px"></div>';

  test('a 600 × 400 child in a 400 × 300 scrolling wrapper starts at 0,0 and scrolls 600 × 400', async ({ page }) => {
    await mount(
      page,
      `<div id="wrap" style="inline-size: 400px; block-size: 300px; overflow: auto"><line-center style="block-size: 300px">${BIG}</line-center></div>`,
    );
    const [only] = await children(page);
    expectAt(only, 0, 0);
    const scroll = await page.locator('#wrap').evaluate((el) => [el.scrollWidth, el.scrollHeight]);
    expect(scroll).toEqual([600, 400]);
  });

  test('the same child in a scrolling host starts at 0,0 and scrolls 600 × 400', async ({ page }) => {
    await mount(
      page,
      `<line-center style="inline-size: 400px; block-size: 300px; overflow: auto">${BIG}</line-center>`,
    );
    const [only] = await children(page);
    expectAt(only, 0, 0);
    const scroll = await page.locator('main line-center').evaluate((el) => [el.scrollWidth, el.scrollHeight]);
    expect(scroll).toEqual([600, 400]);
  });

  test('under dir="rtl" the child starts at the right edge', async ({ page }) => {
    await mount(page, `<line-center dir="rtl" style="inline-size: 400px; block-size: 300px">${BIG}</line-center>`);
    const [only] = await children(page);
    expectAt(only, -200, 0);
  });
});

test.describe('direction (P6; D9)', () => {
  test('axis="horizontal" keeps one child at 150 under dir="rtl"', async ({ page }) => {
    await mount(page, sized('dir="rtl" axis="horizontal"', ONE));
    const [only] = await children(page);
    expectAt(only, 150, 0);
  });

  test('axis="vertical" places three width-set children at the right edge under dir="rtl"', async ({ page }) => {
    await mount(page, sized('dir="rtl" axis="vertical"', THREE));
    const boxes = await children(page);
    expect(boxes.map((box) => Math.round(box.x))).toEqual([340, 280, 310]);
    expect(boxes.map((box) => Math.round(box.y))).toEqual([105, 135, 165]);
  });
});

test.describe('in a line-stack (P4; F9)', () => {
  test('a 400 px vertical Stack at its default align: the child at 150,0 inside the host', async ({ page }) => {
    await mount(page, `<line-stack style="inline-size: 400px"><line-center>${ONE}</line-center></line-stack>`);
    expectAt((await children(page))[0], 150, 0);
  });

  test('a 1000 × 300 horizontal Stack at its default align: the child at 0,130 inside the host', async ({ page }) => {
    await mount(
      page,
      `<line-stack orientation="horizontal" style="inline-size: 1000px; block-size: 300px"><line-center>${ONE}</line-center></line-stack>`,
    );
    expectAt((await children(page))[0], 0, 130);
  });

  for (const orientation of ['vertical', 'horizontal'] as const) {
    test(`align="center" on a ${orientation} Stack sizes the host to its child`, async ({ page }) => {
      await mount(
        page,
        `<line-stack orientation="${orientation}" align="center" style="inline-size: 1000px; block-size: 300px"><line-center>${ONE}</line-center></line-stack>`,
      );
      const host = await boxOf(page, 'main line-center', 'main line-stack');
      expect([host.width, host.height]).toEqual([100, 40]);
    });
  }

  test('justify="stretch" on a horizontal Stack beside a 200 × 300 sibling: a 446 × 300 host, the child at 173,130', async ({
    page,
  }) => {
    await mount(
      page,
      `<line-stack orientation="horizontal" justify="stretch" style="inline-size: 1000px; block-size: 300px"><line-center>${ONE}</line-center><div style="inline-size: 200px; block-size: 300px"></div></line-stack>`,
    );
    const host = await boxOf(page, 'main line-center', 'main line-stack');
    expect([host.width, host.height]).toEqual([446, 300]);
    expectAt((await children(page))[0], 173, 130);
  });

  test('justify="stretch" and align="center" on the horizontal Stack: a 446 × 40 host at y 130, the child at 173,0', async ({
    page,
  }) => {
    await mount(
      page,
      `<line-stack orientation="horizontal" justify="stretch" align="center" style="inline-size: 1000px; block-size: 300px"><line-center>${ONE}</line-center><div style="inline-size: 200px; block-size: 300px"></div></line-stack>`,
    );
    const host = await boxOf(page, 'main line-center', 'main line-stack');
    expect([host.width, host.height]).toEqual([446, 40]);
    expect(host.y).toBeCloseTo(130, 0);
    expectAt((await children(page))[0], 173, 0);
  });

  for (const [attributes, size, hostX, child] of [
    ['', [400, 40], 0, [150, 0]],
    ['justify="stretch"', [400, 300], 0, [150, 130]],
    ['justify="stretch" align="center"', [100, 300], 150, [0, 130]],
  ] as const) {
    test(`a 400 × 300 vertical Stack with ${attributes || 'its default justify'}: a ${size.join(' × ')} host`, async ({
      page,
    }) => {
      await mount(
        page,
        `<line-stack ${attributes} style="inline-size: 400px; block-size: 300px"><line-center>${ONE}</line-center></line-stack>`,
      );
      const host = await boxOf(page, 'main line-center', 'main line-stack');
      expect([host.width, host.height]).toEqual([...size]);
      expect(host.x).toBeCloseTo(hostX, 0);
      expectAt((await children(page))[0], child[0], child[1]);
    });
  }
});

test.describe('height and context (P4; F9)', () => {
  test('in a 1000 × 300 flex row the host is as wide as its child, and flex: 1 centres it at 450,130', async ({
    page,
  }) => {
    await mount(
      page,
      `<div id="row" style="display: flex; inline-size: 1000px; block-size: 300px"><line-center>${ONE}</line-center></div>`,
    );
    const host = await boxOf(page, 'main line-center', '#row');
    expect([host.width, host.height]).toEqual([100, 300]);
    expectAt((await children(page))[0], 0, 130);
    await page.locator('main line-center').evaluate((el) => {
      (el as HTMLElement).style.flex = '1';
    });
    expectAt((await children(page))[0], 450, 130);
  });

  test('in a block parent the host is as tall as its child, and min-block-size: 100% centres it at 150,130', async ({
    page,
  }) => {
    await mount(
      page,
      `<div id="parent" style="inline-size: 400px; block-size: 300px"><line-center>${ONE}</line-center></div>`,
    );
    const host = await boxOf(page, 'main line-center', '#parent');
    expect([host.width, host.height]).toEqual([400, 40]);
    expectAt((await children(page))[0], 150, 0);
    await page.locator('main line-center').evaluate((el) => {
      (el as HTMLElement).style.minBlockSize = '100%';
    });
    expectAt((await children(page))[0], 150, 130);
  });
});

test.describe('consumer CSS and hidden (P5; D3; F3)', () => {
  test('a consumer justify-content: flex-end beats :host', async ({ page }) => {
    await mount(page, `<style>line-center.end { justify-content: flex-end; }</style>${sized('class="end"', ONE)}`);
    expectAt((await children(page))[0], 150, 260);
  });

  test('<line-center hidden> renders nothing', async ({ page }) => {
    await mount(page, `<line-center hidden>${ONE}</line-center>`);
    const center = page.locator('main line-center');
    expect(await center.evaluate((el) => getComputedStyle(el).display)).toBe('none');
    expect(await center.boundingBox()).toBeNull();
  });

  test('a consumer display rule shows a hidden Center, and its :not([hidden]) form keeps it hidden', async ({
    page,
  }) => {
    await mount(
      page,
      `<style>
        line-center.shown { display: inline-flex; }
        line-center.kept:not([hidden]) { display: inline-flex; }
      </style>
      <line-center id="shown" class="shown" hidden>${ONE}</line-center>
      <line-center id="kept" class="kept" hidden>${ONE}</line-center>
      <line-center id="open" class="kept">${ONE}</line-center>`,
    );
    const display = (id: string) => page.locator(id).evaluate((el) => getComputedStyle(el).display);
    expect(await display('#shown')).toBe('inline-flex');
    expect(await display('#kept')).toBe('none');
    expect(await display('#open')).toBe('inline-flex');
  });
});

test.describe('keyboard (SD99; D6)', () => {
  test('Tab skips the host', async ({ page, browserName }) => {
    await mount(
      page,
      `<button type="button" id="before">Before</button><line-center id="c">${ONE}</line-center><button type="button" id="after">After</button>`,
    );
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#after')).toBeFocused();
    expect(await page.locator('#c').evaluate((el) => el.matches(':focus-within'))).toBe(false);
  });
});

test.describe('accessibility tree (ariaSnapshot; P1; D19)', () => {
  test('an author group is a group with its buttons, and a role-less Center adds no node', async ({ page }) => {
    await mount(
      page,
      `<div id="group"><line-center role="group" aria-label="Actions"><button type="button">Save</button><button type="button">Cancel</button></line-center></div>
      <div id="plain"><line-center><div>One</div><div>Two</div></line-center></div>`,
    );
    expect(await page.locator('#group').ariaSnapshot()).toBe(
      '- group "Actions":\n  - button "Save"\n  - button "Cancel"',
    );
    expect(await page.locator('#plain').ariaSnapshot()).toBe('- text: One Two');
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

  test('a role-less Center adds no node, and a labelled one is a named generic (P1 A, C; D19)', async ({ page }) => {
    await mount(
      page,
      `<div id="plain"><line-center><div>One</div><div>Two</div></line-center></div>
      <div id="named"><line-center aria-label="Hero"><div>One</div><div>Two</div></line-center></div>`,
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const plain = await subtree(cdp, '#plain', '#plain line-center');
    expect(plain.node).toBeUndefined();
    expect(plain.below.filter((node) => node.role?.value === 'generic')).toHaveLength(2);
    const named = await subtree(cdp, '#named', '#named line-center');
    expect(named.node?.role?.value).toBe('generic');
    expect(named.node?.name?.value).toBe('Hero');
  });
});
