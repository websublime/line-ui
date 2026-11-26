# Research: Progressive enhancement and SSR/SSG for the form controls (R7)

**Row:** `01-Z22` (Phase 2 plan §5.1 R7, decision O8 (a))
**Date:** 2026-11-26 (every probe ran the same day on the row 01-Z14 baseline, §3)
**Repo sources (at `origin/main` `9c9b1f4`):** `docs/plans/02-plan-essential-forms.md` §1, §2.3, §3, §5.1 R1–R4, R7, R9, §5.3, §5.4 O8, §5.5, §5.7; `docs/MANIFESTO.md` Laws 5, 7, 8, 9, Out of Scope; `docs/PRD.md` (v0.8.36) §1 personas, §1.7, comparison table; `docs/ARCHITECTURE.md` (v0.8.28) §6, §7, §9, §14.10, §15, §16; `docs/specs/0002-button.md`; `docs/specs/0012-visually-hidden.md` F3; `docs/specs/0013-portal.md` D8; `packages/line-core/src/{line-element.ts,form-associated.ts,styles/index.ts,machine/line-machine-controller.ts}`; `packages/line-components/src/{button,avatar,badge}/*.ts`; `docs/research/01-research-zag-machines.md` (format)
**Status:** Evidence. Research carries no rules (`docs/PROCESS.md` §1). Recommendations are marked "(recommended)"; every decision is an open question in §7.

> **TL;DR**
>
> - **Input, Textarea and Select can stay functional without JavaScript, but only through a native control in the
>   light DOM.** With JavaScript disabled, a native `<input>`, `<textarea>` or `<select>` that the page author puts
>   inside an undefined `<line-input>`, `<line-textarea>` or `<line-select>` submits its value. It also blocks
>   submission while `required` and empty, resets, honours `form=` and an ancestor `<fieldset disabled>`, submits on
>   Enter, and takes its name from a `<label for>`. This held in Chromium 159, Firefox 159, macOS WebKit 27.2 and
>   Linux WebKit 27.2 (§3.2).
> - **Nothing else works without JavaScript.** A bare host with `name` and `value` submits nothing. A native control
>   inside a shadow root, declarative or Lit-SSR-rendered, has no form owner and is not submitted, in all three
>   engines. The anatomy ARCHITECTURE prescribes therefore cannot work without JavaScript: §15.1 puts the native
>   `<input>` and `<textarea>` inside the shadow root, and §16.2 gives Select no native element at all. For the
>   current anatomy, Law 8's "when feasible" resolves to **not feasible**. For a slotted-native anatomy it resolves to
>   **feasible**. That fork contradicts ARCHITECTURE and is flagged in §5, not resolved.
> - **On upgrade, two strategies exist.** "Adopt" keeps the slotted control as the only form participant and renders a
>   `<slot>` around it: one `FormData` entry and native validity and reset, in three engines. "Take over" renders its
>   own shadow `<input>` and an `ElementInternals` value. It submits the value twice (`n=n0&n=n0`) unless the
>   component disables the author's control. A `required` author control left unrendered then blocks submission
>   without any visible message ("not focusable").
> - **Declarative shadow DOM works in all three engines with JavaScript disabled.** That covers `shadowrootmode`,
>   `shadowrootdelegatesfocus`, `shadowrootserializable` and `shadowrootclonable`; the legacy `shadowroot` attribute is
>   ignored. The shadow styles paint before any script runs. A declarative root with a `<slot>` around a light-DOM
>   native control is both styled and functional without JavaScript.
> - **Lit SSR (`@lit-labs/ssr` 4.1.0) renders 17 of the 20 Phase 1 elements** on Node 22.23.5 and Bun 1.4.5. Avatar
>   and AvatarGroup call `closest()` in `render()`, and Badge iterates `childNodes` in its constructor; those three
>   throw. A `FormAssociated(LineElement)` probe renders and hydrates in three engines when
>   `lit-element-hydrate-support` loads first. Without it, Lit reuses the declarative root and renders a second copy
>   (two inputs, two buttons). `line-core` builds its reset sheets with `new CSSStyleSheet()` at module scope, which
>   breaks the Astro and Next.js Lit integrations until a `CSSStyleSheet` shim loads first.
> - **Frameworks.** Astro 7.4.13 has no official Lit integration since Astro 5. The community `@semantic-ui/astro-lit`
>   5.3.0 turns attributes that match non-reflected reactive properties into properties and drops them, so a probe lost
>   its `name` and left the form after hydration. The Astro and Vue compilers swallow a hand-written `<slot>` inside a
>   declarative template. Next.js 16.4.6 with React 19.3.1 renders plain markup fine, but a declarative template in JSX
>   fails hydration (React #418) and loses its shadow root. `@lit-labs/nextjs` 0.2.4 (peer `next` 13–15,
>   webpack only) worked on Next 16 under `next build --webpack` in a `'use client'` file. Nuxt 4.7.0 logs a hydration
>   mismatch for a declarative template but keeps the shadow root. `nuxt-ssr-lit` 2.0.0 worked on Node 22, although it
>   declares Node `>=24`.
> - **Linux WebKit matched macOS WebKit in every behaviour**; only text metrics differ (an input is 212 px wide on Linux
>   and 156 px on macOS). The CI runner is x86_64 and has not run these probes.

---

## 1. Question

Plan §5.1 R7: "Whether Input, Textarea and Select can stay functional without JavaScript (MANIFESTO Law 8, PRD §1.7
`:172`), for example through a slotted native control; a recorded "not feasible" is a valid outcome. Per O8 (a), the same
note investigates SSR/SSG for the Phase 2 controls (declarative shadow DOM, Lit SSR, Astro, Nuxt, Next.js; PRD §1.7
`:166`)" (`docs/plans/02-plan-essential-forms.md:269`). O8 (a) folds the SSR investigation into R7 with no exit
criterion (`:386-398`; plan §3, `:185-187`).

- **Q1** What does each anatomy do with JavaScript disabled: a bare host, a slotted native control, a native control
  in a shadow root, a declarative shadow root?
- **Q2** For Input, Textarea and Select, which native form features does a slotted control keep without JavaScript?
- **Q3** What happens when the element upgrades over a slotted control, and how does each strategy fit ARCHITECTURE
  and Laws 5, 7, 8 and 9?
- **Q4** Does declarative shadow DOM (DSD) work in the three engines, with and without JavaScript?
- **Q5** Does Lit SSR render and hydrate `LineElement`, `FormAssociated` and `ElementInternals`, and the Phase 1
  components?
