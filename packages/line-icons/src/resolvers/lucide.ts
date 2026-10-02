// Lucide: one SVG per icon, ESM tree-shakeable
import type { IconResolver } from '../index.js';

export function createLucideResolver(): IconResolver {
  return async (name) => {
    const mod = await import(/* @vite-ignore */ `lucide-static/icons/${name}.svg?raw`);
    return mod.default as string;
  };
}
