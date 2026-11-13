/**
 * `<line-kbd>` unit tier (spec `0015-kbd.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`. The component comes from `src/` and `line-core` from its built
 * `dist/` (spec §7.8 rules 1 and 3), so this file needs `bun run build` first, as the CI unit tier has. Each case sets
 * the drawing through the `platform` attribute; the `auto` cases stub `navigator` per case and call the pure
 * `readPlatform` with stub objects (P8; D8). Names, layout and real platform values live in the browser tier
 * (`integration/kbd/kbd.e2e.ts`).
 *
 * @module __tests__/kbd
 */

import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { fixture } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import { html, type TemplateResult } from 'lit';
import { LineKbd } from '../src/kbd/index.js';
import { readPlatform } from '../src/kbd/keys.js';

async function mount(template: TemplateResult): Promise<LineKbd> {
  const el = await fixture<LineKbd>(template);
  await el.updateComplete;
  return el;
}

/** Mounts `<line-kbd keys=… platform=…>` with an optional `key-labels`. */
function draw(keys: string, platform: 'apple' | 'other', labels?: string): Promise<LineKbd> {
  const el = document.createElement('line-kbd');
  el.setAttribute('keys', keys);
  el.setAttribute('platform', platform);
  if (labels !== undefined) el.setAttribute('key-labels', labels);
  return mount(html`${el}`);
}

function rootOf(el: LineKbd): HTMLElement {
  return el.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
}

/** The text the shortcut shows: every text node outside the hidden `.word` spans. */
function visible(el: LineKbd): string {
  const walker = document.createTreeWalker(rootOf(el), NodeFilter.SHOW_TEXT);
  let text = '';
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.parentElement?.closest('.word')) text += node.textContent;
  }
  return text;
}

/** The visually hidden words, in order. */
function hidden(el: LineKbd): string[] {
  return [...rootOf(el).querySelectorAll('.word')].map((word) => word.textContent ?? '');
}

function count(el: LineKbd, part: string): number {
  return rootOf(el).querySelectorAll(`[part="${part}"]`).length;
}

function slotOf(el: LineKbd): HTMLSlotElement | null {
  return el.shadowRoot?.querySelector('slot') ?? null;
}

afterEach(() => {
  LineKbd.keyLabels = {};
});

describe('<line-kbd> registration and shadow tree', () => {
  test('registers line-kbd with its class', () => {
    expect(customElements.get('line-kbd')).toBe(LineKbd);
    expect(document.createElement('line-kbd')).toBeInstanceOf(LineKbd);
  });

  test('a glyph key holds an aria-hidden glyph and a hidden word; a separator is aria-hidden', async () => {
    const apple = await draw('mod+k', 'apple');
    const glyphKey = rootOf(apple).querySelector('[part="item"]') as HTMLElement;
    expect(rootOf(apple).localName).toBe('kbd');
    expect(glyphKey.localName).toBe('kbd');
    expect(glyphKey.querySelector('[aria-hidden="true"]')?.textContent).toBe('⌘');
    expect(glyphKey.querySelector('.word')?.textContent).toBe('Command');
    const other = await draw('mod+k', 'other');
    const separator = rootOf(other).querySelector('[part="separator"]') as HTMLElement;
    expect(separator.localName).toBe('span');
    expect(separator.getAttribute('aria-hidden')).toBe('true');
    expect(separator.textContent).toBe('+');
  });
});

