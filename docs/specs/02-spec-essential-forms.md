# SPEC: Phase 2 — Essential Forms

**Status:** DRAFT — every §10 row is Proposed and needs Miguel before the spec is APPROVED (PROCESS §3)
**Author:** Ada (architect), for row 01-Z34
**Date:** 2026-11-27
**Phase target:** line://ui v0.3.0
**Source PRD:** [`docs/PRD.md`](../PRD.md) (v0.8.40)
**Source Plan:** [`docs/plans/02-plan-essential-forms.md`](../plans/02-plan-essential-forms.md) (APPROVED; revised by rows
01-Z29, 01-Z30 and 01-Z31)
**Source Architecture:** [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) (v0.8.30)
**Source MANIFESTO:** [`docs/MANIFESTO.md`](../MANIFESTO.md) (revised 2026-11-27)
**Source decisions:** `docs/context/01-z29.md` (D1–D33, the follow-up decisions and the review round 1 rulings, all
binding); `docs/context/01-z29-register.md` (the options and evidence behind them)
**Source Research:**
- R1 — [`docs/research/02-research-zag-form-machines.md`](../research/02-research-zag-form-machines.md)
- R2 — [`docs/research/02-research-form-associated-contract.md`](../research/02-research-form-associated-contract.md)
- R3 — [`docs/research/02-research-field-labelling.md`](../research/02-research-field-labelling.md)
- R4 — [`docs/research/02-research-select.md`](../research/02-research-select.md)
- R5 — [`docs/research/02-research-date-input.md`](../research/02-research-date-input.md)
- R6 — [`docs/research/02-research-a2ui-form-types.md`](../research/02-research-a2ui-form-types.md)
- R7 — [`docs/research/02-research-progressive-enhancement-ssr.md`](../research/02-research-progressive-enhancement-ssr.md)
- R8 — [`docs/research/02-research-packaging-weight.md`](../research/02-research-packaging-weight.md)
- R9 — [`docs/research/02-research-fieldset.md`](../research/02-research-fieldset.md)
- R10 — [`docs/research/02-research-theming-showcase.md`](../research/02-research-theming-showcase.md)

**Locators.** Every `file:N` locator resolves in the worktree of row 01-Z34, which is `origin/main` plus the row commit.
"R1"–"R10" name the Phase 2 notes above; a Phase 1 note is named "Phase 1 research". "Phase 1 spec" is
`docs/specs/01-spec-core-primitives.md` through AM-126. "D1"–"D33" are Miguel's decisions in `docs/context/01-z29.md`,
and the stream D rows are written "row D1"–"row D3". "C1"–"C15" are this spec's component rows, and the agent contract
rules of ARCHITECTURE §17.2 are written "rule C1"–"rule C9"; in the verbatim criteria of §9, "C4" is rule C4. "SDn" is a
row of this spec's §10; a Phase 1 row is written "Phase 1 spec SDn", except "the SD76 widening", the Phase 1 peer-range
duty that keeps its name. Phase 2 component specs pin this spec through its last `AM-nnn` (PROCESS §3).

> **What this document is.** The implementation specification for Phase 2 of line://ui. It is the contract for the
> shared form layer in `line-core`, the controller changes, the 15 form components as a set, the agent-driven UI work,
> platform and release, documentation, the site showcase and the cross-cutting test rules. Section §10 records every
> phase decision it rests on, and §10.2 maps every question the plan left to it.
>
> **What this document is NOT.** It is not a plan; scope, streams and exit criteria belong to the plan. It is not
> research; facts come from R1–R10, and a fact no note probed carries `[INFERENCE]` and becomes a gate. It is not a
> component spec; each component's anatomy details, keyboard map and parts belong to `docs/specs/0023`–`0037`, which
> this spec binds through rules and probe gates (plan §2.1).

---

## 1. Goals

1. Ship a shared form-control layer in `line-core` that gives every form-associated Phase 2 component the native form
   contract: value, default value, validity, reset, restore, disabled, the error-after-interaction state and implicit
   submission (plan §1, §4.1, O1 (a)).
2. Give `LineMachineController` an opt-in start after the first render and a run-time catch that switches to the
   static fallback, the run-time catch only after a probe shows where it can sit (D5, D8; plan §4.1).
3. Ship the 15 form components of PRD §7.4 in the `@websublime/line-components` umbrella, the validating set
   (PasswordInput, Field, Checkbox) and Input first, then the other 11, each with its descriptor (plan §2.1, §6, O1).
4. Prove the native form contract of plan §2.3 for every form-associated component, and for Input and Textarea through
   the author's slotted native control, in Chromium, Firefox and WebKit, with Linux WebKit in CI (plan §2.3, §5.3).
5. Map the five A2UI basic form types, each in `<line-field>`, on A2UI v0.9.1 and v1.0, and end the renderer preview at
   the phase exit (plan §2.4, O3 (b); PRD §7.4 `docs/PRD.md:977`).
6. State one rule for every form control the surface creates inside a host-page `<form>` (plan §2.4, §7.2; R6 §2.4).
7. Document forms: the Storybook `Patterns` section with the floating label, a forms guide and Getting Started (plan
   §2.5, §4.5).
8. Build the site's Theming showcase with five Phase 2 controls and deploy it at `line-ui.websublime.com` (plan §2.8,
   O5 (b), D31).
9. Release every package in `0.3.x` through `release.yml` with provenance, each package's first Phase 2 `minor` as its
   `0.3.0` (plan §2.6, §2.7, §7.4).

---

## 2. Non-Goals

These stay out of Phase 2, and no task in this spec introduces them (plan §3).

- Combobox, Date Picker and Time Picker, the Phase 4 refinements of ChoicePicker and DateTimeInput
  (`docs/ARCHITECTURE.md:1683`).
- `line-form`, cross-field validation and FloatingField (PRD §7.11; ARCHITECTURE §7 `:423-424`).
- A `native-mobile` prop on Select (ARCHITECTURE §16.2 `:1515`).
- WebMCP for form-associated elements (ARCHITECTURE §17.8 `:1746`).
- Server-side A2UI → `<line-*>` HTML, and model-authored markup (PRD Appendix D; ARCHITECTURE §17.8).
- `@zag-js/field` and `@zag-js/fieldset`, which have only 2.0.0-next releases (plan §3; R1 §2.1).
- SSR/SSG support. R7 is the investigation O8 (a) asked for, and §10 SD22 states only an authoring rule; no row ships
  SSR support (plan §3).
- A DateInput range selection (`selectionMode: "range"`). PRD §4.2 lists a single DateInput (`docs/PRD.md:283`;
  R5 §6 Q12).
- Lazily created `line-core` reset sheets. R7 §7 Q7 makes that change its own row, and Phase 2 opens none.
- SSR rows for Avatar, AvatarGroup and Badge. SSR is no requirement, so R7 §2.5 is the record (R7 §7 Q8).
- Component internals: parts, slot names beyond those this spec fixes, keyboard maps and machine shapes. Each
  component spec owns them (plan §2.1).

---

## 3. Architecture Summary

### 3.1 Packages and apps

Phase 2 adds no package and no layer edge. The nine published packages and the two apps keep the Phase 1 layout
(Phase 1 spec §3.1).

| Package or app | What Phase 2 changes | Stream |
|---|---|---|
| `@websublime/line-core` | The `FormControl` mixin (§10 SD1), the controller start option and the run-time catch | F |
| `@websublime/line-components` | 15 components: 12 independent subpaths and 3 light-DOM families; the Zag machines and `@internationalized/date` as dependencies | C, P |
| `@websublime/line-genui` | `@a2ui/web_core` 0.16.1, the v1.0 `line` and `basic` catalogs, the surface on both protocol versions, the five form types, the surface form rule, the live write-back | G |
| `@websublime/line-icons` | No code change; `./a2ui` leaves preview at the phase exit with the renderer (`docs/ARCHITECTURE.md:1739`) | G, P |
| `line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils` | No Phase 2 change; the pending `patch` changesets of rows 01-Z30 and 01-Z31 ship on their own, and the phase-exit row takes each to `0.3.0` | P |
| `apps/storybook` | Stories of the 15 components, the `Patterns` section, the forms guide, Getting Started | C, D |
| `apps/site` | The `/theming/` route | S |
| `scripts/`, `.github/` | The per-machine size table, the derived CDN import map, Playwright 1.66 when it ships | P |

### 3.2 Layer edges

`lint-layers` keeps the Phase 1 `ALLOWED_EDGES` block unchanged (Phase 1 spec §3.3). The new dependencies are
third-party: the `@zag-js/*` machines and `@internationalized/date` in `line-components` (D22, D23; R8 §2.7). No
component imports another (MANIFESTO Law 4, `docs/MANIFESTO.md:45`; Phase 1 spec §10 SD4).

### 3.3 How the form pieces fit

A form-associated control has three layers. The host carries the form contract through `ElementInternals`. The machine
drives behaviour inside the shadow root. Any native input inside that shadow root has no form owner and never joins the
page's form (R1 §2.3, probe P1).

```
<form>                                    author's light DOM
 └─ <line-field>                          orchestrator: reads native events and validity,
     │                                    sets ARIA reflection properties on its control (D11, D12)
     ├─ <label slot="label">              author
     ├─ <line-password-input name="pw">   form-associated host: FormControl layer → ElementInternals
     │    └─ #shadow-root                 machine through LineMachineController (start after first render)
     │         └─ <input part="input">    role element; no form owner, never in FormData (R1 §2.3)
     └─ <span slot="error">               author, or the surface

 └─ <line-input>                          frame and state reflection; host shape per §10 SD6
      └─ <input name="email">             author's slotted control: the only form participant (D1)

 └─ <line-fieldset>                       reads, never writes (D19)
      └─ <fieldset disabled>              author's native fieldset: the disabled source (R9 §2.10 C)
```

- The layer holds the value, the default, the validity and the interaction state on the host, independent of the
  machine. In fallback the template's own native controls write through the layer, so the form keeps working when the
  machine does not (D5; R1 §2.10).
- Input and Textarea take the author's native control in light DOM, which participates natively before upgrade, after
  upgrade and without JavaScript (D1; MANIFESTO Law 8 `:53`; R7 §2.2, §2.3).
- Select, Radio Group and Toggle Group are light-DOM families. Their parts are elements the author writes inside the
  family host, so every ID reference stays in one tree (D6; ARCHITECTURE §12 `:595`; R4 §2.5).

---

## 4. Package Inventory & Exports

### 4.0 Ownership by file class

This table replaces the Phase 1 spec §4 table for Phase 2 work. PROCESS §4 points at "Phase 1 spec §4" today
(`docs/PROCESS.md:108`), and the ledger PR aligns that pointer (plan §4.0, §10 step 6). The rules of the Phase 1 table
carry over. Each P, C, G, D and S owner is the accountable supervisor (§6 Owner lines; plan §4.0), and Z rows name the
main session. When a task touches a class the table gives the other supervisor, the orchestrator dispatches that
supervisor on the same branch, one after the other. The second dispatch adds no changeset entry, and the accountable
supervisor writes the changeset entry last (PROCESS §4, §6). "wc" cites `.claude/agents/webcomponents-supervisor.md` and
"infra" cites `.claude/agents/infra-supervisor.md`, at their current lines.

