# Skeleton

| Field | Value |
|-------|-------|
| Status | `proposed` — DRAFT, 2026-11-13; PRD §8.2 "Draft written, not yet reviewed" (`docs/PRD.md:1208`) |
| Phase | `1` |
| Tier | `Static` (Phase 1 spec §6.C.4 C15 row, `docs/specs/01-spec-core-primitives.md:1171`; PRD §4.1, `docs/PRD.md:261`; ARCH §8, `docs/ARCHITECTURE.md:410`) |
| Tag | `line-skeleton` |
| Entrypoint | `@websublime/line-components/skeleton` (Phase 1 spec §4.2, `:254`, `:303`; §10 SD12, `:2359`) |
| Form-associated | `no` (Phase 1 spec §6.C.4 C15 row) |
| PRD catalogue entry | PRD §4.1, `Skeleton` row (`docs/PRD.md:261`) |
| Ledger row | `01-C15` (`docs/plans/01-tasks-core-primitives.md:61`) |
| Governing sections | Phase 1 spec §4.2 (`:254`, `:303`), §6.C.0 (`:908-931`), §6.C.4 (C15 row `:1171`, notes `:1147-1153`, `:1179-1183`), §6.C.6 (`:1218-1233`), §6.G.1 (`:1299`, reason table `:1332-1338`), §6.G.2, §6.G.3 (`:1405`, `:1422`, `:1434-1435`), §6.G.4 (`aria-busy` `:1475`, host naming `:1512-1518`), §6.G.5 (`:1597`), §7.4 (`:2111`), §7.5, §7.6, §7.8, §10 SD12, SD34 (`:2381`), SD38 (`:2385`), SD39 (`:2386`), SD47 (`:2394`), SD98 (`:2445`), SD99 (`:2446`), §12 AM-013, AM-058, AM-086, AM-098 (`:2559`); ARCH (v0.8.27) §3, §4, §5 (`:303-327`), §8 (`:410`), §12, §14.7 (`:1163`), §14.8, §17.2 (`:1566-1580`), §17.3, §17.4 (Theme row `:1639`, Accessibility row `:1643`); PRD (v0.8.33) §4.1, §5.2 (`:534-543`), §8 (`:1194-1217`); MANIFESTO Laws 1, 3, 4, 5, 9, Out of Scope (`docs/MANIFESTO.md:66-67`); R8 `docs/research/01-research-accessibility.md:55`, `:78`, `:241`, `:284-287` |

Text marked `[INFERENCE]` has no probe or source behind it yet. This is a draft. Open Questions F1–F8 are open for Miguel, each with a **Recommended** option, and the orchestrator defaults D1–D21 wait for his review. Part A and Part B describe the recommended option of every fork, so they change wherever Miguel picks another option. The spec moves to `approved` before any code is written (PRD §8.3, `docs/PRD.md:1217`; Phase 1 spec §6.C.6, `:1229`).

---

## Probes

Throwaway probes ran on 2026-11-13 to inform F1–F8 and defaults D2, D5, D6, D8, D9, D12, D16, D17, D18, D19 and D20. Their code lived in `packages/line-components/temp/c15-probe/`, which `.gitignore` ignores through its `temp` entry (`.gitignore:4`), and the competitor tarballs in `/tmp/c15-comp/`, outside the repository. Both were deleted after the run. Nothing of them is committed.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2.1, arm64; Bun 1.4.3; Node v22.23.3 |
| Runner | Playwright 1.64.0 with its own engines, chromium 156.0.8078.4, firefox 157.0 and webkit 27.2; one config with three projects on the repo's device presets (`Desktop Chrome`, `Desktop Firefox`, `Desktop Safari`, as `playwright.config.ts:31-33`), one worker. Pages were served from `http://probe.local` through `route.fulfill` |
| Probe component | `line-probe-skeleton`, a `LitElement` with Lit 3.3.3 and no `LineElement`. It drew the draft design: a `root` part holding one `item` part per line, `shape` (`rect`, `circle`, `text`) through token defaults, `lines`, and `animation` (`pulse`, `wave`, `none`) with its own `@keyframes`. Probe-only switches: `pulse-src="token"` set `animation: var(--line-animation-pulse)`, the `line-tokens` token; `wrap-mode` (`visibility`, `inert`, `aria-hidden`) with `loading` drew the wrapper variants of F6. The probe chose keyframes by attribute selectors and stopped motion under `prefers-reduced-motion` with an `!important` rule; P3 and P4 checked the token form and the normal-importance rule that Part B adopts |
| Probe hosts | `probe-tpl`, a plain `HTMLElement` that clones a `<template>` into an open shadow root and writes `role`, `ariaHidden`, `ariaBusy` and `ariaLabel` to its `ElementInternals` from attributes; bare `<div>` hosts with an open shadow root and one adopted `CSSStyleSheet`, for the keyframe sweeps of P3 |
| Tokens | `packages/line-tokens/src/` `motion.css`, `easings.css`, `animations.css`, `sizing.css` and `radii.css` linked into each page; the gray roles stood in as `--line-gray-bg: #e6e6e6` and `--line-gray-bg-hover: #f5f5f5`, because `line-colors` was not loaded. P4 also ran with no token file |
| htmx | the shared harness `packages/line-testing/src/htmx.ts` (`routeHtmx`, `expectSlotSwap`) on htmx 2.0.11 and 4.0.0, plus probe-local swap cases |
| axe | `@axe-core/playwright` 4.14.0 with axe-core 4.14.0, once with the §7.4 tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and once with every rule |
| Chromium accessibility tree | a CDP session, `Accessibility.getFullAXTree`, walked from each case's wrapper through `DOM.querySelector` and `DOM.describeNode`, reading `role`, `name` and the `busy`, `hidden`, `live` and `focusable` properties of every node that is not ignored |
| Other engines | Playwright's `ariaSnapshot()`, which Playwright computes itself from the DOM |
| Unit tier | happy-dom 20.14.6 through `bun-test-preload.ts`, with Lit, zod 3.25.76, `@a2ui/web_core` 0.14.0, and the `line-genui` catalog, tools and surface from `src/` |
| Competitors | `npm pack` of `@awesome.me/webawesome` 3.14.0, `@spectrum-web-components/bundle` 1.12.6, `@lion/ui` 0.27.0, `@fluentui/web-components` 3.2.1, `bits-ui` 2.21.0, `@ark-ui/react` 5.40.0 and `@radix-ui/themes` 3.3.0; `npm view` of `@spectrum-web-components/skeleton` and `@radix-ui/react-skeleton` |
| Size | esbuild 0.28.2 and `gzip -9 -n` |

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `bun build bundle-entry.ts --outfile bundle.js --target browser --format esm` in the probe folder | 0 | one 58.77 KB module with the probe component, `probe-tpl` and Lit |
| 2 | `node_modules/.bin/playwright test -c packages/line-components/temp/c15-probe/playwright.config.ts a11y.probe` | 0 | 3 passed; P1 |
| 3 | the same config with `anim.probe` | 0 | 9 passed; P2, the first rows of P3, P4 |
| 4 | the same config with `wrapper.probe shape.probe` | 1 | 6 passed, 3 failed: the pre-upgrade case waited for the module that its page loads only later, and timed out; P5, P7 |
| 5 | the same config with `wrapper.probe -g P4b`, after the probe fixture stopped waiting on such pages | 0 | 3 passed; P6 |
| 6 | the same config with `htmx.probe` | 0 | 6 passed; P8 |
| 7 | `bun test ./packages/line-components/temp/c15-probe/happy.test.ts` | 0 | 3 pass; P9, P10 |
| 8 | `node_modules/.bin/esbuild size-entry.ts --bundle --minify --format=esm --target=es2022 --external:lit`, then `gzip -9 -n` | not recorded (output printed in one call) | P11 |
| 9 | `node v.mjs`, which launched each engine and printed `browser.version()` | not recorded (output printed in one call) | the engine versions of this table |
| 10 | the same Playwright config with `kf.probe`, `kf2.probe`, `kf3.probe`, `kf4.probe` and `kf5.probe` (run twice, the second time with `part` cases), one call each | 0 each | 3 passed each; P3 |
| 11 | the same config with `extra.probe` | 0 | 4 passed, 2 skipped (forced colors is emulated in Chromium only); P4 |
| 12 | the same config with `cascade.probe` and `varname.probe`, one call each | 0 each | 3 passed each; P3, P4 |
| 13 | `npm view` and `npm pack` of the competitor packages in `/tmp/c15-comp`, then `tar xzf` | not recorded (several commands in one call) | the competitor rows of F2, F5 and F6 |
| 14 | `curl -sL https://www.w3.org/TR/WCAG21/` and a text extraction of SC 2.2.2 | 0 | the SC 2.2.2 text of F4 |
| 15 | `rm -rf packages/line-components/temp/c15-probe /tmp/c15-comp /tmp/wcag21.html`; `git status --short` | 0 | deleted; the tree holds only this spec |

"Same" in a column means the result of the chromium column. Every result below was the same in chromium, firefox and webkit unless a column says otherwise.

### P1 — Busy semantics

Each case sat in its own `<div>` on one page. "Text placeholder" is a `probe-tpl` whose shadow root holds `<div class="box">Lorem ipsum</div>`, which stands for a placeholder that carries text, as a wrapper does (F6).

| Case | Chromium tree under the wrapper | `ariaSnapshot()`, three engines |
|---|---|---|
| B0 `<line-probe-skeleton>`, one empty `item` | nothing | empty |
| B0b the same with `shape="text" lines="3"` | nothing | empty |
| B1 `<section aria-busy="true" aria-label="Profile">` holding a paragraph and a three-line skeleton | `region "Profile"` with `busy=1`, its paragraph; nothing for the skeleton | `region "Profile"` and the paragraph; no busy state |
| B1b `<div aria-busy="true">` holding a skeleton | `generic` with `busy=1` | empty |
| B2 text placeholder | `generic`, `StaticText "Lorem ipsum"` | `text: Lorem ipsum` |
| B2b text placeholder with `aria-hidden="true"` on the shadow `div` | nothing | empty |
| B3 text placeholder, `internals.ariaHidden = "true"` | nothing | **`text: Lorem ipsum`** |
| B4 text placeholder, `aria-hidden="true"` on the host | nothing | empty |
| B5 text placeholder, `internals.ariaBusy = "true"` | `generic`, `StaticText "Lorem ipsum"`; **no `busy` property on any node** | `text: Lorem ipsum` |
| B5b `<line-probe-skeleton aria-busy="true">` | `generic` with `busy=1` | empty |
| B6 `internals.role = "status"`, `internals.ariaLabel = "Loading"` | `status "Loading"` with `live=polite` | empty |
| B7 `internals.role = "progressbar"`, no name | `progressbar ""` | empty |
| B8 `<div role="progressbar">`, no name | `progressbar ""` | `progressbar` |
| B9 `<button>` holding only a text skeleton | `button ""` | `button` |
| B10 `<div role="status" aria-busy="true">` holding a skeleton | `status ""` with `live=polite`, `busy=1` | `status` |
| B11 `<line-probe-skeleton aria-label="Loading">` | `generic "Loading"` | empty |

