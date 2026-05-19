# line://ui — Architecture

**Date:** 2026-05-19
**Status:** APPROVED
**Maintenance:** Living document — updated as architectural decisions evolve.
**Source:** Extracted from PRD v0.8.2 §3 (Component Architecture) and §9 (Design System — Layered Package Model). Aligned with Manifesto Laws 2, 6, 7, 10 (revised 2026-05-19).
**Manifesto:** [`docs/MANIFESTO.md`](./MANIFESTO.md)

This document captures the **cross-cutting architectural decisions** that apply to all components. Individual component specifications live in `docs/specs/`. Product requirements live in [`docs/PRD.md`](./PRD.md).

---

## Revision Notes

- **v0.8.0 (2026-05-19)** — Realigned with PRD v0.8.2 and the revised Manifesto.
  - §4 (CSS Customisation — Dual Layer) rewritten to reflect the layered design system: components now consume **role-namespaced** tokens (`--line-accent-*`, `--line-gray-*`, `--line-success/warning/danger/info-*`) plus the **9 named aliases per role** (`-surface`, `-bg`, `-bg-hover`, `-bg-active`, `-border`, `-solid`, `-solid-hover`, `-text-low`, `-text`) and the sibling **`--line-{role}-contrast`** static token. References to v0.7 single-colour semantic globals (`--line-background`, `--line-solid-background`, `--line-primary-*` as direct hue tokens) removed.
  - §6 (Base Class — LineElement) — Zag.js lifecycle now explicitly stated to integrate via the `@zag-js/element` adapter (Phase 0 refactor task per PRD §7.2).
  - §11 (Icon System) — clarified that `@websublime/line-icons` is **orthogonal to the design system**: it is a separate, optional library. Components consume icons via **slots**; consumers may use `line-icons`, Lucide, Phosphor, Iconoir, or any other library.
  - §12 (Bundle Splitting Rule) — restated under the **umbrella package model**: a single `@websublime/line-components` package with per-component subpath exports, `customElements.define()` as the sole side-effect, declared via the `sideEffects` field. Not per-component packages.
  - Throughout: replaced class-based theming (`.line-schema-X`) with attribute-based theming (`[data-accent]` / `[data-gray]`); replaced the v0.7 28-palette set with Radix Colors 3.x 31 hues; replaced "inverted dark scale" wording with the Radix invariant **semantic-by-step** (step N has the same role in light and dark; pixel values differ).
  - Section headings whose anchors are referenced from PRD §3 are **not renamed** (see §2, §3, §4, §5, §7, §8, §9, §12 below).
- **v0.7.0 (2026-03-12)** — Initial extraction from PRD v0.7.0 §3 (Component Architecture). Superseded in design-system surface area by v0.8.0.

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

**Flow:** Zag.js manages all logic (state, transitions, a11y, keyboard, focus trapping) → Lit renders shadow DOM with `part` attributes on every relevant element → Consumer styles via `::part()` or by consuming role/alias variables (`--line-accent-*`, `--line-{role}-bg`, …) exposed by the layered design system (`line-tokens` + `line-colors` + `line-themes`, optionally with `line-schemas` / `line-utils`).

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

Two surfaces, one strategy. Use **CSS custom properties** for token-level adjustments. Use **`::part()`** for total visual control. Both ship by default on every styleable zone (Manifesto Principle 4).

**Layer 1: Custom properties — Quick adjustments**

Custom properties form three concentric tiers (full cascade documented in PRD §9.11). Components consume from each tier; consumers override at any tier.

| Tier | Origin | Examples |
|------|--------|----------|
| **Foundation tokens** | `@websublime/line-tokens` (L0) | `--line-size-3`, `--line-radius-2`, `--line-shadow-3`, `--line-easing-out`, `--line-z-overlay`, `--line-motion-fast` |
| **Palette tokens** | `@websublime/line-colors` (L1) | `--line-amber-1..12`, `--line-amber-contrast`, `--line-slate-1..12`, … (31 hues × 12 steps; `light-dark()` per step; static single-value `--line-{hue}-contrast`) |
| **Role tokens (numeric)** | `@websublime/line-themes` (L3) | `--line-accent-1..12`, `--line-gray-1..12`, `--line-success-1..12`, `--line-warning-1..12`, `--line-danger-1..12`, `--line-info-1..12`, plus the sibling `--line-{role}-contrast` (one per role; static single value; not wrapped in `light-dark()`) |
| **Role aliases (named)** | `@websublime/line-themes` (L3) | `--line-{role}-surface` (step 2), `-bg` (step 3), `-bg-hover` (step 4), `-bg-active` (step 5), `-border` (step 7), `-solid` (step 9), `-solid-hover` (step 10), `-text-low` (step 11), `-text` (step 12) — 9 aliases × 6 roles = 54 alias variables |
| **Component tokens** | Defined inside `:host` by each component | `--line-button-radius`, `--line-button-bg`, `--line-button-color`, … (always `--line-{component}-{prop}`) |

```css
/* Adjust component tokens on the host element */
line-button {
  --line-button-radius: var(--line-radius-round);
  --line-button-height-md: 3rem;
  --line-button-font-size: var(--line-font-size-3);
  /* Re-bind the solid surface to a different role: */
  --line-button-bg: var(--line-danger-solid);
  --line-button-color: var(--line-danger-contrast);
}
```

**Components consume role/alias tokens, never hue tokens directly.** A `<line-button>` resolves its primary surface as `var(--line-accent-solid)` (or `var(--line-accent-9)` in numeric form) plus `var(--line-accent-contrast)` for the foreground. The hue currently bound to the `accent` role is determined by `data-accent` on an ancestor (default: `indigo`). This is the single rule that makes attribute-based theming work — see [PRD §9.4 (Theme Application)](./PRD.md) for the full design rationale.

**Layer 2: `::part()` — Total control over internal elements**

