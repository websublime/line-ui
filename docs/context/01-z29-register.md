# Decision register — row 01-Z29 (post-research revision, plan §10 step 4)

**Base:** `origin/main` `b940d1c` (PRD v0.8.37, ARCHITECTURE v0.8.28, MANIFESTO 2026-11-25). Notes R1–R10 cite
`9c9b1f4` and PRD v0.8.36: every PRD line after the revision log is **+1** at `b940d1c` (e.g. Law 8 row `:173`, not
`:172`; Select row `:287`, not `:286`). ARCHITECTURE, MANIFESTO and the plan body did not move for the cited lines.
Locators below are live at `b940d1c`. Note short names: R1 zag-form-machines, R2 form-associated-contract, R3
field-labelling, R4 select, R5 date-input, R6 a2ui-form-types, R7 progressive-enhancement-ssr, R8 packaging-weight,
R9 fieldset, R10 theming-showcase (all `docs/research/02-research-<slug>.md`).
"Mine" marks this register's recommendation, not a note's.

**Counts:** (A) 33 decisions · (B) 86 spec-level questions (+ 9 Miguel actions outside the documents) · (C) 31
factual corrections · 9 inter-note conflicts.

---

## 0. Rounds (themes) for Miguel

| Round | Theme | Decisions |
|---|---|---|
| 1 | Laws and anatomy (MANIFESTO readings) | D1–D7 |
| 2 | Form contract, events and Field (ARCH §6, §9, §15.1, §17.2) | D8–D13 |
| 3 | Components: Select, DateInput, PasswordInput, Fieldset, reset sheets | D14–D20 |
| 4 | Packaging and size target | D21–D23 |
| 5 | A2UI v1.0 and the surface (ARCH §17.3) | D24–D28 |
| 6 | Showcase, theming, tooling leftovers | D29–D33 |

Order matters inside round 1: D1 and D2 decide anatomy; D3–D6 are the Law readings they need. D11/D12 depend on D1;
D19/D20 on D1, D2, D5; D26 on D11/D12.

---

## 1. (A) Decisions that change MANIFESTO / PRD / ARCHITECTURE / plan now

### Round 1 — Laws and anatomy

#### D1 — Law 8 for Input and Textarea: which anatomy?
- **Q:** Do Input and Textarea wrap a *slotted light-DOM native control* (no-JS works) or keep ARCH's shadow `<input>` (no-JS impossible)?
- **Changes:** MANIFESTO `:53`; PRD `:173`; ARCH §7 `:393`, `:402` (form-associated list), §15.1 `:1325-1333`, §15.2 `:1367` (`::part(input)`), §16.2 input rows, §14.10 `:1297`; plan §5.7 (add the Input/Textarea half, R7 §5 item 1), §4.1/§5.4 O1/§6 `:452` (validating set, see cost).
- **Evidence:**
  - R7 TL;DR `:10-21`, §3.2: slotted native in undefined host submits, validates, resets, honours `form=`, fieldset, Enter, `<label for>` in 4 builds.
  - R7 TL;DR `:16-21`: shadow `<input>` (declarative or Lit SSR) has no form owner → "not feasible" under current anatomy.
  - R7 §2.3, TL;DR `:22-26`: "take over" double-submits (`n=n0&n=n0`) unless it disables author control; hidden `required` → "not focusable".
- **Options:**

  | | What changes | Cost |
  |---|---|---|
  | (a) Adopt slotted native | ARCH §7/§15.1/§15.2/§16.2 rewritten; Input/Textarea leave the FACE list or keep a mirror; no `::part(input)` | Law 7 and Law 5 wording (D3, D4); `::slotted` styling limits; A2UI surface must create the inner `<input>`; consumer authors an inner control; O1 (a)'s "Input (custom machine)" no longer exercises the FACE value path → the stream F validating set needs another FACE text control |
  | (b) Fallback then take over | ARCH anatomy kept after upgrade | Mutates author DOM (Law 5); two code paths × 3 engines; value/default/constraints/restore hand-off |
  | (c) Record "not feasible" | MANIFESTO `:53` + PRD `:173` narrowed; native control in `<line-field>` documented as no-JS path | Narrows a Law; needs D11 (native controls Field-compatible) |
- **Notes:** R7 §6.1 `:496-500` recommends (a).
- **Interactions:** R2 rec 5/6 (implicit submission, autofill) become native under (a) (R7 §6.1, R7 Q12); R3 labelling becomes same-tree `<label for>` for these two (R7 §4 `:441-444`); R1 fallback (D5) is moot for them under (a); R4 §2.7/R7 §2.4: a shadow reset sheet does not reach slotted content (D20).
- **Mine:** (a) — the only option where the no-JS path and the upgraded path share one form participant; condition: D3 and D4 adopt readings that admit it, and the plan names a replacement FACE text control (SearchInput or PasswordInput) in the O1 validating set.

#### D2 — Law 8 for Select: native, custom, or hybrid?
- **Q:** Does Select stay custom (Zag listbox) with Law 8/PRD revised, or build on a native/slotted `<select>`?
- **Changes:** MANIFESTO `:53`; PRD `:173`; ARCH `:875`, `:1156`, `:1337-1339`, `:1446-1460`, `:1525-1526`; plan §5.7 row 2 `:436`.
- **Evidence:**
  - R4 TL;DR `:11`, P1: customizable select (`base-select`) in Chromium 159 + WebKit 27.2 only; Firefox flag off, bug NEW.
  - R4 TL;DR `:12`, P2; R7 §6.2 `:506-511`: a shadow `<select>` never submits; light-DOM `<select>` works no-JS.
  - R8 §2.3: Select is 26,738 B gz marginal; R10 §2.4/Q11: showcase needs groups + slotted swatches.
- **Options:**

  | | What changes | Cost |
  |---|---|---|
  | (a) Custom only; Law 8 drops Select; native `<select>` in `<line-field>` is the no-JS / OS-picker path | MANIFESTO `:53`, PRD `:173` name Input, Textarea only | Needs D11 (native control Field-compatible) |
  | (b) Native `<select>` + `base-select` | ARCH §15.1/§16.2 reversed | Unstyled native in Firefox; no search/rich items; PRD tier "Pre-built" changes |
  | (c) Hybrid: slotted `<select>` is fallback and option source | ARCH §16.2 | Two sources of truth; writes on author nodes (Law 5) or native as form channel (Law 7, R4 X7); unprobed end to end |
- **Notes:** R4 rec 1–2 `:290-294` recommends (a); R7 §6.2 gives no recommendation.
- **Interactions:** R3 contradiction 2 `:298` (native `<select>` not Field-compatible today) → D11; D1 symmetry (if D1 (a), Law 8 keeps two controls); D20 `reset.select.css`.
- **Mine:** (a) — Firefox has no customizable select and the PRD's grouped/rich-item Select needs the custom listbox; Law 8 stays true for the two controls that can meet it.