/** Every row of the drawing table and every alias: [keys, Apple visible, Apple hidden, other visible, other hidden]. */
const TABLE: readonly (readonly [string, string, readonly string[], string, readonly string[]])[] = [
  ['mod', '⌘', ['Command'], 'Ctrl', []],
  ['meta', '⌘', ['Command'], 'Meta', []],
  ['cmd', '⌘', ['Command'], 'Meta', []],
  ['command', '⌘', ['Command'], 'Meta', []],
  ['control', '⌃', ['Control'], 'Ctrl', []],
  ['ctrl', '⌃', ['Control'], 'Ctrl', []],
  ['alt', '⌥', ['Option'], 'Alt', []],
  ['option', '⌥', ['Option'], 'Alt', []],
  ['opt', '⌥', ['Option'], 'Alt', []],
  ['shift', '⇧', ['Shift'], 'Shift', []],
  ['enter', '↩', ['Return'], 'Enter', []],
  ['return', '↩', ['Return'], 'Enter', []],
  ['escape', '⎋', ['Escape'], 'Esc', []],
  ['esc', '⎋', ['Escape'], 'Esc', []],
  ['backspace', '⌫', ['Delete'], 'Backspace', []],
  ['delete', '⌦', ['Forward Delete'], 'Del', []],
  ['del', '⌦', ['Forward Delete'], 'Del', []],
  ['tab', '⇥', ['Tab'], 'Tab', []],
  ['space', 'Space', [], 'Space', []],
  ['up', '↑', ['Up Arrow'], '↑', ['Up Arrow']],
  ['arrowup', '↑', ['Up Arrow'], '↑', ['Up Arrow']],
  ['down', '↓', ['Down Arrow'], '↓', ['Down Arrow']],
  ['arrowdown', '↓', ['Down Arrow'], '↓', ['Down Arrow']],
  ['left', '←', ['Left Arrow'], '←', ['Left Arrow']],
  ['arrowleft', '←', ['Left Arrow'], '←', ['Left Arrow']],
  ['right', '→', ['Right Arrow'], '→', ['Right Arrow']],
  ['arrowright', '→', ['Right Arrow'], '→', ['Right Arrow']],
  ['pageup', 'Page Up', [], 'Page Up', []],
  ['pagedown', 'Page Down', [], 'Page Down', []],
  ['home', 'Home', [], 'Home', []],
  ['end', 'End', [], 'End', []],
  ['plus', '+', ['Plus'], 'Plus', []],
];

describe('<line-kbd> drawing table (P2; F3, F4)', () => {
  for (const [keys, appleText, appleWords, otherText, otherWords] of TABLE) {
    test(`${keys} draws ${appleText} on Apple and ${otherText} elsewhere`, async () => {
      const apple = await draw(keys, 'apple');
      expect([visible(apple), hidden(apple), count(apple, 'item'), count(apple, 'separator')]).toEqual([
        appleText,
        [...appleWords],
        1,
        0,
      ]);
      const other = await draw(keys, 'other');
      expect([visible(other), hidden(other), count(other, 'item'), count(other, 'separator')]).toEqual([
        otherText,
        [...otherWords],
        1,
        0,
      ]);
    });
  }

  test('key names are case-insensitive', async () => {
    expect(visible(await draw('MOD+Shift+K', 'other'))).toBe('Ctrl+Shift+K');
    expect(visible(await draw('Cmd+ESC', 'apple'))).toBe('⌘⎋');
  });

  test('unknown names draw their own text, one character upper-cased, a longer name with its first letter upper-cased', async () => {
    expect(visible(await draw('k', 'other'))).toBe('K');
    expect(visible(await draw('?', 'other'))).toBe('?');
    expect(visible(await draw('f5', 'apple'))).toBe('F5');
    expect(visible(await draw('insert', 'other'))).toBe('Insert');
  });
});

describe('<line-kbd> chords (P2; F3 (a))', () => {
  test('mod+shift+p: Apple sorts the modifiers and draws no separator; other keeps the author order with +', async () => {
    const apple = await draw('mod+shift+p', 'apple');
    expect([visible(apple), hidden(apple), count(apple, 'item'), count(apple, 'separator')]).toEqual([
      '⇧⌘P',
      ['Shift', 'Command'],
      3,
      0,
    ]);
    const other = await draw('mod+shift+p', 'other');
    expect([visible(other), hidden(other), count(other, 'item'), count(other, 'separator')]).toEqual([
      'Ctrl+Shift+P',
      [],
      3,
      2,
    ]);
  });

  test('Apple order is Control, Option, Shift, Command; other keys follow in the author order', async () => {
    const apple = await draw('shift+mod+alt+ctrl+k', 'apple');
    expect(visible(apple)).toBe('⌃⌥⇧⌘K');
    expect(hidden(apple)).toEqual(['Control', 'Option', 'Shift', 'Command']);
    expect(visible(await draw('alt+ctrl+s', 'apple'))).toBe('⌃⌥S');
    expect(visible(await draw('alt+ctrl+s', 'other'))).toBe('Alt+Ctrl+S');
    expect(visible(await draw('k+mod', 'apple'))).toBe('⌘K');
    expect(visible(await draw('mod+k+j', 'apple'))).toBe('⌘KJ');
    expect(visible(await draw('meta+shift+alt', 'apple'))).toBe('⌥⇧⌘');
  });

  test('named keys in a chord: mod+enter, mod+backspace, mod+plus, shift+?', async () => {
    expect(visible(await draw('mod+enter', 'apple'))).toBe('⌘↩');
    expect(visible(await draw('mod+enter', 'other'))).toBe('Ctrl+Enter');
    expect(visible(await draw('mod+backspace', 'apple'))).toBe('⌘⌫');
    expect(hidden(await draw('mod+backspace', 'apple'))).toEqual(['Command', 'Delete']);
    expect(visible(await draw('mod+backspace', 'other'))).toBe('Ctrl+Backspace');
    expect(visible(await draw('mod+plus', 'apple'))).toBe('⌘+');
    expect(visible(await draw('mod+plus', 'other'))).toBe('Ctrl+Plus');
    expect(visible(await draw('shift+?', 'apple'))).toBe('⇧?');
    expect(visible(await draw('shift+?', 'other'))).toBe('Shift+?');
  });
});

