/**
 * `<line-grid>` visual tier (spec `0019-grid.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11, §10 SD98).
 *
 * Screenshots every Grid story of D15 on `storybook-static` in the Chromium-only `visual` project. The Linux
 * baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/grid.visual
 */

import { test } from 'playwright/test';
import { GRID_STORIES, readyGridStory } from '../grid-stories';
import { expectStoryScreenshot } from './story';

for (const id of GRID_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => readyGridStory(page, id) });
  });
}
