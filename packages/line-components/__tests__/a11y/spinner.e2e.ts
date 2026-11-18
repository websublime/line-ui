/**
 * `<line-spinner>` axe tier (spec `0022-spinner.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Spinner story of D20 on `storybook-static` (port 4320) and expects zero violations of the §7.4 ruleset
 * in chromium, firefox and webkit (MANIFESTO Law 3). axe sees no internals role or name (probe P1), so the browser
 * tier (`integration/spinner/spinner.e2e.ts`) carries the CDP and `INTERNALS` proof (D18).
 *
 * @module __tests__/a11y/spinner.e2e
 */

import { expect, test } from 'playwright/test';
import { readySpinnerStory, SPINNER_STORIES, type SpinnerStoryId } from '../spinner-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';
const IDS = Object.keys(SPINNER_STORIES) as SpinnerStoryId[];

test('the Storybook index lists exactly these Spinner stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/spinner.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...IDS].sort());
});

for (const id of IDS) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await readySpinnerStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
