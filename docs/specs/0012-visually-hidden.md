# Visually Hidden

| Field | Value |
|-------|-------|
| Status | `approved` (Miguel, 2026-11-12) |
| Phase | `1` |
| Tier | `Static` (Phase 1 spec §6.C.4 C12 row, `docs/specs/01-spec-core-primitives.md:1168`; PRD §4.1, `docs/PRD.md:256`; ARCH §8, `docs/ARCHITECTURE.md:410`) |
| Tag | `line-visually-hidden` |
| Entrypoint | `@websublime/line-components/visually-hidden` (Phase 1 spec §4.2, `:251`, `:300`; §10 SD12, `:2359`) |
| Form-associated | `no` (Phase 1 spec §6.C.4 C12 row) |
| PRD catalogue entry | PRD §4.1, `Visually Hidden` row (`docs/PRD.md:256`) |
| Ledger row | `01-C12` (`docs/plans/01-tasks-core-primitives.md:58`) |
| Governing sections | Phase 1 spec §4.2 (`:251`, `:300`), §6.C.0 (`:908-931`), §6.C.4 (C12 row `:1168`, notes `:1147-1153`, `:1179-1183`), §6.C.6 (`:1218-1233`), §6.G.1 (`:1299`, reason row `:1338`), §6.G.2, §6.G.3, §6.G.4, §6.G.5, §7.4, §7.6, §7.8, §10 SD12, SD34, SD38 (`:2385`), SD39, SD98, SD99, §12 AM-096; ARCH (v0.8.27) §3, §4, §5, §8, §12, §14.6–§14.9, §17.2–§17.4, §17.9 (`:1697`); PRD (v0.8.32) §4.1, §5.2, §8; MANIFESTO Laws 1–6, 9, 10; R8 `docs/research/01-research-accessibility.md:74`; R7 `docs/research/01-research-zag-machines.md:79`; `0007-badge.md` (`:155`, `:216`, `:411`, `:469`; AM-003) |

Text marked `[INFERENCE]` has no probe or source behind it yet. Miguel decided Open Questions F1–F6 on 2026-11-12, each on the option the draft recommended, and Part A and Part B state those decisions. The orchestrator defaults D1–D15 stand as drafted (Miguel, 2026-11-12). The spec stays `proposed` until the review gate passes and Miguel approves it.

---

## Probes

Throwaway probes ran on 2026-11-12 to inform F1–F6 and defaults D2, D3, D7, D13 and D15. Their code lived in `packages/line-components/temp/c12-probe/`, which `.gitignore` ignores through its `temp` entry, and was deleted after the run. Nothing of it is committed.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2, arm64; Bun 1.4.3 |
| Runner | Playwright 1.64.0 with its own engines, chromium 156.0.8078.4, firefox 157.0 and webkit 27.2; one config with three projects, one worker |
| Built components | `./badge` and `./button` from `dist/` of this branch, rebuilt first, bundled with Lit, `line-core` and Zag by `bun build` into one module and added to the P6 page |
| Probe hosts | plain `HTMLElement`s with an open shadow root that holds a `<style>` and a `<slot>`, and no Lit (table below) |
| axe | `@axe-core/playwright` 4.14.0 with axe-core 4.14.0, once with the §7.4 tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and once with every rule |
| Chromium accessibility tree | a CDP session, `Accessibility.getFullAXTree`, walked from each case's wrapper through `DOM.querySelectorAll` and `DOM.describeNode`, reading `role` and `name` of every node that is not ignored |
| Other engines | Playwright's `ariaSnapshot()`, which Playwright computes itself from the DOM |
| Unit tier | happy-dom 20.14.6 through `bun-test-preload.ts`, with a `LineElement` subclass whose Lit `static styles` hold `commonReset` and the hiding rule |

The recipe R is the one `packages/line-genui/src/a2ui/surface.css:5-12` uses for the surface live region: `position: absolute`, `inline-size: 1px`, `block-size: 1px`, `overflow: hidden`, `clip-path: inset(50%)` and `white-space: nowrap`.

| Host | Shadow root | Hiding rule |
|---|---|---|
| `vh-host` | `<slot>` | R on `:host` |
| `vh-host-wrap` | `<slot>` | R on `:host` without `white-space: nowrap` |
| `vh-inner` | `<span part="root"><slot></span>` | R on the inner `<span>`; the host keeps the default `display: inline` |
| `vh-inner-wrap` | `<span part="root"><slot></span>` | R on the `<span>` without `white-space: nowrap` |
| `vh-clip` | `<slot>` | R plus the legacy `clip: rect(0 0 0 0)` on `:host` |
| `vh-zag` | `<slot>` | the `@zag-js/dom-query` 1.47.0 `visuallyHiddenStyle` declarations on `:host`, which use `margin: -1px` and `clip` and no `clip-path` (`node_modules/.bun/@zag-js+dom-query@1.47.0/node_modules/@zag-js/dom-query/dist/visually-hidden.mjs:4-15`) |
| `vh-inset` | `<slot>` | R plus `inset-block-start: 0; inset-inline-start: 0` on `:host` |
| `vh-focus` | `<slot>` | R on `:host(:not(:focus-within))` |
| `vh-hasfv` | `<slot>` | R on `:host(:not(:has(:focus-visible)))` |
| `vh-block` | `<slot>` | `display: block` plus R on `:host` |
| `vh-imp` | `<slot>` | R on `:host` with every declaration `!important` |
| `span.sr` | none | R in a document rule on a light-DOM `<span class="sr">`, the reference |
| `span.sr-wrap` | none | `span.sr` without `white-space: nowrap` |

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `bun --filter '@websublime/line-core' build && bun --filter '@websublime/line-components' build` | 0 | fresh `dist/` for the Badge and Button bundle |
| 2 | `bun build entry.js --outfile bundle.js --target browser --format esm --define 'process.env.NODE_ENV="production"'` in the probe folder, `entry.js` importing `../../dist/badge/index.js` and `../../dist/button/index.js` | 0 | one 77 KB module |
| 3 | `bunx playwright test -c packages/line-components/temp/c12-probe/playwright.config.ts` | not recorded (piped through `tail`) | 21 passed, 3 failed (1.3 min). The three failures were the pre-upgrade test of P5 in each engine. `page.setContent` keeps the custom-element registry, so its second case found `line-visually-hidden` already defined |
| 4 | the same command with `-g 'P4'`, the probe file's name for the P5 test, after each of its cases got a fresh page from `context.newPage()` | not recorded (piped through `tail`) | 3 passed; P5 below |
| 5 | the same command with `-g 'inline-end'`, a case added after row 3 | not recorded (piped through `tail`) | 3 passed; the inline-end column of P3 |
| 6 | `bun test ./packages/line-components/temp/c12-probe/happy.test.ts` | not recorded (piped through `tail`) | 1 fail, because the probe expected `:defined` to match a defined element and happy-dom returned `false`; every observation was written before the assertion; P8 |
| 7 | `rm -rf packages/line-components/temp/c12-probe packages/line-components/test-results && rmdir packages/line-components/temp`; `git status --short` | 0 | deleted; the tree is clean |

WebKit on macOS moved Tab focus with Alt+Tab, as the existing Browser tier does. "Same" in a column means the result of the chromium column. Every axe run in P2, P4 and P6 reported only page-level findings of the bare probe page, `document-title` and `html-has-lang` with the §7.4 tags, plus `landmark-one-main`, `page-has-heading-one` and `region` with every rule. No run reported a finding on a probe host or its content.

### P1 — Placement and visual footprint

Each case rendered `<span>A</span>`, a hidden host holding "these words stay hidden from sight", and `<span id="b">B</span>` in a 300 px parent at 24 px, then the same parent without the hidden host. The probe compared the parent box, B's offset inside it and an element screenshot of the parent.

