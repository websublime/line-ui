# @websublime/line-icons

Icon resolver registry for the line://ui design system. The package bundles no icons; it dispatches icon lookups to resolvers you register.

## Install

Both icon libraries are optional peer dependencies. Install the package plus the library whose reference resolver you use:

```sh
bun add @websublime/line-icons lucide-static          # Lucide
bun add @websublime/line-icons @phosphor-icons/core   # Phosphor
```

## Entry points

| Import | Exports |
|---|---|
| `@websublime/line-icons/registry` | `IconRegistry` (`register(library, resolver)`, `has(library)`, `resolve(library, name, options?)`), the shared `iconRegistry` instance, and the `IconResolver` and `IconResolverOptions` contract types |
| `@websublime/line-icons/resolvers/lucide` | `createLucideResolver({ base })` and the `LucideResolverOptions` type |
| `@websublime/line-icons/resolvers/phosphor` | `createPhosphorResolver({ base, weight? })` and the `PhosphorResolverOptions` and `PhosphorWeight` types; `weight` is `thin`, `light`, `regular` (default), `bold`, `fill` or `duotone` |
| `@websublime/line-icons` | Everything above, plus the `IconBase` type |

## Reference resolvers

`createLucideResolver({ base })` and `createPhosphorResolver({ base, weight? })` fetch one SVG file per icon from `base` and resolve to its text. `base` is required and names the folder that serves the icon files, with a trailing slash. A path-only base such as `/icons/lucide/` resolves against `document.baseURI`. The resolvers send each request to the origin of `base`, and to no other host unless that server redirects, because `fetch` follows redirects.

| Resolver | File fetched, relative to `base` | Folder in the peer package |
|---|---|---|
| Lucide | `<name>.svg` | `lucide-static/icons/` |
| Phosphor | `<weight>/<name>.svg` for `regular`, `<weight>/<name>-<weight>.svg` for the other weights | `@phosphor-icons/core/assets/` |

`options.weight` passed to `resolve()` wins over the factory `weight`.

The resolvers accept only lowercase kebab-case icon names (and, for Phosphor, the six weights above) and reject anything else with a `[line-icons]` error before any request. They also reject with a `[line-icons]` error when `base` is missing or invalid, when the response is not ok (an unknown name answers 404), and when the request fails on the network, on CORS or on the page's CSP.

### Base on jsDelivr

Pin the URL to the peer version you installed (`npm ls lucide-static @phosphor-icons/core`), so the files match the names your code uses:

```ts
createLucideResolver({ base: 'https://cdn.jsdelivr.net/npm/lucide-static@1.56.0/icons/' });
createPhosphorResolver({ base: 'https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/' });
```

A missing icon on jsDelivr rejects with a readable 404, because jsDelivr's 404 keeps `access-control-allow-origin: *`. unpkg also works (`https://unpkg.com/lucide-static@1.56.0/icons/`), but its 404 carries no CORS header. The browser hides that 404 behind a network `TypeError`, so a missing icon on unpkg rejects with a `[line-icons]` "Could not fetch" error whose `cause` is that `TypeError`.

### Self-hosted base

Serve the peer's icon folder from your own origin, for example by copying it into the folder your server or bundler publishes as static files:

```sh
cp -R node_modules/lucide-static/icons public/icons/lucide
cp -R node_modules/@phosphor-icons/core/assets public/icons/phosphor
```

```ts
createLucideResolver({ base: '/icons/lucide/' });
createPhosphorResolver({ base: '/icons/phosphor/' });
```

### Content Security Policy

The resolvers use `fetch`, so a page with a CSP must list the icon origin in `connect-src`. `connect-src 'self'` covers a self-hosted base and blocks a CDN one; for jsDelivr use, for example, `connect-src 'self' https://cdn.jsdelivr.net`. A blocked request rejects like a network failure.

## Usage

```ts
import { iconRegistry } from '@websublime/line-icons/registry';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';
import { createPhosphorResolver } from '@websublime/line-icons/resolvers/phosphor';

iconRegistry.register('lucide', createLucideResolver({ base: '/icons/lucide/' }));
iconRegistry.register('phosphor', createPhosphorResolver({ base: '/icons/phosphor/', weight: 'regular' }));

const house = await iconRegistry.resolve('lucide', 'house');
const boldHouse = await iconRegistry.resolve('phosphor', 'house', { weight: 'bold' });
```

The resolved value is untrusted SVG text from the server behind `base`. Do not put it into `innerHTML` unsanitised; `<line-icon>` sanitises it before it renders.

## Icons inside your bundle

To ship icons in your own bundle instead of fetching them, register a custom `IconResolver` with one literal `import()` per name of `lucide-static`'s ES modules. Vite, esbuild and webpack build it with no configuration, and each icon becomes its own chunk. Only the listed names resolve. This works for Lucide only, because `@phosphor-icons/core` ships no JS form of its icons.

```ts
import { type IconResolver, iconRegistry } from '@websublime/line-icons/registry';

const lucideIcons: Record<string, () => Promise<{ default: string }>> = {
  house: () => import('lucide-static/dist/esm/icons/house.mjs'),
  rocket: () => import('lucide-static/dist/esm/icons/rocket.mjs'),
};

const lucideInBundle: IconResolver = async (name) => {
  const load = Object.hasOwn(lucideIcons, name) ? lucideIcons[name] : undefined;
  if (!load) throw new Error(`Unknown icon "${name}".`);
  return (await load()).default;
};

iconRegistry.register('lucide', lucideInBundle);
```

`lucide-static` ships no types for these files; in TypeScript, declare them once:

```ts
declare module 'lucide-static/dist/esm/icons/*.mjs' {
  const svg: string;
  export default svg;
}
```
