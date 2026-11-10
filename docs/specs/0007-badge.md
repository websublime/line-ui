# Badge

| Field | Value |
|-------|-------|
| Status | `approved` (Miguel, 2026-11-10) |
| Phase | `1` |
| Tier | `Static` (Phase 1 spec §6.C.4 C9 row, `docs/specs/01-spec-core-primitives.md:1165`; PRD §4.1, `docs/PRD.md:251`; ARCH §8, `docs/ARCHITECTURE.md:410`) |
| Tag | `line-badge` |
| Entrypoint | `@websublime/line-components/badge` (Phase 1 spec §4.2, `:248`, `:297`; §10 SD12, `:2359`) |
| Form-associated | `no` (Phase 1 spec §6.C.4 C9 row) |
| PRD catalogue entry | PRD §4.1, `Badge` row (`docs/PRD.md:251`) |
| Ledger row | `01-C9` (`docs/plans/01-tasks-core-primitives.md:55`) |
| Governing sections | Phase 1 spec §4 (file classes `:134-154`; `:248`, `:297`), §6.C.0, §6.C.4 (C9 row and notes), §6.C.6, §6.G.1, §6.G.3, §6.G.4 (Accessibility), §6.G.5, §7.4, §7.8, §10 SD12, SD34, SD37, SD38, SD39, SD98, SD99, §12 AM-058, AM-067, AM-086, AM-092; ARCH (v0.8.26) §2, §3, §5, §8, §12, §13.2, §14.3, §14.6–§14.8, §17.2–§17.4; PRD §4.1, §5.2, §8, §9.3; MANIFESTO Laws 1–4, 9, Out of Scope; R8 §2.2 |

Text marked `[INFERENCE]` has no probe or source behind it yet. Miguel decided Open Questions F1–F11 on 2026-11-10 and approved the spec the same day; Part B states those decisions. The orchestrator defaults D1–D14 stand as drafted (Miguel, 2026-11-10).

---

## Probes

One throwaway probe ran on 2026-11-10 to inform F2, F4, F5 and F10 and defaults D7 and D13. Its code lived in `packages/line-components/temp/c9-probe/`, which `.gitignore` ignores through its `temp` entry, and was deleted after the run. Nothing of it is committed.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2, arm64; Bun 1.4.3 |
| Runner | Playwright 1.64.0 with its own engines, chromium 156.0.8078.4, firefox 157.0 and webkit 27.2; `bunx playwright test -c packages/line-components/temp/c9-probe/playwright.config.ts`, exit 0, 3 passed |
| axe | `@axe-core/playwright` 4.14.0 with axe-core 4.14.0, scoped to `main`, once with the §7.4 tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and once with every rule |
| Chromium accessibility tree | a CDP session, `Accessibility.getFullAXTree`, reading `role`, `name` and the `live`, `atomic` and `relevant` properties of each node, ignored nodes included when they carry one |
| Other engines | an internals read-back and Playwright's `ariaSnapshot()`, which Playwright computes itself from the DOM |

The probe host `<probe-badge>` was a plain `HTMLElement` with an open shadow root holding `<span part="root"><slot></slot></span>`. It attached its `ElementInternals` in a class field, as `LineElement` does (`packages/line-core/src/line-element.ts:31`), and wrote them from a `mode` attribute: `none` wrote nothing, `img` set `internals.role = 'img'`, `hidden` set `internals.ariaHidden = 'true'`, `status` set `internals.role = 'status'`, and `live` set `internals.ariaLive = 'polite'`. A `mode="inner-img"` host put `role="img"` and `aria-label` from its `label` attribute on the shadow `<span>` instead. The probe did not use Lit or `LineElement` [INFERENCE: neither changes what the engine exposes for a given internals value or shadow tree].

Each case below was mounted twice in one `<main>`: alone in a `<div>`, and inside `<button type="button">Inbox …</button>`.

| Case | Markup |
|---|---|
| count | `<probe-badge>5</probe-badge>` |
| count, host `aria-label` | `<probe-badge aria-label="5 unread messages">5</probe-badge>` |
| count, hidden words | `<probe-badge>5<span style="…visually hidden…"> unread messages</span></probe-badge>` |
| overflow | `<probe-badge>99+</probe-badge>` |
| dot | `<probe-badge></probe-badge>` |
| dot, internals hidden | `<probe-badge mode="hidden"></probe-badge>` |
| dot, internals `img` named | `<probe-badge mode="img" aria-label="New messages"></probe-badge>` |
| dot, internals `img` unnamed | `<probe-badge mode="img"></probe-badge>` |
| dot, inner `img` | `<probe-badge mode="inner-img" label="New messages"></probe-badge>` |
| count, internals `status` | `<probe-badge mode="status">5</probe-badge>` |
| count, internals `ariaLive` | `<probe-badge mode="live">5</probe-badge>` |
| count, host `aria-live` | `<probe-badge aria-live="polite">5</probe-badge>` |
| count, internals hidden | `<probe-badge mode="hidden">5</probe-badge>` |
| count, host `aria-hidden` | `<probe-badge aria-hidden="true">5</probe-badge>` |
| count, internals `img` named | `<probe-badge mode="img" aria-label="5 unread messages">5</probe-badge>` |

### P1 — Chromium accessibility tree

| Case | Alone | Name of the enclosing button |
|---|---|---|
| count | `StaticText` "5"; the host is ignored | "Inbox 5" |
| count, host `aria-label` | `generic` "5 unread messages" over `StaticText` "5" | "Inbox 5 unread messages" |
| count, hidden words | `StaticText` "5", `StaticText` "unread messages" | "Inbox 5 unread messages" |
| overflow | `StaticText` "99+" | "Inbox 99+" |
| dot | nothing | "Inbox" |
| dot, internals hidden | nothing | "Inbox" |
| dot, internals `img` named | `image` "New messages" | "Inbox New messages" |
| dot, internals `img` unnamed | `image` "" | "Inbox" |
| dot, inner `img` | `image` "New messages" | "Inbox New messages" |
| count, internals `status` | `status` "", `live` `polite`, `atomic` `true`, `relevant` `additions text`, over `StaticText` "5" | **"Inbox "**; the count is left out of the name |
| count, internals `ariaLive` | `StaticText` "5"; no node carries a live property | "Inbox 5" |
| count, host `aria-live` | `generic` "", `live` `polite`, `atomic` `false`, `relevant` `additions text`, over `StaticText` "5" | "Inbox 5" |
| count, internals hidden | nothing | "Inbox 5"; the button node holds only `StaticText` "Inbox " |
| count, host `aria-hidden` | nothing | "Inbox 5"; the button node holds only `StaticText` "Inbox " |
| count, internals `img` named | `image` "5 unread messages" over `StaticText` "5" | "Inbox 5 unread messages" |

- Chromium keeps a role-less host out of the tree and exposes its slotted text in place, and that text joins the name of an enclosing button.
- Chromium uses a host `aria-label` on a role-less host, both as the name of a `generic` node and inside the button's name, although ARIA prohibits naming `generic` (R8 `docs/research/01-research-accessibility.md:55`).
- An internals `status` role takes the count out of the enclosing button's name, because Chromium does not compute a name from the content of `status`.
- An internals `ariaLive` with no role exposes no live region. A host `aria-live` attribute does, as Alert probe P3 found (`0006-alert.md` Probe P3).
- With a hidden count, internals or host attribute alike, Chromium hides the badge node but still puts "5" in the enclosing button's name [INFERENCE: the cause is not known; the read-back and the absent node show the hiding itself works].

### P2 — Internals read-back and Playwright `ariaSnapshot()`, three engines

