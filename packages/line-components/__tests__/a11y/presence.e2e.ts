/**
 * `<line-presence>` axe tier (spec `0017-presence.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Presence story on `storybook-static` (port 4320) and expects zero violations of the §7.4 ruleset in
 * chromium, firefox and webkit (MANIFESTO Law 3). Each scan runs after every animation settles, because axe reports
 * `color-contrast` while text sits at partial opacity mid-animation (P3; D15). The browser tier
 * (`integration/presence/presence.e2e.ts`) carries the hidden-content proof.
 *
 * @module __tests__/a11y/presence.e2e
 */

import { expect, test } from 'playwright/test';
import { PRESENCE_STORIES, readyPresenceStory } from '../presence-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these Presence stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/presence.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...PRESENCE_STORIES].sort());
});

for (const id of PRESENCE_STORIES) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await readyPresenceStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
