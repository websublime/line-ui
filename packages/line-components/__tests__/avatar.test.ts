/**
 * `<line-avatar>` unit tier (spec `0009-avatar.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`, whose fake internals hold `states`. happy-dom loads no image, so
 * the tests dispatch `load` and `error` on the internal `<img>` themselves. The component comes from `src/` and
 * `line-core` from its built `dist/` (spec §7.8 rules 1 and 3), so this file needs `bun run build` first, as the CI
 * unit tier has. Real loads, layout, computed tokens and the accessibility tree live in the browser tier
 * (`integration/avatar/avatar.e2e.ts`).
 *
 * @module __tests__/avatar
 */

import { describe, expect, spyOn, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import type { TemplateResult } from 'lit';
import { LineAvatar } from '../src/avatar/index.js';

/** Yields one task, after the microtasks that deliver `slotchange`. */
function nextTask(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve);
  return promise;
}

async function settle(el: LineAvatar): Promise<void> {
  await el.updateComplete;
  await nextTask();
  await el.updateComplete;
}

async function mount(template: TemplateResult = html`<line-avatar></line-avatar>`): Promise<LineAvatar> {
  const el = await fixture<LineAvatar>(template);
  await settle(el);
  return el;
}

/** Builds an avatar from markup, so attribute values reach the element unparsed. */
async function mountMarkup(markup: string): Promise<LineAvatar> {
  const host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
  const el = host.querySelector('line-avatar') as LineAvatar;
  await settle(el);
  return el;
}

