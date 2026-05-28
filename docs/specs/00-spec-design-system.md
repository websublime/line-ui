# SPEC: Phase 00 — Design System Foundation

**Status:** APPROVED
**Author:** Ada (architect)
**Date:** 2026-05-19
**Phase target:** `line://ui` v0.1.0
**Source PRD:** [`/Users/ramosmig/Public/WS-Labs/line-ui/docs/PRD.md`](../PRD.md) (v0.8.3, APPROVED)
**Source Plan:** [`/Users/ramosmig/Public/WS-Labs/line-ui/docs/plans/00-plan-design-system.md`](../plans/00-plan-design-system.md) (APPROVED)
**Source Architecture:** [`/Users/ramosmig/Public/WS-Labs/line-ui/docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
**Source Research:**
- Round 1 — [`/Users/ramosmig/Public/WS-Labs/line-ui/docs/research/00-research-design-system-foundation.md`](../research/00-research-design-system-foundation.md)
- Round 2 — [`/Users/ramosmig/Public/WS-Labs/line-ui/docs/research/00-research-design-system-foundation-round2.md`](../research/00-research-design-system-foundation-round2.md)

> **What this document is.** The implementation specification for Phase 00 of `line://ui`. It is the canonical, implementable contract: every package, every file, every API, every script signature, every test tier. Anything not declared here is out of scope for Phase 00.
>
> **What this document is NOT.** It is not a planning document — scope, dependencies, supervisor assignment, and acceptance criteria are owned by the plan. It is not a research document — facts are sourced from the validated research notes, not re-investigated here.

---

## 1. Goals

1. Stand up the **8 published packages + 2 apps** monorepo declared in plan §2 with workspace wiring, build pipelines, type generation, and changelog automation.
2. Author the **5-package layered design system** (`line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils`) end-to-end: tokens, palettes (4 variant families × 31 hues + 4 special scales), role mappings, semantic mappings, named aliases, and the auto-pair table.
3. Refactor the runtime base class to **`LineElement`** with four mixins (Inspector, Metadata, Direction, FormAssociated) and a first-party Zag.js adapter (**`LineMachineController`**) at `@websublime/line-core/machine`.
4. Stand up the **icon registry contract** in `@websublime/line-icons` and validate it against two reference libraries (Lucide + Phosphor).
5. Stand up the **build, test, and release infrastructure**: Bun runtime, Biome lint/format, PostCSS pipeline, Vite 8+ (Rolldown stable default), Storybook 10+ with `@storybook/web-components-vite` and CEM analyser, Bun test + Playwright, GitHub Actions checks/release/snapshot, Cloudflare Pages deploy for `apps/site`.
6. Ship **Phase 00 documentation** in Storybook: Getting Started, Theming, Customisation; plus `COMPONENT-SPEC-TEMPLATE.md` and `COMPETITIVE-COMPONENT-ANALYSIS.md`.
7. Run the **HTMX spike (`LineHtmxElement`)** with a runnable example crossing shadow DOM, and record the outcome (committed vs exploratory) in the Phase 00 retrospective.

---

## 2. Non-Goals

The following are explicitly **out of scope** for Phase 00 and must not be introduced by any task in this spec:

- Any UI component. `@websublime/line-components` ships **empty** in Phase 00 — only the package skeleton, build wiring, and exports map. First components ship in Phase 1.
- SSR/SSG investigation.
- CDN distribution (unpkg, jsdelivr).
- Full landing-page content for `apps/site` — Phase 00 ships scaffold + placeholder + deploy only.
- Utility-class system from v0.7. Decision deferred to Phase 1 (per PRD §9.13).
- Full icon library content. Phase 00 ships only the resolver contract + Lucide/Phosphor validation.
- `line-form` / cross-field validation orchestration.
- Stable npm releases. Phase 00 is RCs only.
- Re-investigation of any dependency already validated in the two research rounds — facts come from research, not re-discovery.

---

## 3. Architecture Summary

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Repository: @websublime/line-ui (private root, Bun workspaces)            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  packages/  (8 published @websublime/line-* packages)                      │
│  ├── line-tokens       L0  CSS    — 18 families + reset                    │
│  ├── line-colors       L1  CSS    — 31 hues × 4 variant families + special │
│  ├── line-schemas      L2  TS     — types + Zod (HUES, ACCENT_HUES, …)     │
│  ├── line-themes       L3  CSS    — roles, semantics, aliases, defaults    │
│  ├── line-utils        —   TS     — contrast, mix helpers                  │
│  ├── line-core         —   TS     — LineElement + mixins + machine adapter │
│  ├── line-components   —   TS     — empty umbrella (Phase 00)              │
│  └── line-icons        —   TS     — registry contract + resolver           │
│                                                                            │
│  apps/  (2 unpublished apps)                                               │
│  ├── storybook    — Storybook 10 + web-components-vite + CEM analyser      │
│  └── site         — Astro 5 scaffold + Cloudflare Pages + placeholder      │
│                                                                            │
│  Tooling                                                                   │
│  ├── Bun 1.3+              (runtime, package manager, test runner)         │
│  ├── Biome 2.x             (lint + format)                                 │
│  ├── Vite 8+               (component bundler, Rolldown 1.0.x default)     │
│  ├── PostCSS 8.5+          (design-system CSS pipeline)                    │
│  ├── TypeScript 5.x        (types + dual emission)                         │
│  ├── Changesets 2.x        (versioning + publish, snapshot/canary)         │
│  └── Playwright 1.60+      (browser-tier tests, snapshots)                 │
└────────────────────────────────────────────────────────────────────────────┘
```

**Cross-layer rule (Manifesto Law 10):** dependencies flow **downward only**:

```
themes  →  colors + schemas
utils   →  schemas
icons   →  tokens
core    →  zag-js/vanilla, lit
components → core + tokens + themes + utils (Phase 1+)
storybook → all published packages (dev-only)
site      → none (Phase 00); will consume tokens+themes for Phase 1
```

Any upward or sideways import is a build-time error (enforced by Stream B/B5 lint rule — see §6.B).

---

## 4. Package Inventory & Exports

The complete `exports` contract is fixed by PRD §6.2 + §9.9. Reproduced here for spec authority — implementation MUST match these maps exactly.

### 4.1 `@websublime/line-tokens`

```jsonc
{
  "name": "@websublime/line-tokens",
  "type": "module",
  "sideEffects": ["*.css"],
  "exports": {
    ".":              "./dist/index.css",
    "./reset":        "./dist/reset.css",

    // 11 primitive families
    "./typography":   "./dist/typography.css",
    "./sizing":       "./dist/sizing.css",
    "./shadows":      "./dist/shadows.css",
    "./easings":      "./dist/easings.css",
    "./z-index":      "./dist/z-index.css",
    "./opacity":      "./dist/opacity.css",
    "./motion":       "./dist/motion.css",
    "./radii":        "./dist/radii.css",
    "./border-width": "./dist/border-width.css",
    "./focus-ring":   "./dist/focus-ring.css",
    "./breakpoints":  "./dist/breakpoints.css",

    // 7 decorative families
    "./aspects":      "./dist/aspects.css",
    "./animations":   "./dist/animations.css",
    "./gradients":    "./dist/gradients.css",
    "./masks":        "./dist/masks.css",
    "./layouts":      "./dist/layouts.css",
    "./highlights":   "./dist/highlights.css",
    "./svg":          "./dist/svg.css"
  }
}
```

The `.` barrel CSS uses `@import` to compose all 18 families + reset in fixed order: reset → 11 primitives (alphabetical within the tier) → 7 decoratives (alphabetical). PostCSS `postcss-import` resolves these at build time so the published `dist/index.css` is a single flat file.

### 4.2 `@websublime/line-colors`

```jsonc
{
  "name": "@websublime/line-colors",
  "type": "module",
  "sideEffects": ["*.css"],
  "exports": {
    ".":          "./dist/index.css",
    "./special":  "./dist/special.css",
    // 31 hues, one subpath each — generated; full list in §6.C
    "./amber":    "./dist/amber.css",
    "./blue":     "./dist/blue.css",
    "./bronze":   "./dist/bronze.css",
    "./brown":    "./dist/brown.css",
    "./crimson":  "./dist/crimson.css",
    "./cyan":     "./dist/cyan.css",
    "./gold":     "./dist/gold.css",
    "./grass":    "./dist/grass.css",
    "./gray":     "./dist/gray.css",
    "./green":    "./dist/green.css",
    "./indigo":   "./dist/indigo.css",
    "./iris":     "./dist/iris.css",
    "./jade":     "./dist/jade.css",
    "./lime":     "./dist/lime.css",
    "./mauve":    "./dist/mauve.css",
    "./mint":     "./dist/mint.css",
    "./olive":    "./dist/olive.css",
    "./orange":   "./dist/orange.css",
    "./pink":     "./dist/pink.css",
    "./plum":     "./dist/plum.css",
    "./purple":   "./dist/purple.css",
    "./red":      "./dist/red.css",
    "./ruby":     "./dist/ruby.css",
    "./sage":     "./dist/sage.css",
    "./sand":     "./dist/sand.css",
    "./sky":      "./dist/sky.css",
    "./slate":    "./dist/slate.css",
    "./teal":     "./dist/teal.css",
    "./tomato":   "./dist/tomato.css",
    "./violet":   "./dist/violet.css",
    "./yellow":   "./dist/yellow.css"
  }
}
```

`./special` exposes the four special scales (`blackA`, `whiteA`, `blackP3A`, `whiteP3A` → `--line-black-a{1..12}`, `--line-white-a{1..12}`). The `.` barrel `@import`s all 31 hues + `special.css`.

### 4.3 `@websublime/line-schemas`

```jsonc
{
  "name": "@websublime/line-schemas",
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types":  "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

### 4.4 `@websublime/line-themes`

```jsonc
{
  "name": "@websublime/line-themes",
  "type": "module",
  "sideEffects": ["*.css"],
  "exports": {
    ".":           "./dist/index.css",
    "./accent/*":  "./dist/accent/*.css",
    "./gray/*":    "./dist/gray/*.css",
    "./semantics": "./dist/semantics.css",
    "./aliases":   "./dist/aliases.css",
    "./defaults":  "./dist/defaults.css"
  }
}
```

The `.` barrel `@import`s, in order: `semantics.css` → `defaults.css` → all `accent/*.css` → all `gray/*.css` → `aliases.css`.

### 4.5 `@websublime/line-utils`

```jsonc
{
  "name": "@websublime/line-utils",
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".":          { "types": "./dist/index.d.ts",    "import": "./dist/index.js" },
    "./contrast": { "types": "./dist/contrast.d.ts", "import": "./dist/contrast.js" },
    "./mix":      { "types": "./dist/mix.d.ts",      "import": "./dist/mix.js" }
  }
}
```

### 4.6 `@websublime/line-core`

```jsonc
{
  "name": "@websublime/line-core",
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".":          { "types": "./dist/index.d.ts",           "import": "./dist/index.js" },
    "./machine":  { "types": "./dist/machine/index.d.ts",   "import": "./dist/machine/index.js" },
    "./styles":   { "types": "./dist/styles/index.d.ts",    "import": "./dist/styles/index.js" },
    "./mixins/*": { "types": "./dist/mixins/*.d.ts",        "import": "./dist/mixins/*.js" }
  }
}
```

### 4.7 `@websublime/line-components`

```jsonc
{
  "name": "@websublime/line-components",
  "type": "module",
  "sideEffects": [],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  }
}
```

Empty in Phase 00. `dist/index.js` exports nothing functional — only re-exports `LineElement` type for downstream typing. Build pipeline is wired and verified by a smoke build but emits no component bundles.

### 4.8 `@websublime/line-icons`

```jsonc
{
  "name": "@websublime/line-icons",
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  }
}
```

Surface in Phase 00: the `IconRegistry` class, the `IconResolver` type, and two reference adapter factories (`createLucideResolver`, `createPhosphorResolver`). Subpaths (`./registry`, `./resolvers/*`) are added in Phase 1.

---

## 5. Repository Layout

```
line-ui/
├── package.json                      # private root; "workspaces": ["packages/*", "apps/*"]
├── bun.lock                          # committed
├── bunfig.toml                       # registry + [test] preload
├── biome.json                        # lint + format config
├── tsconfig.base.json                # shared TS config (per-package extends)
├── postcss.config.mjs                # shared PostCSS config
├── vite.config.shared.mjs            # shared Vite preset (per-package extends)
├── .changeset/                       # Changesets workspace
├── .github/workflows/                # GitHub Actions
│   ├── checks.yml
│   ├── release.yml
│   ├── snapshot-deploy.yml
│   ├── snapshot-version.yml
│   ├── deploy-site.yml               # Cloudflare Pages (apps/site)
│   └── deploy-storybook.yml          # Cloudflare Pages (apps/storybook)
├── scripts/                          # repo-wide scripts (palette gen, layer-lint, etc.)
│   ├── generate-palettes.mjs
│   ├── generate-role-maps.mjs
│   ├── validate-contrast.mjs
│   └── lint-layers.mjs
├── bun-test-preload.ts               # registers fixtureCleanup; see §6.F
├── playwright.config.ts
├── docs/                             # PRD, plan, research, specs (this file)
├── packages/
│   ├── line-tokens/
│   ├── line-colors/
│   ├── line-schemas/
│   ├── line-themes/
│   ├── line-utils/
│   ├── line-core/
│   ├── line-components/
│   └── line-icons/
└── apps/
    ├── storybook/
    └── site/
```

Per-package structure is identical in shape (own `package.json`, `tsconfig.json`, `src/`, `dist/`, `README.md`, `CHANGELOG.md` (auto)) with build script wired through Bun workspaces:

```jsonc
// every package.json
{
  "scripts": {
    "build":    "...",
    "dev":      "...",
    "clean":    "rm -rf dist",
    "typecheck":"tsc --noEmit"
  }
}
```

Root `package.json` `build` script remains `"bun --filter '@websublime/*' build"`.

---

## 6. Implementation Detail Per Stream

### 6.A Stream A — Runtime & Tooling Migration

**A1 — Bun migration.**

- Adopt Bun **≥ 1.3.14** (latest stable per R7-R2). Repo already uses Bun workspaces; this task removes residual pnpm artefacts.
- Delete: `pnpm-lock.yaml` (if any), `pnpm-workspace.yaml` (if any), `.npmrc` directives specific to pnpm, any `engines.pnpm` pin.
- Add `engines.bun: ">=1.3.14"` to root `package.json`.
- Add `.bun-version` file (single line, pinned version) for CI/contributor parity.
- `bunfig.toml`:
  ```toml
  [install]
  registry = "https://registry.npmjs.org/"

  [test]
  preload = ["./bun-test-preload.ts"]
  ```
- Workspace install command: `bun install`. Workspace scripts: `bun --filter '@websublime/*' <script>`.

**A2 — Biome migration.**

- Pin `@biomejs/biome` to the **2.4.x line** (currently `^2.4.6` already installed; bump to `^2.4.15` minimum).
- Remove ESLint, Prettier, and all related plugins (`eslint`, `prettier`, `eslint-plugin-*`, `eslint-config-*`, `@typescript-eslint/*`) — full `devDependencies` sweep.
- Delete `.eslintrc*`, `.prettierrc*`, `.prettierignore`.
- `biome.json` configures: lint level "recommended"; format style 2-space indent, single quotes, trailing commas "all"; `organizeImports: on`; CSS support enabled (v2 feature); ignores `dist/`, `node_modules/`, `*.generated.css`, `customElements.json`.
- Root scripts already wire `lint`, `lint:fix`, `format`. No further script changes.
- Accept the documented "minor rule loss" (PRD §8) — no rule-by-rule mapping is required.

**A3 — Dependency updates.**

| Package | Target | Source |
|---|---|---|
| `lit` | `^3.3.3` | R4 |
| `vite` | `^8.0.13` | R5 round-2 |
| `rolldown` | bundled with Vite 8 (hard dep `1.0.1`) | R5 round-2 |
| `vite-plugin-dts` | `^5.0.0` (devDependency) | required by §6.F.2 `vite.config.shared.mjs` and §7.1 matrix; Vite 8 compatible (AM-005) |
| `@radix-ui/colors` | `^3.0.0` | R1 |
| `@zag-js/core` | `^1.40.0` | R3 |
| `@zag-js/vanilla` | `^1.40.0` | R3 / C4 round-2 |
| `typescript` | latest 5.x | trivial |
| `tslib` | latest 2.x | required by §7.1 `importHelpers: true` (AM-002) |
| `postcss` | `^8.5.14` | R6 round-2 |
| `postcss-cli` | `^11.0.0` (devDependency) | required by §6.B B4 build commands for `line-tokens` / `line-colors` / `line-themes`; PostCSS 8 compatible (AM-005) |
| `postcss-import` | `^16.1.1` | R6 |
| `postcss-nested` | `^7.0.2` | R6 |
| `postcss-preset-env` | `^11.3.0` | R6 |
| `cssnano` | `^8.0.1` | R6 |
| `storybook` | `^10.4.0` | R10 round-2 |
| `@storybook/web-components-vite` | `^10.4.0` | R10 round-2 |
| `@storybook/addon-a11y` | `^10.4.0` | accessibility checks (Phase 00 acceptance) |
| `@storybook/addon-themes` | `^10.4.0` | toolbar `data-accent` / `data-gray` switcher (Q4 resolution) |
| `@custom-elements-manifest/analyzer` | `^0.11.0` | R13 |
| `@open-wc/testing-helpers` | `^3.0.1` | R11 |
| `playwright` | `^1.60.0` | R12 |
| `@changesets/cli` | `^2.31.0` | R14 |
| `zod` | latest 3.x | trivial; consumed by `line-schemas` |
| `astro` | `^5.x` | trivial; consumed by `apps/site` |
| `lucide-static` | `^1.16.0` | R16 (icon validation) |
| `@phosphor-icons/core` | `^2.1.1` | R16 (icon validation) |

Vite 8 ships Rolldown 1.0.1 as a direct dependency — **no override needed for the default configuration**. Rollback path (only if a regression surfaces) is the standard npm override:
```jsonc
{ "overrides": { "vite": "^7.0.0" } }
```
This is **not active configuration**; it is documented in `docs/runbooks/bundler-rollback.md` and exercised only on a confirmed regression.

**A3 — Amendments.**

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
| AM-001 | 2026-05-21 | bead `line-ui-7qm.1.3` pre-implementation investigation | Removed `@storybook/addon-essentials ^10.4.0` row from §6.A.3 dependency table. | Package discontinued at the Storybook 9/10 transition; functionality absorbed into the `storybook` meta-package. No `^10.x` version exists on the npm registry (latest published is `8.6.18`) — installing it would fail `bun install`. | Research-agent verification logged in `bd comments line-ui-7qm.1.3` (SD-4). |
| AM-002 | 2026-05-25 | bead `line-ui-7qm.2.1` pre-implementation investigation | Rewrote §7.1 canonical `tsconfig.base.json` block: added `noImplicitOverride`, `noImplicitReturns`, `noUnusedParameters`, `noUnusedLocals`, `importHelpers`; removed `emitDeclarationOnly` (was blocking `tsc -b` JS emit for `line-schemas` / `line-utils` / `line-icons` per §6.B); kept the existing 4 strictness flags (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `declarationMap`, `verbatimModuleSyntax`). Added new §7.1 sub-section "Per-package `tsconfig.json`" with an 8-row table mapping each package's build engine to its required overrides (`composite: true` + `references` for tsc-built packages; `noEmit: true` for Vite-built packages; `include: []` for CSS-only packages). Added `tslib` as a root devDependency requirement to support `importHelpers`. | Existing `tsconfig.base.json` had drifted from the spec in 12 flags (4 missing from base, 7 extra in base, 1 conflicting). Show-stopper `emitDeclarationOnly: true` would silently break the `tsc -b` packages in B4. Reconciliation locks the spec/code contract before the B1 supervisor begins, prevents per-package patchwork, and brings the per-package override matrix into the spec instead of leaving it implicit. | Research-agent investigation logged in `bd comments line-ui-7qm.2.1` (DRIFT-tsconfig section). User-approved decision matrix iterated 2026-05-25. |
| AM-003 | 2026-05-25 | bead `line-ui-7qm.2.1` B1 implementation | Removed `references: [{ "path": "../line-tokens" }]` from §7.1 per-package matrix `line-icons` row. AM-002 originally listed a TS project reference from `line-icons` to `line-tokens`, but `line-tokens` is CSS-only with `include: []`, making the reference impossible to resolve (`tsc -b packages/line-icons` errors TS18003). `line-icons`/`line-tokens` consumption happens at the CSS/runtime layer; build-order is handled by B2 (workspace deps) and B4 (build orchestration), not by `tsc -b` references. | Spec self-contradiction caught at B1 implementation time. A TS `references` entry requires the target package to be `composite: true` and to have non-empty `include` (at least one TS input). `line-tokens` has neither — it is CSS-only by design (PostCSS pipeline per §6.B). The original AM-002 row was a copy-paste of the valid `line-utils` → `line-schemas` reference, applied incorrectly to a CSS-only target. | Supervisor risk note in `bd comments line-ui-7qm.2.1` (B1 COMPLETED report, "Risk flagged for B4" line). `tsc -b packages/line-icons` error TS18003 reproduced on branch `chore/line-ui-7qm-2-1`. |
| AM-004 | 2026-05-26 | bead `line-ui-7qm.2.2` pre-implementation investigation | Amended §3 Architecture Summary cross-layer rule code block (line 87): the `components` edge now reads `components → core + tokens + themes + utils (Phase 1+)` (added `+ utils`). No other section changed. | §3 Architecture Summary diverged from the normative §6.B "Allowed edges (downward only)" table, which already lists `line-utils` as a permitted dependency of `line-components`. Without `utils` in the §3 edge list, `line-components` could not import from `@websublime/line-utils`, contradicting §6.B and breaking the contract that §4 exports (e.g., `cn` className helper, `mergeRefs`) presupposes downstream component code will consume. The §6.B table is downstream and more detailed — it is the normative contract; §3 must align to it, not the reverse. | `bd comments line-ui-7qm.2.2` — Sherlock investigation, finding `DRIFT-arch-summary-vs-B2-table`. |
| AM-005 | 2026-05-28 | bead `line-ui-7qm.2.4` pre-implementation investigation | Added two missing build-time dependencies to the §6.A.3 dependency table: `vite-plugin-dts` `^5.0.0` (devDependency) and `postcss-cli` `^11.0.0` (devDependency). Both rows are annotated with the AM-005 marker and a pointer to the spec section that consumes them. | The §6.B B4 build commands and §6.F.2 `vite.config.shared.mjs` block both invoke tooling that was never declared in §6.A.3: `postcss-cli` (the `postcss` binary used by the `line-tokens` / `line-colors` / `line-themes` build commands at lines 471-474) and `vite-plugin-dts` (the `.d.ts` emitter wired into the shared Vite config at §6.F.2 ~line 1242 and listed in the §7.1 per-package tsconfig matrix at lines 1574-1575). Without these declarations B4 cannot execute literally — neither package would be present in the lockfile and `bun run build` would fail at the first PostCSS or Vite invocation. Both packages are build-time only (CSS pipeline + TS declaration emit) and therefore belong in `devDependencies`, not in any published package's `dependencies`. Declared minimums are pinned to the current major lines (`vite-plugin-dts` 5.x, the Vite 8-compatible track; `postcss-cli` 11.x, the PostCSS 8 track). | Drift surfaced by research agent during pre-implementation investigation of `line-ui-7qm.2.4` (Stream B B4). Verified absent from current `bun.lock` / `pnpm-lock.yaml`. Version floors confirmed against npm registry on 2026-05-28: `vite-plugin-dts@5.0.1` and `postcss-cli@11.0.1` are current latest; `vite-plugin-dts` 5.x peer-deps on `vite`, `rollup`, and `@microsoft/api-extractor` are all optional. |
| AM-006 | 2026-05-28 | bead `line-ui-7qm.2.4` pre-implementation investigation | Added a normative clarification note under §6.B B4 (immediately after the per-package build table) defining the scope of the AC `dist/ matches exports map` at B4 time. | The AC as originally written would be unsatisfiable at B4: packages declare many subpath exports (`line-tokens`: 19 subpaths, `line-colors`: 33, `line-themes`: 5+ — see §4) but their `src/` directories contain only one-line placeholder comments after B1. The per-hue / per-family source files are populated by Stream C (§6.C.2, §6.C.3, §6.C.4), not by B4. B4 is responsible for the build *plumbing*, not for the source inputs that feed it. The exports-map ↔ `dist/` conformity is asserted downstream by C9 snapshot tests and F4 CI. Without this clarification the B4 supervisor would either block on missing source inputs or invent placeholder content outside the Stream C contract. | Drift surfaced by research agent during pre-implementation investigation of `line-ui-7qm.2.4` (Stream B B4). Cross-referenced against the §4 exports tables and the §6.C source layouts. |
| AM-007 | 2026-05-28 | bead `line-ui-7qm.2.4` pre-implementation investigation | Added a normative clarification note under §6.B B4 (immediately after the AM-006 note) defining the scope of the AC `Vite+Rolldown smoke build CI step passes` at B4 time. | The AC as originally written referenced a CI workflow that does not exist at B4 time. `.github/workflows/checks.yml` is owned by Stream F (F3 / F4, per §6.F.5). B4 is in Stream B and cannot assert a CI step that has not yet been authored. The verifiable B4 surface for this AC is the local-build equivalent: per-package `bun run build` succeeds at repo root, and the `line-components/dist/index.js` zero-export invariant (PRD §6.2, §2 of this spec) is verified by a local probe. The CI assertion itself is correctly the responsibility of Stream F. | Drift surfaced by research agent during pre-implementation investigation of `line-ui-7qm.2.4` (Stream B B4). Verified against §6.F.5 ownership of `checks.yml`. |

**A4 — npm scope.**

- Confirm npm organisation `@websublime` exists and the publishing token has access. (Repo metadata already declares `@websublime/line-*` names.)
- Each published package declares `"publishConfig": { "access": "public" }`.
- Snapshot/canary publishing verified by `bun run snapshot:publish` (already wired) once Stream F lands. Phase 00 publishes at least one snapshot to validate the pipeline end-to-end.

### 6.B Stream B — Monorepo Restructure

**B1 — Package layout.** All 8 packages and 2 apps are authored from scratch under `packages/` and `apps/`. Each package starts with:

```
packages/<name>/
├── package.json
├── tsconfig.json            # extends ../../tsconfig.base.json
├── README.md
├── src/
└── (no dist/ — produced by build)
```

**B2 — Workspace dependencies.** Cross-workspace deps use the `workspace:^` protocol:

```jsonc
// packages/line-themes/package.json
{
  "dependencies": {
    "@websublime/line-colors":  "workspace:^",
    "@websublime/line-schemas": "workspace:^"
  }
}
```

Allowed edges (downward only):

| Package | May depend on |
|---|---|
| `line-tokens` | (none, leaf) |
| `line-colors` | (none, leaf) |
| `line-schemas` | (none, leaf) |
| `line-themes` | `line-colors`, `line-schemas` |
| `line-utils` | `line-schemas` |
| `line-core` | `lit`, `@zag-js/core`, `@zag-js/vanilla` (no `@websublime/*` deps in Phase 00) |
| `line-components` | `line-core`, `line-tokens`, `line-themes`, `line-utils` (Phase 1 onwards; empty in Phase 00) |
| `line-icons` | `line-tokens` |

**B3 — Layer lint.** `scripts/lint-layers.mjs` is a Bun script run in CI (`checks.yml`) that:
1. Reads each package's `package.json#dependencies` + `peerDependencies`.
2. Verifies every `@websublime/*` dependency appears in the allowed edges table.
3. Fails the build with a clear error on any violation (Manifesto Law 10).

**B4 — Per-package build.** Each package owns its build script:

| Package | Build command | Outputs |
|---|---|---|
| `line-tokens` | `postcss src/index.css -o dist/index.css && postcss src/*.css -d dist` (subpath files emitted individually) | one CSS per subpath + `index.css` barrel |
| `line-colors` | same PostCSS pattern; **inputs are generated** (see Stream C) | per-hue CSS + `special.css` + `index.css` |
| `line-schemas` | `tsc -b` | `.js` + `.d.ts` |
| `line-themes` | same PostCSS pattern; **inputs are generated** | role mappings + barrels |
| `line-utils` | `tsc -b` | `.js` + `.d.ts` |
| `line-core` | `vite build` (library mode) | `.js` ESM + `.d.ts` via `vite-plugin-dts` |
| `line-components` | `vite build` (no-op until Phase 1) | empty `index.js` |
| `line-icons` | `tsc -b` | `.js` + `.d.ts` |

**B4 — Scope of `dist/ matches exports map` AC (AM-006).** At B4, the AC `dist/ matches exports map` is satisfied when the build script, given the eventual Stream C source layout, would produce a matching `dist/` tree. The per-hue / per-family CSS source files consumed by `line-tokens` / `line-colors` / `line-themes` are populated by Stream C (§6.C.2, §6.C.3, §6.C.4), not by B4. Empty placeholder `src/` at B4 time is expected. The exports-map ↔ `dist/` conformity is asserted downstream by C9 snapshot tests and by F4 CI per §6.F.5 — not by B4.

**B4 — Scope of `Vite+Rolldown smoke build CI step passes` AC (AM-007).** At B4, CI assertions in `checks.yml` are not yet live — they land in Stream F (F3 / F4 per §6.F.5). B4 satisfies this AC at the *local-build* level: a developer running `bun run build` at repo root succeeds for all 8 packages, and a one-liner zero-export probe on `line-components/dist/index.js` (PRD §6.2; §2 of this spec) passes. The CI step itself is asserted by F3 / F4.

**B5 — Changesets across all 8 packages.** Existing `.changeset/config.json` is updated to:
- `baseBranch`: `"main"`.
- `access`: `"public"`.
- `commit`: `false` (CI handles commits).
- `changelog`: `["@changesets/changelog-github", { "repo": "websublime/line-ui" }]`.
- `ignore`: `["@websublime/line-storybook", "@websublime/line-site"]` — the two apps are never published.
- Snapshot/canary scripts unchanged (already in root `package.json`).

### 6.C Stream C — Design System Authoring

#### 6.C.1 `line-schemas` — TS contracts (C1)

`packages/line-schemas/src/`:

```
src/
├── index.ts           # barrel
├── hues.ts            # HUES, ACCENT_HUES, GRAY_HUES (TS const arrays + Zod enums)
├── semantic-map.ts    # SEMANTIC_MAP (TS const + Zod object)
├── contrast-table.ts  # PER_HUE_CONTRAST (TS const + Zod record)
├── steps.ts           # STEPS = [1..12] as const
├── roles.ts           # ROLES = ['accent','gray','success','warning','danger','info']
└── aliases.ts         # ALIASES = ['surface','bg','bg-hover',...] (9 aliases)
```

API surface (sketch):

```ts
// hues.ts
export const HUES = [
  'amber','blue','bronze','brown','crimson','cyan','gold','grass','gray','green',
  'indigo','iris','jade','lime','mauve','mint','olive','orange','pink','plum',
  'purple','red','ruby','sage','sand','sky','slate','teal','tomato','violet','yellow'
] as const;
export type Hue = typeof HUES[number];
export const HueSchema = z.enum(HUES);

export const ACCENT_HUES = HUES;                     // all 31
export const GRAY_HUES   = ['gray','mauve','slate','sage','olive','sand'] as const;
export type GrayHue = typeof GRAY_HUES[number];
export const GrayHueSchema = z.enum(GRAY_HUES);

// semantic-map.ts
export const SEMANTIC_MAP = {
  success: 'green',
  warning: 'amber',
  danger:  'red',
  info:    'blue',
} as const satisfies Record<string, Hue>;

// contrast-table.ts
export const BLACK_CONTRAST_HUES = ['amber','yellow','lime','mint','sky','cyan'] as const;
export const PER_HUE_CONTRAST: Record<Hue, '#000'|'#fff'> = HUES.reduce(...);
```

This module is the **source of truth** for downstream code generation (palettes, role mappings, contrast validation). No CSS is produced here.

#### 6.C.2 `line-tokens` — 18 families + reset (C2)

`packages/line-tokens/src/`:

```
src/
├── index.css            # @import barrel: reset + 18 families
├── reset.css            # zero-opinion browser-defaults neutralisation (light-DOM consumer reset)
├── typography.css
├── sizing.css
├── shadows.css
├── easings.css
├── z-index.css
├── opacity.css
├── motion.css
├── radii.css
├── border-width.css
├── focus-ring.css
├── breakpoints.css
├── aspects.css
├── animations.css
├── gradients.css        # structural — colour stops reference --line-{hue}-{step}
├── masks.css
├── layouts.css
├── highlights.css
├── svg.css              # structural — stroke widths etc., no colour values
```

All declarations use `:where(html)` (zero specificity, per PRD §9.12). All names are `--line-*` prefixed and singular (`--line-radius-1`, not `--line-radii-1`). Token values are seeded from Open Props as a design reference; **no runtime dependency on Open Props**.

The `reset.css` file is **distinct from** `line-core/styles/*` (which is the shadow-DOM internal reset suite). PRD §9.9 + ARCHITECTURE §14.2 mandate this separation; the spec preserves it (see §6.D below).

**Decorative families that historically held colour values (`gradients`, `highlights`, `svg`) are structural-only in Phase 00.** Any colour reference inside these files MUST be a `var(--line-{hue}-{step})` token. CI lint (`scripts/lint-layers.mjs`) greps these three files for hex/rgb/hsl literals and fails the build on any match.

#### 6.C.3 `line-colors` — palette generation (C3, C4)

**Generator script:** `scripts/generate-palettes.mjs`.

**Signature (informal):**
```
generate-palettes.mjs --output packages/line-colors/src/
```

**Inputs (per hue `H` in `HUES`):**
- From `@radix-ui/colors`:
  - Light: `H`, `${H}A`, `${H}P3`, `${H}P3A` (TS hex/`color()` string objects, 12 keys each).
  - Dark:  `${H}Dark`, `${H}DarkA`, `${H}DarkP3`, `${H}DarkP3A` (same shape).
- From `line-schemas/contrast-table`: `PER_HUE_CONTRAST[H]` → `'#000' | '#fff'`.
- Hue name string `H`.

**Output per hue:** `packages/line-colors/src/{H}.css`. Concrete shape (per PRD §9.7):

```css
/* AUTO-GENERATED by scripts/generate-palettes.mjs — do not edit by hand */
:where(html) {
  /* Base steps (sRGB) — light-dark() over light + dark base scales */
  --line-{H}-1:  light-dark({H}.{H}1,        {H}Dark.{H}Dark1);
  --line-{H}-2:  light-dark({H}.{H}2,        {H}Dark.{H}Dark2);
  /* … through --line-{H}-12 */

  /* Alpha steps (sRGB) — light-dark() over alpha light + alpha dark */
  --line-{H}-a1: light-dark({H}A.{H}A1,      {H}DarkA.{H}DarkA1);
  /* … through --line-{H}-a12 */

  /* Contrast (static single value per hue, NOT light-dark()) */
  --line-{H}-contrast: {PER_HUE_CONTRAST[H]};
}

/* Wide-gamut P3 override — same token names, automatic upgrade */
@supports (color: color(display-p3 1 1 1)) {
  @media (color-gamut: p3) {
    :where(html) {
      --line-{H}-1:  light-dark({H}P3.{H}P31,    {H}DarkP3.{H}DarkP31);
      /* … through --line-{H}-12 */
      --line-{H}-a1: light-dark({H}P3A.{H}P3A1,  {H}DarkP3A.{H}DarkP3A1);
      /* … through --line-{H}-a12 */
    }
  }
}
```

(The `{…}` placeholders above are pseudocode for the actual hex / `color()` strings the script substitutes.)

**Output for special scales:** `packages/line-colors/src/special.css`:
- `blackA` → `--line-black-a{1..12}` (sRGB), upgraded to `blackP3A` inside the `@supports` block.
- `whiteA` → `--line-white-a{1..12}` (sRGB), upgraded to `whiteP3A` inside the `@supports` block.

Light/dark are not relevant for the alpha-on-black or alpha-on-white scales — `blackA` is identical in both modes. The generator emits them outside `light-dark()`.

**Output barrel:** `packages/line-colors/src/index.css` = `@import` of all 31 hue files + `special.css`.

**Regeneration policy.** Generated CSS is **committed**. The script runs only when:
- `@radix-ui/colors` is bumped (the version pin in `package.json` changes), OR
- `PER_HUE_CONTRAST` is intentionally edited.

A CI check (`scripts/verify-palettes-fresh.mjs`) runs the generator into a temp dir on every PR and `diff`s against the committed `dist/` outputs — failing if drift is detected.

**Contrast validation (C10):** `scripts/validate-contrast.mjs` computes the WCAG AA contrast ratio for each (`H`, step 9, `PER_HUE_CONTRAST[H]`) triple in both light and dark mode, using the WCAG 2.1 luminance formula. The script:
- Loads the hex values directly from `@radix-ui/colors` (base scales — P3 variants are not contrast-validated because P3 is a colour-space upgrade, not a luminance change).
- For each hue × {light, dark}: requires ratio ≥ 4.5:1 (AA for normal text).
- Fails the build on any violation, printing the failing hue + ratio.

The script is run in CI on every PR and as part of `bun run build` for `line-colors`.

#### 6.C.4 `line-themes` — role mappings, semantics, aliases, defaults (C5, C6)

**Generator script:** `scripts/generate-role-maps.mjs`.

**Signature (informal):**
```
generate-role-maps.mjs --output packages/line-themes/src/
```

**Inputs:**
- `HUES` from `line-schemas` — for the 31 `accent/{hue}.css` files.
- `GRAY_HUES` from `line-schemas` — for the 6 `gray/{hue}.css` files.
- `AUTO_PAIR_TABLE` (constant declared inside the script, mirroring PRD §9.5):
  ```ts
  const AUTO_PAIR_TABLE: Record<Hue, GrayHue> = {
    // grayscales self-pair
    gray: 'gray', mauve: 'mauve', slate: 'slate', sage: 'sage', olive: 'olive', sand: 'sand',
    // saturated → curated pair
    tomato: 'mauve', red: 'mauve', ruby: 'mauve', crimson: 'mauve',
    pink: 'mauve', plum: 'mauve', purple: 'mauve',
    violet: 'slate', iris: 'slate', indigo: 'slate', blue: 'slate', sky: 'slate', cyan: 'slate',
    teal: 'sage', jade: 'sage', mint: 'sage', green: 'sage',
    grass: 'olive', lime: 'olive',
    bronze: 'sand', gold: 'sand', brown: 'sand',
    amber: 'sand', yellow: 'sand', orange: 'sand',
  };
  ```

**Outputs:**

`packages/line-themes/src/accent/{H}.css` (one per hue, 31 files):

```css
/* AUTO-GENERATED */
:where([data-accent="{H}"]) {
  --line-accent-1:  var(--line-{H}-1);
  /* … through --line-accent-12 */
  --line-accent-a1: var(--line-{H}-a1);
  /* … through --line-accent-a12 */
  --line-accent-contrast: var(--line-{H}-contrast);
}
```

`packages/line-themes/src/gray/{G}.css` (one per gray hue, 6 files):

```css
:where([data-gray="{G}"]) {
  --line-gray-1:  var(--line-{G}-1);
  /* … through --line-gray-12 */
  --line-gray-a1: var(--line-{G}-a1);
  /* … through --line-gray-a12 */
  --line-gray-contrast: var(--line-{G}-contrast);
}
```

`packages/line-themes/src/defaults.css` (hand-authored, regenerated only on table change):

```css
/* Default accent when no [data-accent] is set */
:where(html:not([data-accent])) {
  --line-accent-1:  var(--line-indigo-1);
  /* … through 12 + a1..a12 + contrast */
}

/* Auto-pair: explicit accent without explicit gray → curated pair */
:where([data-accent="tomato"]:not([data-gray])) {
  --line-gray-1: var(--line-mauve-1);
  /* … through 12 + a1..a12 + contrast */
}
/* … one block per accent hue, using AUTO_PAIR_TABLE */

/* Default gray when no [data-accent] AND no [data-gray] */
:where(html:not([data-accent]):not([data-gray])) {
  --line-gray-1: var(--line-slate-1);
  /* … */
}
```

`packages/line-themes/src/semantics.css` (hand-authored, fixed):

```css
/* Semantic roles — fixed at root, not swappable per theme */
:where(html) {
  /* success → green */
  --line-success-1:  var(--line-green-1);
  /* … 12 + a1..a12 + contrast */
  /* warning → amber */
  --line-warning-1:  var(--line-amber-1);
  /* … */
  /* danger → red */
  --line-danger-1:   var(--line-red-1);
  /* … */
  /* info → blue */
  --line-info-1:     var(--line-blue-1);
  /* … */
}
```

`packages/line-themes/src/aliases.css` (hand-authored, fixed — 9 aliases × 6 roles = 54 vars):

```css
:where(html) {
  /* accent aliases */
  --line-accent-surface:      var(--line-accent-2);
  --line-accent-bg:           var(--line-accent-3);
  --line-accent-bg-hover:     var(--line-accent-4);
  --line-accent-bg-active:    var(--line-accent-5);
  --line-accent-border:       var(--line-accent-7);
  --line-accent-solid:        var(--line-accent-9);
  --line-accent-solid-hover:  var(--line-accent-10);
  --line-accent-text-low:     var(--line-accent-11);
  --line-accent-text:         var(--line-accent-12);
  /* gray, success, warning, danger, info — same 9 aliases each */
}
```

`packages/line-themes/src/index.css`:

```css
@import './semantics.css';
@import './defaults.css';
/* All accent files */
@import './accent/amber.css'; /* … 31 imports */
/* All gray files */
@import './gray/gray.css';    /* … 6 imports */
@import './aliases.css';
```

**Auto-pair selector behaviour (C6.b):** the selector `:where([data-accent="X"]:not([data-gray]))` matches any element with `data-accent="X"` and no `data-gray`, **including nested elements**. CSS snapshot tests verify that a nested `<section data-accent="violet">` inside `<html data-accent="indigo" data-gray="slate">` correctly switches its gray role to `slate` (violet's auto-pair).

#### 6.C.5 `line-utils` — helpers (C7)

`packages/line-utils/src/`:

```
src/
├── index.ts
├── contrast.ts     # WCAG luminance + contrast ratio (shared with scripts/validate-contrast.mjs)
└── mix.ts          # color-mix() string builder helpers
```

Pure TS. Consumed by `scripts/validate-contrast.mjs` for build-time validation, and exposed at runtime for consumers who want programmatic contrast checks.

#### 6.C.6 PostCSS pipeline (C8)

`postcss.config.mjs` at the repo root:

```js
import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';
import postcssPresetEnv from 'postcss-preset-env';
import cssnano from 'cssnano';

export default {
  plugins: [
    postcssImport(),
    postcssNested(),
    postcssPresetEnv({
      stage: 2,
      features: {
        'custom-properties': false  // preserve --line-* declarations as-is
      },
      // Modern browser targets — keep modern features, drop polyfills
      browsers: 'last 2 chrome versions, last 2 firefox versions, last 2 safari versions'
    }),
    cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })
  ]
};
```

Plugin chain order is fixed: import → nested → preset-env → cssnano. `custom-properties: false` is **mandatory** — without it, preset-env will attempt to inline `--line-*` references and break the role-mapping cascade.

#### 6.C.7 CSS snapshot tests (C9)

Test stack: Bun test + minimal jsdom (for CSS string assertions only — no `ElementInternals`).

**Snapshot serializer.** Phase 00 uses **Bun test's built-in snapshot serializer** (`expect(...).toMatchSnapshot()` writing to `__snapshots__/*.snap` files). No custom serializer is configured — the default string-form serialization is sufficient for CSS string assertions, and the snapshot files are deterministic across machines because the inputs (committed generated CSS) are themselves byte-stable. If Phase 1 introduces non-string snapshot targets (e.g., DOM trees, custom-element render output) and the default serializer proves limiting, the serializer choice will be revisited then; Phase 00 does not pre-commit a swap path.

Tests live in `packages/line-themes/__tests__/`:

| Test | Asserts |
|---|---|
| `palette.snapshot.test.ts` | For each hue: `dist/{hue}.css` matches a committed snapshot in `__snapshots__/`. |
| `role-mapping.snapshot.test.ts` | For each hue × accent role: `dist/accent/{hue}.css` matches a snapshot. Same for gray. |
| `auto-pair.behaviour.test.ts` | Applies `data-accent`/`data-gray` combinations to a JSDOM tree, computes `getComputedStyle()`, asserts role variables resolve to the expected hue. Verified for: default (no attrs), explicit accent only (auto-pair), explicit accent + gray, nested scope override. |
| `schema.test.ts` | Zod validators reject invalid hue/role inputs; valid inputs match the generated CSS file existence. |

#### 6.C.8 Stream C deliverable summary

- 31 hue CSS files committed in `packages/line-colors/src/`.
- 1 `special.css` committed.
- 31 `accent/{hue}.css` + 6 `gray/{hue}.css` committed in `packages/line-themes/src/`.
- `semantics.css`, `aliases.css`, `defaults.css` hand-authored and committed.
- Generator scripts (`generate-palettes.mjs`, `generate-role-maps.mjs`) committed in `scripts/`.
- Contrast validator (`validate-contrast.mjs`) committed and wired to CI.
- All CSS snapshot tests pass on `bun test`.
- Per Manifesto Law 10: no `@websublime/line-themes` file imports anything outside `line-colors` + `line-schemas`; no `@websublime/line-colors` file imports anything outside `@radix-ui/colors`.

### 6.D Stream D — Base Class & Runtime Core

#### 6.D.1 `LineElement` (D1)

`packages/line-core/src/line-element.ts`:

```ts
import { LitElement } from 'lit';
import { InspectorMixin } from './mixins/inspector.js';
import { MetadataMixin } from './mixins/metadata.js';
import { DirectionMixin } from './mixins/direction.js';

export class LineElement extends DirectionMixin(MetadataMixin(InspectorMixin(LitElement))) {
  // Hook for sub-classes / mixins to declare reflected state, e.g. for CustomStateSet.
  protected reflectState(name: string, active: boolean): void { /* see §6.D.5 */ }
}
```

- **Does NOT** inject `commonReset` automatically (ARCHITECTURE §14.6 invariant — every component declares its resets explicitly).
- **Does NOT** include `FormAssociated` — that mixin is opt-in per component (`class LineInput extends FormAssociated(LineElement) {}`).
- Exposes a `LineElement.version` static string for the Inspector mixin to surface.

#### 6.D.2 Inspector mixin (D2)

`packages/line-core/src/mixins/inspector.ts`:

- Feature flag: reads `localStorage.getItem('line-ui:inspector')`. When set to `'on'`, activates inspector behaviours.
- Adds: hover outline (CSS via `:host(:hover[data-line-inspect])`), version display, docs link from metadata, parts/slot exposure via host attributes, optional metadata panel (`<dialog>` opened on **`Ctrl+Shift+L`** when hovering a host — on macOS the bind is `Cmd+Shift+L`). The `L` mnemonic is for `line://ui`. This bind avoids the browser DevTools shortcut (`Ctrl+Shift+I` / `Cmd+Opt+I`).
- No-op when the flag is unset — zero overhead in production.
- Backwards-compatible refactor of the current Inspector implementation; preserves existing API surface for current consumers.

#### 6.D.3 Metadata mixin (D3)

`packages/line-core/src/mixins/metadata.ts`:

- Static class members: `version`, `docs` (URL string), `qa` (`string[]` of tags), `scope` (string).
- Surfaces them via host attributes when inspector is active (`data-line-version`, `data-line-docs`, etc.).
- Type-safe: components extend with `static version = '0.1.0'` etc.

#### 6.D.4 Direction mixin (D4)

`packages/line-core/src/mixins/direction.ts`:

- Reflects the document/computed `dir` attribute into a host property `dir` (`'ltr' | 'rtl'`).
- Observes via `MutationObserver` on `documentElement` only — components don't observe themselves (Lit's reactivity already covers per-host attribute changes).
- Exposes `this.dir` to Lit templates and `:host([dir="rtl"])` selectors.

#### 6.D.5 FormAssociated mixin (D5)

`packages/line-core/src/mixins/form-associated.ts`:

```ts
type Constructor<T = {}> = new (...args: any[]) => T;

export function FormAssociated<T extends Constructor<LineElement>>(Base: T) {
  return class FormAssociatedElement extends Base {
    static formAssociated = true as const;

    #internals: ElementInternals;

    constructor(...args: any[]) {
      super(...args);
      this.#internals = this.attachInternals();
    }

    // Public API surface
    setFormValue(value: File | string | FormData | null, state?: File | string | FormData | null): void {
      this.#internals.setFormValue(value, state);
    }

    setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void {
      this.#internals.setValidity(flags, message, anchor);
    }

    reportValidity(): boolean { return this.#internals.reportValidity(); }
    checkValidity(): boolean { return this.#internals.checkValidity(); }

    get form():    HTMLFormElement | null { return this.#internals.form; }
    get name():    string | null           { return this.getAttribute('name'); }
    get type():    string                  { return this.localName; }
    get validity():       ValidityState    { return this.#internals.validity; }
    get validationMessage(): string        { return this.#internals.validationMessage; }
    get willValidate():   boolean          { return this.#internals.willValidate; }

    // Reflected state via CustomStateSet (modern :state() pseudo-class)
    protected override reflectState(name: string, active: boolean): void {
      // Host data attribute
      if (active) this.dataset[name] = ''; else delete this.dataset[name];
      // CustomStateSet (Lit / browser-native modern path)
      if (this.#internals.states) {
        if (active) this.#internals.states.add(name);
        else        this.#internals.states.delete(name);
      }
    }

    // Form lifecycle callbacks (per HTML spec) — sub-classes override
    formAssociatedCallback?(form: HTMLFormElement | null): void;
    formDisabledCallback?(disabled: boolean): void;
    formResetCallback?(): void;
    formStateRestoreCallback?(state: File | string | FormData | null, reason: 'autocomplete' | 'restore'): void;
  };
}
```

**Test stratification (research-mandated, R8 + B20–B23):**

| Tier | Runner | Environment | Covers |
|---|---|---|---|
| Unit | `bun test` + happy-dom + **mocked `attachInternals`** | Node-side | The mixin calls `setFormValue` / `setValidity` / `reportValidity` with the right arguments. The mock is a small helper in `packages/line-core/__tests__/mocks/element-internals.ts` (≤ 40 LOC). |
| Browser | Playwright | Real Chromium/Firefox/WebKit | End-to-end: a test page mounts a stub `<line-form-test>` inside `<form>`, submits, asserts the request body (or `FormData` instance), exercises reset, exercises HTML5 validation reporting. |

Both tiers are mandatory acceptance criteria for Phase 00. Happy-dom and jsdom cannot exercise the real `ElementInternals` semantics (research C3 / R8 / B20–B22, issues still open).

#### 6.D.6 `LineMachineController` adapter (D6) — **load-bearing**

`packages/line-core/src/machine/line-machine-controller.ts`:

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { VanillaMachine } from '@zag-js/vanilla';
import type { MachineSchema } from '@zag-js/core';

export interface LineMachineControllerOptions<T extends MachineSchema> {
  /** Machine config built by the component (e.g. from createMachine(...) or a pre-built Zag machine). */
  machine: ConstructorParameters<typeof VanillaMachine<T>>[0];
  /** Initial props passed to VanillaMachine. */
  props?: ConstructorParameters<typeof VanillaMachine<T>>[1];
  /** When true, swallow start() errors and flip into fallback mode (Manifesto Law 9). Default: true. */
  staticFallbackOnFailure?: boolean;
}

export class LineMachineController<T extends MachineSchema> implements ReactiveController {
  #host: ReactiveControllerHost;
  #vanilla: VanillaMachine<T> | null = null;
  #unsubscribe: VoidFunction | null = null;
  #fallback = false;
  #options: LineMachineControllerOptions<T>;

  constructor(host: ReactiveControllerHost, options: LineMachineControllerOptions<T>) {
    this.#host = host;
    this.#options = options;
    host.addController(this);
  }

  get state()    { return this.#vanilla?.state; }
  get context()  { return this.#vanilla?.context; }
  get refs()     { return this.#vanilla?.refs; }
  get service()  { return this.#vanilla?.service; }
  get fallback() { return this.#fallback; }

  send(event: Parameters<VanillaMachine<T>['send']>[0]) {
    if (this.#fallback || !this.#vanilla) return;
    this.#vanilla.send(event);
  }

  hostConnected(): void {
    try {
      this.#vanilla = new VanillaMachine(this.#options.machine, this.#options.props);
      this.#unsubscribe = this.#vanilla.subscribe(() => this.#host.requestUpdate());
      this.#vanilla.start();
    } catch (err) {
      if (this.#options.staticFallbackOnFailure !== false) {
        this.#fallback = true;
        // Surface to the inspector / console without throwing at the consumer
        console.error('[line://ui] Machine failed to start — rendering static fallback.', err);
        this.#host.requestUpdate();
      } else {
        throw err;
      }
    }
  }

  hostDisconnected(): void {
    try { this.#unsubscribe?.(); } finally { this.#unsubscribe = null; }
    try { this.#vanilla?.stop(); } finally { this.#vanilla = null; }
  }
}
```

`packages/line-core/src/machine/index.ts`:

```ts
// Public re-exports — single import surface for component authors.
export { LineMachineController } from './line-machine-controller.js';
export type { LineMachineControllerOptions } from './line-machine-controller.js';
// The four PUBLIC primitives of @zag-js/vanilla (per round-2 research):
export {
  VanillaMachine,
  normalizeProps,
  spreadProps,
  mergeProps,
  type Attrs,
} from '@zag-js/vanilla';
```

**`bindable` is NOT re-exported.** Per round-2 research (C4), `@zag-js/vanilla`'s public `index.ts` exports exactly four names; `bindable` is a private internal helper. Components access `bindable` only via the Zag-provided `context({ bindable })` callback argument inside machine configs — never via import.

**Components MUST NOT import `@zag-js/vanilla` directly.** A Biome lint rule (configured in `biome.json` `linter.rules.style.noRestrictedImports`) bans the path for all packages except `line-core`:

```jsonc
"noRestrictedImports": {
  "level": "error",
  "options": {
    "paths": {
      "@zag-js/vanilla": "Import LineMachineController from '@websublime/line-core/machine' instead."
    }
  }
}
```

The rule is disabled inside `packages/line-core/` (the only place the direct import is valid).

**Failure mode (Manifesto Law 9).** The controller catches `start()` failures, flips `fallback = true`, calls `host.requestUpdate()`, and logs to `console.error`. Component templates check `this.#ctrl.fallback` and render a static degraded state. **No uncaught error propagates to the consumer.**

#### 6.D.7 Shadow-DOM modular reset sheets (D7)

`packages/line-core/src/styles/`:

```
styles/
├── index.ts             # exports 11 singleton CSSStyleSheet objects
├── reset.common.css
├── reset.input.css
├── reset.button.css
├── reset.textarea.css
├── reset.select.css
├── reset.range.css
├── reset.progress.css
├── reset.summary.css
├── reset.fieldset.css
├── reset.table.css
└── reset.scrollbar.css
```

`index.ts` uses Vite's `?inline` CSS import + `CSSStyleSheet.replaceSync` to build singleton sheet objects, per ARCHITECTURE §14.5 verbatim:

```ts
import commonCSS from './reset.common.css?inline';
// … 10 more
function createSheet(css: string): CSSStyleSheet {
  const s = new CSSStyleSheet();
  s.replaceSync(css);
  return s;
}
export const commonReset = createSheet(commonCSS);
// … 10 more named exports
```

Contents of each sheet are mandated by ARCHITECTURE §14.4 verbatim. Phase 00 ships **all 11 sheets** even though no component consumes them yet — they are part of the platform contract that Phase 1 will exercise.

**No consumer-facing export.** These sheets are consumed only by components inside the monorepo. The light-DOM consumer reset is the separate file at `@websublime/line-tokens/reset` (ARCHITECTURE §14.2 / PRD §9.9).

#### 6.D.8 Integration test — hello-world component

Per plan §7.3, a private (not-published) hello-world component is built using `LineElement` end-to-end:

```
packages/line-core/__tests__/integration/hello-world/
├── line-hello-world.ts        # uses LineElement + LineMachineController with a trivial machine
├── line-hello-world.test.ts   # bun test — mounts via @open-wc/testing-helpers fixture
└── line-hello-world.e2e.ts    # Playwright — renders in a real browser, asserts state transition
```

This is the canonical "the platform works" smoke test. It does not ship in any package's `dist/`.

### 6.E Stream E — Icon Registry

#### 6.E.1 Resolver contract (E1)

`packages/line-icons/src/index.ts`:

```ts
export type IconResolver = (name: string, options?: IconResolverOptions) => Promise<string | SVGElement>;

export interface IconResolverOptions {
  /** Library-specific options, e.g. Phosphor weight. Untyped at the registry level. */
  [key: string]: unknown;
}

export class IconRegistry {
  #resolvers = new Map<string, IconResolver>();

  register(library: string, resolver: IconResolver): void {
    this.#resolvers.set(library, resolver);
  }

  has(library: string): boolean { return this.#resolvers.has(library); }

  async resolve(library: string, name: string, options?: IconResolverOptions): Promise<string | SVGElement> {
    const resolver = this.#resolvers.get(library);
    if (!resolver) throw new Error(`[line-icons] No resolver registered for library "${library}".`);
    return resolver(name, options);
  }
}

export const iconRegistry = new IconRegistry();   // shared singleton convenience

// Reference resolver factories — validate the contract against two real libraries
export { createLucideResolver }   from './resolvers/lucide.js';
export { createPhosphorResolver } from './resolvers/phosphor.js';
```

#### 6.E.2 Reference resolvers (E1 — Lucide + Phosphor)

`packages/line-icons/src/resolvers/lucide.ts`:

```ts
// Lucide: one SVG per icon, ESM tree-shakeable
import type { IconResolver } from '../index.js';

export function createLucideResolver(): IconResolver {
  return async (name) => {
    const mod = await import(/* @vite-ignore */ `lucide-static/icons/${name}.svg?raw`);
    return mod.default as string;
  };
}
```

`packages/line-icons/src/resolvers/phosphor.ts`:

```ts
// Phosphor: one SVG per (weight, icon) file
import type { IconResolver, IconResolverOptions } from '../index.js';

type PhosphorWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

export function createPhosphorResolver(defaults: { weight?: PhosphorWeight } = {}): IconResolver {
  return async (name, options) => {
    const weight = (options?.weight as PhosphorWeight) ?? defaults.weight ?? 'regular';
    const mod = await import(/* @vite-ignore */ `@phosphor-icons/core/assets/${weight}/${name}.svg?raw`);
    return mod.default as string;
  };
}
```

The two resolvers have **different shapes** (Lucide: single argument; Phosphor: takes a `weight`). The registry contract intentionally accepts an opaque `options` bag so the resolver chooses what to consume. This pressure-tests the contract: research R16 / B19 mandates two-library validation precisely to prove the registry is genuinely agnostic.

#### 6.E.3 Validation tests

`packages/line-icons/__tests__/`:

- `registry.test.ts` — Bun test: registers both resolvers, resolves three icons from each, asserts the resolver was called with the correct arguments and the SVG string was returned.
- `resolvers.lucide.test.ts` — exercises the Lucide resolver against the installed `lucide-static` package (no network).
- `resolvers.phosphor.test.ts` — same for `@phosphor-icons/core`, including weight selection.

The Phase 00 deliverable is the **contract**, not a full icon component. `<line-icon>` ships in Phase 1.

### 6.F Stream F — Build, Test, Release Infrastructure

#### 6.F.1 Storybook 10+ (F1)

`apps/storybook/`:

```
storybook/
├── package.json                # private; depends on all design-system packages
├── .storybook/
│   ├── main.ts                 # framework: @storybook/web-components-vite
│   ├── preview.ts              # global decorators + theming attributes
│   └── manager.ts              # branding (Phase 00: minimal)
├── stories/
│   ├── getting-started.mdx
│   ├── theming.mdx
│   ├── customisation.mdx
│   └── design-system/
│       ├── palettes.stories.ts # renders each hue swatch grid
│       └── roles.stories.ts    # renders each role × accent/gray combo
└── customElements.json         # generated by CEM analyser (Phase 1 onwards has component entries)
```

`.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  framework: { name: '@storybook/web-components-vite', options: {} },
  stories: ['../stories/**/*.@(mdx|stories.@(ts|js))'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-themes'        // toolbar switcher for data-accent / data-gray previews
  ],
  staticDirs: ['../public'],
  docs: { autodocs: 'tag' },
  viteFinal: async (cfg) => {
    // CEM consumed automatically when customElements.json is present at the project root.
    return cfg;
  }
};
export default config;
```

**`@storybook/addon-themes`** is wired via `.storybook/preview.ts` `withThemeByDataAttribute` decorators (one for `data-accent`, one for `data-gray`). This surfaces toolbar dropdowns that toggle the attributes on the preview root (`<html>` proxy element Storybook injects), letting authors visually verify any combination of the 31 accents × 6 grays without writing per-combination stories. This is aligned with the design system's attribute-based theming model (PRD §9.5).

**CEM analyser config — root-only.** A single `custom-elements-manifest.config.mjs` lives at the **repo root** (not per-package). It declares Lit plugin + globs `packages/*/src/**/*.ts`. Per-package CEM configs were considered and rejected as unnecessary overhead for Phase 00 (no components ship) and Phase 1 (Storybook consumes a single unified manifest anyway). Phase 00 produces an empty manifest; Phase 1 starts populating it. The wiring is verified by running `bun run analyze` (CEM CLI) in CI and asserting the manifest file is written.

#### 6.F.2 Vite 8+ component build (F1 cont.)

`vite.config.shared.mjs` (consumed by `line-core` and `line-components`):

```js
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default function shared(pkg) {
  return defineConfig({
    build: {
      target: 'es2022',
      lib: {
        entry: pkg.entries,                   // per-package entry map
        formats: ['es']
      },
      rollupOptions: {                        // Rolldown reads Rollup-shaped config
        external: [/^lit/, /^@zag-js\//]
      },
      sourcemap: true
    },
    plugins: [dts({ outDir: 'dist', tsconfigPath: './tsconfig.json' })]
  });
}
```

No special Rolldown flags are needed — Vite 8 wires it transparently. Library mode is the documented happy path (per Vite 8 announcement).

#### 6.F.3 Bun test + `@open-wc/testing-helpers` (F2)

`bun-test-preload.ts` (research R11 / R2-round1 workaround — a small preload that registers happy-dom globally and wires `@open-wc/testing-helpers` `fixtureCleanup` into Bun's `afterEach`):

```ts
import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register();
import { afterEach } from 'bun:test';
import { fixtureCleanup } from '@open-wc/testing-helpers/index-no-side-effects.js';
afterEach(fixtureCleanup);
```

Wired via `bunfig.toml`:

```toml
[test]
preload = ["./bun-test-preload.ts"]
```

This satisfies the R11 documented constraint (auto-cleanup side-effect silently no-ops under `bun:test` because Mocha-style globals aren't on `window`). **R11 stop gate does NOT fire** — per round-1 research, this is documentable, not incompatibility.

#### 6.F.4 Playwright (F2 cont.)

`playwright.config.ts` at repo root:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './packages',
  testMatch: '**/*.e2e.ts',
  use: { trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } }
  ],
  reporter: [['html', { open: 'never' }], ['github']]
});
```

Playwright runs:
- The hello-world component E2E (§6.D.8).
- The FormAssociated browser tier (§6.D.5).
- **Smoke page-render checks only** for Storybook (getting-started + theming + customisation MDX pages load without console errors; palette/role design-system stories render). Phase 00 does **not** capture per-pixel visual-regression baselines (`toHaveScreenshot()` is not invoked). Full visual-regression infrastructure — baseline storage, per-browser diffs, update workflow — is deferred to Phase 1, aligned with PRD §5.2.1 J2 contract (no per-component visual baselines until components ship).

`bunx playwright install --with-deps` runs in CI before the Playwright step.

#### 6.F.5 GitHub Actions (F3, F4)

`.github/workflows/checks.yml` — runs on every PR:

```yaml
name: checks
on: [pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version-file: .bun-version }
      - run: bun install --frozen-lockfile
      - run: bun run lint                        # biome check
      - run: bun --filter '@websublime/*' typecheck
      - run: bun --filter '@websublime/*' build
      - run: bun run scripts/lint-layers.mjs      # downward-only enforcement
      - run: bun run scripts/verify-palettes-fresh.mjs
      - run: bun run scripts/validate-contrast.mjs
      - run: bun test                             # unit tier
      - run: bunx playwright install --with-deps chromium firefox webkit
      - run: bun run e2e                          # browser tier
      - run: bun --filter '@websublime/line-storybook' build
      - run: bun --filter '@websublime/line-storybook' run analyze  # CEM
```

`.github/workflows/release.yml` — runs on push to `main`:

```yaml
name: release
on:
  push: { branches: [main] }
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions: { contents: write, pull-requests: write, id-token: write }
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version-file: .bun-version }
      - run: bun install --frozen-lockfile
      - run: bun --filter '@websublime/*' build
      - uses: changesets/action@v1
        with:
          publish: bun run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

`.github/workflows/snapshot-version.yml` and `snapshot-deploy.yml` — pre-existing repo scripts (`snapshot:version`, `snapshot:publish`) wired into manual-dispatch / `next`-branch flows. RC pipeline = pushes to `next` → automatic snapshot publish with `--tag canary`.

`.github/workflows/deploy-site.yml`:

```yaml
name: deploy-site
on: { push: { branches: [main], paths: ['apps/site/**'] } }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun --filter '@websublime/line-site' build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/site/dist --project-name=line-ui
```

`.github/workflows/deploy-storybook.yml`:

```yaml
name: deploy-storybook
on: { push: { branches: [main], paths: ['apps/storybook/**', 'packages/**'] } }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun --filter '@websublime/line-storybook' build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/storybook/storybook-static --project-name=line-ui-storybook
```

Storybook 10's static build output is `storybook-static/` by default (unchanged convention since Storybook 6.x). The `apps/storybook/package.json` `build` script invokes the standard `storybook build` CLI — see §6.F.1 for Storybook configuration.

#### 6.F.6 `apps/site` scaffold (F5)

`apps/site/`:

```
site/
├── package.json          # private; "astro": "^5.x"
├── astro.config.mjs
├── wrangler.toml          # Cloudflare Pages config
├── src/
│   └── pages/
│       └── index.astro    # placeholder: "line://ui — coming soon"
└── public/
    └── favicon.svg
```

CI deploy verified end-to-end by merging the scaffold and confirming the Cloudflare Pages URL serves the placeholder. Full landing content is Phase 1.

### 6.G Stream G — Documentation

All Phase 00 docs ship as Storybook MDX (one canonical home — no duplicate Markdown copies).

#### 6.G.1 Getting Started (G1) — `apps/storybook/stories/getting-started.mdx`

Sections:
1. Install — `bun add @websublime/line-tokens @websublime/line-colors @websublime/line-themes` (full design system minimal); note CDN unavailable in Phase 00.
2. Setup — single CSS `@import` chain showing the minimal-consumer block from PRD §9.9.
3. Hello world — a single `<div>` styled with role variables (`var(--line-accent-solid)` etc.), demonstrating attribute-based theming via `data-accent`.
4. What's next — pointer to Theming + Customisation guides.

#### 6.G.2 Theming (G2) — `apps/storybook/stories/theming.mdx`

Sections:
1. Attribute-based theming — `data-accent`, `data-gray`, scoping nests.
2. Hue catalogue — all 31 hues with live swatch grid (auto-rendered from `HUES`).
3. Auto-pairing — table + interactive demo of `[data-accent="X"]:not([data-gray])`.
4. Light/dark — `light-dark()` + `color-scheme` programmatic switch.
5. Semantic roles — fixed `success`/`warning`/`danger`/`info`.
6. Named aliases — the 9 aliases × 6 roles table.

#### 6.G.3 Customisation (G3) — `apps/storybook/stories/customisation.mdx`

Sections:
1. `::part()` — note that Phase 00 has zero components; the doc explains the contract and shows a hand-rolled example consuming the upcoming Phase 1 surface.
2. Custom properties — Tier 1 (global) → Tier 2 (component) → Tier 3 (consumer) cascade (PRD §9.11).
3. Component tokens — naming convention `--line-{component}-{prop}`.
4. Cascade strategy — `:where()` zero-specificity rule, Shadow DOM isolation, `@layer` not needed.

#### 6.G.4 Templates & analyses (G4, G5)

- `docs/specs/COMPONENT-SPEC-TEMPLATE.md` — empty template with required sections (Overview, Anatomy, States, Slots, Parts, Props, Events, A11y, Tests, Open Questions). Hand-authored.
- `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` — table per component family comparing line://ui vs Shoelace / Spectrum / Lion / FAST / Radix / Bits / Ark. Phase 00 ships the **skeleton** (the table headers + one filled row as worked example); per-component fills happen at each Phase 1+ component spec.

### 6.H Stream H — HTMX Spike

#### 6.H.1 `LineHtmxElement` (H1)

`packages/line-core/__experimental__/htmx/`:

```
htmx/
├── line-htmx-element.ts       # mixin / base class extending LineElement
├── README.md                  # outcome record (committed vs exploratory)
└── example/
    ├── index.html             # consumer page
    ├── server.ts              # tiny Bun server returning HTML fragments
    └── line-htmx-counter.ts   # worked example component
```

This package directory is **not exported** — `__experimental__` is excluded from build and from `exports`. The spike is internal evidence only.

`LineHtmxElement` mixin behaviour (per round-1 R15 + the project brief):

```ts
import { LineElement } from '../../line-element.js';
declare const htmx: any;

export function HtmxElement<T extends Constructor<LineElement>>(Base: T) {
  return class HtmxLineElement extends Base {
    override connectedCallback() {
      super.connectedCallback();
      // 1) Process shadow DOM — HTMX does NOT cross shadow boundaries by default.
      if (this.shadowRoot && typeof htmx?.process === 'function') {
        htmx.process(this.shadowRoot);
      }
      // 2) Listen for swap completion and re-process the shadow root.
      this.addEventListener('htmx:afterSettle', () => {
        if (this.shadowRoot) htmx.process(this.shadowRoot);
      });
    }
  };
}
```

The example component (`line-htmx-counter.ts`) inside `example/`:
- Uses `hx-post="/inc"` inside its shadow root.
- Uses the `host:` / `global:` selector escapes for `hx-target` (per HTMX docs, mandatory for shadow DOM).
- Demonstrates that `htmx.process(this.shadowRoot)` makes the attributes live.
- The server endpoint (`server.ts`) is a 30-line Bun server returning a fragment that swaps into the shadow root.

#### 6.H.2 Spike deliverable

The Phase 00 retrospective records the outcome in `docs/retrospective/00-phase-00-retro.md`. **Ada (architect) authors the retrospective entry** based on the spike's evidence (logs, screenshots, the runnable example's behaviour). Rationale: same as round-1 reporting — the agent that observed the spike result is best positioned to document the outcome and the design implications for Phase 1. Two valid exits per plan §2.8:

- **Committed.** The example runs end-to-end; `LineHtmxElement` is added to Phase 1 spec scope; the experimental folder graduates to `packages/line-core/src/htmx/` and gains a `./htmx` subpath export.
- **Exploratory.** The example surfaces blockers; `LineHtmxElement` is documented as deferred / nice-to-have post-1.0; the experimental folder stays where it is (kept for reference, not built).

The decision is genuine — the spec does not pre-commit either outcome.

---

## 7. Cross-Cutting Concerns

### 7.1 TypeScript configuration

`tsconfig.base.json` (root):

```jsonc
{
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noUnusedParameters": true,
    "noUnusedLocals": true,
    "useDefineForClassFields": false,   // Lit 3 + decorators
    "experimentalDecorators": true,     // Lit 3 decorators
    "emitDecoratorMetadata": false,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "importHelpers": true
  }
}
```

Notes on the base config:

- `importHelpers: true` requires `tslib` to be installed as a root devDependency of the monorepo (added to the §6.A.3 dependency set). All packages inherit the flag and resolve `tslib` through workspace hoisting.
- `emitDeclarationOnly` is intentionally **absent** from the base. No package in §6.B needs declaration-only emit; the three `tsc -b` packages (`line-schemas`, `line-utils`, `line-icons`) require JS emit alongside `.d.ts`. Setting it in the base would silently break their builds.
- `esModuleInterop` is intentionally **absent**. `verbatimModuleSyntax: true` enforces explicit `import type` / value-import discipline, which makes interop shimming unnecessary and would otherwise mask invalid import shapes.
- `noUnusedParameters` and `noUnusedLocals` are kept in the TypeScript base **in addition to** Biome's equivalents. Biome runs in the editor and pre-commit hook; `tsc --noEmit` runs as an independent CI gate. The redundancy is deliberate — it preserves `tsc --noEmit` as a defense-in-depth signal that does not depend on Biome being green.

Per-package `tsconfig.json` `extends` this base and sets `outDir`, `rootDir`, and `include`.

#### Per-package `tsconfig.json`

Every package's `tsconfig.json` extends `../../tsconfig.base.json` and sets the standard `outDir` / `rootDir` / `include` triple. Beyond that, each package layers in the overrides required by its build engine. The matrix below is normative — supervisors implementing §6.B must apply exactly these overrides:

| Package | Build engine | `tsconfig.json` beyond `outDir` / `rootDir` / `include` |
|---|---|---|
| `line-tokens` | PostCSS (CSS-only) | `"include": []` — tsconfig exists only for editor tooling |
| `line-colors` | PostCSS (CSS-only) | `"include": []` |
| `line-themes` | PostCSS (CSS-only) | `"include": []` |
| `line-schemas` | `tsc -b` | `"composite": true`, `"exclude": ["tests/**","dist/**"]` |
| `line-utils` | `tsc -b` | `"composite": true`, `"exclude": ["tests/**","dist/**"]`, `"references": [{ "path": "../line-schemas" }]` |
| `line-icons` | `tsc -b` | `"composite": true`, `"exclude": ["tests/**","dist/**"]` |
| `line-core` | `vite build` (+ `vite-plugin-dts`) | `"noEmit": true`, `"exclude": ["tests/**","dist/**"]` |
| `line-components` | `vite build` (+ `vite-plugin-dts`) | `"noEmit": true`, `"exclude": ["tests/**","dist/**"]` |

Two invariants govern this matrix:

- **`composite: true` is required** for any package referenced by another via `references`, and for every package built with `tsc -b`. `composite` implies that `include` must be explicit (no implicit `**/*` walk) — each `tsc -b` package therefore sets `include` to its `src/**/*` set.
- **The base config sets no `exclude`** on purpose. Each package owns its own `exclude` so that test folders and `dist/` outputs are scoped per package, not globally. CSS-only packages opt out entirely via `"include": []`.

### 7.2 Versioning + changesets

- Each published package is independently versioned via `@changesets/cli` (the existing config is already operational).
- Phase 00 ships `0.1.0` of every package (initial publish). Plan §7.1 of PRD anchors `0.1.0` to Phase 00 exit.
- Pre-1.0 breaking changes are permitted at minor bumps (PRD §7.1).
- No stable releases during Phase 00 — only RCs via the `next` branch + snapshot/canary tags.

### 7.3 CEM (Custom Elements Manifest)

- `@custom-elements-manifest/analyzer` v0.11 wired at the repo root (`custom-elements-manifest.config.mjs`).
- Phase 00 emits an empty manifest (no components). Wiring is verified in CI.
- Phase 1 onwards: components declare JSDoc → CEM extracts → Storybook consumes for argTypes.

### 7.4 Lint rules with semantic teeth

`biome.json` adds (beyond Biome's defaults):

- `noRestrictedImports` — bans `@zag-js/vanilla` outside `packages/line-core/` (see §6.D.6).
- `useImportType` — enforce `import type` for type-only imports (helps tree-shaking and `verbatimModuleSyntax`).
- Custom path-based override: `packages/line-tokens/src/{gradients,highlights,svg}.css` MUST NOT contain literal hex/rgb/hsl values (enforced by `scripts/lint-layers.mjs` because Biome lacks a CSS value-pattern rule).

### 7.5 P3 wide-gamut strategy (research-confirmed)

Per round-2 R2: every `--line-{hue}-{step}` and `--line-{hue}-a{step}` token is declared twice — once in sRGB (`light-dark()` over base/alpha light + dark), once inside `@supports (color: color(display-p3 1 1 1)) and @media (color-gamut: p3)` using the P3 / P3-alpha scales. **Token names are identical** across both declarations. Browsers with P3 support auto-upgrade transparently. Consumers do not opt in.

Special scales (`blackA`/`whiteA`) follow the same pattern.

### 7.6 `light-dark()` strategy (research-confirmed)

Per round-1 R2: the entire 12-step base + alpha palette uses `light-dark()`. The `--line-{hue}-contrast` token is **static single value** per hue, NOT wrapped in `light-dark()`. `color-scheme` is the trigger; it inherits into shadow roots so components see the same mode as the host page.

---

## 8. Risks & Mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK1 | Vite 8 + Rolldown regression on library-mode CSS | Low | High | Rollback via `package.json` overrides to Vite 7 + Rollup. Runbook: `docs/runbooks/bundler-rollback.md`. Triggered only on confirmed regression. |
| RK2 | `bindable` referenced in a future Phase 1 component machine config and assumed importable | Medium | Low | Biome `noRestrictedImports` rule (§7.4) + an explicit ADR-style note in the `line-core/machine` README pointing to the `context({ bindable })` callback pattern. |
| RK3 | Generated palette CSS drift from `@radix-ui/colors` minor bumps | Low | High | `scripts/verify-palettes-fresh.mjs` re-runs the generator on every CI build and `diff`s the committed output. PR fails on drift. |
| RK4 | `happy-dom` + `ElementInternals` open issues (#1419) regress unit tier | Low | Medium | Tier 1 (unit) uses a mocked `ElementInternals` (≤ 40 LOC, declared inline in `__tests__/mocks/`). Tier 2 (Playwright) is the source of truth for behaviour. |
| RK5 | Auto-cleanup of `@open-wc/testing-helpers` fixtures (R11) silently no-ops without preload | High (default state) | Medium | `bun-test-preload.ts` (§6.F.3) registers `afterEach(fixtureCleanup)`. CI verifies the preload is in `bunfig.toml`. |
| RK6 | HTMX shadow-DOM crossing fails in a corner case the spike doesn't surface | Medium | Low | Spike is exploratory by design (P2). Per plan §2.8, "exploratory" is a valid exit. Runnable example committed regardless of outcome. |
| RK7 | Cross-layer leakage (e.g. `line-themes` accidentally imports `line-tokens`) | Low | High | `scripts/lint-layers.mjs` enforces allowed edges in CI; failing build on any violation. |
| RK8 | Cloudflare Pages deploy permissions misconfigured | Low | Low | First deploy verifies end-to-end before Phase 00 sign-off (per F5 acceptance). |
| RK9 | Storybook 10 + Vite 8 + CEM minor incompatibility | Low | Low | All three are research-confirmed compatible (round-2 B15, B16, B17). Spike-validate in F1 by booting Storybook with `bun dev` and confirming no startup errors. |
| RK10 | `bun:test` global cleanup hooks interact with Lit's reactive observers in surprising ways | Low | Low | `fixtureCleanup` removes wrapper nodes, which triggers `disconnectedCallback` chain on hosted components — that is the expected behaviour. Verified by the hello-world integration test. |
| RK11 | Scope creep — a component sneaks into `line-components` Phase 00 | Medium | High | Hard rule (PRD §3, plan §3): `line-components` ships empty. CI `bun --filter '@websublime/line-components' build` asserts `dist/index.js` is the zero-export module. |

---

## 9. Acceptance Criteria

Phase 00 is **complete** when **all** of the following hold. This mirrors plan §7 with spec-level concretisation.

### 9.1 Structural

- [ ] All 8 packages exist under `packages/` with `package.json`, `tsconfig.json`, `src/`, `README.md`.
- [ ] All 2 apps exist under `apps/`.
- [ ] Every `exports` map matches §4 exactly (string-for-string).
- [ ] `scripts/lint-layers.mjs` passes — no cross-layer leakage.
- [ ] `packages/line-components/dist/index.js` builds as a zero-export module (umbrella ships empty in Phase 00 per Manifesto Law 6); CI smoke build asserts this by re-loading the built module and verifying its export count is zero.
- [ ] Prefix audit (Manifesto Law 2, PRD §9.14 T1) passes: all CSS custom properties emitted by `line-tokens`/`line-colors`/`line-themes` are `--line-*` prefixed; all published package names match `@websublime/line-*`; all custom-element tag names registered in tests are `line-*`. Enforced by an audit step in `scripts/lint-layers.mjs` (or sibling).

### 9.2 Design System

- [ ] 31 hue CSS files committed under `packages/line-colors/src/` and present in `dist/` after `bun run build`.
- [ ] `special.css` committed and built.
- [ ] 31 `accent/*.css` + 6 `gray/*.css` files generated and committed under `packages/line-themes/src/`.
- [ ] `semantics.css`, `aliases.css`, `defaults.css` committed.
- [ ] `bun test` passes all CSS snapshot tests (palette, role mapping, auto-pair behaviour, schema).
- [ ] `scripts/validate-contrast.mjs` passes (31 hues × {light, dark} step-9 vs contrast token ≥ 4.5:1).
- [ ] `scripts/verify-palettes-fresh.mjs` passes (no drift between generator and committed CSS).
- [ ] `aliases.css` declares exactly **54 alias variables** (9 named aliases × 6 roles), verified by a count assertion in a snapshot or unit test (PRD §9.14 T7).
- [ ] Snapshot tests confirm role-mapping CSS uses `[data-accent='{hue}']` and `[data-gray='{hue}']` selectors only — no `[data-theme]` selector is emitted anywhere in `line-themes` output (PRD §9.14 T4).

### 9.3 Runtime Core

- [ ] `LineElement` operational with Inspector / Metadata / Direction mixins.
- [ ] `FormAssociated` mixin operational. Unit tier (`bun test` + mocked `ElementInternals`) and browser tier (Playwright against `<form>`) both pass.
- [ ] `LineMachineController` re-exports exactly four `@zag-js/vanilla` primitives (`VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`) + `LineMachineController` itself + the `Attrs` type. **No `bindable` export.**
- [ ] Manifesto Law 9 failure mode verified: a broken machine config flips `fallback = true` and does not throw at the consumer (unit test in `line-machine-controller.test.ts`).
- [ ] Hello-world integration test (§6.D.8) passes on `bun test` and Playwright.
- [ ] Biome `noRestrictedImports` rule prevents `@zag-js/vanilla` imports outside `line-core` (lint passes on the deliberate violation-free codebase; a smoke test introducing the violation locally is rejected by `bun run lint`).
- [ ] 11 modular reset sheets exist in `packages/line-core/src/styles/` and export singleton `CSSStyleSheet` objects.

### 9.4 Icon Registry

- [ ] `IconRegistry` class + `IconResolver` type exported from `@websublime/line-icons`.
- [ ] `createLucideResolver` + `createPhosphorResolver` factories exported and pass their respective tests.
- [ ] Registry resolves at least 3 icons from each library in tests.

### 9.5 Tooling

- [ ] Bun ≥ 1.3.14 declared in `engines.bun`. pnpm removed.
- [ ] Biome ≥ 2.4.15 operational; ESLint + Prettier + plugins removed.
- [ ] Vite ≥ 8.0.13 installed; Rolldown 1.0.x active (verified by checking Vite's `dependencies` post-install).
- [ ] All deps from §6.A/A3 at the declared minimum.
- [ ] `@websublime/*` npm scope verified by at least one snapshot/canary publish.
- [ ] Vite 8 + Rolldown library-mode smoke build runs in CI against a fixture entry (the `line-core` hello-world integration target qualifies) and produces a non-empty `dist/` bundle. Plan §7.2 `Vite/Rolldown component bundling operational (verified by a smoke build)` is satisfied by this check.

### 9.6 CI/CD

- [ ] `checks.yml` runs lint + typecheck + build + layer-lint + palette-freshness + contrast + unit + e2e + Storybook build + CEM analyse on every PR.
- [ ] `release.yml` runs Changesets publish on push to `main`.
- [ ] `snapshot-version.yml` + `snapshot-deploy.yml` operational for `next` branch.
- [ ] `deploy-site.yml` deploys `apps/site` to Cloudflare Pages on push to `main`.
- [ ] Storybook preview deploy verified end-to-end on push to `main` (`deploy-storybook.yml` → Cloudflare Pages `line-ui-storybook` project).
- [ ] `bunfig.toml` declares `[test] preload = ['./bun-test-preload.ts']` (RK5 mitigation for `@open-wc/testing-helpers` `fixtureCleanup` registration); CI asserts the preload entry is present in `bunfig.toml` (`checks.yml` step that greps or parses the file).
- [ ] At least one RC publish verified end-to-end.

### 9.7 Documentation

- [ ] Storybook 10 boots cleanly with `bun --filter '@websublime/line-storybook' dev`.
- [ ] `getting-started.mdx`, `theming.mdx`, `customisation.mdx` ship and render.
- [ ] Palette + roles design-system stories render all 31 hues and all role combos.
- [ ] `docs/specs/COMPONENT-SPEC-TEMPLATE.md` committed.
- [ ] `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` skeleton committed.

### 9.8 HTMX Spike

- [ ] `LineHtmxElement` mixin + runnable example committed under `packages/line-core/__experimental__/htmx/`.
- [ ] Outcome (committed vs exploratory) documented in `docs/retrospective/00-phase-00-retro.md` with evidence (screenshots / logs from the example).

### 9.9 Process

- [ ] All PRD §7.2 "Review pending" tasks verified.
- [ ] No stable releases — RCs only.
- [ ] Phase 00 retrospective committed.

---

## 10. Design Decisions Beyond Plan + Research

The following decisions were made during spec authoring and need user review before APPROVAL. They are flagged here per the "decisions beyond plan + research" reporting requirement.

### D1. Biome `noRestrictedImports` rule for `@zag-js/vanilla`

**Decision:** Add a Biome lint rule that blocks `import` from `@zag-js/vanilla` everywhere except `packages/line-core/`.

**Why:** PRD §6.2 + ARCHITECTURE §6 mandate that components consume only `@websublime/line-core/machine`. Without a build-time check, the rule is documentation-only. This is the minimal mechanical enforcement.

**Alternative considered:** rely on code review only. Rejected — Phase 1 will onboard many components and the rule should be programmatic.

### D2. `verify-palettes-fresh` CI script

**Decision:** Add `scripts/verify-palettes-fresh.mjs` that runs the palette generator into a temp dir on every PR and `diff`s against committed output, failing on drift.

**Why:** PRD §9.7 ("Generated CSS is committed; regenerate only on `@radix-ui/colors` bump") and plan §C3 are silent on enforcement. Without this script, a contributor could edit a hue CSS file by hand and the bug would only surface in production.

**Alternative considered:** rely on the `@radix-ui/colors` version-pin in `package.json` as the trigger. Rejected — it does not protect against hand-edits.

### D3. CSS snapshot test scope

**Decision:** Snapshot tests cover (a) per-hue palette CSS, (b) per-role mapping CSS, (c) auto-pair behaviour via JSDOM `getComputedStyle()`, (d) Zod schema parity. Not (e) end-to-end visual rendering — that defers to Phase 1 Playwright visual regression.

**Why:** Plan §C9 says "CSS snapshot tests"; the spec concretises the four categories. Phase 00 has no components to visually render, so visual regression is premature.

**Alternative considered:** add a minimal Storybook visual snapshot. Rejected — the design-system pages render swatches, which already serve as visual smoke; full visual regression infrastructure (Percy / Chromatic / Playwright `toHaveScreenshot`) is Phase 1.

### D4. P3 wide-gamut for special scales

**Decision:** `blackA` / `whiteA` are emitted **outside** `light-dark()` (single sRGB declaration), with the `blackP3A` / `whiteP3A` upgrade inside `@supports`. They do not need `light-dark()` because alpha-on-black and alpha-on-white are mode-invariant.

**Why:** Radix Colors ships these as four separate objects (`blackA`, `whiteA`, `blackP3A`, `whiteP3A`) without light/dark counterparts. Wrapping them in `light-dark()` would be wrong.

**Alternative considered:** wrap in `light-dark()` for consistency. Rejected — would inflate the file size and create a `light-dark(blackA, blackA)` pattern that conveys nothing.

### D5. Hello-world integration test location

**Decision:** Place under `packages/line-core/__tests__/integration/hello-world/` (not a separate package). The component is private and never published.

**Why:** Plan §7.3 mandates the hello-world as an integration test, not a separately published package. Co-locating with `line-core` keeps the test close to the API under test.

**Alternative considered:** create a private `packages/line-hello-world/` package. Rejected — adds workspace noise for a single test fixture.

### D6. HTMX spike location: `__experimental__/` (excluded from build)

**Decision:** Place the HTMX spike at `packages/line-core/__experimental__/htmx/`. The directory is excluded from `tsconfig.json` `include` and `vite.config` `entries`. Not in any `exports` map.

**Why:** Plan §H1 requires a runnable example; the spike must not bleed into the public surface. `__experimental__/` is a known idiom for "code that exists but is not built or published."

**Alternative considered:** keep it in a sibling `apps/htmx-spike/` workspace. Rejected — would imply ongoing maintenance. The spike is one-shot.

### D7. Site = Astro 5 + Cloudflare Pages via `wrangler-action`

**Decision:** Phase 00 `apps/site` uses Astro 5 with the Cloudflare adapter, deployed via `cloudflare/wrangler-action@v3`. Plan §F5 left the deploy mechanism unspecified.

**Why:** PRD §1.7 + plan §2.3 anchor Cloudflare Pages. `wrangler-action` is the first-party deploy path. No new Cloudflare integration is invented.

**Alternative considered:** use Cloudflare Pages' GitHub integration (no CI step needed). Rejected — keeps the deploy step in the same workflow as other CI work, which is easier to observe and revert.

### D8. Layer-lint as a Bun script (not a Biome rule)

**Decision:** `scripts/lint-layers.mjs` enforces downward-only dependencies and "no colour literals in decorative families." Run in CI as a separate step.

**Why:** Biome cannot express either rule natively (the first inspects `package.json` deps; the second is a CSS value pattern in three specific files). A custom script is the smallest mechanism.

**Alternative considered:** use a community Biome plugin / npm package. Rejected — those packages exist for ESLint, not Biome 2.x, and authoring our own is ~50 lines.

### D9. `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`

**Decision:** Enable both in `tsconfig.base.json`.

**Why:** Phase 00 establishes the type-safety floor for the whole project. Phase 1 components will benefit from strict guarantees on indexed lookups (palette tables, role maps) and optional fields (mixin props).

**Alternative considered:** defer to Phase 1. Rejected — retro-enabling strict mode is more expensive than starting strict.

### D10. PostCSS browser targets

**Decision:** `last 2 chrome versions, last 2 firefox versions, last 2 safari versions` (matches PRD §1.7).

**Why:** Aligns the PostCSS preset-env feature matrix with the project's stated browser support window. Avoids polyfilling features the targets support natively.

---

## 11. Open Questions

All seven questions raised during initial spec authoring were answered by the user on 2026-05-19. The answers have been integrated into the spec; the records below preserve the question, answer, and cross-reference for traceability.

### Q1. Do we adopt Cloudflare Pages or an alternative for `apps/site`?

**Status: Resolved (2026-05-19).** Confirm `cloudflare/wrangler-action@v3` — official, maintained, first-party deploy path. Already wired in §6.F.5 (`deploy-site.yml`) and rationalised in §10/D7. No further spec changes required by this answer.

### Q2. CSS snapshot serializer

**Status: Resolved (2026-05-19).** Use **Bun test's built-in snapshot serializer**. Phase 00 does not need a custom serializer; default string-form snapshots are sufficient for CSS string assertions. The choice can be revisited in Phase 1 if non-string snapshot targets emerge. Applied in §6.C.7.

### Q3. CEM analyser config — root-only or per-package?

**Status: Resolved (2026-05-19).** **Root-only** — a single `custom-elements-manifest.config.mjs` at the repo root, globbing `packages/*/src/**/*.ts`. Simpler, sufficient for Phase 00 (no components ship), and aligned with Phase 1's expected single-manifest consumption from Storybook. Applied in §6.F.1 and §7.3.

### Q4. Storybook addons beyond essentials + a11y

**Status: Resolved (2026-05-19).** Add **`@storybook/addon-themes`**. The toolbar switcher for `data-accent` / `data-gray` is genuinely useful and aligned with the design system's attribute-based theming model (PRD §9.5). Applied in §6.F.1 (`main.ts` addons array + preview decorator note) and added to the dependency list in §6.A/A3.

### Q5. Inspector hotkey

**Status: Resolved (2026-05-19).** Use **`Ctrl+Shift+L`** (macOS bind: `Cmd+Shift+L`) to avoid collision with the browser DevTools shortcut (`Ctrl+Shift+I` / `Cmd+Opt+I`). The `L` mnemonic stands for `line://ui`. Applied in §6.D.2.

### Q6. Playwright visual snapshots in Phase 00

**Status: Resolved (2026-05-19).** Phase 00 ships **smoke page-render checks only** — Storybook MDX pages load without console errors, palette/role stories render. Full visual-regression baselines (per-pixel `toHaveScreenshot()` storage, diff workflow, update process) are **deferred to Phase 1**, aligned with PRD §5.2.1 J2 contract and §10/D3. Applied in §6.F.4.

### Q7. HTMX spike — outcome owner

**Status: Resolved (2026-05-19).** **Ada (architect)** authors the retrospective entry in `docs/retrospective/00-phase-00-retro.md` based on the spike's evidence. Same rationale as round-1 reporting: the agent that observed the spike result is best positioned to document the outcome and Phase 1 implications. Applied in §6.H.2.

---

*End of spec.*
