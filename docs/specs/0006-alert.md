# Alert

| Field | Value |
|-------|-------|
| Status | `approved` (Miguel, 2026-11-09) |
| Phase | `1` |
| Tier | `Static` (Phase 1 spec §6.C.4 C7 row, `docs/specs/01-spec-core-primitives.md:1163`; PRD §4.1, `docs/PRD.md:248`) |
| Tag | `line-alert` |
| Entrypoint | `@websublime/line-components/alert` |
| Form-associated | `no` (Phase 1 spec §6.C.4 C7 row) |
| PRD catalogue entry | PRD §4.1, `Alert` row (`docs/PRD.md:248`) |
| Ledger row | `01-C7` |
| Governing sections | Phase 1 spec §4.2, §6.C.0, §6.C.4 (C7 row and notes), §6.C.6, §6.G.1, §6.G.3, §6.G.4, §7.4, §7.8, §10 SD4, SD12, SD19, SD31, SD34, SD37, SD39, SD98, §12 AM-058, AM-067, AM-086; ARCH §1–§5, §8, §12, §14.6–§14.8, §14.10, §17.2–§17.4; PRD §4.1, §5.2, §8, §9.3; MANIFESTO Laws 1–4, Out of Scope |

Text marked `[INFERENCE]` has no probe or source behind it yet. Miguel decided Open Questions D1–D7 and D11–D16 on 2026-11-09 and raised no objection to the orchestrator defaults D8–D10; Part B states those decisions.

---

## Probe — live roles on a slotting host

The Phase 1 spec leaves the `alert` vs `status` role to this spec (§6.C.4 C7 row, `:1163`; §10 SD37; R8 §6 Q8, `docs/research/01-research-accessibility.md:341-342`). A role set only through `ElementInternals` needs a Chromium accessibility-tree assertion and an `INTERNALS` read-back in three engines, and the spec records the Firefox and WebKit gap (§6.C.4 notes, `:1180`; §10 SD39; §12 AM-058). The probe ran on 2026-11-09 to inform D1, D2 and D8.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2, arm64; Bun 1.4.3 |
| Runner | Playwright 1.64.0 (`bun.lock:1572`), its own engine builds: chromium 156.0.8078.4, firefox 157.0, webkit 27.2 |
| Base class | the built `@websublime/line-core` 0.2.2 at `49b6172` (`LineElement`, `INTERNALS`), rebuilt with `bun --filter '@websublime/line-core' build` (exit 0) |
| Lit | `lit` 3.3.3, `lit-element` 4.2.2 |
| axe | `@axe-core/playwright` 4.14.0 with axe-core 4.14.0 (`bun.lock:238`, `:1018`); each case ran once with the §7.4 tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` (`packages/line-components/__tests__/a11y/axe.ts:19`) and once with every rule, both scoped to `main` |
| Chromium accessibility tree | a CDP session from `page.context().newCDPSession(page)`; `Accessibility.getFullAXTree`, reading `role`, `name` and the `live`, `atomic`, `relevant`, `busy` and `root` properties of every node that is not ignored |

The probe host `<probe-alert>` extended `LineElement` and rendered the anatomy this draft recommends (D4) in its shadow root: `<div part="root">` holding `<slot name="icon">`, a `<div part="content">` with `<slot name="title">` and the default slot, and `<slot name="actions">`. Two attributes switched the variant under test.

- `placement="internals"` (default) wrote `this[INTERNALS].role` in `willUpdate`, the Separator pattern (`packages/line-components/src/separator/separator.ts:76-83`). `placement="inner"` put the role on the shadow `<div part="root">`. `placement="none"` set no role.
- `live-role` gave the role, `alert` (default) or `status`.
- A second class, `<probe-alert-sync>`, wrote `role = 'alert'` in its constructor and rewrote it synchronously in `attributeChangedCallback`.

Each case mounted one host with the text "Payment failed. Check the card number." into an otherwise empty `<main>` and awaited `updateComplete`. The page held an `<h1>` above `<main>`.

The probe code lived in `packages/line-components/temp/c7-probe/`, which `.gitignore:4` (`temp`) ignores, and was deleted after the run. Nothing of it is committed.

Commands, from the repository root:

```sh
bun --filter '@websublime/line-core' build                                        # exit 0
bunx playwright test -c packages/line-components/temp/c7-probe/playwright.config.ts # exit 0, 6 passed (2 tests × 3 engines)
node packages/line-components/temp/c7-probe/bv.mjs                                 # engine versions
```

### P1 — `ElementInternals.role` on a slotting host

| Check | `role = 'alert'` | `role = 'status'` |
|---|---|---|
| Chromium AX node of the host | `alert`, name `""` | `status`, name `""` |
| Chromium live properties on that node | `live` `assertive`, `atomic` `true`, `relevant` `additions text`; no `busy` | `live` `polite`, `atomic` `true`, `relevant` `additions text`; no `busy` |
| Slotted text | `StaticText` "Payment failed. Check the card number." under a `generic` (the `content` wrapper) under the `alert` node | same, under the `status` node |
| Descendant nodes | carry none of the live properties; CDP reports them on the region root only | same |
| Slotted `<span slot="title">`, text and `<button slot="actions">Retry</button>` | `StaticText` "Payment failed" and "Check the card number." under the `generic`, then `button` "Retry", all inside the `alert` node | not run |
| Host `aria-label="Payment error"` | `alert` "Payment error" | not run |
| `INTERNALS` read-back, chromium, firefox and webkit | `role` `alert`; `ariaLive`, `ariaAtomic` and `ariaBusy` `null`; no host `role` attribute | `role` `status`; the rest as for `alert` |

- Chromium computes no name from the content of `alert` or `status`. Both roles take their name from the author only.
- No engine has an `ariaRelevant` property on `ElementInternals`. The read-back found the property missing in all three. The implicit `relevant` value still reaches Chromium through the role.

### P2 — Host `role` attribute and inner shadow element

| Check | Host `role` attribute (no internals role) | Role on the inner `<div part="root">` |
|---|---|---|
| Chromium AX node, `alert` | `alert` "", `live` `assertive`, `atomic` `true`, `relevant` `additions text` | same node and properties; the host itself is ignored |
| Chromium AX node, `status` | `status` "", `live` `polite`, `atomic` `true`, `relevant` `additions text` | same |
| Slotted text | inside the live region | inside the live region; the slot's assigned text sits under the inner element in the flat tree |
| Host `aria-label="Payment error"` | not run | a `generic` "Payment error" for the host, with an unnamed `alert` under it |
| `INTERNALS` read-back, all three engines | `role` `null`, host `role` attribute `alert` or `status` | `role` `null` |

All three placements give Chromium the same live region over the slotted text. They differ in the name. A host `aria-label` names the region when the role sits on the host, and names a `generic` host when the role sits inside (P1, P2).

### P3 — Author attributes over the internals default, and axe

| Host markup over an internals `alert` | Chromium AX node | `INTERNALS` read-back, all three engines |
|---|---|---|
| `role="status"` | `status` "", `live` `polite`, `atomic` `true` | `role` `alert`; host attribute `status` |
| `role="none"` | `generic`; no live properties | `role` `alert`; host attribute `none` |
| `role="note"` | `note`; no live properties | `role` `alert`; host attribute `note` |
| `aria-live="polite"` | `alert` "", `live` `polite`, `atomic` `true`, `relevant` `additions text` | `role` `alert`; `ariaLive` `null` |
| `aria-live="off"` | `alert` ""; no live properties | `role` `alert`; `ariaLive` `null` |
| no internals role, `aria-live="polite"` | `generic`, `live` `polite`, `atomic` `false`, `relevant` `additions text` | `role` `null` |

- An author `role` or `aria-live` attribute on the host wins over the internals default in Chromium, as HTML §4.13.7.4 says (R8 `:141-142`). The internals values stay as written.
- axe 4.14.0 reported zero violations for every case in P1, P2 and P3, in chromium, firefox and webkit, with the §7.4 tags and with every rule. That includes the named `generic` host of P2 and the unnamed regions. axe sees no internals role, because `LineElement` keeps its internals outside axe's lookup (`packages/line-core/src/internals.ts:1-13`; Phase 1 spec §10 SD19; `0011-separator.md` A11y), so zero violations prove nothing about the role, its live properties or its name.

### P4 — Present at load, inserted later, text changed

| Check | chromium | firefox | webkit |
|---|---|---|---|
| Two hosts in the page HTML (`alert` and `status`), read after load | AX nodes `alert` and `status` with the P1 live properties | `INTERNALS` `role` `alert` and `status` | same as firefox |
| Host created with `document.createElement`, `live-role="alert"`, then appended; `INTERNALS` role read synchronously after `append()` | `<probe-alert>` (`willUpdate`): `null`; after one microtask: `alert`. `<probe-alert-sync>`: `alert` before and after `append()` | same | same |
| `innerHTML` of a defined tag with `live-role="status"`, read synchronously | `<probe-alert>`: `null`. `<probe-alert-sync>`: `status` | same | same |
| AX tree 400 ms after the insertion | `alert` "" with the P1 live properties over "Inserted alert text"; identical in shape to the host present at load | not observable | not observable |
| AX tree 400 ms after `textContent` changed | same node, text "Changed alert text" | not observable | not observable |
| `Accessibility.nodesUpdated` and `Accessibility.loadComplete` events after `Accessibility.enable` and a first `getFullAXTree` | none fired during the insertion or the text change | not observable | not observable |

- A host that writes its role in `willUpdate` is role-less from `append()` until the first update, one microtask later, in all three engines. A host that writes its role in the constructor and in `attributeChangedCallback` has it at insertion.
- Chromium's tree, read after the task, cannot tell the two timings apart, and it shows a host present at load exactly like a host inserted later.

### What automation cannot observe

- Whether a screen reader announces the region, at load, on insertion or on a text change. APG says screen readers "do not inform users of alerts that are present on the page before page load completes" (R8 `:88-89`; https://www.w3.org/WAI/ARIA/apg/patterns/alert/). CDP exposes the live-region properties but no announcement event (P4).
- Whether any engine fires its platform alert event while the host is role-less between `append()` and the first Lit update. P4 shows the internals value only [INFERENCE: Chromium builds its tree after microtasks run, so it likely never sees the role-less state].
- Firefox and WebKit exposure of the internals role to assistive technology. The read-back proves the values each engine holds, not what it exposes (Phase 1 spec `:1180`; §12 AM-058).
- A manual screen-reader pass is optional and never blocks the row (Phase 1 spec `:1180`).

### What the probe settles

- Every placement gives Chromium a live region over the slotted content, with the role's implicit `live`, `atomic` and `relevant` values (P1, P2).
- Only a role on the host lets a host `aria-label` name the region. An inner role leaves a named `generic` host, which ARIA prohibits (R8 `:55`) and axe does not flag (P2, P3).
- An author `role` or `aria-live` on the host overrides an internals default, so any default the spec picks stays changeable from markup (P3).
- Writing the role in `willUpdate` leaves a one-microtask window without a role after insertion; writing it in the constructor and on attribute change does not (P4; D8).
- Neither CDP nor axe can show whether a region is announced. The choice of default role rests on APG, the PRD and the platform notes, not on probe output (D1).

---

## Part A — Requirements

### Overview

#### Description

`<line-alert>` is an inline box that tells the user about the state of something on the page: a saved change, a warning before an action, a failed payment, a piece of context (PRD §4.1, `docs/PRD.md:248`). It holds an optional icon, an optional title, a message and optional actions, all supplied by the consumer through slots (D4). A `variant` colours it by meaning, through the component's own tokens over the theme's semantic roles (D3). It stays on the page until the consumer removes it, and it never closes itself (D5). By default assistive technology reads it as part of the page; the opt-in `live` attribute makes it a live region that announces itself when it appears or changes (D1).

#### Use cases

- A form-level error summary above a form after a failed submit, with `variant="danger"` and `live="assertive"` so the user hears it.
- A persistent notice at the top of a settings page, such as "Your trial ends in 3 days", with an action button in the `actions` slot.
- A success message swapped into the page after a server round trip, for example by htmx, with `live="polite"`.
- Contextual help beside a section, with `variant="info"` and no live role.
- An agent-built message on `<line-a2ui-surface>` from a `line` catalog `Alert` node (D6). It carries no live role there; the surface's own live region announces the change (D7).

#### Anti-patterns

- A message that interrupts the user and asks for a decision. Use Alert Dialog (`docs/PRD.md:291`), because Alert takes no focus and blocks nothing.
- A transient notification that disappears on a timer. Use Toast (ARCH §12 `./toast`); APG warns against alerts that disappear automatically (WCAG 2.2.3; R8 `:88-89`).
- Validation text for one field. Use the `error` slot of `<line-field>` (ARCH §17.2 C4).
- A small status marker or count. Use `<line-badge>`.
- A live role on content that is present when the page loads and never changes. APG says screen readers do not announce it, and a page full of `alert` regions re-announces whenever a client-side router or a framework re-renders them. Leave `live` at its default `off` there (D1, D12).
- Moving focus into the alert. APG says alerts must not affect keyboard focus (R8 `:68`).

#### User expectations

- The alert sits in the flow of the page, as wide as its container, with its icon, title, message and actions laid out in one box.
- Its colour follows its meaning, and the theme's semantic roles stay fixed whatever the accent (PRD §9.3, `docs/PRD.md:1324`; D3).
- A screen reader reads it in page order. An alert with `live="polite"` or `live="assertive"` is announced when it appears or when its text changes, politely for `polite` (`status`) and assertively for `assertive` (`alert`) (R8 `:68`; ARIA `status`; D1, D12).
- Buttons in the alert work as buttons anywhere do; the alert itself takes no focus and handles no keys.
- Consumer CSS on `line-alert` and its parts overrides every visual default.

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| `<line-icon>` | child | the `icon` slot; Alert never imports it (MANIFESTO Law 4, `docs/MANIFESTO.md:45`; Phase 1 spec §6.C.6) |
| `<line-button>`, `<line-icon-button>`, native `<button>`, `<a>` | child | the `actions` slot; the consumer wires each action, including any dismiss, because Alert ships no dismiss control (D4, D5). `@websublime/line-tokens/reset` category 6 resets bare slotted `<button>` elements inside `line-alert` (ARCH §14.10, `docs/ARCHITECTURE.md:1290`; `packages/line-tokens/src/reset.css:105`) |
| headings, `<p>`, lists | child | the `title` and default slots; reset category 4 zeroes their margins inside `line-alert` (ARCH `:1288`; `reset.css:73-84`) |
| `<line-stack>` | parent | the Stack default slot; Stack `gap` spaces alerts in a column |
| `<line-a2ui-surface>` | orchestrator | creates `line-alert` by tag for a `line` catalog `Alert` node and wires its `icon`, `title`, `children` and `actions` props into the slots (ARCH §17.4; D6) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| `variant` (D3) | `neutral` (default) | general information with no tone |
| | `info` | helpful context or a tip |
| | `success` | an action completed |
| | `warning` | something needs attention before it becomes a problem |
| | `danger` | an error or a failed action |

- `variant` is a C6 semantic variant. It changes only the defaults of `--line-alert-*` tokens on `:host` and adds no other CSS rule (ARCH §17.2 C6, `docs/ARCHITECTURE.md:1571`). It sets no role, no icon and no text (D1, D3).
- The values follow the line://ui semantic role names `success`, `warning`, `danger` and `info` (PRD §9.3 `SEMANTIC_MAP`, `docs/PRD.md:1329-1334`), and `neutral` maps to the `gray` role.

---

## Part B — Technical Specification

### Anatomy

```
<line-alert>                          LineElement; display: block; with `live` `polite` or `assertive`, the live role sits on the host through ElementInternals (D2, D12)
└── #shadow-root
    └── <div part="root">             the box: a two-column grid (Layout below)
        ├── <div part="icon">         wraps <slot name="icon">; column 1, row 1, aligned to the block start
        ├── <div part="content">      column 2, row 1; a column of title then message
        │   ├── <div part="title">        wraps <slot name="title">
        │   └── <div part="description">  wraps the default <slot>
        └── <div part="actions">      wraps <slot name="actions">; column 2, row 2, a wrapping row
