/**
 * `<line-visually-hidden>` visual tier (spec `0012-visually-hidden.md` Tests, Visual row; Phase 1 spec §6.C.6,
 * §6.P.11, §10 SD98).
 *
 * Screenshots every Visually Hidden story on `storybook-static` in the Chromium-only `visual` project, the Skip link
 * focused story with focus on the skip link through the `ready` hook, so a regression that shows hidden words or moves
 * the layout changes a baseline. The Linux baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/visually-hidden.visual
 */

import { test } from 'playwright/test';
import { readyVisuallyHiddenStory, VISUALLY_HIDDEN_STORIES } from '../visually-hidden-stories';
import { expectStoryScreenshot } from './story';

for (const id of VISUALLY_HIDDEN_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => readyVisuallyHiddenStory(page, id) });
  });
}
