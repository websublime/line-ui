# Research: Generative UI Support (agent-driven UI)

**Row:** `00-Z10` (off-plan, stream Z)
**Date:** 2026-10-06
**Repo sources:** `docs/MANIFESTO.md`, `docs/PRD.md` (v0.8.5), `docs/ARCHITECTURE.md` (v0.8.0), `packages/line-core/src/**`, `packages/line-themes/src/aliases.css`, `custom-elements-manifest.config.mjs`, `scripts/lint-layers.mjs`
**Status:** Evidence plus a proposed architecture. Research carries no rules (`docs/PROCESS.md` §1). Adopting any part of §4 is a `decision` that lands in the PRD revision log first.

> **TL;DR**
>
> - Generative UI now splits into three tiers. In the *controlled* tier the app maps an agent's tool call to one
>   of its own components. In the *declarative* tier the agent streams a JSON component tree drawn from a
>   catalog the client owns (A2UI). In the *open-ended* tier a server ships a whole HTML app into a sandboxed
>   iframe (MCP Apps).
> - The declarative tier is the headless thesis applied to agents. A2UI says the agent describes *what* and the
>   renderer decides *how*. Its v0.9 renamed the "Standard" catalog to "Basic" because teams already own a
>   design system, and v1.0 removes agent theming. line://ui fits this tier. Nine of the ten Manifesto laws hold
>   without amendment, Law 8 (progressive enhancement) holds only partially, and Principle 5 needs explicit
>   wording (§3.2).
> - No web-components design system ships a runtime generative-UI catalog today. A headless catalog generated
>   from Zod descriptors and checked against the CEM would be the first.
> - The proposal keeps components protocol-unaware. One opt-in package, `@websublime/line-genui`, holds
>   a protocol-neutral catalog, an A2UI catalog emitter, and a light-DOM `<line-a2ui-surface>` renderer built on
>   `@a2ui/web_core`. A CSS-only MCP Apps theming bridge lands in `line-themes`. Transports (AG-UI, A2A, MCP)
>   stay with the app.
> - The agent-ready contract (§4.3) is time-critical but needs no runtime. Phase 1 component specs should adopt it
>   before they are written, because retrofitting 131 components later costs far more.
> - A2UI is still an "early stage public preview". v0.9.1 is the production release, the v1.0 release candidate
>   took a breaking change on 2026-10-02, and upstream targets stability for Q4 2026. Target v0.9.1 behind a
>   version seam and spike before committing.

---

## 1. Question

Miguel asked (2026-10-06) how far a headless, web-components-native library can support agent-driven generative
UI, whether it can implement the protocols, and how it keeps its headless, standards-first line while doing so.

