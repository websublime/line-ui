/**
 * `<line-skeleton>` browser tier (spec `0016-skeleton.md` Tests, Browser and Browser (colour) rows; Phase 1 spec
 * §7.8, §10 SD99, §12 AM-058).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `./skeleton` subpath with the token families it reads and the
 * theme; each test mounts its markup into `<main>`. `pre-upgrade.html` loads `./skeleton` only when the test asks.
 * The empty tree is read with Playwright's `ariaSnapshot()` in every engine and through a CDP session in chromium
 * only (D16). The component writes no internals value, so nothing is read back through `INTERNALS`. Each `wave`
 * colour read pauses the animation at half its duration first, as probe P2 did.
 *
 * @module __tests__/integration/skeleton/skeleton.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/skeleton/';

/** The consumer colours of the colour tests (D21). */
const FILL = 'rgb(255, 0, 170)';
const BAND = 'rgb(0, 255, 0)';
/**
 * `line-colors` is not a `line-components` dependency, so the page sets the gray steps the role aliases read, as the
 * Badge and Alert browser tiers do (spec 0007-badge.md Tests).
 */
const PALETTE = '<style>html { --line-gray-2: rgb(249, 249, 248); --line-gray-3: rgb(233, 232, 230); }</style>';
const CONSUMER = `${PALETTE}<style>
  line-skeleton.c { --line-skeleton-bg: ${FILL}; --line-skeleton-wave-color: ${BAND}; }
  .ancestor { --line-skeleton-bg: ${FILL}; --line-skeleton-wave-color: ${BAND}; }
</style>`;

async function open(page: Page): Promise<void> {
  await page.goto(FIXTURE_URL);
  await page.evaluate(() => customElements.whenDefined('line-skeleton'));
}

/** Replaces the content of `<main>` and waits for every skeleton to render. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    const settle = () =>
      Promise.all(
        [...main.querySelectorAll('line-skeleton')].map(async (el) => {
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

interface ItemState {
  names: string[];
  iterations: (number | null)[];
  endTimes: (number | null)[];
  directions: string[];
  backgroundColor: string;
  backgroundImage: string;
  width: number;
  height: number;
}

/**
 * The state of item `index` of the host matched by `selector`. `at` pauses its first animation at that fraction of
 * one iteration before the read, and `finish` moves it to its end.
 */
function item(page: Page, selector: string, options: { index?: number; at?: number; finish?: boolean } = {}) {
  return page.evaluate(
    ({ sel, index, at, finish }) => {
      const host = document.querySelector(sel) as HTMLElement;
      const el = host.shadowRoot?.querySelectorAll('[part="item"]')[index] as HTMLElement;
      const animations = el.getAnimations();
      const first = animations[0];
      if (first && at !== undefined) {
        first.pause();
        const duration = Number(first.effect?.getComputedTiming().duration ?? 0);
        first.currentTime = duration * at;
      }
      if (first && finish) first.finish();
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        names: el.getAnimations().map((animation) => (animation as CSSAnimation).animationName),
        iterations: animations.map((animation) => {
          const value = animation.effect?.getComputedTiming().iterations;
          return value === undefined ? null : Number(value);
        }),
        endTimes: animations.map((animation) => {
          const value = animation.effect?.getComputedTiming().endTime;
          return value === undefined ? null : Number(value);
        }),
        directions: animations.map((animation) => String(animation.effect?.getComputedTiming().direction)),
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        width: rect.width,
        height: rect.height,
      } satisfies ItemState;
    },
    { sel: selector, index: options.index ?? 0, at: options.at, finish: options.finish ?? false },
  );
}