```css
line-button::part(root) {
  background: linear-gradient(135deg, pink, purple);
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

Component tokens follow the `--line-{component}-{prop}` convention. Consumers override these for quick adjustments. `::part()` provides total control for consumers who want absolute customisation. Complementary, not redundant.

**Token naming conventions (Manifesto Law 2):**

| Prefix | Layer | Examples |
|--------|-------|----------|
| `--line-{family}-{step}` | Foundation tokens (`line-tokens`) | `--line-radius-2`, `--line-size-3`, `--line-shadow-2` |
| `--line-{hue}-{step}` | Palette tokens (`line-colors`) | `--line-blue-9`, `--line-slate-12`, `--line-amber-3` |
| `--line-{hue}-contrast` | Palette contrast tokens (`line-colors`) | `--line-blue-contrast`, `--line-amber-contrast` (static; not `light-dark()`) |
| `--line-{role}-{step}` | Role tokens (`line-themes`) | `--line-accent-9`, `--line-gray-3`, `--line-danger-2` |
| `--line-{role}-{alias}` | Role aliases (`line-themes`) | `--line-accent-solid`, `--line-gray-bg-hover`, `--line-danger-text` |
| `--line-{role}-contrast` | Role contrast token (`line-themes`) | `--line-accent-contrast` (static; resolves through the active hue) |
| `--line-{component}-{prop}` | Component tokens | `--line-button-radius`, `--line-input-padding-x` |

All public custom properties we author are `--line-*` prefixed. Standard HTML hooks (`data-accent`, `data-gray`, ARIA attributes, etc.) follow web conventions and are exempt (Manifesto Law 2).

**Theme application is attribute-based (no class-based theming).** Themes are not entities — a theme is the `(accent, gray)` pair selected via two independent attributes on any element:

```html
<html data-accent="indigo">                              <!-- default accent + auto-paired slate -->
<html data-accent="amber" data-gray="slate">             <!-- explicit accent + explicit gray -->
<section data-accent="violet">…</section>                <!-- scoped theming nests naturally -->
```

Because `accent` and `gray` namespaces are independent, multiple colour contexts can coexist on the same page without conflict. Semantic roles (`success`, `warning`, `danger`, `info`) are **fixed at `:root`** and never re-skinned by theme choice — a red error and a green success are usability invariants.

**Light/dark via `light-dark()`** — palette tokens (`line-colors`) are mono-declaration; the active value is chosen by the computed `color-scheme` property. Each step has a **fixed semantic function** identical in light and dark (step 1 is always app background; step 9 is always solid brand; step 12 is always high-contrast text). The pixel values differ between modes; the role of step N never changes (Radix invariant — see PRD §9.2).

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

**Note:** The current codebase uses `ComponentElement` with `ComponentMixin`. The refactoring to `LineElement` is a Phase 0 task (PRD §7.2).

```
LitElement
  └── LineElement (refactored base class)
        ├── Inspector mixin (feature flag via localStorage)
        ├── Metadata mixin (version, docs, qa)
        ├── Direction mixin (LTR/RTL)
        ├── FormAssociated mixin (opt-in, ElementInternals)
        └── Zag.js machine connection (lifecycle-managed via @zag-js/element)
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

**Zag.js integration is via the `@zag-js/element` adapter.** The adapter is the framework-agnostic binding Zag.js exposes for vanilla custom elements; `LineElement` invokes it inside `connectedCallback` / `disconnectedCallback` so machine subscriptions are torn down deterministically when the element leaves the DOM.

**Failure mode (Manifesto Principle 9 / Law 9):** if a machine fails to initialise, the component renders in a static fallback state and never throws an uncaught error at the consumer.

**HTMX adapter — exploratory.** `LineHtmxElement` is a planned extension of `LineElement` that adds `hx-*` attribute forwarding, server-driven state updates, and swap-aware lifecycle hooks (PRD Appendix A). Per Manifesto Law 7 it is **exploratory**: Phase 0 validates feasibility, Phase 1 commitment depends on the outcome. No component in this document depends on HTMX being shipped.

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

**Required indicator:** `::part(indicator)` — consumer/theme styles it. Uses the shared `indicator` part name from §5 (semantic: "state indicator").

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

Icons are **orthogonal to the design system.** `@websublime/line-icons` is a separate, optional icon library that shares the line://ui brand and naming conventions but is **not** one of the five design-system packages (`line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils`). This mirrors the Radix Themes / `@radix-ui/react-icons` split (PRD §6.1, §9.1).

**Components consume icons via `<slot>`, not by importing an icon library** (Manifesto Law 4: composition over inheritance, slots over props for content). A `<line-button>` does not import `<line-icon>`; it exposes a `prefix` slot that the consumer fills with whatever icon element they prefer — `<line-icon>`, a Lucide SVG, a Phosphor component, an Iconoir tag, a raw inline `<svg>`, or anything else.

```html
<line-button>
  <line-icon slot="prefix" name="check"></line-icon>
  Save
</line-button>

<line-button>
  <svg slot="prefix" viewBox="0 0 24 24"><!-- raw SVG --></svg>
  Save
</line-button>
```

**`<line-icon>` (when used) is an abstract wrapper with an agnostic registry:**

```html
<line-icon name="check" library="phosphor"></line-icon>
<line-icon name="arrow-right" library="lucide"></line-icon>
<line-icon src="/my-icons/custom.svg"></line-icon>
```

- `line-icon` exposes a **registry** where the consumer registers icon libraries.
- Each library is a resolver: given a name, returns the SVG.
- Zero icons bundled in `line-icons` core — the consumer brings their own resolver (Lucide, Phosphor, Iconoir, `@radix-ui/react-icons`, custom).
- Dependency direction is one-way: `line-icons → line-tokens` is permitted (icons reuse icon-size / sizing tokens); the inverse is forbidden.

---

## 12. Bundle Splitting Rule

