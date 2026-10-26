# `LineHtmxElement` — htmx spike (00-H1)

This folder is experimental. It is excluded from the build and from `exports`, and nothing in it ships (spec D6,
[`pack-and-build.txt`](../../../../docs/retrospective/assets/00-h1/pack-and-build.txt)). The spike validates the
three Manifesto Law 7 dimensions (`hx-*` forwarding, server-driven state, swap-aware lifecycle) against htmx 2.0.11
and htmx 4.0.0 (spec §6.H.1, AM-059, AM-060). The
[Phase 00 retrospective](../../../../docs/retrospective/00-phase-00-retro.md) carries the same findings and the
outcome (spec §6.H.2).

## Outcome

Miguel chose the **exploratory** exit on 2026-10-12. `LineHtmxElement` is deferred as a nice-to-have after 1.0, and
this folder stays here as an unbuilt reference. Ledger row `00-Z17` guards the native htmx paths instead, with htmx 4
as its design target and checks on htmx 2 and 4. The
[retrospective's Outcome](../../../../docs/retrospective/00-phase-00-retro.md#outcome) gives the reasons.

## Files

| File | Role |
|---|---|
| `line-htmx-element.ts` | `HtmxElement` mixin over `LineElement` |
| `example/line-htmx-counter.ts` | `<line-htmx-counter>`, the worked example, built as `FormAssociated(HtmxElement(LineElement))` |
| `example/server.ts` | `Bun.serve` that keeps the state, answers with HTML fragments and picks the htmx major per page load |
| `example/index.html` | The consumer page |

## Run the example

```sh
bun install
bun packages/line-core/__experimental__/htmx/example/server.ts
```

- `http://127.0.0.1:4330/?htmx=2` loads htmx 2.0.11, and `http://127.0.0.1:4330/?htmx=4` loads htmx 4.0.0.
- The server binds 127.0.0.1 only, because its POST routes change the server state.
- `PORT=4400 bun …` picks another port.
- The server bundles the counter with `Bun.build` at start-up and serves htmx from the aliased `line-core`
  devDependencies `htmx2` and `htmx4`.
- The count lives in the server process, so a restart resets it. All counters on the page share it.
- Each state fragment echoes what the server received (method, path, form fields, `X-Line-Consumer`).

The package `tsconfig.json` covers `src/` only, and the repo has no Bun types, so the spike was type-checked once
with a throwaway config outside the repo and `@types/bun@1.3.14` installed under `/tmp/h1spike/types`:

```jsonc
// /tmp/h1spike/tsconfig.spike.json
{
  "extends": "<repo>/tsconfig.base.json",
  "compilerOptions": { "noEmit": true, "typeRoots": ["/tmp/h1spike/types/node_modules/@types"], "types": ["bun"] },
  "include": ["<repo>/packages/line-core/__experimental__/htmx/**/*.ts"]
}
```

`bunx tsc -p /tmp/h1spike/tsconfig.spike.json` exits 0. `bun run lint` covers the folder through Biome.

## The mixin

- `updated()` calls `htmx.process(this.shadowRoot)` after every render. `connectedCallback` is too early, because
  Lit only schedules the first render there (AM-059).
- One settle handler per instance listens for `htmx:afterSettle` (htmx 2) and `htmx:after:settle` (htmx 4). It is
  added on connect and removed on disconnect, re-processes the shadow root and then calls the optional
  `htmxSettledCallback(event)` hook.
- The host's `hx-headers` is copied onto the shadow element marked `data-line-htmx-forward`. The copy is named
  `hx-headers` under htmx 2 and `hx-headers:inherited` under htmx 4, so the mixin reads the major from
  `htmx.version`. A `MutationObserver` keeps the copy in sync with later host changes.
- htmx is the page's global, typed through the local `HtmxApi` interface and the `isHtmx` guard.

## What the page exercises

| Section | Element | What it exercises |
|---|---|---|
| 1 | `#counter` inside the htmx form `#page-form` | Swaps into the shadow root, the host and the page; two Lit-only controls (switch the bound `hx-post`, insert a reset button); the settle hook; the form value; three reconnects |
| 2 | `#configured` | Host `hx-headers` (forwarded), host `hx-vals` and `hx-vals:inherited` (left to inheritance), a slotted light-DOM `hx-post` button |
| 2 | `#native` | Host-level `hx-get="/host"` with the default `click` trigger |
| 3 | `#baseline` | A plain element whose open shadow root nothing processes |
| 4 | `#from-server` | A `<line-htmx-counter operation="dec" resettable>` that the server renders and htmx swaps in |
| — | Event log | Every htmx request and swap event that reaches a counter host, with `composedPath()[0]` and `composed` |

## How the evidence was captured

A throwaway Playwright 1.60.0 script, deleted after the run, drove the committed example on 2026-10-12. It started
one fresh server per run and ran Chromium 148, Firefox 150 and WebKit 26.4, each against htmx 2.0.11 and 4.0.0. Each
run made 16 checks on the page and 4 probes on fresh pages. Each check is named after the observation it expects,
and all 120 matched. The evidence lives in
[`docs/retrospective/assets/00-h1/`](../../../../docs/retrospective/assets/00-h1/):

- [`results.json`](../../../../docs/retrospective/assets/00-h1/results.json) has every check and probe per run, with
  the observed detail.
- `<browser>-htmx<major>-before.png` and `-after.png` show the page after load and after the checks.
- `<browser>-htmx<major>-network.json` logs every app request with its `hx-*` headers, `X-Line-Consumer` and body.
- `<browser>-htmx<major>-console.json` logs the event log lines and the settle hook lines.

The probes change the page on purpose. One delays `/value` by 1 s and re-renders `#counter` three times during the
request. One swaps a fragment into the Lit-bound submit label with `htmx.ajax`. The last two share a page that wraps
`htmx.process` so it ignores shadow roots, which turns off the mixin's processing and leaves htmx's own.

## Findings

Both majors behave the same in all three engines unless a cell says otherwise. The last column names the entry in
`results.json`.

### `hx-*` forwarding

| Question | htmx 2.0.11 | htmx 4.0.0 | Check |
|---|---|---|---|
| Does htmx act on `hx-*` on the host? | Yes. A click on the host sends `GET /host`. | Yes. | `hostNative` |
| What else fires? | A click on an internal button also sends `GET /host`, because `click` is composed and retargets to the host. | Same. | `hostNative` |
| Does host config inherit into the shadow root? | No. Host `hx-vals` does not reach the internal form, whose body is `step=1`. | No. Host `hx-vals:inherited` does not reach it either. | `forwarding` |
| Is forwarding needed, and does it work? | Needed for any consumer config. The copied `hx-headers` puts `X-Line-Consumer: page` on the internal request. | Same, but the copy must carry `:inherited`, so forwarding depends on the major. | `forwarding` |
| Do slotted light-DOM `hx-*` work? | Yes, without the mixin. The button inherits host `hx-vals` and `hx-headers` (`consumer=page`, header `page`). | Yes. It inherits only `hx-vals:inherited` (`consumer=page`, no header). | `slottedLightDom` |

Inheritance stops at the shadow root in both majors. htmx 2 walks from the shadow root to `null`
(`packages/line-core/node_modules/htmx2/dist/htmx.esm.js:425-429`), and htmx 4 calls `closest()` on the parent node,
which a shadow root lacks (`packages/line-core/node_modules/htmx4/dist/htmx.esm.js:299,308`).

### Server-driven state

| Case | htmx 2.0.11 | htmx 4.0.0 | Check |
|---|---|---|---|
| Swap into the shadow root (`hx-target="#readout"`) | `POST /inc` with `step=2` puts `2` in the shadow readout. | Same. | `shadowSwap` |
| Swap into the host (`hx-target="host"`) | The fragment lands in the host's light DOM, and its `slot="summary"` span is assigned to the shadow slot. | Same. | `hostSwap` |
| Swap into the page (`hx-target="global #counter-log"`) | The item is appended. The host sees the request events but 0 settle events, so `htmxSettledCallback` does not run. | Same. | `globalSwap` |
| Controls the server sends into the shadow root | The `Undo` button in the readout fragment works. | Same. | `swappedContentLive` |
| A `<line-*>` element the server renders | The swapped-in counter upgrades, loads its readout, and honours `operation="dec"` and `resettable`. | Same. | `serverRendered` |
| Form-shaped value | The settle hook sets the server count as the form value, and the page's htmx form posts `count=-7`. | Same. | `formValue` |
| Swap into a Lit-bound node | The swap ejects Lit's part markers. The next render throws "This `ChildPart` has no `parentNode`" and the label stays stale. | Same. | `litBoundSwapBreaksPart` |

### Swap-aware lifecycle

| Case | htmx 2.0.11 | htmx 4.0.0 | Check |
|---|---|---|---|
| Shadow root nobody processes | Inert, 0 requests. | Same. | `baselineInert` |
| First render | `updated()` processing makes the internals live, and each counter sends one `GET /value` on load. | Same. | `initialLoad`, AM-059 |
| A re-render changes a bound `hx-post` | Works (`POST /dec`). htmx 2 captures the path when it wires the element (`packages/line-core/node_modules/htmx2/dist/htmx.esm.js:2723-2744`), so the re-processing in `updated()` picks up the change. | Works. htmx 4 reads the verb attribute when the event fires (`packages/line-core/node_modules/htmx4/dist/htmx.esm.js:328-346`). | `litBoundAttribute` |
| A re-render inserts an `hx-*` element | Works through `updated()`. With the mixin's processing off, the inserted Reset sends nothing. | Same. | `litInsertedElement`, `updatedNeededForLitInserted` |
| Re-processing after a swap | Not needed. With the mixin's processing off, the server-sent Undo still works, because htmx processes swapped content itself. | Same. htmx 4 processes it right after `htmx:after:settle` (`packages/line-core/node_modules/htmx4/dist/htmx.esm.js:1484`). | `settleNotNeededForSwappedContent` |
| Swapped and slotted content across re-renders | Both survive two Lit re-renders. | Same. | `survivesRerender` |
| htmx events on host listeners | `htmx:beforeRequest`, `htmx:afterRequest`, `htmx:afterSwap`, `htmx:afterSettle`, all `composed: true`. | `htmx:before:request`, `htmx:after:request`, `htmx:after:swap`, `htmx:after:settle`, all `composed: true`. | `composedEvents` |
| Three reconnects, then one click | One request, one hook call. | Same. | `reconnect` |
| Three re-renders during the `load` request | No duplicate (3 `GET /value` for 3 counters). htmx 2 fires `load` only before `firstInitCompleted` (`packages/line-core/node_modules/htmx2/dist/htmx.esm.js:2782`). | No duplicate. htmx 4 skips elements it has initialised (`packages/line-core/node_modules/htmx4/dist/htmx.esm.js:984`). | `inFlightRerender` |

## Blockers

The spike found no blocker in the exercised scope. Every check matched on both majors in all three engines. A
committed adapter would still have to own these constraints:

- A swap target inside a shadow root must hold no Lit binding (`litBoundSwapBreaksPart`).
- Host-level `hx-*` with the default `click` trigger fires for every click inside the shadow root (`hostNative`).
- The settle hook misses swaps into `global` targets (`globalSwap`).
- Forwarding depends on the htmx major, and the spike forwards one attribute (`forwarding`).

## Not tested

- Forwarding selector-valued attributes (`hx-target`, `hx-indicator`, `hx-include`). They would resolve inside the
  shadow root unless rewritten to `global …`.
- htmx loaded as an ES module. The mixin reads `globalThis.htmx`.
- A host attribute changed after the first render. The checks forward `hx-headers` as the page sets it at load.
- A changed `hx-trigger` under htmx 4. From the source, `process()` skips initialised elements unless `force` is
  passed (`packages/line-core/node_modules/htmx4/dist/htmx.esm.js:920-944, 984`).
- Out-of-band swaps and htmx 4 `<hx-partial>` aimed at shadow content, htmx extensions, closed shadow roots,
  declarative shadow DOM, and the cost of processing a large shadow tree after every render.

## Recommendation

The recommendation is **exploratory**. The spec's §6.H.2 pairs the committed exit with an example that runs end to
end, and the exploratory exit with blockers. This example ran end to end on both majors with no blocker, so the
facts allow committed. The reasons below are about scope, and Miguel decides.

1. The paths a headless primitive offers htmx already work without the adapter, on both majors and in all three
   engines. Host-level `hx-*` works (`hostNative`), slotted light-DOM `hx-*` works with normal inheritance
   (`slottedLightDom`), a form-associated value reaches an htmx form request through `FormData` (`formValue`), and
   htmx events reach host listeners (`composedEvents`). The mixin processes only the shadow root, so none of these
   paths goes through it. The adapter matters only for a component that renders `hx-*` inside its own shadow root,
   and none of the 20 Phase 1 components (PRD §7.3) or the 15 Phase 2 form controls (PRD §7.4) does that.
2. Rendering `hx-*` inside a shadow root brings rules a spec would have to settle first. A swap into a Lit-bound
   node breaks the template (`litBoundSwapBreaksPart`), a host click trigger fires on every internal click
   (`hostNative`), the settle hook misses `global` swaps (`globalSwap`), and forwarding branches on the htmx major
   with no answer yet for selector-valued attributes (`forwarding`).
3. htmx is between majors. 4.0.0 stays on npm `next` until early 2027, with new event names and explicit
   inheritance, and the mixin already listens for two settle events and writes two forwarding forms
   (`composedEvents`, `forwarding`). A Phase 1 public API would ship before `latest` moves.

Picking the adapter up later is cheap. The mixin is 125 lines, and the capture ran all 120 checks across both majors
and three engines in under two minutes.
