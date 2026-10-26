# @websublime/line-core

## 0.2.0

### Minor Changes

- [#293](https://github.com/websublime/line-ui/pull/293) [`a394d44`](https://github.com/websublime/line-ui/commit/a394d44c8ab7979c87d3beda19db37f2e3d5c8e2) Thanks [@miguelramos](https://github.com/miguelramos)! - `LineMachineController` now passes host props to the machine on every host update, so `watch` trackers and guards see each property change; the `props` option must be a function of the host's properties, `props: () => ({ disabled: this.disabled })`.

- [#291](https://github.com/websublime/line-ui/pull/291) [`67ff29c`](https://github.com/websublime/line-ui/commit/67ff29cce09e1ff9622f83adb97fab8e02e94d3c) Thanks [@miguelramos](https://github.com/miguelramos)! - `LineElement` now attaches `ElementInternals` once per element and reflects machine state as both `data-<state>` and `:state(<state>)` (kebab-case names such as `focus-visible` included); subclasses reach the internals through the new `INTERNALS` export, and `FormAssociated` (now also exported from `@websublime/line-core`, with `@websublime/line-core/mixins/form-associated` re-exporting it) reuses them.

## 0.1.3

### Patch Changes

- [#285](https://github.com/websublime/line-ui/pull/285) [`97f32c0`](https://github.com/websublime/line-ui/commit/97f32c056af2a072278790508a8a9568e45d8591) Thanks [@miguelramos](https://github.com/miguelramos)! - The library builds keep every declared dependency external, and `@websublime/line-components` now declares `lit` and `@zag-js/core` and no longer sets `sideEffects`.

## 0.1.2

### Patch Changes

- [#283](https://github.com/websublime/line-ui/pull/283) [`3a04024`](https://github.com/websublime/line-ui/commit/3a04024cbb2eeab2f3b7b832c41e5d66b5749d31) Thanks [@miguelramos](https://github.com/miguelramos)! - Type declarations are now emitted by TypeScript 7 `tsc --emitDeclarationOnly` instead of `vite-plugin-dts`; no API change.

## 0.1.1

### Patch Changes

- [#253](https://github.com/websublime/line-ui/pull/253) [`7be2da8`](https://github.com/websublime/line-ui/commit/7be2da84672d5a53f7dfe1d064519c523269bce8) Thanks [@miguelramos](https://github.com/miguelramos)! - `@zag-js/core` and `@zag-js/vanilla` now require `^1.46.0`, so your install resolves Zag.js 1.46 or later in the 1.x line.

## 0.1.0

### Minor Changes

- [#211](https://github.com/websublime/line-ui/pull/211) [`7a56fc6`](https://github.com/websublime/line-ui/commit/7a56fc67b64b2ce5aea9c72cd3af3702466e0793) Thanks [@miguelramos](https://github.com/miguelramos)! - Implement the `DirectionMixin` (D4) for `LineElement`. Every Line element now exposes a read-only `direction` (`'ltr' | 'rtl'`) resolved from `:dir(rtl)`, so it follows `<html dir>`, nested `dir` regions, an author `dir` on the host, and `dir="auto"`. The element re-renders when a `dir` change in the document flips it. The mixin never writes the host `dir` attribute and leaves the native `HTMLElement.dir` alone; component CSS targets RTL with `:host(:dir(rtl))`.

- [#212](https://github.com/websublime/line-ui/pull/212) [`520fe15`](https://github.com/websublime/line-ui/commit/520fe1513a63cf41d89632f4fb45d2eef4949fc8) Thanks [@miguelramos](https://github.com/miguelramos)! - Add the opt-in `FormAssociated` mixin (`@websublime/line-core/mixins/form-associated`): `class LineInput extends FormAssociated(LineElement) {}` makes a Line element a native form control backed by `ElementInternals` — its value submits with the form (`setFormValue`), it validates (`setValidity`, `checkValidity`, `reportValidity`, `:invalid` / `:valid`), and it receives the form lifecycle callbacks (`formResetCallback`, …). The `./mixins/*` subpaths now ship their JavaScript, not only their type declarations.

- [#197](https://github.com/websublime/line-ui/pull/197) [`c18589a`](https://github.com/websublime/line-ui/commit/c18589aebf5fa8b1a84e012922eead8cf6ec9f2b) Thanks [@miguelramos](https://github.com/miguelramos)! - Add the `LineElement` base class for all line://ui web components. `LineElement` composes the Direction, Metadata, and Inspector mixins over Lit's `LitElement`, establishing the mixin composition pattern (D1). It exposes a static `version` string and a protected `reflectState(name, active)` hook (overridden by the FormAssociated mixin). Per spec §6.D.1 it does NOT auto-inject `commonReset` and does NOT bake in `FormAssociated` — both stay opt-in. Ships identity (pass-through) stubs for the Inspector/Metadata/Direction mixins whose behaviour lands in D2/D3/D4.

- [#205](https://github.com/websublime/line-ui/pull/205) [`2bf244b`](https://github.com/websublime/line-ui/commit/2bf244b66476cacf6fc90b80d5eea3d8b435a5a5) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `LineMachineController` (D6), the Lit `ReactiveController` adapter around Zag.js, at `@websublime/line-core/machine` together with the four public `@zag-js/vanilla` primitives (`VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`) and the `Attrs` type. A machine that fails to start flips the controller into static fallback (`fallback === true`, `console.error`, re-render) instead of throwing at the consumer (Manifesto Law 9); pass `staticFallbackOnFailure: false` to opt out.

- [#199](https://github.com/websublime/line-ui/pull/199) [`3734a26`](https://github.com/websublime/line-ui/commit/3734a2626fa30159e0b2b6c9650974ef41908f53) Thanks [@miguelramos](https://github.com/miguelramos)! - Implement the `MetadataMixin` (D3) for `LineElement`. The mixin replaces its D1 identity stub with the four static metadata members every line://ui component carries (spec §6.D.3): `version` (semver string), `docs` (documentation URL), `qa` (`string[]` of tags), and `scope` (string). Components override them declaratively, e.g. `static version = '0.1.0'`. The mixin owns the DECLARATION only — surfacing the members as host attributes (`data-line-version`, `data-line-docs`, …) remains the Inspector mixin's (D2) responsibility, which reads them defensively off `this.constructor`. The export name, file path, and generic signature stay byte-stable from the stub (`.d.ts`-determinism invariant).

- [#207](https://github.com/websublime/line-ui/pull/207) [`01dee79`](https://github.com/websublime/line-ui/commit/01dee7916d3a0e36907e2c99e6b133adf7e046e7) Thanks [@miguelramos](https://github.com/miguelramos)! - Add the modular shadow-DOM reset sheets (D7) at `@websublime/line-core/styles`: 11 singleton `CSSStyleSheet` exports (`commonReset`, `inputReset`, `buttonReset`, `textareaReset`, `selectReset`, `rangeReset`, `progressReset`, `summaryReset`, `fieldsetReset`, `tableReset`, `scrollbarReset`) built from the `reset.*.css` sources mandated by ARCHITECTURE §14.4, so a component adopts only the resets for the native elements it renders.

### Patch Changes

- [#216](https://github.com/websublime/line-ui/pull/216) [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920) Thanks [@miguelramos](https://github.com/miguelramos)! - Packages now declare the MIT license (`"license": "MIT"`) and ship its text as a `LICENSE` file in each tarball.

- [#215](https://github.com/websublime/line-ui/pull/215) [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5) Thanks [@miguelramos](https://github.com/miguelramos)! - Published tarballs now ship the built `dist/` output and real version ranges for internal `@websublime/line-*` dependencies instead of `workspace:` ranges.

- [#217](https://github.com/websublime/line-ui/pull/217) [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f) Thanks [@miguelramos](https://github.com/miguelramos)! - Package manifests now declare their source repository (`github.com/websublime/line-ui` and the package directory), which npm provenance verification needs.