> Sub-components of a family share a single entrypoint. Independently usable components have separate entrypoints. A component belongs to a family when it requires its parent to function. Components connected via `<slot>` are always separate entrypoints — slots imply independence.

**Umbrella package, not per-component packages (Manifesto Law 6).** All components ship inside a single `@websublime/line-components` package with **one version and one changelog**. Each component family or independent component is exposed as a **subpath export** in `package.json` — `@websublime/line-components/button`, `@websublime/line-components/dialog`, etc. There is no central barrel that imports every component; the root `"."` export is intentionally minimal (types and shared utilities only). This is **not** a Lerna-style "one package per component" layout — the umbrella keeps a single source of truth while subpath exports preserve tree-shaking and bundle isolation.

**Side-effect contract.** Each component file calls `customElements.define()` at module top — this is the **only** side-effect. Importing one component never imports or executes another. The umbrella package declares `"sideEffects"` listing exactly the per-component dist files, so bundlers can tree-shake unused subpaths even when consumers use the root specifier.

```js
// Consumer imports surgically — registers only what is used
import '@websublime/line-components/button';
import '@websublime/line-components/field';
import '@websublime/line-components/input';
```

A button must not drag in a dialog.

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

**There is no convenience "import everything" barrel.** Consumers explicitly import the subpaths they need. The root `"."` export is intentionally minimal (types and shared utilities only), and `"sideEffects"` lists exactly the per-component dist files. This enforces bundle isolation by construction (Manifesto Law 6) — no consumer can accidentally drag in the full catalogue with a single import.

---

## 13. Detailed Component Decisions

Architectural decisions for specific components that were debated and resolved. These inform the individual `docs/specs/` files but are documented here because they establish patterns reused across the catalogue.

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

---

## 14. Browser Defaults Neutralisation

### 14.1 The Problem

Browsers impose default styles, pseudo-classes, and behaviours on native HTML elements. These defaults differ across Chrome (Blink), Safari (WebKit), and Firefox (Gecko).

line://ui must neutralise ALL of these defaults so that every component renders identically across browsers, with zero visual opinion. The consumer or theme controls everything.

### 14.2 Three Layers of Neutralisation

| Layer | What it solves | Who is responsible |
|-------|---------------|-------------------|
| **Shadow DOM isolation** | Document-level styles (body margins, heading sizes, link colours) do NOT leak into components | Automatic — Shadow DOM provides this |
| **Internal CSS reset** | Native elements INSIDE shadow DOM (`<input>`, `<button>`, `<textarea>`) still receive browser defaults. Must be neutralised. | Modular reset sheets, each component imports only what it needs |
| **State reflection** | Native pseudo-classes (`:disabled`, `:required`, `:checked`, `:focus-visible`, etc.) don't work on custom elements. Must be replicated via host attributes and `CustomStateSet`. | Zag.js machine + `LineElement` base class |

**Two distinct reset systems** — these serve **different DOM contexts** and must not be confused:

| System | Lives in | DOM context | When applied | Documented in |
|---|---|---|---|---|
| **Shadow-DOM internal resets** | `@websublime/line-core/styles/reset.*.css` (modular, per-element category) | Inside each component's shadow root, on the native elements it renders (`<input>`, `<button>`, etc.) | Automatic via `static styles` on each component | §14.3–§14.7 |
| **Light-DOM consumer reset** | `@websublime/line-tokens/reset` (single file, opt-in subpath) | Outside components — on slotted content (`<h2 slot="title">`, `<p>`), or anywhere in the consumer's light DOM | Manual — consumer `@import`s it once at the top of their app CSS | §14.10 |

The shadow-DOM resets are **internal infrastructure** — components carry them automatically, and a consumer never imports them. The light-DOM reset is an **optional convenience** for consumers who want a baseline on the surrounding page; consumers using their own reset (`normalize.css`, modern resets) skip it. Both apply zero opinion — they neutralise defaults without introducing colour, spacing, or typography.

### 14.3 Modular CSS Reset — Zero Overhead Per Component

**Principle: a component never carries CSS for elements it doesn't render.** A `<line-badge>` has no `<input>` — it must not carry input resets. A `<line-slider>` has no `<textarea>` — it must not carry textarea resets.

The reset system is split into independent CSS files. Each file targets a specific category of native elements. Components import only the modules they need.

**File structure:**

```
packages/core/src/styles/
├── reset.common.css       ← ALL components get this (minimal)
├── reset.input.css        ← Components with <input> in shadow DOM
├── reset.button.css       ← Components with <button> in shadow DOM
├── reset.textarea.css     ← Components with <textarea> in shadow DOM
├── reset.select.css       ← Components with <select> in shadow DOM
├── reset.range.css        ← Range/slider components
├── reset.progress.css     ← Progress/meter components
├── reset.summary.css      ← Details/summary components
├── reset.fieldset.css     ← Fieldset/legend components
├── reset.table.css        ← Table components
├── reset.scrollbar.css    ← Scroll area components
└── index.ts               ← Exports all modules as CSSStyleSheet objects
```

### 14.4 Reset Module Contents

#### `reset.common.css` — Every component

The minimum shared baseline. Applies to ALL components via `LineElement`.

```css
/* Box model */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Focus — removed from all internal elements.
 * Machine drives data-focus-visible on host.
 * Consumer/theme styles focus via ::part() or --line-focus-ring-* */
*:focus {
  outline: none;
}

/* Selection — inherit, don't impose */
::selection {
  background: var(--line-selection-bg, Highlight);
  color: var(--line-selection-color, HighlightText);
}

/* Images/SVGs — block display, constrained */
img, svg {
  display: block;
  max-width: 100%;
}

/* Anchor reset */
a {
  color: inherit;
  text-decoration: none;
}

/* Hidden attribute must always win */
[hidden] {
  display: none !important;
}
```

#### `reset.input.css` — Input, PasswordInput, SearchInput, DateInput, NumberInput, Combobox

