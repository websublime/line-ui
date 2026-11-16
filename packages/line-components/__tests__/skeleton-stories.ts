/**
 * Every story of `apps/storybook/stories/components/skeleton.stories.ts`, by Storybook id. The axe and visual tiers
 * run over this list, and the axe file checks the ids against the Storybook index. `readySkeletonStory` waits for
 * every `line-skeleton` of the open story to update (spec `0016-skeleton.md` Tests).
 *
 * @module __tests__/skeleton-stories
 */

import { expect, type Page } from 'playwright/test';

export const SKELETON_STORIES = [
  'components-skeleton--default',
  'components-skeleton--shapes',
  'components-skeleton--text-lines',
  'components-skeleton--wave',
  'components-skeleton--no-animation',
  'components-skeleton--profile-card',
  'components-skeleton--custom-tokens',
] as const;

export type SkeletonStoryId = (typeof SKELETON_STORIES)[number];

/** Waits until every `line-skeleton` of the open story is defined and has updated. */
export async function readySkeletonStory(page: Page, _id: SkeletonStoryId): Promise<void> {
  await expect(page.locator('#storybook-root line-skeleton').first()).toBeAttached();
  await page.evaluate(async () => {
    await customElements.whenDefined('line-skeleton');
    await Promise.all(
      [...document.querySelectorAll('line-skeleton')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  });
}