- **Q6** What do Astro 7.4.13, Next.js and Nuxt do with these elements and with DSD?

The texts under test:

- MANIFESTO Law 8: "Progressive enhancement is preserved where the underlying native element supports it. Components
  that wrap native controls (Input, Textarea, Select) remain functional in light DOM fallback when feasible"
  (`docs/MANIFESTO.md:53`).
- PRD §1.7: "Components that wrap native elements (Input, Textarea, Select) remain functional without JavaScript via
  light DOM fallback where feasible" (`docs/PRD.md:172`). "SSR/SSG — Out of scope for Phase 0. The Phase 2 research
  investigates Astro, Nuxt and Next.js compatibility; it is not a launch blocker" (`:166`). The comparison table cites
  this plan item (`:82`), and the htmx persona "Values simplicity and progressive enhancement" (`:145`).

## 2. Findings

### 2.1 Q1: four anatomies with JavaScript disabled

Probe 3.2 ran each anatomy in a `<form method="post">` against a recording server, with Playwright's
`javaScriptEnabled: false`. A beacon script on every page proved that no page script ran (`jsRan: false` in every
no-JS row).

| Anatomy | Markup (abridged) | Submitted body, all engines | Rendered |
|---|---|---|---|
| Bare host | `<line-input name="a" value="a0">` | nothing from the host (`z=z0` from a sibling control only) | inline, empty |
| Slotted native | `<line-input><input name="b" value="b0"></line-input>` | `b=b01` after typing `1` | the native input |
| Native in a declarative shadow root | `<line-input><template shadowrootmode="open">…<input name="e" value="e0"></template></line-input>` | nothing from `e` | the shadow input, styled |
| Declarative root with a `<slot>`, native in light DOM | `<line-input><template shadowrootmode="open"><style>…</style><span part="root"><slot></slot></span></template><input name="f" value="f0"></line-input>` | `f=f01` | the native input inside the shadow styling: host = input + 12 px (2 px border, 4 px padding) |
| Lit SSR output of a `FormAssociated(LineElement)` probe with a shadow `<input>` | `<probe-inner name="p" value="p0"><template shadowrootmode="open" shadowrootdelegatesfocus>…<input part="input" value="p0"></template></probe-inner>` | empty body | styled, 165 × 33 px in Chromium |
| Lit SSR output of `<line-button type="submit">` | the button's DSD | no request on click | 41 × 24 px in Chromium |

- **An undefined custom element is not form-associated.** Form association needs the element definition, so a host
  contributes nothing before its module runs.
- **A control inside a shadow root has no form owner.** The HTML form-owner rules look for an ancestor `form` in the
  control's own tree, and a shadow root is a separate tree. This confirms, for submission, the [INFERENCE] in plan §1
  ("A native input inside a shadow root has no form owner in the page", `docs/plans/02-plan-essential-forms.md:39-40`).
  Its `closest()` half is R1's (`:263`).
- **A server-rendered Button is inert without JavaScript.** Its shadow `<button>` is `type="button"`, and Button
  submits through a temporary native submitter that it creates in script
  (`packages/line-components/src/button/button.ts:276`). A form that must submit without JavaScript needs a native
  submit button or implicit submission. Probe 3.6 showed implicit submission from a lone light-DOM text field next to a
  `<line-button>`.

### 2.2 Q2: what a slotted native control keeps without JavaScript

Probe 3.2. Each feature ran in its own form. The result was identical in Chromium 159.0.8154.6, Firefox 159.0, macOS
WebKit 27.2 and Linux WebKit 27.2, with JavaScript disabled and also with JavaScript enabled and no element defined.

| Feature | Input | Textarea | Select | Result |
|---|---|---|---|---|
| Value in the request after user edit | `b=b01` | `c=c01` | `d=3` after `selectOption` | ✓ |
| `required` and empty blocks submission; filled then submits | `g` | — | — | no request, then `g=x` ✓ |
| Same inside a DSD host with a `<slot>` | `g2` | — | — | no request, then `g2=x` ✓ |
| Implicit submission (Enter) | `h=h02` | — | — | ✓ |
| `<button type="reset">` restores the default | `i=i0` | — | — | ✓ |
| `form="…"` from outside the form | `j=j0` | — | — | ✓ |
| Ancestor `<fieldset disabled>` | `k` absent | — | — | ✓ |
| `<label for>` focuses the control | `l=q` | — | — | ✓ |
| Accessible name from `<label for>` through a DSD `<slot>` (Playwright `ariaSnapshot`) | `textbox "Email"` | — | — | ✓ |

- Everything in this table is the platform's own behaviour for a light-DOM control. No line://ui code is involved, so
  ARCHITECTURE §7's "HTML5 validation … works natively" (`docs/ARCHITECTURE.md:393`) is literally true for a slotted
  native control. For a form-associated host it is not, which is plan §5.7's gap (`docs/plans/02-plan-essential-forms.md:435`).
- Not probed, and plausible because the control is an ordinary light-DOM element: autofill, password managers, IME,
  the selection API, the mobile OS pickers, and state restore on history navigation. These are exactly the platform
  features ARCHITECTURE §15.1 cites for putting a native element inside the shadow root (`docs/ARCHITECTURE.md:1329-1333`)
  and §16.2 for password-manager detection (`:1492`) [INFERENCE].
- The accessible-name row is Playwright's computed snapshot, not a platform accessibility tree or a screen reader.

### 2.3 Q3: upgrading over a slotted control

Probe 3.3 defined two vanilla custom elements over the same slotted control, with JavaScript enabled.

| Strategy | What the element does | `FormData` | Submit | Validity and reset |
|---|---|---|---|---|
| **Adopt** (`pe-adopt`) | Shadow root `<span part="root"><slot></slot></span>`; not form-associated | `m=m0` | `m=m0` | emptied `required` control: `checkValidity()` false, no request; reset back to `m0`; host = input + 12 px |
| **Take over** (`pe-take`) | `formAssociated`, a shadow `<input>`, no slot; copies the slotted value and calls `setFormValue` | `n=n0&n=n0` | `n=n0&n=n0` | — |
| **Take over + disable** | As above, and sets `disabled` on the slotted control | `n=n0` | `n=n0` | — |
| **Take over, `required` light-DOM control left empty** | The host value is `host`; the slotted `<input required>` is not rendered | `n=host&n=` | **no request** | `checkValidity()` false. Chromium logs "An invalid form control with name='n' is not focusable."; Firefox logs "The invalid form control with name='n' is not focusable."; WebKit logs nothing. The page shows no message |