#### D3 — Law 7 reading: who may participate, and may the layer emulate implicit submission?
- **Q:** (i) Under D1 (a), is a slotted native control a valid participant under "native `<form>` semantics is the only contract"? (ii) May the shared layer emulate implicit submission (Enter → default button) for FACE text controls?
- **Changes:** MANIFESTO `:51` (wording) and/or ARCH §7 `:386-402`.
- **Evidence:** R7 §5 item 2 `:468-472`; R2 TL;DR `:15`, §2.5, rec 5 `:409-413`, Q7 `:444`: Enter in an inner `<input>` submits nothing in any engine; native rules ignore FACEs; `requestSubmit()` drops the submitter.
- **Options:** (a) Reword Law 7: participation through `ElementInternals` *or* an author's slotted native control; emulation that reproduces the HTML implicit-submission algorithm is "native semantics", allowed. (b) Strict: FACE only, no emulation (Enter never submits from line text controls). (c) (a)(i) only, no emulation.
- **Notes:** R2 rec 5 recommends emulation (default-button click; `requestSubmit()` only with ≤1 blocking field) subject to Q7; R7 none.
- **Interactions:** R6 §2.4 `:135`: under the surface rule `form=""` agent fields have no owner → emulation inert there; D1 shrinks the set to SearchInput, PasswordInput, NumberInput, DateInput, Editable.
- **Mine:** (a) — "Enter submits" is native behaviour users expect; restoring it via the spec algorithm keeps the contract native.

#### D4 — Law 5 reading: which DOM writes are inside "Lit's reactive cycle"?
- **Q:** Which writes are allowed: Zag effects in the component's own shadow tree; writes on author light DOM (attributes, ARIA reflection properties); nodes appended to `document.body`?
- **Changes:** MANIFESTO `:47` (wording or a clarifying sentence); ARCH §6 (machine/DOM ownership).
- **Evidence:** R1 X5 `:566`, §4 `:499-502` (machines write `checked`, `value`, focus); R5 §5 item 4 `:334` (live region on `body`, rAF focus, selection collapse); R7 Q3 `:534-535`; R9 §2.10 B `:252`; R3 rec 2 `:275-278` (Field writes `control.ariaLabelledByElements`); R1 §2.9 `:358-360` (host-tree scope writes `role`/`aria-*` on consumer children).
- **Options:** (a) Machine effects inside the component's own tree count as the component's cycle; on author light DOM only standard ARIA reflection properties set by an orchestrator (Field) — no attribute writes; no `body` nodes (DateInput region moved via `root`, D15/B). (b) As (a) plus attribute writes on author children by the owning family host (host-tree scope, Fieldset B). (c) Literal: none of the above — blocks every pre-built machine.
- **Notes:** none recommend; R1 Q2, R5 Q5, R7 Q3 all ask.
- **Interactions:** D1 (a), D6, D12 (hand-off), D19 (B mechanism), D15 (live region).
- **Mine:** (a) — admits the pre-built machines and the R3 hand-off without letting components rewrite consumer markup.