| Placement | block | `flex`, `gap: 10px` | `grid`, three 60 px columns, `gap: 10px` | `inline-flex`, `gap: 10px` |
|---|---|---|---|---|
| R on `:host` (`vh-host`), and `vh-clip`, `vh-zag`, `vh-inset`, `span.sr` | box and pixels identical | identical | identical | identical |
| R on an inner `<span>` (`vh-inner`) | identical | B moves 26 → 36 px, because the host is a flex item with a gap | B moves 70 → 140 px, because the host takes a grid cell | the parent grows 42 → 52 px |

- The results were the same in chromium, firefox and webkit to 0.02 px.
- A host whose rule sits on `:host` is out of flow, so a flex or grid parent never sees it. A host that carries no rule stays an empty inline box, which a flex or grid parent turns into an item with gaps and a cell.
- R on `:host` blockifies the host, which computes `display: block` (P7).

### P2 — Names and word boundaries

The hosts `vh-host`, `vh-host-wrap`, `vh-inner`, `vh-inner-wrap`, `vh-zag`, `vh-clip`, `span.sr` and `span.sr-wrap` were each placed in six contexts, every context in its own wrapper.

| Context | Markup | Chromium accessibility tree, every variant | `ariaSnapshot()`, every variant |
|---|---|---|---|
| button, no space | `<button>Inbox<X>5 unread messages</X></button>` | `button "Inbox 5 unread messages"` | same, in chromium, firefox and webkit |
| button, space | `<button>Inbox <X>5 unread messages</X></button>` | `button "Inbox 5 unread messages"` | same |
| link | `<a href="#">Read more<X> about pricing</X></a>` | `link "Read more about pricing"` | same |
| heading | `<h2><X>Account settings</X></h2>` | `heading "Account settings"` | same |
| standalone | `<div><X>Results updated</X></div>` | `StaticText "Results updated"` | `text: Results updated` |
| long, 300 px wide | `<button>Save<X> the draft of this very long message to the outbox folder</X></button>` | `button "Save the draft of this very long message to the outbox folder"` | same |

| Word boxes of the long case (11 words) | chromium | firefox | webkit |
|---|---|---|---|
| With `white-space: nowrap` (`vh-host`, `vh-inner`, `vh-zag`, `vh-clip`, `span.sr`) | 1 line | 1 line | 1 line |
| Without it (`vh-host-wrap`, `vh-inner-wrap`, `span.sr-wrap`) | 11 lines, one word each | 11 lines | 11 lines |

- The hidden text stays in the tree, is read standalone, and joins the name of a button, a link and a heading in every engine, as R8 says (`docs/research/01-research-accessibility.md:74`).
- Chromium and Playwright put a space between "Inbox" and the hidden words when the markup has none [INFERENCE: because the absolutely positioned box is block-level].
- The names are the same with and without `nowrap`. Only the line layout differs.
- In the Chromium tree a `:host` variant adds an unnamed `generic` node for the host between the control and its text. `vh-inner` and `span.sr` add none. The node changes no name.

### P3 — Scrollable overflow by recipe

A 200 × 100 px `overflow: auto` container held a 100 px tall block and then the hidden host, under `dir="ltr"` and `dir="rtl"`, with `position: static` and `position: relative`. A second case filled one line with a 200 px inline block and put the host after it. A third page held a `100vh` block and then the host in `<body>`. Values are scroll size over client size where they differ; "none" means no overflow.

| Recipe | Positioned container, block-end, LTR and RTL | Positioned container, filled line, LTR and RTL | Unpositioned container | Document after `100vh`, LTR | Document after `100vh`, RTL |
|---|---|---|---|---|---|
| R (`vh-host`, `vh-inner`, `span.sr`) | height 101/100 | width 201/200 | none | height 721/720 | height 721/720 |
| R plus `clip` (`vh-clip`) | chromium, webkit 101/100; firefox none | chromium, webkit 201/200; firefox none | none | chromium, webkit 721/720; firefox none | chromium, webkit 721/720; firefox none |
| Zag (`vh-zag`) | none | none | none | none | chromium, webkit width 1281/1280; firefox none |
| R plus logical insets (`vh-inset`) | none | none | none | none | none |

- R adds one pixel of scrollable overflow wherever the host's static position sits at the end edge of its containing block, in all three engines. Web Awesome hit the same scrollbar and fixed it with `top: 0; left: 0` (`shoelace-style/webawesome#2567`, closed; `packages/webawesome/src/styles/utilities/visually-hidden.css` at `bb146e8`).
- `inset-block-start: 0; inset-inline-start: 0` removes the overflow in every case and engine, RTL included.
- The insets move the 1 px box to the start corner of its containing block, the nearest positioned ancestor or the initial containing block. A screen reader that scrolls to the box it reads may then scroll there [INFERENCE: not observable here].

### P4 — Focus reveal

The page held `<X id="skip"><a href="#main">Skip to main content</a></X>`, a navigation link, and `<main id="main" tabindex="-1">` holding `<X id="ttl"><h1 tabindex="-1">Page title</h1></X>`. Sizes are the hosts' boxes in CSS px.

| Step | `vh-focus`, chromium | firefox | webkit | `vh-hasfv` | `vh-host` (no reveal) |
|---|---|---|---|---|---|
| Load | both hosts 1 × 1 | same | same | both hosts visible in chromium (145 × 18, 1264 × 45); 1 × 1 in firefox and webkit | 1 × 1 |
| Tab | focus on the skip link; `skip` 145 × 18 | 145 × 17 | 145 × 18 | still visible in chromium; focus on the link and still 1 × 1 in firefox and webkit | focus on the link, still 1 × 1 |
| Tab again | focus on "Home"; `skip` 1 × 1 | same | same | no change | 1 × 1 |
| Mouse click, then `link.focus()` from script | `skip` 145 × 18 | 145 × 17 | 145 × 18 | as at load | 1 × 1 |
| Mouse click, then `h1.focus()` from script | `ttl` 1264 × 45 | 1264 × 45 | 1264 × 66 | as at load | 1 × 1 |
| axe while the link has focus | page-level findings only | same | same | same | same |

- `:host(:not(:focus-within))` reveals the content while focus is inside and hides it again when focus leaves, in all three engines. Tab order follows the DOM.
- Script focus reveals as well, so a hidden heading that receives focus after a route change shows.
- `:host(:has(:focus-visible))` cannot serve. Chromium never applies the rule, and Firefox and WebKit never reveal.
- axe reports nothing for a focused link that stays invisible (`vh-host`), so no automated check catches a WCAG 2.4.7 failure here.

### P5 — Before `customElements.define()`

The page held `<button>Inbox<line-visually-hidden id="h"> 5 unread messages</line-visually-hidden></button>`. `line-visually-hidden` was defined with R on `:host` only after the first measure, each case on a fresh page.

| Case | Moment | chromium | firefox | webkit |
|---|---|---|---|---|
| No consumer rule | before `define()` | `:defined` false; `position: static`; the words show, 121 × 15 | 125 × 16 | 105 × 13 |
| | after | `:defined` true; `position: absolute`; 1 × 1 | same | same |
| Consumer rule `line-visually-hidden:not(:defined) { R }` | before | `:defined` false; `position: absolute`; 1 × 1 | same | same |
| | after | `:defined` true; `position: absolute`; 1 × 1 | same | same |

- The button's name was "Inbox 5 unread messages" in every row, in the Chromium tree and in `ariaSnapshot()` in all three engines.
- An undefined `line-visually-hidden` is an inline element, so its words show until the module runs. A consumer rule keyed on `:not(:defined)` hides them in all three engines and stops matching after the upgrade, when `:host` takes over.

