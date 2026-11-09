/**
 * `<line-button-group>` axe tier (spec `0004-button-group.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every ButtonGroup story on `storybook-static` (port 4320), waits for its glyphs and its button positions,
 * and expects zero violations of the §7.4 ruleset in chromium, firefox and webkit (MANIFESTO Law 3). axe has no
 * toolbar-name rule and ignores the internals role (spec probe P6), so the toolbar's role, name and orientation
 * are proved in the browser tier (`integration/button-group/button-group.e2e.ts`).
 *
 * @module __tests__/a11y/button-group.e2e
 */

import { expect, test } from 'playwright/test';
import { BUTTON_GROUP_STORIES, type ButtonGroupStoryId, waitForButtonGroupStory } from '../button-group-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these ButtonGroup stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(
      ([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/button-group.stories.ts',
    )
    .map(([id]) => id);
  expect(ids.sort()).toEqual(Object.keys(BUTTON_GROUP_STORIES).sort());
});

for (const id of Object.keys(BUTTON_GROUP_STORIES) as ButtonGroupStoryId[]) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await expect(page.locator('#storybook-root line-button-group').first()).toBeVisible();
    await waitForButtonGroupStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
