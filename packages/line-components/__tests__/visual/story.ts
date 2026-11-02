/**
 * Visual regression tier — shared story helper (P11, spec §6.P.11).
 *
 * Opens a Storybook story on the built `apps/storybook/storybook-static`,
 * served by the second `webServer` entry of `playwright.config.ts`, and
 * compares a full-page Chromium screenshot against its baseline. The
 * `*.visual.ts` files of the `visual` project call it once per screenshot.
 * Baselines are the `-visual-linux.png` files that `visual-baselines.yml`
 * writes and that the PR author commits beside each `*.visual.ts` file.
 *
 * @module __tests__/visual/story
 */

import { expect, type Page } from 'playwright/test';

/** The `storybook-static` origin; the `visual` project sets no `baseURL` of its own. */
const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

/** Optional Storybook URL state and baseline name for one screenshot. */
export interface StoryScreenshotOptions {
  /** Raw Storybook `globals` URL value, e.g. `accent:indigo;gray:sand`. */
  globals?: string;
  /** Raw Storybook `args` URL value, e.g. `mode:dark`. */
  args?: string;
  /** Screenshot name; defaults to `${storyId}.png`. */
  name?: string;
  /** Waits for content the story loads after Storybook shows it, such as fetched icons. */
  ready?: () => Promise<void>;
}

/** Opens a story in the preview iframe, waits for Storybook to show it and asserts its screenshot. */
export async function expectStoryScreenshot(
  page: Page,
  storyId: string,
  options: StoryScreenshotOptions = {},
): Promise<void> {
  const { globals, args, name = `${storyId}.png`, ready } = options;
  const query = `id=${storyId}&viewMode=story${globals ? `&globals=${globals}` : ''}${args ? `&args=${args}` : ''}`;
  await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?${query}`);
  await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
  await ready?.();
  await expect(page).toHaveScreenshot(name, { fullPage: true });
}
