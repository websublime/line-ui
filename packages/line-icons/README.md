# @websublime/line-icons

Icon resolver registry for the line://ui design system. The package bundles no icons; it dispatches icon lookups to resolvers you register.

## Install

Both icon libraries are optional peer dependencies. Install the package plus the library whose reference resolver you use:

```sh
bun add @websublime/line-icons lucide-static          # Lucide
bun add @websublime/line-icons @phosphor-icons/core   # Phosphor
```

## Entry point

`@websublime/line-icons` exports:

- `IconRegistry`: class with `register(library, resolver)`, `has(library)`, `resolve(library, name, options?)`
- `iconRegistry`: shared `IconRegistry` instance
- `IconResolver`, `IconResolverOptions`: resolver contract types
- `createLucideResolver()`: resolves Lucide icons from `lucide-static`
- `createPhosphorResolver({ weight? })`: resolves Phosphor icons from `@phosphor-icons/core`; weight is `thin`, `light`, `regular` (default), `bold`, `fill` or `duotone`

The reference resolvers accept only lowercase kebab-case icon names (and, for Phosphor, the six weights above) and reject anything else with a `[line-icons]` error.

## Usage

```ts
import { createLucideResolver, createPhosphorResolver, iconRegistry } from '@websublime/line-icons';

iconRegistry.register('lucide', createLucideResolver());
iconRegistry.register('phosphor', createPhosphorResolver({ weight: 'regular' }));

const house = await iconRegistry.resolve('lucide', 'house');
const boldHouse = await iconRegistry.resolve('phosphor', 'house', { weight: 'bold' });
```
