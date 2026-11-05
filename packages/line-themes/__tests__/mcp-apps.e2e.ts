/**
 * MCP Apps host bridge — browser tier (G6, spec §6.G.6).
 *
 * Loads the built `line-tokens`, `line-colors` and `line-themes` CSS, then the
 * bridge, all resolved by package name, in the documented order (§10 SD85).
 * Host values are set as inline custom properties on `<html>`, the way ext-apps
 * `applyHostStyleVariables` sets them. Each engine must show the host value on
 * every form A alias at the root, line steps in nested `data-accent` /
 * `data-gray` scopes, the host value on every form P primitive from `body`
 * down with the line token kept at the root and without a host value (R5 P6),
 * and the composed focus ring following the host ring colour (AM-004).
 *
 * @module __tests__/mcp-apps.e2e
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from 'playwright/test';

/** Form A: host key → [line alias, the `aliases.css` step it falls back to]. */
const FORM_A: Record<string, readonly [string, string]> = {
  '--color-background-primary': ['--line-gray-surface', '--line-gray-2'],
  '--color-background-secondary': ['--line-gray-bg', '--line-gray-3'],
  '--color-background-tertiary': ['--line-gray-bg-hover', '--line-gray-4'],
  '--color-background-info': ['--line-info-bg', '--line-info-3'],
  '--color-background-danger': ['--line-danger-bg', '--line-danger-3'],
  '--color-background-success': ['--line-success-bg', '--line-success-3'],
  '--color-background-warning': ['--line-warning-bg', '--line-warning-3'],
  '--color-text-primary': ['--line-gray-text', '--line-gray-12'],
  '--color-text-secondary': ['--line-gray-text-low', '--line-gray-11'],
  '--color-text-info': ['--line-info-text-low', '--line-info-11'],
  '--color-text-danger': ['--line-danger-text-low', '--line-danger-11'],
  '--color-text-success': ['--line-success-text-low', '--line-success-11'],
  '--color-text-warning': ['--line-warning-text-low', '--line-warning-11'],
  '--color-border-primary': ['--line-gray-border', '--line-gray-7'],
  '--color-border-info': ['--line-info-border', '--line-info-7'],
  '--color-border-danger': ['--line-danger-border', '--line-danger-7'],
  '--color-border-success': ['--line-success-border', '--line-success-7'],
  '--color-border-warning': ['--line-warning-border', '--line-warning-7'],
};

/** Form P: host key → line primitive. */
const FORM_P: Record<string, string> = {
  '--color-ring-primary': '--line-focus-ring-color',
  '--font-sans': '--line-font-sans',
  '--font-mono': '--line-font-mono',
  '--font-weight-normal': '--line-font-weight-4',
  '--font-weight-medium': '--line-font-weight-5',
  '--font-weight-semibold': '--line-font-weight-6',
  '--font-weight-bold': '--line-font-weight-7',
  '--font-text-xs-size': '--line-font-size-0',
  '--font-text-md-size': '--line-font-size-1',
  '--font-text-lg-size': '--line-font-size-2',
  '--font-heading-lg-size': '--line-font-size-3',
  '--font-heading-xl-size': '--line-font-size-4',
  '--font-heading-2xl-size': '--line-font-size-5',
  '--font-heading-3xl-size': '--line-font-size-6',
  '--font-text-xs-line-height': '--line-leading-3',
  '--font-text-md-line-height': '--line-leading-4',
  '--font-heading-xl-line-height': '--line-leading-2',
  '--font-heading-3xl-line-height': '--line-leading-1',
  '--border-radius-xs': '--line-radius-1',
  '--border-radius-sm': '--line-radius-2',
  '--border-radius-xl': '--line-radius-3',
  '--border-radius-full': '--line-radius-round',
};

/** A host value per key, each distinct from every line value. */
const HOST: Record<string, string> = {
  ...Object.fromEntries(Object.keys(FORM_A).map((key, i) => [key, `rgb(${i + 1}, 2, 3)`])),
  '--color-ring-primary': 'rgb(200, 1, 2)',
  '--font-sans': 'HostSans',
  '--font-mono': 'HostMono',
  '--font-weight-normal': '410',
  '--font-weight-medium': '510',
  '--font-weight-semibold': '610',
  '--font-weight-bold': '710',
  '--font-text-xs-size': '11px',
  '--font-text-md-size': '15px',
  '--font-text-lg-size': '17px',
  '--font-heading-lg-size': '19px',
  '--font-heading-xl-size': '23px',
  '--font-heading-2xl-size': '29px',
  '--font-heading-3xl-size': '35px',
  '--font-text-xs-line-height': '1.41',
  '--font-text-md-line-height': '1.51',
  '--font-heading-xl-line-height': '1.26',
  '--font-heading-3xl-line-height': '1.11',
  '--border-radius-xs': '3px',
  '--border-radius-sm': '7px',
  '--border-radius-xl': '13px',
  '--border-radius-full': '9999px',
};

