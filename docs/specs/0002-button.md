# Button

| Field | Value |
|-------|-------|
| Status | `approved` (Miguel, 2026-10-27) |
| Phase | `1` |
| Tier | `Custom` |
| Tag | `line-button` |
| Entrypoint | `@websublime/line-components/button` |
| Form-associated | `yes` |
| PRD catalogue entry | PRD §4.1, `Button` row |
| Ledger row | `01-C1` |
| Governing sections | Phase 1 spec §6.C.4 (C1 row), §6.C.5 (Button), §6.C.6, §6.G.1, §6.G.3, §6.G.4 (Accessibility, Button), §6.G.5, §12 AM-067, AM-068, AM-069, AM-070, AM-081, AM-086; ARCH §7, §13.1, §13.5, §14.7–§14.9, §17.2–§17.4 |

---

## Part A — Requirements

### Overview

#### Description

`<line-button>` runs an action when the user activates it. It renders a native `<button>` inside its shadow root, so the platform keeps its keyboard, focus and accessibility behaviour (Phase 1 spec §10 SD31). The host is a form-associated custom element, so `type="submit"` and `type="reset"` act on its form the way a native button does, including `name`, `value` and the `form*` override attributes (ARCH §7). An opt-in `pressed` attribute turns it into a toggle button. A `loading` attribute keeps it focusable while it ignores presses. It carries no visual opinion beyond the `--line-button-*` tokens, which resolve through the theme roles (PRD §9.11).

#### Use cases

- Run an action, such as save, open or delete.
- Submit or reset a form, with `name` and `value` sent the way a native submitter sends them.
- Toggle an on/off option, such as bold or mute, with `pressed`.
- Show that an action is running, with `loading` and a spinner in the `loading` slot.
- Render an A2UI `Button` node on `<line-a2ui-surface>` (ARCH §17.3).

#### Anti-patterns

- Navigation to another URL. Use a native `<a href>`, because a button has no link semantics.
- An icon with no visible text. Use `<line-icon-button>` (spec `0003-icon-button.md`), which requires a name.
- A set of toggles where one choice wins. Use RadioGroup or ToggleGroup (Phase 2).
- A filter or selection pill. Use `<line-chip>` (spec `0008-chip.md`).
- A button that opens a menu. Use SplitButton or a Menu trigger (Phase 3).

#### User expectations

- Enter and Space activate it, and Tab reaches it unless it is disabled.
- A disabled button cannot be focused or pressed.
- A loading button stays in the tab order, is announced as unavailable, and ignores presses.
- A toggle button announces its pressed state and flips it on each press.
- Inside a form, a button with no `type` submits the form, as a native button does.

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| `<line-icon>` | child | `prefix` or `suffix` slot |
| `<line-spinner>` | child | `loading` slot (ARCH §13.5) |
| `<line-button-group>` | parent | the group's default slot; the group finds its buttons through `slotchange` and never imports Button (Phase 1 spec §6.C.5) |
| `<line-icon-button>` | sibling | the shared machine in `src/shared/button-machine.ts`; neither component imports the other (ARCH §13.1) |
| native `<form>` | form owner | `ElementInternals` form association and the `form` attribute |
| `<line-a2ui-surface>` | orchestrator | creates `line-button` by tag with `type="button"` and no `name` or `value`, so an agent Button never submits or resets a host-page form that holds the light-DOM surface; puts the A2UI `child` in the default slot and maps `action` to `click` (ARCH §17.4; Phase 1 spec §6.G.4, AM-081; AM-006) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| `variant` | `default \| primary \| borderless` | `default` for an ordinary action; `primary` for the main action of a view; `borderless` for a low-emphasis action in dense UI |

- The values mirror the A2UI basic `Button` `variant` enum, so the `basic` catalog maps it one to one (`docs/research/assets/01-r2/summary.json:744`).
- Each value only changes the defaults of `--line-button-bg` and `--line-button-color` on `:host` (ARCH §17.2 C6; CSS custom properties below). It adds no other CSS rule, and a consumer overrides the tokens or `::part(root)` as for any other default.
- An unknown value behaves as `default`, and the attribute keeps what the author wrote (C8).

---

## Part B — Technical Specification

### Anatomy

```
<line-button>                                   FormAssociated(LineElement), shadowRootOptions.delegatesFocus = true
└── #shadow-root
    └── <button part="root" type="button">       role button; name, aria-pressed, aria-disabled, disabled
        ├── <slot name="prefix">
        ├── <span part="label"><slot></slot></span>
        ├── <slot name="suffix">
        └── <span part="loading">                rendered only while loading
            └── <slot name="loading">
```

- The inner `<button>` is always `type="button"`. A shadow-tree button has no form owner, so the host carries out submit and reset itself (Form behaviour below).
- ARCH §15.1 lists Button in neither native-element list. Phase 1 spec §10 SD31 places the role on the inner native `<button>`.
- Content in the `loading` slot is not rendered and not in the accessibility tree while `loading` is off, because its slot is absent.

### States

