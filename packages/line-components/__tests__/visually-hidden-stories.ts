/**
 * Every story of `apps/storybook/stories/components/visually-hidden.stories.ts`, by Storybook id. The axe and visual
 * tiers run over this list, and the axe file checks the ids against the Storybook index. `readyVisuallyHiddenStory`
 * waits for the story and moves focus to the skip link of the Skip link focused story (spec `0012-visually-hidden.md`
 * Tests).
 *
 * @module __tests__/visually-hidden-stories
 */

import { expect, type Page } from 'playwright/test';

export const VISUALLY_HIDDEN_STORIES = [
  'components-visually-hidden--in-a-link',
  'components-visually-hidden--in-a-button',
  'components-visually-hidden--section-heading',
  'components-visually-hidden--skip-link',
  'components-visually-hidden--skip-link-focused',
] as const;

export type VisuallyHiddenStoryId = (typeof VISUALLY_HIDDEN_STORIES)[number];

/**
 * Waits until every `line-visually-hidden` of the open story has updated. For Skip link focused it then presses Tab,
 * Option+Tab in WebKit on macOS, and asserts that the skip link has focus and that its host shows larger than 1 × 1.
 */
export async function readyVisuallyHiddenStory(page: Page, id: VisuallyHiddenStoryId): Promise<void> {
  await expect(page.locator('#storybook-root line-visually-hidden').first()).toBeAttached();
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('line-visually-hidden')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    ),
  );
  if (id !== 'components-visually-hidden--skip-link-focused') return;
  const webkitOnMac = page.context().browser()?.browserType().name() === 'webkit' && process.platform === 'darwin';
  await page.keyboard.press(webkitOnMac ? 'Alt+Tab' : 'Tab');
  const host = page.locator('#storybook-root line-visually-hidden.skip');
  await expect(host.locator('a')).toBeFocused();
  const box = await host.boundingBox();
  expect(box?.width).toBeGreaterThan(1);
  expect(box?.height).toBeGreaterThan(1);
}
