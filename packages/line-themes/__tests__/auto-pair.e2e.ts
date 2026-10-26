/**
 * Auto pairs — browser tier (C9, Phase 00 spec §6.C.7, AM-077; Phase 1 spec §6.Z.3).
 *
 * Loads the built `line-colors` and `line-themes` CSS, resolved by package
 * name, and checks every auto pair of PRD §9.5 against the cascade in each
 * engine:
 *   (a) with no `data-accent` and no `data-gray`, the accent role is indigo and
 *       the gray role is slate;
 *   (b) `data-accent` alone on `<html>` pairs the gray role to the §9.5 gray;
 *   (c) an explicit `data-gray` wins over the auto pair;
 *   (d) a nested scope with only `data-accent` takes its own auto pair under a
 *       parent whose gray differs from that pair.
 *
 * Each check compares the 12 steps, the 12 alpha steps and the contrast token
 * of a role with the expected hue's tokens, both computed on the same element.
 * WebKit serializes `light-dark(color(display-p3 …))` where Chromium and
 * Firefox give hex, so the test never compares literal strings. No scope
 * inherits the gray it expects, so a deleted auto-pair block fails the check.
 *
 * @module __tests__/auto-pair.e2e
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ACCENT_HUES, type AccentHue, GRAY_HUES, type GrayHue, STEPS } from '@websublime/line-schemas';
import { expect, type Page, test } from 'playwright/test';

/** The PRD §9.5 auto-pair table, the oracle of this test. */
const AUTO_PAIR: Record<AccentHue, GrayHue> = {
  neutral: 'neutral',
  mauve: 'mauve',
  slate: 'slate',
  sage: 'sage',
  olive: 'olive',
  sand: 'sand',
  tomato: 'mauve',
  red: 'mauve',
  ruby: 'mauve',
  crimson: 'mauve',
  pink: 'mauve',
  plum: 'mauve',
  purple: 'mauve',
  violet: 'slate',
  iris: 'slate',
  indigo: 'slate',
  blue: 'slate',
  sky: 'slate',
  cyan: 'slate',
  teal: 'sage',
  jade: 'sage',
  mint: 'sage',
  green: 'sage',
  grass: 'olive',
  lime: 'olive',
  bronze: 'sand',
  gold: 'sand',
  brown: 'sand',
  amber: 'sand',
  yellow: 'sand',
  orange: 'sand',
};

/** Role steps every role map declares (spec §6.C.4). */
const TOKENS = [...STEPS.map((step) => `${step}`), ...STEPS.map((step) => `a${step}`), 'contrast'];

const css = ['@websublime/line-colors', '@websublime/line-themes']
  .map((name) => readFileSync(fileURLToPath(import.meta.resolve(name)), 'utf8'))
  .join('\n');

/** A gray other than `gray`, so a scope under it cannot inherit `gray`. */
function otherGray(gray: GrayHue): GrayHue {
  return GRAY_HUES[(GRAY_HUES.indexOf(gray) + 1) % GRAY_HUES.length] as GrayHue;
}

/** Sets or removes `data-accent` and `data-gray` on `<html>`. */
function setRoot(page: Page, accent: string | null, gray: string | null): Promise<void> {
  return page.evaluate(
    ([a, g]) => {
      const root = document.documentElement;
      for (const [name, value] of [
        ['data-accent', a],
        ['data-gray', g],
      ] as const) {
        if (value === null) root.removeAttribute(name);
        else root.setAttribute(name, value);
      }
    },
    [accent, gray] as const,
  );
}

/**
 * Expects every `--line-<role>-<token>` on the element that `selector` matches
 * to equal `--line-<hue>-<token>` on the same element, both non-empty.
 */
async function expectRole(page: Page, selector: string, role: 'accent' | 'gray', hue: string): Promise<void> {
  const pairs = await page.evaluate(
    ([target, r, h, tokens]) => {
      const style = getComputedStyle(document.querySelector(target) as Element);
      return tokens.map((token) => [
        token,
        style.getPropertyValue(`--line-${r}-${token}`).trim(),
        style.getPropertyValue(`--line-${h}-${token}`).trim(),
      ]);
    },
    [selector, role, hue, TOKENS] as const,
  );
  for (const [token, actual, expected] of pairs) {
    const label = `--line-${role}-${token} on ${selector} against --line-${hue}-${token}`;
    expect(expected, label).not.toBe('');
    expect(actual, label).not.toBe('');
    expect(actual, label).toBe(expected);
  }
}

test.beforeEach(async ({ page }) => {
  const nested = ACCENT_HUES.map(
    (hue) =>
      `<section data-gray="${otherGray(AUTO_PAIR[hue])}"><div id="nested-${hue}" data-accent="${hue}"></div></section>`,
  ).join('\n');
  await page.setContent(`<!doctype html>
<html>
  <head><style>${css}</style></head>
  <body>
${nested}
  </body>
</html>`);
});

test('the oracle lists every ACCENT_HUES entry', () => {
  expect(Object.keys(AUTO_PAIR).sort()).toEqual([...ACCENT_HUES].sort());
});

test('(a) the default root maps the accent role to indigo and the gray role to slate', async ({ page }) => {
  await expectRole(page, 'html', 'accent', 'indigo');
  await expectRole(page, 'html', 'gray', 'slate');
});

test('(b) data-accent alone on <html> pairs the gray role to the PRD §9.5 gray', async ({ page }) => {
  for (const hue of ACCENT_HUES) {
    await setRoot(page, hue, null);
    await expectRole(page, 'html', 'gray', AUTO_PAIR[hue]);
  }
});

test('(c) an explicit data-gray wins over the auto pair', async ({ page }) => {
  for (const hue of ACCENT_HUES) {
    for (const gray of GRAY_HUES.filter((g) => g !== AUTO_PAIR[hue])) {
      await setRoot(page, hue, gray);
      await expectRole(page, 'html', 'gray', gray);
    }
  }
});

test('(d) a nested data-accent scope takes its own auto pair under a parent with another gray', async ({ page }) => {
  for (const hue of ACCENT_HUES) {
    await expectRole(page, `#nested-${hue}`, 'gray', AUTO_PAIR[hue]);
  }
});
