/**
 * `<line-icon-button>` htmx tier (spec `0003-icon-button.md` Tests, htmx row, decision D5; PRD Appendix A).
 *
 * Runs the shared harness `@websublime/line-testing/htmx` on htmx 2 and htmx 4
 * in chromium, firefox and webkit, on the fixture page `icon-button/htmx.html`
 * that the third `webServer` of `playwright.config.ts` serves on port 4321.
 *
 * (a) is `n/a`: IconButton is not form-associated, and its value prop
 * `pressed` never enters form data. (b), (c) and (d) run.
 *
 * @module __tests__/integration/icon-button/icon-button.htmx.e2e
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

const FIXTURE_URL = 'http://127.0.0.1:4321/icon-button/htmx.html';

const ICON_BUTTON: HtmxFixture = {
  tag: 'line-icon-button',
  attributes: { pressed: 'false', 'aria-label': 'Mute' },
  content: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="M2 2h12v12H2z" /></svg>',
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
    na: 'IconButton is not form-associated (Phase 1 spec §10 SD36), and its value prop pressed never enters form data',
  },
  slot: {
    name: null,
    async pickedUp(host, assigned) {
      expect(
        await host.evaluate(
          (element) =>
            element.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])')?.assignedElements().length,
        ),
      ).toBe(assigned);
      await expect(host.getByRole('button')).toHaveAccessibleName('Mute');
    },
  },
};

for (const major of HTMX_MAJORS) {
  test.describe(`htmx ${major}`, () => {
    test.beforeEach(async ({ page }) => {
      await routeHtmx(page, major);
      await page.goto(FIXTURE_URL);
      await expect.poll(() => page.evaluate(() => window.htmx?.version)).toMatch(new RegExp(`^${major}\\.`));
      await page.evaluate(() => customElements.whenDefined('line-icon-button'));
    });

    test('(a) its value reaches the request <form hx-post> sends', ({ page }) => expectFormValue(page, ICON_BUTTON));
    test('(b) hx-trigger="line-change" sends one request per toggle click', ({ page }) =>
      expectOneRequestPerCommit(page, ICON_BUTTON));
    test('(c) focus and hover send no request', ({ page }) => expectNoRequestWithoutCommit(page, ICON_BUTTON));
    test('(d) content swapped into the default slot renders and the host aria-label still names the button', ({
      page,
    }) => expectSlotSwap(page, ICON_BUTTON));
  });
}
