# Stack

| Field | Value |
|-------|-------|
| Status | `approved` (Miguel, 2026-10-28) |
| Phase | `1` |
| Tier | `Static` |
| Tag | `line-stack` |
| Entrypoint | `@websublime/line-components/stack` |
| Form-associated | `no` |
| PRD catalogue entry | PRD §4.1, `Stack` row |
| Ledger row | `01-C3` |
| Governing sections | Phase 1 spec §6.C.4 (C3 row), §6.C.6, §6.G.4 (List rules), §10 SD12, SD34, SD59; ARCH §3, §4, §5, §12, §14.7, §14.8, §17.2–§17.4 |

---

## Part A — Requirements

### Overview

#### Description

`<line-stack>` lays out its children in one row or one column with a gap between them (PRD §4.1, `docs/PRD.md:258`). The host itself is the flex container, and the children are its flex items. Five reflected attributes set direction, main-axis distribution, cross-axis alignment, gap and wrapping. The gap comes from the `--line-layout-gap-*` token scale (`packages/line-tokens/src/layouts.css:20-24`). Stack adds no role, no state and no behaviour, so it stays a `generic` element in the accessibility tree (R8 `docs/research/01-research-accessibility.md:80`).

#### Use cases

- Stack form fields, cards or paragraphs vertically with even spacing.
- Lay out a toolbar of buttons in a row, with `wrap` for narrow widths.
- Push two groups apart with `justify="spaceBetween"`.
- Build a list by putting `role="list"` on the host and `role="listitem"` on the children.
- Render an A2UI `Row`, `Column` or `List` node on `<line-a2ui-surface>` (ARCH §17.3, `docs/ARCHITECTURE.md:1580`).

#### Anti-patterns

- Two-dimensional layout with rows and columns that align. Use `<line-grid>` (Phase 1 row C17).
- Centring one child in a box. Use `<line-center>` (Phase 1 row C18).
- A visible divider between items. Put `<line-separator>` (row C4) between the children.
- A semantic list where native markup is available. A plain `<ul>`/`<li>` needs no custom element.
- Breakpoint-driven direction changes through attributes. Stack has no responsive props, so use a container or media query on `line-stack` in the consumer's CSS.

#### User expectations

- Children appear in source order, in the writing direction of the page.
- Spacing between children is even and follows the design tokens.
- Stack adds nothing to what a screen reader announces.
- Consumer CSS on `line-stack` overrides any layout default.

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| any element or `line-*` component | child | the default slot; Stack never imports a child (MANIFESTO Law 4; Phase 1 spec §6.C.6) |
| `<line-stack>` | child or parent | the default slot; nested stacks build mixed row and column layouts |
| `<line-a2ui-surface>` | orchestrator | creates `line-stack` by tag for A2UI `Row`, `Column` and `List`, puts `children` in the default slot and sets the list roles of SD59 (ARCH §17.3; Phase 1 spec §6.G.4, §10 SD59) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| `gap` | `0 \| 1 \| 2 \| 3 \| 4 \| 5` | `0` for no space; `1`–`5` for growing space on the `--line-layout-gap-*` scale (0.25rem, 0.5rem, 1rem, 1.5rem, 2rem); no attribute gives step `2` |

- `gap` is the one C6 semantic variant. Each value only redeclares the default of `--line-stack-gap` on `:host` and adds no other rule (ARCH §17.2 C6; decision D3).
- `direction`, `justify`, `align` and `wrap` are layout props, not C6 variants. Each one maps to a CSS layout property on `:host` (Props below), and none touches a token.
- An unknown `gap` value behaves as no attribute, and the attribute keeps what the author wrote (C8).

---

## Part B — Technical Specification

### Anatomy

```
<line-stack>                 LineElement; display: flex on :host; host is the flex container
└── #shadow-root
    └── <slot>               slotted children are the host's flex items
```

