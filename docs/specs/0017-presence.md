# Presence

| Field | Value |
|-------|-------|
| Status | `proposed` |
| Phase | `1` |
| Tier | `Pre-built` (Phase 1 spec §6.C.4 C16 row, `docs/specs/01-spec-core-primitives.md:1172`; PRD §4.1, `docs/PRD.md:262`; ARCH §8, `docs/ARCHITECTURE.md:408`) |
| Tag | `line-presence` |
| Entrypoint | `@websublime/line-components/presence` (Phase 1 spec §4.2, `:255`, `:304`; §10 SD12, `:2359`) |
| Form-associated | `no` (Phase 1 spec §6.C.4 C16 row) |
| PRD catalogue entry | PRD §4.1, `Presence` row (`docs/PRD.md:262`) |
| Ledger row | `01-C16` (`docs/plans/01-tasks-core-primitives.md:62`) |
| Governing sections | Phase 1 spec §4.2 (`:255`, `:267`, `:304`), §6.C.0, §6.C.1 (`:933-958`, machine rows `:949`), §6.C.4 (C16 row `:1172`, notes `:1147-1153`, `:1179-1183`), §6.C.6 (`:1218-1233`), §6.C.7 (`:1242-1272`, floor rule `:1261`, lock acceptance `:1272`), §6.G.1 (reason table `:1332-1338`, Presence row `:1337`), §6.G.2, §6.G.3, §6.G.4, §6.G.5, §7.4 (`:2111`), §7.5, §7.6 (`:2144`), §7.8, §10 SD12, SD18 (`:2365`), SD30 (`:2377`), SD34 (`:2381`), SD37 (`:2384`), SD38 (`:2385`), SD39 (`:2386`), SD98, SD99, §12 AM-052 (`:2513`), AM-055, AM-058, AM-096 (`:2557`), AM-097; ARCH (v0.8.27) §3, §4, §5 (`:303-327`), §6 (`:335-377`), §8 (`:402-470`), §12 (`:582`), §14.4 (`hidden` rule), §14.7 (`:1163`), §14.8 (`open` row `:1236`), §16.2 (Details animation, `:1504`), §16.3 (`:1528`), §17.2 (`:1566-1580`), §17.3, §17.4, §17.9 (`:1697`); PRD (v0.8.33) §4.1, §5.2 (`:534-543`), §8 (`:1194-1217`); MANIFESTO Laws 1, 3, 4, 5, 9 (`docs/MANIFESTO.md:47`); R7 `docs/research/01-research-zag-machines.md` §2.2 (`:82-115`), §2.3 (`:117-175`), §4, §6 OQ1–OQ3, OQ7 (`:305-311`); R8 `docs/research/01-research-accessibility.md:55`, `:79`, `:265` (probe P6) |

Text marked `[INFERENCE]` has no probe or source behind it yet. This spec is a draft. Open Questions F1–F7 are open forks for Miguel, each with a recommended option, and D1–D24 are orchestrator defaults that stand unless Miguel changes them. No recommended option contradicts an APPROVED statement of the Phase 1 spec, the PRD or ARCHITECTURE; the options that would are marked in their tables. One factual amendment of the Phase 1 spec follows from the probes (Spec drift found, item 1).

---

## Probes

