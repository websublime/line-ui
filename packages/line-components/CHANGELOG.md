# @websublime/line-components

## 0.2.0

### Minor Changes

- [#298](https://github.com/websublime/line-ui/pull/298) [`e95fa93`](https://github.com/websublime/line-ui/commit/e95fa93e87fee31449906e28edb21f6a6d9fe8b3) Thanks [@miguelramos](https://github.com/miguelramos)! - Ship the Custom Elements Manifest: the package now includes `custom-elements.json`, declared by the `customElements` field and the `./custom-elements.json` export.

## 0.1.4

### Patch Changes

- [#296](https://github.com/websublime/line-ui/pull/296) [`97c1d28`](https://github.com/websublime/line-ui/commit/97c1d283ef3533f0a1836c2978b9b283bda47ec5) Thanks [@miguelramos](https://github.com/miguelramos)! - Requires `@zag-js/core` ^1.47.0.

- Updated dependencies [[`97c1d28`](https://github.com/websublime/line-ui/commit/97c1d283ef3533f0a1836c2978b9b283bda47ec5)]:
  - @websublime/line-core@0.2.1

## 0.1.3

### Patch Changes

- Updated dependencies [[`a394d44`](https://github.com/websublime/line-ui/commit/a394d44c8ab7979c87d3beda19db37f2e3d5c8e2), [`67ff29c`](https://github.com/websublime/line-ui/commit/67ff29cce09e1ff9622f83adb97fab8e02e94d3c)]:
  - @websublime/line-core@0.2.0

## 0.1.2

### Patch Changes

- [#285](https://github.com/websublime/line-ui/pull/285) [`97f32c0`](https://github.com/websublime/line-ui/commit/97f32c056af2a072278790508a8a9568e45d8591) Thanks [@miguelramos](https://github.com/miguelramos)! - The library builds keep every declared dependency external, and `@websublime/line-components` now declares `lit` and `@zag-js/core` and no longer sets `sideEffects`.

- Updated dependencies [[`97f32c0`](https://github.com/websublime/line-ui/commit/97f32c056af2a072278790508a8a9568e45d8591)]:
  - @websublime/line-core@0.1.3

## 0.1.1

### Patch Changes

- [#283](https://github.com/websublime/line-ui/pull/283) [`3a04024`](https://github.com/websublime/line-ui/commit/3a04024cbb2eeab2f3b7b832c41e5d66b5749d31) Thanks [@miguelramos](https://github.com/miguelramos)! - Type declarations are now emitted by TypeScript 7 `tsc --emitDeclarationOnly` instead of `vite-plugin-dts`; no API change.

- Updated dependencies [[`3a04024`](https://github.com/websublime/line-ui/commit/3a04024cbb2eeab2f3b7b832c41e5d66b5749d31)]:
  - @websublime/line-core@0.1.2

## 0.1.0

### Minor Changes

- [#219](https://github.com/websublime/line-ui/pull/219) [`1b3a3c2`](https://github.com/websublime/line-ui/commit/1b3a3c23ab5af04c04e30f2b939a39f7f98c11b0) Thanks [@miguelramos](https://github.com/miguelramos)! - Ship the `line-components` umbrella package's Phase 00 release at `0.1.0`; it contains no components yet and stays empty until later phases add them.

### Patch Changes

- [#216](https://github.com/websublime/line-ui/pull/216) [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920) Thanks [@miguelramos](https://github.com/miguelramos)! - Packages now declare the MIT license (`"license": "MIT"`) and ship its text as a `LICENSE` file in each tarball.

- [#215](https://github.com/websublime/line-ui/pull/215) [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5) Thanks [@miguelramos](https://github.com/miguelramos)! - Published tarballs now ship the built `dist/` output and real version ranges for internal `@websublime/line-*` dependencies instead of `workspace:` ranges.

- [#217](https://github.com/websublime/line-ui/pull/217) [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f) Thanks [@miguelramos](https://github.com/miguelramos)! - Package manifests now declare their source repository (`github.com/websublime/line-ui` and the package directory), which npm provenance verification needs.

- Updated dependencies [[`7a56fc6`](https://github.com/websublime/line-ui/commit/7a56fc67b64b2ce5aea9c72cd3af3702466e0793), [`520fe15`](https://github.com/websublime/line-ui/commit/520fe1513a63cf41d89632f4fb45d2eef4949fc8), [`c18589a`](https://github.com/websublime/line-ui/commit/c18589aebf5fa8b1a84e012922eead8cf6ec9f2b), [`2bf244b`](https://github.com/websublime/line-ui/commit/2bf244b66476cacf6fc90b80d5eea3d8b435a5a5), [`3734a26`](https://github.com/websublime/line-ui/commit/3734a2626fa30159e0b2b6c9650974ef41908f53), [`01dee79`](https://github.com/websublime/line-ui/commit/01dee7916d3a0e36907e2c99e6b133adf7e046e7), [`9211e93`](https://github.com/websublime/line-ui/commit/9211e938b54436ee1ee1c1e36c4a25b578cf6bce), [`90069a8`](https://github.com/websublime/line-ui/commit/90069a820619c6d8bc483f38889d34a3d23821a8), [`b9f8040`](https://github.com/websublime/line-ui/commit/b9f8040482f0619582475b3a600ca312f297e408), [`96ff7be`](https://github.com/websublime/line-ui/commit/96ff7be098c55c9bc2655f79f9ea660d43b6940c), [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920), [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5), [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f)]:
  - @websublime/line-core@0.1.0
  - @websublime/line-themes@0.1.0
  - @websublime/line-tokens@0.1.0
  - @websublime/line-utils@0.1.0