- `ElementInternals` has `role`, `ariaHidden`, `ariaBusy` and `ariaLabel` in all three engines.
- An empty placeholder adds no node to the Chromium tree and nothing to the snapshot, alone or inside a busy container (B0, B1).
- `aria-busy` on an attribute reaches the Chromium tree as `busy=1`, on a named region, a `generic` or a host (B1, B1b, B5b). `internals.ariaBusy` on the host does not (B5).
- `internals.ariaHidden` hides the text in Chromium, but `ariaSnapshot()` still shows it (B3), because Playwright computes the snapshot from the DOM and does not read internals. Only a CDP assertion and an internals read-back prove it (Phase 1 spec `:1180`).
- axe with the §7.4 tags reported two violations, the same as with every rule: `aria-progressbar-name` on B8 and `button-name` on B9. B7, the nameless internals `progressbar`, raised nothing, as R8 §2.4 records for internals roles (Phase 1 spec `:2122`). B11's named `generic` raised nothing, as `0015-kbd.md` P4 found. With every rule axe listed `color-contrast` in `incomplete` for the text placeholders only.

### P2 — Animation from the component's own CSS

Each case held one `line-probe-skeleton`; the probe paused each animation and read the computed style of `item` at 0, 500 and 1000 ms.

| Case | `getAnimations()` on `item` | Samples at 0 / 500 / 1000 ms |
|---|---|---|
| A1 `animation="pulse"`, own `@keyframes line-skeleton-pulse { 50% { opacity: .5 } }`, `--line-motion-7` (2 s), `--line-easing-in-out` | `line-skeleton-pulse`, `normal` | opacity 1 / 0.612 / 0.5 |
| A3 `animation="wave"`, own `@keyframes line-skeleton-wave` moving `background-position` from `100% 0` to `-100% 0` over a `linear-gradient` of `background-size: 200% 100%`, `--line-easing-linear` | `line-skeleton-wave`, `normal` | `background-position` 100% / 50% / 0% |
| A4 `animation="none"` | none | — |
| A5 `animation="wave"` inside `dir="rtl"`, with `animation-direction: reverse` under `:host(:dir(rtl))` | `line-skeleton-wave`, `reverse` | −100% / −50% / 0% |
| A7 `animation="none"`; the page's `::part(item)` rule sets `animation: line-pulse 2s ease-in-out infinite`, a `line-tokens` keyframe | `line-pulse` | opacity 1 / 0.75 / 0.5 |
| A8 `animation="none"`; the page's `::part(item)` names `line-skeleton-wave`, and the page defines its own `@keyframes line-skeleton-wave` on `opacity` | `line-skeleton-wave` | chromium and webkit: the page's keyframes (opacity 0.1 / 0.125 / 0.15); **firefox: the shadow's keyframes** (`background-position` 100% / 50% / 0%) |
| A9 `animation="wave"`, with the page's same-named `@keyframes line-skeleton-wave` | `line-skeleton-wave` | the shadow's keyframes, `background-position` 100% / 50% / 0% |

- The component's own keyframes run in all three engines, and a page keyframe with the same name does not replace them (A1, A3, A9).
- A consumer's `::part(item)` rule that names a keyframe of the page runs in all three engines (A7). One that names the component's keyframe resolves differently by engine (A8), so the component's keyframe names are not a styling API (D18).
- The wave runs from inline-start to inline-end and reverses under `dir="rtl"` (A5; D17).

### P3 — Keyframes of `line-tokens` from inside the shadow root

The question is whether the component can take its pulse from `--line-animation-pulse` (`packages/line-tokens/src/animations.css:98`), whose keyframe `line-pulse` (`:71-75`) lives in the document.

| Case | chromium | firefox | webkit |
|---|---|---|---|
| A2, the probe component with `pulse-src="token"`: `animation: var(--line-animation-pulse)` on `item`, which carries `part="item"` | **no animation**; `animation-name` computes to `line-pulse` | `line-pulse` runs | `line-pulse` runs |
| a `<style>` in a template shadow root naming an unlayered page keyframe, or `line-pulse` | none | none | runs |
| an adopted sheet naming a page keyframe: plain selector, `:host` selector, through `var()` declared on the page or on `:host`, or beside an unrelated own keyframe | none | none | runs |
| the same adopted sheet on an element that carries a `part` attribute, on a `<div>` host or a custom-element host | none | **runs** | runs |
| `:host { --k: own-pulse } :host([wave]) { --k: own-wave }` and `animation-name: var(--k)` on `item`, own keyframes | `own-pulse`, and `own-wave` with the attribute | same | same |
| the same, with the page setting `--k: none` on the host | none | none | none |

- Chromium never resolves a document keyframe from a rule in a shadow root. Firefox resolves it only for an element that carries a `part` attribute, and WebKit always does. So `--line-animation-pulse` cannot drive the component's pulse, and a `line-tokens` wave token could not either (F2).
- A keyframe name in a component token resolves against the component's own keyframes in all three engines, and a consumer's token on the host wins over the `:host` default (D6).

### P4 — Reduced motion, iteration count, forced colors and missing tokens

| Case | Result |
|---|---|
| `page.emulateMedia({ reducedMotion: 'reduce' })`, the probe's `@media (prefers-reduced-motion: reduce) { [part='item'] { animation: none !important } }` | no animation on any P2 case, A7's consumer `::part` rule included; `matchMedia('(prefers-reduced-motion: reduce)').matches` is `true` in all three engines |
| reduced motion, a shadow rule `@media (prefers-reduced-motion: reduce) { .box { animation: none } }` at normal importance, and a page rule `::part(item) { animation: line-pulse 2s infinite }` | the page rule's `line-pulse` runs; without the page rule, none |
| `::part(item) { animation-iteration-count: 2 }` on a 2 s pulse | `iterations` 2, `endTime` 4000 ms; at 4100 ms `playState` is `finished`, `getAnimations()` is empty and opacity is back to 1 |
| Chromium, `emulateMedia({ forcedColors: 'active' })` | `item` with the token colour computes `background-color` to `rgb(255, 255, 255)`, the page's Canvas, so the placeholder vanishes; with `--line-skeleton-bg: GrayText` it computes `rgb(96, 0, 0)`, so a system colour survives. Firefox and WebKit skipped |
| no token file on the page | every `animation` shorthand that reads `--line-motion-7` computes `animation-name: none`, and `item` is 0 px tall, because `--line-size-4` is unset (CSS Custom Properties Level 1, "invalid at computed-value time") |

- `!important` in the shadow beats a consumer's `::part` rule, and a normal-importance rule does not (F3).
- A finite iteration count ends the motion and leaves the resting style (F4).

### P5 — Wrapper mode

Each wrapper host held an `<input>`, a `<button>` and a `<p>` in its default slot. While `loading`, the shadow root wrapped the slot in a `<div>` that took one of three treatments. Pages ran Tab from an input before the wrappers to an input after them.

| Case | Tab stops, chromium and firefox (webkit) | Pointer at the slotted input hits | Slotted input `visibility` | Chromium tree | `ariaSnapshot()` | axe |
|---|---|---|---|---|---|---|
| W1 wrapper `visibility: hidden` | skipped | the host | `hidden` | nothing | empty | — |
| W2 wrapper `inert`, content drawn | skipped | the host | `visible`; the content stays painted | nothing | **the three controls** | — |
| W3 wrapper `aria-hidden="true"` | `w3-in`, `w3-btn` (webkit: `w3-in`) | the input | `visible` | nothing | empty | **`aria-hidden-focus`**, three engines, both rule sets |
| W4 not loading | `w4-in`, `w4-btn` (webkit: `w4-in`) | the input | `visible` | the three controls | the three controls | — |

- `visibility: hidden` on a shadow wrapper hides slotted content from sight, Tab, pointer and the Chromium tree in all three engines (W1).
- `inert` alone keeps the content painted, so it does not draw a placeholder (W2), and Playwright's snapshot does not model inert across the slot.
- `aria-hidden` alone leaves the controls focusable, which axe reports (W3).
- WebKit's Tab skips buttons in all cases, as macOS keyboard settings do by default [INFERENCE: the WebKit setting was not read].
- Each loading wrapper host took the content's height, 64 px, as W4 did.

### P6 — Before `customElements.define()`

| Host | Before `define()` | After |
|---|---|---|
| `<line-probe-skeleton>` | 0 × 0 px; nothing shows | 1264 × 20 px |
| a wrapper with `loading` and `<p>Loaded text</p>` | the text shows (`checkVisibility` true) | the text is hidden |
| a skeleton the page styles with `line-probe-skeleton.pre:not(:defined) { display: block; block-size: 1.25rem; background: #e6e6e6 }` | 1264 × 20 px | 1264 × 20 px |

- A placeholder takes no space until its module runs, and a consumer `:not(:defined)` rule closes the gap (D19). A wrapper shows its content, stale or empty, until its module runs (F6).

### P7 — Shapes and lines

Each case sat in a 400 px column, in a 16 px font with `line-height: 1.5`. `CSS.supports('block-size', '1lh')` is `true` in all three engines.

