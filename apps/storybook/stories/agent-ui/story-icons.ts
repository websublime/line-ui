import { setIconRegistry } from '@websublime/line-components';
import { IconRegistry } from '@websublime/line-icons';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';
import { createPhosphorResolver } from '@websublime/line-icons/resolvers/phosphor';

// The icon registry the agent UI stories and the transport recipes share. The icon files are self-hosted under
// public/icons/, so no story makes a third-party request.

/** Registers the Lucide and Phosphor sets from `public/icons/` as the registry every `<line-icon>` resolves through. */
export function registerStoryIcons(): void {
  const registry = new IconRegistry();
  registry.register('lucide', createLucideResolver({ base: './icons/lucide/' }));
  registry.register('phosphor', createPhosphorResolver({ base: './icons/phosphor/' }));
  setIconRegistry(registry);
}
