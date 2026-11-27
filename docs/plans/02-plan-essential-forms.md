# PHASE PLAN: Phase 02 — Essential Forms

**Status:** APPROVED — Miguel at the plan gate on 2026-11-25 (row 01-Z11), after the plan↔PRD lens passed in round 2. Miguel resolved O1–O8 (§5.4, §11). Row 01-Z13 landed the O6 (c) locator policy (#366), and PRD v0.8.36, ARCHITECTURE v0.8.28 and the MANIFESTO revision of 2026-11-25 land the decisions that O3 (b), O5 (b) and O8 (a) need, in one commit with this plan (§10). Row 01-Z27 on 2026-11-26 realigns the live `docs/PRD.md` locators by one line to PRD v0.8.37, whose revision note moves them (Source PRD line). Row 01-Z29 on 2026-11-27 revises §1–§11 to the post-research decisions D1–D33 (§5.6) and closes the §5.7 gaps, with PRD v0.8.38, ARCHITECTURE v0.8.29 and the MANIFESTO revision of 2026-11-27 in one commit (§10 step 4).
**Author:** line://ui orchestrator (row 01-Z11)
**Date:** 2026-11-25
**Phase Version Target:** `line://ui` v0.3.0 (also called "Phase 2" in the PRD)
**Source PRD:** [`docs/PRD.md`](../PRD.md) (v0.8.38)
**Source Architecture:** [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) (v0.8.29)

> **What this document is.** A phase plan (PROCESS §1–§2, the lifecycle and gate rules). It sets scope, streams,
> dependencies, research targets, acceptance criteria and risks for Phase 2 (PRD §7.4, the Essential Forms phase).
>
> **What this document is NOT.** It is not a spec. The research notes and `docs/specs/02-spec-essential-forms.md`
> come after plan approval. The plan follows the PRD; where it finds the PRD, ARCHITECTURE or MANIFESTO out of date
> against upstream or against each other, it names the gap (§5.7) and routes it to a fork, a research item or the
> post-research revision, and changes none of them itself (PROCESS §1, §3).

---

## 1. Phase Overview

Phase 2 ships the 15 form components of PRD §7.4 in the `@websublime/line-components` umbrella. It is "the first
substantial Zag.js integration in forms", and it validates the machine + Lit + parts pattern in form contexts, Field
orchestration, `formAssociated` integration, and the slot/part decision rule for internal elements such as a toggle,
a clear button and steppers (PRD §7.4, `docs/PRD.md:973`).

Two facts shape the phase more than the component count.

1. **The form contract is not in `line-core` yet.** The `FormAssociated` mixin forwards the `ElementInternals`
   methods and declares the lifecycle callbacks, but it implements no value, default value, reset, restore, disabled
   or constraint validation (`packages/line-core/src/form-associated.ts:76-125`). On a form-associated custom
   element, `required`, `pattern` and `minlength` take effect only through `setValidity`, as ARCHITECTURE §7 now
   states (`docs/ARCHITECTURE.md:408`). Eleven of the 15 components are form-associated (ARCHITECTURE §7, `:417`);
   Input and Textarea take an author's native control slotted in light DOM, and Field and Fieldset are not form
   controls. Either each of the eleven builds this contract or one shared layer does (O1).
2. **Zag's form wiring does not reach a light-DOM form from a shadow root.** Most Phase 2 pre-built machines carry
   their value on a hidden or visible native input with `name` and `form` props (toggle-group has no input at all,
   and password-input has no `form` prop). Checkbox, switch, number-input and select track reset and disabled
   through `input.form`; date-input, editable, toggle-group and password-input track neither. A native input inside
   a shadow root has no form owner in the page, and `closest('form')` and `closest('fieldset')` return `null`, in
   four engine builds (R1 §2.3, probe P1). The host then drives `setFormValue`, `formResetCallback` and
   `formDisabledCallback` itself (§2.3, R1).

### 1.1 What the phase validates

PRD §7.4 lists what the phase validates.

- The machine + Lit + parts pattern in form contexts, with pre-built and custom machines at scale.
- Field orchestration.
- `formAssociated` integration.
- The slot/part decision rule for internal elements (toggle, clear, increment).

### 1.2 Inputs from Phase 1

| Input | State | Source |
|---|---|---|
| Retrospective hand-off 1: the SD76 widening duty | Binds the first Phase 2 PR that adds a `minor` changeset for `line-components` or `line-icons` (§2.6) | `docs/retrospective/01-phase-01-retro.md`, Hand-off 1; Phase 1 spec §7.2 |
| Retrospective hand-off 2: the open items | Triaged by Miguel on 2026-11-25: rows P17, P18, C33, D5 and Z12 in the Phase 1 ledger; the WebKit and `web_core` scaling item is a risk here (§8); three items closed | `docs/plans/01-tasks-core-primitives.md` (row 01-Z11 commits) |
| Retrospective hand-off 3: the locator policy | A plan fork (O6) | Retrospective Hand-off 3 |
| Retrospective hand-off 4: rules over lists, probes before agent-facing claims | Plan rules (§5.3) | Retrospective lessons 1 and 2 |
| `FormAssociated` mixin | Exists; forwards `ElementInternals`, implements no form contract; `formStateRestoreCallback` is declared and tested nowhere | `packages/line-core/src/form-associated.ts`; `packages/line-core/__tests__/integration/form-associated/form-associated.e2e.ts` |
| Button's form behaviour | The Phase 1 reference: disabled from a `fieldset` through `formDisabledCallback`, submit through a temporary native submitter, reset, and external validity through `custom-validity`, which "sets the convention for the Phase 2 form controls" | `packages/line-components/src/button/button.ts`; `docs/specs/0002-button.md:356` |
| Agent contract C1–C9, htmx C9 rule and harness, visual tier and Roles baselines, axe tier, CEM, `release-records` | Carried as obligations; Phase 2 adds no template work for them | ARCHITECTURE §17.2; Phase 1 spec §6.C.6, §7.2, §7.4 |
| Open Phase 1 rows | D5 lands before the first Phase 2 release. P17 (the Button manifest `type`) is best done before the Input and Select specs. P18, C33 and Z12 are independent. `00-Z29` stays `blocked` on Biome | Phase 1 ledger; `docs/plans/00-tasks-design-system.md:143` |

---

## 2. Scope — In

### 2.1 The 15 components

| Component | PRD tier (§4.2) | Form participation (ARCH §7) | Pre-built machine on npm (1.49.0 on 2026-11-25) | Spec |
|---|---|---|---|---|
| Input | Custom | the author's slotted native `<input>` (D1) | — | `0023-input.md` |
| PasswordInput | Custom (settled 2026-11-27, row 01-Z29) | form-associated | `@zag-js/password-input`, not used | `0024-password-input.md` |
| SearchInput | Custom | form-associated | — | `0025-search-input.md` |
| DateInput | Pre-built (D15) | form-associated | `@zag-js/date-input` | `0026-date-input.md` |
| Textarea | Custom | the author's slotted native `<textarea>` (D1) | — (`@zag-js/auto-resize` helper) | `0027-textarea.md` |
| Field | Custom | none | — (`@zag-js/field` has only 2.0.0-next releases; npm `latest` points at 2.0.0-next.4) | `0028-field.md` |
| Fieldset | Static | none; wraps an authored native `<fieldset>` (D19) | — (`@zag-js/fieldset` likewise) | `0029-fieldset.md` |
| Checkbox | Pre-built | form-associated | `@zag-js/checkbox` | `0030-checkbox.md` |
| Radio Group | Pre-built | form-associated | `@zag-js/radio-group` | `0031-radio-group.md` |
| Switch | Pre-built | form-associated | `@zag-js/switch` | `0032-switch.md` |
| Select | Pre-built | form-associated | `@zag-js/select` | `0033-select.md` |
| Toggle Group | Pre-built | form-associated | `@zag-js/toggle-group` (no hidden input) | `0034-toggle-group.md` |
| Slider | Pre-built | form-associated | `@zag-js/slider` | `0035-slider.md` |
| Number Input | Pre-built | form-associated | `@zag-js/number-input` | `0036-number-input.md` |
| Editable | Pre-built | form-associated | `@zag-js/editable` | `0037-editable.md` |

- Spec numbers 0023–0037 are fixed by the PRD §4.2 links. Each component spec is written just-in-time and is
  APPROVED before its code (PRD §8.2), with the Agent contract section filled (PRD §8.1).
- PRD v0.8.38 settles both open tiers in §4.2 and §7.4 (`docs/PRD.md:279`, `:281`, `:958`, `:960`). DateInput is
  pre-built on `@zag-js/date-input` (D15). PasswordInput is Custom: Miguel made it the form-associated text control of
  the O1 validating set on 2026-11-27, which settled its tier in place of D16's "the Phase 2 spec settles it".

### 2.2 Field orchestration

- Field connects a label, a hint, an error and a required indicator to any slotted control, native or line, never
  imports it, and reflects `data-focused`, `data-filled`, `data-error`, `data-disabled`, `data-readonly` and
  `data-required` (ARCHITECTURE §9, `docs/ARCHITECTURE.md:489-513`; MANIFESTO Law 4).
- Its state comes from explicit props first, then native events and a re-read of `validity` for any control, then a
  line control's validity-change event for changes no user event signals (ARCHITECTURE §9, `:497-500`; D11). A line
  control emits `line-change`, `line-input` and that event; `line-focus` and `line-blur` are dropped.
- `data-error` is the Field's shown error, and the control's `data-invalid` is its validity (`:495`; D13).
- Labelling is element reflection: the Field writes `control.ariaLabelledByElements` and
  `control.ariaDescribedByElements`, and a line control forwards them to its role element (`:502`; D12). The
  mechanism had been deferred to "the Field spec" twice (Phase 1 plan §5.6, `docs/plans/01-plan-core-primitives.md:511`).
- The floating label is not built in. `data-focused` and `data-filled` enable it in pure CSS, and Storybook
  documents the pattern (ARCHITECTURE §9, `:506`; PRD §7.4 exit).

### 2.3 Native form participation

Every form-associated component proves, in the Browser tier and in three engines:

- its value in `FormData` and in the request a `<form>` sends, under its `name`;
- `form.reset()` back to its default value;
- constraint validation (`required` and each constraint attribute the spec gives it), `checkValidity()`,
  `reportValidity()`, `:invalid`/`:valid`, and submission blocked while invalid;
- external validity through `custom-validity` (C4);
- the `form` attribute, and disabled from a native `<fieldset>` ancestor, including one inside `<line-fieldset>`
  (D19);
- state restore on history navigation, where the engine supports it (R2).

Input and Textarea prove the same through the author's slotted native control, which the platform handles natively
(MANIFESTO Law 8; D1). The exit criterion of PRD §7.4 names submit, reset and validation (`docs/PRD.md:980`); restore
and the `form` attribute are plan additions (§7).

### 2.4 Agent-driven UI

- Every Phase 2 component ships its descriptor in the same PR (PRD §7.3, `docs/PRD.md:903`), with the Agent
  contract C1–C9 filled.
- Stream G maps the five A2UI basic-catalog types that ARCHITECTURE §17.3 schedules for Phase 2: TextField,
  CheckBox, ChoicePicker, Slider and DateTimeInput (`docs/ARCHITECTURE.md:1667-1671`).
  - The surface wraps all five in `<line-field>`, so C4's error slot exists for each (`:1678`; D26).
  - TextField creates the native `<input>` or `<textarea>` that `<line-input>` and `<line-textarea>` slot (`:1667`; D1).
  - ChoicePicker's checkbox mode is a `<line-fieldset>` around a native `<fieldset>` that the surface creates,
    holding `<line-checkbox>` elements (O7 (a), D19). A `filterable` single-selection ChoicePicker maps to
    `<line-select>` and its search, which carries combobox semantics (`:1669`; D14).
  - A time-only DateTimeInput maps to DateInput's time-only mode, built on the Zag 1.49.0 `formatter`. Its value
    carries no date, and the Phase 2 spec states its form (`:1671`; D18). The earlier "no Phase 2 target" for the
    time-only case is withdrawn.
  - The five types write the data model on `line-input` as well as on the C9 commit event, through a live-event
    member of the binding map, as A2UI v0.9.1 and v1.0 require; C9 is unchanged (`:1638`; D24).
- The agent Button is disabled while its node's checks fail, as both protocol versions require. This is a Phase 2 row
  against the Phase 1 surface (`:1666`; D27).
- A form-associated control that the surface renders inside a host-page `<form>` would add its field and its
  validity to that form, the hazard Phase 1 closed for Button (Phase 1 spec AM-081). The Phase 2 spec states one rule
  for every form-associated control the surface creates (R6, §5.5).
- A2UI v1.0 went final upstream on 2026-11-11 (`specification/versions.json` lists v1.0 as `current` and v0.9.1 as
  `previous`). Per O3 (b), PRD v0.8.36 §7.4 schedules the v1.0 `line` and `basic` catalogs beside v0.9.1, the
  surface on both protocol versions and the end of the preview at the phase exit, with an exit criterion
  (`docs/PRD.md:975`, `:986`). MANIFESTO principle 8 (`docs/MANIFESTO.md:33`), PRD principle 6, §2 and Appendix D
  (`docs/PRD.md:137`, `:219`, `:1838-1839`) and ARCHITECTURE §17.3 and §17.7 (`docs/ARCHITECTURE.md:1648`,
  `:1729-1730`) keep the renderer and `line-icons/a2ui` previews until `line-genui/a2ui` targets the final A2UI
  v1.0. v1.0 also changes the form schemas: `checks` becomes `@checks` with a `ValidationResult`, TextField gains
  `placeholder`, drops `validationRegexp` and requires `value`, and Slider gains `steps` as a count of divisions.
- The v1.0 `line` catalog takes its own catalog id, each descriptor derives a Zod schema per protocol version from one
  declaration, the v1.0 basic implementation registers under the v1_0 basic id, and one session serves both
  versions with a per-version data-model call (`docs/ARCHITECTURE.md:1643`, `:1648`, `:1652`; D25).
- A v1.0 Text heading marker (`#`–`#####`) maps to `<h1>`–`<h5>` without a Markdown renderer (`:1660`; D28).

### 2.5 Storybook

- The `Components/Forms — Essential/<Name>` stories, autodocs from the shipped manifest, and the visual baselines
  of every story (Phase 1 conventions; PRD §5.2.1).
- A `Patterns` section with the floating label pattern and its full CSS (PRD §5.1, `docs/PRD.md:510-518`; §7.4
  exit). The section does not exist yet.

### 2.6 Platform and release

- The Phase 2 Zag machines become `line-components` dependencies. The dependency baseline is fork O4.
- The Zag machines keep caret ranges (`^1.49.0`), and the docs tell consumers to keep every `@zag-js/*` package on
  one version, because a tree with mixed versions bundles two copies of `@zag-js/core` (R8 §2.4; D23).
- `@internationalized/date` is a `line-components` dependency at `^3.12.4`. `@zag-js/date-input` declares it only as
  an unbounded peer, and the dependency gives consumers the version R5 and R8 measured (R8 §6 item 8; D22).
- The SD76 widening duty: the first Phase 2 PR that adds a `minor` changeset for `line-components` or `line-icons`
  widens both `line-genui` peer ranges to `|| ^0.3.0` on `main` before `changeset version` builds the Version PR
  (Phase 1 spec §7.2). The peers read `workspace:^0.1.0 || ^0.2.0` today
  (`packages/line-genui/package.json:37-40`).
- The version guard: Miguel checks that no Version PR of Phase 2 takes a package past `0.3.x` (PROCESS §6).
- Every Version PR carries its release-time records and passes the required `release-records` status (Phase 1 spec
  §7.2, AM-114).
- A phase-exit row brings every package that is still `0.2.x` to `0.3.0`, as Phase 1 row P13 did.
- The per-component size report keeps the < 5 KB gzipped soft target (PRD §1.6, §1.7), with 1 KB = 1,000 B and the
  CI's GNU gzip as the reference. It keeps the Phase 1 SD21 rows, which count the component alone with every machine
  external, and gains a per-machine table: each Zag machine's marginal weight over the report's Zag baseline row and
  its code-split chunk. A Phase 2 row adds the table (R8 §6 item 5; D21).

### 2.7 Release target

Phase 2 ships `line://ui` v0.3.0: each package's first Phase 2 `minor` is its `0.3.0`, and later Phase 2
changesets for that package are `patch` (PROCESS §6).

### 2.8 Site

Per O5 (b), the site's Theming showcase dogfoods the Phase 2 controls and gates the exit: PRD v0.8.36 replaced the
§7.4 "**Parallel:**" line with an exit criterion (`docs/PRD.md:987`, `:989`). Phase 1 had left the showcase out on
purpose (Phase 1 plan O3 (c)). The showcase takes R10's set (D31):

- scope (a) of R10 §2.6, a minimal theme browser driven by Select, Radio Group, Switch, Toggle Group and Slider,
  with the contrast readout of scope (b);
- its own `/theming/` route (PRD §5.3, `docs/PRD.md:586`);
- a scoped preview, with the focus ring recomposed on the scope in site CSS, because the ring, gradient, highlight
  and SVG tokens resolve on `html` (PRD §9.4, `:1370`);
- one S row that opens once the five controls are `done`, as S1 did (§6).

The readout shows the computed contrast of each role pair while the primary label pair stays below 4.5:1 for 34 of
62 hue × mode pairs. A library contrast row brings normal-size labels to 4.5:1, which PRD §5.2.1 keeps as the bar
(`docs/PRD.md:557`; D29). A focus-ring token row picks the ring step that meets WCAG 2.1 SC 1.4.11 3:1, measured as R10
§2.5 measures (`:1299`; D30). Both are library rows outside the Phase 2 streams.

---

## 3. Scope — Out

- Combobox, Date Picker and Time Picker, the Phase 4 refinements of ChoicePicker and DateTimeInput
  (`docs/ARCHITECTURE.md:1674`).
- `line-form`, cross-field validation and FloatingField, which stay after 1.0 (PRD §7.11, `docs/PRD.md:1180-1181`;
  ARCHITECTURE §7).
- A `native-mobile` prop on Select (ARCHITECTURE §16.2, post-1.0).
- WebMCP for form-associated elements (ARCHITECTURE §17.8).
- Server-side A2UI → `<line-*>` HTML, and model-authored markup (PRD Appendix D).
- `@zag-js/field` and `@zag-js/fieldset`, which have only 2.0.0-next releases (npm `latest` 2.0.0-next.4, `next`
  2.0.0-next.2).
- The SSR/SSG investigation is not a stream: per O8 (a) it is one research question inside R7, with no exit
  criterion. PRD v0.8.36 §1.7 and the comparison table (`docs/PRD.md:168`, `:84`) and the MANIFESTO Out of Scope list
  (`docs/MANIFESTO.md:65`) now name it a Phase 2 research question, where they planned it "post-Phase 1".

---

## 4. High-Level Task Breakdown

### 4.0 Streams and owners

| Stream | Name | Owner |
|---|---|---|
| F | Form foundation in `line-core` (per O1): the shared form contract the 11 form-associated components use, and the controller changes D5 and D8 need | webcomponents-supervisor |
| C | The 15 components (spec + implementation + descriptor + stories + changeset) | webcomponents-supervisor |
| G | Agent-driven UI: the five basic-catalog types, the surface rule for form controls, and the A2UI version of O3 | webcomponents-supervisor |
| P | Platform and release: dependencies (O4), the SD76 widening, size and bundle checks, phase-exit minors | infra-supervisor |
| D | Documentation: the Storybook Patterns section and the floating label pattern, a forms guide, Getting Started | webcomponents-supervisor |
| S | Site: the Theming showcase (O5) | webcomponents-supervisor |
| Z | Repo-wide: the locator policy (O6), the phase exit and retrospective; the main session runs the exit sweep | Main session / per row |

The Phase 2 spec carries its own §4 file-class table; PROCESS §4 cites "Phase 1 spec §4" for it today, and the
ledger PR aligns that pointer, as row 00-Z49 did for Phase 1.

### 4.1 Stream F — form foundation (per O1)

- A shared form-control layer in `line-core` on top of `FormAssociated`: value and default value, `setFormValue`,
  reset, restore, disabled from `formDisabledCallback`, constraint validity with an anchor, the `custom-validity`
  convention, and the Field event contract (§5.5).
- `LineMachineController` gains the opt-in start after the first render that every Phase 2 machine takes, with the
  Phase 1 components left on the `hostConnected` default (ARCHITECTURE §6; D8).
- The controller catches run-time machine errors and switches to the static fallback, whose template wires its
  controls to `setFormValue` (ARCHITECTURE §6; D5).
- Its Browser-tier tests prove §2.3 on a test element before any component uses it.

### 4.2 Stream C — the 15 components

One row per component, in the order O1 sets. Each row follows the Phase 1 per-component obligations: spec APPROVED
before code, implementation, descriptor, stories, visual baselines, axe, htmx row, competitive-analysis row,
changeset (Phase 1 spec §6.C.6).

### 4.3 Stream G — agent-driven UI

- The basic map for TextField, CheckBox, ChoicePicker, Slider and DateTimeInput, each in `<line-field>`, with their
  validity from A2UI checks through C4 and their value written back on `line-input` and `line-change` (§2.4).
- The surface rule for form-associated controls inside a host form (§2.4).
- The agent Button disabled while its checks fail, a row against the Phase 1 surface (D27).
- The A2UI v1.0 work of O3 (b): v1.0 `line` and `basic` catalogs beside v0.9.1 under the shape of D25, the surface
  on both protocol versions, the five form types on both, v1.0 Text heading markers (D28), `@a2ui/web_core` moved to
  0.16.x through a spec AM, and the preview of `line-genui/a2ui` and `line-icons/a2ui` ending at the phase exit.

### 4.4 Stream P — platform and release

- The dependency baseline of O4 (c), before the first component row: the refresh within the current majors, plus
  `@changesets/cli` 3 and `@changesets/changelog-github` 1.
- `@internationalized/date` as a `line-components` dependency (D22), and the Zag machines on caret ranges (D23).
- The per-machine table of the size report (D21).
- The SD76 widening, on the first Phase 2 `minor` changeset PR.
- The phase-exit minors.

### 4.5 Stream D — documentation

- The Storybook `Patterns` section with the floating label pattern.
- A forms guide: native participation, the slotted native control of Input and Textarea, a native `<select>` in
  `<line-field>` as Select's no-JavaScript and OS-picker path, validity, Field, and the agent path.
- Getting Started for the form components, with the rule to keep every `@zag-js/*` package on one version (D23); row
  D5 of Phase 1 settles how its CDN snippets stay current.

### 4.6 Stream S — site

The Theming showcase, per O5 (b) and D31 (§2.8): built with the Phase 2 controls and an exit criterion.

### 4.7 Stream Z — repo-wide

- The locator policy of O6 (c), before the first Phase 2 component spec: row 01-Z13 in the Phase 1 ledger.
- The exit sweep before the last rows land, and the phase exit and retrospective (Phase 1 spec §6.Z.2, AM-115).

---

## 5. External Dependencies & Research Targets

PROCESS §2 requires one research note per item, at `docs/research/02-research-<slug>.md`. Research that
contradicts this plan returns to the plan and the PRD before any spec work.

### 5.1 Research targets

The ten notes were delivered on 2026-11-26 under rows 01-Z15 to 01-Z24 of the Phase 1 ledger. The targets below are
the questions as the plan gate set them, with the facts that row 01-Z29 corrected.

| Item | Research target |
|---|---|
| R1 Zag form machines in Shadow DOM | For each Phase 2 machine at the O4 baseline: how `LineMachineController` passes `getRootNode`; what the hidden or visible native input does inside a shadow root; replacing Zag's `closest('form')` reset and `closest('fieldset')` disabled tracking with the host callbacks; the native `input`/`change` events the machines dispatch against C3; zag#3088 (focus outside not detected in a shadow root) for Select; zag#3239 (hidden-input focus scroll) for Radio Group; number-input submitting its formatted string; toggle-group with no native input; the static fallback when a machine fails (MANIFESTO Law 9, PRD §1.7) and what then happens to the form value; RTL (`dir`) and touch and pointer behaviour for the custom machines (PRD §1.7) |
| R2 Form-associated platform contract | Constraint validation computed by the component (`required`, `pattern`, `minlength`, `min`/`max`, `step`) with an anchor; `:user-invalid`, which Chromium and WebKit never match on a form-associated custom element and Firefox matches from load, and an error-after-interaction state; reset; restore (WebKit restores a string or a `FormData` of strings, never a `File`, and no engine restores for autocomplete; a third-party report of Firefox handing one element's state to another); implicit submission from an inner `<input>`; autofill and password managers through an inner native input; three engines, Linux WebKit included |
| R3 Field and labelling | The Field labelling mechanism across the shadow boundary: reference target (Chromium only today), `ariaLabelledByElements` (all three engines, toward ancestor trees only), a host role, `<label for>` on a form-associated host; the Field event contract (`line-focus`, `line-blur`, `line-invalid`, `line-valid`) against C3 and C9; native controls inside Field (ARCHITECTURE §16.2 recommends a native `<select>` there); `data-error` vs `data-invalid` |
| R4 Select | Native or custom against MANIFESTO Law 8 and ARCHITECTURE §15–§16 (plan §5.7 row 2); "with search" (PRD §4.2) vs typeahead and the Phase 4 Combobox; the listbox in the top layer without Popover (Phase 3), through what Portal proved in Phase 1; mobile; zag#3088 |
| R5 DateInput | `@zag-js/date-input` vs a custom machine; its segments (`span` with `contentEditable` and `role: spinbutton`) against the per-segment `<input>` of ARCHITECTURE v0.8.28 §15.1 and the single text input of its §16.2; `@internationalized/date` weight; locale and granularity; the A2UI DateTimeInput `enableTime`; the Phase 4 DatePicker composition |
| R6 A2UI form types | The five basic types at v0.9.1 and v1.0: value binding, `checks`/`@checks` to C4 validity, ChoicePicker variants, TextField variants (`longText`, `obscured`, `number`), Slider `steps`; the host-form hazard of every surface-created form control, weighed against MANIFESTO Law 7 (`docs/MANIFESTO.md:51`) and C4 validity; the v1.0 catalog shape and `@a2ui/web_core` 0.16.x breaking changes on the v0_9 path (per O3) |
| R7 Progressive enhancement and SSR/SSG | Whether Input, Textarea and Select can stay functional without JavaScript (MANIFESTO Law 8, PRD §1.7 `:174`), for example through a slotted native control; a recorded "not feasible" is a valid outcome. Per O8 (a), the same note investigates SSR/SSG for the Phase 2 controls (declarative shadow DOM, Lit SSR, Astro, Nuxt, Next.js; PRD §1.7 `:168`) |
| R8 Packaging and weight | Entry points and families for the components ARCHITECTURE §12 did not list (Radio Group, Toggle Group, Checkbox, Switch, Slider, Number Input); gzipped weight of each new Zag machine and of `@internationalized/date` against the < 5 KB soft target |
| R9 Fieldset | Disabled propagation from a Fieldset to slotted controls, when a `<fieldset disabled>` inside the shadow root does not make light-DOM descendants disabled per HTML; native and line controls |
| R10 Theming showcase | Per O5 (b): the showcase scope on the Astro site, with the Phase 2 controls as its UI |

### 5.2 Upstream facts the research must re-check

- Zag `latest` was 1.49.0 against the lock of 1.47.0 at the plan gate; row 01-Z14 moved the lock to 1.49.0. 1.49.0
  carries Phase 2 fixes in checkbox and switch labelling, number-input typing, slider decimal steps and date-input
  locale, all confirmed by R1 (§2.1).
- `@a2ui/web_core` `latest` is 0.16.1 against the exact pin 0.14.0; 0.15.0 and 0.16.0 carry breaking changes, some
  on the v0_9 path. Moving the pin needs a spec AM (Phase 1 spec §10 SD6).
- `@changesets/cli` 3.0.3 and `@changesets/changelog-github` 1.0.1 are majors ahead of the repo (2.31.1, 0.7.0).
  Under v3 `changeset version` exits 1 when nothing is pending.
- Patches and minors: Bun 1.4.5, Biome 2.6.9, Playwright 1.65.1, `@axe-core/playwright` 4.14.1, Storybook 10.6.9
  (11 is a release candidate), Vite 8.3.8, Astro 7.4.13. TypeScript 7.0.2 and Lit 3.3.3 are current.
- `ElementInternals` is in all three engines from Safari 16.4, and `:state()` from Chrome 125, Firefox 126 and
  Safari 17.4.

### 5.3 Rules the Phase 2 spec applies

These follow the Phase 1 retrospective lessons and are not forks.

- Where a set of components will grow, the spec states a rule, not a list (lesson 1). The form contract, the Field
  event contract, the labelling hand-off and the surface rule for form controls are rules.
- Every agent-facing claim about layout, sizing or behaviour is probed in three engines before a descriptor or a doc
  states it (lesson 2).
- Form behaviour is proven in the Browser tier, never only in happy-dom, which fakes `attachInternals` (lesson 7).
- Linux WebKit runs in CI before a claim about WebKit holds (lesson 4).
- Field-related rows skip the Firefox axe scan until the repo takes Playwright 1.66. Playwright 1.65.1's Firefox
  (build 1572) crashes when page code or axe reads `ariaLabelledByElements` and a role locator runs on the same page
  (Mozilla bug 2090055); Firefox build 1575 and later pass (R3 §2.8; D32).

### 5.4 Decisions at the plan gate

Each fork names its options, what each decides, and a recommendation. Miguel resolves them at the plan gate.

#### O1 Build order and the form foundation

**Resolution:** (a) chosen — Miguel, 2026-11-25. Revised by Miguel on 2026-11-27 (row 01-Z29) after D1 made Input a
slotted-native control that no longer exercises the form-associated value path: PasswordInput replaces Input in the
validating set as its form-associated text control on a custom machine, and Input joins the first wave beside the
set, so stream G still maps TextField and CheckBox as (a) planned.

| Option | What it decides | Recommendation |
|---|---|---|
| (a) | A shared form-control layer in `line-core` first (stream F), proven by a validating set of Input (custom machine), Field (orchestrator) and Checkbox (pre-built machine on a hidden input); then stream G maps TextField and CheckBox on them; then the other 12, each with its descriptor | Recommended: 13 components need the same contract, the mixin has none of it, and Phase 1 validated on a set before the rest |
| (b) | The PRD §7.4 table order; each component builds its own form logic, as Button did | — |
| (c) | Field and the shared layer first, with no validating component set | — |

#### O2 Exit criteria

**Resolution:** (a) chosen — Miguel, 2026-11-25.

PRD §7.4 drops criteria that Phase 1 had (PRD §7.3, Phase 1 plan §7): the descriptor and the CEM drift and coverage
tests per component, the basic-catalog types, the surface rendering every agent-exposed component with zero axe
violations, bundle splitting, CDN delivery, the htmx row, the visual baselines and the release records. It also
names submit, reset and validation but not restore.

| Option | What it decides | Recommendation |
|---|---|---|
| (a) | Keep the 8 PRD §7.4 criteria in their wording and add the plan's criteria in italics in §7, as Phase 1 did | Recommended: PRD §7.3 already binds every later component to its descriptor (`docs/PRD.md:903`) |
| (b) | Revise PRD §7.4 to carry the added criteria | — |

#### O3 A2UI version

**Resolution:** (b) chosen — Miguel, 2026-11-25.

| Option | What it decides | Recommendation |
|---|---|---|
| (a) | Phase 2 stays on A2UI v0.9.1 and `@a2ui/web_core` 0.14.0; the v1.0 move is a later phase; `line-genui/a2ui` and `line-icons/a2ui` stay previews. Needs a MANIFESTO revision of principle 8 and a PRD revision of principle 6, §2 and Appendix D (`docs/PRD.md:137`, `:219`, `:1839`), with ARCHITECTURE `:1730`, the Phase 1 plan §3 and the site card aligned, so that each reads "until the package targets A2UI v1.0" | — |
| (b) | Phase 2 adds v1.0 beside v0.9.1: a v1.0 `line` and `basic` catalog, the surface on both protocol versions, the five form types on both, `web_core` moved to 0.16.x through a spec AM; `line-genui/a2ui` leaves preview at the phase exit. Needs a PRD revision of §7.4 (the v1.0 scope and its exit criterion) and Appendix D, ARCHITECTURE §17.3 and §17.7, and the same MANIFESTO principle 8 and PRD principle 6 and §2 rewording as (a) for the time until the exit | Recommended: v1.0 is final, the form types are where v1.0 changed most (`@checks`, `ValidationResult`, TextField, Slider), and Gemini and Compose still run v0.9.1, so both are needed; R6 confirms the cost before the spec |
| (c) | Phase 2 moves to v1.0 only. Needs the revisions of (b), and drops v0.9.1 consumers | — |

#### O4 Dependency baseline

**Resolution:** (c) chosen — Miguel, 2026-11-25, over the recommended (a): Changesets v3 and `changelog-github` 1 join the refresh row.

| Option | What it decides | Recommendation |
|---|---|---|
| (a) | A P row refreshes the dependencies within their current majors before the first component row (Zag 1.49, Bun 1.4.5, Biome 2.6.x, Playwright 1.65.1, Storybook 10.6.x, Vite 8.3.x, Astro 7.4.x), as Phase 00 row 00-Z20 did; `@a2ui/web_core` follows O3; Changesets v3 is a separate decision row. npm `@biomejs/biome@2.6.9` failed to install its platform binary on 2026-11-25 (`ETARGET`, Phase 1 retrospective), so the row probes the Biome version it can take | Recommended: the Phase 2 machines start on the version they will ship with, and the Zag fixes since 1.47 are Phase 2 fixes |
| (b) | Each component row adds or moves the packages it needs | — |
| (c) | As (a), with Changesets v3 and `changelog-github` 1.0 in the same row | — |

#### O5 Theming showcase

**Resolution:** (b) chosen — Miguel, 2026-11-25.

| Option | What it decides | Recommendation |
|---|---|---|
| (a) | The showcase runs in parallel, outside the exit criteria, as PRD §7.4 states | — |
| (b) | The showcase dogfoods the Phase 2 controls (Select, Slider, Switch, Radio Group, Toggle Group) and counts as an exit criterion; needs a PRD §7.4 revision, as v0.8.17 did for the Phase 1 landing page | Recommended: a theme browser is a natural consumer of exactly these controls, and the Phase 1 landing page found C30 and C31 before the release |
| (c) | The showcase leaves Phase 2 | — |

#### O6 Locator policy

**Resolution:** (c) chosen — Miguel, 2026-11-25. Row 01-Z13 lands it before the PRD revision of this gate, so that revision realigns no component-spec locator (Miguel, 2026-11-25).

Component specs cite the PRD, ARCHITECTURE and the phase spec by line. PRD and ARCHITECTURE revisions forced about
65 locator-only AMs in Phase 1, and the phase-spec locators already drift with no rule to realign them (Phase 1
retrospective, Open items).

| Option | What it decides | Recommendation |
|---|---|---|
| (a) | Keep live line locators and extend the PROCESS §3 realignment rule to every document that moves lines, the phase spec included | — |
| (b) | Component specs cite the PRD, ARCHITECTURE and the phase spec by section and a quoted phrase; line locators stay for code and research | — |
| (c) | Line locators pinned to a version: each component spec states the PRD, ARCHITECTURE and phase-spec versions it cites (the Governing sections pin already does for the PRD), its locators hold at that pin, and a later revision needs no realignment; a spec that adopts a newer version realigns once, in that change | Recommended: it keeps the precision Miguel chose over section-only citations in row 01-Z8 and removes the per-revision cost |

The chosen option changes PROCESS §3 and the component spec template in one Z row before the first Phase 2 component
spec (§4.7).

#### O7 ChoicePicker "checkbox group"

**Resolution:** (a) chosen — Miguel, 2026-11-25.

ARCHITECTURE v0.8.27 §17.3 mapped ChoicePicker to `<line-radio-group>`, "a checkbox group", `<line-select>` or
`<line-toggle-group>` (now `docs/ARCHITECTURE.md:1669`, reworded by O7 (a) and D19). The PRD catalogue has no
checkbox group.

| Option | What it decides | Recommendation |
|---|---|---|
| (a) | The surface renders a `multipleSelection` ChoicePicker with `displayStyle: checkbox` as a `<line-fieldset>` of `<line-checkbox>` elements; no new component; ARCHITECTURE §17.3 names that composition | Recommended: it uses two Phase 2 components and needs no PRD catalogue change |
| (b) | Add a CheckboxGroup as a 16th Phase 2 component, through a PRD §4.2 and §7.4 revision | — |
| (c) | Map it to `<line-toggle-group>` in multiple mode | — |

#### O8 SSR/SSG investigation

**Resolution:** (a) chosen — Miguel, 2026-11-25.

PRD v0.8.35 §1.7 and the PRD comparison table (now `docs/PRD.md:168`, `:84`, reworded by O8 (a)) and the MANIFESTO Out of Scope list
(`docs/MANIFESTO.md:65`) planned an SSR/SSG investigation for Astro, Nuxt and Next.js "post-Phase 1"; it is not a launch
blocker.

| Option | What it decides | Recommendation |
|---|---|---|
| (a) | Phase 2 carries the investigation as one research note, folded into R7 (progressive enhancement and declarative shadow DOM for the form controls), with no exit criterion | Recommended: progressive enhancement of Input, Textarea and Select (MANIFESTO Law 8) and server rendering ask the same question about markup that works before upgrade |
| (b) | The investigation moves to a later phase; the PRD and MANIFESTO wording changes from "post-Phase 1" to that phase | — |
| (c) | The investigation becomes a Phase 2 stream with an exit criterion; needs a PRD §7.4 revision | — |

### 5.5 Spec-level questions

These belong to the Phase 2 spec. They are neither research items nor plan forks. The post-research decisions
(§5.6) settled the tier of PasswordInput and DateInput, Select's anatomy and search, the Field event contract and
labelling mechanism, the Fieldset mechanism, the entry-point rule and the time-only DateTimeInput target.

- The API of the shared form layer in `line-core` (O1 (a)), and how it keeps Zag's inner native input out of the
  form, where it has no form owner anyway (R1, R2).
- The error-after-interaction state. `:user-invalid` never matches a form-associated custom element in Chromium and
  WebKit, and Firefox matches it from load (R2).
- The surface rule for form-associated controls inside a host form (R6).
- The listbox layer and placement of Select (R4).
- The item tag names of Radio Group and Toggle Group (R8). The Radio Group spec is approved only after its item shape
  passes R1's probe P3, because a radio in an item's own shadow root does not join its group (D6).
- A control size scale, so Input, Select, Number Input and Button align; the PRD sets none.
- The static fallback template of each form control, and what it submits (MANIFESTO Law 9; R1; D5).
- RTL (`dir`), touch and pointer behaviour for the custom machines (PRD §1.7; R1).
- The consumer-supplied labels of internal parts: the password toggle, the clear button, the steppers and the date
  segments (PRD §1.7, MANIFESTO Out of Scope localisation).

**Left to the Phase 2 spec, by note.** The decision register of row 01-Z29 (`docs/context/01-z29-register.md` §2)
lists these questions; the notes hold the evidence.

- **R1** (`docs/research/02-research-zag-form-machines.md` §7): handling of trusted `input` under C3 (Q3); switch
  `role="switch"` (Q6); NumberInput attribute format and the `valueAsNumber` event (Q7); multi-value submission,
  `FormData` entries and `null` without `name` (Q8); the zag#3239 fix, `position: fixed` on the hidden radio and
  `preventScroll` (Q9); PasswordInput hiding on owner reset and submit (Q10); the shared-layer API (initial value at
  connect, reset, disabled into props, fallback) (Q11); tier inputs (Q12); `id` and `getRootNode` in every props
  function (rec 1); NumberInput applying its initial value once (rec 8); Zag's fieldset tracking left inert or
  overridden (rec 4, with R9 Q5).
- **R2** (`docs/research/02-research-form-associated-contract.md` §6): what sets the error-after-interaction state
  and its name (Q4); what "restore where supported" proves (Q5); the identity-stamped string state (Q6); a rule that
  composed line form controls stay in light DOM (Q8); validation messages, engine text or consumer text (Q9); the
  `form-associated.ts:48` comment in stream F (Q10); x86_64 Linux WebKit through the stream F tests (Q11); password
  managers as best effort with a manual check (Q12); validity computed in the layer (rec 1); everything reset in
  `formResetCallback` (rec 3); which controls emulate implicit submission and which fields block it (Q7, under D3).
- **R3** (`docs/research/02-research-field-labelling.md` §7): Zag's label part rendered or replaced (Q2); `<label
  for>` or click forwarding, and the named `generic` host (Q3); event `detail` types and `composed` (Q4); the
  validity-change event name (Q5); whether `<line-field error>` is visual only or sets validity and `aria-invalid`
  (Q6); uniform `required`, `readOnly` and `value` reads (Q8); reference target later (Q9); host roles (Q10, after
  D9); engine-tree assertions and the private WebKit path (Q11); the slotted label text rule (Q12); a Linux x86_64
  check (Q13).
- **R4** (`docs/research/02-research-select.md` §6): the family part and props split (Q5); the implicit anchor or
  Zag's popper, RTL and dialog stacking (Q6); the zag#3088 remedy per component or as a shared `line-core` helper
  (Q7); Zag's Tab trap against the APG keyboard (Q8); the form value through `ElementInternals` and Zag's hidden
  `<select>` not rendered or not named (Q9); the surface render root (Q10); the required tests, Linux WebKit click,
  the four focus cases, dialog, flip and RTL (rec 7).
- **R5** (`docs/research/02-research-date-input.md` §6): the ISO form value, empty while incomplete (Q2); range
  through component validity, and time bounds (Q3); an IME and digit normaliser (Q4); "Empty" and the live region
  `root`, which MANIFESTO Law 5 now keeps off `document.body` (Q5); an iOS VoiceOver pass (Q6); screen-reader
  verification (Q7); A2UI flag defaults, both `false` (Q9); range selection out of Phase 2 (Q12); the static fallback
  (Q13); `createCalendar` as an opt-in (rec 9).
- **R6** (`docs/research/02-research-a2ui-form-types.md` §6): the surface rule, `form=""` on every surface-created
  form-associated element, Button included (Q1); checks to the validity message, warnings and the required
  indicator (Q3); the first-render error against the interaction state (Q4, with R2); value adapters, per type in the
  basic map or a binding-map transform (Q6); the ChoicePicker matrix and when Select renders (Q7); `validationRegexp`,
  `obscured` autocomplete and their security review (Q8); missing labels (Q9); Slider `step` default and rounding
  (Q10); ISO forms per flag (Q11); the `web_core` 0.16.1 pin AM (double report, catalog mixing, versioned data model,
  function set, pin test) (Q15).
- **R7** (`docs/research/02-research-progressive-enhancement-ssr.md` §7): a `:not(:defined)` warning in the forms
  guide (Q5); an SSR-tolerant authoring rule (Q6); lazy `line-core` sheets, its own row (Q7); SSR rows for Avatar,
  AvatarGroup and Badge (Q8); hydrate-support docs (Q9); framework notes (Q10); R1 and R2 probes on the
  slotted-native anatomy of Input and Textarea (Q12); whether their hosts keep `formAssociated` without a value and
  how C4 validity reaches the slotted control (Q2).
- **R8** (`docs/research/02-research-packaging-weight.md` §6): independent entries and their tags (rec 1); item tag
  names (Q2); the report's baseline row, `export *` and its comment (Q7); a CDN import map derived from the
  dependency closure (Q11); shared wrappers for Range Slider and Segmented Control (Q12).
- **R9** (`docs/research/02-research-fieldset.md` §6): where `reset.fieldset.css` applies (Q2); non-form-associated
  controls under a disabled Fieldset, SD36 (Q3); the layer owning the combined disabled state and never writing the
  host's `disabled` (Q4); Field learning that a fieldset disabled its control (Q6); the assertions, `:disabled`,
  focus refusal and `FormData` (Q9); a CI run before WebKit claims (Q10).
- **R10** (`docs/research/02-research-theming-showcase.md` §6): the control mapping (Q5); the auto-pair source, a site
  copy or a `line-schemas` export in its own row (Q6); CSS delivery (Q7); the query string and a first-paint script
  (Q8); controls inside or outside the themed scope (Q9); requirements for the component specs, Select groups and
  slotted items, Radio Group disabled as a whole, Toggle Group `deselectable: false` and its detail shape, Slider
  `line-input` (Q11); the axe combinations and baselines (Q12).

### 5.6 Decisions after the research stage

Miguel decided D1–D33 on 2026-11-27 (row 01-Z29; record in `docs/context/01-z29.md`, evidence and options in
`docs/context/01-z29-register.md`). D14 (b), D18 (a), D23 (b) and D32 (b) depart from the register's recommendation.
Miguel then made PasswordInput the validating set's form-associated text control, which settles its tier as Custom in
place of D16, and moved Input into the first wave (O1).

| # | Decision | Where it lands |
|---|---|---|
| D1 | Input and Textarea take an author's native control slotted in light DOM; PasswordInput replaces Input in the O1 validating set | MANIFESTO Law 8; PRD §1.7, §4.2; ARCH §7, §13.3, §14.9, §14.10, §15, §16.2, §17.2 C4, §17.3; plan O1, §2.1, §2.3, §6 |
| D2 | Select is custom on `@zag-js/select`; a native `<select>` in `<line-field>` is its no-JavaScript and OS-picker path | MANIFESTO Law 8; PRD §1.7; ARCH §16.2, §16.3 |
| D3 | Participation through `ElementInternals` or an author's slotted native control; spec-algorithm implicit submission is native semantics | MANIFESTO Law 7; ARCH §7 |
| D4 | Machine effects in the component's own tree are its cycle; on author DOM only an orchestrator writes ARIA reflection properties; nothing on `document.body` | MANIFESTO Law 5; ARCH §6 |
| D5 | The controller catches run-time machine errors and falls back; fallback templates wire `setFormValue` | PRD §1.7, §2.1, §6.2; ARCH §6; plan §4.1 |
| D6 | Light-DOM families with item tags; §12 becomes a rule with examples; the Radio item shape passes R1 P3 first | ARCH §12; plan §5.5 |
| D7 | Dependency locale data with a consumer override is not bundled i18n; consumer-run SSR under its own shim is not a polyfill story | MANIFESTO Out of Scope; PRD §1.7 |
| D8 | An opt-in controller start after the first render; Phase 2 machines opt in; the default is revisited at the Phase 2 exit | PRD §2.1, §6.2; ARCH §6; Phase 1 spec AM-123; plan §4.1 |
| D9 | Zag's hidden native input is the focus and accessible node of Checkbox, Switch and Radio; `ElementInternals` carries the form | ARCH §15.1 |
| D10 | C3 covers what component code and its machine dispatch; Select's composed `change` stops at the shadow root; trusted `input`/`beforeinput` pass | ARCH §16.2, §17.2 C3 |
| D11 | Field reads native events and `validity` from any control; `line-change`, `line-input` and one validity-change event; no `line-focus`/`line-blur` | ARCH §9; plan §2.2 |
| D12 | Element reflection through `control.ariaLabelledByElements`/`ariaDescribedByElements`, forwarded by line controls | ARCH §9, §17.2 C5; plan §2.2 |
| D13 | Control `data-invalid` is validity; Field `data-error` is the shown error; per-component `error` meanings | ARCH §9, §14.8; plan §2.2 |
| D14 | Select gains combobox semantics for its search; ChoicePicker `filterable` maps to it | PRD §4.2; ARCH §16.2, §17.3; plan §2.4 |
| D15 | DateInput is pre-built on `@zag-js/date-input` with spinbutton segments | PRD §4.2, §7.4; ARCH §8, §13.3, §13.4, §15.1, §16.2, §16.3; plan §2.1 |
| D16 | Replaced: PasswordInput is Custom, settled 2026-11-27 with the O1 revision | PRD §4.2, §7.4; ARCH §8; plan §2.1 |
| D17 | The Phase 4 DatePicker takes DateInput in a field slot and owns its trigger button | PRD §7.6; ARCH §13.4 |
| D18 | A time-only DateInput mode through the 1.49.0 `formatter` serves the time-only DateTimeInput; its value carries no date | PRD §4.2; ARCH §13.3, §17.3; plan §2.4 |
| D19 | `<line-fieldset>` wraps an authored native `<fieldset>`, reads it and never writes it; the surface creates the native fieldset | PRD §4.2; ARCH §14.4, §14.7, §15.1, §17.3; plan §2.3, §7.1 |
| D20 | Each reset sheet serves a real scenario; a sheet with none leaves the §14.7 mapping and stays published | ARCH §14.3, §14.4, §14.6, §14.7 |
| D21 | SD21 rows kept; a per-machine table; 1 KB = 1,000 B; GNU gzip as the reference | PRD §1.6, §1.7; plan §2.6, §7.1, §8 |
| D22 | `@internationalized/date` as a `line-components` dependency at `^3.12.4` | plan §2.6, §4.4 |
| D23 | Carets on the Zag machines, plus a docs rule to keep every `@zag-js/*` aligned | plan §2.6, §4.4, §4.5 |
| D24 | Write-back on `line-input` and `line-change`; a live-event member in the binding map | ARCH §17.3; plan §2.4 |
| D25 | A v1.0 `line` catalog id; per-version schemas from one declaration; the v1_0 basic id; one session | PRD §7.4; ARCH §17.3; plan §2.4 |
| D26 | All five form types wrapped in `<line-field>` | ARCH §17.3; plan §2.4 |
| D27 | The agent Button is disabled while its checks fail, a Phase 2 row on the Phase 1 surface | ARCH §17.3; plan §2.4, §4.3 |
| D28 | v1.0 `#`–`#####` prefixes map to `<h1>`–`<h5>` without a Markdown renderer | ARCH §17.3, §17.4; plan §2.4 |
| D29 | PRD keeps 4.5:1; a library contrast row brings normal-size labels to it; the showcase shows a computed readout | PRD §5.2.1, §5.3; plan §2.8, §8 |
| D30 | PRD states SC 1.4.11 3:1; a focus-ring token row picks the step that meets it | PRD §9.2, §9.6; plan §2.8, §8 |
| D31 | R10's showcase set and the `html`-scoped tokens sentence in PRD §9.4 | PRD §5.3, §9.4; plan §2.8, §4.6 |
| D32 | Field-related rows skip the Firefox axe scan until Playwright 1.66 | plan §5.3, §8 |
| D33 | The stale Phase 1 → Phase 00 spec locators corrected in a factual AM | Phase 1 spec AM-124 |

### 5.7 Document gaps the post-research revision fixes

The research stage confirmed each item, and the row 01-Z29 revision fixed all of them in one commit with this plan
(PROCESS §3), as row 00-Z45 did for Phase 1. PRD v0.8.36, ARCHITECTURE v0.8.28 and the MANIFESTO revision of
2026-11-25 had already fixed two gaps at the plan gate: the preview wording (O3 (b)) and the "post-Phase 1" SSR/SSG
wording (O8 (a)). The Where column names the lines before the revision; Resolved names the fix.

| Gap | Where (before) | Resolved |
|---|---|---|
| Native HTML5 validation "works natively" on a form-associated custom element | ARCHITECTURE §7 (`:393-394` at v0.8.28) | ARCHITECTURE v0.8.29 §7: constraint attributes on a host do nothing until the component sets validity |
| Select wraps a native control (MANIFESTO Law 8, PRD §1.7) vs uses no native `<select>` (ARCHITECTURE §15.1, §16.2) while keeping `reset.select.css` | MANIFESTO `:53`; PRD `:173`; ARCHITECTURE `:875`, `:1156`, `:1337-1339`, `:1446-1452` | D2: Law 8 and PRD §1.7 drop Select and name the native `<select>` in `<line-field>`; D20: `reset.select.css` serves fallback templates |
| Input and Textarea put their native control in the shadow root (ARCHITECTURE §15.1, §15.2), where it cannot work without JavaScript (R7 §5 item 1) | MANIFESTO `:53`; PRD `:173`; ARCHITECTURE `:1325-1333`, `:1367` | D1: the author's slotted native control; ARCHITECTURE v0.8.29 §7, §15 |
| DateInput: "`<input>` (per segment)" (§15.1) vs a single masked text input (§16.2) | ARCHITECTURE `:1332`, `:1428` | D15: spinbutton span segments of `@zag-js/date-input` in §15.1, §16.2 and §16.3 |
| Slider: no native element (§15.1) vs `reset.range.css` (§14.6, §14.7) | ARCHITECTURE `:894`, `:1158`, `:1337-1339` | D20: `reset.range.css` serves fallback templates; D9 adds the hidden-input rows of §15.1 |
| Number Input `pattern="[0-9]*"` excludes decimals and negatives; two tag names | ARCHITECTURE §14.10, §16.2 | ARCHITECTURE v0.8.29: no `pattern`, a machine-readable value, steppers as parts, `line-number-input` |
| `line-valid` is a Field child event but not in the Field-compatible contract | ARCHITECTURE §9 | D11: the contract rests on native events and one validity-change event |
| PasswordInput and DateInput "Custom" in §7.4 vs "the Phase 2 spec settles the tier" in §4.2 | PRD `:278`, `:280`, `:957`, `:959` | PRD v0.8.38: PasswordInput Custom (settled 2026-11-27), DateInput Pre-built (D15) |
| Zag 1.47.0 named as the machine version, which O4 (c) moves | ARCHITECTURE `:416`, `:605` | ARCHITECTURE v0.8.29 §8, §13.1: 1.49.0 |
| The focus ring on step 7 (PRD §9) vs the shipped `--line-accent-8` | PRD `:1290`, `:1424`; `packages/line-tokens/src/focus-ring.css:16` | D30: PRD §9.2 states SC 1.4.11 3:1, and a focus-ring token row picks the step |

---

## 6. Task Dependencies

Per O1 (a) as revised on 2026-11-27, O4 (c) and O5 (b):

```
P (O4 dependency baseline) ──► F (form foundation) ──► C PasswordInput, Field, Checkbox (validating set) + C Input ──► G TextField, CheckBox ──► C the other 11 (each with its descriptor)
Z (O6 locator policy) ──► first component spec
P17 (Phase 1, Button manifest type) ──► Input and Select specs
D Patterns + floating label ◄── Field and Input
S Theming showcase (O5 (b), D31; one row) ◄── Select, Slider, Switch, Radio Group, Toggle Group
every other Phase 2 row ──► P phase-exit minors ──► phase-exit Version PR ──► Z exit and retrospective
D5 (Phase 1) ──► first Phase 2 Version PR
```

---

## 7. Acceptance Criteria for Phase 2

The 10 PRD §7.4 criteria (v0.8.36) keep their wording; the plan's additions are in *italics* (per O2 (a)).

### 7.1 Components

- [ ] All listed components pass the 8-point test checklist (§5.2)
- [ ] Field correctly detects child state via events, validity, and explicit props
- [ ] formAssociated components participate in native `<form>` submit, reset, and validation
- [ ] *Each form-associated component also proves the `form` attribute, disabled from a native `<fieldset>` ancestor, including one inside `<line-fieldset>`, external validity (C4), and state restore where the engine supports it, in three engines.*
- [ ] *Input and Textarea prove the same through the author's slotted native control, before upgrade and after it, in three engines (MANIFESTO Law 8).*
- [ ] Storybook documentation complete for every component
- [ ] Zero axe-core violations
- [ ] CEM manifest generated and verified
- [ ] Changeset entry for every component
- [ ] *Every Phase 2 component spec is APPROVED before code, with the Agent contract section filled.*
- [ ] *Every story has a committed Chromium baseline, and the visual tier passes.*
- [ ] *Every component fills its htmx Tests row, and every value-bearing or compound component runs the harness for the four PRD Appendix A behaviours (`docs/PRD.md:1751-1754`), path (a) among them for each form-associated component.*
- [ ] *Every component fills its row in `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.2.*
- [ ] *Each component's gzipped size is reported against the < 5 KB soft target (1 KB = 1,000 B, GNU gzip as CI runs it), and the report's per-machine table lists each Zag machine's marginal weight and split chunk (not gating).*
- [ ] *Bundle splitting is verified for every Phase 2 subpath and family (the `./select`, `./radio-group` and `./toggle-group` families among them).*
- [ ] *CDN delivery through unpkg and jsDelivr is verified for the Phase 2 subpaths, and each Version PR records its `cdn-check.yml` run.*

### 7.2 Agent-driven UI

- [ ] *Every Phase 2 component has a descriptor (exposed, or `agentExposed: false` with a reason), and the CEM drift and coverage tests pass.*
- [ ] *The basic catalog maps TextField, CheckBox, ChoicePicker, Slider and DateTimeInput, each in `<line-field>`, validity reaches each control from A2UI checks through C4, and each writes the data model on `line-input` and `line-change`.*
- [ ] *`<line-a2ui-surface>` renders every agent-exposed Phase 2 component with zero axe-core violations, and disables an agent Button while its checks fail.*
- [ ] *Every form control the surface creates follows the Phase 2 spec's surface rule, which states how a host-page `<form>`, C4 validity from A2UI checks and MANIFESTO Law 7 apply (§5.5).*
- [ ] `line-genui` emits the A2UI v1.0 catalogs beside v0.9.1, the surface renders both protocol versions, and the A2UI renderer leaves preview
- [ ] *Per O3 (b), the five form types map on both protocol versions, and `line-icons/a2ui` leaves preview with the renderer.*

### 7.3 Documentation

- [ ] Floating label pattern documented in Storybook Patterns section
- [ ] *A forms guide covers native participation, the slotted native control of Input and Textarea, the native `<select>` path, validity, Field and the agent path.*
- [ ] The site's Theming showcase (§5.3) is built with Phase 2 line://ui components and is live at `line-ui.websublime.com`

### 7.4 Platform and release

- [ ] *Every package is released in `0.3.x` through `release.yml` with provenance, each package's first Phase 2 `minor` as its `0.3.0`, and every Version PR carries its release-time records.*
- [ ] *The SD76 widening landed before the first Version PR that carries a Phase 2 `minor` of `line-components` or `line-icons`.*
- [ ] *The exit sweep runs before the last rows land, its findings become ledger rows, and the Phase 2 retrospective is written with a hand-off to Phase 3.*

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Zag form wiring is a no-op in a shadow root (hidden inputs with no form owner; `input.form` and `closest()` tracking return nothing) | High (confirmed, R1 §2.3) | High | Stream F drives `ElementInternals` and the host callbacks |
| Select stays open after any focus move that a pointer did not cause while its machine's root node is a `ShadowRoot`, and Zag registers no `focusin` listener on touch devices (zag#3088, closed `not_planned`; fix PR #3093 closed unmerged) | High | Medium | R4 §2.4; a host `focusout` remedy that the spec places (R4 Q7) |
| `:user-invalid` never matches a form-associated custom element in Chromium and WebKit, and Firefox matches it from page load | High | Medium | An error-after-interaction `:state()` of the layer's own (R2 §2.2) |
| Restore differs by engine: WebKit restores a string or a `FormData` of strings and never a `File`, no engine restores for autocomplete, Firefox restores on reload only, and Firefox can hand one element's state to another | Medium | Medium | R2; an identity-stamped string state; restore is "where the engine supports it" |
| The labelling hand-off breaks silently: writing or removing `aria-labelledby` clears the reflected elements, Zag `spreadProps` removes an `undefined` ARIA key on every later spread, and WebKit descriptions are not observable | Medium | High | ARCHITECTURE §9 (D12); engine-tree assertions in the Browser tier (R3 Q11) |
| Playwright 1.65.1's Firefox crashes when page code or axe reads `ariaLabelledByElements` beside a role locator (Mozilla bug 2090055) | High | Medium | Field-related rows skip the Firefox axe scan until the repo takes Playwright 1.66 (§5.3; D32) |
| Pre-built machines exceed the 5 KB soft target: DateInput adds 16,507 B over the Zag baseline, 10,456 B of it machine code and 4,919 B `@internationalized/date`; Select 26,738 B, Number Input 9,443 B and Slider 8,272 B (R8 §2.3) | High (measured) | Low | The report's per-machine table makes the cost visible; the target is soft (D21) |
| The primary Button, IconButton and pressed Chip label is below 4.5:1 for 34 of 62 hue × mode pairs, and the showcase offers all 31 accents | High (measured) | High | A library contrast row brings normal-size labels to 4.5:1; the showcase shows a computed readout meanwhile (D29) |
| The shipped focus ring (`--line-accent-8`) is below 3:1 against `--line-gray-1` in 196 of 372 combinations | High (measured) | Medium | A focus-ring token row picks the step that meets SC 1.4.11, measured with R10's method (D30) |
| `@a2ui/web_core` 0.16.1 breaks 17 of 571 `line-genui` unit tests on the v0_9 path (18 with the exact-pin assertion) and the Storybook Alert fixture | Realised (R6 §2.6) | High | A spec AM moves the pin and settles the five items of R6 §4 item 12 |
| WebKit O(n²) on large inserts into a rendered `<line-stack>`, `web_core` O(N) per message, no cap on surfaces per session (Phase 1 retrospective, triaged here) | Medium | Medium | Form surfaces grow with Phase 2; R6 measured a form-sized surface (40 and 200 rows in 20–68 ms) |
| Agent form controls submit into a host-page `<form>` | Medium | High | R6; the spec's surface rule; security review of the G rows |
| Locator churn on every PRD or ARCHITECTURE revision | High | Low | O6 |
| Linux WebKit differs from macOS WebKit | High | Medium | CI before claims; lesson 4 |
| happy-dom fakes `attachInternals` | High | Medium | Browser tier for every form claim |

---

## 9. Deliverable Summary

- Phase 2 ships 15 form components (PRD §7.4) as `v0.3.0`, each meeting the agent contract and the native form
  contract.

---

## 10. Next Steps

1. The plan gate: the plan↔PRD lens passed in round 2, and Miguel resolved O1–O8 on 2026-11-25 (§5.4). Done.
2. Row 01-Z13 landed the O6 (c) locator policy (#366, 2026-11-25). Done. The row 01-Z11 PR adds PRD v0.8.36,
   ARCHITECTURE v0.8.28 and the MANIFESTO revision that O3 (b), O5 (b) and O8 (a) need, in one commit with this plan
   (PROCESS §3), as row 00-Z27 did with PRD v0.8.17.
3. One research note per §5.1 item, each under its own row. Done (rows 01-Z15 to 01-Z24, 2026-11-26).
4. A PRD, ARCHITECTURE and plan revision lands the research outcomes and the §5.7 gaps in one commit (PROCESS §3).
   Done in row 01-Z29: PRD v0.8.38, ARCHITECTURE v0.8.29, the MANIFESTO revision of 2026-11-27, this plan, and Phase
   1 spec AM-123 and AM-124. The row also names two library rows the main session opens, a library contrast row
   (D29) and a focus-ring token row (D30).
5. The Phase 2 spec `docs/specs/02-spec-essential-forms.md` answers §5.5, then passes the coherence review (3 clean
   rounds; PROCESS §5).
6. The ledger `docs/plans/02-tasks-essential-forms.md` follows the spec's streams; its PR aligns the PROCESS §4
   file-class pointer.
7. Until the Phase 2 ledger exists, each opening PR gets its own row in stream Z of the Phase 1 ledger.

---

## 11. Resolved Questions

| Id | Question | Resolution |
|---|---|---|
| O1 | In which order does Phase 2 build, and is there a shared form layer? | A shared form-control layer in `line-core` first, proven on PasswordInput, Field and Checkbox with Input in the same first wave (revised 2026-11-27); then TextField and CheckBox in stream G; then the other 11 |
| O2 | How are the exit criteria extended? | The PRD §7.4 criteria verbatim (10 after PRD v0.8.36), plus the plan's criteria in italics (§7) |
| O3 | Which A2UI version does Phase 2 target? | v1.0 beside v0.9.1; `web_core` to 0.16.x through a spec AM; the preview ends at the phase exit |
| O4 | What is the dependency baseline? | A refresh within the current majors before the first component row, with Changesets v3 and `changelog-github` 1 in the same row |
| O5 | Is the Theming showcase in Phase 2? | Yes: it dogfoods the Phase 2 controls and is an exit criterion |
| O6 | How do component specs cite the PRD, ARCHITECTURE and the phase spec? | Line locators pinned to a stated version, realigned only when a spec adopts a newer version (row 01-Z13) |
| O7 | What renders a multiple-selection ChoicePicker with checkboxes? | The surface composes `<line-fieldset>` and `<line-checkbox>`; no new component |
| O8 | Where does the SSR/SSG investigation go? | One research question inside R7, with no exit criterion |
| D1–D33 | How do the PRD, ARCHITECTURE, the MANIFESTO and this plan answer the ten research notes? | Miguel's decisions of 2026-11-27 (row 01-Z29), listed in §5.6 |
