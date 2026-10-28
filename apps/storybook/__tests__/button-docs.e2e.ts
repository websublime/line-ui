/**
 * Button autodocs page (Phase 1 spec §6.C.6 stream acceptance; §6.P.10).
 *
 * The `Components/Button` docs page on `storybook-static` lists the
 * attributes, slots, events and CSS parts of `line-button` from the shipped
 * Custom Elements Manifest, each under its own category.
 *
 * @module apps/storybook/__tests__/button-docs.e2e
 */

import { expect, type Locator, test } from 'playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4320' });

/** The first-cell names of the rows the args table shows under `category`. */
async function rowsOf(table: Locator, category: string): Promise<string[]> {
  return table.evaluate((element, wanted) => {
    const names: string[] = [];
    let current = '';
    for (const row of element.querySelectorAll('tbody tr')) {
      // A section row carries `title="Hide <category> items"`; the rows after it belong to that category.
      const title = row.getAttribute('title');
      if (title) {
        current = title.replace(/^(Hide|Show) | items$/g, '');
      } else if (current === wanted) {
        names.push(row.querySelector('td')?.innerText.trim().split('\n')[0] ?? '');
      }
    }
    return names;
  }, category);
}

test('the Button docs page shows attributes, slots, events and parts from the manifest', async ({ page }) => {
  await page.goto('/iframe.html?id=components-button--docs&viewMode=docs');
  const table = page.locator('table.docblock-argstable').first();
  await expect(table).toBeVisible();

  expect(await rowsOf(table, 'attributes')).toEqual([
    'variant',
    'type',
    'disabled',
    'loading',
    'pressed',
    'value',
    'name',
    'formaction',
    'formmethod',
    'formenctype',
    'formtarget',
    'formnovalidate',
    'custom-validity',
    'aria-label',
    'aria-description',
  ]);
  expect(await rowsOf(table, 'slots')).toEqual(['(default)', 'prefix', 'suffix', 'loading']);
  expect(await rowsOf(table, 'events')).toEqual(['line-change']);
  expect(await rowsOf(table, 'css shadow parts')).toEqual(['root', 'label', 'loading']);
  expect(await rowsOf(table, 'css custom properties')).toHaveLength(9);
});
