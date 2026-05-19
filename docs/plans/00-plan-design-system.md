# PHASE PLAN: Phase 00 — Design System Foundation

**Status:** APPROVED
**Author:** Ada (architect)
**Date:** 2026-05-19
**Phase Version Target:** `line://ui` v0.1.0 (also called "Phase 0" in the PRD)
**Source PRD:** [`/Users/ramosmig/Public/WS-Labs/line-ui/docs/PRD.md`](../PRD.md) (v0.8.3)
**Source Architecture:** [`/Users/ramosmig/Public/WS-Labs/line-ui/docs/ARCHITECTURE.md`](../ARCHITECTURE.md) (aligned with PRD v0.8.3)

> **What this document is.** A planning document. It defines scope, high-level task breakdown, dependencies, and acceptance criteria for the Phase 00 release.
>
> **What this document is NOT.** It is not an implementation spec. Implementation specs (the `00-spec-*.md` family in `docs/specs/`) are produced **after** research validates the assumptions called out in §5 (External Dependencies & Research Targets).

---

## 1. Phase Overview

Phase 00 stands up the **foundation** of `line://ui` — runtime, tooling, monorepo, base class, design system, and developer/CI infrastructure — without shipping any UI components. After Phase 00 lands, a developer must be able to scaffold, build, test, document, and release a new `line://ui` component without further infrastructure work.

The phase is anchored by two pillars:

1. **Design System v2 (Layered Package Model)** — Author the five design-system packages (`line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils`) from scratch under `packages/`. This is the centre of gravity of the phase: every later component phase depends on it.
2. **Runtime & Tooling Foundation** — Bun runtime, Biome lint/format, Vite 8+ bundler (Rolldown stable as default), PostCSS pipeline, `LineElement` base class wired to the first-party `LineMachineController` adapter (`@websublime/line-core/machine`, wraps `@zag-js/vanilla`), `formAssociated` mixin, Inspector refactor, Storybook 10+, testing stack, CI/CD, and npm scope.

Phase 00 ships **zero UI components**. Its sole deliverable is a fully operational platform on which Phase 1 (Core Primitives, v0.2.0) can begin.

---

## 2. Scope — In

### 2.1 Design System (5 packages, authored from scratch under `packages/`)

| Package | Layer | Content |
|---|---|---|
| `@websublime/line-tokens` | L0 | 11 primitive families + 7 decorative families + reset (18 families total, all `--line-*` prefixed). See PRD §9.9. |
| `@websublime/line-colors` | L1 | Radix Colors 3.x — 31 hues × 12 steps × 4 variant families (base + alpha + P3 + P3-alpha) + 4 special scales (`blackA`, `whiteA`, `blackP3A`, `whiteP3A`) + 1 `contrast` token per hue. **Sourced from `@radix-ui/colors` TS objects** (no upstream CSS); build script wraps in `light-dark()` + `@supports`-gated wide-gamut overrides. Generated CSS committed. |
| `@websublime/line-schemas` | L2 | TS types + Zod validators: `HUES`, `ACCENT_HUES`, `GRAY_HUES`, `SEMANTIC_MAP`. |
| `@websublime/line-themes` | L3 | Role mappings (`--line-accent-*`, `--line-gray-*`, semantics), 54 named aliases, auto-pair defaults, attribute-based theming (`[data-accent]` / `[data-gray]`). |
| `@websublime/line-utils` | — | TS helpers (contrast, mix, etc.). |

### 2.2 Runtime Packages (3 packages, authored from scratch under `packages/`)

