/**
 * `<line-kbd>` browser tier (spec `0015-kbd.md` Tests, Browser row; Phase 1 spec §7.8, §10 SD99, §12 AM-058).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `./kbd` and `./button` subpaths with the tokens and the theme;
 * each test mounts its markup into `<main>`. `no-theme.html` leaves `line-themes` out, and `pre-upgrade.html` loads
 * `./kbd` only when the test asks. Names are read with Playwright's `ariaSnapshot()` in every engine and through a
 * CDP session in chromium only (D16). Every case sets the platform by attribute, except the `auto` cases: one
 * compares the drawing with the page's own reading in each engine, and one overrides the platform through CDP in
 * chromium (P1). The component writes no internals value, so nothing is read back through `INTERNALS`.
 *
 * @module __tests__/integration/kbd/kbd.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/kbd/';

async function open(page: Page, path = ''): Promise<void> {
  await page.goto(`${FIXTURE_URL}${path}`);
  await page.evaluate(() => customElements.whenDefined('line-kbd'));
}

/** Replaces the content of `<main>` and waits for every line element to render. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    const settle = () =>
      Promise.all(
        [...main.querySelectorAll('line-kbd, line-button')].map(async (el) => {
          await customElements.whenDefined(el.localName);
          await (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
        }),
      );
    await settle();
    const frame = Promise.withResolvers<number>();
    requestAnimationFrame(frame.resolve);
    await frame.promise;
    await settle();
  }, markup);
}

/** The text the host's shadow root shows: every text node outside the hidden `.word` spans. */
function drawn(page: Page, selector: string): Promise<string> {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel)?.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let text = '';
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.parentElement?.closest('.word')) text += node.textContent;
    }
    return text;
  }, selector);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

const NAMES = `<button type="button" id="apple" aria-keyshortcuts="Meta+K">Search <line-kbd keys="mod+k" platform="apple"></line-kbd></button>
  <button type="button" id="other" aria-keyshortcuts="Control+K">Search <line-kbd keys="mod+k" platform="other"></line-kbd></button>
  <button type="button" id="three">Commands <line-kbd keys="mod+shift+p" platform="other"></line-kbd></button>
  <line-button id="line">Save <line-kbd keys="mod+s" platform="apple"></line-kbd></line-button>
  <button type="button" id="sequence">Go to issues <line-kbd keys="g i" platform="other"></line-kbd></button>
  <button type="button" id="arrow">Scroll <line-kbd keys="up" platform="other"></line-kbd></button>
  <div role="menu" aria-label="Edit">
    <div role="menuitem" id="copy" tabindex="-1" aria-keyshortcuts="Meta+C">Copy <line-kbd keys="mod+c" platform="apple"></line-kbd></div>
  </div>`;