The results were identical in the three engines and on Linux WebKit.

- **Adopt** gives one form participant in both modes: the author's control. The element supplies styling around a
  `<slot>`, state reflection and events. The value never passes through `ElementInternals`.
- **Take over** keeps ARCHITECTURE's anatomy after upgrade, but the light-DOM control still belongs to the form, since
  slotting does not change the form owner. The component must therefore disable or remove the author's element. That
  is a mutation of consumer DOM outside Lit's render, which MANIFESTO Law 5 forbids ("no DOM mutation outside Lit's
  reactive cycle", `docs/MANIFESTO.md:47`). The component must also hand over value, default value, `required`, the
  other constraint attributes and `disabled`, and it must not leave an invalid unrendered control behind.
- **Law 9.** If the machine fails (`packages/line-core/src/machine/line-machine-controller.ts:92-99`), an adopting
  element still leaves a working native control. A taking-over element that already disabled the author's control
  leaves whatever its static fallback submits, which R1 owns (plan `:263`) [INFERENCE].
- **Pre-upgrade CSS.** Phase 1 documents consumer `:not(:defined)` rules that hide pre-upgrade content
  (`docs/specs/0013-portal.md:633`, `docs/specs/0012-visually-hidden.md:540`). Without JavaScript the element never
  becomes defined. Probe 3.2 showed `line-input:not(:defined)` still matching in all engines, DSD or not. A rule that
  hid a form control's light DOM before upgrade would hide the no-JavaScript fallback for the whole session.

### 2.4 Q4: declarative shadow DOM in three engines

Probe 3.4, with JavaScript disabled and enabled. In the disabled run, Playwright reads the DOM from its isolated world
while page scripts stay off.

| Check | Chromium 159 | Firefox 159 | WebKit 27.2 (macOS and Linux) |
|---|---|---|---|
| `shadowrootmode="open"` attaches a root; `:host` styles apply before any script (`display: inline-block` host 20 × 30 px against 1264 × 18 px plain) | ✓ | ✓ (20 × 31) | ✓ (Linux 21 × 33) |
| `shadowrootmode="closed"` renders, `shadowRoot` is `null` | ✓ | ✓ | ✓ |
| `shadowrootdelegatesfocus` → `delegatesFocus === true` | ✓ | ✓ | ✓ |
| `shadowrootserializable` → `serializable`, `getHTML({ serializableShadowRoots: true })` emits the template | ✓ | ✓ | ✓ |
| `shadowrootclonable` → a clone keeps its root | ✓ | ✓ | ✓ |
| Legacy `shadowroot="open"` (no `mode`) attaches a root | ✗ | ✗ | ✗ |
| `HTMLTemplateElement.prototype.shadowRootMode`, `Element.prototype.setHTMLUnsafe` | ✓ | ✓ | ✓ |
| `attachInternals`, `CustomStateSet` | ✓ | ✓ | ✓ |
| `CSS.supports('appearance', 'base-select')` (customizable `<select>`) | ✓ | ✗ | ✓ |

- Lit SSR and both Lit integrations emit `shadowroot` and `shadowrootmode` together (`@lit-labs/ssr@4.1.0`
  `lib/render-value.js:661`). The engines use only the standard attribute.
- Neither Lit SSR nor the integrations emit `shadowrootserializable` or `shadowrootclonable`.
- Customizable select shipped in Safari 27.0 (WebKit blog, "WebKit Features for Safari 27.0"). The check is a parse
  check only, and its behaviour belongs to R4 (plan `:266`).
- **Plain Lit over a declarative root.** Without hydrate support, `createRenderRoot()` returns the existing
  `this.shadowRoot` (`@lit/reactive-element` 2.1.2 `development/reactive-element.js:564-569`), and Lit renders a new
  part next to the server markup. In probe 3.5 the root held two `<input>`s for `probe-inner` and two `<button>`s for
  `line-button`, in all engines. Typing went to the stale server input, so the form value stayed `p=p0`. The DOM
  specification's "attach a shadow root" clears a declarative root only when `attachShadow()` is called, and Lit does
  not call it.

### 2.5 Q5: Lit SSR with the line://ui base and the Phase 1 components

Probe 3.5 used `@lit-labs/ssr` 4.1.0 with its global DOM shim, sharing one `lit` 3.3.3 instance with the worktree
build.

**Phase 1 components** (`render(html\`<line-x>x</line-x>\`)`, Node 22.23.5 and Bun 1.4.5, identical):

| Result | Components |
|---|---|
| Renders a declarative root with its styles | Alert, AspectRatio, Button (`shadowrootdelegatesfocus`), ButtonGroup, Center, Chip (`delegatesfocus`), Grid, Icon, IconButton (`delegatesfocus`), Kbd, Portal, Presence, Separator, Skeleton, Spinner, Stack, VisuallyHidden |
| Throws `TypeError: e.closest is not a function` in `render()` | Avatar, AvatarGroup (`#language()`, `packages/line-components/src/avatar/avatar.ts:216-222`, called from `:279`) |
| Throws `TypeError: e is not iterable` in the constructor | Badge (`holdsContent(this.childNodes)`, `packages/line-components/src/badge/badge.ts:24`, `:160`) |

