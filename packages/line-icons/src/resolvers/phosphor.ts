// Phosphor ships one SVG file per weight and icon.
import type { IconResolver } from '../index.js';
import { assertIconName } from './icon-name.js';

type PhosphorWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

const WEIGHTS = new Set<PhosphorWeight>(['thin', 'light', 'regular', 'bold', 'fill', 'duotone']);

export function createPhosphorResolver(defaults: { weight?: PhosphorWeight } = {}): IconResolver {
  return async (name, options) => {
    assertIconName(name);
    const weight = (options?.weight as PhosphorWeight) ?? defaults.weight ?? 'regular';
    if (!WEIGHTS.has(weight)) throw new Error(`[line-icons] Unknown Phosphor weight "${weight}".`);
    // Only regular files use the bare name; the other weights add a weight suffix.
    const file = weight === 'regular' ? name : `${name}-${weight}`;
    const mod = await import(/* @vite-ignore */ `@phosphor-icons/core/assets/${weight}/${file}.svg?raw`);
    return mod.default as string;
  };
}
