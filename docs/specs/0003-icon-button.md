# IconButton

| Field | Value |
|-------|-------|
| Status | `approved` (Miguel, 2026-11-05) |
| Phase | `1` |
| Tier | `Custom` |
| Tag | `line-icon-button` |
| Entrypoint | `@websublime/line-components/icon-button` |
| Form-associated | `no` (Phase 1 spec §10 SD36) |
| PRD catalogue entry | PRD §4.1, `IconButton` row (`docs/PRD.md:245`) |
| Ledger row | `01-C5` |
| Governing sections | Phase 1 spec §4.2, §6.C.0, §6.C.4 (C5 row and notes), §6.C.5 (Button, IconButton), §6.C.6, §6.G.1, §6.G.2, §6.G.3, §6.G.4 (Accessibility, Basic mapping), §6.G.5, §7.3, §7.4, §7.5, §7.6, §7.8, §10 SD18, SD31, SD35, SD36, SD39, SD82, SD98, SD99, §12 AM-002, AM-020 (L3R14-06), AM-055, AM-056, AM-058, AM-067, AM-068, AM-069, AM-070, AM-086; ARCH §5, §7, §12, §13.1, §13.5, §14.7–§14.9, §17.2–§17.4; PRD §4.1, §5.2, §8 |

Text marked `[INFERENCE]` has no probe or source behind it yet.

---

## Part A — Requirements

### Overview

#### Description

`<line-icon-button>` runs an action when the user activates it, and shows only an icon. It renders a native `<button>` inside its shadow root, so the platform keeps its keyboard, focus and accessibility behaviour (Phase 1 spec §10 SD31). It has no visible text, so its accessible name comes from the author: the host `aria-label` is copied to the inner button (ARCH §17.2 C5; PRD §4.1 "Requires accessible label for screen readers", `docs/PRD.md:245`; decision D1). It runs on the same press machine as `<line-button>`, imported from `src/shared/button-machine.ts`, and never imports Button (ARCH §13.1, `docs/ARCHITECTURE.md:585`; Phase 1 spec §6.C.5). It is not form-associated: its inner button is always `type="button"`, so it never submits or resets a form (Phase 1 spec §10 SD36). The icon arrives through the default slot, because a component never imports another to compose its children (MANIFESTO Law 4, `docs/MANIFESTO.md:45`; decision D2). It carries no visual opinion beyond its `--line-icon-button-*` tokens, which resolve through the theme roles (PRD §9.11; decision D6).

#### Use cases

- Run an action from a compact control whose meaning the icon carries, such as close, settings, more or delete.
- Toggle an on/off option from an icon, such as mute or bold, with `pressed` (decision D3).
- Show that an action is running, with `loading` and a spinner in the `loading` slot (decision D3).
- Render an agent `IconButton` node from the `line` catalog on `<line-a2ui-surface>` (ARCH §17.3; Phase 1 spec §6.C.4 C5 row, `agentExposed: true`; decision D4).

#### Anti-patterns

- A button with visible text. Use `<line-button>` (spec `0002-button.md`), which takes its name from its text.
- Submitting or resetting a form. Use `<line-button type="submit">` or `type="reset"`; IconButton is `type="button"` only (Phase 1 spec §10 SD36).
- Navigation to another URL. Use a native `<a href>`, because a button has no link semantics (`0002-button.md` Anti-patterns).
- A non-interactive glyph. Use `<line-icon>` (spec `0014-icon.md`).
- A set of toggles where one choice wins. Use RadioGroup or ToggleGroup (Phase 2; ARCH §13.1 ToggleButton bullet).
- A button that opens a menu. Use SplitButton or a Menu trigger (Phase 3; `0002-button.md` Anti-patterns).
- An icon button without a name. axe reports `button-name` on hand-written markup, and the surface refuses an agent node without one (Phase 1 spec §6.C.5).

#### User expectations

- Enter and Space activate it, and Tab reaches it unless it is disabled (APG Button, R8 `docs/research/01-research-accessibility.md:65-66`).
- A screen reader announces its name and the `button` role, though no text is visible.
- A disabled icon button cannot be focused or pressed.
- A loading icon button stays in the tab order, is announced as unavailable, and ignores presses (Phase 1 spec §10 SD35).
- A toggle icon button announces its pressed state and flips it on each press.
- Inside a form, activating it never submits or resets the form (Phase 1 spec §10 SD36).
- A `<fieldset disabled>` ancestor does not disable it, unlike a native button, because only a form-associated custom element receives `formDisabledCallback` and IconButton is not one (Phase 1 spec §10 SD36). The Browser tier proves it in chromium, firefox and webkit: the native button in the same fieldset is disabled, while the icon button stays enabled, takes focus and toggles (`packages/line-components/__tests__/integration/icon-button/icon-button.e2e.ts:275-302`; AM-001).

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| `<line-icon>` | child | the default slot (decision D2); IconButton never imports Icon (MANIFESTO Law 4; Phase 1 spec §6.C.6 "Import no other component", `docs/specs/01-spec-core-primitives.md:1228`) |
| `<line-spinner>` | child | the `loading` slot (ARCH §13.5; decision D3) |
| `<line-button>` | sibling | the shared machine module `src/shared/button-machine.ts`; neither component imports the other (ARCH §13.1; Phase 1 spec §6.C.5, `:1203`; §12 AM-002) |
| `<line-button-group>` | parent | the group's default slot; the group discovers its buttons through `slotchange` and imports no button (Phase 1 spec §6.C.5 ButtonGroup). Whether the group's roving focus covers slotted `line-icon-button` hosts is for spec `0004-button-group.md`, whose probe runs on `line-button` hosts (Phase 1 spec §10 SD10) [INFERENCE] |
| native `<form>` | none | not form-associated; the inner button is `type="button"` and has no form owner (Phase 1 spec §10 SD36; ARCH §7 list unchanged, `docs/ARCHITECTURE.md:386`) |
| `<line-a2ui-surface>` | orchestrator | creates `line-icon-button` by tag from a `line` catalog `IconButton` node, puts the `child` Icon in the default slot, maps `action` to `click`, sets `accessibility.label` as the host `aria-label`, and renders a placeholder and raises `line-a2ui-error` for a node with no name (ARCH §17.4; Phase 1 spec §6.C.5, §6.G.4 Accessibility; decisions D1, D2, D4) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| `variant` | `default \| primary \| borderless` | `default` for an ordinary action; `primary` for the main action of a view; `borderless` for a low-emphasis action in dense UI, such as a toolbar or a dialog close control |

