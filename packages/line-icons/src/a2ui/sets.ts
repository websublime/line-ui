/**
 * The per-set data behind `a2uiIconMap`: for each A2UI icon name, the file name in each set, the Phosphor weight,
 * and the RTL mirror flag (R10 §2.3; Phase 1 spec §6.C.3, §10 SD15). Not a public export (§4.3; ARCH §17.7).
 *
 * The names are checked against `lucide-static` 1.56.0 and `@phosphor-icons/core` 2.1.1 (R10 P4).
 *
 * @module a2ui/sets
 */

import type { A2uiIconName } from './names.js';

/** The glyph a set draws for one A2UI name: its file name, in a set with weights the weight, and the mirror flag. */
export interface SetGlyph {
  readonly name: string;
  readonly weight?: string;
  readonly mirror: boolean;
}

/**
 * Lucide file names. Lucide has no filled glyphs and no weights, so three pairs collide on one glyph:
 * `call` and `phone` (`phone`), `favorite` and `favoriteOff` (`heart`), `star` and `starOff` (`star`) (R10 §2.3).
 */
const LUCIDE: Readonly<Record<A2uiIconName, string>> = {
  accountCircle: 'circle-user',
  add: 'plus',
  arrowBack: 'arrow-left',
  arrowForward: 'arrow-right',
  attachFile: 'paperclip',
  calendarToday: 'calendar',
  call: 'phone',
  camera: 'camera',
  check: 'check',
  close: 'x',
  delete: 'trash',
  download: 'download',
  edit: 'pencil',
  event: 'calendar-days',
  error: 'circle-alert',
  fastForward: 'fast-forward',
  favorite: 'heart',
  favoriteOff: 'heart',
  folder: 'folder',
  help: 'circle-question-mark',
  home: 'house',
  info: 'info',
  locationOn: 'map-pin',
  lock: 'lock',
  lockOpen: 'lock-open',
  mail: 'mail',
  menu: 'menu',
  moreVert: 'ellipsis-vertical',
  moreHoriz: 'ellipsis',
  notificationsOff: 'bell-off',
  notifications: 'bell',
  pause: 'pause',
  payment: 'credit-card',
  person: 'user',
  phone: 'phone',
  photo: 'image',
  play: 'play',
  print: 'printer',
  refresh: 'refresh-cw',
  rewind: 'rewind',
  search: 'search',
  send: 'send',
  settings: 'settings',
  share: 'share-2',
  shoppingCart: 'shopping-cart',
  skipNext: 'skip-forward',
  skipPrevious: 'skip-back',
  star: 'star',
  starHalf: 'star-half',
  starOff: 'star',
  stop: 'square',
  upload: 'upload',
  visibility: 'eye',
  visibilityOff: 'eye-off',
  volumeDown: 'volume-1',
  volumeMute: 'volume',
  volumeOff: 'volume-x',
  volumeUp: 'volume-2',
  warning: 'triangle-alert',
};

/** Phosphor file names. `call` and `phone` share `phone` (R10 §2.3). */
const PHOSPHOR: Readonly<Record<A2uiIconName, string>> = {
  accountCircle: 'user-circle',
  add: 'plus',
  arrowBack: 'arrow-left',
  arrowForward: 'arrow-right',
  attachFile: 'paperclip',
  calendarToday: 'calendar-blank',
  call: 'phone',
  camera: 'camera',
  check: 'check',
  close: 'x',
  delete: 'trash',
  download: 'download-simple',
  edit: 'pencil-simple',
  event: 'calendar-dots',
  error: 'warning-circle',
  fastForward: 'fast-forward',
  favorite: 'heart',
  favoriteOff: 'heart',
  folder: 'folder',
  help: 'question',
  home: 'house',
  info: 'info',
  locationOn: 'map-pin',
  lock: 'lock',
  lockOpen: 'lock-open',
  mail: 'envelope-simple',
  menu: 'list',
  moreVert: 'dots-three-vertical',
  moreHoriz: 'dots-three',
  notificationsOff: 'bell-slash',
  notifications: 'bell',
  pause: 'pause',
  payment: 'credit-card',
  person: 'user',
  phone: 'phone',
  photo: 'image',
  play: 'play',
  print: 'printer',
  refresh: 'arrow-clockwise',
  rewind: 'rewind',
  search: 'magnifying-glass',
  send: 'paper-plane-right',
  settings: 'gear',
  share: 'share-network',
  shoppingCart: 'shopping-cart',
  skipNext: 'skip-forward',
  skipPrevious: 'skip-back',
  star: 'star',
  starHalf: 'star-half',
  starOff: 'star',
  stop: 'stop',
  upload: 'upload-simple',
  visibility: 'eye',
  visibilityOff: 'eye-slash',
  volumeDown: 'speaker-low',
  volumeMute: 'speaker-none',
  volumeOff: 'speaker-x',
  volumeUp: 'speaker-high',
  warning: 'warning',
};

/**
 * The names Material draws filled, which Phosphor draws with the `fill` weight; every other name takes `regular`
 * (R10 §2.3 rows 17, 48, 49).
 */
const PHOSPHOR_FILL: Readonly<Partial<Record<A2uiIconName, true>>> = { favorite: true, star: true, starHalf: true };

/**
 * The nine names that mirror in RTL: those whose Material Symbols drawable sets `android:autoMirrored="true"`
 * (R10 §2.3, P5). Neither set marks mirroring in its files, so the flag is the same in both.
 */
const MIRRORED: Readonly<Partial<Record<A2uiIconName, true>>> = {
  arrowBack: true,
  arrowForward: true,
  help: true,
  send: true,
  starHalf: true,
  volumeDown: true,
  volumeMute: true,
  volumeOff: true,
  volumeUp: true,
};

/** The glyph of each A2UI name, per set, with its RTL mirror flag. */
export const ICON_SETS: Readonly<Record<'lucide' | 'phosphor', (name: A2uiIconName) => SetGlyph>> = {
  lucide: (name) => ({ name: LUCIDE[name], mirror: MIRRORED[name] === true }),
  phosphor: (name) => ({
    name: PHOSPHOR[name],
    weight: PHOSPHOR_FILL[name] ? 'fill' : 'regular',
    mirror: MIRRORED[name] === true,
  }),
};
