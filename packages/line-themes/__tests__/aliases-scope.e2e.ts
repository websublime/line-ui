/**
 * Alias scoping — browser tier (C15, spec §6.C.4 and §6.F.4, AM-049).
 *
 * Loads the built `line-colors` and `line-themes` CSS into a page and checks,
 * in each engine, that every named alias equals its mapped numeric step on the
 * same element: at the root and in nested `[data-accent]` / `[data-gray]`
 * scopes. A `var()` is substituted where its property is declared, so this
 * needs a real cascade; happy-dom does not resolve it reliably (AM-015).
 *
 * @module __tests__/aliases-scope.e2e
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ALIASES } from '@websublime/line-schemas';
import { expect, type Page, test } from 'playwright/test';

/** Alias → numeric step (spec §6.C.4). */
const STEP: Record<(typeof ALIASES)[number], number> = {
  surface: 2,
  bg: 3,
  'bg-hover': 4,
  'bg-active': 5,
  border: 7,
  solid: 9,
  'solid-hover': 10,
  'text-low': 11,
  text: 12,
};

const css = ['../../line-colors/dist/index.css', '../dist/index.css']
  .map((path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'))
  .join('\n');

type Role = 'accent' | 'gray';

interface Reading {
  alias: string;
  step: string;
}

/** Reads every `role` alias and its mapped step on the element with `id`. */
function read(page: Page, id: string, role: Role): Promise<Record<string, Reading>> {
  const pairs = ALIASES.map((alias) => [alias, STEP[alias]] as const);
  return page.evaluate(
    ([target, r, list]) => {
      const style = getComputedStyle(document.getElementById(target) as Element);
      return Object.fromEntries(
        list.map(([alias, step]) => [
          alias,
          {
            alias: style.getPropertyValue(`--line-${r}-${alias}`).trim(),
            step: style.getPropertyValue(`--line-${r}-${step}`).trim(),
          },
        ]),
      );
    },
    [id, role, pairs] as const,
  );
}

/** Asserts every alias equals its mapped step in `id`, and differs from the root value. */
async function expectScope(page: Page, id: string, role: Role): Promise<void> {
  const root = await read(page, 'root', role);
  const scope = await read(page, id, role);
  for (const alias of ALIASES) {
    const { alias: value, step } = scope[alias] as Reading;
    expect(value, `--line-${role}-${alias} in #${id}`).not.toBe('');
    expect(value, `--line-${role}-${alias} in #${id}`).toBe(step);
    expect(value, `--line-${role}-${alias} in #${id} vs root`).not.toBe(root[alias]?.alias);
  }
}

test.beforeEach(async ({ page }) => {
  await page.setContent(
    `<!doctype html>
<html id="root" data-accent="indigo" data-gray="slate">
  <head><style>${css}</style></head>
  <body>
    <section id="violet" data-accent="violet"></section>
    <section id="tomato" data-accent="tomato"></section>
    <section id="sand" data-gray="sand"></section>
  </body>
</html>`,
  );
});

test('every alias equals its mapped step at the root', async ({ page }) => {
  for (const role of ['accent', 'gray'] as const) {
    const root = await read(page, 'root', role);
    for (const alias of ALIASES) {
      const { alias: value, step } = root[alias] as Reading;
      expect(value, `--line-${role}-${alias}`).not.toBe('');
      expect(value, `--line-${role}-${alias}`).toBe(step);
    }
  }
});

test('accent aliases follow a nested data-accent', async ({ page }) => {
  await expectScope(page, 'violet', 'accent');
});

test('gray aliases follow the auto-pair of a nested data-accent', async ({ page }) => {
  await expectScope(page, 'tomato', 'gray');
});

test('gray aliases follow a nested data-gray', async ({ page }) => {
  await expectScope(page, 'sand', 'gray');
});
