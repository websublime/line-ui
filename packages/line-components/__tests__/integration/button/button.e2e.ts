/**
 * `<line-button>` browser tier (spec `0002-button.md` Tests, Browser row; Phase 1 spec §7.8; §10 SD99).
 *
 * Runs in chromium, firefox and webkit on the fixture page that the third
 * `webServer` of `playwright.config.ts` serves on port 4321. The page loads the
 * built `@websublime/line-components/button`, and each test mounts its markup
 * into `<main>`. Keyboard, focus, presses and every form behaviour live here,
 * because happy-dom models none of them.
 *
 * @module __tests__/integration/button/button.e2e
 */

import { expect, type Locator, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/button/';

/** What a form's `submit` listener saw: the submitter's marker and the form data with that submitter. */
interface Submission {
  temporary: boolean;
  submitterValue: string | null;
  entries: [string, string][];
}

declare global {
  interface Window {
    lineSubmissions: Submission[];
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto(FIXTURE_URL);
  await page.evaluate(() => customElements.whenDefined('line-button'));
});

/** Replaces the content of `<main>` and waits for every `line-button` to render. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    await Promise.all(
      [...main.querySelectorAll('line-button')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  }, markup);
}

/** Records every `submit` on `form#f` and cancels its navigation. */
async function recordSubmissions(page: Page, selector = 'form'): Promise<void> {
  await page.evaluate((formSelector) => {
    window.lineSubmissions = [];
    for (const form of document.querySelectorAll<HTMLFormElement>(formSelector)) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const submitter = event.submitter;
        window.lineSubmissions.push({
          temporary: submitter?.hasAttribute('data-line-button-submitter') ?? false,
          submitterValue: submitter?.getAttribute('value') ?? null,
          entries: [...new FormData(form, submitter).entries()].map(([key, value]) => [key, String(value)]),
        });
      });
    }
  }, selector);
}

