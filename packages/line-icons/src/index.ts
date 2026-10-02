export type IconResolver = (name: string, options?: IconResolverOptions) => Promise<string | SVGElement>;

export interface IconResolverOptions {
  /** Library-specific options, e.g. Phosphor weight. Untyped at the registry level. */
  [key: string]: unknown;
}

export class IconRegistry {
  #resolvers = new Map<string, IconResolver>();

  register(library: string, resolver: IconResolver): void {
    this.#resolvers.set(library, resolver);
  }

  has(library: string): boolean {
    return this.#resolvers.has(library);
  }

  async resolve(library: string, name: string, options?: IconResolverOptions): Promise<string | SVGElement> {
    const resolver = this.#resolvers.get(library);
    if (!resolver) throw new Error(`[line-icons] No resolver registered for library "${library}".`);
    return resolver(name, options);
  }
}

// Shared singleton convenience
export const iconRegistry = new IconRegistry();

// Reference resolver factories validate the contract against two real libraries
export { createLucideResolver } from './resolvers/lucide.js';
export { createPhosphorResolver } from './resolvers/phosphor.js';
