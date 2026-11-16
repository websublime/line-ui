/**
 * Every story of `apps/storybook/stories/components/presence.stories.ts`, by Storybook id. The axe and visual tiers
 * run over this list, and the axe file checks the ids against the Storybook index. `readyPresenceStory` waits for
 * every `line-presence` of the open story to update and for every animation on its `root` part to settle, because
 * mid-animation opacity raises `color-contrast` (spec `0017-presence.md` Tests, P3; D15).
 *
 * @module __tests__/presence-stories
 */

import { expect, type Page } from 'playwright/test';

export const PRESENCE_STORIES = [
  'components-presence--default',
  'components-presence--slide',
  'components-presence--skip-animation-on-mount',
  'components-presence--exit-complete',
  'components-presence--disclosure',
] as const;

export type PresenceStoryId = (typeof PRESENCE_STORIES)[number];

/** Waits until every `line-presence` of the open story has updated, shows its root and runs no animation. */
export async function readyPresenceStory(page: Page, _id: PresenceStoryId): Promise<void> {
  await expect(page.locator('#storybook-root line-presence').first()).toBeAttached();
  await page.evaluate(async () => {
    await customElements.whenDefined('line-presence');
    const hosts = [...document.querySelectorAll('line-presence')] as (HTMLElement & {
      updateComplete: Promise<unknown>;
    })[];
    await Promise.all(hosts.map((el) => el.updateComplete));
    const roots = hosts.map((el) => el.shadowRoot?.querySelector('[part="root"]') as HTMLElement);
    await Promise.all(
      roots.flatMap((root) => root.getAnimations().map((animation) => animation.finished.catch(() => undefined))),
    );
  });
  for (const root of await page.locator('#storybook-root line-presence').all()) {
    await expect(root.locator('[part="root"]')).toBeVisible();
  }
}
