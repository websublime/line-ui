# line://ui -- Product Execution Plan

**Date:** 2026-03-12
**Status:** DRAFT
**Author:** Grace (product-manager)
**References:**
- PRD: `docs/PRODUCT-REQUIREMENTS-SPECIFICATION.md` (v0.7.0, Approved)
- Architecture: `docs/ARCHITECTURE.md`
- Project context: `CLAUDE.md`

This document is the execution plan that bridges the PRD (what to build) and the issue tracker (individual tasks). It answers: what gets done, in what order, what blocks what, and how we know a phase is complete.

---

## 1. Phase Overview

| Phase | Name | Version | Epics | Key Deliverables | Prerequisites |
|-------|------|---------|-------|------------------|---------------|
| 0 | Foundation | v0.1.0 | 7 | Branding refactor, LineElement base class, monorepo restructure, theme v2, testing/CI/CD, Storybook, icon registry | None |
| 1 | Core Primitives | v0.2.0 | 5 | 20 components (Button, Alert, Badge, Avatar, layout utilities, etc.), semantic aliases, custom theme docs | Phase 0 |
| 2 | Essential Forms | v0.3.0 | 3 | 15 form components (Input, Field, Checkbox, Select, etc.), Field orchestration, formAssociated validation | Phase 1 |
| 3 | Overlays & Navigation | v0.4.0 | 3 | 16 components (Dialog, Popover, Toast, Tabs, Accordion, Menu, etc.) | Phase 1 |
| 4 | Advanced Forms | v0.5.0 | 2 | 13 components (Combobox, DatePicker, ColorPicker, FileUpload, etc.) | Phase 2, Phase 3 |
| 5 | Data Display & Advanced Navigation | v0.6.0 | 3 | 15 components (Table, Progress, Carousel, TreeView, Wizard, etc.) | Phase 3 |
| 6 | Layout & Desktop-Inspired | v0.7.0 | 2 | 17 components (AppShell, Sidebar, CommandPalette, Splitter, etc.) | Phase 5 |
| 7 | Innovative | v0.8.0 | 2 | 17 components (KanbanBoard, DataGrid, Dock, Tour, etc.) | Phase 5 |
| 8 | Real-World / Domain | v0.9.0 | 2 | 18 components (Ballot, AudioPlayer, Terminal, CalendarView, etc.) | Phase 5 |
| -- | Full catalogue | v1.0.0 | -- | 131 components total, stable API, migration guides, public site | All phases |

> **Note:** Site content (`packages/site/`) is scaffolded in Phase 0 (P0-E3-T4) but content pages are developed incrementally from Phase 1 onward as parallel work. The v1.0.0 milestone requires the public site to be live.

---

## 2. Phase 0 -- Foundation (v0.1.0) -- DETAILED

Phase 0 produces zero UI components. Its purpose is to establish the monorepo, tooling, base class, theme system, and CI/CD pipeline so that any developer can create, build, test, and document a line://ui component.

### 2.1 Epic 1: Branding Refactor

This epic must complete before all other Phase 0 work. Everything downstream depends on the `line-*` naming being in place.

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E1-T1 | Rename theme package | Rename `@websublime/vitamina-theme` to `@websublime/line-theme` in `package.json`, update all internal references, and rename `vita.css` to `line.css`. | None | Violet | S | PRD 9.14 |
| P0-E1-T2 | Prefix all palette CSS variables | Find-and-replace all unprefixed palette variables (`--blue-9`) to `--line-blue-9` across all 28 palette files in `packages/theme/src/colors/`. | None | Violet | M | PRD 9.14 |
| P0-E1-T3 | Prefix all semantic CSS variables | Rename unprefixed semantic variables (`--background`, `--subtle-background`, etc.) to `--line-background`, `--line-subtle-background`, etc. in schemas, rules, normalize, and general CSS files. | None | Violet | M | PRD 9.14 |
| P0-E1-T4 | Prefix all CSS classes | Rename `.schema-*` to `.line-schema-*`, `.is-*` to `.line-is-*` across all schema and utility CSS files. | None | Violet | M | PRD 9.14 |
| P0-E1-T5 | Rename core package | Rename `@websublime/vitamina-core` to `@websublime/line-core` in `package.json` and update workspace references. | None | Luna | S | PRD 9.14 |
| P0-E1-T6 | Rename base class | Rename `ComponentElement` / `ComponentMixin` to `LineElement` in all core source files. Update imports and exports. | None | Luna | S | PRD 9.14, ARCH 6 |
| P0-E1-T7 | Rename tag prefix | Replace `vita-` tag prefix with `line-` in all source, tests, and configuration. | P0-E1-T6 | Luna | S | PRD 9.14 |
| P0-E1-T8 | Validate branding refactor | Run build for both packages, verify all CSS variables resolve correctly, no broken references. Manual spot-check of output CSS. | P0-E1-T1 through P0-E1-T7 | Olive | S | PRD 9.14 |

