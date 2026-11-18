/**
 * `<line-spinner>` browser tier (spec `0022-spinner.md` Tests, Browser row; Phase 1 spec §7.8, §6.C.4 notes `:1180`,
 * §10 SD39, SD99, §12 AM-058).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `@websublime/line-components/spinner`, `./button` and
 * `./icon-button` with the `motion`, `easings` and `sizing` tokens; `no-tokens.html` loads the spinner alone. The role
 * and name live in `ElementInternals`, so they are proved by an `INTERNALS` read-back in every engine and by a CDP
 * assertion of the Chromium tree (D18). Playwright's `ariaSnapshot()` reads no internals value (probe P1) and
 * reports `button "Save"` for a named spinner in a button too (P2), so no assertion here rests on it.
 *
 * @module __tests__/integration/spinner/spinner.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/spinner/';
const TAGS = ['line-spinner', 'line-button', 'line-icon-button'];

/** Every `size` step and its px size at the default 16 px root font (`--line-size-3` … `--line-size-8`). */
const SIZES = [
  ['1', 16],
  ['2', 20],
  ['3', 24],
  ['4', 28],
  ['5', 32],
  ['6', 48],
] as const;

/** Every `speed` and its duration in ms; no attribute and an unknown value draw `normal`. */
const SPEEDS = [
  ['slow', 2000],
  ['normal', 1000],
  ['fast', 750],
] as const;

async function open(page: Page, path = ''): Promise<void> {
  await page.goto(`${FIXTURE_URL}${path}`);
  await page.evaluate(
    (tags) => Promise.all(tags.map((tag) => customElements.get(tag) ?? customElements.whenDefined(tag))),
    path === '' ? TAGS : ['line-spinner'],
  );
}

/** Replaces the content of `<main>` and waits for every `line-*` element to be defined and updated. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    const settle = () =>
      Promise.all(
        [...main.querySelectorAll('*')]
          .filter((el) => el.localName.startsWith('line-'))
          .map(async (el) => {
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

interface Motion {
  names: string[];
  durations: number[];
  iterations: number[];
}

/** The animations `root` of the spinner matched by `selector` runs. */
function motion(page: Page, selector: string): Promise<Motion> {
  return page.evaluate((sel) => {
    const host = document.querySelector(sel) as HTMLElement;
    const root = host.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
    const animations = root.getAnimations();
    return {
      names: animations.map((animation) => (animation as CSSAnimation).animationName),
      durations: animations.map((animation) => Number(animation.effect?.getComputedTiming().duration)),
      iterations: animations.map((animation) => Number(animation.effect?.getComputedTiming().iterations)),
    };
  }, selector);
}

/** The border box of the host matched by `selector`. */
function box(page: Page, selector: string): Promise<{ width: number; height: number }> {
  return page.evaluate((sel) => {
    const { width, height } = (document.querySelector(sel) as HTMLElement).getBoundingClientRect();
    return { width, height };
  }, selector);
}

/** The four border colours of `root` in the spinner matched by `selector`. */
function borders(page: Page, selector: string): Promise<Record<'top' | 'right' | 'bottom' | 'left', string>> {
  return page.evaluate((sel) => {
    const host = document.querySelector(sel) as HTMLElement;
    const style = getComputedStyle(host.shadowRoot?.querySelector('[part="root"]') as HTMLElement);
    return {
      top: style.borderTopColor,
      right: style.borderRightColor,
      bottom: style.borderBottomColor,
      left: style.borderLeftColor,
    };
  }, selector);
}