/** The submissions so far, read one task after the caller's last action so the deferred activation has run. */
function submissions(page: Page): Promise<Submission[]> {
  return page.evaluate(
    () =>
      new Promise<Submission[]>((resolve) => {
        setTimeout(() => setTimeout(() => resolve(window.lineSubmissions)));
      }),
  );
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

test.describe('keyboard and focus', () => {
  test('Tab reaches an enabled and a loading button and skips a disabled one', async ({ page, browserName }) => {
    await mount(
      page,
      `<button id="before">before</button>
      <line-button id="plain">Plain</line-button>
      <line-button id="off" disabled>Off</line-button>
      <line-button id="busy" loading>Busy</line-button>
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
    await mount(page, '<line-button id="plain">Plain</line-button>');
    await host(page, 'plain').evaluate((el: HTMLElement) => el.focus());
    expect(await focusPath(page)).toBe('plain>button');
  });

  test('Enter and Space activate a toggle and fire line-change once each', async ({ page }) => {
    await mount(page, '<line-button id="bold" type="button" pressed="false">Bold</line-button>');
    await page.evaluate(() => {
      const seen: boolean[] = [];
      Object.assign(window, { lineChanges: seen });
      document.addEventListener('line-change', (event) =>
        seen.push((event as CustomEvent<{ value: boolean }>).detail.value),
      );
    });
    await host(page, 'bold').focus();
    await page.keyboard.press('Enter');
    await expect(host(page, 'bold')).toHaveAttribute('pressed', 'true');
    await page.keyboard.press('Space');
    await expect(host(page, 'bold')).toHaveAttribute('pressed', 'false');
    expect(await page.evaluate(() => (window as unknown as { lineChanges: boolean[] }).lineChanges)).toEqual([
      true,
      false,
    ]);
    await expect(host(page, 'bold').getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  test('data-active follows a pointer press and the Enter and Space keys', async ({ page }) => {
    await mount(page, '<line-button id="plain" type="button">Plain</line-button>');
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

  test('Enter and Space on a loading button enter no active state and do not activate', async ({ page }) => {
    await mount(page, '<line-button id="busy" type="button" pressed="false" loading>Busy</line-button>');
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
    await mount(page, '<button id="before">before</button><line-button id="plain" type="button">Plain</line-button>');
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

test.describe('form behaviour', () => {
  test('submit sends name=value with the temporary native button as event.submitter, then removes it', async ({
    page,
  }) => {
    await mount(
      page,
      `<form><input name="q" value="term" />
        <line-button id="save" name="intent" value="save">Save</line-button>
        <line-button id="publish" name="intent" value="publish">Publish</line-button></form>`,
    );
    await recordSubmissions(page);
    await host(page, 'publish').click();
    expect(await submissions(page)).toEqual([
      {
        temporary: true,
        submitterValue: 'publish',
        entries: [
          ['q', 'term'],
          ['intent', 'publish'],
        ],
      },
    ]);
    await expect(page.locator('[data-line-button-submitter]')).toHaveCount(0);
  });

  test('a button with no type submits; Enter and Space on it submit; type="button" does not', async ({ page }) => {
    await mount(
      page,
      `<form><line-button id="submit" name="via" value="default">Go</line-button>
        <line-button id="plain" type="button" name="via" value="plain">Plain</line-button></form>`,
    );
    await recordSubmissions(page);
    await host(page, 'plain').click();
    await host(page, 'submit').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    const seen = await submissions(page);
    expect(seen.map((submission) => submission.entries)).toEqual([[['via', 'default']], [['via', 'default']]]);
  });

  test('formaction and formmethod override the form when this button submits', async ({ page }) => {
    const requests: { method: string; path: string; body: string }[] = [];
    await page.route('**/line-form/**', async (route) => {
      const request = route.request();
      requests.push({
        method: request.method(),
        path: new URL(request.url()).pathname,
        body: request.postData() ?? '',
      });
      await route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>done</title>' });
    });
    await mount(
      page,
      `<form action="/line-form/default" method="get">
        <line-button id="publish" name="intent" value="publish" formaction="/line-form/publish" formmethod="post">Publish</line-button>
      </form>`,
    );
    await Promise.all([page.waitForURL('**/line-form/publish'), host(page, 'publish').click()]);
    expect(requests).toEqual([{ method: 'POST', path: '/line-form/publish', body: 'intent=publish' }]);
  });

  test('formnovalidate skips constraint validation; without it an invalid form does not submit', async ({ page }) => {
    await mount(
      page,
      `<form><input name="q" required />
        <line-button id="check">Check</line-button>
        <line-button id="skip" formnovalidate>Skip</line-button></form>`,
    );
    await recordSubmissions(page);
    await host(page, 'check').click();
    expect(await submissions(page)).toEqual([]);
    await host(page, 'skip').click();
    expect((await submissions(page)).map((submission) => submission.entries)).toEqual([[['q', '']]]);
  });

  test('custom-validity blocks the submit until it empties', async ({ page }) => {
    await mount(page, `<form><line-button id="save" custom-validity="Pick a plan">Save</line-button></form>`);
    await recordSubmissions(page);
    const el = host(page, 'save');
    await expect(el).toHaveAttribute('data-invalid', '');
    await el.click();
    expect(await submissions(page)).toEqual([]);
    await el.evaluate((button: HTMLElement & { customValidity: string }) => {
      button.customValidity = '';
    });
    await expect(el).not.toHaveAttribute('data-invalid');
    // Linux WebKit renders the validation bubble into the anchor's user-agent shadow root, which hides the
    // inner button's content after a blocked submit, so the second activation uses the keyboard.
    await el.focus();
    await page.keyboard.press('Enter');
    expect(await submissions(page)).toHaveLength(1);
  });

  test('method="dialog" closes the dialog with the button value as returnValue', async ({ page }) => {
    await mount(
      page,
      `<dialog id="confirm" open><form method="dialog">
        <line-button id="ok" value="confirmed">OK</line-button></form></dialog>`,
    );
    await host(page, 'ok').click();
    await expect(page.locator('#confirm')).not.toHaveAttribute('open');
    expect(await page.locator('#confirm').evaluate((dialog: HTMLDialogElement) => dialog.returnValue)).toBe(
      'confirmed',
    );
  });

  test('reset restores the form and leaves pressed unchanged', async ({ page }) => {
    await mount(
      page,
      `<form><input id="q" name="q" value="initial" />
        <line-button id="bold" type="button" pressed="true">Bold</line-button>
        <line-button id="reset" type="reset">Reset</line-button></form>`,
    );
    await page.locator('#q').fill('edited');
    await host(page, 'reset').click();
    await expect(page.locator('#q')).toHaveValue('initial');
    await expect(host(page, 'bold')).toHaveAttribute('pressed', 'true');
  });

  test('the form attribute associates a button outside the form', async ({ page }) => {
    await mount(
      page,
      `<form id="orders"><input name="q" value="term" /></form>
      <line-button id="outside" form="orders" name="intent" value="save">Save</line-button>`,
    );
    await recordSubmissions(page);
    expect(
      await host(page, 'outside').evaluate((el: HTMLElement & { form: HTMLFormElement | null }) => el.form?.id),
    ).toBe('orders');
    await host(page, 'outside').click();
    expect((await submissions(page)).map((submission) => submission.entries)).toEqual([
      [
        ['q', 'term'],
        ['intent', 'save'],
      ],
    ]);
  });

  test('a disabled fieldset disables the button: no focus, no click, no submit', async ({ page }) => {
    await mount(
      page,
      `<form><fieldset id="set" disabled><line-button id="save" name="intent" value="save">Save</line-button></fieldset>
        <button id="after" type="button">after</button></form>`,
    );
    await recordSubmissions(page);
    const el = host(page, 'save');
    await expect(el).toHaveAttribute('data-disabled', '');
    await expect(el.getByRole('button')).toBeDisabled();
    await el.click({ force: true });
    await el.evaluate((button: HTMLElement) => button.click());
    expect(await submissions(page)).toEqual([]);

    await page.locator('#set').evaluate((fieldset: HTMLFieldSetElement) => {
      fieldset.disabled = false;
    });
    await expect(el).not.toHaveAttribute('data-disabled');
    await el.click();
    expect(await submissions(page)).toHaveLength(1);
  });

  test('preventDefault on click cancels submit and reset; stopPropagation cancels neither', async ({ page }) => {
    await mount(
      page,
      `<form><input id="q" name="q" value="initial" />
        <line-button id="save">Save</line-button>
        <line-button id="reset" type="reset">Reset</line-button></form>`,
    );
    await recordSubmissions(page);
    await page.locator('#q').fill('edited');
    await page.evaluate(() => {
      for (const id of ['#save', '#reset']) {
        document.querySelector(id)?.addEventListener('click', (event) => event.preventDefault(), { once: true });
      }
    });
    await host(page, 'save').click();
    await host(page, 'reset').click();
    expect(await submissions(page)).toEqual([]);
    await expect(page.locator('#q')).toHaveValue('edited');

    await page.evaluate(() => {
      for (const id of ['#save', '#reset']) {
        document.querySelector(id)?.addEventListener('click', (event) => event.stopPropagation(), { once: true });
      }
    });
    await host(page, 'save').click();
    expect(await submissions(page)).toHaveLength(1);
    await host(page, 'reset').click();
    await expect(page.locator('#q')).toHaveValue('initial');
  });

  test('no click reaches host or ancestor listeners while disabled or loading, and no form action follows', async ({
    page,
  }) => {
    await mount(
      page,
      `<form><line-button id="off" disabled>Off</line-button>
        <line-button id="busy" loading>Busy</line-button></form>`,
    );
    await recordSubmissions(page);
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

    expect(await submissions(page)).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { lineClicks: string[] }).lineClicks)).toEqual([]);
  });
});

test.describe('listeners added before the upgrade', () => {
  test('an inline onclick and an earlier listener never run while loading or disabled', async ({ page }) => {
    await page.goto(`${FIXTURE_URL}pre-upgrade.html`);
    await page.evaluate(() => customElements.whenDefined('line-button'));
    expect(
      await page.evaluate(
        () => (window as unknown as { lineDefinedBeforeListeners: boolean }).lineDefinedBeforeListeners,
      ),
    ).toBe(false);
    await expect(host(page, 'busy')).toHaveAttribute('data-loading', '');
    await expect(host(page, 'off')).toHaveAttribute('data-disabled', '');

    await host(page, 'busy').click();
    await host(page, 'busy').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await host(page, 'off').click({ force: true });
    for (const id of ['busy', 'off']) await host(page, id).evaluate((el: HTMLElement) => el.click());

    const seen = await page.evaluate(
      () =>
        new Promise<{ clicks: string[]; submits: number }>((resolve) => {
          const state = window as unknown as { lineClicks: string[]; lineSubmits: number };
          setTimeout(() => setTimeout(() => resolve({ clicks: state.lineClicks, submits: state.lineSubmits })));
        }),
    );
    expect(seen).toEqual({ clicks: [], submits: 0 });
  });

  test('the earlier listeners run once the button is interactive again', async ({ page }) => {
    await page.goto(`${FIXTURE_URL}pre-upgrade.html`);
    await page.evaluate(() => customElements.whenDefined('line-button'));
    await host(page, 'busy').evaluate((el: HTMLElement & { loading: boolean }) => {
      el.loading = false;
    });
    await expect(host(page, 'busy')).not.toHaveAttribute('data-loading');
    await host(page, 'busy').click();
    expect(await page.evaluate(() => (window as unknown as { lineClicks: string[] }).lineClicks)).toEqual([
      'inline:busy',
      'listener:busy',
    ]);
  });
});

test.describe('screen-reader pass (ariaSnapshot)', () => {
  test('one button node per host with the expected name and pressed state', async ({ page }) => {
    await mount(
      page,
      `<line-button id="plain">Save</line-button>
      <line-button id="toggle" type="button" pressed="true">Bold</line-button>
      <line-button id="busy" loading>Save<span slot="loading">Saving…</span></line-button>
      <line-button id="named" aria-label="Close dialog">×</line-button>`,
    );
    const main = page.locator('main');
    await expect(main.getByRole('button')).toHaveCount(4);
    await expect(host(page, 'plain').getByRole('button', { name: 'Save', exact: true })).toBeVisible();
    await expect(host(page, 'toggle').getByRole('button', { name: 'Bold', pressed: true })).toBeVisible();
    await expect(host(page, 'busy').getByRole('button', { name: 'Save Saving…' })).toBeVisible();
    await expect(host(page, 'named').getByRole('button', { name: 'Close dialog', exact: true })).toBeVisible();

    const snapshot = await main.ariaSnapshot();
    expect(snapshot).toContain('button "Save"');
    expect(snapshot).toContain('button "Bold" [pressed]');
    expect(snapshot).toContain('button "Save Saving…" [disabled]');
    expect(snapshot).toContain('button "Close dialog"');
    // Records, per engine, whether the named generic host appears around its button (spec A11y section).
    test.info().annotations.push({
      type: 'ariaSnapshot',
      description: `${test.info().project.name}: named generic host ${snapshot.includes('generic "Close dialog"') ? 'appears' : 'does not appear'}\n${snapshot}`,
    });
  });
});
