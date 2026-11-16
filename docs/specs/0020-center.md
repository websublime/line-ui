# Center

| Field | Value |
|-------|-------|
| Status | `proposed` (forks resolved; not APPROVED) |
| Phase | `1` |
| Tier | `Static` (Phase 1 spec §6.C.4 C18 row, `docs/specs/01-spec-core-primitives.md:1174`; PRD §4.1, `docs/PRD.md:265`; ARCH §8, `docs/ARCHITECTURE.md:410`) |
| Tag | `line-center` |
| Entrypoint | `@websublime/line-components/center` (Phase 1 spec §4.2, `:257`, `:306`; §10 SD12, `:2359`) |
| Form-associated | `no` (Phase 1 spec §6.C.4 C18 row) |
| PRD catalogue entry | PRD §4.1, `Center` row (`docs/PRD.md:265`) |
| Ledger row | `01-C18` (`docs/plans/01-tasks-core-primitives.md:64`) |
| Governing sections | Phase 1 spec §4.2 (`:257`, `:306`), §6.C.0 (`:908-931`), §6.C.4 (C18 row `:1174`, notes `:1147-1153`, `:1178-1183`), §6.C.6 (`:1218-1240`), §6.G.1 (`:1323`, `:1326`), §6.G.2 (`:1371`, `:1373`), §6.G.3 (`:1405`, `:1423`, `:1434`, `:1438`), §6.G.4 (host naming `:1512-1518`), §6.G.5 (`:1597`), §7.3, §7.4 (`:2111`), §7.5 (`:2127`), §7.6 (`:2144`), §7.8 (`:2175`), §10 SD4 (`:2351`), SD12 (`:2359`), SD34 (`:2381`), SD38 (`:2385`), SD47 (`:2394`), SD59 (`:2406`), SD98 (`:2445`), SD99 (`:2446`), §12 AM-069, AM-086, AM-098 (`:2559`), AM-099 (`:2560`), AM-101 (`:2562`); ARCH §3, §4, §5, §8 (`:410`), §12 (`:548`), §14.7 (`:1163`), §14.8, §17.2 (`:1566-1580`), §17.3 (`:1614`), §17.4 (Theme row `:1639`); PRD §4.1 (`:265`), §5.2 (`:534-543`), §8 (`:1194-1217`); MANIFESTO Laws 1, 2, 3, 4, 5, 9; R8 `docs/research/01-research-accessibility.md:55`, `:82` |

The spec stays `proposed` until its review gate passes and Miguel approves it, before any code (PRD §8.3, `docs/PRD.md:1217`). Miguel decided Open Questions F1–F10 on 2026-11-16, each on the option the draft recommended, and Part A and Part B state those decisions. The drafter defaults D1–D20 stand as drafted (Miguel, 2026-11-16). F7 (a), `hostNaming: never`, adds Center to the Phase 1 spec lists of components that take no host name, which needs a Phase 1 spec amendment AM-102 with trigger `decision`, as AM-098 (Kbd), AM-099 (Skeleton) and AM-101 (Grid) did. Text marked `[INFERENCE]` has no probe or source behind it yet. ARCHITECTURE names Center only as an example of the Static tier (§8, `:410`); it governs Center through that tier, the bundle rule (§12), the "all Static" reset row (§14.7, `:1163`) and the agent rules (§17).

---

## Probes

Throwaway probes ran on 2026-11-16 to inform F1–F10 and defaults D2, D3, D5, D6, D8, D9, D12, D13 and D19. Their code lived in `packages/line-components/temp/c18-probe/` and `packages/line-genui/temp/c18-probe/`, which `.gitignore` ignores through its `temp` entry (`.gitignore:4`), and the downloaded catalog and competitor files in `/tmp/c18-basic-v09.json`, `/tmp/c18-comp/` and `/tmp/c18-size*.js`, outside the repository. All of them were deleted after the run. Nothing of them is committed.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2.1, arm64; Bun 1.4.3; Node v22.23.3 |
| Runner | Playwright 1.64.0 with its own engines, chromium 156.0.8078.4, firefox 157.0 and webkit 27.2; one config with three projects on the repo's device presets (`Desktop Chrome`, `Desktop Firefox`, `Desktop Safari`, as `playwright.config.ts:31-33`), one worker. Pages were served from `http://probe.local` through `route.fulfill`, at the page font `16px/1.5 sans-serif` |
| Probe component | `line-probe-center`, a `LineElement` subclass (`@websublime/line-core` dist, Lit 3.3.3) with `commonReset`, bundled with `bun build`. It drew the recommended design: the host as a column flex container over a bare `<slot>`, `justify-content: safe center` and `align-items: safe center` on `:host`, `axis` (`both`, `horizontal`, `vertical`; unknown values behave as `both`) whose `horizontal` rule resets `justify-content` to `normal` and whose `vertical` rule resets `align-items` to `normal`, and `:host([hidden]) { display: none }` as the last rule. It also carried a probe-only `inline` boolean (`display: inline-flex`) for F3 |
| Probe hosts | `defineVariant(tag, css)`, a plain `HTMLElement` with an open shadow root holding one `<style>` and a bare `<slot>`, for the alternative techniques of F2, F4, F8 and F9 (the stylesheets are listed in P2–P4) |
| Children | "one" is a 100 × 40 px `<div>`; "three" are `<div>`s of 60, 120 and 90 × 30 px; "text" is the text node `Hello`; "two spans" are `<span>Hello</span><span>World</span>`; "long" is one `<p>` of 48 words; "img" is an 80 × 80 `<img>` |
| htmx | htmx 2.0.11 and 4.0.0 from `node_modules/.bun`, loaded as page scripts, with `hx-get` swaps answered by `page.route` |
| axe | `@axe-core/playwright` 4.14.0 with axe-core 4.14.0, once with the §7.4 tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and once with every rule |
| Chromium accessibility tree | a CDP session, `Accessibility.getFullAXTree`, walked from each case's wrapper `<div>` through `DOM.querySelector` and `DOM.describeNode`, listing the role and name of every node that is not ignored |
| Other engines | Playwright's `ariaSnapshot()`, which Playwright computes itself from the DOM |
| Unit tier | happy-dom 20.14.6 through `bun-test-preload.ts`, with Lit, zod, Ajv 2020, `@a2ui/web_core` 0.14.0, and the `line-genui` catalog, tools and surface from `src/` |
| A2UI catalogs | `a2ui-project/a2ui@cbaa5ee62c737b50d0695c1e5794d0f648b61dca` `specification/v0_9/catalogs/basic/catalog.json`, fetched (SHA-256 `8cc94d0a…22e13e`), and the vendored v0.9.1 copy `packages/line-genui/__tests__/fixtures/a2ui-v0_9_1/basic_catalog.json` |
| Competitors | the seven libraries of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 (`:30`), each through `npm view` and `npm pack` on 2026-11-16: `@awesome.me/webawesome` 3.14.0, `@spectrum-web-components/bundle` 1.12.6, `@lion/ui` 0.27.0, `@fluentui/web-components` 3.2.1, `radix-ui` 1.8.1 (Radix Primitives, the `Radix` column, `:22`), `bits-ui` 2.21.0 and `@ark-ui/react` 5.40.0; and three libraries outside the table, `@radix-ui/themes` 3.3.0, `@chakra-ui/react` 3.38.0 and `@mantine/core` 9.8.1 |
| Size | esbuild 0.28.2 and `gzip -9 -n` |

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `bun build center-probe.ts --outfile bundle.js --target browser --format esm` in the probe folder | 0 | one 60.12 KB module with the probe component, `defineVariant`, `line-core` and Lit |
| 2 | `node_modules/.bin/playwright test -c packages/line-components/temp/c18-probe/playwright.config.ts layout.probe`, run twice, the second time with the two `:not([hidden])` cases of P5 added | 0 | 3 passed each time; P2, P3, P4, P5, P6 |
| 3 | the same config with `a11y.probe htmx.probe` | 1 | `a11y.probe` 3 passed; `htmx.probe` 6 failed, because the probe's catch-all route answered the htmx script request with the page HTML, so `htmx` was undefined |
| 4 | the same config with `htmx.probe`, after the catch-all route fell back for any path but `/` and `/bundle.js` | 0 | 6 passed; P7 |
| 5 | `node v.mjs`, which launched each engine and printed `browser.version()` | 0 | the engine versions of Setup |
| 6 | `bun test ./packages/line-components/temp/c18-probe/happy.test.ts` | 1, then 0 | the first run built the host with `document.createElement` and read an empty shadow root and empty computed styles; the second mounted it through `innerHTML` in a `<div>`, as `grid.test.ts` `mountMarkup` does, and passed (1 pass); P8. The cause of the first reading was not investigated |
| 7 | `bun test ./packages/line-genui/temp/c18-probe/agent.test.ts` | 0 | 1 pass; P9 |
| 8 | `curl -sL` of the v0.9 basic catalog at `cbaa5ee`, `shasum -a 256`, `jq '.components \| keys'`, `diff` of `jq -S '.components'` against the vendored v0.9.1 file, and `grep -n -i center` over both | 0 | P10 |
| 9 | `npm view <package> version` for the ten packages of Setup and for `@radix-ui/react-center`, `@spectrum-web-components/center`, `@spectrum-web-components/layout`, `@fluentui/web-components-center` and `@ark-ui/center`; then `npm pack <package>@<version>` and `tar xzf` of the ten into `/tmp/c18-comp`; `jq`, `ls`, `grep` and `find -iname '*center*'` over each package | 0 (the five extra `npm view` calls answered `E404`) | P11 |
| 10 | `node_modules/.bin/esbuild size.ts --bundle --minify --format=esm --target=es2022 --external:lit '--external:@websublime/*'`, then `gzip -9 -n`, for `size.ts` (the recommended design without `inline` and `defineVariant`) and for `center-probe.ts` | 0 | P12 |
| 11 | `rm -rf packages/line-components/temp/c18-probe packages/line-genui/temp/c18-probe /tmp/c18-basic-v09.json /tmp/c18-comp /tmp/c18-size.js /tmp/c18-size2.js`; `git status --short` | 0 | deleted; the tree holds only this spec |