const LINE_CSS = ['@websublime/line-tokens', '@websublime/line-colors', '@websublime/line-themes'];
const BRIDGE = '@websublime/line-themes/hosts/mcp-apps.css';

/** Sets the page; `host` values go inline on <html>, as `applyHostStyleVariables` does. */
async function open(page: Page, bridge: boolean, host: Record<string, string>): Promise<void> {
  const css = (bridge ? [...LINE_CSS, BRIDGE] : LINE_CSS)
    .map((name) => readFileSync(fileURLToPath(import.meta.resolve(name)), 'utf8'))
    .join('\n');
  const style = Object.entries(host)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
  await page.setContent(
    `<!doctype html>
<html id="root" data-accent="indigo" data-gray="slate" style="${style}">
  <head><style>${css}</style></head>
  <body id="body">
    <section id="violet" data-accent="violet"></section>
    <section id="sand" data-gray="sand"></section>
    <button id="ring" style="outline: var(--line-focus-ring)"></button>
  </body>
</html>`,
  );
}

/** Reads the computed custom properties `names` on the element with `id`. */
function read(page: Page, id: string, names: readonly string[]): Promise<Record<string, string>> {
  return page.evaluate(
    ([target, list]) => {
      const style = getComputedStyle(document.getElementById(target) as Element);
      return Object.fromEntries(list.map((name) => [name, style.getPropertyValue(name).trim()]));
    },
    [id, names] as const,
  );
}

const ALIASES = Object.values(FORM_A).map(([alias]) => alias);
const STEPS = Object.values(FORM_A).map(([, step]) => step);
const PRIMITIVES = Object.values(FORM_P);

test('(a) every form A alias carries the host value at the root', async ({ page }) => {
  await open(page, true, HOST);
  const root = await read(page, 'root', ALIASES);
  expect(ALIASES).toHaveLength(18);
  for (const [key, [alias]] of Object.entries(FORM_A)) {
    expect(root[alias], `${alias} ← ${key}`).toBe(HOST[key]);
  }
});

test('(a) without a host value every form A alias keeps its line step', async ({ page }) => {
  await open(page, true, {});
  const root = await read(page, 'root', [...ALIASES, ...STEPS]);
  for (const [alias, step] of Object.values(FORM_A)) {
    expect(root[alias], alias).not.toBe('');
    expect(root[alias], alias).toBe(root[step]);
  }
});

test('(b) nested data-accent and data-gray scopes keep the line steps', async ({ page }) => {
  await open(page, true, HOST);
  for (const id of ['violet', 'sand']) {
    const scope = await read(page, id, [...ALIASES, ...STEPS]);
    for (const [key, [alias, step]] of Object.entries(FORM_A)) {
      expect(scope[alias], `${alias} in #${id}`).not.toBe('');
      expect(scope[alias], `${alias} in #${id}`).toBe(scope[step]);
      expect(scope[alias], `${alias} in #${id} vs host`).not.toBe(HOST[key]);
    }
  }
});

test('(c) every form P primitive carries the host value under body', async ({ page }) => {
  await open(page, false, {});
  const line = await read(page, 'root', PRIMITIVES);
  await open(page, true, HOST);
  const root = await read(page, 'root', PRIMITIVES);
  expect(PRIMITIVES).toHaveLength(22);
  for (const id of ['body', 'violet', 'sand']) {
    const scope = await read(page, id, PRIMITIVES);
    for (const [key, primitive] of Object.entries(FORM_P)) {
      expect(scope[primitive], `${primitive} ← ${key} in #${id}`).toBe(HOST[key]);
    }
  }
  for (const primitive of PRIMITIVES) {
    expect(root[primitive], `${primitive} at the root`).not.toBe('');
    expect(root[primitive], `${primitive} at the root`).toBe(line[primitive]);
  }
});

test('(c) without a host value every form P primitive keeps the line token', async ({ page }) => {
  await open(page, false, {});
  const line = await read(page, 'root', PRIMITIVES);
  await open(page, true, {});
  for (const id of ['root', 'body', 'violet']) {
    const scope = await read(page, id, PRIMITIVES);
    for (const primitive of PRIMITIVES) {
      expect(line[primitive], primitive).not.toBe('');
      expect(scope[primitive], `${primitive} in #${id}`).toBe(line[primitive]);
    }
  }
});

test('(d) --line-focus-ring under body carries the host ring colour', async ({ page }) => {
  await open(page, true, HOST);
  const [ring, host] = await page.evaluate((colour) => {
    const probe = document.createElement('i');
    probe.style.color = colour;
    document.body.append(probe);
    const outline = getComputedStyle(document.getElementById('ring') as Element);
    return [
      { color: outline.outlineColor, style: outline.outlineStyle, width: outline.outlineWidth },
      getComputedStyle(probe).color,
    ];
  }, HOST['--color-ring-primary'] as string);
  expect(ring.color).toBe(host);
  expect(ring.style).toBe('solid');
  expect(ring.width).toBe('2px');
});