| File class | Edited by | Evidence |
|---|---|---|
| `.github/workflows/*` and `.githooks/*` | infra-supervisor | infra:98-100 |
| `playwright.config.ts` and `bun-test-preload.ts` (closed list) | infra-supervisor | infra:104 ("Test harness plumbing") |
| Root `package.json` (scripts and `devDependencies`) and `bun.lock` | infra-supervisor | infra:97 ("Bun workspace topology, root scripts"); wc:112 escalates "workspace topology" |
| Per-package `package.json` build wiring: scripts, `dependencies` (each Zag machine and `@internationalized/date` included), `peerDependencies` (the SD76 widening included), `devDependencies`, `files`, `customElements`, and every `exports` entry the next row does not cover | infra-supervisor | infra:97 ("per-package `package.json` build wiring and `exports` maps") |
| An `exports` entry and its `vite.config.mjs` entry that a C or G row adds for the subpath it ships (the 15 component subpaths; G2's v1.0 catalog file in `line-genui`) | webcomponents-supervisor | Phase 1 spec §4 (AM-021 default): the entry exposes the source the row ships (wc:100-103) |
| Per-package build config other than the row above: `packages/*/vite.config.mjs`, `packages/*/tsconfig*.json`, `packages/*/custom-elements-manifest.config.mjs` | infra-supervisor | infra:97 (closest stated scope, as Phase 1 spec §4) |
| `apps/site` scaffold, deploy config and `apps/site/package.json` | infra-supervisor | infra:103 |
| `apps/storybook` build wiring (`.storybook/main.ts`, the wiring in `.storybook/preview.ts`, `apps/storybook/package.json`) | infra-supervisor | infra:104 ("Storybook build wiring") |
| `apps/site` page content, its client modules and its tests (`apps/site/__tests__/theming.e2e.ts` included) | webcomponents-supervisor | infra:107 ("docs content → `webcomponents-supervisor`"), as Phase 1 spec §4 |
| Storybook stories and MDX (the `Patterns` section, the forms guide and Getting Started included) | webcomponents-supervisor | wc:84, :106 |
| Package source `packages/*/src/` (the `FormControl` mixin, the controller, the components, `line-components/src/shared/*`, `line-genui/src/**`), CSS, every file under a package's `__tests__/` and under `apps/storybook/__tests__/` (the form fixtures, `cdn.e2e.ts` and `bundle-splitting.test.ts` included), package `README.md` | webcomponents-supervisor | wc:96-107; infra:107 |
| `biome.json`; generator scripts (`scripts/emit-catalog.mjs` included) | webcomponents-supervisor | wc:88, :96-97, :100-101, as Phase 1 spec §4 |
| `scripts/publish.mjs`, `.changeset/config.json`, `scripts/verify-peer-ranges.mjs`, `scripts/release-records.mjs` | infra-supervisor | infra:101 ("Changesets config and the release pipeline"); the last two run as workflow steps (infra:98) |
| `scripts/lint-layers.mjs`, `scripts/verify-pack.mjs`, `scripts/report-size.mjs` | infra-supervisor | infra:123; Phase 1 spec §4 (closest stated scope infra:98, :101) |
| `.npmrc`, `bunfig.toml`, `tsconfig.base.json`, `vite.config.shared.mjs` | infra-supervisor | infra:89, :97, :102 |
| Any other file, including the task's changeset entry and its `AM-nnn` rows | the accountable owner (the main session for Z rows) | No class above; both definitions name changeset entries (wc:107) |

### 4.1 `@websublime/line-core`

- **New module.** `src/form-control.ts` holds the `FormControl` mixin and its member types (§6.F.1; §10 SD1). The root
  `"."` entry re-exports them, as it re-exports `FormAssociated` (Phase 1 spec §6.C.2). No new subpath is added, so a
  jsDelivr `+esm` page resolves one copy of the layer and one `INTERNALS` Symbol (Phase 1 spec §7.7).
- **Changed module.** `src/machine/line-machine-controller.ts` gains the start option (§6.F.2) and the run-time catch
  (§6.F.3).
- **Comment fix.** `src/form-associated.ts:48` says "navigation or autofill". No engine ever restores for autofill
  (R2 §2.4, §6 Q10).
- **Manifest.** No `exports`, dependency or peer change. Zag stays at `^1.49.0` (D23).

### 4.2 `@websublime/line-components`

Subpaths follow the ARCHITECTURE §12 rule (`docs/ARCHITECTURE.md:578`). A sub-component that requires its parent shares
the family's subpath, and an independently usable component keeps its own (D6; R8 §2.2).

| Subpath | Registers | Kind | Tier and machine | Form participation |
|---|---|---|---|---|
| `./input` | `line-input` | independent | Custom, `createMachine` on `@zag-js/core` | the author's slotted `<input>` (D1); host per §10 SD6 |
| `./password-input` | `line-password-input` | independent | Custom (settled 2026-11-27) | form-associated, `FormControl` |
| `./search-input` | `line-search-input` | independent | Custom | form-associated, `FormControl` |
| `./date-input` | `line-date-input` | independent | Pre-built, `@zag-js/date-input` (D15) | form-associated, `FormControl` |
| `./textarea` | `line-textarea` | independent | Custom, with `@zag-js/auto-resize` | the author's slotted `<textarea>` (D1); host per §10 SD6 |
| `./field` | `line-field` | independent | Custom | none |
| `./fieldset` | `line-fieldset` | independent | Static | none; wraps the author's `<fieldset>` (D19) |
| `./checkbox` | `line-checkbox` | independent | Pre-built, `@zag-js/checkbox` | form-associated, `FormControl` |
| `./radio-group` | `line-radio-group`, `line-radio-group-item` (§10 SD13) | family | Pre-built, `@zag-js/radio-group` | form-associated host, `FormControl` |
| `./switch` | `line-switch` | independent | Pre-built, `@zag-js/switch` | form-associated, `FormControl` |
| `./select` | `line-select`, `line-select-trigger`, `line-select-content`, `line-select-item`, `line-select-group` (`docs/ARCHITECTURE.md:603`), plus any part tag the Select spec adds under the rule | family | Pre-built, `@zag-js/select` | form-associated host, `FormControl` |
| `./toggle-group` | `line-toggle-group`, `line-toggle-group-item` (§10 SD13) | family | Pre-built, `@zag-js/toggle-group` | form-associated host, `FormControl` |
| `./slider` | `line-slider` | independent | Pre-built, `@zag-js/slider` | form-associated, `FormControl` |
| `./number-input` | `line-number-input` | independent | Pre-built, `@zag-js/number-input` | form-associated, `FormControl` |
| `./editable` | `line-editable` | independent | Pre-built, `@zag-js/editable` | form-associated, `FormControl` |

- **Dependencies.** Each C row that ships a pre-built component adds its machine at `^1.49.0`: `@zag-js/checkbox`,
  `radio-group`, `switch`, `select`, `toggle-group`, `slider`, `number-input`, `editable` and `date-input`. C5 adds
  `@zag-js/auto-resize`. P2 adds `@internationalized/date` at `^3.12.4` before C4 (D22; R8 §6 item 8). Every bare
  specifier that line code imports is declared, or the Phase 1 "Undeclared bare specifiers" check fails (Phase 1 spec
  §7.5; R8 §2.7). `@zag-js/password-input` is not a dependency, because PasswordInput is Custom (`docs/PRD.md:281`).
- **Version policy.** Every `@zag-js/*` range in `line-core`, `line-components` and the root manifest is a caret on one
  version, `^1.49.0`. Each machine pins its Zag internals exactly, so a consumer tree with mixed Zag versions bundles two
  copies of `@zag-js/core` (R8 §2.4, probe 3.3). The docs tell consumers to keep every `@zag-js/*` package on one
  version (D23; §6.D.3).
- **Registration.** Each subpath adds its `EXPECTED_TAGS` row to `packages/line-components/__tests__/bundle-splitting.test.ts`;
  a family row lists all its tags. A family host that matches its parts by tag name adds an `ALLOWED_TAG_REFERENCES`
  row, as ButtonGroup did (Phase 1 spec AM-090; R8 §2.7).
- **No barrel.** The root `"."` stays minimal (ARCHITECTURE §12 `:616`).

### 4.3 `@websublime/line-genui`

- `@a2ui/web_core` moves from exactly `0.14.0` to exactly `0.16.1` through a Phase 1 spec AM in row G1 (§6.G.1; R6 §2.6,
  §4 item 12; Phase 1 spec §10 SD6).
- The v1.0 `line` catalog gets its own id and its own emitted file (§10 SD24; D25). `./catalog.json` keeps the v0.9.1
  `line` catalog unchanged.
- The peers `@websublime/line-components` and `@websublime/line-icons` read `workspace:^0.1.0 || ^0.2.0`
  (`packages/line-genui/package.json:37-40`). The first Phase 2 PR that adds a `minor` changeset for either package
  widens both to `workspace:^0.1.0 || ^0.2.0 || ^0.3.0` on `main` (Phase 1 spec §7.2, §10 SD76; §7.1).
- No new subpath beyond the v1.0 catalog file. `./a2ui` defines only `line-a2ui-surface` (Phase 1 spec §7.5).

### 4.4 `@websublime/line-icons`

No code change. `A2uiIconName` holds for v1.0, whose Icon enum keeps the same 59 names (R6 §2.5). Its `./a2ui` subpath
leaves preview with the renderer (`docs/ARCHITECTURE.md:1739`; §6.G.9).

---

## 5. Repository Layout

New and changed files, by the row that creates them. File classes follow §4.0.

| Path | Row | Owner |
|---|---|---|
| `packages/line-core/src/form-control.ts` (+) | F1 | webcomponents-supervisor |
| `packages/line-core/src/index.ts`, `src/form-associated.ts:48` | F1 | webcomponents-supervisor |
| `packages/line-core/__tests__/integration/form-control/` (+): the test element, its fixture pages and the `*.e2e.ts` proofs of plan §2.3 | F1 | webcomponents-supervisor |
| `packages/line-core/src/machine/line-machine-controller.ts` and its tests | F2, F3 | webcomponents-supervisor |
| `packages/line-components/src/<component>/` (+), one directory per subpath of §4.2 | C1–C15 | webcomponents-supervisor |
| `packages/line-components/src/shared/slotted-control.ts` (+): the adopted-control helper Input and Textarea share | C1 | webcomponents-supervisor |
| `packages/line-components/src/shared/focus-outside.ts` (+): the zag#3088 remedy (§10 SD15) | C11 | webcomponents-supervisor |
| `packages/line-components/__tests__/integration/<component>/`, `__tests__/a11y/<component>.e2e.ts`, `__tests__/visual/<component>.visual.ts` and baselines (+) | C1–C15 | webcomponents-supervisor |
| `packages/line-components/package.json` (`exports` keys) and `vite.config.mjs` entries | C1–C15 | webcomponents-supervisor |
| `packages/line-components/package.json` (`dependencies`), `bun.lock` | C rows, P2 | infra-supervisor |
| `packages/line-genui/src/catalog/descriptors/<component>.ts` (+) | C1–C15 | webcomponents-supervisor |
| `packages/line-genui/src/catalog/**`, `src/a2ui/**`, `__tests__/**` | G1–G9 | webcomponents-supervisor |
| `packages/line-genui/package.json` (`@a2ui/web_core` pin, peers, the v1.0 catalog export) | G1, G2, first `minor` PR | infra-supervisor; the v1.0 catalog `exports` key is webcomponents-supervisor (§4.0) |
| `scripts/report-size.mjs` | P1 | infra-supervisor |
| `packages/line-components/__tests__/cdn.e2e.ts` | P3 | webcomponents-supervisor |
| Root `package.json`, `bun.lock` (Playwright 1.66, `@axe-core/playwright`) | P4 | infra-supervisor |
| `apps/storybook/stories/components/<component>.stories.ts` (+) | C1–C15 | webcomponents-supervisor |
| `apps/storybook/stories/patterns/` (+), the forms guide MDX (+), `getting-started.mdx` | rows D1, D2, D3 | webcomponents-supervisor |
| `apps/site/src/pages/theming.astro` (+), its client module and site CSS, `apps/site/__tests__/theming.e2e.ts` (+) | S1 | webcomponents-supervisor |
| `docs/specs/0023-input.md` … `0037-editable.md` (+) | C1–C15, step 1 | the accountable owner |
| `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.2 rows | C1–C15 | the accountable owner |
| `docs/retrospective/02-phase-02-retro.md` (+) | Z1 | main session |

---

## 6. Implementation Detail Per Stream

### 6.0 Order

The ledger cuts one row per task below. Row ids are `<Stream><n>` inside the Phase 2 ledger and `02-<Stream><n>`
elsewhere (PROCESS §6). The order follows plan §6 as revised by O1 on 2026-11-27.

```
spec APPROVED
 ├─► F1 FormControl mixin
 ├─► F2 controller start option ─► F3 run-time catch (probe gate)
 ├─► G1 web_core 0.16.1 ─► G2 v1.0 catalogs and session ─► G6 v1.0 Text headings
 │                   └─► G3 live write-back · G4 surface form rule · G5 agent Button checks
 └─► P1 per-machine size table · P2 @internationalized/date · P3 derived CDN import map
          ▼
first wave: C2 PasswordInput, C6 Field, C8 Checkbox (validating set) + C1 Input   (Phase 1 P17 before the C1 spec)
          ▼
G7 TextField and CheckBox on both protocol versions
          ▼
the other 11: C3 C4 C5 C7 C9 C10 C11 C12 C13 C14 C15   (C5 after C1; C4 after P2; Phase 1 P17 before the C11 spec)
          ▼
G8 ChoicePicker, Slider, DateTimeInput · S1 showcase (after C9–C13) · rows D1 (after C1, C6), D2, D3
          ▼
G9 preview exit · P5 phase-exit minors ─► phase-exit Version PR ─► Z1 exit and retrospective
Phase 1 D5 ─► first Phase 2 Version PR          P4 Playwright 1.66, when it ships, lifts the Firefox axe skip (§7.6)
```

| Step | Rows | Gate |
|---|---|---|
| 1 | F1, F2, G1, P1, P2, P3 | Spec APPROVED, every §10 row approved. F1 and F2 touch different `line-core` files and may run on parallel branches (PROCESS §4) |
| 2 | F3, G2–G6 | F3 after F2 (same file). G2–G5 after G1; G6 after G2 |
| 3 | C1, C2, C6, C8 | F1, F2, F3 and G2 merged. Each ships its descriptor in the same PR, on both protocol versions (plan §2.4; PRD §7.3). C1's spec after Phase 1 row P17 (plan §1.2) |
| 4 | G7 | C1, C2, C6, C8, G3, G4, G5 merged |
| 5 | C3, C4, C5, C7, C9–C15 | G7 merged (plan §6). C4 after P2; C5 after C1; C9's spec after its probe gate (§6.C.2); C11's spec after Phase 1 row P17 |
| 6 | G8, S1, rows D1, D2, D3 | G8 after C4, C7, C9, C11, C12, C13; S1 after C9–C13 (D31); row D1 after C1 and C6; row D2 after C1, C5, C6, C7, C11 and G7; row D3 after Phase 1 row D5 and step 3 |
| 7 | G9, P5, Z1 | G9 after every G and agent-exposed C row; P5 after every other row; Z1 after P5's Version PR merges |

- The O4 (c) dependency baseline that plan §6 puts first landed in Phase 1 row 01-Z14: the lock resolves Zag 1.49.0,
  Playwright 1.65.1 and Changesets 3 (R1 §2.1; Phase 1 spec §10 SD77). No Phase 2 row repeats it.
- Phase 1 row D5 lands before the first Phase 2 Version PR (plan §1.2, §6).

### 6.F Stream F — Form foundation (`line-core`)

#### 6.F.1 F1 — The `FormControl` mixin

- **Owner:** webcomponents-supervisor (plan §4.0). File classes follow §4.0.
- **Deps:** spec APPROVED. Blocks every form-associated C row (C2–C4, C8–C15), and C1, C5, C6 and C7, whose tests use
  its test element.
- **Changes**
  - `packages/line-core/src/form-control.ts` (+): the `FormControl` mixin, applied over `FormAssociated(LineElement)`
    (§10 SD1). It implements `formResetCallback`, `formDisabledCallback` and `formStateRestoreCallback`, the value
    model of §10 SD2, validity (§10 SD3), the `user-invalid` state (§10 SD4), implicit submission (§10 SD5), the
    `ariaLabelledByElements` and `ariaDescribedByElements` overrides, and the `line-validity-change` event (§10 SD7).
    A component supplies hooks: its value-to-form-value conversion, its constraint set, its role element, the
    validation anchor and the machine setter that a reset calls.
  - `packages/line-core/src/index.ts`: re-exports the mixin and its types (§4.1).
  - `packages/line-core/src/form-associated.ts:48`: the restore callback comment names navigation only (R2 §2.4, §5 C6).
  - `packages/line-core/__tests__/integration/form-control/` (+): a form-associated test element with an inner native
    `<input>`, and the Browser-tier proofs below.
  - A `line-core` `minor` changeset, which is `line-core`'s first Phase 2 `minor` and releases it as `0.3.0` (§7.1).

**Contract**

*Value and default (§10 SD2).*

- The `value` attribute, or `checked` on a checkable control, is the default value, as on native controls. The
  `value` property is the current value. `defaultValue`, or `defaultChecked`, reflects the attribute.
- A user edit or a property write makes the control dirty. While it is not dirty, a change of the attribute moves the
  current value. A reset clears the dirty flag and returns to the attribute.
- Every public input is JSON-serialisable (ARCHITECTURE §17.2 rule C1 `:1631`). A machine type such as Zag's `DateValue`
  is converted at the host boundary (R5 §2.3).

*Form value.*

- The layer MUST call `setFormValue` at connect with the value derived from the default, because no machine reports
  its default through its change callback (R1 §2.4, probe P5; R5 §2.3).
- It MUST call `setFormValue` on every value change, whatever the source: a user edit, a property or attribute write,
  a reset, a restore, or an agent through the surface.
- A multi-value control submits a `FormData` with one entry per value under its `name`. With no `name` it submits
  `null`, because a list of entries skips the name check (R1 §2.9, probes P4 and P11; R1 §5 item 3).
- A number submits `String(valueAsNumber)`, never the locale-formatted display (ARCHITECTURE §16.2 `:1499`; R1 §2.8).
- A date, a date-time or a time submits the HTML normalized string a native `<input type="date">`,
  `type="datetime-local"` or `type="time"` submits at the same granularity, so a field without date parts submits no
  date (D18; R5 §4 item 2; §10 SD25).
- A native input inside the component's shadow root never joins the page's form, because its form owner is looked up
  in its own tree (R1 §2.3, probe P1). It MAY keep a `name` the machine needs, such as Zag's radio grouping, and MUST
  NOT carry a `form` attribute (R1 §5 item 3).

*Disabled.*

- The effective disabled state is the host's own `disabled` or the last `formDisabledCallback(true)` (R9 §6 Q4).
- The layer reflects it as `data-disabled` and `:state(disabled)` (ARCHITECTURE §14.8). It MUST NOT write the host's
  `disabled` attribute from `formDisabledCallback`, which would override an ancestor fieldset (R9 §6 Q4,
  whatwg/html#8365).
- The layer folds the state into the machine's `disabled` prop, never into `CONTEXT.SET fieldsetDisabled`, which
  leaves the hidden input enabled (R1 §2.4, §5 item 4).
- The component disables every native control in its shadow root while disabled, the inner text input and any hidden
  machine input included. A disabled host that delegates focus to an enabled inner input still takes focus and typing
  (R9 §2.4, probe P5).
- Zag's own `trackFieldsetDisabled` stays inert, because `closest('fieldset')` finds nothing from inside the shadow
  root (R1 §2.4; R9 §2.8). No component template puts a `<fieldset>` above a machine input in its shadow root, which
  would wake that tracking with its 1.49.0 defects.

*Reset (R2 §4 item 3).*

- `formResetCallback` restores the default value, the inner control, the machine context through the machine's setter
  (R1 §2.4: `setChecked` or `setValue`), the submission value and the validity. It clears the dirty flag and the
  `user-invalid` state.
- The platform resets nothing inside a shadow root, so the layer owns all of it (R2 §2.3).

*Restore (R2 §4 item 4).*

- The saved state is a string, or a `FormData` of string entries for a multi-value control, stamped with the host's
  `localName` and `name`. `formStateRestoreCallback` ignores a state stamped for another element, so the Firefox
  misroute leaves the control at its default instead of corrupting it (R2 §2.4).
- The callback always calls `setFormValue` itself, because Chromium and Firefox restore the submission value and WebKit
  does not (R2 §2.4).
- It accepts a restore that arrives after the first render, and in Chromium after `load` (R2 §2.4).
- It never saves `File` state (R2 §2.4).
- A component whose native counterpart restores nothing saves no state; §6.C.2 names PasswordInput's gate.

*Validity (§10 SD3).*

- `required`, `pattern`, `minlength` and the other constraint attributes on a host do nothing by themselves (R2 §2.1;
  ARCHITECTURE §7 `:417`). The layer computes the flags of the constraint set the component declares, merges
  `custom-validity` as `customError` (rule C4; the Button convention, `packages/line-components/src/button/button.ts:106`),
  and calls `setValidity` once per change.
- `pattern` compiles as `^(?:…)$` with the `v` flag, as HTML compiles it (R2 §2.1, probe 3.7).
- The anchor is the component's role element once it has rendered. Before that the layer passes none, because an
  anchor that is not a shadow-including descendant throws `NotFoundError`. The layer sets validity again when a render
  replaces the anchor (R2 §2.1, anchor table).
- No flag is raised with an empty message, which throws `TypeError` (R2 §2.1).
- A `readonly` host is barred from constraint validation by the platform (R2 §2.1).

*The `user-invalid` state (§10 SD4).*

- The layer reflects `data-user-invalid` and `:state(user-invalid)` while the control is invalid and has been
  interacted with. Consumers never need `:user-invalid`, which Chromium and WebKit never match on a form-associated
  host and Firefox matches from load (R2 §2.2).

*Implicit submission (§10 SD5).* The layer runs the HTML implicit-submission algorithm for the components §10 SD5
lists. That emulation is native semantics under MANIFESTO Law 7 (`:51`; D3). A control with no form owner, such as one
the surface detaches, has no form to submit (R6 §2.4).

*Field hooks.*

- The host exposes `required`, `readOnly`, `disabled` and `value` as properties with the native names, so Field reads
  native and line controls the same way. Field reads `:disabled` on both (R3 §2.6, §7 Q8).
- The host overrides `ariaLabelledByElements` and `ariaDescribedByElements` and forwards both to its role element
  (D12; ARCHITECTURE §9 `:511`, §17.2 rule C5 `:1635`). The component's rendering, Lit or Zag `spreadProps`, never writes
  `aria-labelledby` or `aria-describedby` on that element, and never leaves those keys in the spread props as
  `undefined`. Writing or removing the attribute clears the reflected elements, and `spreadProps` removes an `undefined`
  key on every spread after the first (R3 §2.3).

*Events.*

- The host fires `line-change` on commit and `line-input` on each live edit, each with a typed `detail.value`
  (ARCHITECTURE §17.2 rules C3 and C9). Both bubble and are not composed, as Button's and Chip's `line-change` are
  (`button.ts:87`; `packages/line-components/src/chip/chip.ts:71`). Field listens on itself, an ancestor in the same
  tree, so bubbling reaches it.
- Both fire only for a user-driven change, never for a property or attribute write, as Chip's does (`chip.ts:71`).
- `line-validity-change` (§10 SD7) is the one event that fires for any source.
- The component dispatches no unprefixed `input` or `change`. Trusted `input` and `beforeinput` from an inner native
  control cross the shadow boundary and pass, and each component spec documents them (D10; ARCHITECTURE §17.2 rule C3
  `:1633`; R1 §2.5).

*Independence from the machine.* The value, the default, the dirty flag, the validity and the interaction state live
on the host. A machine is a driver of the value, never its store. In fallback the component's template wires its own
native controls to the layer, so reset, restore, disabled and validity keep working (D5; R1 §2.10, §5 item 10).

**Acceptance**

Each item runs in the Browser tier in Chromium, Firefox and WebKit, on the F1 test element, never only on happy-dom,
which fakes `attachInternals` (plan §5.3; Phase 1 spec §7.8). A WebKit claim holds once the CI run on `ubuntu-latest`
passes (`.github/workflows/checks.yml:9`, `:47`; R2 §6 Q11).

- The value reaches `FormData` and the request a `<form>` sends, under its `name`; the default reaches it with no
  interaction; a multi-value element submits repeated entries, and `null` without a `name`.
- `form.reset()` returns to the default, and a reset button does so after a microtask (R2 §2.3).
- Constraint validation for `required`, `pattern` (with a `v`-flag class), `minlength`, `min`, `max` and `step`, and
  for `custom-validity`: `checkValidity()`, `reportValidity()`, `:invalid` and `:valid`, a blocked submission, and focus
  on the anchor.
- The `form` attribute associates the element with a form it is not inside.
- A native `<fieldset disabled>` ancestor disables the element: `:disabled` matches, `focus()` is refused, the value
  leaves `FormData` and the request, and the element is barred from validation (R9 §6 Q9). Playwright's
  `toBeDisabled()` does not see a form-associated element's state, so the tests assert those four facts instead
  (R9 §3.6). C7 adds the case of a native fieldset inside `<line-fieldset>`.
- Restore on a back navigation in three engines. The test also runs the Firefox misroute variant, two elements whose
  definitions run against tree order, and asserts that neither shows the other's value (R2 §2.4, §6 Q5). Restore on
  reload is not asserted, because only Firefox restores there.
- The `user-invalid` state follows §10 SD4: absent at load, present after a user edit and `focusout` while invalid,
  present after a blocked submission, cleared by a reset.
- Implicit submission follows §10 SD5: Enter in the inner input clicks an enabled default button and submits its
  `name=value`; a disabled default button submits nothing; with no submit button the blocking-field count decides.
- `line-validity-change` fires when `custom-validity` changes with no user event.
- The reflection hand-off names the inner input in three engines, and its description in Chromium, through the
  Chromium CDP tree (§7.3).

#### 6.F.2 F2 — The controller start option (D8)

- **Owner:** webcomponents-supervisor. **Deps:** spec APPROVED. Blocks F3 and every machine C row.
- **Changes**
  - `packages/line-core/src/machine/line-machine-controller.ts`: `LineMachineControllerOptions` gains a `start` option,
    `'connected'` (the default) or `'first-update'`. Under `'first-update'` the controller constructs and starts the
    machine in the first `hostUpdated` after each `hostConnected`, as the R1 probe-only controller did (R1 §2.2).
  - The module comment (`:24-25`) and the `props` JSDoc say when scope is read for each option.
  - Controller tests under `packages/line-core/__tests__/`.

**Contract**

- Every Phase 2 machine component sets `start: 'first-update'`. Phase 1 components keep the default, which Z1 revisits
  at the phase exit (D8; ARCHITECTURE §6 `:387`; Phase 1 spec §10 SD29, AM-123).
- A component that opts in MUST render every part with its final `id` and `role` in its first render. R1 saw the later
  start fix the slider thumb and the checkbox press tracking only under that condition (R1 §2.2).
- Every Phase 2 props function MUST include `id` and `getRootNode: () => this.renderRoot`. Without them the checkbox
  loses its label link and the slider ignores pointer input, silently (R1 §2.2, probes P5 and P12; §5 item 1).
- A component whose machine scope is its own shadow root uses a constant `id`. A light-DOM family, whose scope is the
  host's root node, uses an `id` unique in that root, because its parts are found by id there (R1 §2.9, §5 item 1).
- A component never changes `id` or `getRootNode` after start, because Zag reads `scope` once (Phase 1 spec §6.C.7).

**Acceptance**

- A fixture machine whose start effect queries the shadow root finds its parts under `'first-update'` and finds none
  under `'connected'`, in three engines.
- A disconnected and reconnected host restarts its machine and binds its start effects again.
- Every Phase 1 test passes unchanged.

#### 6.F.3 F3 — The run-time catch (D5), behind a probe gate

- **Owner:** webcomponents-supervisor. **Deps:** F2. Blocks every machine C row (plan §8, run-time catch row).
- **Probe first.** The controller catches errors only while it constructs, subscribes and starts the machine
  (`line-machine-controller.ts:30-34`). Zag runs actions in a microtask of `send`, outside that `try`, so a run-time
  action error is an uncaught page error, the controller stays out of fallback, and the form value and the visible
  state disagree (R1 §2.10, probe P6). ARCHITECTURE §6 marks the run-time catch unprobed (`:389`). The row's first
  commit records a probe in Chromium, Firefox, macOS WebKit and Linux WebKit that answers where the catch can sit.
  Candidate sites, all `[INFERENCE: not probed]`:
  - wrap each implementation function of the machine config (actions, guards, effects, computed) before the controller
    constructs `VanillaMachine`, so the wrapper runs inside the microtask;
  - wrap `send`, `updateProps` and the subscription callback, which catches only their synchronous part.
- **Gate.** The probe passes when R1's P6 scenario, a `setChecked` action that throws at run time, raises no uncaught
  error, flips the controller to fallback, and leaves the form value equal to what the fallback shows. If no site
  catches run-time errors without patching Zag, the row stops and returns to Miguel, because PRD §1.7
  (`docs/PRD.md:175`) and ARCHITECTURE §6 (`:389`) promise the catch.

**Contract (after the gate passes)**

- On a caught start or run-time error the controller logs one `console.error`, stops the machine, flips `fallback`
  and requests an update. No error reaches the consumer (MANIFESTO Law 9 `:55`).
- The layer keeps the form value. The fallback template wires its native controls to the layer (§6.C.1).
- The `[INFERENCE]` marks at ARCHITECTURE `:389` and PRD `:175` leave in the document change that follows the gate
  (§11.2).

**Acceptance**

- R1's P5 start-failure case and P6 run-time case, on the F1 test element with a machine, in three engines and in CI.

### 6.C Stream C — The 15 components

#### 6.C.0 Rows

Row numbers follow the PRD §7.4 table (`docs/PRD.md:957-973`); the execution order is §6.0.

| Task | Component | Spec | Deps (beyond step gates) | `agentExposed` expected | htmx row expected |
|---|---|---|---|---|---|
| C1 | Input | `0023-input.md` | F2, F3, G2; Phase 1 P17 before the spec | `true` | harness, path (a) through the slotted control |
| C2 | PasswordInput | `0024-password-input.md` | F1–F3, G2 | `true` | harness, path (a) |
| C3 | SearchInput | `0025-search-input.md` | F1–F3, G7 | `true` | harness, path (a) |
| C4 | DateInput | `0026-date-input.md` | F1–F3, G7, P2 | `true` | harness, path (a) |
| C5 | Textarea | `0027-textarea.md` | C1, F2, F3, G7 | `true` | harness, path (a) through the slotted control |
| C6 | Field | `0028-field.md` | F1–F3, G2 | `true` | `n/a` expected: neither value-bearing nor compound |
| C7 | Fieldset | `0029-fieldset.md` | F1, G7 | `true` | `n/a` expected: neither value-bearing nor compound |
| C8 | Checkbox | `0030-checkbox.md` | F1–F3, G2 | `true` | harness, path (a) |
| C9 | Radio Group | `0031-radio-group.md` | F1–F3, G7; the item-shape gate before the spec | `true` | harness, path (a) |
| C10 | Switch | `0032-switch.md` | F1–F3, G7 | `true` | harness, path (a) |
| C11 | Select | `0033-select.md` | F1–F3, G7; Phase 1 P17 before the spec | `true` | harness, path (a) |
| C12 | Toggle Group | `0034-toggle-group.md` | F1–F3, G7 | `true` | harness, path (a) |
| C13 | Slider | `0035-slider.md` | F1–F3, G7 | `true` | harness, path (a) |
| C14 | Number Input | `0036-number-input.md` | F1–F3, G7 | `true` | harness, path (a) |
| C15 | Editable | `0037-editable.md` | F1–F3, G7 | `true` | harness, path (a) |

- `agentExposed` defaults to `true` (ARCHITECTURE §17.3 `:1651`). Each component spec confirms the column or sets
  `false` with a reason (Phase 1 spec §10 SD38).
- The htmx column is a drafting expectation that each component spec confirms or overturns (Phase 1 spec §10 SD34).
  Every value-bearing or compound row runs the four PRD Appendix A behaviours, path (a) included for each form
  participant (plan §7.1).

#### 6.C.1 Rules for every Phase 2 form control

These rules cover every Phase 2 control and every later control that joins the set (plan §5.3 lesson 1).

*Machine scope and start.*

- Every machine component follows §6.F.2: `start: 'first-update'`, `id` and `getRootNode` in its props, final ids and
  roles in the first render.
- Each machine row measures its host update rate on the Phase 1 signal with `measureHostUpdates` and records it in its
  PR; a row past the Phase 1 budget stops and returns to the orchestrator (Phase 1 spec §6.C.1, §10 SD18).

*Hidden machine inputs.* A machine input that is not the component's focus and accessible node (Slider's hidden text
input, Select's hidden `<select>`, DateInput's hidden input) carries no `name` and no `form` attribute, because it has
no form owner anyway (R1 §2.3; ARCHITECTURE §15.1 `:1390`). Whether the component renders it at all is the component
spec's choice, after a probe in three engines that the machine works without it.

*Role element and labelling.*

- A control's role sits on a native element wherever one can carry it: Zag's hidden input for Checkbox, Switch and
  Radio (D9; ARCHITECTURE §15.1 `:1389`), the inner text input for the text controls, and the author's control for Input
  and Textarea. No control takes its role from `ElementInternals` when a native element can carry it (Phase 1 spec §10
  SD31; R3 §2.2 F3, F5c; §7 Q10).
- A family part that is itself the focus target, such as `line-select-trigger`, carries its role as an attribute on its
  own host, the shape R4 probe P7 proved in four engine builds. Its component spec states it and proves it with the §7.3
  assertions.
- A control whose name comes from its content slots its label text. Unslotted text is not rendered, no engine includes
  it in the name, and Playwright 1.65 drops it (R3 §2.4, F14; §7 Q12).
- A control with a Zag label part does not let Zag write `aria-labelledby` on the role element (D12). The component
  names its role element through element reflection, from its own label part in its shadow root and from the references
  Field forwards. The component spec states how the two combine and proves the name in three engines (R3 §7 Q2).
- Reference target is not adopted in Phase 2. It is Chromium-only and outside the PRD browser target, and it would not
  forward the host's own attributes anyway (R3 §2.1, F4b; `docs/PRD.md:167`). The trigger to revisit is Firefox bug
  1952585 and a WebKit implementation (R3 §7 Q9).

*Composition.* A line form control is never rendered inside another component's shadow root. A form-associated element
in another element's shadow root joins no outer form and is never restored (R2 §2.4, §6 Q8). Field and Fieldset slot
their controls, and the surface renders light DOM (ARCHITECTURE §17.4 `:1695`).

*Light-DOM families (Select, Radio Group, Toggle Group).*

- The family host runs the machine with its scope on the host's own root node, so Zag finds the parts the author wrote
  (R1 §2.9, probe P11; R4 §2.5, probe P7).
- Which element applies which machine props follows §10 SD12. Every write on a `line-*` child is a documented hook in
  the component spec (MANIFESTO Law 5 `:47`; ARCHITECTURE §6 `:393`).
- Item content enters through slots, so a swatch or an icon can sit in an item (MANIFESTO Law 4; R10 §2.2).

*Internal parts.* An internal part that coordinates with the machine, such as a toggle, a clear button or a stepper, is
a part and not a slot (PRD §7.4 `:975`; ARCHITECTURE §13.3 `:643-644`). Its accessible name follows §10 SD10. DateInput's
segment labels come from `Intl.DisplayNames` through the machine, and its placeholders from the machine's locale table
with the `translations` override, which is dependency locale data the consumer can override (R5 §2.5; MANIFESTO Out of
Scope `:66`; D7).

*Size.* §10 SD11 aligns the single-line controls with Button by default.

*Fallback.* Every form control has a static fallback template for a machine that fails to start or run (MANIFESTO
Law 9; D5). The template renders native controls inside the shadow root that write through the layer, because they
have no form owner of their own (R1 §2.10). Each component spec names its template and what it submits (plan §5.5).
Where the template renders a `<select>` or a range input, the component imports `reset.select.css` or
`reset.range.css`, the `fallback` sheets of ARCHITECTURE §14.7 (`:1191`, `:1193`, `:1209`; D20). Input and Textarea
need none, because their author's control keeps working (R7 §2.3).

*RTL, touch and pointer.* Every machine takes `dir: this.direction` from `DirectionMixin` (R1 §2.11). The pre-built
machines mirror arrow keys and pointer input under `dir="rtl"` and take touch through Pointer Events in four engine
builds (R1 §2.11, §2.12, probes P11–P15). No custom Phase 2 machine existed for R1 to probe (R1 §2.11, §2.12), so each
custom row (C1, C2, C3, C5, C6) proves RTL caret and arrow behaviour and touch input in three engines before its claim
holds. Touch claims rest on Playwright emulation; real-device checks follow Miguel's policy (plan §10.1).

*Re-render under the pointer.* A render never replaces the text node of an element under the pointer between
`pointerdown` and `pointerup`, because WebKit then drops the click, on macOS and on Linux. In R4's Select only Linux
WebKit's focus on mousedown triggered such a render (R4 §2.7, probe P9; R1 §2.12, P17). Lit commits text by setting
`.data`, which keeps the node.

*DOM writes on author content.* Every write a Phase 2 component makes outside its own tree is one MANIFESTO Law 5
(`:47`) allows; §7.7 lists them.

#### 6.C.2 Per-component contracts and gates

Each block fixes what this spec settles for the component and names the probe gates its component spec must pass
before it is APPROVED. Gates marked "before approval" block the spec; the others are acceptance items of the row.

**C1 Input** (Custom; ARCHITECTURE §13.3 `:642`)

- Anatomy: a `root` part framing a `prefix` slot, the default slot for the author's `<input>`, and a `suffix` slot.
  No `::part(input)`; consumer CSS styles the author's element directly (MANIFESTO Law 1 `:39`; ARCHITECTURE §15.1
  `:1374`).
- Form: the slotted `<input>` is the only form participant, before upgrade, after it and without JavaScript (D1;
  R7 §2.2, §2.3 "adopt"). The host shape follows §10 SD6. `custom-validity` (rule C4) calls `setCustomValidity()` on the
  slotted control, and the host reflects `data-invalid` and `:state(invalid)` from that control's validity
  (ARCHITECTURE §17.2 rule C4 `:1634`). `value` reads and writes the slotted control's `value` (Law 5).
- Field: Field's references reach the slotted control through the host's forwarding overrides (ARCHITECTURE §9
  `:511`).
- Events: `line-input` and `line-change` from the slotted control's `input` and `change`. The native `input` and
  `change` bubble from the light-DOM control as they always do; the component dispatches neither (rule C3).
- Implicit submission, autofill, IME and restore are the native control's own (ARCHITECTURE §15.1 `:1370`).
- Shared code: the adopted-control logic lives in `packages/line-components/src/shared/slotted-control.ts`, which C5
  reuses, as Button's machine lives in `src/shared/` (Phase 1 spec AM-002).
- Gates:
  - The R1 and R2 probes run on the slotted-native anatomy: restore on back navigation, reset, the `form` attribute,
    fieldset disabling and implicit submission, before and after upgrade, in three engines (R7 §7 Q12; plan §7.1).
  - The §10 SD6 host shape: a host with no form value adds no `FormData` entry and does not change `checkValidity()`;
    under SD6 (b), its `formResetCallback` runs after the slotted control has reset `[INFERENCE: not probed]`.
  - Autofill detection holds in Firefox and WebKit before the component claims it there; it was observed in Chromium
    only (`docs/PRD.md:280`; ARCHITECTURE §15.3 `:1432`; R2 §2.6). The shadow `reset.input.css` trick does not reach a
    slotted input, so the row proves whatever replaces it.

**C2 PasswordInput** (Custom, settled 2026-11-27; `docs/PRD.md:281`; ARCHITECTURE §8 `:440`)

- Anatomy: an inner `<input type="password">` that the visibility state switches to `type="text"`, and a `toggle`
  part (ARCHITECTURE §13.3 `:643`; §15.1 `:1380`). The custom machine holds the visibility (R1 §2.3).
- Form: `FormControl`. Constraints: `required`, `minlength`, `maxlength`, `pattern`. Implicit submission runs
  (§10 SD5). `name` and `autocomplete` are forwarded to the inner input, which a password manager may need and which
  does not put that input in the form (ARCHITECTURE §16.2 `:1547`; R2 §4 item 6).
- The visibility returns to hidden on the layer's reset and on a `submit` of the host's form owner, which Zag did
  through `input.form` and which a shadow root disables (R1 §2.3, §7 Q10). A form-associated element gets no submit
  callback, so the host listens on its form owner `[INFERENCE: not probed]`.
- Gates:
  - The submit listener hides the password before the request leaves, in three engines.
  - Restore matches a native `<input type="password">` in the same engine, which the row probes first `[INFERENCE:
    native password restore was not probed]` (§6.F.1 Restore; §11.1 Q3).
  - Password managers and Safari AutoFill stay best effort with no automated claim (ARCHITECTURE §16.3; R2 §6 Q12). A
    manual check per release is Miguel's decision (plan §10.1).

**C3 SearchInput** (Custom; ARCHITECTURE §13.3 `:644`)

- Anatomy: an inner `<input>` and a `clear` part that sends `CLEAR` to the machine; `reset.input.css` neutralises the
  WebKit search decorations (ARCHITECTURE §14.7 `:1187`).
- Form: `FormControl`; implicit submission runs (§10 SD5).
- Gate: the clear part's keyboard path and name follow §10 SD10.

**C4 DateInput** (Pre-built, `@zag-js/date-input` 1.49.0; D15; ARCHITECTURE §13.3 `:645`)

- Anatomy: a `role="group"` of `<span contenteditable role="spinbutton">` segments in the shadow root (R5 §2.2;
  ARCHITECTURE §16.2 `:1483`).
- Form: `FormControl`. The value is the HTML normalized string of §6.F.1, empty while any segment is incomplete, as a
  native date input is, instead of Zag's last committed value (R5 §2.3 `staleClear`, §4 item 2). The host seeds its
  default at connect.
- Validity: `min` and `max` stay out of the machine, so Zag's silent clamp on blur never rewrites a value; the layer
  computes `rangeUnderflow` and `rangeOverflow`, and `badInput` for a partial entry (R5 §2.3, §4 item 2). Zag compares
  dates only, so the component compares a time bound itself (R5 §2.6). The segments or the group carry
  `aria-required` (R5 §4 item 2).
- Time-only mode (D18): `granularity` and a custom `formatter` give hour and minute segments on 1.49.0, and the value
  carries no date (R5 §2.5).
- Digits and IME: a `beforeinput` handler ahead of Zag's normalises full-width and locale digits to ASCII, and the
  component restores the segment text after `insertCompositionText` (R5 §2.5, §4 item 3).
- `createCalendar` stays opt-in, so the Gregorian default bundle does not carry the 3,876 B of non-Gregorian calendars
  (R5 §2.4, §4 item 9). The opt-in mechanism is the component spec's.
- Gates:
  - The live-region move (before approval): `@zag-js/date-input` appends a `role="alert"` region per instance to
    `document.body`, with no `root` option (R5 §2.2). DateInput moves that region into its own shadow root right after
    the machine starts, and the probe shows announcements still reach assistive technology in three engines
    `[INFERENCE: unprobed]` (ARCHITECTURE §6 `:396`, §13.3 `:645`). A failed probe returns to Miguel (plan §8).
  - The time-only value has no date in `FormData` or in `line-change`, in three engines; the R5 probe committed today's
    date through `onValueChange` (R5 §2.5).
  - The digit normaliser and the composition restore in Chromium (CDP composition) and Firefox; WebKit composition
    cannot be driven and stays a recorded gap (R5 §2.5).
  - "Empty": the machine announces a fixed English "Empty" with no translation hook (R5 §2.5). §11.1 Q1 asks Miguel
    how that string meets MANIFESTO Out of Scope (`:66`).
  - The static fallback (R5 §6 Q13): a native `<input type="date">` would bring back the picker icon and popup that
    ARCHITECTURE §16.2 rules out (`:1481-1491`). The component spec proposes a template; a template that needs a native
    date input returns to Miguel.
  - An iOS VoiceOver pass is Miguel's decision (plan §10.1).

**C5 Textarea** (Custom, with `@zag-js/auto-resize`; ARCHITECTURE §13.3 `:646`)

- Anatomy, form, Field and events as C1, through `src/shared/slotted-control.ts`. Auto-resize sets the height of the
  adopted `<textarea>`, which Law 5 allows (ARCHITECTURE §6 `:391`). Native resize stays on by default (ARCHITECTURE
  §16.2 `:1571`). Enter inserts a newline, as a native textarea does.
- Gate: as C1.

**C6 Field** (Custom; ARCHITECTURE §9 `:498-522`; D11–D13)

- Anatomy: slots `label`, default, `hint` and `error`; parts `root` and `indicator` for the required indicator
  (ARCHITECTURE §9 `:502`, `:513`). Not form-associated.
- State: explicit props first, then native events and a re-read of `control.validity` for any control, then
  `line-validity-change` from a line control (ARCHITECTURE §9 `:506-509`). It reflects `data-focused`, `data-filled`,
  `data-error`, `data-disabled`, `data-readonly` and `data-required`.
- `data-error` is the shown error, which is the explicit `error` (§10 SD8) or the control's interaction state. Field reads
  `:state(user-invalid)` on a line control and `:user-invalid` on a native control. It never reads `:user-invalid` on a
  custom element, which Firefox matches from load (R2 §2.2; §10 SD4).
- Disabled: §10 SD9.
- Labelling: Field sets `control.ariaLabelledByElements` to the slotted label and `control.ariaDescribedByElements` to
  the hint and, while the error is shown, the error. It removes the error from the list when hidden, because a hidden
  element that stays referenced is still read (R3 §2.3, F15; §5 item 3).
- Label activation: Field never writes `for` on the author's `<label>`, because MANIFESTO Law 5 gives an orchestrator
  ARIA reflection properties only (`:47`; ARCHITECTURE §6 `:392`). An author `<label for>` works natively, because it
  focuses a form-associated host's inner input through `delegatesFocus` and toggles a checkbox (R3 §2.2). It also names the
  `generic` host in Chromium and Firefox, a cost the author accepts with it (R3 F13). Field forwards a click on any
  other label content to `control.focus()` (ARCHITECTURE §9 `:517`).
- The floating label is not built in; `data-focused` and `data-filled` enable it in CSS, and row D1 documents it
  (ARCHITECTURE §9 `:515`).
- Gates: Field around a native `<input>`, a native `<select>` and the F1 test element proves the state priorities,
  the hand-off and the hidden-error removal in three engines (R3 §2.6); its Firefox axe scan is skipped until P4
  (§7.6).

**C7 Fieldset** (Static; D19; ARCHITECTURE §15.1 `:1372`)

- Anatomy: a `root` frame around a default slot that holds the author's `<fieldset>` and its `<legend>`.
  `<line-fieldset>` reads the fieldset and never writes it; it reflects `data-disabled` from it. Not form-associated.
- The native fieldset disables every descendant native control and form-associated element, nested fieldsets and the
  first-legend exemption included (R9 §2.3, §2.5). Non-form-associated line components stay enabled, as under any
  native fieldset (Phase 1 spec §10 SD36; R9 §6 Q3).
- Reset sheet: the fieldset and legend rules of `reset.fieldset.css` apply to the slotted fieldset through
  `::slotted(fieldset)`; a legend, which is not a slotted element, takes consumer CSS (ARCHITECTURE §14.7 `:1209`;
  R9 §6 Q2).
- Gates: `::slotted(fieldset)` neutralises the fieldset in three engines `[INFERENCE: not probed]`; the §6.F.1
  disabled assertions pass for a native fieldset inside `<line-fieldset>` (plan §7.1).

**C8 Checkbox** (Pre-built, `@zag-js/checkbox` 1.49.0)

- Zag's visually hidden `<input type="checkbox">` is the focus, keyboard and accessible node; `ElementInternals`
  carries the form; the inner input never joins the form (D9; R1 §2.3, probe P5).
- Form: `FormControl`. Checked submits the `value` attribute, `"on"` by default, as a native checkbox does; unchecked
  submits nothing. `checked` is the default (§10 SD2). `indeterminate` is a state (PRD §4.2 `:287`).
- Label: the default slot holds the label text (R3 F14).
- Gates: the press tracking binds (`data-active` while pressed) under the later start, in three engines (R1 §2.2,
  probe P5); the label rule of §6.C.1 names the hidden input inside a Field.

**C9 Radio Group** (Pre-built, `@zag-js/radio-group` 1.49.0; family `./radio-group`)

- The group host is form-associated and value-bearing; its commit event is `line-change`, and arrow keys commit
  (ARCHITECTURE §17.2 rule C9; R1 §2.5, probe P8).
- The item shape gate (before approval; D6; ARCHITECTURE §12 `:612`): a radio in an item's own shadow root does not
  join its group, so arrow keys do nothing and two radios stay checked (R1 §2.9, probe P3). The spec proposes an item
  shape and proves in four engine builds that arrow keys move and check, one radio stays checked, and Zag's item
  queries find the items. R1 §2.9 and R8 §2.2 list the candidate shapes. A shape that fails returns to Miguel.
- zag#3239: the hidden radio takes `position: fixed` with zero insets, and the component's own focus calls pass
  `preventScroll: true`. That gave 0 px of scroll in a sticky header in four builds, where Zag's style gave −360 px
  (R1 §2.7, probes P9 and P10; §5 item 7).
- The whole group can be disabled, the orientation can be horizontal, and each item can take slotted content such as a
  swatch (R10 §2.2, §6 Q11).

**C10 Switch** (Pre-built, `@zag-js/switch` 1.49.0)

- As C8. The value is present only while on, as a native checkbox (R10 §2.2).
- Zag 1.49.0 sets no `role="switch"`, so the switch is announced as a checkbox (R1 §2.3, probe P7). The hidden input
  carries `role="switch"`, which ARIA in HTML lists among the roles allowed on `input type=checkbox` `[INFERENCE: no
  note checked it]` (R1 §7 Q6). Gate: the role is `switch` in the Chromium CDP tree and in Playwright's role computation
  in three engines.

**C11 Select** (Pre-built, `@zag-js/select` 1.49.0; family `./select`; D2, D14)

- Anatomy: the light-DOM family of §4.2; no native `<select>` participates (ARCHITECTURE §16.2 `:1507`). The value
  reaches the form only through the host (R4 §2.1; §6 Q9). Zag's composed `change` stops at the component's shadow
  root (D10).
- Listbox layer: `line-select-content` carries `popover="manual"` and is shown and hidden from machine state, as Portal
  settled, with no Phase 3 component (R4 §2.3; `docs/specs/0013-portal.md` F1). Placement follows §10 SD14.
- Focus outside: the remedy of §10 SD15 closes the listbox on every focus move outside the family, in the document,
  inside a consumer's shadow root and on touch devices, where Zag registers no `focusin` (R4 §2.4, probes P3, P4, P7,
  P8; PRD §1.7 `:174`).
- Keyboard: §10 SD16.
- Search (D14): Select keeps "with search", and the search field carries combobox semantics (`docs/PRD.md:290`;
  ARCHITECTURE §16.2 `:1507`). `@zag-js/select` 1.49.0 has typeahead and no search; a filter input inside the content
  works mechanically but has no combobox role, no active descendant, and sits inside `role="listbox"` (R4 §2.2, probe
  P6). Gate (before approval): the spec designs the search field with `role="combobox"`, `aria-controls` the listbox,
  `aria-activedescendant` the highlighted item (element reflection where the reference crosses a shadow boundary,
  R4 §2.5 P5), `aria-autocomplete="list"` and `aria-expanded`, within the `./select` family, and proves it in the
  Chromium CDP tree and Playwright in three engines. Any added machine, such as `@zag-js/listbox` or
  `@zag-js/combobox`, enters the per-machine table (R4 §2.8). A design that needs a separate component returns to
  Miguel, because D14 (b) keeps search inside Select.
- Showcase needs: item groups, slotted item content, a non-deselectable single selection, `line-change` with
  `detail.value` (R10 §2.2).
- Gates (R4 §4 item 7): click-to-open in CI's Linux WebKit; the four focus cases of R4 §2.4 in the document and inside a
  shadow root; Escape and outside click inside a modal `<dialog>`; flip at the viewport edge and RTL; the form round
  trip through `ElementInternals`. Mobile claims rest on emulation until Miguel sets the real-device policy (plan
  §10.1).

**C12 Toggle Group** (Pre-built, `@zag-js/toggle-group` 1.49.0; family `./toggle-group`)

- No native input (R1 §2.9). Form: `FormControl`, a multi-value control under §6.F.1 in both modes.
- `deselectable: false` is available, because Zag defaults it to `true` and a theme scheme must not be cleared (R10
  §2.2).
- Gates: the item shape passes R1 probe P11 (roving focus and value with slotted items, scope on the host's tree) in
  four builds before approval; the `line-change` detail shape (`string` or `string[]` in single mode) is the spec's,
  consistent with the G8 adapter (R10 §6 Q11).

**C13 Slider** (Pre-built, `@zag-js/slider` 1.49.0)

- The thumb is the `role="slider"` node. Under the later start the thumb is visible and focusable and arrows step,
  which the default start broke (R1 §2.2, probe P12).
- Events: `line-input` from `onValueChange` during drag and keys, `line-change` from `onValueChangeEnd` (R1 §2.5).
- A value-text hook gives `aria-valuetext`, such as "20 percent", from consumer text (R10 §2.2; §10 SD10).
- Gate: decimal and fractional steps commit the value the A2UI step rule of §6.G.8 expects (R6 §2.3).

**C14 Number Input** (Pre-built, `@zag-js/number-input` 1.49.0)

- Anatomy: the visible `<input type="text" role="spinbutton">` with the machine's `inputmode` and no `pattern`;
  `increment` and `decrement` are parts (ARCHITECTURE §16.2 `:1499`).
- The `value` attribute is machine-readable (`.` as the decimal separator), and the host formats it for the locale
  before it hands it to the machine, once; Zag parses a default with the locale, so `"1234.5"` under `de-DE` reads as
  12 345 (R1 §2.8, probe P14; §5 item 8). Re-applying the value on every render reformats each keystroke, so the
  binding applies it once (R1 §2.8).
- Events carry the machine-readable value; `onValueChange` fires on a reformat with no user edit, so the component
  fires `line-change` only for a user commit (R1 §2.5).
- Gate: ARCHITECTURE §16.2 asks the spec to confirm the `inputmode` in three engines (`:1499`).

**C15 Editable** (Pre-built, `@zag-js/editable` 1.49.0; ARCHITECTURE §13.6 `:659-664`)

- Internal parts; preview and edit states; Escape reverts; Enter commits the edit and submits no form (§10 SD5).
- Form: `FormControl`; the committed value is the form value.

#### 6.C.3 Obligations of every C row

| Obligation | Source |
|---|---|
| Component spec APPROVED before code, with the Agent contract section filled and a `Pinned sources` row naming PRD v0.8.40, ARCHITECTURE v0.8.30 and this spec through its last AM | PRD §8.1–§8.3; PROCESS §3; plan §7.1 |
| Pass the PRD §5.2 8-point checklist; keyboard in the Playwright Browser tier | PRD §5.2; Phase 1 spec §10 SD99 |
| Prove plan §2.3 in the Browser tier in three engines: the §6.F.1 acceptance list for a form-associated row; for C1 and C5, the same through the slotted control before and after upgrade | plan §2.3, §7.1 |
| Stories titled `Components/Forms — Essential/<Name>`, autodocs from the shipped manifest, and committed Chromium baselines for every story | plan §2.5; component spec template; Phase 1 spec §10 SD98 |
| Zero axe violations in three engines, with the Firefox skip of §7.6 for Field-related rows | PRD §5.2; plan §5.3; D32 |
| CEM JSDoc complete, `@fires` with a typed `detail` | ARCHITECTURE §17.2 rules C3, C7 |
| Descriptor in the same PR, exposed or `agentExposed: false` with a reason; the surface render fixture and the surface axe test extended on both protocol versions | plan §2.4, §7.2; §6.G.2 |
| htmx Tests row filled; harness run for each value-bearing or compound row, path (a) for each form participant | plan §7.1; PRD Appendix A |
| Row in `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.2 | plan §7.1 |
| Size row in the report; a pre-built row also in the per-machine table (§7.4) | plan §2.6, §7.1; D21 |
| `EXPECTED_TAGS` row; machine dependency at `^1.49.0` (an infra-supervisor edit) | §4.2; D23 |
| Import no other component; compose through slots | MANIFESTO Law 4; Phase 1 spec §10 SD4 |
| Machine rows measure the host update rate | Phase 1 spec §10 SD18 |
| Changeset entry, `minor` or `patch` under PROCESS §6; the first `minor` for `line-components` carries the SD76 widening (§7.1) | PROCESS §6; Phase 1 spec §10 SD76 |

### 6.G Stream G — Agent-driven UI (`@websublime/line-genui`)

Owner of every G row: webcomponents-supervisor (plan §4.0). File classes follow §4.0; the pin and the peer ranges are
infra-supervisor edits. Every G row goes through security review, because agent values can reach a host page
(PROCESS §5; plan §8).

#### 6.G.1 G1 — `@a2ui/web_core` 0.16.1

- The row's first commit is a Phase 1 spec AM that moves §10 SD6 from exactly `0.14.0` to exactly `0.16.1`. 0.14.0's
  v1.0 is pre-final and cannot serve final v1.0 (R6 §2.5, P1; Phase 1 spec SD6 "a newer version only through an AM").
- The AM settles the five items of R6 §4 item 12, and the row proves each:
  1. Each rejected message raises exactly one `line-a2ui-error`; 0.15.0 and later pass every processing error to
     `onError` and rethrow it (R6 §2.6 class 1). The AM picks between `reportErrorsOnly` with `errorHandler` and
     dropping one of the session's two paths, and the 14 tests of that class pass.
  2. A component's own `catalogId` no longer routes on a v0.9 surface, so the Storybook Alert fixture and the tests use
     one catalog per surface (R6 §2.6 class 2).
  3. The session reads the data model per protocol version, because `getRendererDataModel()` throws once surfaces mix
     versions (R6 §2.6, P5).
  4. The v0.9 basic catalog registers `V09_SPEC_FUNCTIONS`, the specification's 14 functions, not `BASIC_FUNCTIONS`'
     25 (R6 §2.6).
  5. The exact-pin assertion (`packages/line-genui/__tests__/a2ui-session.test.ts:54-58`) reads 0.16.1.
- The nested `openUrl` test of class 3 asserts the 0.16.0 rejection instead (R6 §2.6 class 3).
- Acceptance: `bun test packages/line-genui` passes with 0.16.1; the surface bundle growth is recorded (R6 §2.6, +8,000 B
  gzipped).

#### 6.G.2 G2 — The v1.0 catalogs and the session (D25)

- Each descriptor declares its props once, and its Zod schema per protocol version derives from that declaration on
  the `@a2ui/web_core/v0_9` or `@a2ui/web_core/v1_0` common types (ARCHITECTURE §17.3 `:1652`; R6 §2.5, P3).
- The v1.0 `line` catalog takes its own id and file (§10 SD24). Its emitted JSON validates against
  `specification/v1_0/json/catalog_definition.json`, and run-time validation accepts `@path` and rejects `path`
  (R6 §2.5, P3).
- The v1.0 basic implementation registers under `https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json`
  beside the v0_9 id (ARCHITECTURE §17.3 `:1661`). A session still advertises a basic id only on consumer opt-in,
  because basic coverage stays incomplete (Tabs, Modal and Card are later phases; Phase 1 spec §10 SD44).
- One session serves both protocol versions. It accepts `"version": "1.0"` envelopes beside v0.9 ones, answers each
  surface in its own version, and reads the data model per version (D25; R6 §2.5, §2.6).
- The row lands a Phase 1 spec AM for §10 SD43 (the basic ids), SD45 (the versions advertised, accepted and emitted)
  and SD51 (only v0.9 envelopes accepted) in its first commit (§11.2).
- Gate: the v1.0 `line-a2ui-action` and `line-a2ui-error` payloads match `specification/v1_0/json` for the action and
  error messages `[INFERENCE: R6 probed the catalogs, checks and envelopes, not the v1.0 action message]`.
- Acceptance: a v1.0 `createSurface` renders Phase 1 types on the v1.0 `line` and basic ids; a v0.9.1 surface keeps
  working in the same session; the drift and coverage tests of Phase 1 spec §6.G.5 pass for both versions.

#### 6.G.3 G3 — Live write-back and value adapters (D24)

- The descriptor binding map gains a live-event member: `line-input` for a value-bearing component. The surface writes
  the value back through the node's `WritableBinding` on the live event and on the rule C9 commit event; rule C9 is unchanged
  (ARCHITECTURE §17.3 `:1647`; R6 §2.1, §4 item 4).
- A literal value is a read-only binding, and the surface writes nothing back for it (R6 §2.1).
- The basic map carries one value adapter per form type (§10 SD19). `web_core` stores whatever it is given, so an
  adapter error corrupts the model silently (R6 §2.1, P1).

#### 6.G.4 G4 — The surface form rule (§10 SD17)

- The surface sets `form=""` on every form participant it creates, when it creates it and before it appends it: every
  form-associated line element, Button included, and every native form control the surface creates, which are
  TextField's `<input>` and `<textarea>` and ChoicePicker's `<fieldset>` (R6 §2.4, §4 item 1; Phase 1 spec AM-081).
- With no form owner, a host `<form>` gets no agent field, no agent value, no blocked submission from a failed agent
  check, and no reset of agent controls. The control keeps its own validity (`willValidate`, `:invalid`,
  `validationMessage`), and implicit submission has no form to submit (R6 §2.4, probe P6).
- A host `<fieldset disabled>` still disables agent controls, and host CSS such as `form :invalid` still matches them;
  both are accepted and documented (R6 §2.4).
- Agent data leaves only through the A2UI data model and actions (R6 §2.1).
- Gate: `form=""` on a surface-created native `<input>`, `<textarea>` and `<fieldset>` leaves each with no form owner in
  three engines `[INFERENCE: R6 probed form-associated custom elements; the HTML form-owner rule is the same]`.

#### 6.G.5 G5 — The agent Button and its checks (D27)

- The surface sets `disabled` on an agent `<line-button>` while its node's `isValid` is false, on both protocol
  versions, as A2UI requires; a v1.0 `warning` or `info` result leaves `isValid` true (R6 §2.2, P1, P6).
- Acceptance: a Button carrying a failing `required` check renders disabled and enables when the check passes, in three
  engines.

#### 6.G.6 G6 — v1.0 Text headings (D28)

- On v1.0, a Text whose text starts with one to five `#` and a space renders as `<h1>`–`<h5>` with the rest as its
  plain text, without a Markdown renderer. Any other text is plain text. When the consumer sets `markdownRenderer`,
  the renderer receives the text as on v0.9 (ARCHITECTURE §17.3 `:1669`, §17.4 `:1701`; R6 §2.5).

#### 6.G.7 G7 — TextField and CheckBox on both versions (D26)

- The surface wraps each form type in `<line-field>`, so rule C4's error slot exists and Field labels the control
  (ARCHITECTURE §17.3 `:1687`).
- TextField: `shortText` → `<line-input>` with a surface-created `<input>`; `obscured` → `<line-password-input>`;
  `longText` → `<line-textarea>` with a surface-created `<textarea>` once C5 merges; `number` → `<line-number-input>`
  once C14 merges (ARCHITECTURE §17.3 `:1676`; R6 §2.3). Until a variant's target merges, that variant takes the
  unmapped path, an inert placeholder and `line-a2ui-error` (ARCHITECTURE §17.3 `:1665`). v1.0 `placeholder` maps to
  the native placeholder. v0.9.1 `validationRegexp` follows §10 SD20.
- CheckBox → `<line-checkbox>`. Its A2UI `label` is the checkbox's slotted text, and the Field label slot stays empty,
  so the name is not announced twice. Gate: the name and the Field description in the Chromium CDP tree and in
  Playwright in three engines (R3 F14).
- Checks reach the control through rule C4 (§10 SD18). The control is invalid from the first render when a check fails,
  and Field shows the error after interaction through the control's `user-invalid` state (D13; §10 SD4). This departs
  from the upstream reference renderer, which shows errors at once, and the guide documents it (R6 §2.2).
- A form type with neither a visible `label` nor an accessible name renders a placeholder and raises
  `line-a2ui-error` with `MISSING_ACCESSIBLE_NAME`, as Phase 1 named components do (Phase 1 spec §10 SD82; R6 §6 Q9).
- Acceptance: on both protocol versions, each type renders in a Field, a bound Text updates on each keystroke, a failing
  check sets the control invalid and fills the Field error slot, and the surface axe test passes.

#### 6.G.8 G8 — ChoicePicker, Slider and DateTimeInput

- ChoicePicker (O7 (a), D14, D19; R6 §2.3 matrix):

| `variant` × `displayStyle` | Target | Adapter |
|---|---|---|
| `mutuallyExclusive` × `checkbox` (defaults) | `<line-radio-group>` | `[v]` ↔ `v` |
| `multipleSelection` × `checkbox` | `<line-fieldset>` around a surface-created `<fieldset>` and `<legend>`, holding one `<line-checkbox>` per option | the list composed from the checked boxes |
| `mutuallyExclusive` × `chips` | `<line-toggle-group>`, single, `deselectable: false` | `[v]` ↔ the group value |
| `multipleSelection` × `chips` | `<line-toggle-group>`, multiple | `string[]` |
| `mutuallyExclusive`, `filterable: true` | `<line-select>` with its search (D14) | `[v]` ↔ `v` |
| `multipleSelection`, `filterable: true` | the non-filterable target of its `displayStyle`, without a filter, until the Phase 4 Combobox (`docs/ARCHITECTURE.md:1683`) | as that target |

- Slider: v1.0 `steps` gives `step = (max − min) / steps`; without `steps`, v0.9.1 included, `step` is 1, as the
  upstream reference renders it (R6 §2.3, §4 item 8). The C13 gate settles fractional quotients.
- DateTimeInput (R5 §2.6; D18; §10 SD21):

| Flags | Target | Value written |
|---|---|---|
| `enableDate` only, or both absent | `<line-date-input>`, day granularity | `YYYY-MM-DD` |
| `enableDate` and `enableTime` | `<line-date-input>`, minute granularity | `YYYY-MM-DDTHH:MM` |
| `enableTime` only | `<line-date-input>` in its time-only mode | `HH:MM`, no date |
| both explicitly `false` | §10 SD21 | none |

- The value strings are the HTML normalized strings of §6.F.1, which are valid ISO 8601 (R5 §2.6); `min` and `max`
  arrive as ISO date, time or date-time strings. Time zones are not kept, because the machine's values carry none
  (R5 §2.6).
- ARCHITECTURE §17.3 records the A2UI guide's native-picker advice as a documented departure (`:1680`).

#### 6.G.9 G9 — Preview exit

- At the phase exit `@websublime/line-genui/a2ui` and `@websublime/line-icons/a2ui` leave preview (PRD §7.4 `:977`,
  `:988`). The row updates the package READMEs, the JSDoc and the Storybook agent guide. The PRD, ARCHITECTURE and
  MANIFESTO statements change in a main-session revision (§11.2).
- From then on the renderer and the icon map follow the PRD §7.1 breaking-changes policy (ARCHITECTURE §17.7 `:1737`).

### 6.P Stream P — Platform and release

Owner of every P row: infra-supervisor (plan §4.0); test files are webcomponents-supervisor edits (§4.0).

#### 6.P.1 P1 — The per-machine size table (D21)

- `scripts/report-size.mjs` keeps its component rows under Phase 1 SD21 (component alone; Lit, `line-core` and Zag
  external) and adds a per-machine table: each `@zag-js/*` machine that `line-components` depends on, with its marginal
  gzip weight over the report's "Zag core + vanilla" row and its esbuild code-split chunk (R8 §2.3, §2.4; §6 item 5).
- DateInput's row in the table also shows the share of `@internationalized/date` (R8 §2.5).
- The baseline row keeps `export *` from `@zag-js/core` and `@zag-js/vanilla`, and its comment at
  `scripts/report-size.mjs:15` stops citing R9 §2.4's named-import row (R8 §2.6, §6 item 7).
- 1 KB is 1,000 B, and CI's GNU gzip is the reference (PRD §1.6 `:157`; R8 §2.6, §6 item 6).
- The report gates nothing (PRD §1.6). Acceptance: the CI log prints the table for every machine merged so far.

#### 6.P.2 P2 — `@internationalized/date` (D22)

- `packages/line-components/package.json` declares `@internationalized/date` at `^3.12.4`, the version R5 and R8
  measured. `@zag-js/date-input` declares it only as an unbounded peer (R8 §2.5, §6 item 8). Blocks C4.

#### 6.P.3 P3 — The derived CDN import map

- The unpkg import map in `packages/line-components/__tests__/cdn.e2e.ts` and in the docs derives from the bare-import
  closure of each package's `dist`, instead of growing by hand with each row (R8 §2.7, §6 item 11; plan §5.3 lesson
  1). Phase 2 adds 24 entries in all (R8 §2.7) `[INFERENCE: not run on a CDN]`.