Every result below was the same in chromium, firefox and webkit unless a row says otherwise. Positions are CSS pixels `x,y` of a child's top-left corner relative to the host's top-left corner; the host is 400 × 300 px unless a row says otherwise. Firefox draws the text node one pixel shorter (17 px against 18 px), so its text rows read 0.5 px lower; the tables give the chromium and webkit value.

### P1 — Accessibility tree, axe and Tab

Each case sat in its own `<div id="case">`. "Children" are two `<div>`s with the text One and Two.

| Case | Chromium tree under the wrapper (CDP) | `ariaSnapshot()`, three engines | axe 4.14.0, §7.4 tags and all rules |
|---|---|---|---|
| A. children | no node for the host; two `generic` nodes with their text | `- text: One Two` | none |
| B. empty | nothing | empty | none |
| C. A with `aria-label="Hero"` | `generic "Hero"` holding the two `generic` children | `- text: One Two` | none |
| D. empty with `aria-label="Hero"` | `generic "Hero"` | empty | none |
| E. C with `aria-description="Welcome"` | `generic "Hero"` holding the two children | `- text: One Two` | none |
| F. `role="group" aria-label="Actions"`, two `<button>`s | `group "Actions"` with two `button` | `- group "Actions":` with two `button` | none |
| G. `role="region" aria-label="Empty state"`, one `<p>` | `region "Empty state"` with a `paragraph` | `- region "Empty state":` with `- paragraph: No results` | none |

- A role-less Center adds no node of its own, and its children read in DOM order (A).
- A host `aria-label` names a `generic` in the Chromium tree (C, D, E). ARIA 1.2 prohibits that name (R8 `docs/research/01-research-accessibility.md:55`), and axe does not report it, through the custom-element exemption of `aria-prohibited-attr` that `0018-stack.md:169` traces.
- An author role that allows a name works on the host with no node in between (F, G).
- Tab from a button before a Center lands on the button after it, so the host takes no focus.

### P2 — Techniques and axes

The recommended design (a) is the probe component. The alternatives are probe hosts with these stylesheets: (b) flex row, `:host { display: flex; justify-content: center; align-items: center }`; (c) grid items, `:host { display: grid; place-items: center }`; (d) grid content, `:host { display: grid; place-content: center }`; (d′) grid content and items, (d) plus `justify-items: center`; (e) margins, `:host { display: block } ::slotted(*) { margin-inline: auto }`. The one-axis grid variants are `justify-items: center` (horizontal), `align-items: center` and `align-content: center` (vertical).

One 100 × 40 child:

| Technique | both | horizontal only | vertical only |
|---|---|---|---|
| (a) flex column | 150,130 | 150,0 | 0,130 |
| (b) flex row | 150,130 | — | — |
| (c) grid items | 150,130 | 150,0 (`justify-items`) | 0,130 (`align-items`) |
| (d) and (d′) grid content | 150,130 | — | 0,130 (`align-content`) |
| (e) margins | — | 150,0 | — |

Three children of 60, 120 and 90 px:

| Technique and axis | x | y |
|---|---|---|
| (a) both | 170, 140, 155 | 105, 135, 165 |
| (a) horizontal | 170, 140, 155 | 0, 30, 60 |
| (a) vertical | 0, 0, 0 | 105, 135, 165 |
| (b) both | 65, 125, 245 | 135, 135, 135 |
| (c) both | 170, 140, 155 | 35, 135, 235 |
| (c) vertical (`align-items`) | 0, 0, 0 | 35, 135, 235 |
| (d) both | 140, 140, 140 | 105, 135, 165 |
| (d′) both | 170, 140, 155 | 105, 135, 165 |
| grid `align-content: center` | 0, 0, 0 | 105, 135, 165 |
| (e) | 170, 140, 155 | 0, 30, 60 |

Other content:

| Case | (a) both | (a) horizontal | (a) vertical | (b) | (c) | (e) |
|---|---|---|---|---|---|---|
| text node `Hello` (36.5 × 18) | 181.8,141 | 181.8,3 | 0,141 | 181.8,141 | 181.8,141 | 0,3 |
| two spans | stacked at 181.8,126 and 179.3,150 | stacked at y 0 and 24 | each stretched to 400 px wide, at y 126 and 150 | side by side at 161,138 and 197.5,138 | at y 63 and 213 | side by side at 0,3 and 36.5,3 |
| long paragraph | 400 × 144 at 0,78 | 400 × 144 at 0,0 | 400 × 144 at 0,78 | 400 × 144 at 0,78 | 400 × 144 at 0,78 | 400 × 144 at 0,0 |
| img 80 × 80 | 160,110 | 160,0 | 0,110 | 160,110 | 160,110 | 0,0 |
| no `axis`, and `axis="bogus"` | as `both` in every case | | | | | |

- One child lands in the same place under (a), (b), (c) and (d), so the techniques differ only for several children, text and inline content (F2).
- (a) keeps several children together as one column and centres the group and each child (F5 (a)). (b) puts them side by side. (c) splits the height into one row per child, so the group spreads to y 35, 135 and 235. (d) centres the group but leaves each child at the start of a track as wide as the widest child.
- (e) centres only on the horizontal axis and only block children narrower than the host. It leaves a text node, inline spans and an `<img>` at the start, because `::slotted(*)` matches no text node and `margin-inline: auto` does not move an inline box (F2, F4).
- Under (a) `vertical`, children without a width stretch across the host, as block children do; a child with a width or an `<img>` keeps its width at the start.
- A long paragraph fills the width, so centring has nothing to move on the horizontal axis. Its lines keep the inherited `text-align` [INFERENCE: line positions were not measured] (F10).
- An unknown `axis` value behaves as `both` (D8).

### P3 — Overflow

A 600 × 400 child in a 400 × 300 box, centred on both axes.

| Case | (a) `safe center` | flex column with plain `center` | (c) grid items |
|---|---|---|---|
| the host inside a 400 × 300 `overflow: auto` wrapper | child at 0,0; the wrapper scrolls 600 × 400 | child at −100,−50; the wrapper scrolls 500 × 350 | child at 0,0; scrolls 600 × 400 |
| the host itself `overflow: auto` | child at 0,0; scrolls 600 × 400 | child at −100,−50; scrolls 500 × 350 (WebKit 500 × 400) | child at 0,0; scrolls 600 × 400 |
| (a) under `dir="rtl"` | child at −200,0, so its right edge meets the host's right edge | — | — |

| Check | Result |
|---|---|
| `CSS.supports('justify-content', 'safe center')` and `CSS.supports('align-items', 'safe center')` | `true` in three engines |
| computed `justify-content` and `align-items` of the probe host | `safe center`, `safe center` |

- Plain `center` pushes 100 px of the child past the left edge and 50 px past the top, where no scrolling reaches it. `safe center` falls back to the start edge once the child is larger than the host, so every pixel stays reachable (F8).
- Under `dir="rtl"`, the start edge is the right edge, and `safe` follows it.
- A grid with `place-items: center` loses nothing here, because its implicit track grows to the child [INFERENCE: track sizing not read back].

### P4 — Height and context

| Case | Host size | One child at |
|---|---|---|
| in a 1000 × 300 `display: flex` row | 100 × 300 | 0,130 |
| the same with `flex: 1` on the host | 1000 × 300 | 450,130 |
| in the `auto` track of a 1000 × 300 `grid-template-columns: auto 1fr` grid | 100 × 300 | 0,130 |
| in a 400 × 300 grid cell | 400 × 300 | 150,130 |
| in a 400 × 300 block parent, no height on the host | 400 × 40 | 150,0 |
| the same with consumer `min-block-size: 100%` on `line-probe-center` | 400 × 300 | 150,130 |
| probe host with `min-block-size: 100%` in the shadow sheet, 400 × 300 block parent | 400 × 300 | 150,130 |
| the same after a 50 px `<header>` sibling | 400 × 300; the parent's `scrollHeight` is 350 | 150,130 |
| the same in a parent with no height | 400 × 40 | 150,0 |
| probe host with `block-size: 100%` and `padding: 20px` | 400 × 340 | 150,150 |

- A Center gets its width from its container and its height from its content, like any block box, so vertical centring needs a height from the consumer or from a stretching parent (F9).
- In a flex row or an `auto` grid track, the host sizes to its content, so horizontal centring has no room; the row's height still gives vertical centring room. `flex: 1` gives it the row's width (Connections).
- `min-block-size: 100%` in the component fills a parent with a set height, but it overflows that parent by the height of any sibling and does nothing in a parent without a set height. `block-size: 100%` with padding overflows by the padding (F9).

### P5 — `hidden`, inline display and consumer CSS

| Case | Computed `display`, or result |
|---|---|
| `<line-probe-center hidden>` | `none` |
| a probe host with `display: grid` and no `[hidden]` rule, with `hidden` | `grid` |
| `inline` | `inline-flex` |
| `inline hidden` (the `[hidden]` rule last) | `none` |
| page rule `line-probe-center.c { display: inline-flex }`, with `hidden` | `inline-flex` |
| page rule `line-probe-center.c:not([hidden]) { display: inline-flex }`, with `hidden` | `none` |
| the same rule without `hidden` | `inline-flex` |
| `inline`, 32 × 32 px, inside a line of text, holding the letter A | host 32 × 32; the letter at 10.7,7 |
| page rule `line-probe-center.c { justify-content: flex-end }` | the child at 150,260; the consumer rule wins over `:host` |

- `:host { display: flex }` beats the UA `[hidden]` rule, so the stylesheet needs `:host([hidden]) { display: none }` (D3).
- A consumer `display` rule on the host beats every `:host` rule, `:host([hidden])` included, so it shows a hidden Center. `:not([hidden])` in the consumer rule keeps `hidden` working (F3).
- An `inline` attribute whose rule comes before the `[hidden]` rule keeps `hidden` working (F3 (b)).

### P6 — Direction and writing mode

| Case | Child at |
|---|---|
| `dir="rtl"`, `axis="horizontal"`, one child | 150,0 |
| `dir="rtl"`, `axis="vertical"`, three children of 60, 120 and 90 px | x 340, 280, 310 (each at the right edge); y 105, 135, 165 |
| `dir="rtl"`, (e) margins, one child | 150,0 |
| `writing-mode: vertical-rl`, `axis="both"` | 150,130 |
| `writing-mode: vertical-rl`, `axis="horizontal"` | 300,130: centred top to bottom, at the right edge |
| `writing-mode: vertical-rl`, `axis="vertical"` | 150,0: centred left to right, at the top |

