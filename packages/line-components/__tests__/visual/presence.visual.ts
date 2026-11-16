/**
 * `<line-presence>` visual tier (spec `0017-presence.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11, §10 SD98).
 *
 * Screenshots every Presence story on `storybook-static` in the Chromium-only `visual` project, each open with its
 * animations settled. `toHaveScreenshot` disables animations by default, so each baseline shows the settled state.
 * The Linux baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/presence.visual
 */

import { test } from 'playwright/test';
import { PRESENCE_STORIES, readyPresenceStory } from '../presence-stories';
import { expectStoryScreenshot } from './story';

for (const id of PRESENCE_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => readyPresenceStory(page, id) });
  });
}
