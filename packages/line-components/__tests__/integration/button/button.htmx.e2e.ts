/**
 * `<line-button>` htmx tier (spec `0002-button.md` Tests, htmx row; PRD Appendix A).
 *
 * Runs the shared harness `@websublime/line-testing/htmx` on htmx 2 and htmx 4
 * in chromium, firefox and webkit, on the fixture page `button/htmx.html` that
 * the third `webServer` of `playwright.config.ts` serves on port 4321.
 *
 * (a) is `n/a`: Button's value prop is `pressed`, which never enters form
 * data, and the harness submits through a separate native button. The
 * Button-local test below replaces it and proves that a `line-button` submitter
 * inside `<form hx-post>` sends its `name=value`.
 *
 * @module __tests__/integration/button/button.htmx.e2e
 */

import {
  expectFormValue,
  expectNoRequestWithoutCommit,
  expectOneRequestPerCommit,
  expectSlotSwap,
  HTMX_MAJORS,
  type HtmxFixture,
  routeHtmx,
} from '@websublime/line-testing/htmx';
import { expect, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/button/htmx.html';

const BUTTON: HtmxFixture = {
  tag: 'line-button',
  attributes: { type: 'button', pressed: 'false' },
  content: 'Bold',
  commitEvent: 'line-change',
  async commit(host, n) {
    await host.click();
    await expect(host).toHaveAttribute('pressed', String(n % 2 === 1));
  },
  async nonCommit(host) {
    await host.hover();
    await host.focus();
    await expect(host.getByRole('button')).toBeFocused();
  },
  formValue: {
    na: "Button's value prop is pressed, which never enters form data, and the host's own form value stays null; its name=value enters the form data only when it submits, and the harness submits through a separate native button",
  },
  slot: {
    name: null,
    async pickedUp(host) {
      await expect(host.getByRole('button')).toHaveAccessibleName(/First slotted item.*Second slotted item/);
    },
  },
};

for (const major of HTMX_MAJORS) {
  test.describe(`htmx ${major}`, () => {
    test.beforeEach(async ({ page }) => {
      await routeHtmx(page, major);
      await page.goto(FIXTURE_URL);
      await expect.poll(() => page.evaluate(() => window.htmx?.version)).toMatch(new RegExp(`^${major}\\.`));
      await page.evaluate(() => customElements.whenDefined('line-button'));
    });

    test('(a) its value reaches the request <form hx-post> sends', ({ page }) => expectFormValue(page, BUTTON));
    test('(b) hx-trigger="line-change" sends one request per toggle click', ({ page }) =>
      expectOneRequestPerCommit(page, BUTTON));
    test('(c) focus and hover send no request', ({ page }) => expectNoRequestWithoutCommit(page, BUTTON));
    test('(d) content swapped into the default slot renders and names the inner button', ({ page }) =>
      expectSlotSwap(page, BUTTON));

    test('a line-button submitter inside <form hx-post> sends its name=value', async ({ page }) => {
      const bodies: URLSearchParams[] = [];
      await page.route('**/line-htmx-button/**', async (route) => {
        bodies.push(new URLSearchParams(route.request().postData() ?? ''));
        await route.fulfill({ contentType: 'text/html', body: `<li>${bodies.length}</li>` });
      });
      await page.evaluate(async () => {
        const main = document.querySelector('main') as HTMLElement;
        main.innerHTML = `<form hx-post="/line-htmx-button/submit" hx-target="#log" hx-swap="beforeend">
            <input name="q" value="term" />
            <line-button type="submit" name="intent" value="save">Save</line-button>
            <line-button type="submit" name="intent" value="publish">Publish</line-button>
          </form>
          <ul id="log"></ul>`;
        window.htmx?.process(main);
        await (main.querySelector('line-button') as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
      });

      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.locator('#log > li')).toHaveText(['1']);
      expect(bodies.map((body) => [...body.entries()])).toEqual([
        [
          ['q', 'term'],
          ['intent', 'save'],
        ],
      ]);
      expect(page.url()).toBe(FIXTURE_URL);
    });
  });
}
