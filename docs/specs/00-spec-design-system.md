# SPEC: Phase 00 — Design System Foundation

**Status:** APPROVED
**Author:** Ada (architect)
**Date:** 2026-05-19
**Phase target:** `line://ui` v0.1.0
**Source PRD:** [`/Users/ramosmig/Public/WS-Labs/line-ui/docs/PRD.md`](../PRD.md) (v0.8.7, APPROVED)
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
- Stable npm releases beyond `0.1.x`. Phase 00 ships `0.1.0` through the Version PR merge; later Phase 00 bumps follow the changeset rule in `docs/PROCESS.md` §6, so `0.2.0` is Phase 1 (AM-041).
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
  "files": ["dist"],                            // AM-036
  "repository": {                               // AM-038: trusted publishing + provenance match this url
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-tokens"
  },
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
  "files": ["dist"],                            // AM-036
  "repository": {                               // AM-038
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-colors"
  },
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
  "files": ["dist", "src"],                     // AM-036: maps in dist/ point at ../src
  "repository": {                               // AM-038
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-schemas"
  },
  "sideEffects": false,
  "exports": {
    ".": {
      "types":  "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./contrast-table": {
      "types":  "./dist/contrast-table.d.ts",
      "import": "./dist/contrast-table.js"
    }
  }
}
```

### 4.4 `@websublime/line-themes`

```jsonc
{
  "name": "@websublime/line-themes",
  "type": "module",
  "files": ["dist"],                            // AM-036
  "repository": {                               // AM-038
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-themes"
  },
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
  "files": ["dist", "src"],                     // AM-036: maps in dist/ point at ../src
  "repository": {                               // AM-038
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-utils"
  },
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
  "files": ["dist", "src"],                     // AM-036: maps in dist/ point at ../src
  "repository": {                               // AM-038
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-core"
  },
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
  "files": ["dist", "src"],                     // AM-036: maps in dist/ point at ../src
  "repository": {                               // AM-038
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-components"
  },
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
  "files": ["dist", "src"],                     // AM-036: maps in dist/ point at ../src
  "repository": {                               // AM-038
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-icons"
  },
  "sideEffects": false,
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  },
  "peerDependencies": { "lucide-static": "^1.16.0", "@phosphor-icons/core": "^2.1.1" },
  "peerDependenciesMeta": {
    "lucide-static": { "optional": true },
    "@phosphor-icons/core": { "optional": true }
  }
}
```

Surface in Phase 00: the `IconRegistry` class, the `IconResolver` type, and two reference adapter factories (`createLucideResolver`, `createPhosphorResolver`). Subpaths (`./registry`, `./resolvers/*`) are added in Phase 1.

Both icon libraries are optional peer dependencies, so a consumer installs only the library whose reference resolver it uses (AM-033). `line-icons` itself bundles zero icons (ARCHITECTURE §11). The root `devDependencies` keep both libraries because the §6.E.3 tests exercise both resolvers.

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

Root `package.json` `build` script is `"bun --filter './packages/*' build && bun --filter './apps/*' build"` (AM-029). Bun `--filter` orders scripts by `dependencies` only, and apps reference packages via `devDependencies` per §3, so apps build in a second phase after every package has finished.

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
  pathIgnorePatterns = ["temp/**"]
  ```
- Workspace install command: `bun install`. Workspace scripts: `bun --filter '@websublime/*' <script>`, except `build`, which is two-phase (see §5 / AM-029).

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
| `@happy-dom/global-registrator` | `^20.10.5` (devDependency) | required by §6.F.3 `bun-test-preload.ts` `GlobalRegistrator.register()`; Bun 1.3.14 compatible (AM-018) |
| `playwright` | `^1.60.0` | R12 |
| `@changesets/cli` | `^2.31.0` | R14 |
| `zod` | latest 3.x | trivial; consumed by `line-schemas` |
| `astro` | `^5.x` | trivial; consumed by `apps/site` |
| `lucide-static` | `^1.16.0` | R16 (icon validation); optional peer of `line-icons` (AM-033) |
| `@phosphor-icons/core` | `^2.1.1` | R16 (icon validation); optional peer of `line-icons` (AM-033) |

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
| AM-008 | 2026-05-29 | bead `line-ui-7qm.2.5` pre-implementation investigation | Dropped the `next` branch in favour of main-based RC / snapshot / canary publishing. Rewrote §6.E (~line 1376), §7.2 (~line 1599), and the §9.6 exit criterion (~line 1699) so the Stream F-authored snapshot/canary pipeline is driven by manual dispatch and/or push-to-`main` rather than a `next` branch, and annotated the §6.B B5 `baseBranch: "main"` config field accordingly. | The `next` branch was inherited from the legacy Vite-based setup and is no longer used; the user standardised on `main` for all RC / snapshot / canary publishing. Stream F workflow ownership is unchanged — F3 / F4 (§6.F.5) still author `release.yml` / `snapshot-version.yml` / `snapshot-deploy.yml`; only the branch semantics change. | Investigation logged in `bd comments line-ui-7qm.2.5`. |
| AM-009 | 2026-05-29 | bead `line-ui-7qm.2.5` pre-implementation investigation | Made `linked: []` explicit in the §6.B B5 config field list; confirmed packages are independently (non-linked) versioned, consistent with §7.2. | §7.2 already stated independent versioning in prose, but the B5 config field list omitted the `linked` field — making it explicit hardens the contract against drift. No behavioural change. | Investigation logged in `bd comments line-ui-7qm.2.5`. |
| AM-010 | 2026-06-02 | bead `line-ui-7qm.3.1` pre-implementation investigation | Added a `./contrast-table` subpath export to the §4.3 `@websublime/line-schemas` `exports` map (`"types": "./dist/contrast-table.d.ts"`, `"import": "./dist/contrast-table.js"`), alongside the existing `.` barrel. `"sideEffects": false` and the `.` barrel are unchanged; the build engine (tsc-composite per §7.1) is unchanged. | §4.3 declared a barrel-only exports map while §6.C.3 line 598 instructs the `line-colors` generator to import `PER_HUE_CONTRAST[H]` from `line-schemas/contrast-table` — a subpath that did not exist in §4.3, making the spec self-contradictory. The user chose to honor the literal §6.C.3 subpath rather than collapse line 598 to a barrel import. Because `line-schemas` is tsc-composite-built (§7.1 per-package matrix), each `src/*.ts` emits a matching `dist/*.js` + `.d.ts`, so `./dist/contrast-table.{js,d.ts}` resolves cleanly. This amendment makes §4.3 declare the subpath so the spec is internally consistent before C1 implements it; §6.C.3 line 598 needs no change. | Investigation + decision logged in `bd comments line-ui-7qm.3.1`. |
| AM-011 | 2026-06-03 | bead `line-ui-7qm.3.3` pre-implementation investigation | Corrected the §6.C.3 generator pseudocode Radix step-key access for the dark, P3, and dark-P3 base scales and the alpha scales (the light-alpha path `{H}A.{H}A1` was already correct and is unchanged): `{H}Dark.{H}Dark1`→`{H}Dark.{H}1`, `{H}DarkA.{H}DarkA1`→`{H}DarkA.{H}A1`, `{H}P3.{H}P31`→`{H}P3.{H}1`, `{H}DarkP3.{H}DarkP31`→`{H}DarkP3.{H}1`, `{H}P3A.{H}P3A1`→`{H}P3A.{H}A1`, `{H}DarkP3A.{H}DarkP3A1`→`{H}DarkP3A.{H}A1`. Added a clarifying note on Radix object-vs-step-key naming, including the `special.css` `blackP3A`/`whiteP3A` case. | The pseudocode suffixed the variant onto the **step** key (`{H}Dark.{H}Dark1`, `{H}P3.{H}P31`, `{H}P3A.{H}P3A1`, etc.), but `@radix-ui/colors@3.0.0` keys steps **without** the variant suffix — the scale object name carries the variant, base steps are keyed `{H}{n}`, alpha steps `{H}A{n}`. A literal transcription of the old notation indexes with a non-existent key and yields `undefined` for every dark / P3 / alpha value, producing silently-broken CSS such as `--line-{H}-1: light-dark(#fefdfb, )`. The output CSS contract (token names, `light-dark()` structure, `@supports`/`@media` P3 override block, committed-CSS shape) is unchanged; only the data-access notation was wrong. | Verified against `@radix-ui/colors@3.0.0` during pre-implementation investigation of `line-ui-7qm.3.3` (e.g. `amberDark.amber1 = "#16120c"`, `amberDark.amberDark1 = undefined`; `amberP3.amber1 = "color(display-p3 …)"`, `amberP3.amberP31 = undefined`; `blackP3A.blackA1 = "color(display-p3 0 0 0 / 0.05)"`). Full detail and verification output in `bd comments line-ui-7qm.3.3`. |
| AM-012 | 2026-06-03 | bead `line-ui-7qm.3.4` pre-implementation investigation | Corrected the §6.C.3 regeneration-policy sentence: the freshness guard `diff`s a fresh generator run against the committed **`src/`** outputs (`packages/line-colors/src/`), not `dist/`. Also made the §10/D2 decision wording explicit to "the committed `src/` output" to match. | The generator's `--output` default and all 33 committed generated CSS files live in `packages/line-colors/src/` (§6.C.3 signature); `dist/` is gitignored (`.gitignore` line 3) and is the postcss-import build artifact, not the generator output. A guard diffing a fresh run against `dist/` would compare against a different-shaped, untracked tree and never match. The output CSS contract, generator behaviour, and token names are unchanged — only the diff-baseline location wording was wrong. | Verified live during investigation of `line-ui-7qm.3.4`: `bun run scripts/generate-palettes.mjs --output $TMP` then `diff -rq packages/line-colors/src $TMP` → exit 0, 33 files each side. `.gitignore` line 3 = `dist`. Full detail in `bd comments line-ui-7qm.3.4`. |
| AM-013 | 2026-06-03 | bead `line-ui-7qm.3.4` pre-implementation investigation | Added a normative clarification note under §6.C.3 (after the regeneration-policy paragraph) defining the scope of the C4 bead AC `CI (checks.yml) includes palette-freshness step`: C4 ships and locally verifies the guard script; `.github/workflows/checks.yml` is owned by Stream F → F4 (`line-ui-7qm.6.4`) per §6.F.5 and must NOT be created by C4. | The bead AC references a CI workflow that does not exist at C4 time. `.github/workflows/` is absent and `checks.yml` is Stream F's deliverable (§6.F.5 already enumerates the `bun run scripts/verify-palettes-fresh.mjs` step). C4 is in Stream C and cannot assert a CI step it does not own. The verifiable C4 surface is the local guard behaviour (clean-pass / hand-edit-fail). This mirrors the AM-006 / AM-007 precedent that scoped analogous ACs for Stream B B4. | Drift surfaced by research agent during investigation of `line-ui-7qm.3.4`. Verified `.github/workflows/` absent; `checks.yml` owner = `line-ui-7qm.6.4` (F4) per §6.F.5 (the palette-freshness step is already in that pipeline). Precedent AM-006 / AM-007. Logged in `bd comments line-ui-7qm.3.4`. |
| AM-014 | 2026-06-12 | bead `line-ui-7qm.3.5` pre-implementation investigation | Corrected the §6.C.3 C10 contrast-validation threshold from ≥ 4.5:1 (WCAG AA normal text) to **≥ 3:1** (WCAG AA large text / non-text UI) and added a documented **allowlist** mechanism with exactly one entry: `orange`, both modes (`#f76b15` step 9 vs white contrast token = 2.97:1), warning instead of failing but failing if the recorded ratio regresses. Updated the §11 checklist line to match. Added a C5 AC-scope note under §6.C.3 (mirroring AM-013): C5 ships and locally verifies the validator plus its `line-colors` build-script wiring; `.github/workflows/checks.yml` is owned by Stream F → F4 (`line-ui-7qm.6.4`) per §6.F.5 and must NOT be touched by C5. | The 4.5:1 floor is mathematically unsatisfiable for the verbatim-adopted Radix palette (PRD §9: Radix Themes table adopted verbatim): live computation of all 62 (hue, step-9, contrast-token) pairs with the WCAG 2.1 luminance formula shows 34 of 62 fail 4.5:1. Radix engineers step-9 solid surfaces and their paired contrast tokens to the 3:1 large-text/UI floor, which the palette meets — except `orange`, an upstream Radix characteristic missing 3:1 by 0.03 in both modes. A validator built literally to the old spec would be permanently red on a clean tree and would block the §6.F.5 CI pipeline. Keeping 4.5:1 would instead force redesigning 34 colour pairs, breaking the verbatim-Radix contract and C3's committed CSS. User decisions 2026-06-12: threshold → 3:1; orange → explicit commented allowlist (loud, auditable, regression-guarded); amend spec before implementation. | Investigation + live ratio computation logged in `bd comments line-ui-7qm.3.5` (worst case orange 2.97:1 independently re-verified by orchestrator). User decision matrix 2026-06-12. Precedent AM-013 for the CI-scope split. |
| AM-015 | 2026-06-16 | bead `line-ui-7qm.3.9` pre-implementation investigation | Re-specified the §6.C.7 `auto-pair.behaviour.test.ts` verification METHOD and reconciled the §6.C.7 test runtime. (a) The auto-pair check is changed from a `getComputedStyle()` computed-style read on a JSDOM tree to a **CSS-cascade string assertion against the committed `packages/line-themes/src/defaults.css`** source (the proven prior-art pattern). The auto-pair BEHAVIOUR being verified — §6.C.7 selector contract `:where([data-accent="X"]:not([data-gray]))`, including the nested-scope override case (violet → slate) — is UNCHANGED; only the assertion mechanism changes. (b) Reconciled the §6.C.7 runtime line ('Bun test + minimal jsdom') with §6.F.3 by standardising C9 on the **happy-dom** harness authored by F2 (`line-ui-7qm.6.2`); C9 now formally depends on F2 rather than provisioning a bespoke jsdom setup. A confirmation spike during C9 implementation must verify happy-dom cannot resolve the **production** `var()` chain — whose terminal value is `light-dark(#hex,#hex)`, which happy-dom does not compute — before the string-assertion method is finalised; a trivial hex-terminated `var()` chain does resolve under happy-dom and is not the obstacle. (This spike was subsequently executed and confirmed on 2026-06-17 — see AM-020.) | happy-dom and jsdom do not resolve `var()` chains or `light-dark()` through `getComputedStyle()`; the auto-pair role variables bottom out in values such as `light-dark(#6e56cf,#6e56cf)`, so a computed-style read returns the literal `var()`/`light-dark()` text instead of a resolved colour — making line 860 unworkable as written. §6.C.7 also self-contradicted §6.F.3 on the DOM library ('minimal jsdom' vs 'happy-dom'), and C9 declared no dependency on F2, so it had no test runtime at all. The earlier (pre-reinit) version of this exact suite verified identical auto-pair behaviour with pure `bun:test` + `node:fs` string assertions and no DOM resolution, proving the string-assertion approach is sufficient. Standardising on F2's happy-dom harness avoids forking the test infrastructure. | Investigation logged in `bd comments line-ui-7qm.3.9` (INVESTIGATION-prefixed; 4 SPEC_DRIFT items). User decision matrix 2026-06-16: (1) fix line-themes build defect via new prerequisite bead, (2) block C9 on F2 for the runtime, (3) spike-then-re-spec the auto-pair test. Prior-art string-assertion suite at `temp/packages/theme/test/{snapshot,token-parity,var-crossref}.test.ts`. |
| AM-016 | 2026-06-16 | bead `line-ui-7qm.6.1` pre-implementation investigation | Removed `'@storybook/addon-essentials'` from the §6.F.1 `main.ts` `addons` array code block (the addon list now reads `['@storybook/addon-a11y', '@storybook/addon-themes']`). | Completes AM-001. AM-001 removed `@storybook/addon-essentials` from the §6.A.3 dependency table but the §6.F.1 `main.ts` code example was not updated, leaving the spec self-contradictory; a verbatim copy of the code block would fail `bun --filter '@websublime/line-storybook' dev` startup since the package is discontinued (no `^10.x`) and absent from the repo. Autodocs is built into Storybook 10 core and requires no addon entry. | Research-agent investigation logged in `bd comments line-ui-7qm.6.1`; package confirmed absent from `package.json` and `node_modules`. |
| AM-017 | 2026-06-16 | bead `line-ui-7qm.6.1` implementation (DEVIATION logged in `bd comments line-ui-7qm.6.1`) | Removed the `docs: { autodocs: 'tag' }` entry from the §6.F.1 `main.ts` config code block. | Storybook 10 removed the `autodocs` key from `DocsOptions`; the line produces a TypeScript error (TS2353) against `@storybook/web-components-vite@10.4.1`. Autodocs-by-tag is the built-in default in Storybook 10 and needs no config entry. Same SB8→10 migration family as AM-016. | Implementation deviation logged in `bd comments line-ui-7qm.6.1`; `tsc --noEmit` green only after removal; Storybook 10 booted cleanly without the entry. |
| AM-018 | 2026-06-17 | bead `line-ui-7qm.6.2` pre-implementation research investigation | Two changes. (1) Added `@happy-dom/global-registrator` `^20.10.5` (devDependency) to the §6.A.3 dependency table, annotated with the AM-018 marker and a pointer to the §6.F.3 `bun-test-preload.ts` that consumes it. (2) Reallocated the preload-presence CI assertion from F2 to F4: split the §9.6 exit criterion into an F2-owned `bunfig.toml` declaration line and an F4-owned `checks.yml` assertion line, added the concrete `grep`-the-preload step to the F4-authored `checks.yml` in §6.F.5, and added an F2 scope note under §6.F.3 confirming F2's deliverables are exactly (a) create `bun-test-preload.ts` and (b) add `[test] preload` to `bunfig.toml`. | (1) The §6.F.3 preload imports `{ GlobalRegistrator } from '@happy-dom/global-registrator'` and calls `GlobalRegistrator.register()`, but that package was absent from §6.A.3, `package.json`, and `bun.lock` (0 matches in the lockfile; not a transitive dep of `@open-wc/testing-helpers`). The contract told the implementer to write code that cannot boot `bun test`. The import name is correct — it is the separate `global-registrator` sub-package, not the umbrella `happy-dom` package; only the dep table omitted it. (2) F2's AC required a `checks.yml` step asserting the preload entry, but `.github/workflows/` does not exist at F2 time — F1 (`line-ui-7qm.6.1`) deferred ALL workflow authoring to F4 (`line-ui-7qm.6.4`, "GitHub Actions checks.yml — full PR validation pipeline"). F2 cannot CI-verify its own AC against a file it does not own. The requirement is moved, not deleted — F4's `checks.yml` scope now owns it. Mirrors the AM-006 / AM-007 / AM-013 precedent that scoped analogous CI ACs to Stream F. | Drift surfaced by research agent during pre-implementation investigation of `line-ui-7qm.6.2` (Stream F F2). Verified `@happy-dom/global-registrator` absent from `bun.lock` (0 matches), `package.json`, and `node_modules`. `GlobalRegistrator.register()` API + `@happy-dom/global-registrator` import confirmed correct against round-1 research (`docs/research/00-research-design-system-foundation.md` R2 / A14, lines 144-156, 269-277). Version floor `^20.10.5` (registry-confirmed 2026-06-17): the `capricorn86/happy-dom` `global-registrator` sub-package's current latest stable is 20.10.5 (npm dist-tag `latest`), exposing the stable `GlobalRegistrator.register()` API; `engines` is `node >=20.0.0` with no Bun ceiling, so it is Bun 1.3.14 compatible (verified against the live npm registry 2026-06-17, correcting the earlier guessed floor logged when Context7 was unavailable); caret-floor convention matches AM-005. `checks.yml`/`.github/workflows/` ownership = F4 (`line-ui-7qm.6.4`) per §6.F.5, F1 workflow deferral per `bd comments line-ui-7qm.6.1`. User-approved decision 2026-06-17. |
| AM-019 | 2026-06-17 | bead `line-ui-7qm.6.2` implementation (infra-supervisor deviation, verified) | Reconciled the §6.F.3 `bun-test-preload.ts` `fixtureCleanup` import from the deep file subpath `@open-wc/testing-helpers/index-no-side-effects.js` to the `exports`-mapped entry `@open-wc/testing-helpers/pure`. No other line of the §6.F.3 block changed; the AM-018 F2 scope note is untouched. | `@open-wc/testing-helpers@3.0.1` ships an `exports` map exposing only two keys — `"."` (→ `./index.js`) and `"./pure"` (→ `./index-no-side-effects.js`). The spec's literal deep file subpath `@open-wc/testing-helpers/index-no-side-effects.js` is NOT an `exports` key, so under Bun's `exports`-honoring resolver it throws `ERR_PACKAGE_PATH_NOT_EXPORTED` / `Cannot find module`, failing the preload and therefore every `bun test`. `@open-wc/testing-helpers/pure` is the correct entry and the `exports` map maps it to the IDENTICAL physical module (`index-no-side-effects.js`, re-exporting `fixtureCleanup` from `./src/fixtureWrapper.js`), so behaviour is unchanged — only the import specifier differs. The implementation shipped `/pure`; this amendment reconciles the spec to the working code. Also corrects the `line-ui-7qm.6.2` research INVESTIGATION's incorrect claim that the deep subpath resolves. | Orchestrator inspected `node_modules/@open-wc/testing-helpers/package.json` `exports` map on 2026-06-17: keys = `"."` → `./index.js`, `"./pure"` → `./index-no-side-effects.js`; deep file subpath absent → `ERR_PACKAGE_PATH_NOT_EXPORTED` under Bun. `./pure` and the deep file path resolve to the same `index-no-side-effects.js` re-exporting `fixtureCleanup` from `./src/fixtureWrapper.js`. Implementation deviation logged in `bd comments line-ui-7qm.6.2`; `bun test` boots green only with `/pure`. |
| AM-020 | 2026-06-17 | bead `line-ui-7qm.3.9` re-investigation (AM-015 confirmation spike executed) | Corrected an empirically-wrong clause in the AM-015 row and in the §6.C.7 "C9 — auto-pair verification method" prose: both previously stated the spike "must verify happy-dom cannot resolve a trivial `var()` chain". The spike was run (happy-dom 20.10.5 via the F2 preload) and shows happy-dom **does** resolve a trivial hex-terminated `var()` chain through `getComputedStyle()`; the actual obstacle is the **production** chain, whose terminal value is `light-dark(#hex,#hex)`, which happy-dom does not compute. Reworded both occurrences to reflect this and to note the spike was executed/confirmed on 2026-06-17. Also annotated decision-log D3 category (c) (`getComputedStyle()`) as superseded by AM-015, pointing the reader to §6.C.7. AM-015's decision, date, and the string-assertion method are unchanged — only the justifying wording is made accurate. | The original "trivial `var()` chain" phrasing was factually incorrect: it under-described why the string-assertion method is needed and would mislead the C9 implementer into running the wrong spike. Empirical results (2026-06-17): trivial chain `--line-accent-9 → var(--line-violet-9) → #6e56cf` resolves to `#6e56cf`; `light-dark(#111,#eee)` alone returns `""`; the production chain `--line-accent-9 → var(--line-violet-9) → light-dark(#6e56cf,#6e56cf)` returns the literal `light-dark(#6e56cf,#6e56cf)` (and `""` for a property consuming it via `var()`). The selector negation `:where([data-accent="X"]:not([data-gray]))` **does** match correctly under happy-dom — only `var()`/`light-dark()` value computation fails — which re-confirms AM-015's string-assertion decision is correct. D3 category (c) is historical (pre-AM-015) and was stale once AM-015 changed the mechanism; annotated rather than deleted to preserve the decision history. No acceptance criteria, test categories, or behaviour changed. | Confirmation spike run during `line-ui-7qm.3.9` re-investigation on 2026-06-17 (happy-dom 20.10.5, F2 test preload). Trivial chain → `#6e56cf`; `light-dark()` → `""`; production chain → literal `light-dark(#6e56cf,#6e56cf)`; `:not([data-gray])` selector matches. Corrects AM-015 wording and §6.C.7 prose; annotates §10/D3. |
| AM-021 | 2026-06-18 | bead `line-ui-7qm.4.2` pre-implementation investigation | Reframed §6.D.2 from a "backwards-compatible refactor of the current Inspector implementation; preserves existing API surface for current consumers" to a greenfield implementation note. Removed the obsolete "preserve existing API surface" clause and stated D2 is a fresh implementation whose authoritative activation contract is `localStorage.getItem('line-ui:inspector') === 'on'`. No other §6.D.2 requirement changed. | The "current Inspector implementation" the clause referenced does not exist in the working tree — the legacy `<ui-inspector>` custom element (`packages/core/src/lib/ui/inspector.ts`, ~165 LOC, `@customElement('ui-inspector')`) plus its `InspectController` ReactiveController (`packages/core/src/lib/controllers/inspect-controller.ts`) were deleted in the re-init commit `939cad2`, leaving no implementation, no consumers, and no API surface to preserve. The legacy architecture was also incompatible with the new design: it was a separate custom element gated by an `inspect` boolean property using localStorage key `line-inspector`, whereas §6.D.2 specifies an `InspectorMixin` on `LineElement` activated by `localStorage 'line-ui:inspector' === 'on'`. The obsolete clause additionally contradicted the new key declared at the top of §6.D.2. Same pre-reinit-staleness family as AM-015 / AM-020. | Research-agent investigation logged in `bd comments line-ui-7qm.4.2` (INVESTIGATION-prefixed; SPEC_DRIFT items + ORCHESTRATOR_DECISION). Legacy source confirmed deleted by `939cad2`; localStorage key rename (`vita-inspector`/`line-inspector` family) traced to commit `b8e553f`. D1 stub contract (`packages/line-core/src/mixins/inspector.ts`, `InspectorMixin` generic signature, composition in `line-element.ts`) confirmed intact and unaffected. User-approved decision 2026-06-18. Precedent AM-015 / AM-020. |
| AM-022 | 2026-09-30 | ledger `00-Z1` review (task numbering reconciliation) | Aligned the Stream C task labels in the §6.C headings and body with the numbering the implementation, the PRs, and this table's own AM-013/AM-014 notes already use: §6.C.3 heading `(C3, C4)` now reads `(C3 palette generation, C4 palette freshness guard)`; the `Contrast validation (C10)` label in §6.C.3 now reads `Contrast validation (C5)`; §6.C.4 heading `(C5, C6)` now reads `(C6)`. No requirement changed. | The plan §4.3 numbering (C4 = contrast token table, C5 = role-map generation, C10 = contrast validation) was superseded during decomposition: the contrast token table shipped inside C3 (#186), role-map generation and semantics/aliases/defaults shipped together as C6 (#190), the freshness guard became C4 (#187) and the contrast validator C5 (#188). The headings kept the plan numbering while the AM-013/AM-014 scope notes used the shipped numbering, so a reader cross-referencing the ledger `docs/plans/00-tasks-design-system.md` landed on the wrong task. | PR titles #186–#190; ledger Stream C rows; AM-013 and AM-014 rows above. |
| AM-023 | 2026-09-30 | ledger `00-F6` pre-implementation investigation | Three factual corrections to §6.F.4, no requirement or design change. (1) The `playwright.config.ts` block imports `defineConfig` / `devices` from `'playwright/test'` instead of `'@playwright/test'`. (2) Added a sentence under the config block declaring the root `package.json` script `"e2e": "playwright test --pass-with-no-tests"`, which the §6.F.5 `checks.yml` step `bun run e2e` invokes but no section defined. (3) The same sentence notes that `--pass-with-no-tests` keeps the step green until D5 / D8 / G6 land their `*.e2e.ts` files. | (1) §6.A.3 declares only `playwright ^1.60.0`; `@playwright/test` is not installed and must not be added, and `playwright/test` is the identical runner entry shipped inside the `playwright` package (`node_modules/playwright/test.mjs`). (2) `bun run e2e` would fail with a missing-script error in CI without the declaration. (3) `playwright test` exits 1 with `Error: No tests found` when no file matches `**/*.e2e.ts`; the first E2E files arrive with D5 / D8 / G6, so the F6 config alone would turn `checks.yml` red. | Verified against `playwright@1.60.0`: `playwright test` without matching files exits 1 (`Error: No tests found`); `playwright test --pass-with-no-tests` exits 0. Investigation recorded in the `00-F6` branch commit bodies. |
| AM-024 | 2026-09-30 | ledger `00-F4` pre-implementation investigation | Three factual corrections to §7.1 and §6.F.5, no requirement or design change. (1) §7.1 per-package matrix rows `line-tokens`, `line-colors`, `line-themes`: `"include": []` → `"files": []`. (2) §6.F.5 `checks.yml` block: `bun --filter '@websublime/line-storybook' run analyze` → `bun --filter '@websublime/line-storybook' analyze`. (3) §6.F.5 `checks.yml` block: added a zero-export smoke step for `line-components/dist/index.js` right after the `bun --filter '@websublime/*' build` step. | (1) The uniform `typecheck` script (`tsc --noEmit`, §6.B) that §6.F.5 runs errors with `TS18003: No inputs were found … 'include' paths were '[]'` on a tsconfig with `"include": []`; `"files": []` is TypeScript's documented empty-project form and exits 0. (2) With bun 1.3.14, `bun --filter <pkg> run <script>` reports `error: No packages matched the filter` (exit 1); the filter form without `run` is the one that runs the script. (3) §9.1 (line "re-loading the built module and verifying its export count is zero"), RK11 and the §6.B AM-007 note ("The CI step itself is asserted by F3 / F4") all require CI to assert the Phase 00 zero-export invariant, but the `checks.yml` block had no such step. | Verified on `main` @ `0eb2c18`: `bun --filter '@websublime/*' typecheck` → exit 2 (three CSS-only packages fail TS18003); with `"files": []` in the three tsconfigs → exit 0. `bun --filter '@websublime/line-storybook' run analyze` → exit 1 (`No packages matched the filter`); `bun --filter '@websublime/line-storybook' analyze` → exit 0. `bun -e "import('./packages/line-components/dist/index.js').then(m => console.log(Object.keys(m).length))"` → `0`. Investigation recorded in the `00-F4` branch commit bodies. |
| AM-025 | 2026-09-30 | ledger `00-F4` Verify gate (reviewer + security-reviewer findings) | Three corrections to §6.F.5 and §7.1, no requirement or design change. (1) §6.F.5 `checks.yml` block: moved `bun --filter '@websublime/*' typecheck` to directly after `bun --filter '@websublime/*' build` (before the zero-export smoke step). (2) §7.1 second invariant bullet: `"include": []` → `"files": []` (completes AM-024). (3) §6.F.5 `checks.yml` block hardening: top-level `permissions: { contents: read }`, top-level `concurrency: { group: checks-${{ github.ref }}, cancel-in-progress: true }`, job `timeout-minutes: 30`, checkout `with: { persist-credentials: false }`, preload-presence grep anchored and dot-escaped (`grep -qE '^preload = \["\./bun-test-preload\.ts"\]$' bunfig.toml`). | (1) `apps/storybook/.storybook/preview.ts` imports `@websublime/line-schemas`, whose `exports` map resolves types to `./dist/index.d.ts`; `dist/` is gitignored and only the build emits it, so on a clean checkout `@websublime/line-storybook typecheck` fails with TS2307 before any build has run — the block as ordered was unsatisfiable. (2) AM-024 changed the §7.1 matrix rows to `"files": []` but left the prose bullet at `"include": []`, making §7.1 self-contradictory. (3) Security defaults with no design choice: read-only token (least privilege), no persisted git credentials (nothing after checkout needs git auth), bounded job runtime, superseded PR runs cancelled, and a grep that cannot be satisfied by a commented-out or substring match. SHA-pinning of actions is deferred (Miguel's decision). | Reproduced on `ci/00-f4-checks-workflow` @ `b72ba69` via `rm -rf /tmp/f4-clean && mkdir /tmp/f4-clean && git archive HEAD \| tar -x -C /tmp/f4-clean && cd /tmp/f4-clean && bun install --frozen-lockfile && bun --filter '@websublime/*' typecheck` → exit 2 (`error TS2307: Cannot find module '@websublime/line-schemas'` from `.storybook/preview.ts:3`); then `bun --filter '@websublime/*' build && bun --filter '@websublime/*' typecheck` → exit 0. Negative control for the grep: with the `bunfig.toml` preload line commented out, the anchored grep exits 1. Full clean-export step-order run recorded in the `00-F4` Verify record. |
| AM-026 | 2026-09-30 | ledger `00-D7` pre-implementation investigation (Miguel approved the preload plugin option) | Two factual additions, no requirement or design change. (1) §6.F.3 `bun-test-preload.ts` block: added a Bun `plugin()` named `css-inline` that resolves `*.css?inline` imports to the CSS file text (`export default "<css>"`). (2) §6.D.7: added one sentence stating that under `bun test` the `?inline` imports are served by that preload plugin. | Bun's runtime does not implement Vite's `?inline` query: `import css from './a.css?inline'` under `bun test` yields the file **path** string, not its contents, so `replaceSync(path)` parses no rules and `createSheet()` would build 11 empty sheets (`cssRules.length === 0`) — the §9.3 acceptance criterion could not be verified at the unit tier. Vite handles `?inline` correctly at build time (§14.5), so the plugin only exists to give `bun test` the same module semantics as the build. Placing it in the F2 preload is the smallest change that covers every package without per-test setup. | Spike run on 2026-09-30 in the `00-D7` understand phase: without the plugin `commonReset.cssRules.length === 0` and the imported value is an absolute path; with the plugin every sheet exposes its real rules. |
| AM-027 | 2026-09-30 | ledger `00-D7` Verify gate (reviewer P1; Miguel approved the inert custom-property body) | One factual correction to the ARCHITECTURE blocks that §6.D.7 adopts verbatim, no requirement or design change. ARCHITECTURE §14.4 `reset.input.css` block and §15.3 autofill-detection block: `@keyframes line-autofill-start { from {} }` / `@keyframes line-autofill-cancel { from {} }` → `@keyframes line-autofill-start { from { --line-autofill: 1; } }` / `@keyframes line-autofill-cancel { from { --line-autofill: 1; } }`. The §6.D.7 "verbatim" mandate now refers to the corrected blocks; the animation names and the `animation-name` selectors are unchanged. | CSS minifiers discard keyframe rules whose every keyframe block is empty: lightningcss (Vite 8's default CSS transformer) and cssnano (`postcss.config.mjs`) both drop `@keyframes … { from {} }`, so the built `dist/styles/index.js` had no `@keyframes` at all and `animation-name: line-autofill-*` pointed at nothing — the ARCHITECTURE §15.3 `animationstart` detection would never fire from the published package. Any non-empty keyframe body survives; an inert `--line-autofill: 1` custom property changes no rendered style and keeps the trick working. | On `feat/00-d7-reset-sheets` @ `7529200`: `grep -o "@keyframes line-autofill" packages/line-core/dist/styles/index.js \| wc -l` → `0` after `bun run build`; with the custom-property body → `2` (the minified CSS is a single line, so `grep -c` would report 1). Reviewer finding recorded in the `00-D7` Verify gate. |
| AM-028 | 2026-09-30 | ledger `00-Z4` (Miguel chose the bunfig exclusion over removing the local `temp/` tree) | Addition to the two `bunfig.toml` blocks (§6.A A1 and §6.F.3), no requirement or design change: the `[test]` table gains `pathIgnorePatterns = ["temp/**"]` directly under the unchanged `preload` line. | The gitignored legacy `temp/` tree (`.gitignore:4`) holds four foreign `*.test.ts` files under `temp/packages/theme/test/` (`contrast`, `snapshot`, `token-parity`, `var-crossref`) that Bun discovers on every local root `bun test` and that fail with `ENOENT temp/node_modules/open-props/…`. The pattern is root-anchored (`temp/**`, not `**/temp/**`) because only that tree is known to hold foreign tests; keeping `preload` on its own unchanged line keeps the F4 `checks.yml` anchored grep matching. CI is unaffected either way because `temp/` is absent from the checkout. | Probe on `main` @ `1cd7b13` (`docs/context/00-z4.md`): without the key, 391 tests across 12 files, 39 fail, all inside `temp/packages/theme/test/*.test.ts`; with the key, 130 tests across 8 files, 0 fail — exactly `packages/line-core/__tests__/*` (4) and `packages/line-themes/__tests__/*` (4). |
| AM-029 | 2026-09-30 | ledger `00-F8` (CI runs 36746592928 / 36748071527 red on "Build packages") | Two corrections, no design change. (1) §5: the root `package.json` `build` script becomes `"bun --filter './packages/*' build && bun --filter './apps/*' build"` (two-phase: every package, then every app). (2) §6.F.5 `checks.yml` and `release.yml` blocks: the build step becomes `bun run build`, so CI and the release pipeline run the same two-phase script as local. §6.A.1 "Workspace scripts" sentence now carves out `build`. | `bun --filter` (bun 1.3.14) orders workspace scripts by the `dependencies` edges only; a `devDependencies` edge gives no ordering. `apps/storybook/package.json` lists the eight `@websublime/*` packages under `devDependencies`, which §3 ("storybook → all published packages (dev-only)") and `scripts/lint-layers.mjs` require, so `bun --filter '@websublime/*' build` can start the storybook build before `line-schemas` has emitted `dist/` and Rolldown fails to resolve `@websublime/line-schemas` from `.storybook/preview.ts`. Splitting the build into a packages phase and an apps phase gives the ordering without moving the app edges to `dependencies`. | CI run 36746592928 (`feat/00-d7-reset-sheets`) and 36748071527 (`chore/00-z4-bun-test-ignore-temp`): `@websublime/line-storybook build` starts at 16:47:18.7 and dies with `Rolldown failed to resolve import "@websublime/line-schemas" from "./.storybook/preview.ts"`; `@websublime/line-schemas build` exits at 16:47:19.5. Three throwaway workspaces with a slow-building dependency: a `devDependencies` edge raced (consumer started before the dependency finished), a `dependencies` edge waited. Local clean two-phase build recorded in the `00-F8` Verify record. |
| AM-030 | 2026-10-01 | ledger `00-D8` pre-implementation investigation (decision — Miguel chose the Vite dev server via Playwright `webServer` over an in-test bundle and over `vite build` + `vite preview`) | Two additions, no requirement change. (1) §6.F.4 `playwright.config.ts` block gains a `webServer` entry (`command: 'vite packages/line-core/__tests__/integration/hello-world --host 127.0.0.1 --port 4319 --strictPort'`, `url: 'http://127.0.0.1:4319'`, `reuseExistingServer: !process.env.CI`) and `use.baseURL` is set to that URL. (2) §6.D.8 file tree gains `index.html` (the Vite fixture page the e2e loads) with a sentence explaining the serving mechanism. | The spec was silent on how `line-hello-world.e2e.ts` loads a TypeScript component in a real browser; `playwright.config.ts` had no `webServer` and no `*.e2e.ts` existed yet. The Vite dev server is the standard mechanism, resolves workspace TS and `?inline` imports without a build step, and the same `webServer` block accepts an array when the Storybook smoke tier (§6.F.4, G6) lands; 4319 is a non-default port so a local `vite preview` on 4173 is never reused through `reuseExistingServer`. | `playwright.config.ts` (13 lines, no `webServer`); `glob **/*.e2e.ts` → none. Probe on this machine: Vite 8.0.14 without `--host` binds `localhost` as `::1` only (`curl http://127.0.0.1:4173/` → connection refused, probe run before the port moved to 4319), so the command pins `--host 127.0.0.1` to match `url`. |
| AM-031 | 2026-10-01 | ledger `00-D4` pre-implementation investigation (decision — Miguel chose the native-first direction design over reflecting the document dir onto the host) | Two changes. (1) §6.D.4 rewritten: `DirectionMixin` adds a read-only `direction: 'ltr' \| 'rtl'` (a getter over private state, `attribute: false`, no public setter) read from `this.matches(':dir(rtl)')`, never writes the host `dir` attribute and leaves the native `HTMLElement.dir` untouched; its return type widens to `T & Constructor<LitElement & { readonly direction: 'ltr' \| 'rtl' }>`, replacing the D1 stub's `T & Constructor<LitElement>` (parameter and export name unchanged); one shared module-level `MutationObserver` on `document` (`subtree: true`, `attributeFilter: ['dir']`) recomputes every connected host and calls `requestUpdate('direction', oldValue)` only on change; `dir="auto"` resolves through the engine's `:dir()`; component CSS targets RTL with `:host(:dir(rtl))`; known limits (no observation inside shadow trees, `dir="auto"` text changes) and unit/browser test stratification stated. (2) §6.F.4 `playwright.config.ts` block: the `webServer.command` root becomes `packages/line-core/__tests__/integration` (one Vite server, one subdirectory per fixture page: `/hello-world/`, `/direction/`) and `webServer.url` becomes `http://127.0.0.1:4319/hello-world/` because the root has no `index.html` (`use.baseURL` unchanged); §6.D.8 serving sentence and the §6.F.4 "Playwright runs" list follow. Decisions: native-first source and `:host(:dir(rtl))` hook (rejected: reflecting the document `dir` onto the host, observing `documentElement` only); new property `direction` (rejected: overriding `dir`); `dir="auto"` resolves through `:dir()` (rejected: treating `auto` as `ltr`). | Reflecting the document `dir` onto the host attribute overrides native ancestor inheritance (a host inside an RTL region of an LTR document is forced LTR) and contradicts PRD §Non-functional "i18n — RTL: Supported natively via `dir` attribute"; `documentElement`-only observation misses nested regions; redeclaring `dir` shadows the platform `HTMLElement.dir` accessor. | Playwright probe (Chromium 148, Firefox 150, WebKit 26.4): a host with `dir="ltr"` inside `<div dir="rtl">` computes `direction: ltr`; `:host(:dir(rtl))` matches inside an RTL ancestor and updates live on ancestor flip with no JS. happy-dom 20.10.5: `matches(':dir(rtl)')` is always `false` and computed `direction` always `ltr`, so real resolution is verifiable only in the browser tier. `@zag-js/types` declares `dir?: "ltr" \| "rtl"`. `docs/context/00-d4.md`. |
| AM-032 | 2026-10-02 | ledger `00-D5` pre-implementation investigation | Two factual corrections, no requirement or design change. (1) §6.D.5 code block: `FormAssociated` gets an explicit return type. An exported interface `FormAssociatedMembers` declares the public surface (`setFormValue`, `setValidity`, `reportValidity`, `checkValidity`, readonly `form`, `name`, `type`, `validity`, `validationMessage`, `willValidate`, optional `formAssociatedCallback` / `formDisabledCallback` / `formResetCallback` / `formStateRestoreCallback`), and the signature becomes `FormAssociated<T extends Constructor<LineElement>>(Base: T): T & Constructor<FormAssociatedMembers> & { readonly formAssociated: true }`, mirroring `DirectionMixin` (AM-031). The class is declared, then returned; `LineElement` is a type-only import. Every member, the constructor, `#internals`, and `reflectState` are unchanged. (2) §6.D.5 browser tier: the fixture page is `/form-associated/` under `packages/line-core/__tests__/integration/form-associated/`, served by the existing §6.F.4 `webServer`; the §6.F.4 `webServer.command` comment listing fixture pages gains `/form-associated/`. | (1) The sketch's inferred return type is an anonymous class, and declaration emit cannot name the protected members it inherits, so `vite-plugin-dts` cannot emit `dist/mixins/form-associated.d.ts`. (2) The spec named the stub `<line-form-test>` but not where its page lives; AM-031 already set one subdirectory per fixture page under the shared server root. The unit tier needs its mock because happy-dom 20.10.5 has no `attachInternals`, so `packages/line-core/__tests__/mocks/element-internals.ts` installs a fake `HTMLElement.prototype.attachInternals`. | (1) `bunx tsc -p packages/line-core --noEmit false --declaration --emitDeclarationOnly` on the verbatim sketch fails with TS4094 "Property 'reflectState' of exported anonymous class type may not be private or protected", also for Lit's protected `render`, `update`, `willUpdate`, `createRenderRoot`, `firstUpdated`, …; with the explicit signature the emit succeeds. (2) AM-031 §6.F.4 config comment `(/hello-world/, /direction/)`. happy-dom: no `attachInternals` match anywhere under `happy-dom@20.10.5/lib` (including `lib/nodes/html-element/HTMLElement.js`). |
| AM-033 | 2026-10-02 | ledger `00-E1` pre-implementation investigation (decision — Miguel chose optional peer dependencies over hard dependencies and over undeclared imports) | (1) The §6.E.2 Phosphor resolver block gets a factual correction because `@phosphor-icons/core@2.1.1` names every non-regular file `<name>-<weight>.svg` (for example `assets/bold/acorn-bold.svg`), and only `regular` uses the bare name. The resolver now computes `file` as `name` for `regular` and `` `${name}-${weight}` `` otherwise, then imports `` `@phosphor-icons/core/assets/${weight}/${file}.svg?raw` ``. The weight type, weight precedence and return statement are unchanged. §6.E.3 now requires the Phosphor resolver test to cover all six weights and notes the `<name>-<weight>.svg` suffix. (2) The §4.8 `package.json` block gains `peerDependencies` for `lucide-static` `^1.16.0` and `@phosphor-icons/core` `^2.1.1`, and `peerDependenciesMeta` marks both optional. The §4.8 prose says a consumer installs only the library whose resolver it uses and the root `devDependencies` keep both for the tests. The §6.A.3 dependency table Source cells for `lucide-static` and `@phosphor-icons/core` add "optional peer of `line-icons` (AM-033)". | ARCHITECTURE §11 says the consumer brings their own resolver and `line-icons` bundles zero icons. Hard `dependencies` would install about 96 MB (lucide-static 59 MB, @phosphor-icons/core 37 MB) for every consumer. Undeclared imports are refused by strict package managers and give the consumer no version range. The old Phosphor path failed at runtime for every non-regular weight. | Throwaway `bun test` on Bun 1.3.14 showed `assets/bold/acorn.svg?raw` fails with `Cannot find module`, while `assets/<w>/acorn[-<w>].svg?raw` resolves for all six weights. `ls node_modules/@phosphor-icons/core/assets/<w>/` lists `acorn-thin.svg`, `acorn-light.svg`, `acorn.svg`, `acorn-bold.svg`, `acorn-fill.svg` and `acorn-duotone.svg`. `du -shL node_modules/lucide-static/ node_modules/@phosphor-icons/core/` reports 59M and 37M. Miguel recorded the peer-dependency decision on 2026-10-02 in `docs/context/00-e1.md` (Decisions). |
| AM-034 | 2026-10-02 | ledger `00-E1` implement (implementer deviation report) | One factual correction, no requirement or design change: the §6.E.2 Phosphor resolver block imports only the type it uses, so its import line becomes `import type { IconResolver } from '../index.js';`. | The block imported `IconResolverOptions` without using it, so it failed the repo's own strict checks. `tsc --noEmit -p packages/line-icons` reports TS6196 ('IconResolverOptions' is declared but never used) because `tsconfig.base.json` sets `noUnusedLocals: true`, and Biome reports `lint/correctness/noUnusedImports`, which `biome.json` sets to error. Implementation commit `094f6b9` already carries the corrected import. |
| AM-035 | 2026-10-02 | ledger `00-E1` Verify gate (security-reviewer F1; decision — Miguel chose validating names and weights now over handing the risk to the Phase 1 `<line-icon>` spec) | Four changes, no change to the registry contract. (1) §6.E.2: both resolvers call `assertIconName(name)` before `import()`; it throws `[line-icons] Invalid icon name "<name>".` for any name outside `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`. The guard also rejects any `name` that is not a string, so the check and `import()` never coerce the same value twice. The function lives in the new internal module `src/resolvers/icon-name.ts`, which `src/index.ts` does not re-export, and the spec shows that module. (2) §6.E.2: the Phosphor resolver holds the six weights in a `Set` and throws `[line-icons] Unknown Phosphor weight "<weight>".` for any resolved weight outside it, so the check covers both `options.weight` and the factory default. Both resolvers stay async, so every rejection arrives as a rejected promise. (3) §6.E.1 and §6.E.2: the block comments become short present-state sentences per STYLE.md, and the code comments equal them. (4) §6.E.3: the Lucide and Phosphor test bullets add the rejection cases for invalid names and, for Phosphor, invalid weights. | An unchecked `name` reaches `import()` and walks out of the icon directory under Bun or Node, so a caller-supplied name can load and execute any module the package can resolve. | Orchestrator probe on `dist` under Bun 1.3.14: `createLucideResolver()('../sprite')` returned lucide-static `sprite.svg`; `('../../@phosphor-icons/core/assets/regular/house')` returned a Phosphor SVG; `('../../../package.json?')` returned the line-icons `package.json` as a parsed object; `('../dist/esm/lucide-static.mjs?')` imported and executed that module (default `undefined`). All 1960 Lucide icon names and all 1512 Phosphor icon names match the pattern, so no real icon is rejected. The security re-review (F1-R1) found that `RegExp.test` and the template literal each call `ToString(name)`, so an object whose stateful `toString` returns `house` to the check and `../sprite` to `import()` bypassed the pattern alone. The decision is recorded in `docs/context/00-e1.md` (Decisions). |
| AM-036 | 2026-10-02 | ledger `00-F9` pre-implementation investigation and review gate iteration 1 (decision — Miguel chose Bun packing of a staged copy with npm uploading over `bun publish` and over keeping `changeset publish` behind an in-place `workspace:` rewrite; chose rewriting `workspace:` ranges in the staged manifest over syncing `bun.lock` after versioning and over upgrading Bun to 1.4.2 inside a fix row; and chose `["dist", "src"]` for the TS-built packages over `["dist"]` everywhere) | Five changes; versions, `exports`, and the dependency graph are unchanged. (1) §4.1–§4.8: every published `package.json` declares `files`. The 5 TS-built packages (`line-schemas`, `line-utils`, `line-icons`, `line-core`, `line-components`) use `["dist", "src"]`, and the CSS packages (`line-tokens`, `line-colors`, `line-themes`) use `["dist"]`. (2) §6.F.5 adds the publisher `scripts/publish.mjs`. It discovers non-private packages outside the Changesets `ignore` list and orders them dependencies first (a cycle fails, ties sort by name). It checks each `name@version` with `npm view --json` and skips published ones. It copies each package (without `node_modules`) to a temp staging directory, rewrites every `workspace:` range in the staged manifest from the versions in `packages/*/package.json`, and runs `bun pm pack --quiet` there. It runs the pack checks on the tarball, uploads it with `npm publish <tarball> --access public --tag <tag>`, and finally runs `changeset tag` unless `--no-git-tag` is passed. Its `--dry-run` mode packs and checks every publishable package and uploads nothing. Tracked files are never mutated. Root scripts become `"release": "bun run scripts/publish.mjs"` and `"snapshot:publish": "bun run scripts/publish.mjs --tag canary --no-git-tag"`. (3) §6.F.5 adds the guard `scripts/verify-pack.mjs`. It packs every publishable package offline through the same staging function and checks `exports` targets, an allowlist and a denylist of tarball paths, leftover `workspace:`/`catalog:` ranges, and internal ranges against the versions in `packages/*/package.json`. `checks.yml` runs it as `Pack verification (AM-036)` right after the typecheck step. `CHANGELOG.md` is intentionally not shipped. (4) §6.A A4 and the §6.F.5 snapshot paragraph now say `snapshot:publish` runs that script with `--tag canary` and no git tags. (5) §7.2 states the release split. `release.yml` is unchanged (`changesets/action@v1`, `publish: bun run release`). | `changeset publish` uploads with `npm publish` under Bun, and `npm publish` drops `dist/` and ships `workspace:^` unrewritten, so every published tarball would be uninstallable. Upgrading Changesets does not fix this because 3.0.3 still falls back to npm for Bun. `bun pm pack` honours `files`, but on Bun 1.3.14 it fills `workspace:` ranges from the versions recorded in `bun.lock`, and `changeset version` never updates `bun.lock`, so a plain pack after versioning ships stale ranges. The staged rewrite reads the versions Changesets just wrote. Syncing `bun.lock` was rejected because it means text surgery on the lockfile format plus a `version:` hook in `release.yml`. Upgrading to Bun 1.4.2 was rejected because it is out of scope for a fix row and still ships stale ranges if the pack runs before `bun install`. An in-place `workspace:` rewrite before `changeset publish` was rejected because it mutates tracked manifests and copies pnpm's rewrite rules. Without `files`, `bun pm pack` ships `src/`, `__tests__/`, and `tsconfig.json`. `["dist"]` everywhere was rejected because the shipped `.d.ts.map`/`.js.map` point at `../src`. npm stays the uploader because it can switch from token auth to OIDC trusted publishing with provenance later, and `bun publish` has no OIDC (oven-sh/bun#22423 open). Bun leaves `CHANGELOG.md` out when `files` is set, and release notes live in the repository, the GitHub releases, and the site (PRD §6.4). `snapshot:publish` (`changeset publish --snapshot --tag canary`) fails flag validation in 2.31.0, so A4's "already wired" was wrong. The source of the wrong premise is research R14 (round 1 l.175, round 2 l.117-118), which called Changesets package-manager-agnostic for publishing. | `getPublishTool` picks npm for anything but pnpm (`node_modules/@changesets/cli/dist/changesets-cli.cjs.js:743-749`); 3.0.3 falls back to npm for Bun (`dist/getPublishPlan.mjs:569-591`). `npm pack --dry-run` in all 8 packages lists zero `dist/` files and includes `src/`, `__tests__/`, `tsconfig.json`, `vite.config.mjs`. `npm pack` of `line-utils` keeps `"@websublime/line-schemas": "workspace:^"`. `bun pm pack` includes `dist/` (33/3/32/16/28/41/20/12 files for colors, components, core, icons, schemas, themes, tokens, utils). Probe on Bun 1.3.14: workspace `a` bumped from `0.0.0` to `0.1.0`, `b` still packs `"a": "^0.0.0"` after `bun install`, and `bun install --frozen-lockfile` exits 0 (oven-sh/bun#18906, fixed by #41302 after 1.4.0). Probe on Bun 1.4.2: `bun install` refreshes the lockfile, but a pack before it still ships the stale range. Every `exports` target of the 8 packages lives under `./dist/`. `npm view @websublime/line-<name>` returns E404 for all 8. `validateCommandFlags` rejects `--snapshot` for `publish` (cli lines 1400-1406). `changesets/action@v1` is a floating branch, currently v1.9.0, and matches `New tag:` lines from the publish script's stdout (`src/run.ts:101`); `changeset tag` prints them (cli lines 1296-1318). Bun 1.3.14, npm 10.9.9, `@changesets/cli` 2.31.0. Full record in `docs/context/00-f9.md`. |
| AM-037 | 2026-10-02 | ledger `00-F9` Verify gate (security-reviewer F9-SEC-01, F9-SEC-03) | Two factual corrections, no requirement or design change. (1) §6.F.5 Publish path step 6: the repo `.npmrc` pins both `registry` and `@websublime:registry` to `https://registry.npmjs.org/`. (2) §6.F.5 guard check (c): the denylist adds any path segment that starts with `.`, `*.pem`, and `*.key`. | npm resolves `@websublime/*` through the `@websublime:registry` key, which beats `registry`. A user `~/.npmrc` that sets `@websublime:registry=https://npm.pkg.github.com` would send `npm view` and `npm publish` to GitHub Packages, and project config beats user config only for the same key. The denylist also let dotfiles such as `.env` and key files ship if they sat under a `files` entry. | `.github/actions/npmrc/action.yml:20` writes `@websublime:registry=https://npm.pkg.github.com`. With that line in a user `~/.npmrc`, `npm config get @websublime:registry` from the repo root returns `https://registry.npmjs.org/` once the repo `.npmrc` sets the key. A `checkDenylist` probe flags `src/.env`, `dist/.secret/x.js`, `dist/a.pem`, and `src/b.key`, and passes `dist/index.js`. |
| AM-038 | 2026-10-06 | ledger `00-F3` pre-implementation investigation (decision — Miguel chose npm trusted publishing bootstrapped by a short-lived token over a granular token only and over staged publishing) | Six changes; versions, `exports`, `files`, and the dependency graph are unchanged. (1) §4.1–§4.8: every published `package.json` declares `"repository": { "type": "git", "url": "git+https://github.com/websublime/line-ui.git", "directory": "packages/line-<name>" }`. (2) §6.F.5 `release.yml` block: workflow-level `permissions` (`contents: write`, `pull-requests: write`, `id-token: write`), `concurrency: { group: release-${{ github.ref }}, cancel-in-progress: false }`, job `timeout-minutes: 30` and `environment: npm`, a `name:` on every step, `actions/checkout@v7`, `actions/setup-node@v6` with `node-version: '24'`, `package-manager-cache: false` and no `registry-url`, and a step that fails unless npm ≥ 11.5.1 and Node ≥ 22.14.0. Checkout keeps its credentials. `changesets/action@v1` with `publish: bun run release` is unchanged, and `NPM_TOKEN` stays in its env as the optional fallback. (3) §6.F.5 Publish path: an **Auth** paragraph replaces "npm reads `NPM_TOKEN` through the auth line … OIDC later": OIDC first (tarball publishes included), the token only as the bootstrap fallback written when non-empty, no `registry-url`, provenance from trusted publishing, publish triggers limited to `push` and `workflow_dispatch`, and the `npm` environment (deployment branch policy `main` only, Environment name on every trusted-publisher connection, `NPM_TOKEN` as an environment secret) as the branch gate. Both publishing jobs (`release.yml`, `snapshot-deploy.yml`) declare `environment: npm`. (4) §6.A A4: the bootstrap token needs publish access; the first canary uses it and a later one uses OIDC. (5) §7.2: a bullet for the auth model and the bootstrap order that verifies §9.5 and §9.6 after the merge. Step (0) deletes the repository-level `NPM_TOKEN` and creates or configures the `npm` environment with its `main`-only policy, because the merge's own `release.yml` run may already have auto-created it unprotected. That run only manages the Version PR, and the environment holds no secret yet. The `snapshot-deploy.yml` trusted publishers are validated by an OIDC canary within 48 hours, and the `release.yml` ones are created within the 48 hours before the Version PR merge. (6) §7.2: a bullet for the Version PR. Its `checks.yml` run waits for approval (or a close and reopen) before the Phase 00 exit merge, and `release.yml` does nothing while every pending changeset is empty. | npm revoked every classic token on 2025-12-09, so the repository-level `NPM_TOKEN` secret (created 2021-04-01, before granular tokens existed) is assumed dead. Granular write tokens last at most 90 days, and direct publishing with a granular token is removed in January 2027, so the token flow the spec described has an end date. Trusted publishing keeps no standing secret and adds provenance, but it is configured per package on npmjs.com, and all 8 packages return E404, so a short-lived token publishes the first canary and then goes. A trusted publisher expires 48 hours after creation unless a publish validates it; a `release.yml` publisher created at bootstrap would expire long before the Phase 00 exit merge, so it is created just before that merge. Rejected: a granular token only (90-day rotation, direct publishing removed January 2027); staged publishing (each version waits for a maintainer 2FA approval, heavy for canaries). The trusted publisher matches only the owner, repository, workflow filename, and optional environment, and GitHub runs the workflow file from the dispatched or pushed ref, so without an environment a non-`main` ref could publish (a dispatch of `snapshot-deploy.yml`, or a pushed `release.yml` with an edited trigger). The `npm` environment's branch policy closes that, and keeping the bootstrap token in the same environment gates it the same way. The policy is an explicit bootstrap step because a referenced environment that does not exist is auto-created without protection rules. `registry-url` is avoided because it moves npm's user config away from the `~/.npmrc` that `changesets/action` writes and, in setup-node v6, exports a placeholder token. Checkout keeps credentials because the action pushes the Version PR branch and the release tags with `git push`. `actions/checkout@v7` because runners no longer ship Node 20 and `checkout@v4` declares `node20`. The Version PR's checks need a human because PRs opened or updated with `GITHUB_TOKEN` get approval-required runs; no PAT or GitHub App is introduced. | npm docs: https://docs.npmjs.com/trusted-publishers (last edited 2026-09-30: npm CLI ≥ 11.5.1 and Node ≥ 22.14.0; `id-token: write`; per-package configuration with owner, repository, workflow filename and "Environment name (optional)"; `repository.url` must exactly match the GitHub repository; connections created after 2026-09-03 allow `npm stage publish` and `npm publish` must be ticked; `workflow_dispatch` runs are validated against the calling workflow's filename; automatic provenance for public packages from public repositories) and https://docs.npmjs.com/about-access-tokens (last edited 2026-09-10: only granular tokens since November 2025; direct publishing with granular tokens removed in January 2027). GitHub changelogs: https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available (classic tokens permanently revoked; write tokens limited to 90 days), https://github.blog/changelog/2026-10-02-unvalidated-npm-trusted-publishing-configurations-now-expire (48-hour expiry until the first successful publish; trusted-publishing tokens from `issue_comment` and `pull_request_target` rejected), https://github.blog/changelog/2026-06-11-bot-created-pull-requests-can-run-workflows-if-approved (PRs from `github-actions[bot]` run workflows once a user with write access approves) and https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions. GitHub docs: "Deployments and environments" (environment secrets are available only to jobs that reference the environment; **Selected branches and tags** matches the run's `GITHUB_REF`), "Managing environments for deployment" (running a workflow that references a missing environment creates it with no protection rules or secrets), "OpenID Connect reference" (`environment` claim; subject `repo:ORG/REPO:environment:NAME`), "Triggering a workflow" (a PR created or updated with `GITHUB_TOKEN` creates `pull_request` runs in an approval-required state; other `GITHUB_TOKEN` events create none), and "Using secrets" (an unset secret expands to an empty string). npm CLI v11.19.0 (bundled with Node 24.21.0): `lib/commands/publish.js` reads the manifest of any spec (l.96–97, tarballs through `pacote.manifest` l.292) and calls `oidc()` for it (l.147); `lib/utils/oidc.js` returns without changing the config when the exchange fails (l.120–132), sets the exchanged token over the configured one (l.140–141), and enables provenance only after a successful exchange for a public repository and package (l.144–167); `workspaces/libnpmpublish/lib/publish.js` signs a subject with the tarball sha512 (l.137–145). Node dist index: 24.11.0+ (LTS) bundle npm ≥ 11.6.1, 22.x bundle npm 10.9.x. `changesets/action` `v1` branch = `a45c4d5` (v1.9.0, 2026-06-03): `src/index.ts:78-109` writes `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` to `$HOME/.npmrc` only `if (process.env.NPM_TOKEN)` and only on the publish branch, l.110-116 log OIDC use otherwise, l.154-156 return with "All changesets are empty; not creating PR" when every changeset is empty; `src/git.ts:12,91` push with `git push`, the Version PR branch with `--force`. `actions/setup-node` v6 (`2499707`, `runs.using: node24`) `src/authutil.ts:44-52` writes `$RUNNER_TEMP/.npmrc` and exports `NPM_CONFIG_USERCONFIG` and a placeholder `NODE_AUTH_TOKEN`, only when `registry-url` is set (`src/main.ts:64-67`). `actions/checkout` `action.yml`: `v4` declares `node20`, `v5`/`v6`/`v7` (`3d3c42e`, latest v7.0.1) declare `node24`. Registry acceptance of the URL form: `vite@8.3.3` (trusted publisher `github`, SLSA v1 provenance) declares `git+https://github.com/vitejs/vite.git` with `directory: packages/vite`, and `vite@8.3.0-beta.1` (2026-09-07, before the opt-in dist-tag permission of 2026-09-30) went out under `beta` the same way, so a non-`latest` `--tag` needs no extra permission; npm/cli#8036 shows the comparison is case-sensitive (`websublime/line-ui` is the exact repository name). `bun pm pack` (Bun 1.3.14) keeps `repository` in the packed `package.json` (probe). GitHub API: secret `NPM_TOKEN` created 2021-04-01; `websublime/line-ui` is public. None of the 8 package manifests declares `repository`. Not verified: a live OIDC publish from this repository, which is bootstrap step (5). Record in `docs/context/00-f3.md`. |
| AM-039 | 2026-10-06 | ledger `00-F3` pre-implementation investigation (decision — Miguel chose two manual-dispatch workflows, a dry-run snapshot-version and an ephemeral snapshot-deploy, over a canary on every push to main and over the legacy PR-driven two-step flow) | Four changes; versions, `exports`, and the publisher's upload, tag, and dry-run contract are otherwise unchanged. (1) §6.F.5: the snapshot paragraph ("manual-dispatch and/or push-to-`main` flows") becomes two YAML blocks plus one paragraph. `snapshot-version.yml`: `workflow_dispatch` only; `permissions: { contents: read, pull-requests: read }`; `actions/checkout@v7` with `fetch-depth: 0` and `persist-credentials: false`; the AM-038 Node 24 setup and npm/Node assertion, so the plan uses the deploy toolchain; install, `bun run snapshot:version` with `GITHUB_TOKEN`, build, then `bun run snapshot:publish --dry-run` under `shell: bash` (pipefail) with the plan copied to the job summary; no upload, commit, tag, push, npm credential, or `id-token`. `snapshot-deploy.yml`: `workflow_dispatch` only; `permissions: { contents: read, pull-requests: read, id-token: write }`; `concurrency: { group: snapshot-deploy, cancel-in-progress: false }`; job `environment: npm` (AM-038); a first step that fails with "canaries publish only from main" unless `github.ref` (read through `env`) is `refs/heads/main`; `actions/checkout@v7`; the AM-038 Node 24 setup and npm/Node assertion; install, `snapshot:version`, build, the token fallback line written only when `NPM_TOKEN` is non-empty, then `bun run snapshot:publish` in the same job; no commit, tag, or push. (2) §6.F.5 Publish path step 3: the registry check runs for every package before any pack or upload. (3) §6.F.5 Publish path: new **Snapshot guard** — with `--tag canary`, every package planned as `publish` must carry `<major>.<minor>.<patch>-<git rev-parse HEAD>-SNAPSHOT`, else the run fails before the first pack or upload and lists every offender (`--dry-run` included); the check is an exported pure function. (4) §9.6: the snapshot criterion reads manual dispatch, dry run, and `main`-only canary instead of "manual dispatch and/or push-to-`main`". | The spec left the triggers and the split of the two snapshot workflows open. A canary on every push to `main` was rejected because it publishes a version per merge whether or not anyone needs it. The legacy two-step flow was rejected because it commits snapshot versions through a PR into `changeset-snapshot/**` and publishes from `pull_request_target`, which widens the attack surface and is an event npm rejects for trusted publishing (AM-038). The publisher uploads every publishable package whose version is not in the registry, and `changeset version --snapshot` keeps the current version of a package with no pending changeset and no dependency bump (release type `none`), so before the first stable release an unpublished `0.0.0` would go out under `canary` and a dependent's snapshot would depend on it. The guard has to see the whole plan, so step 3 runs for all packages first; failing the run matches the publisher's fail-fast rule. `snapshot:version` fails without a GitHub token, so both workflows pass `GITHUB_TOKEN` with only the read scopes its query is expected to touch. Versioning runs before the build so built output sees the snapshot versions. The `main` check is a failing step rather than a job-level `if:` so a dispatch from another ref shows a red run instead of a skipped one, and it backs up the `npm` environment policy (AM-038) if that policy is missing. The ref goes through `env` so no expression is interpolated into the script. `checkout@v7` because runners no longer ship Node 20 and `checkout@v4` declares `node20`. | `docs/context/00-f3.md` probes (Bun 1.3.14, `@changesets/cli` 2.31.0): `bun run snapshot:version` without `GITHUB_TOKEN`/`GH_TOKEN` fails inside `@changesets/changelog-github`; with a token it writes `<version>-<40-char sha>-SNAPSHOT`; after `bun run build`, `bun run snapshot:publish --dry-run` plans 8 × `publish`, `tag=canary`, order colors, core, schemas, themes, tokens, icons, utils, components. `@changesets/get-github-info` 0.8.0 (`dist/changesets-get-github-info.cjs.js`): token from `process.env.GITHUB_TOKEN` (l.87), throws without it (l.153-154), GraphQL query reads `repository.object(expression: <sha>)` with `associatedPullRequests` and `pullRequest(number)` (l.95-135). `@changesets/cli` 2.31.0 `dist/changesets-cli.cjs.js:1369` fills `{commit}` from `getCurrentCommitId`, which runs `git rev-parse HEAD` (`@changesets/git` 3.0.4, l.257-264); `@changesets/assemble-release-plan` 6.0.10 `getSnapshotVersion` returns `release.oldVersion` for type `none` and `<calculated>-<suffix>` otherwise (l.469-485); `@changesets/git` deepens shallow clones with `git fetch --deepen` (l.161-165). `.changeset/config.json`: `changelog` = `@changesets/changelog-github`, `snapshot.prereleaseTemplate` = `{commit}-SNAPSHOT`, `snapshot.useCalculatedVersion: true`. GitHub workflow syntax docs: an unspecified shell runs `bash -e {0}`, `shell: bash` runs `bash --noprofile --norc -eo pipefail {0}`; concurrency group names must be unique across workflows. GitHub "Deployments and environments" docs: a deployment branch rule is matched against the run's `GITHUB_REF`. `actions/checkout` `action.yml`: `v4` declares `node20`, `v7` (`3d3c42e`, latest v7.0.1) declares `node24`; https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions. PRD §6.4 (snapshot releases for canary testing) and §6.5 (`snapshot-deploy.yml`, `snapshot-version.yml`). Legacy workflows (`git show 939cad2^:.github/workflows/snapshot-version.yml` / `snapshot-deploy.yml`): pnpm, `snapshot-version` on `workflow_dispatch` running `pnpm snapshot:version` through `changesets/action`, `snapshot-deploy` on `pull_request_target` for `changeset-snapshot/**` running `pnpm snapshot:publish`. `actionlint` 1.7.12 with shellcheck reports no findings on the three §6.F.5 blocks extracted to a scratch repository. Not verified: that `contents: read` + `pull-requests: read` is the minimum the GraphQL query accepts; the first `snapshot-version.yml` run after the merge exercises it. |
| AM-040 | 2026-10-06 | ledger `00-F3` Verify gate (security-reviewer F3-SEC-01, -02, -04, -05, -06) | Four hardening changes. No requirement changes, and Miguel's AM-038 / AM-039 decisions stand. (1) §6.F.5 `release.yml`, `snapshot-version.yml`, `snapshot-deploy.yml`: every `uses:` pins a full 40-character commit SHA with a trailing `# vX.Y.Z` comment: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`, `oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0`, `actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6.5.0`, and `changesets/action@a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d # v1.9.0`. The comments that sat on those `uses:` lines move to the step's `name:` line, and each `steps:` line notes the SHA pins. Publish path step 7 names the pinned commit instead of "a floating branch". `checks.yml` is unchanged. (2) The same three blocks build only the packages (`bun --filter './packages/*' build`); `checks.yml` keeps the two-phase `bun run build` (AM-029). (3) §6.F.5 Publish path gains a **Stable guard**, the mirror of the snapshot guard. With any tag other than `canary`, a package planned as `publish` whose version has a prerelease part fails the run before the first pack or upload, and the error lists every offender (`--dry-run` included). The check is an exported pure function with unit tests. (4) §7.2 bootstrap. Step (0) is done before the PR that adds the workflows merges, with exactly one deployment rule (Ref type Branch, name `main`, no wildcard, no tag rule). Step (1) spells out the token: Packages and scopes = Read and write (publish and stage) limited to `@websublime`, Organizations = No access, expiry 1 day (at most 7), Bypass 2FA. The token is revoked and the environment secret deleted right after the first canary (new step 3), before the trusted publishers are added (now step 4). A new step (6) sets "Require two-factor authentication and disallow tokens" on each package once the OIDC canary has validated the connections. | (1) The publishing jobs hold `id-token: write` and the `npm` environment, and `release.yml` also holds `contents: write`. A moved tag, or a push to the `changesets/action` `v1` branch, would run at once with that authority (F3-SEC-01). A commit SHA cannot move, so every bump becomes a deliberate edit. (2) The publisher and its pack checks read only `packages/*/dist`. Building the apps brought the Storybook and Astro dependency trees into jobs that can mint OIDC tokens and gave the publisher nothing (F3-SEC-04). (3) The canary guard worked in one direction only. Snapshot versions that reach `main`, for example a committed `snapshot:version` output, would ship under `latest` from `release.yml`, and npm's prerelease check does not fire because the publisher always passes `--tag` (F3-SEC-05). (4) An `npm` environment that the merge's own `release.yml` run creates starts with no protection rule. The bootstrap token is needed only for steps 1–2. Once trusted publishing works, any token with write access to `@websublime` can still publish until the packages disallow tokens (F3-SEC-02, F3-SEC-06). Dist-tag restrictions on trusted publishers are not specified, because their behaviour is unverified. | `gh api`, 2026-10-06. `actions/checkout`: tags `v7` and `v7.0.1` → commit `3d3c42e5aac5ba805825da76410c181273ba90b1`. `oven-sh/setup-bun`: `v2` and `v2.2.0` → `0c5077e51419868618aeaa5fe8019c62421857d6`. `actions/setup-node`: `v6` and `v6.5.0` → `249970729cb0ef3589644e2896645e5dc5ba9c38`. `changesets/action`: the annotated tag `v1.9.0` (`3841a0683d3cfa6dae0f9bb335290003010fe3f0`) dereferences to commit `a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d`, which is the head of branch `v1` (`compare/v1.9.0...v1` = `identical`). v1.9.0 is the highest `v1.*` tag, and that commit's `src/run.ts:101` holds the `New tag:` regex. npm/cli `lib/commands/publish.js:134-136` throws "You must specify a tag using --tag when publishing a prerelease version." only when the tag is the config default. https://docs.npmjs.com/trusted-publishers, "Recommended: Restrict token access when using trusted publishers": Settings → Publishing access → "Require two-factor authentication and disallow tokens"; the setting "only affects traditional token authentication. Your trusted publishers will continue to work normally". https://docs.npmjs.com/creating-and-viewing-access-tokens: the Packages and scopes permission "Read and write (publish and stage)", an Organizations section, the "Bypass two-factor authentication" checkbox, and a custom expiry that "must be at least 1 day in the future". A probe in a throwaway worktree of `436c707` (Bun 1.3.14) ran `bun --filter './packages/*' build`, which built no app `dist/`. After it, `scripts/verify-pack.mjs` reported 8 packages and 0 failures, and `bun run release --dry-run` planned 8 × `publish`. |
| AM-041 | 2026-10-06 | ledger `00-Z7` (decision — Miguel chose a stable 0.1.0 during Phase 00, before 2026-10-08, over letting the release.yml trusted publishers expire and recreating them at Phase 00 exit) | Six changes; versions, workflows, and the bootstrap order are otherwise unchanged. (1) §2 Non-Goals: "Stable npm releases. Phase 00 is RCs only." becomes stable releases beyond `0.1.x`. (2) §7.2 first-publish bullet: `0.1.0` ships during Phase 00, before 2026-10-08, through the Version PR merge instead of being anchored to Phase 00 exit, and later Phase 00 bumps follow the changeset rule in `docs/PROCESS.md` §6 (once a phase's minor has shipped, changesets use `patch`) so `0.2.0` stays Phase 1. (3) §7.2 Version PR bullet: drops "at Phase 00 exit" from the merge timing and gains a release runbook: (a) wait for the `release.yml` run after any push to `main` to force-push `changeset-release/main`; (b) confirm the head was force-pushed after the latest `main` commit, then approve the pending `checks.yml` run and merge (step (a) is the only guard against a stale merge that publishes nothing); (c) post-merge checks (the `release.yml` run, `latest` = `0.1.0` on all 8, `_npmUser` `GitHub Actions` with SLSA provenance, 8 tags and 8 GitHub releases); (d) recovery (**Re-run failed jobs**; missing GitHub releases created by hand). (4) §7.2: "No stable releases during Phase 00 — only RCs" becomes RCs as canary snapshots from `main`, no `next` branch, and the first stable release as the Version PR merge during Phase 00. (5) §9.9: "No stable releases — RCs only" becomes all 8 packages first published at `0.1.0` under `latest` by `release.yml` through trusted publishing with provenance, later bumps per `docs/PROCESS.md` §6, RCs as canary snapshots. (6) §2 Non-Goals and §7.2 point to `docs/PROCESS.md` §6 for the post-`0.1.0` bump instead of restating it. The §7.2 bootstrap text (the `release.yml` trusted publishers created within the 48 hours before the Version PR merge) stands. | A trusted publisher that no successful publish validates expires 48 hours after creation. Holding the Version PR until Phase 00 exit meant letting the `release.yml` connections expire and recreating them then; Miguel chose to validate them now with the first stable release. Releasing later Phase 00 work as `0.1.x` patches keeps `0.2.0` as Phase 1's minor (PRD §7.1); the rule is stated once, in `docs/PROCESS.md` §6. The runbook makes the merge and the trusted-publisher validation checkable: a force-push invalidates an earlier `checks.yml` approval, and the action pushes tags and creates releases per package, so a partial failure can leave tags without releases. Partially supersedes PRD v0.8.4 (F-1); the no-`next`-branch and canary-RC parts stand. | https://github.blog/changelog/2026-10-02-unvalidated-npm-trusted-publishing-configurations-now-expire (48-hour expiry until the first successful publish). `snapshot-deploy.yml` run 37474782644: OIDC publish of all 8 packages with SLSA v1 provenance, validating the `snapshot-deploy.yml` connections. Version PR #218 bumps all 8 packages to `0.1.0` (ledger `00-Z6`, #219). PRD v0.8.5. `changesets/action` `a45c4d5` `src/run.ts:123-125` (per-package tag push and GitHub release). Record in `docs/context/00-z7.md`. |
| AM-042 | 2026-10-06 | ledger `00-F10` (factual corrections after the first canary, the OIDC canary, and the 0.1.0 release) | Factual additions and corrections; no requirement, workflow, or bootstrap-order change. (1) §6.F.5 snapshot paragraph: "the first `snapshot-version.yml` run after the merge confirms that these two scopes suffice" becomes the observed fact that `contents: read` and `pull-requests: read` suffice; the RC sentence adds the observed behaviour that when a package had no `latest`, npm set `latest` to the version published with `--tag canary`. (2) §6.F.5 Publish path: npm processes publishes asynchronously; a version the CI log reports as published becomes visible about 0.5–6 minutes later, its tarball can trail its manifest by about 5 more minutes, installs fail with E404 in that window, a re-run before the manifests are visible would plan `publish` again and is expected to be rejected for the existing version (not observed), so wait for `npm view` first, and anything that installs waits until `curl -sI` on the version's `dist.tarball` returns `HTTP/2 200`. (3) §7.2 bootstrap bullet: the opening is put in the past tense (the token existed only for the first canary, before any package existed; no `NPM_TOKEN` remains); observed: the first publish set `latest` to the bootstrap canary on all 8 until `0.1.0`; npm created `0.0.0-stage` placeholder versions on 5 packages, which no dist-tag points at; the bootstrap is complete (steps (0)–(6) done on 2026-10-06, the `release.yml` connections validated by the `0.1.0` publish). (4) §7.2 runbook step (c): wait until every `0.1.0` tarball resolves (the exact `curl -sI` check) before installing or judging a check failed. (5) §7.2 RC bullet: records the `0.1.0` release outcome. (6) §7.2 first-publish bullet: "(initial publish)" becomes "(first stable release)"; §9.9: "All 8 packages first published at `0.1.0` under `latest`" becomes "First stable release `0.1.0` of all 8 packages published under `latest`", because `0.1.0` was not the first version of any package (the e94e2a8 canary, and on 5 packages `0.0.0-stage`, came first). | The bootstrap and runbook were written before any package existed, so they said nothing about `latest` on a first publish, treated a version as installable once the CI step logged it, and left the read scopes to be confirmed. The first publishes showed otherwise, and an operator running runbook step (c) right after the merge would have seen E404 on a correctly published package. The `latest` behaviour and the `0.0.0-stage` versions are recorded as observed behaviour; their cause is internal to npm, and the `latest` behaviour contradicts npm's dist-tag docs ("Publishing a package sets the latest tag to the published version unless the --tag option is used"), so the rule is keyed on what was seen (no `latest` yet), not on "first version": on the 5 packages with `0.0.0-stage`, that placeholder is the first version, yet `latest` went to the canary. Factual corrections, so no decision (`docs/PROCESS.md` §3). | All observed 2026-10-06. `snapshot-deploy.yml` run 37456833604 (`e94e2a8`, token): every package uploaded with `npm publish <tgz> --tag canary` (log "Publishing to https://registry.npmjs.org/ with tag canary"), yet `dist-tags.latest` was that `0.1.0-e94e2a8…-SNAPSHOT` (`0.0.1-…` for `line-themes`, `line-components`) on all 8. `snapshot-deploy.yml` run 37474782644 (`1b3a3c2`, OIDC): `canary` moved, `latest` did not; `snapshot:version` ran with `contents: read` + `pull-requests: read` and `@changesets/changelog-github` succeeded. `release.yml` run 37483208484 (`10efd04`, #218 merged 14:56:42Z) set `latest` = `0.1.0` on all 8. `0.0.0-stage` on `line-colors`, `line-schemas`, `line-themes`, `line-utils`, `line-icons`: description "Temporary package placeholder for staged publishing", `_npmUser` miguelramos, created within 2 s of each package's first CI publish (`line-colors` 11:30:45.968Z), exactly the 5 whose first publish printed "Your package is being processed and may take a few minutes to become available"; later publishes created none. Every OIDC publish (runs 37474782644, 37483208484) printed that message; versions became visible about 0.5–6 min after their CI step (`line-themes` token canary registered 34 s after its step; run 37483208484 logged `+ @websublime/line-colors@0.1.0` at 14:57:22Z and `+ …line-tokens@0.1.0` at 14:57:42Z, registry times 15:03:09.949Z and 15:03:29.713Z, about 5m47s; `0.1.0`: 0/8 visible at 14:58:41Z, 8/8 at 15:03:56Z). `line-schemas@0.1.0` manifest time 15:01:16.603Z, but https://registry.npmjs.org/@websublime/line-schemas/-/line-schemas-0.1.0.tgz returned 404 (also with a cache-busting query) until 15:06:32Z. Bootstrap steps: (0) the `npm` environment's deployment branch policy is the single branch rule `main` and (1)/(3) no `NPM_TOKEN` remains in the repository or the `npm` environment (`gh secret list`, `gh secret list --env npm`, `gh api repos/websublime/line-ui/environments/npm/deployment-branch-policies`, checked 2026-10-06); (2) run 37456833604; (4)/(5) run 37474782644; (6) "Require two-factor authentication and disallow tokens" on all 8, confirmed by Miguel and recorded in `docs/context/00-z7.md`. Outcome: 8 × `0.1.0` under `latest`, `_npmUser` GitHub Actions, SLSA v1 provenance, 8 tags `@websublime/line-*@0.1.0`, 8 GitHub releases (Latest = `@websublime/line-colors@0.1.0`); a fresh install resolves all 8 at `0.1.0` and `npm audit signatures` reports verified attestations. Note on AM-041's premise: the `release.yml` trusted-publisher connections did not exist when `00-Z7` was decided (npmjs.com settings at ~14:40Z showed only the `snapshot-deploy.yml` connection on `line-colors`); Miguel created them on all 8 packages just before merging #218 at 14:56:42Z, and the `0.1.0` publish validated them at once. The `snapshot-deploy.yml` connections had been validated by run 37474782644. The AM-041 row and PRD v0.8.5 stand as records. |
| AM-043 | 2026-10-07 | ledger `00-Z11` (decision — Miguel chose agent-driven UI support from the first component, with a firm agent contract and catalog and a preview A2UI renderer, over shipping everything stable now and over an exploratory track like HTMX; chose the foundation as the first Phase 1 stream with only the agent contract entering Phase 00 through the G4 template, over a new Phase 00 stream and over shipping after Phase 2) | One change to the §6.G `COMPONENT-SPEC-TEMPLATE.md` bullet. Its required sections gain "Agent contract" between A11y and Tests. The section states how the component meets rules C1–C8 (ARCHITECTURE §17.2) and fills the descriptor fields (ARCHITECTURE §17.3), including the `agentExposed` flag with a reason when it is `false` (Decision 7). Phase 00 still ships 8 packages; no package, version, or workflow changes. | PRD v0.8.6 makes every component agent-ready, and `@websublime/line-genui` (Phase 1) reads one descriptor per component. The first Phase 1 specs come from this template, so the contract must be in the template before they are written. | PRD v0.8.6 revision entry; ARCHITECTURE §17; `docs/research/00-research-generative-ui.md` §4.3 and §6 (row `00-Z10`, PR #223); record in `docs/context/00-z11.md`. |
| AM-044 | 2026-10-07 | ledger `00-Z9` (decision — Miguel chose Cloudflare Pages over GitHub Pages, per-PR previews over production-only deploys, and a separate Cloudflare account for previews over per-run approvals and over a single account) | Four changes; the production project `line-ui-storybook` and the Storybook build output are unchanged. (1) §6.F.5 `deploy-storybook.yml` block. `push` to `main` and `pull_request` into `main` trigger it, and both paths filters list `apps/storybook/**`, `packages/**`, `.github/workflows/deploy-storybook.yml`, `bun.lock` and `.bun-version`; the workflow uses neither `pull_request_target` nor `workflow_dispatch`. Workflow-level `permissions: {}` and `concurrency: { group: deploy-storybook-${{ github.ref }}, cancel-in-progress: true }`. A `build` job holds no secrets and runs on push and on pull requests whose head repository is this repository, so forks are skipped. It has `permissions: { contents: read }`, builds `./packages/*` before Storybook (AM-029), and uploads `apps/storybook/storybook-static` as an artifact (`if-no-files-found: error`, `retention-days: 1`). A `deploy` job needs `build`, has `permissions: { contents: read }`, and selects the environment `storybook-production` on push and `storybook-preview` on pull requests. It sparse-checks out only the root `package.json`, `bun.lock`, `.bun-version` and the workspace manifests of the base commit, sets up Bun with `no-cache: true` (F7 confirms the input name against the setup-bun v2.2.0 `action.yml`), runs `bun install --frozen-lockfile --ignore-scripts`, downloads the artifact, and deploys with the locked wrangler (`bun x --no-install wrangler pages deploy "$STATIC_DIR" --project-name="$PAGES_PROJECT" --branch="$DEPLOY_BRANCH" --commit-hash="$COMMIT_SHA" --commit-dirty=false`). The token, account ID and project name come from the environment's secrets and variable. `DEPLOY_BRANCH` is `pr-<number>` on pull requests and `main` on push, and `COMMIT_SHA` is the pull request's head SHA or the pushed SHA; every value reaches the shell through `env:`, never through `${{ }}`. The summary step prints the `alias` (or `url`) of the `pages-deploy-detailed` output entry to `$GITHUB_STEP_SUMMARY` through env variables, and F7 confirms those field names against the locked wrangler. Every `uses:` pins a full 40-character commit SHA with a trailing `# vX.Y.Z` comment. It reuses the AM-040 SHAs for `actions/checkout` (`3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`) and `oven-sh/setup-bun` (`0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0`), and pins `actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2` and `actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2`. It replaces `cloudflare/wrangler-action@v3`, because that action runs its `command` input without a shell, so a per-PR branch could only reach it through a `${{ }}` expression. (2) §6.F.5 prose under the block. It explains the build/deploy split, production versus preview accounts, the fork and dependency-bot skips and the absent `pull_request_target`. It adds the Storybook bootstrap, whose steps 1–6 run before F7's pull request opens; step 7 is part of F7's diff. The bootstrap creates both projects with production branch `main` and one Pages-Edit token per account with an expiry and a rotation date. It then creates both GitHub environments with their policies before any secret is added, because GitHub auto-creates a referenced environment with no protection rules. `storybook-production` uses Selected branches and tags with one rule (Ref type Branch, name `main`, no wildcard, no tag rule), and `storybook-preview` has no branch policy because it must admit `refs/pull/<number>/merge`. A same-repo test pull request that references `storybook-production` must be rejected before any secret is stored there. The environment secrets and variable follow, with no repository-level Cloudflare secret, and `wrangler` becomes an exact devDependency of `apps/storybook`. A sentence states that the `deploy` job fails by design on F7's own pull request, because its base commit has no locked wrangler. The residual-risk paragraph covers the preview token, preview content built from the pull request (`_worker.js` Functions, `_routes.json`, `_headers`, `_redirects`) running only in the preview account, the `refs/pull/<number>/merge` evaluation of branch rules, and the repository-level token that would bypass them. (3) §6.F.5 note under `deploy-site.yml`. Row F5 pins its actions to SHAs (AM-040 pattern) and reads its own Cloudflare token, not the Storybook ones, from a GitHub environment with a `main`-only branch policy (for example `site-production`); this repository holds no repository-level Cloudflare secret. (4) §9.6. The Storybook exit criterion requires a production deploy verified on push to `main` (`storybook-production` → `line-ui-storybook`) and a preview verified on a same-repo pull request (`storybook-preview` → the `pr-<number>` alias in the preview account), with the bootstrap as its prerequisite. F7 verifies production on its merge push and the preview on the first later same-repo pull request into `main` that touches a filtered path. | PRD §5.4 named GitHub Pages and promised per-PR previews, while §6.F.5 already deployed to Cloudflare Pages on push to `main` only. Miguel settled the host on Cloudflare Pages and kept the previews; PRD v0.8.7 records the decision. Review gate iteration 1 found that a single-job workflow exposes the deploy token to pull-request code; Miguel isolated previews in a separate account, and the split jobs keep pull-request code away from every token. Review gate iteration 2 found that a repository-level Cloudflare token or an unverified environment policy would reopen the path to production, and that F7's own pull request cannot deploy. | `docs/context/00-z9.md` (decisions 1–3, the review-gate defaults and the iteration-2 fixes, Miguel, 2026-10-07); PRD v0.8.7 §5.4 and §6.1; the §6.F.5 block before this change (`on: push` to `main` only); `cloudflare/wrangler-action` v3.15.0 `dist/index.mjs` (`exec.exec` of the `command` input, no shell); `gh api repos/actions/{upload,download}-artifact/git/ref/tags/…` (2026-10-07); [GitHub changelog, 2025-11-07](https://github.blog/changelog/2025-11-07-actions-pull_request_target-and-environment-branch-protections-changes/) (from 2025-12-08, environment branch rules for `pull_request` events evaluate `refs/pull/<number>/merge`); AM-038 (`npm` environment policy shape). |

**A4 — npm scope.**

- Confirm npm organisation `@websublime` exists and the short-lived bootstrap token (§7.2, AM-038) has publish access to it. (Repo metadata already declares `@websublime/line-*` names.)
- Each published package declares `"publishConfig": { "access": "public" }`.
- Snapshot/canary publishing verified by `bun run snapshot:publish` once Stream F lands. The script runs the §6.F.5 publisher `scripts/publish.mjs` with `--tag canary` and `--no-git-tag`, so it uploads canary tarballs and creates no git tags (AM-036). Phase 00 publishes at least one snapshot to validate the pipeline end-to-end: the first canary authenticates with the bootstrap token and a later one through npm trusted publishing (OIDC), in the §7.2 bootstrap order (AM-038).

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
- `baseBranch`: `"main"` — RC / snapshot / canary publishing happens from `main`; there is no `next` branch (see AM-008).
- `linked`: `[]` — packages are **independently versioned**, not linked (see AM-009).
- `access`: `"public"`.
- `commit`: `false` (CI handles commits).
- `changelog`: `["@changesets/changelog-github", { "repo": "websublime/line-ui" }]`.
- `ignore`: `["@websublime/line-storybook", "@websublime/line-site"]` — the two apps are never published.
- Snapshot/canary scripts unchanged (already in root `package.json`).

**B5 — Verifiable surface at B5 time (AM-008/AM-009).** B5 is in Stream B and only configures `.changeset/config.json` — it does **not** author CI workflows. `release.yml`, `snapshot-version.yml`, and `snapshot-deploy.yml` are authored by Stream F (F3 / F4 per §6.F.5), and the end-to-end snapshot/canary publish from `main` is asserted there. The B5 verifiable surface is therefore: (1) `.changeset/config.json` matches the field list above (`baseBranch: "main"`, `linked: []`, `access: "public"`, `commit: false`, the `changelog`/`ignore` entries); and (2) a **local** `bunx changeset version --snapshot` dry-run succeeds against the configured workspace. The CI / branch-trigger verification is deferred to Stream F — this mirrors the AM-006 / AM-007 precedent (Stream B configures the plumbing; Stream F asserts the CI surface).

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

#### 6.C.3 `line-colors` — palette generation (C3 palette generation, C4 palette freshness guard)

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
  --line-{H}-1:  light-dark({H}.{H}1,        {H}Dark.{H}1);
  --line-{H}-2:  light-dark({H}.{H}2,        {H}Dark.{H}2);
  /* … through --line-{H}-12 */

  /* Alpha steps (sRGB) — light-dark() over alpha light + alpha dark */
  --line-{H}-a1: light-dark({H}A.{H}A1,      {H}DarkA.{H}A1);
  /* … through --line-{H}-a12 */

  /* Contrast (static single value per hue, NOT light-dark()) */
  --line-{H}-contrast: {PER_HUE_CONTRAST[H]};
}

