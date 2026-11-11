# AvatarGroup

| Field | Value |
|-------|-------|
| Status | `proposed` (2026-11-11). Miguel decided every fork, F1–F15, on 2026-11-11; approval follows the review gate |
| Phase | `1` |
| Tier | `Custom` (Phase 1 spec §6.C.4 C11 row, `docs/specs/01-spec-core-primitives.md:1167`; PRD §4.1, `docs/PRD.md:254`; ARCH §8, `docs/ARCHITECTURE.md:409`; ARCH §13.2, `docs/ARCHITECTURE.md:606`) |
| Tag | `line-avatar-group` |
| Entrypoint | `@websublime/line-components/avatar-group` (Phase 1 spec §4.2, `:250`, `:299`) |
| Form-associated | `no` (Phase 1 spec §6.C.4 C11 row) |
| PRD catalogue entry | PRD §4.1, `AvatarGroup` row (`docs/PRD.md:254`) |
| Ledger row | `01-C11` (`docs/plans/01-tasks-core-primitives.md:57`) |
| Governing sections | Phase 1 spec §4.2 (`:250`, `:261-269`, `:299`), §6.C.0, §6.C.4 (C11 row `:1167`, notes `:1147-1153`, `:1180-1181`), §6.C.6 (`:1218-1233`), §6.C.7 (`:1242-1272`), §6.G.1–§6.G.5, §7.4, §7.5, §10 SD4, SD10, SD18, SD21, SD31 (as amended by AM-095), SD34, SD37, SD38, SD39, SD84, SD98, SD99, §12 AM-058, AM-090, AM-095; ARCH (v0.8.27) §3, §5, §8, §12, §13.2, §14.7–§14.9, §17.2–§17.4; PRD §4.1, §4.3, §5.2, §8; MANIFESTO Laws 3–9, Out of Scope; R7 §2.4, §4, §6 OQ5; R8 §2.2, §3, §6 Q10; R9 §2.1; `0009-avatar.md` contract G1–G8 (G1 and G8 as amended by its AM-004), F7, F12 |

Text marked `[INFERENCE]` has no probe or source behind it yet. Miguel decided Open Questions F1–F11 on 2026-11-11, each on the option the draft recommended, and, after review gate round 1, F12–F15 the same day. Part B states those decisions. The orchestrator defaults D1–D19 stand as drafted (Miguel, 2026-11-11), with the review-gate edits and the new D20–D26 that the orchestrator directed. F7 (a) departs from the old wording of Phase 1 spec §10 SD31, which Phase 1 spec AM-095 amends.

---

## Probes

Throwaway probes ran on 2026-11-11 to inform F1–F4, F6, F7 and F14 and defaults D4, D6–D9, D13 and D16. Their code lived in `packages/line-components/temp/c11-probe/` and, for P9, `packages/line-components/temp/c11-probe2/`, which `.gitignore` ignores through its `temp` entry, and was deleted after each run. Nothing of it is committed.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2, arm64; Bun 1.4.3 |
| Runner | Playwright 1.64.0 with its own engines, chromium 156.0.8078.4, firefox 157.0 and webkit 27.2; one config with three projects, one worker |
| Avatars | the built `@websublime/line-components` `./avatar` (`dist/avatar/index.js` of this branch, rebuilt first), bundled with Lit and `line-core` by `bun build` into one module and added to each page; every case used real `<line-avatar name="Person N">` hosts |
| Probe hosts | plain `HTMLElement`s with an open shadow root and no Lit: `<probe-pop>` (a `+3` `<button popovertarget>` and a `<div popover="auto">` holding a shadow link and a `pop` slot), `<probe-stack>` (modes `nth`, `manual`, `list-wrap`, `manual-list` and `group`, below) and `<probe-focus>` (a default slot and an inner `+3` button, `delegatesFocus` on or off) |
| axe | `@axe-core/playwright` 4.14.0 with axe-core 4.14.0, once with the §7.4 tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and once with every rule; `label-content-name-mismatch` also run on its own |
| Chromium accessibility tree | a CDP session, `Accessibility.getFullAXTree`, walked from each case's wrapper through `DOM.querySelector` and `DOM.describeNode`, reading `role`, `name` and the `expanded` property of every node that is not ignored |
| Other engines | Playwright's `ariaSnapshot()`, which Playwright computes itself from the DOM, and an internals read-back |

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `bun --filter '@websublime/line-core' build && bun --filter '@websublime/line-components' build` | 0 | fresh `dist/` for the avatar bundle |
| 2 | `bun build ../../dist/avatar/index.js --outfile avatar.bundle.js --target browser --format esm` in the probe folder | 0 | one 64 KB module |
| 3 | `bunx playwright test -c packages/line-components/temp/c11-probe/playwright.config.ts` | 0 | 15 passed (30.6 s); P1–P5 below |
| 4 | `bun run packages/line-components/temp/c11-probe/happy.ts` | 0 | P7 |
| 5 | `npm view @zag-js/popover@1.47.0 dependencies --json`; `npm view @zag-js/popover dist-tags --json` | 0 | P8 |
| 6 | `npm install @zag-js/popover@1.47.0 @zag-js/vanilla@1.47.0 @zag-js/core@1.47.0 --no-save --ignore-scripts --no-package-lock` in `temp/c11-probe/zag/`, then `bun build <entry>.ts --minify --target browser` and `gzip -9 -n -c <out> \| wc -c` for two entries | 0 | P8 |
| 7 | `node v.mjs` printing `browser.version()` per engine | 0 | the versions above |
| 8 | `node cls.mjs` (Chromium only) | 0 | P6 |
| 9 | `rm -rf packages/line-components/temp/c11-probe`, after rows 3–7 and again after row 8; `git status --short` | 0 | deleted; the tree is clean |
| 10 | `bunx playwright test -c packages/line-components/temp/c11-probe2/playwright.config.ts` (review gate round 1) | 0 | 15 passed (19.4 s); P9 |
| 11 | `rm -rf packages/line-components/temp`; `git status --short` | 0 | deleted; the tree is clean |

WebKit on macOS moved Tab focus with Alt+Tab, as the existing Browser tier does. "Same" in a column means the result of the chromium column.

### P1 — Native `popover` in a shadow root

`<probe-pop>` held the trigger `<button id="t" popovertarget="p">+3</button>` and the panel `<div id="p" popover="auto">` in one shadow root, with a shadow link in the panel and a light-DOM link slotted into it. One host anchored the panel through `anchor-name` on the trigger and `position-anchor` plus `position-area: block-end span-inline-end` on the panel; a second host set only `position-area`, relying on the implicit anchor that `popovertarget` gives.

