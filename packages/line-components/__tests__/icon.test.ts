/**
 * `<line-icon>` unit tier (spec `0014-icon.md` Tests, Unit row; Phase 1 spec §6.C.3 acceptance).
 *
 * Runs on happy-dom through `bun-test-preload.ts`. The component and the registry module come from `src/`,
 * `line-core` and `line-icons` from their built `dist/` through the declared dependencies (spec §7.8 rules 1
 * and 3), so this file needs `bun run build` first, as the CI unit tier has. `fetch` is mocked: the Lucide
 * and Phosphor bases serve the installed peers, as a self-hosted base would. The SVG injection tree lives in
 * `icon-injection.test.ts`; layout, the engines' parsers and the accessibility tree live in the browser tier.
 *
 * @module __tests__/icon
 */

import { afterEach, beforeEach, describe, expect, type Mock, spyOn, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { INTERNALS } from '@websublime/line-core';
import { IconRegistry } from '@websublime/line-icons';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';
import { createPhosphorResolver } from '@websublime/line-icons/resolvers/phosphor';
import { LineIcon } from '../src/icon/index.js';
import { type LineIconRegistry, setIconRegistry } from '../src/index.js';
import type * as RegistryModule from '../src/shared/icon-registry.js';
import { ICON_REGISTRY_CHANGE, iconRegistrySlot } from '../src/shared/icon-registry.js';

const require = createRequire(import.meta.url);
const LUCIDE_DIR = join(dirname(require.resolve('lucide-static/package.json')), 'icons');
const PHOSPHOR_DIR = join(dirname(require.resolve('@phosphor-icons/core/package.json')), 'assets');

const LUCIDE_BASE = 'https://icons.test/lucide/';
const PHOSPHOR_BASE = 'https://icons.test/phosphor/';
const FILES = 'https://icons.test/files/';
const SVG_NS = 'http://www.w3.org/2000/svg';

const svgMarkup = (inner: string): string => `<svg xmlns="${SVG_NS}" viewBox="0 0 24 24">${inner}</svg>`;

/** Files `src` tests fetch from `FILES`, by name. */
const SRC_FILES: Record<string, string> = {
  'square.svg': svgMarkup('<rect x="4" y="4" width="16" height="16"/>'),
  'circle.svg': svgMarkup('<circle cx="12" cy="12" r="8"/>'),
  'not-svg.svg': '<html xmlns="http://www.w3.org/1999/xhtml"><body/></html>',
};

/** The installed peer file a base URL maps to, or `undefined`. */
function peerFile(href: string): string | undefined {
  for (const [base, dir] of [
    [LUCIDE_BASE, LUCIDE_DIR],
    [PHOSPHOR_BASE, PHOSPHOR_DIR],
  ] as const) {
    if (href.startsWith(base)) {
      try {
        return readFileSync(join(dir, href.slice(base.length)), 'utf8');
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

/**
 * The `fetch` mock: the peers under their bases, `SRC_FILES` under `FILES`, `unreadable.svg` with a body that
 * fails to read, 404 for anything else on `icons.test`, and a `TypeError` for every other origin, as a
 * network, CORS or CSP failure gives in a browser.
 */
function respond(input: string | URL | Request): Response {
  const href = input instanceof Request ? input.url : String(input);
  if (href === `${FILES}unreadable.svg`) {
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.error(new Error('body failed'));
        },
      }),
    );
  }
  const file = href.startsWith(FILES) ? SRC_FILES[href.slice(FILES.length)] : peerFile(href);
  if (file !== undefined) {
    return new Response(file, { status: 200, headers: { 'content-type': 'image/svg+xml' } });
  }
  if (href.startsWith('https://icons.test/')) {
    return new Response('Not Found', { status: 404 });
  }
  throw new TypeError('Failed to fetch');
}

let fetchMock: Mock<typeof fetch>;
const unhandled: unknown[] = [];
const recordUnhandled = (reason: unknown): void => {
  unhandled.push(reason);
};
/** Every container `mount` appended; removed after each test so no stale icon hears a registry change. */
const mounted: HTMLElement[] = [];

beforeEach(() => {
  fetchMock = spyOn(globalThis, 'fetch').mockImplementation((async (input: string | URL | Request) =>
    respond(input)) as typeof fetch);
  unhandled.length = 0;
  process.on('unhandledRejection', recordUnhandled);
});

afterEach(() => {
  for (const host of mounted.splice(0)) {
    host.remove();
  }
  fetchMock.mockRestore();
  process.off('unhandledRejection', recordUnhandled);
  setIconRegistry(undefined);
  expect(unhandled).toEqual([]);
});

/** Lets pending fetches, resolver calls and the update they trigger finish; every mock settles in microtasks. */
async function settle(el: LineIcon): Promise<void> {
  for (let turn = 0; turn < 20; turn++) {
    await Promise.resolve();
  }
  await el.updateComplete;
}

/** Builds an icon from markup and lets its first resolution settle. */
async function mount(markup = '<line-icon></line-icon>'): Promise<LineIcon> {
  const host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
  mounted.push(host);
  const el = host.querySelector('line-icon') as LineIcon;
  await settle(el);
  return el;
}

/** The root element of the glyph in the shadow root, or `null` in the empty state. */
function glyph(el: LineIcon): Element | null {
  const children = [...(el.shadowRoot?.children ?? [])];
  expect(children.length).toBeLessThanOrEqual(1);
  return children[0] ?? null;
}

function internalsOf(el: LineIcon): { role: string | null; ariaHidden: string | null } {
  const internals = Reflect.get(el, INTERNALS) as { role?: string | null; ariaHidden?: string | null } | undefined;
  return { role: internals?.role ?? null, ariaHidden: internals?.ariaHidden ?? null };
}

type ResolveArgs = [library: string, name: string, options?: { weight?: string }];

/** A registry whose calls the test settles one by one. */
class ControlledRegistry implements LineIconRegistry {
  readonly calls: { args: ResolveArgs; settle(result: string | SVGElement): void; fail(reason: unknown): void }[] = [];

  resolve(...args: ResolveArgs): Promise<string | SVGElement> {
    const { promise, resolve, reject } = Promise.withResolvers<string | SVGElement>();
    this.calls.push({ args, settle: resolve, fail: reject });
    return promise;
  }
}

/** A registry that answers every call with `result`, recording the arguments. */
function answering(result: (args: ResolveArgs) => unknown): LineIconRegistry & { calls: ResolveArgs[] } {
  const calls: ResolveArgs[] = [];
  return {
    calls,
    resolve: (...args: ResolveArgs) => {
      calls.push(args);
      return Promise.resolve(result(args) as string | SVGElement);
    },
  };
}

/** The `line-icons` registry with both reference resolvers on the mocked bases. */
function referenceRegistry(): IconRegistry {
  const registry = new IconRegistry();
  registry.register('lucide', createLucideResolver({ base: LUCIDE_BASE }));
  registry.register('phosphor', createPhosphorResolver({ base: PHOSPHOR_BASE }));
  return registry;
}

describe('<line-icon> defaults and reflection', () => {
  test('registers line-icon with the LineIcon class', () => {
    expect(customElements.get('line-icon')).toBe(LineIcon);
  });

  test('defaults to no source, mirror off and the empty state', async () => {
    const el = await mount();
    expect([el.name, el.library, el.weight, el.src, el.path, el.mirror]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false,
    ]);
    expect(glyph(el)).toBeNull();
  });

  test('writes no attribute for an unset prop', async () => {
    const el = await mount();
    expect(el.getAttributeNames()).toEqual([]);
  });

  test('reflects every attribute prop set from script; path has no attribute', async () => {
    const el = await mount();
    el.name = 'house';
    el.library = 'lucide';
    el.weight = 'bold';
    el.mirror = true;
    el.src = `${FILES}square.svg`;
    el.path = 'M0 0h24v24H0z';
    await el.updateComplete;
    expect(Object.fromEntries(el.getAttributeNames().map((name) => [name, el.getAttribute(name)]))).toEqual({
      name: 'house',
      library: 'lucide',
      weight: 'bold',
      mirror: '',
      src: `${FILES}square.svg`,
    });
  });

  test('attributes set the properties, and removing them unsets them', async () => {
    const el = await mount('<line-icon name="x" library="lucide" weight="fill" mirror src="/a.svg"></line-icon>');
    expect([el.name, el.library, el.weight, el.mirror, el.src]).toEqual(['x', 'lucide', 'fill', true, '/a.svg']);
    for (const name of ['name', 'library', 'weight', 'mirror', 'src']) {
      el.removeAttribute(name);
    }
    await el.updateComplete;
    expect([el.name, el.library, el.weight, el.mirror, el.src]).toEqual([null, null, null, false, null]);
    expect(el.getAttributeNames()).toEqual([]);
  });

  test('the static registry getter reads what setIconRegistry wrote', () => {
    const registry = referenceRegistry();
    setIconRegistry(registry);
    expect(LineIcon.registry).toBe(registry);
    setIconRegistry(undefined);
    expect(LineIcon.registry).toBeUndefined();
  });
});

