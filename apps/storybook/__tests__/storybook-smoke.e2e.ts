/**
 * Storybook smoke tier — browser tier (F11, spec §6.F.4, AM-057).
 *
 * Loads the built `apps/storybook/storybook-static` through the second
 * `webServer` entry of `playwright.config.ts` and checks, in each engine, that:
 *   (a) the Getting Started, Theming and Customisation MDX pages render every
 *       `#` / `##` heading of their source and every `<Canvas>` story;
 *   (b) every story of the palette and role design-system stories renders the
 *       swatches the `line-schemas` lists call for, and every token they paint
 *       with resolves where it is painted;
 *   (c) no page logs a console error or throws an uncaught exception.
 * Smoke page-render checks only: no `toHaveScreenshot()` baselines (spec §6.F.4).
 *
 * @module __tests__/storybook-smoke.e2e
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ALIASES,
  GRAY_HUES,
  HUES,
  ROLES,
  type Role,
  SEMANTIC_MAP,
  type SemanticRole,
  STEPS,
} from '@websublime/line-schemas';
import { expect, type Page, test } from 'playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4320' });

/** The `color-scheme` values the design-system stories render. */
const MODES = ['light', 'dark'] as const;

/** MDX docs pages by Storybook id, with their source file under `stories/`. */
const DOCS = {
  'getting-started--docs': 'getting-started.mdx',
  'theming--docs': 'theming.mdx',
  'customisation--docs': 'customisation.mdx',
} as const;

/** Every story the palette and role stories export, by Storybook id. */
const PALETTE_STORIES = ['design-system-palettes--all-hues'];
const ROLE_STORIES = ['design-system-roles--bindings', 'design-system-roles--toolbar'];

const SEMANTIC_ROLES = ROLES.filter((role): role is SemanticRole => role in SEMANTIC_MAP);

