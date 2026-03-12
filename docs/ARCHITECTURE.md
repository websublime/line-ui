# line://ui — Architecture

**Date:** 2026-03-12
**Status:** Living document — updated as architectural decisions evolve
**Source:** Extracted from PRD v0.6.0 §3 (Component Architecture)

This document captures the **cross-cutting architectural decisions** that apply to all components. Individual component specifications live in `.spec/`. Product requirements live in the PRD.

---

## 1. Component Anatomy

```
┌──────────────────────────────────────────────┐
│  <line-dialog>                               │
│                                              │
│  ┌─────────────┐   ┌──────────────────────┐  │
│  │  Zag.js     │   │  Lit                 │  │
│  │  Machine    │──▶│  Shadow DOM          │  │
│  │             │   │                      │  │
│  │  - State    │   │  <div part="overlay">│  │
│  │  - A11y     │   │  <div part="content">│  │
│  │  - Keyboard │   │  <slot>              │  │
│  │  - Focus    │   │  <slot name="title"> │  │
│  └─────────────┘   └──────────────────────┘  │
│                                              │
│  CSS Parts exposed:                          │
│  ::part(overlay) ::part(content)             │
│  ::part(title) ::part(close)                 │
│                                              │
│  Inspector metadata (feature flag):          │
│  version, docs link, scope, qa              │
└──────────────────────────────────────────────┘
```

**Flow:** Zag.js manages all logic (state, transitions, a11y, keyboard, focus trapping) → Lit renders shadow DOM with `part` attributes on every relevant element → Consumer styles via `::part()` or applies a theme from the theme package.

---

## 2. Composition Model

**Hybrid approach:**

- **Simple components** (button, badge, avatar, toggle) — Single custom element with slots. No benefit in fragmenting.
- **Complex components** (dialog, combobox, menu, tabs, accordion) — Composable sub-components. Each sub-component exposes its own `::part()` selectors. The consumer decides what to render and where.

**Simple component example:**

```html
<line-button>
  <line-icon slot="prefix" name="check"></line-icon>
  Save
</line-button>
```

**Complex component example (Radix-style):**

```html
<line-dialog>
  <line-dialog-trigger>
    <button>Open</button>
  </line-dialog-trigger>
  <line-dialog-content>
    <line-dialog-title>Title</line-dialog-title>
    <line-dialog-close></line-dialog-close>
    <p>Content</p>
  </line-dialog-content>
</line-dialog>
```

**Composition via slot (Field + Input):**

```html
<line-field>
  <span slot="label">
    Email <line-icon name="info" size="xs"></line-icon>
  </span>
  <line-input type="email" required>
    <line-icon slot="prefix" name="mail"></line-icon>
  </line-input>
  <span slot="hint">We use your email for login</span>
  <span slot="error">
    <line-icon name="alert-circle"></line-icon>
    Invalid email address
  </span>
</line-field>
```

The Field does not import the Input. The Input does not know the Field exists. Both work standalone. Connected via `<slot>` and events.

---

## 3. Slot vs Internal Part — Decision Rule

Components expose **slots** for content the consumer controls, and **internal parts** for elements the component must coordinate with its state machine.

| Who controls the action? | Approach | Examples |
|--------------------------|----------|----------|
| Consumer decides content and behaviour | **Slot** | prefix, suffix icons; label, hint, error text |
| Component needs to coordinate state/action | **Internal part** | password toggle, clear button, increment/decrement steppers |

A prefix icon is a slot — the component doesn't know or care what it is. A password visibility toggle is an internal part — the component must toggle the input `type` between "password" and "text" when clicked. A clear button is an internal part — it must call `CLEAR` on the machine.

---

## 4. CSS Customisation — Dual Layer

**Layer 1: CSS Custom Properties (tokens) — Quick adjustments**

```css
line-button {
  --line-radius: 8px;
  --line-font-size: 1rem;
  --line-padding: 0.5rem 1rem;
}
```

**Layer 2: `::part()` — Total control over internal elements**