### 2.2 Epic 2: Build Pipeline & PostCSS Fix

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E2-T1 | Define foundation tokens explicitly | Create `src/tokens.css` with all foundation token scales (typography, sizing, shadows, z-index, opacity, motion, radius, border-width, focus-ring, aspect-ratio). Create `src/semantic.css` extracted from `rules.css`. Remove `postcss-jit-props` and `open-props` from devDependencies. Add contrast tokens (`--line-{palette}-contrast`) to all 28 colour files. Update all 28 schemas to use contrast token. Reference: `docs/DESIGN-SYSTEM-IMPLEMENTATION-GUIDE.md` Phases 1-3. | P0-E1-T3 | Violet | L | PRD 9.3, 9.15 |
| P0-E2-T2 | Add postcss-custom-media to pipeline | Ensure `postcss-custom-media` is active in the pipeline so that custom media queries from `media.css` are resolved. Verify breakpoint and preference queries work. | P0-E1-T3 | Violet | S | PRD 9.8 |
| P0-E2-T3 | Remove demo files from production bundle | Exclude `custom/*-custom.css` demo swatch files from all build outputs. Move them to a location suitable for Storybook consumption only. | P0-E1-T1 | Violet | S | PRD 9.12, Decision T5 |
| P0-E2-T4 | Configure Vite 7+ with Rolldown | Verify or update Vite to 7+ with Rolldown for library mode builds. Ensure both core and theme packages build correctly with the new bundler. | P0-E1-T5, P0-E1-T1 | Luna | M | PRD 2 |
| P0-E2-T5 | Verify PostCSS pipeline end-to-end | Build the full theme bundle (`line.css`). Validate the import chain: `rules.css` -> `normalize.css` -> `general.css` -> all 28 themes. Verify minified outputs match the documented build outputs table. | P0-E2-T1, P0-E2-T2, P0-E2-T3 | Violet | M | PRD 9.12 |

### 2.3 Epic 3: Monorepo Restructure

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E3-T1 | Create components package scaffold | Create `packages/components/` with `package.json` (`@websublime/line-components`), `tsconfig.json`, `vite.config.ts`, and `src/` directory. Configure workspace in root `package.json`. | P0-E1-T8 | Luna | M | PRD 6.1 |
| P0-E3-T2 | Create icons package scaffold | Create `packages/icons/` with `package.json` (`@websublime/line-icons`), `tsconfig.json`, and `src/` directory. Configure workspace. | P0-E1-T8 | Luna | S | PRD 6.1 |
| P0-E3-T3 | Create storybook package scaffold | Create `packages/storybook/` as a private workspace package with Storybook 8 configuration (see Epic 5). | P0-E1-T8 | Luna | S | PRD 6.1 |
| P0-E3-T4 | Create site package scaffold | Create `packages/site/` as a private workspace package for the Astro site. Minimal scaffold only -- site content is Phase 1 parallel work. | P0-E1-T8 | Olive | S | PRD 6.1 |
| P0-E3-T5 | Configure Bun workspaces | Verify Bun workspace configuration works with all 6 packages. Ensure `bun install` resolves all inter-package dependencies. Verify `bun run build` from root builds all packages in correct order. | P0-E3-T1 through P0-E3-T4 | Olive | M | PRD 2 |
| P0-E3-T6 | Configure package.json exports | Set up `package.json` `exports` field for core, components, theme, and icons packages following the documented pattern (barrel export + per-component entrypoints for components, per-theme for theme). | P0-E3-T5 | Luna | M | PRD 6.2 |

### 2.4 Epic 4: LineElement Base Class & Mixins

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E4-T1 | Refactor LineElement base class | Refactor the renamed `LineElement` to support three tiers: pre-built Zag.js machine, custom `createMachine()`, and static (no machine). Lifecycle-managed machine connect/disconnect. Zero overhead for static components. Spec: `.spec/BASE-SPEC.md` §2. | P0-E4-T3, P0-E4-T4 | Luna | L | ARCH 6, ARCH 8 |
| P0-E4-T2 | Implement Inspector behavior | Refactor the existing inspector controller into a built-in behavior on `LineElement`. Feature flag via `localStorage`. Expose metadata: version, docs link, scope, QA tags. Expose CSS parts for inspector overlay. Spec: `.spec/BASE-SPEC.md` §3.4. | P0-E4-T1 | Luna | M | PRD 7.2 (Inspector task), Appendix B |
| P0-E4-T3 | Implement Metadata mixin | Mixin that provides component version, documentation URL, and description as properties. Consumed by Inspector behavior. Spec: `.spec/BASE-SPEC.md` §3.3. | P0-E1-T6 | Luna | S | ARCH 6 |
| P0-E4-T4 | Implement Direction mixin | Mixin for LTR/RTL detection and `dir` attribute management. Spec: `.spec/BASE-SPEC.md` §3.5. | P0-E1-T6 | Luna | S | ARCH 6, PRD 1.7 (RTL) |
| P0-E4-T5 | Implement FormAssociated mixin | Opt-in mixin using `ElementInternals` for native `<form>` participation. Provides `setFormValue()`, `reportValidity()`, `checkValidity()`, `:invalid`/`:valid` states. | P0-E4-T1 | Luna | L | ARCH 7, PRD 7.2 (FormAssociated task) |
| P0-E4-T6 | Validate Zag.js integration | Spike: integrate `@zag-js/element` adapter with `LineElement`. Validate that pre-built machines connect correctly and that custom `createMachine()` works. Document any maturity risks. | P0-E4-T1 | Luna | M | PRD 7.2 (LineElement refactor), ARCH 8 |
| P0-E4-T7 | Validate HTMX integration | Spike: validate `LineHtmxElement` adapter with `hx-*` forwarding, server-driven state, swap-aware lifecycle. Document findings and decide if exploratory or committed for Phase 1. Non-blocking — does not gate Phase 0 completion. | P0-E4-T1 | Luna | M | PRD 7.2 (HTMX task), Appendix A |

