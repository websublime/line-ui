/**
 * `<line-center>` visual tier (spec `0020-center.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11, §10 SD98).
 *
 * Screenshots every Center story of D14 on `storybook-static` in the Chromium-only `visual` project. The Linux
 * baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/center.visual
 */

import { test } from 'playwright/test';
import { CENTER_STORIES, readyCenterStory } from '../center-stories';
import { expectStoryScreenshot } from './story';

for (const id of CENTER_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => readyCenterStory(page, id) });
  });
}
