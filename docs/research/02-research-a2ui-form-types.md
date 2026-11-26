# Research: A2UI form types and `@a2ui/web_core` 0.16 (R6)

**Row:** `01-Z21` (Phase 2 plan §5.1 R6, §5.2; decisions O3 (b) and O7 (a))
**Date:** 2026-11-26
**Repo sources:** `docs/plans/02-plan-essential-forms.md` §1, §2.3, §2.4, §4.3, §5.1 R6, §5.2, §5.3, §5.5, §5.7, §7.2, §8, §11; `docs/PRD.md` (v0.8.36) §2, §7.4, Appendix D; `docs/ARCHITECTURE.md` (v0.8.28) §7, §14.8, §17.2–§17.4, §17.7; `docs/MANIFESTO.md` Principle 8, Laws 7–9, Out of Scope; `docs/specs/01-spec-core-primitives.md` §10 SD6, SD43, SD44, §12 AM-073, AM-081, AM-083, AM-084; `docs/specs/0002-button.md`; `docs/research/01-research-a2ui-web-core.md`; `packages/line-genui/src/**`, `packages/line-genui/__tests__/**`; `apps/storybook/stories/agent-ui/a2ui-fixtures.ts`. Repo locators hold at `origin/main` `9c9b1f4`; the branch adds only the ledger flip.
**Upstream sources:** `a2ui-project/a2ui` at commit `36725ee` (2026-11-26, shallow clone): `catalogs/basic/{v0_9_1,v1}/catalog.json`, `specification/{v0_9_1,v1_0}/json/*.json`, `specification/{v0_9_1,v1_0}/docs/*.md`. `@a2ui/web_core` 0.14.0, 0.15.0, 0.16.0 and 0.16.1 from `npm pack` (sha256 in §7).
**Toolchain:** the row 01-Z14 baseline: Bun 1.4.5 (`/tmp/bun145`), Node 22.23.5 (`/tmp/node-v22.23.5-darwin-arm64`), Playwright 1.65.1 with Chromium 159.0.8154.6, Firefox 159.0 and WebKit 27.2 build 2388, on macOS 27.2.1 (arm64); Linux WebKit build 2388 (aarch64) in `mcr.microsoft.com/playwright:v1.65.1-noble`. `HOME=/tmp/emptyhome bun install --frozen-lockfile`; `bun --filter './packages/*' build` exit 0.
**Status:** Evidence. Research carries no rules (`docs/PROCESS.md` §1). Recommendations are marked "(recommended)"; every decision is an open question in §6. Findings that contradict or extend the plan, PRD, ARCHITECTURE or MANIFESTO are flagged in §5 and left unresolved (PROCESS §2).

> **TL;DR**
>
> - **The five types changed little between v0.9.1 and v1.0.** CheckBox, ChoicePicker and DateTimeInput keep their properties and gain only `weight`. TextField gains `placeholder`, drops `validationRegexp` and requires `value`. Slider gains `steps`, an integer ≥ 1 that counts divisions. The rest of the change is in the envelope: `checks` → `@checks`, `accessibility` → `@accessibility`, `path` → `@path`, `call` → `@call`, wire version `"1.0"`, and check results that may be a `ValidationResult` with `severity`. `web_core` 0.16.1 enforces all of these; 0.14.0's v1.0 is a pre-final shape (wire `"v1.0"`, bare `checks`) and cannot serve final v1.0 (P1).
> - **`web_core` computes the validity; the surface only has to carry it.** On both versions each Checkable node gets `isValid`, `validationErrors` (messages of failing `error`-severity rules) and `validationResults` (every failing rule, warnings included). A v1.0 warning leaves `isValid` true. A `required` check on an empty value is invalid from the first render, before any interaction (P1). C4 has a path for this (an external-validity attribute and the Field `error` slot), but ARCHITECTURE wraps only TextField in `<line-field>`, and the agent `Button` ignores its checks today, while A2UI says a Button with a failing check is disabled (P6).
> - **The Phase 1 binding contract does not meet A2UI two-way binding.** A2UI v0.9.1 and v1.0 require the renderer to write the value to the data model "immediately" on each keystroke. The surface writes back only on the descriptor's one commit event (`line-change` under C3/C9) and writes the element's raw property. That raw write breaks ChoicePicker, whose value is a string list while a radio group or single toggle group holds one string. `web_core` stores whatever it is given (P1).
> - **The host-form hazard is real for every form-associated element the surface creates, Button included.** The surface renders into its light DOM, so an agent control under a host `<form>` joins it. The control is listed in `form.elements`, its named value goes into `FormData`, its failed C4 validity blocks the host's submission, and `form.reset()` resets it. Today's agent `<line-button>` is already in the host's `form.elements` (P6). A `form=""` attribute set when the surface creates the element leaves it with no form owner in Chromium, Firefox, macOS WebKit and Linux WebKit. That opt-out holds from before upgrade, survives a reparent, and keeps element-level validity (`:invalid`, `willValidate`, `validationMessage`) intact. A host `<fieldset disabled>` still disables the control (P6).
> - **Moving the pin to 0.16.1 breaks 17 of 571 `line-genui` unit tests on the v0_9 path and no types.** A real pin edit plus install fails one more, the exact-0.14.0 pin assertion, for 18. The 17 fall into three classes. Every rejected message is reported twice (0.15.0+). A component's own `catalogId` no longer routes on a v0.9 surface (0.16.0+), so the shipped Storybook Alert fixture breaks. A nested `openUrl` call with a mismatched `returnType` is now rejected at validation (0.16.0+). On 0.16.1, `getRendererDataModel()` also throws once `sendDataModel` surfaces mix `v0.9` and `v0.9.1`, and `BASIC_FUNCTIONS` grows from 14 to 25 functions. The surface bundle grows by 8.0 kB gzipped (P2, P5, P8).
> - **A v1.0 `line` catalog needs schemas per protocol version and its own catalog id.** Today's descriptors under a v1.0 `Catalog` emit JSON that validates against v1.0 `catalog_definition.json`. Yet the same catalog rejects `{"@path": …}` at run time and accepts the v0.9 `{path: …}`, because the Zod schemas are v0.9 ones. Two catalogs under one id in one processor leave v1.0 surfaces on the v0.9 catalog (P3, P4).
> - **A form-sized surface is cheap.** 40 and 200 rows of Text and Button rendered in 20–68 ms in every engine, Linux WebKit included. In `web_core`, a keystroke on one of 200 bound and checked TextFields cost 0.010–0.019 ms (P1, P6).

---

## 1. Question

Plan §5.1 R6: "The five basic types at v0.9.1 and v1.0: value binding, `checks`/`@checks` to C4 validity, ChoicePicker variants, TextField variants (`longText`, `obscured`, `number`), Slider `steps`; the host-form hazard of every surface-created form control, weighed against MANIFESTO Law 7 ('native `<form>` semantics is the only contract', `docs/MANIFESTO.md:51`) and C4 validity; the v1.0 catalog shape and `@a2ui/web_core` 0.16.x breaking changes on the v0_9 path (per O3)" (`docs/plans/02-plan-essential-forms.md:268`). Plan §8 adds a measurement of a form-sized surface (`:519`), and §5.5 lists the time-only DateTimeInput (`:411`).

- **Q1** What do TextField, CheckBox, ChoicePicker, Slider and DateTimeInput carry at v0.9.1 and v1.0, and how does each value bind?
- **Q2** How do `checks` and `@checks` evaluate, and how can the result reach a control through C4?
- **Q3** What do the variants (ChoicePicker `variant` × `displayStyle` × `filterable`; TextField `variant`; Slider `steps`; DateTimeInput `enableDate`/`enableTime`) ask of the line targets?
- **Q4** What happens when a surface-created form control sits inside a host `<form>`, and which rules can the Phase 2 spec state?
- **Q5** What shape do the v1.0 `line` and `basic` catalogs take?
- **Q6** What do `web_core` 0.15.0, 0.16.0 and 0.16.1 break on the v0_9 path that `line-genui` uses at 0.14.0?
- **Q7** How does a form-sized surface perform?