### 2.5 Epic 5: Storybook & Documentation

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E5-T1 | Setup Storybook 8 | Install and configure `@storybook/web-components-vite` in `packages/storybook/`. Configure Vite integration. Verify dev server starts and builds. | P0-E3-T3 | Luna | M | PRD 5.1 |
| P0-E5-T2 | Configure CEM Analyzer | Install and configure `@custom-elements-manifest/analyzer` to generate `custom-elements.json` from Lit source. Verify Storybook reads the manifest and auto-generates API docs. | P0-E5-T1, P0-E4-T1 | Luna | M | PRD 5.1 |
| P0-E5-T3 | Create Getting Started story | Write the "Getting Started > Installation" Storybook page covering: install, import, first component render. | P0-E5-T1 | Luna | S | PRD 5.1 (Storybook structure) |
| P0-E5-T4 | Create Theming guide story | Write the "Getting Started > Theming" Storybook page: how to apply themes, switch palettes, enable dark mode. | P0-E5-T1, P0-E2-T5 | Violet | S | PRD 5.1 (Storybook structure) |
| P0-E5-T5 | Create Customisation guide story | Write the "Getting Started > Customisation" Storybook page: `::part()` usage, CSS custom properties, dual-layer strategy. | P0-E5-T1 | Luna | S | PRD 5.1 (Storybook structure) |
| P0-E5-T6 | Create Foundation token stories | Write Storybook pages for Foundation section: Colours (palette visual), Typography, Spacing, Shadows, Motion. Interactive token browser. | P0-E5-T1, P0-E2-T5 | Violet | M | PRD 5.1 (Storybook structure) |

### 2.6 Epic 6: Testing & CI/CD

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E6-T1 | Setup Bun test runner | Configure `bun test` with `@open-wc/testing-helpers` for unit and component tests. Create test utilities and a sample test to validate the setup. | P0-E3-T5 | Olive | M | PRD 5.2 |
| P0-E6-T2 | Setup Playwright | Install Playwright for visual regression testing. Configure screenshot comparison. Create a baseline test. | P0-E6-T1 | Olive | M | PRD 5.2 |
| P0-E6-T3 | Create GitHub Actions checks workflow | Implement `checks.yml`: bun install, biome lint+format, build all packages, bun test, Playwright visual regression, storybook build, CEM generation check. Runs on PRs. | P0-E6-T1, P0-E6-T2, P0-E5-T2 | Olive | L | PRD 6.5 |
| P0-E6-T4 | Create GitHub Actions release workflow | Implement `release.yml`: Changesets publish + Storybook deploy + site deploy (if changed) + GitHub release notes. Runs on merge to main. | P0-E6-T3 | Olive | L | PRD 6.4, 6.5 |
| P0-E6-T5 | Create RC pipeline for next branch | Implement snapshot/RC build pipeline: merge to `next` triggers automatic release candidate builds. No stable releases during Phase 0. | P0-E6-T4 | Olive | M | PRD 6.5 (RC Strategy) |
| P0-E6-T6 | Configure npm scope | Set up `@websublime/line-*` scope on npm. Verify publish access for all target package names. | None | Olive | S | PRD 7.2 (npm scope task) |
| P0-E6-T7 | Configure Changesets | Set up Changesets for the monorepo. Configure linked versioning. Verify changeset add/version/publish flow. | P0-E3-T5 | Olive | S | PRD 6.4 |

### 2.7 Epic 7: Icon Registry

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E7-T1 | Design icon registry API | Implement the agnostic icon resolver system in `packages/icons/`. Registry where consumers register icon libraries. Each library is a resolver: given a name, returns SVG. Zero icons bundled. | P0-E3-T2, P0-E4-T1 | Luna | M | ARCH 11, PRD 7.2 (Icon registry task) |
| P0-E7-T2 | Create Icon Setup guide story | Write the "Getting Started > Icon Setup" Storybook page: how to register icon libraries, custom icons, SVG sources. | P0-E7-T1, P0-E5-T1 | Luna | S | PRD 5.1 (Storybook structure) |

### 2.8 Dependency Graph

```
P0-E1 (Branding Refactor)
  T1 (theme pkg rename) ─────────────────────┐
  T2 (palette vars) ─────────────────────────┐│
  T3 (semantic vars) ────────────────────────┐││
  T4 (CSS classes) ──────────────────────────┤││
  T5 (core pkg rename) ─────────────────────┐│││
  T6 (base class rename) ──► T7 (tag prefix)┤│││
                                             ││││
  T8 (validate branding) ◄──────────────────ALL┘

P0-E2 (Build Pipeline)                      depends on E1
  T1 (tokens.css) ◄── E1-T3
  T2 (custom-media) ◄── E1-T3
  T3 (remove demos) ◄── E1-T1
  T4 (Vite 7+) ◄── E1-T5, E1-T1
  T5 (verify pipeline) ◄── T1, T2, T3

P0-E3 (Monorepo)                            depends on E1-T8
  T1 (components pkg) ─┐
  T2 (icons pkg) ──────┤
  T3 (storybook pkg) ──┼──► T5 (Bun workspaces) ──► T6 (exports)
  T4 (site pkg) ───────┘

P0-E4 (LineElement)                         depends on E1-T6
  T3 (Metadata) ◄── E1-T6 ──┐
  T4 (Direction) ◄── E1-T6 ──┼──► T1 (base class refactor) ──► T2 (Inspector)
                              │                             ──► T5 (FormAssociated)
                              │                             ──► T6 (Zag.js spike)
                              │                             ──► T7 (HTMX spike)

P0-E5 (Storybook)                          depends on E3-T3
  T1 (setup) ──► T2 (CEM) ◄── E4-T1
             ──► T3 (Getting Started)
             ──► T4 (Theming guide) ◄── E2-T5
             ──► T5 (Customisation guide)
             ──► T6 (Foundation tokens) ◄── E2-T5

P0-E6 (Testing & CI/CD)                    depends on E3-T5
  T6 (npm scope) ── standalone
  T7 (Changesets) ◄── E3-T5
  T1 (bun test) ──► T2 (Playwright) ──► T3 (checks.yml) ◄── E5-T2
                                         T3 ──► T4 (release.yml)
                                                T4 ──► T5 (RC pipeline)

P0-E7 (Icon Registry)                      depends on E3-T2, E4-T1
  T1 (registry API) ─���► T2 (Icon Setup guide) ◄── E5-T1
```

### 2.9 Critical Path