/** How the page computes `color`, read from a throwaway element. */
function resolved(page: Page, color: string): Promise<string> {
  return page.evaluate((value) => {
    const probe = document.createElement('div');
    probe.style.color = value;
    document.body.append(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    return computed;
  }, color);
}

function expectNear(actual: number, expected: number, label: string): void {
  expect(Math.abs(actual - expected), `${label}: ${actual} vs ${expected}`).toBeLessThan(0.5);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

interface Semantics {
  role: string | null;
  ariaLabel: string | null;
  ariaHidden: string | null;
}

/** The internals `role`, `ariaLabel` and `ariaHidden` of every spinner with an id under `<main>`. */
function internals(page: Page): Promise<Record<string, Semantics>> {
  return page.evaluate(async (url) => {
    // Runtime import in the page: the fixture module the page already loaded holds the one matching Symbol.
    const { INTERNALS } = (await import(url)) as { INTERNALS: symbol };
    return Object.fromEntries(
      [...document.querySelectorAll('main line-spinner[id]')].map((el) => {
        const read = Reflect.get(el, INTERNALS) as ElementInternals;
        return [el.id, { role: read.role, ariaLabel: read.ariaLabel, ariaHidden: read.ariaHidden }];
      }),
    );
  }, `${FIXTURE_URL}fixture.ts`);
}

/** Runs `source` with `el` bound to the spinner `#s`, then waits for its update. */
function update(page: Page, source: string): Promise<void> {
  return page.evaluate(async (code) => {
    const el = document.getElementById('s') as HTMLElement & { updateComplete: Promise<unknown> };
    new Function('el', code)(el);
    await el.updateComplete;
  }, source);
}

const HIDDEN: Semantics = { role: null, ariaLabel: null, ariaHidden: 'true' };
const progressbar = (ariaLabel: string | null): Semantics => ({ role: 'progressbar', ariaLabel, ariaHidden: null });

/** The naming cases of P1, each in its own wrapper so the CDP walk starts outside the host. */
const NAMING = `<div id="w-named"><line-spinner id="named" label="Loading"></line-spinner></div>
  <div id="w-unnamed"><line-spinner id="unnamed"></line-spinner></div>
  <div id="w-blank"><line-spinner id="blank" label="  "></line-spinner></div>
  <div id="w-host"><line-spinner id="host" aria-label="Saving"></line-spinner></div>
  <div id="w-both"><line-spinner id="both" label="Loading" aria-label="Saving"></line-spinner></div>
  <span id="caption">Uploading file</span>
  <div id="w-labelledby"><line-spinner id="labelledby" aria-labelledby="caption"></line-spinner></div>`;

/** The loading-slot cases of P2 with an unnamed spinner; the IconButton glyph is a text `↻`, the fixture's choice. */
const LOADING = `<div id="w-button"><line-button id="button" loading>Save<line-spinner id="in-button" slot="loading"></line-spinner></line-button></div>
  <div id="w-icon-button"><line-icon-button id="icon-button" loading aria-label="Refresh"><span aria-hidden="true">↻</span><line-spinner id="in-icon-button" slot="loading"></line-spinner></line-icon-button></div>`;

test.describe('internals read-back (D18; Phase 1 spec :1180)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('a named, an unnamed and a blank spinner, aria-label over label, and aria-labelledby', async ({ page }) => {
    await mount(page, NAMING);
    expect(await internals(page)).toEqual({
      named: progressbar('Loading'),
      unnamed: HIDDEN,
      blank: HIDDEN,
      host: progressbar(null),
      both: progressbar('Loading'),
      labelledby: progressbar(null),
    });
  });

  test('a label changed after render, and a host aria-label added and then removed after the first render (P3)', async ({
    page,
  }) => {
    await mount(page, '<line-spinner id="s" label="Loading"></line-spinner>');
    const steps: Semantics[] = [];
    for (const source of [
      "el.label = 'Almost done'",
      "el.label = ''",
      "el.setAttribute('aria-label', 'Saving')",
      "el.removeAttribute('aria-label')",
      "el.setAttribute('aria-labelledby', 'nothing')",
      "el.removeAttribute('aria-labelledby')",
    ]) {
      await update(page, source);
      steps.push((await internals(page)).s as Semantics);
    }
    expect(steps).toEqual([progressbar('Almost done'), HIDDEN, progressbar(null), HIDDEN, progressbar(null), HIDDEN]);
  });

  test('an unnamed spinner in the loading slot of a Button and an IconButton stays hidden, and the inner button keeps aria-disabled (P2)', async ({
    page,
  }) => {
    await mount(page, LOADING);
    const values = await internals(page);
    expect(values).toEqual({ 'in-button': HIDDEN, 'in-icon-button': HIDDEN });
    const disabled = await page.evaluate(() =>
      ['button', 'icon-button'].map((id) =>
        document.getElementById(id)?.shadowRoot?.querySelector('button')?.getAttribute('aria-disabled'),
      ),
    );
    expect(disabled).toEqual(['true', 'true']);
  });

  test('the component writes no role or aria-* attribute on the host', async ({ page }) => {
    await mount(page, '<line-spinner id="s" label="Loading" size="3" speed="fast"></line-spinner>');
    expect(await page.evaluate(() => document.getElementById('s')?.getAttributeNames())).toEqual([
      'id',
      'label',
      'size',
      'speed',
    ]);
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
  backendDOMNodeId?: number;
}

/**
 * Every unignored node below the wrapper matched by `selector` in the full tree, found through `DOM.describeNode`, as
 * probe P1 walked. A CDP query aimed at the host itself makes Chromium include it as a `generic`, so the walk starts
 * at the element around it.
 */
async function below(cdp: CDPSession, selector: string): Promise<AXNode[]> {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { node: dom } = await cdp.send('DOM.describeNode', { nodeId });
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AXNode[] };
  const byId = new Map(nodes.map((each) => [each.nodeId, each]));
  const wrapper = nodes.find((each) => each.backendDOMNodeId === dom.backendNodeId);
  const found: AXNode[] = [];
  const queue = [...(wrapper?.childIds ?? [])];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const child = byId.get(id);
    if (!child) continue;
    if (!child.ignored) found.push(child);
    queue.push(...(child.childIds ?? []));
  }
  return found;
}

