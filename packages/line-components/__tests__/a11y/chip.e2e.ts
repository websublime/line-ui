/**
 * `<line-chip>` axe tier (spec `0008-chip.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Chip story on `storybook-static` (port 4320), waits for its glyphs, and expects zero violations of the
 * §7.4 ruleset in chromium, firefox and webkit (MANIFESTO Law 3).
 *
 * The negative fixture proves the gate catches a hand-written chip without a name: an empty `<line-chip>` reports
 * `button-name` on its inner native `<button>`, and the same chip with a label reports nothing. The fixture is built
 * with `page.setContent()` on the port-4321 origin, which loads the built `./chip` subpath, not from a story, so an
 * inaccessible example never ships in the published docs (pattern of `axe-gate.e2e.ts`).
 *
 * @module __tests__/a11y/chip.e2e
 */

import { expect, type Page, test } from 'playwright/test';
import { CHIP_STORIES, type ChipStoryId, waitForChipStory } from '../chip-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';
const FIXTURE_ORIGIN = 'http://127.0.0.1:4321';

test('the Storybook index lists exactly these Chip stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/chip.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual(Object.keys(CHIP_STORIES).sort());
});

for (const id of Object.keys(CHIP_STORIES) as ChipStoryId[]) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await waitForChipStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}

/** Loads a page on the fixture origin whose `<main>` holds `host`, with Chip defined. */
async function loadFixture(page: Page, host: string): Promise<void> {
  await page.goto(`${FIXTURE_ORIGIN}/chip/`);
  await page.setContent(`<!doctype html>
<html lang="en">
  <head>
    <title>Chip axe fixture</title>
    <script type="module" src="/chip/fixture.ts"></script>
  </head>
  <body>
    <main>${host}</main>
  </body>
</html>`);
  await page.evaluate(async () => {
    await customElements.whenDefined('line-chip');
    await (document.querySelector('line-chip') as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
  });
  await expect(page.locator('line-chip button')).toBeAttached();
}

test('a hand-written chip with no content and no name fails with button-name', async ({ page }) => {
  await loadFixture(page, '<line-chip></line-chip>');

  const { violations } = await axe(page).analyze();
  expect(violations.map((violation) => violation.id)).toEqual(['button-name']);
  await expect(expectNoAxeViolations(axe(page))).rejects.toThrow(/button-name/);
});

test('the same chip with a label passes with zero violations', async ({ page }) => {
  await loadFixture(page, '<line-chip>In stock</line-chip>');

  const { violations } = await axe(page).analyze();
  expect(violations.map((violation) => violation.id)).toEqual([]);
  await expectNoAxeViolations(axe(page));
});
