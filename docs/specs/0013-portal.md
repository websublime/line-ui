# Portal

| Field | Value |
|-------|-------|
| Status | `approved` (Miguel, 2026-11-12) |
| Phase | `1` |
| Tier | `Static` (Phase 1 spec §6.C.4 C13 row, `docs/specs/01-spec-core-primitives.md:1169`; PRD §4.1, `docs/PRD.md:258`; ARCH §8, `docs/ARCHITECTURE.md:410`) |
| Tag | `line-portal` |
| Entrypoint | `@websublime/line-components/portal` (Phase 1 spec §4.2, `:252`, `:301`; §10 SD12, `:2359`) |
| Form-associated | `no` (Phase 1 spec §6.C.4 C13 row) |
| PRD catalogue entry | PRD §4.1, `Portal` row (`docs/PRD.md:258`; revised by PRD v0.8.33) |
| Ledger row | `01-C13` (`docs/plans/01-tasks-core-primitives.md:59`) |
| Governing sections | Phase 1 spec §4.2 (`:252`, `:301`), §6.C.0 (`:908-931`), §6.C.4 (C13 row `:1169`, notes `:1147-1153`, `:1179-1183`), §6.C.6 (`:1218-1233`), §6.G.1 (`:1299`, reason row `:1336`), §6.G.2, §6.G.3, §6.G.4 (Law 5 reading `:1469`, `aria-busy` `:1475`, live region `:1520-1521`, focus rule `:1525-1527`), §6.G.5, §7.4, §7.5, §7.6, §7.8, §10 SD12, SD34 (`:2381`), SD38 (`:2385`), SD39, SD98, SD99, §12 AM-002, AM-058, AM-096, AM-097; ARCH (v0.8.27) §3, §4, §5, §8, §12 (`:548`, `./popover` `:577`), §14.6–§14.9, §17.2–§17.4 (Law 5 paragraph `:1648`), §17.9 (`:1697`); PRD (v0.8.33) §4.1, §5.2, §7.5 (`:1001`), §8; MANIFESTO Laws 1–6, 9, 10; R8 `docs/research/01-research-accessibility.md:75`; R7 `docs/research/01-research-zag-machines.md:76-80`; R2 `docs/research/01-research-projection-technique.md:175`, `:246` |

Text marked `[INFERENCE]` has no probe or source behind it yet. Miguel decided Open Questions F1–F9 on 2026-11-12, each on the option the draft recommended, and Part A and Part B state those decisions. The orchestrator defaults D1–D17 stand as drafted (Miguel, 2026-11-12). F1 (c) revised the PRD §4.1 Portal row (PRD v0.8.33), and F1 (c) with F9 (b) amended the Phase 1 spec C13 row and Portal reason row (Phase 1 spec §12 AM-097). The spec passed its three-round review gate, and Miguel approved it on 2026-11-12.

---

## Probes

Throwaway probes ran on 2026-11-12 to inform F1–F9 and defaults D3, D4, D7, D8 and D13. Their code lived in `packages/line-components/temp/c13-probe/`, which `.gitignore` ignores through its `temp` entry, and was deleted after the run. Nothing of it is committed.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2, arm64; Bun 1.4.3 |
| Runner | Playwright 1.64.0 with its own engines, chromium 156.0.8078.4, firefox 157.0 and webkit 27.2; one config with three projects, one worker. Pages were served from the probe folder through `page.route` on `http://probe.local/` |
| Built packages | `line-core`, `line-components` and `line-genui` rebuilt from `dist/` of this branch. The surface probe bundled `packages/line-genui/dist/a2ui/index.js` with `bun build --splitting`, so the surface loaded `./stack` and `./button` lazily as it does in an app |
| Probe hosts | plain `HTMLElement`s and `LitElement`s with Lit 3.3.3, no `LineElement` (table below) |
| htmx | the shared harness `packages/line-testing/src/htmx.ts` (`routeHtmx`, `expectSlotSwap`) on htmx 2.0.11 and 4.0.0, plus probe-local swap and form cases |
| Chromium accessibility tree | a CDP session, `Accessibility.getFullAXTree`, walked depth-first from the root, keeping the `button`, `textbox` and `StaticText` nodes that are not ignored |
| Other engines | Playwright's `ariaSnapshot()`, which Playwright computes itself from the DOM |
| Unit tier | happy-dom 20.14.6 through `bun-test-preload.ts`, with Lit and the `line-genui` surface from `src/` |

| Host | Mechanism |
|---|---|
| `div` (control) | no portal; the content is placed by a `position: fixed` consumer rule inside the trap |
| `pm-move` (M1) | `HTMLElement`. In `connectedCallback` it appends a `div[data-pm-wrap]` to the target and moves its child nodes into it; a `MutationObserver` moves later children; `disconnectedCallback` moves them back and removes the wrapper. The target is the `target` property, else `document.querySelector(target attribute)`, else `document.body`; a missing target leaves the children in place and sets `data-pm-missing` |
| `pm-lit` (M2) | `LitElement`. In `updated()` it appends one `div[data-pm-container]` to the target, then calls Lit `render(html\`<div data-pm-wrap>${nodes}</div>\`, container)` with its child nodes; a `MutationObserver` calls `requestUpdate()`; `disconnectedCallback` calls `render(nothing, container)` and removes the container. The attribute `copy-context` copies `dir`, `lang` and `data-accent` of the host's nearest ancestors onto the wrapper (P2) |
| `pm-lit-direct` | M2 without the container: `render()` straight into the target |
| `pm-top` (M3) | `LitElement`. Shadow tree `<div part="root" popover="manual"><slot></slot></div>`; `updated()` calls `showPopover()` while the host is connected and the box is closed; `static styles` reset the UA popover box (`position: fixed; inset: auto; margin: 0; padding: 0; border: 0; background: none; color: inherit; overflow: visible; inline-size: auto; block-size: auto`) |
| `pm-fixed` (M4) | `LitElement`; `:host { position: fixed }` over a `<slot>` |
| `pm-counter` | logs its own `connectedCallback`, `disconnectedCallback` and `connectedMoveCallback` |
| `line-probe-move`, `line-probe-lit`, `line-probe-top` | subclasses of M1, M2 and M3 under `line-` names, because the harness types its fixture tag as `` `line-${string}` `` (`packages/line-testing/src/htmx.ts:58-60`) |

The main page of P1–P4 holds a white `#cover` (`position: fixed`, 280–520 × 80–200 px, `z-index: 2`) and then `#app` with `dir="rtl"`, `lang="pt"` and `data-accent="ruby"`, holding `<form id="f">` with a `Before` button, the trap and an `After` button. The trap is `position: relative; overflow: hidden; transform: translateZ(0); z-index: 1`, 200 × 40 px, and sets `--line-probe: rgb(1, 2, 3)` inline. The host sits in the trap and holds `<div id="content">` with an `Inner` button, an `<input name="q">`, the text "Portal text" and a `pm-counter`. A page rule `[data-accent="ruby"] { --line-accent-probe: rgb(200, 0, 0) }` stands in for a `line-themes` accent scope. A consumer rule places `[data-pm-wrap]`, `pm-fixed` and `pm-top::part(root)` at `position: fixed; top: 100px; left: 300px; z-index: 3`, a point under the cover.

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `bun --filter '@websublime/line-core' build && bun --filter '@websublime/line-components' build && bun --filter '@websublime/line-genui' build` | 0 | fresh `dist/`; `emit-catalog` reports 11 components |
| 2 | `bun build entry.ts --outfile bundle.js --target browser --format esm --define 'process.env.NODE_ENV="production"'` in the probe folder | 0 | one 26.43 KB module with the probe hosts and Lit |
| 3 | `bun build surface-entry.ts --outdir surface --splitting --target browser --format esm --define 'process.env.NODE_ENV="production"'`, `surface-entry.ts` importing `../../../line-genui/dist/a2ui/index.js` | 0 | a 0.88 MB entry and 17 chunks |
| 4 | `bunx playwright test -c packages/line-components/temp/c13-probe/playwright.config.ts`, with `portal.probe.ts` the only probe file then | 0 | 60 passed (24.1 s); P1–P8 |
| 5 | the same config with `htmx.probe surface.probe`, output redirected to a log and followed by `echo EXIT=$?` | none produced: the job was cancelled before the `echo` ran | the four `line-probe-top` htmx tests ran to the 60 s timeout in chromium; the run was stopped and its records discarded |
| 6 | the same config with `htmx.probe --project chromium -g line-probe-top --timeout 15000` | not recorded (piped through `tail`) | 4 failed; Playwright waited on the harness `Load` button because the probe's `<input>` inside the top-layer box "intercepts pointer events" (P9, P11) |
| 7 | the same config with `htmx.probe surface.probe top.probe`, after a consumer rule placed `line-probe-top::part(root)` at 300 × 100 px | 0 | 54 passed (1.8 min); P9–P11 |
| 8 | the same config with `footprint.probe` | 0 | 3 passed; P12 |
| 9 | the same config with `debug.probe`, a trace of the records the surface's `MutationObserver` options see, one variant (the moved node) | 0 | 3 passed; P10 |
| 10 | the same config with `debug.probe`, after the trace was split into three variants (control, moved in the same task as the batch, moved 50 ms before it) | 0 | 9 passed; P10 |
| 11 | the same config with `debug.probe --project chromium -g control`, after the trace also recorded the setup batch's errors | 0 | 1 passed; P10 setup note |
| 12 | `bun test ./packages/line-components/temp/c13-probe/happy.test.ts` | 0 | 2 pass; P13 |
| 13 | `node packages/line-components/temp/c13-probe/v.mjs`, which launched each engine and printed `browser.version()` | not recorded (other commands followed it in the same call) | the engine versions of this table |
| 14 | `rm -rf packages/line-components/temp/c13-probe packages/line-components/test-results && rmdir packages/line-components/temp`; `git status --short` | 0 | deleted; the tree is clean |

