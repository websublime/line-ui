/**
 * Shadow scale — browser tier (C17, spec §6.C.2 and §6.F.4, AM-054).
 *
 * Loads the built `line-colors`, `line-themes` and `line-tokens` CSS into a
 * page and checks, in each engine, that every shadow token paints. Each layer
 * takes the nearest gray role's colour at the base strength plus its Open Props
 * offset, in light and in a `color-scheme: dark` container. The knobs set on
 * `<html>` reach nested theming scopes. `light-dark()` and `var()` resolve in
 * the cascade, so this needs a real browser.
 *
 * @module __tests__/shadows.e2e
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from 'playwright/test';

/** Per-layer strength offsets in percentage points (spec §6.C.2 block). */
const OFFSETS: Record<string, readonly number[]> = {
  'shadow-1': [9],
  'shadow-2': [3, 5],
  'shadow-3': [2, 2, 4, 5, 7],
  'shadow-4': [2, 3, 3, 4, 5, 6],
  'shadow-5': [2, 3, 3, 4, 5, 7],
  'shadow-6': [2, 3, 3, 4, 5, 6, 7],
  'shadow-inner-1': [9],
  'shadow-inner-2': [9],
  'shadow-inner-3': [9],
};

const TOKENS = Object.keys(OFFSETS);

/** Default `--line-shadow-strength` and `--line-shadow-strength-dark`, in percent. */
const LIGHT = 1;
const DARK = 25;

const load = (path: string): string => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

const colors = load('../../line-colors/dist/index.css');
const themes = load('../../line-themes/dist/index.css');
const tokens = load('../dist/index.css');

/** An sRGB colour with channels and alpha in 0..1. */
type Rgba = [number, number, number, number];

const COLOR = /color\(srgb\s+([^)]+)\)|rgba?\(([^)]+)\)/g;

/** Parses every colour in a computed `box-shadow` or `color`, in order. */
function parseColors(value: string): Rgba[] {
  return [...value.matchAll(COLOR)].map(([, srgb, rgb]) => {
    const parts = (srgb ?? rgb ?? '').split(/[\s,/]+/).filter(Boolean);
    const channel = (part: string | undefined, scale: number): number =>
      part === undefined ? 1 : part.endsWith('%') ? Number.parseFloat(part) / 100 : Number.parseFloat(part) / scale;
    const scale = srgb ? 1 : 255;
    return [channel(parts[0], scale), channel(parts[1], scale), channel(parts[2], scale), channel(parts[3], 1)];
  });
}

/** Builds a page with `css` and one probe per shadow token in each scope. */
function page(css: string, attrs: string, style = ''): string {
  const probes = (step: number): string =>
    `${TOKENS.map((t) => `<i data-shadow="${t}" style="box-shadow: var(--line-${t})"></i>`).join('')}` +
    `<b style="color: color-mix(in srgb, var(--line-gray-${step}, var(--line-neutral-${step})) 100%, transparent)"></b>`;
  const scope = (id: string, extra: string): string =>
    `<section id="${id}" ${extra}>${probes(12)}<div class="dark" style="color-scheme: dark">${probes(1)}</div></section>`;
  return `<!doctype html>
<html ${attrs} style="color-scheme: light; ${style}">
  <head><style>${css}</style></head>
  <body>
    ${scope('root', '')}
    ${scope('sand', 'data-gray="sand"')}
    ${scope('crimson', 'data-accent="crimson"')}
  </body>
</html>`;
}

interface Reading {
  shadows: Record<string, string>;
  color: string;
}

/** Reads every shadow probe and the gray probe in `#id` (or its dark container). */
function read(p: Page, id: string, dark: boolean): Promise<Reading> {
  return p.evaluate(
    ([target, isDark]) => {
      const section = document.getElementById(target) as Element;
      const host = isDark ? (section.querySelector('.dark') as Element) : section;
      const own = (el: Element): boolean => (el.closest('.dark') !== null) === isDark;
      const shadows = Object.fromEntries(
        [...host.querySelectorAll('[data-shadow]')]
          .filter(own)
          .map((el) => [el.getAttribute('data-shadow'), getComputedStyle(el).boxShadow]),
      );
      const probe = [...host.querySelectorAll('b')].find(own) as Element;
      return { shadows, color: getComputedStyle(probe).color };
    },
    [id, dark] as const,
  );
}

const round = (n: number): number => Math.round(n * 100) / 100;

/** Asserts each layer of each token has `rgb` and alpha `strength + offset` percent. */
function expectScale(reading: Reading, rgb: Rgba, strength: number, where: string): void {
  for (const token of TOKENS) {
    const value = reading.shadows[token] ?? '';
    expect(value, `--line-${token} ${where}`).not.toBe('none');
    const layers = parseColors(value);
    const offsets = OFFSETS[token] as readonly number[];
    expect(layers.length, `--line-${token} ${where} layers`).toBe(offsets.length);
    layers.forEach((layer, i) => {
      const label = `--line-${token} ${where} layer ${i + 1}`;
      expect(layer.slice(0, 3).map(round), `${label} colour`).toEqual(rgb.slice(0, 3).map(round));
      expect(round(layer[3]), `${label} alpha`).toBe(round((strength + (offsets[i] as number)) / 100));
    });
  }
}

/** Asserts the scale in `#id` matches its gray probe, in light and dark. */
async function expectScope(p: Page, id: string, light = LIGHT, dark = DARK): Promise<void> {
  for (const [isDark, strength] of [
    [false, light],
    [true, dark],
  ] as const) {
    const reading = await read(p, id, isDark);
    const [probe] = parseColors(reading.color);
    expect(probe, `gray probe in #${id}`).toBeDefined();
    expect(round((probe as Rgba)[3]), `gray probe in #${id} is opaque`).toBe(1);
    expectScale(reading, probe as Rgba, strength, `in #${id}${isDark ? ' (dark)' : ''}`);
  }
}

test.describe('with line-colors and line-themes', () => {
  test.beforeEach(async ({ page: p }) => {
    await p.setContent(page(`${colors}\n${themes}\n${tokens}`, 'data-gray="slate"'));
    // Precondition. Each nested scope resolves a gray other than the root's in light mode.
    const root = (await read(p, 'root', false)).color;
    for (const id of ['sand', 'crimson']) {
      expect((await read(p, id, false)).color, `gray probe in #${id} vs root`).not.toBe(root);
    }
  });

  test('the scale follows the gray role at the root', async ({ page: p }) => {
    await expectScope(p, 'root');
  });

  test('the scale follows a nested data-gray', async ({ page: p }) => {
    await expectScope(p, 'sand');
  });

  test('the scale follows the auto-pair of a nested data-accent', async ({ page: p }) => {
    await expectScope(p, 'crimson');
  });
});

test('without line-themes the scale uses the neutral hue', async ({ page: p }) => {
  await p.setContent(page(`${colors}\n${tokens}`, ''));
  await expectScope(p, 'root');
});

test('knob overrides on <html> reach nested theming scopes', async ({ page: p }) => {
  const knobs = '--line-shadow-color: rgb(255 0 0); --line-shadow-strength: 10%; --line-shadow-strength-dark: 40%;';
  await p.setContent(page(`${colors}\n${themes}\n${tokens}`, 'data-gray="slate"', knobs));
  for (const id of ['root', 'sand', 'crimson']) {
    expectScale(await read(p, id, false), [1, 0, 0, 1], 10, `in #${id}`);
    expectScale(await read(p, id, true), [1, 0, 0, 1], 40, `in #${id} (dark)`);
  }
});
