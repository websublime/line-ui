# Spinner

| Field | Value |
|-------|-------|
| Status | `approved` (Miguel, 2026-11-18) |
| Phase | `1` |
| Tier | `Static` (Phase 1 spec §6.C.4 C20 row, `docs/specs/01-spec-core-primitives.md:1176`; PRD §4.1, `docs/PRD.md:268`; ARCH §8, `docs/ARCHITECTURE.md:410`; ARCH §13.5, `docs/ARCHITECTURE.md:622-625`) |
| Tag | `line-spinner` |
| Entrypoint | `@websublime/line-components/spinner` (Phase 1 spec §4.2, `:259`, `:308`; §10 SD12, `:2359`) |
| Form-associated | `no` (Phase 1 spec §6.C.4 C20 row) |
| PRD catalogue entry | PRD §4.1, `Spinner` row (`docs/PRD.md:268`) |
| Ledger row | `01-C20` (`docs/plans/01-tasks-core-primitives.md:66`) |
| Governing sections | Phase 1 spec §4.2 (`:259`, `:308`), §6.C.4 (C20 row `:1176`, notes `:1147-1153`, `:1178-1183`, internals proof `:1180`), §6.C.6 (`:1218-1233`), §6.G.1 (`:1316`, `:1323`, `:1325-1326`, reason table `:1332-1338`), §6.G.2 (`:1371`, `:1373`), §6.G.3 (`:1404`, `:1405`, `:1420-1423`, `:1434`, `:1435`, `:1438`), §6.G.4 (`aria-busy` `:1475`, accessibility `:1510-1518`), §6.G.5, §7.4 (`:2111`), §7.5 (`:2127`), §7.6 (`:2144`), §7.8 (`:2175`), §10 SD4 (`:2351`), SD12 (`:2359`), SD34 (`:2381`), SD36 (`:2383`), SD37 (`:2384`), SD38 (`:2385`), SD39 (`:2386`), SD47 (`:2394`), SD98 (`:2445`), SD99 (`:2446`), §12 AM-005, AM-058 (`:2519`), AM-086 (`:2547`), AM-103 (`:2564`); ARCH §3, §4, §5 (`:306`, `:325`), §8 (`:410`), §12 (`:582`), §13.1 (`:596-597`), §13.5 (`:622-625`), §14.7 (`:1163`), §14.8, §17.2 (`:1566-1580`), §17.3, §17.4 (Theme and Accessibility rows); PRD (v0.8.34) §4.1 (`:268`), §5.2 (`:535-544`), §8.1 (`:1195-1203`); MANIFESTO Laws 1–6, 9, Out of Scope (`docs/MANIFESTO.md:66-67`); R8 (`docs/research/01-research-accessibility.md:84`, `:241`, `:286-287`, `:343`); R7 (`docs/research/01-research-zag-machines.md:76`) |

Miguel decided Open Questions F1–F8 on 2026-11-17, each on the option the draft recommended, and Part A and Part B state those decisions. The drafter defaults D1–D24 stand as drafted (Miguel, 2026-11-17). F7 (a) gives the descriptor the default `hostNaming: always`, which the Phase 1 spec §6.G.4 rule already covers (`docs/specs/01-spec-core-primitives.md:1514`), so the decisions change no Phase 1 spec rule, need no `AM-nnn`, and the row stays at class `task` (PROCESS §2). Text marked `[INFERENCE]` has no probe or source behind it yet. The spec passed its review gate in two rounds, recorded after the F8 option table, and Miguel approved it on 2026-11-18.

---

## Probes

Throwaway probes ran on 2026-11-17 to inform F1–F8 and defaults D2, D5–D12, D16, D18, D19 and D21. Their code lived in `packages/line-components/temp/c20-probe/` and `packages/line-genui/temp/c20-probe/`, which `.gitignore` ignores through its `temp` entry (`.gitignore:4`). Their output, the fetched W3C texts and the competitor packages lived in `/tmp/c20-out/`, `/tmp/c20-results/`, `/tmp/c20-results-run1/` and `/tmp/c20-comp/`, outside the repository. All of them were deleted after the run, and nothing of them is committed.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2.1, arm64; Bun 1.4.3; Node v22.23.3 |
| Runner | Playwright 1.64.0 with its own engines, chromium 156.0.8078.4, firefox 157.0 and webkit 27.2; one config with three projects on the repo's device presets (`Desktop Chrome`, `Desktop Firefox`, `Desktop Safari`, as `playwright.config.ts:31-33`), one worker, a 1600 × 1200 viewport. Pages were served from `http://probe.local` through `route.fulfill`, at the page font `16px/1.5 sans-serif`, with `packages/line-tokens/src/motion.css`, `easings.css`, `sizing.css` and `animations.css` inlined unless a row says "no tokens" |
| Probe component | `line-probe-spinner`, a `LineElement` subclass (`@websublime/line-core` dist, Lit 3.3.3) with `commonReset`. Its final form is the recommended design of Part B, except that Part B re-runs the semantics on `aria-label` and `aria-labelledby` through Icon's `observedAttributes` route (Anatomy) and takes the token curves as easing fallbacks (CSS custom properties). It held one shadow `<span part="root">` drawn as a ring, the seven `--line-spinner-*` tokens, `size` (`1`–`6`) and `speed` (`slow`, `normal`, `fast`) through token defaults with a converter that turns an unknown value into `undefined`, own `@keyframes`, the reduced-motion pulse, the forced-colors rule, and `label`. `willUpdate` wrote the semantics on every update. With a non-blank `label`, host `aria-label` or host `aria-labelledby` it set `internals.role = 'progressbar'`, `internals.ariaHidden = null` and `internals.ariaLabel` from `label`; without one it set `internals.role = null` and `internals.ariaHidden = 'true'`. It observed `aria-label` and `aria-labelledby` as Lit properties so a change re-ran the semantics. Probe-only attributes chose the alternatives: `probe-role` (`progressbar`, `status`, `img`, `none`), `probe-via` (`internals` or `attribute`, the host `role` attribute), `probe-name-via` (`attribute` wrote `label` to the host `aria-label`), `probe-unnamed="keep"` (kept the role with no name), `probe-anim="token"` (`animation: var(--line-animation-spin)` on `root`), `probe-rm` (`stop`, `slow`, `swap` under reduced motion) and `probe-fc` (forced-colors candidates) |
| Probe hosts | `defineVariant(tag, css)`, a plain `HTMLElement` with an open shadow root holding one `<span part="root">` and one adopted sheet, for the keyframe-scope sweep and the no-fallback stylesheet |
| Built components | `packages/line-components/dist/` `button` and `icon-button`, built 2026-11-17 13:15 UTC; no commit since then touches their sources or `line-core` (`git log --since`) |
| htmx | htmx 2.0.11 and 4.0.0 from `node_modules/.bun`, loaded as page scripts, with requests answered by `page.route`; the default indicator CSS of both majors (`htmx.org@2.0.11/dist/htmx.js:5138-5145`; `htmx.org@4.0.0/dist/htmx.js:214-223`) |
| axe | `@axe-core/playwright` 4.14.0 with axe-core 4.14.0, once with the §7.4 tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and once with every rule, per case through `include('#<case>')` |
| Chromium accessibility tree | a CDP session, `Accessibility.getFullAXTree`, walked from each case's wrapper `<div>` through `DOM.querySelector` and `DOM.describeNode`, listing the role, name and the `busy`, `hidden`, `live`, `atomic`, `relevant`, `focusable`, `disabled` and value properties of every node that is not ignored |
| `INTERNALS` read-back | the probe bundle put the `INTERNALS` symbol of `@websublime/line-core` on `window`, and each case read `role`, `ariaLabel` and `ariaHidden` of the host's internals in all three engines |
| Other engines | Playwright's `ariaSnapshot()`, which Playwright computes itself from the DOM |
| Unit tier | happy-dom 20.14.6 through `bun-test-preload.ts` and its `FakeInternals` (`packages/line-core/__tests__/mocks/element-internals.ts`), with Lit, zod 3.25.76, Ajv 8.20.0 and `ajv-formats` 3.0.1, `@a2ui/web_core` 0.14.0, and the `line-genui` catalog, tools and surface fixture from `src/` and `__tests__/` |
| W3C texts | WAI-ARIA 1.2 (`https://www.w3.org/TR/wai-aria-1.2/`, `#progressbar`, `#status`, `#img`, `#button`) and Understanding SC 2.2.2 (`https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html`), read 2026-11-17 |
| Competitors | the seven libraries of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 (`:30`; the `Radix` column is Radix Primitives, `:21`), each through `npm view` and `npm pack` on 2026-11-17: `@awesome.me/webawesome` 3.14.0, `@spectrum-web-components/bundle` 1.12.6 with `@spectrum-web-components/progress-circle` 1.12.6, `@lion/ui` 0.27.0, `@fluentui/web-components` 3.2.1, `radix-ui` 1.8.1, `bits-ui` 2.21.0 and `@ark-ui/react` 5.40.0; and three libraries outside the table, `@radix-ui/themes` 3.3.0, `@chakra-ui/react` 3.38.0 and `@mantine/core` 9.8.1. A read-only `scout` subagent read the unpacked tarballs and returned `file:line` locators |
| Size | esbuild 0.28.2 and `gzip -9 -n` |

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npm view <package> version` for the eleven packages of Setup and for `@radix-ui/react-spinner`, `@ark-ui/spinner`, `@zag-js/spinner` and `@spectrum-web-components/spinner`; `npm pack` of the eleven into `/tmp/c20-comp`; `tar xzf` of each | 0 (four `npm view` calls answered `E404`) | P11 |
| 2 | `curl -sL https://www.w3.org/TR/wai-aria-1.2/ -o aria12.html` and a Python text extraction of the `progressbar`, `status`, `img` and `button` sections | 0 | the ARIA quotes of F1 and F2 |
| 3 | the harness URL reader on `https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html` | not a shell command | the SC 2.2.2 quotes of F5 |
| 4 | `bun build entry.ts --outfile bundle.js --target browser --format esm` in `packages/line-components/temp/c20-probe/` | 0 | one 116.71 KB module with the probe component, `defineVariant`, the built `button` and `icon-button`, `line-core` and Lit |
| 5 | `node_modules/.bin/playwright test -c packages/line-components/temp/c20-probe/playwright.config.ts a11y.probe` | 0 | 6 passed; P1, P2, P3 |
| 6 | the same config with `anim.probe iso.probe` | 1 | 10 passed, 3 failed, 2 skipped (forced colors run in Chromium only). The failures were the no-token test, whose reader walked a wrapper `<div>` that held no probe component |
| 7 | the same config with `anim.probe -g "without tokens"` after the reader skipped such wrappers | 0 | 3 passed; P6 no-token rows |
| 8 | command 4 again with two more forced-colors candidates, then `anim.probe -g forced --project chromium` | 0, 0 | a 117.0 KB module; 1 passed; P7 F4–F6 |
| 9 | the same config with `htmx.probe` | 1 | 2 failed in chromium and the run was cancelled. The page route `http://probe.local/**`, registered after the test's `/slow` route, answered the htmx request with the page itself |
| 10 | `htmx.probe` after the page route passed every path but `/`, `/bundle.js` and the script paths to `route.fallback()` | 0 | 6 passed; P8 |
| 11 | `bun test ./packages/line-genui/temp/c20-probe/agent.test.ts` | 0 | 1 pass; P10 with placeholder descriptions |
| 12 | `bun test ./packages/line-components/temp/c20-probe/happy.test.ts` | 0 | 1 pass; P9 |
| 13 | command 4 again with the final design (size steps `1`–`6` on `--line-size-3`…`-8`, the reduced-motion pulse on `:host, :host([speed])`, the forced-colors rule, `flex-shrink: 0`, no `vertical-align`) | 0 | a 117.53 KB module |
| 14 | `node_modules/.bin/playwright test -c packages/line-components/temp/c20-probe/playwright.config.ts`, every probe on the final design | 0 | 25 passed, 2 skipped (forced colors in Firefox and WebKit). Every P1–P3 reading equals command 5, and one new case, N6, joined P1. The tables below come from this run unless a row names an earlier command |
| 15 | `agent.test.ts` again with a first wording of the agent-facing and tool descriptions in `SPIN_DESC` and `SPIN_TOOLDESC`, which opened with a colon | 0 | 1 pass; 662 and 683 characters (P10) |
| 16 | `node_modules/.bin/esbuild size.ts --bundle --minify --format=esm --target=es2022 --external:lit '--external:@websublime/*'`, then `gzip -9 -n`, for `size.ts`, the final design without the probe-only rules and attributes, named `line-spinner` | 0 | P12 |
| 17 | `node v.mjs`, which launched each engine and printed `browser.version()` | 0 | the engine versions of Setup |
| 18 | `agent.test.ts` again after the first colon of both descriptions became a comma | 0 | 1 pass; 662 and 683 characters; the catalog keeps the agent-facing description; every provider's tool takes the tool description, whose only backticked name is `accessibilityLabel` (P10) |
| 19 | `rm -rf packages/line-components/temp packages/line-components/test-results packages/line-genui/temp /tmp/c20-out /tmp/c20-results /tmp/c20-results-run1 /tmp/c20-comp`; `git status --short` | 0 | deleted; the tree holds only this spec |

Every result below was the same in chromium, firefox and webkit unless a row says otherwise. Sizes are CSS pixels, width × height. "Empty" in a snapshot column means `ariaSnapshot()` returned nothing for the case.

### P1 — Role, name and the tree

Each case sat in its own `<div id="case">`. "Internals" sets the role through `ElementInternals`; "host attribute" writes `role` on the host. `label="Loading"` sets `internals.ariaLabel` unless a row says otherwise.

| Case | Chromium tree under the wrapper (CDP) | `ariaSnapshot()`, three engines | axe 4.14.0, §7.4 tags and all rules |
|---|---|---|---|
| R1 internals `progressbar`, `label` | `progressbar "Loading"` with `valuemin=0 valuemax=100 valuetext=""` and no `valuenow` | empty | none |
| R2 internals `status`, `label` | `status "Loading"` with `live="polite" atomic=true relevant="additions text"` | empty | none |
| R3 internals `img`, `label` | `image "Loading"` | empty | none |
| R4 no role, `label` | nothing | empty | none |
| R5 host attribute `progressbar`, `label` in internals | `progressbar "Loading"` | `- progressbar` | `aria-progressbar-name` |
| R6 host attribute `status`, `label` in internals | `status "Loading"`, live polite | `- status` | none |
| R7 host attribute `img`, `label` in internals | `image "Loading"` | `- img` | `role-img-alt` |
| U1 internals `progressbar`, no name | `progressbar ""` | empty | none |
| U2 internals `status`, no name | `status ""`, live polite | empty | none |
| U3 internals `img`, no name | `image ""` | empty | none |
| U4 host attribute `progressbar`, no name | `progressbar ""` | `- progressbar` | `aria-progressbar-name` |
| U5 host attribute `status`, no name | `status ""` | `- status` | none |
| U6 host attribute `img`, no name | `image ""` | `- img` | `role-img-alt` |
| U7 the recommended design, no name | nothing | empty | none |
| U8 no role, no name | nothing | empty | none |
| N1 host `aria-label="Saving"`, no `label` | `progressbar "Saving"` | empty | none |
| N2 `label="Loading"` and host `aria-label="Saving"` | `progressbar "Saving"` | empty | none |
| N3 `label` written to the host as `aria-label` | `progressbar "Loading"`; the host gains `aria-label="Loading"` | empty | none |
| N4 `aria-labelledby` to a `<span>Uploading file</span>` | the span's text, then `progressbar "Uploading file"` | `- text: Uploading file` | none |
| N5 `label="  "` | nothing | empty | none |
| N6 `label="Loading"` and `aria-description="Fetching orders"` (command 14) | `progressbar "Loading"` | empty | none |

