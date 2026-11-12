/**
 * `<line-portal>` axe tier (spec `0013-portal.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Portal story on `storybook-static` (port 4320) and expects zero violations of the §7.4 ruleset in
 * chromium, firefox and webkit (MANIFESTO Law 3), the In a modal dialog story with its dialog open and the hint
 * raised. `readyPortalStory` runs first, because the axe tier opens stories itself and runs no `ready` hook.
 *
 * @module __tests__/a11y/portal.e2e
 */

import { expect, test } from 'playwright/test';
import { PORTAL_STORIES, readyPortalStory } from '../portal-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these Portal stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/portal.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...PORTAL_STORIES].sort());
});

for (const id of PORTAL_STORIES) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await readyPortalStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
