export { IconRegistry, type IconResolver, type IconResolverOptions, iconRegistry } from './registry.js';
export type { IconBase } from './resolvers/fetch-icon.js';
// The reference resolver factories validate the contract against two real libraries.
export { createLucideResolver, type LucideResolverOptions } from './resolvers/lucide.js';
export { createPhosphorResolver, type PhosphorResolverOptions, type PhosphorWeight } from './resolvers/phosphor.js';
