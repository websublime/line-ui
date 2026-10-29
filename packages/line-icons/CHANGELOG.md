# @websublime/line-icons

## 0.2.0

### Minor Changes

- [#310](https://github.com/websublime/line-ui/pull/310) [`828b5b8`](https://github.com/websublime/line-ui/commit/828b5b873f67770e70421cd04ed434f32364e851) Thanks [@miguelramos](https://github.com/miguelramos)! - Breaking: `createLucideResolver({ base })` and `createPhosphorResolver({ base, weight? })` now fetch each SVG from a required `base` URL (a version-pinned jsDelivr folder or your self-hosted copy of the peer's `icons/` or `assets/` folder) and render in Vite, esbuild and webpack builds with no bundler configuration, and the new `./registry`, `./resolvers/lucide` and `./resolvers/phosphor` subpaths expose them; a resolver created without `base` rejects.

## 0.1.0

### Minor Changes

- [#213](https://github.com/websublime/line-ui/pull/213) [`c07f104`](https://github.com/websublime/line-ui/commit/c07f104bd6e634529a987268c94bc631cffad238) Thanks [@miguelramos](https://github.com/miguelramos)! - Add the `IconRegistry` resolver contract with reference Lucide and Phosphor resolvers.

### Patch Changes

- [#216](https://github.com/websublime/line-ui/pull/216) [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920) Thanks [@miguelramos](https://github.com/miguelramos)! - Packages now declare the MIT license (`"license": "MIT"`) and ship its text as a `LICENSE` file in each tarball.

- [#215](https://github.com/websublime/line-ui/pull/215) [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5) Thanks [@miguelramos](https://github.com/miguelramos)! - Published tarballs now ship the built `dist/` output and real version ranges for internal `@websublime/line-*` dependencies instead of `workspace:` ranges.

- [#217](https://github.com/websublime/line-ui/pull/217) [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f) Thanks [@miguelramos](https://github.com/miguelramos)! - Package manifests now declare their source repository (`github.com/websublime/line-ui` and the package directory), which npm provenance verification needs.

- Updated dependencies [[`90069a8`](https://github.com/websublime/line-ui/commit/90069a820619c6d8bc483f38889d34a3d23821a8), [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920), [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5), [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f)]:
  - @websublime/line-tokens@0.1.0
