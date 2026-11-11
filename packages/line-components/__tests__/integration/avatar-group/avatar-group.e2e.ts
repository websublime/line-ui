/**
 * `<line-avatar-group>` browser tier (spec `0010-avatar-group.md` Tests, Browser row; Phase 1 spec §6.C.4, §7.8;
 * §10 SD39, SD99).
 *
 * Runs in chromium, firefox and webkit on the fixture page that the third `webServer` of `playwright.config.ts` serves
 * on port 4321. `index.html` loads the built `./avatar-group`, `./avatar` and `./badge` by package name with the
 * token families they read and `line-themes`, and re-exports `INTERNALS` for the read-back. Each test mounts its
 * markup into `<main>`. The native popover, Tab order, focus return, hover and touch, the layout, the accessibility
 * tree and the internals proof live here, because happy-dom models none of them (spec probe P7). The Chromium
 * accessibility tree and `layout-shift` entries are read in chromium only. Layout measurements run under
 * `prefers-reduced-motion: reduce`, which makes the spread transition `0s`, so positions are final at once.
 *
 * @module __tests__/integration/avatar-group/avatar-group.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/avatar-group/';

/** `--line-size-7`, the avatar size; `--line-size-2`, the overlap; `--line-size-1`, the gap. */
const SIZE = 32;
const OVERLAP = 8;
const GAP = 4;
const STEP = OVERLAP + GAP;

/** `count` named avatars; `wrap` puts each in a link. */
function people(count: number, wrap = false, from = 1): string {
  return Array.from({ length: count }, (_, i) => {
    const n = i + from;
    const avatar = `<line-avatar id="a${n}" name="Person ${n}"></line-avatar>`;
    return wrap ? `<a id="l${n}" href="#p${n}">${avatar}</a>` : avatar;
  }).join('');
}

/** The group between two native buttons, with room on both inline sides for the spread stack. */
function frame(attributes: string, children = people(5)): string {
  return `<div style="padding: 24px 160px 240px"><button id="before">Before</button>
    <line-avatar-group id="g" aria-label="Project members" ${attributes}>${children}</line-avatar-group>
    <button id="after">After</button></div>`;
}

async function open(page: Page): Promise<void> {
  await page.goto(FIXTURE_URL);
  await page.evaluate(() =>
    Promise.all(['line-avatar-group', 'line-avatar', 'line-badge'].map((tag) => customElements.whenDefined(tag))),
  );
}

/**
 * Yields a task twice: the machine microtasks, the `toggle` task and the host update all land before it resolves.
 * The machine and the popover expose no promise for these, so a task boundary is the signal.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let i = 0; i < 2; i++) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 20);
      await promise;
    }
  });
}

/** Replaces the content of `<main>` and waits for every group and avatar to render. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    await Promise.all(
      [...main.querySelectorAll('line-avatar-group, line-avatar')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  }, markup);
  await settle(page);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

/** WebKit on macOS focuses nothing on a mouse click on a button; the other engines focus it (spec probe P1). */
function clickFocuses(browserName: string): boolean {
  return !(browserName === 'webkit' && process.platform === 'darwin');
}

/** The id or tag of the focused element, through the open shadow roots, as `host>inner`. */
function focusPath(page: Page): Promise<string> {
  return page.evaluate(() => {
    const parts: string[] = [];
    let active = document.activeElement;
    while (active) {
      parts.push(active.id || active.localName);
      active = active.shadowRoot?.activeElement ?? null;
    }
    return parts.join('>');
  });
}

interface GroupState {
  expanded: boolean;
  open: boolean;
  popoverOpen: boolean;
  ariaExpanded: string | null;
  focusVisible: boolean;
}

function groupState(page: Page, selector = '#g'): Promise<GroupState> {
  return page.evaluate((sel) => {
    const host = document.querySelector(sel) as HTMLElement;
    const shadow = host.shadowRoot as ShadowRoot;
    const panel = shadow.querySelector('[part="content"]');
    return {
      expanded: host.hasAttribute('data-expanded') && host.matches(':state(expanded)'),
      open: host.hasAttribute('data-open') && host.matches(':state(open)'),
      popoverOpen: panel?.matches(':popover-open') ?? false,
      ariaExpanded: shadow.querySelector('[part="overflow"]')?.getAttribute('aria-expanded') ?? null,
      focusVisible: host.hasAttribute('data-focus-visible'),
    };
  }, selector);
}

