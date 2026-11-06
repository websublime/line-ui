# ButtonGroup

| Field | Value |
|-------|-------|
| Status | `draft` |
| Phase | `1` |
| Tier | `Custom` |
| Tag | `line-button-group` |
| Entrypoint | `@websublime/line-components/button-group` |
| Form-associated | `no` (Phase 1 spec §6.C.4 C6 row, `docs/specs/01-spec-core-primitives.md:1162`) |
| PRD catalogue entry | PRD §4.1, `ButtonGroup` row (`docs/PRD.md:246`) |
| Ledger row | `01-C6` |
| Governing sections | Phase 1 spec §4.2, §6.C.0, §6.C.4 (C6 row and notes), §6.C.5 (ButtonGroup), §6.C.6, §6.G.1, §6.G.3, §6.G.4, §7.3, §7.4, §7.5, §7.6, §7.8, §10 SD4, SD10, SD13, SD18, SD31, SD38, SD39, SD98, SD99, §12 AM-002, AM-052, AM-055, AM-058, AM-086; ARCH §5, §8, §12, §13.1, §14.7–§14.9, §17.2–§17.4; PRD §4.1, §5.2, §8; plan §2.2–§2.4, D5 |

Text marked `[INFERENCE]` has no probe or source behind it yet. Text marked `[PENDING Dn]` depends on Open Question Dn and changes with its answer.

---

## Probe — slotted roving focus

