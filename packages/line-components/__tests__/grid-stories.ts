/**
 * Every story of `apps/storybook/stories/components/grid.stories.ts`, by Storybook id. The axe and visual tiers
 * run over this list, and the axe file checks the ids against the Storybook index. `readyGridStory` waits for every
 * `line-grid` of the open story to update (spec `0019-grid.md` Tests).
 *
 * @module __tests__/grid-stories
 */

import { expect, type Page } from 'playwright/test';

export const GRID_STORIES = [
  'components-grid--default',
  'components-grid--column-caps',
  'components-grid--fixed-columns',
  'components-grid--minimum-widths',
  'components-grid--gap-scale',
  'components-grid--alignment',
  'components-grid--author-list',
  'components-grid--container-query',
  'components-grid--full-row-child',
] as const;

export type GridStoryId = (typeof GRID_STORIES)[number];

/** Waits until every `line-grid` of the open story is defined and has updated. */
export async function readyGridStory(page: Page, _id: GridStoryId): Promise<void> {
  await expect(page.locator('#storybook-root line-grid').first()).toBeAttached();
  await page.evaluate(async () => {
    await customElements.whenDefined('line-grid');
    await Promise.all(
      [...document.querySelectorAll('line-grid')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  });
}
