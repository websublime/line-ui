/**
 * `<line-icon>` browser tier (spec `0014-icon.md` Tests, Browser and Accessibility tree rows; Phase 1 spec
 * §6.C.3 "SVG injection acceptance" and "Icon surface acceptance", §6.C.4 notes, §7.8, §12 AM-058).
 *
 * Runs in chromium, firefox and webkit on `index.html`, which the third `webServer` of `playwright.config.ts`
 * serves on port 4321. The page loads the built `@websublime/line-components/icon` and the root
 * `setIconRegistry`; `fixture.ts` builds registries from the `line-icons` devDependency. Each test routes
 * `/icons/lucide/` and `/icons/phosphor/` to the installed `lucide-static` `icons/` and `@phosphor-icons/core`
 * `assets/` folders, a self-hosted base, and the Trusted Types tests fulfil the page with a CSP header added.
 * The internals are read back through the `INTERNALS` symbol the fixture re-exports, in every engine; the
 * accessibility tree is read through a CDP session in chromium only.
 *
 * @module __tests__/integration/icon/icon.e2e
 */

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve, sep } from 'node:path';
import { type CDPSession, expect, type Page, type Request, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/icon/';
const FIXTURE_MODULE = `${FIXTURE_URL}fixture.ts`;
const SVG_NS = 'http://www.w3.org/2000/svg';

const require = createRequire(import.meta.url);
const LUCIDE_ICONS = join(dirname(require.resolve('lucide-static/package.json')), 'icons');
// `@phosphor-icons/core` exports no `./package.json` under Node, so resolve an exported icon and climb to `assets/`.
const PHOSPHOR_ASSETS = resolve(require.resolve('@phosphor-icons/core/assets/regular/house.svg'), '../..');

/** Every Trusted Types page lists `lit-html`, the policy lit-html creates when it loads (spec 0014-icon.md AM-001). */
const TRUSTED_TYPES_ALLOWED = "require-trusted-types-for 'script'; trusted-types line-icon lit-html";
const TRUSTED_TYPES_OTHER = "require-trusted-types-for 'script'; trusted-types other lit-html";

/** The fixture module's exports, as the page sees them. */
interface Fixture {
  INTERNALS: symbol;
  LineIcon: { registry: unknown };
  setIconRegistry(registry: unknown): void;
  IconRegistry: new () => { register(library: string, resolver: unknown): void };
  createLucideResolver(options?: { base: string }): unknown;
  referenceRegistry(): unknown;
  markupRegistry(markupByName: Record<string, string>): unknown;
  secondRegistry: { setIconRegistry(registry: unknown): void };
  secondInjection: { injectSvg(markup: string): Element | undefined };
}

interface Glyph {
  name: string;
  ns: string | null;
  attributes: Record<string, string>;
  children: (Glyph | string)[];
}

/** Routes the self-hosted icon bases to the installed peers and records each icon path the page requests. */
async function serveIcons(page: Page): Promise<string[]> {
  const requested: string[] = [];
  await page.route(/\/icons\/(?:lucide|phosphor)\//, async (route) => {
    const { pathname } = new URL(route.request().url());
    requested.push(pathname);
    const [, set = '', file = ''] = /^\/icons\/(lucide|phosphor)\/(.+)$/.exec(pathname) ?? [];
    const dir = set === 'lucide' ? LUCIDE_ICONS : PHOSPHOR_ASSETS;
    const path = join(dir, decodeURIComponent(file));
    if (!(path.startsWith(dir + sep) && existsSync(path))) {
      await route.fulfill({ status: 404, body: 'Not Found' });
      return;
    }
    await route.fulfill({ path, contentType: 'image/svg+xml' });
  });
  return requested;
}

/**
 * Resolves once the page has finished one request for each pathname in `pathnames`, so a test can check the
 * empty state after a fetch settles. Call it before the change that sends the requests.
 */
function requestsDone(page: Page, pathnames: string[]): Promise<void> {
  const pending = [...pathnames];
  const { promise, resolve } = Promise.withResolvers<void>();
  const listener = (request: Request): void => {
    const index = pending.indexOf(new URL(request.url()).pathname);
    if (index !== -1) {
      pending.splice(index, 1);
    }
    if (pending.length === 0) {
      page.off('requestfinished', listener);
      page.off('requestfailed', listener);
      resolve();
    }
  };
  page.on('requestfinished', listener);
  page.on('requestfailed', listener);
  return promise;
}

/** Opens the fixture page, optionally with a CSP header, and waits for `line-icon`. */
async function open(page: Page, csp?: string): Promise<void> {
  if (csp) {
    await page.route(FIXTURE_URL, async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } });
    });
  }
  await page.goto(FIXTURE_URL);
  await page.evaluate(() => customElements.whenDefined('line-icon'));
}

/** Sets the registry in the page: the reference registry, a markup registry, or none. */
async function useRegistry(page: Page, registry: 'reference' | Record<string, string> | 'none'): Promise<void> {
  await page.evaluate(
    async ([url, choice]) => {
      const fixture = (await import(url)) as Fixture;
      if (choice === 'none') {
        fixture.setIconRegistry(undefined);
      } else {
        fixture.setIconRegistry(choice === 'reference' ? fixture.referenceRegistry() : fixture.markupRegistry(choice));
      }
    },
    [FIXTURE_MODULE, registry] as const,
  );
}