describe('<line-icon> path', () => {
  test('draws path data in a 24 × 24 box filled with the text colour', async () => {
    const el = await mount();
    el.path = 'M12 2 L22 22 L2 22 Z';
    await el.updateComplete;
    const svg = glyph(el);
    expect(svg?.namespaceURI).toBe(SVG_NS);
    expect(svg?.localName).toBe('svg');
    expect(Object.fromEntries([...(svg?.attributes ?? [])].map((a) => [a.name, a.value]))).toEqual({
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      part: 'svg',
      'aria-hidden': 'true',
    });
    const shapes = [...(svg?.children ?? [])];
    expect(shapes.map((shape) => [shape.namespaceURI, shape.localName, shape.getAttribute('d')])).toEqual([
      [SVG_NS, 'path', 'M12 2 L22 22 L2 22 Z'],
    ]);
  });

  test('sets d through setAttribute, so markup in the path stays attribute text', async () => {
    const el = await mount();
    const hostile = 'M0 0"><script>globalThis.__iconInjected = true</script><path d="';
    el.path = hostile;
    await el.updateComplete;
    const svg = glyph(el);
    expect(svg?.querySelectorAll('script').length).toBe(0);
    expect(svg?.children.length).toBe(1);
    expect(svg?.firstElementChild?.getAttribute('d')).toBe(hostile);
    expect(Reflect.get(globalThis, '__iconInjected')).toBeUndefined();
  });

  test('an empty path counts as unset', async () => {
    const el = await mount();
    el.path = '';
    await el.updateComplete;
    expect(glyph(el)).toBeNull();
  });
});

