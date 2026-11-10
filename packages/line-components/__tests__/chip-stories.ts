/**
 * Every story of `apps/storybook/stories/components/chip.stories.ts`, by Storybook id, with the number of glyphs it
 * draws once its Lucide files have loaded. The axe and visual tiers run over this list and wait for the glyphs, and
 * the axe file checks the ids against the Storybook index.
 *
 * @module __tests__/chip-stories
 */

import { expect, type Page } from 'playwright/test';

export const CHIP_STORIES = {
  'components-chip--default': 0,
  'components-chip--pressed': 0,
  'components-chip--primary': 0,
  'components-chip--primary-pressed': 0,
  'components-chip--prefix-and-indicator': 2,
  'components-chip--suffix-count': 0,
  'components-chip--disabled': 0,
  'components-chip--named-by-aria-label': 0,
  'components-chip--filter-bar': 0,
  'components-chip--styled-states': 0,
  'components-chip--custom-tokens': 0,
} as const satisfies Record<string, number>;

export type ChipStoryId = keyof typeof CHIP_STORIES;

/** Waits until the open story shows its chips and glyphs, and every element has updated. */
export async function waitForChipStory(page: Page, id: ChipStoryId): Promise<void> {
  await expect(page.locator('#storybook-root line-chip').first()).toBeVisible();
  // Playwright CSS locators pierce open shadow roots, so this counts the glyph roots inside the icons.
  await expect(page.locator('#storybook-root line-chip line-icon svg')).toHaveCount(CHIP_STORIES[id]);
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('line-chip, line-icon, line-stack')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    ),
  );
}
