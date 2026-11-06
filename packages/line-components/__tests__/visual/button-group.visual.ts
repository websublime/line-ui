/**
 * `<line-button-group>` visual tier (spec `0004-button-group.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11,
 * §10 SD98).
 *
 * Screenshots every ButtonGroup story on `storybook-static` in the Chromium-only `visual` project, after its glyphs
 * have loaded from the self-hosted `public/icons/` files and the group has written its button positions. The Linux
 * baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/button-group.visual
 */

import { test } from 'playwright/test';
import { BUTTON_GROUP_STORIES, type ButtonGroupStoryId, waitForButtonGroupStory } from '../button-group-stories';
import { expectStoryScreenshot } from './story';

for (const id of Object.keys(BUTTON_GROUP_STORIES) as ButtonGroupStoryId[]) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => waitForButtonGroupStory(page, id) });
  });
}
