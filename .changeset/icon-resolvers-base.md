---
"@websublime/line-icons": minor
---

Breaking: `createLucideResolver({ base })` and `createPhosphorResolver({ base, weight? })` now fetch each SVG from a required `base` URL (a version-pinned jsDelivr folder or your self-hosted copy of the peer's `icons/` or `assets/` folder) and render in Vite, esbuild and webpack builds with no bundler configuration, and the new `./registry`, `./resolvers/lucide` and `./resolvers/phosphor` subpaths expose them; a resolver created without `base` rejects.