- Centring follows the writing direction, because flexbox lays out on logical axes; a start-aligned axis starts at the right under `dir="rtl"` (D9).
- In a vertical writing mode the names turn with the axes, so `horizontal` centres top to bottom. `horizontal` names the inline axis and `vertical` the block axis, as Stack's `orientation` does (F1; `0018-stack.md:116`).

### P7 — htmx

| Case | htmx 2.0.11 and htmx 4.0.0, three engines |
|---|---|
| a 400 × 200 Center with `hx-get`, `hx-trigger="load"` and `hx-swap="innerHTML"`, replacing a "Loading" paragraph with one 100 × 40 child | the child at 150,80 |
| a `<div>` with `hx-trigger="load"` and `hx-swap="outerHTML"`, replaced by a Center with `axis="horizontal"` holding one child | the child at 150,0; the new host reads `axis` `horizontal` |

- htmx swaps server content into the slot and replaces the host, and the Center centres the new content with nothing from htmx (D13).

### P8 — happy-dom

| Check | Result |
|---|---|
| shadow root children | `["slot"]`; two adopted sheets |
| `getComputedStyle(host)` with no attribute | `display: flex`, `flex-direction: column`, `justify-content: safe center`, `align-items: safe center` |
| `axis = 'vertical'` | the attribute `axis="vertical"`; `align-items: normal` |
| the attribute `axis="diagonal"` | the property `both`; the attribute keeps `diagonal` |
| removing `axis` | the property `both`; no attribute |
| `hidden` | `display: none` |
| `inline` | the attribute `inline=""`; `display: inline-flex` |
| attributes of a fresh host; `role`; `internals.role` | none; `null`; `null` |

- The unit tier can check the shadow tree, the converter, reflection, the absence of ARIA and the computed alignment keywords on `:host`. Child positions belong to the Browser tier.

### P9 — Agent path

A stub descriptor `Center` for `line-probe-center` took the recommended schema: `axis` (`z.enum(['both', 'horizontal', 'vertical'])`, optional, plain `.describe()`) bound to the attribute `axis`, and `child` (`ComponentId`, optional, through `commonProp`) with the slot map `child` → default slot, `hostNaming: { kind: 'never' }`, and the agent-facing description and tool description of Descriptor fields, 700 and 673 characters. A second stub `CenterN` took `children` (`ChildList`) in place of `child`, for F6. The probe pushed both onto the exported `descriptors` array before it loaded the surface module, because the surface reads that array at module load (`packages/line-genui/src/a2ui/projection.ts:19`, `:58-60`).

| Check | Result |
|---|---|
| `lineCatalogDocument` | a `Center` entry with `allOf` of `ComponentCommon` and an own object; `axis` a string enum; `child` a `$ref` to `ComponentId`; `CenterN.children` a `$ref` to `ChildList` |
| `inlineCatalog` against `client_capabilities.json#/$defs/Catalog` (Ajv 2020) | valid |
| `frontendTools`, OpenAI | one parameter, `axis`, typed `["string", "null"]` with `null` in its enum and listed in `required`; **no `child`**; the tool takes the tool description |
| Anthropic | `axis`, optional |
| Gemini | `axis` with `nullable: true` |
| any provider | no `accessibilityLabel` or `accessibilityDescription`, because `hostNaming` is `never` |
| surface, `line` catalog, a `Center` root with `axis: "vertical"` and `child` a Kbd | no error; `<line-probe-center axis="vertical"><line-kbd keys="mod+k"></line-kbd></line-probe-center>` |
| a `Center` node with no props | no error; `<line-probe-center></line-probe-center>` |
| a `Center` node with `accessibility: { label: "Hero", description: "Welcome" }` | no `aria-label` or `aria-description` on the host |
| `child` a horizontal Stack of two Kbds | no error; the Stack and its two Kbds inside the host |
| `child: ["a", "b"]` | `VALIDATION_ERROR`, "child: Expected string, received array"; nothing renders |
| `CenterN` with `children: ["a", "b"]` | no error; both Kbds in the host |
| `axis: "diagonal"` | `VALIDATION_ERROR`, "axis: Invalid enum value. Expected both \| horizontal \| vertical, received 'diagonal'"; nothing renders |

- The agent path needs one attribute binding, and the surface removes the attribute of an unset prop, so the default must not depend on a reflected attribute (D8).
- A `ComponentId` slot takes one child and rejects a list; a Stack as the child carries several (F6).
- `child` reaches the catalog but not the tools (§6.G.3, `:1405`; §10 SD47), so a description that names it needs a tool description (D12).

### P10 — A2UI basic catalogs

- The v0.9 basic catalog at `cbaa5ee` and the vendored v0.9.1 copy list the same 18 types: AudioPlayer, Button, Card, CheckBox, ChoicePicker, Column, DateTimeInput, Divider, Icon, Image, List, Modal, Row, Slider, Tabs, Text, TextField, Video. A `diff` of their sorted `components` objects is empty.
- Neither has a centring type. The word `center` appears only as an enum value of `Row` and `Column` `justify` and `align` and of `List` `align` (v0.9 `catalog.json:259-261`, `:274`, `:305-308`, `:320`, `:357`; the vendored file at the same lines). The `basic` map renders `Row`, `Column` and `List` as `line-stack` (ARCH §17.3, `docs/ARCHITECTURE.md:1614`), so a basic agent centres through a Row or Column with `justify: "center"` and `align: "center"` today.
- `Card` takes one `child` (`ComponentId`), whose description says "To display multiple elements, you MUST wrap them in a layout component (like Column or Row) and pass that container's ID here" (v0.9 `catalog.json:383`). It is the single-child precedent F6 (a) follows.

### P11 — Competitors

Checked on 2026-11-16, one row per column of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 (`:30`; the `Radix` column is Radix Primitives, `:22`). "Center component" means an element or component whose job is to centre its content, the component this spec defines.

| Library | Package and version | Center component | Source |
|---|---|---|---|
| Web Awesome | `@awesome.me/webawesome` 3.14.0 | none; utility classes only | `dist/custom-elements.json` declares 73 tags and none matches `center`, `layout` or `stack`. `dist/styles/utilities/align-items.css:3-11`, `:19-21` and `justify-content.css:3-12`, `:20-22` define `wa-align-items-center` and `wa-justify-content-center`, which also set `display: flex`. `layout.css:75-79`, `:98-101` make `wa-frame` a square flex box with `overflow: hidden` that centres its content on both axes |
| Spectrum Web Components | `@spectrum-web-components/bundle` 1.12.6 | none | the bundle's `dependencies` list 74 packages and none for centring or layout (`grid` and `split-view` only); `npm view @spectrum-web-components/center` and `@spectrum-web-components/layout` answer `E404` |
| Lion | `@lion/ui` 0.27.0 | none | `components/` holds 42 directories, none for centring or layout; `find -iname '*center*'` matches nothing |
| Fluent UI Web Components | `@fluentui/web-components` 3.2.1 | none | `custom-elements.json` declares 42 tags and none matches `center`, `layout` or `stack`; `find -iname '*center*'` matches nothing; `npm view @fluentui/web-components-center` answers `E404` |
| Radix Primitives | `radix-ui` 1.8.1 | none | its 55 `dependencies` and its `dist/` modules include no centring package; `npm view @radix-ui/react-center` answers `E404` |
| Bits UI | `bits-ui` 2.21.0 | none | `dist/bits/` holds 45 directories, none for centring; `find -iname '*center*'` matches nothing |
| Ark UI | `@ark-ui/react` 5.40.0 | none | `dist/components/` holds 74 directories, none for centring; `find -iname '*center*'` matches nothing; `npm view @ark-ui/center` answers `E404` |

Three libraries outside the table ship one, or a close relative.

- Chakra UI 3.38.0 `Center` is a `div` with `display: flex`, `align-items: center` and `justify-content: center`, and its `inline` variant sets `display: inline-flex` (`dist/esm/components/center/center.js:5-17`). Its `AbsoluteCenter` takes `axis` with `horizontal`, `vertical` and `both`, default `both`, and centres itself in a positioned parent through `position: absolute` and `translate` (`absolute-center/absolute-center.js:5-37`).
- Mantine 9.8.1 `Center` sets the same three declarations, and its `inline` prop sets `display: inline-flex` (`styles/Center.css:1-9`; `esm/components/Center/Center.mjs:11`, `:25`).
- Radix Themes 3.3.0 ships no `Center`. Its `Container` is a flex column with `align-items: center` around an inner box with a `max-width` per `size` `1`–`4`, the intrinsic centring of F4 (b) (`styles.css:5209-5231`; `dist/esm/components/container.props.js`, `align` `left | center | right`).
- None of the three uses `safe` alignment.
- So none of the seven ships a centring element or component. The Center row of the analysis gets `—` in all seven cells, with Web Awesome's classes and the three outside libraries in its Notes (D17).

### P12 — Size

The recommended design, a module with the class, the converter, the stylesheet and `customElements.define`, is 879 B minified and 467 B gzipped through esbuild (`--bundle --minify --format=esm --target=es2022 --external:lit --external:@websublime/*`, then `gzip -9 -n`), the §7.6 recipe. With the probe-only `inline` prop and `defineVariant` it is 1,221 B and 600 B. The shipped `./center` lands in the "Size report" step against the < 5 KB soft target [INFERENCE: the shipped figure is not measured yet].

### What the probes settle

- The host can be the flex container over a bare slot, as on Stack, and author roles reach the children with no node in between (P1, P2; D2).
- A column flex container with `safe center` centres one child, a group of children, text and images on either axis or both, in three engines, and loses nothing when the content is larger than the box (P2, P3; F2, F5, F8).
- Vertical centring needs a height that the component cannot supply without overflowing in common layouts (P4; F9).
- A consumer `display` rule hides nothing from `hidden` unless it excludes `[hidden]` (P5; F3).
- htmx swaps need nothing (P7; D13). The agent path works with one attribute binding and a `ComponentId` slot (P9; D8, D12).
- No A2UI basic type and none of the seven libraries ships a Center (P10, P11).

### What automation cannot observe

