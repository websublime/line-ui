# Research: Select (R4)

**Row:** `01-Z19` (Phase 2 plan §5.1 R4)
**Date:** 2026-11-26
**Repo sources (at `origin/main` `9c9b1f4`):** `docs/plans/02-plan-essential-forms.md` §1, §2.1, §3, §5.1 R1, R3, R4, R7, R10, §5.3, §5.5, §5.7, §8; `docs/PRD.md` (v0.8.36) §1.7, §4.1, §4.2, §4.5, §7.4–§7.6; `docs/ARCHITECTURE.md` (v0.8.28) §7, §8, §12, §14.4, §14.7, §15, §16, §17.2, §17.3; `docs/MANIFESTO.md` Laws 4, 5, 7, 8, 9; `docs/specs/0013-portal.md` (P1–P13, F1); `docs/specs/0010-avatar-group.md` (P1, P10, D9, F1, AM-006); `docs/research/01-research-accessibility.md`; `docs/retrospective/01-phase-01-retro.md` (lesson 4); `packages/line-core/src/machine/line-machine-controller.ts`; `packages/line-components/src/portal/portal.ts`; `packages/line-components/src/avatar-group/avatar-group.ts`
**Toolchain (row 01-Z14 baseline):** Bun 1.4.5 (`/tmp/bun145`, the workstation `bun` is still 1.4.3), Node 22.23.5 (`/tmp/node-v22.23.5-darwin-arm64`), Playwright 1.65.1 from the worktree's `node_modules` with Chromium 159.0.8154.6, Firefox 159.0 and WebKit 27.2 (build 2388); Zag 1.49.0; Lit 3.3.3. Linux WebKit ran in `mcr.microsoft.com/playwright:v1.65.1-noble` (§3.1).
**Status:** Evidence. Research carries no rules (`docs/PROCESS.md` §1). Recommendations are marked "(recommended)". Every decision is an open question in §6, and every conflict with a higher document is listed in §5 and left unresolved.

> **TL;DR**
>
> - **Customizable `<select>` works in two of the three engines.** `appearance: base-select`, `::picker(select)`, `<selectedcontent>` and an in-page picker work in Chromium 159 and WebKit 27.2, on macOS and on Linux. They work in the document, inside a shadow root, and on a slotted light-DOM `<select>` styled from a shadow root through `::slotted(select)::picker(select)`. Firefox 159 has none of them: `dom.select.customizable_select.enabled` defaults to `false` on firefox-main, and the bug to enable it in Nightly is `NEW`. A Select built on the native element would look and behave differently in one of the three target engines.
> - **A native `<select>` inside a shadow root has no form owner.** One in the light DOM submits, under an undefined host and under a defined one. A no-JavaScript fallback for Select is therefore possible only as consumer markup in the light DOM.
> - **`@zag-js/select` 1.49.0 has typeahead and no search.** PRD §4.2's "Dropdown with search" is the APG editable combobox, and Combobox is a Phase 4 component. A filter input inside the Select's content does work mechanically. But focus then sits on an input with no combobox semantics and no active descendant, and with the default `composite` setting the input is a child of `role="listbox"`.
> - **The listbox reaches the top layer without the Phase 3 Popover component.** A `popover="manual"` box opened from machine state, as Portal and AvatarGroup did in Phase 1, escapes `overflow: hidden` and a transformed ancestor. It follows scroll, flips at the viewport edge, follows `dir="rtl"` and works inside a modal `<dialog>`, in all four runs. CSS anchor positioning places it when trigger and box share a tree. When they sit in sibling shadow trees, `showPopover({ source })` with `position-anchor: auto` places it. Zag's own popper also places it. A named anchor does not cross sibling shadow trees.
> - **zag#3088 is still present at 1.49.0.** It was closed `not_planned`, and its fix PR #3093 was closed unmerged. Whenever the machine's root node is a `ShadowRoot`, a focus move that a pointer did not cause leaves the listbox open, in all four runs. Two facts cause it. A focus move between two elements of one shadow tree fires no `focusin` on the document, and interact-outside reads `composedPath()` one frame after dispatch, when it is empty. A host `focusout` listener that sends `CLOSE` with `restoreFocus: false` fixes every case. When the whole family lives in the document tree, the bug does not occur. Inside a consumer's shadow root it does. On a touch device, which Zag detects through `maxTouchPoints`, Zag registers no `focusin` listener at all.
> - **Cross-root ARIA decides the anatomy.** A shadow-root listbox cannot point `aria-activedescendant` at light-DOM options by ID; element reflection works in all three engines. Zag writes string IDs and looks elements up with `getRootNode().getElementById`. The ARCHITECTURE §12 family (`line-select`, `-trigger`, `-content`, `-item`, `-group`) as light-DOM elements keeps every reference in one tree. A probe of that shape passed every behaviour in all four runs.
> - **Zag's Select differs from the APG select-only combobox.** It moves DOM focus to the listbox, swallows Tab while open, and has no Page Up or Page Down. It costs 26,738 B gzipped on top of the Zag core and vanilla runtime that `line-core` ships (R8's B0 measurement). With all six shared Zag packages left out of the bundle, it still costs 22.8 KB, and 10.2 KB of that is the popper, which the machine imports statically.
> - **Mobile.** Emulation shows touch input, a coarse pointer and the in-page `base-select` picker. It cannot show the iOS or Android native pickers, Mobile Safari, a screen reader or a real `maxTouchPoints` on WebKit. **Linux WebKit** focuses a button on mousedown where macOS WebKit does not. WebKit on both platforms drops the click when a render replaces the pressed text node before mouseup.

---

## 1. Question

Plan §5.1 R4: "Native or custom against MANIFESTO Law 8 and ARCHITECTURE §15–§16 (G1); 'with search' (PRD §4.2) vs typeahead and the Phase 4 Combobox; the listbox in the top layer without Popover (Phase 3), through what Portal proved in Phase 1; mobile; zag#3088" (`docs/plans/02-plan-essential-forms.md:266`). Plan §5.3 requires every behaviour claim to be probed in three engines, with Linux WebKit before a WebKit claim holds (`:291-296`).

| # | Sub-question |
|---|---|
| Q1 | Native or custom: what each engine supports at the baseline, customizable `<select>` included, and how each option meets MANIFESTO Law 8 and ARCHITECTURE §15–§16 |
| Q2 | "With search" against typeahead and the Phase 4 Combobox |
| Q3 | The listbox in the top layer without the Phase 3 Popover, through what Portal (and AvatarGroup) proved in Phase 1 |
| Q4 | zag#3088 at Zag 1.49.0: is it still there, why, and what fixes it |
| Q5 | The anatomy that ARIA and Zag allow across the shadow boundary |
| Q6 | Mobile: what can be emulated and what cannot |

