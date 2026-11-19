/**
 * Opens a Storybook docs page on `storybook-static` and waits until Storybook has rendered it (01-C32).
 *
 * Storybook 10.6 puts `sb-show-main` on `body` before it renders a docs page (`WebView.prepareForDocs`), so that
 * class does not mean the docs are there. The docs renderers emit `docsRendered` with the entry id on the preview
 * channel only after the page has rendered (`CsfDocsRender` and `MdxDocsRender`, `renderToElement`). That channel,
 * the `__STORYBOOK_ADDONS_CHANNEL__` global, records the arguments of the last event of each type whether or not a
 * listener is attached (`Channel.handleEvent`) and returns them from `last()`. The wait reads that record, so it
 * cannot miss an event emitted before it starts, and the test timeout bounds it, not the `expect` timeout.
 * Storybook's error display and no-preview screens end the wait at once, with what the screen says.
 *
 * @module apps/storybook/__tests__/docs-page
 */

import type { Page } from 'playwright/test';

/** The preview channel, as far as the wait reads it. */
interface PreviewChannel {
  last(eventName: string): unknown[] | undefined;
}

declare global {
  interface Window {
    __STORYBOOK_ADDONS_CHANNEL__?: PreviewChannel;
  }
}

/**
 * The Storybook screens that end the wait without the docs (`sb-show-<screen>` on `body`), each with the element
 * that names the problem: the first line of the error Storybook caught, or the no-preview heading.
 */
const FAILURE_HEADLINES = { errordisplay: '#error-message', nopreview: '.sb-nopreview_heading' } as const;

type FailureScreen = keyof typeof FAILURE_HEADLINES;

/** Opens the docs entry `id` in the preview iframe and waits until Storybook has rendered it. */
export async function openDocs(page: Page, id: string): Promise<void> {
  await page.goto(`/iframe.html?id=${id}&viewMode=docs`);
  const outcome = await page.waitForFunction((docsId): FailureScreen | 'rendered' | false => {
    const body = document.body.classList;
    if (body.contains('sb-show-errordisplay')) return 'errordisplay';
    if (body.contains('sb-show-nopreview')) return 'nopreview';
    return window.__STORYBOOK_ADDONS_CHANNEL__?.last('docsRendered')?.[0] === docsId ? 'rendered' : false;
  }, id);
  const shown = await outcome.jsonValue();
  if (shown === 'errordisplay' || shown === 'nopreview') {
    const headline = (await page.locator(FAILURE_HEADLINES[shown]).innerText()).trim();
    throw new Error(`Storybook showed its ${shown} screen instead of the docs page "${id}": ${headline}`);
  }
}
