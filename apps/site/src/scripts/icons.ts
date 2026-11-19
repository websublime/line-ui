import { setIconRegistry } from '@websublime/line-components';
import { IconRegistry } from '@websublime/line-icons';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';

// Lucide files are self-hosted under public/icons/lucide/, so the page fetches no icon from a third party.
// Every section that draws an icon imports this module; it runs once per page.

const registry = new IconRegistry();
registry.register('lucide', createLucideResolver({ base: '/icons/lucide/' }));
setIconRegistry(registry);
