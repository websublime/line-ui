/**
 * `<line-icon-button>` browser tier (spec `0003-icon-button.md` Tests, Browser row; Phase 1 spec §7.8; §10 SD99).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third
 * `webServer` of `playwright.config.ts` serves on port 4321. `index.html`
 * loads the built `@websublime/line-components/icon-button` and `./icon` with
 * the sizing and typography tokens; `no-tokens.html` loads IconButton alone.
 * Each test mounts its markup into `<main>`. Keyboard, focus, presses, the
 * form and `<fieldset disabled>` behaviour, the accessible name and the box
 * size live here, because happy-dom models none of them. The engine's own
 * accessible name is read through a CDP session in chromium only.
 *
 * @module __tests__/integration/icon-button/icon-button.e2e
 */

import { type CDPSession, expect, type Locator, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/icon-button/';

/** A 16 px decorative glyph; the host `aria-label` names the button. */
const ICON =
  '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="M2 2h12v12H2z" fill="currentColor" /></svg>';

async function open(page: Page, path = ''): Promise<void> {
  await page.goto(`${FIXTURE_URL}${path}`);
  await page.evaluate(() => customElements.whenDefined('line-icon-button'));
}

test.beforeEach(async ({ page }) => {
  await open(page);
});

/** Replaces the content of `<main>` and waits for every `line-icon-button` to render. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    await Promise.all(
      [...main.querySelectorAll('line-icon-button')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  }, markup);
}

/** The id of the focused element, through the open shadow roots, as `host>inner`. */
function focusPath(page: Page): Promise<string> {
  return page.evaluate(() => {
    const parts: string[] = [];
    let active = document.activeElement;
    while (active) {
      parts.push(active.id || active.localName);
      active = active.shadowRoot?.activeElement ?? null;
    }
    return parts.join('>');
  });
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string, shift = false): string {
  const key = shift ? 'Shift+Tab' : 'Tab';
  return browserName === 'webkit' && process.platform === 'darwin' ? `Alt+${key}` : key;
}

function host(page: Page, id: string): Locator {
  return page.locator(`#${id}`);
}

/** Records every `line-change` value on the document as `window.lineChanges`. */
async function recordChanges(page: Page): Promise<void> {
  await page.evaluate(() => {
    const seen: boolean[] = [];
    Object.assign(window, { lineChanges: seen });
    document.addEventListener('line-change', (event) =>
      seen.push((event as CustomEvent<{ value: boolean }>).detail.value),
    );
  });
}

/** The recorded `line-change` values, read two tasks after the caller's last action so the activation has run. */
function changes(page: Page): Promise<boolean[]> {
  return page.evaluate(
    () =>
      new Promise<boolean[]>((resolve) => {
        setTimeout(() => setTimeout(() => resolve((window as unknown as { lineChanges: boolean[] }).lineChanges)));
      }),
  );
}

test.describe('keyboard and focus', () => {
  test('Tab reaches an enabled and a loading icon button and skips a disabled one', async ({ page, browserName }) => {
    await mount(
      page,
      `<button id="before">before</button>
      <line-icon-button id="plain" aria-label="Settings">${ICON}</line-icon-button>
      <line-icon-button id="off" disabled aria-label="Delete">${ICON}</line-icon-button>
      <line-icon-button id="busy" loading aria-label="Refreshing">${ICON}</line-icon-button>
      <button id="after">after</button>`,
    );
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    expect(await focusPath(page)).toBe('plain>button');
    await page.keyboard.press(tab(browserName));
    expect(await focusPath(page)).toBe('busy>button');
    await page.keyboard.press(tab(browserName));
    expect(await focusPath(page)).toBe('after');
    await page.keyboard.press(tab(browserName, true));
    expect(await focusPath(page)).toBe('busy>button');
  });

  test('host.focus() focuses the inner button through delegatesFocus', async ({ page }) => {
    await mount(page, `<line-icon-button id="plain" aria-label="Settings">${ICON}</line-icon-button>`);
    await host(page, 'plain').evaluate((el: HTMLElement) => el.focus());
    expect(await focusPath(page)).toBe('plain>button');
  });

  test('Enter and Space activate a toggle and fire line-change once each', async ({ page }) => {
    await mount(page, `<line-icon-button id="mute" pressed="false" aria-label="Mute">${ICON}</line-icon-button>`);
    await recordChanges(page);
    await host(page, 'mute').focus();
    await page.keyboard.press('Enter');
    await expect(host(page, 'mute')).toHaveAttribute('pressed', 'true');
    await page.keyboard.press('Space');
    await expect(host(page, 'mute')).toHaveAttribute('pressed', 'false');
    expect(await changes(page)).toEqual([true, false]);
    await expect(host(page, 'mute').getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  test('data-active follows a pointer press and the Enter and Space keys', async ({ page }) => {
    await mount(page, `<line-icon-button id="plain" aria-label="Settings">${ICON}</line-icon-button>`);
    const el = host(page, 'plain');
    const box = await el.boundingBox();
    if (!box) throw new Error('no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect(el).toHaveAttribute('data-active', '');
    await page.mouse.up();
    await expect(el).not.toHaveAttribute('data-active');

    await el.focus();
    for (const key of ['Enter', 'Space']) {
      await page.keyboard.down(key);
      await expect(el).toHaveAttribute('data-active', '');
      await page.keyboard.up(key);
      await expect(el).not.toHaveAttribute('data-active');
    }
  });

  test('Enter and Space on a loading icon button enter no active state and do not activate', async ({ page }) => {
    await mount(
      page,
      `<line-icon-button id="busy" pressed="false" loading aria-label="Mute">${ICON}</line-icon-button>`,
    );
    const el = host(page, 'busy');
    await el.focus();
    for (const key of ['Enter', 'Space']) {
      await page.keyboard.down(key);
      await expect(el).not.toHaveAttribute('data-active');
      await page.keyboard.up(key);
    }
    await expect(el).toHaveAttribute('pressed', 'false');
  });

  test('data-focus-visible is set for keyboard focus only', async ({ page, browserName }) => {
    await mount(
      page,
      `<button id="before">before</button><line-icon-button id="plain" aria-label="Settings">${ICON}</line-icon-button>`,
    );
    const el = host(page, 'plain');
    await el.click();
    await expect(el).not.toHaveAttribute('data-focus-visible');

    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await expect(el).toHaveAttribute('data-focus-visible', '');
    await page.keyboard.press(tab(browserName, true));
    await expect(el).not.toHaveAttribute('data-focus-visible');
  });
});

test.describe('activation', () => {
  test('no click reaches host or ancestor listeners while disabled or loading', async ({ page }) => {
    await mount(
      page,
      `<line-icon-button id="off" pressed="false" disabled aria-label="Mute">${ICON}</line-icon-button>
      <line-icon-button id="busy" pressed="false" loading aria-label="Mute">${ICON}</line-icon-button>`,
    );
    await recordChanges(page);
    await page.evaluate(() => {
      const clicks: string[] = [];
      Object.assign(window, { lineClicks: clicks });
      for (const id of ['off', 'busy']) {
        document.getElementById(id)?.addEventListener('click', () => clicks.push(`host:${id}`));
      }
      document.addEventListener('click', (event) => clicks.push(`document:${(event.target as Element).id}`));
    });
    await host(page, 'busy').click();
    await host(page, 'busy').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await host(page, 'off').click({ force: true });
    for (const id of ['off', 'busy']) await host(page, id).evaluate((el: HTMLElement) => el.click());

    expect(await changes(page)).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { lineClicks: string[] }).lineClicks)).toEqual([]);
    for (const id of ['off', 'busy']) await expect(host(page, id)).toHaveAttribute('pressed', 'false');
  });

  test('preventDefault on click cancels the toggle flip; stopPropagation does not', async ({ page }) => {
    await mount(page, `<line-icon-button id="mute" pressed="false" aria-label="Mute">${ICON}</line-icon-button>`);
    await recordChanges(page);
    await page.evaluate(() => {
      document.querySelector('#mute')?.addEventListener('click', (event) => event.preventDefault(), { once: true });
    });
    await host(page, 'mute').click();
    expect(await changes(page)).toEqual([]);
    await expect(host(page, 'mute')).toHaveAttribute('pressed', 'false');

    await page.evaluate(() => {
      document.querySelector('#mute')?.addEventListener('click', (event) => event.stopPropagation(), { once: true });
    });
    await host(page, 'mute').click();
    expect(await changes(page)).toEqual([true]);
    await expect(host(page, 'mute')).toHaveAttribute('pressed', 'true');
  });
});

test.describe('form behaviour (not form-associated, §10 SD36)', () => {
  test('inside a form, a click, Enter and Space submit nothing and reset nothing', async ({ page }) => {
    await mount(
      page,
      `<form><input id="q" name="q" value="initial" />
        <line-icon-button id="mute" pressed="false" aria-label="Mute">${ICON}</line-icon-button></form>`,
    );
    await page.evaluate(() => {
      Object.assign(window, { lineSubmits: 0, lineResets: 0 });
      const form = document.querySelector('form') as HTMLFormElement;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        (window as unknown as { lineSubmits: number }).lineSubmits += 1;
      });
      form.addEventListener('reset', () => {
        (window as unknown as { lineResets: number }).lineResets += 1;
      });
    });
    await recordChanges(page);
    await page.locator('#q').fill('edited');
    const el = host(page, 'mute');
    await el.click();
    await el.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');

    expect(await changes(page)).toEqual([true, false, true]);
    expect(
      await page.evaluate(() => {
        const state = window as unknown as { lineSubmits: number; lineResets: number };
        return { submits: state.lineSubmits, resets: state.lineResets };
      }),
    ).toEqual({ submits: 0, resets: 0 });
    await expect(page.locator('#q')).toHaveValue('edited');
    expect(page.url()).toBe(FIXTURE_URL);
    expect(
      await el.evaluate((button: HTMLElement) => {
        const inner = button.shadowRoot?.querySelector('button');
        return {
          formAssociated: Reflect.get(button.constructor, 'formAssociated') ?? false,
          innerForm: inner?.form,
          innerType: inner?.type,
        };
      }),
    ).toEqual({ formAssociated: false, innerForm: null, innerType: 'button' });
  });

  test('a <fieldset disabled> ancestor does not disable it: it stays focusable and activates', async ({
    page,
    browserName,
  }) => {
    await mount(
      page,
      `<form><fieldset id="set" disabled>
        <button id="native" type="button">native</button>
        <line-icon-button id="mute" pressed="false" aria-label="Mute">${ICON}</line-icon-button>
      </fieldset><button id="before" type="button">before</button></form>`,
    );
    await recordChanges(page);
    const el = host(page, 'mute');
    // The control: the native button in the same fieldset is disabled.
    await expect(page.locator('#native')).toBeDisabled();
    await expect(el).not.toHaveAttribute('data-disabled');
    await expect(el.getByRole('button')).toBeEnabled();
    expect(
      await el.evaluate((button: HTMLElement) => button.shadowRoot?.querySelector('button')?.matches(':disabled')),
    ).toBe(false);

    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName, true));
    expect(await focusPath(page)).toBe('mute>button');
    await page.keyboard.press('Enter');
    await el.click();
    expect(await changes(page)).toEqual([true, false]);
  });
});