interface Panel {
  data: Record<string, string>;
  tokens: string[];
  contrasts: string[];
  unresolved: string[];
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

/** Opens a Storybook entry in the preview iframe and waits for Storybook to show it. */
async function open(page: Page, id: string, viewMode: 'docs' | 'story', args = ''): Promise<void> {
  await page.goto(`/iframe.html?id=${id}&viewMode=${viewMode}${args ? `&args=${args}` : ''}`);
  await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
}

/** Asserts that Storybook shows no error screen and the page logged no error. */
async function expectNoErrors(page: Page, errors: string[]): Promise<void> {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toHaveClass(/\bsb-show-(errordisplay|nopreview)\b/);
  expect(errors, 'console errors and uncaught exceptions').toEqual([]);
}

/** Reads the `#` / `##` headings and counts the `<Canvas>` blocks of an MDX file, skipping code fences. */
function mdxOutline(file: string): { h1: string[]; h2: string[]; canvases: number } {
  const source = readFileSync(fileURLToPath(new URL(`../stories/${file}`, import.meta.url)), 'utf8');
  const outline = { h1: [] as string[], h2: [] as string[], canvases: 0 };
  let fenced = false;
  for (const line of source.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    if (fenced) continue;
    const heading = /^(#{1,2}) (.+)$/.exec(line);
    if (heading) (heading[1] === '#' ? outline.h1 : outline.h2).push((heading[2] as string).replaceAll('`', ''));
    if (line.startsWith('<Canvas ')) outline.canvases += 1;
  }
  return outline;
}

/**
 * Reads every element matching `selector`: its `data-*` attributes, the tokens of
 * its swatches and contrast samples in DOM order, and every token those paint
 * with that computes empty where it is painted. A transparency check would not
 * do, because some Radix alpha steps are fully transparent by design.
 */
function panels(page: Page, selector: string): Promise<Panel[]> {
  return page.locator(selector).evaluateAll((elements) => {
    const empty = (el: Element | null, tokens: string[]): string[] =>
      tokens.filter((token) => el === null || getComputedStyle(el).getPropertyValue(token).trim() === '');
    return elements.map((el) => {
      const swatches = [...el.querySelectorAll<HTMLElement>('.ds-swatch')];
      const contrasts = [...el.querySelectorAll<HTMLElement>('.ds-contrast')];
      return {
        data: { ...(el as HTMLElement).dataset } as Record<string, string>,
        tokens: swatches.map((swatch) => swatch.dataset.token ?? ''),
        contrasts: contrasts.map((sample) => sample.dataset.contrast ?? ''),
        unresolved: [
          ...swatches.flatMap((swatch) => empty(swatch.querySelector('.ds-chip'), [swatch.dataset.token ?? ''])),
          ...contrasts.flatMap((sample) => {
            const prefix = sample.dataset.contrast ?? '';
            return empty(sample, [`${prefix}-9`, `${prefix}-contrast`]);
          }),
        ],
      };
    });
  });
}

/** The swatches and contrast sample `roles.stories.ts` renders for one role row. */
function roleRow(role: Role): Pick<Panel, 'tokens' | 'contrasts'> {
  return {
    tokens: [...STEPS.map((step) => `--line-${role}-${step}`), ...ALIASES.map((alias) => `--line-${role}-${alias}`)],
    contrasts: [`--line-${role}`],
  };
}

/** The expected panel for a set of role rows. */
function rolePanel(data: Record<string, string>, roles: readonly Role[]): Panel {
  const rows = roles.map(roleRow);
  return {
    data,
    tokens: rows.flatMap((row) => row.tokens),
    contrasts: rows.flatMap((row) => row.contrasts),
    unresolved: [],
  };
}

test('the Storybook index lists exactly the entries this smoke tier covers', async ({ request }) => {
  const response = await request.get('/index.json');
  expect(response.ok()).toBe(true);
  const { entries } = (await response.json()) as {
    entries: Record<string, { type: string; importPath: string }>;
  };
  const ids = (importPaths: string[], type: string): string[] =>
    Object.entries(entries)
      .filter(([, entry]) => entry.type === type && importPaths.includes(entry.importPath))
      .map(([id]) => id)
      .sort();

  const docsFiles = Object.values(DOCS).map((file) => `./stories/${file}`);
  expect(ids(docsFiles, 'docs')).toEqual(Object.keys(DOCS).sort());
  expect(ids(['./stories/design-system/palettes.stories.ts'], 'story')).toEqual(PALETTE_STORIES);
  expect(ids(['./stories/design-system/roles.stories.ts'], 'story')).toEqual([...ROLE_STORIES].sort());
});

for (const [id, file] of Object.entries(DOCS)) {
  test(`the ${file} docs page renders without errors`, async ({ page }) => {
    const errors = watchErrors(page);
    const { h1, h2, canvases } = mdxOutline(file);
    expect(h1, `${file} has one # heading`).toHaveLength(1);

    await open(page, id, 'docs');
    const docs = page.locator('#storybook-docs');
    for (const name of h1) await expect(docs.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
    for (const name of h2) await expect(docs.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();

    const stories = docs.locator('.docs-story [id^="story--"][id$="-inner"]');
    await expect(stories).toHaveCount(canvases);
    for (const story of await stories.all()) await expect(story).not.toBeEmpty();

    await expectNoErrors(page, errors);
  });
}

test('the palettes story renders every hue in both modes', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'design-system-palettes--all-hues', 'story');
  await expect(page.locator('#storybook-root section[data-hue]')).toHaveCount(HUES.length);

  const tokens = (hue: string): string[] => [
    ...STEPS.map((step) => `--line-${hue}-${step}`),
    ...STEPS.map((step) => `--line-${hue}-a${step}`),
  ];
  expect(await panels(page, '#storybook-root section[data-hue]')).toEqual(
    HUES.map((hue) => ({
      data: { hue },
      tokens: MODES.flatMap(() => tokens(hue)),
      contrasts: MODES.map(() => `--line-${hue}`),
      unresolved: [],
    })),
  );
  expect(await panels(page, '#storybook-root section[data-hue] [data-mode]')).toEqual(
    HUES.flatMap((hue) =>
      MODES.map((mode) => ({ data: { mode }, tokens: tokens(hue), contrasts: [`--line-${hue}`], unresolved: [] })),
    ),
  );

  await expectNoErrors(page, errors);
});

for (const mode of MODES) {
  test(`the role bindings story renders every accent, gray and semantic binding (${mode})`, async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, 'design-system-roles--bindings', 'story', `mode:${mode}`);
    const root = '#storybook-root .ds-page';
    await expect(page.locator(root)).toHaveCSS('color-scheme', mode);

    expect(await panels(page, `${root} section[data-binding]`)).toEqual([
      ...HUES.map((accent) => rolePanel({ binding: 'accent', accent }, ['accent', 'gray'])),
      ...GRAY_HUES.map((gray) => rolePanel({ binding: 'gray', gray }, ['gray'])),
      ...SEMANTIC_ROLES.map((role) => rolePanel({ binding: 'semantic' }, [role])),
    ]);

    await expectNoErrors(page, errors);
  });

  test(`the role toolbar story renders every role at the root (${mode})`, async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, 'design-system-roles--toolbar', 'story', `mode:${mode}`);
    const root = '#storybook-root .ds-page';
    await expect(page.locator(root)).toHaveCSS('color-scheme', mode);

    expect(await panels(page, `${root} section[data-binding]`)).toEqual([rolePanel({ binding: 'root' }, ROLES)]);

    await expectNoErrors(page, errors);
  });
}
