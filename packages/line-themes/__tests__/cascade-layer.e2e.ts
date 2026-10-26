/**
 * Cascade layer `line` — browser tier (spec §6.C and §6.F.4, AM-058).
 *
 * Loads the built `line-tokens` CSS (its `dist/index.css` inlines `reset.css`)
 * and the built `line-colors` and `line-themes` CSS, each resolved by package
 * name, into a page, and checks in each engine that consumer rules beat the
 * package rules: an unlayered `:where(html)` override loaded before the
 * packages, an override in `@layer base` once the page starts with
 * `@layer line;`, and a `.mt-4` utility in `@layer utilities` against
 * `reset.css`. Each case fails against unlayered package CSS.
 *
 * @module __tests__/cascade-layer.e2e
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from 'playwright/test';

const packages = ['@websublime/line-tokens', '@websublime/line-colors', '@websublime/line-themes']
  .map((name) => readFileSync(fileURLToPath(import.meta.resolve(name)), 'utf8'))
  .join('\n');

/** One token from each package, with a consumer value no package declares. */
const OVERRIDES = {
  '--line-radius-1': '99px',
  '--line-indigo-9': 'rgb(1, 2, 3)',
  '--line-accent-9': 'rgb(4, 5, 6)',
} as const;

const declarations = Object.entries(OVERRIDES)
  .map(([name, value]) => `${name}: ${value};`)
  .join(' ');

/** Renders a page whose `<head>` holds `styles` in order, one `<style>` each. */
async function render(page: Page, styles: string[]): Promise<void> {
  await page.setContent(
    `<!doctype html>
<html>
  <head>${styles.map((css) => `<style>${css}</style>`).join('')}</head>
  <body>
    <div class="line-card"><p id="paragraph" class="mt-4">Text</p></div>
  </body>
</html>`,
  );
}

/** Reads each overridden token on `<html>`. */
function readTokens(page: Page): Promise<Record<string, string>> {
  return page.evaluate((names) => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()]));
  }, Object.keys(OVERRIDES));
}

test('a consumer :where(html) override outside @layer, loaded before the packages, wins', async ({ page }) => {
  await render(page, [`:where(html) { ${declarations} }`, packages]);
  expect(await readTokens(page)).toEqual(OVERRIDES);
});

test('a consumer override in @layer base wins when the page starts with @layer line;', async ({ page }) => {
  await render(page, ['@layer line;', packages, `@layer base { html { ${declarations} } }`]);
  expect(await readTokens(page)).toEqual(OVERRIDES);
});

test('a .mt-4 utility in @layer utilities beats reset.css inside .line-card', async ({ page }) => {
  await render(page, ['@layer line;', packages, '@layer utilities { .mt-4 { margin-top: 16px; } }']);
  const margin = await page.evaluate(() => getComputedStyle(document.getElementById('paragraph') as Element).marginTop);
  expect(margin).toBe('16px');
});