/** Every item box of the host matched by `selector`. */
function boxes(page: Page, selector: string): Promise<{ width: number; height: number }[]> {
  return page.evaluate((sel) => {
    const host = document.querySelector(sel) as HTMLElement;
    return [...(host.shadowRoot?.querySelectorAll('[part="item"]') ?? [])].map((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
  }, selector);
}

/** How the page computes `color` as a background colour, read from a throwaway element under `parent`. */
function resolved(page: Page, color: string, parent = 'main'): Promise<string> {
  return page.evaluate(
    ({ value, under }) => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = value;
      document.querySelector(under)?.append(probe);
      const computed = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return computed;
    },
    { value: color, under: parent },
  );
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

test.describe('an empty tree (ariaSnapshot; P1; F1, D16)', () => {
  test('a skeleton alone and in a busy section adds nothing to the snapshot', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<div id="alone"><line-skeleton shape="text" lines="3"></line-skeleton></div>
      <section id="busy" aria-busy="true" aria-label="Profile"><line-skeleton shape="circle"></line-skeleton><line-skeleton lines="2"></line-skeleton></section>`,
    );
    expect(await page.locator('#alone').ariaSnapshot()).toBe('');
    expect(await page.locator('#busy').ariaSnapshot()).toBe('- region "Profile"');
  });
});

interface AXValue {
  value?: unknown;
}

interface AXNode {
  nodeId: string;
  ignored: boolean;
  role?: AXValue;
  properties?: { name: string; value: AXValue }[];
  childIds?: string[];
  backendDOMNodeId?: number;
}

/**
 * The full-tree node of the element matched by `selector` and every node below it, found through `DOM.describeNode`
 * from a wrapper, as probe P1 walked. A CDP query aimed at the host itself makes Chromium include it as a `generic`,
 * so the walk starts at the element around it.
 */
async function subtree(cdp: CDPSession, selector: string): Promise<{ node: AXNode | undefined; below: AXNode[] }> {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { node: dom } = await cdp.send('DOM.describeNode', { nodeId });
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AXNode[] };
  const byId = new Map(nodes.map((each) => [each.nodeId, each]));
  const node = nodes.find((each) => each.backendDOMNodeId === dom.backendNodeId);
  const below: AXNode[] = [];
  const queue = [...(node?.childIds ?? [])];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const child = byId.get(id);
    if (!child) continue;
    below.push(child);
    queue.push(...(child.childIds ?? []));
  }
  return { node, below };
}

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('no node under the host, and busy on the region (P1 B0, B1; D16)', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<div id="alone"><line-skeleton shape="text" lines="3"></line-skeleton></div>
      <section id="busy" aria-busy="true" aria-label="Profile"><line-skeleton shape="circle"></line-skeleton><line-skeleton lines="2"></line-skeleton></section>`,
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const alone = await subtree(cdp, '#alone');
    expect(alone.below.length).toBeGreaterThan(0);
    expect(alone.below.filter((node) => !node.ignored)).toEqual([]);
    const region = await subtree(cdp, '#busy');
    expect(region.node?.role?.value).toBe('region');
    // Chromium reports the property as `busy=1` (P1 B1).
    expect(region.node?.properties?.find((property) => property.name === 'busy')?.value.value).toBe(1);
    expect(region.below.length).toBeGreaterThan(0);
    expect(region.below.filter((node) => !node.ignored)).toEqual([]);
  });
});

test.describe('keyboard (SD99; D7)', () => {
  test('Tab skips the host', async ({ page, browserName }) => {
    await open(page);
    await mount(
      page,
      `<button type="button" id="before">Before</button><line-skeleton id="s"></line-skeleton><button type="button" id="after">After</button>`,
    );
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#after')).toBeFocused();
    expect(await page.locator('#s').evaluate((el) => el.matches(':focus-within'))).toBe(false);
  });
});

test.describe('motion (P2, P4; F2, F3, F4, D17)', () => {
  test('pulse by default, wave and none, two iterations ending at 4000 ms', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<line-skeleton id="pulse"></line-skeleton><line-skeleton id="wave" animation="wave"></line-skeleton><line-skeleton id="none" animation="none"></line-skeleton>`,
    );
    const pulse = await item(page, '#pulse');
    expect(pulse.names).toEqual(['line-skeleton-pulse']);
    expect(pulse.iterations).toEqual([2]);
    expect(pulse.endTimes).toEqual([4000]);
    expect(pulse.directions).toEqual(['normal']);
    const wave = await item(page, '#wave');
    expect(wave.names).toEqual(['line-skeleton-wave']);
    expect(wave.iterations).toEqual([2]);
    expect(wave.endTimes).toEqual([4000]);
    expect((await item(page, '#none')).names).toEqual([]);
  });

  test('the wave reverses under dir="rtl"', async ({ page }) => {
    await open(page);
    await mount(page, `<div dir="rtl"><line-skeleton id="w" animation="wave"></line-skeleton></div>`);
    expect((await item(page, '#w')).directions).toEqual(['reverse']);
  });

  test('a wave paints its band while it runs and rests on the plain fill after endTime (D17)', async ({ page }) => {
    await open(page);
    await mount(page, `${PALETTE}<line-skeleton id="w" animation="wave"></line-skeleton>`);
    const running = await item(page, '#w', { at: 0.5 });
    expect(running.backgroundImage).toContain('gradient');
    const ended = await item(page, '#w', { finish: true });
    expect(ended.names).toEqual([]);
    expect(ended.backgroundImage).toBe('none');
    expect(ended.backgroundColor).toBe(await resolved(page, 'var(--line-gray-bg)'));
  });

  test('reduced motion leaves no animation and no band, and a page ::part(item) rule restores motion (F3; D18)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await mount(
      page,
      `<style>
        @keyframes page-pulse { 50% { opacity: 0.5; } }
        line-skeleton.keep::part(item) { animation: page-pulse 2s ease-in-out 2; }
      </style>
      <line-skeleton id="pulse"></line-skeleton><line-skeleton id="wave" animation="wave"></line-skeleton>
      <line-skeleton id="keep" class="keep"></line-skeleton>`,
    );
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    expect((await item(page, '#pulse')).names).toEqual([]);
    const wave = await item(page, '#wave');
    expect(wave.names).toEqual([]);
    expect(wave.backgroundImage).toBe('none');
    expect((await item(page, '#keep')).names).toEqual(['page-pulse']);
  });
});

test.describe('layout and tokens (P7; F5, F8, D6, D8)', () => {
  test('the defaults apply with no shape or animation attribute, after the upgrade (P10)', async ({ page }) => {
    await open(page);
    await mount(page, `${PALETTE}<div style="inline-size: 400px"><line-skeleton id="s"></line-skeleton></div>`);
    expect(await page.locator('#s').evaluate((el) => el.getAttributeNames())).toEqual(['id']);
    const state = await item(page, '#s');
    expect(state.names).toEqual(['line-skeleton-pulse']);
    expect({ width: state.width, height: state.height }).toEqual({ width: 400, height: 20 });
    const radius = await page
      .locator('#s')
      .evaluate((el) => getComputedStyle(el.shadowRoot?.querySelector('[part="item"]') as Element).borderRadius);
    expect(radius).toBe('5px');
    expect(state.backgroundColor).toBe(await resolved(page, 'var(--line-gray-bg)'));
  });

  test('token overrides on the host apply', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<div style="inline-size: 400px"><line-skeleton id="s" style="--line-skeleton-inline-size: 40%; --line-skeleton-block-size: var(--line-size-6); --line-skeleton-radius: 0px"></line-skeleton></div>`,
    );
    const state = await item(page, '#s');
    // --line-size-6 is 1.75rem.
    expect({ width: state.width, height: state.height }).toEqual({ width: 160, height: 28 });
  });

  test('text lines match the line boxes of real text in a 16 px and a 2rem font', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<div style="inline-size: 400px; font-size: 16px; line-height: 1.5">
        <p id="p1" style="margin: 0"><line-skeleton id="t1" shape="text" lines="3"></line-skeleton></p>
        <p id="r1" style="margin: 0">One<br />Two<br />Three</p>
        <h2 id="p2" style="margin: 0; font-size: 2rem; line-height: 1.2"><line-skeleton id="t2" shape="text" lines="2"></line-skeleton></h2>
        <h2 id="r2" style="margin: 0; font-size: 2rem; line-height: 1.2">One<br />Two</h2>
      </div>`,
    );
    const height = (selector: string) => page.locator(selector).evaluate((el) => el.getBoundingClientRect().height);
    expect(Math.abs((await height('#p1')) - (await height('#r1')))).toBeLessThanOrEqual(0.1);
    expect(Math.abs((await height('#p2')) - (await height('#r2')))).toBeLessThanOrEqual(0.1);
    const lines = await boxes(page, '#t1');
    expect(lines.map((box) => box.height)).toEqual([16, 16, 16]);
    expect(lines.map((box) => box.width)).toEqual([400, 400, 240]);
  });

  test('circle is square, and every item of shape="circle" lines="3" is square', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<div style="inline-size: 400px"><line-skeleton id="c" shape="circle"></line-skeleton><line-skeleton id="c3" shape="circle" lines="3"></line-skeleton></div>`,
    );
    expect(await boxes(page, '#c')).toEqual([{ width: 48, height: 48 }]);
    expect(await boxes(page, '#c3')).toEqual([
      { width: 48, height: 48 },
      { width: 48, height: 48 },
      { width: 48, height: 48 },
    ]);
  });

  test('hidden hides the host', async ({ page }) => {
    await open(page);
    await mount(page, '<line-skeleton id="s" hidden></line-skeleton>');
    expect(await page.locator('#s').evaluate((el) => getComputedStyle(el).display)).toBe('none');
  });
});