```

- All four zones are slots, because the consumer decides their content and behaviour (ARCH §3, `docs/ARCHITECTURE.md:214-221`; D4).
- A zone whose slot is empty renders no box (D11). The component keeps one private Lit state per slot, set from each slot's `slotchange` and once in `firstUpdated`, because happy-dom delivers the first `slotchange` before the listener exists (`packages/line-components/src/button-group/button-group.ts:263-266`). Chromium and Firefox fire no `slotchange` when an assigned `Text` node's data changes in place, as the DOM Standard says, and WebKit fires one (AM-003). A `MutationObserver` on the host (`characterData: true`, `subtree: true`) therefore re-reads the default slot's state on such a change in every engine. The observer connects in `connectedCallback` and disconnects in `disconnectedCallback` (AM-001). The named slots need no observer, because only elements reach them and any element counts as content. A slot is empty when its assigned nodes hold no element and no text other than whitespace. While a slot is empty its wrapper renders with the `hidden` attribute, which `commonReset` turns into `display: none` (`packages/line-core/src/styles/reset.common.css:35-38`). The state is not reflected on the host.
- An alert with every slot empty keeps its padded `root` box, the neutral C8 state (D11).
- No inner native element exists, so no `button` reset applies (D5).
- `:host { display: block }` beats the UA `[hidden]` rule, so the stylesheet adds `:host([hidden]) { display: none }`, as Button, Stack and Separator do (`packages/line-components/src/separator/separator.ts:47-49`).

#### Layout (D15)

| Zone | Rule |
|---|---|
| `root` | `display: grid`; `grid-template-columns: auto minmax(0, 1fr)`; `column-gap: 0`; `row-gap: var(--line-alert-gap)`; no explicit rows, so row 2 exists only while the `actions` wrapper is shown |
| `icon` | `grid-column: 1`; `grid-row: 1`; `align-self: start`; `margin-inline-end: var(--line-alert-gap)`, so a hidden icon leaves no gap before the content |
| `content` | `grid-column: 2`; `grid-row: 1`; `display: flex`; `flex-direction: column`; `gap: var(--line-alert-gap)` between the title and the message |
| `actions` | `grid-column: 2`; `grid-row: 2`; `display: flex`; `flex-wrap: wrap`; `gap: var(--line-alert-gap)` |

- The actions sit in a wrapping row below the message, aligned with the content column; the icon stays at the block start of the first row (D15).
- Logical properties and the grid follow the writing direction, so a right-to-left page mirrors the zones with no extra rule.
- A consumer who wants the actions in a third column sets `grid-template-columns` and the item placement through `::part(root)` and `::part(actions)` (ARCH §4).

### States

| Field | Value |
|-------|-------|
| Machine | `none` (Static tier; ARCH §8; Phase 1 spec §6.C.4 C7 row) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| none | — | — | — |

Alert has no finite states and no state flags, so it writes no `data-*` attribute and no `:state()` (ARCH §14.8). The per-slot empty state of D11 is private, so it sets `hidden` on a shadow wrapper and nothing on the host.

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `icon` | `ComponentId` | one icon, usually a `<line-icon>`; decorative unless the consumer names it |
| `title` | `ComponentId` | a short heading; the consumer picks the element and heading level that fit the page outline, such as `<h3 slot="title">` |
| `(default)` | `ChildList` | the message: text, paragraphs, lists or links |
| `actions` | `ChildList` | buttons or links for follow-up actions |

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<div>` | the box: background, border, radius, padding and the grid |
| `icon` | `<div>` | the icon zone; sets the icon colour |
| `content` | `<div>` | the column that holds the title and the message |
| `title` | `<div>` | the title zone |
| `description` | `<div>` | the message zone |
| `actions` | `<div>` | the actions zone |