describe('<line-icon> source precedence', () => {
  test('path wins over src and name, and src wins over name', async () => {
    const registry = answering(() => svgMarkup('<circle cx="1" cy="1" r="1"/>'));
    setIconRegistry(registry);
    const el = await mount(`<line-icon src="${FILES}square.svg" name="house" library="lucide"></line-icon>`);
    expect(glyph(el)?.firstElementChild?.localName).toBe('rect');
    expect(registry.calls).toEqual([]);

    el.path = 'M0 0';
    await settle(el);
    expect(glyph(el)?.firstElementChild?.localName).toBe('path');
    expect(fetchMock.mock.calls.length).toBe(1);

    el.path = undefined;
    el.src = undefined;
    await settle(el);
    expect(glyph(el)?.firstElementChild?.localName).toBe('circle');
    expect(registry.calls).toEqual([['lucide', 'house']]);
  });

  test('a failed src does not fall back to the registry', async () => {
    const registry = answering(() => svgMarkup('<circle cx="1" cy="1" r="1"/>'));
    setIconRegistry(registry);
    const el = await mount(`<line-icon src="${FILES}missing.svg" name="house" library="lucide"></line-icon>`);
    expect(glyph(el)).toBeNull();
    expect(registry.calls).toEqual([]);
  });

  test('name without library and library without name stay empty and never ask the registry', async () => {
    const registry = answering(() => svgMarkup('<circle cx="1" cy="1" r="1"/>'));
    setIconRegistry(registry);
    for (const markup of [
      '<line-icon name="house"></line-icon>',
      '<line-icon library="lucide"></line-icon>',
      '<line-icon name="" library="lucide"></line-icon>',
      '<line-icon name="house" library=""></line-icon>',
    ]) {
      const el = await mount(markup);
      expect(glyph(el)).toBeNull();
    }
    expect(registry.calls).toEqual([]);
  });

  test('weight reaches the registry as options.weight, and no options are passed without it', async () => {
    const registry = answering(() => svgMarkup('<circle cx="1" cy="1" r="1"/>'));
    setIconRegistry(registry);
    const el = await mount('<line-icon name="heart" library="phosphor"></line-icon>');
    el.weight = 'fill';
    await settle(el);
    el.weight = '';
    await settle(el);
    expect(registry.calls).toEqual([
      ['phosphor', 'heart'],
      ['phosphor', 'heart', { weight: 'fill' }],
      ['phosphor', 'heart'],
    ]);
    expect(registry.calls.map((args) => args.length)).toEqual([2, 3, 2]);
  });

  test('library="phosphor" name="heart" weight="fill" renders the fill file', async () => {
    setIconRegistry(referenceRegistry());
    const el = await mount('<line-icon library="phosphor" name="heart" weight="fill"></line-icon>');
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([`${PHOSPHOR_BASE}fill/heart-fill.svg`]);
    const expected = new DOMParser()
      .parseFromString(readFileSync(join(PHOSPHOR_DIR, 'fill/heart-fill.svg'), 'utf8'), 'image/svg+xml')
      .querySelector('path')
      ?.getAttribute('d');
    expect(glyph(el)?.querySelector('path')?.getAttribute('d')).toBe(expected as string);
  });

  test('Lucide house renders through the reference registry', async () => {
    setIconRegistry(referenceRegistry());
    const el = await mount('<line-icon library="lucide" name="house"></line-icon>');
    const svg = glyph(el);
    expect(svg?.getAttribute('class')).toBe('lucide lucide-house');
    expect(svg?.querySelectorAll('path').length).toBe(2);
  });
});

