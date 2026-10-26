/**
 * axe tier — gate fixture (P7, spec §6.P.7, §7.4; R8 §2.4 fixture table).
 *
 * Proves the `axe.ts` helper fails on the defect the tier exists to catch: a
 * host `aria-label` does not name the native `<button>` inside its open
 * shadow root, so axe reports `button-name` (§6.P.7 acceptance). The positive
 * control names the inner button and must report zero violations, so a helper
 * that always fails cannot pass this file. The fixture is built with
 * `page.setContent()`, not a story, so an inaccessible example never ships in
 * the published docs. The page has a `lang` and a `<title>`, so the
 * document-level rules (`html-has-lang`, `document-title`) stay quiet.
 */

import { expect, type Page, test } from 'playwright/test';
import { axe, expectNoAxeViolations } from './axe';

/** Loads a page whose `<line-axe-gate-host aria-label="Save">` renders `inner` in an open shadow root. */
async function loadFixture(page: Page, inner: string): Promise<void> {
  await page.setContent(`<!doctype html>
<html lang="en">
  <head><title>axe gate fixture</title></head>
  <body>
    <main>
      <line-axe-gate-host aria-label="Save"></line-axe-gate-host>
    </main>
    <script>
      customElements.define('line-axe-gate-host', class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' }).innerHTML = ${JSON.stringify(inner)};
        }
      });
    </script>
  </body>
</html>`);
  await expect(page.locator('line-axe-gate-host button')).toBeAttached();
}

test('an unnamed inner <button> behind a labelled host fails with button-name', async ({ page }) => {
  await loadFixture(page, '<button type="button"></button>');

  const { violations } = await axe(page).analyze();
  expect(violations.map((violation) => violation.id)).toEqual(['button-name']);
  await expect(expectNoAxeViolations(axe(page))).rejects.toThrow(/button-name/);
});

test('an inner <button> carrying the host label passes with zero violations', async ({ page }) => {
  await loadFixture(page, '<button type="button" aria-label="Save"></button>');

  const { violations } = await axe(page).analyze();
  expect(violations.map((violation) => violation.id)).toEqual([]);
  await expectNoAxeViolations(axe(page));
});