| Field | Value |
|-------|-------|
| Machine | custom `createMachine()` on `@zag-js/core` 1.47.0, in `packages/line-components/src/shared/button-machine.ts`, run through `LineMachineController` (ARCH §8, §13.1; Phase 1 spec §6.C.5, §10 SD35) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| `idle` | start; `PRESS_END`; `PRESS_CANCEL` | `PRESS_START` when `isInteractive` passes | — |
| `active` | `PRESS_START` when `isInteractive` passes | `PRESS_END`; `PRESS_CANCEL`; `disabled` or `loading` turning true | `data-active`, `:state(active)` |

`pressed`, `loading` and `disabled` are props that the guards read at event time, not finite states (Phase 1 spec §6.C.5; R7 §2.4 probe B1). Each one still reflects on the host (ARCH §13.1, §14.8).

| Flag | Source | Host reflection |
|------|--------|-----------------|
| `pressed` | `pressed` prop is `true` | `data-pressed`, `:state(pressed)` |
| `loading` | `loading` prop | `data-loading`, `:state(loading)` |
| `disabled` | `disabled` prop, or a disabled `fieldset` ancestor through `formDisabledCallback` | `data-disabled`, `:state(disabled)` |
| `focus-visible` | machine context `focusVisible`, set when the inner button matches `:focus-visible` on focus | `data-focus-visible`, `:state(focus-visible)` (ARCH §14.9) |
| `invalid` | `custom-validity` is non-empty and `type` is `submit` | `data-invalid`, `:state(invalid)` (ARCH §17.2 C4) |

**Machine contract** (shared with C5, so it is part of this spec)

- Props: `disabled: boolean`, `loading: boolean`, `pressed: boolean | undefined` (`undefined` means not a toggle), `onPressedChange(next: boolean): void`.
- Context: `focusVisible: boolean`.
- Events: `PRESS_START`, `PRESS_END`, `PRESS_CANCEL`, `ACTIVATE`, `FOCUS` (`{ visible: boolean }`), `BLUR`.
- Guard `isInteractive`: `!disabled && !loading`, read at event time.
- `ACTIVATE` when `isInteractive` passes and `pressed !== undefined` calls `onPressedChange(!pressed)`.
- A `watch` on `disabled` and `loading` sends `PRESS_CANCEL` when either turns true during `active`.
- The module exports the machine and a `connect()` that returns the inner button's ARIA attributes and the flags above. It knows nothing about forms or events, and it imports no component (MANIFESTO Law 4).
- If the machine fails to start, the controller's fallback renders the inner button with `disabled` and `loading` applied as attributes, and the form behaviour still runs (MANIFESTO Law 9).

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ComponentId` | the label: text or inline content; the A2UI `child` |
| `prefix` | `ComponentId` | a leading icon; hand-written markup only, outside the descriptor slot map (AM-005) |
| `suffix` | `ComponentId` | a trailing icon; hand-written markup only, outside the descriptor slot map (AM-005) |
| `loading` | `ComponentId` | a spinner, loading text or both; rendered only while `loading` is on; hand-written markup only, outside the descriptor slot map (AM-005) |

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<button>` | the control: box, background, border, focus ring |
| `label` | `<span>` | wraps the default slot |
| `loading` | `<span>` | wraps the `loading` slot; present only while `loading` is on (ARCH §13.5) |

The `prefix` and `suffix` zones are the slotted light-DOM elements themselves, so the consumer styles them directly.

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `variant` | `variant` | `'default' \| 'primary' \| 'borderless'` | `'default'` | yes | semantic emphasis (C6) |
| `type` | `type` | `'submit' \| 'reset' \| 'button'` | `'submit'` | yes | what activation does to the form owner; overrides the `FormAssociated` `type` getter (the local name) so it returns what `HTMLButtonElement.type` returns; an unknown value behaves as `submit`, and the attribute keeps what the author wrote, as on a native `<button>` |
| `disabled` | `disabled` | `boolean` | `false` | yes | removes the button from the tab order and blocks activation |
| `loading` | `loading` | `boolean` | `false` | yes | keeps focus, sets `aria-disabled="true"`, blocks activation, renders the `loading` part |
| `pressed` | `pressed` | `boolean \| undefined` | `undefined` | yes | absent means not a toggle; `"false"` parses to `false`, any other value to `true`; reflects as `"true"` or `"false"` |
| `name` | `name` | `string \| null` | `null` | — | the key the submitter value goes under; read through the inherited read-only `FormAssociated` getter |
| `value` | `value` | `string` | `''` | yes | the submitter value (C4) |
| `form` | `form` | `HTMLFormElement \| null` | — | — | the platform resolves the `form` attribute (an id) to the form owner; read through the inherited getter |
| `formAction` | `formaction` | `string` | `''` | yes | overrides the form's `action` when this button submits |
| `formMethod` | `formmethod` | `'get' \| 'post' \| 'dialog'` | — | yes | overrides the form's `method` when this button submits |
| `formEnctype` | `formenctype` | `'application/x-www-form-urlencoded' \| 'multipart/form-data' \| 'text/plain'` | — | yes | overrides the form's `enctype` when this button submits |
| `formTarget` | `formtarget` | `string` | — | yes | overrides the form's `target` when this button submits |
| `formNoValidate` | `formnovalidate` | `boolean` | `false` | yes | skips constraint validation when this button submits |
| `customValidity` | `custom-validity` | `string` | `''` | no | external validity (C4); a non-empty message marks the button invalid through `setValidity({ customError: true }, message, root)` while `type` is `submit`, and the button clears its validity under any other `type`, because the platform bars reset and plain buttons from constraint validation |