The Phase 1 spec requires this spec to open with a slotted roving-focus probe across `line-button` hosts with inner native buttons (§6.C.5, `:1210`; §6.C.4 C6 row, `:1162`; §10 SD10, `:2357`; R8 §6 Q6, `docs/research/01-research-accessibility.md:337`). The probe ran on 2026-11-06.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2, arm64; Bun 1.4.3 |
| Runner | Playwright 1.64.0, its own engine builds: chromium 156.0.8078.4, firefox 157.0, webkit 27.2 |
| Components | the built `@websublime/line-components` 0.2.4 at `c13a74f` (`./button`, `./icon-button` from `dist`, loaded by package name as a consumer does) and the built `@websublime/line-core` (`LineElement`, `INTERNALS`, `LineMachineController`, `commonReset`) |
| Machine | `@zag-js/core` 1.47.0 `createMachine`, run by `@zag-js/vanilla` 1.47.0 through `LineMachineController` |
| axe | `@axe-core/playwright` 4.14.0 (axe-core 4.14.0), tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` (the §7.4 set, `packages/line-components/__tests__/a11y/axe.ts`) |
| Tokens | `@websublime/line-tokens/radii` and `./sizing`, for the styling checks |
| Upstream check | `npm view @zag-js/toolbar dist-tags`: `latest` 2.0.0-next.3, `next` 2.0.0-next.1. No stable release, so the SD10 revisit trigger is not met (Phase 1 spec `:1211`) |

The probe host `<probe-group>` extended `LineElement`, rendered a `<slot>` in its shadow root, found its items in `slotchange` through `slot.assignedElements({ flatten: true })`, and listened to `keydown`, `focusin` and `focusout` on its own host. A throwaway roving `createMachine` held `activeIndex` in context and moved it on `MOVE`, `FOCUS_ITEM` and `SYNC` events; its `move` action called a prop callback that focused the target item. Attributes switched the role placement (host `ElementInternals` or an inner wrapper), the tab-stop target (item host or the item's inner `<button>`), the item filter, the orientation, wrap, disabled skipping, and a `MutationObserver` on each item's `disabled` attribute. The page held a native button before and after the group and a 3000 px spacer.

The probe code lived in `packages/line-components/temp/c6-probe/`, which `.gitignore:4` (`temp`) ignores, and was deleted after the run. Nothing of it is committed.

Commands, from the repository root:

```sh
bun --filter '@websublime/line-core' build && bun --filter '@websublime/line-components' build
bunx playwright test -c packages/line-components/temp/c6-probe/playwright.config.ts            # run 1 and run 2, three engines
bunx playwright test -c packages/line-components/temp/c6-probe/playwright.config.ts -g Q5b --project chromium
bunx playwright test -c packages/line-components/temp/c6-probe/playwright.config.ts -g Q7      # and -g Q7b
npm view @zag-js/toolbar dist-tags --json
```

WebKit on macOS moved Tab focus with Alt+Tab, as the existing Browser tier does (`packages/line-components/__tests__/integration/icon-button/icon-button.e2e.ts:60`). "All three" below means chromium, firefox and webkit gave the same result.

### P1 — Focus into a slotted host

| Check | chromium | firefox | webkit |
|---|---|---|---|
| `item.focus()` on a slotted `line-button` host, with `tabindex="0"` or `"-1"` | `document.activeElement` is the item host, its `shadowRoot.activeElement` is the inner `<button>`; the item host matches `:focus`; the group host matches `:focus-within` | same | same |
| `data-focus-visible` on the item after Tab into the group, and after an arrow key that follows keyboard entry | set | set | set |
| Pointer click on an item that is not focused | focuses the inner button; no `data-focus-visible` | same as chromium | does not focus it: `document.activeElement` is `body`, the group does not match `:focus-within`, and the roving item does not move. A click on the focused item also drops focus to `body` |
| Arrow key after that pointer click, the group calling `item.focus()` | `data-focus-visible` set on the new item | focus moves, `data-focus-visible` **not** set | n/a: no item has focus |
| `item.focus({ focusVisible: true })` after a pointer click elsewhere | `data-focus-visible` set | set | set |
| `line-icon-button` hosts in the same group | reached by End, focus `i5>button` | same | same |

Button and IconButton expose `delegatesFocus: true` (`packages/line-components/src/button/button.ts:92`, `src/icon-button/icon-button.ts:64`) and nothing that forwards a tab index to the inner button. The public focus surface is the host: `host.focus()` and the host `tabindex` attribute.

### P2 — One Tab stop

| Tab-stop strategy | chromium | firefox | webkit |
|---|---|---|---|
| None (baseline) | Tab from the button before: `b1`, `b2`, `b3`, after (three stops); Shift+Tab back: `b3`, `b2`, `b1`, before | same | same |
| Roving `tabindex` on the item hosts (`0` on the active item, `-1` on the rest) | one stop: `b1`, then the button after; Shift+Tab from after lands on the active item, then before | same | same |
| Roving `tabindex` on each item's inner `<button>`, reached through `item.shadowRoot` | one stop, same sequence | same | same |
| Remembered item: Tab in, ArrowRight, Tab out, Shift+Tab back | back on `b2` (both strategies) | same | same |

A host `tabindex="-1"` takes the host's inner button out of the sequential order in all three engines, so the group gets one Tab stop without reaching into another component's shadow root.

### P3 — Disabled and loading items

| Check | chromium | firefox | webkit |
|---|---|---|---|
| `item.focus()` on a `disabled` `line-button` | nothing receives focus (`document.activeElement` stays `body`): its inner button is natively disabled, so `delegatesFocus` finds no target | same | same |
| `item.focus()` on a `loading` `line-button` | focuses its inner button (`aria-disabled="true"`) | same | same |
| Arrows that skip `disabled` items | ArrowRight from `b1` over a disabled `b2` lands on `b3` | same | same |
| Arrows that do not skip `disabled` items | focus stays on `b1` while the machine moves `activeIndex` to `b2`: the machine and the focus disagree | same | same |
| First item `disabled` at mount | the tab stop moves to the first enabled item; Tab lands on `b2` | same | same |
| Active item turns `disabled` after mount, no observer | no `slotchange` fires; the only `tabindex="0"` sits on a host whose button is disabled, so Tab skips the whole group | same | same |
| Same, with a `MutationObserver` on each item's `disabled` attribute | the tab stop moves to `b2`; Tab lands on it | same | same |
| The focused item turns `disabled` | focus drops to `body` | same | same |

### P4 — Keys handled on the group host

| Check | chromium | firefox | webkit |
|---|---|---|---|
| `keydown` from an item's inner button, seen by a listener on the group host | `target` is the item host (retargeted), `composed: true`, `composedPath()` starts `button`, item shadow root, item host, group `<slot>`, group wrapper, group shadow root | same | same |
| Horizontal, keys Right, Right, Down, Left, End, Right, Home, Left from `b1` of four | `b2`, `b3`, `b3` (Down ignored), `b2`, `b4`, `b4` (no wrap), `b1`, `b1` (no wrap) | same | same |
| Horizontal with wrap: Left from `b1`, Right from `b4` | `b4`, `b1` | same | same |
| Vertical, keys Down, Right, Down, Up, End, Home | `b2`, `b2` (Right ignored), `b3`, `b2`, `b4`, `b1` | same | same |
| Horizontal with `dir="rtl"` on the group, mapping through `LineElement`'s `direction`: Left, Left, Right | `b2`, `b3`, `b2` | same | same |
| `preventDefault()` on handled keys, 3000 px page | `scrollY` stays `0` | same | same |
| Enter, then Space, on the focused `b2` | each reaches a document `click` listener once with target `b2`; the group handles no activation key | same | same |

### P5 — `slotchange` discovery

| Check | chromium | firefox | webkit |
|---|---|---|---|
| Append an item, remove an item, move an assigned item with `insertBefore` | one `slotchange` each (counts 2, 4, 5 after the initial 1); the item list follows | same | same |
| Append a `line-icon-button`, a `<span>` and a native `<button>` with the filter `line-button,line-icon-button` | one `slotchange`; the list gains the icon button only | same | same |
| A native `<button>` slotted beside the items | stays its own Tab stop: the Tab sequence after the group stop includes it | same | same |
| Reorder | the tab stop follows the active element (`b1`) to its new index | same | same |
| Remove the focused active item | focus drops to `body`; the group fires `focusout`, so the probe machine leaves its `focused` state; the next Tab reaches the first item | focus drops to `body`; no `focusout` reaches the group, so the probe machine stays `focused`; the next Tab reaches the first item | same as firefox |
| Toggle `disabled` on an assigned item | no `slotchange` | same | same |
| Filter `*` (any element) | the list includes a `<span>`, which has no focus target | same | same |

### P6 — Role placement for `toolbar`

Option (a) sets `ElementInternals.role = 'toolbar'` and `ariaOrientation` on the host through `this[INTERNALS]` (`packages/line-core/src/line-element.ts:31-36`). Option (b) renders `<div part="root" role="toolbar" aria-orientation aria-label>` around the slot and copies the host `aria-label` to it. Both were named "Text formatting" by a host `aria-label`.

| Check | (a) host internals | (b) inner wrapper |
|---|---|---|
| `INTERNALS` read-back, all three engines | `role` `toolbar`; `ariaOrientation` `horizontal` or `vertical` as set; no host `role` attribute | `role` and `ariaOrientation` `null` |
| Chromium AX tree (`Accessibility.getFullAXTree`) | one `toolbar` "Text formatting", `orientation` `horizontal` or `vertical`, with the three `button` nodes ("Bold", "Italic", "Underline") as descendants; no named `generic` | one `toolbar` "Text formatting" with the same orientation and descendants, plus the host as a named `generic` "Text formatting" |
| Chromium AX name with host `aria-labelledby` to a light-DOM `<span>` | "Formatting" | the id copied to the wrapper: empty name. `wrapper.ariaLabelledByElements = [span]` set from inside: "Formatting" |
| Chromium AX name with no name source | empty | empty |
| axe 4.14.0, §7.4 tags, all three engines | zero violations, named and unnamed | zero violations, named and unnamed |
| axe 4.14.0, every rule | `page-has-heading-one` only (the fixture page) | same |
| Playwright `ariaSnapshot()`, all three engines | no `toolbar` node; the buttons are listed flat | `toolbar "Text formatting"` with the three buttons under it |

axe has no rule that requires a toolbar name, and it ignores internals-only roles (Phase 1 spec §7.4; R8 §2.4), so an unnamed toolbar passes axe in both options. Playwright computes `ariaSnapshot()` from attributes and does not read internals roles.

### P7 — `createMachine` through `LineMachineController`

| Check | chromium | firefox | webkit |
|---|---|---|---|
| Machine starts through the controller | `fallback` `false` | same | same |
| Host updates (`updated()` calls): mount, Tab in, two ArrowRight, focus leaves | 1, 2, 4, 5: one host update per machine change | same | same |

`@zag-js/vanilla` 1.47.0 runs every `send()` in a `queueMicrotask` (`node_modules/.bun/@zag-js+vanilla@1.47.0/node_modules/@zag-js/vanilla/dist/machine.mjs:75-79`), so `context.get()` read right after `send()` returns the old value. In run 1 the probe wrote the tab stops right after `send()`. A reorder left `tabindex="0"` on the wrong item, a first item `disabled` at mount kept the only tab stop (the group was unreachable), and the removal of the active item left no tab stop. Run 2 wrote the tab stops from the machine's `move` action and in `updated()`, and every case above passed; the tables show run 2.

### P8 — Styling slotted items from the group

| Check | chromium | firefox | webkit |
|---|---|---|---|
| Group shadow rule `::slotted(line-button) { --line-button-radius: 0px }` | overrides Button's own `:host` default: the inner `root` radius is `0px` | same | same |
| Document rule `line-button { --line-button-radius: 9px }` against that group rule | the document rule wins: `9px` | same | same |
| Group shadow rule `::slotted(line-button:first-child)::part(root) { … }` | matches nothing | same | same |
| Document rule `<group> > line-button:first-child::part(root) { border-start-end-radius: 0; … }` | applies per corner | same | same |
| Group shadow rules writing the shorthand into the token: first item `var(--line-radius-2) 0 0 var(--line-radius-2)`, middle `0`, last `0 var(--line-radius-2) var(--line-radius-2) 0`, swapped under `:host(:dir(rtl))` | corners (TL TR BR BL) `5px 0 0 5px`, `0 0 0 0`, `0 5px 5px 0`; in RTL `0 5px 5px 0`, `0 0 0 0`, `5px 0 0 5px` | same | same |

Button's `root` takes `border-radius: var(--line-button-radius)` (`button.ts:150`) and has no border: `reset.button.css` sets `border: 0` and Button adds none (`packages/line-core/src/styles/reset.button.css`; `button.ts:143-155`).

### What the probe settles

- One Tab stop works across slotted `line-button` and `line-icon-button` hosts through their public surface: a roving host `tabindex` plus `host.focus()`, which `delegatesFocus` forwards to the inner button (P1, P2). Reaching into the item's shadow root works too, but is not needed (P2).
- Keys reach the group host through the shadow boundary, retargeted to the item host; `composedPath()` identifies the item (P4).
- `slotchange` tracks membership and order, not item state; a `disabled` change needs its own observer (P3, P5).
- Keyboard moves need `focus({ focusVisible: true })`, or Firefox leaves the moved-to item without `data-focus-visible` after any pointer click (P1).
- Tab stops are written from the machine's action or in `updated()`, never right after `send()` (P7).
- Both role placements give Chromium a correctly named and oriented `toolbar`; they differ in name sources, in the extra named `generic`, and in what axe and `ariaSnapshot()` can see (P6; D1).
- The group can shape its items' corners from its own shadow root through their radius tokens, not through `::part()` (P8; D9).

---

## Part A — Requirements

### Overview

#### Description

`<line-button-group>` groups related buttons into one toolbar. The group is one Tab stop, and the arrow keys move focus between its buttons, as the APG Toolbar pattern describes (ARCH §13.1, `docs/ARCHITECTURE.md:589`; PRD §4.1, `docs/PRD.md:246`; plan D5, `docs/plans/01-plan-core-primitives.md:487`). Assistive technology meets it as a `toolbar` [PENDING D1]. It imports no button: it finds the buttons in its default slot through `slotchange` and moves focus through each button host's public focus surface (Phase 1 spec §6.C.5, `:1208`; MANIFESTO Law 4; probe P1, P2) [PENDING D2, D3]. A custom roving-focus machine, built with `createMachine` on `@zag-js/core` 1.47.0 and run through `LineMachineController`, drives it (Phase 1 spec `:1209`; §10 SD10). It is not form-associated, and it is not compound: its buttons act on their own and commit no shared result, so it fires no commit event of its own (ARCH §17.2 C9, `:1571`). It joins the buttons visually by collapsing the corners between them [PENDING D9].

#### Use cases

- A formatting toolbar in an editor: bold, italic, underline, alignment.
- A set of related view actions, such as zoom out, reset and zoom in, or a pager's first, previous, next and last.
- A vertical tool palette beside a canvas [PENDING D4].
- A row of icon-only actions on a card or a table row, mixing `line-button` and `line-icon-button` [PENDING D2].
- Render an agent `ButtonGroup` node from the `line` catalog on `<line-a2ui-surface>` (Phase 1 spec §6.C.4 C6 row, `agentExposed: true`; decision D10).

#### Anti-patterns

- One choice among options, such as a view switcher with one active view. Use RadioGroup or ToggleGroup (Phase 2; ARCH §13.1 ToggleButton bullet); a toolbar of toggle buttons with `pressed` fits only when each toggles on its own.
- Fewer than three controls. APG says to "use toolbar as a grouping element only if the group contains 3 or more controls"; place two buttons side by side with `<line-stack orientation="horizontal">` (R8 `:67`; decision D8).
- Buttons that each need their own Tab stop, such as a dialog's OK and Cancel. Use `<line-stack>`; a toolbar takes them out of the Tab order except one.
- Controls that need the arrow keys the toolbar uses, such as a text field or a slider in a horizontal toolbar. APG advises against it, and line://ui's group handles only buttons [PENDING D2].
- Navigation links. Use a `<nav>` with a list of `<a href>`; a toolbar groups controls, not links.
- A button that opens a menu, or a menubar. Use Menu or Menubar (Phase 3; ARCH §13.7).
- A split button. Use SplitButton (Phase 3; ARCH §13.1).

#### User expectations

- Tab moves focus into the group once, onto the first button that is not disabled the first time, and onto the button that last had focus afterwards; Shift+Tab and Tab leave it (APG Toolbar, Keyboard Interaction; probe P2) [PENDING D5].
- Left Arrow and Right Arrow move between the buttons of a horizontal group, mirrored in a right-to-left page; Up Arrow and Down Arrow do it in a vertical group (APG Toolbar; probe P4) [PENDING D4].
- Home and End move to the first and last button [PENDING D5].
- Enter and Space activate the focused button as on any button; the group handles neither (probe P4).
- A disabled button is skipped by the arrow keys; a loading button stays reachable and ignores presses, as it does outside a group (`0002-button.md` User expectations; probe P3) [PENDING D6].
- A screen reader announces a toolbar with its name and, when vertical, its orientation, then each button with its own name and state [PENDING D1, D7].
- In Safari on macOS a mouse click does not focus a button, so it does not move the group's remembered button; Tab and the arrow keys behave as elsewhere (probe P1).

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| `<line-button>` | child | the default slot; the group recognises it by tag name and never imports it (Phase 1 spec §6.C.5, `:1208`; §6.C.6 "Import no other component", `:1228`; probe P5) [PENDING D2] |
| `<line-icon-button>` | child | the default slot, as `<line-button>` (probe P1, P5; `0003-icon-button.md` Connections, which deferred this to this spec) [PENDING D2] |
| `<line-separator>` | child | the default slot; not an item, so the arrow keys pass over it [INFERENCE: not probed with a separator; probe P5 shows non-items stay out of the item list] [PENDING D2] |
| `<line-stack>` | sibling | the alternative for buttons that keep their own Tab stops (Anti-patterns) |
| native `<form>` | none | not form-associated (ARCH §7 list, `docs/ARCHITECTURE.md:389`, unchanged); slotted `line-button` hosts keep their own form behaviour |
| `<line-a2ui-surface>` | orchestrator | creates `line-button-group` by tag from a `line` catalog `ButtonGroup` node, puts the `children` in the default slot, and sets `accessibility.label` as the host `aria-label` (ARCH §17.4) [PENDING D7, D10] |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| none | — | — |

ButtonGroup has no semantic variant (ARCH §17.2 C6). Each slotted button keeps its own `variant`. `orientation` is a behaviour and layout attribute, not a variant: it changes keys, the ARIA orientation and the flex direction (Props) [PENDING D4].

---

## Part B — Technical Specification

### Anatomy

[PENDING D1] Option (a), host internals (recommended):

```
<line-button-group>                     LineElement (not FormAssociated); ElementInternals role toolbar,
│                                       ariaOrientation "vertical" only when vertical; the host is the flex container
└── #shadow-root
    └── <slot></slot>                   the items: line-button and line-icon-button hosts [PENDING D2]