describe('<line-icon> request order', () => {
  test('the newest request wins over a stale one that settles later', async () => {
    const registry = new ControlledRegistry();
    setIconRegistry(registry);
    const el = await mount('<line-icon library="set" name="first"></line-icon>');
    el.name = 'second';
    await settle(el);
    expect(registry.calls.map((call) => call.args[1])).toEqual(['first', 'second']);
    registry.calls[1]?.settle(svgMarkup('<circle cx="2" cy="2" r="2"/>'));
    await settle(el);
    registry.calls[0]?.settle(svgMarkup('<rect x="1" y="1" width="1" height="1"/>'));
    await settle(el);
    expect(glyph(el)?.firstElementChild?.localName).toBe('circle');
  });

  test('the shown glyph stays until the newest request settles, then a failure clears it', async () => {
    const registry = new ControlledRegistry();
    setIconRegistry(registry);
    const el = await mount('<line-icon library="set" name="first"></line-icon>');
    registry.calls[0]?.settle(svgMarkup('<rect x="1" y="1" width="1" height="1"/>'));
    await settle(el);
    const shown = glyph(el);
    expect(shown?.firstElementChild?.localName).toBe('rect');

    el.name = 'second';
    await settle(el);
    expect(glyph(el)).toBe(shown);
    registry.calls[1]?.fail(new Error('[line-icons] missing'));
    await settle(el);
    expect(glyph(el)).toBeNull();
  });

  test('a change that leaves no source clears the glyph at once', async () => {
    const el = await mount(`<line-icon src="${FILES}square.svg"></line-icon>`);
    expect(glyph(el)).not.toBeNull();
    el.src = undefined;
    await el.updateComplete;
    expect(glyph(el)).toBeNull();
  });

  test('a path set while a fetch is pending wins over the late response', async () => {
    const el = await mount();
    el.src = `${FILES}square.svg`;
    el.path = undefined;
    await el.updateComplete;
    el.path = 'M0 0';
    await settle(el);
    expect(glyph(el)?.firstElementChild?.localName).toBe('path');
  });
});

