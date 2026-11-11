/**
 * `<line-avatar>` axe tier (spec `0009-avatar.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Avatar story on `storybook-static` (port 4320) and expects zero violations of the §7.4 ruleset in
 * chromium, firefox and webkit (MANIFESTO Law 3). The `img` role and its name sit on the shadow `root`, which axe
 * checks: an unnamed `role="img"` would fail `role-img-alt` (spec probe P3).
 *
 * @module __tests__/a11y/avatar.e2e
 */

import { expect, test } from 'playwright/test';
import { AVATAR_STORIES, waitForAvatarStory } from '../avatar-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these Avatar stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/avatar.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...AVATAR_STORIES].sort());
});

for (const id of AVATAR_STORIES) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await waitForAvatarStory(page);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
