# Research: Fieldset and disabled propagation (R9)

**Row:** `01-Z24` (Phase 2 plan §5.1 R9, §5.3)
**Date:** 2026-11-26
**Repo sources:** `docs/PROCESS.md` §1, §2; `docs/plans/02-plan-essential-forms.md` §1, §2.1, §2.3, §3, §5.1 R1, R3, R9, §5.2, §5.3, §5.5, §7.1; `docs/PRD.md` (v0.8.36) §4.2, §7.4; `docs/ARCHITECTURE.md` (v0.8.28) §7, §8, §9, §14.3, §14.4, §14.7, §14.8, §14.9, §17.2, §17.3; `docs/MANIFESTO.md` Laws 1, 4, 5, 7, 8; `docs/specs/01-spec-core-primitives.md` §10 SD36; `docs/specs/0002-button.md`; `docs/specs/0003-icon-button.md`; `docs/specs/0008-chip.md`; `packages/line-core/src/form-associated.ts`; `packages/line-components/src/button/button.ts`; `packages/line-components/__tests__/integration/button/button.e2e.ts`; `packages/line-components/__tests__/integration/alert/alert.e2e.ts`; `docs/research/01-research-zag-machines.md` (format). Corrected 2026-11-27 (row 01-Z29): the `docs/PRD.md` locators here resolve at PRD v0.8.36 (`9c9b1f4`); PRD v0.8.37 and v0.8.38 each add one revision-note line, so at v0.8.38 every cited line after the revision notes sits two lines further down.
**Toolchain:** the row 01-Z14 baseline on `origin/main` `9c9b1f4`: Playwright 1.65.1 (Chromium 159.0.8154.6, Firefox 159.0, WebKit 27.2 build 2388), Bun 1.4.5 (`/tmp/bun145`), Node 22.23.5 (`/tmp/node-v22.23.5-darwin-arm64`), Zag 1.49.0. Linux WebKit in `mcr.microsoft.com/playwright:v1.65.1-noble` (§3).
**Status:** Evidence. Research carries no rules (`docs/PROCESS.md` §1). Recommendations are marked as such; every decision is an open question in §6.

> **TL;DR**
>
> - HTML disables a form control through a `<fieldset disabled>` only when the control is a tree **descendant** of
>   that fieldset, outside its first `<legend>`. A light-DOM child slotted into a shadow-root `<fieldset>` is not a
>   descendant. In Chromium, Firefox, macOS WebKit and Linux WebKit, a `<fieldset disabled>` inside a shadow root
>   disabled nothing that was slotted into it: native controls, form-associated custom elements (FACEs) and
>   `<line-button>` all stayed enabled, focusable, clickable, submitted and validated, and no `formDisabledCallback`
>   fired (probe P1). Only controls inside the same shadow tree were disabled.
> - A light-DOM `<fieldset disabled>` gives full native behaviour in all four engine builds, through any number of
>   custom-element wrappers: native controls and FACEs match `:disabled`, leave focus order, receive no `click`, drop
>   out of `FormData` and of the submitted request, and are barred from constraint validation. FACEs get
>   `formDisabledCallback(true)` and `(false)` exactly when their effective state changes. `<line-button>` already
>   follows (P2). Non-form-associated elements (`<line-chip>`, an `IconButton`-like host, a shadow-root
>   `<input>` under a non-FACE host) stay enabled, as Phase 1 SD36 found for IconButton.
> - A disabled FACE that uses `delegatesFocus` and keeps its inner `<input>` enabled can still be focused by
>   `focus()`, by Tab and by a mouse click, and the user can type into it, in all four builds (P5). Every Phase 2
>   control with an inner native control must disable that control from `formDisabledCallback`.
> - Nested fieldsets and the first-legend exemption behave per spec in all builds. Zag's fieldset tracking does
>   not: 1.49.0 reads only the closest fieldset's own `disabled` (misses a disabled outer fieldset), and both 1.49.0
>   and 2.0.0-next.4 report a control in the first legend as disabled. From inside a shadow root it reports nothing.
> - No script mechanism reproduces native disabling for slotted native controls without writing their `disabled`
>   attribute. `inert` blocks focus and clicks but still submits and validates and never matches `:disabled`; a
>   customized built-in `<fieldset is>` does not upgrade in WebKit. The recommended direction is a light-DOM native
>   `<fieldset>` as the propagation source (§2.10); the shape of `<line-fieldset>` around it is open (§6).

---

## 1. Question

Plan §5.1 R9: "Disabled propagation from a Fieldset to slotted controls, when a `<fieldset disabled>` inside the
shadow root does not make light-DOM descendants disabled per HTML; native and line controls"
(`docs/plans/02-plan-essential-forms.md:271`). The spec question it feeds is "How a Fieldset disables slotted
controls" (`:414`). PRD §4.2 describes Fieldset as "Semantic grouping of related controls with legend and disabled
propagation", tier Static (`docs/PRD.md:282`), and plan §2.3 asks every form-associated component to prove "disabled
from an ancestor `fieldset`" (`docs/plans/02-plan-essential-forms.md:115`, `:472`).

