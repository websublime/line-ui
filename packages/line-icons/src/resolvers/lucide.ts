// Lucide ships one SVG file per icon, `icons/<name>.svg` in `lucide-static`.
import type { IconResolver } from '../registry.js';
import { fetchIcon, type IconBase } from './fetch-icon.js';
import { assertIconName } from './icon-name.js';

export interface LucideResolverOptions {
  /** The `lucide-static` `icons/` folder, with a trailing slash; a path-only base resolves against `document.baseURI`. */
  base: IconBase;
}

export function createLucideResolver(options: LucideResolverOptions): IconResolver {
  // Read without destructuring, so a call without options returns a resolver that rejects.
  const base = options?.base;
  return async (name) => {
    assertIconName(name);
    return fetchIcon(`${name}.svg`, base);
  };
}
