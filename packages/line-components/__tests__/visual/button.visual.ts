/**
 * `<line-button>` visual tier (spec `0002-button.md` Tests, Visual row; Phase 1 spec §6.P.11, §10 SD98).
 *
 * Screenshots every Button story on `storybook-static` in the Chromium-only
 * `visual` project. The Linux baselines come from a `visual-baselines.yml`
 * run. The `default`, `primary` and `borderless` stories must differ, because
 * each variant sets its own `--line-button-bg` and `--line-button-color`
 * defaults (AM-056); the last test renders the three with one label and
 * compares their `::part(root)` backgrounds and their screenshots.
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

test('the default, primary and borderless variants render differently with the same label', async ({ page }) => {
  const shots = new Set<string>();
  const backgrounds = new Set<string>();
  for (const variant of ['default', 'primary', 'borderless']) {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=components-button--${variant}&viewMode=story&args=label:Save`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    const host = page.locator('#storybook-root line-button');
    await expect(host).toHaveText('Save');
    backgrounds.add(
      await host.evaluate(
        (el) => getComputedStyle(el.shadowRoot?.querySelector('[part="root"]') as Element).backgroundColor,
      ),
    );
    shots.add((await page.screenshot({ fullPage: true })).toString('base64'));
  }
  expect(backgrounds.size).toBe(3);
  expect(shots.size).toBe(3);
});