- All six names come from the ARCH §5 vocabulary (`docs/ARCHITECTURE.md:301-322`). ARCH v0.8.24 adds `actions` with this spec (D4).

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `variant` | `variant` | `'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | yes | the tone; sets the defaults of the `--line-alert-*` colour tokens (D3) |
| `live` | `live` | `'off' \| 'polite' \| 'assertive'` | `'off'` | yes | the live role: `off` sets none, `polite` sets the internals role `status`, `assertive` sets `alert`; an unknown value behaves as `off`, and the attribute keeps what the author wrote (D1, D12) |

- "Reflects" follows Stack AM-002 and Separator. A value the author or code sets is written to the attribute, and a default leaves no attribute (Lit `useDefault: true`), so removing the attribute restores the default.
- An unknown `variant` behaves as `neutral`, and the attribute keeps what the author wrote (C8), as Button's `variantConverter` does (`packages/line-components/src/button/button.ts:37-40`).
- An unknown `live` behaves as `off` in the same way, through a converter that falls back to `off` (C8; D12).
- The docs tell authors to set `live` before the alert is inserted or before its text changes, because switching the role on over text already in place gives no reliable announcement (D12) [INFERENCE: probe P4 could not observe announcements].
- The host also takes `aria-label` and `aria-description` as plain attributes. They apply to the host directly, because a live role sits on the host (C5; D2). With `live="off"` they name a `generic` element, which ARIA prohibits. The component leaves them alone, and the docs tell authors to name only an alert whose `live` is `polite` or `assertive` (D13).

**Internals values** (D1, D2, D8)

| `live` | `internals.role` |
|---|---|
| `off`, missing or unknown | `null` |
| `polite` | `'status'` |
| `assertive` | `'alert'` |

- The component writes `role` through `this[INTERNALS]` (`packages/line-core/src/line-element.ts:31-36`) in its constructor and synchronously whenever the `live` attribute or property changes, so the role exists when the host is inserted (probe P4; D8). The `live` property therefore needs its own accessor that writes the role and then calls `requestUpdate()`, because Lit's generated accessor runs no component code before the next update.
- The component writes no `role` or `aria-*` attribute and no other internals ARIA value. An author `role` or `aria-live` on the host overrides the default (probe P3).

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

Alert dispatches no event (D5). It holds no value and commits nothing, so C3 and C9 add nothing.

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-alert-bg` | `var(--line-gray-bg)` | `root` |
| `--line-alert-color` | `var(--line-gray-text)` | `root` |
| `--line-alert-border-color` | `var(--line-gray-border)` | `root` |
| `--line-alert-icon-color` | `var(--line-gray-text-low)` | `icon` |
| `--line-alert-border-width` | `var(--line-border-1)` | `root` |
| `--line-alert-radius` | `var(--line-radius-2)` | `root` |
| `--line-alert-padding` | `var(--line-size-3)` | `root` |
| `--line-alert-gap` | `var(--line-size-2)` | `root` (row gap), `icon` (inline-end margin), `content`, `actions` |

The tokens and their defaults follow D3 and D9.

**Variant defaults** (C6; ARCH `:1571`)

| `variant` | `--line-alert-bg` | `--line-alert-color` | `--line-alert-border-color` | `--line-alert-icon-color` |
|---|---|---|---|---|
| `neutral`, missing or unknown | `var(--line-gray-bg)` | `var(--line-gray-text)` | `var(--line-gray-border)` | `var(--line-gray-text-low)` |
| `info` | `var(--line-info-bg)` | `var(--line-info-text)` | `var(--line-info-border)` | `var(--line-info-text-low)` |
| `success` | `var(--line-success-bg)` | `var(--line-success-text)` | `var(--line-success-border)` | `var(--line-success-text-low)` |
| `warning` | `var(--line-warning-bg)` | `var(--line-warning-text)` | `var(--line-warning-border)` | `var(--line-warning-text-low)` |
| `danger` | `var(--line-danger-bg)` | `var(--line-danger-text)` | `var(--line-danger-border)` | `var(--line-danger-text-low)` |

- The aliases are the PRD §9 Radix steps: `-bg` step 3, `-border` step 7, `-text-low` step 11, `-text` step 12 (ARCH §4, `docs/ARCHITECTURE.md:238`; `packages/line-themes/src/aliases.css:21-28`, `:65`).
- The `root` border stays when the background is dropped. In forced-colors mode the UA replaces the background with `Canvas` and keeps a border in the text colour, so the box stays visible (CSS Color Adjust 1 §3.1; `0011-separator.md` Drawing) [INFERENCE: not probed for Alert].
- The rules set border longhands, not the shorthand, so an invalid `var()` cannot reset `border-style` to `none` (`0011-separator.md` Drawing).
- The tokens carry no fallbacks (D9). Without `line-themes` the colour tokens are invalid at computed-value time, so `root` has a transparent background, its border takes `currentColor`, the initial value of `border-color`, and the text inherits its colour, which stays readable (C8; AM-002).
- In forced-colors mode every variant draws in the same system colours, so the tone no longer shows. The tone therefore has to reach users in words too, which the docs and the descriptor descriptions ask for (D14; A11y).

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

Alert takes no focus and handles no key. Slotted buttons and links keep their own keys (D5).

### A11y

| Field | Value |
|-------|-------|
| Role | none with `live="off"` (the default); `status` (`live="polite"`) or `alert` (`live="assertive"`) on the host as the `ElementInternals` default `internals.role` (D1, D2, D12) |
| ARIA attributes | none written by the component; `alert` and `status` carry their implicit `aria-live` (`assertive`, `polite`), `aria-atomic` (`true`) and `aria-relevant` (`additions text`) values (probe P1). An author `role` or `aria-live` on the host overrides the internals default (probe P3) |
| Accessible name | optional; `alert` and `status` take their name from the author only (probe P1). A host `aria-label` names a live host directly (C5). With `live="off"` the host is `generic`, which prohibits a name (R8 `:55`); the component leaves an author name alone, and the docs say to name only a live alert (D13) |
| Focus | none; the host is not focusable, does not delegate focus, and never moves focus (APG Alert, R8 `:68`) |

- **Tone beyond colour.** WCAG 2.1 SC 1.4.1 forbids colour as the only carrier of meaning, and forced-colors mode removes the variant colours. The docs ask authors to state the tone in the title or message, such as "Payment failed", or to name the icon with `aria-label`; the agent-facing and tool descriptions ask the same (D14). `<line-icon>` is decorative unless named (`0014-icon.md` D1).
- **Placement.** Phase 1 spec §10 SD31 puts interactive roles on inner native elements. Alert is not interactive, so D2 places the live role on the host through internals, as Separator and ButtonGroup do (`0011-separator.md` D1; `0004-button-group.md` D1).
- **Engine support.** `ElementInternals.role` ships in Chrome 103, Firefox 119 and Safari 16.4 (R8 `:106`). Probe P1 read the role back in all three engines.
- **Live regions inside a surface.** `<line-a2ui-surface>` keeps one polite live region and sets `aria-busy="true"` on itself while a batch settles (ARCH §17.4, `docs/ARCHITECTURE.md:1637`; `packages/line-genui/src/a2ui/surface.ts:43-47`, `:272`). An agent cannot set `live` (D7), so a surface-rendered Alert adds no second region. A consumer who writes `live` on an Alert inside a surface by hand adds one, and ARIA lets assistive technology ignore changes under `aria-busy` until it clears (R8 `:78`).

**What axe proves here (R8 §2.4)**