- For `variant` and `type`, "Reflects" means a value the author or code sets is written to the attribute; a default value leaves no attribute (Lit `useDefault: true`), so an unknown author value stays as written (C8) and removing the attribute restores the default (AM-002).

The host also takes `aria-label` and `aria-description` and copies both to the inner button (C5).

**Form behaviour**

- Activation means a `click` that reaches the host and passes `isInteractive`. A pointer click, Enter or Space on the inner button, and `host.click()` all count.
- The host acts only after the `click` dispatch ends and only when no listener called `preventDefault()`, as the native activation behaviour does. `stopPropagation()` does not cancel it. The mechanism is the implementer's choice, proved by the browser tests below [INFERENCE: no probe yet].
- `type="submit"` with a form owner creates a native `<button type="submit" hidden data-line-button-submitter>`. It copies `name`, `value` and every present `form*` attribute, appends the button to the form, calls `click()` on it and removes it in a `finally`. The submission therefore gets the native submitter semantics: the `name=value` entry, `event.submitter`, the `form*` overrides, constraint validation and `method="dialog"` return values.
- The temporary button's `click` bubbles through the form, so a form-level `click` listener sees a second event whose target carries `data-line-button-submitter`. htmx 2 needs that event, because it tracks its submitter from `click` and `focusin`, not from `SubmitEvent.submitter` (`htmx.org@2.0.11` `dist/htmx.js:2877-2883`, `:4348`). htmx 4 reads `evt.submitter` (`htmx.org@4.0.0` `dist/htmx.js:485`, `:1800-1802`).
- `type="reset"` with a form owner calls `form.reset()`.
- `type="button"`, or no form owner, does nothing to any form.
- The host's own form value stays `null`, so its `name` and `value` enter the form data only when it is the submitter, as on a native button.
- Because `type` returns `submit`, `reset` or `button`, htmx 2's own value collection skips a `submit` or `button` host, as it skips native buttons. htmx 2 tests `tagName`, not `type`, for reset, so it sends a named `reset` host as `name=value`, exactly as it sends a named native reset button (`dist/htmx.js:3505-3513`).
- A form reset leaves `pressed` unchanged. Native buttons hold no toggle state to reset.
- Enter in a text field never picks `line-button` as the form's default button, because the platform considers only native submit buttons ([WICG/webcomponents#814](https://github.com/WICG/webcomponents/issues/814)). Implicit submission still follows the native rules for the form's other fields. Enter on the focused `line-button` activates it and submits.

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| `line-change` | `{ value: boolean }` | **Commit event (C9).** A user activation flips `pressed` on a toggle button; `detail.value` is the new state. It bubbles and is not composed. It never fires when `pressed` changes through the property or the attribute, nor for a blocked activation, focus, hover or a press that is cancelled. |