WebKit on macOS moved Tab focus with Alt+Tab, as the existing Browser tier does. "Same" in a column means the result of the chromium column. Every result below was the same in chromium, firefox and webkit unless a column says otherwise.

### P1 — Escape from clipping, a transform and a stacking context

The probe took the `Inner` button's box and asked `document.elementFromPoint` for its centre.

| Host | Where the content sits | `Inner` box, chromium | Hit at the centre |
|---|---|---|---|
| control `div` | in the trap | 1487, 121 (firefox 1526, 122; webkit 1491, 123), outside the 1280 px viewport | nothing; the transform makes the trap the containing block of the fixed content, and `overflow: hidden` clips it |
| `pm-fixed` (M4) | in the trap | same as the control | nothing, for the same reason |
| `pm-move` (M1) | `body > div[data-pm-wrap]` | 300, 100 | `Inner`, above the cover |
| `pm-lit` (M2) | `body > div[data-pm-container] > div[data-pm-wrap]` | 300, 100 | `Inner`, above the cover |
| `pm-top` (M3) | in the trap, unmoved | 525, 100 (firefox 561, 100; webkit 526, 102); the consumer rule puts the box's left edge at 300 px, and its content lays out right to left under the inherited `dir="rtl"` | `Inner`, above the cover |

- A move to `<body>` and the top layer both escape `overflow: hidden`, a transformed ancestor and a sibling stacking context in all three engines. `position: fixed` on the host escapes none of them under a transformed ancestor.
- The moving hosts needed the consumer's `z-index: 3` on the wrapper to paint above the cover. The top-layer box carried the same rule, so P1 does not show that the top layer needs none [INFERENCE: the top layer paints above every `z-index`; P8 and P11 show it above a modal dialog and above an earlier box].

### P2 — Inherited context

Read on `#content` once each host had run, with the M1 and M2 hosts run once without and once with `copy-context`.

| Host | `--line-probe` (inline on the trap) | Theme stand-in (`data-accent` scope) | `:dir(rtl)` | `:lang(pt)` |
|---|---|---|---|---|
| control, `pm-top`, `pm-fixed` | `rgb(1, 2, 3)` | `rgb(200, 0, 0)` | true | true |
| `pm-move`, `pm-lit` | empty | lost (`rgb(255, 255, 255)`) | false | false |
| `pm-move`, `pm-lit` with `copy-context` | empty | `rgb(200, 0, 0)` | true | true |

- Moved content inherits from its new ancestors. A wrapper that copies `dir`, `lang` and `data-accent` restores the attribute-keyed scopes, which is how `line-themes` scopes a theme (`packages/line-themes/src/aliases.css:7`). It cannot restore a custom property set by a class or an inline style on an ancestor without copying styles from TypeScript, which MANIFESTO Law 5 forbids (`docs/MANIFESTO.md:47`).
- Top-layer content keeps every inherited value, because inheritance follows the flat tree and the box is still a child of the host's shadow root.

### P3 — Events and form ownership

Listeners on the host, the trap, `#app` and `document` recorded a click on `Inner`. The form check read `field.form` and `new FormData(f).has('q')`.

| Host | Click reached | `composedPath()` at `document` | `field.form` | `q` in `FormData(f)` |
|---|---|---|---|---|
| control | host, trap, `#app`, `document` | `inner > content > host > trap > f > app` | `f` | yes |
| `pm-move`, `pm-lit` | `document` only | `inner > content > DIV > BODY > HTML` (M2 adds the container `DIV`) | `null` | no |
| `pm-top` | host, trap, `#app`, `document` | `inner > content > SLOT > DIV > #document-fragment > host` | `f` | yes |
| `pm-fixed` | host, trap, `#app`, `document` | through the slot and the host | `f` | yes |

- Events from the nodes M1 and M2 relocated never reach the host or its ancestors. A control they took out of its `<form>` leaves the form, so its value no longer submits.
- In the top layer the event path is the DOM path, and the control stays in its form.

### P4 — Focus order, reading order and the children's lifecycle

Focus started on `Before`; the probe pressed Tab three times. The Chromium tree lists named nodes in tree order.

| Host | Tab from `Before` | Chromium accessibility tree order | `pm-counter` callbacks after mount |
|---|---|---|---|
| control, `pm-fixed`, `pm-top` | `Inner`, `Query`, `After` | Before, Inner, Query, Portal text, After | `connected` |
| `pm-move` | `After`, `Inner`, `Query` | Before, After, Inner, Query, Portal text | `connected` |
| `pm-lit` | `After`, `Inner`, `Query` | Before, After, Inner, Query, Portal text | `connected`, `disconnected`, `connected` |

- A move puts the content at the end of `<body>`, so the Tab order and the reading order jump past `After` (WCAG 1.3.2, 2.4.3; R8 `:75`). In the top layer both follow the DOM.
- Lit renders after the first connection, so every child custom element of an M2 host connects, disconnects and connects again, and loses focus and state. M1 moved the children inside the host's upgrade, before `pm-counter` upgraded; a host that upgrades after its children connected moves connected children, as P5 L2 shows.
- `Element.prototype.moveBefore` exists in chromium and firefox and not in webkit, as R2 recorded from BCD (`docs/research/01-research-projection-technique.md:246`).

### P5 — Host lifecycle

| Step | `pm-move` (M1) | `pm-lit` (M2) | `pm-top` (M3) |
|---|---|---|---|
| L1 remove the host | content returned to the detached host; wrapper removed; counter `disconnected` | content detached from the document and from the host by `render(nothing)`; the probe's node list kept only nodes in the wrapper or the host, so it lost them | content stays in the detached host; counter `disconnected` |
| L2 append the host to the trap again | content moved out again, visible; counter `connected`, `disconnected`, `connected` | content gone | box shown again, visible; counter `connected` |
| L3 append a child to the host | moved by the observer, visible | moved after the next update, visible | slotted, visible |
| L4 the consumer removes a moved node, then appends another child | removed node stays removed; new child moved | same | same |
| L5 move the host to `#app` | content returned and moved again; counter `disconnected`, `connected` twice | content gone | box shown again; counter `disconnected`, `connected` |

- A move design must return its nodes on disconnect and take them again on connect, and each round trip resets the children. Lit's `render(nothing)` detaches the nodes and does not return them; returning them is a DOM call outside Lit's render.
- The top layer needs nothing on disconnect. The UA hides a disconnected popover, and `updated()` shows it again after a reconnect.

### P6 — Before `customElements.define()`

The P1 page loaded with the definitions held back, measured, then defined the hosts.

| Host | Before `define()` | After |
|---|---|---|
| `pm-move`, `pm-lit`, `pm-top` | content inline in the host inside the trap, visible at about 1234, 21 | moved (M1, M2) or in the top layer (M3), visible at the consumer point |

- An undefined `line-portal` is an inline element, so its content shows in place, clipped by its ancestors, until the module runs.

### P7 — Targets

