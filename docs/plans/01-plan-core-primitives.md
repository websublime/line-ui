# PHASE PLAN: Phase 01 — Core Primitives

**Status:** APPROVED — Miguel at the plan gate on 2026-10-13. Revision 00-Z45 approved by Miguel on 2026-10-20. Row 00-Z46 on 2026-10-20 adds factual corrections (§2.1 Errors row, §2.6 axe, §5.5 snapshot note, the icon resolver facts from R10 round 2 in §1.2, §2.5, §5.2 and §5.5), the ButtonGroup and Chip machines the spec picks (§2.2), and the `line-genui` manifest surface (§2.1), with PRD v0.8.19. Row 00-Z48 on 2026-10-20 (coherence review round 1) points the open spec questions at the approved spec answers (§2.1 item 7 and the Errors and Icon rows, §2.2, §2.5–§2.7, §4.0, §4.1 G6, §4.2, §4.3, §5.3, §5.5, §5.6, §6, §7.1, §7.3, §7.4, §8, §11 D3), assigns the `line-genui` manifest to G4, adds task Z3, places the PROCESS §4 alignment in the ledger PR (§4.6, §10 step 6) and marks the current step (§10), with PRD v0.8.20 and ARCHITECTURE v0.8.6. Row 00-Z48 coherence review round 2 on 2026-10-20 adds task C23 (§4.3, §6), corrects the `sideEffects` wording (§2.6), the Z stream row (§4.0), the Storybook manifest merge (§4.2 P10, §4.1 G4) and the `./a2ui` owner (§2.5, §4.1 G2), and names the stream D and S task ids (§4.4, §4.5, §5.6), with PRD v0.8.21 and ARCHITECTURE v0.8.7. Row 00-Z48 coherence review round 3 on 2026-10-20 places P7 before C1 (§4.2, §6), names the `line-icons` subpaths and their owners (§2.5), widens the decision-id note (§5.6) and the S1–S10 risk line (§8), and splits the S stream owners by file (§4.0) (findings R3-L1-01 to R3-L1-04). It also routes A2UI icon names through the surface `iconMap` (§2.1 Icon row, §2.5; spec AM-006, decision D-M) and defers server-side A2UI to a later phase spec (§3), with PRD v0.8.22 and ARCHITECTURE v0.8.8. Row 00-Z48 coherence review round 4 on 2026-10-20 names infra-supervisor as the S owner for the `playwright.config.ts` change only (§4.0; spec §6.S.1, §10 SD71; finding R4-L1-01), adds the Icons row of ARCHITECTURE §17.4 to the renderer table (§2.1; finding R4-L1-02), and adds the `line-icons/a2ui` surface with its preview status (§2.1; spec AM-008), with PRD v0.8.23 and ARCHITECTURE v0.8.9. Row 00-Z48 coherence review round 5 on 2026-10-20 states that `line-genui` loads `line-components` lazily through descriptor `load()` and uses `line-icons` for types only, never at run time (§2.1 dependency rules; spec §10 SD9, AM-009; finding L3R5-01), with PRD v0.8.24 and ARCHITECTURE v0.8.10. Row 00-Z48 coherence review round 6 on 2026-10-20 names the `A2uiIconName`, `A2uiIconEntry` and `A2uiIconMap` types and the `a2uiIconMap` helper in the `line-icons/a2ui` surface row and says "types" in the preview bullet (§2.1; spec AM-011; finding R6-L1-01). Row 00-Z48 coherence review round 7 on 2026-10-20 adds the surface attributes `live-update-text` and `live-error-text` and their defaults to the Accessibility row of the renderer table, mirroring ARCHITECTURE §17.4 (§2.1; spec AM-013, Miguel's decision on finding L3R7-01; finding R7-L1-01 for this Status line), with PRD v0.8.24 and ARCHITECTURE v0.8.10. Row 00-Z48 coherence review round 8 on 2026-10-20 names the four `line-icons/a2ui` exports in the preview bullet, as ARCHITECTURE §17.7 does (§2.1; finding R8-L1-01), and lists the four Phase 1 transport recipes (§3; spec AM-012, AM-014; finding R8-L1-02), with PRD v0.8.24 and ARCHITECTURE v0.8.10. Row 00-Z48 coherence review round 9 on 2026-10-20 corrects the round-6 note above, which had said that round 6 named the four exports in the preview bullet, and adds spec AM-014 to the citations of that bullet (§2.1 and Status; spec AM-015; finding R9-L1-01), with PRD v0.8.24 and ARCHITECTURE v0.8.10. Row 00-Z48 coherence review round 10 on 2026-10-20 adds spec AM-014 to the citations of the §3 transports bullet, which the round-8 note above already credits (§3; spec AM-016; finding R10-L1-01), with PRD v0.8.24 and ARCHITECTURE v0.8.10. Row 00-Z48 coherence review round 11 on 2026-10-20 names infra-supervisor as the C owner for the C22 CDN gate files only (§4.0; spec §6.C.3, §6.P.6, AM-017; finding R11-L1-02), with PRD v0.8.24 and ARCHITECTURE v0.8.10. Row 00-Z48 coherence review round 13 on 2026-10-20 adds the P5 → C2 edge, so P5 lands after C1 and before C2, as an orchestrator default for Miguel's review (§4.2 P5, §6; spec §6.P.5, §6.C.0, AM-019; finding L3R13-01), with PRD v0.8.24 and ARCHITECTURE v0.8.10. Row 00-Z48 coherence review round 14 on 2026-10-20 adds the P1 → P5 and G4 → C5–C20 edges and moves the C21 component rates and the fallback subclass to the machine rows, as orchestrator defaults for Miguel's review (§4.2 P5, §4.3 C21, §6, §8; spec §6.P.5, §6.C.1, §6.C.4, §10 SD18, SD28, SD86, AM-020; findings L3R14-02, L3R14-04, L3R14-05), with PRD v0.8.24 and ARCHITECTURE v0.8.10. Row 00-Z48 coherence review round 15 on 2026-10-20 names infra-supervisor as the C owner for the C22 root `package.json` `devDependencies` and the C23 `bun-test-preload.ts` change, and as the G owner for the G2 and G3 root `package.json` `devDependencies` (§4.0; spec §6.C.0, §6.C.2, §6.C.3, §6.G.0, AM-021; finding L3R15-01), and, as orchestrator defaults for Miguel's review, gives infra-supervisor the G2, G4 and G7 build-step, manifest-key and `apps/storybook` edits and keeps each C and G row's own `exports` entry with webcomponents-supervisor (§4.0; spec §4, §6.C.0, §6.G.0, AM-021), and draws G1, G4 and G5 as the C5–C20 gate in the §6 graph (§6; spec §10 SD86; finding R15-L1-01), with PRD v0.8.24 and ARCHITECTURE v0.8.10. Row 00-Z48 coherence review round 16 on 2026-10-21 applies Miguel's file-class ownership rule: each §4.0 owner names only the accountable supervisor, who opens the PR and asks the other supervisor for the edits that the spec §4 table gives it, and the per-file owner splits of rounds 3, 4, 11 and 15 above give way to that table (§4.0; spec §4, AM-022; findings R16-L1-01 to R16-L1-03). It also adds the G3 → C12, C13, C16 edge (§6; spec §6.C.4, §10 SD86, AM-023; findings L2R16-02, L3R16-01), with PRD v0.8.24 and ARCHITECTURE v0.8.10. Row 00-Z48 coherence review round 18 on 2026-10-21 corrects the round-16 note: the accountable supervisor runs the task on its branch, `git-workflow-manager` opens the PR, and the main session dispatches the other supervisor on the same task branch; the ledger PR also aligns `docs/PROCESS.md:92-95` (§4.0, §4.6, §10 step 6; spec AM-025; findings R18-L1-01, R18-L1-02). It also fixes the §2.9 diagram locator (finding L2R18-06). Row 00-Z48 coherence review round 19 on 2026-10-21 names the orchestrator (main session or `sdlc`) as dispatcher, keeps one changeset entry per branch, names the main session as Z owner and cites PROCESS §4, §6 for the PR step; the ledger PR also aligns `docs/PROCESS.md:151-152`, `.claude/agents/sdlc.md:42` and the supervisor `description:` and changeset lines (§4.0, §4.6, §10 step 6; spec AM-026; findings R19-L1-01 to R19-L1-03, L2R19-01, L2R19-02, L3R19-03). Row 00-Z48 round 20 on 2026-10-21 adds to the ledger-PR alignment the supervisor escalation lines that route to the other supervisor, to route through the orchestrator, and has the accountable supervisor write the changeset entry last for every published package the branch changed (§4.0, §4.6, §10 step 6; spec AM-027; findings R20-L1-01, L3R20-02). Row 00-Z48 round 21 on 2026-10-21 states the `line-genui` peer range `workspace:^0.1.0 || ^0.2.0` and the P3 Changesets flag (§2.7; spec §10 SD76, AM-028, Miguel's decision on finding L3R21-01). It also adds the `sdlc` Handoffs lines to the ledger-PR alignment, puts the CEM entry before the changeset in the row sequence and cites R3 §5 item 3 for the self-imposed cap (§4.0, §4.3, §4.6, §5.6 D3, §10 step 6; spec AM-029; findings R21-L1-01 to R21-L1-03). Row 00-Z48 round 22 on 2026-10-21 times the `line-genui` peer-range widening before each later phase's Version PR, adds a check of the `line-genui` version at the Version PR, states that the Phase 1 Version PR rewrites the `devDependencies`, and names the Phase 2 hand-off duty (§2.7; spec §6.Z.2, AM-030; findings R22-L1-01, R22-L1-02; R22-L1-03 lands in spec SD76; this note corrected in round 23, finding R23-L1-01). Row 00-Z48 round 23 on 2026-10-21 adds task P11, the Chromium visual regression tier over the Storybook stories, before C1 (§2.6, §4.0, §4.2, §6, §7.1; spec §6.P.11, §10 SD98, AM-031, Miguel's decision on finding L3R23-10), adds P4 step 2 as the step before P6 (§4.2, §6; spec §6.P.4, AM-032; finding L3R23-02), and names Miguel, who merges the Version PR, as the one who checks the `line-genui` version (§2.7; spec AM-032; finding R23-L1-02), with PRD v0.8.25 and ARCHITECTURE v0.8.11. Row 00-Z48 round 24 on 2026-10-21 has P11 meet the PRD §5.2.1 coverage contract through the `Design System/Roles` `Toolbar` story under every `(accent, gray, mode)` combination, with the default pairs gating every PR and the off pairs run before each release (§2.6, §4.2, §7.1; spec §6.P.11, §10 SD98, AM-033, Miguel's decision on findings R24-L1-01, L2R24-01, L3R24-02), and, as orchestrator defaults for Miguel's review, lands P11 in two PRs with its dispatch checks after the first merges and runs the local Browser tier with `--ignore-snapshots` off Linux (§4.2, §6; spec AM-034; findings L2R24-02, L3R24-01, R24-L1-02), with PRD v0.8.25 and ARCHITECTURE v0.8.11. Row 00-Z48 round 25 on 2026-10-21, as orchestrator defaults for Miguel's review, splits that work into two rows, because PROCESS §6 binds one PR per row: P11 keeps the project, helper, workflows and `.gitignore` lines and still blocks C1, and new task P12 adds the Roles visual tests and their baselines after P11, with the dispatch checks in its Verify record, blocks no C row and lands before the Phase 1 exit (§2.6, §4.2, §6; spec §6.P.11, §6.P.12, AM-035; findings R25-L1-01, R25-L1-03), with PRD v0.8.26 and ARCHITECTURE v0.8.11. Row 00-Z48 round 26 on 2026-10-21, as orchestrator defaults for Miguel's review, makes P12 block C1, so P11 → P12 → C1 and the default pairs gate every PR from C1 on; splits the npm bootstrap into P4 (spec §6.P.4 steps 1–5, with `docs/context/01-p4.md`) and new task P13 (steps 6 and 7, with `docs/context/01-p13.md`, within the 48 hours before the Phase 1 Version PR merge), so each row has a PR; sets P6 after P4, C1 and C2; and makes the exit sweep file its findings as new rows, with Z3 after every other Phase 1 row (§4.2, §4.6, §6, §7.4, §10; spec §6.P.4, §6.P.6, §6.P.12, §6.P.13, §6.Z.2, AM-036; findings R26-L1-01 to R26-L1-03). Row 00-Z48 round 27 on 2026-10-21, as orchestrator defaults for Miguel's review, corrects the AM-036 split: P4 covers spec §6.P.4 steps 1–6, the token lock included, and its step 5 canary runs from a `main` commit merged after step 2; P13 is the `release.yml` trusted publisher only (step 7) and depends on every other Phase 1 row except Z3; S1 depends on C1–C4 and is one PR (§2.8, §4.0, §4.2, §4.5, §6; spec §6.P.4, §6.P.13, §6.S.1, AM-037; findings R27-L1-01 to R27-L1-08). Row 00-Z48 round 28 on 2026-10-21, as orchestrator defaults for Miguel's review, starts P13 after the exit sweep's rows are done and Miguel has recorded the release-time runs, has Miguel recreate the `release.yml` trusted publisher if the Version PR does not merge within 48 hours of step 7, adds to P13 a `minor` changeset for each package that no merged Phase 1 changeset names, and takes D3 out of P13's Deps, so D3 and then Z3 land after the Phase 1 Version PR merges; it also writes each Phase 00 spec AM number as "Phase 00 spec AM-0nn" (§1.2, §2.1, §2.3, §2.6, §4.2, §4.3, §4.4, §5.6, §6; spec §6.D.3, §6.P.13, §6.Z.2, §7.2, AM-038; findings R28-L1-01, L3R28-02 to L3R28-04). Coherence review round 29 on 2026-10-21 corrects round 28's changeset rule: P13 adds a `minor` changeset for each package that the merged Phase 1 changesets do not bump at `minor` (`bun run changeset status`), as row `00-Z6` fixed Phase 00's `patch`-only bumps; D3's ledger row stays `blocked` until the Phase 1 Version PR merges, as row `00-Z29` is `blocked` on an outside event; and the remaining Phase 00 spec AM numbers carry "Phase 00 spec" (§1.2, §4.2, §4.4, §5.4, §8; spec §6.D.3, §6.P.13, §7.2, AM-039; findings R29-L1-01 to R29-L1-03, L2R29-01 to L2R29-03, L3R29-01, L3R29-02). Coherence review round 30 on 2026-10-21, with orchestrator defaults for Miguel's review, keeps P13's ledger row `blocked` until the main session has run the exit sweep, the sweep's rows are `done` and Miguel has recorded the release-time runs on `main`; has the main session flip D3 and P13 `blocked → todo`, with that flip owner added to the ledger-PR alignment list; adds the `inspector.ts:111` comment to P8 and scopes its grep; adds G6 to G7's Deps and the P8 → P9, P10 edges; and cites ARCHITECTURE v0.8.12 (§2.9, §4.0, §4.2, §4.4, §4.6, §6, §10; spec §6.D.3, §6.G.7, §6.P.8, §6.P.13, AM-040; findings R30-L1-01, R30-L1-02, L2R30-01, L3R30-02, L3R30-06, L3R30-08). Coherence review round 31 on 2026-10-21, with orchestrator defaults for Miguel's review, gives the §2.1 Text row the `<span>` inside Button that ARCHITECTURE §17.3 has; has webcomponents-supervisor write the `inspector.ts:111` comment in the P8 PR, outside the one-commit document change, and drops the closed record list from the P8 grep; corrects the PROCESS row-flip locator to `docs/PROCESS.md:138-140`; names the orchestrator (main session or `sdlc`) as the D3 and P13 flip owner; and cites spec §4 in §2.6 for the packages that keep `sideEffects` (§2.1, §2.6, §2.9, §4.0, §4.2, §4.4, §4.6, §6, §10; spec AM-041; findings R31-L1-01, R31-L1-03 to R31-L1-05, L2R31-01, L2R31-02, L3R31-04 to L3R31-06, L3R31-08; R31-L1-02 lands in spec §6.G.4). Round 32 (diff-focused, Miguel's decision of 2026-10-21) corrects that note (findings R32-L1-02, L3R32-02; spec AM-042). Round 33 (diff-focused) on 2026-10-21 completes the round-31 note's findings list and drops one "and" from its clause list (findings R33-L1-01, R33-L1-02; spec AM-043). Round 34 on 2026-10-21 rewords that sentence (finding R34-L1-01; spec AM-044); rounds 32, 33 and 34 are the three consecutive clean rounds PROCESS §2 and §5 require. Row 00-Z49 on 2026-10-21, the ledger PR, states that the process alignment is done (§4.0, §4.6), marks the coherence review and the ledger done and names the ledger among the opening PRs (§10 steps 4–6; spec AM-045). Row 01-Z5 on 2026-10-23 adds task Z5, which makes tests resolve workspace packages by name before C1–C20, and moves the htmx harness to the private package `@websublime/line-testing` (§1.2, §4.0, §4.6, §6; spec §6.Z.3, AM-048), with PRD v0.8.27.
**Author:** line://ui orchestrator (row 00-Z27)
**Date:** 2026-10-20
**Phase Version Target:** `line://ui` v0.2.0 (also called "Phase 1" in the PRD)
**Source PRD:** [`docs/PRD.md`](../PRD.md) (v0.8.27)
**Source Architecture:** [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) (v0.8.12)

> **What this document is.** A phase plan (PROCESS §1–§2, the lifecycle and gate rules). It sets scope, streams, dependencies, research targets, acceptance criteria and risks for Phase 1 (PRD §7.3, the Core Primitives phase).
>
> **What this document is NOT.** It is not a spec. The research notes and `docs/specs/01-spec-core-primitives.md` come after plan approval. The plan follows the PRD. Where the research note [`00-research-generative-ui.md`](../research/00-research-generative-ui.md) disagrees with the PRD, the PRD wins, because research is evidence (PROCESS §1).

---

## 1. Phase Overview

Phase 1 rests on two pillars.

1. **Agent-driven UI foundation.** This stream ships `@websublime/line-genui`, the 9th published package (PRD §6.1).
2. **Core primitives.** The phase ships 20 components in the `@websublime/line-components` umbrella.

The phase runs in a fixed order (PRD v0.8.17 §7.3).

1. The four validating components (Button, Icon, Stack, Separator) ship first.
2. Stream G follows on them and adds their descriptors.
3. The other 16 components follow, each with its descriptor in the same PR.

The site landing page dogfoods the Phase 1 components and is an exit criterion (PRD v0.8.17).

### 1.1 What the phase validates

PRD §7.3 lists what the phase validates.

- The architecture and the parts convention.
- The slot/part decision rule.
- The umbrella build pipeline with subpath exports per component.
- Bundle splitting.
- Automatic documentation.
- Agent-driven rendering through A2UI.

### 1.2 Inputs from Phase 00

| Input | State | Source |
|---|---|---|
| Retrospective hand-off item 1 (dependency refresh) | Done | Row `00-Z20` (#253), Phase 00 spec AM-064 (the dependency refresh amendment) |
| Retrospective hand-off item 2 (htmx rule, harness, guide) | Done | Row `00-Z17` (#252), Phase 00 spec AM-063 (the htmx rule C9 amendment) |
| Agent contract section with rules C1–C9 and every descriptor field | In the component spec template | Row `00-G4` (#231), Phase 00 spec AM-043 (the agent contract template amendment); C9 added by `00-Z17` |
| htmx Tests row | In the component spec template | [`COMPONENT-SPEC-TEMPLATE.md`](../specs/COMPONENT-SPEC-TEMPLATE.md) |
| htmx harness | Exists | `packages/line-core/__tests__/integration/htmx/`; row `01-Z5` moves the harness module to the private package `@websublime/line-testing` (`packages/line-testing/src/htmx.ts`), and its self-test, probes and fixture page stay in `line-core` (spec §6.Z.3, AM-048) |
| htmx guide | Exists | `apps/storybook/stories/htmx.mdx` |
| `LineElement`, mixins, `LineMachineController`, reset sheets | Exist | `line-core` |
| Icon resolvers | Exist; verified under Bun only. Vite 8 and esbuild production builds render no icon and leave a bare `?raw` specifier, and webpack does not build them without a `?raw` rule, while the Phosphor resolver also needs an alias (R10 P6; R10 round 2 §2.2), so C22 fixes them before C2 | `line-icons` |

- Hand-off item 3 (the genui stream) becomes the first pillar.
- Hand-off item 4 (the C1–C9 agent contract) needs no template work. In Phase 1 it becomes an obligation. Every component spec fills the Agent contract section, and the coherence review checks it.

---

## 2. Scope — In

### 2.1 Agent-driven UI foundation (`@websublime/line-genui`)

PRD §7.3 lists ten items.

1. The renderer projects directly on the `web_core` models and binder (`NodeResolver`), technique (b) of R2 (§5.6). Miguel chose it on 2026-10-19 over light-DOM adapter elements rendered through `renderA2uiNode`. The spec designs one renderer on it (ARCHITECTURE §17.4).
2. Descriptor API, protocol-neutral Zod descriptors in `line-genui/src/catalog/` (§17.3).
3. `line` and `basic` catalog emitters for A2UI v0.9.1 (§17.3).
4. Frontend-tool JSON Schema emitter, `{name, description, parameters}` (§17.3, PRD Appendix D).
5. `<line-a2ui-surface>`, light DOM, built on `@a2ui/web_core`, with preview status (§17.4, §17.7).
6. CEM drift test and descriptor coverage test (§17.3).
7. MCP Apps theming bridge `@websublime/line-themes/hosts/mcp-apps.css` (§17.6). A `line-tokens` primitive takes a `body`-scoped `var(--host, inherit)` (spec §10 SD17).
8. Transport recipes in Storybook for AG-UI, A2A, MCP and SSE (§17.5).
9. Layer edges `line-genui -> line-core`, `line-components`, `line-icons` in the Phase 1 spec edge table and in `ALLOWED_EDGES` (§17.1).
10. `infra-supervisor` bootstraps the npm trusted publisher for `@websublime/line-genui` in the Phase 00 spec AM-038 order (the trusted publisher bootstrap amendment) before its first release.

PRD Appendix D defines these surfaces.

| Surface | Content | Status |
|---|---|---|
| `@websublime/line-genui/catalog` | Descriptors, the `line` catalog, the `basic` catalog implementations, emitters; no DOM | Normal policy (PRD §7.1) |
| `@websublime/line-genui/catalog.json` | Emitted JSON of the `line` catalog | Normal policy |
| `@websublime/line-genui/a2ui` | Session and `<line-a2ui-surface>` | Preview |
| `@websublime/line-genui/custom-elements.json` | Custom Elements Manifest of `<line-a2ui-surface>` (spec §10) | Preview, with the surface |
| `@websublime/line-icons/a2ui` | The `A2uiIconName`, `A2uiIconEntry` and `A2uiIconMap` types and the `a2uiIconMap` helper that feed the surface property `iconMap` (spec AM-008, AM-010, AM-011) | Preview, with the surface |
| `@websublime/line-themes/hosts/mcp-apps.css` | CSS-only MCP Apps theming bridge | Normal policy |

PRD Appendix D and ARCHITECTURE §17.7 set the preview policy.

- `@websublime/line-genui/a2ui` may change in any minor release.
- `@websublime/line-genui/a2ui` sits outside the PRD §7.1 breaking-changes policy until it targets a final A2UI v1.0.
- `@websublime/line-icons/a2ui` follows the same preview status until A2UI v1.0, because its `A2uiIconName`, `A2uiIconEntry` and `A2uiIconMap` types and its `a2uiIconMap` helper feed the preview property `iconMap` (ARCHITECTURE §17.7; spec AM-008, AM-011, AM-014).
- The agent contract, the descriptor API and both catalogs follow the normal PRD §7.1 policy.

The package has four dependency rules.

- `line-genui` depends on `line-core` (ARCHITECTURE §17.1).
- `line-components` is a peer loaded lazily through descriptor `load()`; `line-icons` is a peer for the `A2uiIconMap` and `A2uiIconName` types only (`import type`; the shipped `.d.ts` references `@websublime/line-icons/a2ui`), never loaded at run time (§17.1, §12; spec §10 SD9, AM-008, AM-009).
- No package depends on `line-genui` (§17.1).
- `line-genui` pins `@a2ui/web_core` exactly, because upstream ships breaking changes in minor versions (§17.7).

ARCHITECTURE §17.4 sets the renderer rules.

| Topic | Rule |
|---|---|
| Render root | Light DOM, so document `::part()` rules reach the rendered elements |
| Loading | Lazy `import()` through each descriptor's `load()`; no eager `define()` |
| Composition | The surface creates elements by tag and wires children through slots |
| Events | `line-a2ui-action` and `line-a2ui-error` |
| Errors | A `processMessages` throw rejects its whole message; the surface catches every throw; an unknown type arrives as a resolver error and renders an inert placeholder for that node; a missing child stays hidden until it arrives and raises no error; the surface passes `RELAXED_VALIDATION`, so a cycle rejects its message (spec §10 SD52, SD54) |
| Theme | Agent theme hints are ignored by default; the host owns styling |
| Text | Plain text by default; Markdown only through an opt-in sanitising renderer |
| URLs | A policy hook with the default allowlist `https:`, `http:`, `mailto:`, `tel:`; `requiresUserActivation` is honoured |
| Limits | Configurable maximum node count, depth and data-model size |
| Accessibility | One live region per surface, announcing the `live-update-text` and `live-error-text` attribute values (defaults "Content updated." and "Some content could not be shown."; spec AM-013), `aria-busy` during batches, required names validated; the surface never moves focus to another component, keeps focus across reorders, and on a reparent uses `moveBefore()` where the browser has it, otherwise returning focus to the same `instanceId` at the end of the batch (D4) |
| Icons | The consumer sets `iconMap` to the null-prototype frozen `A2uiIconMap` that `a2uiIconMap(set, { library })` from `@websublime/line-icons/a2ui` returns; the surface looks each A2UI `Icon.name`, literal or bound, up with `Object.hasOwn` and renders `<line-icon>` with `library`, `name`, `weight` and `mirror` from the entry; `iconMap` unset, or a name absent from it, leaves the node neutral and raises `line-a2ui-error`; setting or replacing `iconMap` projects every Icon node again; a resolver rejection leaves `<line-icon>` neutral with no surface error (spec AM-006, AM-008) |

ARCHITECTURE §17.3 maps these basic catalog types in Phase 1.

| A2UI basic component | line://ui target |
|---|---|
| Text | Native `<p>`, `<h1>`–`<h5>`, `<small>` by `variant`; `<span>` inside Button (spec §10 SD59) |
| Image | Native `<img>` behind the URL policy; `variant: "avatar"` maps to Avatar |
| Icon | `<line-icon>`; the surface maps A2UI icon names through its `iconMap` property, which the consumer fills with `a2uiIconMap(set, { library })` from `line-icons/a2ui` (ARCHITECTURE §17.4; spec AM-006); `{ "svgPath": … }` renders through the `<line-icon>` `path` property (spec §10 SD33) |
| Video, AudioPlayer | Native `<video>` and `<audio controls>` |
| Row, Column, List | `<line-stack>` |
| Divider | `<line-separator>` |
| Button | `<line-button>` |

### 2.2 Core primitives (20 components)

| Component | Zag.js (PRD §7.3) | Entrypoint (ARCHITECTURE §12) |
|---|---|---|
| Button | Custom | `./button` |
| IconButton | Custom | `./icon-button` |
| ButtonGroup | Custom; a custom roving-focus machine (D5, spec §10) | `./button-group` |
| Alert | Static | `./alert` |
| Chip | Pre-built; `@zag-js/toggle` 1.46.0 (D6, spec §10) | `./chip` |
| Badge | Static | `./badge` (spec §10 SD12) |
| Avatar | Static | `./avatar` |
| AvatarGroup | Custom | `./avatar-group` |
| Separator | Static | `./separator` (spec §10 SD12) |
| Visually Hidden | Static | `./visually-hidden` (spec §10 SD12) |
| Portal | Static | `./portal` (spec §10 SD12) |
| Icon | Static | `./icon` |
| Kbd / Shortcut | Static | `./kbd`, one tag `line-kbd` (spec §10 SD12) |
| Skeleton | Static | `./skeleton` (spec §10 SD12) |
| Presence | Pre-built | `./presence` |
| Stack | Static | `./stack` (spec §10 SD12) |
| Grid | Static | `./grid` (spec §10 SD12) |
| Center | Static | `./center` (spec §10 SD12) |
| Aspect Ratio | Static | `./aspect-ratio` (spec §10 SD12) |
| Spinner | Static | `./spinner` |

- PRD §7.3 names Button, Icon, Stack and Separator as the validating set, and the plan gate confirmed it (O2.b (a)). They ship first, and stream G validates on them.
- ButtonGroup and Chip left the Static tier (D5, D6), so each gains a machine and the tests that cover it. ButtonGroup is a `toolbar` with roving focus (APG Toolbar) on a custom roving-focus machine, because `npm view @zag-js/toolbar` on 2026-10-20 shows only pre-release versions (`latest` and `next` are 2.0.0-next.x). Chip is a toggle button with `aria-pressed` on the pre-built `@zag-js/toggle` 1.46.0 machine.
- The PRD says "From then on, every component ships its descriptor in the same PR".

### 2.3 Component specs and the agent contract

- Each component gets one spec at `docs/specs/NNNN-<component>.md`, numbered by its PRD §4 spec link (for example `0002-button.md`, `0022-spinner.md`).
- Each spec is APPROVED before code (PRD §8.3).
- Each spec fills the Agent contract section (PRD §8.1, ARCHITECTURE §17.2–§17.3).
- Each spec fills its row in [`COMPETITIVE-COMPONENT-ANALYSIS.md`](../COMPETITIVE-COMPONENT-ANALYSIS.md), per Phase 00 spec AM-048 (the per-component competitive fill amendment).

### 2.4 htmx native paths

- The template's htmx Tests row applies to value-bearing or compound components (rule C9).
- C9 says ButtonGroup and AvatarGroup are not compound.
- Button and Chip are value-bearing only if their descriptor binding maps name a value prop.
- The htmx row may apply to no Phase 1 component. Each component spec decides, and it marks the row `n/a` with a reason when the row does not apply.

### 2.5 Icon surface

- `<line-icon>` ships in Phase 1.
- The `line-icons` registry gains its Phase 1 subpaths `./registry`, `./resolvers/lucide` and `./resolvers/phosphor` (task C22; PRD §6.2; spec §4.3, AM-002) and `./a2ui` (A2UI icon-name map, task G2; spec §10 SD14, AM-002).
- The A2UI basic `Icon` maps A2UI icon names through the surface property `iconMap`, which the consumer fills with `a2uiIconMap(set, { library })` from `line-icons/a2ui` (ARCHITECTURE §17.3, §17.4; spec AM-006). A2UI also accepts `{ "svgPath": … }`, which a name map does not cover. The surface renders it through the `<line-icon>` `path` property (spec §10 SD33).
- The reference resolvers fail in Vite 8 and esbuild production builds, and webpack does not build them without a `?raw` rule, while the Phosphor resolver also needs an alias (R10 P6; R10 round 2 §2.2). Task C22 fixes them before C2 (Icon). Both resolvers fetch the SVG from a base URL that the consumer sets (spec §10 SD89, SD90).

### 2.6 Platform and release

- Scaffold `packages/line-genui` with `exports`, `files` and `repository`.
- Add the layer edges (PRD item 9).
- Extend publish and `verify-pack` coverage to the 9th package.
- Keep `@websublime/*` external in the library builds, so consumers get one `LineElement` class (R9 §2.1, task P9).
- Load the Custom Elements Manifest into Storybook and ship it in `line-components` (D8, task P10). `line-genui` ships its own manifest (task G4), and Storybook loads one manifest merged from `line-components` and `line-genui` (spec §10 SD94).
- Bootstrap the trusted publisher (PRD item 10, Phase 00 spec AM-038 order).
- Verify bundle splitting (PRD exit criterion, ARCHITECTURE §12). `line-components` and `line-genui` omit the `sideEffects` field; the other packages keep theirs (Phase 1 spec §4, §4.3–§4.5, §10 SD4, SD5). The two packages use the default Rolldown chunks. A registration harness, an isolation scan and one esbuild consumer bundle verify the split on the packed tarball (spec §10 SD4).
- Verify CDN delivery through unpkg and jsDelivr, which PRD §1.7 promises "from Phase 1 onwards", against the two-path CDN contract of spec §10 SD32.
- Add a mechanism for the zero-axe-violation criterion. Today axe runs only in the Storybook `@storybook/addon-a11y` panel, which has no CI path and gates nothing, and no Playwright axe tier exists.
- Add Playwright visual regression over the Storybook stories, which PRD §5.2 lists and the Phase 00 spec deferred to Phase 1, in Chromium only, with baselines generated on the CI Linux runner and committed (task P11; spec §10 SD98, AM-031). It meets the PRD §5.2.1 coverage contract through the `Design System/Roles` `Toolbar` story under every `(accent, gray, mode)` combination (task P12): the default pairs gate every PR, and the off pairs run in a `workflow_dispatch` run before each release that the release PR records (spec §6.P.11, §6.P.12, §10 SD98, AM-033, AM-035).
- Add a code of conduct "before Phase 1 / v0.2.0" (PRD §10). No `CODE_OF_CONDUCT` file exists today.

### 2.7 Release target

- Phase 1 ships `v0.2.0` as a minor release (PRD §7.1, changeset rule in PROCESS §6).
- P1 seeds `line-genui` at `0.1.0`. A `minor` changeset releases it at `0.2.0` with the other eight packages, and `0.1.0` is never published (spec §10 SD3).
- `line-genui` declares `line-components` and `line-icons` as `workspace:^0.1.0 || ^0.2.0` peers, and P3 sets the Changesets flag `onlyUpdatePeerDependentsWhenOutOfRange`, so the `0.2.0` peer versions do not push `line-genui` past `0.2.0`. The Phase 1 Version PR keeps the peers and rewrites the two `devDependencies` to `workspace:^0.2.0`. The first PR of a later phase that adds a `minor` changeset for either package widens the peer ranges on `main` before `changeset version` builds that phase's Version PR. No script fails on a miss, so Miguel, who merges the Version PR, checks the `line-genui` version, and the Phase 2 hand-off names the duty (spec §4.1, §6.Z.2, §7.2, §10 SD76, AM-028, AM-030, AM-032).

### 2.8 Site landing page

- `apps/site/src/pages/index.astro` is a placeholder at `https://line-ui.websublime.com`.
- The Phase 00 plan (its O4) shipped the scaffold only and left full landing content to Phase 1.
- The landing page (hero, value proposition, features, Storybook link) is built with Phase 1 line components and is an exit criterion (O3 (b), PRD v0.8.17).
- The landing page depends on C1–C4, and a section that needs another component adds that C row through a spec AM (spec §6.S.1, AM-037).
- PRD §5.3 lists the full site structure.

### 2.9 TypeScript 7

- Phase 1 moves the workspace from `typescript ^5.9.3` to 7.x (O1 (c)). npm `latest` is 7.0.2 on 2026-10-13.
- R11 found that `typescript@7.0.2` alone fails the Vite builds, because `vite-plugin-dts` needs the TypeScript JS API, and that `apps/storybook` fails with TS2882 on side-effect CSS imports. The move is more than a version change.
- D1 settles the declarations. The Vite-built packages (`line-core`, `line-components`, and later `line-genui`) emit every `.d.ts` with TypeScript 7.x `tsc --emitDeclarationOnly`, and `vite-plugin-dts` leaves the build. The `tsc -b` packages (`line-schemas`, `line-utils`, `line-icons`) keep emitting theirs with 7.x `tsc -b` (§5.6).
- Ambient `declare module` lines for the CSS package specifiers in `apps/storybook` fix TS2882 (R11 OQ2 (b)). The check stays on everywhere else, and no published output changes.
- The PR that performs the upgrade (P8) updates every live document that states TypeScript 5 or `vite-plugin-dts` in one commit. These documents are `CLAUDE.md` Tech Stack and `.claude/agents/webcomponents-supervisor.md` lines 15 and 72. The Phase 00 spec places go through an `AM-nnn`. They are the §3 diagram line 74, the §6.A.3 `vite-plugin-dts` row (line 440) and `typescript` row (line 444), the §6.B `line-core` row (line 610), the §6.F.2 `vite.config.shared.mjs` block (lines 1670 and 1685), the §7.1 `emitDeclarationOnly` note (line 2450, "No package in §6.B needs declaration-only emit") and the §7.1 matrix (lines 2468–2469). `docs/context/00-z20.md:49` is a historical record and stays.
- The `vite-plugin-dts` comment at `packages/line-core/src/mixins/inspector.ts:111` is package source, which the spec §4 table gives to webcomponents-supervisor. The orchestrator dispatches webcomponents-supervisor for it on the P8 branch, so the comment lands in the same PR but not in the one-commit document change (spec §6.P.8, §7.1, AM-040, AM-041).
- After the P8 PR, `git grep -n 'vite-plugin-dts\|TypeScript 5\|5\.9\.3'` returns no hit in the files and Phase 00 spec places this section lists or in `packages/line-core/src/mixins/inspector.ts`. Hits elsewhere are PROCESS §3 records or text that describes the TypeScript 5 history or P8, which P8 does not change (spec AM-040, AM-041).
- The Phase 00 plan keeps "TypeScript 5.x" as Phase 00 record.

---

## 3. Scope — Out

- Phase 2+ components (PRD §7.4 onward) and the basic-catalog types they bring (TextField, CheckBox, ChoicePicker, Slider, DateTimeInput, Tabs, Modal, Card; ARCHITECTURE §17.3).
- An A2UI v1.0 emitter stays out until v1.0 is final (§17.3).
- ARCHITECTURE §17.8 items stay out, each with its revisit trigger:

| Item | Decision | Trigger to revisit |
|---|---|---|
| WebMCP for form-associated elements | Defer | WebMCP spec issue #94 resolved and a second engine signals support |
| `<line-mcp-app-frame>` | Defer | line://ui targets chat hosts; needs a sandbox-proxy origin and a security review |
| Server-side A2UI → `<line-*>` HTML | Defer | A later phase spec takes it up (ARCHITECTURE §17.8; spec §2); the H1 htmx spike informs it without deciding it |
| Model-authored `<line-*>` markup | Reject | The Sanitizer API reaches Baseline and an allowlist story exists |
| json-render and OpenUI renderers | Out of scope | Upstream ships a web-components renderer |
| Headless chat primitives | Separate catalogue question | A product decision |
| Dev-time AI (Storybook 11 MCP, llms.txt) | Schedule with Storybook 11 | Storybook 11 stable |

- Transport code stays out. Transports exist as Storybook recipes only (§17.5). Phase 1 ships recipes for AG-UI, A2A, MCP and SSE and none for WebSocket or `fetch`-stream JSONL (ARCHITECTURE §17.5; spec AM-012, AM-014).
- `LineHtmxElement` stays deferred until after 1.0 (retrospective H1 outcome, PRD v0.8.15).
- SSR/SSG investigation comes after Phase 1 (PRD §1.7, MANIFESTO Out of Scope).
- `line-form` and cross-field validation come after 1.0.

---

## 4. High-Level Task Breakdown

### 4.0 Streams and owners

| Stream | Name | Owner |
|---|---|---|
| G | Agent-driven UI foundation (`line-genui`) | webcomponents-supervisor (file classes: spec §4 table, AM-022) |
| P | Platform and release (9th package, edges, publish, trusted publisher, bundle splitting, CDN, axe tier, visual regression tier, TypeScript 7, `@websublime/*` externals, CEM wiring and packaging) | infra-supervisor (file classes: spec §4 table, AM-022) |
| C | Core primitives (20 components, spec + implementation + descriptor + stories + changeset) | webcomponents-supervisor (file classes: spec §4 table, AM-022) |
| D | Cross-cutting documentation (agent-driven UI guide, recipes index, Getting Started updates) | webcomponents-supervisor |
| S | Site landing page (dogfoods the Phase 1 components; exit criterion per O3 (b)) | webcomponents-supervisor (file classes: spec §4 table, AM-022; spec §6.S.1, §10 SD71) |
| Z | Repo-wide (code of conduct, workspace resolution in tests, retrospective; the main session runs the exit sweep); process alignment lands in the ledger PR (§4.6) | Main session / per row |

Each P, C, G, D and S owner is the accountable supervisor, who runs the task on its branch; Z rows name the main session (the Z row above). `git-workflow-manager` opens the PR (PROCESS §4, §6). The spec §4 table says which supervisor edits each class of file; when a task touches a class the table gives to the other supervisor, the orchestrator (main session or `sdlc`) dispatches the other supervisor, one after the other on the same task branch, for the classes the Phase 1 spec §4 table gives it. The second dispatch adds no changeset entry; the accountable supervisor writes the changeset entry last, after the other dispatch returns, and names every published package the branch changed (spec AM-022, AM-025, AM-026, AM-027).

PROCESS §4 assigned owners by the Phase 00 stream letters (A–H) and allowed one implementer per task branch, so both changed when the Phase 1 ledger was created (§10). Row 00-Z49, the PR that created the Phase 1 ledger, aligned PROCESS §4 "Repo agents", the PROCESS §4 one-implementer rule, the PROCESS §6 changeset step, the `sdlc` implement routing by stream, the stream letters in the supervisor `description:` lines, the supervisor changeset steps, the supervisor escalation lines that route to the other supervisor, now routed through the orchestrator (main session or `sdlc`), which dispatches the other supervisor on the same task branch, the `sdlc` Handoffs routing by work area, now decided by the spec §4 file-class table, the PROCESS §6 row-flip owners, which now name the orchestrator as the `blocked → todo` flip owner, and the `CLAUDE.md` ledger pointer. Spec §6.Z lists those places by their lines before that PR; spec AM-045 moved the spec's other PROCESS locators to the new lines. The aligned rule reads: one accountable implementer per task; the orchestrator (main session or `sdlc`) dispatches the other supervisor, one after the other on the same task branch, for the classes the Phase 1 spec §4 table gives it; the second dispatch adds no changeset entry; the accountable supervisor writes the changeset entry last, after the other dispatch returns, and names every published package the branch changed.

### 4.1 Stream G — agent-driven UI foundation

R2 delivered the projection evidence, and Miguel chose direct projection on `NodeResolver` (b) on 2026-10-19 (§5.6). Stream G therefore has no projection task. It starts with the descriptor API, and G4 builds the surface on (b).

| Task | Content | PRD §7.3 item |
|---|---|---|
| G1 | Descriptor API | 2 |
| G2 | `line` and `basic` catalog emitters (A2UI v0.9.1); the `line-icons` `./a2ui` icon-name map (spec §10 SD14, AM-002) | 3 |
| G3 | Frontend-tool JSON Schema emitter | 4 |
| G4 | `<line-a2ui-surface>` (preview), direct projection on `NodeResolver`; ships the `line-genui` manifest (`customElements`, `files`, `./custom-elements.json`; spec §10 SD94) and adds it to the Storybook merge | 5 |
| G5 | CEM drift test and descriptor coverage test | 6 |
| G6 | MCP Apps bridge `line-themes/hosts/mcp-apps.css`; a `line-tokens` primitive takes a `body`-scoped `var(--host, inherit)` (spec §10 SD17; ARCHITECTURE §17.6) | 7 |
| G7 | Transport recipes in Storybook (AG-UI, A2A, MCP, SSE); recipes pin middleware versions as the documented server convention or in a mock producer, because the middleware does not run fully in a browser (R6 §5.2) | 8 |

Stream G also writes the descriptors of Button, Icon, Stack and Separator.

### 4.2 Stream P — platform and release

| Task | Content |
|---|---|
| P1 | Scaffold `packages/line-genui` |
| P2 | Layer edges in the Phase 1 spec edge table and in `ALLOWED_EDGES`; `scripts/lint-layers.mjs:59–68` has 8 entries today, and `dependencies` and `peerDependencies` both count |
| P3 | Publish, `verify-pack` and Changesets coverage of the 9th package |
| P4 | Trusted publisher bootstrap (Phase 00 spec AM-038 order), spec §6.P.4 steps 1–6: the first `line-genui` canary, the `snapshot-deploy.yml` trusted publisher, an OIDC canary from a `main` commit merged after step 2, and "Require 2FA and disallow tokens". Its PR adds `docs/context/01-p4.md` with the evidence, so the row has a PR, a Verify record and a `done` flip (spec §6.P.4, AM-036, AM-037) |
| P5 | Bundle-splitting verification. After P1 and C1, before C2: it removes the zero-export smoke step that C2's root export would fail (spec §6.P.5, AM-019), and it runs the undeclared-specifier scan over the three Vite packages, `line-genui` included, and the one-`LineElement` identity test (spec §6.P.5, AM-020) |
| P6 | CDN delivery check (unpkg, jsDelivr). After P4, C1 and C2, against a canary that contains C1 and C2, dispatched after C2 merges (spec §6.P.4, §6.P.6, AM-032, AM-036) |
| P7 | axe-core tier for the zero-violation exit criterion. Before C1 (spec §10 SD86) |
| P8 | TypeScript 7.x upgrade (O1, D1). `typescript` moves to 7.x. The Vite-built packages (`line-core`, `line-components`, later `line-genui`) emit every `.d.ts` with 7.x `tsc --emitDeclarationOnly`, and `vite-plugin-dts` leaves the build. The `tsc -b` packages emit with 7.x `tsc -b`. Ambient `declare module` lines in `apps/storybook` fix TS2882. The same commit updates the documents §2.9 lists. After R11 and the spec, before C1 |
| P9 | Library builds keep `@websublime/*` external, so `line-components` stops inlining `line-core` (R9 §2.1). Each build derives `external` from its manifest's `dependencies` and `peerDependencies` (spec §10 SD2). Before C1 |
| P10 | CEM wiring and packaging (D8). The analyser runs before the Storybook build, `preview.ts` calls `setCustomElementsManifest`, and the comments follow. `apps/storybook/.storybook/main.ts:24` and `custom-elements-manifest.config.mjs` lines 8–10 claim that Storybook loads the manifest on its own, and lines 4–6 of that config claim that the manifest is empty (Phase 00 spec AM-073, I39). `line-components` ships the manifest with a `customElements` field and a `files` entry, under `verify-pack` coverage. The `line-components` build emits it (spec §10 SD26, SD27). `preview.ts` merges the package manifests by concatenating their `modules` arrays (spec §10 SD94). Before the C1 Storybook docs and G5 |
| P11 | Visual regression tier for the PRD §5.2 Visual Regression layer and the PRD §5.2.1 coverage contract: Playwright `toHaveScreenshot` over the Storybook stories, Chromium only, in the existing "Browser tier" step. A `workflow_dispatch` workflow generates the baselines on the CI Linux runner, and the PR author commits them; each C row adds its stories' screenshots. A second `workflow_dispatch` workflow runs the off pairs before each release. P11 adds the project, helper, workflows and `.gitignore` lines and commits no `.visual.ts` file. Off Linux, the Verify record runs `bun run e2e --ignore-snapshots`. Before C1 (spec §6.P.11, §10 SD98, AM-031, AM-033, AM-034, AM-035) |
| P12 | Roles visual baselines for the PRD §5.2.1 coverage contract: the `Design System/Roles` `Toolbar` story under every `(accent, gray, mode)` combination, 62 default pairs that gate every PR and 310 off pairs that the P11 off-pair workflow runs before each release. The dispatch checks run on a throwaway branch from `main` before the PR opens, and its Verify record records them. After P11, before C1, so the default pairs gate every PR from C1 on (spec §6.P.12, §10 SD98, AM-033, AM-035, AM-036) |
| P13 | Release trusted publisher, spec §6.P.4 step 7: the `release.yml` trusted publisher. After every other Phase 1 row except D3 and Z3, within the 48 hours before the Phase 1 Version PR merge; the Version PR has no row, as in Phase 00. P13's ledger row stays `blocked` until the main session has run the exit sweep, the sweep's rows are `done` and Miguel has recorded the release-time runs on `main`, as D3 stays `blocked` until the Version PR merges; the orchestrator (main session or `sdlc`) then flips it `blocked → todo` (spec AM-040, AM-041); if the Version PR does not merge within 48 hours of step 7, Miguel recreates the `release.yml` trusted publisher before the merge. Its PR adds `docs/context/01-p13.md` with the evidence and a `minor` changeset for each package that the merged Phase 1 changesets do not bump at `minor` (`bun run changeset status`), so all nine packages reach `0.2.0`, as row `00-Z6` fixed Phase 00's `patch`-only bumps (spec §6.P.13, §7.2, §10 SD75, AM-036, AM-037, AM-038, AM-039) |

### 4.3 Stream C — core primitives

- C1–C4 cover the validating components Button, Icon, Stack and Separator (O2.b (a)). They ship first, before stream G, without descriptors, and stream G adds their descriptors.
- C21 changes `LineMachineController` in `line-core` so it calls `updateProps` on every host update, and a component declares its machine props as a function of its properties (D7). The same task corrects the "four public" count in `packages/line-core/README.md:10` and the code comment at `packages/line-core/src/machine/index.ts:2`. `@zag-js/vanilla` exports five values, and `line-core` leaves out `toStyleString` (Phase 00 spec AM-073); the names those two places list are correct. It lands before C1. It sets the update-rate budget on a fixture machine; each machine row records its own rate, and the first row past the budget adds the `line-core` subclass (spec §6.C.1, §10 SD18, AM-020).
- C22 fixes the `line-icons` resolvers for consumer bundlers (R10 P6). Both resolvers fetch the SVG from a consumer-set base URL (spec §10 SD89, SD90). It lands before C2 (Icon).
- C23 makes `LineElement` attach `ElementInternals` for every component, in a `#private` field reached through the exported `INTERNALS` Symbol. It lands before C1 (spec §10 SD19, AM-002).
- C21, C22 and C23 are prerequisites. They take numbers after the 20 component rows, so C1–C20 keep their component mapping.
- C5–C20 cover the remaining 16 components. Each ships its descriptor in the same PR.
- Each row runs the same sequence.
  1. Component spec APPROVED.
  2. Implementation.
  3. Descriptor in the same PR (C5–C20; stream G writes the C1–C4 descriptors).
  4. Storybook docs.
  5. CEM entry.
  6. Changeset.
- Each component passes the 8-point checklist of PRD §5.2.

### 4.4 Stream D — cross-cutting documentation

- D1 writes an agent-driven UI guide.
- D2 writes a recipes index for the transport recipes.
- D3 updates Getting Started for `line-genui` and the Phase 1 components. It lands after the Phase 1 Version PR merges, so its snippets point at the published `0.2.0`. D3's ledger row stays `blocked` until that merge, as Phase 00 row `00-Z29` is `blocked` on an outside event, and the orchestrator (main session or `sdlc`) then flips it `blocked → todo` (spec §6.D.3, AM-038, AM-039, AM-040, AM-041).

### 4.5 Stream S — site

- S1 builds the landing page (hero, value proposition, features, Storybook link) with Phase 1 line components (O3 (b)).
- S1 depends on C1–C4 and is one PR that opens when they are done. A section that needs another component adds that C row to S1's Deps through a spec AM (spec §6.S.1, AM-037).

### 4.6 Stream Z — repo-wide

- Z1 adds the code of conduct (PRD §10).
- No Z2 task remains, and spec AM-002 removes it. Row 00-Z49, the PR that created the Phase 1 ledger, made the process alignment that §4.0 describes, with the Phase 1 streams in the `CLAUDE.md` ledger pointer (§10 step 6).
- Z3 writes the Phase 1 retrospective and depends on every other Phase 1 row. The main session runs the exit sweep before the last rows land; the sweep is not a row, and each finding becomes a new row, as the Phase 00 sweep filed row C18 (spec §6.Z.2, §10 SD87, AM-036).
- Z5 makes every test reach another workspace package through its package name and a declared dependency, and its own package's build output through its own `exports` (PRD §5.2). It adds the private package `@websublime/line-testing`, which holds the htmx harness, moves the `line-tokens` shadow check into `line-themes`, and replaces the auto-pair string test with a browser test of all 31 accents (PRD §5.2.1). It lands before C1–C20 (spec §6.Z.3, AM-048).
- The O4 items are Phase 00 ledger rows `00-Z28` (O4.a, class `decision`), `00-Z29` (O4.b, `blocked` until the Biome release) and `00-Z30` (O4.c, class `amendment`).
- These rows do not wait for the Phase 1 ledger.

---

## 5. External Dependencies & Research Targets

PROCESS §2 requires one research note per item, at `docs/research/01-research-<slug>.md`.

### 5.1 A2UI and agent-driven UI

All six notes are delivered. The research targets below are kept as the record of what each note answered.

| Item | Research target | Note |
|---|---|---|
| R1 A2UI v0.9.1 and `@a2ui/web_core` | Current version (0.13.0 on 2026-10-13; the research note of 2026-10-06 saw 0.12.0), its `zod` and `lit` ranges, the catalog meta-schema, common-type schemas, `renderA2uiNode` vs models/binder (settled by R2), every throw path, A2UI v1.0 status | Delivered — [`01-research-a2ui-web-core.md`](../research/01-research-a2ui-web-core.md) |
| R2 Projection technique evidence | The research note §6 spike exit questions cover slot assignment, layout, the accessibility tree, document `::part()` reach, Law 6 bundle analysis, throw paths, meta-schema validation, live-region/focus policy under axe and a screen reader, and gzipped weight. Miguel chose direct projection on `NodeResolver` (b) on 2026-10-19 (note §5a, §5.6) | Delivered — [`01-research-projection-technique.md`](../research/01-research-projection-technique.md) |
| R3 Descriptor API and emitters | Zod 3 sharing with `web_core`, Zod → JSON Schema for frontend tools, what providers accept for `$ref`, `oneOf` and description length | Delivered — [`01-research-descriptor-api.md`](../research/01-research-descriptor-api.md) |
| R4 Custom Elements Manifest | Analyser output for Lit components, the C7 JSDoc tags, form-association and ARIA metadata | Delivered — [`01-research-custom-elements-manifest.md`](../research/01-research-custom-elements-manifest.md) |
| R5 MCP Apps | ext-apps SDK version, the standard host variable reference list (ARCHITECTURE §17.9), the primitive fallback strategy (§17.6) | Delivered — [`01-research-mcp-apps.md`](../research/01-research-mcp-apps.md) |
| R6 Transports | AG-UI 1.0 and the `@ag-ui/a2ui-middleware` version, A2A DataPart, MCP EmbeddedResource, the pins the recipes will use | Delivered — [`01-research-transports.md`](../research/01-research-transports.md) |

### 5.2 Components and platform

All six notes are delivered.

| Item | Research target | Note |
|---|---|---|
| R7 Zag.js and machines | `@zag-js/presence` (Presence is pre-built) through `LineMachineController`; custom machines for Button, IconButton, AvatarGroup (ARCHITECTURE §13.1–§13.2) | Delivered — [`01-research-zag-machines.md`](../research/01-research-zag-machines.md) |
| R8 Accessibility | WAI-ARIA patterns for the 20 components; the axe-core tier (Playwright vs Storybook); the §17.9 question on exposing `FormAssociated` internals for `ElementInternals` ARIA | Delivered — [`01-research-accessibility.md`](../research/01-research-accessibility.md) |
| R9 Packaging | Umbrella subpath exports and `sideEffects`, bundle-splitting verification, CDN delivery (unpkg, jsDelivr) of ESM builds, the per-component soft size target (< 5 KB gzipped, PRD §1.7), npm trusted publishing for a new package and its first version | Delivered — [`01-research-packaging.md`](../research/01-research-packaging.md) |
| R10 Icon | A2UI basic icon names and their mapping to the Lucide and Phosphor resolvers; the `line-icons` Phase 1 subpaths. Round 2 (row 00-Z47) measures how the resolvers load icons in Vite, esbuild, webpack and on the CDNs | Delivered — [`01-research-icon.md`](../research/01-research-icon.md), [`01-research-icon-round2.md`](../research/01-research-icon-round2.md) |
| R11 TypeScript 7.x toolchain | Verify `tsc -b`, `vite-plugin-dts` 5.1.2 (through `unplugin-dts` 1.1.2; `@microsoft/api-extractor` is an optional peer that the repo does not install, because `bundleTypes` is off), the CEM analyser 0.11.0 (it bundles its own `typescript ~5.4.2`) and Storybook 10 on 7.x; a blocker returns the work to the plan (PROCESS §2) | Delivered — [`01-research-typescript-7.md`](../research/01-research-typescript-7.md) |
| R12 Site dogfooding | Astro 7 static output with the Phase 1 components, client-side upgrade of the Phase 1 components | Delivered — [`01-research-site-dogfooding.md`](../research/01-research-site-dogfooding.md) |

### 5.3 Upstream facts the research must re-check

- `@a2ui/web_core` went from 0.12.0 to 0.13.0 in 11 days (2026-09-28 → 2026-10-09). 0.14.0 has been `latest` since 2026-10-17 (R1 §2.1). The spec pins exactly `0.14.0` (spec §10 SD6).
- `npm view @a2ui/web_core@0.13.0` lists seven dependencies: `lit ^3.3.3`, `zod ^3.25.76`, `@lit/context ^1.1.6`, `zod-to-json-schema ^3.25.2`, `@preact/signals-core ^1.14.2`, `validate-color ^2.2.4` and `redos-detector ^6.1.4`. 0.14.0 declares the same set (R1 §2.1–§2.2). The repo also declares `zod ^3.25.76`, while Zod `latest` is 4.6.7.

### 5.4 Decisions at the plan gate (Miguel, 2026-10-13)

#### O1 TypeScript major

The repo and npm supply these facts.

- Root `package.json` has `typescript ^5.9.3`.
- Phase 00 spec §6.A.3 says "latest 5.x" (spec line 444, diagram line 74).
- `CLAUDE.md` says "TypeScript 5+".
- npm on 2026-10-13 lists 5.9.3 as the last 5.x (2025-09-30) and 6.0.3 as the last 6.x (2026-04-16).
- npm `latest` is 7.0.2 (2026-07-08), which ships native per-platform binaries.

| Option | What it decides | Resolution |
|---|---|---|
| (a) | Stay on TypeScript 5.x | Rejected |
| (b) | Move to TypeScript 6.x | Rejected |
| (c) | Move to TypeScript 7.x | Chosen — Miguel, 2026-10-13 |

- R11 supplies the evidence.
- PRD §2 names no TypeScript major and sets "All dependencies — Latest stable versions".
- Row `00-Z20` (Phase 00 spec AM-064) applied that row as the latest version within each current major.
- Option (c) matches the literal PRD §2 row. Options (a) and (b) rely on the Phase 00 spec AM-064 reading.
- A move still changes `CLAUDE.md`, `.claude/agents/webcomponents-supervisor.md`, and the Phase 00 places §2.9 lists (through an `AM-nnn`) in one commit (PROCESS §3). D1 (§5.6) settles how the declarations are emitted.
- PRD §2 needs no change, because its "Latest stable versions" row already covers 7.x.

#### O2 Stream order and the validating set

| Sub-question | Option | What it decides | Resolution |
|---|---|---|---|
| O2.a Order | (a) | Stream G first, as PRD §7.3 stated; G1 runs on throwaway elements, then G2–G5, then Button, Icon, Stack, Separator with descriptors, then the other 16 | Rejected |
| O2.a Order | (b) | The four validating components first, then stream G on real components, then the 16; this contradicts "This stream opens Phase 1" and needs a PRD revision (PRD v0.8.17) | Chosen — Miguel, 2026-10-13 |
| O2.a Order | (c) | Interleaved; G1 and G2 first, then the four components with descriptors, then G3–G5 validated on them, then the 16 | Rejected |
| O2.b Validating set | (a) | Keep Button, Icon, Stack, Separator; each covers a Phase 1 basic-catalog type (Button, Icon, Row/Column/List, Divider) | Chosen — Miguel, 2026-10-13 |
| O2.b Validating set | (b) | Another set; needs a PRD revision | Rejected |
| O2.c G1 evidence | (a) | In the research stage (R2), so the spec designs one renderer; this moves the decision out of the stream and needs a PRD §7.3 item 1 and ARCHITECTURE §17.4 revision in the same commit as the plan (PROCESS §3; PRD v0.8.17, ARCHITECTURE v0.8.3) | Chosen — Miguel, 2026-10-13 |
| O2.c G1 evidence | (b) | As the first ledger task, so the spec states both candidates and an `AM-nnn` records the outcome | Rejected |

The O2 option texts keep the task numbering of the draft, in which G1 was the projection task. R2 settled the technique (§5.6), so §4.1 numbers stream G as G1–G7 without a projection task.

#### O3 Site scope

| Option | What it decides | Resolution |
|---|---|---|
| (a) | Landing page only (hero, value proposition, features, Storybook link), parallel and outside the exit criteria, where PRD §7.3 put it before v0.8.17 | Rejected |
| (b) | A landing page that dogfoods the Phase 1 components (PRD §5.3 "line://ui components (dogfooding)") and counts as an exit criterion; needs a PRD revision to add the criterion (PRD v0.8.17) | Chosen — Miguel, 2026-10-13 |
| (c) | The full PRD §5.3 structure (landing, docs, getting started, theming showcase, changelog, Storybook link); it stays outside the exit criteria and needs a PRD §7.3 revision of the "Parallel" line, because the PRD names only a landing page | Rejected |

#### O4 Phase 00 residual risks

Each item has two options, an own ledger row or a plan risk entry. Miguel asked for one recommendation per residual risk.

| Item | Fact | Options | Recommendation | Resolution |
|---|---|---|---|---|
| O4.a `deploy-site.yml` install scripts | The Install step runs `bun install --frozen-lockfile` without `--ignore-scripts` in the same job whose Deploy step holds `CLOUDFLARE_API_TOKEN` and runs `bun x --no-install wrangler pages deploy dist` from `node_modules`. The token sits only in the Deploy step `env`, but an install script can rewrite code that step runs. Default-trusted packages with install scripts today are `esbuild` and `workerd`. Phase 00 spec AM-067 (row `00-Z26`, Miguel's decision on 2026-10-13) applied `--ignore-scripts` to the release and snapshot workflows and rejected extending it to `deploy-site.yml`. | Own row, or plan risk entry | Own Z row, class `decision`, because it reopens a Phase 00 spec AM-067 choice and changes `.github/`. It lands before `line-genui` adds `@a2ui/web_core` and its dependencies to the workspace install. One option for that row splits build and deploy into two jobs with `--ignore-scripts` in the deploy job, the shape `deploy-storybook.yml` already uses. | Own row chosen (Miguel, 2026-10-13); ledger row `00-Z28`, class `decision`. The plan risk entry was rejected. |
| O4.b Biome `--vcs-use-ignore-file=false` | `scripts/generate-palettes.mjs` and `scripts/generate-role-maps.mjs` pass the flag so Biome 2.5.15 can format a temp output dir outside the repo root. Without it Biome panics (biomejs/biome#12158). PR biomejs/biome#11869 fixes it; it merged on 2026-09-21, and a maintainer wrote on 2026-10-05 "Will be available in the next release". npm `latest` is still 2.5.15 on 2026-10-13. | Own row, or plan risk entry | Keep it in the plan as a watch item with the trigger "a Biome release after 2.5.15 that contains PR #11869". The row is created when the trigger fires, because a row created now would sit blocked. | Own row chosen now (Miguel, 2026-10-13) over the recommended watch item; ledger row `00-Z29`, status `blocked` until a Biome release after 2.5.15 ships PR #11869. |
| O4.c Stale Bun version in the Phase 00 spec | `docs/specs/00-spec-design-system.md` line 2009 (§6.F.5 publish path, step 4) says "Bun 1.3.14 fills `workspace:` ranges from the versions in `bun.lock`". The repo runs Bun 1.4.3 (`.bun-version`, `engines.bun >=1.4.3`). Miguel reports the behaviour persists on 1.4.3 (unverified; the O4.c row runs a Bun 1.4.3 probe). | Own row, or plan risk entry | Own Z row now, class `amendment` (one factual `AM-nnn` in the Phase 00 spec, no code, a Bun 1.4.3 probe as evidence). The Phase 1 plan cannot amend the Phase 00 spec, and `CLAUDE.md` asks to fix drift in the session it is found. | Own row chosen now (Miguel, 2026-10-13); ledger row `00-Z30`, class `amendment`. The plan risk entry was rejected. |

### 5.5 Spec-level questions

These questions belonged to the Phase 1 spec. They are neither research items nor plan forks. Answered by spec §10 (APPROVED 2026-10-20). Each bullet names its answer.

- Which ids does the `basic` catalog answer to, and does a session advertise it by default before basic coverage is complete (ARCHITECTURE §17.3)? Answered: spec §10 SD43, SD44.
- What does the surface do when `processMessages` rejects a message? Answered: spec §10 SD51, SD52, SD53, SD55.
- How does the frontend-tool emitter turn a descriptor into flat parameters (D3), and is there a per-descriptor token budget? Answered: spec §10 SD46, SD50.
- How does the emitter reach Gemini (D3)? Answered: spec §10 SD48.
- How does the basic `Icon` render `{ "svgPath": … }` and an unknown bound name? Answered: spec §10 SD33.
- Does `<line-icon>` keep a slot path, and where does the A2UI name map live? Answered: spec §10 SD14.
- How do the `line-icons` resolvers load icons in a consumer bundle (C22), and which shape do the Phase 1 subpaths take? Answered: spec §10 SD88–SD92.
- What is the `sideEffects` value, the chunk layout and the isolation check? Answered: spec §10 SD4.
- How do the library builds keep `@websublime/*` external (P9)? Answered: spec §10 SD2.
- Which CDN contract do the docs promise? Answered: spec §10 SD32.
- Which components carry `agentExposed: false`? Answered: spec §10 SD38.
- Which MCP Apps host variables form the `mcp-apps.css` reference list? Answered: spec §10 SD62, §6.G.6.
- Does line://ui ship utility classes (PRD §9.13)? Answered: spec §10 SD1.
- Which version does `line-genui` release first (§2.7)? Answered: spec §10 SD3.
- Which `@a2ui/web_core` version does `line-genui` pin? Answered: spec §10 SD6.
- How is the IconButton name checked, and does IconButton join the ARCHITECTURE §7 form-associated list? Answered: spec §10 SD36.
- Which machine drives the ButtonGroup toolbar (D5)? Answered: spec §10 SD10 (custom machine, Custom tier).
- Does Chip (D6) use the pre-built `@zag-js/toggle` 1.46.0 or a custom machine, and does it also carry a remove button? Answered: spec §10 SD11 (`@zag-js/toggle`, Pre-built tier, no remove button).
- What do Button's `pressed`, `loading` and `disabled` mean? Answered: spec §10 SD35.
- How does C21 bound the cost of repeated `updateProps` calls? Answered: spec §10 SD18.
- Which tool runs the axe gate (P7)? Answered: spec §10 SD78.
- Where do the G5 tests read the manifest? Answered: spec §10 SD26.
- What does the AG-UI recipe do with `line-a2ui-error`, and what does the A2A recipe accept? Answered: spec §10 SD65, SD66.
- What do the recipes pin from `@ag-ui/a2ui-middleware`? Answered: spec §10 SD64.
- How does P8 wire the 7.x declarations (D1)? Answered: spec §10 SD7.
- Each component spec fills its htmx row (§2.4). Answered for the static rows: spec §10 SD34.
- Do DOM snapshots need a custom serializer? Answered: spec §10 SD81.

### 5.6 Decisions after the research stage (Miguel, 2026-10-20)

The twelve research notes broke statements in the PRD, ARCHITECTURE and this plan (PROCESS §2). Miguel confirmed the projection technique on 2026-10-19 and decided D1–D8 on 2026-10-20. The record is `docs/context/00-z45.md` (ledger row `00-Z45`).

Throughout this plan, D1–D8 are these decision ids, not the stream D task ids D1–D3 (§4.4).

| Fork | Option | What it decides | Resolution |
|---|---|---|---|
| PT Projection technique | (a) | Light-DOM adapter elements rendered through `web_core` `renderA2uiNode` | Rejected |
| PT Projection technique | (b) | Direct projection on the `web_core` models and binder (`NodeResolver`). The surface keeps its own reconciliation keyed by `instanceId` and its own effect lifecycle, and it loads no Lit (R2 §5a) | Chosen — Miguel, 2026-10-19 |
| D1 TypeScript 7 declarations | (a) | The Vite-built packages (`line-core`, `line-components`, later `line-genui`) emit every `.d.ts` with TypeScript 7.x `tsc --emitDeclarationOnly`, and `vite-plugin-dts` leaves the build. The `tsc -b` packages emit with 7.x `tsc -b`. §7.4 keeps "emits declarations on TypeScript 7.x" (R11 §6 OQ1 (d)) | Chosen — Miguel, 2026-10-20 |
| D1 TypeScript 7 declarations | (b) | The TypeScript 6.0 API beside 7.x, with `.d.ts` from 6.0.3 | Rejected |
| D1 TypeScript 7 declarations | (c) | Wait for TypeScript 7.1 | Rejected |
| D2 Catalog validation | (a) | The criterion uses only published artifacts. The inline form of the `line` catalog validates against `client_capabilities.json#/$defs/Catalog`, `web_core` reads the catalog back with `Catalog.fromJson`, and its `validationSchema` compiles (R1 §2.4, R2 §2.7) | Chosen — Miguel, 2026-10-20 |
| D2 Catalog validation | (b) | A line-maintained schema derived from the basic catalog | Rejected |
| D2 Catalog validation | (c) | The `web_core` round-trip alone | Rejected |
| D3 Frontend-tool schemas | (a) | Tool parameters are literal and flat, and the emitted tool definitions are accepted by OpenAI and Anthropic in strict mode and by Gemini; one flat literal model is serialised per provider (spec §10 SD48). The A2UI common types and dynamic bindings stay in the catalogs, which the flat-schema rule does not cover. The 1024-character limit is a self-imposed cap on tool descriptions (R3 §2.6, §2.7, §5 item 3) | Chosen — Miguel, 2026-10-20 |
| D3 Frontend-tool schemas | (b) | Common types in the tools, for non-strict modes only | Rejected |
| D3 Frontend-tool schemas | (c) | Both variants per descriptor | Rejected |
| D4 Focus on reparent | (a) | Focus stays on the same component. The reconciler keeps it across reorders. On a reparent the surface uses `moveBefore()` where the browser has it, and otherwise returns focus to the same `instanceId` at the end of the batch. The rule reads "the surface never moves focus to another component" (R2 §2.8) | Chosen — Miguel, 2026-10-20 |
| D4 Focus on reparent | (b) | Accept the focus loss on reparent | Rejected |
| D4 Focus on reparent | (c) | Return focus at batch end without `moveBefore()` | Rejected |
| D5 ButtonGroup | (a) | A `toolbar` with roving focus (APG Toolbar), arrow keys between the buttons. It leaves the Static tier and gains a machine in Phase 1 (R8 §6 Q6) | Chosen — Miguel, 2026-10-20 |
| D5 ButtonGroup | (b) | `role="group"`, Static, one Tab stop per button | Rejected |
| D6 Chip | (a) | A toggle button with `aria-pressed` in Phase 1. It leaves the Static tier (R8 §6 Q7) | Chosen — Miguel, 2026-10-20 |
| D6 Chip | (b) | Display only, with an optional remove button | Rejected |
| D6 Chip | (c) | Selection chips deferred to the Phase 2 selection components | Rejected |
| D7 Host props into the machine | (a) | `LineMachineController` calls `updateProps` on every host update, and a component declares its machine props as a function of its properties. The `line-core` change is task C21, before C1 (R7 §6 OQ1) | Chosen — Miguel, 2026-10-20 |
| D7 Host props into the machine | (b) | Each component calls an exposed `updateProps` | Rejected |
| D7 Host props into the machine | (c) | Components send events from `updated()`, and machines use no prop `watch` | Rejected |
| D8 Custom Elements Manifest | (a) | Storybook loads the manifest (`setCustomElementsManifest`, with the analyser run before the Storybook build), and `line-components` ships it with a `customElements` field and a `files` entry. Task P10 (R4 §6 OQ5, OQ9) | Chosen — Miguel, 2026-10-20 |
| D8 Custom Elements Manifest | (b) | Storybook only, narrowing PRD §6.3 | Rejected |
| D8 Custom Elements Manifest | (c) | Wait for Storybook 11 | Rejected |

Miguel saw the orchestrator defaults below with the forks on 2026-10-20 and corrected none.

- Descriptors stay on the Zod 3 API, because only that API composes with the `web_core` common types (R3 §2.2, §8 Zod row).
- The `line-genui` trusted-publisher bootstrap stays on path A, the Phase 00 spec AM-038 order (PRD §7.3 item 10). The spec seeds the first version (spec §10 SD3).
- Ambient `declare module` lines in `apps/storybook` fix TS2882 (R11 §6 OQ2 (b)), inside P8.
- The library builds keep `@websublime/*` external (R9 §2.1, P9). The spec sets the mechanism (spec §10 SD2).
- The `line-icons` resolvers get fixed for consumer bundlers before C2 (R10 P6, C22). The spec sets the mechanism (spec §10 SD89).
- The factual Phase 00 spec drift on the manifest and the site tree lands as Phase 00 spec AM-073. The TypeScript 7 places in that spec wait for P8.
- Field labelling (ARCHITECTURE §9), SplitButton bundling (§13.1) and the PasswordInput and DateInput tiers (PRD §4.2) get their fact corrections and stay deferred to later phases.
- The remaining forks moved to §5.5, and the spec answers them (spec §10).

---

## 6. Task Dependencies

These dependencies are fixed.

```
spec APPROVED ───────────────────────► P8, P9, P10, C21, C22, C23 and every C and G task
P1 scaffold line-genui ──────────────► G code (G1–G7), P5 (spec §6.P.5, AM-020)
P2 layer edges ──────────────────────► line-genui declares dependencies/peers
R11 + D1 ────────────────────────────► P8 TypeScript 7.x upgrade ──► C1
P8 ──────────────────────────────────► P9, P10 (spec §6.C.0, AM-040)
P9 @websublime/* external ───────────► C1
C21 controller updateProps (D7) ─────► C1
C23 LineElement internals (SD19) ────► C1
C22 line-icons resolvers ────────────► C2 Icon
P5 bundle-splitting check ───────────► C2 Icon (spec §6.P.5, AM-019)
P10 CEM wiring and packaging (D8) ───► C1 Storybook docs, G5
R2 projection decided (b) ───────────► G4 surface on NodeResolver
G4, G6 ──────────────────────────────► G7 transport recipes (spec §6.G.7, AM-040)
G1, G4, G5 ──────────────────────────► C5–C20 (spec §10 SD86, AM-020)
G3 tool emitter ─────────────────────► C12, C13, C16 (spec §10 SD86, AM-023)
component spec APPROVED ─────────────► component implementation (C1–C20)
C1–C4 shipped ───────────────────────► stream G validates on them (PRD §7.3)
CEM entries of real components ──────► G5 drift and coverage tests
C1–C4 ───────────────────────────────► S1 landing page (spec §6.S.1, AM-037)
P4 trusted publisher, every other row except D3 and Z3 ──► P13 release publisher ──► first line-genui release ──► D3, Z3
P4, C1, C2 ──────────────────────────► P6 CDN check (spec §6.P.4, §6.P.6, AM-032, AM-036)
P7 axe tier ─────────────────────────► C1 (spec §10 SD86); evidence for the zero-axe criteria
P11 visual regression tier ──────────► C1 (spec §10 SD86, SD98, AM-031)
P11 visual regression tier ──────────► P12 Roles visual baselines ──► C1 (spec §6.P.12, AM-035, AM-036)
Z5 workspace resolution in tests ────► C1–C20 (spec §6.Z.3, §10 SD86, AM-048)
```

The plan gate chose this sequence (O2.a (b), O2.c (a)), and revision 00-Z45 adds the research outcomes.

1. Research (R1–R12). Delivered (§5.1–§5.2).
2. Plan and PRD revision 00-Z45 (§5.6). Done: Miguel approved it on 2026-10-20.
3. Spec, which answers §5.5. Done: APPROVED 2026-10-20 (row 00-Z46).
4. P1 scaffold, P2 edges, P7 axe tier (spec §10 SD86), P8 TypeScript 7, P9 externals, P10 CEM wiring and packaging, P11 visual regression tier (spec §10 SD98), C21 controller change, C23 `LineElement` internals, P12 Roles visual baselines after P11 (spec §6.P.12), and Z5 workspace resolution in tests (spec §6.Z.3).
5. C1–C4 (Button, Icon, Stack, Separator), without descriptors; C22 and P5 land before C2, and P5 after C1 (spec §6.C.0).
6. Stream G (G1–G7), including the descriptors of C1–C4.
7. C5–C20, each with its descriptor in the same PR, after G1, G4 and G5; C12, C13 and C16 also after G3 (spec §6.C.0).

- Stream S builds the landing page in one PR after C1–C4 (spec §6.S.1, AM-037).
- P4 and P13 land before the first `line-genui` release; P13 lands after every other Phase 1 row except D3 and Z3, after the exit sweep's rows and the release-time runs, with its row `blocked` until then and flipped to `todo` by the orchestrator (main session or `sdlc`), within the 48 hours before the Phase 1 Version PR merge. P4 step 2 is the first `snapshot-deploy` run after P1 merges, and step 5 runs from a later `main` commit (spec §6.P.4, §6.P.13, AM-032, AM-036, AM-037, AM-038, AM-041).
- D3 and Z3 land after the Phase 1 Version PR merges; Z3 depends on D3 (spec §6.D.3, §6.Z.2, AM-038).
- P6 runs after P4, C1 and C2, against a canary that contains C1 and C2 (spec §6.P.6, AM-036).
- P7, P11 and P12 land before C1, and P12 after P11, so the default pairs gate every PR from C1 on (spec §10 SD86, SD98; spec §6.P.11, §6.P.12, AM-036).
- Z5 lands before C1–C20, so every component suite follows the PRD §5.2 resolution rule from C1 on (spec §6.Z.3, §10 SD86, AM-048).
- P9 and P10 land after P8 (spec §6.C.0, AM-040).

---

## 7. Acceptance Criteria for Phase 1

The plan mirrors the 17 PRD §7.3 exit criteria in their wording. Plan-level additions are in *italics*.

### 7.1 Components

- [ ] All listed components pass the 8-point test checklist (PRD §5.2)
- [ ] Storybook documentation complete for every component
- [ ] Zero axe-core violations
- [ ] *Every story of every component, and the `Design System/Roles` `Toolbar` story under every `(accent, gray, mode)` combination, has a committed Chromium baseline, and the visual tier passes (PRD §5.2, §5.2.1).*
- [ ] CEM manifest generated and verified
- [ ] *Storybook loads the manifest through `setCustomElementsManifest`, and `@websublime/line-components` and `@websublime/line-genui` each ship one with a `customElements` field and a `files` entry (D8; spec §10 SD94).*
- [ ] Changeset entry for every component
- [ ] *Every Phase 1 component spec is APPROVED before code, with the Agent contract section filled (hand-off item 4).*
- [ ] *Every component fills the htmx Tests row per C9 (harness run, or `n/a` with a reason).*
- [ ] *Every component fills its row in `docs/COMPETITIVE-COMPONENT-ANALYSIS.md`.*
- [ ] *Each component's gzipped size is measured and reported against the < 5 KB soft target (not gating, PRD §1.7).*

### 7.2 Agent-driven UI

- [ ] Every Phase 1 component in `@websublime/line-components` has an agent descriptor (exposed, or flagged `agentExposed: false` with a reason), and the CEM drift and coverage tests pass
- [ ] The inline form of `@websublime/line-genui/catalog.json` (the `line` catalog) validates against the A2UI v0.9.1 `client_capabilities.json#/$defs/Catalog`, `web_core` reads the catalog back with `Catalog.fromJson`, and the catalog's `validationSchema` compiles
- [ ] The Phase 1 subset of the `basic` catalog is registered under the A2UI basic catalog id `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json`, and unmapped basic types render an inert placeholder and raise `line-a2ui-error`
- [ ] The frontend-tool schemas validate as JSON Schema and use literal, flat parameters without the A2UI common types or dynamic bindings. The emitted tool definitions are accepted by OpenAI and Anthropic in strict mode and by Gemini, and every tool description stays at or under the self-imposed cap of 1024 characters
- [ ] `@websublime/line-themes/hosts/mcp-apps.css` maps every MCP Apps standard host colour, font and border-radius variable on the reference list that the Phase 1 spec fixes, each to a line theme alias or token, and passes `lint-layers`
- [ ] `<line-a2ui-surface>` renders every agent-exposed Phase 1 component from A2UI messages with zero axe-core violations, and document `::part()` rules apply to the rendered elements
- [ ] Importing `@websublime/line-genui/catalog` defines no element; importing `@websublime/line-genui/a2ui` defines only `line-a2ui-surface`

### 7.3 Documentation

- [ ] Storybook holds one recipe per transport (AG-UI, A2A, MCP, SSE)
- [ ] The site landing page (hero, value proposition, features, Storybook link; PRD §5.3) is built with Phase 1 line://ui components and is live at `line-ui.websublime.com`

### 7.4 Platform and release

- [ ] Bundle splitting verified — families and independents work as documented
- [ ] `scripts/lint-layers.mjs` carries the `line-genui` edges and passes
- [ ] The npm trusted publisher for `@websublime/line-genui` exists before its first release
- [ ] *CDN delivery through unpkg and jsDelivr is verified against the two-path contract of spec §10 SD32 (PRD §1.7).*
- [ ] *The workspace builds, type-checks and emits declarations on TypeScript 7.x (O1). The Vite-built packages emit every `.d.ts` with 7.x `tsc --emitDeclarationOnly`, and the `tsc -b` packages with 7.x `tsc -b` (D1).*
- [ ] *A consumer that imports `@websublime/line-core` and a `line-components` subpath gets one `LineElement` class (P9).*
- [ ] *The Phase 1 spec records the utility-class decision (PRD §9.13).*
- [ ] *Every package is released at `0.2.0` through `release.yml` with provenance, and `line-genui` gets its first release per the spec.*
- [ ] *A code of conduct is present before `v0.2.0` (PRD §10).*
- [ ] *Rows `00-Z28` and `00-Z30` are done, and row `00-Z29` is done or still blocked on the Biome release.*
- [ ] *The exit sweep runs before the last rows land, its findings become ledger rows, and the Phase 1 retrospective is written with a hand-off to Phase 2 (retrospective lesson 9).*

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A2UI churn; `web_core` ships breaking minors (0.12.0 → 0.13.0 in 11 days; 0.14.0 `latest` since 2026-10-17 with 12 entries marked BREAKING) | High | High | Pin exactly (ARCHITECTURE §17.7), keep a version seam in `line-genui`; the spec pins `0.14.0`, and a newer version needs an AM (spec §10 SD6) |
| Zod split; the repo and `web_core` declare `zod ^3.25.76` while Zod `latest` is 4.6.7, and descriptors share Zod types with `web_core` | Medium | High | Keep the repo on Zod 3 and the descriptors on the Zod 3 API until `web_core` moves (relies on the same Phase 00 spec AM-064 reading of PRD §2). R3 §2.2 shows that only the Zod 3 API composes with the `web_core` common types, and that Zod 4 descriptors lose every prop without an error (upstream PR #2753 is open) |
| The TypeScript 7.x move (O1) breaks the toolchain | Medium | High | R11 found blocker B1 (`vite-plugin-dts` needs the TypeScript JS API, which 7.0 lacks) and TS2882 in `apps/storybook`. D1 emits the Vite-built packages' `.d.ts` with 7.x `tsc --emitDeclarationOnly`, and ambient `declare module` lines fix TS2882 (P8) |
| `line-components` inlines `line-core`, so consumers get two `LineElement` classes (R9 §2.1) | High | High | P9 keeps `@websublime/*` external before C1; the §7.4 one-class criterion |
| The reference icon resolvers emit no icon in a consumer bundle (R10 P6) | High | Medium | C22 fixes them before C2; both resolvers fetch from a consumer-set base URL (spec §10 SD89, SD90) |
| Repeated `updateProps` calls slow each machine down (D7, C21). Each call nests one more merge closure, and one `prop()` read grew from 0.013 ms to 0.397 ms over 4,000 calls (R7 §2.3 P4) | Medium | Medium | C21 sets a budget on a fixture machine, each machine row records its own rate, and a `line-core` subclass, added by the first row past the budget, replaces the props source only past it (spec §10 SD18, AM-020). D7 stands |
| Catalog quality becomes the agent UX | High | Medium | Descriptor descriptions reviewed in each component spec; research note §7 |
| Accessibility of agent-built trees is under-specified upstream | Medium | High | Renderer accessibility rules (§17.4) with the D4 focus rule; the R2 VoiceOver pass matched R2 scenarios S1–S10 for (b); P7 axe tier |
| Prompt injection through action labels | Medium | High | Agent strings stay untrusted; plain text by default (§17.4) |
| Scope creep toward a chat platform | Medium | Medium | Hold the §3 out-of-scope list; headless chat primitives stay a product decision |
| happy-dom gaps hide browser bugs | High | Medium | The browser tier is the source of truth (retrospective lesson 2) |
| Bugs show only in built output | Medium | High | Test the built artifact (retrospective lesson 5) |
| Eager imports in the catalog or surface regress Law 6 | Medium | High | Lazy `load()` per descriptor; P5 bundle-splitting check; the "defines no element" exit criterion |
| The catalog schema weight grows per descriptor | Medium | Medium | R3 §2.7 measured 547 o200k tokens for the four-component `line` catalog and 73–778 tokens per frontend tool; measure per component PR |
| A2UI v1.0 goes final mid-phase | Low | Medium | The v1.0 emitter stays out of scope (§3); the surface keeps preview status |
| O4.a install scripts in `deploy-site.yml` | Medium | High | Ledger row `00-Z28` (§5.4 O4.a) |
| O4.b Biome flag workaround | Low | Low | Ledger row `00-Z29`, blocked until the Biome release (§5.4 O4.b) |
| O4.c stale Bun version in the Phase 00 spec | Low | Low | Ledger row `00-Z30` (§5.4 O4.c) |

---

## 9. Deliverable Summary

- Phase 1 ships "20 components and `line-genui`" (PRD §7.3) as `v0.2.0`.
- Every component meets the agent contract.

---

## 10. Next Steps

1. The research stage is done. R1–R12 are delivered (§5.1–§5.2), and revision 00-Z45 aligned the PRD (v0.8.18), ARCHITECTURE (v0.8.4) and this plan with them (PROCESS §2). Done.
2. Miguel approves revision 00-Z45. Done: approved 2026-10-20.
3. The spec `docs/specs/01-spec-core-primitives.md` answers §5.5. Done: APPROVED 2026-10-20 (row 00-Z46). Component specs `docs/specs/NNNN-<component>.md` are written just-in-time (PRD §8.2).
4. Until the Phase 1 ledger exists, each opening PR (the spec, the coherence review, the ledger) gets its own row in stream Z of the Phase 00 ledger.
5. The coherence review runs 3 clean rounds with the lenses plan↔PRD, spec↔research and spec↔ARCHITECTURE (PROCESS §5). Done: rounds 32, 33 and 34 came back clean (row 00-Z48, #281).
6. The ledger `docs/plans/01-tasks-core-primitives.md` follows the spec's streams. Done in row 00-Z49, whose PR also made the process alignment that §4.0 describes (spec §6.Z). No Z2 task remains (spec AM-002).
7. Work is delegated to the supervisors, the exit sweep runs and files its findings as new rows, and Z3's retrospective `docs/retrospective/01-<slug>.md` closes the phase (spec §6.Z.2).

---

## 11. Resolved Questions (2026-10-13, 2026-10-19, 2026-10-20)

| Id | Question | Resolution |
|---|---|---|
| O1 | Which TypeScript major does Phase 1 use? | TypeScript 7.x (7.0.2), after R11 verifies the toolchain |
| O2.a | In which order do stream G and the validating components run? | Button, Icon, Stack and Separator first, then stream G on them, then the other 16 |
| O2.b | Which components form the validating set? | Button, Icon, Stack and Separator |
| O2.c | Where is the projection technique evidence produced? | In the research stage (R2), so the spec designs one renderer. Outcome: direct projection on `NodeResolver` (b), chosen on 2026-10-19 |
| O3 | What is the site scope in Phase 1? | A landing page that dogfoods the Phase 1 components and is an exit criterion |
| O4.a | How is the `deploy-site.yml` install-script risk handled? | Ledger row `00-Z28`, class `decision` |
| O4.b | How is the Biome `--vcs-use-ignore-file=false` workaround tracked? | Ledger row `00-Z29`, blocked until a Biome release after 2.5.15 ships PR #11869 |
| O4.c | How is the stale Bun version in the Phase 00 spec fixed? | Ledger row `00-Z30`, class `amendment` |
| PT | Which projection technique does the renderer use? | Direct projection on the `web_core` models and binder (`NodeResolver`) (Miguel, 2026-10-19) |
| D1 | How do the Vite-built packages get `.d.ts` files on TypeScript 7? | They emit every `.d.ts` with TypeScript 7.x `tsc --emitDeclarationOnly`, and `vite-plugin-dts` leaves the build; the `tsc -b` packages emit with 7.x `tsc -b` (Miguel, 2026-10-20) |
| D2 | What does the `line` catalog validate against? | Published artifacts only: `client_capabilities.json#/$defs/Catalog` for the inline form, the `Catalog.fromJson` read-back and a compiling `validationSchema` |
| D3 | What do the frontend-tool schemas look like? | Literal, flat parameters; the emitted tool definitions are accepted by OpenAI and Anthropic in strict mode and by Gemini, and one flat literal model is serialised per provider (spec §10 SD48); common types stay in the catalogs; 1024 characters is a self-imposed cap on tool descriptions |
| D4 | Where does focus go when an agent update reparents the focused node? | It stays on the same component, through `moveBefore()` where available and otherwise a return to the same `instanceId` at batch end |
| D5 | What is ButtonGroup? | A `toolbar` with roving focus and a machine in Phase 1 |
| D6 | What is Chip? | A toggle button with `aria-pressed` and a machine in Phase 1 |
| D7 | How do host prop changes reach a Zag machine? | `LineMachineController` calls `updateProps` on every host update, with machine props declared as a function of the host properties (C21) |
| D8 | Does Phase 1 wire and ship the Custom Elements Manifest? | Storybook loads it, and `line-components` ships it with a `customElements` field and a `files` entry (P10) |