- What a screen reader announces for a role-less Center, and whether it reads the children in DOM order. P1 reads the Chromium tree only.
- Firefox and WebKit accessibility trees. Playwright's snapshot is its own computation from the DOM (Phase 1 spec §12 AM-058).
- Whether authors expect `horizontal` to stay physical in vertical writing modes, which F1 weighs.

---

## Part A — Requirements

### Overview

#### Description

`<line-center>` centres its content horizontally, vertically or on both axes (PRD §4.1, `docs/PRD.md:265`). The host is a flex container that lays its children out as one column and centres them, and `axis` picks the axes, `both` by default (F1 (a), F2 (a)). Content larger than the box starts at its start edge, so none of it is cut off (F8 (a)). Center adds no role, no state and no behaviour, so it stays a `generic` element in the accessibility tree (R8 `docs/research/01-research-accessibility.md:82`).

#### Use cases

- An empty state, a spinner or a sign-in form in the middle of a panel whose height the page sets.
- An icon or initials in the middle of a fixed square, such as a 2rem tile.
- A label centred left to right above a full-width table (`axis="horizontal"`).
- A short label centred top to bottom beside a tall image in a horizontal `<line-stack>` (`axis="vertical"`).
- An agent-built centred block on `<line-a2ui-surface>` through the `line` catalog.

#### Anti-patterns

- A readable column of text with a maximum width in the middle of the page. Give the column `max-inline-size` and `margin-inline: auto` in consumer CSS; Center centres its content inside its own box and does not cap its width (F4).
- Several items in a row with spacing. Use `<line-stack orientation="horizontal" justify="center">` (row 01-C3), or put that Stack inside a Center (F5).
- Centred lines of text inside a paragraph. Set `text-align: center` on the paragraph; Center moves boxes, not lines (F10).
- Overlaying one element on the centre of another. Center lays its children out in flow and positions nothing.
- A grid of items. Use `<line-grid>` (row 01-C17).

#### User expectations

- Content sits in the middle of the box on the chosen axes, in the writing direction of the page.
- Content larger than the box stays fully reachable by scrolling.
- Center adds nothing to what a screen reader announces, and focus moves through the children in source order.
- Consumer CSS on `line-center` overrides any layout default.

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| any element or `line-*` component | child | the default slot; Center never imports a child (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`) |
| `<line-stack>` | child or parent | the default slot; a Stack inside a Center centres a spaced group; a Center inside a horizontal Stack centres top to bottom against the row (P4) |
| `<line-a2ui-surface>` | orchestrator | creates `line-center` by tag for a `line` catalog `Center` node and puts its `child` in the default slot (ARCH §17.4; Phase 1 spec §6.G.4); no A2UI `basic` type maps to it (P10; D11) |

- In a flex row, such as a horizontal `<line-stack>`, or in an `auto` grid track, `line-center` is as wide as its content, so horizontal centring has no room. Give it `flex: 1` or a width there (P4).
- Vertical centring needs a height. Give `line-center` a `block-size` or `min-block-size`, or place it where a parent stretches it, such as a grid cell or a flex row (P4; F9 (a)).

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| none | — | — |

- Center has no C6 semantic variant. `axis` is a layout prop, as Stack's `orientation` is, so it maps to CSS alignment on `:host` and touches no token (ARCH §17.2 C6; Props below; D7).

---

## Part B — Technical Specification

### Anatomy

```
<line-center>                LineElement; display: flex, flex-direction: column on :host; the host is the flex container
└── #shadow-root
    └── <slot>               slotted children are the host's flex items
```

- The shadow root holds only a bare `<slot>`, with no wrapper element, as on Stack and Grid (`0018-stack.md` Open Question 1; `0019-grid.md` D2; D2).
- A `<slot>` has `display: contents` by default, so slotted children and text take part in the host's flex layout directly (P2, in three engines).
- No `generic` node sits between a host `role="group"` or `role="region"` and its children (P1 F, G).
- `commonReset` sets nothing on `:host` (`packages/line-core/src/styles/reset.common.css:2-38`), so `:host { display: flex }` does not conflict with it.
- `:host { display: flex }` beats the UA `[hidden]` rule, so the stylesheet ends with `:host([hidden]) { display: none }` (P5; D3).

### States

| Field | Value |
|-------|-------|
| Machine | `none` (Static tier; ARCH §8, `:410`; Phase 1 spec §6.C.4 C18 row) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| none | — | — | — |

Center has no finite states and no state flags, so it writes no `data-*` attribute and no `:state()` (ARCH §14.8; D1).

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ComponentId` | the content to centre, one element or text in the agent contract (F6 (a)); in markup, several children form one centred column in source order with no gap (F5 (a)); the A2UI `child` |

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| none | — | — |

- Center exposes no `::part()` (D2). MANIFESTO Law 1 holds as on Stack, because the only styleable zone is the host, which the consumer styles with `line-center { … }`, and the children are light-DOM elements the consumer styles directly (`0018-stack.md:108-110`).
- Consumer CSS on `line-center` in the outer tree beats the component's `:host` rules for normal declarations (P5).

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `axis` | `axis` | `'both' \| 'horizontal' \| 'vertical'` | `'both'` | yes | the axes to centre on; `horizontal` is the inline axis and `vertical` the block axis (F1 (a); P6) |

- "Reflects" means a value the author or code sets is written to the attribute; the default leaves no attribute (Lit `useDefault: true`), so an unknown author value stays as written (C8) and removing the attribute restores the default, as on Stack (`0018-stack.md` AM-002; D8).
- `axis` uses Stack's `enumConverter` with the fallback `both` (`packages/line-components/src/stack/stack.ts:20-22`), so an unknown value behaves as `both` (P8).
- `horizontal` centres the content from side to side and keeps it at the top; `vertical` centres it from top to bottom and stretches children without a width across the host, as block children are (P2).
- Center has no `inline`, `gap`, `max-width`, `fill` or `text` prop (F3 (a), F4 (a), F5 (a), F9 (a), F10 (a)).

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

Center dispatches no event. It holds no value and takes no input, so C3 and C9 add nothing (D1).

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| none | — | — |

Center reads and declares no custom property, so it works the same with or without `line-tokens` and `line-themes` (D7). The component stylesheet after `commonReset` is this rule set, in this order.

```css
:host {
  display: flex;
  flex-direction: column;
  justify-content: safe center;
  align-items: safe center;
}

:host([axis='horizontal']) {
  justify-content: normal;
}

:host([axis='vertical']) {
  align-items: normal;
}

:host([hidden]) {
  display: none;
}
```

- In a column flex container `justify-content` acts on the block axis and `align-items` on the inline axis, so each `axis` rule resets one property (P2, P6).
- `normal` behaves as `flex-start` for `justify-content` and as `stretch` for `align-items` in a flex container, so one-axis centring leaves the other axis as a plain column (P2, P8).
- `safe center` falls back to the start edge when the content is larger than the host (P3; F8 (a)).
- The stylesheet has no rule for `axis='both'`, because `:host` already declares it.
- The `[hidden]` rule comes last, so no later attribute rule can set `display` over it (P5; D3).
- Center draws no colour, border or focus ring, so it needs no `line-themes` role token.

#### Consumer styling

```css
/* A panel whose height lets Center centre top to bottom (P4) */
.empty-state line-center { min-block-size: 16rem; }

/* A square tile that centres an icon */
line-center.tile { inline-size: 2rem; block-size: 2rem; }

/* An inline Center that still honours `hidden` (P5) */
line-center.inline:not([hidden]) { display: inline-flex; }

/* A Center in a horizontal Stack that takes the rest of the row (P4) */
line-stack > line-center { flex: 1; }
```

- A `display` rule on `line-center` overrides `hidden` unless it excludes `[hidden]` (P5).

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

Center takes no focus. Focus moves through its children in source order (P1; D6).

### A11y

| Field | Value |
|-------|-------|
| Role | none; the host stays `generic` and adds no node to the Chromium tree when it has no name (R8 `:82`; P1 A; Phase 1 spec §6.C.4 C18 row) |
| ARIA attributes | none set by the component; it never writes `role`, `aria-*` or `internals.role`, and it leaves an author-set host `role` alone (D5) |
| Accessible name | none by default; see the C5 note below |
| Focus | none; the host is not focusable and does not delegate focus (P1; D6) |

- **C5.** ARIA 1.2 prohibits `aria-label` and `aria-labelledby` on `generic`, so a name on a role-less `line-center` names nothing a user can reach (R8 `:55`). Chromium still exposes it as a named `generic`, and axe 4.14.0 does not report it (P1 C, D, E; `0018-stack.md:168-169`). A name applies only with an author role that allows one, such as `role="group"` or `role="region"` (P1 F, G).
- **Order.** Center keeps the source order and offers no prop that reorders children (F5). Consumer CSS that moves children with `order` or `flex-direction: column-reverse` can make the visual order differ from the reading and focus order (WCAG 1.3.2, 2.4.3), and the docs warn against it [INFERENCE: not probed for Center; the same flex cascade as P5].
- **Reflow.** `safe center` keeps content that is larger than the box reachable by scrolling, which plain `center` does not (P3; WCAG 1.4.10).
- **Proof (D19).** No role, name or ARIA value lives in internals, so the CDP-and-read-back rule for internals roles does not apply (Phase 1 spec `:1180`). The Browser tier checks the tree with `ariaSnapshot()` in three engines and a Chromium CDP assertion.
- **Firefox and WebKit.** No check reads their accessibility trees, and no screen reader was run. The gap is recorded here (Phase 1 spec `:1180`; §12 AM-058).

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `axis` is a string enum |
| C2 | Slots carry `@slot` and a single or multiple classification | one `@slot` tag for the default slot, classified `ComponentId` (F6 (a)) |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | no events |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated |
| C5 | The host accepts an accessible name and applies it to the element with the role | the host is the only element and carries any author role; a name is valid only with an author role that allows it (A11y). On the agent path the surface sets no host name on a Center node, and the Center tool carries no accessibility parameters (F7 (a)) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | no variants; `axis` is a layout prop |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries `@summary` and `@slot` for the default slot; no `@csspart`, `@cssprop` or `@fires`, because there are no parts, tokens or events; nothing is deprecated (D18) |
| C8 | Missing or partial props degrade to an empty or neutral state | with no attributes it centres on both axes; with no children it is an empty flex box with no height; an unknown `axis` behaves as `both` (P2, P8, P9; D8) |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `Center` (D11) |
| Tag | `line-center` |
| `load()` subpath | `@websublime/line-components/center` |
| Prop schema | `axis` (`z.enum(['both', 'horizontal', 'vertical'])`, optional, plain `.describe()` with "Which way to centre the content: `both` (default), `horizontal` or `vertical`."), plus the catalog-only `child` (`ComponentId`, optional, through `commonProp` with "The ID of the component to centre; to centre several, a Stack that holds them."), which the frontend-tool walker leaves out, and `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1, `:1323`, `:1326`; §6.G.3; F6 (a)) |
| Slot map | `(default)` → `ComponentId` (`child`) |
| Binding map | `axis` → attribute `axis`; no value prop; no commit event (C9) |
| Action map | none |
| Accessibility requirements | no `requiredName`; `hostNaming: { kind: 'never' }`, because the host has no role a name could attach to and the surface never gives `line-center` a role (`packages/line-genui/src/catalog/descriptor.ts:160-174`; P1 C; P9). The Phase 1 spec names the components that take no host name in four places, so F7 (a) needs Phase 1 spec AM-102 (Spec drift found, item 1) |
| Agent-facing description | A layout container that centres its content. Put the content in `child`; to centre several components, put them in a Stack and make the Stack the child. `axis` sets the direction: `both` (default), `horizontal` or `vertical`. Centring shows only where the box has spare room. At the root or in a vertical Stack the box is as wide as its container and as tall as its content, so only horizontal centring shows; in a horizontal Stack it is as tall as the row and as wide as its content, so only vertical centring shows. Content larger than the box starts at its start edge, so none of it is cut off. Centring follows the page's writing direction and adds nothing to what assistive technology announces. |
| Tool description | A layout container that centres its content. The app places one component inside it, which may be a Stack that holds several. `axis` sets the direction: `both` (default), `horizontal` or `vertical`. Centring shows only where the box has spare room. At the root or in a vertical Stack the box is as wide as its container and as tall as its content, so only horizontal centring shows; in a horizontal Stack it is as tall as the row and as wide as its content, so only vertical centring shows. Content larger than the box starts at its start edge, so none of it is cut off. Centring follows the page's writing direction and adds nothing to what assistive technology announces. |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C18 row, `:1174`; Center is none of the three SD38 exceptions, `:2385`; D10) |

- The agent-facing description is 700 characters and the tool description 673, both under the 1024 cap (Phase 1 spec `:1422`). The tool description replaces "Put the content in `child`; to centre several components, put them in a Stack and make the Stack the child." with "The app places one component inside it, which may be a Stack that holds several.", because the tool has no `child` parameter (Phase 1 spec `:1423`; `0018-stack.md` AM-006; D12). P9 emitted both through all three providers.
- The frontend tool carries `axis` only, with no `accessibilityLabel` or `accessibilityDescription` (F7 (a); P9).
- The surface writes `axis` as its attribute and removes it when unset; a node with no props renders an empty `<line-center>` and raises nothing (P9; C8).
- Center joins the `line` catalog only. No A2UI v0.9 or v0.9.1 basic type centres, and a basic agent centres through `Row` or `Column` with `justify: "center"` and `align: "center"` on `line-stack` (P10), so the `basic` map keeps its 10 types (Phase 1 spec §6.G.2, `:1371`, `:1373`; D11).
- C18 ships its descriptor in the same PR and adds Center to the `<line-a2ui-surface>` render fixture and the surface axe test (Phase 1 spec §6.C.0, `:927`; §6.C.6, `:1231`; D16).
- These tests in `packages/line-genui/__tests__` change with an eighteenth descriptor (D16).
  - `PROP_TYPES` gains `Center: { axis: 'enum', child: 'ComponentId' }` (`catalog.test.ts:47-106`), and its doc comment adds `0020-center.md` (`:40-46`).
  - The raw catalog of every descriptor gains `Center` between `ButtonGroup` and `Chip` (`:132-133`), and the test title at `:125` says eighteen descriptors.
  - The exposure test expects `toHaveLength(18)` (`:517`, was 17) and the import test `descriptors: 18` (`:575`).
  - `LINE_COMPONENTS` gains `Center` between `ButtonGroup` and `Chip` (`catalog-emitters.test.ts:71-72`).
  - The tool-name list gains `'Center'` between `'ButtonGroup'` and `'Chip'` (`frontend-tools.test.ts:112-113`); the flat-model test gains `expect(names('Center')).toEqual(['axis'])` (`:181-198`); the accessibility test adds `Center` to its title and to the tools that carry neither parameter (`:256`, `:275`); the tool-description test adds `centerDescriptor` to the descriptors that emit their `toolDescription` and to its title (`:449-458`); the backtick guard expects `lacked(centerDescriptor)` to be `['child']` (`:439-445`), and its title says "the eight tool descriptions" in place of "seven" (`:435`).
  - `a2ui-surface.test.ts` gains a Center block after the Grid block (`:413`), with the three surface cases of Tests.
  - `cem-coverage.test.ts` and `cem-drift.test.ts` keep `line-spinner` as their made-up tag, which Center does not collide with.
- This source file in `line-genui` changes beside the descriptor and the catalog index (Bundle).
  - The JSDoc of `takesAccessibility` in `packages/line-genui/src/catalog/tools.ts:139-143` names Alert, Center, Grid, Icon, Kbd and Skeleton (`never`) and cites AM-102 beside AM-069, AM-098, AM-099 and AM-101; the function itself is unchanged, because it already returns `false` for `never` (F7 (a); D17).
- These files outside `line-genui` change.
  - `lineShowcase` in `apps/storybook/stories/agent-ui/a2ui-fixtures.ts` gains, at the end of the root's children, the node `{ id: 'centred', component: 'Center', child: 'centred-kbd' }` with its child `{ id: 'centred-kbd', component: 'Kbd', keys: 'esc' }`, after the Grid tiles (`:200-202`); its JSDoc names Center (`:56-65`), and the file header that lists the render fixture names Center (C18) (`:1-4`).
  - `'agent-ui-a2ui-surface--line-catalog'` in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` counts 40 elements (`:33`, was 38; the fixture adds one `line-center` and one `line-kbd`), the settle selector adds `line-center` (`:62`), and the file JSDoc names C18 (`:1-23`).

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/center` |
| Kind | `independent` (Phase 1 spec §4.2, `:306`; §10 SD12) |
| Registers | `line-center` |
| Reset modules | `commonReset` only (ARCH §14.7, `docs/ARCHITECTURE.md:1163`; D4) |

- The files are `src/center/center.ts`, with the class `LineCenter` and `customElements.define`, `src/center/center.types.ts` with `CenterAxis`, and `src/center/index.ts`, which exports `LineCenter` and `CenterAxis`, as `src/grid/index.ts` does; the root `src/index.ts` is unchanged.
- `package.json` gains the `./center` export after `./grid` (Phase 1 spec §4.2, `:257`; `packages/line-components/package.json:90-93`), and the Vite build gains the `center/index` entry after `grid/index` (`packages/line-components/vite.config.mjs:27`). No new dependency.
- `packages/line-components/__tests__/bundle-splitting.test.ts` gains the `EXPECTED_TAGS` row `'./center': ['line-center']` after `./grid` (`:74`). It needs no `ALLOWED_TAG_REFERENCES` row, because the component matches no other tag.
- `line-genui` gains `src/catalog/descriptors/center.ts` with `centerDescriptor`. `src/catalog/index.ts` imports it after `buttonGroupDescriptor` (`:20`), adds it to the named exports between `buttonGroupDescriptor` and `chipDescriptor` (`:103-104`), and adds it to the `descriptors` array in catalog-name order, between `buttonGroupDescriptor` and `chipDescriptor` (`:134-135`).
- Center imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`).