```
E1 (Branding) ──► E2 (Build Pipeline)
              ──► E3 (Monorepo) ──► E5 (Storybook)
              │                 ──► E6 (Testing/CI)
              └── E4 (LineElement) ◄── E1-T6 only (parallel with E2, E3)
                  └── E7 (Icon Registry) ◄── E3-T2 + E4-T1
```

Branding must complete first. E4 (LineElement) depends only on E1-T6 (base class rename), so it starts in parallel with E2 and E3. E5 and E6 depend on E3 (monorepo scaffold). E7 depends on both E3-T2 and E4-T1.

### 2.10 Done Criteria for Phase 0

All of the following must be true:

- [ ] All packages use `line-*` naming (npm names, CSS variables, CSS classes, tag prefix, base class)
- [x] Foundation tokens defined in `tokens/` directory (~299 core tokens across 11 family files, all `--line-*` prefixed) — E8 T1 complete
- [ ] Semantic defaults defined in `semantic.css` (split from rules.css)
- [ ] Contrast token `--line-{palette}-contrast` added to all 28 colour files
- [ ] All 28 schemas updated to use contrast token (`--line-solid-text`)
- [ ] `postcss-jit-props` and `open-props` removed from devDependencies
- [ ] Build outputs restructured: dist/tokens.min.css, dist/semantic.min.css, dist/aliases.min.css, dist/colors/, dist/schemas/, dist/themes/
- [ ] Demo/swatch files are excluded from production CSS outputs
- [ ] Monorepo has 6 packages: core, components, theme, icons, site, storybook
- [ ] `bun install` and `bun run build` work from root across all packages
- [ ] `LineElement` supports three tiers: pre-built machine, custom machine, static
- [ ] `FormAssociated` mixin works with native `<form>` elements (submit, reset, validation)
- [ ] Inspector mixin activates via `localStorage` feature flag
- [ ] Zag.js integration validated (pre-built + custom machines connect to `LineElement`)
- [ ] Storybook 8 dev server starts and builds; CEM-generated API docs work
- [ ] Getting Started, Theming, Customisation, and Foundation pages exist in Storybook
- [ ] `bun test` runner works with `@open-wc/testing-helpers`
- [ ] Playwright visual regression baseline established
- [ ] CI checks workflow runs on PRs (lint, build, test, visual regression, storybook build)
- [ ] Release workflow publishes via Changesets on merge to main
- [ ] RC pipeline triggers on merge to `next`
- [ ] Icon registry API is implemented with zero bundled icons
- [ ] HTMX integration spike is documented with go/no-go recommendation
- [ ] A developer can create a new component using `LineElement`, build it, test it, and see it in Storybook
- [ ] Build-time token validation (var() cross-reference ensures no undefined token references)
- [ ] Contrast validation script verifies WCAG AA for all 28 palettes (light + dark)
- [ ] Token parity tests confirm light/dark mode produce equivalent token sets
- [ ] Snapshot tests of generated CSS outputs detect unintended regressions
- [ ] Playwright visual regression of `apps/showcase/` established as baseline

---

## 3. Phase 1 -- Core Primitives (v0.2.0) -- DETAILED

Phase 1 delivers 20 components that validate the entire architecture: base class, parts convention, slot/part decision rule, per-component build pipeline, bundle splitting, CEM documentation, and testing.

### 3.1 Epic 1: Semantic Alias Layer & Theme Documentation

These are theme-level tasks that must complete before components can reference semantic tokens.

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P1-E1-T1 | Implement semantic alias layer | Create `src/aliases.css` defining 6 aliases (primary, danger, success, warning, info, neutral) x 9 intent tokens = 54 variables. Intent tokens per alias: base, hover, active, text, subtle, subtle-hover, outline, outline-hover, fg. Default palette mappings as documented. Reference: `docs/DESIGN-SYSTEM-IMPLEMENTATION-GUIDE.md` Phase 4. | Phase 0 complete | Violet | M | PRD 9.5, Decision T6 |
| P1-E1-T2 | Document custom theme contract | Create Storybook documentation page explaining how consumers create custom themes: colour file (12 levels, light+dark), schema file (14 semantic roles), optional alias override. Include a step-by-step example. | P1-E1-T1 | Violet | M | PRD 9.6, Decision T4 |
| P1-E1-T3 | Rebuild theme bundle with aliases | Rebuild the full theme bundle (`line.css`) to include the alias layer. Verify all documented build outputs (per-palette, per-schema, per-theme, utils) are correct. | P1-E1-T1 | Violet | S | PRD 9.12 |

### 3.2 Epic 2: Preset Package Scaffold

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P1-E2-T1 | Scaffold presets package | Create `packages/presets/` with `package.json` (`@websublime/line-presets`), `postcss.config.mjs`, `src/index.css`. Configure as workspace package with `peerDependency` on `@websublime/line-theme >= 0.8.0`. | Phase 0 complete | Luna | S | PRD 9.16 |
| P1-E2-T2 | Write preset styles for Phase 1 components | Create per-component CSS files in `presets/src/` for all 20 Phase 1 components. Uses `::part()` selectors and `--line-{component}-*` tokens. Reference: `docs/DESIGN-SYSTEM-IMPLEMENTATION-GUIDE.md` Phase 7. | P1-E2-T1, P1-E5 (all) | Luna | L | PRD 9.16 |

### 3.3 Epic 3: Component Specs (Just-in-Time)

