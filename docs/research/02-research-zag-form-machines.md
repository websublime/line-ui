# Research: Zag form machines in Shadow DOM (R1)

**Row:** `01-Z16` (Phase 2 plan §5.1 R1; §5.2, §5.3; decisions O1, O4)
**Date:** 2026-11-26
**Repo sources** (locators at `origin/main` `9c9b1f4`): `docs/plans/02-plan-essential-forms.md` §1, §2.1, §2.3, §5.1 R1, §5.2, §5.3, §5.5, §5.7, §8; `docs/PRD.md` (v0.8.36) §1.7; `docs/ARCHITECTURE.md` (v0.8.28) §6, §7, §8, §9, §12, §15.1, §17.2; `docs/MANIFESTO.md` Laws 4, 5, 7, 9; `docs/specs/01-spec-core-primitives.md` §6.C.7, §10 SD29; `docs/research/01-research-zag-machines.md`; `packages/line-core/src/machine/line-machine-controller.ts`, `packages/line-core/src/form-associated.ts`, `packages/line-core/src/mixins/direction.ts`, `packages/line-components/src/chip/chip.ts`
**Toolchain baseline (row 01-Z14):** Zag 1.49.0 (every `@zag-js/*` package below), Lit 3.3.3, Bun 1.4.5, Playwright 1.65.1 with Chromium 159.0.8154.6, Firefox 159.0 and WebKit 27.2 build 2388; Node 22.23.5 on the host; macOS 27.2.1 arm64. Linux WebKit ran in `mcr.microsoft.com/playwright:v1.65.1-noble` (§3.1).
**Status:** Evidence. Research carries no rules (`docs/PROCESS.md` §1). Recommendations are marked "(recommended)"; every decision is an open question in §7.

> **TL;DR**
>
> - **Inner native inputs are inert for the page's form.** A native `<input>`, `<select>` or radio inside a shadow root has no form owner, a `form="id"` attribute does not resolve to a light-DOM form, `closest('form')` and `closest('fieldset')` return `null`, a disabled ancestor `fieldset` does not disable it, `form.reset()` does not reset it, and `form.checkValidity()` ignores it (probe P1, four engine builds). So every Zag form hook (`trackFormControl`, the hidden inputs' `name` and `form`) is a no-op, and the hidden inputs never leak into the host's form. The host's `ElementInternals` value, `formResetCallback` and `formDisabledCallback` work in all four builds (P1, P5).
> - **`LineMachineController` passes no `getRootNode`.** Zag reads `id`, `ids` and `getRootNode` from the props function once, at construction, and defaults the root to `document`. No Phase 1 component passes either. A Phase 2 component must put `id` and `getRootNode` in its props function. Without them the checkbox loses its `aria-labelledby` and the slider ignores pointer input, silently (P5, P12). A constant `id` per component is enough when the root is the shadow root: five running checkboxes on one page shared the same `id` and worked independently (P5).
> - **The controller starts machines too early for Phase 2.** It starts in `hostConnected`, before the first render. Machine-level effects then query a shadow root that is still empty. The checkbox press tracking never binds, and the slider thumb stays `visibility: hidden` for good, so it cannot take focus and the slider has no keyboard support (P5, P12). A probe-only controller that starts after the first render fixes both in all four builds. This contradicts ARCHITECTURE §6 and Phase 1 spec SD29, which keep the start in `hostConnected` (§6).
> - **Events.** Zag's own synthetic `click` and `input` events on hidden inputs do not leave the shadow root. `@zag-js/select` dispatches a `composed: true` `change` on every value change, which reaches the host and `document` (P16), and trusted `input` events from inner native controls are composed too (P2, P5). C3 says no component dispatches an unprefixed `input` or `change` event. The machines' change callbacks (`onCheckedChange`, `onValueChange`, `onValueChangeEnd`, `onValueCommit`) are what the `line-change` and `line-input` events can map to. They do not fire for the default value, so the host must set its initial form value itself (P5).
> - **zag#3088 is worse than reported.** At 1.49.0 a Select inside a shadow root stays open when focus moves to another element in the same shadow root, to a light-DOM element, or away with Tab. Only a pointer-down outside closes it (P16, four builds). `@zag-js/interact-outside` reads `composedPath()` in a deferred frame, after dispatch has emptied the path.
> - **zag#3239 reproduces without `scroll-padding`.** Focusing the hidden radio of a group inside a stuck `position: sticky` header scrolls the page by −360 px in every build (−424 px in Chromium and WebKit with `scroll-padding-top: 128px`), on a real click and on `api.focus()`. The same happens with a plain light-DOM radio styled with Zag's `visuallyHiddenStyle`. `focus({ preventScroll: true })` and `position: fixed` on the hidden input both give 0 (P9, P10). 1.49.0 has not taken the `preventScroll` change the maintainer promised.
> - **Number Input submits its formatted string.** In light DOM the `de-DE` input submits `12.345,00`. The machine also parses `defaultValue` with the locale, so `"1234.5"` becomes 12 345 under `de-DE`. `valueAsNumber` from `onValueChange` is the machine-readable value (P14).
> - **Toggle Group has no native input.** `setFormValue(FormData)` submits repeated entries in all four builds, even when the host has no `name` (P4, P11). Slotted toggle items are invisible to the machine's DOM queries, so roving focus dies. Radios in separate shadow roots do not form one group (P3, P11).
> - **Static fallback covers start failures only.** A machine that throws at start renders the fallback with no uncaught error. An action that throws at run time is an uncaught page error, the controller stays out of fallback, and the native checkbox and the form value disagree (P5, P6).
> - **RTL and touch.** With `dir` from the host, slider pointer input and arrow keys and toggle-group arrow keys mirror correctly. Touch taps drive the slider and the number-input stepper (P11–P15). Linux WebKit differs from macOS WebKit in one way that matters: it focuses a button on mouse-down, so a re-render that replaces the node under the pointer cancels the click (P17).

---

## 1. Question

Plan §5.1 R1 (`docs/plans/02-plan-essential-forms.md:263`) asks, for each Phase 2 machine at the O4 baseline:

| # | Sub-question |
|---|---|
| Q1 | Which machines, at which version, and do the plan §5.2 Zag facts hold at 1.49.0? |
| Q2 | How does `LineMachineController` pass `getRootNode`? |
| Q3 | What does the hidden or visible native input do inside a shadow root? |
| Q4 | How do the host callbacks replace Zag's `closest('form')` reset and `closest('fieldset')` disabled tracking? |
| Q5 | Which native `input` and `change` events do the machines dispatch, against C3? |
| Q6 | zag#3088 (focus outside not detected in a shadow root) for Select |
| Q7 | zag#3239 (hidden-input focus scroll) for Radio Group |
| Q8 | Number Input submitting its formatted string |
| Q9 | Toggle Group with no native input |
| Q10 | The static fallback when a machine fails (MANIFESTO Law 9, PRD §1.7) and what happens to the form value |
| Q11 | RTL (`dir`) |
| Q12 | Touch and pointer behaviour |

