# TASK LEDGER: Phase 00 — Design System Foundation

**Plan:** [`00-plan-design-system.md`](./00-plan-design-system.md) · **Spec:** [`../specs/00-spec-design-system.md`](../specs/00-spec-design-system.md) · **Rules:** `docs/PROCESS.md` §6

This file is the live state of Phase 00. It describes state; scope and acceptance criteria live in the plan
and the spec. One row per unit of work; the row changes in the same PR as the work. Ids are `<Stream><n>`
here and `00-<Stream><n>` everywhere else. Stream C numbering follows the shipped tasks (spec §6.C headings
aligned by AM-022; plan §4.3 keeps its original draft numbering). Gaps (C12) stay; new rows take the highest
number in the stream + 1.

**Status:** `todo` · `in_progress` · `in_review` · `done` · `blocked`. **Ready** = `todo` with every Deps entry `done`.

## Stream A — Runtime & Tooling Migration (`infra-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| A1 | A | Migrate runtime from Node/pnpm to Bun 1.3+ | infra-supervisor | — | done | — | #174 | — |
| A2 | A | Replace ESLint + Prettier with Biome 2.x | infra-supervisor | — | done | — | #175 | — |
| A3 | A | Update root dependencies to Phase 00 minimums | infra-supervisor | A1 | done | — | #176 | AM-001 |
| A4 | A | Verify `@websublime` npm org access | infra-supervisor | — | done | — | #177 | — |

## Stream B — Monorepo Restructure (`infra-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| B1 | B | Scaffold Bun workspace (8 packages + 2 apps) | infra-supervisor | A1 | done | — | #178 | AM-002, AM-003 |
| B2 | B | Wire cross-package workspace dependencies per layer graph | infra-supervisor | B1 | done | — | #179 | AM-004 |
| B3 | B | `scripts/lint-layers.mjs` cross-layer dependency guard | infra-supervisor | B2 | done | — | #180 | — |
| B4 | B | Per-package Vite/PostCSS build scripts | infra-supervisor | B1 | done | — | #181 | AM-005, AM-006, AM-007 |
| B5 | B | Changesets ignore list for private apps | infra-supervisor | B1 | done | — | #182 | AM-008, AM-009 |
| B6 | B | Review cleanup — lint-layers semantic suggestions | infra-supervisor | B3 | done | — | #183 | — |

## Stream C — Design System Authoring (`webcomponents-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| C1 | C | `line-schemas` TS contracts and Zod schemas | webcomponents-supervisor | B2 | done | — | #184 | AM-010 |
| C2 | C | `line-tokens` 18 families + reset barrel | webcomponents-supervisor | B2 | done | — | #185 | — |
| C3 | C | `line-colors` palette generator + 31 hue CSS + `special.css` | webcomponents-supervisor | C1 | done | — | #186 | AM-011 |
| C4 | C | Palette freshness guard (`verify-palettes-fresh.mjs`) | webcomponents-supervisor | C3 | done | — | #187 | AM-012, AM-013 |
| C5 | C | WCAG contrast validator (`validate-contrast.mjs`) | webcomponents-supervisor | C3 | done | — | #188 | AM-014 |
| C6 | C | `line-themes` role maps, semantics, aliases, defaults | webcomponents-supervisor | C1, C3 | done | — | #190 | — |
| C7 | C | `line-utils` contrast + mix helpers | webcomponents-supervisor | C1 | done | — | #191 | — |
| C8 | C | PostCSS pipeline (spec §6.C.6) — absorbed by B4 | webcomponents-supervisor | B4 | done | — | #181 | — |
| C9 | C | CSS snapshot + schema validation test suite | webcomponents-supervisor | C6, F2 | done | — | #196 | AM-015, AM-020 |
| C10 | C | Stream C review cleanups (batch 1) | webcomponents-supervisor | C6 | done | — | #189 | — |
| C11 | C | Stream C review cleanups (batch 2) | webcomponents-supervisor | C6 | done | — | #189 | — |
| C13 | C | Clamp `line-utils` color-mix percentage args to [0,100] | webcomponents-supervisor | C7 | done | — | #192 | — |
| C14 | C | Emit per-file `dist/accent/*.css` and `dist/gray/*.css` in `line-themes` build | webcomponents-supervisor | C6 | done | — | #193 | — |

