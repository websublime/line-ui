/**
 * FormAssociated mixin — browser tier (D5, spec §6.D.5, AM-032).
 *
 * Loads `/form-associated/` from the Vite dev server that `playwright.config.ts`
 * starts and drives a `<line-form-test>` inside a real `<form>` in each engine:
 * the value reaches `FormData`, the `formdata` event, and the submitted request;
 * `form.reset()` reaches `formResetCallback`; `setValidity` drives
 * `checkValidity` / `reportValidity`, `:invalid` / `:valid`, and whether the
 * form submits.
 *
 * @module __tests__/integration/form-associated/form-associated.e2e
 */

import { expect, type Page, test } from 'playwright/test';
import type { LineFormTest } from './line-form-test.js';

declare global {
  interface Window {
    /** `email` as each submission event saw it. */
    submissionEvents?: Record<string, FormDataEntryValue | null>;
    /** `submit` events the form fired and `invalid` events the field fired. */
    eventCounts?: { submit: number; invalid: number };
  }
}

const DEFAULT = 'default@line.dev';

/**
 * Replaces the body with a GET form that submits into a hidden iframe, so a
 * real submission leaves the page under test in place.
 */
async function mount(page: Page, attributes = ''): Promise<void> {
  await page.evaluate(
    async ([value, extra]) => {
      document.body.innerHTML = `
        <iframe name="sink" hidden></iframe>
        <form action="/form-associated/submitted" method="get" target="sink">
          <line-form-test name="email" value="${value}" ${extra}></line-form-test>
          <button id="submit">Submit</button>
        </form>`;
      await document.querySelector('line-form-test')?.updateComplete;
    },
    [DEFAULT, attributes] as const,
  );
}

/** Sets the field's current value and waits for the update that submits it. */
async function setValue(page: Page, value: string): Promise<void> {
  await page.evaluate(async (next) => {
    const field: LineFormTest | null = document.querySelector('line-form-test');
    if (!field) throw new Error('fixture not mounted');
    field.value = next;
    await field.updateComplete;
  }, value);
}

/** Reads the field's validity through the mixin, CSS, and its form. */
function readValidity(page: Page) {
  return page.evaluate(() => {
    const form = document.querySelector('form');
    const field = document.querySelector('line-form-test');
    if (!(form && field)) throw new Error('fixture not mounted');
    return {
      check: field.checkValidity(),
      report: field.reportValidity(),
      invalid: field.matches(':invalid'),
      valid: field.matches(':valid'),
      valueMissing: field.validity.valueMissing,
      message: field.validationMessage,
      formCheck: form.checkValidity(),
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/form-associated/');
  await expect.poll(() => page.evaluate(() => customElements.get('line-form-test') !== undefined)).toBe(true);
});

test('associates with its form and contributes its value to FormData', async ({ page }) => {
  await mount(page);
  const read = () =>
    page.evaluate(() => {
      const form = document.querySelector('form');
      const field = document.querySelector('line-form-test');
      if (!(form && field)) throw new Error('fixture not mounted');
      let fromEvent: FormDataEntryValue | null = null;
      form.addEventListener('formdata', (event) => {
        fromEvent = event.formData.get('email');
      });
      return { formData: new FormData(form).get('email'), fromEvent, sameForm: field.form === form };
    });

  expect(await read()).toEqual({ formData: DEFAULT, fromEvent: DEFAULT, sameForm: true });

  await setValue(page, 'ana@line.dev');
  expect(await read()).toEqual({ formData: 'ana@line.dev', fromEvent: 'ana@line.dev', sameForm: true });
});

test('a real submission carries the value in the submit event, the formdata event, and the request', async ({
  page,
}) => {
  await mount(page);
  await setValue(page, 'ana@line.dev');
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) throw new Error('fixture not mounted');
    const events: Record<string, FormDataEntryValue | null> = {};
    window.submissionEvents = events;
    form.addEventListener('submit', (event) => {
      events.submit = new FormData(form, event.submitter).get('email');
    });
    form.addEventListener('formdata', (event) => {
      events.formdata = event.formData.get('email');
    });
  });

  const request = page.waitForRequest((candidate) => candidate.url().includes('/form-associated/submitted'));
  await page.click('#submit');
  const submitted = new URL((await request).url());

  expect(submitted.searchParams.get('email')).toBe('ana@line.dev');
  expect(await page.evaluate(() => window.submissionEvents)).toEqual({
    submit: 'ana@line.dev',
    formdata: 'ana@line.dev',
  });
});

test('form.reset() calls formResetCallback and restores the default value', async ({ page }) => {
  await mount(page);
  await setValue(page, 'ana@line.dev');

  const afterReset = await page.evaluate(async () => {
    const form = document.querySelector('form');
    const field = document.querySelector('line-form-test');
    if (!(form && field)) throw new Error('fixture not mounted');
    form.reset();
    await field.updateComplete;
    return { resets: field.resets, value: field.value, formData: new FormData(form).get('email') };
  });
  expect(afterReset).toEqual({ resets: 1, value: null, formData: DEFAULT });
});

test('validity drives checkValidity, reportValidity, :invalid / :valid, and form submission', async ({ page }) => {
  await mount(page, 'required');
  await page.evaluate(() => {
    const form = document.querySelector('form');
    const field = document.querySelector('line-form-test');
    if (!(form && field)) throw new Error('fixture not mounted');
    const counts = { submit: 0, invalid: 0 };
    window.eventCounts = counts;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      counts.submit += 1;
    });
    field.addEventListener('invalid', () => {
      counts.invalid += 1;
    });
  });
  const counts = () => page.evaluate(() => window.eventCounts);
  const requestSubmit = () => page.evaluate(() => document.querySelector('form')?.requestSubmit());

  await setValue(page, '');
  expect(await readValidity(page)).toEqual({
    check: false,
    report: false,
    invalid: true,
    valid: false,
    valueMissing: true,
    message: 'Fill in this field.',
    formCheck: false,
  });
  await requestSubmit();
  // checkValidity, reportValidity, form.checkValidity, and the blocked submission each fire `invalid`.
  expect(await counts()).toEqual({ submit: 0, invalid: 4 });

  await setValue(page, 'ana@line.dev');
  expect(await readValidity(page)).toEqual({
    check: true,
    report: true,
    invalid: false,
    valid: true,
    valueMissing: false,
    message: '',
    formCheck: true,
  });
  await requestSubmit();
  expect(await counts()).toEqual({ submit: 1, invalid: 4 });
});