```css
input {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  word-spacing: inherit;
  background: transparent;
  border: 0;
  border-radius: 0;
  -webkit-border-radius: 0;
  padding: 0;
  margin: 0;
  outline: none;
  width: 100%;
}

/* Number spinner arrows */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}

/* Search cancel button */
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-decoration {
  -webkit-appearance: none;
}

/* Date/time picker indicators */
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  display: none;
}

/* Password reveal icon (Edge/Chrome) */
input[type="password"]::-ms-reveal,
input[type="password"]::-webkit-credentials-auto-fill-button {
  display: none;
}

/* File input button */
input[type="file"]::file-selector-button {
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}

/* Placeholder */
::placeholder {
  color: inherit;
  opacity: 0.5;
}

/* Autofill detection via animation trick */
@keyframes line-autofill-start { from {} }
@keyframes line-autofill-cancel { from {} }

input:-webkit-autofill {
  animation-name: line-autofill-start;
}
input:not(:-webkit-autofill) {
  animation-name: line-autofill-cancel;
}

/* Autofill background neutralisation */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: inherit;
  -webkit-box-shadow: 0 0 0px 1000px transparent inset;
  transition: background-color 5000s ease-in-out 0s;
}
```

#### `reset.button.css` — Button, IconButton, SplitButton

```css
button {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  margin: 0;
  outline: none;
  cursor: pointer;
  line-height: inherit;
}

button:disabled {
  cursor: not-allowed;
}
```

#### `reset.textarea.css` — Textarea

```css
textarea {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  word-spacing: inherit;
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  margin: 0;
  outline: none;
  resize: none;
  width: 100%;
}

textarea::placeholder {
  color: inherit;
  opacity: 0.5;
}
```

#### `reset.select.css` — Select (native fallback scenarios)

```css
select {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  color: inherit;
  background: transparent;
  background-image: none;
  border: 0;
  border-radius: 0;
  padding: 0;
  margin: 0;
  outline: none;
  width: 100%;
}
```

#### `reset.range.css` — Slider, RangeSlider, AngleSlider

```css
input[type="range"] {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  outline: none;
  width: 100%;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
}

input[type="range"]::-moz-range-thumb {
  border: 0;
  background: transparent;
}

input[type="range"]::-webkit-slider-runnable-track {
  background: transparent;
}

input[type="range"]::-moz-range-track {
  background: transparent;
}
```

#### `reset.progress.css` — Progress, ProgressRing, Gauge/Meter

```css
progress, meter {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  border: 0;
  background: transparent;
  width: 100%;
}

/* Progress — WebKit */
progress::-webkit-progress-bar { background: transparent; }
progress::-webkit-progress-value { background: transparent; }

/* Progress — Gecko */
progress::-moz-progress-bar { background: transparent; }

/* Meter — WebKit */
meter::-webkit-meter-bar { background: transparent; border: 0; }
meter::-webkit-meter-optimum-value { background: transparent; }
meter::-webkit-meter-suboptimum-value { background: transparent; }
meter::-webkit-meter-even-less-good-value { background: transparent; }

/* Meter — Gecko */
meter::-moz-meter-bar { background: transparent; }
```

#### `reset.summary.css` — Accordion, Collapsible

```css
summary {
  list-style: none;
  cursor: pointer;
}

summary::-webkit-details-marker {
  display: none;
}

summary::marker {
  content: '';
}
```

#### `reset.fieldset.css` — Fieldset

```css
fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

legend {
  padding: 0;
}
```

#### `reset.table.css` — Table, DataGrid

```css
table {
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
}

th, td {
  padding: 0;
  text-align: inherit;
  font-weight: inherit;
}
```

#### `reset.scrollbar.css` — ScrollArea

```css
/* Standard properties (Firefox + Chrome 121+) */
:host {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

/* WebKit (Chrome < 121, Safari) */
::-webkit-scrollbar {
  width: var(--line-scrollbar-size, 8px);
  height: var(--line-scrollbar-size, 8px);
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: var(--line-scrollbar-radius, 4px);
}
```

### 14.5 Build Pipeline — CSS Files to Shared `CSSStyleSheet` Objects

The `.css` files are real, standalone, editable files in the repository. At build time, Vite inlines them as strings. The core package exports them as singleton `CSSStyleSheet` objects.

```typescript
// packages/core/src/styles/index.ts
import commonCSS from './reset.common.css?inline';
import inputCSS from './reset.input.css?inline';
import buttonCSS from './reset.button.css?inline';
import textareaCSS from './reset.textarea.css?inline';
import selectCSS from './reset.select.css?inline';
import rangeCSS from './reset.range.css?inline';
import progressCSS from './reset.progress.css?inline';
import summaryCSS from './reset.summary.css?inline';
import fieldsetCSS from './reset.fieldset.css?inline';
import tableCSS from './reset.table.css?inline';
import scrollbarCSS from './reset.scrollbar.css?inline';

function createSheet(css: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  return sheet;
}

export const commonReset = createSheet(commonCSS);
export const inputReset = createSheet(inputCSS);
export const buttonReset = createSheet(buttonCSS);
export const textareaReset = createSheet(textareaCSS);
export const selectReset = createSheet(selectCSS);
export const rangeReset = createSheet(rangeCSS);
export const progressReset = createSheet(progressCSS);
export const summaryReset = createSheet(summaryCSS);
export const fieldsetReset = createSheet(fieldsetCSS);
export const tableReset = createSheet(tableCSS);
export const scrollbarReset = createSheet(scrollbarCSS);
```

**How it works at each stage:**

| Stage | What happens |
|-------|-------------|
| **Source** | Real `.css` files in `packages/core/src/styles/`. Editable, lintable, reviewable. |
| **Build** | Vite `?inline` reads each CSS file and embeds it as a JavaScript string constant. Tree-shaking removes unused modules. |
| **Runtime** | `createSheet()` runs once per module (singleton). Creates a `CSSStyleSheet` object in memory. |
| **Adoption** | Components declare resets in `static styles`. Lit merges them with component-specific styles into `adoptedStyleSheets`. |
| **Instances** | 1000 `<line-input>` instances share the same `inputReset` object by reference. Zero duplication. |

