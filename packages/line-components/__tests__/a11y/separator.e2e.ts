/**
 * `<line-separator>` axe tier (spec `0011-separator.md` Tests, A11y row; Phase 1 spec §6.P.7, §7.4).
 *
 * Opens every Separator story on `storybook-static` (port 4320) and expects zero
 * violations of the §7.4 ruleset in chromium, firefox and webkit
 * (MANIFESTO Law 3). axe cannot see the internals role (spec A11y, "What axe proves here"),
 * so these tests prove the page breaks no rule, not the separator semantics.
 *
 * @module __tests__/a11y/separator.e2e
 */

import { expect, test } from 'playwright/test';
import { SEPARATOR_STORIES } from '../separator-stories';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

test('the Storybook index lists exactly these Separator stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/components/separator.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual([...SEPARATOR_STORIES].sort());
});

for (const id of SEPARATOR_STORIES) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await expect(page.locator('#storybook-root line-separator').first()).toBeVisible();
    await page.evaluate(() =>
      Promise.all(
        [...document.querySelectorAll('line-separator, line-stack')].map(
          (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
        ),
      ),
    );
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}