### P6 — The Badge case

The page loaded the built `./badge` and `./button` bundle.

| Case | Markup | Chromium tree | `ariaSnapshot()`, three engines |
|---|---|---|---|
| b1 | `<button>Inbox <line-badge>5<vh-host> unread messages</vh-host></line-badge></button>` | `button "Inbox 5 unread messages"` | same |
| b2 | as b1 with `<span class="sr">`, the `0007-badge.md` probe P1 form | `button "Inbox 5 unread messages"` | same |
| b3 | `<line-badge>5<vh-host> unread messages</vh-host></line-badge>` alone | `StaticText "5"`, `StaticText "unread messages"` | `text: 5 unread messages` |
| b4 | `<line-button>Inbox <line-badge slot="suffix">5<vh-host> unread messages</vh-host></line-badge></line-button>` | `button "Inbox 5 unread messages"` | same |
| b5 | `<line-badge>5</line-badge>` alone | `StaticText "5"` | `text: "5"` |
| b6 | b1 with `vh-inner` | `button "Inbox 5 unread messages"` | same |
| b7 | `<line-button>Inbox <line-badge slot="suffix">5</line-badge></line-button>` | `button "Inbox 5"` | same |

- The hidden words inside a badge join the name of a native button and of `<line-button>` in all three engines, through two levels of slots.
- The badge with hidden words has the same box as the badge without them, 8.91 × 22.39 px in chromium and webkit and 8.90 × 22.40 px in firefox, and neither reflects `data-empty`.
- A count in Button's `suffix` slot joins the inner button's name (b7).

### P7 — Hiding the host, and overriding the rule

| Case | Computed on the host, three engines | Chromium tree | `ariaSnapshot()`, three engines |
|---|---|---|---|
| `<button>Inbox<vh-host> 5 unread messages</vh-host></button>` | `display: block`, `position: absolute`, 1 × 1 | `button "Inbox 5 unread messages"` | same |
| the host with `aria-hidden="true"` | as above | **`button "Inbox 5 unread messages"`**; the button node holds only `StaticText "Inbox"` | `button "Inbox"` |
| the host with `hidden` | `display: none` | `button "Inbox"` | `button "Inbox"` |
| `vh-block` with `hidden` | `display: block`, 1 × 1 | `button "Inbox 5 unread messages"` | same |
| consumer rule `.unhide { position: static; inline-size: auto; block-size: auto; overflow: visible; clip-path: none }` on `vh-host` | `display: inline`, `position: static`, 96 × 18 (firefox 96 × 17) | `StaticText "Shown words"` | `text: Shown words` |
| the same rule on `vh-imp` | `position: absolute`, 1 × 1 | `StaticText "Shown words"` | same |

- `hidden` removes the words for everyone, because the UA `[hidden]` rule sets `display: none` and the host declares no `display`.
- A `display` on `:host` beats the UA rule, so `hidden` then hides nothing.
- Chromium keeps an `aria-hidden` host's words in the enclosing button's name, as `0007-badge.md` probe P1 found for a hidden count. Playwright drops them.
- Normal consumer CSS on the host beats the `:host` rule, as the Stack Browser tier proved (`packages/line-components/__tests__/integration/stack/stack.e2e.ts:153-169`). `!important` on `:host` beats it back.

### P8 — happy-dom 20.14.6

| Check | Result |
|---|---|
| Lit `static styles` | two adopted sheets on the shadow root and no `<style>`; the `:host(:not(:focus-within))` rule text reads back from `cssRules` |
| `getComputedStyle(host).position` | `absolute`, so happy-dom applies the adopted `:host` rule |
| `slot.assignedNodes()` | `#text` and `A`; the flattened text reads " 5 unread link" |
| Focus on the slotted link | `document.activeElement` is the link; the host does not match `:focus-within`, and `position` stays `absolute` |
| `getBoundingClientRect()` | 0 × 0 |
| `checkVisibility()` | `true` |
| `host.matches(':defined')` on a defined element | `false` |

- The unit tier can check the shadow tree, slot assignment and the hidden-state `position`. Layout, the focus reveal and `:not(:defined)` belong to the Browser tier.

### What the probes settle

- The hiding rule belongs on `:host`. An inner wrapper leaves a host that flex and grid parents lay out as an item, with a gap and a grid cell, in all three engines (P1; F1).
- Hidden text stays in the accessibility tree and joins the name of a native button, a link, a heading and `<line-button>`, inside a badge too (P2, P6; F4).
- `white-space: nowrap` changes no computed name and keeps the text on one line (P2; F5).
- The `surface.css` recipe adds one pixel of scrollable overflow at the end edge of a positioned scroll container or the document; logical insets remove it in every case (P3; F5).
- `:host(:not(:focus-within))` reveals focused content in all three engines; a `:has(:focus-visible)` variant does not work (P4; F2).
- A consumer `:not(:defined)` rule hides the words before the upgrade (P5; F3).
- `hidden` removes the host only while `:host` declares no `display` (P7; D3).
- Consumer CSS can override a normal `:host` rule and cannot override an `!important` one (P7; F6).

### What automation cannot observe

- What a screen reader speaks. The "smushed text" report says VoiceOver read words of a wrapped 1 px box run together (J. Renée Beach, "Beware smushed off-screen accessible text", `medium.com/@jessebeach`). P2 shows the wrapping and no name change; the speech is not observed.
- Whether a screen reader scrolls the page to the box it reads, which matters for the insets of F5 (d) [INFERENCE].
- Firefox and WebKit accessibility trees. Playwright's snapshot is its own computation from the DOM, and it differs from Chromium's tree for `aria-hidden` (P7).

---

## Part A — Requirements

### Overview

#### Description

`<line-visually-hidden>` holds content that assistive technology reads and the screen does not show (PRD §4.1, `docs/PRD.md:256`). The consumer writes the content in its default slot. The content stays in the accessibility tree, is read in place, and joins the name of a link, a button or a heading around it (R8 `:74`; probes P2, P6). The host draws nothing and takes no space, so the layout around it does not change, in a block, flex or grid parent alike (P1; F1). While focus sits inside it, the content shows, so a skip link appears when a keyboard user reaches it (P4; F2). It has no props, no parts, no tokens and no events. It is not offered to agents (Phase 1 spec §10 SD38).

#### Use cases

