/**
 * CDN delivery check (Phase 1 spec §6.P.6, §7.7; §10 SD25, SD32; §12 AM-050, AM-105, AM-106; R9 §2.3).
 *
 * Runs only under `LINE_E2E_CDN` (the `playwright.config.ts` gate), from `.github/workflows/cdn-check.yml`, and
 * loads published versions from the live CDNs; nothing on a CDN is mocked. Two no-build pages, served from
 * `127.0.0.1`, load `@websublime/line-components` and `@websublime/line-core`:
 *
 *   - jsDelivr `+esm`, no import map: Chromium, Firefox and WebKit.
 *   - unpkg raw `dist/` files with the import map below and the `process` shim: Chromium and WebKit; R9 saw cold
 *     CORS errors on this path in Firefox, so it does not run there (§12 AM-105).
 *
 * On each page: `<line-button>` and `<line-icon>` upgrade and render; a stub `LineIconRegistry` set through
 * `setIconRegistry` from the root entry reaches a `<line-icon>` loaded from the icon entry, including one that
 * connected before the registry was set; and `FormAssociated(LineElement)`, from the `line-core` mixin entry and
 * the `line-core` root, keeps its form API through `ElementInternals`. Every `@websublime/*` request names one
 * exact version and the page logs no error.
 *
 * Versions (§12 AM-105, AM-106): `line-components` is `LINE_CDN_COMPONENTS_VERSION`, else the npm `canary`
 * dist-tag; `line-core` is the one exact version the jsDelivr bundles of that `line-components` version import.
 * The resolved versions and the final import map are logged and attached to each test as annotations.
 *
 * @module __tests__/cdn.e2e
 */

import { expect, type Page, test } from 'playwright/test';
import {
  type CdnVersions,
  COMPONENTS,
  CORE,
  type ImportMapRow,
  JSDELIVR,
  type PageServer,
  type ResolvedImportMap,
  resolveImportMap,
  resolveVersions,
  servePages,
  UNPKG,
  WEBSUBLIME_URL,
} from './cdn/support.js';

/** The `line-components` entries the pages load; `.` is the root, which exports `setIconRegistry`. */
const SUBPATHS = ['.', 'button', 'icon'] as const;

/**
 * The unpkg import map (§7.7 bullet 2): the R9 §2.3 `line-core` baseline of 14 entries, plus the entries
 * `line-components` needs. Versions are not written here; each row is pinned to the exact version the registry
 * manifests resolve to (`resolveImportMap`), and the run logs the final map. With `<core>` the `line-core`
 * version, the map reads:
 *
 *   "@websublime/line-core":                         unpkg.com/@websublime/line-core@<core>/dist/index.js
 *   "@websublime/line-core/machine":                 …/dist/machine/index.js
 *   "@websublime/line-core/styles":                  …/dist/styles/index.js
 *   "@websublime/line-core/mixins/<name>":           …/dist/mixins/<name>.js, one entry per mixin
 *   "lit", "lit/":                                   unpkg.com/lit@<v>/index.js, unpkg.com/lit@<v>/
 *   "lit-element/":                                  unpkg.com/lit-element@<v>/
 *   "lit-html", "lit-html/":                         unpkg.com/lit-html@<v>/lit-html.js, …/
 *   "@lit/reactive-element", "@lit/reactive-element/": unpkg.com/@lit/reactive-element@<v>/reactive-element.js, …/
 *   "@zag-js/<name>":                                unpkg.com/@zag-js/<name>@<v>/dist/index.mjs
 *   "proxy-compare":                                 unpkg.com/proxy-compare@<v>/dist/index.js
 *
 * `line-core` takes one entry per export, not a `@websublime/line-core/` prefix: its `exports` map `./machine` to
 * `dist/machine/index.js` and `./mixins/*` to `dist/mixins/*.js`, which no prefix entry reproduces.
 */