```

Option (b), inner wrapper:

```
<line-button-group>                     LineElement (not FormAssociated); no role (generic)
└── #shadow-root
    └── <div part="root" role="toolbar"   aria-orientation, aria-label copied from the host
             aria-orientation aria-label>
        └── <slot></slot>
```

- The group renders no button and no focusable element of its own. Focus lives in the slotted buttons' shadow roots (probe P1).
- The host extends `LineElement` without the `FormAssociated` mixin, so `this[INTERNALS]` is available for the role and for `reflectState` (ARCH §14.8, `:1181`; `packages/line-core/src/line-element.ts:31-36`).
- The default shadow-root options apply: the group does not set `delegatesFocus`, because it has no focus target of its own; `host.focus()` on the group is a no-op [INFERENCE: not probed on the group host].
- Under option (a) the host itself is the flex container with a bare slot, as `<line-stack>` and `<line-separator>` are their own boxes (`0018-stack.md` Anatomy, `:73-78`; `packages/line-components/src/separator/separator.ts:81-83`).

### States

| Field | Value |
|-------|-------|
| Machine | a custom `createMachine()` on `@zag-js/core` 1.47.0, `buttonGroupMachine` in `packages/line-components/src/button-group/button-group-machine.ts`, run through `LineMachineController` (Phase 1 spec §6.C.4 C6 row, `:1162`; §6.C.5, `:1209`; §10 SD10; ARCH §8, §13.1). The repo declares `@zag-js/core ^1.47.0` in `line-components` already, and the component never imports `@zag-js/vanilla` (§10 SD13; `packages/line-components/package.json`) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| `idle` | start | — | — |

The machine has one finite state. The roving position is context, `activeIndex` (a `bindable` number, default `0`), as Zag's `toggle` keeps `pressed` in context on one `idle` state (R7 `docs/research/01-research-zag-machines.md` §2.4). The probe's second state, `focused`, served nothing that the native `:focus-within` on the group host does not give, and it diverged across engines when the focused item was removed (probe P5), so the draft drops it.

| Machine member | Shape |
|---|---|
| Props | `count: number` (items now); `isSkipped(index): boolean` (`true` for an item the arrows pass over) [PENDING D6]; `loop: boolean` [PENDING D5]; `onMove(index): void` (the host focuses the item and writes the tab stops) |
| Context | `activeIndex: number`; `-1` when no item can take focus |
| Events | `MOVE { to: 'next' \| 'prev' \| 'first' \| 'last' }` from a handled key; `FOCUS_ITEM { index }` from `focusin` on an item; `SYNC { index }` after `slotchange` or an item `disabled` change, with the index of the element that was active |
| Actions | `move` (finds the next item `isSkipped` allows, with or without `loop`, sets `activeIndex`, calls `onMove`); `setActive`; `sync` (keeps the active element, or falls back to the first item that is not skipped) |

| Flag | Source | Host reflection |
|------|--------|-----------------|
| none | — | — |

- The group reflects no ARCH §14.8 state. `:focus-within` matches the group host in all three engines while a slotted button has focus (probe P1), and each button reflects its own `data-focus-visible`, `data-disabled` and `data-loading`.
- **Timing rule.** `send()` runs in a microtask in `@zag-js/vanilla` 1.47.0 (probe P7). The host writes the tab stops in the `move` action's `onMove` callback and in `updated()`, from `context.get('activeIndex')`, and never reads context right after `send()`.
- **Tab stops.** The active item host carries `tabindex="0"` and every other item host `tabindex="-1"` (probe P2) [PENDING D3]. An element that leaves the slot loses the `tabindex` the group wrote, or it would stay out of the Tab order wherever it moves [INFERENCE: not probed; follows from P2]. The group overwrites an author `tabindex` on an item.
- **Keyboard moves.** `onMove` focuses the item with `focus({ focusVisible: true })`, so the moved-to button shows its ring in Firefox after a pointer click (probe P1) [PENDING D3].
- **Discovery.** On `slotchange` the host reads `slot.assignedElements({ flatten: true })`, keeps the items (decision D2), re-observes each item's `disabled` attribute with one `MutationObserver` [PENDING D6], and sends `SYNC` (probe P3, P5).
- If the machine fails to start, the controller's fallback leaves the group without roving focus: the host writes no `tabindex`, so every button keeps its own Tab stop and stays operable (MANIFESTO Law 9; probe P2 baseline row) [INFERENCE: not probed with a failing machine].
- The machine stays local to ButtonGroup. A Phase 2 component that needs roving focus (ToggleGroup, RadioGroup) may move it to `src/shared/`, as Button's machine moved for IconButton (Phase 1 spec §12 AM-002) [INFERENCE].

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ChildList` | the toolbar's buttons, in order: `<line-button>` and `<line-icon-button>` hosts [PENDING D2]; other content is rendered but takes no part in roving focus |

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| none under option (a) | — | the host is the flex container; consumers style the host and each button's own parts [PENDING D1] |
| `root` under option (b) | `<div role="toolbar">` | wraps the default slot; the flex container [PENDING D1] |

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `orientation` | `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | yes | the arrow keys the group handles, the ARIA orientation and the flex direction; an unknown value behaves as `horizontal` (C8) [PENDING D4] |
| `loop` | `loop` | `boolean` | `false` | yes | wrap from the last button to the first and back [PENDING D5] |

- `orientation` reflects as Button's `variant` does: a value the author or code sets is written to the attribute, the default leaves no attribute (Lit `useDefault: true`), and an unknown author value stays as written (`0002-button.md` AM-002) [PENDING D4].
- No `ariaLabel` property under option (a): the host `aria-label`, `aria-labelledby` and `aria-description` attributes name the internals role directly. Option (b) adds `ariaLabel` and `ariaDescription` properties copied to the wrapper, as IconButton copies them to its inner button (`icon-button.ts:71-72`) [PENDING D1, D7].
- No `disabled`, `variant` or `size` on the group: each button keeps its own.

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

- ButtonGroup is not compound and not value-bearing, so C9 names no commit event (ARCH §17.2 C9, `:1571`; plan §2.4, `:173`) [PENDING D11].
- The slotted buttons' `click` and `line-change` events bubble through the group unchanged.
- The class JSDoc carries no `@fires` [PENDING D11].

### CSS custom properties

[PENDING D9] Option (a) (recommended):

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-button-group-radius` | `var(--line-radius-2)` | the outer corners of the first and last items, written into their radius tokens |
| `--line-button-group-gap` | `0` | `:host` (`gap`) |

