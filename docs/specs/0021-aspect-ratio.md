# Aspect Ratio

| Field | Value |
|-------|-------|
| Status | `approved` (Miguel, 2026-11-17) |
| Phase | `1` |
| Tier | `Static` (Phase 1 spec §6.C.4 C19 row, `docs/specs/01-spec-core-primitives.md:1175`; PRD §4.1, `docs/PRD.md:268`; ARCH §8, `docs/ARCHITECTURE.md:410`) |
| Tag | `line-aspect-ratio` |
| Entrypoint | `@websublime/line-components/aspect-ratio` (Phase 1 spec §4.2, `:258`, `:307`; §10 SD12, `:2359`) |
| Form-associated | `no` (Phase 1 spec §6.C.4 C19 row) |
| PRD catalogue entry | PRD §4.1, `Aspect Ratio` row (`docs/PRD.md:268`) |
| Ledger row | `01-C19` (`docs/plans/01-tasks-core-primitives.md:65`) |
| Governing sections | Phase 1 spec §4.2 (`:258`, `:307`), §6.C.0 (`:906-931`), §6.C.4 (C19 row `:1175`, notes `:1147-1153`, `:1178-1183`), §6.C.6 (`:1218-1240`), §6.G.1 (`:1316`, `:1323`, `:1326`, `:1332-1338`), §6.G.2 (`:1371`, `:1373`), §6.G.3 (`:1405`, `:1422`, `:1423`, `:1434`, `:1438`), §6.G.4 (host naming `:1512-1518`), §6.G.5 (`:1597`), §7.3, §7.4 (`:2111`), §7.5 (`:2127`), §7.6 (`:2144`), §7.8 (`:2175`), §10 SD4 (`:2351`), SD12 (`:2359`), SD34 (`:2381`), SD38 (`:2385`), SD47 (`:2394`), SD59 (`:2406`), SD98 (`:2445`), SD99 (`:2446`), §12 AM-098 (`:2559`), AM-099 (`:2560`), AM-101 (`:2562`), AM-102 (`:2563`), AM-103 (`:2564`); ARCH §3, §4, §5, §8 (`:410`), §12 (`:548`), §14.7 (`:1163`), §14.8, §17.2 (`:1566-1580`), §17.3 (`:1582`), §17.4 (`:1628`); PRD §4.1 (`:268`), §5.2 (`:517`, checklist `:536-545`), §8.3 (`:1219`), the `aspects` token family (`:209`, `:1523`); R8 `docs/research/01-research-accessibility.md:55`, `:83`; R7 `docs/research/01-research-zag-machines.md:76`; MANIFESTO Law 5 |

Miguel decided Open Questions F1–F8 on 2026-11-17, each on the option the draft recommended, and Part A and Part B state those decisions. The drafter defaults D1–D22 stand as drafted (Miguel, 2026-11-17). F8 (a), `hostNaming: never`, adds Aspect Ratio to the Phase 1 spec lists of components that take no host name, through Phase 1 spec AM-103 (`docs/specs/01-spec-core-primitives.md:2564`), which raised the row's class from `task` to `decision` (PROCESS §2). The spec passed its review gate on 2026-11-17 in four rounds. Round 1 failed and was fixed in `d8b8dcc`. Round 2 failed, was escalated, and Miguel chose a new probe, fixed in `6a8b801`. In round 3 the reviewer passed and the supervisor lens failed; it was escalated, Miguel chose a delta round 4, and the fix landed in `b884841`. Round 4 passed. Miguel approved the spec on 2026-11-17, before any code (PRD §8.3, `docs/PRD.md:1219`; Phase 1 spec §6.C.6, `:1229`). Text marked `[INFERENCE]` has no probe or source behind it yet. ARCHITECTURE names Aspect Ratio nowhere; ARCH §8 (`:410`) and §14.7 (`:1163`, "all Static") cover it through the Static tier.

---

## Probes

