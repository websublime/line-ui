/**
 * `<line-icon-button>` visual tier (spec `0003-icon-button.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11,
 * §10 SD98).
 *
 * Screenshots every IconButton story on `storybook-static` in the Chromium-only `visual` project, after its glyphs
 * have loaded from the self-hosted `public/icons/` files. The Linux baselines come from a `visual-baselines.yml`
 * run. The `default`, `primary` and `borderless` stories must differ, because each variant sets its own
 * `--line-icon-button-bg` and `--line-icon-button-color` defaults (AM-056); the last test renders the three with
 * one icon and label and compares their `::part(root)` backgrounds and their screenshots.
 *
 * @module __tests__/visual/icon-button.visual
 */

import { expect, test } from 'playwright/test';
import { ICON_BUTTON_STORIES, type IconButtonStoryId, waitForIconButtonStory } from '../icon-button-stories';
import { expectStoryScreenshot } from './story';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

for (const id of Object.keys(ICON_BUTTON_STORIES) as IconButtonStoryId[]) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => waitForIconButtonStory(page, id) });
  });
}

test('the default, primary and borderless variants render differently with the same icon', async ({ page }) => {
  const shots = new Set<string>();
  const backgrounds = new Set<string>();
  for (const variant of ['default', 'primary', 'borderless'] as const) {
    const id: IconButtonStoryId = `components-icon-button--${variant}`;
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story&args=label:Settings;icon:settings`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await waitForIconButtonStory(page, id);
    const host = page.locator('#storybook-root line-icon-button');
    await expect(host).toHaveAttribute('aria-label', 'Settings');
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