| Case | Box (width × height, px) | `item` boxes | Radius |
|---|---|---|---|
| `rect` (default) | 400 × 20 | 400 × 20 | 5px |
| `circle` | 400 × 48 | 48 × 48 | 50% |
| `text` | 400 × 24 | 400 × 16 | 2px |
| `text`, `lines="3"` | 400 × 72 | 400 × 16, 400 × 16, 240 × 16 | 2px |
| `<p>One<br>Two<br>Three</p>` | 400 × 72 | — | — |
| `rect`, `lines="3"` | 400 × 76 | 400 × 20, 400 × 20, 240 × 20 | 5px |
| `text`, `lines="2"` inside an `<h2>` at 2rem, `line-height: 1.2` | 400 × 76.75 (firefox 76.8) | 400 × 32, 240 × 32 | 2px |
| `<h2>One<br>Two</h2>` with the same font | 400 × 76.78 (firefox 76.8) | — | — |
| `lines="-2"` | 400 × 20 | one `item` | 5px |

- `text` draws a bar of `1em` with `calc((1lh - 1em) / 2)` above and below, so each line takes one line box of the surrounding font, within 0.03 px of real text (F5).
- Every shape changes only the defaults of component tokens (D6).

### P8 — htmx

| Case | htmx 2 and htmx 4, three engines |
|---|---|
| `hx-get` swaps text into `#list`, which held a three-line skeleton, with `innerHTML` | the skeleton is gone and the text shows |
| a skeleton with `hx-get`, `hx-trigger="load"` and `hx-swap="outerHTML"` | the server's `<article>` replaces it |
| a wrapper with `loading` and the same `load` trigger, replaced by a wrapper without `loading` | the new content shows; the slot holds one element |
| harness `expectSlotSwap` (d) on a wrapper that is not loading | passed |

- htmx replaces a placeholder with server content through its own swaps, and the component needs nothing from htmx (D12).

### P9 — happy-dom

| Check | Result |
|---|---|
| `shape="text" lines="3"` | three `item` elements; one adopted sheet |
| `getAnimations()` on `item` | a function that returns `[]`; `animation-name` computes to `''` |
| `matchMedia('(prefers-reduced-motion: reduce)').matches` | `false` |
| `lines="x"` | one `item` |

- The unit tier can check parts, attributes, reflection and the `lines` rule. Animations, reduced motion, sizes and accessibility belong to the Browser tier.

### P10 — Agent path

A stub descriptor `Skeleton` for `line-probe-skeleton` took five props: `shape` (`z.enum(['rect', 'circle', 'text'])`), `lines` (`DynamicNumber`), `animation` (`z.enum(['pulse', 'wave', 'none'])`), `loading` (`DynamicBoolean`) and `child` (`ComponentId`, slot map `child` → default slot), each bound to the attribute of its name, with `hostNaming: { kind: 'never' }` and a 482-character agent-facing description. It is wider than the recommended schema, so one run covers F6 and F7. The probe appended it to the exported `descriptors` array before it loaded the surface module, because the surface reads that array at module load (`packages/line-genui/src/a2ui/projection.ts:58-61`).

| Check | Result |
|---|---|
| `lineCatalogDocument` | a `Skeleton` entry with `allOf` of `ComponentCommon` and an own object; `shape` and `animation` are string enums, `lines` a `$ref` to `DynamicNumber`, `loading` to `DynamicBoolean`, `child` to `ComponentId` |
| `inlineCatalog` against `client_capabilities.json#/$defs/Catalog` (Ajv 2020) | valid, with `Skeleton` |
| `frontendTools`, OpenAI | `shape`, `lines`, `animation`, `loading`, each nullable and required, `additionalProperties: false`; **no `child`** |
| Anthropic | the same four, optional |
| Gemini | the same four with `nullable: true` |
| any provider | no `accessibilityLabel` or `accessibilityDescription`, because `hostNaming` is `never` |
| surface, `line` catalog, a `Stack` root holding four `Skeleton` nodes, one with `shape: "circle"`, one with `shape: "text", lines: 3, animation: "wave"`, one with `accessibility: { label: "Loading" }` | no error; four hosts; `item` counts 1, 1, 3, 1; no `aria-label` on any host |
| `lines` bound to `/n` = 2 and `loading` to `/loading` = `true`, `child` a basic `Text` | `lines="2" loading=""`, and `<p>Loaded</p>` in the host's light DOM |
| then `/loading` = `false` and `/n` = 4 | the same element; `lines="4"`, no `loading`, **and no `shape` or `animation` attribute**: the probe had reflected their defaults, and the surface removed the attributes of props the node does not set |

- The agent path needs attribute bindings only. The surface writes `true` as an empty attribute and removes `false` and absent values (`packages/line-genui/src/a2ui/projection.ts:148`), so the defaults must not depend on a reflected attribute (D8).
- A `child` prop reaches the catalog but not the tools (§6.G.3, `:1405`), so a descriptor that names it in backticks needs a tool description (F6, F7).

### P11 — Size

The probe module, with `probe-tpl` and the probe-only switches, is 4,444 B minified and 1,476 B gzipped through esbuild (`--bundle --minify --format=esm --target=es2022 --external:lit`, then `gzip -9 -n`), the §7.6 recipe without `line-core`. The shipped `./skeleton` adds `LineElement`, `commonReset` and the JSDoc-free token block, and its size lands in the "Size report" step against the < 5 KB soft target [INFERENCE: the shipped figure is not measured yet].

### What the probes settle

- An empty placeholder is invisible to assistive technology in all three engines without any attribute, and `aria-busy` reaches the Chromium tree only as an attribute, not through internals (P1; F1).
- The component must carry its own keyframes: `line-tokens` keyframes do not resolve from its shadow root in Chromium (P2, P3; F2).
- A keyframe name in a token, set by `shape`-like attribute defaults, works in all three engines and leaves the consumer in control (P3; D6).
- A normal-importance reduced-motion rule stops the motion and lets a consumer opt back in; `!important` would not (P4; F3).
- A finite iteration count stops the motion on its own (P4; F4).
- `text` lines match real line boxes through `lh` (P7; F5).
- A wrapper hides content correctly only through `visibility: hidden`, and shows its content before the upgrade (P5, P6; F6).
- htmx swaps need nothing (P8; D12). The agent path works with attribute bindings, provided defaults do not rely on reflection (P10; D8, D9).

### What automation cannot observe

- What a screen reader announces for a busy region, and whether it stays quiet until `aria-busy` is removed. ARIA says assistive technology "MAY ignore changes" while busy (R8 `:78`); P1 reads the tree only.
- Firefox and WebKit accessibility trees. Playwright's snapshot is its own computation from the DOM (Phase 1 spec §12 AM-058).
- Whether users perceive a 2 s opacity pulse as blinking in the sense of WCAG 2.2.2, which F4 weighs.
- Forced colors in Firefox and WebKit, which Playwright does not emulate.

---

## Part A — Requirements

### Overview

#### Description

`<line-skeleton>` is a placeholder that stands where content will appear once it loads, so the page keeps its layout while it waits (PRD §4.1, `docs/PRD.md:261`). It draws a block, a circle or lines of text sized to the surrounding font (F5), and it pulses or sweeps a wave to show that loading is under way (F2). The motion stops after two cycles and whenever the user asks the system for reduced motion (F3, F4). The placeholder is invisible to assistive technology; the region that is loading carries `aria-busy="true"`, and the app replaces the placeholder with the content when it arrives (P1; F1). It holds no content of its own (F6).

#### Use cases

- The avatar, name and bio lines of a profile card while its data loads (P7).
- A list of rows while a server request runs, swapped out by htmx (P8).
- A text block in an article while its paragraphs stream in (P7).
- Placeholders an agent puts in generated UI before its data arrives (P10).

#### Anti-patterns

- Showing a placeholder for content that loads in well under a second. The flash adds noise [INFERENCE].
- Using a skeleton as the only loading cue for a whole page or an action. A loading control or a status message tells assistive technology what is happening; use `<line-spinner>` (C20) or a live region.
- Naming the host with `aria-label`. The host has no role, so the label names a `generic`, which ARIA prohibits (R8 `:55`; P1 B11).
- Putting a skeleton alone inside a button or a link. The control then has no name (P1 B9).
- Leaving the placeholder in place after the content failed to load. Replace it with an error message.

#### User expectations

- The placeholder looks like the shape of the content to come, so the page does not jump when it arrives (P7).
- The motion is subtle, stops on its own, and does not run for users who asked for reduced motion (F3, F4).
- A screen reader hears nothing from the placeholder and learns from the busy region that content is loading (F1).

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| any container | parent | light DOM; the container that is loading carries `aria-busy="true"` while the placeholders show (F1). Skeleton imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`) |
| `<line-stack>` | parent | lays out several placeholders, such as a circle beside text lines; the surface does the same for agent nodes (P10) |
| `<line-avatar>`, `<line-card>` (Phase 5), any content | sibling | the app swaps the placeholder for the content; Skeleton has no slot (F6) |
| `<line-spinner>` (C20) | sibling | the loading indicator for an action or a whole region; Skeleton stands for the layout of content |
| `<line-a2ui-surface>` | orchestrator | creates `line-skeleton` by tag from a `line` catalog `Skeleton` node and writes `shape` and `lines` as attributes (P10; D9) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| `shape` | `rect \| circle \| text` | `rect` for an image, a card or a block; `circle` for an avatar or an icon; `text` for lines of text in the surrounding font (F5) |
| `animation` | `pulse \| wave \| none` | `pulse` (default) fades in and out; `wave` sweeps a band across; `none` stays still, as in a dense layout (F2) |

- Both attributes are reflected closed enums that change only the defaults of the component's own tokens on `:host`, as ARCH §17.2 C6 requires (`docs/ARCHITECTURE.md:1577`; P3, P7; D6). Neither is a semantic variant in the sense of a role or a tone [INFERENCE: C6 does not define "semantic"; the rule is met either way].

---

## Part B — Technical Specification

### Anatomy

```
<line-skeleton>                         LineElement; :host display: block (D3)
└── #shadow-root
    └── <div part="root" aria-hidden="true">     flex column; gap --line-skeleton-gap (D5; F1)
        ├── <div part="item"></div>     one line or shape; `lines` of them (F5)
        └── <div part="item"></div>     the last of several takes --line-skeleton-last-line-size