## 2. Findings

### 2.1 Q1: the five types and value binding

Schemas from the upstream basic catalogs at commit `36725ee`. All five types are `Checkable` on both versions.

| Type | v0.9.1 (`catalogs/basic/v0_9_1/catalog.json`) | v1.0 (`catalogs/basic/v1/catalog.json`) | Value |
|---|---|---|---|
| TextField | `label`, `value`, `variant` (`longText`, `number`, `shortText`, `obscured`; default `shortText`), `validationRegexp`; required `label` (`:525-566`) | adds `placeholder` (DynamicString), drops `validationRegexp`, requires `label` and `value` (`:419-456`) | `DynamicString` |
| CheckBox | `label`, `value`; both required (`:567-598`) | unchanged, plus `weight` (`:457-484`) | `DynamicBoolean` |
| ChoicePicker | `label`, `variant` (`multipleSelection`, `mutuallyExclusive`; default `mutuallyExclusive`), `options` (`{label: DynamicString, value: string}`), `value`, `displayStyle` (`checkbox`, `chips`; default `checkbox`), `filterable` (default `false`); required `options`, `value` (`:599-667`) | unchanged, plus `weight` (`:485-549`) | `DynamicStringList`, "bound to a string array" |
| Slider | `label`, `min` (default 0), `max`, `value`; required `value`, `max` (`:668-708`) | adds `steps`: integer, minimum 1, "the number of discrete divisions in the slider range" (`:550-591`) | `DynamicNumber` |
| DateTimeInput | `value` (ISO 8601), `enableDate`, `enableTime` (both default `false`), `min`, `max` (date, time or date-time), `label`; required `value` (`:709-798`) | unchanged, plus `weight` (`:592-678`) | `DynamicString` |

- **The protocol requires immediate write-back.** Both protocol texts state that input components "modify the … data model immediately upon user interaction", that the renderer "**immediately** updates the value at the bound `path`" when the user "types a character", and that a Text bound to the same path "must update in real-time as the user types". They also state that the binding is local and reaches the agent only through a user action (v0.9.1 `specification/v0_9_1/docs/a2ui_protocol.md:478-520`; v1.0 `specification/v1_0/docs/a2ui_protocol.md:986-1010`). v1.0 adds that a missing path is created on first write (`:995`), and its evolution guide makes TextField `value` required because without a binding "the text a user types never reaches the data model" (`specification/v1_0/docs/evolution_guide.md:62`).
- **`web_core` hands the surface a writable binding.** On a node from `NodeResolver`, a value given as a path binding is a `WritableBinding` whose `set()` writes the data model, and a literal is a read-only `ResolvedBinding` (0.16.1 `src/resolution/node-resolver.js:629-645`). P1 saw `value=Writable(…)` for all five types on v0.9, and for TextField and Slider on v1.0, in 0.14.0 and 0.16.1. After `set("Jane")` the model held `"Jane"` and the TextField's `required` check flipped to valid.
- **`web_core` does not type-check a write.** On a ChoicePicker bound to a string-list path, P1's `value.set("b")` stored the string `"b"` in the list's place without an error, in both versions. The schema rejects a string `value` in the message itself (P1: "ChoicePicker value as string → rejected").
- **The surface writes back only on commit.** The projection wires one listener per element for the descriptor's commit event and writes the element's property or attribute, raw, through the binding when it is writable (`packages/line-genui/src/a2ui/projection.ts:490-500`, `:637-663`). The binding map holds one `value: { prop, commitEvent }` (`packages/line-genui/src/catalog/descriptor.ts:132-136`; ARCHITECTURE §17.3, `docs/ARCHITECTURE.md:1592`). C3 makes `line-change` the commit event of a value-bearing component and `line-input` its live-edit event (`:1578`). For a TextField this means the data model, any Text bound to the same path and the checks would update on commit, not per keystroke. §5 item 1 flags this.
- **A raw write breaks two of the five types.** CheckBox `value` (boolean) maps to the `checked` state, not to a form `value`. ChoicePicker `value` (string list) maps to one string for a radio group or a single toggle group (O7 (a); ARCHITECTURE `:1623`). A Phase 2 basic map therefore needs a per-type adapter between the A2UI value and the element's member [INFERENCE: the Phase 2 component APIs do not exist; the shapes follow PRD §4.2 and the Zag 1.49.0 machines cited by R10].

### 2.2 Q2: `checks`, `@checks` and C4 validity

**What the schemas say.**

| | v0.9.1 | v1.0 |
|---|---|---|
| Key | `checks` (`specification/v0_9_1/json/common_types.json:248`) | `@checks` (`specification/v1_0/json/common_types.json:289`) |
| Rule | `{condition: DynamicBoolean, message}`, both required (`:233`) | `{condition: DataBinding \| FunctionCall, message?}`; a literal boolean condition is not allowed (`:273`) |
| Result | Boolean ("the function must return a boolean", `a2ui_protocol.md:603`) | `ValidationResult` `{valid, code?, message?, severity: error \| warning \| info}` (`specification/v1_0/json/catalog_definition.json:272`) or a boolean coerced to one (`a2ui_protocol.md:1112-1180`) |
| Button | "If any check fails, the button is automatically disabled" (`:625`) | Same (`:1183`) |

- **The v0.9.1 protocol example contradicts its own schema.** The example writes checks as flat `{call, args, message}` (`v0_9_1/docs/a2ui_protocol.md:605-620`), but the `CheckRule` schema requires `condition`. `web_core` 0.14.0 and 0.16.1 both reject the flat form with `checks.0.condition: Expected boolean, received undefined` (P1). The schema is what runs.
- **`web_core` evaluates the checks.** `GenericBinder.bindCheckable` subscribes each rule's condition and writes three props beside the node's own. `isValid` is false when any failing rule has severity `error`. `validationErrors` holds those rules' messages. `validationResults` holds every failing rule, warnings and info included, with `code` when given (0.14.0 `src/resolution/generic-binder.js:451-519`; 0.16.1 `:1012-1060`). P1 observed the following.
  - v0.9: a `required` check on an empty bound value gave `isValid=false` and `validationErrors=["Name is required"]` at the first render. After `value.set("Jane")` it gave `isValid=true`. A Button carrying the same check followed it, `isValid` false → true, in 0.14.0 and 0.16.1.
  - v1.0 (0.16.1): one rule bound to `{valid:false, severity:"warning"}` and one to `{valid:false, code:"X1"}` with a rule message gave `isValid=false`, `validationErrors=["Fallback message"]`, and `validationResults` holding both. The warning alone does not make the node invalid. The rule's `message` is the fallback for a result without one.
  - v1.0 (0.16.1) accepts a rule without `message`, rejects a literal `true` condition, and dual-reads a legacy bare `checks` and `accessibility` (P1; CHANGELOG 0.16.0, `CHANGELOG.md:14`).
- **The checks reach no control today.** The five types are unmapped, so each renders an inert placeholder and raises `UNKNOWN_COMPONENT_TYPE` (P6, all engines; ARCHITECTURE `:1610`). The agent Button renders `<line-button type="button">` and stays enabled while its check fails, in all four engine builds (P6). Neither the projection nor the Button descriptor reads `isValid`.
- **C4 is the documented path.** "An attribute or property sets custom validity through the `FormAssociated` mixin's `setValidity` and reflects the invalid state (`data-invalid` and `:state(invalid)`, §14.8). The visible message stays in `<line-field>`'s `error` slot, which the renderer fills" (`docs/ARCHITECTURE.md:1579`). Button sets the convention with `custom-validity` (`docs/specs/0002-button.md:160`), and plan §1.2 says it "sets the convention for the Phase 2 form controls" (`docs/plans/02-plan-essential-forms.md:62`). For the surface this means one attribute write per change of `validationErrors`, plus the Field error slot.
  - ARCHITECTURE wraps only TextField in `<line-field>` (`:1621`). CheckBox, ChoicePicker, Slider and DateTimeInput have no `error` slot to fill, though all five carry checks (§5 item 4).
  - The A2UI schemas have no `required` flag. A field required through a `required` check would show no Field required indicator and no `aria-required` unless the surface infers it from the check. The upstream reference elements set neither (no `aria-required` or `required=` in 0.16.1 `src/universal/basic_catalog/components/*.js`).
  - `web_core` reports a required-but-empty field as invalid before the user touches it (P1). The upstream reference renders `validationErrors` as soon as they exist (0.16.1 `src/universal/basic_catalog/components/accessibility.js:53-62`). How C4 and the Field error slot treat the first render meets R2's error-after-interaction question (plan §5.5, `:409`).