| `INTERNALS` read-back, three engines | Result |
|---|---|
| R1, N1, N2, N4, N6 | `role` `progressbar`, `ariaHidden` `null`; `ariaLabel` `Loading` for R1, N2 and N6, `null` for N1 and N4 |
| U7, N5 | `role` `null`, `ariaHidden` `"true"`, `ariaLabel` `null` |
| every case | the same values in chromium, firefox and webkit |

- `ElementInternals` carries `role`, `ariaLabel` and `ariaHidden` in all three engines, and Chromium exposes each internals role with its internals name (R1–R3).
- `ariaSnapshot()` sees no internals role or name in any engine, so only a CDP assertion and an `INTERNALS` read-back prove them (R1–R3, U1–U3; Phase 1 spec `:1180`; `0016-skeleton.md` P1 B6, B7).
- axe sees neither the internals role nor the internals name. A nameless internals `progressbar` or `img` raises nothing (U1, U3), and a host-attribute role named only through internals raises `aria-progressbar-name` or `role-img-alt` (R5, R7). A host-attribute role therefore needs its name as a host attribute too.
- Chromium gives an indeterminate `progressbar` the ARIA defaults `valuemin=0` and `valuemax=100` and an empty `valuetext`, with no `valuenow` (R1), as WAI-ARIA 1.2 `#progressbar` sets them ("If aria-valuemin is missing … it defaults to 0 (zero). If aria-valuemax is missing … it defaults to 100").
- A host `aria-label` or `aria-labelledby` names the host and wins over `internals.ariaLabel` (N1, N2, N4). A blank `label` counts as no name (N5).
- A `status` with only a name has no content, so its live region holds nothing to announce [INFERENCE: ARIA live regions announce content changes; no screen reader ran].

### P2 — Inside Button, IconButton, a native button and a busy region

The spinner sat in the `loading` slot of the built `<line-button loading>` and `<line-icon-button loading>` (`packages/line-components/src/button/button.ts:348-364`; `icon-button.ts:239-255`). The inner native `<button>` carried `aria-disabled="true"` in every Button and IconButton case.

| Case | Chromium tree under the wrapper (CDP) | `ariaSnapshot()`, three engines | axe, both rule sets |
|---|---|---|---|
| B1 `<line-button loading>Save` with an unnamed spinner | `button "Save"` (`disabled=true focusable=true`), its text; no node for the spinner | `- button "Save" [disabled]` | none |
| B2 the same with an internals `progressbar` named `Loading` | `button "Save Loading"`, its text and a child `progressbar "Loading"` | `- button "Save" [disabled]` | none |
| B3 the same with an internals `status` | `button "Save Loading"`, a child `status "Loading"`, live polite | `- button "Save" [disabled]` | none |
| B4 the same with an internals `img` | `button "Save Loading"`, a child `image "Loading"` | `- button "Save" [disabled]` | none |
| B5 the same with a host-attribute `progressbar` | `button "Save Loading"`, a child `progressbar "Loading"` | `- button "Save" [disabled]:` with `- text: Save` and `- progressbar` | `aria-progressbar-name` |
| B6 `<line-button loading aria-label="Save">` with a named spinner | `button "Save"`, a child `progressbar "Loading"` | `- button "Save" [disabled]` | none |
| B7 `<span slot="loading">` holding an unnamed spinner and " Saving…" | `button "Save Saving…"` | `- button "Save Saving…" [disabled]` | none |
| B8 a host-attribute `status` | `button "Save Loading"`, a child `status "Loading"` | the button with `- text: Save` and `- status` | none |
| I1 `<line-icon-button loading aria-label="Refresh">`, a named spinner | `button "Refresh"`, a child `progressbar "Loading"` | `- button "Refresh" [disabled]` | none; `label-content-name-mismatch` incomplete |
| I2 the same with an unnamed spinner | `button "Refresh"` | `- button "Refresh" [disabled]` | none; the same incomplete |
| I3 the same with a host-attribute `progressbar` | `button "Refresh"`, a child `progressbar "Loading"` | the button with `- progressbar` | `aria-progressbar-name` |
| NB1 a native `<button>Save` with a named internals spinner | `button "Save Loading"`, a child `progressbar "Loading"` | `- button "Save"` | none |
| NB2 the same with a host-attribute `progressbar` | the same tree | the button with `- text: Save` and `- progressbar` | `aria-progressbar-name` |
| RG1 `<section aria-busy="true" aria-label="Orders">` with a spinner named `Loading orders` and a paragraph | `region "Orders"` with `busy=1`, a child `progressbar "Loading orders"`, the paragraph | `- region "Orders":` with `- paragraph: Orders` | none |