describe('<line-icon> miss paths', () => {
  /** Each `[line-icons]` throw site of `IconRegistry.resolve` and the reference resolvers. */
  const THROW_SITES: [string, () => IconRegistry, string, string, string?][] = [
    ['registry.ts:21, no resolver for the library', () => new IconRegistry(), 'lucide', 'house'],
    ['icon-name.ts:5, an invalid name', referenceRegistry, 'lucide', '../etc/passwd'],
    ['phosphor.ts:24, an unknown weight', referenceRegistry, 'phosphor', 'heart', 'heavy'],
    [
      'fetch-icon.ts:13, a resolver created without base',
      () => {
        const registry = new IconRegistry();
        registry.register('lucide', createLucideResolver(undefined as unknown as { base: string }));
        return registry;
      },
      'lucide',
      'house',
    ],
    [
      'fetch-icon.ts:19, an invalid base',
      () => {
        const registry = new IconRegistry();
        registry.register('lucide', createLucideResolver({ base: 'http://[' }));
        return registry;
      },
      'lucide',
      'house',
    ],
    [
      'fetch-icon.ts:26, a network failure',
      () => {
        const registry = new IconRegistry();
        registry.register('lucide', createLucideResolver({ base: 'https://offline.test/' }));
        return registry;
      },
      'lucide',
      'house',
    ],
    ['fetch-icon.ts:28, a 404', referenceRegistry, 'lucide', 'definitely-not-an-icon'],
    [
      'fetch-icon.ts:32, an unreadable body',
      () => {
        const registry = new IconRegistry();
        registry.register('files', createLucideResolver({ base: FILES }));
        return registry;
      },
      'files',
      'unreadable',
    ],
  ];

  for (const [site, makeRegistry, library, name, weight] of THROW_SITES) {
    test(`${site} leaves the empty state with no uncaught error`, async () => {
      const registry = makeRegistry();
      await expect(registry.resolve(library, name, weight ? { weight } : undefined)).rejects.toThrow('[line-icons]');
      setIconRegistry(registry);
      const el = await mount(
        `<line-icon library="${library}" name="${name}"${weight ? ` weight="${weight}"` : ''}></line-icon>`,
      );
      expect(glyph(el)).toBeNull();
    });
  }

  test('a name icon with no registry stays empty', async () => {
    const el = await mount('<line-icon library="lucide" name="house"></line-icon>');
    expect(LineIcon.registry).toBeUndefined();
    expect(glyph(el)).toBeNull();
  });

  for (const [label, registry] of [
    ['a registry without resolve', {} as LineIconRegistry],
    ['a resolve that is not a function', { resolve: 'nope' } as unknown as LineIconRegistry],
    [
      'a synchronous throw',
      {
        resolve: () => {
          throw new Error('sync');
        },
      } as LineIconRegistry,
    ],
    ['a rejection', { resolve: () => Promise.reject(new Error('async')) } as LineIconRegistry],
    ['a number result', answering(() => 42)],
    ['a null result', answering(() => null)],
    ['an object result', answering(() => ({ outerHTML: '<svg/>' }))],
    ['an HTML element result', answering(() => document.createElement('span'))],
    ['a string that is not SVG', answering(() => '<div>nope</div>')],
    ['an SVG string without the SVG namespace', answering(() => '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>')],
  ] as const) {
    test(`${label} leaves the empty state with no uncaught error`, async () => {
      setIconRegistry(registry);
      const el = await mount('<line-icon library="lucide" name="house"></line-icon>');
      expect(glyph(el)).toBeNull();
    });
  }

  test('a source that fails after a glyph clears it', async () => {
    setIconRegistry(answering(([, name]) => (name === 'ok' ? svgMarkup('<circle cx="1" cy="1" r="1"/>') : 7)));
    const el = await mount('<line-icon library="lucide" name="ok"></line-icon>');
    expect(glyph(el)).not.toBeNull();
    el.name = 'bad';
    await settle(el);
    expect(glyph(el)).toBeNull();
  });
});