Specs must be written and approved before implementation begins. All 20 components need specs.

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P1-E3-T1 | Write specs for static primitives | Write `.spec/` files for: Alert, Badge, Chip, Avatar, Separator, VisuallyHidden, Portal, Kbd, Skeleton, Stack, Grid, Center, AspectRatio, Spinner. 14 specs following `COMPONENT-SPEC-TEMPLATE.md`. | Phase 0 complete | Luna | L | PRD 4.1, 8.1 |
| P1-E3-T2 | Write specs for interactive primitives | Write `.spec/` files for: Button, IconButton, ButtonGroup, AvatarGroup, Presence. 5 specs. | Phase 0 complete | Luna | M | PRD 4.1, 8.1 |
| P1-E3-T3 | Write spec for Icon component | Write `.spec/` for Icon component -- depends on icon registry being complete (Phase 0). | Phase 0 complete | Luna | S | PRD 4.1, ARCH 11 |
| P1-E3-T4 | Review and approve all Phase 1 specs | All 20 specs reviewed, status set to `approved`. | P1-E3-T1 through P1-E3-T3 | Luna | M | PRD 8.2, 8.3 |

### 3.4 Epic 4: Static Components (no machine)

Static components are presentational only, with zero interaction state. These are the fastest to build and validate the base class, parts, slots, and CSS custom property patterns.

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P1-E3-T0 | Implement Alert | Static component. Slots: default, icon, action. Parts: root, icon, content, action. Variants: info, success, warning, danger. Dismissible via Presence. Spec: `.spec/0001-alert.md`. | P1-E3-T4, P1-E1-T3 | Luna | S | PRD 4.1 |
| P1-E3-T1 | Implement Badge | Static component. Parts: root. Variants: count, dot, label. Spec: `.spec/0007-badge.md`. | P1-E3-T4, P1-E1-T3 | Luna | S | PRD 4.1 |
| P1-E3-T2 | Implement Chip | Static component. Parts: root, remove. Slots: default, prefix. Spec: `.spec/0008-chip.md`. | P1-E3-T4, P1-E1-T3 | Luna | S | PRD 4.1 |
| P1-E3-T3 | Implement Avatar | Static component. Slots: default, fallback, status. Parts: root, image, fallback. Spec: `.spec/0009-avatar.md`. | P1-E3-T4, P1-E1-T3 | Luna | S | PRD 4.1, ARCH 13.2 |
| P1-E3-T4 | Implement Separator | Static component. Horizontal or vertical. Parts: root. Spec: `.spec/0011-separator.md`. | P1-E3-T4 | Luna | S | PRD 4.1 |
| P1-E3-T5 | Implement VisuallyHidden | Static utility component. Spec: `.spec/0012-visually-hidden.md`. | P1-E3-T4 | Luna | S | PRD 4.1 |
| P1-E3-T6 | Implement Portal | Static component. Renders children outside DOM parent. Spec: `.spec/0013-portal.md`. | P1-E3-T4 | Luna | S | PRD 4.1 |
| P1-E3-T7 | Implement Kbd / Shortcut | Static component. OS-aware rendering. Spec: `.spec/0015-kbd.md`. | P1-E3-T4 | Luna | S | PRD 4.1 |
| P1-E3-T8 | Implement Skeleton | Static component. Pulse or wave animation. Spec: `.spec/0016-skeleton.md`. | P1-E3-T4 | Luna | S | PRD 4.1 |
| P1-E3-T9 | Implement Stack | Static layout helper. Spec: `.spec/0018-stack.md`. | P1-E3-T4 | Luna | S | PRD 4.1 |
| P1-E3-T10 | Implement Grid | Static layout wrapper. Spec: `.spec/0019-grid.md`. | P1-E3-T4 | Luna | S | PRD 4.1 |
| P1-E3-T11 | Implement Center | Static centering utility. Spec: `.spec/0020-center.md`. | P1-E3-T4 | Luna | S | PRD 4.1 |
| P1-E3-T12 | Implement AspectRatio | Static ratio container. Spec: `.spec/0021-aspect-ratio.md`. | P1-E3-T4 | Luna | S | PRD 4.1 |
| P1-E3-T13 | Implement Spinner | Static, CSS-only animation. Parts: root. Props: size, speed, label. Spec: `.spec/0022-spinner.md`. | P1-E3-T4 | Luna | S | PRD 4.1, ARCH 13.5 |

### 3.5 Epic 5: Interactive Components (Custom/Pre-built machines)

These components use Zag.js machines and validate the full state management integration.

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P1-E4-T1 | Implement Button | Custom machine. `formAssociated: true`. States: idle/pressed/loading/disabled. Slots: prefix/suffix/default. Spec: `.spec/0002-button.md`. First machine-based component -- validates Zag.js + Lit + parts pattern. | P1-E3-T4, P1-E1-T3 | Luna | L | PRD 4.1, ARCH 13.1 |
| P1-E4-T2 | Implement IconButton | Custom machine (shares with Button). `aria-label` required. Spec: `.spec/0003-icon-button.md`. | P1-E4-T1 | Luna | M | PRD 4.1, ARCH 13.1 |
| P1-E4-T3 | Implement ButtonGroup | Static. `role="group"`. Border collapse. Slot-based, does NOT import Button. Spec: `.spec/0004-button-group.md`. | P1-E3-T4 | Luna | S | PRD 4.1, ARCH 13.1 |
| P1-E4-T4 | Implement AvatarGroup | Custom machine. States: collapsed/expanded/overflow_open. Hover expands, click on overflow opens popover. Spec: `.spec/0010-avatar-group.md`. | P1-E3-T3 | Luna | M | PRD 4.1, ARCH 13.2 |
| P1-E4-T5 | Implement Presence | Pre-built (`@zag-js/presence`). Mount/unmount animations. Spec: `.spec/0017-presence.md`. First pre-built machine component. | P1-E3-T4 | Luna | M | PRD 4.1 |
| P1-E4-T6 | Implement Icon | Static wrapper with registry integration. Spec: `.spec/0014-icon.md`. Depends on icon registry from Phase 0. | P1-E3-T4 | Luna | M | PRD 4.1, ARCH 11 |