- The values are Button's, which mirror the A2UI basic `Button` `variant` enum (`0002-button.md` Variants; `packages/line-genui/__tests__/fixtures/a2ui-v0_9_1/basic_catalog.json:488`).
- Each value only changes the defaults of `--line-icon-button-bg` and `--line-icon-button-color` on `:host` and adds no other CSS rule (ARCH §17.2 C6, `docs/ARCHITECTURE.md:1563`; Phase 1 spec §12 AM-056, "The C5–C20 rows with variants follow the new C6").
- An unknown value behaves as `default`, and the attribute keeps what the author wrote (C8; `0002-button.md` AM-002).
- No `size` or `shape` attribute; the square box comes from a token (CSS custom properties below), as Button has no size variant (`0002-button.md` Open Question 5).

---

## Part B — Technical Specification

### Anatomy

```
<line-icon-button>                              LineElement (not FormAssociated), shadowRootOptions.delegatesFocus = true
└── #shadow-root
    └── <button part="root" type="button">       role button; aria-label, aria-description, aria-pressed, aria-disabled, disabled
        ├── <span part="icon"><slot></slot></span>
        └── <span part="loading">                rendered only while loading
            └── <slot name="loading">
```

- The inner `<button>` is always `type="button"` (Phase 1 spec §6.C.5, `:1202`; §10 SD36). It sits in the shadow tree, so it has no form owner, and the host is not form-associated, so nothing acts on a form.
- The role sits on the inner native `<button>` (Phase 1 spec §6.C.4 C5 row, "Inner native `<button>` (§10 SD31)").
- The host extends `LineElement` without the `FormAssociated` mixin (Phase 1 spec §6.C.2, "Only §7 components opt in", `:987`). `LineElement` still attaches `ElementInternals`, so `reflectState` writes `data-*` and `:state()` (ARCH §14.8, `docs/ARCHITECTURE.md:1178`; Phase 1 spec §10 SD19).
- The `icon` part takes its name from the ARCH §5 vocabulary (`docs/ARCHITECTURE.md:303`; decision D2).
- Content in the `loading` slot is not rendered and not in the accessibility tree while `loading` is off, because its slot is absent (`0002-button.md` Anatomy).

### States

| Field | Value |
|-------|-------|
| Machine | the custom `createMachine()` on `@zag-js/core` 1.47.0 that Button uses, `buttonMachine` from `packages/line-components/src/shared/button-machine.ts`, run through `LineMachineController` (ARCH §8, §13.1; Phase 1 spec §6.C.4 C5 row, §6.C.5, `:1203`; §10 SD35). The module header already names `<line-icon-button>` (`button-machine.ts:1-3`) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| `idle` | start; `PRESS_END`; `PRESS_CANCEL` | `PRESS_START` when `isInteractive` passes | — |
| `active` | `PRESS_START` when `isInteractive` passes | `PRESS_END`; `PRESS_CANCEL`; `disabled` or `loading` turning true | `data-active`, `:state(active)` |

The states and transitions are the machine's (`button-machine.ts:46-89`); IconButton adds none (R7 `docs/research/01-research-zag-machines.md:216`, "None beyond Button").

| Flag | Source | Host reflection |
|------|--------|-----------------|
| `pressed` | `pressed` prop is `true` | `data-pressed`, `:state(pressed)` |
| `loading` | `loading` prop | `data-loading`, `:state(loading)` |
| `disabled` | `disabled` prop only; no `fieldset` source, because IconButton is not form-associated (Phase 1 spec §10 SD36) | `data-disabled`, `:state(disabled)` |
| `focus-visible` | machine context `focusVisible`, set when the inner button matches `:focus-visible` on focus | `data-focus-visible`, `:state(focus-visible)` (ARCH §14.9) |

- `pressed`, `loading` and `disabled` are props that the `isInteractive` guard and the actions read at event time, not finite states (Phase 1 spec §6.C.5, `:1191`; R7 `:219-221`, probe B1).
- IconButton uses the machine contract that `0002-button.md` States defines: props `disabled`, `loading`, `pressed`, `onPressedChange`; context `focusVisible`; events `PRESS_START`, `PRESS_END`, `PRESS_CANCEL`, `ACTIVATE`, `FOCUS`, `BLUR`; the `watch` that cancels a press when `disabled` or `loading` turns true (`button-machine.ts:18-25`, `:27-33`, `:51-55`).
- If the machine fails to start, the controller's fallback renders the inner button through `connectStatic()` with `disabled` and `loading` applied (`button-machine.ts:137-140`; MANIFESTO Law 9).
- No `invalid` flag: the C4 external-validity rule applies to form-associated components only (ARCH §17.2 C4).

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ComponentId` | the icon, usually one `<line-icon>`; the A2UI `child` (decision D2) |
| `loading` | `ComponentId` | a spinner, loading text or both; rendered only while `loading` is on; hand-written markup only, outside the descriptor slot map, as on Button (`0002-button.md` AM-005; decision D3) |

- A `<line-icon>` with no `aria-label` is decorative and hidden through its internals (`0014-icon.md` decision D1), so the icon never names the button. The name comes only from the sources in A11y.
- The agent `child` takes any `ComponentId`, not only an Icon: the descriptor schema accepts any id, and the surface puts whatever component the id names in the default slot (`packages/line-genui/__tests__/catalog.test.ts:153-161`; `packages/line-genui/__tests__/a2ui-surface.test.ts:682-695`, a Separator child; AM-001).

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<button>` | the control: square box, background, border, focus ring |
| `icon` | `<span>` | wraps the default slot (decision D2); `display: inline-flex`, so its height is the icon's and not a line box (AM-001) |
| `loading` | `<span>` | wraps the `loading` slot; present only while `loading` is on (ARCH §5, `:314`; §13.5); `display: inline-flex`, as `icon` (AM-001) |

### Props

Decisions D1 and D3 set this table.

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `variant` | `variant` | `'default' \| 'primary' \| 'borderless'` | `'default'` | yes | semantic emphasis (C6) |
| `disabled` | `disabled` | `boolean` | `false` | yes | removes the button from the tab order and blocks activation |
| `loading` | `loading` | `boolean` | `false` | yes | keeps focus, sets `aria-disabled="true"`, blocks activation, renders the `loading` part (Phase 1 spec §6.C.5, `:1192-1193`; §10 SD35) |
| `pressed` | `pressed` | `boolean \| undefined` | `undefined` | yes | absent means not a toggle; `"false"` parses to `false`, any other value to `true`; reflects as `"true"` or `"false"` (`0002-button.md` Props; `packages/line-components/src/button/button.ts:47-51`) |
| `ariaLabel` | `aria-label` | `string \| null` | `null` | yes | the accessible name; copied to the inner button (C5) |
| `ariaDescription` | `aria-description` | `string \| null` | `null` | yes | copied to the inner button (C5) |

