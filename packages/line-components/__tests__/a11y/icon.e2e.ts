/**
 * `<line-icon>` axe tier (spec `0014-icon.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Icon story on `storybook-static` (port 4320), waits for its glyphs, and expects zero violations
 * of the §7.4 ruleset in chromium, firefox and webkit (MANIFESTO Law 3). axe cannot see the internals role or
 * `ariaHidden` (spec A11y, "What axe proves here"), so these tests prove the page breaks no rule, not the icon
 * semantics. The Foreign role story draws a file whose root carries `role="img"` and no name; the injected
 * `aria-hidden="true"` keeps it out of `svg-img-alt` (decision D5).
 *
 * @module __tests__/a11y/icon.e2e
 */

import { expect, test } from 'playwright/test';
import { ICON_STORIES, type IconStoryId, waitForIconStory } from '../icon-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these Icon stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/icon.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual(Object.keys(ICON_STORIES).sort());
});

for (const id of Object.keys(ICON_STORIES) as IconStoryId[]) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await expect(page.locator('#storybook-root line-icon').first()).toBeAttached();
    await waitForIconStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}

test('the Foreign role glyph keeps role="img" under aria-hidden="true", so axe reports no svg-img-alt', async ({
  page,
}) => {
  await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=components-icon--foreign-role&viewMode=story`);
  await waitForIconStory(page, 'components-icon--foreign-role');
  const root = page.locator('#storybook-root line-icon svg');
  await expect(root).toHaveAttribute('role', 'img');
  await expect(root).toHaveAttribute('aria-hidden', 'true');
  await expect(root).toHaveAttribute('part', 'svg');
  const { violations } = await axe(page).include('#storybook-root').analyze();
  expect(violations.map((violation) => violation.id)).toEqual([]);

  // Control: without the injected aria-hidden, the same glyph fails svg-img-alt, so the pass above is not vacuous.
  await root.evaluate((svg) => svg.removeAttribute('aria-hidden'));
  const control = await axe(page).include('#storybook-root').analyze();
  expect(control.violations.map((violation) => violation.id)).toEqual(['svg-img-alt']);
});