/** Lets microtask-only work and the updates it triggers finish. */
function settle(page: Page): Promise<void> {
  return page.evaluate(async () => {
    for (let round = 0; round < 3; round++) {
      await new Promise((done) => requestAnimationFrame(done));
      await Promise.all(
        [...document.querySelectorAll('line-icon')].map(
          (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
        ),
      );
    }
  });
}

/** Replaces the content of `<main>` with `markup` and lets the icons settle. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate((html) => {
    (document.querySelector('main') as HTMLElement).innerHTML = html;
  }, markup);
  await settle(page);
}

/** Appends one icon built with DOM calls, so a Trusted Types page accepts it. */
async function append(page: Page, attributes: Record<string, string>): Promise<void> {
  await page.evaluate((attrs) => {
    const icon = document.createElement('line-icon');
    for (const [name, value] of Object.entries(attrs)) {
      icon.setAttribute(name, value);
    }
    (document.querySelector('main') as HTMLElement).append(icon);
  }, attributes);
  await settle(page);
}

/** The glyph tree in the shadow root of the icon matched by `selector`, or `null` in the empty state. */
function glyphOf(page: Page, selector = 'main line-icon'): Promise<Glyph | null> {
  return page.evaluate((sel) => {
    const host = document.querySelector(sel) as HTMLElement;
    const children = [...(host.shadowRoot?.children ?? [])];
    if (children.length > 1) {
      throw new Error(`${children.length} children in the shadow root`);
    }
    const walk = (el: Element): Glyph => ({
      name: el.localName,
      ns: el.namespaceURI,
      attributes: Object.fromEntries([...el.attributes].map((attribute) => [attribute.name, attribute.value])),
      children: [...el.childNodes].map((node) => (node instanceof Element ? walk(node) : node.nodeName)),
    });
    return children[0] ? walk(children[0]) : null;
  }, selector);
}

/** Waits until the icon matched by `selector` shows a glyph. */
async function expectGlyph(page: Page, selector = 'main line-icon'): Promise<Glyph> {
  await expect.poll(() => glyphOf(page, selector)).not.toBeNull();
  return (await glyphOf(page, selector)) as Glyph;
}

const svg = (inner: string, attributes = ''): string => `<svg xmlns="${SVG_NS}"${attributes}>${inner}</svg>`;

/** The Lucide `house` glyph as the injection step builds it from `lucide-static` 1.56.0. */
const LUCIDE_HOUSE: Glyph = {
  name: 'svg',
  ns: SVG_NS,
  attributes: {
    class: 'lucide lucide-house',
    xmlns: SVG_NS,
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    part: 'svg',
    'aria-hidden': 'true',
  },
  children: [
    { name: 'path', ns: SVG_NS, attributes: { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' }, children: [] },
    {
      name: 'path',
      ns: SVG_NS,
      attributes: {
        d: 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      },
      children: [],
    },
  ],
};

test.describe('SVG injection', () => {
  test.beforeEach(async ({ page }) => {
    await serveIcons(page);
    await open(page);
  });

  test('script, foreignObject, <a href="javascript:…">, on* and style are all removed', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await useRegistry(page, {
      hostile: svg(
        `<script>globalThis.__iconScript = true</script>
        <foreignObject><img xmlns="http://www.w3.org/1999/xhtml" src="x" onerror="globalThis.__iconOnerror = true"/></foreignObject>
        <a href="javascript:globalThis.__iconLink = true"><path d="M1 1"/></a>
        <path d="M0 0" onload="globalThis.__iconOnload = true" style="fill: red"/>`,
        ' viewBox="0 0 24 24" onload="globalThis.__iconRootOnload = true" style="display: none"',
      ),
    });
    await mount(page, '<line-icon library="set" name="hostile"></line-icon>');
    expect(await expectGlyph(page)).toEqual({
      name: 'svg',
      ns: SVG_NS,
      attributes: { xmlns: SVG_NS, viewBox: '0 0 24 24', part: 'svg', 'aria-hidden': 'true' },
      children: [{ name: 'path', ns: SVG_NS, attributes: { d: 'M0 0' }, children: [] }],
    });
    await settle(page);
    expect(
      await page.evaluate(() =>
        ['__iconScript', '__iconOnerror', '__iconLink', '__iconOnload', '__iconRootOnload'].filter((key) =>
          Reflect.has(globalThis, key),
        ),
      ),
    ).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('<use href="#x"> and fill="url(#x)" are removed, also as URL(', async ({ page }) => {
    await useRegistry(page, {
      refs: svg(
        '<use href="#x"/><path d="M0 0" fill="url(#x)"/><path d="M1 1" stroke="URL(#y)"/><rect width="1" height="1" fill="red"/>',
      ),
    });
    await mount(page, '<line-icon library="set" name="refs"></line-icon>');
    expect((await expectGlyph(page)).children).toEqual([
      { name: 'path', ns: SVG_NS, attributes: { d: 'M0 0' }, children: [] },
      { name: 'path', ns: SVG_NS, attributes: { d: 'M1 1' }, children: [] },
      { name: 'rect', ns: SVG_NS, attributes: { width: '1', height: '1', fill: 'red' }, children: [] },
    ]);
  });

  test('CSS-escaped url( such as u\\rl( and \\75 rl( is removed', async ({ page }) => {
    await useRegistry(page, {
      escaped: svg(
        '<path d="M0 0" fill="u\\rl(#x)"/><path d="M1 1" fill="\\75 rl(#y)" stroke="\\55 RL(#z)"/><rect width="1" height="1" fill="red"/>',
      ),
    });
    await mount(page, '<line-icon library="set" name="escaped"></line-icon>');
    expect((await expectGlyph(page)).children).toEqual([
      { name: 'path', ns: SVG_NS, attributes: { d: 'M0 0' }, children: [] },
      { name: 'path', ns: SVG_NS, attributes: { d: 'M1 1' }, children: [] },
      { name: 'rect', ns: SVG_NS, attributes: { width: '1', height: '1', fill: 'red' }, children: [] },
    ]);
  });

  test('g with transform and path with fill-rule="evenodd" survive intact', async ({ page }) => {
    await useRegistry(page, {
      group: svg('<g transform="translate(2 2) rotate(45)"><path d="M0 0h10v10H0z" fill-rule="evenodd"/></g>'),
    });
    await mount(page, '<line-icon library="set" name="group"></line-icon>');
    expect((await expectGlyph(page)).children).toEqual([
      {
        name: 'g',
        ns: SVG_NS,
        attributes: { transform: 'translate(2 2) rotate(45)' },
        children: [
          { name: 'path', ns: SVG_NS, attributes: { d: 'M0 0h10v10H0z', 'fill-rule': 'evenodd' }, children: [] },
        ],
      },
    ]);
  });

  test('Lucide house renders intact from the self-hosted base', async ({ page }) => {
    await useRegistry(page, 'reference');
    await mount(page, '<line-icon library="lucide" name="house"></line-icon>');
    expect(await expectGlyph(page)).toEqual(LUCIDE_HOUSE);
  });

  test('xmlns:xlink is removed and the root xmlns is kept', async ({ page }) => {
    await useRegistry(page, {
      xlink: svg('<path d="M0 0" xlink:href="#a"/>', ' xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"'),
    });
    await mount(page, '<line-icon library="set" name="xlink"></line-icon>');
    const glyph = await expectGlyph(page);
    expect(glyph.attributes).toEqual({ xmlns: SVG_NS, viewBox: '0 0 24 24', part: 'svg', 'aria-hidden': 'true' });
    expect(glyph.children).toEqual([{ name: 'path', ns: SVG_NS, attributes: { d: 'M0 0' }, children: [] }]);
  });

  test('text, comment, CDATA and processing-instruction nodes are not copied', async ({ page }) => {
    await useRegistry(page, { nodes: svg('text<!-- c --><![CDATA[x]]><?pi y?><path d="M0 0"/>tail') });
    await mount(page, '<line-icon library="set" name="nodes"></line-icon>');
    expect((await expectGlyph(page)).children).toEqual([
      { name: 'path', ns: SVG_NS, attributes: { d: 'M0 0' }, children: [] },
    ]);
  });

  test('a parsed root with role="img" keeps the role and gets part="svg" and aria-hidden="true"', async ({ page }) => {
    await useRegistry(page, {
      role: svg('<path d="M0 0"/>', ' role="img"'),
      shown: svg('<path d="M0 0"/>', ' aria-hidden="false"'),
    });
    await mount(
      page,
      '<line-icon id="a" library="set" name="role"></line-icon><line-icon id="b" library="set" name="shown"></line-icon>',
    );
    expect((await expectGlyph(page, '#a')).attributes).toEqual({
      xmlns: SVG_NS,
      role: 'img',
      part: 'svg',
      'aria-hidden': 'true',
    });
    expect((await expectGlyph(page, '#b')).attributes['aria-hidden']).toBe('true');
  });

  for (const [label, markup] of [
    ['an HTML document', '<html xmlns="http://www.w3.org/1999/xhtml"><body><p>x</p></body></html>'],
    ['a parse error', svg('<path d="M0 0"></svg')],
    ['plain text', 'not markup'],
    ['an svg root without the SVG namespace', '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>'],
  ] as const) {
    test(`${label} leaves the empty state with no uncaught error`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await useRegistry(page, { bad: markup, good: svg('<path d="M0 0"/>') });
      await mount(
        page,
        '<line-icon id="good" library="set" name="good"></line-icon><line-icon id="bad" library="set" name="bad"></line-icon>',
      );
      await expectGlyph(page, '#good');
      await settle(page);
      expect(await glyphOf(page, '#bad')).toBeNull();
      expect(errors).toEqual([]);
    });
  }

  test('an SVGElement from a custom resolver is inserted unchanged', async ({ page }) => {
    const result = await page.evaluate(async (url) => {
      const fixture = (await import(url)) as Fixture;
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      node.setAttribute('viewBox', '0 0 10 10');
      node.setAttribute('style', 'color: red');
      node.innerHTML = '<circle cx="5" cy="5" r="5"/><foreignObject width="1" height="1"></foreignObject>';
      const before = node.outerHTML;
      fixture.setIconRegistry({ resolve: async () => node });
      const icon = document.createElement('line-icon');
      icon.setAttribute('library', 'custom');
      icon.setAttribute('name', 'any');
      (document.querySelector('main') as HTMLElement).append(icon);
      for (let round = 0; round < 3; round++) {
        await new Promise((done) => requestAnimationFrame(done));
      }
      return {
        same: icon.shadowRoot?.firstElementChild === node,
        unchanged: node.outerHTML === before,
        part: node.hasAttribute('part'),
        hidden: node.hasAttribute('aria-hidden'),
      };
    }, FIXTURE_MODULE);
    expect(result).toEqual({ same: true, unchanged: true, part: false, hidden: false });
  });

  test('the path glyph carries part="svg" and aria-hidden="true"', async ({ page }) => {
    await mount(page, '<line-icon></line-icon>');
    await page.evaluate(() => {
      (document.querySelector('main line-icon') as HTMLElement & { path: string }).path = 'M12 2 L22 22 L2 22 Z';
    });
    expect(await expectGlyph(page)).toEqual({
      name: 'svg',
      ns: SVG_NS,
      attributes: { viewBox: '0 0 24 24', fill: 'currentColor', part: 'svg', 'aria-hidden': 'true' },
      children: [{ name: 'path', ns: SVG_NS, attributes: { d: 'M12 2 L22 22 L2 22 Z' }, children: [] }],
    });
  });
});

test.describe('Trusted Types', () => {
  test('trusted-types line-icon renders the icon', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await serveIcons(page);
    await open(page, TRUSTED_TYPES_ALLOWED);
    await useRegistry(page, 'reference');
    await append(page, { library: 'lucide', name: 'house' });
    expect(await expectGlyph(page)).toEqual(LUCIDE_HOUSE);
    // The page loaded and drew with only `line-icon` and `lit-html` allowed, so no other policy was asked for.
    expect(errors).toEqual([]);
  });

  test('trusted-types other leaves the empty state with no uncaught error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await serveIcons(page);
    await open(page, TRUSTED_TYPES_OTHER);
    expect(await page.evaluate(() => typeof Reflect.get(globalThis, 'trustedTypes'))).toBe('object');
    await useRegistry(page, 'reference');
    const first = requestsDone(page, ['/icons/lucide/house.svg']);
    await append(page, { library: 'lucide', name: 'house' });
    await first;
    await settle(page);
    expect(await glyphOf(page)).toBeNull();
    // A later string in the same module copy stays empty too; `path` needs no policy and still draws.
    const second = requestsDone(page, ['/icons/lucide/check.svg']);
    await append(page, { library: 'lucide', name: 'check' });
    await second;
    await settle(page);
    expect(await glyphOf(page, 'main line-icon:nth-of-type(2)')).toBeNull();
    await page.evaluate(() => {
      (document.querySelector('main line-icon') as HTMLElement & { path: string }).path = 'M0 0h24v24H0z';
    });
    await expectGlyph(page);
    expect(errors).toEqual([]);
  });

  test('a second module copy cannot create the policy again without allow-duplicates', async ({ page }) => {
    for (const [csp, expected] of [
      [TRUSTED_TYPES_ALLOWED, false],
      [`${TRUSTED_TYPES_ALLOWED} 'allow-duplicates'`, true],
    ] as const) {
      await open(page, csp);
      await useRegistry(page, { one: svg('<path d="M0 0"/>') });
      await append(page, { library: 'set', name: 'one' });
      await expectGlyph(page);
      const injected = await page.evaluate(async (url) => {
        const fixture = (await import(url)) as Fixture;
        return (
          fixture.secondInjection.injectSvg('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>') !==
          undefined
        );
      }, FIXTURE_MODULE);
      expect(injected, csp).toBe(expected);
      await page.unroute(FIXTURE_URL);
    }
  });
});

test.describe('icon surface', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('a resolver created without base leaves the empty state', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.evaluate(async (url) => {
      const fixture = (await import(url)) as Fixture;
      const registry = new fixture.IconRegistry();
      registry.register('lucide', fixture.createLucideResolver());
      fixture.setIconRegistry(registry);
    }, FIXTURE_MODULE);
    await mount(page, '<line-icon library="lucide" name="house"></line-icon>');
    expect(await glyphOf(page)).toBeNull();
    expect(errors).toEqual([]);
  });

  test('a name icon with no registry renders the empty state with no uncaught error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await useRegistry(page, 'none');
    await mount(page, '<line-icon library="lucide" name="house"></line-icon>');
    expect(await glyphOf(page)).toBeNull();
    expect(errors).toEqual([]);
  });

  test('library="phosphor" name="heart" weight="fill" fetches and renders the fill file', async ({ page }) => {
    const requested = await serveIcons(page);
    await useRegistry(page, 'reference');
    await mount(page, '<line-icon library="phosphor" name="heart" weight="fill"></line-icon>');
    const glyph = await expectGlyph(page);
    expect(requested).toEqual(['/icons/phosphor/fill/heart-fill.svg']);
    expect(glyph.attributes).toEqual({
      xmlns: SVG_NS,
      viewBox: '0 0 256 256',
      fill: 'currentColor',
      part: 'svg',
      'aria-hidden': 'true',
    });
  });

  test('a connected empty icon renders after setIconRegistry, after LineIcon.registry and from a second copy', async ({
    page,
  }) => {
    await serveIcons(page);
    await useRegistry(page, 'none');
    await mount(page, '<line-icon library="lucide" name="house"></line-icon>');
    expect(await glyphOf(page)).toBeNull();

    await useRegistry(page, 'reference');
    expect(await expectGlyph(page)).toEqual(LUCIDE_HOUSE);

    await page.evaluate(async (url) => {
      const fixture = (await import(url)) as Fixture;
      fixture.LineIcon.registry = fixture.markupRegistry({
        house: '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="1" cy="1" r="1"/></svg>',
      });
    }, FIXTURE_MODULE);
    await expect.poll(async () => ((await glyphOf(page))?.children[0] as Glyph | undefined)?.name).toBe('circle');

    await useRegistry(page, 'none');
    await expect.poll(() => glyphOf(page)).toBeNull();
    // The second copy is `src/shared/icon-registry.ts`, a module apart from the built chunk the icon imports.
    await page.evaluate(async (url) => {
      const fixture = (await import(url)) as Fixture;
      fixture.secondRegistry.setIconRegistry(fixture.referenceRegistry());
    }, FIXTURE_MODULE);
    expect(await expectGlyph(page)).toEqual(LUCIDE_HOUSE);
  });

  test('a missing or invalid icon leaves the empty state and nothing throws', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await serveIcons(page);
    await useRegistry(page, 'reference');
    const done = requestsDone(page, [
      '/icons/lucide/house.svg',
      '/icons/lucide/definitely-not-an-icon.svg',
      '/icons/lucide/definitely-not-an-icon.svg',
    ]);
    await mount(
      page,
      `<line-icon id="known" library="lucide" name="house"></line-icon>
      <line-icon id="missing" library="lucide" name="definitely-not-an-icon"></line-icon>
      <line-icon id="invalid" library="lucide" name="../package"></line-icon>
      <line-icon id="weight" library="phosphor" name="heart" weight="heavy"></line-icon>
      <line-icon id="library" library="nope" name="house"></line-icon>
      <line-icon id="src" src="/icons/lucide/definitely-not-an-icon.svg"></line-icon>`,
    );
    await done;
    await settle(page);
    await expectGlyph(page, '#known');
    for (const id of ['#missing', '#invalid', '#weight', '#library', '#src']) {
      expect(await glyphOf(page, id), id).toBeNull();
    }
    expect(errors).toEqual([]);
  });

  test('src loads an SVG file relative to the document', async ({ page }) => {
    const requested = await serveIcons(page);
    await mount(page, '<line-icon src="../icons/lucide/house.svg"></line-icon>');
    expect(await expectGlyph(page)).toEqual(LUCIDE_HOUSE);
    expect(requested).toEqual(['/icons/lucide/house.svg']);
  });
});