- The axe gate runs axe-core 4.14.0 through `@axe-core/playwright` 4.14.0 (`bun.lock:238`, `:1018`) on the §7.4 ruleset.
- axe 4.14.0 cannot see an internals role (probe P3; `0011-separator.md` A11y). It sees a role-less custom element in every case, so zero violations prove that the host, its slotted content and the page break no §7.4 rule. They prove nothing about the live role, its properties or its name.
- A labelled live host passes `aria-prohibited-attr`, because axe exempts a custom element with no explicit role (`0011-separator.md` A11y, `axe.js:32335-32336`; probe P3).
- Playwright `ariaSnapshot()` reads only the `role` attribute and shows no internals role (`0004-button-group.md` probe P6).

**Accessibility tree** (Phase 1 spec §6.C.4 notes, `:1180`; §10 SD39; §12 AM-058)

- **Chromium accessibility tree, automated.** A Browser-tier test opens a CDP session and reads `Accessibility.getPartialAXTree` or `getFullAXTree` for each host. It asserts the following.
  - A host with `live="off"`, or with no `live` attribute, is not an `alert` or `status` node and carries no `live` property.
  - `live="assertive"` gives `alert` with `live` `assertive`, `atomic` `true` and `relevant` `additions text`.
  - `live="polite"` gives `status` with `live` `polite`, `atomic` `true` and `relevant` `additions text`.
  - The slotted icon, title, message and actions are descendants of that node.
  - `aria-label="Payment error"` on a live host gives the name "Payment error".
  - An author `role="none"` or `aria-live="off"` on a live host removes the live properties.
- **Firefox and WebKit.** The Browser tier reads the internals `role` back in all three engines through the `INTERNALS` symbol the fixture re-exports, as Separator does (`0011-separator.md` A11y), including a read synchronously after `append()` and after a property set (D8).
- A manual screen-reader pass is not required (Phase 1 spec `:1180`).
- Firefox and WebKit exposure to assistive technology stays unverified by any check above, and so does whether any engine or screen reader announces the region. The gap is recorded here (Phase 1 spec `:1180`; §12 AM-058; probe "What automation cannot observe").

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `variant` and `live` are string enums (D1, D3) |
| C2 | Slots carry `@slot` and a single or multiple classification | `icon` and `title` are `ComponentId`; the default slot and `actions` are `ChildList` (Slots; D4) |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | no events (D5) |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated |
| C5 | The host accepts an accessible name and applies it to the element with the role | a live role sits on the host, so a host `aria-label` or `aria-description` applies directly and nothing is copied (D2) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | `variant` is reflected, its enum is closed, and it changes only the four colour tokens of the Variant defaults table (D3) |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries `@summary`, `@slot` for the four slots, `@csspart` for the six parts and `@cssprop` for the eight tokens; no `@fires`, because there are none; nothing is deprecated |
| C8 | Missing or partial props degrade to an empty or neutral state | with no attributes it is a `neutral` box with no live role (`live` `off`); an unknown `variant` behaves as `neutral` and an unknown `live` as `off`; an empty zone renders no box, and an alert with every slot empty keeps its padded box (D11, D12) |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound; Alert holds no interactive element of its own (D5) |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `Alert` |
| Tag | `line-alert` |
| `load()` subpath | `@websublime/line-components/alert` |
| Prop schema | `variant` (literal enum), `icon` (`ComponentId`), `title` (`ComponentId`), `children` (`ChildList`), `actions` (`ChildList`), plus `accessibility` from the `ComponentCommon` mixin, which every node may carry and the surface does not apply here (Phase 1 spec §6.G.1, AM-067; `hostNaming` below). `live` stays out of the agent schema (D7) |
| Slot map | `icon` → `icon`, `title` → `title`, `children` → default slot (`''`), `actions` → `actions` |
| Binding map | `variant` → attribute; no value prop; no commit event |
| Action map | none |
| Accessibility requirements | `{ hostNaming: { kind: 'never' } }` with no `requiredName`, as Icon's descriptor (`packages/line-genui/src/catalog/descriptors/icon.ts`). The agent path sets no live role, so the host is `generic` and a name would be prohibited (A11y; R8 `:55`; D7). With `never`, the frontend tool carries no `accessibilityLabel` or `accessibilityDescription` parameter (`packages/line-genui/src/catalog/tools.ts:140-149`) |
| Agent-facing description | An inline message box that tells the user about the state of something on the page, such as a saved change, a warning or an error. Put the message in `children`, an optional short heading in `title`, an optional Icon in `icon`, and optional Buttons for follow-up actions in `actions`. `variant` sets the tone and colour: `info` for helpful context, `success` for a completed action, `warning` for something that needs attention, `danger` for an error, or `neutral` (default). Also state the tone in words, such as a `title` "Payment failed", because colour alone does not reach every user. It stays on the page until the app removes it and never closes itself. Use it for messages that belong in the page, not for questions that need an answer. |
| Tool description | An inline message box that tells the user about the state of something on the page, such as a saved change, a warning or an error. The app places the message, an optional heading, an optional icon and any action buttons inside it, and that text should state the tone in words, such as "Payment failed", because colour alone does not reach every user. `variant` sets the tone and colour: `info` for helpful context, `success` for a completed action, `warning` for something that needs attention, `danger` for an error, or `neutral` (default). It stays on the page until the app removes it and never closes itself. Use it for messages that belong in the page, not for questions that need an answer. |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C7 row) |

- The agent-facing description names the `ComponentId` and `ChildList` props `children`, `title`, `icon` and `actions`, which the frontend tool leaves out (`packages/line-genui/src/catalog/tools.ts:98`). The descriptor therefore sets the tool description, which names none of them (Phase 1 spec §6.G.1, §6.G.3, AM-086). The agent-facing description is 744 characters and the tool description 696, both under the 1024 cap. Each carries the D14 sentence asking for the tone in words.
- The frontend tool carries no message text, as Button's tool carries no label (`packages/line-genui/src/catalog/descriptors/button.ts:9-12`). The app supplies the content.
- No A2UI v0.9 `basic` type maps to Alert. The basic catalog holds `AudioPlayer`, `Button`, `Card`, `CheckBox`, `ChoicePicker`, `Column`, `DateTimeInput`, `Divider`, `Icon`, `Image`, `List`, `Modal`, `Row`, `Slider`, `Tabs`, `Text`, `TextField` and `Video` (`node_modules/.bun/@a2ui+web_core@0.14.0/node_modules/@a2ui/web_core/src/v0_9/schemas/catalogs/basic/catalog.json`, `components`; the v1_0 file lists the same 18). ARCH §17.3 maps `Card` to `<line-card>` in Phase 5 (`docs/ARCHITECTURE.md:1619`), so the `basic` map is unchanged (D6).
- C7 ships its descriptor in the same PR and adds Alert to the `<line-a2ui-surface>` render fixture and the surface axe test (Phase 1 spec §6.C.0 step 5, `:922`; §6.C.6).

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/alert` |
| Kind | `independent` (ARCH §12, `docs/ARCHITECTURE.md:576`; Phase 1 spec §4.2, `:295`) |
| Registers | `line-alert` |
| Reset modules | `commonReset` (ARCH §14.7, `docs/ARCHITECTURE.md:1157`; D5) |

- Files: `src/alert/alert.ts` (class and `customElements.define`), `src/alert/alert.types.ts`, `src/alert/index.ts`.
- `package.json` gains the `./alert` export, and the Vite build gains the `alert/index` entry (`packages/line-components/vite.config.mjs`).
- Alert imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6).
- Stories import `@websublime/line-tokens/sizing`, `./radii` and `./border-width`, which already have ambient declarations (`apps/storybook/types/line-css.d.ts:7`, `:10-11`).

### Markup examples

```html
<!-- Default: neutral, live off, read in page order -->
<line-alert>
  Billing moves to the new dashboard on 1 December.
</line-alert>

<!-- Each variant; the text states the tone too (D14) -->
<line-alert variant="info">Drafts are saved every minute.</line-alert>
<line-alert variant="success">Your changes were saved.</line-alert>
<line-alert variant="warning">Your trial ends in 3 days.</line-alert>
<line-alert variant="danger">Error: the payment could not be processed.</line-alert>

<!-- Every slot -->
<line-alert variant="danger">
  <line-icon slot="icon" library="lucide" name="circle-alert"></line-icon>
  <h3 slot="title">Payment failed</h3>
  <p>Check the card number and try again.</p>
  <line-button slot="actions" variant="primary">Retry</line-button>
  <line-button slot="actions" variant="borderless">Use another card</line-button>
</line-alert>

<!-- Inserted after an action and announced: assertive (alert) or polite (status); `live` is set before insertion (D12) -->
<line-alert variant="danger" live="assertive">The form has 2 errors.</line-alert>
<line-alert variant="success" live="polite" aria-label="Upload">All 12 files uploaded.</line-alert>

<!-- Dismiss recipe (story "Dismiss recipe", D5, D16): the consumer removes the alert and moves focus to a named target -->
<h2 id="notices" tabindex="-1">Notices</h2>
<line-alert id="features" variant="info">
  New features are available.
  <line-icon-button slot="actions" aria-label="Dismiss notice">
    <line-icon library="lucide" name="x"></line-icon>
  </line-icon-button>
</line-alert>
<script type="module">
  const notice = document.getElementById('features');
  notice.querySelector('[slot="actions"]').addEventListener('click', () => {
    notice.remove();
    document.getElementById('notices').focus();
  });