- **`LineElement` and `FormAssociated` on the shim.** `#internals = this.attachInternals()`
  (`packages/line-core/src/line-element.ts:31`) gets the shim's `ElementInternals`
  (`@lit-labs/ssr-dom-shim@1.6.0` `index.js:439-447`, `lib/element-internals.js:58-140`). `setFormValue` and
  `setValidity` do nothing there, `form` is `null`, and `checkValidity()` warns and returns `true` (`:127-138`;
  lit/lit#3740, open). `LitElementRenderer` copies non-empty ARIA properties of the internals onto the host as
  attributes plus `hydrate-internals-*` markers (`lib/lit-element-renderer.js:40-49`).
- **Lifecycle.** Lit SSR runs `willUpdate` and `update` but not `connectedCallback`, unless
  `LitElementRenderer.renderOptions` opts in (`:55-99`). `LineMachineController` starts its machine in `hostConnected`
  (`line-machine-controller.ts:92-96`), so server markup reflects the component's props without machine state
  [INFERENCE: from the source; the SSR Button markup carried no Zag attributes]. Opting Badge into `connectedCallback`
  did not help, because it throws earlier, in the constructor.
- **Module scope.** `createSheet()` calls `new CSSStyleSheet()` and `replaceSync()` when the module loads
  (`packages/line-core/src/styles/index.ts:24-28`). The `@lit-labs/ssr` 4.1.0 global shim provides both. The
  integrations do not install it: `@semantic-ui/astro-lit` 5.3.0 patches only `HTMLElement` and `customElements`
  (`server-shim.js`), and its nested `@lit-labs/ssr` 3.3.1 shim has no `replaceSync`. `@lit-labs/ssr-react` 0.3.4 patches
  React only (`node/enable-lit-ssr.js`). §2.6 gives the build errors.
- **Hydration.** With `@lit-labs/ssr-client` 1.1.8 `lit-element-hydrate-support.js` imported before any Lit module,
  as the Lit docs require (lit.dev "Client usage"), probe 3.5 hydrated in all engines.

  | Element | Result |
  |---|---|
  | `probe-inner` | one `<input>`; the `.value` binding and the `@input` listener live; `FormData` `p=p0`; typing `1` submitted `p=p01` |
  | `probe-slot` | submitted its light-DOM `q=q0` |
  | `line-button` | one shadow button, no fallback; a click submitted the form (`r=r0`) |

  Hydrate support adds 2,180 B gzipped to a minified Lit bundle (11,843 against 9,663 B, `bun build --minify`).
- **What SSR cannot do.** A server-rendered form-associated value reaches the form only after hydration (§2.1, row
  "Lit SSR output"). SSR solves first paint and layout. It does not solve Law 8.

### 2.6 Q6: Astro, Next.js and Nuxt

All three were installed under `/tmp` only, built for production, and probed in three engines plus Linux WebKit
(probes 3.6–3.8).

**Astro 7.4.13** (static output)

| Case | Result |
|---|---|
| Plain markup: hosts with slotted native controls | Emitted verbatim; `b=b0&c=c0&d=2&f=f0` with and without JavaScript |
| Hand-written DSD in an `.astro` file | `<template shadowrootmode>` kept, but the compiler **removed the `<slot></slot>`**: the slotted input rendered at 0 × 0 (no box) and still submitted. `<slot is:inline>`, `set:html` on the template, or a `<Fragment set:html>` kept the slot (withastro/astro#12322) |
| Lit SSR | No official integration: Astro 5 removed `@astrojs/lit` (Astro v5 upgrade guide). `@semantic-ui/astro-lit` 5.3.0 (peer `lit` ^3.2.0, `@lit-labs/ssr` ^3.3.1) |
| `@semantic-ui/astro-lit` with line-core | Build failed with `ReferenceError: CSSStyleSheet is not defined`. With the integration's own `@lit-labs/ssr` 3.3.1 shim imported first: `TypeError: t.replaceSync is not a function`. With the 4.1.0 global shim: `customElements.get(...) is not a constructor` for islands (two registries). It built with a one-line page import that sets `globalThis.CSSStyleSheet` from `@lit-labs/ssr-dom-shim` |
| Tags without `client:*` | Server-rendered DSD with `defer-hydration`, no client script; the elements never upgrade |
| Attributes that are reactive properties | `name="p" value="p0"` on `<probe-inner>` became properties, were **not** serialised, and set `defer-hydration` (`server.js:44-61`). After `client:load` hydration, `nameProp: "p"` but no `name` attribute, so `FormData` lacked `p` in all engines. The platform takes a form-associated element's entry name from its `name` content attribute |
| Islands | Each element is wrapped in `<astro-island>`, and its children are duplicated into an inert `<template data-astro-template>` |

**Next.js 16.4.6, React 19.3.1** (App Router, `next start`)

| Case | No JavaScript | JavaScript |
|---|---|---|
| Plain markup (server component) | `b=b0&c=c0&d=2` | same, no errors |
| DSD template in JSX (`<template shadowrootmode="open">…<slot></slot></template>`) | rendered and styled, `f=f0` | `pageerror: Minified React error #418` (hydration mismatch). React re-created an inert `<template>`, and the host **lost its shadow root** (`inline`, 153 × 18 px). Upstream treats this as not planned (react/react#26071, closed `not_planned`) |
| `@lit-labs/nextjs` 0.2.4 in a `'use client'` file | DSD rendered; `p` absent (`b=b0&q=q0`) | hydrated, one input, `name` attribute kept, `b=b0&p=p0&q=q0`, no errors |

- `@lit-labs/nextjs` 0.2.4 declares peer `next` "13 || 14 || 15", says it "has been tested with Next.js versions 13 and
  14", and states that deep SSR fails in React Server Components (README `:59`, `:63`). It installed only with
  `--legacy-peer-deps`.
- It configures webpack only. Next 16 defaults to Turbopack and refused to build ("This build is using Turbopack, with a
  `webpack` config and no `turbopack` config"), so the probe built with `next build --webpack`.
- It too needed the `CSSStyleSheet` shim: without it, `ReferenceError: CSSStyleSheet is not defined` during prerender.
- The default `next build` failed with "Cannot read properties of null (reading 'useContext')" until `NODE_ENV=production`
  was set explicitly. That has nothing to do with line://ui [INFERENCE: environment].

**Nuxt 4.7.0, Vue 3.5.46** (node-server output)

| Case | No JavaScript | JavaScript |
|---|---|---|
| Plain markup with `isCustomElement` for `line-` and `probe-` | `b=b0&c=c0&d=2` | same, no errors |
| DSD template in a Vue template | `<slot>` compiled to a Vue slot outlet (`<!--[--><!--]-->`): host 12 × 12, input unrendered but submitted | "Hydration completed but contains mismatches."; the shadow root survives |
| Same with `<component is="slot">` | slot kept, styled | mismatch logged; shadow root survives |
| Same through `v-html` on the host | slot kept, styled | no mismatch |
| `nuxt-ssr-lit` 2.0.0 (prefixes `probe-`, `line-button`) | DSD rendered, `defer-hydration="true"`, `name` kept; `b=b0&q=q0` | hydrated, `b=b0&p=p0&q=q0`, no errors |

- Vuejs/core#12813 "Vue breaks Declarative Shadow DOM" is open.
- `nuxt-ssr-lit` 2.0.0 declares `engines.node >=24` and uses `@lit-labs/ssr` ^4.1.0. It also needed the
  `CSSStyleSheet` shim in the page's `<script setup>`.
- The baseline Nuxt build answered 500 with `ReferenceError: __VUE_OPTIONS_API__ is not defined` from the externalised
  `vue-router` 5.5.2 until `build.transpile: ['vue-router']`. That has nothing to do with line://ui.

## 3. Probes

All probes ran on 2026-11-26 on macOS 27.2.1 (arm64) in the worktree `line-ui-z22` (branch
`docs/01-z22-r7-progressive-enhancement-ssr`, HEAD `6edee9e`, whose docs and packages equal `origin/main` `9c9b1f4`).
Throwaway pages, scripts and framework projects lived under `/tmp/z22-probes/` and were deleted at the end; nothing was
written to the repository.

**Toolchain.**

- Bun 1.4.5 (`/tmp/bun145`) for `HOME=/tmp/emptyhome bun install --frozen-lockfile` and `bun --filter './packages/*' build`.
- Node 22.23.5 (`/tmp/node-v22.23.5-darwin-arm64`) for the runners and the framework builds.
- Playwright 1.65.1 from the worktree: Chromium 159.0.8154.6, Firefox 159.0, WebKit 27.2 (build 2388).
- One browser at a time, one page at a time.
- Ports: 5220 for the probe server, 5221 for Next.js, 5222 for Nuxt.

**Linux WebKit.** Per Miguel (2026-11-26), every WebKit probe also ran in `mcr.microsoft.com/playwright:v1.65.1-noble`.

- Image: Ubuntu 24.04.5 LTS, aarch64, Node v26.13.1, WebKit build 2388 under `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`.
- Command: `docker run --rm --cpus 2 --memory 1g --ipc=host --add-host=host.docker.internal:host-gateway`, with the
  worktree mounted read-only at `/work` and the probes at `/probes`.
- Runner: the repo's Playwright 1.65.1 JavaScript (`/work/node_modules/playwright/index.mjs`) on the container's Node.
- The Next.js and Nuxt servers ran on the host, bound to `0.0.0.0`.
- Results: every pass/fail value, request body, log and hydration outcome matched macOS WebKit. Only sizes differed,
  from the default font metrics: an input was 212 × 27 px on Linux against 156 × 21 px on macOS, and the
  "host = input + 12 px" relation held on both.
- CI runs x86_64 Linux; these probes ran on aarch64 only.

### 3.1 Harness

- `run.mjs` started a `node:http` server that served the probe pages and recorded every `POST /submit/<case>` body
  and every `GET /js-ran/<case>` beacon.
- For each engine it opened one context with `javaScriptEnabled: false` and one with `true`. It drove the pages with
  real input (`click`, `keyboard.type`, `keyboard.press`, `selectOption`) and read the body the server received. A
  "no request" result means nothing arrived within 1.5 s.
- `fw-run.mjs` drove the Next.js and Nuxt servers the same way and read the echoed body after navigation.
- Pages were generated by `gen-pages.mjs`. The markup of each case is quoted in the tables of §2.

### 3.2 No-JavaScript forms (all cases × 4 engine builds)

| Case | Chromium | Firefox | macOS WebKit | Linux WebKit |
|---|---|---|---|---|
| `bare` | `z=z0` | same | same | same |
| `slotted-input`, `-textarea`, `-select` | `b=b01`, `c=c01`, `d=3` | same | same | same |
| `dsd-internal` | `z=z0` (no `e`) | same | same | same |
| `dsd-slot` (host / input box) | `f=f01` (165×33 / 153×21) | `f=f01` (201×34 / 189×22) | `f=f01` (168×33 / 156×21) | `f=f01` (224×39 / 212×27) |
| `required`, `dsd-required` | no request, then `g=x` / `g2=x` | same | same | same |
| `enter`, `reset`, `form-attr`, `fieldset`, `label` | `h=h02`, `i=i0`, `j=j0`, `k2=k20`, `l=q` | same | same | same |
| `label-dsd` (`ariaSnapshot`) | `textbox "Email"` | same | same | same |
| `undefined-css` (`:not(:defined)` outline) | `rgb(1, 2, 3)` | same | same | same |
| `ssr-inner`, `ssr-slot`, `ssr-button` | empty, `q=q0`, no request | same | same | same |
| `jsRan` beacon | false everywhere | false | false | false |

With JavaScript enabled and no definitions, every row returned the same body, and the beacon arrived.

### 3.3 Upgrade strategies (JavaScript on)

The results are in §2.3 and were identical in Chromium, Firefox, macOS WebKit and Linux WebKit.

- `pe-adopt` is a vanilla element whose shadow root holds a `<style>` and a `<span part="root"><slot>`.
- `pe-take` is `formAssociated`. Its root is a `<style>` and an `<input part="input">`, with `delegatesFocus`. In
  `connectedCallback` it copies the light-DOM `input.value`, calls `setFormValue`, and listens for `input`.
  `formResetCallback` restores `defaultValue`. Variants add `native.disabled = true`, or force the host value to
  `host` over an empty `required` control.

### 3.4 Declarative shadow DOM

The results are in §2.4. The host boxes are those of `#open`, `#closed` and `#plain`; the other checks are one
`page.evaluate`.

### 3.5 Lit SSR

- **Setup.** `npm i @lit-labs/ssr@4.1.0 @lit-labs/ssr-client@1.1.8` in `/tmp`. Its `lit`, `lit-html`, `lit-element`,
  `@lit/reactive-element` and `@lit-labs/ssr-dom-shim` were replaced by symlinks to the worktree's isolated-linker
  copies, all the same versions (3.3.3, 3.3.3, 4.2.2, 2.1.2, 1.6.0), so the components and the renderer share one Lit.
- **Script.** `ssr-probe.mjs` imports `@lit-labs/ssr/lib/install-global-dom-shim.js` and then each built
  `packages/line-components/dist/<c>/index.js`, and renders it with `collectResultSync(render(...))`.
- **Probe elements**, defined on `packages/line-core/dist`:
  - `probe-inner`: `FormAssociated(LineElement)` with `static properties = { value: {}, name: {} }`, `delegatesFocus`,
    a shadow `<input .value=${value} @input=…>`, and `setFormValue` in `firstUpdated` and on input.
  - `probe-slot`: `LineElement` rendering `<span part="root"><slot></slot></span>`.
- **Output.** The same script wrote `ssr-inner.html`, `ssr-slot.html` and `ssr-button.html`. Node 22.23.5 and Bun 1.4.5
  gave identical `probe-inner` form markup and the same pass/fail list.
- **Client bundles.** `bun build` produced two bundles. `hydrate.js` imports `lit-element-hydrate-support.js` and then
  the elements; `plain.js` imports the elements only. A grep found one `LitElement` in `hydrate.js`. The page served
  them as `ssr-*-hydrate.html` and `ssr-*-plain.html`. Both bundles logged Lit's dev-mode warning, which is a bundler
  export-condition artefact.

| Case | Chromium | Firefox | WebKit (macOS = Linux) |
|---|---|---|---|
| `ssr-inner-hydrate` | 1 input, `p=p0` → `p=p01` | same | same |
| `ssr-inner-plain` | **2 inputs**, `p=p0` after typing | same | same |
| `ssr-slot-hydrate` | `q=q0` | same | same |
| `ssr-button-hydrate` | 1 button, `r=r0` | same | same |
| `ssr-button-plain` | **2 buttons**, `r=r0` | same | same |

### 3.6 Astro 7.4.13

- **Install.** `npm i astro@7.4.13 @semantic-ui/astro-lit@5.3.0 lit@3.3.3 @webcomponents/template-shadowroot@0.2.1`,
  with the Lit packages symlinked as in 3.5 and the config `output: 'static'` with `lit()`.
- **Pages.**
  - `plain.astro`: hosts with slotted native controls and a hand-written DSD.
  - `slot.astro`: the four `<slot>` spellings of §2.6.
  - `lit.astro`: imports the probe elements and `line-button`; tags without `client:*`.
  - `lit-client.astro`: `<ProbeInner client:load name="p" value="p0" />`, `<ProbeSlot client:load>`,
    `<LineButton client:load type="submit">`.
  - `badge.astro`: Badge alone.
- **Build attempts.**
  1. `badge.astro` and `lit.astro` failed on `CSSStyleSheet`.
  2. `lit.astro` with the integration's own shim failed on `replaceSync`.
  3. `lit-client.astro` with the 4.1.0 global shim failed on `customElements.get(...)`.
  4. The build succeeded with the `CSSStyleSheet`-only shim.
- **Probe.** The `dist` pages and `_astro` assets were served by the 3.1 server (cases `astro-*`).

| Case | Chromium | Firefox | WebKit (macOS = Linux) |
|---|---|---|---|
| `astro-plain` (no JS / JS) | `b=b0&c=c0&d=2&f=f0` | same | same |
| `astro-slot` (`<slot>`, `is:inline`, `set:html`, `Fragment`) | none, 153×21, 153×21, 153×21 | none, 189×22 ×3 | none, 156×21 ×3 |
| `astro-lit` host attributes; Enter in the light-DOM field | `defer-hydration`; `q=q0` | same | same |
| `astro-lit-client` (no JS) | not defined; `q=q0` in `FormData` | same | same |
| `astro-lit-client` (JS) | defined, hydrated, `name` attribute `null`, `FormData` `q=q0`, `line-button` submits `q=q0` | same | same |

### 3.7 Next.js 16.4.6

- **Install.** `npm i next@16.4.6 react@19.3.1 react-dom@19.3.1`, then
  `@lit-labs/nextjs@0.2.4 @lit-labs/ssr-react@0.3.4` with `--legacy-peer-deps`.
- **Pages.** `/` (plain), `/dsd` (a JSX declarative template) and `/lit` (a `'use client'` component that imports the
  shim and then the probe elements). The form posts to a route handler that echoes the body.
- **Builds.**
  - The first build ran under Turbopack, without a config, for `/` and `/dsd`.
  - The second ran `next build --webpack` with `withLitSSR`.
  - `next build` under Turbopack with the plugin was refused.
- **Probe.** `fw-run.mjs`; results in §2.6. Linux WebKit matched macOS WebKit, React #418 included.

### 3.8 Nuxt 4.7.0

- **Install.** `npm i nuxt@4.7.0 vue nuxt-ssr-lit@2.0.0 lit@3.3.3 @webcomponents/template-shadowroot@0.2.1`;
  `EBADENGINE` warned for `nuxt-ssr-lit`.
- **Config.** `vue.compilerOptions.isCustomElement` for `line-` and `probe-`, and `build.transpile: ['vue-router']`.
  The Lit build added `modules: [['nuxt-ssr-lit', { litElementPrefix: ['probe-', 'line-button'] }]]` and
  `nitro.moduleSideEffects` for the elements file.
- **Pages.** `/`, `/dsd`, `/dsd2` (`<component is="slot">`), `/dsd3` (`v-html`) and `/lit`, plus a Nitro echo route.
- **Probe.** `fw-run.mjs`; results in §2.6. Linux WebKit matched macOS WebKit. Firefox's only extra logs were the echo
  page's quirks-mode warning and deprecation warnings from the Nuxt client chunk.

## 4. Fit with line://ui

- **Law 8 and PRD §1.7 `:172`** name exactly Input, Textarea and Select and say "light DOM fallback". The slotted-native
  anatomy is a light-DOM fallback that works (§2.2). The shadow-native anatomy of ARCHITECTURE §15.1 is not (§2.1).
- **Law 7** (`docs/MANIFESTO.md:51`) makes `FormAssociated` and `ElementInternals` the only path for form participation.
  Adopt keeps "native `<form>` semantics is the only contract" literally, but the participant is the author's native
  control, not the host. Take over keeps the mixin path but needs the Law 5 mutation of §2.3.
- **Law 4 and the Field** (`docs/ARCHITECTURE.md:474-498`). A slotted native control is labelled by an ordinary
  `<label for>` in the same tree (§2.2). That sidesteps the cross-shadow labelling problem R3 studies (plan `:265`;
  ARCHITECTURE `:487`) for these three controls [INFERENCE: not probed inside a `<line-field>`]. ARCHITECTURE §16.2
  already tells consumers who want the native mobile picker to put "a native `<select>` with `<line-field>`" (`:1460`).
- **ARCHITECTURE §14.10** already ships consumer resets for slotted light-DOM content of `line-input`, `line-textarea`
  and `line-select` (`docs/ARCHITECTURE.md:1297`). Slotted content around these controls is a known pattern.
- **htmx persona** (`docs/PRD.md:145`). A light-DOM native control is also the path htmx reads without any component
  code [INFERENCE: the Appendix A harness was not run against it].
- **SSR (Out of Scope `:65`, PRD `:166`).** Nothing here makes SSR a requirement. Lit SSR is usable today for 17 Phase 1
  elements under a consumer-supplied shim and hydrate support, and every framework path needs integration-specific
  care (§2.6).

## 5. Contradictions and gaps

PROCESS §2: research that contradicts the plan returns to the plan and PRD before any spec work. These are flagged
here and not resolved.

1. **Law 8 vs ARCHITECTURE §15.1, §15.2 and §16.2 (contradiction).**
   - MANIFESTO `:53` and PRD `:172` require Input, Textarea and Select to "remain functional in light DOM fallback
     when feasible".
   - ARCHITECTURE puts the native `<input>` and `<textarea>` inside the shadow root (`docs/ARCHITECTURE.md:1325-1333`),
     always exposes it as `::part(input)` (`:1367`), and gives Select no native element, with its value through
     `ElementInternals` (`:1339`, `:1452`).
   - Under that anatomy the probes show no functioning without JavaScript (§2.1). Feasibility depends on the anatomy,
     so the anatomy is the fork.
   - Plan §5.7 lists the Select half of this gap (`docs/plans/02-plan-essential-forms.md:436`); the Input and Textarea
     half is not in the plan.
2. **Law 5 and Law 7 vs any slotted fallback (tension).**
   - A take-over upgrade must mutate the author's light DOM to avoid a duplicate entry (§2.3), against Law 5
     (`docs/MANIFESTO.md:47`).
   - An adopting component is not the form participant, against the wording of Law 7 (`:51`) and the
     ARCHITECTURE §7 list that makes Input, Textarea and Select form-associated (`docs/ARCHITECTURE.md:402`).
3. **ARCHITECTURE §7 "HTML5 validation … works natively"** (`:393`). Plan §5.7 already tracks it (`:435`). The probes
   add that the sentence is true for a slotted native control and false for a host.
4. **MANIFESTO Out of Scope "No Node DOM polyfill story"** (`docs/MANIFESTO.md:68`) vs the SSR investigation of `:65`
   and PRD `:166`.
   - Every SSR path probed runs the components in Node under a DOM shim.
   - The module-scope `new CSSStyleSheet()` in `line-core` (`packages/line-core/src/styles/index.ts:25`) needs a
     global shim that the Astro and Next.js integrations do not install (§2.5, §2.6).
   - This is a tension in wording, not a broken rule, because SSR is not a hard requirement.
5. **Plan §1 fact 2** (`docs/plans/02-plan-essential-forms.md:36-42`). Its [INFERENCE] about the form owner holds:
   probes 3.2 and 3.5 show a shadow-root input outside the form. No contradiction.
6. **lit.dev's SSR overview still lists "Astro integration for Lit"**, which Astro removed in v5. This is upstream
   documentation drift; line://ui cites neither.

## 6. Options and recommendations

### 6.1 Law 8 for Input and Textarea

| Option | What it decides | Cost |
|---|---|---|
| (a) **Slotted native is the control** ("adopt") | The author writes `<line-input><input name="email" …></line-input>`. The element renders a styled shadow frame around a `<slot>`, reflects state (`data-*`, `:state()`), emits the Field events, and binds its machine to the slotted control's events. The native control is the only form participant, with and without JavaScript | Rewrites ARCHITECTURE §7 (the three leave the form-associated list or keep it without a value), §15.1, §15.2 (no `::part(input)`; the author styles the element directly or through `::slotted`), and Law 7's wording. Prefix and suffix slots and the internal parts (password toggle, clear) sit around the slot. The machine reads and writes attributes on author DOM, which needs a Law 5 reading |
| (b) **Fallback, then take over** | The slotted native works before upgrade. On upgrade the element renders ARCHITECTURE's shadow `<input>`, copies value, default and constraints, and disables the author's control | Keeps ARCHITECTURE's anatomy after upgrade. Mutates author DOM (Law 5). Double markup, and a hand-off of value, default, constraints, `disabled` and restore. The "not focusable" trap (§2.3). Two code paths to test in three engines |
| (c) **Record "not feasible"** | Keep ARCHITECTURE; revise MANIFESTO Law 8 and PRD `:172` to say the three controls need JavaScript; document a native control inside `<line-field>` as the no-JavaScript path | No component cost. Narrows a MANIFESTO law, which needs Miguel |

**(a) (recommended).** It is the only option where the no-JavaScript path and the upgraded path share one form
participant. That rules out duplicates and hand-off. It makes constraint validation, reset, `form=`, `fieldset`,
labelling and implicit submission native (§2.2). It also removes, for these controls, the cross-shadow labelling (R3)
and password-manager (§16.2) limits [INFERENCE for the last]. The cost is an ARCHITECTURE revision and Law 5 and Law 7
wording, which the post-research revision must weigh (§7 Q1–Q3).

### 6.2 Law 8 for Select

Select's anatomy is R4's question (plan `:266`).

- **The no-JavaScript path.** A slotted native `<select>` works without JavaScript in three engines (§2.2). Each option
  of §6.1 has a Select form:
  - (a) keep the native `<select>` as the control, optionally styled with `appearance: base-select` where supported
    (Chromium, WebKit 27; not Firefox, §2.4);
  - (b) read the slotted `<option>`s into the custom listbox and disable the native one;
  - (c) record "not feasible".
- **Recommendation.** None here. The choice depends on R4's native-or-custom finding, and this note only supplies the
  no-JavaScript evidence.

### 6.3 SSR/SSG (no exit criterion)

| Option | What it decides |
|---|---|
| (a) **SSR-tolerant authoring rule, consumer-supplied integration** (recommended) | The Phase 2 spec states a rule for every control: no DOM access beyond the Lit SSR shim in the constructor, `render()` or `willUpdate` (the Avatar and Badge failures, §2.5); `name` and other form attributes are read from attributes or reflected (the astro-lit `name` loss, §2.6). Documentation then names the consumer's part: load `lit-element-hydrate-support` first, and provide a `CSSStyleSheet` shim or a lazy sheet (§7 Q7) |
| (b) **Declare SSR unsupported** | Record the findings, change nothing, and leave the PRD row as "investigated" |
| (c) **Ship SSR support** | Make `line-core` shim-free, fix the three Phase 1 components, ship or document per-framework recipes, and test them in CI. This is close to a stream, which O8 (a) excluded (plan `:396`) |

(a) costs little and keeps later SSR possible. It does not depend on the Law 8 fork, because SSR alone does not
deliver no-JavaScript forms (§2.5). (c) conflicts with O8 (a) and with the Out of Scope framework-adapter line
(`docs/MANIFESTO.md:63`).

## 7. Open questions for the post-research revision (plan §10 step 4) and the Phase 2 spec

1. **Law 8 anatomy for Input and Textarea.** Option (a), (b) or (c) of §6.1? Options (a) and (b) need an ARCHITECTURE
   revision of §7, §15.1, §15.2 and §16.2. Option (c) needs a MANIFESTO and PRD revision.
2. **Law 7.** Under §6.1 (a), are Input and Textarea still form-associated at all? If they are, which value does the
   host give `setFormValue`: none, or a mirror? How does `custom-validity` (C4, `docs/specs/0002-button.md:248`) reach
   the native control: `setCustomValidity` on the slotted element?
3. **Law 5.** May a component set attributes on author-supplied light DOM, such as `aria-describedby` from Field, the
   machine's props, or `disabled` under §6.1 (b)? The MANIFESTO is silent on slotted content.
4. **Select.** Does R4's native-or-custom decision adopt the slotted `<select>` as its no-JavaScript path? Is
   `appearance: base-select` (Chromium and WebKit 27, not Firefox) in scope?
5. **Pre-upgrade CSS.** Should the forms guide (plan §4.5) warn that a `:not(:defined)` hiding rule must not hide a
   form control's fallback (§2.3)?
6. **SSR authoring rule.** Does the Phase 2 spec carry §6.3 (a) as a rule, or record SSR as unsupported?
7. **`line-core` sheets.** Keep the module-scope `new CSSStyleSheet()` (consumers shim it), or create the sheets
   lazily? The second is a published `line-core` change and would be its own row.
8. **Phase 1 SSR failures.** Should Avatar, AvatarGroup and Badge get rows to become SSR-safe, or is this note the
   record? SSR is not a requirement, so they are not bugs against their specs.
9. **Hydration.** Do the docs tell SSR consumers to load `@lit-labs/ssr-client/lit-element-hydrate-support.js` first
   (+2,180 B gzipped), given that a plain upgrade duplicates the shadow content (§2.4)?
10. **Framework notes.** Does the forms guide or the Storybook docs record the framework findings, or does this note
    stand alone?
    - Astro: no official Lit integration; `<slot is:inline>` in hand-written DSD; astro-lit's property mapping.
    - Next.js: DSD in JSX breaks hydration; `@lit-labs/nextjs` is webpack-only and out of its peer range on Next 16.
    - Nuxt: the Vue `<slot>`; `nuxt-ssr-lit` declares Node 24.

    MANIFESTO Out of Scope forbids framework adapters (`docs/MANIFESTO.md:63`), so any guidance stays documentation.
11. **MANIFESTO `:68`.** Does "No Node DOM polyfill story" need wording that admits consumer-run SSR under a shim, now
    that the investigation exists (`:65`)?
12. **R1 and R2.** Should R1 (static fallback) and R2 (restore, autofill, password managers) take the slotted-native
    anatomy into their probes, given §6.1?

## 8. What could not be verified

- Password managers, browser autofill, IME composition, mobile OS pickers, speech input and state restore on history
  navigation for a slotted native control: no automation exists for most of them, and restore is R2's.
- A screen reader. The accessible-name check is Playwright's `ariaSnapshot`.
- x86_64 Linux WebKit, which CI uses: every Linux run was aarch64.
- Real Phase 2 components, none of which exists; the probes used purpose-built elements on `line-core`.
- `@lit-labs/nextjs` under Turbopack, which Next 16 refuses with a webpack config. `nuxt-ssr-lit` on Node 24: it ran on
  Node 22.23.5 only.
- Astro's dev server and Next.js and Nuxt dev mode: only production builds ran.
- The htmx harness against a slotted native control.

## 9. Sources

All retrieved 2026-11-26. npm tarballs were unpacked with `npm pack <pkg>@<ver>` in `/tmp/z22-probes/pack`.

- `@lit-labs/ssr` 4.1.0: `lib/lit-element-renderer.js:19-22`, `:40-49`, `:55-99`, `:156`; `lib/render-value.js:658-663`
- `@lit-labs/ssr-dom-shim` 1.6.0: `index.js:439-447`; `lib/element-internals.js:58-142`; `lib/css.js:108-138`
- `@lit-labs/ssr-client` 1.1.8: `lit-element-hydrate-support.js`
- `@lit/reactive-element` 2.1.2: `development/reactive-element.js:564-569`
- `@semantic-ui/astro-lit` 5.3.0: `server.js:44-61`, `server-shim.js`, `package.json`; `@astrojs/lit` 4.3.0
  (last published 2024-06-17)
- `@lit-labs/nextjs` 0.2.4: `index.js`, README `:59`, `:63`; `@lit-labs/ssr-react` 0.3.4: `node/enable-lit-ssr.js`
- `nuxt-ssr-lit` 2.0.0: `dist/module.mjs`, `dist/runtime/components/LitWrapperServer.vue:17-21`, `package.json` `engines`
- npm `latest` on 2026-11-26: `next` 16.4.6, `react` 19.3.1, `nuxt` 4.7.0, `astro` 7.4.13, `lit` 3.3.3
- Astro v5 upgrade guide, "Removed: The Lit integration":
  https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/upgrade-to/v5.mdx
- withastro/astro#12322 (`<slot is:inline>` in a web component template): https://github.com/withastro/astro/issues/12322
- react/react#26071 "Reconciler cannot handle Declarative Shadow DOM", closed `not_planned`:
  https://github.com/react/react/issues/26071
- React error #418: https://react.dev/errors/418
- vuejs/core#12813 "Vue breaks Declarative Shadow DOM", open: https://github.com/vuejs/core/issues/12813
- lit/lit#3740 "`ElementInternals.checkValidity()` behavior" (ssr-dom-shim), open: https://github.com/lit/lit/issues/3740
- Lit SSR overview and client usage: https://lit.dev/docs/ssr/overview/, https://lit.dev/docs/ssr/client-usage/
- HTML, form owner and form-associated custom elements:
  https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-owner,
  https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements
- HTML, implicit submission:
  https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
- HTML, interactively validate the constraints (the "not focusable" case):
  https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#interactively-validate-the-constraints
- HTML, `shadowrootmode`: https://html.spec.whatwg.org/multipage/scripting.html#attr-template-shadowrootmode
- DOM, attach a shadow root (declarative root handling): https://dom.spec.whatwg.org/#concept-attach-a-shadow-root
- HTML, `:defined`: https://html.spec.whatwg.org/multipage/semantics-other.html#selector-defined
- WebKit Features for Safari 27.0 (customizable select): https://webkit.org/blog/18325/webkit-features-for-safari-27-0/