/** Border-box size of the element matched by `selector` inside `<main>`. */
function box(page: Page, selector: string): Promise<{ width: number; height: number }> {
  return page.evaluate((sel) => {
    const { width, height } = (document.querySelector(`main ${sel}`) as Element).getBoundingClientRect();
    return { width, height };
  }, selector);
}

/** Computed values of the glyph root inside the icon matched by `selector`. */
function glyphStyle(page: Page, selector: string, properties: string[]): Promise<Record<string, string>> {
  return page.evaluate(
    ([sel, names]) => {
      const root = (document.querySelector(`main ${sel}`) as HTMLElement).shadowRoot?.firstElementChild as Element;
      const style = getComputedStyle(root);
      return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]));
    },
    [selector, properties] as const,
  );
}

test.describe('layout and styling', () => {
  test.beforeEach(async ({ page }) => {
    await serveIcons(page);
    await open(page);
    await useRegistry(page, 'reference');
  });

  test('the host is 1em by default, follows --line-icon-size on itself or an ancestor, and keeps its box empty', async ({
    page,
  }) => {
    const missing = requestsDone(page, ['/icons/lucide/definitely-not-an-icon.svg']);
    await mount(
      page,
      `<div style="font-size: 20px">
        <line-icon id="default" library="lucide" name="house"></line-icon>
        <line-icon id="own" library="lucide" name="house" style="--line-icon-size: 32px"></line-icon>
        <line-icon id="empty"></line-icon>
        <line-icon id="missing" library="lucide" name="definitely-not-an-icon"></line-icon>
        <span class="toolbar" style="--line-icon-size: 1.5em"><line-icon id="inherited" library="lucide" name="house"></line-icon></span>
      </div>`,
    );
    await expectGlyph(page, '#inherited');
    await missing;
    await settle(page);
    expect(await box(page, '#default')).toEqual({ width: 20, height: 20 });
    expect(await box(page, '#own')).toEqual({ width: 32, height: 32 });
    expect(await box(page, '#inherited')).toEqual({ width: 30, height: 30 });
    expect(await glyphOf(page, '#empty')).toBeNull();
    expect(await glyphOf(page, '#missing')).toBeNull();
    expect(await box(page, '#empty')).toEqual({ width: 20, height: 20 });
    expect(await box(page, '#missing')).toEqual({ width: 20, height: 20 });
    expect(
      await page.evaluate(() =>
        ['display', 'vertical-align', 'margin-top', 'margin-left'].map((name) =>
          getComputedStyle(document.querySelector('#default') as Element).getPropertyValue(name),
        ),
      ),
    ).toEqual(['inline-block', 'baseline', '0px', '0px']);
  });

  test('the glyph fills the host for Lucide (width="24") and Phosphor (no width)', async ({ page }) => {
    await mount(
      page,
      `<div style="font-size: 40px">
        <line-icon id="lucide" library="lucide" name="house"></line-icon>
        <line-icon id="phosphor" library="phosphor" name="check"></line-icon>
      </div>`,
    );
    for (const id of ['#lucide', '#phosphor']) {
      await expectGlyph(page, id);
      const sizes = await page.evaluate((sel) => {
        const host = document.querySelector(sel) as HTMLElement;
        const glyph = host.shadowRoot?.firstElementChild as Element;
        const outer = host.getBoundingClientRect();
        const inner = glyph.getBoundingClientRect();
        return [outer.x, outer.y, outer.width, outer.height, inner.x, inner.y, inner.width, inner.height];
      }, id);
      expect(sizes.slice(4), id).toEqual(sizes.slice(0, 4));
      expect(sizes[2], id).toBe(40);
    }
  });

  test('the stroke or fill colour is the host text colour', async ({ page }) => {
    await mount(
      page,
      `<div style="color: rgb(200, 0, 0)">
        <line-icon id="lucide" library="lucide" name="house"></line-icon>
        <line-icon id="phosphor" library="phosphor" name="check"></line-icon>
      </div>`,
    );
    await expectGlyph(page, '#lucide');
    await expectGlyph(page, '#phosphor');
    const colours = await page.evaluate(() => {
      const shape = (sel: string) =>
        getComputedStyle((document.querySelector(sel) as HTMLElement).shadowRoot?.querySelector('path') as Element);
      return { lucide: shape('#lucide').stroke, lucideFill: shape('#lucide').fill, phosphor: shape('#phosphor').fill };
    });
    expect(colours).toEqual({ lucide: 'rgb(200, 0, 0)', lucideFill: 'none', phosphor: 'rgb(200, 0, 0)' });
  });

  test('mirror flips the glyph under dir="rtl" only, and a consumer transform on ::part(svg) still applies', async ({
    page,
  }) => {
    await mount(
      page,
      `<style>line-icon.turned::part(svg) { transform: rotate(90deg); }</style>
      <div dir="rtl">
        <line-icon id="rtl" library="lucide" name="arrow-left" mirror></line-icon>
        <line-icon id="rtl-plain" library="lucide" name="arrow-left"></line-icon>
        <line-icon id="rtl-turned" class="turned" library="lucide" name="arrow-left" mirror></line-icon>
      </div>
      <div dir="ltr"><line-icon id="ltr" library="lucide" name="arrow-left" mirror></line-icon></div>`,
    );
    for (const id of ['#rtl', '#rtl-plain', '#rtl-turned', '#ltr']) {
      await expectGlyph(page, id);
    }
    expect((await glyphStyle(page, '#rtl', ['scale'])).scale).toBe('-1 1');
    expect((await glyphStyle(page, '#rtl-plain', ['scale'])).scale).toBe('none');
    expect((await glyphStyle(page, '#ltr', ['scale'])).scale).toBe('none');
    expect(await glyphStyle(page, '#rtl-turned', ['scale', 'transform'])).toEqual({
      scale: '-1 1',
      transform: 'matrix(0, 1, -1, 0, 0, 0)',
    });
  });

  test('a mirror set as a property reflects and flips', async ({ page }) => {
    await mount(page, '<div dir="rtl"><line-icon library="lucide" name="arrow-left"></line-icon></div>');
    await expectGlyph(page);
    await page.evaluate(async () => {
      const icon = document.querySelector('main line-icon') as HTMLElement & {
        mirror: boolean;
        updateComplete: Promise<unknown>;
      };
      icon.mirror = true;
      await icon.updateComplete;
    });
    expect(await page.locator('main line-icon').getAttribute('mirror')).toBe('');
    expect((await glyphStyle(page, 'line-icon', ['scale'])).scale).toBe('-1 1');
  });

  test('consumer CSS on line-icon and ::part(svg) beats the component rules', async ({ page }) => {
    await mount(
      page,
      `<style>
        line-icon.custom { display: block; inline-size: 48px; block-size: 24px; vertical-align: -0.125em; margin: 3px; }
        line-icon.custom::part(svg) { stroke-width: 1.5; }
      </style>
      <line-icon class="custom" library="lucide" name="house"></line-icon>`,
    );
    await expectGlyph(page);
    expect(await box(page, 'line-icon')).toEqual({ width: 48, height: 24 });
    expect(
      await page.evaluate(() =>
        ['display', 'vertical-align', 'margin-top'].map((name) =>
          getComputedStyle(document.querySelector('main line-icon') as Element).getPropertyValue(name),
        ),
      ),
    ).toEqual(['block', '-2px', '3px']);
    expect((await glyphStyle(page, 'line-icon', ['stroke-width']))['stroke-width']).toBe('1.5px');
    // Lucide sets stroke-width on the root only, so the shapes inherit the consumer value.
    expect(
      await page.evaluate(() =>
        [...((document.querySelector('main line-icon') as HTMLElement).shadowRoot?.querySelectorAll('path') ?? [])].map(
          (path) => getComputedStyle(path).strokeWidth,
        ),
      ),
    ).toEqual(['1.5px', '1.5px']);
  });

  test('the icon keeps its size in a crowded flex row', async ({ page }) => {
    await mount(
      page,
      `<div style="display: flex; inline-size: 40px; font-size: 20px">
        <span style="inline-size: 100px; min-inline-size: 0"></span>
        <line-icon library="lucide" name="house"></line-icon>
        <line-icon></line-icon>
      </div>`,
    );
    await expectGlyph(page);
    expect(await box(page, 'line-icon:nth-of-type(1)')).toEqual({ width: 20, height: 20 });
    expect(await box(page, 'line-icon:nth-of-type(2)')).toEqual({ width: 20, height: 20 });
  });

  test('<line-icon hidden> renders nothing', async ({ page }) => {
    await mount(page, '<line-icon hidden library="lucide" name="house"></line-icon>');
    expect(
      await page.evaluate(() => getComputedStyle(document.querySelector('main line-icon') as Element).display),
    ).toBe('none');
    await expect(page.locator('main line-icon')).toBeHidden();
  });

  test('Tab skips the icon, named or not', async ({ page }) => {
    await mount(
      page,
      `<input id="before" aria-label="Before" />
      <line-icon library="lucide" name="house"></line-icon>
      <line-icon library="lucide" name="house" aria-label="Home"></line-icon>
      <input id="after" aria-label="After" />`,
    );
    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('after');
  });
});

