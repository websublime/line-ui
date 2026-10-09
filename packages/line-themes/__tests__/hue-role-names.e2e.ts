/**
 * Hue and role names — browser tier (C16, spec §6.C.7 and §6.F.4, AM-052).
 *
 * Hue tokens (`--line-{hue}-{step}`) and role tokens (`--line-{role}-{step}`)
 * share one pattern, so a hue named like a role collides with it. This test,
 * driven by the `line-schemas` lists, checks in each engine that:
 *   (a) for every `GRAY_HUES` entry `g`, the gray role under `[data-gray=g]`
 *       equals the reference `--line-{g}-N`;
 *   (b) for every `HUES` entry `h`, the accent role under `[data-accent=h]`
 *       equals the reference `--line-{h}-N`, and for every `GRAY_HUES` entry
 *       used as accent without `data-gray`, the gray role self-pairs to that
 *       hue (PRD §9.5 auto-pair table, the `defaults.css` blocks);
 *   (c) at a themed root, every `--line-{h}-1` equals its reference.
 * Reference values come from a page that loads only `line-colors`. A `var()`
 * is substituted where its property is declared, so this needs a real cascade
 * (AM-015).
 *
 * @module __tests__/hue-role-names.e2e
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GRAY_HUES, HUES } from '@websublime/line-schemas';
import { expect, type Page, test } from 'playwright/test';

/** Role steps every role map declares (spec §6.C.4). */
const STEPS = [
  ...Array.from({ length: 12 }, (_, i) => `${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `a${i + 1}`),
  'contrast',
];

const [colorsCss, themesCss] = ['../../line-colors/dist/index.css', '../dist/index.css'].map((path) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'),
);

/** Reads `--line-{name}-{step}` for every step on the element with `id`. */
function read(page: Page, id: string, name: string): Promise<Record<string, string>> {
  return page.evaluate(
    ([target, n, steps]) => {
      const style = getComputedStyle(document.getElementById(target) as Element);
      return Object.fromEntries(steps.map((s) => [s, style.getPropertyValue(`--line-${n}-${s}`).trim()]));
    },
    [id, name, STEPS] as const,
  );
}

let reference: Record<string, Record<string, string>> = {};

test.beforeEach(async ({ page }) => {
  await page.setContent(`<!doctype html><html id="root"><head><style>${colorsCss}</style></head><body></body></html>`);
  reference = {};
  for (const hue of HUES) {
    const values = await read(page, 'root', hue);
    for (const step of STEPS) {
      expect(values[step], `reference --line-${hue}-${step}`).not.toBe('');
    }
    reference[hue] = values;
  }

  const scopes = [
    ...GRAY_HUES.map((g) => `<section id="gray-${g}" data-gray="${g}"></section>`),
    ...HUES.map((h) => `<section id="accent-${h}" data-accent="${h}"></section>`),
  ].join('\n');
  await page.setContent(
    `<!doctype html>
<html id="root" data-accent="indigo" data-gray="slate">
  <head><style>${colorsCss}\n${themesCss}</style></head>
  <body>
${scopes}
  </body>
</html>`,
  );
});

test('the gray role under data-gray equals each gray hue palette', async ({ page }) => {
  for (const g of GRAY_HUES) {
    const values = await read(page, `gray-${g}`, 'gray');
    for (const step of STEPS) {
      expect(values[step], `--line-gray-${step} under data-gray="${g}"`).not.toBe('');
      expect(values[step], `--line-gray-${step} under data-gray="${g}"`).toBe(reference[g]?.[step] as string);
    }
  }
});

test('the accent role under data-accent equals each hue palette', async ({ page }) => {
  for (const h of HUES) {
    const values = await read(page, `accent-${h}`, 'accent');
    for (const step of STEPS) {
      expect(values[step], `--line-accent-${step} under data-accent="${h}"`).not.toBe('');
      expect(values[step], `--line-accent-${step} under data-accent="${h}"`).toBe(reference[h]?.[step] as string);
    }
  }
});

test('a gray hue used as accent auto-pairs the gray role to itself', async ({ page }) => {
  for (const g of GRAY_HUES) {
    const values = await read(page, `accent-${g}`, 'gray');
    for (const step of STEPS) {
      expect(values[step], `--line-gray-${step} under data-accent="${g}"`).not.toBe('');
      expect(values[step], `--line-gray-${step} under data-accent="${g}"`).toBe(reference[g]?.[step] as string);
    }
  }
});

test('every hue keeps its own palette at a themed root', async ({ page }) => {
  for (const h of HUES) {
    const value = await page.evaluate(
      (hue) => getComputedStyle(document.documentElement).getPropertyValue(`--line-${hue}-1`).trim(),
      h,
    );
    expect(value, `--line-${h}-1 at the themed root`).not.toBe('');
    expect(value, `--line-${h}-1 at the themed root`).toBe(reference[h]?.['1'] as string);
  }
});