### Markup examples

```html
<!-- Default: centred on both axes in a box with a height -->
<line-center style="min-block-size: 16rem">
  <p>No results</p>
</line-center>

<!-- One axis -->
<line-center axis="horizontal">…</line-center>
<line-center axis="vertical" style="block-size: 4rem">…</line-center>

<!-- Several children form one centred column; a Stack spaces them -->
<line-center style="min-block-size: 16rem">
  <line-stack gap="3" align="center">
    <line-icon library="phosphor" name="tray"></line-icon>
    <p>No messages</p>
    <line-button>Refresh</line-button>
  </line-stack>
</line-center>

<!-- A named region, through an author role -->
<line-center role="region" aria-label="Empty state" style="min-block-size: 16rem">
  <p>No results</p>
</line-center>

<!-- htmx: the box loads its own content (P7) -->
<line-center hx-get="/status" hx-trigger="load" hx-swap="innerHTML" style="min-block-size: 8rem">
  <p>Loading…</p>
</line-center>
```

A `line` catalog node the surface renders as the first example, with a Text child:

```json
{ "id": "empty", "component": "Center", "child": "empty-text" }
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom, `packages/line-components/__tests__/center.test.ts` | registers `line-center` with its class; the shadow root holds only a bare `<slot>` (P8); `axis` reflects a set value, leaves no attribute at `both`, keeps an unknown value in the attribute while the property is `both`, and returns to `both` when the attribute is removed; computed `display: flex`, `flex-direction: column`, and `justify-content` and `align-items` of `safe center` with no attribute, `normal` for `justify-content` under `horizontal` and for `align-items` under `vertical` (P8); `hidden` computes `display: none`; no `role`, `aria-*` or `internals.role` written, and an author `role` left unchanged; dispatches no event of any kind (a `dispatchEvent` spy on `LineCenter.prototype` while `axis` is set and changed, as Grid's unit tier does); the C8 empty render |
| Browser | Playwright `packages/line-components/__tests__/integration/center/center.e2e.ts` on chromium, firefox and webkit, over fixture pages under `integration/center/` | in a 400 × 300 host, the P2 positions of one 100 × 40 child (150,130; 150,0; 0,130), three children of 60, 120 and 90 px (x 170, 140, 155 with y 105, 135, 165, then 0, 30, 60; x 0 under `vertical`) and the text node `Hello` (x 181.8 within 0.5 px) under each `axis`, and an unknown `axis` laid out as `both`; a 600 × 400 child in a 400 × 300 `overflow: auto` wrapper at 0,0 with a 600 × 400 scroll area, the same with the host itself scrolling, and under `dir="rtl"` its right edge on the host's right edge (P3); `axis="horizontal"` keeping the child at 150 under `dir="rtl"`, and `axis="vertical"` placing width-set children at the right edge (P6); in a 1000 × 300 `display: flex` row, a host as wide as its child and the child centred top to bottom, and with `flex: 1` the child at 450,130 (P4); in a block parent, a host as tall as its child, and with consumer `min-block-size: 100%` the child at 150,130 (P4); consumer `justify-content: flex-end` beating `:host` (P5); `<line-center hidden>` rendering nothing; a consumer `display: inline-flex` rule showing a hidden Center and the `:not([hidden])` form hiding it, as the Consumer styling note says (P5); Tab skipping the host (§10 SD99); an `ariaSnapshot()` of the author group story showing a `group` with its buttons, and a Chromium CDP assertion that a role-less Center adds no node and a labelled one is a named `generic` (P1; D19) |
| A11y | axe-core, `packages/line-components/__tests__/a11y/center.e2e.ts` | zero violations (MANIFESTO Law 3) in every story of D14 (Phase 1 spec §7.4) |
| htmx | Playwright `*.e2e.ts` through the shared harness `@websublime/line-testing/htmx` (`packages/line-testing/src/htmx.ts`), on htmx 2 and htmx 4 in chromium, firefox and webkit | `n/a`. Center is neither value-bearing, because its descriptor binding map names no value prop, nor compound, because it holds no interactive element of its own (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`; plan §2.4, `docs/plans/01-plan-core-primitives.md:172-175`). P7 ran `innerHTML` and `outerHTML` swaps on htmx 2.0.11 and 4.0.0 in three engines, and both centred the swapped content, so Center needs nothing from htmx. This confirms the Phase 1 spec's "`n/a` expected" (§6.C.4 C18 row, `:1174`; §10 SD34, `:2381`; D13) |
| Visual | Playwright `packages/line-components/__tests__/visual/center.visual.ts` on the `visual` project | every story of D14 with Linux baselines from a `visual-baselines.yml` run (Phase 1 spec §6.C.6, `:1233`; §10 SD98) |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts`; Playwright axe in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` | a `line` catalog `Center` node renders `<line-center>` with `axis` as an attribute and its `child` in the default slot; a node with no props renders an empty `<line-center>` with no attribute and raises nothing; an `accessibility.label` and `.description` set no `aria-label` or `aria-description` (P9); the node joins the surface render fixture and the surface axe test (Phase 1 spec §6.C.6, `:1231`; D16) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the CEM coverage and drift tests pass with the new descriptor, the drift test checking the `axis` attribute and the default slot (Phase 1 spec §6.G.5); `catalog.json` holds `Center` and its inline projection validates (§6.G.2; P9); the `Center` tool takes the tool description, stays at or under 1024 characters, passes the backtick guard and carries `axis` only (§6.G.3, `:1422-1423`, `:1434`); the lists and counts change as the Agent contract says (D16) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./center` register `line-center` only, and the isolation scan finds no other component's module or tag in its bundle (Phase 1 spec §7.5). `packages/line-components/__tests__/manifest-paths.test.ts` reads the packed `custom-elements.json`, as for Grid (`:398-425`): `line-center` resolves to `src/center/center.ts`; its own public field is `axis`; its events are empty; its slots are `['']`; it has no parts and no `@cssprop` (ARCH §17.2 C7; D18) |

- PRD §5.2 checklist mapping (`docs/PRD.md:534-543`; Phase 1 spec §6.C.6, `:1222`). (1) Render runs in the Unit tier. (2) Reactive props run in the Unit tier, for reflection and computed keywords, and in the Browser tier, for positions. (3) Slots run in the Browser tier, where slotted children and text are laid out as flex items. (4) Parts do not apply, because Center has none. (5) Custom properties do not apply, because Center has none; consumer CSS on the host runs in the Browser tier. (6) Events (none) run in the Unit tier, by the `dispatchEvent` spy, and in the Packaging tier, by the CEM assertion. (7) Keyboard (Tab skips the host) runs in the Browser tier (§10 SD99). (8) axe runs in the A11y tier.
- §6.C.6 obligations. Storybook docs, the changeset, the CEM JSDoc, the `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` row and the size report land as D17 says. No other component is imported (Bundle). The Agent contract is filled above. The htmx row is `n/a` with its reason. The surface fixture and surface axe rows are above (`:1231`). No update-rate measurement, because Center is not a machine row (`:1232`). The visual tier is the row above (`:1233`).
- The axe and visual tests run against the Storybook stories on port 4320, with the story list and `readyCenterStory(page, id)` in `packages/line-components/__tests__/center-stories.ts`, after `readyGridStory` in `grid-stories.ts:24-36`, which waits until every element of the tag is defined and has updated. The layout and tree tests use the fixture pages under `packages/line-components/__tests__/integration/center/`, served by the existing port-4321 `webServer` (`playwright.config.ts:23-28`).
- `integration/center/index.html` loads `integration/center/fixture.ts`, which imports the built `@websublime/line-components/center` by package name, as Grid's `integration/grid/fixture.ts` does. Center reads no token, so the page loads none and needs no `no-tokens` twin (D7). Each test mounts its markup into `<main>` inside a wrapper of a set size.

### Spec drift found

| # | Where | Finding | Kind |
|---|---|---|---|
| 1 | Phase 1 spec §6.G.3 (`:1405`, `:1434`), §6.G.4 (`:1516`), §10 SD47 (`:2394`) | these four places name the components whose surface node takes no host name and whose tool carries no accessibility parameters: Alert, Grid, Icon, Kbd, Skeleton and Stack. F7 (a), `hostNaming: never`, adds Center. That changes the APPROVED lists, as AM-098 did for Kbd (`:2559`), AM-099 for Skeleton (`:2560`) and AM-101 for Grid (`:2562`), so choosing F7 (a) needs Phase 1 spec AM-102 with trigger `decision`, adding Center to all four places and naming AM-102 in the Status line (`:3`). This draft does not write it | changes a design choice in an approved document; waits for Miguel's F7 decision |
| 2 | Phase 1 spec §6.G.3 Acceptance (`:1438`) | it names Button, Separator and Stack as the descriptors that set a tool description, while Alert, Avatar, AvatarGroup, Badge, ButtonGroup, Grid and IconButton set one too. Center would set one (D12) | not drift for this row; the list reads as examples, as `0019-grid.md` Spec drift item 8 recorded |
| 3 | `0018-stack.md:46`, `:110`; `0019-grid.md:315`, `:382` | both say consumer CSS on the host overrides any layout default. P5 shows that a consumer `display` rule also overrides `:host([hidden])`, so a hidden Stack or Grid shows again; the same holds for Center, whose docs carry the `:not([hidden])` form | evidence about approved specs; no edit proposed here |
| 4 | `0018-stack.md:36`, `0019-grid.md:305` | both send "Centring one child in a box" to `<line-center>`. F6 (a) and F5 (a) keep that contract | no drift; record only |
| 5 | PRD §4.1 `docs/PRD.md:265` | "Centering utility for horizontal, vertical, or both axes" maps one to one onto F1 (a) | no drift; record only |
| 6 | Phase 1 spec §6.C.4 C18 row (`:1174`) | the htmx cell reads "`n/a` expected [INFERENCE]". P7 confirms it | no drift; confirmation |
| 7 | `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 | it has no Center row yet; the C18 PR adds one from P11, which checked all seven libraries on 2026-11-16 (Phase 1 spec §6.C.6; D17) | an obligation, not drift |

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| F1 | Which API picks the axes, and under which names? | Miguel | resolved: option (a), `axis="both \| horizontal \| vertical"`, default `both` (Miguel, 2026-11-16) |
| F2 | Which CSS technique centres the content? | Miguel | resolved: option (a), a column flex container with `justify-content` and `align-items` (Miguel, 2026-11-16) |
| F3 | Does Center offer an inline display? | Miguel | resolved: option (a), none, with the `:not([hidden])` recipe in the docs (Miguel, 2026-11-16) |
| F4 | Does Center centre its content inside its box, or centre a capped box inside its parent? | Miguel | resolved: option (a), content centring only (Miguel, 2026-11-16) |
| F5 | How do several children lay out? | Miguel | resolved: option (a), one centred column in source order, with no gap (Miguel, 2026-11-16) |
| F6 | Which props reach agents, in which catalog, and through which slot kind? | Miguel | resolved: option (a), `axis` and `child` (`ComponentId`), in the `line` catalog only (Miguel, 2026-11-16) |
| F7 | Does the surface name a Center host, and does the Center tool carry accessibility parameters? | Miguel | resolved: option (a), `hostNaming: never` and no accessibility parameters, which needs Phase 1 spec AM-102 with trigger `decision` (Miguel, 2026-11-16) |
| F8 | What happens when the content is larger than the box? | Miguel | resolved: option (a), `safe center` (Miguel, 2026-11-16) |
| F9 | Where does the height for vertical centring come from? | Miguel | resolved: option (a), from the consumer or a stretching parent (Miguel, 2026-11-16) |
| F10 | Does Center centre lines of text? | Miguel | resolved: option (a), no (Miguel, 2026-11-16) |

