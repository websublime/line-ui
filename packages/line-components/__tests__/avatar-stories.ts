/**
 * Every story of `apps/storybook/stories/components/avatar.stories.ts`, by Storybook id. The axe and visual tiers run
 * over this list, and the axe file checks the ids against the Storybook index.
 *
 * @module __tests__/avatar-stories
 */

import { expect, type Page } from 'playwright/test';

export const AVATAR_STORIES = [
  'components-avatar--photo',
  'components-avatar--initials',
  'components-avatar--error-fallback',
  'components-avatar--decorative-beside-a-name',
  'components-avatar--fallback-slot',
  'components-avatar--custom-media',
  'components-avatar--status',
  'components-avatar--in-a-link',
  'components-avatar--spoken-name-override',
  'components-avatar--custom-tokens',
  'components-avatar--ring-and-size-from-a-container',
] as const;

export type AvatarStoryId = (typeof AVATAR_STORIES)[number];

/** Waits until the open story shows its avatars, every element has updated and no picture is still loading. */
export async function waitForAvatarStory(page: Page): Promise<void> {
  await expect(page.locator('#storybook-root line-avatar').first()).toBeAttached();
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('line-avatar, line-badge')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    ),
  );
  await page.waitForFunction(() =>
    [...document.querySelectorAll('#storybook-root line-avatar')].every(
      (avatar) =>
        !avatar.hasAttribute('data-loading') && [...avatar.querySelectorAll('img')].every((image) => image.complete),
    ),
  );
}