- A named spinner of any role joins the name of a button computed from its content, so `Save` becomes `Save Loading` (B2–B5, B8, NB1). Chromium keeps the spinner as a child node of the button although ARIA 1.2 gives `button` "Children Presentational: True".
- An unnamed, hidden spinner leaves the button's name to its text (B1) or to the consumer's loading text (B7), and an IconButton keeps its `aria-label` either way (I1, I2).
- Button and IconButton keep `aria-disabled="true"` with any spinner in the slot.
- The `label-content-name-mismatch` incomplete of I1–I3 appears with and without a spinner name (I2), so it comes from the icon glyph `↻` beside the label `Refresh` [INFERENCE: axe's rule compares visible text with the name].
- A spinner sits inside an app's busy region without changing it (RG1).

### P3 — Name changes after render

A `status` spinner named `Loading` was appended to the page by script, then changed, in Chromium (command 5; command 14 repeated it).

| Step | Chromium tree | `INTERNALS` read-back, three engines |
|---|---|---|
| appended with `label = 'Loading'` | `status "Loading"`, live polite | — |
| `label = 'Almost done'` | `status "Almost done"` | — |
| host `aria-label="Saving"` added | `status "Saving"` | — |
| `aria-label` removed and `label = ''` | nothing | `role` `null`, `ariaHidden` `"true"`, `ariaLabel` `null` |

- The semantics follow every change of `label`, `aria-label` and `aria-labelledby`, and a spinner whose last name goes away becomes hidden again (D9).
- CDP shows the tree, not announcements, so whether a screen reader speaks a name change of a live region is not observed (What automation cannot observe).

### P4 — Keyframes and consumer motion

Each case held one named probe component; P4 read `root.getAnimations()` and its computed `animation-*`.

| Case | chromium | firefox | webkit |
|---|---|---|---|
| A1 own `@keyframes line-spinner-spin { to { transform: rotate(1turn) } }`, name through `--line-spinner-keyframes` | `line-spinner-spin`, 1000 ms, infinite | same | same |
| A1 paused at 250 ms | `transform` `matrix(-1.38401e-11, 1, -1, -1.38401e-11, 0, 0)`, a quarter turn | `matrix(0, 1, -1, 0, 0, 0)` | `matrix(0, 1, -1, 0, 0, 0)` |
| A2 `animation: var(--line-animation-spin)` on `root` (`packages/line-tokens/src/animations.css:57-61`, `:96`) | **no animation**; `animation-name` computes to `line-spin` | `line-spin` runs | `line-spin` runs |
| plain host, adopted sheet naming a document keyframe `doc-spin`, `line-spin` or `var(--line-animation-spin)`, on an element with a `part` attribute (`iso.probe`) | none | runs | runs |
| plain host, own keyframes | runs | runs | runs |
| A3 page rule `::part(root) { animation: page-spin 2s linear infinite }`, page keyframes | `page-spin`, 2000 ms | same | same |
| A4 page rule `::part(root) { animation-name: line-spinner-spin }`, the component's keyframe name | **none** | `line-spinner-spin` runs | **none** |
| A5 page rule on the host `--line-spinner-keyframes: page-spin` | **none** | `page-spin` runs | `page-spin` runs |
| A6 page rule on the host `--line-spinner-keyframes: none` | none | none | none |
| A7 page rule on the host `--line-spinner-duration: 3s` | 3000 ms | same | same |
| A8 page rule on the host `--line-spinner-iteration-count: 3` | 3 iterations; no animation after 3.2 s | same | same |
| A9 page rule `::part(root) { animation-duration: 4s }` | 4000 ms | same | same |

- Chromium never resolves a document keyframe from a rule in a shadow root, so `--line-animation-spin` cannot turn the component, as `0016-skeleton.md` P3 found for `--line-animation-pulse` (A2; `0016-skeleton.md:753`, Spec drift found, item 5 there). The component needs its own keyframes (F3).
- A consumer's `::part(root)` rule with page keyframes runs in all three engines (A3). A `::part(root)` rule that names the component's keyframe stops the motion in Chromium and WebKit (A4), and a keyframe name set in the token from the page runs only in Firefox and WebKit (A5). So the keyframe names and the keyframes token are not a styling route for custom motion (D5).
- A consumer stops the motion with `--line-spinner-keyframes: none` and sets duration and iterations through their tokens in all three engines (A6–A8).

### P5 — Reduced motion and iteration count

`page.emulateMedia({ reducedMotion: 'reduce' })`; `matchMedia('(prefers-reduced-motion: reduce)').matches` was `true` in all three engines.

| Case | Result, three engines |
|---|---|
| no reduced-motion rule (command 6) | A1 keeps turning, `line-spinner-spin`, 1000 ms |
| `stop`: `--line-spinner-keyframes: none` under the query at normal importance | no animation |
| `slow`: `--line-spinner-duration: var(--line-motion-8, 3s)` | `line-spinner-spin`, 3000 ms |
| `swap`, the recommended rule `:host, :host([speed]) { --line-spinner-keyframes: line-spinner-pulse; --line-spinner-duration: var(--line-motion-7, 2s); --line-spinner-easing: var(--line-easing-in-out, ease-in-out) }` with `@keyframes line-spinner-pulse { 50% { opacity: 0.4 } }` (command 14) | every default, `speed`, `size` and token case runs `line-spinner-pulse`, 2000 ms; `speed="fast"` and `"slow"` pulse at 2000 ms too |
| `stop` with the page rule `::part(root) { animation: page-spin 2s linear infinite }` | `page-spin` runs, 2000 ms |
| the recommended rule with the same page rule (command 14) | `page-spin` runs |
| A6 `--line-spinner-keyframes: none` from the page | none |

- A shadow rule at normal importance changes the motion under the query, and a consumer's `::part(root)` rule with page keyframes still wins, so an app can opt back in (`0016-skeleton.md` P4).
- `:host([speed])` beside `:host` lets the reduced-motion rule beat `:host([speed='slow'])` and `:host([speed='fast'])` by order at equal specificity.
- A finite iteration count ends the motion and leaves `root` at rest, a three-quarter ring with no rotation (A8).

### P6 — Size, speed, colour, layout and missing tokens

| Case | Result, three engines |
|---|---|
| no `size`, 16 px font | host 16 × 16; ring width 2 px |
| no `size`, 24 px font | host 24 × 24; ring width 3 px |
| `size="1"` … `"6"` (command 14) | 16 × 16, 20 × 20, 24 × 24, 28 × 28, 32 × 32, 48 × 48 |
| `size="xl"` | 16 × 16; the property `undefined`; the attribute keeps `xl` |
| `speed="slow"`, `"normal"`, `"fast"` | 2000 ms, 1000 ms, 750 ms |
| `speed="warp"` | 1000 ms; the property `undefined`; the attribute keeps `warp` |
| a parent with `color: rgb(200, 0, 0)` | ring `rgb(200, 0, 0)`; the inline-end side `rgba(0, 0, 0, 0)` |
| page rule `--line-spinner-color: rgb(0, 0, 200)` | ring `rgb(0, 0, 200)` |
| a 40 px flex row with a 60 px item before the spinner, `flex-shrink: 0` in the sheet (FLEX1) | 16 × 16 |
| the same with a consumer `flex-shrink: 1` on the host (FLEX2) | 4 × 16 |
| `hidden` | `display: none`; 0 × 0 |
| no tokens, the recommended design with literal fallbacks (command 14) | `line-spinner-spin` 1000 ms; `size` 1, 3 and 6 at 16, 24 and 48 px; `speed` slow 2000 ms and fast 750 ms |
| no tokens, A2's `var(--line-animation-spin)` | no animation; duration `0s` |
| no tokens, a host whose sheet reads `--line-size-5`, `--line-motion-6` and `--line-easing-linear` without fallbacks | 4 × 4, the borders alone; duration `0s`; no animation |

- `size` and `speed` change only the defaults of `--line-spinner-size` and `--line-spinner-duration` on `:host`, and an unknown value draws the default (D8; ARCH §17.2 C6).
- Without `line-tokens` and without literal fallbacks, a spinner that reads the size and motion tokens has no size and no motion, so it looks frozen; the literal fallbacks keep every value (D6).
- Without `flex-shrink: 0` a spinner in a crowded flex row shrinks to its borders, as Icon guards against (`packages/line-components/src/icon/icon.ts:70-79`; D11).

### P7 — Forced colors

Chromium only, `page.emulateMedia({ forcedColors: 'active' })`, a 48 px spinner with a 6 px ring paused at 0 ms; pixels sampled from an element screenshot at the middle of each side.

| Case | Computed border colours (top, right, bottom, left) | Pixels (left, right, top, bottom) |
|---|---|---|
| F0 no forced-colors rule (command 6) | all four `rgb(0, 0, 0)` | all four black; the gap is gone, so the ring looks still while it turns |
| F1 `forced-color-adjust: none` (command 6) | the author colour on three sides, `rgba(0, 0, 0, 0)` on the right | the author colour and a white gap |
| F2 `border-color: CanvasText; border-inline-end-color: transparent` under the query | all four `rgb(0, 0, 0)` | all four black |
| F3 a consumer `--line-spinner-color`, no rule (command 6) | all four `rgb(0, 0, 0)` | all four black |
| F4 `border-color: CanvasText; border-inline-end-color: Canvas` under the query (command 8) | three black, right `rgb(255, 255, 255)` | black ring, white gap |
| F5 `forced-color-adjust: none` with `CanvasText` and `transparent` (command 8) | three black, right transparent | black ring, white gap |
| F6 F4 with a consumer `--line-spinner-color` (command 8) | as F4 | as F4 |
| the recommended design, which carries F4's rule (command 14), with and without a consumer colour | as F4 | as F4 |

- Forced colors replace every author border colour, `transparent` included, so the ring's gap vanishes (F0, F2, F3). A system colour survives, so `Canvas` on the gap keeps it visible whatever colour the consumer chose (F4, F6; D7). Fluent UI draws its forced-colors spinner the same way (P11).

### P8 — htmx

| Case | htmx 2.0.11 and htmx 4.0.0, three engines |
|---|---|
| a button with `hx-get="/slow"` and `hx-indicator="#sp1"`, and `<line-spinner id="sp1" class="htmx-indicator" label="Loading results">`, before the click | `visibility: hidden`, `opacity: 0`; one animation still running; no node for the spinner in the Chromium tree |
| the same while the request is open | the spinner gains `htmx-request`; `visibility: visible`, `opacity: 1`; `progressbar "Loading results"` in the Chromium tree |
| the same after the response | `htmx-request` gone; `visibility: hidden`, `opacity: 0`; no node |
| a `<div hx-get hx-trigger="load" hx-swap="innerHTML">` holding a named spinner | the server's `<p>` replaces the spinner |

- htmx shows and hides a spinner through its own indicator class and swaps it out with content, and the spinner needs nothing from htmx (D16). Both majors hide an idle indicator with `visibility: hidden`, so a named spinner leaves the tree while idle.

### P9 — happy-dom

| Check | Result |
|---|---|
| a host from `document.createElement`, not connected | an instance of the class; `shadowRoot` `null` |
| connected, no attribute | shadow children `["span[part=root]"]`; two adopted sheets; no host attribute; internals `role` `null`, `ariaHidden` `"true"`; computed `display: inline-block`, `inline-size: 1em`, `--line-spinner-size: 1em`, `--line-spinner-duration: 1s`; `root` `animation-name: line-spinner-spin` |
| `label="Loading" size="3" speed="fast"` | internals `role` `progressbar`, `ariaLabel` `Loading`, `ariaHidden` `null`; `--line-spinner-size: 1.5rem`; `--line-spinner-duration: 0.75s` |
| `size="xl" speed="warp"` | both properties `undefined`; the attributes keep `xl` and `warp` |
| setting `size = '2'`, then removing the attribute | the attribute `2`; then the property `undefined` |
| host `aria-label="Saving"` added, then removed | `role` `progressbar`, then `role` `null` and `ariaHidden` `"true"` |
| `hidden` | `display: none` |
| `getAnimations` on `root` | a function; `matchMedia('(prefers-reduced-motion: reduce)').matches` is `false` |

- The unit tier reads the shadow tree, the converters, reflection, the internals semantics through `FakeInternals`, and the computed tokens through their literal fallbacks. Motion, reduced motion, sizes in pixels, forced colors and the accessibility tree belong to the Browser tier.

### P10 — Agent path

Four stub descriptors for `line-probe-spinner` ran through `lineCatalogDocument`, `inlineCatalog` (Ajv 2020 against `client_capabilities.json#/$defs/Catalog`), `frontendTools` for the three providers, and the surface fixture in happy-dom. The probe pushed the stubs onto the exported `descriptors` array before it imported the surface module, as `0016-skeleton.md` P10 did.

- `SpinnerA` had no own props, `hostNaming: { kind: 'always' }` and no `requiredName`.
- `SpinnerB` had `label` (`DynamicString`, bound to the attribute `label`) and `hostNaming: { kind: 'never' }`.
- `SpinnerC` had `size` (`z.enum(['1', '2', '3', '4', '5'])`) and `speed` (`z.enum(['slow', 'normal', 'fast'])`), each bound to its attribute, and `hostNaming: always`.
- `SpinnerD` had no own props, `requiredName: [{ kind: 'accessibilityLabel' }]` and `hostNaming: always`.

| Check | Result |
|---|---|
| `lineCatalogDocument` | each stub an `allOf` of `ComponentCommon` and an own object; `SpinnerA` and `SpinnerD` with `component` only; `SpinnerB.label` a `$ref` to `DynamicString`; `SpinnerC.size` and `.speed` string enums |
| `inlineCatalog` against the `Catalog` def | valid |
| `frontendTools`, OpenAI | `SpinnerA` and `SpinnerD`: `accessibilityLabel` and `accessibilityDescription`, typed `["string", "null"]`, both in `required`; `SpinnerB`: `label` only; `SpinnerC`: `size`, `speed` and both accessibility strings |
| Anthropic | the same parameters, optional |
| Gemini | the same parameters with `nullable: true` |
| surface, `SpinnerA` with `accessibility: { label: "Loading orders", description: "Fetching" }` | no error; `<line-probe-spinner aria-label="Loading orders" aria-description="Fetching">`; internals `role` `progressbar` |
| `SpinnerA` with no props | no error; `<line-probe-spinner>`; internals `role` `null`, `ariaHidden` `"true"` |
| `SpinnerA` with `accessibility.label` `"  "` | no error; no `aria-label`; hidden |
| `SpinnerB` with `label: "Loading"` and `accessibility.label: "Ignored"` | no error; `<line-probe-spinner label="Loading">` and no `aria-label`; internals `role` `progressbar`, `ariaLabel` `Loading` |
| `SpinnerC` with `size: "3"`, `speed: "fast"` and a label | `size="3" speed="fast" aria-label="Loading"` |
| `SpinnerC` with `size: "xl"` | `VALIDATION_ERROR`, "size: Invalid enum value. Expected 1 \| 2 \| 3 \| 4 \| 5, received 'xl'"; nothing renders |
| `SpinnerD` with no label | `MISSING_ACCESSIBLE_NAME`, "SpinnerD 'root' has no accessible name."; an inert `data-line-a2ui-placeholder="missing-name"` placeholder |
| `SpinnerD` with `accessibility.label: "Loading"` | no error; `aria-label="Loading"`; internals `role` `progressbar` |
| commands 15 and 18, `SpinnerA` with the descriptions of Descriptor fields | the catalog keeps the agent-facing description (662 characters); every provider's tool takes the tool description (683 characters), whose only backticked name, `accessibilityLabel`, is a parameter of the tool |

- The surface writes `accessibility.label` as the host `aria-label`, and the component turns that into a named `progressbar` with no binding of its own (`SpinnerA`; P1 N1).
- `hostNaming: always` gives the tool both accessibility parameters, and `never` gives it none (`takesAccessibility`, `packages/line-genui/src/catalog/tools.ts:139-154`).
- A `requiredName` of kind `accessibilityLabel` turns a nameless node into a placeholder with an error (`SpinnerD`; Phase 1 spec §6.G.4, `:1512-1513`).

### P11 — Competitors

Checked on 2026-11-17, one row per column of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1. Locators are relative to each unpacked package.

| Library | Package and version | Spinner | Role and where | Name | Motion and forced colors |
|---|---|---|---|---|---|
| Web Awesome | `@awesome.me/webawesome` 3.14.0 | `<wa-spinner>` (`dist/chunks/chunk.EGBUT3HG.js:40`) | `progressbar` on an inner `<svg>` in the shadow tree, no `aria-value*` (`:27`) | the localised term `loading`, "Loading" (`:28`; `dist/chunks/chunk.M45NRQFW.js:66`); no prop sets it | `spin var(--speed) linear infinite` with `--speed: 2s`, plus a `dash` keyframe; an SVG track and indicator; `--size: 1em`, `--track-width: 2px` (`dist/chunks/chunk.W7A2VLCT.js:7-11`, `:29`, `:53`); no reduced-motion or forced-colors rule |
| Spectrum Web Components | `@spectrum-web-components/progress-circle` 1.12.6, in the bundle 1.12.6 | `<sp-progress-circle indeterminate>`; `npm view @spectrum-web-components/spinner` answers `E404` | host attribute `role="progressbar"` when no role is set (`src/ProgressCircle.base.dev.js:47-48`); indeterminate removes the `aria-value*` attributes (`:62-65`) | none by default; `label` becomes the host `aria-label` (`:82`); a nameless one logs a dev warning (`:117`) | border rings with masks, `1s … infinite` overridden by a 2000 duration token; `size` `s`, `m`, `l` (`src/ProgressCircle.types.dev.js:2-6`); a forced-colors block using `Highlight` (`src/progress-circle.css.dev.js:4`); no reduced-motion rule |
| Lion | `@lion/ui` 0.27.0 | `<lion-progress-indicator>`, indeterminate without `value` | host attribute `role="progressbar"` (`components/progress-indicator/src/LionProgressIndicator.js:144`) | the localised "Loading" (`:209`; `translations/en.js:2`); `aria-label` or `aria-labelledby` override it (`:25`, `:29`) | headless; `_graphicTemplate()` renders nothing (`:136-137`) |
| Fluent UI Web Components | `@fluentui/web-components` 3.2.1 | `<fluent-spinner>` (`dist/esm/spinner/spinner.options.js:28`) | `this.elementInternals.role = 'progressbar'`, **internals** (`dist/esm/spinner/spinner.base.js:15`) | none by default; the author sets `aria-label` | border rings, `--duration: 1.5s` (`spinner.styles.js:8`, `:55`); seven sizes `tiny` … `huge` (`:17-40`); an `indicator` slot replaces the graphic (`spinner.template.js:3`); forced colors set `border-color: Canvas` with `Highlight` on two sides (`spinner.styles.js:149-157`); no reduced-motion rule |
| Radix Primitives | `radix-ui` 1.8.1 | none | — | — | `src/` lists 34 modules and none is a spinner; `grep -i 'spinner\|loader'` matches nothing; `npm view @radix-ui/react-spinner` answers `E404` |
| Bits UI | `bits-ui` 2.21.0 | none | — | — | `dist/bits/` holds 42 directories and none is a spinner; its `Progress` with `value: null` sets `role="progressbar"` and no `aria-valuenow` (`dist/bits/progress/progress.svelte.js:18-34`) |
| Ark UI | `@ark-ui/react` 5.40.0 | none | — | — | `dist/components/` holds 61 directories and none is a spinner; `npm view @ark-ui/spinner` and `@zag-js/spinner` answer `E404` |

Three libraries outside the table ship one.

- Radix Themes 3.3.0 `Spinner` is a `<span>` of eight fading leaves in `currentColor`, with no role and no name; `loading={false}` renders its children instead (`src/components/spinner.tsx:24`, `:27`, `:48`; `spinner.css:2`, `:26`).
- Chakra UI 3.38.0 `Spinner` is a `<span>` with a `currentColor` border and a transparent track on two sides, no role and no name, `size` `xs` … `xl` or `inherit` (`dist/esm/theme/recipes/spinner.js:8-28`). Its button wraps the label in a `Loader` that adds no ARIA (`dist/esm/components/loader/loader.js:29`).
- Mantine 9.8.1 `Loader` draws an `oval` border ring by default, `1.2s linear infinite`, with no role and no name (`styles/Loader.css:112-113`; `esm/components/Loader/Loader.mjs:22`). Its theme-level reduced-motion switch is off by default and never reaches the Loader (`styles/global.css:1-2`; `core/MantineProvider/default-theme.mjs:23`).
- Every library with a role picks `progressbar`, and Fluent alone sets it through internals. Web Awesome and Lion ship an English "Loading" default; Spectrum, Fluent and line take no default string. None of the eleven packages has a reduced-motion rule that reaches its spinner. Only Spectrum and Fluent handle forced colors.

### P12 — Size

The decided design, a module with the class, both converters, the stylesheet and `customElements.define`, is 3,422 B minified and 1,103 B gzipped through esbuild (`--bundle --minify --format=esm --target=es2022 --external:lit --external:@websublime/*`, then `gzip -9 -n`), the §7.6 recipe. The shipped `./spinner` lands in the "Size report" step against the < 5 KB soft target [INFERENCE: the shipped figure is not measured yet; the probe used a converter of its own, not a copy of Grid's].

### What the probes settle

- A role through `ElementInternals` reaches the Chromium tree with its internals name, and stays invisible to `ariaSnapshot()` and to axe; a host-attribute role is visible to both, and axe then needs the name as an attribute too (P1; F1).
- A named spinner joins a button's name, and an unnamed, hidden one leaves the button's name alone (P2; F2, D19).
- `--line-animation-spin` cannot turn a shadow element in Chromium, so the component carries its own keyframes (P4; F3).
- A normal-importance reduced-motion rule changes the motion and keeps the consumer's `::part(root)` opt-in (P5; F4).
- `size` and `speed` work as reflected closed enums over token defaults, and literal fallbacks keep the spinner turning without `line-tokens` (P6; F6, D6).
- Forced colors erase the ring's gap unless the gap is a system colour (P7; D7).
- htmx's indicator class drives a spinner in both majors (P8; D16).
- The agent path names a spinner through `accessibility.label` with no prop of its own, and a `requiredName` rejects a nameless node (P10; F7).
- Every competitor with a role uses `progressbar`, and none handles reduced motion (P11).

### What automation cannot observe

- What a screen reader announces for each role. That covers whether a `status` speaks when it is inserted or renamed, whether an indeterminate `progressbar` is read as busy, as a percentage or by name only, and whether a named spinner inside a button is read twice. CDP shows the tree, not speech. R8 §6 Q9 asks for "a screen-reader pass of each" (`docs/research/01-research-accessibility.md:343`); Phase 1 spec SD39 and AM-058 make that pass optional and never blocking (`:1180`, `:2386`).
- Firefox and WebKit accessibility trees. Playwright's snapshot is its own computation from the DOM and ignores internals (P1; Phase 1 spec §12 AM-058).
- Forced colors in Firefox and WebKit, which Playwright does not emulate.
- Whether people who ask for reduced motion find a 2 s opacity pulse calmer than a rotation, and whether WCAG 2.2.2 reads the pulse as blinking (F4, F5).
- The previous stable Chrome, Firefox and Safari, which PRD §1.7 also supports. The probes ran the latest engines only.

---

## Part A — Requirements

### Overview

#### Description

`<line-spinner>` is a standalone loading indicator, a small ring that turns while something is in progress (PRD §4.1, `docs/PRD.md:268`). It draws in the colour and at the size of the surrounding text, and its motion is CSS only (ARCH §13.5, `docs/ARCHITECTURE.md:624`; F8 (a)). With a name from `label`, `aria-label` or `aria-labelledby`, assistive technology finds it as an indeterminate `progressbar` with that name (F1 (a), F2 (a)). Without a name it is decorative and hidden, the right form inside a Button's `loading` slot, whose own text already says what is happening (P2). `size` and `speed` pick token steps, and the ring pulses instead of turning when the user asks the system for reduced motion (F4 (a), F6 (a)). The component ships no default string, because "Loading" is the consumer's to localise (MANIFESTO Out of Scope, `docs/MANIFESTO.md:66`).

#### Use cases

- A Button or IconButton that runs an action, with an unnamed spinner in its `loading` slot beside the consumer's loading text (P2 B1, B7, I2; `0002-button.md:315`; `0003-icon-button.md:308`).
- A panel, a list or a table whose data is loading, with a named spinner where the content will appear and `aria-busy="true"` on the region (P2 RG1; R8 `:84`).
- A short inline status such as "Saving…", with an unnamed spinner before the text.
- An htmx request indicator, `<line-spinner class="htmx-indicator">`, shown by htmx while a request is open (P8).
- An agent-built loading state on `<line-a2ui-surface>` through the `line` catalog, named through `accessibility.label` (P10).

#### Anti-patterns

- Known progress, such as an upload at 40 %. A determinate progress bar shows the value; Progress is a later PRD row (`docs/PRD.md:343`).
- Holding the layout of content still to come. Use `<line-skeleton>` (`0016-skeleton.md` Connections).
- A spinner as the only loading cue with no name and no text. It tells assistive technology nothing; name it, or put visible text beside it (P1 U7).
- A named spinner inside a button whose name comes from its text. Its name joins the button's, so "Save" becomes "Save Loading" (P2 B2–B5); leave it unnamed and put the loading text in the slot.
- Announcing that the load finished. The spinner says nothing when it goes away; use a live region or an Alert for the result (R8 `:286-287`).
- A page-blocking overlay. The spinner is inline; a modal waiting state belongs to the overlay components of a later phase (PRD §4.3).

#### User expectations

- The spinner turns smoothly at the text's size and colour, and stops turning when it is removed or hidden.
- A user who asks the system for reduced motion sees a gentle pulse instead of rotation (F4 (a)).
- A named spinner is found by assistive technology with its name; an unnamed one adds nothing (P1).
- A spinner in a loading button never changes the button's name or focus (P2).
- In Windows High Contrast and other forced-colors modes the ring keeps its gap, so it still reads as turning (P7).

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| `<line-button>` | parent | the `loading` slot inside `::part(loading)`, rendered only while `loading` is on (ARCH §13.1, `:596`; §13.5, `:625`). Leave the spinner unnamed; the button keeps its text name and `aria-disabled="true"` (P2 B1, B7). Spinner never imports Button and Button never imports Spinner (MANIFESTO Law 4) |
| `<line-icon-button>` | parent | the `loading` slot, as on Button; the IconButton's required `aria-label` names the button (P2 I1, I2; `0003-icon-button.md` decision D1; ARCH §13.1, `docs/ARCHITECTURE.md:597`) |
| `<line-button-group>` | ancestor | through a Button's `loading` slot (`0004-button-group.md:436`) |
| `<line-skeleton>` | sibling | Skeleton keeps the layout of content still to come and announces nothing; Spinner signals that work is running (`0016-skeleton.md:295`, `:313`, `:599`) |
| `<line-center>`, `<line-stack>` | parent | centre a spinner in a panel, or set it beside text, through their default slot |
| an app region with `aria-busy` | ancestor | the app marks the loading region busy; the spinner never writes `aria-busy` (P2 RG1; R8 `:84`) |
| `<line-a2ui-surface>` | orchestrator | creates `line-spinner` by tag for a `line` catalog `Spinner` node and sets `accessibility.label` as its `aria-label` (ARCH §17.4; Phase 1 spec §6.G.4; P10). An agent cannot put a spinner in a Button's `loading` slot, which stays outside the Button descriptor's slot map (`0002-button.md:130`, AM-005) |
| htmx | consumer | `class="htmx-indicator"` and `hx-indicator` on the triggering element (P8) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| `size` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | a size of its own instead of the text size: 16, 20, 24, 28, 32 or 48 px at the default root font, the `--line-size-3` … `--line-size-8` steps (F6 (a)) |
| `speed` | `slow \| normal \| fast` | one turn in 2 s, 1 s (default) or 0.75 s (F6 (a)) |

- Each value changes only the default of `--line-spinner-size` or `--line-spinner-duration` on `:host`, as ARCH §17.2 C6 requires (P6). With no attribute or an unknown value, the spinner takes the text size and one turn per second (D8).

---

## Part B — Technical Specification

### Anatomy

```
<line-spinner>               LineElement; :host inline-block, var(--line-spinner-size) square; role and name in ElementInternals
└── #shadow-root
    └── <span part="root">   the ring, a border in --line-spinner-color with a transparent inline-end side, turning
```

- `root` is the ARCH §5 name for the main container (`docs/ARCHITECTURE.md:306`) and the one part ARCH §13.5 names (`:624`; D2).
- The shadow tree holds no text, so the spinner's only accessible content is the name its internals carry (P1).
- A private `#writeSemantics()` writes the semantics. With a non-blank `label`, host `aria-label` or host `aria-labelledby`, it sets `internals.role = 'progressbar'` and `internals.ariaHidden = null`. Without one it sets `internals.role = null` and `internals.ariaHidden = 'true'`. In both cases it sets `internals.ariaLabel` to a non-blank `label`, and to `null` for a blank or missing one (P1 N5; F1 (a), F2 (a)).
- The component runs `#writeSemantics()` the way Icon does. It overrides `static get observedAttributes()` to add `aria-label` and `aria-labelledby` to Lit's list (`packages/line-components/src/icon/icon.ts:96-99`), and its `attributeChangedCallback` calls `super` and then runs `#writeSemantics()` for those two names (`icon.ts:163-168`). `willUpdate` runs it on the first update and whenever `label` changes (Icon runs it on the first update only, `icon.ts:170-175`, because Icon has no `label`). Neither attribute is a reactive property, because Lit's `attributeChangedCallback` acts only on declared properties (`@lit/reactive-element` 2.1.2 `development/reactive-element.js:610-612`, `:651-658`), and a declared one would add a public CEM field and shadow the native `ariaLabel` (`0014-icon.md` F10). So any change of the three names re-runs the semantics (P3; D9). The probe component observed the two attributes through Lit properties; the shipped route above reaches the same readings [INFERENCE: the route itself was not probed; Icon ships it].
- The component writes no `role` or `aria-*` attribute on the host, only the reflected `size` and `speed`, so an author `role` or `aria-*` attribute wins over the internals defaults (P1 N2).

### States

| Field | Value |
|-------|-------|
| Machine | `none` (Static tier; ARCH §8, `:410`; ARCH §13.5 "Static, no machine"; Phase 1 spec §6.C.4 C20 row) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| none | — | — | — |

Spinner has no finite states and no state flags, so it writes no `data-*` attribute and no `:state()` (ARCH §14.8; D1). Loading is the app's state; the app shows the spinner while work runs and removes or hides it after.

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| none | — | — |

The ring is the component's own drawing (F8 (a)). A consumer who wants another glyph restyles `::part(root)`.

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<span>` | the ring, with its size, border, colours and motion |

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `label` | `label` | `string \| undefined` | `undefined` | no | the accessible name, such as "Loading orders"; with no non-blank `label`, `aria-label` or `aria-labelledby` the spinner is decorative and hidden (F2 (a)) |
| `size` | `size` | `'1' \| '2' \| '3' \| '4' \| '5' \| '6' \| undefined` | `undefined` (the text size) | yes | a size step, `--line-size-3` … `--line-size-8` (F6 (a)) |
| `speed` | `speed` | `'slow' \| 'normal' \| 'fast' \| undefined` | `undefined` (drawn as `normal`) | yes | the time of one turn, 2 s, 1 s or 0.75 s (F6 (a)) |

- `size` and `speed` use a local copy of Grid's `variantConverter` (`packages/line-components/src/grid/grid.ts:16-19`), so an unknown value becomes `undefined`, the attribute keeps what the author wrote, and the stylesheet draws the default (P6, P9; D8). Grid's converter is a module-local function that `grid.ts` does not export, so it cannot be imported and is copied; importing it from Grid's module would also pull `line-grid` into the `./spinner` bundle, which the isolation test rejects (Phase 1 spec §7.5).
- `label` does not reflect, so code that sets the property sprouts no attribute (D9).
- The host takes the global `hidden` attribute, which hides it (D3).

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

Spinner holds no value and no interactive element, so it fires nothing and is neither value-bearing nor compound (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`; D1).

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-spinner-size` | `1em`; `var(--line-size-N, <literal>)` for `size` (N = step + 2) | host (`inline-size`, `block-size`) |
| `--line-spinner-width` | `0.125em` | `root` (border width) |
| `--line-spinner-color` | `currentColor`; ignored under `forced-colors: active` (D7) | `root` (border colour) |
| `--line-spinner-keyframes` | `line-spinner-spin`; `line-spinner-pulse` under `prefers-reduced-motion: reduce` (F4 (a)); internal names, `none` stops the motion | `root` (`animation-name`) |
| `--line-spinner-duration` | `var(--line-motion-6, 1s)`; `var(--line-motion-7, 2s)` for `slow` and under reduced motion; `var(--line-motion-slow, 0.75s)` for `fast` | `root` |
| `--line-spinner-easing` | `var(--line-easing-linear, cubic-bezier(0, 0, 1, 1))`; `var(--line-easing-in-out, cubic-bezier(0.4, 0, 0.2, 1))` under reduced motion | `root` |
| `--line-spinner-iteration-count` | `infinite` (F5 (a)) | `root` |

The component stylesheet after `commonReset` is this rule set, in this order (D5–D7, D11).

```css
:host {
  --line-spinner-size: 1em;
  --line-spinner-width: 0.125em;
  --line-spinner-color: currentColor;
  --line-spinner-keyframes: line-spinner-spin;
  --line-spinner-duration: var(--line-motion-6, 1s);
  --line-spinner-easing: var(--line-easing-linear, cubic-bezier(0, 0, 1, 1));
  --line-spinner-iteration-count: infinite;

  display: inline-block;
  flex-shrink: 0;
  inline-size: var(--line-spinner-size);
  block-size: var(--line-spinner-size);
}

:host([size='1']) { --line-spinner-size: var(--line-size-3, 1rem); }
:host([size='2']) { --line-spinner-size: var(--line-size-4, 1.25rem); }
:host([size='3']) { --line-spinner-size: var(--line-size-5, 1.5rem); }
:host([size='4']) { --line-spinner-size: var(--line-size-6, 1.75rem); }
:host([size='5']) { --line-spinner-size: var(--line-size-7, 2rem); }
:host([size='6']) { --line-spinner-size: var(--line-size-8, 3rem); }

:host([speed='slow']) { --line-spinner-duration: var(--line-motion-7, 2s); }
:host([speed='fast']) { --line-spinner-duration: var(--line-motion-slow, 0.75s); }

@media (prefers-reduced-motion: reduce) {
  :host,
  :host([speed]) {
    --line-spinner-keyframes: line-spinner-pulse;
    --line-spinner-duration: var(--line-motion-7, 2s);
    --line-spinner-easing: var(--line-easing-in-out, cubic-bezier(0.4, 0, 0.2, 1));
  }
}

[part='root'] {
  display: block;
  box-sizing: border-box;
  inline-size: 100%;
  block-size: 100%;
  border: var(--line-spinner-width) solid var(--line-spinner-color);
  border-inline-end-color: transparent;
  border-radius: 50%;
  animation-name: var(--line-spinner-keyframes);
  animation-duration: var(--line-spinner-duration);
  animation-timing-function: var(--line-spinner-easing);
  animation-iteration-count: var(--line-spinner-iteration-count);
}

@media (forced-colors: active) {
  [part='root'] {
    border-color: CanvasText;
    border-inline-end-color: Canvas;
  }
}

@keyframes line-spinner-spin {
  to { transform: rotate(1turn); }
}

@keyframes line-spinner-pulse {
  50% { opacity: 0.4; }
}

:host([hidden]) {
  display: none;
}
```

- The keyframes live in this stylesheet, because Chromium does not resolve a document keyframe from a shadow root (P4 A2; F3 (a)). `line-spinner-spin` repeats `line-spin` of `line-tokens` (`packages/line-tokens/src/animations.css:57-61`) under its own name.
- `size` and `speed` change only token defaults on `:host`, and `--line-spinner-keyframes` carries the keyframe name, which resolves against these keyframes in all three engines (P4 A1, P6; ARCH §17.2 C6).
- The reduced-motion block names `:host([speed])` beside `:host`, so it beats both `speed` rules by order at equal specificity; it is not `!important`, so a page `::part(root)` rule with page keyframes opts back in (P5).
- The forced-colors block sets the colours on `root`, not on the token, so it holds whatever the consumer set `--line-spinner-color` to; `Canvas` keeps the gap visible (P7; D7).
- Every `line-tokens` read carries a literal fallback equal to its token value, checked line by line: `--line-motion-slow` `0.75s`, `--line-motion-6` `1s` and `--line-motion-7` `2s` (`packages/line-tokens/src/motion.css:16-18`); `--line-easing-linear` `cubic-bezier(0, 0, 1, 1)` and `--line-easing-in-out` `cubic-bezier(0.4, 0, 0.2, 1)` (`easings.css:9`, `:14`), the token values themselves, because the CSS keywords `linear` and `ease-in-out` are not those curves; `--line-size-3` … `--line-size-8` `1rem`, `1.25rem`, `1.5rem`, `1.75rem`, `2rem` and `3rem` (`sizing.css:12-17`). So the spinner turns and sizes without `line-tokens` exactly as with them (P6; D6). The probe ran its fallbacks as `linear` and `ease-in-out`; the no-tokens rows of P6 read durations and sizes, not easing curves.
- `flex-shrink: 0` keeps the ring square in a crowded flex row, as on Icon (P6 FLEX1, FLEX2; D11).
- The `[hidden]` rule comes last, so no earlier rule sets `display` over it (D3).
- The gap sits on the inline-end side, so it starts on the left in right-to-left text, and the ring turns clockwise in both directions [INFERENCE: right-to-left was not probed; D24].

#### Consumer styling

```css
/* A brand colour and a thicker ring */
line-spinner.brand {
  --line-spinner-color: var(--line-accent-solid);
  --line-spinner-width: 0.1875em;
}

/* A faint track behind the arc, drawn by the consumer, with its own forced-colors rule */
line-spinner.track::part(root) {
  border-color: color-mix(in srgb, currentColor 20%, transparent);
  border-block-start-color: currentColor;
}
@media (forced-colors: active) {
  line-spinner.track::part(root) {
    border-color: CanvasText;
    border-inline-end-color: Canvas;
  }
}

/* Custom motion through page keyframes in a ::part rule (P4 A3) */
@keyframes page-sweep { to { transform: rotate(-1turn); } }
line-spinner.reverse::part(root) { animation: page-sweep 1.5s linear infinite; }

/* Keep rotating under reduced motion, when the app decides to (P5) */
@media (prefers-reduced-motion: reduce) {
  line-spinner.keep::part(root) { animation: page-sweep 2s linear infinite; }
}

/* Stop after five turns; the app then owns what a still ring means (F5) */
line-spinner.brief { --line-spinner-iteration-count: 5; }
```

- A page `::part(root)` rule that sets border colours beats the component's forced-colors block, as a page `::part(root)` rule beats the component's `animation-duration` (P4 A9) [INFERENCE: the colour case was not probed], so forced colors would erase the gap again. A recipe that recolours the border carries its own `@media (forced-colors: active)` rule, as the track recipe does.
- The keyframe names `line-spinner-spin` and `line-spinner-pulse` are internal. A `::part(root)` rule that names them stops the motion in Chromium and WebKit, and a page keyframe set through `--line-spinner-keyframes` runs only in Firefox and WebKit, so custom motion goes through a `::part(root)` rule with page keyframes (P4 A3–A5; D5).

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

Spinner takes no focus and handles no key (R8 `:84`, Keyboard "None"). The Browser tier proves that Tab skips the host (Phase 1 spec §10 SD99, `:2446`; D10).

### A11y

| Field | Value |
|-------|-------|
| Role | `progressbar` through `ElementInternals` while the spinner has a name; none, and hidden through `internals.ariaHidden`, while it has none (F1 (a), F2 (a); P1 R1, U7) |
| ARIA attributes | none on the host. Internals carry `role`, `ariaLabel` and `ariaHidden`; no `aria-valuenow`, so the progressbar is indeterminate (WAI-ARIA 1.2 `#progressbar`; P1 R1) |
| Accessible name | `label` through `internals.ariaLabel`, or the host `aria-label` or `aria-labelledby`, which win (C5; P1 N1, N2, N4). A blank value counts as none, as Icon counts `aria-label=" "` (Phase 1 spec `:1512`; P1 N5) |
| Focus | none; the host is not focusable and does not delegate focus (D10) |

- **Name required.** WAI-ARIA 1.2 gives `progressbar` "Accessible Name Required: True", so the component sets the role only with a name, and an unnamed spinner is hidden rather than a nameless progressbar that axe cannot see (P1 U1, U7; F2).
- **Busy region.** WAI-ARIA 1.2 `#progressbar` says that a progressbar describing the loading of a region should go with `aria-busy="true"` on that region "until it is finished loading". The app sets it; the spinner writes `aria-busy` nowhere (P2 RG1; R8 `:84`; D19).
- **In a button.** A named spinner joins the name of a button that takes its name from content, so the docs tell authors to leave a spinner in a `loading` slot unnamed and to put loading text beside it (P2; D19).
- **Strings.** The component ships no default name; "Loading" is the consumer's string (MANIFESTO `:66`; R8 `:286-287`; F2).
- **Motion.** Under `prefers-reduced-motion: reduce` the ring pulses in place instead of turning, and the app can opt back in (P5; F4 (a)). The rotation runs while the spinner shows; WCAG 2.2.2 and the app's part in it are under F5.
- **Forced colors.** The ring paints `CanvasText` with a `Canvas` gap, so it still reads as turning (P7; D7).
- **Non-text contrast.** The ring is in the text colour by default, so it meets WCAG 1.4.11 wherever the text meets 1.4.3 [INFERENCE: 1.4.11 asks 3:1 and 1.4.3 asks 4.5:1 of the same colour pair]. A consumer `--line-spinner-color` owns its contrast.
- **Proof (D18).** The role and name live in internals, so the Browser tier proves them as Phase 1 spec `:1180` requires, with a Chromium CDP assertion of role, name and the absence of `valuenow`, and an `INTERNALS` read-back of `role`, `ariaLabel` and `ariaHidden` in chromium, firefox and webkit (P1; §10 SD39; §12 AM-058).
- **Firefox and WebKit.** No check reads their accessibility trees, and no screen reader was run. The gap is recorded here (Phase 1 spec `:1180`; §12 AM-058).

**What axe proves here.** axe 4.14.0 sees no internals role or name, so it reports nothing for a named or an unnamed spinner of this design (P1 R1, U7). It would report a nameless host-attribute `progressbar` (P1 U4), which this design never produces. The CDP assertion carries the proof instead.

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `label` is a string, and `size` and `speed` are string enums |
| C2 | Slots carry `@slot` and a single or multiple classification | no slot (F8 (a)) |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | fires no event, so no `@fires`; not value-bearing |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated (Phase 1 spec §6.C.4 C20 row) |
| C5 | The host accepts an accessible name and applies it to the element with the role | the host carries the role through internals and takes its name from `label`, `aria-label` or `aria-labelledby` (P1 N1–N4); on the agent path the surface sets `accessibility.label` as the host `aria-label` (P10; F7 (a)) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | `size` and `speed` are reflected, closed, and change only `--line-spinner-size` and `--line-spinner-duration` on `:host` (P6; F6 (a)) |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries `@summary`, one `@csspart` and seven `@cssprop`; no `@slot` or `@fires`; nothing is deprecated (D23) |
| C8 | Missing or partial props degrade to an empty or neutral state | with no props the spinner is a decorative ring at the text size, one turn per second; an unknown `size` or `speed` draws the default; without `line-tokens` the literal fallbacks keep it turning (P6, P9; D6, D8). On the agent path a node without a name becomes a placeholder (F7 (a)) |
| C9 | A value-bearing or compound component names exactly one bubbling commit event | neither value-bearing nor compound |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

- The descriptor's prop schema leaves out `size` and `speed`. Both are styling, and the surface ignores agent theme hints by default, so the host app keeps them (ARCH §17.4 Theme row; MANIFESTO Principle 8; `0016-skeleton.md` F7 (a); F7 (a)).
- The schema leaves out `label` too, because `accessibility.label` from the `ComponentCommon` mixin names the spinner through the host `aria-label` (P10; F7 (a)).

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `Spinner` (D14) |
| Tag | `line-spinner` |
| `load()` subpath | `@websublime/line-components/spinner` |
| Prop schema | no own props; `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1, `:1323`; F7 (a)) |
| Slot map | none |
| Binding map | none; no value prop and no commit event (C9) |
| Action map | none |
| Accessibility requirements | `requiredName: [{ kind: 'accessibilityLabel' }]`; `hostNaming: { kind: 'always' }` (`packages/line-genui/src/catalog/descriptor.ts:155-185`; P10 `SpinnerD`; F7 (a)) |
| Agent-facing description | A loading indicator, a small ring that spins while something is in progress, such as data loading into a panel or a list. Set `accessibility.label` to what is loading, such as "Loading orders"; assistive technology then finds the spinner as a progress bar with that name. A Spinner node without a label does not render. The spinner shows no percentage, takes no input and is not interactive. Place it where the content will appear, and replace it with the content once the content arrives. It spins at the size and in the colour of the surrounding text; the app styles its size and speed. To keep the shape of content that is still loading, use Skeleton instead. |
| Tool description | A loading indicator, a small ring that spins while something is in progress, such as data loading into a panel or a list. Always set `accessibilityLabel` to what is loading, such as "Loading orders"; assistive technology then finds the spinner as a progress bar with that name, and without it the spinner tells assistive technology nothing. The spinner shows no percentage, takes no input and is not interactive. Place it where the content will appear, and replace it with the content once the content arrives. It spins at the size and in the colour of the surrounding text; the app styles its size and speed. To keep the shape of content that is still loading, use Skeleton instead. |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C20 row, `:1176`; Spinner is none of the three SD38 exceptions, `:2385`; D13) |

- The agent-facing description is 662 characters and the tool description 683, both under the 1024 cap (Phase 1 spec `:1422`; P10, commands 15 and 18).
- The tool description replaces `accessibility.label` with `accessibilityLabel` and the sentence about the surface placeholder with the effect of a missing name, because the tool flattens the `accessibility` object and the app, not the surface, renders a tool call (Phase 1 spec `:1405`, `:1423`; Badge's descriptor, `packages/line-genui/src/catalog/descriptors/badge.ts:9-12`; D15). Its only backticked name, `accessibilityLabel`, is a tool parameter (P10).
- The frontend tool carries `accessibilityLabel` and `accessibilityDescription` and no own parameter (P10 `SpinnerA`, `SpinnerD`). That matches the Phase 1 spec without an amendment, because `always` is the default rule of §6.G.4 (`:1514`) and Spinner joins none of the exception lists of `:1405`, `:1434`, `:1516` or SD47 (Spec drift found, item 1).
- The surface writes `accessibility.label` as `aria-label` and `accessibility.description` as `aria-description`, and a node without a non-blank label becomes a placeholder and raises `line-a2ui-error` before render (Phase 1 spec §6.G.4, `:1512-1514`; P10).
- Spinner joins the `line` catalog only. The A2UI v0.9.1 basic catalog holds 18 types and no spinner or progress type (`packages/line-genui/__tests__/fixtures/a2ui-v0_9_1/basic_catalog.json`, `jq '.components | keys'`), so the `basic` map keeps its 10 types (Phase 1 spec §6.G.2, `:1371`, `:1373`; D14).
- C20 ships its descriptor in the same PR and adds Spinner to the `<line-a2ui-surface>` render fixture and the surface axe test (Phase 1 spec §6.C.0, `:927`; §6.C.6, `:1231`; D17).
- These tests in `packages/line-genui/__tests__` change with a twentieth descriptor (D17).
  - `PROP_TYPES` gains `Spinner: {}` between `Skeleton` and `Stack` (`catalog.test.ts:97-98`), and its doc comment adds `0022-spinner.md` (`:40-46`).
  - The raw catalog of every descriptor gains `Spinner` after `Skeleton` (`:146`), and the test title at `:128` says twenty descriptors.
  - The exposure test expects `toHaveLength(20)` (`:522`, was 19) and the import test `descriptors: 20` (`:580`).
  - `LINE_COMPONENTS` gains `Spinner` between `Skeleton` and `Stack` (`catalog-emitters.test.ts:80-81`).
  - In `frontend-tools.test.ts`, the tool-name list gains `'Spinner'` between `'Skeleton'` and `'Stack'` (`:123-124`); the flat-model test gains `expect(names('Spinner')).toEqual([...ACCESSIBILITY])` after `:202`; the accessibility test adds `Spinner` to its title and to the tools that take both strings (`:262-273`); the guard test expects `lacked(spinnerDescriptor)` to be `['accessibility.label']` and its title says "the ten tool descriptions" in place of "nine" (`:441-454`) [INFERENCE: from the guard's rule and the backticked names of the agent-facing description]; and the tool-description test adds `spinnerDescriptor` to its list and title (`:457-468`).
  - `a2ui-surface.test.ts` imports `spinnerDescriptor` (`:22-35`) and gains a Spinner block after the AspectRatio block (`:551-622`), with `beforeAll(() => spinnerDescriptor.load())` and the surface cases of Tests.
  - `cem-coverage.test.ts:32-37` and `cem-drift.test.ts:76-80` use `line-spinner` as the made-up tag that a manifest or a descriptor lacks, so both would fail once Spinner ships. Both switch to the unshipped `line-input`, class `LineInput`, path `src/input/input.ts`, catalog name `Input`, the first row of PRD §4.2 (`docs/PRD.md:274`, spec `0023-input.md`), as row 01-C15 switched its made-up tag (`0016-skeleton.md:660`; D17).
- `packages/line-genui/src/catalog/tools.ts` keeps `takesAccessibility` and its JSDoc unchanged, because the JSDoc names only the `never` and `listRole` components and Spinner takes `always` (`:139-154`; F7 (a)).
- These files outside `line-genui` change.
  - `lineShowcase` in `apps/storybook/stories/agent-ui/a2ui-fixtures.ts` gains the node `{ id: 'loading-more', component: 'Spinner', accessibility: { label: 'Loading more results' } }` after the AspectRatio nodes (`:205-207`), and the root's `children` gain `'loading-more'` after `'framed'` (`:73`). Its JSDoc names Spinner (`:56-65`), and the file header that lists the render fixture names Spinner (C20) (`:1-4`).
  - `'agent-ui-a2ui-surface--line-catalog'` in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` counts 44 elements (`:34`, was 43), the settle selector adds `line-spinner` (`:63`), and the file JSDoc names C20 (`:1-23`).

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/spinner` |
| Kind | `independent` (Phase 1 spec §4.2, `:308`; §10 SD12) |
| Registers | `line-spinner` |
| Reset modules | `commonReset` only (ARCH §14.7, `docs/ARCHITECTURE.md:1163`; D4) |

- The files are `src/spinner/spinner.ts`, with the class `LineSpinner` and `customElements.define`, `src/spinner/spinner.types.ts` with `SpinnerSize` and `SpinnerSpeed`, and `src/spinner/index.ts`, which exports `LineSpinner` and both types, as `src/aspect-ratio/index.ts` does; the root `src/index.ts` is unchanged.
- `package.json` gains the `./spinner` export after `./aspect-ratio` (Phase 1 spec §4.2, `:259`; `packages/line-components/package.json:98-101`), and the Vite build gains the `spinner/index` entry after `aspect-ratio/index` (`packages/line-components/vite.config.mjs:29`). No new dependency.
- `packages/line-components/__tests__/bundle-splitting.test.ts` gains the `EXPECTED_TAGS` row `'./spinner': ['line-spinner']` after `./aspect-ratio` (`:76`). It needs no `ALLOWED_TAG_REFERENCES` row [INFERENCE: the module names no other `line-*` tag].
- `line-genui` gains `src/catalog/descriptors/spinner.ts` with `spinnerDescriptor`. `src/catalog/index.ts` imports it after `skeletonDescriptor` (`:31`), adds it to the named exports between `skeletonDescriptor` and `stackDescriptor` (`:125-126`), and adds it to the `descriptors` array in catalog-name order, between `skeletonDescriptor` and `stackDescriptor` (`:149-150`).
- Spinner imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`).