## Stream D — Base Class & Runtime Core (`webcomponents-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| D1 | D | `LineElement` base class in `line-core` | webcomponents-supervisor | B4 | done | — | #197 | — |
| D2 | D | Inspector mixin (dev-mode element inspection) | webcomponents-supervisor | D1 | done | — | #198 | AM-021 |
| D3 | D | Metadata mixin static members | webcomponents-supervisor | D1 | done | — | #199 | — |
| D4 | D | Direction mixin (LTR/RTL via `dir`) | webcomponents-supervisor | D1 | todo | — | — | — |
| D5 | D | FormAssociated mixin (`ElementInternals`, unit + Playwright tiers) | webcomponents-supervisor | D1, F6 | todo | — | — | — |
| D6 | D | `LineMachineController` adapter at `line-core/machine` | webcomponents-supervisor | D1 | todo | — | — | — |
| D7 | D | Shadow-DOM modular reset sheets (`line-core/styles`) | webcomponents-supervisor | D1 | todo | — | — | — |
| D8 | D | Hello-world integration test component (spec §6.D.8) | webcomponents-supervisor | D6, D7 | todo | — | — | — |
| D9 | D | Fix `lint-layers` prefix-audit failure: `line-core/__tests__/{metadata,inspector}.test.ts` register test hosts without the `line-*` prefix (Manifesto Law 2) | webcomponents-supervisor | D2, D3 | todo | — | — | — |

## Stream E — Icon Registry (`webcomponents-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| E1 | E | `line-icons` resolver contract + Lucide and Phosphor reference resolvers | webcomponents-supervisor | D1 | todo | — | — | — |
| E2 | E | Skeleton exports map | webcomponents-supervisor | E1 | todo | — | — | — |
| E3 | E | Registry validation tests (spec §6.E.3) | webcomponents-supervisor | E1, F2 | todo | — | — | — |

## Stream F — Build, Test, Release Infrastructure (`infra-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| F1 | F | Storybook 10 + web-components-vite + CEM analyser (shared Vite 8 build landed in B4 #181) | infra-supervisor | B4 | done | — | #194 | AM-016, AM-017 |
| F2 | F | Bun test harness with happy-dom + `@open-wc/testing-helpers` preload | infra-supervisor | B4 | done | — | #195 | AM-018, AM-019 |
| F3 | F | `release.yml` + snapshot-version / snapshot-deploy workflows (spec §6.F.5, AM-008) | infra-supervisor | F1, F2 | todo | — | — | — |
| F4 | F | `checks.yml` with the CI assertions reallocated from C4 / C5 / F2 (spec §6.F.5, AM-013, AM-014, AM-018) | infra-supervisor | F1, F2, F6 | todo | — | — | — |
| F5 | F | `apps/site` Astro scaffold + Cloudflare Pages deploy (`deploy-site`) | infra-supervisor | B1 | todo | — | — | — |
| F6 | F | Playwright config + real-browser tier (spec §6.F.4) | infra-supervisor | F2 | in_review | `feat/00-f6-playwright-config` | #201 | AM-023 |
| F7 | F | `deploy-storybook.yml` preview deploy (spec §6.F.5, §9.6) | infra-supervisor | F1, F4 | todo | — | — | — |

## Stream G — Documentation (`webcomponents-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| G1 | G | Getting Started (`apps/storybook/stories/getting-started.mdx`) | webcomponents-supervisor | C6, F1 | todo | — | — | — |
| G2 | G | Theming guide (`theming.mdx`) | webcomponents-supervisor | C6, F1 | todo | — | — | — |
| G3 | G | Customisation guide (`customisation.mdx`) | webcomponents-supervisor | D1, F1 | todo | — | — | — |
| G4 | G | `docs/specs/COMPONENT-SPEC-TEMPLATE.md` | webcomponents-supervisor | — | todo | — | — | — |
| G5 | G | `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` skeleton | webcomponents-supervisor | — | todo | — | — | — |
| G6 | G | Design-system stories `palettes.stories.ts` + `roles.stories.ts` rendering all 31 hues (spec §6.F.1, §9.7) | webcomponents-supervisor | C6, F1 | todo | — | — | — |

## Stream H — HTMX Spike (`webcomponents-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| H1 | H | `LineHtmxElement` spike + retrospective entry (`docs/retrospective/00-phase-00-retro.md`) | webcomponents-supervisor | D6 | todo | — | — | — |

## Stream Z — Repo-wide

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| Z1 | Z | Replace beads/Jira process docs with the line-ui lifecycle (PROCESS, CLAUDE, understand skill, sdlc, git-workflow-manager, supervisors, hooks, this ledger) | main session | — | done | — | #200 | AM-022 |
| Z2 | Z | Route the Opus harness agents (`reviewer`, `security-reviewer`, `scout`, `sonic`) through the native Anthropic provider instead of OpenRouter (`.omp/config.yml`) | main session | — | in_review | `chore/00-z2-anthropic-opus-agents` | #203 | — |