- Acceptance: each Version PR records its `cdn-check.yml` run (plan §7.1; Phase 1 spec §7.2).

#### 6.P.4 P4 — Playwright 1.66 (D32)

- `blocked` until a stable Playwright ships Firefox build 1575 or later, expected as 1.66 (R3 §2.8). The row moves
  `playwright` and its browsers, checks `@axe-core/playwright` against it, and lifts the Firefox axe skip of §7.6 in
  the same PR.

#### 6.P.5 P5 — Phase-exit minors

- A `minor` changeset for each package still at `0.2.x` with no pending `minor`, so every package ends Phase 2 in
  `0.3.x`, as Phase 1 row P13 did (plan §2.6; §7.1).

### 6.D Stream D — Documentation

Owner of every D row: webcomponents-supervisor (plan §4.0).

#### 6.D.1 Row D1 — The `Patterns` section and the floating label

- A Storybook `Patterns` section with a floating-label story and its full CSS, built on Field's `data-focused` and
  `data-filled` (PRD §5.1 `docs/PRD.md:512-520`; ARCHITECTURE §9 `:515`). Deps C1, C6.

#### 6.D.2 Row D2 — The forms guide

One MDX page under `apps/storybook/stories/`, as Phase 1 placed its guides (Phase 1 spec §10 SD70). It covers:

