# @websublime/line-themes

## 0.1.1

### Patch Changes

- [#233](https://github.com/websublime/line-ui/pull/233) [`2e92f87`](https://github.com/websublime/line-ui/commit/2e92f87fb89be6185634e4af2a7e189ba2341810) Thanks [@miguelramos](https://github.com/miguelramos)! - Named role aliases (`--line-{role}-surface` … `--line-{role}-text`) now follow nested `data-accent` / `data-gray` scopes instead of keeping the root's values.

- [#236](https://github.com/websublime/line-ui/pull/236) [`e1f1f39`](https://github.com/websublime/line-ui/commit/e1f1f39d67b892e154c61f3d241e2e6cf2eb095d) Thanks [@miguelramos](https://github.com/miguelramos)! - The Radix `gray` hue is renamed `neutral`: tokens `--line-neutral-*`, export `@websublime/line-colors/neutral`, `@websublime/line-themes` subpaths `accent/neutral` and `gray/neutral`, attribute value `data-accent="neutral"` / `data-gray="neutral"`, and `neutral` in `HUES` and `GRAY_HUES`. The old hue names collided with the gray role. The gray role (`--line-gray-*`, its aliases, `data-gray`) is unchanged.

- Updated dependencies [[`e1f1f39`](https://github.com/websublime/line-ui/commit/e1f1f39d67b892e154c61f3d241e2e6cf2eb095d), [`e1f1f39`](https://github.com/websublime/line-ui/commit/e1f1f39d67b892e154c61f3d241e2e6cf2eb095d)]:
  - @websublime/line-colors@0.1.1
  - @websublime/line-schemas@0.1.1

## 0.1.0

### Minor Changes

- [#190](https://github.com/websublime/line-ui/pull/190) [`9211e93`](https://github.com/websublime/line-ui/commit/9211e938b54436ee1ee1c1e36c4a25b578cf6bce) Thanks [@miguelramos](https://github.com/miguelramos)! - Populate `line-themes` `src/` with the role-mapping, semantic, alias, and default layers (spec §6.C.4). Add `scripts/generate-role-maps.mjs` (imports only `HUES`/`GRAY_HUES` from `line-schemas`, formats its output with `biome format --write` for byte-stable regeneration), which emits 31 `accent/{hue}.css` and 6 `gray/{gray}.css` files, each scoped to `:where([data-accent="…"])` / `:where([data-gray="…"])` and remapping `--line-{role}-1..12`, `-a1..a12`, and `-contrast` onto the hue's own `--line-{hue}-*` palette tokens. Hand-author `semantics.css` (success→green, warning→amber, danger→red, info→blue), `aliases.css` (exactly 54 alias variables — 9 named slots × 6 roles; `-contrast` stays in the numeric API, not an alias), `defaults.css` (indigo default accent + 31 auto-pair `:not([data-gray])` blocks per `AUTO_PAIR_TABLE` + slate default gray), and the `index.css` barrel in spec order (semantics → defaults → 31 accent → 6 gray → aliases). The role-mapping CSS uses `[data-accent]` and `[data-gray]` attribute selectors only — no aggregator selector anywhere (PRD §9.14 T4).

### Patch Changes

- [#216](https://github.com/websublime/line-ui/pull/216) [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920) Thanks [@miguelramos](https://github.com/miguelramos)! - Packages now declare the MIT license (`"license": "MIT"`) and ship its text as a `LICENSE` file in each tarball.

- [#215](https://github.com/websublime/line-ui/pull/215) [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5) Thanks [@miguelramos](https://github.com/miguelramos)! - Published tarballs now ship the built `dist/` output and real version ranges for internal `@websublime/line-*` dependencies instead of `workspace:` ranges.

- [#217](https://github.com/websublime/line-ui/pull/217) [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f) Thanks [@miguelramos](https://github.com/miguelramos)! - Package manifests now declare their source repository (`github.com/websublime/line-ui` and the package directory), which npm provenance verification needs.

- Updated dependencies [[`85c7caa`](https://github.com/websublime/line-ui/commit/85c7caa1acf4f80c2311504c76668dda19fa35a3), [`7e9ae30`](https://github.com/websublime/line-ui/commit/7e9ae30984a4a913f2dee54c43bc8187316c9e51), [`3ae292f`](https://github.com/websublime/line-ui/commit/3ae292faa714ab9a75bc6eb06ea7a980549a7344), [`94d2229`](https://github.com/websublime/line-ui/commit/94d222938034f7a53fe370fa095f17476d99a632), [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920), [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5), [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f), [`acafa6d`](https://github.com/websublime/line-ui/commit/acafa6d95733bfde5d2f12180d1f81806c4e6f54)]:
  - @websublime/line-colors@0.1.0
  - @websublime/line-schemas@0.1.0
