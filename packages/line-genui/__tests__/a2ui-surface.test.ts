/**
 * `<line-a2ui-surface>` in the unit tier (Phase 1 spec §6.G.4; ledger 01-G4). The browser tier
 * (`a2ui-surface.e2e.ts`) holds axe, `::part()`, the icon registry and focus across reorders in three engines.
 *
 * - The surface extends `HTMLElement`, renders in its light DOM and keeps only its live region in its shadow root.
 * - Basic mapping: each of the 10 mapped types renders its target; an unmapped basic type and an unknown type
 *   render an inert placeholder and raise `line-a2ui-error`; a pending child stays hidden without an error.
 * - A message with the `line` catalog id renders its components.
 * - Accessibility: required names before render, the trim rule, the `hostNaming` exceptions with Separator's
 *   `decorative` binding, List roles, Button text in `<span>`, the live region texts, `aria-busy` per batch.
 * - Icon: `iconMap` lookups with `Object.hasOwn`, re-projection on set and replace, `path` over `name`.
 * - URLs, Markdown and theme hints.
 * - Every emitted message validates against `client_to_server.json`.
 *
 * @module __tests__/a2ui-surface
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { a2uiIconMap } from '@websublime/line-icons/a2ui';
import { LineA2uiSurface } from '../src/a2ui/index.js';
import { BASIC_CATALOG_ID, LINE_CATALOG_ID } from '../src/catalog/index.js';
import {
  action,
  checkClientMessage,
  components,
  create,
  data,
  invalidMessages,
  liveText,
  type Message,
  message,
  mount,
  SURFACE,
  text,
  tick,
} from './a2ui-fixture.js';

afterEach(() => {
  expect(invalidMessages).toEqual([]);
  for (const surface of document.querySelectorAll('line-a2ui-surface')) surface.remove();
});

/** Mounts a surface, creates the surface on `catalogId` and feeds `list` as one `updateComponents`. */
async function render(list: Message[], options: { catalogId?: string; attributes?: Record<string, string> } = {}) {
  const mounted = mount(options.attributes);
  await mounted.feed(create(options.catalogId), components(list));
  return mounted;
}

const codes = (errors: { error: { code: string } }[]) => errors.map((e) => e.error.code);

describe('element (§6.G.4 Projection and messages)', () => {
  test('extends HTMLElement, not LitElement, and renders in its light DOM', async () => {
    const { surface } = await render([text('root', 'Hello')]);
    expect(surface).toBeInstanceOf(LineA2uiSurface);
    expect(Object.getPrototypeOf(LineA2uiSurface.prototype)).toBe(HTMLElement.prototype);
    expect(surface.innerHTML).toBe('<p>Hello</p>');
    const shadow = [...(surface.shadowRoot?.children ?? [])].map((child) => child.localName);
    expect(shadow).toEqual(['style', 'div', 'slot']);
    expect(surface.shadowRoot?.querySelectorAll('[role="status"]')).toHaveLength(1);
  });

  test('aria-busy covers the batch until it settles', async () => {
    const { surface, session } = mount();
    const busy: (string | null)[] = [];
    session.process([create(), components([text('root', 'x')])], SURFACE);
    busy.push(surface.getAttribute('aria-busy'));
    await surface.settled();
    busy.push(surface.getAttribute('aria-busy'));
    expect(busy).toEqual(['true', null]);
  });

  test('agent theme hints are ignored', async () => {
    const { feed, surface, errors } = mount();
    await feed(
      message({
        createSurface: {
          surfaceId: SURFACE,
          catalogId: BASIC_CATALOG_ID,
          theme: { primaryColor: '#ff0000' },
        },
      }),
      components([text('root', 'x')]),
    );
    expect(errors).toEqual([]);
    expect(surface.getAttribute('style')).toBeNull();
    expect(surface.innerHTML).toBe('<p>x</p>');
  });
});