- native participation through `ElementInternals`, and the slotted native control of Input and Textarea;
- a native `<select>` in `<line-field>` as Select's no-JavaScript and OS-picker path (MANIFESTO Law 8);
- validity, `custom-validity` and the `user-invalid` state, with the warning that Firefox matches
  `line-*:user-invalid` from page load while Chromium and WebKit never match it (R2 §6 Q1; plan §4.5);
- a warning that a `:not(:defined)` rule must not hide a form control's slotted fallback, which stays undefined without
  JavaScript for the whole session (R7 §2.3, §7 Q5);
- Field, labelling and label activation (§6.C.2 C6);
- implicit submission (§10 SD5), and the asymmetry that native rules never count a line control as a blocking field;
- password managers as best effort;
- SSR under §10 SD22: load `lit-element-hydrate-support` first, shim `CSSStyleSheet`, and the Astro, Next.js and Nuxt
  findings as documentation, never as adapters (R7 §2.5, §2.6, §7 Q9, Q10; MANIFESTO Out of Scope `:63`);
- the agent path: the surface form rule, checks to rule C4, and the shown-after-interaction departure (§6.G).

#### 6.D.3 Row D3 — Getting Started

- The form components on the Getting Started page, with the rule to keep every `@zag-js/*` package on one version
  (D23; R8 §2.4). Phase 1 row D5 settles how its CDN snippets stay current (plan §4.5).

