/**
 * The `keys` grammar, the drawing table and the platform reader of `<line-kbd>` (spec `0015-kbd.md` Keys grammar,
 * Drawing table, Words and their override). Pure functions, with no DOM access, so the unit tier calls them with stub
 * objects.
 *
 * @module kbd/keys
 */

/** The drawing a host uses once `auto` is resolved. */
export type ResolvedPlatform = 'apple' | 'other';

/** The two `navigator` fields `readPlatform` reads; a real `Navigator` satisfies it. */
export interface NavigatorLike {
  readonly platform?: string;
  readonly userAgentData?: { readonly platform?: string };
}

const APPLE = /^(Mac|iPhone|iPad|iPod)/i;

/**
 * Returns `apple` when `nav.userAgentData.platform`, or else `nav.platform`, names a Mac, iPhone, iPad or iPod, and
 * `other` otherwise, including without a navigator. `||` falls through on an empty `userAgentData.platform` (F1).
 */
export function readPlatform(nav: NavigatorLike | undefined): ResolvedPlatform {
  return APPLE.test(nav?.userAgentData?.platform || nav?.platform || '') ? 'apple' : 'other';
}

/** One key's drawing on one platform: a glyph with a hidden word, or a visible word alone. */
interface Drawing {
  readonly glyph?: string;
  readonly word: string;
}

/** A named key: its word id and its drawing on each platform. */
interface NamedKey {
  readonly id: string;
  readonly apple: Drawing;
  readonly other: Drawing;
}

const named = (id: string, apple: Drawing, other: Drawing = apple): NamedKey => ({ id, apple, other });

const META = named('meta', { glyph: '⌘', word: 'Command' }, { word: 'Meta' });
const CONTROL = named('control', { glyph: '⌃', word: 'Control' }, { word: 'Ctrl' });
const ALT = named('alt', { glyph: '⌥', word: 'Option' }, { word: 'Alt' });
const SHIFT = named('shift', { glyph: '⇧', word: 'Shift' }, { word: 'Shift' });
const ENTER = named('enter', { glyph: '↩', word: 'Return' }, { word: 'Enter' });
const ESCAPE = named('escape', { glyph: '⎋', word: 'Escape' }, { word: 'Esc' });
const BACKSPACE = named('backspace', { glyph: '⌫', word: 'Delete' }, { word: 'Backspace' });
const DELETE = named('delete', { glyph: '⌦', word: 'Forward Delete' }, { word: 'Del' });
const UP = named('up', { glyph: '↑', word: 'Up Arrow' });
const DOWN = named('down', { glyph: '↓', word: 'Down Arrow' });
const LEFT = named('left', { glyph: '←', word: 'Left Arrow' });
const RIGHT = named('right', { glyph: '→', word: 'Right Arrow' });

/** Every key name with a platform-specific drawing, aliases included, lower-cased (Drawing table). */
const NAMED_KEYS: Readonly<Record<string, NamedKey>> = {
  meta: META,
  cmd: META,
  command: META,
  control: CONTROL,
  ctrl: CONTROL,
  alt: ALT,
  option: ALT,
  opt: ALT,
  shift: SHIFT,
  enter: ENTER,
  return: ENTER,
  escape: ESCAPE,
  esc: ESCAPE,
  backspace: BACKSPACE,
  delete: DELETE,
  del: DELETE,
  tab: named('tab', { glyph: '⇥', word: 'Tab' }, { word: 'Tab' }),
  space: named('space', { word: 'Space' }),
  up: UP,
  arrowup: UP,
  down: DOWN,
  arrowdown: DOWN,
  left: LEFT,
  arrowleft: LEFT,
  right: RIGHT,
  arrowright: RIGHT,
  pageup: named('pageup', { word: 'Page Up' }),
  pagedown: named('pagedown', { word: 'Page Down' }),
  home: named('home', { word: 'Home' }),
  end: named('end', { word: 'End' }),
  plus: named('plus', { glyph: '+', word: 'Plus' }, { word: 'Plus' }),
};

/** The Apple modifier order: Control, Option, Shift, Command (Drawing table). */
const APPLE_MODIFIERS: readonly string[] = ['control', 'alt', 'shift', 'meta'];

/** The word id of the hidden word between the steps of a sequence. */
const THEN = 'then';

