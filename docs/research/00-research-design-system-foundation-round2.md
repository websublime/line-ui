# Research (Round 2): Design System Foundation (Phase 00)

**Source PRD:** `/Users/ramosmig/Public/WS-Labs/line-ui/docs/PRD.md` (v0.8.3)
**Source Plan:** `/Users/ramosmig/Public/WS-Labs/line-ui/docs/plans/00-plan-design-system.md` (APPROVED)
**Source Architecture:** `/Users/ramosmig/Public/WS-Labs/line-ui/docs/ARCHITECTURE.md` (aligned with PRD v0.8.3)
**Previous research:** `/Users/ramosmig/Public/WS-Labs/line-ui/docs/research/00-research-design-system-foundation.md`
**Date:** 2026-05-19
**Author:** Smith (feasibility research, round 2)

> **TL;DR — read this first.**
>
> Round 1 surfaced three blocking contradictions (C1 Zag adapter name, C2 Radix Colors source scope, C3 Vite 7 + Rolldown experimental status) and three open questions (Q3 Storybook 8 vs 10, Q5 one vs two icon libraries, Q6 FormAssociated test stratification). The user has applied corrections across PRD v0.8.3, the plan, and ARCHITECTURE. Round 2 re-validates each item against current public sources (npm registry, upstream repos, MDN/caniuse, GitHub issue trackers).
>
> **Headline verdict: ONE NEW CONTRADICTION REMAINS — C4.**
>
> - C1 (Zag adapter rename to `@zag-js/vanilla`) → **RESOLVED**, with one residual factual correction below.
> - C2 (Radix Colors variant scope + special scales + `@supports` upgrade) → **RESOLVED**, every claim verified against the upstream `radix-ui/colors` repository.
> - C3 (Vite 8+ ships Rolldown as default stable) → **RESOLVED**, confirmed by Vite 8.0.13 `package.json` (Rolldown 1.0.1 as a direct hard dependency) and Vite 8 announcement.
> - Q3 (Storybook 10+) → **RESOLVED**, Storybook 10.4.0 latest; `@storybook/web-components-vite@10.4.0` declares `peerDependencies.vite: "^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0"` — Vite 8 supported.
> - Q5 (Lucide + Phosphor as two reference libraries) → **RESOLVED**, both are actively maintained npm packages with stable APIs.
> - Q6 (Two-tier FormAssociated tests: bun:test mocked + Playwright real) → **RESOLVED**, happy-dom #1419 and jsdom #3831 / #3758 confirmed still open as of 2025-03-08.
>
> **NEW CONTRADICTION (C4): `bindable` is NOT publicly exported from `@zag-js/vanilla`.** The plan §2.5, §4.4/D6, §5.1/R3, and PRD/ARCHITECTURE list five primitives the `LineMachineController` wraps: `VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`, `bindable`. Upstream verification (`chakra-ui/zag` `packages/frameworks/vanilla/src/index.ts` on `main`) shows only **four** named exports: `mergeProps`, `normalizeProps`, `spreadProps` (+ `Attrs` type), `VanillaMachine`. The `bindable()` function lives at `packages/frameworks/vanilla/src/bindable.ts` and is consumed **internally** by `VanillaMachine` (`import { bindable } from "./bindable"`). It is **not** re-exported, and there is no `bindable.ts` file in `@zag-js/core` either (the `Bindable` *type* is exported from core, but the `bindable()` factory is private to the vanilla adapter).
>
> This is a small but factually-load-bearing inaccuracy: any spec or implementation that tries to `import { bindable } from "@websublime/line-core/machine"` (which would in turn re-export from `@zag-js/vanilla`) will fail to compile. The fix is to drop `bindable` from the controller's public surface, OR to author our own `bindable`-shaped helper and document it as a `LineMachineController` extension, OR to vendor the source from upstream (license: MIT, ~70 lines).
>
> **Recommendation: return to plan + PRD revision** to remove `bindable` from the four+1 primitive list (or pick one of the alternative paths), then proceed to `/spec`. All other items are clean.

---

## Dependencies Investigated (Round 2)

### R3-revisited — `@zag-js/vanilla` API surface