/* Wide-gamut P3 override — same token names, automatic upgrade */
@supports (color: color(display-p3 1 1 1)) {
  @media (color-gamut: p3) {
    :where(html) {
      --line-{H}-1:  light-dark({H}P3.{H}1,      {H}DarkP3.{H}1);
      /* … through --line-{H}-12 */
      --line-{H}-a1: light-dark({H}P3A.{H}A1,    {H}DarkP3A.{H}A1);
      /* … through --line-{H}-a12 */
    }
  }
}
```

(The `{…}` placeholders above are pseudocode for the actual hex / `color()` strings the script substitutes.)

**Radix object-vs-step-key naming (critical for the generator).** In `@radix-ui/colors` the scale **object** name carries the variant (`Dark`, `P3`, `A`, and their combinations) — but the **step keys** do **not** repeat that suffix. Base scales are keyed `{H}{n}` and alpha scales are keyed `{H}A{n}`, regardless of the object's own suffix:

- `amber.amber1`, `amberDark.amber1`, `amberP3.amber1`, `amberDarkP3.amber1` — all keyed `amber1` (base).
- `amberA.amberA1`, `amberDarkA.amberA1`, `amberP3A.amberA1`, `amberDarkP3A.amberA1` — all keyed `amberA1` (alpha).

So the generator indexes the dark / P3 / dark-P3 base objects with the **base** step name (`{H}{n}`) and the alpha objects with the **`A`** step name (`{H}A{n}`) — never `{H}Dark{n}`, `{H}P3{n}`, `{H}P3A{n}`, etc. Indexing with the variant-suffixed key (e.g. `{H}Dark.{H}Dark1`) returns `undefined` and emits silently-broken CSS such as `--line-{H}-1: light-dark(#fefdfb, )`. The same rule governs `special.css`: the special alpha objects `blackP3A` / `whiteP3A` are keyed `blackA{n}` / `whiteA{n}` (NOT `blackP3A{n}` / `whiteP3A{n}`), matching their sRGB counterparts `blackA` / `whiteA`.

**Output for special scales:** `packages/line-colors/src/special.css`:
- `blackA` → `--line-black-a{1..12}` (sRGB), upgraded to `blackP3A` inside the `@supports` block.
- `whiteA` → `--line-white-a{1..12}` (sRGB), upgraded to `whiteP3A` inside the `@supports` block.

Light/dark are not relevant for the alpha-on-black or alpha-on-white scales — `blackA` is identical in both modes. The generator emits them outside `light-dark()`.

**Output barrel:** `packages/line-colors/src/index.css` = `@import` of all 31 hue files + `special.css`.

**Regeneration policy.** Generated CSS is **committed**. The script runs only when:
- `@radix-ui/colors` is bumped (the version pin in `package.json` changes), OR
- `PER_HUE_CONTRAST` is intentionally edited.

A CI check (`scripts/verify-palettes-fresh.mjs`) runs the generator into a temp dir on every PR and `diff`s against the committed `src/` outputs (`packages/line-colors/src/` — the generator's `--output` target; `dist/` is a gitignored postcss build artifact, not the generator output) — failing if drift is detected.

**C4 — Scope of the `CI (checks.yml) includes palette-freshness step` AC (AM-013).** The C4 deliverable is the guard script `scripts/verify-palettes-fresh.mjs` itself. Its verifiable surface at C4 time is *local*: invoked as `bun run scripts/verify-palettes-fresh.mjs`, it exits 0 against the unmodified committed `packages/line-colors/src/` tree and exits non-zero — naming the offending file — when a generated hue CSS file is hand-edited. `.github/workflows/checks.yml` does not exist at C4 time and is owned by Stream F → F4 (`line-ui-7qm.6.4`, infra-supervisor) per §6.F.5; the palette-freshness CI step is already enumerated in the §6.F.5 pipeline. C4 must NOT create or modify the workflow file — the CI wiring is asserted by F4, mirroring the AM-006 / AM-007 split for Stream B B4.

**Contrast validation (C5):** `scripts/validate-contrast.mjs` computes the WCAG AA contrast ratio for each (`H`, step 9, `PER_HUE_CONTRAST[H]`) triple in both light and dark mode, using the WCAG 2.1 luminance formula. The script:
- Loads the hex values directly from `@radix-ui/colors` (base scales — P3 variants are not contrast-validated because P3 is a colour-space upgrade, not a luminance change).
- For each hue × {light, dark}: requires ratio ≥ 3:1 (WCAG AA for large text / non-text UI — the floor Radix engineers step-9 solid surfaces and their paired contrast tokens to; AM-014. The previously specified 4.5:1 normal-text floor is unsatisfiable for the verbatim-adopted Radix palette: 34 of 62 combinations fail it, worst case 2.97:1).
- Carries an explicit, commented **allowlist of known upstream exceptions**, containing exactly one entry: `orange` in both light and dark mode (`#f76b15` step 9 vs white contrast token = 2.97:1 — an upstream Radix Colors characteristic; AM-014). Each allowlist entry records its documented measured ratio; an allowlisted pair is reported as a warning instead of failing, but the validator fails if its computed ratio drops below the recorded value (guards against silent regression on a Radix bump).
- Fails the build on any non-allowlisted violation, printing the failing hue + ratio.

The script is run in CI on every PR and as part of `bun run build` for `line-colors`.

**C5 — Scope of the `CI includes contrast validation step` AC (AM-014).** The C5 deliverable is the validator script `scripts/validate-contrast.mjs` itself plus its `line-colors` build-script wiring (previous paragraph). Its verifiable surface at C5 time is *local*: `bun run scripts/validate-contrast.mjs` exits 0 against the committed palette (emitting the orange allowlist warnings) and exits non-zero — naming the offending hue, mode, and ratio — when a non-allowlisted pair falls below 3:1. `.github/workflows/checks.yml` is owned by Stream F → F4 (`line-ui-7qm.6.4`, infra-supervisor) per §6.F.5 — the `bun run scripts/validate-contrast.mjs` step is already enumerated in that pipeline — and C5 must NOT create or modify the workflow file, mirroring the AM-013 split for C4.

#### 6.C.4 `line-themes` — role mappings, semantics, aliases, defaults (C6)

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

Test stack: Bun test on the **happy-dom** harness authored by F2 (§6.F.3, `line-ui-7qm.6.2`) — C9 depends on F2 and does not provision its own DOM library (AM-015 reconciles the earlier 'minimal jsdom' wording with §6.F.3). All CSS assertions are **string-based** (committed-CSS string matching); no `getComputedStyle()`/`var()` resolution is relied upon.

**Snapshot serializer.** Phase 00 uses **Bun test's built-in snapshot serializer** (`expect(...).toMatchSnapshot()` writing to `__snapshots__/*.snap` files). No custom serializer is configured — the default string-form serialization is sufficient for CSS string assertions, and the snapshot files are deterministic across machines because the inputs (committed generated CSS) are themselves byte-stable. If Phase 1 introduces non-string snapshot targets (e.g., DOM trees, custom-element render output) and the default serializer proves limiting, the serializer choice will be revisited then; Phase 00 does not pre-commit a swap path.

Tests live in `packages/line-themes/__tests__/`:

| Test | Asserts |
|---|---|
| `palette.snapshot.test.ts` | For each hue: `dist/{hue}.css` matches a committed snapshot in `__snapshots__/`. |
| `role-mapping.snapshot.test.ts` | For each hue × accent role: `dist/accent/{hue}.css` matches a snapshot. Same for gray. |
| `auto-pair.behaviour.test.ts` | Asserts the auto-pair cascade by **string-matching the committed `src/defaults.css`** role-map rules (AM-015 — `getComputedStyle()` cannot resolve the `var()`/`light-dark()` chain under happy-dom). Verifies the same four cases: default (no attrs), explicit accent only (auto-pair), explicit accent + gray, and nested scope override (`:where([data-accent="X"]:not([data-gray]))`, e.g. violet → slate). |
| `schema.test.ts` | Zod validators reject invalid hue/role inputs; valid inputs match the generated CSS file existence. |

**C9 — auto-pair verification method (AM-015).** The `auto-pair.behaviour.test.ts` row asserts behaviour by string-matching the committed `src/defaults.css` cascade rather than reading `getComputedStyle()`, because happy-dom (and jsdom) do not resolve the `var()`/`light-dark()` chain. C9 runs on F2's happy-dom harness (§6.F.3) and must NOT provision its own DOM library. The string-assertion method was confirmed by a spike (executed 2026-06-17, AM-020): happy-dom **can** resolve a trivial hex-terminated `var()` chain via `getComputedStyle()`, but it does **not** compute the production chain, whose terminal value is `light-dark(#hex,#hex)` (returned as the literal `light-dark(...)` text, and `""` for any property consuming it) — so a computed-style read is unworkable for the real role variables and the committed-CSS string assertion is required.

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
- Greenfield implementation (AM-021) — there is **no** prior in-tree Inspector implementation or consumers to preserve. The legacy `<ui-inspector>` custom element and its `InspectController` ReactiveController were deleted in the re-init commit `939cad2` and are architecturally incompatible with this mixin design (separate element model; legacy activation key was `line-inspector`). The authoritative activation contract is `localStorage.getItem('line-ui:inspector') === 'on'` as stated at the top of this section.

#### 6.D.3 Metadata mixin (D3)

`packages/line-core/src/mixins/metadata.ts`:

- Static class members: `version`, `docs` (URL string), `qa` (`string[]` of tags), `scope` (string).
- Surfaces them via host attributes when inspector is active (`data-line-version`, `data-line-docs`, etc.).
- Type-safe: components extend with `static version = '0.1.0'` etc.

#### 6.D.4 Direction mixin (D4)

`packages/line-core/src/mixins/direction.ts`:

- `DirectionMixin` has the signature `DirectionMixin<T extends Constructor<LitElement>>(Base: T): T & Constructor<LitElement & { readonly direction: 'ltr' | 'rtl' }>`, so `this.direction` type-checks in `LineElement` subclasses (AM-031).
- The mixin adds a read-only property `direction: 'ltr' | 'rtl'` holding the host's resolved directionality, read as `this.matches(':dir(rtl)') ? 'rtl' : 'ltr'`. It is a getter over private state with no attribute (`attribute: false`) and no public setter. The mixin never writes the host `dir` attribute and leaves the native `HTMLElement.dir` untouched.
- The value is recomputed on `connectedCallback` and whenever a `dir` attribute changes anywhere in the document, through **one** shared module-level `MutationObserver` on `document` (`subtree: true, attributes: true, attributeFilter: ['dir']`). Every connected host is recomputed on any document-level `dir` mutation. The observer starts on the first host connect and disconnects when the last host disconnects. A changed value calls `requestUpdate('direction', oldValue)`, so `changedProperties` carries it; an unchanged value does not.
- `dir="auto"` (on the host or an ancestor) resolves through the engine's `:dir()`.
- Component CSS targets RTL with `:host(:dir(rtl))`. Templates and `LineMachineController` consumers read `this.direction` (it feeds Zag's `dir` prop).
- The observer does not see `dir` changes made inside any shadow tree. This covers shadow-internal ancestors and a host's own `dir` when the host lives inside another shadow root (for example a parent template binding `dir=${…}` on an inner Line element). `:host(:dir(rtl))` CSS still updates there; `this.direction` stays stale until the next document-level `dir` mutation or reconnect.
- A text change under `dir="auto"` changes no attribute and does not trigger a recompute.
- Unit tests (`bun test`, happy-dom) cover the observer lifecycle and update triggering with `matches` stubbed, because happy-dom's `:dir()` always returns `false`.
- Browser tests (Playwright `*.e2e.ts`, chromium / firefox / webkit, fixture page `/direction/`) cover real resolution: RTL from `<html>`; RTL from a nested ancestor inside an LTR document; live flip of a nested ancestor; author `dir` on the host; `dir="auto"`; the mixin never adds a `dir` attribute to the host.

#### 6.D.5 FormAssociated mixin (D5)

`packages/line-core/src/mixins/form-associated.ts`:

```ts
import type { LineElement } from '../line-element.js';

type Constructor<T = {}> = new (...args: any[]) => T;

// Public surface, named so declaration emit can type the mixin result (AM-032).
export interface FormAssociatedMembers {
  setFormValue(value: File | string | FormData | null, state?: File | string | FormData | null): void;
  setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;
  reportValidity(): boolean;
  checkValidity(): boolean;
  readonly form: HTMLFormElement | null;
  readonly name: string | null;
  readonly type: string;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  formAssociatedCallback?(form: HTMLFormElement | null): void;
  formDisabledCallback?(disabled: boolean): void;
  formResetCallback?(): void;
  formStateRestoreCallback?(state: File | string | FormData | null, reason: 'autocomplete' | 'restore'): void;
}

export function FormAssociated<T extends Constructor<LineElement>>(
  Base: T,
): T & Constructor<FormAssociatedMembers> & { readonly formAssociated: true } {
  class FormAssociatedElement extends Base {
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
  }
  return FormAssociatedElement;
}
```

**Test stratification (research-mandated, R8 + B20–B23):**

| Tier | Runner | Environment | Covers |
|---|---|---|---|
| Unit | `bun test` + happy-dom + **mocked `attachInternals`** | Node-side | The mixin calls `setFormValue` / `setValidity` / `reportValidity` with the right arguments. The mock is a small helper in `packages/line-core/__tests__/mocks/element-internals.ts` (≤ 40 LOC). |
| Browser | Playwright | Real Chromium/Firefox/WebKit | End-to-end: a test page mounts a stub `<line-form-test>` inside `<form>`, submits, asserts the request body (or `FormData` instance), exercises reset, exercises HTML5 validation reporting. |

The browser tier's fixture page is `/form-associated/` (`packages/line-core/__tests__/integration/form-associated/`), served by the §6.F.4 `webServer` (AM-032).

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

Contents of each sheet are mandated by ARCHITECTURE §14.4 verbatim. Phase 00 ships **all 11 sheets** even though no component consumes them yet — they are part of the platform contract that Phase 1 will exercise. Under `bun test`, the `?inline` imports are served by the `css-inline` plugin registered in `bun-test-preload.ts` (§6.F.3, AM-026), because Bun's runtime does not implement Vite's `?inline` query.

**No consumer-facing export.** These sheets are consumed only by components inside the monorepo. The light-DOM consumer reset is the separate file at `@websublime/line-tokens/reset` (ARCHITECTURE §14.2 / PRD §9.9).

#### 6.D.8 Integration test — hello-world component

Per plan §7.3, a private (not-published) hello-world component is built using `LineElement` end-to-end:

```
packages/line-core/__tests__/integration/hello-world/
├── line-hello-world.ts        # uses LineElement + LineMachineController with a trivial machine
├── line-hello-world.test.ts   # bun test — mounts via @open-wc/testing-helpers fixture
├── index.html                 # Vite fixture page the e2e loads (AM-030)
└── line-hello-world.e2e.ts    # Playwright — renders in a real browser, asserts state transition
```

This is the canonical "the platform works" smoke test. It does not ship in any package's `dist/`. The e2e is served by the Vite dev server rooted at `packages/line-core/__tests__/integration/` and started through the Playwright `webServer` entry in §6.F.4 (AM-030, AM-031); it loads `/hello-world/`, whose `index.html` loads `line-hello-world.ts` as a module script, and Vite resolves the workspace TypeScript and `?inline` CSS imports without a build step.

### 6.E Stream E — Icon Registry

#### 6.E.1 Resolver contract (E1)

`packages/line-icons/src/index.ts`:

```ts
export type IconResolver = (name: string, options?: IconResolverOptions) => Promise<string | SVGElement>;

export interface IconResolverOptions {
  /** Library-specific options such as the Phosphor weight. The registry does not type them. */
  [key: string]: unknown;
}

export class IconRegistry {
  #resolvers = new Map<string, IconResolver>();

  register(library: string, resolver: IconResolver): void {
    this.#resolvers.set(library, resolver);
  }

  has(library: string): boolean {
    return this.#resolvers.has(library);
  }

  async resolve(library: string, name: string, options?: IconResolverOptions): Promise<string | SVGElement> {
    const resolver = this.#resolvers.get(library);
    if (!resolver) throw new Error(`[line-icons] No resolver registered for library "${library}".`);
    return resolver(name, options);
  }
}

// A shared registry instance for apps that need only one.
export const iconRegistry = new IconRegistry();

// The reference resolver factories validate the contract against two real libraries.
export { createLucideResolver } from './resolvers/lucide.js';
export { createPhosphorResolver } from './resolvers/phosphor.js';
```

#### 6.E.2 Reference resolvers (E1 — Lucide + Phosphor)

`packages/line-icons/src/resolvers/icon-name.ts` (internal; not re-exported from `src/index.ts`):

```ts
// Icon names are lowercase kebab-case, so a name cannot leave the icon directory.
const ICON_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertIconName(name: string): void {
  if (typeof name !== 'string' || !ICON_NAME.test(name)) throw new Error(`[line-icons] Invalid icon name "${name}".`);
}
```

`packages/line-icons/src/resolvers/lucide.ts`:

```ts
// Lucide ships one SVG file per icon.
import type { IconResolver } from '../index.js';
import { assertIconName } from './icon-name.js';

export function createLucideResolver(): IconResolver {
  return async (name) => {
    assertIconName(name);
    const mod = await import(/* @vite-ignore */ `lucide-static/icons/${name}.svg?raw`);
    return mod.default as string;
  };
}
```

`packages/line-icons/src/resolvers/phosphor.ts`:

```ts
// Phosphor ships one SVG file per weight and icon.
import type { IconResolver } from '../index.js';
import { assertIconName } from './icon-name.js';

type PhosphorWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

const WEIGHTS = new Set<PhosphorWeight>(['thin', 'light', 'regular', 'bold', 'fill', 'duotone']);

export function createPhosphorResolver(defaults: { weight?: PhosphorWeight } = {}): IconResolver {
  return async (name, options) => {
    assertIconName(name);
    const weight = (options?.weight as PhosphorWeight) ?? defaults.weight ?? 'regular';
    if (!WEIGHTS.has(weight)) throw new Error(`[line-icons] Unknown Phosphor weight "${weight}".`);
    // Only regular files use the bare name; the other weights add a weight suffix.
    const file = weight === 'regular' ? name : `${name}-${weight}`;
    const mod = await import(/* @vite-ignore */ `@phosphor-icons/core/assets/${weight}/${file}.svg?raw`);
    return mod.default as string;
  };
}
```

The two resolvers have **different shapes** (Lucide: single argument; Phosphor: takes a `weight`). The registry contract intentionally accepts an opaque `options` bag so the resolver chooses what to consume. This pressure-tests the contract: research R16 / B19 mandates two-library validation precisely to prove the registry is genuinely agnostic.

Both resolvers validate their inputs before `import()` (AM-035). A `name` outside `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` rejects with `[line-icons] Invalid icon name "<name>".`, and the Phosphor resolver rejects a resolved weight outside the six with `[line-icons] Unknown Phosphor weight "<weight>".`. The check on the resolved weight covers both `options.weight` and the factory default. The resolvers are async, so every rejection arrives as a rejected promise, never a synchronous throw.

#### 6.E.3 Validation tests

`packages/line-icons/__tests__/`:

- `registry.test.ts` — Bun test: registers both resolvers, resolves three icons from each, asserts the resolver was called with the correct arguments and the SVG string was returned.
- `resolvers.lucide.test.ts` — exercises the Lucide resolver against the installed `lucide-static` package (no network), including rejection of invalid icon names with the exact `[line-icons] Invalid icon name` error (AM-035).
- `resolvers.phosphor.test.ts` — same for `@phosphor-icons/core`, including weight selection across all six weights (non-regular files are named `<name>-<weight>.svg`, AM-033) and rejection of invalid icon names and invalid weights, from both `options.weight` and the factory default, with the exact `[line-icons]` errors (AM-035).

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
    '@storybook/addon-a11y',
    '@storybook/addon-themes'        // toolbar switcher for data-accent / data-gray previews
  ],
  staticDirs: ['../public'],
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
import { plugin } from 'bun';
import { dirname, resolve } from 'node:path';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Vite-compatible `*.css?inline` → CSS text (AM-026; Bun has no `?inline` support)
plugin({
  name: 'css-inline',
  setup(build) {
    build.onResolve({ filter: /\.css\?inline$/ }, (args) => ({
      path: resolve(dirname(args.importer), args.path.slice(0, -'?inline'.length)),
      namespace: 'css-inline',
    }));
    build.onLoad({ filter: /.*/, namespace: 'css-inline' }, async (args) => ({
      contents: `export default ${JSON.stringify(await Bun.file(args.path).text())};`,
      loader: 'js',
    }));
  },
});

GlobalRegistrator.register();
import { afterEach } from 'bun:test';
import { fixtureCleanup } from '@open-wc/testing-helpers/pure';
afterEach(fixtureCleanup);
```

Wired via `bunfig.toml`:

```toml
[test]
preload = ["./bun-test-preload.ts"]
pathIgnorePatterns = ["temp/**"]
```

This satisfies the R11 documented constraint (auto-cleanup side-effect silently no-ops under `bun:test` because Mocha-style globals aren't on `window`). **R11 stop gate does NOT fire** — per round-1 research, this is documentable, not incompatibility.

> **F2 scope note (AM-018).** F2's deliverables here are exactly two: (a) create root `bun-test-preload.ts`, and (b) add `[test] preload = ["./bun-test-preload.ts"]` to `bunfig.toml`. The CI step that asserts the preload entry is present in `bunfig.toml` is **not** an F2 deliverable — `.github/workflows/checks.yml` does not exist at F2 time (F1 deferred all workflow authoring to F4) and is owned by Stream F → F4 (`line-ui-7qm.6.4`) per §6.F.5. The preload-presence assertion is part of F4's `checks.yml` scope (see §6.F.5). This mirrors the AM-006 / AM-007 / AM-013 precedent that scoped analogous CI ACs to Stream F.

#### 6.F.4 Playwright (F2 cont.)

`playwright.config.ts` at repo root:

```ts
import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: './packages',
  testMatch: '**/*.e2e.ts',
  use: { baseURL: 'http://127.0.0.1:4319', trace: 'on-first-retry' },
  webServer: {
    command: 'vite packages/line-core/__tests__/integration --host 127.0.0.1 --port 4319 --strictPort',  // AM-031: one subdirectory per fixture page (/hello-world/, /direction/, /form-associated/ — AM-032)
    url: 'http://127.0.0.1:4319/hello-world/',  // AM-031: no root index.html; readiness probes a fixture page
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } }
  ],
  reporter: [['html', { open: 'never' }], ['github']]
});
```

Root `package.json` declares the script the §6.F.5 `checks.yml` step invokes: `"e2e": "playwright test --pass-with-no-tests"`. The `--pass-with-no-tests` flag keeps the step green (exit 0) until D5 / D8 / G6 land the first `*.e2e.ts` files — without it, `playwright test` exits 1 with `Error: No tests found` (AM-023).

Playwright runs:
- The hello-world component E2E (§6.D.8).
- The Direction mixin browser tier (§6.D.4).
- The FormAssociated browser tier (§6.D.5).
- **Smoke page-render checks only** for Storybook (getting-started + theming + customisation MDX pages load without console errors; palette/role design-system stories render). Phase 00 does **not** capture per-pixel visual-regression baselines (`toHaveScreenshot()` is not invoked). Full visual-regression infrastructure — baseline storage, per-browser diffs, update workflow — is deferred to Phase 1, aligned with PRD §5.2.1 J2 contract (no per-component visual baselines until components ship).

`bunx playwright install --with-deps` runs in CI before the Playwright step.

#### 6.F.5 GitHub Actions (F3, F4)

`.github/workflows/checks.yml` — runs on every PR:

```yaml
name: checks
on: [pull_request]
permissions: { contents: read }               # AM-025: least-privilege token
concurrency:                                   # AM-025: cancel superseded runs of the same ref
  group: checks-${{ github.ref }}
  cancel-in-progress: true
jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 30                        # AM-025
    steps:
      - uses: actions/checkout@v4
        with: { persist-credentials: false }   # AM-025: nothing downstream needs git auth
      - uses: oven-sh/setup-bun@v2
        with: { bun-version-file: .bun-version }
      - run: bun install --frozen-lockfile
      - run: bun run lint                        # biome check
      - run: bun run build                       # AM-029: two-phase (packages, then apps) — Bun --filter ignores devDependencies ordering
      - run: bun --filter '@websublime/*' typecheck  # AM-025: after build — needs line-schemas dist/*.d.ts
      - name: Pack verification (AM-036)
        run: bun run scripts/verify-pack.mjs    # after build — packs every publishable package offline and checks the tarballs
      - run: bun -e "const m = await import('./packages/line-components/dist/index.js'); const n = Object.keys(m).length; if (n !== 0) { console.error('line-components must export nothing in Phase 00, got', n); process.exit(1); }"  # zero-export smoke (§9.1, RK11, AM-007)
      - run: bun run scripts/lint-layers.mjs      # downward-only enforcement
      - run: bun run scripts/verify-palettes-fresh.mjs
      - run: bun run scripts/validate-contrast.mjs
      - run: grep -qE '^preload = \["\./bun-test-preload\.ts"\]$' bunfig.toml  # F2 preload-presence assertion (AM-018; anchored/escaped AM-025)
      - run: bun test                             # unit tier
      - run: bunx playwright install --with-deps chromium firefox webkit
      - run: bun run e2e                          # browser tier
      - run: bun --filter '@websublime/line-storybook' build
      - run: bun --filter '@websublime/line-storybook' analyze  # CEM (AM-024: no `run`)
