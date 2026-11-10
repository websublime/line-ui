/**
 * `<line-badge>` browser tier (spec `0007-badge.md` Tests, Browser row; Phase 1 spec §7.8, §6.C.4 notes, §10 SD39,
 * SD99, §12 AM-058).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `@websublime/line-components/badge` with the radii, sizing and
 * typography tokens and `line-themes`; `no-theme.html` leaves `line-themes` out. Each test mounts its markup into
 * `<main>`. The internals values are read back through the `INTERNALS` symbol the fixture re-exports, in every engine;
 * the accessibility tree is read through a CDP session in chromium only (D13). Playwright's `ariaSnapshot()` reads no
 * internals value (spec probe P2), so it proves nothing here.
 *
 * @module __tests__/integration/badge/badge.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/badge/';

/** `--line-size-4`, `--line-size-1`, `--line-size-2`, `--line-font-size-0` and `--line-font-weight-5`. */
const HEIGHT = 20;
const PADDING_INLINE = 4;
const DOT = 8;
const FONT_SIZE = 12;
const FONT_WEIGHT = '500';

async function open(page: Page, path = ''): Promise<void> {
  await page.goto(`${FIXTURE_URL}${path}`);
  await page.evaluate(() => customElements.whenDefined('line-badge'));
}

/** Replaces the content of `<main>` and waits for every badge to render and read its slot. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    const settle = () =>
      Promise.all(
        [...main.querySelectorAll('line-badge')].map(
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

/** Computed values of `root` in the badge matched by `selector`, or of the host itself. */
function computed(
  page: Page,
  properties: string[],
  part?: string,
  selector = 'line-badge',
): Promise<Record<string, string>> {
  return page.evaluate(
    ([names, name, sel]) => {
      const host = document.querySelector(`main ${sel}`) as HTMLElement;
      const element = name ? (host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement) : host;
      const style = getComputedStyle(element);
      return Object.fromEntries(names.map((property) => [property, style.getPropertyValue(property)]));
    },
    [properties, part, selector] as const,
  );
}

/** The border box size of `root` in the badge matched by `selector`. */
function rootSize(page: Page, selector = 'line-badge'): Promise<{ width: number; height: number }> {
  return page.evaluate((sel) => {
    const host = document.querySelector(`main ${sel}`) as HTMLElement;
    const root = (host.shadowRoot as ShadowRoot).querySelector('[part="root"]') as HTMLElement;
    const { width, height } = root.getBoundingClientRect();
    return { width, height };
  }, selector);
}