| Check | chromium | firefox | webkit |
|---|---|---|---|
| Internals read-back of every case | the value each `mode` wrote: `role` `img` or `status`, `ariaHidden` `true`, `ariaLive` `polite`; every other value `null` | same | same |
| `ariaSnapshot()` of the internals `img` dot, alone | empty | empty | empty |
| `ariaSnapshot()` of the internals `status` count inside the button | `button "Inbox 5"` | same | same |
| `ariaSnapshot()` of the inner `img` dot | `img "New messages"`; inside the button `button "Inbox New messages"` | same | same |
| `ariaSnapshot()` of the host `aria-hidden` count inside the button | `button "Inbox"` | same | same |
| `ariaSnapshot()` of the host `aria-label` count, alone | `text: "5"` | same | same |

- Playwright's snapshot reads no internals value, so it shows neither an internals `img` nor an internals `status`. It cannot be the Browser-tier check of internals semantics (D13).

### P3 — axe

axe 4.14.0 reported zero violations for the whole page, every case alone and inside the button, in chromium, firefox and webkit, with the §7.4 tags and with every rule. That includes the unnamed internals `img`, the named role-less host and the unnamed empty dot. axe does not see internals values (`packages/line-core/src/internals.ts:1-13`; Phase 1 spec §7.4, `:2122-2123`), so zero violations prove nothing about an internals role or its name.

### P4 — Count change (Chromium)

The count of the plain, internals `status` and internals `ariaLive` hosts changed from "5" to "6" by editing the slotted `Text` node in place. 300 ms later the tree held `StaticText` "6" in each, and the `status` node kept its live properties. Whether a screen reader announced the change is not observable: CDP exposes the live-region properties and no announcement event (`0006-alert.md` Probe P4).

### What the probes settle

- A count or a label in the default slot is exposed as text in place and joins the name of an enclosing control, with no role (P1). R8 lists Badge as "No role; text content" (`docs/research/01-research-accessibility.md:70`).
- A live role on the host is not free: an internals `status` drops the count from the name of a button around the badge (P1; F2).
- A component cannot make a polite live region through internals alone without a role; a host `aria-live` attribute can (P1; F2).
- An internals `img` named by the host `aria-label` gives a dot, or a count, one name that also joins the enclosing control's name (P1; F4, F5).
- No automated check catches an unnamed dot or an unnamed internals `img`: axe sees no internals (P3), and Playwright's snapshot sees no internals either (P2). Only a Chromium CDP assertion and the internals read-back prove the semantics (Phase 1 spec §6.C.4 notes, `:1180`; D13).

### What automation cannot observe

- Whether a screen reader announces a count, at load or on change (P4).
- Firefox and WebKit exposure of internals values to assistive technology. The read-back proves the values each engine holds, not what it exposes (Phase 1 spec `:1180`; §12 AM-058).
- How a screen reader speaks "99+" [INFERENCE: probably "99 plus", not probed].

---

## Part A — Requirements

### Overview

#### Description

`<line-badge>` is a small, non-interactive status marker: a count such as "5", a short label such as "Beta", or a dot with no text (PRD §4.1, `docs/PRD.md:251`). The consumer writes the count or the label as text in its default slot, and a badge with an empty slot draws as a dot (F1). The component does not cap or format numbers; a consumer who wants "99+" writes "99+" (F3). It has no role, so assistive technology reads its text in place and as part of the name of a control around it (R8 `:70`; probe P1). A dot is hidden from assistive technology unless the host carries an `aria-label`, which makes it an `img` with that name, as Icon does (F4; `0014-icon.md` decision D1). A `variant` gives it the tone of one of the theme's semantic roles, the same five tones Alert uses (F6), drawn as a soft fill for a count or a label and a solid fill for a dot (F7, AM-001). It sits inline where the consumer puts it; overlapping the corner of an avatar or an icon is the job of that component's slot or of consumer CSS (F8). It holds no state, takes no focus and fires no event (ARCH §8, `docs/ARCHITECTURE.md:410`).

#### Use cases

- An unread count after a navigation label or inside a button, such as "Inbox 5", where the count joins the button's name (probe P1).
- A status word beside a heading or a table cell, such as "Beta", "New" or "Paid", with a tone that matches its meaning (F6).
- A dot on a list item or beside a label that marks something new, named "New messages" through `aria-label` when its meaning is not stated nearby (F4).
- A status indicator in the `status` slot of `<line-avatar>`, such as a green dot named "Online" (ARCH §13.2, `docs/ARCHITECTURE.md:605`; F8).
- An agent-built count or status label on `<line-a2ui-surface>` from a `line` catalog `Badge` node whose `label` is bound to the data model (F9, F10).

#### Anti-patterns

- A message that needs a sentence, a title or actions. Use `<line-alert>` (`0006-alert.md`).
- An option the user turns on or off, such as a filter. Use `<line-chip>` (`0008-chip.md`).
- A removable tag, such as an entered email address. Tag Input covers it (PRD §4.5, `docs/PRD.md:330`).
- A badge as the only carrier of meaning through colour, such as a red dot with no name and no nearby text. WCAG 1.4.1 forbids colour as the only means (MANIFESTO Law 3, `docs/MANIFESTO.md:43`); state the meaning in words or name the dot (F4).
- A clickable badge. Badge takes no focus and handles no key; put it inside a `<line-button>` or a link instead.
- A count that must be heard when it changes, with no other route. Badge announces nothing by default; follow the live-region recipe of F2 or announce the change from the page.

#### User expectations

- The badge reads as text where it sits; a count inside a button is read with the button's label, such as "Inbox 5" (probe P1).
- A dot that carries meaning has a spoken name; a dot that only repeats nearby text is silent (F4).
- The tone follows meaning and stays the same whatever the accent, because the semantic roles are fixed at the root (PRD §9.3, `docs/PRD.md:1326`).
- The badge never takes focus and never moves focus.
- Consumer CSS on `line-badge` and `::part(root)` overrides every visual default (ARCH §4).

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| `<line-button>`, `<line-icon-button>` | parent | the Button `suffix` slot (ARCH §13.1, `docs/ARCHITECTURE.md:596`) or the default slot; the badge text joins the inner button's name [INFERENCE: probed with a native `<button>` only, probe P1]. Badge never imports Button (MANIFESTO Law 4, `docs/MANIFESTO.md:45`; Phase 1 spec §6.C.6, `:1228`) |
| `<line-chip>` | parent | the Chip `suffix` slot, which takes a count (`0008-chip.md` Slots) |
| `<line-avatar>` | parent | the Avatar `status` slot (ARCH §13.2, `docs/ARCHITECTURE.md:605`); Avatar (row 01-C10) places the slot over its corner, and Badge knows nothing of it (F8) |
| `<line-stack>` | parent | the Stack default slot, beside a label in a horizontal Stack |
| `<line-a2ui-surface>` | orchestrator | creates `line-badge` by tag from a `line` catalog `Badge` node, writes `variant`, writes the `label` text into the default slot through the text binding, and sets `accessibility.label` as the host `aria-label` (ARCH §17.4, `docs/ARCHITECTURE.md:1636`; Phase 1 spec §6.G.1, AM-092; F9, F10) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| `variant` (F6) | `neutral` (default) | a count or label with no tone |
| | `info` | helpful context, such as "Beta" |
| | `success` | a positive state, such as "Paid" or an online dot |
| | `warning` | something that needs attention soon |
| | `danger` | an error, or an urgent count such as unread alerts |