### 6.S Stream S — The Theming showcase (D31)

#### 6.S.1 S1 — `/theming/`

- **Owner:** webcomponents-supervisor; the route's build wiring is infra-supervisor's (§4.0). **Deps:** C9, C10, C11,
  C12, C13 (plan §6). One row, as the Phase 1 landing page was (Phase 1 spec §6.S.1; D31).
- **Scope.** R10 §2.6 option (a), a minimal theme browser, with the contrast readout of option (b), on its own route
  `/theming/` (PRD §5.3 `docs/PRD.md:588`; D31).
- **Controls** (R10 §2.2):

| Axis | Control | Form name |
|---|---|---|
| Accent: "indigo (default)" and 31 hues, grouped by auto-pair gray, a swatch per item | `<line-select>` | `accent` |
| Gray: 6 hues, a swatch per item, disabled as a group while auto-pair is on | `<line-radio-group>` | `gray` |
| Gray auto-pair on or off | `<line-switch>` | `auto` |
| Colour scheme: System, Light, Dark | `<line-toggle-group>`, single, `deselectable: false` | `scheme` |
| Shadow strength, 0–100 %, live while dragging | `<line-slider>` | `shadow` |

- **Mechanics.**
  - The panel is a `<form method="get">`, so the URL is each control's own `FormData` (R10 §2.2, §2.3).
  - The preview is a scoped `<section data-accent data-gray>` that holds Phase 1 components covering every role. The
    controls sit outside it, so they stay readable under any choice (R10 §2.3).
  - Site CSS redeclares `--line-focus-ring-color` and `--line-focus-ring` on the scope, because the ring, gradient,
    highlight and SVG tokens resolve on `html` (R10 §2.3, probe 3.3; PRD §9.4).
  - The readout shows the computed contrast of each role pair from a build-time table on `line-utils` contrast (R10
    §2.6 (b)).
  - The auto-pair source follows §10 SD23. An unknown hue never reaches an attribute (R10 §2.3).
  - CSS delivery and a first-paint script are the implementer's, recorded in the PR, as Phase 1 SD73 left them
    (R10 §6 Q7, Q8).
- **Acceptance** (R10 §2.5):
  - `apps/site/__tests__/theming.e2e.ts` asserts every `line-*` tag on the route is `:defined` in three engines.
  - The test drives each control by keyboard and asserts the effect on the scope: the attribute, a resolved role token,
    `color-scheme` and the shadow knob.
  - A shared URL sets the controls and the preview, and `FormData` matches the URL.
  - axe passes in three engines in light and dark on the default theme, and in Chromium on each accent with its
    auto-pair gray in both modes. Row 01-Z30 brought the label pair to 4.5:1 on all 62 hue × mode pairs (plan §2.8).
    The showcase adds no visual baselines; Phase 1 SD98's Roles coverage stands (R10 §4).
  - A green `deploy-site.yml` run on the merge commit, and the live route at `line-ui.websublime.com` (PRD §7.4 `:989`).

### 6.Z Stream Z — Repo-wide

#### 6.Z.1 Z1 — Phase exit and retrospective

- **Owner:** main session. **Deps:** every other Phase 2 row, and P5's phase-exit Version PR merged.
- The main session runs the exit sweep before the last rows land; each finding becomes a row (Phase 1 spec §6.Z.2).
- Z1 revisits the controller start default of D8 for the Phase 1 components and records the outcome (ARCHITECTURE §6
  `:387`).
- Z1 lands the preview-exit revision of the PRD, ARCHITECTURE and MANIFESTO (§11.2) if G9 has not.
- Z1 evidences every §9 criterion, ticks §9 and plan §7, adds the PRD §7.4 status line, and writes
  `docs/retrospective/02-phase-02-retro.md` with a hand-off to Phase 3 that names the SD76 widening duty for `^0.4.0`
  (Phase 1 spec §7.2, AM-115).

---

## 7. Cross-Cutting Concerns

### 7.1 Versioning and changesets