```

- `root` is the ARCH §5 name for the main container and `item` for each item of a list (`docs/ARCHITECTURE.md:306`, `:317`; D5).
- `aria-hidden="true"` on `root` keeps any content a consumer adds through `::part(item)::before`, such as text, out of the tree [INFERENCE: `::part()::before` was not probed]; an empty `item` adds nothing either way (P1 B0, B2b; F1).
- `willUpdate` turns `lines` into the item count, so render holds no parsing (MANIFESTO Law 5, `docs/MANIFESTO.md:47`; D8).

```css
:host {
  --line-skeleton-bg: var(--line-gray-bg);
  --line-skeleton-wave-color: var(--line-gray-surface);
  --line-skeleton-radius: var(--line-radius-2);
  --line-skeleton-inline-size: 100%;
  --line-skeleton-block-size: var(--line-size-4);
  --line-skeleton-line-margin: 0px;
  --line-skeleton-gap: var(--line-size-2);
  --line-skeleton-last-line-size: 60%;
  --line-skeleton-keyframes: line-skeleton-pulse;
  --line-skeleton-wave-image: none;
  --line-skeleton-duration: var(--line-motion-7);
  --line-skeleton-easing: var(--line-easing-in-out);
  --line-skeleton-iteration-count: 2;

  display: block;
}

:host([hidden]) {
  display: none;
}

:host([shape='circle']) {
  --line-skeleton-radius: 50%;
  --line-skeleton-block-size: var(--line-size-8);
  --line-skeleton-inline-size: var(--line-skeleton-block-size);
}

:host([shape='text']) {
  --line-skeleton-radius: var(--line-radius-1);
  --line-skeleton-block-size: 1em;
  --line-skeleton-line-margin: calc((1lh - 1em) / 2);
  --line-skeleton-gap: 0px;
}

:host([animation='wave']) {
  --line-skeleton-keyframes: line-skeleton-wave;
  --line-skeleton-wave-image: linear-gradient(
    90deg,
    var(--line-skeleton-bg) 0%,
    var(--line-skeleton-wave-color) 50%,
    var(--line-skeleton-bg) 100%
  );
  --line-skeleton-easing: var(--line-easing-linear);
}

:host([animation='none']) {
  --line-skeleton-keyframes: none;
}

@media (prefers-reduced-motion: reduce) {
  :host,
  :host([animation]) {
    --line-skeleton-keyframes: none;
    --line-skeleton-wave-image: none;
  }
}

@media (forced-colors: active) {
  :host {
    --line-skeleton-bg: GrayText;
  }
}

[part='root'] {
  display: flex;
  flex-direction: column;
  gap: var(--line-skeleton-gap);
}

[part='item'] {
  inline-size: var(--line-skeleton-inline-size);
  block-size: var(--line-skeleton-block-size);
  margin-block: var(--line-skeleton-line-margin);
  border-radius: var(--line-skeleton-radius);
  background-color: var(--line-skeleton-bg);
  background-image: var(--line-skeleton-wave-image);
  background-size: 200% 100%;
  animation-name: var(--line-skeleton-keyframes);
  animation-duration: var(--line-skeleton-duration);
  animation-timing-function: var(--line-skeleton-easing);
  animation-iteration-count: var(--line-skeleton-iteration-count);
}

[part='item']:last-child:not(:first-child) {
  inline-size: var(--line-skeleton-last-line-size);
}

:host(:dir(rtl)) [part='item'] {
  animation-direction: reverse;
}

@keyframes line-skeleton-pulse {
  50% {
    opacity: 0.5;
  }
}

@keyframes line-skeleton-wave {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}
```

- The keyframes live in this stylesheet, because Chromium does not resolve a document keyframe from a shadow root (P3; F2 (a)).
- `animation` and `shape` change only token defaults; the keyframe name travels in `--line-skeleton-keyframes`, which resolves against these keyframes in all three engines (P3; D6).
- The reduced-motion block uses `:host([animation])` beside `:host` so it outranks `:host([animation='wave'])` by order at equal specificity, and it is not `!important`, so a consumer's token or `::part` rule can opt back in (P4; F3 (a)).
- `display` on `:host` beats the UA `[hidden]` rule, so `:host([hidden])` keeps `hidden` working, as on Badge and Kbd (`0007-badge.md` D3; `0015-kbd.md` D3).
- `commonReset` stays in `static styles`, because ARCH §14.7 maps Skeleton to `common` only (`docs/ARCHITECTURE.md:1163`; D4).
- The wave reverses under `:dir(rtl)` (P2 A5); the pulse is symmetric, so the reverse does not change it [INFERENCE].

### States

| Field | Value |
|-------|-------|
| Machine | `none` (Static tier; ARCH §8, `docs/ARCHITECTURE.md:410`; Phase 1 spec §6.C.4 C15 row) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| none | — | — | — |

- Skeleton reflects no flag. Loading is the app's state, carried by the region's `aria-busy` (F1).

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| none | — | — |

- Skeleton has no slot under F6 (a). The app replaces the host with the content.

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<div>` | the column of items; its `gap` spaces them (D5) |
| `item` | `<div>` | one line or shape: its size, radius, fill, wave band and motion |

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `shape` | `shape` | `'rect' \| 'circle' \| 'text'` | `'rect'` | yes | the shape of each item (F5) |
| `lines` | `lines` | `number` | `1` | no | how many items to draw, the last of several shorter (F5) |
| `animation` | `animation` | `'pulse' \| 'wave' \| 'none'` | `'pulse'` | yes | the motion (F2) |

- `shape` and `animation` reflect as Badge's `variant` and Kbd's `platform` do. A value the author or code sets is written to the attribute, the default leaves no attribute, and an unknown value behaves as the default while the attribute keeps it (Lit `useDefault: true`; `0007-badge.md` D6; `0015-kbd.md` AM-004). The stylesheet styles each default without its attribute, because the surface removes the attributes of props a node does not set (P10; D8).
- `lines` takes an integer from 1 to 20. A value that is not a finite integer, or is below 1, draws one item; a value above 20 draws 20; nothing throws (MANIFESTO Law 9; P9; D8).
- The host takes the global `hidden` attribute, which hides it (D3).
- The docs advise against `aria-label` on the host (D2).

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

