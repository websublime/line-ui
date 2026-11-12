/**
 * `<line-visually-hidden>` browser tier (spec `0012-visually-hidden.md` Tests, Browser row; Phase 1 spec §7.8, §6.C.4
 * notes, §10 SD99, §12 AM-058).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `./visually-hidden`, `./badge` and `./button` subpaths with the
 * tokens and theme Badge and Button read; each test mounts its markup into `<main>`. `late.html` loads
 * `./visually-hidden` only when the test asks, so the words can be measured before the upgrade (F3). Names are read
 * with Playwright's `ariaSnapshot()` in every engine and through a CDP session in chromium only (D13); the component
 * writes no internals value, so nothing is read back through `INTERNALS`.
 *
 * @module __tests__/integration/visually-hidden/visually-hidden.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/visually-hidden/';

const HIDE = 'line-visually-hidden';

async function open(page: Page): Promise<void> {
  await page.goto(FIXTURE_URL);
  await page.evaluate(() =>
    Promise.all(['line-visually-hidden', 'line-badge', 'line-button'].map((tag) => customElements.whenDefined(tag))),
  );
}

/** Replaces the content of `<main>` and waits for every line element to render and read its slots. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    const settle = () =>
      Promise.all(
        [...main.querySelectorAll('line-visually-hidden, line-badge, line-button')].map(
          (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
        ),
      );
    await settle();
    const frame = Promise.withResolvers<number>();
    requestAnimationFrame(frame.resolve);
    await frame.promise;
    await settle();
  }, markup);
}

/** The border box of the element matched by `selector`. */
function box(page: Page, selector: string): Promise<{ width: number; height: number }> {
  return page.evaluate((sel) => {
    const { width, height } = (document.querySelector(sel) as HTMLElement).getBoundingClientRect();
    return { width, height };
  }, selector);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

const WORDS = 'these words stay hidden from sight';

test.describe('layout (P1, P3)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  for (const [label, parentStyle] of [
    ['block', 'display: block'],
    ['flex with gap', 'display: flex; gap: 10px'],
    ['grid with gap', 'display: grid; grid-template-columns: repeat(3, 60px); gap: 10px'],
    ['inline-flex with gap', 'display: inline-flex; gap: 10px'],
  ] as const) {
    test(`a 1 × 1 host leaves a ${label} parent as it is without the host`, async ({ page }) => {
      const parent = `style="${parentStyle}; inline-size: 300px; font-size: 24px; line-height: 1.5"`;
      // Both parents render at the same place in turn, so their screenshots compare pixel for pixel.
      const withHost = `<div id="p" ${parent}><span>A</span><${HIDE}>${WORDS}</${HIDE}><span id="b">B</span></div>`;
      const without = `<div id="p" ${parent}><span>A</span><span id="b">B</span></div>`;
      const measure = () =>
        page.evaluate(() => {
          const p = (document.getElementById('p') as HTMLElement).getBoundingClientRect();
          const b = (document.getElementById('b') as HTMLElement).getBoundingClientRect();
          return { width: p.width, height: p.height, bx: b.x - p.x, by: b.y - p.y };
        });

      await mount(page, withHost);
      expect(await box(page, `main ${HIDE}`)).toEqual({ width: 1, height: 1 });
      const hidden = await measure();
      const hiddenShot = await page.locator('#p').screenshot();
      await mount(page, without);
      expect(hidden).toEqual(await measure());
      expect(hiddenShot.equals(await page.locator('#p').screenshot())).toBe(true);
    });
  }

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`no scrollable overflow in a positioned scroll container, ${dir} (P3)`, async ({ page }) => {
      const container = `style="position: relative; overflow: auto; inline-size: 200px; block-size: 100px"`;
      await mount(
        page,
        `<div dir="${dir}">
          <div class="scroller" ${container}><div style="block-size: 100px"></div><${HIDE}>end words</${HIDE}></div>
          <div class="scroller" ${container}><span style="display: inline-block; inline-size: 200px; block-size: 20px"></span><${HIDE}>line words</${HIDE}></div>
        </div>`,
      );
      const sizes = await page.evaluate(() =>
        [...document.querySelectorAll('.scroller')].map((el) => [
          el.scrollWidth - el.clientWidth,
          el.scrollHeight - el.clientHeight,
        ]),
      );
      expect(sizes).toEqual([
        [0, 0],
        [0, 0],
      ]);
    });

    test(`no document overflow after a 100vh block, ${dir} (P3)`, async ({ page }) => {
      await page.evaluate((direction) => {
        document.documentElement.dir = direction;
        document.body.style.margin = '0';
      }, dir);
      await mount(page, `<div style="block-size: 100vh"></div><${HIDE}>page end words</${HIDE}>`);
      const overflow = await page.evaluate(() => {
        const root = document.scrollingElement as HTMLElement;
        return [root.scrollWidth - root.clientWidth, root.scrollHeight - root.clientHeight];
      });
      expect(overflow).toEqual([0, 0]);
    });
  }
});