- **Q1** What does HTML define, and does the "per HTML" premise hold in the engines?
- **Q2** What does a `<fieldset disabled>` inside a shadow root do to slotted native controls, FACEs and line controls?
- **Q3** What does a light-DOM `<fieldset disabled>` do to the same controls, through custom-element wrappers?
- **Q4** What happens to a disabled FACE that delegates focus to an inner native control?
- **Q5** Nested fieldsets and the `<legend>` exemption.
- **Q6** `:disabled` matching, focusability and keyboard order, click delivery.
- **Q7** Form submission and constraint validation of disabled controls.
- **Q8** What Zag and other libraries do, and which mechanisms are open to `<line-fieldset>`.

## 2. Findings

### 2.1 Q1: what HTML says

- **The disabled state.** "A form control is disabled if … the element is a button, input, select, textarea, or
  form-associated custom element, and the disabled attribute is specified on this element …; or the element is a
  descendant of a fieldset element whose disabled attribute is specified, and the element is not a descendant of that
  fieldset element's first legend element child, if any" (HTML, [concept-fe-disabled][fe-disabled]). The `fieldset`
  section says the same of its attribute ([attr-fieldset-disabled][fs-disabled]). "Descendant" is the DOM tree
  relation ([DOM tree descendant][dom-desc]), not the shadow-including one ([shadow-including
  descendant][dom-sdesc]); a slotted node stays a child of its host in the tree. A FACE's own `disabled` attribute
  disables only itself; no clause lets a FACE disable its descendants.
- **What disabled does.** "Actually disabled" covers a disabled FACE ([concept-element-disabled][actually]), which
  makes it match `:disabled` and not `:enabled` ([selector-disabled][sel]) and removes it from the focusable areas
  ([focusable area][focus]). The form data set skips a disabled field ([constructing the entry list][entry]). A
  disabled element "is barred from constraint validation", and "A form control that is disabled must prevent any
  click events that are queued on the user interaction task source from being dispatched on the element"
  ([fe-disabled][fe-disabled]).