describe('<line-kbd> sequences (P3; F6)', () => {
  test('g i draws two keys, the second with data-step, and one hidden " then "', async () => {
    for (const platform of ['apple', 'other'] as const) {
      const el = await draw('g i', platform);
      const items = [...rootOf(el).querySelectorAll('[part="item"]')];
      expect(items.map((item) => item.hasAttribute('data-step'))).toEqual([false, true]);
      expect(visible(el)).toBe('GI');
      expect(hidden(el)).toEqual([' then ']);
      expect(count(el, 'separator')).toBe(0);
    }
  });

  test('data-step marks the first key of each later step and each boundary holds one " then "', async () => {
    const el = await draw('mod+k  shift+p  x', 'other');
    const items = [...rootOf(el).querySelectorAll('[part="item"]')];
    expect(items.map((item) => item.hasAttribute('data-step'))).toEqual([false, false, true, false, true]);
    expect(hidden(el)).toEqual([' then ', ' then ']);
    expect(visible(el)).toBe('Ctrl+KShift+PX');
  });

  test('up down carries the arrow words and " then "', async () => {
    const el = await draw('up down', 'apple');
    expect(visible(el)).toBe('↑↓');
    expect(hidden(el)).toEqual(['Up Arrow', ' then ', 'Down Arrow']);
  });

  test('a then override renders " dann "', async () => {
    expect(hidden(await draw('g i', 'other', '{"then": "dann"}'))).toEqual([' dann ']);
  });
});

describe('<line-kbd> dedupe and empty keys (D9)', () => {
  test('a repeated word id draws once, at its first occurrence', async () => {
    const other = await draw('shift+mod+alt+ctrl+k', 'other');
    expect(visible(other)).toBe('Shift+Ctrl+Alt+K');
    expect([count(other, 'item'), count(other, 'separator')]).toEqual([4, 3]);
    expect(visible(await draw('ctrl+mod+k', 'apple'))).toBe('⌃⌘K');
    expect(visible(await draw('cmd+mod+k', 'apple'))).toBe('⌘K');
    expect(visible(await draw('mod+K+k', 'other'))).toBe('Ctrl+K');
    expect(visible(await draw('x+X', 'other'))).toBe('X');
  });

  test('empty keys and extra whitespace are dropped', async () => {
    expect(visible(await draw('  mod++k+ ', 'other'))).toBe('Ctrl+K');
    const el = await draw(' g \n\t i ', 'other');
    expect([visible(el), hidden(el)]).toEqual(['GI', [' then ']]);
  });

  test('an unknown name is never looked up as a word', async () => {
    expect(visible(await draw('then', 'other'))).toBe('Then');
    expect(visible(await draw('k', 'other', '{"k": "X"}'))).toBe('K');
    LineKbd.keyLabels = { k: 'X', 'other.k': 'Y' };
    expect(visible(await draw('k', 'other'))).toBe('K');
  });
});