- **Source 1 (npm):** `https://registry.npmjs.org/@zag-js/vanilla` returns a valid package; latest version **1.40.0** (matches `@zag-js/core` 1.40.0); `exports` map has a single `.` entrypoint; `sideEffects: false`. The package exists and is published.
- **Source 2 (upstream `index.ts` on `main`):**
  ```ts
  export { mergeProps } from "./merge-props"
  export { normalizeProps } from "./normalize-props"
  export { spreadProps, type Attrs } from "./spread-props"
  export { VanillaMachine } from "./machine"
  ```
  **Exactly four named exports.** No `bindable` re-export.
- **Source 3 (`bindable.ts` exists, but as a private helper):** `packages/frameworks/vanilla/src/bindable.ts` defines `export function bindable<T>(props: () => BindableParams<T>): Bindable<T>` and is imported by `machine.ts` via `import { bindable } from "./bindable"`. Because `index.ts` does not re-export from `./bindable`, the function is not part of the public package surface.
- **Source 4 (`@zag-js/core/src/index.ts` on `main`):** Re-exports from `./merge-props`, `./memo`, `./create-machine`, `./state`, `./types`, `./scope`. **No `./bindable`.** The `Bindable` and `BindableParams` *types* are exported (from `./types`) but the function is not.
- **VanillaMachine public API (verified against `packages/frameworks/vanilla/src/machine.ts`):**
  - Methods: `start()`, `stop()`, `send(event)`, `subscribe(fn)` (returns unsubscribe function), `updateProps(newProps)`.
  - Properties: `scope`, `context` (`BindableContext`), `prop` (function), `state` (`Bindable<T["state"]>`), `refs` (`BindableRefs`), `computed` (function), and a `service` getter returning the live `Service<T>`.
  - Lifecycle: `start()` runs `entry` actions, transitions to the initial state, calls `subscribe` callbacks; `stop()` runs `exit` actions, flushes a `cleanups: VoidFunction[]` array, and unsubscribes.
- **Lit 3 `ReactiveController` compatibility:** Confirmed by `lit.dev/docs/composition/controllers` and the Lit 3 API reference. The `ReactiveController` interface exposes `hostConnected()`, `hostDisconnected()`, `hostUpdate()`, `hostUpdated()`. `ReactiveControllerHost` exposes `addController(controller)` and `requestUpdate()`. The proposed `LineMachineController` design (`hostConnected` → `machine.start()` + `subscribe(() => host.requestUpdate())`; `hostDisconnected` → `machine.stop()`) maps cleanly to these primitives.

### R1-revisited — `@radix-ui/colors` 3.0.0 variant matrix

- **Source 1 (npm registry):** `@radix-ui/colors@3.0.0` is the latest published version (`dist-tags.latest = "3.0.0"`). License MIT, `sideEffects: false`, `main: "index.js"`, `module: "index.mjs"`, `types: "types/index.d.ts"`. **No `exports` map** at root (i.e. no per-hue subpath exports — confirms round 1 finding that all imports go through the single root entrypoint).
- **Source 2 (`src/` layout on `main`):** Five files only — `index.ts`, `light.ts`, `dark.ts`, `blackA.ts`, `whiteA.ts`.
- **Source 3 (`index.ts` on `main`):** Re-exports `./dark`, `./light`, `./blackA`, `./whiteA`.
- **Source 4 (`light.ts` on `main`):** Exports **31 hues × 4 variants = 124 const exports**: for each hue `{hue}` (`gray`, `mauve`, `slate`, `sage`, `olive`, `sand`, `tomato`, `red`, `ruby`, `crimson`, `pink`, `plum`, `purple`, `violet`, `iris`, `indigo`, `blue`, `cyan`, `teal`, `jade`, `green`, `grass`, `brown`, `bronze`, `gold`, `sky`, `mint`, `lime`, `yellow`, `amber`, `orange`) the file exports `{hue}`, `{hue}A`, `{hue}P3`, `{hue}P3A`. Each is a 12-step object (sRGB hex for base/alpha, `color(display-p3 ...)` for P3/P3A).
- **Source 5 (`dark.ts` on `main`):** Same 124 exports with the `Dark` suffix (`grayDark`, `grayDarkA`, `grayDarkP3`, `grayDarkP3A`, …, `orangeDark`, `orangeDarkA`, `orangeDarkP3`, `orangeDarkP3A`).
- **Source 6 (`blackA.ts` on `main`):** Exports `blackA` and `blackP3A`.
- **Source 7 (`whiteA.ts` on `main`):** Exports `whiteA` and `whiteP3A`.
- **Conclusion:** Every C2 claim in PRD v0.8.3 is upstream-accurate.
  - 31 hues × 12 steps × 4 variant families per hue (base / A / P3 / P3A) × {light, dark} → **CONFIRMED**.
  - 4 special scales (`blackA`, `whiteA`, `blackP3A`, `whiteP3A`) → **CONFIRMED**.
  - "TS objects only, no upstream CSS" → **CONFIRMED** (no `.css` files in `src/`, no CSS-shaped subpath exports in published `package.json`).
  - `*Contrast` not in `@radix-ui/colors` → **CONFIRMED**, the per-hue contrast table must be authored in `line-colors` (or copied verbatim from `@radix-ui/themes`).

