/**
 * `<line-kbd>` visual tier (spec `0015-kbd.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11, §10 SD98).
 *
 * Screenshots every Kbd story on `storybook-static` in the Chromium-only `visual` project. Each story sets
 * `platform`, so the Apple and other drawings each have their own baseline. The Linux baselines come from a
 * `visual-baselines.yml` run.
 *
 * @module __tests__/visual/kbd.visual
 */

import { test } from 'playwright/test';
import { KBD_STORIES, readyKbdStory } from '../kbd-stories';
import { expectStoryScreenshot } from './story';

for (const id of KBD_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => readyKbdStory(page, id) });
  });
}
