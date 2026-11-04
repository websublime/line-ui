/**
 * `<line-a2ui-surface>` autodocs page (Phase 1 spec §6.G.4 Acceptance; §10 SD94).
 *
 * The `Agent UI/A2UI Surface` docs page on `storybook-static` lists the
 * attributes, properties and both events of `line-a2ui-surface` from the
 * merged Custom Elements Manifest that `preview.ts` registers, each under its
 * own category, with the limit defaults. Methods and internal members stay out.
 *
 * @module apps/storybook/__tests__/a2ui-surface-docs.e2e
 */

import { expect, type Locator, test } from 'playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4320' });

/** The first-cell names, and the default cells, of the rows the args table shows under `category`. */
async function rowsOf(table: Locator, category: string): Promise<[string, string][]> {
  return table.evaluate((element, wanted) => {
    const rows: [string, string][] = [];
    let current = '';
    for (const row of element.querySelectorAll('tbody tr')) {
      // A section row carries `title="Hide <category> items"`; the rows after it belong to that category.
      const title = row.getAttribute('title');
      if (title) {
        current = title.replace(/^(Hide|Show) | items$/g, '');
      } else if (current === wanted) {
        const cells = row.querySelectorAll('td');
        rows.push([
          (cells[0] as HTMLElement | undefined)?.innerText.trim().split('\n')[0] ?? '',
          (cells[2] as HTMLElement | undefined)?.innerText.trim() ?? '',
        ]);
      }
    }
    return rows;
  }, category);
}

test('the A2UI Surface docs page shows attributes, properties and events from the merged manifest', async ({
  page,
}) => {
  await page.goto('/iframe.html?id=agent-ui-a2ui-surface--docs&viewMode=docs');
  const table = page.locator('table.docblock-argstable').first();
  await expect(table).toBeVisible();

  expect(await rowsOf(table, 'attributes')).toEqual([
    ['surface-id', '""'],
    ['max-nodes', '1000'],
    ['max-depth', '32'],
    ['max-data-model-size', '1048576'],
    ['live-update-text', 'Content updated.'],
    ['live-error-text', 'Some content could not be shown.'],
  ]);
  expect((await rowsOf(table, 'properties')).map(([name]) => name)).toEqual([
    'surfaceId',
    'session',
    'iconMap',
    'urlPolicy',
    'markdownRenderer',
    'maxNodes',
    'maxDepth',
    'maxDataModelSize',
    'liveUpdateText',
    'liveErrorText',
  ]);
  expect((await rowsOf(table, 'events')).map(([name]) => name)).toEqual(['line-a2ui-error', 'line-a2ui-action']);
});