**Drafter defaults** (Miguel left D1–D20 as drafted, 2026-11-16)

| # | Default | Basis |
|---|---------|-------|
| D1 | Static, with no machine, no states and no events; neither value-bearing nor compound; not form-associated | ARCH §8, `:410`; Phase 1 spec §6.C.4 C18 row, `:1174`; ARCH §17.2 C3, C9 |
| D2 | The host is the flex container; the shadow root holds only a bare `<slot>`; no parts | `0018-stack.md` Open Question 1 and `0019-grid.md` D2 (an inner wrapper puts a `generic` between a host role and its children); probes P1 F, G and P2 |
| D3 | `:host([hidden]) { display: none }`, as the last rule of the stylesheet | probe P5 (without the rule a hidden flex or grid host keeps its display; with it last, no attribute rule sets `display` over it); Button's rule (`packages/line-components/src/button/button.ts:129-131`); `0019-grid.md` D3 |
| D4 | `commonReset` is the only reset module | ARCH §14.7, `:1163` ("all Static") |
| D5 | No role, no ARIA attribute and no internals value on the host; an author `role` stays; the docs show the `group` and `region` recipes and advise against a role-less `aria-label` | R8 `:55`, `:82`; probe P1 C–G |
| D6 | No focus on the host, no key handling, no `delegatesFocus`, no `tabindex` | R8 `:82` Keyboard "None"; probe P1 (Tab skips the host) |
| D7 | No `--line-center-*` token and no read of any `line-tokens` or `line-themes` token; `axis` is a layout prop, not a C6 variant | the alignment keywords need no length (P2); ARCH §17.2 C6 applies to variants only; Stack's `orientation`, `justify` and `align` are layout props too (`0018-stack.md:63`) |
| D8 | `axis` converts an unknown value to `both` with `useDefault: true`; the stylesheet styles `both` without its attribute; nothing throws | ARCH §17.2 C8; MANIFESTO Law 9; `0018-stack.md` AM-002; probes P8 and P9 (the surface removes the attribute of an unset prop) |
| D9 | Center follows the writing direction through flexbox's logical axes and sets no `direction`, `order` or `writing-mode` | probe P6; `LineElement` already owns `direction` (`0018-stack.md` AM-001) |
| D10 | `agentExposed: true` | Phase 1 spec §6.C.4 C18 row, `:1174`; SD38 names three other components (`:2385`); a layout container adds no text and paints within the surface, so neither SD38 reason applies (`:1336`, `:1338`) |
| D11 | Catalog name `Center`, the PRD row name, in the `line` catalog only; the `basic` map keeps its 10 types | PRD `:265`; probe P10 (no basic centring type in v0.9 or v0.9.1); Phase 1 spec §6.G.2, `:1371`, `:1373` |
| D12 | The descriptor sets a tool description that differs from the agent-facing description only in naming the child | Phase 1 spec §6.G.3, `:1423` (a description that names a `ComponentId` prop needs one); `0018-stack.md` AM-006; probe P9 |
| D13 | htmx row `n/a` | Phase 1 spec §10 SD34; ARCH §17.2 C9; plan §2.4; probe P7 |
| D14 | `apps/storybook/stories/components/center.stories.ts` with `title: 'Components/Primitives Base/Center'`, the pinned meta `id: 'components-center'`, `tags: ['autodocs']`, no token import, and a `DESCRIPTION` that carries the height advice, the flex-row warning (`flex: 1` or a width), the `:not([hidden])` form for a consumer `display` rule, the `group` and `region` recipes, and the advice against a role-less `aria-label`. Each story draws an outlined box of a set height as story markup. Stories: Default (one child, `both`); Axes (`both`, `horizontal`, `vertical` side by side); Several children (three children as one column, and a Stack with a gap inside a Center); Text (a bare text node and an inline label); In a horizontal Stack (a Center beside a tall image, with and without `flex: 1`); Overflow (a child larger than a scrolling box, reachable from its start edge); Author group (`role="group"` with an `aria-label` and two buttons) | the story-title rule of the template (`COMPONENT-SPEC-TEMPLATE.md:213`); PRD §4.1 places Center under Primitives Base (`docs/PRD.md:243`, `:265`); `grid.stories.ts:50-51` |
| D15 | The Browser tier runs on fixture pages under `integration/center/` with a sized wrapper per case, and reads child offsets relative to the host, as P2 did | probe P2; Grid's Browser tier (`packages/line-components/__tests__/integration/grid/`) |
| D16 | The genui tests and the surface fixture change as the Agent contract lists; the made-up tag stays `line-spinner` | Phase 1 spec §6.C.6, `:1231`; the locators in the Agent contract; `0019-grid.md` D17 |
| D17 | The C18 PR also adds a Center row to `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 from P11, checked 2026-11-16, with `—` in the seven library cells, and Web Awesome's `wa-align-items-center`, `wa-justify-content-center` and `wa-frame` classes, Chakra UI's `Center` and `AbsoluteCenter`, Mantine's `Center` and Radix Themes' `Container` in its Notes and footnote. It writes the Storybook docs; adds a `## Center` section to `packages/line-components/README.md` after `## Grid` (`:614`), with the height advice, the flex-row warning and the `:not([hidden])` form; updates the `takesAccessibility` JSDoc in `packages/line-genui/src/catalog/tools.ts:139-143` to name Center (`never`) and cite AM-102; adds `centerDescriptor` to the export table of `packages/line-genui/README.md:39`, Center to the tools that set a tool description and to the `child` list of the parenthetical after it (`:92`), to the descriptors whose `child` the walker leaves out (`:124`), and to those that take neither accessibility parameter (`:125`, `:144`); reports the gzipped size against the < 5 KB soft target; and adds one changeset with `@websublime/line-components` at `patch` and `@websublime/line-genui` at `minor` | Phase 1 spec §6.C.6, `:1223-1227`; PROCESS §6: `@websublime/line-components` (0.2.4, `packages/line-components/package.json:3`) has shipped its phase minor, so new capability takes `patch`; `@websublime/line-genui` (0.1.0, `packages/line-genui/package.json:3`) has had no Version PR since its scaffold, and every pending `line-genui` changeset in `.changeset/` is `minor`, so its first phase minor has not shipped (`0019-grid.md` AM-002) |
| D18 | The class JSDoc says what the component is for, that it moves boxes and not text lines, that vertical centring needs a height, that in a flex row or an `auto` grid track it needs `flex: 1` or a width, and the `:not([hidden])` form; `@summary`; `@slot` for the default slot | ARCH §17.2 C7; Grid's JSDoc pattern (`packages/line-components/src/grid/grid.ts:22-45`) |
| D19 | The Browser tier proves the tree with `ariaSnapshot()` in three engines and a Chromium CDP assertion, and runs no `INTERNALS` read-back | Phase 1 spec `:1180` applies to internals roles, and Center sets none (D5); probe P1; `0019-grid.md` D20 |
| D20 | Prose and docs spell the verb "centre", as `0018-stack.md:36` and `0019-grid.md:305` do; the tag, class, catalog name and file names keep `center`, from the PRD row and the Phase 1 spec (`docs/PRD.md:265`; Phase 1 spec `:306`, `:1174`) | consistency with the approved specs; the tag and subpath are fixed by the Phase 1 spec |