- Button dispatches no other event. The native `click` is its activation event, and the action map binds to it.
- While `disabled` or `loading`, Button stops a `click` that reaches the host. No bubble-phase listener on the host or its ancestors receives it, and no form action follows.
- Button fires no `line-input`, because a toggle has no live edit (C3).

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-button-radius` | `var(--line-radius-2)` | `root` |
| `--line-button-bg` | `var(--line-gray-bg)`; `primary`: `var(--line-accent-solid)`; `borderless`: `transparent` | `root` |
| `--line-button-color` | `var(--line-gray-text)`; `primary`: `var(--line-accent-contrast)`; `borderless`: `var(--line-accent-text)` | `root` |
| `--line-button-height` | `var(--line-size-7)` | `root` (`min-block-size`) |
| `--line-button-padding-inline` | `var(--line-size-3)` | `root` |
| `--line-button-gap` | `var(--line-size-2)` | `root` |
| `--line-button-font-size` | `var(--line-font-size-1)` | `root` |
| `--line-button-font-weight` | `var(--line-font-weight-5)` | `root` |
| `--line-button-focus-ring` | `var(--line-focus-ring, 2px solid currentColor)` | `root`, as `outline` under `:host([data-focus-visible])` |

- `:host` declares the tokens (PRD §9.11), and `:host([variant="primary"])` and `:host([variant="borderless"])` redeclare the two colour tokens. `default`, a missing attribute and an unknown value all keep the `:host` defaults. Without `line-themes` the role tokens are undefined, so the background resolves to transparent and the colour inherits, whatever the variant.
- The focus ring is the only state style. WCAG 2.4.7 needs a visible focus indicator, the reset removes the native outline (ARCH §14.9), and `line-themes` ships no focus-ring rule. `--line-focus-ring` resolves through `--line-focus-ring-color: var(--line-accent-8)` (`packages/line-tokens/src/focus-ring.css:16-19`), so without the theme layer it is invalid and the `currentColor` fallback draws the ring.
- Hover, active, pressed, loading and disabled carry no styles. Themes and consumers style them through `[data-*]` and `:state()`.
- There is no size variant, so the height token has no size suffix.

### Keyboard

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | moves focus to or from the inner button; skips a disabled button and keeps a loading one |
| `Enter` | enters `active` on keydown and activates, as a native button does |
| `Space` | enters `active` on keydown and activates on keyup |
| `Enter` / `Space` while loading | no activation and no `active` state |

On a toggle button, activation flips `pressed` and fires `line-change`.

### A11y

| Field | Value |
|-------|-------|
| Role | `button` on the inner native `<button part="root">` (Phase 1 spec §10 SD31) |
| ARIA attributes | `aria-label` and `aria-description`, copied from the host; `aria-pressed="true\|false"` on a toggle button, from `pressed`; `aria-disabled="true"` while `loading` and not `disabled`; native `disabled` while disabled |
| Accessible name | the slotted content in tree order (prefix, label, suffix, loading), or the host `aria-label` copied to the inner button, which wins (C5) |
| Focus | `delegatesFocus: true`, so `host.focus()` focuses the inner button (R8 §2.3, probe P1); `data-focus-visible` on the host for keyboard focus only (ARCH §14.9). A mouse click focuses the inner button where the engine focuses buttons on click, which macOS Safari does not [INFERENCE: WebKit bug 13724, cited at `htmx.org@2.0.11` `dist/htmx.js:2934`] |

- The host stays a role-less `generic` element, and it keeps any `aria-label` the author set. Chromium exposes it as a named `generic` node. axe-core 4.14.0 reports no violation for that case (R8 §2.4 fixtures).
- Loading text joins the name through the `loading` slot. A consumer who wants only the loading text read hides `::part(label)` with `display: none` while `[data-loading]`.
- **Screen-reader pass** (Phase 1 spec §6.C.4; R8 §6 Q1, Q5; Phase 1 spec AM-058; AM-001). The automated check below runs on the shipped component; the manual pass is optional and does not block the row.
  - A Playwright `ariaSnapshot` in the Browser tier, in chromium, firefox and webkit, records one `button` node with the expected name and pressed state, and records whether the named `generic` host appears.
  - An optional manual VoiceOver pass, if run, runs on macOS in Safari and Chrome. It tabs to a plain, a toggle and a loading button, flips the toggle and turns `loading` on and off with focus on the button. It records what VoiceOver announces, whether the host name is announced twice, and whether the change to the loading name is announced. Any run records its result in this section.
  - **Result, ariaSnapshot** (C1, `__tests__/integration/button/button.e2e.ts`, 2026-10-27). In chromium, firefox and webkit each host yields one `button` node: `button "Save"`, `button "Bold" [pressed]`, `button "Save Saving…" [disabled]` for the loading button (its `aria-disabled="true"`), and `button "Close dialog"` for a host `aria-label`. The named `generic` host does not appear in any engine. Playwright builds the snapshot itself rather than reading the engine's accessibility tree, so the three engines give the same snapshot and it does not show whether an engine exposes the host.
  - **Result, VoiceOver pass** (optional per Phase 1 spec AM-058): not run.
- An unannounced loading change is a known risk [INFERENCE: React Aria announces pending changes through a live region, R7 `:208-209`]. If an optional manual pass is run and shows no announcement, the finding goes to Miguel before the spec moves to `implemented`.

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | Every prop is a string, a boolean or a string enum; `pressed` is an optional boolean |
| C2 | Slots carry `@slot` and a single or multiple classification | four `@slot` tags; every slot is `ComponentId` (Slots table) |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | `@fires line-change` with `{ value: boolean }`; no unprefixed `input` or `change` |
| C4 | Form-associated components expose `value` and accept external validity | `value` property; `custom-validity` sets validity through the mixin's `setValidity` and reflects `data-invalid` and `:state(invalid)` |
| C5 | The host accepts an accessible name and applies it to the element with the role | host `aria-label` and `aria-description` are copied to the inner `<button>` |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | `variant` is `default`, `primary` or `borderless`, and a value the author or code sets is reflected; the default leaves no attribute; `primary` and `borderless` redeclare the defaults of `--line-button-bg` and `--line-button-color` on `:host` and add no other rule |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries every tag for each slot, part, token and event, and `@attr name`, because `name` is an inherited getter and no reactive property declares its attribute (R4 `:80`); nothing is deprecated |
| C8 | Missing or partial props degrade to an empty or neutral state | with no attributes it renders an empty button with an inner `type="button"`, no host `variant` or `type` attribute, and `variant` and `type` at `default` and `submit`; unknown enum values fall back to the default and the attribute keeps what the author wrote, in the initial markup or set later |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | value-bearing, because the binding map names `pressed` as the value prop; `line-change` is its one commit event and fires once per flip |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `Button` |
| Tag | `line-button` |
| `load()` subpath | `@websublime/line-components/button` |
| Prop schema | `variant`, `disabled`, `loading`, `pressed`, plus the catalog-only `child` (`ComponentId`) and `action` (`Action`), which the frontend-tool walker leaves out (Phase 1 spec §6.G.3), and `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1, AM-067). `type`, `name` and `value` stay out (AM-006) |
| Slot map | `(default)` → `ComponentId` (`child`) only. `prefix`, `suffix` and `loading` stay out of the descriptor, so an agent never fills them; they serve hand-written markup (Miguel, 2026-11-03; AM-005) |
| Binding map | `variant`, `disabled`, `loading` → attribute; `pressed` → property; value prop `pressed`; commit event `line-change` |
| Action map | `action` → `click`, marked native, because the browser dispatches it and the manifest does not list it (Phase 1 spec §6.G.1, §6.G.5, AM-067) |
| Accessibility requirements | an accessible name, from non-empty `child` text or an `accessibility.label` non-empty after trimming whitespace, which the surface sets as the host `aria-label` (Phase 1 spec §6.G.4, AM-067, AM-068); the surface rejects a nameless node (ARCH §17.4) |
| Agent-facing description | A button that runs an action when the user activates it. Put its visible text in the default slot (`child`); a button without text needs `accessibility.label`. `variant` marks emphasis, with `primary` for the main action of a view, `borderless` for a low-emphasis action and `default` otherwise. Set `disabled` when the action is unavailable and `loading` while it runs; a loading button stays focusable and ignores presses. Set `pressed` to `true` or `false` to make a toggle, so each press flips it and fires `line-change` with the new value. Leave `pressed` unset for a plain button. |
| Tool description | A button that runs an action when the user activates it. Set `accessibilityLabel` to the button's text; the app gives the button that text as its accessible name, and a button without it has no name. `variant` marks emphasis, with `primary` for the main action of a view, `borderless` for a low-emphasis action and `default` otherwise. Set `disabled` when the action is unavailable and `loading` while it runs; a loading button stays focusable and ignores presses. Set `pressed` to `true` or `false` to make a toggle, so each press flips it and fires `line-change` with the new value. Leave `pressed` unset for a plain button. |
| `agentExposed` | `true` |

