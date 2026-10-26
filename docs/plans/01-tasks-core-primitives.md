# TASK LEDGER: Phase 1 — Core Primitives

**Plan:** [`01-plan-core-primitives.md`](./01-plan-core-primitives.md) · **Spec:** [`../specs/01-spec-core-primitives.md`](../specs/01-spec-core-primitives.md) · **Rules:** `docs/PROCESS.md` §6

This file is the live state of Phase 1. It describes state; scope and acceptance criteria live in the plan
and the spec. One row per unit of work; the row changes in the same PR as the work. Ids are `<Stream><n>`
here and `01-<Stream><n>` everywhere else. The rows follow the spec §6 streams, and each Task cell names its
spec section. C21–C23 come after the 20 component rows, so C1–C20 keep their component mapping (plan §4.3).
Gaps stay (no Z2, spec AM-002); new rows take the highest number in the stream + 1.

Every row also rests on the APPROVED spec and its coherence review, Phase 00 rows `00-Z46` and `00-Z48`
(both `done`); Deps lists only Phase 1 rows. Owner names the accountable implementer (plan §4.0), the main
session for Z rows. The spec §4 table decides which supervisor edits each file class, and the orchestrator
dispatches the other supervisor on the same branch when a task touches its classes (PROCESS §4). A `blocked`
row waits on an outside event named in its Task cell; the orchestrator flips it `blocked → todo` once that
event has happened (PROCESS §6).

**Status:** `todo` · `in_progress` · `in_review` · `done` · `blocked`. **Ready** = `todo` with every Deps entry `done`.

## Stream P — Platform and Release (`infra-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| P1 | P | Scaffold `packages/line-genui` with `exports`, `files` and `repository` (spec §6.P.1, §4.1) | infra-supervisor | P2 | todo | — | — | — |
| P2 | P | Layer edges: the Phase 1 spec §3.2 edge table in `ALLOWED_EDGES` (`scripts/lint-layers.mjs`) (spec §6.P.2, §3.3) | infra-supervisor | — | done | chore/01-p2-layer-edges | #286 | — |
| P3 | P | Publish, `verify-pack` and Changesets coverage of the 9th package (spec §6.P.3) | infra-supervisor | P1 | todo | — | — | — |
| P4 | P | Trusted publisher bootstrap, spec §6.P.4 steps 1–6, with Miguel for the npmjs.com steps. The PR adds `docs/context/01-p4.md` with the evidence (spec §6.P.4) | infra-supervisor | P1, P3 | todo | — | — | — |
| P5 | P | Bundle-splitting verification: removes the "Zero-export smoke" step before C2, adds the undeclared-specifier scan and the one-`LineElement` identity test (spec §6.P.5, §7.5) | infra-supervisor | P1, P9, C1 | todo | — | — | — |
| P6 | P | CDN delivery check (unpkg, jsDelivr) against a canary that contains C1 and C2, dispatched after C2 merges (spec §6.P.6, §7.7) | infra-supervisor | P4, C1, C2 | todo | — | — | — |
| P7 | P | axe-core tier for the zero-violation exit criterion (spec §6.P.7, §7.4) | infra-supervisor | — | todo | — | — | — |
| P8 | P | TypeScript 7.x upgrade: `tsc --emitDeclarationOnly` replaces `vite-plugin-dts` in the Vite builds, ambient `declare module` lines fix TS2882 in `apps/storybook` (spec §6.P.8, §7.1) | infra-supervisor | — | done | chore/01-p8-typescript-7 | #283 | AM-074 (Phase 00 spec) |
| P9 | P | Library builds keep `@websublime/*` external, derived from each manifest's `dependencies` and `peerDependencies` (spec §6.P.9) | infra-supervisor | P8 | done | chore/01-p9-websublime-external | #285 | AM-046; AM-075, AM-076 (Phase 00 spec) |
| P10 | P | CEM wiring and packaging: the analyser runs before the Storybook build, `preview.ts` merges the package manifests, `line-components` ships its manifest (spec §6.P.10, §7.3) | infra-supervisor | P8 | todo | — | — | — |
| P11 | P | Visual regression tier: Playwright `toHaveScreenshot` over the Storybook stories, Chromium only, with the baseline and off-pair workflows; commits no `.visual.ts` file (spec §6.P.11) | infra-supervisor | — | done | test/01-p11-visual-regression-tier | #288 | — |
| P12 | P | Roles visual baselines: 62 default pairs that gate every PR and 310 off pairs that run before each release (spec §6.P.12) | infra-supervisor | P11 | done | test/01-p12-roles-visual-baselines | #289 | AM-047 |
| P13 | P | Release trusted publisher, spec §6.P.4 step 7, with Miguel for the npmjs.com step, plus a `minor` changeset for each package the merged Phase 1 changesets do not bump at `minor`. The PR adds `docs/context/01-p13.md`. `blocked` until the main session has run the exit sweep, the sweep's rows are `done` and Miguel has recorded the release-time runs on `main`; it lands within the 48 hours before the Phase 1 Version PR merge (spec §6.P.13, §7.2) | infra-supervisor | every other Phase 1 row except D3 and Z3, the exit-sweep rows included | blocked | — | — | — |