Throwaway probes ran on 2026-11-16 to inform F1–F7 and defaults D1, D3, D4, D7–D10, D14, D17–D20 and D23. Their code lived in `packages/line-components/temp/c16-probe/`, which `.gitignore` ignores through its `temp` entry (`.gitignore:4`), and the npm tarballs and the lockfile project in `/tmp/c16-zag.*`, outside the repository. Both were deleted after the run. Nothing of them is committed, and no repository manifest or lockfile changed.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2.1, arm64; Bun 1.4.3; Node v22.23.3 |
| Runner | Playwright 1.64.0 with its own engines, chromium 156.0.8078.4, firefox 157.0 and webkit 27.2; one config with three projects on the repo's device presets (`Desktop Chrome`, `Desktop Firefox`, `Desktop Safari`, as `playwright.config.ts:31-33`), one worker. Pages were served from `http://probe.local` through `page.route` |
| Zag | `npm pack @zag-js/presence@1.46.0`, `@1.47.0` and `@1.48.0` in `/tmp`. The 1.47.0 tarball was unpacked into the probe folder's `node_modules`, and `@zag-js/core`, `dom-query`, `types` and `utils` were linked to the repo's 1.47.0 copies under `node_modules/.bun/`. The probe bundle holds one copy of each `@zag-js` package, read from the module comments `bun build` writes |
| Probe component | `line-probe-presence`, a `LineElement` from the built `line-core` with a `LineMachineController` (the C24 path, `packages/line-core/src/machine/line-machine-controller.ts`) over `@zag-js/presence` 1.47.0 `machine` and `connect`. The props function is `() => ({ present: this.present === true, onExitComplete, onEnterComplete })`. The shadow tree is `<div part="root"><slot></slot></div>`; `static styles` hold `commonReset` and `:host { display: block }`. It reflects `data-state="open \| closed"` and `:state(open)` or `:state(closed)` from `present`, as the Zag docs and Ark UI do, and `data-present` from `api.present`. It dispatches `line-exit-complete` and `line-enter-complete` from the two callbacks |
| Probe-only switches | `track` (`host`, `part`, `child`) chose the node passed to `api.setNode`. `unmount` chose how an exited presence hides its content: `hidden` on the root, the slot removed from the template, the children moved into a `DocumentFragment` and back, `:host(:not([data-present])) { display: none }`, or `hidden` on the slot. `skip-mount` left out `data-state` while `api.skip` was true. `probe-counter` logged its own `connectedCallback` and `disconnectedCallback` |
| Page CSS | `@keyframes p-in` and `p-out` (opacity, used at 300 ms), `p-fade` (used forwards to open and `reverse` to close), `spin` (infinite); one class per selector form under test (P2) |
| htmx | `routeHtmx` from the shared harness `packages/line-testing/src/htmx.ts` on htmx 2.0.11 and 4.0.0, plus probe-local swaps |
| axe | `@axe-core/playwright` 4.14.0, once with the §7.4 tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and once with every rule |
| Chromium accessibility tree | a CDP session, `Accessibility.getFullAXTree`, keeping the `button`, `textbox` and `StaticText` nodes that are not ignored |
| Other engines | Playwright's `ariaSnapshot()`, which Playwright computes itself from the DOM |
| Unit tier | happy-dom 20.14.6 through `bun-test-preload.ts`, `@open-wc/testing-helpers` `fixture`, `measureHostUpdates` from `@websublime/line-testing/update-rate`, and the `line-genui` catalog, emitters and tools from `src/` |
| Size | esbuild 0.28.2 and `gzip -9 -n` |
| Lockfile | a throwaway Bun project in `/tmp` whose `bun.lock` held `@zag-js/core` and `@zag-js/vanilla` 1.47.0 under `^1.47.0` ranges |

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npm view @zag-js/presence versions`, `time`, `dist-tags`, and `dependencies` at 1.47.0 and 1.48.0 | 0 | `latest` 1.48.0, published 2026-11-13T20:15Z; `next` 2.0.0-next.4; 1.47.0 pins `core`, `types` and `dom-query` at 1.47.0, and 1.48.0 pins them at 1.48.0; P1, P12 |
| 2 | `npm pack` of the three presence versions, `tar xzf`, `diff -r` of each `dist` pair | 0 | 1.46.0 and 1.47.0 identical; 1.47.0 and 1.48.0 differ in build output only; P1 |
| 3 | `npm pack @ark-ui/react` (5.40.0), `tar xzf` | 0 | `use-presence.js` and `presence.js` read for F2–F4 |
| 4 | `bun build entry.ts --outfile bundle.js --target browser --format esm --define 'process.env.NODE_ENV="production"'` in the probe folder | 0 | one 76.98 KB module; 77.21 KB after the `slothidden` and `important` switches were added |
| 5 | `node_modules/.bin/playwright test -c packages/line-components/temp/c16-probe/playwright.config.ts track.probe` | 0 | 3 passed; P2, P5 |
| 6 | the same config with `unmount.probe`, run twice, the second time with three page-override cases | 0 each | 3 passed each; P3 |
| 7 | the same config with `dbg.probe`, a focus timeline per hiding mode on a fresh page each | 0 | 9 passed; P3 |
| 8 | the same config with `dbg2.probe`, the computed `display` of the root under a page `::part(root)` rule | 0 | 3 passed; P3 |
| 9 | the same config with `ctrl.probe` | 0 | 6 passed; P4, P5 |
| 10 | the same config with `ctrl2.probe` | 0 | 3 passed; P4, P5 |
| 11 | the same config with `htmx.probe`, run twice, the second time letting the enter animation settle for 400 ms before the exit | 0 each | 6 passed each; P7 |
| 12 | the same config with `preupgrade.probe` | 0 | 3 passed; P6 |
| 13 | the same config with `axe.probe` | 1 | 3 failed, because the probe imported `axe-core` to print its version, and that package does not resolve from the probe folder |
| 14 | the same, after the version print was removed | 1 | chromium and webkit passed; firefox failed with `browserContext.newPage: Target crashed` |
| 15 | the same with `--project firefox` | 0 | 1 passed; P3 axe rows |
| 16 | `bun test ./packages/line-components/temp/c16-probe/happy.test.ts` | 1 | 2 failed, because the test imported the probe class only in type positions, so the transpiler dropped the import and the element was never defined |
| 17 | the same, after a side-effect import of the probe module | 0 | 2 pass; P8, P11 |
| 18 | `bun test ./packages/line-components/temp/c16-probe/agent.test.ts` | 0 | 1 pass; P9 |
| 19 | `node_modules/.bin/esbuild probe-presence.ts --bundle --minify --format=esm --target=es2022` with Lit, `line-core` and `@zag-js/*` external, then `gzip -9 -n`; a second build with only `@zag-js/core`, `vanilla` and `utils` external | 0 each | P10 |
| 20 | in `/tmp`: `bun add @zag-js/presence@^1.47.0`; reset; `bun add @zag-js/presence@1.47.0`; the range edited to `^1.47.0`; `bun install --frozen-lockfile` | 0 | P12 |
| 21 | `node v.mjs`, which launched each engine and printed `browser.version()` | 0 | the engine versions of this table |
| 22 | `rm -rf packages/line-components/temp/c16-probe packages/line-components/test-results && rmdir packages/line-components/temp`; `git status --short` | 0 | deleted; the tree is clean |

"Same" in a column means the result of the chromium column. Every result below was the same in chromium, firefox and webkit unless a column says otherwise.

### P1 — `@zag-js/presence` 1.47.0 against R7 §2.2

R7 §2.2 read 1.46.0 (`docs/research/01-research-zag-machines.md:82-115`). The 1.47.0 `dist` is byte-identical to 1.46.0 (`diff -r`), so every R7 §2.2 fact holds for 1.47.0.

| Item | 1.47.0 (`dist/presence.machine.mjs`, `presence.connect.mjs`, `presence.props.mjs`) |
|---|---|
| Props | `present`, `onExitComplete`, `onEnterComplete`, `immediate`; the machine reads `immediate` nowhere (`grep -c immediate presence.machine.mjs` → 0), though the Zag docs describe it under "Applying presence changes immediately" |
| States | `unmounted`, `unmountSuspended`, `mounted`; the initial state is `mounted` when `present` is truthy |
| Root events | `NODE.SET` (`setupNode`), `PRESENCE.CHANGED` (`setInitial`, `syncPresence`); a `watch` tracker on `present` sends `PRESENCE.CHANGED` |
| Exit logic | `present` off and `visibilityState` `hidden` → `UNMOUNT` at once. Otherwise one animation frame later the machine reads the node's computed `animationName` and unmounts at once when it is `none`, equals `prevAnimationName`, `display` is `none`, `animationDuration` is `0s`, or `getAnimations()` shows no running animation of that name; else `UNMOUNT.SUSPEND` |
| `unmountSuspended` | listens on the node for `animationstart`, `animationend` and `animationcancel`, matching `composedPath()[0]` against the node; `animationend` unmounts when the node's current `animationName` equals the exit name; `animationcancel` unmounts on any cancel on the node while `present` is off, whatever the animation's name. It writes `animation-fill-mode: forwards` into the node's inline style and restores it a tick after it leaves the state |
| Exit signal | `onExitComplete()`, then a non-bubbling `exitcomplete` `CustomEvent` dispatched on the node |
| Enter signal | `onEnterComplete()` from `mounted` only when the callback is set and `context.initial` is true, so never at the first render |
| `connect` | `skip` (true until the first `PRESENCE.CHANGED`), `present` (`mounted` or `unmountSuspended`), `setNode(node)`, `unmount()`; no anatomy, no `normalize` call |
| ARIA | no `aria-` or `role` string in any `dist/*.mjs` (`grep -c`), as R8 probe P6 found for 1.46.0 (`docs/research/01-research-accessibility.md:265`) |

- 1.48.0 changes the bundler output (named exports, `const`) and none of the machine's logic, read side by side.
- Ark UI React 5.40.0 now depends on `@zag-js/presence` 1.47.0. Its `usePresence` adds `lazyMount`, `unmountOnExit` (default off), `hideMode` and `skipAnimationOnMount` (default `false`), and renders `data-state` as `undefined` while `skip && skipAnimationOnMount`, else `open` or `closed` from the `present` prop, with `hidden={!api.present}` (`dist/components/presence/use-presence.js`). The Zag docs' own adapters write `data-state={api.skip ? undefined : …}`, so they skip the enter animation at the first render by default.

### P2 — Tracked node (R7 §6 OQ2)

Each case mounted an open presence holding `<p id="c">Text</p>` (a second `<p>` in the child case), waited two frames, set `present` to `false`, sampled at 150 ms, waited for `unmounted`, then set `present` back to `true`. "Descendants" put an infinite `spin` and a 50 ms `p-out`, the exit keyframes' own name, on spans inside the content.

| Case | Consumer rule | Machine state and node animations at 150 ms | Exit complete, ms (chromium / firefox / webkit) | Inline style on the node during the exit | Who sees the native `exitcomplete` |
|---|---|---|---|---|---|
| host, attribute | `line-probe-presence[data-state='closed'] { animation: p-out 300ms }` | `unmountSuspended`; `p-out` running; content visible | 300 / 296 / 300 | `animation-fill-mode: forwards;` on the host | a host listener and a document capture listener |
| host, `:state()` | `line-probe-presence:state(closed) { … }` | same | 300 / 300 / 301 | same | same |
| host, `display: contents` | the attribute rule on a host with `display: contents` | same | 300 / 301 / 300 | same | same |
| part, attribute | `line-probe-presence[data-state='closed']::part(root) { … }` | same | 316 / 301 / 301 | on the shadow root part | only a listener on the part; neither the host nor the document |
| part, `:state()` | `line-probe-presence:state(closed)::part(root) { … }` | same | 316 / 300 / 301 | same | same |
| first slotted child | `line-probe-presence[data-state='closed'] > * { … }` | same | 300 / 300 / 316 | on the consumer's `<p>` | the `<p>` and a document capture listener |
| host with descendants | host attribute rule; spans with `spin` and a 50 ms `p-out` | same | 301 / 308 / 300 | on the host | host and document |
| part with descendants | part attribute rule; the same spans | same | 318 / 300 / 301 | on the part | the part only |
| child with a grandchild | child rule; a grandchild with a 50 ms `p-out` | same | 317 / 301 / 316 | on the consumer's `<div>` | the `<div>` and document |

- All three nodes work in all three engines. The machine reads the node's animation, waits for its `animationend`, and unmounts after it. The enter side ran `p-in`, and `line-enter-complete` fired at 299–317 ms in every case.
- A consumer reaches each node from light DOM. `::part(root)` takes no attribute selector, but a host attribute or a host `:state()` before `::part(root)` works, and page keyframes named in a `::part` rule run in all three engines (as `0016-skeleton.md` P2 A7 found).
- Descendant animations never end the exit early, because the machine matches `composedPath()[0]` against the node, and a slotted child's `animationend` reaches a root part only as a bubbling event from another target.
- The machine's side effects land where the node lives. On the host, consumers see an unprefixed `exitcomplete` event and an inline `style` attribute. On a shadow part both stay inside the shadow root, because the event is not composed. On a slotted child both land on the consumer's element (F1).
- A host with `display: contents` still waits 300 ms, though the host has no box for the opacity to act on [INFERENCE: pixels were not read].

### P3 — What unmount means (R7 §6 OQ3)

Each presence held `<button id="b">Inner</button>`, `<input name="q">` with the typed value `typed`, a `probe-counter` and `<p id="c">Text</p>`, inside `<form id="f">` between a `Before` and an `After` button. The probe focused `Inner`, closed the presence with the host rule of P2, waited for `unmounted`, then reopened it. WebKit moved Tab focus with Alt+Tab, as the existing Browser tier does.

| Case | Content after the exit | Chromium tree under `main` | `ariaSnapshot()` of `main` | Tab from `Before` | `q` in `FormData(f)` | Value after reopening | `probe-counter` callbacks | Host box |
|---|---|---|---|---|---|---|---|---|
| `hidden` on the root part | not rendered | no content node | `- main` | `After` | yes | `typed` | none | 1264 × 0 |
| slot removed from the template | not rendered | no content node | `- main` | `After` | yes | `typed` | none | 1264 × 0 |
| children moved out of the host (unmount on exit) | removed from the document | no content node | `- main` | `After` | no | `typed` (the same node returned) | `disconnected`, then `connected` on reopen | 1264 × 0 |
| host `display: none` through `:host(:not([data-present]))` | not rendered | no content node | `- main` | `After` | yes | `typed` | none | 0 × 0 |
| the same, with a page rule `display: flex` on the host | **rendered** | `button "Inner"`, `textbox`, the texts | the button, the textbox, the paragraph | **`Inner`** | yes | `typed` | none | 1264 × 71 |
| `hidden` on the root, with a page rule `::part(root) { display: block }` | not rendered | no content node | `- main` | `After` | yes | `typed` | none | 1264 × 0 |
| `hidden` on the slot, with the same page rule | not rendered | no content node | `- main` | `After` | yes | `typed` | none | 1264 × 0 |

- The root's computed `display` stays `none` under the page `::part(root)` rule, and computes to the page's `block` once `hidden` is gone (`dbg2.probe`). `commonReset` holds it with `[hidden] { display: none !important }` (`packages/line-core/src/styles/reset.common.css:35-37`; ARCH §14.4, `docs/ARCHITECTURE.md:730`).
- Focus timeline (`dbg.probe`, a fresh page per mode). Focus stayed on `Inner` through the exit and left it at 303–315 ms, with the exit, in all three engines and in the `hidden` root, slot and host modes. **WebKit with the slot removed kept `document.activeElement` on the button after it stopped rendering.**
- On the page that reused one document for every case, Firefox reported `body` as the active element 150 ms into the exit in some cases, and different cases in the two runs. The fresh-page timeline did not reproduce it [INFERENCE: an artefact of the reused page].
- The content hidden by the root, the slot or the host stays connected and keeps its state, and its form controls still submit, as any `display: none` control does. Only the unmount-on-exit case leaves the form and resets the lifecycle of custom elements (F2).
- axe with the §7.4 tags reported `color-contrast` only while an enter or exit animation was mid-way, on the open case in Firefox and on the exiting case in Chromium and WebKit, because the text sat at partial opacity. The open and closed states with settled animations raised only the probe page's own `document-title`, and every-rule runs added `page-has-heading-one`, both from the probe page, which has no title and no heading.

### P4 — The controller path and the exit shortcuts

All cases used the host attribute rule of P2 unless the case names another.

| Case | Result |
|---|---|
| first render with `present` | `data-state="open"` from the first update, `p-in` runs, state `mounted`, `skip` `true` and still `true` 400 ms later, no `line-enter-complete`. The first close plays `p-out` from `unmountSuspended` |
| first render with `present` and `skip-mount` | no `data-state`, no animation; the first close sets `closed`, runs `p-out` and suspends, so `skip` turns false in time for the exit rule |
| first render without `present` | state `unmounted`, content hidden, `data-state="closed"`, and `p-out` runs on the host though nothing shows. The first open runs `p-in`, and `line-enter-complete` fires |
| `removeAttribute('present')`, then `setAttribute('present', '')` | `unmountSuspended` at 100 ms; then `mounted` with the property `true`; one `line-exit-complete` |
| reopen 100 ms into a 300 ms exit | back to `mounted`, `data-state="open"`, `p-in` runs, content visible; no `line-exit-complete` for the cut exit; one `line-enter-complete`; the next exit takes 310 / 310 / 317 ms |
| `present = false; present = true` in one task | no transition and no event, because Lit sees no change |
| ten toggles 20 ms apart, ending open | chromium and webkit alternate `mounted` and `unmountSuspended` and end `mounted`, with one `line-enter-complete`; **firefox reaches `unmounted` four times, with four `line-exit-complete` events** |
| close 100 ms into a 300 ms enter | exit completes after 37 ms (chromium), 20 ms (firefox), 321 ms (webkit). Chromium logs `animationcancel` of `p-in` at 134 ms with the start of `p-out`; Firefox logs `p-out` starting at 116 ms and the `p-in` cancel at 117 ms; WebKit logs both at 101 ms and `animationend` of `p-out` at 417 ms |
| the same keyframes for enter and exit (`p-fade`, `reverse` to close) | the first exit after a first render with `present` plays (283–301 ms); after a reopen, the next exit completes in 0–2 ms, because the name equals `prevAnimationName` |
| `animation: none`, `0s`, `display: none` on close, a CSS transition only, or no CSS at all | `mounted` → `unmounted` in one frame (8–18 ms) |
| `document.visibilityState` `hidden` (overridden on `document`) | `unmounted` 0–1 ms after the change, with no frame; right after `updateComplete` the state still reads `mounted` |
| host removed 100 ms into an exit | no `line-exit-complete`. Chromium leaves an empty `style=""` attribute on the host; Firefox and WebKit leave none. Appended again, the new machine starts `unmounted`, **but the content stays visible until something requests an update**; `requestUpdate()` hides it |
| host removed and appended while open | `mounted`, `skip` `true` again, and `p-in` replays, as any CSS animation does on insertion |
| host updates per change | five per exit, three per enter |
| `emulateMedia({ reducedMotion: 'reduce' })`, the rule inside `@media (prefers-reduced-motion: no-preference)` | the exit completes in one frame (9–17 ms) |
| the same, rule not gated | the exit plays (300–317 ms); the component adds no motion rule of its own |

- The C24 signal closes the gap R7 probe P2 found (`docs/research/01-research-zag-machines.md:144`, `:148`). `updateProps({})` in `hostUpdate` re-runs the `present` tracker, and `PRESENCE.CHANGED` follows every committed change of the property or the attribute.
- The `animationcancel` row is the source's behaviour in P1. When a close interrupts an enter, the enter animation's cancel reaches the node after the machine entered `unmountSuspended` in Chromium and Firefox, and the machine unmounts at once (F7).
- A presence reconnected mid-exit must request an update, or the old frame stays on screen (D7).

### P5 — Events

| Signal | When it fires (P2, P4, P8) |
|---|---|
| `line-exit-complete` (probe) | once per exit that ends, after the exit animation or in one frame without one; not for an exit cut by a reopen; not when the host is removed mid-exit; not at the first render |
| `line-enter-complete` (probe) | once per change of `present` to `true` after the first render, after the enter animation or in one frame without one; never at the first render |
| native `exitcomplete` | dispatched by the machine on the tracked node, not bubbling and not composed (P2) |

### P6 — Before `customElements.define()`

| Host | Before `define()` | After |
|---|---|---|
| `<line-probe-presence>` without `present` | its content **shows** | hidden |
| `<line-probe-presence present>` | its content shows | shows |
| the first host with a page rule `line-probe-presence.pre:not(:defined):not([present]) { display: none }` | hidden | hidden |

- A closed presence shows its content until its module runs, and a consumer `:not(:defined)` rule closes the gap (D10).

### P7 — htmx

| Case | htmx 2 and htmx 4, three engines |
|---|---|
| `hx-get` swaps `<p id="n">New</p>` into an open presence with `innerHTML`, tracked node the host | the new content shows; the machine still tracks the host; the exit after a 400 ms settle plays (296–320 ms) |
| the same, tracked node the first slotted child | the machine tracks the new `<p>` through `slotchange`; the exit after the settle plays (302–314 ms) |
| `hx-swap="outerHTML"` replaces a closed presence with an open one | the new host starts `mounted`, `p-in` runs, its content shows |

- The first run closed 50 ms after the swap, while the swapped-in child, or the host in its first-render `p-in`, could still be entering. Chromium completed the child-tracked exits in 20–21 ms and played the host-tracked ones (326 and 334 ms), Firefox completed all four in 9–16 ms, and WebKit played all four, as the close-during-enter row of P4 predicts. The second run let the enter settle.
- htmx swaps need nothing from the component (D14).

### P8 — happy-dom 20.14.6

| Check | Result |
|---|---|
| `requestAnimationFrame`, `getAnimations` | both functions |
| computed `animationName` on the host | `''`, which the machine reads as `none` |
| `present = false` | right after `updateComplete` the state is `mounted`; 50 ms later `unmounted`, the root `hidden` |
| `present = true` again | `mounted`, `data-state="open"`, `data-open` |
| events | `line-exit-complete`, then `line-enter-complete` |

- The unit tier can check reflection, the hidden root, the transitions and the events, with every exit ending in one frame. Exit timing, the tracked node, focus and the accessibility tree belong to the Browser tier (D19).

### P9 — Agent path

A stub descriptor `Presence` for `line-presence` took `present` (`DynamicBoolean`, bound to the attribute `present`), `hostNaming: { kind: 'never' }`, `agentExposed: false` and `agentHiddenReason` "It emits no ARIA and needs CSS exit animations, which the host owns.". The probe appended it to the exported `descriptors` array and ran the emitters from `src/`.

| Check | Result |
|---|---|
| `lineCatalogDocument([...descriptors, presence])` | 16 descriptors in, 13 keys in `components`; no `Presence` key |
| `frontendTools(…, provider)` for `openai`, `anthropic`, `gemini` | 13 tools each; no `Presence` tool |

- The emitters leave the descriptor out, as Phase 1 spec `:1183` requires. The acceptance runs on the built `catalog.json` and the built descriptor set (Tests).

### P10 — Size

| Bundle (esbuild 0.28.2, `--bundle --minify --format=esm --target=es2022`, then `gzip -9 -n`) | Minified | Gzipped |
|---|---|---|
| the probe module with Lit, `line-core` and `@zag-js/*` external, the §7.6 recipe | 3,091 B | 1,211 B |
| the same with `@zag-js/presence`, `dom-query` and `types` bundled (`core`, `vanilla` and `utils` external) | 8,615 B | 3,117 B |

- The probe module carries its probe-only switches, so the shipped `./presence` lands at or under the first figure [INFERENCE: not measured], well under the < 5 KB soft target. The "Size report" step reports the shipped figure (§6.C.6).

### P11 — Host update rate

`measureHostUpdates` drove a connected probe host by toggling `present` on every update, with the machine's `prop` reader captured by wrapping `machine.initialState`, as `chip.update-rate.test.ts` does.

```
update rate — <line-probe-presence> (full host update)
  budget: 1 ms per host update after 3600 accumulated updates on one instance
  updates | update ms |   prop ms | updates/s
      100 |    0.0153 |    0.0002 |     65394
     1000 |    0.0057 |    0.0002 |    176460
     3600 |    0.0043 |    0.0001 |    232992
  fit: 0.0124 ms + -0.0026 µs × updates
  updates before one update reaches 1 ms: Infinity (∞ s at 60 updates/s) — within budget
```

- The cost stays flat and far under the 1 ms budget, and 3,600 updates cost 0.0014 ms less than 1,000, inside the C24 margin of 0.1 ms (Phase 1 spec `:1269`). The C16 PR records its own run (§6.C.6, `:1232`).

### P12 — Installing `@zag-js/presence` while `latest` is 1.48.0

| Step in the `/tmp` project (`core` and `vanilla` locked at 1.47.0) | Result |
|---|---|
| `bun add @zag-js/presence@^1.47.0` | installs presence **1.48.0**; `bun.lock` gains `@zag-js/core@1.48.0`, `dom-query`, `types` and `utils` at 1.48.0 beside the 1.47.0 copies; a second `core` lands at `node_modules/@zag-js/presence/node_modules/@zag-js/core` |
| `bun add @zag-js/presence@1.47.0` | installs 1.47.0 and writes `"@zag-js/presence": "1.47.0"`, an exact pin |
| the range edited to `"^1.47.0"`, then `bun install --frozen-lockfile` | accepted with no change; `bun.lock` keeps `@zag-js/presence@1.47.0` and one copy of each `@zag-js` package |

- A plain `bun add` of the §4.2 range breaks the C24 acceptance that `bun.lock` resolves every `@zag-js/*` package to one version, 1.47.0 (Phase 1 spec `:1272`), and the floor rule's reason, one `@zag-js/core` copy (`:1261`). The exact pin breaks the §4.2 range `^1.47.0` (`:267`). Locking 1.47.0 first and then writing the range keeps both (D17).

### What the probes settle

- `@zag-js/presence` 1.47.0 behaves as R7 §2.2 read for 1.46.0, and 1.48.0 changes no logic (P1).
- A host, a shadow part or a slotted child can each be the tracked node in all three engines, and descendant animations never end an exit early. The part keeps the machine's unprefixed event and inline style inside the shadow root (P2; F1).
- `hidden` on the root part hides the content from sight, Tab and the accessibility tree, keeps its state, and holds against page rules through `commonReset`. Moving children out breaks Law 5, the form and the children's lifecycle; host `display: none` loses to a page `display` rule; removing the slot leaves WebKit focus on unrendered content (P3; F2).
- The C24 signal drives `PRESENCE.CHANGED` from the property and the attribute; exits without a CSS animation end in one frame; same-named enter and exit keyframes skip every exit after the first reopen; Chromium and Firefox end an exit at once when it cuts an enter (P4; F7, D9).
- The enter animation runs at the first render unless the reflection leaves it out while `skip` holds (P4; F3, F4).
- A closed presence shows its content before its module runs (P6; D10). htmx swaps work and need nothing (P7; D14). The agent emitters leave a hidden descriptor out (P9). Size and update rate sit far inside their targets (P10, P11).
- The implementation must lock 1.47.0 before it writes the `^1.47.0` range (P12; D17).

### What automation cannot observe

- What a screen reader announces when content leaves or joins the tree, and whether it reads content that is still exiting. P3 reads the Chromium tree and Playwright's snapshot only.
- Firefox and WebKit accessibility trees. Playwright's snapshot is its own computation from the DOM (Phase 1 spec §12 AM-058).
- Whether an animation looks right. Every probe read machine states, computed styles and timings, not pixels.

---

## Part A — Requirements

### Overview

#### Description

`<line-presence>` shows and hides its content with an enter animation and an exit animation that the page's own CSS defines (PRD §4.1, `docs/PRD.md:262`). Setting `present` shows the content at once and lets an enter animation play. Clearing it keeps the content on screen while an exit animation plays, then hides it. The `@zag-js/presence` machine watches the animation and decides when the exit ends (P1, P2). Hidden content stays in the document with its state, but it leaves the screen, the Tab order and the accessibility tree (P3; F2). Presence ships no animation of its own, so without the consumer's CSS it shows and hides in one frame (P4; D23). It reports finished exits and enters through `line-exit-complete` and `line-enter-complete` (F5). It adds no role and no meaning, and it is not offered to agents (Phase 1 spec §10 SD38; D12).

#### Use cases

- A panel, a list of details or a message that fades or slides in and out when the app toggles it (P2).
- The animated content of a disclosure the consumer builds from a button and a Presence (Markup examples).
- Content that htmx swaps into an open presence or replaces with a new presence (P7).
- A cleanup step, such as removing a dismissed message, that must wait until its exit animation ends (P5).

#### Anti-patterns

- Animating with CSS transitions. The machine waits only for CSS animations, so a transition ends the exit at once and the content vanishes mid-transition (P4).
- Naming the enter and the exit animation with the same keyframes, played in reverse. Every exit after the first reopen then ends at once (P4).
- Removing the host to hide its content. Removal cuts the exit and fires no `line-exit-complete` (P4).
- Using Presence to keep form values out of a submission. Hidden controls still submit (P3); disable them as well.
- Relying on Presence for semantics, such as an expanded state. The trigger carries `aria-expanded` itself (R8 `docs/research/01-research-accessibility.md:79`).
- A modal dialog or a menu. Use the native `<dialog>` or the Phase 3 overlays (PRD §7.5).

#### User expectations

- Content appears and leaves with the motion the page designed, and the exit finishes before the content goes (P2).
- Hidden content cannot take focus or be read by a screen reader (P3).
- Users who ask for reduced motion see the content appear and leave at once, when the page gates its motion (P4; F6).

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| any content | child | the default slot; the content keeps its own semantics and state (P3). Presence imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`) |
| any trigger, such as `<line-button>` | sibling | the app sets `present` from the trigger's event and keeps the trigger's `aria-expanded` and `aria-controls` in step (Markup examples) |
| `<line-accordion>`, `<line-collapsible>` (Phase 3) | none | ARCH §16.2 names `<line-presence>` for their enter and exit animations (`docs/ARCHITECTURE.md:1504`); Law 4 forbids them from importing it, so their specs decide between consumer composition and the machine itself (Spec drift found, item 5) |
| `<line-a2ui-surface>` | none | `agentExposed: false`; a `line` node of type `Presence` renders the surface's unknown-type placeholder (Agent contract) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| none | — | — |

Presence has no semantic variant and no token defaults to switch.

---

## Part B — Technical Specification

Part B states the recommended option of each fork: F1 (b), F2 (a), F3 (a), F4 (b), F5 (a), F6 (a), F7 (a). A different answer changes the sections each fork names.

### Anatomy

```
<line-presence>                             LineElement; :host { display: contents } (D3)
└── #shadow-root
    └── <div part="root" ?hidden=${!api.present}>   tracked node (F1 (b)); hidden after an exit (F2 (a))
        └── <slot>                          the content
```

- `root` is the ARCH §5 name for the main container (`docs/ARCHITECTURE.md:306`; D5). It is the node the component passes to `api.setNode` (F1 (b)), so the consumer animates it through `::part(root)`.
- `hidden` on `root` follows `api.present`, which is true in `mounted` and `unmountSuspended`, so the content stays on screen while the exit animation plays (P1, P2). `commonReset`'s `[hidden] { display: none !important }` keeps it hidden against any page `::part(root)` rule (P3; D4).
- While `skip-animation-on-mount` holds and the machine's `skip` is true, `root` carries an internal class whose shadow rule sets `animation: none !important`, so a page `::part(root)` animation cannot run at the first render (F4 (b); D6). The class is not public, because `::part()` takes no class selector.

```css
:host {
  display: contents;
}

:host([hidden]) {
  display: none;
}

[part='root'] {
  display: block;
}

[part='root'].skip {
  animation: none !important;
}
```

- `display: contents` gives the host no box, so a hidden presence leaves no footprint in a flex or grid parent, and `root` is the box that animates (D3). `:host([hidden])` keeps the global `hidden` attribute working over it, as on Portal (`0013-portal.md` D3).
- The stylesheet holds no `@keyframes` and no animation. The consumer's page keyframes run through `::part(root)` in all three engines (P2; D23).

### States

| Field | Value |
|-------|-------|
| Machine | `@zag-js/presence` 1.47.0, through `LineMachineController` (Phase 1 spec §6.C.4 C16 row; ARCH §6, §8) |

| Machine state | Entered on | Left on | Host reflection | `root` |
|-------|------------|---------|-----------------|--------|
| `mounted`, `present` on | first render with `present`; `MOUNT` from `PRESENCE.CHANGED` | `UNMOUNT.SUSPEND` or `UNMOUNT` one frame after `present` turns off | `data-open`, `:state(open)` | shown |
| `mounted`, `present` just turned off | the update that clears `present` | the frame check of P1 | none | shown; the consumer's exit rule starts its animation |
| `unmountSuspended` | `UNMOUNT.SUSPEND` | `UNMOUNT` on the exit's `animationend` or any `animationcancel`; `MOUNT` when `present` returns | none | shown, exit animation running |
| `unmounted` | first render without `present`; `UNMOUNT` | `MOUNT` | none | `hidden` |

- `open` follows the `present` property in the same update, before the machine's frame check, so a rule on `:not([data-open])` or `:not(:state(open))` starts the exit animation in time (P4, the probe's `data-state` read `closed` right after `updateComplete`; F3 (a)). It is the existing ARCH §14.8 `open` row (`docs/ARCHITECTURE.md:1236`).
- No attribute names `unmountSuspended`. A consumer who needs the exiting state, such as for `pointer-events: none`, selects `:not([data-open])`, which also matches the hidden state, where it changes nothing.
- The machine's `skip` is not reflected (F3 (a)).

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ChildList` | the content that enters and exits; any light-DOM content |

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<div>` | the box that wraps the content; the node the machine tracks and the consumer animates; `hidden` after an exit |

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `present` | `present` | `boolean` | `false` | yes | shows the content; clearing it plays the exit animation, then hides the content |
| `skipAnimationOnMount` | `skip-animation-on-mount` | `boolean` | `false` | yes | blocks any `root` animation from the first render until `present` first changes (F4 (b)) |

- Both are declared `{ type: Boolean, reflect: true }`, as Portal's `disabled` (`packages/line-components/src/portal/portal.ts`). A set attribute is `true` whatever its value, so `present="false"` is `true`, the HTML boolean rule (D6).
- The machine props are the function `() => ({ present: this.present === true, onExitComplete, onEnterComplete })`; `immediate` stays out, because the machine never reads it (P1; D1).
- The host takes the global `hidden` attribute, which hides it whatever `present` holds (D3).

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| `line-exit-complete` | `LinePresenceExitCompleteDetail`, `{ present: false }` | an exit ends and hides the content, after the exit animation or in one frame without one (P4, P5) |
| `line-enter-complete` | `LinePresenceEnterCompleteDetail`, `{ present: true }` | an enter after the first render ends, after the enter animation or in one frame without one (P4, P5) |

- Both bubble and are not composed, as Chip's `line-change` (`packages/line-components/src/chip/chip.ts`; D8). A nested presence's events bubble through its outer presence, so a listener checks `event.target`.
- Neither fires at the first render, for an exit that a reopen cuts, or when the host is removed mid-exit (P4, P5).
- Presence is neither value-bearing nor compound, so neither event is a commit event (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`).
- The machine's own `exitcomplete` event fires on `root` and stays inside the shadow root, because it is not composed (P2; F1 (b)).

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| none | — | — |

- Presence draws nothing and moves nothing on its own, so it has no token (D23). The consumer owns every visual through `::part(root)` and the host state.

#### Consumer styling

```css
@keyframes panel-in {
  from { opacity: 0; translate: 0 -0.5rem; }
}

@keyframes panel-out {
  to { opacity: 0; translate: 0 -0.5rem; }
}

/* Distinct keyframe names for enter and exit (P4); CSS animations, not transitions */
@media (prefers-reduced-motion: no-preference) {
  line-presence.panel[data-open]::part(root) {
    animation: panel-in 150ms ease-out;
  }

  line-presence.panel:not([data-open])::part(root) {
    animation: panel-out 120ms ease-in;
  }
}

