/**
 * `<line-spinner>` visual tier (spec `0022-spinner.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11, §10 SD98).
 *
 * Screenshots every Spinner story of D20 on `storybook-static` in the Chromium-only `visual` project.
 * `toHaveScreenshot` disables animations by default and cancels the infinite rotation to its initial state, so each
 * ring is captured unrotated (D21). The Linux baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/spinner.visual
 */

import { test } from 'playwright/test';
import { readySpinnerStory, SPINNER_STORIES, type SpinnerStoryId } from '../spinner-stories';
import { expectStoryScreenshot } from './story';

for (const id of Object.keys(SPINNER_STORIES) as SpinnerStoryId[]) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => readySpinnerStory(page, id) });
  });
}
