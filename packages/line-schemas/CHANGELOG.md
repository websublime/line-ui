# @websublime/line-schemas

## 0.1.1

### Patch Changes

- [#236](https://github.com/websublime/line-ui/pull/236) [`e1f1f39`](https://github.com/websublime/line-ui/commit/e1f1f39d67b892e154c61f3d241e2e6cf2eb095d) Thanks [@miguelramos](https://github.com/miguelramos)! - The Radix `gray` hue is renamed `neutral`: tokens `--line-neutral-*`, export `@websublime/line-colors/neutral`, `@websublime/line-themes` subpaths `accent/neutral` and `gray/neutral`, attribute value `data-accent="neutral"` / `data-gray="neutral"`, and `neutral` in `HUES` and `GRAY_HUES`. The old hue names collided with the gray role. The gray role (`--line-gray-*`, its aliases, `data-gray`) is unchanged.

## 0.1.0

### Minor Changes

- [#184](https://github.com/websublime/line-ui/pull/184) [`94d2229`](https://github.com/websublime/line-ui/commit/94d222938034f7a53fe370fa095f17476d99a632) Thanks [@miguelramos](https://github.com/miguelramos)! - Author the design-system TS contracts and Zod schemas: `HUES` (31 hues), `ACCENT_HUES`, `GRAY_HUES`, `SEMANTIC_MAP`, `PER_HUE_CONTRAST`/`BLACK_CONTRAST_HUES`, `STEPS`, `ROLES`, and `ALIASES`, each paired with a Zod schema. Adds a `./contrast-table` subpath export alongside the `.` barrel.

### Patch Changes

- [#216](https://github.com/websublime/line-ui/pull/216) [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920) Thanks [@miguelramos](https://github.com/miguelramos)! - Packages now declare the MIT license (`"license": "MIT"`) and ship its text as a `LICENSE` file in each tarball.

- [#215](https://github.com/websublime/line-ui/pull/215) [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5) Thanks [@miguelramos](https://github.com/miguelramos)! - Published tarballs now ship the built `dist/` output and real version ranges for internal `@websublime/line-*` dependencies instead of `workspace:` ranges.

- [#217](https://github.com/websublime/line-ui/pull/217) [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f) Thanks [@miguelramos](https://github.com/miguelramos)! - Package manifests now declare their source repository (`github.com/websublime/line-ui` and the package directory), which npm provenance verification needs.

- [#189](https://github.com/websublime/line-ui/pull/189) [`acafa6d`](https://github.com/websublime/line-ui/commit/acafa6d95733bfde5d2f12180d1f81806c4e6f54) Thanks [@miguelramos](https://github.com/miguelramos)! - Stream C review cleanups (line-ui-7qm.3.10, line-ui-7qm.3.11):

  - **line-schemas — `StepSchema` derived from `STEPS`**: `StepSchema` is now built from the canonical `STEPS` tuple (a mapped tuple of `z.literal`s) instead of a hand-maintained 12-arm `z.union`, restoring the single-source-of-truth const+schema+type pattern used by every other contract module. The exported `Step` type and runtime validation behaviour are unchanged — it accepts exactly `1..12` and rejects everything else.
  - **`scripts/verify-palettes-fresh.mjs` — multi-file drift reporting**: on failure the guard now reports a per-file differing-line count and an up-front tally (`N drifting files (M differing lines)`, plus any file-set violations), so a multi-hue `@radix-ui/colors` bump surfaces every affected file in a single CI run rather than one line at a time across successive runs. Pass/fail semantics are unchanged — any drift still exits non-zero.
