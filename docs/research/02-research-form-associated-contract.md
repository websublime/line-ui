# Research: The form-associated platform contract (R2)

**Row:** `01-Z17` (Phase 2 plan §5.1 R2, §5.2, §5.3; decision O1 (a))
**Date:** 2026-11-26 (every probe ran the same day on the row 01-Z14 baseline, §3)
**Repo sources (at `origin/main` `9c9b1f4`):** `docs/plans/02-plan-essential-forms.md` §1, §2.3, §4.1, §5.1 R1–R3, §5.2, §5.3, §5.5, §5.7, §7.1, §8; `docs/PRD.md` (v0.8.36) §4.2 (`:276`), §7.4 (`:978`); `docs/ARCHITECTURE.md` (v0.8.28) §7 (`:386-402`), §9 (`:474-498`), §14 state mapping (`:1216-1244`), §15.1 (`:1329-1330`), §15.3 (`:1375-1405`), §16.2 (`:1478-1492`); `docs/MANIFESTO.md` Law 7 (`:51`); `docs/specs/0002-button.md` Open Question 6; `packages/line-core/src/form-associated.ts`; `packages/line-core/src/styles/reset.input.css`; `packages/line-components/src/button/button.ts`; `docs/research/01-research-zag-machines.md` and the R10 note (`origin/docs/01-z15-r10-theming-showcase`) for format. Corrected 2026-11-27 (row 01-Z29): the `docs/PRD.md` locators here resolve at PRD v0.8.36 (`9c9b1f4`); PRD v0.8.37 and v0.8.38 each add one revision-note line, so at v0.8.38 every cited line after the revision notes sits two lines further down.
**Status:** Evidence. Research carries no rules (`docs/PROCESS.md` §1). Recommendations are marked "(recommended)"; every decision is an open question in §6. Section 5 lists what contradicts the plan, the PRD or ARCHITECTURE; it is flagged, not resolved.