- The shadow root holds only a bare `<slot>`, with no wrapper element (decision D1).
- A `<slot>` has `display: contents` by default, so slotted children take part in the host's flex layout directly [INFERENCE: CSS Scoping default for `slot`; the R2 spike uses the same shape, `docs/research/assets/01-r2/spike/src/components/line-stack.ts`].
- No `generic` node sits between a host `role="list"` and its `role="listitem"` children, so axe `list` and `listitem` see the parent they need (Phase 1 spec §6.G.4; decision D1).
- `commonReset` sets nothing on `:host`. It targets `*`, `:focus`, `::selection`, `img`/`svg`, `a` and `[hidden]` inside the shadow root (`packages/line-core/src/styles/reset.common.css:2-38`), so the component's `:host { display: flex }` does not conflict with it.
- The reset's `[hidden] { display: none !important }` rule (`reset.common.css:35-38`) matches shadow-tree elements only, not the host. An author-origin `:host { display: flex }` beats the UA `[hidden] { display: none }` rule, so `<line-stack hidden>` would still render [INFERENCE: CSS Cascade origin order, not probed]. The stylesheet therefore adds `:host([hidden]) { display: none }`, as Button does (`packages/line-components/src/button/button.ts:129-131`).

### States

| Field | Value |
|-------|-------|
| Machine | `none` (Static tier; ARCH §8; Phase 1 spec §6.C.4 C3 row) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| none | — | — | — |

Stack has no finite states and no state flags, so it writes no `data-*` attribute and no `:state()` (ARCH §14.8).

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ChildList` | any number of elements or text; each element becomes a flex item; the A2UI `children` |

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| none | — | — |

- Stack exposes no `::part()` (decision D1).
- MANIFESTO Law 1 still holds, because the only styleable zone is the host, and the consumer styles it directly with `line-stack { … }`. The children are light-DOM elements the consumer styles directly, as Button's `prefix` and `suffix` zones are (`docs/specs/0002-button.md:140`).
- Consumer CSS on `line-stack` in the outer tree beats the component's `:host` rules for normal declarations, so a consumer overrides any layout property directly (ARCH §4) [INFERENCE: CSS Cascade 5 shadow-context ordering; the Browser tier proves it].

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `direction` | `direction` | `'row' \| 'column'` | `'column'` | yes | main axis; `row` → `flex-direction: row`, `column` → `flex-direction: column` |
| `justify` | `justify` | `'start' \| 'center' \| 'end' \| 'spaceBetween' \| 'spaceAround' \| 'spaceEvenly' \| 'stretch'` | `'start'` | yes | distribution on the main axis; maps to `justify-content` (`flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `space-evenly`); `stretch` grows the items instead (below) |
| `align` | `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | yes | alignment on the cross axis; maps to `align-items` (`flex-start`, `center`, `flex-end`, `stretch`) |
| `gap` | `gap` | `'0' \| '1' \| '2' \| '3' \| '4' \| '5'` | `undefined` (step `2`) | yes | space between items; C6 variant over `--line-stack-gap` (Variants, CSS custom properties) |
| `wrap` | `wrap` | `boolean` | `false` | yes | `flex-wrap: wrap` when present, `nowrap` otherwise |

- Each prop is styled by an attribute selector on `:host`, such as `:host([direction="row"])` and `:host([wrap])`. The `:host` defaults cover the default values, a missing attribute and an unknown value.
- The `justify` and `align` values mirror the A2UI basic v0.9 `Row`/`Column` enums one to one (`a2ui-project/a2ui@cbaa5ee` `specification/v0_9/catalogs/basic/catalog.json`; decision D2). `baseline` appears in upstream's `ALIGN_MAP` but not in the schema enum, so Stack leaves it out.
- `justify="stretch"` sets `::slotted(*) { flex-grow: 1 }`, so every item grows to share the main axis. CSS `justify-content: stretch` behaves as `flex-start` on a flex container and would drop the agent's intent [INFERENCE: CSS Box Alignment 3 §5.1, not probed].
- That rule diverges on purpose from upstream `web_core`, which writes `stretch` as the CSS keyword through an inline style, so the items do not grow (`a2ui-project/a2ui@cbaa5ee` `typescript/core/web_core/src/universal/basic_catalog/components/Row.ts`, `Column.ts`).
- `direction="row"` follows the writing direction, so items run right to left under `dir="rtl"`, because flexbox lays out on logical axes.
- An unknown value of any enum prop behaves as that prop's default, and the attribute keeps what the author wrote (C8), as Button's converters do (`packages/line-components/src/button/button.ts`).
- Stack has no responsive props. Consumers change layout with container or media queries on the host.

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

Stack dispatches no event. It holds no value and takes no input, so C3 and C9 add nothing.

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-stack-gap` | `var(--line-layout-gap-2)`; `gap="0"`: `0`; `gap="N"` for `N` in `1`–`5`: `var(--line-layout-gap-N)` | none; the host, as `gap: var(--line-stack-gap)` on `:host` |