```

`.github/workflows/release.yml` — runs on push to `main`:

```yaml
name: release
on:
  push: { branches: [main] }                   # AM-038: npm rejects trusted-publishing tokens from pull_request_target / issue_comment
permissions:                                   # AM-038: only what changesets/action and the publisher need
  contents: write                              # push the Version PR branch and tags, create GitHub releases
  pull-requests: write                         # open / update the Version PR
  id-token: write                              # npm trusted publishing (OIDC) and provenance
concurrency:                                   # AM-038: one release run at a time; a running publish is never cancelled
  group: release-${{ github.ref }}
  cancel-in-progress: false
jobs:
  publish:
    runs-on: ubuntu-latest
    timeout-minutes: 30                        # AM-038
    environment: npm                           # AM-038: deployment branch policy = main only; trusted publishers require this environment
    steps:                                     # AM-040: every action is pinned to a full commit SHA; the trailing comment names its release
      - name: Checkout                         # AM-038: node24 runtime; credentials kept: changesets/action pushes the Version PR branch and tags
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - name: Set up Bun
        uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0
        with: { bun-version-file: .bun-version }
      - name: Set up Node 24                   # AM-038: Node 24 LTS bundles npm >= 11.5.1; no registry-url (it hides ~/.npmrc)
        uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6.5.0
        with: { node-version: '24', package-manager-cache: false }
      - name: Assert npm >= 11.5.1 and Node >= 22.14.0 (trusted publishing)
        run: |
          bun -e "
            const v = (cmd) => Bun.spawnSync(cmd).stdout.toString().trim().replace(/^v/, '');
            const npm = v(['npm', '--version']);
            const node = v(['node', '--version']);
            console.log('npm ' + npm + ', node ' + node);
            if (Bun.semver.order(npm, '11.5.1') < 0 || Bun.semver.order(node, '22.14.0') < 0) {
              console.error('trusted publishing needs npm >= 11.5.1 and Node >= 22.14.0');
              process.exit(1);
            }
          "
      - name: Install
        run: bun install --frozen-lockfile
      - name: Build
        run: bun --filter './packages/*' build # AM-040: packages only; the publisher and its pack checks need only packages/*/dist
      - name: Version PR or publish
        uses: changesets/action@a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d # v1.9.0
        with:
          publish: bun run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}  # AM-038: `npm` environment secret, bootstrap only; unset → "" → the action writes no auth line