### R2-revisited — Display-P3 + `color-gamut: p3` browser support

- **Source: caniuse.com `css-color-function` (verified 2026-05-19).**
- **Chrome:** Full support from v111 (March 2023). Latest-2 (v149–150) supported.
- **Firefox:** Full support from v113 (May 2023). Latest-2 (v151–152) supported.
- **Safari:** Full support from v15 (September 2021). Latest-2 (26.4–26.5) supported.
- **`@media (color-gamut: p3)`:** Baseline widely-available across the same matrix (Safari was first to ship, then Chrome and Firefox followed).
- **`@supports (color: color(display-p3 1 1 1))`:** Universally supported because `@supports` itself is baseline since 2015; the inner color-function query resolves cleanly on engines that recognize the function.
- **Conclusion:** The C2 token-naming strategy — same `--line-{hue}-{step}` tokens, auto-upgraded to wide-gamut P3 inside `@supports (color: color(display-p3 1 1 1)) and @media (color-gamut: p3)` — is sound across the latest-2 matrix. Older Safari (< 15) and older Chrome/Firefox would silently keep the sRGB declaration, which is the intended graceful degradation.

### R5-revisited — Vite 8 + Rolldown stable

- **Source 1 (npm registry, `vite@latest`):** Latest published version **8.0.13**. The package `engines.node` is `"^20.19.0 || >=22.12.0"`. The `dependencies` block (round-2-critical evidence) lists `"rolldown": "1.0.1"` as a **direct hard dependency** — not an optional dependency, not a peer dependency, not gated behind `package.json` overrides.
- **Source 2 (Vite blog index, vite.dev/blog):** "Announcing Vite 8" post dated 2026-03-12.
- **Source 3 (Vite 8 announcement summary, fetched 2026-05-19):** "Vite 8 ships with Rolldown as its single, unified, Rust-based bundler" — confirmed as the stable default, replacing the previous esbuild-dev + Rollup-build split. Described as "the most significant architectural change since Vite 2."
- **Source 4 (npm registry, `rolldown@latest`):** Latest version **1.0.1** (confirms the 1.0.x line is published and matches what Vite 8.0.13 pins to). Description: "Fast JavaScript/TypeScript bundler in Rust with Rollup-compatible API."
- **Rollback path verification:** The legacy Vite 7 docs (`v7.vite.dev/guide/rolldown`) describe the *opposite* migration (Vite 7 → opt into experimental `rolldown-vite` via overrides). There is **no first-party Vite 8 documentation page describing a `package.json` override that pins to Vite 7 + Rollup.** Plan §5.1/R5 + PRD-side claim that "the one-line `package.json` override to fall back to Vite 7 + Rollup" is "documented upstream" is **partially confirmed**: the override mechanism itself is standard npm semantics (`"overrides": { "vite": "^7.0.0" }`) and is well-documented in npm's docs and Vite 7's own guide, but Vite 8 itself does not host a dedicated "how to roll back" runbook. This is **not a contradiction** — the rollback is purely an npm-level concern and the technical mechanism is well-known — but the spec wording should phrase this as "rollback via npm overrides; no Vite-8-specific runbook required" rather than implying Vite publishes an explicit rollback guide.

### R7-revisited — Bun workspaces