```css
line-button::part(root) {
  background: linear-gradient(135deg, pink, purple);
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

Custom properties for consumers who want to adjust tokens without knowing internal structure. Parts for consumers who want absolute control. Complementary, not redundant.

**Custom property prefix:** `--line-` (consistent with tag prefix).

---

## 5. CSS Parts Naming Convention

```css
::part(root)        /* Main container */
::part(trigger)     /* Activating element */
::part(content)     /* Content area */
::part(overlay)     /* Backdrop/overlay */
::part(title)       /* Title */
::part(description) /* Description */
::part(close)       /* Close button */
::part(icon)        /* Icon */
::part(indicator)   /* State indicator */
::part(separator)   /* Separator */
::part(item)        /* Item in lists */
::part(label)       /* Label */
::part(input)       /* Internal input */
::part(toggle)      /* Toggle element (e.g., password visibility) */
::part(clear)       /* Clear/dismiss button */
::part(increment)   /* Increment stepper */
::part(decrement)   /* Decrement stepper */
::part(remove)      /* Remove button (e.g., chip dismiss) */
::part(overflow)    /* Overflow indicator (e.g., avatar group +N) */
```

Short, semantic names reused across components. A developer who learns the parts of one component already knows others.

---

## 6. Base Class — LineElement

**Note:** The current codebase uses `ComponentElement` with `ComponentMixin`. The refactoring to `LineElement` is a Phase 0 task.

```
LitElement
  └── LineElement (refactored base class)
        ├── Inspector mixin (feature flag via localStorage)
        ├── Metadata mixin (version, docs, qa)
        ├── Direction mixin (LTR/RTL)
        ├── FormAssociated mixin (opt-in, ElementInternals)
        └── Zag.js machine connection (lifecycle-managed)
              │
              ├── Pre-built machine components
              │     ├── LineDialog (uses @zag-js/dialog)
              │     └── ...
              ├── Custom machine components
              │     ├── LineInput (uses custom createMachine)
              │     └── ...
              └── Static components (no machine)
                    ├── LineBadge
                    └── ...