/* The same with custom states */
line-presence.toast:state(open)::part(root) { animation: panel-in 150ms ease-out; }
line-presence.toast:not(:state(open))::part(root) { animation: panel-out 120ms ease-in; }

/* Hide closed content before the module runs (P6; D10) */
line-presence:not(:defined):not([present]) {
  display: none;
}
```

- `::part(root)` takes no attribute selector, so the state goes on the host before it (P2).
- The machine waits for the exit animation only when `root` runs one whose name differs from the enter animation's. `animation: none`, a `0s` duration, `display: none` or a transition end the exit in one frame (P4).
- Under `prefers-reduced-motion: reduce` the component changes nothing. The page gates its keyframes, as the example does, and then the content shows and hides at once (P4; F6 (a)).

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

Presence takes no focus and handles no key (R8 `docs/research/01-research-accessibility.md:79`, Keyboard "None"). The content keeps its own keyboard behaviour. Hidden content leaves the Tab order (P3).

### A11y

| Field | Value |
|-------|-------|
| Role | none; no internals role and no `role` attribute (R8 `:79`; P1; D2). The host and `root` add no node to the Chromium tree (P3) |
| ARIA attributes | none. The app's trigger carries `aria-expanded` and `aria-controls` |
| Accessible name | none |
| Focus | the host is not focusable and does not delegate focus |

- **Exit and focus.** Content that holds focus keeps it while it exits, and the browser moves focus to `body` when the exit ends (P3). The app moves focus first, usually back to the trigger, so focus order stays meaningful (WCAG 2.4.3). The docs say so.
- **Hidden content.** After an exit the content leaves the Chromium tree, Playwright's snapshot and the Tab order in all three engines, and a page rule on `::part(root)` cannot bring it back (P3; F2 (a)). Its form controls still submit, as any `display: none` control does (P3).
- **Motion.** The consumer owns all motion and its reduced-motion gate (F6 (a)). The docs and every story gate their keyframes under `prefers-reduced-motion: no-preference`.
- **Proof (D20).** No role or ARIA value lives in internals, so the Phase 1 spec CDP-and-read-back rule for internals roles does not apply (`:1180`). The Browser tier proves the hidden content's absence with `ariaSnapshot()` in three engines and a Chromium CDP assertion.
- **Firefox and WebKit.** No check reads their accessibility trees, and no screen reader was run. The gap is recorded here (Phase 1 spec `:1180`; §12 AM-058).

**What axe proves here.** axe 4.14.0 reported no violation on settled open and closed states beyond the probe page's own rules, and `color-contrast` while text sat at partial opacity mid-animation (P3). The A11y tier therefore runs on settled states only (D15).

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `present` and `skipAnimationOnMount`, two booleans; the content is slotted |
| C2 | Slots carry `@slot` and a single or multiple classification | one `@slot` for the default slot, `ChildList` |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | `line-exit-complete` and `line-enter-complete`, each with a `@fires` tag and a typed `detail`; the machine's unprefixed `exitcomplete` never leaves the shadow root (P2; F1 (b)); not value-bearing |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated (Phase 1 spec §6.C.4 C16 row) |
| C5 | The host accepts an accessible name and applies it to the element with the role | no element carries a role; the docs advise against a host `aria-label`, which would name a `generic` (R8 `docs/research/01-research-accessibility.md:55`; D2) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | no variants |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries `@summary`, one `@slot`, `@csspart root` and two `@fires`; no `@cssprop`; nothing is deprecated |
| C8 | Missing or partial props degrade to an empty or neutral state | with no `present` the content is hidden; with no consumer CSS the content shows and hides in one frame (P4); a machine that fails to start leaves a static show and hide by `present` (D24) |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

`skipAnimationOnMount` stays out of the descriptor's prop schema, because the descriptor is not exposed and motion is the host's (ARCH §17.4 Theme row; D11).

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `Presence` (D11) |
| Tag | `line-presence` |
| `load()` subpath | `@websublime/line-components/presence` |
| Prop schema | `present` (`DynamicBoolean`, through `commonProp` with the description "Whether the content is shown.", optional), `children` (`ChildList`, through `commonProp` with the description "The child components, in order.", as Stack's and Portal's, optional), plus `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1) |
| Slot map | `children` → the default slot (`''`) |
| Binding map | `present` → attribute `present`; no value prop; no commit event |
| Action map | none |
| Accessibility requirements | no `requiredName`; `hostNaming: { kind: 'never' }`, because the host has no role a name could attach to (`packages/line-genui/src/catalog/descriptor.ts`) |
| Agent-facing description | Content that the host page shows and hides with its own enter and exit animations; `present` shows it. |
| Tool description | none; no tool is emitted |
| `agentExposed` | `false`, with `agentHiddenReason` "It emits no ARIA and needs CSS exit animations, which the host owns." (Phase 1 spec §6.C.4 C16 row, `:1172`; reason row `:1337`; §10 SD38, `:2385`; ARCH §17.9, `docs/ARCHITECTURE.md:1697`; D12) |

