/**
 * `<line-separator>` visual tier (spec `0011-separator.md` Tests, Visual row; Phase 1 spec §6.P.11, §10 SD98).
 *
 * Screenshots every Separator story on `storybook-static` in the Chromium-only
 * `visual` project. The Linux baselines come from a `visual-baselines.yml`
 * run.
 *
 * @module __tests__/visual/separator.visual
 */

import { test } from 'playwright/test';
import { SEPARATOR_STORIES } from '../separator-stories';
import { expectStoryScreenshot } from './story';

for (const id of SEPARATOR_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id);
  });
}
