/**
 * Every story of `apps/storybook/stories/components/center.stories.ts`, by Storybook id. The axe and visual tiers
 * run over this list, and the axe file checks the ids against the Storybook index. `readyCenterStory` waits for
 * every `line-center` and `line-stack` of the open story to update, because two stories hold a `line-stack` (spec
 * `0020-center.md` Tests, D14).
 *
 * @module __tests__/center-stories
 */

import { expect, type Page } from 'playwright/test';

export const CENTER_STORIES = [
  'components-center--default',
  'components-center--axes',
  'components-center--several-children',
  'components-center--text',
  'components-center--in-a-horizontal-stack',
  'components-center--overflow',
  'components-center--author-group',
] as const;

export type CenterStoryId = (typeof CENTER_STORIES)[number];

/** Waits until every `line-center` and `line-stack` of the open story is defined and has updated. */
export async function readyCenterStory(page: Page, _id: CenterStoryId): Promise<void> {
  await expect(page.locator('#storybook-root line-center').first()).toBeAttached();
  await page.evaluate(async () => {
    const tags = ['line-center', 'line-stack'].filter((tag) => document.querySelector(tag));
    await Promise.all(tags.map((tag) => customElements.whenDefined(tag)));
    await Promise.all(
      [...document.querySelectorAll('line-center, line-stack')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  });
}