- The reason holds on the probes. The 1.47.0 machine emits no ARIA (P1), and Presence adds no node to the accessibility tree (P3). Its only behaviour beyond show and hide is to wait for exit animations that the page's CSS declares (P2), and without that CSS it shows and hides in one frame (P4). The surface ignores agent theme hints by default (ARCH §17.4 Theme row), so an agent could not supply that CSS either. A factual Phase 1 spec row lifts the reason row's `[INFERENCE]` (Spec drift found, item 1).
- `defineDescriptor` requires `agentHiddenReason` when `agentExposed` is `false` (`packages/line-genui/src/catalog/descriptor.ts`).
- The `line` catalog emitter and the frontend-tool emitter skip the descriptor (P9). Under the acceptance of Phase 1 spec `:1183`, `Presence` is not a key of `components` in the built `catalog.json`, and `frontendTools(descriptors, provider)` returns no tool named `Presence` for any provider.
- The surface builds its `line` descriptor map from exposed descriptors only, so a `line` node of type `Presence` renders the inert `unknown-type` placeholder and raises one `UNKNOWN_COMPONENT_TYPE` `line-a2ui-error`, as the VisuallyHidden case does (`packages/line-genui/__tests__/a2ui-surface.test.ts:211`), and `./presence` never loads.
- The coverage test needs the descriptor, because `line-presence` enters the manifest. The drift test checks the `present` attribute and the default slot against the manifest (§6.G.5).
- These `line-genui` test expectations change with a sixteenth descriptor (D13).
  - `PROP_TYPES` gains `Presence: { present: 'DynamicBoolean', children: 'ChildList' }` beside `Portal` (`packages/line-genui/__tests__/catalog.test.ts:94`), and its doc comment adds `0017-presence.md` (`:44`).
  - The raw catalog of every descriptor gains `Presence`, and the test title at `:115` says sixteen descriptors.
  - The exposure test expects `toHaveLength(16)` (`:505`, was 15) and `[portalDescriptor, presenceDescriptor, visuallyHiddenDescriptor]` as the descriptors with `agentExposed: false` (`:506`), and its title names all three.
  - A Presence test beside the Portal reason test asserts `agentExposed: false` and the reason.
  - The import test expects `descriptors: 16` (`:552`).
  - A "no provider emits a Presence tool" test sits beside the Portal one (`packages/line-genui/__tests__/frontend-tools.test.ts:320`).