| Check | chromium | firefox | webkit |
|---|---|---|---|
| `'popover' in HTMLElement.prototype`; `CSS.supports` of `anchor-name`, `position-area` and `top: anchor(bottom)` | all `true` | same | same |
| Tab from a button before the host | focus on the shadow trigger | same | same |
| Enter on the trigger | the panel opens (`:popover-open`) | same | same |
| Tab, Tab, Tab while open | the shadow link in the panel, then the slotted light-DOM link, then the button after the host | same | same |
| Shift+Tab three times | back on the trigger | same | same |
| Escape while focus is on the link inside the panel | closes; focus on **`body`** | closes; focus on the trigger | closes; focus on the trigger |
| `trigger.click()` from script | opens | same | same |
| A pointer click outside | closes; focus on `body` | same | same |
| A mouse click on the trigger | opens; focus on the trigger | same | opens; focus stays on `body`, as WebKit on macOS does for a clicked button (`0004-button-group.md` P1) |
| Escape after that mouse open | closes; focus on the trigger | same | closes; focus on `body` |
| A second click on the trigger | closes | same | same |
| Named anchor: panel box against trigger box | panel top 29 = trigger top 8 + height 21; same inline start | 31 = 9 + 22; same inline start | 26 = 8 + 18; same inline start |
| Implicit anchor, `position-area` only | panel top 250.5 = 229.5 + 21; same inline start | 253 = 231 + 22 | 246.69 = 228.69 + 18 |
| A second host's `auto` panel opened while the first is open | the first closes | same | same |
| Pointer moved from the host onto its open panel (top layer, outside the host's box), five steps | no `pointerleave` on the host; host `:hover` `false` | `pointerleave` then `pointerenter` during the move; host `:hover` `true` | no `pointerleave`; host `:hover` `false` |
| Chromium accessibility tree | `button "+3"` with `expanded=true` while open and `expanded=false` while closed; the open panel is a `group ""` holding both links | not observable | not observable |
| `ariaSnapshot()` | `button "+3"` with no `[expanded]` in either state; while open the two links follow it | same | same |

- The native popover gives Escape, light dismiss, Tab order after the trigger and anchoring below it in all three engines.
- Focus return after Escape from inside the panel differs: Chromium leaves focus on `body`.
- Chromium derives `expanded` from `popovertarget`; Playwright's snapshot does not, and no check here reads Firefox or WebKit exposure.
- The host's hover state over its top-layer panel differs by engine, so `pointerleave` cannot be the only signal that the pointer left the group while the panel is open.

### P2 — Hiding avatars past `max`

`<probe-stack mode="nth">` rendered `<style>::slotted(:nth-child(n + 4)) { display: none }</style><slot>`. `<probe-stack mode="manual" max="3">` attached its shadow root with `slotAssignment: 'manual'`, rendered `<slot id="vis">`, the `+N` trigger and `<div popover="auto"><slot id="rest"></slot></div>`, and called `vis.assign(...first three)` and `rest.assign(...the others)`. Visibility is `checkVisibility()`.

| Check | chromium, firefox and webkit |
|---|---|
| `nth`, six avatars | avatars 1–3 visible, 4–6 not |
| `nth`, a `<span>` first, then five avatars | the span and avatars 1–2 visible, 3–5 not: `:nth-child` counts every element |
| `manual`, panel closed | avatars 1–3 visible, 4–6 not; `assignedSlot` is `vis` for 1–3 and `rest` for 4–6 |
| `manual`, panel open | all six visible |
| `ariaSnapshot()`, panel closed | `img "Person 1"`…`"Person 3"`, `button "+N"` |
| `ariaSnapshot()`, panel open | the same, then `img "Person 4"`…`"Person 6"` |
| axe, `nth` and `manual` cases | no violation, with the §7.4 tags and with every rule |
| `manual`: append a seventh avatar to the host | no `slotchange`; the new avatar has no `assignedSlot` and is not rendered |
| `manual`: remove avatar 1 | one `slotchange` (the `vis` slot lost a node) |
| `manual`: run the assignment again | two more `slotchange` events; avatar 4 moves to `vis` |

| Chromium accessibility tree | Result |
|---|---|
| `manual`, panel closed | three `image` nodes, `button "+N"` with `expanded=false`; avatars 4–6 absent |
| `manual`, panel open | the same with `expanded=true`, then `group ""` holding `image "Person 4"`…`"Person 6"` |

### P3 — Group semantics and the `+N` name

`<probe-stack mode="group">` set `internals.role = 'group'` and rendered a bare `<slot>`. `list-wrap` rendered `<div role="list" aria-label="Project members"><slot></slot></div>`. `manual-list` rendered `<div role="list" aria-label="Project members">` holding one `<div role="listitem"><slot></slot></div>` per avatar, each avatar assigned to its own slot.

| Case | Chromium accessibility tree | `ariaSnapshot()` (three engines) | axe (three engines, tags and every rule) |
|---|---|---|---|
| `group`, host `aria-label="Project members"` | `group "Project members"` over three `image` nodes | three `img`, **no group node** | none |
| `group`, unnamed | `group ""` over three `image` nodes | three `img` | none |
| `list-wrap` | `list "Project members"` over three `generic` hosts, each over its `image` | `list "Project members"` over three `img` | **`aria-required-children`** |
| `manual-list` | `list` → `listitem` → `image`, three times | `list` → `listitem` → `img`, three times | none |
| `<button>+3</button>` | — | — | none |
| `<button aria-label="Show all members">+3</button>` | — | — | **`label-content-name-mismatch`**, with the tags and alone |
| `<button aria-label="+3 more members">+3</button>` | — | — | none |

- The internals read-back of the `group` case is `group` in all three engines.
- A `list` role around one default slot fails axe, because the slotted avatar hosts are not `listitem`s; a list needs a `listitem` wrapper per avatar, which only manual assignment can build in the shadow root without writing on the avatars.
- A name that leaves out the visible "+3" fails axe's label-in-name check (WCAG 2.5.3).

### P4 — Pointer, focus and `delegatesFocus`

| Check | chromium | firefox | webkit |
|---|---|---|---|
| Mouse click on a slotted avatar inside a host with `delegatesFocus: true` | focus moves to the host's inner `+3` button; the host gets `focusin` | same | no focus move; focus on `body` |
| The same without `delegatesFocus` | focus on `body` | same | same |
| Mouse moved across a host holding two avatars | one `pointerenter` and one `pointerleave` on the host, `pointerType` `mouse`; `pointerover` and `pointerout` per child | same | same |
| Tab into the host | focus on the inner button; one `focusin`; the host matches `:focus-within` | same | same |

### P5 — Touch tap

A context with `hasTouch: true` tapped a slotted avatar, then a point elsewhere.

| Check | chromium | firefox | webkit |
|---|---|---|---|
| Tap on an avatar | `pointerover`, `pointerenter`, `pointerdown`, `pointerup`, `pointerout`, `pointerleave`, all `pointerType` `touch`; then `mouseover`, `mouseenter` and `click` (`pointerType` `touch`); host `:hover` stays `true` | the six pointer events only; no compatibility mouse event and no `click` reached the host; `:hover` `false` | as chromium, with `click` reporting `pointerType` `mouse`; `:hover` `true` |
| Tap elsewhere | `mouseleave`; `:hover` `false` | nothing; `false` | nothing; `false` |

- A tap gives `pointerenter` and `pointerleave` around the press, and Chromium and WebKit keep `:hover` on the host until the next tap elsewhere.
- Firefox delivered no `click` to the host [INFERENCE: a property of Playwright's Firefox touch emulation; not checked on a touch device].

### P6 — Layout shift from expansion (Chromium)

A page held two rows of three 32 px circles overlapping by 8 px, each followed by text. On `:hover` one row widened its gaps through `margin-inline-start` and the other moved its circles with `transform`. A `PerformanceObserver` on `layout-shift` recorded the entries after the mouse moved onto each row.

| Expansion | Entries |
|---|---|
| `margin-inline-start` | one, value 0.0005, `hadRecentInput: true` |
| `transform` | none |

- Chromium reported the hover-driven shift with `hadRecentInput: true`, so it does not count toward Cumulative Layout Shift [INFERENCE: Firefox and WebKit expose no `layout-shift` entries to check].

### P7 — happy-dom 20.14.6

| Check | Result |
|---|---|
| `attachShadow({ mode: 'open', slotAssignment: 'manual' })` | `slotAssignment` reads `manual` |
| `HTMLSlotElement.assign` | a function; `assignedElements()` returns the assigned nodes |
| `assignedSlot` of a manually assigned node | `null` |
| `showPopover` on a `popover` element | `undefined`; no `toggle` event |
| `ToggleEvent` | not defined (review gate round 1, supervisor lens's throwaway probe; deleted) |
| `matches(':popover-open')` | `false`, without throwing (same probe) |

- The unit tier can open no panel and can build no `ToggleEvent`, so it dispatches a plain `Event('toggle')` with a `newState` field, which the host reads as it reads `ToggleEvent.newState` (D22). The D8 fallback reads `:popover-open` and is tested in the Browser tier only.

### P8 — `@zag-js/popover` 1.47.0

| Check | Result |
|---|---|
| `dist-tags` | `latest` 1.47.0, `next` 2.0.0-next.3 |
| `dependencies` | `@zag-js/core`, `types`, `utils`, `popper`, `anatomy`, `dom-query`, `focus-trap`, `aria-hidden`, `dismissable`, `remove-scroll`, each pinned to 1.47.0 |
| Minified, gzipped: `machine`, `connect` and `VanillaMachine` | 29,921 B |
| Minified, gzipped: `createMachine` and `VanillaMachine` | 5,628 B |
| Difference | 24,293 B, which matches R7's "about 24 KB" (`docs/research/01-research-zag-machines.md:276-277`) |

### P9 — Keeping "+N" under the pointer (review gate round 1)

The review gate found that the expansion of D4, as drafted, moves "+N" from under a pointer that enters straight onto it. P9 measured that layout and the candidates that keep "+N" in place.

`<probe-layout>` was a plain `HTMLElement` with a manually assigned shadow root: five children, `max` 3, one `item` wrapper and slot per stack child, a `+2` `<button popovertarget>` and a `popover="auto"` panel holding the rest. Circles were 32 px with a 2 px ring, the collapsed overlap 8 px, the expanded gap 4 px, the transition 100 ms; the host set `data-expanded` on a `pointerenter` that was not touch. The pointer moved from (0, 0) straight onto the centre of "+N" in one step, waited 400 ms, then pressed and released at the same point. Positions are `getBoundingClientRect` x in CSS px; the element under the pointer is `shadowRoot.elementFromPoint`. Layout shift is a Chromium `PerformanceObserver` on `layout-shift`.

| Layout | What it does |
|---|---|
| A, as drafted | the stack sits at the host's inline-start; `margin-inline-start` goes from −8 px to +4 px on each wrapper after the first and on "+N"; the host grows toward inline-end |
| B, A anchored by the consumer | A inside a 500 px flex container with `justify-content: flex-end`, so the host's inline-end edge is fixed by the page |
| C, "+N" first | A with `order: -1` on "+N", so "+N" sits at inline-start and the avatars after it grow toward inline-end |
| D, nested translate | the wrappers nest, `[[[a1] a2] a3] +N`, each with the static rule `:host([data-expanded]) .n { translate: -12px 0 }` (mirrored under `:dir(rtl)`), so avatar k moves (4 − k) × 12 px toward inline-start and no box changes size |

| Layout | "+N" x, collapsed → expanded | Host x and width | First avatar x | Under the pointer after expansion | Click opens the panel | Chromium layout shift |
|---|---|---|---|---|---|---|
| A | 159.53 → 195.53 (+36) | 87.53, 104 → 140 | 87.53 → 87.53 | avatar 3 (`span#k3`) in chromium and webkit, its wrapper in firefox | **no**, in all three | three entries, 0.0001–0.0004, `hadRecentInput: true` |
| B | 508 → 508 (0) | 436 → 400, 104 → 140 | 436 → 400 | "+N" | yes, in all three | four entries, 0–0.0001, `hadRecentInput: true` |
| C | 87.53 → 87.53 (0) | 87.53, 104 → 140 | 111.53 → 123.53 | "+N" | yes, in all three | four entries, 0.0001–0.0003, `hadRecentInput: true` |
| D | 219.06 → 219.06 (0) | 147.06, 104 → 104 | 147.06 → 111.06 | "+N" | yes, in all three | none |
| D, `dir="rtl"` | 1102.69 → 1102.69 (0) | 1102.69, 104 → 104 | 1174.69 → 1210.69 | "+N" | yes, in all three | none |

- The numbers were the same in chromium, firefox and webkit to 0.02 px; the table shows chromium's.
- A moves "+N" by 3 × (8 + 4) = 36 px, wider than the 32 px button, so a pointer that enters on "+N" ends over avatar 3 and its click does not open the panel.
- B keeps "+N" fixed only because the page anchors the group's inline-end; the component cannot require it.
- C keeps "+N" fixed at the cost of the count coming before the faces, against the target visual's trailing "+3".
- D keeps "+N" fixed with no layout change at all; the spread avatars overlap 36 px of the content before the group, and an ancestor with `overflow: hidden` would clip them [INFERENCE: clipping not probed].

### What the probes settle

- The native `popover` attribute works inside a shadow root in all three engines: it opens from `popovertarget`, dismisses on Escape and outside click, puts the panel after the trigger in Tab order and anchors it under the trigger without a named anchor (P1; F1).
- A component built on it must restore focus after Escape itself, because Chromium drops it to `body` (P1; D7).
- Manual slot assignment shows the first `max` avatars in the stack and the rest inside the panel, writes nothing on the avatars, passes axe, and keeps hidden avatars out of the accessibility tree until the panel opens (P2; F3, F4).
- Manual assignment fires no `slotchange` when a child is added, so the group must observe its children (P2; D13).
- `::slotted(:nth-child())` hides by element position, counting non-avatar children (P2; F4).
- A `group` role through internals is visible only to the Chromium tree and the read-back; a `list` needs one `listitem` per avatar (P3; F6).
- The overflow button's name must contain its visible "+N" (P3; F7).
- `delegatesFocus` would move focus to the overflow button when a user clicks an avatar in Chromium and Firefox (P4; D6).
- A touch tap fires `pointerenter` and `pointerleave` and leaves `:hover` stuck in two engines (P5; F2).
- The `@zag-js/popover` route costs 24.3 KB gzipped (P8; F1).
- Only a layout that keeps "+N" in place lets a pointer that enters on "+N" open the panel with one click; the drafted layout fails in all three engines (P9; F14).

### What automation cannot observe

- What a screen reader says for any case, and whether it reads the expanded state of a `popovertarget` button in Firefox and WebKit [INFERENCE: not run].
- Firefox and WebKit exposure of an internals role to assistive technology (Phase 1 spec `:1180`; §12 AM-058).
- Touch behaviour on a real device (P5 is Playwright's emulation).

---

## Part A — Requirements

### Overview

#### Description

`<line-avatar-group>` shows a row of overlapping avatars for the people or organisations on something, such as the members of a project, and ends the row with a "+N" count when there are more than fit (PRD §4.1, `docs/PRD.md:254`). The consumer puts `<line-avatar>` elements in it and sets `max` to how many show. The rest move into a panel that the "+N" button opens (ARCH §13.2, `docs/ARCHITECTURE.md:606`; F1, F3). When the pointer rests on the group, or keyboard focus enters it, the avatars spread apart so each face shows whole (F2). The group never imports Avatar: it takes its children through its slot, sets their size and ring through inherited `--line-avatar-*` tokens, and never writes on them (Phase 1 spec §10 SD4, `:2351`; `0009-avatar.md` contract G1–G8; F4). A custom machine with the states `collapsed`, `expanded` and `overflow_open` drives it (ARCH §13.2). It holds no value and commits nothing (ARCH §17.2 C9, `docs/ARCHITECTURE.md:1580`).

#### Use cases

- The members of a project or a document beside its title, with "+4" for the rest (target visual: overlapping circles with a gap ring and a "+3" circle).
- The people in a call or a chat thread, in a header.
- The assignees of a task in a table row, where space allows two or three faces.
- A stack whose avatars are links to profiles, each `<line-avatar>` inside an `<a>` (`0009-avatar.md` probe P5; F5).
- An agent-built group on `<line-a2ui-surface>` from a `line` catalog `AvatarGroup` node with `Avatar` children (Phase 1 spec §6.C.4 C11 row, `agentExposed: true`; F10).

#### Anti-patterns

- A single person. Use `<line-avatar>` alone (`0009-avatar.md`).
- A list of people with their names written out, such as a member directory. Use a list of rows, each with an avatar beside the name; a stack hides faces behind each other.
- Pictures that must not overlap, such as a gallery. Use `<line-stack orientation="horizontal">`.
- A selector of people, where clicking an avatar picks someone. The group has no selection; Phase 2 choice components cover selection.
- Rich content on hover, such as a profile card. Use Hover Card (Phase 3; PRD §4.3, `docs/PRD.md:298`).
- A group with no room before it. While the stack is spread, its avatars move toward inline-start and overlap up to (avatars in the stack) × (`--line-avatar-group-overlap` + `--line-avatar-group-gap`) of the content before the group, 36 px with the defaults and `max="3"`, and an ancestor with `overflow: hidden` clips them [INFERENCE: clipping not probed]. Leave that much space at the group's inline-start, or set `max` (F14; probe P9).

#### User expectations

- The avatars overlap to save space and are separated by a thin ring in the page colour (`0009-avatar.md` G3; D10).
- Moving the mouse onto the group, or moving keyboard focus into it, spreads the avatars apart; moving away, or tabbing out, stacks them again; Escape stacks them at once, and they stay stacked until the pointer and focus have left (F2, F13; D25).
- A touch tap, on an avatar, an avatar link or "+N", spreads nothing by itself; a tap on "+N" opens the panel, and the stack is spread while the panel is open (probe P5; F2, F13; D2).
- A pointer that enters straight onto "+N" can open the panel with one click; "+N" does not move while the stack spreads, because the avatars spread toward inline-start (probe P9; F14).
- "+N" is one button: Enter, Space or a click opens the panel with the remaining avatars, and Escape, a click outside or a second press closes it (probe P1; F1).
- After Escape closes the panel, focus is back on "+N" (D7).
- A screen reader announces a group named by the consumer, the visible avatars by their names, and a "+N" button that is collapsed or expanded, with the consumer's wording if given (F6, F7).
- Consumer CSS on `line-avatar-group`, its tokens, `::part(root)`, `::part(overflow)` and `::part(content)` overrides every visual default (ARCH §4).

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| `<line-avatar>` | child | the default slot. The group counts any element child as one avatar and never matches a tag (F5), sets `--line-avatar-size` and `--line-avatar-ring-width` on its own host for inheritance (`0009-avatar.md` G1–G3; F8), and assigns each child to the stack or the panel without writing on it (F4). It never imports Avatar (MANIFESTO Law 4, `docs/MANIFESTO.md:45`; Phase 1 spec §10 SD4, `:2351`; §6.C.6, `:1228`) |
| `<a>`, `<line-button>` | child wrapper | an avatar inside a link or a button is one child; the size and ring reach the avatar by inheritance through the wrapper (`0009-avatar.md` probe P5) |
| `<line-badge>` | grandchild | the `status` slot of each avatar; the group leaves its visibility alone (F9) |
| `<line-stack>` | sibling | the alternative for pictures that must not overlap (Anti-patterns) |
| `<line-a2ui-surface>` | orchestrator | creates `line-avatar-group` by tag from a `line` catalog `AvatarGroup` node, puts the `children` in the default slot, writes `max`, `size`, `spacing` and `overflow-label`, and sets `accessibility.label` as the host `aria-label` (ARCH §17.4; F10) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| none | — | — |

- AvatarGroup has no semantic variant (ARCH §17.2 C6, `docs/ARCHITECTURE.md:1577`).
- `size` and `spacing` are steps on token scales, as Stack's `gap` is (`packages/line-components/src/stack/stack.types.ts`), not variants (Props; F8).

---

## Part B — Technical Specification

### Anatomy

Decisions F1, F3, F4, F6 and F15 shape this tree.

```
<line-avatar-group>                      LineElement (not FormAssociated); ElementInternals role "group" (F6);
│                                        shadowRootOptions.slotAssignment = 'manual' (F4); the host is the flex row
└── #shadow-root
    ├── <span class="level">              the outermost of N nested levels, N the number of children in the stack, the first `max`
    │   │                                children without `hidden`; level k holds level k − 1 and the item of child k (D20)
    │   ├── <span class="level"> …        the same, one level down, to level 1, which holds only the item of child 1
    │   └── <span class="item">          the wrapper of child k
    │       └── <slot>                   that child alone, assigned by the group (F4)
    ├── <span part="root">               wraps the "+N" control and carries its focus ring (F15);
    │   │                                rendered while some child is past `max`, or while the panel is open (D3, D21)
    │   └── <button part="overflow"      type="button", popovertarget="content", aria-expanded, aria-controls="content" (D8)
    │       └── "+N"                     N formatted for the host's language (D15)
    └── <div part="content" id="content" the overflow panel, in the top layer while open (F1; D9)
             popover="auto">
        └── <slot>                       the children past `max`, assigned by the group (F3)
```

- The zones follow ARCH §13.2 (`docs/ARCHITECTURE.md:606`). The parts take their names from ARCH §5: `root`, "Main container" (`:306`), here the container of the "+N" control; `overflow`, "Overflow indicator (e.g., avatar group +N)" (`:327`); and `content`, "Content area" (`:308`). The overflow control and the panel are internal parts because the machine coordinates them; the avatars are slotted because the consumer decides them (ARCH §3, `:219-226`).
- The host extends `LineElement` (`packages/line-core/src/line-element.ts:31-36`) without the `FormAssociated` mixin, so `this[INTERNALS]` carries the role and `reflectState` the flags (ARCH §14.8, `:1190`). `:host { display: inline-flex; align-items: center }` and `:host([hidden]) { display: none }`, because `display` on `:host` beats the UA `[hidden]` rule (`0007-badge.md` D3).
- The shadow root uses manual slot assignment (F4). The group renders one `item` wrapper with its own slot per child in the stack, nested in `level` wrappers so that every child sits one level deeper than the child after it, and assigns each child to its wrapper's slot or to the panel slot in `updated()` (D20). It writes no attribute on any child, and a child's own `slot` attribute has no effect (probe P2). Text children are never assigned and never render.
- The `level` and `item` wrappers carry only the overlap and the expansion and paint nothing, so they expose no part; the avatar in each item is the consumer's own element (D20).
- The shadow root does not delegate focus (D6).
- The overflow button is a native `<button>` (Phase 1 spec §10 SD31, `:2378`, as amended by §12 AM-095; §6.C.4 C11 row), so the group takes the `common` and `button` reset modules (ARCH §14.7, `:1162`; §10 SD84, `:2431`). It takes its name from `overflow-label`, not from the host `aria-label` (F7; AM-095).
- The stack spreads toward inline-start while "+N" and the host box stay put: each `level` moves one step by `translate` while the stack is expanded (F14; probe P9; D4).

### States

| Field | Value |
|-------|-------|
| Machine | a custom `createMachine()` on `@zag-js/core` 1.47.0, `avatarGroupMachine` in `packages/line-components/src/avatar-group/avatar-group-machine.ts`, run through `LineMachineController` (ARCH §8, `:409`; §13.2; Phase 1 spec §6.C.4 C11 row; D1). The component never imports `@zag-js/vanilla` (Phase 1 spec §10 SD13) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| `collapsed` | start; `SETTLE` in `expanded` while no source remains or `dismissed` is set; `HOVER.END` or `FOCUS.OUT` in `expanded` that leaves no source; `DISMISS` in `expanded` | `HOVER.START` or `FOCUS.IN` while not dismissed; `OPEN.CHANGE { open: true }` | none |
| `expanded` | `HOVER.START` or `FOCUS.IN` in `collapsed` while not dismissed; `OPEN.CHANGE { open: true }` in `collapsed`, on its way to `overflow_open`; `OPEN.CHANGE { open: false }` in `overflow_open` | `HOVER.END` or `FOCUS.OUT` that leaves no source; `DISMISS`; `SETTLE` while no source remains or `dismissed` is set; `OPEN.CHANGE { open: true }` | `data-expanded`, `:state(expanded)` (ARCH §14.8, `:1232`) |
| `overflow_open` | `OPEN.CHANGE { open: true }` in `expanded` | `OPEN.CHANGE { open: false }` | `data-expanded`, `:state(expanded)` and `data-open`, `:state(open)` (`:1236`; D2) |

| Machine member | Shape |
|---|---|
| Props | `overflowCount: number`, the number of children past `max`, `0` when none (D23); `restoreFocus(): void`, which focuses the overflow button (D7). The host passes both through its live props function |
| Context | `hovered: boolean` (a mouse or pen pointer is on the host); `focused: boolean` (keyboard focus is within the host, the panel and slotted children included; F13); `dismissed: boolean` (D25); `focusVisible: boolean` (the overflow button has keyboard focus) |
| Events | `HOVER.START` and `HOVER.END` from `pointerenter` and `pointerleave` on the host whose `pointerType` is `mouse` or `pen` (F2; probe P5); `FOCUS.IN` from a `focusin` on the host whose focused element, the first entry of `event.composedPath()`, matches `:focus-visible` (F13); `FOCUS.OUT` from a `focusout` whose `relatedTarget` is outside the host and its panel; `DISMISS` from Escape on the host while the panel is closed (F2; D25); `OPEN.CHANGE { open, focusInside }` from the panel's `toggle` event, with `open` read from `ToggleEvent.newState` (D22) and `focusInside` recorded at the `beforetoggle` that preceded a close (D7); `SETTLE`, which the machine sends itself; `FOCUS.VISIBLE { visible }` from the overflow button's `focus` and `blur` |
| Actions | `setHovered`, `clearHovered`, `setFocused`, `clearFocused`, `setDismissed`, `clearDismissed` (on `HOVER.END` and `FOCUS.OUT`; D25), `forward` (sends the `OPEN.CHANGE` it handled again), `settle` (sends `SETTLE`), `restore` (calls `restoreFocus` when `focusInside` is `true`), `setFocusVisible` |
| Guards | `notDismissed`; `noSource` (neither `hovered` nor `focused`); `settles` (`noSource` or `dismissed`); `hasOverflow` (`overflowCount > 0`) |

- **Strict chain.** The machine moves only between neighbours of ARCH §13.2's chain, `collapsed ↔ expanded ↔ overflow_open` (`docs/ARCHITECTURE.md:606`; F12). `OPEN.CHANGE { open: true }` in `collapsed` moves to `expanded`, and its `forward` action sends the same event again, which moves `expanded` to `overflow_open`. `OPEN.CHANGE { open: false }` in `overflow_open` moves to `expanded` with the `restore` and `settle` actions, and `SETTLE` then moves to `collapsed` when `settles` holds. One platform event therefore passes through `expanded` in two transitions. `@zag-js/vanilla` 1.47.0 queues each `send()` in a microtask (`0004-button-group.md` probe P7), so the intermediate `expanded` lasts one microtask [INFERENCE: whether Lit renders between the two steps is not probed; the flags end in the right state either way].
- **Opening.** `OPEN.CHANGE { open: true }` is taken only while `hasOverflow` holds, so an event that arrives after the last overflowed child left changes nothing.
- **The platform opens and closes the panel.** `popovertarget` opens it on a click, Enter or Space, and Escape, a click outside, a second press or another `auto` popover closes it (probe P1). The machine follows the panel's `toggle` events. The one call the host makes on the panel is `hidePopover()` in `updated()`, when the panel is open and no child is past `max` any more (D21).
- **Pointer over the open panel.** In `overflow_open`, `HOVER.END` only clears `hovered`, so moving the pointer onto the top-layer panel never collapses the group, whatever the engine reports (probe P1).
- **Touch.** A touch pointer sends no `HOVER.*`, and a tap that focuses the overflow button or an avatar link does not match `:focus-visible`, so it sends no `FOCUS.IN` (F2, F13). A tap on "+N" opens the panel through `collapsed → expanded → overflow_open`, so the stack is spread while the panel is open (D2).
- **Timing.** The host reads the state in `update()` and never right after `send()`.
- **Fallback.** If the machine fails to start, the controller's fallback leaves the group collapsed with no expansion; the overflow button and the panel still work, because the platform runs them (MANIFESTO Law 9, `docs/MANIFESTO.md:55`; F1). The host then writes `aria-expanded` from the panel's `:popover-open` itself (D8).

| Flag | Source | Host reflection |
|------|--------|-----------------|
| `expanded` | machine state `expanded` or `overflow_open` | `data-expanded`, `:state(expanded)` |
| `open` | machine state `overflow_open` | `data-open`, `:state(open)` |
| `focus-visible` | machine context `focusVisible`, set from the overflow button's `focus` when it matches `:focus-visible` and cleared on `blur` | `data-focus-visible`, `:state(focus-visible)` (ARCH §14.9, `:1250`) |

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ChildList` | the avatars, in order: `<line-avatar>` elements, or one wrapper element per avatar such as `<a href><line-avatar></a>`. Every element child without `hidden` counts as one avatar (F5; D14). The first `max` show in the stack, the rest in the panel (F3, F4) |

- Under manual assignment the public default slot is a set of internal slots: one per `item` wrapper and one in the panel (D20). They have no names; a child never targets them with a `slot` attribute (F4).

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<span>` | the container of the "+N" control: its box, radius and default focus ring under `[data-focus-visible]` (F15) |
| `overflow` | `<button>` | the "+N" control: an avatar-sized circle with the count and the panel trigger |
| `content` | `<div popover="auto">` | the panel that holds the avatars past `max`: box, background, border, shadow and position |

- ARCH §14.9 says "Each interactive component draws a default ring on `::part(root)` under `[data-focus-visible]`" (`docs/ARCHITECTURE.md:1250`). The group's only interactive element is the "+N" control, so `root` wraps that control and not the stack; the host stays the flex row, as ButtonGroup's host is (`0004-button-group.md` Anatomy; F15).

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `max` | `max` | `number \| undefined` | `undefined` | no | how many avatars show in the stack; the rest go to the panel. Missing, not an integer, or below 1 means no limit (D3) |
| `size` | `size` | `'1' \| '2' \| '3' \| '4' \| '5' \| undefined` | `undefined` | yes | the avatar size step: `--line-size-5`, `-6`, `-7`, `-8` or `-9`; missing or unknown leaves `--line-avatar-size` undeclared, so the avatars keep their own default or an inherited value (F8) |
| `spacing` | `spacing` | `'0' \| '1' \| '2' \| '3' \| undefined` | `undefined` | yes | the overlap step of the collapsed stack: `0`, `--line-size-1`, `-2` or `-3`; missing or unknown keeps the `--line-avatar-group-overlap` default, `--line-size-2` (F8) |
| `overflowLabel` | `overflow-label` | `string` | `''` | no | the overflow button's accessible name, with every `{count}` replaced by the formatted count, such as `"+{count} more members"`; a label without `{count}` follows the visible "+N" and a space; blank means the visible "+N" is the name (F7; D24) |

- `size` and `spacing` follow Stack's `gap`: the converter returns `undefined` for an unknown value, and the attribute keeps what the author wrote (`packages/line-components/src/stack/stack.ts:24-27`).
- The host `aria-label`, `aria-labelledby` and `aria-description` attributes name the internals role directly, so nothing is copied (F6; `0004-button-group.md` decision D1).
- No `expanded` or `open` property: the user and the platform drive both, and the state is read from the flags (D12).

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

- AvatarGroup is neither value-bearing, because no binding names a value prop (F10), nor compound: "AvatarGroup is not compound, because its expand control and overflow popover commit nothing" (ARCH §17.2 C9, `docs/ARCHITECTURE.md:1580`; plan §2.4, `docs/plans/01-plan-core-primitives.md:173`). Opening a popup commits nothing (C9).
- The panel's `toggle` event stays inside the shadow root [INFERENCE: `toggle` is not composed]; consumers read `data-open` (D12).
- The class JSDoc carries no `@fires`.

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-avatar-group-overlap` | `var(--line-size-2)`; `spacing` steps `0`, `var(--line-size-1)`, `var(--line-size-2)`, `var(--line-size-3)` | each `item` after a `level`, and `root`, as a negative `margin-inline-start` (D20) |
| `--line-avatar-group-gap` | `var(--line-size-1)` | with the overlap, the step `overlap + gap` each `level` moves by `translate` while expanded (D4, D20) |
| `--line-avatar-group-duration` | `var(--line-motion-fast)` | the `translate` transition of each `level`; `0s` under `prefers-reduced-motion: reduce` |
| `--line-avatar-group-focus-ring` | `var(--line-focus-ring, 2px solid currentColor)` | `root`, as `outline` under `:host([data-focus-visible])` (ARCH §14.9, `:1250`; F15) |
| `--line-avatar-group-content-bg` | `var(--line-gray-1, Canvas)` | `content` |
| `--line-avatar-group-content-border-color` | `var(--line-gray-border)` | `content` |
| `--line-avatar-group-content-border-width` | `var(--line-border-1)` | `content` |
| `--line-avatar-group-content-radius` | `var(--line-radius-2)` | `content` |
| `--line-avatar-group-content-shadow` | `var(--line-shadow-3)` | `content` |
| `--line-avatar-group-content-padding` | `var(--line-size-2)` | `content` |
| `--line-avatar-group-content-gap` | `var(--line-size-1)` | `content` (`gap` between the panel's avatars, which wrap) |
| `--line-avatar-group-content-offset` | `var(--line-size-1)` | `content` (`margin-block-start` from the overflow control) |
| `--line-avatar-group-content-max-inline-size` | `var(--line-size-xs)` | `content` |

**Avatar tokens the group sets** (`0009-avatar.md` G2, G3; F8)

| Token | Where | Value |
|---|---|---|
| `--line-avatar-ring-width` | `:host` | `var(--line-border-2)` (2px), the gap ring of the target visual |
| `--line-avatar-size` | `:host([size='1'…'5'])` only | `var(--line-size-5)`, `-6`, `-7`, `-8`, `-9` |

- The group declares its own tokens on `:host` and redeclares `--line-avatar-group-overlap` per `spacing` step, as Stack does for `gap` (`stack.ts:54`, `:112-125`). The Avatar tokens are declared on `:host` so they reach avatars through the `item` wrappers and any consumer wrapper by inheritance, and a document rule on `line-avatar` or `line-avatar-group` still wins (`0009-avatar.md` probe P5).
- The collapsed overlap is `margin-inline-start: calc(-1 * var(--line-avatar-group-overlap))` on `.level + .item` and on `.level + [part='root']`; the item of the first child, alone in level 1, has none. A `hidden` child gets no item and no level (D14), so level 1 always holds the first visible avatar (D20).
- The expansion is `:host([data-expanded]) .level { translate: calc(-1 * (var(--line-avatar-group-overlap) + var(--line-avatar-group-gap))) 0 }`, and `translate: calc(var(--line-avatar-group-overlap) + var(--line-avatar-group-gap)) 0` under `:host([data-expanded]:dir(rtl))`, because `translate` is physical. Child k of N moves (N − k + 1) steps toward inline-start, so neighbours end one gap apart; `root` sits outside every level and stays put, and no layout box changes size (F14; probe P9).
- **Consumer note.** While the stack is spread, the avatars overlap up to N × (`overlap` + `gap`) of the content before the group, 36 px with the defaults and `max="3"`, and an ancestor with `overflow: hidden` clips them [INFERENCE: clipping not probed]. The docs say to leave that space at the group's inline-start, or to cap N with `max` (F14; probe P9).
- `root` is `display: inline-flex` with the avatar's radius, `border-radius: var(--line-avatar-radius, var(--line-radius-round))`, so its outline follows the circle. The overflow button fills `root` and reads the Avatar tokens with the Avatar defaults as fallbacks, so it matches an avatar: `inline-size` and `block-size` `var(--line-avatar-size, var(--line-size-7))`, `border-radius` as `root`, `background-color` `var(--line-avatar-bg, var(--line-gray-bg))`, `color` `var(--line-avatar-color, var(--line-gray-text))`, `font-size` `var(--line-avatar-font-size, calc(var(--line-avatar-size, var(--line-size-7)) * 0.4))`, `font-weight` `var(--line-avatar-font-weight, var(--line-font-weight-5))`, and the ring `box-shadow` of `0009-avatar.md` G3 (`packages/line-components/src/avatar/avatar.ts:110`; G6).
- Later children paint over earlier ones in DOM order; the ring separates them. `line-avatar` is `position: relative` (`avatar.ts:93`), so a consumer can reorder the stack with `z-index` on its own children.
- The panel lays its avatars out with `display: flex; flex-wrap: wrap` and no overlap.
- The panel is positioned through its implicit anchor with `position-area: block-end span-inline-end`, logical, so it mirrors under `dir="rtl"` [INFERENCE: RTL not probed], and `position-try-fallbacks: flip-block, flip-inline` [INFERENCE: fallbacks not probed] (probe P1; D9). `margin: 0; inset: auto` cancels the UA popover centring (probe P1 style).
- The group sets nothing on `--line-avatar-status-visibility` (F9).
- Token sources: `--line-size-1`…`-9` (`packages/line-tokens/src/sizing.css:10-18`), `--line-size-xs` (`:32`), `--line-border-1` and `-2` (`border-width.css`, `:10` for `-2`), `--line-radius-2` (`radii.css:10`), `--line-shadow-3` (`shadows.css:114`), `--line-motion-fast` (`motion.css:10`), `--line-gray-border` (`packages/line-themes/src/aliases.css:24`). Without `line-themes` the colour tokens are invalid at computed-value time, so the panel takes `Canvas` from its fallback only where one is given (`0006-alert.md` AM-002).

### Keyboard

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | moves focus to or from the overflow button and any focusable child, such as an avatar link; keyboard focus entering the group expands it (F13). While the panel is open, Tab from the overflow button enters the panel (probe P1) |
| `Enter` / `Space` | on the overflow button, opens or closes the panel (native `popovertarget`; probe P1) |
| `Escape` | panel open: the platform closes it, and focus returns to the overflow button (probe P1; D7). Panel closed and the stack expanded: collapses it and sets `dismissed` (F2; D25) |

- The group adds no arrow-key handling and no roving focus: its only control is the overflow button, and avatar links keep their own Tab stops.
- The group handles Escape on its host only when nothing inside it called `preventDefault()` [INFERENCE: lets a focusable child own Escape].

### A11y

| Field | Value |
|-------|-------|
| Role | `group` on the host through `this[INTERNALS].role` (F6; R8 `docs/research/01-research-accessibility.md:72`). An author `role` attribute on the host wins (`0004-button-group.md` A11y) |
| ARIA attributes | on the overflow button: `aria-expanded` `true` or `false` from the machine (D8), `aria-controls="content"`, and `aria-label` while `overflow-label` is set (F7). On the panel: none (D9) |
| Accessible name | the group: the host `aria-label` or `aria-labelledby`, which name the internals role directly (F6). The overflow button: the visible "+N", or the `overflow-label` template with `{count}` filled in (F7; Phase 1 spec §10 SD31 as amended by §12 AM-095) |
| Focus | the host is not focusable and does not delegate focus (D6). The overflow button is one Tab stop; `data-focus-visible` on the host while it has keyboard focus, with the default ring drawn on `::part(root)` (ARCH §14.9, `:1250`; F15) |

- **Disclosure.** The overflow button follows the APG Disclosure pattern that R8 names: a `button` with `aria-expanded`, `aria-controls` optional, Enter and Space toggling; "APG has no non-modal popover pattern" (R8 `:72`). The panel is not a dialog and traps nothing; it follows the button in the Tab order (probe P1).
- **Overflow avatars.** While the panel is closed the avatars past `max` are unrendered and absent from the accessibility tree; while open they follow the button (probe P2).
- **Internals proof.** A role set only through internals needs a Chromium CDP assertion of role and name and an `INTERNALS` read-back in chromium, firefox and webkit in the Browser tier (Phase 1 spec §6.C.4 notes, `:1180`; §10 SD39, `:2386`; §12 AM-058). Probe P3 ran both. axe and `ariaSnapshot()` do not see the group (probe P3), so an unnamed group has no automated catch; the docs ask for a name (F6).
- **axe.** The overflow button is an inner native `button`, so axe's `button-name` and `label-content-name-mismatch` rules apply to it (Phase 1 spec §7.4, `:2125`; probe P3).
- **Expanded state.** Chromium derives `expanded` from `popovertarget`; the component also writes `aria-expanded`, so Playwright's snapshot and axe see it in all three engines (probe P1; D8).
- **Firefox and WebKit gap.** No check proves what Firefox and WebKit expose to assistive technology for the internals `group` and the expanded state. The gap is recorded here (Phase 1 spec `:1180`; §12 AM-058). A manual screen-reader pass is optional and never blocks the row.
- **Hover expansion.** Expansion only changes spacing: no avatar appears or disappears and the accessibility tree does not change (D4). It meets WCAG 1.4.13 regardless: Escape dismisses it, the pointer can move over the spread avatars, and it stays until the pointer and focus leave (F2).

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `max` is a number; `size` and `spacing` are string enums; `overflow-label`, `aria-label` and `aria-description` are strings; avatars arrive by slot |
| C2 | Slots carry `@slot` and a single or multiple classification | one `@slot` for the default slot, `ChildList` (Slots) |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | fires no event, so no `@fires`; not value-bearing |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated (Phase 1 spec §6.C.4 C11 row) |
| C5 | The host accepts an accessible name and applies it to the element with the role | the group's role is on the host, which the host `aria-label` or `aria-labelledby` names directly (F6). The overflow button takes its name from its text or the documented label property `overflow-label` (F7; Phase 1 spec §10 SD31 as amended by §12 AM-095) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | no variants; `size` and `spacing` are scale steps (Variants; F8) |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | `@summary`, one `@slot`, three `@csspart` (`root`, `overflow`, `content`), thirteen `@cssprop`; no event and nothing deprecated |
| C8 | Missing or partial props degrade to an empty or neutral state | with no children it renders an empty, unnamed group with no overflow button; with no `max` every avatar shows; unknown `size` and `spacing` keep the defaults; a blank `overflow-label` leaves the visible "+N" as the name |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound (ARCH §17.2 C9, `docs/ARCHITECTURE.md:1580`) |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

#### Descriptor fields

Decisions F7, F8 and F10 set these fields.

| Field | Value |
|-------|-------|
| Catalog name | `AvatarGroup` (D17) |
| Tag | `line-avatar-group` |
| `load()` subpath | `@websublime/line-components/avatar-group` |
| Prop schema | `children` (`ChildList`, the avatars, catalog-only), `max` (`DynamicNumber`, optional), `size` (`z.enum(['1', '2', '3', '4', '5'])`, plain `.describe()`, optional), `spacing` (`z.enum(['0', '1', '2', '3'])`, optional), `overflowLabel` (`DynamicString`, optional), plus `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1, `:1323`, `:1326`) |
| Slot map | `children` → default slot (`''`), as Stack and ButtonGroup (`packages/line-genui/src/catalog/descriptors/stack.ts`, `button-group.ts`) |
| Binding map | `max` → attribute `max`; `size` → attribute `size`; `spacing` → attribute `spacing`; `overflowLabel` → attribute `overflow-label`; no value prop and no commit event (C9) |
| Action map | none |
| Accessibility requirements | no `requiredName`; `hostNaming: { kind: 'always' }`, so `accessibility.label` becomes the host `aria-label`, which names the internals group (`packages/line-genui/src/catalog/descriptor.ts:182-183`; F10) |
| Agent-facing description | A row of overlapping avatars for the people or organisations on something, such as the members of a project or the people in a call. Put Avatars in `children`, in order. Set `max` to how many avatars show; the rest collapse into a "+N" button that opens a panel with the others. Set `overflowLabel` to the button's spoken name, with `{count}` where the number goes, such as "+{count} more members"; without it the button is announced as "+N". `size` sets the avatar size from `1` (smallest) to `5` (largest), and `spacing` the overlap from `0` (none) to `3` (most); leave them out for the defaults. Give `accessibility.label` a name for the whole group, such as "Project members". The avatars spread apart while the pointer or the keyboard focus is on the group. Use Avatar alone for one person, and a horizontal Stack for pictures that must not overlap. |
| Tool description | A row of overlapping avatars for the people or organisations on something, such as the members of a project or the people in a call. The app places the avatars inside it. Set `max` to how many avatars show; the rest collapse into a "+N" button that opens a panel with the others. Set `overflowLabel` to the button's spoken name, with `{count}` where the number goes, such as "+{count} more members"; without it the button is announced as "+N". `size` sets the avatar size from `1` (smallest) to `5` (largest), and `spacing` the overlap from `0` (none) to `3` (most); leave them out for the defaults. Set `accessibilityLabel` to a name for the whole group, such as "Project members". The avatars spread apart while the pointer or the keyboard focus is on the group. Use Avatar alone for one person, and a horizontal Stack for pictures that must not overlap. |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C11 row; AvatarGroup is none of the three SD38 exceptions, `:2385`) |

- The agent-facing description names `children`, a `ChildList` the tool lacks, and `accessibility.label`, so the descriptor sets a tool description that names neither (Phase 1 spec §6.G.3, `:1423`, `:1435`). The agent-facing description is 854 characters and the tool description 856, under the 1024 cap (`:1422`).
- The frontend tool carries `max`, `size`, `spacing`, `overflowLabel`, `accessibilityLabel` and `accessibilityDescription`, because `hostNaming` is `always` (`packages/line-genui/src/catalog/tools.ts:144-148`, `:228`).
- The surface writes a number as its string, so `max` reaches the attribute as `"3"` (`packages/line-genui/src/a2ui/projection.ts:131-132`, `:149-152`).
- The `ChildList` schema takes any component ids, so an agent can put a non-Avatar child in the group; it counts as one avatar (F5).
- Catalog membership: the `line` catalog only. The `basic` map gains no route, and keeps 10 types (Phase 1 spec §6.G.2, `:1389`; ARCH §17.3, `docs/ARCHITECTURE.md:1608-1626`; F10).
- C11 ships its descriptor in the same PR, joins the `descriptors` array in catalog-name order, between `avatarDescriptor` and `badgeDescriptor` (`packages/line-genui/src/catalog/index.ts:114-125`), and adds AvatarGroup to the `<line-a2ui-surface>` render fixture and the surface axe test (Phase 1 spec §6.C.0, `:927`; §6.C.6, `:1231`).

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/avatar-group` |
| Kind | `independent` (Phase 1 spec §4.2, `:299`; ARCH §12, `docs/ARCHITECTURE.md:582`) |
| Registers | `line-avatar-group` |
| Reset modules | `commonReset` and `buttonReset` (ARCH §14.7, `:1162`; Phase 1 spec §6.C.4 notes, `:1181`; §10 SD84) |

- Files: `src/avatar-group/avatar-group.ts` (class and `customElements.define`), `src/avatar-group/avatar-group-machine.ts`, `src/avatar-group/avatar-group.types.ts` (`AvatarGroupSize`, `AvatarGroupSpacing`), `src/avatar-group/index.ts`.
- Nothing imports `src/avatar/`. The group matches no tag (F5), so the `./avatar-group` bundle holds no other component's tag and the isolation scan needs no `ALLOWED_TAG_REFERENCES` row (Phase 1 spec §7.5, `:2134`; `packages/line-components/__tests__/bundle-splitting.test.ts:75-77`). R9 shows the shared chunk an import of `avatar.ts` would create (`docs/research/01-research-packaging.md:85-88`, `:94-97`).
- `package.json` gains the `./avatar-group` export (Phase 1 spec §4.2, `:250`) and the Vite build the `avatar-group/index` entry (`packages/line-components/vite.config.mjs`); `bundle-splitting.test.ts` gains its `EXPECTED_TAGS` row. No new dependency under F1 (c): `@zag-js/core` is declared already (`packages/line-components/package.json`; Phase 1 spec `:266`).
- Gzipped size is reported against the < 5 KB soft target through the "Size report" step (Phase 1 spec §6.C.6, `:1227`; §10 SD21).

### Markup examples

```html
<!-- Default: five people, three shown, "+2" opens the rest -->
<line-avatar-group aria-label="Project members" max="3">
  <line-avatar src="/people/ana.jpg" name="Ana Silva"></line-avatar>
  <line-avatar src="/people/rui.jpg" name="Rui Costa"></line-avatar>
  <line-avatar name="Marta Sousa"></line-avatar>
  <line-avatar src="/people/joao.jpg" name="João Lima"></line-avatar>
  <line-avatar name="Inês Rocha"></line-avatar>
</line-avatar-group>

<!-- Overflow button name in the consumer's words -->
<line-avatar-group aria-label="Call participants" max="2" overflow-label="+{count} more participants">
  <line-avatar name="Ana Silva"></line-avatar>
  <line-avatar name="Rui Costa"></line-avatar>
  <line-avatar name="Marta Sousa"></line-avatar>
</line-avatar-group>

<!-- Larger avatars, tighter overlap -->
<line-avatar-group aria-label="Reviewers" size="4" spacing="3">
  <line-avatar src="/people/ana.jpg" name="Ana Silva"></line-avatar>
  <line-avatar src="/people/rui.jpg" name="Rui Costa"></line-avatar>
</line-avatar-group>

<!-- Avatars as profile links; size and ring reach them through the links -->
<line-avatar-group aria-label="Authors" max="2">
  <a href="/u/ana"><line-avatar src="/people/ana.jpg" name="Ana Silva"></line-avatar></a>
  <a href="/u/rui"><line-avatar src="/people/rui.jpg" name="Rui Costa"></line-avatar></a>
  <a href="/u/marta"><line-avatar name="Marta Sousa"></line-avatar></a>
</line-avatar-group>

<!-- Presence markers stay visible; a consumer may hide them in the stack through the token -->
<style>
  line-avatar-group.quiet { --line-avatar-status-visibility: hidden; }
</style>
<line-avatar-group class="quiet" aria-label="Online now">
  <line-avatar name="Ana Silva">
    <line-badge slot="status" variant="success" aria-label="Online"></line-badge>
  </line-avatar>
</line-avatar-group>

<!-- Tokens and parts -->
<style>
  line-avatar-group { --line-avatar-group-gap: var(--line-size-2); --line-avatar-ring-color: var(--line-gray-2); }
  line-avatar-group::part(overflow) { font-variant-numeric: tabular-nums; }
  line-avatar-group[data-open]::part(content) { min-inline-size: 12rem; }
</style>
```

- `<line-avatar>` ships with row 01-C10 and `<line-badge>` with 01-C9, so the stories can use them.

A `line` catalog node set the surface renders as the first example, shortened to three children:

```json
[
  { "id": "team", "component": "AvatarGroup", "children": ["ana", "rui", "marta"], "max": 2,
    "overflowLabel": "+{count} more members", "accessibility": { "label": "Project members" } },
  { "id": "ana", "component": "Avatar", "src": "https://example.com/ana.jpg", "name": "Ana Silva" },
  { "id": "rui", "component": "Avatar", "name": "Rui Costa" },
  { "id": "marta", "component": "Avatar", "name": "Marta Sousa" }
]
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom | render with no errors; the stack wrappers and panel assignment for `max` over child counts, read through `assignedElements()` because happy-dom leaves `assignedSlot` `null` on manual assignment (probe P7); children read before the first render; reassignment on append, remove and reorder, and on a child's `hidden` turning on or off, through the `MutationObserver`, which disconnects on `disconnectedCallback` and reconnects on `connectedCallback` (D13); a `hidden` child skipped, the first one included, so the first wrapper holds the first visible avatar (D14, D20); no `root` part while every child shows; the panel kept while open after the count drops to `max`, and `hidePopover()` called in `updated()`, through a spy because happy-dom has no popover API (D21; probe P7); the "+N" text and the `overflow-label` template: blank, with one `{count}`, with two `{count}` both replaced, and without `{count}`, which gives "+N" and a space before the label (F7; D15, D24); `max`, `size` and `spacing` converters, unknown values, and reflection; the machine's transitions driven through the controller with dispatched `pointerenter` and `pointerleave` (mouse, pen and touch), `focusin` from an element that matches `:focus-visible` and one that does not, `focusout`, Escape and plain `toggle` events carrying `newState` (probe P7; D22): the chain `collapsed → expanded → overflow_open` on one open and back on one close with no source (F12), `HOVER.END` ignored in `overflow_open`, `hasOverflow` blocking a stale open, and `dismissed` set by Escape, kept across an open and a close of the panel, and cleared by the next pointer leave or blur (D25); the flags `expanded`, `open` and `focus-visible`; `aria-expanded` and `aria-controls` on the button; internals `role` `group` through `INTERNALS`; no `formAssociated`; the C8 empty render; the machine-failure fallback (no expansion, the button still rendered) |
| Browser | Playwright `*.e2e.ts` on chromium, firefox and webkit | opening and closing the panel by click, Enter, Space, Escape, an outside click and a second press, with the focus results of probe P1, and focus back on the button after Escape from a slotted avatar link inside the panel, in all three engines (D7); Tab order from the button into the panel; the panel under the button by its implicit anchor, in LTR and RTL; a second `auto` popover closing the panel; a child removed while the panel is open closing it and clearing `data-open` (D21); the D8 fallback with a machine that fails to start, `aria-expanded` from `:popover-open` (probe P7); hover expansion and collapse with the mouse, keyboard-focus expansion with Tab, Escape dismissal; with `hasTouch`, a tap on "+N" and a tap on an avatar link each leaving the stack collapsed until the panel opens (F13; probe P5); the group staying expanded while the pointer is on the open panel (probe P1); in LTR and in RTL, a pointer that enters straight onto "+N" and clicks opens the panel, "+N" and the host box keep the same position and size before and after expansion, each avatar moves (N − k + 1) steps toward inline-start, and, in Chromium, a `PerformanceObserver` on `layout-shift` records no entry during expansion (probe P9; F14; D4); computed overlap and gap per `spacing`, size per `size`, through a wrapping link and with a `hidden` first child (D20); the ring width on avatars; the default focus ring on `::part(root)` under `[data-focus-visible]` (F15); `ariaSnapshot()` of the visible avatars, the button with `[expanded]` and the panel avatars while open; a Chromium CDP assertion of `group` with its name and the button's `expanded`; the `INTERNALS` read-back of `role` in three engines (A11y; Phase 1 spec `:1180`); Tab skipping the host itself (Phase 1 spec §10 SD99) |
| A11y | axe-core | zero violations (MANIFESTO Law 3) in every AvatarGroup story of D18, with the panel closed and, for the Open story, with it open; the test hovers or clicks as D26 says before it calls `expectNoAxeViolations` (Phase 1 spec §7.4) |
| htmx | — | `n/a`: AvatarGroup is neither value-bearing, because its descriptor binding map names no value prop, nor compound, as ARCH §17.2 C9 states by name (`docs/ARCHITECTURE.md:1580`; plan §2.4, `docs/plans/01-plan-core-primitives.md:172-175`; Phase 1 spec §6.C.4 C11 row, `:1167`; F11) |
| Visual | Playwright `avatar-group.visual.ts` on the `visual` project | every AvatarGroup story with Linux baselines from a `visual-baselines.yml` run, collapsed, and the Expanded and Open stories in their state through the `ready` hook of `expectStoryScreenshot` (D26; Phase 1 spec §6.C.6, `:1233`; §10 SD98, `:2445`) |
| Update rate | `measureHostUpdates` from `@websublime/line-testing/update-rate` on a connected `<line-avatar-group>` with five avatars, with `mutate: (i) => { el.max = i % 2 === 0 ? 2 : 3 }`, which changes the machine prop `overflowCount` between 3 and 2, and `readProp: () => prop?.('overflowCount')`, the `prop` reader captured by wrapping `avatarGroupMachine.initialState`, as `button-group.update-rate.test.ts` does (D23; `packages/line-testing/src/update-rate.ts:93-95`) | the rate is recorded in the C11 PR; a rate past `UPDATE_BUDGET_MS` (1 ms per host update) at `BUDGET_UPDATES` stops the row and returns it to the orchestrator (`update-rate.ts:31`, `:50`; Phase 1 spec §6.C.6, `:1232`; §6.C.7; §10 SD18) |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts`; Playwright axe in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` | an `AvatarGroup` node renders `<line-avatar-group>` with its `line-avatar` children in the default slot, `max`, `size`, `spacing` and `overflow-label` as attributes and `accessibility.label` as `aria-label`; a child that arrives later is counted (D13); a node with no name renders and raises nothing (F10); the node joins the surface render fixture and the surface axe test (Phase 1 spec §6.C.6, `:1231`) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the CEM coverage and drift tests pass with the new descriptor (Phase 1 spec §6.G.5, `:1607`); `catalog.json` holds `AvatarGroup` and its inline projection validates (§6.G.2); the `AvatarGroup` tool takes the tool description, stays at or under 1024 characters, passes the backtick guard and carries `max`, `size`, `spacing`, `overflowLabel`, `accessibilityLabel` and `accessibilityDescription` (§6.G.3, `:1422-1423`, `:1435`) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./avatar-group` register `line-avatar-group` only, and the isolation scan finds no Avatar module and no other component's tag in its bundle (Phase 1 spec §7.5) |

- PRD §5.2 checklist mapping (`docs/PRD.md:533-542`; Phase 1 spec §6.C.6, `:1222`): (1) render, (2) reactive props, (3) slots, (4) parts, (5) custom properties and (6) events (none fired) in the Unit tier; (7) keyboard in the Browser tier (§10 SD99); (8) axe in the A11y tier.
- AvatarGroup is a machine row, so the update-rate row is an obligation (Phase 1 spec §6.C.6, `:1232`).
- The axe and visual tests run against the Storybook stories on port 4320; the story list lives in `packages/line-components/__tests__/avatar-group-stories.ts`, as `avatar-stories.ts` does for Avatar. The keyboard, pointer and popover tests use fixture pages under `packages/line-components/__tests__/integration/avatar-group/` that load the built `./avatar-group`, `./avatar` and `./badge` by package name, served by the existing port-4321 `webServer` (`playwright.config.ts`).

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| F1 | How does the "+N" button open its overflow popover (R7 §6 OQ5)? | Miguel | resolved: option (c), the native `popover` attribute opened by `popovertarget`, with the custom machine following the panel's `toggle` events, CSS anchor positioning from the implicit anchor, and focus restored by the component (Miguel, 2026-11-11) |
| F2 | What expands the stack, and how does expansion meet WCAG 1.4.13 (R8 §6 Q10)? | Miguel | resolved: option (a), mouse or pen hover and focus within the group expand it, Escape collapses it until pointer and focus have left, and touch never expands it (Miguel, 2026-11-11). F12 and F13 refine it |
| F3 | What does the overflow popover show, given that the avatars live in the consumer's light DOM? | Miguel | resolved: option (a), the avatars past `max` themselves, assigned to an internal slot inside the panel (Miguel, 2026-11-11) |
| F4 | How are avatars past `max` kept out of the stack? | Miguel | resolved: option (a), manual slot assignment, with no attribute written on any child (Miguel, 2026-11-11) |
| F5 | Which children count as avatars? | Miguel | resolved: option (a), every element child without `hidden`, a wrapper such as a link included; no tag is matched (Miguel, 2026-11-11) |
| F6 | Which role does the group carry: `group` or `list`/`listitem`? | Miguel | resolved: option (a), `group` on the host through `ElementInternals`, named by the host `aria-label` or `aria-labelledby` (Miguel, 2026-11-11) |
| F7 | Where does the "+N" button's accessible name come from? | Miguel | resolved: option (a), the `overflow-label` template with `{count}` replaced by the formatted count, and the visible "+N" when blank (Miguel, 2026-11-11; Phase 1 spec AM-095 amends §10 SD31) |
| F8 | What shape do `size` and `spacing` take? | Miguel | resolved: option (a), reflected step enums on token scales, `size` `1`–`5` and `spacing` `0`–`3`, Stack `gap` style (Miguel, 2026-11-11) |
| F9 | Does the group hide presence markers in the collapsed stack (`0009-avatar.md` G4)? | Miguel | resolved: option (a), no; the group never sets `--line-avatar-status-visibility`, which stays the consumer's (Miguel, 2026-11-11) |
| F10 | Which catalog carries AvatarGroup, with which props, and does it require a name? | Miguel | resolved: option (a), the `line` catalog only, with `children`, `max`, `size`, `spacing` and `overflowLabel`, `hostNaming: always`, no `requiredName` and no `basic` route (Miguel, 2026-11-11) |
| F11 | Does the htmx Tests row run? | Miguel | resolved: option (a), `n/a` (Miguel, 2026-11-11) |
| F12 | How does the machine move through ARCH §13.2's chain `collapsed ↔ expanded ↔ overflow_open` when the panel opens or closes with neither hover nor focus on the group? (review gate round 1) | Miguel | resolved: option (a), strict chain: the machine passes through `expanded` on the same platform event, `collapsed → expanded → overflow_open` on an open and the reverse on a close; ARCH unchanged, no AM (Miguel, 2026-11-11) |
| F13 | Which focus expands the stack? (review gate round 1) | Miguel | resolved: option (a), only keyboard focus: `FOCUS.IN` is sent only for a focused element that matches `:focus-visible`; the Browser tier taps "+N" and an avatar link and asserts that the stack stays collapsed (Miguel, 2026-11-11) |
| F14 | Which layout keeps "+N" under a pointer that enters on it while the stack expands? (review gate round 1) | Miguel | resolved: option (d), nested `level` wrappers that `translate` toward inline-start while expanded, mirrored under `:dir(rtl)`; "+N" and the host box stay put, and the spread avatars may overlap the content before the group (Miguel, 2026-11-11) |
| F15 | Where does the default focus ring of the "+N" control sit, given ARCH §14.9's `::part(root)`? (review gate round 1) | Miguel | resolved: option (b), a `root` part wraps the "+N" button and carries the default ring under `[data-focus-visible]`, so ARCH §14.9 holds literally (Miguel, 2026-11-11) |

**Orchestrator defaults** (Miguel left D1–D19 as drafted, 2026-11-11; review gate round 1 edited D2–D5, D7, D8 and D13 and added D20–D26, as the orchestrator directed)

| # | Default | Basis |
|---|---------|-------|
| D1 | A custom `createMachine` on `@zag-js/core` 1.47.0 in `src/avatar-group/avatar-group-machine.ts`, run through `LineMachineController`, local to AvatarGroup, with the States section's members | ARCH §8, §13.2; Phase 1 spec C11 row; ButtonGroup's local machine (`packages/line-components/src/button-group/button-group-machine.ts`) |
| D2 | Flags through `reflectState`: `expanded` in `expanded` and `overflow_open`, `open` in `overflow_open`, `focus-visible` while the overflow button has keyboard focus; `collapsed` has no flag. The stack is therefore spread whenever the panel is open, after a touch tap too; F2's "touch never expands" means that no touch hover or touch focus expands it (F13) | ARCH §14.8 `expanded` and `open` rows (`docs/ARCHITECTURE.md:1232`, `:1236`); ARCH §14.9 (`:1250`); the strict chain passes through `expanded` (F12); keeps the stack spread while the pointer is on the open panel (probe P1) |
| D3 | `max` is the number of avatars in the stack, the overflow control excluded; with N children and N > `max`, the stack shows `max` and the button shows N − `max`; with N ≤ `max`, or `max` missing, not an integer or below 1, every child shows and no control or panel renders, except while the panel is open (D21) | C8 (`docs/ARCHITECTURE.md:1579`); ARCH §13.2 gives `max` with no rule; excluding the control keeps `max` the number of faces shown [INFERENCE: no library precedent checked; R7 `:201` lists MUI's `max` without saying whether it counts the surplus avatar] |
| D4 | Expansion changes spacing only, from `--line-avatar-group-overlap` to `--line-avatar-group-gap`, through the F14 (d) layout: while `data-expanded` is set each `level` wrapper moves one step, `overlap + gap`, toward inline-start by `translate`, mirrored under `:dir(rtl)`, with a `--line-avatar-group-duration` transition, `0s` under `prefers-reduced-motion: reduce`. Which avatars show never changes; "+N" and the host box never move, so no layout shifts | F14 (d); probe P9: "+N" fixed to 0.02 px in LTR and RTL in three engines, a direct click opens the panel, and Chromium records no `layout-shift` entry |
| D5 | The overflow control renders while some child is past `max` or the panel is open (D21), reads the Avatar tokens with Avatar's fallbacks, and takes the stack overlap | `0009-avatar.md` G6 (`:474`); ARCH §5 `overflow` (`docs/ARCHITECTURE.md:327`) |
| D6 | No `delegatesFocus`; `host.focus()` does nothing | Probe P4: with `delegatesFocus`, a click on an avatar moves focus to the inner button in chromium and firefox |
| D7 | Focus is inside the panel when the active element, `document.activeElement` read through the host's shadow root, is one of the panel slot's `assignedElements()` or a descendant of one. The host records it on the panel's `beforetoggle` event towards `closed`; on the `toggle` that follows, the machine's `restore` action focuses the overflow button with `focus({ focusVisible: true })` if it was. A close by an outside click or by the button itself leaves focus where the browser put it | Probe P1: Escape from inside the panel left focus on `body` in Chromium and on the trigger in Firefox and WebKit, with the focus on a link in the panel's own shadow content; an outside click leaves it on `body` in all three. The panel holds only slotted children, so `panel.contains()` and `shadowRoot.activeElement` miss them [INFERENCE: Firefox and WebKit return focus only from shadow-including descendants of the panel, so for a slotted link they may drop it as Chromium does; not probed, and D7 covers both]. `beforetoggle` runs before the browser moves focus [INFERENCE: its timing was not probed]; `0004-button-group.md` P1 for `focusVisible` |
| D8 | The overflow button carries `aria-expanded` from the machine (`true` in `overflow_open`), or from `:popover-open` in the fallback, and `aria-controls="content"`. The fallback is tested in the Browser tier only, because happy-dom's `:popover-open` is always `false` (probe P7) | R8 `:72` requires `aria-expanded`; probe P1: only Chromium derives it from `popovertarget`, and the snapshot shows none |
| D9 | The panel is `<div part="content" id="content" popover="auto">` with no role; it is positioned from the implicit anchor with `position-area: block-end span-inline-end` and `position-try-fallbacks: flip-block, flip-inline` | Probe P1: implicit anchoring in three engines; Chromium exposes the panel as `group ""`; R8 `:72`: no non-modal popover pattern, Disclosure for the control |
| D10 | The thirteen `--line-avatar-group-*` tokens of the CSS custom properties table, and `--line-avatar-ring-width: var(--line-border-2)` on `:host` | Target visual's gap ring; `0009-avatar.md` G2, G3; Stack's token-per-step pattern (`stack.ts`) |
| D11 | Reset modules `commonReset` and `buttonReset` | ARCH §14.7 (`:1162`); Phase 1 spec §10 SD84 |
| D12 | No events and no `open` or `expanded` property; not form-associated | ARCH §17.2 C9 (`:1580`); Phase 1 spec C11 row |
| D13 | The group reads its element children before the first render, in `connectedCallback`, which manual assignment allows because no slot is involved, and again on every record of one `MutationObserver`. The observer watches the host with `{ childList: true, subtree: false }` and each element child with `{ attributes: true, attributeFilter: ['hidden'] }`, and is disconnected and re-registered after each read, as ButtonGroup's `#observer` is (`packages/line-components/src/button-group/button-group.ts:120`, `:176-178`). It connects in `connectedCallback` and disconnects in `disconnectedCallback`. The slots are assigned in `updated()` | Probe P2: manual assignment fires no `slotchange` on append; `0009-avatar.md` G8 as amended by AM-004; MANIFESTO Law 5 (`docs/MANIFESTO.md:47`): assignment in the render cycle, no attribute written |
| D14 | A child with the `hidden` attribute is not counted and not assigned | `0004-button-group.md` decision D16; the surface keeps a pending child hidden (ARCH §17.4, `:1638`) |
| D15 | The count is formatted with `Intl.NumberFormat` for the nearest `lang` of the host, else the document's, in the visible "+N" and in `{count}` | `0009-avatar.md` D9 reads the same `lang` for initials; MANIFESTO Out of Scope leaves wording, not numerals, to the consumer (`docs/MANIFESTO.md:66`) |
| D16 | The Browser tier proves the group role with a Chromium CDP assertion and an `INTERNALS` read-back, and the button and avatars with `ariaSnapshot()` in three engines | Phase 1 spec `:1180`; probes P1–P3 |
| D17 | Catalog name `AvatarGroup`, `agentExposed: true` | PRD row name; Phase 1 spec C11 row |
| D18 | Stories: Default (five, `max="3"`), No overflow, Overflow label, Sizes, Spacing, Links, With status, Expanded, Open, Custom tokens; local images as Avatar's stories use | One axe and one visual baseline per meaningful state (Phase 1 spec §6.C.6; `0009-avatar.md` D12) |
| D19 | The C11 PR also adds an AvatarGroup row to `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1, which has none yet, writes the Storybook docs, reports the gzipped size, records the update rate, and adds one changeset covering `line-components` and `line-genui` | Phase 1 spec §6.C.6 (`:1223-1227`, `:1232`); PROCESS §6 |
| D20 | The stack renders N nested `<span class="level">` wrappers, N the number of children in it: level k holds level k − 1 and `<span class="item">` with one manually assigned slot for child k. The collapsed overlap is `margin-inline-start: calc(-1 * var(--line-avatar-group-overlap))` on `.level + .item` and `.level + [part='root']`; the expansion is the `translate` of each level (D4). A `hidden` child gets no item and no level (D14), so level 1 always holds the first visible avatar | `::slotted(*)` cannot tell the first assigned child from a `hidden` first child under manual assignment (review gate round 1); probe P9 layout D; `0009-avatar.md` G1 as amended by AM-004 |
| D21 | While the panel is open and the count drops to `max` or below, the panel and the overflow control stay rendered, and `updated()` closes the panel with `hidePopover()`; the `toggle` that follows moves the machine out of `overflow_open`, and the next render removes both | Removing a showing popover hides it without `beforetoggle` or `toggle` [INFERENCE: HTML spec, not probed], which would leave `data-open` on |
| D22 | `OPEN.CHANGE` reads `open` from the `toggle` event's `newState` (`ToggleEvent.newState`), never from `:popover-open` | Probe P7: happy-dom has no `ToggleEvent` and its `:popover-open` is always `false`, so the unit tier dispatches a plain `toggle` event with `newState` |
| D23 | The machine takes the host-driven prop `overflowCount` (children past `max`, `0` when none) and reads it in the `hasOverflow` guard of `OPEN.CHANGE { open: true }`; the update-rate test drives it through `max` and reads it with `prop('overflowCount')` | `measureHostUpdates` needs a `mutate` that changes a host property feeding the machine props and a `readProp` that reads one (`packages/line-testing/src/update-rate.ts:93-95`) |
| D24 | The `overflow-label` template replaces every `{count}`. A non-blank label without `{count}` names the button with the visible "+N", a space, then the label, such as "+3 more members" | Probe P3: a name that contains the visible "+3" passes `label-content-name-mismatch` and one without it fails |
| D25 | `dismissed` is set by Escape while the stack is expanded and the panel closed, which collapses the stack. It clears on the next `HOVER.END` or `FOCUS.OUT` out of the group; opening and closing the panel does not clear it. After a close, the machine goes `overflow_open → expanded`, then to `collapsed` when `dismissed` is set or no source remains, else stays `expanded` | WCAG 1.4.13 "dismissible" (F2) |
| D26 | The Expanded and Open stories reach their state in the visual tier through the `ready` hook of `expectStoryScreenshot` (`packages/line-components/__tests__/visual/story.ts:28`, `:41`): it hovers the host for Expanded and clicks "+N" for Open, then moves the pointer onto the panel. The axe test does the same before `expectNoAxeViolations` | No property sets either state (D12) |

Miguel decided F1–F11 on 2026-11-11, each on the option the draft recommended, and left D1–D19 as drafted. After review gate round 1 he decided F12–F15 the same day. The option tables below stay as the record of what he weighed.

### F1 — Overflow popover mechanism

**Evidence.** ARCH §13.2 says "click on overflow opens popover" (`docs/ARCHITECTURE.md:606`). R7 OQ5 names the three options and the evidence that decides them: the R9 size budget against about 24 KB, keyboard and touch equivalents, and the Phase 3 Popover order (`docs/research/01-research-zag-machines.md:309`). R7 says the popover "needs positioning, dismissal and focus return; Zag puts those in `@zag-js/popover`" (`:217`), that PRD places Popover in Phase 3 (`:225-227`; PRD §4.3, `docs/PRD.md:296`; §7.5, `:979`), and that embedding it adds about 24 KB (`:276-277`). Probe P8 measures 24,293 B gzipped and ten pinned packages. Phase 1 spec §4.2 lists the `line-components` dependencies at phase exit without `@zag-js/popover` (`:261-269`), and SD21 measures the size target with Zag external, so the size report would not show the cost. Probe P1 shows the native popover inside a shadow root opening from `popovertarget`, dismissing on Escape and outside click, ordering the panel after the trigger and anchoring it in all three engines; Chromium drops focus to `body` on Escape from inside, and opening any other `auto` popover closes it. Probe P7 shows happy-dom has no popover API. MANIFESTO Law 9 asks for a working fallback when a machine fails (`docs/MANIFESTO.md:55`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) Hand-written in the custom machine | the panel is a plain element the machine shows in `overflow_open`; the component writes its own outside-pointer and Escape listeners, focus return, and positioning (absolute inside the host, or CSS anchor positioning) | No dependency; unit-testable in happy-dom. The component re-implements light dismiss and stacking, and an absolutely positioned panel is clipped by an ancestor with `overflow: hidden` [INFERENCE: not probed]; a failed machine leaves the panel unreachable |
| (b) A second controller on `@zag-js/popover` | a second `LineMachineController` runs Zag's popover machine beside the custom one, sharing `ids` and `getRootNode` (R7 `:228-229`) | Proven positioning, dismissal and focus logic. +24.3 KB gzipped and ten packages (P8); a new `line-components` dependency, which needs a Phase 1 spec AM (decision) to the §4.2 dependency set and a `security-reviewer` pass (PROCESS §5); Phase 3 Popover's machine arrives in Phase 1 |
| (c) **Recommended.** Native `popover` | `<div part="content" popover="auto">` in the shadow root, opened by `popovertarget` on the overflow button; the custom machine mirrors the panel's `toggle` events; CSS anchor positioning from the implicit anchor; the component restores focus (D7) and writes `aria-expanded` (D8) | No dependency; the top layer escapes clipping and `z-index`; Escape and light dismiss are native, and the panel works when the machine fails (Law 9). Opening it closes any other open `auto` popover on the page (P1); Chromium's focus loss needs D7; opening is testable only in the Browser tier (P7) |

None of the options contradicts ARCH §13.2 or the Phase 1 spec, except that (b) needs the Phase 1 spec AM named in its row. Review gate round 1 added one call from the host to the panel, `hidePopover()` when the overflow empties while the panel is open (D21), so "sends nothing to the panel" in the (c) row holds for the machine only; the row stays as the record of what Miguel weighed.

### F2 — Hover and focus expansion

**Evidence.** ARCH §13.2 says "Hover expands" (`:606`) and PRD §4.1 "Expands on hover" (`docs/PRD.md:254`). R8 Q10 asks for expansion on hover and focus, or on activation only, and says WCAG 1.4.13 applies "if expansion reveals content" (`docs/research/01-research-accessibility.md:345-346`). WCAG 1.4.13 asks that content shown on hover or focus be dismissible without moving pointer or focus, hoverable, and persistent. Under D4 expansion reveals the parts of each face the overlap hid and adds nothing to the accessibility tree. Probe P4 shows `pointerenter`, `pointerleave` and `focusin` reaching the host in all three engines. Probe P5 shows a touch tap firing `pointerenter` and `pointerleave` around the press, with `:hover` stuck on the host in Chromium and WebKit. Probe P1 shows the host's `:hover` and `pointerleave` disagreeing across engines while the pointer is on the open panel.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Hover and focus, Escape dismisses, no touch | `HOVER.START` for `pointerType` `mouse` or `pen`, `FOCUS.IN` for focus within the host; collapse when both are gone; Escape collapses and keeps the group collapsed until pointer and focus have both left; a touch tap expands nothing | Keyboard users get what mouse users get; meets 1.4.13 even if expansion counts as content. Expansion runs in JavaScript, not CSS `:hover`; touch users never see the spread stack and reach the rest through "+N" |
| (b) Hover only | mouse or pen hover expands; focus does not | Simplest. Keyboard users never see the spread stack, which R8 Q10 flags; the face-revealing effect becomes pointer-only |
| (c) Activation only | no hover expansion; the stack spreads only while the panel is open | Nothing appears on hover, so 1.4.13 never applies. Contradicts ARCH §13.2 "Hover expands" and PRD §4.1 "Expands on hover": a PRD revision-log entry and an ARCH change, and a Phase 1 spec AM with trigger `decision` |

Review gate round 1 refined (a). A touch tap on "+N" opens the panel through `expanded` (F12), so the stack is spread while the panel is open (D2); and only keyboard focus expands the stack (F13), so a tap that focuses "+N" or an avatar link expands nothing.

### F3 — What the overflow popover shows

**Evidence.** Avatars are light-DOM children of the group (Phase 1 spec §10 SD4, `:2351`). A node can be assigned to only one slot at a time, and manual assignment can move it between slots without touching it (probe P2: avatars 4–6 render inside the panel once open, with their names in the accessibility tree, and axe passes). MANIFESTO Law 5 forbids DOM mutation outside Lit's cycle and puts styling in CSS (`docs/MANIFESTO.md:47`). The A2UI surface fills only the slots its slot map names (ARCH §17.4, `docs/ARCHITECTURE.md:1636`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** The avatars past `max`, re-slotted | the group assigns every child past `max` to an internal slot inside the panel (needs F4 (a)) | The panel shows the same avatars, with the same names and ring, and the agent path needs nothing more. The panel shows faces only; names reach assistive technology, and a sighted user sees no written name unless the consumer wraps each avatar with one |
| (b) A named `overflow` slot | the consumer puts any content in `slot="overflow"`, such as a list of names; the group still hides the avatars past `max` | Rich panel content. The consumer repeats data and must know which avatars are hidden; the agent path needs a second `ChildList`; with F4 (a) the group must assign that slot by hand |
| (c) The group writes `slot` on the children | the group sets `slot="overflow"` on each child past `max` and removes it when `max` changes | Named slots, no manual assignment. The group writes an attribute the author owns on the consumer's elements, and overwrites an author `slot`. Contradicts `0009-avatar.md` Connections, which says the group "never writes attributes on slotted avatars" (`docs/specs/0009-avatar.md:239`): an AM to that spec with trigger `decision` |
| (d) Count only | the panel holds nothing from the children; "+N" opens an empty or consumer-filled panel | Smallest. A popover with nothing in it contradicts the point of ARCH §13.2's "click on overflow opens popover" |

### F4 — Hiding avatars past `max`

**Evidence.** `0009-avatar.md` G5 offers `hidden` or `::slotted(:nth-child(n + …))` (`docs/specs/0009-avatar.md:473`). Probe P2: `::slotted(:nth-child())` works in three engines but counts any element, and the rule depends on `max`, so it must be generated in TypeScript; manual assignment hides the rest without writing on the children and passes axe, but fires no `slotchange` on append; happy-dom supports `assign()` (P7). MANIFESTO Law 5 puts styles in CSS and DOM changes in Lit's cycle (`docs/MANIFESTO.md:47`). ButtonGroup writes `tabindex` and a `data-line-button-group-position` attribute on author hosts (`0004-button-group.md` decision D14).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Manual slot assignment | `slotAssignment: 'manual'`; the group assigns the first `max` children to the stack slot and the rest to the panel slot (F3 (a)) | No write on the children and no style in TypeScript; the overflow can render in the panel. The group observes `childList` itself (D13), and a child's `slot` attribute stops working |
| (b) The group writes `hidden` | `hidden` on each child past `max`, removed when `max` grows (G5) | Simple; the children keep named slots. The group writes an attribute the author owns; an author `hidden` and the group's cannot be told apart; F3 (a) is impossible. G5 allows it, but `0009-avatar.md` Connections says the group "never writes attributes on slotted avatars" (`:239`), so the two Avatar sentences disagree and this option needs an AM to that spec with trigger `decision` |
| (c) `::slotted(:nth-child(n + k))` | a stylesheet rule regenerated from `max` | No write on the children. A style built in TypeScript (Law 5); counts non-avatar children; F3 (a) is impossible |
| (d) A marker attribute | `data-line-avatar-group-overflow` on each child past `max`, hidden by a static `::slotted([…])` rule, ButtonGroup D14 style | Static CSS. The group writes on author hosts; F3 (a) is impossible; the same `0009-avatar.md` AM as (b) |

### F5 — Which children count

**Evidence.** `0009-avatar.md` G1 overlaps "hosts" through `::slotted(*)` (`:469`), and probe P5 there shows size and ring inherited through a wrapping link. ButtonGroup matches its items by tag name (`0004-button-group.md` decision D2), which put the item tags in its bundle and needed Phase 1 spec AM-090, a per-entrypoint allow-list in the isolation scan (`docs/specs/01-spec-core-primitives.md:2134`, `:2551`; `packages/line-components/__tests__/bundle-splitting.test.ts:75-77`). The scan matches whole tag names, so `line-avatar-group` itself never matches `line-avatar` (`bundle-splitting.test.ts:107-108`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Every element child | each element child without `hidden` is one avatar, a link around an avatar included | Wrapped avatars work; no tag in the bundle, so no isolation-scan amendment. A stray element, such as a `<span>`, counts as an avatar |
| (b) `line-avatar` hosts only | children are counted and assigned only when `localName` is `line-avatar`; other children stay unassigned | Strict. Avatars inside links never count; the `./avatar-group` bundle holds `line-avatar`, which needs a Phase 1 spec AM (decision) adding an `ALLOWED_TAG_REFERENCES` row |
| (c) `line-avatar` hosts and elements that contain one | (b), plus any child with a `line-avatar` descendant | Wrapped avatars work and stray elements do not count. The same bundle and AM as (b), and a subtree query per child |

### F6 — Group semantics

**Evidence.** R8 gives the group `group` or `list`/`listitem` (`docs/research/01-research-accessibility.md:72`). Probe P3: a host internals `group` named by the host `aria-label` shows in Chromium's tree and the read-back, but not in `ariaSnapshot()` or axe; a `list` around one default slot fails axe `aria-required-children`; a `list` with one shadow `listitem` per avatar, each avatar in its own manually assigned slot, passes and shows in the snapshot. ButtonGroup set its role through internals (`0004-button-group.md` decision D1; `packages/line-components/src/button-group/button-group.ts:204-205`). ARCH §17.2 C5 applies the name to "the host itself or the inner focusable element" (`docs/ARCHITECTURE.md:1576`); a shadow list wrapper is neither, which `0004-button-group.md` D1 (b) said needs a C5 wording change, while `0009-avatar.md` F2 (b) named a non-focusable shadow `img` without one.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `group` on the host through internals | `this[INTERNALS].role = 'group'`; the host `aria-label` or `aria-labelledby` names it directly | ButtonGroup parity; C5's "host itself"; no named `generic`. Needs the CDP and read-back proof; axe and the snapshot cannot see the role, so an unnamed group has no automated catch; no item count is announced |
| (b) `list` with a `listitem` per avatar | a shadow `role="list"` named from the host `aria-label`, one `<div role="listitem">` per avatar with its own slot; the panel holds a second list (needs F4 (a)) | Screen readers announce the count; axe and the snapshot check it in three engines (P3). A slot per avatar; a named `generic` host in Chromium; ARCH §17.2 C5 may need a wording AM, which is a decision |
| (c) No role | the host stays `generic`; the avatars read as a flat run | Nothing to prove. The group name has nowhere to go, against R8 |

### F7 — The "+N" button's accessible name

**Evidence.** R8 says strings such as "Show more" for the AvatarGroup overflow "must come from the consumer through slots or attributes" (`docs/research/01-research-accessibility.md:286-287`; MANIFESTO Out of Scope, `docs/MANIFESTO.md:66`). Probe P3: a name that omits the visible "+3", such as "Show all members", fails axe `label-content-name-mismatch` (WCAG 2.5.3), while "+3 more members" passes. The count changes at run time, so a consumer cannot write a fixed name. Phase 1 spec §10 SD31 read, before AM-095, "An inner native `<button>` with host `aria-label` copied, for Button, IconButton, Chip and the AvatarGroup "+N" control" (`docs/specs/01-spec-core-primitives.md:2378`); the host `aria-label` names the group under F6 (a) and (b), so copying it to the button would have given the button the group's name.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** A template attribute | `overflow-label`, with `{count}` replaced by the formatted count (D15), becomes the button's `aria-label`; blank leaves the visible "+N" as the name | The consumer writes the words and their order in any language; the count stays live. No plural rules: "+{count} more members" reads "+1 more members"; the docs say so. Departs from SD31's literal wording, so it needs a Phase 1 spec AM with trigger `decision` that keeps SD31's inner native button and drops "host `aria-label` copied" for the "+N" control |
| (b) A suffix attribute | `overflow-label="more members"`; the name is the visible "+N", a space, then the label | Label-in-name holds by construction. The number always comes first, which some languages cannot follow; the same SD31 AM as (a) |
| (c) The visible text only | the name is "+N"; no attribute | Nothing to localise and it passes axe (P3). A bare "+3, button, collapsed" says nothing about what is behind it; the same SD31 AM as (a) |
| (d) SD31 as written | the host `aria-label` is copied to the button | No AM. The group loses its name to the button, and a name such as "Project members" fails label-in-name against "+3" (P3) |

### F8 — Shape of `size` and `spacing`

**Evidence.** ARCH §13.2 gives AvatarGroup the props `max`, `size` and `spacing` (`docs/ARCHITECTURE.md:606`), and Avatar F7 kept `size` off Avatar on that ground (`docs/specs/0009-avatar.md:681`). Stack's `gap` is a reflected step enum `'0'`–`'5'` on the `--line-layout-gap-*` scale, which agents use (`packages/line-components/src/stack/stack.ts:17`, `:24-27`; `packages/line-genui/src/catalog/descriptors/stack.ts`). C6 lets a closed enum change only token defaults (`docs/ARCHITECTURE.md:1577`). Avatar reads `--line-avatar-size` with a fallback, so a value on the group's host reaches avatars through wrappers (`0009-avatar.md` G2, P5). A free CSS length in an attribute reaches CSS only through script or `attr()` with a type, which [INFERENCE: not probed] only Chromium supports.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Step enums on token scales | `size="1"`–`"5"` sets `--line-avatar-size` to `--line-size-5`…`-9`; `spacing="0"`–`"3"` sets `--line-avatar-group-overlap` to `0`, `--line-size-1`…`-3`; reflected; unknown is no attribute | Matches ARCH §13.2 and Stack; agents get a small closed set; no style in TypeScript. Named sizes are numbers, not words |
| (b) Named enums | `size="sm \| md \| lg"`, `spacing="tight \| normal \| loose"`, same mechanism | Readable names. Three steps only, and a second naming style beside Stack's numbers |
| (c) Tokens only | no `size` or `spacing` attributes; consumers set `--line-avatar-size` and `--line-avatar-group-overlap` | Avatar F7 parity. Contradicts ARCH §13.2 "Props: max, size, spacing": an ARCH change and a Phase 1 spec AM with trigger `decision`; agents cannot size the group |
| (d) Free CSS lengths | `size="2.5rem"`, `spacing="8px"` | Any value. The component must write custom properties on its own `style` from TypeScript (Law 5) or rely on Chromium-only `attr()`; agents get an open string |

### F9 — Status markers in the stack

**Evidence.** `0009-avatar.md` G4: `--line-avatar-status-visibility: hidden` hides a slotted status from view and from the accessibility tree, and C11 may use it (`:472`). A presence marker carries a name such as "Online" (`0009-avatar.md` F6). Under F2 the group's state follows hover and focus.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Untouched | the group never sets the token; markers show in every state; a consumer hides them by setting the token on the group | Presence stays visible and announced; nothing changes with hover. Markers on overlapped avatars may sit under the next avatar |
| (b) Hidden while collapsed | `:host(:not([data-expanded]))` sets the token to `hidden` | A clean stack. What a screen reader hears changes with hover and focus, and touch users never see presence |
| (c) Always hidden | the group sets `hidden` in every state | A clean stack. Presence never reaches anyone inside a group |

### F10 — Agent descriptor

**Evidence.** The Phase 1 spec C11 row sets `agentExposed: true` (`:1167`). A2UI v0.9.1 has no basic type for an avatar group; ARCH §17.3 maps basic `Row` to `<line-stack>` (`docs/ARCHITECTURE.md:1614`) and `Image` `variant: "avatar"` to Avatar (`:1611`). `0003-icon-button.md` D4 and `0004-button-group.md` D10 (b) found that a child-dependent basic route needs an ARCH §17.3 change and a Phase 1 spec §6.G.2 AM. Stack and ButtonGroup carry `children: ChildList` into the default slot (`descriptors/stack.ts`, `button-group.ts`). ButtonGroup requires a name for agents (`requiredName`) because APG requires a toolbar label (`0004-button-group.md` D7); R8 marks a group's name optional (`:72`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `line` catalog only, no required name | `AvatarGroup` with `children`, `max`, `size`, `spacing` and `overflowLabel` (F7, F8); `hostNaming: always`; no `requiredName`; the `basic` map unchanged | No ARCH or Phase 1 spec change. An agent can forget the group name; basic-only agents keep a Row of avatar Images with no overflow |
| (b) (a) with a required name | as (a), plus `requiredName: [{ kind: 'accessibilityLabel' }]` | Every agent group is named. A nameless node becomes a placeholder, though R8 marks the name optional |
| (c) (a) plus a `basic` route | a basic `Row` whose children are all `Image` with `variant: "avatar"` renders `line-avatar-group` | Basic agents get stacks. A child-dependent target: an ARCH §17.3 change, a Phase 1 spec §6.G.2 AM (decision), and a tag that may switch while children arrive |
| (d) Not agent-exposed | `agentExposed: false` with a reason | Contradicts the C11 row; needs a Phase 1 spec AM with trigger `decision` |

### F11 — htmx row

**Evidence.** The htmx row applies to value-bearing or compound components (plan §2.4, `docs/plans/01-plan-core-primitives.md:172-175`), and ARCH §17.2 C9 names AvatarGroup as not compound (`docs/ARCHITECTURE.md:1580`). F10 names no value prop. The Phase 1 spec C11 row already reads "`n/a`; not compound (rule C9, plan §2.4)" (`:1167`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `n/a` | the Tests row says `n/a` with that reason | Confirms the C11 row. A server-swapped avatar is a child added at run time, which the Unit and Surface tiers cover (D13) |
| (b) Run part (d) only | the harness swaps server avatars into the group under htmx 2 and 4 | Proves htmx swaps reach manual assignment. Runs a row the template reserves for value-bearing and compound components |

### F12 — State chain (review gate round 1)

**Evidence.** ARCH §13.2 draws AvatarGroup's states as `collapsed ↔ expanded ↔ overflow_open` (`docs/ARCHITECTURE.md:606`). Under F2 (a) the panel can open with neither hover nor focus on the group, after a touch tap on "+N", and close in the same situation, so the draft went straight from `collapsed` to `overflow_open` and back, reading the chain as a set of states. The review gate found that reading attributed to Miguel without a record.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-11). Strict chain | the machine moves only between neighbours; one open passes `collapsed → expanded → overflow_open` and one close the reverse, each step a transition of its own (States, "Strict chain") | ARCH unchanged and no AM. One platform event becomes two machine transitions, a microtask apart |
| (b) The chain as a set of states | `collapsed ↔ overflow_open` allowed directly | One transition per event. Departs from ARCH §13.2 as drawn, so it would need an ARCH change and a Phase 1 spec AM with trigger `decision` |

### F13 — Which focus expands (review gate round 1)

**Evidence.** The draft sent `FOCUS.IN` on any `focusin`. A pointer click focuses the overflow button in Chromium and Firefox (probe P1) [INFERENCE: a touch tap does the same; P5 tapped only an avatar], and an avatar link takes focus on a tap, so a tap expanded the stack and, after a second tap closed the panel, left it spread until blur, against F2's "touch never expands".

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Chosen** (Miguel, 2026-11-11). Keyboard focus only | `FOCUS.IN` only when the focused element matches `:focus-visible`; the Browser tier taps "+N" and an avatar link and asserts that the stack stays collapsed | Mouse and touch focus expand nothing; keyboard users keep the expansion. A pointer click on "+N" opens the panel through `expanded` anyway (F12) |
| (b) Any focus, touch excepted | `FOCUS.IN` on any `focusin` unless the last pointer was touch | Mouse focus also expands. Needs a pointer-type memory across events |

### F14 — Keeping "+N" under the pointer (review gate round 1)

**Evidence.** Probe P9. The drafted layout A moves "+N" 36 px toward inline-end while the stack expands, wider than its own 32 px box, so a pointer that enters on "+N" ends over avatar 3 and its click does not open the panel, in chromium, firefox and webkit. Layouts B, C and D keep "+N" at the same position to 0.02 px in all three engines, and the click opens the panel. Only D changes no layout box and records no layout shift in Chromium. ARCH §13.2 says "Hover expands" and "click on overflow opens popover" (`docs/ARCHITECTURE.md:606`); the target visual ends the stack with "+3".

| Option | What it decides | Consequence |
|---|---|---|
| (a) Margins, as drafted (P9 layout A) | `margin-inline-start` from overlap to gap on each wrapper after the first and on `root`; the host grows toward inline-end | Simplest CSS. "+N" slides out from under the pointer, and a direct click misses it (P9) |
| (b) A, anchored by the page (P9 layout B) | as (a), and the docs ask consumers to place the group against its container's inline-end | "+N" stays put where the page anchors it (P9). The component cannot enforce it; a group in running text or at inline-start keeps the (a) problem |
| (c) "+N" first (P9 layout C) | `order: -1` on `root`, so "+N" leads and the avatars after it grow toward inline-end | "+N" stays put in every placement (P9). The count comes before the faces, against the target visual's trailing "+3"; the host still grows and shifts what follows |
| (d) **Recommended.** Nested translate toward inline-start (P9 layout D) | the `item` wrappers nest, each level holding the earlier avatars, and while expanded each level moves by `translate` one step (`overlap + gap`) toward inline-start, mirrored under `:dir(rtl)`; static CSS, no per-avatar index | "+N" and the host box stay put, no layout shift, the trailing "+N" of the target visual holds, and RTL works (P9). The spread avatars overlap up to `max` × step of the content before the group (36 px at `max` 3), and an ancestor with `overflow: hidden` clips them [INFERENCE: not probed]; the wrapper nesting is `max` levels deep, which D20 then describes |

None of the options contradicts ARCH §13.2 or the Phase 1 spec. Miguel chose (d) on 2026-11-11; D4 and D20 state the layout, and Part A's Anti-patterns and Part B's consumer note state its cost.

### F15 — Focus ring placement (review gate round 1)

**Evidence.** ARCH §14.9 says "Each interactive component draws a default ring on `::part(root)` under `[data-focus-visible]`" (`docs/ARCHITECTURE.md:1250`). The draft had no `root` part and drew the ring on `::part(overflow)`.

| Option | What it decides | Consequence |
|---|---|---|
| (a) Ring on `overflow`, departure recorded | no `root` part; the spec records why the ring sits on `overflow` | No extra element. ARCH §14.9 holds only with a recorded exception, or with an ARCH wording change |
| (b) **Chosen** (Miguel, 2026-11-11). A `root` part around the "+N" button | `<span part="root">` wraps the button and carries the default ring under `:host([data-focus-visible])` | ARCH §14.9 holds literally. One more part, and the overlap applies to `root` |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