"G1" is not defined in the plan, in the plan's history (`git log -S'G1' -- docs/plans/02-plan-essential-forms.md` returns only the 01-Z11 commit) or in ARCHITECTURE §15–§16. This note reads it as the Select row of the plan's §5.7 gap table (`:436`), which names the same conflict [INFERENCE] (§6 Q12).

## 2. Findings

### 2.1 Q1 — Native or custom

**What the documents say.**

| Document | Statement |
|---|---|
| MANIFESTO Law 8 | "Components that wrap native controls (Input, Textarea, Select) remain functional in light DOM fallback when feasible" (`docs/MANIFESTO.md:53`) |
| PRD §1.7 | The same requirement, "without JavaScript via light DOM fallback where feasible" (`docs/PRD.md:172`) |
| PRD §4.2, §7.4 | Select is "Pre-built", "Dropdown with search, groups, and keyboard navigation" (`docs/PRD.md:286`, `:965`) |
| ARCHITECTURE §15.1 | Select is among the components that "do NOT need a native element" and use `ElementInternals` and custom rendering (`docs/ARCHITECTURE.md:1339`) |
| ARCHITECTURE §16.2 | "`<option>` elements … cannot be styled with CSS in any browser" (`:1450`). "`<line-select>` does NOT use a native `<select>` element … custom dropdown via Popover/floating positioning (Zag.js select machine)" (`:1452`). Mobile pickers are a "documented trade-off", and a consumer who wants them uses a native `<select>` in `<line-field>` (`:1458-1460`) |
| ARCHITECTURE §16.3 | "Avoid — fully custom dropdown, no native `<select>`" (`:1525-1526`) |
| ARCHITECTURE §14.4, §14.7 | `reset.select.css`, "Select (native fallback scenarios)", "Components with `<select>` in shadow DOM", mapped to Select (`:686`, `:875`, `:1156`) |

**Platform state at the baseline (P1).**

| Capability | Chromium 159 | Firefox 159 | WebKit 27.2 macOS | WebKit 27.2 Linux |
|---|---|---|---|---|
| `CSS.supports('appearance: base-select')` | true | false | true | true |
| `::picker(select)`, `::checkmark`, `::picker-icon` selectors | true | false | true | true |
| `:open` selector | true | true | true | true |
| `HTMLSelectedContentElement` | yes | no (`<selectedcontent>` parses as `HTMLElement` and stays empty) | yes | yes |
| New `<select>` parser (a `<button>` child and elements inside `<option>` kept) | yes | yes | yes | yes |
| Picker opens in the page: the option is hit-testable and a click on it selects | yes | no (the OS popup is outside the page) | yes | yes |
| The same for a `<select>` inside a shadow root | yes | no | yes | yes |
| The same for a slotted light-DOM `<select>` styled by `::slotted(select), ::slotted(select)::picker(select)` in the shadow root | yes | no | yes | yes |
| `HTMLSelectElement.prototype.showPicker` | function | function | undefined | undefined |

- Upstream status matches the probes. Chrome shipped customizable select in Chrome 135 (developer.chrome.com, "Meet appearance: base-select", 2025-03-24). WebKit shipped it in Safari 27.0 and refined it in 27.2 ("WebKit Features for Safari 27.0", webkit.org/blog/18325; "… 27.2", webkit.org/blog/18515). Firefox tracks it in meta bug 1944403 (`NEW`, last changed 2026-11-09). Its pref `dom.select.customizable_select.enabled` reads `value: false` in firefox-main `modules/libpref/init/StaticPrefList.yaml` (fetched 2026-11-26). Bug 2069977 "Enable base select … in Nightly" is `NEW`. Bug 2041789 (combobox accessibles for customizable select) and bug 2088254 (a tall picker runs off the viewport) are open.
- ARCHITECTURE §16.2's "cannot be styled with CSS in any browser" (`:1450`) no longer holds for Chromium and WebKit at the baseline. It still holds for Firefox 159 (§5 X3).

**Form ownership (P2).** In a `<form>`:

| Control | `FormData` key present | `select.form` |
|---|---|---|
| `<select name="inShadow">` inside a host's shadow root | no | `null` |
| `<select name="slotted">` inside an undefined `<undefined-el>` | yes | the form |
| `<select name="slotted2">` slotted into a defined host's shadow root | yes | the form |

All four runs gave the same result. The HTML form-owner rule takes the nearest ancestor `form` in the element's own tree (HTML, "Association of controls and forms", https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-owner).

- Zag's own Select renders a hidden native `<select>` as its form channel (`select.connect.mjs:341-371`) and resets and disables through it (`trackFormControl`, `select.machine.mjs:385-395`). Rendered inside a shadow root, that `<select>` had no form owner, and the form held no `fruit` key after a selection (P3, all runs). Rendered in the light DOM (the control variant), it submitted `fruit` (P3). The shadow-root case is R1's general finding, observed here for Select.
- A `reset.select.css` sheet adopted in a shadow root styles only a `<select>` in that shadow root, which does not submit. A shadow stylesheet reaches a slotted `<select>` only through `::slotted()`.

**The options.**

| Option | What it is | Law 8 | Three engines | Search, groups, rich items |
|---|---|---|---|---|
| (a) **Custom** (ARCHITECTURE §15–§16) | `@zag-js/select` drives a custom trigger and listbox; form value through `ElementInternals` | No light-DOM fallback. Before upgrade the light-DOM item text shows (R10 §2.4) | Same UI everywhere (P3, P7) | Groups (`getItemGroupProps`), slotted item content (Law 4); search see §2.2 |
| (b) **Native, enhanced** | A light-DOM `<select>` restyled with `base-select` | Fully functional without JS (P2) | Chromium and WebKit get the styled picker. Firefox keeps the OS dropdown and its default rendering (P1) | Groups through `<optgroup>`; rich `<option>` content in two engines; no search |
| (c) **Hybrid** | Consumer markup holds a light-DOM `<select>` as the no-JS fallback and option source. The upgraded component renders the custom listbox | Functional before upgrade (P2) | Custom UI after upgrade | As (a). The component must stop the native `<select>` from submitting twice, or make it the form channel, which means writing on consumer nodes (§5 X1, X7) [INFERENCE: not probed end to end] |

