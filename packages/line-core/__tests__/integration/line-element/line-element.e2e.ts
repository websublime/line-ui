/**
 * `LineElement` state reflection — browser tier (C23, spec §6.C.2, ARCHITECTURE §14.8).
 *
 * Loads `/line-element/` from the Vite dev server that `playwright.config.ts`
 * starts and checks, in each engine, that a plain `LineElement` subclass
 * reflects the kebab-case state `focus-visible` as `data-focus-visible` and
 * `:state(focus-visible)` without a page error. The `FormAssociated` case
 * lives in `integration/form-associated/form-associated.e2e.ts`.
 *
 * @module __tests__/integration/line-element/line-element.e2e
 */

import { expect, test } from 'playwright/test';

test('a plain LineElement reflects focus-visible as data-focus-visible and :state(focus-visible)', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto('/line-element/');
  await expect.poll(() => page.evaluate(() => customElements.get('line-state-test') !== undefined)).toBe(true);
  await page.evaluate(() => {
    document.body.innerHTML = '<line-state-test></line-state-test>';
  });

  const toggle = (active: boolean) =>
    page.evaluate((next) => {
      const el = document.querySelector('line-state-test');
      if (!el) throw new Error('fixture not mounted');
      el.toggleState('focus-visible', next);
      return { attribute: el.getAttribute('data-focus-visible'), state: el.matches(':state(focus-visible)') };
    }, active);

  expect(await toggle(true)).toEqual({ attribute: '', state: true });
  expect(await toggle(false)).toEqual({ attribute: null, state: false });
  expect(errors).toEqual([]);
});