- C16 adds no surface render-fixture entry and no surface axe case, because §6.C.6 asks that only of agent-exposed rows (Phase 1 spec `:1231`).

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/presence` |
| Kind | `independent` (Phase 1 spec §4.2, `:304`; §10 SD12) |
| Registers | `line-presence` |
| Reset modules | `commonReset` only (ARCH §14.7, `docs/ARCHITECTURE.md:1163`; Phase 1 spec `:1181`; D4) |

- The files are `src/presence/presence.ts`, with the class `LinePresence` and `customElements.define`, `src/presence/presence.types.ts` with `LinePresenceExitCompleteDetail` and `LinePresenceEnterCompleteDetail`, as `src/chip/chip.types.ts` holds Chip's detail type, and `src/presence/index.ts`, which exports the class and both types.
- The component imports `machine` and `connect` from `@zag-js/presence` and its controller from `@websublime/line-core/machine`, as Chip does with `@zag-js/toggle` (`packages/line-components/src/chip/chip.ts:1-5`). It names the schema `type PresenceSchema = typeof machine extends Machine<infer T> ? T : never`, R7's pattern for a schema Zag does not export (`docs/research/01-research-zag-machines.md:89`).
- `package.json` gains the `./presence` export after `./skeleton` (Phase 1 spec §4.2, `:255`; `packages/line-components/package.json:82-85`) and the dependency `"@zag-js/presence": "^1.47.0"` (§4.2, `:267`), installed as D17 says. The Vite build gains the `presence/index` entry after `skeleton/index` (`packages/line-components/vite.config.mjs:25`).
- `packages/line-components/__tests__/bundle-splitting.test.ts` gains the `EXPECTED_TAGS` row `'./presence': ['line-presence']` after `./skeleton` (`:72`).
- `line-genui` gains `src/catalog/descriptors/presence.ts` with `presenceDescriptor`. `src/catalog/index.ts` imports it after `portalDescriptor` (`:25`), adds it to the named exports after `portalDescriptor` (`:115`), and adds it to the `descriptors` array between `portalDescriptor` and `separatorDescriptor` (`:135-136`).
- Presence imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`).

