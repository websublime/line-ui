/**
 * The CSS mask icons recipe in the browser tier (ledger 01-D4; `docs/context/01-d4.md` Acceptance criteria), on the
 * `storybook-static` that `bun run build` produces, in Chromium, Firefox and WebKit.
 *
 * - Every `[data-mask-icon]` element in a line://ui slot paints its glyph through one masked pseudo-element: the
 *   computed `mask-image` holds the token's URL, the box is larger than zero, the self-hosted file loads, and the
 *   fill is the element's `currentColor`.
 * - The icon-only IconButtons keep their names from the host `aria-label`; `--icon-style-size` scales the glyph;
 *   `:hover` swaps it through `--icon-hover`; a missing token paints nothing and reports nothing.
 * - axe finds zero violations of the §7.4 ruleset on each story.
 * - The docs page states the limits, and `Recipes/Overview` links it.
 *
 * @module apps/storybook/__tests__/css-mask-icons.e2e
 */

import { expect, type Page, test } from 'playwright/test';
import { axe, expectNoAxeViolations } from '../../../packages/line-components/__tests__/a11y/axe';
import { openDocs } from './docs-page';

test.use({ baseURL: 'http://127.0.0.1:4320' });

/** The story ids under `Recipes/CSS mask icons`. */
const STORIES = [
  'button-prefix-and-suffix',
  'icon-button-icon-only',
  'chip-slots',
  'alert-icon',
  'hover-swap',
  'size',
  'missing-token',
] as const;

/** The one glyph the recipe embeds as a `data:` URI token; every other token is a file under `icons/lucide/`. */
const EMBEDDED = 'check';

/** What one icon element and its pseudo-elements compute. */
interface IconPaint {
  glyph: string;
  /** The pseudo-elements that generate a box: `content` other than `none` (or `normal`, which computes to it). */
  painted: string[];
  maskImage: string;
  width: number;
  height: number;
  fill: string;
  colour: string;
  fontSize: number;
  /** The width of the icon element's own box, which holds only the pseudo-element. */
  boxWidth: number;
}

/** Collects console errors and uncaught exceptions for the life of the page. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

/** Records the status of every icon file the page fetches, by file name. */
function watchIconFiles(page: Page): Map<string, number> {
  const files = new Map<string, number>();
  page.on('response', (response) => {
    const match = /\/icons\/lucide\/([^/?#]+)\.svg$/.exec(new URL(response.url()).pathname);
    if (match?.[1]) files.set(match[1], response.status());
  });
  return files;
}

/** Opens a story in the preview iframe and waits until every line://ui host in it has rendered. */
async function openStory(page: Page, story: (typeof STORIES)[number]): Promise<void> {
  await page.goto(`/iframe.html?id=recipes-css-mask-icons--${story}&viewMode=story`);
  await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
  await expect(
    page.locator('#storybook-root [data-mask-icon], #storybook-root [data-mask-icon-missing]').first(),
  ).toBeAttached();
  await page
    .locator('#storybook-root')
    .evaluate((root) =>
      Promise.all(
        [...root.querySelectorAll('*')]
          .filter((element) => element.localName.startsWith('line-'))
          .map((element) => (element as Element & { updateComplete: Promise<unknown> }).updateComplete),
      ),
    );
}

/** Reads what each element matched by `selector` paints. */
async function iconPaints(page: Page, selector = '#storybook-root [data-mask-icon]'): Promise<IconPaint[]> {
  return page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const painted = ['::before', '::after'].filter(
        (pseudo) => !['none', 'normal'].includes(getComputedStyle(element, pseudo).content),
      );
      const style = getComputedStyle(element, painted[0] ?? '::before');
      return {
        glyph: element.getAttribute('data-mask-icon') ?? '',
        painted,
        maskImage: style.maskImage || style.getPropertyValue('-webkit-mask-image'),
        width: Number.parseFloat(style.width),
        height: Number.parseFloat(style.height),
        fill: style.backgroundColor,
        colour: getComputedStyle(element).color,
        fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
        boxWidth: element.getBoundingClientRect().width,
      };
    }),
  );
}