describe('<line-kbd> fallback slot (F2 (c); D9)', () => {
  for (const [label, template] of [
    ['an absent attribute', html`<line-kbd>Esc</line-kbd>`],
    ['keys=""', html`<line-kbd keys="">Esc</line-kbd>`],
    ['keys="   "', html`<line-kbd keys="   ">Esc</line-kbd>`],
    ['keys="+"', html`<line-kbd keys="+">Esc</line-kbd>`],
  ] as const) {
    test(`${label} renders the default slot in the root`, async () => {
      const el = await mount(template);
      const slot = slotOf(el);
      expect(slot?.parentElement).toBe(rootOf(el));
      expect(slot?.assignedNodes().map((node) => node.textContent)).toEqual(['Esc']);
      expect(count(el, 'item')).toBe(0);
    });
  }

  test('the slot is not rendered once keys yields a key, and returns when keys is cleared', async () => {
    const el = await mount(html`<line-kbd platform="other">Ctrl+K</line-kbd>`);
    expect(slotOf(el)).not.toBeNull();
    el.keys = 'mod+k';
    await el.updateComplete;
    expect(slotOf(el)).toBeNull();
    expect(visible(el)).toBe('Ctrl+K');
    el.removeAttribute('keys');
    el.keys = '';
    await el.updateComplete;
    expect(slotOf(el)).not.toBeNull();
  });
});

describe('readPlatform (P1, P8; F1)', () => {
  for (const [label, nav, expected] of [
    ['userAgentData.platform macOS', { userAgentData: { platform: 'macOS' }, platform: 'Win32' }, 'apple'],
    ['userAgentData.platform Windows', { userAgentData: { platform: 'Windows' }, platform: 'MacIntel' }, 'other'],
    [
      'an empty userAgentData.platform falls through to platform',
      { userAgentData: { platform: '' }, platform: 'MacIntel' },
      'apple',
    ],
    ['platform MacIntel', { platform: 'MacIntel' }, 'apple'],
    ['platform iPhone', { platform: 'iPhone' }, 'apple'],
    ['platform Win32', { platform: 'Win32' }, 'other'],
    ['platform Linux x86_64', { platform: 'Linux x86_64' }, 'other'],
    ['an empty platform', { platform: '' }, 'other'],
    ['undefined', undefined, 'other'],
  ] as const) {
    test(`${label} → ${expected}`, () => {
      expect(readPlatform(nav)).toBe(expected);
    });
  }
});

describe('<line-kbd> platform (F1; D8, D9)', () => {
  /** Shadows `navigator.platform` on the happy-dom navigator; `restore` removes the own property again. */
  function stubPlatform(value: string): void {
    Object.defineProperty(navigator, 'platform', { value, configurable: true });
  }
  function restore(): void {
    Reflect.deleteProperty(navigator, 'platform');
  }

  test('auto is re-read on the next update after the navigator changes (D8)', async () => {
    try {
      stubPlatform('MacIntel');
      const el = await mount(html`<line-kbd keys="mod+k"></line-kbd>`);
      expect(visible(el)).toBe('⌘K');
      stubPlatform('Win32');
      el.requestUpdate();
      await el.updateComplete;
      expect(visible(el)).toBe('Ctrl+K');
    } finally {
      restore();
    }
  });

  test('platform reflects with useDefault: the default leaves no attribute, a set value is written', async () => {
    const el = await mount(html`<line-kbd keys="mod+k"></line-kbd>`);
    expect(el.platform).toBe('auto');
    expect(el.hasAttribute('platform')).toBe(false);
    el.platform = 'apple';
    await el.updateComplete;
    expect(el.getAttribute('platform')).toBe('apple');
    expect(visible(el)).toBe('⌘K');
  });

  test('an unknown platform behaves as auto and the attribute keeps it (C8)', async () => {
    try {
      stubPlatform('Win32');
      const el = await mount(html`<line-kbd keys="mod+k" platform="windows"></line-kbd>`);
      expect(el.platform).toBe('auto');
      expect(el.getAttribute('platform')).toBe('windows');
      expect(visible(el)).toBe('Ctrl+K');
    } finally {
      restore();
    }
  });
});

