/**
 * `<line-aspect-ratio>` visual tier (spec `0021-aspect-ratio.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11,
 * §10 SD98).
 *
 * Screenshots every Aspect Ratio story of D15 on `storybook-static` in the Chromium-only `visual` project. The Linux
 * baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/aspect-ratio.visual
 */

import { test } from 'playwright/test';
import { ASPECT_RATIO_STORIES, type AspectRatioStoryId, readyAspectRatioStory } from '../aspect-ratio-stories';
import { expectStoryScreenshot } from './story';

for (const id of Object.keys(ASPECT_RATIO_STORIES) as AspectRatioStoryId[]) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => readyAspectRatioStory(page, id) });
  });
}
