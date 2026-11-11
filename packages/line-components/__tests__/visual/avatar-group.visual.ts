/**
 * `<line-avatar-group>` visual tier (spec `0010-avatar-group.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11,
 * §10 SD98).
 *
 * Screenshots every AvatarGroup story on `storybook-static` in the Chromium-only `visual` project, once no picture is
 * still loading: collapsed, and the Expanded and Open stories in their state through the `ready` hook (D26). The Linux
 * baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/avatar-group.visual
 */

import { test } from 'playwright/test';
import { AVATAR_GROUP_STORIES, readyAvatarGroupStory } from '../avatar-group-stories';
import { expectStoryScreenshot } from './story';

for (const id of AVATAR_GROUP_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => readyAvatarGroupStory(page, id) });
  });
}
