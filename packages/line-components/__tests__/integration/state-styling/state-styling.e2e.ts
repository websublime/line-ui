/**
 * The state-styling contract of `<line-button>` and `<line-icon-button>` (spec `0002-button.md` AM-008,
 * `0003-icon-button.md` AM-002; ARCH §14.8), in chromium, firefox and webkit.
 *
 * Both components draw only the focus ring; hover, active, pressed, loading and disabled stay headless. This file
 * proves the selectors the docs give consumers reach `::part(root)`: the native `:hover` and `:active` on the host,
 * and the reflected `[data-*]` attributes and `:state()` custom states. It also records which other native
 * pseudo-classes match the host: `:focus` does on keyboard focus, `:focus-visible` does not (so
 * `[data-focus-visible]` carries it), and `:disabled` matches the form-associated `line-button` only.
 *
 * Each selector sets its own property on `::part(root)`, so a test reads which rules apply from the computed style
 * of the inner button. The fixture page `state-styling/index.html` loads the built `./button` and `./icon-button`.
 *
 * @module __tests__/integration/state-styling/state-styling.e2e
 */

import { expect, type Locator, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/state-styling/';

/** One rule per selector, each on its own property, so the computed style shows which rules apply. */
const CONSUMER_CSS = `
  :is(line-button, line-icon-button):hover::part(root) { background-color: rgb(0, 128, 0); }
  :is(line-button, line-icon-button):active::part(root) { color: rgb(128, 0, 0); }
  :is(line-button, line-icon-button)[data-active]::part(root) { border-top-color: rgb(0, 0, 128); }
  :is(line-button, line-icon-button):state(active)::part(root) { border-bottom-color: rgb(0, 0, 129); }
  :is(line-button, line-icon-button)[data-pressed]::part(root) { border-left-color: rgb(1, 2, 3); }
  :is(line-button, line-icon-button):state(pressed)::part(root) { border-right-color: rgb(1, 2, 4); }
  :is(line-button, line-icon-button)[data-loading]::part(root) { outline-color: rgb(5, 6, 7); }
  :is(line-button, line-icon-button):state(loading)::part(root) { text-decoration-color: rgb(5, 6, 8); }
  :is(line-button, line-icon-button)[data-disabled]::part(root) { column-rule-color: rgb(9, 10, 11); }
  :is(line-button, line-icon-button):state(disabled)::part(root) { caret-color: rgb(9, 10, 12); }
`;

/** The property each selector of `CONSUMER_CSS` sets, with the value it sets. */
const RULES = {
  hover: ['background-color', 'rgb(0, 128, 0)'],
  activePseudo: ['color', 'rgb(128, 0, 0)'],
  dataActive: ['border-top-color', 'rgb(0, 0, 128)'],
  stateActive: ['border-bottom-color', 'rgb(0, 0, 129)'],
  dataPressed: ['border-left-color', 'rgb(1, 2, 3)'],
  statePressed: ['border-right-color', 'rgb(1, 2, 4)'],
  dataLoading: ['outline-color', 'rgb(5, 6, 7)'],
  stateLoading: ['text-decoration-color', 'rgb(5, 6, 8)'],
  dataDisabled: ['column-rule-color', 'rgb(9, 10, 11)'],
  stateDisabled: ['caret-color', 'rgb(9, 10, 12)'],
} as const;

type Rule = keyof typeof RULES;

const TAGS = ['line-button', 'line-icon-button'] as const;

/** The rules of `CONSUMER_CSS` whose value the inner `[part="root"]` of `host` computes now. */
async function applied(host: Locator): Promise<Rule[]> {
  const computed = await host.evaluate(
    (el, properties) => {
      const style = getComputedStyle(el.shadowRoot?.querySelector('[part="root"]') as Element);
      return properties.map((property) => style.getPropertyValue(property));
    },
    Object.values(RULES).map(([property]) => property),
  );
  return (Object.keys(RULES) as Rule[]).filter((rule, index) => computed[index] === RULES[rule][1]);
}

/** Whether the host matches `selector`. */
function matches(host: Locator, selector: string): Promise<boolean> {
  return host.evaluate((el, s) => el.matches(s), selector);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(
    async ([html, css]) => {
      const main = document.querySelector('main') as HTMLElement;
      main.innerHTML = `<style>${css}</style>${html}`;
      await Promise.all(
        [...main.querySelectorAll('line-button, line-icon-button')].map(
          (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
        ),
      );
    },
    [markup, CONSUMER_CSS] as const,
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto(FIXTURE_URL);
  await page.evaluate(() =>
    Promise.all([customElements.whenDefined('line-button'), customElements.whenDefined('line-icon-button')]),
  );
});

for (const tag of TAGS) {
  test.describe(tag, () => {
    test('at rest no state rule applies', async ({ page }) => {
      await mount(page, `<p>Rest</p><${tag} id="host" aria-label="Save">Save</${tag}>`);
      expect(await applied(page.locator('#host'))).toEqual([]);
    });

    test(':hover on the host styles ::part(root) while the pointer is over it', async ({ page }) => {
      await mount(page, `<p id="away">Away</p><${tag} id="host" aria-label="Save">Save</${tag}>`);
      const host = page.locator('#host');
      await host.hover();
      expect(await matches(host, ':hover')).toBe(true);
      expect(await applied(host)).toEqual(['hover']);
      await page.locator('#away').hover();
      expect(await applied(host)).toEqual([]);
    });

    test(':active, [data-active] and :state(active) style ::part(root) during a press', async ({ page }) => {
      await mount(page, `<${tag} id="host" aria-label="Save">Save</${tag}>`);
      const host = page.locator('#host');
      await host.hover();
      await page.mouse.down();
      await expect(host).toHaveAttribute('data-active', '');
      expect(await applied(host)).toEqual(['hover', 'activePseudo', 'dataActive', 'stateActive']);
      await page.mouse.up();
      await expect(host).not.toHaveAttribute('data-active');
      expect(await applied(host)).toEqual(['hover']);
    });

    test('[data-pressed], [data-loading] and [data-disabled] style ::part(root), as their :state() twins', async ({
      page,
    }) => {
      await mount(
        page,
        `<${tag} id="pressed" pressed="true" aria-label="Mute">M</${tag}>
        <${tag} id="loading" loading aria-label="Save">S</${tag}>
        <${tag} id="disabled" disabled aria-label="Delete">D</${tag}>`,
      );
      expect(await applied(page.locator('#pressed'))).toEqual(['dataPressed', 'statePressed']);
      expect(await applied(page.locator('#loading'))).toEqual(['dataLoading', 'stateLoading']);
      expect(await applied(page.locator('#disabled'))).toEqual(['dataDisabled', 'stateDisabled']);
    });

    test('on keyboard focus the host matches :focus and [data-focus-visible], not :focus-visible', async ({
      page,
      browserName,
    }) => {
      await mount(page, `<button id="before">before</button><${tag} id="host" aria-label="Save">Save</${tag}>`);
      const host = page.locator('#host');
      await page.locator('#before').focus();
      await page.keyboard.press(tab(browserName));
      await expect(host).toHaveAttribute('data-focus-visible', '');
      expect(await matches(host, ':focus')).toBe(true);
      expect(await matches(host, ':focus-visible')).toBe(false);
    });
  });
}

test(':disabled matches the form-associated line-button host only', async ({ page }) => {
  await mount(
    page,
    `<line-button id="button" disabled>Delete</line-button>
    <line-icon-button id="icon-button" disabled aria-label="Delete">D</line-icon-button>`,
  );
  expect(await matches(page.locator('#button'), ':disabled')).toBe(true);
  expect(await matches(page.locator('#icon-button'), ':disabled')).toBe(false);
});
