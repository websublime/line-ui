/**
 * `<line-stack>` browser tier (spec `0018-stack.md` Tests, Browser row; Phase 1 spec §7.8).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third
 * `webServer` of `playwright.config.ts` serves on port 4321. `index.html` loads
 * the built `@websublime/line-components/stack` with the `sizing` and `layouts`
 * tokens; `no-tokens.html` loads Stack alone. Each test mounts its markup into
 * `<main>`. These tests prove the spec's three CSS claims: `justify="stretch"`
 * grows the items, consumer CSS beats the `:host` rules, and an undefined gap
 * token leaves `gap` at `normal`.
 *
 * @module __tests__/integration/stack/stack.e2e
 */

import { expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/stack/';

async function open(page: Page, path = ''): Promise<void> {
  await page.goto(`${FIXTURE_URL}${path}`);
  await page.evaluate(() => customElements.whenDefined('line-stack'));
}

/** Replaces the content of `<main>` and waits for every `line-stack` to render. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    await Promise.all(
      [...main.querySelectorAll('line-stack')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  }, markup);
}

/** Computed values of the first `line-stack` in `<main>`. */
function computed(page: Page, properties: string[]): Promise<Record<string, string>> {
  return page.evaluate((names) => {
    const style = getComputedStyle(document.querySelector('main line-stack') as Element);
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]));
  }, properties);
}

const ITEMS = '<div style="inline-size: 40px">a</div><div style="inline-size: 40px">b</div>';