```

`.github/workflows/snapshot-version.yml` — manual dispatch; a dry run that prints the canary plan (AM-039):

```yaml
name: snapshot-version
on: workflow_dispatch
permissions:                                   # AM-039: read-only; no npm credential, no id-token
  contents: read                               # checkout; @changesets/changelog-github reads commits
  pull-requests: read                          # @changesets/changelog-github reads the associated pull requests
concurrency:
  group: snapshot-version-${{ github.ref }}
  cancel-in-progress: true                     # a dry run is safe to cancel
jobs:
  plan:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:                                     # AM-040: every action is pinned to a full commit SHA; the trailing comment names its release
      - name: Checkout                         # node24 runtime
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with: { fetch-depth: 0, persist-credentials: false }  # history for the changelog lookups; nothing is pushed
      - name: Set up Bun
        uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0
        with: { bun-version-file: .bun-version }
      - name: Set up Node 24                   # AM-039: same toolchain as snapshot-deploy.yml; no registry-url
        uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6.5.0
        with: { node-version: '24', package-manager-cache: false }
      - name: Assert npm >= 11.5.1 and Node >= 22.14.0 (same toolchain as snapshot-deploy)
        run: |
          bun -e "
            const v = (cmd) => Bun.spawnSync(cmd).stdout.toString().trim().replace(/^v/, '');
            const npm = v(['npm', '--version']);
            const node = v(['node', '--version']);
            console.log('npm ' + npm + ', node ' + node);
            if (Bun.semver.order(npm, '11.5.1') < 0 || Bun.semver.order(node, '22.14.0') < 0) {
              console.error('snapshot-deploy publishes with npm >= 11.5.1 on Node >= 22.14.0; this dry run uses the same toolchain');
              process.exit(1);
            }
          "
      - name: Install
        run: bun install --frozen-lockfile
      - name: Compute snapshot versions
        run: bun run snapshot:version          # changeset version --snapshot → <version>-<sha>-SNAPSHOT, working tree only
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # @changesets/changelog-github calls the GitHub GraphQL API
      - name: Build
        run: bun --filter './packages/*' build # AM-040: packages only; the dry run and its pack checks need only packages/*/dist
      - name: Print the canary plan
        shell: bash                            # -eo pipefail: a failing dry run fails the step despite tee
        run: |
          bun run snapshot:publish --dry-run | tee "$RUNNER_TEMP/plan.txt"
          { echo '### Canary plan (dry run)'; echo '```'; cat "$RUNNER_TEMP/plan.txt"; echo '```'; } >> "$GITHUB_STEP_SUMMARY"
