# @websublime/line-tokens

## 0.2.1

### Patch Changes

- [#384](https://github.com/websublime/line-ui/pull/384) [`1525465`](https://github.com/websublime/line-ui/commit/15254656ebbeae2e99f69c340fd1ad8a3f73f73d) Thanks [@miguelramos](https://github.com/miguelramos)! - `--line-focus-ring-color` is `var(--line-accent-11)` in light and dark mode (was `var(--line-accent-8)`), so the focus ring meets WCAG 2.1 SC 1.4.11, 3:1, against every gray, accent and semantic surface it sits on, in all 31 accents and 6 grays. Step 8 was below 3:1 on `--line-gray-1` in 196 of the 372 accent × gray × mode combinations. A build and CI check now fails on any ring colour below 3:1.

## 0.2.0

### Minor Changes

- [#362](https://github.com/websublime/line-ui/pull/362) [`d4e13c9`](https://github.com/websublime/line-ui/commit/d4e13c922733ea6cbe7065e9b3b2e39c9fe6ee1d) Thanks [@miguelramos](https://github.com/miguelramos)! - Ship `line-tokens`' Phase 1 release at `0.2.0`, the line that carries the gray-role shadow scale with `--line-shadow-strength-dark`, the `@layer line` cascade layer and the whitespace-preserving token CSS from 0.1.1–0.1.3; the tokens are unchanged in this release.

## 0.1.3

### Patch Changes

- [#253](https://github.com/websublime/line-ui/pull/253) [`7be2da8`](https://github.com/websublime/line-ui/commit/7be2da84672d5a53f7dfe1d064519c523269bce8) Thanks [@miguelramos](https://github.com/miguelramos)! - The built CSS keeps the authored whitespace inside `--line-*` values (cssnano 8.0.10), so `getPropertyValue()` returns strings such as `4 / 3` instead of `4/3`; computed styles are unchanged.

## 0.1.2

### Patch Changes

- [#246](https://github.com/websublime/line-ui/pull/246) [`54b0a37`](https://github.com/websublime/line-ui/commit/54b0a373aac238350c054d02708db04bd80ba85d) Thanks [@miguelramos](https://github.com/miguelramos)! - Every token and every `reset.css` rule now sits in the cascade layer `line`, so your rules outside `@layer` win at any specificity, and a layered stylesheet wins by starting with `@layer line;`.

## 0.1.1

### Patch Changes

- [#240](https://github.com/websublime/line-ui/pull/240) [`c2db92b`](https://github.com/websublime/line-ui/commit/c2db92be6b82ab04fbe3478b082ce81bc0aca0e9) Thanks [@miguelramos](https://github.com/miguelramos)! - The shadow scale draws in the nearest gray role's colour, or `--line-neutral-*` without `line-themes`, at the Open Props per-layer opacity. Dark mode follows `color-scheme` through `light-dark()`, and the new `--line-shadow-strength-dark` (25%) sets its strength. `--line-shadow-color` is optional and takes an opaque colour. The shadow tokens are declared in every theming scope, so a rule that overrides one everywhere targets `html, [data-accent], [data-gray]`.

## 0.1.0

### Minor Changes

- [#185](https://github.com/websublime/line-ui/pull/185) [`90069a8`](https://github.com/websublime/line-ui/commit/90069a820619c6d8bc483f38889d34a3d23821a8) Thanks [@miguelramos](https://github.com/miguelramos)! - Author the 18 token-family CSS files plus the light-DOM consumer reset and compose the `index.css` barrel. Primitives: `typography`, `sizing`, `shadows`, `easings`, `z-index`, `opacity`, `motion`, `radii`, `border-width`, `focus-ring`, `breakpoints`. Decoratives: `aspects`, `animations`, `gradients`, `masks`, `layouts`, `highlights`, `svg`. All custom properties are `--line-*` prefixed and singular; every declaration is wrapped in `:where(html)` for zero specificity. Decorative `gradients`/`highlights`/`svg` are structural-only — colour references defer to `var(--line-{hue}-{step})` tokens supplied by `line-colors`. The PostCSS build emits a flat `dist/index.css` barrel plus one `dist/*.css` per subpath.

### Patch Changes

- [#216](https://github.com/websublime/line-ui/pull/216) [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920) Thanks [@miguelramos](https://github.com/miguelramos)! - Packages now declare the MIT license (`"license": "MIT"`) and ship its text as a `LICENSE` file in each tarball.

- [#215](https://github.com/websublime/line-ui/pull/215) [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5) Thanks [@miguelramos](https://github.com/miguelramos)! - Published tarballs now ship the built `dist/` output and real version ranges for internal `@websublime/line-*` dependencies instead of `workspace:` ranges.

- [#217](https://github.com/websublime/line-ui/pull/217) [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f) Thanks [@miguelramos](https://github.com/miguelramos)! - Package manifests now declare their source repository (`github.com/websublime/line-ui` and the package directory), which npm provenance verification needs.