**Browser support for `adoptedStyleSheets`:** Chrome 73+, Firefox 101+, Safari 16.4+. All within line://ui's target (latest 2 stable).

### 14.6 Component Usage

Each component declares exactly which reset modules it needs:

```typescript
// line-input.ts — needs common + input resets
import { commonReset, inputReset } from '@websublime/line-core/styles';
import { css } from 'lit';

class LineInput extends LineElement {
  static styles = [commonReset, inputReset, css`
    :host { display: inline-flex; }
    /* component-specific styles */
  `];
}
```

```typescript
// line-badge.ts — needs common only (no native form elements)
import { commonReset } from '@websublime/line-core/styles';
import { css } from 'lit';

class LineBadge extends LineElement {
  static styles = [commonReset, css`
    :host { display: inline-flex; }
  `];
}
```

```typescript
// line-accordion.ts — needs common + summary resets
import { commonReset, summaryReset } from '@websublime/line-core/styles';
import { css } from 'lit';

class LineAccordion extends LineElement {
  static styles = [commonReset, summaryReset, css`
    :host { display: block; }
  `];
}
```

```typescript
// line-table.ts — needs common + table resets
import { commonReset, tableReset } from '@websublime/line-core/styles';
import { css } from 'lit';

class LineTable extends LineElement {
  static styles = [commonReset, tableReset, css`
    :host { display: block; }
  `];
}
```

```typescript
// line-slider.ts — needs common + range resets
import { commonReset, rangeReset } from '@websublime/line-core/styles';
import { css } from 'lit';

class LineSlider extends LineElement {
  static styles = [commonReset, rangeReset, css`
    :host { display: block; }
  `];
}
```

**The `commonReset` is NOT injected automatically by `LineElement`.** Each component explicitly declares it. This keeps the base class clean and makes dependencies visible in the component source. If a future component genuinely needs zero reset (e.g., a wrapper that renders nothing), it can omit it.

### 14.7 Reset Module to Component Mapping

Which modules each component category uses:

| Component | `common` | `input` | `button` | `textarea` | `select` | `range` | `progress` | `summary` | `fieldset` | `table` | `scrollbar` |
|-----------|:--------:|:-------:|:--------:|:----------:|:--------:|:-------:|:----------:|:---------:|:----------:|:-------:|:-----------:|
| Button, IconButton | x | | x | | | | | | | | |
| ButtonGroup | x | | | | | | | | | | |
| SplitButton | x | | x | | | | | | | | |
| Input, PasswordInput, SearchInput, DateInput | x | x | | | | | | | | | |
| NumberInput | x | x | x | | | | | | | | |
| Textarea | x | | | x | | | | | | | |
| Select | x | | | | x | | | | | | |
| Combobox | x | x | | | | | | | | | |
| Slider, RangeSlider | x | | | | | x | | | | | |
| Field | x | | | | | | | | | | |
| Fieldset | x | | | | | | | | x | | |
| Checkbox, Radio, Switch | x | | | | | | | | | | |
| Accordion, Collapsible | x | | | | | | | x | | | |
| Progress, Gauge/Meter | x | | | | | | x | | | | |
| Table, DataGrid | x | | | | | | | | | x | |
| ScrollArea | x | | | | | | | | | | x |
| Badge, Alert, Chip, Avatar, Separator, Skeleton, Spinner, Card, Empty State, all Static | x | | | | | | | | | | |
| Dialog, Sheet, Popover, Tooltip, Toast | x | | | | | | | | | | |
| Editable | x | x | | | | | | | | | |
| FileUpload | x | x | | | | | | | | | |
| TagInput | x | x | | | | | | | | | |
| Rating | x | | | | | | | | | | |

### 14.8 State Reflection — Pseudo-Class Equivalents

Native pseudo-classes don't work on custom elements. line://ui provides two parallel APIs for consumers:

**API 1: Host data attributes** (works everywhere, simple CSS selectors)

```css
line-input[data-focused] { /* focused state */ }
line-input[data-disabled] { /* disabled state */ }
line-input[data-invalid] { /* invalid state */ }
```

**API 2: `CustomStateSet` via `ElementInternals`** (modern, `:state()` pseudo-class)

```css
line-input:state(focused) { /* focused state */ }
line-input:state(disabled) { /* disabled state */ }
line-input:state(invalid) { /* invalid state */ }
```

**Both APIs reflect the same machine state simultaneously.** The base class handles the wiring:

```typescript
// In LineElement or FormAssociated mixin
protected reflectState(name: string, active: boolean) {
  // Data attribute (universal)
  if (active) this.dataset[name] = '';
  else delete this.dataset[name];

  // CustomStateSet (modern)
  if (this.#internals?.states) {
    if (active) this.#internals.states.add(name);
    else this.#internals.states.delete(name);
  }
}
```

**Complete state mapping:**

| Machine state | Host attribute | CustomStateSet | Replaces native |
|---------------|---------------|---------------|-----------------|
| focused | `data-focused` | `:state(focused)` | `:focus` |
| focus-visible | `data-focus-visible` | `:state(focus-visible)` | `:focus-visible` |
| hovered | `data-hovered` | `:state(hovered)` | `:hover` |
| active | `data-active` | `:state(active)` | `:active` |
| disabled | `data-disabled` | `:state(disabled)` | `:disabled` |
| readonly | `data-readonly` | `:state(readonly)` | `:read-only` |
| required | `data-required` | `:state(required)` | `:required` |
| checked | `data-checked` | `:state(checked)` | `:checked` |
| indeterminate | `data-indeterminate` | `:state(indeterminate)` | `:indeterminate` |
| invalid | `data-invalid` | `:state(invalid)` | `:invalid` (also works natively via `setValidity()`) |
| valid | `data-valid` | `:state(valid)` | `:valid` (also works natively via `setValidity()`) |
| empty | `data-empty` | `:state(empty)` | `:placeholder-shown` |
| filled | `data-filled` | `:state(filled)` | -- |
| loading | `data-loading` | `:state(loading)` | -- |
| pressed | `data-pressed` | `:state(pressed)` | -- |
| expanded | `data-expanded` | `:state(expanded)` | `:open` |
| editing | `data-editing` | `:state(editing)` | -- |
| error | `data-error` | `:state(error)` | -- |
| autofill | `data-autofill` | `:state(autofill)` | `:-webkit-autofill` |
| open | `data-open` | `:state(open)` | `:open` |