### Markup examples

```html
<!-- A disclosure the app builds; the trigger owns the semantics and Presence the motion -->
<line-button aria-expanded="false" aria-controls="shipping">Shipping details</line-button>
<line-presence class="panel">
  <div id="shipping">Ships in two working days.</div>
</line-presence>

<script type="module">
  import '@websublime/line-components/button';
  import '@websublime/line-components/presence';

  const trigger = document.querySelector('[aria-controls="shipping"]');
  const panel = document.querySelector('line-presence.panel');
  trigger.addEventListener('click', () => {
    panel.present = !panel.present;
    trigger.setAttribute('aria-expanded', String(panel.present));
  });
</script>

<!-- Open at load, with no enter animation on the first render (F4 (b)) -->
<line-presence class="panel" present skip-animation-on-mount>
  <p>Welcome back.</p>
</line-presence>

<!-- Remove a dismissed message once its exit has played (F5 (a)) -->
<line-presence class="toast" present id="saved">
  <p role="status">Saved.</p>
</line-presence>
<script type="module">
  const saved = document.getElementById('saved');
  saved.addEventListener('line-exit-complete', () => saved.remove(), { once: true });
  setTimeout(() => { saved.present = false; }, 4000);
</script>

<!-- htmx swaps server content into an open presence (P7) -->
<line-presence class="panel" present id="feed"></line-presence>
<button type="button" hx-get="/feed" hx-target="#feed" hx-swap="innerHTML">Refresh</button>
```