- `variant` is a C6 semantic variant: a reflected closed enum that changes only the defaults of the `--line-badge-*` colour tokens on `:host` and adds no other CSS rule (ARCH §17.2 C6, `docs/ARCHITECTURE.md:1577`).
- The values and the `neutral` → `gray` mapping are Alert's (`0006-alert.md` Variants; `packages/line-components/src/alert/alert.ts:13`), so an author and an agent meet one tone vocabulary (F6).
- The count, label and dot forms are not variants. They follow from the slot content (F1), because a form that removes content is more than a token default (C6).
- An unknown value behaves as `neutral`, and the attribute keeps what the author wrote (C8), as Alert's converter does (`alert.ts:16-18`).

---

## Part B — Technical Specification

### Anatomy

```
<line-badge>                       LineElement; display: inline-flex; internals role img or ariaHidden per the A11y rule (F4, F5)
└── #shadow-root
    └── <span part="root">         the box or, while the slot is empty, the dot (F1)
        └── <slot>
```

- One zone, a slot, because the consumer decides the text (ARCH §3, `docs/ARCHITECTURE.md:219-226`). `root` is the ARCH §5 name for the main container (`:306`).
- The host extends `LineElement`, which attaches `ElementInternals` (`packages/line-core/src/line-element.ts:31-36`), without the `FormAssociated` mixin.
- `:host { display: inline-flex }`, as the ARCH §14.6 example shows for Badge (`docs/ARCHITECTURE.md:1095-1098`), and `:host([hidden]) { display: none }`, because `display` on `:host` beats the UA `[hidden]` rule (`packages/line-components/src/separator/separator.ts:47-49`; D3).
- **Empty slot (F1).** The slot is empty when its flattened assigned nodes hold no element and no `Text` other than whitespace, Alert's D11 rule (`alert.ts:253-257`). The component reads it on `slotchange`, once in `firstUpdated`, and through a `MutationObserver` on the slot's `Text` nodes, because Chromium and Firefox fire no `slotchange` for text changed in place (`alert.ts:190-196`, `:240-261`; `0006-alert.md` AM-003, AM-005). It reflects the result as `empty` (`data-empty`, `:state(empty)`; F1).

### States

| Field | Value |
|-------|-------|
| Machine | `none` (Static tier; ARCH §8, `docs/ARCHITECTURE.md:410`; Phase 1 spec §6.C.4 C9 row) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| none | — | — | — |

| Flag | Source | Host reflection |
|------|--------|-----------------|
| `empty` (F1) | the default slot holds no element and no non-whitespace text | `data-empty`, `:state(empty)` through `reflectState` (`line-element.ts:46-53`; ARCH §14.8, `docs/ARCHITECTURE.md:1228`) |