### Markup examples

```html
<!-- A loading panel; the region is busy and the spinner is named -->
<section aria-busy="true" aria-label="Orders">
  <line-center><line-spinner size="5" label="Loading orders"></line-spinner></line-center>
</section>

<!-- Inline and decorative; the text says what is happening -->
<p><line-spinner></line-spinner> Saving…</p>

<!-- A loading button; the spinner stays unnamed and the slot carries the text -->
<line-button loading>
  Save
  <span slot="loading"><line-spinner></line-spinner> Saving…</span>
</line-button>

<!-- A loading icon button, named by the IconButton's own label -->
<line-icon-button loading aria-label="Refresh">
  <line-icon library="lucide" name="refresh-cw"></line-icon>
  <line-spinner slot="loading"></line-spinner>
</line-icon-button>

<!-- Named by visible text elsewhere -->
<span id="upload-status">Uploading report.pdf</span>
<line-spinner aria-labelledby="upload-status"></line-spinner>

<!-- Slower and larger -->
<line-spinner size="6" speed="slow" label="Preparing your export"></line-spinner>

<!-- An htmx indicator, shown only while the request runs (P8) -->
<button hx-get="/results" hx-target="#results" hx-indicator="#results-spinner">Search</button>
<line-spinner id="results-spinner" class="htmx-indicator" label="Loading results"></line-spinner>
```

