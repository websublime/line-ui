/**
 * Every story of `apps/storybook/stories/components/badge.stories.ts`, by Storybook id. The axe and visual tiers run
 * over this list, and the axe file checks the ids against the Storybook index.
 *
 * @module __tests__/badge-stories
 */

import { expect, type Page } from 'playwright/test';

export const BADGE_STORIES = [
  'components-badge--label',
  'components-badge--count',
  'components-badge--count-in-a-button',
  'components-badge--count-with-hidden-words',
  'components-badge--overflow',
  'components-badge--dot-decorative',
  'components-badge--dot-named',
  'components-badge--named-count',
  'components-badge--neutral',
  'components-badge--info',
  'components-badge--success',
  'components-badge--warning',
  'components-badge--danger',
  'components-badge--live-count-recipe',
  'components-badge--custom-tokens',
] as const;

export type BadgeStoryId = (typeof BADGE_STORIES)[number];

/** Waits until the open story shows its badges and every element has updated. */
export async function waitForBadgeStory(page: Page): Promise<void> {
  await expect(page.locator('#storybook-root line-badge').first()).toBeAttached();
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('line-badge, line-button, line-stack, line-visually-hidden')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    ),
  );
}