- For `variant`, "Reflects" means a value the author or code sets is written to the attribute; the default leaves no attribute (Lit `useDefault: true`), so an unknown author value stays as written (C8) and removing the attribute restores the default (`0002-button.md` AM-002).
- `ariaLabel` and `ariaDescription` are declared as Lit properties on the `aria-label` and `aria-description` attributes, as Button does (`button.ts:107-108`, `:354-355`).
- No `type`, `name`, `value`, `form*` or `custom-validity`: IconButton is `type="button"` only and not form-associated (Phase 1 spec §10 SD36; ARCH §17.2 C4 applies to §7 components only).

### Events

Decision D3 keeps `pressed`, so IconButton fires one event.

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| `line-change` | `LineIconButtonChangeDetail`, `{ value: boolean }` | **Commit event (C9).** A user activation flips `pressed` on a toggle icon button; `detail.value` is the new state. It bubbles and is not composed. It never fires when `pressed` changes through the property or the attribute, nor for a blocked activation, focus, hover or a cancelled press (`0002-button.md` Events; `button.ts:195-205`) |

- Activation means a `click` that reaches the host and passes `isInteractive`. A pointer click, Enter or Space on the inner button, and `host.click()` all count (`0002-button.md` Form behaviour, first bullet).
- The host sends `ACTIVATE` after the `click` dispatch ends and only when no listener called `preventDefault()`, as Button does (`button.ts:250-262`), so a consumer cancels a toggle flip with `preventDefault()`.
- While `disabled` or `loading`, IconButton stops a `click` that reaches the host in the capture phase. No bubble-phase listener on the host or its ancestors receives it, so the surface action bound to `click` does not run (`button.ts:250-256`; `0002-button.md` Events).
- The native `click` is the activation event, and the descriptor action map binds to it (Phase 1 spec §6.G.1, `:1313`).
- No `line-input`, because a toggle has no live edit (ARCH §17.2 C3).
- The class JSDoc carries `@fires {CustomEvent<LineIconButtonChangeDetail>} line-change`, which the CEM drift test reads (Phase 1 spec §7.3, `:2101`; §6.C.6, `:1225`).

### CSS custom properties