/** One node of the drawn shortcut, in order; `render` maps each to its element. */
export type KbdNode =
  | {
      readonly kind: 'key';
      /** The visible glyph, hidden from assistive technology; absent for a word key. */
      readonly glyph?: string;
      /** The hidden word beside a glyph, or the visible word of a word key. */
      readonly word: string;
      /** Whether the key is the first of a later step, which carries `data-step`. */
      readonly step: boolean;
    }
  | { readonly kind: 'separator' }
  | { readonly kind: 'then'; readonly word: string };

/** Looks up the word for a word id on a platform, or returns `undefined` to keep the English default. */
export type WordLookup = (id: string, platform: ResolvedPlatform) => string | undefined;

/** A key of one step after parsing: a named key's drawing, or an unknown name's own text. */
interface ParsedKey {
  readonly id: string;
  readonly drawing: Drawing;
  /** Whether the word comes from the table and so takes the consumer's override. */
  readonly named: boolean;
}

function parseKey(name: string, platform: ResolvedPlatform): ParsedKey {
  const lower = name.toLowerCase();
  // `mod` takes the id and drawing of the key it resolves to (Drawing table).
  const key =
    lower === 'mod'
      ? platform === 'apple'
        ? META
        : CONTROL
      : Object.hasOwn(NAMED_KEYS, lower)
        ? NAMED_KEYS[lower]
        : undefined;
  if (key) return { id: key.id, drawing: key[platform], named: true };
  // An unknown name draws its own text: one character upper-cased, a longer name with its first letter upper-cased.
  return { id: lower, drawing: { word: name.charAt(0).toUpperCase() + name.slice(1) }, named: false };
}

/** Parses one step, drops empty keys and every repeat of a word id, and orders it for the platform (D9; F3). */
function parseStep(step: string, platform: ResolvedPlatform): ParsedKey[] {
  const seen = new Set<string>();
  const keys: ParsedKey[] = [];
  for (const name of step.split('+')) {
    if (name === '') continue;
    const key = parseKey(name, platform);
    if (seen.has(key.id)) continue;
    seen.add(key.id);
    keys.push(key);
  }
  if (platform !== 'apple') return keys;
  const modifiers = APPLE_MODIFIERS.flatMap((id) => keys.filter((key) => key.id === id));
  return [...modifiers, ...keys.filter((key) => !APPLE_MODIFIERS.includes(key.id))];
}

/**
 * Draws `keys` for `platform` as a flat list of nodes, with `lookup` supplying the consumer's words. An empty list
 * means `keys` yields no key, and the host renders its default slot (F2 (c); D9). Never throws.
 */
export function drawKeys(keys: string, platform: ResolvedPlatform, lookup: WordLookup): KbdNode[] {
  const word = (id: string, fallback: string): string => lookup(id, platform) ?? fallback;
  const nodes: KbdNode[] = [];
  const steps = keys
    .split(/\s+/)
    .map((step) => parseStep(step, platform))
    .filter((step) => step.length > 0);
  steps.forEach((step, index) => {
    if (index > 0) nodes.push({ kind: 'then', word: word(THEN, THEN) });
    step.forEach((key, position) => {
      if (position > 0 && platform !== 'apple') nodes.push({ kind: 'separator' });
      const text = key.named ? word(key.id, key.drawing.word) : key.drawing.word;
      const startsStep = index > 0 && position === 0;
      nodes.push(
        key.drawing.glyph === undefined
          ? { kind: 'key', word: text, step: startsStep }
          : { kind: 'key', glyph: key.drawing.glyph, word: text, step: startsStep },
      );
    });
  });
  return nodes;
}

/**
 * Reads a `key-labels` value: a JSON object whose values are all strings. Any other value, invalid JSON included, is
 * ignored as a whole and yields an empty map (F5; D9; MANIFESTO Law 9).
 */
export function parseKeyLabels(value: string): Readonly<Record<string, string>> {
  if (value.trim() === '') return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
  const entries = Object.entries(parsed);
  return entries.every(([, each]) => typeof each === 'string') ? Object.fromEntries(entries) : {};
}

/**
 * Builds the lookup of the five-step precedence: the attribute's platform-qualified id, its bare id, the static's
 * platform-qualified id, its bare id, then the English default, which the caller supplies (F5 (d)).
 */
export function wordLookup(
  attribute: Readonly<Record<string, string>>,
  statics: Readonly<Record<string, string>>,
): WordLookup {
  const own = (map: Readonly<Record<string, string>>, id: string): string | undefined =>
    Object.hasOwn(map, id) ? map[id] : undefined;
  return (id, platform) => {
    const qualified = `${platform}.${id}`;
    return own(attribute, qualified) ?? own(attribute, id) ?? own(statics, qualified) ?? own(statics, id);
  };
}