- Under option (a) the group's shadow stylesheet writes `--line-button-radius` and `--line-icon-button-radius` on `::slotted(line-button)` and `::slotted(line-icon-button)`: `0` on every item, the `border-radius` shorthand with `--line-button-group-radius` on the start corners of the first item and the end corners of the last, swapped under `:host(:dir(rtl))`, and the block corners instead of the inline ones while `vertical` (probe P8). A consumer rule on `line-button` in the document still wins over these (probe P8).
- `::slotted([data-focus-visible])` takes `position: relative` and `z-index: 1`, so the next button does not paint over the focused button's ring (ARCH §14.9; WCAG 2.4.7) [INFERENCE: not probed].
- `:host` is `display: inline-flex`, `flex-direction: row`, and `column` under `[orientation="vertical"]` [PENDING D4].
- The group draws no ring of its own: focus always sits on a button, which draws its own (ARCH §14.9).

### Keyboard

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | moves focus into the group onto the active button, which is the first button not disabled until a button has had focus, and the last focused one after; the next Tab leaves the group (probe P2) [PENDING D5] |
| `Right Arrow` / `Left Arrow` (horizontal) | next / previous button; mirrored when the group's `direction` is `rtl` (probe P4) [PENDING D4] |
| `Down Arrow` / `Up Arrow` (vertical) | next / previous button (probe P4) [PENDING D4] |
| `Home` / `End` | first / last button (probe P4) [PENDING D5] |
| `Enter` / `Space` | activate the focused button; handled by the button, not the group (probe P4) |

- A handled key calls `preventDefault()`, so the page does not scroll (probe P4). Other keys pass through untouched.
- At either end without `loop`, the arrow key does nothing [PENDING D5].
- Disabled buttons are passed over [PENDING D6].

### A11y

| Field | Value |
|-------|-------|
| Role | `toolbar` (ARCH §13.1; Phase 1 spec §6.C.4 C6 row); on the host through `ElementInternals` under option (a), or on an inner `<div part="root">` under option (b) [PENDING D1] |
| ARIA attributes | `aria-orientation="vertical"` while vertical, through `ariaOrientation` on the internals (a) or the attribute on the wrapper (b); absent while horizontal, the ARIA default (APG Toolbar) [PENDING D1, D4] |
| Accessible name | the host `aria-label` or `aria-labelledby` under option (a), where the author attribute names the internals role directly (probe P6); the host `aria-label` copied to the wrapper under option (b) (ARCH §17.2 C5) [PENDING D1, D7] |
| Focus | none on the group; each slotted button takes focus through its own `delegatesFocus` (probe P1). One Tab stop through a roving host `tabindex` [PENDING D3]; `data-focus-visible` stays on the button (ARCH §14.9) |

