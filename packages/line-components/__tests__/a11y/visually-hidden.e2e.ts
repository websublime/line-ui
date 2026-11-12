/**
 * `<line-visually-hidden>` axe tier (spec `0012-visually-hidden.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Visually Hidden story on `storybook-static` (port 4320) and expects zero violations of the §7.4 ruleset
 * in chromium, firefox and webkit (MANIFESTO Law 3), the Skip link focused story with focus on the skip link. axe
 * cannot see an invisible focused child (spec probe P4), so the browser tier
 * (`integration/visually-hidden/visually-hidden.e2e.ts`) carries the reveal proof.
 *
 * @module __tests__/a11y/visually-hidden.e2e
 */

import { expect, test } from 'playwright/test';
import { readyVisuallyHiddenStory, VISUALLY_HIDDEN_STORIES } from '../visually-hidden-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these Visually Hidden stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(
      ([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/visually-hidden.stories.ts',
    )
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...VISUALLY_HIDDEN_STORIES].sort());
});

for (const id of VISUALLY_HIDDEN_STORIES) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await readyVisuallyHiddenStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
