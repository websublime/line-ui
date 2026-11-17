/**
 * Every story of `apps/storybook/stories/components/aspect-ratio.stories.ts`, by Storybook id, with the number of
 * icon glyphs it draws once its icons have loaded. The axe and visual tiers run over this list, and the axe file
 * checks the ids against the Storybook index. `readyAspectRatioStory` waits for every `line-aspect-ratio`,
 * `line-center`, `line-icon`, `line-stack` and `line-grid` of the open story to update, for every `<img>` to decode,
 * because media size the visual baselines, and for the story's icon glyphs, because a `line-icon` draws its `<svg>`
 * only once the registry has fetched the file (spec `0021-aspect-ratio.md` Tests, D15).
 *
 * @module __tests__/aspect-ratio-stories
 */

import { expect, type Page } from 'playwright/test';

export const ASPECT_RATIO_STORIES = {
  'components-aspect-ratio--default': 0,
  'components-aspect-ratio--ratios': 0,
  'components-aspect-ratio--media': 0,
  'components-aspect-ratio--custom-ratio': 0,
  'components-aspect-ratio--caption-overlay': 0,
  'components-aspect-ratio--icon-tile': 1,
  'components-aspect-ratio--in-a-grid': 0,
  'components-aspect-ratio--in-a-horizontal-stack': 0,
  'components-aspect-ratio--long-content': 0,
  'components-aspect-ratio--author-image-role': 0,
} as const satisfies Record<string, number>;

export type AspectRatioStoryId = keyof typeof ASPECT_RATIO_STORIES;

/** Waits until the open story's line elements have updated, its images have decoded and its glyphs show. */
export async function readyAspectRatioStory(page: Page, id: AspectRatioStoryId): Promise<void> {
  await expect(page.locator('#storybook-root line-aspect-ratio').first()).toBeAttached();
  await page.evaluate(async () => {
    const selector = 'line-aspect-ratio, line-center, line-icon, line-stack, line-grid';
    const tags = [...new Set([...document.querySelectorAll(selector)].map((el) => el.localName))];
    await Promise.all(tags.map((tag) => customElements.whenDefined(tag)));
    await Promise.all(
      [...document.querySelectorAll(selector)].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
    await Promise.all(
      [...document.querySelectorAll('#storybook-root img')].map((img) => (img as HTMLImageElement).decode()),
    );
  });
  // Playwright CSS locators pierce open shadow roots, so this counts the glyph roots inside the icons.
  await expect(page.locator('#storybook-root line-icon svg')).toHaveCount(ASPECT_RATIO_STORIES[id]);
}