- `:host` declares `--line-stack-gap: var(--line-layout-gap-2)`, which is `var(--line-size-2)` = 0.5rem (`packages/line-tokens/src/layouts.css:21`).
- `:host([gap="0"])` through `:host([gap="5"])` redeclare only that default. The scale is 0.25rem, 0.5rem, 1rem, 1.5rem and 2rem (`layouts.css:20-24`, over `--line-size-1`, `-2`, `-3`, `-5`, `-7`).
- A consumer sets `--line-stack-gap` or `gap` on `line-stack` to any length, and either beats the `:host` default.
- Without `line-tokens` loaded, `--line-layout-gap-N` is undefined, so `--line-stack-gap` is invalid at computed-value time and `gap` computes to its initial value `normal`, which is zero in flex layout. `gap="0"` is unaffected, because it sets a literal `0` [INFERENCE: CSS Variables 1 invalid-at-computed-value-time rule, not probed].
- Stack draws no colour, border or focus ring, so it needs no `line-themes` role token.

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

Stack takes no focus. Focus moves through its children in tree order.

### A11y

| Field | Value |
|-------|-------|
| Role | none; the host stays `generic` (R8 `docs/research/01-research-accessibility.md:80`; Phase 1 spec §6.C.4 C3 row) |
| ARIA attributes | none set by the component; it never writes `role`, `aria-*` or `internals.role`, and it leaves an author-set host `role` alone (decision D4) |
| Accessible name | none by default; see the C5 note below |
| Focus | none; the host is not focusable and does not delegate focus |

- **C5.** ARIA 1.2 prohibits `aria-label` and `aria-labelledby` on `generic`, so a name on a role-less `line-stack` has no effect. A name applies only when the author also sets a role that allows one, such as `role="group"` or `role="list"`. The host takes the attribute as it is, and Stack copies nothing, because the host is the element that carries any role.
- axe-core 4.14.0 (`bun.lock:918`) checks this case with rule `aria-prohibited-attr` (`node_modules/.bun/axe-core@4.14.0/node_modules/axe-core/axe.js:36815`). Its evaluate function returns a violation only when the element has no text content, and returns `incomplete` (needs review) when it has text (`axe.js:32258-32300`). An empty, role-less, labelled `line-stack` is therefore a violation, and a labelled one with text children is a review item.
- **Lists.** A hand-written list puts `role="list"` on the host and `role="listitem"` on each child, and a story documents it. `<line-a2ui-surface>` applies the same roles for A2UI `List` (Phase 1 spec §6.G.4, `docs/specs/01-spec-core-primitives.md:1493-1494`; §10 SD59).
- No screen-reader pass is needed, because Stack sets no role and the open item of the C3 row is resolved without one (decision D4; Phase 1 spec §6.C.4).

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | every prop is a string enum or a boolean |
| C2 | Slots carry `@slot` and a single or multiple classification | one `@slot` tag for the default slot, classified `ChildList` |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | no events |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated |
| C5 | The host accepts an accessible name and applies it to the element with the role | the host is the only element and carries any author role; a name is valid only with an author role that allows it (A11y) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | `gap` reflects `0`–`5` and redeclares only the default of `--line-stack-gap` on `:host`; `direction`, `justify`, `align` and `wrap` are layout props, not variants |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries `@summary`, `@slot` for the default slot and `@cssprop --line-stack-gap`; no `@csspart` or `@fires`, because there are no parts or events; nothing is deprecated |
| C8 | Missing or partial props degrade to an empty or neutral state | with no attributes it is a column with a 0.5rem gap; with no children it renders an empty flex box; unknown enum values fall back to the default |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `Stack` |
| Tag | `line-stack` |
| `load()` subpath | `@websublime/line-components/stack` |
| Prop schema | `direction`, `justify`, `align`, `gap`, `wrap`, plus the catalog-only `children` (`ChildList`), which the frontend-tool walker leaves out (Phase 1 spec §6.G.3) |
| Slot map | `(default)` → `ChildList` (`children`) |
| Binding map | `direction`, `justify`, `align`, `gap`, `wrap` → attribute; no value prop; no commit event |
| Action map | none |
| Accessibility requirements | none for the component; for A2UI `List` the surface sets `role="list"` and `role="listitem"` (Phase 1 spec §10 SD59) |
| Agent-facing description | A layout container that places its children in one row or column with even spacing. Put the children in `children`. `direction` is `column` (default) or `row`; a row follows the page's writing direction. `justify` spreads children along that axis: `start` (default), `center`, `end`, `spaceBetween`, `spaceAround`, `spaceEvenly`, or `stretch` to make every child grow to share the space. `align` places children across the axis: `stretch` (default), `start`, `center` or `end`. `gap` sets the spacing on a scale from `0` (none) to `5` (widest); leave it out for a medium gap. Set `wrap` to let children flow onto more lines when space runs out. Stack adds nothing to what assistive technology announces. |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C3 row) |

