/**
 * `<line-alert>` axe tier (spec `0006-alert.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Alert story on `storybook-static` (port 4320), waits for its glyphs, and expects zero violations of the
 * §7.4 ruleset in chromium, firefox and webkit (MANIFESTO Law 3). axe cannot see the internals role (spec A11y,
 * "What axe proves here"), so the live role, its properties and its name are proved in the browser tier
 * (`integration/alert/alert.e2e.ts`).
 *
 * @module __tests__/a11y/alert.e2e
 */

import { expect, test } from 'playwright/test';
import { ALERT_STORIES, type AlertStoryId, waitForAlertStory } from '../alert-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these Alert stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/alert.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual(Object.keys(ALERT_STORIES).sort());
});

for (const id of Object.keys(ALERT_STORIES) as AlertStoryId[]) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await waitForAlertStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