Scope is runtime UI that an agent produces for an end user. Dev-time AI (coding agents writing line://ui code)
appears only in §4.9, because it is nearly free.

## 2. Landscape (2026-10-06)

### 2.1 Three tiers

| Tier | Who authors the UI | Wire | Styling owner | Examples |
|---|---|---|---|---|
| Controlled | App developer; the agent picks a component and fills its props through a tool call | Tool-call arguments (JSON Schema) | Host app | AG-UI frontend tools, CopilotKit `useComponent`, AI SDK `tool-${name}` parts |
| Declarative | Agent composes a tree from a client-owned catalog | JSON component list + data model | Host app | A2UI, json-render, OpenUI Lang, ChatKit widgets, Adaptive Cards |
| Open-ended | Server or model ships a full HTML/JS app | HTML document in a sandboxed iframe | Remote server | MCP Apps, Gemini dynamic view |

- A transport layer sits under all three. AG-UI is the de facto agent ↔ frontend pipe and carries A2UI and MCP
  Apps payloads as `ACTIVITY_SNAPSHOT` events.
- The Generative UI Atlas (ag-ui.ai) uses the same split as four layers: interaction, declarative rendering,
  embedded host apps, implementation.

### 2.2 Technologies

| Tech | Owner · license | Status | Wire | Fit for line://ui |
|---|---|---|---|---|
| **A2UI** | Google (CLA required), Apache-2.0 | v0.9.1 production; v1.0 RC (`@path`/`@call` break landed 2026-10-02); "early stage public preview"; stability targeted Q4 2026 | JSONL `createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`; `action` and `error` back; MIME `application/a2ui+json` | High. Client-owned catalog, host-owned styling, official Lit renderer |
| **`@a2ui/web_core`**, **`@a2ui/lit`** | Google, Apache-2.0 | 0.12.0 (2026-09-28); breaking changes ship in minor versions | Framework-agnostic message processor, data model, binder, Zod catalog types; Lit universal components | High. Same `lit ^3.3.3` and `zod ^3.25.76` as line://ui (verified with `npm view`) |
| **AG-UI** | CopilotKit-led, MIT | 1.0 (2026-09-17); `@ag-ui/client` 1.0.2 | SSE event stream, `RunAgentInput`; A2UI rides `ACTIVITY_SNAPSHOT{activityType:"a2ui-surface"}` | Transport. App concern; the client has no framework dependency |
| **MCP Apps** (SEP-1865) | MCP project, MIT SDK | Stable spec 2026-01-26; `@modelcontextprotocol/ext-apps` 2.0.3; hosts include Claude, ChatGPT, VS Code, M365 Copilot, Cursor, Goose | `ui://` resource, `text/html;profile=mcp-app`, sandboxed iframe, postMessage JSON-RPC; 76 standard host CSS variables | Medium. line://ui as building blocks inside a View; theming bridge |
| **WebMCP** | W3C WebML CG, Chromium | CG draft 2026-09-29; Chrome origin trial M149–M156 (extension to M162 filed); no Firefox or Safari signal | `document.modelContext.registerTool`; declarative `<form toolname>` | Watch. Form-associated custom element support is a Chromium prototype; spec issue #94 open |
| json-render | Vercel Labs, Apache-2.0 | 0.21.0 | Flat spec + JSONL of RFC 6902 patches; Zod catalogs | Low. No WC renderer (proposal #289) |
| OpenUI / OpenUI Cloud (ex-C1) | Thesys, MIT / commercial | `@openuidev/lang-core` 0.3.1 | Line DSL; experimental A2UI v1.0 profile | Low. React-first runtimes |
| ChatKit widgets | OpenAI | `@openai/chatkit` 1.9.0 | JSON widget tree | None. Renders inside OpenAI's iframe |
| AI SDK genUI | Vercel | `ai` 7.0.x; RSC `streamUI` paused | UI message stream, `tool-${name}` parts | Controlled tier only, at the data level |
| Adaptive Cards | Microsoft, MIT | Schema 1.6, JS renderer 3.0.6 | JSON card + host config | Interop target at most |

### 2.3 Prior art among web-components design systems

- Web Awesome, Spectrum WC, Material Web, Carbon, UI5, Lion, FAST and Ionic ship no runtime genUI catalog or
  renderer.
- They ship dev-time aids instead: llms.txt, Agent Skills, MCP documentation servers.
- No CEM → A2UI catalog converter exists. The closest work is A2UI's own "universal components" (a Lit element
  plus a Zod `ComponentApi`), whose guide PR #2503 is still open.
- Storybook 11 (alpha) merged a CEM-based web-components docgen and an `apiDescription` for its MCP server
  (PRs #36371, #36565). Storybook 10.6 produces no component manifest for web components.

## 3. Fit with line://ui

### 3.1 Why the declarative tier matches headless

- The A2UI theming guide states that agents describe *what* to show and renderers decide *how* it looks.
  Visual props such as `fontSize` and `color` are unsupported; agents send semantic hints (`variant: "primary"`,
  `h2`, `avatar`).
- v0.9 renamed "Standard catalog" to "Basic" and expects production apps to bring their own catalog.
- v1.0 removes `theme` from `createSurface` and from catalogs.
- line://ui ships zero visual opinion, so there is nothing to reconcile. The consumer's `::part()` and `--line-*`
  rules style agent-built UI exactly as they style hand-written UI.
- Slots map onto A2UI's flat adjacency list. A default slot becomes `child` or `children`, and a named slot
  becomes a `ComponentId` prop. A2UI's `Modal.trigger` and `Modal.content` already use this shape.
- Custom elements upgrade when their definition arrives, so a renderer can create `<line-button>` first and
  `import()` its subpath on demand. Law 6 can hold this way; the spike measures it (§6).

### 3.2 Law-by-law check

| Law / principle | Effect of the proposal | Holds? |
|---|---|---|
| Law 1, `::part()` on every zone | Document `::part()` rules cannot reach elements inside another shadow root, so the surface must render in light DOM | Yes, with a light-DOM surface |
| Law 2, `line-*` prefix | `<line-a2ui-surface>`, `line-genui`, `--line-*` only. Catalog names (`Button`) are protocol identifiers, not tags or CSS | Yes |
| Law 3, WCAG 2.1 AA | Agent-built trees can omit labels; the renderer validates required names and owns live-region and focus policy | Yes, if the renderer enforces it |
| Law 4, no component imports | The surface is an orchestrator. It creates elements by tag and wires them through slots, and it imports component modules only to register them, never to compose a class | Yes |
| Law 5, machines / Lit / CSS | The renderer sets properties; components gain no protocol logic | Yes |
| Law 6, bundle isolation | Lazy `import()` per catalog entry; nothing defines tags eagerly. The catalog's schema weight still grows with the number of descriptors | Yes, pending the spike's bundle analysis (§6) |
| Law 7, opt-in forms | A2UI forms live in the surface data model, not in `<form>`; `FormAssociated` stays orthogonal | Yes |
| Law 8, progressive enhancement | Generated UI needs JavaScript; server-side A2UI → HTML is the progressive path (§4.9) | Partially |
| Law 9, never throw | `web_core` throws on tag collisions, a missing `api`, and bad `openUrl` schemes; the surface catches and degrades | Yes, with guards |
| Law 10, layered design system | The MCP bridge is CSS-only in `line-themes`; no runtime enters a CSS package | Yes |
| Principle 5 and Out of Scope, no framework adapters | A protocol renderer is not a framework adapter, but the line is thin and the Manifesto should say so | Needs wording |
| Principle 7, HTMX as explorer | Agent-driven UI is the same idea as server-driven UI; candidate sibling principle | Decision |

### 3.3 Verdict per technology

| Tech | Verdict | Reason |
|---|---|---|
| A2UI | Implement a catalog and a renderer, after a spike | The only standard where the client owns the vocabulary and the styling; official framework-agnostic core |
| AG-UI | Document as a recipe; ship no code | Transport, owned by the app; `@ag-ui/client` already works without a framework |
| Controlled tier (frontend tools) | Emit JSON Schema from the same descriptors | No extra runtime; the app registers the tools |
| MCP Apps | CSS bridge now; host element deferred | Views are plain HTML and line://ui already works there; the host side needs sandbox-proxy infrastructure |
| WebMCP | Track | FACE integration is a Chromium-only prototype, and the API moved from `navigator` to `document` this year |
| json-render, OpenUI, ChatKit, Adaptive Cards | Out of scope | Own catalogs and React-first runtimes, iframe-only rendering, or host-config styling |
| Model-authored `<line-*>` HTML | Reject for now | Needs `Element.setHTML()` with a custom allowlist, which ships in Chrome 146 and Firefox but not Safari (not Baseline, outside the PRD §1.7 browser matrix). AG-UI 1.0 also says apps MUST NOT render streamed content as executable markup |

## 4. Proposed architecture

### 4.1 Principles

1. Components stay protocol-unaware. No A2UI, AG-UI or MCP import enters `line-components` or `line-core`.
2. Each component gets one protocol-neutral descriptor, written once in Zod. Protocol formats are emitted from it.
3. Renderers and bridges are opt-in. A consumer who never uses agents ships zero extra bytes.
4. Upstream machinery (`@a2ui/web_core`) handles the moving spec. line://ui owns only the DOM projection.
5. Transports stay in the app. The library exchanges plain protocol messages through methods and DOM events.
6. The renderer enforces the laws an agent may break: allowlist, required accessible names, URL policy, never-throw.
7. Styling stays with the host. Agent style hints are ignored unless the consumer opts in.

### 4.2 Layers

```
 agent (LLM + framework)                    host app (consumer)
 ───────────────────────                    ──────────────────────────────────────────────
 A2UI JSONL ──▶ transport, app-owned ──▶    glue: feed messages in, send actions out
                (AG-UI / A2A / MCP / SSE)          │                         ▲
                                                   ▼                         │ line-a2ui-action
                                        ┌────────────────────────────────────────────┐
 @websublime/line-genui                 │ <line-a2ui-surface>        (light DOM)      │
                                        │  @a2ui/web_core: data model, bindings,      │
                                        │  checks, functions, version adapters        │
                                        │  projection: catalog name → line-* tag,     │
                                        │  lazy import(), slots, a11y, URL policy     │
                                        └──────────────────────┬─────────────────────┘
                                        catalog/: Zod descriptors → A2UI catalog JSON,
                                                  frontend-tool JSON Schema
                                                               │ creates elements by tag
 @websublime/line-components            <line-button> <line-input> <line-stack> …   (unchanged)
 @websublime/line-themes                hosts/mcp-apps.css          (CSS-only, MCP Apps views)
 consumer CSS                           ::part(...)   --line-*   data-accent / data-gray
```

### 4.3 Agent-ready component contract (Phase 1 onward)

Every component spec would state these rules whether or not genUI ships. Each one also helps plain HTML, HTMX
and Storybook MCP consumers.

| # | Rule | Why genUI needs it |
|---|---|---|
| C1 | Every public input is a JSON-serialisable attribute or property (string, number, boolean, string enum, string array) | Agents can only send JSON |
| C2 | Slots are documented with `@slot` and classified as single (`ComponentId`) or multiple (`ChildList`) | Slot → child-reference mapping |
| C3 | Events are documented with `@fires` and a typed `detail`. Value-bearing components share one convention (`input` for live edits, `change` for commits, `detail.value`) | Two-way binding and actions |
| C4 | Value-bearing components expose `value` as a property and accept external validity (an attribute or property that sets `ElementInternals` custom validity and fills the error zone) | A2UI `checks` and `validationErrors` |
| C5 | The accessible name is settable from the host, forwarded to the inner focusable or to `ElementInternals` ARIA | A2UI `accessibility.label` and `.description` |
| C6 | When a component has semantic variants, they are reflected attributes with closed enums that carry no styles | A2UI `variant` hints stay headless |
| C7 | CEM JSDoc is complete: `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires`, `@deprecated` | Catalog descriptions; Storybook 11 MCP |
| C8 | Rendering with missing or partial props degrades to an empty or neutral state | Streams arrive incrementally |

### 4.4 Catalog pipeline

- One descriptor per component under `line-genui/src/catalog/` is the source of truth. It uses the
  `@a2ui/web_core/v0_9` Zod schemas for the A2UI common types (`DynamicStringSchema`, `DynamicNumberSchema` and
  their siblings for `ComponentId`, `ChildList`, `Action`, `Checkable`).
- A descriptor holds:
  - the catalog name, the tag, and `load()`, which imports the component subpath;
  - the prop schema and the slot map;
  - the binding map (prop → property or attribute, the value prop, the commit event);
  - the action map (prop → DOM event);
  - the accessibility requirements and the LLM-facing description.
- The CEM enriches descriptions and deprecations and drives a drift test. The test fails when a descriptor names
  an attribute, property, slot or event that `customElements.json` lacks, following the `verify-palettes-fresh`
  pattern.
- The CEM cannot be the only source. Its types are plain text, and it has no `formAssociated` flag (CEM issue
  #136) and no ARIA metadata.
- Emitters:
  - A2UI v0.9.1 catalog JSON through `web_core` `Catalog.catalogSchema`;
  - frontend-tool schemas `{name, description, parameters}` for the controlled tier (AG-UI `RunAgentInput.tools`,
    AI SDK tools);
  - later, an A2UI v1.0 catalog (`protocolVersion: "1.0"`, `instructions`, `allowedParents` / `allowedChildren`).
- Schemas stay flat for provider limits. No `$ref` or `oneOf` beyond the A2UI common types, and descriptions stay
  under 1024 characters.
- The pipeline emits two catalogs, versioned independently.
  - The `line` catalog carries the full vocabulary. Its id, for example
    `https://<line-domain>/a2ui/v0.9/catalog/line/1`, changes on every incompatible edit (A2UI rule).
  - The `basic` compatibility catalog registers line components under the A2UI basic catalog id, so agents that
    know only the basic catalog render with line://ui (§4.6).
- line://ui and `web_core` both declare `zod ^3.25.76`, so the descriptors share types with `web_core` directly.

### 4.5 Renderer: `<line-a2ui-surface>`

The surface handles a message batch in six steps.

1. The app creates a session with its catalogs and handlers, then passes A2UI messages from any transport.
2. `web_core`'s `MessageProcessor` keeps the surface model, the data model, bindings, functions and checks.
3. The projection walks the component tree and creates `line-*` elements by tag. On the first sight of a type it
   calls the descriptor's `load()`, and the element upgrades when its module arrives.
4. Resolved props become properties or attributes per the binding map. Children land in slots through a `slot`
   attribute.
5. Component events call `web_core` setters (`setValue`) or action thunks. The surface dispatches
   `line-a2ui-action` carrying the resolved A2UI `action` message, and the app sends it.
6. Validation failures, unknown types and caught `web_core` exceptions become `line-a2ui-error` events carrying an
   A2UI `error` message. An inert placeholder takes the failed node's place.

| Topic | Proposal | Reason |
|---|---|---|
| Render root | Light DOM | Document `::part()` rules cannot reach elements inside another shadow root. A2UI's own basic catalog moved to light DOM in 0.11 |
| Projection | Spike both (a) light-DOM adapter elements rendered through `web_core` `renderA2uiNode`, and (b) direct projection on `web_core` models and binder | (a) reuses upstream rendering and may run inside other A2UI web renderers, but only where the host renders in light DOM, because upstream `<a2ui-surface>` keeps a shadow root that blocks document `::part()` rules; (b) avoids one wrapper element per node and keeps slot semantics exact |
| Loading | `load()` per descriptor; no eager `define()` | Law 6 |
| Versions | Accept v0.9 and v0.9.1 now; add v1.0 when upstream renderers ship it | The v1.0 RC still breaks |
| Theme | Ignore `theme.primaryColor` by default; an opt-in hook can map it to `data-accent` | The host owns styling, and v1.0 drops `theme` |
| Text | Plain text by default; Markdown only through an opt-in sanitising renderer (`@a2ui/markdown-it`, DOMPurify) | Agent strings are untrusted |
| Media and links | URL policy hook; default allowlist `https:`, `http:`, `mailto:`, `tel:`; `requiresUserActivation` honoured | Upstream does not check Image, Video or AudioPlayer URLs |
| Limits | Configurable maximum node count, depth and data-model size | Hostile or runaway agents |
| Accessibility | One live region per surface; `aria-busy` during batches; no focus moves on agent-initiated updates; focus kept across re-renders through stable ids; required names validated | WCAG 4.1.3, 2.4.3, 3.2.1 and 3.2.2; no W3C guidance specific to generated UI exists |
| Provenance | Optional slot that shows the verified agent name beside action-bearing surfaces | Spoofed "Confirm payment" buttons |
| Errors | Catch everything at the surface boundary | Law 9 |

The sketch below is illustrative; the spec decides the real API.

```ts
import { createA2uiSession } from '@websublime/line-genui/a2ui';
import { lineCatalog, basicCatalog } from '@websublime/line-genui/catalog';

const session = createA2uiSession({
  catalogs: [lineCatalog, basicCatalog],
  urlPolicy: (url) => url.protocol === 'https:',
});

transport.onMessages((messages) => session.process(messages));
transport.setMetadata(session.capabilities()); // a2uiClientCapabilities

const surface = document.querySelector('line-a2ui-surface'); // <line-a2ui-surface surface-id="booking">
surface.session = session;
surface.addEventListener('line-a2ui-action', (event) => transport.send(event.detail));
surface.addEventListener('line-a2ui-error', (event) => transport.send(event.detail));
```

### 4.6 Basic catalog on line components

| A2UI basic component | line://ui target | Phase |
|---|---|---|
| Text | Native `<p>`, `<h1>`–`<h5>`, `<small>` by `variant` | any |
| Image | Native `<img>` behind the URL policy; `variant: "avatar"` → Avatar | any / 1 |
| Icon | `<line-icon>`; the 59 A2UI icon names mapped to a `line-icons` resolver | 1 |
| Video, AudioPlayer | Native `<video>` and `<audio controls>`; Video Player and Audio Player later | any / 8 |
| Row, Column, List | `<line-stack>` (direction, justify, align) | 1 |
| Divider | `<line-separator>` | 1 |
| Button | `<line-button>` | 1 |
| TextField | `<line-input>`; `<line-textarea>` (`longText`); `<line-password-input>` (`obscured`); `<line-number-input>` (`number`); wrapped in `<line-field>` for the label | 2 |
| CheckBox | `<line-checkbox>` | 2 |
| ChoicePicker | `<line-radio-group>`, a checkbox group, `<line-select>` (`filterable`) or `<line-toggle-group>` (`chips`); Combobox later | 2 / 4 |
| Slider | `<line-slider>` | 2 |
| DateTimeInput | `<line-date-input>`; Date Picker and Time Picker later | 2 / 4 |
| Tabs | `<line-tabs>` | 3 |
| Modal | `<line-dialog>` | 3 |
| Card | `<line-card>` | 5 |

Phase 2 exit covers every input and layout. Phase 3 adds Tabs and Modal. Card waits for Phase 5 unless a neutral
container stands in.

### 4.7 Transports (app-owned, documented as recipes)

| Transport | Inbound | Outbound |
|---|---|---|
| AG-UI 1.0 | `ACTIVITY_SNAPSHOT` with `activityType: "a2ui-surface"` and `content.a2ui_operations` | `forwardedProps.a2uiAction` on the next run |
| A2A | DataPart with `mimeType: application/a2ui+json` holding an array of messages | DataPart with `[action]`; capabilities in message metadata |
| MCP | Tool result `EmbeddedResource` with `application/a2ui+json` | `tools/call` of `a2ui_action` or `a2ui_error` |
| SSE, WebSocket, fetch | JSONL | POST |

The AG-UI activity `content` shape comes from `@ag-ui/a2ui-middleware` 0.0.12, a middleware convention rather than
spec text, so recipes pin versions.

### 4.8 MCP Apps

- **View building blocks, available now.** An MCP App View is one HTML document in a sandboxed iframe whose
  default CSP allows inline script and style. line://ui works there unchanged, either inlined into the document
  (for example with `vite-plugin-singlefile`) or loaded from a CDN listed in `resourceDomains`.
- **Theming bridge.** `@websublime/line-themes/hosts/mcp-apps.css` maps the host's standard variables onto line
  theme aliases and token primitives. The app applies `hostContext.styles.variables` and `hostContext.theme` with
  the ext-apps SDK (`applyHostStyleVariables`, `applyDocumentTheme`). The SDK also sets `color-scheme`, which
  `light-dark()` needs.
- **Fallbacks differ by layer.** A theme alias falls back to its line step, for example
  `--line-gray-surface: var(--color-background-primary, var(--line-gray-2))`. A token primitive cannot fall back
  to itself, because a self-reference is a cycle and resolves to invalid. The spec chooses between copying the
  `line-tokens` literals into the bridge (a drift source across layers) and a second host sheet in `line-tokens`
  for the primitive rows.
- **A2UI inside an MCP App.** The A2UI guide "A2UI in MCP Apps" runs a renderer inside the View, so `line-genui`
  covers that case with no extra code.
- **Host side, deferred.** A `<line-mcp-app-frame>` around ext-apps `AppBridge` would be the only native
  web-component MCP Apps host (MCP-UI removed its React-wrapped custom element in v7). It needs a sandbox-proxy
  origin and a security review, so it waits until line://ui targets chat hosts.

Draft mapping; the spec settles the exact pairs.

| MCP host variable | line://ui token |
|---|---|
| `--color-background-primary` | `--line-gray-surface` |
| `--color-background-secondary`, `--color-background-tertiary` | `--line-gray-bg`, `--line-gray-bg-hover` |
| `--color-text-primary`, `--color-text-secondary` | `--line-gray-text`, `--line-gray-text-low` |
| `--color-border-primary` | `--line-gray-border` |
| `--color-{background,text,border}-{info,danger,success,warning}` | `--line-{info,danger,success,warning}-{bg,text,border}` |
| `--color-ring-primary` | `--line-focus-ring-color` |
| `--font-sans`, `--font-mono` | `--line-font-sans`, `--line-font-mono` |
| `--border-radius-{xs,sm,md,lg,xl}`, `--border-radius-full` | `--line-radius-{1..5}`, `--line-radius-round` |
| `--shadow-{sm,md,lg}` | `--line-shadow-{1,2,3}` |

The host sends no accent ramp, spacing scale or motion tokens. `data-accent` and the line scales stay in charge
of those.

### 4.9 Deferred and rejected

| Item | Decision | Trigger to revisit |
|---|---|---|
| WebMCP for form-associated elements (`ElementInternals.setToolParamSchema()`, `toolFillCallback()` in `FormAssociated`) | Defer | Spec issue #94 resolved and a second engine signals support |
| Server-side A2UI → `<line-*>` HTML | Explore after H1 | Outcome of H1 (the `LineHtmxElement` spike); A2UI v1.0 allows server rendering |
| Model-authored `<line-*>` markup | Reject | Sanitizer API reaches Baseline and an allowlist story exists |
| json-render and OpenUI renderers | Out of scope | Upstream ships a web-components renderer (json-render #289) |
| Headless chat primitives (message list, composer, tool-call card, reasoning disclosure, approval dialog) | Separate catalogue question | A product decision; Chat Bubble already sits in Phase 8 |
| Dev-time AI (Storybook 11 MCP, llms.txt from the CEM, a CEM analyzer plugin adding `formAssociated`, `version`, `scope`) | Cheap; schedule with Storybook 11 | Storybook 11 stable |

### 4.10 Package layout

- New runtime package `@websublime/line-genui` (working name), built with Vite, with these subpath exports:
  - `./catalog`: descriptors, `lineCatalog`, `basicCatalog`, emitters; touches no DOM;
  - `./a2ui`: the session and `<line-a2ui-surface>`;
  - `./catalog.json`: the emitted A2UI catalog for agents and prompts.
- Dependencies are `@a2ui/web_core` (exact pin), `lit`, `zod` and `line-core`. `line-components` and
  `line-icons` are peer dependencies, loaded lazily.
- `scripts/lint-layers.mjs` gains `'line-genui': new Set(['line-core', 'line-components', 'line-icons'])`, and no
  package may depend on `line-genui`.
- `line-themes` gains `hosts/mcp-apps.css` with no runtime.
- Importing `./catalog` defines no element. Importing `./a2ui` defines only `line-a2ui-surface`.

## 5. Documents that change if this is adopted

| Document | Change |
|---|---|
| `docs/MANIFESTO.md` | A principle "Agent-driven UI as an explorer" beside Principle 7, or Principle 7 widened to server- and agent-driven UI. Out of Scope states that protocol renderers are opt-in packages and not framework adapters |
| `docs/PRD.md` | Revision-log entry; §1.4 principle; §6.1 package count 8 → 9; §7 roadmap rows for the spike and the ship step; appendix "Generative UI (exploratory)"; §8.1 spec template gains an agent contract section |
| `docs/ARCHITECTURE.md` | A section on agent-driven UI (layers, light-DOM surface, catalog pipeline); a §12 note on lazy registries |
| `docs/specs/COMPONENT-SPEC-TEMPLATE.md` (pending) | Rules C1–C8 |
| `scripts/lint-layers.mjs` and the spec edge table it copies (`docs/specs/00-spec-design-system.md` §6.B, or the opening phase's spec) | `line-genui` edge set |
| `custom-elements-manifest.config.mjs` | Optional analyzer plugin for `formAssociated`, `version`, `scope` |

## 6. Phasing proposal

| Step | When | Output | Runtime code |
|---|---|---|---|
| 0. Agent-ready contract | Before the first Phase 1 component spec | C1–C8 in the component spec template | None |
| 1. Spike | Parallel to Phase 1, like H1 | Prototype on A2UI v0.9.1 and `web_core` 0.12 with Button, Icon, Stack, Separator and native Text/Image; retrospective with go/no-go | Throwaway |
| 2. MCP Apps bridge | Any time; independent | `line-themes/hosts/mcp-apps.css` and a Storybook recipe | CSS only |
| 3. Ship `line-genui` 0.x | With or after Phase 2, because forms are the main agent use case | `line` and `basic` catalogs (v0.9.1), the surface, recipes for AG-UI, A2A and MCP | Yes |
| 4. A2UI v1.0 | When v1.0 is final (upstream targets Q4 2026) and `web_core` ships its adapter | v1.0 catalogs, `accessibility.live` / `.hidden`, function RPC | Yes |

The spike answers these questions at its exit.

- Which projection wins, adapter elements or direct projection, judged on slot assignment, layout and the
  accessibility tree?
- Do document `::part()` rules reach line elements that the surface renders?
- Does lazy loading keep Law 6, shown by bundle analysis of a surface that uses one component?
- Is every `web_core` throw path caught, and do errors round-trip as A2UI `error` messages?
- Does the emitted catalog validate against the A2UI v0.9.1 meta-schema and drive a real model to valid output?
- Do the live-region and focus policy pass axe-core and a manual screen-reader pass?
- What do `web_core` plus the surface weigh, gzipped?

## 7. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| A2UI churn: the v1.0 RC broke on 2026-10-02 and `web_core` breaks in minor versions | High | Version seam, exact pins, spike before commitment |
| Governance concentration: A2UI needs the Google CLA, AG-UI is CopilotKit-led, neither has a foundation | Medium | Protocol-neutral descriptors with one emitter per protocol |
| Catalog quality becomes the UX, because v0.9+ is prompt-first | High | Review descriptions like API docs; budget catalog tokens |
| Accessibility of agent-built trees is under-specified upstream | High | Renderer-owned policy, tests, required names in schemas |
| Prompt injection through labels on action buttons | Medium | Provenance slot; consent UI stays with the app; no free text on consequential actions in the `line` catalog |
| React-centric ecosystem (CopilotKit, json-render, OpenUI) | Medium | The A2UI web core is framework-agnostic; line://ui stays web components |
| Scope creep toward a chat platform | Medium | Transports and chat UI stay out of `line-genui` |
| Phase 1 delivery slows | Low | Only step 0 touches Phase 1, and it is spec text |

## 8. Open forks

The six forks below need Miguel's decision. The recommended option is listed first.

1. **Direction.** (a) Run the spike first and decide at its exit, as with HTMX. (b) Adopt agent-driven UI as an
   exploratory principle now (PRD revision, Manifesto wording) and then spike. (c) Defer until A2UI v1.0 is final.
2. **Agent-ready contract.** (a) Add C1–C8 to the component spec template before Phase 1 specs. (b) Leave the
   choice to each component spec.
3. **Protocol target.** (a) A2UI first, behind the neutral descriptor layer. (b) Neutral descriptors only, with no
   A2UI renderer. (c) json-render.
4. **Descriptor home.** (a) `line-genui`, with a CEM drift test, which keeps components free of Zod and protocol
   code. (b) A colocated `*.agent.ts` beside each component, exported as an extra subpath.
5. **Basic catalog compatibility.** (a) Ship both the `line` and the `basic` catalog. (b) Ship `line` only.
6. **Timing of the ship step.** (a) After Phase 2. (b) A dedicated phase after Phase 3. (c) A stream inside
   Phase 2.

## 9. Sources

A2UI
- Repository and status: https://github.com/a2ui-project/a2ui
- v0.9.1 spec: https://a2ui.org/specification/v0.9.1-a2ui/
- v1.0 RC spec: https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md
- v1.0 evolution guide: https://a2ui.org/specification/v1.0-evolution-guide/
- v0.9 launch: https://developers.googleblog.com/a2ui-v0-9-generative-ui
- Theming guide: https://a2ui.org/guides/theming
- Comparison page: https://a2ui.org/introduction/agent-ui-ecosystem/
- `web_core` extension type: https://github.com/a2ui-project/a2ui/blob/main/typescript/web_core/src/universal/web_component_implementation.ts
- `web_core` node rendering: https://github.com/a2ui-project/a2ui/blob/main/typescript/web_core/src/universal/render-a2ui-node.ts
- A2UI over MCP: https://github.com/a2ui-project/a2ui/blob/main/docs/public/guides/a2ui_over_mcp.md
- A2UI in MCP Apps: https://github.com/a2ui-project/a2ui/blob/main/docs/public/guides/a2ui-in-mcp-apps.md
- Roadmap: https://a2ui.org/roadmap/

AG-UI and CopilotKit
- Spec 1.0: https://docs.ag-ui.com/spec/1.0/index.md
- Generative UI specs: https://docs.ag-ui.com/concepts/generative-ui-specs.md
- A2UI middleware source: https://github.com/ag-ui-protocol/ag-ui/tree/main/middlewares/a2ui-middleware
- CopilotKit generative UI: https://docs.copilotkit.ai/concepts/generative-ui-overview
- Generative UI Atlas: https://ag-ui.ai/en/compare

MCP Apps
- Stable spec: https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx
- Client matrix: https://modelcontextprotocol.io/extensions/client-matrix
- Style variables schema: https://github.com/modelcontextprotocol/ext-apps/blob/main/src/generated/schema.ts
- OpenAI convergence: https://developers.openai.com/apps-sdk/changelog
- Shopify remote-dom: https://github.com/Shopify/remote-dom

WebMCP
- Spec: https://webmachinelearning.github.io/webmcp
- Declarative API: https://developer.chrome.com/docs/ai/webmcp/declarative-api
- FACE issue: https://github.com/webmachinelearning/webmcp/issues/94
- Chromium FACE prototype: https://chromium.googlesource.com/chromium/src/+/c1f726b3787be0744e6bf10c4e9ba1fdd85ebc43

Adjacent
- Storybook AI manifests: https://storybook.js.org/docs/ai/manifests
- Storybook WC CEM docgen: https://github.com/storybookjs/storybook/pull/36371, https://github.com/storybookjs/storybook/pull/36565
- CEM `formAssociated` issue: https://github.com/webcomponents/custom-elements-manifest/issues/136
- json-render WC proposal: https://github.com/vercel-labs/json-render/issues/289
- State of AI in design systems (July 2026): https://state-of-ai-in-design-systems.netlify.app/
- `Element.setHTML()`: https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- `ariaNotify()`: https://developer.mozilla.org/en-US/docs/Web/API/Element/ariaNotify