**Note on `:valid` / `:invalid`:** These two are special — they work natively on form-associated custom elements via `ElementInternals.setValidity()`. We still reflect them as data attributes and CustomStateSet for consistency, but the native pseudo-classes also work. A consumer can use EITHER `line-input:invalid` OR `line-input[data-invalid]` OR `line-input:state(invalid)`.

**Note on `CustomStateSet` browser support:** Chrome 90+, Firefox 126+, Safari 17.4+. Within line://ui's target. The `data-*` attributes provide a universal fallback that works everywhere.

### 14.9 Focus Management

Focus is the most visible cross-browser inconsistency. line://ui standardises it:

**Internal elements:** All `outline: none` via `reset.common.css`. No browser focus ring leaks through.

**Host element:** The machine determines when focus is visible (keyboard vs pointer). `data-focus-visible` is set on the host ONLY for keyboard focus. The theme or consumer styles it:

```css
/* Theme default — consumes a role token (resolves through the active accent hue) */
line-input[data-focus-visible]::part(root) {
  outline: 2px solid var(--line-accent-border); /* step 7 of accent */
  outline-offset: 2px;
}

/* Consumer override */
line-input[data-focus-visible]::part(root) {
  box-shadow: 0 0 0 3px rgba(200, 255, 0, 0.4);
  outline: none;
}
```

**`delegatesFocus`:** For components where the host should be focusable and delegate to the first focusable internal element, set `delegatesFocus: true` on the shadow root:

```typescript
this.attachShadow({ mode: 'open', delegatesFocus: true });
```

Useful for Input, Textarea, SearchInput — clicking anywhere on the component focuses the internal `<input>`. Supported in Chrome 53+, Firefox 94+, Safari 15+.

### 14.10 Consumer-Side Reset for Slotted Content

`@websublime/line-tokens` exports an optional `reset.css` for consumers who want to neutralise browser defaults on slotted (light-DOM) content. This is NOT applied automatically — consumers opt in by importing it. The reset lives in `line-tokens` (foundation layer L0) because it is a zero-opinion baseline applied **before** any tokens, palettes, or themes — see PRD §9.9 for the export contract.

**Usage:**

```css
@import '@websublime/line-tokens/reset';
/* or: <link rel="stylesheet" href="@websublime/line-tokens/dist/reset.min.css"> */
```

All selectors use `:where()` for zero specificity, so consumer styles always win without needing to increase specificity.

**Scope — the reset covers seven categories:**

| # | Category | Target components | What it resets |
|---|----------|-------------------|----------------|
| 1 | Global slotted content | Any element with a `line-*` class | Margin, padding, font inheritance, list-style, media sizing on common HTML elements (`h1`–`h6`, `p`, `ul`, `ol`, `img`, `svg`, etc.) |
| 2 | Field component | `line-field` | Labels, hint/error slots — margin, padding, font inheritance |
| 3 | Form-adjacent components | `line-input`, `line-textarea`, `line-select`, `line-number-field`, `line-combobox`, `line-pin-input` | Labels, hint/error/description slots — margin, padding, font inheritance |
| 4 | Content containers | `line-card`, `line-dialog`, `line-alert`, `line-drawer`, `line-popover`, `line-tooltip`, `line-callout`, `line-banner` | Headings, paragraphs, lists — margin, padding, list-style |
| 5 | Navigation components | `line-tabs`, `line-breadcrumb`, `line-menu`, `line-pagination`, `line-navigation-menu` | Links, lists — text-decoration, color, margin, padding, list-style |
| 6 | Slotted button resets | `line-dialog`, `line-alert`, `line-drawer`, `line-toolbar`, `line-card` | Bare `<button>` elements — appearance, background, border, cursor |
| 7 | Slotted table resets | `line-card`, `line-dialog`, `line-drawer` | `<table>`, `<th>`, `<td>` — border-collapse, spacing, alignment |

**Example (field component):**

```css
:where(line-field) :where(label),
:where(line-field) :where(span[slot="hint"]),
:where(line-field) :where(span[slot="error"]) {
  margin: 0;
  padding: 0;
  font: inherit;
}
```

---

## 15. Native Element Requirements Matrix

### 15.1 When to Use Native Elements Inside Shadow DOM

Some components MUST render a native HTML element inside their shadow DOM because certain platform APIs are only available on native elements.

**Components that REQUIRE a native element internally:**

| Component | Internal element | APIs that require it |
|-----------|-----------------|---------------------|
| Input | `<input>` | IME composition, autofill, password managers, selection API (`setSelectionRange`, `selectionStart`), mobile keyboard hints (`inputmode`, `enterkeyhint`), speech-to-text |
| PasswordInput | `<input type="password">` | Password manager detection (1Password, Bitwarden, LastPass look for this) |
| SearchInput | `<input>` | Autofill, IME |
| DateInput | `<input>` (per segment) | IME for segment values, keyboard navigation |
| Textarea | `<textarea>` | IME, selection API, speech-to-text, undo/redo stack |
| FileUpload | `<input type="file">` | OS file dialog (no JS API exists to open it) |
| NumberInput | `<input type="text" inputmode="numeric">` | Mobile numeric keyboard |

**Components that do NOT need a native element:**