const COLLAPSED = { expanded: false, open: false, popoverOpen: false, ariaExpanded: 'false' };
const EXPANDED = { expanded: true, open: false, popoverOpen: false, ariaExpanded: 'false' };
const OPEN = { expanded: true, open: true, popoverOpen: true, ariaExpanded: 'true' };

/** The centre of the element `selector` matches, piercing shadow roots. */
async function centre(page: Page, selector: string): Promise<{ x: number; y: number }> {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`${selector} has no box`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

interface Layout {
  host: { x: number; y: number; width: number; height: number };
  overflow: { x: number; width: number } | null;
  avatars: number[];
}

/** The host box, the "+N" box and the inline-start x of every avatar in the group, in DOM order. */
function layout(page: Page, selector = '#g'): Promise<Layout> {
  return page.evaluate((sel) => {
    const host = document.querySelector(sel) as HTMLElement;
    const box = host.getBoundingClientRect();
    const overflow = host.shadowRoot?.querySelector('[part="overflow"]')?.getBoundingClientRect();
    return {
      host: { x: box.x, y: box.y, width: box.width, height: box.height },
      overflow: overflow ? { x: overflow.x, width: overflow.width } : null,
      avatars: [...host.querySelectorAll('line-avatar')]
        .filter((avatar) => avatar.getBoundingClientRect().width > 0)
        .map((avatar) => avatar.getBoundingClientRect().x),
    };
  }, selector);
}

/** The distance from each shown avatar to the next, then from the last one to "+N". */
function steps({ avatars, overflow }: Layout): number[] {
  const starts = overflow ? [...avatars, overflow.x] : avatars;
  return starts.slice(1).map((x, i) => x - (starts[i] ?? Number.NaN));
}

function expectNear(actual: number, expected: number, label: string): void {
  expect(Math.abs(actual - expected), `${label}: ${actual} vs ${expected}`).toBeLessThan(0.5);
}

test.beforeEach(async ({ page }) => {
  await open(page);
});

test.describe('keyboard and focus (§10 SD99; D6, D7)', () => {
  test('Tab skips the host and stops on "+N" and the avatar links, in order', async ({ page, browserName }) => {
    await mount(page, frame('max="2"', people(4, true)));
    await page.locator('#before').focus();
    const order: string[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press(tab(browserName));
      order.push(await focusPath(page));
    }
    expect(order).toEqual(['l1', 'l2', 'g>button', 'after']);
  });

  test('a group with no overflow is not a Tab stop at all', async ({ page, browserName }) => {
    await mount(page, frame('', people(3)));
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    expect(await focusPath(page)).toBe('after');
  });

  test('Enter opens and closes the panel, Space opens it, Escape closes it with focus on "+N"', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame('max="3"'));
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    expect(await focusPath(page)).toBe('g>button');
    await page.keyboard.press('Enter');
    await settle(page);
    expect(await groupState(page)).toMatchObject(OPEN);
    await page.keyboard.press('Enter');
    await settle(page);
    expect(await groupState(page)).toMatchObject({ open: false, popoverOpen: false, ariaExpanded: 'false' });
    await page.keyboard.press('Space');
    await settle(page);
    expect(await groupState(page)).toMatchObject(OPEN);
    await page.keyboard.press('Escape');
    await settle(page);
    expect(await groupState(page)).toMatchObject({ open: false, popoverOpen: false, ariaExpanded: 'false' });
    expect(await focusPath(page)).toBe('g>button');
  });

  test('while open, Tab goes from "+N" into the panel, then on to the next control', async ({ page, browserName }) => {
    await mount(page, frame('max="2"', people(4, true)));
    await page.locator('#before').focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press(tab(browserName));
    await page.keyboard.press('Enter');
    await settle(page);
    const order: string[] = [];
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press(tab(browserName));
      order.push(await focusPath(page));
    }
    expect(order).toEqual(['l3', 'l4', 'after']);
  });

  test('Escape from a slotted link inside the panel closes it and returns focus to "+N" (D7)', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame('max="2"', people(4, true)));
    await page.locator('#before').focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press(tab(browserName));
    await page.keyboard.press('Enter');
    await settle(page);
    await page.keyboard.press(tab(browserName));
    expect(await focusPath(page)).toBe('l3');
    await page.keyboard.press('Escape');
    await settle(page);
    expect(await groupState(page)).toMatchObject({ open: false, popoverOpen: false });
    expect(await focusPath(page)).toBe('g>button');
    expect((await groupState(page)).focusVisible).toBe(true);
  });

  test('host.focus() does nothing: the shadow root does not delegate focus (D6)', async ({ page }) => {
    await mount(page, frame('max="2"'));
    await page.locator('#g').evaluate((host) => host.focus());
    expect(await focusPath(page)).toBe('body');
  });
});