### 2.2 Q2 — "With search", typeahead and the Phase 4 Combobox

- **The Select machine has typeahead and no search.** With the listbox closed and focus on the trigger, a printable key selects the next match (`TRIGGER.TYPEAHEAD` → `selectMatchingItem`, `select.machine.mjs:259-262`, `:605-612`). With it open, a printable key highlights the next match (`CONTENT.TYPEAHEAD`, `:350`, `:555-562`). The anatomy has no `input` part (`select.anatomy.mjs`), and no prop filters (`select.types.d.ts`). P3 observed both typeahead paths in all four runs: "m" highlighted Mango while open, and "p" selected Peach while closed.
- **Filtering lives in other machines.** `@zag-js/combobox` 1.49.0 has an input and filtering. `@zag-js/listbox` 1.49.0 has an `input` part with `aria-autocomplete="list"` and `aria-activedescendant` (`listbox.anatomy.mjs`; `listbox.connect.mjs:107-119`).
- **The catalogue already separates them.** Combobox is "Autocomplete input with filterable options", Pre-built, Phase 4 (`docs/PRD.md:324`, `:1023`). ARCHITECTURE §17.3 schedules the ChoicePicker refinement onto Combobox in Phase 4 (`docs/ARCHITECTURE.md:1628`).
- **APG.** The select-only combobox "users can type characters to select matching options" and keeps DOM focus on the combobox while `aria-activedescendant` points at the option (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/). Filtering by typed text is the editable combobox with list autocomplete, a different pattern.
- **Search inside the Select's content (P6).** An `<input>` placed first in the content, with the consumer filtering the collection by its value, works mechanically in all four runs:
  - Opening focused the input. `getInitialFocus` takes the first tabbable element in the content (`select.machine.mjs:512-518`; `dom-query` `initial-focus.mjs:4-12`).
  - Typing "an" left three items, and typeahead did not fire, because the content handler skips editable targets (`select.connect.mjs:437-438`).
  - Arrow keys moved the highlight (keydown bubbles to the content), and Enter selected Banana.
  - The semantics break. The focused input has no `role="combobox"`, no `aria-activedescendant` and no `aria-controls`. With `composite: true` (the default) the content is `role="listbox"` and holds the input; Chromium's accessibility tree lists `textbox "Search fruits"` among the listbox's children. With `composite: false` the content is `role="dialog"`, the `list` part is the `listbox` carrying `aria-activedescendant`, and focus is not on it. A screen reader therefore follows no highlighted option while the user types [INFERENCE: no screen reader was run].
- Search in Select therefore means either the Combobox's input semantics inside Select, which duplicates the Phase 4 component, or the PRD §4.2 wording changes (§5 X2, §6 Q2).

### 2.3 Q3 — The listbox in the top layer without Popover

**What Phase 1 proved.** Portal: a `popover="manual"` box in the shadow root escapes clipping, transforms and stacking contexts. It keeps inherited context, the event path, form ownership and DOM order. It stacks by show order, and its UA position must be reset (`docs/specs/0013-portal.md` P1–P4, P8, P11; `packages/line-components/src/portal/portal.ts:56-115`). AvatarGroup: a `popover="auto"` panel in the shadow root is anchored with `anchor-name` on the trigger and `position-anchor` plus `anchor()` insets keyed by `:host(:dir(rtl))`, with `position-try-fallbacks: flip-block, flip-inline`. Firefox 157 misplaced `position-area` and `anchor-center` under a direction mismatch, but not `anchor()` insets (`docs/specs/0010-avatar-group.md:212-218`, `:440`, AM-006; `avatar-group.ts:192-245`). "Popover" in plan R4 is the Phase 3 component (`docs/PRD.md:300`, `:997`); the HTML `popover` attribute is a Phase 1 fact.

**P3: Zag Select in a shadow root with a `popover="manual"` listbox**, opened and closed from `api.open` in `updated()`. The host sits in a 220 × 48 px trap with `overflow: hidden` and `transform: translateZ(0)`.

| Check | Anchor variant (CSS anchor positioning, no positioner) | Zag variant (positioner is the popover box, Zag popper) |
|---|---|---|
| Opens on click and keyboard; first item hit-testable outside the trap | yes, all four runs | yes, all four runs |
| Listbox top = trigger bottom; inline start aligned | yes (0, 0) | yes (0, 0) |
| After `scrollBy(0, 25)` | still attached | still attached (autoUpdate) |
| `dir="rtl"` | inline end aligned | inline end aligned |
| Trigger at the viewport bottom | flipped above (`position-try-fallbacks: flip-block`) | flipped above (popper `flip`) |
| Inside an open modal `<dialog>` (Select opened after `showModal()`) | listbox on top; click on an item selects | same |
| Width | `min-inline-size: anchor-size(width)` matches the trigger | `max-content` unless `sameWidth` |