| Package | Version today | Phase 2 changeset | Version at phase exit | Source |
|---|---|---|---|---|
| `line-tokens` | 0.2.0 (a `patch` pending from row 01-Z31) | `minor` at P5 unless an earlier row adds one, then `patch` | 0.3.x | plan §2.6, §7.4 |
| `line-colors` | 0.2.0 (a `patch` pending from row 01-Z30) | as `line-tokens` | 0.3.x | plan §7.4 |
| `line-schemas` | 0.2.0 (a `patch` pending from row 01-Z30) | as `line-tokens` | 0.3.x | plan §7.4 |
| `line-themes` | 0.2.1 | as `line-tokens` | 0.3.x | plan §7.4 |
| `line-utils` | 0.2.0 (a `patch` pending from row 01-Z30) | as `line-tokens` | 0.3.x | plan §7.4 |
| `line-core` | 0.2.4 | `minor` at F1, then `patch` | 0.3.x | §6.F.1 |
| `line-components` | 0.2.9 | `minor` at the first C row to merge, then `patch` | 0.3.x | §6.C |
| `line-icons` | 0.2.2 | `minor` at P5 unless an earlier row adds one | 0.3.x | §6.P.5 |
| `line-genui` | 0.2.0 | `minor` at the first G row that adds capability, expected G2, then `patch` | 0.3.x | §6.G |

- Versions today are the `version` fields in `packages/*/package.json`; the pending changesets are the files under
  `.changeset/`, each a `patch`.
- A package's first Phase 2 `minor` releases it as `0.3.0` in whichever Version PR carries it. Once that Version PR has
  merged, the package's later Phase 2 changesets use `patch`, even for new capability (PROCESS §6; plan §2.7). The
  implementer picks the bump against `main` as it stands when the PR opens.
- The SD76 widening. The first PR that adds a `minor` changeset for `line-components` or `line-icons` widens both
  `line-genui` peers to `workspace:^0.1.0 || ^0.2.0 || ^0.3.0` on `main`, before `changeset version` builds the Version
  PR (Phase 1 spec §7.2, §10 SD76; `packages/line-genui/package.json:37-40`). Under Changesets 3 a missed widening gives
  `line-genui` a `patch` whose peers read `workspace:^0.3.0` and drop the `0.2` peers (Phase 1 spec AM-119). The
  `checks.yml` step `Peer ranges (SD76)` fails a PR that misses it (Phase 1 spec §7.2, row 01-Z14). The `devDependencies`
  follow Changesets.
- Miguel checks that no Version PR of Phase 2 takes a package past `0.3.x` (plan §2.6; PROCESS §6).
- Every Version PR carries its release-time records and passes the required `release-records` status, citing runs on
  its base sha of `snapshot-deploy.yml`, `cdn-check.yml` and `visual-off-pairs.yml` (Phase 1 spec §7.2, AM-114;
  PROCESS §6).
- Phase 1 row D5 lands before the first Phase 2 Version PR (plan §1.2).

### 7.2 Custom Elements Manifest

- The Phase 1 content rules carry over unchanged: `@fires` mandatory, tests filtering on `privacy`, `static` and
  `inheritedFrom`, the inherited static `formAssociated`, ARIA in the descriptor, `schemaVersion` as emitted, and no
  analyser plugin (Phase 1 spec §7.3, §10 SD61).
- A `FormControl` component inherits `formAssociated` through `FormAssociated`, so the drift tests read it as Phase 1
  does (Phase 1 spec SD61). Input and Textarea follow §10 SD6.
- Each family tag gets its own declaration, looked up by tag (Phase 1 spec §7.3).
- Gate (F1): the manifest lists the members and the `@fires line-validity-change` that each `FormControl` subclass
  inherits from the mixin, and the drift test reads them `[INFERENCE: inheritance of mixin events in the analyser is
  not probed]`.

### 7.3 axe tier and accessibility assertions

- The Phase 1 axe tier carries over: Playwright with `@axe-core/playwright` 4.14.1, the WCAG 2.0 and 2.1 A and AA tags,
  zero violations as a failing check, on every story of every component and on the surface stories (Phase 1 spec §7.4,
  §10 SD78, SD79).
- Zero violations do not prove a name. axe ignores roles set only through `ElementInternals`, gives a false negative on
  a wrapping `<label>` around a custom element, and cannot read descriptions set by reflection (R3 §2.4).
- Every name a Phase 2 control gets through element reflection is asserted in the Browser tier, through the Chromium
  CDP accessibility tree (`Accessibility.getPartialAXTree`) and through Playwright's role and name computation in three
  engines, which honours `ariaLabelledByElements` from 1.65 (R3 §2.4, §5 item 7).
- Descriptions set by reflection are asserted in Chromium only, through CDP; Playwright does not compute them, and
  WebKit exposes no description to any method tried, a gap each component spec records (R3 §2.4).
- The private WebKit inspector path of R3 §2.4 and a Firefox engine-tree method through geckodriver are not gates;
  Miguel decides the WebKit path outside the documents (plan §10.1).
- A role set only through internals keeps the Phase 1 rule: a CDP tree assertion plus an `INTERNALS` read-back in three
  engines (Phase 1 spec §10 SD39). §6.C.1 keeps roles on native elements wherever they can sit.

### 7.4 Size measurement

- Component rows: Phase 1 SD21, unchanged. The component alone, with Lit, `line-core` and Zag external, measured with
  esbuild and `gzip -9 -n` on the packed tarball (Phase 1 spec §7.6).
- The per-machine table of P1: each machine's marginal over the report's Zag baseline row and its code-split chunk
  (D21). For scale, R8 measured these marginals over that row, in bytes of Apple gzip, which differs from GNU gzip by
  −109 to +30 B (R8 §2.3, §2.6):

| Machine | Marginal (B) | Split chunk (B) |
|---|---|---|
| `@zag-js/checkbox` | 5,085 | 1,884 |
| `@zag-js/radio-group` | 5,901 | 2,810 |
| `@zag-js/switch` | 5,090 | 1,795 |
| `@zag-js/toggle-group` | 3,081 | 2,012 |
| `@zag-js/slider` | 8,272 | 5,805 |
| `@zag-js/number-input` (with `@internationalized/number`) | 9,443 | 7,979 |
| `@zag-js/select` | 26,738 | 20,167 |
| `@zag-js/editable` | 5,314 | 2,676 |
| `@zag-js/date-input` (with 4,919 B of `@internationalized/date`) | 16,507 | 15,870 |
| `@zag-js/auto-resize` | 546 | — |

- The < 5 KB target is soft and gates nothing; 1 KB is 1,000 B of GNU gzip output, as CI runs it (PRD §1.6 `:157`,
  §1.7 `:169`).

### 7.5 Bundle splitting and CDN delivery

- The Phase 1 checks run on the packed tarball for every Phase 2 subpath: the registration harness, the isolation scan,
  the esbuild consumer bundle, the `instanceof` harness and the undeclared-specifier check (Phase 1 spec §7.5). A family
  is one module tree, so the scan accepts its part tags (R8 §4).
- The CDN contract of Phase 1 holds: jsDelivr `+esm` and unpkg raw files with an import map and the `process` shim; one
  exact version for every `@websublime/*` URL on a page (Phase 1 spec §7.7). P3 derives the import map (§6.P.3).

### 7.6 Test conventions

| Rule | Source |
|---|---|
| Every form claim is proven in the Browser tier; happy-dom fakes `attachInternals` | plan §5.3; Phase 1 retrospective lesson 7 |
| Three engines through the `chromium`, `firefox` and `webkit` projects (`playwright.config.ts:39-41`). A WebKit claim holds once CI's `ubuntu-latest` run, which is Linux WebKit on x86_64, passes; a local macOS or aarch64 run does not establish it | plan §5.3; `.github/workflows/checks.yml:9`, `:47`; R2 §6 Q11; R3 §7 Q13; R9 §6 Q10 |
| Field-related rows skip the Firefox axe scan until P4. A row is Field-related when a test page sets ARIA element reflection properties: C6, every Field-compatible control's forwarding tests, every test that places a control in `<line-field>`, and G7 and G8 | D32; plan §5.3; R3 §2.8 |
| Until P4, no Firefox test reads a reflection property in the page's main world and runs a Playwright role computation on the same page; read-backs move to a second page | R3 §2.8, §5 item 7 |
| A test that clicks a reset button waits a microtask before it asserts | R2 §2.3 |
| Disabled is asserted as `:disabled`, focus refusal, `FormData` and the request, never with `toBeDisabled()` | R9 §6 Q9, §3.6 |
| Restore is asserted on a back navigation; Playwright never entered the back/forward cache, and reload restore is Firefox-only | R2 §2.4, §6 Q5 |
| A test finds a control by slotted label text; Playwright 1.65 drops unslotted text from names | R3 §2.4 |
| macOS WebKit skips buttons on Tab; the existing helpers press Alt+Tab there | R9 §2.6; `packages/line-components/__tests__/integration/alert/alert.e2e.ts:101-102` |
| Touch runs through Playwright emulation (`hasTouch`); no device claim follows from it | R1 §2.12; R4 §2.6 |
| Keyboard navigation runs in the Browser tier; stories keep play functions as documentation | Phase 1 spec §10 SD99 |
| No DOM snapshots; visual tier Chromium-only with committed Linux baselines | Phase 1 spec §10 SD81, SD98 |
| Tests resolve workspace packages by name and never reach into another package by a relative path | Phase 1 spec §7.8 |

### 7.7 Writes on author DOM (MANIFESTO Law 5)

Law 5 allows a component four kinds of write on author-supplied light DOM (`docs/MANIFESTO.md:47`; ARCHITECTURE §6
`:390-396`). Every Phase 2 write is one of them, and each component spec documents its own.

| Component | Write | Law 5 clause |
|---|---|---|
| Input, Textarea | `value`, `setCustomValidity()` and the forwarded ARIA reflection properties on the slotted control; Textarea's auto-resize height | a native control it adopts from its slot |
| Field | `ariaLabelledByElements` and `ariaDescribedByElements` on its slotted control; never `for`, never an attribute | an orchestrator's ARIA reflection properties |
| Select, Radio Group, Toggle Group | the machine props of §10 SD12 on their `line-*` parts | a family host's documented hooks |
| Fieldset | none; it reads the author's fieldset | — |
| PasswordInput | none; it listens on its form owner's `submit` | — |
| DateInput | moves the machine's `document.body` live region into its own shadow root right after start (gate, §6.C.2) | the rule that nothing stays on `document.body` |

- The `FormControl` layer never writes the host's `disabled` attribute (§6.F.1).
- The surface creates and wires its own elements, `form=""` included, under the Phase 1 reading of Law 5 for
  `line-genui` (Phase 1 spec AM-002).

### 7.8 SSR authoring rule

Under §10 SD22, every Phase 2 component reads no DOM beyond what the Lit SSR shim provides in its constructor,
`render()` and `willUpdate()`, and it reads `name` and the other form attributes from attributes or reflected
properties (R7 §2.5, §2.6, §6.3). No test gates SSR (O8 (a)).

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| The run-time catch cannot sit in the controller without patching Zag, because actions run in a microtask of `send` | Medium `[INFERENCE: unprobed]` | High | F3 probes before any machine row (§6.F.3); a failed probe returns to Miguel |
| No Radio Group item shape passes R1 probe P3, so D6's light-DOM family cannot hold native radio grouping | Medium | High | The C9 gate before approval; R1 §2.9 and R8 §2.2 list the shapes; a failure returns to Miguel (§6.C.2) |
| Moving DateInput's live region into its shadow root silences announcements | Medium `[INFERENCE: unprobed]` | Medium | The C4 gate before approval; an upstream `root` or opt-out request (plan §10.1); a failure returns to Miguel |
| DateInput announces a fixed English "Empty" | High (confirmed, R5 §2.5) | Medium | §11.1 Q1; an upstream `translations` key (plan §10.1) |
| Combobox semantics for Select's search have no probe; D14 (b) went against R4's recommendation | Medium | High | The C11 gate before approval; a design that needs a separate component returns to Miguel |
| Zag form wiring is a no-op in a shadow root | High (confirmed, R1 §2.3) | High | The `FormControl` layer drives `ElementInternals` and the callbacks (§6.F.1) |
| Select stays open after any focus move a pointer did not cause, and on touch | High (R4 §2.4) | Medium | §10 SD15's `focusout` remedy |
| `:user-invalid` differs by engine on a form-associated host | High (R2 §2.2) | Medium | The layer's own `user-invalid` state (§10 SD4); the forms guide warning |
| Restore differs by engine, and Firefox hands one element's state to another | Medium (R2 §2.4) | Medium | The identity-stamped state (§6.F.1); the Firefox misroute report is Miguel's (plan §10.1) |
| The reflection hand-off breaks silently when rendering writes `aria-labelledby` or Zag spreads an `undefined` key | Medium (R3 §2.3) | High | The §6.F.1 rule; CDP and Playwright assertions (§7.3) |
| Playwright 1.65.1's Firefox crashes on reflection reads beside a role locator | High (R3 §2.8) | Medium | The §7.6 skip and page split; P4 when 1.66 ships |
| Pre-built machines exceed the 5 KB soft target | High (measured, R8 §2.3) | Low | The per-machine table makes the cost visible (§7.4) |
| `web_core` 0.16.1 breaks 17 of 571 `line-genui` tests and the Storybook Alert fixture | Realised (R6 §2.6) | High | G1's AM settles the five items (§6.G.1) |
| Agent form controls join a host-page `<form>` | Medium (R6 §2.4) | High | The surface form rule (§10 SD17); security review of every G row |
| A slotted `form=""` opt-out on surface-created native controls behaves differently from the custom-element case | Low `[INFERENCE]` | Medium | The G4 gate (§6.G.4) |
| Linux WebKit differs from macOS WebKit (focus on mousedown, dropped clicks after a re-render) | High (R1 §2.12; R4 §2.7) | Medium | CI before WebKit claims; the re-render rule of §6.C.1 |
| WebKit O(n²) on large inserts and `web_core` O(N) per message as surfaces grow with forms | Medium | Medium | R6 §2.7 measured form-sized surfaces at 20–68 ms; no cap is added in Phase 2 |
| 25 §10 rows await Miguel, and the coherence review cannot pass before they settle | High | Medium | Each row names its options and a recommendation; §10.2 maps every question |
| Locator churn when the PRD or ARCHITECTURE moves lines | High | Low | Component specs pin their sources (PROCESS §3; O6 (c)) |

---

## 9. Acceptance Criteria

Phase 2 is complete when every item below holds. The list mirrors plan §7 item by item. The PRD §7.4 criteria keep their
wording (`docs/PRD.md:980-989`), and the plan's additions are in *italics*.

### 9.1 Components

- [ ] All listed components pass the 8-point test checklist (§5.2)
  - Tasks: C1–C15.
  - Check: the "Unit tier" and "Browser tier" steps of `.github/workflows/checks.yml` pass for every Phase 2 test file.
- [ ] Field correctly detects child state via events, validity, and explicit props
  - Tasks: C6, F1.
  - Check: the C6 Browser-tier tests prove the three state sources of ARCHITECTURE §9 around a native `<input>`, a
    native `<select>` and a form-associated line control, and the disabled tracking of §10 SD9, in three engines.
- [ ] formAssociated components participate in native `<form>` submit, reset, and validation
  - Tasks: F1, C2, C3, C4, C8–C15.
  - Check: each row's form tests cover the first three items of the §6.F.1 acceptance list in three engines and in CI.
- [ ] *Each form-associated component also proves the `form` attribute, disabled from a native `<fieldset>` ancestor,
  including one inside `<line-fieldset>`, external validity (C4), and state restore where the engine supports it, in
  three engines.*
  - Tasks: F1, C7, and each form-associated row.
  - Check: the remaining items of the §6.F.1 acceptance list on each component, with C7's `<line-fieldset>` case.
- [ ] *Input and Textarea prove the same through the author's slotted native control, before upgrade and after it, in
  three engines (MANIFESTO Law 8).*
  - Tasks: C1, C5.
  - Check: the C1 and C5 gates of §6.C.2, with JavaScript disabled and enabled.
- [ ] Storybook documentation complete for every component
  - Tasks: C1–C15, row D1.
  - Check: the Storybook build passes, and each autodocs page shows the attributes, slots, events and CSS parts from the
    shipped manifest.
- [ ] Zero axe-core violations
  - Tasks: C1–C15, G7, G8, S1.
  - Check: `packages/line-components/__tests__/a11y/<c>.e2e.ts` passes with the §7.3 ruleset; Field-related rows skip
    Firefox until P4 (§7.6).
- [ ] CEM manifest generated and verified
  - Tasks: C1–C15.
  - Check: `verify-pack` finds `custom-elements.json` in the `line-components` tarball; the drift and coverage tests
    pass (§7.2).
- [ ] Changeset entry for every component
  - Tasks: C1–C15.
  - Check: each component PR adds a `.changeset/*.md` entry.
- [ ] *Every Phase 2 component spec is APPROVED before code, with the Agent contract section filled.*
  - Tasks: C1–C15.
  - Check: each `docs/specs/NNNN-<component>.md` carries Status `approved` and its `Pinned sources` row before its
    implementation PR opens.
- [ ] *Every story has a committed Chromium baseline, and the visual tier passes.*
  - Tasks: C1–C15.
  - Check: `packages/line-components/__tests__/visual/<c>.visual.ts` and its `-visual-linux.png` baselines from
    `visual-baselines.yml`.