/** Asserts that one icon element paints its glyph in its `currentColor` through exactly one pseudo-element. */
function expectPainted(icon: IconPaint): void {
  const where = `[data-mask-icon="${icon.glyph}"]`;
  expect(icon.painted, `${where}: pseudo-elements with a box`).toHaveLength(1);
  expect(icon.maskImage, `${where}: mask-image`).toContain('url(');
  if (icon.glyph === EMBEDDED) expect(icon.maskImage).toContain('data:image/svg+xml');
  else expect(icon.maskImage).toContain(`/icons/lucide/${icon.glyph}.svg`);
  expect(icon.width, `${where}: width`).toBeGreaterThan(0);
  expect(icon.height, `${where}: height`).toBeGreaterThan(0);
  expect(icon.boxWidth, `${where}: rendered width`).toBeGreaterThan(0);
  expect(icon.fill, `${where}: the fill is currentColor`).toBe(icon.colour);
}

/** Waits until every glyph that is a file has been fetched, and expects each fetch to have succeeded. */
async function expectFilesLoaded(files: Map<string, number>, glyphs: string[]): Promise<void> {
  const wanted = [...new Set(glyphs)].filter((glyph) => glyph !== EMBEDDED).sort();
  await expect.poll(() => wanted.filter((glyph) => files.has(glyph))).toEqual(wanted);
  for (const glyph of wanted) expect(files.get(glyph), `icons/lucide/${glyph}.svg status`).toBe(200);
}

test.describe('each example paints its glyph through a masked pseudo-element', () => {
  for (const story of STORIES) {
    test(story, async ({ page }) => {
      const errors = watchErrors(page);
      const files = watchIconFiles(page);
      await openStory(page, story);
      const icons = await iconPaints(page);
      expect(icons.length).toBeGreaterThan(0);
      for (const icon of icons) expectPainted(icon);
      await expectFilesLoaded(
        files,
        icons.map((icon) => icon.glyph),
      );
      expect(errors, 'console errors and uncaught exceptions').toEqual([]);
    });
  }
});

test('every Phase 1 icon slot holds a painting icon element', async ({ page }) => {
  const slots: string[] = [];
  for (const story of STORIES) {
    await openStory(page, story);
    slots.push(
      ...(await page
        .locator('#storybook-root [data-mask-icon]')
        .evaluateAll((elements) =>
          elements.map((element) => `${element.parentElement?.localName} ${element.slot || '(default)'}`),
        )),
    );
  }
  expect([...new Set(slots)].sort()).toEqual([
    'line-alert icon',
    'line-button prefix',
    'line-button suffix',
    'line-chip indicator',
    'line-chip prefix',
    'line-chip suffix',
    'line-icon-button (default)',
  ]);
});

test('the glyph follows currentColor across the Button variants', async ({ page }) => {
  await openStory(page, 'button-prefix-and-suffix');
  const fills = (await iconPaints(page)).map((icon) => icon.fill);
  expect(new Set(fills).size).toBeGreaterThan(1);
});