- **Internals proof (option (a)).** A role set only through internals needs, in the Browser tier, a Chromium CDP accessibility-tree assertion of role, name and orientation, and an `INTERNALS` read-back of `role` and `ariaOrientation` in chromium, firefox and webkit (Phase 1 spec §6.C.4 notes, `:1180`; §10 SD39; §12 AM-058). The probe ran both (P6) and its results are the expected values. Firefox and WebKit exposure to assistive technology stays unverified; this spec records the gap. A manual screen-reader pass is optional and never blocks the row [PENDING D1].
- **axe.** axe 4.14.0 reports nothing for an unnamed toolbar in either placement and ignores the internals role (probe P6; Phase 1 spec §7.4). The axe tier still runs over every story and covers each slotted button's own naming rules (`button-name` on the inner buttons) [PENDING D7].
- **Host.** Under option (b) the host stays a `generic` element that keeps the author's `aria-label`, as Button's host does; Chromium exposes it as a named `generic` (probe P6; R8 `:55`, `:156-159`) [PENDING D1].
- **Screen-reader check.** Under option (a) Playwright's `ariaSnapshot()` shows no `toolbar` node, so the Browser tier asserts the role through CDP and `INTERNALS`, not through `ariaSnapshot()` (probe P6) [PENDING D1].

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `orientation` is a string enum and `loop` a boolean [PENDING D4, D5] |
| C2 | Slots carry `@slot` and a single or multiple classification | `@slot` for the default slot; `ChildList` |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | no events; no unprefixed `input` or `change` [PENDING D11] |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated |
| C5 | The host accepts an accessible name and applies it to the element with the role | the host `aria-label` names the internals role on the host itself (a), or is copied to the inner wrapper (b) [PENDING D1] |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | no variants |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries every tag for the slot, each part and token; no `@fires`; nothing is deprecated [PENDING D1, D9, D11] |
| C8 | Missing or partial props degrade to an empty or neutral state | with no children it renders an empty toolbar and writes no `tabindex`; with no name it is an unnamed toolbar; an unknown `orientation` behaves as `horizontal` and keeps the author's attribute |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound (ARCH §17.2 C9 names ButtonGroup, `:1571`) |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

#### Descriptor fields

[PENDING D7, D10] Option (a) of each (recommended):

