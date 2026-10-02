/**
 * Direction mixin — browser tier (D4, spec §6.D.4, AM-031).
 *
 * Loads `/direction/` from the Vite dev server that `playwright.config.ts`
 * starts and checks real `:dir()` resolution in each engine. Every scenario
 * compares three readings of one host: the mixin's `direction`, the rendered
 * `::part(value)` text, and the `--line-test-dir` value that
 * `:host(:dir(rtl))` sets. It also checks the mixin never writes `dir` on the
 * host.
 *
 * @module __tests__/integration/direction/direction.e2e
 */

import { expect, type Page, test } from 'playwright/test';
import type { LineDirectionProbe } from './line-direction-probe.js';

interface ProbeReading {
  direction: string;
  rendered: string | null | undefined;
  css: string;
  dirAttr: string | null;
}

/** Sets `<html dir>` (or removes it for `null`) and replaces the body with `markup`. */
async function mount(page: Page, markup: string, htmlDir: string | null = null): Promise<void> {
  await page.evaluate(
    ([body, dir]) => {
      if (dir === null) {
        document.documentElement.removeAttribute('dir');
      } else {
        document.documentElement.setAttribute('dir', dir);
      }
      document.body.innerHTML = body;
    },
    [markup, htmlDir] as const,
  );
}

/** Reads the host's three direction signals once its pending update has rendered. */
function read(page: Page, id: string): Promise<ProbeReading> {
  return page.evaluate(async (hostId) => {
    const el = document.getElementById(hostId) as LineDirectionProbe;
    await el.updateComplete;
    return {
      direction: el.direction,
      rendered: el.shadowRoot?.querySelector('[part="value"]')?.textContent,
      css: getComputedStyle(el).getPropertyValue('--line-test-dir').trim(),
      dirAttr: el.getAttribute('dir'),
    };
  }, id);
}

/** Sets `dir` on the element with `id`. */
async function setDir(page: Page, id: string, dir: string): Promise<void> {
  await page.evaluate(([target, value]) => document.getElementById(target)?.setAttribute('dir', value), [
    id,
    dir,
  ] as const);
}

const rtl = { direction: 'rtl', rendered: 'rtl', css: 'rtl', dirAttr: null };
const ltr = { direction: 'ltr', rendered: 'ltr', css: 'ltr', dirAttr: null };

test.beforeEach(async ({ page }) => {
  await page.goto('/direction/');
  await expect.poll(() => page.evaluate(() => customElements.get('line-direction-probe') !== undefined)).toBe(true);
});

test('resolves rtl from <html dir="rtl"> and follows a flip of it', async ({ page }) => {
  await mount(page, '<line-direction-probe id="host"></line-direction-probe>', 'rtl');
  expect(await read(page, 'host')).toEqual(rtl);

  await page.evaluate(() => document.documentElement.setAttribute('dir', 'ltr'));
  await expect.poll(() => read(page, 'host')).toEqual(ltr);
});

test('resolves rtl from a nested ancestor inside an ltr document', async ({ page }) => {
  await mount(
    page,
    `<div dir="rtl"><line-direction-probe id="inner"></line-direction-probe></div>
     <line-direction-probe id="outer"></line-direction-probe>`,
    'ltr',
  );
  expect(await read(page, 'inner')).toEqual(rtl);
  expect(await read(page, 'outer')).toEqual(ltr);
});

test('a live flip of a nested ancestor updates direction and re-renders', async ({ page }) => {
  await mount(page, '<div id="region" dir="rtl"><line-direction-probe id="host"></line-direction-probe></div>');
  expect(await read(page, 'host')).toEqual(rtl);

  await setDir(page, 'region', 'ltr');
  await expect.poll(() => read(page, 'host')).toEqual(ltr);

  await setDir(page, 'region', 'rtl');
  await expect.poll(() => read(page, 'host')).toEqual(rtl);
});

test('an author dir on the host wins over its ancestors', async ({ page }) => {
  await mount(
    page,
    `<div dir="rtl"><line-direction-probe id="pinned-ltr" dir="ltr"></line-direction-probe></div>
     <div dir="ltr"><line-direction-probe id="pinned-rtl" dir="rtl"></line-direction-probe></div>`,
  );
  expect(await read(page, 'pinned-ltr')).toEqual({ ...ltr, dirAttr: 'ltr' });
  expect(await read(page, 'pinned-rtl')).toEqual({ ...rtl, dirAttr: 'rtl' });

  await setDir(page, 'pinned-ltr', 'rtl');
  await expect.poll(() => read(page, 'pinned-ltr')).toEqual({ ...rtl, dirAttr: 'rtl' });
});

test('dir="auto" with rtl text resolves rtl', async ({ page }) => {
  await mount(
    page,
    `<line-direction-probe id="auto-host" dir="auto">שלום</line-direction-probe>
     <div dir="auto">שלום <line-direction-probe id="auto-ancestor"></line-direction-probe></div>`,
  );
  expect(await read(page, 'auto-host')).toEqual({ ...rtl, dirAttr: 'auto' });
  expect(await read(page, 'auto-ancestor')).toEqual(rtl);
});
