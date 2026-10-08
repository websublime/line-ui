# <Component name>

> Copy this file to `docs/specs/NNNN-<component>.md`, where `NNNN` is the number in the component's PRD §4 spec link (PROCESS §1).
> Replace every `<placeholder>` and delete every guidance line (the lines that start with `>`), this preamble included.
> The spec moves to `approved` before any code is written (PRD §8.3).

| Field | Value |
|-------|-------|
| Status | `<proposed \| reviewed \| approved \| implemented>` |
| Phase | `<N>` |
| Tier | `<Pre-built \| Custom \| Static>` |
| Tag | `<line-name>` |
| Entrypoint | `@websublime/line-components/<subpath>` |
| Form-associated | `<yes \| no>` |
| PRD catalogue entry | PRD §4.`<n>`, `<Component>` row |

> Status follows PRD §8.2 (`proposed → reviewed → approved → implemented`), the tier follows PRD §3 and ARCHITECTURE §8, the tag carries the `line-` prefix (MANIFESTO Law 2), the entrypoint follows ARCHITECTURE §12, and form association follows ARCHITECTURE §7.

---

## Part A — Requirements

> Part A is written for PMs, designers and developers who evaluate the library (PRD §8.1).

### Overview

> Describe what the component is for, when to reach for it, when not to, and what a user expects from it.

#### Description

<One paragraph on what the component does.>

#### Use cases

- <Use case>

#### Anti-patterns

- <Misuse, and the component or native element to use instead>

#### User expectations

- <Behaviour a user expects from this kind of control>

### Connections

> Components connect through slots, events and the orchestrator pattern, and a component never imports another component to compose its children (MANIFESTO Law 4, ARCHITECTURE §2).

| Component | Relation | Connects through |
|-----------|----------|------------------|
| `<line-other>` | <parent, child, sibling or orchestrator> | <slot name, event or orchestrator> |

### Variants

> A semantic variant is a reflected attribute with a closed enum and no styles (C6); write `none` when the component has no variants.

| Attribute | Values | Use when |
|-----------|--------|----------|
| `<variant>` | `<a \| b \| c>` | <situation per value> |

---

## Part B — Technical Specification

> Part B is written for developers who implement or consume the component (PRD §8.1).

### Anatomy

> Draw the shadow tree (ARCHITECTURE §1), make consumer-controlled zones slots and state-coordinated zones parts (§3), and name any native element the platform requires (§15).

```
<line-name>
└── <div part="root">
    └── <slot>
```

### States

> Name the machine for the tier (ARCHITECTURE §8) and reflect every state as a host `data-*` attribute and a `:state()` (§14.8); a Static component writes `none`.

| Field | Value |
|-------|-------|
| Machine | `<@zag-js/<id> \| custom createMachine() \| none>` |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| `<state>` | `<EVENT>` | `<EVENT>` | `data-<state>`, `:state(<state>)` |

### Slots

> Give each slot a name and classify it as single (`ComponentId`) or multiple (`ChildList`) per C2.

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `<ComponentId \| ChildList>` | <expected content> |

### Parts

> Take part names from the shared vocabulary in ARCHITECTURE §5, and expose a part for every styleable zone (MANIFESTO Law 1).

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<div>` | <role in the anatomy> |

### Props

> Every public input is a JSON-serialisable attribute or property (C1), and a form-associated component exposes `value` as a property (C4).

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `<prop>` | `<attr>` | `<string \| number \| boolean \| 'a' \| 'b' \| string[] \| number[]>` | `<default>` | `<yes \| no>` | <what it controls> |

### Events

> Every event name carries the `line-` prefix and a typed `detail`, and a value-bearing component fires `line-change` on commit and `line-input` on live edits (C3).

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| `line-<name>` | `{ <field>: <type> }` | <trigger> |

### CSS custom properties

> List only `--line-*` properties (MANIFESTO Law 2), and leave total visual control to `::part()` (ARCHITECTURE §4).

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-<component>-<property>` | `<value or role token>` | `<part>` |

### Keyboard

> Map every key the component handles to its action; write `none` for a component that takes no focus.

| Key | Action |
|-----|--------|
| `<Key>` | <action> |

### A11y

> WCAG 2.1 AA is the floor (MANIFESTO Law 3), and each row names the element that carries it.

| Field | Value |
|-------|-------|
| Role | `<role>` on `<host or inner element>` |
| ARIA attributes | `<aria-*>` and what sets each |
| Accessible name | <`aria-label`, `aria-description` or label property, applied to the element with the role (C5)> |
| Focus | <host or inner focusable, `delegatesFocus`, `data-focus-visible` (ARCHITECTURE §14.9)> |

### Agent contract

> Show how the component meets each rule in ARCHITECTURE §17.2 and fill every descriptor field in §17.3; the rules are normative from Phase 1.

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | <how; excluded inputs go in the table below> |
| C2 | Slots carry `@slot` and a single or multiple classification | <how> |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | <how> |
| C4 | Form-associated components expose `value` and accept external validity | <how, or "not form-associated"> |
| C5 | The host accepts an accessible name and applies it to the element with the role | <how> |
| C6 | Semantic variants are reflected closed enums with no styles | <how, or "no variants"> |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | <how> |
| C8 | Missing or partial props degrade to an empty or neutral state | <how> |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| `<input>` | <reason> | `<alternative or none>` |

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `<Name>` |
| Tag | `<line-name>` |
| `load()` subpath | `@websublime/line-components/<subpath>` |
| Prop schema | <props from the Props table, minus the C1 exclusions> |
| Slot map | <slot → `ComponentId` or `ChildList`> |
| Binding map | <prop → property or attribute; value prop; commit event> |
| Action map | <prop → DOM event> |
| Accessibility requirements | <requirements the renderer validates> |
| Agent-facing description | <at most 1024 characters> |
| `agentExposed` | `<true \| false, with the reason>` |

### Bundle / entrypoint

> Apply the family rule of ARCHITECTURE §12 and list the reset modules the component imports (§14.6, §14.7).

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/<subpath>` |
| Kind | `<family \| independent>` |
| Registers | `<line-name>`, <family members> |
| Reset modules | `commonReset`, <others> |

### Markup examples

> Show the default use, each variant and each slot through the public API only.

```html
<line-name>
  <placeholder content>
</line-name>
```

### Tests

> Prove each behaviour at the cheapest tier that can observe it, and send real focus, layout and platform behaviour to the browser tier.

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom | <props, events, state reflection, C8 degradation> |
| Browser | Playwright `*.e2e.ts` on chromium, firefox and webkit | <keyboard, focus, form participation, native behaviour> |
| A11y | axe-core | Zero violations in every state (MANIFESTO Law 3) |

---

## Open Questions

> Record each question with its owner, and record the resolution before the spec moves to `approved`.

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| 1 | <question> | <owner> | <open, or the answer and where it landed> |