- The Zag popper writes `--x`, `--y`, `z-index` and `visibility` inline on the positioner (`@zag-js/popper` `get-placement.mjs:157-173`, `:283-298`). If no positioner element exists, it returns before measuring (`:260-263`), so the anchor variant renders none and nothing is written.
- **A named anchor needs one tree (P7).** In the light-DOM family, `anchor-name` came from a `:host` rule in the trigger's shadow root and `position-anchor` from a `:host` rule in the content's shadow root. Those are sibling tree scopes, and the box did not anchor in any run: Chromium placed it at (0, 0), and Firefox and WebKit at (206, 59–74). Anchor names are tree-scoped (CSS Anchor Positioning, https://drafts.csswg.org/css-anchor-position-1/#name). `showPopover({ source: trigger })` with `position-anchor: auto` and `anchor()` insets placed it correctly in all four runs.
- **Stacking.** A top-layer box stacks by show order (Portal P8, P11). The Select's box is shown on open, so it paints above a modal dialog that was already open (P3). A dialog opened while the listbox is open would cover it [INFERENCE: from Portal P8; not probed for Select].

### 2.4 Q4 — zag#3088 at 1.49.0

- **State.** "onFocusOutside is not detected properly in a shadow root", opened 2026-04-17 against 1.35.3. The maintainer's account (`closed_by: segunadebayo`) closed it on 2026-05-29 through an automated inactivity message, with the `stale` label and `state_reason: not_planned`; the reporter replied that it still occurs. The community fix, PR #3093 "fix(interact-outside): handle focus-outside detection inside shadow roots", stayed a draft and was closed unmerged on 2026-08-11 (GitHub API, 2026-11-26).
- **Code at 1.49.0.** `@zag-js/interact-outside` still adds `focusin` listeners only on the document, the parent window and frames (`index.mjs:127-131`). It still reads `composedPath()` inside the deferred frame (`:105-110`), while its pointerdown path reads it before deferring (`:71-73`). Select passes `defer: true` (`select.machine.mjs:399-401`). On a touch device (`isTouchDevice()` is `navigator.maxTouchPoints > 0`, `dom-query` `platform.mjs:23`) no `focusin` listener is added (`index.mjs:127`).
- **Mechanism (P4).** A document `focusin` listener saw the same thing in all four runs:

| Focus move | Document `focusin` fires | Target during dispatch | One frame later |
|---|---|---|---|
| to a light-DOM button | yes | the button | target kept, `composedPath()` empty |
| light DOM → shadow element | yes | the host (retargeted); `composedPath()[0]` the shadow element | target is the host, path empty |
| shadow element → another element of the same shadow root | **no** | — | — |
| shadow element → light-DOM button | yes | the button | target kept, path empty |

When the machine's node is in a shadow root, interact-outside takes `composedPath()[0]`, which is `undefined` one frame later, so `isEventOutside` returns false (`index.mjs:45-47`, `:109-110`). A move inside the same shadow root fires nothing it listens to.

- **Behaviour (P3, P7).** "Open" means the listbox was still open 400 ms after the focus move.

| Case | Shadow-root Select, no remedy | With the host `focusout` remedy | Light-DOM control (Zag root = `document`) | Light-DOM family inside a consumer's shadow root |
|---|---|---|---|---|
| `focus()` on another element of the same root | open, all four runs | closed; focus stays where it went | closed | open |
| `focus()` on a light-DOM element | open, all four runs | closed; focus stays where it went | closed | open |
| Pointer down outside | closed | closed | closed | closed |
| Escape | closed, focus to trigger | same | same | same |
| Tab while the listbox has focus | stays open, focus stays on the listbox | same | same | same |

- **Remedy.** A `focusout` listener on the shadow root, or on the family host in the light-DOM shape, closes when `relatedTarget` is outside trigger and content: `ctrl.send({ type: 'CLOSE', src: 'focus-outside', restoreFocus: false })`. Calling `api.setOpen(false)` instead returned focus to the trigger and took it from the element the script had focused. `CLOSE` restores focus unless the event says otherwise (`select.machine.mjs:283-300`, `:683-686`). The same remedy closed the listbox under Chromium's emulated Pixel 7, where Zag tracks no `focusin` (P8).
- **Tab is swallowed by design, not by the bug.** The content's keydown handler prevents Tab when the content has no tabbable descendant (`select.connect.mjs:398-403`; `dom-query` `initial-focus.mjs:13-21`). The light-DOM control did the same in all four runs. APG's select-only combobox sets the value, closes, and moves focus on Tab, and notes that the native `<select>` closes without moving focus.
- **Earlier run.** A first version of the probe host replaced the trigger's text node on every update. In that run macOS WebKit closed on a light-DOM focus move without the remedy. With the text written only on change, two macOS WebKit runs and the Linux run kept it open like Chromium and Firefox. The cause of the earlier difference was not traced [INFERENCE].

### 2.5 Q5 — Anatomy across the shadow boundary

- **Zag resolves parts by ID in one root.** `scope.getById(id)` is `getRootNode().getElementById(id)` (`@zag-js/core` `scope.mjs:3-8`). Trigger, content, items, positioner and hidden select are found that way (`select.dom.mjs`). `aria-controls`, `aria-labelledby` and `aria-activedescendant` are string IDs (`select.connect.mjs:153-170`, `:380-394`).
- **P5: shadow listbox over light-DOM options.**

| Mechanism | Chromium | Firefox | WebKit macOS | WebKit Linux |
|---|---|---|---|---|
| `aria-activedescendant="o2"` on the shadow listbox: reflected getter | `null` | `null` | `null` | `null` |
| … Chromium accessibility tree `activedescendant` | none | — | — | — |
| `listbox.ariaActiveDescendantElement = o2`: getter | `o2` | `o2` | `o2` | `o2` |
| … Chromium accessibility tree `activedescendant` | `o2` | — | — | — |
| `shadowRoot.getElementById('o2')` | `null` | `null` | `null` | `null` |
| Slotted options as children of the listbox (Chromium tree) | One, Two, Three (the third an `ElementInternals` `role="option"`) | — | — | — |

Element reflection may point from a shadow tree into its ancestor tree (HTML, reflecting element references, https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes). Phase 1 R8 found the same for `ariaLabelledByElements` (`docs/research/01-research-accessibility.md:128-136`). Playwright's `ariaSnapshot()` showed the `ElementInternals` option as text, because Playwright computes roles from the DOM (Phase 1 spec AM-058).

- **P7: the ARCHITECTURE §12 family as light-DOM elements.** `<cs-select>` held `<cs-trigger>` (`tabindex="0"`, `role="combobox"` from `getTriggerProps`), `<cs-content popover="manual">` (`role="listbox"`) and `<cs-item>` options, and Zag's root node was the host's root node. All four runs gave the same results:
  - Click and keyboard open it, and focus moves to the content.
  - `aria-activedescendant` resolves in the same tree. Chromium's tree shows the listbox focused, with its active descendant an option, 10 options, and the combobox `expanded`.
  - Enter selects and returns focus to the trigger, and Escape closes.
  - Pointer outside and focus moves close it when the family is in the document. They do not close it inside a consumer's shadow root, which is zag#3088 again.
- **Precedents.** Web Awesome 3.14.0 slots light-DOM `<wa-option>` elements into a shadow listbox. It moves real focus to each option (`option.focus()`, `dist/chunks/chunk.ZAVDMBWV.js:464-479`) instead of using an active descendant. Its `<wa-popup>` is a `popover="manual"` box positioned by Floating UI with `strategy: "absolute"` when the Popover API exists (`chunk.UEBQI7VV.js:37`, `:172`, `:274`, `:336`). Lion 0.27.0 `<lion-select>` wraps a slotted native `<select slot="input">` (`components/select/src/LionSelect.js`). Its rich select keeps the listbox and options in the light DOM with `aria-activedescendant` (`components/listbox/src/ListboxMixin.js:735-738`).
- **APG divergence.** Zag moves DOM focus to the listbox and puts `aria-activedescendant` there (`select.machine.mjs:512-518`; `select.connect.mjs:391`). APG keeps DOM focus on the combobox. Zag's keymaps hold no Page Up, Page Down or Alt+Up (`select.connect.mjs:188-220`, `:404-430`).

### 2.6 Q6 — Mobile

**P8.** Playwright device descriptors. Chromium: Pixel 7. WebKit: iPhone 15, macOS and Linux. Firefox: the Pixel 7 descriptor without `isMobile`. Playwright documents `isMobile` as unsupported in Firefox (https://playwright.dev/docs/api/class-browser#browser-new-context-option-is-mobile), and `newContext` accepted it without error.

| Observation | Chromium Pixel 7 | Firefox | WebKit iPhone 15 macOS | WebKit iPhone 15 Linux |
|---|---|---|---|---|
| `navigator.maxTouchPoints` | 1 | 0 | 0 | 0 |
| `(pointer: coarse)` / `(hover: hover)` | true / false | true / false | true / false | true / false |
| `base-select` supported | true | false | true | true |
| Tap a `base-select` select: `:open`, option hit-testable | true, true | true, false (native dropdown) | true, true | true, true |
| Tap a plain select: `:open`, option hit-testable | true, false | false, false [INFERENCE: the earlier dropdown was still open] | true, false | false, false |
| Zag Select: tap opens, tap item selects, tap outside closes | yes | yes | yes | yes |
| zag#3088 cases without / with the remedy | open / closed | open / closed | open / closed | open / closed |

- **What emulation can show.** Touch events and taps, the coarse pointer, viewport size and the UA string. It also shows the in-page `base-select` picker, the custom listbox under touch, and Zag's touch branch where `maxTouchPoints` is set (Chromium only).
- **What emulation cannot show.**
  - The iOS wheel picker and the Android select dialog, which are OS UI outside the page.
  - Mobile Safari and Chrome for Android themselves: Playwright WebKit is not Mobile Safari, and no run touched a device.
  - Whether iOS Safari 27 uses the `base-select` picker or the wheel [INFERENCE: not observed; webkit.org/blog/18325 does not say].
  - The virtual keyboard, VoiceOver and TalkBack.
  - A non-zero `maxTouchPoints` in WebKit, so Zag takes its desktop branch under the iPhone descriptor. A real iPhone reports touch points [INFERENCE].
  - The Firefox Android build.
- **Pages without `<meta name="viewport">`.** Under the iPhone descriptor without that tag, WebKit laid out at 980 px, and Playwright taps failed with "`<div></div>` intercepts pointer events". With the tag, every tap worked.
- ARCHITECTURE §16.2 already accepts losing the OS pickers, and plan §3 keeps a `native-mobile` prop out (`docs/ARCHITECTURE.md:1458-1460`; `docs/plans/02-plan-essential-forms.md:181`). The only OS-picker path left is a native `<select>`, for example inside Field. R3 found that such a `<select>` is not a Field-compatible control under ARCHITECTURE §9 as written (`docs/ARCHITECTURE.md:493-496`), because it emits none of the `line-*` events (`docs/research/02-research-field-labelling.md` §6 item 2, branch `docs/01-z18-r3-field-labelling`).

### 2.7 Linux WebKit

- **Click lost on a re-render (P9).** On Linux, a mouse press on the trigger focused it. Zag moved to `focused`, and the probe host's update replaced the trigger's text node before mouseup. No `click` followed, so the listbox stayed closed. The event trace read pointerdown, mousedown, focus, focusin, pointerup, mouseup, with no click. macOS WebKit does not focus a button on click (Phase 1 retrospective lesson 4, `docs/retrospective/01-phase-01-retro.md:130-131`), so no render fell between the two events and the click fired.
- **Isolated cases.** A mousedown handler that replaces a button's text node (`textContent =`) suppressed the click in WebKit on macOS and on Linux, and not in Chromium or Firefox. Changing the same text node's `data` kept the click in all engines. An attribute change kept it too. Lit commits text by setting `.data` on the existing node, and only when the value changes (lit-html 3.3.3 `development/lit-html.js:948-968`). A Lit-bound trigger label therefore keeps its node [INFERENCE: no Lit-bound trigger was probed].
- **Everything else matched macOS WebKit,** apart from a few pixels of font metrics (§3.4).

### 2.8 Weight

R8 owns the weight; these figures give the cost of the options. `bun build --minify`, gzip `-9`:

| Bundle | Raw / gzip |
|---|---|
| `@zag-js/select` (`machine`, `connect`, `collection`) with all its dependencies | 88,778 / 28,218 B |
| The same, with the six shared Zag packages left out of the bundle (`@zag-js/core`, `vanilla`, `dom-query`, `utils`, `types`, `anatomy`; `line-core` itself depends only on `core` and `vanilla`) | 72,701 / 22,802 B |
| R8's figure for the cost on top of what `line-core` ships: the marginal over its B0 (`export *` of `@zag-js/core` and `@zag-js/vanilla`), measured with esbuild (`docs/research/02-research-packaging-weight.md` §2.3, branch `docs/01-z23-r8-packaging-weight`). The row 01-Z19 review measured 26,816 B the same way with Bun | 83,722 / 26,738 B |
| Of which `@zag-js/popper` with `@floating-ui/dom` 1.8.0 | 27,008 / 10,249 B |
| Of which `@zag-js/collection` | 26,040 / 6,991 B |
| Of which `@zag-js/dismissable` (with interact-outside) | 10,582 / 3,664 B |
| `@zag-js/listbox`, marginal | 32,385 / 9,291 B |
| `@zag-js/combobox`, marginal | 81,022 / 24,923 B |

- `select.machine.mjs` imports `getPlacement` statically (`:5`), so the popper stays in the bundle even when the component positions through CSS [INFERENCE: tree-shaking of an imported, called function is not possible; not measured with a bundler analysis].

## 3. Probes

All probes ran on 2026-11-26 on macOS 27.2 (arm64), from throwaway files under `/tmp/z19-probes/`. They were deleted afterwards, and nothing was written to the repository. The probe package pinned `lit` 3.3.3 and `@zag-js/select`, `core`, `vanilla`, `combobox`, `listbox` and `dom-query` at 1.49.0. It was installed with `HOME=/tmp/emptyhome bun install`, and all 27 packages resolved to one version each. `src/line-machine-controller.ts` was a byte copy of `packages/line-core/src/machine/line-machine-controller.ts` (sha256 `b2834c70…5e69b`). Pages were served through `page.route` on `http://probe.local/`, one browser at a time, one context per case.

### 3.1 Setup

| Item | Value |
|---|---|
| Bundles | `bun build <entry> --target browser --format esm --define 'process.env.NODE_ENV="production"'`. Final hashes: `bundle.js` `5ad53a21…0caa0fef`, `bundle-search.js` `95dce00b…2345a80`, `bundle-compound.js` `bed2241c…226a4` |
| Runner | Node 22.23.5 importing the worktree's `node_modules/playwright/index.mjs` (1.65.1); viewport 1280 × 720 |
| Linux WebKit | `docker run --rm --cpus 2 --memory 1g --ipc=host -v <worktree>:/work:ro -v /tmp/z19-probes:/probes -e PW_PATH=/work/node_modules/playwright/index.mjs -e PROBE_DIR=/probes -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright mcr.microsoft.com/playwright:v1.65.1-noble`. Ubuntu 24.04.5 LTS, aarch64, WebKit 27.2 build 2388, the container's Node 26.13.1 running the mounted Playwright 1.65.1 JavaScript; nothing was installed in the container. The row 01-Z19 review re-ran P1 and P2, the P3 and P4 focus cases with the remedy and the light-DOM control, and P7's named and `source` anchors with `--cpus 1`, and got the same results. This is a local aarch64 run. CI runs x86_64 Linux, which ran none of these probes |
| Probe host `probe-select` | `LitElement` + `LineMachineController` + `@zag-js/select`; prop getters applied with `@zag-js/vanilla` `spreadProps` in `updated()` (a component binds them in its template, Law 5). Shadow root: label, trigger `<button>`, hidden `<select>`, content (`popover="manual"`, anchor variant) or positioner (`popover="manual"`) around content (Zag variant), ten fruit items, an extra `#shadow-other` button. Anchor CSS: `anchor-name: --probe-trigger` on the trigger; on the box `position-anchor: --probe-trigger; margin: 0; inset: auto; top: anchor(bottom); left: anchor(left); position-try-fallbacks: flip-block; min-inline-size: anchor-size(width)`, and `left: auto; right: anchor(right)` under `:host(:dir(rtl))`. The `light` attribute renders into the light DOM with `getRootNode: () => document` (control). The `focusout-fix` attribute adds the remedy of §2.4 |
| Probe host `probe-search-select` | As above with an `<input aria-label="Search fruits">` first in the content; the input event sets a query and the collection is rebuilt from the filtered items; `composite` set to `true` or `false` |
| Probe family `cs-*` | `<cs-select>` (machine host, `getRootNode: () => this.getRootNode()`, `ids.positioner` = content id) applying trigger, content and item props to its light-DOM children; `<cs-trigger>`, `<cs-content>`, `<cs-item>` each with a styling shadow root and a `<slot>`; modes `zag` (popper), `source` (`showPopover({ source: trigger })`, `position-anchor: auto`), `named` (`anchor-name` and `position-anchor` in the two `:host` rules); placed in the document or inside an `<x-app>` shadow root |
| Page `select.html` | `#before` button; a `position: relative; overflow: hidden; transform: translateZ(0)` 220 × 48 px trap holding `<form id="f">` with the host; `#light-other` at (700, 8); a `<dialog>` with a second host; a 2000 px spacer; query flags for variant, remedy, `dir="rtl"`, bottom placement (wrapper at `top: 660px`) and light DOM |

### 3.2 Probe list

| Probe | Script and step | Exit |
|---|---|---|
| P1 Platform and customizable select | `run.mjs` features page: `CSS.supports`, interfaces, parser, computed `appearance` of `select` and `::picker(select)`, then click each select, hit-test the second option, click it, read `value` | 0 in all four runs |
| P2 Form ownership | `run.mjs` features page, `FormData(f2)` keys and `.form` | 0 |
| P3 Zag Select in a shadow root | `run.mjs` `zagRun` per variant: click open, ArrowDown ×2, "m", Enter, "p", ArrowDown, Escape, click outside; layout cases opened through `api.setOpen(true)` so no scroll-into-view moved the page | 0 |
| P4 zag#3088 | `run.mjs`: a document `focusin` capture listener that records target and `composedPath()` during dispatch and one frame later; `zagRun` focus cases with and without the remedy | 0 |
| P5 Cross-root ARIA | `run.mjs` aria page; Chromium `Accessibility.getFullAXTree` over CDP | 0 |
| P6 Search inside Select | `run-search.mjs`: click, type "an", ArrowDown, Chromium tree, Tab, Enter, for `composite` true and false | 0 in all four runs |
| P7 Light-DOM family | `run-compound.mjs`: 3 modes × 2 hosts; the same steps as P3 plus geometry | 0 in all four runs |
| P8 Mobile | `run.mjs` with device descriptors; taps on `base-select` and plain selects; `zagRun` touch cases | 0 |
| P9 Linux WebKit click | `dbg-click.mjs` (event trace, macOS and Linux WebKit), `dbg-text.mjs` and `dbg-data.mjs` (text node replaced or changed in place on mousedown; four engines) | 0 |
| P10 Weight | `bun build --minify` of `export { machine, connect, collection } from '@zag-js/<p>'`, with and without `--external` for the shared Zag packages | 0 |

### 3.3 Run history

- First full run: two harness faults. The listbox covered the "outside" button, so Playwright refused the click. Pages also lacked a viewport meta, so the WebKit iPhone taps failed. `#light-other` moved to (700, 8) and the meta was added.
- Second run: the remedy called `api.setOpen(false)`, which restored focus to the trigger. It was changed to `CLOSE` with `restoreFocus: false`.
- Third run: Linux WebKit never opened on click. P9 traced it to the probe host's `textContent` rewrite, and the host was changed to write only on change.
- Fourth run (the results above): all four runs agree, except where §2 names a difference. macOS WebKit ran the P3/P4 focus cases a second time with the same results.
- P7's first Chromium run broke the `zag` mode, because two `spreadProps` calls on one node drop the first call's attributes. The two prop objects were merged, and the run was repeated.

### 3.4 Results by engine

| Probe | Chromium 159 | Firefox 159 | WebKit 27.2 macOS | WebKit 27.2 Linux |
|---|---|---|---|---|
| P1 customizable select | full | none | full | full |
| P2 shadow `<select>` submits / slotted submits | no / yes | no / yes | no / yes | no / yes |
| P3 open, keyboard, typeahead, select, Escape, outside click | pass | pass | pass (click does not focus the trigger; outside click leaves focus on `body`) | pass (click focuses the trigger) |
| P3 escape clipping, scroll, RTL, flip, modal dialog | pass, both variants | pass | pass | pass (Zag variant 3 px narrower: font metrics) |
| P4 no document `focusin` within one shadow root; path empty a frame later | yes | yes | yes | yes |
| P4 zag#3088 open after focus moves; remedy closes | yes; yes | yes; yes | yes; yes | yes; yes |
| P5 string IDREF across roots / element reflection | fails / works (tree confirms) | fails / works (getter) | fails / works (getter) | fails / works (getter) |
| P6 search input works / semantics | yes / input not a combobox; textbox inside listbox | yes / same (DOM) | yes / same (DOM) | yes / same (DOM) |
| P7 family in document: all behaviours | pass | pass | pass | pass |
| P7 family in a consumer shadow root: focus moves | stays open | stays open | stays open | stays open |
| P7 named anchor across sibling shadow trees / `source` anchor | fails / works | fails / works | fails / works | fails / works |
| P8 mobile | see §2.6 | see §2.6 | see §2.6 | see §2.6 |
| P9 click after text-node replacement on mousedown | kept | kept | lost | lost |

## 4. Recommendations

Each item names the option this note recommends and the alternatives. None of them is a decision (§6).

1. **Native or custom: custom (recommended).** Build `<line-select>` on `@zag-js/select` with a custom trigger and listbox in all three engines, as ARCHITECTURE §15–§16 states. Reasons: Firefox 159 has no customizable select and no date for it (P1). The PRD tier is "Pre-built". Search and rich slotted items need a custom listbox (§2.2, R10).
   - Alternative (b): a native `<select>` enhanced with `base-select`. It gives Law 8 and the mobile pickers, styled in two engines and native in Firefox.
   - Alternative (c): the hybrid of §2.1.
2. **Law 8 for Select: a revision rather than a hybrid (recommended).** Let the post-research revision state that Select renders a custom listbox and has no light-DOM fallback, and that a consumer who needs no-JS behaviour or the OS picker places a native `<select>` in `<line-field>`, as ARCHITECTURE §16.2 already suggests (`:1460`). That path also needs R3's contradiction resolved. Under ARCHITECTURE §9 (`:493-496`) a native `<select>` emits none of the `line-*` events, so it is not a Field-compatible control (`docs/research/02-research-field-labelling.md` §6 item 2). R3 owns native controls inside Field, and R7 owns the no-JS question; this note's evidence for them is P2.
   - Alternative: keep Law 8 and adopt the hybrid. A consumer `<select>` is the fallback and the option source. Its costs are a second source of truth, writes on consumer nodes or a native control as the form channel (Laws 5, 7), and it was not probed end to end.
3. **Anatomy: the ARCHITECTURE §12 family as light-DOM elements (recommended).** `line-select` hosts the machine, with Zag's root node set to its own root node. `line-select-trigger` carries `role="combobox"` and `tabindex`, `line-select-content` carries `role="listbox"` and the `popover` attribute, and `line-select-item` and `line-select-group` are the options and groups. Every ID reference then stays in one tree, and Zag's lookups work unchanged (P7). Each part would apply its own props from the parent's API (Law 5) [INFERENCE: the probe let the parent apply them].
   - Alternative: one host that renders items in its shadow root from data. It loses slotted item content (Law 4; R10's swatches).
   - Alternative: a shadow listbox over slotted options. It needs element reflection for the active descendant, and Zag's string IDs and `getElementById` lookups no longer resolve (P5).
4. **Top layer: `popover="manual"` on the content, shown and hidden from machine state (recommended),** as Portal settled (F1) and without the Phase 3 Popover. Place it with CSS anchor positioning through the implicit anchor: `showPopover({ source: trigger })`, `position-anchor: auto`, `top: anchor(bottom)` with `left: anchor(left)` or `right: anchor(right)` keyed by direction, `position-try-fallbacks: flip-block`, and `min-inline-size: anchor-size(width)` (P3, P7; AvatarGroup AM-006 for the insets).
   - Alternative: Zag's popper, which works (P3) but writes inline styles on the box.
   - Either way the popper's 10.2 KB stays in the bundle (§2.8). RTL under the implicit anchor was probed only with a named anchor (P3).
5. **zag#3088: a host `focusout` remedy (recommended).** Close with `CLOSE`, `restoreFocus: false`, when `relatedTarget` leaves the family. It is needed whenever the root node is a `ShadowRoot` (a consumer's component, or a surface that renders into a shadow root), and on touch devices, where Zag tracks no `focusin`. It is harmless in the document (P3, P4, P7, P8).
   - Alternative: a patched `@zag-js/interact-outside` that reads `composedPath()` before deferring and listens on the root node (the zag#3088 patch). It still misses moves inside one shadow root unless it also listens there, and the repo has no patch mechanism.
   - Alternative: an upstream fix, which is closed `not_planned`.
6. **Search: typeahead only in Phase 2 Select (recommended).** The Phase 4 Combobox carries filtering. The PRD §4.2 Select row then needs rewording (§5 X2).
   - Alternative: an input inside Select with combobox semantics. That is the Combobox's input pattern, Combobox has no Phase 2 slot, and it would duplicate Phase 4 work.
   - Alternative: move Combobox into Phase 2, which is a PRD §7.4 change.
7. **Tests the spec should require (recommended).**
   - Click-to-open in the Browser tier on Linux WebKit, because P9's click loss shows only there.
   - The four focus cases of §2.4, run both in the document and inside a shadow root.
   - Escape and outside click inside a modal `<dialog>`.
   - Flip at the viewport edge and RTL.
   - The `ElementInternals` form round trip, since Zag's hidden `<select>` cannot carry it (P2, R1).

## 5. Contradictions and gaps

PROCESS §2 sends research that contradicts the plan back to the plan and the PRD before spec work. This note flags each item and resolves none.

| # | Conflict | Where | Evidence |
|---|---|---|---|
| X1 | Law 8 and PRD §1.7 name Select among components that wrap a native control and keep a light-DOM fallback. ARCHITECTURE says Select uses no native `<select>` | MANIFESTO `:53`; PRD `:172`; ARCHITECTURE `:1339`, `:1452`, `:1525-1526`. Already a plan §5.7 row (`docs/plans/02-plan-essential-forms.md:436`) | P1: no customizable select in Firefox 159. P2: a light-DOM fallback is feasible only as consumer markup |
| X2 | PRD §4.2 promises a "Dropdown with search" on a Pre-built machine that has no search. Search is the Phase 4 Combobox's pattern | PRD `:286`, `:324`, `:1023` | §2.2, P6 |
| X3 | ARCHITECTURE §16.2 says `<option>` "cannot be styled with CSS in any browser" | ARCHITECTURE `:1450`, `:1525` | P1: styled in-page picker in Chromium 159 and WebKit 27.2; true only in Firefox 159 |
| X4 | ARCHITECTURE §16.2 places the dropdown "via Popover/floating positioning". The Popover component is Phase 3 | ARCHITECTURE `:1452`; PRD `:300`, `:997` | §2.3: the HTML `popover` attribute and CSS anchor positioning need no Phase 3 component |
| X5 | `reset.select.css` serves "native fallback scenarios" and "`<select>` in shadow DOM". A `<select>` in a shadow root does not submit, and a shadow sheet does not reach a slotted `<select>` | ARCHITECTURE `:686`, `:875`, `:1156` | P2 |
| X6 | The plan's risk row says Select "does not close when focus leaves a shadow root". The evidence is wider: any focus move a pointer did not cause, the same shadow root included, while the machine's root node is a `ShadowRoot`. On touch devices Zag tracks no `focusin` at all. In the document tree it does not occur | Plan `:513` | §2.4, P4, P7, P8 |
| X7 | MANIFESTO Law 7 makes `ElementInternals` the form contract. A hybrid (§2.1 (c)) whose native `<select>` is the form channel would bypass it | MANIFESTO `:51` | §2.1 |
| X8 | PRD §1.7 "Zag.js handles [touch and pointer] natively for pre-built machines". Zag's focus-outside tracking is off on touch devices by design, and in a shadow root it does not work | PRD `:170` | `interact-outside` `index.mjs:127`; P8 |
| X9 | "(G1)" in plan R4 has no definition | Plan `:266` | §1 |

## 6. Open questions for the post-research revision and the Phase 2 spec

| # | Question | Owner |
|---|---|---|
| Q1 | Select and Law 8: revise MANIFESTO Law 8 and PRD §1.7 for Select (custom only, with a native `<select>` in Field as the no-JS and OS-picker path, which needs R3's §9 Field-compatibility contradiction resolved), adopt the hybrid, or build on the native element (X1, X7; R3, R7) | Miguel, post-research revision |
| Q2 | "With search": reword PRD §4.2 to typeahead and leave filtering to the Phase 4 Combobox, add combobox semantics to Select, or move Combobox into Phase 2 (X2) | Miguel, post-research revision |
| Q3 | ARCHITECTURE §16.2 and §16.3: update the `<option>` styling fact (X3), and the "Popover/floating positioning" wording (X4) | Post-research revision |
| Q4 | `reset.select.css`: keep it, drop it from the Select mapping, or give it a new scenario (X5) | Post-research revision |
| Q5 | Anatomy: the light-DOM family of ARCHITECTURE §12 against a single host. If the family, which part applies which Zag props, and does `line-select-content` carry `popover` itself | Phase 2 spec |
| Q6 | Placement: the implicit anchor (`showPopover({ source })`) or Zag's popper; RTL under the implicit anchor; the stacking rule when a dialog opens over an open listbox | Phase 2 spec |
| Q7 | The zag#3088 remedy: per component, or a shared `line-core` helper that the Phase 3 overlays (Menu, Popover, Combobox) also need; report upstream again | Phase 2 spec; Miguel for an upstream report |
| Q8 | Keyboard: keep Zag's Tab trap and listbox focus, or follow APG (Tab selects, closes and moves on; focus stays on the combobox; Page Up and Page Down) | Phase 2 spec |
| Q9 | Form value: `ElementInternals` from the machine's `value`; Zag's hidden `<select>` is not rendered or not named (R1, R2, stream F) | Phase 2 spec |
| Q10 | Select inside `<line-a2ui-surface>` or any shadow-root host: confirm where the surface renders its children, since zag#3088 applies there (R6) | R6, Phase 2 spec |
| Q11 | Mobile: confirm ARCHITECTURE §16.2's trade-off. Decide whether any real-device check (iOS Safari, Chrome for Android) is required before a mobile claim, since CI emulates none of the OS pickers | Miguel |
| Q12 | What "G1" in plan R4 refers to (X9) | Plan author |

## 7. Sources

- Zag 1.49.0 tarballs (`npm pack @zag-js/<p>@1.49.0`, 2026-11-26): `select` (`dist/select.machine.mjs`, `select.connect.mjs`, `select.dom.mjs`, `select.anatomy.mjs`, `select.types.d.ts`), `interact-outside` (`dist/index.mjs`), `dismissable`, `popper` (`dist/get-placement.mjs`, `get-styles.mjs`), `dom-query` (`dist/platform.mjs`, `initial-focus.mjs`), `collection`, `listbox`, `combobox`, `focus-trap`; `@zag-js/core` 1.49.0 `dist/scope.mjs` in the worktree. `npm view @zag-js/select`: `latest` 1.49.0 (2026-11-22), `next` 2.0.0-next.4.
- zag#3088: https://github.com/chakra-ui/zag/issues/3088; PR #3093: https://github.com/chakra-ui/zag/pull/3093; PR #3127 (trigger lookups in shadow roots, merged 2026-05-21): https://github.com/chakra-ui/zag/pull/3127.
- Chrome: https://developer.chrome.com/blog/a-customizable-select. WebKit: https://webkit.org/blog/18325/webkit-features-for-safari-27-0/, https://webkit.org/blog/18515/webkit-features-for-safari-27-2/. Firefox: https://bugzilla.mozilla.org/show_bug.cgi?id=1944403 and its dependencies 2069977, 2041789, 2088254; https://searchfox.org/firefox-main/source/modules/libpref/init/StaticPrefList.yaml.
- APG select-only combobox: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/.
- HTML form owner: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-owner; element reflection: https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes; `showPopover()` options: https://html.spec.whatwg.org/multipage/popover.html#dom-showpopover.
- CSS Anchor Positioning: https://drafts.csswg.org/css-anchor-position-1/.
- Playwright `isMobile`: https://playwright.dev/docs/api/class-browser#browser-new-context-option-is-mobile.
- Web Awesome 3.14.0 and Lion 0.27.0 tarballs (`npm pack`, 2026-11-26), files cited in §2.5.
- lit-html 3.3.3 `development/lit-html.js:948-968`.
