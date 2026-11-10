/**
 * `<line-alert>` visual tier (spec `0006-alert.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11, §10 SD98).
 *
 * Screenshots every Alert story on `storybook-static` in the Chromium-only `visual` project, after its glyphs have
 * loaded from the self-hosted `public/icons/` files. The Linux baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/alert.visual
 */

import { test } from 'playwright/test';
import { ALERT_STORIES, type AlertStoryId, waitForAlertStory } from '../alert-stories';
import { expectStoryScreenshot } from './story';

for (const id of Object.keys(ALERT_STORIES) as AlertStoryId[]) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => waitForAlertStory(page, id) });
  });
}