## Stream C — Core Primitives (`webcomponents-supervisor`)

Each C1–C20 row opens with its component spec APPROVED and ships the implementation, the Storybook docs, the
CEM entry and the changeset; C5–C20 also ship their descriptor (spec §6.C.0, §6.C.6).

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| C1 | C | Button, `<line-button>` at `./button`; component spec `docs/specs/0002-button.md` (spec §6.C.4–§6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, Z5 | todo | — | — | — |
| C2 | C | Icon, `<line-icon>` at `./icon`, with the registry hook, SVG injection rule and icon surface acceptance; component spec `docs/specs/0014-icon.md` (spec §6.C.3, §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P5, P7–P12, C22, Z5 | todo | — | — | — |
| C3 | C | Stack, `<line-stack>` at `./stack`; component spec `docs/specs/0018-stack.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, Z5 | todo | — | — | — |
| C4 | C | Separator, `<line-separator>` at `./separator`; component spec `docs/specs/0011-separator.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, Z5 | todo | — | — | — |
| C5 | C | IconButton, `<line-icon-button>` at `./icon-button`, on the shared Button machine; component spec `docs/specs/0003-icon-button.md` (spec §6.C.4–§6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, C1, Z5 | todo | — | — | — |
| C6 | C | ButtonGroup, `<line-button-group>` at `./button-group`, custom roving-focus machine; component spec `docs/specs/0004-button-group.md` (spec §6.C.4–§6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, C1, Z5 | todo | — | — | — |
| C7 | C | Alert, `<line-alert>` at `./alert`; component spec `docs/specs/0006-alert.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, Z5 | todo | — | — | — |
| C8 | C | Chip, `<line-chip>` at `./chip`, on `@zag-js/toggle`; component spec `docs/specs/0008-chip.md` (spec §6.C.4–§6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, Z5 | todo | — | — | — |
| C9 | C | Badge, `<line-badge>` at `./badge`; component spec `docs/specs/0007-badge.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, Z5 | todo | — | — | — |
| C10 | C | Avatar, `<line-avatar>` at `./avatar`, plus the `Image` `variant: "avatar"` route in the G2 `basic` map; component spec `docs/specs/0009-avatar.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, Z5 | todo | — | — | — |
| C11 | C | AvatarGroup, `<line-avatar-group>` at `./avatar-group`; component spec `docs/specs/0010-avatar-group.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, C10, Z5 | todo | — | — | — |
| C12 | C | Visually Hidden, `<line-visually-hidden>` at `./visually-hidden`, `agentExposed: false`; component spec `docs/specs/0012-visually-hidden.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G3, G4, G5, Z5 | todo | — | — | — |
| C13 | C | Portal, `<line-portal>` at `./portal`, `agentExposed: false`; component spec `docs/specs/0013-portal.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G3, G4, G5, Z5 | todo | — | — | — |
| C14 | C | Kbd / Shortcut, one tag `<line-kbd>` at `./kbd`; component spec `docs/specs/0015-kbd.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, Z5 | todo | — | — | — |
| C15 | C | Skeleton, `<line-skeleton>` at `./skeleton`; component spec `docs/specs/0016-skeleton.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, Z5 | todo | — | — | — |
| C16 | C | Presence, `<line-presence>` at `./presence`, on `@zag-js/presence`, `agentExposed: false`; component spec `docs/specs/0017-presence.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G3, G4, G5, Z5 | todo | — | — | — |
| C17 | C | Grid, `<line-grid>` at `./grid`; component spec `docs/specs/0019-grid.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, Z5 | todo | — | — | — |
| C18 | C | Center, `<line-center>` at `./center`; component spec `docs/specs/0020-center.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, Z5 | todo | — | — | — |
| C19 | C | Aspect Ratio, `<line-aspect-ratio>` at `./aspect-ratio`; component spec `docs/specs/0021-aspect-ratio.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, Z5 | todo | — | — | — |
| C20 | C | Spinner, `<line-spinner>` at `./spinner`, CSS-only; component spec `docs/specs/0022-spinner.md` (spec §6.C.4, §6.C.6) | webcomponents-supervisor | C21, C23, P7–P12, G1, G4, G5, Z5 | todo | — | — | — |
| C21 | C | `LineMachineController` calls `updateProps` on every host update (D7), sets the update-rate budget on a fixture machine, and corrects the "four public" count in `packages/line-core/README.md` and `src/machine/index.ts` (spec §6.C.1) | webcomponents-supervisor | — | todo | — | — | — |
| C22 | C | `line-icons` reference resolvers fetch the SVG from a consumer-set `base` URL; adds the `./registry`, `./resolvers/lucide` and `./resolvers/phosphor` subpaths, the consumer matrix test and the CDN gate (spec §6.C.3) | webcomponents-supervisor | — | todo | — | — | — |
| C23 | C | `LineElement` attaches `ElementInternals` once, in a `#private` field reached through the exported `INTERNALS` Symbol, and `reflectState` writes `data-<state>` and `:state(<state>)` (spec §6.C.2) | webcomponents-supervisor | — | todo | — | — | — |

## Stream G — Agent-Driven UI Foundation (`webcomponents-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| G1 | G | Descriptor API in `line-genui` and the descriptors of C1–C4 (spec §6.G.1) | webcomponents-supervisor | P1, P2, C1–C4 | todo | — | — | — |
| G2 | G | `line` and `basic` catalog emitters (A2UI v0.9.1) and the `line-icons` `./a2ui` icon-name map (spec §6.G.2) | webcomponents-supervisor | G1 | todo | — | — | — |
| G3 | G | Frontend-tool JSON Schema emitter (spec §6.G.3) | webcomponents-supervisor | G1 | todo | — | — | — |
| G4 | G | `<line-a2ui-surface>` (preview), direct projection on `NodeResolver`, with the `line-genui` manifest merged into Storybook (spec §6.G.4) | webcomponents-supervisor | G1, G2, P5 | todo | — | — | — |
| G5 | G | CEM drift test and descriptor coverage test (spec §6.G.5) | webcomponents-supervisor | G1, P10 | todo | — | — | — |
| G6 | G | MCP Apps bridge `line-themes/hosts/mcp-apps.css` (spec §6.G.6) | webcomponents-supervisor | P1, C1–C4 | todo | — | — | — |
| G7 | G | Transport recipes in Storybook (AG-UI, A2A, MCP, SSE) (spec §6.G.7) | webcomponents-supervisor | G4, G6 | todo | — | — | — |

## Stream D — Cross-Cutting Documentation (`webcomponents-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| D1 | D | Agent-driven UI guide (spec §6.D.1) | webcomponents-supervisor | G1–G6 | todo | — | — | — |
| D2 | D | Recipes index for the transport recipes (spec §6.D.2) | webcomponents-supervisor | G7 | todo | — | — | — |
| D3 | D | Getting Started updates for `line-genui` and the Phase 1 components, with snippets on the published `0.2.0`. `blocked` until the Phase 1 Version PR merges (spec §6.D.3) | webcomponents-supervisor | C1–C20, G4, P6 | blocked | — | — | — |

## Stream S — Site (`webcomponents-supervisor`)

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| S1 | S | Landing page built with Phase 1 line://ui components (hero, value proposition, features, Storybook link), one PR (spec §6.S.1) | webcomponents-supervisor | C1–C4 | todo | — | — | — |

## Stream Z — Repo-wide

| ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM |
|---|---|---|---|---|---|---|---|---|
| Z1 | Z | Code of conduct `CODE_OF_CONDUCT.md` (Contributor Covenant, latest version), linked from `README.md`; Miguel supplies the reporting contact (spec §6.Z.1) | main session | — | todo | — | — | — |
| Z3 | Z | Phase 1 retrospective `docs/retrospective/01-<slug>.md` with the Phase 2 hand-off. The main session runs the exit sweep before the last rows land and files each finding as a new row, which joins these Deps (spec §6.Z.2) | main session | every other Phase 1 row | todo | — | — | — |
| Z4 | Z | Stale line locators around `scripts/lint-layers.mjs`. (1) The script's comments and error messages cite Phase 00 spec line numbers that no longer match the spec (for example `§6.B lines 462-465`, `§6.B line 569`, `§9.1 line 1644`), and the "not in the allowed-edges table" error names only Phase 00 spec §6.B, though Phase 1 spec §3.2 also governs the edge table. (2) Every Phase 1 spec locator into the script past its line 32 (for example `:181-205` in §3.1 and `:187-190` in §3.3) sits three lines low after P2; the fix is a Phase 1 spec AM. Found during the 01-P2 understand and Verify; P2 rewrites only the header lines spec §3.3 names | main session | P2, P9 | todo | — | — | — |
| Z5 | Z | Workspace resolution in tests (PRD §5.2). A test reaches another workspace package only by its package name, declared in its own package's manifest, and reaches its own package's build output, the targets of its `exports`, by self-reference through `exports`. A relative path never reaches into another package or into the package's own `dist/`, and a test may reach its own package's `src/` and `__tests__/` by a relative path whether or not `files` ships them. (1) Fix the eight files that read another package's or their own `dist` by relative path: `line-themes` `aliases-scope.e2e.ts`, `cascade-layer.e2e.ts`, `hue-role-names.e2e.ts`, `palette.snapshot.test.ts`, `schema.test.ts` and `role-mapping.snapshot.test.ts`; `line-tokens` `shadows.e2e.ts`, which moves to `line-themes`, with `line-tokens` as a `line-themes` devDependency; and the `line-core` htmx harness, which moves to the new private package `@websublime/line-testing` with `htmx2` and `htmx4` and a `playwright` peer, while `line-core` declares `@websublime/line-testing`, `htmx2` and `htmx4` as devDependencies, the root drops `htmx2` and `htmx4`, and `.changeset/config.json` ignores `@websublime/line-testing`. `line-icons` already resolves its fixtures `lucide-static` and `@phosphor-icons/core` through its declared optional peers. (2) Replace the auto-pair string test with `auto-pair.e2e.ts`, which checks all 31 accents against PRD §9.5 in Chromium, Firefox and WebKit, and keep the selector contract and the `:not([data-gray])` guard check in `defaults-selectors.test.ts`. (3) The rule lives in PRD §5.2 (v0.8.27) and spec §7.8, and Z5 joins the C1–C20 Deps (spec §6.C.4, §10 SD86). Found during the 01-P12 understand; Miguel's decisions of 2026-10-22 and 2026-10-23, approved with PRD v0.8.27, AM-048 and AM-077 on 2026-10-23 (spec §6.Z.3) | main session | — | in_review | test/01-z5-workspace-resolution-in-tests | #290 | AM-048; AM-077 (Phase 00 spec) |