Decision D6 sets these tokens and the square box.

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-icon-button-radius` | `var(--line-radius-2)` | `root` |
| `--line-icon-button-bg` | `var(--line-gray-bg)`; `primary`: `var(--line-accent-solid)`; `borderless`: `transparent` | `root` |
| `--line-icon-button-color` | `var(--line-gray-text)`; `primary`: `var(--line-accent-contrast)`; `borderless`: `var(--line-accent-text)` | `root` |
| `--line-icon-button-size` | `var(--line-size-7)` | `root` (`min-inline-size` and `min-block-size`, with no inline padding) |
| `--line-icon-button-font-size` | `var(--line-font-size-1)` | `root` (`font-size`; a slotted `<line-icon>` at its `1em` default follows it, `0014-icon.md` decision D2, defaults F4, F11) |
| `--line-icon-button-focus-ring` | `var(--line-focus-ring, 2px solid currentColor)` | `root`, as `outline` under `:host([data-focus-visible])` (ARCH §14.9, `docs/ARCHITECTURE.md:1236`) |

- `:host` declares the tokens (PRD §9.11), and `:host([variant="primary"])` and `:host([variant="borderless"])` redeclare the two colour tokens (ARCH §17.2 C6). The defaults are Button's (`button.ts:116-124`, `:133-141`), so the two components match out of the box.
- `--line-size-7` is `2rem` and `--line-font-size-1` is `1rem` (`packages/line-tokens/src/sizing.css:16`, `typography.css:31`), so the default box is a 2rem square around a 1rem icon. Without `line-tokens` the size resolves to nothing and the box shrinks to its content. The Browser tier proves both in chromium, firefox and webkit: 32 × 32 px with the tokens, and 16 × 16 px around a 16 px icon without them (`packages/line-components/__tests__/integration/icon-button/icon-button.e2e.ts:353-362`; AM-001).
- `::part(icon)` and `::part(loading)` are `display: inline-flex` (`packages/line-components/src/icon-button/icon-button.ts:117-120`). A flex item of `root` that held the icon in a line box would take the line height, so the box would stop being square at a small size or a large `line-height`, and a slotted spinner would sit on the baseline instead of in the middle. This is a layout rule, not a state style (AM-001).
- The focus ring is the only state style, as on Button (`0002-button.md` Open Question 9; ARCH §14.9). Hover, active, pressed, loading and disabled carry no styles; themes and consumers style them through `[data-*]` and `:state()` (ARCH §14.8).

### Keyboard

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | moves focus to or from the inner button; skips a disabled icon button and keeps a loading one |
| `Enter` | enters `active` on keydown and activates, as a native button does |
| `Space` | enters `active` on keydown and activates on keyup |
| `Enter` / `Space` while loading | no activation and no `active` state |

On a toggle icon button, activation flips `pressed` and fires `line-change`. The keys are those of the APG Button pattern (R8 `:65-66`), handled by the native button; the host listens to `keydown` and `keyup` only to drive `active` (`button.ts:306-312`).

### A11y

Decision D1 sets the name sources.

| Field | Value |
|-------|-------|
| Role | `button` on the inner native `<button part="root">` (Phase 1 spec §10 SD31; §6.C.4 C5 row) |
| ARIA attributes | `aria-label` and `aria-description`, copied from the host; `aria-pressed="true\|false"` on a toggle, from `pressed`; `aria-disabled="true"` while `loading` and not `disabled`; native `disabled` while disabled (`button-machine.ts:109-125`) |
| Accessible name | the host `aria-label` copied to the inner button (ARCH §17.2 C5, `docs/ARCHITECTURE.md:1562`; ARCH §13.1 "`aria-label` required"). The slotted icon is decorative and adds nothing (`0014-icon.md` decision D1) |
| Focus | `delegatesFocus: true`, so `host.focus()` focuses the inner button (R8 `:150-152`, probe P1; `button.ts:92`); `data-focus-visible` on the host for keyboard focus only (ARCH §14.9) |

- **Name check.** TypeScript cannot check the name in markup or on elements the surface creates by tag, so the check is split (ARCH §13.1, `:585`; Phase 1 spec §10 SD36; R8 `:302-304`, `:349-350` Q12). On hand-written markup the axe gate catches a missing name through `button-name` on the inner native `<button>` (Phase 1 spec §6.C.5, `:1201`; R8 `:198`, probe P1; R2 `docs/research/01-research-projection-technique.md:162`, §6 Q5 `:299`). On the agent path the descriptor marks the name required and the surface refuses a nameless node before render (Phase 1 spec §6.C.5, `:1200`; §10 SD82). axe's naming rules apply because the role is on an inner native element (Phase 1 spec §7.4, `:2125`).
- **Host.** The host stays a role-less `generic` element and keeps the author's `aria-label`. Chromium exposes it as a named `generic` node, and axe-core 4.14.0 reports no violation for that case (R8 `:156-159`, `:199`; `0002-button.md` A11y).
- **No host `aria-labelledby`.** An `aria-labelledby` ID in the document does not reach an element inside the shadow root, and one copied inside cannot reach a light-DOM id, so copying the attribute leaves the inner button unnamed (R8 `:130-132`). Element reflection, `button.ariaLabelledByElements = [element]` set from inside, names it in Chromium and reads back in all three engines (R8 `:135-137`, `:204`, probe P5 `:264`). Decision D1 keeps Button parity and leaves that route out; an author who labels by a visible element repeats its text in `aria-label`.
- **Loading.** With the name taken from `aria-label`, content in the `loading` slot does not join the name, because `aria-label` wins over content in the name computation. The Browser tier proves it: Playwright computes the name `Refresh` for a loading button whose `loading` slot shows `Loading…` in chromium, firefox and webkit, and Chromium's own accessibility tree, read through CDP, names the inner button `Refresh` (`packages/line-components/__tests__/integration/icon-button/icon-button.e2e.ts:332-340`, `:384-396`; AM-001). A consumer who wants the loading state announced changes `aria-label` while loading. An unannounced loading change is a known risk, as on Button (`0002-button.md` A11y; R7 `:208-209`).
- **Toggle label.** A toggle keeps one label in both states, because `aria-pressed` carries the state [INFERENCE: APG Button pattern guidance, https://www.w3.org/WAI/ARIA/apg/patterns/button/, not quoted in R8].
- **Internals proof (AM-058).** IconButton sets no role or ARIA state through `ElementInternals`; its internals carry only the custom states of `reflectState`. The Chromium CDP accessibility-tree assertion and `INTERNALS` read-back that Phase 1 spec §6.C.4 requires for internals-only roles therefore do not apply (Phase 1 spec `:1180`; §10 SD39; §12 AM-058).
- **Screen-reader check.** A Playwright `ariaSnapshot` in the Browser tier, in chromium, firefox and webkit, records one `button` node with the expected name and pressed state per host, as Button's does (`0002-button.md` A11y; `packages/line-components/__tests__/integration/button/button.e2e.ts:456-479`). Playwright computes the snapshot itself, so it does not show what each engine exposes. A manual screen-reader pass is optional and never blocks the row (Phase 1 spec §12 AM-058).
- **Firefox and WebKit gap.** No check above proves what Firefox and WebKit expose to assistive technology for the inner button's copied name and pressed state; the gap is recorded here (Phase 1 spec §6.C.4 notes, `:1180`; §12 AM-058).

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | every prop is a string enum, a boolean, an optional boolean or a string |
| C2 | Slots carry `@slot` and a single or multiple classification | `@slot` for the default and `loading` slots; both `ComponentId` (Slots table) |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | `@fires line-change` with `{ value: boolean }`; no unprefixed `input` or `change` |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated (Phase 1 spec §10 SD36) |
| C5 | The host accepts an accessible name and applies it to the element with the role | host `aria-label` and `aria-description` are copied to the inner `<button>` (decision D1) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | `variant` is `default`, `primary` or `borderless`; a value the author or code sets is reflected and the default leaves no attribute; `primary` and `borderless` redeclare the defaults of `--line-icon-button-bg` and `--line-icon-button-color` on `:host` and add no other rule (decisions D3, D6) |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries every tag for each slot, part, token and event; nothing is deprecated |
| C8 | Missing or partial props degrade to an empty or neutral state | with no attributes and no content it renders an empty, unnamed `type="button"` inner button with no host `variant` attribute; unknown `variant` values behave as `default` and keep the author's attribute. axe reports the missing name on such markup, which is the SD36 catch, not a crash |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | value-bearing, because the binding map names `pressed` as the value prop; `line-change` is its one commit event and fires once per flip |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

#### Descriptor fields

Decisions D1–D4 set these fields.

| Field | Value |
|-------|-------|
| Catalog name | `IconButton` |
| Tag | `line-icon-button` |
| `load()` subpath | `@websublime/line-components/icon-button` |
| Prop schema | `variant` (`z.enum`, plain `.describe()`), `disabled`, `loading`, `pressed` (`DynamicBoolean`), plus the catalog-only `child` (`ComponentId`) and `action` (`Action`), which the frontend-tool walker leaves out (Phase 1 spec §6.G.3, `:1404`), and `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1, `:1323`, `:1326`; §12 AM-067) |
| Slot map | `(default)` → `ComponentId` (`child`) only; `loading` stays out, so an agent never fills it (`0002-button.md` AM-005) |
| Binding map | `variant`, `disabled`, `loading` → attribute; `pressed` → property; value prop `pressed`; commit event `line-change` (as `packages/line-genui/src/catalog/descriptors/button.ts:33-41`) |
| Action map | `action` → `click`, marked native (Phase 1 spec §6.G.1, `:1313`, `:1327`; §12 AM-067, AM-070) |
| Accessibility requirements | `requiredName: [{ kind: 'accessibilityLabel' }]`: an `accessibility.label` that is non-empty after trimming whitespace, which the surface sets as the host `aria-label`; `hostNaming: { kind: 'always' }` (`packages/line-genui/src/catalog/descriptor.ts:128-130`, `:154`; Phase 1 spec §6.G.4, `:1512-1514`; §12 AM-068). A `childText` source is left out: `childText` counts only basic-catalog `Text` (`packages/line-genui/src/a2ui/projection.ts:161-166`), and the `line` catalog holds no `Text`, so a `line` Icon child always yields empty text |
| Agent-facing description | A square button that shows only an icon and runs an action when the user activates it. Put an Icon in the default slot (`child`). It has no visible text, so it needs `accessibility.label`, the name assistive technology announces; a node without one is not rendered. `variant` marks emphasis, with `primary` for the main action of a view, `borderless` for a low-emphasis action and `default` otherwise. Set `disabled` when the action is unavailable and `loading` while it runs; a loading button stays focusable and ignores presses. Set `pressed` to `true` or `false` to make a toggle, so each press flips it and fires `line-change` with the new value. Leave `pressed` unset for a plain button. For a button with visible text, use Button. |
| Tool description | A square button that shows only an icon and runs an action when the user activates it. The tool sets no icon. Set `accessibilityLabel` to the text the button stands for; the app gives the button that text as its accessible name, and a button without it has no name. `variant` marks emphasis, with `primary` for the main action of a view, `borderless` for a low-emphasis action and `default` otherwise. Set `disabled` when the action is unavailable and `loading` while it runs; a loading button stays focusable and ignores presses. Set `pressed` to `true` or `false` to make a toggle, so each press flips it and fires `line-change` with the new value. Leave `pressed` unset for a plain button. |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C5 row) |

