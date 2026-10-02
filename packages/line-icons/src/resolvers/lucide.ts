// Lucide ships one SVG file per icon.
import type { IconResolver } from '../index.js';
import { assertIconName } from './icon-name.js';

export function createLucideResolver(): IconResolver {
  return async (name) => {
    assertIconName(name);
    const mod = await import(/* @vite-ignore */ `lucide-static/icons/${name}.svg?raw`);
    return mod.default as string;
  };
}