Skeleton holds no value and no interactive element, so it fires nothing and is neither value-bearing nor compound (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`).

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-skeleton-bg` | `var(--line-gray-bg)`; `GrayText` under `forced-colors: active` | `item` fill and the ends of the wave band |
| `--line-skeleton-wave-color` | `var(--line-gray-surface)` | the middle of the wave band |
| `--line-skeleton-radius` | `var(--line-radius-2)`; `50%` for `circle`; `var(--line-radius-1)` for `text` | `item` |
| `--line-skeleton-inline-size` | `100%`; `var(--line-skeleton-block-size)` for `circle` | `item` |
| `--line-skeleton-block-size` | `var(--line-size-4)`; `var(--line-size-8)` for `circle`; `1em` for `text` | `item` |
| `--line-skeleton-line-margin` | `0px`; `calc((1lh - 1em) / 2)` for `text` | `item` (`margin-block`) |
| `--line-skeleton-gap` | `var(--line-size-2)`; `0px` for `text` | `root` |
| `--line-skeleton-last-line-size` | `60%` | the last `item` of several |
| `--line-skeleton-keyframes` | `line-skeleton-pulse`; `line-skeleton-wave` for `wave`; `none` for `none` and under `prefers-reduced-motion: reduce` | `item` (`animation-name`) |
| `--line-skeleton-wave-image` | `none`; the band gradient for `wave`; `none` under reduced motion | `item` (`background-image`) |
| `--line-skeleton-duration` | `var(--line-motion-7)` | `item` |
| `--line-skeleton-easing` | `var(--line-easing-in-out)`; `var(--line-easing-linear)` for `wave` | `item` |
| `--line-skeleton-iteration-count` | `2` | `item` (F4) |

- The defaults are D6. `--line-gray-bg` is Radix step 3 and `--line-gray-surface` step 2 (`packages/line-themes/src/aliases.css:20-21`). `--line-radius-1` is `2px` and `--line-radius-2` `5px` (`packages/line-tokens/src/radii.css:9-10`), `--line-size-2` `0.5rem`, `--line-size-4` `1.25rem` and `--line-size-8` `3rem` (`sizing.css:11`, `:13`, `:17`), `--line-motion-7` `2s` (`motion.css:18`), and `--line-easing-in-out` and `--line-easing-linear` the curves at `easings.css:30` and `:35`.
- Without `line-tokens`, `--line-size-4` and `--line-motion-7` are invalid at computed-value time, so a `rect` item is 0 px tall and runs no visible motion (P4). This matches the other components, whose token defaults carry no fallback (`0015-kbd.md` CSS custom properties) [INFERENCE: with longhands, `animation-duration` falls back to `0s` rather than the whole shorthand to `none`; not probed].
- A consumer sizes a placeholder through the size tokens or `::part(item)` (F8).
- The wave band under forced colors was not probed [INFERENCE].

#### Consumer styling

```css
/* A 40% wide title bar */
line-skeleton.title {
  --line-skeleton-inline-size: 40%;
  --line-skeleton-block-size: var(--line-size-6);
}

/* A larger avatar circle */
line-skeleton.avatar {
  --line-skeleton-block-size: var(--line-size-9);
}

/* Keep the pulse running past two cycles; the app then owns WCAG 2.2.2 (F4) */
line-skeleton.long {
  --line-skeleton-iteration-count: infinite;
}

/* A custom motion: keyframes from the page, named in a ::part rule (P2 A7) */
@keyframes page-shimmer {
  50% { filter: brightness(1.1); }
}
line-skeleton.custom::part(item) {
  animation: page-shimmer 1.5s ease-in-out 2;
}
```

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

Skeleton takes no focus and handles no key (R8 `:78`, Keyboard "None"). The Browser tier proves that Tab skips the host (Phase 1 spec §10 SD99, `:2446`).

### A11y

| Field | Value |
|-------|-------|
| Role | none; no internals role and no `role` attribute (R8 `:78`; D2). The host and its empty items add no node to the Chromium tree (P1 B0) |
| ARIA attributes | none on the host. `aria-hidden="true"` on `root` in the shadow tree (F1 (a)) |
| Accessible name | none |
| Focus | the host is not focusable and does not delegate focus (D7) |

- **Busy region (F1 (a)).** The app puts `aria-busy="true"` on the region that is loading, such as the card or the list, while the placeholders show, and removes it when the content arrives. Chromium exposes it as `busy=1` on that region (P1 B1). ARIA lets assistive technology ignore changes in a busy region until it is no longer busy (R8 `:78`). The surface does the same for each transport batch (Phase 1 spec §6.G.4, `:1475`). Skeleton writes `aria-busy` nowhere, because `internals.ariaBusy` does not reach the Chromium tree (P1 B5) and an attribute on the host would sprout an author-owned attribute on a `generic` (P1 B5b).
- **Announcing the load.** Skeleton announces nothing. An app that must say "Loading" uses a live region or `<line-spinner>` with the consumer's label (MANIFESTO Out of Scope, `docs/MANIFESTO.md:66`; R8 `:286-287`).
- **Motion.** The motion stops after two cycles, 4 s with the default tokens, and does not run under `prefers-reduced-motion: reduce` (P4; F3, F4).
- **Forced colors.** The fill becomes `GrayText`, a system colour that forced colors keep, where the token colour would turn into Canvas (P4).
- **Non-text contrast.** A placeholder conveys no information a user must perceive to use the page, so WCAG 1.4.11 does not apply to its fill [INFERENCE].
- **Proof (D16).** No role, name or ARIA value lives in internals, so the Phase 1 spec CDP-and-read-back rule for internals roles does not apply (`:1180`). The Browser tier proves the empty tree with `ariaSnapshot()` in three engines and a Chromium CDP assertion.
- **Firefox and WebKit.** No check reads their accessibility trees, and no screen reader was run. The gap is recorded here (Phase 1 spec `:1180`; §12 AM-058).

**What axe proves here.** axe 4.14.0 reported no violation for a skeleton alone, in a busy region or a busy `div`, or with a host `aria-label` (P1). It reports a button that holds only a skeleton (`button-name`, P1 B9), which is the anti-pattern above, and it does not report a host `aria-label` (P1 B11), so the docs carry that advice.

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `shape` and `animation` are string enums and `lines` a number |
| C2 | Slots carry `@slot` and a single or multiple classification | no slot (F6 (a)) |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | fires no event, so no `@fires`; not value-bearing |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated (Phase 1 spec §6.C.4 C15 row) |
| C5 | The host accepts an accessible name and applies it to the element with the role | no element carries a role, and the placeholder is hidden from assistive technology (F1). The docs advise against a host `aria-label`, which would name a `generic` (R8 `:55`; P1 B11; D2) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | `shape` and `animation` are reflected closed enums that change only token defaults on `:host` (Variants; P3, P7) |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries `@summary`, two `@csspart` and thirteen `@cssprop`; no `@slot`, no `@fires`; nothing is deprecated (D19) |
| C8 | Missing or partial props degrade to an empty or neutral state | a node with no props draws one `rect` item that pulses twice (P10); an unknown `shape` or `animation` behaves as the default; an invalid `lines` draws one item (D8) |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

- The descriptor's prop schema leaves out `animation`. Motion is styling, and the surface ignores agent theme hints by default, so the host app keeps every styling decision (ARCH §17.4 Theme row, `docs/ARCHITECTURE.md:1639`; MANIFESTO Principle 8, `docs/MANIFESTO.md:33`; F7 (a)).

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `Skeleton` (D9) |
| Tag | `line-skeleton` |
| `load()` subpath | `@websublime/line-components/skeleton` |
| Prop schema | `shape` (`z.enum(['rect', 'circle', 'text'])`, optional, plain `.describe()` with "`rect` (default) for a block, `circle` for an avatar or an icon, `text` for lines of text in the surrounding font."), `lines` (`DynamicNumber`, optional, through `commonProp` with the description "How many lines or blocks to draw, from 1 to 20; the last of several is shorter."), plus `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1, `:1323`, `:1326`; §12 AM-066, AM-067) |
| Slot map | none |
| Binding map | `shape` → attribute `shape`; `lines` → attribute `lines`; no value prop and no commit event (C9) |
| Action map | none |
| Accessibility requirements | no `requiredName`; `hostNaming: { kind: 'never' }`, because the host has no role a name could attach to (`packages/line-genui/src/catalog/descriptor.ts:160-174`; P1 B11; P10). The Phase 1 spec names the components that take no host name in four places, and Skeleton is in none of them, so this choice needs a Phase 1 spec AM, as AM-098 did for Kbd (Spec drift found, item 2) |
| Agent-facing description | A placeholder that stands in for content that is still loading, so the layout keeps its shape until the content arrives. `shape` is `rect` (default) for a block such as an image or a card, `circle` for an avatar or an icon, or `text` for lines of text sized to the surrounding font. `lines` sets how many lines or blocks to draw, one by default, with the last one shorter when there are several. The placeholder only shows that something is loading: it is not interactive, assistive technology skips it, and it takes no label. Replace it with the content once the content arrives. |
| Tool description | none; the agent-facing description names `shape` and `lines` only, which the tool carries, and no `accessibility` member (Phase 1 spec §6.G.3, `:1423`, `:1435`) |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C15 row, `:1171`; Skeleton is none of the three SD38 exceptions, `:2385`; D10) |

- The agent-facing description is 580 characters, under the 1024 cap (Phase 1 spec `:1422`). P10 emitted a wider 482-character stub through all three providers.
- The frontend tool carries `shape` and `lines`, with no `accessibilityLabel` or `accessibilityDescription`, because `hostNaming` is `never` (`packages/line-genui/src/catalog/tools.ts`; P10).
- The surface writes `shape` and `lines` as attributes, and a bound `lines` updates the same element (P10). A node with no props draws one `rect` item and raises nothing (P10; C8).
- An agent places a Skeleton node where content will be, then replaces it with the content node through a later `updateComponents`. The surface marks the whole surface busy for each batch (Phase 1 spec `:1475`), so an agent placeholder needs no `aria-busy` of its own [INFERENCE: whether an agent-rendered region stays busy between batches was not probed].
- Skeleton joins the `line` catalog only. No A2UI v0.9 basic type is a placeholder (ARCH §17.3, `docs/ARCHITECTURE.md:1608-1626`), and the `basic` map keeps its 10 types (Phase 1 spec §6.G.2, `:1389`).
- C15 ships its descriptor in the same PR and adds Skeleton to the `<line-a2ui-surface>` render fixture and the surface axe test (Phase 1 spec §6.C.0, `:927`; §6.C.6, `:1231`; D11).
- These tests in `packages/line-genui/__tests__` change with a fifteenth descriptor (D11).
  - `PROP_TYPES` gains `Skeleton: { shape: 'enum', lines: 'DynamicNumber' }` (`catalog.test.ts:46-95`), and its doc comment adds `0016-skeleton.md` (`:40-45`).
  - The raw catalog of every descriptor gains `Skeleton` between `Separator` and `Stack`, and the test title at `:114` says fifteen descriptors.
  - The exposure test expects `toHaveLength(15)` (`:503`, was 14) and the import test `descriptors: 15` (`:550`).
  - `LINE_COMPONENTS` gains `Skeleton` between `Separator` and `Stack` (`catalog-emitters.test.ts:65-78`).
  - The tool-name list gains `'Skeleton'` between `'Separator'` and `'Stack'` (`frontend-tools.test.ts:105-118`); the flat-model test gains `expect(names('Skeleton')).toEqual(['shape', 'lines'])` (`:190-192`); the accessibility test adds `Skeleton` to its title and to the tools that carry neither parameter (`:251`, `:270`).
  - `cem-coverage.test.ts:32-37` and `cem-drift.test.ts:76-79` use `line-skeleton` as the made-up tag that a manifest or a descriptor lacks, so both would fail once Skeleton ships. Both switch to the unshipped `line-spinner`, class `LineSpinner`, path `src/spinner/spinner.ts`, catalog name `Spinner` (row 01-C20, `todo`), as row 01-C14 switched its made-up tag (`0015-kbd.md:606`).
  - `a2ui-surface.test.ts` gains a Skeleton block beside the Kbd one (`:245-316`).
- These files outside `line-genui` change.
  - `lineShowcase` in `apps/storybook/stories/agent-ui/a2ui-fixtures.ts` gains the node `{ id: 'pending', component: 'Skeleton', shape: 'text', lines: 2 }` at the end of the root's children (`:68`), and its JSDoc names Skeleton (`:57-63`).
  - `'agent-ui-a2ui-surface--line-catalog'` in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` counts 35 elements (`:32`, was 34), the settle selector adds `line-skeleton` (`:61`), and the file JSDoc names C15 (`:1-19`).

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/skeleton` |
| Kind | `independent` (Phase 1 spec §4.2, `:303`; §10 SD12) |
| Registers | `line-skeleton` |
| Reset modules | `commonReset` only (ARCH §14.7, `docs/ARCHITECTURE.md:1163`; D4) |

- The files are `src/skeleton/skeleton.ts`, with the class `LineSkeleton` and `customElements.define`, `src/skeleton/skeleton.types.ts` with `SkeletonShape` and `SkeletonAnimation`, and `src/skeleton/index.ts`, which exports `LineSkeleton` and both types, as `src/kbd/index.ts` does; the root `src/index.ts` is unchanged.
- `package.json` gains the `./skeleton` export after `./kbd` (Phase 1 spec §4.2, `:254`; `packages/line-components/package.json:78-81`), and the Vite build gains the `skeleton/index` entry after `kbd/index` (`packages/line-components/vite.config.mjs:24`). No new dependency (D15).
- `packages/line-components/__tests__/bundle-splitting.test.ts` gains the `EXPECTED_TAGS` row `'./skeleton': ['line-skeleton']` after `./kbd` (`:71`). It needs no `ALLOWED_TAG_REFERENCES` row, because the component matches no other tag.
- `line-genui` gains `src/catalog/descriptors/skeleton.ts` with `skeletonDescriptor`. `src/catalog/index.ts` imports it after `separatorDescriptor` (`:26`), adds it to the named exports after `separatorDescriptor` (`:115`), and adds it to the `descriptors` array in catalog-name order, between `separatorDescriptor` and `stackDescriptor` (`:134-135`).
- Skeleton imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`).

### Markup examples