- The agent-facing description names `child` (a `ComponentId`) and `accessibility.label`, so the descriptor sets the tool description, which names neither (Phase 1 spec §6.G.3, `:1423`; §12 AM-086). Both texts stay under the 1024-character cap (Phase 1 spec §6.G.3, `:1422`).
- The frontend tool carries `variant`, `disabled`, `loading`, `pressed`, and the optional `accessibilityLabel` and `accessibilityDescription`, because `hostNaming` is `always` (`packages/line-genui/src/catalog/tools.ts:140-148`, `:228`; Phase 1 spec §6.G.3, `:1405`; §12 AM-069). The walker drops `child`, so a tool-created icon button has no icon, and the tool schema keeps `accessibilityLabel` optional, so the schema does not enforce the required name; the app renders a tool call (PRD Appendix D, Tiers). Decisions D1 (a) and D2 (a) accept both limits, over a required tool name (D1 (d)) and an agent `icon` prop (D2 (b)).
- The surface checks `requiredName` before render. A node with no label renders `[data-line-a2ui-placeholder="missing-name"]` and raises one `line-a2ui-error` with code `MISSING_ACCESSIBLE_NAME`; a label still pending keeps the node hidden without an error (`packages/line-genui/src/a2ui/projection.ts:345-353`, `:366-380`; Phase 1 spec §6.G.4 Errors, `:1487`; §10 SD82).
- The surface sets no `type` on `line-icon-button`: the inner button is always `type="button"` and the host has no `type`, `name` or `value`, so the AM-081 rule for `line-button` has nothing to force here (Phase 1 spec §6.G.4 Button, `:1541-1545`; §10 SD36).
- Catalog membership: the `line` catalog only (decision D4). The `basic` map keeps A2UI `Button` → `line-button` and gains no route to `line-icon-button` (ARCH §17.3 table, `docs/ARCHITECTURE.md:1602`; Phase 1 spec §6.G.2, `:1389`; `packages/line-genui/src/catalog/basic.ts:122-125`). The descriptor joins the `descriptors` array in catalog-name order (`packages/line-genui/src/catalog/index.ts:97-102`).
- C5 ships its descriptor in the same PR (Phase 1 spec §6.C.0 step 3, `:927`).

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/icon-button` |
| Kind | `independent` (ARCH §12, `docs/ARCHITECTURE.md:570`; Phase 1 spec §4.2, `:293`) |
| Registers | `line-icon-button` |
| Reset modules | `commonReset`, `buttonReset` (ARCH §14.7, `docs/ARCHITECTURE.md:1134`; `reset.button.css`, `:809`) |

- Files: `src/icon-button/icon-button.ts` (class and `customElements.define`), `src/icon-button/icon-button.types.ts`, `src/icon-button/index.ts`. The class imports `../shared/button-machine.js` and nothing from `src/button/` (Phase 1 spec §6.C.5, `:1203`).
- `package.json` gains the `./icon-button` export of Phase 1 spec §4.2 (`:244`), and the Vite build gains the `icon-button/index` entry beside `button/index` (`packages/line-components/vite.config.mjs:11`).
- The isolation scan allows `src/shared/` modules in any bundle and fails when a bundle holds another component's module, so the `./icon-button` bundle may hold the machine and must not hold `src/button/button.ts` (Phase 1 spec §7.5, `:2134`).
- Gzipped size is reported against the < 5 KB soft target through the "Size report" step (Phase 1 spec §6.C.6, `:1227`; §7.6).

### Markup examples

```html
<!-- Default -->
<line-icon-button aria-label="Settings">
  <line-icon library="lucide" name="settings"></line-icon>
</line-icon-button>

<!-- Variants -->
<line-icon-button variant="primary" aria-label="Add item">
  <line-icon library="lucide" name="plus"></line-icon>
</line-icon-button>
<line-icon-button variant="borderless" aria-label="Close dialog">
  <line-icon library="lucide" name="x"></line-icon>
</line-icon-button>

<!-- Disabled -->
<line-icon-button disabled aria-label="Delete">
  <line-icon library="lucide" name="trash-2"></line-icon>
</line-icon-button>

<!-- Loading, with a consumer-supplied spinner -->
<line-icon-button loading aria-label="Refreshing">
  <line-icon library="lucide" name="refresh-cw"></line-icon>
  <line-spinner slot="loading"></line-spinner>
</line-icon-button>

<!-- Toggle -->
<line-icon-button pressed="false" aria-label="Mute">
  <line-icon library="lucide" name="volume-x"></line-icon>
