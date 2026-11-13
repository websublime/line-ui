/**
 * Every story of `apps/storybook/stories/components/kbd.stories.ts`, by Storybook id. The axe and visual tiers run
 * over this list, and the axe file checks the ids against the Storybook index. `readyKbdStory` waits for every
 * `line-kbd` of the open story to update (spec `0015-kbd.md` Tests).
 *
 * @module __tests__/kbd-stories
 */

import { expect, type Page } from 'playwright/test';

export const KBD_STORIES = [
  'components-kbd--command-palette-apple',
  'components-kbd--command-palette-other',
  'components-kbd--three-keys-apple',
  'components-kbd--three-keys-other',
  'components-kbd--sequence',
  'components-kbd--named-keys',
  'components-kbd--in-a-menu-item',
  'components-kbd--fallback-text',
  'components-kbd--custom-tokens',
  'components-kbd--localised-words',
] as const;

export type KbdStoryId = (typeof KBD_STORIES)[number];

/** Waits until every `line-kbd` of the open story is defined and has updated. */
export async function readyKbdStory(page: Page, _id: KbdStoryId): Promise<void> {
  await expect(page.locator('#storybook-root line-kbd').first()).toBeAttached();
  await page.evaluate(async () => {
    await customElements.whenDefined('line-kbd');
    await Promise.all(
      [...document.querySelectorAll('line-kbd')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  });
}