- The Button frontend tool takes the tool description, 626 characters, as its `description`, and the `line` catalog keeps the agent-facing description (Phase 1 spec §6.G.1, §6.G.3, AM-086; AM-007). The tool carries no `child`, so the tool description names `accessibilityLabel` as the route to the button's text and name (Phase 1 spec §6.G.3, AM-069).
- Stream G writes this descriptor in G1, because C1 ships without one (Phase 1 spec §6.C.0 step 3).
- The surface sets `type="button"` on every `line-button` it renders and sets no `name` or `value`, and the prop schema carries none of the three, so a node that names one fails the descriptor's strict schema (Phase 1 spec §6.G.4, AM-081; AM-006). The surface renders in light DOM (ARCH §17.4) and the component defaults to `submit`, so without that an agent Button inside a host-page `<form>` would submit or reset it, or add a field to it. Hand-written markup keeps the component's `type`, `name` and `value` behaviour.
- `form`, `formaction`, `formmethod`, `formenctype`, `formtarget`, `formnovalidate` and `custom-validity` stay out of the prop schema. JSON carries them, but they point at page-level forms and URLs the surface does not own, and an agent URL in `formaction` would skip the §17.4 URL policy. The renderer fills validity from A2UI checks (C4).
- The `basic` catalog maps A2UI `Button` to `line-button`. `child` goes to the default slot, Text inside it renders as `<span>` (Phase 1 spec §10 SD59), `variant` maps one to one and `action` binds to `click`.

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/button` |
| Kind | `independent` (ARCH §12) |
| Registers | `line-button` |
| Reset modules | `commonReset`, `buttonReset` (ARCH §14.7; Phase 1 spec §10 SD31 places the inner native `<button>` that `buttonReset` targets) |

- Files: `src/button/button.ts` (class and `customElements.define`), `src/button/button.types.ts`, `src/button/index.ts`, `src/shared/button-machine.ts`.
- `package.json` gains the `./button` export of Phase 1 spec §4.2, and the Vite build gains the `button/index` entry that emits `dist/button/index.js`.
- The root `"."` stays a zero-export module and does not re-export the machine, because the "Zero-export smoke" step stays in CI until P5 (Phase 1 spec §6.C.0 step 3).

### Markup examples

```html
<!-- Default -->
<line-button>Save</line-button>

<!-- Variants -->
<line-button variant="primary">Publish</line-button>
<line-button variant="borderless">Cancel</line-button>

<!-- Prefix and suffix icons -->
<line-button>
  <line-icon slot="prefix" library="lucide" name="check"></line-icon>
  Save
  <line-icon slot="suffix" library="lucide" name="chevron-down"></line-icon>
</line-button>