test.describe('pointer and the native popover (F1; probe P1; D21)', () => {
  test('a click opens the panel and a second click closes it; a click outside closes it too', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame('max="3"'));
    const plus = page.locator('#g [part="overflow"]');
    await plus.click();
    await settle(page);
    expect(await groupState(page)).toMatchObject(OPEN);
    expect(await focusPath(page)).toBe(clickFocuses(browserName) ? 'g>button' : 'body');
    expect((await groupState(page)).focusVisible).toBe(false);
    await plus.click();
    await settle(page);
    expect(await groupState(page)).toMatchObject({ open: false, popoverOpen: false, ariaExpanded: 'false' });
    await plus.click();
    await settle(page);
    expect(await groupState(page)).toMatchObject(OPEN);
    await page.mouse.click(4, 4);
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);
  });

  for (const [root, group] of [
    ['ltr', 'ltr'],
    ['rtl', 'rtl'],
    ['ltr', 'rtl'],
    ['rtl', 'ltr'],
  ] as const) {
    test(`the panel sits under "+N" at the group's inline-start and flips at the edges: page ${root}, group ${group} (D9; AM-006)`, async ({
      page,
    }) => {
      const layouts = {
        mid: 'padding: 24px 300px 300px',
        inlineEdge: 'display: flex; justify-content: flex-end; padding: 24px 4px 300px',
        blockEdge: 'padding: 640px 300px 0',
      };
      await page.evaluate((dir) => {
        document.documentElement.dir = dir;
        document.body.style.margin = '0';
      }, root);
      for (const [layout, style] of Object.entries(layouts)) {
        await mount(
          page,
          `<div dir="${group}" style="${style}"><line-avatar-group id="g" aria-label="Team" max="1">${people(7)}</line-avatar-group></div>`,
        );
        await page.locator('#g [part="overflow"]').click();
        await settle(page);
        const box = await page.locator('#g').evaluate((host) => {
          const shadow = host.shadowRoot as ShadowRoot;
          const button = (shadow.querySelector('[part="overflow"]') as HTMLElement).getBoundingClientRect();
          const panel = (shadow.querySelector('[part="content"]') as HTMLElement).getBoundingClientRect();
          return {
            below: panel.top - button.bottom,
            above: button.top - panel.bottom,
            left: panel.left - button.left,
            right: panel.right - button.right,
            inView: panel.left >= 0 && panel.right <= innerWidth && panel.top >= 0 && panel.bottom <= innerHeight,
          };
        });
        const label = `${root}/${group} ${layout}`;
        expect(box.inView, `${label} in view`).toBe(true);
        expectNear(layout === 'blockEdge' ? box.above : box.below, GAP, `${label} block offset`);
        // At the inline edge the panel flips to the other side of "+N" (position-try-fallbacks: flip-inline).
        const startAligned = (group === 'ltr') !== (layout === 'inlineEdge');
        if (startAligned) expectNear(box.left, 0, `${label} left edges`);
        else expectNear(box.right, 0, `${label} right edges`);
        await page.mouse.click(4, 4);
        await settle(page);
      }
    });
  }

  test('another auto popover closes the panel and the flags follow', async ({ page }) => {
    await mount(page, `${frame('max="3"')}<div id="other" popover="auto">Other</div>`);
    await page.locator('#g [part="overflow"]').click();
    await page.mouse.move(4, 4);
    await settle(page);
    expect(await groupState(page)).toMatchObject(OPEN);
    await page.locator('#other').evaluate((other) => other.showPopover());
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);
  });

  test('a child removed while the panel is open closes it and clears data-open (D21)', async ({ page }) => {
    await mount(page, frame('max="3"', people(4)));
    await page.locator('#g [part="overflow"]').click();
    await settle(page);
    expect(await groupState(page)).toMatchObject(OPEN);
    await page.locator('#a4').evaluate((avatar) => avatar.remove());
    await settle(page);
    expect(await groupState(page)).toMatchObject({ open: false, popoverOpen: false });
    expect(await page.locator('#g').evaluate((host) => host.shadowRoot?.querySelector('[part]'))).toBeNull();
  });

  test('the group stays expanded while the pointer is on the open panel (probe P1)', async ({ page }) => {
    await mount(page, frame('max="3"'));
    const plus = await centre(page, '#g [part="overflow"]');
    await page.mouse.move(plus.x, plus.y);
    await page.mouse.click(plus.x, plus.y);
    await settle(page);
    expect(await groupState(page)).toMatchObject(OPEN);
    const panel = await centre(page, '#g [part="content"]');
    await page.mouse.move(panel.x, panel.y, { steps: 5 });
    await settle(page);
    expect(await groupState(page)).toMatchObject(OPEN);
  });
});

