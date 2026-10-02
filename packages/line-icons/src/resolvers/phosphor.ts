// Phosphor: one SVG per (weight, icon) file
import type { IconResolver } from '../index.js';

type PhosphorWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

export function createPhosphorResolver(defaults: { weight?: PhosphorWeight } = {}): IconResolver {
  return async (name, options) => {
    const weight = (options?.weight as PhosphorWeight) ?? defaults.weight ?? 'regular';
    // Non-regular files carry a weight suffix (AM-033)
    const file = weight === 'regular' ? name : `${name}-${weight}`;
    const mod = await import(/* @vite-ignore */ `@phosphor-icons/core/assets/${weight}/${file}.svg?raw`);
    return mod.default as string;
  };
}