- `empty` is the CSS hook that draws the dot. ARCH §14.8 lists `empty` among the reflected states (`:1228`). It is the first flag a Static component reflects; Alert and Icon reflect none (`0006-alert.md` States; `0014-icon.md` default F9). It exists because of F1 (b).

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ComponentId` | the count or the label as text, such as "5", "99+" or "Beta", or a `<line-visually-hidden>` or other element that adds words for assistive technology; nothing for a dot (F1). On the agent path the surface writes the `label` text here (F9) |

- Words for assistive technology may sit in the slot, such as `5<line-visually-hidden> unread messages</line-visually-hidden>`; they join the name of an enclosing control (probe P1, the hidden-words case) [INFERENCE: probed with an inline visually-hidden `<span>`, not `<line-visually-hidden>`, which row 01-C12 has not shipped].

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<span>` | the box, its fill, radius, padding and text; the dot while `empty` |

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `variant` | `variant` | `'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | yes | the tone; sets the defaults of the `--line-badge-*` colour tokens (F6) |

- "Reflects" follows Alert and Separator: a value the author or code sets is written to the attribute, and the default leaves no attribute (Lit `useDefault: true`), so an unknown author value stays as written and removing the attribute restores the default (`alert.ts:76`, `:199-201`; D6).
- The host also takes `aria-label`, `aria-labelledby` and `aria-description` as plain attributes. A non-blank `aria-label` or a non-empty `aria-labelledby` switches the internals role to `img` (A11y; F4, F5). They are observed attributes, not reactive properties, as on Icon (`0014-icon.md` default F10; `packages/line-components/src/icon/icon.ts:15-16`, `:184-190`).
- No `count`, `max` or form prop (F1, F3).

**Internals values** (F4, F5; D7)

| Host `aria-label` (trimmed) or `aria-labelledby` | Slot | `internals.role` | `internals.ariaHidden` |
|---|---|---|---|
| present | any | `'img'` | `null` |
| absent | empty (dot) | `null` | `'true'` |
| absent | text or element | `null` | `null` |

- The component writes these through `this[INTERNALS]` in its constructor and synchronously whenever an observed name attribute or the slot's emptiness changes, so an inserted host has them at once, as Alert does for its role (`0006-alert.md` D8; `alert.ts:198-204`, `:236-238`). It writes no `role` or `aria-*` attribute. An author `role`, `aria-hidden` or `aria-live` on the host overrides these defaults (`0006-alert.md` Probe P3).
- `img` makes the slotted text presentational for the role's name: the name is the label, such as "5 unread messages" over the text "5" (probe P1).

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

Badge holds no value and no interactive element, so it fires nothing and is neither value-bearing nor compound (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`).

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-badge-bg` | `var(--line-gray-bg)`, per variant (table below) | `root` while it holds text |
| `--line-badge-color` | `var(--line-gray-text)`, per variant (table below) | `root` while it holds text |
| `--line-badge-dot-color` | `var(--line-gray-solid)`, per variant (table below) | `root` while `empty` |
| `--line-badge-radius` | `var(--line-radius-round)` | `root` |
| `--line-badge-height` | `var(--line-size-4)` | `root` (`min-block-size` and `min-inline-size`, so one character draws a circle) |
| `--line-badge-padding-inline` | `var(--line-size-1)` | `root` |
| `--line-badge-font-size` | `var(--line-font-size-0)` | `root` |
| `--line-badge-font-weight` | `var(--line-font-weight-5)` | `root` |
| `--line-badge-dot-size` | `var(--line-size-2)` | `root` while `empty` (`block-size` and `inline-size`; no padding) |

**Variant defaults** (C6; F6, F7)

| `variant` | `--line-badge-bg` | `--line-badge-color` | `--line-badge-dot-color` |
|---|---|---|---|
| `neutral`, missing or unknown | `var(--line-gray-bg)` | `var(--line-gray-text)` | `var(--line-gray-solid)` |
| `info` | `var(--line-info-bg)` | `var(--line-info-text)` | `var(--line-info-solid)` |
| `success` | `var(--line-success-bg)` | `var(--line-success-text)` | `var(--line-success-solid)` |
| `warning` | `var(--line-warning-bg)` | `var(--line-warning-text)` | `var(--line-warning-solid)` |
| `danger` | `var(--line-danger-bg)` | `var(--line-danger-text)` | `var(--line-danger-solid)` |

- A count or a label takes the soft steps, `-bg` (Radix step 3) under `-text` (step 12), as Alert does (`0006-alert.md` CSS custom properties; `packages/line-themes/src/aliases.css:7-72`), because 12px text needs 4.5:1 and the step-9 `-solid` with `-contrast` pair guarantees only 3:1 (AM-001). A dot holds no text, so it takes `-solid` (step 9; `aliases.css:25`, `:36`, `:47`, `:58`, `:69`), non-text UI held to 3:1 by WCAG 1.4.11. No border token: the soft fill draws no border (AM-001).
- `:host([variant="…"])` rules redeclare only the three colour tokens and add no other rule (ARCH `:1577`).
- The other defaults are D8: `--line-radius-round` is `1e5px` (`packages/line-tokens/src/radii.css:15`), `--line-size-4` is `1.25rem`, `--line-size-1` `0.25rem` and `--line-size-2` `0.5rem` (`packages/line-tokens/src/sizing.css:10-13`), `--line-font-size-0` is `0.75rem` (`packages/line-tokens/src/typography.css:30`) and `--line-font-weight-5` is `500` (`typography.css:23`).
- Without `line-themes` the colour tokens are invalid at computed-value time, so a count or label keeps a transparent background and inherits its text colour, which stays readable (`0006-alert.md` AM-002). The dot draws with `background-color: var(--line-badge-dot-color, currentColor)`, so an unthemed dot still shows in the text colour, as Separator falls back to `currentColor` (`separator.ts:36`; D8) [INFERENCE: that a custom property holding an undefined `var()` makes the outer fallback apply is not probed].
- In forced-colors mode every tone draws in the same system colours, so the tone has to reach users in words too (`0006-alert.md` CSS custom properties).

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

Badge takes no focus and handles no key. Keyboard navigation is tested in the Browser tier only to prove that Tab skips the host (Phase 1 spec §10 SD99, `:2446`).

### A11y

| Field | Value |
|-------|-------|
| Role | none by default; `img` on the host as the `ElementInternals` default while the host carries a non-blank `aria-label` or a non-empty `aria-labelledby` (F4, F5; Internals values above) |
| ARIA attributes | none written by the component; `internals.ariaHidden = 'true'` for an unnamed dot (F4). An author `role`, `aria-hidden` or `aria-live` on the host overrides the internals defaults |
| Accessible name | a count or label is read as text in place and joins the name of an enclosing control (probe P1). A host `aria-label` names the `img` directly, because the role sits on the host (C5); nothing is copied |
| Focus | none; the host is not focusable and does not delegate focus |

- **Count announcement (F2).** A count is text. Badge sets no live role, because an internals `status` drops the count from an enclosing button's name (probe P1). The docs show the recipe for a count that must be heard on change: the author sets `aria-live="polite"` on the host, which Chromium exposes as a polite, non-atomic live region that leaves the count in the enclosing name (probe P1); set it before the count changes. On `<line-a2ui-surface>` the surface's live region announces "Content updated." once per batch that changed the DOM, so an agent badge needs no live role of its own (Phase 1 spec §6.G.4, `:1520-1521`).
- **Dot (F4).** An unnamed dot is hidden, because R8 says a dot badge "needs a text alternative or `aria-hidden`" (`docs/research/01-research-accessibility.md:70`). A dot that carries meaning gets `aria-label`. The docs say to state the meaning in nearby text or name the dot, never colour alone (WCAG 1.4.1).
- **Named text badge (F5).** A host `aria-label` on a count or label badge makes it an `img` named by the label, such as "5 unread messages" over "5", so the host is never a named `generic`, which ARIA prohibits (R8 `:55`; probe P1).
- **Proof (D13).** The role and `ariaHidden` live only in internals, so the Browser tier proves them with a Chromium CDP accessibility-tree assertion of role and name and an `INTERNALS` read-back in chromium, firefox and webkit (Phase 1 spec §6.C.4 notes, `:1180`; §10 SD39; §12 AM-058). Playwright's `ariaSnapshot()` cannot serve, because it reads no internals value (probe P2). axe reports nothing for an unnamed dot or `img` (probe P3).
- **Firefox and WebKit gap.** No check proves what Firefox and WebKit expose to assistive technology for the internals `img`, its name and `ariaHidden`. The gap is recorded here (Phase 1 spec `:1180`; §12 AM-058). A manual screen-reader pass is optional and never blocks the row.
- **Chromium hidden-count quirk.** Chromium leaves "5" in an enclosing button's name even when the badge host is hidden (probe P1). The rule above never hides a badge that holds text, so the quirk does not reach a shipped default; an author `aria-hidden` on a count meets it.

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `variant` is a string enum; `aria-label`, `aria-labelledby` and `aria-description` are strings; the count or label is slotted text |
| C2 | Slots carry `@slot` and a single or multiple classification | `@slot` for the default slot, `ComponentId` (Slots) |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | fires no event, so no `@fires`; not value-bearing |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated (Phase 1 spec §6.C.4 C9 row) |
| C5 | The host accepts an accessible name and applies it to the element with the role | the host accepts `aria-label` and `aria-description`; the `img` role sits on the host, so the name applies there directly (F4, F5) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | `variant` is `neutral`, `info`, `success`, `warning` or `danger`; a value the author or code sets is reflected and the default leaves no attribute; each value redeclares only `--line-badge-bg`, `--line-badge-color` and `--line-badge-dot-color` on `:host` (F6, F7, AM-001) |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries `@summary`, one `@slot`, one `@csspart`, nine `@cssprop`; no event and nothing deprecated |
| C8 | Missing or partial props degrade to an empty or neutral state | with no attributes and no content it renders a neutral dot hidden from assistive technology; an unknown `variant` behaves as `neutral` and keeps the author's attribute |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound: no value prop and no interactive element |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `Badge` (D10) |
| Tag | `line-badge` |
| `load()` subpath | `@websublime/line-components/badge` |
| Prop schema | `label` (`DynamicString`, optional, through `commonProp`), `variant` (`z.enum(['neutral', 'info', 'success', 'warning', 'danger'])`, plain `.describe()`, optional), plus `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1, `:1323`, `:1326`; §12 AM-067). No `child` (F9) |
| Slot map | none; the label reaches the default slot through the text binding, and a descriptor with a text binding has no slot map (Phase 1 spec §6.G.1, `:1312`, AM-092; F9) |
| Binding map | `label` → text binding `{ kind: 'text' }`; `variant` → attribute `variant`; no value prop and no commit event (F9, F11) |
| Action map | none |
| Accessibility requirements | `requiredName: [{ kind: 'textProp', prop: 'label' }, { kind: 'accessibilityLabel' }]`, so a node needs a non-blank `label` or `accessibility.label`, which makes every agent dot named (F10); `hostNaming: { kind: 'always' }` (`packages/line-genui/src/catalog/descriptor.ts:138-141`, `:153-157`) |
| Agent-facing description | A small status marker beside other content, such as an unread count next to Inbox or a "Beta" tag next to a heading. Set `label` to its short text: a number such as "5" or "99+", or a word or two. To show a dot instead, leave `label` empty and give `accessibility.label` the meaning, such as "New messages". `variant` sets the tone and colour: `info` for helpful context, `success` for a positive state, `warning` for something that needs attention, `danger` for an error or an urgent count, or `neutral` (default). Also state the meaning in words, because colour alone does not reach every user. A badge is not interactive and announces nothing on its own. Use Alert for a message that needs a sentence, and Chip for an option the user can turn on or off. |
| Tool description | A small status marker beside other content, such as an unread count next to Inbox or a "Beta" tag next to a heading. Set `label` to its short text: a number such as "5" or "99+", or a word or two. To show a dot instead, leave `label` empty and give `accessibilityLabel` the meaning, such as "New messages". `variant` sets the tone and colour: `info` for helpful context, `success` for a positive state, `warning` for something that needs attention, `danger` for an error or an urgent count, or `neutral` (default). Also state the meaning in words, because colour alone does not reach every user. A badge is not interactive and announces nothing on its own. Use Alert for a message that needs a sentence, and Chip for an option the user can turn on or off. |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C9 row; Badge is none of the three SD38 exceptions, `:2385`) |