test.describe('names (ariaSnapshot; P3, P5; F4, F6)', () => {
  test('the keys are read as words in the name of the control around them', async ({ page }) => {
    await open(page);
    await mount(page, NAMES);
    const snapshot = (selector: string) => page.locator(selector).ariaSnapshot();
    expect(await snapshot('#apple')).toBe('- button "Search Command K"');
    expect(await snapshot('#other')).toBe('- button "Search Ctrl K"');
    expect(await snapshot('#three')).toBe('- button "Commands Ctrl Shift P"');
    expect(await snapshot('#line')).toContain('button "Save Command S"');
    expect(await snapshot('#sequence')).toBe('- button "Go to issues G then I"');
    expect(await snapshot('#arrow')).toBe('- button "Scroll Up Arrow"');
    expect(await snapshot('#copy')).toBe('- menuitem "Copy Command C"');
  });

  test('the drawings show the glyphs and words of the drawing table', async ({ page }) => {
    await open(page);
    await mount(page, NAMES);
    expect(await drawn(page, '#apple line-kbd')).toBe('⌘K');
    expect(await drawn(page, '#other line-kbd')).toBe('Ctrl+K');
    expect(await drawn(page, '#three line-kbd')).toBe('Ctrl+Shift+P');
    expect(await drawn(page, '#sequence line-kbd')).toBe('GI');
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
  properties?: { name: string; value: AXValue }[];
  childIds?: string[];
}

/** The node of the element matched by `selector`, from `getPartialAXTree`. */
async function axNode(cdp: CDPSession, selector: string): Promise<AXNode> {
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const partial = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  return partial.nodes[0] as AXNode;
}

/** `role:name` of the node itself, or of the first unignored node with `role` below it (`<line-button>`'s button). */
async function named(cdp: CDPSession, selector: string, role: string): Promise<string | undefined> {
  const node = await axNode(cdp, selector);
  if (node.role?.value === role) return `${role}:${node.name?.value ?? ''}`;
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AXNode[] };
  const byId = new Map(nodes.map((each) => [each.nodeId, each]));
  const queue = [...(byId.get(node.nodeId)?.childIds ?? node.childIds ?? [])];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const child = byId.get(id);
    if (!child) continue;
    if (!child.ignored && child.role?.value === role) return `${role}:${child.name?.value ?? ''}`;
    queue.push(...(child.childIds ?? []));
  }
  return undefined;
}

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('the names of the buttons, <line-button> and the menu item, and its keyshortcuts property (P3; D16; F7)', async ({
    page,
  }) => {
    await open(page);
    await mount(page, NAMES);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    expect(await named(cdp, '#apple', 'button')).toBe('button:Search Command K');
    expect(await named(cdp, '#other', 'button')).toBe('button:Search Ctrl K');
    expect(await named(cdp, '#three', 'button')).toBe('button:Commands Ctrl Shift P');
    expect(await named(cdp, '#line', 'button')).toBe('button:Save Command S');
    expect(await named(cdp, '#sequence', 'button')).toBe('button:Go to issues G then I');
    expect(await named(cdp, '#arrow', 'button')).toBe('button:Scroll Up Arrow');
    expect(await named(cdp, '#copy', 'menuitem')).toBe('menuitem:Copy Command C');
    const copy = await axNode(cdp, '#copy');
    expect(copy.properties?.find((property) => property.name === 'keyshortcuts')?.value.value).toBe('Meta+C');
    // The host adds no node of its own: it is ignored in the tree (R8 :77; D2).
    expect((await axNode(cdp, '#apple line-kbd')).ignored).toBe(true);
  });

  test('a CDP platform override to Win32 with Windows metadata makes auto draw Ctrl+K (P1)', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    const userAgent = await page.evaluate(() => navigator.userAgent);
    await cdp.send('Emulation.setUserAgentOverride', {
      userAgent,
      platform: 'Win32',
      userAgentMetadata: {
        platform: 'Windows',
        platformVersion: '10.0.0',
        architecture: 'x86',
        model: '',
        mobile: false,
      },
    });
    await open(page);
    await mount(page, '<line-kbd id="auto" keys="mod+k"></line-kbd>');
    expect(await page.evaluate(() => navigator.platform)).toBe('Win32');
    expect(await drawn(page, '#auto')).toBe('Ctrl+K');
  });
});

test.describe('platform auto (P1; F1)', () => {
  test('auto draws what the page reads from navigator, in each engine', async ({ page }) => {
    await open(page);
    await mount(page, '<line-kbd id="auto" keys="mod+k"></line-kbd>');
    const apple = await page.evaluate(() => {
      const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
      return /^(Mac|iPhone|iPad|iPod)/i.test(nav.userAgentData?.platform || nav.platform);
    });
    expect(await drawn(page, '#auto')).toBe(apple ? '⌘K' : 'Ctrl+K');
    expect(await page.locator('#auto').getAttribute('platform')).toBeNull();
  });
});

