/**
 * `<line-aspect-ratio>` axe tier (spec `0021-aspect-ratio.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Aspect Ratio story of D15 on `storybook-static` (port 4320) and expects zero violations of the §7.4
 * ruleset in chromium, firefox and webkit (MANIFESTO Law 3). axe does not report a host `aria-label` on a role-less
 * Aspect Ratio (P1 C), so the browser tier (`integration/aspect-ratio/aspect-ratio.e2e.ts`) carries the tree proof.
 *
 * @module __tests__/a11y/aspect-ratio.e2e
 */

import { expect, test } from 'playwright/test';
import { ASPECT_RATIO_STORIES, type AspectRatioStoryId, readyAspectRatioStory } from '../aspect-ratio-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';
const IDS = Object.keys(ASPECT_RATIO_STORIES) as AspectRatioStoryId[];

test('the Storybook index lists exactly these Aspect Ratio stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(
      ([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/aspect-ratio.stories.ts',
    )
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...IDS].sort());
});

for (const id of IDS) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await readyAspectRatioStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