const NAMES = `<button type="button" id="native">Inbox<${HIDE}> 5 unread messages</${HIDE}></button>
  <a href="#pricing" id="link">Read more<${HIDE}> about pricing</${HIDE}></a>
  <h2 id="heading"><${HIDE}>Account settings</${HIDE}></h2>
  <line-button id="default">Archive<${HIDE}> the Quarterly report</${HIDE}></line-button>
  <line-button id="suffix">Inbox <span slot="suffix">12<${HIDE}> new messages</${HIDE}></span></line-button>
  <button type="button" id="removed">Inbox<${HIDE} hidden> 5 unread messages</${HIDE}></button>
  <button type="button" id="badge-native">Inbox <line-badge>5<${HIDE}> unread messages</${HIDE}></line-badge></button>
  <line-button id="badge-line">Inbox <line-badge slot="suffix">5<${HIDE}> unread messages</${HIDE}></line-badge></line-button>`;

test.describe('screen-reader pass (ariaSnapshot; P2, P6, P7)', () => {
  test('hidden words join the name of a button, a link, a heading and <line-button> in both slots', async ({
    page,
  }) => {
    await open(page);
    await mount(page, NAMES);
    const snapshot = (selector: string) => page.locator(selector).ariaSnapshot();
    expect(await snapshot('#native')).toBe('- button "Inbox 5 unread messages"');
    expect(await snapshot('#link')).toContain('link "Read more about pricing"');
    expect(await snapshot('#heading')).toBe('- heading "Account settings" [level=2]');
    expect(await snapshot('#default')).toContain('button "Archive the Quarterly report"');
    expect(await snapshot('#suffix')).toContain('button "Inbox 12 new messages"');
  });

  test('hidden removes the words from the name of the button', async ({ page }) => {
    await open(page);
    await mount(page, NAMES);
    expect(await page.locator('#removed').ariaSnapshot()).toBe('- button "Inbox"');
  });

  test('the Badge case: hidden words in <line-badge> join the name of a native button and of <line-button> (P6; F4)', async ({
    page,
  }) => {
    await open(page);
    await mount(page, NAMES);
    expect(await page.locator('#badge-native').ariaSnapshot()).toBe('- button "Inbox 5 unread messages"');
    expect(await page.locator('#badge-line').ariaSnapshot()).toContain('button "Inbox 5 unread messages"');
    // The hidden words leave the badge's box as it is without them (P6).
    await mount(
      page,
      `<line-badge id="with">5<${HIDE}> unread messages</${HIDE}></line-badge> <line-badge id="without">5</line-badge>`,
    );
    expect(await box(page, '#with')).toEqual(await box(page, '#without'));
  });
});

