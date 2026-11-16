/**
 * `<line-skeleton>` axe tier (spec `0016-skeleton.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Skeleton story on `storybook-static` (port 4320) and expects zero violations of the §7.4 ruleset in
 * chromium, firefox and webkit (MANIFESTO Law 3). axe does not report a host `aria-label` (P1 B11), so the browser
 * tier (`integration/skeleton/skeleton.e2e.ts`) carries the empty-tree proof.
 *
 * @module __tests__/a11y/skeleton.e2e
 */

import { expect, test } from 'playwright/test';
import { readySkeletonStory, SKELETON_STORIES } from '../skeleton-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these Skeleton stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/skeleton.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...SKELETON_STORIES].sort());
});

for (const id of SKELETON_STORIES) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await readySkeletonStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