- **The upstream reference elements never use constraint validation.** The `web_core` 0.16.1 universal TextField, Slider and ChoicePicker set `aria-invalid` and `aria-describedby` and render error text, but call no `setCustomValidity` (0.16.1 `src/universal/basic_catalog/components/TextField.js:21-66`, `Slider.js:21-52`, `ChoicePicker.js:78-136`). They never block a form's submission. C4 goes further, because it uses `setValidity`, and that is what creates the host-form interaction of §2.4.

### 2.3 Q3: variants

**TextField.** The upstream reference maps `longText` to `<textarea>`, `number` to `type="number"` and `obscured` to `type="password"`, and otherwise renders `type="text"` (0.16.1 `TextField.js:26-31`, `:41-64`). ARCHITECTURE names the line targets (`:1621`).

| `variant` | Target (ARCHITECTURE `:1621`) | Notes |
|---|---|---|
| `shortText` (default) | `<line-input>` | v1.0 `placeholder` maps to the placeholder |
| `longText` | `<line-textarea>` | |
| `obscured` | `<line-password-input>` | The value is a cleartext string in the data model. The data model travels to the agent with each action when `sendDataModel` is set (`v1_0/docs/a2ui_protocol.md:186`, `:1097`). A browser password manager may autofill an agent-created password field on the host origin [INFERENCE: autofill was not probed; it cannot be driven headless]. R2 covers autofill through inner native inputs (plan `:264`). |
| `number` | `<line-number-input>` | The A2UI value stays a `DynamicString` on both versions, so the surface writes a string. Whether Number Input reports its raw or its formatted string is R1's question (plan `:263`). |
| v0.9.1 `validationRegexp` | — | The schema gives no semantics beyond "client-side validation". The upstream reference ignores it: the 0.16.1 TextField renders no pattern, and only the v0_8 and v0_9 schemas name the key (`src/v0_9/basic_catalog/components/basic_components.js:331`). v1.0 replaces it with `@checks` and the `regex` function (`evolution_guide.md:61`, `:173`), and since 0.16.0 that function uses an A2UI regex dialect (`'u'` flag, static ReDoS rules) (`CHANGELOG.md:24`). An HTML `pattern` attribute compiles with the `v` flag, so mapping `validationRegexp` to `pattern` would change its dialect [INFERENCE: per the HTML spec; not probed] |

**ChoicePicker.** The catalog calls `variant` and `displayStyle` "hints" (`v0_9_1 catalog.json:624`). The upstream reference behaves as follows (0.16.1 `ChoicePicker.js:36-136`).

- `mutuallyExclusive` + `checkbox` renders native radios in a `role="radiogroup"`, and `multipleSelection` + `checkbox` renders native checkboxes in a `role="group"`.
- `chips` renders `<button type="button" aria-pressed>` for both variants. A press in exclusive mode sets `[value]` and never clears it.
- `filterable` adds a text input that filters options by label.
- A string `value` is read as a one-element list. Every write is a list.
- Radios get a document-unique `name` built from the surface id, the component id and the data path, because "radio group names are document-scoped" (`:63-73`).

| `variant` × `displayStyle` | ARCHITECTURE `:1623`, O7 (a) | What the target must do |
|---|---|---|
| `mutuallyExclusive` × `checkbox` (both defaults) | `<line-radio-group>` | Adapt `[v]` ↔ `v` |
| `multipleSelection` × `checkbox` | `<line-fieldset>` of `<line-checkbox>` (O7 (a)) | The surface composes the list from N checkboxes: no single element holds the value, so no descriptor value binding fits as it stands |
| `mutuallyExclusive` × `chips` | `<line-toggle-group>` | Single mode, not deselectable, to match upstream. Zag defaults `deselectable` to `true` (R10 §2.2) |
| `multipleSelection` × `chips` | `<line-toggle-group>` multiple | `string[]` matches |
| `filterable: true` | `<line-select>` is the only listed target with search (PRD §4.2 "with search"; R4) | ARCHITECTURE lists `<line-select>` but states no rule that selects it, and no A2UI field names a select. A multiple filterable picker has no Phase 2 target; the Phase 4 Combobox refines ChoicePicker (`:1628`) |

Option labels are `DynamicString`, so each option's text is a live binding. The group `label` is optional, so the accessible name may come only from `accessibility.label` (§6 Q9).

**Slider.** v1.0 `steps` counts divisions. The upstream reference sets `step = (max − min) / steps` when `steps > 0` and `max > min`. Without `steps` it sets no `step`, so a native range uses its default step of 1, and `min` falls back to 0 and `max` to 100 (0.16.1 `Slider.js:25-31`). For the v0.9.1 Slider, which has no `steps`, the rendered step is therefore 1, so a 0–1 slider has two positions [INFERENCE: native range default step per the HTML spec; not probed]. A division count that does not divide the range writes a fractional value, for example 0–10 in 3 steps writes multiples of 3.333…; plan §5.2 records Zag 1.49 fixes to slider decimal steps. `web_core` 0.16.1 rejects `steps: 0` and `steps: 2.5` on v1.0 and rejects `steps` on v0.9 (P1).

**DateTimeInput.** Both flags default to `false` in the schema, and `web_core` passes neither as a prop when the message omits them (P1: the node has `value`, `min`, `max`, `label` only). The upstream reference reads "neither" as date only (`enableDate ?? !enableTime`, 0.16.1 `DateTimeInput.js:66-67`). It strips time zones and seconds before writing to native inputs (`:30-55`). `enableTime` alone is time-only, which has no Phase 2 target (plan §2.4, `:127-128`; §5.5 `:411`). ARCHITECTURE schedules a Phase 4 Time Picker (`:1628`).

### 2.4 Q4: the host-form hazard

**The surface puts its content in light DOM.** `<line-a2ui-surface>` has a shadow root that holds only its stylesheet, its live region and a default `<slot>` (`packages/line-genui/src/a2ui/surface.ts:37-47`, `:103`). The projected elements are light-DOM children of the host element (ARCHITECTURE "Render root | Light DOM", `:1638`). Inside a host `<form>`, every one of them is a descendant of that form (P6: `renderedInLightDom: true`, all four builds).

**A form-associated descendant joins the host form.** P6 used a minimal form-associated custom element (`x-face`), because no Phase 2 control exists yet. It also checked today's agent `<line-button>`, which is a FormAssociated element (`packages/line-components/src/button/button.ts:91`). Every row below was identical in Chromium 159, Firefox 159, macOS WebKit 27.2 and Linux WebKit 27.2.

