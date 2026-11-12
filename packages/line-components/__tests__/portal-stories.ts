/**
 * Every story of `apps/storybook/stories/components/portal.stories.ts`, by Storybook id. The axe and visual tiers run
 * over this list, and the axe file checks the ids against the Storybook index. `readyPortalStory` waits for each box
 * to open and, for In a modal dialog, opens the dialog and raises the hint (spec `0013-portal.md` Tests).
 *
 * @module __tests__/portal-stories
 */

import { expect, type Page } from 'playwright/test';

export const PORTAL_STORIES = [
  'components-portal--escapes-a-clipping-card',
  'components-portal--keeps-its-form',
  'components-portal--in-a-modal-dialog',
  'components-portal--disabled',
] as const;

export type PortalStoryId = (typeof PORTAL_STORIES)[number];

/**
 * Waits until every `line-portal` of the open story has updated and, outside Disabled, until its root matches
 * `:popover-open`. For In a modal dialog it then clicks "Open settings", which calls `showModal()` and then
 * `bringToFront()`, and asserts that the dialog is open and that the hint content is hit at its centre.
 */
export async function readyPortalStory(page: Page, id: PortalStoryId): Promise<void> {
  await expect(page.locator('#storybook-root line-portal').first()).toBeAttached();
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll('line-portal')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    ),
  );
  if (id !== 'components-portal--disabled') {
    await page.waitForFunction(() =>
      [...document.querySelectorAll('line-portal')].every((el) =>
        el.shadowRoot?.querySelector('[part="root"]')?.matches(':popover-open'),
      ),
    );
  }
  if (id !== 'components-portal--in-a-modal-dialog') return;
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.locator('#storybook-root dialog.settings')).toHaveJSProperty('open', true);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const host = document.querySelector('line-portal.dialog-hint') as HTMLElement;
        const range = document.createRange();
        range.selectNodeContents(host);
        const { x, y, width, height } = range.getBoundingClientRect();
        const hit = document.elementFromPoint(x + width / 2, y + height / 2);
        return hit === host || host.contains(hit);
      }),
    )
    .toBe(true);
}
