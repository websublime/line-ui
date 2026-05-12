# line://ui — Phase 0 Plan: Foundation (v0.1.0)

**Status:** APPROVED
**Phase:** 0
**Date:** 2026-03-12
**Author:** Grace (product-manager) — extracted from `docs/PRODUCT-PLAN.md` §2 during the v0.4.0 mister-anderson layout migration
**Source PRD:** [`docs/PRD.md`](../PRD.md) (v0.7.0, APPROVED)
**Source Architecture:** [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
**Manifesto:** [`docs/MANIFESTO.md`](../MANIFESTO.md)
**Specs delivered in this phase:**
- [`docs/specs/00-spec-base.md`](../specs/00-spec-base.md) — LineElement Base Class & Mixins (Epic 4)
- [`docs/specs/00-spec-storybook.md`](../specs/00-spec-storybook.md) — Storybook & Documentation (Epic 5)
- [`docs/specs/00-spec-icon-registry.md`](../specs/00-spec-icon-registry.md) — Icon Registry (Epic 7)
- [`docs/specs/00-spec-showcase.md`](../specs/00-spec-showcase.md) — Showcase Application (Epic 9, prerequisite for visual regression)
- [`docs/specs/00-spec-playground.md`](../specs/00-spec-playground.md) — Multi-Schema Playground (Epic 10, design exploration sandbox)

> **Roadmap:** Phase 0 detail is captured in this document. Phases 1–8 high-level overviews remain in [`docs/PRODUCT-PLAN.md`](../PRODUCT-PLAN.md) and will be split into per-phase plans (`docs/plans/{NN}-plan-*.md`) when each phase is reached via `/specification {NN}`.

---

## 1. Phase Goal

Phase 0 produces zero UI components. Its purpose is to establish the monorepo, tooling, base class, theme system, and CI/CD pipeline so that any developer can create, build, test, and document a line://ui component.

---

## 2. Epic 1: Branding Refactor

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

## 3. Epic 2: Build Pipeline & PostCSS Fix

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E2-T1 | Define foundation tokens explicitly | Create `src/tokens.css` with all foundation token scales (typography, sizing, shadows, z-index, opacity, motion, radius, border-width, focus-ring, aspect-ratio). Create `src/semantic.css` extracted from `rules.css`. Remove `postcss-jit-props` and `open-props` from devDependencies. Add contrast tokens (`--line-{palette}-contrast`) to all 28 colour files. Update all 28 schemas to use contrast token. Reference: `docs/DESIGN-SYSTEM-IMPLEMENTATION-GUIDE.md` Phases 1-3. | P0-E1-T3 | Violet | L | PRD 9.3, 9.15 |
| P0-E2-T2 | Add postcss-custom-media to pipeline | Ensure `postcss-custom-media` is active in the pipeline so that custom media queries from `media.css` are resolved. Verify breakpoint and preference queries work. | P0-E1-T3 | Violet | S | PRD 9.8 |
| P0-E2-T3 | Remove demo files from production bundle | Exclude `custom/*-custom.css` demo swatch files from all build outputs. Move them to a location suitable for Storybook consumption only. | P0-E1-T1 | Violet | S | PRD 9.12, Decision T5 |
| P0-E2-T4 | Configure Vite 7+ with Rolldown | Verify or update Vite to 7+ with Rolldown for library mode builds. Ensure both core and theme packages build correctly with the new bundler. | P0-E1-T5, P0-E1-T1 | Luna | M | PRD 2 |
| P0-E2-T5 | Verify PostCSS pipeline end-to-end | Build the full theme bundle (`line.css`). Validate the import chain: `rules.css` -> `normalize.css` -> `general.css` -> all 28 themes. Verify minified outputs match the documented build outputs table. | P0-E2-T1, P0-E2-T2, P0-E2-T3 | Violet | M | PRD 9.12 |

## 4. Epic 3: Monorepo Restructure

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E3-T1 | Create components package scaffold | Create `packages/components/` with `package.json` (`@websublime/line-components`), `tsconfig.json`, `vite.config.ts`, and `src/` directory. Configure workspace in root `package.json`. | P0-E1-T8 | Luna | M | PRD 6.1 |
| P0-E3-T2 | Create icons package scaffold | Create `packages/icons/` with `package.json` (`@websublime/line-icons`), `tsconfig.json`, and `src/` directory. Configure workspace. | P0-E1-T8 | Luna | S | PRD 6.1 |
| P0-E3-T3 | Create storybook package scaffold | Create `packages/storybook/` as a private workspace package with Storybook 8 configuration (see Epic 5). | P0-E1-T8 | Luna | S | PRD 6.1 |
| P0-E3-T4 | Create site package scaffold | Create `packages/site/` as a private workspace package for the Astro site. Minimal scaffold only -- site content is Phase 1 parallel work. | P0-E1-T8 | Olive | S | PRD 6.1 |
| P0-E3-T5 | Configure Bun workspaces | Verify Bun workspace configuration works with all 6 packages. Ensure `bun install` resolves all inter-package dependencies. Verify `bun run build` from root builds all packages in correct order. | P0-E3-T1 through P0-E3-T4 | Olive | M | PRD 2 |
| P0-E3-T6 | Configure package.json exports | Set up `package.json` `exports` field for core, components, theme, and icons packages following the documented pattern (barrel export + per-component entrypoints for components, per-theme for theme). | P0-E3-T5 | Luna | M | PRD 6.2 |

## 5. Epic 4: LineElement Base Class & Mixins

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E4-T1 | Refactor LineElement base class | Refactor the renamed `LineElement` to support three tiers: pre-built Zag.js machine, custom `createMachine()`, and static (no machine). Lifecycle-managed machine connect/disconnect. Zero overhead for static components. Spec: `docs/specs/00-spec-base.md` §2. | P0-E4-T3, P0-E4-T4 | Luna | L | ARCH 6, ARCH 8 |
| P0-E4-T2 | Implement Inspector behavior | Refactor the existing inspector controller into a built-in behavior on `LineElement`. Feature flag via `localStorage`. Expose metadata: version, docs link, scope, QA tags. Expose CSS parts for inspector overlay. Spec: `docs/specs/00-spec-base.md` §3.4. | P0-E4-T1 | Luna | M | PRD 7.2 (Inspector task), Appendix B |
| P0-E4-T3 | Implement Metadata mixin | Mixin that provides component version, documentation URL, and description as properties. Consumed by Inspector behavior. Spec: `docs/specs/00-spec-base.md` §3.3. | P0-E1-T6 | Luna | S | ARCH 6 |
| P0-E4-T4 | Implement Direction mixin | Mixin for LTR/RTL detection and `dir` attribute management. Spec: `docs/specs/00-spec-base.md` §3.5. | P0-E1-T6 | Luna | S | ARCH 6, PRD 1.7 (RTL) |
| P0-E4-T5 | Implement FormAssociated mixin | Opt-in mixin using `ElementInternals` for native `<form>` participation. Provides `setFormValue()`, `reportValidity()`, `checkValidity()`, `:invalid`/`:valid` states. | P0-E4-T1 | Luna | L | ARCH 7, PRD 7.2 (FormAssociated task) |
| P0-E4-T6 | Validate Zag.js integration | Spike: integrate `@zag-js/element` adapter with `LineElement`. Validate that pre-built machines connect correctly and that custom `createMachine()` works. Document any maturity risks. | P0-E4-T1 | Luna | M | PRD 7.2 (LineElement refactor), ARCH 8 |
| P0-E4-T7 | Validate HTMX integration | Spike: validate `LineHtmxElement` adapter with `hx-*` forwarding, server-driven state, swap-aware lifecycle. Document findings and decide if exploratory or committed for Phase 1. Non-blocking — does not gate Phase 0 completion. | P0-E4-T1 | Luna | M | PRD 7.2 (HTMX task), Appendix A |

## 6. Epic 5: Storybook & Documentation

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E5-T1 | Setup Storybook 8 | Install and configure `@storybook/web-components-vite` in `packages/storybook/`. Configure Vite integration. Verify dev server starts and builds. | P0-E3-T3 | Luna | M | PRD 5.1 |
| P0-E5-T2 | Configure CEM Analyzer | Install and configure `@custom-elements-manifest/analyzer` to generate `custom-elements.json` from Lit source. Verify Storybook reads the manifest and auto-generates API docs. | P0-E5-T1, P0-E4-T1 | Luna | M | PRD 5.1 |
| P0-E5-T3 | Create Getting Started story | Write the "Getting Started > Installation" Storybook page covering: install, import, first component render. | P0-E5-T1 | Luna | S | PRD 5.1 (Storybook structure) |
| P0-E5-T4 | Create Theming guide story | Write the "Getting Started > Theming" Storybook page: how to apply themes, switch palettes, enable dark mode. | P0-E5-T1, P0-E2-T5 | Violet | S | PRD 5.1 (Storybook structure) |
| P0-E5-T5 | Create Customisation guide story | Write the "Getting Started > Customisation" Storybook page: `::part()` usage, CSS custom properties, dual-layer strategy. | P0-E5-T1 | Luna | S | PRD 5.1 (Storybook structure) |
| P0-E5-T6 | Create Foundation token stories | Write Storybook pages for Foundation section: Colours (palette visual), Typography, Spacing, Shadows, Motion. Interactive token browser. | P0-E5-T1, P0-E2-T5 | Violet | M | PRD 5.1 (Storybook structure) |

## 7. Epic 6: Testing & CI/CD

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E6-T1 | Setup Bun test runner | Configure `bun test` with `@open-wc/testing-helpers` for unit and component tests. Create test utilities and a sample test to validate the setup. | P0-E3-T5 | Olive | M | PRD 5.2 |
| P0-E6-T2 | Setup Playwright | Install Playwright for visual regression testing. Configure screenshot comparison. Create a baseline test. | P0-E6-T1 | Olive | M | PRD 5.2 |
| P0-E6-T3 | Create GitHub Actions checks workflow | Implement `checks.yml`: bun install, biome lint+format, build all packages, bun test, Playwright visual regression, storybook build, CEM generation check. Runs on PRs. | P0-E6-T1, P0-E6-T2, P0-E5-T2 | Olive | L | PRD 6.5 |
| P0-E6-T4 | Create GitHub Actions release workflow | Implement `release.yml`: Changesets publish + Storybook deploy + site deploy (if changed) + GitHub release notes. Runs on merge to main. | P0-E6-T3 | Olive | L | PRD 6.4, 6.5 |
| P0-E6-T5 | Create RC pipeline for next branch | Implement snapshot/RC build pipeline: merge to `next` triggers automatic release candidate builds. No stable releases during Phase 0. | P0-E6-T4 | Olive | M | PRD 6.5 (RC Strategy) |
| P0-E6-T6 | Configure npm scope | Set up `@websublime/line-*` scope on npm. Verify publish access for all target package names. | None | Olive | S | PRD 7.2 (npm scope task) |
| P0-E6-T7 | Configure Changesets | Set up Changesets for the monorepo. Configure linked versioning. Verify changeset add/version/publish flow. | P0-E3-T5 | Olive | S | PRD 6.4 |

## 8. Epic 7: Icon Registry

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E7-T1 | Design icon registry API | Implement the agnostic icon resolver system in `packages/icons/`. Registry where consumers register icon libraries. Each library is a resolver: given a name, returns SVG. Zero icons bundled. | P0-E3-T2, P0-E4-T1 | Luna | M | ARCH 11, PRD 7.2 (Icon registry task) |
| P0-E7-T2 | Create Icon Setup guide story | Write the "Getting Started > Icon Setup" Storybook page: how to register icon libraries, custom icons, SVG sources. | P0-E7-T1, P0-E5-T1 | Luna | S | PRD 5.1 (Storybook structure) |

## 9. Epic 10: Multi-Schema Playground

Experimental sandbox inside `apps/showcase/` that validates multi-schema composition patterns before the homepage and Themes page (E9.12) commit to a visual direction. Six composition blocks, each a separate custom element following the headless pattern: structure + layout only, `::part()` exposed for every styleable zone, generic CSS custom properties internally (NO `--line-*` tokens). The design system is applied from outside by `sc-page-playground` via `::part()` selectors. Specification: [`docs/specs/00-spec-playground.md`](../specs/00-spec-playground.md). Beads epic: `line-ui-m3d`.

| Task ID | Title | Description | Dependencies | Supervisor | Complexity | Reference |
|---------|-------|-------------|--------------|------------|------------|-----------|
| P0-E10-T1 | Scaffold playground page and register in app shell | Create `sc-page-playground` custom element with two-column layout (sticky sidebar + content column, mobile bar fallback). Register PanelKey `'playground'` in `sc-app`. Wire `schema` and `light` props through from `sc-nav`. | P0-E9-T2 (sc-app shell) | Luna | M | SPEC-PLAYGROUND §3, §7 |
| P0-E10-T2 | Login/Sign-up composition block | Implement `sc-login-block` headless element. Demonstrates neutral base + accent-on-submit, error scoping via host-applied parts, ghost SSO button. | P0-E10-T1, P0-E10-T8 | Luna | M | SPEC-PLAYGROUND §15 (sc-login-block) |
| P0-E10-T3 | E-commerce product card block | Implement `sc-product-card` headless element with image, title, price, rating, size chips, color dots, CTA. Reference implementation for the headless pattern. | P0-E10-T1 | Luna | M | SPEC-PLAYGROUND §15 (sc-product-card), Decision D2 |
| P0-E10-T4 | Music player / media block | Implement `sc-music-player` headless element. Demonstrates forced dark surface (regardless of light/dark mode), gradient album art, transport controls, progress bar, volume slider, playlist rows. | P0-E10-T1 | Luna | L | SPEC-PLAYGROUND §15 (sc-music-player) |
| P0-E10-T5 | Dashboard / notifications block | Implement `sc-dashboard-block` headless element. Demonstrates mixed intent colors via L3 aliases (`--line-success`, `--line-warning`, `--line-danger`, `--line-info`) on stat cards and notification list. | P0-E10-T1 | Luna | M | SPEC-PLAYGROUND §15 (sc-dashboard-block) |
| P0-E10-T6 | Pricing / comparison table block | Implement `sc-pricing-block` headless element with 3 tiers (Free / Pro / Enterprise). Demonstrates complementary schema lookup: accent → cool/warm complement applied to Enterprise tier. CTA hierarchy (ghost / solid / outline). | P0-E10-T1 | Luna | M | SPEC-PLAYGROUND §14 (complement map), §15 (sc-pricing-block) |
| P0-E10-T7 | Schema mapping configuration and accent reactivity system | Implement `sc-schema-mapper` plus expanded `PlaygroundBlockConfig` interface. Drives per-block `baseSchema`, `accentElements`, `complementSchema`, `responsiveTo`. Propagates nav schema picker changes to accent-responsive elements across blocks without page reload. | P0-E10-T1 | Luna | L | SPEC-PLAYGROUND §14 (accent propagation) |
| P0-E10-T8 | Refactor product card to headless pattern | Migrate `sc-product-card` from internal `--line-*` tokens to generic CSS custom properties + `::part()` exposure for every styleable zone. Canonical decision case (Decision D2 in spec). | P0-E10-T3 | Luna | M | SPEC-PLAYGROUND Decision D2, headless-pattern memory |

## 10. Dependency Graph

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
  T1 (registry API) ───► T2 (Icon Setup guide) ◄── E5-T1

P0-E10 (Multi-Schema Playground)           depends on E9-T2 (sc-app shell)
  T1 (scaffold page) ──┬──► T3 (product card) ──► T8 (headless refactor)
                       │                                                 │
                       ├──► T2 (login) ◄──────────────────────────────── ┘
                       ├──► T4 (music player)
                       ├──► T5 (dashboard)
                       ├──► T6 (pricing)
                       └──► T7 (schema mapping system)
```

## 11. Critical Path

```
E1 (Branding) ──► E2 (Build Pipeline)
              ──► E3 (Monorepo) ──► E5 (Storybook)
              │                 ──► E6 (Testing/CI)
              └── E4 (LineElement) ◄── E1-T6 only (parallel with E2, E3)
                  └── E7 (Icon Registry) ◄── E3-T2 + E4-T1

E9 (Showcase) ──► E10 (Multi-Schema Playground) ◄── E9-T2 (sc-app shell)
```

Branding must complete first. E4 (LineElement) depends only on E1-T6 (base class rename), so it starts in parallel with E2 and E3. E5 and E6 depend on E3 (monorepo scaffold). E7 depends on both E3-T2 and E4-T1. E10 (playground) is a design-exploration sandbox layered on top of E9's app shell — it does not gate Phase 0 completion but its findings feed back into E9.12 (Themes page) and the homepage redesign.

## 12. Done Criteria for Phase 0

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
- [ ] Token parity tests confirm each palette token uses `light-dark()` with both mode values in a single declaration (parity is structural with `light-dark()`)
- [ ] Snapshot tests of generated CSS outputs detect unintended regressions
- [ ] Playwright visual regression of `apps/showcase/` established as baseline
- [ ] `sc-page-playground` is registered as PanelKey `'playground'` in `sc-app` and accessible via the nav (E10-T1 done)
- [ ] At least 5 composition blocks render correctly in both light and dark mode, each as a separate custom element following the headless pattern (`::part()` on every styleable zone, no `--line-*` tokens internally)
- [ ] Changing the schema picker in the nav updates accent-responsive elements across all blocks without reloading (E10-T7 schema mapping system done)
- [ ] Playground findings documented as input to E9.12 Themes page and homepage redesign

---