</line-icon-button>
```

A `line` catalog node pair that the surface renders as the borderless example above, once `iconMap` maps `close` (`packages/line-icons/src/a2ui/sets.ts:33`):

```json
[
  { "id": "close", "component": "IconButton", "child": "close-icon", "variant": "borderless",
    "accessibility": { "label": "Close dialog" }, "action": { "event": { "name": "close" } } },
  { "id": "close-icon", "component": "Icon", "name": "close" }
]
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom | render with no errors; prop defaults and reflection, with no host `variant` attribute for a default; the `pressed` and `variant` converters; an unknown `variant` in the initial markup keeping the author's attribute; `data-*` and `:state()` reflection through the fake internals; `line-change` once per toggle activation and never on a property or attribute change; guards blocking activation while `disabled` or `loading`; `aria-label`, `aria-description`, `aria-pressed` and `aria-disabled` on the inner button; the inner button always `type="button"`; no `formAssociated` on the class; the `icon` and `loading` parts; the default and `loading` slots; the token defaults on `:host`; the C8 empty render; the machine-failure fallback render; `manifest-paths.test.ts` stays green with the new declaration (Phase 1 spec §6.C.6 stream acceptance) |
| Browser | Playwright `*.e2e.ts` on chromium, firefox and webkit | Tab order with `disabled` and `loading`; Enter and Space activation; `data-active` on pointer and keys; `data-focus-visible` on keyboard focus only; no `click` reaching host listeners while `disabled` or `loading`; `preventDefault()` on `click` cancelling a toggle flip; an icon button inside a `<form>` submits and resets nothing; a `<fieldset disabled>` ancestor leaving it enabled, focusable and toggling (AM-001); the box size with and without `line-tokens`; the name with `loading` slot content, also from Chromium's accessibility tree through CDP; the `ariaSnapshot` check (A11y) (Phase 1 spec §7.8, `:2180`; §10 SD99) |
| A11y | axe-core | zero violations (MANIFESTO Law 3) in every IconButton story: default, `primary`, `borderless`, disabled, loading with the `loading` slot, toggle off and on (Phase 1 spec §7.4, `:2118-2119`). A negative fixture built with `page.setContent()`, a `<line-icon-button>` with a decorative `<line-icon>` and no name, must report `button-name`, so the gate is proved to catch the hand-written case (Phase 1 spec §6.C.5, `:1201`; pattern of `packages/line-components/__tests__/a11y/axe-gate.e2e.ts:1-12`) |
| htmx | Playwright `*.e2e.ts` through the shared harness `@websublime/line-testing/htmx` (`packages/line-testing/src/htmx.ts`), on htmx 2 and htmx 4 in chromium, firefox and webkit | The harness runs (decision D5). Check (a), form value: `n/a`, because IconButton is not form-associated and its value prop `pressed` never enters form data. Check (b), one request per commit: `hx-trigger="line-change"` on `<line-icon-button pressed="false" aria-label="Mute">` sends one request per click. Check (c), no request without a commit: focus and hover send none. Check (d), slot swap: server content swapped into the default slot renders, and the inner button keeps the host `aria-label` as its name (plan §2.4, `docs/plans/01-plan-core-primitives.md:171-174`; ARCH §17.2 C9; pattern of `packages/line-components/__tests__/integration/button/button.htmx.e2e.ts`) |
| Visual | Playwright `icon-button.visual.ts` on the `visual` project | every IconButton story, with Linux baselines from a `visual-baselines.yml` run; the `default`, `primary` and `borderless` baselines differ from each other (Phase 1 spec §6.C.6, `:1233`; §10 SD98) |
| Update rate | `measureHostUpdates` from `@websublime/line-testing/update-rate` on a connected `<line-icon-button>`, driven by flipping `pressed` | the rate is recorded in the C5 PR; a rate past the C21 budget, `UPDATE_BUDGET_MS` (1 ms per host update) at `BUDGET_UPDATES` (3,600 accumulated updates), stops the row and returns it to the orchestrator (`packages/line-testing/src/update-rate.ts:31`, `:50`; Phase 1 spec §6.C.6, `:1232`; §10 SD18; §12 AM-055; pattern of `packages/line-components/__tests__/button.update-rate.test.ts`) |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts`; Playwright axe in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` | a `line` catalog `IconButton` node with no `accessibility.label`, and one with `" "`, renders the `missing-name` placeholder and raises one `MISSING_ACCESSIBLE_NAME` `line-a2ui-error` (Phase 1 spec §6.C.5 acceptance, `:1204`; §6.G.4, `:1586`, `:1589`; §12 AM-020, L3R14-06); a named node renders `<line-icon-button aria-label="…">` with its `line-icon` child in the default slot and raises `line-a2ui-action` on click; the node joins the surface render fixture (`apps/storybook/stories/agent-ui/a2ui-fixtures.ts`) and the surface axe test with zero violations (Phase 1 spec §6.C.6, `:1231`; §6.G.4, `:1556`) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the CEM coverage and drift tests pass with the new descriptor, `click` checked against the native DOM event list (Phase 1 spec §6.G.5; ARCH §17.3, `:1581-1582`); `catalog.json` holds `IconButton` and its inline projection validates (Phase 1 spec §6.G.2); the `IconButton` tool takes the tool description, stays at or under 1024 characters and passes the backtick guard (Phase 1 spec §6.G.3, `:1420-1423`, `:1435`) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./icon-button` register `line-icon-button` only, and the isolation scan finds no Button module in its bundle (Phase 1 spec §7.5, `:2133-2134`) |

- PRD §5.2 checklist mapping (`docs/PRD.md:531-540`; Phase 1 spec §6.C.6, `:1222`): (1) render, (2) reactive props, (3) slots, (4) parts, (5) custom properties and (6) events in the Unit tier; (7) keyboard in the Browser tier (§10 SD99); (8) axe in the A11y tier.
- The axe and visual tests run against the Storybook stories on port 4320 (Phase 1 spec §6.P.7, §6.P.11). The story list lives in `packages/line-components/__tests__/icon-button-stories.ts`, as `button-stories.ts` does for Button. The keyboard, form and htmx tests use fixture pages under `packages/line-components/__tests__/integration/icon-button/`, served by the existing port-4321 `webServer` (`playwright.config.ts:25`).
- The C5 PR also fills the IconButton row of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md`, writes the Storybook docs and adds a changeset (Phase 1 spec §6.C.6, `:1223-1226`).

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| D1 | Which name sources does IconButton accept, on markup and on the agent path? (Phase 1 spec §6.C.4 C5 row, "Name sources it accepts") | Miguel | resolved: option (a), Button parity: the host `aria-label` and `aria-description` are copied to the inner button, with no `aria-labelledby` and no `label` property, and the descriptor requires `accessibilityLabel` only (Miguel, 2026-11-05) |
| D2 | How does the icon reach IconButton, given MANIFESTO Law 4? | Miguel | resolved: option (a), the default slot inside `part="icon"`; on the agent path `child` names an Icon node (Miguel, 2026-11-05) |
| D3 | Which Button props carry over? | Miguel | resolved: option (a), `variant`, `disabled`, `loading` (with the `loading` slot and part) and `pressed`; no form props and no size prop (Miguel, 2026-11-05) |
| D4 | Does the `basic` catalog route any A2UI basic type to `line-icon-button`? | Miguel | resolved: option (a), no; IconButton is in the `line` catalog only, and basic `Button` stays `line-button` (Miguel, 2026-11-05) |
| D5 | Does the htmx row run, or is it `n/a`? | Miguel | resolved: option (a), the harness runs; check (a) is `n/a`, and checks (b), (c) and (d) run as the Tests htmx row states (Miguel, 2026-11-05) |
| D6 | Which CSS custom properties does IconButton expose, and how is it square? | Miguel | resolved: option (a), its own `--line-icon-button-*` tokens, with the square from `--line-icon-button-size` as `min-inline-size` and `min-block-size` (square sub-choice (i)) (Miguel, 2026-11-05) |

