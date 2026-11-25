# PHASE PLAN: Phase 02 — Essential Forms

**Status:** APPROVED — Miguel at the plan gate on 2026-11-25 (row 01-Z11), after the plan↔PRD lens passed in round 2. Miguel resolved O1–O8 (§5.4, §11). Row 01-Z13 landed the O6 (c) locator policy (#366), and PRD v0.8.36, ARCHITECTURE v0.8.28 and the MANIFESTO revision of 2026-11-25 land the decisions that O3 (b), O5 (b) and O8 (a) need, in one commit with this plan (§10).
**Author:** line://ui orchestrator (row 01-Z11)
**Date:** 2026-11-25
**Phase Version Target:** `line://ui` v0.3.0 (also called "Phase 2" in the PRD)
**Source PRD:** [`docs/PRD.md`](../PRD.md) (v0.8.36)
**Source Architecture:** [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) (v0.8.28)

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
a clear button and steppers (PRD §7.4, `docs/PRD.md:971`).

Two facts shape the phase more than the component count.

1. **The form contract is not in `line-core` yet.** The `FormAssociated` mixin forwards the `ElementInternals`
   methods and declares the lifecycle callbacks, but it implements no value, default value, reset, restore, disabled
   or constraint validation (`packages/line-core/src/form-associated.ts:76-125`). ARCHITECTURE §7 says HTML5
   validation "works natively" (`docs/ARCHITECTURE.md:393-394`), which holds for native controls but not for a
   form-associated custom element, where `required`, `pattern` and `minlength` take effect only through
   `setValidity`. Thirteen of the 15 components are form-associated (ARCHITECTURE §7, `:402`), so either each builds
   this contract or one shared layer does (O1).
2. **Zag's form wiring does not reach a light-DOM form from a shadow root.** Most Phase 2 pre-built machines carry
   their value on a hidden or visible native input with `name` and `form` props (toggle-group has no input at all,
   and password-input has no `form` prop), and they track reset and disabled through `closest('form')` and
   `closest('fieldset')`. A native input inside a shadow root has no form owner in the page (HTML form owner
   rules), and `closest()` does not cross the shadow boundary [INFERENCE: standard DOM behaviour, not yet probed;
   R1 probes it]. The host then drives `setFormValue`, `formResetCallback` and `formDisabledCallback` itself
   (§2.3, R1).

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

| Component | PRD tier (§4.2) | Form-associated (ARCH §7) | Pre-built candidate on npm (1.49.0 on 2026-11-25) | Spec |
|---|---|---|---|---|
| Input | Custom | yes | — | `0023-input.md` |
| PasswordInput | Custom; "the Phase 2 spec settles the tier" | yes | `@zag-js/password-input` | `0024-password-input.md` |
| SearchInput | Custom | yes | — | `0025-search-input.md` |
| DateInput | Custom; "the Phase 2 spec settles the tier" | yes | `@zag-js/date-input` | `0026-date-input.md` |
| Textarea | Custom | yes | — (`@zag-js/auto-resize` helper) | `0027-textarea.md` |
| Field | Custom | no | — (`@zag-js/field` is 2.0.0-next only) | `0028-field.md` |
| Fieldset | Static | no | — (`@zag-js/fieldset` is 2.0.0-next only) | `0029-fieldset.md` |
| Checkbox | Pre-built | yes | `@zag-js/checkbox` | `0030-checkbox.md` |
| Radio Group | Pre-built | yes | `@zag-js/radio-group` | `0031-radio-group.md` |
| Switch | Pre-built | yes | `@zag-js/switch` | `0032-switch.md` |
| Select | Pre-built | yes | `@zag-js/select` | `0033-select.md` |
| Toggle Group | Pre-built | yes | `@zag-js/toggle-group` (no hidden input) | `0034-toggle-group.md` |
| Slider | Pre-built | yes | `@zag-js/slider` | `0035-slider.md` |
| Number Input | Pre-built | yes | `@zag-js/number-input` | `0036-number-input.md` |
| Editable | Pre-built | yes | `@zag-js/editable` | `0037-editable.md` |

- Spec numbers 0023–0037 are fixed by the PRD §4.2 links. Each component spec is written just-in-time and is
  APPROVED before its code (PRD §8.2), with the Agent contract section filled (PRD §8.1).
- PRD §7.4 labels PasswordInput and DateInput "Custom" without the §4.2 caveat (`docs/PRD.md:956`, `:958`). The tier
  stays open until the Phase 2 spec settles it (§5.5), and the post-research revision aligns §7.4 (§5.7).

### 2.2 Field orchestration

- Field connects a label, a hint, an error and a required indicator to any slotted control, never imports it, and
  reflects `data-focused`, `data-filled`, `data-error`, `data-disabled`, `data-readonly` and `data-required`
  (ARCHITECTURE §9, `docs/ARCHITECTURE.md:474-498`; MANIFESTO Law 4).
- Its state comes from explicit props first, then child events, then native validity (ARCHITECTURE §9, `:482-485`).
- The labelling mechanism across the shadow boundary was deferred to "the Field spec" twice (`:487`; Phase 1 plan
  §5.6, `docs/plans/01-plan-core-primitives.md:510`). Phase 2 settles it after R3.
- The floating label is not built in. `data-focused` and `data-filled` enable it in pure CSS, and Storybook
  documents the pattern (ARCHITECTURE §9, `:491`; PRD §7.4 exit).

### 2.3 Native form participation

Every form-associated component proves, in the Browser tier and in three engines:

- its value in `FormData` and in the request a `<form>` sends, under its `name`;
- `form.reset()` back to its default value;
- constraint validation (`required` and each constraint attribute the spec gives it), `checkValidity()`,
  `reportValidity()`, `:invalid`/`:valid`, and submission blocked while invalid;
- external validity through `custom-validity` (C4);
- the `form` attribute, and disabled from an ancestor `fieldset`;
- state restore on history navigation, where the engine supports it (R2).

The exit criterion of PRD §7.4 names submit, reset and validation (`docs/PRD.md:978`); restore and the `form`
attribute are plan additions (§7).

### 2.4 Agent-driven UI

- Every Phase 2 component ships its descriptor in the same PR (PRD §7.3, `docs/PRD.md:901`), with the Agent
  contract C1–C9 filled.
- Stream G maps the five A2UI basic-catalog types that ARCHITECTURE §17.3 schedules for Phase 2: TextField,
  CheckBox, ChoicePicker, Slider and DateTimeInput (`docs/ARCHITECTURE.md:1621-1625`). ChoicePicker's checkbox mode
  is a `<line-fieldset>` of `<line-checkbox>` elements (O7 (a); `:1623`), and a time-only DateTimeInput has no
  Phase 2 target yet (§5.5).
- A form-associated control that the surface renders inside a host-page `<form>` would add its field and its
  validity to that form, the hazard Phase 1 closed for Button (Phase 1 spec AM-081). The Phase 2 spec states one rule
  for every form-associated control the surface creates (R6, §5.5).
- A2UI v1.0 went final upstream on 2026-11-11 (`specification/versions.json` lists v1.0 as `current` and v0.9.1 as
  `previous`). Per O3 (b), PRD v0.8.36 §7.4 schedules the v1.0 `line` and `basic` catalogs beside v0.9.1, the
  surface on both protocol versions and the end of the preview at the phase exit, with an exit criterion
  (`docs/PRD.md:973`, `:984`). MANIFESTO principle 8 (`docs/MANIFESTO.md:33`), PRD principle 6, §2 and Appendix D
  (`docs/PRD.md:135`, `:217`, `:1836-1837`) and ARCHITECTURE §17.3 and §17.7 (`docs/ARCHITECTURE.md:1602`,
  `:1681-1682`) now keep the renderer and `line-icons/a2ui` previews until `line-genui/a2ui` targets the final A2UI
  v1.0. v1.0 also changes the form schemas: `checks` becomes `@checks` with a `ValidationResult`, TextField gains
  `placeholder`, drops `validationRegexp` and requires `value`, and Slider gains `steps` as a count of divisions.

### 2.5 Storybook

- The `Components/Forms — Essential/<Name>` stories, autodocs from the shipped manifest, and the visual baselines
  of every story (Phase 1 conventions; PRD §5.2.1).
- A `Patterns` section with the floating label pattern and its full CSS (PRD §5.1, `docs/PRD.md:508-516`; §7.4
  exit). The section does not exist yet.

### 2.6 Platform and release

- The Phase 2 Zag machines become `line-components` dependencies. The dependency baseline is fork O4.
- The SD76 widening duty: the first Phase 2 PR that adds a `minor` changeset for `line-components` or `line-icons`
  widens both `line-genui` peer ranges to `|| ^0.3.0` on `main` before `changeset version` builds the Version PR
  (Phase 1 spec §7.2). The peers read `workspace:^0.1.0 || ^0.2.0` today
  (`packages/line-genui/package.json:37-40`).
- The version guard: Miguel checks that no Version PR of Phase 2 takes a package past `0.3.x` (PROCESS §6).
- Every Version PR carries its release-time records and passes the required `release-records` status (Phase 1 spec
  §7.2, AM-114).
- A phase-exit row brings every package that is still `0.2.x` to `0.3.0`, as Phase 1 row P13 did.
- The per-component size report keeps the < 5 KB gzipped soft target (PRD §1.7). DateInput on
  `@zag-js/date-input` pulls `@internationalized/date` as a peer (R8).

### 2.7 Release target

Phase 2 ships `line://ui` v0.3.0: each package's first Phase 2 `minor` is its `0.3.0`, and later Phase 2
changesets for that package are `patch` (PROCESS §6).

### 2.8 Site

Per O5 (b), the site's Theming showcase dogfoods the Phase 2 controls and gates the exit: PRD v0.8.36 replaced the
§7.4 "**Parallel:**" line with an exit criterion (`docs/PRD.md:985`, `:987`). Phase 1 had left the showcase out on
purpose (Phase 1 plan O3 (c)).

---

## 3. Scope — Out

- Combobox, Date Picker and Time Picker, the Phase 4 refinements of ChoicePicker and DateTimeInput
  (`docs/ARCHITECTURE.md:1628`).
- `line-form`, cross-field validation and FloatingField, which stay after 1.0 (PRD §7.11, `docs/PRD.md:1178-1179`;
  ARCHITECTURE §7).
- A `native-mobile` prop on Select (ARCHITECTURE §16.2, post-1.0).
- WebMCP for form-associated elements (ARCHITECTURE §17.8).
- Server-side A2UI → `<line-*>` HTML, and model-authored markup (PRD Appendix D).
- `@zag-js/field` and `@zag-js/fieldset`, which exist only on the Zag 2.0.0-next line.
- The SSR/SSG investigation is not a stream: per O8 (a) it is one research question inside R7, with no exit
  criterion. PRD v0.8.36 §1.7 and the comparison table (`docs/PRD.md:166`, `:82`) and the MANIFESTO Out of Scope list
  (`docs/MANIFESTO.md:65`) now name it a Phase 2 research question, where they planned it "post-Phase 1".

---

## 4. High-Level Task Breakdown

### 4.0 Streams and owners

| Stream | Name | Owner |
|---|---|---|
| F | Form foundation in `line-core` (per O1): the shared form contract the 13 form-associated components use | webcomponents-supervisor |
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
- Its Browser-tier tests prove §2.3 on a test element before any component uses it.

### 4.2 Stream C — the 15 components

One row per component, in the order O1 sets. Each row follows the Phase 1 per-component obligations: spec APPROVED
before code, implementation, descriptor, stories, visual baselines, axe, htmx row, competitive-analysis row,
changeset (Phase 1 spec §6.C.6).

### 4.3 Stream G — agent-driven UI

- The basic map for TextField, CheckBox, ChoicePicker, Slider and DateTimeInput, with their validity from A2UI
  checks through C4.
- The surface rule for form-associated controls inside a host form (§2.4).
- The A2UI v1.0 work of O3 (b): v1.0 `line` and `basic` catalogs beside v0.9.1, the surface on both protocol
  versions, the five form types on both, `@a2ui/web_core` moved to 0.16.x through a spec AM, and the preview of
  `line-genui/a2ui` and `line-icons/a2ui` ending at the phase exit.

### 4.4 Stream P — platform and release

- The dependency baseline of O4 (c), before the first component row: the refresh within the current majors, plus
  `@changesets/cli` 3 and `@changesets/changelog-github` 1.
- The SD76 widening, on the first Phase 2 `minor` changeset PR.
- The phase-exit minors.

### 4.5 Stream D — documentation

- The Storybook `Patterns` section with the floating label pattern.
- A forms guide: native participation, validity, Field, and the agent path.
- Getting Started for the form components; row D5 of Phase 1 settles how its CDN snippets stay current.

### 4.6 Stream S — site

The Theming showcase, per O5 (b): built with the Phase 2 controls and an exit criterion.

### 4.7 Stream Z — repo-wide

- The locator policy of O6 (c), before the first Phase 2 component spec: row 01-Z13 in the Phase 1 ledger.
- The exit sweep before the last rows land, and the phase exit and retrospective (Phase 1 spec §6.Z.2, AM-115).

---

## 5. External Dependencies & Research Targets

PROCESS §2 requires one research note per item, at `docs/research/02-research-<slug>.md`. Research that
contradicts this plan returns to the plan and the PRD before any spec work.

### 5.1 Research targets

| Item | Research target |
|---|---|
| R1 Zag form machines in Shadow DOM | For each Phase 2 machine at the O4 baseline: how `LineMachineController` passes `getRootNode`; what the hidden or visible native input does inside a shadow root; replacing Zag's `closest('form')` reset and `closest('fieldset')` disabled tracking with the host callbacks; the native `input`/`change` events the machines dispatch against C3; zag#3088 (focus outside not detected in a shadow root) for Select; zag#3239 (hidden-input focus scroll) for Radio Group; number-input submitting its formatted string; toggle-group with no native input; the static fallback when a machine fails (MANIFESTO Law 9, PRD §1.7) and what then happens to the form value; RTL (`dir`) and touch and pointer behaviour for the custom machines (PRD §1.7) |
| R2 Form-associated platform contract | Constraint validation computed by the component (`required`, `pattern`, `minlength`, `min`/`max`, `step`) with an anchor; `:user-invalid`, which never matches a form-associated custom element, and an error-after-interaction state; reset; restore (WebKit restores only a string and never for autocomplete; a third-party report of Firefox handing one element's state to another); implicit submission from an inner `<input>`; autofill and password managers through an inner native input; three engines, Linux WebKit included |
| R3 Field and labelling | The Field labelling mechanism across the shadow boundary: reference target (Chromium only today), `ariaLabelledByElements` (all three engines, toward ancestor trees only), a host role, `<label for>` on a form-associated host; the Field event contract (`line-focus`, `line-blur`, `line-invalid`, `line-valid`) against C3 and C9; native controls inside Field (ARCHITECTURE §16.2 recommends a native `<select>` there); `data-error` vs `data-invalid` |
| R4 Select | Native or custom against MANIFESTO Law 8 and ARCHITECTURE §15–§16 (G1); "with search" (PRD §4.2) vs typeahead and the Phase 4 Combobox; the listbox in the top layer without Popover (Phase 3), through what Portal proved in Phase 1; mobile; zag#3088 |
| R5 DateInput | `@zag-js/date-input` vs a custom machine; its segments (`span` with `contentEditable` and `role: spinbutton`) vs ARCHITECTURE §15.1 "`<input>` (per segment)" and §16.2 "`<input type="text">` with segment masking"; `@internationalized/date` weight; locale and granularity; the A2UI DateTimeInput `enableTime`; the Phase 4 DatePicker composition (`slot="trigger"`) |
| R6 A2UI form types | The five basic types at v0.9.1 and v1.0: value binding, `checks`/`@checks` to C4 validity, ChoicePicker variants, TextField variants (`longText`, `obscured`, `number`), Slider `steps`; the host-form hazard of every surface-created form control, weighed against MANIFESTO Law 7 ("native `<form>` semantics is the only contract", `docs/MANIFESTO.md:51`) and C4 validity; the v1.0 catalog shape and `@a2ui/web_core` 0.16.x breaking changes on the v0_9 path (per O3) |
| R7 Progressive enhancement and SSR/SSG | Whether Input, Textarea and Select can stay functional without JavaScript (MANIFESTO Law 8, PRD §1.7 `:172`), for example through a slotted native control; a recorded "not feasible" is a valid outcome. Per O8 (a), the same note investigates SSR/SSG for the Phase 2 controls (declarative shadow DOM, Lit SSR, Astro, Nuxt, Next.js; PRD §1.7 `:166`) |
| R8 Packaging and weight | Entry points and families for the components ARCHITECTURE §12 does not list (Radio Group, Toggle Group, Checkbox, Switch, Slider, Number Input); gzipped weight of each new Zag machine and of `@internationalized/date` against the < 5 KB soft target |
| R9 Fieldset | Disabled propagation from a Fieldset to slotted controls, when a `<fieldset disabled>` inside the shadow root does not make light-DOM descendants disabled per HTML; native and line controls |
| R10 Theming showcase | Per O5 (b): the showcase scope on the Astro site, with the Phase 2 controls as its UI |

### 5.2 Upstream facts the research must re-check

- Zag `latest` is 1.49.0 against the locked 1.47.0, with Phase 2 fixes in checkbox and switch labelling,
  number-input typing, slider decimal steps and date-input locale.
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
  event contract and the surface rule for form controls are rules.
- Every agent-facing claim about layout, sizing or behaviour is probed in three engines before a descriptor or a doc
  states it (lesson 2).
- Form behaviour is proven in the Browser tier, never only in happy-dom, which fakes `attachInternals` (lesson 7).
- Linux WebKit runs in CI before a claim about WebKit holds (lesson 4).

### 5.4 Decisions at the plan gate

Each fork names its options, what each decides, and a recommendation. Miguel resolves them at the plan gate.

#### O1 Build order and the form foundation

**Resolution:** (a) chosen — Miguel, 2026-11-25.

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
| (a) | Keep the 8 PRD §7.4 criteria in their wording and add the plan's criteria in italics in §7, as Phase 1 did | Recommended: PRD §7.3 already binds every later component to its descriptor (`docs/PRD.md:901`) |
| (b) | Revise PRD §7.4 to carry the added criteria | — |

#### O3 A2UI version

**Resolution:** (b) chosen — Miguel, 2026-11-25.

| Option | What it decides | Recommendation |
|---|---|---|
| (a) | Phase 2 stays on A2UI v0.9.1 and `@a2ui/web_core` 0.14.0; the v1.0 move is a later phase; `line-genui/a2ui` and `line-icons/a2ui` stay previews. Needs a MANIFESTO revision of principle 8 and a PRD revision of principle 6, §2 and Appendix D (`docs/PRD.md:135`, `:217`, `:1837`), with ARCHITECTURE `:1682`, the Phase 1 plan §3 and the site card aligned, so that each reads "until the package targets A2UI v1.0" | — |
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

ARCHITECTURE §17.3 maps ChoicePicker to `<line-radio-group>`, "a checkbox group", `<line-select>` or
`<line-toggle-group>` (`docs/ARCHITECTURE.md:1623`). The PRD catalogue has no checkbox group.

| Option | What it decides | Recommendation |
|---|---|---|
| (a) | The surface renders a `multipleSelection` ChoicePicker with `displayStyle: checkbox` as a `<line-fieldset>` of `<line-checkbox>` elements; no new component; ARCHITECTURE §17.3 names that composition | Recommended: it uses two Phase 2 components and needs no PRD catalogue change |
| (b) | Add a CheckboxGroup as a 16th Phase 2 component, through a PRD §4.2 and §7.4 revision | — |
| (c) | Map it to `<line-toggle-group>` in multiple mode | — |

#### O8 SSR/SSG investigation

**Resolution:** (a) chosen — Miguel, 2026-11-25.

PRD §1.7 (`docs/PRD.md:166`), the PRD comparison table (`:82`) and the MANIFESTO Out of Scope list
(`docs/MANIFESTO.md:65`) plan an SSR/SSG investigation for Astro, Nuxt and Next.js "post-Phase 1"; it is not a launch
blocker.

| Option | What it decides | Recommendation |
|---|---|---|
| (a) | Phase 2 carries the investigation as one research note, folded into R7 (progressive enhancement and declarative shadow DOM for the form controls), with no exit criterion | Recommended: progressive enhancement of Input, Textarea and Select (MANIFESTO Law 8) and server rendering ask the same question about markup that works before upgrade |
| (b) | The investigation moves to a later phase; the PRD and MANIFESTO wording changes from "post-Phase 1" to that phase | — |
| (c) | The investigation becomes a Phase 2 stream with an exit criterion; needs a PRD §7.4 revision | — |

### 5.5 Spec-level questions

These belong to the Phase 2 spec. They are neither research items nor plan forks.

- The tier of PasswordInput and DateInput (ARCHITECTURE §8, `:416`), after R1 and R5.
- Under O1 (a), the API of the shared form layer in `line-core`; under O1 (b), the per-component contract each spec
  states. Either way, how a pre-built machine's native input stays out of the form (R1, R2).
- The Field event contract as a rule for every Field-compatible control, and how Field reads a native control (R3).
- The Field labelling mechanism (R3).
- The error-after-interaction state, since `:user-invalid` never matches a form-associated custom element (R2).
- The surface rule for form-associated controls inside a host form (R6).
- What the surface renders for a time-only DateTimeInput (R5, R6).
- Select: native or custom, search, and its listbox layer (R4).
- Entry points and families for the components ARCHITECTURE §12 does not list (R8).
- How a Fieldset disables slotted controls (R9).
- A control size scale, so Input, Select, Number Input and Button align; the PRD sets none.
- The static fallback of each form control when its machine fails, and what then reaches the form (MANIFESTO Law
  9; R1).
- RTL (`dir`), touch and pointer behaviour for the custom machines (PRD §1.7; R1).
- The consumer-supplied labels of internal parts: the password toggle, the clear button, the steppers and the date
  segments (PRD §1.7, MANIFESTO Out of Scope localisation).

### 5.6 Decisions after the research stage

Empty until the research notes are delivered.

### 5.7 Document gaps the post-research revision fixes

The research stage confirms each item; a PRD and ARCHITECTURE revision then fixes them in one commit with this plan
(PROCESS §3), as row 00-Z45 did for Phase 1. PRD v0.8.36, ARCHITECTURE v0.8.28 and the MANIFESTO revision of
2026-11-25 already fixed two gaps at the plan gate: the preview wording (O3 (b)) and the "post-Phase 1" SSR/SSG
wording (O8 (a)).

| Gap | Where |
|---|---|
| Native HTML5 validation "works natively" on a form-associated custom element | ARCHITECTURE §7 (`docs/ARCHITECTURE.md:393-394`) |
| Select wraps a native control (MANIFESTO Law 8, PRD §1.7) vs uses no native `<select>` (ARCHITECTURE §15.1, §16.2) while keeping `reset.select.css` | MANIFESTO `:53`; PRD `:172`; ARCHITECTURE `:875`, `:1156`, `:1337-1339`, `:1446-1452` |
| DateInput: "`<input>` (per segment)" (§15.1) vs "`<input type="text">` with segment masking" (§16.2) | ARCHITECTURE `:1332`, `:1428` |
| Slider: no native element (§15.1) vs `reset.range.css` (§14.6, §14.7) | ARCHITECTURE `:894`, `:1158`, `:1337-1339` |
| Number Input `pattern="[0-9]*"` excludes decimals and negatives; `line-number-field` vs `line-number-input` | ARCHITECTURE §14.10, §16.2 |
| `line-valid` is a Field child event (§9 `:484`) but not in the Field-compatible contract (`:493-494`) | ARCHITECTURE §9 |
| PasswordInput and DateInput "Custom" in §7.4 vs "the Phase 2 spec settles the tier" in §4.2 | PRD `:277`, `:279`, `:956`, `:958` |
| Zag 1.47.0 named as the machine version, which O4 (c) moves | ARCHITECTURE `:416`, `:605` |
| The focus ring on step 7 (PRD §9) vs the shipped `--line-accent-8` | PRD `:1289`, `:1423`; `packages/line-tokens/src/focus-ring.css:16` |

---

## 6. Task Dependencies

Per O1 (a), O4 (c) and O5 (b):

```
P (O4 dependency baseline) ──► F (form foundation) ──► C Input, Field, Checkbox ──► G TextField, CheckBox ──► C the other 12 (each with its descriptor)
Z (O6 locator policy) ──► first component spec
P17 (Phase 1, Button manifest type) ──► Input and Select specs
D Patterns + floating label ◄── Field and Input
S Theming showcase (O5 (b)) ◄── Select, Slider, Switch, Radio Group, Toggle Group
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
- [ ] *Each form-associated component also proves the `form` attribute, disabled from an ancestor `fieldset`, external validity (C4), and state restore where the engine supports it, in three engines.*
- [ ] Storybook documentation complete for every component
- [ ] Zero axe-core violations
- [ ] CEM manifest generated and verified
- [ ] Changeset entry for every component
- [ ] *Every Phase 2 component spec is APPROVED before code, with the Agent contract section filled.*
- [ ] *Every story has a committed Chromium baseline, and the visual tier passes.*
- [ ] *Every component fills its htmx Tests row, and every value-bearing or compound component runs the harness for the four PRD Appendix A behaviours (`docs/PRD.md:1749-1752`), path (a) among them for each form-associated component.*
- [ ] *Every component fills its row in `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.2.*
- [ ] *Each component's gzipped size is reported against the < 5 KB soft target (not gating).*
- [ ] *Bundle splitting is verified for every Phase 2 subpath and family (the `./select` family among them).*
- [ ] *CDN delivery through unpkg and jsDelivr is verified for the Phase 2 subpaths, and each Version PR records its `cdn-check.yml` run.*

### 7.2 Agent-driven UI

- [ ] *Every Phase 2 component has a descriptor (exposed, or `agentExposed: false` with a reason), and the CEM drift and coverage tests pass.*
- [ ] *The basic catalog maps TextField, CheckBox, ChoicePicker, Slider and DateTimeInput, and validity reaches each control from A2UI checks through C4.*
- [ ] *`<line-a2ui-surface>` renders every agent-exposed Phase 2 component with zero axe-core violations.*
- [ ] *Every form control the surface creates follows the Phase 2 spec's surface rule, which states how a host-page `<form>`, C4 validity from A2UI checks and MANIFESTO Law 7 apply (§5.5).*
- [ ] `line-genui` emits the A2UI v1.0 catalogs beside v0.9.1, the surface renders both protocol versions, and the A2UI renderer leaves preview
- [ ] *Per O3 (b), the five form types map on both protocol versions, and `line-icons/a2ui` leaves preview with the renderer.*

### 7.3 Documentation

- [ ] Floating label pattern documented in Storybook Patterns section
- [ ] *A forms guide covers native participation, validity, Field and the agent path.*
- [ ] The site's Theming showcase (§5.3) is built with Phase 2 line://ui components and is live at `line-ui.websublime.com`

### 7.4 Platform and release

- [ ] *Every package is released in `0.3.x` through `release.yml` with provenance, each package's first Phase 2 `minor` as its `0.3.0`, and every Version PR carries its release-time records.*
- [ ] *The SD76 widening landed before the first Version PR that carries a Phase 2 `minor` of `line-components` or `line-icons`.*
- [ ] *The exit sweep runs before the last rows land, its findings become ledger rows, and the Phase 2 retrospective is written with a hand-off to Phase 3.*

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Zag form wiring is a no-op in a shadow root (hidden inputs with no form owner; `closest()` reset and fieldset tracking) | High | High | R1; stream F drives `ElementInternals` and the host callbacks |
| Select does not close when focus leaves a shadow root (zag#3088, closed `not_planned`) | High | Medium | R4; a host-side focus-out listener |
| `:user-invalid` never matches a form-associated custom element | High | Medium | R2; an error-after-interaction `:state()` |
| Restore differs by engine (WebKit string-only; a Firefox report of misrouted state) | Medium | Medium | R2; restore is "where the engine supports it" |
| Cross-shadow labelling: reference target ships only in Chromium | High | High | R3; Field picks a mechanism that works in three engines |
| `@internationalized/date` breaks the DateInput size target | Medium | Low | R5, R8; the target is soft |
| `@a2ui/web_core` 0.15–0.16 breaking changes on the v0_9 path | Medium | High | O3; R6; a spec AM moves the pin |
| WebKit O(n²) on large inserts into a rendered `<line-stack>`, `web_core` O(N) per message, no cap on surfaces per session (Phase 1 retrospective, triaged here) | Medium | Medium | Form surfaces grow with Phase 2; R6 measures a form-sized surface |
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
3. One research note per §5.1 item, each under its own row.
4. A PRD, ARCHITECTURE and plan revision lands the research outcomes and the §5.7 gaps in one commit (PROCESS §3).
5. The Phase 2 spec `docs/specs/02-spec-essential-forms.md` answers §5.5, then passes the coherence review (3 clean
   rounds; PROCESS §5).
6. The ledger `docs/plans/02-tasks-essential-forms.md` follows the spec's streams; its PR aligns the PROCESS §4
   file-class pointer.
7. Until the Phase 2 ledger exists, each opening PR gets its own row in stream Z of the Phase 1 ledger.

---

## 11. Resolved Questions

| Id | Question | Resolution |
|---|---|---|
| O1 | In which order does Phase 2 build, and is there a shared form layer? | A shared form-control layer in `line-core` first, proven on Input, Field and Checkbox; then TextField and CheckBox in stream G; then the other 12 |
| O2 | How are the exit criteria extended? | The PRD §7.4 criteria verbatim (10 after PRD v0.8.36), plus the plan's criteria in italics (§7) |
| O3 | Which A2UI version does Phase 2 target? | v1.0 beside v0.9.1; `web_core` to 0.16.x through a spec AM; the preview ends at the phase exit |
| O4 | What is the dependency baseline? | A refresh within the current majors before the first component row, with Changesets v3 and `changelog-github` 1 in the same row |
| O5 | Is the Theming showcase in Phase 2? | Yes: it dogfoods the Phase 2 controls and is an exit criterion |
| O6 | How do component specs cite the PRD, ARCHITECTURE and the phase spec? | Line locators pinned to a stated version, realigned only when a spec adopts a newer version (row 01-Z13) |
| O7 | What renders a multiple-selection ChoicePicker with checkboxes? | The surface composes `<line-fieldset>` and `<line-checkbox>`; no new component |
| O8 | Where does the SSR/SSG investigation go? | One research question inside R7, with no exit criterion |