test.describe('focus reveal (P4; F2)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<${HIDE} id="skip"><a href="#main-content">Skip to main content</a></${HIDE}>
      <a href="#home" id="home">Home</a>
      <div id="main-content" tabindex="-1"><${HIDE} id="title"><h1 tabindex="-1">Page title</h1></${HIDE}></div>`,
    );
  });

  test('Tab reaches a slotted link and reveals it; a second Tab hides it again', async ({ page, browserName }) => {
    expect(await box(page, '#skip')).toEqual({ width: 1, height: 1 });
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#skip a')).toBeFocused();
    const shown = await box(page, '#skip');
    expect(shown.width).toBeGreaterThan(1);
    expect(shown.height).toBeGreaterThan(1);
    await expect(page.locator('#skip a')).toBeVisible();

    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#home')).toBeFocused();
    expect(await box(page, '#skip')).toEqual({ width: 1, height: 1 });
  });

  test('focus from script reveals a slotted heading', async ({ page }) => {
    expect(await box(page, '#title')).toEqual({ width: 1, height: 1 });
    await page.locator('#title h1').evaluate((h1: HTMLElement) => h1.focus());
    const shown = await box(page, '#title');
    expect(shown.width).toBeGreaterThan(1);
    expect(shown.height).toBeGreaterThan(1);
    await page.locator('#home').evaluate((link: HTMLElement) => link.focus());
    expect(await box(page, '#title')).toEqual({ width: 1, height: 1 });
  });

  test('Tab skips an empty host (SD99)', async ({ page, browserName }) => {
    await mount(
      page,
      `<button type="button" id="before">Before</button><${HIDE} id="empty"></${HIDE}><button type="button" id="after">After</button>`,
    );
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#after')).toBeFocused();
    expect(await page.locator('#empty').evaluate((el) => el.matches(':focus-within'))).toBe(false);
  });
});

test.describe('consumer CSS (P5, P7; F3, F6)', () => {
  test('consumer CSS on the host shows the content', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<style>
        line-visually-hidden.unhide {
          position: static;
          inline-size: auto;
          block-size: auto;
          overflow: visible;
          clip-path: none;
          white-space: inherit;
        }
      </style>
      <${HIDE} class="unhide">Shown words</${HIDE}>`,
    );
    const host = page.locator(`main ${HIDE}`);
    expect(await host.evaluate((el) => getComputedStyle(el).position)).toBe('static');
    const shown = await box(page, `main ${HIDE}`);
    expect(shown.width).toBeGreaterThan(1);
    await expect(host).toBeVisible();
  });

  test('the consumer :not(:defined) rule hides the words before the module loads late', async ({ page }) => {
    await page.goto(`${FIXTURE_URL}late.html`);
    const state = () =>
      page.evaluate(() =>
        ['#ruled', '#bare'].map((scope) => {
          const host = document.querySelector(`${scope} line-visually-hidden`) as HTMLElement;
          const { width, height } = host.getBoundingClientRect();
          return { defined: host.matches(':defined'), position: getComputedStyle(host).position, width, height };
        }),
      );

    const [ruledBefore, bareBefore] = await state();
    expect(ruledBefore).toEqual({ defined: false, position: 'absolute', width: 1, height: 1 });
    expect(bareBefore?.defined).toBe(false);
    expect(bareBefore?.position).toBe('static');
    expect(bareBefore?.width).toBeGreaterThan(1);
    expect(await page.locator('#with-rule').ariaSnapshot()).toBe('- button "Inbox 5 unread messages"');

    await page.evaluate(async () => {
      await (window as unknown as { lineLoad: () => Promise<unknown> }).lineLoad();
      await customElements.whenDefined('line-visually-hidden');
      await Promise.all(
        [...document.querySelectorAll('line-visually-hidden')].map(
          (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
        ),
      );
    });
    for (const after of await state()) {
      expect(after).toEqual({ defined: true, position: 'absolute', width: 1, height: 1 });
    }
    expect(await page.locator('#with-rule').ariaSnapshot()).toBe('- button "Inbox 5 unread messages"');
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
}

/** The node of the element matched by `selector`, from `getPartialAXTree`, which also returns an ignored element. */
async function axNode(cdp: CDPSession, selector: string): Promise<AXNode> {
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const partial = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  return partial.nodes[0] as AXNode;
}

/** Role and name of every unignored node below `node` in the full tree, as `role:name`. */
async function descendants(cdp: CDPSession, node: AXNode): Promise<string[]> {
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AXNode[] };
  const byId = new Map(nodes.map((each) => [each.nodeId, each]));
  const found: string[] = [];
  const queue = [...(byId.get(node.nodeId)?.childIds ?? node.childIds ?? [])];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const child = byId.get(id);
    if (!child) continue;
    if (!child.ignored) found.push(`${child.role?.value}:${child.name?.value ?? ''}`);
    queue.push(...(child.childIds ?? []));
  }
  return found;
}

/** `role:name` of the node itself, or of the first node with `role` below it (the inner button of `<line-button>`). */
async function named(cdp: CDPSession, selector: string, role: string): Promise<string | undefined> {
  const node = await axNode(cdp, selector);
  if (node.role?.value === role) return `${role}:${node.name?.value ?? ''}`;
  return (await descendants(cdp, node)).find((each) => each.startsWith(`${role}:`));
}

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('the names of the button, link, heading, <line-button> slots, hidden host and Badge case (P2, P6, P7; D13)', async ({
    page,
  }) => {
    await open(page);
    await mount(page, NAMES);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    expect(await named(cdp, '#native', 'button')).toBe('button:Inbox 5 unread messages');
    expect(await named(cdp, '#link', 'link')).toBe('link:Read more about pricing');
    expect(await named(cdp, '#heading', 'heading')).toBe('heading:Account settings');
    expect(await named(cdp, '#default', 'button')).toBe('button:Archive the Quarterly report');
    expect(await named(cdp, '#suffix', 'button')).toBe('button:Inbox 12 new messages');
    expect(await named(cdp, '#removed', 'button')).toBe('button:Inbox');
    expect(await named(cdp, '#badge-native', 'button')).toBe('button:Inbox 5 unread messages');
    expect(await named(cdp, '#badge-line', 'button')).toBe('button:Inbox 5 unread messages');
  });

  test('an empty host adds no named node and no text to its parent (C8)', async ({ page }) => {
    await open(page);
    await mount(page, `<div id="with">Before <${HIDE}></${HIDE}>after</div><div id="without">Before after</div>`);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    // Every named node below the parent is its text; the text reads the same as the parent without the host.
    const read = async (selector: string) => {
      const named = (await descendants(cdp, await axNode(cdp, selector))).filter((each) => !each.endsWith(':'));
      const text = named
        .filter((each) => each.startsWith('StaticText:'))
        .map((each) => each.slice('StaticText:'.length))
        .join('');
      return { roles: [...new Set(named.map((each) => each.split(':')[0]))], text };
    };
    expect(await read('#with')).toEqual({ roles: ['StaticText', 'InlineTextBox'], text: 'Before after' });
    expect(await read('#without')).toEqual({ roles: ['StaticText', 'InlineTextBox'], text: 'Before after' });
  });
});