| Field | Value |
|-------|-------|
| Catalog name | `ButtonGroup` |
| Tag | `line-button-group` |
| `load()` subpath | `@websublime/line-components/button-group` |
| Prop schema | `orientation` (`z.enum(['horizontal', 'vertical'])`, plain `.describe()`, as Stack's `orientation`, `packages/line-genui/src/catalog/descriptors/stack.ts`; an enum stays a literal, Phase 1 spec §6.G.1, `:1326`), `loop` (`DynamicBoolean`) [PENDING D5], the catalog-only `children` (`ChildList`), which the frontend-tool walker leaves out (Phase 1 spec §6.G.3, `:1404`), and `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1, `:1322`) |
| Slot map | `children` → default slot (`''`), as Stack (`stack.ts:30`) |
| Binding map | `orientation`, `loop` → attribute; no value prop; no commit event (C9) |
| Action map | none |
| Accessibility requirements | `requiredName: [{ kind: 'accessibilityLabel' }]`; `hostNaming: { kind: 'always' }` (`packages/line-genui/src/catalog/descriptor.ts:128`, `:142`) [PENDING D7] |
| Agent-facing description | A toolbar that groups three or more related buttons, such as text formatting or zoom controls, into one Tab stop; the user moves between the buttons with the arrow keys. Put Buttons or IconButtons in `children`, in order. It needs `accessibility.label`, the name assistive technology announces for the toolbar; a node without one is not rendered. `orientation` is `horizontal` (default) or `vertical`. Set `loop` to let the arrow keys wrap from the last button to the first. Each button keeps its own action. For buttons that each need their own Tab stop, or for fewer than three, use a Row. |
| Tool description | A toolbar that groups three or more related buttons, such as text formatting or zoom controls, into one Tab stop; the user moves between the buttons with the arrow keys. The app places the buttons inside it. Set `accessibilityLabel` to the toolbar's name; the app gives the toolbar that name, and a toolbar without it has no name. `orientation` is `horizontal` (default) or `vertical`. Set `loop` to let the arrow keys wrap from the last button to the first. |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C6 row) |

- The agent-facing description names `children` (a `ChildList`) and `accessibility.label`, so the descriptor sets a tool description that names neither (Phase 1 spec §6.G.3, `:1423`, `:1435`; §12 AM-086). Both stay under the 1024-character cap (`:1422`).
- The `ChildList` schema takes any component ids, so an agent can put a non-button child in the group; it renders and takes no part in roving focus (Slots) [INFERENCE: `ChildList` carries no type constraint, as `ComponentId` does not (`0003-icon-button.md` AM-001)] [PENDING D2].
- With `hostNaming: always` the surface writes `accessibility.label` as the host `aria-label`, which names the toolbar under D1 (a) with no copying (probe P6).
- The descriptor joins the `descriptors` array in catalog-name order (`packages/line-genui/src/catalog/index.ts:100`), and C6 ships it in the same PR (Phase 1 spec §6.C.0 step 3, `:927`).

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/button-group` |
| Kind | `independent` (ARCH §12, `docs/ARCHITECTURE.md:573`; Phase 1 spec §4.2, `:294`) |
| Registers | `line-button-group` |
| Reset modules | `commonReset` only (ARCH §14.7, `:1138`; Phase 1 spec §6.C.4 notes, `:1181`) |

- Files: `src/button-group/button-group.ts` (class and `customElements.define`), `src/button-group/button-group-machine.ts`, `src/button-group/button-group.types.ts`, `src/button-group/index.ts`. Nothing imports `src/button/`, `src/icon-button/` or `src/shared/button-machine.ts`; the item filter compares tag names only (Phase 1 spec §6.C.5, `:1208`; MANIFESTO Law 4).
- `package.json` gains the `./button-group` export of Phase 1 spec §4.2 (`:245`), and the Vite build gains the `button-group/index` entry (`packages/line-components/vite.config.mjs:11-13`).
- The isolation scan fails when the `./button-group` bundle holds another component's module (Phase 1 spec §7.5).
- Gzipped size is reported against the < 5 KB soft target through the "Size report" step (Phase 1 spec §6.C.6, `:1227`; §7.6).

### Markup examples

```html
<!-- Default: a horizontal formatting toolbar -->
<line-button-group aria-label="Text formatting">
  <line-button pressed="false">Bold</line-button>
  <line-button pressed="false">Italic</line-button>
  <line-button pressed="false">Underline</line-button>
</line-button-group>

<!-- Icon buttons, named by a visible heading [PENDING D1, D2] -->
<h2 id="zoom-label">Zoom</h2>
<line-button-group aria-labelledby="zoom-label">
  <line-icon-button aria-label="Zoom out"><line-icon library="lucide" name="zoom-out"></line-icon></line-icon-button>
  <line-button>100%</line-button>
  <line-icon-button aria-label="Zoom in"><line-icon library="lucide" name="zoom-in"></line-icon></line-icon-button>
</line-button-group>

<!-- Vertical, wrapping, with a disabled and a loading button [PENDING D4, D5, D6] -->
<line-button-group aria-label="Tools" orientation="vertical" loop>
  <line-button>Select</line-button>
  <line-button disabled>Crop</line-button>
  <line-button loading>Export<line-spinner slot="loading"></line-spinner></line-button>
</line-button-group>
```

A `line` catalog node set that the surface renders as the first example [PENDING D10]:

```json
[
  { "id": "fmt", "component": "ButtonGroup", "children": ["bold", "italic", "underline"],
    "accessibility": { "label": "Text formatting" } },
  { "id": "bold", "component": "Button", "child": "bold-text", "pressed": false, "action": { "event": { "name": "bold" } } },
  { "id": "bold-text", "component": "Text", "text": "Bold" }
]
```

(`italic` and `underline` follow `bold`.)

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom | render with no errors; `orientation` default, converter and reflection, with no host attribute for the default; `loop`; the machine's `move`, `sync` and `setActive` over item counts, skipped items and ends, with and without `loop`, driven through the controller; item discovery from the default slot with the filter of D2; `tabindex` written to items and removed from an item that leaves; internals `role` and `ariaOrientation` read back through `INTERNALS` [PENDING D1]; no `formAssociated` on the class; the token defaults on `:host` [PENDING D9]; the C8 empty render; the machine-failure fallback leaving no `tabindex` |
| Browser | Playwright `*.e2e.ts` on chromium, firefox and webkit | every probe row P1–P5 and P8 as an assertion: one Tab stop and Shift+Tab return; the remembered button; arrows, Home and End per orientation, in RTL, with and without `loop`; `preventDefault` on handled keys; Enter and Space still activating; disabled skipped, loading reachable, a button turning disabled, the focused button turning disabled; add, remove, reorder and removal of the focused button; `data-focus-visible` on keyboard moves after a pointer click (`focus({ focusVisible: true })`); `line-icon-button` items [PENDING D2]; corner shapes in LTR, RTL and vertical [PENDING D9]; the internals proof (A11y) (Phase 1 spec §7.8; §10 SD99) |
| A11y | axe-core | zero violations (MANIFESTO Law 3) in every ButtonGroup story: default, icon buttons, vertical, with a disabled and a loading button (Phase 1 spec §7.4). axe has no toolbar-name rule (probe P6), so the name is proved in the Browser tier: the Chromium CDP assertion of role `toolbar`, name and `orientation`, and the `INTERNALS` read-back in three engines (Phase 1 spec `:1180`; §10 SD39) [PENDING D1, D7] |
| htmx | — | `n/a`: ButtonGroup is neither value-bearing nor compound (ARCH §17.2 C9, `:1571`; plan §2.4, `docs/plans/01-plan-core-primitives.md:171-174`; Phase 1 spec §6.C.4 C6 row, `:1162`). Its slotted buttons keep their own htmx rows (`0002-button.md`, `0003-icon-button.md` Tests) |
| Visual | Playwright `button-group.visual.ts` on the `visual` project | every ButtonGroup story, with Linux baselines from a `visual-baselines.yml` run (Phase 1 spec §6.C.6, `:1233`; §10 SD98) |
| Update rate | `measureHostUpdates` from `@websublime/line-testing/update-rate` on a connected `<line-button-group>` with four buttons, driven by moving `activeIndex` | the rate is recorded in the C6 PR; a rate past the C21 budget, `UPDATE_BUDGET_MS` (1 ms per host update) at `BUDGET_UPDATES`, stops the row and returns it to the orchestrator (`packages/line-testing/src/update-rate.ts:31`, `:50`; Phase 1 spec §6.C.6, `:1232`; §10 SD18; §12 AM-055; pattern of `packages/line-components/__tests__/icon-button.update-rate.test.ts`). The probe saw one host update per machine change (P7) |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts`; Playwright axe in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` | a named `ButtonGroup` node renders `<line-button-group aria-label="…">` with its `line-button` children in the default slot, and Tab then an arrow key move between them; a node with no `accessibility.label` renders the `missing-name` placeholder and raises one `MISSING_ACCESSIBLE_NAME` `line-a2ui-error` [PENDING D7]; the node joins the surface render fixture (`apps/storybook/stories/agent-ui/a2ui-fixtures.ts`) and the surface axe test with zero violations (Phase 1 spec §6.C.6, `:1231`; §6.G.4) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the CEM coverage and drift tests pass with the new descriptor (Phase 1 spec §6.G.5); `catalog.json` holds `ButtonGroup` and its inline projection validates (§6.G.2); the `ButtonGroup` tool takes the tool description, stays at or under 1024 characters and passes the backtick guard (§6.G.3, `:1422-1423`, `:1435`) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./button-group` register `line-button-group` only, and the isolation scan finds no Button or IconButton module in its bundle (Phase 1 spec §7.5) |

- PRD §5.2 checklist mapping (`docs/PRD.md:531-540`; Phase 1 spec §6.C.6, `:1222`): (1) render, (2) reactive props, (3) slots, (4) parts [PENDING D1], (5) custom properties and (6) events (none) in the Unit tier; (7) keyboard in the Browser tier (§10 SD99); (8) axe in the A11y tier.
- The axe and visual tests run against the Storybook stories on port 4320 (Phase 1 spec §6.P.7, §6.P.11); the story list lives in `packages/line-components/__tests__/button-group-stories.ts`. The keyboard and internals tests use fixture pages under `packages/line-components/__tests__/integration/button-group/` that load the built `./button-group`, `./button` and `./icon-button` by package name, served by the existing port-4321 `webServer` (`playwright.config.ts:25`).
- The C6 PR also fills the ButtonGroup row of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 with a dated check of each column (Web Awesome already declares `wa-button-group`, `0003-icon-button.md` footnote), writes the Storybook docs and adds a changeset (Phase 1 spec §6.C.6, `:1223-1226`).

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| D1 | Where does the `toolbar` role sit: on the host through `ElementInternals`, or on an inner wrapper in the shadow root? | Miguel | open; recommended (a), host internals |
| D2 | Which slotted elements count as toolbar items? | Miguel | open; recommended (a), `line-button` and `line-icon-button` by tag name |
| D3 | How does the group move focus into an item and keep one Tab stop? | Miguel | open; recommended (a), roving `tabindex` on the item host and `host.focus({ focusVisible: true })` |
| D4 | Does the group take an `orientation`, and which arrow keys does each orientation handle? | Miguel | open; recommended (a), `orientation` `horizontal \| vertical` with the orientation's arrow pair only, mirrored in RTL |
| D5 | Home and End, wrap at the ends, and the remembered button: which ship? | Miguel | open; recommended (b), Home/End and the remembered button always, wrap opt-in through `loop` |
| D6 | Are disabled buttons skipped or focusable, and what happens when the focused button turns disabled? | Miguel | open; recommended (a) with sub-choice (i): skip `disabled`, keep `loading`, observe `disabled`, move focus to the new active button |
| D7 | Is the toolbar name required, and from which sources? | Miguel | open; recommended (a), host `aria-label`/`aria-labelledby` documented on markup, required on the agent path |
| D8 | What does the group do with fewer than three buttons? | Miguel | open; recommended (a), document it only |
| D9 | How does the group collapse its buttons' corners, and which `--line-button-group-*` tokens does it expose? | Miguel | open; recommended (a), write the items' radius tokens from `::slotted()` |
| D10 | Which catalog carries ButtonGroup, and in what shape? | Miguel | open; recommended (a), the `line` catalog only, `children: ChildList` |
| D11 | Does the group fire any event? | Miguel | open; recommended (a), none |

### D1 — Role placement

Evidence: probe P6 (both placements give Chromium a named, oriented `toolbar` with the buttons as descendants); Separator already sets its role and `ariaOrientation` through internals and lets author attributes win (`packages/line-components/src/separator/separator.ts:81-83`; `0011-separator.md`). C5 applies the name to "the element that carries the role, which is either the host itself or the inner focusable element" (ARCH `:1567`); the wrapper of option (b) is neither. An internals-only role needs the CDP and `INTERNALS` proof (Phase 1 spec `:1180`). `generic` prohibits a name (R8 `:55`), and axe 4.14.0 stays silent on a named generic host when the inner button is named (R8 `:199`). An `aria-labelledby` id inside a shadow root cannot reach a light-DOM id (R8 `:130-137`; probe P6). Role attributes sprouted on a host are author-owned, and HTML gives the author's attribute precedence only when internals hold the default (R8 §2.5, `:245`).

| Option | Placement | Tradeoff |
|---|---|---|
| (a) **Recommended.** Host internals | `this[INTERNALS].role = 'toolbar'`; `ariaOrientation = 'vertical'` while vertical; the host is the flex container | No extra node; author `role`, `aria-label`, `aria-labelledby` and `aria-orientation` on the host win and name it natively, including a visible heading through `aria-labelledby` (P6); matches Separator and C5 "the host itself". Needs the Chromium CDP assertion and the three-engine `INTERNALS` read-back; axe and `ariaSnapshot()` cannot see the role (P6), and Firefox and WebKit exposure stays unverified |
| (b) Inner wrapper | `<div part="root" role="toolbar" aria-orientation>` around the slot; host `aria-label` and `aria-description` copied to it | axe and `ariaSnapshot()` see the toolbar (P6); no internals proof needed. Leaves a named `generic` host (P6), an `aria-labelledby` needs element reflection (`ariaLabelledByElements`, P6; R8 `:135-137`), and the wrapper is neither element C5 names, so ARCH §17.2 C5 needs a wording change |
| (c) Host `role` attribute | the component writes `role="toolbar"` and `aria-orientation` attributes on its own host | axe sees it (R8 `:202`); no wrapper. The component writes attributes the author owns, so it must not overwrite an author `role` and has to track removal; no probe ran on this variant |

### D2 — Items

Evidence: `line-button` and `line-icon-button` both take focus through `delegatesFocus` and a host `tabindex` (P1, P2); the filter is a tag-name comparison, which imports nothing (P5; Phase 1 spec `:1208`). A `<span>` has no focus target and a native `<button>` slotted beside the items stays its own Tab stop (P5). A disabled native button or `line-button` can be detected through its `disabled` attribute; an arbitrary element's disabled state has no single attribute [INFERENCE]. APG lets a toolbar hold menu buttons, checkboxes and other controls (APG Toolbar, About This Pattern).

| Option | Items | Tradeoff |
|---|---|---|
| (a) **Recommended.** `line-button` and `line-icon-button` | `localName` is `line-button` or `line-icon-button` | Both proved in three engines (P1, P5); `disabled` and `loading` read from known attributes. Other children stay outside roving focus, so a native button in the group adds a Tab stop (P5), which the Anti-patterns document. Phase 2 and 3 controls (ToggleGroup items, menu triggers) join only by a later amendment |
| (b) `line-button` only | `localName` is `line-button` | The literal reading of §6.C.5 ("across `line-button` hosts"). An icon-only action needs `line-button` with an icon and an `aria-label`, and `0003-icon-button.md` Connections expected the group to hold icon buttons |
| (c) Any focusable child | every assigned element that has a focus target (a native focusable element, or a host with `delegatesFocus`) | Native buttons and future components join with no amendment. Focusability has no reliable public test for a custom element [INFERENCE], disabled state differs per element (`disabled`, `aria-disabled`), and controls that need arrow keys (text fields, sliders) would be swallowed by the toolbar's keys, against APG |
| (d) (a) plus an author opt-in | (a), plus any child marked by an attribute such as `data-line-item` | Lets consumers add native buttons on purpose. Adds a public marker attribute the group must document and test; the group still cannot read the child's disabled state generically |

### D3 — Focus mechanism and Tab stop

Evidence: P1 (`host.focus()` reaches the inner button in three engines), P2 (host `tabindex` and inner-button `tabindex` both give one Tab stop), P1 (Firefox sets no `data-focus-visible` on a keyboard move after a pointer click unless `focus({ focusVisible: true })`). Button and IconButton expose no tab-index forwarding (`button.ts:92`, `icon-button.ts:64`).

| Option | Mechanism | Tradeoff |
|---|---|---|
| (a) **Recommended.** Host `tabindex` | `tabindex="0"` on the active item host, `-1` on the rest; keyboard moves call `item.focus({ focusVisible: true })` | Public surface only; no change to Button or IconButton. The group writes `tabindex` on light-DOM elements the author owns: it overwrites an author `tabindex` and must remove its own from an element that leaves |
| (b) Inner-button `tabindex` | the group finds `item.shadowRoot.querySelector('button')` and writes its `tabindex` | Same Tab result (P2), host attributes untouched. Depends on Button's and IconButton's private anatomy and on open shadow roots; a change inside either component breaks the group silently |
| (c) A public roving API on the buttons | Button and IconButton gain a property, for example `rovingTabIndex`, that sets the inner button's `tabindex` | Clean contract. Changes two shipped components (`0002-button.md`, `0003-icon-button.md` amendments, C1 and C5 code); the probe shows (a) needs none of it |

### D4 — Orientation and arrow keys

Evidence: APG Toolbar: Left/Right in a horizontal toolbar, Up/Down in a vertical one, the other pair "can duplicate … or can be reserved for operating controls"; `aria-orientation="vertical"` when vertical, horizontal by default. P4 proves both orientations and the RTL mirror through `LineElement`'s `direction` in three engines.

| Option | Shape | Tradeoff |
|---|---|---|
| (a) **Recommended.** `orientation`, one arrow pair | reflected `orientation="horizontal \| vertical"`, default `horizontal`; horizontal handles Left/Right (mirrored in RTL), vertical handles Up/Down; the other pair passes through; `ariaOrientation` `vertical` only while vertical | APG's default reading; the free pair stays with any control that needs it. Users who press Down in a horizontal toolbar get nothing |
| (b) `orientation`, both pairs | as (a), and the other pair duplicates the orientation's pair | More forgiving keys; APG allows it. Takes the second pair from every slotted control |
| (c) Horizontal only | no `orientation`; Left/Right only | Smallest surface. No vertical palettes; `aria-orientation` never set |

### D5 — Home/End, wrap and the remembered button

Evidence: APG Toolbar marks Home/End and wrap optional, and focus on re-entry "optionally set on the control that last had focus"; P2 and P4 prove all three in three engines. A boolean attribute defaults to `false`, so a wrap-by-default needs a negative attribute.

| Option | Keys and re-entry | Tradeoff |
|---|---|---|
| (a) Fixed, no wrap | Home/End on; no wrap; re-entry on the last focused button | No extra prop. No way to wrap |
| (b) **Recommended.** (a) plus `loop` | as (a), and a reflected boolean `loop` turns wrap on | Covers both APG readings; one boolean prop in the agent schema |
| (c) Always wrap | Home/End on; wrap always; re-entry on the last focused button | Matches toolbars that wrap by default [INFERENCE: Radix Toolbar's `loop` default `true`, not checked in this repo]. No way to stop at the ends |
| Re-entry sub-choice | (i) last focused button (in (a)–(c)); (ii) always the first enabled button | (i) follows the APG option and is what P2 proved; (ii) is simpler to explain but loses the user's place |

### D6 — Disabled and loading buttons

Evidence: P3. A disabled `line-button` cannot take focus through its public surface, because its inner button is natively disabled; an arrow that targets it leaves focus behind while the machine moves on; a `disabled` change fires no `slotchange`, and without an observer the group can lose its only Tab stop; a focused button that turns disabled drops focus to `body`. A loading button stays focusable with `aria-disabled` (Phase 1 spec §10 SD35). APG Toolbar note 2: disabled elements are typically not focusable, though focusable ones can help discoverability.

| Option | Behaviour | Tradeoff |
|---|---|---|
| (a) **Recommended.** Skip `disabled`, keep `loading` | `isSkipped` is the item's `disabled` attribute; a `MutationObserver` on each item's `disabled` sends `SYNC`; when every item is disabled the group has no Tab stop | Works with Button and IconButton as shipped (P3). A disabled button is not discoverable by keyboard |
| (b) Disabled stay focusable | the arrows stop on disabled buttons | APG's discoverability case. Impossible with the shipped buttons (P3): Button and IconButton would need a mode that renders `aria-disabled` instead of native `disabled` inside a group, which amends `0002-button.md`, `0003-icon-button.md` and §10 SD35 |
| Focus-loss sub-choice | (i) **Recommended.** When the focused button turns disabled, focus moves to the new active button; (ii) focus stays where the browser leaves it (`body`) | (i) keeps the keyboard user inside the toolbar; the group moves focus without a user key press. (ii) does nothing, and the user restarts from the top of the page (P3) |

### D7 — Toolbar name

Evidence: APG Toolbar: the toolbar is labelled by `aria-labelledby` when a visible label exists, otherwise by `aria-label`; R8 records "label required by APG" (`:67`). axe 4.14.0 reports no unnamed toolbar in either placement (P6), so hand-written markup has no automated catch. The surface can refuse a nameless node through `requiredName` (`descriptor.ts:128`; Phase 1 spec §10 SD36 pattern for IconButton). C5 allows "a documented label property" (ARCH `:1567`).

| Option | Markup | Agent path | Tradeoff |
|---|---|---|---|
| (a) **Recommended.** Documented on markup, required for agents | host `aria-label` or `aria-labelledby` (under D1 (a)), documented as required; no runtime check | `requiredName: [{ kind: 'accessibilityLabel' }]`, `hostNaming: always` | Every agent toolbar is named; hand-written markup relies on docs, as axe cannot catch it (P6). The tool keeps `accessibilityLabel` optional, as for IconButton (`0003-icon-button.md` Descriptor fields) |
| (b) Optional everywhere | as (a), recommended in docs | `hostNaming: always`, no `requiredName` | No placeholder for an unnamed agent toolbar. A page with several toolbars may announce several unnamed ones |
| (c) (a) plus a `label` property | a `label` string rendered as the internals `ariaLabel` (or the wrapper `aria-label`) | as (a), or a new `NameSource` kind | A non-ARIA name API. Two attributes name one thing; a `label` source on the agent path needs Phase 1 spec §6.G.1 and §6.G.4 amendments, as `0003-icon-button.md` D1 (c) found |

### D8 — Fewer than three buttons

Evidence: APG Toolbar: "Use toolbar as a grouping element only if the group contains 3 or more controls" (R8 `:67`, §6 Q6 `:337`). Item counts change at run time through `slotchange` (P5).

| Option | Behaviour | Tradeoff |
|---|---|---|
| (a) **Recommended.** Document only | the Anti-patterns, the Storybook docs and the agent description say three or more; the group stays a toolbar at any count | Stable semantics; no surprise role changes. Authors and agents can still build a two-button toolbar |
| (b) Downgrade the role | below three items the role becomes `group` and the arrows stop; at three it becomes `toolbar` again | Follows APG at run time. The role and the key handling flip as buttons come and go, which a screen-reader user hears as a different control |
| (c) Console warning | (a), plus a `console.warn` below three items | A signal during development. line://ui components log only on machine failure today (`line-machine-controller.ts:101`); a warning per render adds a new convention |

### D9 — Corner collapse and tokens

Evidence: P8. Button and IconButton have no border (`reset.button.css`; `button.ts:143-155`), so "border collapse" (ARCH `:589`; PRD `:246`) amounts to flush buttons whose inner corners are square. The group cannot reach an item's `::part(root)` from its shadow root, but it can write the item's radius token through `::slotted()`, including the `border-radius` shorthand per corner and in RTL; a consumer rule on `line-button` in the document still wins. Button's `--line-button-radius` and IconButton's `--line-icon-button-radius` are documented as one radius (`button.ts:77`; `icon-button.ts:54`).

| Option | Mechanism | Tradeoff |
|---|---|---|
| (a) **Recommended.** Write the items' radius tokens | `--line-button-group-radius` (outer corners) and `--line-button-group-gap` (default `0`); the group writes `--line-button-radius` and `--line-icon-button-radius` per position with the shorthand, swapped in RTL and by orientation; the focused item is raised | Works on the shipped buttons in three engines (P8). Couples the group to two token names and to their use as a `border-radius` shorthand, which `0002-button.md` and `0003-icon-button.md` should then document (a docs-only amendment each). A consumer who sets `--line-button-radius` on every `line-button` overrides the collapse |
| (b) Per-corner tokens on the buttons | Button and IconButton gain logical corner tokens (for example `--line-button-radius-start-start`) defaulting to their radius token; the group sets those | Explicit API, no shorthand trick. Changes two shipped components' CSS API (C1 and C5 code, both specs, the CEM) |
| (c) No collapse in the component | the group lays the buttons out flush (`gap: 0`) and draws nothing else; the docs show consumer `::part(root)` corner rules, which P8 proves | Fully headless. PRD §4.1 and ARCH §13.1 promise "border collapse", so this needs a PRD revision-log entry and an ARCH change |

### D10 — Agent contract

Evidence: A2UI v0.9.1 has 18 basic types and none is a button group (`packages/line-genui/__tests__/fixtures/a2ui-v0_9_1/basic_catalog.json`, `components` keys); ARCH §17.3 maps basic `Row` to `<line-stack>` and lists no ButtonGroup target (`:1599-1607`). Stack already carries `children: ChildList` into the default slot (`stack.ts:28-30`). `0003-icon-button.md` D4 weighed a child-dependent basic route and found it needs an ARCH §17.3 change and a rule for pending children.

| Option | Shape | Tradeoff |
|---|---|---|
| (a) **Recommended.** `line` catalog only | `ButtonGroup` with `children: ChildList`, `orientation`, `loop` [PENDING D4, D5]; no action, no value prop; the Descriptor fields above | No ARCH, Phase 1 spec or `basic.ts` change. Basic-only agents keep building a Row of Buttons, with no roving focus |
| (b) (a) plus a basic route | a basic `Row` whose children all resolve to `Button` renders `line-button-group` | Basic agents get toolbars. Needs an ARCH §17.3 change, a Phase 1 spec §6.G.2 amendment, a child-dependent target, and a rule for children still pending; the tag can switch after first render |
| (c) Not agent-exposed | `agentExposed: false` with a reason | Contradicts the Phase 1 spec C6 row (`agentExposed: true`, `:1162`) and needs an amendment there |

### D11 — Events

Evidence: ARCH §17.2 C9 names ButtonGroup as not compound (`:1571`); the buttons' own `click` and `line-change` bubble through the group (P4). No consumer need for a roving-position event is recorded in the PRD or ARCH [INFERENCE].

| Option | Events | Tradeoff |
|---|---|---|
| (a) **Recommended.** None | the group fires nothing; `focusin` on the group already tells a consumer which button took focus | Smallest contract; nothing to keep in the CEM drift test |
| (b) A position event | `line-active-change` with `{ index: number }` when the roving button changes | Lets a consumer persist the remembered button. A new public event with no recorded need; agents gain nothing, because the surface binds events to actions and the group has none |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
