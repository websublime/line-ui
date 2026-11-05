/**
 * Every story of `apps/storybook/stories/components/icon-button.stories.ts`, by Storybook id, with the number of
 * glyphs it draws once its Lucide files have loaded. The axe and visual tiers run over this list and wait for the
 * glyphs, and the axe file checks the ids against the Storybook index.
 *
 * @module __tests__/icon-button-stories
 */

import { expect, type Page } from 'playwright/test';

export const ICON_BUTTON_STORIES = {
  'components-icon-button--default': 1,
  'components-icon-button--primary': 1,
  'components-icon-button--borderless': 1,
  'components-icon-button--disabled': 1,
  'components-icon-button--loading': 2,
  'components-icon-button--toggle-off': 1,
  'components-icon-button--toggle-on': 1,
} as const satisfies Record<string, number>;

export type IconButtonStoryId = keyof typeof ICON_BUTTON_STORIES;

/** Waits until the open story shows its glyphs and every icon button and icon has finished its update. */
export async function waitForIconButtonStory(page: Page, id: IconButtonStoryId): Promise<void> {
  // Playwright CSS locators pierce open shadow roots, so this counts the glyph roots inside the icons.
  await expect(page.locator('#storybook-root line-icon-button line-icon svg')).toHaveCount(ICON_BUTTON_STORIES[id]);
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('line-icon-button, line-icon')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    ),
  );
}