</script>

<!-- Tokens and parts -->
<style>
  line-alert.compact {
    --line-alert-padding: var(--line-size-2);
    --line-alert-radius: var(--line-radius-1);
  }
  line-alert::part(title) {
    font-weight: 600;
  }
</style>
<line-alert class="compact" variant="warning">Low disk space.</line-alert>
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom | prop defaults and reflection; no attribute for a default; the `variant` converter falling back to `neutral` and the `live` converter falling back to `off`, each while the attribute keeps the author's value; `live` mapping to the internals `role` for every row of the internals table, including a return to `off` and a removed attribute; the role present after construction and synchronously after an attribute change and after a property set (D8); no `role`, `aria-*` or `data-*` attribute written; author `role`, `aria-live` and `aria-label` left unchanged, including on a host with `live="off"` (D13); the shadow anatomy, slot names and part names; each wrapper `hidden` while its slot is empty or holds only whitespace, and shown after content arrives or leaves through `slotchange` and at first update (D11); the `description` wrapper following an in-place `Text` data change from `''` to text and back, and the observer disconnected while the host is out of the document (AM-001); an alert with every slot empty keeping `root` unhidden (D11); `packages/line-components/__tests__/manifest-paths.test.ts` on the packed tarball (Phase 1 spec §6.C.6) |
| Browser | Playwright `*.e2e.ts` on chromium, firefox and webkit | computed colour tokens per variant on a page with `line-themes` and a palette; `root` border longhands; the D15 layout with every slot filled (icon at the block start of row 1, actions in a wrapping row below the message in the content column) and with each zone empty, leaving no track gap, also under `dir="rtl"`; an alert with every slot empty keeping its padded box; the `description` wrapper shown after an in-place `Text` data change from `''` to text and hidden after a change back to `''`, with no `slotchange` in between in chromium and firefox and one per change in webkit (AM-001, AM-003); consumer CSS on `line-alert` and `::part()` beating the `:host` rules; `<line-alert hidden>` rendering nothing; slotted `<button>` keeping its own focus and Enter/Space activation while the host takes no focus; the Dismiss recipe removing the alert and leaving focus on the named target; internals `role` read back through `INTERNALS`, also synchronously after `append()`; in chromium only, the `root` border visible under `page.emulateMedia({ forcedColors: 'active' })`; on a page without `line-themes`, a transparent `root` background, a `currentColor` border and inherited text colour (AM-002) |
| Accessibility tree | Playwright CDP session in the Browser tier (chromium) | the Chromium accessibility-tree assertions in the A11y section; the result recorded there before merge (Phase 1 spec §10 SD39, §12 AM-058) |
| A11y | axe-core | zero violations (MANIFESTO Law 3) in every story of the D16 list below |
| htmx | n/a | `n/a`. Alert is neither value-bearing nor compound (ARCH §17.2 C9; D5, D10), so the harness has nothing to submit or trigger (Phase 1 spec §10 SD34). An alert swapped in by htmx is a plain insertion, which the Browser tier's insertion read-back and the Chromium tree cover |
| Visual | Playwright `alert.visual.ts` on the `visual` project | every Alert story, with Linux baselines from a `visual-baselines.yml` run (Phase 1 spec §6.C.6, §10 SD98) |

- No update-rate row, because Alert is not a machine row (Phase 1 spec §6.C.6).
- The axe and visual tests run against the Storybook stories on port 4320 (Phase 1 spec §6.P.7, §6.P.11).
- Storybook stories (D16): Default (`neutral`), Info, Success, Warning, Danger, All slots, Live assertive, Live polite, Dismiss recipe and Custom tokens. Each variant story states its tone in text (D14). The Dismiss recipe runs the Markup examples script, removing the alert on click and moving focus to the named heading.
- The Storybook docs page states the D12 timing rule for `live`, the D13 rule to name only a live alert, and the D14 rule to state the tone in words.
- The layout, internals and CDP tests use fixture pages under `packages/line-components/__tests__/integration/alert/`, served by the existing port-4321 entry (`playwright.config.ts:21-26`). The fixture re-exports `INTERNALS`, as Separator's does (`packages/line-components/__tests__/integration/separator/fixture.ts`).
- `line-colors` is not a `line-components` dependency, so the variant colour test sets the palette steps it reads on `html`, as Separator AM-001 does (`0011-separator.md` AM-001).
- The surface render fixture and the surface axe test gain an `Alert` node (Phase 1 spec §6.C.6).

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| D1 | Which live role does Alert carry by default, and how does a consumer change it? | Miguel | resolved: option (c), no live role by default; the `live` attribute opts in, `polite` → `status`, `assertive` → `alert` (Miguel, 2026-11-09) |
| D2 | Where does the live role sit: on the host through `ElementInternals`, or on an inner shadow element? | Miguel | resolved: option (a), on the host through `ElementInternals`; author attributes on the host win (Miguel, 2026-11-09) |
| D3 | What is the variant attribute called, and which values does it take? | Miguel | resolved: option (a), `variant` with `neutral \| info \| success \| warning \| danger`, default `neutral` (Miguel, 2026-11-09) |
| D4 | Which slots and parts make up the anatomy, and is the title a slot or an attribute? | Miguel | resolved: option (a), slots `icon`, `title`, default and `actions`; parts `root`, `icon`, `content`, `title`, `description` and `actions`; ARCH v0.8.24 §5 adds `actions` (Miguel, 2026-11-09) |
| D5 | Does Alert ship its own dismiss control? | Miguel | resolved: option (a), no; the consumer composes a dismiss button in `actions` (Miguel, 2026-11-09) |
| D6 | Which catalogs carry Alert? | Miguel | resolved: option (a), the `line` catalog only, with `icon`, `title`, `children` and `actions` as child props; the `basic` map is unchanged (Miguel, 2026-11-09) |
| D7 | Can an agent give an Alert a live role on `<line-a2ui-surface>`? | Miguel | resolved: option (a), no; `live` stays out of the agent schema and `hostNaming` is `never` (Miguel, 2026-11-09) |
| D8 | When does the component write the internals role? | orchestrator | resolved: option (b), in the constructor and synchronously on every `live` change (orchestrator default, Miguel raised no objection, 2026-11-09) |
| D9 | Which `--line-alert-*` tokens exist, with which defaults? | orchestrator | resolved: option (a), the eight tokens of the CSS custom properties table, colours over the `-bg`, `-text`, `-border` and `-text-low` role aliases, no fallbacks (orchestrator default, Miguel raised no objection, 2026-11-09) |
| D10 | What are the htmx row, `agentExposed` and catalog name? | orchestrator | resolved: htmx `n/a`, `agentExposed: true`, catalog name `Alert` (orchestrator default, Miguel raised no objection, 2026-11-09) |
| D11 | How does an empty zone render no box, and what does an alert with no content render? (gap left by D4) | Miguel | resolved: option (a) with sub-choice (i), a private per-slot state from `slotchange` and `firstUpdated` sets `hidden` on an empty wrapper, and an alert with no content keeps its padded box (C8) (Miguel, 2026-11-09). Amended by AM-001: a `MutationObserver` also re-reads the default slot when its text changes in place |
| D12 | Which values does `live` take, and is there an explicit default? (gap left by D1) | Miguel | resolved: option (b), `live` is `off \| polite \| assertive`, default `off` (Miguel, 2026-11-09) |
| D13 | What happens when a host without `live` carries `aria-label` or `aria-description`? (gap left by D1, D2) | Miguel | resolved: option (a), documented only (Miguel, 2026-11-09) |
| D14 | How does the tone reach a user who cannot see the colour? (gap left by D3, D9) | Miguel | resolved: option (a), the docs, the agent-facing description and the tool description ask for the tone in text or a named icon (Miguel, 2026-11-09) |
| D15 | Where do the actions sit, and how do the zones align? (gap left by D4) | Miguel | resolved: option (b), actions in a wrapping row below the message in the content column, icon aligned to the block start (Miguel, 2026-11-09) |
| D16 | Which Storybook stories ship, and does one show the consumer dismiss recipe? (gap left by D5) | Miguel | resolved: option (a), the ten stories, including the Dismiss recipe that removes the alert and moves focus to a named target (Miguel, 2026-11-09) |

Miguel decided D1–D7 on 2026-11-09, each on the option the draft recommended, and raised no objection to the orchestrator defaults D8–D10 the same day. D11–D16 came from a final implementer's pass over Part B after those decisions; Miguel decided them on 2026-11-09, each on the recommended option. The option tables below stay as the record of what he weighed.

### D1 — Default live role

Evidence:

