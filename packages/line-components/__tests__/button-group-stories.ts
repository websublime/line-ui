/**
 * Every story of `apps/storybook/stories/components/button-group.stories.ts`, by Storybook id, with the number of
 * glyphs it draws once its Lucide files have loaded. The axe and visual tiers run over this list and wait for the
 * glyphs, and the axe file checks the ids against the Storybook index.
 *
 * @module __tests__/button-group-stories
 */

import { expect, type Page } from 'playwright/test';

export const BUTTON_GROUP_STORIES = {
  'components-button-group--default': 0,
  'components-button-group--icon-buttons': 2,
  'components-button-group--vertical': 0,
  'components-button-group--disabled-and-loading': 1,
  'components-button-group--right-to-left': 0,
} as const satisfies Record<string, number>;

export type ButtonGroupStoryId = keyof typeof BUTTON_GROUP_STORIES;

/** Waits until the open story shows its glyphs, the group has written its positions, and every element has updated. */
export async function waitForButtonGroupStory(page: Page, id: ButtonGroupStoryId): Promise<void> {
  // Playwright CSS locators pierce open shadow roots, so this counts the glyph roots inside the icons.
  await expect(page.locator('#storybook-root line-button-group line-icon svg')).toHaveCount(BUTTON_GROUP_STORIES[id]);
  await expect(page.locator('#storybook-root [data-line-button-group-position="first"]')).toHaveCount(1);
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('line-button-group, line-button, line-icon-button, line-icon')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    ),
  );
}