test.describe('expansion by hover and keyboard focus, and Escape (F2, F13; D25)', () => {
  test('the mouse expands the stack while it rests on the group and collapses it when it leaves', async ({ page }) => {
    await mount(page, frame('max="3"'));
    const avatar = await centre(page, '#a1');
    await page.mouse.move(avatar.x, avatar.y);
    await settle(page);
    expect(await groupState(page)).toMatchObject(EXPANDED);
    await page.mouse.move(4, 4);
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);
  });

  test('Tab to "+N" expands the stack and shows the focus ring on root; Tab out collapses it (F13, F15)', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame('max="3"'));
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await settle(page);
    expect(await groupState(page)).toMatchObject({ ...EXPANDED, focusVisible: true });
    const ring = await page.locator('#g').evaluate((host) => {
      const root = getComputedStyle(host.shadowRoot?.querySelector('[part="root"]') as HTMLElement);
      const probe = document.createElement('span');
      probe.style.color = 'var(--line-accent-8)';
      document.body.append(probe);
      const accent = getComputedStyle(probe).color;
      probe.remove();
      return { style: root.outlineStyle, width: root.outlineWidth, color: root.outlineColor, accent };
    });
    expect(ring).toEqual({ style: 'solid', width: '2px', color: ring.accent, accent: ring.accent });
    await page.keyboard.press(tab(browserName));
    await settle(page);
    expect(await groupState(page)).toMatchObject({ ...COLLAPSED, focusVisible: false });
    const outline = await page
      .locator('#g')
      .evaluate(
        (host) => getComputedStyle(host.shadowRoot?.querySelector('[part="root"]') as HTMLElement).outlineStyle,
      );
    expect(outline).toBe('none');
  });

  test('Escape collapses the stack and keeps it collapsed until the pointer and focus have both left (D25)', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame('max="3"'));
    const avatar = await centre(page, '#a1');
    await page.mouse.move(avatar.x, avatar.y);
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await settle(page);
    expect(await focusPath(page)).toBe('g>button');
    expect(await groupState(page)).toMatchObject(EXPANDED);
    await page.keyboard.press('Escape');
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);

    // The mouse leaves and returns while focus stays on "+N".
    await page.mouse.move(4, 4);
    await settle(page);
    await page.mouse.move(avatar.x, avatar.y);
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);

    // Focus leaves while the mouse stays.
    await page.keyboard.press(tab(browserName));
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);

    // Both have left; the mouse returns and the stack expands again.
    await page.mouse.move(4, 4);
    await settle(page);
    await page.mouse.move(avatar.x, avatar.y);
    await settle(page);
    expect(await groupState(page)).toMatchObject(EXPANDED);
  });

  test('a mouse click on "+N" that focuses it without focus-visible expands nothing by focus (F13)', async ({
    page,
  }) => {
    await mount(page, frame('max="3"'));
    await page.locator('#g [part="overflow"]').click();
    await settle(page);
    await page.locator('#g [part="overflow"]').click();
    await page.mouse.move(4, 4);
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);
  });
});

