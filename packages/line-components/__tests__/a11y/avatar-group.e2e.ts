/**
 * `<line-avatar-group>` axe tier (spec `0010-avatar-group.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every AvatarGroup story on `storybook-static` (port 4320) and expects zero violations of the §7.4 ruleset in
 * chromium, firefox and webkit (MANIFESTO Law 3), with the panel closed, and, for the Open story, with it open: the
 * Expanded and Open stories are hovered or clicked first, as the visual tier does (D26). "+N" is an inner native
 * `button`, so `button-name` and `label-content-name-mismatch` apply to it (spec probe P3).
 *
 * @module __tests__/a11y/avatar-group.e2e
 */

import { expect, test } from 'playwright/test';
import { AVATAR_GROUP_STORIES, readyAvatarGroupStory } from '../avatar-group-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these AvatarGroup stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(
      ([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/avatar-group.stories.ts',
    )
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...AVATAR_GROUP_STORIES].sort());
});

for (const id of AVATAR_GROUP_STORIES) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await readyAvatarGroupStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
