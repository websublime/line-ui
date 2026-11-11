/**
 * Every story of `apps/storybook/stories/components/avatar-group.stories.ts`, by Storybook id. The axe and visual tiers
 * run over this list, and the axe file checks the ids against the Storybook index. `readyAvatarGroupStory` waits for
 * the story and brings the Expanded and Open stories into their state, as decision D26 of `0010-avatar-group.md` says.
 *
 * @module __tests__/avatar-group-stories
 */

import { expect, type Page } from 'playwright/test';

export const AVATAR_GROUP_STORIES = [
  'components-avatar-group--default',
  'components-avatar-group--no-overflow',
  'components-avatar-group--overflow-label',
  'components-avatar-group--sizes',
  'components-avatar-group--spacing',
  'components-avatar-group--links',
  'components-avatar-group--with-status',
  'components-avatar-group--expanded',
  'components-avatar-group--open',
  'components-avatar-group--custom-tokens',
] as const;

export type AvatarGroupStoryId = (typeof AVATAR_GROUP_STORIES)[number];

/** Waits until the open story shows its groups, every element has updated and no picture is still loading. */
async function waitForAvatarGroupStory(page: Page): Promise<void> {
  await expect(page.locator('#storybook-root line-avatar-group').first()).toBeAttached();
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('line-avatar-group, line-avatar, line-badge')].map(
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

/**
 * Waits for the story, then hovers the group for Expanded, or clicks "+N" and moves the pointer onto the panel for
 * Open, and waits for the flag and the end of the spread transition (D26).
 */
export async function readyAvatarGroupStory(page: Page, id: AvatarGroupStoryId): Promise<void> {
  await waitForAvatarGroupStory(page);
  const group = page.locator('#storybook-root line-avatar-group').first();
  if (id === 'components-avatar-group--expanded') {
    await group.locator('line-avatar').first().hover();
    await expect(group).toHaveAttribute('data-expanded', '');
  } else if (id === 'components-avatar-group--open') {
    await group.locator('[part="overflow"]').click();
    await expect(group).toHaveAttribute('data-open', '');
    await group.locator('[part="content"]').hover();
  } else {
    return;
  }
  // Reading a computed style starts the transitions the flag set; the spread is final once they finish.
  await group.evaluate(async (host) => {
    const shadow = host.shadowRoot as ShadowRoot;
    for (const level of shadow.querySelectorAll('.level')) getComputedStyle(level).translate;
    await Promise.all(shadow.getAnimations().map((animation) => animation.finished));
  });
}