The keyframes and the pre-upgrade rule are the Consumer styling block. `line-button` stands for any trigger; the app keeps `aria-expanded` in step.

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom, `packages/line-components/__tests__/presence.test.ts` | registers `line-presence` with its class; `present` and `skip-animation-on-mount` reflect and default to `false`; without `present` the root is `hidden` and the host has no `data-open`; with `present` the root shows and the host has `data-open` and `:state(open)` (through the `INTERNALS` states); clearing `present` hides the root after one frame, because happy-dom computes no animation name (P8; D19); `line-exit-complete` and `line-enter-complete` fire once each with their `detail`, bubble and are not composed, and neither fires at the first render; the internal skip class sits on the root only while `skip-animation-on-mount` and the machine's `skip` both hold; `hidden` hides the host; the part `root` exists; a machine that fails to start leaves a static show and hide by `present` and fires the completion event of each change (D24); a `dispatchEvent` spy on `LinePresence.prototype` sees only the two events, as Kbd's no-event check does |
| Update rate | `bun test`, `packages/line-components/__tests__/presence.update-rate.test.ts` | `measureHostUpdates` toggles `present` on a connected host, with the `prop` reader captured as `chip.update-rate.test.ts` does; the report goes into the C16 PR, and the test asserts only non-timing invariants (Phase 1 spec §6.C.6, `:1232`; P11; D18) |
| Browser | Playwright `packages/line-components/__tests__/integration/presence/presence.e2e.ts` on chromium, firefox and webkit, over fixture pages under `integration/presence/` | the exit waits for a page `::part(root)` animation keyed on `:not([data-open])` and on `:not(:state(open))`, with the content visible mid-exit and hidden after, and `line-exit-complete` near the animation's end (P2); `line-enter-complete` after the enter animation; descendant animations, one with the exit's own keyframe name, do not end the exit early (P2); `animation: none`, a `0s` duration and a CSS transition end the exit in one frame (P4); the same keyframes played in reverse skip the exit after a reopen, the documented anti-pattern (P4); a reopen mid-exit keeps the content and fires no `line-exit-complete` (P4); a close during an enter ends with the content hidden and one `line-exit-complete` in every engine, without asserting its timing (F7 (a)); `skip-animation-on-mount` leaves no running animation at the first render and lets the first exit play (F4 (b)); after the exit, `ariaSnapshot()` holds no content in three engines and a Chromium CDP assertion finds no content node, Tab from a button before the host reaches the button after it, and a page `::part(root) { display: block }` rule does not show the content (P3; D20); focus inside the content leaves for `body` when the exit ends (P3); the host's box is 0 × 0 after the exit and `root` animates inside a `display: contents` host (D3); a host removed mid-exit and appended again hides its content (P4; D7); under `emulateMedia({ reducedMotion: 'reduce' })` the gated example shows and hides in one frame (P4); the pre-upgrade page hides closed content through the D10 rule before the module loads (P6) |
| A11y | axe-core, `packages/line-components/__tests__/a11y/presence.e2e.ts` | zero violations (MANIFESTO Law 3) in every story of D15, with every animation settled before the scan, because mid-animation opacity raises `color-contrast` (P3; Phase 1 spec §7.4) |
| htmx | Playwright `*.e2e.ts` through the shared harness `@websublime/line-testing/htmx` (`packages/line-testing/src/htmx.ts`), on htmx 2 and htmx 4 in chromium, firefox and webkit | `n/a`. Presence is neither value-bearing, because its descriptor binding map names no value prop, nor compound, because it holds no interactive element of its own (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`; plan §2.4). Behaviour (d) would apply to its slot, but the template ties every behaviour to a value-bearing or compound component. P7 swapped content into an open presence and replaced a closed presence with an open one on htmx 2 and 4 in three engines, and all passed. This confirms the Phase 1 spec's "`n/a` expected" (§6.C.4 C16 row, `:1172`; §10 SD34, `:2381`; D14) |
| Visual | Playwright `packages/line-components/__tests__/visual/presence.visual.ts` on the `visual` project | every story of D15 with Linux baselines from a `visual-baselines.yml` run (Phase 1 spec §6.C.6, `:1233`; §10 SD98). `toHaveScreenshot` disables animations by default, so each baseline shows the settled state |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts` | a `line` node of type `Presence` renders one inert `unknown-type` placeholder, raises one `UNKNOWN_COMPONENT_TYPE` error and creates no `line-presence` (D13) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the coverage and drift tests pass with the new descriptor (§6.G.5); the built `catalog.json` holds no `Presence` key; no provider's tools include `Presence`; the lists and counts change as the Agent contract says (Phase 1 spec `:1183`; P9; D13) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./presence` register `line-presence` only, and the isolation scan finds no other component's module or tag in its bundle (Phase 1 spec §7.5). `packages/line-components/__tests__/manifest-paths.test.ts` reads the packed `custom-elements.json`: `line-presence` resolves to `src/presence/presence.ts`; its own public fields are `present` and `skipAnimationOnMount`; its events are `line-exit-complete` and `line-enter-complete`; its one slot is the default slot; its parts are `['root']`; it lists no `@cssprop` (ARCH §17.2 C7). The packed tarball's `package.json` declares `@zag-js/presence` at `^1.47.0`, and `bun.lock` resolves every `@zag-js/*` package to 1.47.0 (Phase 1 spec `:1272`; P12) |

- PRD §5.2 checklist mapping (`docs/PRD.md:534-543`; Phase 1 spec §6.C.6, `:1222`). Render, reactive props, the slot, the part and events run in the Unit tier, and events also in the Packaging tier through the manifest; custom properties have nothing to test; keyboard (Tab skips hidden content) runs in the Browser tier (§10 SD99) and axe in the A11y tier.
- §6.C.6 obligations. Storybook docs, the changeset, the CEM JSDoc, the `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` row and the size report land as D16 says. No other component is imported (Bundle). The Agent contract is filled above. The htmx row is `n/a` with its reason. The surface fixture and surface axe obligations do not apply to an `agentExposed: false` row (`:1231`). The update-rate row is above (`:1232`). The visual tier is the row above (`:1233`).
- The axe and visual tests run against the Storybook stories on port 4320, with the story list and `readyPresenceStory(page, id)` in `packages/line-components/__tests__/presence-stories.ts`, as `skeleton-stories.ts` does. The exit, focus, tree and pre-upgrade tests use the fixture pages under `packages/line-components/__tests__/integration/presence/` (`index.html` with `fixture.ts`; `pre-upgrade.html` with the lazily loaded `pre-upgrade.ts`), served by the existing port-4321 `webServer` (`playwright.config.ts:23-28`).

### Spec drift found

| # | Where | Finding | Kind |
|---|---|---|---|
| 1 | Phase 1 spec §6.G.1, the Presence row of the `agentExposed: false` table (`:1337`) | the reason "It emits no ARIA and needs CSS exit animations, which the host owns" carries `[INFERENCE]`. P1 (no ARIA in the 1.47.0 `dist`), P3 (no node in the tree) and P2 with P4 (the exit waits only for page CSS animations; none means one frame) back it | factual: a Phase 1 spec row **AM-100** drops `[INFERENCE]` and cites probes P1–P4 of this spec, as AM-096 did for Visually Hidden (`:2557`); no design change |
| 2 | Phase 1 spec §4.2 (`:267`), §6.C.7 (`:1261`, `:1272`) | the text is right, but `latest` is now 1.48.0 (2026-11-13), and a plain `bun add` of the `^1.47.0` range installs 1.48.0 with a second `@zag-js/core` (P12) | not drift; an implementation constraint, D17 |
| 3 | R7 §2.2 (`docs/research/01-research-zag-machines.md:82-115`) | every fact holds for 1.47.0, which is byte-identical to 1.46.0; `immediate` is still unread, while the Zag docs describe it (P1) | record only; research keeps its text |
| 4 | R7 §2.3 probe P2 (`:144`, `:148`) | the gap is closed, because through the C24 signal `PRESENCE.CHANGED` follows every change of `present` (P4) | record only |
| 5 | ARCH §16.2 Details animation (`docs/ARCHITECTURE.md:1504`) and §16.3 (`:1528`) | "The `<line-presence>` component handles enter/exit animations" for Accordion and Collapsible. MANIFESTO Law 4 forbids those components from importing `<line-presence>`, so either the consumer slots a Presence into their content or they use a machine directly | not drift for C16; the Phase 3 specs settle it |
| 6 | ARCH §14.8 complete state mapping (`:1213-1236`) | F3 (a) uses the existing `open` row. F3 (b) would add a `closed` row and F3 (c) a second, string-valued convention | no drift under the recommended option; F3 (b) or (c) is a `decision` |
| 7 | PRD §4.1 Presence row (`docs/PRD.md:262`) | "Controls mount/unmount animations". Under F2 (a), unmount means the content leaves rendering, the Tab order and the accessibility tree while it stays in the DOM. SD37 gives that meaning to this spec (`:2384`) | no drift under F2 (a) or (b); F2 (c) contradicts MANIFESTO Law 5 |
| 8 | the Zag presence machine 1.47.0 and 1.48.0 | its `animationcancel` handler unmounts on any cancel while `present` is off, so Chromium and Firefox end an exit at once when it cuts an enter (P1, P4) | upstream behaviour; F7 |
| 9 | `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 | it has no Presence row yet; the C16 PR adds one (Phase 1 spec §6.C.6; D16) | an obligation, not drift |

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| F1 | Which node does the machine track and the consumer animate? | Miguel | open; recommended (b), the shadow `root` part |
| F2 | What does "unmount" mean for a custom element? | Miguel | open; recommended (a), `hidden` on the `root` part |
| F3 | How does the host expose the presence state to consumer CSS? | Miguel | open; recommended (a), `data-open` and `:state(open)` only |
| F4 | Does the enter animation run at the first render? | Miguel | open; recommended (b), an opt-in `skip-animation-on-mount` attribute |
| F5 | Which events does Presence fire? | Miguel | open; recommended (a), `line-exit-complete` and `line-enter-complete` |
| F6 | What happens under `prefers-reduced-motion: reduce`? | Miguel | open; recommended (a), the consumer gates its own keyframes |
| F7 | What happens when a close cuts an enter animation? | Miguel | open; recommended (a), accept Zag's behaviour, document it and file an upstream issue |

**Orchestrator defaults** (they stand unless Miguel changes them)

| # | Default | Basis |
|---|---------|-------|
| D1 | Pre-built on `@zag-js/presence` 1.47.0 through `LineMachineController`; machine props `() => ({ present: this.present === true, onExitComplete, onEnterComplete })`; no `immediate`; neither value-bearing, compound nor form-associated | Phase 1 spec §6.C.4 C16 row, `:1172`; §6.C.1 (`:945`, props as a function); probe P1 (`immediate` unread), P4 (the C24 signal drives `PRESENCE.CHANGED`) |
| D2 | No role, no internals value and no ARIA attribute on the host; the docs advise against a host `aria-label` | R8 `:55`, `:79`; probes P1, P3 |
| D3 | `:host { display: contents }`, `:host([hidden]) { display: none }`, `[part='root'] { display: block }` | Portal D3 (`0013-portal.md`); probe P3 (a block host keeps a 1264 × 0 box after the exit); the root is a real box in the flat tree, so it animates inside a contents host [INFERENCE: P2 probed the part with a block host; the Browser tier proves it] |
| D4 | `commonReset` is the only reset module, and its `[hidden] { display: none !important }` hides the root against page rules | ARCH §14.7, `:1163`; Phase 1 spec `:1181`; `packages/line-core/src/styles/reset.common.css:35-37`; probe P3 |
| D5 | One part, `root`, wrapping the default slot | ARCH §5 `root` (`:306`); MANIFESTO Law 1; F1 (b) |
| D6 | `present` and `skipAnimationOnMount` are `{ type: Boolean, reflect: true }`, default `false`; under F4 (b) the root takes an internal `skip` class, rendered by Lit, while both the attribute and the machine's `skip` hold, and a shadow rule sets `animation: none !important` on it | Portal's `disabled`; `0016-skeleton.md` P4 (an `!important` shadow rule beats a page `::part` rule); probe P4 (skip turns false before the first exit's frame check) |
| D7 | `connectedCallback` calls `requestUpdate()` after `super.connectedCallback()`, and the component calls `api.setNode(root)` in `firstUpdated()` and on every connection after the first | probe P4 (a host reconnected mid-exit kept showing its content until an update); Portal's `connectedCallback` (`packages/line-components/src/portal/portal.ts`); the controller builds a new machine on each connect (`line-machine-controller.ts`, `hostConnected`) |
| D8 | Event `detail` types `{ present: false }` and `{ present: true }`; both events bubble, not composed; dispatched from `onExitComplete` and `onEnterComplete` | ARCH §17.2 C3; Chip's `line-change` options; probe P5 |
| D9 | The docs and the class JSDoc state the animation contract: CSS animations on `::part(root)`, distinct enter and exit keyframe names, `animation: none` or `0s` for an instant change, no transitions, removing the host cuts the exit, focus leaves for `body` when an exit ends, hidden controls still submit | probes P2, P3, P4 |
| D10 | Pre-upgrade content is the consumer's: the docs and the class JSDoc give `line-presence:not(:defined):not([present]) { display: none; }` | probe P6; Portal D8 and `0012-visually-hidden.md` F3 (a), the documented consumer rule for the same case |
| D11 | Catalog name `Presence`; prop schema `present` (`DynamicBoolean`, attribute binding) and `children` (`ChildList`, slot map `children` → `''`); `skipAnimationOnMount` stays out; `hostNaming: never`; no `requiredName`; no tool description | PRD row name; §6.G.1 "Every component MUST keep a descriptor" (`:1329`) and `DynamicBoolean` for booleans (`:1326`); Portal's `children` pattern; ARCH §17.4 Theme row |
| D12 | `agentExposed: false` with `agentHiddenReason` "It emits no ARIA and needs CSS exit animations, which the host owns.", the Phase 1 spec reason verbatim; Phase 1 spec AM-100 lifts its `[INFERENCE]` | Phase 1 spec `:1172`, `:1337`; §10 SD38; probes P1–P4, P9; AM-096 precedent |
| D13 | The genui tests change as the Agent contract lists, and C16 adds no surface fixture or surface axe entry | Phase 1 spec `:1183`, `:1231`; the locators in the Agent contract; `0013-portal.md` D10 |
| D14 | htmx row `n/a` | Phase 1 spec §10 SD34; ARCH §17.2 C9; probe P7 |
| D15 | `apps/storybook/stories/components/presence.stories.ts` with `title: 'Components/Primitives Base/Presence'`, the pinned meta `id: 'components-presence'`, `tags: ['autodocs']`, and a `DESCRIPTION` that carries the D9 contract and the D10 rule. Stories, each with page keyframes gated under `prefers-reduced-motion: no-preference` and a toggle button: Default (fade), Slide, Skip animation on mount, Exit complete (an event log), Disclosure (a button with `aria-expanded`). The A11y and Visual tiers read each story after its animations settle | the story-title rule of the template (`COMPONENT-SPEC-TEMPLATE.md:213`); PRD §4.1 places Presence under Primitives Base (`docs/PRD.md:262`); probe P3 (mid-animation `color-contrast`) |
| D16 | The C16 PR also adds a Presence row to `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1 from the P1 Ark and Zag evidence, writes the Storybook docs, adds a `## Presence` section to `packages/line-components/README.md` after `## Skeleton` (`:535`), adds `presenceDescriptor` to the export table of `packages/line-genui/README.md:39` and to its list of `agentExposed: false` descriptors there, reports the gzipped size against the < 5 KB soft target, and adds one changeset covering `@websublime/line-components` and `@websublime/line-genui`, with the bump picked against `main` when the PR opens (PROCESS §6). The new dependency brings `security-reviewer` into Verify (PROCESS §5) | Phase 1 spec §6.C.6, `:1223-1227`; §7.6; PROCESS §5, §6 |
| D17 | Install in `packages/line-components` with `bun add @zag-js/presence@1.47.0`, then write the range `"^1.47.0"` (§4.2 `:267`) and run `bun install`; the PR shows `bun.lock` with one version, 1.47.0, of every `@zag-js/*` package. The manifest and lockfile edit is an infra-supervisor dispatch on the same branch (Phase 1 spec §4 file-class table) | probe P12; Phase 1 spec `:1261`, `:1272`; §6.C.7 Changes (infra-supervisor edit, AM-022) |
| D18 | `presence.update-rate.test.ts` toggles `present` and captures the `prop` reader by wrapping `machine.initialState`, as `chip.update-rate.test.ts` does | probe P11; Phase 1 spec §6.C.6 `:1232` |
| D19 | The Unit tier tests transitions, reflection and events with instant exits; exit timing, tracking, focus and the tree run in the Browser tier | probe P8; R7 §2.3 (`:154-155`) |
| D20 | The Browser tier proves the hidden content's absence with `ariaSnapshot()` in three engines and a Chromium CDP assertion, and runs no `INTERNALS` read-back | Phase 1 spec `:1180` applies to internals roles, and Presence sets none (D2); probe P3 |
| D21 | No public method; Zag's `api.unmount()` stays internal | no use case in the PRD row or ARCH; `present` covers every change [INFERENCE] |
| D22 | No `exiting` or `skip` reflection beyond `open` | F3 (a); a consumer selects the exiting state with `:not([data-open])` (States) |
| D23 | The component ships no keyframes, no animation and no motion token; without consumer CSS it shows and hides in one frame | probe P4 (no CSS → 8–18 ms); MANIFESTO Out of Scope, "Opinionated default styling in the core package" (`docs/MANIFESTO.md:64`) |
| D24 | When the machine fails to start (MANIFESTO Law 9), the root follows `present` directly, and each change fires its completion event in the same update, so a consumer waiting on `line-exit-complete` is not stuck | MANIFESTO Law 9; Chip's fallback (`chip.ts`, `#state()`), which flips itself; [INFERENCE: the failure path was not probed] |

### F1 — Tracked node

**Evidence.** R7 §6 OQ2 asks which node Presence tracks (`docs/research/01-research-zag-machines.md:306`), and SD37 defers it to this spec after a three-engine probe (`:2384`). In probe P2 the host, a shadow `root` part and the first slotted child each work in chromium, firefox and webkit. The machine reads the node's animation, waits for its `animationend`, unmounts after it, and ignores descendant animations, including one with the exit's own keyframe name. A consumer reaches each node from light DOM: a host attribute or `:state()` rule, the same before `::part(root)`, or a child combinator. The machine dispatches an unprefixed, non-composed `exitcomplete` on the node and writes `animation-fill-mode: forwards` into its inline style (P1). On the host both are visible to the consumer, and Chromium leaves an empty `style=""` after a removal mid-exit (P4). On a part both stay in the shadow root. On a slotted child both land on the consumer's element. ARCH §17.2 C3 requires every event name to carry the `line-` prefix (`docs/ARCHITECTURE.md:1574`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) The host | `api.setNode(this)`; the consumer writes `line-presence:not([data-open]) { animation: … }` | The shortest selector, as Zag's and Ark's own adapters. The host needs a box, so it cannot be `display: contents`. Consumers see an unprefixed `exitcomplete` on the host and an inline `style` written to it; the event conflicts with ARCH §17.2 C3, so this option needs a C3 reading or an ARCH change (a `decision`) |
| (b) **Recommended.** The shadow `root` part | `api.setNode(root)`; the consumer writes `line-presence:not([data-open])::part(root) { animation: … }` | Works in three engines (P2). The machine's event and inline style stay in the shadow root, and the host can be `display: contents` (D3). The selector is longer, and an attribute cannot follow `::part(root)` |
| (c) The first slotted child | `api.setNode(firstElementChild)` re-set on `slotchange`; the consumer writes `line-presence:not([data-open]) > * { animation: … }` | Works in three engines and follows htmx swaps (P2, P7). The machine writes into the consumer's element and dispatches `exitcomplete` on it; only the first element counts, and text-only content has no node, so its exit ends in one frame [INFERENCE from P1's no-node path] |

