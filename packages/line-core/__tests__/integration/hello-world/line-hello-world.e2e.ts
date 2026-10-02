/**
 * Hello-world integration test — browser tier (D8, spec §6.D.8, §9.4).
 *
 * Loads `/hello-world/` from the Vite dev server that `playwright.config.ts`
 * starts (`webServer`, AM-030, AM-031) and asserts the same platform contract as the
 * bun tier, in real engines: the element upgrades, the machine renders `idle`,
 * a real click sends `TOGGLE` and the transition reaches the shadow DOM.
 *
 * @module __tests__/integration/hello-world/line-hello-world.e2e
 */

import { expect, test } from 'playwright/test';

test('<line-hello-world> upgrades and toggles idle → active in a real browser', async ({ page }) => {
  await page.goto('/hello-world/');

  const element = page.locator('line-hello-world');
  await expect.poll(() => page.evaluate(() => customElements.get('line-hello-world') !== undefined)).toBe(true);

  const root = element.locator('[part="root"]');
  const trigger = element.locator('[part="trigger"]');
  await expect(root).toHaveAttribute('data-state', 'idle');
  await expect(trigger).toHaveText('idle');
  await expect(trigger).toBeEnabled();

  await trigger.click();
  await expect(root).toHaveAttribute('data-state', 'active');
  await expect(trigger).toHaveText('active');
});