- Words that complete a link's or a button's name when the visible text leans on its surroundings, such as "Read more" plus "about pricing" (P2).
- The meaning of a count inside a badge, such as "5" plus "unread messages", which a button around it reads as "Inbox 5 unread messages" (P6; `0007-badge.md:216`).
- A heading that names a section for screen-reader navigation when the design shows none (P2).
- A skip link that stays hidden until a keyboard user tabs to it (P4; F2).
- Text for a native control whose only visible content is an icon, such as `<button><svg aria-hidden="true">…</svg><line-visually-hidden>Close</line-visually-hidden></button>` [INFERENCE: the name follows from P2's button case; an icon was not probed].

#### Anti-patterns

- Content that no user should get. Use the `hidden` attribute (P7).
- Content that only sighted users should get, such as a decorative glyph. Use `aria-hidden="true"` on that content.
- Naming a line component that has its own name API. Use its `aria-label`, as on `<line-icon-button>` or a named `<line-badge>` dot (`0003-icon-button.md`; `0007-badge.md` F4).
- Hidden words that replace or contradict the visible label. A control's name should start with its visible words, so speech-input users can say what they see (WCAG 2.5.3).
- A message that must be announced when it appears. Visually Hidden announces nothing; use `<line-alert>` or a live region (`0006-alert.md`).
- Hiding content on some screen sizes only. Write consumer CSS for that breakpoint (F6).

#### User expectations

- A screen reader reads the hidden words where they sit, and as part of the name of the control around them (P2, P6).
- Nothing shows on screen, and the layout around the host does not move: no gap, no grid cell, no scrollbar (P1, P3).
- Content that takes focus, such as a skip link, shows while it has focus (P4; F2).
- The `hidden` attribute removes the content for everyone (P7).

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| `<line-badge>` | parent | the Badge default slot, such as `5<line-visually-hidden> unread messages</line-visually-hidden>`; the words join the name of a button around the badge (P6; `0007-badge.md:214-216`; F4) |
| `<line-button>` | parent | the Button default or `suffix` slot; the words join the inner button's name, as P6 b4 showed for `suffix` [INFERENCE: default slot not probed; the Browser tier covers both slots] |
| native `<a>`, `<button>`, `<h1>`–`<h6>` | parent | light DOM; the words join the element's name from content (P2) |
| any container | parent | light DOM; Visually Hidden imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`) |
| `<line-a2ui-surface>` | none | `agentExposed: false`; a `line` node of type `VisuallyHidden` renders the surface's unknown-type placeholder (Agent contract) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| none | — | — |

- Visually Hidden has no C6 semantic variant. It draws nothing, so it has no tokens a variant could change (ARCH §17.2 C6, `docs/ARCHITECTURE.md:1577`).
- Focus reveal needs no attribute, because the rule keys on `:focus-within` alone (F2 (b)).

---

## Part B — Technical Specification

### Anatomy

```
<line-visually-hidden>       LineElement; :host carries the hiding rule while focus is outside (F1, F2, F5)
└── #shadow-root
    └── <slot>
```

- One zone, a slot, because the consumer decides the content (ARCH §3, `docs/ARCHITECTURE.md:217-226`).
- The hiding rule sits on `:host(:not(:focus-within))` (F1 (a), F2 (b)). Its declarations are R plus logical insets (F5 (d)), as normal declarations (F6 (a)).

```css
:host(:not(:focus-within)) {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

- `:host` declares no `display`. The host is an inline element while focus is inside, and absolute positioning blockifies it while hidden (P7). The UA `[hidden]` rule therefore still hides the host, so the stylesheet needs no `:host([hidden])` rule (P7; D3).
- While focus is inside, no component rule applies. The content shows where the host sits, and consumer CSS on `line-visually-hidden:focus-within` places it (Markup examples).
- `commonReset` stays in `static styles` because ARCH §14.7 maps every Static component to it (`docs/ARCHITECTURE.md:1163`). It targets shadow-tree elements only (`packages/line-core/src/styles/reset.common.css:1-38`), so it reaches only the `<slot>` here (D4).
- The host extends `LineElement` without the `FormAssociated` mixin and writes no internals value (D2).
- The component does not import `@zag-js/dom-query`'s `visuallyHiddenStyle` (R7 `:79`). That object is an inline-style map, which MANIFESTO Law 5 keeps out of TypeScript, and its recipe overflows under `dir="rtl"` (P3).

### States

| Field | Value |
|-------|-------|
| Machine | `none` (Static tier; ARCH §8, `docs/ARCHITECTURE.md:410`; Phase 1 spec §6.C.4 C12 row) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| none | — | — | — |

- Visually Hidden reflects no flag. Whether focus is inside is the native `:focus-within`, which matches the host in all three engines (P4), so a consumer styles the revealed state with `line-visually-hidden:focus-within` (D7). ARCH §14.8 says the same of `:focus` (`docs/ARCHITECTURE.md:1172`).

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ChildList` | text and phrasing content, such as words, a link or a heading; focusable content shows while it has focus (F2) |

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| none | — | — |

- MANIFESTO Law 1 holds, because the host is the only zone and a consumer styles it directly with `line-visually-hidden { … }`, as with Separator (`0011-separator.md` Parts). The shadow tree holds no node a part could expose (F1).

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| none | — | — | — | — | — |

- The host takes the global `hidden` attribute, which removes its content for everyone (P7).
- The docs advise against `aria-hidden` on the host. Chromium keeps the words in an enclosing control's name anyway (P7), and content that nobody should hear belongs under `hidden`.
- The docs advise against `aria-label` on the host. The host has no role, so the label would name a `generic`, which ARIA prohibits (R8 `docs/research/01-research-accessibility.md:55`).

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

Visually Hidden holds no value and no interactive element, so it fires nothing and is neither value-bearing nor compound (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`).

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| none | — | — |

- Visually Hidden draws nothing, so it has no token (D5). The revealed state takes consumer CSS on the host.

#### Consumer styling

```css
/* A skip link that shows over the page corner while it has focus (F2) */
line-visually-hidden.skip:focus-within {
  position: fixed;
  inset-block-start: 0.5rem;
  inset-inline-start: 0.5rem;
  z-index: 10;
}

/* Hide the words before the module loads (F3) */
line-visually-hidden:not(:defined):not(:focus-within) {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* Show the words from a breakpoint on (F6) */
@media (min-width: 60rem) {
  line-visually-hidden.wide-label {
    position: static;
    inline-size: auto;
    block-size: auto;
    overflow: visible;
    clip-path: none;
    white-space: inherit;
  }
}
```

- These rules live in the outer tree. Normal outer declarations on the host beat the component's `:host` rule (P7; `stack.e2e.ts:153-169`).
- The breakpoint rule resets `white-space`, so shown words wrap with their parent. P7's override rule left `nowrap` in place [INFERENCE: wrapping of shown words not probed].
- P5 probed the `:not(:defined)` rule as R alone. The `:not(:focus-within)` and the insets follow the component rule [INFERENCE: not probed in that rule].

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

The host takes no focus and handles no key (R8 `:74`). Focusable content inside keeps its own keys and its DOM position in the Tab order (P4). The Browser tier proves that Tab skips an empty host and reaches a slotted link (Phase 1 spec §10 SD99, `:2446`).

### A11y

| Field | Value |
|-------|-------|
| Role | none; no internals role and no `role` attribute (R8 `:74`; D2). Chromium exposes the host as an unnamed `generic` node (P2) |
| ARIA attributes | none written by the component |
| Accessible name | none of its own; the content is read in place and joins the name of an enclosing link, button or heading (P2, P6) |
| Focus | the host is not focusable and does not delegate focus; content inside that takes focus shows while focus is inside (F2) |

- **Proof (D13).** No role or name lives in internals, so the Phase 1 spec CDP-and-read-back rule for internals roles does not apply (`:1180`). The Browser tier proves names with `ariaSnapshot()` in three engines and a Chromium CDP assertion of the enclosing control's name.
- **Focus visible (F2).** A focused element that stays 1 × 1 fails WCAG 2.4.7, and axe does not report it (P4). The reveal rule prevents it for every focusable child.
- **Label in name.** Hidden words should follow the visible words of a control, as in "Read more about pricing", so its name contains its visible label (WCAG 2.5.3). axe's `label-content-name-mismatch` compares `aria-label` with content [INFERENCE: whether it reads hidden content was not probed].
- **Firefox and WebKit.** No check reads their accessibility trees. Playwright's snapshot is its own computation, and it differed from Chromium's tree for `aria-hidden` (P7). The gap is recorded here (Phase 1 spec §12 AM-058).

**What axe proves here.** axe 4.14.0 reported no finding on any probe host or its content, hidden or focused (P2, P4, P6). Zero violations prove that the hidden content breaks no §7.4 rule. They do not prove that a focused child is visible (P4).

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | no props; the content is slotted |
| C2 | Slots carry `@slot` and a single or multiple classification | one `@slot` for the default slot, `ChildList` |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | no events, so no `@fires`; not value-bearing |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated |
| C5 | The host accepts an accessible name and applies it to the element with the role | no element carries a role, and the content is the name it contributes; the docs advise against a host `aria-label` (Props) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | no variants |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries `@summary` and one `@slot`; no `@csspart`, `@cssprop` or `@fires`, because there are none; nothing is deprecated |
| C8 | Missing or partial props degrade to an empty or neutral state | with no content it renders an empty 1 × 1 host that adds nothing to the layout (P1) and no named node or text to the tree [INFERENCE: an empty host was not probed; the Browser tier asserts it through Chromium CDP] |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `VisuallyHidden` (D8) |
| Tag | `line-visually-hidden` |
| `load()` subpath | `@websublime/line-components/visually-hidden` |
| Prop schema | `children` (`ChildList`, through `commonProp` with the description "The child components, in order.", as Stack's, optional), plus `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1) |
| Slot map | `children` → the default slot (`''`) |
| Binding map | none; no value prop; no commit event |
| Action map | none |
| Accessibility requirements | no `requiredName`; `hostNaming: { kind: 'never' }`, because the host has no role a name could attach to (`packages/line-genui/src/catalog/descriptor.ts:160-174`) |
| Agent-facing description | Text that assistive technology reads and the screen does not show, such as words that complete the name of a link or a button. Content inside it that takes keyboard focus shows while it has focus. |
| Tool description | none; no tool is emitted |
| `agentExposed` | `false`, with `agentHiddenReason` "An untrusted agent could add text that only screen readers hear." (Phase 1 spec §6.C.4 C12 row, `:1168`; reason row `:1338`; §10 SD38, `:2385`; ARCH §17.9, `docs/ARCHITECTURE.md:1697`) |

- `defineDescriptor` requires `agentHiddenReason` when `agentExposed` is `false` and keeps it on the descriptor (`packages/line-genui/src/catalog/descriptor.ts:221-244`).
- The `line` catalog emitter and the frontend-tool emitter skip the descriptor (`packages/line-genui/src/catalog/line.ts:84-85`; `tools.ts:298-299`). Acceptance follows Phase 1 spec `:1183`. `VisuallyHidden` is not a key of `components` in the built `catalog.json`, and `frontendTools(descriptors, provider)` returns no tool named `VisuallyHidden` for any provider.
- The surface builds its `line` descriptor map from exposed descriptors only (`packages/line-genui/src/a2ui/projection.ts:59-61`), and the session registers `lineCatalog(descriptors)` (`session.ts:186`). A `line` node of type `VisuallyHidden` therefore renders the inert `unknown-type` placeholder and raises one `UNKNOWN_COMPONENT_TYPE` `line-a2ui-error`, as an unmapped basic type does (`packages/line-genui/__tests__/a2ui-surface.test.ts:152-163`), and `./visually-hidden` never loads.
- The coverage test needs the descriptor, because `line-visually-hidden` enters the manifest (`packages/line-genui/__tests__/cem-coverage.test.ts:21-24`). The drift test checks its default slot against the manifest.
- Five genui test expectations change with a twelfth descriptor (D9).
  - `PROP_TYPES` gains `VisuallyHidden: { children: 'ChildList' }` (`packages/line-genui/__tests__/catalog.test.ts:38-90`).
  - The raw catalog of every descriptor gains `VisuallyHidden`, and the test title at `:109` says twelve descriptors (`:109-123`).
  - The exposure test expects twelve descriptors, with `VisuallyHidden` the one `agentExposed: false` (`:493-497`).
  - The import test expects `descriptors: 12` (`:527`).
  - The tool-description test runs every descriptor through `tool()`, which throws `no VisuallyHidden tool for <provider>` (`packages/line-genui/__tests__/frontend-tools.test.ts:49-52`), so its loop takes the `agentExposed` descriptors only (`:347-353`).
- C12 adds no surface render-fixture entry and no surface axe case, because §6.C.6 asks that only of agent-exposed rows (Phase 1 spec `:1231`).
- Probes P2 and P6 give the reason row evidence. Hidden words join the name of the control around them in all three engines, so an agent could make a control's spoken name differ from its visible label. Phase 1 spec AM-096 cites them and lifts the `[INFERENCE]` that row `:1338` carried.

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/visually-hidden` |
| Kind | `independent` (Phase 1 spec §4.2, `:300`; §10 SD12) |
| Registers | `line-visually-hidden` |
| Reset modules | `commonReset` only (ARCH §14.7, `docs/ARCHITECTURE.md:1163`; D4) |

- The files are `src/visually-hidden/visually-hidden.ts`, with the class `LineVisuallyHidden` and `customElements.define`, and `src/visually-hidden/index.ts`. There is no `.types.ts`, because there are no props; Avatar has none either (`packages/line-components/src/avatar/`).
- `package.json` gains the `./visually-hidden` export (Phase 1 spec §4.2, `:251`), and the Vite build gains the `visually-hidden/index` entry after `stack/index` (`packages/line-components/vite.config.mjs:21`). No new dependency.
- `packages/line-components/__tests__/bundle-splitting.test.ts` gains the `EXPECTED_TAGS` row `'./visually-hidden': ['line-visually-hidden']` (`:56-69`), as C9, C10 and C11 did (commits `91e3359`, `f73b929` and `fe3dce4`; `0010-avatar-group.md:529`). It needs no `ALLOWED_TAG_REFERENCES` row (`:76-78`), because the component matches no other tag.
- `line-genui` gains `src/catalog/descriptors/visually-hidden.ts` with `visuallyHiddenDescriptor`. `src/catalog/index.ts` imports it after `stackDescriptor` (`:25`), adds it to the named exports (`:88-113`) and to the `descriptors` array in catalog-name order (`:116-128`).
- Visually Hidden imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`).

### Markup examples

```html
<!-- Words that complete a link's name: "Read more about pricing" -->
<a href="/pricing">Read more<line-visually-hidden> about pricing</line-visually-hidden></a>

<!-- A count with words, inside a badge: the button's name is "Inbox 5 unread messages" -->
<button type="button">
  Inbox <line-badge>5<line-visually-hidden> unread messages</line-visually-hidden></line-badge>
</button>

<!-- A heading for screen-reader navigation -->
<h2><line-visually-hidden>Account settings</line-visually-hidden></h2>

<!-- A skip link that shows while it has focus (F2), placed by consumer CSS -->
<line-visually-hidden class="skip"><a href="#main">Skip to main content</a></line-visually-hidden>
<main id="main" tabindex="-1">…</main>

<!-- Removed for everyone -->
<line-visually-hidden hidden> unread messages</line-visually-hidden>
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom | registers `line-visually-hidden` with its class; the shadow root holds one `<slot>` and nothing else, and no element carries `part`; the host's computed `position` is `absolute` while nothing has focus (P8); slot assignment of text and elements; no attribute, `data-*` or internals value written (the fake internals read back `null`); no event of any kind; C8 with no content; `packages/line-components/__tests__/manifest-paths.test.ts` on the packed tarball, as Badge's case does (`:167-191`). The test asserts that `line-visually-hidden` resolves to `src/visually-hidden/visually-hidden.ts`, declares no own public field and no event, and has slots `['']`, no `cssParts` and no `cssProperties` |
| Browser | Playwright `*.e2e.ts` on chromium, firefox and webkit | a 1 × 1 host whose parent box, sibling offsets and screenshot match the same parent without it, in block, `flex` with `gap`, `grid` with `gap` and `inline-flex` parents (P1); no scrollable overflow in a positioned `overflow: auto` container at block-end and after a filled line, LTR and RTL, and in the document after a `100vh` block, LTR and RTL (P3); names through `ariaSnapshot()` for a native button, a native link, a heading, and `<line-button>` with the hidden words in its default slot and in `suffix`, in three engines, and a Chromium CDP assertion of the same names (P2; D13); Tab reaches a slotted link and reveals it with a box larger than 1 × 1, and a second Tab hides it again; script focus reveals; Tab skips an empty host (Phase 1 spec §10 SD99) (P4); `hidden` removes the words from the button's name (P7); the consumer `:not(:defined)` rule hides the words before the module loads on a fixture page that imports it late (P5; F3); consumer CSS on the host shows the content (P7; F6); the Badge case, with the shipped `<line-visually-hidden>` inside `<line-badge>` in a native `<button>` and in `<line-button>`, named "Inbox 5 unread messages" through `ariaSnapshot()` in three engines and Chromium CDP; its pass lets the implement PR lift the `0007-badge.md:216` mark through a further `0007-badge.md` AM (P6; F4); a Chromium CDP assertion that an empty host adds no named node and no text to its parent's tree (C8) |
| A11y | axe-core | zero violations (MANIFESTO Law 3) in every story of D11, the focused Skip link included (Phase 1 spec §7.4). axe cannot see an invisible focused child (P4), so the Browser tier carries the reveal proof |
| htmx | Playwright `*.e2e.ts` through the shared harness `@websublime/line-testing/htmx` (`packages/line-testing/src/htmx.ts`), on htmx 2 and htmx 4 in chromium, firefox and webkit | `n/a`. Visually Hidden is neither value-bearing, because its descriptor binding map names no value prop, nor compound, because it holds no interactive element of its own (ARCH §17.2 C3, C9). Server content swapped into its slot is ordinary DOM, which the Unit tier's slot test covers. This confirms the Phase 1 spec's "`n/a` expected" (§6.C.4 C12 row; §10 SD34, `:2381`; D10) |
| Visual | Playwright `visually-hidden.visual.ts` on the `visual` project | every story of D11 with Linux baselines from a `visual-baselines.yml` run, so a regression that shows hidden words or moves the layout changes a baseline (Phase 1 spec §6.C.6, `:1233`; §10 SD98) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the coverage and drift tests pass with the new descriptor (§6.G.5); the built `catalog.json` equals the emitted document (`catalog-emitters.test.ts:150-153`), whose `components` keys equal `LINE_COMPONENTS` (`:162`), which stays unchanged and holds no `VisuallyHidden` (`:65-77`); no provider's tools include `VisuallyHidden` (`frontend-tools.test.ts`), and the tool-description loop takes exposed descriptors only (`:347-353`); `PROP_TYPES`, the raw-catalog list and the descriptor counts change as the Agent contract says (`catalog.test.ts:38-90`, `:109-123`, `:493-497`, `:527`); the descriptor keeps `agentExposed: false` and its reason (`:493-501`) (Phase 1 spec `:1183`; D9) |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts` | a `line` node of type `VisuallyHidden` renders one inert `unknown-type` placeholder, raises one `UNKNOWN_COMPONENT_TYPE` error and creates no `line-visually-hidden` (D9) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./visually-hidden` register `line-visually-hidden` only, through its new `EXPECTED_TAGS` row, and the isolation scan finds no other component's module or tag in its bundle (Phase 1 spec §7.5; `bundle-splitting.test.ts:56-69`) |

- PRD §5.2 checklist mapping (`docs/PRD.md:514`; Phase 1 spec §6.C.6, `:1222`). Render, slots and events (none fired) run in the Unit tier. Reactive props, parts and custom properties have nothing to test. Keyboard runs in the Browser tier and axe in the A11y tier.
- F4 (a) adds the Badge story "Count with hidden words", id `components-badge--count-with-hidden-words`, whose markup is the "Inbox" button of Markup examples (`:490-492`), so the Badge axe and visual tests cover it with one new baseline. `0007-badge.md` AM-003 records it.
  - `apps/storybook/stories/components/badge.stories.ts` gains the story and `import '@websublime/line-components/visually-hidden'`. Its header comment drops the deferral of the Avatar and Visually Hidden examples (`:16-19`), and its description names `<line-visually-hidden>` in place of `<span class="visually-hidden">` (`:32`).
  - `packages/line-components/__tests__/badge-stories.ts` gains the story id, and `waitForBadgeStory` adds `line-visually-hidden` to the elements it awaits, which today are `line-badge, line-button, line-stack` (`:34`).
  - Once the Browser-tier Badge case passes with the shipped element, the implement PR writes a further `0007-badge.md` AM that lifts the `:216` mark. That AM also marks `0007-badge.md:155` with `[INFERENCE: default slot not probed]` for the Button default slot, because P6 b7 probed only `suffix`, unless the Browser tier's `<line-button>` default-slot test proves that slot, in which case the AM says so and cites the test.
- No update-rate measurement, because Visually Hidden is not a machine row (Phase 1 spec §6.C.6, `:1232`).
- The axe and visual tests run against the Storybook stories on port 4320, with the story list in `packages/line-components/__tests__/visually-hidden-stories.ts`, as `badge-stories.ts` does for Badge. The layout, focus and pre-upgrade tests use fixture pages under `packages/line-components/__tests__/integration/visually-hidden/`, served by the existing port-4321 `webServer` (`playwright.config.ts:23-28`).
- `packages/line-components/__tests__/visually-hidden-stories.ts` exports `VISUALLY_HIDDEN_STORIES` and `readyVisuallyHiddenStory(page, id)`, as `avatar-group-stories.ts` exports `readyAvatarGroupStory` (`:48`).
  - The story ids are `components-visually-hidden--in-a-link`, `--in-a-button`, `--section-heading`, `--skip-link` and `--skip-link-focused`.
  - `readyVisuallyHiddenStory` waits for every `line-visually-hidden` to update. For `--skip-link-focused` it then presses Tab, Alt+Tab in webkit, and asserts that the skip link has focus and that its host's box is larger than 1 × 1.
  - `__tests__/a11y/visually-hidden.e2e.ts` calls it before the axe check, as `a11y/avatar-group.e2e.ts:33` does, because the axe tier opens stories itself and runs no `ready` hook.
  - `__tests__/visual/visually-hidden.visual.ts` passes it as the caller-supplied `ready` option of `expectStoryScreenshot` (`visual/story.ts:28`, `:41`), as `visual/avatar-group.visual.ts:18` does.

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| F1 | Does the hiding rule live on `:host` over a bare slot or on an inner wrapper, and does a `::part()` exist? | Miguel | resolved: option (a), the rule on `:host` over a bare slot and no part (Miguel, 2026-11-12) |
| F2 | Does content inside show while it has focus, and through which API? | Miguel | resolved: option (b), content shows whenever focus is inside, through `:host(:not(:focus-within))`, with no attribute (Miguel, 2026-11-12) |
| F3 | Who hides the words before the element upgrades? | Miguel | resolved: option (a), a consumer `:not(:defined)` rule that the docs and the class JSDoc give (Miguel, 2026-11-12) |
| F4 | Which PR adds the Badge example and settles the two `0007-badge.md` inferences that P6 informs? | Miguel | resolved: option (a), in this PR. `0007-badge.md` AM-003 lifts the `:155` inference, narrows the `:216` mark to the shipped element, which the C12 Browser tier proves, and restates D11; C12 adds the Badge story "Count with hidden words" and fixes the Badge story description (Miguel, 2026-11-12) |
| F5 | Which CSS recipe hides the host? | Miguel | resolved: option (d), the `surface.css` recipe plus `inset-block-start: 0; inset-inline-start: 0` (Miguel, 2026-11-12) |
| F6 | Can consumer CSS override the hiding rule? | Miguel | resolved: option (a), normal declarations that consumer CSS can override (Miguel, 2026-11-12) |

**Orchestrator defaults** (Miguel left D1–D15 as drafted, 2026-11-12)

| # | Default | Basis |
|---|---------|-------|
| D1 | Static, with no machine, no props and no events; neither value-bearing nor form-associated | ARCH §8, `:410`; Phase 1 spec §6.C.4 C12 row, `:1168` |
| D2 | No role, no internals value, no ARIA attribute written | R8 `:74`; probe P2 |
| D3 | `:host` declares no `display`, so the UA `[hidden]` rule hides the host and no `:host([hidden])` rule is needed | Probe P7 shows `hidden` working on `vh-host` and failing on `vh-block`. Separator needs the rule because it sets `display` (`0011-separator.md` Anatomy) |
| D4 | `commonReset` is the only reset module | ARCH §14.7, `:1163`. ARCH §14.6 lets a component that renders nothing omit it (`docs/ARCHITECTURE.md:1138`); Separator kept it under the same row (`0011-separator.md` Anatomy) |
| D5 | No CSS custom properties and no variants | No visual surface; ARCH §17.2 C6 |
| D6 | No focus on the host, no key handling, no `delegatesFocus`, no `tabindex` | R8 `:74` Keyboard "None" |
| D7 | No reflected state for the revealed host; consumers use the native `:focus-within` | Probe P4 shows `:focus-within` matching the host in all three engines; ARCH §14.8 says `:focus` matches the host natively (`docs/ARCHITECTURE.md:1172`) |
| D8 | Catalog name `VisuallyHidden`; prop schema `children` (`ChildList`) with slot map `children` → `''`; `hostNaming: never`; no `requiredName`; no tool description; `agentExposed: false` with the reason text of Phase 1 spec `:1338` | PRD row name without the space, as ARCH §8 writes it (`:410`); §6.G.1 "Every component MUST keep a descriptor"; Stack's `children` pattern (`packages/line-genui/src/catalog/descriptors/stack.ts:28-30`) |
| D9 | The genui tests change as the Agent contract and Tests rows say, and C12 adds no surface fixture or surface axe entry | Phase 1 spec `:1183`, `:1231`; `catalog.test.ts:38-90`, `:109-123`, `:493-497`, `:527`; `frontend-tools.test.ts:347-353` |
| D10 | htmx row `n/a` | Phase 1 spec §10 SD34; ARCH §17.2 C3, C9 |
| D11 | `apps/storybook/stories/components/visually-hidden.stories.ts`, with `title: 'Components/Visually Hidden'`, which the story ids below depend on, as `avatar-group.stories.ts:70` gives AvatarGroup's, `tags: ['autodocs']` and a `DESCRIPTION` that carries the F3 consumer rule and the D14 advice, as `badge.stories.ts:21`, `:48-49` do. Stories, each a self-contained snippet: In a link, `<a href="#pricing">Read more<line-visually-hidden> about pricing</line-visually-hidden></a>`; In a button, a native `<button type="button">` with the visible text "Delete" and the hidden words " draft Quarterly report"; Section heading, `<h2><line-visually-hidden>Account settings</line-visually-hidden></h2>` over a paragraph; Skip link, `<line-visually-hidden class="skip"><a href="#main">Skip to main content</a></line-visually-hidden>` before `<main id="main" tabindex="-1">`, with the Consumer styling `.skip:focus-within` rule in a story `<style>`; Skip link focused, the same markup, which `readyVisuallyHiddenStory` focuses. The Badge example is the Badge story "Count with hidden words" (F4 (a)) | One axe and one visual baseline per meaningful state (Phase 1 spec §6.C.6; `0007-badge.md` D11) |
| D12 | The C12 PR also adds a Visually Hidden row to `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1, which has none yet, writes the Storybook docs, adds a `## Visually Hidden` section to `packages/line-components/README.md` beside the other components' sections, adds `visuallyHiddenDescriptor` to the export table of `packages/line-genui/README.md:39`, reports the gzipped size against the < 5 KB soft target, and adds one changeset covering `line-components` and `line-genui` | Phase 1 spec §6.C.6, `:1223-1227`; §7.6; PROCESS §6 |
| D13 | The Browser tier proves names with `ariaSnapshot()` in three engines and a Chromium CDP assertion, and runs no `INTERNALS` read-back | Phase 1 spec `:1180` applies to internals roles, and Visually Hidden sets none (D2); probe P2 |
| D14 | The class JSDoc says what the component is for, that focused content shows, how to hide the words before the upgrade, to use `hidden` and not `aria-hidden` to remove the words, not to put `aria-label` on the host, and to put hidden words after a control's visible words | Badge's JSDoc pattern (`0007-badge.md` D14); probes P4, P5, P7; WCAG 2.5.3 |
| D15 | The component does not import `@zag-js/dom-query`'s `visuallyHiddenStyle` | R7 `:79`; MANIFESTO Law 5; probe P3 (RTL overflow) |

Miguel decided F1–F6 on 2026-11-12, each on the option the draft recommended, and left D1–D15 as drafted. The option tables below stay as the record of what he weighed.

### F1 — Placement of the hiding rule

**Evidence.** In probe P1, with the rule on `:host`, the parent box, the sibling offsets and the screenshot match the parent without the host, in block, flex, grid and inline-flex parents, in all three engines. With the rule on an inner `<span>`, the inline host becomes a flex item with a 10 px gap, takes a grid cell (B moves from 70 to 140 px), and widens an inline-flex parent by 10 px. In probe P2 the names are the same either way, and the `:host` placement adds an unnamed `generic` node to Chromium's tree. MANIFESTO Law 1 asks for a part on every styleable zone and says a consumer must be able to retheme any visible surface (`docs/MANIFESTO.md:39`). A hidden zone has no visible surface. While focus is inside (F2), the visible surface is the host, which a consumer styles directly, as Separator's host (`0011-separator.md` Parts). Shoelace's `<sl-visually-hidden>` puts its rule on `:host(:not(:focus-within))` over a bare slot (`shoelace-style/shoelace` `src/components/visually-hidden/visually-hidden.styles.ts`, `next`). Web Awesome dropped the element for a `wa-visually-hidden` utility class (`packages/webawesome/src/styles/utilities/visually-hidden.css` at `bb146e8`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `:host` and a bare slot | the rule sits on `:host`; the shadow tree holds only `<slot>`; no part | Zero footprint in every parent (P1). The host is the one styleable zone, as on Separator. Consumer CSS on the host can override the rule (F6) |
| (b) Inner wrapper with a part | `<span part="root"><slot></span>` carries the rule; the host stays inline | A `::part(root)` exists, though it styles a zone nobody sees. The host takes a gap and a grid cell in flex and grid parents (P1), which breaks the "no footprint" expectation |
| (c) Both | the rule on `:host`, plus `<span part="root">` around the slot for the revealed state | Zero footprint. One more element, and a part whose styles apply only while focus is inside, which `line-visually-hidden:focus-within` on the host already covers |

### F2 — Focus reveal

**Evidence.** In probe P4, `:host(:not(:focus-within))` hides the host until a child takes focus, by Tab or by script, and hides it again when focus leaves, in all three engines. A `tabindex="-1"` heading focused by script after a route change also shows. A rule keyed on `:has(:focus-visible)` never applies in Chromium and never reveals in Firefox and WebKit. A host with no reveal leaves a focused link at 1 × 1, which fails WCAG 2.4.7, and axe reports nothing. R8 lists no keyboard for the component (`:74`). Shoelace reveals focused content always (`shoelace.style/components/visually-hidden`, "the element will become visible when something inside receives focus"), and Web Awesome's class does the same (`visually-hidden.css` at `bb146e8`, `.wa-visually-hidden:not(:focus-within)`). C6 limits a variant to token defaults (`docs/ARCHITECTURE.md:1577`), so an attribute that switches the rule is a behaviour prop, as Separator's `decorative` is.

| Option | What it decides | Consequence |
|---|---|---|
| (a) None | the rule applies whatever has focus | Simplest rule. A focusable child stays invisible while focused, a WCAG 2.4.7 failure no automated check catches (P4); the docs must forbid focusable content |
| (b) **Recommended.** Always, no attribute | the rule sits on `:host(:not(:focus-within))` | Skip links work with no API, as in Shoelace and Web Awesome, in all three engines (P4). A heading focused by script after a route change shows while focused; an author who wants it unseen moves focus elsewhere |
| (c) Opt-in boolean | a reflected boolean, such as `focusable`, switches the rule to `:host(:not([focusable])), :host([focusable]:not(:focus-within))` | Authors choose per use, and the route-change heading can stay hidden. One prop, agent-irrelevant (not exposed). Without the attribute a focusable child fails 2.4.7 silently, as in (a) |
| (d) Keyboard focus only | the rule keys on `:focus-visible` inside the host | Shows only for keyboard users. P4 refutes the only selector that reaches slotted content, `:host(:has(:focus-visible))`, in every engine; a script-driven variant would need focus listeners and a reflected state |

### F3 — Words shown before the upgrade

**Evidence.** In probe P5, before `customElements.define()` runs, `line-visually-hidden` is an inline element and its words show (121 × 15 px in Chromium), in all three engines; the button's name is the same before and after. A document rule `line-visually-hidden:not(:defined) { R }` keeps the host at 1 × 1 before the upgrade and stops matching after it. Component modules load as modules, so they run after the parser has built the page [INFERENCE: the length of the window depends on the consumer's loading]. `line-themes` ships theme CSS only (`packages/line-themes/src/index.css`), and MANIFESTO Law 10 points dependencies downward (`docs/MANIFESTO.md:57`). `line-components` exports no CSS file today (`packages/line-components/package.json:20-70`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Documented consumer rule | the Storybook docs and the class JSDoc give the `:not(:defined)` rule of Consumer styling | Works in all three engines (P5) at no package cost. Each consumer who cares copies one rule, and one who does not sees the words until the module runs |
| (b) Shipped in `line-themes` | `line-themes` adds the rule | Theme users get it with no copy. A design-system layer names a component tag, which Law 10's downward rule questions, and consumers without the theme still see the words |
| (c) Shipped as a CSS file in `line-components` | a new export such as `@websublime/line-components/visually-hidden.css` | Owned by the component. The first CSS export of the package, which needs build and exports changes beyond ARCH §12's JS subpaths; consumers must still link it in `<head>` |
| (d) Nothing | no rule and no docs | No work. Hidden words show until the module runs, with no advice |

### F4 — Badge follow-ups

**Evidence.** Probe P6 tests `0007-badge.md:216` with the built `<line-badge>` and a probe host that carries R on `:host`, without the decided insets and focus rule, so it does not test the shipped element. The hidden words join a native button's name in all three engines and in Chromium's tree, and they do not change the badge's box. It does confirm `0007-badge.md:155`, whose `[INFERENCE]` says Badge text in `<line-button>` was probed with a native button only. That case needs no hidden element, and the built `<line-button>Inbox <line-badge slot="suffix">5</line-badge></line-button>` is `button "Inbox 5"`. `0007-badge.md:411` and D11 (`:469`) defer Visually Hidden examples to row 01-C12, and the Badge stories say so (`apps/storybook/stories/components/badge.stories.ts:19`). The Badge story description recommends `<span class="visually-hidden">` (`badge.stories.ts:32`), a class no line package ships. Row 01-C10 left Avatar examples out of the Badge stories and showed the badge in Avatar's own stories instead (`apps/storybook/stories/components/avatar.stories.ts:120-122`), so the Avatar half of D11 is already stale.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** In this PR | a `docs(spec): AM-003` row in `0007-badge.md` lifts the `:155` and `:216` inferences with P6 and restates D11 for both halves; the Badge story description names `<line-visually-hidden>`; Badge gains a "Count with hidden words" story with its axe run and visual baseline | Lands what D11 deferred to this row and removes the non-existent class from the docs. The PR touches a `done` row's spec and stories, and one Badge baseline joins the C12 baseline run |
| (b) In this PR, C10's pattern | the same AM row; the Badge description names `<line-visually-hidden>`; the badge example is a Visually Hidden story, not a Badge story | Same evidence and one less Badge baseline. The Badge docs page shows the recipe only in text |
| (c) New ledger row | a stream C row after C12 merges carries the AM row and the story changes; this PR touches no Badge file | Keeps this PR to one component. The Badge docs keep recommending a class nobody ships until that row lands |

Review gate round 1 found that P6 tested a probe host, not the shipped element. AM-003 therefore lifts the `:155` inference, which P6 tested with built components only, and narrows the `:216` mark until the C12 Browser tier proves the Badge case with the shipped `<line-visually-hidden>`; a further `0007-badge.md` AM lifts it then. The (a) row stays as the record of what Miguel weighed.

### F5 — CSS recipe

**Evidence.** In probe P2, with and without `white-space: nowrap`, every name is the same in Chromium's tree and Playwright's snapshot, and without it each word lays out on its own line in all three engines; a VoiceOver report ties that layout to words read run together (Beach). In probe P3, R, the `surface.css:5-12` recipe, adds one pixel of scrollable overflow at the block-end of a positioned scroll container, after a filled line, and after a `100vh` block in the document, in all three engines. Adding the legacy `clip` helps only Firefox. The Zag recipe (`margin: -1px`, `clip`, no `clip-path`) removes the container overflow and adds a 1 px horizontal document overflow under `dir="rtl"` in Chromium and WebKit. R plus `inset-block-start: 0; inset-inline-start: 0` removes every overflow in every engine. Web Awesome added `top: 0; left: 0` for the same scrollbar (`shoelace-style/webawesome#2567`). Every engine of the PRD target supports `clip-path` [INFERENCE: from the probe engines, which honour it].

| Option | What it decides | Consequence |
|---|---|---|
| (a) R, as `surface.css` | `position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap` | One recipe across the repo. A 1 px scrollbar in a positioned scroll container or a full-height page (P3) |
| (b) R plus legacy `clip: rect(0 0 0 0)` | adds the deprecated `clip` | Fixes the overflow in Firefox only (P3) |
| (c) Zag's `visuallyHiddenStyle` | `margin: -1px`, `clip`, physical sizes, no `clip-path` | Fixes container overflow; a 1 px document scrollbar under `dir="rtl"` in Chromium and WebKit (P3); relies on deprecated `clip` |
| (d) **Recommended.** R plus logical insets | R and `inset-block-start: 0; inset-inline-start: 0` | No overflow in any probed case, LTR and RTL (P3). The box moves to its containing block's start corner, so a screen reader that follows the box may scroll there [INFERENCE: not observable]. `surface.css` keeps R unless its own row changes it |

### F6 — Override of the hiding rule

**Evidence.** In probe P7, a consumer rule on the host that sets `position: static` and clears the size and clip shows the words (96 × 18 px), because normal outer declarations beat `:host`. With `!important` on every `:host` declaration, the same rule loses and the host stays 1 × 1. Shoelace and Web Awesome mark every declaration `!important` (sources in F1). ARCH §4 makes consumer CSS win over `:host` defaults, and Separator relies on it (`0011-separator.md` Consumer styling).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Normal declarations | the `:host` rule carries no `!important` | A consumer can show the words at a breakpoint or restyle the hidden box, as with any line host. A page rule that matches the host and sets one of the declarations can expose the words by accident |
| (b) `!important` | every declaration of the rule is `!important` | No outer rule can expose the words. A consumer who wants them shown at a breakpoint must change the markup; the rule departs from the ARCH §4 pattern every other line host follows |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