A `line` catalog node the surface renders as a named spinner:

```json
{ "id": "loading", "component": "Spinner", "accessibility": { "label": "Loading orders" } }
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom, `packages/line-components/__tests__/spinner.test.ts`, which imports `LineSpinner` as a value and mounts through `fixture()` from `@open-wc/testing-helpers` (P9) | registers `line-spinner` with its class; the shadow root holds one `<span part="root">`; with no name the internals read back `role` `null` and `ariaHidden` `"true"`, and with `label`, `aria-label` or `aria-labelledby` they read `role` `progressbar`, `ariaHidden` `null` and `ariaLabel` from `label` only; a blank `label` counts as none; after the first render, adding a host `aria-label` sets `role` `progressbar` and removing it sets `role` `null` and `ariaHidden` `"true"` again, and the same holds for `aria-labelledby`; a blank `label` reads `ariaLabel` `null`; no host attribute is written; `size` and `speed` reflect a set value, leave no attribute when `undefined`, read `undefined` for an unknown attribute value while the attribute keeps it, and return to `undefined` when the attribute is removed; `label` does not reflect; computed `--line-spinner-size` `1em` and `--line-spinner-duration` `1s` with no attribute, and each step's literal through the fallbacks; `hidden` hides the host; dispatches no event (a `dispatchEvent` spy on `LineSpinner.prototype` while every prop is set and changed, as `skeleton.test.ts` does) |
| Browser | Playwright `packages/line-components/__tests__/integration/spinner/spinner.e2e.ts` on chromium, firefox and webkit, over fixture pages under `integration/spinner/` | the internals proof of Phase 1 spec `:1180`, a Chromium CDP assertion of `progressbar` with its name and no `valuenow`, or of no node, and an `INTERNALS` read-back of `role`, `ariaLabel` and `ariaHidden` in three engines, for a named spinner, an unnamed one, `aria-label` over `label`, `aria-labelledby`, a `label` changed after render, and a host `aria-label` added and then removed after the first render (P1, P3; D18); an unnamed spinner in the `loading` slot of `<line-button loading>Save</line-button>` and of `<line-icon-button loading aria-label="Refresh">`, which holds the text glyph `<span aria-hidden="true">↻</span>`, the fixture's choice (P2 recorded only the `↻` glyph), so the fixture needs no `./icon` or registry, gets a Chromium CDP assertion of the button named `Save` or `Refresh` with no child `progressbar` node, a read of `aria-disabled="true"` on the inner `<button>` through the host's shadow root, and an `INTERNALS` read-back of the slotted spinner (`role` `null`, `ariaHidden` `"true"`) in three engines; no assertion of this rests on `ariaSnapshot()`, which reports `button "Save"` for a named spinner too (P2 B1, B2, B7, I2); Tab skips the host (§10 SD99); `getAnimations()` on `root` names `line-spinner-spin`, 1000 ms, infinite, and 2000 and 750 ms for `slow` and `fast`; sizes 16–48 px for steps 1–6 and 16 and 24 px at 16 and 24 px fonts; an unknown `size` or `speed` draws the default; `emulateMedia({ reducedMotion: 'reduce' })` runs `line-spinner-pulse` at 2000 ms for every `speed`, and a page `::part(root)` rule with page keyframes still runs (P5); `--line-spinner-keyframes: none` and `--line-spinner-iteration-count: 3` from the page stop the motion (P4); a parent colour and `--line-spinner-color` colour the ring and the inline-end side stays transparent (P6); `flex-shrink: 0` keeps 16 × 16 in a crowded flex row; Chromium `emulateMedia({ forcedColors: 'active' })` computes `CanvasText` on three sides and `Canvas` on the gap with and without a consumer colour (P7); a no-tokens twin page turns at 1000 ms and sizes steps from their fallbacks (P6) |
| A11y | axe-core, `packages/line-components/__tests__/a11y/spinner.e2e.ts` | zero violations (MANIFESTO Law 3) in every story of D20 (Phase 1 spec §7.4) |
| htmx | Playwright `*.e2e.ts` through the shared harness `@websublime/line-testing/htmx` (`packages/line-testing/src/htmx.ts`), on htmx 2 and htmx 4 in chromium, firefox and webkit | `n/a`. Spinner is neither value-bearing, because its descriptor binding map names no value prop, nor compound, because it holds no interactive element (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`; plan §2.4, `docs/plans/01-plan-core-primitives.md:172-175`), and it has no slot, so behaviour (d) has nothing to swap into. P8 drove a spinner as an htmx indicator and swapped one out on htmx 2.0.11 and 4.0.0 in three engines, and both worked with nothing from the component. This confirms the Phase 1 spec's "`n/a` expected" (§6.C.4 C20 row, `:1176`; §10 SD34, `:2381`; D16) |
| Visual | Playwright `packages/line-components/__tests__/visual/spinner.visual.ts` on the `visual` project | every story of D20 with Linux baselines from a `visual-baselines.yml` run (Phase 1 spec §6.C.6, `:1233`; §10 SD98). `toHaveScreenshot` disables animations by default and cancels infinite ones to their initial state, so each ring is captured unrotated (`node_modules/playwright/types/test.d.ts:9976-9981`; D21) |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts`; Playwright axe in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` | a `line` catalog `Spinner` node with `accessibility.label` renders `<line-spinner aria-label="…">`, whose internals read back `role` `progressbar` through `FakeInternals`; `accessibility.description` sets `aria-description`; a node with no label, or a blank one, renders the `missing-name` placeholder and raises `MISSING_ACCESSIBLE_NAME` (P10); the node joins the surface render fixture and the surface axe test (Phase 1 spec §6.C.6, `:1231`; D17) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the CEM coverage and drift tests pass with the new descriptor (Phase 1 spec §6.G.5); `catalog.json` holds `Spinner` and its inline projection validates (§6.G.2; P10); the `Spinner` tool takes the tool description, stays at or under 1024 characters, passes the backtick guard and carries `accessibilityLabel` and `accessibilityDescription` only (§6.G.3, `:1422-1423`); the coverage and drift tests use `line-input` as their made-up tag; the lists and counts change as the Agent contract says (D17) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./spinner` register `line-spinner` only, and the isolation scan finds no other component's module or tag in its bundle (Phase 1 spec §7.5). `packages/line-components/__tests__/manifest-paths.test.ts` reads the packed `custom-elements.json`, as for Aspect Ratio (`:450-460`): `line-spinner` resolves to `src/spinner/spinner.ts`; its own public fields are `label`, `size` and `speed`; its events and slots are empty; its parts are `['root']`; it lists seven `@cssprop` tokens (ARCH §17.2 C7; D23) |

- PRD §5.2 checklist mapping (`docs/PRD.md:535-544`; Phase 1 spec §6.C.6, `:1222`). (1) Render runs in the Unit tier. (2) Reactive props run in the Unit tier, for reflection, semantics and computed tokens, and in the Browser tier, for sizes and durations. (3) Slots do not apply, because Spinner has none. (4) Parts run in the Unit tier (the `root` part exists) and the Browser tier (a page `::part(root)` rule). (5) Custom properties run in the Unit tier (computed defaults) and the Browser tier (consumer tokens). (6) Events (none) run in the Unit tier, by the `dispatchEvent` spy, and in the Packaging tier, by the CEM assertion. (7) Keyboard (Tab skips the host) runs in the Browser tier (§10 SD99). (8) axe runs in the A11y tier.
- §6.C.6 obligations. The Storybook docs land as D20 says, the `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` row and the READMEs as D22 says, and the CEM JSDoc as D23 says. The size report runs through the "Size report" step against the < 5 KB soft target (Phase 1 spec §7.6, `:2144`; P12), and the changeset follows PROCESS §6. No other component is imported (Bundle). The Agent contract is filled above. The htmx row is `n/a` with its reason. The surface fixture and surface axe rows are above (`:1231`). No update-rate measurement, because Spinner is not a machine row (`:1232`). The visual tier is the row above (`:1233`).
- The axe and visual tests run against the Storybook stories on port 4320, with the story list and `readySpinnerStory(page, id)` in `packages/line-components/__tests__/spinner-stories.ts`, after `readyAspectRatioStory` in `aspect-ratio-stories.ts`, waiting until every `line-spinner`, `line-button`, `line-icon-button`, `line-icon` and `line-center` of the story is defined and has updated, and until the IconButton story shows its icon glyph, as `waitForIconStory` does (`packages/line-components/__tests__/icon-stories.ts:26-36`).
- `integration/spinner/index.html` loads `integration/spinner/fixture.ts`, which imports the built `@websublime/line-components/spinner`, `./button` and `./icon-button` by package name and `@websublime/line-tokens/motion`, `./easings` and `./sizing`, and re-exports `INTERNALS` for the read-back with `// biome-ignore lint/performance/noBarrelFile` and `export { INTERNALS } from '@websublime/line-core';`, as `integration/alert/fixture.ts:11-12` does. `integration/spinner/no-tokens.html` and `no-tokens.ts` import the component alone, as Grid's no-tokens twin does (`packages/line-components/__tests__/integration/grid/no-tokens.html`). The tree, motion and layout tests use these pages, served by the existing port-4321 `webServer` (`playwright.config.ts:23-28`). Each test opens the page after `customElements.whenDefined` resolves for `line-spinner`, `line-button` and `line-icon-button`, and reads only after `customElements.whenDefined` and then `updateComplete` of every `line-*` element it mounted, as `integration/aspect-ratio/aspect-ratio.e2e.ts:33`, `:45` does.