Miguel decided D1–D6 on 2026-11-05, each on the option the draft recommended. The option tables below stay as the record of what he weighed.

### D1 — Name sources

Evidence: C5 lets the host accept `aria-label` and `aria-description` "or a documented label property" (ARCH `:1562`); ARCH §13.1 says "`aria-label` required" (`:585`); R8 gives the IconButton name as `aria-label` or `aria-labelledby` (`:66`). Copying the host `aria-label` names the inner button in all three engines (R8 `:158`, probe P1; Button's shipped `ariaSnapshot`, `0002-button.md` A11y). A copied `aria-labelledby` ID cannot reach a light-DOM id from the shadow root (R8 `:130-132`). `ElementInternals.ariaLabelledByElements` would set a default on the host, which is `generic` and may not be named (R8 `:55`), and would leave the inner button unnamed, as a host `aria-label` alone does (R8 `:156-157`) [INFERENCE: not probed for `aria-labelledby`]. Element reflection on the inner button, `button.ariaLabelledByElements = [element]`, gives the name in Chromium, reads back in all three engines, and axe 4.14.0 reports nothing (R8 `:135-137`, `:204`, probe P5 `:264`); its support is Chrome 135, Firefox 136, Safari 16.4 for the internals form (R8 `:109`) [INFERENCE: same for `Element`]. Reference target ships only in Chrome 152+ (R8 `:104`, `:126`). On the agent path the descriptor API offers two `NameSource` kinds, `childText` and `accessibilityLabel` (`packages/line-genui/src/catalog/descriptor.ts:128-130`); `childText` counts only basic `Text` (`projection.ts:165`). The emitted tool always keeps `accessibilityLabel` optional (`tools.ts:106-109`; Phase 1 spec `:1405`).

| Option | Markup path | Agent path | Tradeoff |
|---|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-05). Button parity | host `aria-label` and `aria-description`, copied to the inner button | `requiredName: [{ kind: 'accessibilityLabel' }]` | Proven in three engines through Button; no new code path; one name API across Button and IconButton. Authors who label by a visible element (`aria-labelledby`) must repeat the text in `aria-label` |
| (b) (a) plus host `aria-labelledby` | (a), and the host resolves its `aria-labelledby` ids in its root node (`getRootNode()`) and sets `ariaLabelledByElements` on the inner button | as (a); A2UI has no labelled-by input | Matches R8 `:66` and the `aria-labelledby` support Icon and Separator have on their hosts. Costs id resolution on attribute change and on connect, misses an element added after resolution unless the host observes the tree [INFERENCE], adds a Chromium CDP Browser test, and Firefox and WebKit naming stays unverified (R8 P5 read back only). axe treatment of `aria-labelledby` on the generic host is not probed |
| (c) (a) plus a `label` attribute | a `label` string property rendered as the inner `aria-label`, documented as C5's label property | either keep `accessibilityLabel` only, or add a `label` `DynamicString` prop with a new `NameSource` kind | Gives a name API that does not look like ARIA. Two attributes name the same thing, and Button has no `label`. The agent variant needs a descriptor API change (`descriptor.ts:128-130`) and a surface change (`projection.ts:366-380`), so Phase 1 spec §6.G.1 and §6.G.4 AMs, and the tool would carry both `label` and `accessibilityLabel` |
| (d) (a) plus a required tool name | as (a) | as (a), and the IconButton tool marks `accessibilityLabel` required | Closes the gap where a tool-created IconButton has no enforced name. Needs a G3 emitter change and a Phase 1 spec §6.G.3 AM, because the walker emits the accessibility parameters as optional for every tool (`:1405`) |

### D2 — Icon content

Evidence: MANIFESTO Law 4 bars a component from importing another to compose its children; slots and the orchestrator pattern are the only wiring (`docs/MANIFESTO.md:45`; Phase 1 spec §6.C.6, `:1228`; ARCH §17.4 Composition, `:1622`). The A2UI basic `Button` models an icon-only button as a `child` Icon (`basic_catalog.json:508`, "Only use an 'Icon' if the requirements explicitly ask for an icon-only button"). The descriptor binding kinds set element attributes or properties, or a surface lookup that "sets element members" (`descriptor.ts` `SurfaceLookup`, `Binding`); none creates a child. The frontend-tool walker drops `ComponentId` props (Phase 1 spec `:1404`).

| Option | Shape | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-05). Default slot | one default slot, `ComponentId`, wrapped in `part="icon"`; the agent `child` (`ComponentId`) names an Icon node, which the surface puts in the default slot | Same wiring as Button's `child` (`descriptors/button.ts:29`, `:32`); no API change. An agent can name any component as `child`, not only an Icon [INFERENCE: `ComponentId` carries no type constraint]. A tool-created icon button has no icon, as a tool-created Button has no text (`0002-button.md` Descriptor fields) |
| (b) Default slot plus an agent `icon` name | (a) on markup; the descriptor adds an `icon` `DynamicString` (an A2UI icon name), and the surface creates a `<line-icon>` from `iconMap` and slots it into the host | The surface composes, so Law 4 holds, and the tool gains an `icon` parameter. Needs a new binding kind that creates a child, G1 and G4 AMs, and a CEM drift rule for a prop that names no element member (ARCH `:1581`). Two agent routes to one icon (`child` and `icon`) |
| (c) An `icon` attribute rendered inside | `<line-icon-button icon="settings">` renders `<line-icon>` in its shadow root | Not viable: it composes a child by component, which Law 4 and the §6.C.6 obligation forbid. Listed so the ban is on record |

### D3 — Props carried over from Button

Evidence: the shared machine already takes `disabled`, `loading` and `pressed` (`button-machine.ts:18-25`); ARCH §13.1 says "same machine as Button" (`:585`); SD36 makes IconButton `type="button"` only and not form-associated; SD35 fixes the loading semantics (focusable, `aria-disabled`, consumer text); C3 makes a component value-bearing when its binding map names a value prop (ARCH `:1560`), which pulls in C9 and the htmx row (D5). Button has no size variant (`0002-button.md` Open Question 5).

