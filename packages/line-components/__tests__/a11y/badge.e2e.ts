/**
 * `<line-badge>` axe tier (spec `0007-badge.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Badge story on `storybook-static` (port 4320) and expects zero violations of the §7.4 ruleset in
 * chromium, firefox and webkit (MANIFESTO Law 3). axe cannot see the internals role or name (spec probe P3), so the
 * `img` role, its name and the hidden dot are proved in the browser tier (`integration/badge/badge.e2e.ts`).
 *
 * @module __tests__/a11y/badge.e2e
 */

import { expect, test } from 'playwright/test';
import { BADGE_STORIES, waitForBadgeStory } from '../badge-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these Badge stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/badge.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...BADGE_STORIES].sort());
});

for (const id of BADGE_STORIES) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await waitForBadgeStory(page);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