| Case, inside `<form id="host">` | Form owner | In `host.elements` | `FormData(host)` | Effect on the host |
|---|---|---|---|---|
| Today's agent Button (`type="button"`) | host | yes | — (no name) | Clicking it fired no host `submit`. AM-081 holds |
| Named control | host | yes | `agentField=plain` | — |
| Control with `name` equal to a host field | host | yes | `hostField=h` and `hostField=collide` | The agent value is submitted beside the host's |
| Nameless control with `setValidity({customError})` | host | yes | — | `host.checkValidity()` false; `host.requestSubmit()` fired no `submit` and fired `invalid` on the control |
| Any control with the host owner | host | yes | — | `host.reset()` ran its `formResetCallback` |
| Native `<input name>`, the kind of control the upstream reference elements render into light DOM since 0.16.0 (`CHANGELOG.md:37`; 0.16.1 `src/universal/a2ui-lit-element.js:148`, which no basic element overrides) | host | yes | `agentNative=n` | — |
| `form="r6-no-such-form"` | none | no | — | `host.checkValidity()` true and `requestSubmit()` submitted while the control was invalid; no reset |
| `form=""` | none | no | — | `host.checkValidity()` true and `requestSubmit()` submitted while the control was invalid; no reset |
| Inside a DOM-created `<form method="dialog">` nested in the host | inner form | no | inner only | Host unaffected; the inner `requestSubmit()` did not navigate |
| Created before its element was defined, with `form="r6-no-such-form"` or `form=""` | none after upgrade | no (before and after) | — | The attribute set before the lazy `define()` was honoured at upgrade |
| Created before define, no `form` attribute | host after upgrade | no before, yes after | `prePlain=1` | — |
| A `form="r6-no-such-form"` or `form=""` control moved to the top of the host form | none | no | — | The opt-out survived the reparent |

