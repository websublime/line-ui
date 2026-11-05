/**
 * The Styled states stories of Button and IconButton (spec `0002-button.md` AM-008, `0003-icon-button.md` AM-002),
 * on `storybook-static` (port 4320), in chromium, firefox and webkit.
 *
 * A regression test for the story stylesheets the docs copy: a pressed toggle must keep its accent tone under the
 * pointer and while pressed, climbing the accent scale (rest < hover < active), and must not take the gray hover
 * of an unpressed button. An unpressed default button must still change its background on hover. The test reads
 * the computed `::part(root)` background and places it on the accent scale the story's own theme resolves.
 *
 * @module __tests__/integration/state-styling/styled-states-story.e2e
 */

import { expect, type Locator, type Page, test } from 'playwright/test';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

const STORIES = [
  ['components-button--styled-states', 'line-button'],
  ['components-icon-button--styled-states', 'line-icon-button'],
] as const;

/** The computed background of the inner `[part="root"]` of `host`. */
function background(host: Locator): Promise<string> {
  return host.evaluate(
    (el) => getComputedStyle(el.shadowRoot?.querySelector('[part="root"]') as Element).backgroundColor,
  );
}

/** The twelve accent steps as computed colours, resolved inside the story's `.styled-states` container. */
function accentScale(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const container = document.querySelector('#storybook-root .styled-states') as HTMLElement;
    const probe = document.createElement('div');
    container.append(probe);
    const steps = Array.from({ length: 12 }, (_, index) => {
      probe.style.background = `var(--line-accent-${index + 1})`;
      return getComputedStyle(probe).backgroundColor;
    });
    probe.remove();
    return steps;
  });
}

/** Moves the pointer to an empty part of the page. */
function moveAway(page: Page): Promise<void> {
  return page.mouse.move(700, 500);
}

for (const [id, tag] of STORIES) {
  test(`${id}: hover and press keep a pressed toggle on a climbing accent tone`, async ({ page }) => {
    await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
    await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
    await page.evaluate(
      (t) =>
        Promise.all(
          [...document.querySelectorAll(t)].map(
            (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
          ),
        ),
      tag,
    );
    const plain = page
      .locator(`#storybook-root ${tag}:not([variant]):not([pressed]):not([loading]):not([disabled])`)
      .first();
    const pressed = page.locator(`#storybook-root ${tag}[pressed="true"]`);
    await expect(pressed).toHaveAttribute('data-pressed', '');
    const accent = await accentScale(page);
    expect(new Set(accent).size).toBe(12);

    await moveAway(page);
    const plainRest = await background(plain);
    await plain.hover();
    const plainHover = await background(plain);
    expect(plainHover).not.toBe(plainRest);

    await moveAway(page);
    const pressedRest = await background(pressed);
    await pressed.hover();
    const pressedHover = await background(pressed);
    await page.mouse.down();
    await expect(pressed).toHaveAttribute('data-active', '');
    const pressedActive = await background(pressed);
    await page.mouse.up();

    expect(pressedHover).not.toBe(plainHover);
    expect(pressedHover).not.toBe(pressedRest);
    const [rest, hover, active] = [pressedRest, pressedHover, pressedActive].map((tone) => accent.indexOf(tone));
    expect({ rest, hover, active }).toEqual({ rest: 4, hover: 5, active: 6 });
  });
}
