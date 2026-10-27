/**
 * `<line-button>` visual tier (spec `0002-button.md` Tests, Visual row; Phase 1 spec §6.P.11, §10 SD98).
 *
 * Screenshots every Button story on `storybook-static` in the Chromium-only
 * `visual` project. The Linux baselines come from a `visual-baselines.yml`
 * run. The `default`, `primary` and `borderless` stories must differ, because
 * each variant sets its own `--line-button-bg` and `--line-button-color`
 * defaults (AM-056); the last test compares their screenshots.
 *
 * @module __tests__/visual/button.visual
 */

import { expect, test } from 'playwright/test';
import { BUTTON_STORIES } from '../button-stories';
import { expectStoryScreenshot } from './story';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

for (const id of BUTTON_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id);
  });
}

test('the default, primary and borderless stories render differently', async ({ page }) => {
  const shots = new Set<string>();
  for (const variant of ['default', 'primary', 'borderless']) {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=components-button--${variant}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await expect(page.locator('#storybook-root line-button')).toBeVisible();
    shots.add((await page.screenshot({ fullPage: true })).toString('base64'));
  }
  expect(shots.size).toBe(3);
});