- [ ] *Every component fills its htmx Tests row, and every value-bearing or compound component runs the harness for the
  four PRD Appendix A behaviours (`docs/PRD.md:1753-1756`), path (a) among them for each form-associated component.*
  - Tasks: C1–C15 (§6.C.0 htmx column).
  - Check: the component spec Tests row; the harness `@websublime/line-testing/htmx` runs for each harness row.
- [ ] *Every component fills its row in `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.2.*
  - Tasks: C1–C15.
  - Check: the row exists for each of the 15 components.
- [ ] *Each component's gzipped size is reported against the < 5 KB soft target (1 KB = 1,000 B, GNU gzip as CI runs
  it), and the report's per-machine table lists each Zag machine's marginal weight and split chunk (not gating).*
  - Tasks: P1, C1–C15.
  - Check: the CI log of the "Size report" step prints both tables (§7.4).
- [ ] *Bundle splitting is verified for every Phase 2 subpath and family (the `./select`, `./radio-group` and
  `./toggle-group` families among them).*
  - Tasks: C1–C15.
  - Check: `packages/line-components/__tests__/bundle-splitting.test.ts` runs the §7.5 checks on the packed tarball.
- [ ] *CDN delivery through unpkg and jsDelivr is verified for the Phase 2 subpaths, and each Version PR records its
  `cdn-check.yml` run.*
  - Tasks: P3, C1–C15.
  - Check: `cdn.e2e.ts` passes on both paths in `cdn-check.yml`; the `release-records` status cites the run.

### 9.2 Agent-driven UI

- [ ] *Every Phase 2 component has a descriptor (exposed, or `agentExposed: false` with a reason), and the CEM drift
  and coverage tests pass.*
  - Tasks: C1–C15, G2.
  - Check: the drift and coverage tests in `packages/line-genui` pass for both protocol versions.
- [ ] *The basic catalog maps TextField, CheckBox, ChoicePicker, Slider and DateTimeInput, each in `<line-field>`,
  validity reaches each control from A2UI checks through C4, and each writes the data model on `line-input` and
  `line-change`.*
  - Tasks: G3, G7, G8.
  - Check: the G7 and G8 acceptance on both protocol versions in three engines.
- [ ] *`<line-a2ui-surface>` renders every agent-exposed Phase 2 component with zero axe-core violations, and disables an
  agent Button while its checks fail.*
  - Tasks: C1–C15 (render fixture), G5.
  - Check: the surface stories pass the §7.3 ruleset; the G5 acceptance.
- [ ] *Every form control the surface creates follows the Phase 2 spec's surface rule, which states how a host-page
  `<form>`, C4 validity from A2UI checks and MANIFESTO Law 7 apply (§5.5).*
  - Task: G4.
  - Check: a surface inside a host `<form>` adds no field, no value and no blocking validity to it, in three engines,
    for every form type and for Button (§6.G.4).
- [ ] `line-genui` emits the A2UI v1.0 catalogs beside v0.9.1, the surface renders both protocol versions, and the A2UI
  renderer leaves preview
  - Tasks: G1, G2, G9.
  - Check: the G2 acceptance; the G9 statements and the §11.2 revision landed.
- [ ] *Per O3 (b), the five form types map on both protocol versions, and `line-icons/a2ui` leaves preview with the
  renderer.*
  - Tasks: G7, G8, G9.
  - Check: the G7 and G8 acceptance on v0.9.1 and v1.0; the `line-icons` README and JSDoc drop the preview notice.

### 9.3 Documentation

- [ ] Floating label pattern documented in Storybook Patterns section
  - Task: row D1.
  - Check: the `Patterns` story renders in the deployed Storybook with its CSS.
- [ ] *A forms guide covers native participation, the slotted native control of Input and Textarea, the native
  `<select>` path, validity, Field and the agent path.*
  - Task: row D2.
  - Check: the guide covers every bullet of §6.D.2.
- [ ] The site's Theming showcase (§5.3) is built with Phase 2 line://ui components and is live at
  `line-ui.websublime.com`
  - Task: S1.
  - Check: the S1 acceptance (§6.S.1).

### 9.4 Platform and release

- [ ] *Every package is released in `0.3.x` through `release.yml` with provenance, each package's first Phase 2 `minor`
  as its `0.3.0`, and every Version PR carries its release-time records.*
  - Tasks: P5 and every row with a changeset.
  - Check: after the phase-exit Version PR, `npm view` shows a `0.3.x` version with provenance for all nine packages;
    each Version PR merged with `release-records` green (§7.1).
- [ ] *The SD76 widening landed before the first Version PR that carries a Phase 2 `minor` of `line-components` or
  `line-icons`.*
  - Task: the first such PR.
  - Check: `packages/line-genui/package.json` peers read `… || ^0.3.0` on `main` before that Version PR; the
    `Peer ranges (SD76)` step passed.
- [ ] *The exit sweep runs before the last rows land, its findings become ledger rows, and the Phase 2 retrospective is
  written with a hand-off to Phase 3.*
  - Task: Z1.
  - Check: `docs/retrospective/02-phase-02-retro.md` exists with its hand-off and its exit-criteria evidence.

---

## 10. Design Decisions

Every row is a phase decision this draft makes between real options (PROCESS §3). Each needs Miguel's approval before
the spec is APPROVED. The "Recommendation" column is the drafter's; "Other options" names what each alternative
decides. Rules this spec states from evidence, with no real alternative left, are not rows; §10.2 maps them.

### 10.1 Decision rows

| ID | Question | Recommendation | Other options | Evidence | Origin | Status |
|---|---|---|---|---|---|---|
| SD1 | What shape does the shared form layer take? | A `FormControl` mixin in `line-core` (`src/form-control.ts`, root export) over `FormAssociated(LineElement)`. It implements the three form callbacks, the value model, validity, the interaction state, implicit submission and the reflection overrides; a component supplies hooks (§6.F.1) | (b) Fold the contract into `FormAssociated`, which changes the mixin Button already uses with its own callbacks; (c) a `ReactiveController`, which the platform cannot call, so each component forwards the three callbacks and two accessors by hand | plan §4.1; R1 §7 Q11; R2 §4; R9 §6 Q4; `packages/line-core/src/form-associated.ts:43-49` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD2 | Which value model do the form controls follow? | The native model: the `value` attribute (`checked` for a checkable control) is the default; the `value` property is the current value with a dirty flag; a reset returns to the attribute | (b) Zag's model: separate `value` (controlled) and `default-value` attributes; (c) the `value` attribute as the reflected current value, with the first connected value as the reset target | MANIFESTO Law 7 `:51`; R1 §2.4, §5 item 8; R2 §2.3; R7 §2.2 (Input and Textarea follow the native model through their control) | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD3 | How does the layer compute validity, and where do the messages come from? | The layer computes the flags of each component's declared constraints on every value change, with HTML's rule for each flag, so `minlength` and `maxlength` apply only after a user edit, as on a native input. Each message is the UA's localised text, read from a native `<input>` in the shadow root that carries the same constraint and value. A flag no native input can phrase, such as a partial DateInput entry, takes a consumer attribute the component spec names, with its behaviour when absent stated before approval. `custom-validity` overrides all. F1 gate: a native input that is not rendered yields the UA message in three engines `[INFERENCE]` | (b) R2 §4 item 1 literally: `tooShort` and `tooLong` for every value source, against HTML's rule, with consumer messages only, a message being required for every flag; (c) mirror the inner native input's validity, which covers no machine without an inner input | R2 §2.1, §4 item 1, §6 Q9; MANIFESTO Out of Scope `:66` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD4 | What sets the error-after-interaction state, and what is it called? | `user-invalid` (`data-user-invalid`, `:state(user-invalid)`): invalid and interacted. "Interacted" is set by a `focusout` that leaves the control after a user edit since the last reset, and by an `invalid` event at the host, which covers a submission attempt and also a script `checkValidity()`, because the platform cannot tell them apart. A reset clears it | (b) `focusout` only, so a blocked submission of an untouched field shows no Field error; (c) Field drives the state, so a control outside a Field has none; names `touched` (consumers compose it with `:invalid`) or `error` (taken by Field and Avatar, ARCHITECTURE §14.8 `:1281`) | R2 §2.2, §4 item 2, §6 Q4; whatwg/html#9878; R3 §2.7; D13 | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD5 | Which controls emulate implicit submission, and which fields block it? | PasswordInput, SearchInput, Number Input and DateInput run the HTML algorithm on Enter (`keydown`, not `isComposing`); Editable never does, because Enter commits its edit. The default button is the form's first native submit button: enabled, the layer clicks it, which keeps the submitter's `name=value`; disabled, nothing. With none, `requestSubmit()` runs when the form owns at most one blocking field, counting native text-like inputs (Input's slotted control included) and the emulating line controls. A line Button is never the default button | (b) No emulation, so Enter never submits from a line text control; (c) `requestSubmit()` always, which loses the submitter and ignores a disabled default button; (d) count every form-associated element as blocking | R2 §2.5, §4 item 5, §6 Q7; D3; ARCHITECTURE §7 `:413-414` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD6 | Are the Input and Textarea hosts form-associated? | (b) Yes, for the callbacks only: the host never sets a form value or validity, so the slotted control stays the only participant; it gets `formResetCallback` and `formDisabledCallback` and matches `:disabled` under a fieldset, and it stays `:valid` while the slotted control carries `:invalid`. C1 gate on the `FormData`, `checkValidity()` and reset-order facts | (a) A plain host, R7's probed "adopt" shape, which observes the slotted control's events, the form owner's `reset` event and the ancestor fieldsets to stay in sync | R7 §2.3, §7 Q2; ARCHITECTURE §7 `:426`, §14.8 `:1279`; R2 §2.3 | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD7 | What is the validity-change event of a Field-compatible line control? | `line-validity-change`, `detail: { valid: boolean; message: string }`, bubbling, not composed, on every change of `validity.valid` or `validationMessage` from any source | (b) The pair `line-invalid` and `line-valid` of ARCHITECTURE v0.8.28; (c) `line-validity` | R3 §2.5, §7 Q5; ARCHITECTURE §9 `:509`, `:519`; the Phase 1 `-change` naming (`line-icon-registry-change`) | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD8 | What does `<line-field error>` do to its control? | Presentation only: it shows the error slot, adds the error to the described-by list and sets `data-error`; the control's validity and `aria-invalid` stay the control's own. To block a submission the author or the surface sets the control's `custom-validity` (rule C4) | (b) Field also sets `ariaInvalid` on the control, a reflection property Law 5 allows; line controls would forward it, and it would compete with the control's own `aria-invalid`; (c) Field sets the control's validity, a method call Law 5 grants an adopting component, not an orchestrator | R3 §2.7, §7 Q6; ARCHITECTURE §9 `:507`, §6 `:391-392` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD9 | How does Field learn that a fieldset disabled its control? | Field re-reads `control.matches(':disabled')` on every native event and on `line-validity-change`, and a `MutationObserver` watches the `disabled` attribute of the control and of each ancestor `<fieldset>`, re-collected on connect and on `slotchange`. C6 gate on nested fieldsets in three engines `[INFERENCE]` | (a) Native events only, which stays stale, because a disabled control receives no events; (b) line controls emit a disabled-change event, which misses native controls (ARCHITECTURE §9 "any control") | R9 §2.1, §4, §6 Q6; ARCHITECTURE §9 `:500` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD10 | How are internal parts named? | A host attribute `<part>-label` (`toggle-label`, `clear-label`, `increment-label`, `decrement-label`), consumer text. A part whose action has a keyboard path on the role element (the steppers and the arrow keys) renders unlabelled as pointer-only, `aria-hidden="true"` and out of the tab order. A part with no other keyboard path (the password toggle) renders only when labelled. Value text, such as Slider's, takes a consumer template attribute, as AvatarGroup's `overflow-label` does | (b) Parts always render, and an unlabelled one fails axe as the author's error; (c) slots for part content, against ARCHITECTURE §13.3's "part (not slot)" | plan §5.5; PRD §1.7 `:173`; MANIFESTO Out of Scope `:66`; ARCHITECTURE §13.3 `:643-644`; Phase 1 spec AM-095 | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD11 | How do Input, Select, Number Input and Button align in size? | No `size` attribute in Phase 2. Each single-line control's frame takes `--line-<component>-height` with Button's default, `var(--line-size-7)`, and Button's padding and font-size defaults, so they align by default; consumers rescale through tokens | (b) A reflected `size` enum on every control and on Button, a cross-component API with no PRD basis; (c) each component spec sizes itself | plan §5.5; `packages/line-components/src/button/button.ts:80-83`, `:119-122`; ARCHITECTURE §17.2 rule C6 | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD12 | Which element applies the machine props in a light-DOM family? | (b) The family host spreads each part's props onto its `line-*` parts, the shape R4 probe P7 proved in four builds; each component spec documents the writes as hooks (Law 5) | (a) Each part applies its own props from the host's API through a module-private reference, so every write stays on the part's own element; not probed | R4 §2.5, §4 item 3, §6 Q5; R1 §2.9, probe P11; MANIFESTO `:47`; ARCHITECTURE §6 `:393` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD13 | What are the Radio Group and Toggle Group item tags? | `line-radio-group-item` and `line-toggle-group-item`, the `<family>-item` pattern of ARCHITECTURE §12 | (a′) `line-radio`, as other libraries name it; `line-toggle` rejected, because it reads as the ToggleButton §13.1 rules out | R8 §2.2, §6 item 2; ARCHITECTURE §12 `:595-612`, §13.1 `:632` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD14 | How is Select's listbox placed? | The implicit anchor: `showPopover({ source: trigger })`, `position-anchor: auto`, `anchor()` insets keyed by direction, `position-try-fallbacks: flip-block`, `min-inline-size: anchor-size(width)`; no positioner part, so the popper writes nothing. C11 gates RTL under the implicit anchor and a dialog opened over an open listbox | (b) Zag's popper on the popover box, probed and working, with inline styles on the box. The popper's 10.2 KB stays in the bundle either way | R4 §2.3 (P3, P7), §2.8, §4 item 4, §6 Q6; `docs/specs/0010-avatar-group.md` AM-006; ARCHITECTURE §16.2 `:1507` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD15 | Where does the zag#3088 remedy live? | `packages/line-components/src/shared/focus-outside.ts`, private shared code that Select uses now and the Phase 3 overlays can reuse. It closes with `CLOSE`, `src: 'focus-outside'`, `restoreFocus: false` when `focusout`'s `relatedTarget` leaves trigger and content | (b) A copy per component; (c) a public `line-core` helper, which adds published API | R4 §2.4, §4 item 5, §6 Q7; R1 §5 item 6; Phase 1 spec AM-002 | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD16 | Which keyboard model does Select follow? | Zag's select-only model in Phase 2: DOM focus on the listbox with `aria-activedescendant`, Tab held while the content has no tabbable descendant, no Page Up or Page Down, all documented as departures from the APG select-only combobox; Escape always closes. The search mode follows the C11 gate | (b) The APG keyboard through overrides of the machine's content `keydown`, not probed | R4 §2.4, §2.5, §6 Q8; R1 §2.6 | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD17 | What is the surface rule for form controls inside a host `<form>`? | `form=""` on every form participant the surface creates, set at creation: every form-associated line element, Button included, and every native form control it creates (§6.G.4) | (b) Join the host form on opt-in, with a naming rule and a security review of agent values in host submissions; (c) a nested `<form method="dialog">`, non-conforming and swallowing `submit` and `reset` propagation; (d) documentation only, which AM-081 rejected for Button | R6 §2.4, §4 item 1, §6 Q1; Phase 1 spec AM-081; MANIFESTO Law 7 `:51` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD18 | How do A2UI checks reach a control? | The first message of `validationErrors` goes to `custom-validity`, `''` when `isValid`; the Field `error` slot holds every message of `validationErrors`; v1.0 `warning` and `info` results show nowhere in Phase 2, documented; no required indicator is inferred | Join every message into the validity message; render warnings in the Field `hint` slot; infer `required` and `aria-required` from a `required` check on the bound path | R6 §2.2, §4 item 2, §6 Q3 | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD19 | Where do the A2UI value adapters live? | One explicit adapter per form type in the basic map (§6.G.8 table); the `line` catalog binds element members directly | A value-transform member in the descriptor binding map, so every catalog carries it | R6 §2.1, §4 item 5, §6 Q6; ARCHITECTURE §17.3 `:1647` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD20 | What happens to v0.9.1 `validationRegexp`, and which `autocomplete` does an agent password field get? | Accept `validationRegexp` and apply nothing, as the upstream reference does, and say so in the agent-facing description. The `autocomplete` token of an agent password field, and passwords in `sendDataModel`, go to G7's security review before merge | Map `validationRegexp` to `pattern`, which changes its regex dialect from A2UI's `u` flag to HTML's `v` flag; synthesise a `regex` check with a consumer message | R6 §2.3, §4 item 7, §6 Q8 | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD21 | What does a DateTimeInput with both flags explicitly `false` render? | What the reference renderer renders: the Field with its label and no control. Absent flags mean a date field (`enableDate ?? !enableTime`). G8 gate: `web_core` 0.16.1 tells an absent flag from an explicit `false` on the node | Render a date field for both explicitly `false`, departing from the reference renderer | R5 §2.6, §4 item 7, §6 Q9; R6 §2.3 | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD22 | Does Phase 2 state an SSR authoring rule? | Yes, R7 §6.3 (a): no DOM access beyond the Lit SSR shim in the constructor, `render()` or `willUpdate()`; form attributes read from attributes or reflected properties; the forms guide names the consumer's part; no test gate (§7.8) | (b) Record SSR as unsupported, with no rule; (c) ship SSR support, close to a stream, which O8 (a) excluded | R7 §2.5, §2.6, §6.3, §7 Q6; MANIFESTO Out of Scope `:65` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD23 | Where does the showcase read the auto-pair table? | A copy of the PRD §9.5 pair table in `apps/site`, guarded by the S1 test, which compares each accent's pair with the computed `--line-gray-1` of a scope that has no `data-gray`; no published change | An `AUTO_PAIR` export in `line-schemas`, a published change in its own row | R10 §5 gap 3, §6 Q6 | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD24 | What are the v1.0 `line` catalog id and file? | Id `https://line-ui.websublime.com/a2ui/v1_0/catalogs/line/v1/catalog.json`, with the protocol segment placed as in the upstream basic ids and `v1` kept as the `line` catalog's own version; emitted to `@websublime/line-genui/catalog.v1_0.json`; `./catalog.json` stays the v0.9.1 catalog | `…/a2ui/catalogs/line/v2/catalog.json`, which spends the catalog's own version on a protocol change; a per-protocol directory of exports | R6 §2.5 (P4), §6 Q13; Phase 1 spec §10 SD42; ARCHITECTURE §17.3 `:1657`, `:1659` | Drafting, row 01-Z34 | Proposed — needs Miguel |
| SD25 | Which strings carry a date, a date-time and a time? | The HTML normalized strings at the field's granularity, for both the form value and the data model: `YYYY-MM-DD`, `YYYY-MM-DDTHH:MM` (seconds only at second granularity) and `HH:MM` (likewise). A time-only value carries no date (D18) | (b) The same form value, but data-model writes with seconds always, as the reference renderer writes `${date}T${time}:00`; (c) seconds always in both | R5 §2.6, §4 items 2 and 7; R6 §2.3; D18 | Drafting, row 01-Z34 | Proposed — needs Miguel |