```html
<!-- A profile card while its data loads; the card is the busy region (F1) -->
<article aria-busy="true" aria-label="Profile">
  <line-stack orientation="horizontal" gap="3">
    <line-skeleton shape="circle"></line-skeleton>
    <line-skeleton shape="text" lines="2"></line-skeleton>
  </line-stack>
  <line-skeleton lines="3"></line-skeleton>
</article>

<!-- Lines of a paragraph, sized to the paragraph's font -->
<p><line-skeleton shape="text" lines="4"></line-skeleton></p>

<!-- A sweeping band, and a still placeholder in a dense table -->
<line-skeleton animation="wave"></line-skeleton>
<line-skeleton animation="none"></line-skeleton>

<!-- htmx: the placeholder loads its own replacement (P8) -->
<div aria-busy="true" id="feed">
  <line-skeleton shape="text" lines="3"
                 hx-get="/feed" hx-trigger="load" hx-target="#feed"></line-skeleton>
</div>
```

The server's response for `#feed` replaces the placeholder; the app removes `aria-busy` from `#feed` on swap, for example in an `htmx:afterSwap` listener [INFERENCE: not probed].

```css
/* Reserve the space before the module runs (P6; D19) */
line-skeleton:not(:defined) {
  display: block;
  block-size: var(--line-size-4);
}
```

A `line` catalog node the surface renders as the paragraph example:

```json
{ "id": "bio", "component": "Skeleton", "shape": "text", "lines": 4 }
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom, `packages/line-components/__tests__/skeleton.test.ts` | registers `line-skeleton` with its class; one `item` by default; `lines` from 1 to 20 draws that many, and `0`, `-2`, `2.5`, `NaN`, `"x"` and a non-number property draw one, `21` draws 20 (P9; D8); `shape` and `animation` reflect a set value, leave no attribute at their defaults, and keep an unknown value in the attribute while behaving as the default; `aria-hidden="true"` on `root`; no attribute and no internals value on the host; `hidden` hides the host; no event fires; the parts `root` and `item` exist |
| Browser | Playwright `packages/line-components/__tests__/integration/skeleton/skeleton.e2e.ts` on chromium, firefox and webkit, over fixture pages under `integration/skeleton/` | an empty tree: `ariaSnapshot()` empty for a skeleton alone and in a busy `<section>`, and a Chromium CDP assertion of no node under the host and `busy` on the region (P1; D16); Tab skips the host (§10 SD99); `getAnimations()` names `line-skeleton-pulse` by default, `line-skeleton-wave` for `wave` and nothing for `none`, with `iterations` 2 and `endTime` 4000 ms, and reverses under `dir="rtl"` (P2, P4); `emulateMedia({ reducedMotion: 'reduce' })` leaves no animation and no wave band, and a consumer token restores the motion (P4; F3); token overrides apply on a page with `line-tokens` and `line-themes`; `text` lines match the line boxes of real text within 0.1 px in a 16 px and a 2rem font (P7); `circle` is square; Chromium forced colors give a `GrayText` fill (P4); the defaults apply with no `shape` or `animation` attribute (P10) |
| A11y | axe-core, `packages/line-components/__tests__/a11y/skeleton.e2e.ts` | zero violations (MANIFESTO Law 3) in every story of D13 (Phase 1 spec §7.4) |
| htmx | Playwright `*.e2e.ts` through the shared harness `@websublime/line-testing/htmx` (`packages/line-testing/src/htmx.ts`), on htmx 2 and htmx 4 in chromium, firefox and webkit | `n/a`. Skeleton is neither value-bearing, because its descriptor binding map names no value prop, nor compound, because it holds no interactive element (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`; plan §2.4, `docs/plans/01-plan-core-primitives.md:172-175`), and it has no slot, so behaviour (d) has nothing to swap into (F6 (a)). P8 replaced placeholders by `innerHTML` and `outerHTML` swaps, and all passed on htmx 2 and 4 in three engines. This confirms the Phase 1 spec's "`n/a` expected" (§6.C.4 C15 row, `:1171`; §10 SD34, `:2381`; D12) |
| Visual | Playwright `packages/line-components/__tests__/visual/skeleton.visual.ts` on the `visual` project | every story of D13 with Linux baselines from a `visual-baselines.yml` run (Phase 1 spec §6.C.6, `:1233`; §10 SD98). `toHaveScreenshot` disables animations by default, fast-forwarding finite ones to their end, so the two-cycle motion settles to its resting style (`node_modules/playwright/types/test.d.ts:9975-9981`; D14) |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts`; Playwright axe in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` | a `line` catalog `Skeleton` node renders `<line-skeleton>` with `shape` and `lines` as attributes; a bound `lines` updates the same element; a node with no props renders one `rect` item and raises nothing; an `accessibility.label` sets no `aria-label` (P10); the node joins the surface render fixture (`apps/storybook/stories/agent-ui/a2ui-fixtures.ts`) and the surface axe test (Phase 1 spec §6.C.6, `:1231`) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the CEM coverage and drift tests pass with the new descriptor, the drift test checking the `shape` and `lines` attributes (Phase 1 spec §6.G.5); `catalog.json` holds `Skeleton` and its inline projection validates (§6.G.2; P10); the `Skeleton` tool takes the agent-facing description, stays at or under 1024 characters, passes the backtick guard and carries `shape` and `lines` only (§6.G.3, `:1422-1423`, `:1434-1435`); the coverage and drift tests use `line-spinner` as their made-up tag; the lists and counts change as the Agent contract says (D11) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./skeleton` register `line-skeleton` only, and the isolation scan finds no other component's module or tag in its bundle (Phase 1 spec §7.5) |

- PRD §5.2 checklist mapping (`docs/PRD.md:534-543`; Phase 1 spec §6.C.6, `:1222`). Render, reactive props, parts and events (none fired) run in the Unit tier; slots do not apply (none); custom properties run in the Browser tier, on a page with `line-tokens` and `line-themes`; keyboard (Tab skips the host) runs in the Browser tier (§10 SD99) and axe in the A11y tier.
- §6.C.6 obligations. Storybook docs, the changeset, the CEM JSDoc, the `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` row and the size report land as D15 says. No other component is imported (Bundle). The Agent contract is filled above. The htmx row is `n/a` with its reason. The surface fixture and surface axe rows are above (`:1231`). No update-rate measurement, because Skeleton is not a machine row (`:1232`). The visual tier is the row above (`:1233`).
- The axe and visual tests run against the Storybook stories on port 4320, with the story list and `readySkeletonStory(page, id)` in `packages/line-components/__tests__/skeleton-stories.ts`, as `kbd-stories.ts` does for Kbd. The tree, motion and layout tests use the fixture pages under `packages/line-components/__tests__/integration/skeleton/`, served by the existing port-4321 `webServer` (`playwright.config.ts:23-28`).

### Spec drift found

| # | Where | Finding | Kind |
|---|---|---|---|
| 1 | R8 `docs/research/01-research-accessibility.md:241` | R8 lists Skeleton (`aria-busy`) among the components that could set default ARIA through `ElementInternals`. P1 B5 shows that `internals.ariaBusy` on the host reaches no node of the Chromium tree, while an `aria-busy` attribute on a host or a container does (B1, B1b, B5b). R8's own Skeleton row already puts `aria-busy` on the loading container (`:78`), which F1 (a) follows | factual; R8 is research and sits outside the PROCESS §1 hierarchy, so no edit is proposed |
| 2 | Phase 1 spec §6.G.3 (`:1405`, `:1434`), §6.G.4 (`:1516`), §10 SD47 (`:2394`) | these four places name the components whose surface node takes no host name and whose tool carries no accessibility parameters: Alert, Icon, Kbd and Stack. D9's `hostNaming: never` adds Skeleton, which needs a Phase 1 spec AM row, as AM-098 did for Kbd (`:2559`) | changes a design choice in an approved document: a ratchet trigger for Miguel's decision, not a factual correction |
| 3 | PRD §4.1 `docs/PRD.md:261` | "with pulse or wave animation" holds under F2 (a), whose `none` is an addition. F2 (c), pulse only, would need a PRD revision; F4 (b) stops the animation after two cycles, which the row's wording does not exclude [INFERENCE: the PRD row names the effects, not their duration] | no drift under the recommended options |
| 4 | the dispatch for this row | it cites ARCH "§13 (component tiers, `:410`)". The tier table is ARCH §8 (`docs/ARCHITECTURE.md:402`, `:410`); §13 is "Detailed Component Decisions" (`:590`) and has no Skeleton entry | factual; not a document, so nothing to amend |
| 5 | PRD §3 and §9 (`docs/PRD.md:207`, `:1520`), `packages/line-tokens/src/animations.css:86-99` | `line-tokens` ships keyframes and `--line-animation-*` tokens, and no document says a component consumes them from its shadow root. P3 shows that a component cannot in Chromium. C20 Spinner, "CSS-only" (ARCH §13.5, `docs/ARCHITECTURE.md:622-625`; PRD `:267`), meets the same limit with `--line-animation-spin` | not drift; recorded for C20 |
| 6 | `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 | it has no Skeleton row yet; the C15 PR adds one (Phase 1 spec §6.C.6; D15) | an obligation, not drift |

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| F1 | What busy semantics does Skeleton carry, and who marks the loading region? | Miguel | open; recommended (a), the placeholder is hidden from assistive technology and the app's container carries `aria-busy` |
| F2 | Which animations exist, which is the default, and where do their keyframes live? | Miguel | open; recommended (a), `pulse \| wave \| none`, default `pulse`, keyframes in the component's own stylesheet |
| F3 | What happens under `prefers-reduced-motion: reduce`? | Miguel | open; recommended (a), no motion and no wave band, at normal importance so a consumer can opt back in |
| F4 | How does the default motion meet WCAG 2.2.2 when loading lasts more than five seconds? | Miguel | open; recommended (b), two cycles through `--line-skeleton-iteration-count: 2`, then rest |
| F5 | Which shapes exist, and how does Skeleton draw multi-line text? | Miguel | open; recommended (a), `shape="rect \| circle \| text"` and `lines` |
| F6 | Is Skeleton a placeholder only, or also a wrapper whose `loading` hides slotted content? | Miguel | open; recommended (a), placeholder only |
| F7 | Which props does the descriptor expose to agents? | Miguel | open; recommended (a), `shape` and `lines` |
| F8 | How does a consumer size a placeholder? | Miguel | open; recommended (a), size tokens and `::part(item)` only |