### 3.6 Epic 6: Phase 1 Validation & Release

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P1-E6-T1 | Write Storybook stories for all 20 components | Each component gets: Overview, Playground, Anatomy, Parts & Properties, Slots, Accessibility, Examples, API. | P1-E3 (all), P1-E4 (all) | Luna | L | PRD 5.1 |
| P1-E6-T2 | Run full test suite | Verify all 20 components pass the 8-point test checklist: renders, reactive props, slots, parts, custom properties, events, keyboard nav, axe-core. | P1-E3 (all), P1-E4 (all) | Luna | M | PRD 5.2 |
| P1-E6-T3 | Verify bundle splitting | Validate that family entrypoints and independent entrypoints work as documented. Verify tree-shaking. Verify barrel export works. | P1-E3 (all), P1-E4 (all) | Luna | M | ARCH 12 |
| P1-E6-T4 | Generate and verify CEM manifest | Run CEM analyzer, verify `custom-elements.json` contains all 20 components with correct props, events, slots, parts, CSS properties. | P1-E3 (all), P1-E4 (all) | Luna | S | PRD 5.1 |
| P1-E6-T5 | Create Changesets for all components | Add changeset entries for the v0.2.0 release. | P1-E6-T2 | Olive | S | PRD 6.4 |
| P1-E6-T6 | Visual regression baseline | Run Playwright visual regression for all 20 components. Establish baseline screenshots. | P1-E6-T1 | Olive | M | PRD 5.2 |

### 3.7 Dependency Graph

```
P1-E1 (Aliases & Theme Docs)        P1-E3 (Specs)
  T1 (aliases) ──► T3 (rebuild)       T1 (static specs) ──┐
  T1 ──► T2 (custom theme docs)       T2 (interactive) ──┼──► T4 (approve)
                                       T3 (icon spec) ────┘

P1-E2 (Preset Package) ◄── Phase 0 complete
  T1 (scaffold) ──► T2 (preset styles) ◄── E5 (all components)

P1-E4 (Static Components) ◄── E3-T4 (approved specs) + E1-T3 (aliases)
  T1..T13 all independent of each other, all depend on E3-T4

P1-E5 (Interactive Components) ◄── E3-T4 + E1-T3
  T1 (Button) ──► T2 (IconButton)
  E4-T3 (Avatar) ──► T4 (AvatarGroup)
  T3 (ButtonGroup), T5 (Presence), T6 (Icon) -- independent

P1-E6 (Validation) ◄── E4 (all) + E5 (all)
  T1 (stories) ──► T6 (visual regression)
  T2 (test suite) ──► T5 (changesets)
  T3 (bundle splitting) -- independent
  T4 (CEM) -- independent
```

### 3.8 Done Criteria for Phase 1

All of the following must be true:

- [ ] 20 components implemented and registered with `line-` prefix
- [ ] All 20 component specs in `.spec/` with status `approved` or `implemented`
- [ ] Semantic alias layer (6 x 9 = 54 variables) is live in the theme package
- [ ] `@websublime/line-presets` package scaffolded with component styles for all 20 Phase 1 components
- [ ] Custom theme contract documented in Storybook
- [ ] Every component passes the 8-point test checklist (renders, props, slots, parts, custom properties, events, keyboard, axe-core)
- [ ] Every component has a complete Storybook entry (Overview, Playground, Anatomy, Parts, Slots, A11y, Examples, API)
- [ ] Zero axe-core violations across all components
- [ ] CEM manifest is complete and verified
- [ ] Bundle splitting works: family entrypoints, independent entrypoints, barrel export
- [ ] Changeset entries created for v0.2.0
- [ ] Visual regression baselines established for all components
- [ ] CI pipeline passes with all checks green

---

## 4. Phase 2 -- Essential Forms (v0.3.0) -- OVERVIEW

### Epics

**E1: Form Component Specs**
- Write and approve `.spec/` files for all 15 components: Input (`.spec/0023-input.md`), PasswordInput (`.spec/0024-password-input.md`), SearchInput (`.spec/0025-search-input.md`), DateInput (`.spec/0026-date-input.md`), Textarea (`.spec/0027-textarea.md`), Field (`.spec/0028-field.md`), Fieldset (`.spec/0029-fieldset.md`), Checkbox (`.spec/0030-checkbox.md`), RadioGroup (`.spec/0031-radio-group.md`), Switch (`.spec/0032-switch.md`), Select (`.spec/0033-select.md`), ToggleGroup (`.spec/0034-toggle-group.md`), Slider (`.spec/0035-slider.md`), NumberInput (`.spec/0036-number-input.md`), Editable (`.spec/0037-editable.md`).

**E2: Custom Machine Form Controls**
- Input, PasswordInput, SearchInput, DateInput, Textarea, Field, Fieldset (7 components)
- Validates custom `createMachine()` pattern in production
- Internal parts for PasswordInput (toggle) and SearchInput (clear) -- validates slot vs part rule
- Field is the orchestrator -- validates slot-based composition with event-driven state detection

**E3: Pre-built Machine Form Controls**
- Checkbox, RadioGroup, Switch, Select, ToggleGroup, Slider, NumberInput, Editable (8 components)
- First real production use of pre-built `@zag-js/*` machines
- Select validates family entrypoint with sub-components

### Key Dependencies
- Phase 1 complete (Button needed for form submit/reset patterns, Presence for animation)
- FormAssociated mixin from Phase 0 is critical -- all form controls use it
- Field depends on Input, PasswordInput, etc. emitting `line-focus`, `line-blur`, `line-change`, `line-invalid` events

### Done Criteria
- [ ] All 15 components pass the 8-point test checklist
- [ ] Field correctly detects child state via events, validity, and explicit props
- [ ] `formAssociated` components participate in native `<form>` submit, reset, and validation
- [ ] Floating label pattern documented in Storybook Patterns section
- [ ] Storybook documentation complete for every component
- [ ] Zero axe-core violations
- [ ] CEM manifest generated and verified
- [ ] Changeset entries for v0.3.0