test.describe('colour (P2 and P4 addenda; D20, D21)', () => {
  const HOSTS = `${CONSUMER}
    <line-skeleton id="cp" class="c"></line-skeleton>
    <line-skeleton id="cw" class="c" animation="wave"></line-skeleton>
    <line-skeleton id="dp"></line-skeleton>
    <line-skeleton id="dw" animation="wave"></line-skeleton>
    <div class="ancestor"><line-skeleton id="ap"></line-skeleton><line-skeleton id="aw" animation="wave"></line-skeleton></div>`;

  test('a consumer rule on the host wins, and the defaults hold elsewhere', async ({ page }) => {
    await open(page);
    await mount(page, HOSTS);
    const grayBg = await resolved(page, 'var(--line-gray-bg)');
    const graySurface = await resolved(page, 'var(--line-gray-surface)');
    expect((await item(page, '#cp')).backgroundColor).toBe(FILL);
    const consumerWave = (await item(page, '#cw', { at: 0.5 })).backgroundImage;
    expect(consumerWave.indexOf(FILL)).toBeGreaterThan(-1);
    expect(consumerWave.indexOf(BAND)).toBeGreaterThan(consumerWave.indexOf(FILL));
    expect(consumerWave.lastIndexOf(FILL)).toBeGreaterThan(consumerWave.indexOf(BAND));

    expect((await item(page, '#dp')).backgroundColor).toBe(grayBg);
    const defaultWave = (await item(page, '#dw', { at: 0.5 })).backgroundImage;
    expect(defaultWave).toContain(grayBg);
    expect(defaultWave).toContain(graySurface);

    expect((await item(page, '#ap')).backgroundColor).toBe(grayBg);
    const ancestorWave = (await item(page, '#aw', { at: 0.5 })).backgroundImage;
    expect(ancestorWave).toContain(graySurface);
    expect(ancestorWave).not.toContain(FILL);
    expect(ancestorWave).not.toContain(BAND);
  });

  test('tokens set on :root leave the defaults in place', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `${PALETTE}<style>:root { --line-skeleton-bg: ${FILL}; --line-skeleton-wave-color: ${BAND}; }</style><line-skeleton id="r"></line-skeleton>`,
    );
    expect((await item(page, '#r')).backgroundColor).toBe(await resolved(page, 'var(--line-gray-bg)'));
  });

  test('Chromium forced colors give a GrayText fill and no band, with and without consumer tokens', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'forced colors are emulated in Chromium only (P4)');
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    await mount(page, HOSTS);
    const grayText = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = 'GrayText';
      document.body.append(probe);
      const computed = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return computed;
    });
    for (const id of ['#cp', '#dp', '#ap']) {
      const state = await item(page, id);
      expect([id, state.backgroundColor, state.backgroundImage]).toEqual([id, grayText, 'none']);
    }
    for (const id of ['#cw', '#dw', '#aw']) {
      const state = await item(page, id, { at: 0.5 });
      expect([id, state.backgroundColor, state.backgroundImage]).toEqual([id, grayText, 'none']);
    }
  });
});

test.describe('before the upgrade (P6; D19)', () => {
  test('a bare host is 0 px tall, and the documented :not(:defined) rule reserves --line-size-4', async ({ page }) => {
    await page.goto(`${FIXTURE_URL}pre-upgrade.html`);
    const height = () =>
      page.evaluate(() => {
        const host = document.querySelector('#host') as HTMLElement;
        return { defined: host.matches(':defined'), height: host.getBoundingClientRect().height };
      });
    // The token module is imported by a module script; wait until it applies.
    await expect
      .poll(() =>
        page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--line-size-4').trim()),
      )
      .not.toBe('');
    expect(await height()).toEqual({ defined: false, height: 20 });
    await page.evaluate(() => {
      (document.querySelector('#rule') as HTMLStyleElement).disabled = true;
    });
    expect(await height()).toEqual({ defined: false, height: 0 });
    await page.evaluate(() => {
      (document.querySelector('#rule') as HTMLStyleElement).disabled = false;
    });

    await page.evaluate(async () => {
      await (window as unknown as { lineLoad: () => Promise<unknown> }).lineLoad();
      await customElements.whenDefined('line-skeleton');
      await (document.querySelector('#host') as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    });
    expect(await height()).toEqual({ defined: true, height: 20 });
  });
});