```

`.github/workflows/snapshot-deploy.yml` — manual dispatch; versions and publishes a canary from `main` in one ephemeral job (AM-039):

```yaml
name: snapshot-deploy
on: workflow_dispatch                          # AM-039: manual only; AM-038: npm rejects trusted-publishing tokens from pull_request_target / issue_comment
permissions:                                   # AM-039
  contents: read                               # checkout; @changesets/changelog-github reads commits
  pull-requests: read                          # @changesets/changelog-github reads the associated pull requests
  id-token: write                              # AM-038: npm trusted publishing (OIDC) and provenance
concurrency:                                   # AM-039: one canary publish at a time; a running publish is never cancelled
  group: snapshot-deploy
  cancel-in-progress: false
jobs:
  canary:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    environment: npm                           # AM-038: deployment branch policy = main only; trusted publishers require this environment
    steps:                                     # AM-040: every action is pinned to a full commit SHA; the trailing comment names its release
      - name: Require main                     # AM-039: a dispatch from another ref fails instead of showing a skipped run
        run: |
          if [ "$REF" != "refs/heads/main" ]; then
            echo "::error::canaries publish only from main (dispatched on $REF)"
            exit 1
          fi
        env:
          REF: ${{ github.ref }}               # via env, never interpolated into the script
      - name: Checkout                         # node24 runtime
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with: { fetch-depth: 0, persist-credentials: false }  # ephemeral: no commit, tag, or push
      - name: Set up Bun
        uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0
        with: { bun-version-file: .bun-version }
      - name: Set up Node 24                   # AM-038: Node 24 LTS bundles npm >= 11.5.1; no registry-url (it hides ~/.npmrc)
        uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6.5.0
        with: { node-version: '24', package-manager-cache: false }
      - name: Assert npm >= 11.5.1 and Node >= 22.14.0 (trusted publishing)
        run: |
          bun -e "
            const v = (cmd) => Bun.spawnSync(cmd).stdout.toString().trim().replace(/^v/, '');
            const npm = v(['npm', '--version']);
            const node = v(['node', '--version']);
            console.log('npm ' + npm + ', node ' + node);
            if (Bun.semver.order(npm, '11.5.1') < 0 || Bun.semver.order(node, '22.14.0') < 0) {
              console.error('trusted publishing needs npm >= 11.5.1 and Node >= 22.14.0');
              process.exit(1);
            }
          "
      - name: Install
        run: bun install --frozen-lockfile
      - name: Compute snapshot versions
        run: bun run snapshot:version          # changeset version --snapshot → <version>-<sha>-SNAPSHOT, working tree only
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # @changesets/changelog-github calls the GitHub GraphQL API
      - name: Build
        run: bun --filter './packages/*' build # AM-040: packages only; the publisher and its pack checks need only packages/*/dist
      - name: Write the npm token fallback (bootstrap only)
        run: |                                 # AM-038: same rule as changesets/action — no line when the secret is unset
          if [ -n "$NPM_TOKEN" ]; then
            printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" >> "$HOME/.npmrc"
          fi
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}  # AM-038: `npm` environment secret, bootstrap only
      - name: Publish the canary
        run: bun run snapshot:publish          # publisher --tag canary --no-git-tag; the snapshot guard runs before the first upload