const IMPORT_MAP: readonly ImportMapRow[] = [
  // line-core: the self-reference that `mixins/*.js` re-export through, and the subpaths `line-components` imports.
  { specifier: '@websublime/line-core', package: CORE, path: 'dist/index.js' },
  { specifier: '@websublime/line-core/machine', package: CORE, path: 'dist/machine/index.js' },
  { specifier: '@websublime/line-core/styles', package: CORE, path: 'dist/styles/index.js' },
  { specifier: '@websublime/line-core/mixins/direction', package: CORE, path: 'dist/mixins/direction.js' },
  { specifier: '@websublime/line-core/mixins/form-associated', package: CORE, path: 'dist/mixins/form-associated.js' },
  { specifier: '@websublime/line-core/mixins/inspector', package: CORE, path: 'dist/mixins/inspector.js' },
  { specifier: '@websublime/line-core/mixins/metadata', package: CORE, path: 'dist/mixins/metadata.js' },
  // Lit (R9 §2.3 baseline).
  { specifier: 'lit', package: 'lit', path: 'index.js' },
  { specifier: 'lit/', package: 'lit', path: '', probe: 'lit/directives/if-defined.js' },
  { specifier: 'lit-element/', package: 'lit-element', path: '', probe: 'lit-element/lit-element.js' },
  { specifier: 'lit-html', package: 'lit-html', path: 'lit-html.js' },
  { specifier: 'lit-html/', package: 'lit-html', path: '', probe: 'lit-html/is-server.js' },
  { specifier: '@lit/reactive-element', package: '@lit/reactive-element', path: 'reactive-element.js' },
  {
    specifier: '@lit/reactive-element/',
    package: '@lit/reactive-element',
    path: '',
    probe: '@lit/reactive-element/decorators.js',
  },
  // Zag (R9 §2.3 baseline: vanilla, core, store, utils, types, dom-query; `line-components` adds toggle and
  // presence, and toggle adds anatomy).
  { specifier: '@zag-js/vanilla', package: '@zag-js/vanilla', path: 'dist/index.mjs' },
  { specifier: '@zag-js/core', package: '@zag-js/core', path: 'dist/index.mjs' },
  { specifier: '@zag-js/store', package: '@zag-js/store', path: 'dist/index.mjs' },
  { specifier: '@zag-js/utils', package: '@zag-js/utils', path: 'dist/index.mjs' },
  { specifier: '@zag-js/types', package: '@zag-js/types', path: 'dist/index.mjs' },
  { specifier: '@zag-js/dom-query', package: '@zag-js/dom-query', path: 'dist/index.mjs' },
  { specifier: '@zag-js/toggle', package: '@zag-js/toggle', path: 'dist/index.mjs' },
  { specifier: '@zag-js/presence', package: '@zag-js/presence', path: 'dist/index.mjs' },
  { specifier: '@zag-js/anatomy', package: '@zag-js/anatomy', path: 'dist/index.mjs' },
  { specifier: 'proxy-compare', package: 'proxy-compare', path: 'dist/index.js' },
];

/**
 * Manifest dependencies that no browser module imports, so the map holds no entry for them: the CSS-only design
 * system packages, Lit's server-side DOM shim (imported only by its `node` builds) and type-only packages.
 */
const UNMAPPED = [
  '@websublime/line-themes',
  '@websublime/line-tokens',
  '@websublime/line-utils',
  '@lit-labs/ssr-dom-shim',
  '@types/trusted-types',
  'csstype',
];

/** Zag 1.x ESM reads `process.env.NODE_ENV` (§7.7 bullet 3; R9 §2.3); it runs before the first module. */
const PROCESS_SHIM = "globalThis.process = { env: { NODE_ENV: 'production' } };";

/** The module URLs a page imports. */
interface PageModules {
  readonly root: string;
  readonly button: string;
  readonly icon: string;
  readonly formAssociated: string;
  readonly coreRoot: string;
}

/**
 * A no-build page. The module imports every entry, defines `FormAssociated(LineElement)` as `<line-cdn-form-field>`,
 * and hands `setIconRegistry`, `INTERNALS` and an `import()` bound to the page's import map to the test.
 */