Checkbox, Radio, Switch, Select, Slider, Range Slider, Color Picker, Date Picker (calendar UI), Rating, Toggle Group, Combobox (dropdown part), Editable (preview mode), and all non-form components. These use `ElementInternals` for form participation and fully custom rendering for visuals.

### 15.2 Delegation Pattern

When a native element lives inside the shadow DOM, the custom element must delegate certain APIs that only exist on the native element:

```typescript
class LineInput extends LineElement {
  get #input(): HTMLInputElement {
    return this.shadowRoot!.querySelector('input')!;
  }

  // Selection API — only available on HTMLInputElement
  select() { this.#input.select(); }
  setSelectionRange(start: number, end: number, direction?: string) {
    this.#input.setSelectionRange(start, end, direction);
  }
  get selectionStart() { return this.#input.selectionStart; }
  set selectionStart(v) { this.#input.selectionStart = v; }
  get selectionEnd() { return this.#input.selectionEnd; }
  set selectionEnd(v) { this.#input.selectionEnd = v; }
  get selectionDirection() { return this.#input.selectionDirection; }
  setRangeText(...args: Parameters<HTMLInputElement['setRangeText']>) {
    this.#input.setRangeText(...args);
  }
}
```

The internal native element is always exposed as `::part(input)` so the consumer can style it:

```css
line-input::part(input) {
  caret-color: var(--line-accent-solid); /* role token; resolves through active accent hue */
}
```

### 15.3 Autofill Detection

Browser autofill forces a background colour (typically light yellow) that cannot be prevented via CSS alone. The `reset.input.css` module includes an animation-based detection trick that works across all browsers:

```css
/* Already in reset.input.css */
@keyframes line-autofill-start { from {} }
@keyframes line-autofill-cancel { from {} }
input:-webkit-autofill { animation-name: line-autofill-start; }
input:not(:-webkit-autofill) { animation-name: line-autofill-cancel; }
```

The component listens for the animation and reflects state:

```typescript
this.#input.addEventListener('animationstart', (e) => {
  if (e.animationName === 'line-autofill-start') {
    this.reflectState('autofill', true);
  }
  if (e.animationName === 'line-autofill-cancel') {
    this.reflectState('autofill', false);
  }
});
```

Consumer styles the autofilled state:

```css
line-input[data-autofill]::part(root) {
  background: var(--line-warning-2);
}
```

---

## 16. Unsolvable Browser Limitations

Some browser-imposed behaviours have **no CSS or JavaScript workaround**. The reset modules cannot fix them. This section documents every known case and line://ui's strategy for each.

### 16.1 The Core Principle

> When a native element cannot be fully neutralised, **don't use it visually**. Use it as an invisible data channel and render the visible UI entirely with custom markup.

This is the fundamental reason line://ui exists. If browsers let you fully style every native control, headless libraries wouldn't need to exist.

### 16.2 Complete Inventory of Unsolvable Cases

#### Input Date/Time — Picker Icon (Firefox)

| | |
|---|---|
| **Problem** | Firefox renders a calendar icon on `<input type="date">`, `<input type="time">`, and `<input type="datetime-local">`. There is NO pseudo-element to target it. `appearance: none` does NOT remove it. |
| **Affects** | `<line-date-input>`, `<line-time-picker>` — any component using native date/time inputs internally |
| **line://ui strategy** | `<line-date-input>` does NOT use `<input type="date">`. It uses `<input type="text">` with segment masking (day/month/year as separate navigable segments). No native picker icon exists to leak through. The date machine manages the segment state. |

#### Input Date/Time — Picker Popup Cannot Be Prevented

| | |
|---|---|
| **Problem** | Even with the icon hidden (Chrome/Safari), clicking the native date input may still open the browser's calendar popup. There is no way to prevent this via CSS or `preventDefault()`. |
| **Affects** | Any component using `<input type="date/time/datetime-local/month/week">` |
| **line://ui strategy** | Same as above — use `<input type="text">` with custom segment navigation. The native picker never exists. `<line-date-picker>` renders its own calendar popup via Zag.js, completely independent of the browser. |

#### Input Number — Spinner Arrows (Partial)

| | |
|---|---|
| **Problem** | Chrome/Safari: `::-webkit-inner-spin-button { display: none }` works. Firefox: `appearance: textfield` removes them BUT also changes the input's validation behaviour. There is no way in Firefox to hide the arrows while keeping `type="number"` validation. |
| **Affects** | `<line-number-input>` |
| **line://ui strategy** | Use `<input type="text" inputmode="numeric" pattern="[0-9]*">`. This gives the mobile numeric keyboard without native spinner arrows in ANY browser. Validation is handled by the Zag.js machine, not native number type. The internal `::part(increment)` and `::part(decrement)` are custom elements rendered by the component. |

#### Select — Dropdown Options List

| | |
|---|---|
| **Problem** | `<option>` elements inside a `<select>` dropdown are rendered by the OS, not the browser. They cannot be styled with CSS in any browser. `appearance: none` removes the select arrow but does NOT affect the dropdown list. |
| **Affects** | Any component using native `<select>` for the dropdown |
| **line://ui strategy** | `<line-select>` does NOT use a native `<select>` element. It renders a custom trigger via `::part(trigger)` and a custom dropdown via Popover/floating positioning (Zag.js select machine). Options are `<line-select-item>` custom elements. No native `<option>` elements exist. Form value is set via `ElementInternals.setFormValue()`. |

#### Select — Mobile OS Picker (iOS Flipwheel, Android Spinner)

| | |
|---|---|
| **Problem** | On iOS, a native `<select>` opens the system flipwheel. On Android, it opens a system spinner/dialog. These provide excellent UX for their platform. A custom `<select>` replacement loses this UX entirely. |
| **Affects** | `<line-select>` on mobile |
| **line://ui strategy** | Documented trade-off. `<line-select>` provides consistent cross-platform UI (custom dropdown). Consumers who prefer the native mobile picker for specific use cases can use a native `<select>` with `<line-field>` — the Field accepts any form control via slot. A future `native-mobile` prop is a nice-to-have post-1.0. |