### Competitive analysis row

The C20 PR appends this row to the §4.1 table of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md`, in catalog order after `Skeleton`, from P11, checked 2026-11-17 (Phase 1 spec §6.C.6, `:1226`; D22). The Notes cell states the decided design.

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Spinner[^4.1-spinner] | `<line-spinner>` (`@websublime/line-components/spinner`, spec `0022-spinner.md`) | `<wa-spinner>` | `<sp-progress-circle indeterminate>` | `<lion-progress-indicator>` | `<fluent-spinner>` | — | — | — | Every library with a role uses `progressbar`: Web Awesome on an inner `<svg>`, Spectrum and Lion as a host attribute, Fluent through `ElementInternals`, as line://ui does. Web Awesome and Lion ship an English "Loading" default; Spectrum, Fluent and line://ui take the name from the consumer, and line://ui hides an unnamed spinner. None of the four handles reduced motion, and only Spectrum and Fluent handle forced colors. Radix Primitives, Bits UI and Ark UI ship only a Progress primitive. Outside the table, Radix Themes `Spinner`, Chakra UI `Spinner` and Mantine `Loader` draw a ring or leaves with no role and no name |

The footnote reads `[^4.1-spinner]: Spinner, checked 2026-11-17; line://ui cell updated <merge date> (shipped). line://ui: shipped by ledger row 01-C20 at @websublime/line-components/spinner (packages/line-components/src/spinner/spinner.ts, spec 0022-spinner.md), PRD §4.1.` followed by one source per cell, from the P11 table, each `npm pack` of the version P11 names, with the file and line it cites.

### Spec drift found

| # | Where | Finding | Kind |
|---|---|---|---|
| 1 | Phase 1 spec §6.G.3 (`:1405`, `:1434`), §6.G.4 (`:1514-1516`), §10 SD47 (`:2394`) | these places list the components whose tools carry neither accessibility parameter and whose surface node takes no host name. `:1434` names Button and Separator as the tools that carry both, while Avatar, AvatarGroup, Badge, ButtonGroup, Chip and IconButton carry them too (`packages/line-genui/__tests__/frontend-tools.test.ts:262-273`). Under F7 (a), decided, Spinner carries both and joins no exception list | not drift for this row; the `:1434` carriers read as examples, and F7 (a) needs no Phase 1 spec AM |
| 2 | Phase 1 spec §6.G.3 Acceptance (`:1438`) | it names Button, Separator and Stack as the descriptors that set a tool description, while Alert, AspectRatio, Avatar, AvatarGroup, Badge, ButtonGroup, Center, Grid and IconButton set one too (`packages/line-genui/README.md:92`). Spinner sets one (D15) | not drift; the list reads as examples, as `0021-aspect-ratio.md` Spec drift found, item 2, recorded |
| 3 | `0016-skeleton.md:753`, Spec drift found, item 5 there; `packages/line-tokens/src/animations.css:57-61`, `:96` | that item recorded for C20 that a shadow-root component cannot use the `line-tokens` keyframes. P4 confirms it for `--line-animation-spin` in Chromium, while Firefox and WebKit run it. No document says a component consumes those tokens; they still serve light-DOM and `::part` users | no drift; confirmation |
| 4 | R8 `docs/research/01-research-accessibility.md:84` | R8 says to omit `aria-valuenow` on an indeterminate `progressbar`. Chromium still exposes `valuemin=0` and `valuemax=100`, the ARIA 1.2 implicit defaults, with an empty `valuetext` (P1 R1) | record only; R8 is research and carries no rules (PROCESS §1) |
| 5 | Phase 1 spec §6.C.4 C20 row (`:1176`) | the htmx cell reads "`n/a` expected [INFERENCE]". P8 confirms it | no drift; confirmation |
| 6 | Phase 1 spec §6.C.4 C20 row (`:1176`); R8 §6 Q9 (`:343`) | R8 Q9 asks for a screen-reader pass of each role. No screen reader ran; Phase 1 spec SD39 and AM-058 make the pass optional and never blocking (`:1180`, `:2386`) | no drift; the gap is recorded under What automation cannot observe |
| 7 | `0016-skeleton.md:660`; `packages/line-genui/__tests__/cem-coverage.test.ts:32-37`; `cem-drift.test.ts:76-80` | the coverage and drift tests use `line-spinner` as their made-up tag, which C20 ships | an obligation, not drift; D17 switches the tag to `line-input` |
| 8 | ARCH §13.5 (`docs/ARCHITECTURE.md:624`) | it names the props `size`, `speed` and `label` and the part `root`. The decided options keep all four (F1 (a), F2 (a), F6 (a)) | no drift |
| 9 | PRD §4.1 (`docs/PRD.md:268`), "CSS-only animation, no visual opinion" | the decided design animates through CSS only and draws a ring in `currentColor`, with no colour of its own. The ring itself is a drawing default, which F8 (a) decided | no drift |
| 10 | `0002-button.md:315`, `0003-icon-button.md:308`, `0004-button-group.md:436` | their markup puts an unnamed `<line-spinner>` in the `loading` slot. Under F2 (a) that spinner is hidden, so each button keeps its name (P2 B1, B7, I2) | no drift; confirmation |

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| F1 | Which role does a named spinner carry, and where does it live? | Miguel | decided: option (a), `progressbar` through `ElementInternals` while the spinner has a name (Miguel, 2026-11-17) |
| F2 | Where does the name come from, and what does an unnamed spinner expose? | Miguel | decided: option (a), `label` through internals with host `aria-label` and `aria-labelledby` winning, and an unnamed spinner hidden (Miguel, 2026-11-17) |
| F3 | Where do the keyframes live? | Miguel | decided: option (a), own keyframes in the component stylesheet, with internal names (Miguel, 2026-11-17) |
| F4 | What happens under `prefers-reduced-motion: reduce`? | Miguel | decided: option (a), a 2 s opacity pulse in place of rotation, at normal importance so an app can opt back in (Miguel, 2026-11-17) |
| F5 | How does the spinner meet WCAG 2.2.2 when loading lasts more than five seconds? | Miguel | decided: option (a), infinite by default, `--line-spinner-iteration-count` for a finite count, and docs that give the app its part in SC 2.2.2 (Miguel, 2026-11-17) |
| F6 | What shape do `size` and `speed` take? | Miguel | decided: option (a), `size` steps `1`–`6` on `--line-size-3`…`-8` and `speed="slow \| normal \| fast"` (Miguel, 2026-11-17) |
| F7 | Which props reach agents, and how does an agent name a spinner? | Miguel | decided: option (a), no own props, `hostNaming: always` and a required `accessibility.label` (Miguel, 2026-11-17) |
| F8 | What does the spinner draw? | Miguel | decided: option (a), a ring arc in `currentColor` with a transparent gap and no track (Miguel, 2026-11-17) |

