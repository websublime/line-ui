# Research: Field and labelling (R3)

**Row:** `01-Z18` (Phase 2 plan §5.1 R3)
**Date:** 2026-11-26 (every probe ran the same day, §3)
**Toolchain baseline:** row 01-Z14: Bun 1.4.5, Playwright 1.65.1 with Chromium 159.0.8154.6, Firefox 159.0 (build 1572) and WebKit 27.2 (build 2388), Zag 1.49.0, axe-core 4.14.1 through `@axe-core/playwright` 4.14.1. The macOS probes ran on Node 22.23.5, the Linux probes on the container's Node 26.13.1, both with the repo's Playwright 1.65.1 JS (§3.1).
**Repo sources (at `origin/main` `9c9b1f4`):** `docs/plans/02-plan-essential-forms.md` §1, §2.2, §5.1 R2 and R3, §5.3, §5.5, §5.7, §8; `docs/ARCHITECTURE.md` (v0.8.28) §7, §9, §14.8, §16.2, §17.2; `docs/PRD.md` (v0.8.36) §1.6, §1.7, §4.2, §7.4; `docs/MANIFESTO.md` Principle 3, Laws 3, 4, 7; `docs/plans/01-plan-core-primitives.md` §5.6; `docs/specs/01-spec-core-primitives.md` §10 SD31; `docs/specs/0002-button.md`, `0003-icon-button.md`, `0009-avatar.md`; `docs/research/01-research-accessibility.md`; `packages/line-core/src/line-element.ts`, `form-associated.ts`; `packages/line-components/src/button/button.ts`.
**Status:** Evidence. Research carries no rules (`docs/PROCESS.md:20-22`). Recommendations are marked "(recommended)"; every decision is an open question in §7, and every conflict with a higher document is listed in §6 and left unresolved.