/** The internals `role` and `ariaHidden` of each `line-icon` inside `<main>`, read through `INTERNALS`. */
function internalsOfAll(page: Page): Promise<({ role: string | null; ariaHidden: string | null } | 'missing')[]> {
  return page.evaluate(async (url) => {
    // Runtime import in the page: the fixture module the page already loaded holds the one matching Symbol.
    const { INTERNALS } = (await import(url)) as Fixture;
    return [...document.querySelectorAll('main line-icon')].map((el) => {
      const internals = Reflect.get(el, INTERNALS) as ElementInternals | undefined;
      return internals ? { role: internals.role, ariaHidden: internals.ariaHidden } : 'missing';
    });
  }, FIXTURE_MODULE);
}

const DECORATIVE = { role: null, ariaHidden: 'true' };
const NAMED = { role: 'img', ariaHidden: null };

test.describe('internals', () => {
  test.beforeEach(async ({ page }) => {
    await serveIcons(page);
    await open(page);
    await useRegistry(page, 'reference');
  });

  test('the internals hold role and ariaHidden per the spec table', async ({ page }) => {
    await mount(
      page,
      `<span id="caption">Settings</span>
      <line-icon library="lucide" name="house"></line-icon>
      <line-icon library="lucide" name="house" aria-label="Settings"></line-icon>
      <line-icon library="lucide" name="house" aria-labelledby="caption"></line-icon>
      <line-icon library="lucide" name="house" aria-label=" "></line-icon>
      <line-icon library="lucide" name="house" aria-labelledby=""></line-icon>
      <line-icon library="lucide" name="definitely-not-an-icon" aria-label="Error"></line-icon>`,
    );
    expect(await internalsOfAll(page)).toEqual([DECORATIVE, NAMED, NAMED, DECORATIVE, DECORATIVE, NAMED]);
  });

  test('adding and removing a label, through the attribute or ariaLabel, updates the internals', async ({ page }) => {
    await mount(page, '<line-icon library="lucide" name="house"></line-icon>');
    const icon = page.locator('main line-icon');
    const first = async (): Promise<unknown> => (await internalsOfAll(page))[0];

    await icon.evaluate((el) => el.setAttribute('aria-label', 'Settings'));
    expect(await first()).toEqual(NAMED);
    await icon.evaluate((el) => el.removeAttribute('aria-label'));
    expect(await first()).toEqual(DECORATIVE);

    // Icon declares no `ariaLabel` property, so the native reflection writes the attribute.
    await icon.evaluate((el) => {
      el.ariaLabel = 'Home';
    });
    expect(await icon.getAttribute('aria-label')).toBe('Home');
    expect(await first()).toEqual(NAMED);
    await icon.evaluate((el) => {
      el.ariaLabel = null;
    });
    expect(await first()).toEqual(DECORATIVE);

    await icon.evaluate((el) => el.setAttribute('aria-labelledby', 'x'));
    expect(await first()).toEqual(NAMED);
    await icon.evaluate((el) => el.removeAttribute('aria-labelledby'));
    expect(await first()).toEqual(DECORATIVE);
  });
});