```

Both snapshot workflows run `snapshot:version` (`changeset version --snapshot`, unchanged) before the build. It writes `<version>-<40-char sha>-SNAPSHOT` into the manifests of the packages with pending changesets and of their dependents (`snapshot.prereleaseTemplate` = `{commit}-SNAPSHOT`, `useCalculatedVersion: true`, `{commit}` = `git rev-parse HEAD`), for example `0.1.0-<sha>-SNAPSHOT`. It needs `GITHUB_TOKEN`: `@changesets/changelog-github` (`.changeset/config.json`) reads each changeset's commit and its pull requests through the GitHub GraphQL API and throws when no token is set. The workflows grant `contents: read` and `pull-requests: read` for that query, and these two scopes suffice: `snapshot-deploy.yml` run 37474782644 ran `snapshot:version` with only them and `@changesets/changelog-github` succeeded (AM-042). `fetch-depth: 0` gives Changesets the history it walks to find the commit that added each changeset (on a shallow clone it deepens with `git fetch --deepen`). The snapshot versions live only in the job's working tree: neither workflow commits, tags, or pushes, and both check out with `persist-credentials: false`. Both set up the same Node 24 toolchain (`actions/setup-node@v6`, no `registry-url`, the npm/Node assertion), so the dry-run plan comes from the npm that the deploy uses. `snapshot-version.yml` holds no npm credential and uploads nothing; the dry-run plan (package, version, tag, `publish`/`skip`) goes to the log and the job summary, and the snapshot guard below fails it the same way it would fail a deploy. `snapshot-deploy.yml` versions and publishes in one job. `snapshot:publish` runs the publisher with `--tag canary --no-git-tag` (AM-036), so it creates no git tags, and it authenticates as the Auth paragraph below describes (AM-038); the token fallback is written after install and build, right before the publish step. Two checks keep it on `main`. The `npm` environment's branch policy (AM-038) rejects the job on any other ref, and the job's first step fails with "canaries publish only from main" when `github.ref` is not `refs/heads/main`. That step reads the ref through `env`, and it still fails the run if the environment policy is missing. Its concurrency group carries no ref and never cancels a running job, so two canary runs never publish at once. This is the RC pipeline: an RC is a canary snapshot published from `main` by manual dispatch under the `canary` dist-tag. There is no `next` branch (see AM-008). Observed on the first publish: when a package had no `latest`, npm set `latest` to the version published with `--tag canary`, so the bootstrap canary was `latest` until `0.1.0` (§7.2, AM-042).

**Publish path (AM-036).** Changesets versions and tags, Bun packs a staged copy of each package, and npm uploads. `changeset publish` is not used, because under Bun it uploads with `npm publish`, which drops `dist/` and ships `workspace:` ranges unrewritten. The root `package.json` declares two scripts:

```jsonc
{
  "scripts": {
    "release":          "bun run scripts/publish.mjs",
    "snapshot:publish": "bun run scripts/publish.mjs --tag canary --no-git-tag"
  }
}
```

The publisher `scripts/publish.mjs` is a Bun-run ESM script like the other `scripts/*.mjs`. It does the following, in order:

1. It discovers the publishable packages. These are the `packages/*/package.json` manifests, minus those with `"private": true`, minus the names in the `ignore` list of `.changeset/config.json`. It reuses the discovery function that `scripts/verify-pack.mjs` exports.
2. It orders them so dependencies come before dependents. The order is a topological sort over the internal `@websublime/*` names in each manifest's `dependencies` and `peerDependencies`. Packages with no ordering constraint between them sort by package name. A dependency cycle fails the run.
3. For each package it runs `npm view <name>@<version> version --json`. Exit 0 with a version means the version is published, so it logs a line saying so and skips the upload. A non-zero exit whose JSON has `.error.code === "E404"` means the version is new, so it publishes; this covers both "package not found" and "no match for version". Any other result fails the run. This step runs for every package before step 4 runs for any (AM-039), so the snapshot guard below sees the whole plan before the first upload.
4. It packs the package through the shared staging function that `scripts/verify-pack.mjs` exports. The function copies the package directory, without `node_modules`, to a temp staging directory. In the staged `package.json` it rewrites every `workspace:` range in `dependencies`, `peerDependencies`, `optionalDependencies`, and `devDependencies`, using the target package's `version` from `packages/*/package.json`. `workspace:^` becomes `^<v>`, `workspace:~` becomes `~<v>`, `workspace:*` becomes `<v>`, and `workspace:<range>` becomes `<range>`. A target that is not a workspace package fails the run. Then it runs `bun pm pack --quiet --destination <tmpdir>` in the staging directory. That command prints a blank line and then the absolute tarball path, so the script takes the last non-empty stdout line as the path. Tracked files are never mutated. The staging exists because Bun 1.3.14 fills `workspace:` ranges from the versions in `bun.lock`, and `changeset version` does not update `bun.lock` (oven-sh/bun#18906).
5. It runs the guard's tarball checks (a)–(e) below on that tarball, using the functions `scripts/verify-pack.mjs` exports. A failed check stops the run before that package uploads.
6. It uploads with `npm publish <tarball> --access public --tag <tag>`. The tag comes from `--tag <name>` and defaults to `latest`. Steps 3 and 6 run with the repository root as the working directory, so the repo `.npmrc` applies. It pins both `registry` and `@websublime:registry` to `https://registry.npmjs.org/`, because npm resolves the scope key before `registry` and project config beats user config for the same key (AM-037). Only `bun pm pack` runs in the staging directory.
7. After every upload succeeds, it runs `changeset tag` unless `--no-git-tag` is passed. It passes `changeset tag` stdout through unchanged, because `changesets/action@v1` detects published packages from the `New tag: <name>@<version>` lines. `release.yml` pins the action to commit `a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d` (v1.9.0, the head of the `v1` branch when pinned, AM-040), whose regex is at `src/run.ts:101`.

**Snapshot guard (AM-039).** With `--tag canary` (the `snapshot:publish` script), after step 3 and before step 4 runs for the first package, every package that step 3 marked `publish` must have a version of the form `<major>.<minor>.<patch>-<sha>-SNAPSHOT`, where `<sha>` is the 40-character output of `git rev-parse HEAD` run in the repository root. That is the version `snapshot:version` writes at the same commit. Any other version fails the run with a non-zero exit and lists every offending `name@version`, before anything is packed or uploaded; `--dry-run` applies the same check. Packages marked `skip` are not checked, because they upload nothing. The guard exists because the publisher uploads every publishable package whose version is not in the registry, and `changeset version --snapshot` leaves a package with no pending changeset and no dependency bump at its current version. Before the first stable release that version is an unpublished `0.0.0`, which would go out under `canary`, and a dependent's snapshot would then depend on it. The check is a pure function exported from `scripts/publish.mjs` that takes the planned rows (name, version, `publish`/`skip`) and the HEAD sha and returns the offenders, so a unit test covers it without the registry or git.

**Stable guard (AM-040).** With any tag other than `canary` (the `release` script uses the default `latest`), after step 3 and before step 4 runs for the first package, every package that step 3 marked `publish` must have a version without a prerelease part: no `-` after `<major>.<minor>.<patch>`, ignoring build metadata after `+`. Any other version, `-<sha>-SNAPSHOT` and `-rc.1` alike, fails the run with a non-zero exit and lists every offending `name@version`, before anything is packed or uploaded; `--dry-run` applies the same check. Packages marked `skip` are not checked. The guard mirrors the snapshot guard. Snapshot versions that reach `main`, for example a committed `snapshot:version` output (which also consumes the changeset files), would otherwise go out under `latest` from `release.yml`. npm's own refusal to publish a prerelease without `--tag` never fires, because the publisher always passes `--tag`. The check is a pure function exported from `scripts/publish.mjs` next to the snapshot guard's; it takes the planned rows and returns the offenders, and a unit test covers it.

The publisher fails fast. The first error stops the run with a non-zero exit. A re-run is idempotent because step 3 skips versions already in the registry. With `--dry-run` it runs steps 1–5 for every publishable package, including those `npm view` reports as published, and marks each one `publish` or `skip` in the printed plan (package, version, tag, tarball path). The read-only `npm view` still runs, but `npm publish` and `changeset tag` never do. The publisher never prints secrets. npm processes publishes asynchronously (AM-042): `npm publish` can print "Your package is being processed and may take a few minutes to become available", and a version the CI log reports as published became visible in the registry about 0.5–6 minutes after the step (`line-colors@0.1.0`: CI 14:57:22Z, registry 15:03:09.949Z). Its tarball can trail its manifest by about 5 more minutes (`line-schemas@0.1.0`: manifest 15:01:16Z, tarball 404 until 15:06:32Z), and `npm install` of that version fails with E404 until `dist.tarball` resolves. While the manifest is not yet visible, step 3 still gets E404, so a re-run in that window would plan `publish` again; expect `npm publish` to be rejected for the existing version, which fails the run before anything changes (not observed). Wait until `npm view <name>@<version> version` answers for every package before re-running. Once the manifest is visible, step 3 skips the version, so the tarball lag does not affect a re-run. Anything that installs or downloads a just-published version waits until `curl -sI "$(npm view @websublime/line-<pkg>@<version> dist.tarball --registry https://registry.npmjs.org/)"` returns `HTTP/2 200`.

**Auth (AM-038).** npm authenticates each upload through npm trusted publishing (OIDC) first, and falls back to a token only during the §7.2 bootstrap. In a GitHub Actions job with `id-token: write`, npm ≥ 11.5.1 on Node ≥ 22.14 fetches an OIDC ID token for the audience `npm:registry.npmjs.org`, exchanges it at the registry for a short-lived token scoped to the package, and publishes with it. This covers `npm publish <tarball>`: npm reads the package name from the tarball's manifest and runs the exchange for every spec type, not only for directories. When the exchange fails (no trusted publisher matches the package, the workflow filename, and the environment), npm keeps the token its config already has. That token is optional. `changesets/action@v1` appends `//registry.npmjs.org/:_authToken=<NPM_TOKEN>` to the user `~/.npmrc` before it runs the publish script, but only when `NPM_TOKEN` is non-empty, and `snapshot-deploy.yml` writes the same line under the same condition. An unset secret expands to an empty string, so without the secret no auth line is written and OIDC alone authenticates; with it, a successful exchange still replaces the token for that publish. No workflow passes `registry-url` to `actions/setup-node`, because that input writes `$RUNNER_TEMP/.npmrc` with `_authToken=${NODE_AUTH_TOKEN}`, exports `NPM_CONFIG_USERCONFIG` pointing at it (npm then stops reading `~/.npmrc`), and in v6 exports the placeholder `NODE_AUTH_TOKEN=XXXXX-XXXXX-XXXXX-XXXXX`. Provenance comes with trusted publishing: after a successful exchange npm turns `provenance` on when the repository and the package are public, and libnpmpublish signs the sha512 of the uploaded tarball, so tarball publishes carry provenance too. The registry accepts it only when the published `repository.url` matches the source repository, hence the `repository` field in §4.1–§4.8. Token-authenticated publishes (the bootstrap canary) carry no provenance, because the publisher does not pass `--provenance`. npm rejects trusted-publishing tokens minted for `pull_request_target` and `issue_comment` events, so the publishing workflows trigger only on `push` (`release.yml`) and `workflow_dispatch` (`snapshot-deploy.yml`). A trusted publisher is matched on the filename of the workflow that started the run, `workflow_dispatch` runs included. That filename does not pin the branch: GitHub runs the copy of the workflow file on the dispatched or pushed ref, so a branch could dispatch `snapshot-deploy.yml`, or push a `release.yml` whose trigger it edited, and still match. Both publishing jobs therefore declare `environment: npm`. The GitHub Environment `npm` has a deployment branch policy that allows only `main`, every trusted-publisher connection sets Environment name `npm` (the ID token carries the `environment` claim), and the bootstrap `NPM_TOKEN` is a secret of that environment, which only jobs that reference it and pass its policy can read. `bun publish` has no OIDC (oven-sh/bun#22423), so npm uploads.

The guard `scripts/verify-pack.mjs` runs after `bun run build`, because it needs the built `dist/`. It uses no network. It discovers the publishable packages the same way and packs each one through the same staging function as publisher step 4, so CI checks the exact artifact the publisher uploads. It reads each tarball with `new Bun.Archive(bytes).files()`, whose keys are `package/<path>`, and checks:

- (a) Every `exports` target exists in the tarball. The check recurses into condition objects, and a `*` pattern must match at least one file. Any `main`, `module`, or `types` field must also exist.
- (b) Every tarball path is on the allowlist. The allowlist holds `package.json`, `README*`, `LICENSE*`, `LICENCE*` (Bun adds the British spelling too), and paths under the `files` entries. `CHANGELOG.md` is intentionally not shipped. Bun leaves it out when `files` is set, and release notes live in the repository, the GitHub releases, and the site (PRD §6.4).
- (c) No tarball path hits the denylist, including paths under the `files` entries. The denylist is any `__tests__/` segment, `*.test.*`, `*.spec.*`, `tsconfig*.json`, `vite.config.*`, `*.tsbuildinfo`, any path segment that starts with `.`, `*.pem`, and `*.key` (AM-037).
- (d) The packed manifest has no `workspace:` or `catalog:` range in `dependencies`, `peerDependencies`, `optionalDependencies`, or `devDependencies`.
- (e) Every internal `@websublime/*` range in the packed manifest is satisfied by that package's current version, read from `packages/*/package.json` (never from `bun.lock` or the packed output).

It exits non-zero and lists every failure, not just the first. It exports its discovery, pack, and check functions for `publish.mjs` to import, and its CLI entry runs only under `import.meta.main`.

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

Row F5 pins every `uses:` in `deploy-site.yml` to a full commit SHA (AM-040 pattern). The workflow reads its own Cloudflare token, never the Storybook ones, from a GitHub environment (for example `site-production`) whose deployment branch policy allows `main` only. This repository holds no repository-level Cloudflare secret (AM-044).