- The agent-facing description names `accessibility.label`, so the descriptor sets a tool description that names `accessibilityLabel` instead, as Separator's does (Phase 1 spec §6.G.3, `:1423`; `packages/line-genui/src/catalog/descriptors/separator.ts:9-12`). The agent-facing description is 756 characters and the tool description 755, under the 1024 cap (Phase 1 spec §6.G.3, `:1422`).
- The frontend tool carries `label`, `variant`, and the optional `accessibilityLabel` and `accessibilityDescription`, because `hostNaming` is `always` (`packages/line-genui/src/catalog/tools.ts:144-148`, `:228`; Phase 1 spec §12 AM-069).
- The surface writes the resolved `label` as the host's text content, replacing the slot's light DOM (`packages/line-genui/src/a2ui/projection.ts:458-462`, `:161-166`). A number bound from the data model becomes its decimal string (`projection.ts:126-131`) [INFERENCE: that `web_core` passes a number through a `DynamicString` binding unchanged is not probed]. An empty `label` leaves the slot empty, so the agent badge draws as a dot (F1).
- The surface sets `accessibility.label` as the host `aria-label` (Phase 1 spec §6.G.4, `:1514`), which makes the dot, or a text badge, an `img` with that name (F4, F5).
- The drift test skips the text binding and checks the `variant` attribute against the manifest (Phase 1 spec §6.G.5, `:1607`, AM-092).
- No A2UI v0.9 `basic` type maps to Badge; the ARCH §17.3 basic table has none (`docs/ARCHITECTURE.md:1608-1626`), and the vendored basic catalog fixture names none (`packages/line-genui/__tests__/fixtures/`). The `basic` map is unchanged (D1).
- C9 ships its descriptor in the same PR, joins the `descriptors` array in catalog-name order (`packages/line-genui/src/catalog/index.ts:105-115`), and adds Badge to the `<line-a2ui-surface>` render fixture and the surface axe test (Phase 1 spec §6.C.0, `:927`; §6.C.6, `:1231`).

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/badge` |
| Kind | `independent` (Phase 1 spec §4.2, `:297`; §10 SD12) |
| Registers | `line-badge` |
| Reset modules | `commonReset` only (ARCH §14.7, `docs/ARCHITECTURE.md:1163`; the §14.6 example, `:1091-1098`; `packages/line-core/src/styles/index.ts:31`) |

- Files: `src/badge/badge.ts` (class and `customElements.define`), `src/badge/badge.types.ts`, `src/badge/index.ts`.
- `package.json` gains the `./badge` export (Phase 1 spec §4.2, `:248`), and the Vite build gains the `badge/index` entry (§4, `:140-141`). No new dependency.
- Badge imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`).

### Markup examples

```html
<!-- Label -->
<line-badge>Beta</line-badge>

<!-- Count with a tone -->
<line-badge variant="danger">5</line-badge>

<!-- Count inside a button: the name is "Inbox 5" -->
<line-button>Inbox <line-badge slot="suffix">5</line-badge></line-button>

<!-- Count with words for assistive technology -->
<line-badge>5<line-visually-hidden> unread messages</line-visually-hidden></line-badge>

<!-- Count named as a whole: an img named "5 unread messages" (F5) -->
<line-badge aria-label="5 unread messages">5</line-badge>

<!-- Overflow, formatted by the consumer (F3) -->
<line-badge variant="danger">99+</line-badge>

<!-- Dot, decorative: the nearby text carries the meaning (F4) -->
<span>New messages</span> <line-badge variant="info"></line-badge>

<!-- Dot, named: an img named "Online" (F4), in the Avatar status slot (F8) -->
<line-avatar>
  <line-badge slot="status" variant="success" aria-label="Online"></line-badge>
</line-avatar>

<!-- A count that is announced when it changes (F2) -->
<line-badge aria-live="polite">3</line-badge>

<!-- Tokens and parts -->
<style>
  line-badge.large {
    --line-badge-height: var(--line-size-5);
    --line-badge-font-size: var(--line-font-size-1);
  }
  line-badge[data-empty]::part(root) {
    box-shadow: 0 0 0 2px var(--line-gray-surface);
  }
</style>
<line-badge class="large">12</line-badge>
```

- `<line-avatar>` and its `status` slot ship with row 01-C10 (ARCH §13.2, `:605`), and `<line-visually-hidden>` with row 01-C12. The examples show the intended wiring; the C9 stories use neither until those rows land (D11).

A `line` catalog node the surface renders as the second example, with the count bound to the data model:

```json
{ "id": "unread", "component": "Badge", "label": { "path": "/inbox/unread" }, "variant": "danger" }
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom | render with no errors; `variant` default with no host attribute, reflection of a set value, the converter falling back to `neutral` while an unknown attribute keeps the author's value, and removing the attribute restoring the default; `data-empty` and `:state(empty)` through the fake internals, for an empty slot, a whitespace-only slot, slotted text, a slotted element, text changed in place and text removed (F1); the internals values table (`role`, `ariaHidden`) for every row, including a blank `aria-label` counting as absent and a change of `aria-label` or of the slot updating them synchronously (F4, F5; D7); no event of any kind; C8 with no attributes and no content |
| Browser | Playwright `*.e2e.ts` on chromium, firefox and webkit | Tab skips the host (Phase 1 spec §10 SD99); the Chromium CDP assertion of role and name for a count, a count inside a native button ("Inbox 5"), an unnamed dot (no node), a named dot (`image` "New messages") and a named count (`image` "5 unread messages"), with the `INTERNALS` read-back of each in all three engines (Phase 1 spec `:1180`; D13); the author `aria-live="polite"` recipe exposing a polite live region in Chromium (F2); computed colour tokens for every row of the variant table on a page with `line-themes` and a palette, and the unthemed dot drawing in `currentColor` (D8); the dot's computed size |
| A11y | axe-core | zero violations (MANIFESTO Law 3) in every Badge story of D11 (Phase 1 spec §7.4, `:2118-2119`). axe cannot see the internals role or name (probe P3), so the Browser tier carries the semantic proof |
| htmx | Playwright `*.e2e.ts` through the shared harness `@websublime/line-testing/htmx` (`packages/line-testing/src/htmx.ts`), on htmx 2 and htmx 4 in chromium, firefox and webkit | `n/a`: Badge is neither value-bearing, because its descriptor binding map names no value prop, nor compound, because it holds no interactive element (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`; plan §2.4, `docs/plans/01-plan-core-primitives.md:172-175`). This confirms the Phase 1 spec's "`n/a` expected" (§6.C.4 C9 row; §10 SD34; F11) |
| Visual | Playwright `badge.visual.ts` on the `visual` project | every Badge story with Linux baselines from a `visual-baselines.yml` run; the five tone baselines differ from each other (Phase 1 spec §6.C.6, `:1233`; §10 SD98) |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts`; Playwright axe in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` | a `line` catalog `Badge` node renders `<line-badge>` with its `label` text in the default slot, and a changed or bound `label` rewrites the text; `variant` reaches the attribute; a node with an empty `label` and an `accessibility.label` renders a dot whose host carries that `aria-label`; a node with neither renders the `missing-name` placeholder and raises one `MISSING_ACCESSIBLE_NAME` `line-a2ui-error` (F10; Phase 1 spec §6.G.4, `:1512-1513`); the node joins the surface render fixture and the surface axe test (Phase 1 spec §6.C.6, `:1231`) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the CEM coverage and drift tests pass with the new descriptor (Phase 1 spec §6.G.5); `catalog.json` holds `Badge` and its inline projection validates (§6.G.2); the `Badge` tool takes the tool description, stays at or under 1024 characters, and carries `label`, `variant`, `accessibilityLabel` and `accessibilityDescription` (§6.G.3) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./badge` register `line-badge` only, and the isolation scan finds no other component's module in its bundle (Phase 1 spec §7.5) |

- PRD §5.2 checklist mapping (`docs/PRD.md:514`; Phase 1 spec §6.C.6, `:1222`): render, reactive props, slots, parts, custom properties and events (none fired) run in the Unit tier, keyboard (Tab skips the host) in the Browser tier, and axe in the A11y tier.
- No update-rate measurement: Badge is not a machine row (Phase 1 spec §6.C.6, `:1232`).
- The axe and visual tests run against the Storybook stories on port 4320; the story list lives in `packages/line-components/__tests__/badge-stories.ts`, as `button-stories.ts` does for Button. The CDP and token tests use fixture pages under `packages/line-components/__tests__/integration/badge/`, served by the existing port-4321 `webServer` (`playwright.config.ts`).
- `line-colors` is not a `line-components` dependency, so the colour test sets the palette steps it reads on `html`, as Alert's does (`0006-alert.md` Tests).

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| F1 | How does a badge become a count, a dot or a label? | Miguel | resolved: option (b), inferred from the slot content; an empty slot draws a dot, reflected as `data-empty` and `:state(empty)` (Miguel, 2026-11-10) |
| F2 | Is a count announced, in place and when it changes, and who makes it a live region? (Phase 1 spec C9 row, "Count announcement") | Miguel | resolved: option (c), no component live semantics; the docs tell authors to put `aria-live="polite"` on the badge (Miguel, 2026-11-10) |
| F3 | Who caps and formats a large count, such as "99+"? | Miguel | resolved: option (a), the consumer writes the text, such as "99+"; no number formatting (Miguel, 2026-11-10) |
| F4 | What is a dot badge's accessible name? | Miguel | resolved: option (a), Icon parity: hidden through internals unless the host has `aria-label` or `aria-labelledby`, then internals role `img` with that name (Miguel, 2026-11-10) |
| F5 | What does a host `aria-label` do on a badge that holds text? | Miguel | resolved: option (a), the same `img` rule as F4 (Miguel, 2026-11-10) |
| F6 | Which tones does Badge have, under which attribute? | Miguel | resolved: option (a), `variant="neutral \| info \| success \| warning \| danger"`, `neutral` → gray (Miguel, 2026-11-10) |
| F7 | Which fill does each tone draw? | Miguel | resolved: a solid dot, `--line-<role>-solid`, and Alert's soft fill for a count or a label, `--line-<role>-bg` under `--line-<role>-text` (Miguel, 2026-11-10, AM-001; first resolved as option (a), solid with `-contrast` text, which fails 4.5:1 at 12px) |
| F8 | How does a badge sit over the corner of an avatar or an icon? | Miguel | resolved: option (c), the anchor component's slot or consumer CSS; Badge stays inline, with no positioning (Miguel, 2026-11-10) |
| F9 | Which props does the descriptor expose to agents, and how does the agent's text reach the badge? | Miguel | resolved: option (a), `label` through the text binding into the default slot (Chip's pattern) and `variant` (Miguel, 2026-11-10) |
| F10 | Does the agent path require an accessible name? | Miguel | resolved: option (b), a non-blank `label` or `accessibility.label` (`requiredName`), else the placeholder and `line-a2ui-error` (Miguel, 2026-11-10) |
| F11 | Does the htmx Tests row run? | Miguel | resolved: option (a), `n/a` (Miguel, 2026-11-10) |

**Orchestrator defaults** (Miguel left D1–D14 as drafted, 2026-11-10)

| # | Default | Basis |
|---|---------|-------|
| D1 | Badge joins the `line` catalog only; the `basic` map is unchanged | No A2UI v0.9 basic type is a badge (ARCH §17.3, `docs/ARCHITECTURE.md:1608-1626`); Alert D6 and Chip D1 set the pattern |
| D2 | Static: no machine, no events, not value-bearing, not form-associated | ARCH §8, `:410`; Phase 1 spec §6.C.4 C9 row |
| D3 | Anatomy `<span part="root"><slot></slot></span>`; host `display: inline-flex`; `:host([hidden]) { display: none }` | ARCH §14.6 example `:1095-1098`; ARCH §5 `root`, `:306`; Separator `separator.ts:47-49` |
| D4 | No focus, no key handling, no `tabindex` | R8 Badge row: Keyboard "None" (`docs/research/01-research-accessibility.md:70`) |
| D5 | Reset modules: `commonReset` only | ARCH §14.7, `:1163` |
| D6 | `variant` uses Alert's converter pattern with `useDefault: true`: unknown → `neutral`, the attribute keeps the author's value | `alert.ts:16-18`, `:76`; Button AM-002 (`0002-button.md`) |
| D7 | Internals written in the constructor and synchronously on a change of `aria-label`, `aria-labelledby` (observed attributes) or the slot's emptiness; a trimmed-blank `aria-label` counts as absent | Alert D8 (`0006-alert.md`); Icon default F10 (`0014-icon.md`) |
| D8 | The nine `--line-badge-*` tokens of the CSS custom properties table; the dot falls back to `currentColor` | Pill sizing on the token scale; Separator's `currentColor` fallback (`separator.ts:36`); unlike Alert D9, which carries no fallback, because an unthemed dot with a transparent fill would vanish |
| D9 | No `max`, no number formatting and no `Intl` in the component | Follows F3 (a); MANIFESTO Out of Scope, component strings are the consumer's (`docs/MANIFESTO.md:66`) |
| D10 | Catalog name `Badge`, `agentExposed: true` | PRD row name; Phase 1 spec C9 row |
| D11 | Stories: Label, Count, Count in a button, Overflow, Dot decorative, Dot named, Named count, Tones (one per `variant`), Live count recipe, Custom tokens. Avatar and Visually Hidden examples join once rows 01-C10 and 01-C12 land | One axe and one visual baseline per meaningful state (Phase 1 spec §6.C.6; `0006-alert.md` D16) |
| D12 | The C9 PR also fills the Badge row of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md`, writes the Storybook docs, reports the gzipped size and adds a changeset | Phase 1 spec §6.C.6, `:1223-1227`; plan §2.3, `docs/plans/01-plan-core-primitives.md:168` |
| D13 | The Browser tier proves the internals semantics with a Chromium CDP assertion and an `INTERNALS` read-back in three engines, not with Playwright `ariaSnapshot()` | Phase 1 spec §6.C.4 notes, `:1180`; probe P2 shows `ariaSnapshot()` reads no internals |
| D14 | The class JSDoc tells authors to state a badge's meaning in words, to name a dot that carries meaning, and to set `aria-live` before a count changes | Alert's JSDoc pattern (`alert.ts:40-46`); WCAG 1.4.1; F2, F4 |

Miguel decided F1–F11 on 2026-11-10 and left D1–D14 as drafted. The option tables below stay as the record of what he weighed.

### F1 — Count, dot or label

