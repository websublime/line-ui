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

import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { INTERNALS } from '@websublime/line-core';
import { a2uiIconMap } from '@websublime/line-icons/a2ui';
import { LineA2uiSurface } from '../src/a2ui/index.js';
import {
  avatarDescriptor,
  avatarGroupDescriptor,
  BASIC_CATALOG_ID,
  badgeDescriptor,
  chipDescriptor,
  kbdDescriptor,
  LINE_CATALOG_ID,
} from '../src/catalog/index.js';
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
    expect(kids[10]?.outerHTML).toBe('<line-button variant="primary" type="button"><span>Go</span></line-button>');
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
        '<line-button type="button" aria-label="Close"><line-icon></line-icon></line-button>' +
        '<line-separator orientation="vertical"></line-separator>' +
        '<line-icon mirror=""></line-icon></line-stack>',
    );
  });

  test('a VisuallyHidden node renders one inert unknown-type placeholder, since its descriptor is not agent-exposed (0012-visually-hidden.md D9)', async () => {
    const { surface, errors } = await render(
      [
        { id: 'root', component: 'Stack', children: ['t', 'hidden'] },
        { id: 't', component: 'Separator' },
        { id: 'hidden', component: 'VisuallyHidden' },
      ],
      { catalogId: LINE_CATALOG_ID },
    );
    const placeholders = surface.querySelectorAll('[data-line-a2ui-placeholder="unknown-type"]');
    expect(placeholders).toHaveLength(1);
    expect((placeholders[0] as HTMLElement).inert).toBe(true);
    expect(codes(errors)).toEqual(['UNKNOWN_COMPONENT_TYPE']);
    expect(surface.querySelector('line-visually-hidden')).toBeNull();
    expect(customElements.get('line-visually-hidden')).toBeUndefined();
  });

  test('a Portal node renders one inert unknown-type placeholder, since its descriptor is not agent-exposed (0013-portal.md D10)', async () => {
    const { surface, errors } = await render(
      [
        { id: 'root', component: 'Stack', children: ['t', 'portal'] },
        { id: 't', component: 'Separator' },
        { id: 'portal', component: 'Portal' },
      ],
      { catalogId: LINE_CATALOG_ID },
    );
    const placeholders = surface.querySelectorAll('[data-line-a2ui-placeholder="unknown-type"]');
    expect(placeholders).toHaveLength(1);
    expect((placeholders[0] as HTMLElement).inert).toBe(true);
    expect(codes(errors)).toEqual(['UNKNOWN_COMPONENT_TYPE']);
    expect(surface.querySelector('line-portal')).toBeNull();
    expect(customElements.get('line-portal')).toBeUndefined();
  });
});

