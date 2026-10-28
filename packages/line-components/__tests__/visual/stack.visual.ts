/**
 * `<line-stack>` visual tier (spec `0018-stack.md` Tests, Visual row; Phase 1 spec §6.P.11, §10 SD98).
 *
 * Screenshots every Stack story on `storybook-static` in the Chromium-only
 * `visual` project. The Linux baselines come from a `visual-baselines.yml`
 * run.
 *
 * @module __tests__/visual/stack.visual
 */

import { test } from 'playwright/test';
import { STACK_STORIES } from '../stack-stories';
import { expectStoryScreenshot } from './story';

for (const id of STACK_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id);
  });
}