**Evidence.** The PRD row names three forms: "count, dot, or label variant" (`docs/PRD.md:251`). MANIFESTO Law 4 prefers slots over props for content (`docs/MANIFESTO.md:45`), and ARCH §2 lists badge among simple components, "single custom element with slots" (`docs/ARCHITECTURE.md:168`). C6 allows a variant to change only token defaults (`:1577`), so a form that hides content is not a C6 variant [INFERENCE]. Alert already decides emptiness from the slot (`alert.ts:240-261`; `0006-alert.md` D11). ARCH §14.8 lists `empty` as a reflectable state (`:1228`); no Static component reflects a flag yet (`0014-icon.md` default F9; `0006-alert.md` States). On the agent path the text binding writes a string, and an empty string leaves the slot empty (`projection.ts:161-166`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) Explicit form attribute | a reflected enum such as `kind="label \| count \| dot"`; text in the default slot; `kind="dot"` hides the slot | The form is visible in markup and CSS (`[kind="dot"]`). A second enum beside `variant`; `kind="dot"` with text is a contradiction the component must resolve; agents set one more prop |
| (b) **Recommended.** Inferred from the slot | an empty slot draws a dot, reflected as `empty` (`data-empty`, `:state(empty)`); any text is a label or a count, drawn the same way | Smallest API, and Law 4 holds: the count is content. The agent path needs nothing extra. Badge becomes the first Static component to reflect a flag; whitespace-only content counts as empty |
| (c) `count` property plus `dot` boolean | a `count` number attribute renders the number (with F3's cap); a boolean `dot` forces a dot; the slot takes a label | Numeric data for agents (`DynamicNumber`) and room for a component cap. A content prop that Law 4 discourages, and two ways to put text in a badge |

### F2 — Count announcement

**Evidence.** R8 covers dot-badge text, not counts (Phase 1 spec C9 row, `:1165`; R8 `:70`). Probe P1: a role-less count is text in place and joins an enclosing button's name ("Inbox 5"); an internals `status` makes a polite atomic live region but drops the count from the enclosing button's name ("Inbox "); an internals `ariaLive` alone exposes no live region; a host `aria-live="polite"` attribute exposes a polite non-atomic region and keeps "Inbox 5". APG says screen readers do not announce live content present at page load (R8 `:88-89`). No automated check observes an announcement (probe P4). Alert offers an opt-in `live` property that writes an internals role (`0006-alert.md` D1, D12), and no shipped component writes an ARIA attribute on its own host (`0006-alert.md` Internals values; `separator.ts:75-84`). `Element.ariaNotify()` misses Safari 26, outside the browser target (R8 `:94-95`). The surface announces each changing batch through its own live region (Phase 1 spec §6.G.4, `:1520-1521`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) Text only, no recipe | Badge sets no live semantics and the docs say nothing about change | Smallest. A count change is silent unless the page announces it; authors may reach for `status` themselves and lose the count from the button name |
| (b) `live` property, Alert parity | `live="off \| polite"` writes internals role `status` | One vocabulary with Alert. A live badge inside a button or link drops out of that control's name in Chromium (P1), which breaks the main count use case; `status` takes no name from content |
| (c) **Recommended.** Text, plus a documented author recipe | no component property; the docs and JSDoc show `aria-live="polite"` on the host for a count that must be heard, set before the count changes | Keeps the count in the enclosing name and gives a live region in Chromium (P1). The author writes a standard ARIA attribute (MANIFESTO Law 2 exempts ARIA); announcement itself stays unverified (P4) |
| (d) `live` property that writes a host `aria-live` attribute | the component sets or removes `aria-live` on its own host | Same exposure as (c) with a line API. The first component to write an ARIA attribute on its host, which then overwrites an author's own value; internals cannot do it (P1) |

### F3 — Cap and overflow

**Evidence.** Component-level strings are the consumer's (MANIFESTO Out of Scope, `docs/MANIFESTO.md:66`; R8 `:286-287`). Chromium exposes "99+" as text, and it joins an enclosing name as "Inbox 99+" (probe P1); how it is spoken is not observed. F1 (b) has no numeric input to cap. AvatarGroup's "+N" overflow belongs to that component (ARCH §13.2, `:606`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Consumer formats | the slot text is exactly what shows; no `max` | No locale or symbol decision in line; fits F1 (b). Every consumer writes the cap logic |
| (b) `count` and `max` numbers | the component renders `max` followed by "+" when `count > max` | Needs F1 (c). The "+" and the digit format are component-authored output; no locale handling unless `Intl.NumberFormat` is added |
| (c) As (b), with an `overflow` slot | the consumer supplies the overflow text, such as "99+" or "lots" | Localisable. Two props and a slot for one string |

### F4 — Dot name

**Evidence.** R8: "A dot badge has no text and needs a text alternative or `aria-hidden`" (`docs/research/01-research-accessibility.md:70`). Icon is hidden by default and becomes `img` named by a host `aria-label` through internals (`0014-icon.md` decision D1; `icon.ts:184-190`). Probe P1: an internals `img` named "New messages" is `image` "New messages" and joins a button's name; an internals hidden dot shows nothing; an unnamed internals `img` is `image` "". Probe P2/P3: Playwright and axe see none of it. A role on an inner shadow element is visible to Playwright (P2) and to axe [INFERENCE: axe `role-img-alt` would flag it unnamed, not probed], but a host `aria-label` would then name a `generic` host (`0006-alert.md` Probe P2), so the name comes from a label property (C5, `docs/ARCHITECTURE.md:1576`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Icon parity | unnamed dot → internals `ariaHidden`; host `aria-label` or `aria-labelledby` → internals role `img` | One rule across Icon and Badge; author attributes override. Proof needs CDP and read-back (D13); an unnamed meaningful dot passes every automated check |
| (b) Name required | a dot is always internals `img`; the docs require `aria-label` | Never silently decorative. An unnamed dot is an unnamed `img` (P1) that axe cannot catch (P3), and a decorative dot next to text gets announced twice |
| (c) Always decorative | a dot is always hidden; `aria-label` is ignored | Simplest. A dot can never carry meaning alone, so every dot needs nearby text; an author `aria-label` names a hidden node |
| (d) Inner element role | a `label` property puts `role="img"` and `aria-label` on the shadow `<span>`; unnamed dot hidden | Playwright sees it (P2) and axe can check it. A label property instead of `aria-label`, unlike Icon; a host `aria-label` names a `generic` |
| (e) Nothing | no internals values; an empty role-less host | Chromium exposes nothing (P1), the same as hidden in effect. A host `aria-label` names a `generic`, which ARIA prohibits (R8 `:55`), and Chromium uses it anyway (P1) |

### F5 — Host name on a text badge

**Evidence.** Probe P1: on a role-less count, a host `aria-label` names a `generic` node in Chromium and replaces the count in the enclosing button's name ("Inbox 5 unread messages"); ARIA prohibits naming `generic` (R8 `:55`) and Playwright's snapshot ignores the label on the host alone (P2). An internals `img` with the same label gives `image` "5 unread messages" and the same button name. Words in the slot through visually hidden text give "Inbox 5 unread messages" with no role (P1).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Same rule as F4 (a) | a host `aria-label` on any badge sets internals role `img` | The host is never a named `generic`; one rule for all forms. A labelled count is an image to assistive technology, which may read "image" before the name [INFERENCE: not observed] |
| (b) No role for text badges | `aria-label` is left on a role-less host; the docs recommend words in the slot | Count stays plain text. An author `aria-label` names a prohibited `generic`, which Chromium honours and others may not |
| (c) Copy the label to an inner `<span>` with a role | as F4 (d) for text badges | Visible to axe. A label property and a named `generic` host, as in F4 (d) |

### F6 — Tones

**Evidence.** Alert has `variant="neutral | info | success | warning | danger"`, `neutral` → gray (`0006-alert.md` Variants; `alert.ts:13`). PRD §9.3 has six roles, the four semantic ones fixed at the root plus `accent` and `gray` (`docs/PRD.md:1315-1324`). Chip uses `variant="default | primary"` for emphasis (`0008-chip.md` F4). The PRD row names no tone (`:251`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Alert's five | `variant="neutral \| info \| success \| warning \| danger"` | One tone vocabulary with Alert for authors and agents. No brand-coloured badge without consumer CSS |
| (b) Alert's five plus `accent` | adds `variant="accent"`, the theme's brand role | Covers brand counts. A value Alert lacks, so the two vocabularies differ by one |
| (c) None | no `variant`; gray only | Smallest. Every coloured badge needs consumer tokens; an agent cannot express urgency |

### F7 — Fill

**Evidence.** The role aliases offer soft steps (`-bg` 3, `-text` 12, `-border` 7) and solid steps (`-solid` 9), and every role has `-contrast` for text on step 9 (`aliases.css:7-72`; `semantics.css:29`, `:56`, `:83`, `:110`). Alert uses the soft steps (`0006-alert.md` CSS custom properties); Button `primary` and Chip pressed `primary` use `-solid` with `-contrast` (`0002-button.md`; `0008-chip.md` CSS custom properties). A dot is a fill only, so a soft step 3 dot is faint on a step 1 or 2 surface [INFERENCE: not measured].

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Solid | `--line-badge-bg: var(--line-{role}-solid)`, `--line-badge-color: var(--line-{role}-contrast)` | A count or dot stands out on any surface. A neutral label badge is a dark gray pill, heavier than Alert's tone |
| (b) Soft, Alert parity | `-bg` fill, `-text` text, plus a `-border` | Matches Alert. A dot is a light tint that may not show on a tinted surface |
| (c) Both, through a second enum | `appearance="solid \| soft"` beside `variant` | Covers both uses. A second C6 axis, ten colour combinations to baseline |

### F8 — Anchoring over another element

**Evidence.** MANIFESTO Law 4 forbids a component importing another to compose its children (`docs/MANIFESTO.md:45`), and Phase 1 spec §6.C.6 requires "Import no other component; compose through slots" (`:1228`). ARCH §13.2 gives Avatar a `status` slot (`docs/ARCHITECTURE.md:605`). Button has a `suffix` slot (`:596`). The CSS Anchor Positioning module could tie a badge to any element [INFERENCE: support in Firefox and Safari against the PRD latest-2 target not checked].

| Option | What it decides | Consequence |
|---|---|---|
| (a) Wrapper Badge | Badge slots the anchor element and draws its badge over the anchor's corner, such as `<line-badge label="5"><line-avatar>…</line-avatar></line-badge>` | One element does overlay layout. The badge text moves to a prop or a named slot, the default slot means the anchor, and Badge owns positioning, an opinion beyond Static |
| (b) Placement attribute | a `placement="top-end \| …"` that absolutely positions the host inside the nearest positioned ancestor | Quick overlays. Depends on consumer `position: relative`, adds layout opinion, and does not follow the anchor's shape |
| (c) **Recommended.** Anchor's slot or consumer CSS | Badge stays inline; the anchor component offers a slot, as Avatar's `status`, and otherwise the docs show consumer CSS with `position: relative` and `::part(root)` | Law 4 and the Static tier hold. The overlay look depends on each anchor component or on consumer CSS |
| (d) CSS anchor positioning | an `anchor` attribute naming an anchor element id | No wrapper. Browser support unverified, and the badge's position no longer follows DOM order |

### F9 — Descriptor props

**Evidence.** The text binding writes a prop's string as the host's text content, so it lands in the default slot (Phase 1 spec §6.G.1, `:1312`, AM-092; `projection.ts:458-462`); Chip uses it for `label` (`packages/line-genui/src/catalog/descriptors/chip.ts:12`, `:23`). A `line` catalog `child` yields no visible text, because the `line` catalog has no `Text` and `childText` counts only basic `Text` (`projection.ts:168-184`; `0008-chip.md` F6). Enum props take plain `.describe()` (Phase 1 spec `:1324`); Alert's descriptor carries `variant` (`packages/line-genui/src/catalog/descriptors/alert.ts:14-19`, `:32`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `label` text binding and `variant` | `label` (`DynamicString`) through `{ kind: 'text' }`; `variant` → attribute; no slot map | Visible text on the agent path, no genui change, Chip's pattern. An agent count is a string; a bound number becomes its decimal string |
| (b) As (a) plus `count` and `max` | `count` and `max` (`DynamicNumber`) → properties | Needs F1 (c) and F3 (b). Numeric data for agents; two ways for an agent to set text |
| (c) `child`, Button parity | `child` (`ComponentId`) into the default slot | No visible text on the `line` catalog path, as Chip F6 (a) found |

### F10 — Agent name requirement

**Evidence.** The surface checks `requiredName` before render and turns a nameless node into a placeholder with `line-a2ui-error` (Phase 1 spec §6.G.4, `:1512-1513`; `descriptor.ts:160-167`). The name sources are `childText`, `textProp` and `accessibilityLabel` (`descriptor.ts:138-141`). With F9 (a), `[textProp label, accessibilityLabel]` passes a node with text or an `accessibility.label`, and fails only an agent dot with no `accessibility.label`. An agent cannot place a decorative dot next to words reliably, and WCAG 1.4.1 forbids meaning by colour alone.

| Option | What it decides | Consequence |
|---|---|---|
| (a) None required | no `requiredName`; an unnamed agent dot renders hidden | Agents can draw decorative dots. A dot whose meaning lives only in its colour passes unseen |
| (b) **Recommended.** Text or label required | `requiredName: [{ kind: 'textProp', prop: 'label' }, { kind: 'accessibilityLabel' }]` | Every agent dot is named, and every count or label is already text. An agent cannot make a purely decorative dot; one beside words is announced twice |

### F11 — htmx row

**Evidence.** The htmx row applies to value-bearing or compound components (plan §2.4, `docs/plans/01-plan-core-primitives.md:172`; template). Badge has no value prop (F9) and no interactive element (D4), so it is neither (ARCH §17.2 C3, C9). The Phase 1 spec expects `n/a` and leaves the confirmation here (§6.C.4 C9 row; §10 SD34, `:2381`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `n/a` | the Tests row says `n/a` with that reason | Confirms SD34. Server-swapped badge text is ordinary DOM, covered by the Unit tier's slot tests |
| (b) Run part (d) only | the harness swaps server content into the default slot under htmx 2 and 4 | Proves the slot swap through htmx. Runs a row the template reserves for value-bearing and compound components |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
| AM-001 | 2026-11-10 | ledger 01-C9 (decision — Miguel chose a solid dot and a soft fill for text badges over soft everywhere and over a solid fill on a darker step with new on-colour tokens, 2026-11-10) | Part A Description; Part B CSS custom properties table (`--line-badge-bg` and `--line-badge-color` default to `var(--line-<role>-bg)` and `var(--line-<role>-text)`, new `--line-badge-dot-color` defaulting to `var(--line-<role>-solid)`), the Variant defaults table, the fill and fallback bullets, C7 (nine `@cssprop`), D8 (nine tokens) and F7's Resolution. No border token | The step-9 `-solid` with `-contrast` pair guarantees only 3:1 (Phase 00 AM-014; `scripts/validate-contrast.mjs:18-24`), so 12px text on it fails axe `color-contrast` (4.5:1, Phase 1 spec §7.4, MANIFESTO Law 3). A dot holds no text and stays solid, as non-text UI held to 3:1 (WCAG 1.4.11) | axe 4.14 `color-contrast` on the C9 stories in `storybook-static`, chromium, 12px white text: gray-9 `#8b8d98` 3.3:1, blue-9 `#0090ff` 3.26:1, green-9 `#30a46c` 3.15:1, red-9 `#e5484d` 3.91:1, each against 4.5:1; warning (amber-9 with dark contrast) passes. The same stories fail in firefox and webkit |
| AM-002 | 2026-11-10 | ledger 01-C9 (factual correction, Verify gate reviewer) | Part B Agent contract, C6 row: each value redeclares `--line-badge-bg`, `--line-badge-color` and `--line-badge-dot-color` on `:host`, not only the first two. A grep of the live text for the two-token wording and the solid text fill found no other hit; the F7 option table keeps the solid option as the record of what Miguel weighed | AM-001 added `--line-badge-dot-color` to the variant rules and its change list missed the C6 row | `packages/line-components/src/badge/badge.ts:85-106` (each `:host([variant=…])` rule sets three tokens); `docs/specs/0007-badge.md:278` ("redeclare only the three colour tokens") |