describe('Kbd (0015-kbd.md Agent contract; §6.G.4)', () => {
  type Kbd = HTMLElement & { keys: string; updateComplete: Promise<unknown> };

  // happy-dom runs no attributeChangedCallback for the attributes an element holds when it upgrades, so Kbd is
  // defined before the surface creates one; a browser upgrade reads them.
  beforeAll(() => kbdDescriptor.load());

  // `auto` reads `navigator.platform`; a Windows value makes every drawing here the other platform's on any host (P8).
  beforeEach(() => {
    Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'platform');
  });

  /** The rendered `line-kbd`, after its update, and its shadow text. */
  async function kbdOf(surface: HTMLElement): Promise<{ host: Kbd; text: string }> {
    const host = surface.querySelector('line-kbd') as Kbd;
    await host.updateComplete;
    return { host, text: host.shadowRoot?.querySelector('[part="root"]')?.textContent ?? '' };
  }

  test('a Kbd node renders <line-kbd> with keys as an attribute', async () => {
    const { surface, errors } = await render(
      [
        { id: 'root', component: 'Stack', children: ['k'] },
        { id: 'k', component: 'Kbd', keys: 'mod+k' },
      ],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(errors).toEqual([]);
    expect(surface.innerHTML).toBe('<line-stack><line-kbd keys="mod+k"></line-kbd></line-stack>');
    const { host, text } = await kbdOf(surface);
    expect(host.keys).toBe('mod+k');
    expect(text).toBe('Ctrl+K');
  });

  test('a bound keys updates the same element', async () => {
    const { surface, feed } = mount();
    await feed(
      create(LINE_CATALOG_ID),
      components([{ id: 'root', component: 'Kbd', keys: { path: '/shortcut' } }]),
      data('/shortcut', 'g i'),
    );
    const first = await kbdOf(surface);
    expect(first.host.getAttribute('keys')).toBe('g i');
    expect(first.text).toBe('G then I');
    await feed(data('/shortcut', 'mod+shift+p'));
    const second = await kbdOf(surface);
    expect(second.host).toBe(first.host);
    expect(second.text).toBe('Ctrl+Shift+P');
  });

  test('a node with no keys renders an empty host and raises nothing (C8)', async () => {
    const { surface, errors } = await render([{ id: 'root', component: 'Kbd' }], { catalogId: LINE_CATALOG_ID });
    expect(errors).toEqual([]);
    const { host, text } = await kbdOf(surface);
    expect(host.getAttributeNames()).toEqual([]);
    expect(text).toBe('');
    expect(host.shadowRoot?.querySelector('slot')).not.toBeNull();
  });

  test('an accessibility.label sets no aria-label on the host (hostNaming never)', async () => {
    const { surface, errors } = await render(
      [{ id: 'root', component: 'Kbd', keys: 'mod+k', accessibility: { label: 'Command K' } }],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(errors).toEqual([]);
    const { host } = await kbdOf(surface);
    expect(host.hasAttribute('aria-label')).toBe(false);
  });
});

describe('Button (§6.G.4 Button; §12 AM-081)', () => {
  test('every surface Button is type="button" with no name or value, from both catalogs', async () => {
    const basic = await render([{ id: 'root', component: 'Button', child: 't', action: action('a') }, text('t', 'A')]);
    const line = await render(
      [{ id: 'root', component: 'Button', accessibility: { label: 'B' }, action: action('b') }],
      {
        catalogId: LINE_CATALOG_ID,
      },
    );
    for (const { surface } of [basic, line]) {
      const button = surface.querySelector('line-button');
      expect([button?.getAttribute('type'), button?.hasAttribute('name'), button?.hasAttribute('value')]).toEqual([
        'button',
        false,
        false,
      ]);
    }
  });

  test('a line Button node that carries type, name or value is rejected by the strict schema', async () => {
    for (const extra of [{ type: 'submit' }, { name: 'intent' }, { value: 'save' }]) {
      const { surface, errors } = await render(
        [{ id: 'root', component: 'Button', accessibility: { label: 'B' }, action: action('b'), ...extra }],
        { catalogId: LINE_CATALOG_ID },
      );
      expect(codes(errors)).toEqual(['VALIDATION_ERROR']);
      expect(surface.querySelector('line-button')).toBeNull();
      surface.remove();
    }
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
    const list = surface.firstElementChild as Element;
    expect(list.outerHTML.startsWith('<line-stack role="list">')).toBe(true);
    const [row, wrapper] = [...list.children];
    expect([row?.localName, row?.getAttribute('role'), row?.getAttribute('orientation')]).toEqual([
      'line-stack',
      'listitem',
      'horizontal',
    ]);
    expect(row?.innerHTML).toBe('<p>In a row</p>');
    expect(wrapper?.outerHTML).toBe('<div role="listitem"><p>Plain</p></div>');
  });

  test('Button text renders in a <span>', async () => {
    const { surface } = await render([
      { id: 'root', component: 'Button', child: 't', action: action('x') },
      text('t', 'Send', { variant: 'h2' }),
    ]);
    expect(surface.innerHTML).toBe('<line-button type="button"><span>Send</span></line-button>');
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
    expect(surface.innerHTML).toBe('<line-button type="button"><span>Now named</span></line-button>');
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

  test('a line Icon with a mapped name takes library, name, weight and mirror from its entry, not the node', async () => {
    const { feed, surface, errors } = mount();
    surface.iconMap = PHOSPHOR;
    await feed(
      create(LINE_CATALOG_ID),
      components([
        { id: 'root', component: 'Stack', children: ['home', 'back'] },
        { id: 'home', component: 'Icon', name: 'home', mirror: true },
        { id: 'back', component: 'Icon', name: 'arrowBack', mirror: false },
      ]),
    );
    const [home, back] = [...surface.querySelectorAll('line-icon')];
    const attributes = (element: Element | undefined) => ({
      library: element?.getAttribute('library'),
      name: element?.getAttribute('name'),
      weight: element?.getAttribute('weight'),
      mirror: element?.hasAttribute('mirror'),
    });
    expect(PHOSPHOR.arrowBack.mirror).toBe(true);
    expect(attributes(home)).toEqual({
      library: 'phosphor',
      name: PHOSPHOR.home.name,
      weight: PHOSPHOR.home.weight,
      mirror: false,
    });
    expect(attributes(back)).toEqual({
      library: 'phosphor',
      name: PHOSPHOR.arrowBack.name,
      weight: PHOSPHOR.arrowBack.weight,
      mirror: true,
    });
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
        throw new Error('bad markdown at /internal/renderer.js');
      },
      () => '<b>x</b>' as unknown as Node,
    ]) {
      const { surface, errors } = await render([text('root', '**bold**')]);
      surface.markdownRenderer = renderer;
      expect(surface.innerHTML).toBe('<p>**bold**</p>');
      expect(codes(errors)).toEqual(['MARKDOWN_RENDER_ERROR']);
      expect(errors[0]?.error.message).toMatch(
        /^markdownRenderer (threw|returned a value that is not a Node) for Text 'root'\.$/,
      );
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

describe('IconButton (Phase 1 spec §6.C.5 IconButton; `0003-icon-button.md` Agent contract)', () => {
  const closeButton = (extra: Message = {}): Message => ({
    id: 'root',
    component: 'IconButton',
    variant: 'borderless',
    child: 'icon',
    action: action('close'),
    ...extra,
  });
  const icon: Message = { id: 'icon', component: 'Icon', path: 'M6 6L18 18M18 6L6 18' };

  test('a node without accessibility.label, or with " ", renders a placeholder and raises MISSING_ACCESSIBLE_NAME', async () => {
    for (const accessibility of [undefined, { label: ' ' }, { description: 'Closes the dialog' }]) {
      const { surface, errors } = await render([closeButton(accessibility ? { accessibility } : {}), icon], {
        catalogId: LINE_CATALOG_ID,
      });
      expect(surface.querySelector('line-icon-button')).toBeNull();
      const placeholder = surface.querySelector('[data-line-a2ui-placeholder="missing-name"]') as HTMLElement;
      expect(placeholder.inert).toBe(true);
      expect(codes(errors)).toEqual(['MISSING_ACCESSIBLE_NAME']);
      expect(errors[0]?.error.componentId).toBe('root');
      surface.remove();
    }
  });

  test('a named node renders line-icon-button with its aria-label and the Icon in the default slot', async () => {
    const { surface, errors } = await render(
      [closeButton({ accessibility: { label: 'Close dialog', description: 'Discards the draft' } }), icon],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(errors).toEqual([]);
    expect(surface.innerHTML).toBe(
      '<line-icon-button variant="borderless" aria-label="Close dialog" aria-description="Discards the draft">' +
        '<line-icon></line-icon></line-icon-button>',
    );
    const host = surface.querySelector('line-icon-button') as HTMLElement;
    expect(host.hasAttribute('type')).toBe(false);
    expect((host.firstElementChild as unknown as { path: string }).path).toBe('M6 6L18 18M18 6L6 18');
  });

  test('a click on the rendered element raises one line-a2ui-action', async () => {
    const { surface, actions } = await render([closeButton({ accessibility: { label: 'Close dialog' } }), icon], {
      catalogId: LINE_CATALOG_ID,
    });
    await customElements.whenDefined('line-icon-button');
    const host = surface.querySelector('line-icon-button') as HTMLElement & { updateComplete: Promise<unknown> };
    await host.updateComplete;
    expect(host.shadowRoot?.querySelector('button')?.getAttribute('aria-label')).toBe('Close dialog');
    host.click();
    await tick();
    expect(actions.map((each) => each.action.name)).toEqual(['close']);
    expect(actions[0]?.action.sourceComponentId).toBe('root');
  });

  test('child takes any component, not only an Icon', async () => {
    const { surface, errors } = await render(
      [
        closeButton({ accessibility: { label: 'Split' }, child: 'rule' }),
        { id: 'rule', component: 'Separator', orientation: 'vertical' },
      ],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(errors).toEqual([]);
    expect(surface.innerHTML).toBe(
      '<line-icon-button variant="borderless" aria-label="Split">' +
        '<line-separator orientation="vertical"></line-separator></line-icon-button>',
    );
  });

  test('a committed pressed value is written back through its binding', async () => {
    const { feed, surface, session } = mount();
    await feed(
      message({ createSurface: { surfaceId: SURFACE, catalogId: LINE_CATALOG_ID, sendDataModel: true } }),
      components([closeButton({ pressed: { path: '/muted' }, accessibility: { label: 'Mute' } }), icon]),
      data('/muted', false),
    );
    const host = surface.querySelector('line-icon-button') as HTMLElement & { pressed: boolean | undefined };
    expect(host.pressed).toBe(false);
    host.pressed = true;
    host.dispatchEvent(new CustomEvent('line-change', { detail: { value: true }, bubbles: true }));
    await tick();
    expect(session.dataModel(SURFACE)).toMatchObject({ surfaces: { [SURFACE]: { muted: true } } });
  });

  test('the basic catalog keeps no route to line-icon-button (decision D4)', async () => {
    const { surface, errors } = await render([{ id: 'root', component: 'IconButton', action: action('close') }]);
    expect(surface.querySelector('line-icon-button')).toBeNull();
    expect(codes(errors)).toEqual(['UNKNOWN_COMPONENT_TYPE']);
  });
});

describe('ButtonGroup (`0004-button-group.md` Agent contract)', () => {
  const toolbar = (extra: Message = {}): Message => ({
    id: 'root',
    component: 'ButtonGroup',
    children: ['bold', 'italic', 'underline'],
    ...extra,
  });
  const buttons: Message[] = ['bold', 'italic', 'underline'].map((id) => ({
    id,
    component: 'Button',
    accessibility: { label: id },
    action: action(id),
  }));

  test('a node without accessibility.label, or with " ", renders a placeholder and raises MISSING_ACCESSIBLE_NAME', async () => {
    for (const accessibility of [undefined, { label: ' ' }]) {
      const { surface, errors } = await render([toolbar(accessibility ? { accessibility } : {}), ...buttons], {
        catalogId: LINE_CATALOG_ID,
      });
      expect(surface.querySelector('line-button-group')).toBeNull();
      const placeholder = surface.querySelector('[data-line-a2ui-placeholder="missing-name"]') as HTMLElement;
      expect(placeholder.inert).toBe(true);
      expect(codes(errors)).toEqual(['MISSING_ACCESSIBLE_NAME']);
      expect(errors[0]?.error.componentId).toBe('root');
      surface.remove();
    }
  });

  // `loop` is checked in the surface axe file in real browsers: happy-dom calls no attributeChangedCallback when
  // it upgrades an element that already carries the attribute, so the reflected `false` default removes it here.
  test('a named node renders line-button-group with its aria-label, orientation and the buttons in order', async () => {
    const { surface, errors } = await render(
      [toolbar({ orientation: 'vertical', accessibility: { label: 'Text formatting' } }), ...buttons],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(errors).toEqual([]);
    const group = surface.querySelector('line-button-group') as HTMLElement & { updateComplete: Promise<unknown> };
    expect(group.getAttribute('aria-label')).toBe('Text formatting');
    expect(group.getAttribute('orientation')).toBe('vertical');
    expect([...group.children].map((child) => `${child.localName}:${child.getAttribute('aria-label')}`)).toEqual([
      'line-button:bold',
      'line-button:italic',
      'line-button:underline',
    ]);
  });

  test('the group roves over the surface-created buttons, and each button keeps its own action', async () => {
    const { surface, actions } = await render([toolbar({ accessibility: { label: 'Formatting' } }), ...buttons], {
      catalogId: LINE_CATALOG_ID,
    });
    await customElements.whenDefined('line-button-group');
    const group = surface.querySelector('line-button-group') as HTMLElement & { updateComplete: Promise<unknown> };
    await group.updateComplete;
    await tick();
    const stops = () => [...group.children].map((child) => child.getAttribute('tabindex'));
    expect(stops()).toEqual(['0', '-1', '-1']);
    const first = group.firstElementChild as HTMLElement;
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
    await tick();
    await group.updateComplete;
    expect(stops()).toEqual(['-1', '0', '-1']);
    (group.children[2] as HTMLElement).click();
    await tick();
    expect(actions.map((each) => each.action.name)).toEqual(['underline']);
  });

  test('children take any component; a non-button child renders and is not an item', async () => {
    const { surface, errors } = await render(
      [
        toolbar({ children: ['bold', 'rule', 'italic'], accessibility: { label: 'Formatting' } }),
        buttons[0] as Message,
        { id: 'rule', component: 'Separator', orientation: 'vertical' },
        buttons[1] as Message,
      ],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(errors).toEqual([]);
    await customElements.whenDefined('line-button-group');
    const group = surface.querySelector('line-button-group') as HTMLElement & { updateComplete: Promise<unknown> };
    await group.updateComplete;
    await tick();
    expect(
      [...group.children].map((child) => `${child.localName}:${child.getAttribute('data-line-button-group-position')}`),
    ).toEqual(['line-button:first', 'line-separator:null', 'line-button:last']);
  });

  test('the basic catalog keeps no route to line-button-group (decision D10)', async () => {
    const { surface, errors } = await render([{ id: 'root', component: 'ButtonGroup', children: [] }]);
    expect(surface.querySelector('line-button-group')).toBeNull();
    expect(codes(errors)).toEqual(['UNKNOWN_COMPONENT_TYPE']);
  });
});

describe('Alert (`0006-alert.md` Agent contract)', () => {
  const basicText = (id: string, value: string, extra: Message = {}): Message =>
    text(id, value, { catalogId: BASIC_CATALOG_ID, ...extra });
  const alert = (extra: Message = {}): Message => ({
    id: 'root',
    component: 'Alert',
    variant: 'danger',
    icon: 'glyph',
    title: 'heading',
    children: ['message'],
    actions: ['retry'],
    dismiss: 'close',
    ...extra,
  });
  const parts: Message[] = [
    { id: 'glyph', component: 'Icon', path: 'M12 2 L22 22 L2 22 Z' },
    basicText('heading', 'Payment failed', { variant: 'h3' }),
    basicText('message', 'Check the card number and try again.'),
    { id: 'retry', component: 'Button', accessibility: { label: 'Retry' }, action: action('retry') },
    {
      id: 'close',
      component: 'IconButton',
      child: 'closeGlyph',
      accessibility: { label: 'Dismiss' },
      action: action('dismissed'),
    },
    { id: 'closeGlyph', component: 'Icon', path: 'M6 6 L18 18 M18 6 L6 18' },
  ];

  test('renders line-alert with its variant, and each child prop in its slot, in prop order', async () => {
    const { surface, errors } = await render([alert(), ...parts], { catalogId: LINE_CATALOG_ID });
    expect(errors).toEqual([]);
    const element = surface.querySelector('line-alert') as HTMLElement;
    expect(element.getAttribute('variant')).toBe('danger');
    expect([...element.children].map((child) => `${child.localName}:${child.getAttribute('slot')}`)).toEqual([
      'line-icon:icon',
      'h3:title',
      'p:null',
      'line-button:actions',
      'line-icon-button:dismiss',
    ]);
    expect(element.querySelector('h3')?.textContent).toBe('Payment failed');
  });

  test('sets no live role and no host name; accessibility.label is not applied (decision D7)', async () => {
    const { surface, errors } = await render(
      [alert({ accessibility: { label: 'Payment error', description: 'From checkout' } }), ...parts],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(errors).toEqual([]);
    const element = surface.querySelector('line-alert') as HTMLElement;
    expect(
      ['live', 'role', 'aria-label', 'aria-description', 'aria-live'].filter((name) => element.hasAttribute(name)),
    ).toEqual([]);
  });

  test('a node without content renders an empty alert, not a placeholder (C8)', async () => {
    const { surface, errors } = await render([{ id: 'root', component: 'Alert' }], { catalogId: LINE_CATALOG_ID });
    expect(errors).toEqual([]);
    expect(surface.innerHTML).toBe('<line-alert></line-alert>');
  });

  test('a node with live or an unknown variant is rejected by the strict schema', async () => {
    for (const extra of [{ live: 'assertive' }, { variant: 'error' }, { action: action('dismiss') }]) {
      const { surface, errors } = await render([alert(extra), ...parts], { catalogId: LINE_CATALOG_ID });
      expect(codes(errors)).toEqual(['VALIDATION_ERROR']);
      expect(surface.querySelector('line-alert')).toBeNull();
      surface.remove();
    }
  });

  test('the basic catalog keeps no route to line-alert (decision D6)', async () => {
    const { surface, errors } = await render([{ id: 'root', component: 'Alert', children: [] }]);
    expect(surface.querySelector('line-alert')).toBeNull();
    expect(codes(errors)).toEqual(['UNKNOWN_COMPONENT_TYPE']);
  });
});

describe('Chip (`0008-chip.md` Agent contract; §6.G.4; §12 AM-092)', () => {
  type Chip = HTMLElement & { pressed: boolean; updateComplete: Promise<unknown> };
  const chip = (extra: Message = {}): Message => ({ id: 'root', component: 'Chip', label: 'In stock', ...extra });

  // happy-dom runs no attributeChangedCallback for the attributes an element holds when it upgrades, so the chip is
  // defined before the surface creates one; a browser upgrade reads them.
  beforeAll(() => chipDescriptor.load());

  test('renders line-chip with its label text in the default slot and its variant and disabled attributes', async () => {
    const { surface, errors } = await render([chip({ variant: 'primary', disabled: true })], {
      catalogId: LINE_CATALOG_ID,
    });
    expect(errors).toEqual([]);
    const host = surface.querySelector('line-chip') as Chip;
    expect([host.getAttribute('variant'), host.getAttribute('disabled')]).toEqual(['primary', '']);
    expect([...host.childNodes].map((node) => [node.nodeType, node.textContent])).toEqual([
      [Node.TEXT_NODE, 'In stock'],
    ]);
  });

  test('a bound label rewrites the same text node, and the element stays', async () => {
    const { feed, surface, errors } = mount();
    await feed(create(LINE_CATALOG_ID), components([chip({ label: { path: '/label' } })]), data('/label', 'In stock'));
    const host = surface.querySelector('line-chip') as Chip;
    const node = host.firstChild;
    expect(host.textContent).toBe('In stock');
    await feed(data('/label', 'Free shipping'));
    expect(surface.querySelector('line-chip')).toBe(host);
    expect(host.firstChild).toBe(node);
    expect(host.textContent).toBe('Free shipping');
    expect(errors).toEqual([]);
  });

  test('a bound label with markup renders as plain text, as Text does without markdownRenderer', async () => {
    const { feed, surface, errors } = mount();
    await feed(create(LINE_CATALOG_ID), components([chip({ label: { path: '/label' } })]), data('/label', '<b>x</b>'));
    const host = surface.querySelector('line-chip') as Chip;
    expect(errors).toEqual([]);
    expect(host.querySelector('b')).toBeNull();
    expect(host.textContent).toBe('<b>x</b>');
    expect(host.innerHTML).toBe('&lt;b&gt;x&lt;/b&gt;');
  });

  test('the label text names the inner button, and accessibility.label wins as the host aria-label', async () => {
    const { surface } = await render([chip({ accessibility: { label: 'In-stock items', description: 'Filter' } })], {
      catalogId: LINE_CATALOG_ID,
    });
    await customElements.whenDefined('line-chip');
    const host = surface.querySelector('line-chip') as Chip;
    await host.updateComplete;
    expect(host.getAttribute('aria-label')).toBe('In-stock items');
    expect(host.getAttribute('aria-description')).toBe('Filter');
    const inner = host.shadowRoot?.querySelector('button');
    expect(inner?.getAttribute('aria-label')).toBe('In-stock items');
    const slot = host.shadowRoot?.querySelector<HTMLSlotElement>('[part="label"] > slot:not([name])');
    expect(slot?.assignedNodes().map((each) => each.textContent)).toEqual(['In stock']);
  });

  test('a blank label without accessibility.label renders a placeholder and raises MISSING_ACCESSIBLE_NAME', async () => {
    for (const label of ['', '  ']) {
      const { surface, errors } = await render([chip({ label })], { catalogId: LINE_CATALOG_ID });
      expect(surface.querySelector('line-chip')).toBeNull();
      const placeholder = surface.querySelector('[data-line-a2ui-placeholder="missing-name"]') as HTMLElement;
      expect(placeholder.inert).toBe(true);
      expect(codes(errors)).toEqual(['MISSING_ACCESSIBLE_NAME']);
      expect(errors[0]?.error.componentId).toBe('root');
      surface.remove();
    }
  });

  test('a blank label with accessibility.label renders an empty chip named by its host aria-label', async () => {
    const { surface, errors } = await render([chip({ label: '', accessibility: { label: 'In stock' } })], {
      catalogId: LINE_CATALOG_ID,
    });
    expect(errors).toEqual([]);
    expect(surface.innerHTML).toBe('<line-chip aria-label="In stock"></line-chip>');
  });

  test('a label bound to a path the model does not hold yet keeps the node hidden without an error (AM-001)', async () => {
    const { feed, surface, errors } = mount();
    await feed(create(LINE_CATALOG_ID), components([chip({ label: { path: '/label' } })]));
    const pending = surface.querySelector('[data-line-a2ui-placeholder="pending"]') as HTMLElement;
    expect(pending.hidden).toBe(true);
    expect(surface.querySelector('line-chip')).toBeNull();
    expect(errors).toEqual([]);
    await feed(data('/label', 'In stock'));
    expect(surface.querySelector('[data-line-a2ui-placeholder]')).toBeNull();
    expect(surface.querySelector('line-chip')?.textContent).toBe('In stock');
    await feed(data('/label', ' '));
    expect(surface.querySelector('line-chip')).toBeNull();
    expect(codes(errors)).toEqual(['MISSING_ACCESSIBLE_NAME']);
  });

  test('a bound pressed follows a user click through line-change', async () => {
    const { feed, surface, session } = mount();
    await feed(
      message({ createSurface: { surfaceId: SURFACE, catalogId: LINE_CATALOG_ID, sendDataModel: true } }),
      components([chip({ pressed: { path: '/filters/inStock' } })]),
      data('/filters/inStock', false),
    );
    await customElements.whenDefined('line-chip');
    const host = surface.querySelector('line-chip') as Chip;
    await host.updateComplete;
    expect(host.pressed).toBe(false);
    host.click();
    await tick();
    expect(host.pressed).toBe(true);
    expect(session.dataModel(SURFACE)).toMatchObject({ surfaces: { [SURFACE]: { filters: { inStock: true } } } });
    await feed(data('/filters/inStock', false));
    expect(host.pressed).toBe(false);
  });

  test('a node without label, or with child, action or an unknown variant, is rejected by the strict schema', async () => {
    for (const node of [
      { id: 'root', component: 'Chip', accessibility: { label: 'In stock' } },
      chip({ child: 'text' }),
      chip({ action: action('toggle') }),
      chip({ variant: 'borderless' }),
    ]) {
      const { surface, errors } = await render([node], { catalogId: LINE_CATALOG_ID });
      expect(codes(errors)).toEqual(['VALIDATION_ERROR']);
      expect(surface.querySelector('line-chip')).toBeNull();
      surface.remove();
    }
  });

  test('the basic catalog keeps no route to line-chip (decision D1)', async () => {
    const { surface, errors } = await render([chip()]);
    expect(surface.querySelector('line-chip')).toBeNull();
    expect(codes(errors)).toEqual(['UNKNOWN_COMPONENT_TYPE']);
  });
});

describe('Badge (`0007-badge.md` Agent contract; §6.G.4; §12 AM-092)', () => {
  type Badge = HTMLElement & { variant: string; updateComplete: Promise<unknown> };
  const badge = (extra: Message = {}): Message => ({ id: 'root', component: 'Badge', label: '5', ...extra });
  const semantics = (host: Element) => {
    const internals = Reflect.get(host, INTERNALS) as { role?: string | null; ariaHidden?: string | null };
    return { role: internals.role ?? null, ariaHidden: internals.ariaHidden ?? null };
  };

  // happy-dom runs no attributeChangedCallback for the attributes an element holds when it upgrades, so the badge is
  // defined before the surface creates one; a browser upgrade reads them.
  beforeAll(() => badgeDescriptor.load());

  test('renders line-badge with its label text in the default slot and its variant attribute (F9)', async () => {
    const { surface, errors } = await render([badge({ variant: 'danger' })], { catalogId: LINE_CATALOG_ID });
    expect(errors).toEqual([]);
    const host = surface.querySelector('line-badge') as Badge;
    await host.updateComplete;
    expect(host.getAttribute('variant')).toBe('danger');
    expect(host.variant).toBe('danger');
    expect([...host.childNodes].map((node) => [node.nodeType, node.textContent])).toEqual([[Node.TEXT_NODE, '5']]);
    expect(host.hasAttribute('data-empty')).toBe(false);
    expect(semantics(host)).toEqual({ role: null, ariaHidden: null });
  });

  test('a bound label rewrites the same text node, and the element stays', async () => {
    const { feed, surface, errors } = mount();
    await feed(
      create(LINE_CATALOG_ID),
      components([badge({ label: { path: '/inbox/unread' } })]),
      data('/inbox/unread', '5'),
    );
    const host = surface.querySelector('line-badge') as Badge;
    const node = host.firstChild;
    expect(host.textContent).toBe('5');
    await feed(data('/inbox/unread', '99+'));
    expect(surface.querySelector('line-badge')).toBe(host);
    expect(host.firstChild).toBe(node);
    expect(host.textContent).toBe('99+');
    expect(errors).toEqual([]);
  });

  test('an empty label with accessibility.label renders a dot whose host carries that aria-label (F4, F10)', async () => {
    const { surface, errors } = await render([badge({ label: '', accessibility: { label: 'New messages' } })], {
      catalogId: LINE_CATALOG_ID,
    });
    expect(errors).toEqual([]);
    const host = surface.querySelector('line-badge') as Badge;
    await host.updateComplete;
    expect(host.getAttribute('aria-label')).toBe('New messages');
    expect(host.textContent).toBe('');
    expect(semantics(host)).toEqual({ role: 'img', ariaHidden: null });
  });

  test('a node with no label and accessibility.label renders a dot named by its host aria-label', async () => {
    const { surface, errors } = await render(
      [{ id: 'root', component: 'Badge', variant: 'success', accessibility: { label: 'Online' } }],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(errors).toEqual([]);
    expect(surface.innerHTML).toBe('<line-badge variant="success" aria-label="Online" data-empty=""></line-badge>');
  });

  test('accessibility.label on a count names the host, which becomes an img (F5)', async () => {
    const { surface } = await render([badge({ accessibility: { label: '5 unread messages' } })], {
      catalogId: LINE_CATALOG_ID,
    });
    const host = surface.querySelector('line-badge') as Badge;
    await host.updateComplete;
    expect(host.getAttribute('aria-label')).toBe('5 unread messages');
    expect(host.textContent).toBe('5');
    expect(semantics(host)).toEqual({ role: 'img', ariaHidden: null });
  });

  test('neither a non-blank label nor accessibility.label renders a placeholder and raises MISSING_ACCESSIBLE_NAME (F10)', async () => {
    for (const node of [badge({ label: '' }), badge({ label: '  ' }), { id: 'root', component: 'Badge' }]) {
      const { surface, errors } = await render([node], { catalogId: LINE_CATALOG_ID });
      expect(surface.querySelector('line-badge')).toBeNull();
      const placeholder = surface.querySelector('[data-line-a2ui-placeholder="missing-name"]') as HTMLElement;
      expect(placeholder.inert).toBe(true);
      expect(codes(errors)).toEqual(['MISSING_ACCESSIBLE_NAME']);
      expect(errors[0]?.error.componentId).toBe('root');
      surface.remove();
    }
  });

  test('a label bound to a path the model does not hold yet keeps the node hidden without an error', async () => {
    const { feed, surface, errors } = mount();
    await feed(create(LINE_CATALOG_ID), components([badge({ label: { path: '/count' } })]));
    expect((surface.querySelector('[data-line-a2ui-placeholder="pending"]') as HTMLElement).hidden).toBe(true);
    expect(errors).toEqual([]);
    await feed(data('/count', '3'));
    expect(surface.querySelector('line-badge')?.textContent).toBe('3');
  });

  test('a node with child, action, count or an unknown variant is rejected by the strict schema', async () => {
    for (const node of [
      badge({ child: 'text' }),
      badge({ action: action('open') }),
      badge({ count: 5 }),
      badge({ variant: 'accent' }),
    ]) {
      const { surface, errors } = await render([node], { catalogId: LINE_CATALOG_ID });
      expect(codes(errors)).toEqual(['VALIDATION_ERROR']);
      expect(surface.querySelector('line-badge')).toBeNull();
      surface.remove();
    }
  });

  test('the basic catalog keeps no route to line-badge (decision D1)', async () => {
    const { surface, errors } = await render([badge()]);
    expect(surface.querySelector('line-badge')).toBeNull();
    expect(codes(errors)).toEqual(['UNKNOWN_COMPONENT_TYPE']);
  });
});

describe('Avatar (`0009-avatar.md` Agent contract; §6.G.4; §12 AM-021, AM-094)', () => {
  type Avatar = HTMLElement & { src: string; name: string; updateComplete: Promise<unknown> };
  const avatar = (extra: Message = {}): Message => ({
    id: 'root',
    component: 'Avatar',
    src: 'https://example.com/ana.png',
    name: 'Ana Silva',
    ...extra,
  });
  const rootOf = (host: Element) => host.shadowRoot?.querySelector('[part="root"]') as HTMLElement;

  // happy-dom runs no attributeChangedCallback for the attributes an element holds when it upgrades, so the avatar is
  // defined before the surface creates one; a browser upgrade reads them.
  beforeAll(() => avatarDescriptor.load());

  test('renders line-avatar with src from an allowed URL and name, an img named by it (F9, F10)', async () => {
    const { surface, errors } = await render([avatar()], { catalogId: LINE_CATALOG_ID });
    expect(errors).toEqual([]);
    const host = surface.querySelector('line-avatar') as Avatar;
    await host.updateComplete;
    expect(host.getAttribute('src')).toBe('https://example.com/ana.png');
    expect(host.getAttribute('name')).toBe('Ana Silva');
    expect(rootOf(host).getAttribute('role')).toBe('img');
    expect(rootOf(host).getAttribute('aria-label')).toBe('Ana Silva');
  });

  test('a bound name and src update the same element', async () => {
    const { feed, surface, errors } = mount();
    await feed(
      create(LINE_CATALOG_ID),
      components([avatar({ src: { path: '/user/photo' }, name: { path: '/user/name' } })]),
      data('/user', { photo: 'https://example.com/a.png', name: 'Ana Silva' }),
    );
    const host = surface.querySelector('line-avatar') as Avatar;
    expect(host.getAttribute('name')).toBe('Ana Silva');
    await feed(data('/user', { photo: 'https://example.com/b.png', name: 'Rui Costa' }));
    expect(surface.querySelector('line-avatar')).toBe(host);
    expect(host.getAttribute('src')).toBe('https://example.com/b.png');
    expect(host.getAttribute('name')).toBe('Rui Costa');
    for (const rejected of ['javascript:alert(1)', 'data:image/png;base64,AAAA']) {
      await feed(data('/user/photo', rejected));
      expect(surface.querySelector('line-avatar')).toBe(host);
      expect(host.hasAttribute('src')).toBe(false);
    }
    await feed(data('/user/photo', 'https://example.com/c.png'));
    expect(host.getAttribute('src')).toBe('https://example.com/c.png');
    expect(errors).toEqual([]);
  });

  test('a disallowed scheme, data: or a blank URL leaves no src (AM-094)', async () => {
    for (const src of ['data:image/png;base64,AAAA', 'javascript:alert(1)', 'ftp://example.com/a.png', '  ']) {
      const { surface, errors } = await render([avatar({ src })], { catalogId: LINE_CATALOG_ID });
      expect(errors).toEqual([]);
      const host = surface.querySelector('line-avatar') as Avatar;
      expect(host.hasAttribute('src')).toBe(false);
      surface.remove();
    }
  });

  test('urlPolicy rejects a URL with use image, a throwing policy rejects every URL, and a new policy re-projects', async () => {
    const { surface } = await render([avatar()], { catalogId: LINE_CATALOG_ID });
    const host = surface.querySelector('line-avatar') as Avatar;
    const uses: string[] = [];
    surface.urlPolicy = (url, use) => {
      uses.push(use);
      return !url.pathname.endsWith('ana.png');
    };
    expect(host.hasAttribute('src')).toBe(false);
    expect(uses).toEqual(['image']);
    surface.urlPolicy = () => true;
    expect(host.getAttribute('src')).toBe('https://example.com/ana.png');
    surface.urlPolicy = () => {
      throw new Error('policy failed');
    };
    expect(host.hasAttribute('src')).toBe(false);
  });

  test('a status child renders in the status slot (F9)', async () => {
    const { surface, errors } = await render(
      [
        avatar({ status: 'presence' }),
        { id: 'presence', component: 'Badge', variant: 'success', accessibility: { label: 'Online' } },
      ],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(errors).toEqual([]);
    const status = surface.querySelector('line-avatar > line-badge') as HTMLElement;
    expect(status.getAttribute('slot')).toBe('status');
    expect(status.getAttribute('aria-label')).toBe('Online');
  });

  test('accessibility.label and .description reach the host, which the avatar copies to root', async () => {
    const { surface } = await render(
      [avatar({ accessibility: { label: 'Ana Silva, team lead', description: 'Online' } })],
      { catalogId: LINE_CATALOG_ID },
    );
    const host = surface.querySelector('line-avatar') as Avatar;
    await host.updateComplete;
    expect(host.getAttribute('aria-label')).toBe('Ana Silva, team lead');
    expect(host.getAttribute('aria-description')).toBe('Online');
    expect(rootOf(host).getAttribute('aria-label')).toBe('Ana Silva, team lead');
  });

  test('a node with no name renders a decorative avatar and raises nothing (F11)', async () => {
    const { surface, errors } = await render([{ id: 'root', component: 'Avatar' }], { catalogId: LINE_CATALOG_ID });
    expect(errors).toEqual([]);
    const host = surface.querySelector('line-avatar') as Avatar;
    await host.updateComplete;
    expect(host.hasAttribute('name')).toBe(false);
    expect(rootOf(host).hasAttribute('role')).toBe(false);
  });

  test('a node with size, shape or fallback is rejected by the strict schema', async () => {
    for (const node of [avatar({ size: 'lg' }), avatar({ shape: 'square' }), avatar({ fallback: 'x' })]) {
      const { surface, errors } = await render([node], { catalogId: LINE_CATALOG_ID });
      expect(codes(errors)).toEqual(['VALIDATION_ERROR']);
      expect(surface.querySelector('line-avatar')).toBeNull();
      surface.remove();
    }
  });

  test('a basic Image with variant avatar renders line-avatar: url → src, description → name, fit ignored (F11; AM-021)', async () => {
    const { surface, errors } = await render([
      {
        id: 'root',
        component: 'Image',
        url: 'https://example.com/ana.png',
        description: 'Ana Silva',
        fit: 'contain',
        variant: 'avatar',
      },
    ]);
    expect(errors).toEqual([]);
    const host = surface.querySelector('line-avatar') as Avatar;
    await host.updateComplete;
    expect(surface.querySelector('img')).toBeNull();
    expect(host.getAttribute('src')).toBe('https://example.com/ana.png');
    expect(host.getAttribute('name')).toBe('Ana Silva');
    for (const attribute of ['fit', 'variant', 'description', 'url']) expect(host.hasAttribute(attribute)).toBe(false);
    expect(rootOf(host).getAttribute('aria-label')).toBe('Ana Silva');
  });

  test('a basic avatar Image keeps a data: URL out and, with no description, renders decorative', async () => {
    const { surface, errors } = await render([
      { id: 'root', component: 'Image', url: 'data:image/png;base64,AAAA', variant: 'avatar' },
    ]);
    expect(errors).toEqual([]);
    const host = surface.querySelector('line-avatar') as Avatar;
    await host.updateComplete;
    expect(host.hasAttribute('src')).toBe(false);
    expect(host.hasAttribute('name')).toBe(false);
    expect(rootOf(host).hasAttribute('role')).toBe(false);
  });

  test('a basic avatar Image runs urlPolicy with use image, and a new policy re-projects it (AM-094)', async () => {
    const { surface, errors } = await render([
      { id: 'root', component: 'Image', url: 'https://example.com/ana.png', description: 'Ana', variant: 'avatar' },
    ]);
    const host = surface.querySelector('line-avatar') as Avatar;
    expect(host.getAttribute('src')).toBe('https://example.com/ana.png');
    const uses: string[] = [];
    surface.urlPolicy = (url, use) => {
      uses.push(use);
      return !url.pathname.endsWith('ana.png');
    };
    expect(surface.querySelector('line-avatar')).toBe(host);
    expect(host.hasAttribute('src')).toBe(false);
    expect(uses).toEqual(['image']);
    surface.urlPolicy = () => {
      throw new Error('policy failed');
    };
    expect(host.hasAttribute('src')).toBe(false);
    surface.urlPolicy = () => true;
    expect(host.getAttribute('src')).toBe('https://example.com/ana.png');
    expect(errors).toEqual([]);
  });

  test('every other Image variant, and a missing one, still renders <img>', async () => {
    for (const variant of [undefined, 'mediumFeature', 'icon', 'header']) {
      const node: Message = { id: 'root', component: 'Image', url: 'https://example.com/a.png', description: 'A' };
      if (variant) node.variant = variant;
      const { surface } = await render([node]);
      expect(surface.querySelector('line-avatar')).toBeNull();
      expect(surface.querySelector('img')?.getAttribute('src')).toBe('https://example.com/a.png');
      surface.remove();
    }
  });

  test('an Image whose variant changes swaps between <img> and line-avatar', async () => {
    const { feed, surface, errors } = mount();
    const image = (variant: string): Message => ({
      id: 'root',
      component: 'Image',
      url: 'https://example.com/a.png',
      description: 'Ana',
      variant,
    });
    await feed(create(), components([image('mediumFeature')]));
    expect(surface.firstElementChild?.localName).toBe('img');
    await feed(components([image('avatar')]));
    expect(surface.firstElementChild?.localName).toBe('line-avatar');
    expect(surface.firstElementChild?.getAttribute('name')).toBe('Ana');
    await feed(components([image('largeFeature')]));
    expect(surface.firstElementChild?.localName).toBe('img');
    expect(errors).toEqual([]);
  });
});

describe('AvatarGroup (`0010-avatar-group.md` Agent contract; §6.G.4)', () => {
  type Group = HTMLElement & { updateComplete: Promise<unknown> };
  const team = (extra: Message = {}): Message => ({
    id: 'root',
    component: 'AvatarGroup',
    children: ['ana', 'rui', 'marta'],
    ...extra,
  });
  const people: Message[] = [
    { id: 'ana', component: 'Avatar', name: 'Ana Silva' },
    { id: 'rui', component: 'Avatar', name: 'Rui Costa' },
    { id: 'marta', component: 'Avatar', name: 'Marta Sousa' },
  ];
  const overflow = (group: Element) => group.shadowRoot?.querySelector('[part="overflow"]') ?? null;

  /** Waits for the group to read its children, which its MutationObserver reports in a microtask (D13). */
  async function settled(group: Group): Promise<void> {
    await tick();
    await group.updateComplete;
  }

  // happy-dom runs no attributeChangedCallback for the attributes an element holds when it upgrades, so both elements
  // are defined before the surface creates them; a browser upgrade reads them.
  beforeAll(() => Promise.all([avatarDescriptor.load(), avatarGroupDescriptor.load()]));

  test('renders line-avatar-group with its avatars in the default slot and every prop as an attribute (F10)', async () => {
    const { surface, errors } = await render(
      [
        team({
          max: 2,
          size: '4',
          spacing: '1',
          overflowLabel: '+{count} more members',
          accessibility: { label: 'Project members' },
        }),
        ...people,
      ],
      { catalogId: LINE_CATALOG_ID },
    );
    expect(errors).toEqual([]);
    const group = surface.querySelector('line-avatar-group') as Group;
    await settled(group);
    expect(group.getAttribute('max')).toBe('2');
    expect(group.getAttribute('size')).toBe('4');
    expect(group.getAttribute('spacing')).toBe('1');
    expect(group.getAttribute('overflow-label')).toBe('+{count} more members');
    expect(group.getAttribute('aria-label')).toBe('Project members');
    expect(Reflect.get(group, INTERNALS)?.role).toBe('group');
    expect([...group.children].map((child) => `${child.localName}:${child.getAttribute('slot')}`)).toEqual([
      'line-avatar:null',
      'line-avatar:null',
      'line-avatar:null',
    ]);
    expect(overflow(group)?.textContent).toBe('+1');
    expect(overflow(group)?.getAttribute('aria-label')).toBe('+1 more members');
  });

  test('a child that arrives later is counted, and a bound max follows the data model (D13)', async () => {
    const { feed, surface, errors } = mount();
    await feed(create(LINE_CATALOG_ID), components([team({ max: { path: '/team/max' } }), ...people.slice(0, 2)]));
    await feed(data('/team/max', 2));
    const group = surface.querySelector('line-avatar-group') as Group;
    await settled(group);
    expect(group.querySelector('[data-line-a2ui-placeholder="pending"]')).not.toBeNull();
    expect(overflow(group)).toBeNull();
    await feed(components([people[2] as Message]));
    await settled(group);
    expect(surface.querySelector('line-avatar-group')).toBe(group);
    expect(overflow(group)?.textContent).toBe('+1');
    await feed(data('/team/max', 1));
    await settled(group);
    expect(group.getAttribute('max')).toBe('1');
    expect(overflow(group)?.textContent).toBe('+2');
    expect(errors).toEqual([]);
  });

  test('a node with no name renders an unnamed group and raises nothing (F10)', async () => {
    const { surface, errors } = await render([team(), ...people], { catalogId: LINE_CATALOG_ID });
    expect(errors).toEqual([]);
    const group = surface.querySelector('line-avatar-group') as Group;
    await settled(group);
    expect(group.hasAttribute('aria-label')).toBe(false);
    expect(surface.querySelector('[data-line-a2ui-placeholder]')).toBeNull();
    expect(overflow(group)).toBeNull();
  });

  test('a node with an unknown size or spacing step is rejected by the strict schema', async () => {
    for (const node of [team({ size: '6' }), team({ spacing: '4' }), team({ expanded: true })]) {
      const { surface, errors } = await render([node, ...people], { catalogId: LINE_CATALOG_ID });
      expect(codes(errors)).toEqual(['VALIDATION_ERROR']);
      expect(surface.querySelector('line-avatar-group')).toBeNull();
      surface.remove();
    }
  });
});

describe('lazy loading (§6.G.4; ARCH §17.4; Law 6)', () => {
  test('importing ./a2ui defines only line-a2ui-surface, and a Button loads only line-button', async () => {
    const script = `
      import { GlobalRegistrator } from '@happy-dom/global-registrator';
      GlobalRegistrator.register();
      // LineElement calls attachInternals, which happy-dom lacks; a stand-in like line-element-identity.test.ts uses,
      // with the two form calls the form-associated Button makes on update.
      if (typeof HTMLElement.prototype.attachInternals !== 'function') {
        HTMLElement.prototype.attachInternals = function () {
          return { host: this, states: new Set(), setFormValue() {}, setValidity() {} };
        };
      }
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
          message: 'The component line-separator failed to load.',
          tag: 'line-separator',
        },
      },
    ]);
  });

  test('a tag the page already defines, from another copy of the component, is not loaded again', async () => {
    // A fresh process: the page defines line-separator itself before the surface needs it; a second copy's
    // define would throw, so the surface must not call load() (surface.ts #load).
    const script = `
      import { GlobalRegistrator } from '@happy-dom/global-registrator';
      GlobalRegistrator.register();
      class PageSeparator extends HTMLElement {}
      customElements.define('line-separator', PageSeparator);
      const { separatorDescriptor } = await import('@websublime/line-genui/catalog');
      let loads = 0;
      const load = separatorDescriptor.load;
      separatorDescriptor.load = () => { loads++; return load(); };
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
      await surface.settled();
      const node = surface.querySelector('line-separator');
      console.log(JSON.stringify({ loads, errors, pageCopy: node instanceof PageSeparator }));
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
    expect(JSON.parse(stdout)).toEqual({ loads: 0, errors: [], pageCopy: true });
  });
});
