/**
 * `<line-chip>` htmx tier (spec `0008-chip.md` Tests, htmx row, decision F1; PRD Appendix A).
 *
 * Runs the shared harness `@websublime/line-testing/htmx` on htmx 2 and htmx 4
 * in chromium, firefox and webkit, on the fixture page `chip/htmx.html` that
 * the third `webServer` of `playwright.config.ts` serves on port 4321.
 *
 * (a) is `n/a`: Chip is not form-associated, and its value prop `pressed`
 * never enters form data. (b), (c) and (d) run.
 *
 * @module __tests__/integration/chip/chip.htmx.e2e
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
import { expect, type Locator, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/chip/htmx.html';

const pressed = (host: Locator) => host.evaluate((element) => (element as HTMLElement & { pressed: boolean }).pressed);

const CHIP: HtmxFixture = {
  tag: 'line-chip',
  commitEvent: 'line-change',
  /** Odd commits press with the pointer, even commits with Space on the focused chip. */
  async commit(host, n) {
    const before = await pressed(host);
    if (n % 2 === 1) await host.click();
    else {
      await host.focus();
      await host.page().keyboard.press('Space');
    }
    await expect.poll(() => pressed(host)).toBe(!before);
  },
  async nonCommit(host) {
    await host.hover();
    await host.focus();
    await expect(host.getByRole('button')).toBeFocused();
    await host.evaluate((element) => {
      (element as HTMLElement & { pressed: boolean }).pressed = true;
    });
    await expect(host).toHaveAttribute('pressed', '');
  },
  formValue: {
    na: 'Chip is not form-associated (spec 0008-chip.md, Phase 1 spec §6.C.4 C8 row), and its value prop pressed never enters form data',
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
      await expect(host.getByRole('button')).toHaveAccessibleName(/^First slotted item\s*Second slotted item$/);
    },
  },
};

for (const major of HTMX_MAJORS) {
  test.describe(`htmx ${major}`, () => {
    test.beforeEach(async ({ page }) => {
      await routeHtmx(page, major);
      await page.goto(FIXTURE_URL);
      await expect.poll(() => page.evaluate(() => window.htmx?.version)).toMatch(new RegExp(`^${major}\\.`));
      await page.evaluate(() => customElements.whenDefined('line-chip'));
    });

    test('(a) its value reaches the request <form hx-post> sends', ({ page }) => expectFormValue(page, CHIP));
    test('(b) hx-trigger="line-change" sends one request per click and one per Space press', ({ page }) =>
      expectOneRequestPerCommit(page, CHIP));
    test('(c) focus, hover and a property set of pressed send no request', ({ page }) =>
      expectNoRequestWithoutCommit(page, CHIP));
    test('(d) content swapped into the default slot renders and names the inner button', ({ page }) =>
      expectSlotSwap(page, CHIP));
  });
}