describe('basic mapping (§6.G.4 Basic mapping; ARCH §17.3)', () => {
  test('each mapped basic type renders its target', async () => {
    const { surface, errors } = await render([
      {
        id: 'root',
        component: 'Column',
        children: ['h1', 'cap', 'body', 'img', 'vid', 'aud', 'icon', 'row', 'list', 'div', 'btn'],
      },
      text('h1', 'Title', { variant: 'h1' }),
      text('cap', 'Caption', { variant: 'caption' }),
      text('body', 'Body'),
      { id: 'img', component: 'Image', url: 'https://example.com/a.png', description: 'A picture' },
      { id: 'vid', component: 'Video', url: 'https://example.com/a.mp4' },
      { id: 'aud', component: 'AudioPlayer', url: 'https://example.com/a.mp3', description: 'A song' },
      { id: 'icon', component: 'Icon', name: { svgPath: 'M0 0L24 24' } },
      { id: 'row', component: 'Row', justify: 'spaceBetween', align: 'center', children: ['r1'] },
      text('r1', 'In a row'),
      { id: 'list', component: 'List', direction: 'horizontal', children: ['l1'] },
      text('l1', 'Item'),
      { id: 'div', component: 'Divider', axis: 'vertical' },
      { id: 'btn', component: 'Button', variant: 'primary', child: 'bl', action: action('go') },
      text('bl', 'Go'),
    ]);
    expect(errors).toEqual([]);
    const root = surface.firstElementChild as Element;
    expect(root.outerHTML.startsWith('<line-stack orientation="vertical">')).toBe(true);
    const kids = [...root.children];
    expect(kids.map((kid) => kid.localName)).toEqual([
      'h1',
      'small',
      'p',
      'img',
      'video',
      'audio',
      'line-icon',
      'line-stack',
      'line-stack',
      'line-separator',
      'line-button',
    ]);
    expect(kids[3]?.getAttribute('src')).toBe('https://example.com/a.png');
    expect(kids[3]?.getAttribute('alt')).toBe('A picture');
    expect(kids[5]?.hasAttribute('controls')).toBe(true);
    expect((kids[6] as unknown as { path: string }).path).toBe('M0 0L24 24');
    expect(kids[7]?.outerHTML).toBe(
      '<line-stack justify="spaceBetween" align="center" orientation="horizontal"><p>In a row</p></line-stack>',
    );
    expect(kids[8]?.getAttribute('role')).toBe('list');
    expect(kids[8]?.getAttribute('orientation')).toBe('horizontal');
    expect(kids[9]?.getAttribute('orientation')).toBe('vertical');
    expect(kids[10]?.outerHTML).toBe('<line-button variant="primary"><span>Go</span></line-button>');
  });

  test('each unmapped basic type renders an inert placeholder and raises one error', async () => {
    const { surface, errors } = await render([
      { id: 'root', component: 'Column', children: ['ok', 'field', 'check'] },
      text('ok', 'Kept'),
      { id: 'field', component: 'TextField', label: 'Name' },
      { id: 'check', component: 'CheckBox', label: 'Yes', value: true },
    ]);
    const placeholders = surface.querySelectorAll('[data-line-a2ui-placeholder="unknown-type"]');
    expect(placeholders).toHaveLength(2);
    expect([...placeholders].every((p) => (p as HTMLElement).inert)).toBe(true);
    expect(codes(errors)).toEqual(['UNKNOWN_COMPONENT_TYPE', 'UNKNOWN_COMPONENT_TYPE']);
    expect(surface.querySelector('p')?.textContent).toBe('Kept');
  });

  test('a pending child shows nothing and raises no error until it arrives', async () => {
    const { feed, surface, errors } = mount();
    await feed(create(), components([{ id: 'root', component: 'Column', children: ['later'] }]));
    const pending = surface.querySelector('[data-line-a2ui-placeholder="pending"]') as HTMLElement;
    expect(pending.hidden).toBe(true);
    expect(errors).toEqual([]);
    await feed(components([text('later', 'Arrived')]));
    expect(surface.querySelector('[data-line-a2ui-placeholder]')).toBeNull();
    expect(surface.querySelector('p')?.textContent).toBe('Arrived');
    expect(errors).toEqual([]);
  });

  test('a bound value re-renders in place', async () => {
    const { feed, surface } = mount();
    await feed(create(), components([text('root', { path: '/msg' })]), data('/msg', 'one'));
    const p = surface.querySelector('p');
    await feed(data('/msg', 'two'));
    expect(surface.querySelector('p')).toBe(p);
    expect(p?.textContent).toBe('two');
  });
});

