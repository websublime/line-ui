/**
 * Every story of `apps/storybook/stories/components/alert.stories.ts`, by Storybook id, with the number of glyphs it
 * draws once its Lucide files have loaded. The axe and visual tiers run over this list and wait for the glyphs, and
 * the axe file checks the ids against the Storybook index.
 *
 * @module __tests__/alert-stories
 */

import { expect, type Page } from 'playwright/test';

export const ALERT_STORIES = {
  'components-alert--default': 0,
  'components-alert--info': 0,
  'components-alert--success': 0,
  'components-alert--warning': 0,
  'components-alert--danger': 0,
  'components-alert--all-slots': 1,
  'components-alert--live-assertive': 0,
  'components-alert--live-polite': 0,
  'components-alert--dismiss-recipe': 1,
  'components-alert--custom-tokens': 0,
} as const satisfies Record<string, number>;

export type AlertStoryId = keyof typeof ALERT_STORIES;

/** Waits until the open story shows its alert and its glyphs, and every element has updated. */
export async function waitForAlertStory(page: Page, id: AlertStoryId): Promise<void> {
  await expect(page.locator('#storybook-root line-alert').first()).toBeVisible();
  // Playwright CSS locators pierce open shadow roots, so this counts the glyph roots inside the icons.
  await expect(page.locator('#storybook-root line-alert line-icon svg')).toHaveCount(ALERT_STORIES[id]);
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('line-alert, line-button, line-icon-button, line-icon, line-stack')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    ),
  );
}