| Package | Content |
|---|---|
| `@websublime/line-core` | Base class `LineElement` (refactor of current `ComponentElement`); mixins: Inspector, Metadata, Direction (LTR/RTL), FormAssociated; **first-party `LineMachineController` adapter** at `./machine` (Lit `ReactiveController` wrapping `@zag-js/vanilla` — there is no `@zag-js/element` in Zag's monorepo; we author the adapter ourselves); modular shadow-DOM reset sheets under `./styles/*`. |
| `@websublime/line-components` | Umbrella package with per-component subpath exports. **Empty in Phase 00** — scaffold + build pipeline only; first components ship in Phase 1. |
| `@websublime/line-icons` | Icon registry skeleton (agnostic resolver). Full surface finalised in Phase 1; Phase 00 ships the resolver contract + 1 reference library integration verified. |

### 2.3 Apps (2 apps, not published)

| App | Purpose |
|---|---|
| `apps/storybook` | Storybook 10+ with `@storybook/web-components-vite` + CEM analyser. Hosts Getting Started, Theming, and Customisation guides in Phase 00. |
| `apps/site` | Public site shell — **scaffold-only in Phase 00**. Concretely: Astro 5+ scaffold under `apps/site/`, Cloudflare Pages deploy configuration (`wrangler.toml` or equivalent), a placeholder landing page (`line://ui` wordmark + "coming soon" or similar), and CI deploy verified end-to-end. Full landing page content is Phase 1's responsibility (PRD §7.3 exit criterion: "Parallel: Landing page for site"). Phase 00 only validates the pipeline. |

### 2.4 Tooling & Infrastructure

- **Migrate runtime to Bun** (latest stable). Remove pnpm. Workspaces under Bun.
- **Migrate lint/format to Biome** (latest stable). Remove ESLint, Prettier, and all related plugins.
- **Bundler:** Vite 8+ (Rolldown stable as default) for components. PostCSS pipeline (`postcss-import`, `postcss-nested`, `postcss-preset-env`, `cssnano`) for design-system CSS.
- **Update all dependencies** to latest stable: Lit 3+, Zag.js latest, `@radix-ui/colors` latest 3.x.
- **Testing:** Bun test + `@open-wc/testing-helpers` + Playwright.
- **CI/CD:** GitHub Actions — checks (lint, typecheck, test, build), release pipeline, snapshot/canary versions, RC pipeline for `next` branch.
- **npm scope:** Configure `@websublime/line-*` on npm; verify publishability via snapshot/canary tag.
- **Changesets:** Already configured at the repo root; verified working across all 8 published packages.

### 2.5 Base Class & Mixins

- `LineElement` base class refactored from the current `ComponentElement` / `ComponentMixin`.
- Mixins: Inspector (feature flag via `localStorage`), Metadata (version/docs/qa), Direction (LTR/RTL), FormAssociated (opt-in via `ElementInternals`).
- Zag.js lifecycle integrated via the **first-party `LineMachineController`** (Lit `ReactiveController` exported from `@websublime/line-core/machine`) which wraps `@zag-js/vanilla` primitives (`VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`). The controller drives `hostConnected` (machine `start` + subscribe → `requestUpdate()`) and `hostDisconnected` (machine `stop`). Component code never imports `@zag-js/vanilla` directly.
- Failure mode: machine init failure renders a static fallback; no uncaught errors at the consumer (Manifesto Law 9).

### 2.6 Inspector Refactor

Existing component in current core. Review and enhance:
- Feature flag via `localStorage`.
- Outline-on-hover, version display.
- Docs/storybook link, exposed CSS parts, slot usage visualisation, optional metadata panel.

### 2.7 Documentation (Phase 00 surface)

Base documentation published in Storybook:
- **Getting Started** — Install, minimal setup, hello-world.
- **Theming** — Attribute-based theming, hues, auto-pairing, light/dark.
- **Customisation** — `::part()`, custom properties, component tokens, cascade strategy.
- **Component Spec Template** — `docs/specs/COMPONENT-SPEC-TEMPLATE.md` (referenced by PRD §4 and §8).
- **Competitive Component Analysis** — `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` (referenced by PRD §1.3).

### 2.8 HTMX Integration Spike (P2)

Per Manifesto Law 7 (softened) and PRD §7.2 Phase 0 exit criterion, validate `LineHtmxElement` adapter feasibility: `hx-*` attribute forwarding, server-driven state updates, swap-aware lifecycle hooks.

**Exit rule:** the spike **must complete** by Phase 00 exit, and its **outcome must be documented**. The outcome itself is genuine output of the spike — not pre-cravado. Two valid exits:

- **Committed** → `LineHtmxElement` enters Phase 1 spec scope.
- **Exploratory** → `LineHtmxElement` is documented as deferred / nice-to-have post-1.0.

There is no "spike must produce a YES" gate. Both outcomes are valid Phase 00 exits, provided the outcome is documented with evidence.

---

## 3. Scope — Out

The following are explicitly **not** part of Phase 00:

- **All UI components.** Button, Input, Dialog, etc. begin in Phase 1.
- **SSR/SSG investigation.** Deferred to post-Phase 1 (PRD §1.7).
- **CDN distribution** (unpkg, jsdelivr). Begins Phase 1.
- **Landing page content / marketing.** `apps/site` is scaffold-only in Phase 00 (Astro scaffold + Cloudflare Pages deploy + placeholder page + CI verified). Full landing page content is Phase 1 parallel work.
- **Utility classes** (e.g., the v0.7 utility-first set). Explicitly **not** in Phase 00 scope and explicitly **not** part of the core design system contract. Per PRD §9.13, the decision (ship, rename, or remove) is deferred to Phase 1 spec; with attribute-based theming the v0.7 utility-first pattern is largely redundant. They re-enter discussion only at Phase 1 spec time.
- **Icon library content.** Only the registry contract + 1 reference library wiring; full icon surface lands in Phase 1.
- **`line-form` / cross-field validation orchestration** (post-1.0 nice-to-have).
- **Stable releases.** Phase 00 ships only RCs (PRD §6 note: "No stable releases during Phase 0, only RCs").

---

## 4. High-Level Task Breakdown

Tasks are grouped by stream. Each stream is owned by exactly one supervisor for downstream delegation. Phase 00 uses two supervisors (no `frontend-supervisor` / `backend-supervisor` split applies — this phase ships zero UI):

### 4.0 Supervisor Assignment

| Supervisor | Owns Streams | Definition |
|---|---|---|
| `webcomponents-supervisor` | **C** (Design System Authoring), **D** (Base Class & Runtime Core), **E** (Icon Registry), **G** (Documentation), **H** (HTMX Spike) | `.claude/agents/webcomponents-supervisor.md` |
| `infra-supervisor` | **A** (Runtime & Tooling Migration), **B** (Monorepo Restructure), **F** (Build/Test/Release Infrastructure) | `.claude/agents/infra-supervisor.md` |

Rationale: streams closer to the component runtime, design tokens, and developer-facing docs go to `webcomponents-supervisor`; streams that shape the platform itself (runtime swap, monorepo topology, CI/CD, deploy) go to `infra-supervisor`. The HTMX spike (H) sits with `webcomponents-supervisor` because it validates an element-level adapter (`LineHtmxElement`).

### 4.1 Stream A — Runtime & Tooling Migration

| # | Task | Notes |
|---|---|---|
| A1 | Migrate runtime to Bun, remove pnpm | Status in PRD: Review pending. Verify lockfile, workspaces, scripts. |
| A2 | Migrate lint/format to Biome | Status in PRD: Review pending. Remove ESLint + Prettier + plugins. |
| A3 | Update all dependencies to latest stable | Lit 3+, Vite 8+ (Rolldown stable as default), PostCSS latest, TypeScript latest, Zag.js latest. |
| A4 | Configure npm scope `@websublime/line-*` | Verify via snapshot/canary tag publish. |

### 4.2 Stream B — Monorepo Restructure

| # | Task | Notes |
|---|---|---|
| B1 | Author target package layout under `packages/` | 8 published packages + 2 apps. Currently `packages/` is empty. |
| B2 | Wire workspace dependencies (downward only) | `themes -> colors + schemas`; `utils -> schemas`. Enforced via Manifesto Law 10. |
| B3 | Configure `exports` maps per PRD §9.9 | Including subpath exports, `sideEffects` declaration on `line-components`. |
| B4 | Verify each package builds in isolation | Each package has its own `package.json`, `tsconfig`, and build script. |

### 4.3 Stream C — Design System Authoring (depends on B)

| # | Task | Notes |
|---|---|---|
| C1 | `line-schemas` — TS contracts | `HUES` (31), `ACCENT_HUES` (31), `GRAY_HUES` (6), `SEMANTIC_MAP`. Zod validators. Source of truth for downstream generation. |
| C2 | `line-tokens` — author 18 families + reset | 11 primitive + 7 decorative + browser-defaults reset. All `--line-*` prefixed. Colour-adjacent families (gradients, highlights, svg) reference palette tokens, never absolute colours. |
| C3 | `line-colors` — palette generation script | Imports the 8 TS scale objects per hue from `@radix-ui/colors` (base/alpha × light/dark + P3/P3-alpha × light/dark), plus the 4 special scales. Emits one CSS file per hue with: (a) base + alpha tokens in `light-dark()` (sRGB), (b) wide-gamut P3 + P3-alpha override declarations wrapped in `@supports (color: color(display-p3 1 1 1))` + `@media (color-gamut: p3)`, (c) per-hue static `--line-{hue}-contrast` token (Radix Themes table). Emits `line-colors/src/special.css` for the 4 special scales with the same `@supports` upgrade pattern. Committed output. |
| C4 | `line-colors` — contrast token table | Per-hue static contrast values from the Radix Themes verbatim table (six bright-step-9 hues — `amber`, `yellow`, `lime`, `mint`, `sky`, `cyan` — use `#000`; the other 25 use `#fff`); WCAG AA validation per hue × light/dark to confirm the upstream table holds. |
| C5 | `line-themes` — role mapping generation | Build script reads `line-schemas` enumerations, emits `accent/{hue}.css` and `gray/{hue}.css` mechanically. |
| C6 | `line-themes` — semantics, aliases, defaults | `semantics.css` (success/warning/danger/info fixed at `:root`), `aliases.css` (9 aliases × 6 roles = 54 vars), `defaults.css` (auto-pair table per PRD §9.5). |
| C7 | `line-utils` — helpers | Contrast, mix, etc. Consumes `line-schemas`. |
| C8 | PostCSS pipeline | `postcss-import → postcss-nested → postcss-preset-env → cssnano`. `custom-properties: false`. |
| C9 | CSS snapshot tests | Per-hue palette snapshots; per-role mapping snapshots; auto-pair behavior tests. |
| C10 | Build-time contrast validation | All 31 hues × relevant role pairs × light/dark must pass WCAG AA. |

### 4.4 Stream D — Base Class & Runtime Core (depends on A, B)

| # | Task | Notes |
|---|---|---|
| D1 | `line-core` — `LineElement` base class | Refactor from current `ComponentElement` / `ComponentMixin`. |
| D2 | Inspector mixin refactor | Feature flag via `localStorage`, hover outline, version display, docs link, parts/slot exposure, optional metadata panel. |
| D3 | Metadata mixin | Version, docs, qa tags. |
| D4 | Direction mixin | LTR/RTL via `dir` attribute. |
| D5 | FormAssociated mixin | Opt-in via `ElementInternals`. Provides `setFormValue`, `reportValidity`, `checkValidity`, `:invalid` / `:valid` states. **Test stratification (required):** (a) **unit tests** with `bun test` + mocked `ElementInternals` to verify the contract (mixin calls the right APIs with the right arguments); plus (b) **browser tests** with Playwright against a real `<form>` to verify end-to-end behaviour (submit, reset, validation). Browser tier is mandatory because `happy-dom` does not implement `ElementInternals` (open issue: capricorn86/happy-dom#1419) and `jsdom` is only partial. |
| D6 | `LineMachineController` adapter + Zag.js lifecycle integration | Author `LineMachineController` (Lit `ReactiveController`) at `@websublime/line-core/machine`; wraps `@zag-js/vanilla` (`VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`); re-exports the four primitives for single-import-surface ergonomics. Static-fallback failure mode (Manifesto Law 9). Components never import `@zag-js/vanilla` directly. |
| D7 | Modular shadow-DOM reset sheets | `line-core/styles/*` — 11 modular reset sheets (ARCHITECTURE §14.3–§14.7). |

### 4.5 Stream E — Icon Registry (depends on D)

| # | Task | Notes |
|---|---|---|
| E1 | `line-icons` — agnostic resolver contract | Registry API verified with **two** external libraries: **Lucide** and **Phosphor**. Two libraries (not one) are required so the resolver design is pressure-tested against differing SVG export shapes, naming conventions, and bundle sizes — proving the registry is genuinely agnostic, not Lucide-specific. |
| E2 | Skeleton exports map | Per PRD §6.2 note; full surface finalised in Phase 1. |

### 4.6 Stream F — Build, Test, Release Infrastructure (depends on A, B)

| # | Task | Notes |
|---|---|---|
| F1 | Storybook 10+ setup | `@storybook/web-components-vite` + CEM analyser in `apps/storybook`. |
| F2 | Testing stack | Bun test + `@open-wc/testing-helpers` + Playwright. Verified across one design-system test and one runtime test. |
| F3 | CI/CD pipeline | GitHub Actions: checks, release, snapshot-deploy, snapshot-version. |
| F4 | RC pipeline | Release-candidate pipeline for `next` branch. |
| F5 | `apps/site` scaffold | Astro 5+ scaffold under `apps/site/`; Cloudflare Pages deploy config (`wrangler.toml` or equivalent); placeholder landing page (`line://ui` wordmark + "coming soon"); CI deploy verified end-to-end. Full landing page content is Phase 1 parallel work — out of Phase 00 scope. |

### 4.7 Stream G — Documentation (depends on C, D, F)

| # | Task | Notes |
|---|---|---|
| G1 | Getting Started doc | Install, minimal setup, hello world (in Storybook). |
| G2 | Theming guide | Attribute-based theming, auto-pairing, light/dark, role variables, named aliases. |
| G3 | Customisation guide | `::part()`, custom properties, component tokens, cascade strategy. |
| G4 | `COMPONENT-SPEC-TEMPLATE.md` | Created in `docs/specs/`. Referenced by PRD §4 and §8. |
| G5 | `COMPETITIVE-COMPONENT-ANALYSIS.md` | Created in `docs/`. Referenced by PRD §1.3. |

### 4.8 Stream H — HTMX Spike (P2, parallel)

| # | Task | Notes |
|---|---|---|
| H1 | HTMX integration spike | Validate `LineHtmxElement` adapter: `hx-*` forwarding, server-driven state, swap-aware lifecycle. Spike **must complete** by Phase 00 exit. Outcome documented as one of two valid exits: **committed** (LineHtmxElement enters Phase 1 spec) or **exploratory** (documented as deferred / nice-to-have post-1.0). Decision recorded in the Phase 00 retrospective with evidence. |

---

## 5. External Dependencies & Research Targets

Before any implementation spec (`00-spec-*.md`) is written, the following must be **researched and validated**. Each item is an assumption in the PRD that needs evidence from upstream documentation, source code, or release notes. This is the explicit input list for the research stage that follows plan approval.

### 5.1 Critical (block design-system authoring)

| ID | Dependency | What to validate |
|---|---|---|
| R1 | **`@radix-ui/colors` v3.x** | Confirm **TypeScript hex-string objects only** (no CSS upstream) for 31 hues × 12 steps, four variant families per hue: base (`amber`, `amberDark`), alpha (`amberA`, `amberDarkA`), wide-gamut P3 (`amberP3`, `amberDarkP3`), and wide-gamut P3 alpha (`amberP3A`, `amberDarkP3A`); plus four special scales (`blackA`, `whiteA`, `blackP3A`, `whiteP3A`). Note: `*Contrast` is **not** in `@radix-ui/colors` — it lives in `@radix-ui/themes`. We adopt the Radix Themes per-hue contrast table verbatim (six bright-step-9 hues — `amber`, `yellow`, `lime`, `mint`, `sky`, `cyan` — use `#000`; the other 25 use `#fff`). Also validate browser support for `color(display-p3 …)` + `@media (color-gamut: p3)` across the latest-2 matrix to size the wide-gamut `@supports` fallback. |
| R2 | **CSS `light-dark()` browser support** | Confirm Chrome/Firefox/Safari latest-2 coverage. Confirm shadow-DOM inheritance of `color-scheme`. Document any polyfill path if a target browser version regresses. |
| R3 | **Zag.js latest + `@zag-js/vanilla` primitives** | Confirm `@zag-js/vanilla` public API surface — exactly **four** exported names: `VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`. Confirm machine `start`/`stop`/`subscribe` semantics; confirm interoperability with Lit 3+ `ReactiveController` lifecycle (`hostConnected`/`hostDisconnected`). Note: there is **no `@zag-js/element`** in Zag's monorepo — the integration target is `@zag-js/vanilla`, and we author the Lit adapter (`LineMachineController` at `@websublime/line-core/machine`) on top of it. Note: `bindable` is **not** publicly exported by `@zag-js/vanilla` (it is an internal helper used inside `VanillaMachine`); component machine configs receive `bindable` via the `context({ bindable })` callback argument provided by Zag at runtime, not via import. Document `createMachine` (from `@zag-js/core`) and the `context({ bindable })` callback pattern as referenced in ARCHITECTURE §8. |
| R4 | **Lit 3+ latest** | Confirm `LitElement` + `ElementInternals` interaction. Validate `static formAssociated = true` pattern. Validate `::part()` and shadow DOM `color-scheme` inheritance. |
| R5 | **Vite 8+ (Rolldown stable as default)** | Confirm Vite 8 ships Rolldown 1.0.x as the stable default bundler (replaces Rollup). Validate library-mode builds for Web Components. Verify CSS handling alongside PostCSS (the design-system pipeline runs PostCSS standalone for `line-tokens`/`line-colors`/`line-themes`; component bundling goes through Vite/Rolldown). Document the rollback path as a standard npm `package.json` `overrides` mechanism (`{"overrides": {"vite": "^7.0.0"}}` falls back to Vite 7 + Rollup) — not a Vite-published runbook; it relies on the npm dependency resolver. Use only if a blocking regression surfaces. |
| R6 | **PostCSS plugins** | Confirm latest stable versions of `postcss-import`, `postcss-nested`, `postcss-preset-env`, `cssnano`. Validate `custom-properties: false` flag in `postcss-preset-env`. |
| R7 | **Bun workspaces** | Confirm Bun workspace behavior matches pnpm-style monorepo expectations: dependency resolution, scripts, `bun --filter`. Validate against the 8-package layout. |

### 5.2 High-priority (block runtime/base-class authoring)

| ID | Dependency | What to validate |
|---|---|---|
| R8 | **`ElementInternals` API** | Confirm `setFormValue`, `setValidity`, `reportValidity`, `checkValidity` across latest-2 of Chrome/Firefox/Safari. Validate `:invalid` / `:valid` pseudo-class behavior on custom elements. **Note:** `happy-dom` does not implement `ElementInternals` (capricorn86/happy-dom#1419, open since 2025-02); `jsdom` is only partial (jsdom issues #3831, #3758). Phase 00 FormAssociated mixin contract verification therefore requires a Playwright tier (real browser) in addition to mocked `bun test` units. |
| R9 | **Biome v2.x** | Confirm Biome covers the lint + format rules currently provided by ESLint + Prettier for this codebase. Document migration of any custom rules. |
| R10 | **Storybook 10+ + `@storybook/web-components-vite`** | Confirm compatibility with Vite 8+ (Rolldown stable as default). Validate CEM analyser integration. (Storybook bumped from 8 → 10+ in this revision to align with latest and avoid drift during Phase 00.) |
| R11 | **`@open-wc/testing-helpers`** | Confirm compatibility with Bun test runner (the canonical pairing is with `@web/test-runner`; need to validate). **Decision gate (no silent pivot):** if R11 reports incompatibility, the team **stops** at the research stage and returns to **plan + PRD revision** to consciously add `@web/test-runner` (or another alternative) as a supported runner. Only after the PRD is updated is the spec stage permitted to author against the new runner. This avoids drift between PRD (stack declaration) and spec (implementation reality). |
| R12 | **Playwright** | Confirm CI integration and snapshot strategies for Web Components. |

### 5.3 Medium-priority (block Phase 00 docs & HTMX spike)

| ID | Dependency | What to validate |
|---|---|---|
| R13 | **CEM analyser (`@custom-elements-manifest/analyzer`)** | Confirm latest version, Lit 3 plugin compatibility, integration with Storybook 10+. |
| R14 | **Changesets v2.x** | Confirm GitHub Actions release flow, snapshot/canary tag publishing, monorepo-aware changelog generation. |
| R15 | **HTMX integration patterns** | Research existing Web Component + HTMX integrations. Confirm `hx-*` attribute forwarding mechanics, swap-aware lifecycle behavior. Document feasibility/risks. |
| R16 | **Lucide + Phosphor** | Validate the registry against **two** reference libraries — Lucide and Phosphor — to confirm agnosticism. Confirm SVG export format, naming conventions, and package size implications for each. Document any divergence the registry resolver must handle (e.g., naming style, stroke vs fill defaults). |

### 5.4 Resolved Decisions (confirmed with user, 2026-05-19)

The following decisions were open at plan draft and have been resolved by user confirmation. They are recorded here for traceability.

| ID | Decision | Resolution | Reference |
|---|---|---|---|
| O1 | Supervisor naming for downstream delegation. | **Resolved.** Two supervisors: `webcomponents-supervisor` (streams C, D, E, G, H) and `infra-supervisor` (streams A, B, F). See §4.0. | This plan §4.0 |
| O2 | Utility classes — confirm deferral. | **Resolved.** Explicitly **not** in Phase 00 scope and explicitly **not** part of the core design system contract. Decision deferred to Phase 1 spec per PRD §9.13. | PRD §9.13, this plan §3 |
| O3 | HTMX outcome target at Phase 00 exit. | **Resolved.** Spike must **complete** by Phase 00 exit; outcome must be **documented**. Both **committed** and **exploratory** are valid exits — no "spike must produce a YES" gate. | This plan §2.8, §4.8, §7.8 |
| O4 | `apps/site` scope in Phase 00. | **Resolved.** Scaffold-only: Astro 5+ scaffold + Cloudflare Pages deploy config + placeholder landing page + CI deploy verified end-to-end. Full landing content is Phase 1 parallel work. | This plan §2.3, §4.6/F5 |
| O5 | Test runner pairing if R11 reports incompatibility. | **Resolved.** No silent pivot. If R11 fails, stop at research stage and return to plan + PRD revision to consciously add an alternative runner before any spec work. | This plan §5.2/R11, §8 |

---

## 6. Task Dependencies

```
A (Tooling Migration) ─┬─> B (Monorepo Restructure) ─┬─> C (Design System Authoring) ─┐
                       │                              │                                │
                       └─> F (Build/Test/Release) ────┤                                ├─> G (Documentation)
                                                      │                                │
                                                      ├─> D (Base Class & Runtime) ────┤
                                                      │                                │
                                                      └─> E (Icon Registry, after D) ──┘

H (HTMX Spike) — parallel to all, depends on D
```

**Critical path:** A → B → C → G. Stream C (design-system authoring) is the longest-pole work and gates documentation and Phase 1.

**Parallelisable:** Once B lands, C and D can proceed in parallel. F can begin in parallel with B once tooling migration (A) is complete. H runs entirely in parallel and is descoped if it slips.

---

## 7. Acceptance Criteria for Phase 00

Phase 00 is **complete** when **all** of the following hold (mirrors PRD §7.2 Exit Criteria with plan-level additions in *italics*):

### 7.1 Structural

- [ ] Monorepo structure matches target: **8 published packages + 2 apps** under `packages/` and `apps/`.
- [ ] All 5 design-system packages (`line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils`) authored under `packages/` with `exports` maps matching PRD §9.9.
- [ ] All 3 runtime packages (`line-core`, `line-components`, `line-icons`) scaffolded. `line-components` is an empty umbrella; `line-icons` exposes the registry contract.
- [ ] Cross-layer dependencies enforced downward only (verified via static analysis or build-time check).

### 7.2 Design System

- [ ] Palettes generated from `@radix-ui/colors` 3.x and **committed** into `line-colors/src/`.
- [ ] Role mappings, semantic mappings, named aliases (54 vars), and auto-pair defaults functional in `line-themes`.
- [ ] CSS snapshot tests pass per-hue, per-role, per-auto-pair-behaviour.
- [ ] Schema-validation tests (Zod) pass; `HUES`, `ACCENT_HUES`, `GRAY_HUES`, `SEMANTIC_MAP` match the generated CSS.
- [ ] Build-time contrast validation passes for all 31 hues × relevant role pairs × light/dark.
- [ ] PostCSS pipeline operational; Vite/Rolldown component bundling operational (verified by a smoke build).

### 7.3 Runtime Core

- [ ] `LineElement` refactor complete; mixins (inspector, metadata, direction, form-associated) operational.
- [ ] FormAssociated mixin verified against a native `<form>` (submit, reset, validity) — **two test tiers required**: (a) `bun test` unit tests with mocked `ElementInternals` confirming the mixin calls the right API surface; (b) Playwright browser test exercising real submit/reset/validation cycles. The browser tier is mandatory because `happy-dom`/`jsdom` do not fully implement `ElementInternals`.
- [ ] Inspector refactored: feature flag via `localStorage`, hover outline, version display, metadata exposure.
- [ ] `LineMachineController` (Lit `ReactiveController` at `@websublime/line-core/machine`) operational; wraps `@zag-js/vanilla` primitives; component machine lifecycle (`start`/`subscribe`/`stop`) managed by the controller; failure mode renders static fallback without throwing.
- [ ] *A "hello world" component (private, not published) built using `LineElement` end-to-end as the integration test.*

### 7.4 Icon Registry

- [ ] Icon registry operational; agnostic resolver verified against **two** external libraries (Lucide + Phosphor) to pressure-test the design and prove agnosticism.

### 7.5 Tooling

- [ ] Bun runtime + workspaces operational; pnpm removed.
- [ ] Biome operational; ESLint + Prettier + plugins removed.
- [ ] All dependencies on latest stable versions (Lit 3+, Vite 8+ (Rolldown stable as default), PostCSS latest, TypeScript latest, Zag.js latest).
- [ ] npm scope `@websublime/line-*` configured; publishability verified via snapshot/canary tag.

### 7.6 CI/CD

- [ ] GitHub Actions: checks (lint, typecheck, test, build), release, snapshot-deploy, snapshot-version operational.
- [ ] RC pipeline for `next` branch operational; verified end-to-end with at least one RC release.
- [ ] Storybook + `apps/site` preview deploys verified.

### 7.7 Documentation

- [ ] Storybook 10+ operational with `@storybook/web-components-vite` + CEM analyser.
- [ ] Base documentation published in Storybook: Getting Started, Theming, Customisation.
- [ ] `docs/specs/COMPONENT-SPEC-TEMPLATE.md` created.
- [ ] `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` created.

### 7.8 HTMX Spike

- [ ] HTMX integration spike **completed** by Phase 00 exit.
- [ ] Outcome **documented** as one of: **committed** (`LineHtmxElement` enters Phase 1 spec scope) or **exploratory** (`LineHtmxElement` documented as deferred / nice-to-have post-1.0). Both outcomes are valid exits; the decision is genuine output of the spike.

### 7.9 Process

- [ ] All PRD §7.2 tasks marked "Review pending" verified for quality and integration.
- [ ] No stable releases; only RCs (per PRD §6 note).
- [ ] Phase 00 retrospective documented (open items, lessons learned, hand-off to Phase 1).

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `@radix-ui/colors` shape changes between minor versions | Low | High (regenerates all of `line-colors`) | Pin version; regenerate only on explicit bump; commit generated CSS. |
| Bun test + `@open-wc/testing-helpers` incompatibility | Medium | Medium | Validate early in R11. **No silent pivot:** on incompatibility, stop and revise plan + PRD to consciously add `@web/test-runner` (or alternative) before any spec work proceeds. |
| Vite 8 + Rolldown regression on library-mode CSS (Rolldown is stable as default in v8, but recently promoted from experimental) | Low–Medium | High | Validate early in R5; documented rollback path = one-line `package.json` override to Vite 7 + Rollup if a blocker surfaces. |
| `ElementInternals` browser quirks on Safari | Low | Medium | Validate in R8 with a test matrix; document workarounds in `LineElement`. |
| Biome rule coverage gap vs ESLint | Low | Low | Validate in R9; accept minor rule loss (per PRD direction). |
| HTMX spike inconclusive at phase exit | Medium | Low | P2 task; deferral is an explicit allowed outcome. |
| Cross-layer leakage in design-system packages | Low | High (violates Manifesto Law 10) | Enforce downward-only deps via build-time check; CI fails on violation. |
| Scope creep — implementing components in Phase 00 | Medium | High | Hard rule: zero UI components in Phase 00. Components begin in Phase 1. |

---

## 9. Deliverable Summary

At the end of Phase 00:

> **Functional monorepo. Zero UI components, but any developer can create a `line://ui` component with the base class and have everything working — build, test, docs, release.** (PRD §7.2 deliverable statement.)

Plus, a fully operational layered design system (5 packages, 31 Radix hues, attribute-based theming, light/dark via `light-dark()`) ready to back every component shipped in Phases 1–8.

---

## 10. Next Steps After This Plan is Approved

1. **Research stage** — for each item in §5, produce a research note. Output: a research document per critical dependency, stored under `docs/research/00-*.md`. If research contradicts the plan (e.g., R11 decision gate fires), return to **plan + PRD revision** before proceeding.
2. **Specification stage** — Ada (or designated architect) writes `docs/specs/00-spec-design-system.md` (and any sibling specs needed for runtime/tooling) using research findings. Spec is grounded in **verified facts**, not the assumptions in this plan.
3. **Coherence review** — spec must pass **3 clean rounds** of coherence review against the plan, PRD, and research findings before moving forward.
4. **`bd` issue creation** — **`bd` epics and tasks are created only at the end of Stage 2**, after: (a) plan is APPROVED, (b) research is COMPLETE (no contradictions, or contradictions resolved via plan↔research loop), (c) spec is APPROVED, and (d) coherence review passes 3 clean rounds. Only then does `/tasks` dispatch (Grace) decompose the spec into `bd` epic + tasks. The plan's task streams (§4 A–H) become `bd` epics/tasks **only via `/tasks`** — **no `bd` issues are created from the plan itself**.
5. **Task delegation** — supervisor agents (`webcomponents-supervisor`, `infra-supervisor`) receive concrete, implementable `bd` tasks derived from the approved specs.
6. **Phase 1 unblocked** — once Phase 00 exit criteria are met, Phase 1 (Core Primitives, v0.2.0) begins.

---

## 11. Resolved Questions (2026-05-19)

All open questions raised at draft have been answered. Recorded here for the audit trail; canonical resolutions live in §5.4 and §10.

1. **Supervisor naming** (O1) — **Resolved.** `webcomponents-supervisor` (C, D, E, G, H) + `infra-supervisor` (A, B, F). See §4.0.
2. **Utility classes** (O2) — **Resolved.** Explicitly out of Phase 00 scope and not part of the core design system contract; decision deferred to Phase 1 spec per PRD §9.13. See §3.
3. **HTMX outcome** (O3) — **Resolved.** Spike must complete and outcome must be documented; both committed and exploratory are valid Phase 00 exits. See §2.8, §4.8, §7.8.
4. **`apps/site` Phase 00 scope** (O4) — **Resolved.** Scaffold-only: Astro 5+ + Cloudflare Pages deploy + placeholder page + CI verified. Full landing content is Phase 1 parallel. See §2.3, §4.6/F5.
5. **Test runner fallback** (O5) — **Resolved.** No silent pivot. R11 incompatibility forces a return to plan + PRD revision before any spec work. See §5.2/R11, §8.
6. **`bd` issue creation timing** — **Resolved.** `bd` epics/tasks are created **only at the end of Stage 2**, after plan APPROVED + research COMPLETE + spec APPROVED + coherence review (3 clean rounds). Decomposition happens via `/tasks` (Grace), not from the plan itself. See §10.
