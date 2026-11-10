/**
 * `<line-chip>` visual tier (spec `0008-chip.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11, §10 SD98).
 *
 * Screenshots every Chip story on `storybook-static` in the Chromium-only `visual` project, after its glyphs have
 * loaded from the self-hosted `public/icons/` files. The Linux baselines come from a `visual-baselines.yml` run. The
 * default off, default pressed, primary off and primary pressed chips must differ, because each sets its own
 * `--line-chip-*` colour defaults (F4, F8, F10); the last test renders the four with one label and compares their
 * `::part(root)` colours and their screenshots.
 *
 * @module __tests__/visual/chip.visual
 */

import { expect, test } from 'playwright/test';
import { CHIP_STORIES, type ChipStoryId, waitForChipStory } from '../chip-stories';
import { expectStoryScreenshot } from './story';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

for (const id of Object.keys(CHIP_STORIES) as ChipStoryId[]) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => waitForChipStory(page, id) });
  });
}

test('the default off, default pressed, primary off and primary pressed chips render differently', async ({ page }) => {
  const shots = new Set<string>();
  const colours = new Set<string>();
  for (const id of [
    'components-chip--default',
    'components-chip--pressed',
    'components-chip--primary',
    'components-chip--primary-pressed',
  ] as const) {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story&args=label:In+stock`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await waitForChipStory(page, id);
    const host = page.locator('#storybook-root line-chip');
    await expect(host).toHaveText('In stock');
    colours.add(
      await host.evaluate((el) => {
        const style = getComputedStyle(el.shadowRoot?.querySelector('[part="root"]') as Element);
        return `${style.backgroundColor} ${style.color} ${style.borderTopColor}`;
      }),
    );
    shots.add((await page.screenshot({ fullPage: true })).toString('base64'));
  }
  expect(colours.size).toBe(4);
  expect(shots.size).toBe(4);
});