test.describe('with line-tokens', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('the defaults are a nowrap column, start, stretch and the step 2 gap', async ({ page }) => {
    await mount(page, `<line-stack>${ITEMS}</line-stack>`);
    expect(
      await computed(page, ['display', 'flex-direction', 'justify-content', 'align-items', 'flex-wrap', 'gap']),
    ).toEqual({
      display: 'flex',
      'flex-direction': 'column',
      'justify-content': 'flex-start',
      'align-items': 'stretch',
      'flex-wrap': 'nowrap',
      gap: '8px',
    });
  });

  for (const [value, expected] of [
    ['horizontal', 'row'],
    ['vertical', 'column'],
    ['bogus', 'column'],
  ] as const) {
    test(`orientation="${value}" computes flex-direction ${expected}`, async ({ page }) => {
      await mount(page, `<line-stack orientation="${value}">${ITEMS}</line-stack>`);
      expect((await computed(page, ['flex-direction']))['flex-direction']).toBe(expected);
    });
  }

  for (const [value, expected] of [
    ['start', 'flex-start'],
    ['center', 'center'],
    ['end', 'flex-end'],
    ['spaceBetween', 'space-between'],
    ['spaceAround', 'space-around'],
    ['spaceEvenly', 'space-evenly'],
    ['stretch', 'flex-start'],
    ['bogus', 'flex-start'],
  ] as const) {
    test(`justify="${value}" computes justify-content ${expected}`, async ({ page }) => {
      await mount(page, `<line-stack justify="${value}">${ITEMS}</line-stack>`);
      expect((await computed(page, ['justify-content']))['justify-content']).toBe(expected);
    });
  }

  for (const [value, expected] of [
    ['start', 'flex-start'],
    ['center', 'center'],
    ['end', 'flex-end'],
    ['stretch', 'stretch'],
    ['bogus', 'stretch'],
  ] as const) {
    test(`align="${value}" computes align-items ${expected}`, async ({ page }) => {
      await mount(page, `<line-stack align="${value}">${ITEMS}</line-stack>`);
      expect((await computed(page, ['align-items']))['align-items']).toBe(expected);
    });
  }

  test('wrap computes flex-wrap wrap', async ({ page }) => {
    await mount(page, `<line-stack wrap>${ITEMS}</line-stack>`);
    expect((await computed(page, ['flex-wrap']))['flex-wrap']).toBe('wrap');
  });

  for (const [value, expected] of [
    ['0', '0px'],
    ['1', '4px'],
    ['2', '8px'],
    ['3', '16px'],
    ['4', '24px'],
    ['5', '32px'],
    ['9', '8px'],
  ] as const) {
    test(`gap="${value}" computes gap ${expected}`, async ({ page }) => {
      await mount(page, `<line-stack gap="${value}">${ITEMS}</line-stack>`);
      const { 'row-gap': row, 'column-gap': column } = await computed(page, ['row-gap', 'column-gap']);
      expect([row, column]).toEqual([expected, expected]);
    });
  }

  test('justify="stretch" grows the items to share the main axis, while justify-content: stretch alone does not', async ({
    page,
  }) => {
    const markup = (attrs: string) => `<line-stack orientation="horizontal" gap="0" ${attrs}>${ITEMS}</line-stack>`;
    const widths = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('main line-stack > div')].map((el) => el.getBoundingClientRect().width),
      );
    await mount(page, markup('justify="stretch" style="inline-size: 400px"'));
    expect(await widths()).toEqual([200, 200]);
    // The claim behind the ::slotted rule: the CSS keyword on a flex container behaves as flex-start.
    await mount(page, markup('style="inline-size: 400px; justify-content: stretch"'));
    expect(await widths()).toEqual([40, 40]);
    expect(
      await page.evaluate(() => (document.querySelector('main line-stack > div') as Element).getBoundingClientRect().x),
    ).toBe(await page.evaluate(() => (document.querySelector('main line-stack') as Element).getBoundingClientRect().x));
  });

  test('a row runs right to left under dir="rtl"', async ({ page }) => {
    await mount(page, `<div dir="rtl"><line-stack orientation="horizontal">${ITEMS}</line-stack></div>`);
    const [first, second] = await page.evaluate(() =>
      [...document.querySelectorAll('main line-stack > div')].map((el) => el.getBoundingClientRect().x),
    );
    expect(first).toBeGreaterThan(second as number);
  });

  test('consumer CSS on line-stack beats the :host rules', async ({ page }) => {
    await mount(
      page,
      `<style>
        line-stack.custom { flex-direction: row-reverse; justify-content: center; align-items: baseline; flex-wrap: wrap-reverse; gap: 3px; }
        line-stack.token { --line-stack-gap: 5px; }
      </style>
      <line-stack class="custom" orientation="vertical" justify="end" align="start" gap="5">${ITEMS}</line-stack>
      <line-stack class="token" gap="4">${ITEMS}</line-stack>`,
    );
    expect(await computed(page, ['flex-direction', 'justify-content', 'align-items', 'flex-wrap', 'row-gap'])).toEqual({
      'flex-direction': 'row-reverse',
      'justify-content': 'center',
      'align-items': 'baseline',
      'flex-wrap': 'wrap-reverse',
      'row-gap': '3px',
    });
    expect(
      await page.evaluate(() => getComputedStyle(document.querySelector('main line-stack.token') as Element).rowGap),
    ).toBe('5px');
  });

  test('<line-stack hidden> renders nothing', async ({ page }) => {
    await mount(page, `<line-stack hidden>${ITEMS}</line-stack>`);
    expect((await computed(page, ['display'])).display).toBe('none');
    await expect(page.locator('main line-stack')).toBeHidden();
  });

  test('the author list is a list with listitem children', async ({ page }) => {
    await mount(
      page,
      `<line-stack role="list" aria-label="Recent files">
        <div role="listitem">report.pdf</div>
        <div role="listitem">notes.md</div>
      </line-stack>`,
    );
    await expect(page.locator('main')).toMatchAriaSnapshot(`
      - list "Recent files":
        - listitem: report.pdf
        - listitem: notes.md
    `);
  });
});

test.describe('without line-tokens', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, 'no-tokens.html');
  });

  test('an undefined gap token leaves gap at normal', async ({ page }) => {
    await mount(page, `<line-stack>${ITEMS}</line-stack><line-stack gap="3">${ITEMS}</line-stack>`);
    const gaps = await page.evaluate(() =>
      [...document.querySelectorAll('main line-stack')].map((el) => getComputedStyle(el).rowGap),
    );
    expect(gaps).toEqual(['normal', 'normal']);
  });

  test('gap="0" still computes 0px', async ({ page }) => {
    await mount(page, `<line-stack gap="0">${ITEMS}</line-stack>`);
    expect((await computed(page, ['row-gap']))['row-gap']).toBe('0px');
  });
});