> **TL;DR**
>
> - Element reflection is the only mechanism that names and describes a role on an inner native element across the shadow boundary in all three engines. `inner.ariaLabelledByElements = [label]` and `ariaDescribedByElements = [hint, error]`, pointing at the light-DOM nodes slotted into the Field, gave the inner `<input>` the name "Email" and the hint and error as its description in Chromium 159 and Firefox 159 and 161. WebKit 27.2 gave the name on macOS and on Linux; its description is not observable with the tools available here (§2.4). A target in a sibling shadow tree, such as a label inside the Field's own shadow root, is dropped by the getter and names nothing in every engine.
> - The other three mechanisms do not reach the inner element in three engines. An `aria-labelledby` ID on the host names a `generic` host and leaves the inner `<input>` unnamed in Chromium too, not only in Firefox and Safari as ARCHITECTURE §9 says. Reference target works only in Chromium (Chrome 158 stable and Chromium 159), and only for references that point at the host, such as `<label for>`; an `aria-labelledby` or `aria-describedby` set on the host stays on the host. A host role through `ElementInternals` names the host and leaves a second, unnamed textbox where an inner `<input>` exists. `<label for>` on a form-associated host names only the host, but its click focuses the inner input (through `delegatesFocus`) and toggles a host-role checkbox in all three engines.
> - A Field can hand the references to any slotted control through the standard reflection properties on that control. A native `<input>` uses them as is, and a line control that overrides the accessors forwards them to its role element. In this probe the inner input got the name in all three engines and the description in Chromium and Firefox, and the host stayed unnamed. Three platform traps apply. Writing or removing the `aria-labelledby` attribute clears the reflected elements, and Zag 1.49.0's `spreadProps` removes an ARIA attribute whose value is `undefined` on every spread after the first, so reflection set before or after the first render is cleared at the next one. A hidden error element that stays referenced is still read as part of the description in Chromium and Firefox. Firefox exposes no error-message relation for `ariaErrorMessageElements`.
> - The Field event contract can rest on native events for every control. `focus`, `blur`, `focusin`, `focusout`, `beforeinput` and `input` cross the shadow boundary with the host as target. `invalid` reaches a capture listener on the Field from a form-associated host and from a native control. `change` does not cross the boundary, which is why C3's `line-change` is needed. No platform event signals a validity change, so a `line-valid` (or a re-read of `validity`) is the only way to learn that an error cleared without input. A native `<select>` in a Field, which ARCHITECTURE §16.2 recommends, emits none of the §9 `line-*` events.
> - Playwright 1.65 changed two things that matter here. It honours `ariaLabelledByElements` (microsoft/playwright#43577), so 1.64.0 reported the reflected label as unnamed and 1.65.1 names it. It also drops unslotted light-DOM text from accessible names (#43150), so a control that does not slot its label text loses that text in 1.65. Playwright still cannot see `ElementInternals` roles or ARIA, `ariaDescribedByElements`, or reference target outside Chromium's `labels`. The #43577 read also crashes the Firefox content process of Playwright 1.65.1 (build 1572) whenever page code, or axe-core, reads `ariaLabelledByElements` too (Mozilla bug 2090055). Playwright's Firefox build 1575 and later pass, which no stable Playwright release ships yet (1.66 development branch). An `@axe-core/playwright` 4.14.1 scan and a `getByRole` on this note's labelled fixture crashed Firefox in either order, and upstream reports the same for a plain `aria-labelledby` attribute (§2.8).

---

## 1. Question

Plan §5.1 R3: "The Field labelling mechanism across the shadow boundary: reference target (Chromium only today), `ariaLabelledByElements` (all three engines, toward ancestor trees only), a host role, `<label for>` on a form-associated host; the Field event contract (`line-focus`, `line-blur`, `line-invalid`, `line-valid`) against C3 and C9; native controls inside Field (ARCHITECTURE §16.2 recommends a native `<select>` there); `data-error` vs `data-invalid`" (`docs/plans/02-plan-essential-forms.md:265`). ARCHITECTURE §9 left the mechanism to the Field spec (`docs/ARCHITECTURE.md:487`), as the Phase 1 plan did (`docs/plans/01-plan-core-primitives.md:511`). Plan §8 rates cross-shadow labelling a high-likelihood, high-impact risk (`docs/plans/02-plan-essential-forms.md:516`).

- **Q1** For each mechanism, what accessible name and description does each engine's accessibility tree expose, on the host and on the inner element that carries the role?
- **Q2** What can each observation method see (Chromium CDP, the WebKit inspector protocol, Firefox through WebDriver, Playwright aria snapshots and assertions, axe-core), and what changed in Playwright 1.65?
- **Q3** How does the Field event contract in ARCHITECTURE §9 fit C3 and C9, and which native events already reach the Field?
- **Q4** How does a native control inside the Field get labelled and read (ARCHITECTURE §16.2)?
- **Q5** What do `data-error` and `data-invalid` mean, and where do they collide?
- **Q6** What contradicts the plan, the PRD, ARCHITECTURE or the MANIFESTO?

## 2. Findings

### 2.1 Platform status (retrieved 2026-11-26)

From `@mdn/browser-compat-data` 8.1.11 (published 2026-11-26), which lists the current stable releases as Chrome 158, Firefox 161 and Safari 27.2.

| Feature | Chrome | Firefox | Safari | BCD status |
|---|---|---|---|---|
| `attachShadow({ referenceTarget })`, `ShadowRoot.referenceTarget`, `<template shadowrootreferencetarget>` | 152 | 144 behind a flag | 26 behind a flag | experimental, not standards-track |
| `Element.ariaLabelledByElements`, `ariaDescribedByElements`, `ariaErrorMessageElements` | 135 | 136 | 16.4 | standard |
| The same three on `ElementInternals` | 135 | 136 | 16.4 | standard |
| `ElementInternals.role` | 103 | 119 | 16.4 | standard |
| `ElementInternals.labels` | 77 | 98 | 16.4 | standard |
| `ElementInternals.ariaDescription` | 83 | 119 | not supported | standard |
| `Element.ariaDescription` | 83 | 119 | 17.4 | standard |
| `attachShadow({ delegatesFocus })` | 53 | 94 | 13.1 | standard |

Reference target upstream, 2026-11-26:

- whatwg/dom#1353 ("Add reference target to shadow root") and whatwg/html#10995 ("Add reference target") are open and unmerged (updated 2026-11-13 and 2026-11-18).
- Firefox: Mozilla's standards position is positive (mozilla/standards-positions#1035, closed 2025-09-29, last updated 2026-11-04). The implementation bug 1952585 is `NEW` with 23 dependencies (last change 2026-11-19).
- WebKit: WebKit/standards-positions#356 is open with no position label (last update 2026-04-03).
- Chrome Platform Status still shows "Origin trial" at milestone 152 for feature 5188237101891584. Probes show it unflagged in Chrome 158.0.8127.37 stable and in Playwright's Chromium 159: `'referenceTarget' in ShadowRoot.prototype` is `true`, and `<label for>` on the host names the inner input (§2.2, F4).
- PRD §1.7 targets the latest two stable versions of each browser (`docs/PRD.md:163`). Reference target is outside that target in Firefox and Safari, while element reflection and `ElementInternals` ARIA are inside it.

Two spec facts bound element reflection:

- The getter of an `aria*Elements` attribute returns only the explicitly set elements that are descendants of one of the element's shadow-including ancestors ([HTML, reflecting content attributes](https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes)). A reference from inside a shadow root can point outward to the light DOM, or to any enclosing shadow root, but not into a sibling shadow tree (probe F2b: the getter returns `[]` in all three engines).
- Writing the content attribute clears the explicitly set elements, and so does removing it (probe 3.5: `setAttribute('aria-labelledby', 'o')` replaces the reflected label with `#o`, and `removeAttribute` empties it, in all three engines). `setAttribute('aria-labelledby', '')` is not interoperable. Chromium reads back `[]`, Firefox `null`, and WebKit keeps the reflected element.

### 2.2 Q1: the mechanisms, per engine

Fixtures are in §3.2. Each "Field" is a light-DOM element with an open shadow root that slots `label`, the default slot, `hint` and `error`. The label, hint and error are light-DOM children of that Field, and so is the control host. Each form-associated control has an open shadow root with `delegatesFocus` and an inner `<input>`, which is how ARCHITECTURE §15.1 shapes Input; the host-role checkbox has no inner native control. "Ch" is Chromium 159 through CDP, "FF" is Firefox 159 through WebDriver and the privileged accessibility service (Firefox 161 stable gave identical results), and "WK" is WebKit 27.2 through the inspector protocol on macOS. Linux WebKit is reported where it differs (§3.4). "—" means the engine exposes no description, or the method cannot read one (WK).

| # | Mechanism | Inner `<input>` name / description | Host | Notes |
|---|---|---|---|---|
| F0 | None | "" in Ch, FF, WK | — | Baseline |
| F1 | `aria-labelledby` and `aria-describedby` IDs on the host (ARCH §9 today) | "" in Ch, FF, WK | Ch and FF: `generic` named "Email", with the hint and error as its description. WK: `group` named "Email" | The host is named, the role is not. Chromium is no exception |
| F2 | `inner.ariaLabelledByElements = [label]`, `inner.ariaDescribedByElements = [hint, error]`, set from inside, pointing at the light-DOM nodes | "Email" / "We never share it Enter a valid email" in Ch and FF; "Email" in WK | unnamed | Works in three engines |
| F2b | The same, pointing at a `<label>` inside the Field's own shadow root | "" in Ch, FF, WK | — | Getter returns `[]` in all three: a sibling tree is not an ancestor |
| F2c | `host.ariaLabelledByElements` and `ariaDescribedByElements` (the platform properties, not forwarded) | "" in Ch, FF, WK | as F1 | Same result as host IDs |
| F2n | F2 with the whole field inside a consumer component's shadow root | "Nested email" in Ch, FF, WK | — | An enclosing shadow root is an ancestor tree |
| F3 | Host `internals.role = 'textbox'`, host IDs | "" in Ch, FF, WK (a second textbox). Linux WK marks it `ignored` | `textbox` "Email" / "We never share it" (Ch, FF); `textbox` "Email" (WK) | Duplicate textbox wherever an inner `<input>` exists |
| F3b | Host `internals.role = 'checkbox'`, no inner native control, host IDs | — | `checkbox` "Accept terms" / "Required to continue" (Ch, FF); "Accept terms" (WK) | Works when the host is the only element with a role |
| F3c | As F3b, with `internals.ariaLabelledByElements` and `ariaDescribedByElements` instead of attributes | — | as F3b | Default semantics through `ElementInternals` work in three engines |
| F4 | Reference target (`referenceTarget: 'inner'`), `<label for=host>`, host `aria-describedby` | Ch: "Email" / "". FF, WK: "" | Ch: `generic`, unnamed, with the description. FF: `generic` "Email" with the description; WK: `group` "Email" | Chromium forwards the label, which points at the host, and leaves the host's own `aria-describedby` on the host. `inner.labels.length` is 1 in Chromium and `internals.labels.length` is 1 in FF and WK |
| F4b | Reference target, host `aria-labelledby` | "" in Ch, FF, WK | — | Attributes on the host are not forwarded, even in Chromium |
| F5 | `<label for=host>` on a form-associated host with no role | "" in Ch, FF, WK | Ch, FF: `generic` "Email"; WK: `group` "Email", `ignored` | `internals.labels.length === 1` in all three |
| F5b | `<label for=host>` on a host-role checkbox | — | `checkbox` "Accept terms" in Ch, FF, WK | A label click focused the host and toggled it once (`clicks === 1`) in all three |
| F5c | `<label for=host>` on a host with `internals.role = 'textbox'` and an inner `<input>` | "" (Linux WK: `ignored`) | `textbox` "Email" in Ch, FF, WK | Duplicate textbox, as F3 |
| F6 | A wrapping `<label>Email <x-input></label>` | "" in Ch, FF, WK | Ch: `generic` "Email"; FF: no accessible (`none`); WK: `ignored` | — |
| F7 | String copy: `inner.setAttribute('aria-label', label text)`, `aria-description` = hint text (the Button C5 pattern) | "Email" / "We never share it" in Ch and FF; "Email" in WK | — | Static text; needs re-copying on change |
| F12 | The Field writes `control.ariaLabelledByElements` and `ariaDescribedByElements` on the slotted host; the control's class overrides the two accessors and forwards them to its inner `<input>` | "Email" / "We never share it Enter a valid email" in Ch and FF; "Email" in WK | Ch: `generic`, unnamed; FF: no accessible (`none`); WK: `ignored`. No `aria-labelledby` attribute is written | Same write as F12n on a native control |
| F12n | The same Field write on a slotted native `<input>` | "Email" / "We never share it" in Ch and FF; "Email" in WK | — | Native behaviour |
| F13 | F12 plus `<label for=host>` | "Email" / "We never share it" in Ch and FF; "Email" in WK | Ch, FF: `generic` "Email"; WK: `ignored`, "Email" | The inner input is named, and so is the generic host in Ch and FF |
| F14 | A host-role checkbox with its label text as an unslotted light-DOM child (its shadow root has no `<slot>`) | — | `checkbox` "[ ]" in Ch, FF, WK (the shadow text only) | Unslotted text is not rendered and not part of the name |
| F14b | The same with a `<slot>` | — | `checkbox` "[ ] Accept terms" in Ch, FF, WK | — |

Label activation (Playwright clicks on the label, all three engines, macOS and Linux identical): `<label for>` on a form-associated host focused the inner `<input>` through `delegatesFocus` (F4, F5, F5c), as did the wrapping label (F6). It focused and toggled the host-role checkbox (F5b) and focused the native `<select>` (F8). `label.control` returns the host in all three engines.

### 2.3 The hand-off between Field and control, and the description

- **The standard properties as the hand-off.** In F12 the Field-side code is the same for every control: `control.ariaLabelledByElements = [label]` and `control.ariaDescribedByElements = [hint, error]`. On a native control the platform applies it (F12n). On a line control, an accessor pair on its class forwards the values to the element that carries the role, and the platform reflection on the host is never set. The host therefore stays unnamed (F12), which avoids the named `generic` host that F1, F5 and F13 leave behind. This mirrors C5, "applies the accessible name to the element that carries the role" (`docs/ARCHITECTURE.md:1580`). In Chromium and Firefox the isolated world that Playwright reads from does not see the page's class accessors [INFERENCE: Xray wrappers and isolated worlds bypass page-defined prototypes]. Playwright still named F12 correctly, because it reads the inner element.
- **Clobbering.** Any write of the `aria-labelledby` or `aria-describedby` attribute on the inner element clears the reflected list (§2.1). Lit templates and Zag's `spreadProps` write attributes. In Zag 1.49.0, `spreadProps` stores the previous attributes per node, starting from `{}` (`@zag-js/vanilla/dist/spread-props.mjs:53`). It skips a value equal to the previous one (`:68`), so an `undefined` value on the first spread writes nothing, but it stores the key as `undefined`. On every later spread, its loop over the previous keys calls `removeAttribute` for each key whose new value is `null` or `undefined` (`:95-99`). It also writes or removes any key whose value changes (`:90-93`). The checkbox connect, for example, emits `"aria-labelledby": rendered.label ? getLabelId(scope) : void 0` on its hidden input (`@zag-js/checkbox/dist/checkbox.connect.mjs:107`). A Field reference on that input survives the first spread and is cleared at the second, whether it was set before or after the first render. "Set the reflection after the first render" is therefore no fix either. A machine that renders its own label part overwrites the reference with its own ID at once. These timings come from reading the source; the review of this note re-ran them in three engines, and this note did not run them through `LineMachineController`.
- **Where the role sits in the Phase 2 Zag machines (1.49.0 `*.connect.mjs`).** On a native hidden input labelled by the machine's own label part: checkbox and switch (`checkbox.connect.mjs:103-108`, `switch.connect.mjs:102-107`). On a `group` or `radiogroup` with `aria-labelledby` to the label part: radio-group (`:62-64`), toggle-group (`:34`, no label wiring) and date-input (`:116-117`, segments are `spinbutton` with their own `aria-label`, `:139`, `:148`). On a `combobox` trigger: select (`:159-166`). On a `slider` thumb, which takes `aria-label` and `aria-labelledby` props (`slider.connect.mjs:10-11`, `:166-173`). On the text input itself, with a label part `htmlFor` it: number-input (`spinbutton`, `:115`), editable (`:98-99`) and password-input (`:47`). The Field label therefore lands on a native input, a group or a custom-role element depending on the machine, and the hand-off has to reach whichever of these the component exposes.
- **A hidden error is still described.** Accname includes hidden nodes that a relation points at directly ([accname, step 2A](https://w3c.github.io/accname/#comp_hidden_not_referenced)). With the error element `hidden` and still in `ariaDescribedByElements` (F15), Chromium and Firefox read "We never share it Enter a valid email". With the error element unslotted (F15u), Chromium drops it and Firefox still reads it. Playwright drops it in both cases. Hiding the error slot does not take the error out of the description; only removing it from the list does.
- **`aria-errormessage` is not interoperable through reflection.** With `aria-invalid="true"` and `ariaErrorMessageElements = [error]` (F10, and F10m without any shadow DOM), Chromium exposes an `errormessage` relation. Firefox 159 and 161 report zero `RELATION_ERRORMSG` targets, but one target when the same-tree ID attribute is used (F10n). axe 4.14.1 flags `aria-valid-attr-value` on F10n and F10m ("aria-errormessage … must use a technique to announce the message"). The description route (F2, F12) is the one observed in three engines. WebKit exposes `invalid: "true"` for F10, but the inspector protocol has no relation for it.

### 2.4 Q2: what each observation method sees

| Method | Engines | Sees | Cannot see |
|---|---|---|---|
| CDP `Accessibility.getPartialAXTree` (`Runtime.evaluate` → `objectId`) | Chromium | Blink's role, name, description, `ignored`, properties and relations (`invalid`, `describedby`, `errormessage`) | — |
| WebKit inspector `DOM.getAccessibilityPropertiesForNode` (`protocol.json` of build 2388), sent through Playwright's in-process server object, `page._connection.toImpl(page).delegate._session` | WebKit (macOS and Linux) | WebCore's `role`, `label` (the name), `ignored`, `invalid`, `required`, owned or controlled or flowed node IDs | No description and no described-by or error-message relation. Depends on a private Playwright path (`coreBundle.js` `clientConnection.toImpl`) that can change in any release |
| WebDriver "Get Computed Role" and "Get Computed Label" (geckodriver 0.37.1 over Marionette, with Playwright's Firefox binary or Firefox 161) | Firefox | Gecko's role and name | Description |
| Marionette chrome context (`geckodriver --allow-system-access`) and `nsIAccessibilityService` over the remote document | Firefox | Role, name, description, DOM `id` attribute and relations (`getRelationByType`) | Needs privileged access and must start the service before the page loads (the first attempt saw no content tree) |
| Playwright 1.65.1 `ariaSnapshot`, `getByRole`, `toHaveAccessibleName`, `toHaveAccessibleDescription`, `toHaveRole` | All, same result except where DOM APIs differ | Its own JavaScript computation (`packages/injected/src/roleUtils.ts` at v1.65.1): role from the `role` attribute only (`:270-273`); name through `ariaLabelledByElements` or the attribute (`:509`); `labels` of native controls (`:887`), which is how it sees reference target in Chromium (F4) | `ElementInternals` roles and ARIA (F3b and F3c: `toHaveRole('checkbox')` receives `""`, and `getByRole('checkbox')` finds 0); `ariaDescribedByElements` and `ariaErrorMessageElements`, since the description reads only the `aria-describedby` and `aria-description` attributes (`:592-603`; F2 description `""`); labels of form-associated hosts. `ariaSnapshot` prints no descriptions (`ariaSnapshot.ts` at v1.65.1 has no description field) |
| axe-core 4.14.1 | All, identical per engine | The `label` rule fires for F0, F1, F2b, F2c, F3, F4, F4b, F5 and F5c, and passes F2, F2n, F7, F8, F8b, F10, F12, F12n and F13 | A false positive on F4 in Chromium, where the engine names the input. A false negative on F6, where every engine leaves the input unnamed. No naming rule runs for internals-only roles (F3b and F3c pass; R8 Phase 1 found the same, `docs/research/01-research-accessibility.md:206-208`) |
| AT-SPI on Linux (`at-spi2-core` 2.52, `gir1.2-atspi-2.0`, headed GTK MiniBrowser under Xvfb, sandbox off) | — | The MiniBrowser window chrome only | The web content tree never appeared on the bus in two attempts, so Linux WebKit descriptions stay unobserved |

Playwright 1.65 changes, shown by running the same fixtures on Playwright 1.64.0 (Chromium 156, Firefox 157, WebKit 27.2 build 2370) and 1.65.1:

| Fixture | 1.64.0 | 1.65.1 | Change |
|---|---|---|---|
| F2, F12 (reflected label on the inner input) | `textbox` unnamed | `textbox "Email"` | "fix(aria): honor reflected label references", microsoft/playwright#43577 (merged 2026-10-25) |
| F14 (unslotted label text) | `text: Accept terms[ ]` | `text: "[ ]"` | "Text that the browser does not render, such as text that is not assigned to a slot … is no longer part of accessible names and aria snapshots" (release notes `docs/src/release-notes-js.md:91` at v1.65.1; #43019, fixed by #43150; `roleUtils.ts:368-373`, `:1060`). Engines agree with 1.65 (F14: "[ ]" in Ch, FF, WK) |
| F3b, F14 (`internals.role = 'checkbox'`) | `getByRole('checkbox', { name: 'Accept terms' })` finds 0 | finds 0 | Unchanged: internals roles are invisible to Playwright |

The consequence for line://ui is that a test written against 1.64 that found a control by unslotted text now fails, while the engines never exposed that text. The F14 result means any control whose name comes from content, such as a checkbox or switch label, has to slot its label text to be named at all.

### 2.5 Q3: the Field event contract against C3 and C9

ARCHITECTURE §9 lists the child events `line-focus`, `line-blur`, `line-change`, `line-invalid`, `line-valid` (`docs/ARCHITECTURE.md:484`). It requires `line-focus`, `line-blur`, `line-change`, `line-invalid` of a Field-compatible control (`:493-496`) and adds `line-input` (`:498`). C3 requires the `line-` prefix, a typed `detail`, `line-change`/`line-input` for value-bearing components, and no unprefixed `input` or `change` dispatched by a component (`:1578`). C9 names exactly one commit event and says it "never fires for … a focus move" (`:1584`).

- **C9 fit.** None of `line-focus`, `line-blur`, `line-invalid` or `line-valid` is a commit event. A form-associated control is value-bearing (C4 exposes `value`, `:1579`), so its C9 commit event is `line-change`, which §9 already lists. No conflict was found [from the documents; no probe needed].
- **C3 fit.** The names carry the prefix. C3 requires a typed `detail`, and §9 states none for these four events (open question 4).
- **What native events give the Field** (probe 3.6, identical in Chromium, Firefox and WebKit on macOS and Linux). A light-DOM Field listening on itself observed the following from (a) a form-associated host with an inner `<input>`, (b) a slotted native `<input>` and (c) a slotted native `<select>`:

| Event | (a) Form-associated host, inner `<input>` | (b), (c) Slotted native control | `composed` |
|---|---|---|---|
| `focus`, `blur` | Capture phase, target = host | Capture phase, target = control | true |
| `focusin`, `focusout` | Capture and bubble, target = host | Capture and bubble | true |
| `beforeinput`, `input` | Capture and bubble, target = host | Capture and bubble | true |
| `change` | **Not received** (the inner input's `change` stays in the shadow root) | Capture and bubble | false |
| `invalid` (from `checkValidity()` or `requestSubmit()`) | Capture phase, target = host | Capture phase | false (does not bubble) |

- **`line-focus` and `line-blur`.** These events duplicate `focusin` and `focusout`, which every control already delivers to the Field [observed]. `:focus-within` on the Field matched while the form-associated control or the native control had focus, in all three engines (probe 3.6).
- **`line-invalid`.** The platform `invalid` event already reaches a capture listener for both kinds of control, but it fires only on `checkValidity()`, `reportValidity()` and form submission ([HTML, check validity steps](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#check-validity-steps)). It does not fire when validity changes.
- **`line-valid`.** The platform has no `valid` event. A control whose validity flips without user input, for example through `custom-validity` (C4, `:1579`) or A2UI checks, gives a native-only Field nothing to react to. Plan §5.7 already lists `line-valid` missing from the Field-compatible list (`docs/plans/02-plan-essential-forms.md:440`).
- **Unprefixed events from a shadow root.** The inner input's `input` and `beforeinput` events are composed and reach the light DOM with the line host as their target. The component does not dispatch them, but a consumer listening for `input` on `<line-input>` receives them. C3's wording covers only what a component dispatches (`:1578`); R1 owns the machine events, and this note flags the consumer-visible effect only (§6 item 6).

### 2.6 Q4: native controls inside Field

- ARCHITECTURE §16.2 tells consumers who want the native mobile picker to "use a native `<select>` with `<line-field>` — the Field accepts any form control via slot" (`docs/ARCHITECTURE.md:1460`). MANIFESTO Principle 3 says the Field "accepts any control via slot" (`docs/MANIFESTO.md:23`), and so does PRD principle 3 (`docs/PRD.md:132`).
- Labelling a native control is a same-tree problem. A slotted `<label for>` gave the `<select>` the name "Country" (F8); so did ID references (F8b) and the F12 reflection hand-off (F12n). The hint came through as the description in Chromium and Firefox. WebKit exposes the `<select>` as role `button`, named "Country".
- Reading state is where native and line controls differ. `:disabled` and `:enabled` match a form-associated host, including inside a disabled `<fieldset>`, as they match a native control (probe 3.7). A form-associated host matches `:read-only` always and never matches `:required` or `:optional`, while a native `<input required readonly>` matches both pseudo-classes. Field cannot read `required` or `readonly` uniformly through pseudo-classes, and ARCHITECTURE §14.8 already makes `data-required` and `data-readonly` stand in for `:required` and `:read-only` (`docs/ARCHITECTURE.md:1226-1227`).
- Validity reads work on both. `control.validity.valueMissing` read `true` for the form-associated host and the native input once both were invalid (probe 3.6). `x-field:has(:invalid)` matched the Field around a form-associated host, a native `<input>` and a native `<select>` in all three engines, from the moment they became invalid.

### 2.7 Q5: `data-error` vs `data-invalid`

| Attribute | Where the documents put it | Meaning there |
|---|---|---|
| `data-invalid`, `:state(invalid)` | The control: ARCH §14.8 (`docs/ARCHITECTURE.md:1183`, `:1230`), C4 (`:1579`), Button (`docs/specs/0002-button.md:111`) | The control's validity is invalid, including external `custom-validity` |
| `data-error`, `:state(error)` | Field host (`docs/ARCHITECTURE.md:480`); the generic "error" machine state (`:1238`, "Replaces native: --") | Field: "error message — visible in error state" (`:478`) and "`<line-field error>` overrides everything" (`:483`) |
| `data-error`, `:state(error)` | Avatar (`docs/specs/0009-avatar.md:293`, `:534`) | The image fired `error` for its `src` |

- Two different facts, two names. A control can be invalid before the user has touched it, for example an empty `required` field on first render. A Field normally shows its error only after interaction or when an explicit `error` is set. Plan §5.5 already makes the error-after-interaction state a spec question, because `:user-invalid` is not usable on a form-associated custom element (`docs/plans/02-plan-essential-forms.md:409`).
- What consumers can already select (probe 3.6, all engines): `x-field:has(:invalid)`, `:has(:state(invalid))` and `:has([data-invalid])` match from the moment the control is invalid. `x-field:has(:user-invalid)` matched only the native controls after interaction in Chromium and WebKit. In Firefox it also matched the form-associated host, as below.
- **`:user-invalid` on a form-associated host.** Firefox 159 and Firefox 161 match `:user-invalid` on a form-associated host as soon as `setValidity` makes it invalid, with no interaction and no submit (probe 3.6 and the Firefox 161 WebDriver check). Chromium 159 and WebKit 27.2 never match it. This matches the unconfirmed Mozilla bug 1910571 ("css pseudo element user-valid/user-invalid set wrongfully when ElementInternals.setValidity is called"). HTML does not define `:user-invalid` for form-associated custom elements yet (whatwg/html#9639, open). The plan's "never matches" (`docs/plans/02-plan-essential-forms.md:264`, `:409`, `:514`) holds in two engines (§6 item 4; R2 owns the topic).
- Name collision. `data-error` on Avatar means a load failure, and on Field it means a shown validation error. Both follow ARCH §14.8's single "error" row, which gives no meaning per component. A consumer selector such as `[data-error]` without a tag matches both [INFERENCE].
- The Field's `error` prop and the control's validity can disagree. ARCH §9 says the explicit `error` "overrides everything" (`:483`), but it does not say whether it reaches the control's validity or `aria-invalid`. If it is visual only, the Field shows an error while the form still submits and the control's role element is not `aria-invalid` [INFERENCE from the documents]. C4 puts external validity on the control (`custom-validity`, `:1579`).

### 2.8 Firefox content-process crash (Mozilla bug 2090055)

- **Repro.** A page with `<input>` whose `ariaLabelledByElements` is set, a main-world read of that property (`page.evaluate`), then any Playwright ARIA computation (`ariaSnapshot`, `getByRole`). This crashed the Firefox 159 content process ("Page crashed") on every run on macOS and on Linux aarch64. Without the main-world read it passed, and Chromium 159 and WebKit 27.2 passed both ways (probe 3.8).
- **With axe.** `@axe-core/playwright` 4.14.1 on the F12 fixture, followed by `getByRole('textbox', { name: 'Email' })`, crashed Firefox in either order. Chromium and WebKit passed with zero violations.
- **Cause.** Firefox writes through a null pointer when an ARIA reflection property is read from a second JS world ("Crash in Element::GetAttrAssociatedElementsForBindings when an ARIA element reflection property is read from two JS worlds", Mozilla bug 2090055, `RESOLVED FIXED`, `cf_status_firefox163: fixed`, so Mozilla's own release with the fix is Firefox 163). Playwright 1.65 began reading `element.ariaLabelledByElements` in its utility world (#43577), which exposed it. Playwright issue #43967 was closed on 2026-11-09 with "Should be fixed in the next FF roll", and #44135 (axe then `getByLabel`) was closed as its duplicate. Playwright 1.65.1's Firefox build 1572 still crashes (probe 3.8).
- **When it ends for Playwright.** "feat(firefox): roll to r1575" (microsoft/playwright#43982) merged on `main` on 2026-11-10. On 2026-11-16 the Playwright bot reported on #44135 that the crash reproduces with Playwright 1.65.0 and 1.65.1 (Firefox build 1572) and passes with build 1575 and with `main`'s build 1578: "The fix is not in the latest stable release, 1.65.1. It is on the 1.66 development branch." The crash ends for line://ui with the first Playwright release that ships Firefox build 1575 or later, expected to be 1.66 [INFERENCE from that comment]. This note did not run builds 1575 or 1578.
- **Why it matters here.** The bug also crashes with a plain `aria-labelledby` attribute, as the #43967 and #44135 reports show. Phase 2 adds a Field that labels through `aria-labelledby` or reflection, plus the existing axe tier (Phase 1 spec §10 SD78). Until the repo moves to a Playwright release with Firefox build 1575 or later, a Firefox test that runs axe and a role locator on the same page crashes. The first run of this note's probe crashed the same way, until the main-world read-backs moved to a second page (§3.3).

### 2.9 Linux WebKit vs macOS WebKit

Of the 245 values compared between macOS and Linux across the three engines (§3.4; 94 of them WebKit), two differ, both WebKit. With `internals.role = 'textbox'` on the host, Linux WebKit marks the inner `<input>` `ignored`, while macOS WebKit keeps it as an unnamed textbox (F3, F5c). The CI runners are x86_64 Linux. These probes ran on aarch64 Linux in `mcr.microsoft.com/playwright:v1.65.1-noble`, so an x86_64 difference is not excluded [not observed].

## 3. Probes

### 3.1 Environment

- macOS 27.2.1 (26B131), arm64. Playwright 1.65.1 from the worktree's `node_modules` (installed with `HOME=/tmp/emptyhome bun install --frozen-lockfile`, Bun 1.4.5), run with Node 22.23.5 (`/tmp/node-v22.23.5-darwin-arm64`). Browsers from `~/Library/Caches/ms-playwright` (chromium-1255, firefox-1572, webkit-2388).
- Linux: `docker run --rm --cpus 2 --memory 1g -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` on `mcr.microsoft.com/playwright:v1.65.1-noble` (digest `sha256:1507cbfc550a…`, aarch64, WebKit build 2388), with the worktree mounted read-only at `/repo`. The container's Node 26.13.1 ran the repo's Playwright 1.65.1 JS through `createRequire('/repo/package.json')`; nothing was installed into the container, except the AT-SPI attempt (§2.4), which installed `at-spi2-core` and `gir1.2-atspi-2.0` with `apt-get` in a throwaway container.
- Firefox engine tree: geckodriver 0.37.1 (`geckodriver-v0.37.1-macos-aarch64.tar.gz`, SHA-256 `d02b3f70…a4f5`) with Playwright's Firefox 159 binary and with Firefox 161.0 stable. Chrome 158.0.8127.37 stable through Playwright `channel: 'chrome'`. Playwright 1.64.0 from npm in a scratch directory, with its own cached browsers, for the comparison in §2.4.
- `@mdn/browser-compat-data` 8.1.11 and `@zag-js/{checkbox,switch,radio-group,select,slider,number-input,editable,toggle-group,password-input,date-input}` 1.49.0 through `npm pack` in a scratch directory.
- Not run: safaridriver (Safari 27.2 is installed, but `safaridriver` reports it is not enabled, and enabling needs an administrator) and macOS AX APIs (`AXIsProcessTrusted()` is `false`). Every probe file lived in `/tmp/z18-probes` and was deleted afterwards. No dev server was needed, because the probes loaded `file://` URLs.

### 3.2 The labelling fixture (`fixture.html`)

The custom elements are defined after the markup is parsed, so every element upgrades with its attributes present. A first run that defined them first left `data-role` and `data-rt` unread, because a parser-created element runs its constructor before its attributes are set. That run is discarded.

```js
class XField extends HTMLElement {            // the Field: light DOM, slots in its own shadow root
  constructor() { super(); this.attachShadow({ mode: 'open' }).innerHTML =
    '<label part="label" id="shadowlabel">Shadow label <slot name="label"></slot></label>' +
    '<slot></slot><slot name="hint"></slot><slot name="error"></slot>'; } }
class XInput extends HTMLElement {            // a form-associated control with an inner <input>
  static formAssociated = true;
  constructor() { super(); this.internals = this.attachInternals();
    const init = { mode: 'open', delegatesFocus: true };
    if (this.hasAttribute('data-rt')) init.referenceTarget = 'inner';
    this.attachShadow(init).innerHTML = '<input id="inner" part="input">';
    this.inner = this.shadowRoot.getElementById('inner');
    if (this.hasAttribute('data-role')) this.internals.role = this.getAttribute('data-role'); } }
class XCheck extends HTMLElement {            // host role checkbox, no inner native control, toggles on click
  static formAssociated = true; /* internals.role = 'checkbox', ariaChecked toggled by a click listener, tabIndex 0 */ }
class XFwd extends XInput {                   // F12: forwards the standard reflection properties to the inner input
  get ariaLabelledByElements() { return this.inner.ariaLabelledByElements; }
  set ariaLabelledByElements(v) { this.inner.ariaLabelledByElements = v; }
  get ariaDescribedByElements() { return this.inner.ariaDescribedByElements; }
  set ariaDescribedByElements(v) { this.inner.ariaDescribedByElements = v; } }
```

The F-rows of §2.2 to §2.3 are sections of this page: F0–F8b and F14 as tabled, F10/F10n/F10m (error message), F12/F12n/F13 (hand-off), F15/F15u (hidden or unslotted error). The label is "Email", the hint "We never share it" and the error "Enter a valid email".

### 3.3 Labelling probe (`label-probe.mjs`, exit 0 on macOS and Linux; `ff-ax.py`, exit 0)

Per engine: (1) the engine tree, through CDP for Chromium and the inspector protocol for WebKit, for every target; (2) a Playwright `ariaSnapshot()` per section; (3) label clicks and the active element; (4) on a second page, main-world read-backs (`referenceTarget` support, the getter lengths, `labels`). The read-backs moved to a second page after the first full run crashed Firefox (§2.8). `ff-ax.py` ran geckodriver with `--allow-system-access`, took `computedrole` and `computedlabel` for each target, then started the accessibility service in chrome context, reloaded, and walked the content document's accessibles. A first walk without the reload saw an empty `internal frame`.

Read-backs, identical in all three engines and on Linux except where noted:

| Read-back | Chromium 159 | Firefox 159 | WebKit 27.2 |
|---|---|---|---|
| `'referenceTarget' in ShadowRoot.prototype` | true | false | false |
| F4 `shadowRoot.referenceTarget` | `"inner"` | null | null |
| F4 `internals.labels.length` / `inner.labels.length` | 0 / 1 | 1 / 0 | 1 / 0 |
| F2 inner `ariaLabelledByElements.length` / `ariaDescribedByElements.length` | 1 / 2 | 1 / 2 | 1 / 2 |
| F2b inner `ariaLabelledByElements.length` (sibling tree) | 0 | 0 | 0 |
| F2n inner `ariaLabelledByElements.length` (enclosing shadow root) | 1 | 1 | 1 |
| F3c `internals.ariaLabelledByElements.length` | 1 | 1 | 1 |
| F5, F5b, F6 `internals.labels.length` | 1 | 1 | 1 |
| `'ariaDescription' in ElementInternals.prototype` | true | true | false |
| F12 host `aria-labelledby` attribute (after the forwarded write) | null | null | null |

### 3.4 Linux vs macOS WebKit

`linux-label.json` against `mac-label.json` covered the read-backs, aria snapshots, label clicks and engine trees, all fixtures: identical except F3 and F5c inner `ignored` (§2.9). The events (3.6), pseudo-class (3.7), attribute-clobber (3.5) and crash (3.8) probes gave identical results on Linux in all three engines. The Linux Chromium and Firefox results were also identical to macOS.

### 3.5 Attribute writes against reflection (`clobber.mjs`, exit 0)

`input.ariaLabelledByElements = [l]` writes `aria-labelledby=""` in all three engines. Then `setAttribute('aria-labelledby', 'o')` gives `[#o]`, and `removeAttribute` gives `null`, in all three. `setAttribute('aria-labelledby', '')` gives `[]` in Chromium, `null` in Firefox and `[l]` in WebKit. Identical on Linux.

### 3.6 Events and validity (`events-probe.mjs`, `ui.mjs`, `fw.mjs`, exit 0)

`events.html` has a `<form>` with three Fields around a form-associated host (`x-input`, inner `<input>`, `setFormValue` on `input`), a native `<input required>` and a native `<select required>`. Each Field logs eight event types in capture and bubble phases. The steps were: click the host, type, Tab to the native input, type, Tab to the select, `selectOption`, click outside, make all three invalid and call `checkValidity()`, then `requestSubmit()`. The results are the §2.5 table. After `requestSubmit()` nothing submitted and focus moved to the form-associated host's inner input (the validation anchor) in all engines. `ui.mjs` isolates `:user-invalid` on the form-associated host in four scenarios (invalid only; typed and blurred; submit only; both): Firefox `true` in all four, Chromium and WebKit `false` in all four. Firefox 161 through WebDriver: `false` before `setValidity`, `true` after.

### 3.7 Pseudo-classes (`pseudo.mjs`, exit 0)

In `<fieldset disabled>`, `<x-in required readonly>` matched `:disabled :read-only` and `<input required readonly>` matched `:disabled :read-only :required`. Outside it, a bare `<x-in>` matched `:enabled :read-only` and a bare `<input>` matched `:enabled :read-write :optional`. Identical in all three engines and on Linux.

### 3.8 Crash and axe (`ffcrash.mjs`, `axecrash.mjs`, `axe-sections.mjs`, `pwcompare.mjs`)

| Probe | Chromium 159 | Firefox 159 | WebKit 27.2 |
|---|---|---|---|
| Main-world read of `ariaLabelledByElements`, then `ariaSnapshot()` (3 runs macOS, 1 Linux) | passes | "Page crashed" every run | passes |
| No main-world read | passes | passes | passes |
| axe 4.14.1 then `getByRole`, and the reverse | passes, 0 violations | "Page crashed" both orders | passes, 0 violations |
| axe per section | §2.4 row | same | same |
| Playwright 1.64.0 vs 1.65.1 | §2.4 table | same | same |

## 4. Fit with line://ui

- **MANIFESTO Law 4 and Principle 3** (`docs/MANIFESTO.md:45`, `:23`). The F12 hand-off imports nothing. The Field writes standard DOM properties on whatever sits in its default slot, and a native control needs no line code. A host-role or reference-target route also imports nothing, but each needs every control built a particular way.
- **MANIFESTO Law 3** (WCAG 2.1 AA, axe zero violations, `:43`). axe passes F12 and gives a false positive on reference target (F4) and a false negative on a wrapping label (F6), so zero violations do not prove a name (as R8 Phase 1 found for internals roles). The engine-tree methods in §2.4 are the only check that reads what assistive technology gets.
- **ARCHITECTURE §17.2 C5** (`:1580`). C5 puts the name on the element that carries the role; F12 is the same rule applied to references instead of strings. Phase 1 put the role on an inner native element for interactive components (`docs/specs/01-spec-core-primitives.md:2414`, SD31), which is the configuration where host IDs, host reflection and `<label for>` fail (F1, F2c, F5).
- **ARCHITECTURE §14.8.** The state table already treats `required`, `readonly` and `invalid` as reflected states (`:1226-1230`). Probe 3.7 shows why `required` and `readonly` need them on a form-associated host.
- **PRD §1.7 browser target** (`docs/PRD.md:163`). Element reflection is inside it; reference target is not.
- **Phase 2 plan §5.3** (`docs/plans/02-plan-essential-forms.md:291-296`). Every claim above was probed in Chromium, Firefox and WebKit, with WebKit also on Linux. WebKit descriptions are the gap (§2.4).

## 5. Recommendations

These are inputs to the post-research revision and the Phase 2 spec (plan §10 steps 4 and 5). They are not decisions.

1. **Labelling mechanism: element reflection on the element that carries the role (recommended).** Use `ariaLabelledByElements` to the slotted light-DOM label, and `ariaDescribedByElements` to the hint and, while shown, the error. It is the only route observed in three engines (F2, F2n, F12), and it does not depend on reference target shipping. Alternatives:
   - (b) Reference target as the mechanism. Chromium only (§2.1), and it does not forward the host's own `aria-describedby` (F4), so the description still needs reflection.
   - (c) A host role through `ElementInternals`. It works in three engines only where the host is the sole role element (F3b, F3c). It duplicates the textbox where an inner `<input>` exists (F3, F5c), departs from SD31, and Playwright and axe cannot see it.
   - (d) String copy, as Button does (F7). Three engines, but static text, so it needs observers for label changes and loses rich content.
   - (e) ID references on the host (F1). Fails in all three engines unless the control resolves the IDs itself, which is the IconButton D1 option (b) pattern (`docs/specs/0003-icon-button.md:368`). The host is then also named as a `generic`.
2. **Hand-off through the standard properties on the slotted control (recommended).** The Field writes `control.ariaLabelledByElements` and `control.ariaDescribedByElements`. A native control consumes them directly, and a line control overrides the two accessors and forwards them to its role element (F12, F12n). Alternatives:
   - (b) The Field writes ID attributes and the control resolves them in its root node. This needs IDs on the label, hint and error, and leaves a named `generic` host.
   - (c) A line-specific property such as `fieldLabelElements`. A native control would ignore it, so the Field would need two code paths.
   Under any option, the control's own rendering (Lit, Zag `spreadProps`) must not write `aria-labelledby` or `aria-describedby` on the role element, and must not leave those keys in the spread props as `undefined`, because `spreadProps` removes such a key on every spread after the first (§2.3).
3. **Error description (recommended).** Add the error element to the described-by list only while the Field shows an error, and remove it otherwise (F15, F15u). Hiding it is not enough in Chromium or Firefox. Alternative: `ariaErrorMessageElements` with `aria-invalid`. Firefox does not expose that relation through reflection (F10, F10m), and axe flags `aria-errormessage` without an announcement technique.
4. **Label activation (recommended).** When the label slot holds a `<label>`, point its `for` at the control. Native activation then focuses the inner input of a form-associated host and toggles a host-role control in three engines (F4, F5, F5b, F6). Keep the Field's own click-to-`.focus()` forwarding (`docs/ARCHITECTURE.md:487`) for non-`<label>` content only. Alternative: forwarding alone, as §9 states. A forwarded `.focus()` does not toggle a checkbox, and with a `<label>` present both paths run. A cost of `<label for>`: it also names the `generic` host in Chromium and Firefox (F13).
5. **Event contract (recommended).** Detect state from native events for every control: focus from `focusin` and `focusout` (with `relatedTarget` containment to tell when focus leaves the Field), value from `input` and `line-change` or native `change`, and validity from `invalid` in the capture phase plus a re-read of `control.validity` after each of these. Keep one `line-` event for validity changes that no user event signals (external `custom-validity`, A2UI checks), so a Field can clear its error. `line-focus` and `line-blur` add nothing that `focusin` and `focusout` do not deliver (§2.5). Alternatives:
   - (b) Keep the §9 list as required emits. Native controls can never satisfy it (§2.6).
   - (c) Keep both, the line events optional and the native ones authoritative.
6. **`data-error` and `data-invalid` (recommended).** Keep two attributes with two meanings. The control's `data-invalid` reflects validity (C4, §14.8). The Field's `data-error` reflects a shown error: an explicit `error` prop, or invalid after interaction per R2. Alternatives:
   - (b) The Field also mirrors `data-invalid` from its child. Consumers can already select that with `:has()` (§2.7).
   - (c) A single name for both.
   Avatar's `data-error` keeps its own meaning under every option.
7. **Browser-tier assertions (recommended).** Assert names and descriptions through engine trees: CDP in Chromium, WebDriver plus the accessibility service in Firefox, and the inspector protocol in WebKit. Playwright's computation cannot see descriptions set by reflection or internals roles (§2.4). Alternatives:
   - (b) CDP in Chromium only, with Playwright snapshots elsewhere. This misses Firefox and WebKit divergence: F4, F15u and F10 differ by engine.
   - (c) A manual screen-reader pass per spec.
   Until the repo moves to a Playwright release whose Firefox is build 1575 or later (expected 1.66; §2.8), a Firefox test must not combine a main-world read of the reflection properties, or an axe scan, with a role locator on the same page.

## 6. Contradictions and gaps

PROCESS §2 sends research that contradicts the plan back to the plan and the PRD before spec work (`docs/PROCESS.md:50-51`). Each item is flagged and left unresolved.

1. **ARCHITECTURE §9, `docs/ARCHITECTURE.md:487`.** "An `aria-labelledby` ID reference on the child host does not reach a role on an inner native element in Firefox or Safari." It does not reach it in Chromium either (F1, in all three engines). "It works only with a host role, a reference target (Chrome only) or element reflection": a host role names the host but leaves the inner native element unnamed (F3, F5c). A reference target does not make an `aria-labelledby` written on the host reach the inner element, even in Chromium (F4b). It forwards references that point at the host, such as `<label for>` (F4).
2. **ARCHITECTURE §9 Field-compatible controls, `:493-496`, against ARCHITECTURE §16.2, `:1460`, MANIFESTO Principle 3, `docs/MANIFESTO.md:23`, and PRD principle 3, `docs/PRD.md:132`.** §16.2 and both principles put a native `<select>` (any control) inside `<line-field>`. A native control is not a `formAssociated: true` custom element and emits none of `line-focus`, `line-blur`, `line-change` or `line-invalid`. Under §9 as written, the native `<select>` that §16.2 recommends is not Field-compatible.
3. **ARCHITECTURE §9, `:484` against `:494`.** `line-valid` is a child event but not part of the Field-compatible contract. This is already plan §5.7 (`docs/plans/02-plan-essential-forms.md:440`); the probe adds that no native event signals a validity change (§2.5).
4. **Plan §5.1 R2, §5.5 and §8 (`docs/plans/02-plan-essential-forms.md:264`, `:409`, `:514`).** "`:user-invalid`, which never matches a form-associated custom element" holds in Chromium 159 and WebKit 27.2. Firefox 159 and 161 match it on a form-associated host as soon as it is invalid, with no interaction (§2.7). The risk stands, but its stated cause differs by engine. R2 (row 01-Z17) owns the topic.
5. **ARCHITECTURE §14.8 `error` row, `:1238`, with §9 `:480` and Avatar `docs/specs/0009-avatar.md:293`.** One state name carries two meanings: a shown validation error on Field, and an image load failure on Avatar (§2.7).
6. **ARCHITECTURE §17.2 C3, `:1578`.** "No component dispatches an unprefixed `input` or `change` event." No component dispatches one, but the composed `input` and `beforeinput` of an inner native `<input>` reach consumers on the host in all three engines (§2.5). R1 (row 01-Z16) owns the machine events.
7. **Gap, not a contradiction: ARCHITECTURE §9 `:483`.** "`<line-field error>` overrides everything" does not say whether the explicit error reaches the control's validity or `aria-invalid` (§2.7).

The ledger row's facts hold: reference target is Chromium-only, and `ariaLabelledByElements` works in all three engines toward ancestor trees only (F2, F2b, F2n), so the row text needs no change.

## 7. Open questions for the post-research revision and the Phase 2 spec

1. **Mechanism.** Which labelling mechanism does ARCHITECTURE §9 name: element reflection, reference target, a host role, string copy or host IDs (§5 item 1)? Evidence: §2.2, §2.4, contradiction 1.
2. **Hand-off API.** Standard reflection properties overridden by each line control, ID attributes resolved by the control, or a line-specific property (§5 item 2)? How does a control keep Lit and Zag `spreadProps` from writing or removing `aria-labelledby` and `aria-describedby` on its role element, including the `undefined` key that `spreadProps` removes on every spread after the first (§2.3)? For Zag machines with a label part, does the component render that part, so that Zag wires its own `aria-labelledby`, or leave it out and take the Field's reference?
3. **Label element.** Does the Field require or create a `<label>` in its label slot and set `for`, or forward clicks itself (§5 item 4)? Is the named `generic` host that `<label for>` leaves in Chromium and Firefox (F13) acceptable? That last question needs a screen-reader pass.
4. **Event contract.** Which events must a Field-compatible control emit, given contradiction 2 and §2.5? Do `line-focus` and `line-blur` stay? What `detail` type does each carry (C3)? Do they bubble, or bubble and compose (C9 leaves `composed` to the spec, `:1584`)?
5. **Validity without user input.** What event, if any, tells the Field that validity changed through `custom-validity` or A2UI checks (C4), so `line-valid` or its replacement can clear the error?
6. **Explicit error.** Is `<line-field error>` visual only, or does it set the control's validity and `aria-invalid` (contradiction 7)?
7. **State names.** `data-error` and `data-invalid`: two meanings, a mirror, or one name (§5 item 6)? And does Avatar's `data-error` keep its meaning (contradiction 5)?
8. **Uniform reads.** Which property names do line controls expose so the Field reads `required`, `readOnly`, `disabled` and `value` the same way from native and line controls (§2.6)? `:disabled` already works for both.
9. **Reference target later.** Does line://ui adopt reference target as an enhancement once Firefox (bug 1952585) and WebKit (standards-positions#356) ship it? The host's own attributes still would not forward (F4b).
10. **Host roles.** Do custom-machine controls with no inner native control (a host-role checkbox) take their role from `ElementInternals` (F3b, F5b), against SD31's inner-native rule? Neither axe nor Playwright can verify such a role.
11. **Test tier.** Which engine-tree method becomes the Browser-tier assertion, and is the private WebKit path in §2.4 acceptable? WebKit descriptions remain unobserved by every method tried (§2.4). How do the Firefox tests avoid bug 2090055 until the repo takes a Playwright release with Firefox build 1575 or later (expected 1.66; §2.8, §5 item 7)?
12. **Unslotted text.** Must every control whose name comes from content slot its label text, given Playwright 1.65 and the engines (F14)?
13. **Linux WebKit.** The F3 and F5c `ignored` difference (§2.9) matters only under a host role on a control that keeps an inner `<input>`. Does it need an x86_64 CI check?

## 8. Sources

All retrieved 2026-11-26.

- HTML, reflecting content attributes in IDL attributes (attr-associated elements): https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes
- HTML, check validity steps: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#check-validity-steps
- HTML, custom elements and `ElementInternals`: https://html.spec.whatwg.org/multipage/custom-elements.html
- Accessible Name and Description Computation, hidden but referenced: https://w3c.github.io/accname/#comp_hidden_not_referenced
- whatwg/dom#1353: https://github.com/whatwg/dom/pull/1353
- whatwg/html#10995: https://github.com/whatwg/html/pull/10995
- whatwg/html#9639 (`:user-invalid` for form-associated custom elements): https://github.com/whatwg/html/issues/9639
- Mozilla standards position #1035: https://github.com/mozilla/standards-positions/issues/1035
- WebKit standards position #356: https://github.com/WebKit/standards-positions/issues/356
- Firefox bug 1952585 (reference target): https://bugzilla.mozilla.org/show_bug.cgi?id=1952585
- Firefox bug 2090055 (reflection read from two worlds): https://bugzilla.mozilla.org/show_bug.cgi?id=2090055
- Firefox bug 1910571 (`:user-invalid` on form-associated custom elements): https://bugzilla.mozilla.org/show_bug.cgi?id=1910571
- Chrome Platform Status, Reference Target: https://chromestatus.com/feature/5188237101891584
- Playwright release notes v1.65.1: https://github.com/microsoft/playwright/blob/v1.65.1/docs/src/release-notes-js.md
- Playwright `roleUtils.ts` v1.65.1: https://github.com/microsoft/playwright/blob/v1.65.1/packages/injected/src/roleUtils.ts
- Playwright `ariaSnapshot.ts` v1.65.1: https://github.com/microsoft/playwright/blob/v1.65.1/packages/injected/src/ariaSnapshot.ts
- microsoft/playwright#43019, #43150, #43577, #43967, #44135: https://github.com/microsoft/playwright/issues/43019, https://github.com/microsoft/playwright/pull/43150, https://github.com/microsoft/playwright/pull/43577, https://github.com/microsoft/playwright/issues/43967, https://github.com/microsoft/playwright/issues/44135
- microsoft/playwright#43982 ("feat(firefox): roll to r1575", merged 2026-11-10) and the bot comment on #44135 (2026-11-16): https://github.com/microsoft/playwright/pull/43982, https://github.com/microsoft/playwright/issues/44135
- WebKit inspector protocol, `DOM.getAccessibilityPropertiesForNode` (`protocol.json` in Playwright WebKit build 2388)
- geckodriver 0.37.1: https://github.com/mozilla/geckodriver/releases/tag/v0.37.1
- WebDriver, Get Computed Role and Get Computed Label: https://w3c.github.io/webdriver/#get-computed-role
- `@mdn/browser-compat-data` 8.1.11: https://www.npmjs.com/package/@mdn/browser-compat-data
- `@zag-js/*` 1.49.0 tarballs (`npm pack`): https://registry.npmjs.org/
- Playwright container image: `mcr.microsoft.com/playwright:v1.65.1-noble`