- **`formDisabledCallback`.** "When the disabled state of a form-associated custom element is changed, its
  formDisabledCallback is called, given the new state" ([custom element reactions][cer]); an upgrade enqueues it with
  `true` for an already-disabled element ([upgrade][upgrade]). whatwg/html#8365 (open since 2022-10-07) notes that
  the normative trigger is missing apart from upgrades, that the descendant clause is "not precise" about
  shadow-including, and, in a 2024-09-05 comment, reports that toggling a shadow-root fieldset fires no
  `formDisabledCallback` on slotted FACEs in Firefox, Chrome and Edge ([#8365][8365]). In the same issue, a
  maintainer advises against "sprouting" a `disabled` attribute from the callback, because the attribute then
  overrides the fieldset.
- **WPT.** `custom-elements/form-associated/form-disabled-callback.html` ([d73d9dc][wpt-fdc]) asserts the callback
  fires only on effective changes (toggling a fieldset around an element that has its own `disabled` fires nothing);
  `form-disabled-legend.html` ([4eb09bc][wpt-legend], 2026-09-04) covers the first-legend exemption for FACEs;
  `disabled-delegatesFocus.html` ([08f9858][wpt-df]) asserts that a disabled FACE with `delegatesFocus` still
  receives focus. wpt.fyi stable runs of 2026-11-26 (Chrome 158, Firefox 161, Safari 27.2) pass all three and
  `fieldset-elements*.html` and `focusability.html` ([wpt.fyi][wptfyi]). No WPT under
  `html/semantics/forms/the-fieldset-element/` covers slotted controls ([directory][wpt-fsdir]).

The premise of R9 holds: per HTML, and in every engine probed, a shadow-root fieldset does not disable slotted
light-DOM controls (§2.2).

### 2.2 Q2: a `<fieldset disabled>` inside a shadow root (probe P1)

The host `x-shadow-fs` renders `<fieldset><legend><slot name="legend"></slot></legend><slot></slot><input
id="shadowctl"></fieldset>` in its shadow root and forwards its `disabled` attribute to the inner fieldset. Slotted
in light DOM: `<input>`, `<button>`, `<select>`, `<textarea>`, a FACE with `tabindex="0"` (`x-face`), a FACE with
`delegatesFocus` and an inner `<input>` (`x-face-df`), a non-FACE host with `tabindex="0"` (`x-plain`), and the
built `<line-button>` and `<line-chip>` from this worktree. Results were the same in all four builds, except the macOS
WebKit Tab key (§2.7).

| Check | Result (Chromium, Firefox, macOS WebKit, Linux WebKit) |
|---|---|
| Inner fieldset `:disabled`; `shadowctl` (shadow-tree descendant) `:disabled` | `true`; `true` |
| Each slotted control `:disabled` | `false`, all nine |
| `formDisabledCallback` calls on the slotted FACEs | none |
| `focus()` on each slotted control | takes focus (`x-face-df` and the line controls on their inner element) |
| Tab order | every slotted control; only `shadowctl` is skipped |
| Mouse click on `x-face`, `<button>`, `<line-button>`, `x-face-df` | `click` dispatched each time |
| `new FormData(form)` | `nin`, `nsel`, `nta`, `face`, `facedf` (all named, value-bearing controls) |
| Real GET submission (P8) | `?nin=1&face=1&facedf=1` |
| `form.checkValidity()` with an invalid slotted FACE | `false` (not barred) |
| `<line-button>` `data-disabled`, inner `<button disabled>` | absent, `false` |
| Inner fieldset `.elements.length` | `1` (`shadowctl` only); `form.elements` lists the slotted controls |
| Host `:disabled` | `false` |
| Chromium accessibility tree (CDP) | `group "Legend"` containing the slotted controls, none `disabled`; `shadowctl` `disabled` |

The shadow-root fieldset still groups and names its slotted content (Chromium CDP; Firefox and WebKit accessibility
trees were not read, §3.6). It disables nothing that is slotted.

### 2.3 Q3: a light-DOM `<fieldset disabled>` (probes P2, P4wrap)

The same controls inside a light-DOM `<fieldset disabled>`, with a first `<legend>` holding an `<input>` and a FACE,
plus a non-FACE host whose shadow root holds an `<input>` (`x-host-input`). P4wrap puts the fieldset inside a
custom element whose shadow root is a bare `<slot>`. All four builds agreed.

| Control | `:disabled` | `focus()` | `formDisabledCallback` | In `FormData` | Click |
|---|---|---|---|---|---|
| `<input>`, `<select>`, `<textarea>`, `<button>` | `true` | refused | n/a | no | none dispatched (`<button>`) |
| `x-face` (FACE, `tabindex="0"`) | `true` | refused | `[true]` | no | none dispatched |
| `x-face-df` (FACE, `delegatesFocus`) | `true` | **inner input focused** (§2.4) | `[true]` | no | none dispatched |
| `<line-button>` | `true`; `data-disabled` set; inner `<button disabled>` | refused | (its own) | n/a | none dispatched |
| `<line-chip>` (not FACE) | `false` | focused | none | n/a | n/a |
| `x-plain` (not FACE) | `false`, and `:enabled` `false` | focused | none | n/a | n/a |
| `x-host-input` inner `<input>` | `false` | focused | none | n/a | n/a |
| `<input>` and FACE in the first `<legend>` | `false` | focused | none | yes | dispatched |

- Toggling the fieldset off and on gave each FACE the history `[true, false, true]`, and `<line-button>` dropped and
  regained `data-disabled`.
- P4wrap gave the same rows: a slot-only custom-element ancestor does not interfere.
- `fieldset.elements` held the nine listed elements; `<line-chip>`, `x-plain` and `x-host-input` are not listed.
- Chromium's accessibility tree marked the native input, a FACE with `role="checkbox"` and `<line-button>`
  `disabled` inside the light fieldset (§3.6).

### 2.4 Q4: a disabled FACE that delegates focus (probe P5)

In a light `<fieldset disabled>`, in all four builds:

| Element | `:disabled` | Mouse click at its centre | `focus()` | Typing `x` |
|---|---|---|---|---|
| `x-face` (no `delegatesFocus`) | `true` | `pointerdown` only; focus goes to `body` | refused | n/a |
| `x-face-df`, inner `<input>` left enabled | `true` | `pointerdown`, then `focusin` on the inner input; no `mousedown`, `mouseup` or `click` | inner input focused | value becomes `x` |
| `x-face-df-good`, inner `<input>.disabled` set from `formDisabledCallback` | `true` | `pointerdown` only; focus goes to `body` | refused | value stays empty |

The host is "actually disabled", but its shadow tree is not part of any fieldset, so the inner input stays an
enabled, focusable, editable control. WPT `disabled-delegatesFocus.html` encodes the focus half as intended
behaviour (§2.1). `<line-button>` already disables its inner `<button>` from `#formDisabled`
(`packages/line-components/src/button/button.ts:193-236`, `:352`), and P2 shows the inner button disabled.

### 2.5 Q5: nested fieldsets and the `<legend>` exemption (probe P3)

Markup: `<fieldset id="outer" disabled>` with a first legend (FACE `olegface`, input `oleginput`), an inner
`<fieldset id="inner">` with its own first legend (FACE `ilegface`, input `ileginput`) and a FACE `deep` plus input
`deepin`, and a second `<legend>` of the outer fieldset (FACE `leg2face`). Identical in all four builds.

| Check | Result |
|---|---|
| `outer`, `inner` (enabled itself, inside a disabled one) `:disabled` | `true`, `true` |
| First legend of the disabled fieldset: `olegface`, `oleginput` | not disabled |
| First legend of the inner fieldset: `ilegface`, `ileginput` | disabled (the inner legend does not shield from the outer fieldset) |
| Second legend of the outer fieldset: `leg2face` | disabled |
| `deep` history over `outer=false`, `inner=true`, `outer=true`, `inner=false`, `outer=false` | `[true]` → `[true,false]` → `[…,true]` → unchanged → unchanged → `[…,false]`; one call per effective change |
| FACE with its own `disabled` in a fieldset toggled on and off | `[true]` from upgrade only, no call on the toggles |
| `deep` moved out of the disabled tree, then back in | `false` then `true`, one call each |

### 2.6 Q6: `:disabled`, focus, keyboard and clicks

- **`:disabled`.** Matches a native control or a FACE that is disabled by its own attribute or a light ancestor
  fieldset (P2, P3, P4attr). It never matches a slotted control through a shadow fieldset (P1), an `inert` subtree
  (P4inert), or a non-FACE custom element in any setup; such an element matches neither `:disabled` nor `:enabled`.
- **Focus.** A disabled control is refused by `focus()` and skipped by Tab, except the `delegatesFocus` case of §2.4.
- **Tab order.** Chromium, Firefox and Linux WebKit stepped through `<button>`, `<line-button>` and `<line-chip>`
  with `Tab`. macOS WebKit skipped all three with `Tab` and matched the others with `Alt+Tab`, the key the repo's
  e2e helpers use on macOS WebKit (`packages/line-components/__tests__/integration/alert/alert.e2e.ts:101-102`).
  This is the platform setting, not fieldset behaviour.
- **Clicks.** No `click` is dispatched on a disabled native button or FACE (P2), while `pointerdown` is (P5).
  whatwg/html#5886 records that engines differ on bubbling from a child inside a disabled `<button>`
  ([#5886][5886]); the probes clicked the element itself and did not test that case.

### 2.7 Q7: submission and constraint validation (probes P1–P4, P8)

| Setup | `FormData` keys | GET request query (P8) | `form.checkValidity()` with an invalid FACE |
|---|---|---|---|
| Shadow-root fieldset, disabled | all slotted controls | `?nin=1&face=1&facedf=1` | `false` |
| Light fieldset, disabled | only the legend controls | empty | `true` |
| Light fieldset, disabled, controls in the first legend | — | `?nin=1&face=1&facedf=1` | — |
| Outer disabled, controls in an enabled inner fieldset | — | empty | — |
| `inert` on the shadow-fieldset host | all controls | `?nin=1&face=1&facedf=1` | `false` |
| Script sets `disabled` on each slotted listed element (P4attr) | none | — | `true` |

Same in Chromium, Firefox, macOS WebKit and Linux WebKit.

### 2.8 Q8a: Zag's fieldset tracking

- **1.49.0** (`@zag-js/dom-query` `dist/form.mjs:62-72`): `trackFieldsetDisabled` takes `el.closest("fieldset")`,
  reports `fieldset.disabled` and observes only that fieldset's `disabled` attribute. Checkbox wires it from its
  hidden input into a `fieldsetDisabled` context (`@zag-js/checkbox` 1.49.0 `dist/checkbox.machine.mjs:27`, `:64`,
  `:85-89`).
- **2.0.0-next.4** (`@zag-js/dom-query` `dist/form.mjs:64-72`, with the shared `fieldsetDisabledObserver` it uses at
  `:63`): reports `fieldset.matches(":disabled")` and observes every ancestor fieldset.

Run in the probe page against real elements (§3.4), both in all four builds:

| Element | Platform `:disabled` | 1.49.0 | 2.0.0-next.4 |
|---|---|---|---|
| Input in a disabled light fieldset | `true` | `true` | `true` |
| `deepin` (inner fieldset enabled, outer disabled) | `true` | `false` | `true` |
| `ileginput` (first legend of the inner fieldset, outer disabled) | `true` | `false` | `true` |
| Input in the first legend of a disabled fieldset (`legin`, `oleginput`) | `false` | `true` | `true` |
| Input slotted into a shadow-root disabled fieldset | `false` | no callback | no callback |
| Input inside a non-FACE host's shadow root, host in a disabled fieldset | `false` | no callback | no callback |

A machine's hidden or inner input inside a line control's shadow root has no fieldset ancestor in its tree, so
`closest()` finds none and Zag never reports a disabled fieldset. This confirms the plan §1 inference for fieldsets
(`docs/plans/02-plan-essential-forms.md:36-42`); R1 owns the machine side.

### 2.9 Q8b: prior art

- **Zag `@zag-js/fieldset` 2.0.0-next.4** (npm `latest` dist-tag 2.0.0-next.4, `next` 2.0.0-next.2; no stable
  version). `getRootProps` returns `disabled: prop("disabled")` for the root, which is a native `<fieldset>` in the
  framework adapters, so propagation is the platform's; the machine tracks an ancestor fieldset with
  `trackFieldsetDisabled` (`dist/fieldset.machine.mjs:26`, `:42-46`; `dist/fieldset.connect.mjs:27-37`).
- **Lion** (`@lion/ui` 0.27.0). `lion-fieldset` sets `role="group"` on the host and no native fieldset
  (`components/form-core/src/form-group/FormGroupMixin.js:175`). On `disabled` it calls `makeRequestToBeDisabled()`
  on each registered Lion child, which saves the child's own `disabled` and sets the reflected property to `true`,
  restoring it on retract (`FormGroupMixin.js:212-217`, `:241-254`, `:580-582`;
  `components/core/src/DisabledMixin.js:35-57`). Native controls that are not Lion fields are not touched.
- **FAST, Shoelace, Material Web**, as discussed in the whatwg/html#8365 thread in 2022 (not re-checked here): the
  host's own `disabled`, and in FAST also `formDisabledCallback`. Material Web asked for fieldset support through
  `formDisabledCallback` in [material-web#5049][mw5049].
- **Customized built-ins.** WebKit's position on customized built-in elements is "oppose" ([WebKit
  standards-positions#97][wk97]). In probe P6, `customElements.define('x-builtin-fs', class extends
  HTMLFieldSetElement {}, { extends: 'fieldset' })` did not throw in WebKit, but
  `document.createElement('fieldset', { is: 'x-builtin-fs' })` returned a plain `HTMLFieldSetElement` (macOS and
  Linux); Chromium and Firefox upgraded it.

### 2.10 Q8c: mechanisms open to `<line-fieldset>`

"Parity" means the four effects of §2.1: `:disabled`, no focus, no submission, barred from validation.

| # | Mechanism | Native slotted controls | FACE line controls | Non-FACE line controls | Costs and evidence |
|---|---|---|---|---|---|
| A | Shadow-root `<fieldset>` + slots, `disabled` forwarded to it | nothing | nothing | nothing | Groups and names the content (Chromium). Does not propagate (P1) |
| B | A + script writes `disabled` on slotted listed elements (Lion) | parity (P4attr) | parity, through their own attribute | through their `disabled` prop | Writes author attributes and must restore them; re-implements nesting, first legend, deep descendants (controls inside `<line-field>`), late insertion; overrides the fieldset for the child (whatwg/html#8365); a framework that renders `disabled` may fight it [INFERENCE]; MANIFESTO Law 5 forbids DOM mutation outside Lit's cycle (`docs/MANIFESTO.md:47`) |
| C | A native `<fieldset>` in light DOM, authored around the controls | parity (P2) | parity through `formDisabledCallback` (P2, P3) | none, as for a native fieldset (SD36) | Native semantics, nesting, legend, submission and focus in all builds; Law 7 (`docs/MANIFESTO.md:51`). The fieldset and legend are light DOM, so they are styled directly, not through `::part()` (Law 1, `:39`) |
| D | `<fieldset is="line-fieldset">` | parity | parity | none | Does not upgrade in WebKit (P6) |
| E | A line-only protocol: line controls find the nearest `<line-fieldset>` and fold it into their disabled state (as Button folds `#formDisabled`) | nothing | `data-disabled`, `:state(disabled)`, focus and value handled by each control; `:disabled` never matches and `willValidate` stays `true` unless each control also writes its own `disabled` | possible | No platform hook crosses the slot; a component may not import another (Law 4, `:45`), so it needs an event or context protocol [INFERENCE] |
| F | `inert` on the host or the slotted controls | no focus or clicks; still submitted and validated; not `:disabled` (P4inert, P8) | same | same | Removes the subtree from Chromium's accessibility tree (P7), unlike `disabled` |
| G | `<line-fieldset>` as a FACE | nothing | nothing | nothing | Its own `disabled` and an outer fieldset make the host `:disabled`, but a FACE does not disable descendants (§2.1) |

Recommended: C, a native `<fieldset>` in light DOM as the only propagation source. It is the one mechanism with
parity for native and form-associated controls in all four builds without writing author state, and it is what Zag
2.0's fieldset renders. It requires each form-associated line control to implement `formDisabledCallback` as Button
does, including its inner native control (§2.4). What `<line-fieldset>` then is, around or instead of that native
fieldset, is a catalogue and spec question (§6 Q1). B is the alternative if `<line-fieldset>` keeps a shadow-root
anatomy and must disable slotted controls; E only adds to C or B for non-FACE line controls.

## 3. Probes

All probes ran on 2026-11-26 on macOS 27.2 (arm64) from the worktree `line-ui-z24` (branch
`docs/01-z24-r9-fieldset`, HEAD `aac879d`, `origin/main` `9c9b1f4`), after `HOME=/tmp/emptyhome bun install
--frozen-lockfile` with Bun 1.4.5 and `bun --filter '@websublime/line-core' build` and `bun --filter
'@websublime/line-components' build` (both exit 0). Probe files lived in `/tmp/z24-probes/` and were deleted
afterwards; the repo tree stayed clean.

### 3.1 Setup

- **Page.** One `index.html` served by `page.route('http://probe.test/**')` from disk (no server, no port). It defines
  `x-face`, `x-face-df`, `x-plain`, `x-host-input`, `x-shadow-fs` and `x-wrap` as described in §2.2–§2.3 (P5 adds
  `x-face-df-good`, §2.4), records
  every `formDisabledCallback` argument per element id, logs `click` (and, in P5, `pointerdown`, `mousedown`,
  `mouseup`, `focusin`) in the capture phase on `document`, and reads the deep active element through open shadow
  roots.
- **Line controls.** `<line-button>`, `<line-icon-button>` and `<line-chip>` bundled from the worktree's built
  `dist` with `bun build --target browser --format esm` (120.5 KB).
- **Zag.** `@zag-js/dom-query` 1.49.0 and 2.0.0-next.4 `dist/*.mjs` from `npm pack` tarballs, imported as ES modules;
  each version's `trackFormControl` ran on the element and its first callback value was recorded.
- **Scripts.** `probe.cjs` (P1–P4), `probe2.cjs` (P5–P7) and `probe3.cjs` (P8), each `node <script>
  <playwright> <www> <out.json> [engines]`, one engine at a time, one worker. Interactions use real input
  (`page.mouse.click` at the element's centre, `page.keyboard.press`).

### 3.2 Engines

| Build | How it ran |
|---|---|
| Chromium 159.0.8154.6, Firefox 159.0, macOS WebKit 27.2 (build 2388) | Host, Node 22.23.5, the worktree's Playwright 1.65.1 |
| Linux WebKit 27.2 (build 2388, aarch64) | `docker run --rm --cpus 2 --memory 1g --ipc=host -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright -v <worktree>:/work:ro -v /tmp/z24-probes:/probes mcr.microsoft.com/playwright:v1.65.1-noble`; Ubuntu 24.04.5, the container's Node 26.13.1 running the worktree's Playwright 1.65.1 JavaScript from the mounted `node_modules`; nothing installed in the container |

This is a local aarch64 Linux run with `--cpus 2`, as shown. The review of this note re-ran P1 and P2 in the same
image with `--cpus 1` and reported the same values (review report, not observed by this run). The CI runner is
x86_64 and has not run these probes.

### 3.3 Probe list and results

| Probe | What | Chromium | Firefox | macOS WebKit | Linux WebKit |
|---|---|---|---|---|---|
| P1 | Shadow-root `<fieldset disabled>`, nine slotted controls (§2.2) | nothing slotted disabled | same | same | same |
| P1 Tab | Tab order from a start button | all nine | all nine | `Tab` skips the three buttons; `Alt+Tab` all nine | all nine |
| P2 | Light `<fieldset disabled>`, legend, non-FACE hosts (§2.3) | parity for native and FACE; non-FACE enabled; legend exempt | same | same | same |
| P2 toggle | Fieldset off, on | FACE history `[true,false,true]`; `<line-button>` `data-disabled` follows | same | same | same |
| P3 | Nested fieldsets and legends (§2.5) | per spec | same | same | same |
| P4inert | `inert` on the shadow-fieldset host | no focus, clicks reach the form; submitted, validated, not `:disabled` | same | same | same |
| P4attr | `disabled` written on slotted listed elements | parity | same | same | same |
| P4wrap | Light fieldset inside a slot-only custom element | parity | same | same | same |
| P5 | Disabled FACE pointer, focus, typing (§2.4) | `delegatesFocus` leak; fixed by disabling the inner input | same | same | same |
| P6 | Customized built-in fieldset | upgrades | upgrades | define ok, no upgrade | define ok, no upgrade |
| P7 | Accessibility tree through CDP (§3.6) | see §3.6 | not run | not run | not run |
| P8 | Real GET submission (§2.7) | as §2.7 | same | same | same |
| Zag | `trackFormControl` 1.49.0 and 2.0.0-next.4 (§2.8) | as §2.8 | same | same | same |

macOS WebKit and Linux WebKit differed only in the `Tab` key convention. Every other value matched, in every
probe.

### 3.4 Zag and Lion sources

`npm pack` in a `mktemp -d` directory, registry `https://registry.npmjs.org`: `@zag-js/dom-query@1.49.0`,
`@zag-js/checkbox@1.49.0`, `@zag-js/dom-query@2.0.0-next.4`, `@zag-js/fieldset@2.0.0-next.2` and `@2.0.0-next.4`,
`@zag-js/field@2.0.0-next.2`, `@lion/ui@0.27.0`. `npm view` gave the dist-tags quoted in §2.9; `@zag-js/fieldset`
lists only 2.0.0-next.2, next.3 and next.4.

### 3.5 Specification and WPT sources

The WHATWG HTML multipage pages `form-elements`, `form-control-infrastructure`, `custom-elements`,
`semantics-other` and `interaction` were fetched on 2026-11-26 (Last-Modified 2026-11-26 00:20:42 GMT) and the
quoted sentences extracted. WPT files at the cited commits on `master`; wpt.fyi results from the `master` and
`stable` runs `6329870674821120` (Chrome), `6490499633119232` (Firefox) and `5120590437154816` (Safari), revision
`dc65cf0a3a`.

### 3.6 Accessibility tree

- **Chromium (P7).** `Accessibility.getFullAXTree` through a CDP session. Shadow fieldset disabled: `group "Legend"`,
  `textbox "nin"`, `checkbox "facecb"` (a FACE with `role="checkbox"`) and `button "lbtn"`, none disabled. Light
  fieldset disabled: the same three marked `disabled`. `inert` on the host: none of them in the tree.
- **Playwright `ariaSnapshot()`** gave identical output in all engines because Playwright computes it in its
  injected script, not from the engine's tree: its `isNativelyDisabled` covers only `BUTTON`, `INPUT`, `SELECT`,
  `TEXTAREA`, `OPTION` and `OPTGROUP`, through `element.closest("FIELDSET[DISABLED]")` and any `:scope > LEGEND`
  (`playwright-core` 1.65.1 `lib/coreBundle.js`). So `toBeDisabled()` and `ariaSnapshot()` do not see a FACE's
  disabled state, and treat a control in a second legend as exempt. They are not engine evidence.
- Firefox and WebKit accessibility trees were not read.

## 4. Fit with line://ui

- **Button already conforms.** `formDisabledCallback` sets `#formDisabled`, the machine reads `disabled ||
  #formDisabled`, and the inner `<button>` gets `disabled` (`packages/line-components/src/button/button.ts:193-236`;
  `docs/specs/0002-button.md:109`). P2 reproduced it in all four builds, through a slotted wrapper as well. The
  existing e2e covers a light fieldset (`packages/line-components/__tests__/integration/button/button.e2e.ts:363-383`).
- **`FormAssociated` mixin.** It declares `formDisabledCallback` and implements nothing
  (`packages/line-core/src/form-associated.ts:44-45`, `:122`). Stream F's shared layer (plan §4.1) is where the
  combined state (own `disabled` or fieldset) and the inner-control disabling of §2.4 can live once.
- **Non-FACE components.** IconButton and Chip are not disabled by a fieldset by design (Phase 1 spec SD36,
  `docs/specs/01-spec-core-primitives.md:2419`; `docs/specs/0003-icon-button.md:53`; `docs/specs/0008-chip.md:174`).
  P2 confirms it for `<line-chip>`. Phase 2 Field and Fieldset are not form-associated (plan §2.1 table,
  `docs/plans/02-plan-essential-forms.md:79-80`).
- **Field.** Field reflects `data-disabled` from explicit props, child events and native validity (ARCHITECTURE §9,
  `docs/ARCHITECTURE.md:480-485`). No listed child event carries a disabled change. A fieldset toggle reaches a FACE
  only through `formDisabledCallback` (P2), so Field learns it only if the control reports it.
- **ChoicePicker.** ARCHITECTURE §17.3 renders a multiple-selection ChoicePicker as a `<line-fieldset>` of
  `<line-checkbox>` elements (`docs/ARCHITECTURE.md:1623`). With mechanism A, disabling that `<line-fieldset>` would
  disable none of its checkboxes.
- **Reset sheet.** `reset.fieldset.css` targets a `fieldset` and `legend` in a shadow root (ARCHITECTURE §14.4
  Reset Module Contents, `docs/ARCHITECTURE.md:972-984`; §14.7 reset-module table, `:1160`; §14.3 only lists the
  file in the tree); under mechanism C the native fieldset is in light DOM, where a shadow
  reset sheet does not reach it.

## 5. Contradictions and gaps

Per PROCESS §2, research that contradicts the plan returns to the plan and the PRD before spec work. These are
flagged, not resolved.

1. **PRD §4.2 "disabled propagation" vs a shadow-root fieldset.** PRD §4.2 promises "Semantic grouping of related
   controls with legend and disabled propagation" for a Static Fieldset (`docs/PRD.md:282`). A `<line-fieldset>` that
   renders its `<fieldset>` in its shadow root, which is the shape `reset.fieldset.css` assumes (ARCHITECTURE §14.4,
   `:972-984`; §14.7, `:1160`) and the one that gives the fieldset and legend `::part()` names (Law 1), propagates nothing to slotted controls
   in any engine (P1). Propagation needs either a light-DOM native fieldset (C) or script that writes author
   attributes (B), and B conflicts with MANIFESTO Law 5 (`docs/MANIFESTO.md:47`). Neither the PRD, ARCHITECTURE nor
   the plan states which shape Fieldset takes.
2. **ARCHITECTURE §14.8 on `:disabled`.** "`:disabled` matches only a form-associated host with `disabled`;
   `data-disabled` covers every component, and a disabled `fieldset` around a form-associated one"
   (`docs/ARCHITECTURE.md:1244`). In all four builds `:disabled` also matches a form-associated host with no
   `disabled` attribute inside a disabled light fieldset (P2, P3). The sentence understates where `:disabled` matches.
3. **Plan §2.3 and §7.1 "disabled from an ancestor `fieldset`".** The criterion (`docs/plans/02-plan-essential-forms.md:115`,
   `:472`) is met for a light-DOM `<fieldset>` ancestor (P2). It cannot be met by a `<line-fieldset>` with a shadow
   fieldset (P1). The plan does not say whether `<line-fieldset>` counts as "an ancestor `fieldset`".
4. **Zag fieldset tracking vs the platform.** Zag 1.49.0, the O4 baseline, misses a disabled outer fieldset, and both
   1.49.0 and 2.0.0-next.4 mark first-legend controls disabled (§2.8). This is a Zag defect, not a repo document
   error; it bears on R1's replacement of `closest('fieldset')` with the host callbacks.
5. **Plan §2.1 and §3 "`@zag-js/fieldset` is 2.0.0-next only"** (`:80`, `:184`) holds, with a nuance for the §5.2
   re-check: npm `latest` of `@zag-js/fieldset` and `@zag-js/field` is 2.0.0-next.4 (no stable release exists), and
   `next` is 2.0.0-next.2.

No finding contradicts MANIFESTO Law 7 or ARCHITECTURE §7: native fieldset disabling reaches FACEs through
`ElementInternals` as both describe.

## 6. Open questions for the post-research revision and the Phase 2 spec

1. **Fieldset shape.** Which mechanism of §2.10 does Fieldset use?
   - C with `<line-fieldset>` as a wrapper around an authored native `<fieldset>`, which it reads but does not write (recommended direction);
   - C with no `<line-fieldset>` element: a documented native `<fieldset>` pattern, which changes the PRD §4.2
     catalogue row, the `./fieldset` entry point (`docs/PRD.md:721`; `docs/ARCHITECTURE.md:586`) and ARCHITECTURE
     §17.3 ChoicePicker;
   - B: a shadow-root anatomy that writes `disabled` on slotted controls, with the Law 5 conflict and the restore,
     nesting, legend and late-insertion rules it must re-implement;
   - A: grouping and legend only, with "disabled propagation" dropped from PRD §4.2.
2. **Styling.** Under C the fieldset and legend are light DOM. Is that acceptable against Law 1 (`::part()` for every
   styleable zone), and where does `reset.fieldset.css` apply then?
3. **Non-FACE line controls.** Should a disabled Fieldset disable IconButton, Chip and other non-form-associated
   interactive components (mechanism E, or B), or does SD36's "native fieldset parity" stand for Phase 2?
4. **Shared form layer.** Does stream F's layer own the combined disabled state (own `disabled` or
   `formDisabledCallback`), its reflection (`data-disabled`, `:state(disabled)`), and the disabling of the inner
   native control and of a hidden machine input (§2.4)? Does it state "never write the host `disabled` attribute
   from `formDisabledCallback`" (whatwg/html#8365)?
5. **Zag `fieldsetDisabled`.** When the host drives the machine's `disabled` prop from `formDisabledCallback`, is
   Zag's own `trackFieldsetDisabled` left inert (it finds no fieldset from a shadow root, §2.8) or disabled
   explicitly, so a later Zag version cannot start disagreeing with the platform on the legend exemption? (R1.)
6. **Field.** How does Field learn that a control became disabled through a fieldset: a Field-compatible event, a
   `:disabled` read on each child event, or no tracking? (R3.)
7. **Plan criterion.** Does "disabled from an ancestor `fieldset`" (plan §2.3, §7.1) mean a native `<fieldset>`
   only, or also `<line-fieldset>`? The answer follows Q1.
8. **ARCHITECTURE §14.8.** Realign the `:disabled` sentence (`docs/ARCHITECTURE.md:1244`) with §2.6 in the
   post-research revision?
9. **Test assertions.** Playwright's `toBeDisabled()` does not see a FACE's disabled state (§3.6). Should the Phase 2
   spec name `:disabled` matching, focus refusal, `FormData` and the request as the assertions for every
   form-associated component?
10. **Linux x86_64.** The CI runner has not run these probes; does the spec require a CI run before a WebKit claim
    from this note holds (plan §5.3)?

## 7. Sources

All retrieved 2026-11-26.

- HTML Standard: [concept-fe-disabled][fe-disabled]; [attr-fieldset-disabled][fs-disabled];
  [concept-element-disabled][actually]; [selector-disabled][sel]; [focusable area][focus]; [constructing the entry
  list][entry]; [custom element reactions][cer]; [upgrade an element][upgrade]
- DOM Standard: [tree descendant][dom-desc]; [shadow-including descendant][dom-sdesc]
- whatwg/html#8365, "`formDisabledCallback` should always fire when governing fieldset's disabled state changes":
  [link][8365]; linked engine bugs <https://bugzilla.mozilla.org/show_bug.cgi?id=1793559>,
  <https://bugs.chromium.org/p/chromium/issues/detail?id=1370956>
- whatwg/html#5886, "Event bubbling on disabled form elements": [link][5886]
- WPT: [form-disabled-callback.html][wpt-fdc]; [form-disabled-legend.html][wpt-legend];
  [disabled-delegatesFocus.html][wpt-df]; [the-fieldset-element][wpt-fsdir]; [wpt.fyi results][wptfyi]
- WebKit standards position on customized built-in elements: [WebKit/standards-positions#97][wk97]
- material-web#5049: [link][mw5049]
- npm tarballs (§3.4): `@zag-js/dom-query` 1.49.0 and 2.0.0-next.4, `@zag-js/checkbox` 1.49.0, `@zag-js/fieldset`
  2.0.0-next.2 and 2.0.0-next.4, `@zag-js/field` 2.0.0-next.2, `@lion/ui` 0.27.0
- `playwright-core` 1.65.1 `lib/coreBundle.js` (`isNativelyDisabled`, `belongsToDisabledFieldSet`), from the
  worktree's `node_modules`

[fe-disabled]: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#concept-fe-disabled
[fs-disabled]: https://html.spec.whatwg.org/multipage/form-elements.html#attr-fieldset-disabled
[actually]: https://html.spec.whatwg.org/multipage/semantics-other.html#concept-element-disabled
[sel]: https://html.spec.whatwg.org/multipage/semantics-other.html#selector-disabled
[focus]: https://html.spec.whatwg.org/multipage/interaction.html#focusable-area
[entry]: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-form-data-set
[cer]: https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-reactions
[upgrade]: https://html.spec.whatwg.org/multipage/custom-elements.html#concept-upgrade-an-element
[dom-desc]: https://dom.spec.whatwg.org/#concept-tree-descendant
[dom-sdesc]: https://dom.spec.whatwg.org/#concept-shadow-including-descendant
[8365]: https://github.com/whatwg/html/issues/8365
[5886]: https://github.com/whatwg/html/issues/5886
[wpt-fdc]: https://github.com/web-platform-tests/wpt/blob/d73d9dc406f6eaf5cb52facc67f7884587b1dfac/custom-elements/form-associated/form-disabled-callback.html
[wpt-legend]: https://github.com/web-platform-tests/wpt/blob/4eb09bcd9c9e54c1c75e0b62a653ecbe0be1c001/custom-elements/form-associated/form-disabled-legend.html
[wpt-df]: https://github.com/web-platform-tests/wpt/blob/08f9858b046d3e6cdfe4ebb8b45d4d11e480da6b/custom-elements/form-associated/disabled-delegatesFocus.html
[wpt-fsdir]: https://github.com/web-platform-tests/wpt/tree/master/html/semantics/forms/the-fieldset-element
[wptfyi]: https://wpt.fyi/results/custom-elements/form-associated?label=master&label=stable
[wk97]: https://github.com/WebKit/standards-positions/issues/97
[mw5049]: https://github.com/material-components/material-web/issues/5049