interface AXValue {
  value?: unknown;
}
interface AXNode {
  nodeId: string;
  ignored: boolean;
  role?: AXValue;
  name?: AXValue;
  childIds?: string[];
}

/** The accessibility node Chromium builds for the element matched by `selector`, with its descendants. */
async function axTree(cdp: CDPSession, selector: string): Promise<AXNode[]> {
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  return nodes as AXNode[];
}

async function axNode(cdp: CDPSession, selector: string): Promise<AXNode> {
  return (await axTree(cdp, selector))[0] as AXNode;
}

/** The unignored descendants Chromium exposes under the host, through the full tree. */
async function exposedDescendants(cdp: CDPSession, selector: string): Promise<string[]> {
  const host = await axNode(cdp, selector);
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AXNode[] };
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  const found: string[] = [];
  const visit = (id: string): void => {
    const node = byId.get(id);
    if (!node) {
      return;
    }
    if (!node.ignored) {
      found.push(String(node.role?.value));
    }
    for (const child of node.childIds ?? []) {
      visit(child);
    }
  };
  for (const child of byId.get(host.nodeId)?.childIds ?? []) {
    visit(child);
  }
  return found;
}

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('decorative by default; a label makes an image with that name; author attributes win', async ({ page }) => {
    await serveIcons(page);
    await open(page);
    await useRegistry(page, 'reference');
    await mount(
      page,
      `<p>Before</p>
      <span id="caption">Account settings</span>
      <line-icon id="decorative" library="lucide" name="house"></line-icon>
      <line-icon id="labelled" library="lucide" name="house" aria-label="Settings"></line-icon>
      <line-icon id="labelledby" library="lucide" name="house" aria-labelledby="caption"></line-icon>
      <line-icon id="blank" library="lucide" name="house" aria-label=" "></line-icon>
      <line-icon id="missing" library="lucide" name="definitely-not-an-icon" aria-label="Error"></line-icon>
      <line-icon id="author-hidden" library="lucide" name="house" aria-label="Hidden" aria-hidden="true"></line-icon>
      <line-icon id="author-role" library="lucide" name="house" role="graphics-symbol" aria-label="Symbol"></line-icon>
      <p>After</p>`,
    );
    for (const id of ['#decorative', '#labelled', '#labelledby', '#blank', '#author-hidden', '#author-role']) {
      await expectGlyph(page, id);
    }
    await settle(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');

    const decorative = await axNode(cdp, '#decorative');
    expect(decorative.ignored).toBe(true);
    expect(await exposedDescendants(cdp, '#decorative')).toEqual([]);

    const labelled = await axNode(cdp, '#labelled');
    expect([labelled.ignored, labelled.role?.value, labelled.name?.value]).toEqual([false, 'image', 'Settings']);
    expect(await exposedDescendants(cdp, '#labelled')).toEqual([]);

    const labelledby = await axNode(cdp, '#labelledby');
    expect([labelledby.role?.value, labelledby.name?.value]).toEqual(['image', 'Account settings']);

    expect((await axNode(cdp, '#blank')).ignored).toBe(true);

    const missing = await axNode(cdp, '#missing');
    expect([missing.role?.value, missing.name?.value]).toEqual(['image', 'Error']);

    expect((await axNode(cdp, '#author-hidden')).ignored).toBe(true);

    const authorRole = await axNode(cdp, '#author-role');
    expect([authorRole.role?.value, authorRole.name?.value]).toEqual(['graphics-symbol', 'Symbol']);
  });

  test('removing aria-label returns the host to ignored, and adding it back restores the image', async ({ page }) => {
    await serveIcons(page);
    await open(page);
    await useRegistry(page, 'reference');
    await mount(page, '<line-icon id="toggle" library="lucide" name="house" aria-label="Settings"></line-icon>');
    await expectGlyph(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    expect((await axNode(cdp, '#toggle')).role?.value).toBe('image');

    await page.locator('#toggle').evaluate((el) => el.removeAttribute('aria-label'));
    await expect.poll(async () => (await axNode(cdp, '#toggle')).ignored).toBe(true);

    await page.locator('#toggle').evaluate((el) => el.setAttribute('aria-label', 'Settings'));
    await expect
      .poll(async () => {
        const node = await axNode(cdp, '#toggle');
        return [node.ignored, node.role?.value, node.name?.value];
      })
      .toEqual([false, 'image', 'Settings']);
  });

  test('a consumer SVGElement is exposed by its own attributes; aria-hidden="true" on it hides it', async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(async (url) => {
      const fixture = (await import(url)) as Fixture;
      const variants: Record<string, Record<string, string>> = {
        plain: {},
        named: { role: 'img', 'aria-label': 'Inner' },
        hidden: { role: 'img', 'aria-label': 'Inner', 'aria-hidden': 'true' },
      };
      fixture.setIconRegistry({
        resolve: async (_library: string, name: string) => {
          const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          for (const [attribute, value] of Object.entries(variants[name] ?? {})) {
            node.setAttribute(attribute, value);
          }
          node.innerHTML = '<circle cx="5" cy="5" r="5"/>';
          return node;
        },
      });
    }, FIXTURE_MODULE);
    const hosts = ['plain', 'named', 'hidden'].flatMap((name) => [
      `<line-icon id="${name}-outer" library="custom" name="${name}" aria-label="Outer"></line-icon>`,
      `<line-icon id="${name}-decorative" library="custom" name="${name}"></line-icon>`,
    ]);
    await mount(page, hosts.join(''));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const seen: Record<string, unknown[]> = {};
    for (const name of ['plain', 'named', 'hidden']) {
      for (const kind of ['outer', 'decorative']) {
        const id = `#${name}-${kind}`;
        await expectGlyph(page, id);
        const host = await axNode(cdp, id);
        seen[id] = [host.ignored ? 'ignored' : host.role?.value, ...(await exposedDescendants(cdp, id))];
      }
    }
    // Chromium exposes a consumer `<svg>` inside a named host as its own image, so the resolver hides it with
    // `aria-hidden="true"`; a decorative host hides its whole subtree (spec 0014-icon.md AM-001).
    expect(seen).toEqual({
      '#plain-outer': ['image', 'image'],
      '#plain-decorative': ['ignored'],
      '#named-outer': ['image', 'image'],
      '#named-decorative': ['ignored'],
      '#hidden-outer': ['image'],
      '#hidden-decorative': ['ignored'],
    });
  });

  test('the glyph stays visible in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await serveIcons(page);
    await open(page);
    await useRegistry(page, 'reference');
    await mount(
      page,
      `<div style="color: rgb(200, 0, 0)"><line-icon library="lucide" name="house"></line-icon></div>
      <div id="canvas" style="background-color: Canvas"></div>`,
    );
    await expectGlyph(page);
    const { stroke, canvas } = await page.evaluate(() => ({
      stroke: getComputedStyle(
        (document.querySelector('main line-icon') as HTMLElement).shadowRoot?.querySelector('path') as Element,
      ).stroke,
      canvas: getComputedStyle(document.querySelector('#canvas') as Element).backgroundColor,
    }));
    expect(stroke).not.toBe(canvas);
    expect(stroke).not.toBe('rgb(200, 0, 0)');
  });
});