> **TL;DR**
>
> - **Validity is the component's job, end to end.** `required`, `pattern`, `minlength`, `min`, `max` and `step` on a form-associated custom element (FACE) host change nothing: the host stays valid and the form submits, in all three engines. `setValidity(flags, message, anchor)` then gives native behaviour everywhere: `:invalid` on the host, its form and its fieldset, `checkValidity()`, `reportValidity()`, a cancelable `invalid` event, blocked submission, and focus on the anchor. The anchor must be a shadow-including descendant of the host (`NotFoundError` otherwise), so it cannot be set before the inner control renders. An inner native `<input>` computes `valueMissing`, `patternMismatch` (with the `v` flag), range and step flags for any value, but `tooShort`/`tooLong` only after a user edit, so mirroring an inner input misses `minlength` and `maxlength` on every value that script sets.
> - **`:user-invalid` is not "never".** Chromium and WebKit never match `:user-invalid` or `:user-valid` on a FACE. Firefox 159 matches them exactly like `:invalid`/`:valid`, from page load and before any interaction (Gecko sets both states together; Bugzilla 1910571, UNCONFIRMED). The spec defines the selectors only for `input`, `textarea` and `select` (whatwg/html#9639 is open). An error-after-interaction state therefore has to be the component's own `:state()`. `:state()` works in all three engines on the baseline, from inside the shadow root (`:host(:state(x))`) and from the page.
> - **Reset and restore are callbacks only.** `form.reset()` runs `formResetCallback` before it returns; a reset button runs it after a microtask. The platform resets nothing inside the shadow root: the inner input keeps its typed text, and the host's submission value stays until the component sets it. Restore runs `formStateRestoreCallback(state, "restore")` on a back-navigation in all three engines, after upgrade too (module scripts, a definition 300 ms after `load`). No engine ever passes `"autocomplete"`. Beyond that the engines differ, as the restore bullets below show.
> - **Restore differs per engine.** WebKit restores a string or a `FormData` of strings, so "WebKit restores only a string" is out of date; no engine restores a script-made `File` except Firefox. Chromium and Firefox also restore the submission value by themselves, and WebKit does not. Only Firefox restores on a reload. Firefox restores nothing on a `Cache-Control: no-store` page. Nobody restores a FACE that sits inside another element's shadow root. `autocomplete="off"` on the form turns restore off everywhere.
> - **Firefox misroutes state.** The third-party report (rak200/ui#380, Firefox 155) reproduces on Firefox 159. Firefox keys a FACE's saved state by its index in the form when its definition runs, and the key leaves out the control's `name`. Two FACEs whose definitions run against tree order therefore share a key, and the later one receives the other's state. With module scripts, the definitions run in import order, which hits this case.
> - **Implicit submission never crosses the shadow boundary.** Enter in an inner `<input>` submits nothing in any engine, even with a submit button in the form; the `keydown` reaches the host. The native rules also ignore FACEs: a FACE never counts as a field that blocks implicit submission, so a form with one native text input and one FACE still submits on Enter. Emulation through `form.requestSubmit()` drops the submitter. Clicking the default button keeps the submitter, its `name=value` and the disabled rule, which is what the spec's implicit submission does.
> - **Autofill reaches the inner input, in Chromium at least.** Through CDP `Autofill.trigger`, Chromium 159 filled two inner shadow inputs of a light-DOM `<form>`, took the host's `id` and `name` for an inner input that had neither, matched `:autofill`, and fired the `reset.input.css` animation trick inside the shadow root. `input` reached the host; `change` did not. Firefox, WebKit and the password managers have no automation hook: their support comes from source and issue evidence only (Firefox's login manager walks up through shadow hosts; Safari's shadow-DOM AutoFill is a Safari change, absent from Playwright WebKit).
> - **Linux and macOS WebKit agree.** Linux WebKit (Playwright container, aarch64) matched macOS WebKit on every one of the 193 recorded values and on the definition-order variants. The CI runner is x86_64 and has not run these probes.
> - **Plan §5.2 checks out.** `ElementInternals` ships in Chrome 77, Firefox 93 and Safari 16.4, and `:state()` in Chrome 125, Firefox 126 and Safari 17.4 (`@mdn/browser-compat-data` 8.1.11). Every baseline engine reports `states` and `CSS.supports('selector(:state(x))')`.

---

## 1. Question

Plan §5.1 R2: "Constraint validation computed by the component (`required`, `pattern`, `minlength`, `min`/`max`, `step`) with an anchor; `:user-invalid`, which never matches a form-associated custom element, and an error-after-interaction state; reset; restore (WebKit restores only a string and never for autocomplete; a third-party report of Firefox handing one element's state to another); implicit submission from an inner `<input>`; autofill and password managers through an inner native input; three engines, Linux WebKit included" (`docs/plans/02-plan-essential-forms.md:264`). Plan §5.2 adds the support facts to re-check (`:284-285`). O1 (a) puts the answer into one shared form layer in `line-core` (`:302-310`, `:208-213`). Plan §2.3 lists what every form-associated component proves (`:106-116`).

- **Q1** What does constraint validation need from the component, and how does the anchor behave?
- **Q2** Where does `:user-invalid` match, and what can carry an error-after-interaction state?
- **Q3** What does a form reset do to a FACE and to its shadow content?
- **Q4** How does state restore behave per engine, including the WebKit and Firefox reports?
- **Q5** What happens on Enter in an inner `<input>`, and what would emulating implicit submission take?
- **Q6** Do autofill and password managers reach an inner native input?
- **Q7** Do the plan §5.2 `ElementInternals` and `:state()` facts hold?

## 2. Findings

### 2.1 Q1: constraint validation and the anchor

**The host's constraint attributes do nothing.** `<x-plain required pattern="[a-z]+" minlength="3" min="1" max="5" step="2">` with no value stays `validity.valid`, `willValidate` is true, `form.checkValidity()` returns true, and `:invalid` does not match, in all four engine runs (probe 3.1). This confirms plan §1 (`:29-35`) and the §5.7 gap against ARCHITECTURE §7 (`docs/ARCHITECTURE.md:393`). The spec gives a FACE validity only through `setValidity` (HTML, [`setValidity()`](https://html.spec.whatwg.org/multipage/custom-elements.html#dom-elementinternals-setvalidity)).

**`setValidity` gives native behaviour.** It works the same in all four runs (probe 3.1):

- With `valueMissing` set and an inner input as anchor, the host, its `<form>` and its `<fieldset>` match `:invalid`, and `form.checkValidity()` returns false.
- `form.requestSubmit()` fires `invalid` at the host once, fires no `submit`, and focuses the anchor. `form.reportValidity()` and `internals.reportValidity()` behave the same.
- The `invalid` event is cancelable, does not bubble and is not composed. A capture listener on the form receives it (probe 3.7). `checkValidity()` fires it too.
- `badInput` is accepted and reflected. It is in the `ValidityStateFlags` IDL although the prose list of FACE flags omits it (HTML, [`ValidityStateFlags`](https://html.spec.whatwg.org/multipage/custom-elements.html#validitystateflags)).
- A FACE with a `readonly` attribute, or disabled by `disabled` or by a disabled `<fieldset>`, has `willValidate` false and never matches `:invalid`. That matches the spec ([`readonly` on a FACE](https://html.spec.whatwg.org/multipage/custom-elements.html#attr-face-readonly)). Removing `readonly` restores `willValidate`.

**The anchor rules.**

| Case | Result, all four runs | Spec |
|---|---|---|
| A true flag with no message | `TypeError` | step 3 of `setValidity` |
| Anchor in the light DOM, in another host's shadow root, or detached | `NotFoundError` | "if anchor is not a shadow-including inclusive descendant of element, then throw" |
| Anchor in the host's own shadow root | Accepted; `reportValidity()` and `requestSubmit()` focus it | [validation anchor](https://html.spec.whatwg.org/multipage/custom-elements.html#face-validation-anchor); [interactively validate](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#interactively-validate-the-constraints) says UAs "should use their validation anchor instead" |
| No anchor, host not focusable, no `delegatesFocus` | Invalid is reported but focus stays where it was | anchor defaults to the host |
| No anchor, host with `delegatesFocus: true` | Focus moves to the inner input | focusing steps delegate |
| Anchor removed from the shadow root after `setValidity` | `reportValidity()` returns false and focuses nothing (probe 3.7) | the anchor is not re-validated |

So a Lit component cannot pass its inner control as the anchor before the first render, and it must call `setValidity` again when a render replaces that element [INFERENCE: Lit renders after `connectedCallback`, asynchronously; not probed with Lit itself]. Button already sets its validity in `updated()`, with its `[part="root"]` button as the anchor and `undefined` when that button is absent (`packages/line-components/src/button/button.ts:335-345`).

**What an inner native input computes.**

| Constraint | Programmatic value | Typed value | Evidence |
|---|---|---|---|
| `required` (`valueMissing`) | computed | computed | probe 3.1 |
| `pattern` (`patternMismatch`) | computed, compiled with the `v` flag (`[[a-z]--[aeiou]]+` rejects `abc`) | computed | probes 3.1, 3.7; HTML [the `pattern` attribute](https://html.spec.whatwg.org/multipage/input.html#the-pattern-attribute) |
| `min`, `max`, `step` on `type=number` | computed (`0`: underflow and step mismatch; `4`: step mismatch; `11`: overflow; `3`: valid) | computed | probe 3.1 |
| `minlength` (`tooShort`) | **never** (`ab` with `minlength=3` stays valid) | computed after a user edit | probe 3.1; HTML ["its value was last changed by a user edit"](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#setting-minimum-input-length-requirements:-the-minlength-attribute) |
| `maxlength` (`tooLong`) | never | after a user edit | same spec rule [INFERENCE: not probed separately] |

Mirroring an inner input's `validity` into `setValidity` therefore misses `minlength` and `maxlength` for every value that does not come from typing. That covers a `value` attribute, a value set from script, a value set by an agent through A2UI, and a restored value. Machines whose value lives outside a native input have no inner validity to mirror (plan `:36-42`; R1). whatwg/html#10360 (open) asks the platform for native messages on FACEs, and names the same `minlength`/`maxlength` gap for the scratch-input workaround.

**Messages differ per engine.** WebKit's are shortest; probe 3.1 lists them. Reusing the inner input's `validationMessage` gives each engine's localized text; computing the flags in the component needs messages of its own. Localisation is out of scope (MANIFESTO Out of Scope; plan `:419-420`).

**Pseudo-classes on a FACE host.** These matched the same in all four runs on `<x-plain>`, which carries `required` and the other constraint attributes and is valid (probe 3.1):

| Matches | Never matches |
|---|---|
| `:valid` or `:invalid` (per `setValidity`), `:enabled`, `:disabled` (own `disabled` or a disabled fieldset), `:read-only` (always, with or without `readonly`) | `:required`, `:optional`, `:read-write`, `:placeholder-shown`, `:checked`, `:indeterminate`, `:default`, `:in-range`, `:out-of-range`, `:autofill` |

`:read-only` matching every FACE follows the spec: `:read-write` matches only editable elements that are not `input` or `textarea` ([`:read-only`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-read-only)). The ARCHITECTURE §14 state table names `:read-only`, `:required`, `:checked`, `:indeterminate` and `:placeholder-shown` as the natives that `:state()` replaces (`docs/ARCHITECTURE.md:1226-1232`). The probe confirms none of them carries meaning on a FACE.

### 2.2 Q2: `:user-invalid` and an error-after-interaction state

**The spec.** `:user-invalid` and `:user-valid` match "`input`, `textarea`, and `select` elements whose user validity is true" ([selectors](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-user-invalid); [user validity](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#user-validity)). A submission attempt sets user validity on submittable elements, and a reset clears it. whatwg/html#9639 ("Define `:user-invalid` / `:user-valid` for form-associated custom elements", open since 2023-08-26, labels `addition/proposal` and `needs implementer interest`) discusses an `ElementInternals` opt-in such as `userInteracted`. Nothing has shipped.

**The engines (probe 3.2).**

| Moment | Chromium | Firefox | WebKit (macOS and Linux) |
|---|---|---|---|
| Load, host invalid, untouched | host `:user-invalid` false | **true** | false |
| Typed and deleted, still focused | false | **true** | false |
| After Tab out | false | **true** | false |
| After a blocked submit, untouched | false | **true** | false |
| Valid host, untouched: `:user-valid` | false | **true** | false |

Gecko adds `USER_VALID` with `VALID` and `USER_INVALID` with `INVALID` in one step for every FACE that is a validation candidate (`dom/html/HTMLElement.cpp:347-358` at `9a2dc53`, the Firefox 159 base of Playwright 1.65.1). Bugzilla [1910571](https://bugzilla.mozilla.org/show_bug.cgi?id=1910571) (2024-07-30, UNCONFIRMED) reports it. The implementer answered that this was deliberate while the spec is silent ("Yeah fwiw that was my reasoning when implementing this", comment 4). In Firefox, a stylesheet that uses `line-input:user-invalid` would show the error from first paint. In Chromium and WebKit, it would never show it.

**Inside the shadow root**, the inner native input does get user validity. After typing and Tab, `input:user-invalid` matched in all four runs. A submission attempt does not reach it, because it has no form owner (probe 3.2), so the inner input cannot carry the submit half of the behaviour.

**What the component can observe.** In all four runs:

- `keydown` and `input` from the inner input reach a listener on the host, retargeted to the host. `blur` and `focusout` reach the host too, while `change` stays inside the shadow root.
- A blocked submission fires `invalid` at the host.
- `invalid` also fires on any script `checkValidity()` and `reportValidity()` (probe 3.7), so it cannot tell a submission attempt from a script check. whatwg/html#9878 (open) asks for a hook there.

**`:state()` carries the state (probe 3.2).** `internals.states.add('user-invalid')` matched `x-field:state(user-invalid)` from the page stylesheet and `:host(:state(user-invalid)) input` inside the shadow root, in all four runs. `delete` cleared it. The legacy dashed form behaves the same everywhere: `states.add('--legacy')` is accepted, and `CSS.supports('selector(:--x)')` is false. The plan already names an error-after-interaction `:state()` as the risk mitigation (`:514`). ARCHITECTURE §9 and §14 name `data-error`, `data-invalid` and `:state(error)`, `:state(invalid)` (`docs/ARCHITECTURE.md:480`, `:1230`, `:1238`), and R3 owns `data-error` vs `data-invalid` (plan `:265`).

### 2.3 Q3: reset

The probe (3.3) behaved the same in all four runs:

- `form.reset()` fires `reset`, then runs `formResetCallback` before `reset()` returns. It is a `[CEReactions]` method.
- A click on `<input type="reset">` runs the callback only after a microtask; `click()` is not `[CEReactions]`.
- A cancelled `reset` event runs no callback.
- The platform resets nothing else: the inner input kept `typed`, and `FormData` kept the host's `typed` submission value, while the light-DOM native input went back to its `value` attribute. The FACE reset algorithm is only "enqueue … `formResetCallback`" ([HTML, form-associated custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements), "The reset algorithm for form-associated custom elements").
- An inner `<input form="f">` naming the light-DOM form's id has `form === null`: the `form` attribute resolves ids in the input's own tree.

So the layer's reset restores the default value, the inner control, the machine context and the submission value, recomputes validity, and clears any error-after-interaction state (native `input` reset sets user validity to false, [HTML](https://html.spec.whatwg.org/multipage/input.html)). A test that clicks a reset button must wait a microtask before it asserts.

### 2.4 Q4: restore

**Common behaviour (probe 3.4).** Restore works the same way in every engine on a back-navigation:

- The engine calls `formStateRestoreCallback(state, "restore")` with the state that `setFormValue(value, state)` saved, both for a definition at the end of `<body>` and in a module script.
- It also calls it on an upgrade after `load`: `x-delayed` was defined 300 ms after `load` and still got its state.
- The order is `connectedCallback`, `formAssociatedCallback`, then `formStateRestoreCallback`.
- `autocomplete="off"` on the form turns restore off in all three engines. Chromium checks it in `ElementInternals::ShouldSaveAndRestoreFormControlState` (`element_internals.cc:688-691` at 159.0.8154.6), Firefox in `GenerateStateKey` (`dom/base/nsContentUtils.cpp:4698`, `:4756-4759`).
- No engine restores a FACE inside another element's shadow root: `<x-s>` inside `<x-wrap>`'s shadow root got no callback, as lit/lit#4974 found in Chrome 134.
- In Playwright no back-navigation hit the back/forward cache: `pageshow.persisted` was false in every run. A bfcache restore keeps the live document, so no restore runs [INFERENCE: not observed].

**`"autocomplete"` never happens.** All three implementations hard-code the reason:

- Chromium: `element_internals.cc:720-721`.
- Firefox: `dom/html/ElementInternals.cpp:521`, and the release note "'autocomplete' for custom elements remains unsupported" ([Bugzilla 1556358](https://bugzilla.mozilla.org/show_bug.cgi?id=1556358) comment 35).
- WebKit: `Source/WebCore/bindings/js/JSCustomElementInterface.cpp:438` at `5b391e6`, the WebKit base of Playwright 1.65.1. The commit that added FACEs says "with exception of `formStateRestoreCallback()` being called for autofill" (WebKit `8ab7fbc`, 2023-01-06).

`packages/line-core/src/form-associated.ts:48` documents the callback as "navigation or autofill".

**Per engine (probe 3.4).**

| Behaviour | Chromium 159 | Firefox 159 | WebKit 27.2 (macOS = Linux) |
|---|---|---|---|
| String state | restored | restored | restored |
| `FormData` state (string entries) | restored as `FormData` | restored as `FormData` | **restored as `FormData`** |
| `File` state made in script | not restored | restored | not restored |
| Submission value restored by the engine (no `setFormValue` in the new document) | **yes** (all values) | **yes** (all values, `File` too) | no |
| Restore on reload | no | **yes** | no |
| Restore with `Cache-Control: no-store` | yes | **no** (nor the native input) | yes |
| When, for parser-created elements (definitions in `<head>`) | after `load` (`readyState` `complete`) | at creation (`loading`) | at the end of parsing (`interactive`) |
| Two FACEs whose definitions run against tree order | each its own | **the later one gets the other's state** | each its own |

- **WebKit.** `FormAssociatedCustomElement::saveFormControlState` saves a string or every string entry of a `FormData`, and logs "File isn't currently supported" for files (`Source/WebCore/html/FormAssociatedCustomElement.cpp:236-284`, FIXME bug [249895](https://bugs.webkit.org/show_bug.cgi?id=249895) at `:240-241`). `restoreFormControlState` rebuilds a string or a `FormData` (`:286-303`). The "only string" wording comes from the 2023 WebKit blog post ([webkit.org/blog/13711](https://webkit.org/blog/13711/elementinternals-and-form-associated-custom-elements/)); the code and the probe say otherwise. One edge follows from `:293` [INFERENCE: not probed]: a saved list of exactly one item becomes a string, so only a `FormData` with entries round-trips as `FormData`.
- **Chromium** keeps only path-backed `File`s ("FIXME: handle Blob-backed File instances", `third_party/blink/renderer/core/fileapi/file.cc:372-375`, crbug 394948). It restores the submission value on purpose: "Per spec, the submission value shouldn't be automatically restored by the UA, but Blink has been doing that" (`element_internals.cc:710-715`).
- **Firefox** saves the value and the state together (`dom/html/HTMLElement.cpp:93-123`) and restores both (`dom/html/ElementInternals.cpp:512-525`).

**The Firefox misroute.** The report is [rak200/ui#380](https://github.com/rak200/ui/issues/380) (2026-11-10, Firefox 155 through Playwright 1.63.0). It reproduces on Firefox 159:

- With `<x-late name="late">` before `<x-early name="early">` in the form and `x-early` defined first, `x-late` received `"from early"`. Its restored submission value was `from early` too, on back and on reload.
- With the definitions in tree order, or in `<head>` before parsing, each element got its own state (probe 3.4, variants).
- A module script that defines in import order behaves like the failing case.

The source explains it:

- A FACE's state key is generated once, when restore is first attempted (`HTMLElement.cpp:125-139`), and its control number is assigned at definition time (`:197-202`).
- For a control in a form the key is `fp>type>FormNum>IndOfControlInForm>FormName`: the index of the control in the form at that moment, plus the form's name. The control's own `name` is appended only outside a form (`nsContentUtils.cpp:4713-4731`, `:4789-4803`, `:4820-4825`).
- So when `x-early` is defined first, it takes an index while `x-late` is not yet a form control. `x-late` then takes the same index.

A Bugzilla search on 2026-11-26 ("custom element restore", "formStateRestore", "ElementInternals restore") found no report of it; the issue's author says the same for 2026-11-10. Chromium keys controls per form by name and type, and WebKit by name and type through its form signature [INFERENCE: from the probe results and the WebKit commit message, which mentions `formKey` and form signatures; the key code was not read].

### 2.5 Q5: implicit submission from an inner `<input>`

The spec: implicit submission fires a click at the form's default button, which is "the first submit button in tree order whose form owner is that form", if it is not disabled. With no submit button, the form submits only if it has at most one "field that blocks implicit submission", which means an `input` of a text-like type whose form owner is that form ([HTML 4.10.22.2](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission)). The probe (3.5) gave the same results in all four runs:

| Case | Result |
|---|---|
| Enter in the FACE's inner `<input>`, form with `<button name="b" value="1">` | no submission, no `submit` event; `keydown` reached the host (target the host, composed path starting at the inner input) |
| Same, no button | no submission |
| Enter in a light-DOM `<input>`, form with the button | submits `?n1=hello&b=1` |
| Enter in a light-DOM `<input>`, one native input plus a FACE, no button | submits `?n1=hello`: the FACE is not a blocking field |
| Same with two native inputs | no submission |
| Same with a disabled default button | no submission |
| Emulation: `form.requestSubmit()` | submits `?q=hello`; no submitter, so `b=1` is lost |
| Emulation: `defaultButton.click()` | submits `?q=hello&b=1`, as native implicit submission does |

The inner input has no form owner, so the engine has no form to submit. ARCHITECTURE §7 already records that a custom element is never picked as the default button (`docs/ARCHITECTURE.md:390`; WICG/webcomponents#814). Emulating the spec means:

- find the default button among the form's submittable elements;
- click it when it exists and is enabled, and do nothing when it is disabled;
- when there is none, apply the blocking-field count, in which native rules never count a FACE.

IME composition must not submit [INFERENCE: `KeyboardEvent.isComposing`; not probed, as Playwright drives no IME].

### 2.6 Q6: autofill and password managers through an inner native input

**Chromium.** The full Chromium 159.0.8154.6 binary was launched through `channel: 'chromium'`, because the headless shell has no `Autofill` CDP domain. `Autofill.trigger` then ran address autofill from an inner `<input autocomplete="given-name">` (probe 3.6):

- It filled that input and a second host's inner `<input autocomplete="family-name" name="inner-family" id="inner-family-id">`, plus a light-DOM city input, all in one light-DOM `<form>`.
- `Autofill.addressFormFilled` reported the first inner input as `id: "h1"`, `name: "host-given"`. Those are the host's attributes, because the inner input had none. The second inner input kept its own attributes.
- `:autofill` and `:-webkit-autofill` matched the inner input.
- The `reset.input.css` keyframes, copied into the shadow root, fired `line-autofill-cancel` and then `line-autofill-start`.
- The host heard `input` and did not hear `change`. The probe element calls `setFormValue` on `input`, so `FormData` showed the filled values.

The source agrees:

- An unassociated control inside a shadow root is "owned (in the Autofill sense) by a `<form>` containing the shadow host" (`components/autofill/content/renderer/form_autofill_util.cc:2478-2482`, via `HasFormInclusiveAncestor`, `:1870-1878`). That is an ancestor `<form>`; a host associated through the `form` attribute is not covered [INFERENCE: from the code].
- Missing `id` and `name` are taken from up to two shadow hosts (`:112-114`, `:1959-1975`).
- A 2026 mechanism for site-specific "custom form control scripts" is `FEATURE_DISABLED_BY_DEFAULT` (`components/autofill/core/common/autofill_features.cc:608-611`).
- The chromestatus entry "Autofill in ShadowDOM" still reads "In developer trial (Behind a flag)" (feature 5769419581030400, last updated 2022), which the code above has overtaken.

CDP drives the fill data path, not the user's suggestion popup [INFERENCE: the popup uses the same form extraction]. Chrome's password manager was not probed.

**Firefox.** No automation hook exists, so nothing was probed:

- The login manager finds the form of a field in a shadow root by walking up through shadow hosts (`toolkit/modules/FormLikeFactory.sys.mjs:163-181`, `:194-208` at `9a2dc53`), and handles events retargeted to the host (`toolkit/components/passwordmgr/LoginManagerChild.sys.mjs:79-81`).
- BCD 8.1.11 marks Firefox's `:autofill` and `:-webkit-autofill` as partial from 86: "matches autofilled username and password fields, but not other autocompleted fields" (bug 1923525). So the `reset.input.css` trick would not see address autofill in Firefox [INFERENCE: not probed].

**WebKit and Safari.** No automation hook exists here either:

- WebKit bug [172567](https://bugs.webkit.org/show_bug.cgi?id=172567) ("Safari autofill doesn't work in form inputs that are in a shadow root") was fixed in Safari, not WebKit ("Fixing this actually requires a Safari change", comment 9). It shipped in macOS 13.3 and iOS 16.4 (comment 16), and nested shadow roots worked in 16.4 (comment 19).
- One-time-code fill into a shadow input was fixed for Safari 16.6 (comments 21-22).
- Playwright's WebKit is not Safari, on macOS or on Linux, so no WebKit run here can show AutoFill [INFERENCE].

**Extensions.**

- Bitwarden reaches shadow roots through `chrome.dom.openOrClosedShadowRoot` (Chrome) and `Element.openOrClosedShadowRoot` (Firefox). On Safari it falls back to `Element.shadowRoot`, so only open roots work there ([Bitwarden contributing docs, "Shadow DOM"](https://contributing.bitwarden.com/architecture/deep-dives/autofill/shadow-dom)).
- 1Password and Proton Pass users still report shadow-DOM misses in 2026 (1Password Community thread "Autofill does not work on cosmosdirekt.de customer login (fields inside shadow DOM)", 2026-11-13; ProtonMail/WebClients#516, 2026-06-22).

None of these were probed. ARCHITECTURE §16.2 describes the password-manager strategy (`docs/ARCHITECTURE.md:1486-1492`), and §16.3 (Summary — Strategy Per Case) calls it "best effort" (`:1530`).

**The FACE host itself is never autofilled.** Autofill writes native controls only, and no engine calls the `"autocomplete"` restore reason (§2.4).

### 2.7 Q7: the plan §5.2 support facts

| Feature | Chrome | Firefox | Safari | Source |
|---|---|---|---|---|
| `ElementInternals` | 77 | 93 | 16.4 | BCD 8.1.11 `api.ElementInternals` |
| `setValidity` | 77 | 98 | 16.4 | `api.ElementInternals.setValidity` |
| `ElementInternals.states` / `CustomStateSet` | 90 (dashed idents until 125) | 126 | 17.4 | `api.ElementInternals.states`, `api.CustomStateSet` |
| `:state()` | 125 | 126 | 17.4 | `css.selectors.state` |
| `:user-invalid` (native controls) | 119 | 88 | 16.5 | `css.selectors.user-invalid` |
| `:autofill` | 110 | 86 (partial) | 15 | `css.selectors.autofill` |

Both plan facts hold: "`ElementInternals` is in all three engines from Safari 16.4", and "`:state()` from Chrome 125, Firefox 126 and Safari 17.4" (`:284-285`). On the baseline, `'states' in ElementInternals.prototype` and `CSS.supports('selector(:state(x))')` were true in all four runs (probe 3.2).

## 3. Probes

All probes ran on 2026-11-26 on macOS 27.2.1 (arm64, build 26B131) in the worktree `line-ui-z17` (branch `docs/01-z17-r2-form-associated-contract`, HEAD `64e5e02` on `origin/main` `9c9b1f4`).

**Toolchain.**

- Install: `HOME=/tmp/emptyhome bun install --frozen-lockfile` with Bun 1.4.5 (`/tmp/bun145`; the workstation `bun` is 1.4.3).
- Runner: Node 22.23.5 (`/tmp/node-v22.23.5-darwin-arm64`).
- Engines: the repo's Playwright 1.65.1 from `node_modules` with Chromium 159.0.8154.6 (headless shell; the full Chromium binary of the same version for probe 3.6 only), Firefox 159.0 and WebKit 27.2 (build 2388).
- Engine sources: Playwright 1.65.1 pins Firefox to `mozilla-firefox/firefox` `9a2dc53c369c7ae5172018b35988e1d2ffeff402` and WebKit to `WebKit/WebKit` `5b391e6d3b14d549908dad2c6695999291313f30` (`browser_patches/*/UPSTREAM_CONFIG.sh` at tag `v1.65.1`). Chromium sources are read at tag `159.0.8154.6`, and spec text at the HTML Living Standard of 2026-11-26.

**Method.**

- One Node script, `/tmp/z17-probes/probe.mjs`, served its own pages from `node:http` on `127.0.0.1:5170` and ran the engines one after another with one page at a time. A second script, `probe2.mjs`, used `page.setContent`. Both scripts were deleted afterwards; the repo was not touched.
- The test element was `class XField extends HTMLElement { static formAssociated = true }`. It calls `attachInternals()` and opens a shadow root (`delegatesFocus` off, or on for `x-field-df`) holding one `<input part="input">`.
- On `input`, it calls `setFormValue(input.value)` and mirrors the inner input's flags with `setValidity(flags, input.validationMessage, input)`, or `setValidity({})` when valid.
- Every lifecycle callback appends `{ cb, tag, name, readyState }` to `window.__log`.
- The restore page has eight elements in one `<form id="f">`. They save state through `setFormValue(value, state)`:
  - `<input name="native">`;
  - `x-s`: `'sub:'+v`, with state `'state:'+v`;
  - `x-fd`: a `FormData` value with two entries and a `FormData` state `k1`, `k2`;
  - `x-file`: script-made `File`s for value and state;
  - `x-late` and `x-early`: `setFormValue(v)`, defined early-first;
  - `x-delayed`: defined 300 ms after `load`;
  - `x-wrap`: holds an `x-s` in its own shadow root.
- The restore steps: set the values, follow a link to `/other.html`, `page.goBack()`, wait 900 ms and read the log and `FormData`; then set again, `page.reload()` and read again. The variants were the default headers, `Cache-Control: no-store`, `autocomplete="off"` with no-store, and definitions in tree order, in `<head>` or in a `type="module"` script.

**Linux WebKit.** Per Miguel's choice of 2026-11-26, both scripts also ran in WebKit on Linux:

- Image: `mcr.microsoft.com/playwright:v1.65.1-noble` (`sha256:1507cbfc…5579`; Ubuntu 24.04.5, aarch64, WebKit build 2388 under `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`).
- Command: `docker run --rm --cpus 2 --memory 1g --ipc=host -v <worktree>:/work:ro -v /tmp/z17-probes:/probes`. The row 01-Z17 review re-ran the C1 and C2 probes and the anchor probe with `--cpus 1` in the same image, with the same results.
- The run used the repo's Playwright 1.65.1 JavaScript from the mounted `node_modules` with the container's Node 26.13.1, and the same port inside the container. Nothing was installed in the container.

This is a local aarch64 run; the CI runner is x86_64 and has not run these probes. Every recorded value matched macOS WebKit: 193 of 193 in `probe.mjs`, all of the definition-order variants and all of `probe2.mjs`. Below, "WebKit" means both.

### 3.1 Constraint validation (`/cv.html`; exit 0 in all runs)

| Check | Chromium 159.0.8154.6 | Firefox 159.0 | WebKit 27.2 (macOS, Linux) |
|---|---|---|---|
| Host with `required pattern minlength min max step`, empty: `valid`, `willValidate`, `form.checkValidity()` | true, true, true | same | same |
| `setValidity({valueMissing:true})` with no message | `TypeError` | same | same |
| Anchor: light DOM, other host's shadow, detached | `NotFoundError` × 3 | same | same |
| `setValidity({badInput:true}, 'bad')` | accepted, `validity.badInput` true | same | same |
| Inner input `minlength=3`, value `ab` set in script: `tooShort` | false | false | false |
| Same, `ab` typed | true | true | true |
| Inner `pattern="[a-z]+"`, `AB1` in script: `patternMismatch` | true | true | true |
| Inner `type=number min=1 max=10 step=2`: `0`, `4`, `11`, `3` | underflow+step, step, overflow, valid | same | same |
| Mirrored `valueMissing`: host, form, fieldset `:invalid`; `form.checkValidity()` | true, true, true; false | same | same |
| `internals.reportValidity()` with an inner anchor: return, `invalid` count, focus | false, 1, `a` › `input` | same | same |
| No anchor, no `delegatesFocus` | false, 1, focus unchanged (`park`) | same | same |
| No anchor, `delegatesFocus` | false, 1, `b` › `input` | same | same |
| `form.requestSubmit()` while invalid: `submit` events, `invalid`, focus | 0, 1, `a` › `input` | same | same |
| `form.reportValidity()` | false, 1, `a` › `input` | same | same |
| `readonly`: `willValidate`, `:invalid` | false, false | same | same |
| `disabled`: `willValidate`, `:invalid`, `:disabled` | false, false, true | same | same |
| Disabled `fieldset`: `willValidate`, `:disabled` | false, true | same | same |
| Host pseudo-classes | §2.1 table | same, plus `:user-valid` **true** | as Chromium |
| `valueMissing` message | "Please fill out this field." | "Please fill out this field." | "Fill out this field" |
| `patternMismatch` message | "Please match the requested format." | same as Chromium | "Match the requested format" |
| `tooShort` (typed) | "Please lengthen this text to 3 characters or more (you are currently using 2 characters)." | "Please use at least 3 characters (you are currently using 2 characters)." | "Use at least 3 characters" |
| `stepMismatch` (`4`) | "Please enter a valid value. The two nearest valid values are 3 and 5." | "Please select a valid value. The two nearest valid values are 3 and 5." | "Enter a valid value" |

### 3.2 `:user-invalid`, events and `:state()` (`/ui.html`; exit 0)

The host's inner input is `required` and the host mirrors it; `n` is a light-DOM `<input required>`.

| Check | Chromium | Firefox | WebKit |
|---|---|---|---|
| `CSS.supports('selector(:user-invalid)')`, `selector(:state(x))`, `'states' in ElementInternals.prototype` | true, true, true | same | same |
| `states.add('--legacy')`; `selector(:--x)` | accepted; false | same | same |
| Load: host `:invalid` / `:user-invalid`; inner and `n` `:user-invalid` | true / false; false, false | true / **true**; false, false | as Chromium |
| Typed `x`, Backspace, still focused | host `:user-invalid` false; inner false | host **true**; inner false | as Chromium |
| After Tab | host false; inner **true** | host **true**; inner true | as Chromium |
| Events at the host while typing and leaving | `keydown`, `input`, `blur`, `focusout`; no `change` | same | same |
| Submit clicked, untouched: page stays; host `:user-invalid`; inner; `n`; events | yes; false; false; true; `invalid` | yes; **true**; false; true; `invalid` | as Chromium |
| `states.add('user-invalid')`: `:state(user-invalid)`, inner `outline` from `:host(:state())`, host `color` from the page rule; after `delete` | true, `rgb(255, 0, 0) 3px`, `rgb(0, 128, 0)`; false | same | same |

### 3.3 Reset (`/reset.html`; exit 0)

| Check | All four runs |
|---|---|
| Inner `<input form="f">`: `.form` | `null` |
| Sequence on `form.reset()` | `reset` event, then `formResetCallback`, before `reset()` returns |
| After reset: inner input, native input, `FormData` | `typed`; `def`; `a=typed`, `n=def` |
| `reset` cancelled | 0 callbacks |
| `<input type="reset">` click: callbacks right after `click()`, after one microtask | 0, then 1 |

### 3.4 Restore (`/restore.html`; exit 0)

Back-navigation, default headers (`pageshow.persisted` false everywhere):

| Element | Chromium | Firefox | WebKit |
|---|---|---|---|
| `x-s` (`state:S`) | `"state:S"`, `@loading` | same | same |
| `x-fd` (`FormData` state) | `FormData` `k1=FD`, `k2=b` | same | same |
| `x-file` (`File` state) | no callback | `File` `state.txt` | no callback |
| `x-late` / `x-early`, early defined first | own values | **both `"from early"`** | own values |
| `x-delayed` (defined after `load`) | `"state:DELAYED"`, `@complete` | same | same |
| `x-s` inside `x-wrap`'s shadow root | no callback | no callback | no callback |
| `FormData` after back, no `setFormValue` in the new document | `s=sub:S`, `fd`, `fd2`, `late`, `early`, `delayed` | same plus `file=File:sub.txt`; `late=from early` | only `native` |
| Native `<input>` | restored | restored | restored |
| Reload | no callback; native empty | **same callbacks as back**; native restored | no callback; native empty |
| `Cache-Control: no-store`, back | as default | **nothing restored, native included** | as default |
| `autocomplete="off"` (no-store) | nothing restored | nothing restored | nothing restored |

Definition-order variants, default headers:

| Variant | Chromium | Firefox | WebKit |
|---|---|---|---|
| Definitions in tree order | own values; restore `@loading` | own values (back and reload) | own values |
| Definitions in `<head>`, before parsing | own values; restore `@complete` | own values; `@loading` | own values; `@interactive` |
| `type="module"`, early first | own values; `@interactive` | **`late` gets `"from early"`** (back and reload) | own values; `@interactive` |

### 3.5 Implicit submission (`/impl.html`; exit 0)

The results are in §2.5; all four runs were identical. Each case loaded a fresh page, clicked the target, typed `hello`, pressed Enter, waited 700 ms and read the URL and the recorded `submit` events.

### 3.6 Autofill (Chromium only; `/af.html`; exit 0)

| Check | Chromium 159.0.8154.6 (full binary, new headless) |
|---|---|
| `Autofill.enable` / `Autofill.trigger` in the headless shell | `'Autofill.enable' wasn't found` |
| `Autofill.trigger` from the inner `given-name` input, address `NAME_FIRST` `Ada`, `NAME_LAST` `Lovelace`, `ADDRESS_HOME_CITY` `London` | ok |
| `addressFormFilled.filledFields` | `{id: "h1", name: "host-given", value: "Ada", autofillType: "First name", strategy: autocompleteAttribute}`, `{id: "inner-family-id", name: "inner-family", value: "Lovelace"}`, `{id: "city", name: "city", value: "London"}` |
| Inner input `:autofill`, `:-webkit-autofill` | true, true |
| Events (in order) | `line-autofill-cancel` × 2 (initial), `input@host`, `change@inner` per host, then `line-autofill-start` × 2 |
| `FormData` | `host-given=Ada`, `host-family=Lovelace`, `city=London` |

Firefox and WebKit: not probed; no automation hook exists (§2.6).

### 3.7 Extra checks (`probe2.mjs`, `page.setContent`; exit 0)

| Check | All four runs |
|---|---|
| `pattern="[[a-z]--[aeiou]]+"`: `abc`, `bcd` | mismatch, valid (`v` flag); `new RegExp(…, 'v')` compiles |
| Anchor removed after `setValidity`: `reportValidity()`, still invalid, focus | false, true, `body` |
| `invalid` event: `bubbles`, `composed`, `cancelable`; capture listener on the form | false, false, true; fires on `checkValidity()` |

## 4. Recommendations for the shared form layer (O1 (a), stream F)

These are inputs for the Phase 2 spec (plan §5.5 `:405-409`), not decisions.

1. **Compute validity in the layer (recommended).**
   - The layer derives the flags from its own constraint props (`required`, `minlength`, `maxlength`, `pattern` compiled as `^(?:…)$` with the `v` flag, `min`, `max`, `step`) on every value change, whatever set it: typing, script, an attribute, reset, restore, or an agent.
   - It merges `custom-validity` as `customError` (the C4 convention, `docs/specs/0002-button.md` Open Question 6) and calls `setValidity` once.
   - It passes the inner control as the anchor once rendered, passes none before, and re-sets the anchor when a render replaces it.
   - *Alternative:* mirror the inner native input's `validity`. It gives localized messages for free but misses `minlength`/`maxlength` on non-typed values, and does nothing for machines without a native input.
   - *Alternative:* the scratch-input technique of whatwg/html#10360, which has the same `minlength` gap.
2. **Use an error-after-interaction state of the layer's own (recommended).** The layer reflects it through `:state()` and a host attribute, as for every state (ARCHITECTURE §14):
   - set it on `focusout` after a user edit, and on a submission attempt;
   - clear it on reset;
   - never ask consumers to use `:user-invalid`, which differs between Firefox and the other two.
   - *Alternative:* wait for an `ElementInternals` "user interacted" API (whatwg/html#9639), which has no implementer commitment.
   - *Alternative:* `:invalid` from first paint, which shows errors before interaction.
   - The open point is how to detect a submission attempt (§6 Q4).
3. **Reset everything in `formResetCallback` (recommended).** That covers the default value, the inner control, the machine, the submission value, validity and the interaction state. Tests wait a microtask after a reset-button click.
4. **Restore with an identity-stamped, string-only state (recommended).**
   - Save `setFormValue(value, state)` where the state is a string (or a `FormData` with string entries, for multi-value controls) that carries the element's tag and `name`. The callback ignores a state stamped for another element, so Firefox's misroute leaves the control at its default instead of corrupting it.
   - The callback always calls `setFormValue` itself, because Chromium and Firefox restore the submission value and WebKit does not.
   - It must accept a restore after the first render and, in Chromium, after `load`.
   - It must never save `File` state.
   - *Alternative:* `state` = `value` (the platform default), which inherits the misroute and the per-engine value restore.
   - *Alternative:* no restore (a `null` state), which drops the plan §2.3 obligation.
5. **Run spec implicit submission from the inner single-line input (recommended, subject to §6 Q7).**
   - On Enter (`keydown`, not composing), click the form's enabled default button. Do nothing when it is disabled.
   - With no submit button, call `form.requestSubmit()` only when at most one blocking field exists.
   - *Alternative:* `form.requestSubmit()` always, which loses the submitter's `name=value` and ignores a disabled default button.
   - *Alternative:* no emulation, which is what every engine does today and which breaks "Enter submits" for every line text control.
6. **Keep a real inner native control for autofill and password managers (recommended; ARCHITECTURE §16.2 already says so).**
   - The control carries `autocomplete` (and `type="password"` for PasswordInput), in an open shadow root, inside a light-DOM `<form>` ancestor.
   - The layer syncs the value on the inner `input` event (`change` does not leave the shadow root).
   - Forwarding `name` to the inner input is optional for Chromium, which borrows the host's, and does not put the inner input in the form.

## 5. Contradictions and gaps

Per PROCESS §2 these return to the plan and the PRD before any spec work. They are flagged, not resolved.

| # | Statement | Where | Evidence |
|---|---|---|---|
| C1 | "`:user-invalid`, which never matches a form-associated custom element" | Plan §5.1 R2 (`docs/plans/02-plan-essential-forms.md:264`), §5.5 (`:409`), §8 (`:514`); also the ledger row 01-Z17 text, corrected on this branch | True in Chromium 159 and WebKit 27.2; **false in Firefox 159**, where it matches every invalid FACE from load (§2.2; Gecko `HTMLElement.cpp:347-358`; Bugzilla 1910571) |
| C2 | "WebKit restores only a string" / "WebKit string-only" | Plan §5.1 R2 (`:264`), §8 (`:515`); also the ledger row 01-Z17 text, corrected on this branch | WebKit 27.2 restores a `FormData` of strings as `FormData` (§2.4, probe 3.4; `FormAssociatedCustomElement.cpp:236-303`). Only `File` is unsupported, which Chromium also drops for script-made files. "Never for autocomplete" holds, and holds in all three engines |
| C3 | "HTML5 validation (`required`, `pattern`, `minlength`) works natively" | ARCHITECTURE §7 (`docs/ARCHITECTURE.md:393`) | Already plan §5.7 gap 1; confirmed in three engines (probe 3.1) |
| C4 | "`<line-button type="reset">` resets all form controls" | ARCHITECTURE §7 (`:392`) | The platform only runs each FACE's `formResetCallback`; inner state and the submission value stay unless the component resets them (probe 3.3) |
| C5 | The autofill animation trick "works across all browsers" | ARCHITECTURE §15.3 (`:1377`); PRD §4.2 Input "Detects autofill" (`docs/PRD.md:276`) | Observed in Chromium only (probe 3.6). BCD marks Firefox's `:autofill` and `:-webkit-autofill` as matching username and password fields only. WebKit was not observable |
| C6 | `formStateRestoreCallback` "(navigation or autofill)" | `packages/line-core/src/form-associated.ts:48` (code comment) | No engine ever calls it for autofill (§2.4) |

No statement of the MANIFESTO is contradicted. Law 7 says "native `<form>` semantics is the only contract" (`docs/MANIFESTO.md:51`), and implicit submission emulation (§4 item 5) adds behaviour that the native platform does not give a FACE (§6 Q7).

## 6. Open questions for the post-research revision and the Phase 2 spec

| # | Question | For |
|---|---|---|
| Q1 | How do plan §5.1, §5.5 and §8 restate the `:user-invalid` fact (C1)? Does the forms guide (plan §4.5) warn that `line-*:user-invalid` behaves differently in Firefox? | Plan revision (plan §10 step 4) |
| Q2 | How do plan §5.1 R2 and §8 restate the WebKit restore fact (C2)? | Plan revision |
| Q3 | The rewording of ARCHITECTURE §7 `:392-395` (C3, C4) and §15.3 `:1377` (C5), and of PRD `:276` "Detects autofill" | PRD and ARCHITECTURE revision |
| Q4 | What sets the error-after-interaction state? `invalid` fires for script `checkValidity()` too, and no platform signal marks a submission attempt (whatwg/html#9878). Options: listen for `invalid` and accept script checks; also watch the form's submitters; or let Field drive it. What is the state's name against ARCHITECTURE's `error`/`invalid` (R3)? | Phase 2 spec (plan `:409`) |
| Q5 | What does "state restore … where the engine supports it" (plan `:116`, `:472`) prove? Back-navigation restores in all three engines; reload only in Firefox; no-store disables Firefox; Playwright never entered the bfcache | Phase 2 spec §9, test design |
| Q6 | The identity-stamped state shape (§4 item 4). Should someone file the Firefox misroute upstream (no Bugzilla report found on 2026-11-26)? Filing is outside the repo | Phase 2 spec; Miguel |
| Q7 | Does the layer emulate implicit submission (§4 item 5) under Law 7? If so, does a `<line-button type="submit">` count as the default button, and do line text controls count as blocking fields for each other? Native rules count neither | Phase 2 spec; possibly a MANIFESTO or ARCHITECTURE §7 reading |
| Q8 | A FACE inside another component's shadow root joins no outer form and is never restored (probe 3.4; lit/lit#4974). Does Phase 2 need a rule that composed line form controls stay in the light DOM? Field and Fieldset slot their controls; the A2UI surface renders light DOM | Phase 2 spec (rule, plan §5.3) |
| Q9 | Validation messages: reuse each engine's localized text (inner input or scratch input) or require consumer messages? Localisation is out of scope (MANIFESTO), and plan `:419-420` already lists consumer-supplied labels | Phase 2 spec |
| Q10 | Fix the `form-associated.ts:48` comment (C6) in the stream F row | Stream F |
| Q11 | Linux WebKit on x86_64 (CI) has not run these probes; lesson 4 (plan `:296`) asks for CI before a WebKit claim holds. The stream F Browser-tier tests would close this | Stream F |
| Q12 | Password managers and Safari AutoFill cannot be automated. Do they stay "best effort" (ARCHITECTURE `:1530`), with a manual check per PasswordInput release, or stay unverified? | Phase 2 spec (PasswordInput) |

## 7. Sources

- HTML Living Standard, last updated 2026-11-26:
  - [custom elements: `setValidity`, validation anchor, state, `readonly`, reset, restore](https://html.spec.whatwg.org/multipage/custom-elements.html#dom-elementinternals-setvalidity);
  - [user validity](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#user-validity), [interactively validate](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#interactively-validate-the-constraints), [`minlength`](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#setting-minimum-input-length-requirements:-the-minlength-attribute), [implicit submission](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission);
  - [`:user-invalid`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-user-invalid), [`:read-only`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-read-only).
- Issues:
  - whatwg/html [#9639](https://github.com/whatwg/html/issues/9639), [#9878](https://github.com/whatwg/html/issues/9878), [#10360](https://github.com/whatwg/html/issues/10360), [#7292](https://github.com/whatwg/html/issues/7292) (form restoration interop, open);
  - WICG/webcomponents#814;
  - lit/lit [#4974](https://github.com/lit/lit/issues/4974);
  - rak200/ui [#380](https://github.com/rak200/ui/issues/380);
  - Bugzilla [1556358](https://bugzilla.mozilla.org/show_bug.cgi?id=1556358), [1910571](https://bugzilla.mozilla.org/show_bug.cgi?id=1910571), 1923525;
  - WebKit [172567](https://bugs.webkit.org/show_bug.cgi?id=172567), [249895](https://bugs.webkit.org/show_bug.cgi?id=249895);
  - crbug 394948, 649162;
  - chromestatus 5769419581030400;
  - ProtonMail/WebClients#516.
- Chromium at tag `159.0.8154.6`:
  - `third_party/blink/renderer/core/html/custom/element_internals.cc` (`:60-95`, `:358`, `:684-723`);
  - `third_party/blink/renderer/core/fileapi/file.cc` (`:136-149`, `:372-380`);
  - `components/autofill/content/renderer/form_autofill_util.cc` (`:112-114`, `:1870-1878`, `:1959-1975`, `:2470-2484`);
  - `components/autofill/core/common/autofill_features.cc` (`:608-611`).
- Firefox at `9a2dc53c369c7ae5172018b35988e1d2ffeff402`:
  - `dom/html/HTMLElement.cpp` (`:93-170`, `:197-202`, `:347-358`);
  - `dom/html/ElementInternals.cpp` (`:512-531`);
  - `dom/base/nsContentUtils.cpp` (`:4685-4830`);
  - `toolkit/modules/FormLikeFactory.sys.mjs` (`:163-208`);
  - `toolkit/components/passwordmgr/LoginManagerChild.sys.mjs` (`:79-81`).
- WebKit at `5b391e6d3b14d549908dad2c6695999291313f30`:
  - `Source/WebCore/html/FormAssociatedCustomElement.cpp` (`:185-205`, `:229-303`);
  - `Source/WebCore/bindings/js/JSCustomElementInterface.cpp` (`:418-438`);
  - `Source/WebCore/dom/CustomElementReactionQueue.cpp` (`:276-286`);
  - commit `8ab7fbc063ef25be4e7d4901f3c399bc43a736da`.
- `@mdn/browser-compat-data` 8.1.11 (`npm pack`, 2026-11-26).
- [WebKit blog 13711](https://webkit.org/blog/13711/elementinternals-and-form-associated-custom-elements/); [Bitwarden "Shadow DOM"](https://contributing.bitwarden.com/architecture/deep-dives/autofill/shadow-dom).
- Probes: §3, this row, 2026-11-26.