/** The progressbar nodes below a wrapper, as role, name and whether `valuenow` is set. */
async function progressbars(cdp: CDPSession, selector: string) {
  return (await below(cdp, selector))
    .filter((node) => node.role?.value === 'progressbar')
    .map((node) => ({
      name: node.name?.value,
      valuenow: (node.properties ?? []).some((property) => property.name === 'valuenow'),
    }));
}

test.describe('Chromium accessibility tree (CDP; D18)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('a named spinner is a progressbar with its name and no valuenow, an unnamed or blank one is no node (P1)', async ({
    page,
  }) => {
    await open(page);
    await mount(page, NAMING);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    expect(await progressbars(cdp, '#w-named')).toEqual([{ name: 'Loading', valuenow: false }]);
    expect(await below(cdp, '#w-unnamed')).toEqual([]);
    expect(await below(cdp, '#w-blank')).toEqual([]);
    expect(await progressbars(cdp, '#w-host')).toEqual([{ name: 'Saving', valuenow: false }]);
    expect(await progressbars(cdp, '#w-both')).toEqual([{ name: 'Saving', valuenow: false }]);
    expect(await progressbars(cdp, '#w-labelledby')).toEqual([{ name: 'Uploading file', valuenow: false }]);
  });

  test('the tree follows a label changed after render and a host aria-label added and removed (P3)', async ({
    page,
  }) => {
    await open(page);
    await mount(page, '<div id="w"><line-spinner id="s" label="Loading"></line-spinner></div>');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    await update(page, "el.label = 'Almost done'");
    expect(await progressbars(cdp, '#w')).toEqual([{ name: 'Almost done', valuenow: false }]);
    await update(page, "el.label = ''");
    expect(await below(cdp, '#w')).toEqual([]);
    await update(page, "el.setAttribute('aria-label', 'Saving')");
    expect(await progressbars(cdp, '#w')).toEqual([{ name: 'Saving', valuenow: false }]);
    await update(page, "el.removeAttribute('aria-label')");
    expect(await below(cdp, '#w')).toEqual([]);
  });

  test('an unnamed spinner leaves a loading Button named Save and an IconButton named Refresh, with no progressbar (P2 B1, I2)', async ({
    page,
  }) => {
    await open(page);
    await mount(page, LOADING);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    for (const [wrapper, name] of [
      ['#w-button', 'Save'],
      ['#w-icon-button', 'Refresh'],
    ] as const) {
      const nodes = await below(cdp, wrapper);
      const buttons = nodes.filter((node) => node.role?.value === 'button');
      expect(buttons.map((node) => node.name?.value)).toEqual([name]);
      expect(nodes.filter((node) => node.role?.value === 'progressbar')).toEqual([]);
    }
  });
});

