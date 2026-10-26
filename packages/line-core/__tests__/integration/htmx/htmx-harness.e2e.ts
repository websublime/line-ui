/**
 * htmx harness self-test — browser tier (spec §6.F.4, AM-063).
 *
 * Loads `/htmx/` from the Vite fixture server with htmx 2 and with htmx 4, and
 * runs every harness behaviour against both probes in each engine:
 * `<line-htmx-value-probe>` proves (a), (b), (c) and (d), and
 * `<line-htmx-compound-probe>` proves (b), (c) and (d) with (a) n/a. A seeded
 * value probe, mounted with fixture `attributes` and one light-DOM child from
 * fixture `content`, proves the four behaviours again. The self-test also
 * proves that `page.route` answers htmx 2's XMLHttpRequest and htmx 4's fetch.
 *
 * @module __tests__/integration/htmx/htmx-harness.e2e
 */

import {
  expectFormValue,
  expectNoRequestWithoutCommit,
  expectOneRequestPerCommit,
  expectRouteAnswers,
  expectSlotSwap,
  HTMX_MAJORS,
  type HtmxFixture,
  routeHtmx,
  type SlotSpec,
} from '@websublime/line-testing/htmx';
import { expect, test } from 'playwright/test';

const DEFAULT_SLOT: SlotSpec = {
  name: null,
  pickedUp: (host, assigned) => expect(host).toHaveAttribute('data-slotted', String(assigned)),
};

const VALUE_PROBE: HtmxFixture = {
  tag: 'line-htmx-value-probe',
  commitEvent: 'line-change',
  async commit(host, n) {
    const input = host.getByRole('textbox');
    await input.fill(`value-${n}`);
    await input.press('Enter');
  },
  async nonCommit(host) {
    const input = host.getByRole('textbox');
    await input.pressSequentially('typed');
    await expect(input).toHaveValue('typed');
  },
  formValue: { name: 'q', expected: (n) => `value-${n}` },
  slot: DEFAULT_SLOT,
};

const COMPOUND_PROBE: HtmxFixture = {
  tag: 'line-htmx-compound-probe',
  commitEvent: 'line-select',
  async commit(host, n) {
    // Commits cycle through the three internal buttons.
    await host
      .getByRole('button')
      .nth((n - 1) % 3)
      .click();
  },
  async nonCommit(host) {
    await host.getByRole('button', { name: 'one', exact: true }).focus();
    for (const key of ['ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) await host.page().keyboard.press(key);
    await expect(host.getByRole('button', { name: 'three', exact: true })).toBeFocused();
  },
  formValue: { na: 'the compound probe is not form-associated and carries no value' },
  slot: DEFAULT_SLOT,
};

const SEEDED_VALUE_PROBE: HtmxFixture = {
  ...VALUE_PROBE,
  attributes: { 'aria-label': 'Seeded value probe' },
  content: '<span>Seeded item</span>',
  slot: {
    name: null,
    async pickedUp(host, assigned) {
      // The seeded child plus the two swapped ones. Without `content` the count is 2.
      expect(assigned).toBe(3);
      await expect(host).toHaveAttribute('data-slotted', '3');
      await expect(host.getByText('Seeded item', { exact: true })).toBeVisible();
      await expect(host).toHaveAttribute('aria-label', 'Seeded value probe');
    },
  },
};

const FIXTURES = [
  ['value probe', VALUE_PROBE],
  ['compound probe', COMPOUND_PROBE],
  ['seeded value probe', SEEDED_VALUE_PROBE],
] as const;

for (const major of HTMX_MAJORS) {
  test.describe(`htmx ${major}`, () => {
    test.beforeEach(async ({ page }) => {
      await routeHtmx(page, major);
      await page.goto('/htmx/');
      await expect.poll(() => page.evaluate(() => window.htmx?.version)).toMatch(new RegExp(`^${major}\\.`));
      await page.evaluate(() =>
        Promise.all(
          ['line-htmx-value-probe', 'line-htmx-compound-probe'].map((tag) => customElements.whenDefined(tag)),
        ),
      );
    });

    const transport = major === 2 ? 'xhr' : 'fetch';
    test(`page.route answers the ${major === 2 ? 'XMLHttpRequest' : 'fetch'} requests htmx ${major} sends`, ({
      page,
    }) => expectRouteAnswers(page, transport));

    for (const [label, fixture] of FIXTURES) {
      test(`${label} · (a) its value reaches the request <form hx-post> sends`, ({ page }) =>
        expectFormValue(page, fixture));
      test(`${label} · (b) hx-trigger="${fixture.commitEvent}" sends one request per commit`, ({ page }) =>
        expectOneRequestPerCommit(page, fixture));
      test(`${label} · (c) the non-commit interaction sends no request`, ({ page }) =>
        expectNoRequestWithoutCommit(page, fixture));
      test(`${label} · (d) content swapped into its slot renders and sets data-slotted`, ({ page }) =>
        expectSlotSwap(page, fixture));
    }
  });
}