Miguel decided F1–F10 on 2026-11-16, each on the option the draft recommended, and left D1–D20 as drafted. Each section below states the decision, and its option table stays as the record of what he weighed.

### F1 — Axis API

**Decision.** Miguel chose option (a) on 2026-11-16, so `axis` takes `both`, `horizontal` or `vertical`, with `both` as the default.

**Evidence.** PRD §4.1 asks for "horizontal, vertical, or both axes" (`docs/PRD.md:265`). Stack names its axis `orientation` with `horizontal` and `vertical`, and A2UI `List.direction` uses the same two words (`0018-stack.md:116`, AM-001). Chakra UI's `AbsoluteCenter` takes `axis` with `horizontal`, `vertical` and `both`, default `both` (P11). In probe P6 the flex rules centre on logical axes, so in `writing-mode: vertical-rl` `horizontal` centres top to bottom; Stack's `orientation` turns the same way. `LineElement` owns `direction`, so that name is taken (`0018-stack.md` AM-001).

| Option | What it decides | No attribute (C8) | Agent path (C1) | Consequence |
|---|---|---|---|---|
| (a) **Recommended.** `axis` enum | `axis="both \| horizontal \| vertical"`, default `both` | centres both axes (P2) | one enum with three values (P9) | The PRD words one to one, the same values as Stack and Chakra; one attribute, one rule per value. In vertical writing modes the names follow the logical axes (P6) |
| (b) Two booleans | `horizontal` and `vertical` boolean attributes; both or neither centre both axes | centres both axes | two booleans | `<line-center horizontal>` reads well. "Neither" and "both" mean the same thing, so the API has two spellings of the default, and an agent can send `horizontal: false, vertical: false` expecting no centring |
| (c) Logical names | `axis="both \| inline \| block"`, default `both` | centres both axes | one enum | Exact in every writing mode. Departs from the PRD words and from Stack's `horizontal`/`vertical`, so an agent that learned Stack has to translate |
| (d) Stack-style alignment props | `justify` and `align`, each `start \| center \| end`, default `center` | centres both axes | two enums | Center becomes Stack with other defaults; `start` and `end` duplicate Stack's job |

### F2 — CSS technique

**Decision.** Miguel chose option (a) on 2026-11-16, so the host is a column flex container that centres through `justify-content` and `align-items`.

**Evidence.** In probe P2 one child lands at 150,130 under a column flex container (a), a row flex container (b), `place-items: center` on a grid (c) and `place-content: center` on a grid (d), in three engines. They part ways with several children and text. (a) keeps three children together and centres each; (b) puts them side by side; (c) spreads them over the height (y 35, 135, 235); (d) leaves each at the start of a track as wide as the widest. `margin-inline: auto` on slotted children (e) centres only block children with a width, on one axis, and leaves text nodes, inline spans and images at the start. Stack's host is a flex container (`0018-stack.md:73`); Chakra and Mantine use a row flex container (P11).

| Option | What it decides | Several children | Text and inline content | Consequence |
|---|---|---|---|---|
| (a) **Recommended.** Column flex | `display: flex; flex-direction: column`; `justify-content` for the block axis and `align-items` for the inline axis, one reset per `axis` value | one centred column (P2) | centred, as anonymous flex items (P2) | One property per axis, the same layout model as Stack, and `safe` works on both properties (P3) |
| (b) Row flex | `display: flex`; `justify-content` for the inline axis and `align-items` for the block axis | side by side, with no gap (P2) | centred | Matches Chakra and Mantine. Several children sit in a row with no spacing, which Stack already does with `justify="center"` |
| (c) Grid items | `display: grid; place-items: center`; `justify-items` and `align-items` per axis | one per row, spread over the height (P2) | centred | One child behaves as (a); several children drift apart as the box grows |
| (d) Grid content | `display: grid; place-content: center; justify-items: center` | one centred column (P2, with `justify-items`) | centred | The same result as (a) with three properties instead of two; one-axis forms need `align-content` and `justify-content` resets |
| (e) Margins | `display: block`; `::slotted(*) { margin-inline: auto }` | each centred if it has a width (P2) | not centred (P2) | Horizontal only, so the PRD's vertical and both axes need another technique |

