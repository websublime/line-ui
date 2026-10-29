// The consumer entry that Vite, esbuild and webpack bundle from the packed tarball, with a self-hosted base.
import { IconRegistry } from '@websublime/line-icons/registry';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';
import { createPhosphorResolver } from '@websublime/line-icons/resolvers/phosphor';
import { renderCases } from './harness.js';

const registry = new IconRegistry();
// Path-only bases: the resolvers resolve them against document.baseURI.
registry.register('lucide', createLucideResolver({ base: '/vendor/lucide-static/icons/' }));
registry.register('phosphor', createPhosphorResolver({ base: '/vendor/phosphor-icons-core/assets/' }));

renderCases(registry);