- **The opt-out keeps C4 intact.** A control with no form owner kept `willValidate: true`, `internals.checkValidity(): false`, `:invalid` matching and `validationMessage: "Agent check failed"` (P6).
- **A disabled fieldset still disables it.** A host `<fieldset disabled>` disabled every control, `form=""` and nested ones included: `formDisabledCallback(true)` ran and `:disabled` matched (P6). Disabling by ancestor fieldset does not depend on the form owner.
- **Nested-form events do not reach the host.** A `submit` event that the inner form fired, and a synthetic bubbling `submit` dispatched from a `<div>` inside the host form, reached neither the host form nor a bubble-phase listener on `document`. Only capture listeners on `document` saw them. A `click` from the same `<div>` bubbled normally (P6, P7). On macOS, P7 found the same for `reset`. Bubbling stops at the form element for these two event types, in all three engines [INFERENCE: this matches WebKit's long-standing `HTMLFormElement::handleLocalEvents` rule; the engine sources were not read].
- **Implicit submission is still open.** Enter in an agent text field would submit its form owner if the Phase 2 Input implements implicit submission (R2, plan `:264`). With no form owner nothing is submitted [INFERENCE: no `<line-input>` exists yet].

**The rule options, weighed against Law 7 and C4.** Law 7 reads: "Form participation is opt-in via `FormAssociated` mixin and `ElementInternals`. No bespoke form integration; native `<form>` semantics is the only contract" (`docs/MANIFESTO.md:51`). A2UI keeps form data in the surface's data model and sends it only with an action (§2.1). Phase 1 settled the Button case with AM-081 (`docs/specs/01-spec-core-primitives.md:2578`). The surface forces `type="button"`, and the `line` catalog drops `type`, `name` and `value`, "so an agent Button never submits or resets a host form" (`packages/line-genui/src/a2ui/projection.ts:106-107`). The spec states the rule in its own words: "An agent Button never submits or resets a host form, and adds no field to it; it only raises its action" (`docs/specs/01-spec-core-primitives.md:1555`).

| Option | What it decides | Law 7 | C4 | Cost |
|---|---|---|---|---|
| (a) Detach | The surface sets `form=""` on every form-associated element it creates, Button included | Uses the native `form` attribute; the components keep their native contract unchanged | Element validity works (P6) | A host `<fieldset disabled>` still disables agent controls, and host CSS such as `form :invalid` still matches them. An agent value reaches the host's server only through the host app's transport |
| (b) Join on opt-in | A surface attribute lets agent controls join the host form, with names from a rule, such as the data path | Native semantics | Agent checks block the host's submission | Agent names collide with host fields (P6), and agent values enter host submissions, which is what AM-081 removed for Button. `form.reset()` desynchronises the control from the data model unless the surface writes back. Needs a naming rule and a security review |
| (c) Nested form | The surface wraps its content in a DOM-created `<form method="dialog">` | A `<form>` inside a `<form>` is non-conforming HTML and only reachable by script (HTML content model of `form`) | Works | Inner `submit` and `reset` events reach no bubble listener outside (P7) |
| (d) Document only | No rule | — | — | AM-081 rejected the analogous option for Button |

### 2.5 Q5: the v1.0 catalog shape

**Wire and envelope.**

- v1.0 messages carry `"version": "1.0"` (`specification/v1_0/json/agent_to_renderer.json:19-21`). `web_core` 0.14.0 accepts only `"v1.0"`, and 0.16.1 accepts only `"1.0"` (P1; the change is 0.15.0, `CHANGELOG.md:61`).
- `ComponentCommon` keys move to `@`-prefixed envelope keys: `@catalogId`, `@accessibility`, `@metadata` (`v1_0/json/common_types.json:48`), and `@checks` (`:289`). Bindings and calls become `@path` and `@call` (`:104`).
- `createSurface.theme` is removed; `createSurface` may carry `components` and `dataModel`, and its `catalogId` is optional (`evolution_guide.md:16`, `:76`).
- The session accepts only v0.9 envelopes today, so a v1.0 `createSurface` raises `UNSUPPORTED_MESSAGE` (P6, all four builds; Phase 1 spec AM-083, AM-084).
- `web_core` 0.14.0's v1 basic catalog is pre-final. It rejects `@checks` and `@accessibility` and takes bare `checks` and `accessibility` (P1). Final v1.0 therefore needs 0.16.0 or later.

**The basic catalog.** v1.0 has a catalog meta-schema, `catalog_definition.json`, which v0.9.1 lacked (`docs/research/01-research-a2ui-web-core.md:12`). It requires only `catalogId`, and `protocolVersion` defaults to `"0.9"` when omitted; a v1.0 catalog must set `"1.0"` (`evolution_guide.md:49`, `:198`). The v1 basic catalog is `https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json` with `protocolVersion: "1.0"` (`catalogs/basic/v1/catalog.json:3-7`). A structural diff of all 18 basic components against v0.9.1 (P1 setup) found these changes.

- Every component gains `weight` (`$defs/Weight`) and drops the `ComponentCommon` / `CatalogComponentCommon` `allOf` wrapper (`evolution_guide.md:66`).
- TextField and Slider change as in §2.1; Video gains `posterUrl`.
- Card, Button and Modal single children become `$defs/Child`, a reference to `ComponentId` (`evolution_guide.md:80`).
- **Text `variant` narrows to `caption` and `body`.** Headings move into Markdown markers in `Text.text`, such as `"## Welcome"` (`evolution_guide.md:64`, `:175`). The surface renders Text as plain text unless the consumer opts into a Markdown renderer (ARCHITECTURE `:1644`). A v1.0 heading would therefore show its literal `##` by default, against the Phase 1 mapping of `h1`–`h5` (`:1614`). This is a Phase 1 type, but it is v1.0 scope under O3 (b) (§5 item 5).
- The Icon `name` enum keeps the same 59 names, so `A2uiIconName` holds for v1.0 (P1 setup).

**The `line` catalog.** P3 built a `Catalog` under `protocolVersion: "1.0"` from today's 17 agent-exposed descriptors on `web_core` 0.16.1.

- Its `toJson()` validated against `v1_0/json/catalog_definition.json` with Ajv.
- The same catalog rejected a Chip `label` of `{"@path": "/x"}` and accepted `{path: "/x"}`, because the descriptors reuse the v0.9 Zod common types (ARCHITECTURE `:1597`). The emitted document and the run-time validation disagree.
- `@a2ui/web_core/v1_0` exports the v1.0 common types (`DynamicStringSchema`, `CheckableSchema`, `ChildSchema` and the others; P1 setup).

**Catalog ids.** P4 registered two catalogs under one id, one with `protocolVersion` `0.9` and one with `1.0`, in one `MessageProcessor` on 0.16.1. The v0.9 surface worked. The v1.0 surface failed with "catalog … specification version (0.9) does not match message protocol version (1.0)". `getRendererCapabilities` listed the id twice under both versions. Since 0.16.1, `addCatalog` rejects a duplicate id (`CHANGELOG.md:5`). The `line` id `…/a2ui/catalogs/line/v1/catalog.json` (`packages/line-genui/src/catalog/line.ts:18`) is the line catalog's own version 1, and ARCHITECTURE gives any incompatible change a new id (`:1604`).

### 2.6 Q6: `web_core` 0.15.0, 0.16.0 and 0.16.1 on the v0_9 path

**Releases.** 0.14.0 was published 2026-10-17, 0.15.0 2026-11-02, 0.16.0 2026-11-23 17:52 UTC and 0.16.1 2026-11-23 18:36 UTC; `latest` is 0.16.1 (`npm view`, 2026-11-26).

**Dependencies.** All four declare `lit ^3.3.3`, `zod ^3.25.76`, `@lit/context`, `@preact/signals-core`, `validate-color` and `zod-to-json-schema`. 0.16.0 drops `redos-detector`. None declares peers, and the exports map is the same 26 subpaths in all four.

**Tree diff.** 412 non-test, non-map source files changed between 0.14.0 and 0.16.1: 167 in 0.14.0 → 0.15.0, 349 in 0.15.0 → 0.16.0 and 34 in 0.16.0 → 0.16.1. Most of them are the generated `v0_9/schemas` and `v1_0/schemas`, then `catalog`, `state`, `resolution` and `processing`.

**The unit suite on each version.** P2 replaced `web_core` in a clone of the worktree and ran `bun test packages/line-genui` and `tsc --noEmit` in `packages/line-genui`.

| `web_core` | Pass | Fail | `tsc --noEmit` |
|---|---|---|---|
| 0.14.0 (pin) | 571 | 0 | exit 0 |
| 0.15.0 | 557 | 14 | not run |
| 0.16.0 | 554 | 17 | not run |
| 0.16.1 | 554 | 17 | exit 0 |

P2 swapped the package directory and left `packages/line-genui/package.json` at `0.14.0`. So the pin assertion `package.json lists @a2ui/web_core as exactly 0.14.0` (`packages/line-genui/__tests__/a2ui-session.test.ts:54-58`) kept passing. The row 01-Z21 review edited the pin to 0.16.1 and installed, and then 18 of 571 tests failed: these 17 plus that assertion. The AM that moves the pin updates that assertion too.

The failures fall into three classes.

1. **Every rejected message is reported twice (0.15.0+, 14 tests).** `processMessages` now passes each processing error to the surface's `onError`, then rethrows it (0.15.0 `src/processing/message-processor.js:455-467`; 0.16.1 `:403-421`, `:503-520`). The session does both: it subscribes to `surface.onError` and catches the throw (`packages/line-genui/src/a2ui/session.ts:191`, `:236-243`). Each rejection therefore raises two `line-a2ui-error`s.
   - The `onError` copy carries the wire code `mapErrorToRendererMessage` gives it. For a validation error on v0.9 that is `VALIDATION_FAILED` (0.16.1 `src/processing/message-error-mapper.js:150-164`), which `toA2uiError` turns into `UNKNOWN_ERROR` (`packages/line-genui/src/a2ui/errors.ts:61`).
   - Observed pairs: `UNKNOWN_ERROR` + `VALIDATION_ERROR`, `RECURSION_LIMIT_EXCEEDED` + `RECURSION_ERROR`, and `INTEGRITY_ERROR` twice.
   - Failing tests: eight strict-schema tests (AspectRatio, Spinner, Button, Alert, Chip, Badge, Avatar, AvatarGroup), four session tests and two message-shape tests.
   - `MessageProcessorOptions.reportErrorsOnly` and `errorHandler` exist since 0.15.0 (`CHANGELOG.md:81`).
2. **A component's own `catalogId` no longer routes on a v0.9 surface (0.16.0+, 2 tests).** `componentCatalogId` returns `undefined` below 1.0 (0.16.1 `message-processor.js:991-993`; `CHANGELOG.md:14`). The Alert tests' basic Text children, marked with the basic `catalogId` on a `line` surface, become `UNKNOWN_COMPONENT_TYPE`. The shipped Storybook fixture does the same (`apps/storybook/stories/agent-ui/a2ui-fixtures.ts:58`, `:148-151`, `:184`).
3. **A nested `openUrl` with a mismatched `returnType` is now rejected at validation (0.16.0+, 1 test).** The test nests `openUrl` (`returnType: "void"`) in a `formatString` string slot. 0.16.0 validates pre-1.0 nested calls against their `returnType` (`CHANGELOG.md:10`), so the message is rejected, and the user-activation guard the test expects is never reached. Nothing opens on either version (P2 session probe: two errors, "Expected returnType 'string', received 'void'").

**Further breaks P2 does not cover.**

| Change | Version | Effect on `line-genui` | Evidence |
|---|---|---|---|
| `getRendererDataModel()` throws when `sendDataModel` surfaces have different `protocolVersion`s, and a `v0.9.1` `createSurface` now records `v0.9.1` | 0.16.0 | `Session.dataModel()` (`session.ts:253-260`) catches the throw, emits `line-a2ui-error` and returns `undefined`, where 0.14.0 returned the model. This happens as soon as one surface was created with `v0.9` and another with `v0.9.1`, and always once v1.0 surfaces join | P5: 0.14.0 returned both surfaces under `v0.9`; 0.16.1 threw `A2uiValidationError` "Multiple protocol versions detected"; `CHANGELOG.md:12`; `message-processor.js:294-330` |
| `BASIC_FUNCTIONS` adds the 11 deprecated legacy functions (`add` … `ends_with`) | 0.15.0 | The session registers 25 functions on the basic catalog instead of the specification's 14 (`session.ts:177-183`). `V09_SPEC_FUNCTIONS` keeps the 14 | P1 setup; `CHANGELOG.md:75` |
| Stricter v0.9 validation: unknown keys on function-call objects, numeric bounds, `format: uri`, `anyOf` argument disjunctions | 0.15.0, 0.16.0 | Agent payloads that 0.14.0 accepted can be rejected | `CHANGELOG.md:10`, `:94` |
| `DynamicBoolean` coercion of any value; `ValidationResult` objects coerce to `valid` | 0.16.0 | Affects check conditions and boolean props on both versions | `CHANGELOG.md:23` |
| Optional props omitted on an update are dropped instead of kept | 0.16.0 | Prop removal now reaches the projection | `CHANGELOG.md:42-43` |
| `A2uiLitElement` renders into light DOM by default | 0.16.0 | Not used by `line-genui` (ARCHITECTURE `:1650`); upstream reference forms gain the hazard of §2.4 | `CHANGELOG.md:37` |
| Bundle | 0.16.1 | The surface entry (surface + `web_core`) grows from 138,418 to 146,418 B gzipped (+8,000 B, +5.8 %); all chunks from 188,428 to 196,399 B | P8 |

### 2.7 Q7: a form-sized surface

- **In the browser.** P6 rendered a Column of N Rows (Text bound to a path, plus Button) on the shipped surface. 40 rows are 161 components and 200 rows are 801.
- **In `web_core`.** P1 timed 200 keystrokes, each a `value.set()`, on one of N bound TextFields with a `required` check.
- Neither grew with N at these sizes. The five form types cannot be rendered yet, so this measures the projection and `web_core` with Phase 1 types.

| Measure | Chromium | Firefox | macOS WebKit | Linux WebKit (aarch64) |
|---|---|---|---|---|
| First render, 40 rows | 20 ms | 29 ms | 26 ms | 22 ms |
| First render, 200 rows | 30 ms | 55 ms | 48 ms | 68 ms |
| 20 data-model updates in one batch, 40 rows | 19 ms | 8 ms | 17 ms | 32 ms |
| 20 data-model updates in one batch, 200 rows | 18 ms | 9 ms | 17 ms | 17 ms |

| `web_core` (Bun 1.4.5) | N = 10 | N = 50 | N = 200 |
|---|---|---|---|
| 0.14.0, build + resolve / per keystroke | 1.7 ms / 0.015 ms | 7.2 ms / 0.009 ms | 9.8 ms / 0.010 ms |
| 0.16.1, build + resolve / per keystroke | 1.7 ms / 0.015 ms | 4.4 ms / 0.012 ms | 11.9 ms / 0.019 ms |

## 3. Probes

All probes ran on 2026-11-26 on macOS 27.2.1 (arm64) with the toolchain in the header. Worktree `line-ui-z21`, branch `docs/01-z21-r6-a2ui-form-types`, HEAD `42b67cd`. The packages were built from it. Scratch files lived in `/tmp/z21-probes/` and were deleted afterwards. Nothing was installed in or written to the repository except `node_modules` by the frozen install.

**Linux WebKit.** Per Miguel's choice of 2026-11-26, the WebKit side of P6 also ran on Linux with this command.

```
docker run --rm --cpus 2 --memory 1g --ipc=host -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  -e PW_PATH=/work/node_modules/playwright/index.mjs -v <worktree>:/work:ro -v /tmp/z21-probes/site:/site:ro \
  -w /site mcr.microsoft.com/playwright:v1.65.1-noble node run.mjs webkit
```

The container was Ubuntu 24.04.5 on aarch64, with the container's Node v26.13.1 and WebKit build 2388. It ran the repo's Playwright 1.65.1 JavaScript from the mounted `node_modules`; nothing was installed in the container. Exit 0. Linux WebKit matched macOS WebKit, Chromium and Firefox in all 70 non-timing values of P6; only the timings differ (§2.7). The run used `--cpus 2`, which can affect only the Linux WebKit timings in §2.7. The row 01-Z21 review did not re-run P6. It ran its own smaller host-form page in Chromium and Linux WebKit: the surface's agent Button and a form-associated custom element inside a host `<form>`, with and without `form=""`. Its results agreed with P6 for those checks. This is a local aarch64 run. CI runs x86_64 Linux and has not run these probes.

| # | Method | Result |
|---|---|---|
| P1 | `web_core` in Bun. `bun add @a2ui/web_core@{0.14.0,0.16.1} lit@3.3.3 zod@3.25.76 ajv@8 ajv-formats@3` in `/tmp/z21-probes/wc/<v>`; `probe.mjs` builds a `MessageProcessor` on the upstream `basicCatalog` of each version with `RELAXED_VALIDATION`. It feeds a form surface (§2.1, §2.2), resolves it with `NodeResolver` and prints every prop as `Writable`/`Resolved`/literal. It writes through `value.set()`, tries one component per schema case, times keystrokes (§2.7), and resolves v1.0 `{path}` and bare `checks`. Extra one-liners: the v0.9.1 flat check form, export lists, the `BASIC_FUNCTIONS` names, the `catdiff.py` structural diff of the 18 basic components, and the Icon enum comparison | Exit 0 on both. Results as cited in §2.1–§2.3, §2.5, §2.7. 0.14.0 rejected `"1.0"` envelopes and v1.0 `@checks`; 0.16.1 rejected `"v1.0"` |
| P2 | Suite swap. `cp -Rc` of the worktree with `node_modules` to `/tmp/z21-probes/wt016`; the package directory `node_modules/.bun/@a2ui+web_core@0.14.0/node_modules/@a2ui/web_core` replaced by the extracted 0.15.0, 0.16.0 and then 0.16.1 tarball; `bun test packages/line-genui` each time; `tsc --noEmit` in `packages/line-genui` on 0.16.1; the same commands on the worktree (0.14.0). A session script fed the `openUrl` payload of the failing test | §2.6 table. The session script got two errors on 0.16.1 and none on 0.14.0 |
| P3 | v1.0 `line` catalog. In the 0.16.1 clone, `new Catalog(id, '1.0', <17 agent-exposed descriptors>, [])`; `toJson()` validated with Ajv 2020 against `v1_0/json/catalog_definition.json` plus `common_types.json`; Chip `label` fed as `{"@path"}`, `{path}` and a literal in `"1.0"` envelopes | `toJson` valid; `{"@path"}` rejected (`label: Unrecognized key(s) in object: '@path'`); `{path}` and the literal accepted |
| P4 | One id, two protocol versions. `new Catalog(X, '0.9', [v0_9 TextFieldApi])` and `new Catalog(X, '1.0', [v1_0 TextFieldApi])` in one `MessageProcessor` (0.16.1) | Constructed; v0.9 surface accepted; v1.0 surface rejected (version mismatch); capabilities list X twice for each version |
| P5 | Mixed versions with `sendDataModel`. Two `createSurface` with `sendDataModel: true`, one `v0.9` and one `v0.9.1`, then `getRendererDataModel()` | 0.14.0: `{"version":"v0.9","surfaces":{"a":{},"b":{}}}`; 0.16.1: throws |
| P6 | Browser. `Bun.build` (splitting, ESM) of an entry that imports the built `packages/line-genui/dist/a2ui/index.js` and exposes `Session`, with `index.html` and `probe.js` served through `page.route('http://r6.test/**')` by `run.mjs` (Playwright 1.65.1, one engine at a time, one worker). Page: `<form id="host" action=… method="get">` holding `<input name="hostField" value="h">`, a `<line-a2ui-surface surface-id="main">` and `<fieldset id="fs"><div id="zone"></div></fieldset>`. (1) The surface probe fed a v0.9.1 surface with the five types, a Button with a failing `required` check, and a data model, then clicked the agent Button and fed a v1.0 `createSurface`. (2) The platform probe defined `x-face` (`static formAssociated = true`; `attachInternals()`; counts `formResetCallback` and `formDisabledCallback`). It created three elements before `define()` and six after, placed as in the §2.4 table, plus a native `<input name>` in the host form and one in the nested form. It then ran `FormData`, `checkValidity()`, `requestSubmit()`, `reset()`, `fieldset.disabled` and two reparents. (3) The scaling probe of §2.7. The last run of P6 is the one reported; an earlier run without the `form=""` cases gave the same values for every shared check | Exit 0 in Chromium 159.0.8154.6, Firefox 159.0, WebKit 27.2 (macOS) and WebKit 27.2 (Linux). All non-timing values identical across the four (table below); no `pageerror` |
| P7 | Event propagation. Three ad-hoc `page.setContent` pages in the three macOS engines dispatched `submit`, `click`, `reset` and a custom event from a `<div>` inside a `<form>` and from one inside a `<section>`, and called `requestSubmit()` on a DOM-created form nested in a form | `submit` and `reset` from inside a form reached neither the form nor `document` bubble listeners; `click` and the custom event did; `submit` and `reset` from inside the `<section>` reached it. P6 repeats the `submit`/`click` part on all four builds |
| P8 | Bundle size. `Bun.build` (minify, splitting, ESM, browser) of `export { LineA2uiSurface, Session } from '<worktree>/packages/line-genui/dist/a2ui/index.js'`, once in the worktree (0.14.0) and once in the 0.16.1 clone; `zlib.gzipSync(level 9)` | Entry 508,416 / 138,418 B → 559,635 / 146,418 B; all chunks 647,080 / 188,428 B → 698,299 / 196,399 B. This is Bun's bundler, not the repo's Vite/Rolldown build |

P6 behavioural results. Each value holds in Chromium, Firefox, macOS WebKit and Linux WebKit.

| Check | Result |
|---|---|
| Rendered content | Light-DOM children of the surface, inside the host form; shadow root holds `style`, `div` (live region), `slot` |
| TextField, CheckBox, ChoicePicker, Slider, DateTimeInput | `placeholder:unknown-type` each; five `UNKNOWN_COMPONENT_TYPE` errors |
| Agent Button | `line-button`, `type="button"`, form-associated, in `host.elements`, not disabled while its check fails; a click fired no host `submit` |
| v1.0 `createSurface` | `UNSUPPORTED_MESSAGE` |
| Form owners | as the §2.4 table |
| `FormData(host)` | `hostField=h`, `prePlain=1`, `agentField=plain`, `hostField=collide`, `agentNative=n` |
| `FormData(inner)` | `nestedField=nested`, `nativeInner=ni` |
| Nameless invalid control | host `checkValidity()` false, 0 host `submit` events, `invalid` on the control |
| `form="r6-no-such-form"` invalid control | host `checkValidity()` true, 1 host `submit` event; control `willValidate` true, `checkValidity()` false, `:invalid`, message kept |
| `form=""` invalid control | host `checkValidity()` true, 1 host `submit` event; control `willValidate` true, `:invalid` |
| Nested invalid control | host `checkValidity()` true, inner false |
| Inner `requestSubmit()` | inner listener saw it; host and `document` bubble listeners did not; `document` capture did; no navigation |
| `host.reset()` | reset callback on the four host-owned controls only (`prePlain`, `plain`, `nameless`, `collide`) |
| `fieldset.disabled = true` | `formDisabledCallback(true)` and `:disabled` on all nine `x-face` controls, the five without the host as owner included |
| Reparent of the two opted-out controls (`form="r6-no-such-form"`, `form=""`) | still no owner |

## 4. Recommendations

Each item is evidence for the spec author, not a rule.

1. **The surface rule.** (recommended) Option (a) of §2.4: the surface sets `form=""` on every form-associated element it creates, Button included, when it creates the element. Data leaves through the A2UI data model and actions, as the protocol defines. P6 shows the opt-out holds in four engine builds from before upgrade and across reparents, and keeps C4 validity. It is a rule over a set that grows (plan §5.3) and extends AM-081 from Button to every control. Alternatives: (b) host opt-in joining, which needs a naming rule and a security review of agent values in host submissions; (c) a nested form, which is non-conforming and swallows `submit`/`reset` propagation; (d) documentation only.
2. **Checks to validity.** (recommended) The surface writes the first message of `validationErrors` to the control's C4 external-validity member (the Button convention `custom-validity`), or the empty string when `isValid` is true, and fills the Field `error` slot with all of `validationErrors`. A v1.0 result of severity `warning` or `info` never becomes validity. Alternatives: join all messages into the validity message; render warnings into the Field's hint slot; leave warnings out until a later phase (§6 Q3).
3. **A Field around every checkable form type.** (recommended) Wrap all five types, not only TextField, in `<line-field>`, so that the C4 error slot exists for each. This needs an ARCHITECTURE §17.3 change (§5 item 4). Alternative: a surface-owned error element per control referenced by `aria-describedby`, as the upstream reference elements do, which keeps the message outside the Field contract of C4.
4. **Live write-back.** (recommended) The five types write their value through the `WritableBinding` on `line-input` as well as on `line-change`, which meets A2UI's "immediately" and keeps checks and bound Text live. This needs a binding-map member for the live event (§5 item 1). Alternative: commit-only write-back, which departs from both protocol versions.
5. **Value adapters.** (recommended) The basic map gives each form type an explicit A2UI ↔ element value adapter. ChoicePicker single maps `[v]` ↔ `v`. The O7 (a) checkbox list is composed as an array. CheckBox `value` maps ↔ `checked`. The TextField `number` variant stays a string, and DateTimeInput an ISO string. `web_core` stores whatever it is given (P1). Alternative: the descriptor binding map gains a value transform per value binding, so every catalog, not only the basic map, carries the adapter (§6 Q6).
6. **ChoicePicker targets.** (recommended, pending R4) Use the §2.3 matrix: radio group, the O7 (a) checkbox fieldset, single toggle group with `deselectable: false`, and multiple toggle group. `filterable` single maps to `<line-select>` if R4 gives it search. `filterable` multiple renders without a filter until the Phase 4 Combobox. Alternative: ignore `filterable` everywhere in Phase 2 and keep `<line-select>` for a rule the spec sets, such as an option count.
7. **TextField `validationRegexp` (v0.9.1).** (recommended) Accept the key and apply no validation, as the upstream reference does, and say so in the descriptor's agent-facing description. Mapping it to `pattern` changes the regex dialect, and an implicit check needs a message no one supplied (MANIFESTO Out of Scope, localisation). Alternatives: map it to `pattern`; synthesise a `regex` check with a consumer-set message attribute.
8. **Slider step.** (recommended) Use `step = (max − min) / steps` for v1.0 `steps`, and `step = 1` when `steps` is absent (v0.9.1 included), both as the upstream reference renders. Alternative: a continuous slider when `steps` is absent. Whether fractional steps snap cleanly is R1's to probe on Zag 1.49.
9. **Time-only DateTimeInput.** (recommended) Until a Time Picker exists, the time-only case takes the unmapped-type path, an inert placeholder plus `line-a2ui-error` (ARCHITECTURE `:1610`), and "neither flag" renders as date only, as upstream does. Alternatives: a native `<input type="time">`, which needs the same `form=""` opt-out and has no C4 path; or `<line-date-input>` if R5 finds a time granularity.
10. **Button checks.** (recommended) The surface sets `disabled` on an agent Button while its node's `isValid` is false, as both protocol versions require. Today it ignores the checks (P6). This is a Phase 1 behaviour gap that Phase 2 forms will rely on (§5 item 3). Alternative: keep the Button enabled and leave check failures to the controls' own C4 validity, a documented departure from A2UI; the spec states it (§6 Q12).
11. **v1.0 catalogs.** (recommended) Give the v1.0 `line` catalog its own `catalogId`, and derive each descriptor's Zod schema per protocol version from one declaration, using `@a2ui/web_core/v0_9` or `@a2ui/web_core/v1_0` common types. Register the v1.0 basic implementation under the v1_0 basic id. Accept `"version": "1.0"` envelopes. Alternatives: one processor per protocol version (P4), or hand-written v1.0 schemas per descriptor.
12. **The pin.** (recommended) Move to 0.16.1 through one spec AM that settles five things. (1) One report per rejected message, through `reportErrorsOnly` with `errorHandler`, or by dropping the duplicate path. (2) Catalog mixing on v0.9 surfaces, which is gone, so the Storybook fixture and the tests need one catalog per surface or v1.0. (3) A version argument for `getRendererDataModel`. (4) `V09_SPEC_FUNCTIONS` instead of `BASIC_FUNCTIONS`, to keep the specification's function set. (5) The exact-pin assertion (`a2ui-session.test.ts:54-58`). Alternatives: 0.16.0, which carries the same breaks without `addCatalog`; or staying on 0.14.0, which cannot run final v1.0 (P1) and so contradicts O3 (b).

## 5. Contradictions and gaps

None of these is R6's to fix. PROCESS §2 sends a contradiction back to the plan and the PRD before spec work.

1. **ARCHITECTURE §17.3 binding map vs A2UI two-way binding.** The binding map names the value prop and "the commit event that §17.2 rule C9 names" (`docs/ARCHITECTURE.md:1592`), and the shipped projection writes back only on that event (`projection.ts:637-663`). A2UI v0.9.1 and v1.0 require a write on each keystroke and real-time reactivity (`v0_9_1/docs/a2ui_protocol.md:478-492`; `v1_0/docs/a2ui_protocol.md:986-1001`). Plan §2.4 and §4.3 (`docs/plans/02-plan-essential-forms.md:121-139`, `:221-228`) do not mention the gap.
2. **ARCHITECTURE §17.3 descriptors vs v1.0.** "Descriptors are written on the Zod 3 API and reuse the `@a2ui/web_core` common-type schemas" (`:1597`) and "The emitters produce the A2UI v0.9.1 catalog JSON" (`:1602`). These hold only for v0.9: v1.0 needs the v1_0 common types (P3) and its own catalog id (P4). The basic catalog "answers only to the v0_9 id" (`:1606`; Phase 1 spec SD43) also needs the v1_0 id beside it. PRD §7.4 (`docs/PRD.md:973`, `:984`) and plan O3 (b) schedule the v1.0 catalogs but do not state these costs.
3. **A2UI Button checks vs the Phase 1 surface.** Both protocol versions disable a Button whose check fails (`v0_9_1/docs/a2ui_protocol.md:625`; `v1_0/docs/a2ui_protocol.md:1183`). The Phase 1 surface does not (P6). ARCHITECTURE's Button row (`:1620`) is silent.
4. **C4's Field error slot vs the §17.3 table.** C4 puts the visible message in `<line-field>`'s `error` slot, "which the renderer fills" (`:1579`). The table wraps only TextField in `<line-field>` (`:1621-1625`), though all five types are `Checkable`.
5. **v1.0 basic Text headings.** The table maps Text `variant` `h1`–`h5` to headings (`:1614`). v1.0 removes those variants in favour of Markdown markers (`evolution_guide.md:64`), and the surface renders plain text by default (`:1644`). Under O3 (b) a v1.0 heading would render as literal Markdown.
6. **Plan §8 risk "`web_core` 0.15–0.16 breaking changes on the v0_9 path" (`:518`) is realised.** 17 unit tests fail on 0.16.1, and an actual pin edit fails 18 with the exact-pin assertion (§2.6). The Storybook a2ui fixture relies on per-component `catalogId` on v0.9 surfaces, which 0.16.0 removes (§2.6). This is a cost for the AM that O3 (b) foresees, not a contradiction.
7. **PRD §7.4 "the surface renders both protocol versions" (`docs/PRD.md:973`, `:984`) on 0.16.1.** Once surfaces of different protocol versions send their data model (P5), `Session.dataModel()` catches the `getRendererDataModel()` throw, emits `line-a2ui-error` and returns `undefined`. The surface needs a per-version data-model call.
8. **MANIFESTO Law 7 and the surface rule.** Recommendation 1 uses the native `form` attribute and keeps every component's native contract, so it does not contradict Law 7. Option (b) would let agent fields enter a host submission, which AM-081 removed for Button. Plan §7.2 asks for a rule that "states how a host-page `<form>`, C4 validity from A2UI checks and MANIFESTO Law 7 apply" (`:490`). The tension is recorded here for that rule, not resolved.

The plan's statements of the v1.0 form changes hold (plan §2.4, `:138-139`): `checks` → `@checks` with a `ValidationResult`, TextField gains `placeholder`, drops `validationRegexp` and requires `value`, and Slider gains `steps` as a count of divisions. The §5.2 statement of the `web_core` versions holds as well (`:278-279`). The row 01-Z21 text holds.

## 6. Open questions for the post-research revision and the Phase 2 spec

These are for plan §10 step 4 (the PRD, ARCHITECTURE and plan revision) and for the spec questions of plan §5.5.

1. **Surface rule.** Detach every surface-created form-associated element with `form=""` (recommended), join the host form on opt-in, nest a form, or document only? Does the rule also cover today's agent `<line-button>`, which P6 found in `host.elements`?
2. **Write-back timing.** Do the five types write the data model on `line-input` as well as on `line-change` (recommended)? If so, how does the descriptor binding map name a live event beside the C9 commit event (§5 item 1)?
3. **Checks to C4.** Which message becomes the validity message: the first error (recommended) or all errors joined? Where do v1.0 warnings and info go: a hint slot, a Field state, or nowhere? Does the surface infer a required indicator (`data-required`, `aria-required`) from a `required` check on the bound path?
4. **First render.** `web_core` reports a required-but-empty field as invalid before interaction. Does the surface show the error and set C4 validity at once, as upstream does, or only after interaction, following R2's error-after-interaction state?
5. **Field wrapping.** Does every checkable form type get a `<line-field>` (recommended), or only TextField with a separate error element for the others (§5 item 4)?
6. **Value adapters.** Does the descriptor binding map gain a transform per value binding, or does the basic map carry per-type adapters (recommended)?
7. **ChoicePicker.** Is the §2.3 matrix the mapping? When does the surface render `<line-select>`: for `filterable`, by option count, or never in Phase 2? What renders a filterable `multipleSelection` picker?
8. **TextField details.** Is `validationRegexp` ignored (recommended), mapped to `pattern`, or turned into a check? Does `obscured` get an `autocomplete` value, and does the security review of the G rows cover autofill into agent password fields and passwords in `sendDataModel`?
9. **Labels.** ChoicePicker and Slider `label` and the DateTimeInput `label` are optional. Is a missing visible label covered by `accessibility.label`, or is it `MISSING_ACCESSIBLE_NAME` as for Phase 1 named components?
10. **Slider.** Is `step = 1` the v0.9.1 default (recommended), or is it continuous? How are fractional `steps` quotients rounded before they reach the data model?
11. **DateTimeInput.** Does time-only take the unmapped path (recommended), a native time input, or `<line-date-input>` per R5? Which ISO 8601 form does each flag combination write, and are time zones kept?
12. **Button checks.** Does the surface disable an agent Button whose checks fail, as A2UI requires (§5 item 3)? Is that a Phase 2 row against the Phase 1 surface?
13. **v1.0 catalogs.** What is the v1.0 `line` catalog id? Are the per-version descriptor schemas derived from one declaration (recommended)? Does the session accept `"1.0"` envelopes beside v0.9 ones in one `Session`, or one session per protocol version?
14. **v1.0 Text headings.** Does the v1.0 basic Text map Markdown heading markers to `<h1>`–`<h5>` without a Markdown renderer, or render them as text (§5 item 5)?
15. **Pin AM.** Is the target 0.16.1 (recommended)? How does the AM settle the double error report, catalog mixing on v0.9 surfaces (Storybook fixtures, tests), the versioned data model, and the function set?

## 7. Sources

All retrieved 2026-11-26.

- `@a2ui/web_core` tarballs (`npm pack`). sha256:
  - 0.14.0: `8a3eaed1804022d3e180fc9c0ab35becb93623eaf07535ecd340bfa8a91ea3eb`
  - 0.15.0: `7f780ca69c090faafe55b635d028d39395cc74d409dc300ff9960701270dae5b`
  - 0.16.0: `eae64fab0b436ad52a1521d96b59378a51d17664160d4a3e67cb41a7331d1a86`
  - 0.16.1: `545b76606daf8cb1698983e73366fb13d6df68e34c9e5e4a157634b066817dd4`
- `@a2ui/web_core` 0.16.1 `CHANGELOG.md` (sections 0.16.1, 0.16.0, 0.15.0); `npm view @a2ui/web_core time dist-tags versions`.
- A2UI repository, commit `36725eee042da90c526f469f94246f96e16fdc35`: https://github.com/a2ui-project/a2ui/tree/36725eee042da90c526f469f94246f96e16fdc35
  - `specification/versions.json` (v1.0 `current`, v0.9.1 `previous`)
  - `specification/v1_0/README.md` ("This specification is stable")
  - `catalogs/basic/v0_9_1/catalog.json`, `catalogs/basic/v1/catalog.json`
  - `specification/v0_9_1/json/common_types.json`, `specification/v1_0/json/{common_types,catalog_definition,agent_to_renderer}.json`
  - `specification/v0_9_1/docs/a2ui_protocol.md`, `specification/v1_0/docs/a2ui_protocol.md`, `specification/v1_0/docs/evolution_guide.md`
- A2UI v1.0 specification: https://a2ui.org/specification/v1.0-a2ui/ ; v0.9.1: https://a2ui.org/specification/v0.9.1-a2ui/
- HTML Standard: form owner and the `form` attribute, https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#association-of-controls-and-forms ; the `form` element content model, https://html.spec.whatwg.org/multipage/forms.html#the-form-element ; form-associated custom elements, https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements ; constraint validation, https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraints
