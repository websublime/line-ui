/**
 * `<line-icon>` visual tier (spec `0014-icon.md` Tests, Visual row; Phase 1 spec §6.P.11, §10 SD98).
 *
 * Screenshots every Icon story on `storybook-static` in the Chromium-only `visual` project, after its glyphs
 * have loaded from the self-hosted `public/icons/` files. The Linux baselines come from a
 * `visual-baselines.yml` run.
 *
 * @module __tests__/visual/icon.visual
 */

import { test } from 'playwright/test';
import { ICON_STORIES, type IconStoryId, waitForIconStory } from '../icon-stories';
import { expectStoryScreenshot } from './story';

for (const id of Object.keys(ICON_STORIES) as IconStoryId[]) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => waitForIconStory(page, id) });
  });
}