- Stream G writes this descriptor in G1, because C3 ships without one (Phase 1 spec §6.C.0 step 3).
- The `basic` catalog maps A2UI `Row`, `Column` and `List` onto `line-stack` (ARCH §17.3, `docs/ARCHITECTURE.md:1580`).
  - `Row` sets `direction="row"` and `Column` sets `direction="column"`.
  - `List.direction` translates `vertical` → `column` and `horizontal` → `row`.
  - `justify` and `align` pass through one to one (decision D2).
  - `List` gets `role="list"` on the host and `role="listitem"` on each item `line-stack`, or on a `<div role="listitem">` wrapper when the item is another component (Phase 1 spec §6.G.4; §10 SD59).
- A2UI basic `Row`, `Column` and `List` have no `gap` or `wrap` (`a2ui-project/a2ui@cbaa5ee` `specification/v0_9/catalogs/basic/catalog.json`), so basic nodes get the default gap and no wrapping. The `line` catalog exposes both.
- Upstream `Column` sets `width: var(--a2ui-column-width, 100%)` (`a2ui-project/a2ui@cbaa5ee` `typescript/core/web_core/src/universal/basic_catalog/components/Column.ts`). Stack does not copy it; the host keeps block-level width from `display: flex`.

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/stack` |
| Kind | `independent` (ARCH §12; Phase 1 spec §10 SD12) |
| Registers | `line-stack` |
| Reset modules | `commonReset` (ARCH §14.7, Static tier) |

- Files: `src/stack/stack.ts` (class and `customElements.define`), `src/stack/stack.types.ts`, `src/stack/index.ts`.
- `package.json` gains the `./stack` export of Phase 1 spec §4.2, and the Vite build gains the `stack/index` entry that emits `dist/stack/index.js`, next to `button/index` (`packages/line-components/vite.config.mjs:14`).

### Markup examples

```html
<!-- Default: column, gap step 2 -->
<line-stack>
  <p>First</p>
  <p>Second</p>
</line-stack>

<!-- Directions -->
<line-stack direction="column">…</line-stack>
<line-stack direction="row">…</line-stack>

<!-- Justify and align -->
<line-stack direction="row" justify="spaceBetween" align="center">
  <span>Title</span>
  <line-button>Edit</line-button>
</line-stack>
<line-stack direction="row" justify="stretch">
  <line-button>Yes</line-button>
  <line-button>No</line-button>
</line-stack>

<!-- Gap scale -->
<line-stack gap="0">…</line-stack>
<line-stack gap="1">…</line-stack>
<line-stack gap="5">…</line-stack>

<!-- Wrap -->
<line-stack direction="row" wrap>
  <line-button>One</line-button>
  <line-button>Two</line-button>
  <line-button>Three</line-button>
</line-stack>

<!-- Author-built list -->
<line-stack role="list" aria-label="Recent files">
  <div role="listitem">report.pdf</div>
  <div role="listitem">notes.md</div>