test.describe('touch (F2, F13; probe P5)', () => {
  test.use({ hasTouch: true });

  test('a tap on an avatar link or on "+N" expands nothing until the panel opens; the close collapses it', async ({
    page,
  }) => {
    await mount(page, frame('max="2"', people(4, true)));
    await page.locator('#l1').tap();
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);
    await page.locator('#g [part="overflow"]').tap();
    await settle(page);
    expect(await groupState(page)).toMatchObject(OPEN);
    await page.locator('#g [part="overflow"]').tap();
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);
  });

  test('a tap on an avatar link expands nothing, in every engine', async ({ page }) => {
    await mount(page, frame('max="2"', people(4, true)));
    await page.locator('#l1').tap();
    await page.locator('#l2').tap();
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);
  });
});

test.describe('layout: nested translate (F14; probe P9; D4, D20)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`${dir}: a pointer that enters straight onto "+N" opens the panel with one click; nothing else moves`, async ({
      page,
      browserName,
    }) => {
      await mount(page, `<div dir="${dir}">${frame('max="3"')}</div>`);
      if (browserName === 'chromium') {
        await page.evaluate(() => {
          const shifts: number[] = [];
          Reflect.set(window, '__shifts', shifts);
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) shifts.push((entry as PerformanceEntry & { value: number }).value);
          }).observe({ type: 'layout-shift' });
        });
      }
      const before = await layout(page);
      const plus = await centre(page, '#g [part="overflow"]');
      await page.mouse.move(0, 0);
      await page.mouse.move(plus.x, plus.y);
      await settle(page);
      expect(await groupState(page)).toMatchObject(EXPANDED);
      const after = await layout(page);
      expect(after.host).toEqual(before.host);
      expect(after.overflow).toEqual(before.overflow);
      const sign = dir === 'ltr' ? -1 : 1;
      after.avatars.forEach((x, i) => {
        expectNear(x - (before.avatars[i] ?? Number.NaN), sign * (3 - i) * STEP, `avatar ${i + 1}`);
      });
      if (browserName === 'chromium') {
        expect(await page.evaluate(() => Reflect.get(window, '__shifts'))).toEqual([]);
      }
      const under = await page.evaluate(
        ({ x, y }) => document.querySelector('#g')?.shadowRoot?.elementFromPoint(x, y)?.getAttribute('part'),
        plus,
      );
      expect(under).toBe('overflow');
      await page.mouse.down();
      await page.mouse.up();
      await settle(page);
      expect(await groupState(page)).toMatchObject(OPEN);
    });
  }

  test('the spread transition takes --line-avatar-group-duration, 0s under reduced motion', async ({ page }) => {
    await mount(page, frame('max="3"'));
    const duration = () =>
      page
        .locator('#g')
        .evaluate(
          (host) => getComputedStyle(host.shadowRoot?.querySelector('.level') as HTMLElement).transitionDuration,
        );
    expect(await duration()).toBe('0s');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(await duration()).toBe('0.1s');
  });

  test('spacing sets the overlap of the stacked avatars and of "+N"; the spread gap stays (F8)', async ({ page }) => {
    for (const [spacing, overlap] of [
      ['', OVERLAP],
      ['spacing="0"', 0],
      ['spacing="1"', 4],
      ['spacing="2"', 8],
      ['spacing="3"', 16],
      ['spacing="9"', OVERLAP],
    ] as const) {
      await mount(page, frame(`max="3" ${spacing}`));
      for (const [k, step] of steps(await layout(page)).entries()) {
        expectNear(step, SIZE - overlap, `${spacing} stacked step ${k + 1}`);
      }
      const avatar = await centre(page, '#a2');
      await page.mouse.move(avatar.x, avatar.y);
      await settle(page);
      for (const [k, step] of steps(await layout(page)).entries()) {
        expectNear(step, SIZE + GAP, `${spacing} spread step ${k + 1}`);
      }
      await page.mouse.move(4, 4);
    }
  });

  test('size sets the avatars and "+N" to --line-size-5…-9; an unknown step leaves the avatar default (F8)', async ({
    page,
  }) => {
    for (const [size, px] of [
      ['size="1"', 24],
      ['size="2"', 28],
      ['size="3"', 32],
      ['size="4"', 48],
      ['size="5"', 64],
      ['size="x"', SIZE],
      ['', SIZE],
    ] as const) {
      await mount(page, frame(`max="3" ${size}`));
      const widths = await page.locator('#g').evaluate((host) => ({
        avatar: (host.querySelector('line-avatar') as HTMLElement).getBoundingClientRect().width,
        overflow:
          (host.shadowRoot as ShadowRoot).querySelector('[part="overflow"]')?.getBoundingClientRect().width ?? 0,
        height: host.getBoundingClientRect().height,
      }));
      expectNear(widths.avatar, px, `${size} avatar`);
      expectNear(widths.overflow, px, `${size} "+N"`);
      expectNear(widths.height, px, `${size} host height`);
    }
  });

  test('wrapping links and a hidden first child: level 1 holds the first visible avatar at the host start (D20)', async ({
    page,
  }) => {
    await mount(page, frame('max="3"', `<a id="l0" href="#p0" hidden>${people(1, false, 0)}</a>${people(4, true)}`));
    const stacked = await layout(page);
    expect(stacked.avatars).toHaveLength(3);
    expectNear(stacked.avatars[0] ?? 0, stacked.host.x, 'first visible avatar at the host start');
    for (let k = 1; k < 3; k++) {
      expectNear((stacked.avatars[k] ?? 0) - (stacked.avatars[k - 1] ?? 0), SIZE - OVERLAP, `linked ${k}`);
    }
    expectNear(stacked.host.height, SIZE, 'no line box around the links');
    expect(await page.locator('#g [part="overflow"]').textContent()).toBe('+1');
  });

  test('later children paint over earlier ones, and "+N" over the last avatar it overlaps', async ({ page }) => {
    await mount(page, frame('max="3"'));
    const hits = await page.locator('#g').evaluate((host, overlap) => {
      const shadow = host.shadowRoot as ShadowRoot;
      const at = (element: Element) => {
        const box = element.getBoundingClientRect();
        // A point inside the overlap: just after the element's inline-start edge, at its block centre.
        return { x: box.left + overlap / 2, y: box.top + box.height / 2 };
      };
      // The document hit is the avatar for a slotted avatar and the host for the group's own shadow content.
      const hit = ({ x, y }: { x: number; y: number }) => {
        const found = document.elementFromPoint(x, y);
        if (found !== host) return found?.closest('line-avatar')?.id ?? found?.localName ?? null;
        return shadow.elementFromPoint(x, y)?.getAttribute('part') ?? null;
      };
      return {
        second: hit(at(host.querySelector('#a2') as Element)),
        third: hit(at(host.querySelector('#a3') as Element)),
        overflow: hit(at(shadow.querySelector('[part="overflow"]') as Element)),
      };
    }, OVERLAP);
    expect(hits).toEqual({ second: 'a2', third: 'a3', overflow: 'overflow' });
  });

  test('every avatar and "+N" draws the 2px gap ring the group sets (D10; contract G3)', async ({ page }) => {
    await mount(page, frame('max="3"', people(4, true)));
    const shadows = await page
      .locator('#g')
      .evaluate((host) => [
        ...[...host.querySelectorAll('line-avatar')].map(
          (avatar) => getComputedStyle(avatar.shadowRoot?.querySelector('[part="root"]') as HTMLElement).boxShadow,
        ),
        getComputedStyle(host.shadowRoot?.querySelector('[part="overflow"]') as HTMLElement).boxShadow,
      ]);
    expect(shadows).toHaveLength(5);
    for (const shadow of shadows) expect(shadow).toMatch(/ 0px 0px 0px 2px$/);
  });
});

