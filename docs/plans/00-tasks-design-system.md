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
| D4 | D | Direction mixin (LTR/RTL via `dir`) | webcomponents-supervisor | D1 | done | feat/00-d4-direction-mixin | #211 | AM-031 |
| D5 | D | FormAssociated mixin (`ElementInternals`, unit + Playwright tiers) | webcomponents-supervisor | D1, F6 | done | feat/00-d5-form-associated-mixin | #212 | AM-032 |
| D6 | D | `LineMachineController` adapter at `line-core/machine` | webcomponents-supervisor | D1 | done | feat/00-d6-machine-controller | #205 | — |
| D7 | D | Shadow-DOM modular reset sheets (`line-core/styles`) | webcomponents-supervisor | D1 | done | feat/00-d7-reset-sheets | #207 | AM-026, AM-027 |
| D8 | D | Hello-world integration test component (spec §6.D.8) | webcomponents-supervisor | D6, D7 | done | feat/00-d8-hello-world | #210 | AM-030 |
| D9 | D | Fix `lint-layers` prefix-audit failure: `line-core/__tests__/{metadata,inspector}.test.ts` register test hosts without the `line-*` prefix (Manifesto Law 2) | webcomponents-supervisor | D2, D3 | done | — | #202 | — |

## Stream E — Icon Registry (`webcomponents-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| E1 | E | `line-icons` resolver contract + Lucide and Phosphor reference resolvers | webcomponents-supervisor | D1 | done | feat/00-e1-icon-registry | #213 | AM-033, AM-034, AM-035 |
| E2 | E | Skeleton exports map (spec §4.8) — absorbed by B1 (#178) and E1 (#213) | webcomponents-supervisor | E1 | done | docs/00-e2-exports-map-absorbed | #214 | — |
| E3 | E | Registry validation tests (spec §6.E.3) | webcomponents-supervisor | E1, F2 | done | feat/00-e1-icon-registry | #213 | AM-033, AM-035 |

## Stream F — Build, Test, Release Infrastructure (`infra-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| F1 | F | Storybook 10 + web-components-vite + CEM analyser (shared Vite 8 build landed in B4 #181) | infra-supervisor | B4 | done | — | #194 | AM-016, AM-017 |
| F2 | F | Bun test harness with happy-dom + `@open-wc/testing-helpers` preload | infra-supervisor | B4 | done | — | #195 | AM-018, AM-019 |
| F3 | F | `release.yml` + snapshot-version / snapshot-deploy workflows (spec §6.F.5, AM-008) | infra-supervisor | F1, F2, F9 | done | ci/00-f3-release-workflows | #217 | AM-038, AM-039, AM-040 |
| F4 | F | `checks.yml` with the CI assertions reallocated from C4 / C5 / F2 (spec §6.F.5, AM-013, AM-014, AM-018) | infra-supervisor | F1, F2, F6 | done | — | #204 | AM-024, AM-025 |
| F5 | F | `apps/site` Astro scaffold + Cloudflare Pages deploy (`deploy-site`) | infra-supervisor | B1 | done | feat/00-f5-site-scaffold | #229 | AM-044, AM-045, AM-046 |
| F6 | F | Playwright config + real-browser tier (spec §6.F.4) | infra-supervisor | F2 | done | — | #201 | AM-023 |
| F7 | F | `deploy-storybook.yml` preview deploy (spec §6.F.5, §9.6) | infra-supervisor | F1, F4, Z9 | done | ci/00-f7-deploy-storybook | #228 | AM-044, AM-045 |
| F8 | F | Fix CI "Build packages" race: Bun `--filter` ignores `devDependencies` ordering, so `line-storybook` builds before `line-schemas` emits `dist/`; root `build` becomes two-phase (`./packages/*` then `./apps/*`) and `checks.yml` calls it | infra-supervisor | B2, F4 | done | fix/00-f8-two-phase-build | #209 | AM-029 |
| F9 | F | Fix published tarballs: `changeset publish` runs `npm publish`, which drops `dist/` from all 8 packages (root `.gitignore` lists `dist`; no package declares `files`) and ships `workspace:^` ranges unrewritten (`line-icons`, `line-utils`, `line-themes`, `line-components`) | infra-supervisor | B1, B5 | done | fix/00-f9-publish-tarballs | #215 | AM-036, AM-037 |
| F10 | F | Document in spec §7.2 / §6.F.5 what the first publishes showed: observed: when a package had no `latest`, npm set `latest` to the version published with `--tag canary`, so the first canary was also `latest` until `0.1.0`; npm left `0.0.0-stage` placeholder versions on 5 packages during that first publish; npm processes publishes asynchronously (manifest and tarball can trail the CI step by minutes); the changelog-github read scopes are confirmed; record that the `release.yml` trusted publishers were created just before the #218 merge (AM-041 premise) | infra-supervisor | F3 | done | docs/00-f10-npm-registry-notes | #221 | AM-042 |

## Stream G — Documentation (`webcomponents-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| G1 | G | Getting Started (`apps/storybook/stories/getting-started.mdx`) | webcomponents-supervisor | C6, F1 | todo | — | — | — |
| G2 | G | Theming guide (`theming.mdx`) | webcomponents-supervisor | C6, F1 | todo | — | — | — |
| G3 | G | Customisation guide (`customisation.mdx`) | webcomponents-supervisor | D1, F1 | todo | — | — | — |
| G4 | G | `docs/specs/COMPONENT-SPEC-TEMPLATE.md` | webcomponents-supervisor | Z11 | done | docs/00-g4-component-spec-template | #231 | AM-043, AM-047 |
| G5 | G | `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` skeleton | webcomponents-supervisor | — | in_review | docs/00-g5-competitive-component-analysis | #232 | AM-048 |
| G6 | G | Design-system stories `palettes.stories.ts` + `roles.stories.ts` rendering all 31 hues (spec §6.F.1, §9.7) | webcomponents-supervisor | C6, F1 | todo | — | — | — |

## Stream H — HTMX Spike (`webcomponents-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| H1 | H | `LineHtmxElement` spike + retrospective entry (`docs/retrospective/00-phase-00-retro.md`) | webcomponents-supervisor | D6 | todo | — | — | — |

## Stream Z — Repo-wide

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| Z1 | Z | Replace beads/Jira process docs with the line-ui lifecycle (PROCESS, CLAUDE, understand skill, sdlc, git-workflow-manager, supervisors, hooks, this ledger) | main session | — | done | — | #200 | AM-022 |
| Z2 | Z | Route the Opus harness agents (`reviewer`, `security-reviewer`, `scout`, `sonic`) through the native Anthropic provider instead of OpenRouter (`.omp/config.yml`) | main session | — | done | — | #203 | — |
| Z3 | Z | Document the required `project` argument (repository root path) of the code-graph `index_status` call in the `understand` skill and PROCESS §4 | main session | — | done | docs/00-z3-index-status-arg | #206 | — |
| Z4 | Z | Exclude the gitignored legacy `temp/` tree from `bun test` discovery (`bunfig.toml` `[test] pathIgnorePatterns`) | infra-supervisor | — | done | chore/00-z4-bun-test-ignore-temp | #208 | AM-028 |
| Z5 | Z | Declare `"license": "MIT"` in the root and the 8 published packages, update the MIT copyright holder in `LICENSE`, and ship a `LICENSE` in each package (root `package.json` said ISC while `LICENSE` was MIT, `Vitamin UI` 2020) | infra-supervisor | F9 | done | chore/00-z5-mit-license | #216 | — |
| Z6 | Z | Phase 00 ships `0.1.0` of every package (spec §7.2): the Version PR (#218) bumps `line-themes` and `line-components` only to `0.0.1` because their pending changesets are all `patch` — reclassify the C6 role-maps changeset as `minor` (new capability, PROCESS §6) and add a `minor` changeset for the `line-components` umbrella | infra-supervisor | C6, B1 | done | fix/00-z6-phase-00-minor-versions | #219 | — |
| Z7 | Z | Ship the first stable release `0.1.0` of the 8 packages during Phase 00, before 2026-10-08, replacing "no stable releases during Phase 0" (PRD v0.8.4 / F-1) with PRD v0.8.5, plan and spec AM-041; Miguel then merges Version PR #218, which validates the `release.yml` trusted publishers before their 48 h expiry | main session | F3, Z6 | done | docs/00-z7-stable-0-1-0-in-phase-00 | #220 | AM-041 |
| Z8 | Z | Remove the legacy vitamin-era GitHub and registry state: 21 GitHub releases and 21 tags `@websublime/vitamin-*`, 3 GitHub Packages (`vitamin-ui`, `vitamin-core`, `vitamin-theme`), environments `ci` and `github-pages`, the GitHub Pages site, the unused repo secret `GH_TOKEN`; unpublish `@websublime/vitamin-ui` from npmjs | main session | — | done | chore/00-z8-legacy-vitamin-cleanup | #222 | — |
| Z9 | Z | Decide the Storybook host before F7: PRD §5.4 and the PRD §6 apps table say GitHub Pages, while spec §5, §6.F.5 (`deploy-storybook.yml`), §9.6 and row F7 say Cloudflare Pages project `line-ui-storybook`; align the losing documents | main session | — | done | docs/00-z9-storybook-host-cloudflare | #225 | AM-044 |
| Z10 | Z | Research how line://ui could support agent-driven generative UI (A2UI, AG-UI, MCP Apps, WebMCP) while staying headless and web-components-native; research note with a proposed architecture and the open forks for a later `decision` (`docs/research/00-research-generative-ui.md`) | main session | — | done | docs/00-z10-generative-ui-research | #223 | — |
| Z11 | Z | Decide agent-driven UI support from the first component: Manifesto Principle 8 (agent-ready by construction), PRD v0.8.6 (`@websublime/line-genui` as the 9th package, Phase 1 opens with an agent-driven UI foundation stream, A2UI v0.9.1 renderer in preview), ARCHITECTURE section, and the agent contract in the component spec template (spec AM-043, row G4) | main session | Z10 | done | docs/00-z11-agent-driven-ui-decision | #224 | AM-043 |
| Z12 | Z | Record the Cloudflare bootstrap decisions before F5 and F7: custom domains `line-ui.websublime.com` (site) and `line-ui-storybook.websublime.com` (Storybook) with previews on `*.pages.dev`, tokens without expiry (rotation on suspicion), the site in the same bootstrap, and the bootstrap facts (PRD v0.8.8, spec AM-045) | main session | Z9 | done | docs/00-z12-custom-domains-token-expiry | #227 | AM-045 |
| Z13 | Z | Bring `CLAUDE.md` in line with the repository: drop the "pending" claims for merged work (Playwright tier F6, workflows F3/F4, Astro site F5, machine adapter D6, reset sheets D7, icon resolvers E1) and list the F9 scripts `publish` and `verify-pack` | main session | — | done | docs/00-z13-claude-md-state | #230 | — |