- APG Alert says screen readers "do not inform users of alerts that are present on the page before page load completes" and that alerts must not affect keyboard focus (R8 `:68`, `:88-89`; https://www.w3.org/WAI/ARIA/apg/patterns/alert/, read 2026-11-09).
- The PRD calls Alert "Inline persistent feedback" (`docs/PRD.md:248`). R8 Q8 lists three options: always `alert`, a variant that switches to `status`, or no live role for static content (`:341-342`).
- Probe P4 shows Chromium exposes a host present at load exactly like an inserted one; neither CDP nor axe shows an announcement. In a client-rendered app every alert is inserted after load [INFERENCE], so an always-live `alert` speaks on every route change and re-render.
- Probe P1 shows `alert` and `status` both expose their implicit live values on a slotting host, and probe P3 shows an author `role` or `aria-live` overrides any internals default.
- C6 lets a variant change only the defaults of the component's own tokens and add no other rule (ARCH `:1571`), so a role tied to `variant` goes beyond C6.
- Precedents: Fluent `<fluent-message-bar>` sets `elementInternals.role = 'status'` always; Spectrum `<sp-alert-banner>` renders `role="alert"` on a shadow element always; Web Awesome `<wa-callout>` sets no role (competitive analysis footnote `[^4.1-alert]`). GOV.UK's notification banner uses `role="region"` with `aria-labelledby` for standing notices and `role="alert"` only for the outcome of something the user just did (https://design-system.service.gov.uk/components/notification-banner/, read 2026-11-09).
- `<line-a2ui-surface>` already keeps one polite live region per surface (ARCH `:1637`; D7).
- `Element.ariaNotify()` is outside "latest 2 stable" because Safari 26 lacks it (R8 `:94-95`), so it is not an option here.

| Option | What it decides | Tradeoff |
|---|---|---|
| (a) Always `alert` | internals `role = 'alert'` on every host | Matches the component's name and APG's pattern. Every inserted or re-rendered alert interrupts assertively, including standing notices and success messages; alerts present at load are silent anyway (APG), so the role adds noise where it speaks and nothing where it does not |
| (b) Always live; an attribute picks the role | `role = 'status'` by default, `alert` with an attribute such as `live="assertive"` | Polite by default, as Fluent. Every alert stays a live region, so standing notices still speak on insertion, and the announcement of a `status` inserted with its content already in place varies by screen reader [INFERENCE: not probed] |
| (b′) Role tied to `variant` | `danger` and `warning` → `alert`; `info`, `success`, `neutral` → `status` | No extra attribute. Breaks C6 (a variant changes tokens only), and couples tone to urgency: a standing `danger` notice would interrupt, and an urgent `success` could not |
| (c) **Chosen** (Miguel, 2026-11-09). No live role by default; opt-in attribute | a `live` attribute: unset → no role; `polite` → `status`; `assertive` → `alert` | Fits "persistent" and APG's at-load note: standing notices are plain content, and the consumer opts in for an alert inserted or changed after an action. A default alert carries no semantics beyond its content, and a name on it is prohibited (`generic`, R8 `:55`), which the docs must say. The attribute reuses the `aria-live` vocabulary; an author `aria-live` or `role` on the host still overrides (P3) |
| (d) No live role and no attribute | the author writes `role="alert"` or `role="status"` on the host | Zero API; P2 shows a host `role` attribute exposes the same region, and axe can see it. Not typed in the CEM, not reachable by an agent, and the docs carry the whole rule |

### D2 — Role placement

Evidence: probe P1 and P2 (all placements give the same live region over the slotted text in Chromium); probe P2 (an inner role plus a host `aria-label` leaves a named `generic` host and an unnamed region); probe P3 (author attributes on the host win over an internals default; axe sees none of the variants' roles). C5 applies the name to "the element that carries the role, which is either the host itself or the inner focusable element" (ARCH `:1570`). Separator and ButtonGroup chose host internals (`0011-separator.md` D1; `0004-button-group.md` D1); Fluent `<fluent-message-bar>` sets its role through `elementInternals`; Spectrum `<sp-alert-banner>` puts `role="alert"` on a shadow `<div class="body">` (`[^4.1-alert]`).

| Option | Placement | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-09). Host internals | `this[INTERNALS].role` on the host (D1 values) | The host is the region; a host `aria-label` names it (P1); author `role` and `aria-live` win (P3); matches Separator, ButtonGroup and C5 "the host itself". Needs the Chromium CDP assertion and the three-engine read-back; axe and `ariaSnapshot()` cannot see it |
| (b) Inner shadow element | `role` on `<div part="root">` | Same Chromium region (P2). A host `aria-label` names a `generic` host instead (P2), so the name must be copied to the inner element, and the inner element is neither element C5 names. The author cannot override the role from the host, because a host `role` would add a second region around the first [INFERENCE: not probed] |
| (c) Host `role` attribute written by the component | the component sets `role="alert"` or `role="status"` on itself | axe and `ariaSnapshot()` see it (R8 `:202`). The component writes an attribute the author owns, so it must not overwrite an author `role` and has to track removal (R8 §2.5, `:245`) |

### D3 — Variant attribute and values

Evidence: Button's tone attribute is `variant` (`packages/line-components/src/button/button.ts:95`; ARCH §4 example, `docs/ARCHITECTURE.md:250`). The line://ui semantic roles are `success`, `warning`, `danger` and `info` (PRD `SEMANTIC_MAP`, `docs/PRD.md:1329-1334`), with role aliases such as `--line-danger-bg` (`packages/line-themes/src/aliases.css`). C6 limits a variant to the defaults of `--line-alert-*` tokens (ARCH `:1571`). Precedents: Web Awesome `variant` `brand | neutral | success | warning | danger`; Fluent `intent` `success | warning | error | info`; Spectrum `variant` `neutral | info | negative` (`[^4.1-alert]`). Button's default value is `default` (`button.types.ts`).

| Option | What it decides | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-09). `variant`: `neutral \| info \| success \| warning \| danger`, default `neutral` | five values, each mapped to a role (`neutral` → `gray`) | Same attribute name as Button; values read the same as the theme roles, so one name runs from markup to token; agents meet one vocabulary. `danger` is less familiar than `error` for an error message, which the agent-facing description explains. `neutral` differs from Button's `default` |
| (b) `variant`: `info \| success \| warning \| error`, default `info` | four values, no neutral | Matches Fluent. `error` maps to the `danger` role, so names diverge between attribute and token; no tone for a message without one |
| (c) `variant` with `default` in place of `neutral` | as (a), default named `default` | Matches Button's default name. `default` names the absence of a choice, not a tone |
| (d) Another attribute name, such as `intent` or `tone` | as (a), under a new name | Avoids reading tone as emphasis. Two attribute names for the same C6 idea across the library |

### D4 — Anatomy

Evidence: ARCH §3 makes consumer-controlled zones slots (`docs/ARCHITECTURE.md:214-221`); MANIFESTO Law 4 says "slots over props for content" (`docs/MANIFESTO.md:45`); Law 1 wants a part on every styleable zone. Before v0.8.24, ARCH §5 listed `root`, `content`, `title`, `description` and `icon`, and no `actions` (`:301-321`); `svg`, `overflow` and `loading` joined that list with their components (Phase 1 spec). Fluent slots `icon`, default, `actions` and `dismiss`; Spectrum slots default and `action`; Web Awesome slots default and `icon` with parts `icon` and `message` (`[^4.1-alert]`). An `aria-labelledby` from a shadow element cannot reach a light-DOM title by id (R8 `:130-137`); `alert` and `status` need no name (probe P1). The surface wires a child prop into a named slot by setting `slot` (`packages/line-genui/src/a2ui/projection.ts:468-473`).

| Option | Anatomy | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-09). Four slots, each zone wrapped in a part | slots `icon`, `title`, default, `actions`; parts `root`, `icon`, `content`, `title`, `description`, `actions` | Every zone is styleable (Law 1); the consumer picks the heading element and level. Adds `actions` to the ARCH §5 vocabulary, a higher-document change that needs Miguel's approval |
| (b) Four slots; only vocabulary parts | as (a), with the `actions` slot directly in `root` and no `actions` part | No ARCH change. The actions zone has no wrapper to style, so its layout comes from the `root` grid and `::slotted()` only, against Law 1 |
| (c) Title as an attribute | `title`-like attribute (for example `heading`) rendered as text in `<div part="title">`; slots `icon`, default, `actions` | The frontend tool could carry a heading string. Goes against "slots over props for content" (Law 4); the component would have to pick a heading level or none; `title` collides with the global HTML attribute |

### D5 — Dismiss

Evidence: MANIFESTO Out of Scope puts "Close" and "Dismiss" labels on the consumer (`docs/MANIFESTO.md:66`); Law 4 bars Alert from importing `<line-icon>`, so a built-in close glyph needs a slot or CSS. ARCH §14.7 maps Alert to `common` only (`:1157`), and ARCH §14.10 already lists `line-alert` for slotted button resets (`:1290`). A Static component has no machine (ARCH §8). APG: alerts must not move focus (R8 `:68`). Precedents: Spectrum renders an internal close button with `dismissible`, handles `Escape` and fires a cancelable `close`; Fluent has a `dismiss` slot and fires `dismiss` without hiding itself; Web Awesome has no dismiss (`[^4.1-alert]`).

| Option | What it decides | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-09). None | the consumer puts a dismiss button in `actions` and removes or hides the alert itself | No events, no keys, no strings, no reset change; ARCH §14.7 and §14.10 stand as written; C9 and the htmx row stay `n/a`. Every consumer writes the dismiss wiring and the focus move after removal |
| (b) Internal close part | `dismissible` attribute renders `<button part="close">` with a `close` slot for the glyph and a required `dismiss-label` attribute for its name; activation fires `line-dismiss` (bubbling, cancelable) and sets `hidden` unless prevented | One consistent dismiss. Adds the `button` reset (an ARCH §14.7 change), focus and Enter/Space on an inner native button, an event (C3, `@fires`), an action-map entry for agents, a required name the surface must check, and a focus target after the focused button disappears. The event is not a C9 commit event, because Alert stays neither value-bearing nor compound |
| (c) `dismiss` slot plus event | the consumer slots a button in `dismiss`; Alert listens for its `click` and fires `line-dismiss` | Keeps strings and glyphs with the consumer. Alert reacts to a slotted element's events without knowing what it is, and still owns the hide and focus questions of (b) |