test.describe('accessibility tree (F6, F7; D8, D16)', () => {
  test('ariaSnapshot: the visible avatars and "+N", then the panel avatars while open', async ({ page }) => {
    await mount(page, frame('max="3"'));
    await expect(page.locator('#g')).toMatchAriaSnapshot(`
      - img "Person 1"
      - img "Person 2"
      - img "Person 3"
      - button "+2" [expanded=false]
    `);
    await page.locator('#g [part="overflow"]').click();
    await settle(page);
    await expect(page.locator('#g')).toMatchAriaSnapshot(`
      - img "Person 1"
      - img "Person 2"
      - img "Person 3"
      - button "+2" [expanded]
      - img "Person 4"
      - img "Person 5"
    `);
  });

  test('overflow-label names "+N" with the count filled in', async ({ page }) => {
    await mount(page, frame('max="3" overflow-label="+{count} more members"'));
    await expect(page.locator('#g')).toMatchAriaSnapshot(`- button "+2 more members"`);
  });

  test('INTERNALS reads back role group (Phase 1 spec §6.C.4; §10 SD39)', async ({ page }) => {
    await mount(page, frame('max="3"'));
    const role = await page.evaluate(async (url) => {
      const { INTERNALS } = (await import(url)) as { INTERNALS: symbol };
      const internals = Reflect.get(document.querySelector('#g') as HTMLElement, INTERNALS) as ElementInternals;
      return internals.role;
    }, `${FIXTURE_URL}fixture.ts`);
    expect(role).toBe('group');
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

interface DOMNode {
  nodeId: number;
  attributes?: string[];
  children?: DOMNode[];
  shadowRoots?: DOMNode[];
}

/** The node whose `id` attribute is `id`, searched through the children and the shadow roots of `node`. */
function findById(node: DOMNode, id: string): DOMNode | undefined {
  const attributes = node.attributes ?? [];
  for (let i = 0; i < attributes.length; i += 2) {
    if (attributes[i] === 'id' && attributes[i + 1] === id) return node;
  }
  for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) {
    const found = findById(child, id);
    if (found) return found;
  }
  return undefined;
}

/**
 * The accessibility node Chromium builds for the host `#hostId`, or for the element `inner` matches in its shadow root.
 * `DOM.querySelector` does not pierce shadow roots, so the shadow root is found in the pierced document tree.
 */
async function axNode(cdp: CDPSession, hostId: string, inner?: string): Promise<AXNode> {
  const { root } = (await cdp.send('DOM.getDocument', { depth: -1, pierce: true })) as { root: DOMNode };
  const host = findById(root, hostId);
  if (!host) throw new Error(`no #${hostId}`);
  let { nodeId } = host;
  if (inner) {
    const shadowRoot = host.shadowRoots?.[0];
    if (!shadowRoot) throw new Error(`#${hostId} has no shadow root`);
    ({ nodeId } = await cdp.send('DOM.querySelector', { nodeId: shadowRoot.nodeId, selector: inner }));
  }
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  return nodes[0] as AXNode;
}

const expandedOf = (node: AXNode): unknown =>
  node.properties?.find((property) => property.name === 'expanded')?.value.value;

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('the host is a group named by aria-label; "+N" reports expanded; the panel avatars join while open', async ({
    page,
  }) => {
    await mount(
      page,
      `${frame('max="3"')}<span id="lbl">Reviewers</span>
      <line-avatar-group id="labelledby" aria-labelledby="lbl">${people(2, false, 10)}</line-avatar-group>
      <line-avatar-group id="unnamed">${people(1, false, 20)}</line-avatar-group>`,
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const group = await axNode(cdp, 'g');
    expect([group.role?.value, group.name?.value]).toEqual(['group', 'Project members']);
    const labelledBy = await axNode(cdp, 'labelledby');
    expect([labelledBy.role?.value, labelledBy.name?.value]).toEqual(['group', 'Reviewers']);
    const unnamed = await axNode(cdp, 'unnamed');
    expect([unnamed.role?.value, unnamed.name?.value ?? '']).toEqual(['group', '']);

    const plus = await axNode(cdp, 'g', '[part="overflow"]');
    expect([plus.role?.value, plus.name?.value, expandedOf(plus)]).toEqual(['button', '+2', false]);
    await page.locator('#g [part="overflow"]').click();
    await settle(page);
    expect(expandedOf(await axNode(cdp, 'g', '[part="overflow"]'))).toBe(true);

    const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AXNode[] };
    const byId = new Map(nodes.map((node) => [node.nodeId, node]));
    const named = nodes.find((node) => node.role?.value === 'group' && node.name?.value === 'Project members');
    const images: unknown[] = [];
    const walk = (id: string): void => {
      const node = byId.get(id);
      if (!node) return;
      if (!node.ignored && node.role?.value === 'image') images.push(node.name?.value);
      for (const child of node.childIds ?? []) walk(child);
    };
    walk(named?.nodeId ?? '');
    expect(images).toEqual(['Person 1', 'Person 2', 'Person 3', 'Person 4', 'Person 5']);
  });
});

test.describe('machine fallback (MANIFESTO Law 9; D8, D27)', () => {
  /**
   * Mounts a group whose machine fails to start: while it connects, the `max` accessor on the class throws, so the
   * machine props the controller reads in the machine constructor throw. The accessor is patched on the prototype,
   * where Lit defines it, and restored at once; an own property would trip Lit's class-field check.
   */
  async function mountFailing(page: Page): Promise<void> {
    await page.evaluate(async (children) => {
      const main = document.querySelector('main') as HTMLElement;
      main.innerHTML = '<button id="before">Before</button>';
      const host = document.createElement('line-avatar-group') as HTMLElement & { updateComplete: Promise<unknown> };
      host.id = 'g';
      host.setAttribute('aria-label', 'Project members');
      host.setAttribute('max', '3');
      host.innerHTML = children;
      const { prototype } = customElements.get('line-avatar-group') as CustomElementConstructor;
      const accessor = Object.getOwnPropertyDescriptor(prototype, 'max') as PropertyDescriptor;
      Object.defineProperty(prototype, 'max', {
        ...accessor,
        get() {
          throw new Error('machine start failure');
        },
      });
      try {
        main.append(host);
      } finally {
        Object.defineProperty(prototype, 'max', accessor);
      }
      await host.updateComplete;
    }, people(5));
    await settle(page);
  }

  test('the group never expands, and the button, the panel, aria-expanded and focus-visible still work', async ({
    page,
    browserName,
  }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await mountFailing(page);
    expect(errors.some((text) => text.includes('Machine failed to start'))).toBe(true);
    const avatar = await centre(page, '#a1');
    await page.mouse.move(avatar.x, avatar.y);
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);

    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await settle(page);
    expect(await groupState(page)).toMatchObject({ ...COLLAPSED, focusVisible: true });
    const outline = await page
      .locator('#g')
      .evaluate(
        (host) => getComputedStyle(host.shadowRoot?.querySelector('[part="root"]') as HTMLElement).outlineStyle,
      );
    expect(outline).toBe('solid');

    await page.keyboard.press('Enter');
    await settle(page);
    expect(await groupState(page)).toMatchObject({
      expanded: false,
      open: false,
      popoverOpen: true,
      ariaExpanded: 'true',
    });
    await page.keyboard.press('Escape');
    await settle(page);
    expect(await groupState(page)).toMatchObject(COLLAPSED);
  });
});
