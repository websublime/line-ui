/**
 * `<line-portal>` visual tier (spec `0013-portal.md` Tests, Visual row; Phase 1 spec §6.C.6, §6.P.11, §10 SD98).
 *
 * Screenshots every Portal story on `storybook-static` in the Chromium-only `visual` project, with each box open and,
 * for In a modal dialog, the dialog open and the hint raised through the `ready` hook. The full-page screenshot shows
 * the top layer. The Linux baselines come from a `visual-baselines.yml` run.
 *
 * @module __tests__/visual/portal.visual
 */

import { test } from 'playwright/test';
import { PORTAL_STORIES, readyPortalStory } from '../portal-stories';
import { expectStoryScreenshot } from './story';

for (const id of PORTAL_STORIES) {
  test(id, async ({ page }) => {
    await expectStoryScreenshot(page, id, { ready: () => readyPortalStory(page, id) });
  });
}
