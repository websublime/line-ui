/**
 * Every story of `apps/storybook/stories/components/icon.stories.ts`, by Storybook id, with the number of
 * glyphs it draws once its icons have loaded. The axe and visual tiers run over this list and wait for the
 * glyphs, and the axe file checks the ids against the Storybook index.
 *
 * @module __tests__/icon-stories
 */

import { expect, type Page } from 'playwright/test';

export const ICON_STORIES = {
  'components-icon--default': 1,
  'components-icon--labelled': 1,
  'components-icon--weight': 2,
  'components-icon--mirror-rtl': 2,
  'components-icon--path': 1,
  'components-icon--src': 1,
  'components-icon--size-and-colour': 5,
  'components-icon--missing': 0,
  'components-icon--foreign-role': 1,
} as const satisfies Record<string, number>;

export type IconStoryId = keyof typeof ICON_STORIES;

/** Waits until the open story shows its glyphs and every icon has finished its update. */
export async function waitForIconStory(page: Page, id: IconStoryId): Promise<void> {
  // Playwright CSS locators pierce open shadow roots, so this counts the glyph roots inside the icons.
  await expect(page.locator('#storybook-root line-icon svg')).toHaveCount(ICON_STORIES[id]);
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('line-icon')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    ),
  );
}