### D6 — Catalogs

Evidence: the A2UI v0.9 `basic` catalog has 18 types and none is an alert (`node_modules/.bun/@a2ui+web_core@0.14.0/node_modules/@a2ui/web_core/src/v0_9/schemas/catalogs/basic/catalog.json`; the v1_0 catalog lists the same 18). The closest, `Card`, maps to `<line-card>` in Phase 5 (ARCH `:1619`). `packages/line-genui/src/catalog/basic.ts` maps 10 of the 18 in Phase 1. The frontend tool leaves out `ComponentId` and `ChildList` props (`tools.ts:98`).

| Option | What it decides | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-09). `line` catalog only | `Alert` with `variant`, `icon`, `title`, `children`, `actions` and `accessibility`; the `basic` map is unchanged | Matches ButtonGroup D10. Agents that know only the basic catalog cannot render an Alert. The frontend tool carries no content, as Button's |
| (b) `line` catalog plus a `basic` route | for example basic `Card` with a marker renders `<line-alert>` | No basic type means "alert"; a route would invent semantics A2UI does not define and collide with the Phase 5 `Card` row |
| (c) `line` catalog with string content props | as (a), plus `DynamicString` props for the title and message rendered as text | The frontend tool could carry a message. Goes against Law 4 and needs the component to render text from attributes (D4 (c)) |

### D7 — Live role on the agent path

Evidence: ARCH §17.4 gives each surface one polite live region and sets `aria-busy` during batches (`docs/ARCHITECTURE.md:1637`; `surface.ts:43-47`, `:272`). ARIA lets assistive technology ignore changes under `aria-busy` until it clears (R8 `:78`). A host without a live role is `generic`, so `hostNaming` must not set a name on it (R8 `:55`; `packages/line-genui/src/catalog/descriptor.ts:142-146`). This question applies when D1 is (b), (c) or (d).

| Option | What it decides | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-09). No | `live` stays out of the agent prop schema; `hostNaming` is `never` (under D1 (c)) | Keeps one live region per surface, so an agent cannot stack announcements on top of "Content updated.". An agent cannot make an urgent error interrupt |
| (b) Yes | `live` joins the prop schema as a literal enum; `hostNaming` `unlessTrue`-style on a live value (a new `HostNaming` kind) | Agents can raise urgent errors. Two live regions speak for one batch, and a new `HostNaming` kind changes the Phase 1 descriptor contract |

### D8 — When the role is written

Evidence: probe P4 (a `willUpdate` write leaves the host role-less from `append()` until the next microtask, in all three engines; a constructor plus `attributeChangedCallback` write does not). Separator writes in `willUpdate` (`separator.ts:76-83`). MANIFESTO Law 5 keeps DOM mutation in Lit's reactive cycle; the internals role is not a DOM mutation [INFERENCE]. Whether any engine fires its alert event in the role-less window is not observable (probe).

| Option | Timing | Tradeoff |
|---|---|---|
| (a) `willUpdate` | the Separator pattern | One pattern across components. A one-microtask window in which an inserted alert has no role |
| (b) **Chosen** (orchestrator default, Miguel raised no objection, 2026-11-09). Constructor and synchronous on change | `role` set in the constructor from the default and again in the `live` property setter or `attributeChangedCallback` | The role exists at insertion, including `innerHTML` and `createElement` + `setAttribute` + `append()` (P4). A second pattern beside Separator's |

### D9 — Tokens

Evidence: C6 and PRD v0.8.28 let a variant set the defaults of its component's tokens (ARCH `:1571`; `docs/PRD.md:15`); Button's default tokens use the `gray` role aliases (`button.ts:117`). Separator draws with border longhands for forced colors (`0011-separator.md` Drawing). Radix step semantics put backgrounds at step 3, borders at step 7 and text at steps 11 and 12 (ARCH `:238`). Contrast of steps 11 and 12 over step 3 is not measured here [INFERENCE: the Radix steps are designed for it].

| Option | What it decides | Tradeoff |
|---|---|---|
| (a) **Chosen** (orchestrator default, Miguel raised no objection, 2026-11-09). Eight tokens over role aliases, no fallbacks | the CSS custom properties table and the variant defaults table | Readable with no theme (inherited text colour); a border keeps the box in forced colors. Without `line-themes` the box has no background or border colour |
| (b) As (a) with fallbacks | for example `var(--line-gray-bg, transparent)`, `var(--line-gray-border, currentColor)` | The border shows without the theme, as Separator's line does. Hard-coded fallbacks that only matter with no theme loaded |
| (c) Surface step 2 backgrounds | `--line-{role}-surface` in place of `-bg` | A lighter box. Less contrast between the alert and a step 1 or 2 page |

### D10 — htmx row, `agentExposed` and catalog name

The Phase 1 spec expects htmx `n/a` (§6.C.4 C7 row; §10 SD34). Alert is neither value-bearing nor compound under every D5 option, because it holds at most one interactive element of its own and commits no result (ARCH §17.2 C9). `agentExposed` is `true` (C7 row), and the catalog name `Alert` matches the PRD row.

### D11 — Empty zones and an empty alert

Evidence: D4 wraps each slot in a part, so an empty `icon`, `title` or `actions` wrapper would still take a grid track and a gap. ButtonGroup reads its slot in `slotchange` and again in `firstUpdated`, because happy-dom delivers the first `slotchange` before the listener exists (`packages/line-components/src/button-group/button-group.ts:263-266`, `:276`). Button leaves `prefix` and `suffix` unwrapped and renders its `loading` wrapper only while loading (`packages/line-components/src/button/button.ts:362-363`). A default slot always holds the whitespace text between tags, so "empty" needs a rule [INFERENCE: from the DOM, not probed]. ARCH §14.8 reflects machine state as `data-*` and `:state()`; slot content is not machine state. Support for `:has-slotted` in the three engines was not checked.

| Option | Mechanism | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-09). Internal state, `hidden` on the wrapper | a private Lit state per slot, set from `slotchange` and in `firstUpdated`; a slot counts as empty when its assigned nodes hold no element and no text other than whitespace; the wrapper renders `hidden` while empty | No public surface; works in happy-dom and all engines; the Unit tier can check it |
| (b) (a) plus host reflection | as (a), and the host also carries `data-has-icon`, `data-has-title`, `data-has-actions` and the matching `:state()` | Consumers can style on content, for example a wider gap when an icon is present. Adds public host attributes for content state, a new kind of reflection beside ARCH §14.8 |
| (c) CSS `:has-slotted` | `[part="icon"]:not(:has-slotted)`-style rules, no script | No state. Engine support unverified against "latest 2 stable"; the whitespace rule cannot be expressed |
| (d) Always render | every wrapper keeps its box | No code. An alert without an icon keeps an empty icon track and gap; every consumer collapses it through `::part()` |

Sub-choice for an alert with no content at all: (i) **Chosen** (Miguel, 2026-11-09). keep the padded box, the neutral C8 state, which shows the author that something is missing; (ii) render no box (`display: none` on `root`), so an empty agent node takes no space.

### D12 — `live` values and default

Evidence: ARIA `aria-live` takes `off`, `polite` and `assertive`. Separator and Stack use a closed enum with a named default and `useDefault: true`, so a default leaves no attribute and an unknown value falls back to it (`packages/line-components/src/separator/separator.ts:7-9`, `:26`; `0018-stack.md` AM-002). D1 named only `polite` and `assertive`. An `undefined` default shows in the CEM as no default. A live role switched on after the alert's text is already in place may not be announced [INFERENCE: probe P4 could not observe announcements].

| Option | Values | Tradeoff |
|---|---|---|
| (a) Two values, no default value | `polite \| assertive`; property `undefined`; unknown → no role | Matches the D1 wording literally. The property type carries `undefined`, and the CEM shows no default |
| (b) **Chosen** (Miguel, 2026-11-09). Three values, default `off` | `off \| polite \| assertive`, default `off`, reflected with `useDefault`; unknown → `off`, the attribute keeps the author's value | Same pattern as Separator and Stack; the full `aria-live` vocabulary, so `live="off"` reads as intended; the CEM and the docs show the default. One more value than D1 named |
| (c) Boolean plus urgency | `live` boolean (`status`) and `urgent` boolean (`alert`) | Reads as plain English. Two attributes, and `urgent` without `live` needs a rule |

Whatever the values, the docs say to set `live` before the alert is inserted or before its text changes, because switching the role on over existing text gives no reliable announcement [INFERENCE].

### D13 — Name on a host without a live role