test.describe('focus (D10; SD99)', () => {
  test('Tab skips the host', async ({ page, browserName }) => {
    await open(page);
    await mount(
      page,
      '<button id="before">Before</button><line-spinner label="Loading"></line-spinner><button id="after">After</button>',
    );
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('after');
  });
});

test.describe('motion (F3, F4, F5; P4, P5)', () => {
  test('root runs line-spinner-spin, 1000 ms, infinite, and 2000 and 750 ms for slow and fast; an unknown speed runs 1000 ms', async ({
    page,
  }) => {
    await open(page);
    await mount(
      page,
      `<line-spinner id="none"></line-spinner><line-spinner id="warp" speed="warp"></line-spinner>${SPEEDS.map(
        ([speed]) => `<line-spinner id="${speed}" speed="${speed}"></line-spinner>`,
      ).join('')}`,
    );
    expect(await motion(page, '#none')).toEqual({
      names: ['line-spinner-spin'],
      durations: [1000],
      iterations: [Number.POSITIVE_INFINITY],
    });
    expect((await motion(page, '#warp')).durations).toEqual([1000]);
    for (const [speed, duration] of SPEEDS) {
      expect({ speed, ...(await motion(page, `#${speed}`)) }).toEqual({
        speed,
        names: ['line-spinner-spin'],
        durations: [duration],
        iterations: [Number.POSITIVE_INFINITY],
      });
    }
  });

  test('under reduced motion every speed pulses at 2000 ms, and a page ::part(root) rule with page keyframes still runs (P5)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await mount(
      page,
      `<style>
        @keyframes page-spin { to { transform: rotate(1turn); } }
        line-spinner.keep::part(root) { animation: page-spin 2s linear infinite; }
      </style>
      <line-spinner id="none"></line-spinner>${SPEEDS.map(
        ([speed]) => `<line-spinner id="${speed}" speed="${speed}"></line-spinner>`,
      ).join('')}<line-spinner id="keep" class="keep"></line-spinner>`,
    );
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    for (const id of ['none', ...SPEEDS.map(([speed]) => speed)]) {
      const { names, durations } = await motion(page, `#${id}`);
      expect({ id, names, durations }).toEqual({ id, names: ['line-spinner-pulse'], durations: [2000] });
    }
    expect((await motion(page, '#keep')).names).toEqual(['page-spin']);
  });

  test('--line-spinner-keyframes: none stops the motion, and --line-spinner-iteration-count: 3 runs three turns (P4 A6, A8)', async ({
    page,
  }) => {
    await open(page);
    await mount(
      page,
      `<line-spinner id="still" style="--line-spinner-keyframes: none"></line-spinner>
      <line-spinner id="three" style="--line-spinner-iteration-count: 3"></line-spinner>`,
    );
    expect((await motion(page, '#still')).names).toEqual([]);
    expect(await motion(page, '#three')).toEqual({
      names: ['line-spinner-spin'],
      durations: [1000],
      iterations: [3],
    });
  });
});

