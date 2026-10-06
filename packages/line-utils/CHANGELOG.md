# @websublime/line-utils

## 0.1.0

### Minor Changes

- [#191](https://github.com/websublime/line-ui/pull/191) [`b9f8040`](https://github.com/websublime/line-ui/commit/b9f8040482f0619582475b3a600ca312f297e408) Thanks [@miguelramos](https://github.com/miguelramos)! - Author `@websublime/line-utils` helpers (spec §6.C.5): `contrast.ts` and `mix.ts`, re-exported from the package barrel and via the `./contrast` / `./mix` subpath exports.

  - **`contrast.ts` — WCAG 2.1 contrast helpers**: `hexToRgb`, `srgbToLinear`, `relativeLuminance`, `contrastRatio`, plus the `THRESHOLD` (3) and `SOLID_STEP` (9) constants. These are the single source of truth for the WCAG math previously inlined in `scripts/validate-contrast.mjs`; that validator now imports them from this module (via its `.ts` source path, matching the existing `line-schemas` source imports, to avoid a build-order hazard since the validator runs inside `line-colors`' build). The math is ported verbatim — the validator's output stays byte-identical (exit 0, the two documented orange allowlist warnings, and the "62 step-9/contrast pairs … meet ≥ 3:1" line).
  - **`mix.ts` — CSS `color-mix()` string builders**: `mix(a, b, weight?, options?)`, `withAlpha(color, alphaPercent, options?)`, `tint(color, amount, options?)`, and `shade(color, amount, options?)`. All are pure string builders (no parsing or evaluation) that accept an optional `{ colorSpace }` (default `srgb`) drawn from the CSS `<color-interpolation-method>` spaces. `withAlpha('var(--c)', 40)` yields `color-mix(in srgb, transparent 60%, var(--c))` (40% opaque); `tint`/`shade` mix toward `white`/`black`.

### Patch Changes

- [#192](https://github.com/websublime/line-ui/pull/192) [`96ff7be`](https://github.com/websublime/line-ui/commit/96ff7be098c55c9bc2655f79f9ea660d43b6940c) Thanks [@miguelramos](https://github.com/miguelramos)! - Harden the `mix.ts` `color-mix()` string builders against out-of-range percentages (line-ui-7qm.3.13, review-warning follow-up to C7).

  - **`mix`, `withAlpha`, `tint`, `shade` now clamp their percentage argument to `[0, 100]`**: the `mix` weight, `withAlpha` `alphaPercent`, and `tint`/`shade` `amount` are passed through `Math.min(100, Math.max(0, x))` before being emitted, so an out-of-range caller (e.g. `withAlpha('var(--c)', 150)`) now produces valid in-range CSS (`color-mix(in srgb, transparent 0%, var(--c))`) instead of invalid text the browser would silently reject. Clamping a numeric percentage is input validation, not color evaluation, so the helpers remain pure string builders. `mix`'s `weight` stays optional — `undefined` is preserved (no percentage emitted) and is not clamped. In-range inputs are unaffected. Each helper's JSDoc `@param` now documents the `[0, 100]` clamp.
  - **`NaN` percentages coerce to `0`**: the shared `clampPercent` helper now maps a passed `NaN` to `0` (the lower clamp bound), so a non-finite caller can never emit invalid `NaN%` CSS. All four helpers inherit this through `clampPercent`. `mix`'s `weight === undefined` branch is unchanged — only a passed `NaN` becomes `0`; `undefined` still omits the percentage entirely.

- [#216](https://github.com/websublime/line-ui/pull/216) [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920) Thanks [@miguelramos](https://github.com/miguelramos)! - Packages now declare the MIT license (`"license": "MIT"`) and ship its text as a `LICENSE` file in each tarball.

- [#215](https://github.com/websublime/line-ui/pull/215) [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5) Thanks [@miguelramos](https://github.com/miguelramos)! - Published tarballs now ship the built `dist/` output and real version ranges for internal `@websublime/line-*` dependencies instead of `workspace:` ranges.

- [#217](https://github.com/websublime/line-ui/pull/217) [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f) Thanks [@miguelramos](https://github.com/miguelramos)! - Package manifests now declare their source repository (`github.com/websublime/line-ui` and the package directory), which npm provenance verification needs.

- Updated dependencies [[`94d2229`](https://github.com/websublime/line-ui/commit/94d222938034f7a53fe370fa095f17476d99a632), [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920), [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5), [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f), [`acafa6d`](https://github.com/websublime/line-ui/commit/acafa6d95733bfde5d2f12180d1f81806c4e6f54)]:
  - @websublime/line-schemas@0.1.0