| Case | `pm-move` (M1) | `pm-lit` (M2) |
|---|---|---|
| `target="#outlet"` | content in `#outlet` | same |
| `target="#missing"` | content stays in the host and shows (the probe's choice) | content stays in the host's light DOM; the shadow root has no slot, so nothing shows (the probe's choice) |
| `document.querySelector('#outlet2')` for an outlet inside an open shadow root | `null` | `null` |
| `target` property set to that outlet | content moves into the shadow root; the shadow rule `span { color: rgb(0, 128, 0) }` applies and the document rule `.shadow-text` does not; `document.getElementById` no longer finds it | same |

`pm-lit-direct`, rendering straight into a shared `#outlet` that already held a `<p>`:

| Step | Result |
|---|---|
| a second `pm-lit-direct` renders into the same outlet | the first host's node is detached; Lit keeps one part per container |
| a script appends `div#foreign` to the outlet, then the second host is removed and calls `render(nothing, outlet)` | `#foreign` is detached; the pre-existing `<p>` stays |

- A selector cannot name an element inside a shadow root; only an element reference can. Moved content takes the styles of the tree it lands in.
- Lit owns the nodes from its marker to the end of the container it renders into. Rendering into a shared target therefore needs one container per host, and that container is inserted by a DOM call outside Lit's render.

### P8 — Modal dialog

`<dialog>` held a paragraph, the host with an `Inner` button, and a Close button; `showModal()` ran after the host connected. The control placed its content with the consumer rule.

| Host | `inner.focus()` takes focus | Hit at the `Inner` centre | Real pointer click reaches `Inner` |
|---|---|---|---|
| control | yes | `Inner` | yes |
| `pm-move`, `pm-lit` | no; the moved node is outside the dialog, so it is inert | the dialog (its `::backdrop`) | no |
| `pm-top`, box shown before `showModal()` | yes; the node is still in the dialog | the dialog (its `::backdrop`) | — |
| `pm-top` after `hidePopover()` and `showPopover()` | yes | `Inner` | yes |

- A move out of a modal dialog makes the content inert in all three engines.
- A top-layer box stacks in the order of showing. A box shown before a modal dialog opens paints under the dialog's backdrop, though its content is not inert; showing it again puts it on top (P11 show order).

### P9 — htmx

| Case | `line-probe-move` | `line-probe-lit` | `line-probe-top` |
|---|---|---|---|
| harness `expectSlotSwap` (d), htmx 2 and 4 | fails: `locator('#line-htmx-harness-host').getByText('First slotted item')` is not visible, because the swapped spans sit in the wrapper | fails, same | passes |
| an `hx-get` button inside a portal that htmx swapped in, then clicked, htmx 2 | 0 requests | 0 requests | 1 request |
| the same, htmx 4 | 0 requests | 1 request | 1 request |
| `<form hx-post>` with `<input name="q" value="1">` inside a portal, submitted, htmx 2 and 4 | body empty | body empty | `q=1` |

- M1 moved the swapped children inside the upgrade, before htmx processed the swapped fragment, so htmx never saw the button. M2 moved them a microtask later: htmx 4 had processed them by then and htmx 2 had not [INFERENCE: the order of htmx's processing step and Lit's update is read from the result, not traced].
- In the top layer, swapped content is ordinary slotted DOM, and the form keeps its value.
- Runs 5 and 6 of the Setup table: with no placement rule, the top-layer box sat at its static position over the harness `Load` button and took its pointer events in chromium.

### P10 — The A2UI surface

The surface rendered `Column[Text "Alpha", Row p[Button b]]` from the basic catalog, with b's label bound to `/label`, then the probe appended the rendered `line-button` to `<body>`, as a portal that relocates its child would. Each step ran on a fresh page, once without the move (control) and once with it.

| Step | Control | Moved |
|---|---|---|
| update `/label` to "Two" | the label updates | the label updates |
| `aria-busy="true"` covers the button during the batch | yes | no |
| live region after the batch, with the move settled 50 ms before it (`debug.probe`) | "Content updated."; the surface's observer options saw one `characterData` record | empty; they saw only the surface's own `aria-busy` records |
| live region, with the move in the same task as the batch | "Content updated." | "Content updated.", from the move's own record |
| click the button | one `line-a2ui-action` | one `line-a2ui-action`; the projection listens on the element |
| `updateComponents` gives `p` the children `['b', 'c']` | the button stays in `p` | the reconciler puts the button back into `p`'s `line-stack` |
| focus the button, then reparent `b` into a new Column `w` | focus stays on the button | the button returns into the surface and focus falls to `<body>` |
| `deleteSurface` | the button leaves the document | the button stays in `<body>` |

- The setup batch raised one `MISSING_ACCESSIBLE_NAME` for b in every variant, because the label's data arrived in the same batch. The probe cleared the live region before each measured batch.
- The moved node leaves the surface's `aria-busy`, its live-region record of changes and its focus rule, and outlives `deleteSurface`. It does not leave the `instanceId` reconciliation: the projection still updates it and listens on it, and the reconciler pulls it back on the next update of its parent.
- happy-dom (P13) gave the same update, live-region and `deleteSurface` results with the `src/` surface.

### P11 — Top-layer box specifics

| Check | Result |
|---|---|
| UA popover box, no reset | centred at 622, 343; `border` 3 px, `padding` 4 px, `background` white |
| reset plus `inset-block-start: 0; inset-inline-start: 0`, `dir="ltr"` | at 0, 0 (firefox and webkit 0, 1) |
| the same under `dir="rtl"` | at the inline start, 1204–1280 px |
| host inside a `display: none` ancestor | not rendered; `checkVisibility()` false |
| host with `hidden` | not rendered; `checkVisibility()` false |
| two hosts, the second shown later, overlapping | the second paints on top |
| `popover` attribute removed from an open box | the box closes and the content renders as an ordinary box; the probe's reset kept `position: fixed` on the root, so P11 did not measure in-flow placement (Anatomy; Browser tier) |
| page scrolled by 500 px | the box stays at its viewport point; the host's own box moves to −460 |
| `CSS.supports('anchor-name: --a') && CSS.supports('position-anchor: --a')` | true |
| `typeof HTMLElement.prototype.showPopover` | `function` |

### P12 — Host footprint and `hidden`

A 300 px flex row with `gap: 10px` held `A`, the host and `B`.

| Case | `B` offset | Content |
|---|---|---|
| no host | 21 px | — |
| `pm-top` host | 31 px; the empty inline host is a flex item with a gap | in the top layer |
| `pm-top` with `display: contents` | 21 px | in the top layer, `checkVisibility()` true |
| `display: contents` and `[hidden] { display: none }`, host `hidden` | — | not rendered |
| plain host `hidden` | — | not rendered |

### P13 — happy-dom 20.14.6

| Check | Result |
|---|---|
| `HTMLElement.prototype.showPopover` | `undefined`; calling it throws |
| `Element.prototype.moveBefore` | `undefined` |
| Lit `render()` of two existing nodes into a container | both moved; the host keeps none |
| `render(nothing, container)` | the nodes leave the document |
| `MutationObserver` on a host's child list | fires |
| `composedPath()` of a click on content slotted into a popover root | `x > T-TOP > DIV > BODY`; the slot and the shadow root are missing |
| inherited `--line-probe` from an inline style | empty |
| surface escape with `src/` | as P10: label updated; live region "Content updated." for the control and empty for the moved node; the moved node stays connected after `deleteSurface` |

- The unit tier can check the shadow tree, attributes and that nothing throws without the Popover API. The top layer, event paths, inheritance and focus belong to the Browser tier.

### What the probes settle

- Every option that relocates nodes needs DOM mutation outside Lit's render: an imperative move (M1), or with Lit (M2) one container per host and the return of the nodes on disconnect (P5, P7). The top layer moves nothing and needs only Lit's template and a `showPopover()` call (P1; F1).
- A move escapes clipping and stacking (P1) and loses inherited context (P2), the event path and form ownership (P3), the Tab and reading order (P4), and usability inside a modal dialog (P8). It breaks the htmx harness and form posts (P9) and leaves the surface's `aria-busy`, live region and focus rule (P10; F1, F9).
- The top layer escapes the same ancestors (P1) and keeps context, events, the form, DOM order and htmx paths (P1–P4, P9). Its content stays in the host's light DOM (P3), so it stays in a surface [INFERENCE: not probed with the surface]. It stacks by show order, so a box shown before a modal dialog opened sits under it (P8, P11; F7).
- A top-layer box needs a placement: its UA position is the viewport centre with a border, and with a reset and no placement it covers page content and takes its clicks (P9, P11; D4).
- `display: contents` on the host removes its flex footprint and keeps the box in the top layer, and `hidden` still hides it with a `[hidden]` rule (P12; D3).
- The `[INFERENCE on the escape]` that Phase 1 spec `:1336` carried before AM-097 held for a relocating portal in part. The node escapes `aria-busy`, the live region and the focus rule, and outlives `deleteSurface`. It stays under the `instanceId` reconciliation, which pulls it back (P10; F9).

### What automation cannot observe

- What a screen reader speaks for top-layer content that has no invoker, and whether it reads it at its DOM position. The Chromium tree lists it in DOM order (P4); speech is not observed.
- Firefox and WebKit accessibility trees. Playwright's snapshot is its own computation from the DOM (Phase 1 spec §12 AM-058).
- Whether a consumer can see that a top-layer box covers part of the page. P9 shows the box taking clicks; no check flags it.

---

## Part A — Requirements

### Overview

#### Description

`<line-portal>` shows its content in the browser top layer, above clipping and stacking contexts, while the content keeps its DOM position (PRD §4.1, `docs/PRD.md:258`). The content escapes `overflow` clipping, transformed ancestors and stacking contexts (P1). The consumer writes the content in its default slot. The content stays where it is in the DOM and paints in the browser's top layer, above the rest of the page (F1 (c)). It therefore keeps everything it inherits, its events still reach the host and its ancestors, a form control still belongs to its form, and Tab order and reading order follow the markup (P2–P4). The consumer places the box through `::part(root)` (D4). It has one boolean, `disabled`, which renders the content in place (F4), and one method, `bringToFront()`, which puts the box above top-layer boxes shown after it (F7). It fires no events. It is not offered to agents (Phase 1 spec §10 SD38; F9).

#### Use cases

- A menu, a list of options or a tooltip whose container clips it with `overflow: hidden` or traps it under a transform (P1).
- Content that must paint above a sibling with a higher `z-index`, such as a fixed header (P1).
- A floating panel inside a form whose fields still submit with the form (P3).
- A panel anchored to a trigger with CSS anchor positioning, which all three engines support (P11); the Browser tier places the box under its trigger with the documented rule (AM-002).

#### Anti-patterns

- Moving content to another region of the page, such as a sidebar outlet. The Portal paints its content on top and keeps it at its DOM position (F1 (c), F2 (a)).
- A modal dialog. Use the native `<dialog>` with `showModal()`, or `<line-dialog>` when Phase 3 ships it (PRD §7.5, `docs/PRD.md:980`).
- Announcing a message. The Portal announces nothing; use `<line-alert>` or a live region (`0006-alert.md`).
- Leaving the box unplaced. Without a `::part(root)` rule it sits at the viewport's start corner and covers the page there (P9, P11; D4).

#### User expectations

- The content shows above clipping containers and other layers (P1).
- Keyboard focus reaches the content where it sits in the markup, and a screen reader reads it there (P4; F6).
- Inside a modal dialog, the content can be clicked and focused once it is brought to the front (P8; F7).

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| any content | child | the default slot; the content stays in the light DOM (F1 (c)) |
| native `<form>` | ancestor | a form control in the slot keeps its form owner and submits with the form (P3) |
| native `<dialog>` | ancestor | the content stays in the dialog's subtree and is not inert; `bringToFront()` after `showModal()` paints it above the dialog (P8; F7) |
| Phase 3 overlays (`./popover`, `docs/ARCHITECTURE.md:577`) | none | an overlay cannot import `<line-portal>` (MANIFESTO Law 4); a consumer may slot overlay content into one [INFERENCE: Phase 3 overlays may use the top layer themselves; their specs decide] |
| `<line-a2ui-surface>` | none | `agentExposed: false`; a `line` node of type `Portal` renders the surface's unknown-type placeholder (Agent contract) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| none | — | — |

- Portal has no C6 semantic variant, because it draws nothing of its own and has no tokens (ARCH §17.2 C6).

---

## Part B — Technical Specification

### Anatomy

```
<line-portal>                         LineElement; :host { display: contents } (D3)
└── #shadow-root
    └── <div part="root" popover="manual">   in the top layer while connected (F1 (c)); no popover attribute and display: contents while disabled (F4 (b))
        └── <slot>
```

- One part, `root`, the box that paints in the top layer. Consumer CSS places and styles it (MANIFESTO Law 1; ARCH §5 `root`).
- `updated()` calls `showPopover()` on the root while the host is connected, is not `disabled`, and the root is closed, and only where `showPopover` is a function (D7). `showPopover()` changes the box's top-layer state and adds or moves no node, so the shadow tree stays Lit's template (MANIFESTO Law 5; F1 (c)). The same holds for the `hidePopover()` and `showPopover()` calls of `bringToFront()`, which run in the method, outside the reactive cycle (Props).
- `connectedCallback` calls `requestUpdate()`, so a reconnected host shows its box again (P5 L2, L5).
- While the root carries `popover`, the stylesheet resets the UA popover box and places it at the logical start corner. Without `popover`, while `disabled`, the root is `display: contents`, so the content lays out where the host sits (D4; F4 (b)):

```css
:host {
  display: contents;
}

:host([hidden]) {
  display: none;
}

[part='root'][popover] {
  position: fixed;
  inset: auto;
  inset-block-start: 0;
  inset-inline-start: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  overflow: visible;
  inline-size: auto;
  block-size: auto;
}

[part='root']:not([popover]) {
  display: contents;
}
```

- `display: contents` gives the host no box, so a flex or grid parent sees no item, and `:host([hidden])` keeps `hidden` working, because a `display` on `:host` beats the UA `[hidden]` rule (P12; `0012-visually-hidden.md` P7).
- A `disabled` root generates no box, so its content joins the line or the flex row of the host's parent, inside a paragraph too. The reset and the start-corner placement never reach it, and consumer placement rules target `::part(root):popover-open`, so they never reach it either (Consumer styling). The Browser tier asserts the in-flow result in a flex row and in a paragraph (AM-002).
- `commonReset` stays in `static styles`, because ARCH §14.7 maps every Static component to it (`docs/ARCHITECTURE.md:1163`) (D5).
- The host extends `LineElement` without the `FormAssociated` mixin and writes no internals value (D2).

### States

| Field | Value |
|-------|-------|
| Machine | `none` (Static tier; ARCH §8, `docs/ARCHITECTURE.md:410`; Phase 1 spec §6.C.4 C13 row; R7 `:76`) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| none | — | — | — |

- Whether the box is in the top layer is the native `:popover-open` on `::part(root)`, so a consumer styles it as `line-portal::part(root):popover-open`; every placement rule of the Browser tier matches through it (AM-002). `disabled` reflects as an attribute.

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ChildList` | any content; it stays in the light DOM and paints in the top layer (F1 (c)) |

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<div popover="manual">` | the top-layer box; the consumer places it and sizes it |

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `disabled` | `disabled` | `boolean` | `false` | yes | renders the content in place, without the top layer (F4 (b)) |

- `bringToFront(): void` acts synchronously, in the method. It calls `hidePopover()` on the root only when the root matches `:popover-open`, then `showPopover()`, so the box paints above every top-layer box shown before the call, such as a modal dialog opened after the Portal connected (P8; F7 (b)). It does nothing when no root is rendered yet, because the pending first update shows the box; when the root has no `popover` attribute, because an update that clears `disabled` is pending and that update shows the box; when the host is `disabled`; or when it is disconnected. The D7 guards apply, so `showPopover()` never runs on a root without `popover`, where browsers throw `NotSupportedError` (Miguel, review gate round 2, 2026-11-12). The calls change the box's top-layer state and add or move no node, so the method meets MANIFESTO Law 5 outside the reactive cycle, as `updated()` does inside it (F1 (c); Miguel, review gate round 1, 2026-11-12).
- A modal dialog stacks above every box shown before it, so the consumer calls `bringToFront()` after every `showModal()`, including each reopening of the same dialog. On a Portal outside the open modal dialog the call also paints the box above the dialog's backdrop, but the content stays inert, because a modal dialog makes everything outside it inert. P8 probed a Portal inside the dialog; the Browser tier asserts the outside case with `:popover-open`, a screenshot pixel and focus, because hit testing skips inert content (AM-002).
- Nested portals. `bringToFront()` raises only the Portal's own root. `outer.bringToFront()`, or clearing `disabled` on an outer Portal, shows the outer box again above an inner one, which then covers the inner content where the boxes overlap, so the consumer calls `outer.bringToFront()` and then `inner.bringToFront()`. After clearing `disabled` on the outer Portal, the consumer first awaits `outer.updateComplete`, because the update that shows the outer box would otherwise land on top of the inner one after `inner.bringToFront()`. Nesting follows from show order (P11), and the Browser tier asserts it (AM-002).
- The host takes the global `hidden` attribute, which hides the content (P11, P12).

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

Portal holds no value and no interactive element, so it fires nothing and is neither value-bearing nor compound (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`). Events from the content bubble through the host to its ancestors (P3; F5 (a)).

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| none | — | — |

#### Consumer styling

```css
/* Place the box under its trigger with CSS anchor positioning (P11) */
.trigger {
  anchor-name: --menu;
}
line-portal.menu::part(root):popover-open {
  position-anchor: --menu;
  inset: auto;
  inset-block-start: anchor(end);
  inset-inline-start: anchor(start);
}

/* Hide the content before the module loads (D8) */
line-portal:not(:defined) {
  display: none;
}
```

- These rules live in the outer tree. Outer `::part()` declarations beat the component's own rule, as P1 placed `pm-top::part(root)` at 300 × 100 px.
- Placement rules target `:popover-open`, so they never reach a `disabled` root, which renders in place (F4 (b); D4).
- P11 checked support for `anchor-name` and `position-anchor`. The Browser tier runs the anchored example (AM-002).

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

The host takes no focus and handles no key (R8 `:75`). Focusable content keeps its own keys and its DOM position in the Tab order (P4; F6 (a)).

### A11y

| Field | Value |
|-------|-------|
| Role | none; no internals role and no `role` attribute (R8 `:75`; D2) |
| ARIA attributes | none written by the component |
| Accessible name | none of its own; the content is read in place (P4) |
| Focus | the host is not focusable and does not delegate focus; the content keeps its DOM order (P4) |

- **Order (F6).** Reading order and focus order follow the DOM, which meets WCAG 1.3.2 and 2.4.3 when the markup order matches the visual order (R8 `:75`). The consumer keeps the Portal next to its trigger in the markup.
- **Proof (D13).** No role or name lives in internals, so the Phase 1 spec CDP-and-read-back rule for internals roles does not apply (`:1180`). The Browser tier proves order with `ariaSnapshot()` in three engines and a Chromium CDP walk.
- **Firefox and WebKit.** No check reads their accessibility trees, and no screen reader was run on top-layer content (Phase 1 spec §12 AM-058).

**What axe proves here.** No axe run was part of the probes. The A11y tier runs axe on every story (Tests).

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `disabled`, a boolean; the content is slotted. `bringToFront()` is a method, not an input |
| C2 | Slots carry `@slot` and a single or multiple classification | one `@slot` for the default slot, `ChildList` |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | no events, so no `@fires`; not value-bearing |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated |
| C5 | The host accepts an accessible name and applies it to the element with the role | no element carries a role; the docs advise against a host `aria-label`, which would name a `generic` (R8 `docs/research/01-research-accessibility.md:55`) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | no variants |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries `@summary`, one `@slot` and `@csspart root`; the method `bringToFront()`, written without a `public` modifier, carries its own JSDoc, which the manifest shows as the method's description (D14); no `@cssprop` or `@fires`; nothing is deprecated |
| C8 | Missing or partial props degrade to an empty or neutral state | with no content the root is an empty open box with no border, padding or background; the Browser tier measures a 0 × 0 root that takes no hit at the start corner (AM-002) |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

`disabled` stays out of the descriptor's prop schema, because the descriptor is not exposed and the surface never sets it (D9).

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `Portal` (D9) |
| Tag | `line-portal` |
| `load()` subpath | `@websublime/line-components/portal` |
| Prop schema | `children` (`ChildList`, through `commonProp` with the description "The child components, in order.", as Stack's, optional), plus `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1) |
| Slot map | `children` → the default slot (`''`) |
| Binding map | none; no value prop; no commit event |
| Action map | none |
| Accessibility requirements | no `requiredName`; `hostNaming: { kind: 'never' }`, because the host has no role a name could attach to (`packages/line-genui/src/catalog/descriptor.ts:162-172`) |
| Agent-facing description | Content that paints above the rest of the page, outside the box of its container, while it stays in place for focus, reading order and events. |
| Tool description | none; no tool is emitted |
| `agentExposed` | `false`, with `agentHiddenReason` "It paints its content above the whole page, outside the surface, so an untrusted agent could cover the host's own UI." (F9 (b); Phase 1 spec §6.C.4 C13 row, `:1169`; reason row `:1336`; §10 SD38, `:2385`; ARCH §17.9, `docs/ARCHITECTURE.md:1697`) |

- `defineDescriptor` requires `agentHiddenReason` when `agentExposed` is `false` (`packages/line-genui/src/catalog/descriptor.ts:232-244`).
- The `line` catalog emitter and the frontend-tool emitter skip the descriptor (`packages/line-genui/src/catalog/line.ts:85`; `tools.ts:299`). Acceptance follows Phase 1 spec `:1183`: `Portal` is not a key of `components` in the built `catalog.json`, and `frontendTools(descriptors, provider)` returns no tool named `Portal` for any provider.
- The surface builds its `line` descriptor map from exposed descriptors only (`packages/line-genui/src/a2ui/projection.ts:60`), and the session registers `lineCatalog(descriptors)` (`session.ts:186`). A `line` node of type `Portal` therefore renders the inert `unknown-type` placeholder and raises one `UNKNOWN_COMPONENT_TYPE` `line-a2ui-error`, as the VisuallyHidden case does (`packages/line-genui/__tests__/a2ui-surface.test.ts:209-214`), and `./portal` never loads.
- The coverage test needs the descriptor, because `line-portal` enters the manifest (`packages/line-genui/__tests__/cem-coverage.test.ts`). The drift test checks its default slot against the manifest.
- Six genui test expectations change with a thirteenth descriptor (D10).
  - `PROP_TYPES` gains `Portal: { children: 'ChildList' }` (`packages/line-genui/__tests__/catalog.test.ts:45-92`), and its doc comment adds `0013-portal.md` to its list of specs (`:40-43`).
  - The raw catalog of every descriptor gains `Portal`, and the test title at `:111` says thirteen descriptors.
  - The exposure test expects `toHaveLength(13)` (`:498`, was 12) and `[portalDescriptor, visuallyHiddenDescriptor]` as the descriptors with `agentExposed: false` (`:499`), and its title at `:496` names both.
  - A Portal test beside the VisuallyHidden reason test (`:501`) asserts `agentExposed: false` and the F9 reason.
  - The import test expects `descriptors: 13` (`:537`).
  - A "no provider emits a Portal tool" test sits beside the VisuallyHidden one (`packages/line-genui/__tests__/frontend-tools.test.ts:310`).
  - The tool-description loop needs no change, because it already takes exposed descriptors only (`frontend-tools.test.ts:356`).
- C13 adds no surface render-fixture entry and no surface axe case, because §6.C.6 asks that only of agent-exposed rows (Phase 1 spec `:1231`).
- Phase 1 spec AM-097 (decision, Miguel 2026-11-12, F1 (c) and F9 (b)) replaced the reason row (`:1336`) and the C13 row's `agentExposed` cell (`:1169`) with the top-layer reason. P1 shows the box painting above a sibling outside its container, and P9 shows it taking the clicks of a button it covers. The content never leaves the host's light DOM (P3), so it never leaves a surface [INFERENCE: the surface was not probed with a top-layer host; P10 probed a relocation].

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/portal` |
| Kind | `independent` (Phase 1 spec §4.2, `:301`; §10 SD12) |
| Registers | `line-portal` |
| Reset modules | `commonReset` only (ARCH §14.7, `docs/ARCHITECTURE.md:1163`; D5) |

- The files are `src/portal/portal.ts`, with the class `LinePortal` and `customElements.define`, and `src/portal/index.ts`. There is no `.types.ts`, because the one prop is a boolean; Avatar has none either (`packages/line-components/src/avatar/`).
- `package.json` gains the `./portal` export (Phase 1 spec §4.2, `:252`), and the Vite build gains the `portal/index` entry after `visually-hidden/index` (`packages/line-components/vite.config.mjs:22`). No new dependency.
- `packages/line-components/__tests__/bundle-splitting.test.ts` gains the `EXPECTED_TAGS` row `'./portal': ['line-portal']` after `./visually-hidden` (`:69`). It needs no `ALLOWED_TAG_REFERENCES` row, because the component matches no other tag.
- `line-genui` gains `src/catalog/descriptors/portal.ts` with `portalDescriptor`. `src/catalog/index.ts` imports it, adds it to the named exports (`:114`) and to the `descriptors` array in catalog-name order, after `iconButtonDescriptor` (`:118-131`).
- Portal imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6, `:1228`).

### Markup examples

```html
<!-- A menu that escapes a clipping card, placed under its trigger -->
<div class="card" style="overflow: hidden">
  <button type="button" class="trigger">Options</button>
  <line-portal class="menu">
    <ul>
      <li><a href="/rename">Rename</a></li>
      <li><a href="/delete">Delete</a></li>
    </ul>
  </line-portal>
</div>

<!-- A field that still submits with its form -->
<form method="post">
  <line-portal class="panel"><label>Note <input name="note" /></label></line-portal>
  <button type="submit">Save</button>
</form>

<!-- Inside a modal dialog: bring the box to the front after every showModal() -->
<button type="button" id="open-settings">Open settings</button>
<dialog id="settings">
  <p class="hint-anchor">Theme</p>
  <line-portal id="hint" class="hint">Changes apply on save.</line-portal>
</dialog>
<script type="module">
  document.getElementById('open-settings').addEventListener('click', () => {
    document.getElementById('settings').showModal();
    document.getElementById('hint').bringToFront();
  });
</script>

<!-- Nested portals: raise the outer box, then the inner one -->
<line-portal id="outer" class="panel">
  Panel
  <line-portal id="inner" class="tip">Tip</line-portal>
</line-portal>
<script type="module">
  document.getElementById('outer').bringToFront();
  document.getElementById('inner').bringToFront();
</script>

<!-- In place, without the top layer: the words stay in the sentence -->
<p>Read <line-portal disabled>the words written here</line-portal> in line.</p>
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom, `packages/line-components/__tests__/portal.test.ts` | registers `line-portal` with its class; the shadow root holds one `div[part="root"][popover="manual"]` with one `<slot>`; `disabled` reflects and removes the `popover` attribute; no throw on connect, update, or `bringToFront()` before the first update, while `disabled`, while disconnected, right after `disabled` is cleared in the same task (after `updateComplete` the root carries `popover` again; happy-dom has no `:popover-open`, so the Browser tier asserts the open box), and where `showPopover` is missing, as in happy-dom (P13; D7); slot assignment of text and elements; no `data-*` or internals value written (the fake internals read back `null`); no event of any kind; C8 with no content; `packages/line-components/__tests__/manifest-paths.test.ts` on the packed tarball, as Visually Hidden's case does (`:239-260`): `line-portal` resolves to `src/portal/portal.ts`; the public-field filter at `:252-254`, which keeps own members marked `privacy: 'public'`, returns exactly `['disabled']`; a separate check finds the own member `bringToFront` with kind `method`, not `static`, no `privacy` field, and a description from its JSDoc, because the analyzer marks a method written without a modifier with no privacy and the source writes no `public` modifier (Miguel, review gate round 2, 2026-11-12); no event; slots `['']`; `cssParts` `['root']`; no `cssProperties` |
| Browser | Playwright `packages/line-components/__tests__/integration/portal/portal.e2e.ts` on chromium, firefox and webkit, over the fixture page `integration/portal/index.html` with `fixture.ts`, and `pre-upgrade.html`, which defines `window.lineLoad = () => import('./pre-upgrade.ts')` and loads the component only when the test calls it, as `integration/visually-hidden/late.html` and `late.ts` do | on the P1 trap: the content is hit at its centre above a transformed `overflow: hidden` ancestor and a `z-index` sibling (P1); inside the trap's `dir="rtl"`, `lang` and `data-accent` scopes the content matches `:dir(rtl)` and `:lang()` and resolves an inherited custom property (P2); a click on the content reaches the host and its ancestors, and a control in the slot keeps `form` and submits its value (P3); Tab from the control before the host reaches the content next, and `ariaSnapshot()` lists the content between its neighbours, with a Chromium CDP walk of the same order (P4; D13); removing and appending the host closes and shows the box again, and a child added later shows (P5); in a container with no transform, a `disabled` host's root has no `popover`, computes `display: contents` and no `position: fixed`, and a following neighbour's offset equals its offset with the same content written without the Portal, inside a flex row and inside a `<p>` (F4 (b)); clearing `disabled` shows the box again (P11); an empty host's root measures 0 × 0, and `elementFromPoint` at the logical start corner hits neither the root nor the host (C8); a host inside a modal dialog keeps its content focusable, and after `bringToFront()` the content is hit and takes a real pointer click, again after the dialog closes and reopens (P8); a Portal outside the open modal dialog, whose `::part(root)` the fixture gives an opaque background because the component reset leaves `background: none`, matches `::part(root):popover-open` after `bringToFront()`; one pixel inside its box's area, read with `page.screenshot({ clip: { x, y, width: 1, height: 1 } })` and decoded in the page with `createImageBitmap(new Blob([bytes], { type: 'image/png' }))` and `getImageData` on an `OffscreenCanvas`, with no new dependency, has the box's colour and not the backdrop's; and its content cannot take focus (hit testing skips inert content, so `elementFromPoint` returns the dialog and cannot show the order); `bringToFront()` on a `disabled` host leaves the root closed and the content in flow, on a disconnected host leaves the root closed, on a host appended in the same task, before its first update, throws nothing and the box is open after `updateComplete`, and right after `disabled` is cleared in the same task throws nothing and the box is open after `updateComplete`; nested portals, with the fixture's boxes overlapping and the outer box given a background: after `outer.bringToFront()` alone the outer box covers the inner content where the boxes overlap, after `outer.bringToFront()` then `inner.bringToFront()` the inner content is hit, and after clearing the outer `disabled`, `await outer.updateComplete` and `inner.bringToFront()` the inner content is hit; a later host paints above an earlier one (P11); `hidden` on the host and a `display: none` ancestor render nothing (P11, P12); the host adds no offset in a flex row with `gap` (P12); with no placement rule the box sits at the logical start corner in LTR and RTL (P11); the documented anchor-positioning rule puts the box's block-start edge at the trigger's block-end and its inline-start edge at the trigger's inline-start; a page scroll leaves an unanchored box at its viewport point (P11); on `pre-upgrade.html`, the documented `:not(:defined)` rule hides the content before `window.lineLoad()` runs, and the box shows after it (P6; D8) |
| A11y | axe-core, `packages/line-components/__tests__/a11y/portal.e2e.ts` | zero violations (MANIFESTO Law 3) in every story of D11, the dialog story with its dialog open and the hint raised (Phase 1 spec §7.4). It calls `readyPortalStory(page, id)` before the axe check, as `a11y/visually-hidden.e2e.ts:33` does |
| htmx | Playwright `*.e2e.ts` through the shared harness `@websublime/line-testing/htmx` (`packages/line-testing/src/htmx.ts`), on htmx 2 and htmx 4 in chromium, firefox and webkit | `n/a`. Portal is neither value-bearing, because its descriptor binding map names no value prop, nor compound, because it holds no interactive element of its own (ARCH §17.2 C3, C9). Its content stays in the host's light DOM, so swapped content is ordinary slotted DOM, which the Unit tier's slot test covers. P9 ran the harness's slot-swap check on a top-layer probe host and it passed on htmx 2 and 4 in three engines. This confirms the Phase 1 spec's "`n/a` expected" (§6.C.4 C13 row; §10 SD34, `:2381`; F8 (a)) |
| Visual | Playwright `packages/line-components/__tests__/visual/portal.visual.ts` on the `visual` project | every story of D11, with `readyPortalStory(page, id)` as the caller-supplied `ready` option of `expectStoryScreenshot` (`visual/story.ts:28`, `:41`), as `visual/visually-hidden.visual.ts:18` does, with Linux baselines from a `visual-baselines.yml` run (Phase 1 spec §6.C.6, `:1233`; §10 SD98). `expectStoryScreenshot` takes a full-page screenshot (`packages/line-components/__tests__/visual/story.ts:42`), which shows the top layer: the In a modal dialog baseline shows the raised hint above the open dialog (AM-003) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the coverage and drift tests pass with the new descriptor (§6.G.5); the built `catalog.json` holds no `Portal` key, and `LINE_COMPONENTS` stays unchanged; no provider's tools include `Portal` (`frontend-tools.test.ts:310`); `PROP_TYPES` and its doc comment, the raw-catalog list, the exposure test (`toHaveLength(13)`), the reason test and the descriptor count change as the Agent contract says; the descriptor keeps `agentExposed: false` and its reason (Phase 1 spec `:1183`; D10) |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts` | a `line` node of type `Portal` renders one inert `unknown-type` placeholder, raises one `UNKNOWN_COMPONENT_TYPE` error and creates no `line-portal` (D10) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./portal` register `line-portal` only, through its new `EXPECTED_TAGS` row, and the isolation scan finds no other component's module or tag in its bundle (Phase 1 spec §7.5; `bundle-splitting.test.ts:69`) |

- PRD §5.2 checklist mapping (`docs/PRD.md:534`; Phase 1 spec §6.C.6, `:1222`). Render, slots, the `root` part and events (none fired) run in the Unit tier; the reactive prop `disabled` runs in the Unit tier for its attribute and in the Browser tier for its rendering; custom properties have nothing to test; keyboard (Tab order) runs in the Browser tier and axe in the A11y tier.
- §6.C.6 obligations. Storybook docs, the changeset, the CEM JSDoc, the `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` row and the size report land as D12 says. No other component is imported (Bundle). The Agent contract is filled above. The htmx row is `n/a` with its reason. The surface fixture and surface axe obligations do not apply to an `agentExposed: false` row (`:1231`). No update-rate measurement, because Portal is not a machine row (`:1232`). The visual tier is the row above (`:1233`).
- Phase 1 spec `:1183`: the catalog and tools row proves that the descriptor's catalog name is not a key of `components` in the built `catalog.json`, and that the G3 emitter, run over the built descriptor set, emits no tool for it.
- The axe and visual tests run against the Storybook stories on port 4320. The layout, focus, dialog, nesting and pre-upgrade tests use the fixture pages under `packages/line-components/__tests__/integration/portal/` (`index.html` with `fixture.ts`; `pre-upgrade.html` with the lazily loaded `pre-upgrade.ts`), served by the existing port-4321 `webServer` (`playwright.config.ts:23-28`, at the repository root).
- `packages/line-components/__tests__/portal-stories.ts` exports `PORTAL_STORIES` and `readyPortalStory(page, id)`, as `visually-hidden-stories.ts` exports `VISUALLY_HIDDEN_STORIES` and `readyVisuallyHiddenStory` (`:12`, `:26`).
  - The story ids are `components-portal--escapes-a-clipping-card`, `--keeps-its-form`, `--in-a-modal-dialog` and `--disabled` (D11).
  - `readyPortalStory` waits for every `line-portal` to update and, outside the `--disabled` story, for its root to match `:popover-open`.
  - For `--in-a-modal-dialog` it then clicks the story's "Open settings" button, which calls `showModal()` and then `bringToFront()`, and asserts that the dialog is open and that the hint content is hit at its centre.
  - `__tests__/a11y/portal.e2e.ts` calls it before the axe check, because the axe tier opens stories itself and runs no `ready` hook; `__tests__/visual/portal.visual.ts` passes it as the `ready` option (`visual/story.ts:28`, `:41`).

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| F1 | How does Portal render its content outside its parent's box, and how does each way stand against MANIFESTO Law 5? | Miguel | resolved: option (c), the top layer through `popover="manual"`, with no node relocated (Miguel, 2026-11-12); PRD v0.8.33 §4.1 |
| F2 | Where does the content go, and what happens when the target is missing? | Miguel | resolved: option (a), no target (Miguel, 2026-11-12) |
| F3 | How does the content keep the theme, `dir` and `lang` of its place in the page? | Miguel | resolved: option (a), native inheritance (Miguel, 2026-11-12) |
| F4 | Does Portal have an inline mode? | Miguel | resolved: option (b), a reflected boolean `disabled` (Miguel, 2026-11-12) |
| F5 | What does Portal do and say about events from its content? | Miguel | resolved: option (a), native bubbling through the host, stated in the docs (Miguel, 2026-11-12) |
| F6 | What are the focus order and the reading order of the content? | Miguel | resolved: option (a), DOM order (Miguel, 2026-11-12) |
| F7 | How does a Portal get above a top-layer box shown after it, such as a modal dialog? | Miguel | resolved: option (b), a public `bringToFront()` method (Miguel, 2026-11-12); at review gate round 1 Miguel made it synchronous in the method, with no-ops before the first update, while `disabled` and while disconnected, and at round 2 added the no-op for a root without `popover` (F7 record) |
| F8 | Is the htmx row `n/a`? | Miguel | resolved: option (a), `n/a` confirmed (Miguel, 2026-11-12) |
| F9 | Which reason does `agentExposed: false` record? | Miguel | resolved: option (b), the top-layer reason (Miguel, 2026-11-12); Phase 1 spec §12 AM-097 |

**Orchestrator defaults** (Miguel left D1–D17 as drafted, 2026-11-12)

| # | Default | Basis |
|---|---------|-------|
| D1 | Static, with no machine and no events; neither value-bearing nor form-associated | ARCH §8, `:410`; Phase 1 spec §6.C.4 C13 row, `:1169`; R7 `:76`, `:80` (Ark UI's Portal has no machine) |
| D2 | No role, no internals value, no ARIA attribute written | R8 `:75` |
| D3 | `:host { display: contents }` and `:host([hidden]) { display: none }` | Probe P12: no flex footprint, the box stays in the top layer, `hidden` still hides |
| D4 | While it carries `popover`, the root resets the UA popover box (margin, padding, border, background, colour, overflow, size) and sits at `inset-block-start: 0; inset-inline-start: 0`, through `[part='root'][popover]`; without `popover` (`disabled`) it is `display: contents`; the consumer places the box through `::part(root):popover-open`, and the docs and the README say an unplaced box covers the page at that corner | Probe P11: UA centring, border and padding; reset box at the logical start corner in LTR and RTL. Probe P9: an unplaced box took a button's clicks. MANIFESTO Principle 1 (zero visual opinion) |
| D5 | `commonReset` is the only reset module | ARCH §14.7, `:1163` |
| D6 | No focus on the host, no key handling, no `delegatesFocus`, no `tabindex` | R8 `:75` Keyboard "None" |
| D7 | `showPopover()` and `hidePopover()` run only where they are functions, while the host is connected, not `disabled`, the root carries `popover`, and the root's open state needs the change, in `updated()` and in `bringToFront()`; nothing throws without the Popover API, and there is no in-browser fallback | Probe P13: happy-dom has no `showPopover`; the existing guard `this.#panel()?.hidePopover?.()` in AvatarGroup's `updated()` (`packages/line-components/src/avatar-group/avatar-group.ts:471`); PRD browser support "Chrome, Firefox, Safari — latest 2 stable versions" (`docs/PRD.md:160`), whose current engines all have the Popover API (P11), so only non-browser DOMs such as happy-dom lack it; MANIFESTO Law 9 |
| D8 | Pre-upgrade content is the consumer's: the docs and the class JSDoc give `line-portal:not(:defined) { display: none; }` | Probe P6; `0012-visually-hidden.md` F3 (a), the documented consumer rule Miguel chose for the same case |
| D9 | Catalog name `Portal`; prop schema `children` (`ChildList`) with slot map `children` → `''`; no `disabled` in the schema; `hostNaming: never`; no `requiredName`; no tool description; `agentExposed: false` with the F9 reason | PRD row name; §6.G.1 "Every component MUST keep a descriptor" (`:1329`); Stack's `children` pattern (`packages/line-genui/src/catalog/descriptors/stack.ts`); `0012-visually-hidden.md` D8 |
| D10 | The genui tests change as the Agent contract and Tests rows say, and C13 adds no surface fixture or surface axe entry | Phase 1 spec `:1183`, `:1231`; `catalog.test.ts:40-43`, `:45-92`, `:111`, `:496-501`, `:537`; `frontend-tools.test.ts:310`, `:356` |
| D11 | `apps/storybook/stories/components/portal.stories.ts` with `title: 'Components/Primitives Base/Portal'`, the pinned meta `id: 'components-portal'`, from which the story ids come, not from the title (AM-004), and `tags: ['autodocs']`, whose `DESCRIPTION` carries the D8 rule, the D4 placement advice and the D14 `bringToFront()` points. The meta sets `parameters: { docs: { story: { inline: false, height: '320px' } } }`, so the docs page renders each story in its own iframe of fixed height and no box paints over the docs page or another story. Each story places its box next to its own trigger with a story-unique anchor name on `::part(root):popover-open`. Stories: Escapes a clipping card (the first markup example, under its Options trigger), Keeps its form (the second, next to its Save button), In a modal dialog (the third: an "Open settings" button whose click calls `showModal()` and then `bringToFront()`, with the hint next to its label), Disabled (in place inside a sentence). Story ids `components-portal--escapes-a-clipping-card`, `--keeps-its-form`, `--in-a-modal-dialog`, `--disabled` | `0012-visually-hidden.md` D11 pattern; `avatar-group.stories.ts:70-71`; Storybook addon-docs 10.6.2 `story.inline` and `story.height` (`node_modules/@storybook/addon-docs/dist/blocks.d.ts:283-284`) |
| D12 | The C13 PR also adds a Portal row to `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` §4.1, writes the Storybook docs, adds a `## Portal` section to `packages/line-components/README.md` after `## Visually Hidden` (`:402`) that carries the D14 points, adds `portalDescriptor` to the export table of `packages/line-genui/README.md:39`, reports the gzipped size against the < 5 KB soft target, and adds one changeset covering `line-components` and `line-genui` | Phase 1 spec §6.C.6, `:1223-1227`; §7.6; PROCESS §6 |
| D13 | The Browser tier proves order with `ariaSnapshot()` in three engines and a Chromium CDP walk, and runs no `INTERNALS` read-back | Phase 1 spec `:1180` applies to internals roles, and Portal sets none (D2); probe P4 |
| D14 | The class JSDoc says what the component is for, that the content stays in place for focus, reading order, events and forms, that the consumer places `::part(root):popover-open` (with the anchor example), the pre-upgrade rule, and `disabled`. It says to call `bringToFront()` after every `showModal()`, that the call is synchronous and does nothing before the first update, while the root has no `popover` (an update that clears `disabled` is pending), while `disabled` or while disconnected, that a Portal outside the open modal paints above its backdrop with inert content, and that nested portals are raised outer first, then inner, after `await outer.updateComplete` when the outer `disabled` was just cleared. It says not to put `aria-label` on the host. `bringToFront()` carries its own JSDoc and no `public` modifier (C7) | probes P1–P4, P6, P8, P11; `0012-visually-hidden.md` D14 |
| D15 | The component observes no mutation and moves no node; it adds no `MutationObserver` | F1 (c); probes P5, P7 (what a move needs) |
| D16 | No CSS custom properties and no variants | No visual surface; ARCH §17.2 C6 |
| D17 | The docs name Firefox and WebKit accessibility-tree exposure and screen-reader speech of top-layer content as unverified | Phase 1 spec `:1180`; §12 AM-058; What automation cannot observe |

Miguel decided F1–F9 on 2026-11-12, each on the option the draft recommended, and left D1–D17 as drafted. The option tables below stay as the record of what he weighed.

### F1 — Mechanism, and MANIFESTO Law 5

**Evidence.** Law 5 reads "State machines own logic. Lit owns DOM. CSS owns visuals. … no DOM mutation outside Lit's reactive cycle" (`docs/MANIFESTO.md:47`). Phase 1 spec §6.G.4 scopes the "Lit owns DOM" clause to `line-components` components, and adds that no code other than the surface's reconciler mutates the surface's DOM (`:1469`; AM-002). P1 shows that a move (M1, M2) and the top layer (M3) escape clipping, a transform and a stacking context, and that `position: fixed` on the host (M4) escapes none of them under a transformed ancestor. P5 and P7 show what a move costs under Law 5. M1 is DOM calls end to end. M2 lets Lit insert the nodes, yet it needs one container per host in the target, because Lit owns everything from its marker to the end of the container and a shared target lost another host's node and a foreign node. It also needs a DOM call to return the nodes on disconnect, because `render(nothing)` detaches them. P2–P4, P8, P9 and P10 show what any move loses. M3 keeps the shadow tree as Lit's template and calls `showPopover()`, which changes the box's top-layer state and adds or moves no node. R8 assumes a relocation (`:75`), as did the Phase 1 spec reason row (`:1336`) and C13 row (`:1169`) before AM-097, and the PRD §4.1 row before v0.8.33, whose wording the top layer met as rendering, not as DOM placement. Ark UI's Portal is React `createPortal` into a `container` ref, else the environment root node when it is a shadow root, else `document.body`, and a `disabled` flag renders in place (R7 `:80`; `chakra-ui/ark` `packages/react/src/components/portal/portal.tsx` on `main`, 2026-11-12). React keeps events and context on its own component tree, which a DOM move does not replicate (P2, P3) [INFERENCE: the React half is neither probed nor cited].

| Option | What it decides | Law 5 | Consequence |
|---|---|---|---|
| (a) Imperative move | the host appends a wrapper to the target and moves its child nodes into it in `connectedCallback`, through a `MutationObserver` for later children, and back in `disconnectedCallback` (M1) | violates: every move is a DOM call outside Lit's render | Escapes (P1). Loses context, events, form ownership, DOM order and modal usability (P2–P4, P8); breaks the htmx harness, swapped `hx-*` content and form posts (P9); leaves the surface's `aria-busy`, live region and focus rule (P10) |
| (b) Lit `render()` into the target | `updated()` renders the child nodes into a per-host container through Lit (M2) | violates in part: Lit moves the nodes, but the per-host container's insertion and the nodes' return on disconnect are DOM calls outside Lit's render (P5, P7) | As (a), and every child custom element connects, disconnects and connects again on the first move (P4); htmx 2 misses swapped `hx-*` content (P9) |
| (c) **Recommended.** Top layer, no move | the shadow root holds `<div part="root" popover="manual"><slot>` and `updated()` shows it (M3) | complies: the DOM is Lit's template; `showPopover()` changes top-layer state and adds or moves no node | Escapes (P1) and keeps context, events, the form, DOM order and htmx paths (P2–P4, P9), and the content stays in the host, so in the surface [INFERENCE: the surface was not probed with a top-layer host]. Nothing moves, so content cannot go to another container (F2). Top-layer boxes stack by show order, so a box shown before a modal dialog sits under it (P8; F7). The PRD wording holds as "renders outside" (superseded: PRD v0.8.33 revised the row), and the Phase 1 spec reason row changes (F9) |
| (d) `position: fixed` on the host | `:host { position: fixed }` over a slot (M4) | complies | Does not escape a transformed ancestor or its `overflow` (P1); not a portal |
| (e) (c) by default, (b) with a `target` | the top layer unless the consumer names a target, then a Lit move | violates in part when a target is set, as (b) | Two behaviours under one tag, with every (b) cost on the target path |

The recommendation rests on Law 5, which outranks the PRD, R8 and the Phase 1 spec (PROCESS §1), and on P2–P4 and P8–P10. Option (c) changed the Phase 1 spec's reading of Portal, so the decision landed as PRD v0.8.33 and Phase 1 spec AM-097.

### F2 — Target

**Evidence.** Under F1 (c) nothing moves, so there is no target. For a move, P7 shows that a selector cannot reach an outlet inside a shadow root and an element reference can, that moved content takes the styles of the tree it lands in, and that the probe hosts' handling of a missing target was their own choice. Ark UI defaults to the environment's root node when it is a shadow root, else `document.body` (`portal.tsx` `getPortalNode`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** No target | the content stays in the host and paints in the top layer (F1 (c)) | Nothing to resolve or to miss. A "render into the sidebar" use is out of scope (Anti-patterns) |
| (b) Body default, attribute and property | `document.body` by default; a `target` attribute read with `document.querySelector`; a `targetElement` property for an element reference, such as one inside a shadow root; a missing target renders the content in place | Covers outlets in shadow roots (P7). Every F1 (a)/(b) cost applies |
| (c) Property only | an element reference; no attribute | Cannot be set from markup or htmx; C1 still holds through the property |
| (d) Root-node default | as Ark: the root node when it is a shadow root, else `document.body` | Content placed in a component's shadow root takes that root's styles (P7) |

### F3 — Inherited context

**Evidence.** P2: top-layer content keeps `--line-probe`, the `data-accent` scope, `:dir(rtl)` and `:lang(pt)`. Moved content loses all four. A wrapper that copies `dir`, `lang` and `data-accent` restores three of them and not a custom property from an inline style or a class. `line-themes` scopes themes on `[data-accent]`, `[data-gray]` and `html` (`packages/line-themes/src/aliases.css:7`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Native inheritance | nothing to copy; the content inherits through the flat tree (F1 (c)) | Every inherited value holds (P2) |
| (b) Copying wrapper | under a move, a Lit-rendered wrapper copies `dir`, `lang`, `data-accent` and `data-gray` from the host's nearest ancestors | Theme, direction and language hold; custom properties from classes or inline styles do not (P2). The wrapper must track ancestor changes [INFERENCE: not probed] |
| (c) Nothing | under a move, the content inherits from its target | The consumer themes the target (P2) |

### F4 — Inline mode

**Evidence.** P11: removing the `popover` attribute closes the box and the content renders as an ordinary box, under probe CSS that kept the root `position: fixed`, so in-flow placement needs the scoped rules of Anatomy. Ark UI's Portal has `disabled`, which renders the children in place (`portal.tsx`). A disabled host still keeps its content in place in the DOM, so nothing else changes.

| Option | What it decides | Consequence |
|---|---|---|
| (a) None | the content is always in the top layer | One behaviour. A consumer who needs the content inline at some widths swaps markup |
| (b) **Recommended.** `disabled` | a reflected boolean; while set, the template omits `popover`, so the content renders in place | Matches Ark's name. One prop outside the descriptor schema (D9) |
| (c) `inline` | the same boolean under the name `inline` | Reads as what it does; departs from Ark's name |

### F5 — Events

**Evidence.** P3: in the top layer a click on the content reaches the host, its ancestors and `document`, through the slot. After a move it reaches `document` only. A re-dispatched copy of an event would fire twice at `document` and would not carry `preventDefault()` back to the original [INFERENCE: not probed].

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Native bubbling, documented | nothing to forward (F1 (c)); the docs say events bubble through the host | Delegated listeners on ancestors work (P3) |
| (b) Documented loss | under a move, the docs say events do not reach the host; listen on the content or `document` | Delegated listeners on ancestors break (P3) |
| (c) Re-dispatch | under a move, the host re-dispatches events of its content | Duplicates at `document`; an open list of event types; logic in the component that Law 5 gives to machines |

### F6 — Focus and reading order

**Evidence.** P4: in the top layer, Tab from `Before` reaches the content next and the Chromium tree lists it between its neighbours. After a move, Tab reaches `After` first and the tree lists the content at the end of the page. R8 names WCAG 1.3.2 and 2.4.3 for a move (`:75`). P8: content moved out of a modal dialog is inert.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** DOM order | the content keeps its DOM position (F1 (c)) | Order follows the markup; the docs ask the consumer to keep the Portal next to its trigger |
| (b) Documented jump | under a move, the docs say focus and reading order follow the target | The consumer manages focus; content moved out of a modal dialog is unusable (P8) |
| (c) Managed focus | under a move, the host adds focus sentinels that redirect Tab into and out of the moved content | Key handling and focus state, which Law 5 gives to a machine; the row leaves the Static tier |

### F7 — Top-layer order

**Evidence.** P8: a box shown before `showModal()` paints under the dialog's backdrop while its content stays focusable, and `hidePopover()` plus `showPopover()` puts it on top, where a real click reaches it. P11: a box shown later paints above an earlier one. The component has no event for "another box was shown" [INFERENCE: `toggle` events fire on popovers and, in recent engines, dialogs; listening document-wide was not probed].

| Option | What it decides | Consequence |
|---|---|---|
| (a) Connect order only | the box is shown on connect and after a reconnect | A Portal in a dialog's static markup sits under the dialog when it opens; the consumer must reconnect it |
| (b) **Recommended.** `bringToFront()` | a public method that hides and shows the root | The consumer calls it after `showModal()` (Markup examples). One method outside the descriptor |
| (c) Automatic | the host listens document-wide for `toggle` events and shows itself again | No consumer step; a global listener and ordering logic in a Static component, and a Portal could jump above a dialog it does not belong to |

**Review gate round 1 (Miguel, 2026-11-12).** `bringToFront()` acts synchronously in the method. It calls `hidePopover()` only when the root matches `:popover-open`, then `showPopover()`. It does nothing when no root is rendered yet, because the pending first update shows the box, when the host is `disabled`, or when it is disconnected. At review gate round 2 (Miguel, 2026-11-12) it also does nothing when the root has no `popover` attribute, because an update that clears `disabled` is pending and shows the box; a consumer who cleared `disabled` on an outer Portal awaits `outer.updateComplete` before raising an inner one. MANIFESTO Law 5 holds, because the call changes top-layer state and adds or moves no node. The consumer calls it after every `showModal()`; on a Portal outside the open modal dialog the box paints above the backdrop but its content stays inert. Props and D14 state this.

### F8 — htmx row

**Evidence.** P9: on htmx 2 and 4 in three engines, the harness slot-swap check passes for a top-layer host and fails for both moving hosts, a swapped `hx-get` button inside a top-layer host sends its request, and a form posts the value of a field inside it. Template rule: a component that is neither value-bearing nor compound marks the row `n/a` (`docs/specs/COMPONENT-SPEC-TEMPLATE.md:218`). Phase 1 spec SD34 expects `n/a` (`:2381`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `n/a`, confirmed | the row is `n/a` with the reason in Tests | Matches SD34 and the template; P9 backs it under F1 (c) |
| (b) Harness run | the row runs `expectSlotSwap` and a Portal-local form test | Needed under F1 (a) or (b), where P9 shows the harness failing; the spec would record that failure as a limit |

### F9 — The `agentExposed: false` reason

**Evidence.** Before AM-097, Phase 1 spec `:1336` gave a relocation reason, that nodes leaving the surface escape its `instanceId` reconciliation, focus rule, live region and `aria-busy`, marked `[INFERENCE on the escape]`, and `:1169` marked the reconciliation part `[INFERENCE: not in R8]`. P10 backs the escape from `aria-busy`, the live region and the focus rule, adds that the node outlives `deleteSurface`, and refutes the reconciliation part: the projection keeps updating the node and the reconciler pulls it back. Under F1 (c) the content stays in the host's light DOM (P3), so nothing leaves the surface and that reason does not describe the component [INFERENCE: the surface was not probed with a top-layer host]. P1 shows a top-layer box painting above a sibling outside its container, and P9 shows it taking another button's clicks.

| Option | What it decides | Consequence |
|---|---|---|
| (a) Keep the move reason, corrected | under F1 (a) or (b): a factual AM row lifts the inference with P10 and corrects the reconciliation clause | A factual AM row citing P10 |
| (b) **Recommended.** Top-layer reason | under F1 (c): `agentHiddenReason` "It paints its content above the whole page, outside the surface, so an untrusted agent could cover the host's own UI.", through a Phase 1 spec AM row with trigger `decision` that replaces the reason row and the C13 row cell | Landed as Phase 1 spec AM-097. SD38 and ARCH §17.9 stay as they are, because Portal stays `false` |
| (c) Expose Portal | under F1 (c), `agentExposed: true` | Agent content could cover host UI (P1, P9); SD38 and ARCH §17.9 change |

Phase 1 spec AM-097 landed option (b) on 2026-11-12, in the PRD v0.8.33 commit. It rewrote the C13 row's `agentExposed` and "still settles" cells (`:1169`) and the Portal reason row (`:1336`), citing probes P1 and P9.

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
| AM-001 | 2026-11-12 | ledger 01-C13 (factual correction, approval) | The Status field (`:5`) reads `` `approved` (Miguel, 2026-11-12) `` and the header paragraph (`:15`) says that the spec passed its review gate and that Miguel approved it on 2026-11-12, in place of saying that it stays `proposed` | Miguel approved the spec after review gate round 3, and the header still described the draft state | `docs/context/01-c13.md`, "Review gate (docs), round 3, 2026-11-12": "Miguel approved `0013-portal.md` on 2026-11-12." |
| AM-002 | 2026-11-12 | ledger 01-C13 (factual correction — the C13 Browser tier passed with the shipped `<line-portal>`, as Tests requires) | Lifts seven `[INFERENCE]` marks that the Browser tier now backs and cites this AM in their place: the anchored use case (`:284`), the `disabled` in-flow result (`:365`), `:popover-open` through `::part()` (`:379`), the Portal outside the open modal dialog (`:400`), nested portals (`:401`), the anchored example (`:440`) and C8, the empty host (`:478`). The surface marks (`:258`, `:306`, `:518`) and the Visual row mark (`:590`) stay; AM-003 settles `:590` | Each mark named the Browser tier as the check that would settle it | `packages/line-components/__tests__/integration/portal/portal.e2e.ts` on 2026-11-12, on this branch, in chromium, firefox and webkit with `--repeat-each 2`: 158 passed and 4 skipped, the skips being the Chromium CDP test outside chromium. The cases: the documented anchor rule puts the root's block-start edge at the trigger's block-end and its inline-start edge at the trigger's inline-start within 1 px; a `disabled` host's root has no `popover`, computes `display: contents` and no `position: fixed`, and a following neighbour's offset equals its offset without the Portal in a flex row and in a `<p>`; every fixture placement rule targets `#id::part(root):popover-open`, and the outside-modal pixel reads the colour that rule sets; after `showModal()` and `bringToFront()` the outside Portal's root matches `:popover-open`, a 1 × 1 screenshot clip inside it decodes to `rgb(0, 128, 0)`, the box colour, not the `rgb(255, 0, 0)` backdrop, and its button takes no focus; with overlapping nested boxes, `outer.bringToFront()` alone makes `elementFromPoint` at the inner content return the outer host, outer then inner returns the inner content, and so does clearing the outer `disabled`, `await outer.updateComplete` and `inner.bringToFront()`; an empty host's root measures 0 × 0 and `elementFromPoint(0, 0)` returns neither the root nor the host |
| AM-003 | 2026-11-12 | ledger 01-C13 (factual correction — the Portal visual baselines exist) | Lifts the `[INFERENCE]` mark of the Visual row (`:590`), that a full-page screenshot shows the top layer, and cites this AM | The mark named the screenshots the probes did not take | `visual-baselines.yml` run 43251383915 on this branch wrote `components-portal--in-a-modal-dialog-visual-linux.png`, which shows the hint "Changes apply on save." painted over the open dialog's box, beside the "Theme" label, and `components-portal--escapes-a-clipping-card-visual-linux.png`, which shows the menu running past the bottom edge of the card that clips it; both are committed with the Visual tier |
| AM-004 | 2026-11-13 | ledger 01-Z9 (factual correction — Miguel, 2026-11-13: components stories grouped by PRD §4 category, `docs/context/01-z9.md`) | D11 (`:635`): the title is `Components/Primitives Base/Portal` and the meta pins `id: 'components-portal'`, from which the story ids come, not from the title. Locator: `avatar-group.stories.ts:70-71` (was `:70`). The story ids are unchanged | D11 named the old two-segment title; 01-Z9 moved the title under the PRD §4.1 category and pinned the id, which added one meta line | Commit `0f77015` (`chore(storybook): group components stories by PRD §4 category`); `storybook-static/index.json` built from this branch and from `main` at `4441f25` lists the same 159 entry ids (136 stories, 23 docs); `apps/storybook/__tests__/story-titles.test.ts` |