test.describe('size, colour and layout (F6, F8; P6)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('steps 1–6 draw 16–48 px, an unknown size draws the text size, and no size follows a 16 or 24 px font', async ({
    page,
  }) => {
    await mount(
      page,
      `${SIZES.map(([size]) => `<line-spinner id="s${size}" size="${size}"></line-spinner>`).join('')}
      <line-spinner id="xl" size="xl"></line-spinner>
      <line-spinner id="f16"></line-spinner>
      <span style="font-size: 24px"><line-spinner id="f24"></line-spinner></span>`,
    );
    for (const [size, px] of SIZES) {
      const { width, height } = await box(page, `#s${size}`);
      expectNear(width, px, `size ${size} width`);
      expectNear(height, px, `size ${size} height`);
    }
    for (const [id, px] of [
      ['xl', 16],
      ['f16', 16],
      ['f24', 24],
    ] as const) {
      const { width, height } = await box(page, `#${id}`);
      expectNear(width, px, `${id} width`);
      expectNear(height, px, `${id} height`);
    }
  });

  test('a parent colour and --line-spinner-color colour the ring, and the inline-end side stays transparent', async ({
    page,
  }) => {
    await mount(
      page,
      `<div style="color: rgb(200, 0, 0)"><line-spinner id="inherit"></line-spinner>
      <line-spinner id="token" style="--line-spinner-color: rgb(0, 0, 200)"></line-spinner></div>`,
    );
    expect(await borders(page, '#inherit')).toEqual({
      top: 'rgb(200, 0, 0)',
      right: 'rgba(0, 0, 0, 0)',
      bottom: 'rgb(200, 0, 0)',
      left: 'rgb(200, 0, 0)',
    });
    expect(await borders(page, '#token')).toEqual({
      top: 'rgb(0, 0, 200)',
      right: 'rgba(0, 0, 0, 0)',
      bottom: 'rgb(0, 0, 200)',
      left: 'rgb(0, 0, 200)',
    });
  });

  test('flex-shrink: 0 keeps 16 × 16 in a crowded flex row (P6 FLEX1)', async ({ page }) => {
    await mount(
      page,
      '<div style="display: flex; inline-size: 40px"><div style="flex: none; inline-size: 60px"></div><line-spinner id="s"></line-spinner></div>',
    );
    const { width, height } = await box(page, '#s');
    expectNear(width, 16, 'flex width');
    expectNear(height, 16, 'flex height');
  });

  test('a page ::part(root) rule reaches the ring', async ({ page }) => {
    await mount(
      page,
      '<style>line-spinner.thick::part(root) { border-width: 5px; }</style><line-spinner id="s" class="thick" size="6"></line-spinner>',
    );
    const width = await page.evaluate(() => {
      const root = document.getElementById('s')?.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
      return getComputedStyle(root).borderTopWidth;
    });
    expect(width).toBe('5px');
  });

  test('hidden hides the host', async ({ page }) => {
    await mount(page, '<line-spinner id="s" hidden label="Loading"></line-spinner>');
    expect(await box(page, '#s')).toEqual({ width: 0, height: 0 });
  });
});

test.describe('forced colors (D7; P7)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Playwright emulates forced colors in Chromium only');

  test('root paints CanvasText on three sides and Canvas on the gap, with and without a consumer colour', async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    await mount(
      page,
      `<line-spinner id="plain" size="6"></line-spinner>
      <line-spinner id="token" size="6" style="--line-spinner-color: rgb(0, 0, 200)"></line-spinner>`,
    );
    const text = await resolved(page, 'CanvasText');
    const canvas = await resolved(page, 'Canvas');
    expect(text).not.toBe(canvas);
    for (const id of ['#plain', '#token']) {
      expect({ id, ...(await borders(page, id)) }).toEqual({ id, top: text, right: canvas, bottom: text, left: text });
    }
  });
});

test.describe('without line-tokens (D6; P6)', () => {
  test('the spinner turns at 1000 ms and sizes and speeds from its literal fallbacks', async ({ page }) => {
    await open(page, 'no-tokens.html');
    await mount(
      page,
      `<line-spinner id="none"></line-spinner>
      <line-spinner id="s1" size="1"></line-spinner><line-spinner id="s3" size="3"></line-spinner><line-spinner id="s6" size="6"></line-spinner>
      <line-spinner id="slow" speed="slow"></line-spinner><line-spinner id="fast" speed="fast"></line-spinner>`,
    );
    expect(await motion(page, '#none')).toEqual({
      names: ['line-spinner-spin'],
      durations: [1000],
      iterations: [Number.POSITIVE_INFINITY],
    });
    for (const [id, px] of [
      ['none', 16],
      ['s1', 16],
      ['s3', 24],
      ['s6', 48],
    ] as const) {
      const { width, height } = await box(page, `#${id}`);
      expectNear(width, px, `${id} width`);
      expectNear(height, px, `${id} height`);
    }
    expect((await motion(page, '#slow')).durations).toEqual([2000]);
    expect((await motion(page, '#fast')).durations).toEqual([750]);
  });
});
