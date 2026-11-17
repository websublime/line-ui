/**
 * `<line-center>` axe tier (spec `0020-center.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Center story of D14 on `storybook-static` (port 4320) and expects zero violations of the §7.4 ruleset
 * in chromium, firefox and webkit (MANIFESTO Law 3). axe does not report a host `aria-label` on a role-less Center
 * (P1 C), so the browser tier (`integration/center/center.e2e.ts`) carries the tree proof.
 *
 * @module __tests__/a11y/center.e2e
 */

import { expect, test } from 'playwright/test';
import { CENTER_STORIES, readyCenterStory } from '../center-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these Center stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/center.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...CENTER_STORIES].sort());
});

for (const id of CENTER_STORIES) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await readyCenterStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
