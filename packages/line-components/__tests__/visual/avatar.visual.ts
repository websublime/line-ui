/**
 * `<line-avatar>` visual tier (spec `0009-avatar.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11, §10 SD98).
 *
 * Screenshots every Avatar story on `storybook-static` in the Chromium-only `visual` project, once no picture is
 * still loading. The Linux baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/avatar.visual
 */

import { test } from 'playwright/test';
import { AVATAR_STORIES, waitForAvatarStory } from '../avatar-stories';
import { expectStoryScreenshot } from './story';

for (const id of AVATAR_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => waitForAvatarStory(page) });
  });
}