test.describe('layout and tokens (D3, D5, D6)', () => {
  test('keys are flex items with the computed tokens on a page with line-themes', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<div id="probe" style="background-color: var(--line-gray-surface); border-color: var(--line-gray-border); color: var(--line-gray-text); outline-color: var(--line-gray-text-low)"></div>
      <line-kbd id="k" keys="mod+shift+p g" platform="other"></line-kbd>`,
    );
    const read = await page.evaluate(() => {
      const probe = getComputedStyle(document.getElementById('probe') as HTMLElement);
      const host = document.getElementById('k') as HTMLElement;
      const shadow = host.shadowRoot as ShadowRoot;
      const root = getComputedStyle(shadow.querySelector('[part="root"]') as HTMLElement);
      const items = [...shadow.querySelectorAll('[part="item"]')].map((item) => getComputedStyle(item));
      const first = items[0] as CSSStyleDeclaration;
      const step = shadow.querySelector('[part="item"][data-step]') as HTMLElement;
      const separator = getComputedStyle(shadow.querySelector('[part="separator"]') as HTMLElement);
      return {
        expected: [probe.backgroundColor, probe.borderTopColor, probe.color, probe.outlineColor],
        host: getComputedStyle(host).display,
        root: [root.display, root.columnGap],
        item: [
          first.display,
          first.backgroundColor,
          first.borderTopColor,
          first.color,
          first.borderTopStyle,
          first.borderTopWidth,
          first.borderTopLeftRadius,
          first.minHeight,
          first.minWidth,
          first.paddingLeft,
          first.fontSize,
        ],
        stepMargin: getComputedStyle(step).marginInlineStart,
        separator: separator.color,
        count: items.length,
      };
    });
    const [surface, border, text, textLow] = read.expected;
    expect(read.host).toBe('inline-flex');
    // The root is a flex item of the host and each key a flex item of the root, so `inline-flex` computes to `flex`.
    expect(read.root).toEqual(['flex', '4px']);
    expect(read.item).toEqual(['flex', surface, border, text, 'solid', '1px', '5px', '20px', '20px', '4px', '12px']);
    expect(read.stepMargin).toBe('8px');
    expect(read.separator).toBe(textLow);
    expect(read.count).toBe(4);
  });

  test('an unthemed key draws its border in currentColor on a transparent fill', async ({ page }) => {
    await open(page, 'no-theme.html');
    await mount(
      page,
      '<p style="color: rgb(10, 20, 30)"><line-kbd id="k" keys="mod+k" platform="other"></line-kbd></p>',
    );
    const item = await page.evaluate(() => {
      const style = getComputedStyle(
        (document.getElementById('k') as HTMLElement).shadowRoot?.querySelector('[part="item"]') as HTMLElement,
      );
      return [style.borderTopStyle, style.borderTopWidth, style.borderTopColor, style.color, style.backgroundColor];
    });
    expect(item).toEqual(['solid', '1px', 'rgb(10, 20, 30)', 'rgb(10, 20, 30)', 'rgba(0, 0, 0, 0)']);
  });

  test('hidden hides the host', async ({ page }) => {
    await open(page);
    await mount(page, '<line-kbd id="k" keys="mod+k" platform="other" hidden></line-kbd>');
    expect(await page.locator('#k').evaluate((el) => getComputedStyle(el).display)).toBe('none');
  });
});

test.describe('before the upgrade (P7; D20)', () => {
  test('fallback text shows before the module runs, and the drawn shortcut after it', async ({ page }) => {
    await page.goto(`${FIXTURE_URL}pre-upgrade.html`);
    const state = () =>
      page.evaluate(() =>
        ['#text', '#bare'].map((selector) => {
          const host = document.querySelector(selector) as HTMLElement;
          return { defined: host.matches(':defined'), width: host.getBoundingClientRect().width };
        }),
      );
    const [textBefore, bareBefore] = await state();
    expect(textBefore?.defined).toBe(false);
    expect(textBefore?.width).toBeGreaterThan(0);
    expect(bareBefore).toEqual({ defined: false, width: 0 });
    await expect(page.locator('#text')).toHaveText('Ctrl+K');

    await page.evaluate(async () => {
      await (window as unknown as { lineLoad: () => Promise<unknown> }).lineLoad();
      await customElements.whenDefined('line-kbd');
      await Promise.all(
        [...document.querySelectorAll('line-kbd')].map(
          (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
        ),
      );
    });
    for (const after of await state()) {
      expect(after.defined).toBe(true);
      expect(after.width).toBeGreaterThan(0);
    }
    expect(await drawn(page, '#text')).toBe('Ctrl+K');
    expect(await page.locator('#text').evaluate((el) => el.shadowRoot?.querySelector('slot'))).toBeNull();
    expect(await page.locator('#text').evaluate((el) => el.shadowRoot?.querySelectorAll('[part="item"]').length)).toBe(
      2,
    );
  });
});

test.describe('keyboard (SD99; D7)', () => {
  test('Tab skips the host', async ({ page, browserName }) => {
    await open(page);
    await mount(
      page,
      `<button type="button" id="before">Before</button><line-kbd id="k" keys="mod+k" platform="other"></line-kbd><button type="button" id="after">After</button>`,
    );
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#after')).toBeFocused();
    expect(await page.locator('#k').evaluate((el) => el.matches(':focus-within'))).toBe(false);
  });
});