### Parallel Work
- Theming showcase app (`apps/showcase/` — see `.spec/SHOWCASE-APP-SPEC.md`)

---

## 5. Phase 3 -- Overlays & Navigation (v0.4.0) -- OVERVIEW

### Epics

**E1: Overlay Component Specs & Implementation**
- Dialog (`.spec/0038-dialog.md`), AlertDialog (`.spec/0039-alert-dialog.md`), Sheet (`.spec/0040-sheet.md`), Drawer (`.spec/0041-drawer.md`), Popover (`.spec/0042-popover.md`), Tooltip (`.spec/0043-tooltip.md`), HoverCard (`.spec/0044-hover-card.md`), Toast (`.spec/0045-toast.md`)
- All pre-built machines. Focus management, portal rendering, animations via Presence.
- Dialog and Popover are family entrypoints with sub-components.

**E2: Navigation Component Specs & Implementation**
- Tabs (`.spec/0046-tabs.md`), Accordion (`.spec/0047-accordion.md`), Collapsible (`.spec/0048-collapsible.md`), Menu (`.spec/0049-menu.md`), Breadcrumb (`.spec/0051-breadcrumb.md`), BreadcrumbTrail (`.spec/0052-breadcrumb-trail.md`)
- Menu is a family entrypoint. Tabs and Accordion are family entrypoints.

**E3: Compound Components**
- SplitButton (`.spec/0005-split-button.md`) -- depends on Button (Phase 1) + Menu (E2)
- Menubar (`.spec/0055-menubar.md`) -- custom machine coordinating N Menu instances

### Key Dependencies
- Phase 1 complete (Portal, Presence, Button)
- Menu must complete before SplitButton and Menubar
- Portal component (Phase 1) required for overlay positioning

### Done Criteria
- [ ] All 16 components pass the 8-point test checklist
- [ ] Focus trapping works correctly in Dialog and AlertDialog
- [ ] Toast stacking and auto-dismiss work
- [ ] Family entrypoints verified (dialog, tabs, accordion, menu, popover, tooltip, toast, menubar)
- [ ] Storybook documentation complete for every component
- [ ] Zero axe-core violations
- [ ] CEM manifest generated and verified
- [ ] Changeset entries for v0.4.0

---

## 6. Phase 4 -- Advanced Forms (v0.5.0) -- OVERVIEW

### Epics

**E1: Pre-built Machine Advanced Controls**
- Combobox (`.spec/0056-combobox.md`), DatePicker (`.spec/0057-date-picker.md`), DateRangePicker (`.spec/0058-date-range-picker.md`), TimePicker (`.spec/0059-time-picker.md`), ColorPicker (`.spec/0060-color-picker.md`), PinInput (`.spec/0061-pin-input.md`), Rating (`.spec/0062-rating.md`), RangeSlider (`.spec/0063-range-slider.md`), FileUpload (`.spec/0064-file-upload.md`), SignaturePad (`.spec/0065-signature-pad.md`)
- The most complex pre-built machines. Uses `ListCollection` from `@zag-js/collection` (Combobox).

**E2: Custom Machine Advanced Controls**
- TagInput (`.spec/0066-tag-input.md`), MentionInput (`.spec/0067-mention-input.md`), SearchField (`.spec/0068-search-field.md`)
- Uses `ListCollection` for TagInput and SearchField.

### Key Dependencies
- Phase 2 complete (DateInput for DatePicker composition, Input for Combobox, Field for all controls)
- Phase 3 complete (Popover for Combobox/DatePicker/ColorPicker dropdowns, Menu for context)

### Done Criteria
- [ ] All 13 components pass the 8-point test checklist
- [ ] DatePicker + DateInput composition verified
- [ ] Combobox filtering and keyboard navigation verified
- [ ] Storybook documentation complete for every component
- [ ] Zero axe-core violations
- [ ] CEM manifest generated and verified
- [ ] Changeset entries for v0.5.0

---

## 7. Phase 5 -- Data Display & Advanced Navigation (v0.6.0) -- OVERVIEW

### Epics

**E1: Data Display Components**
- Table (`.spec/0070-table.md`), Card (`.spec/0071-card.md`), Progress (`.spec/0072-progress.md`), ProgressRing (`.spec/0073-progress-ring.md`), ProgressList (`.spec/0074-progress-list.md`), ScrollArea (`.spec/0075-scroll-area.md`), Carousel (`.spec/0076-carousel.md`), Clipboard (`.spec/0077-clipboard.md`), QRCode (`.spec/0078-qr-code.md`), Timer (`.spec/0079-timer.md`), TreeView (`.spec/0080-tree-view.md`), EmptyState (`.spec/0082-empty-state.md`)

**E2: Advanced Navigation**
- NavigationMenu (`.spec/0050-navigation-menu.md`), Pagination (`.spec/0053-pagination.md`), Steps (`.spec/0054-steps.md`)

**E3: Multi-step Form**
- Wizard (`.spec/0069-wizard.md`) -- depends on Field/form controls from Phase 2 and Steps from E2

### Key Dependencies
- Phase 3 complete (Menu for NavigationMenu, Popover for context menus within Table)
- TreeView uses `TreeCollection` from `@zag-js/collection`

### Done Criteria
- [ ] All 15 components pass the 8-point test checklist
- [ ] TreeView handles keyboard navigation for hierarchical data
- [ ] Table supports sort, filter, and selection
- [ ] Wizard validates steps and supports branching
- [ ] Storybook documentation complete for every component
- [ ] Zero axe-core violations
- [ ] CEM manifest generated and verified
- [ ] Changeset entries for v0.6.0

---

## 8. Phase 6 -- Layout & Desktop-Inspired (v0.7.0) -- OVERVIEW

### Epics