test.describe('accessible name', () => {
  test('ariaSnapshot: one button node per host with the expected name and pressed state', async ({ page }) => {
    await mount(
      page,
      `<line-icon-button id="plain" aria-label="Settings">${ICON}</line-icon-button>
      <line-icon-button id="toggle" pressed="true" aria-label="Mute">${ICON}</line-icon-button>
      <line-icon-button id="busy" loading aria-label="Refreshing">${ICON}<span slot="loading">Loading…</span></line-icon-button>
      <line-icon-button id="off" disabled aria-label="Delete">${ICON}</line-icon-button>`,
    );
    const main = page.locator('main');
    await expect(main.getByRole('button')).toHaveCount(4);
    await expect(host(page, 'plain').getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
    await expect(host(page, 'toggle').getByRole('button', { name: 'Mute', pressed: true })).toBeVisible();
    await expect(host(page, 'busy').getByRole('button', { name: 'Refreshing', exact: true })).toBeVisible();
    await expect(host(page, 'off').getByRole('button', { name: 'Delete', exact: true })).toBeDisabled();

    const snapshot = await main.ariaSnapshot();
    expect(snapshot).toContain('button "Settings"');
    expect(snapshot).toContain('button "Mute" [pressed]');
    expect(snapshot).toContain('button "Refreshing" [disabled]');
    expect(snapshot).toContain('button "Delete" [disabled]');
    test.info().annotations.push({
      type: 'ariaSnapshot',
      description: `${test.info().project.name}: named generic host ${snapshot.includes('generic "Settings"') ? 'appears' : 'does not appear'}\n${snapshot}`,
    });
  });

  test('the loading slot content stays out of the name while aria-label is set', async ({ page }) => {
    await mount(
      page,
      `<line-icon-button id="busy" loading aria-label="Refresh">${ICON}<span slot="loading">Loading…</span></line-icon-button>`,
    );
    const button = host(page, 'busy').getByRole('button');
    await expect(host(page, 'busy').getByText('Loading…')).toBeVisible();
    await expect(button).toHaveAccessibleName('Refresh');
  });
});

test.describe('box size', () => {
  /** The `[part="root"]` box of `#id`, in CSS pixels. */
  function rootBox(page: Page, id: string): Promise<{ width: number; height: number }> {
    return host(page, id).evaluate((el: HTMLElement) => {
      const rect = el.shadowRoot?.querySelector('[part="root"]')?.getBoundingClientRect();
      if (!rect) throw new Error('no [part="root"]');
      return { width: rect.width, height: rect.height };
    });
  }

  test('with line-tokens the box is the 2rem --line-size-7 square around the icon', async ({ page }) => {
    await mount(page, `<line-icon-button id="plain" aria-label="Settings">${ICON}</line-icon-button>`);
    expect(await rootBox(page, 'plain')).toEqual({ width: 32, height: 32 });
  });

  test('without line-tokens the box shrinks to its 16 px icon', async ({ page }) => {
    await open(page, 'no-tokens.html');
    await mount(page, `<line-icon-button id="plain" aria-label="Settings">${ICON}</line-icon-button>`);
    expect(await rootBox(page, 'plain')).toEqual({ width: 16, height: 16 });
  });
});

/** The CDP accessibility node of the inner `<button>` of `#id`. */
async function innerAxNode(
  cdp: CDPSession,
  id: string,
): Promise<{ role?: { value: string }; name?: { value: string } }> {
  const { result } = await cdp.send('Runtime.evaluate', {
    expression: `document.getElementById(${JSON.stringify(id)}).shadowRoot.querySelector('button')`,
  });
  if (!result.objectId) throw new Error(`no inner button in #${id}`);
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
    objectId: result.objectId,
    fetchRelatives: false,
  });
  return nodes[0] as { role?: { value: string }; name?: { value: string } };
}

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('the engine names the inner button from aria-label, not from the loading slot content', async ({ page }) => {
    await mount(
      page,
      `<line-icon-button id="busy" loading aria-label="Refresh">${ICON}<span slot="loading">Loading…</span></line-icon-button>
      <line-icon-button id="toggle" pressed="false" aria-label="Mute">${ICON}</line-icon-button>`,
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const busy = await innerAxNode(cdp, 'busy');
    expect([busy.role?.value, busy.name?.value]).toEqual(['button', 'Refresh']);
    const toggle = await innerAxNode(cdp, 'toggle');
    expect([toggle.role?.value, toggle.name?.value]).toEqual(['button', 'Mute']);
  });
});