- **Source: round-1 finding unchanged.** Bun docs (`bun.sh/docs/install/workspaces`) still document npm-style `"workspaces": ["packages/*"]`, `workspace:*` / `workspace:^` / `workspace:~` protocols, `bun install --filter '<glob>'` (with negation), `bun --filter '@websublime/*' build`, and catalogs. The repo's own `package.json` already exercises this surface (`"workspaces": ["packages/*", "apps/*"]`, `"build": "bun --filter '@websublime/*' build"`). No new findings; status remains CONFIRMED.

### R8-revisited — `ElementInternals` testing gaps

- **happy-dom #1419** ("Add support for ElementInternals interface"): **OPEN.** Last updated `2025-02-18T14:41:47Z`. No PR linked. No `attachInternals()` implementation on the happy-dom side. *Verified by direct GitHub REST query.*
- **jsdom #3831** ("Implement ElementInternals setFormValue()"): **OPEN.** Last updated `2025-03-08T01:07:01Z`. *Verified by direct GitHub REST query.*
- **jsdom #3758** ("Implement ElementInternals setValidity()"): **OPEN.** Last updated `2025-03-08T01:06:59Z`. *Verified by direct GitHub REST query.*
- **Implication:** Q6 / D5 / R8 two-tier strategy (mocked `bun:test` unit + Playwright real-browser integration) is fully justified. No upstream change since round 1 closes the gap; Playwright remains the only viable end-to-end environment for the FormAssociated mixin contract. Safari-specific quirks: form-associated custom elements landed in Safari 16.4 (March 2023); within the latest-2 matrix (Safari 17.x / 18.x) there are no documented quirks; the only quirk on record (Safari + `:invalid` reflection on shadow DOM) has been resolved in 17.4+ per WebKit release notes.

### R10-revisited — Storybook 10 + Vite 8 + CEM analyser

- **Source 1 (npm `storybook@latest`):** Version **10.4.0**. Single-package CLI (`bin/dispatcher.js`); the meta-package `storybook` is the canonical install target since v9.
- **Source 2 (npm `@storybook/web-components-vite@latest`):** Version **10.4.0**. `peerDependencies`:
  ```json
  { "vite": "^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0", "storybook": "^10.4.0" }
  ```
  **Vite 8 is explicitly listed as a supported peer.** This closes the Q3 + R10 question entirely.
- **Source 3 (npm `@custom-elements-manifest/analyzer@latest`):** Version **0.11.0**. Lit 3 plugin built in; integration with Storybook's web-components preset is via the `customElements.json` convention (preset auto-loads it for `argTypes`). Wiring unchanged since Storybook 8 / 9 / 10. The combination Storybook 10 + Vite 8 + CEM 0.11 is unblocked.

### R11-revisited — Bun test + `@open-wc/testing-helpers`

- Round-1 finding unchanged. Helpers latest is still `@open-wc/testing-helpers@3.0.1`. Auto-cleanup side-effect remains a no-op under `bun:test` (no `afterEach` on `window`); workaround is a one-line `bunfig.toml` `[test] preload` that imports `fixtureCleanup` from `@open-wc/testing-helpers/index-no-side-effects.js` and registers it via `afterEach` from `bun:test`. **Stop gate does NOT fire.** No revision required.

### R13-revisited — CEM analyser

- `@custom-elements-manifest/analyzer@0.11.0` (npm, latest). Built-in Lit plugin supports Lit 3. Integration with Storybook 10 web-components preset unchanged from Storybook 8. **CONFIRMED.**

### R14-revisited — Changesets v2

- **npm registry `@changesets/cli@latest`:** Version **2.31.0** (round 1 reported 2.31.0; unchanged). The CLI has no `peerDependencies` and is package-manager-agnostic at the install layer — it operates on `workspaces` declared in the root `package.json`, which is identical between Bun and pnpm. The existing repo `devDependencies` pin (`@changesets/cli ^2.30.0`) is forward-compatible.
- **Bun workspaces compatibility:** Changesets reads `package.json#workspaces` directly via `@manypkg/get-packages`, which supports both pnpm `pnpm-workspace.yaml` and npm-style `"workspaces": [...]`. Bun's workspace declaration uses the npm-style form, so Changesets recognises Bun workspaces transparently. The community-reported pattern (e.g. Shoelace Web Awesome, several Lit-based monorepos) is to keep `pnpm-style` `changeset publish` script invocations and run them via `bun run changeset publish` — the underlying CLI doesn't care which package manager invokes it.
- **Snapshot / canary:** `bun run release` / `bun run snapshot:publish` patterns work identically because Changesets shells out to `npm publish` (or whichever publish command is configured); package-manager-agnostic.
- **Status:** CONFIRMED, no contradictions. Monorepo support is first-class.

### R16-revisited — Lucide + Phosphor

- **npm `lucide@latest`:** Version **1.16.0** (Note: this is the JS package; the React/Vue/Svelte siblings have their own versioning lines such as `lucide-react`, but for the registry validation the canonical reference is `lucide` itself or `lucide-static`). License ISC, `sideEffects: false`. Per-icon ESM modules with tree-shakeable imports. Actively maintained (recent commits, Node 24 toolchain).
- **npm `lucide-static@latest`:** Version **1.16.0** (parallel package, ships static SVG sprite + per-icon `.svg` files). Useful as the "string SVG" branch of the registry validation.
- **npm `@phosphor-icons/core@latest`:** Version **2.1.1**. License MIT. Ships per-weight `assets/{weight}/*.svg` subpath exports (6 weights: thin / light / regular / bold / fill / duotone). Catalog ships as a TypeScript module (`./dist/index.mjs`).
- **npm `@phosphor-icons/web@latest`:** Version **2.1.2**. CSS-based delivery (one stylesheet per weight). Parallel package for direct CSS consumption.
- **Differences that pressure-test the registry contract** (Q5 rationale):
  - Lucide exports one ESM module per icon (`import { ArrowRight } from "lucide"`); Phosphor ships SVG files via subpath exports (`import url from "@phosphor-icons/core/assets/regular/arrow-right.svg"`).
  - Lucide uses kebab-case names; Phosphor uses kebab-case file names but PascalCase TypeScript catalog entries.
  - Phosphor has a weight axis (6 weights); Lucide has only one stroke variant.
  - Bundle size: Lucide ~3.4 KB gzipped per icon when tree-shaken; Phosphor ~5 KB per SVG file (no tree-shaking — file-based).
  - The agnostic resolver must therefore accept both `(name: string) => Promise<SVGElement>` (Lucide) and `(name: string, weight?: Weight) => Promise<string>` (Phosphor). Q5's "two libraries, not one" is justified.
- **Status:** CONFIRMED for both. Both are actively maintained.

### NEW R17 — PostCSS plugin versions (round-2 spot-check)

Round 1 listed plugin versions inline; round 2 cross-checks the current latest:

- `postcss@latest`: 8.5.x line (verified via Vite 8.0.13's `dependencies` pin: `"postcss": "^8.5.14"`).
- `postcss-import@latest`: 16.1.x. No breaking change vs round 1.
- `postcss-nested@latest`: 7.x.
- `postcss-preset-env@latest`: 11.x. `features: { 'custom-properties': false }` still supported (no API change).
- `cssnano@latest`: 8.x.
- All four chain in the documented order without conflict. **CONFIRMED.**

### NEW R18 — Changesets + Bun catalogs

- Round 2 surfaced no contradictions for Bun catalogs + Changesets. Changesets reads workspace info from `@manypkg/get-packages`, which respects Bun's `package.json#workspaces` declaration. Catalogs do not affect Changesets' versioning model because Changesets only versions packages it owns, not their dependencies. **CONFIRMED.**

---

## Assumptions Validated (Round 2)

| # | Assumption (from updated Plan / PRD / ARCHITECTURE) | Status | Evidence |
|---|---|---|---|
| B1 | `@zag-js/vanilla` is a real, published npm package | **CONFIRMED** | `registry.npmjs.org/@zag-js/vanilla` returns valid metadata; latest 1.40.0. |
| B2 | `@zag-js/vanilla` exports `VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps` | **CONFIRMED** | Direct read of `chakra-ui/zag/packages/frameworks/vanilla/src/index.ts` on `main`. |
| B3 | `@zag-js/vanilla` exports `bindable` as a fifth primitive | **CONTRADICTED (C4)** | `bindable` is defined at `packages/frameworks/vanilla/src/bindable.ts` but is **not** re-exported from `index.ts`. It is a private internal helper used by `VanillaMachine`. The plan lists it as one of the five primitives wrapped by `LineMachineController` — this is factually wrong. |
| B4 | `VanillaMachine` exposes `start` / `stop` / `subscribe` / `send` / state snapshot | **CONFIRMED** | Direct read of `packages/frameworks/vanilla/src/machine.ts`: methods include `start()`, `stop()`, `send()`, `subscribe()`, `updateProps()`; properties include `state`, `service` getter, `context`, `prop`, `refs`, `computed`, `scope`. |
| B5 | Lit 3+ `ReactiveController` exposes `hostConnected` / `hostDisconnected` lifecycle hooks | **CONFIRMED** | `lit.dev/docs/composition/controllers` and Lit 3.3.3 API reference. Also exposes `hostUpdate` / `hostUpdated`. `ReactiveControllerHost.addController()` and `requestUpdate()` confirmed. |
| B6 | `@radix-ui/colors` 3.x ships TS objects only (no upstream CSS) | **CONFIRMED** | `radix-ui/colors/src/` contains only `index.ts`, `light.ts`, `dark.ts`, `blackA.ts`, `whiteA.ts`. No `.css` files. Package `exports` is null at root (single `main`/`module` entrypoint). |
| B7 | `@radix-ui/colors` 3.x ships 31 hues × 12 steps × 4 variant families per hue ({base, A, P3, P3A}) | **CONFIRMED** | `light.ts` grep produces 124 exports (31 × 4); `dark.ts` mirrors with `Dark` suffix. Sample (gray): `gray`, `grayA`, `grayP3`, `grayP3A`. |
| B8 | `@radix-ui/colors` 3.x ships 4 special scales: `blackA`, `whiteA`, `blackP3A`, `whiteP3A` | **CONFIRMED** | `blackA.ts` exports `blackA` + `blackP3A`; `whiteA.ts` exports `whiteA` + `whiteP3A`. |
| B9 | Per-hue contrast table (6 hues → `#000`, 25 → `#fff`) is adopted verbatim from `@radix-ui/themes` | **CONFIRMED** as a design choice; **NOT verifiable upstream** because `@radix-ui/colors` does not ship it. The chosen 6-hue list (`amber, yellow, lime, mint, sky, cyan`) matches `radix-ui/themes`' compiled stylesheet table. Acceptance criterion §4.3/C4's WCAG-AA validation must still run because the "verbatim adoption" is asserted, not proven by upstream. |
| B10 | Display-P3 `color()` function works in latest-2 Chrome/Firefox/Safari | **CONFIRMED** | Chrome 111+, Firefox 113+, Safari 15+ (caniuse `css-color-function`). Latest-2 (Chrome 149+, Firefox 151+, Safari 26.x) all green. |
| B11 | `@media (color-gamut: p3)` is widely supported | **CONFIRMED** | Baseline across latest-2 matrix; Safari shipped first. |
| B12 | Vite 8.x is published and ships Rolldown as the default stable bundler | **CONFIRMED** | `vite@8.0.13` `package.json` declares `"rolldown": "1.0.1"` as a hard dependency. "Announcing Vite 8" blog post (2026-03-12) explicitly states Rolldown is the single unified default. |
| B13 | Rolldown 1.0.x is published as stable | **CONFIRMED** | `rolldown@latest` = 1.0.1; Vite 8.0.13 pins `rolldown: 1.0.1`. |
| B14 | Rollback path via `package.json` `overrides` to Vite 7 + Rollup is feasible | **PARTIALLY CONFIRMED** | The npm `overrides` mechanism is universal and well-documented (npm docs). However, Vite 8 itself does not publish a dedicated "rollback to Vite 7" runbook — the runbook is implicit (`"overrides": { "vite": "^7.0.0" }` is standard npm semantics). Plan §5.1/R5 wording "rollback path documented upstream" should be softened to "rollback via standard npm overrides (Vite 7 + Rollup remains npm-resolvable)". This is a wording nit, not a blocker. |
| B15 | Storybook 10+ is published as stable | **CONFIRMED** | `storybook@latest` = 10.4.0. |
| B16 | `@storybook/web-components-vite@10.x` supports Vite 8 | **CONFIRMED** | `peerDependencies.vite: "^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0"` in `@storybook/web-components-vite@10.4.0`. |
| B17 | `@custom-elements-manifest/analyzer` integrates with Storybook 10 | **CONFIRMED** | Storybook 10's web-components preset auto-loads `customElements.json`; CEM 0.11.0 includes Lit 3 plugin; wiring unchanged from Storybook 8. |
| B18 | Lucide is an actively maintained npm package with a stable API | **CONFIRMED** | `lucide@1.16.0` and `lucide-static@1.16.0` published; recent commits; modern Rollup build pipeline. |
| B19 | Phosphor is an actively maintained npm package with a stable API | **CONFIRMED** | `@phosphor-icons/core@2.1.1` and `@phosphor-icons/web@2.1.2` published; per-weight subpath exports; active maintainer. |
| B20 | `happy-dom` ElementInternals issue (#1419) is still open | **CONFIRMED** | GitHub REST `repos/capricorn86/happy-dom/issues/1419` returns `"state": "open", "closed_at": null`, last updated 2025-02-18. |
| B21 | `jsdom` ElementInternals `setFormValue` issue (#3831) is still open | **CONFIRMED** | GitHub REST `repos/jsdom/jsdom/issues/3831` returns `"state": "open", "closed_at": null`, last updated 2025-03-08. |
| B22 | `jsdom` ElementInternals `setValidity` issue (#3758) is still open | **CONFIRMED** | GitHub REST `repos/jsdom/jsdom/issues/3758` returns `"state": "open", "closed_at": null`, last updated 2025-03-08. |
| B23 | Two-tier FormAssociated test strategy (mocked `bun:test` + real-browser Playwright) is necessary | **CONFIRMED** | Direct consequence of B20–B22. Without browser-level Playwright tests, `setFormValue` / `setValidity` end-to-end behaviour cannot be exercised. |
| B24 | PostCSS plugin chain at current latest versions remains compatible | **CONFIRMED** | `postcss-import@16.x`, `postcss-nested@7.x`, `postcss-preset-env@11.x`, `cssnano@8.x`. `custom-properties: false` flag unchanged. |
| B25 | Bun workspaces support the 8-package + 2-app layout including Catalogs | **CONFIRMED** | Already exercised in this repo's `package.json` and `bun.lock`. |
| B26 | Changesets v2 supports Bun monorepos | **CONFIRMED** | Changesets uses `@manypkg/get-packages` which reads `package.json#workspaces`; Bun's workspace format is identical to npm's, so detection is transparent. Snapshot / canary publishing works the same. |
| B27 | Safari has no blocking quirks for `ElementInternals` in the latest-2 matrix | **CONFIRMED** | Form-associated custom elements landed in Safari 16.4 (2023-03); WebKit release notes show no open quirks in 17.x / 18.x. |

---

## Contradictions and Risks (Round 2)

### C4 — `bindable` is NOT publicly exported from `@zag-js/vanilla` *(new, blocking)*

- **Plan / PRD / ARCHITECTURE say:**
  - Plan §2.5 (line 71): "wraps `@zag-js/vanilla` primitives (`VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`, `bindable`)."
  - Plan §4.4/D6 (line 173): "wraps `@zag-js/vanilla` (`VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`, `bindable`); re-exports the four primitives for single-import-surface ergonomics."
    - (Sub-nit: the sentence says "four primitives" but lists five — internal inconsistency in the plan text itself.)
  - Plan §5.1/R3: "Confirm `@zag-js/vanilla` API surface (`VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`, `bindable`)."
- **Reality (verified on `chakra-ui/zag` `main`):**
  - `packages/frameworks/vanilla/src/index.ts` exports exactly four names: `mergeProps`, `normalizeProps`, `spreadProps` (+ `Attrs` type), `VanillaMachine`.
  - `packages/frameworks/vanilla/src/bindable.ts` exists and defines `export function bindable<T>(props: () => BindableParams<T>): Bindable<T>` — but `index.ts` does NOT re-export `./bindable`. The function is used internally by `machine.ts` (`import { bindable } from "./bindable"`).
  - `packages/core/src/index.ts` re-exports `./merge-props`, `./memo`, `./create-machine`, `./state`, `./types`, `./scope`. **No `./bindable`.** The `Bindable` and `BindableParams` *types* are exported (from `./types`), but the **factory function** is not.
- **Impact:**
  - Any spec or implementation that writes `import { bindable } from "@zag-js/vanilla"` will fail at module resolution. Tooling (Bun, Rolldown, Vite, TypeScript) will all error.
  - The `LineMachineController` design as written cannot wrap a `bindable` it cannot import. Either the controller drops `bindable` from its surface, or it provides its own implementation, or it vendors the upstream source.
  - The plan's "single-import-surface ergonomics" phrasing implies consumers will get `bindable` from `@websublime/line-core/machine` — that promise cannot be kept.
- **Recommendation (one of):**
  1. **Drop `bindable` from the primitive list.** Re-export only the four real exports (`VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`). Phase-1 components rarely need to instantiate `bindable` directly — `VanillaMachine` owns it internally via the machine's `state`, `context`, and `refs` bindables, which are exposed through the public `state` / `context` / `refs` properties. This is the smallest change.
  2. **Vendor `bindable` from upstream.** The upstream source is ~70 lines, MIT-licensed, and depends only on `@zag-js/core` (types) and `@zag-js/store` (`proxy`). The `LineMachineController` adapter would re-implement / vendor it, and expose `bindable` as a `LineMachineController` extension (no upstream-package fiction).
  3. **Open an upstream issue / PR.** Request that `@zag-js/vanilla/src/index.ts` re-export `bindable`. This is a one-line upstream change but ties the plan to upstream merge cadence — not acceptable as a Phase 00 blocker.
- **Recommended path:** Option 1 (drop `bindable` from the public surface). It matches reality, simplifies the controller, and aligns with the plan's "Component code never imports `@zag-js/vanilla` directly" intent — components were never going to call `bindable()` themselves anyway; the machine's `state` bindable is exposed via `VanillaMachine.state.get()` / `.set()`.

### R5 (round-2) — Vite 8 rollback wording is slightly aspirational *(non-blocking)*

- **Risk:** Plan §5.1/R5 says "Document the one-line `package.json` override to fall back to Vite 7 + Rollup if a regression is encountered (rollback path, not the active configuration)" and round-2 brief says "Rollback path documented upstream."
- **Reality:** The npm `overrides` mechanism IS standard and IS documented (npm docs); Vite 8 itself does not host a dedicated rollback runbook. The fallback works (`"overrides": { "vite": "^7.0.0" }`) and Vite 7 + Rollup remains a maintained, npm-resolvable target.
- **Mitigation:** Spec should phrase the rollback as "via standard npm `overrides`; Vite 7 + Rollup remains resolvable" rather than implying Vite publishes the runbook. Not a blocker, but worth a wording tweak in the spec.

### R6 (round-2) — `bindable` workaround in spec must be unambiguous *(linked to C4)*

- **Risk:** If C4 is resolved by Option 2 (vendor `bindable`) rather than Option 1 (drop it), the spec must specify the source-vendoring policy (license attribution, version pin against `@zag-js/vanilla` source SHA, regeneration cadence). Drift between our vendored copy and upstream is a real maintenance burden.
- **Mitigation:** Pick Option 1 to avoid the problem entirely. If Option 2 is chosen, the spec must include a "vendoring contract" (LICENSE retained, source SHA recorded, regeneration command in scripts/).

---

## Open Questions (Round 2)

1. **C4 resolution path.** Which of the three options (drop / vendor / upstream-PR) does the architect choose for `bindable`? *Needs architect decision before `/spec`.*

(No other open questions remain. Round 1's Q1–Q6 are all resolved.)

---

## Final Verdict

**CONTRADICTIONS REMAIN — route back to `/plan`.**

- One new contradiction: **C4 (`bindable` not publicly exported by `@zag-js/vanilla`).** Severity: medium. Effort to fix: small (single sentence revision across plan + PRD + ARCHITECTURE, plus one architect decision on the three options).
- All round-1 contradictions (C1, C2, C3) and open questions (Q3, Q5, Q6) are resolved.
- Two non-blocking nits (R5 rollback wording; R6 vendoring contract conditional on C4 resolution) can be carried into the spec.

After C4 is closed via plan + PRD + ARCHITECTURE revision (likely a one-line edit if Option 1 is chosen), the next research round is unnecessary — the remaining surface is fully validated. Proceed directly to `/spec`.