<!-- Loading, with consumer-supplied text and spinner -->
<line-button loading>
  Save
  <span slot="loading"><line-spinner></line-spinner> Saving…</span>
</line-button>

<!-- Disabled -->
<line-button disabled>Delete</line-button>

<!-- Toggle -->
<line-button type="button" pressed="false">Bold</line-button>

<!-- Form submit and reset -->
<form action="/orders" method="post">
  <line-button type="submit" name="intent" value="save">Save</line-button>
  <line-button type="submit" name="intent" value="publish" formaction="/orders/publish">Publish</line-button>
  <line-button type="reset">Reset</line-button>
</form>
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom | prop defaults and reflection, with no host `variant` or `type` attribute for a default; the `pressed` and `variant` converters; `type` fallback; unknown `variant` and `type` values in the initial markup keeping the author's attribute, and removing the attribute restoring the default with no attribute; `data-*` and `:state()` reflection through the fake internals; `line-change` once per toggle activation and never on a property or attribute change; guards blocking activation while `disabled` or `loading`; `aria-label`, `aria-description`, `aria-pressed` and `aria-disabled` on the inner button; the C8 empty render; the machine-failure fallback render; `custom-validity` setting `customError` only under `type="submit"` and clearing it with `setValidity({})` when the message empties or `type` changes away from `submit`; `packages/line-components/__tests__/manifest-paths.test.ts` on the packed tarball (Phase 1 spec §6.C.6) |
| Browser | Playwright `*.e2e.ts` on chromium, firefox and webkit | Tab order with `disabled` and `loading`; Enter and Space activation; `data-active` on pointer and keys; `data-focus-visible` on keyboard focus only; submit with `name=value` in the `FormData` and `event.submitter` as the temporary button; `formaction`, `formmethod`, `formnovalidate` and `method="dialog"`; reset; the `form` attribute; a disabled `fieldset`; `preventDefault()` on `click` cancelling submit and reset; no `click` reaching host listeners while `disabled` or `loading`; the `ariaSnapshot` screen-reader check |
| A11y | axe-core | zero violations (MANIFESTO Law 3) in every story: default, `primary`, `borderless`, prefix and suffix, disabled, loading with the `loading` slot, toggle off and on, `aria-label` only, and the form story |
| htmx | Playwright `*.e2e.ts` through the shared harness `@websublime/line-testing/htmx`, on htmx 2 and htmx 4 in chromium, firefox and webkit | (a) `n/a`. Button is form-associated, so the template expects (a) to run, but Button's value prop is `pressed`, which never enters form data, and the host's own form value stays `null`. A button's `name=value` enters the form data only when that button submits, and the harness submits through a separate native button, so Button contributes nothing there, as a native button would not. A Button-local e2e on both htmx majors replaces (a) and proves that `<line-button type="submit" name="intent" value="save">` inside `<form hx-post>` sends `intent=save`. (b) `hx-trigger="line-change"` on `<line-button pressed="false">` sends one request per click. (c) focus and hover send no request. (d) server content swapped into the default slot renders, and the inner button's accessible name contains the swapped text |
| Visual | Playwright `button.visual.ts` on the `visual` project | every Button story, with Linux baselines from a `visual-baselines.yml` run, and the `default`, `primary` and `borderless` baselines differ from each other (Phase 1 spec §6.C.6, §10 SD98) |
| Update rate | `measureHostUpdates` on a connected `<line-button>` | the rate is recorded in the C1 PR; a rate past the C21 budget stops the row and returns it to the orchestrator (Phase 1 spec §6.C.6; §10 SD18) |

