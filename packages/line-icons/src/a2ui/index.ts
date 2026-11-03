/**
 * `@websublime/line-icons/a2ui`: the map from the A2UI icon names to the files of a registered icon set, for the
 * `<line-a2ui-surface>` property `iconMap` (Phase 1 spec §6.C.3; §10 SD14, SD15; ARCH §17.3).
 *
 * Preview: this subpath follows the preview status of `@websublime/line-genui/a2ui` until A2UI v1.0 (ARCH §17.7).
 *
 * @module a2ui
 */

import { A2UI_ICON_NAMES, type A2uiIconName } from './names.js';
import { ICON_SETS } from './sets.js';

export type { A2uiIconName };

/**
 * Where `<line-icon>` finds the glyph of one A2UI name: the `library` the consumer registered the set under, the
 * name of the file in that set, its `weight` (Phosphor only) and whether it mirrors in RTL. The surface sets the
 * `<line-icon>` attributes `library`, `name`, `weight` and `mirror` from it.
 */
export type A2uiIconEntry = { library: string; name: string; weight?: string; mirror: boolean };

/** The map of every A2UI icon name to its entry, keyed by A2UI name. */
export type A2uiIconMap = Readonly<Record<A2uiIconName, A2uiIconEntry>>;

/**
 * Returns the A2UI icon map of a set, for the `<line-a2ui-surface>` property `iconMap`.
 *
 * Each entry carries `library`, the name of the A2UI icon's file in `set`, the Phosphor weight (`fill` for
 * `favorite`, `star` and `starHalf`, `regular` otherwise; Lucide entries have none) and the RTL mirror flag, which
 * nine names set (`arrowBack`, `arrowForward`, `help`, `send`, `starHalf` and the four `volume*` names). The result
 * is a frozen object with a `null` prototype, so only the 59 names are its keys; each entry is frozen too.
 *
 * Lucide has no filled glyphs, so three pairs draw one glyph each: `call` and `phone`, `favorite` and
 * `favoriteOff`, `star` and `starOff`. In Phosphor, `call` and `phone` share a glyph.
 *
 * `line-icons` picks no default set: register one in the icon registry and pass its key as `library`.
 *
 * @param set The icon set the consumer registered: `'lucide'` or `'phosphor'`.
 * @param options `library` is the key under which the consumer registered that set.
 * @throws {Error} When `set` is neither `'lucide'` nor `'phosphor'`.
 *
 * @example
 * ```ts
 * iconRegistry.register('phosphor', createPhosphorResolver({ base: '/icons/phosphor/' }));
 * surface.iconMap = a2uiIconMap('phosphor', { library: 'phosphor' });
 * ```
 */
export function a2uiIconMap(set: 'lucide' | 'phosphor', options: { readonly library: string }): A2uiIconMap {
  if (!Object.hasOwn(ICON_SETS, set)) throw new Error(`[line-icons] Unknown A2UI icon set "${set}".`);
  const glyph = ICON_SETS[set];
  const { library } = options;
  const map: Partial<Record<A2uiIconName, A2uiIconEntry>> = Object.create(null);
  for (const name of A2UI_ICON_NAMES) map[name] = Object.freeze({ library, ...glyph(name) });
  return Object.freeze(map as Record<A2uiIconName, A2uiIconEntry>);
}