describe('<line-kbd> words and their override (F5 (d))', () => {
  test('the attribute bare id wins over the static platform-qualified id', async () => {
    LineKbd.keyLabels = { 'other.control': 'Strg' };
    expect(visible(await draw('mod+k', 'other', '{"control": "X"}'))).toBe('X+K');
  });

  test('the five steps, in order', async () => {
    LineKbd.keyLabels = { 'other.shift': 'S3', shift: 'S4' };
    expect(visible(await draw('shift', 'other', '{"other.shift": "S1", "shift": "S2"}'))).toBe('S1');
    expect(visible(await draw('shift', 'other', '{"shift": "S2"}'))).toBe('S2');
    expect(visible(await draw('shift', 'other'))).toBe('S3');
    LineKbd.keyLabels = { shift: 'S4' };
    expect(visible(await draw('shift', 'other'))).toBe('S4');
    LineKbd.keyLabels = {};
    expect(visible(await draw('shift', 'other'))).toBe('Shift');
  });

  test('platform-qualified ids apply to their platform only; Apple words are the hidden words', async () => {
    const labels = '{"other.control": "Strg", "apple.alt": "Wahltaste"}';
    const apple = await draw('mod+alt+ctrl+k', 'apple', labels);
    expect(hidden(apple)).toEqual(['Control', 'Wahltaste', 'Command']);
    expect(visible(await draw('mod+alt+k', 'other', labels))).toBe('Strg+Alt+K');
  });

  test('mod takes the word id of the key it resolves to', async () => {
    const labels = '{"meta": "Befehl", "control": "Strg"}';
    expect(hidden(await draw('mod+k', 'apple', labels))).toEqual(['Befehl']);
    expect(visible(await draw('mod+k', 'other', labels))).toBe('Strg+K');
  });

  test('the two maps merge per id', async () => {
    LineKbd.keyLabels = { 'other.control': 'Strg', 'other.shift': 'Umschalt' };
    const el = await draw('mod+shift+p g', 'other', '{"then": "dann"}');
    expect(visible(el)).toBe('Strg+Umschalt+PG');
    expect(hidden(el)).toEqual([' dann ']);
  });

  for (const invalid of ['not json', '[1, 2]', 'null', '"Strg"', '{"control": 1}', '{"control": "X", "alt": null}']) {
    test(`an invalid key-labels ${invalid} is ignored as a whole and falls through to the static`, async () => {
      LineKbd.keyLabels = { control: 'Strg' };
      expect(visible(await draw('ctrl+alt+k', 'other', invalid))).toBe('Strg+Alt+K');
    });
  }

  test('a changed static is picked up on the next update', async () => {
    const el = await draw('mod+k', 'other');
    expect(visible(el)).toBe('Ctrl+K');
    LineKbd.keyLabels = { control: 'Strg' };
    el.requestUpdate();
    await el.updateComplete;
    expect(visible(el)).toBe('Strg+K');
  });
});

describe('<line-kbd> writes nothing on the host and fires nothing (D1, D2)', () => {
  test('no role, no aria-* and no internals value on the host', async () => {
    const el = await mount(html`<line-kbd keys="mod+k" platform="apple"></line-kbd>`);
    expect(el.getAttributeNames().sort()).toEqual(['keys', 'platform']);
    const internals = Reflect.get(el, INTERNALS) as {
      role: string | null;
      ariaHidden: string | null;
      ariaLabel: string | null;
      states: Set<string>;
    };
    expect(internals.role ?? null).toBeNull();
    expect(internals.ariaHidden ?? null).toBeNull();
    expect(internals.ariaLabel ?? null).toBeNull();
    expect([...internals.states]).toEqual([]);
    expect(el.tabIndex).toBe(-1);
  });

  test('dispatches no event of any kind', async () => {
    const dispatch = spyOn(LineKbd.prototype, 'dispatchEvent');
    try {
      const el = await mount(html`<line-kbd keys="mod+k" platform="other"></line-kbd>`);
      el.keys = 'g i';
      el.platform = 'apple';
      el.setAttribute('key-labels', '{"then": "dann"}');
      el.click();
      await el.updateComplete;
      expect(dispatch.mock.calls.filter(([event]) => event.type !== 'click')).toEqual([]);
    } finally {
      dispatch.mockRestore();
    }
  });
});

describe('<line-kbd> with no attributes and no content (C8)', () => {
  test('renders an empty slot in the root, adds no text and throws nothing', async () => {
    const el = await mount(html`<line-kbd></line-kbd>`);
    expect(slotOf(el)?.assignedNodes()).toEqual([]);
    expect(rootOf(el).textContent).toBe('');
    expect(el.getAttributeNames()).toEqual([]);
  });
});