Throwaway probes ran on 2026-11-17 to inform F1–F8 and defaults D2, D3, D5, D6, D8, D9, D10, D13, D14, D20 and D21. Their code lived in `packages/line-components/temp/c19-probe/` and `packages/line-genui/temp/c19-probe/`, which `.gitignore` ignores through its `temp` entry (`.gitignore:4`), and their output, the downloaded catalog and the competitor packages lived in `/tmp/c19-out/`, `/tmp/c19-results/`, `/tmp/c19-basic-v09.json`, `/tmp/c19-comp/`, `/tmp/c19-size.js`, `/tmp/c19-size2.js` and a few `/tmp/c19-*` scratch files, outside the repository. All of them were deleted after the run, and nothing of them is committed. A second run the same day, after review gate round 1, placed the box in `<line-grid>` under each `align` and `justify-items` value and re-emitted the revised descriptions (commands 27–30); its code lived in `packages/line-components/temp/c19-r1/` and `packages/line-genui/temp/c19-r1/`, its output in `/tmp/c19r1-out/` and `/tmp/c19r1-results/`, and it was deleted the same way. A third run the same day, after review gate round 2, placed the box in `<line-grid>` beside a 600 px item under each `justify-items` value with the default `align` and with `align="start"`, re-read every earlier content-sized row with images after the images loaded, and re-emitted the revised descriptions (commands 31–35); its code lived in `packages/line-components/temp/c19-r2/` and `packages/line-genui/temp/c19-r2/`, its output in `/tmp/c19r2-out/` and `/tmp/c19r2-results/`, and it was deleted the same way. Every box reading in commands 1–30 came after `img.decode()` on each slotted image and two `requestAnimationFrame`s (the probes' `mount` helper); commands 32 and 33 waited for each image's `load` event, then `decode()`, then two frames.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2.1, arm64; Bun 1.4.3; Node v22.23.3 |
| Runner | Playwright 1.64.0 with its own engines, chromium 156.0.8078.4, firefox 157.0 and webkit 27.2; one config with three projects on the repo's device presets (`Desktop Chrome`, `Desktop Firefox`, `Desktop Safari`, as `playwright.config.ts:31-33`), one worker, a 1600 × 1200 viewport. Pages were served from `http://probe.local` through `route.fulfill`, at the page font `16px/1.5 sans-serif`, with `packages/line-tokens/src/aspects.css`, `sizing.css` and `layouts.css` inlined unless a row says "no tokens" |
| Probe component | `line-probe-aspect-ratio`, a `LineElement` subclass (`@websublime/line-core` dist, Lit 3.3.3) with `commonReset`, bundled with `bun build`. Its final form is the recommended design and the stylesheet under CSS custom properties: the host as a one-cell grid container over a bare `<slot>`, `aspect-ratio: var(--line-aspect-ratio-ratio)` and `min-block-size: 0` on `:host`, `ratio` (`square`, `landscape`, `portrait`, `widescreen`, `ultrawide`, `golden`; an unknown value behaves as `square`) whose rules set `--line-aspect-ratio-ratio` to `var(--line-aspect-<name>, <literal>)`, slotted children stacked in the cell with `place-self: stretch` and `max-inline-size` and `max-block-size` of `100%`, `object-fit: cover` on a slotted `img` or `video`, and `:host([hidden]) { display: none }` as the last rule. It reached that form in four steps, recorded in the command table: first `overflow: hidden` and `inline-size` and `block-size` of `100%` on slotted children, then `place-self: stretch`, then no `overflow` rule and the `max-*` sizes, then `min-block-size: 0`, then the literal fallbacks |
| Second probe component | `line-probe-ar-style`, a `LineElement` subclass that renders `<style>:host { aspect-ratio: ${r}; }</style><slot></slot>` from a reflected `r` property, for the free-ratio mechanism of F1 (b) |
| Probe hosts | `defineVariant(tag, css)`, a plain `HTMLElement` with an open shadow root holding one `<style>` and a bare `<slot>`, for the alternative techniques of F2, F3 and F6 (the stylesheets are listed in P2 and P3) |
| Children | "img" is an 80 × 80 SVG `<img>`; "portrait img" a 60 × 80 one; "img 600 × 800" the 80 × 80 one with the HTML attributes `width="600" height="800"`; "video" a `<video>` with no source (300 × 150 by default); "video 640 × 360" one with `width` and `height` attributes; "iframe" an `<iframe srcdoc>` with its default 2 px inset border, "iframe0" the same with `frameborder="0"`; "tall" a `<div>` with `height: 600px`; "long" one `<p>` of 48 words; "longer" one `<p>` of 150 words; "text" the text node `Hello`; "caption" an `<img>` and a `<div style="align-self: end">Caption</div>`; "sized" an `<img>` with inline `width: 50px; height: 50px` |
| Built components | `packages/line-components/dist/` `stack`, `grid`, `skeleton`, `avatar`, `center` and `kbd`, imported into the probe bundle |
| htmx | htmx 2.0.11 and 4.0.0 from `node_modules/.bun`, loaded as page scripts, with `hx-get` swaps answered by `page.route` |
| axe | `@axe-core/playwright` 4.14.0 with axe-core 4.14.0, once with the §7.4 tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and once with every rule |
| Chromium accessibility tree | a CDP session, `Accessibility.getFullAXTree`, walked from each case's wrapper `<div>` through `DOM.querySelector` and `DOM.describeNode`, listing the role and name of every node that is not ignored |
| Other engines | Playwright's `ariaSnapshot()`, which Playwright computes itself from the DOM |
| Unit tier | happy-dom 20.14.6 through `bun-test-preload.ts`, with Lit, zod 3.25.76, Ajv 8.20.0 and `ajv-formats` 3.0.1, `@a2ui/web_core` 0.14.0, and the `line-genui` catalog, tools and surface fixture from `src/` and `__tests__/` |
| Surface in a browser | the built `packages/line-genui/dist/` catalog and `a2ui` modules, bundled with `bun build --splitting` together with a stub `AspectRatio` descriptor whose `load()` imports the probe component |
| A2UI catalogs | `a2ui-project/a2ui@cbaa5ee62c737b50d0695c1e5794d0f648b61dca` `specification/v0_9/catalogs/basic/catalog.json`, fetched (SHA-256 `8cc94d0a…22e13e`), the commit `0020-center.md` used, and the vendored v0.9.1 copy `packages/line-genui/__tests__/fixtures/a2ui-v0_9_1/basic_catalog.json` |
| Competitors | the seven libraries of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 (`:30`; the `Radix` column is Radix Primitives, `:21`), each through `npm view` and `npm pack` on 2026-11-17: `@awesome.me/webawesome` 3.14.0, `@spectrum-web-components/bundle` 1.12.6, `@lion/ui` 0.27.0, `@fluentui/web-components` 3.2.1, `radix-ui` 1.8.1 with `@radix-ui/react-aspect-ratio` 1.2.0, `bits-ui` 2.21.0 and `@ark-ui/react` 5.40.0; and three libraries outside the table, `@radix-ui/themes` 3.3.0, `@chakra-ui/react` 3.38.0 and `@mantine/core` 9.8.1 |
| Size | esbuild 0.28.2 and `gzip -9 -n` |

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `bun build ar-probe.ts --outfile bundle.js --target browser --format esm` in `packages/line-components/temp/c19-probe/` | 0 | one 68.1 KB module with both probe components, `defineVariant`, the built `stack` and `grid`, `line-core` and Lit |
| 2 | `node_modules/.bin/playwright test -c packages/line-components/temp/c19-probe/playwright.config.ts layout.probe` | 0 | 3 passed; P2 with the first candidate (`overflow: hidden`, slotted `inline-size` and `block-size` of `100%`) |
| 3 | the same config with `forms.probe` | 0 | 6 passed; P3 with and without the `aspects` tokens |
| 4 | the same config with `context.probe` | 0 | 6 passed; P4. Its focus-ring case put an `<a href>` in the box, and WebKit on macOS skips links on Tab, so the WebKit row read no focus; command 5 reran it |
| 5 | the same config with `context.probe -g focus`, the link replaced by a `<button>` and Tab sent as `Alt+Tab` in WebKit on macOS, as `packages/line-components/__tests__/integration/center/center.e2e.ts:85` does | 0 | 3 passed; the focus-ring rows of P5 |
| 6 | command 1 again after slotted children moved to `place-self: stretch`, then `context.probe layout.probe` | 0 | 9 passed |
| 7 | the same config with `a11y.probe` | 0 | 3 passed; P1 |
| 8 | the same config with `htmx.probe` | 0 | 6 passed; P7 |
| 9 | `bun test ./packages/line-components/temp/c19-probe/happy.test.ts`, then `happy2.test.ts`, which puts `aspects.css` into a document `<style>` | 0, 0 | 1 pass each; with no literal fallback, computed `aspect-ratio` and `--line-aspect-ratio-ratio` were empty, also with `aspects.css` in the document (P8) |
| 10 | `layout.probe` after adding the grid "yield" variants and the portrait, img 600 × 800, iframe0, video 640 × 360, caption and consumer `object-fit` cases | 0 | 3 passed; `place-self: stretch` alone left the img 600 × 800 at 600 × 800 (P2) |
| 11 | command 1 again with no `overflow` rule and slotted `max-inline-size` and `max-block-size` of `100%`, then every probe | 0 | 24 passed; in chromium the box measured 400 × 400 in a vertical `<line-stack>` and 142.22 × 80 under `align="center"`, against 400 × 225 and 80 × 45 in firefox and webkit (P4) |
| 12 | command 1 again with `min-block-size: 0` on `:host`, then `context.probe layout.probe` | 0 | 9 passed; chromium matched firefox and webkit |
| 13 | the same config with `extra.probe` | 0 | 3 passed; the "longer" rows of P5 |
| 14 | command 1 again importing the built `skeleton`, `avatar`, `center` and `kbd`, then `children.probe`, run twice, the second time reading Skeleton's `item` part | 0, 0 | an 86.18 KB module; 3 passed each time; P4 line children |
| 15 | `bun test ./packages/line-genui/temp/c19-probe/agent.test.ts` | 0 | 1 pass; P9 with the first wording of the descriptions (834 and 809 characters) |
| 16 | `curl -sL` of the v0.9 basic catalog at `cbaa5ee`, `shasum -a 256`, `jq '.components \| keys'`, `diff` of `jq -S '.components'` against the vendored v0.9.1 file, `grep -n -i -E 'aspect\|ratio'` over both, `jq '.components.Image'` and `jq '.components.Video'` | 0 | P10 |
| 17 | `npm view <package> version` for the ten packages of Setup and for `@radix-ui/react-aspect-ratio`, `@spectrum-web-components/aspect-ratio`, `@fluentui/web-components-aspect-ratio`, `@ark-ui/aspect-ratio` and `@zag-js/aspect-ratio`; then `npm pack <package>@<version>` and `tar xzf` of the ten and `@radix-ui/react-aspect-ratio` 1.2.0 into `/tmp/c19-comp`; `jq`, `ls`, `grep` and `find -iname '*aspect*'` over each package | 0 (four `npm view` calls answered `E404`) | P11 |
| 18 | `node_modules/.bin/esbuild size.ts --bundle --minify --format=esm --target=es2022 --external:lit '--external:@websublime/*'`, then `gzip -9 -n`, for `size.ts` (the recommended design without the second probe component, `defineVariant` and the built imports), before and after the literal fallbacks | 0, 0 | P12 |
| 19 | command 1 again with the literal fallbacks, then `forms.probe` | 0 | an 86.22 KB module; 6 passed; the no-token rows of P3 with fallbacks |
| 20 | every probe on the final component (`playwright test -c …/playwright.config.ts`), then `happy.test.ts`, `happy2.test.ts` and `agent.test.ts` | 0 | 30 passed; 1 pass each; the tables below come from this run unless a row names a later command |
| 21 | `node v.mjs`, which launched each engine and printed `browser.version()` | 0 | the engine versions of Setup |
| 22 | `bun build surface-entry.ts --outdir out --target browser --format esm --splitting` in `packages/line-genui/temp/c19-probe/`, first over `src/` | 1, then 0 | the first run failed on `Could not resolve: "./surface.css?inline"` (`packages/line-genui/src/a2ui/surface.ts:17`), a Vite-only import; the second run imported the built `dist/` catalog and `a2ui` modules and passed |
| 23 | the line-components config with `surface.probe` | 0 | 3 passed; the real-surface row of P4 |
| 24 | `context.probe` four more times, after adding an inline stand-in for the surface host, a horizontal Stack with `justify="stretch"` at its default `align`, the same with a 600 px sibling and with `align="start"`, and vertical Stacks with `align` `start` and `end` | 0 ×4 | 6 passed each time; those rows of P4 |
| 25 | `agent.test.ts` again with the descriptions of Descriptor fields | 0 | 1 pass; 949 and 924 characters (P9) |
| 26 | `rm -rf packages/line-components/temp packages/line-genui/temp /tmp/c19-out /tmp/c19-results /tmp/c19-basic-v09.json /tmp/c19-comp /tmp/c19-size.js /tmp/c19-size2.js /tmp/c19-cmp.mjs /tmp/c19-ctx.txt /tmp/c19-desc.txt /tmp/c19-final-*.txt`; `git status --short` | 0 | deleted; the tree holds only this spec |
| 27 | `bun build ar.ts --outfile bundle.js --target browser --format esm` in `packages/line-components/temp/c19-r1/`, the final component with Grid's `variantConverter` and the built `grid` | 0 | one 64.36 KB module |
| 28 | `node_modules/.bin/playwright test -c packages/line-components/temp/c19-r1/playwright.config.ts` (`grid.probe.ts`) | 0 | 3 passed; the `<line-grid>` alignment rows of P4 |
| 29 | `bun test ./packages/line-genui/temp/c19-r1/emit.test.ts`, a stub `AspectRatio` descriptor with the descriptions of Descriptor fields through `lineCatalogDocument`, `inlineCatalog` against `client_capabilities.json#/$defs/Catalog` (Ajv 2020) and `frontendTools` for the three providers | 0 | 1 pass; 942 and 917 characters; the catalog keeps the agent-facing description and the inline projection validates; every tool takes the tool description and carries `ratio` only; the tool description puts only `ratio` and its six values in backticks |
| 30 | `rm -rf packages/line-components/temp packages/line-genui/temp /tmp/c19r1-out /tmp/c19r1-results /tmp/c19r1-desc.txt`; `git status --short` | 0 | deleted; the tree holds only this spec's edit |
| 31 | `bun build ar.ts --outfile bundle.js --target browser --format esm` in `packages/line-components/temp/c19-r2/`, the final component with the built `grid`, `stack`, `center` and `kbd` | 0 | one 75.51 KB module |
| 32 | `node_modules/.bin/playwright test -c packages/line-components/temp/c19-r2/playwright.config.ts grid2.probe`, each case read once right after mount and once after every slotted image's `load`, `decode()` and two animation frames | 0 | 3 passed; the Grid placement table and the re-read rows of P4 |
| 33 | the same config with `p2.probe`, the P2 (b) and (y) hosts with an img, a portrait img, a caption and a consumer `object-fit: contain`, read after the same wait | 0 | 3 passed; every reading equal to P2 |
| 34 | `bun test ./packages/line-genui/temp/c19-r2/emit.test.ts`, the descriptions of Descriptor fields through `lineCatalogDocument`, `inlineCatalog` (Ajv 2020) and `frontendTools` for the three providers, with the backtick guard's rule applied to each tool | 0 | 1 pass; 958 and 933 characters; the catalog keeps the agent-facing description; the inline projection validates; every tool takes the tool description and carries `ratio` only; no backticked name outside `ratio` and its six values |
| 35 | `rm -rf packages/line-components/temp packages/line-genui/temp /tmp/c19r2-out /tmp/c19r2-results /tmp/c19r2-desc.txt`; `git status --short` | 0 | deleted; the tree holds only this spec's edit |

Every result below was the same in chromium, firefox and webkit unless a row says otherwise. Sizes are CSS pixels, width × height; positions are `x,y` of a child's top-left corner relative to the host's. The host sits in a 400 px wide block wrapper and takes `ratio="widescreen"` unless a row says otherwise. Firefox draws the text node one pixel shorter (17 px against 18 px), so its text rows read 0.5 px lower, and it rounds some heights 0.01 px up (111.12 against 111.11); the tables give the chromium and webkit value.

### P1 — Accessibility tree, axe and Tab

Each case sat in its own `<div id="case">`. "img" here is an `<img alt="Mountain at dawn">`.

| Case | Chromium tree under the wrapper (CDP) | `ariaSnapshot()`, three engines | axe 4.14.0, §7.4 tags | axe 4.14.0, all rules |
|---|---|---|---|---|
| A. img child | `image "Mountain at dawn"`; no node for the host | `- img "Mountain at dawn"` | none | none |
| B. empty | nothing | empty | none | none |
| C. A with `aria-label="Cover"` | `generic "Cover"` holding the image | `- img "Mountain at dawn"` | none | none |
| D. B with `aria-label="Cover"` | `generic "Cover"` | empty | none | none |
| E. `role="img" aria-label="Sales chart"` over an `<img alt="">` | `image "Sales chart"`, with no node for the inner img | `- img "Sales chart"` | none | none |
| F. `role="group" aria-label="Gallery item"`, an img and a `<p>Caption</p>` | `group "Gallery item"` holding the image and a `paragraph` | `- group "Gallery item":` with the img and `- paragraph: Caption` | none | none |
| G. `<iframe title="Product video" srcdoc>` | `Iframe "Product video"` | `- iframe` | none | `landmark-one-main`, `page-has-heading-one`, `region` |
| H. `<video controls aria-label="Intro">` with no source | `Video "Unable to play media."` holding the media controls (`button "play"`, `button "mute"`, `button "enter full screen"`, `button "show more media controls"`, `slider "video time scrubber"`) | empty | none | none |
| I. `<img>` with no `alt` | `image ""` | `- img` | `image-alt` | `image-alt` |

| Check | Result |
|---|---|
| host attributes after render | only the `ratio` the markup set; no `role`, no `tabindex`, no `aria-*`; `tabIndex` reads `-1` |
| Tab from a button before the box, with an img inside, to a button after it | lands on the button after it |
| the same with a `<button>` inside the box | the inner button, then the button after the box |

- A role-less Aspect Ratio adds no node of its own, and its children read in DOM order (A, F).
- A host `aria-label` names a `generic` in the Chromium tree (C, D). ARIA 1.2 prohibits that name (R8 `:55`), and axe does not report it, through the custom-element exemption of `aria-prohibited-attr` that `0018-stack.md:169` traces.
- An author role that allows a name works on the host with no node in between (E, F). Under `role="img"` the host replaces its content in the tree, so a decorative inner image needs `alt=""` (E).
- The G violations of the all-rules run are page-level best-practice rules, not tied to the host [INFERENCE: axe reports them for the frame's own document, which has no `main` landmark and no `h1`]. The I violation is the author's missing `alt`, which the box does not change.
- The host takes no focus, and focus moves through slotted controls in source order.

### P2 — Techniques and child placement

The probe hosts used ratio `16 / 9` as a literal. (a) is the recommended design, the probe component. The alternatives are:

- (a′) a one-cell grid with slotted `inline-size: 100%; block-size: 100%` in place of `place-self: stretch` and the `max-*` sizes;
- (a″) a one-cell grid with `place-self: stretch` only;
- (y) a grid "that yields", `grid-template: auto / minmax(0, 1fr)`, with `place-self: stretch`;
- (b) a block host, `:host { display: block; aspect-ratio: 16 / 9 }`, children in flow, also with `min-block-size: 0` (b0) and `overflow: hidden` (bh);
- (c) the padding-ratio fallback, `:host { display: block; position: relative }`, `:host::before { content: ""; display: block; padding-block-end: calc(100% / (16 / 9)) }`, slotted `position: absolute; inset: 0; inline-size: 100%; block-size: 100%`;
- (d) `aspect-ratio` on a block host with the same absolutely positioned children.

| Case | (a) | (a′) | (a″) | (y) | (b) | (b0), (bh) | (c) | (d) |
|---|---|---|---|---|---|---|---|---|
| empty | 400 × 225 | 400 × 225 | 400 × 225 | 400 × 225 | 400 × 225 | 400 × 225 | 400 × 225 | 400 × 225 |
| img 80 × 80 | box 400 × 225; img 400 × 225 | the same | the same | chromium box and img 400 × 400; firefox, webkit 400 × 225 | img 80 × 80 at 0,0 | img 80 × 80 | img 400 × 225 | img 400 × 225 |
| portrait img 60 × 80 | img 400 × 225 | 400 × 225 | 400 × 225 | chromium box 400 × 533.33; firefox, webkit 400 × 225 | img 60 × 80 | img 60 × 80 | 400 × 225 | 400 × 225 |
| img 600 × 800 | box 400 × 225; img 400 × 225 | img 400 × 225 | img 600 × 800, past the box | box 400 × 800 | box 400 × 807 (firefox 807.5, webkit 806.67) | box 400 × 225; img 600 × 800 | img 400 × 225 | img 400 × 225 |
| video | 400 × 225 | 400 × 225 | 400 × 225 | 400 × 225 | 300 × 150 | 300 × 150 | 400 × 225 | 400 × 225 |
| video 640 × 360 | 400 × 225 | 400 × 225 | 640 × 360 | box 400 × 360 | box 400 × 367 (firefox 367.5, webkit 366.67) | 640 × 360 | 400 × 225 | 400 × 225 |
| iframe (2 px border) | 400 × 225 | 404 × 229 | 400 × 225 | 400 × 225 | 304 × 154 | 304 × 154 | 404 × 229 | 404 × 229 |
| iframe0 | 400 × 225 | 400 × 225 | 400 × 225 | 400 × 225 | 300 × 150 | 300 × 150 | 400 × 225 | 400 × 225 |
| tall div, 600 px | box 400 × 225; div 400 × 225 | box 400 × 225; div 400 × 600 | div 400 × 600 | box 400 × 600 in chromium and firefox, 400 × 225 in webkit | box 400 × 600 | box 400 × 225; div 400 × 600 | div 400 × 600 | div 400 × 600 |
| text node `Hello` | at 0,3 | at 0,3 | at 0,3 | at 0,3 | at 0,3 | at 0,3 | box 400 × 249; text at 0,228 | at 0,3 |
| img and a bare text node `Caption` | img 400 × 201; text at 0,204 | — | — | — | — | — | — | — |
| caption | img 400 × 225; caption 400 × 24 at 0,201 | caption 400 × 225 at 0,0 | caption at 0,201 | box 400 × 400 in chromium | caption at 0,87 (firefox 87.5, webkit 86.67) | caption at 0,87 (the same) | caption 400 × 225 at 0,0 | caption 400 × 225 at 0,0 |
| sized img 50 × 50 | 50 × 50 at 0,0 | 50 × 50 | 50 × 50 | 50 × 50 | 50 × 50 | 50 × 50 | 50 × 50 | 50 × 50 |
| computed `aspect-ratio` | `16 / 9` | `16 / 9` | `16 / 9` | `16 / 9` | `16 / 9` | `16 / 9` | `auto` | `16 / 9` |

- (a) keeps the box at the ratio for every child and fills it with every child that sets no size of its own: images of any natural ratio, an image or video whose HTML `width` and `height` attributes set a size, a bordered iframe, and a tall block (F2 (a)).
- (a′) also fills the box, but slotted `inline-size: 100%` adds an iframe's default border to the width (404 × 229), and a child cannot align itself with `align-self`, because its height is fixed at `100%` (caption at 0,0).
- (a″) leaves a replaced element with size attributes at that size, because `stretch` changes only `auto` sizes, so the img 600 × 800 and the video 640 × 360 overflow the box. The `max-*` sizes of (a) clamp them.
- (y) is not interoperable. Chromium grows the box to an image's own ratio (400 × 400, 400 × 533.33), and webkit keeps a tall block inside 400 × 225 where chromium and firefox grow to 600.
- (b) keeps children at their own size, so media need consumer sizing. It grows the box past the ratio when a child is taller (600, 807, 367), the "yield" of F3 (c); (b0) and (bh) hold the ratio, with the content overflowing or clipped.
- (c) and (d) fill the box with absolutely positioned children, as Radix, Bits and Chakra do (P11), and add a bordered iframe's border (404 × 229). (c) also puts a bare text node below its padding box and grows the box to 249, and computes no `aspect-ratio`.
- Under (a), a bare text node next to an element takes an implicit second grid row, because only elements match `::slotted(*)` and take `grid-area: 1 / 1`. The img shrinks to 400 × 201 and the text sits below it (D21). A text node alone sits at the top-left of the box.
- A child's own size wins over the slotted rules, so an inline `50 × 50` stays 50 × 50, at the start corner (P6 for RTL). A consumer `object-fit: contain` on the img wins over the slotted `cover` (computed `contain`).
- A child's `align-self: end` puts a caption at the bottom of an image under (a) (0,201, its height measured, 24 px at this font), the overlay of F2 (a).

### P3 — Ratio values, tokens and the mechanisms for free ratios

**Values through a custom property.** A probe host with `:host { display: block; aspect-ratio: var(--r) }` took each value as an inline `--r`; `CSS.supports('aspect-ratio', value)` ran beside it.

| Value | `CSS.supports` | Empty host | Computed `aspect-ratio` |
|---|---|---|---|
| `16/9`, `16 / 9`, ` 16/9 `, `16/ 9`, `16 /9` | true | 400 × 225 | `16 / 9` |
| `1.777` | true | 400 × 225.09 (firefox 225.1) | `1.777 / 1` |
| `1.7777777778`, `calc(16 / 9)` | true | 400 × 225 (webkit 224.98 for the first) | `1.77778 / 1` (webkit `1.777778 / 1`) |
| `1` | true | 400 × 400 | `1 / 1` |
| `.5` | true | 400 × 800 | `0.5 / 1` |
| `1e1` | true | 400 × 40 | `10 / 1` |
| `1.618 / 1` | true | 400 × 247.22 | `1.618 / 1` |
| `9/16` | true | 400 × 711.11 (firefox 711.12) | `9 / 16` |
| `auto 16 / 9`, `16 / 9 auto` | true | 400 × 225 | `auto 16 / 9` |
| `0`, `0 / 1` | true | 400 × 0 | `0 / 1` |
| `16 / 0`, `0 / 0` | true | 400 × 0 | `16 / 0`, `0 / 0` |
| `-1`, `-16 / 9`, `abc`, `16:9`, `16px / 9px`, `16 / 9 / 2`, empty | false | 400 × 0 | `auto` |

- CSS takes a ratio with or without spaces around the slash, a decimal, a lone number and `calc()`. It rejects a colon, a negative number, units and text, and an invalid value through a custom property computes `auto`, so an empty box has no height (F1).
- CSS accepts the degenerate `0` and `16 / 0` and draws an empty box with no height, so a free-ratio parser has to reject zero on either side as well as what CSS rejects [INFERENCE: from the 400 × 0 rows].

**The six token names.** The probe component took each `ratio` value, with the `aspects` tokens loaded.

| `ratio` | Box | Computed `aspect-ratio` |
|---|---|---|
| `square`, no attribute, `bogus`, `16/9`, empty | 400 × 400 | `1 / 1` |
| `landscape` | 400 × 300 | `4 / 3` |
| `portrait` | 400 × 533.33 | `3 / 4` |
| `widescreen` | 400 × 225 | `16 / 9` |
| `ultrawide` | 400 × 111.11 (firefox 111.12) | `18 / 5` |
| `golden` | 400 × 247.22 | `1.618 / 1` |

| Without the `aspects` tokens | Result |
|---|---|
| the component with no literal fallback (command 3), every `ratio`, empty | 400 × 0, `auto` |
| the same with an img child | 400 × 400, `auto`; the img's own ratio sets the box |
| a host with `aspect-ratio: var(--line-aspect-widescreen)` | 400 × 0, `auto` |
| a host with `aspect-ratio: var(--line-aspect-widescreen, 16 / 9)` | 400 × 225, `16 / 9` |
| the component with literal fallbacks (command 19), every `ratio` | the six rows of the table above, unchanged |

**Consumer overrides of the final component, with tokens.**

| Case | Box |
|---|---|
| page rule `line-probe-aspect-ratio.c { --line-aspect-ratio-ratio: 21 / 9 }` on a `widescreen` host in a 420 px wrapper | 420 × 180 |
| inline `style="--line-aspect-ratio-ratio: 9 / 16"` | 400 × 711.11 (firefox 711.12) |
| inline `style="--line-aspect-ratio-ratio: var(--line-aspect-golden)"` | 400 × 247.22 |
| inline `style="--line-aspect-ratio-ratio: abc"` | 400 × 0, `auto` |
| inline `style="aspect-ratio: 2"` on a `widescreen` host | 400 × 200 |

**Free-ratio mechanisms (F1 (b), (c)).**

| Mechanism | Result |
|---|---|
| typed `attr()`, `aspect-ratio: attr(data-r type(<ratio>), 1)` | `CSS.supports` false in chromium and firefox, true in webkit; the box measured 400 × 0, `auto`, for `16/9`, `16 / 9`, `1.5`, `abc` and `0` in all three engines [INFERENCE: webkit's cause not investigated] |
| a Lit binding inside a shadow `<style>` (`line-probe-ar-style`) | `r="16 / 9"` gave 400 × 225, `r="1.5"` 400 × 266.66 (firefox 266.67), `r="abc"` 400 × 0; the binding wrote its text in all three engines and in happy-dom |
| the same with `r="1; background-color: rgb(255, 0, 0)"` | computed `background-color` `rgb(255, 0, 0)` in all three engines, so a raw value injects CSS |
| an inline custom property on the host | the inline rows of the consumer table above; the component would have to write the host `style` attribute |

- A free ratio cannot reach CSS without JavaScript in all three engines, because typed `attr()` does not work in any of them (F1).
- A free ratio through a `<style>` binding works, but only behind a parser that lets through nothing but numbers, because the raw value injects CSS (F1 (b)).

### P4 — Size from the parent

One 80 × 80 img child unless a row says otherwise. "Box" is the host's position relative to the parent and its size.

| Parent | Box |
|---|---|
| a 400 px block | 0,0, 400 × 225 |
| a 400 px block, inside an inline element with no `display` rule (`<x-surface>`) | 0,0, 400 × 225 |
| the real `<line-a2ui-surface>` (computed `display: inline`) in a 400 px block, rendering `AspectRatio` → `Center` → `Kbd` (command 23) | 400 × 225; the Center 400 × 225 at 0,0; the Kbd at 170.66,97.5 (firefox 170.67), 58.67 × 30 |
| vertical `<line-stack>`, 400 px, default `align` (`stretch`) | 0,0, 400 × 225; also with a portrait img, and with a tall div |
| vertical `<line-stack>`, `align="start"`, `"center"`, `"end"` | 80 × 45 at 0,0, 160,0 and 320,0 |
| vertical `<line-stack>`, `align="center"`, empty box | 0 × 0 |
| a plain `display: flex; flex-direction: column` block, 400 px | 0,0, 400 × 225 |
| a vertical `<line-stack>` at its default `align` and with `align="center"`, before `min-block-size: 0` on `:host` (command 11) | chromium 400 × 400 and 142.22 × 80; firefox and webkit 400 × 225 and 80 × 45 |
| horizontal `<line-stack>`, 1000 px, default `align` and `justify`, with a 200 × 300 sibling | 0,0, 80 × 300 |
| the same, empty box | 0 × 300 |
| the same with `align="start"` | 0,0, 80 × 45 |
| the same with `justify="stretch"`, default `align` | 0,0, 792 × 445.5 |
| the same with `justify="stretch"` and a 200 × 600 sibling | 0,0, 792 × 600 |
| the same with `justify="stretch"`, `align="start"`, and a 300 or a 600 px sibling | 0,0, 792 × 445.5 |
| the same, default `align` and `justify`, `flex: 1` on the host | 0,0, 792 × 445.5 |
| the same, default `align` and `justify`, `inline-size: 400px` on the host | 0,0, 400 × 300 |
| `<line-grid columns="3">`, 900 px, default `align` (`stretch`), the other items one line of text | 0,0, 294.66 × 165.73 (firefox 294.67 × 165.75) |
| the same with a 600 px tall `<div>` as the next item in the row (command 28) | 0,0, 294.66 × 600 (firefox 294.67 × 600); the img 294.66 × 600 |
| the same with `align="start"`, `"center"` and `"end"` (command 28) | 294.66 × 165.73 (firefox 294.67 × 165.75) at y 0, 217.13 (firefox 217.12) and 434.27 (firefox 434.25) |
| `<line-grid columns="3">`, 900 px, `justify-items="start"`, `"center"` and `"end"` (command 28) | 80 × 45 at x 0, 107.33 and 214.66 (firefox 214.67); the img 80 × 45 |
| the same under `justify-items="center"`, empty box (command 28) | 42.66 × 24 at 126,0 in chromium and webkit; 0 × 24 at 147.33,0 in firefox |
| the same under `justify-items="center"`, `inline-size: 200px` on the box (command 28) | 200 × 112.5 at 47.33,0 |
| a plain `display: grid; grid-template-columns: repeat(3, 1fr)` 900 px block (command 28) | 300 × 168.75; with `justify-items: center` or `place-items: center`, 80 × 45 at 110,0, also after the load wait of command 32 |
| a 1000 px `display: flex` row with a 200 × 300 sibling | 0,0, 80 × 300 |
| the `auto` track of a 1000 px `grid-template-columns: auto 1fr` grid | 80 × 45 in all three engines (command 32). Command 4 had read 45 × 25.31 in webkit; command 32 read 42.66 × 23.98 in chromium and webkit and 0 × 0 in firefox right after mount, so that reading came before the image loaded [INFERENCE: `decode()` on a data-URL SVG resolved before layout in that run] |
| a 400 px block, `inline-size: 200px` on the host | 200 × 112.5 |
| a 400 px block, `block-size: 90px` | 160 × 90 |
| a 400 px block, `inline-size: 200px; block-size: 90px` | 200 × 90 |
| a 400 px block, `max-inline-size: 200px` | 200 × 112.5 |
| a 400 px block, `max-block-size: 90px` | 160 × 90 |
| inline in a line of text, consumer `display: inline-grid; inline-size: 160px` | 160 × 90 at 13.34,0 (firefox 13.35) |

**Grid placement beside a taller item** (command 32). A `<line-grid columns="3">`, 900 px, held the box, a `height: 600px` `<div>` and a one-line `<div>` in one row. The box held an 80 × 80 img, a `<line-center>` holding a `<line-kbd keys="mod+k">`, or nothing. Every reading came after the load wait; right after mount, every box in this table read 0 × 0 in all three engines. C/W is chromium and webkit, F firefox. Positions are relative to the Grid.

| `justify-items`, `align` | img | Center holding a Kbd | empty |
|---|---|---|---|
| `start`, default (`stretch`) | C/W 1066.66 × 600 at 0,0; F 80 × 600 | C/W 1066.66 × 600 at 0,0, the Kbd centred at 503.98,285 in it; F 58.67 × 600 | C/W 1066.66 × 600; F 0 × 600 |
| `center`, default | C/W 1066.66 × 600 at −386,0; F 80 × 600 at 107.33,0 | C/W 1066.66 × 600 at −386,0; F 58.67 × 600 at 118,0 | C/W 1066.66 × 600 at −386,0; F 0 × 600 at 147.33,0 |
| `end`, default | C/W 1066.66 × 600 at −772,0; F 80 × 600 at 214.67,0 | C/W 1066.66 × 600 at −772,0; F 58.67 × 600 at 236,0 | C/W 1066.66 × 600 at −772,0; F 0 × 600 at 294.67,0 |
| `start`, `start` | 80 × 45 at 0,0 | 58.67 × 33 at 0,0; the Kbd 58.67 × 30 at 0,1.5 | 0 × 0 |
| `center`, `start` | 80 × 45 at 107.33,0 | 58.67 × 33 at 117.98,0 (F 118) | 0 × 0 at 147.33,0 |
| `end`, `start` | 80 × 45 at 214.66,0 (F 214.67) | 58.67 × 33 at 235.98,0 (F 236) | 0 × 0 at 294.66,0 (F 294.67) |
| `center`, default, no 600 px item (one-line items only) | 80 × 45 at 107.33,0 | 58.66 × 33 at 118,0 (F 58.67) | C/W 42.66 × 24 at 126,0; F 0 × 24 at 147.33,0 |

**Earlier rows re-read after the load wait** (command 32). A vertical `<line-stack>` with `align="center"` (80 × 45 at 160,0) and `"start"` (80 × 45); a horizontal `<line-stack>` at its defaults with a 200 × 300 sibling (80 × 300), with `align="start"` (80 × 45) and with `justify="stretch"` and a 600 px sibling (792 × 600); a flex row (80 × 300); `<line-grid>` `justify-items="start"` and `"end"` with one-line items (80 × 45); a plain grid with `justify-items: center` (80 × 45 at 110,0); a 400 px block (400 × 225). Each equals the reading above, in all three engines, except the `auto`-track row, corrected above. Command 33 re-read the P2 (b) and (y) image rows, and each equals P2.

**Line components inside the box** (command 14).

| Child | Result |
|---|---|
| `<line-center>` holding a `<line-kbd keys="mod+k">` | the Center 400 × 225 at 0,0; the Kbd centred at 170.66,97.5 (firefox 170.67), 58.67 × 30 |
| `<line-stack>` of two `<div>`s | the Stack 400 × 225 at 0,0 |
| `<line-avatar src>` | 32 × 32 at 0,0, its own size |
| `<line-skeleton>` | the host 400 × 225; its `item` part 400 × 20 at 0,0 |
| `<line-skeleton style="--line-skeleton-block-size: 100%">` | the host 400 × 225; its `item` part 400 × 0 |

- The box takes its width from its container and its height from the ratio, like a block box whose height is `auto` (F5).
- In a flex row the box is as wide as its content, and at the default `stretch` alignment as tall as the row, so the ratio breaks (80 × 300). Growth along the row (`justify="stretch"` or `flex: 1`) widens it; a row taller than the box's own ratio height still stretches it (792 × 600), and `align="start"` keeps the ratio.
- A fixed `block-size` sets the width through the ratio (160 × 90); a fixed width and height together override the ratio (200 × 90).
- Without `min-block-size: 0` on `:host`, chromium gives a flex-column box the height of its content, here a stretched image, while firefox and webkit keep the ratio; with it, all three agree (D9).
- `<line-grid>` sets `align-items: stretch` and `justify-items: stretch` by default (`packages/line-components/src/grid/grid.ts:83-84`). At those defaults, a taller item in the same row stretches the box to the row's height at its column's width (294.66 × 600), so the ratio breaks; `align="start"`, `"center"` or `"end"` keeps it (294.66 × 165.73).
- Under `justify-items` `start`, `center` or `end` at the default `align`, the box takes the row's height. Chromium and webkit then take its width from the ratio, so beside a 600 px item the box is 1066.66 × 600, wider than its 294.66 px column, and under `center` and `end` it starts left of the column (−386, −772); an empty box in a one-line row is 42.66 × 24. Firefox takes the width from the content (80 × 600, 58.67 × 600, 0 × 600 and 0 × 24), so the ratio breaks. With `align` `start` as well, the box keeps the ratio at its content's width in all three engines (80 × 45; 58.67 × 33 around a Kbd; 0 × 0 when empty). A width on the box keeps the ratio too (200 × 112.5).
- The review gate measured an img child in a grid at 0 × 0 in webkit, and the box at other sizes in chromium and firefox. Those readings came before the image loaded: right after mount, command 32 read every Grid placement box at 0 × 0, and a box in a row set by text at 42.66 × 23.98 in chromium and webkit.
- A Center or a Stack fills the box. An Avatar keeps its own size, and a Skeleton fills the box with its host but draws a 20 px bar, and draws nothing with a `100%` block size (Spec drift found, item 6).

### P5 — Overflow, focus rings, `hidden` and consumer CSS

**A 150-word paragraph in a 400 × 225 box** (command 13).

| Case | Result |
|---|---|
| the final component | the box 400 × 225; the `<p>` box 400 × 225; its text 546 px tall (firefox 545); the host `scrollHeight` 552; the next sibling at y 225; 30 px below the box, `elementFromPoint` hits the paragraph |
| the same with a consumer `overflow: hidden` on the host | the same sizes; 30 px below the box, `elementFromPoint` hits `html` |

- The box keeps the ratio and the text spills past its bottom edge over the content after it (F3 (a)). A consumer `overflow` rule on `line-aspect-ratio` beats `:host` and clips it.

**A focus ring at the edge of a slotted control.** A one-cell probe host, ratio `16 / 9`, held a `<button style="display: block">` that fills the box, with `button:focus { outline: 4px solid rgb(255, 0, 255) }`; Tab focused it in all three engines; a screenshot sampled the pixel 2 px right of the box.

| Host `overflow` | Pixel outside the box |
|---|---|
| `visible` | magenta in all three engines |
| `hidden` | white in all three engines |
| `clip` | white in all three engines |
| `clip` with `overflow-clip-margin: 6px` | magenta in chromium; white in firefox and webkit (webkit: `CSS.supports('overflow-clip-margin', '6px')` is false) |

- Clipping the box hides the outside focus ring of a control that fills it, in all three engines, and `overflow-clip-margin` brings it back in chromium only (F3 (b); WCAG 2.4.7).

**`hidden` and consumer `display`.**

| Case | Computed `display`, or result |
|---|---|
| `<line-probe-aspect-ratio hidden>` | `none`, 0 × 0 |
| page rule `line-probe-aspect-ratio.c { display: block }`, with `hidden` | `block`, 400 × 225; the img 80 × 80, no longer stretched |
| the same rule without `hidden`, a tall div child | `block`, 400 × 225 |

- `:host { display: grid }` beats the UA `[hidden]` rule, so the stylesheet needs `:host([hidden]) { display: none }` (D3) [INFERENCE: the rule's necessity is inferred from Center P5 and Grid P2, which probed a host without it; this probe ran only with it].
- A consumer `display` rule on the host beats every `:host` rule, `:host([hidden])` included, as on Center (`0020-center.md` P5); `:not([hidden])` in the consumer rule keeps `hidden` working (D22).

### P6 — Direction and writing mode

| Case | Result |
|---|---|
| `dir="rtl"`, a sized 50 × 50 img | the box 400 × 225; the img at 350,0, the start corner |
| `writing-mode: vertical-rl` on a 300 px tall parent | the box 533.33 × 300 |

- `aspect-ratio` stays a physical width-to-height ratio in a vertical writing mode, and a child that keeps its size sits at the start corner of the writing direction (D10).

### P7 — htmx

| Case | htmx 2.0.11 and htmx 4.0.0, three engines |
|---|---|
| a `widescreen` box with `hx-get`, `hx-trigger="load"` and `hx-swap="innerHTML"`, replacing a "Loading" paragraph with an img | the box 400 × 225; the img 400 × 225 at 0,0 with `object-fit: cover` |
| a `<div>` in a 300 px wrapper with `hx-trigger="load"` and `hx-swap="outerHTML"`, replaced by a `portrait` box holding an img | the new box 300 × 400; its `ratio` property `portrait`; the img 300 × 400 |

- htmx swaps server content into the slot and replaces the host, and the box sizes the new content with nothing from htmx (D14).

### P8 — happy-dom

| Check | Result |
|---|---|
| a host from `document.createElement`, not connected | an instance of the class; `shadowRoot` `null`; computed `display` empty |
| the same after `document.body.append` and `updateComplete` | shadow children `["slot"]`; two adopted sheets; no attribute; `ratio` `square`; no `role` |
| computed style with no attribute, literal fallbacks in the sheet | `display: grid`; `aspect-ratio: 1 / 1`; `--line-aspect-ratio-ratio: 1` |
| `ratio="widescreen"` | `--line-aspect-ratio-ratio: 16 / 9`; `aspect-ratio: 16 / 9` |
| the same with no literal fallback (command 9) | `aspect-ratio` and `--line-aspect-ratio-ratio` empty, also with `aspects.css` in a document `<style>`, where `--line-aspect-widescreen` on `<html>` reads empty too |
| `aspects.css` in a document `<style>` with the literal fallbacks | `1 / 1`, `16 / 9`, `1.618 / 1`; `--line-aspect-widescreen` on `<html>` still empty, so the values are the fallbacks |
| the attribute `ratio="bogus"` | the probe property `square`; the attribute keeps `bogus` |
| setting the property to `golden` | the attribute `golden` |
| removing the attribute | the property `square`; no attribute |
| `hidden` | `display: none` |
| a slotted img | computed `object-fit` and `justify-self` empty |

- The unit tier can read the shadow tree, the converter, reflection, the absence of ARIA and, with literal fallbacks, the computed `aspect-ratio` and own token on `:host`. It cannot resolve the `line-tokens` values, which sit in `@layer line { :where(html) { … } }` (`packages/line-tokens/src/aspects.css:6-7`) [INFERENCE: happy-dom's `@layer` or `:where()` handling is the cause], nor apply `::slotted()` rules. Sizes, token values and child placement belong to the Browser tier.
- A test file that names the class only as a type loses its import, so the probe test imported `LineProbeAspectRatio` as a value; a host from `document.createElement` has no shadow tree until it is connected (`0020-center.md` P8).
- The probe used Center's `enumConverter` (unknown → `square`, `useDefault`). D8 takes a local copy of Grid's `variantConverter` (unknown → `undefined`), which the first probe run did not use; command 27 built the component with it [INFERENCE: the stylesheet keys off the attribute, so both converters draw the same box].

### P9 — Agent path

A stub descriptor `AspectRatio` for `line-probe-aspect-ratio` took the recommended schema: `ratio` (`z.enum(['square', 'landscape', 'portrait', 'widescreen', 'ultrawide', 'golden'])`, optional, plain `.describe()`) bound to the attribute `ratio`, and `child` (`ComponentId`, optional, through `commonProp`) with the slot map `child` → default slot, `hostNaming: { kind: 'never' }`, and the agent-facing and tool descriptions. Command 15 emitted a first wording (834 and 809 characters); command 25 emitted the wording of Descriptor fields. Two more stubs ran beside it: `AspectRatioS` took `ratio` as `DynamicString` for F1 (b), and `AspectRatioN` took `children` (`ChildList`) for F7 (b). The probe pushed the stubs onto the exported `descriptors` array before it imported the surface fixture, because the surface reads that array at module load (`packages/line-genui/src/a2ui/projection.ts:19`, `:58-60`).

| Check | Result |
|---|---|
| `lineCatalogDocument` | an `AspectRatio` entry with `allOf` of `ComponentCommon` and an own object; `ratio` a string enum; `child` a `$ref` to `ComponentId`; `AspectRatioS.ratio` a `$ref` to `DynamicString`; `AspectRatioN.children` a `$ref` to `ChildList` |
| `inlineCatalog` against `client_capabilities.json#/$defs/Catalog` (Ajv 2020) | valid |
| `frontendTools`, OpenAI | one parameter, `ratio`, typed `["string", "null"]` with the six values and `null` in its enum, and listed in `required`; **no `child`**; the tool takes the tool description |
| Anthropic | `ratio`, optional, the six values |
| Gemini | `ratio` with `nullable: true` |
| any provider | no `accessibilityLabel` or `accessibilityDescription`, because `hostNaming` is `never`; `AspectRatioS.ratio` a plain `string` with no enum; `AspectRatioN` carries `ratio` only |
| backticked words of the tool description | `ratio`, `square`, `landscape`, `portrait`, `widescreen`, `ultrawide`, `golden` |
| lengths | command 25: agent-facing description 949 characters, tool description 924; command 29, after review gate round 1: 942 and 917; command 34, after review gate round 2: 958 and 933, the wording of Descriptor fields |
| surface, `line` catalog, an `AspectRatio` root with `ratio: "widescreen"`, its child a Center holding a Kbd | no error; `<line-probe-aspect-ratio ratio="widescreen"><line-center><line-kbd keys="mod+k"></line-kbd></line-center></line-probe-aspect-ratio>` |
| an `AspectRatio` node with no props | no error; `<line-probe-aspect-ratio></line-probe-aspect-ratio>` |
| a node with `accessibility: { label: "Cover", description: "Hero image" }` and a Skeleton child | no error; no `aria-label` or `aria-description` on the host |
| a node whose child is a vertical Stack of two Kbds | no error; the Stack and its two Kbds in the host |
| `ratio: "16/9"` | `VALIDATION_ERROR`, "ratio: Invalid enum value. Expected square \| landscape \| portrait \| widescreen \| ultrawide \| golden, received '16/9'"; nothing renders |
| `child: ["a", "b"]` | `VALIDATION_ERROR`, "child: Expected string, received array"; nothing renders |
| `AspectRatioS` with `ratio: "16/9"` | no error; the attribute `ratio="16/9"` |
| `AspectRatioS` with `ratio: "1; background: red"` | no error; the attribute `ratio="1; background: red"`, written as sent |
| `AspectRatioN` with `children: ["a", "b"]` | no error; both Kbds in the host |

- The agent path needs one attribute binding. The surface removes the attribute of an unset prop, so the default must not depend on a reflected attribute (D8).
- An enum rejects a free ratio with a validation error, and a `DynamicString` writes whatever the agent sends, so the component alone would have to parse it (F1, F7).
- `child` reaches the catalog but not the tools (§6.G.3, `:1405`; §10 SD47), so a description that names it needs a tool description (D13).
- The `line` catalog holds only `line` descriptors (`packages/line-genui/src/catalog/line.ts:84-93`), and a surface renders one catalog id, so a `line` agent has no `Image` or `Video` to put in the box. It can frame a Center, a Stack, an Avatar, an Icon or a Skeleton (Spec drift found, item 5).

### P10 — A2UI basic catalogs

- The v0.9 basic catalog at `cbaa5ee` and the vendored v0.9.1 copy list the same 18 types: AudioPlayer, Button, Card, CheckBox, ChoicePicker, Column, DateTimeInput, Divider, Icon, Image, List, Modal, Row, Slider, Tabs, Text, TextField, Video. A `diff` of their sorted `components` objects is empty.
- Neither has an aspect-ratio type or prop. `grep -i -E 'aspect|ratio'` matches only the descriptions of the `and`, `or` and `not` functions ("operation"; `catalog.json:1163`, `:1192`, `:1221`, the vendored file at the same lines).
- `Image` takes `url`, `description`, `fit` (`contain`, `cover`, `fill`, `none`, `scaleDown`, default `fill`, "This corresponds to the CSS 'object-fit' property") and `variant` (`icon`, `avatar`, `smallFeature`, `mediumFeature`, `largeFeature`, `header`) (`catalog.json:39-79`; the vendored file at the same lines). `Video` takes `url` only (`:183-207`).
- The `basic` map renders `Image` as a native `<img>` and binds nothing to `fit` (`packages/line-genui/src/catalog/basic.ts:112-122`; `packages/line-genui/src/a2ui/projection.ts:67`), and renders `Video` as a native `<video>` (`basic.ts:124`). No basic type maps to Aspect Ratio, so the `basic` map keeps its 10 types (D12).
- `Card` takes one `child` and tells agents to wrap several components in a layout component (`catalog.json:383`), the single-child precedent of F7 (a) (`0020-center.md` P10).

### P11 — Competitors

Checked on 2026-11-17, one row per column of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 (`:30`; the `Radix` column is Radix Primitives, `:21`). "Aspect-ratio component" means an element or component whose job is to give its content a fixed width-to-height ratio.

| Library | Package and version | Aspect-ratio component | Source |
|---|---|---|---|
| Web Awesome | `@awesome.me/webawesome` 3.14.0 | none; utility classes only | `dist/custom-elements.json` declares 73 tags; the only frame tag, `wa-zoomable-frame`, embeds an iframe with zoom controls, and its stylesheet holds no `aspect-ratio`. `dist/styles/utilities/layout.css:74-101` define `wa-frame`, a flex box with `aspect-ratio: 1 / 1` and `overflow: hidden` whose `img` and `video` children take `block-size` and `inline-size` of `100%` and `object-fit: cover`, with `wa-frame:landscape` (16 / 9) and `wa-frame:portrait` (9 / 16) |
| Spectrum Web Components | `@spectrum-web-components/bundle` 1.12.6 | none | the bundle's `dependencies` list 74 packages and none for an aspect ratio; `npm view @spectrum-web-components/aspect-ratio` answers `E404` |
| Lion | `@lion/ui` 0.27.0 | none | `components/` holds 42 directories and none for an aspect ratio; `find -iname '*aspect*'` matches nothing |
| Fluent UI Web Components | `@fluentui/web-components` 3.2.1 | none | `custom-elements.json` declares 42 tags; `fluent-image` takes `block`, `bordered`, `shadow`, `fit` (`none`, `center`, `contain`, `cover`, `dist/esm/image/image.options.js:6-11`) and `shape`, and no ratio; `find -iname '*aspect*'` matches nothing; `npm view @fluentui/web-components-aspect-ratio` answers `E404` |
| Radix Primitives | `radix-ui` 1.8.1, which depends on `@radix-ui/react-aspect-ratio` 1.2.0 | `AspectRatio` | `src/aspect-ratio.ts` re-exports the package. Its `AspectRatio` takes `ratio`, a number, default `1 / 1`, and renders a wrapper `<div>` with `position: relative`, `width: 100%` and `padding-bottom: ${100 / ratio}%` around an inner `<div>` with `position: absolute` and every inset `0` (`dist/index.mjs:11`, `:17-20`, `:31-35`) |
| Bits UI | `bits-ui` 2.21.0 | `AspectRatio` | `ratio`, default `1`; the same padding wrapper and absolutely positioned inner element (`dist/bits/aspect-ratio/components/aspect-ratio.svelte:12`, `:30`; `aspect-ratio.svelte.js:19-25`) |
| Ark UI | `@ark-ui/react` 5.40.0 | none | `dist/components/` holds 74 directories and none for an aspect ratio; `ImageCropper` takes `aspectRatio` for its crop selection (`dist/components/image-cropper/image-cropper-root.js:13`), not for a layout box; `npm view @ark-ui/aspect-ratio` and `@zag-js/aspect-ratio` answer `E404` |

Three libraries outside the table ship one.

- Chakra UI 3.38.0 `AspectRatio` takes `ratio`, default `4 / 3`, and exactly one child (`Children.only`). It draws a `::before` with `padding-bottom: ${1 / ratio * 100}%`, makes its child `position: absolute` over the whole box with `overflow: hidden`, `display: flex` and both alignments `center`, and gives a child `img` or `video` `object-fit: cover` (`dist/esm/components/aspect-ratio/aspect-ratio.js:10-27`, `:30-31`, `:38-43`). Its `aspectRatios` theme tokens are `square` (1 / 1), `landscape` (4 / 3), `portrait` (3 / 4), `wide` (16 / 9), `ultrawide` (18 / 5) and `golden` (1.618 / 1) (`dist/esm/theme/tokens/aspect-ratios.js:4-11`), the same values as `packages/line-tokens/src/aspects.css:8-13`, with `widescreen` for `wide`.
- Mantine 9.8.1 `AspectRatio` takes `ratio`, default `1` through `--ar-ratio`. It puts `aspect-ratio: var(--ar-ratio)` and `width: 100%` on each child, not on itself, and `object-fit: cover` on a child `img` or `video` (`styles/AspectRatio.css:1-13`; `esm/components/AspectRatio/AspectRatio.mjs:10`).
- Radix Themes 3.3.0 re-exports the Radix Primitives `AspectRatio.Root` (`dist/esm/components/aspect-ratio.js:1`).
- Every library takes a number or a string ratio from code, and none takes a token name on the component. Chakra, Mantine and Web Awesome crop media with `cover`; Radix and Bits leave media sizing to the author.
- So two of the seven, Radix Primitives and Bits UI, ship an aspect-ratio component. The Aspect Ratio row of the analysis gets `AspectRatio` in their cells and `—` in the other five, with Web Awesome's `wa-frame`, Fluent's `fit` and Ark's cropper, and the three outside libraries, in its Notes (D18).

### P12 — Size

The decided design, a module with the class, the converter, the stylesheet and `customElements.define`, is 1,569 B minified and 658 B gzipped through esbuild (`--bundle --minify --format=esm --target=es2022 --external:lit --external:@websublime/*`, then `gzip -9 -n`), the §7.6 recipe. Without the six literal fallbacks of F6 (b) it is 1,525 B and 626 B. The shipped `./aspect-ratio` lands in the "Size report" step against the < 5 KB soft target [INFERENCE: the shipped figure is not measured yet; the probe used Center's converter, not Grid's].

### What the probes settle

- CSS `aspect-ratio` on a one-cell grid host keeps the ratio in three engines for any child, and stretched children fill it, media included (P2; F2 (a)).
- Nothing in the browser reads a free ratio from an attribute without JavaScript, and a JavaScript route needs a strict parser (P3; F1).
- The `line-tokens` `aspects` family drives six named ratios, and without it the box loses its ratio unless the stylesheet carries literal fallbacks (P3; F6).
- Clipping hides focus rings at the box's edge (P5; F3).
- The box sizes like a block box, with known traps in flex rows, in Grid rows at the default stretch alignment, and under Grid `justify-items` other than `stretch` (P4; Connections).
- htmx needs nothing (P7; D14). The agent path works with one attribute binding and a `ComponentId` slot, and the `line` catalog has no media type to frame (P9; F7).
- Two of the seven libraries ship an aspect-ratio component, and all of them take a free ratio from code (P11; F1).

### What automation cannot observe

- What a screen reader announces for a role-less Aspect Ratio, and whether it reads the children in DOM order. P1 reads the Chromium tree only.
- Firefox and WebKit accessibility trees. Playwright's snapshot is its own computation from the DOM (Phase 1 spec §12 AM-058).
- Whether authors read `landscape` as 4:3 and `portrait` as 3:4, the values the tokens and Chakra give the names, when Web Awesome's `wa-frame:landscape` is 16:9 and `wa-frame:portrait` is 9:16 (P11; F1).
- The previous stable Chrome, Firefox and Safari, which PRD §1.7 (`docs/PRD.md:162`) also supports. The probes ran the latest engines only.

---

## Part A — Requirements

### Overview

#### Description

`<line-aspect-ratio>` gives its content a fixed width-to-height ratio (PRD §4.1, `docs/PRD.md:268`). The host is a one-cell grid whose width comes from its container and whose height comes from the ratio (F2 (a)). `ratio` picks one of six named ratios from the `line-tokens` `aspects` family, `square` by default, and the `--line-aspect-ratio-ratio` token takes any other ratio (F1 (a), F5 (a)). Each child fills the box unless it sets its own size, and images and videos are cropped to cover it (F4 (a)). Content taller than the box spills past its bottom edge, so nothing is cut off (F3 (a)). Aspect Ratio adds no role, no state and no behaviour, so it stays a `generic` element in the accessibility tree (R8 `docs/research/01-research-accessibility.md:83`).

#### Use cases

- A video or an embedded player that keeps 16:9 as the page width changes (P2 iframe, video).
- Uniform thumbnails of mixed source ratios in a `<line-grid align="start">`, each cropped to the same shape (P2 portrait img; P4 Grid rows).
- Space held for an image before it loads, because the box takes its height from its width and the ratio, not from the image (P2 empty).
- A caption over an image, through `align-self: end` on the caption (P2 caption).
- An icon or a short label centred in a square tile, through a `<line-center>` inside the box (P4 line children).
- An agent-built frame on `<line-a2ui-surface>` through the `line` catalog, holding a Center, a Stack, an Icon or a Skeleton (P9).

#### Anti-patterns

- One image whose ratio is known. Give the `<img>` `width` and `height` attributes, or CSS `aspect-ratio`, and skip the wrapper [INFERENCE: native advice, not probed beyond P2's sized img].
- Text whose length varies, such as a card body. The box does not grow, so long text spills over what follows (P5); give the container a `min-block-size` instead.
- Cropping or zooming an image interactively. Aspect Ratio crops only through `object-fit`; an image cropper, such as Ark UI's `ImageCropper`, does the rest (P11).
- Different image files per viewport. Use `<picture>` and `srcset`; Aspect Ratio only shapes the box.
- A box in a flex row, or in a Grid row beside a taller item, at the default stretch alignment. The row's height overrides the ratio, or in a Grid with `justify-items` other than `stretch` widens the box past its column (P4); align the items to the start (`align="start"` on a Stack or a Grid) or give the box its own size there.

#### User expectations

- The box keeps its shape at every width, before and after its media load.
- Media fill the box without distortion; other children fill it unless they set their own size.
- Nothing inside the box is clipped, and focus rings of controls inside it stay visible (P5).
- Aspect Ratio adds nothing to what a screen reader announces, and focus moves through its children in source order (P1).
- Consumer CSS on `line-aspect-ratio`, and the `--line-aspect-ratio-ratio` token, override any default (P3, P5).

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| any element or `line-*` component | child | the default slot; Aspect Ratio never imports a child (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`) |
| `<line-center>` | child | the default slot; a Center inside the box fills it and centres its own content (P4) |
| `<line-stack>` | child or parent | a Stack inside the box fills it and lays out several children (P4); a box in a vertical Stack at its default `align` is as wide as the Stack, and under another `align` as wide as its content; a box in a horizontal Stack is as wide as its content unless the Stack sets `justify="stretch"`, and at the default `align` as tall as the row (P4) |
| `<line-grid>` | parent | at the Grid's defaults a box in a cell is as wide as its column and keeps the ratio while it sets the row's height; a taller item in the same row stretches it to the row's height (294.66 × 600), and `align="start"`, `"center"` or `"end"` keeps the ratio. Under `justify-items` `start`, `center` or `end` at the default `align`, the box takes the row's height and, in chromium and webkit, a width from the ratio that can exceed its column (1066.66 × 600 beside a 600 px item), or in firefox the content's width (80 × 600); with `align="start"` as well it keeps the ratio at its content's width (80 × 45). Keep `justify-items` at `stretch` and set `align="start"`, or give the box a width (P4) |
| `<line-avatar>`, `<line-skeleton>` | child | an Avatar keeps its own size; a Skeleton draws a 20 px bar at the top of the box (P4; Spec drift found, item 6) |
| `<line-a2ui-surface>` | orchestrator | creates `line-aspect-ratio` by tag for a `line` catalog `AspectRatio` node and puts its `child` in the default slot (ARCH §17.4; Phase 1 spec §6.G.4); no A2UI `basic` type maps to it (P10; D12) |

- In a flex row, such as a horizontal `<line-stack>`, the box is as wide as its content and, at the default stretch alignment, as tall as the row, so the ratio breaks. Give it `flex: 1` or a width, and align the row's items to the start (`align="start"` on a Stack), or a row taller than the box still stretches it (P4).
- In a `<line-grid>` at its default `align`, an item taller than the box stretches it to the row's height, and under `justify-items` other than `stretch` the box can grow wider than its column. Keep `justify-items` at `stretch` and set `align="start"` on the Grid, or give the box a fixed size (P4).
- In an `auto` grid track the box is as wide as its content (80 × 45; P4). Give it a width there.
- A fixed `block-size` sets the width through the ratio, and a fixed width and height together override it (P4).

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| `ratio` | `square \| landscape \| portrait \| widescreen \| ultrawide \| golden` | `square` (1:1) for tiles and avatars; `landscape` (4:3) and `portrait` (3:4) for photos; `widescreen` (16:9) for video; `ultrawide` (18:5) for banners; `golden` (1.618:1) for cards and hero images |

- `ratio` is a C6 semantic variant (F1 (a)). Each value changes only the default of the component's own token `--line-aspect-ratio-ratio`, to the matching `--line-aspect-*` token of `line-tokens` with a literal fallback (ARCH §17.2 C6; F6 (b)). No value adds any other rule.
- With no attribute, or an unknown value, the box is square (F5 (a); D8).

---

## Part B — Technical Specification

### Anatomy

```
<line-aspect-ratio>          LineElement; display: grid on :host, one minmax(0, 1fr) cell; aspect-ratio from the token
└── #shadow-root
    └── <slot>               slotted elements share the one cell and stretch over it
```

- The shadow root holds only a bare `<slot>`, with no wrapper element, as on Stack, Grid and Center (`0018-stack.md` Open Question 1; `0019-grid.md` D2; `0020-center.md` D2; D2).
- A `<slot>` has `display: contents` by default, so slotted elements are the host's grid items (P2).
- No `generic` node sits between a host `role="img"` or `role="group"` and its children (P1 E, F).
- `commonReset` sets nothing on `:host` (`packages/line-core/src/styles/reset.common.css:1-38` holds no `:host` rule), so `:host { display: grid }` does not conflict with it.
- `:host { display: grid }` beats the UA `[hidden]` rule, so the stylesheet ends with `:host([hidden]) { display: none }` (P5; D3).

### States

| Field | Value |
|-------|-------|
| Machine | `none` (Static tier; ARCH §8, `:410`; Phase 1 spec §6.C.4 C19 row) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| none | — | — | — |

Aspect Ratio has no finite states and no state flags, so it writes no `data-*` attribute and no `:state()` (ARCH §14.8; D1).

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ComponentId` | the content of the box, one element in the agent contract (F7 (a)); in markup, several elements share the one cell and overlap in source order, so a later child paints over an earlier one (P2 caption) (F2 (a)); the A2UI `child` |

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| none | — | — |

- Aspect Ratio exposes no `::part()` (D2). MANIFESTO Law 1 holds as on Stack, Grid and Center, because the only styleable zone is the host, which the consumer styles with `line-aspect-ratio { … }`, and the children are light-DOM elements the consumer styles directly (`0018-stack.md:108-110`).
- Consumer CSS on `line-aspect-ratio` in the outer tree beats the component's `:host` rules, and consumer CSS on a child beats the `::slotted()` rules (P3, P2).

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `ratio` | `ratio` | `'square' \| 'landscape' \| 'portrait' \| 'widescreen' \| 'ultrawide' \| 'golden' \| undefined` | `undefined` (drawn as `square`) | yes | the shape of the box, one of the six named ratios of the `line-tokens` `aspects` family (F1 (a), F5 (a)) |

- `aspect-ratio.ts` defines its own `variantConverter`, a copy of `packages/line-components/src/grid/grid.ts:16-19`, so an unknown value becomes `undefined`, the attribute keeps what the author wrote, and the stylesheet draws a square through its `:host` default (D8). Importing Grid's converter would pull `line-grid` into the `./aspect-ratio` bundle, which the isolation test rejects (`packages/line-components/__tests__/bundle-splitting.test.ts`, Phase 1 spec §7.5) and MANIFESTO Law 4 forbids.
- "Reflects" means a value the author or code sets is written to the attribute; `undefined` leaves no attribute, as on Grid's `columns` (`0019-grid.md` D9).
- Any other ratio goes through the token, `line-aspect-ratio { --line-aspect-ratio-ratio: 21 / 9 }` or an inline `style="--line-aspect-ratio-ratio: 9 / 16"`, which beats every `ratio` value (P3).
- Aspect Ratio has no `fit`, `inline`, `overflow` or free-ratio prop (F1 (a), F3 (a), F4 (a); D22).

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

Aspect Ratio dispatches no event. It holds no value and takes no input, so C3 and C9 add nothing (D1).

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-aspect-ratio-ratio` | `var(--line-aspect-square, 1)`; the `ratio` value's `--line-aspect-*` token with its literal fallback | host (`aspect-ratio`) |

The component reads the six `--line-aspect-*` tokens of `packages/line-tokens/src/aspects.css:8-13`, each with a literal fallback equal to its value there (F6 (b)). The component stylesheet after `commonReset` is this rule set, in this order.

```css
:host {
  --line-aspect-ratio-ratio: var(--line-aspect-square, 1);

  display: grid;
  grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  aspect-ratio: var(--line-aspect-ratio-ratio);
  min-block-size: 0;
}

:host([ratio='landscape']) {
  --line-aspect-ratio-ratio: var(--line-aspect-landscape, 4 / 3);
}

:host([ratio='portrait']) {
  --line-aspect-ratio-ratio: var(--line-aspect-portrait, 3 / 4);
}

:host([ratio='widescreen']) {
  --line-aspect-ratio-ratio: var(--line-aspect-widescreen, 16 / 9);
}

:host([ratio='ultrawide']) {
  --line-aspect-ratio-ratio: var(--line-aspect-ultrawide, 18 / 5);
}

:host([ratio='golden']) {
  --line-aspect-ratio-ratio: var(--line-aspect-golden, 1.618 / 1);
}

::slotted(*) {
  grid-area: 1 / 1;
  place-self: stretch;
  max-inline-size: 100%;
  max-block-size: 100%;
}

::slotted(:is(img, video)) {
  object-fit: cover;
}

:host([hidden]) {
  display: none;
}
```

- The `minmax(0, 1fr)` tracks keep content from growing the grid, so the box holds the ratio and content larger than the box overflows it (P2, P5; F3 (a)).
- `min-block-size: 0` keeps chromium from growing a box that is a flex item to the height of its content (P4, command 11; D9).
- `place-self: stretch` fills the box with a child of `auto` size, and the `max-*` sizes clamp a child whose size attributes or styles exceed it; a child's own smaller size wins and sits at the start corner (P2).
- `cover` crops an image or a video to the box without distortion (F4 (a)); a consumer `object-fit` on the child wins (P2).
- There is no rule for `ratio='square'`, because `:host` already declares it.
- The `[hidden]` rule comes last, so no earlier rule sets `display` over it (D3).
- Aspect Ratio draws no colour, border or focus ring, so it needs no `line-themes` role token.

#### Consumer styling

```css
/* Any other ratio, through the component's own token (P3) */
line-aspect-ratio.cinema { --line-aspect-ratio-ratio: 21 / 9; }

/* Rounded media: clip the box, and keep focus rings inside it (P5) */
line-aspect-ratio.rounded { border-radius: var(--line-radius-3); overflow: hidden; }
line-aspect-ratio.rounded :focus-visible { outline-offset: -4px; }

/* Letterbox instead of crop (P2) */
line-aspect-ratio > img.whole { object-fit: contain; }

/* A box in a horizontal Stack that grows and keeps its ratio (P4) */
line-stack[orientation='horizontal'][align='start'] > line-aspect-ratio { flex: 1; }

/* An inline box that still honours `hidden` (P5) */
line-aspect-ratio.inline:not([hidden]) { display: inline-grid; inline-size: 10rem; }
```

- A `display` rule on `line-aspect-ratio` overrides `hidden` unless it excludes `[hidden]` (P5).
- `overflow: hidden` on the host clips long content and the outside focus rings of controls that fill the box (P5); the inset `outline-offset` recipe keeps them visible [INFERENCE: the inset offset was not probed].

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

Aspect Ratio takes no focus. Focus moves through its children in source order (P1; D6).

### A11y

| Field | Value |
|-------|-------|
| Role | none; the host stays `generic` and adds no node to the Chromium tree when it has no name (R8 `:83`; P1 A; Phase 1 spec §6.C.4 C19 row) |
| ARIA attributes | none set by the component; it never writes `role`, `aria-*` or `internals.role`, and it leaves an author-set host `role` alone (D5) |
| Accessible name | none by default; see the C5 note below |
| Focus | none; the host is not focusable and does not delegate focus (P1; D6) |

- **C5.** ARIA 1.2 prohibits `aria-label` and `aria-labelledby` on `generic`, so a name on a role-less `line-aspect-ratio` names nothing a user can reach (R8 `:55`). Chromium still exposes it as a named `generic`, and axe 4.14.0 does not report it (P1 C, D; `0018-stack.md:168-169`). A name applies only with an author role that allows one, such as `role="img"` for a picture built from several elements, with `alt=""` on any decorative image inside, or `role="group"` for a gallery item (P1 E, F).
- **Media names.** The box names nothing; each `<img>` keeps its `alt`, each `<iframe>` its `title` and each `<video>` its label (P1 A, G, H). axe still reports an `<img>` without `alt` inside the box (P1 I).
- **Reflow.** Content taller than the box spills out visibly rather than being cut off, so text enlarged by zoom stays readable (P5; WCAG 1.4.4, 1.4.10) (F3 (a)). It overlaps what follows the box, which the docs warn about.
- **Focus visible.** The component does not clip, so a focus ring at the edge of a control that fills the box stays visible; clipping it would hide that ring in all three engines (P5; WCAG 2.4.7) (F3 (a)).
- **Proof (D20).** No role, name or ARIA value lives in internals, so the CDP-and-read-back rule for internals roles does not apply (Phase 1 spec `:1180`). The Browser tier checks the tree with `ariaSnapshot()` in three engines and a Chromium CDP assertion.
- **Firefox and WebKit.** No check reads their accessibility trees, and no screen reader was run. The gap is recorded here (Phase 1 spec `:1180`; §12 AM-058).

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `ratio` is a string enum (F1 (a)) |
| C2 | Slots carry `@slot` and a single or multiple classification | one `@slot` tag for the default slot, classified `ComponentId` (F7 (a)) |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | no events |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated |
| C5 | The host accepts an accessible name and applies it to the element with the role | the host is the only element and carries any author role; a name is valid only with an author role that allows it (A11y). On the agent path the surface sets no host name on an AspectRatio node, and the AspectRatio tool carries no accessibility parameters (F8 (a)) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | `ratio` is reflected, closed, and changes only the default of `--line-aspect-ratio-ratio` (F1 (a)) |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries `@summary`, `@slot` for the default slot and `@cssprop` for `--line-aspect-ratio-ratio`; no `@csspart` or `@fires`, because there are no parts or events; nothing is deprecated (D19) |
| C8 | Missing or partial props degrade to an empty or neutral state | with no attribute or an unknown `ratio` the box is square; with no children it is an empty box of that shape; without `line-tokens` the literal fallbacks keep every ratio (P3, P8, P9; D8; F6 (b)) |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

- `--line-aspect-ratio-ratio` is a CSS custom property, not an input of the prop schema. The surface ignores agent theme hints and binds no style (ARCH §17.4 Theme row), so agents choose among the six `ratio` values (F1 (a)).

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `AspectRatio` (D12) |
| Tag | `line-aspect-ratio` |
| `load()` subpath | `@websublime/line-components/aspect-ratio` |
| Prop schema | `ratio` (`z.enum(['square', 'landscape', 'portrait', 'widescreen', 'ultrawide', 'golden'])`, optional, plain `.describe()` with "The shape of the box: `square` (1:1, default), `landscape` (4:3), `portrait` (3:4), `widescreen` (16:9), `ultrawide` (18:5) or `golden` (1.618:1)."), plus the catalog-only `child` (`ComponentId`, optional, through `commonProp` with "The ID of the component the box holds; to hold several, a Stack that holds them."), which the frontend-tool walker leaves out, and `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1, `:1323`, `:1326`; §6.G.3; F1 (a), F7 (a)) |
| Slot map | `(default)` → `ComponentId` (`child`) |
| Binding map | `ratio` → attribute `ratio`; no value prop; no commit event (C9) |
| Action map | none |
| Accessibility requirements | no `requiredName`; `hostNaming: { kind: 'never' }`, because the host has no role a name could attach to and the surface never gives `line-aspect-ratio` a role (`packages/line-genui/src/catalog/descriptor.ts:160-174`; P1 C; P9). The Phase 1 spec names the components that take no host name in four places, and Phase 1 spec AM-103 (`:2564`) adds Aspect Ratio to the four lists, as AM-102 did for Center (F8 (a); Spec drift found, item 1) |
| Agent-facing description | A box that keeps a fixed width-to-height ratio, such as a 16:9 frame. Put the content in `child`; to show several components, put them in a Stack and make the Stack the child. A child with no size of its own, such as a Stack or a Center, fills the box. `ratio` sets the shape: `square` (1:1, default), `landscape` (4:3), `portrait` (3:4), `widescreen` (16:9), `ultrawide` (18:5) or `golden` (1.618:1). The box takes its width from its container and its height from the ratio. In a horizontal Stack or a Grid at its default alignment, a taller neighbour stretches the box, which breaks the ratio or widens the box past its column; aligning the children to the start keeps the ratio. A vertical Stack with another alignment, a horizontal Stack whose children do not grow, and a Grid that places its children at the start, centre or end of their columns size the box from its content or its row's height. Content taller than the box spills past its bottom edge. |
| Tool description | A box that keeps a fixed width-to-height ratio, such as a 16:9 frame. The app places one component inside it, which may be a Stack that holds several. A child with no size of its own, such as a Stack or a Center, fills the box. `ratio` sets the shape: `square` (1:1, default), `landscape` (4:3), `portrait` (3:4), `widescreen` (16:9), `ultrawide` (18:5) or `golden` (1.618:1). The box takes its width from its container and its height from the ratio. In a horizontal Stack or a Grid at its default alignment, a taller neighbour stretches the box, which breaks the ratio or widens the box past its column; aligning the children to the start keeps the ratio. A vertical Stack with another alignment, a horizontal Stack whose children do not grow, and a Grid that places its children at the start, centre or end of their columns size the box from its content or its row's height. Content taller than the box spills past its bottom edge. |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C19 row, `:1175`; Aspect Ratio is none of the three SD38 exceptions, `:2385`; D11) |

- The agent-facing description is 958 characters and the tool description 933, both under the 1024 cap (Phase 1 spec `:1422`). The tool description replaces "Put the content in `child`; to show several components, put them in a Stack and make the Stack the child." with "The app places one component inside it, which may be a Stack that holds several.", because the tool has no `child` parameter (Phase 1 spec `:1423`; `0018-stack.md` AM-006; D13). The Stack and Grid sentences name no Stack or Grid prop, such as Grid's `align`, because the backtick guard rejects a backticked name the tool lacks (Phase 1 spec `:1423`); they say "aligns its children to the start", the meaning of Grid's and Stack's `align="start"`. Command 34 emitted this wording through all three providers, with only `ratio` and its six values in backticks in the tool description (P9).
- Each sentence about size rests on a P4 row. "Takes its width from its container" rests on the block, real-surface, vertical-Stack and Grid rows. "In a horizontal Stack or a Grid at its default alignment, a taller neighbour stretches the box, which breaks the ratio or widens the box past its column" rests on the horizontal Stack rows with a 200 × 300 sibling (80 × 300) and with `justify="stretch"` and a 600 px sibling (792 × 600), the Grid row with a 600 px item at the Grid's defaults (294.66 × 600), and the Grid placement rows at the default `align` (chromium and webkit 1066.66 × 600 beside a 294.66 px column; firefox 80 × 600). "Aligning the children to the start keeps the ratio" rests on the horizontal Stack `align="start"` rows (80 × 45; 792 × 445.5), the Grid `align="start"` row (294.66 × 165.73) and the Grid placement rows with `align` `start` (80 × 45; 58.67 × 33). "Size the box from its content or its row's height" rests on the vertical Stack `align` `start`, `center` and `end` rows (80 × 45), the horizontal Stack rows at the default `justify` (80 × 300; 80 × 45) and the Grid placement rows (content width with `align="start"`; the row's height at the default `align`). "A child with no size of its own, such as a Stack or a Center, fills the box" rests on the line-children rows. "Content taller than the box spills past its bottom edge" rests on P5 (F3 (a)).
- The frontend tool carries `ratio` only, with no `accessibilityLabel` or `accessibilityDescription` (F8 (a); P9).
- The surface writes `ratio` as its attribute and removes it when unset; a node with no props renders an empty `<line-aspect-ratio>`, square, and raises nothing (P9; C8).
- Aspect Ratio joins the `line` catalog only. No A2UI v0.9 or v0.9.1 basic type has a ratio, and the basic `Image.fit` binds nothing on the native `<img>` (P10), so the `basic` map keeps its 10 types (Phase 1 spec §6.G.2, `:1371`, `:1373`; D12).
- C19 ships its descriptor in the same PR and adds Aspect Ratio to the `<line-a2ui-surface>` render fixture and the surface axe test (Phase 1 spec §6.C.0, `:927`; §6.C.6, `:1231`; D17).
- These tests in `packages/line-genui/__tests__` change with a nineteenth descriptor (D17).
  - `PROP_TYPES` gains `AspectRatio: { ratio: 'enum', child: 'ComponentId' }` between `Alert` and `Avatar` (`catalog.test.ts:48-57`), and its doc comment adds `0021-aspect-ratio.md` (`:40-46`).
  - The raw catalog of every descriptor gains `AspectRatio` between `Alert` and `Avatar` (`:129-130`), and the test title at `:127` says nineteen descriptors.
  - The exposure test expects `toHaveLength(19)` (`:520`, was 18) and the import test `descriptors: 19` (`:578`).
  - `LINE_COMPONENTS` gains `AspectRatio` between `Alert` and `Avatar` (`catalog-emitters.test.ts:66-67`).
  - The tool-name list gains `'AspectRatio'` between `'Alert'` and `'Avatar'` (`frontend-tools.test.ts:108-109`); the flat-model test gains `expect(names('AspectRatio')).toEqual(['ratio'])` (`:186-192`); the accessibility test adds `AspectRatio` to its title and to the tools that carry neither parameter (`:259`, `:278`); the tool-description test adds `aspectRatioDescriptor` to the descriptors that emit their `toolDescription` and to its title (`:453-462`); the backtick guard expects `lacked(aspectRatioDescriptor)` to be `['child']` [INFERENCE: from the guard's rule and the backticked names of the agent-facing description], and its title says "the nine tool descriptions" in place of "eight" (`:438`).
  - `a2ui-surface.test.ts` imports `aspectRatioDescriptor` (`:22-31`) and gains an AspectRatio block after the Center block (`:490-548`), with `beforeAll(() => aspectRatioDescriptor.load())`, as the Center block loads its descriptor, and the three surface cases of Tests.
  - `cem-coverage.test.ts` and `cem-drift.test.ts` keep `line-spinner` as their made-up tag, which Aspect Ratio does not collide with.
- This source file in `line-genui` changes beside the descriptor and the catalog index (Bundle).
  - The JSDoc of `takesAccessibility` in `packages/line-genui/src/catalog/tools.ts:139-143` names Alert, AspectRatio, Center, Grid, Icon, Kbd and Skeleton (`never`) and cites AM-103 beside AM-069, AM-098, AM-099, AM-101 and AM-102; the function itself is unchanged, because it already returns `false` for `never` (F8 (a); D18).
- These files outside `line-genui` change.
  - `lineShowcase` in `apps/storybook/stories/agent-ui/a2ui-fixtures.ts` gains the node `{ id: 'framed', component: 'AspectRatio', ratio: 'widescreen', child: 'framed-center' }`, its child `{ id: 'framed-center', component: 'Center', child: 'framed-kbd' }` and `{ id: 'framed-kbd', component: 'Kbd', keys: 'space' }`, after the Center nodes (`:203-204`), and the root's `children` gain `'framed'` after `'centred'` (`:73`). Its JSDoc names Aspect Ratio (`:56-65`), the sentence "A two-column Grid of two Skeleton tiles follows, and a centred Kbd hint closes the root." (`:64`) gains "and a widescreen frame with a centred Kbd hint" in place of its ending, and the file header that lists the render fixture names Aspect Ratio (C19) (`:1-4`).
  - `'agent-ui-a2ui-surface--line-catalog'` in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` counts 43 elements (`:34`, was 40; the fixture adds one `line-aspect-ratio`, one `line-center` and one `line-kbd`), the settle selector adds `line-aspect-ratio` (`:63`), and the file JSDoc names C19 (`:1-23`).

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/aspect-ratio` |
| Kind | `independent` (Phase 1 spec §4.2, `:307`; §10 SD12) |
| Registers | `line-aspect-ratio` |
| Reset modules | `commonReset` only (ARCH §14.7, `docs/ARCHITECTURE.md:1163`; D4) |

- The files are `src/aspect-ratio/aspect-ratio.ts`, with the class `LineAspectRatio` and `customElements.define`, `src/aspect-ratio/aspect-ratio.types.ts` with `AspectRatioPreset`, and `src/aspect-ratio/index.ts`, which exports `LineAspectRatio` and `AspectRatioPreset`, as `src/center/index.ts` does; the root `src/index.ts` is unchanged.
- `package.json` gains the `./aspect-ratio` export after `./center` (Phase 1 spec §4.2, `:258`; `packages/line-components/package.json:94-97`), and the Vite build gains the `aspect-ratio/index` entry after `center/index` (`packages/line-components/vite.config.mjs:28`). No new dependency.
- `packages/line-components/__tests__/bundle-splitting.test.ts` gains the `EXPECTED_TAGS` row `'./aspect-ratio': ['line-aspect-ratio']` after `./center` (`:75`). It needs no `ALLOWED_TAG_REFERENCES` row, because the component matches no other tag.
- `line-genui` gains `src/catalog/descriptors/aspect-ratio.ts` with `aspectRatioDescriptor`. `src/catalog/index.ts` imports it after `alertDescriptor` (`:15`), adds it to the named exports between `alertDescriptor` and `avatarDescriptor` (`:97-98`), and adds it to the `descriptors` array in catalog-name order, between `alertDescriptor` and `avatarDescriptor` (`:131-132`).
- Aspect Ratio imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`).

### Markup examples

```html
<!-- Default: a square box -->
<line-aspect-ratio>
  <img src="/avatar.jpg" alt="Ada Lovelace">
</line-aspect-ratio>

<!-- A 16:9 video embed -->
<line-aspect-ratio ratio="widescreen">
  <iframe src="https://player.example/v/42" title="Product tour" frameborder="0" allowfullscreen></iframe>
</line-aspect-ratio>

<!-- Any other ratio, through the token -->
<line-aspect-ratio style="--line-aspect-ratio-ratio: 9 / 16">
  <video src="/story.mp4" controls aria-label="Story"></video>
</line-aspect-ratio>

<!-- A caption over an image -->
<line-aspect-ratio ratio="landscape">
  <img src="/harbour.jpg" alt="Harbour at night">
  <p style="align-self: end; margin: 0">Lisbon, 2026</p>
</line-aspect-ratio>

<!-- An icon centred in a square tile; `aria-label` names the icon (`packages/line-components/src/icon/icon.ts:50-51`) -->
<line-aspect-ratio style="inline-size: 4rem">
  <line-center><line-icon library="lucide" name="star" aria-label="Featured"></line-icon></line-center>
</line-aspect-ratio>

<!-- A picture built from several elements, named through an author role -->
<line-aspect-ratio ratio="golden" role="img" aria-label="Revenue by quarter">
  <svg aria-hidden="true">…</svg>
</line-aspect-ratio>

<!-- htmx: the box loads its own media (P7) -->
<line-aspect-ratio ratio="widescreen" hx-get="/poster" hx-trigger="load" hx-swap="innerHTML">
  <p>Loading…</p>
</line-aspect-ratio>
```

A `line` catalog node the surface renders as a framed, centred hint:

```json
{ "id": "frame", "component": "AspectRatio", "ratio": "widescreen", "child": "frame-center" }
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom, `packages/line-components/__tests__/aspect-ratio.test.ts`, which imports `LineAspectRatio` as a value and mounts through `fixture()` from `@open-wc/testing-helpers` and a `mountMarkup` helper, as `grid.test.ts:22-29` does (P8) | registers `line-aspect-ratio` with its class; the shadow root holds only a bare `<slot>`; `ratio` reflects a set value, leaves no attribute when `undefined`, reads `undefined` for an unknown attribute value while the attribute keeps it, and returns to `undefined` when the attribute is removed; computed `display: grid` and, through the literal fallbacks, `aspect-ratio: 1 / 1` and `--line-aspect-ratio-ratio: 1` with no attribute and with an unknown value, and each `ratio` value's literal ratio, as P8 read for `widescreen` and `golden` (F6 (b)); `hidden` computes `display: none`; no `role`, `aria-*` or `tabindex` on a fresh host and `internals.role` `null`; no event, by a `dispatchEvent` spy over setting every value |
| Browser | Playwright `packages/line-components/__tests__/integration/aspect-ratio/aspect-ratio.e2e.ts` on chromium, firefox and webkit, over fixture pages under `integration/aspect-ratio/`. The page opens only after `customElements.whenDefined` resolves for `line-aspect-ratio`, `line-center`, `line-kbd`, `line-stack` and `line-grid`, as `integration/center/center.e2e.ts:29` does for its tags. Each test waits, after it mounts its markup, for the `updateComplete` of every `line-*` element it mounted, then for every slotted `<img>` to fire `load` (or resolve `img.decode()` once `complete`), and then for two `requestAnimationFrame`s before it reads a box, because a box read right after mount measures 0 × 0 or the row's height (P4, command 32) | in a 400 px wrapper, the six `ratio` heights within 0.05 px (400, 300, 533.33, 225, 111.11, 247.22), an unknown value and no attribute at 400; `--line-aspect-ratio-ratio: 21 / 9` from a page rule at 420 × 180 and over `ratio="widescreen"`, and inline `aspect-ratio: 2` at 400 × 200 (P3); the no-tokens twin page draws the same six heights (F6 (b)); the P2 children of (a): an img, a portrait img, an img 600 × 800, a video, a video 640 × 360, an iframe with and without its border, each 400 × 225 at 0,0, with computed `object-fit: cover` on the img and the video and a consumer `object-fit: contain` winning; a sized 50 × 50 img at 0,0, and at 350,0 under `dir="rtl"`; a caption with `align-self: end` whose top equals 225 minus its measured height within 1 px, which keeps the font out of the assertion; a 600 px div child clamped to 400 × 225 and a 150-word paragraph whose text overflows the 225 px box while the box stays 400 × 225 (P2, P5); the P4 parents: a vertical `<line-stack>` at its default `align` (400 × 225) and with `align="center"` (80 × 45), a plain flex column (400 × 225, the chromium guard of D9), a horizontal `<line-stack>` at its defaults with a 200 × 300 sibling (80 × 300), with `justify="stretch"` (792 × 445.5) and with `justify="stretch" align="start"` and a 600 px sibling (792 × 445.5), `<line-grid columns="3">` at 900 px (294.66 × 165.73 within 0.05), the same Grid with a `height: 600px` `<div>` as the next item at the default `align` (294.66 × 600, both within 0.05) and with `align="start"` (294.66 × 165.73 within 0.05); under `justify-items="center"` beside that item at the default `align`, a box of height 600 within 0.05 whose width is 1066.66 within 0.05 in chromium and webkit and equals its img's 80 px in firefox; under `justify-items="center" align="start"` beside that item, an img box of 80 × 45, a box around a Center holding a Kbd, for which the test first asserts that the Kbd's measured width is greater than 0, so an undefined `line-kbd` fails the case instead of passing it at 0 × 0, and then that the box is as wide as that width and as tall as that width × 9 / 16, each within 0.05, and an empty box of 0 × 0; `block-size: 90px` (160 × 90) and `writing-mode: vertical-rl` (533.33 × 300); `hidden` (`display: none`) and a consumer `:not([hidden])` display rule; Tab skips the host and enters a slotted button; the tree through `ariaSnapshot()` in three engines and a Chromium CDP `Accessibility.getFullAXTree` assertion that a role-less host adds no node and an img child reads `image "<alt>"`, and that `role="img"` with `aria-label` reads as one named image (P1; D20) |
| A11y | axe-core, `packages/line-components/__tests__/a11y/aspect-ratio.e2e.ts` | zero violations (MANIFESTO Law 3) in every story of D15 (Phase 1 spec §7.4) |
| htmx | Playwright `*.e2e.ts` through the shared harness `@websublime/line-testing/htmx` (`packages/line-testing/src/htmx.ts`), on htmx 2 and htmx 4 in chromium, firefox and webkit | `n/a`. Aspect Ratio is neither value-bearing, because its descriptor binding map names no value prop, nor compound, because it holds no interactive element of its own (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`; plan §2.4, `docs/plans/01-plan-core-primitives.md:174-177`). P7 ran `innerHTML` and `outerHTML` swaps on htmx 2.0.11 and 4.0.0 in three engines, and both sized the swapped content, so Aspect Ratio needs nothing from htmx. This confirms the Phase 1 spec's "`n/a` expected" (§6.C.4 C19 row, `:1175`; §10 SD34, `:2381`; D14) |
| Visual | Playwright `packages/line-components/__tests__/visual/aspect-ratio.visual.ts` on the `visual` project | every story of D15 with Linux baselines from a `visual-baselines.yml` run (Phase 1 spec §6.C.6, `:1233`; §10 SD98) |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts`; Playwright axe in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` | a `line` catalog `AspectRatio` node with `ratio: "widescreen"` and a Center `child` holding a Kbd renders `<line-aspect-ratio ratio="widescreen"><line-center><line-kbd keys="mod+k"></line-kbd></line-center></line-aspect-ratio>` (P9); a node with no props renders an empty `<line-aspect-ratio>` with no attribute and raises nothing; an `accessibility.label` and `.description` set no `aria-label` or `aria-description`; `ratio: "16/9"` raises `VALIDATION_ERROR` and renders nothing (P9); the node joins the surface render fixture and the surface axe test (Phase 1 spec §6.C.6, `:1231`; D17) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the CEM coverage and drift tests pass with the new descriptor, the drift test checking the `ratio` attribute and the default slot (Phase 1 spec §6.G.5); `catalog.json` holds `AspectRatio` and its inline projection validates (§6.G.2; P9); the `AspectRatio` tool takes the tool description, stays at or under 1024 characters, passes the backtick guard and carries `ratio` only (§6.G.3, `:1422-1423`, `:1434`); the lists and counts change as the Agent contract says (D17) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./aspect-ratio` register `line-aspect-ratio` only, and the isolation scan finds no other component's module or tag in its bundle (Phase 1 spec §7.5). `packages/line-components/__tests__/manifest-paths.test.ts` reads the packed `custom-elements.json`, as for Grid and Center (`:398-427`): `line-aspect-ratio` resolves to `src/aspect-ratio/aspect-ratio.ts`; its own public field is `ratio`; its events are empty; its slots are `['']`; it has no parts and one `@cssprop`, `--line-aspect-ratio-ratio` (ARCH §17.2 C7; D19) |

- PRD §5.2 checklist mapping (`docs/PRD.md:536-545`; Phase 1 spec §6.C.6, `:1222`). (1) Render runs in the Unit tier. (2) Reactive props run in the Unit tier, for reflection and computed values, and in the Browser tier, for sizes. (3) Slots run in the Browser tier, where slotted children fill the cell. (4) Parts do not apply, because Aspect Ratio has none. (5) Custom properties run in the Unit tier (computed token) and the Browser tier (consumer token override). (6) Events (none) run in the Unit tier, by the `dispatchEvent` spy, and in the Packaging tier, by the CEM assertion. (7) Keyboard (Tab skips the host) runs in the Browser tier (§10 SD99). (8) axe runs in the A11y tier.
- §6.C.6 obligations. The Storybook docs land as D15 says, the `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` row and the READMEs as D18 says, and the CEM JSDoc as D19 says. The size report runs through the "Size report" step against the < 5 KB soft target (Phase 1 spec §7.6, `:2144`; P12), and the changeset follows PROCESS §6. No other component is imported (Bundle). The Agent contract is filled above. The htmx row is `n/a` with its reason. The surface fixture and surface axe rows are above (`:1231`). No update-rate measurement, because Aspect Ratio is not a machine row (`:1232`). The visual tier is the row above (`:1233`).
- The axe and visual tests run against the Storybook stories on port 4320, with the story list and `readyAspectRatioStory(page, id)` in `packages/line-components/__tests__/aspect-ratio-stories.ts`, after `readyCenterStory` in `center-stories.ts:24-36`. It waits until every `line-aspect-ratio`, `line-center`, `line-icon`, `line-stack` and `line-grid` of the story is defined and has updated, until every `<img>` of the story has decoded, because media size the visual baselines, and until the story shows its icon glyphs, by counting `#storybook-root line-icon svg` against the story's glyph count, as `waitForIconStory` does (`packages/line-components/__tests__/icon-stories.ts:26-36`), because a `line-icon` draws its `<svg>` only once the registry has fetched the file (D15). The layout and tree tests use the fixture pages under `packages/line-components/__tests__/integration/aspect-ratio/`, served by the existing port-4321 `webServer` (`playwright.config.ts:23-28`).
- `integration/aspect-ratio/index.html` sets `body { margin: 0; font: 16px/1.5 sans-serif }`, as `integration/center/index.html` does, and loads `integration/aspect-ratio/fixture.ts`. The fixture imports the built `@websublime/line-components/aspect-ratio`, `./center`, `./kbd`, `./stack` and `./grid` by package name, every component a Browser case mounts, and `@websublime/line-tokens/aspects`, `./sizing` and `./layouts`. `integration/aspect-ratio/no-tokens.html` and `no-tokens.ts` import the component alone, as Grid's no-tokens twin does (`packages/line-components/__tests__/integration/grid/no-tokens.html`). Media are inline SVG data URLs and an `<iframe srcdoc>`, so no test reaches the network. Each test mounts its markup into `<main>` inside a wrapper of a set width.
- No Browser-tier assertion depends on the font. The caption and paragraph cases measure their own boxes first, because the fixture's `sans-serif` resolves to a different font on the CI runner (`ubuntu-latest`, `.github/workflows/checks.yml:9`) than on macOS (`docs/context/01-c18.md`, review gate round 1).

### Competitive analysis row

The C19 PR appends this row to the §4.1 table of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md`, in catalog order after `Alert`, from P11, checked 2026-11-17 (Phase 1 spec §6.C.6, `:1226`; D18). The Notes cell states the decided design.

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Aspect Ratio[^4.1-aspect-ratio] | `<line-aspect-ratio>` (`@websublime/line-components/aspect-ratio`, spec `0021-aspect-ratio.md`) | — | — | — | — | `AspectRatio` | `AspectRatio` | — | Radix Primitives and Bits UI ship an `AspectRatio` that takes a numeric `ratio`, default 1, and draws it with a `padding-bottom` wrapper around an absolutely positioned inner element, leaving media sizing to the author. Web Awesome ships `wa-frame` utility classes (square by default, `:landscape` 16:9, `:portrait` 9:16, `overflow: hidden`, media `object-fit: cover`), Fluent's `<fluent-image>` takes `fit` and no ratio, Ark's `ImageCropper` takes `aspectRatio` for its crop area, and Spectrum and Lion ship none. Outside the table, Chakra UI's `AspectRatio` (default 4:3, one child, children absolutely filled and centred with `overflow: hidden`, media `cover`) and Mantine's `AspectRatio` (default 1, `aspect-ratio` on each child, media `cover`) take a numeric ratio; Chakra's `aspectRatios` tokens hold the six values of the `line-tokens` `aspects` family. `<line-aspect-ratio>` uses CSS `aspect-ratio` on the host, takes the six token names through `ratio` and any other ratio through `--line-aspect-ratio-ratio`, stretches every child over one grid cell, crops media with `cover`, never clips, and adds no role. |

The footnote reads `[^4.1-aspect-ratio]: Aspect Ratio, checked 2026-11-17; line://ui cell updated <merge date> (shipped). line://ui: shipped by ledger row 01-C19 at @websublime/line-components/aspect-ratio (packages/line-components/src/aspect-ratio/aspect-ratio.ts, spec 0021-aspect-ratio.md), PRD §4.1.` followed by one source per cell, from the P11 table, each `npm pack` of the version P11 names, with the file and line it cites.

### Spec drift found

| # | Where | Finding | Kind |
|---|---|---|---|
| 1 | Phase 1 spec §6.G.3 (`:1405`, `:1434`), §6.G.4 (`:1516`), §10 SD47 (`:2394`), Status line (`:3`) | these places name the components whose surface node takes no host name and whose tool carries no accessibility parameters: Alert, Center, Grid, Icon, Kbd, Skeleton and Stack. F8 (a), `hostNaming: never`, adds Aspect Ratio. Phase 1 spec AM-103 (`:2564`) adds it to all four lists and names AM-103 in the Status line, as AM-098 did for Kbd (`:2559`), AM-099 for Skeleton (`:2560`), AM-101 for Grid (`:2562`) and AM-102 for Center (`:2563`) | changes a design choice in an approved document, a ratchet trigger decided by Miguel on 2026-11-17 (Phase 1 spec AM-103) |
| 2 | Phase 1 spec §6.G.3 Acceptance (`:1438`) | it names Button, Separator and Stack as the descriptors that set a tool description, while Alert, Avatar, AvatarGroup, Badge, ButtonGroup, Center, Grid and IconButton set one too (`packages/line-genui/README.md:92`). Aspect Ratio sets one (D13) | not drift for this row; the list reads as examples, as `0020-center.md` Spec drift item 2 recorded |
| 3 | Phase 1 spec §6.C.4 C19 row (`:1175`) | the htmx cell reads "`n/a` expected [INFERENCE]". P7 confirms it | no drift; confirmation |
| 4 | PRD `:1523`; `packages/line-tokens/src/aspects.css:8-13` | the PRD lists the family as "(16/9, 4/3, 1/1, etc.)", and the file holds those three plus 3 / 4, 18 / 5 and 1.618 / 1. `ultrawide` is 18 / 5 (3.6:1), not 21:9, the same value Chakra UI's `ultrawide` token holds (P11) | no drift; record only. The descriptions state each value so agents need not guess |
| 5 | PRD §4.1 (`:268`), "for responsive media"; Phase 1 spec §6.C.4 C19 row (`:1175`, `agentExposed: true`) | the `line` catalog holds only `line` descriptors and a surface renders one catalog id (`packages/line-genui/src/catalog/line.ts:84-93`), so a `line` agent cannot place an `Image` or a `Video` in the box (P9). Its agent use is a frame for a Center, a Stack, an Avatar, an Icon or a Skeleton | no drift; `agentExposed: true` still holds. F7 weighs it |
| 6 | `0016-skeleton.md`; `packages/line-components/src/skeleton/skeleton.ts:60`, `:120-121` | a `<line-skeleton>` in the box is stretched to it but draws a 20 px bar, and `--line-skeleton-block-size: 100%` draws nothing, because the item part's percentage block size has no definite height to resolve against [INFERENCE: cause] (P4) | evidence about an approved spec; no edit proposed here. A "media placeholder" recipe would need a Skeleton change in its own row |
| 7 | the dispatch's locator for the `./aspect-ratio` export, "§4.2 `:257`" | the export line is `:258`; `:257` is `./center` | not drift; this spec cites `:258` |

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| F1 | Which ratios does `ratio` accept, and how does any other ratio reach the box? | Miguel | decided: option (a), six token names through `ratio` and any other ratio through `--line-aspect-ratio-ratio` (Miguel, 2026-11-17) |
| F2 | Which CSS technique holds the ratio, and where do the children go? | Miguel | decided: option (a), a one-cell grid whose stretched children share the cell (Miguel, 2026-11-17) |
| F3 | What happens to content larger than the box? | Miguel | decided: option (a), the box keeps the ratio and content spills visibly (Miguel, 2026-11-17) |
| F4 | How do images and videos fit the box? | Miguel | decided: option (a), `object-fit: cover` on slotted `img` and `video` (Miguel, 2026-11-17) |
| F5 | Which ratio does a box with no `ratio` draw? | Miguel | decided: option (a), `square` (Miguel, 2026-11-17) |
| F6 | What does the box draw without `line-tokens`? | Miguel | decided: option (b), literal fallbacks equal to the `aspects` token values (Miguel, 2026-11-17) |
| F7 | Which props reach agents, in which catalog, and through which slot kind? | Miguel | decided: option (a), `ratio` and `child` (`ComponentId`), in the `line` catalog only (Miguel, 2026-11-17) |
| F8 | Does the surface name an Aspect Ratio host, and does its tool carry accessibility parameters? | Miguel | decided: option (a), `hostNaming: never` and no accessibility parameters, through Phase 1 spec AM-103 (Miguel, 2026-11-17) |

**Drafter defaults** (Miguel left D1–D22 as drafted, 2026-11-17)

| # | Default | Basis |
|---|---------|-------|
| D1 | Static, with no machine, no states and no events; neither value-bearing nor compound; not form-associated | ARCH §8, `:410`; Phase 1 spec §6.C.4 C19 row, `:1175`; ARCH §17.2 C3, C9 |
| D2 | The host is the grid container; the shadow root holds only a bare `<slot>`; no parts | `0018-stack.md` Open Question 1, `0019-grid.md` D2 and `0020-center.md` D2 (an inner wrapper puts a `generic` between a host role and its children); probes P1 E, F and P2 |
| D3 | `:host([hidden]) { display: none }`, as the last rule of the stylesheet | probe P5; Button's rule (`packages/line-components/src/button/button.ts:129-131`); `0019-grid.md` D3; `0020-center.md` D3 |
| D4 | `commonReset` is the only reset module | ARCH §14.7, `:1163` ("all Static") |
| D5 | No role, no ARIA attribute and no internals value on the host; an author `role` stays; the docs show the `role="img"` recipe (with `alt=""` on decorative inner images) and the `role="group"` recipe, and advise against a role-less `aria-label` | R8 `:55`, `:83`; probe P1 C–F |
| D6 | No focus on the host, no key handling, no `delegatesFocus`, no `tabindex` | R8 `:83` Keyboard "None"; probe P1 (Tab skips the host) |
| D7 | The attribute and property are named `ratio`, as in Radix, Bits, Chakra and Mantine; the component's own token is `--line-aspect-ratio-ratio`, the `--line-{component}-*` form of ARCH §17.2 C6 with the component name `aspect-ratio` | probe P11; `--line-grid-columns` (`packages/line-components/src/grid/grid.ts:64`) |
| D8 | `ratio` converts an unknown value to `undefined` with a local copy of Grid's `variantConverter` (`packages/line-components/src/grid/grid.ts:16-19`; Props) and no default value; the stylesheet draws `square` without an attribute; nothing throws | ARCH §17.2 C8; MANIFESTO Law 9; `0019-grid.md` D9 (variants follow the same pattern); probes P8 and P9 (the surface removes the attribute of an unset prop) |
| D9 | `min-block-size: 0` on `:host` | probe P4, command 11 (chromium grows a flex-item box to its content without it; firefox and webkit do not) |
| D10 | The ratio stays physical width to height in every writing mode; the component sets no `direction`, `order` or `writing-mode` | probe P6; CSS `aspect-ratio` is physical; `LineElement` already owns `direction` (`0018-stack.md` AM-001) |
| D11 | `agentExposed: true` | Phase 1 spec §6.C.4 C19 row, `:1175`; SD38 names three other components (`:2385`); a layout box adds no text and paints within the surface, so neither SD38 reason applies (`:1336`, `:1338`) |
| D12 | Catalog name `AspectRatio`, the PRD row name without its space, because a tool name matches `^[a-zA-Z0-9_-]{1,64}$` (Phase 1 spec §6.G.3; §10 SD49); `line` catalog only; the `basic` map keeps its 10 types | PRD `:268`; probe P10 (no basic ratio type in v0.9 or v0.9.1); Phase 1 spec §6.G.2, `:1371`, `:1373` |
| D13 | The descriptor sets a tool description that differs from the agent-facing description only in naming the child | Phase 1 spec §6.G.3, `:1423` (a description that names a `ComponentId` prop needs one); `0018-stack.md` AM-006; probe P9 |
| D14 | htmx row `n/a` | Phase 1 spec §10 SD34; ARCH §17.2 C9; plan §2.4; probe P7 |
| D15 | `apps/storybook/stories/components/aspect-ratio.stories.ts` with `title: 'Components/Primitives Base/Aspect Ratio'` (PRD §4.1 heading "Primitives Base", `docs/PRD.md:245`), the pinned meta `id: 'components-aspect-ratio'`, `tags: ['autodocs']`, the imports `@websublime/line-components/aspect-ratio`, `./center`, `./icon`, `./stack` and `./grid` and `@websublime/line-tokens/aspects`, `./sizing` and `./layouts`, because the stories hold an Aspect Ratio, a Center, an Icon, a Stack and a Grid and draw the token ratios, while the Storybook preview loads only `line-colors` and `line-themes` (`apps/storybook/.storybook/preview.ts:3-4`); the icon registry set up as `icon.stories.ts` does it (`apps/storybook/stories/components/icon.stories.ts:1`, `:4-6`, `:19-20`, `:22`), with `setIconRegistry` from `@websublime/line-components`, `IconRegistry` from `@websublime/line-icons` and the Lucide resolver from `@websublime/line-icons/resolvers/lucide` over `base: './icons/lucide/'`; the stories Default, Ratios (all six), Media (an img; a `<video controls aria-label="Intro">` with no source, as P1 H and P2 probed; and an `<iframe srcdoc>` with a `title`), Custom ratio (the token), Caption overlay, Icon tile (a 4rem square box holding a `<line-center>` with `<line-icon library="lucide" name="star" aria-label="Featured">`, the self-hosted `apps/storybook/public/icons/lucide/star.svg`, one glyph), In a Grid (`align="start"`), In a horizontal Stack (`align="start"` with `flex: 1`), Long content (the spill) and Author image role; media as inline SVG data URLs; a `DESCRIPTION` that carries the flex-row warning, the Grid warning (a taller item in a `<line-grid>` row at its default `align` stretches the box, and `justify-items` other than `stretch` can widen it past its column; keep `justify-items` at `stretch` and set `align="start"`), the spill warning, the `:not([hidden])` form, the bare-text advice of D21 and the names advice of D5 | the template's Storybook rule (`docs/specs/COMPONENT-SPEC-TEMPLATE.md:213`); `0020-center.md` D14; the review-gate finding on unimported tokens (`docs/context/01-c18.md`, round 1) |
| D16 | The Browser tier runs on fixture pages under `integration/aspect-ratio/` with a sized wrapper per case and a no-tokens twin, and reads boxes relative to the host, as P2 did. The fixture imports and awaits the definition of every component a case mounts (`./aspect-ratio`, `./center`, `./kbd`, `./stack`, `./grid`), and each box is read only after the mounted elements' `updateComplete`, every slotted `<img>`'s `load` (or resolved `decode()`) and two `requestAnimationFrame`s | probes P2–P4; probe P4, command 32 (boxes read right after mount measure 0 × 0); Grid's Browser tier and twin (`packages/line-components/__tests__/integration/grid/`) |
| D17 | The genui tests and the surface fixture change as the Agent contract lists; the made-up tag stays `line-spinner` | Phase 1 spec §6.C.6, `:1231`; the locators in the Agent contract; `0020-center.md` D16 |
| D18 | The C19 PR also adds the Aspect Ratio row and footnote of Competitive analysis row to `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1, writes the Storybook docs, adds a `## Aspect Ratio` section to `packages/line-components/README.md` after `## Center` (`:666`) with the flex-row warning, the Grid warning (keep `justify-items` at `stretch` and set `align="start"` on a `<line-grid>` whose rows hold taller items), the spill warning and the `:not([hidden])` form, updates the `takesAccessibility` JSDoc in `packages/line-genui/src/catalog/tools.ts:139-143` to name AspectRatio (`never`) and cite AM-103 (F8 (a)), and adds `aspectRatioDescriptor` to the export table and the tool lists of `packages/line-genui/README.md` (`:39`, `:92`, `:124`, `:125`, `:144`) | Phase 1 spec §6.C.6, `:1223-1227`; `0020-center.md` D17 |
| D19 | The class JSDoc says what the component is for, that each child fills the box unless it sets its own size, that media are cropped with `cover`, that long content spills, that bare text takes its own row, that in a flex row the box needs a width or `flex: 1` and start alignment, that in a `<line-grid>` at its default `align` a taller item in the row stretches the box past its ratio and `justify-items` other than `stretch` can widen it past its column, so the Grid needs `align="start"` and the default `justify-items`, and the `:not([hidden])` form; `@summary`; `@slot` for the default slot; `@cssprop [--line-aspect-ratio-ratio=var(--line-aspect-square, 1)]` | ARCH §17.2 C7; Grid's JSDoc pattern (`packages/line-components/src/grid/grid.ts:22-45`) |
| D20 | The Browser tier proves the tree with `ariaSnapshot()` in three engines and a Chromium CDP assertion, and runs no `INTERNALS` read-back | Phase 1 spec `:1180` applies to internals roles, and Aspect Ratio sets none (D5); probe P1; `0020-center.md` D19 |
| D21 | The docs advise wrapping text in an element, because a bare text node beside an element takes an implicit second row of the grid | probe P2 (img 400 × 201, text at y 204); `::slotted()` matches elements only |
| D22 | No inline display and no `inline` prop; the docs show `line-aspect-ratio:not([hidden]) { display: inline-grid }` with a width | `0020-center.md` F3 (a), decided by Miguel on 2026-11-16; probes P4 (inline row) and P5 |

Miguel decided F1–F8 on 2026-11-17, each on the option the draft recommended, and left D1–D22 as drafted. Each section below states the decision, and its option table stays as the record of what he weighed.

### F1 — Ratio values

**Decision.** Miguel chose option (a) on 2026-11-17, so `ratio` takes the six `line-tokens` names as a C6 variant, and any other ratio goes through `--line-aspect-ratio-ratio` in consumer CSS.

**Evidence.** The `line-tokens` `aspects` family holds six named ratios (`packages/line-tokens/src/aspects.css:8-13`; PRD `:209`, `:1523`), and a C6 variant may set only the defaults of the component's own tokens (ARCH §17.2 C6). Through attribute rules the six names draw their ratios in three engines, and the component's own token takes any other ratio from consumer CSS or an inline style (P3). No engine reads a ratio from an attribute through CSS alone, because typed `attr()` draws nothing in chromium, firefox or webkit (P3). A free ratio needs JavaScript. A Lit binding in a shadow `<style>` works in three engines, and a raw value injects CSS (`background-color` turned red), so it needs a parser that lets through only positive numbers (P3). MANIFESTO Law 5 says "no styles in TypeScript" [INFERENCE: whether a parsed number bound into a `<style>` counts as a style in TypeScript is a reading of the law, not settled by any document]. On the agent path, an enum rejects `16/9` with a validation error, while a `DynamicString` writes whatever the agent sends, `1; background: red` included, and binds to the data model (P9; Phase 1 spec §6.G.1 requires `DynamicString` for a string prop). Every competitor takes a numeric or string ratio from code, and none takes a token name on the component (P11). The six names leave out common ratios such as 3:2, 9:16 and 21:9, which the token reaches in markup but agents cannot (P3).

| Option | What it decides | Agent path (C1) | Consequence |
|---|---|---|---|
| (a) **Recommended.** Six token names | `ratio="square \| landscape \| portrait \| widescreen \| ultrawide \| golden"`, a C6 variant over the `--line-aspect-*` tokens; any other ratio through `--line-aspect-ratio-ratio` in consumer CSS or an inline style | a closed enum; a bad value is a validation error (P9) | Pure CSS, MANIFESTO Law 5 kept, one design-system vocabulary. Agents reach six shapes only, and markup authors need CSS for 3:2, 9:16 or 21:9 |
| (b) Free ratio string | `ratio="16/9"`, `"16 / 9"`, `"1.5"`; a parser in `aspect-ratio.ts` accepts one or two positive numbers and writes them through a Lit binding in a shadow `<style>` (or the host `style`, or a per-instance sheet); anything else draws the default | a `DynamicString`, bindable; any string passes validation and the component falls back (P9) | Any ratio from markup and agents, as every competitor does. Styles move into TypeScript, the parser becomes security-relevant (P3 injection), and the token family goes unused by the component |
| (c) Both | `ratio` takes the six names or a free ratio string, as in (a) and (b) | a `DynamicString`, so the names lose enum validation for agents | The widest input; two grammars in one attribute, and both costs of (b) |
| (d) A number | `ratio="1.7778"` as a `number` property, written as in (b) | a `DynamicNumber` | Matches Radix and Bits from code; 16:9 and 1:1.618 become rounded decimals in markup (P3 `1.777` draws 225.09), and the costs of (b) remain |

### F2 — Technique and child placement

**Decision.** Miguel chose option (a) on 2026-11-17, so the host is a one-cell grid with `aspect-ratio`, and slotted elements share the cell with `place-self: stretch` and `max-*` sizes of `100%`.

**Evidence.** CSS `aspect-ratio` works in three engines (P2, P3). In probe P2 a one-cell grid with `minmax(0, 1fr)` tracks, `place-self: stretch` and `max-*` sizes of `100%` (a) holds the box at 400 × 225 and fills it with every child of `auto` size, including images and videos that carry `width` and `height` attributes and a bordered iframe; a child with its own smaller size stays at the start corner, and a caption with `align-self: end` sits at the bottom. Slotted `100%` sizes (a′) add an iframe's border and stop `align-self`. A block host (b) leaves media at their natural size and grows with content. The padding wrapper (c), the Radix and Bits technique, and absolute children on an `aspect-ratio` host (d), the Chakra placement, fill the box but add an iframe's border; (c) also drops a bare text node below the box. Several children overlap in (a), (c) and (d) and stack in (b). Stack, Grid and Center keep the host as their layout container over a bare slot (D2).

| Option | What it decides | Media children | Several children | Consequence |
|---|---|---|---|---|
| (a) **Recommended.** One-cell grid | `display: grid`, one `minmax(0, 1fr)` cell, `aspect-ratio` on the host; slotted elements share the cell with `place-self: stretch` and `max-*` sizes of `100%` | fill the box, whatever their size attributes (P2) | overlap in source order; a child aligns itself with `align-self`/`justify-self` (P2 caption) | Holds the ratio with any content; overlays need no positioning. A bare text node beside an element takes a second row (D21) |
| (b) Block host | `display: block; aspect-ratio`; children in flow | keep their natural size unless the consumer sizes them (P2) | stack top to bottom | The CSS default; the box grows with content (F3 (c)). Media need consumer CSS to fill |
| (c) Padding wrapper | a `::before` with `padding-block-end: calc(100% / ratio)`, absolutely positioned children | fill the box; a bordered iframe overflows by its border (P2) | overlap | The pre-`aspect-ratio` technique of Radix, Bits and Chakra; no computed `aspect-ratio`; bare text sits below the padding and grows the box (P2) |
| (d) Absolute children | `aspect-ratio` on a block host, slotted `position: absolute; inset: 0` | fill the box; a bordered iframe overflows by its border | overlap | Bare text flows at the top; children cannot align through grid properties, and the host becomes the containing block of their absolutely positioned descendants [INFERENCE] |

### F3 — Content larger than the box

**Decision.** Miguel chose option (a) on 2026-11-17, so the box keeps the ratio, sets no `overflow`, and content taller than the box spills past its bottom edge.

**Evidence.** Under (a) the box keeps 400 × 225 with a 150-word paragraph inside, whose text runs 546 px and overlaps what follows the box (P5). `overflow: hidden` or `clip` on the host clips that text and hides the outside focus ring of a control that fills the box in all three engines; `overflow-clip-margin` restores the ring in chromium only (P5). A consumer `overflow` rule on the host beats `:host` (P5). A box that grows with its content needs a block host, because a grid with an `auto` row is not interoperable (P2 (y)). WCAG 1.4.4 and 1.4.10 ask that enlarged text stay available; Center chose to keep oversized content reachable (`0020-center.md` F8). Web Awesome's `wa-frame` and Chakra's children clip with `overflow: hidden`; Radix and Mantine do not (P11).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Hold the ratio, spill visibly | no `overflow` rule; content taller than the box overflows past its bottom edge | Nothing is cut off and focus rings stay visible. Long content overlaps what follows the box; rounded or cropped frames take `overflow: hidden` from the consumer (Consumer styling) |
| (b) Hold the ratio, clip | `overflow: hidden` on `:host` | Clean edges for media and rounded corners. Text enlarged by zoom is cut off, and controls that fill the box lose their outside focus ring (P5; WCAG 2.4.7) |
| (c) Grow with content | a block host (F2 (b)); the ratio is a minimum | No overlap and no clipping. The box no longer keeps a fixed ratio when content is tall, and media need consumer sizing to fill it (P2 (b)) |

### F4 — Media fit

**Decision.** Miguel chose option (a) on 2026-11-17, so slotted `img` and `video` take `object-fit: cover`.

**Evidence.** Stretched to the box, an image keeps the UA `object-fit: fill` and distorts, and a video keeps the UA `contain` and letterboxes (P2 `fit` column). `object-fit: cover` on slotted `img` and `video` crops both to the box, and a consumer `object-fit` on the child wins over it (P2). Chakra, Mantine and Web Awesome's `wa-frame` set `cover`; Radix and Bits set nothing (P11). A2UI `Image.fit` offers `contain`, `cover`, `fill`, `none` and `scaleDown`, default `fill`, and the `basic` map binds nothing to it (P10). Fluent's `<fluent-image>` takes `fit` (P11).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `cover` on slotted `img` and `video` | `::slotted(:is(img, video)) { object-fit: cover }` | Media fill the box without distortion by default; the consumer sets `contain` on the child to letterbox (P2). It is a visual default, one the library's peers share |
| (b) None | the UA defaults: images distort to fill, videos letterbox | No visual opinion. Every author must add `object-fit`, and an image without it distorts |
| (c) A `fit` prop | `fit="cover \| contain \| fill \| none \| scale-down"`, default `cover`, written on slotted media | Agents and markup choose the fit; one more attribute whose rules reach into slotted content, and `line` agents have no `Image` to apply it to (P9) |

### F5 — Default ratio

**Decision.** Miguel chose option (a) on 2026-11-17, so a box with no `ratio` is square.

**Evidence.** With no attribute the probe draws a square through `--line-aspect-square` (P3). Radix, Bits and Mantine default to 1; Chakra defaults to 4:3 (P11). Without any ratio, an empty box has no height and a box holding an image takes the image's ratio (P3 no-tokens rows). The surface removes the attribute of an unset prop, so an agent node with no `ratio` draws the default (P9).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `square` | no attribute draws 1:1 | Matches the first token name, Radix, Bits and Mantine; a box always has a height |
| (b) None | no attribute sets no `aspect-ratio`; the box sizes to its content | The component does nothing until configured; an empty box collapses to zero height (P3) |
| (c) `widescreen` | no attribute draws 16:9 | Fits video, the PRD's "responsive media"; differs from every competitor's default |

### F6 — Without `line-tokens`

**Decision.** Miguel chose option (b) on 2026-11-17, so each `--line-aspect-*` token is read with a literal fallback equal to its value in `aspects.css`.

**Evidence.** Without the `aspects` tokens and with no literal fallback, every `ratio` computes `aspect-ratio: auto`, so an empty box has no height and an image sets its own ratio (P3). With literal fallbacks equal to the token values, all six ratios draw unchanged without the tokens (P3, command 19), and happy-dom reads them in the Unit tier (P8). The fallbacks cost 32 B gzipped (P12). Grid reads its size and gap tokens with no literal fallback (`0019-grid.md` D8); AvatarGroup and Avatar read `--line-focus-ring` and `--line-gray-1` with literal fallbacks (`packages/line-components/src/avatar-group/avatar-group.ts:74-75`). A consumer who redefines `--line-aspect-widescreen` changes every `widescreen` box under (a) and (b) [INFERENCE: from `var()` substitution; not probed].

| Option | What it decides | Consequence |
|---|---|---|
| (a) No literal fallback | `var(--line-aspect-<name>)` only | One source of truth for the values; without `line-tokens` the component loses its ratio and an empty box collapses (P3) |
| (b) **Recommended.** Literal fallbacks | `var(--line-aspect-<name>, <value>)` with the values of `aspects.css` | Works with or without `line-tokens`, and the tokens still retheme every box. The six values live in two places, so a token value change needs the matching fallback change [INFERENCE: no check enforces it yet] |
| (c) Own literals | the component writes the six ratios itself and reads no `line-tokens` token | Fully standalone; the design-system family no longer drives the component, and a consumer retheme of `--line-aspect-*` has no effect |

### F7 — Agent props, catalog and slot kind

**Decision.** Miguel chose option (a) on 2026-11-17, so the descriptor exposes `ratio` and `child` (`ComponentId`), in the `line` catalog only.

**Evidence.** In probe P9 `ratio` and `child` (`ComponentId`) reach the `line` catalog, the inline projection validates, and the three providers' tools carry `ratio` alone. The surface renders an AspectRatio node with one child, and a Stack child carries several; a `child` list fails validation, and a `ChildList` stub renders several overlapping children with no error. The `line` catalog has no `Image` or `Video`, so a `line` agent frames line components only, of which a Center or a Stack fills the box, an Avatar keeps its own size and a Skeleton draws a 20 px bar (P4, P9). No basic type has a ratio (P10). Center and A2UI `Card` take one `child` (`0020-center.md` F6; P10); Chakra's `AspectRatio` takes exactly one child (P11). The Phase 1 spec C19 row sets `agentExposed: true` (`:1175`), and SD38 names three exceptions (`:2385`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `ratio` and `child`, `line` catalog only | `ratio` enum; `child` (`ComponentId`) to the default slot; no basic mapping | One contract, "frame one thing", that matches Center and A2UI `Card`; several children go through a Stack (P9). Agents frame line components only |
| (b) `ratio` and `children`, `line` catalog only | `children` (`ChildList`) to the default slot | Agents can overlay several children, each over the whole box, which they cannot align, because the tool has no per-child alignment (P2, P9) |
| (c) `agentExposed: false` | no descriptor in the catalogs or tools, with a recorded reason | Admits that agents have no media to frame. Changes the Phase 1 spec C19 row (`:1175`) and SD38 (`:2385`), a `decision` with an AM, and loses the frame and tile uses of P9 |

### F8 — Host naming on the agent path

**Decision.** Miguel chose option (a) on 2026-11-17, so the descriptor takes `hostNaming: never`, the AspectRatio tool carries no accessibility parameters, and Phase 1 spec AM-103 adds Aspect Ratio to the four lists of components that take no host name.

**Evidence.** The host is a `generic` with no role (R8 `:83`; P1). A host `aria-label` names that `generic` in the Chromium tree, which ARIA 1.2 prohibits, and axe does not report it (P1 C, D). The descriptor kinds are `always`, `never`, `listRole` and `unlessTrue` (`packages/line-genui/src/catalog/descriptor.ts:160-174`). Kbd, Skeleton, Grid and Center took `never` through AM-098, AM-099, AM-101 and AM-102 (`:2559`, `:2560`, `:2562`, `:2563`). P9 rendered a `never` AspectRatio with no name and a tool with no accessibility parameters. An author `role="img"` with `aria-label` names the box as one image (P1 E).

Option (a) changes the APPROVED lists in Phase 1 spec §6.G.3 (`:1405`, `:1434`), §6.G.4 (`:1516`) and §10 SD47 (`:2394`), which name the components that take no host name and whose tool carries no accessibility parameters. Phase 1 spec AM-103 (`docs/specs/01-spec-core-primitives.md:2564`), trigger `decision`, adds Aspect Ratio to them and names AM-103 in the Status line (`:3`), as AM-102 did for Center, and it raised the row's class from `task` to `decision` (PROCESS §2).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `never` | the surface sets no `aria-label` or `aria-description` on an AspectRatio node; the tool carries no `accessibilityLabel` or `accessibilityDescription` | Mirrors Kbd, Skeleton, Grid and Center. Raises the class to `decision`; Phase 1 spec AM-103 (`:2564`) adds Aspect Ratio to §6.G.3 `:1405`, `:1434`, §6.G.4 `:1516` and SD47 `:2394` (Spec drift found, item 1) |
| (b) `always` | the surface sets both on every AspectRatio node; the tool carries both parameters | No Phase 1 spec change and the class stays `task`. Every agent label names a `generic`, which ARIA prohibits and no check reports (P1 C) |
| (c) An agent image role | a prop such as `image` makes the surface set `role="img"` on the host and apply the label, with a host naming kind that names only that role | Agents could name a framed composite as one picture (P1 E). A new surface rule and a new `hostNaming` kind, so a Phase 1 spec AM wider than AM-103, and an `img` needs a name, so the descriptor would need a `requiredName` rule for it |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
| AM-001 | 2026-11-17 | ledger 01-C19 (factual correction, approval) | The Status field (`:5`) reads `` `approved` (Miguel, 2026-11-17) `` and the header paragraph (`:15`) says that the spec passed its review gate in four rounds and that Miguel approved it on 2026-11-17, in place of saying that it stays `proposed` | Miguel approved the spec after the review gate round 4 passed, and the header still described the draft state | `docs/context/01-c19.md`, "Review gate (docs), round 1, 2026-11-17", "Review gate (docs), round 2, 2026-11-17", "Review gate (docs), round 3, 2026-11-17" and "Review gate (docs), round 4 (delta), 2026-11-17"; Miguel's approval of `0021-aspect-ratio.md` on 2026-11-17, relayed by the orchestrator |
| AM-002 | 2026-11-20 | ledger 01-Z10 (decision — Miguel, 2026-11-20: PRD v0.8.34, Phase 1 spec AM-113; factual realignment) | Locators only, no design change. PRD: §4.1 Aspect Ratio row `:267` (was `:266`), six times (Tier, PRD catalogue entry, Governing sections, Part A description, Drift row 5, D12); §4.1 heading `:244` (was `:243`), in D15; §1.7 Browser support row `:161` (was `:160`), in What automation cannot observe; §5.2 heading `:516` (was `:515`), in Governing sections; §5.2 checklist `:535-544` (was `:534-543`), twice (Governing sections, Tests); §8.3 `:1216` (was `:1215`), twice (Governing sections, header paragraph); decorative families `:208` (was `:207`), twice (Governing sections, F1 evidence); `aspects` row `:1520` (was `:1519`), three times (Governing sections, Drift row 4, F1 evidence). Plan: §2.4 bullets `:174-177` (was `:172-175`), in the htmx row, which already cited the blank line under the §2.4 heading through the C9 bullet, leaving out the `n/a` bullet, at `6c94403`. Amendment rows keep their locators as record | PRD v0.8.34 adds a one-line revision note above every cited line, so each moved down by one (PROCESS §3, line locators follow the lines) | `docs/PRD.md` (v0.8.34) on `chore/01-z10-release-time-records`; Phase 1 spec §12 AM-113; `docs/plans/01-plan-core-primitives.md` after the 01-Z10 header line (lines from `:9` down moved one), resolved against `git show 6c94403:docs/plans/01-plan-core-primitives.md` |
| AM-003 | 2026-11-25 | ledger 01-Z3 (decision — Miguel, 2026-11-25: PRD v0.8.35, Phase 1 spec AM-115; factual realignment) | Locators only, no design change. PRD: §1.7 Browser support row `:162` (was `:161`); §2.1 `:209` (was `:208`), 2 times; §4.1 heading `:245` (was `:244`); §4.1 Aspect Ratio row `:268` (was `:267`), 6 times; §5.2 heading `:517` (was `:516`); §5.2 `:536-545` (was `:535-544`), 2 times; §8.3 heading `:1219` (was `:1216`), 2 times; §9.9 `aspects` row `:1523` (was `:1520`), 3 times. Amendment rows keep their locators as record | PRD v0.8.35 adds a one-line revision note above every cited line and a two-line Phase 1 status note above the §7.3 exit criteria, so each cited line moved down by one, and each line past §7.3 by three (PROCESS §3, line locators follow the lines) | `docs/PRD.md` (v0.8.35) on `docs/01-z3-phase-01-exit`; Phase 1 spec §12 AM-116 |
