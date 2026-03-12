# XXXX. line-{component}

**Date:** YYYY-MM-DD
**Status:** proposed | reviewed | approved | implemented
**Phase:** {N} — {phase name}
**Tier:** Pre-built | Custom | Static
**Spec:** `.spec/XXXX-{component}.md`

---

## Part A — Requirements

### 1. Description

One paragraph. What this component is, what problem it solves, and who benefits from it. Write for someone who has never seen the component — a PM, a designer, a developer evaluating the library.

### 2. Use Cases

Concrete scenarios where this component is the right choice. Each use case should describe a real situation, not a feature.

- **{Scenario name}** — {description of the situation and how the component solves it}
- **{Scenario name}** — {description}
- ...

### 3. When NOT to Use

Anti-patterns and alternatives. Each entry names the wrong situation AND points to the correct component or pattern.

| If you need... | Use instead |
|----------------|-------------|
| {description of wrong use case} | `<line-{alternative}>` or {pattern} |
| ... | ... |

### 4. User Expectations

What a user (developer consumer) expects to happen when interacting with the component. Written as observable behaviours — what you can see, hear (screen reader), or verify. These are the acceptance criteria.

- When {trigger}, the component {expected behaviour}
- When {trigger}, the component {expected behaviour}
- ...

### 5. Connections

How this component relates to others in the catalogue. Three types of connection:

**Composes with (used together via slot or side-by-side):**
- `<line-{component}>` — {how they connect, e.g., "Field accepts Input via default slot"}

**Depends on (requires another component to function):**
- `<line-{component}>` — {why, e.g., "SplitButton uses Menu internally"}

**Related (similar purpose, different use case):**
- `<line-{component}>` — {what differentiates them, e.g., "Collapsible is for a single item; Accordion is for multiple exclusive items"}

### 6. Variants

Named configurations that produce meaningfully different behaviour or appearance. Not every prop combination — only the ones that change the component's identity.

| Variant | Description | Key difference |
|---------|-------------|----------------|
| {name} | {what it looks like / does} | {what distinguishes it from default} |
| ... | ... | ... |

---

## Part B — Technical Specification

### 7. Anatomy

ASCII diagram or description of the component's visual/structural parts. Shows the DOM structure the consumer interacts with — tags, slots, parts.

```
<line-{component}>
  ┌─────────────────────────────────────┐
  │ ::part(root)                        │
  │  ┌──────┐  ┌──────────────────────┐ │
  │  │ slot │  │ ::part(...)          │ │
  │  │prefix│  │ {internal structure} │ │
  │  └──────┘  └──────────────────────┘ │
  └─────────────────────────────────────┘
</line-{component}>
```

**Tags:**

| Tag | Role |
|-----|------|
| `<line-{component}>` | Root element |
| `<line-{component}-{sub}>` | Sub-component (if applicable) |

### 8. API

#### 8.1 Properties (attributes)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| ... | ... | ... | ... |

#### 8.2 Events

| Event | Detail type | When fired |
|-------|------------|------------|
| `line-{event}` | `{ ... }` | {trigger condition} |

#### 8.3 Slots

| Slot | Description | Fallback |
|------|-------------|----------|
| `default` | {what goes here} | {what renders if empty} |
| `{name}` | ... | ... |

#### 8.4 CSS Parts

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<div>` | Main container |
| ... | ... | ... |

#### 8.5 Internal Parts

Elements rendered by the component that the consumer styles via `::part()` but does NOT provide via slot. The component must coordinate state with these elements.

| Part | Element | Why internal (not slot) |
|------|---------|------------------------|
| ... | ... | {reason: must coordinate with machine, must toggle attribute, etc.} |

_If none, write "None — all content is consumer-provided via slots."_

#### 8.6 CSS Custom Properties

| Property | Default | Controls |
|----------|---------|----------|
| `--line-{component}-{prop}` | `var(--line-{global-token})` | {what it affects} |

#### 8.7 Host Data Attributes

| Attribute | Condition | CSS usage |
|-----------|-----------|-----------|
| `data-{state}` | {when active} | `line-{component}[data-{state}] { ... }` |

### 9. States & Machine

_If Static tier: write "Static component — no machine. Purely presentational."_

_If Pre-built tier:_

**Machine:** `@zag-js/{machine-name}`

| State | Description | Transitions |
|-------|-------------|-------------|
| {state} | {what the component looks like / does} | → {next state} via {event} |

_If Custom tier:_

**Machine:** Custom `createMachine()` from `@zag-js/core`.

```
{state diagram in ASCII or prose}
```

| State | Description | Transitions |
|-------|-------------|-------------|
| {state} | {description} | → {next state} via {event} |

**Computed values:**

| Computed | Type | Derivation |
|----------|------|------------|
| `{name}` | boolean | {how it's derived from context} |

### 10. Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| `Enter` | {when focused on...} | {what happens} |
| `Escape` | ... | ... |
| `Arrow Down` | ... | ... |

### 11. Accessibility

**ARIA roles:**

| Element | Role | Notes |
|---------|------|-------|
| Root | `{role}` | {why} |

**ARIA attributes:**

| Attribute | On | Value |
|-----------|----|-------|
| `aria-{attr}` | {element} | {value or dynamic source} |

**Screen reader behaviour:**
- {what is announced and when}

**Form association:**
_If formAssociated:_ `formAssociated: true` via LineElement mixin. Participates in native `<form>` submit, reset, and validation. Reports validity via `ElementInternals`.
_If not:_ Not form-associated.

**WAI-ARIA pattern reference:** {link to WAI-ARIA pattern if applicable, e.g., https://www.w3.org/WAI/ARIA/apd/patterns/accordion/}

### 12. Bundle & Entrypoint

| | |
|---|---|
| **Entrypoint** | `./{ }` |
| **Type** | Family / Independent |
| **Registers** | `line-{component}`, `line-{component}-{sub}`, ... |
| **Dependencies** | `@zag-js/{machine}` or "None" |

### 13. Markup Examples

**Minimal:**

```html
<line-{component}>
  ...
</line-{component}>
```

**With configuration:**

```html
<line-{component} {prop}="{value}">
  ...
</line-{component}>
```

**Composed with other components:**

```html
<!-- Show how this component works with related components -->
```

**Themed / styled:**

```css
line-{component} {
  --line-{component}-{prop}: {value};
}

line-{component}::part(root) {
  /* Total control */
}
```