function page(modules: PageModules, head = ''): string {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>line-components CDN check</title>${head}</head>
  <body>
    <line-button id="button">Save</line-button>
    <line-icon id="path-icon"></line-icon>
    <line-icon id="early-icon" library="stub" name="early"></line-icon>
    <form id="form"><line-cdn-form-field id="field" name="field"></line-cdn-form-field></form>
    <script type="module">
      import { setIconRegistry } from '${modules.root}';
      import '${modules.button}';
      import '${modules.icon}';
      import { FormAssociated } from '${modules.formAssociated}';
      import { INTERNALS, LineElement } from '${modules.coreRoot}';

      customElements.define('line-cdn-form-field', class extends FormAssociated(LineElement) {});
      window.lineCdn = { setIconRegistry, INTERNALS, load: (specifier) => import(specifier) };
    </script>
  </body>
</html>
`;
}

/** What the page module leaves on `window`. */
interface LineCdn {
  setIconRegistry(registry: { resolve(library: string, name: string): Promise<string> } | undefined): void;
  readonly INTERNALS: symbol;
  load(specifier: string): Promise<unknown>;
}

declare global {
  interface Window {
    lineCdn: LineCdn;
    lineCdnCalls: [library: string, name: string][];
  }
}

/** The path data the stub registry answers for each icon name. */
const GLYPHS: Record<string, string> = { early: 'M4 4h16v16H4z', late: 'M12 2 2 22h20z' };
const PATH_DATA = 'M4 12h16';

let versions: CdnVersions;
let map: ResolvedImportMap;
let pins: Record<string, string>;
let unpkgModules: PageModules;
let server: PageServer;

test.describe.configure({ retries: 2 });

test.beforeAll(async () => {
  test.setTimeout(120_000);
  versions = await resolveVersions(SUBPATHS);
  pins = { [COMPONENTS]: versions.components, ...versions.imported };
  for (const name of Object.keys(versions.imported)) {
    if (!IMPORT_MAP.some((row) => row.package === name)) {
      throw new Error(`The jsDelivr bundles import ${name}@${versions.imported[name]}, which the unpkg map lacks.`);
    }
  }
  map = await resolveImportMap(IMPORT_MAP, pins, UNMAPPED);

  const core = `${CORE}@${pins[CORE]}`;
  const components = `${COMPONENTS}@${versions.components}`;
  unpkgModules = {
    root: `${UNPKG}/${components}/dist/index.js`,
    button: `${UNPKG}/${components}/dist/button/index.js`,
    icon: `${UNPKG}/${components}/dist/icon/index.js`,
    formAssociated: `${UNPKG}/${core}/dist/mixins/form-associated.js`,
    coreRoot: `${UNPKG}/${core}/dist/index.js`,
  };
  server = await servePages({
    '/jsdelivr.html': page({
      root: `${JSDELIVR}/${components}/+esm`,
      button: `${JSDELIVR}/${components}/button/+esm`,
      icon: `${JSDELIVR}/${components}/icon/+esm`,
      formAssociated: `${JSDELIVR}/${core}/mixins/form-associated/+esm`,
      coreRoot: `${JSDELIVR}/${core}/+esm`,
    }),
    '/unpkg.html': page(
      unpkgModules,
      // `<` escaped as `\u003c`, so no value in the map can close the `<script>` element.
      `<script>${PROCESS_SHIM}</script><script type="importmap">${JSON.stringify({ imports: map.imports }).replaceAll('<', '\\u003c')}</script>`,
    ),
  });
  console.info(
    `[cdn-check] ${Object.entries(pins)
      .map(([name, version]) => `${name}@${version} (${versions.sources[name]})`)
      .join(', ')}`,
  );
  console.info(`[cdn-check] unpkg import map:\n${JSON.stringify({ imports: map.imports }, null, 2)}`);
});

test.afterAll(async () => {
  await server?.close();
});

/** Records the resolved versions on the test, so the HTML report and the Verify record cite them. */
function annotateVersions(): void {
  for (const [name, version] of Object.entries(pins)) {
    test.info().annotations.push({ type: name, description: `${version} (${versions.sources[name]})` });
  }
}

/** Opens a page, collecting every `@websublime/*` request and every console error and uncaught error. */
async function open(p: Page, path: string): Promise<{ requests: string[]; errors: string[] }> {
  const requests: string[] = [];
  const errors: string[] = [];
  p.on('request', (request) => {
    if (request.url().includes('/@websublime/')) requests.push(request.url());
  });
  p.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  p.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  await p.goto(`${server.origin}${path}`);
  try {
    await p.waitForFunction(() => 'lineCdn' in window, null, { timeout: 90_000 });
  } catch (error) {
    throw new Error(`The page module did not run: ${errors.join(' | ') || String(error)}`);
  }
  return { requests, errors };
}

/** The checks both pages share (§6.P.6 Acceptance). */
async function expectPage(p: Page, requests: string[], errors: string[]): Promise<void> {
  await test.step('<line-button> and <line-icon> upgrade and render', async () => {
    expect(
      await p.evaluate(() => [customElements.get('line-button'), customElements.get('line-icon')].map(Boolean)),
    ).toEqual([true, true]);
    const button = p.getByRole('button', { name: 'Save' });
    await expect(button).toBeVisible();
    await button.click();
    await p.evaluate((d) => {
      Reflect.set(document.getElementById('path-icon') as HTMLElement, 'path', d);
    }, PATH_DATA);
    await expect(p.locator('#path-icon svg[part="svg"] path')).toHaveAttribute('d', PATH_DATA);
    await expect(p.locator('#path-icon')).toBeVisible();
  });

  await test.step('ordering: an icon connected before setIconRegistry renders once the registry is set', async () => {
    // The icon upgraded with no registry, so it holds the empty state.
    expect(
      await p.evaluate(async () => {
        const icon = document.getElementById('early-icon') as HTMLElement & { updateComplete: Promise<unknown> };
        await icon.updateComplete;
        return icon.shadowRoot?.querySelector('svg') ?? null;
      }),
    ).toBeNull();
    await p.evaluate((glyphs) => {
      window.lineCdnCalls = [];
      // An inline stub `LineIconRegistry`: no `line-icons` package, no resolver (§6.P.6 Deps).
      window.lineCdn.setIconRegistry({
        resolve(library: string, name: string) {
          window.lineCdnCalls.push([library, name]);
          return Promise.resolve(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${glyphs[name]}"/></svg>`,
          );
        },
      });
    }, GLYPHS);
    await expect(p.locator('#early-icon svg[part="svg"] path')).toHaveAttribute('d', GLYPHS.early as string);
  });

  await test.step('setIconRegistry from the root entry reaches a <line-icon> from the icon entry', async () => {
    await p.evaluate(() => {
      const icon = document.createElement('line-icon');
      icon.id = 'late-icon';
      icon.setAttribute('library', 'stub');
      icon.setAttribute('name', 'late');
      document.body.append(icon);
    });
    await expect(p.locator('#late-icon svg[part="svg"] path')).toHaveAttribute('d', GLYPHS.late as string);
    expect(await p.evaluate(() => window.lineCdnCalls)).toEqual(
      expect.arrayContaining([
        ['stub', 'early'],
        ['stub', 'late'],
      ]),
    );
  });

  await test.step('FormAssociated(LineElement) keeps its form API through ElementInternals', async () => {
    const result = await p.evaluate(() => {
      const form = document.getElementById('form') as HTMLFormElement;
      const field = document.getElementById('field') as HTMLElement & {
        readonly form: HTMLFormElement | null;
        setFormValue(value: string): void;
        setValidity(flags: ValidityStateFlags, message?: string): void;
        checkValidity(): boolean;
      };
      const internals = Reflect.get(field, window.lineCdn.INTERNALS);
      field.setFormValue('hello');
      const value = new FormData(form).get('field');
      const validBefore = field.checkValidity();
      field.setValidity({ customError: true }, 'Not valid');
      const validAfter = field.checkValidity();
      return {
        internals: internals instanceof ElementInternals,
        form: field.form === form,
        value,
        validBefore,
        validAfter,
        formValid: form.checkValidity(),
      };
    });
    expect(result).toEqual({
      internals: true,
      form: true,
      value: 'hello',
      validBefore: true,
      validAfter: false,
      formValid: false,
    });
  });

  await test.step('every @websublime/* URL names one exact version', async () => {
    expect(requests.length).toBeGreaterThan(0);
    // An unversioned URL, such as `/npm/@websublime/line-core/+esm`, or one this regex cannot read, fails too.
    const off = requests.filter((url) => {
      const found = [...url.matchAll(WEBSUBLIME_URL)];
      return (
        found.length === 0 || found.some(([, name = '', version]) => version === undefined || pins[name] !== version)
      );
    });
    expect(off, `pinned: ${JSON.stringify(pins)}`).toEqual([]);
  });

  expect(errors, 'console errors and uncaught errors').toEqual([]);
}

test('jsDelivr +esm page', async ({ page: p }) => {
  test.setTimeout(180_000);
  annotateVersions();
  const { requests, errors } = await open(p, '/jsdelivr.html');
  await expectPage(p, requests, errors);
});

test('unpkg raw page with import map', async ({ page: p, browserName }) => {
  test.skip(
    browserName === 'firefox',
    'AM-105: the unpkg page runs in Chromium and WebKit only; R9 §2.3 saw cold CORS errors on this path in Firefox.',
  );
  test.setTimeout(180_000);
  annotateVersions();
  test.info().annotations.push({ type: 'unpkg import map', description: JSON.stringify({ imports: map.imports }) });
  const { requests, errors } = await open(p, '/unpkg.html');

  await test.step("the map's @websublime/line-core entry is the root URL the page imports", async () => {
    expect(map.imports['@websublime/line-core']).toBe(unpkgModules.coreRoot);
  });
  await test.step('every import map entry loads', async () => {
    const specifiers = IMPORT_MAP.map((row) => row.probe ?? row.specifier);
    const failed = await p.evaluate(async (list) => {
      const settled = await Promise.allSettled(list.map((specifier) => window.lineCdn.load(specifier)));
      return settled.flatMap((outcome, index) =>
        outcome.status === 'rejected' ? [`${list[index]}: ${String(outcome.reason)}`] : [],
      );
    }, specifiers);
    expect(failed).toEqual([]);
  });
  await expectPage(p, requests, errors);
});