#### D5 — Law 9 at run time
- **Q:** Does the controller catch run-time machine errors and fall back, or do the Law and PRD say "start failures only"?
- **Changes:** MANIFESTO `:55` vs PRD `:172`; ARCH §6 `:371` area.
- **Evidence:** R1 §2.10 `:365-378`, X4 `:565`: start failure → fallback, no page error; action failure → uncaught error, form value and UI disagree (P6, 4 builds). PRD covers initialisation only; MANIFESTO covers every error.
- **Options:** (a) Controller wraps `send`/`updateProps`/effects, flips to fallback; fallback template wires its controls to `setFormValue` (R1 rec 10); PRD `:172` says "fails to initialise or run". (b) Narrow MANIFESTO `:55` to start failures. (c) Keep both texts, accept the gap (contradiction stays).
- **Notes:** R1 rec 10 `:552-553` recommends fallback wiring; Q4 open on run-time wrap.
- **Interactions:** D1 (a) makes the fallback native for Input/Textarea; R5 Q13 DateInput fallback; D20 reset sheets for fallback templates.
- **Mine:** (a) — a Law outranks the controller; narrowing it to fit current code is a simplification. [INFERENCE: wrap feasibility in Zag's microtask `send` not probed.]

#### D6 — Item composition, Law 4 / Law 6 and the ARCH §12 slot sentence
- **Q:** Do Radio Group, Toggle Group and the `./select` family use slotted light-DOM item elements (family subpath, machine scope on the host's tree), items rendered in the group's shadow root, or separate item entries? Which reading of Law 6 vs ARCH §12 `:554` holds? Rule or list in §12?
- **Changes:** MANIFESTO `:49`; ARCH §12 `:554`, `:579`, `:586`; plan §5.5 `:413` (entries stay spec-level once the rule is set).
- **Evidence:**
  - R1 §2.9 `:346-363`: slotted items invisible to scope = shadow root; host-tree scope works but writes on consumer children, ids must be document-unique; radios in separate shadow roots do not group.
  - R4 §2.5, rec 3 `:295-297`: light-DOM `line-select-*` family passed every behaviour (P7); shadow listbox over slotted options breaks Zag id lookups (P5).
  - R8 gap 1 `:273`: Law 6 ("share a subpath when slots make them inseparable") vs §12 ("slotted → always separate"); §12's own table contradicts the sentence.
  - R10 Q11 `:291`: showcase needs slotted item content (swatches).
- **Options:**

  | | What changes | Cost |
  |---|---|---|
  | (a) Light-DOM families with item tags (`line-radio-group-item`, `line-toggle-group-item`, `line-select-*`); §12 sentence rewritten to R8's reading | ARCH §12 `:554`, rule with examples | Radio item cannot hold the hidden radio in its own shadow root (R1 P3) → item shape unprobed; needs D4 (a) or (b) |
  | (b) Items rendered in the group's shadow root from data / slotted text | §12 unchanged for the two groups | Law 4 "slots over props for content"; loses R10 swatches |
  | (c) Separate item entries (literal §12) | MANIFESTO `:49` reworded | `line-genui` loads two subpaths; item alone does nothing |
- **Notes:** R4 (a) for Select; R8 rec 2–4 `:288-295` (a) + R8's slot wording + rule over list; R1 rec 9 `:548-551` none.
- **Interactions:** R8 wrote "R1's question" (`:54`) though R1 had answered it (conflict K2); D4.
- **Mine:** (a), with a spec probe gate: the radio item shape (no item shadow root around the radio, or host role per R3 Q10) must pass R1's P3 before Radio Group's spec is approved.

#### D7 — MANIFESTO Out of Scope wording: dependency-supplied locale data and consumer-run SSR
- **Q:** Do "No bundled i18n" (`:66`) and "No Node DOM polyfill story" (`:68`) need wording now that Zag ships a 76-locale placeholder table and a fixed English "Empty", and SSR runs under shims?
- **Changes:** MANIFESTO `:66`, `:68`; PRD `:170`.
- **Evidence:** R5 §5 item 3 `:333`, §2.5 `:161-163`; R7 §5 item 4 `:475-480`, Q11 `:554-555`; R2 Q9 `:446` (validation messages).
- **Options:** (a) Clarify: platform/dependency locale data with consumer override is not bundled i18n; consumer-run SSR under its own shim is not a polyfill story. (b) Leave wording; treat each case in the spec. (c) Forbid dependency strings (requires host-owned replacements for Zag text).
- **Notes:** none (R5 rec 4 recommends an upstream `translations` key for "Empty").
- **Mine:** (a) — states the reading once instead of re-arguing it per component.

### Round 2 — Form contract, events, Field

#### D8 — Controller start order (ARCH §6, Phase 1 SD29)
- **Q:** Start Zag machines after the first render (default or opt-in), or keep `hostConnected` with per-machine workarounds?
- **Changes:** ARCH §6 `:371`; Phase 1 spec SD29 (`01-spec:958`, `:2412`) via an AM in the same commit (PROCESS §3).
- **Evidence:** R1 §2.2 `:97-113`, X1 `:562`: slider thumb stays `visibility: hidden` (no keyboard), checkbox press tracking never binds; a controller starting in the first `hostUpdated`, with a template that renders all parts with ids/roles, fixes both in 4 builds.
- **Options:** (a) Default for all (Phase 1 components change lifecycle; re-verify 20 components). (b) Opt-in controller option; Phase 2 machines opt in; ARCH §6 states both. (c) Keep `hostConnected`; slider `thumbAlignment: "center"` [unprobed]; accept dead press tracking.
- **Notes:** R1 rec 2 `:519-526` recommends starting after first render (default), alternatives (b), (c).
- **Mine:** (b) — fixes every Phase 2 machine without touching 20 shipped components; revisit the default at the Phase 2 exit.

#### D9 — ARCH §15.1 native-node table for Checkbox, Switch, Radio, Slider, Select
- **Q:** Do Checkbox/Switch/Radio keep Zag's hidden native input as the accessible control (SD31's inner-native rule) or move the role to the host via `ElementInternals`?
- **Changes:** ARCH §15.1 `:1337-1339` (and the DateInput row via D15).
- **Evidence:** R1 X2 `:563`, §2.3 `:152-156` (hidden input is focus/keyboard/AT node, P5/P7/P8); R3 §2.4 `:106-107` (internals roles invisible to Playwright and axe); R3 §2.9 `:172` (Linux WebKit `ignored` difference under host role).
- **Options:** (a) Keep hidden native input; §15.1 gains a row "hidden native input for focus/AT; `ElementInternals` for the form; inner input never joins the form". (b) Host role via `ElementInternals`. 
- **Notes:** R1 Q5 open; R3 Q10 open (notes verification gap of (b)).
- **Interactions:** D12 (what the labelling hand-off reaches); D6 radio item shape; B: switch `role="switch"` (R1 Q6).
- **Mine:** (a) — verifiable in all test tools and consistent with SD31.

#### D10 — C3 scope: unprefixed events that cross the shadow boundary
- **Q:** Does C3 ("no component dispatches an unprefixed `input`/`change`") cover trusted composed `input`/`beforeinput` from inner controls and Zag Select's synthetic composed `change`?
- **Changes:** ARCH §17.2 C3 `:1578`.
- **Evidence:** R1 §2.5 `:204-236`, X3 `:564` (Select `change` composed, fires on programmatic/reset changes too); R3 §2.5 `:139`, contradiction 6 `:302`.
- **Options:** (a) C3 covers what component code (incl. its machine) dispatches: stop Select's `change` at the shadow root; trusted UA `input`/`beforeinput` pass and are documented. (b) Stop every unprefixed composed event at the shadow root. (c) Leave C3; document Select's `change`.
- **Notes:** R1 rec 5 `:536-538` recommends stopping Select's `change`; trusted `input` open.
- **Interactions:** D11 (a) relies on native `input`/`focusin` reaching Field — (b) would break it; htmx `hx-trigger` on the host.
- **Mine:** (a) — keeps the Field native-event contract and removes the only machine-made unprefixed event.

#### D11 — Field-compatible contract (ARCH §9)
- **Q:** Which events must a Field-compatible control emit, and are native controls Field-compatible?
- **Changes:** ARCH §9 `:484`, `:493-498`; plan §5.7 row 6 `:440` resolved here.
- **Evidence:** R3 §2.5 `:120-139` (focus/blur/focusin/out, beforeinput/input cross; `change` does not; `invalid` capture only; no platform `valid` event); contradictions 2–3 `:298-299`; §2.6 `:145` (FACE matches `:read-only` always, never `:required`).
- **Options:** (a) Field detects focus, value and validity from native events + `validity` re-read for any control; required line events: `line-change`/`line-input` (C3/C9) + one validity-change event for changes no user event signals; `line-focus`/`line-blur` dropped. (b) Keep §9 list as required emits (native controls excluded, against §16.2 `:1460`, MANIFESTO `:23`, PRD `:132`). (c) Both: line events optional, native authoritative.
- **Notes:** R3 rec 5 `:281-283` recommends (a).
- **Interactions:** D2 (a) and D1 rely on native controls in Field; D10; R9 Q6 (Field learning fieldset-disabled) → B; R6 (A2UI checks need the validity-change event).
- **Mine:** (a) — the only option that satisfies Principle 3's "any control".

#### D12 — Labelling mechanism across the shadow boundary (ARCH §9 `:487`)
- **Q:** Does ARCH §9 name the mechanism now (element reflection with a standard-property hand-off), or keep deferring to the Field spec after correcting its facts?
- **Changes:** ARCH §9 `:487` (facts wrong in any case, see C); C5 `:1580` cross-reference.
- **Evidence:** R3 TL;DR `:11-13`; §2.3 `:92-96`; contradiction 1 `:297`: reflection names the inner input in 3 engines (WebKit description unobservable); host `aria-labelledby` fails in Chromium too; reference target Chromium-only; Zag `spreadProps` clears reflection on later spreads.
- **Options:** (a) Name reflection + hand-off through `control.ariaLabelledByElements/ariaDescribedByElements`; line controls override the accessors and forward to the role element; rendering must not write `aria-labelledby/-describedby` on the role element. (b) Keep deferral, fix facts only. (c) Reference target (outside PRD browser target `:164`). (d) String copy (Button-style).
- **Notes:** R3 rec 1–3 `:270-279` recommends (a).
- **Interactions:** D9 (role element), D4 (property writes on author DOM), D1 (a) (native controls consume directly), D32 (Firefox crash on reflection reads in tests).
- **Mine:** (a) — every Phase 2 control must implement the accessor override, so it is an ARCH rule over a set (plan §5.3), not a Field-only detail.

#### D13 — `data-error` vs `data-invalid` (ARCH §9, §14.8)
- **Q:** Two attributes with two meanings, a Field mirror, or one name? And Avatar's `data-error`?
- **Changes:** ARCH §9 `:480`, `:483`; §14.8 `:1238` (per-component meaning).
- **Evidence:** R3 §2.7 `:148-160`, contradiction 5 `:301`; R2 rec 2 `:394-400` (error-after-interaction is the component's own `:state()`).
- **Options:** (a) Control `data-invalid` = validity (C4); Field `data-error` = shown error (explicit prop or invalid-after-interaction); §14.8 `error` row states per-component meanings, Avatar unchanged. (b) Field also mirrors `data-invalid`. (c) One name.
- **Notes:** R3 rec 6 `:284-287` recommends (a).
- **Mine:** (a) — the two facts differ before first interaction; `:has()` already covers the mirror.

### Round 3 — Components

#### D14 — Select "with search"
- **Q:** Reword PRD §4.2 to typeahead, add combobox semantics to Select, or move Combobox into Phase 2?
- **Changes:** PRD `:287`, `:325`, `:1024`; ARCH §17.3 `:1623` (ChoicePicker `filterable`).
- **Evidence:** R4 §2.2, TL;DR `:13`, X2 `:321`: `@zag-js/select` 1.49.0 has typeahead, no search; a filter input inside the content lacks combobox semantics.
- **Options:** (a) Typeahead only; filtering is the Phase 4 Combobox; `filterable` ChoicePicker renders unfiltered in Phase 2. (b) Combobox semantics in Select. (c) Combobox joins Phase 2 (PRD §7.4 16th component).
- **Notes:** R4 rec 6 `:304-306` (a); R6 rec 6 `:285` maps `filterable` single to Select only "if R4 gives it search" (conflict K3).
- **Mine:** (a).

#### D15 — DateInput shape and tier
- **Q:** Pre-built contenteditable spinbuttons, hybrid native segments, custom machine, or masked single input?
- **Changes:** PRD `:280` ("Masked date field"), `:959`; ARCH `:416`, `:617`, `:622`, §15.1 `:1332`, §16.2 `:1428`, §16.3 `:1522-1523`; plan §2.1/§5.5 `:404` (tier settled here).
- **Evidence:** R5 §2.2, TL;DR `:11-14`; §2.8 table `:213-220`; R1 §2.3 `:161-163` (works in a shadow root, P18); R5 §2.4 / R8 §2.3 (16.5 KB marginal).
- **Options:** (a) Pre-built `@zag-js/date-input` (proven identical in 4 builds; ASCII-only digits, IME residue, English "Empty", `body` live region). (b) Hybrid native segments (Chromium caret fix; IME gap stays). (c) Custom machine (weight unmeasured; non-Gregorian needs `@internationalized/date` or Temporal, not in Safari). (d) Masked single input (loses per-field semantics; still custom).
- **Notes:** R5 rec 1 `:303` (a).
- **Interactions:** D21 weight; D4/D7 (live region, strings); R5 rec 2–5 → B.
- **Mine:** (a) — locale/calendar/RTL already proven; its gaps sit at the host boundary stream F owns.

#### D16 — PasswordInput tier and the §4.2/§7.4 wording
- **Q:** Settle PasswordInput's tier now, or keep "the Phase 2 spec settles" and align PRD §7.4 to §4.2?
- **Changes:** PRD `:278`, `:958`; ARCH `:416`; plan §5.7 row 7 `:441`.
- **Evidence:** R1 §2.3 `:147`, `:157-160` (machine holds only `visible`; reset/submit hide lost in a shadow root); R8 §2.3 (1,678 B).
- **Options:** (a) Keep spec-settles; PRD §7.4 `:958` reads as §4.2. (b) Settle pre-built now. (c) Settle custom now.
- **Notes:** none. **Mine:** (a) — no note recommends a tier; DateInput's tier follows D15.

#### D17 — Phase 4 DatePicker composition
- **Q:** Keep `<line-date-input slot="trigger">` or move DateInput to a field slot with a picker-owned trigger?
- **Changes:** ARCH §13.4 `:623-624`; PRD `:1038`.
- **Evidence:** R5 §2.7 `:196-211`, §5 item 2 `:332`: Zag's trigger is a `<button aria-haspopup="grid">`, the field a separate part; React Aria and APG pair a field with a separate button.
- **Options:** (a) Field slot (e.g. `slot="input"`), picker owns trigger and anchor. (b) Keep wording; Phase 4 spec settles.
- **Notes:** R5 rec 8 `:324` (a). **Mine:** (a) — the current text puts popup semantics on a spinbutton group; MANIFESTO/PRD principle 3 stay true.

#### D18 — Time-only A2UI DateTimeInput
- **Q:** Time-only `<line-date-input>` via the 1.49.0 `formatter`, an inert placeholder until a Time Picker, a native `<input type="time">`, or wait for Zag 2?
- **Changes:** plan §2.4 `:127-128`, §5.5 `:411`; ARCH §17.3 `:1625`.
- **Evidence:** R5 §2.5 `:160`, §2.6 `:185-194` (formatter path commits today's date; machine bounds compare dates only); R6 §2.3 `:109`.
- **Options:** (a) Formatter time-only mode (R5). (b) Unmapped placeholder + `line-a2ui-error` (R6). (c) Native time input with `form=""` (no C4 path). (d) Zag 2 `maxGranularity`.
- **Notes:** R5 rec 7 `:322` (a) vs R6 rec 9 `:288` (b) — **conflict K1**.
- **Mine:** (b) — the plan already says "no Phase 2 target", and (a) widens DateInput beyond its PRD row with a value that carries a date.

#### D19 — Fieldset shape and disabled propagation
- **Q:** Which R9 §2.10 mechanism does `<line-fieldset>` use, and does "disabled from an ancestor `fieldset`" mean a native fieldset?
- **Changes:** PRD `:283` (and `./fieldset` entry); ARCH §14.4 `:972-984`, §14.7 `:1160`, §17.3 `:1623`; plan §2.3 `:115`, §7.1 `:472`.
- **Evidence:** R9 TL;DR `:11-32`: shadow `<fieldset disabled>` disables nothing slotted (P1); light-DOM fieldset gives full parity through wrappers (P2); `inert` still submits; `is=` fails in WebKit.
- **Options:**

  | | What changes | Cost |
  |---|---|---|
  | (C-wrap) `<line-fieldset>` wraps an authored native `<fieldset>`, reads it, never writes | ARCH §14.4/§14.7 (reset sheet scope), PRD row kept | Light-DOM fieldset/legend styled directly, not `::part()` (Law 1); surface must create the native fieldset (O7 (a)) |
  | (C-none) documented native `<fieldset>` pattern, no element | PRD §4.2 row and `./fieldset`, ARCH §17.3 O7 (a) | Catalogue change |
  | (B) shadow fieldset + script writes `disabled` on slotted controls | — | Law 5 (D4 (b) needed); re-implements nesting, legend, late insertion |
  | (A) grouping only | PRD `:283` drops "disabled propagation" | Scope cut |
- **Notes:** R9 §2.10 `:259-264`, Q1 recommend C-wrap.
- **Interactions:** R1 rec 4 (Zag fieldset tracking stays inert unless a template adds a shadow fieldset); R6 §2.4 `:133` (host fieldset disables `form=""` controls); D11/B (Field learning disabled); Law 1 reading for light-DOM fieldset/legend.
- **Mine:** C-wrap — the only mechanism with parity in 4 builds that writes no author state; plan §7.1 criterion reads "a native `<fieldset>` ancestor, including one inside `<line-fieldset>`".

#### D20 — Reset sheets for controls without a shadow native element
- **Q:** What happens to `reset.select.css`, `reset.range.css`, `reset.fieldset.css` and the §14.7 mapping?
- **Changes:** ARCH `:686`, `:875`, `:894`, `:972-984`, `:1156`, `:1158`, `:1160`; plan §5.7 rows 2, 4.
- **Evidence:** R4 X5 `:324` (shadow sheet does not reach a slotted `<select>`); R9 §4 `:368-371`; R1 §2.3 (slider has a hidden text input, no range).
- **Options:** (a) Drop the components from the §14.7 mapping, keep sheets published for consumers. (b) Re-scope each sheet to a real scenario (fallback templates under D5; slotted natives under D1/D2 need `::slotted` or consumer CSS). (c) Remove the sheets (published change, own row).
- **Notes:** R4 Q4 lists options, no recommendation. **Mine:** (b) where D5 (a) gives a fallback template, else (a); decide after D1, D2, D5, D19.

### Round 4 — Packaging and size

#### D21 — What the < 5 KB soft target counts, and its unit
- **Q:** Does the report count the machine, and is 5 KB 5,000 or 5,120 B?
- **Changes:** PRD `:154`, `:166`; plan §7.1 `:481`, §8 `:517` (DateInput risk restated), §2.6 `:159-160`.
- **Evidence:** R8 §2.3 `:93-119` (under SD21 no machine is reported; marginals over B0: Checkbox 5,085, Switch 5,090, Slider 8,272, NumberInput 9,443, Select 26,738, DateInput 16,507); §2.6 `:170` (unit undefined; two machines between 5,000 and 5,120); R5 §5 item 5 `:335`; R8 gap 2 `:274-277`.
- **Options:** (a) Keep SD21 rows; add a per-machine table (marginal over baseline + split chunk); 1 KB = 1,000 B; GNU gzip (CI) as reference. (b) Record machine weights once in the spec. (c) Count component + machine per row (most pre-built rows fail).
- **Notes:** R8 rec 5–7 `:296-301` (a).
- **Interactions:** D15 (16.5 KB), D2 (26.7 KB); plan §8 risk row text depends on the choice (R5 vs R8 framing, K9).
- **Mine:** (a) — makes the pre-built cost visible without turning a soft target into a gate.

#### D22 — `@internationalized/date` arrival
- **Q:** `line-components` dependency, peer, or rely on Zag's unbounded peer?
- **Changes:** plan §2.6 `:159-160` (currently "pulls … as a peer").
- **Evidence:** R8 §2.5 `:162`, §2.7 `:175`; R5 Q11 `:353`.
- **Options:** (a) `dependencies` `^3.12.4`. (b) `line-components` peer (consumer installs once for DateInput and Phase 4 DatePicker). (c) Rely on the machine peer (package-manager dependent, unprobed).
- **Notes:** R8 rec 8 `:302-305` (a). **Mine:** (a) — the measured version is the one consumers get; the bare-specifier check stays green if line code imports it.

#### D23 — Zag version policy
- **Q:** Keep `^1.49.0` per machine or pin every `@zag-js/*` exactly?
- **Changes:** plan §2.6/§4.4 (stream P policy); `docs/` getting-started note.
- **Evidence:** R8 §2.4 `:150` (each machine pins internals exactly; mixed versions bundle two `@zag-js/core`, probe 3.3).
- **Options:** (a) Exact pin across `line-core` and `line-components`, bumped together. (b) Carets + a docs rule to keep Zag aligned. (c) Carets, no rule.
- **Notes:** R8 rec 10 `:307` none. **Mine:** (a) — the shared chunk R8 measured exists only with one version.

### Round 5 — A2UI v1.0 and the surface

#### D24 — Data-model write-back timing (binding map)
- **Q:** Do the five form types write the data model on `line-input` as well as on the C9 commit event?
- **Changes:** ARCH §17.3 `:1592` (binding map gains a live-event member); plan §2.4/§4.3.
- **Evidence:** R6 TL;DR `:14`, §5 item 1 `:297` (A2UI v0.9.1/v1.0 require immediate writes; surface writes on commit only).
- **Options:** (a) Write on `line-input` and `line-change`. (b) Commit only, documented departure.
- **Notes:** R6 rec 4 `:283` (a). **Mine:** (a) — conformance with both protocol versions; C9 unchanged.

#### D25 — v1.0 `line` catalog shape in ARCH §17.3
- **Q:** Own v1.0 catalog id + per-version schemas derived from one declaration, or one processor per version / hand-written v1.0 schemas? One session for both envelopes?
- **Changes:** ARCH §17.3 `:1597`, `:1602`, `:1604-1606`; PRD `:974`, `:985` (costs stated).
- **Evidence:** R6 §2.5 `:164-170` (v0.9 Zod schemas reject `@path` under a v1.0 catalog; two catalogs under one id leave v1.0 surfaces on v0.9; `addCatalog` rejects duplicate ids); §5 items 2, 7 `:298`, `:303`.
- **Options:** (a) New v1.0 `line` id; schemas from one declaration via `web_core/v0_9` and `/v1_0` common types; v1_0 basic id registered; one session, per-version data-model call. (b) One processor/session per protocol version. (c) Hand-written v1.0 schemas.
- **Notes:** R6 rec 11 `:290` (a); session shape open (Q13). **Mine:** (a) with one session — PRD `:985` "surface renders both protocol versions" reads as one surface API.

#### D26 — `<line-field>` around every checkable form type
- **Q:** Wrap all five types in `<line-field>` so C4's error slot exists, or TextField only with a surface-owned error element?
- **Changes:** ARCH §17.3 `:1621-1625`; C4 `:1579`.
- **Evidence:** R6 §5 item 4 `:300`, TL;DR `:13`.
- **Options:** (a) All five wrapped. (b) TextField only + surface error element (`aria-describedby`), outside the C4 Field contract.
- **Notes:** R6 rec 3 `:282` (a).
- **Interactions:** D11/D12 (Field must label a CheckBox whose name comes from its own slotted text — R3 F14); R2/R6 Q4 first-render error → B.
- **Mine:** (a).

#### D27 — Agent Button and failing checks
- **Q:** Does the surface disable an agent Button while its `isValid` is false, as A2UI requires?
- **Changes:** ARCH §17.3 `:1620`; a Phase 2 G row against the Phase 1 surface.
- **Evidence:** R6 §5 item 3 `:299` (both protocol versions; Phase 1 surface ignores checks, P6).
- **Options:** (a) Disable (conformance). (b) Documented departure; rely on controls' C4 validity.
- **Notes:** R6 rec 10 `:289` (a). **Mine:** (a).

#### D28 — v1.0 basic Text headings
- **Q:** Map leading Markdown heading markers to `<h1>`–`<h5>`, render literal text, or require a Markdown renderer for v1.0?
- **Changes:** ARCH §17.3 `:1614`, `:1644`.
- **Evidence:** R6 §2.5 `:161`, §5 item 5 `:301` (v1.0 Text `variant` is `caption`/`body`; headings move to `## ` markers).
- **Options:** (a) Map `#`–`#####` prefixes to headings without a renderer. (b) Plain text (literal `##`) unless the consumer opts into Markdown. (c) v1.0 requires a Markdown renderer.
- **Notes:** none (R6 Q14). **Mine:** (a) — keeps Phase 1 heading semantics on v1.0 at the cost of a one-rule prefix parser.

### Round 6 — Showcase, theming, tooling leftovers

#### D29 — Contrast bar: PRD §5.2.1 vs the shipped gate
- **Q:** PRD says 4.5:1 over role pairs; Phase 00 AM-014 / `validate-contrast` gates one pair at 3:1 with an orange allowlist; primary Button label fails 4.5:1 on 34/62 hue × mode pairs. Which is the library bar?
- **Changes:** PRD `:556`; possibly Phase 00 spec AM-014 and `line-tokens`/`line-colors` (own row).
- **Evidence:** R10 TL;DR `:13`, §2.5 table `:151-158`, gap 1 `:272`; MANIFESTO Law 3 `:43`.
- **Options:** (a) PRD restates the shipped gate; showcase shows a computed readout + documented axe exclusion. (b) Library row to meet 4.5:1 for normal-size labels (per-hue contrast text or larger label); PRD keeps 4.5:1. (c) Narrow accents to the 11 passing hues (scope cut).
- **Notes:** R10 Q4 `:281-284` recommends readout + exclusion for the showcase; names "settle gap 1 first" as an option.
- **Mine:** (b) plus R10's readout meanwhile — Law 3 makes AA non-negotiable for shipped components; lowering the PRD to the gate inverts the hierarchy.

#### D30 — Focus ring step (plan §5.7 row 9)
- **Q:** PRD says step 7; tokens ship `--line-accent-8`; R10 measures the shipped ring below 3:1 on 196/372 combinations (min 1.86).
- **Changes:** PRD `:1290`, `:1424`; `packages/line-tokens/src/focus-ring.css:16` (own row).
- **Evidence:** R10 §2.5 `:158`, `:164`.
- **Options:** (a) PRD follows step 8 (gap documented). (b) Code follows step 7 (lower contrast [INFERENCE]). (c) PRD states the SC 1.4.11 3:1 requirement; a token row picks the step that meets it, measured with R10's method.
- **Mine:** (c) — both current values fail the bar the ring exists to meet.

#### D31 — Showcase scope, placement, theming target, sequencing
- **Q:** R10 options (a)/(a)+readout/(b)/(c); `/theming/` route or landing section; scoped preview or whole page; html-scoped ring/gradient/highlight/SVG tokens (site CSS vs moving them to theming scopes); one S row after the five controls vs incremental rows.
- **Changes:** plan §2.8, §4.6, §6 `:456` (only if incremental); PRD §5.3 `:585`; PRD §9.4 `:1369` qualification (gap 2).
- **Evidence:** R10 §2.6 `:188-205`, §2.4 `:132-145`, gap 2 `:273`.
- **Notes:** R10 recommends (a) + contrast readout, `/theming/`, scoped preview with site ring recomposition, one S row.
- **Mine:** R10's set; PRD §9.4 gains one sentence that ring/gradient/highlight/SVG tokens resolve on `html`.

#### D32 — Firefox crash with Playwright 1.65.1 (Mozilla bug 2090055)
- **Q:** Add a plan §8 risk and a test rule now, and take Playwright 1.66 (Firefox ≥ build 1575) when it ships?
- **Changes:** plan §8, §5.3; stream P row under O4 (c).
- **Evidence:** R3 §2.8 `:162-168`, rec 7 `:291`: reading `ariaLabelledByElements` (or axe) plus a role locator crashes Firefox build 1572.
- **Options:** (a) Risk row + rule (no main-world reflection read or axe with a role locator on one Firefox page) + Playwright 1.66 row. (b) Skip Firefox axe for Field-related rows until 1.66. (c) No action.
- **Mine:** (a) — the Field (stream C, first wave) hits it immediately.

#### D33 — Stale Phase 1 spec → Phase 00 spec locators: where they land
- **Q:** Fold the factual Phase 1 spec AM into this revision's commit (PROCESS §3 "aligned in the same commit"), or open a separate Z row as AM-104 left them?
- **Changes:** `docs/specs/01-spec-core-primitives.md` `:847`, `:988-989`, `:2481` (see C29).
- **Options:** (a) Same commit, factual AM. (b) Separate row.
- **Mine:** (a) — same document pass, no decision content.

---

## 2. (B) Questions left to the Phase 2 spec (§10 later rows)

- **R1** (§7 `:574-602`): Q3 trusted `input` handling detail (after D10); Q6 switch `role="switch"`; Q7 NumberInput attribute format and `valueAsNumber` event; Q8 multi-value submission (`FormData` entries; `null` without `name`); Q9 zag#3239 fix (`position: fixed` hidden radio + `preventScroll`); Q10 PasswordInput hide on owner reset/submit; Q11 shared-layer API (initial value at connect, reset, disabled into props, fallback); Q12 tier inputs; rec 1 `id` + `getRootNode` in every props function; rec 8 NumberInput applies initial value once; rec 4 Zag fieldset tracking left inert vs overridden (also R9 Q5).
- **R2** (§6 `:436-449`): Q4 what sets the error-after-interaction state and its name; Q5 what "restore where supported" proves; Q6 identity-stamped string state; Q8 rule "composed line form controls stay in light DOM"; Q9 validation messages (engine text vs consumer); Q10 fix `form-associated.ts:48` comment (stream F); Q11 x86_64 Linux WebKit via stream F tests; Q12 password managers best effort + manual check; rec 1 validity computed in the layer (`v`-flag pattern, anchor timing); rec 3 reset everything in `formResetCallback`.
- **R3** (§7 `:309-321`): Q2 Zag label part rendered or replaced; Q3 `<label for>` vs click forwarding, named `generic` host; Q4 `detail` types and `composed`; Q5 validity-change event name; Q6 `<line-field error>` visual only or sets validity/`aria-invalid`; Q8 uniform `required`/`readOnly`/`value` reads; Q9 reference target later; Q10 host roles (after D9); Q11 engine-tree assertions, private WebKit path; Q12 slotted label text rule; Q13 Linux x86_64 check.
- **R4** (§6 `:338-345`): Q5 family part/props split; Q6 implicit anchor vs Zag popper, RTL, dialog stacking; Q7 zag#3088 remedy per component vs shared `line-core` helper; Q8 Tab trap vs APG keyboard; Q9 form value through `ElementInternals`, hidden `<select>` not rendered/named; Q10 surface render root; rec 7 required tests (Linux WebKit click, four focus cases, dialog, flip, RTL).
- **R5** (§6 `:343-355`): Q2 ISO form value, empty while incomplete; Q3 range via component validity, time bounds; Q4 IME/digit normaliser; Q5 "Empty" and live region `root`; Q6 iOS VoiceOver pass; Q7 screen-reader verification; Q9 A2UI flag defaults (both `false`); Q12 range selection out of Phase 2; Q13 static fallback; `createCalendar` opt-in (rec 9).
- **R6** (§6 `:312-326`): Q1 surface rule (`form=""` on every surface-created FACE, Button included — plan §5.5/§7.2 make it a spec rule; can be pulled forward); Q3 checks → validity message, warnings, required indicator; Q4 first-render error vs interaction state (with R2); Q6 value adapters (basic-map per type vs binding-map transform); Q7 ChoicePicker matrix and when Select renders; Q8 `validationRegexp`, `obscured` autocomplete and security review; Q9 missing labels; Q10 Slider `step` default and rounding; Q11 ISO forms per flag; Q15 `web_core` 0.16.1 pin AM (double report, catalog mixing, versioned data model, function set, pin test).
- **R7** (§7 `:529-555`): Q5 `:not(:defined)` warning in forms guide; Q6 SSR-tolerant authoring rule (§6.3 (a)); Q7 lazy `line-core` sheets (own row); Q8 Avatar/AvatarGroup/Badge SSR rows; Q9 hydrate-support docs; Q10 framework notes; Q12 R1/R2 probes on slotted-native anatomy (after D1).
- **R8** (§6 `:287-309`): rec 1 independent entries and tags; Q2 item tag names (after D6); Q7 report baseline row (`export *` + correct comment); Q11 CDN import map derived from dependency closure; Q12 shared wrappers for Range Slider/Segmented Control.
- **R9** (§6 `:404-433`): Q2 `reset.fieldset.css` placement (after D19/D20); Q3 non-FACE controls under a disabled Fieldset (SD36); Q4 layer owns combined disabled state, never writes host `disabled`; Q6 Field learns fieldset-disabled; Q9 assertions (`:disabled`, focus refusal, `FormData`); Q10 CI run before WebKit claims.
- **R10** (§6 `:276-292`): Q5 control mapping; Q6 auto-pair source (site copy vs `line-schemas` export, own row); Q7 CSS delivery; Q8 query string and first-paint script; Q9 controls inside/outside the themed scope; Q11 requirements into component specs (Select groups/slotted items, Radio Group disabled, Toggle Group `deselectable: false` and detail shape, Slider `line-input`); Q12 axe combinations and baselines.
- **Plan §5.5 carry-overs with no note:** control size scale; consumer-supplied labels of internal parts.
- **Miguel, outside the documents:** file Firefox restore misroute (R2 Q6); re-report zag#3088 (R4 Q7); file zag#3239 probe (R1 Q9); file date-input digits/IME, "Empty" key, live-region `root` (R5 rec 3–5); real-device mobile check policy (R4 Q11); iOS VoiceOver pass (R5 Q6); password-manager manual check (R2 Q12); accept private WebKit inspector path (R3 Q11); clarify "(G1)" if it meant something else (R4 Q12).

## 3. (C) Factual corrections (no fork; the revision just fixes them)

| # | Fix | Where | Source |
|---|---|---|---|
| C1 | "HTML5 validation … works natively" is false for a FACE host | ARCH `:393` (plan §5.7 row 1) | R2 C3, R7 §5 item 3 |
| C2 | "`<line-button type=reset>` resets all form controls" → platform only runs each `formResetCallback` | ARCH `:392` | R2 C4 |
| C3 | `:user-invalid` "never matches" → Chromium/WebKit never; Firefox matches from load | plan `:264`, `:409`, `:514` | R2 C1, R3 contr. 4 |
| C4 | "WebKit restores only a string" → string or `FormData` of strings; only `File` unsupported; never for autocomplete (all engines) | plan `:264`, `:515` | R2 C2 |
| C5 | Autofill animation trick "works across all browsers" → observed in Chromium only; PRD Input "Detects autofill" qualified (spec verifies others if kept) | ARCH `:1377`; PRD `:277` | R2 C5 |
| C6 | Zag "against the locked 1.47.0" → lock is 1.49.0 since 01-Z14 | plan `:276` | R1 X7 |
| C7 | Zag 1.47.0 named as machine version → 1.49.0 | ARCH `:416`, `:605` (plan §5.7 row 8) | R1 X7, R5 §5 item 7 |
| C8 | Vite 8.3.4 / Rolldown `~1.2.12` → Vite 8.3.8 depends on `~1.2.18` (`bun.lock:1885`; lock resolves `rolldown@1.2.19`, `:1739`) | PRD `:199` | routed |
| C9 | `@zag-js/field`/`fieldset`: npm `latest` = 2.0.0-next.4, `next` = 2.0.0-next.2 | plan `:79-80`, `:184` | R1 X8, R9 §5 item 5 |
| C10 | "(G1)" undefined → "(plan §5.7 row 2)" | plan `:266` | R4 X9 |
| C11 | zag#3088 risk widened: any non-pointer focus move while root node is a `ShadowRoot`; no `focusin` tracking on touch | plan `:513` | R4 X6, R1 §2.6 |
| C12 | `web_core` 0.15–0.16 risk realised: 17/571 tests (18 with pin assertion), Storybook Alert fixture | plan `:518` | R6 §5 item 6 |
| C13 | DateInput size risk restated (cause and likelihood per D21) | plan `:517` | R5 §5 item 5, R8 gap 2 |
| C14 | ARCH §9 label facts: host `aria-labelledby` fails in Chromium too; host role leaves inner input unnamed; reference target forwards only references to the host | ARCH `:487` | R3 contr. 1 |
| C15 | `line-valid` missing from the Field-compatible list (resolved by D11) | ARCH `:484`, `:494` | R3 contr. 3 |
| C16 | `:disabled` also matches a FACE inside a disabled light fieldset | ARCH `:1244` | R9 contr. 2 |
| C17 | `<option>` "cannot be styled in any browser" → styled in Chromium 159 / WebKit 27.2, not Firefox 159 | ARCH `:1450`, `:1525` | R4 X3 |
| C18 | "via Popover/floating positioning" → HTML `popover` + anchor positioning, no Phase 3 component | ARCH `:1452` | R4 X4 |
| C19 | Touch row: Zag's focus-outside tracking is off on touch and broken in shadow roots | PRD `:171` | R4 X8 |
| C20 | `line-number-field` → `line-number-input` (PRD spec link `0036-number-input.md` outranks ARCH) | ARCH `:1297` (plan §5.7 row 5) | R8 gap 5 |
| C21 | NumberInput `pattern="[0-9]*"` contradicts locale-formatted display; state machine-readable submission (`String(valueAsNumber)`) and Zag's `inputMode` [INFERENCE: inputmode not probed] | ARCH `:1444` | R1 §2.8 |
| C22 | Steppers are rendered parts, not custom elements | ARCH `:1444` | R8 gap 6 |
| C23 | Slider "no native element" vs `reset.range.css` (wording follows D20) | ARCH `:894`, `:1158`, `:1337-1339` | plan §5.7 row 4 |
| C24 | DateInput "Masked" wording (follows D15) | PRD `:280`; ARCH `:617`, `:622` | R5 §5 item 1 |
| C25 | `formStateRestoreCallback` "(navigation or autofill)" → never autofill | `packages/line-core/src/form-associated.ts:48` (stream F) | R2 C6 |
| C26 | Notes' PRD locators are v0.8.36: add +1 for lines after the revision log | all ten notes | `git show b940d1c` |
| C27 | R10 cites SD98 at `:2472`; SD98 is `01-spec:2481` (SD89 sits at `:2472`, also at `9c9b1f4`) | R10 `:263` | checked |
| C28 | §12 entry list lacks the six components (fix per D6 rule-vs-list) | ARCH `:586` | R8 gap 4 |
| C29 | **Stale Phase 1 spec → Phase 00 spec locators, still stale at `b940d1c`** (Phase 1 spec lines are +7/+8 against the routed numbers): `01-spec:847` cites `00-spec:1866-1867` for "Storybook analyze (CEM)" — that line is "Layer lint" and no step of that name exists (nearest "Storybook build" `:1880` [INFERENCE: successor]); `:989` cites `:1678-1680` for the `names` derivation — now Theme toolbar text; correct `:1696`; `:989` cites `:1260` for §6.D.5 — now `direction.ts`; correct `:1272-1274`; `:2481` (SD98) cites `:2636-2642` for Phase 00 D3 — now §7.2 Versioning; correct `:2796-2802`. Same stale target also at `:2528`, `:2532` (AM rows; historical) and `:988` (`:1704-1728` → bun-test-preload block now `:1719-1756`) | Phase 1 spec | routed; AM-104 `:2601` |
| C30 | `reset.select.css` "`<select>` in shadow DOM" scenario does not submit (wording follows D20) | ARCH `:686`, `:875` | R4 X5 |
| C31 | Plan §5.7 gains the Input/Textarea half of the Law 8 gap (resolved by D1) | plan `:436` | R7 §5 item 1 |

## 4. Conflicts between notes

| # | Fact or recommendation | Note A | Note B |
|---|---|---|---|
| K1 | Time-only DateTimeInput target | R5 rec 7 `:322`, Q8 `:350`: formatter time-only mode (recommended) | R6 rec 9 `:288`: unmapped placeholder (recommended), `<line-date-input>` only "if R5 finds a time granularity" |
| K2 | Item elements for Radio/Toggle Group | R8 §2.2 `:54`, rec 2 `:288-293`: family with item tags; "whether item custom elements with shadow roots satisfy the queries is R1's question" | R1 §2.9 `:350-360` (P3, P11): already answered — slotted items need host-tree scope; a radio in an item's own shadow root does not group |
| K3 | `filterable` ChoicePicker → Select | R6 rec 6 `:285`: Select "if R4 gives it search" | R4 rec 6 `:304`: typeahead only, no search |
| K4 | DateInput marginal | R5 §2.4 `:135`: 16,566 B (named baseline 5,796) | R8 §2.3 `:104`: 16,507 B (B0 7,493) — reconciled by both (59 B baseline) |
| K5 | `@internationalized/date` share of DateInput | R5 TL;DR `:15`, §2.4 `:135`: 4,905 B | R8 TL;DR `:15`, §2.5 `:158`: 4,919 B — not reconciled; likely baseline [INFERENCE]. Raw `date-input` bytes 30,978 (R5 `:137`) vs 30,979 (R8 `:116`) |
| K6 | zag#3088 fix PR status | R1 §2.6 `:243`: "a third-party draft PR carries the patch" (present tense) | R4 §2.4 `:126`: PR #3093 stayed a draft, closed unmerged 2026-08-11 |
| K7 | WebKit click loss on re-render | R1 §2.12 `:414-418` (P17): Linux WebKit only | R4 TL;DR `:18`, §2.7: isolated case drops the click in WebKit on macOS and Linux; Linux-only in the Select because only Linux focuses on mousedown. R4 §2.4 "Earlier run" also saw macOS WebKit close on a light-DOM focus move, which R1 P16 did not |
| K8 | Select Tab behaviour | R4 TL;DR `:17`: Zag "swallows Tab while open" | R1 §2.6 `:271-275` and R4 §2.4 body: only when the content has no tabbable descendant |
| K9 | Plan §8 DateInput risk | R5 §5 item 5 `:335`: measured 3.3× target, likelihood understated | R8 gap 2 `:274-277`: holds or not depending on counting (SD21 keeps the machine external) |

No two notes disagree on: inner native inputs having no form owner (R1, R4, R7); `:user-invalid` in Firefox (R2 159; R3 159 and 161); surface light-DOM rendering and `form=""` (R6, consistent with R2 Q8, R9); Zag `field`/`fieldset` dist-tags (R1, R9).
