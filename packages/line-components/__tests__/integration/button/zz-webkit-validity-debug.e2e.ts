// Throwaway diagnostic for the Linux WebKit timeout of "custom-validity blocks the submit until it empties".
// Lives only on a scratch branch; every test fails on purpose so the CI log prints the collected trace.
import { expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/button/';

async function race<T>(work: Promise<T>, ms = 5000): Promise<T | string> {
  return Promise.race([work, new Promise<string>((resolve) => setTimeout(() => resolve(`TIMEOUT ${ms}ms`), ms))]);
}

function ping(page: Page): Promise<unknown> {
  return race(
    page.evaluate(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            const path: string[] = [];
            let active: Element | null = document.activeElement;
            while (active) {
              path.push(active.id || active.localName);
              active = active.shadowRoot?.activeElement ?? null;
            }
            const face = document.querySelector('#save, #plain') as (HTMLElement & { validity?: ValidityState }) | null;
            resolve({
              active: path.join('>'),
              valid: face?.validity?.valid,
              submits: (window as unknown as { submits: number }).submits,
            });
          });
        }),
    ),
  );
}

async function setup(page: Page, log: unknown[], markup: string): Promise<void> {
  page.on('console', (message) => log.push(`console.${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => log.push(`pageerror: ${error.message}`));
  await page.goto(FIXTURE_URL);
  await page.evaluate(() => customElements.whenDefined('line-button'));
  await page.evaluate((html) => {
    (window as unknown as { submits: number }).submits = 0;
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    main.querySelector('form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      (window as unknown as { submits: number }).submits += 1;
    });
  }, markup);
  await page.waitForTimeout(200);
}

async function step(log: unknown[], label: string, work: () => Promise<unknown>): Promise<void> {
  const started = Date.now();
  try {
    const result = await race(work());
    log.push(`${label} -> ${JSON.stringify(result)} (${Date.now() - started}ms)`);
  } catch (error) {
    log.push(`${label} -> THREW ${(error as Error).message.split('\n')[0]} (${Date.now() - started}ms)`);
  }
}

test('P1 line-button custom-validity, same flow as the failing test', async ({ page, browserName }) => {
  test.setTimeout(90_000);
  const log: unknown[] = [browserName, process.platform];
  await setup(page, log, '<form><line-button id="save" custom-validity="Pick a plan">Save</line-button></form>');
  const el = page.locator('#save');
  await step(log, 'ping0', () => ping(page));
  await step(log, 'click1', () => el.click({ timeout: 5000 }));
  await step(log, 'ping1', () => ping(page));
  await step(log, 'clear', () =>
    el.evaluate((button: HTMLElement & { customValidity: string }) => {
      button.customValidity = '';
    }),
  );
  await step(log, 'ping2', () => ping(page));
  await step(log, 'click2', () => el.click({ timeout: 5000 }));
  await step(log, 'ping3', () => ping(page));
  expect(log, 'diagnostic dump').toEqual(['dump']);
});

for (const anchor of [true, false]) {
  test(`P2 plain FACE, setValidity ${anchor ? 'with' : 'without'} a shadow anchor`, async ({ page, browserName }) => {
    test.setTimeout(90_000);
    const log: unknown[] = [browserName, process.platform];
    await setup(page, log, '<form><x-face id="plain"></x-face><button id="native" type="submit">Go</button></form>');
    await step(log, 'define', () =>
      page.evaluate((withAnchor) => {
        class XFace extends HTMLElement {
          static formAssociated = true;
          internals = this.attachInternals();
          constructor() {
            super();
            const root = this.attachShadow({ mode: 'open', delegatesFocus: true });
            const inner = document.createElement('button');
            inner.textContent = 'inner';
            root.append(inner);
          }
          invalidate(): void {
            const inner = this.shadowRoot?.querySelector('button') ?? undefined;
            this.internals.setValidity({ customError: true }, 'Pick a plan', withAnchor ? inner : undefined);
          }
        }
        customElements.define('x-face', XFace);
        (document.querySelector('#plain') as HTMLElement & { invalidate(): void }).invalidate();
        return 'ok';
      }, anchor),
    );
    await step(log, 'ping0', () => ping(page));
    await step(log, 'submit1', () => page.locator('#native').click({ timeout: 5000 }));
    await step(log, 'ping1', () => ping(page));
    await step(log, 'submit2', () => page.locator('#native').click({ timeout: 5000 }));
    await step(log, 'ping2', () => ping(page));
    expect(log, 'diagnostic dump').toEqual(['dump']);
  });
}
