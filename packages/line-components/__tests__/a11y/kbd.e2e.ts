/**
 * `<line-kbd>` axe tier (spec `0015-kbd.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Kbd story on `storybook-static` (port 4320) and expects zero violations of the §7.4 ruleset in
 * chromium, firefox and webkit (MANIFESTO Law 3). axe does not report a host `aria-label` and cannot hear a glyph
 * (P4), so the browser tier (`integration/kbd/kbd.e2e.ts`) carries the name proof.
 *
 * @module __tests__/a11y/kbd.e2e
 */

import { expect, test } from 'playwright/test';
import { KBD_STORIES, readyKbdStory } from '../kbd-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these Kbd stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/kbd.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...KBD_STORIES].sort());
});

for (const id of KBD_STORIES) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await readyKbdStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
