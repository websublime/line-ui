// Loads the built `./icon` subpath and the root `setIconRegistry` by package name, as a consumer does (spec §7.8
// rule 2), with the `line-icons` registry and reference resolvers from the devDependency. The browser tier
// imports this module in the page to build registries, to reach the `INTERNALS` copy the component uses, and to
// reach a second copy of the registry module and of the injection module, loaded from `src/` (spec 0014-icon.md
// Tests). The test routes `/icons/lucide/` and `/icons/phosphor/` to the installed `lucide-static` `icons/` and
// `@phosphor-icons/core` `assets/` folders, a self-hosted base.
import '@websublime/line-components/icon';
import { type LineIconRegistry, setIconRegistry } from '@websublime/line-components';
import { IconRegistry } from '@websublime/line-icons';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';
import { createPhosphorResolver } from '@websublime/line-icons/resolvers/phosphor';

// biome-ignore lint/performance/noBarrelFile: the browser tier imports this page module to reach the INTERNALS copy the component uses (spec 0014-icon.md A11y).
export { LineIcon } from '@websublime/line-components/icon';
export { INTERNALS } from '@websublime/line-core';
export * as secondInjection from '../../../src/icon/svg-injection.ts';
export * as secondRegistry from '../../../src/shared/icon-registry.ts';
export { createLucideResolver, IconRegistry, setIconRegistry };

/** The `line-icons` registry with Lucide and Phosphor on the self-hosted, path-only bases. */
export function referenceRegistry(): IconRegistry {
  const registry = new IconRegistry();
  registry.register('lucide', createLucideResolver({ base: '/icons/lucide/' }));
  registry.register('phosphor', createPhosphorResolver({ base: '/icons/phosphor/' }));
  return registry;
}

/** A registry that answers each name with its markup and rejects any other name. */
export function markupRegistry(markupByName: Record<string, string>): LineIconRegistry {
  return {
    resolve: async (_library, name) => {
      const markup = markupByName[name];
      if (markup === undefined) {
        throw new Error(`no markup for ${name}`);
      }
      return markup;
    },
  };
}