### 10.2 Coverage of plan §5.5 and the (B) list

Every question plan §5.5 and its (B) list leave to this spec (`docs/plans/02-plan-essential-forms.md:463-542`), with
the place that answers it. "Rule" is a rule this spec states from evidence; "SDn" is a §10.1 row; "Deferred" names the
row and gate that settle it; "Miguel" is an action outside the documents (plan §10.1); "Decided" is a D-decision.

**Counts.** Plan §5.5, 9 items: SD 7, Deferred 2. The (B) list, 87 items: Rule 58, SD 22, Deferred 5, Miguel 1,
Decided 1. In all, 96 items: Rule 58, SD 29 (25 distinct rows), Deferred 7, Miguel 1, Decided 1.

| Item | Question | Answer | Where |
|---|---|---|---|
| §5.5-1 | The shared layer's API; Zag's inner input kept out of the form | SD1, SD2; the shadow root keeps the input out (rule) | §6.F.1 |
| §5.5-2 | The error-after-interaction state | SD4 | §6.F.1 |
| §5.5-3 | The surface rule for form controls in a host form | SD17 | §6.G.4 |
| §5.5-4 | Select's listbox layer and placement | SD14; the `popover` layer is a rule | §6.C.2 C11 |
| §5.5-5 | Radio Group and Toggle Group item tags; the R1 P3 gate | SD13; the gate is a rule | §4.2; §6.C.2 C9, C12 |
| §5.5-6 | A control size scale | SD11 | §6.C.1 |
| §5.5-7 | Each control's static fallback and what it submits | Deferred: each C row names its template under the §6.C.1 rule; C4 returns to Miguel if it needs a native date input | §6.C.1; §6.C.2 |
| §5.5-8 | RTL, touch and pointer for the custom machines | Deferred: the C1, C2, C3, C5 and C6 gates under the §6.C.1 rule | §6.C.1 |
| §5.5-9 | Consumer-supplied labels of internal parts | SD10 | §6.C.1 |
| R1 Q3 | Trusted `input` under rule C3 | Rule: passes, documented per component | §6.F.1 Events |
| R1 Q6 | Switch `role="switch"` | Rule, with a gate | §6.C.2 C10 |
| R1 Q7 | Number Input attribute format and the `valueAsNumber` event | Rule | §6.C.2 C14; §6.F.1 |
| R1 Q8 | Multi-value submission; `null` without `name` | Rule | §6.F.1 Form value |
| R1 Q9 | zag#3239 | Rule, with a gate | §6.C.2 C9 |
| R1 Q10 | PasswordInput hidden on owner reset and submit | Rule, with a gate | §6.C.2 C2 |
| R1 Q11 | The shared-layer API | SD1 | §6.F.1 |
| R1 rec 1 | `id` and `getRootNode` in every props function | Rule | §6.F.2 |
| R1 rec 8 | Number Input applies its initial value once | Rule | §6.C.2 C14 |
| R1 rec 4, R9 Q5 | Zag's fieldset tracking inert or overridden | Rule: inert, no shadow `<fieldset>` above a machine input | §6.F.1 Disabled |
| R1 Q12 | Tier inputs | Decided: D15; PasswordInput Custom (2026-11-27) | §4.2 |
| R2 Q4 | What sets the error-after-interaction state; its name | SD4 | §6.F.1 |
| R2 Q5 | What "restore where supported" proves | Rule | §6.F.1 Acceptance; §7.6 |
| R2 Q6 | The identity-stamped string state | Rule | §6.F.1 Restore |
| R2 Q8 | Composed line form controls stay in light DOM | Rule | §6.C.1 Composition |
| R2 Q9 | Validation messages | SD3 | §6.F.1 Validity |
| R2 Q10 | The `form-associated.ts:48` comment | Rule | §4.1; §6.F.1 |
| R2 Q11 | x86_64 Linux WebKit | Rule: CI before a WebKit claim | §7.6 |
| R2 Q12 | Password managers | Rule: best effort, no automated claim; a manual check is Miguel's | §6.C.2 C2 |
| R2 rec 1 | Validity computed in the layer | SD3 | §6.F.1 Validity |
| R2 rec 3 | Everything reset in `formResetCallback` | Rule | §6.F.1 Reset |
| R2 Q7 | Which controls emulate implicit submission; which fields block | SD5 | §6.F.1 |
| R2 Q1 | The forms-guide warning on Firefox `:user-invalid` | Rule | §6.D.2 |
| R3 Q2 | Zag's label part rendered or replaced | Rule: no Zag `aria-labelledby` on the role element; reflection | §6.C.1 Role element |
| R3 Q3 | `<label for>` or click forwarding; the named `generic` host | Rule: Field never writes `for` (Law 5); author `for` works natively | §6.C.2 C6 |
| R3 Q4 | Event `detail` types and `composed` | Rule: typed `detail.value`, bubbling, not composed | §6.F.1 Events |
| R3 Q5 | The validity-change event name | SD7 | §6.F.1 |
| R3 Q6 | `<line-field error>` visual only or validity | SD8 | §6.C.2 C6 |
| R3 Q8 | Uniform `required`, `readOnly`, `value` reads | Rule | §6.F.1 Field hooks |
| R3 Q9 | Reference target later | Rule: not in Phase 2, with a revisit trigger | §6.C.1 |
| R3 Q10 | Host roles | Rule: roles on native elements wherever possible | §6.C.1 |
| R3 Q11 | Engine-tree assertions; the private WebKit path | Rule: CDP plus Playwright; the WebKit path is Miguel's | §7.3 |
| R3 Q12 | Slotted label text | Rule | §6.C.1 |
| R3 Q13 | Linux x86_64 check | Rule | §7.6 |
| R4 Q5 | The family part and props split | SD12 | §6.C.1 |
| R4 Q6 | Implicit anchor or popper; RTL; dialog stacking | SD14, with C11 gates | §6.C.2 C11 |
| R4 Q7 | The zag#3088 remedy's location | SD15 | §6.C.2 C11 |
| R4 Q8 | Tab trap against the APG keyboard | SD16 | §6.C.2 C11 |
| R4 Q9 | Form value through `ElementInternals`; the hidden `<select>` | Deferred: the C11 spec renders it or not after a probe; the value rule is §6.F.1 | §6.C.1 Hidden machine inputs |
| R4 Q10 | The surface render root | Rule: light DOM; the focus-outside remedy covers any shadow root | §6.C.1; §6.C.2 C11 |
| R4 rec 7 | The required Select tests | Rule | §6.C.2 C11 gates |
| R5 Q2 | ISO form value, empty while incomplete | Rule | §6.C.2 C4 |
| R5 Q3 | Range through component validity; time bounds | Rule | §6.C.2 C4 |
| R5 Q4 | IME and digit normaliser | Rule, with a gate | §6.C.2 C4 |
| R5 Q5 | "Empty" and the live-region move | Deferred: the C4 gates; "Empty" is §11.1 Q1 | §6.C.2 C4 |
| R5 Q6 | iOS VoiceOver pass | Miguel (plan §10.1) | §6.C.2 C4 |
| R5 Q7 | Screen-reader verification | Rule | §7.3 |
| R5 Q9 | A2UI flag defaults | SD21 | §6.G.8 |
| R5 Q12 | Range selection out of Phase 2 | Rule | §2 |
| R5 Q13 | DateInput's static fallback | Deferred: the C4 gate | §6.C.2 C4 |
| R5 rec 9 | `createCalendar` as an opt-in | Deferred: the C4 spec picks the mechanism; the Gregorian default is a rule | §6.C.2 C4 |
| R6 Q1 | The surface rule, Button included | SD17 | §6.G.4 |
| R6 Q3 | Checks to the validity message, warnings, required indicator | SD18 | §6.G.7 |
| R6 Q4 | First-render error against the interaction state | Rule: validity at once, shown after interaction (D13) | §6.G.7 |
| R6 Q6 | Value adapters | SD19 | §6.G.3; §6.G.8 |
| R6 Q7 | The ChoicePicker matrix; when Select renders | Rule | §6.G.8 |
| R6 Q8 | `validationRegexp`, `obscured` autocomplete, security review | SD20 | §6.G.7 |
| R6 Q9 | Missing labels | Rule: `MISSING_ACCESSIBLE_NAME` | §6.G.7 |
| R6 Q10 | Slider `step` default and rounding | Rule, with the C13 gate | §6.G.8; §6.C.2 C13 |
| R6 Q11 | ISO forms per flag | SD25 | §6.G.8 |
| R6 Q15 | The `web_core` 0.16.1 pin AM | Rule | §6.G.1 |
| R7 Q5 | The `:not(:defined)` warning | Rule | §6.D.2 |
| R7 Q6 | An SSR-tolerant authoring rule | SD22 | §7.8 |
| R7 Q7 | Lazy `line-core` sheets | Rule: out of Phase 2 | §2 |
| R7 Q8 | SSR rows for Avatar, AvatarGroup, Badge | Rule: none; R7 is the record | §2 |
| R7 Q9 | Hydrate-support docs | Rule | §6.D.2 |
| R7 Q10 | Framework notes | Rule: documentation only | §6.D.2 |
| R7 Q12 | R1 and R2 probes on the slotted-native anatomy | Rule | §6.C.2 C1 |
| R7 Q2 | Input and Textarea hosts and `formAssociated`; rule C4 to the slotted control | SD6; `setCustomValidity()` is a rule | §6.C.2 C1 |
| R8 rec 1 | Independent entries and tags | Rule | §4.2 |
| R8 Q2 | Item tag names | SD13 | §4.2 |
| R8 Q7 | The report's baseline row and comment | Rule: keep `export *`, correct the comment | §6.P.1 |
| R8 Q11 | A derived CDN import map | Rule | §6.P.3 |
| R8 Q12 | Shared wrappers for Range Slider and Segmented Control | Rule: no Phase 2 action; a later wrapper goes to `src/shared/` (Phase 1 spec AM-002) | — |
| R9 Q2 | Where `reset.fieldset.css` applies | Rule, with the C7 gate | §6.C.2 C7 |
| R9 Q3 | Non-form-associated controls under a disabled Fieldset | Rule: Phase 1 spec SD36 stands | §6.C.2 C7 |
| R9 Q4 | The layer owns the disabled state and never writes the host's `disabled` | Rule | §6.F.1 Disabled |
| R9 Q6 | Field learns fieldset-disabled | SD9 | §6.C.2 C6 |
| R9 Q9 | The disabled assertions | Rule | §6.F.1 Acceptance; §7.6 |
| R9 Q10 | A CI run before WebKit claims | Rule | §7.6 |
| R10 Q5 | The control mapping | Rule | §6.S.1 |
| R10 Q6 | The auto-pair source | SD23 | §6.S.1 |
| R10 Q7 | CSS delivery | Deferred: the S1 implementer records it (Phase 1 spec SD73 precedent) | §6.S.1 |
| R10 Q8 | Query string and first-paint script | Rule: query string from the panel form; the first-paint script is the implementer's | §6.S.1 |
| R10 Q9 | Controls inside or outside the themed scope | Rule: outside | §6.S.1 |
| R10 Q11 | Requirements for the component specs | Rule | §6.C.2 C9, C11, C12, C13 |
| R10 Q12 | The showcase's axe combinations and baselines | Rule | §6.S.1 |
| R6 Q13 (outside the plan's list) | The v1.0 `line` catalog id | SD24 | §6.G.2 |

---

## 11. Open Questions

### 11.1 Questions for Miguel

1. **DateInput's "Empty".** `@zag-js/date-input` 1.49.0 announces a fixed English "Empty" with no translation hook
   (R5 §2.5). MANIFESTO Out of Scope says locale data a dependency supplies is not bundled i18n only when the consumer
   can override it (`:66`), and this string cannot be overridden. Options: (a) accept the string until upstream adds a
   `translations` key (plan §10.1), with an Out of Scope sentence that says so; (b) DateInput replaces Zag's
   announcement with its own once the moved live region (§6.C.2 C4) lets it, which 1.49.0's lack of an opt-out may
   prevent; (c) DateInput does not ship until upstream adds the key. The drafter leans to (b) if the C4 live-region
   probe shows the region's text can be owned, else (a).
2. **The 25 rows of §10.1.** Each needs approval or another option before the spec is APPROVED (PROCESS §3).
3. **PasswordInput and restore.** If the C2 probe finds that a native `<input type="password">` restores nothing, the
   rule of §6.F.1 makes PasswordInput restore nothing either. Plan §7.1 asks every form-associated component for
   "state restore where the engine supports it" (`docs/plans/02-plan-essential-forms.md:634`). Does that wording cover a
   control whose native counterpart the engine never restores, or does the plan need a sentence (§11.2 item 11)?
4. **G1 and G2 before the first wave.** Plan §2.4 has every Phase 2 component ship its descriptor in the same PR, and
   plan §6 puts stream G after the first wave. This draft runs G1 and G2 before the first wave, so the first-wave
   descriptors derive both protocol versions, and keeps G7, the TextField and CheckBox mapping, after it (§6.0). Is that
   order acceptable?

### 11.2 Document changes this spec needs

The main session lands each change; this row edits none of these documents.

| # | Document and locator | Change | When |
|---|---|---|---|
| 1 | `docs/PROCESS.md:108` | "the phase spec's file-class table (Phase 1 spec §4)" points at this spec's §4.0 | The Phase 2 ledger PR (plan §4.0, §10 step 6) |
| 2 | Phase 1 spec §10 SD6, §6.G.4 pin test, §8 web_core row | `@a2ui/web_core` exactly 0.16.1, with R6 §4 item 12's five items | G1's first commit (an `AM-nnn` row) |
| 3 | Phase 1 spec §10 SD43, SD45, SD51, §6.G.2, §6.G.4 | The v1_0 basic id beside v0_9; the versions advertised, accepted and emitted; `"1.0"` envelopes | G2's first commit |
| 4 | Phase 1 spec AM-081 and §6.G.4 Button block | The Button rule becomes the surface form rule for every form participant (§10 SD17) | G4's first commit |
| 5 | Phase 1 spec §6.G.4 | The agent Button disabled while its checks fail | G5's first commit |
| 6 | `docs/ARCHITECTURE.md:389`; `docs/PRD.md:175` | Drop or restate the run-time catch's `[INFERENCE]` and "not yet probed" | After F3's gate |
| 7 | `docs/ARCHITECTURE.md:396`, `:645` | Drop the live-region move's `[INFERENCE]`, or return to Miguel | After C4's gate |
| 8 | `docs/PRD.md:280`; `docs/ARCHITECTURE.md:1432` | Autofill detection per engine | After C1's gate |
| 9 | `docs/ARCHITECTURE.md:1499` | "The Phase 2 spec confirms the `inputmode` in three engines" becomes the confirmed fact | After C14 |
| 10 | `docs/ARCHITECTURE.md:426`, `:509`, `:612`, `:1634` | Name the Input and Textarea host shape (SD6), the validity-change event (SD7) and the item tags (SD13), which these lines leave to this spec | After Miguel approves those rows (optional; the delegation stays true) |
| 11 | `docs/plans/02-plan-essential-forms.md:634` | The restore wording, if §11.1 Q3 needs it | After the C2 probe |
| 12 | `docs/MANIFESTO.md:66` | An Out of Scope sentence on a dependency string with no override, if §11.1 Q1 picks (a) | With Miguel's answer |
| 13 | `docs/plans/02-plan-essential-forms.md:614` | The §6 diagram: G1 and G2 before the first wave (§11.1 Q4); the O4 baseline landed in row 01-Z14 | With Miguel's answer |
| 14 | `docs/PRD.md:139`, `:221`, `:1840`; `docs/MANIFESTO.md:33`; `docs/ARCHITECTURE.md:1738-1739` | The renderer and `line-icons/a2ui` leave preview: a PRD revision-log entry with ARCHITECTURE and MANIFESTO aligned (PROCESS §3) | At the phase exit, G9 or Z1 |

---

## 12. Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|

---

*End of spec.*