The machines are the pre-built candidates of plan §2.1 (`:72-88`): checkbox, switch, radio-group, toggle-group, slider,
number-input, select, editable, and the two tier candidates password-input and date-input. Date Input is its own machine,
`@zag-js/date-input`, not a mode of a date picker.

## 2. Findings

### 2.1 Q1 — Versions and the plan §5.2 Zag facts

`npm` registry, retrieved 2026-11-26 (`curl https://registry.npmjs.org/@zag-js/<pkg>`):

| Package | `latest` | 1.49.0 published | Repo |
|---|---|---|---|
| `core`, `vanilla` | 1.49.0 | 2026-11-22T19:18Z, 19:20Z | `^1.49.0` (`packages/line-core/package.json:38-39`; `bun.lock:999`, `:1013`) |
| `checkbox`, `switch`, `radio-group`, `toggle-group`, `slider`, `number-input`, `select`, `date-input`, `password-input`, `editable` | 1.49.0 | 2026-11-22T19:18Z–19:21Z | not declared yet |
| `field`, `fieldset` | **2.0.0-next.4** (`next` is 2.0.0-next.2) | — | not declared |

- No `@zag-js/*` version has been published after 1.49.0. The `next` tag of the 1.x packages is now 2.0.0-next.4.
- The repo lock now resolves Zag 1.49.0, so plan §5.2's "against the locked 1.47.0" (`:276`) describes the state before
  row 01-Z14.