function part(el: LineAvatar, name: string): HTMLElement | null {
  return el.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`) ?? null;
}

/** The `loading` and `error` flags; throws when a `data-*` attribute and its `:state()` disagree. */
function flags(el: LineAvatar): { loading: boolean; error: boolean } {
  const states = (Reflect.get(el, INTERNALS) as { states: Set<string> }).states;
  const read = (name: string) => {
    const attribute = el.hasAttribute(`data-${name}`);
    expect(states.has(name)).toBe(attribute);
    return attribute;
  };
  return { loading: read('loading'), error: read('error') };
}

/** Which zone `root` shows: the image (or custom media) or the fallback. */
function shows(el: LineAvatar): string | null {
  return part(el, 'root')?.getAttribute('data-shows') ?? null;
}

async function fire(el: LineAvatar, type: 'load' | 'error'): Promise<void> {
  part(el, 'image')?.dispatchEvent(new Event(type));
  await settle(el);
}

/** The text the fallback renders: the `fallback` slot's own fallback content, the computed initials. */
function initials(el: LineAvatar): string {
  return el.shadowRoot?.querySelector('slot[name="fallback"]')?.textContent ?? '';
}

function semantics(el: LineAvatar): Record<string, string | null> {
  const root = part(el, 'root');
  return {
    role: root?.getAttribute('role') ?? null,
    label: root?.getAttribute('aria-label') ?? null,
    description: root?.getAttribute('aria-description') ?? null,
    fallbackHidden: part(el, 'fallback')?.getAttribute('aria-hidden') ?? null,
    alt: part(el, 'image')?.getAttribute('alt') ?? null,
  };
}

describe('<line-avatar> defaults and shadow tree', () => {
  test('registers line-avatar with the LineAvatar class', () => {
    expect(customElements.get('line-avatar')).toBe(LineAvatar);
  });

  test('renders with no errors; src and name default to empty strings and reflect nothing', async () => {
    const el = await mount();
    expect(el.src).toBe('');
    expect(el.name).toBe('');
    expect(el.hasAttribute('src')).toBe(false);
    expect(el.hasAttribute('name')).toBe(false);
  });

  test('renders root (default slot, fallback part with the fallback slot) and the status slot outside root', async () => {
    const el = await mount();
    const children = [...(el.shadowRoot?.children ?? [])];
    expect(children.map((child) => child.getAttribute('part') ?? `slot:${child.getAttribute('name')}`)).toEqual([
      'root',
      'slot:status',
    ]);
    const root = part(el, 'root') as HTMLElement;
    expect(root.localName).toBe('span');
    expect([...root.children].map((child) => child.localName)).toEqual(['slot', 'span']);
    expect((root.firstElementChild as HTMLSlotElement).name).toBe('');
    expect(part(el, 'fallback')?.querySelector('slot')?.name).toBe('fallback');
  });

  test('takes no focus and does not delegate it', async () => {
    const el = await mount();
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.tabIndex).toBe(-1);
    expect(el.shadowRoot?.delegatesFocus).toBe(false);
  });

  test('C8: with no attributes and no content it renders an empty, decorative frame showing the fallback', async () => {
    const el = await mount();
    expect(part(el, 'image')).toBeNull();
    expect(shows(el)).toBe('fallback');
    expect(initials(el)).toBe('');
    expect(flags(el)).toEqual({ loading: false, error: false });
    expect(semantics(el)).toEqual({
      role: null,
      label: null,
      description: null,
      fallbackHidden: 'true',
      alt: null,
    });
  });
});

describe('<line-avatar> image and load flags (decisions F1, F5; D6)', () => {
  test('src renders the internal image and sets loading until load', async () => {
    const el = await mountMarkup('<line-avatar src="https://example.test/ana.jpg"></line-avatar>');
    const image = part(el, 'image') as HTMLImageElement;
    expect(image.localName).toBe('img');
    expect(image.getAttribute('src')).toBe('https://example.test/ana.jpg');
    expect(image.getAttribute('alt')).toBe('');
    expect(flags(el)).toEqual({ loading: true, error: false });
    expect(shows(el)).toBe('fallback');
    await fire(el, 'load');
    expect(flags(el)).toEqual({ loading: false, error: false });
    expect(shows(el)).toBe('image');
  });

  test('an error sets the error flag and keeps the fallback', async () => {
    const el = await mountMarkup('<line-avatar src="https://example.test/missing.jpg"></line-avatar>');
    await fire(el, 'error');
    expect(flags(el)).toEqual({ loading: false, error: true });
    expect(shows(el)).toBe('fallback');
  });

  test('a new src starts loading again, and an event for the previous src is dropped', async () => {
    const el = await mountMarkup('<line-avatar src="https://example.test/a.jpg"></line-avatar>');
    await fire(el, 'error');
    const image = part(el, 'image') as HTMLImageElement;
    el.src = 'https://example.test/b.jpg';
    await settle(el);
    expect(image.getAttribute('src')).toBe('https://example.test/b.jpg');
    expect(flags(el)).toEqual({ loading: true, error: false });
    image.setAttribute('src', 'https://example.test/a.jpg');
    image.dispatchEvent(new Event('load'));
    image.setAttribute('src', 'https://example.test/b.jpg');
    await settle(el);
    expect(flags(el)).toEqual({ loading: true, error: false });
    await fire(el, 'load');
    expect(flags(el)).toEqual({ loading: false, error: false });
    expect(shows(el)).toBe('image');
  });

  test('removing src removes the image and clears both flags without an event', async () => {
    const el = await mountMarkup('<line-avatar src="https://example.test/a.jpg"></line-avatar>');
    await fire(el, 'error');
    el.removeAttribute('src');
    await settle(el);
    expect(part(el, 'image')).toBeNull();
    expect(flags(el)).toEqual({ loading: false, error: false });
    expect(shows(el)).toBe('fallback');
  });

  for (const blank of ['', '   ']) {
    test(`a blank src ${JSON.stringify(blank)} counts as no image`, async () => {
      const el = await mountMarkup(`<line-avatar src="${blank}"></line-avatar>`);
      expect(part(el, 'image')).toBeNull();
      expect(flags(el)).toEqual({ loading: false, error: false });
    });
  }

  test('the same src set again keeps its status', async () => {
    const el = await mountMarkup('<line-avatar src="https://example.test/a.jpg"></line-avatar>');
    await fire(el, 'load');
    el.src = 'https://example.test/a.jpg';
    await settle(el);
    expect(flags(el)).toEqual({ loading: false, error: false });
    expect(shows(el)).toBe('image');
  });
});

describe('<line-avatar> custom media (decision F1)', () => {
  test('an element in the default slot replaces the src image, shows, and clears the flags', async () => {
    const el = await mountMarkup(
      '<line-avatar src="https://example.test/a.jpg" name="Ana Silva"><svg></svg></line-avatar>',
    );
    expect(part(el, 'image')).toBeNull();
    expect(shows(el)).toBe('image');
    expect(flags(el)).toEqual({ loading: false, error: false });
  });

  test('media added and removed through slotchange switches between media and the src image', async () => {
    const el = await mountMarkup('<line-avatar src="https://example.test/a.jpg"></line-avatar>');
    expect(flags(el)).toEqual({ loading: true, error: false });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.append(svg);
    await settle(el);
    expect(part(el, 'image')).toBeNull();
    expect(shows(el)).toBe('image');
    expect(flags(el)).toEqual({ loading: false, error: false });
    svg.remove();
    await settle(el);
    expect(part(el, 'image')?.getAttribute('src')).toBe('https://example.test/a.jpg');
    expect(flags(el)).toEqual({ loading: true, error: false });
    expect(shows(el)).toBe('fallback');
  });

  test('slotted text, fallback content and a status marker are not custom media', async () => {
    const el = await mountMarkup(
      '<line-avatar src="https://example.test/a.jpg">text <span slot="fallback">AS</span><span slot="status"></span></line-avatar>',
    );
    expect(part(el, 'image')).not.toBeNull();
    expect(flags(el)).toEqual({ loading: true, error: false });
  });
});

describe('<line-avatar> initials (decision F4; D9)', () => {
  for (const [name, lang, expected] of [
    ['Ana Silva', 'en', 'AS'],
    ['  ana   maria  silva ', 'en', 'AS'],
    ['Ana', 'en', 'A'],
    ['王小明', 'zh', '王'],
    ['Émile Zola', 'fr', 'ÉZ'],
    ['E\u0301mile Zola', 'fr', 'E\u0301Z'],
    ['👩‍💻 Dev Team', 'en', '👩‍💻T'],
    ['ilker ışık', 'tr', 'İI'],
    ['ilker ışık', 'en', 'II'],
    ['ilker ışık', 'not_a-tag!', 'II'],
    ['', 'en', ''],
    ['   ', 'en', ''],
  ] as const) {
    test(`${JSON.stringify(name)} in ${lang} gives ${JSON.stringify(expected)}`, async () => {
      const el = await mount(html`<line-avatar name=${name} lang=${lang}></line-avatar>`);
      expect(initials(el)).toBe(expected);
    });
  }

  test('the nearest lang of an ancestor picks the casing', async () => {
    const host = document.createElement('div');
    host.lang = 'tr';
    host.innerHTML = '<line-avatar name="ilker ışık"></line-avatar>';
    document.body.append(host);
    const el = host.querySelector('line-avatar') as LineAvatar;
    await settle(el);
    expect(initials(el)).toBe('İI');
  });

  test('a changed name renders new initials', async () => {
    const el = await mountMarkup('<line-avatar name="Ana Silva"></line-avatar>');
    el.name = 'Rui Costa';
    await settle(el);
    expect(initials(el)).toBe('RC');
  });

  test('content in the fallback slot is assigned in place of the initials', async () => {
    const el = await mountMarkup('<line-avatar name="Ana Silva"><b slot="fallback">X</b></line-avatar>');
    const slot = el.shadowRoot?.querySelector('slot[name="fallback"]') as HTMLSlotElement;
    expect(slot.assignedElements().map((element) => element.textContent)).toEqual(['X']);
  });
});

describe('<line-avatar> name on root (decisions F2, F3; D10)', () => {
  test('name makes root an img named by it, with the fallback and image presentational', async () => {
    const el = await mountMarkup('<line-avatar src="https://example.test/a.jpg" name="Ana Silva"></line-avatar>');
    expect(semantics(el)).toEqual({
      role: 'img',
      label: 'Ana Silva',
      description: null,
      fallbackHidden: null,
      alt: '',
    });
  });

  test('a host aria-label wins over name, is trimmed, and stays on the host', async () => {
    const el = await mountMarkup('<line-avatar name="Ana Silva" aria-label="  Ana Silva, team lead "></line-avatar>');
    expect(semantics(el).label).toBe('Ana Silva, team lead');
    expect(el.getAttribute('aria-label')).toBe('  Ana Silva, team lead ');
    expect(el.hasAttribute('role')).toBe(false);
  });

  test('a blank aria-label counts as absent, so name names the avatar', async () => {
    const el = await mountMarkup('<line-avatar name="Ana Silva" aria-label="  "></line-avatar>');
    expect(semantics(el)).toMatchObject({ role: 'img', label: 'Ana Silva' });
  });

  test('aria-description is copied to root only while the avatar is named', async () => {
    const el = await mountMarkup('<line-avatar aria-description="Team lead"></line-avatar>');
    expect(semantics(el)).toMatchObject({ role: null, description: null, fallbackHidden: 'true' });
    el.name = 'Ana Silva';
    await settle(el);
    expect(semantics(el)).toMatchObject({ role: 'img', label: 'Ana Silva', description: 'Team lead' });
  });

  test('a blank name and no aria-label leave the avatar decorative', async () => {
    const el = await mountMarkup('<line-avatar name="   " src="https://example.test/a.jpg"></line-avatar>');
    expect(semantics(el)).toEqual({ role: null, label: null, description: null, fallbackHidden: 'true', alt: '' });
  });

  test('a change of name, aria-label or aria-description re-renders root', async () => {
    const el = await mountMarkup('<line-avatar></line-avatar>');
    el.setAttribute('aria-label', 'Ana');
    await settle(el);
    expect(semantics(el)).toMatchObject({ role: 'img', label: 'Ana', fallbackHidden: null });
    el.setAttribute('aria-description', 'Online now');
    await settle(el);
    expect(semantics(el).description).toBe('Online now');
    el.removeAttribute('aria-label');
    await settle(el);
    expect(semantics(el)).toMatchObject({ role: null, label: null, description: null, fallbackHidden: 'true' });
    el.setAttribute('name', 'Rui');
    await settle(el);
    expect(semantics(el)).toMatchObject({ role: 'img', label: 'Rui' });
  });

  test('the component writes no role or aria attribute on the host', async () => {
    const el = await mountMarkup('<line-avatar name="Ana Silva"></line-avatar>');
    expect(el.getAttributeNames().filter((name) => name === 'role' || name.startsWith('aria-'))).toEqual([]);
  });
});

describe('<line-avatar> events', () => {
  test('dispatches no event of its own across loads, errors and changes', async () => {
    const el = await mountMarkup('<line-avatar src="https://example.test/a.jpg" name="Ana"></line-avatar>');
    const dispatch = spyOn(el, 'dispatchEvent');
    await fire(el, 'load');
    el.src = 'https://example.test/b.jpg';
    await settle(el);
    await fire(el, 'error');
    el.name = 'Rui';
    await settle(el);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