### F2 — Meaning of unmount

**Evidence.** R7 §6 OQ3 lists `hidden` on the tracked node, removing or restoring slotted content, and Ark's `lazyMount` and `unmountOnExit` (`:307`). In probe P3, `hidden` on the root, the slot removed, and host `display: none` each take the content out of the Chromium tree, the snapshot and the Tab order, keep it connected with its typed value, and keep its controls in the form. `hidden` on the root holds against a page `::part(root) { display: block }` rule through `commonReset`, while host `display: none` loses to a page `display: flex` rule on the host, which brings the content back into sight, the tree and the Tab order. With the slot removed, WebKit keeps `document.activeElement` on a button that no longer renders. Moving the children out of the host takes the controls out of the form and makes a child custom element disconnect and connect again, and it is a DOM mutation outside Lit's render, which MANIFESTO Law 5 forbids (`docs/MANIFESTO.md:47`; `0013-portal.md` F1). Lazy mounting cannot apply to light-DOM content, which exists, and shows, before the module runs (P6). Ark UI's defaults keep children mounted and hidden (P1).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `hidden` on the `root` part | Lit renders `?hidden=${!api.present}` on `root` | Hidden from sight, Tab and the tree in three engines; page rules cannot undo it; state and connection kept (P3). Hidden controls still submit, as with any `display: none` (D9) |
| (b) The slot leaves the template | Lit renders `root` without `<slot>` after an exit | The same as (a) in Chromium and Firefox. WebKit keeps focus on unrendered content (P3) |
| (c) Children leave the DOM (Ark `unmountOnExit`, `lazyMount`) | the component moves its light-DOM children into a fragment on exit and back on enter | Hidden controls leave the form. Child custom elements lose their lifecycle state. **Contradicts MANIFESTO Law 5** (DOM mutation outside Lit), so it is a `decision`; `lazyMount` has nothing to defer for parsed content (P3, P6) |
| (d) The host hides itself | `:host(:not([data-present])) { display: none }` | A page `display` rule on the host defeats it, and the content stays visible, focusable and in the tree (P3) |

### F3 — State reflection

**Evidence.** ARCH §14.8 reflects each state as a boolean `data-<state>` and a `:state(<state>)`, and its complete mapping has an `open` row and no `closed` row (`docs/ARCHITECTURE.md:1213-1236`). `reflectState(name, active)` writes exactly that form (`packages/line-core/src/line-element.ts`). Zag's docs and Ark UI write `data-state="open | closed"`, and leave it out while `skip` holds (P1). In probe P4 the reflection set in the update that clears `present` is in place before the machine's frame check, so the exit rule matches in time; with `present` absent at the first render a `closed` reflection starts an exit animation on hidden content. A rule on `:not([data-open])` starts the same exit and matches harmlessly while the root is hidden (States).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `open` only | `data-open` and `:state(open)` while `present` is on; the consumer's exit rule uses `:not([data-open])` or `:not(:state(open))` | Uses the existing ARCH §14.8 row and `reflectState`. No reflection to skip, so F4 (b) needs an internal mechanism (D6). Consumers coming from Ark rewrite `[data-state=closed]` as `:not([data-open])` |
| (b) `open` and `closed` | `data-open` / `:state(open)` and `data-closed` / `:state(closed)`, both absent while skipping | Explicit exit selectors, and F4 skips by leaving both out, as Zag's docs do. **Adds a `closed` row to ARCH §14.8, a `decision`** |
| (c) `data-state` string | `data-state="open \| closed"` plus `:state(open)` and `:state(closed)` | Matches Zag, Ark and Radix CSS. **A second reflection convention beside ARCH §14.8's booleans, a `decision`** |

### F4 — Enter animation at the first render

**Evidence.** In probe P4, an open presence runs its enter animation at the first render, again on every reconnection, and when htmx swaps in an open presence (P7). Zag keeps `skip` true until the first change of `present`, and `onEnterComplete` never fires at the first render (P1). Ark UI keeps the animation by default and offers `skipAnimationOnMount`; Zag's documented adapters always skip it (P1). With `skip-mount` the probe left out the reflection while `skip` held, and the first close still played its exit (P4). An `!important` shadow rule beats a page `::part` rule (`0016-skeleton.md` P4).

| Option | What it decides | Consequence |
|---|---|---|
| (a) Always run | no attribute; the first render behaves as any change | Plain CSS behaviour. A panel open at page load animates in on load and after every reparenting |
| (b) **Recommended.** Opt-in skip | a reflected boolean `skip-animation-on-mount`; while it and `skip` hold, the root takes an internal class that sets `animation: none !important` (D6) | Default stays plain CSS, as in Ark. Authors of open-at-load content opt out. One more prop on the manifest |
| (c) Always skip | the internal class whenever `skip` holds | Matches Zag's adapters. An htmx swap that inserts an open presence, or an app that mounts it open on purpose, gets no enter animation and no opt-in |

### F5 — Events

**Evidence.** The machine calls `onExitComplete` after each finished exit and `onEnterComplete` after each enter except the first render (P1). In probes P4 and P5 the probe's `line-exit-complete` fired once per finished exit and never for a cut exit or a removal, and `line-enter-complete` once per later enter. ARCH §17.2 C3 asks for `@fires`, a typed `detail` and the `line-` prefix. A dismissed message must wait for its exit before the app removes it (Markup examples). Presence is not value-bearing, so `line-change` does not fit (C3).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Both | `line-exit-complete` and `line-enter-complete` | Covers cleanup after an exit and work after an enter, such as moving focus into new content |
| (b) Exit only | `line-exit-complete` | The common need. An app that moves focus after an enter waits on `animationend` of `::part(root)` itself, which it cannot reach through the shadow root [INFERENCE: `animationend` from the part is not composed] |
| (c) None | no event | Consumers cannot tell when the content went, short of polling `getAnimations()` |

### F6 — Reduced motion

**Evidence.** In probe P4 under `reducedMotion: 'reduce'`, a page rule gated by `prefers-reduced-motion: no-preference` gives an exit in one frame, and an ungated rule still plays. Presence ships no motion (D23). A normal-importance shadow rule does not stop a page `::part` animation, and an `!important` one does, leaving no opt-in (`0016-skeleton.md` P4, F3). WCAG 2.3.3 (AAA) asks that interaction-triggered motion can be disabled.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** The consumer gates | the docs and every story gate the keyframes under `prefers-reduced-motion: no-preference` | The motion and its gate stay together with the consumer. An ungated page animates for users who asked for less |
| (b) The component stops it | `@media (prefers-reduced-motion: reduce) { [part='root'] { animation: none !important } }` | Every reduced-motion user gets an instant change. No consumer can keep a gentle fade for those users |

### F7 — A close that cuts an enter

**Evidence.** In probe P4, closing 100 ms into a 300 ms enter ended the exit after 37 ms in Chromium and 20 ms in Firefox, with no exit animation, and after 321 ms in WebKit, with it. The 1.47.0 and 1.48.0 sources unmount on any `animationcancel` on the node while `present` is off, without checking which animation was cancelled (P1), and Chromium and Firefox deliver the enter animation's cancel after the machine entered `unmountSuspended`. Ten toggles 20 ms apart sent Firefox to `unmounted` four times (P4). The content always ends hidden and one `line-exit-complete` fires (P4).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Accept, document, report | the component uses the machine as it is; the docs note that a close during an enter can skip the exit in Chromium and Firefox; the C16 PR files an upstream Zag issue and links it | Pre-built stays Pre-built. Fast toggling can snap closed in two engines |
| (b) Filter stray cancels | a capture listener on the shadow root stops an `animationcancel` whose `animationName` differs from the exit's before it reaches `root` | The exit plays in all engines [INFERENCE: not probed]. Component logic patches machine behaviour, against MANIFESTO Law 5's "state machines own logic" |
| (c) A custom machine | a `createMachine` copy of presence with a name check in its cancel handler | **The tier becomes Custom, against the Phase 1 spec C16 row and PRD §4.1, a `decision`** |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
