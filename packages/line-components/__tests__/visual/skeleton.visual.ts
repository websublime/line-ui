/**
 * `<line-skeleton>` visual tier (spec `0016-skeleton.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11, §10 SD98).
 *
 * Screenshots every Skeleton story on `storybook-static` in the Chromium-only `visual` project. `toHaveScreenshot`
 * disables animations by default and fast-forwards the finite two-cycle motion to its resting style, so the Wave
 * baseline shows the plain fill with no band (D14, D17). The Linux baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/skeleton.visual
 */

import { test } from 'playwright/test';
import { readySkeletonStory, SKELETON_STORIES } from '../skeleton-stories';
import { expectStoryScreenshot } from './story';

for (const id of SKELETON_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => readySkeletonStory(page, id) });
  });
}