```

Components declare their tier by what they assign to the `machine` property: a pre-built Zag.js machine, a custom `createMachine()` result, or nothing (static). The base class handles all three cases — connect/disconnect is automatic for machines, zero overhead for static components.

---

## 7. Form Association Strategy

All form control components implement `static formAssociated = true` and use `ElementInternals` to participate in native HTML `<form>` elements. This is handled as an opt-in mixin in the base class.

**What `formAssociated` provides natively:**

- `<line-button type="submit">` submits parent forms (including Enter key)
- `<line-input name="email">` appears in `FormData` automatically
- `<line-button type="reset">` resets all form controls
- HTML5 validation (`required`, `pattern`, `minlength`) works natively
- `:invalid`/`:valid` CSS pseudo-classes work
- `form.checkValidity()` and `form.reportValidity()` work

**What line://ui does NOT provide:**

- No `<line-form>` wrapper component. Each framework has its own form management solutions. Nice-to-have post-1.0.
- No cross-field validation orchestration. This is application-level logic.

**Form-associated components:** Button, Input, PasswordInput, SearchInput, DateInput, Textarea, Select, Checkbox, RadioGroup, Switch, NumberInput, Editable, ToggleGroup, Slider, Combobox, DatePicker, TimePicker, ColorPicker, PinInput, Rating, RangeSlider, FileUpload, TagInput, MentionInput, SearchField.

---

## 8. State Management — Unified via Zag.js

**Three tiers of state management:**

| Tier | What | When to use | Examples |
|------|------|-------------|----------|
| **Pre-built machine** | Uses existing `@zag-js/*` package | Complex components where Zag.js provides a production-ready machine | Dialog, Select, Combobox, Tabs, Accordion |
| **Custom machine** | Uses `createMachine()` from `@zag-js/core` | Interactive components with states where no pre-built machine exists | Input, Textarea, Field, Tag Input, Search Field |
| **Static** | No machine | Purely presentational components with zero interaction state | Badge, Separator, Skeleton, VisuallyHidden, Center |

**Why custom machines for "simple" components like Input:**

Components like Input, Textarea, and Field have rich interaction states: focus/blur, error/invalid, disabled, readonly, empty/filled, loading, required. With a custom Zag.js machine, every interactive component gets: explicit state transitions, computed states (memoized, consistent), controlled/uncontrolled for free via `bindable`, guards preventing invalid transitions, watch for reactive side effects, and inspector integration.

**Custom machine example — Input:**

```typescript
const machine = createMachine<InputSchema>({
  props({ props }) {
    return { disabled: false, required: false, readOnly: false, ...props }
  },
  context({ prop, bindable }) {
    return {
      value: bindable(() => ({
        defaultValue: prop("defaultValue") ?? "",
        value: prop("value"),
        onChange(value) { prop("onChange")?.({ value }) }
      })),
      error: bindable(() => ({ defaultValue: "" })),
    }
  },
  computed: {
    isEmpty({ context }) { return context.get("value") === "" },
    isInvalid({ context }) { return context.get("error") !== "" },
  },
  states: {
    idle: {
      on: { FOCUS: { target: "focused" } }
    },
    focused: {
      on: {
        BLUR: { target: "idle", actions: ["validate"] },
        CHANGE: { actions: ["setValue"] },
      }
    }
  }
})
```

**Collections for item-based components:**

Zag.js provides `ListCollection` and `TreeCollection` from `@zag-js/collection`. These provide navigation, search, filtering, reordering, and disabled item support. Collections are immutable.

- **Pre-built machines using collections:** Select, Combobox, Menu, Tree View
- **Custom machines + collections:** Tag Input, List View, Kanban Board, Search Field

---

## 9. Field Architecture

The Field is the orchestrator that connects labels, hints, errors, and required indicators to any form control. It does not import any specific control — it uses `<slot>` and events.

**Slots:** `label` (free content), `default` (the form control), `hint` (help text), `error` (error message — visible in error state).

**Host data attributes:** `data-focused`, `data-filled`, `data-error`, `data-disabled`, `data-readonly`, `data-required`.

**State detection priority:**
1. Explicit props — `<line-field error>` overrides everything
2. Child events — `line-focus`, `line-blur`, `line-change`, `line-invalid`, `line-valid`
3. Native validity — via `formAssociated` + `ElementInternals`

**Label connection:** Field generates unique ID, sets `aria-labelledby` on child control, forwards clicks on label to `.focus()` on child.

**Required indicator:** `::part(required-indicator)` — consumer/theme styles it.

**Floating label:** NOT built in. `data-focused` and `data-filled` enable it via pure CSS. Pattern documented in Storybook.

**Field-compatible controls (any component that):**
1. Emits `line-focus`, `line-blur`, `line-change`, `line-invalid` events
2. Has `formAssociated: true`
3. Accepts `.focus()` programmatically

---

## 10. Component File Structure

```
packages/components/src/dialog/
├── dialog.ts              ← <line-dialog> root
├── dialog-trigger.ts      ← <line-dialog-trigger>
├── dialog-content.ts      ← <line-dialog-content>
├── dialog-title.ts        ← <line-dialog-title>
├── dialog-close.ts        ← <line-dialog-close>
├── dialog.types.ts        ← Types/interfaces
└── index.ts               ← Public exports
```

---

## 11. Icon System

Abstract wrapper with an agnostic registry:

```html
<line-icon name="check" library="phosphor"></line-icon>
<line-icon name="arrow-right" library="lucide"></line-icon>
<line-icon src="/my-icons/custom.svg"></line-icon>
```

- `line-icon` exposes a **registry** where the consumer registers icon libraries
- Each library is a resolver: given a name, returns the SVG
- Zero icons bundled in core — the consumer brings their own
- Ready-to-go themes declare a default library and register the resolver automatically

---

## 12. Bundle Splitting Rule

> Sub-components of a family share a single entrypoint. Independently usable components have separate entrypoints. A component belongs to a family when it requires its parent to function. Components connected via `<slot>` are always separate entrypoints — slots imply independence.

**Families (single entrypoint):**

| Entrypoint | Registers |
|------------|-----------|
| `./dialog` | line-dialog, line-dialog-trigger, line-dialog-content, line-dialog-title, line-dialog-close |
| `./tabs` | line-tabs, line-tab-list, line-tab-trigger, line-tab-content |
| `./accordion` | line-accordion, line-accordion-item, line-accordion-trigger, line-accordion-content |
| `./menu` | line-menu, line-menu-trigger, line-menu-content, line-menu-item, line-menu-separator |
| `./select` | line-select, line-select-trigger, line-select-content, line-select-item, line-select-group |
| `./combobox` | line-combobox, line-combobox-input, line-combobox-content, line-combobox-item |
| `./popover` | line-popover, line-popover-trigger, line-popover-content |
| `./tooltip` | line-tooltip, line-tooltip-trigger, line-tooltip-content |
| `./toast` | line-toast, line-toast-group |
| `./menubar` | line-menubar, line-menubar-menu, line-menubar-trigger, line-menubar-content, line-menubar-item |

**Independent entrypoints:** `./button`, `./icon-button`, `./button-group`, `./split-button`, `./input`, `./password-input`, `./search-input`, `./date-input`, `./textarea`, `./field`, `./fieldset`, `./icon`, `./alert`, `./chip`, `./avatar`, `./avatar-group`, `./presence`, `./spinner`, `./editable`, etc.

**The barrel export (`"."`) imports everything** — for consumers who prefer convenience over bundle size.

---

## 13. Detailed Component Decisions

Architectural decisions for specific components that were debated and resolved. These inform the individual `.spec/` files but are documented here because they establish patterns reused across the catalogue.

### 13.1 Button Ecosystem

- **Button** — Custom machine, `formAssociated: true`, supports `type="submit|reset|button"`, slots: prefix/suffix/default, states: idle/pressed/loading/disabled. Loading state is headless (state only, no bundled spinner).
- **IconButton** — Separate component, `aria-label` required (TypeScript enforced), same machine as Button.
- **ButtonGroup** — Static, `role="group"`, border collapse, slot-based (does NOT import Button).
- **SplitButton** — Custom, Phase 3 (depends on Button + Menu), bundles both internally.
- **ToggleButton** — NOT a separate component; use ToggleGroup with single item or Button with `pressed` state.

### 13.2 Avatar Group

- **Avatar** — Static, slots: default/fallback/status, parts: root/image/fallback.
- **AvatarGroup** — Custom machine (NOT static), states: `collapsed ↔ expanded ↔ overflow_open`. Hover expands, click on overflow opens popover. Props: max, size, spacing.

### 13.3 Input Decomposition

- **Input** — Custom machine, `formAssociated: true`, slots: prefix/suffix, detects autofill.
- **PasswordInput** — Separate. Internal `toggle` part (not slot) because it must coordinate `type` toggle.
- **SearchInput** — Separate. Internal `clear` part (not slot) because it must call `CLEAR` on machine.
- **DateInput** — Separate, Phase 2. Masked segments. No popup. Different from DatePicker (Phase 4).
- **Textarea** — Separate, Custom machine, auto-resize, `formAssociated: true`.

### 13.4 DateInput vs DatePicker

- **DateInput** (Phase 2) — masked text field, segment navigation, no popup, `formAssociated`.
- **DatePicker** (Phase 4) — calendar popup via Zag.js, accepts any trigger via slot including DateInput.
- Composition: `<line-date-picker><line-date-input slot="trigger"></line-date-input></line-date-picker>`

### 13.5 Spinner

- Static, no machine. CSS-only. Parts: root. Props: size, speed, label.
- Button's `::part(loading)` is independent — Spinner is composed via slot when needed.

### 13.6 Editable

- Pre-built (`@zag-js/editable`). Click-to-edit inline text.
- Machine: idle → editing → idle. Escape reverts.
- All sub-components are internal parts (not slots) — must coordinate read↔edit transition.
- `formAssociated: true`.

### 13.7 Menubar

- Custom machine coordinating N `@zag-js/menu` instances.
- Tracks `activeMenuIndex`, hover-to-open when sibling open, arrow key nav between triggers.
- Different from NavigationMenu (site nav) — Menubar is desktop-app chrome.
- Family entrypoint.