- The axe and visual tests run against the Storybook stories on port 4320 (Phase 1 spec §6.P.7, §6.P.11). The keyboard, form and htmx tests need a fixture page that loads `@websublime/line-components/button` (and `./vendor/htmx.js` for htmx). The implementer places that page within the Phase 1 spec §4 file classes. A new Playwright `webServer` entry is an infra-supervisor edit.

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| 1 | Does a toggle Button flip `pressed` itself, and is Button value-bearing? | Miguel | Yes. Activation flips `pressed` and fires `line-change` with `{ value: boolean }`; the binding map names `pressed` as the value prop (Miguel, 2026-10-27) |
| 2 | How does Button submit its form, and does it send `name`/`value`? | Miguel | Through a temporary hidden native submit button appended to the form, clicked and removed, so `name`/`value`, `event.submitter`, the `form*` overrides and `method="dialog"` behave natively (Miguel, 2026-10-27, after weighing `setFormValue` during submit and no `name`/`value`) |
| 3 | What is the default `type`? | Miguel | `submit`, as on a native button (Miguel, 2026-10-27; MANIFESTO Law 7) |
| 4 | How does loading content appear, given ARCH §13.1 (no bundled spinner) and §13.5 (`::part(loading)`)? | Miguel | A `loading` slot inside a `loading` part, rendered only while `loading` is on (Miguel, 2026-10-27) |
| 5 | Does Button have semantic variants? | Miguel | `variant` with `default`, `primary` and `borderless`, mirroring A2UI basic; no `size` attribute (Miguel, 2026-10-27) |
| 6 | Which attribute carries external validity (C4)? It sets the convention for the Phase 2 form controls | Miguel | `custom-validity` / `customValidity`, mirroring the native `setCustomValidity()` (Miguel, 2026-10-27) |
| 7 | Who runs the manual VoiceOver pass? | Miguel | Miguel, during Verify of the C1 PR, following the A11y section; the result lands in that section before merge (Miguel, 2026-10-27). Superseded: the pass is optional and never blocks the row (Phase 1 spec AM-058, Miguel 2026-10-28; AM-001) |
| 8 | How does a `line-components` test reach `measureHostUpdates`, which lives in `packages/line-core/__tests__/harness/update-rate.ts` (Phase 1 spec §10 SD28), when a test must not reach another package by relative path and shared helpers must live in `@websublime/line-testing` (Phase 1 spec §6.Z.3)? | Miguel | Phase 1 spec AM-055 moves `measureHostUpdates`, its constants and `formatUpdateRate` to `@websublime/line-testing/update-rate` and keeps `measureVanillaChain` in `line-core` (Miguel, 2026-10-27) |
| 9 | Who draws the focus ring? ARCH §14.9 left it to the theme, `line-themes` ships no rule, and `--line-focus-ring` is invalid without the theme layer. It sets the convention for every interactive component | Miguel | Each component draws a default ring through `--line-{component}-focus-ring`, defaulting to `var(--line-focus-ring, 2px solid currentColor)` (Miguel, 2026-10-27; ARCH v0.8.15 §14.9) |
| 10 | What `type` does a surface-created Button get? A2UI `Button` has no `type`, and the native `submit` default acts on a host-page form that wraps the light-DOM surface | Miguel | The agent chooses `type` through the prop schema, which also carries `name` and `value`; the native `submit` default applies, over a surface that always forces `type="button"` (Miguel, 2026-10-27). Superseded: the surface forces `type="button"` and the prop schema drops `type`, `name` and `value` (Miguel, 2026-11-03; Phase 1 spec AM-081; AM-006) |
| 11 | Do the variants look different out of the box? No package styled `[variant]`, so the three rendered the same, the agent's emphasis reached the user as nothing and the variant baselines were identical | Miguel | Each variant sets the defaults of `--line-button-bg` and `--line-button-color` on `:host`, through the gray role for `default` and the accent role for `primary` and `borderless`, and adds no other rule. ARCH §17.2 C6 now allows exactly that (PRD v0.8.28; Phase 1 spec AM-056), over variants with no styles and a Storybook CSS recipe (Miguel, 2026-10-27) |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
| AM-001 | 2026-10-29 | decision — Phase 1 spec AM-058 (Miguel, 2026-10-28, 01-C4 understand) | A11y, Screen-reader pass: the manual VoiceOver pass is optional and never blocks the row; its result line reads "not run"; the loading-announcement bullet applies only if an optional pass is run. Open Question 7 records the change. The ariaSnapshot result is unchanged | Miguel changed the rule for every component: roles are proved by automated checks, and a manual screen-reader pass is optional | `docs/specs/01-spec-core-primitives.md` §12 AM-058 |
| AM-002 | 2026-10-29 | decision — Miguel, 2026-10-29 (01-C25 understand) | Props: `variant` and `type` take `useDefault: true`; "Reflects" bullet added; the `type` row says the attribute keeps what the author wrote, as on a native `<button>`. C6: a value the author or code sets is reflected and the default leaves no attribute. C8: a bare host renders an empty button with an inner `type="button"`, no host `variant` or `type` attribute and the properties at `default` and `submit`; an unknown value keeps the author's attribute, in the initial markup or set later. Tests, Unit: no host `variant` or `type` attribute for a default; the initial-markup unknown-value case; removing the attribute restores the default with no attribute | Constructor defaults were reflected on the first update and overwrote the author's attribute (`variant="foo"` became `default`, `type="menu"` became `submit`, `type="RESET"` became `reset`), which C8 forbids; Stack and Separator already follow this rule | probe on `main` (8c30dd4) in happy-dom after `updateComplete`; `docs/specs/0018-stack.md` AM-002; `packages/line-components/__tests__/button.test.ts` |
| AM-003 | 2026-11-02 | decision — Miguel, 2026-11-02 (01-C2 spec, `0014-icon.md` decision D3) | Markup examples: the two `<line-icon>` children of the prefix and suffix example gain `library="lucide"` | A `<line-icon>` with `name` and no `library` renders the neutral C8 state, because `line-icons` picks no default set, so the example rendered no glyph | `docs/specs/0014-icon.md` Decisions, D3; `docs/specs/01-spec-core-primitives.md` §6.C.3 ("`line-icons` MUST NOT pick a default set"); ARCH v0.8.16 |
| AM-004 | 2026-11-03 | decision — Phase 1 spec AM-067 (orchestrator default for Miguel's review at the 01-G1 PR) | Descriptor fields: the prop schema adds `accessibility` from the `ComponentCommon` mixin; the action map marks `click` native; the accessibility requirement names non-empty `child` text or `accessibility.label` as the name source, and the surface sets that label as the host `aria-label` (was `aria-label`); the agent-facing description says a button without text needs `accessibility.label` (was `aria-label`) | An A2UI node carries no `aria-label`; it carries its name in `accessibility.label` of `ComponentCommon`, which every descriptor now takes, and the surface maps it to the host `aria-label`, which the component copies to the inner button (C5). `click` is a native event that the manifest does not list, so the drift test checks it against its fixed list of DOM event names instead of the manifest (Phase 1 spec §6.G.5, AM-070) | `docs/specs/01-spec-core-primitives.md` §6.G.1, §6.G.4, §6.G.5, §12 AM-067, AM-070; `node_modules/.bun/@a2ui+web_core@0.14.0/node_modules/@a2ui/web_core/src/v0_9/schema/common-types.js:56-61` |
| AM-005 | 2026-11-03 | decision — Miguel, 2026-11-03 (01-G1 review gate iteration 2, "Só o slot default"), and Phase 1 spec AM-068 | Descriptor fields: the slot map holds only `(default)` → `ComponentId` (`child`); `prefix`, `suffix` and `loading` leave it and serve hand-written markup (was all four slots). Slots table: the three rows say so. Agent-facing description: a loading button "stays focusable and ignores presses" (was "…and shows its `loading` slot", which an agent cannot fill). Accessibility requirement: an `accessibility.label` counts only when non-empty after trimming whitespace (Phase 1 spec AM-068). Governing sections add Phase 1 spec §6.G.1, §6.G.3, §6.G.4 (Accessibility), §6.G.5 and AM-067, AM-068, AM-069, AM-070 (review gate iteration 3) | Miguel chose to expose only the default slot to agents; the A2UI basic `Button` also carries a single `child`. The trim rule follows Phase 1 spec AM-068. The Governing sections line did not list the Phase 1 sections and AMs that the descriptor rows now cite | Miguel's decision relayed by the orchestrator, 2026-11-03; `node_modules/.bun/@a2ui+web_core@0.14.0/node_modules/@a2ui/web_core/src/v0_9/basic_catalog/components/basic_components.js:299` (basic `Button` has one `child`); `docs/specs/01-spec-core-primitives.md` §6.G.4, §12 AM-068; review gate iteration 2, findings 1 and 3; review gate iteration 3, Low finding |
| AM-006 | 2026-11-03 | decision — Miguel, 2026-11-03 (01-G4 security review; Phase 1 spec AM-081): the surface forces `type="button"` and the agent contract drops `type`, `name` and `value`, over documenting the hazard only and over forcing `type="button"` on basic Buttons alone while the `line` catalog keeps the three props | Connections: the `<line-a2ui-surface>` row states the forced `type="button"` and no `name` or `value`. Descriptor fields: the prop schema and the binding map drop `type`, `name` and `value`; the agent-facing description drops the form-submission sentence ("`type` defaults to `submit`…"); the bullet under the table says the surface forces `type="button"`, so a node with one of the three fails the strict schema (was "The agent chooses `type`…"). Open Question 10 records the change. Governing sections add Phase 1 spec AM-081. The component's own props, defaults and form behaviour are unchanged | The surface renders into light DOM and `line-button` is form-associated with `type="submit"` by default (`packages/line-components/src/button/button.ts:222, :262-270`), so a host `<form>` around the surface took the agent's submit, reset or field | `docs/specs/01-spec-core-primitives.md` §6.G.4, §12 AM-081; `packages/line-components/src/button/button.ts:222, :262-270` |
| AM-007 | 2026-11-04 | decision — Miguel, 2026-11-04 (01-G3 Verify gate; Phase 1 spec AM-086): an optional descriptor tool description, over accepting the reuse of the agent-facing description and over rewriting the description the catalog and the tool share | Descriptor fields gain the Tool description row, the text the Button frontend tool takes as its `description`: it names `accessibilityLabel` as the source of the button's text and name, and drops the default-slot `child` sentence; the variant, disabled, loading and toggle sentences are those of the agent-facing description, which is unchanged. A first bullet under the table says the tool takes that text and the `line` catalog keeps the agent-facing description. Governing sections add Phase 1 spec AM-086 | The frontend-tool walker leaves out `child` (`ComponentId`) and `action` (`Action`) and flattens `accessibility` to `accessibilityLabel` and `accessibilityDescription` (Phase 1 spec §6.G.3, §10 SD47, AM-069), so the Button tool's description told the model to fill `child` and `accessibility.label`, which the tool does not carry. A tool-created Button gets its name only through `accessibilityLabel` | `docs/specs/01-spec-core-primitives.md` §6.G.1 Fields, §6.G.3, §12 AM-069, AM-086; `packages/line-genui/src/catalog/descriptors/button.ts:9-10`, `:27-28`; `packages/line-genui/src/catalog/tools.ts:189`, `:202`; 01-G3 Verify gate reviewer finding, 2026-11-04 |