test('an icon-only IconButton takes its name from the host aria-label', async ({ page }) => {
  await openStory(page, 'icon-button-icon-only');
  for (const name of ['Settings', 'Add item', 'Close dialog']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
});

test('--icon-style-size sets the glyph size in em', async ({ page }) => {
  await openStory(page, 'size');
  const ratios = (await iconPaints(page)).map((icon) => [icon.width / icon.fontSize, icon.height / icon.fontSize]);
  expect(ratios).toHaveLength(3);
  for (const [index, size] of [1, 1.25, 1.5].entries()) {
    expect(ratios[index]?.[0]).toBeCloseTo(size, 2);
    expect(ratios[index]?.[1]).toBeCloseTo(size, 2);
  }
});

test('hovering the host swaps the glyph through --icon-hover', async ({ page }) => {
  const files = watchIconFiles(page);
  await openStory(page, 'hover-swap');
  const maskImage = async () => (await iconPaints(page))[0]?.maskImage ?? '';
  expect(await maskImage()).toContain('/icons/lucide/star.svg');

  await page.locator('#storybook-root line-button').hover();
  await expect.poll(maskImage).toContain('/icons/lucide/plus.svg');
  const [hovered] = await iconPaints(page);
  expect(hovered, 'the hover-swap icon element').toBeDefined();
  expectPainted({ ...(hovered as IconPaint), glyph: 'plus' });
  await expectFilesLoaded(files, ['star', 'plus']);

  await page.mouse.move(0, 0);
  await expect.poll(maskImage).toContain('/icons/lucide/star.svg');
});

test('a missing token paints nothing and reports nothing', async ({ page }) => {
  const errors = watchErrors(page);
  await openStory(page, 'missing-token');
  const [missing] = await iconPaints(page, '#storybook-root [data-mask-icon-missing]');
  expect(missing?.painted).toEqual([]);
  expect(missing?.boxWidth).toBe(0);
  // The button beside it paints the same way with a declared token.
  const [declared] = await iconPaints(page);
  expect(declared, 'the declared-token icon element').toBeDefined();
  expectPainted(declared as IconPaint);
  expect(errors, 'console errors and uncaught exceptions').toEqual([]);
});

test('only WebKit runs the 301609 workaround animation, on each icon pseudo-element', async ({ page, browserName }) => {
  await page.addInitScript(() => {
    const seen: string[] = [];
    Reflect.set(window, '__webkit301609', seen);
    document.addEventListener(
      'animationend',
      (event) => {
        const glyph = (event.target as Element).getAttribute('data-mask-icon');
        if (event.animationName === 'webkit-301609' && glyph) seen.push(`${glyph} ${event.pseudoElement}`);
      },
      true,
    );
  });
  await openStory(page, 'button-prefix-and-suffix');
  const seen = () => page.evaluate(() => Reflect.get(window, '__webkit301609') as string[]);
  if (browserName === 'webkit') {
    // The keyframes outlive the build only because the recipe re-declares them (css-mask-icons.ts). WebKit also
    // animates the `::before` or `::after` that generates no box, so the painted ones are a subset of the events.
    const painted = ['check ::before', 'plus ::before', 'refresh-cw ::after', 'settings ::after'];
    await expect.poll(seen).toEqual(expect.arrayContaining(painted));
  } else {
    // The workaround sits behind a WebKit-only @supports test, so no icon pseudo-element declares the animation.
    const icons = await iconPaints(page);
    expect(icons).toHaveLength(4);
    for (const icon of icons) expectPainted(icon);
    const names = await page
      .locator('#storybook-root [data-mask-icon]')
      .evaluateAll((elements) =>
        elements.flatMap((element) =>
          ['::before', '::after'].map((pseudo) => getComputedStyle(element, pseudo).animationName),
        ),
      );
    expect(names).toEqual(Array(8).fill('none'));
    // A 0s animation that had started fires animationend by the next frame; wait two to be past it.
    await page.evaluate(() => {
      const { promise, resolve } = Promise.withResolvers<void>();
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      return promise;
    });
    expect(await seen()).toEqual([]);
  }
});

test.describe('axe finds zero violations', () => {
  for (const story of STORIES) {
    test(story, async ({ page }) => {
      await openStory(page, story);
      await expectNoAxeViolations(axe(page).include('#storybook-root'));
    });
  }
});

test('the docs page states the recipe and its limits', async ({ page }) => {
  const errors = watchErrors(page);
  await openDocs(page, 'recipes-css-mask-icons--docs');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('CSS mask icons');
  const docs = page.locator('#storybook-docs');
  for (const term of [
    '@nudeui/icons',
    'Monochrome glyphs only',
    'style queries',
    '.icon-start',
    '301609',
    '320220',
    '325900',
    '10541',
    'UNMAPPED_ICON',
    'iconMap',
    'no mask mode',
  ]) {
    await expect(docs).toContainText(term);
  }
  await expect(docs.locator('a[href="https://lea.verou.me/blog/2026/icons/"]')).toBeAttached();
  await expect(docs.locator('a[href="https://www.npmjs.com/package/@nudeui/icons"]')).toBeAttached();
  expect(errors, 'console errors and uncaught exceptions').toEqual([]);
});

test('Recipes/Overview links the page from its Related section', async ({ page }) => {
  await openDocs(page, 'recipes-overview--docs');
  const related = page.locator('#storybook-docs h2', { hasText: 'Related' });
  await expect(related).toBeVisible();
  await expect(page.locator('#storybook-docs a[href="?path=/docs/recipes-css-mask-icons--docs"]')).toHaveText(
    'CSS mask icons',
  );
});