describe('<line-icon> src', () => {
  test('an ok response renders through the injection step', async () => {
    const el = await mount(`<line-icon src="${FILES}square.svg"></line-icon>`);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([`${FILES}square.svg`]);
    const svg = glyph(el);
    expect(svg?.getAttribute('part')).toBe('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.firstElementChild?.localName).toBe('rect');
  });

  for (const [label, src] of [
    ['a 404', `${FILES}missing.svg`],
    ['a network error', 'https://offline.test/a.svg'],
    ['an unreadable body', `${FILES}unreadable.svg`],
    ['a document that is not SVG', `${FILES}not-svg.svg`],
    ['an invalid URL', 'http://['],
    ['a relative URL against about:blank', 'icons/a.svg'],
  ] as const) {
    test(`${label} leaves the empty state with no uncaught error`, async () => {
      const el = await mount(`<line-icon src="${src}"></line-icon>`);
      expect(glyph(el)).toBeNull();
    });
  }

  test('changing src fetches the new file', async () => {
    const el = await mount(`<line-icon src="${FILES}square.svg"></line-icon>`);
    el.src = `${FILES}circle.svg`;
    await settle(el);
    expect(glyph(el)?.firstElementChild?.localName).toBe('circle');
  });
});

describe('<line-icon> SVGElement results', () => {
  test('an SVGElement is inserted as the same node with no attribute changed', async () => {
    const node = document.createElementNS(SVG_NS, 'svg');
    node.setAttribute('viewBox', '0 0 10 10');
    node.setAttribute('data-own', 'kept');
    node.setAttribute('style', 'color: red');
    node.append(document.createElementNS(SVG_NS, 'foreignObject'));
    const before = node.getAttributeNames().map((name) => [name, node.getAttribute(name)]);
    setIconRegistry(answering(() => node));
    const el = await mount('<line-icon library="custom" name="any"></line-icon>');
    expect(glyph(el)).toBe(node);
    expect(node.getAttributeNames().map((name) => [name, node.getAttribute(name)])).toEqual(before);
    expect(node.hasAttribute('part')).toBe(false);
    expect(node.hasAttribute('aria-hidden')).toBe(false);
    expect(node.firstElementChild?.localName).toBe('foreignObject');
  });
});

describe('<line-icon> registry changes', () => {
  test('a connected empty icon renders after setIconRegistry, and again after LineIcon.registry', async () => {
    const el = await mount('<line-icon library="lucide" name="house"></line-icon>');
    expect(glyph(el)).toBeNull();

    setIconRegistry(referenceRegistry());
    await settle(el);
    expect(glyph(el)?.getAttribute('class')).toBe('lucide lucide-house');

    LineIcon.registry = answering(() => svgMarkup('<circle cx="1" cy="1" r="1"/>'));
    await settle(el);
    expect(glyph(el)?.firstElementChild?.localName).toBe('circle');
  });

  test('a setter in a second copy of the registry module reaches a connected icon', async () => {
    // A query suffix makes Bun load the module again, so this copy shares nothing with `src/` but the global slot.
    const copy = (await import('../src/shared/icon-registry.ts?second-copy')) as typeof RegistryModule;
    expect(copy.setIconRegistry).not.toBe(setIconRegistry);
    const el = await mount('<line-icon library="lucide" name="house"></line-icon>');
    copy.setIconRegistry(referenceRegistry());
    await settle(el);
    expect(glyph(el)?.getAttribute('class')).toBe('lucide lucide-house');
    expect(LineIcon.registry).toBe(copy.iconRegistrySlot().registry);
  });

  test('every setter dispatches line-icon-registry-change on the slot events', async () => {
    expect(ICON_REGISTRY_CHANGE).toBe('line-icon-registry-change');
    const seen: string[] = [];
    const listener = (event: Event): void => {
      seen.push(event.type);
    };
    iconRegistrySlot().events.addEventListener('line-icon-registry-change', listener);
    setIconRegistry(referenceRegistry());
    LineIcon.registry = undefined;
    iconRegistrySlot().events.removeEventListener('line-icon-registry-change', listener);
    expect(seen).toEqual(['line-icon-registry-change', 'line-icon-registry-change']);
  });

  test('setIconRegistry(undefined) returns name icons to the empty state and leaves path icons', async () => {
    setIconRegistry(referenceRegistry());
    const named = await mount('<line-icon library="lucide" name="house"></line-icon>');
    const drawn = await mount('<line-icon></line-icon>');
    drawn.path = 'M0 0';
    await drawn.updateComplete;
    const path = glyph(drawn);
    expect(glyph(named)).not.toBeNull();
    setIconRegistry(undefined);
    await settle(named);
    expect(glyph(named)).toBeNull();
    expect(glyph(drawn)).toBe(path);
  });

  test('a registry change does not refetch a src icon', async () => {
    const el = await mount(`<line-icon src="${FILES}square.svg" name="house" library="lucide"></line-icon>`);
    setIconRegistry(referenceRegistry());
    await settle(el);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([`${FILES}square.svg`]);
  });

  test('a disconnected icon ignores registry changes and resolves again on connect', async () => {
    const registry = answering(() => svgMarkup('<circle cx="1" cy="1" r="1"/>'));
    const el = await mount('<line-icon library="lucide" name="house"></line-icon>');
    const parent = el.parentElement as HTMLElement;
    el.remove();
    setIconRegistry(registry);
    await settle(el);
    expect(registry.calls).toEqual([]);
    expect(glyph(el)).toBeNull();

    parent.append(el);
    await settle(el);
    expect(registry.calls).toEqual([['lucide', 'house']]);
    expect(glyph(el)?.firstElementChild?.localName).toBe('circle');
  });
});

describe('<line-icon> internals', () => {
  for (const [markup, expected] of [
    ['<line-icon></line-icon>', { role: null, ariaHidden: 'true' }],
    ['<line-icon aria-label="Settings"></line-icon>', { role: 'img', ariaHidden: null }],
    ['<line-icon aria-labelledby="caption"></line-icon>', { role: 'img', ariaHidden: null }],
    ['<line-icon aria-label=" "></line-icon>', { role: null, ariaHidden: 'true' }],
    ['<line-icon aria-label=""></line-icon>', { role: null, ariaHidden: 'true' }],
    ['<line-icon aria-labelledby=""></line-icon>', { role: null, ariaHidden: 'true' }],
    ['<line-icon aria-label=" " aria-labelledby="caption"></line-icon>', { role: 'img', ariaHidden: null }],
    ['<line-icon library="lucide" name="nope" aria-label="Error"></line-icon>', { role: 'img', ariaHidden: null }],
  ] as const) {
    test(`${markup} sets ${JSON.stringify(expected)}`, async () => {
      const el = await mount(markup);
      expect(internalsOf(el)).toEqual(expected);
    });
  }

  test('adding and removing aria-label or aria-labelledby updates the internals', async () => {
    const el = await mount();
    el.setAttribute('aria-label', 'Settings');
    expect(internalsOf(el)).toEqual({ role: 'img', ariaHidden: null });
    el.setAttribute('aria-label', '  ');
    expect(internalsOf(el)).toEqual({ role: null, ariaHidden: 'true' });
    el.setAttribute('aria-label', 'Settings');
    el.removeAttribute('aria-label');
    expect(internalsOf(el)).toEqual({ role: null, ariaHidden: 'true' });
    el.setAttribute('aria-labelledby', 'caption');
    expect(internalsOf(el)).toEqual({ role: 'img', ariaHidden: null });
    el.removeAttribute('aria-labelledby');
    expect(internalsOf(el)).toEqual({ role: null, ariaHidden: 'true' });
  });
});

describe('<line-icon> shadow tree and host', () => {
  test('light-DOM children are not rendered through a slot', async () => {
    const el = await mount('<line-icon><span>ignored</span></line-icon>');
    expect(el.shadowRoot?.querySelector('slot')).toBeNull();
    expect(glyph(el)).toBeNull();
  });

  test('writes no role, aria-* or data-* attribute on the host', async () => {
    setIconRegistry(referenceRegistry());
    const el = await mount('<line-icon library="lucide" name="house" mirror></line-icon>');
    el.setAttribute('aria-label', 'Home');
    el.path = 'M0 0';
    await settle(el);
    expect(el.hasAttribute('role')).toBe(false);
    expect(
      el
        .getAttributeNames()
        .filter((name) => (name.startsWith('aria-') && name !== 'aria-label') || name.startsWith('data-')),
    ).toEqual([]);
  });

  test('leaves an author role and aria-hidden unchanged', async () => {
    const el = await mount('<line-icon role="graphics-symbol" aria-hidden="true" aria-label="Home"></line-icon>');
    el.removeAttribute('aria-label');
    await settle(el);
    expect(el.getAttribute('role')).toBe('graphics-symbol');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  test('dispatches no event on the host for any outcome', async () => {
    const dispatch = spyOn(LineIcon.prototype, 'dispatchEvent');
    try {
      setIconRegistry(referenceRegistry());
      const el = await mount('<line-icon library="lucide" name="house"></line-icon>');
      el.name = 'definitely-not-an-icon';
      await settle(el);
      el.src = `${FILES}missing.svg`;
      await settle(el);
      el.path = 'M0 0';
      await settle(el);
      expect(dispatch).not.toHaveBeenCalled();
    } finally {
      dispatch.mockRestore();
    }
  });
});