Evidence: a host without `live` is `generic`, and ARIA prohibits a name on `generic` (R8 `:55`). axe 4.14.0 does not flag it on a custom element (probe P3; `0011-separator.md` A11y). Separator met the same case for `decorative` with a name and chose documentation over intervention (`0011-separator.md` Open Question 12). GOV.UK names a standing banner with `role="region"` and `aria-labelledby` (https://design-system.service.gov.uk/components/notification-banner/). A named `region` is a landmark, so every named alert would add one [INFERENCE: ARIA `region` semantics]. No component in `packages/*/src` logs a warning for author misuse; the only console call is the machine start failure in `packages/line-core/src/machine/line-machine-controller.ts:101`.

| Option | What it decides | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-09). Documented only | the component leaves author attributes alone; the docs and the A11y section say to name only a live alert | Matches Separator Open Question 12; no runtime cost. An author's `aria-label` on a standing alert is silently prohibited |
| (b) Development warning | as (a), plus a console warning in Lit dev mode when a host without `live` has `aria-label`, `aria-labelledby` or `aria-description` | Catches the mistake early. A new pattern in the library; Law 9 says components never throw, a warning does not throw |
| (c) Named role when labelled | a host without `live` but with a name gets `internals.role = 'region'` (or `group`) | The name becomes valid and navigable. The component watches author attributes, and every labelled alert becomes a landmark |

### D14 — Tone beyond colour

Evidence: WCAG 2.1 SC 1.4.1 (Use of Color) forbids colour as the only means of conveying information. In forced-colors mode every variant draws in the same system colours (CSS Color Adjust 1 §3.1) [INFERENCE: not probed for Alert]. `<line-icon>` is decorative unless named (`0014-icon.md` D1), so a slotted icon carries no tone to assistive technology on its own. MANIFESTO puts component strings on the consumer (`docs/MANIFESTO.md:66`), so Alert cannot add words such as "Error". C6 limits `variant` to token defaults (ARCH `:1571`).

| Option | What it decides | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-09). Content rule in docs and agent description | the docs say the title or message states the tone ("Error: …", "Payment failed"), or the icon is named; the agent-facing and tool descriptions add one sentence asking for the same | No API; meets 1.4.1 when followed. Depends on authors and agents |
| (b) Forced-colors distinction | a `@media (forced-colors: active)` rule per variant, for example a thicker border for `danger` | Keeps a visual difference in forced colors. Adds CSS beyond token defaults, against C6, and still conveys no meaning to assistive technology |
| (c) Visually hidden tone text | the component renders a hidden prefix per variant | Conveys the tone everywhere. Needs bundled strings, which MANIFESTO puts out of scope |

### D15 — Layout of the zones

Evidence: D4 makes `root` a grid of `icon`, `content` and `actions`. Fluent offers `layout="singleline \| multiline"` on `<fluent-message-bar>`; Spectrum puts its `action` slot at the inline end of the banner (`[^4.1-alert]`; https://opensource.adobe.com/spectrum-web-components/components/alert-banner/). An alert in a narrow container squeezes a message that shares its row with a third column [INFERENCE]. Consumers can change any grid through `::part(root)` (ARCH §4).

| Option | Placement | Tradeoff |
|---|---|---|
| (a) Actions in a third column | `icon \| content \| actions`, actions at the inline end, all zones aligned to the block start | Compact for one short message and one action. Narrow containers squeeze the message |
| (b) **Chosen** (Miguel, 2026-11-09). Actions below the message | `icon \| content` in the first row, `actions` in the second row of the content column; icon aligned to the block start; actions laid out as a wrapping row with `--line-alert-gap` | Works at any width; matches a title plus multi-line message. A single short action takes a row of its own; a consumer who wants (a) sets the grid columns and placement on `::part(root)` and `::part(actions)` |
| (c) A `layout` attribute | (a) and (b) both, chosen by `layout="inline \| stacked"` | Covers both cases. A new public attribute with no agent or PRD need yet |

### D16 — Storybook stories and the dismiss recipe

Evidence: Separator ships one story per meaningful prop case (`apps/storybook/stories/components/separator.stories.ts:46-79`). The axe and visual tiers run over every story (Phase 1 spec §6.C.6, §6.P.7, §6.P.11). D5 leaves the dismiss wiring and the focus move after removal to the consumer, and a focused button that disappears drops focus to `body` (`0004-button-group.md` probe P5). APG Alert gives no rule for where focus goes after a dismiss [INFERENCE: not stated on the APG page].

| Option | Stories | Tradeoff |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-09). Per-variant stories plus a dismiss recipe | Default (`neutral`), Info, Success, Warning, Danger, All slots, Live assertive, Live polite, Dismiss recipe and Custom tokens; the Dismiss recipe's script removes the alert on click and moves focus to a target it names, such as the section heading with `tabindex="-1"` | Every variant gets its own axe and visual baseline; the docs show the one piece of behaviour D5 hands to the consumer. Ten stories and ten baselines |
| (b) One Variants story | Default, Variants (all five), All slots, Live, Custom tokens | Fewer baselines. One axe run covers five variants, and a failing variant is harder to spot |
| (c) (a) without the Dismiss recipe | as (a), the dismiss shown as markup only (Markup examples) | No script in stories. Leaves the focus move to every consumer to work out |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
| AM-001 | 2026-11-09 | ledger 01-C7 (decision — Miguel, 2026-11-09) | Part B Anatomy, the D11 bullet: a `MutationObserver` on the host (`characterData: true`, `subtree: true`) re-reads the default slot's empty state when text changes in place. It connects in `connectedCallback` and disconnects in `disconnectedCallback`. The named slots stay on `slotchange` and `firstUpdated`, because only elements reach them and any element counts as content. Tests, the Unit and Browser rows: the in-place cases `''` → text and text → `''`, and the observer's disconnection. Open Questions, the D11 resolution notes this row | `slotchange` fires only when a slot's assigned nodes change, not when an assigned `Text` node's data changes in place. lit-html rewrites `Text.data` for a primitive child, as in `<line-alert>${message}</line-alert>`, and React rewrites `nodeValue`. A message that starts as `''` therefore left the `description` wrapper `hidden`, so the message never rendered, and a message cleared in place left an empty zone. Rejected: (a) documenting "replace the nodes, do not change text in place" with no code, which leaves the framework case broken; (c) never hiding the `description` wrapper, which keeps an empty message zone and its gap in an alert that has only a title or only actions | DOM Standard §4.2.2.4: "assign slottables" signals a slot change only when the slot's assigned nodes change; §4.10: "replace data" queues a `characterData` mutation record and signals no slot change (https://dom.spec.whatwg.org/, read 2026-11-09). lit-html 3.3.3 `ChildPart._commitText` sets `node.data` when the committed value is a primitive (`node_modules/.bun/lit-html@3.3.3/node_modules/lit-html/development/lit-html.js:948-968`); React DOM 19.2.6 `commitTextUpdate` sets `textInstance.nodeValue` (`node_modules/.bun/react-dom@19.2.6+d86b59289c1a13ae/node_modules/react-dom/cjs/react-dom-client.development.js:22174-22175`). happy-dom 20.14.6 probe (2026-11-09, deleted after the run): an assigned `Text` node gave three `characterData` records for `data`, `nodeValue` and `textContent` writes, one `slotchange` for its insertion and none for the data change |
| AM-002 | 2026-11-09 | ledger 01-C7 (factual correction, implement) | Part B CSS custom properties, the no-fallback bullet: without `line-themes`, `root` has a transparent background, its border takes `currentColor` and the text inherits its colour. It read that the box has "no background or border colour". Tests, the Browser row, adds the case on a page without `line-themes` | A colour token that resolves to the guaranteed-invalid value makes the declaration invalid at computed-value time, so each property takes its inherited or initial value. `border-color` has the initial value `currentColor`, so the border still draws, in the text colour. The bullet was marked `[INFERENCE: not probed]` | CSS Custom Properties 1 §3.1, invalid at computed-value time (https://www.w3.org/TR/css-variables-1/#invalid-at-computed-value-time); CSS Backgrounds 3 §2.2, `background-color` initial `transparent`, and §3.1, `border-color` initial `currentcolor` (https://www.w3.org/TR/css-backgrounds-3/); the Browser-tier test on `packages/line-components/__tests__/integration/alert/no-theme.html` in chromium, firefox and webkit |
| AM-003 | 2026-11-09 | ledger 01-C7 (factual correction, implement) | Part B Anatomy, the D11 bullet: Chromium and Firefox fire no `slotchange` for an in-place `Text` data change, and WebKit fires one; the `MutationObserver` re-reads the default slot in every engine. Tests, the Browser row: no `slotchange` between the in-place changes in chromium and firefox, one per change in webkit. AM-001 stands | AM-001 said `slotchange` never fires for an in-place `Text` data change, from the DOM Standard and a happy-dom probe. The Browser tier found WebKit 27.2 firing one per change. The observer is still needed for Chromium and Firefox, and in WebKit both paths read the same state, so the component does not change | Probe 2026-11-09 with Playwright 1.64.0 on macOS 27.2 (`temp/`, deleted after the run): a `Text` node assigned to a default slot, its data changed `''` → text → other text → `''` → whitespace. chromium 156.0.8078.4 and firefox 157.0 fired 0 `slotchange` per change, webkit 27.2 fired 1 per change; a change to text inside a slotted element fired none in all three. The Browser-tier test `integration/alert/alert.e2e.ts` asserts the same counts |