**E1: Layout Components**
- AppShell (`.spec/0083-app-shell.md`), Sidebar (`.spec/0084-sidebar.md`), Header (`.spec/0085-header.md`), ContentArea (`.spec/0086-content-area.md`), Panel (`.spec/0087-panel.md`), Splitter (`.spec/0088-splitter.md`), FloatingPanel (`.spec/0089-floating-panel.md`)

**E2: Desktop-Inspired Components**
- CommandPalette (`.spec/0090-command-palette.md`), Spotlight (`.spec/0091-spotlight.md`), StatusBar (`.spec/0092-status-bar.md`), ActivityBar (`.spec/0093-activity-bar.md`), NotificationCenter (`.spec/0094-notification-center.md`), PropertiesPanel (`.spec/0095-properties-panel.md`), Minimap (`.spec/0096-minimap.md`), MasterDetail (`.spec/0097-master-detail.md`), ListView (`.spec/0098-list-view.md`), SegmentedControl (`.spec/0099-segmented-control.md`)

### Key Dependencies
- Phase 5 complete (general maturity of the component library needed)
- CommandPalette depends on Dialog (Phase 3) and Input/SearchField patterns
- ListView uses `ListCollection`

### Done Criteria
- [ ] All 16 components pass the 8-point test checklist
- [ ] AppShell composes with Sidebar, Header, ContentArea via slots
- [ ] Splitter drag-resize works with keyboard
- [ ] CommandPalette search and keyboard navigation verified
- [ ] Storybook documentation complete for every component
- [ ] Zero axe-core violations
- [ ] CEM manifest generated and verified
- [ ] Changeset entries for v0.7.0

---

## 9. Phase 7 -- Innovative (v0.8.0) -- OVERVIEW

### Epics

**E1: Visual & Animation Components**
- Marquee (`.spec/0105-marquee.md`), SpotlightCard (`.spec/0106-spotlight-card.md`), FlipCard (`.spec/0109-flip-card.md`), Morph (`.spec/0110-morph.md`), DiffViewer (`.spec/0111-diff-viewer.md`), Sparkline (`.spec/0108-sparkline.md`), Highlight (`.spec/0114-highlight.md`), ImageComparison (`.spec/0107-image-comparison.md`), AngleSlider (`.spec/0113-angle-slider.md`)

**E2: Interactive & Complex Components**
- KanbanBoard (`.spec/0101-kanban-board.md`), Timeline (`.spec/0102-timeline.md`), DataGrid (`.spec/0103-data-grid.md`), InfiniteScroll (`.spec/0104-infinite-scroll.md`), Dock (`.spec/0100-dock.md`), WheelPicker (`.spec/0112-wheel-picker.md`), Tour (`.spec/0115-tour.md`)

### Key Dependencies
- Phase 5 complete (Table patterns for DataGrid, ScrollArea for InfiniteScroll)
- KanbanBoard depends on drag-and-drop patterns; may need a shared drag utility
- DataGrid extends Table patterns with virtual scrolling

### Done Criteria
- [ ] All 17 components pass the 8-point test checklist
- [ ] DataGrid virtual scrolling handles 10k+ rows smoothly
- [ ] KanbanBoard drag-and-drop works with keyboard
- [ ] Tour step navigation and spotlight positioning verified
- [ ] Storybook documentation complete for every component
- [ ] Zero axe-core violations
- [ ] CEM manifest generated and verified
- [ ] Changeset entries for v0.8.0

---

## 10. Phase 8 -- Real-World / Domain (v0.9.0) -- OVERVIEW

### Epics

**E1: Media & Communication**
- AudioPlayer (`.spec/0123-audio-player.md`), VideoPlayer (`.spec/0124-video-player.md`), ChatBubble (`.spec/0122-chat-bubble.md`), Terminal (`.spec/0127-terminal.md`), CalendarView (`.spec/0126-calendar-view.md`)

**E2: Commerce & Data**
- PriceCard (`.spec/0119-price-card.md`), StatCard (`.spec/0120-stat-card.md`), Ticket (`.spec/0121-ticket.md`), Receipt (`.spec/0128-receipt.md`), Gauge (`.spec/0081-gauge.md`), WeatherCard (`.spec/0130-weather-card.md`), Changelog (`.spec/0129-changelog.md`), Ballot (`.spec/0116-ballot.md`), ReactionBar (`.spec/0117-reaction-bar.md`), Proof (`.spec/0118-proof.md`), CookieConsent (`.spec/0125-cookie-consent.md`), MapMarker (`.spec/0131-map-marker.md`), OTPVerification (`.spec/0132-otp-verification.md`)

### Key Dependencies
- Phase 5 complete (Progress for AudioPlayer/VideoPlayer, general maturity)
- CalendarView is distinct from DatePicker (Phase 4) -- it is a full calendar UI, not a date selection widget
- OTPVerification extends PinInput (Phase 4) with timer and resend flow

### Done Criteria
- [ ] All 18 components pass the 8-point test checklist
- [ ] AudioPlayer and VideoPlayer are headless (no visual opinion, all via parts)
- [ ] CalendarView handles day/week/month views
- [ ] CookieConsent handles GDPR category toggles
- [ ] Storybook documentation complete for every component
- [ ] Zero axe-core violations
- [ ] CEM manifest generated and verified
- [ ] Changeset entries for v0.9.0

---

## 11. v1.0.0 -- Full Catalogue Release

After Phase 8 completes, the final milestone is the v1.0.0 release:

- [ ] All 131 components shipped and documented
- [ ] All component specs at status `implemented`
- [ ] Public site live at `line-ui.websublime.com`
- [ ] Storybook deployed with all components
- [ ] Breaking changes policy switches to strict semver
- [ ] Migration guide from pre-1.0 published
- [ ] npm packages published as stable (`@websublime/line-core`, `@websublime/line-components`, `@websublime/line-theme`, `@websublime/line-presets`, `@websublime/line-icons`)
