// Phosphor ships one SVG file per weight and icon, `assets/<weight>/<file>.svg` in `@phosphor-icons/core`.
import type { IconResolver } from '../registry.js';
import { fetchIcon, type IconBase } from './fetch-icon.js';
import { assertIconName } from './icon-name.js';

export type PhosphorWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

export interface PhosphorResolverOptions {
  /** The `@phosphor-icons/core` `assets/` folder, with a trailing slash; a path-only base resolves against `document.baseURI`. */
  base: IconBase;
  /** The weight used when `options.weight` is absent; `regular` by default. */
  weight?: PhosphorWeight;
}

const WEIGHTS = new Set<PhosphorWeight>(['thin', 'light', 'regular', 'bold', 'fill', 'duotone']);

export function createPhosphorResolver(defaults: PhosphorResolverOptions): IconResolver {
  // Read without destructuring, so a call without options returns a resolver that rejects.
  const base = defaults?.base;
  const defaultWeight = defaults?.weight;
  return async (name, options) => {
    assertIconName(name);
    const weight = (options?.weight as PhosphorWeight) ?? defaultWeight ?? 'regular';
    if (!WEIGHTS.has(weight)) throw new Error(`[line-icons] Unknown Phosphor weight "${weight}".`);
    // Only regular files use the bare name; the other weights add a weight suffix.
    const file = weight === 'regular' ? name : `${name}-${weight}`;
    return fetchIcon(`${weight}/${file}.svg`, base);
  };
}