</line-stack>
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom | prop defaults and reflection; enum converters falling back to the default while the attribute keeps the author's value; `wrap` boolean parsing; the shadow root holding only a `<slot>`; no `role`, `aria-*` or `internals.role` written, and an author `role` left unchanged; the C8 empty render; `packages/line-components/__tests__/manifest-paths.test.ts` on the packed tarball (Phase 1 spec §6.C.6) |
| Browser | Playwright `*.e2e.ts` on chromium, firefox and webkit | computed `flex-direction`, `justify-content`, `align-items` and `flex-wrap` for every value; computed `gap` in px for each step with `line-tokens` loaded, and `normal` without; `justify="stretch"` items sharing the main axis; reversed visual order of a row under `dir="rtl"`; consumer CSS on `line-stack` beating the `:host` defaults; `<line-stack hidden>` rendering nothing; an `ariaSnapshot` of the author list story showing a `list` with `listitem` children |
| A11y | axe-core | zero violations (MANIFESTO Law 3) in every story: default, each direction, justify and align, gap scale, wrap, and the author list story |
| htmx | n/a | `n/a`. Stack is neither value-bearing nor compound, so the template marks the row `n/a`, as Phase 1 spec §10 SD34 expects for static rows |
| Visual | Playwright `stack.visual.ts` on the `visual` project | every Stack story, with Linux baselines from a `visual-baselines.yml` run (Phase 1 spec §6.C.6, §10 SD98) |

- No update-rate row, because Stack is not a machine row (Phase 1 spec §6.C.6).
- The axe and visual tests run against the Storybook stories on port 4320 (Phase 1 spec §6.P.7, §6.P.11). The layout tests need a fixture page that loads `@websublime/line-components/stack` and `line-tokens`, placed within the Phase 1 spec §4 file classes.

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| 1 | Which element is the flex container? | Miguel | The host itself; the shadow root renders only a bare `<slot>`, with no `::part()`. An inner `<div part="root">` was rejected, because it puts a `generic` node between a host `role="list"` and its items (Miguel, 2026-10-28) |
| 2 | Which values do `justify` and `align` use? | Miguel | The A2UI basic v0.9 camelCase values one to one, so the `basic` catalog maps them without translation; CSS kebab-case values rejected (Miguel, 2026-10-28) |
| 3 | How is the gap controlled? | Miguel | A reflected `gap` attribute with a closed scale `0`–`5` that only redeclares the default of `--line-stack-gap`; no attribute gives `var(--line-layout-gap-2)`. Token-only and free-length attributes rejected (Miguel, 2026-10-28) |
| 4 | Does Stack carry list semantics beyond Phase 1 spec §6.G.4 / SD59? | Miguel | No. Stack never sets a role and never overrides an author host `role`; authors and the surface put `role="list"`/`role="listitem"` in markup. A `list` attribute setting `internals.role` rejected (Miguel, 2026-10-28) |
| 5 | What are the `direction` values and default? | orchestrator | `row \| column`, default `column`, reflected; the surface translates A2UI `List.direction` and Row/Column (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 6 | What does `justify="stretch"` do? | orchestrator | `::slotted(*) { flex-grow: 1 }`, a deliberate divergence from upstream `web_core` (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 7 | Which `align` values ship? | orchestrator | `start \| center \| end \| stretch`, default `stretch`; `baseline` excluded (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 8 | How does wrapping work? | orchestrator | boolean `wrap` → `flex-wrap: wrap` (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 9 | Does Stack have events, keyboard, states, a machine or responsive props? | orchestrator | None; consumers use container or media queries on the host (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 10 | How do unknown enum values behave? | orchestrator | As the default, with the attribute keeping the author's value (C8) (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 11 | Can consumer CSS override the layout? | orchestrator | Yes; consumer rules on `line-stack` beat the `:host` rules for normal declarations (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 12 | Does `<line-stack hidden>` hide? `:host { display: flex }` beats the UA `[hidden]` rule and `commonReset` does not reach the host | orchestrator | `:host([hidden]) { display: none }`, following the Button precedent (`packages/line-components/src/button/button.ts:129-131`) (orchestrator default shown to Miguel on 2026-10-28, no objection) |