| Option | Props | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-05). Full parity minus form | `variant`, `disabled`, `loading` (with the `loading` slot and part, `aria-disabled`, consumer loading content), `pressed` (toggle, `aria-pressed`, `line-change`, value prop); no `type`, `name`, `value`, `form*`, `custom-validity`; no size or shape prop | One mental model across Button and IconButton; icon toggles (mute, bold) are covered. Value-bearing, so C9 and the htmx row apply. A spinner beside the icon breaks the square unless the consumer hides `::part(icon)` while `[data-loading]` |
| (b) Without `pressed` | `variant`, `disabled`, `loading` | Not value-bearing: no `line-change`, htmx `n/a`. Icon toggles go to Button with `pressed` and an icon in its default slot, which needs the same `aria-label` |
| (c) Without `loading` | `variant`, `disabled`, `pressed` | No loading slot or part in a square box. A consumer who swaps the icon for a spinner and sets `disabled` loses focus, against the SD35 "stays focusable" rule for Button |
| (d) Minimal | `disabled` only | Smallest surface. No variant tokens (C6 not used), no toggle, no loading; agents lose the emphasis hints Button carries |

### D4 — `basic` catalog routing

Evidence: ARCH §17.3 maps A2UI basic `Button` to `<line-button>` and lists no IconButton target (`docs/ARCHITECTURE.md:1602`); A2UI v0.9.1 has 18 basic types and no IconButton (`basic_catalog.json`, `components` keys); the `basic` map "holds the 10 Phase 1 types … and no other" (Phase 1 spec `:1389`) and one target per type (`basic.ts:64-80`, `:122-125`); C10's `Image` `variant: "avatar"` route is the only planned conditional target (Phase 1 spec `:1374`). An icon-only basic `Button` already renders today as a named `line-button` when it carries `accessibility.label`, and as a `missing-name` placeholder when it does not (`descriptors/button.ts:44`; R2 missing-name fixture, `docs/research/assets/01-r2/spike/src/fixtures.ts:159-172`).

| Option | Routing | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-05). `line` catalog only | IconButton is a `line` catalog component; basic `Button` stays `line-button` | No ARCH, Phase 1 spec or `basic.ts` change; basic agents keep a working, name-checked icon-only Button. Basic agents never get IconButton's square tokens or `icon` part |
| (b) Route basic `Button` with an `Icon` child | basic `Button` whose resolved `child` is an `Icon` renders `line-icon-button` | Basic agents get the dedicated component. Needs an ARCH §17.3 table change and a Phase 1 spec §6.G.2 AM, a child-dependent `BasicTarget` shape, and a rule for a `child` still pending (`projection.ts:161-162`), whose type is unknown at first render; a later tag switch replaces the element and can lose focus [INFERENCE: the reconciler keys by `instanceId`, not by tag]. A2UI's basic `variant` enum has no icon value to route on instead, and line does not re-emit the basic schema (Phase 1 spec `:1371`) |

### D5 — htmx row

Evidence: the htmx row applies to value-bearing or compound components (plan §2.4, `docs/plans/01-plan-core-primitives.md:171-174`; ARCH §17.2 C9); IconButton is not compound, and is value-bearing only if its binding map names `pressed` (D3). Button ran (b)–(d) and replaced (a) with a Button-local submit test (`0002-button.md` Tests, htmx row).

| Option | Row | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-05). Run the harness | Harness check (a), form value, is `n/a`: IconButton is not form-associated and `pressed` never enters form data. Checks (b) one request per `line-change`, (c) no request on focus or hover, and (d) a swapped icon renders and the name stays, all run | Proves the commit event in both htmx majors and the slot swap. One more e2e file and fixture page |
| (b) Mark the row `n/a` | The whole row `n/a`: neither value-bearing nor compound | Valid only if D3 drops `pressed` or the binding map names no value prop. Otherwise it breaks plan §2.4 and C9 |

### D6 — CSS custom properties and square sizing

Evidence: C6 lets a variant change only "the component's own `--line-{component}-*` tokens" (ARCH `:1563`); ARCH §14.9 names the ring token `--line-{component}-focus-ring` (`:1236`); Button's tokens are declared on `line-button`'s own `:host` (`button.ts:116-124`), so they reach no other element unless a consumer sets them on an ancestor. Icon sizes at `1em` from `--line-icon-size`, which it does not declare (`0014-icon.md` defaults F4, F11).

| Option | Tokens | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-05). Own tokens | `--line-icon-button-radius`, `-bg`, `-color`, `-size`, `-font-size`, `-focus-ring`, with Button's defaults; the square from `-size` as `min-inline-size` and `min-block-size` with no inline padding | Meets C6 and §14.9 as written; one theme rule styles each component. A consumer who restyles both buttons sets two token families |
| (b) Own tokens that fall back to Button's | as (a), each default written as `var(--line-button-…, <Button default>)` | A consumer sets `--line-button-*` once on an ancestor and both follow. Couples IconButton's API to Button's token names, and the fallback only sees ancestor values, not `line-button`'s own `:host` defaults [INFERENCE] |
| (c) Reuse `--line-button-*` | IconButton reads `--line-button-*` directly | Fewest tokens. Conflicts with C6 ("own tokens") and §14.9 naming, so it needs an ARCH change; the variant redeclaration would write Button's tokens on IconButton's host |
| Square sub-choice | (i) `min-*` sizes, content may grow (chosen within (a), Miguel, 2026-11-05); (ii) fixed `inline-size` and `block-size`, content may overflow; (iii) a padding token around the icon, square only when the icon is | (i) keeps the square for any icon up to the box and never clips; (ii) guarantees the box; (iii) follows the icon size and leaves squareness to the content |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
| AM-001 | 2026-11-05 | factual correction (implementation, 01-C5) | User expectations, CSS custom properties, A11y Loading and Tests Browser row: the `[INFERENCE]` tags on the `<fieldset disabled>` behaviour, the box without `line-tokens` and the `loading` slot content in the name are replaced by the Browser-tier proofs. Slots: a bullet says the agent `child` takes any `ComponentId`, which the D2 option table guessed; that table keeps its wording as the record. Parts and CSS custom properties: `::part(icon)` and `::part(loading)` are `display: inline-flex`, with a bullet giving the reason | The implementation ran the probes the spec named, and all four claims held; the `inline-flex` rule shipped in the component without a line in the spec (reviewer F2, 01-C5 Verify) | `packages/line-components/__tests__/integration/icon-button/icon-button.e2e.ts:275-302` (fieldset), `:353-362` (box size), `:332-340` and `:384-396` (name, the second through CDP in chromium); 43 passed, 2 skipped (CDP outside chromium) on chromium, firefox and webkit (01-C5 Verify record). `packages/line-genui/__tests__/catalog.test.ts:153-161` and `a2ui-surface.test.ts:682-695` (`child`). `packages/line-components/src/icon-button/icon-button.ts:117-120` and the unit test "the root is square through --line-icon-button-size, with no inline padding and flex slot wrappers" in `packages/line-components/__tests__/icon-button.test.ts` (`inline-flex`) |