### F3 — Inline display

**Decision.** Miguel chose option (a) on 2026-11-16, so Center has no inline display, and the docs show the `:not([hidden])` form of a consumer `display` rule.

**Evidence.** Chakra UI and Mantine ship an `inline` option that sets `display: inline-flex` (P11). In probe P5 an `inline` attribute centres a letter in a 32 × 32 inline box inside a line of text, and keeps `hidden` working when the `[hidden]` rule comes last. A consumer `display: inline-flex` rule on the host also works, but it shows a hidden Center unless it excludes `[hidden]`. Stack and Grid have no inline display (`0018-stack.md` Props; `0019-grid.md` F9). An A2UI Text node has no child prop, so an agent cannot place a Center inside a line of text [INFERENCE: from the basic `Text` schema, which declares no `child` or `children`].

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** None | the host is always block-level; the docs show `line-center:not([hidden]) { display: inline-flex }` | The same shape as Stack and Grid; no agent-facing prop with no agent use. The consumer must remember `:not([hidden])` (P5) |
| (b) An `inline` boolean | `inline` sets `display: inline-flex` before the `[hidden]` rule; markup only, left out of the descriptor | `hidden` keeps working with no consumer care (P5); one more attribute, and the first line layout helper with an inline mode. A prop missing from the descriptor needs a C1 note |
| (c) An `inline` boolean for agents too | as (b), plus `inline` in the descriptor | Agents get a prop they cannot use in A2UI today |

### F4 — Content centring or intrinsic centring

**Decision.** Miguel chose option (a) on 2026-11-16, so Center centres its content inside its own box and does not cap its width.

**Evidence.** PRD §4.1 asks for centring on "horizontal, vertical, or both axes" (`docs/PRD.md:265`). Intrinsic centring, a box with a `max-width` and `margin-inline: auto`, centres on the horizontal axis only. Radix Themes' `Container` does that, with a `size` scale for the width (P11). In probe P2 (e) margins leave text, inline content and images at the start. `line-tokens` holds the `--line-size-*` scale a width prop could read (`0019-grid.md:559`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Content centring only | the host fills its container and centres its content inside itself | Covers all three axes of the PRD. A readable centred column needs consumer `max-inline-size` and `margin-inline: auto` on a child, which the docs show |
| (b) Both, behind a prop | (a), plus a `max-width` enum on the `--line-size-*` scale that caps the host's inline size and sets `margin-inline: auto` on it | One element for both jobs; a token-backed C6 variant and a second meaning that agents must learn |
| (c) Intrinsic centring only | the host caps its own width and centres itself, as Radix Themes' `Container` does | A page-column helper; the PRD's vertical and both axes are lost |

### F5 — Several children

**Decision.** Miguel chose option (a) on 2026-11-16, so several children form one centred column in source order with no gap, and spacing comes from a Stack inside the Center.

**Evidence.** In probe P2 three children under (a) form one column whose group and members are centred, with no gap. (b) puts them side by side. (c) spreads them over the height. `<line-stack>` already spaces several children with `gap` and centres them with `justify` and `align` (`0018-stack.md` Props). A2UI `Card` takes one child and tells agents to wrap several in a layout component (P10).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** One centred column, no gap | children stack in source order as a group, each centred on the inline axis; spacing comes from a Stack inside the Center | Several children still render sensibly, and spacing stays Stack's job. Two children touch unless the author adds a Stack or margins |
| (b) One centred row, no gap | children sit side by side, as in Chakra and Mantine | Fits a row of icons; a heading and a paragraph end up side by side |
| (c) A `gap` prop | (a) plus Stack's `gap` `0`–`5` | Spacing without a Stack; Center grows a second layout job and a C6 variant |

### F6 — Agent props, catalog and slot kind

**Decision.** Miguel chose option (a) on 2026-11-16, so the descriptor exposes `axis` and `child` (`ComponentId`), in the `line` catalog only.

**Evidence.** In probe P9 `axis` and `child` (`ComponentId`) reach the `line` catalog, the inline projection validates, and the three providers' tools carry `axis` alone. The surface renders a Center node with one child, and a Stack child carries several. A `child` list fails validation, and a `ChildList` stub renders several children with no error. Neither A2UI basic catalog has a centring type; basic `Row` and `Column` centre through `justify` and `align` (P10). Grid and Stack take `children` (`0019-grid.md` F6; `0018-stack.md` Descriptor fields), Button and A2UI `Card` take `child` (`packages/line-genui/src/catalog/descriptors/button.ts:29`, `:32`; P10).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `axis` and `child`, `line` catalog only | `axis` enum; `child` (`ComponentId`) to the default slot; no basic mapping | One clear contract, "centre one thing", that matches A2UI `Card`; several children go through a Stack (P9). The default slot is classified `ComponentId` while markup may hold several children, as on Button |
| (b) `axis` and `children`, `line` catalog only | `axis` enum; `children` (`ChildList`) to the default slot | The same shape as Grid and Stack. An agent that sends two children gets them stacked with no gap (P2, P9), which it cannot space |
| (c) `child` only | no `axis` for agents; every agent Center centres both axes | A smaller tool; agents cannot centre on one axis |

### F7 — Host naming on the agent path

**Decision.** Miguel chose option (a) on 2026-11-16, so the descriptor takes `hostNaming: never`, and the Center tool carries no accessibility parameters.

**Evidence.** The host is a `generic` with no role (R8 `:82`; P1). A host `aria-label` names that `generic` in the Chromium tree, which ARIA 1.2 prohibits, and axe does not report it (P1 C, D, E). The descriptor kinds are `always`, `never`, `listRole` and `unlessTrue` (`packages/line-genui/src/catalog/descriptor.ts:160-174`). Kbd, Skeleton and Grid took `never` through AM-098, AM-099 and AM-101 (`:2559`, `:2560`, `:2562`). P9 rendered a `never` Center with no name and a tool with no accessibility parameters.

Choosing (a) changes the APPROVED lists in Phase 1 spec §6.G.3 (`:1405`, `:1434`), §6.G.4 (`:1516`) and §10 SD47 (`:2394`), which name the components that take no host name and whose tool carries no accessibility parameters. It therefore needs a Phase 1 spec amendment AM-102 with trigger `decision`, as AM-098 (Kbd), AM-099 (Skeleton) and AM-101 (Grid) did. This draft does not write AM-102.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `never` | the surface sets no `aria-label` or `aria-description` on a Center node; the tool carries no `accessibilityLabel` or `accessibilityDescription` | Mirrors Kbd, Skeleton and Grid. Needs Phase 1 spec AM-102, trigger `decision`, adding Center to §6.G.3 `:1405`, `:1434`, §6.G.4 `:1516` and SD47 `:2394` (Spec drift found, item 1) |
| (b) `always` | the surface sets both on every Center node; the tool carries both parameters | No Phase 1 spec change. Every agent label names a `generic`, which ARIA prohibits and no check reports (P1 C) |
| (c) An agent `region` prop | a `region` boolean makes the surface set `role="region"` on the host, with a host naming kind that names only a region | Agents could build a named landmark such as an empty state (P1 G). A new surface rule and a new `hostNaming` kind, so a Phase 1 spec AM wider than AM-102; a region needs a name, so the descriptor would need a `requiredName` rule for it |

### F8 — Overflow

**Decision.** Miguel chose option (a) on 2026-11-16, so the host aligns with `safe center`, and content larger than the box starts at its start edge.

**Evidence.** In probe P3 a 600 × 400 child in a 400 × 300 Center with plain `center` starts at −100,−50, and no scroll reaches the cut-off part, in three engines. `safe center` starts it at 0,0 and the scroll area covers all of it, also under `dir="rtl"`. All three engines support `safe` on `justify-content` and `align-items` and compute it back (P3). Chakra, Mantine and Web Awesome's `wa-frame` use plain `center`; `wa-frame` also sets `overflow: hidden` (P11). WCAG 1.4.10 asks that content stay available without loss at 320 CSS px.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `safe center` | content larger than the box aligns to its start edge | Nothing is lost when the box is too small, such as on a narrow screen or at high zoom. Oversized content is no longer visually centred |
| (b) `center` | content stays centred and overflows on both sides | Symmetric overflow, as Chakra and Mantine draw it. The start side is cut off where no scroll reaches (P3) |

### F9 — Height for vertical centring

**Decision.** Miguel chose option (a) on 2026-11-16, so Center sets no height, and the consumer or a stretching parent gives it one.

**Evidence.** In probe P4 a Center in a block parent is as tall as its content, so vertical centring does nothing. A stretching parent, such as a grid cell or a flex row, gives it a height. `min-block-size: 100%` in the component fills a parent with a set height, but it overflows that parent by any sibling's height (a 50 px header overflows a 300 px parent to 350) and does nothing in a parent without a set height. `block-size: 100%` with padding overflows by the padding. A consumer `min-block-size` on `line-center` works (P4).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** None | the host sizes like a block box; the consumer or a stretching parent gives the height | No surprise overflow. Vertical centring needs one line of consumer CSS, which the docs and the agent description say |
| (b) `min-block-size: 100%` on `:host` | the host fills a parent with a set height | Works in a plain panel; overflows beside any sibling, and silently does nothing in an auto-height parent (P4) |
| (c) A `fill` boolean | `fill` sets `min-block-size: 100%`, off by default | Opt-in, so no surprise by default; one more attribute whose effect depends on the parent, and an agent prop whose result the agent cannot see |

### F10 — Lines of text

**Decision.** Miguel chose option (a) on 2026-11-16, so Center sets no `text-align`.

**Evidence.** In probe P2 a long paragraph fills the host's width, so centring has nothing to move, and its lines keep the inherited `text-align` [INFERENCE: line positions were not measured]. A short text node is centred as a whole (P2). Chakra and Mantine set no `text-align` on `Center` (P11).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** No | Center sets no `text-align`; the consumer sets it on the paragraph | Center moves boxes only, so it never changes the reading layout of text it holds |
| (b) Always | `:host { text-align: center }`, inherited by every child | Wrapped text looks centred; every descendant inherits it, forms and tables included |
| (c) A `text` boolean | `text` sets `text-align: center` | Opt-in; one more attribute that agents would need for centred paragraphs |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