`.github/workflows/deploy-storybook.yml`:

```yaml
name: deploy-storybook
on:                                            # AM-044: never pull_request_target, never workflow_dispatch
  push:
    branches: [main]
    paths: ['apps/storybook/**', 'packages/**', '.github/workflows/deploy-storybook.yml', 'bun.lock', '.bun-version']
  pull_request:
    branches: [main]                           # AM-044: base filter; previews deploy under pr-<number>, never under main
    paths: ['apps/storybook/**', 'packages/**', '.github/workflows/deploy-storybook.yml', 'bun.lock', '.bun-version']
permissions: {}                                # AM-044: each job declares its own
concurrency:                                   # AM-044: a newer push to the same ref cancels the older run
  group: deploy-storybook-${{ github.ref }}
  cancel-in-progress: true
jobs:
  build:                                       # AM-044: runs PR code, holds no secrets
    if: github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions: { contents: read }
    steps:                                     # AM-044: every action is pinned to a full commit SHA (AM-040 pattern)
      - name: Checkout
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with: { persist-credentials: false }
      - name: Set up Bun
        uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0
        with: { bun-version-file: .bun-version }
      - name: Install
        run: bun install --frozen-lockfile
      - name: Build packages, then Storybook  # AM-029: packages first, or Storybook builds before their dist/ exists
        run: bun --filter './packages/*' build && bun --filter '@websublime/line-storybook' build
      - name: Upload storybook-static
        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: storybook-static
          path: apps/storybook/storybook-static
          if-no-files-found: error
          retention-days: 1
  deploy:                                      # AM-044: never checks out or runs PR code
    needs: build
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions: { contents: read }            # the sparse checkout of the base commit
    environment: ${{ github.event_name == 'push' && 'storybook-production' || 'storybook-preview' }}
    steps:
      - name: Checkout the base commit's manifests only
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: ${{ github.event.pull_request.base.sha || github.sha }}
          persist-credentials: false
          sparse-checkout-cone-mode: false
          sparse-checkout: |
            /package.json
            /bun.lock
            /.bun-version
            /packages/*/package.json
            /apps/*/package.json
      - name: Set up Bun
        uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0
        with: { bun-version-file: .bun-version, no-cache: true }
      - name: Install the locked wrangler      # AM-044: no lifecycle scripts run
        run: bun install --frozen-lockfile --ignore-scripts
      - name: Download storybook-static
        uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2
        with:
          name: storybook-static
          path: ${{ runner.temp }}/storybook-static
      - name: Deploy to Cloudflare Pages      # AM-044: production on push to main, pr-<number> previews in the preview account
        working-directory: apps/storybook
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          PAGES_PROJECT: ${{ vars.CLOUDFLARE_PAGES_PROJECT }}
          DEPLOY_BRANCH: ${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || 'main' }}
          STATIC_DIR: ${{ runner.temp }}/storybook-static
          COMMIT_SHA: ${{ github.event.pull_request.head.sha || github.sha }}
          WRANGLER_OUTPUT_FILE_PATH: ${{ runner.temp }}/wrangler-output.ndjson
        run: >-
          bun x --no-install wrangler pages deploy "$STATIC_DIR"
          --project-name="$PAGES_PROJECT" --branch="$DEPLOY_BRANCH"
          --commit-hash="$COMMIT_SHA" --commit-dirty=false
      - name: Write the deployment URL to the job summary
        env:
          WRANGLER_OUTPUT_FILE_PATH: ${{ runner.temp }}/wrangler-output.ndjson
        run: |
          DEPLOYMENT_URL="$(bun -e "
            const lines = (await Bun.file(process.env.WRANGLER_OUTPUT_FILE_PATH).text()).trim().split('\n');
            const entry = lines.map((line) => JSON.parse(line)).find((e) => e.type === 'pages-deploy-detailed');
            const url = entry?.alias ?? entry?.url;
            if (!url) { console.error('no pages-deploy-detailed entry in the wrangler output file'); process.exit(1); }
            console.log(url);
          ")"
          echo "Storybook deployed to $DEPLOYMENT_URL" >> "$GITHUB_STEP_SUMMARY"
```

The `build` job runs the pull request's code and holds no secrets. The `deploy` job runs only tooling from the base commit, installed from `bun.lock` with lifecycle scripts disabled, plus the built artifact. `bun x --no-install` fails instead of fetching wrangler from the network. A push to `main` deploys through the environment `storybook-production`, whose deployment branch policy allows `main` only, to the branch `main` of the project `line-ui-storybook` in the main Cloudflare account. A same-repo pull request into `main` deploys through the environment `storybook-preview` to a Pages project in a separate Cloudflare account, under the branch `pr-<number>`. Cloudflare serves that preview at its alias URL, and the job summary shows it. F7 confirms the `pages-deploy-detailed` field names against the locked wrangler version. Pull requests from forks skip both jobs, because GitHub gives them no secrets. Pull requests from dependency bots stay out of scope until a bot is configured, because they receive no Actions secrets either. The workflow never uses `pull_request_target`.

**Bootstrap** (prerequisite of the §9.6 Storybook check). Steps 1–6 run before F7's pull request opens; step 7 is part of F7's diff.

1. In the main Cloudflare account, create the project with `wrangler pages project create line-ui-storybook --production-branch=main`.
2. In the separate preview account, create the preview project the same way. Its name is chosen at bootstrap and stored as the `storybook-preview` environment variable `CLOUDFLARE_PAGES_PROJECT`.
3. Create one API token per account with only Account › Cloudflare Pages › Edit on that account, an expiry, and a rotation date. Neither token is shared with `deploy-site.yml`.
4. Create the GitHub environments `storybook-production` and `storybook-preview` with their policies before any secret is added. This step is explicit, because GitHub auto-creates an environment a workflow references with no protection rules. `storybook-production` uses **Selected branches and tags** and exactly one rule: Ref type **Branch**, name `main`, no wildcard, and no tag rule. `storybook-preview` has no branch policy, because it must admit `refs/pull/<number>/merge`.
5. Verify the production policy. A same-repo test pull request whose job references `storybook-production` must be rejected by the branch policy before any secret is stored there.
6. Add the secrets. Each environment holds `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as environment secrets and `CLOUDFLARE_PAGES_PROJECT` as an environment variable (`line-ui-storybook` in `storybook-production`). No repository-level Cloudflare secret exists in this repository.
7. Add `wrangler` as an exact devDependency of `apps/storybook`, a private app that Changesets ignores.

On F7's own pull request the `deploy` job fails by design, because its base commit has no locked wrangler. F7 verifies production on its merge push to `main`. It verifies the preview on the first same-repo pull request into `main` after that merge that touches a filtered path.

A collaborator who edits the workflow in a pull request can still read the preview token, and that token reaches only the separate preview account. Preview content is built from the pull request, including any `_worker.js` Functions, `_routes.json`, `_headers` or `_redirects`, and it runs only in the preview account; production deploys only artifacts built from `main`. The production token stays out of reach of pull requests. Since 2025-12-08 GitHub evaluates environment branch rules for `pull_request` events against `refs/pull/<number>/merge`, not the head branch ([GitHub changelog, 2025-11-07](https://github.blog/changelog/2025-11-07-actions-pull_request_target-and-environment-branch-protections-changes/)), so the `main`-only rule rejects every pull request. A repository-level token in the main account would bypass that rule and reach the Storybook production project, so this repository holds none, and `deploy-site.yml` reads its token from its own `main`-only environment.

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

- `docs/specs/COMPONENT-SPEC-TEMPLATE.md` — empty template with required sections (Overview, Anatomy, States, Slots, Parts, Props, Events, A11y, Agent contract, Tests, Open Questions). Hand-authored. The Agent contract section states how the component meets rules C1–C8 (ARCHITECTURE §17.2) and fills the descriptor fields: catalog name, tag, prop schema, slot map, binding map, action map, accessibility requirements, agent-facing description, and the `agentExposed` flag, with a reason when it is `false` (ARCHITECTURE §17.3, AM-043).
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
| `line-tokens` | PostCSS (CSS-only) | `"files": []` — tsconfig exists only for editor tooling (AM-024) |
| `line-colors` | PostCSS (CSS-only) | `"files": []` (AM-024) |
| `line-themes` | PostCSS (CSS-only) | `"files": []` (AM-024) |
| `line-schemas` | `tsc -b` | `"composite": true`, `"exclude": ["tests/**","dist/**"]` |
| `line-utils` | `tsc -b` | `"composite": true`, `"exclude": ["tests/**","dist/**"]`, `"references": [{ "path": "../line-schemas" }]` |
| `line-icons` | `tsc -b` | `"composite": true`, `"exclude": ["tests/**","dist/**"]` |
| `line-core` | `vite build` (+ `vite-plugin-dts`) | `"noEmit": true`, `"exclude": ["tests/**","dist/**"]` |
| `line-components` | `vite build` (+ `vite-plugin-dts`) | `"noEmit": true`, `"exclude": ["tests/**","dist/**"]` |

Two invariants govern this matrix:

- **`composite: true` is required** for any package referenced by another via `references`, and for every package built with `tsc -b`. `composite` implies that `include` must be explicit (no implicit `**/*` walk) — each `tsc -b` package therefore sets `include` to its `src/**/*` set.
- **The base config sets no `exclude`** on purpose. Each package owns its own `exclude` so that test folders and `dist/` outputs are scoped per package, not globally. CSS-only packages opt out entirely via `"files": []` (AM-024).

### 7.2 Versioning + changesets

- Each published package is independently versioned via `@changesets/cli` (the existing config is already operational).
- Phase 00 ships `0.1.0` of every package (first stable release). It ships during Phase 00, before 2026-10-08, through the Version PR merge (PRD §6.5, v0.8.5; AM-041); later Phase 00 bumps follow the changeset rule in `docs/PROCESS.md` §6, so `0.2.0` stays Phase 1 (PRD §7.1).
- Pre-1.0 breaking changes are permitted at minor bumps (PRD §7.1).
- Releases split three ways (AM-036). Changesets versions packages and creates git tags (`changeset version`, `changeset tag`), Bun packs a staged copy of each package whose `workspace:` ranges the publisher has already rewritten (`bun pm pack`), and npm uploads the tarballs (`npm publish <tarball>`). The §6.F.5 publisher `scripts/publish.mjs` drives the last two steps.
- Publishing authenticates through npm trusted publishing (OIDC), with provenance (§6.F.5 Auth, AM-038). A short-lived granular `NPM_TOKEN` existed only to publish the first canary, because trusted publishers are configured per package on npmjs.com and none of the 8 packages existed yet; no `NPM_TOKEN` remains in the repository or the `npm` environment. A trusted publisher that no successful publish has validated expires 48 hours after creation. This bootstrap order verifies §9.5 and §9.6 (hardened by AM-040). (0) Before the PR that adds the publishing workflows merges, Miguel deletes the repository-level `NPM_TOKEN` secret (created 2021-04-01, so assumed to be a classic token revoked on 2025-12-09). He creates or configures the GitHub Environment `npm` with deployment branches set to **Selected branches and tags** and exactly one rule: Ref type **Branch**, name `main`, no wildcard, and no tag rule. This step is explicit, and comes before the merge, because GitHub auto-creates an environment a workflow references with no protection rules, and the merge itself triggers `release.yml`. Done first, step (0) leaves no window in which an unprotected `npm` environment exists. (1) After the merge, Miguel stores a granular token as the `NPM_TOKEN` secret of the `npm` environment. The token has **Packages and scopes** = **Read and write (publish and stage)** limited to the `@websublime` scope, **Organizations** = No access, an expiry of 1 day (at most 7), and Bypass 2FA (the run is non-interactive). (2) A `snapshot-deploy.yml` run on `main` publishes the first canary of all 8 packages with that token. (3) Right after step (2) succeeds, the `npm` environment's `NPM_TOKEN` secret is deleted and the token revoked on npmjs.com; step (4) happens in the npm UI and needs no token. (4) On each package Miguel adds a GitHub Actions trusted publisher for `websublime` / `line-ui` / `snapshot-deploy.yml` with Environment name `npm` and `npm publish` allowed (connections created after 2026-09-03 allow only `npm stage publish` by default). (5) Within 48 hours of step (4), a `snapshot-deploy.yml` run from a new `main` commit publishes a canary through OIDC with provenance, which validates those connections. (6) Once step (5) succeeds, Miguel sets Settings → Publishing access → **Require two-factor authentication and disallow tokens** on each of the 8 packages. That blocks token publishes, and trusted publishing keeps working (https://docs.npmjs.com/trusted-publishers, "Restrict token access"). If a token is ever needed again, the setting is lifted for that publish and restored after it. The `release.yml` trusted publishers (same fields, workflow `release.yml`, Environment name `npm`, `npm publish` allowed) are created on each package within the 48 hours before the Version PR is merged, and recreated if they expired, so the first stable publish validates them. The first publish had two registry effects (AM-042). Observed: when a package had no `latest`, npm set `latest` to the version published with `--tag canary` (npm's dist-tag docs say `--tag` leaves `latest` alone), so the bootstrap canary (`0.1.0-e94e2a8…-SNAPSHOT`, `0.0.1-e94e2a8…-SNAPSHOT` for `line-themes` and `line-components`) was `latest` on all 8 until `0.1.0` moved it; later canaries move only `canary`. On the 5 packages whose first publish printed "Your package is being processed…" (`line-colors`, `line-schemas`, `line-themes`, `line-utils`, `line-icons`), npm also created a version `0.0.0-stage` ("Temporary package placeholder for staged publishing"); no dist-tag points at it, so it does not affect resolution, and later publishes created none. The bootstrap is complete: steps (0)–(6) were done on 2026-10-06, and the `0.1.0` publish (run 37483208484) validated the `release.yml` connections.
- `changesets/action@v1` opens and updates the Version PR with `GITHUB_TOKEN`. The `checks.yml` runs that this triggers wait in an approval-required state, so before Miguel merges the Version PR he approves the pending `checks.yml` run on the PR's current head (**Approve workflows to run** in the merge box), or closes and reopens the PR. The action force-pushes the PR branch on every push to `main`, so each update needs a new approval. While every pending changeset is empty (`bun run empty`), the action logs "All changesets are empty" and neither opens the Version PR nor publishes, so `release.yml` does nothing until a non-empty changeset lands. Release runbook (AM-041): (a) After any push to `main`, wait for that push's `release.yml` run to finish re-versioning and force-pushing `changeset-release/main`. (b) Before approving, confirm that the PR's head was force-pushed after the latest `main` commit; then approve the pending `checks.yml` run on that head and merge. An approval given on an earlier head does not carry over a force-push. Branch protection does not stop a stale merge (its required-checks list is empty and admins are not enforced), so step (a) is the only guard: if the PR is merged before `release.yml` has re-versioned it on top of the latest `main`, any changeset that landed on `main` after its last update (for example an empty one) stays pending, the action takes the "All changesets are empty" path (`src/index.ts:154-156` at `a45c4d5`), and nothing is published. (c) After the merge, confirm that the `release.yml` run on the merge commit succeeded; wait until every `0.1.0` tarball resolves (`curl -sI "$(npm view @websublime/line-<pkg>@0.1.0 dist.tarball --registry https://registry.npmjs.org/)"` returns `HTTP/2 200` for all 8, because npm makes a version visible minutes after the CI step and its tarball can trail its manifest, §6.F.5 Publish path, AM-042) before installing or judging a check failed; then confirm that `npm view @websublime/line-<pkg> dist-tags` shows `latest` = `0.1.0` for all 8 packages; that each version's `_npmUser` is `GitHub Actions` and its `dist.attestations` carries SLSA provenance; and that 8 git tags `@websublime/line-*@0.1.0` and 8 GitHub releases exist. (d) Recovery: if the publisher fails midway, **Re-run failed jobs** is safe, because versions already in the registry are skipped and no tag is pushed until every upload succeeds. `changesets/action` at `a45c4d5` pushes each tag and creates its GitHub release per package (`src/run.ts:123-125`), so if a re-run fails because some tags were pushed before every release was created, Miguel creates the missing GitHub releases by hand.
- RCs are canary snapshots published from `main`; there is no `next` branch. The first stable release (`0.1.0`) is the Version PR merge during Phase 00 (AM-041). It shipped on 2026-10-06 (merge `10efd04`, run 37483208484): all 8 packages at `0.1.0` under `latest`, `_npmUser` `GitHub Actions`, SLSA v1 provenance, 8 tags `@websublime/line-*@0.1.0`, and 8 GitHub releases; a fresh install from registry.npmjs.org resolves all 8 at `0.1.0`, and `npm audit signatures` verifies their attestations (AM-042).

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
- [ ] `scripts/validate-contrast.mjs` passes (31 hues × {light, dark} step-9 vs contrast token ≥ 3:1, with the single documented `orange` allowlist exception at 2.97:1 per AM-014).
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
- [ ] `snapshot-version.yml` (manual dispatch, dry run) + `snapshot-deploy.yml` (manual dispatch, publishes a canary only from `main`) operational; no `next` branch.
- [ ] `deploy-site.yml` deploys `apps/site` to Cloudflare Pages on push to `main`.
- [ ] Storybook production deploy verified on push to `main` (`deploy-storybook.yml` → environment `storybook-production` → Cloudflare Pages project `line-ui-storybook`), and a preview verified on a same-repo pull request (environment `storybook-preview` → the `pr-<number>` alias in the preview account). The §6.F.5 Storybook bootstrap is its prerequisite. F7's own pull request cannot deploy, because its base commit has no locked wrangler; F7 verifies production on its merge push and the preview on the first later same-repo pull request into `main` that touches a filtered path.
- [ ] `bunfig.toml` declares `[test] preload = ['./bun-test-preload.ts']` (RK5 mitigation for `@open-wc/testing-helpers` `fixtureCleanup` registration). [F2]
- [ ] CI asserts the preload entry is present in `bunfig.toml` (`checks.yml` step that greps or parses the file). [F4 — `checks.yml` is authored by Stream F → F4 per §6.F.5; see AM-018]
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
- [ ] First stable release `0.1.0` of all 8 packages published under `latest` by `release.yml` through trusted publishing with provenance; later Phase 00 bumps follow `docs/PROCESS.md` §6; RCs are canary snapshots (AM-041).
- [ ] Phase 00 retrospective committed.

---

## 10. Design Decisions Beyond Plan + Research

The following decisions were made during spec authoring and need user review before APPROVAL. They are flagged here per the "decisions beyond plan + research" reporting requirement.

### D1. Biome `noRestrictedImports` rule for `@zag-js/vanilla`

**Decision:** Add a Biome lint rule that blocks `import` from `@zag-js/vanilla` everywhere except `packages/line-core/`.

**Why:** PRD §6.2 + ARCHITECTURE §6 mandate that components consume only `@websublime/line-core/machine`. Without a build-time check, the rule is documentation-only. This is the minimal mechanical enforcement.

**Alternative considered:** rely on code review only. Rejected — Phase 1 will onboard many components and the rule should be programmatic.

### D2. `verify-palettes-fresh` CI script

**Decision:** Add `scripts/verify-palettes-fresh.mjs` that runs the palette generator into a temp dir on every PR and `diff`s against the committed `src/` output (`packages/line-colors/src/`), failing on drift.

**Why:** PRD §9.7 ("Generated CSS is committed; regenerate only on `@radix-ui/colors` bump") and plan §C3 are silent on enforcement. Without this script, a contributor could edit a hue CSS file by hand and the bug would only surface in production.

**Alternative considered:** rely on the `@radix-ui/colors` version-pin in `package.json` as the trigger. Rejected — it does not protect against hand-edits.

### D3. CSS snapshot test scope

**Decision:** Snapshot tests cover (a) per-hue palette CSS, (b) per-role mapping CSS, (c) auto-pair behaviour via JSDOM `getComputedStyle()` *(superseded by AM-015 — the auto-pair check is now a committed-CSS string assertion against `src/defaults.css`, not a `getComputedStyle()` read; see §6.C.7)*, (d) Zod schema parity. Not (e) end-to-end visual rendering — that defers to Phase 1 Playwright visual regression.

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