**Drafter defaults** (Miguel left D1–D24 as drafted, 2026-11-17)

| # | Default | Basis |
|---|---------|-------|
| D1 | Static, with no machine, no states and no events; neither value-bearing nor compound; not form-associated | ARCH §8, `:410`; ARCH §13.5, `:624`; Phase 1 spec §6.C.4 C20 row, `:1176`; ARCH §17.2 C3, C9 |
| D2 | One shadow `<span part="root">`; `root` is the only part | ARCH §13.5 "Parts: root" (`:624`); ARCH §5 (`:306`); MANIFESTO Law 1 |
| D3 | `:host([hidden]) { display: none }`, as the last rule of the stylesheet | probe P6; `0021-aspect-ratio.md` D3; `0016-skeleton.md` D3 |
| D4 | `commonReset` is the only reset module | ARCH §14.7, `:1163` (Spinner named in the Static row) |
| D5 | The seven `--line-spinner-*` tokens and their defaults; `size`, `speed` and reduced motion change only token defaults; the keyframe names `line-spinner-spin` and `line-spinner-pulse` are internal, and the docs show custom motion through page keyframes in a `::part(root)` rule only | ARCH §17.2 C6; probes P4 A1, A3–A5 (a `::part` rule naming an internal keyframe stops the motion in Chromium and WebKit; a page keyframe through the token runs only in Firefox and WebKit), P5, P6; `0016-skeleton.md` D18 |
| D6 | Every `line-tokens` read carries a literal fallback equal to its token value, the easing fallbacks included as the token's own `cubic-bezier()` (`packages/line-tokens/src/easings.css:9`, `:14`) | probe P6 (without fallbacks and tokens the ring is 4 × 4 and still; with fallbacks every value holds); `0021-aspect-ratio.md` F6 (b), decided by Miguel on 2026-11-17 |
| D7 | Under `forced-colors: active`, `root` paints `border-color: CanvasText` and `border-inline-end-color: Canvas`, set on `root` so it holds whatever the consumer set `--line-spinner-color` to | probe P7 (forced colors erase a transparent gap; `Canvas` survives; a consumer colour does not change it); Fluent's rule (P11); `0016-skeleton.md` D20 (the fallback sits on the part, not the token) |
| D8 | `size` and `speed` convert an unknown value to `undefined` with a local copy of Grid's `variantConverter`, reflect a set value, and leave no attribute by default; the stylesheet draws each default without an attribute; nothing throws | ARCH §17.2 C8; MANIFESTO Law 9; `packages/line-components/src/grid/grid.ts:16-19`; probes P6, P9; `0021-aspect-ratio.md` D8 |
| D9 | `#writeSemantics()` writes `role`, `ariaLabel` and `ariaHidden`. `willUpdate` runs it on the first update and when `label` changes, and an `observedAttributes` override plus `attributeChangedCallback` run it when `aria-label` or `aria-labelledby` changes, with no reactive property for either; `label` does not reflect; a blank value counts as none and writes `null` to `ariaLabel` | probes P1 N5, P3, P9; Icon's route (`packages/line-components/src/icon/icon.ts:96-99`, `:163-168`, `:184-189`); `@lit/reactive-element` 2.1.2 `development/reactive-element.js:610-612`, `:651-658`; `0014-icon.md` F10; Phase 1 spec `:1512` (the trim rule) |
| D10 | No focus on the host, no key handling, no `delegatesFocus`, no `tabindex` | R8 `:84` Keyboard "None"; Phase 1 spec §10 SD99 |
| D11 | `flex-shrink: 0` on `:host` | probe P6 FLEX1, FLEX2; Icon's host rule (`packages/line-components/src/icon/icon.ts:70-79`) |
| D12 | No `vertical-align`, `margin` or other placement rule on the host; the docs show `vertical-align: middle` as a consumer rule beside text | MANIFESTO Out of Scope, "Opinionated default styling" (`docs/MANIFESTO.md:64`); Icon sets none (`icon.ts:70-79`) [INFERENCE: baseline placement beside text was not measured] |
| D13 | `agentExposed: true` | Phase 1 spec §6.C.4 C20 row, `:1176`; SD38 names three other components (`:2385`); a named spinner adds only the agent's label as text, which the surface already applies to every `always` component, and paints within the surface, so neither SD38 reason applies (`:1336-1338`) |
| D14 | Catalog name `Spinner`; `line` catalog only; the `basic` map keeps its 10 types | PRD `:268`; Phase 1 spec §6.G.2, `:1371`, `:1373`; the vendored basic catalog has no spinner or progress type |
| D15 | The descriptor sets a tool description that names `accessibilityLabel` where the agent-facing description names `accessibility.label` | Phase 1 spec §6.G.3, `:1405`, `:1423`; Badge's descriptor (`packages/line-genui/src/catalog/descriptors/badge.ts:9-12`); probe P10, commands 15 and 18 |
| D16 | htmx row `n/a`; the docs show `class="htmx-indicator"` with `hx-indicator` | Phase 1 spec §10 SD34; ARCH §17.2 C9; plan §2.4; probe P8 |
| D17 | The genui tests and the surface fixture change as the Agent contract lists, with `line-input`, class `LineInput`, path `src/input/input.ts`, catalog name `Input` as the new made-up tag | Phase 1 spec §6.C.6, `:1231`; the locators in the Agent contract; PRD §4.2 first row (`docs/PRD.md:274`); `0016-skeleton.md:660` and `0015-kbd.md:607` for the same switch |
| D18 | The Browser tier proves the role and name with a Chromium CDP assertion and an `INTERNALS` read-back in three engines, and asserts nothing about them through `ariaSnapshot()` | Phase 1 spec `:1180`; §10 SD39; §12 AM-058; probe P1 (`ariaSnapshot()` sees no internals role or name) |
| D19 | The docs tell authors to leave a spinner in a `loading` slot unnamed with loading text beside it, to name a standalone spinner, to put `aria-busy="true"` on the region that is loading, and that the component ships no "Loading" string | probe P2 (a named spinner joins the button's name); WAI-ARIA 1.2 `#progressbar` (`aria-busy` on the region); R8 `:84`, `:286-287`; MANIFESTO `:66` |
| D20 | `apps/storybook/stories/components/spinner.stories.ts` with `title: 'Components/Primitives Base/Spinner'` (PRD §4.1 heading, `docs/PRD.md:244`), the pinned meta `id: 'components-spinner'`, `tags: ['autodocs']`, the imports `@websublime/line-components/spinner`, `./button`, `./icon-button`, `./icon` and `./center` and `@websublime/line-tokens/motion`, `./easings` and `./sizing`, the icon registry set up as `icon.stories.ts` does it, and a `DESCRIPTION` that carries D19's advice, the reduced-motion pulse and F5's guidance. Stories: Default (unnamed beside text); Labelled (standalone with `label`); Sizes (`1`–`6`); Speeds; In a Button; In an IconButton; Busy region; Custom tokens (the Consumer styling rules) | the story-title rule of the template (`COMPONENT-SPEC-TEMPLATE.md:213`); `aspect-ratio.stories.ts` and `skeleton.stories.ts` patterns; the Storybook preview loads only `line-colors` and `line-themes` (`apps/storybook/.storybook/preview.ts:3-4`) |
| D21 | The visual tier relies on `toHaveScreenshot`'s default `animations: "disabled"`, which cancels the infinite rotation to its initial state, and adds no motion option | `node_modules/playwright/types/test.d.ts:9976-9981`; `0016-skeleton.md` D14 |
| D22 | The C20 PR also adds the Spinner row and footnote of Competitive analysis row to `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1, writes the Storybook docs, adds a `## Spinner` section to `packages/line-components/README.md` after `## Aspect Ratio` (`:709`) with D19's advice and the htmx recipe, adds `spinnerDescriptor` to the export table of `packages/line-genui/README.md` (`:39`), Spinner to the tools that set a tool description (`:92`) and to those that take both accessibility parameters (`:125`), reports the gzipped size against the < 5 KB soft target, and adds one changeset for `@websublime/line-components` and `@websublime/line-genui` with the bump PROCESS §6 picks | Phase 1 spec §6.C.6; PROCESS §6; `0021-aspect-ratio.md` D18 |
| D23 | The class JSDoc says what the component is for, that a name makes it a progress bar and no name makes it decorative, to leave it unnamed in a `loading` slot, to put `aria-busy` on the loading region, how reduced motion changes it, and that the keyframe names are internal; `@summary`; `@csspart root`; `@cssprop` for each of the seven tokens with its default | ARCH §17.2 C7; the JSDoc patterns of Skeleton (`packages/line-components/src/skeleton/skeleton.ts:10-45`) and Icon (`icon.ts:42-59`) |
| D24 | The ring turns clockwise in both directions, and the gap follows the inline-end side; the component sets no `direction` rule | `LineElement` owns `direction` (`0018-stack.md` AM-001) [INFERENCE: right-to-left was not probed] |

Miguel decided F1–F8 on 2026-11-17, each on the option the draft recommended, and left D1–D24 as drafted. Each section below states the decision, and its option table stays as the record of what he weighed.

### F1 — Role

**Decision.** Miguel chose option (a) on 2026-11-17, so a named spinner carries `progressbar` through `ElementInternals`, with no `aria-valuenow`, and the host carries no `role` attribute.

**Evidence.** R8 names three candidates for Spinner, "`status` (polite live region, name from author)", "`progressbar` (name required; omit `aria-valuenow` when indeterminate)" and "`img` (name required, no live update)" (`docs/research/01-research-accessibility.md:84`). WAI-ARIA 1.2 says a progressbar "indicates that the user's request has been received and the application is making progress toward completing the requested action", and that the author "SHOULD omit the aria-valuenow attribute" when the value is indeterminate. It defines `status` as a live region "whose content is advisory information", with implicit `aria-live="polite"` and `aria-atomic="true"`, and `img` as "a single graphic". Probe P1 exposed each role through internals with its internals name in Chromium (R1–R3), and `ariaSnapshot()` and axe saw none of them. A host-attribute role is visible to both, and axe then reports it unless its name is a host attribute as well (R5, R7, U4, U6). In a button any named role joins the button's name (P2). Every competitor with a role uses `progressbar`, and Fluent sets it through internals (P11).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `progressbar` through internals | `internals.role = 'progressbar'` with no `aria-valuenow`, only while the spinner has a name (F2 (a)) | Says "work in progress" in the ARIA vocabulary for it, as Web Awesome, Spectrum, Lion and Fluent do. Nothing sprouts on the host, and an author `role` wins. axe cannot see it, so the CDP and `INTERNALS` proof carries the check (D18) |
| (b) `progressbar` as a host attribute | the component writes `role="progressbar"` and copies `label` to the host `aria-label` | axe and `ariaSnapshot()` see the role, and axe catches a nameless one (U4). The component sprouts two author-owned attributes, and it must copy the name, because axe does not see an internals name (R5) |
| (c) `status` through internals | `internals.role = 'status'`, a polite live region | A live region with no content has nothing to announce, so its name is what a screen reader may find while browsing [INFERENCE: no screen reader ran]. Every spinner on a page becomes a live region |
| (d) `img` through internals | `internals.role = 'img'` | A named picture with no live update, as R8 says. It says "image" where the user needs "busy" [INFERENCE], and no competitor uses it |
| (e) No role | the spinner is always decorative; the app conveys loading in text or with `aria-busy` | The smallest surface, as Radix Themes, Chakra and Mantine do. `label` would name nothing, so ARCH §13.5's `label` prop goes, an ARCHITECTURE change that raises the class to `decision` |

### F2 — Name source and the unnamed spinner

**Decision.** Miguel chose option (a) on 2026-11-17, so `label` sets `internals.ariaLabel`, a host `aria-label` or `aria-labelledby` names the spinner too and wins, and a spinner with no non-blank name has no role and is hidden through `internals.ariaHidden`.

**Evidence.** ARCH §13.5 gives Spinner a `label` prop (`docs/ARCHITECTURE.md:624`), and ARCH §17.2 C5 lets a host accept `aria-label` and `aria-description` or a documented label property. MANIFESTO Out of Scope makes "Loading" the consumer's string (`docs/MANIFESTO.md:66`). WAI-ARIA 1.2 gives `progressbar` and `img` "Accessible Name Required: True". Probe P1 named an internals progressbar from `label` (R1), from a host `aria-label`, which wins over `label` (N1, N2), and from `aria-labelledby` (N4). Writing `label` to the host as `aria-label` works but sprouts the attribute (N3). An internals progressbar with no name shows in Chromium as `progressbar ""` and raises nothing in axe (U1); the recommended design hides it instead (U7). The semantics follow later changes of the name (P3). Icon hides itself until a host `aria-label` names it (`packages/line-components/src/icon/icon.ts:184-189`). Inside a button, an unnamed spinner leaves the button's name alone, and a named one joins it (P2). Web Awesome and Lion ship an English default; Spectrum and Fluent take the name from the author (P11).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `label` in internals, host attributes win, unnamed is hidden | `label` sets `internals.ariaLabel`; a host `aria-label` or `aria-labelledby` names it too and wins; with no non-blank name the role is removed and `internals.ariaHidden` is `"true"` | No nameless progressbar ever reaches the tree (U7). An unnamed spinner fits a `loading` slot as is (P2 B1, B7, I2). A standalone spinner without a name says nothing to assistive technology, and no check can catch it, because axe does not see internals (P1) |
| (b) As (a), but an unnamed spinner keeps its role | the progressbar shows with an empty name | Every spinner is found as busy, but a nameless one breaks the ARIA name requirement where axe cannot see it (U1), and inside a button it adds a nameless child |
| (c) Host attributes only, no `label` prop | the spinner reads only `aria-label` and `aria-labelledby`, as Icon does | One naming route, the platform one. ARCH §13.5 names `label`, so dropping it is an ARCHITECTURE change that raises the class to `decision` |
| (d) `label` written to the host `aria-label` | the component copies `label` into the host attribute | axe and `ariaSnapshot()` see the name (N3). The component writes an attribute the author owns, and must decide which wins when both are set |

### F3 — Keyframes

**Decision.** Miguel chose option (a) on 2026-11-17, so `@keyframes line-spinner-spin` and `line-spinner-pulse` live in the component stylesheet under internal names, and custom motion goes through a page `::part(root)` rule with page keyframes.

**Evidence.** `line-tokens` ships `@keyframes line-spin` and `--line-animation-spin` (`packages/line-tokens/src/animations.css:57-61`, `:96`). In probe P4, `animation: var(--line-animation-spin)` on a shadow element runs in Firefox and WebKit and not in Chromium (A2), and a plain host naming any document keyframe from its shadow sheet runs nowhere in Chromium. The component's own keyframes run in all three engines (A1). A page `::part(root)` rule with page keyframes runs in all three engines (A3); one naming the component's keyframe stops the motion in Chromium and WebKit (A4); a page keyframe through the keyframes token runs only in Firefox and WebKit (A5). Skeleton chose its own keyframes for the same reason (`0016-skeleton.md` F2 (a)).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Own keyframes, internal names | `@keyframes line-spinner-spin` and `line-spinner-pulse` in the component stylesheet, named through `--line-spinner-keyframes`; custom motion goes through `::part(root)` with page keyframes | Turns in all three engines and touches no other package. `line-spinner-spin` repeats `line-spin` under another name |
| (b) The `line-tokens` token | `animation: var(--line-animation-spin)` on `root` | No motion in Chromium (A2), so it fails Chromium users |
| (c) Own keyframes and a public keyframe route | as (a), and the docs present `--line-spinner-keyframes` with page keyframes as a styling API | Works only in Firefox and WebKit (A5), so the docs would promise a route Chromium ignores |

### F4 — Reduced motion

**Decision.** Miguel chose option (a) on 2026-11-17, so under `prefers-reduced-motion: reduce` the ring pulses in place for 2 s instead of turning, through a normal-importance rule that a page `::part(root)` rule can override.

**Evidence.** In probe P5, a normal-importance rule under `prefers-reduced-motion: reduce` stopped the rotation, slowed it to 3 s, or swapped it for a 2 s opacity pulse, and a consumer's `::part(root)` rule with page keyframes still ran under each. Without a rule the ring keeps turning. Stopped, the ring rests as a three-quarter circle (P5, A8), which WCAG Understanding 2.2.2 Note 4 describes as content users may think "was frozen or broken". AvatarGroup sets its transition token to `0s` under the same query (`packages/line-components/src/avatar-group/avatar-group.ts:123-127`), and Skeleton stops its motion (`0016-skeleton.md` F3 (a)). None of the eleven competitor packages has a reduced-motion rule that reaches its spinner (P11). WCAG 2.3.3 (AAA) asks that motion from interaction can be turned off.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Pulse in place | under the query `:host, :host([speed])` set `--line-spinner-keyframes: line-spinner-pulse`, 2 s, `--line-easing-in-out`; the ring fades to 40 % and back without turning | No rotation for users who asked, and the spinner still shows that work runs. A pulse is still a change on screen, and whether WCAG 2.2.2 reads it as blinking is open [INFERENCE]. The app can opt back in through `::part(root)` |
| (b) Slow rotation | under the query the turn takes 3 s | Activity stays visible, but the motion the user asked to reduce remains |
| (c) Stop | under the query `--line-spinner-keyframes: none` | No motion at all, as Skeleton does. The still ring may read as frozen or broken (Understanding 2.2.2 Note 4); a named progressbar still says "busy" to assistive technology |
| (d) Nothing | no component rule; the app handles the query | What every competitor does (P11). Each app repeats the rule, and MANIFESTO Law 3 rests on each consumer |

### F5 — Motion longer than five seconds

**Decision.** Miguel chose option (a) on 2026-11-17, so the ring turns while it shows, `--line-spinner-iteration-count` lets an app set a finite count, and the docs name the three conditions of SC 2.2.2 and the app's part when they hold.

**Evidence.** WCAG 2.2 SC 2.2.2 (Level A) says: "For any moving, blinking or scrolling information that (1) starts automatically, (2) lasts more than five seconds, and (3) is presented in parallel with other content, there is a mechanism for the user to pause, stop, or hide it unless the movement, blinking, or scrolling is part of an activity where it is essential". Understanding 2.2.2 says that "'starts automatically' broadly refers to animations/updates that are not the direct result of a user's intentional activation, for example, selecting a link or button". Its Note 4 says: "An animation that occurs as part of a preload phase or similar situation can be considered essential if interaction cannot occur during that phase for all users and if not indicating progress could confuse users or cause them to think that content was frozen or broken". Its "loading" example exempts a preloader that "is the only content on the page", because it "is not presented in parallel with other content" (`https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html`, read 2026-11-17). So a spinner shown after the user presses a button does not start automatically, and a spinner that is the only content is not in parallel, while a spinner that loads one widget on an otherwise usable page and runs past five seconds falls under the criterion [INFERENCE: the component cannot tell which case it is in]. Probe P4 A8 showed that a finite iteration count stops the ring and leaves it still. Skeleton runs two cycles and rests (`0016-skeleton.md` F4 (b)). Web Awesome, Spectrum, Fluent, Chakra and Mantine turn forever (P11).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Infinite, with a token and docs | `--line-spinner-iteration-count: infinite`; the docs name the three conditions of SC 2.2.2, and say that an app showing a spinner on its own beside usable content removes or hides it within five seconds, gives a way to stop it, or sets a finite count | The spinner keeps saying "still working" for as long as the work runs, in the cases SC 2.2.2 does not cover (after a press, or as the only content). Conformance in the covered case rests on the app, which MANIFESTO Law 3 asks the component to carry |
| (b) Finite, then rest | `--line-spinner-iteration-count` set per speed so motion ends by five seconds, such as 5 turns at `normal`, 2 at `slow` and 6 at `fast`; then a still ring | Meets SC 2.2.2 by default, whatever the app does. After five seconds the ring is still while work continues, which Understanding Note 4 warns can look frozen or broken; a named progressbar still says "busy" to assistive technology |
| (c) A pause control | the component adds a button that stops the motion | A focusable control inside a Static indicator, on every spinner; contradicts D10 and the CSS-only scope of ARCH §13.5 |

### F6 — `size` and `speed`

**Decision.** Miguel chose option (a) on 2026-11-17, so `size` takes the steps `1`–`6` on `--line-size-3`…`--line-size-8`, and `speed` takes `slow`, `normal` and `fast` on `--line-motion-7`, `-6` and `-slow`, both as reflected closed enums over token defaults.

**Evidence.** ARCH §13.5 names the props `size` and `speed` (`docs/ARCHITECTURE.md:624`). ARCH §17.2 C6 lets a variant change only the defaults of the component's own tokens on `:host`, and MANIFESTO Law 5 keeps styles out of TypeScript (`docs/MANIFESTO.md:47`). AvatarGroup's `size` is a step `1`–`5` on `--line-size-5` … `-9` (`packages/line-components/src/avatar-group/avatar-group.ts:21`, `:129-131`; `0010-avatar-group.md:294`, `:388`). In probe P6, steps `1`–`6` drew 16–48 px through `--line-size-3` … `-8`, `speed` drew 2000, 1000 and 750 ms through `--line-motion-7`, `-6` and `-slow`, an unknown value drew the default, and without an attribute the spinner followed the text size. In probe P10 both enums reached the catalog and the tools, and an unknown value failed validation. A free value through a `<style>` binding injects CSS unless parsed (`0021-aspect-ratio.md` P3). Spectrum uses `s`, `m`, `l`; Chakra and Mantine `xs` … `xl`; Fluent seven names from `tiny` to `huge`; Radix Themes `1`–`3`; Web Awesome and Fluent use a duration token for speed (P11).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Steps and named speeds | `size="1" … "6"` on `--line-size-3` … `--line-size-8`, the text size without it; `speed="slow \| normal \| fast"` on `--line-motion-7`, `-6` and `-slow` | One scale with AvatarGroup and the design-system sizes; pure CSS (P6). Step numbers say less than names to a reader of the markup |
| (b) Named sizes | `size="sm \| md \| lg"` mapped to three `--line-size-*` steps, `speed` as in (a) | Reads like Spectrum, Chakra and Mantine. A second size vocabulary beside AvatarGroup's steps, and fewer sizes |
| (c) Tokens only | no `size` or `speed` attribute; `--line-spinner-size` and `--line-spinner-duration` only | The smallest API. ARCH §13.5 names both props, so dropping them is an ARCHITECTURE change that raises the class to `decision` |
| (d) Free values | `size="24px"`, `speed="1.5s"` written into styles | Any value from markup. Styles move into TypeScript (Law 5), and each value needs a parser (`0021-aspect-ratio.md` P3) |

### F7 — Agent props and naming

**Decision.** Miguel chose option (a) on 2026-11-17, so the descriptor has no own props, takes `hostNaming: always` and requires `accessibility.label`, and the tool carries `accessibilityLabel` and `accessibilityDescription`. `always` is the default rule of Phase 1 spec §6.G.4 (`:1514`), so no Phase 1 spec AM follows.

**Evidence.** ARCH §17.4 ignores agent theme hints by default, and MANIFESTO Principle 8 leaves styling to the host, so Skeleton kept `animation` out of its schema (`0016-skeleton.md` F7 (a)). In probe P10, a descriptor with no own props and `hostNaming: always` named the spinner through `accessibility.label`, and its tool carried both accessibility strings (`SpinnerA`). A `label` prop with `hostNaming: never` named it through the attribute, and its tool carried `label` only (`SpinnerB`). A `requiredName` of kind `accessibilityLabel` turned a nameless node into a placeholder with `MISSING_ACCESSIBLE_NAME` (`SpinnerD`). An agent cannot put a spinner in a Button's `loading` slot, which stays outside the Button descriptor's slot map (`0002-button.md:130`, AM-005), so every agent spinner stands alone, where F2 (a) would hide it without a name. Badge and IconButton require a name on the agent path (`packages/line-genui/src/catalog/descriptors/badge.ts:33-36`; Phase 1 spec SD36). The Phase 1 spec names the components whose node takes no host name and whose tool carries no accessibility parameters in four places (`:1405`, `:1434`, `:1516`, SD47 `:2394`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Required `accessibility.label`, no own props | no own props; `requiredName: [{ kind: 'accessibilityLabel' }]`; `hostNaming: always`; the tool carries `accessibilityLabel` and `accessibilityDescription` | Every agent spinner is a named progressbar, and a nameless one fails visibly with an error the agent can correct (P10 `SpinnerD`). No Phase 1 spec change, because `always` is §6.G.4's default rule. Agents cannot size it or set its speed |
| (b) Optional `accessibility.label` | as (a) without `requiredName` | An agent may place a decorative spinner. A nameless agent spinner says nothing to assistive technology, and nothing reports it (P10 `SpinnerA`) |
| (c) A `label` prop, `hostNaming: never` | `label` (`DynamicString`) bound to the attribute `label`; the surface sets no host name on a Spinner node; the tool carries `label` and no accessibility strings | One naming route that matches the markup prop (P10 `SpinnerB`). **Ratchet trigger.** It changes the four approved lists (Phase 1 spec `:1405`, `:1434`, `:1516`, SD47 `:2394`), so it needs a Phase 1 spec AM and raises the class to `decision`, and `takesAccessibility`'s JSDoc gains Spinner |
| (d) (a) plus `size` and `speed` | both enums in the schema, bound to their attributes | Agents choose size and speed (P10 `SpinnerC`). Styling that ARCH §17.4 keeps with the host |

### F8 — Drawing

**Decision.** Miguel chose option (a) on 2026-11-17, so `root` draws a ring in `--line-spinner-color` (`currentColor`) with a transparent inline-end gap and no track.

**Evidence.** PRD §4.1 asks for "CSS-only animation, no visual opinion" (`docs/PRD.md:268`), and MANIFESTO Out of Scope keeps opinionated default styling out of the core (`docs/MANIFESTO.md:64`). ARCH §13.5 names the one part `root` (`:624`). In probes P6 and P7, a border ring in `currentColor` with a transparent inline-end side took the text's colour, size and the consumer's tokens, and kept a visible gap under forced colors with the D7 rule. Chakra and Mantine draw the same ring with no track; Web Awesome, Spectrum and Fluent draw a track in a second colour; Radix Themes draws eight leaves; Fluent's `indicator` slot replaces the graphic; Lion draws nothing (P11).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** A ring arc, no track | `root` is a circle whose border uses `--line-spinner-color` (`currentColor`) on three sides and `transparent` on the inline-end side | One colour, the text's own, so no colour opinion; a consumer adds a track through `::part(root)` (Consumer styling) |
| (b) Arc and track | as (a), plus `--line-spinner-track-color` on the gap side, `transparent` by default | A track without consumer CSS on `::part(root)`. One more token; any default other than `transparent` is a colour opinion |
| (c) A slot for a custom glyph | a default slot the host turns, such as a `<line-icon>`, with the ring as fallback content | Any glyph from markup, as Fluent's `indicator` slot allows. Adds a slot, a `ComponentId` for agents with a tool description, and a slotted glyph's own accessibility to manage |
| (d) No drawing | the host turns an empty `root`; the consumer draws everything through `::part(root)` | "No visual opinion" read literally, as Lion does. A bare `<line-spinner>` shows nothing |

**Review gate round 1 (2026-11-17).** The `reviewer` lens failed the draft on the easing fallback, which did not equal its token, on the route that re-runs the semantics when `aria-label` or `aria-labelledby` changes, and on a button-name proof that rested on `ariaSnapshot()`, plus three nits. The owning-supervisor lens failed it on the same re-run route and on the fixture's missing `INTERNALS` export, plus five nits. The orchestrator settled every finding without a new fork in `5b55d5b`.

**Review gate round 2 (2026-11-18).** Both lenses passed. Two nits were fixed with the approval, a qualifier on the probe component's Setup row and the source of the IconButton glyph in the Browser row. Miguel approved the spec on 2026-11-18.

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
| AM-001 | 2026-11-19 | ledger 01-C31 (factual correction — locator moved by 0015-kbd.md AM-006) | D17 (`:803`) cites `0015-kbd.md:607` in place of `0015-kbd.md:606` | The AM-006 bullet under the Kbd drawing table moved the Kbd bullet on the made-up tag down one line, so `:606` no longer named it | `docs/specs/0015-kbd.md:607` on 2026-11-19 at `a554ddc` holds the bullet that names `cem-coverage.test.ts:32-37` and `cem-drift.test.ts:76-79` |
| AM-002 | 2026-11-20 | ledger 01-Z10 (decision — Miguel, 2026-11-20: PRD v0.8.34, Phase 1 spec AM-113; factual realignment) | Locators only, no design change. PRD: §4.1 Spinner row `:268` (was `:267`), seven times (Tier, PRD catalogue entry, Governing sections, Part A description, Drift row 9, D14, F8 evidence); §4.1 heading `:244` (was `:243`), in D20; §4.6 Progress row `:343` (was `:342`), in Anti-patterns; §4.2 Input row `:274` (was `:273`), twice (Agent contract, D17); §5.2 checklist `:535-544` (was `:534-543`), twice (Governing sections, Tests); §8.1 `:1195-1203` (was `:1194-1202`), in Governing sections, whose pin now reads `PRD (v0.8.34)` (was `PRD (v0.8.33)`). Amendment rows keep their locators as record | PRD v0.8.34 adds a one-line revision note above every cited line, so each moved down by one (PROCESS §3, line locators follow the lines) | `docs/PRD.md` (v0.8.34) on `chore/01-z10-release-time-records`; Phase 1 spec §12 AM-113 |