describe('the line catalog (§6.G.2; §10 SD42)', () => {
  test('a message with the line catalog id renders its components', async () => {
    const { surface, errors } = await render(
      [
        { id: 'root', component: 'Stack', orientation: 'horizontal', gap: '2', children: ['b', 's', 'i'] },
        { id: 'b', component: 'Button', accessibility: { label: 'Close' }, child: 'bi', action: action('close') },
        { id: 'bi', component: 'Icon', path: 'M1 1' },
        { id: 's', component: 'Separator', orientation: 'vertical' },
        { id: 'i', component: 'Icon', path: 'M2 2', mirror: true },
      ],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(errors).toEqual([]);
    expect(surface.innerHTML).toBe(
      '<line-stack orientation="horizontal" gap="2">' +
        '<line-button aria-label="Close"><line-icon></line-icon></line-button>' +
        '<line-separator orientation="vertical"></line-separator>' +
        '<line-icon mirror=""></line-icon></line-stack>',
    );
  });
});

describe('accessibility (§6.G.4 Accessibility)', () => {
  test('a List carries role="list"; a line-stack item takes role="listitem", others a wrapper', async () => {
    const { surface } = await render([
      { id: 'root', component: 'List', children: ['row', 't'] },
      { id: 'row', component: 'Row', children: ['rt'] },
      text('rt', 'In a row'),
      text('t', 'Plain'),
    ]);
    expect(surface.innerHTML).toBe(
      '<line-stack role="list"><line-stack role="listitem" orientation="horizontal"><p>In a row</p></line-stack>' +
        '<div role="listitem"><p>Plain</p></div></line-stack>',
    );
  });

  test('Button text renders in a <span>', async () => {
    const { surface } = await render([
      { id: 'root', component: 'Button', child: 't', action: action('x') },
      text('t', 'Send', { variant: 'h2' }),
    ]);
    expect(surface.innerHTML).toBe('<line-button><span>Send</span></line-button>');
  });

  test('accessibility.label and .description become aria-label and aria-description on a Button', async () => {
    const { surface } = await render([
      {
        id: 'root',
        component: 'Button',
        child: 't',
        action: action('x'),
        accessibility: { label: 'Send the mail', description: 'Sends it now' },
      },
      text('t', 'Send'),
    ]);
    const button = surface.querySelector('line-button');
    expect(button?.getAttribute('aria-label')).toBe('Send the mail');
    expect(button?.getAttribute('aria-description')).toBe('Sends it now');
  });

  test('a node without a required name renders a placeholder and raises an error', async () => {
    const { surface, errors } = await render([{ id: 'root', component: 'Button', action: action('x') }], {
      catalogId: LINE_CATALOG_ID,
    });
    expect(surface.querySelector('line-button')).toBeNull();
    expect((surface.querySelector('[data-line-a2ui-placeholder="missing-name"]') as HTMLElement).inert).toBe(true);
    expect(codes(errors)).toEqual(['MISSING_ACCESSIBLE_NAME']);
    expect(errors[0]?.error.componentId).toBe('root');
  });

  test('an accessibility.label of " " sets no aria-label and does not name a node that requires one', async () => {
    const { surface, errors } = await render(
      [
        { id: 'root', component: 'Stack', children: ['sep', 'btn'] },
        { id: 'sep', component: 'Separator', accessibility: { label: ' ' } },
        { id: 'btn', component: 'Button', accessibility: { label: ' ' }, action: action('x') },
      ],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(surface.querySelector('line-separator')?.hasAttribute('aria-label')).toBe(false);
    expect(surface.querySelector('[data-line-a2ui-placeholder="missing-name"]')).not.toBeNull();
    expect(codes(errors)).toEqual(['MISSING_ACCESSIBLE_NAME']);
  });

  test('a basic Button named by a blank child text is a placeholder until the text arrives', async () => {
    const { feed, surface, errors } = mount();
    await feed(
      create(),
      components([{ id: 'root', component: 'Button', child: 't', action: action('x') }, text('t', { path: '/l' })]),
    );
    expect(codes(errors)).toEqual(['MISSING_ACCESSIBLE_NAME']);
    await feed(data('/l', 'Now named'));
    expect(surface.innerHTML).toBe('<line-button><span>Now named</span></line-button>');
    expect(codes(errors)).toEqual(['MISSING_ACCESSIBLE_NAME']);
  });

  test('a Stack sets no host aria-label, unless it renders an A2UI List', async () => {
    const line = await render([{ id: 'root', component: 'Stack', accessibility: { label: 'Group' }, children: [] }], {
      catalogId: LINE_CATALOG_ID,
    });
    expect(line.surface.querySelector('line-stack')?.hasAttribute('aria-label')).toBe(false);
    const basic = await render([
      { id: 'root', component: 'Column', children: ['list', 'row'] },
      { id: 'list', component: 'List', accessibility: { label: 'Results' }, children: [] },
      { id: 'row', component: 'Row', accessibility: { label: 'Toolbar' }, children: [] },
    ]);
    const [list, row] = [...basic.surface.querySelectorAll('line-stack line-stack')];
    expect(list?.getAttribute('aria-label')).toBe('Results');
    expect(row?.hasAttribute('aria-label')).toBe(false);
    expect(basic.surface.firstElementChild?.hasAttribute('aria-label')).toBe(false);
  });

  test('a Separator drops and regains its label as its bound decorative value changes', async () => {
    const { feed, surface } = mount();
    await feed(
      create(LINE_CATALOG_ID),
      components([
        { id: 'root', component: 'Separator', decorative: { path: '/d' }, accessibility: { label: 'Section' } },
      ]),
      data('/d', true),
    );
    const separator = surface.querySelector('line-separator');
    expect(separator?.hasAttribute('aria-label')).toBe(false);
    expect(separator?.hasAttribute('decorative')).toBe(true);
    await feed(data('/d', false));
    expect(separator?.getAttribute('aria-label')).toBe('Section');
    expect(separator?.hasAttribute('decorative')).toBe(false);
    await feed(data('/d', true));
    expect(separator?.hasAttribute('aria-label')).toBe(false);
  });

  test('the live region announces the default texts once per batch', async () => {
    const { feed, surface } = mount();
    await feed(create(), components([text('root', 'x')]));
    expect(await liveText(surface)).toBe('Content updated.');
    await feed(create());
    expect(await liveText(surface)).toBe('Some content could not be shown.');
  });

  test('the live region announces the configured texts', async () => {
    const { feed, surface } = mount({ 'live-update-text': 'Mis à jour.', 'live-error-text': 'Erreur.' });
    expect([surface.liveUpdateText, surface.liveErrorText]).toEqual(['Mis à jour.', 'Erreur.']);
    await feed(create(), components([text('root', 'x')]));
    expect(await liveText(surface)).toBe('Mis à jour.');
    await feed(create());
    expect(await liveText(surface)).toBe('Erreur.');
  });

  test('a batch that changes nothing announces nothing', async () => {
    const { feed, surface } = mount();
    await feed(create(), components([text('root', { path: '/m' })]), data('/m', 'same'));
    await liveText(surface);
    surface.shadowRoot?.querySelector('[role="status"]')?.replaceChildren();
    await feed(data('/m', 'same'));
    expect(await liveText(surface)).toBe('');
  });

  test('an agent update moves no focus', async () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    const { feed } = mount();
    await feed(
      create(),
      components([{ id: 'root', component: 'Button', child: 't', action: action('x') }, text('t', 'A')]),
    );
    await feed(components([text('t', 'B')]));
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  test('the reconciler keeps each element across a reorder, keyed by instanceId', async () => {
    const { feed, surface } = mount();
    await feed(
      create(),
      components([
        { id: 'root', component: 'Row', children: ['a', 'b', 'c'] },
        text('a', 'A'),
        text('b', 'B'),
        text('c', 'C'),
      ]),
    );
    const [a, b, c] = [...surface.querySelectorAll('p')];
    await feed(components([{ id: 'root', component: 'Row', children: ['c', 'a', 'b'] }]));
    expect([...surface.querySelectorAll('p')]).toEqual([c, a, b] as HTMLParagraphElement[]);
  });
});

describe('Icon (§6.G.4 Basic mapping, line catalog Icon; §10 SD15, SD33)', () => {
  const PHOSPHOR = a2uiIconMap('phosphor', { library: 'phosphor' });
  const LUCIDE = a2uiIconMap('lucide', { library: 'lucide' });

  const icon = (name: unknown) => [{ id: 'root', component: 'Icon', name }];

  test('with iconMap unset an Icon stays neutral and raises one error', async () => {
    const { surface, errors } = await render(icon('favorite'));
    const element = surface.querySelector('line-icon');
    expect(element?.attributes).toHaveLength(0);
    expect(codes(errors)).toEqual(['UNMAPPED_ICON']);
  });

  test('a mapped name sets library, name, weight and mirror from its entry', async () => {
    const { feed, surface } = mount();
    surface.iconMap = PHOSPHOR;
    await feed(
      create(),
      components([{ id: 'root', component: 'Icon', name: { path: '/icon' } }]),
      data('/icon', 'favorite'),
    );
    const element = surface.querySelector('line-icon');
    expect(element?.getAttribute('library')).toBe('phosphor');
    expect(element?.getAttribute('name')).toBe(PHOSPHOR.favorite.name);
    expect(element?.getAttribute('weight')).toBe('fill');
    expect(element?.hasAttribute('mirror')).toBe(false);
    await feed(data('/icon', 'arrowBack'));
    expect(element?.hasAttribute('mirror')).toBe(true);
  });

  test('a name absent from the map, and a bound name "constructor", stay neutral and raise one error each', async () => {
    const { feed, surface, errors } = mount();
    surface.iconMap = PHOSPHOR;
    await feed(
      create(),
      components([
        { id: 'root', component: 'Row', children: ['a', 'b'] },
        { id: 'a', component: 'Icon', name: { path: '/a' } },
        { id: 'b', component: 'Icon', name: { path: '/b' } },
      ]),
      data('/', { a: 'notAnIcon', b: 'constructor' }),
    );
    for (const element of surface.querySelectorAll('line-icon')) expect(element.attributes).toHaveLength(0);
    expect(codes(errors)).toEqual(['UNMAPPED_ICON', 'UNMAPPED_ICON']);
  });

  test('icons rendered with iconMap unset render after it is set, and from the new entries after it is replaced', async () => {
    const { surface, errors } = await render(icon('star'));
    const element = surface.querySelector('line-icon');
    expect(element?.hasAttribute('library')).toBe(false);
    surface.iconMap = PHOSPHOR;
    expect([element?.getAttribute('library'), element?.getAttribute('weight')]).toEqual(['phosphor', 'fill']);
    surface.iconMap = LUCIDE;
    expect([element?.getAttribute('library'), element?.getAttribute('name'), element?.hasAttribute('weight')]).toEqual([
      'lucide',
      LUCIDE.star.name,
      false,
    ]);
    expect(codes(errors)).toEqual(['UNMAPPED_ICON']);
  });

  test('a line Icon with a mapped name takes its entry, and ignores the node mirror', async () => {
    const { feed, surface, errors } = mount();
    surface.iconMap = PHOSPHOR;
    await feed(create(LINE_CATALOG_ID), components([{ id: 'root', component: 'Icon', name: 'home', mirror: true }]));
    const element = surface.querySelector('line-icon');
    expect([element?.getAttribute('library'), element?.getAttribute('name'), element?.hasAttribute('mirror')]).toEqual([
      'phosphor',
      PHOSPHOR.home.name,
      false,
    ]);
    expect(errors).toEqual([]);
  });

  test('a line Icon with an unmapped name stays neutral and raises one error', async () => {
    const { feed, surface, errors } = mount();
    surface.iconMap = PHOSPHOR;
    await feed(create(LINE_CATALOG_ID), components([{ id: 'root', component: 'Icon', name: 'nope' }]));
    expect(surface.querySelector('line-icon')?.attributes).toHaveLength(0);
    expect(codes(errors)).toEqual(['UNMAPPED_ICON']);
  });

  test('a line Icon with path and an unmapped name renders the path and raises nothing', async () => {
    const { surface, errors } = await render(
      [{ id: 'root', component: 'Icon', name: 'nope', path: 'M3 3', mirror: true }],
      { catalogId: LINE_CATALOG_ID },
    );
    const element = surface.querySelector('line-icon') as unknown as Element & { path: string };
    expect(element.path).toBe('M3 3');
    expect(element.hasAttribute('mirror')).toBe(true);
    expect(element.hasAttribute('name')).toBe(false);
    expect(errors).toEqual([]);
  });

  test('Icon sets no host aria-label', async () => {
    const { surface } = await render(
      [{ id: 'root', component: 'Icon', path: 'M1 1', accessibility: { label: 'Star' } }],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(surface.querySelector('line-icon')?.hasAttribute('aria-label')).toBe(false);
  });
});

describe('URLs, text and theme (§6.G.4 URLs, text, theme; §10 SD57, SD58)', () => {
  const images = (...urls: string[]) => [
    { id: 'root', component: 'Column', children: urls.map((_, i) => `i${i}`) },
    ...urls.map((url, i) => ({ id: `i${i}`, component: 'Image', url })),
  ];

  test('a disallowed scheme or data: does not reach the DOM', async () => {
    const { surface } = await render(
      images(
        'data:image/png;base64,AAAA',
        'javascript:alert(1)',
        'ftp://example.com/a.png',
        'https://example.com/c.png',
      ),
    );
    const sources = [...surface.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(sources).toEqual([null, null, null, 'https://example.com/c.png']);
  });

  test('a urlPolicy that rejects one https URL keeps it from the DOM; one that throws keeps every URL out', async () => {
    const { surface } = await render(images('https://example.com/a.png', 'https://example.com/b.png'));
    const uses: string[] = [];
    surface.urlPolicy = (url, use) => {
      uses.push(use);
      return !url.pathname.endsWith('a.png');
    };
    expect([...surface.querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual([
      null,
      'https://example.com/b.png',
    ]);
    expect(uses).toEqual(['image', 'image']);
    surface.urlPolicy = () => {
      throw new Error('policy failed');
    };
    expect([...surface.querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual([null, null]);
  });

  test('without markdownRenderer, Text is plain text', async () => {
    const { surface } = await render([text('root', '**bold** <b>x</b>')]);
    expect(surface.innerHTML).toBe('<p>**bold** &lt;b&gt;x&lt;/b&gt;</p>');
  });

  test('with markdownRenderer, Text renders as the node the hook returns', async () => {
    const { surface } = await render([text('root', '**bold**')]);
    surface.markdownRenderer = (markdown) => {
      const strong = document.createElement('strong');
      strong.textContent = markdown.replaceAll('*', '');
      return strong;
    };
    expect(surface.innerHTML).toBe('<p><strong>bold</strong></p>');
    surface.markdownRenderer = undefined;
    expect(surface.innerHTML).toBe('<p>**bold**</p>');
  });

  test('a markdownRenderer that throws, or returns a string, leaves plain text and raises an error', async () => {
    for (const renderer of [
      () => {
        throw new Error('bad markdown');
      },
      () => '<b>x</b>' as unknown as Node,
    ]) {
      const { surface, errors } = await render([text('root', '**bold**')]);
      surface.markdownRenderer = renderer;
      expect(surface.innerHTML).toBe('<p>**bold**</p>');
      expect(codes(errors)).toEqual(['MARKDOWN_RENDER_ERROR']);
      surface.remove();
    }
  });
});

describe('two-way value (§6.G.1 binding map; ARCH §17.2 rule C9)', () => {
  test('a committed pressed value is written back through its binding', async () => {
    const { feed, surface, session } = mount();
    await feed(
      message({ createSurface: { surfaceId: SURFACE, catalogId: LINE_CATALOG_ID, sendDataModel: true } }),
      components([
        {
          id: 'root',
          component: 'Button',
          pressed: { path: '/on' },
          accessibility: { label: 'Bold' },
          action: action('t'),
        },
      ]),
      data('/on', false),
    );
    const button = surface.querySelector('line-button') as HTMLElement & { pressed: boolean | undefined };
    expect(button.pressed).toBe(false);
    button.pressed = true;
    button.dispatchEvent(new CustomEvent('line-change', { detail: { value: true }, bubbles: true }));
    await tick();
    expect(session.dataModel(SURFACE)).toMatchObject({ surfaces: { [SURFACE]: { on: true } } });
  });
});

describe('lazy loading (§6.G.4; ARCH §17.4; Law 6)', () => {
  test('importing ./a2ui defines only line-a2ui-surface, and a Button loads only line-button', async () => {
    const script = `
      import { GlobalRegistrator } from '@happy-dom/global-registrator';
      import { FakeInternals } from '../line-core/__tests__/mocks/element-internals.ts';
      GlobalRegistrator.register();
      HTMLElement.prototype.attachInternals = function () { return new FakeInternals(this); };
      const defined = [];
      const define = customElements.define.bind(customElements);
      customElements.define = (name, ...rest) => { defined.push(name); define(name, ...rest); };
      const { Session } = await import('@websublime/line-genui/a2ui');
      const atImport = [...defined];
      const surface = document.createElement('line-a2ui-surface');
      surface.setAttribute('surface-id', 'main');
      document.body.append(surface);
      surface.session = new Session();
      await surface.feed([
        { version: 'v0.9.1', createSurface: { surfaceId: 'main', catalogId: 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json' } },
        { version: 'v0.9.1', updateComponents: { surfaceId: 'main', components: [
          { id: 'root', component: 'Button', child: 't', action: { event: { name: 'x' } } },
          { id: 't', component: 'Text', text: 'Go' },
        ] } },
      ]);
      console.log(JSON.stringify({ atImport, afterButton: defined.filter((name) => name.startsWith('line-')) }));
      process.exit(0);
    `;
    const child = Bun.spawn([process.execPath, '--eval', script], {
      cwd: new URL('..', import.meta.url).pathname,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    expect({ code, stderr }).toEqual({ code: 0, stderr: '' });
    expect(JSON.parse(stdout)).toEqual({
      atImport: ['line-a2ui-surface'],
      afterButton: ['line-a2ui-surface', 'line-button'],
    });
  });

  test('a load() that rejects raises one COMPONENT_LOAD_ERROR that validates (§12 AM-077)', async () => {
    // A fresh process: the separator must be undefined, and its descriptor is the one the dist `./a2ui` uses.
    const script = `
      import { GlobalRegistrator } from '@happy-dom/global-registrator';
      GlobalRegistrator.register();
      const { separatorDescriptor } = await import('@websublime/line-genui/catalog');
      separatorDescriptor.load = () => Promise.reject(new Error('offline'));
      const { Session } = await import('@websublime/line-genui/a2ui');
      const surface = document.createElement('line-a2ui-surface');
      surface.setAttribute('surface-id', 'main');
      const errors = [];
      surface.addEventListener('line-a2ui-error', (event) => errors.push(event.detail));
      document.body.append(surface);
      surface.session = new Session();
      await surface.feed([
        { version: 'v0.9.1', createSurface: { surfaceId: 'main', catalogId: 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json' } },
        { version: 'v0.9.1', updateComponents: { surfaceId: 'main', components: [{ id: 'root', component: 'Divider' }] } },
      ]);
      console.log(JSON.stringify(errors));
      process.exit(0);
    `;
    const child = Bun.spawn([process.execPath, '--eval', script], {
      cwd: new URL('..', import.meta.url).pathname,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    expect({ code, stderr }).toEqual({ code: 0, stderr: '' });
    const errors = JSON.parse(stdout) as { error: Record<string, unknown> }[];
    for (const error of errors) checkClientMessage(error);
    expect(errors).toEqual([
      {
        version: 'v0.9.1',
        error: {
          code: 'COMPONENT_LOAD_ERROR',
          surfaceId: 'main',
          message: 'The component line-separator failed to load: offline',
          tag: 'line-separator',
        },
      },
    ]);
  });
});