#### File Input — OS Dialog

| | |
|---|---|
| **Problem** | There is NO JavaScript API to open a file dialog programmatically without a native `<input type="file">`. The `showOpenFilePicker()` API exists but is Chrome-only. |
| **Affects** | `<line-file-upload>` |
| **line://ui strategy** | A hidden `<input type="file">` lives inside the shadow DOM. It is invisible (zero dimensions, `opacity: 0`, `position: absolute`). The visible UI is fully custom — drop zone, file list, previews. Clicking the custom trigger calls `.click()` on the hidden native input. |

#### Color Input — OS Color Dialog

| | |
|---|---|
| **Problem** | `<input type="color">` opens the OS-level color picker. This cannot be styled, prevented, or replaced. |
| **Affects** | Would affect any component using native `<input type="color">` |
| **line://ui strategy** | `<line-color-picker>` does NOT use `<input type="color">`. It renders its own spectrum/hue/alpha UI via the Zag.js color-picker machine. Form value is set via `ElementInternals.setFormValue()`. No OS dialog involved. |

#### Autofill — Forced Background Colour

| | |
|---|---|
| **Problem** | When a browser autofills an `<input>`, it forces a background colour that CANNOT be prevented via CSS. `background: transparent !important` is ignored. |
| **Affects** | Any component with `<input>` in shadow DOM |
| **line://ui strategy** | Mitigation, not solution. The `reset.input.css` includes the `transition: background-color 5000s` hack that delays the forced background indefinitely. The animation-based autofill detection (section 15.3) reflects `data-autofill` on the host so consumers can apply their own override styling. This is the best possible workaround — no library has a complete fix. |

#### Password Managers — Shadow DOM Detection

| | |
|---|---|
| **Problem** | Password managers (1Password, Bitwarden, LastPass) look for `<input type="password">` to inject their autofill UI. Some managers detect inputs inside shadow DOM, some don't. |
| **Affects** | `<line-password-input>` |
| **line://ui strategy** | `<line-password-input>` always uses a real `<input type="password">` inside shadow DOM. The `name` and `autocomplete` attributes are forwarded from the host to the internal input. This maximises compatibility. Managers that don't support shadow DOM detection will miss it — this is a known limitation of ALL Web Component form libraries. |

#### Scrollbar — Firefox Styling Limitations

| | |
|---|---|
| **Problem** | Firefox only supports `scrollbar-width` and `scrollbar-color`. Chrome/Safari support the full `::-webkit-scrollbar-*` family. There is no way to achieve the same level of scrollbar customisation in Firefox as in Chrome. |
| **Affects** | `<line-scroll-area>` |
| **line://ui strategy** | `<line-scroll-area>` uses the Zag.js scroll-area machine which renders its OWN scrollbar overlay. The native scrollbar is hidden. The custom scrollbar is rendered as `::part(scrollbar-thumb)` and `::part(scrollbar-track)`. Consistent across all browsers. |

#### Details/Summary — Animation

| | |
|---|---|
| **Problem** | The native `<details>` element has no built-in animation for open/close. The new `::details-content` pseudo-element (Chrome 131+) is not supported in Firefox or Safari. |
| **Affects** | Would affect any component using native `<details>` for disclosure |
| **line://ui strategy** | `<line-accordion>` and `<line-collapsible>` do NOT use native `<details>`. They use Zag.js accordion/collapsible machines with custom rendering. The `<line-presence>` component handles enter/exit animations. Fully cross-browser. |

#### Textarea — Resize Handle Appearance

| | |
|---|---|
| **Problem** | `resize: none` removes the handle completely. But if you WANT a resize handle with custom styling, there is no standard pseudo-element. Chrome/Safari have `::-webkit-resizer` but Firefox has nothing. |
| **Affects** | `<line-textarea>` |
| **line://ui strategy** | `resize: none` is set in `reset.textarea.css`. If the consumer wants resize, `<line-textarea>` exposes an `auto-resize` prop (machine-driven auto-height) or a `resize` prop that re-enables native resize. A custom resize handle rendered as `::part(resize-handle)` is a nice-to-have post-1.0. |

### 16.3 Summary — Strategy Per Case

| Problem | Strategy | Native element used? |
|---------|----------|---------------------|
| Date/time picker icon (Firefox) | **Avoid** — use `<input type="text">` with segment masking | No native date input |
| Date/time picker popup | **Avoid** — custom calendar/time UI via Zag.js | No native date input |
| Number spinner arrows (Firefox) | **Avoid** — use `<input type="text" inputmode="numeric">` | Text input, not number |
| Select dropdown options | **Avoid** — fully custom dropdown, no native `<select>` | No native select |
| Mobile OS select picker | **Documented trade-off** — custom dropdown on all platforms | No native select |
| File dialog | **Hidden native** — invisible `<input type="file">`, custom visible UI | Hidden file input |
| Color dialog | **Avoid** — fully custom color picker UI | No native color input |
| Autofill forced background | **Mitigate** — delay hack + detection + state reflection | Native input (unavoidable) |
| Password manager detection | **Best effort** — real `<input type="password">` + attribute forwarding | Native password input |
| Scrollbar styling (Firefox) | **Replace** — custom scrollbar overlay, native hidden | Native scrollbar hidden |
| Details animation | **Avoid** — custom disclosure components with Presence | No native details |
| Textarea resize handle | **Reset** — `resize: none`, custom auto-resize or re-enable via prop | Native textarea |

**Pattern summary:** The dominant strategy is **avoidance** — don't use the native element that causes the problem. Render custom UI powered by Zag.js machines. Use `ElementInternals` for form integration. The native element only appears when there is literally no alternative (file dialog, password manager detection, text input for IME/autofill).
