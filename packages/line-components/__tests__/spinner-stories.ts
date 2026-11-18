/**
 * Every story of `apps/storybook/stories/components/spinner.stories.ts`, by Storybook id, with the number of icon
 * glyphs it draws once its icons have loaded. The axe and visual tiers run over this list, and the axe file checks the
 * ids against the Storybook index. `readySpinnerStory` waits for every `line-spinner`, `line-button`,
 * `line-icon-button`, `line-icon` and `line-center` of the open story to be defined and updated, and for the
 * IconButton story's glyph, because a `line-icon` draws its `<svg>` only once the registry has fetched the file, as
 * `waitForIconStory` does (spec `0022-spinner.md` Tests, D20).
 *
 * @module __tests__/spinner-stories
 */

import { expect, type Page } from 'playwright/test';

export const SPINNER_STORIES = {
  'components-spinner--default': 0,
  'components-spinner--labelled': 0,
  'components-spinner--sizes': 0,
  'components-spinner--speeds': 0,
  'components-spinner--in-a-button': 0,
  'components-spinner--in-an-icon-button': 1,
  'components-spinner--busy-region': 0,
  'components-spinner--custom-tokens': 0,
} as const satisfies Record<string, number>;

export type SpinnerStoryId = keyof typeof SPINNER_STORIES;

/** Waits until the open story's line elements are defined and updated and its glyphs show. */
export async function readySpinnerStory(page: Page, id: SpinnerStoryId): Promise<void> {
  await expect(page.locator('#storybook-root line-spinner').first()).toBeAttached();
  await page.evaluate(async () => {
    const selector = 'line-spinner, line-button, line-icon-button, line-icon, line-center';
    const tags = [...new Set([...document.querySelectorAll(selector)].map((el) => el.localName))];
    await Promise.all(tags.map((tag) => customElements.whenDefined(tag)));
    await Promise.all(
      [...document.querySelectorAll(selector)].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  });
  // Playwright CSS locators pierce open shadow roots, so this counts the glyph roots inside the icons.
  await expect(page.locator('#storybook-root line-icon svg')).toHaveCount(SPINNER_STORIES[id]);
}