**Orchestrator defaults** (drafted 2026-11-13; for Miguel's review)

| # | Default | Basis |
|---|---------|-------|
| D1 | Static, with no machine and no events; neither value-bearing nor form-associated | ARCH §8, `:410`; Phase 1 spec §6.C.4 C15 row, `:1171` |
| D2 | No role, no internals value and no ARIA attribute on the host; the docs advise against a host `aria-label` and against a skeleton alone inside a button or a link | R8 `:55`, `:78`; probes P1 B5 (internals `aria-busy` not exposed), B9 (`button-name`), B11 (named `generic`, axe silent) |
| D3 | `:host { display: block }` and `:host([hidden]) { display: none }` | Badge D3 (`0007-badge.md`); `0015-kbd.md` D3; a placeholder fills the inline size of its container, as P7 measured |
| D4 | `commonReset` is the only reset module | ARCH §14.7, `:1163` |
| D5 | Parts `root` (a flex column with `gap: var(--line-skeleton-gap)`) and `item`, one per line; no part per shape | ARCH §5 `root`, `item` (`docs/ARCHITECTURE.md:306`, `:317`); MANIFESTO Law 1 (every drawn zone is a part); probe P7 |
| D6 | The thirteen `--line-skeleton-*` tokens and their defaults; `shape` and `animation` change only those defaults; the keyframe name travels in `--line-skeleton-keyframes` | ARCH §17.2 C6; probes P3 (token keyframe names work in three engines, a consumer token wins), P7; Kbd's token pattern (`0015-kbd.md` D6) |
| D7 | No focus on the host, no key handling, no `delegatesFocus`, no `tabindex` | R8 `:78` Keyboard "None" |
| D8 | `willUpdate` turns `lines` into an item count from 1 to 20: a value that is not a finite integer or is below 1 gives 1, a value above 20 gives 20; an unknown `shape` or `animation` behaves as the default; the stylesheet styles each default without its attribute; nothing throws | ARCH §17.2 C8; MANIFESTO Laws 5 and 9; probe P10 (the surface removes the attributes of unset props, so reflected defaults vanish). The cap of 20 bounds a hostile agent's `lines` [INFERENCE: no source sets a maximum] |
| D9 | Catalog name `Skeleton`; prop schema `shape` (enum) and `lines` (`DynamicNumber`), each bound to its attribute; no slot map; `hostNaming: never`; no `requiredName`; no tool description; `animation` stays out of the schema | PRD row name; Phase 1 spec §6.G.1 (`:1326`, enums take plain `.describe()`, numbers `DynamicNumber`); ARCH §17.4 Theme row (`:1639`); probe P10. `hostNaming: never` needs a Phase 1 spec AM (Spec drift found, item 2) |
| D10 | `agentExposed: true` | Phase 1 spec §6.C.4 C15 row, `:1171`; SD38 names three other components (`:2385`); a placeholder adds no text and paints within the surface, so neither SD38 reason applies (`:1336`, `:1338`) |
| D11 | The genui tests and the surface fixture change as the Agent contract lists, with `line-spinner` as the new made-up tag | Phase 1 spec §6.C.6, `:1231`; the locators in the Agent contract; `0015-kbd.md` D12 for the same switch |
| D12 | htmx row `n/a` | Phase 1 spec §10 SD34; ARCH §17.2 C9; probe P8 |
| D13 | `apps/storybook/stories/components/skeleton.stories.ts` with `title: 'Components/Primitives Base/Skeleton'`, the pinned meta `id: 'components-skeleton'`, `tags: ['autodocs']`, and a `DESCRIPTION` that carries the busy-region advice, the reduced-motion and two-cycle behaviour, the `:not(:defined)` rule and the advice against `aria-label`. Stories: Default; Shapes (`rect`, `circle`, `text`); Text lines (`shape="text" lines="3"` beside a real paragraph); Wave; No animation; Profile card (a busy `<article>` with a circle, two text lines and a block); Custom tokens (the Consumer styling rules) | the story-title rule of the template (`COMPONENT-SPEC-TEMPLATE.md:213`); PRD §4.1 places Skeleton under Primitives Base (`docs/PRD.md:243`, `:261`); `kbd.stories.ts:39` |
| D14 | The visual tier relies on `toHaveScreenshot`'s default `animations: "disabled"` and adds no motion option | `node_modules/playwright/types/test.d.ts:9975-9981`; `packages/line-components/__tests__/visual/story.ts:42` |
| D15 | The C15 PR also adds a Skeleton row to `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 from the F2, F5 and F6 evidence, writes the Storybook docs, adds a `## Skeleton` section to `packages/line-components/README.md` after `## Kbd` (`:495`), adds `skeletonDescriptor` to the export table of `packages/line-genui/README.md:39` and Skeleton to the tools that take their agent-facing descriptions (`:92`) and to those that take neither accessibility parameter (`:125`, `:144`), reports the gzipped size against the < 5 KB soft target, and adds one changeset with `@websublime/line-components` at `patch` and `@websublime/line-genui` at `minor`; no new dependency | Phase 1 spec §6.C.6, `:1223-1227`; §7.6; `0015-kbd.md` D15 |
| D16 | The Browser tier proves the empty tree with `ariaSnapshot()` in three engines and a Chromium CDP assertion, and runs no `INTERNALS` read-back | Phase 1 spec `:1180` applies to internals roles, and Skeleton sets none (D2); probe P1 |
| D17 | The wave runs from inline-start to inline-end and reverses under `:host(:dir(rtl))` | probe P2 A5 |
| D18 | The keyframe names `line-skeleton-pulse` and `line-skeleton-wave` are internal; the docs show custom motion through page keyframes in a `::part(item)` rule | probe P2 A7 (works in three engines), A8 (a `::part` rule naming the component's keyframe resolves differently in Firefox) |
| D19 | The class JSDoc says what the component is for, to put `aria-busy` on the loading region, that it takes no label, how the motion stops (two cycles, reduced motion), the `:not(:defined)` rule, and not to put `aria-label` on the host or a lone skeleton in a control; `@cssprop` for each token with its default; `@csspart` for `root` and `item` | Kbd's and Badge's JSDoc patterns (`0015-kbd.md` D19; `0007-badge.md` D14); ARCH §17.2 C7; probe P6 |
| D20 | Under `forced-colors: active` the fill is `GrayText` | probe P4 (the token colour computes to Canvas; `GrayText` survives); Web Awesome's skeleton does the same (`@awesome.me/webawesome` 3.14.0 `dist/chunks/chunk.JLCUD5BZ.js`) |
| D21 | `--line-skeleton-wave-color` defaults to `--line-gray-surface`, one Radix step from the fill | `packages/line-themes/src/aliases.css:20-21`; the probe drew the band in a stand-in colour, so the pairing is a visual judgment for review [INFERENCE] |

### F1 — Busy semantics

**Evidence.** R8 gives Skeleton "No role for placeholders; the region being loaded can carry `aria-busy="true"`" and puts `aria-busy` "on the loading container" (`docs/research/01-research-accessibility.md:78`). In probe P1, an empty placeholder adds nothing to the Chromium tree or to the snapshot in three engines (B0); `aria-busy` as an attribute shows as `busy=1` on a region, a `generic` and a host (B1, B1b, B5b), and `internals.ariaBusy` on the host shows nowhere (B5). `internals.ariaHidden` hides text in Chromium but not in Playwright's snapshot (B3), so it needs the internals proof of Phase 1 spec `:1180`. A host `aria-label` names a `generic` (B11), which ARIA prohibits (R8 `:55`), and axe does not report it. A status with an internals name exposes `status "Loading"` (B6), which needs a consumer string (MANIFESTO `:66`). The surface sets `aria-busy` on itself per batch (Phase 1 spec `:1475`). Web Awesome's `wa-skeleton` writes no ARIA (`dist/chunks/chunk.XQCWQFLH.js`); Radix Themes' `Skeleton` sets `aria-hidden` on its wrapper (`dist/esm/components/skeleton.js`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Hidden placeholder, busy container | the shadow `root` carries `aria-hidden="true"`; the host writes nothing; the docs tell the app to put `aria-busy="true"` on the loading region and remove it on arrival | Nothing to announce and nothing to name (P1 B0, B2b). Busy reaches the tree on the app's region (B1). The app must remember `aria-busy`; nothing checks it |
| (b) Host `aria-busy` through internals | `internals.ariaBusy = "true"` on the host | No effect in the Chromium tree (P1 B5). Busy on a placeholder says nothing about the content around it |
| (c) Host `aria-busy` as an attribute | the component sets `aria-busy="true"` on itself | Shows on the host (B5b), but sprouts an author-owned attribute, and the host holds no content to be busy (R8 `:78` puts it on the container) |
| (d) Status with a label | internals `role="status"` and a consumer `label` such as "Loading" | Announced as a polite live region (B6). One per placeholder means many statuses on a page; the label is a consumer string (MANIFESTO `:66`); it overlaps C20 Spinner |
| (e) Host hidden through internals | `internals.ariaHidden = "true"` | Hidden in Chromium (B3), but only a CDP assertion and an internals read-back prove it, and an empty placeholder needs no hiding (B0) |

### F2 — Animation set and keyframes

**Evidence.** PRD §4.1 asks for "pulse or wave animation" (`docs/PRD.md:261`). `line-tokens` has `@keyframes line-pulse` and `--line-animation-pulse` and no wave or shimmer keyframe (`packages/line-tokens/src/animations.css:71-75`, `:98`). In probe P3, Chromium never resolves a document keyframe from a rule in a shadow root, Firefox only for an element with a `part` attribute, and WebKit always; so `--line-animation-pulse` does not animate the component in Chromium. In probe P2, the component's own keyframes run in three engines and are not replaced by same-named page keyframes. Web Awesome 3.14.0 `wa-skeleton` has `effect="none | sheen | pulse"`, default `none`, its own `sheen` (8 s) and `pulse` (2 s) keyframes, one part `indicator` and the tokens `--color` and `--sheen-color` (`dist/components/skeleton/skeleton.d.ts`; `dist/chunks/chunk.JLCUD5BZ.js`). Radix Themes 3.3.0 pulses only, between `--gray-a3` and `--gray-a4` (`src/components/skeleton.css`). Spectrum 1.12.6, Lion 0.27.0, Fluent UI Web Components 3.2.1, Bits UI 2.21.0, Ark UI 5.40.0 and Radix Primitives ship no skeleton (`npm pack` file lists; `npm view @spectrum-web-components/skeleton` and `@radix-ui/react-skeleton` return 404).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `pulse \| wave \| none`, default `pulse`, own keyframes | both keyframes in the component's stylesheet; durations and easing from `line-tokens` motion and easing tokens through component tokens | Works in three engines (P2). Touches no other package. The pulse duplicates `line-pulse`'s 50 % opacity step in its own name |
| (b) As (a), with the keyframes in `line-tokens` | `line-tokens` gains `@keyframes line-wave` and `--line-animation-wave`; the component reads `--line-animation-pulse` and `--line-animation-wave` | **Ratchet trigger: a second package, `line-tokens`, with its own changeset and the Phase 00 token families.** It also fails: Chromium does not resolve those keyframes from the shadow root (P3), so the component would still need its own. The tokens would help only light-DOM and `::part` users (P2 A7) |
| (c) `pulse \| none` | no wave | One keyframe less. The PRD row names wave, so this needs a PRD revision |
| (d) As (a), default `none` | motion is opt-in, as Web Awesome's default `effect` | No motion unless asked, so WCAG 2.2.2 and reduced motion matter only on opt-in. The PRD describes an animated indicator, and a still default reads as decoration [INFERENCE] |

### F3 — Reduced motion

**Evidence.** In probe P4, a shadow rule at normal importance under `prefers-reduced-motion: reduce` stops the motion, and a consumer's `::part(item)` rule still wins; an `!important` shadow rule beats the consumer's rule. `matchMedia` and `emulateMedia` agree in three engines. AvatarGroup sets its transition token to `0s` under the same query in `:host` (`packages/line-components/src/avatar-group/avatar-group.ts:123-127`; `0010-avatar-group.md:412`, D4). WCAG 2.3.3 (AAA) asks that interaction-triggered motion can be disabled (`w3.org/TR/WCAG21/#animation-from-interactions`). Web Awesome's skeleton styles have no reduced-motion rule (`chunk.JLCUD5BZ.js`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Stop, normal importance | `:host, :host([animation]) { --line-skeleton-keyframes: none; --line-skeleton-wave-image: none }` under the query | Still placeholders for users who asked (P4). A consumer can opt back in through the token or `::part`, and then owns the choice. Follows AvatarGroup's token pattern |
| (b) Stop, `!important` | the same with `!important` on `item` | The consumer cannot override it (P4). Removes a choice an app may need, such as its own reduced-motion setting |
| (c) Soften | under the query, `wave` becomes `pulse` and the pulse slows | Some feedback remains. An opacity pulse is still a change the user asked to avoid [INFERENCE: whether opacity change counts as motion is not settled by WCAG] |
| (d) Nothing | the app handles the query | No component rule. Every app repeats the rule, and MANIFESTO Law 3 rests on each consumer |

### F4 — Motion longer than five seconds

**Evidence.** WCAG 2.1 SC 2.2.2 (Level A): "For any moving, blinking or scrolling information that (1) starts automatically, (2) lasts more than five seconds, and (3) is presented in parallel with other content, there is a mechanism for the user to pause, stop, or hide it unless the movement, blinking, or scrolling is part of an activity where it is essential". Its Note 4: "An animation that occurs as part of a preload phase or similar situation can be considered essential if interaction cannot occur during that phase for all users and if not indicating progress could confuse users or cause them to think that content was frozen or broken" (`w3.org/TR/WCAG21/#pause-stop-hide`, read 2026-11-13). A skeleton usually shows while the rest of the page is usable, so Note 4 rarely applies [INFERENCE]. Whether a 2 s opacity pulse is "blinking" is not settled by the text [INFERENCE]; a wave is moving. MANIFESTO Law 3 makes WCAG 2.1 AA non-negotiable (`docs/MANIFESTO.md:43`), and axe cannot detect the duration. Probe P4: `animation-iteration-count: 2` on a 2 s pulse ends at 4000 ms in three engines and leaves the resting style.

| Option | What it decides | Consequence |
|---|---|---|
| (a) Infinite, with docs | the motion runs while the placeholder shows; the docs tell the app to stop it (`animation="none"`) or remove the placeholder within five seconds | Matches Web Awesome and Radix Themes. A slow load can fail SC 2.2.2, and only the app can prevent it |
| (b) **Recommended.** Two cycles, then rest | `--line-skeleton-iteration-count: 2` with the 2 s duration, so the motion lasts 4 s; the consumer may set `infinite` and then owns SC 2.2.2 | Meets SC 2.2.2 by default, whatever the load time (P4). After 4 s the placeholder is still; a user who saw it move knows it stands for loading [INFERENCE] |
| (c) Default `none` | F2 (d) | Meets SC 2.2.2 by default with no motion at all; the PRD's animated indicator becomes opt-in |
| (d) A pause control | the component adds a button to stop the motion | A focusable control inside a placeholder that is hidden from assistive technology contradicts F1; every placeholder would carry one |

### F5 — Shapes and multi-line text

**Evidence.** In probe P7, `shape="text"` draws a `1em` bar with `calc((1lh - 1em) / 2)` margins, so three lines measure 72 px beside a 72 px paragraph, and two lines 76.75 px beside a 76.78 px heading; `lh` is supported in three engines. `circle` draws a 48 px square item with a 50 % radius, and `lines` draws one item per line with the last at 60 %. Each shape changes only token defaults (P7; ARCH §17.2 C6). Web Awesome has no shape attribute and shows circles and paragraphs through `::part(indicator)` and several hosts ("Shapes", "Paragraphs" in `dist/skills/webawesome/references/components/skeleton.md`). SD12 keeps one tag per entrypoint (Phase 1 spec `:2359`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `shape` and `lines` | `shape="rect \| circle \| text"` through token defaults; `lines` draws that many items, the last shorter | One host draws a paragraph that matches its font (P7). Agents get two plain props (P10). `lines` needs a bound (D8) |
| (b) `shape` only | several hosts for several lines | Simpler shadow tree. A paragraph needs as many hosts as lines, and the last-line width is the author's job |
| (c) No shape | one block; shapes through tokens and `::part(item)`, as Web Awesome | Smallest API. Agents cannot ask for a circle or text lines; every author restyles for common shapes |
| (d) Separate tags | `line-skeleton-text`, `line-skeleton-circle` | Matches some React libraries [INFERENCE]. Contradicts SD12's one tag per independent entrypoint |

### F6 — Wrapper mode

**Evidence.** PRD §4.1 calls Skeleton a "Placeholder loading indicator" (`docs/PRD.md:261`). Radix Themes 3.3.0 `Skeleton` wraps its children, `loading` defaulting to `true`, and sets `aria-hidden`, `inert` and `tabIndex={-1}` on the wrapper while children take `visibility: hidden` (`dist/esm/components/skeleton.js`; `src/components/skeleton.css`). Web Awesome's has no slot (`chunk.XQCWQFLH.js`). In probe P5, only `visibility: hidden` on a shadow wrapper hides slotted content from sight, Tab, pointer and the Chromium tree; `inert` alone keeps it painted, and `aria-hidden` alone leaves controls focusable, which axe reports. In probe P6, a wrapper shows its content before the module runs. In probe P10, a wrapper's agent path needs `loading` (`DynamicBoolean`) and `child` (`ComponentId`), and the tool drops `child`. In probe P8, htmx swaps work either way.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Placeholder only | no slot; the app replaces the host with the content | Matches the PRD row. No hidden content, no pre-upgrade flash (P6), no slot for htmx (d). The placeholder's size is the author's estimate (F5) |
| (b) Wrapper | a default slot and `loading`; while loading, a shadow wrapper with `visibility: hidden` around the slot and the fill on `root`; otherwise the slot alone | The placeholder takes the content's size (P5). The content must exist before its data, it shows before the upgrade (P6), and the descriptor gains `loading` and `child` with a tool description (P10). Adding a slot later is additive [INFERENCE] |
| (c) Both | the placeholder when the host is empty, the wrapper when it has children | Two behaviours on one tag, chosen by content; the agent path carries (b)'s props |

### F7 — Agent props

**Evidence.** ARCH §17.4 ignores agent theme hints by default (`docs/ARCHITECTURE.md:1639`), and MANIFESTO Principle 8 leaves every styling decision to the host (`docs/MANIFESTO.md:33`). In probe P10, `shape` (enum) and `lines` (`DynamicNumber`) reach the catalog and all three providers' tools, and a bound `lines` updates the same element; `animation` reaches them too. A wrapper's `child` reaches the catalog but not the tools. Phase 1 spec §6.G.1 types a number prop as `DynamicNumber` and an enum as `z.enum` (`:1326`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `shape`, `lines` | the agent picks the shape and the line count | Enough to sketch a card or a paragraph (P10). Motion stays with the host |
| (b) `shape`, `lines`, `animation` | the agent also picks the motion | Motion is styling, which ARCH §17.4 keeps from agents |
| (c) None | an agent node always draws one `rect` | No schema to learn; an agent cannot sketch text or an avatar |
| (d) (a) with F6 (b)'s `loading` and `child` | an agent wraps content | Needs F6 (b) and a tool description, because the tool drops `child` (P10; Phase 1 spec `:1435`) |

### F8 — Sizing

**Evidence.** MANIFESTO Law 5 forbids styles in TypeScript (`docs/MANIFESTO.md:47`), and MANIFESTO Out of Scope rules out inline `style` as a primary API (`:67`). In probe P7, size tokens set on the host size each item, and `text` sizes itself from the font. ARCH §13.5 gives Spinner a `size` prop (`docs/ARCHITECTURE.md:624`), and AvatarGroup maps each `size` value to a `--line-size-*` step through token defaults (`packages/line-components/src/avatar-group/avatar-group.ts:129-131`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Tokens and `::part(item)` | `--line-skeleton-inline-size` and `--line-skeleton-block-size`; `text` follows the font | No new attribute. Agents cannot size a `rect` or a `circle` beyond the defaults |
| (b) `width` and `height` attributes | the component writes them into styles | Styles in TypeScript (Law 5) and an inline-style API (Out of Scope) |
| (c) A `size` scale | `size="1"`…`"9"` sets `--line-skeleton-block-size` to a `--line-size-*` step, as AvatarGroup maps its `size` | Agents can size circles and blocks through an enum. One more prop, and widths stay with tokens |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
