/**
 * `<line-badge>` visual tier (spec `0007-badge.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11, §10 SD98).
 *
 * Screenshots every Badge story on `storybook-static` in the Chromium-only `visual` project. The Linux baselines come
 * from a `visual-baselines.yml` run; the five tone stories draw five different baselines.
 *
 * @module __tests__/visual/badge.visual
 */

import { test } from 'playwright/test';
import { BADGE_STORIES, waitForBadgeStory } from '../badge-stories';
import { expectStoryScreenshot } from './story';

for (const id of BADGE_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => waitForBadgeStory(page) });
  });
}