function expectNear(actual: number, expected: number, label: string): void {
  expect(Math.abs(actual - expected), `${label}: ${actual} vs ${expected}`).toBeLessThan(0.5);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

/** Every palette step the badge reads, each its own colour, so a wrong step or role shows (0011-separator.md AM-001). */
const ROLES = { gray: 10, info: 20, success: 30, warning: 40, danger: 50 } as const;
const PALETTE = { gray: ['sand', 'slate'], info: ['blue'], success: ['green'], warning: ['amber'], danger: ['red'] };
const SOLID = 9;
const CONTRAST = 99;
const rgb = (role: keyof typeof ROLES, step: number) => `rgb(${ROLES[role]}, ${step}, 99)`;

const PALETTE_STYLE = `<style>html { ${Object.entries(PALETTE)
  .flatMap(([role, hues]) =>
    hues.flatMap((hue) => [
      `--line-${hue}-${SOLID}: ${rgb(role as keyof typeof ROLES, SOLID)};`,
      `--line-${hue}-contrast: ${rgb(role as keyof typeof ROLES, CONTRAST)};`,
    ]),
  )
  .join(' ')} }</style>`;

const SEMANTICS = `<line-badge id="count">5</line-badge>
  <button type="button" id="inbox">Inbox <line-badge>5</line-badge></button>
  <line-badge id="dot"></line-badge>
  <line-badge id="named-dot" aria-label="New messages"></line-badge>
  <line-badge id="labelled-dot" aria-labelledby="caption"></line-badge><span id="caption">Online</span>
  <line-badge id="named-count" aria-label="5 unread messages">5</line-badge>
  <line-badge id="blank" aria-label="  "></line-badge>`;

test.describe('with line-tokens and line-themes', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('each variant takes its solid role fill and contrast text; a missing or unknown variant takes gray', async ({
    page,
  }) => {
    // `line-colors` is not a `line-components` dependency, so the page sets the palette steps the role aliases read
    // (spec 0007-badge.md Tests; 0006-alert.md Tests).
    const cases = [
      ['none', '', 'gray'],
      ['neutral', 'neutral', 'gray'],
      ['bogus', 'bogus', 'gray'],
      ['info', 'info', 'info'],
      ['success', 'success', 'success'],
      ['warning', 'warning', 'warning'],
      ['danger', 'danger', 'danger'],
    ] as const;
    await mount(
      page,
      `${PALETTE_STYLE}${cases
        .map(([id, variant]) => `<line-badge id="${id}" ${variant ? `variant="${variant}"` : ''}>5</line-badge>`)
        .join('')}${cases
        .map(([id, variant]) => `<line-badge id="dot-${id}" ${variant ? `variant="${variant}"` : ''}></line-badge>`)
        .join('')}`,
    );
    for (const [id, , role] of cases) {
      const root = await computed(page, ['background-color', 'color'], 'root', `#${id}`);
      expect({ id, ...root }).toEqual({ id, 'background-color': rgb(role, SOLID), color: rgb(role, CONTRAST) });
      const dot = await computed(page, ['background-color'], 'root', `#dot-${id}`);
      expect({ id, ...dot }).toEqual({ id, 'background-color': rgb(role, SOLID) });
    }
  });

  test('a count draws a pill on the token scale, and one character draws a circle', async ({ page }) => {
    await mount(page, '<line-badge id="one">5</line-badge><line-badge id="label">Beta</line-badge>');
    expect(await computed(page, ['display'], undefined, '#one')).toEqual({ display: 'inline-flex' });
    expect(
      await computed(
        page,
        [
          'border-top-left-radius',
          'padding-left',
          'padding-right',
          'font-size',
          'font-weight',
          'min-height',
          'min-width',
        ],
        'root',
        '#one',
      ),
    ).toEqual({
      'border-top-left-radius': '100000px',
      'padding-left': `${PADDING_INLINE}px`,
      'padding-right': `${PADDING_INLINE}px`,
      'font-size': `${FONT_SIZE}px`,
      'font-weight': FONT_WEIGHT,
      'min-height': `${HEIGHT}px`,
      'min-width': `${HEIGHT}px`,
    });
    const one = await rootSize(page, '#one');
    expectNear(one.height, HEIGHT, 'count height');
    expectNear(one.width, HEIGHT, 'one character draws a circle');
    const label = await rootSize(page, '#label');
    expectNear(label.height, HEIGHT, 'label height');
    expect(label.width).toBeGreaterThan(HEIGHT);
  });

  test('an empty badge draws a dot of --line-badge-dot-size and reflects data-empty', async ({ page }) => {
    await mount(page, '<line-badge id="empty"></line-badge><line-badge id="spaces">  </line-badge>');
    for (const selector of ['#empty', '#spaces']) {
      const size = await rootSize(page, selector);
      expectNear(size.width, DOT, `${selector} dot width`);
      expectNear(size.height, DOT, `${selector} dot height`);
      await expect(page.locator(`main ${selector}`)).toHaveAttribute('data-empty', '');
    }
    expect(await page.evaluate(() => document.querySelector('main line-badge')?.matches(':state(empty)'))).toBe(true);
  });

  test('text changed in place switches between the dot and the count', async ({ page }) => {
    await mount(page, '<line-badge></line-badge>');
    const badge = page.locator('main line-badge');
    await page.evaluate(() => {
      document.querySelector('main line-badge')?.append(document.createTextNode(''));
    });
    await expect(badge).toHaveAttribute('data-empty', '');
    await page.evaluate(() => {
      (document.querySelector('main line-badge')?.firstChild as Text).data = '12';
    });
    await expect(badge).not.toHaveAttribute('data-empty');
    expectNear((await rootSize(page)).height, HEIGHT, 'count height after the change');
    await page.evaluate(() => {
      (document.querySelector('main line-badge')?.firstChild as Text).data = '';
    });
    await expect(badge).toHaveAttribute('data-empty', '');
  });

  test('Tab skips the host (SD99)', async ({ page, browserName }) => {
    await mount(page, '<button id="before">Before</button><line-badge>5</line-badge><button id="after">After</button>');
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('after');
  });

  test('the internals hold role and ariaHidden per the internals values table, at once after append()', async ({
    page,
  }) => {
    await mount(page, SEMANTICS);
    const values = await page.evaluate(async (url) => {
      // Runtime import in the page: the fixture module the page already loaded holds the one matching Symbol.
      const { INTERNALS } = (await import(url)) as { INTERNALS: symbol };
      const read = (el: Element) => {
        const internals = Reflect.get(el, INTERNALS) as ElementInternals | undefined;
        return internals ? { role: internals.role, ariaHidden: internals.ariaHidden } : 'missing';
      };
      const mounted = Object.fromEntries(
        [...document.querySelectorAll('main line-badge')].map((el) => [el.id || el.parentElement?.id, read(el)]),
      );

      const created = document.createElement('line-badge');
      created.textContent = '7';
      document.querySelector('main')?.append(created);
      const afterAppend = read(created);
      created.setAttribute('aria-label', '7 new');
      const afterLabel = read(created);
      created.removeAttribute('aria-label');
      const afterRemove = read(created);

      const holder = document.createElement('div');
      holder.innerHTML = '<line-badge aria-label="Online"></line-badge>';
      const parsed = read(holder.firstElementChild as Element);
      return { mounted, afterAppend, afterLabel, afterRemove, parsed };
    }, `${FIXTURE_URL}fixture.ts`);
    const text = { role: null, ariaHidden: null };
    const hidden = { role: null, ariaHidden: 'true' };
    const img = { role: 'img', ariaHidden: null };
    expect(values).toEqual({
      mounted: {
        count: text,
        inbox: text,
        dot: hidden,
        'named-dot': img,
        'labelled-dot': img,
        'named-count': img,
        blank: hidden,
      },
      afterAppend: text,
      afterLabel: img,
      afterRemove: text,
      parsed: img,
    });
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

function liveProperties(node: AXNode): Record<string, unknown> {
  return Object.fromEntries(
    (node.properties ?? [])
      .filter((property) => ['live', 'atomic', 'relevant'].includes(property.name))
      .map((property) => [property.name, property.value.value]),
  );
}

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('role and name of a count, a count in a button, an unnamed dot, a named dot and a named count', async ({
    page,
  }) => {
    await open(page);
    await mount(page, SEMANTICS);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');

    // A count has no role: the host is at most an unnamed generic, and its text sits in place.
    const count = await axNode(cdp, '#count');
    expect(count.ignored || (count.role?.value === 'generic' && count.name?.value === '')).toBe(true);
    expect(await descendants(cdp, count)).toContain('StaticText:5');

    // Inside a native button the count joins the button's name.
    const inbox = await axNode(cdp, '#inbox');
    expect({ role: inbox.role?.value, name: inbox.name?.value }).toEqual({ role: 'button', name: 'Inbox 5' });

    // An unnamed dot exposes nothing.
    const dot = await axNode(cdp, '#dot');
    expect(dot.ignored).toBe(true);
    expect(await descendants(cdp, dot)).toEqual([]);
    const blank = await axNode(cdp, '#blank');
    expect(blank.ignored).toBe(true);

    // A host aria-label or aria-labelledby makes the badge an image with that name (F4, F5).
    const namedDot = await axNode(cdp, '#named-dot');
    expect({ role: namedDot.role?.value, name: namedDot.name?.value }).toEqual({ role: 'image', name: 'New messages' });
    const labelledDot = await axNode(cdp, '#labelled-dot');
    expect({ role: labelledDot.role?.value, name: labelledDot.name?.value }).toEqual({ role: 'image', name: 'Online' });
    const namedCount = await axNode(cdp, '#named-count');
    expect({ role: namedCount.role?.value, name: namedCount.name?.value }).toEqual({
      role: 'image',
      name: '5 unread messages',
    });
  });

  test('the author aria-live="polite" recipe exposes a polite live region and keeps the count in the button name (F2)', async ({
    page,
  }) => {
    await open(page);
    await mount(
      page,
      `<line-badge id="live" aria-live="polite">3</line-badge>
      <button type="button" id="inbox">Inbox <line-badge aria-live="polite">3</line-badge></button>`,
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const live = await axNode(cdp, '#live');
    expect(liveProperties(live)).toMatchObject({ live: 'polite' });
    const inbox = await axNode(cdp, '#inbox');
    expect(inbox.name?.value).toBe('Inbox 3');
  });

  test('a dot named after insertion becomes an image, and loses it when the label goes', async ({ page }) => {
    await open(page);
    await mount(page, '<line-badge id="dot"></line-badge>');
    await page.evaluate(() => document.getElementById('dot')?.setAttribute('aria-label', 'Online'));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const named = await axNode(cdp, '#dot');
    expect({ role: named.role?.value, name: named.name?.value }).toEqual({ role: 'image', name: 'Online' });
    await page.evaluate(() => document.getElementById('dot')?.removeAttribute('aria-label'));
    expect((await axNode(cdp, '#dot')).ignored).toBe(true);
  });
});

test.describe('without line-themes (D8)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, 'no-theme.html');
  });

  test('a count keeps a transparent fill and the inherited text colour; a dot draws in currentColor', async ({
    page,
  }) => {
    await mount(
      page,
      '<div style="color: rgb(200, 0, 0)"><line-badge id="count" variant="danger">5</line-badge><line-badge id="dot"></line-badge></div>',
    );
    expect(await computed(page, ['background-color', 'color'], 'root', '#count')).toEqual({
      'background-color': 'rgba(0, 0, 0, 0)',
      color: 'rgb(200, 0, 0)',
    });
    expect(await computed(page, ['background-color'], 'root', '#dot')).toEqual({
      'background-color': 'rgb(200, 0, 0)',
    });
    const size = await rootSize(page, '#dot');
    expectNear(size.width, DOT, 'unthemed dot width');
  });
});