- The four Phase 2 fixes that plan §5.2 names are in the changelogs on `main` (retrieved 2026-11-26):
  - checkbox and switch: the hidden input's `aria-labelledby` no longer points at a missing label (1.49.0, zag#3676, which
    adds `trackRenderedParts`);
  - number-input: fast typing no longer drops keys (1.49.0, commit `e8e6f24`);
  - slider: stepping past `max` with a decimal `step` no longer moves the value down (1.48.0, zag#3562);
  - date-input: segment labels follow `locale` and a `segmentLabel` translation exists (1.49.0, zag#3600).
- Select 1.48.0 also fixed a page scroll when the highlighted item scrolls into view (zag#3574), and `dismissable` 1.48.0
  changed which layers close (zag#3599). Neither touches the shadow-root behaviour in §2.6.
- `@zag-js/field` and `@zag-js/fieldset` exist only as 2.0.0 prereleases, as plan §2.1 says (`:79-80`). Their `latest`
  dist-tag points at 2.0.0-next.4, so an unversioned install takes a prerelease.

### 2.2 Q2 — `getRootNode` through `LineMachineController`

- `VanillaMachine` 1.49.0 keeps a props function as a live source, but it reads `id`, `ids` and `getRootNode` from it once,
  in the constructor (`@zag-js/vanilla` `dist/machine.mjs:159-166`). `createScope` defaults the root to `document`
  (`@zag-js/core` `dist/scope.mjs:4`), and every part lookup goes through `getRootNode().getElementById(id)` (`:8`).
- The controller hands the component's props function to that constructor and adds nothing of its own
  (`packages/line-core/src/machine/line-machine-controller.ts:92-96`). Its doc comment already says that scope is read
  once (`:24-25`), and so does the Phase 1 spec (`docs/specs/01-spec-core-primitives.md:1272`).
- No Phase 1 component passes `id` or `getRootNode`. Chip, for example, passes `pressed`, `disabled` and
  `onPressedChange` only (`packages/line-components/src/chip/chip.ts:178-185`). Phase 1 machines never looked up their
  parts by id, so the gap was harmless until now.
- Every Phase 2 machine looks its parts up by id: the hidden inputs, the root, the label, the slider control and thumbs,
  the select content and items, the date segments (`*.dom.mjs` in each package).

**Probe results** (P5, P12; all four engine builds identical):

| Host props | Checkbox | Slider |
|---|---|---|
| `id` and `getRootNode: () => this.shadowRoot` | `aria-labelledby="checkbox:cb:label"` on the hidden input | A click at 75 % gives 75 |
| No `getRootNode` | No `aria-labelledby` (the label is not found in `document`) | A click at 75 % leaves 50. No error is logged |

- The probe gave all six checkboxes on the page the same `id: 'cb'`. The five whose machine started each kept their own
  state, label link, reset and form value, because each scope searched its own shadow root (P5).

**Start order.** The controller starts the machine in `hostConnected` (`line-machine-controller.ts:92-96`), and Lit
renders later, in the update microtask. `VanillaMachine.start()` runs the machine-level `entry` actions and `effects`
synchronously (`dist/machine.mjs:279-284`, `:249-256`), so those effects run against an empty shadow root.

| Machine | Start-time effect that needs the DOM | Effect of an empty root | Probe |
|---|---|---|---|
| checkbox, switch | `trackPressEvent` on the root and hidden input (`checkbox.machine.mjs:70-80`) | No `data-active` while pressed | P5: `false` with the controller, `true` when started after the first render |
| slider | `trackThumbSize` finds no `[role=slider]` (`slider.machine.mjs:98`, `:213-226`; `slider.dom.mjs:15`) | With the default `thumbAlignment: "contain"` (`slider.machine.mjs:27`) the thumb keeps `visibility: hidden` (`slider.style.mjs:74-76`), so it cannot be focused, and the arrow keys do nothing | P12: thumb `hidden` and ArrowRight 75 → 75 with the controller; `visible` and 50 → 51 when started after the first render |
| checkbox, switch, radio-group, slider, number-input, select | `trackFormControlState` / `trackFormControl` | Moot inside a shadow root (§2.3) | P1, P5 |
| checkbox, switch, radio-group, select | `trackRenderedElements` | Recovers later through its own observer | P5: `aria-labelledby` present |

- The probe-only "deferred" controller started the machine in the first `hostUpdated`. It only worked once the template
  rendered every part with its final `id` and `role` before the machine existed. Otherwise the effects still found
  nothing (first P5 and P12 runs, before the template carried static ids).
- Phase 1 research had asked this as OQ7 ("a probe with a machine whose entry effect queries the shadow root",
  `docs/research/01-research-zag-machines.md:311`). The Phase 1 spec chose `hostConnected` as default SD29
  (`docs/specs/01-spec-core-primitives.md:958`, `:2412`). §6 flags the conflict.

### 2.3 Q3 — Native inputs inside a shadow root

**Platform behaviour** (P1; a `<p-native>` with a shadow root holding inputs, inside a light-DOM `<form>` and `<fieldset>`;
identical in all four builds):

| Check | Result | Why |
|---|---|---|
| `innerInput.form` | `null` | The form owner is found in the element's own tree (HTML "reset the form owner") |
| `form="f1"` on the inner input, `f1` a light-DOM form | `null` | The `form` attribute looks the id up in the input's tree |
| `closest('form')`, `closest('fieldset')` | `null`, `null` | `closest()` walks ancestors in the shadow tree only |
| `new FormData(form)` | Only the form-associated host's entry (`fa`) | Inner inputs are not listed elements of the form |
| `form.checkValidity()` with an empty `required` inner input | `true` | Inner inputs are not candidates of the form |
| `fieldset.disabled = true` | Inner input stays enabled; the form-associated host matches `:disabled` and gets `formDisabledCallback(true)` | A fieldset disables its DOM-tree descendants only |
| `form.reset()` after editing the inner input | Inner value stays edited; host gets `formResetCallback` once | Reset walks the form's controls |

So plan §1's "a native input inside a shadow root has no form owner … `closest()` does not cross the shadow boundary
[INFERENCE …]" (`:39-41`) is now observed. The same tree rule means a form inside a consumer's own shadow root
does not own the inputs inside a line component's shadow root either [INFERENCE: same rule, not probed].

**What each machine renders** (1.49.0 sources):

| Machine | Native element | Role in the machine | `name` / `form` props | Zag reset and disabled tracking |
|---|---|---|---|---|
| checkbox | visually hidden `<input type=checkbox>` | Focus, keyboard and accessible node; `aria-labelledby` the label (`checkbox.connect.mjs:100-145`) | both (`:109-110`) | `trackFormControl(hiddenInput)` → `input.form`, `closest('fieldset')` (`checkbox.machine.mjs:85-94`) |
| switch | same, `type=checkbox`, no `role="switch"` (`switch.connect.mjs:99-144`) | same | both | same |
| radio-group | one visually hidden `<input type=radio>` per item | Focus, keyboard (native arrow keys), accessible node (`radio-group.connect.mjs:155-212`) | `name: prop("name") \|\| prop("id")` (`:161`), `form` | `trackFormControl(root)` → `closest('form')`, `closest('fieldset')` (`radio-group.machine.mjs:87-96`) |
| toggle-group | none; items are `<button>`s (`toggle-group.anatomy.mjs`: `root`, `item`) | — | no `name` or `form` prop | none |
| slider | `<input type=text hidden>` per thumb (`slider.connect.mjs:278-288`) | Form value only; the thumb is the `role=slider` node | `name` (`name[]` for ranges), `form` | `trackFormControl(root)` (`slider.machine.mjs:190-199`) |
| number-input | the visible `<input type=text role=spinbutton>` (`number-input.connect.mjs:108-200`) | Everything | both (`:112-113`) | `trackFormControl(input)` (`number-input.machine.mjs:292-301`) |
| select | visually hidden `<select>` with `aria-hidden` and `tabIndex -1` (`select.connect.mjs:341-371`) | Form value and autofill; focus is forwarded to the trigger | both | `trackFormControl(hiddenSelect)` (`select.machine.mjs:385-395`) |
| date-input | `<input type=hidden>` per value; segments are `contentEditable` spinbuttons (`date-input.connect.mjs:299-316`) | Form value only | `name` (`name[i]` for ranges), `form` | none |
| editable | the visible `<input>` in edit mode (`editable.connect.mjs:94-125`) | Edit mode | both (`:100-101`) | none |
| password-input | the visible `<input type=password\|text>` (`password-input.connect.mjs:54-71`) | Everything; the machine holds only `visible` | `name`, no `form` (`password-input.props.mjs`) | `input.form` reset and submit hide the password (`password-input.machine.mjs:48-66`) |

- The hidden and visible inputs never join the page's form (P1, P5: the hidden inputs' `name` is `c1`, `c3`, `c4`, and
  none of them appears in `FormData`). Plan §5.5 asks "how a pre-built machine's native input stays out of the form"
  (`:406-407`). The shadow root already keeps it out.
- For checkbox, switch and radio-group the hidden input is the accessible control. `ariaSnapshot()` of the host reports
  `checkbox "Accept"` for the checkbox, `checkbox "Wi-Fi"` for the switch and `radiogroup "Pick"` with three `radio`
  children for the group (P5, P7, P8). ARCHITECTURE §15.1 lists these three among the components that "do NOT need a
  native element" (`docs/ARCHITECTURE.md:1337-1339`); §6 flags it.
- The switch is announced as a checkbox. Zag 1.49.0 sets no `role="switch"` anywhere in `switch.connect.mjs`.
- `@zag-js/password-input` hides the password on `reset` and `submit` of `input.form`
  (`password-input.machine.mjs:48-66`). Inside a shadow root `input.form` is `null`, so that safety net is gone.
  Form-associated elements get no submit callback, so the host would have to listen on its own form owner [INFERENCE: not
  probed].
- Date Input works inside a shadow root: typing `12252026` into the month segment gave `12/25/2026` in the segments, the
  hidden input and the host's `FormData` in all four builds (P18). Its `contentEditable` segments read the selection through
  `target.ownerDocument.getSelection()` (`date-input.connect.mjs:172`). R5 owns the rest of Date Input.

### 2.4 Q4 — Host callbacks in place of Zag's tracking

`trackFormReset` resolves the form as `el.form` for a form element and `el.closest('form')` otherwise
(`@zag-js/dom-query` `dist/form.mjs:52-61`). `trackFieldsetDisabled` uses `el.closest('fieldset')` and a
`MutationObserver` (`:62-72`). Inside a shadow root both return `null` and attach nothing. P5 compared a checkbox wired to
the host callbacks (`c1`) with one that left them to Zag (`c5`). All four builds agreed:

| Step | Host callbacks (`c1`) | Zag only (`c5`) |
|---|---|---|
| Toggle, then `form.reset()` | Back to the default (`checked`); `formResetCallback` ran once | Stays toggled; `formResetCallback` ran but nothing reset |
| `fieldset.disabled = true` | Host `:disabled`; hidden input `disabled`; `FormData` empty | Host `:disabled`; hidden input still enabled, and a click still toggles it |

- The probe reset through the machine API (`api.setChecked(default)`) and disabled by passing the fieldset state into the
  `disabled` prop. The checkbox and switch `connect` read `disabled` from the prop only (`checkbox.connect.mjs:9`;
  `switch.connect.mjs:9`). The machine's own `fieldsetDisabled` context feeds only `computed('disabled')`, which gates the
  press and focus-visible effects (`checkbox.machine.mjs:64`, `:71`, `:82`). So a host that set `fieldsetDisabled`
  through `CONTEXT.SET` would leave the hidden input enabled [INFERENCE from source; not probed].
- The disabled host is left out of `FormData` by the platform (P5: empty while the fieldset is disabled).
- The reset target is the default value, which the host already holds as its own default, so it needs no Zag `initial`
  value (`context.initial(...)` is what Zag's own reset reads, `checkbox.machine.mjs:91`).
- **The default value never reaches the form through the change callback.** `bindable` calls `onChange` only when the
  value changes, so a `default-checked` checkbox submitted nothing until the host set its initial form value at connect
  (P5: `c1` absent, `c2` present). The same holds for every machine's `defaultValue`.
- Each machine's setter, which a reset can call: checkbox and switch `setChecked`; radio-group, toggle-group, slider,
  number-input, select, date-input and editable `setValue` (`*.connect.mjs`).

### 2.5 Q5 — Native `input` and `change` events against C3

C3 reads "No component dispatches an unprefixed `input` or `change` event" (`docs/ARCHITECTURE.md:1578`). P2 (plain inputs)
and P5, P12 and P16 (machines) recorded every `click`, `input` and `change` that reached the host and `document`. All four
builds agreed:

| Source | Event | Reaches the host and `document`? |
|---|---|---|
| User click or Space on an inner checkbox | trusted `click` and `input` (composed) | Yes, retargeted to the host |
| Same | trusted `change` (not composed) | No |
| Typing in an inner text input | trusted `input` (composed) | Yes |
| Blur after typing | trusted `change` (not composed) | No |
| Checkbox, switch, radio-group untrusted set (`dispatchInputCheckedEvent`: `new Event('click', { bubbles })`, `form.mjs:40-48`) | synthetic `click` | No. It does not toggle the input either (P2: `checked` unchanged), because a plain `Event` named `click` runs no activation behaviour |
| Slider value change (`dispatchInputValueEvent`: `new Event('input', { bubbles })`, `form.mjs:31-39`; `slider.machine.mjs:90-93`) | synthetic `input` | No |
| Select value change (`select.machine.mjs:100-107`, `:669-678`) | synthetic `change`, **`composed: true`** | **Yes** (P16: `host:change(composed)(untrusted)<z-select>`) |

- Select's `change` fires from a `watch` on the value, so it also fires for programmatic and reset changes, not only for
  user picks (`select.machine.mjs:100-107`; only the user pick was probed).
- The machine callbacks that a component can turn into `line-change` and `line-input`:

| Machine | Commit (`line-change`) | Live (`line-input`) |
|---|---|---|
| checkbox, switch | `onCheckedChange` | — |
| radio-group | `onValueChange`; arrow keys commit (P8: `b`, then `c` on ArrowDown), as C9 expects (`:1584`) | — |
| toggle-group | `onValueChange` | — |
| slider | `onValueChangeEnd` (`slider.machine.mjs:237-241`) | `onValueChange` during drag and keys |
| number-input | `onValueCommit` (`number-input.machine.mjs:453`) | `onValueChange` |
| select | `onValueChange` | — |
| date-input | `onValueChange` | — |

- `onValueChange` can fire without a user edit. A `de-DE` number input with default `1234,5` reformatted to `1.234,50` when
  focus passed through it and left, and fired `onValueChange` (P14: `amount3=1234.5` appeared in `FormData` without any
  edit of that field).

### 2.6 Q6 — zag#3088, Select focus outside

zag#3088 ("onFocusOutside is not detected properly in a shadow root", opened by mbeckem on 2026-04-17, closed
`not_planned` with the `stale` label and an automated inactivity message on 2026-05-29) reports that focus moving between
two elements of the same shadow root does not close a popover or menu. After the close the reporter commented that the bug
persists and that a third-party draft PR carries the patch from the issue, which moves the `composedPath()` read out of
the deferred callback and adds a `focusin` listener on the shadow root.

At 1.49.0 `@zag-js/interact-outside` still reads `event.composedPath()` inside the deferred callback
(`dist/index.mjs:105-109`). Select passes `defer: true` (`select.machine.mjs:401`). A deferred read gets an empty path,
because dispatch clears the path when it ends (DOM Standard, "dispatch"). The target is then `undefined`, and
`isEventOutside` returns `false` for a non-element (`:45-46`).

P16 opened the Select with the keyboard each time and then moved focus. All four builds agreed:

| Focus or pointer move | Still open after 150 ms? |
|---|---|
| `.focus()` on another button in the same shadow root | **yes** |
| `.focus()` on a light-DOM button | **yes** |
| Tab from the open Select | **yes** |
| Pointer-down on the page outside | no (closes) |

So the gap is wider than the issue says: no focus move closes a Select whose content lives in a shadow root. Plan §8
already plans "a host-side focus-out listener" (`:513`). R4 owns Select.

### 2.7 Q7 — zag#3239, Radio Group focus scroll

zag#3239 (opened and closed `not_planned` on 2026-07-29) reports a page jump when a Segment Group or Radio Group item is
clicked inside a `position: sticky` container. The maintainer could not reproduce it without an inset on the input and
offered `{ preventScroll: true }` on the two internal `.focus()` calls. The reporter then showed the jump with no inset,
when the scroll root has `scroll-padding-top`.

- At 1.49.0 both calls still lack `preventScroll`: `api.focus()` (`radio-group.connect.mjs:39-41`) and the Safari click
  path (`:131-133`). `main` is the same on 2026-11-26 (`src/radio-group.connect.ts:50`, `:133`).
- Hidden inputs use `visuallyHiddenStyle`: `position: absolute`, `margin: -1px`, `clip`, 1 × 1 px
  (`@zag-js/dom-query` `visually-hidden.mjs`).

P9 put a horizontal `z-radio-group` in a 72 px sticky header, scrolled to 3000 px and measured the scroll change. P10 did
the same with plain light-DOM radios, without Zag.

| Setup (P9 / P10) | Chromium | Firefox | macOS WebKit | Linux WebKit |
|---|---|---|---|---|
| Sticky, `scroll-padding-top: 128px`: real click on item C / hidden input `.focus()` / `api.focus()` | −424 | −360 | −424 | −424 |
| Sticky, no `scroll-padding` (same three) | −360 | −360 | −360 | −360 |
| Sticky, items `position: relative` (the maintainer's fix) | −360 | −360 | −360 | −360 |
| Group in normal flow, in view | 0 | 0 | 0 | 0 |
| Any of the above with `.focus({ preventScroll: true })` | 0 | 0 | 0 | 0 |
| P10: light-DOM radio with `visuallyHiddenStyle` in a sticky header, `.focus()` | −360 | −360 | −360 | −360 |
| P10: same with `position: fixed; top: 0; left: 0` | 0 | 0 | 0 | 0 |
| P10: visible radio, or a button, in the same header | 0 | 0 | 0 | 0 |

- The jump follows from the hidden-input style inside a stuck sticky ancestor. Shadow DOM is not a factor, and
  `scroll-padding` only makes it larger.
- A real click jumps exactly as `.focus()` does, because the label focuses its input natively. `preventScroll` on Zag's
  calls would fix `api.focus()` but not the click.

### 2.8 Q8 — Number Input and its formatted string

- The input's value is the formatted string: `defaultValue: computed("formattedValue")`
  (`number-input.connect.mjs:116`), and `name` and `form` sit on that input (`:112-113`). `onValueChange` reports both
  `value` (the formatted string) and `valueAsNumber` (`number-input.machine.mjs:36-50`).
- P14, all four builds, `formatOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2 }`:

| Case | Input shows | Submitted |
|---|---|---|
| Light DOM, `de-DE`, default `"1234.5"` | `12.345,00` | `amount=12.345,00` |
| Same after typing `42` and Tab | `42,00` | `amount=42,00` |
| Shadow DOM, `de-DE`, host `setFormValue(String(valueAsNumber))` after typing `42` | `42,00` | `amount2=42` |
| Same after one increment click | `43,00` | `amount2=43` |
| `de-DE`, default `"1234,5"` / `en-US`, default `"1234.5"` | `1.234,50` / `1,234.50` | — |

- **The default is parsed in the locale.** Zag parses `defaultValue` and `value` with the locale's parser, so `"1234.5"`
  under `de-DE` reads as 12 345 (`.` is the group separator there). A host that takes a machine-readable number from an
  attribute (C1) has to format it for the locale before it hands it to the machine, or the value changes by orders of
  magnitude [the conversion is INFERENCE; the misparse is observed].
- **Adapter pitfall.** `normalizeProps` maps `defaultValue` to `value` (`@zag-js/vanilla` `normalize-props.mjs`), and
  `spreadProps` assigns `value` as a property whenever it changes (`spread-props.mjs`). Re-applying it on every render
  reformats the input on each keystroke: typing `42` into an `en-US` field gave `4.00` (P14, `n6`). The probe applied the
  value once and then passed the input's own value back. A key that disappears from a later spread is reset to `""`
  (`spread-props.mjs`, the old-attribute loop), which emptied the input in an earlier probe run.

### 2.9 Q9 — Toggle Group, and item composition

- Toggle Group has no native input (`toggle-group.anatomy.mjs`), no `name` and no `form` prop. Its value is `string[]` in
  both modes. The root is `role=radiogroup` when single and `group` when multiple, and the items carry `aria-checked` or
  `aria-pressed` (`toggle-group.connect.mjs:29-140`).
- `setFormValue(FormData)` with repeated entries submitted `tags=bold`, `tags=underline` (P11), and `tags=a`, `tags=b`,
  `r[]=1`, `r[]=2` (P4), in all four builds. **The entries are submitted even when the host has no `name` attribute** (P4,
  second element; P11, `#tg`). A list of entries is appended as is, and the `name` check applies only to a plain value
  (HTML "entry construction"). The same mechanism serves a two-thumb slider (`name[]`) and a date range (`name[i]`).

**Composition.** Zag finds items through its scope. Toggle Group queries `[data-ownedby~=<rootId>]` under the root element
(`toggle-group.dom.mjs:7-10`), Radio Group queries radios under the root (`radio-group.dom.mjs:13-18`), and Select looks
up each item by id (`select.dom.mjs`). P3 and P11, all four builds:

| Shape | Arrow keys | Value |
|---|---|---|
| Toggle Group, items rendered in the group's shadow root | ArrowRight moves bold → italic | ok |
| Toggle Group, items slotted from light DOM, scope = shadow root | Focus stays on bold | Click still sets the value (handlers are bound) |
| Toggle Group, items slotted, scope = the host's own tree (`getRootNode: () => host.getRootNode()`, root props on the host) | ArrowRight moves bold → italic; the host gets `role=radiogroup` | ok |
| Native radios with one `name` in one shadow root | ArrowDown moves and checks 1 → 2 | — |
| Native radios with one `name`, one per shadow root (`<p-radio>` ×3) | ArrowDown does nothing; clicking a second one leaves both checked | Each is its own group (HTML "radio button group" requires the same tree) |

- So an item element with its own shadow root cannot hold Radio Group's hidden radio, and slotted items need the scope
  to move to the host's tree. In that last shape the machine writes `role`, `tabindex`, `aria-*` and `data-*` onto the
  consumer's light-DOM children, and the ids must be unique in the document.
- ARCHITECTURE §12 already plans `line-select-item` and `line-select-group` as elements of the `./select` family
  (`docs/ARCHITECTURE.md:579`). The same scope limit applies to them [INFERENCE: Select was probed only with items in its
  own shadow root].

### 2.10 Q10 — Static fallback and the form value

- The controller catches errors only while it constructs, subscribes and starts the machine
  (`line-machine-controller.ts:92-107`).
- **Start failure** (P5 `c6`, `initialState` throws): `fallback` is `true`, one `console.error` is logged, no page error
  occurs, and the template's fallback (a native checkbox inside the shadow root) renders. The form keeps the value the
  host set at connect (`c6=on`). Clicking the fallback checkbox does not change `FormData`, because that inner checkbox
  has no form owner (§2.3).
- **Run-time failure** (P6, the `setChecked` action throws): the click raises an uncaught page error,
  `probe: action failed at runtime`, in all four builds. `fallback` stays `false`. The hidden input is checked (native
  toggle), but the host state is unchecked and `FormData` is empty. The action runs in `send`'s microtask
  (`dist/machine.mjs:51-73`), outside the controller's `try`.
- So in fallback the form holds whatever the host sets from its own properties. Only the host can keep the form value
  alive, and only if its fallback template wires its own controls to `setFormValue`.

### 2.11 Q11 — RTL

- Every Phase 2 machine takes a `dir` prop and reads it live (`*.props.mjs`). The keyboard maps go through `getEventKey`,
  which swaps ArrowLeft and ArrowRight for `dir: "rtl"` on horizontal widgets (`@zag-js/dom-query` `event.mjs:72-78`).
  Slider and number-input also derive `isRtl` (`slider.machine.mjs:80`; `number-input.machine.mjs:66`).
- `LineElement` carries `DirectionMixin`, which resolves `direction` from `:dir(rtl)` and re-renders on change
  (`packages/line-core/src/line-element.ts:27`; `mixins/direction.ts:51`, `:79`). A props function can pass
  `dir: this.direction`. The probe hosts read `:dir(rtl)` the same way.
- P11 and P12, all four builds:

| Check | LTR | RTL (`<div dir="rtl">`) |
|---|---|---|
| Slider, click at 75 % of the control's width from the left | 75 | 25 |
| Slider, ArrowRight from 50 | 51 | 49 |
| Toggle Group, ArrowRight from bold (LTR) / ArrowLeft from bold (RTL) | italic | italic |

- The mixin "does not see `dir` changes inside shadow trees" (`mixins/direction.ts`, module comment). A component that
  renders its own `dir` inside the shadow root needs another source [INFERENCE: not probed in R1].
- Custom machines (Input, SearchInput, Textarea, Field) wrap native text controls, whose caret and text direction follow
  the inherited directionality. A shadow tree's elements inherit it from the host (HTML "the directionality"). No custom
  Phase 2 machine exists yet, so R1 has nothing to probe there [INFERENCE].

### 2.12 Q12 — Touch and pointer

- The pre-built machines use Pointer Events, so one code path serves mouse, pen and touch. Slider tracks the drag on the
  document (`trackPointerMove(scope.getDoc(), …)`, `slider.machine.mjs:200-212`), which works for a thumb inside a shadow
  root (P12: drag to 10 % gives 10). Number Input focuses its stepper with `preventScroll` on touch
  (`number-input.connect.mjs:223`, `:261`).
- P13 and P15 used a Playwright context with `hasTouch: true` (and `isMobile: true` in Chromium). A tap at 30 % of the
  slider gave 30, and a tap on the increment stepper moved `5.00` to `6.00`, in all four builds. These are emulated
  touches on desktop engines; no device was tested.
- **Linux WebKit focuses on mouse-down.** In Linux WebKit a button takes focus on `mousedown`, and macOS WebKit does not
  (P3: the clicked radio is focused on Linux and not on macOS; P17: the Select trigger). When the probe's Select rewrote
  its trigger text on every render, the focus-driven re-render replaced the node under the pointer between `pointerdown`
  and `pointerup`. Linux WebKit then fired no `click`, and the Select did not open. The other three builds opened it
  (P17). With the text written only on change, Linux WebKit behaved like the others (P16).
- PRD §1.7 says "Zag.js handles this natively for pre-built machines; custom machines must follow the same pattern"
  (`docs/PRD.md:170`). The probes agree for the pre-built machines.

## 3. Probes

### 3.1 Method and setup

- **Sources.** `npm pack @zag-js/<pkg>@1.49.0` for `core`, `vanilla`, `dom-query`, `utils`, `types`, `anatomy`, the ten
  machines of §1, `toggle`, `focus-visible`, `interact-outside`, `dismissable`, `popper`, `collection`, `auto-resize`,
  `live-region` and `date-utils`, extracted under `/tmp/z16-probes/pkgs` (exit 0, `HOME=/tmp/emptyhome`, Node 22.23.5).
  Every `file:line` into a Zag package refers to that package's `dist/` at 1.49.0.
- **Issues.** zag#3088 and zag#3239, with their comments, through the GitHub REST API (retrieved 2026-11-26).
- **Worktree install.** `HOME=/tmp/emptyhome bun install --frozen-lockfile` with Bun 1.4.5: 728 packages, exit 0.
- **Probe app** (`/tmp/z16-probes/app`, outside the repo, deleted after the run). `bun add` with Bun 1.4.5 installed
  `lit@3.3.3`, `@zag-js/{vanilla,core,checkbox,switch,radio-group,toggle-group,slider,number-input,select,date-input,password-input,editable}@1.49.0`
  and `@internationalized/date@3.12.4`.
  - `controller.ts`: a verbatim copy of `packages/line-core/src/machine/line-machine-controller.ts` at `f666ed7`
    (sha256 `b2834c70…5e69b`).
  - `probe.ts` defines throwaway Lit hosts, `z-checkbox`, `z-switch`, `z-radio-group`, `z-toggle-group` (plus `-slotted`
    and `-light` shapes), `z-slider`, `z-number`, `z-select` and `z-date`. Each is form-associated through
    `attachInternals()` and binds the Zag prop getters with `normalizeProps` and `spreadProps` in `updated()`. Each passes
    `id` and `getRootNode: () => this.shadowRoot` unless it has the `no-root` attribute, and starts through the copied
    controller unless it has `deferred`. The `deferred` hosts use a probe-only controller that starts in the first
    `hostUpdated`.
  - The form-associated hosts call `setFormValue` from the machine callback, `formResetCallback` calls the machine setter
    with the default, and `formDisabledCallback` feeds the `disabled` prop. The `no-host-callbacks`, `init-form-value`,
    `broken` and `throw-on-set` attributes switch those paths. Plain elements `p-native`, `p-fa`, `p-radio`, `p-radios`,
    `p-multi` and `p-focus` probe the platform without Zag.
  - The templates render every part with Zag's default id (for example `checkbox:cb:label`) and the slider thumb with
    `role="slider"`, so the `deferred` hosts find them at start (§2.2).
  - `bun build probe.ts --format esm --target browser` → `dist/bundle.js` (sha256 `06e50315…f2a2a`; `probe.ts` `00852d55…`).
  - `run.mjs` serves `dist/` on `127.0.0.1:5160`, opens one page per probe and engine in sequence (one worker), and
    prints JSON. The final full run used `run.mjs` sha256 `1f543473…`. A later edit added the `position: fixed` row to P10
    and re-ran P10 alone (`2442d76f…`).
- **macOS.** `PW=<worktree>/node_modules/playwright/index.mjs node run.mjs` with Node 22.23.5 and the host's Playwright
  browsers (`chromium-1255`, `firefox-1572`, `webkit-2388`): exit 0, about 26 s.
- **Linux WebKit.** `docker run --rm --cpus 2 --memory 1g --ipc=host -v <worktree>:/work:ro -v /tmp/z16-probes:/probes
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright -e PW=/work/node_modules/playwright/index.mjs -e ENGINES=webkit
  mcr.microsoft.com/playwright:v1.65.1-noble node run.mjs`. The image (`1507cbfc550a`) is Ubuntu 24.04.5 on aarch64 with
  WebKit build 2388. It ran the repo's Playwright 1.65.1 JavaScript from the read-only worktree mount with the container's
  Node v26.13.1. Exit 0, about 38 s. CI runs x86_64 Linux, and none of these probes ran there.
- **Debug runs.** Three single-engine scripts traced the slider thumb, number-input typing and the Linux WebKit Select
  click. Their findings are folded into §2.2, §2.8 and §2.12.

### 3.2 Results by engine

"Same" means the value equals the Chromium column. Every row was identical across the four builds except where a column
says otherwise.

| # | Probe | Chromium 159.0.8154.6 | Firefox 159.0 | macOS WebKit 27.2 (2388) | Linux WebKit 27.2 (2388, aarch64) |
|---|---|---|---|---|---|
| P1 | Inner inputs in a light-DOM form (§2.3 table) | `form` `null`; `form=` attr `null`; `closest` `null`/`null`; `FormData` keys `[fa]`; `checkValidity` `true`; inner not disabled by fieldset; host `:disabled`, `formDisabledCallback(true)`; inner not reset; `formResetCallback` ×1 | same | same | same |
| P2 | Events from inner native controls (§2.5) | click/Space: `click`, `input` composed reach host and `document`; typing: `input`; blur: nothing; synthetic `click`: not toggled, not seen; synthetic `input`: not seen; synthetic composed `change`: seen | same | same | same |
| P3 | Radio grouping | One shadow root: ArrowDown checks 2. One per shadow root: ArrowDown keeps 1; clicking y leaves x and y checked; focus on the clicked host | same | same, but a click does not focus (`focusedHost` empty) | same as Chromium (click focuses) |
| P4 | `setFormValue(FormData)` | `tags=a`, `tags=b`, `r[]=1`, `r[]=2` for the named and the unnamed host | same | same | same |
| P5 | Checkbox through the controller (§2.2–§2.4) | Initial `FormData` `c2`, `c5`, `c6` only; `data-active` while pressed: connect-start `false`, no-root `false`, deferred `true`; reset: `c1` back to checked, `c5` stays; fieldset: `c1` input disabled, `c5` input enabled and toggles; fallback `true`, `c6=on` unchanged after a fallback click; host role `checkbox "Accept"` | same | same | same |
| P6 | Run-time action error | Uncaught `probe: action failed at runtime`; `fallback` `false`; hidden input checked, host unchecked; `FormData` empty | same | same | same |
| P7 | Switch role | `checkbox "Wi-Fi"`; input `type=checkbox` | same | same | same |
| P8 | Radio Group in one shadow root | Click B → `b`, `rg=b`, focus on B; ArrowDown → `c`, `rg=c`; callbacks `b`, `c` | same | same | same |
| P9 | zag#3239 (§2.7) | −424 / −360 / −360 / 0; `preventScroll` 0 | −360 / −360 / −360 / 0 | same as Chromium | same as Chromium |
| P10 | Light-DOM sticky focus | hidden −360; hidden + `position: fixed` 0; visible radio 0; button 0 | same | same | same |
| P11 | Toggle Group (§2.9, §2.11) | LTR ArrowRight → italic; RTL ArrowLeft → italic; multiple `tags=bold`, `tags=underline`; slotted + shadow scope: no move; slotted + host-tree scope: moves, host `role=radiogroup` | same | same | same |
| P12 | Slider (§2.2, §2.11) | Thumb `hidden` (controller, no-root), `visible` (deferred); click 75 % → 75 (RTL 25, no-root 50); ArrowRight 75 → 75 (controller), 50 → 51 (deferred), RTL 50 → 49; drag to 10 % → 10; no `input`/`change` at host; hidden input `form` `null` | same | same | same |
| P13 | Slider touch tap at 30 % | 30 | same | same | same |
| P14 | Number Input (§2.8) | Defaults `12.345,00`, `12.345,00`, `1.234,50`, `1,234.50`; light DOM submits `12.345,00`, then `42,00`; shadow host submits `42`, then `43`; re-spread value: `4.00` | same | same | same |
| P15 | Number Input touch tap on increment | `5.00` → `6.00` | same | same | same |
| P16 | Select (§2.5, §2.6) | Opens on click; pick → `banana`, `fruit=banana`, composed `change` at host and `document`; stays open after focus in the shadow root, focus in light DOM and Tab; closes on outside pointer-down; trigger `combobox "Fruit"` | same | same | same |
| P17 | Select trigger text rewritten on every render | Opens; focus moves to the content | same | same | **Does not open**; focus stays on the trigger |
| P18 | Date Input typing | `12/25/2026` in segments, hidden input and `FormData`; no error | same | same | same |

Linux WebKit differed from macOS WebKit in P3 (a click focuses the radio) and P17 (no click after a mouse-down
re-render). It matched macOS WebKit in every other probe, P9's pixel values included.

## 4. Fit with line://ui

- **Law 7 (`docs/MANIFESTO.md:51`) and plan §2.3.** Native form semantics reach a Phase 2 control only through the host's
  `ElementInternals`. Zag's own form wiring is inert in the shadow root (§2.3, §2.4), so the shared layer of stream F
  (plan §4.1) owns value, default value, reset and disabled for every pre-built machine, as O1 (a) planned.
- **Law 5 (`:47`).** Lit owns the DOM, but the machines write to it directly: `setElementChecked`, `setElementValue`
  (in a frame for number-input), `.focus()`, and the input-sync actions (`form.mjs:13-30`;
  `number-input.machine.mjs:458-468`). The light-DOM item shape of §2.9 would also write attributes onto the consumer's
  children.
- **Law 4 (`:45`) and ARCHITECTURE §12.** Slotted item elements, the natural Law 4 shape, are what Zag's scope cannot see
  (§2.9).
- **Law 9 (`:55`) and PRD §1.7 (`docs/PRD.md:171`).** The controller meets them for start failures only (§2.10).
- **C3 and C9 (`docs/ARCHITECTURE.md:1578`, `:1584`).** The machine callbacks give one commit per result and a live stream
  where C3 needs one (§2.5). Select's composed `change` and the composed trusted `input` from inner controls are the two
  unprefixed events that reach consumers.
- **Plan §5.3.** Every behaviour claim above ran in three engines, with Linux WebKit separately, in a real browser. None
  of it used happy-dom.

## 5. Recommendations

Each is an input for the post-research revision (plan §10 step 4) and the Phase 2 spec. None is a decision.

1. **Scope.** Every Phase 2 component puts `id` and `getRootNode: () => this.renderRoot` in its props function
   (recommended). A constant `id` per component is enough while the scope is the shadow root (§2.2). The alternative,
   a per-instance unique id, is needed only by the host-tree shape of §2.9.
2. **Start order.** Start the machine after the first render, from a template that already renders every part with
   its id and role (recommended; P5, P12). Alternatives:
   - an opt-in controller option, so Phase 1 components keep `hostConnected`;
   - keep `hostConnected` and patch each machine, for example the slider with a fixed `thumbSize` or
     `thumbAlignment: "center"` (`slider.machine.mjs:27`, `:46`, `:214`) [INFERENCE: not probed], and accept the dead
     press tracking.

   Either changes Phase 1 spec SD29 or ARCHITECTURE §6 (§6).
3. **Form value.** The shared layer sets the form value from the default at connect and then from the machine's commit
   callback. A number submits as `String(valueAsNumber)`, and a multi-value control as `FormData` entries, with `null`
   when the host has no `name`, because entries skip the name check (recommended; §2.4, §2.8, §2.9). Inner inputs may
   keep the `name` the machine needs (radio grouping) because the shadow root keeps them out of the form.
4. **Reset and disabled.** `formResetCallback` calls the machine setter with the host's default, and
   `formDisabledCallback` folds into the `disabled` prop, not into `CONTEXT.SET fieldsetDisabled` (recommended; §2.4).
5. **Events.** Map the callbacks of the §2.5 table to `line-change` and `line-input`. Stop Select's internal `change` at
   the shadow root before it reaches the host [INFERENCE: a `stopPropagation` listener on the shadow root, not probed]
   (recommended). The fate of trusted composed `input` events is open (§7 Q3).
6. **zag#3088.** A host-side listener closes the Select when focus leaves the host, as plan §8 states (recommended;
   R4 settles it). The alternative is a patch of `@zag-js/interact-outside` along the lines of the issue.
7. **zag#3239.** Give the radio's hidden input a position that does not scroll on focus, such as `position: fixed` with
   zero insets (0 px in P10 in all four builds), and pass `preventScroll` in the component's own focus calls
   (recommended). `preventScroll` alone leaves the click path.
8. **Number Input.** The spec states the attribute format of `value` and `default-value` (C1) and converts it to the
   locale string for the machine. The formatted string is never submitted. The binding applies the input's initial value
   once (recommended; §2.8).
9. **Composition.** Item-based components render their items, and the radios, inside the group's own shadow root, from
   data or slotted text. Alternatively the scope moves to the host's tree and the machine writes onto light-DOM children
   (§2.9). Open in §7 Q2; R1 recommends no option, because the choice changes the anatomy of three components and their
   Law 4 reading.
10. **Fallback.** The fallback template of a form control wires its own controls to `setFormValue`, so the form still
    works when the machine does not (recommended; §2.10).

## 6. Contradictions and gaps

PROCESS §2: research that contradicts the plan returns to the plan and the PRD before any spec work. R1 flags these and
resolves none.

| # | Statement | Location | Evidence |
|---|---|---|---|
| X1 | "Machine starts in `hostConnected`" and "The controller MUST keep starting machines in `hostConnected`" (SD29) | `docs/ARCHITECTURE.md:371`; `docs/specs/01-spec-core-primitives.md:958`, `:2412` | Phase 2 machines run DOM-querying effects at start; the slider thumb stays hidden and unfocusable, and checkbox press tracking never binds (§2.2, P5, P12) |
| X2 | Checkbox, Radio, Switch, Select, Slider, Toggle Group "do NOT need a native element … use `ElementInternals` … and fully custom rendering" | `docs/ARCHITECTURE.md:1337-1339` | The pre-built checkbox, switch and radio-group make their hidden native input the focus, keyboard and accessible node (P5, P7, P8). Slider, select and date-input keep a hidden input for the form only |
| X3 | "No component dispatches an unprefixed `input` or `change` event" (C3) | `docs/ARCHITECTURE.md:1578` | `@zag-js/select` dispatches a composed `change` that reaches the host and `document` on every value change (P16). Trusted `input` from inner native controls is composed and reaches the host as well (P2, P5) |
| X4 | "Components never throw uncaught errors at the consumer" (Law 9); "if a Zag.js machine fails to initialise … static fallback" | `docs/MANIFESTO.md:55`; `docs/PRD.md:171` | The controller guards start only. A run-time action error is an uncaught page error and splits the form value from the visible state (P6). The PRD wording covers initialisation only; the MANIFESTO wording covers every error |
| X5 | "State machines own logic. Lit owns DOM … no DOM mutation outside Lit's reactive cycle" (Law 5) | `docs/MANIFESTO.md:47` | Zag actions write `checked`, `value` and focus directly (§4) |
| X6 | Plan §1: most machines "track reset and disabled through `closest('form')` and `closest('fieldset')`" | `docs/plans/02-plan-essential-forms.md:39-40` | Holds, with a refinement: checkbox, switch, number-input and select use `input.form`; date-input, editable, toggle-group and password-input track neither (password-input watches `input.form` reset and submit for visibility) (§2.3). Not a contradiction |
| X7 | Plan §5.2: Zag 1.49.0 "against the locked 1.47.0" | `docs/plans/02-plan-essential-forms.md:276` | The lock is 1.49.0 since row 01-Z14 (`bun.lock:999`). The four named fixes are confirmed (§2.1). ARCHITECTURE `:416` still says 1.47.0; plan §5.7 already lists that gap (`:442`) |
| X8 | Plan §2.1: "`@zag-js/field` is 2.0.0-next only" | `docs/plans/02-plan-essential-forms.md:79-80` | True. Their npm `latest` tag now points at 2.0.0-next.4 (§2.1). Not a contradiction |

No finding contradicts PRD §1.7 RTL or touch (`docs/PRD.md:168`, `:170`): the probes agree with both for the pre-built
machines.

## 7. Open questions for the post-research revision and the Phase 2 spec

1. **Start order (X1).** Does the controller start machines after the first render, through an option or by default, or
   do Phase 2 components work around start-time effects per machine (§5 item 2)? The first changes SD29 and ARCHITECTURE
   §6 and needs a decision.
2. **Item composition.** For Radio Group, Toggle Group and the `./select` family: items in the group's shadow root, or
   slotted item elements with the machine scope on the host's tree and the machine writing onto consumer children
   (§2.9)? Does Law 4 allow the first for "option" content? Does Law 5 allow the second?
3. **C3 scope (X3).** Does "dispatches" cover user-agent events that cross the shadow boundary? Does the layer stop
   composed `input` from inner controls, or Select's `change`, at the shadow root? htmx `hx-trigger` and Field listen on
   the host.
4. **Law 9 at run time (X4).** Does the controller wrap event handling and `updateProps` and flip to fallback on a run-time
   error? If so, what does the form hold afterwards?
5. **Native nodes (X2).** Do Checkbox, Switch and Radio Group keep Zag's hidden native input as their accessible control,
   or move the role to the host? This decides what the Field labelling mechanism (R3) has to reach.
6. **Switch role.** Zag 1.49.0 exposes the switch as a checkbox. Does the component add `role="switch"` to the hidden
   input?
7. **Number Input value format.** Is the attribute value machine-readable and converted for the locale (§2.8)? Which
   event carries `valueAsNumber`?
8. **Multi-value submission.** Repeated `FormData` entries, or one joined string, for Toggle Group (multiple), a two-thumb
   slider and a date range? And `null` without a `name` (§2.9)?
9. **zag#3239.** Does the spec fix the hidden input's position and the focus calls (§5 item 7), and does R1 file the probe
   upstream?
10. **PasswordInput visibility.** Does the host hide the password on its form owner's `reset` and `submit`, which Zag
    does only through `input.form` (§2.3)?
11. **Shared-layer API (plan §5.5, `:405-407`).** Initial form value at connect, reset to default, disabled folded into
    props, fallback wiring: one contract for every pre-built machine (§5 items 3, 4, 10)?
12. **Tier inputs.** Date Input runs in a shadow root in all four builds (P18). PasswordInput's machine holds no value
    (§2.3). Both feed the tier decision of plan §5.5 (`:404`) with R5.

**Not verified.** CI x86_64 Linux; real touch devices (only Playwright emulation ran); `@zag-js/focus-visible` with a
shadow-root `root`; editable and password-input in a browser (source reading only); Select with slotted items or
`multiple`; a two-thumb slider; Date Input in locales other than `en-US`; number-input scrubbing and RTL hints; restore
(R2); the `stopPropagation` and host-side focus-out fixes of §5 items 5 and 6.

## 8. Sources

All retrieved 2026-11-26.

- npm registry metadata: https://registry.npmjs.org/@zag-js/core, …/@zag-js/checkbox, …/@zag-js/field, …/@zag-js/fieldset
  (and the other packages of §2.1)
- Zag 1.49.0 tarballs: `npm pack @zag-js/<pkg>@1.49.0` (§3.1)
- Zag changelogs on `main`: https://github.com/chakra-ui/zag/blob/main/packages/machines/checkbox/CHANGELOG.md,
  …/number-input/CHANGELOG.md, …/slider/CHANGELOG.md, …/date-input/CHANGELOG.md, …/select/CHANGELOG.md,
  …/radio-group/CHANGELOG.md, https://github.com/chakra-ui/zag/blob/main/packages/utilities/dom-query/CHANGELOG.md,
  …/interact-outside/CHANGELOG.md, …/dismissable/CHANGELOG.md
- Zag radio-group source on `main`: https://github.com/chakra-ui/zag/blob/main/packages/machines/radio-group/src/radio-group.connect.ts
- zag#3088, "onFocusOutside is not detected properly in a shadow root": https://github.com/chakra-ui/zag/issues/3088
- zag#3239, "SegmentGroup/RadioGroup: clicking an item scrolls the page …": https://github.com/chakra-ui/zag/issues/3239
- HTML Standard, reset the form owner: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#reset-the-form-owner
- HTML Standard, disabled form controls (fieldset descendants): https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#concept-fe-disabled
- HTML Standard, radio button group: https://html.spec.whatwg.org/multipage/input.html#radio-button-group
- HTML Standard, form-associated custom element entry construction: https://html.spec.whatwg.org/multipage/custom-elements.html#face-entry-construction
- HTML Standard, the directionality: https://html.spec.whatwg.org/multipage/dom.html#the-directionality
- DOM Standard, dispatching events (path cleared after dispatch): https://dom.spec.whatwg.org/#concept-event-dispatch
- UI Events, `input` event (composed): https://w3c.github.io/uievents/#event-type-input
- Playwright `mcr.microsoft.com/playwright:v1.65.1-noble`: https://playwright.dev/docs/docker
