/**
 * `<line-icon-button>` axe tier (spec `0003-icon-button.md` Tests, A11y row; Phase 1 spec §6.C.5, §6.P.7, §7.4).
 *
 * Opens every IconButton story on `storybook-static` (port 4320), waits for its glyphs, and expects zero
 * violations of the §7.4 ruleset in chromium, firefox and webkit (MANIFESTO Law 3).
 *
 * The negative fixture proves the gate catches a hand-written icon button without a name (§6.C.5; §10 SD36): a
 * `<line-icon-button>` holding only a decorative `<line-icon>` reports `button-name` on its inner native
 * `<button>`, and the same markup with a host `aria-label` reports nothing. The fixture is built with
 * `page.setContent()` on the port-4321 origin, which loads the built `./icon-button` and `./icon` subpaths, not
 * from a story, so an inaccessible example never ships in the published docs (pattern of `axe-gate.e2e.ts`).
 *
 * @module __tests__/a11y/icon-button.e2e
 */

import { expect, type Page, test } from 'playwright/test';
import { ICON_BUTTON_STORIES, type IconButtonStoryId, waitForIconButtonStory } from '../icon-button-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';
const FIXTURE_ORIGIN = 'http://127.0.0.1:4321';

test('the Storybook index lists exactly these IconButton stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/icon-button.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual(Object.keys(ICON_BUTTON_STORIES).sort());
});

for (const id of Object.keys(ICON_BUTTON_STORIES) as IconButtonStoryId[]) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await expect(page.locator('#storybook-root line-icon-button').first()).toBeVisible();
    await waitForIconButtonStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}

/** Loads a page on the fixture origin whose `<main>` holds `host`, with IconButton and Icon defined. */
async function loadFixture(page: Page, host: string): Promise<void> {
  await page.goto(`${FIXTURE_ORIGIN}/icon-button/`);
  await page.setContent(`<!doctype html>
<html lang="en">
  <head>
    <title>IconButton axe fixture</title>
    <script type="module" src="/icon-button/fixture.ts"></script>
  </head>
  <body>
    <main>${host}</main>
  </body>
</html>`);
  await page.evaluate(async () => {
    await customElements.whenDefined('line-icon-button');
    await customElements.whenDefined('line-icon');
    const icon = document.querySelector('line-icon') as HTMLElement & {
      path: string;
      updateComplete: Promise<unknown>;
    };
    icon.path = 'M4 4 L20 20 M20 4 L4 20';
    await icon.updateComplete;
    await (document.querySelector('line-icon-button') as HTMLElement & { updateComplete: Promise<unknown> })
      .updateComplete;
  });
  await expect(page.locator('line-icon-button line-icon svg')).toHaveCount(1);
}

test('a hand-written icon button with a decorative icon and no name fails with button-name', async ({ page }) => {
  await loadFixture(page, '<line-icon-button><line-icon></line-icon></line-icon-button>');

  const { violations } = await axe(page).analyze();
  expect(violations.map((violation) => violation.id)).toEqual(['button-name']);
  await expect(expectNoAxeViolations(axe(page))).rejects.toThrow(/button-name/);
});

test('the same icon button with a host aria-label passes with zero violations', async ({ page }) => {
  await loadFixture(page, '<line-icon-button aria-label="Close"><line-icon></line-icon></line-icon-button>');

  const { violations } = await axe(page).analyze();
  expect(violations.map((violation) => violation.id)).toEqual([]);
  await expectNoAxeViolations(axe(page));
});
