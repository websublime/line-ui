# line://ui — Architecture

**Date:** 2026-10-27
**Status:** APPROVED
**Maintenance:** Living document — updated as architectural decisions evolve.
**Source:** Extracted from PRD v0.8.3 §3 (Component Architecture) and §9 (Design System — Layered Package Model). Aligned with Manifesto Laws 2, 6, 7, 10 (revised 2026-05-19).
**Manifesto:** [`docs/MANIFESTO.md`](./MANIFESTO.md)

This document captures the **cross-cutting architectural decisions** that apply to all components. Individual component specifications live in `docs/specs/`. Product requirements live in [`docs/PRD.md`](./PRD.md).

---

## Revision Notes

- **v0.8.15 (2026-10-27)** — Aligned with component spec `0002-button.md` (ledger row `01-C1`, decisions by Miguel on 2026-10-27).
  - §13.1 (Button Ecosystem) gives Button a `loading` slot inside `::part(loading)`, rendered only while loading, the reflected `variant` enum `default | primary | borderless`, and form submission through a temporary native submit button, so `name`, `value` and the `form*` overrides behave natively (spec `0002-button.md` Open Questions 2, 4, 5).
  - §4 (CSS Customisation) names the height token `--line-button-height`, because Button has no size variant (spec `0002-button.md` CSS custom properties).
  - §5 (CSS Parts Naming Convention) adds `::part(loading)`, the wrapper of a component's loading content, which §13.1 and §13.5 already name.
  - §7 (Form Association Strategy) says that Enter on a focused `<line-button type="submit">` submits, and that implicit submission from a text field never picks a custom element as the form's default button (WICG/webcomponents#814).
  - §14.9 (Focus Management) says an interactive component draws a default ring on `::part(root)` under `[data-focus-visible]` through its `--line-{component}-focus-ring` token, which defaults to `var(--line-focus-ring, 2px solid currentColor)`, because `line-themes` ships no focus-ring rule and WCAG 2.4.7 needs a visible indicator. Themes and consumers override the token or the part.
- **v0.8.14 (2026-10-27)** — Aligned with Phase 1 spec AM-052 (ledger row `01-C24`, decision by Miguel on 2026-10-27).
  - §6 (Base Class — LineElement) says the controller hands the component's props function to the machine at start and signals each host update with `updateProps({})`, so the machine reads the live function and the update cost stays flat on Zag 1.47.0 (Phase 1 spec §6.C.7, §10 SD18, AM-052).
  - §8 (State Management) and §13.1 (Button Ecosystem) name Zag 1.47.0, the Phase 1 floor (Phase 1 spec §10 SD11, SD30, AM-052).
- **v0.8.13 (2026-10-26)** — Aligned with PRD v0.8.27 and Phase 1 spec AM-050 (ledger row `01-C23`, decision by Miguel on 2026-10-26).
  - §12 (Bundle Splitting Rule, shared runtime) says each library build also keeps the package's own name external, so every bare specifier in `dist/` is declared or is a self-reference through the package's `exports`. `@websublime/line-core/mixins/form-associated` re-exports `FormAssociated` from the `line-core` root that way, so the jsDelivr `+esm` path, which inlines relative imports into each URL, keeps one `INTERNALS` Symbol (Phase 1 spec §6.C.2, §7.7, §10 SD2, AM-050).
- **v0.8.12 (2026-10-21)** — Aligned with PRD v0.8.26, with coherence review rounds 30 and 31 (ledger row `00-Z48`).
  - §17.3 (Descriptors and catalogs) gives Text inside a Button a `<span>`, as Phase 1 spec §10 SD59 sets (Phase 1 spec AM-040; finding L3R30-03).
  - §12 (Bundle Splitting Rule, the side-effect contract) cites Phase 1 spec §4, §4.3–§4.5, §10 SD4, SD5 on the sentence about the manifests that keep `"sideEffects"`, and Phase 1 spec §7.5, §10 SD4 on the harness sentence (Phase 1 spec AM-040, AM-041; findings L3R30-07, L3R31-08).
  - §17.5 (Transports), A2A Outbound: the recipe sends a DataPart with `[action]` or `[error]`, so a surface error leaves A2A as an array, as an action does (Phase 1 spec §6.G.7, §10 SD66, AM-041; finding L3R31-03).
- **v0.8.11 (2026-10-21)** — Aligned with PRD v0.8.25, with coherence review rounds 23 and 24 (ledger row `00-Z48`).
  - §14.8 (State Reflection) writes the host attribute in the `reflectState` snippet with ``toggleAttribute(`data-${name}`, active)``, so a kebab-case state such as `focus-visible` from the state table maps verbatim. `this.dataset['focus-visible'] = ''` throws `SyntaxError` in Chromium (Phase 1 spec §6.C.2, AM-032; finding L3R23-09). The snippet keeps the guard on `states` (`states?.add`, `states?.delete`) that the `FormAssociated` override had (`packages/line-core/src/mixins/form-associated.ts:135`), so the data attribute is still set where internals have no custom states (`packages/line-core/__tests__/form-associated.test.ts:134-141`; Phase 1 spec AM-034; findings L2R24-04, L3R24-03).
  - §10 (Component File Structure) gives the path `packages/line-components/src/dialog/`, the package that Phase 1 spec §5 names (Phase 1 spec AM-032; finding L3R23-15).
  - §14.4 (Reset Module Contents) says that every component declares `reset.common.css` and that `LineElement` does not inject it, as §14.6 and `packages/line-core/src/line-element.ts:12-13` state (Phase 1 spec AM-032; finding L3R23-15).
  - §5 (CSS Parts Naming Convention) no longer gives "chip dismiss" as the `::part(remove)` example, because Chip carries no remove button (PRD v0.8.19; Phase 1 spec AM-032; finding L3R23-15).
  - §14.3 (Modular CSS Reset) and §14.5 (Build Pipeline, the code comment and the Source row) give the path `packages/line-core/src/styles/`, the package that Phase 1 spec §5 names (Phase 1 spec AM-034; finding L3R24-04).
- **v0.8.10 (2026-10-20)** — Aligned with PRD v0.8.24, with coherence review rounds 5–12 (ledger row `00-Z48`, round-7 decision by Miguel on 2026-10-20).
  - §17.1 (Layers) says `line-components` is a peer loaded lazily through descriptor `load()`, and `line-icons` is a peer for the `A2uiIconMap` and `A2uiIconName` types only (`import type`; the shipped `.d.ts` references `@websublime/line-icons/a2ui`), never loaded at run time. The peer stays (Phase 1 spec §10 SD9, AM-008, AM-009; finding L3R5-01).
  - §11 (Icon System) says the global slot is created on first access (`setIconRegistry`, the `LineIcon.registry` getter or setter, or a `<line-icon>` connect), never at module load, so `define()` stays the only module-top side effect of `./icon` and the root defines and creates nothing (§12). The event on the slot's `events` target is `line-icon-registry-change` (Law 2 prefix), because it is a cross-copy, cross-version contract (Phase 1 spec AM-010; findings L3R5-02, L3R5-03).
  - §17.4 (Renderer) defines `A2uiIconName` as the union of the 59 A2UI v0.9.1 `Icon.name` enum values, kept in `packages/line-icons/src/a2ui/` and exported from `./a2ui` beside `A2uiIconEntry`, `A2uiIconMap` and `a2uiIconMap` (R10 §2.1, P2; R1 §2.6; Phase 1 spec AM-010; finding L3R5-04).
  - §17.7 (Stability) names the `A2uiIconName`, `A2uiIconEntry` and `A2uiIconMap` types and the `a2uiIconMap` helper as what feeds the preview property `iconMap` (Phase 1 spec AM-011; finding L3R6-03).
  - §17.4 (Renderer), Accessibility row: the surface's live region announces the values of the attributes `live-update-text` and `live-error-text` (properties `liveUpdateText`, `liveErrorText`), whose defaults are "Content updated." and "Some content could not be shown."; the consumer localises through them (MANIFESTO Out of Scope; R2 §2.8 for the live region; R2 §6 Q3, `docs/research/assets/01-r2/spike/README.md:110, :116-117` and `docs/research/assets/01-r2/spike/src/surface-base.ts:7-8` for the two strings; Phase 1 spec AM-013, AM-015, AM-016; findings L3R7-01, L2R9-01, L2R10-01).
  - §17.5 (Transports) says Phase 1 ships recipes for AG-UI, A2A, MCP and SSE and none for WebSocket or `fetch`-stream JSONL (PRD §7.3 item 8; Phase 1 spec AM-012; finding L3R7-03).
  - §17.4 (Renderer) says the surface extends `HTMLElement`, not `LineElement`, and imports no `line-core` module that loads `lit` at run time (Phase 1 spec AM-012, AM-014; findings L3R7-04, L3R8-02).
  - §17.4 (Renderer) cites Phase 1 spec AM-012 and AM-014 for the surface base-class sentence (Phase 1 spec AM-015; findings L3R9-03, L2R9-03).
  - §17.3 (Descriptors and catalogs) says the drift test reads the `line-components` `custom-elements.json`, the manifest that the package build emits (Phase 1 spec §10 SD26, AM-018; finding L3R12-05).
- **v0.8.9 (2026-10-20)** — Aligned with PRD v0.8.23, with coherence review round 4 (ledger row `00-Z48`).
  - §11 (Icon System) says the global slot `globalThis[Symbol.for('line.icon-registry')]` holds `{ registry, events }`, where `events` is an `EventTarget`. `setIconRegistry` and the `LineIcon.registry` setter write `registry` and dispatch `change` on `events`; every `<line-icon>` copy subscribes through the slot while connected and resolves again on `change`, so an element that connects before the registry is set still renders (Phase 1 spec AM-008).
  - §17.3 (Descriptors and catalogs) and §17.4 (Renderer) give the `iconMap` shape: `A2uiIconMap`, a null-prototype frozen object keyed by A2UI name, which the surface reads with `Object.hasOwn`. Setting or replacing `iconMap` projects every Icon node of the surface again (Phase 1 spec AM-008).
  - §17.7 (Stability) says `@websublime/line-icons/a2ui` follows the preview status of `line-genui/a2ui` until A2UI v1.0, because its type and helper feed the preview property `iconMap` (Phase 1 spec AM-008).
- **v0.8.8 (2026-10-20)** — Aligned with PRD v0.8.22, with coherence review round 3 (ledger row `00-Z48`, decisions by Miguel on 2026-10-20).
  - §11 (Icon System) stores the registry at `globalThis[Symbol.for('line.icon-registry')]`, so every copy of `src/shared/icon-registry.ts`, such as separate jsDelivr `+esm` bundles, reads and writes one place. It gives `<line-icon>` a boolean `mirror` attribute that flips the glyph under `:dir(rtl)`, types `options` as `{ weight?: string }`, and says that setting the registry makes connected `<line-icon>` instances resolve again (Phase 1 spec AM-006, decision D-G).
  - §17.3 (Descriptors and catalogs) and §17.4 (Renderer) say the surface maps A2UI icon names through its `iconMap` property, which the consumer fills with `a2uiIconMap(set, { library })` from `line-icons/a2ui`. Only a name absent from `iconMap`, or `iconMap` unset, raises `line-a2ui-error`; a resolver rejection leaves `<line-icon>` neutral with no surface error (Phase 1 spec AM-006, decision D-M).
  - §17.6 (MCP Apps) says one shipped rule reads, on `html`, a primitive the bridge sets, not that it is the only `html` rule that reads primitives (`packages/line-tokens/src/focus-ring.css:16`, `:19`; Phase 1 spec AM-005).
  - §17.8 (Deferred and rejected) says a later phase spec takes up server-side A2UI, because the Phase 1 spec lists it as a non-goal (Phase 1 spec §2, AM-005).
- **v0.8.7 (2026-10-20)** — Aligned with PRD v0.8.21, with coherence review round 2 (ledger row `00-Z48`, decisions by Miguel on 2026-10-20).
  - §11 (Icon System) gives `<line-icon>` a `weight` attribute, which it passes as `options.weight` to `resolve(library, name, options?)`. The registry lives in the shared module `src/shared/icon-registry.ts`; the consumer sets it once with `setIconRegistry(registry)` or `LineIcon.registry`, and `line-genui` never writes it. The `LineIconRegistry` type is exported from the `line-components` root `"."` (Phase 1 spec AM-004, decisions D-W and D-R).
  - §12 (Bundle Splitting Rule) says only `line-components` and `line-genui` omit the `sideEffects` field; the other packages keep theirs (Phase 1 spec §4.3–§4.5, §10 SD4, SD5).
  - §14.8 (State Reflection) says axe's WCCG lookup misses the internals because of the Symbol description and the prototype accessor, not because the Symbol is plain (R8 §2.4; Phase 1 spec AM-004).
  - §17.4 (Renderer) limits the Law 5 reading to the "Lit owns DOM" clause (Phase 1 spec §6.G.4, AM-004).
  - §17.6 (MCP Apps) says the bridge redeclares `--line-focus-ring` on `body` (`packages/line-tokens/src/focus-ring.css:19`; Phase 1 spec AM-004).
- **v0.8.6 (2026-10-20)** — Aligned with PRD v0.8.20, with the Phase 1 coherence review (ledger row `00-Z48`, decisions by Miguel on 2026-10-20).
  - §6 (Base Class — LineElement) shows that `FormAssociated` reuses the `LineElement` internals and only sets `formAssociated` (Phase 1 spec §10 SD19, task C23).
  - §11 (Icon System) says `<line-icon>` takes its registry through the static hook `LineIcon.registry`, which the consumer sets. Any object with `resolve(library, name)` fits, such as the `line-icons` `IconRegistry`, so `line-components` gains no edge to `line-icons` (Phase 1 spec AM-002).
  - §12 (Bundle Splitting Rule) and §13.1 (Button Ecosystem) state the rules the Phase 1 spec decided for `sideEffects`, the build externals and the IconButton name check (Phase 1 spec §10 SD2, SD4, SD36). §13.1 places the shared Button machine in `src/shared/button-machine.ts` (Phase 1 spec AM-002).
  - §14.7 (Reset Module to Component Mapping) gives Presence the `common` module only.
  - §14.8 (State Reflection) says subclasses reach the internals through a Symbol key exported by `line-core`, over an ES `#private` field (Phase 1 spec §10 SD19 as amended by AM-002).
  - §17.3 to §17.6 state the decided rules for the basic catalog id, the provider serialisation, `svgPath`, the AG-UI error, `validationConfig`, the A2A shapes, the View delivery and the bridge primitives (Phase 1 spec §10 SD17, SD33, SD43, SD48, SD52, SD54, SD65, SD66, SD68). §17.4 says a missing child stays hidden until it arrives, and records that Law 5 governs `line-components` components, not the `line-genui` surface (Phase 1 spec AM-002).
  - §17.9 (Phase 1 spec answers) replaces the four open questions with the answers of Phase 1 spec §10 SD19, SD44, SD38 and SD62.
- **v0.8.5 (2026-10-20)** — Aligned with PRD v0.8.19, with corrections from the Phase 1 spec work (ledger row `00-Z46`, decisions by Miguel on 2026-10-20).
  - §13.1 (Button Ecosystem) separates the two meanings of "pressed". The machine models the press itself as `active`, `pressed` is an opt-in toggle with `aria-pressed`, and `loading` and `disabled` are props that the machine's guards read (R7 §2.4, R8 §2.2).
  - §13.1 (Button Ecosystem) records the machines the Phase 1 spec picks. ButtonGroup runs on a custom roving-focus machine, and Chip on the pre-built `@zag-js/toggle` 1.46.0 machine.
  - §14.7 (Reset Module to Component Mapping) gives Chip and AvatarGroup the `common` and `button` modules, because each renders an inner native `<button>` (Phase 1 spec §10).
  - §14.8 (State Reflection) says `LineElement` attaches `ElementInternals` for every component behind a protected `internals` accessor that `FormAssociated` reuses, so every component reflects `:state()` (R8 §2.5).
  - §17.4 (Renderer) corrects the error path. A missing child stays a pending placeholder until it arrives and raises no error. An unknown type reaches the surface as a resolver error. Whether a cycle rejects its message or reaches the resolver depends on the `validationConfig` preset, which the Phase 1 spec sets (R1 §2.5.2, §2.7).
  - §17.6 (MCP Apps) states when line://ui works unchanged in a View. The lazy component chunks must be inlined into the View, or load from a CDN origin that the View declares (R5 §2.2, §5.2).
- **v0.8.4 (2026-10-20)** — Aligned with PRD v0.8.18 (ledger row `00-Z45`, decisions by Miguel on 2026-10-19 (projection technique) and 2026-10-20 (D1–D8)).
  - §6 (Base Class — LineElement) says a component declares its tier by composing a `LineMachineController`, draws the controller outside the `LineElement` tree, lists what `line-core/machine` re-exports, and adds that the controller calls `updateProps` on every host update.
  - §8 (State Management) corrects the computed-state and controller wording, adds `initialState` to the Input example, and notes the pre-built PasswordInput and DateInput machines.
  - §9 (Field Architecture) records that a host ID reference does not reach an inner native element in Firefox or Safari, and leaves the labelling mechanism to the Field spec.
  - §12 (Bundle Splitting Rule) says isolation comes from having no barrel, leaves the `sideEffects` value to the Phase 1 spec, and keeps `@websublime/*` external in the library builds.
  - §13.1 (Button Ecosystem) drops "TypeScript enforced" for IconButton, makes ButtonGroup a toolbar with roving focus, and adds Chip as a toggle button.
  - §13.6 (Editable) names the `@zag-js/editable` states. §14.7 gives Chip its own reset row, which the Phase 1 spec settles. §14.8 gives the `:state()` support range.
  - §17.3 (Descriptors and catalogs) sets the catalog validation, names the basic catalog id in full, limits the flat-schema rule to frontend-tool parameters, corrects the form-association note, and leaves `svgPath` to the spec.
  - §17.4 (Renderer) states the projection technique, the error path and the focus rule.
  - §17.5 (Transports) states the A2A payload shapes upstream uses and leaves the accepted shape to the spec, splits the SSE framing, and says how recipes pin the middleware. §17.6 (MCP Apps) names the bridge targets.
- **v0.8.3 (2026-10-13)** — Aligned with PRD v0.8.17 (ledger row `00-Z27`, decision by Miguel on 2026-10-13).
  - §17.4 (Renderer) says the Phase 1 research stage decides the projection technique before the spec.
- **v0.8.2 (2026-10-12)** — Aligned with PRD v0.8.15 (ledger row `00-Z17`, decision by Miguel on 2026-10-12).
  - §17.2 (Agent contract) gains rule C9. A value-bearing or compound component names exactly one commit event, and the rule defines a compound component. The contract now has rules C1–C9.
  - §17.3 (Descriptors and catalogs) points the binding map's commit event at rule C9.
  - §6 (Base Class — LineElement) rewrites the HTMX paragraph. Components work with htmx through native paths, a Playwright harness guards them, and `LineHtmxElement` is deferred past 1.0.
  - §17.8 (Deferred and rejected) rewords the trigger for server-side A2UI → `<line-*>` HTML, because the H1 spike reported on 2026-10-12.
- **v0.8.1 (2026-10-07)** — Aligned with PRD v0.8.6 (ledger row `00-Z11`, decision by Miguel on 2026-10-07).
  - §17 (Agent-Driven UI) added. It covers the layers, the agent contract (rules C1–C8) that every component spec states, descriptors and catalogs, the light-DOM `<line-a2ui-surface>` renderer, transports, the MCP Apps theming bridge, the preview policy, and the deferred items. Evidence lives in `docs/research/00-research-generative-ui.md`.
  - §12 (Bundle Splitting Rule) gains a note that `line-genui` loads component subpaths lazily.
  - §9 (Field Architecture) gains the `line-input` live-edit event that §17.2 rule C3 defines.
- **v0.8.0 (2026-05-19)** — Realigned with PRD v0.8.3 and the revised Manifesto.
  - §4 (CSS Customisation — Dual Layer) rewritten to reflect the layered design system: components now consume **role-namespaced** tokens (`--line-accent-*`, `--line-gray-*`, `--line-success/warning/danger/info-*`) plus the **9 named aliases per role** (`-surface`, `-bg`, `-bg-hover`, `-bg-active`, `-border`, `-solid`, `-solid-hover`, `-text-low`, `-text`) and the sibling **`--line-{role}-contrast`** static token. References to v0.7 single-colour semantic globals (`--line-background`, `--line-solid-background`, `--line-primary-*` as direct hue tokens) removed.
  - §6 (Base Class — LineElement) — Zag.js lifecycle now integrates via the first-party `LineMachineController` (Lit `ReactiveController` exported from `@websublime/line-core/machine`), which wraps `@zag-js/vanilla` primitives. Phase 0 builds this adapter; components never import `@zag-js/vanilla` directly. See PRD v0.8.3 revision note and §2.1.
  - §11 (Icon System) — clarified that `@websublime/line-icons` is **orthogonal to the design system**: it is a separate, optional library. Components consume icons via **slots**; consumers may use `line-icons`, Lucide, Phosphor, Iconoir, or any other library.
  - §12 (Bundle Splitting Rule) — restated under the **umbrella package model**: a single `@websublime/line-components` package with per-component subpath exports, `customElements.define()` as the sole side-effect, declared via the `sideEffects` field. Not per-component packages.
  - Throughout: replaced class-based theming (`.line-schema-X`) with attribute-based theming (`[data-accent]` / `[data-gray]`); replaced the v0.7 28-palette set with Radix Colors 3.x 31 hues; replaced "inverted dark scale" wording with the Radix invariant **semantic-by-step** (step N has the same role in light and dark; pixel values differ).
  - Section headings whose anchors are referenced from PRD §3 are **not renamed** (see §2, §3, §4, §5, §7, §8, §9, §12 below).
- **v0.7.0 (2026-03-12)** — Initial extraction from PRD v0.7.0 §3 (Component Architecture). Superseded in design-system surface area by v0.8.0.

---

## 1. Component Anatomy

```
┌──────────────────────────────────────────────┐
│  <line-dialog>                               │
│                                              │
│  ┌─────────────┐   ┌──────────────────────┐  │
│  │  Zag.js     │   │  Lit                 │  │
│  │  Machine    │──▶│  Shadow DOM          │  │
│  │             │   │                      │  │
│  │  - State    │   │  <div part="overlay">│  │
│  │  - A11y     │   │  <div part="content">│  │
│  │  - Keyboard │   │  <slot>              │  │
│  │  - Focus    │   │  <slot name="title"> │  │
│  └─────────────┘   └──────────────────────┘  │
│                                              │
│  CSS Parts exposed:                          │
│  ::part(overlay) ::part(content)             │
│  ::part(title) ::part(close)                 │
│                                              │
│  Inspector metadata (feature flag):          │
│  version, docs link, scope, qa              │
└──────────────────────────────────────────────┘
```

**Flow:** Zag.js manages all logic (state, transitions, a11y, keyboard, focus trapping) → Lit renders shadow DOM with `part` attributes on every relevant element → Consumer styles via `::part()` or by consuming role/alias variables (`--line-accent-*`, `--line-{role}-bg`, …) exposed by the layered design system (`line-tokens` + `line-colors` + `line-themes`, optionally with `line-schemas` / `line-utils`).

---

## 2. Composition Model

**Hybrid approach:**

- **Simple components** (button, badge, avatar, toggle) — Single custom element with slots. No benefit in fragmenting.
- **Complex components** (dialog, combobox, menu, tabs, accordion) — Composable sub-components. Each sub-component exposes its own `::part()` selectors. The consumer decides what to render and where.

**Simple component example:**

```html
<line-button>
  <line-icon slot="prefix" name="check"></line-icon>
  Save
</line-button>
```

**Complex component example (Radix-style):**

```html
<line-dialog>
  <line-dialog-trigger>
    <button>Open</button>
  </line-dialog-trigger>
  <line-dialog-content>
    <line-dialog-title>Title</line-dialog-title>
    <line-dialog-close></line-dialog-close>
    <p>Content</p>
  </line-dialog-content>
</line-dialog>
```

**Composition via slot (Field + Input):**

```html
<line-field>
  <span slot="label">
    Email <line-icon name="info" size="xs"></line-icon>
  </span>
  <line-input type="email" required>
    <line-icon slot="prefix" name="mail"></line-icon>
  </line-input>
  <span slot="hint">We use your email for login</span>
  <span slot="error">
    <line-icon name="alert-circle"></line-icon>
    Invalid email address
  </span>
</line-field>
```

The Field does not import the Input. The Input does not know the Field exists. Both work standalone. Connected via `<slot>` and events.

---

## 3. Slot vs Internal Part — Decision Rule

Components expose **slots** for content the consumer controls, and **internal parts** for elements the component must coordinate with its state machine.

| Who controls the action? | Approach | Examples |
|--------------------------|----------|----------|
| Consumer decides content and behaviour | **Slot** | prefix, suffix icons; label, hint, error text |
| Component needs to coordinate state/action | **Internal part** | password toggle, clear button, increment/decrement steppers |

A prefix icon is a slot — the component doesn't know or care what it is. A password visibility toggle is an internal part — the component must toggle the input `type` between "password" and "text" when clicked. A clear button is an internal part — it must call `CLEAR` on the machine.

---

## 4. CSS Customisation — Dual Layer

Two surfaces, one strategy. Use **CSS custom properties** for token-level adjustments. Use **`::part()`** for total visual control. Both ship by default on every styleable zone (Manifesto Principle 4).

**Layer 1: Custom properties — Quick adjustments**

Custom properties form three concentric tiers (full cascade documented in PRD §9.11). Components consume from each tier; consumers override at any tier.

| Tier | Origin | Examples |
|------|--------|----------|
| **Foundation tokens** | `@websublime/line-tokens` (L0) | `--line-size-3`, `--line-radius-2`, `--line-shadow-3`, `--line-easing-out`, `--line-z-overlay`, `--line-motion-fast` |
| **Palette tokens** | `@websublime/line-colors` (L1) | `--line-amber-1..12`, `--line-amber-contrast`, `--line-slate-1..12`, … (31 hues × 12 steps; `light-dark()` per step; static single-value `--line-{hue}-contrast`) |
| **Role tokens (numeric)** | `@websublime/line-themes` (L3) | `--line-accent-1..12`, `--line-gray-1..12`, `--line-success-1..12`, `--line-warning-1..12`, `--line-danger-1..12`, `--line-info-1..12`, plus the sibling `--line-{role}-contrast` (one per role; static single value; not wrapped in `light-dark()`) |
| **Role aliases (named)** | `@websublime/line-themes` (L3) | `--line-{role}-surface` (step 2), `-bg` (step 3), `-bg-hover` (step 4), `-bg-active` (step 5), `-border` (step 7), `-solid` (step 9), `-solid-hover` (step 10), `-text-low` (step 11), `-text` (step 12) — 9 aliases × 6 roles = 54 alias variables |
| **Component tokens** | Defined inside `:host` by each component | `--line-button-radius`, `--line-button-bg`, `--line-button-color`, … (always `--line-{component}-{prop}`) |

```css
/* Adjust component tokens on the host element */
line-button {
  --line-button-radius: var(--line-radius-round);
  --line-button-height: 3rem;
  --line-button-font-size: var(--line-font-size-3);
  /* Re-bind the solid surface to a different role: */
  --line-button-bg: var(--line-danger-solid);
  --line-button-color: var(--line-danger-contrast);
}
```

**Components consume role/alias tokens, never hue tokens directly.** A `<line-button>` resolves its primary surface as `var(--line-accent-solid)` (or `var(--line-accent-9)` in numeric form) plus `var(--line-accent-contrast)` for the foreground. The hue currently bound to the `accent` role is determined by `data-accent` on an ancestor (default: `indigo`). This is the single rule that makes attribute-based theming work — see [PRD §9.4 (Theme Application)](./PRD.md) for the full design rationale.

**Layer 2: `::part()` — Total control over internal elements**

```css
line-button::part(root) {
  background: linear-gradient(135deg, pink, purple);
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

Component tokens follow the `--line-{component}-{prop}` convention. Consumers override these for quick adjustments. `::part()` provides total control for consumers who want absolute customisation. Complementary, not redundant.

**Token naming conventions (Manifesto Law 2):**

| Prefix | Layer | Examples |
|--------|-------|----------|
| `--line-{family}-{step}` | Foundation tokens (`line-tokens`) | `--line-radius-2`, `--line-size-3`, `--line-shadow-2` |
| `--line-{hue}-{step}` | Palette tokens (`line-colors`) | `--line-blue-9`, `--line-slate-12`, `--line-amber-3` |
| `--line-{hue}-contrast` | Palette contrast tokens (`line-colors`) | `--line-blue-contrast`, `--line-amber-contrast` (static; not `light-dark()`) |
| `--line-{role}-{step}` | Role tokens (`line-themes`) | `--line-accent-9`, `--line-gray-3`, `--line-danger-2` |
| `--line-{role}-{alias}` | Role aliases (`line-themes`) | `--line-accent-solid`, `--line-gray-bg-hover`, `--line-danger-text` |
| `--line-{role}-contrast` | Role contrast token (`line-themes`) | `--line-accent-contrast` (static; resolves through the active hue) |
| `--line-{component}-{prop}` | Component tokens | `--line-button-radius`, `--line-input-padding-x` |

All public custom properties we author are `--line-*` prefixed. Standard HTML hooks (`data-accent`, `data-gray`, ARIA attributes, etc.) follow web conventions and are exempt (Manifesto Law 2).

**Theme application is attribute-based (no class-based theming).** Themes are not entities — a theme is the `(accent, gray)` pair selected via two independent attributes on any element:

```html
<html data-accent="indigo">                              <!-- default accent + auto-paired slate -->
<html data-accent="amber" data-gray="slate">             <!-- explicit accent + explicit gray -->
<section data-accent="violet">…</section>                <!-- scoped theming nests naturally -->
```

Because `accent` and `gray` namespaces are independent, multiple colour contexts can coexist on the same page without conflict. Semantic roles (`success`, `warning`, `danger`, `info`) are **fixed at `:root`** and never re-skinned by theme choice — a red error and a green success are usability invariants.

**Light/dark via `light-dark()`** — palette tokens (`line-colors`) are mono-declaration; the active value is chosen by the computed `color-scheme` property. Each step has a **fixed semantic function** identical in light and dark (step 1 is always app background; step 9 is always solid brand; step 12 is always high-contrast text). The pixel values differ between modes; the role of step N never changes (Radix invariant — see PRD §9.2).

---

## 5. CSS Parts Naming Convention

```css
::part(root)        /* Main container */
::part(trigger)     /* Activating element */
::part(content)     /* Content area */
::part(overlay)     /* Backdrop/overlay */
::part(title)       /* Title */
::part(description) /* Description */
::part(close)       /* Close button */
::part(icon)        /* Icon */
::part(indicator)   /* State indicator */
::part(separator)   /* Separator */
::part(item)        /* Item in lists */
::part(label)       /* Label */
::part(input)       /* Internal input */
::part(toggle)      /* Toggle element (e.g., password visibility) */
::part(clear)       /* Clear/dismiss button */
::part(increment)   /* Increment stepper */
::part(decrement)   /* Decrement stepper */
::part(remove)      /* Remove button (e.g., dismiss of a removable item) */
::part(loading)     /* Loading content wrapper (e.g., button spinner and text) */
::part(overflow)    /* Overflow indicator (e.g., avatar group +N) */
```

Short, semantic names reused across components. A developer who learns the parts of one component already knows others.

---

## 6. Base Class — LineElement

**Note:** The current codebase uses `ComponentElement` with `ComponentMixin`. The refactoring to `LineElement` is a Phase 0 task (PRD §7.2).

```
LitElement
  └── LineElement (refactored base class)
        ├── Inspector mixin (feature flag via localStorage)
        ├── Metadata mixin (version, docs, qa)
        ├── Direction mixin (LTR/RTL)
        └── FormAssociated mixin (opt-in formAssociated; reuses LineElement internals)
              │
              ├── Pre-built machine components — compose a `LineMachineController`
              │     ├── LineDialog (uses @zag-js/dialog)
              │     └── ...
              ├── Custom machine components — compose a `LineMachineController`
              │     ├── LineInput (uses custom createMachine)
              │     └── ...
              └── Static components (no machine)
                    ├── LineBadge
                    └── ...

LineMachineController — Lit `ReactiveController`, exported from `@websublime/line-core/machine`, wraps `@zag-js/vanilla`
```

A component declares its tier by composing a `LineMachineController` with a pre-built Zag.js machine or a custom `createMachine()` result, or by composing none (static). `LineElement` holds no machine. Each component owns its controller, and static components carry no machine overhead.

`LineElement` attaches `ElementInternals` for every component (§14.8). The `FormAssociated` mixin reuses those internals and sets `formAssociated` (Phase 1 spec §10 SD19, task C23).

**Zag.js integration is via the first-party `LineMachineController` adapter** (Lit `ReactiveController` exported from `@websublime/line-core/machine`). The adapter wraps the framework-agnostic `@zag-js/vanilla` package (`VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`) and provides:

- **Lit-aware reactivity.** `host.requestUpdate()` is called on each machine state transition, so Lit re-renders deterministically.
- **Lifecycle management.** Machine starts in `hostConnected` (subscribes to state); stops in `hostDisconnected` (unsubscribes). No manual `connectedCallback`/`disconnectedCallback` plumbing in component subclasses.
- **Host props into the machine.** The controller hands the component's props function to the machine at start and calls `updateProps({})` on every host update. The empty patch adds no props source and still notifies the machine, so it re-reads the live function. A component declares its machine props as a function of its properties, so controlled props and prop `watch` effects follow host property changes.
- **Graceful failure (Manifesto Law 9).** If the machine fails to start, the controller flags fallback mode and the component renders a static state. No uncaught error propagates.
- **Single import surface.** Re-exports `normalizeProps`, `spreadProps`, `mergeProps`, `VanillaMachine` and the type `Attrs` from `@zag-js/vanilla`, so component authors import from one place: `@websublime/line-core/machine`. It leaves out `toStyleString`, which `@zag-js/vanilla` has exported since 1.44.0. **No component imports `@zag-js/vanilla` directly** — the adapter is the single point of maintenance for Zag API changes. Note: `bindable` is **not** re-exported because `@zag-js/vanilla` does not publicly export it. It is an internal Zag helper accessed inside machine configs via the `context({ bindable })` callback (see §8 example).

There is **no first-party Lit adapter in Zag's monorepo** (`packages/frameworks/` contains only `preact`, `react`, `solid`, `svelte`, `vanilla`, `vue`) — `LineMachineController` is the line://ui adapter, authored in Phase 0 (PRD §7.2).

**Failure mode (Manifesto Principle 9 / Law 9):** if a machine fails to initialise, the component renders in a static fallback state and never throws an uncaught error at the consumer.

**HTMX through native paths.** Components work with htmx through native paths. These paths are host-level `hx-*` attributes, `hx-*` attributes on slotted light-DOM children, a form-associated value inside an htmx form, and the §17.2 rule C9 commit event as `hx-trigger`. A Playwright harness guards those paths on htmx 2 and htmx 4 in chromium, firefox and webkit (PRD Appendix A). A host-level `click` trigger on a compound host fires for every click inside its shadow root, as the H1 `hostNative` check showed. Consumers therefore trigger on the commit event. The H1 spike ended exploratory on 2026-10-12. `LineHtmxElement` is deferred as a nice-to-have after 1.0, and `packages/line-core/__experimental__/htmx/` stays as an unbuilt reference. The evidence lives in `docs/retrospective/00-phase-00-retro.md`. No component in this document depends on an HTMX adapter.

---

## 7. Form Association Strategy

All form control components implement `static formAssociated = true` and use `ElementInternals` to participate in native HTML `<form>` elements. This is handled as an opt-in mixin in the base class.

**What `formAssociated` provides natively:**

- A focused `<line-button type="submit">` submits its form on Enter or Space. Implicit submission (Enter in a text field) never picks a custom element as the form's default button, because the platform considers only native submit buttons (WICG/webcomponents#814; spec `0002-button.md`)
- `<line-input name="email">` appears in `FormData` automatically
- `<line-button type="reset">` resets all form controls
- HTML5 validation (`required`, `pattern`, `minlength`) works natively
- `:invalid`/`:valid` CSS pseudo-classes work
- `form.checkValidity()` and `form.reportValidity()` work

**What line://ui does NOT provide:**

- No `<line-form>` wrapper component. Each framework has its own form management solutions. Nice-to-have post-1.0.
- No cross-field validation orchestration. This is application-level logic.

**Form-associated components:** Button, Input, PasswordInput, SearchInput, DateInput, Textarea, Select, Checkbox, RadioGroup, Switch, NumberInput, Editable, ToggleGroup, Slider, Combobox, DatePicker, TimePicker, ColorPicker, PinInput, Rating, RangeSlider, FileUpload, TagInput, MentionInput, SearchField.

---

## 8. State Management — Unified via Zag.js

**Three tiers of state management:**

| Tier | What | When to use | Examples |
|------|------|-------------|----------|
| **Pre-built machine** | Uses existing `@zag-js/*` package | Complex components where Zag.js provides a production-ready machine | Dialog, Select, Combobox, Tabs, Accordion |
| **Custom machine** | Uses `createMachine()` from `@zag-js/core` | Interactive components with states where no pre-built machine exists | Input, Textarea, Field, Tag Input, Search Field |
| **Static** | No machine | Purely presentational components with zero interaction state | Badge, Separator, Skeleton, VisuallyHidden, Center |

`@zag-js/password-input` and `@zag-js/date-input` exist at 1.47.0, so PasswordInput and DateInput have pre-built candidates. The Phase 2 spec settles their tier.

**Why custom machines for "simple" components like Input:**

Components like Input, Textarea, and Field have rich interaction states: focus/blur, error/invalid, disabled, readonly, empty/filled, loading, required. With a custom Zag.js machine, every interactive component gets: explicit state transitions, computed states (derived on read; the vanilla adapter does not memoize them), controlled/uncontrolled via `bindable`, guards preventing invalid transitions, watch for reactive side effects, and inspector integration. Controlled props and prop `watch` effects follow the host because the machine reads its props through a function and the controller passes every host update to it (§6).

**Lifecycle and integration.** Both pre-built and custom machines are wired into the component via `LineMachineController` (see §6). The component creates the machine config (or imports a pre-built one), instantiates the controller in its constructor (`#ctrl = new LineMachineController(this, { machine, props })`, with `props` a function of the host properties), and the controller handles `subscribe / start / stop / updateProps / requestUpdate` automatically. Component code never imports `@zag-js/vanilla` directly.

**Custom machine example — Input:**

```typescript
import { createMachine } from '@zag-js/core';
import { LineMachineController, normalizeProps, spreadProps } from '@websublime/line-core/machine';

const machine = createMachine<InputSchema>({
  props({ props }) {
    return { disabled: false, required: false, readOnly: false, ...props }
  },
  initialState() {
    return "idle"
  },
  context({ prop, bindable }) {
    return {
      value: bindable(() => ({
        defaultValue: prop("defaultValue") ?? "",
        value: prop("value"),
        onChange(value) { prop("onChange")?.({ value }) }
      })),
      error: bindable(() => ({ defaultValue: "" })),
    }
  },
  computed: {
    isEmpty({ context }) { return context.get("value") === "" },
    isInvalid({ context }) { return context.get("error") !== "" },
  },
  states: {
    idle: {
      on: { FOCUS: { target: "focused" } }
    },
    focused: {
      on: {
        BLUR: { target: "idle", actions: ["validate"] },
        CHANGE: { actions: ["setValue"] },
      }
    }
  }
})
```

**Collections for item-based components:**

Zag.js provides `ListCollection` and `TreeCollection` from `@zag-js/collection`. These provide navigation, search, filtering, reordering, and disabled item support. Collections are immutable.

- **Pre-built machines using collections:** Select, Combobox, Menu, Tree View
- **Custom machines + collections:** Tag Input, List View, Kanban Board, Search Field

---

## 9. Field Architecture

The Field is the orchestrator that connects labels, hints, errors, and required indicators to any form control. It does not import any specific control — it uses `<slot>` and events.

**Slots:** `label` (free content), `default` (the form control), `hint` (help text), `error` (error message — visible in error state).

**Host data attributes:** `data-focused`, `data-filled`, `data-error`, `data-disabled`, `data-readonly`, `data-required`.

**State detection priority:**
1. Explicit props — `<line-field error>` overrides everything
2. Child events — `line-focus`, `line-blur`, `line-change`, `line-invalid`, `line-valid`
3. Native validity — via `formAssociated` + `ElementInternals`

**Label connection:** Field generates unique ID and forwards clicks on label to `.focus()` on child. An `aria-labelledby` ID reference on the child host does not reach a role on an inner native element in Firefox or Safari. It works only with a host role, a reference target (Chrome only) or element reflection. The Field spec picks the mechanism.

**Required indicator:** `::part(indicator)` — consumer/theme styles it. Uses the shared `indicator` part name from §5 (semantic: "state indicator").

**Floating label:** NOT built in. `data-focused` and `data-filled` enable it via pure CSS. Pattern documented in Storybook.

**Field-compatible controls (any component that):**
1. Emits `line-focus`, `line-blur`, `line-change`, `line-invalid` events
2. Has `formAssociated: true`
3. Accepts `.focus()` programmatically

**Live edits:** value-bearing controls also emit `line-input` with `detail.value` on every live edit (§17.2, rule C3). Field state detection does not depend on it.

---

## 10. Component File Structure

```
packages/line-components/src/dialog/
├── dialog.ts              ← <line-dialog> root
├── dialog-trigger.ts      ← <line-dialog-trigger>
├── dialog-content.ts      ← <line-dialog-content>
├── dialog-title.ts        ← <line-dialog-title>
├── dialog-close.ts        ← <line-dialog-close>
├── dialog.types.ts        ← Types/interfaces
└── index.ts               ← Public exports
```

---

## 11. Icon System

Icons are **orthogonal to the design system.** `@websublime/line-icons` is a separate, optional icon library that shares the line://ui brand and naming conventions but is **not** one of the five design-system packages (`line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils`). This mirrors the Radix Themes / `@radix-ui/react-icons` split (PRD §6.1, §9.1).

**Components consume icons via `<slot>`, not by importing an icon library** (Manifesto Law 4: composition over inheritance, slots over props for content). A `<line-button>` does not import `<line-icon>`; it exposes a `prefix` slot that the consumer fills with whatever icon element they prefer — `<line-icon>`, a Lucide SVG, a Phosphor component, an Iconoir tag, a raw inline `<svg>`, or anything else.

```html
<line-button>
  <line-icon slot="prefix" name="check"></line-icon>
  Save
</line-button>

<line-button>
  <svg slot="prefix" viewBox="0 0 24 24"><!-- raw SVG --></svg>
  Save
</line-button>
```

**`<line-icon>` (when used) is an abstract wrapper with an agnostic registry:**

```html
<line-icon name="check" library="phosphor"></line-icon>
<line-icon name="arrow-right" library="lucide"></line-icon>
<line-icon src="/my-icons/custom.svg"></line-icon>
```

- `line-icon` reads its **registry** from a shared module, `src/shared/icon-registry.ts`. The module keeps a slot at `globalThis[Symbol.for('line.icon-registry')]` that holds `{ registry, events }`, where `events` is an `EventTarget`. The module creates the slot on first access (`setIconRegistry`, the `LineIcon.registry` getter or setter, or a `<line-icon>` connect), never at module load, so `define()` stays the only module-top side effect of `./icon` and the root defines and creates nothing (§12; Phase 1 spec AM-010). Every copy, such as separate jsDelivr `+esm` bundles or another version, reads and writes one place (Phase 1 spec AM-006, decision D-G; AM-008). The consumer sets it with `setIconRegistry(registry)` exported from the `line-components` root `"."` (which defines no element, §12) or through the static hook `LineIcon.registry`; both write `registry` in that slot and dispatch a `line-icon-registry-change` event on `events`. The event name carries the Law 2 prefix, because it is a cross-copy, cross-version contract (Phase 1 spec AM-010). Every `<line-icon>` copy subscribes to `events` through the slot when it connects, unsubscribes when it disconnects, and resolves again on `line-icon-registry-change`, so an element that connects before the registry is set still renders (Phase 1 spec AM-008). The registry is any object that satisfies `LineIconRegistry`, `resolve(library: string, name: string, options?: { weight?: string }): Promise<string | SVGElement>`, such as the `line-icons` `IconRegistry`. `<line-icon>` has a `weight` attribute, which it passes as `options.weight`, and a boolean `mirror` attribute; with `mirror` set, its own CSS flips the glyph under `:dir(rtl)`. On the agent path the surface sets `weight` and `mirror` from its `iconMap` entry (§17.4). `line-components` defines and exports the `LineIconRegistry` type from its root, so it gains no edge to `line-icons`. `line-genui` never writes the registry; its docs show the consumer line (Phase 1 spec §10 SD15, AM-004, AM-006).
- Each library is a resolver: given a name, returns the SVG.
- Zero icons bundled in `line-icons` core — the consumer brings their own resolver (Lucide, Phosphor, Iconoir, `@radix-ui/react-icons`, custom).
- Dependency direction is one-way: `line-icons → line-tokens` is permitted (icons reuse icon-size / sizing tokens); the inverse is forbidden.

---

## 12. Bundle Splitting Rule

> Sub-components of a family share a single entrypoint. Independently usable components have separate entrypoints. A component belongs to a family when it requires its parent to function. Components connected via `<slot>` are always separate entrypoints — slots imply independence.

**Umbrella package, not per-component packages (Manifesto Law 6).** All components ship inside a single `@websublime/line-components` package with **one version and one changelog**. Each component family or independent component is exposed as a **subpath export** in `package.json` — `@websublime/line-components/button`, `@websublime/line-components/dialog`, etc. There is no central barrel that imports every component; the root `"."` export is intentionally minimal (types and shared utilities only). This is **not** a Lerna-style "one package per component" layout — the umbrella keeps a single source of truth while subpath exports preserve tree-shaking and bundle isolation.

**Side-effect contract.** Each component file calls `customElements.define()` at module top — this is the **only** side-effect. Importing one component never imports or executes another. There is no barrel, so a consumer that imports one subpath pulls in only that subpath's module graph, and unused subpaths never enter the bundle. The `"sideEffects"` field does not provide this isolation, because listing a file keeps it in the bundle and an entry-file list drops registrations whose `define()` sits in a shared chunk. `line-components` and `line-genui` therefore omit the field and use the default Rolldown chunks; the other packages keep theirs (Phase 1 spec §4, §4.3–§4.5, §10 SD4, SD5). A registration harness, an isolation scan and one esbuild consumer bundle verify the split on the packed tarball (Phase 1 spec §7.5, §10 SD4).

**Shared runtime stays external.** The library builds keep `@websublime/*` external, so a consumer that imports `line-core` and a component gets one `LineElement` class. A copy of `line-core` inlined into `line-components` would give two classes, and `instanceof` would fail. Each build derives `external` from its manifest's `dependencies` and `peerDependencies`, plus the package's own name, so every bare specifier in `dist/` is declared or is a self-reference through the package's `exports` (Phase 1 spec §10 SD2, AM-050).

```js
// Consumer imports surgically — registers only what is used
import '@websublime/line-components/button';
import '@websublime/line-components/field';
import '@websublime/line-components/input';
```

A button must not drag in a dialog.

**Families (single entrypoint):**

| Entrypoint | Registers |
|------------|-----------|
| `./dialog` | line-dialog, line-dialog-trigger, line-dialog-content, line-dialog-title, line-dialog-close |
| `./tabs` | line-tabs, line-tab-list, line-tab-trigger, line-tab-content |
| `./accordion` | line-accordion, line-accordion-item, line-accordion-trigger, line-accordion-content |
| `./menu` | line-menu, line-menu-trigger, line-menu-content, line-menu-item, line-menu-separator |
| `./select` | line-select, line-select-trigger, line-select-content, line-select-item, line-select-group |
| `./combobox` | line-combobox, line-combobox-input, line-combobox-content, line-combobox-item |
| `./popover` | line-popover, line-popover-trigger, line-popover-content |
| `./tooltip` | line-tooltip, line-tooltip-trigger, line-tooltip-content |
| `./toast` | line-toast, line-toast-group |
| `./menubar` | line-menubar, line-menubar-menu, line-menubar-trigger, line-menubar-content, line-menubar-item |

**Independent entrypoints:** `./button`, `./icon-button`, `./button-group`, `./split-button`, `./input`, `./password-input`, `./search-input`, `./date-input`, `./textarea`, `./field`, `./fieldset`, `./icon`, `./alert`, `./chip`, `./avatar`, `./avatar-group`, `./presence`, `./spinner`, `./editable`, etc.

**There is no convenience "import everything" barrel.** Consumers explicitly import the subpaths they need. The root `"."` export is intentionally minimal (types and shared utilities only). This enforces bundle isolation by construction (Manifesto Law 6) — no consumer can accidentally drag in the full catalogue with a single import.

**`line-genui` keeps the rule.** `@websublime/line-genui` loads component subpaths lazily from its catalog, through one `import()` per descriptor on the first sight of a type, and never defines component tags eagerly (§17.4).

---

## 13. Detailed Component Decisions

Architectural decisions for specific components that were debated and resolved. These inform the individual `docs/specs/` files but are documented here because they establish patterns reused across the catalogue.

### 13.1 Button Ecosystem

- **Button** — Custom machine, `formAssociated: true`, supports `type="submit|reset|button"`, slots: prefix/suffix/default/loading. The machine models the press itself as `idle → active`. `pressed` is an opt-in toggle that sets `aria-pressed`. `loading` and `disabled` are props that the machine's guards read. All four reflect as `data-*` attributes and `:state()` (§14.8). Loading state is headless (state only, no bundled spinner); the `loading` slot inside `::part(loading)` renders only while loading. `variant` is a reflected enum, `default | primary | borderless`. A submit activation clicks a temporary native submit button in the form, so `name`, `value` and the `form*` overrides behave natively (spec `0002-button.md`).
- **IconButton** — Separate component, `aria-label` required, same machine as Button. The shared machine lives in `packages/line-components/src/shared/button-machine.ts`, which Button and IconButton both import. Law 4 does not cover it because it is not a component (Phase 1 spec AM-002). TypeScript cannot check the name in markup or on elements the A2UI surface creates by tag at run time. The descriptor therefore requires the name, the surface rejects a nameless node, and the axe gate covers hand-written markup (Phase 1 spec §10 SD36).
- **ButtonGroup** — `role="toolbar"` with roving focus (APG Toolbar). Arrow keys move between the buttons, and the group is one Tab stop. A custom roving-focus machine drives it, because `@zag-js/toolbar` ships only pre-release versions (`latest` and `next` are 2.0.0-next.x on 2026-10-20). Border collapse, slot-based (does NOT import Button).
- **SplitButton** — Custom, Phase 3 (depends on Button + Menu), bundles both internally.
- **ToggleButton** — NOT a separate component; use ToggleGroup with single item or Button with `pressed` state.
- **Chip** — A toggle button with `aria-pressed`, Phase 1. It runs on the pre-built `@zag-js/toggle` 1.47.0 machine and carries no remove button.

### 13.2 Avatar Group

- **Avatar** — Static, slots: default/fallback/status, parts: root/image/fallback.
- **AvatarGroup** — Custom machine (NOT static), states: `collapsed ↔ expanded ↔ overflow_open`. Hover expands, click on overflow opens popover. Props: max, size, spacing.

### 13.3 Input Decomposition

- **Input** — Custom machine, `formAssociated: true`, slots: prefix/suffix, detects autofill.
- **PasswordInput** — Separate. Internal `toggle` part (not slot) because it must coordinate `type` toggle.
- **SearchInput** — Separate. Internal `clear` part (not slot) because it must call `CLEAR` on machine.
- **DateInput** — Separate, Phase 2. Masked segments. No popup. Different from DatePicker (Phase 4).
- **Textarea** — Separate, Custom machine, auto-resize, `formAssociated: true`.

### 13.4 DateInput vs DatePicker

- **DateInput** (Phase 2) — masked text field, segment navigation, no popup, `formAssociated`.
- **DatePicker** (Phase 4) — calendar popup via Zag.js, accepts any trigger via slot including DateInput.
- Composition: `<line-date-picker><line-date-input slot="trigger"></line-date-input></line-date-picker>`

### 13.5 Spinner

- Static, no machine. CSS-only. Parts: root. Props: size, speed, label.
- Button's `::part(loading)` is independent — Spinner is composed via slot when needed.

### 13.6 Editable

- Pre-built (`@zag-js/editable`). Click-to-edit inline text.
- Machine: preview → edit → preview (`@zag-js/editable` states). Escape reverts.
- All sub-components are internal parts (not slots) — must coordinate read↔edit transition.
- `formAssociated: true`.

### 13.7 Menubar

- Custom machine coordinating N `@zag-js/menu` instances.
- Tracks `activeMenuIndex`, hover-to-open when sibling open, arrow key nav between triggers.
- Different from NavigationMenu (site nav) — Menubar is desktop-app chrome.
- Family entrypoint.

---

## 14. Browser Defaults Neutralisation

### 14.1 The Problem

Browsers impose default styles, pseudo-classes, and behaviours on native HTML elements. These defaults differ across Chrome (Blink), Safari (WebKit), and Firefox (Gecko).

line://ui must neutralise ALL of these defaults so that every component renders identically across browsers, with zero visual opinion. The consumer or theme controls everything.

### 14.2 Three Layers of Neutralisation

| Layer | What it solves | Who is responsible |
|-------|---------------|-------------------|
| **Shadow DOM isolation** | Document-level styles (body margins, heading sizes, link colours) do NOT leak into components | Automatic — Shadow DOM provides this |
| **Internal CSS reset** | Native elements INSIDE shadow DOM (`<input>`, `<button>`, `<textarea>`) still receive browser defaults. Must be neutralised. | Modular reset sheets, each component imports only what it needs |
| **State reflection** | Native pseudo-classes (`:disabled`, `:required`, `:checked`, `:focus-visible`, etc.) don't work on custom elements. Must be replicated via host attributes and `CustomStateSet`. | Zag.js machine + `LineElement` base class |

**Two distinct reset systems** — these serve **different DOM contexts** and must not be confused:

| System | Lives in | DOM context | When applied | Documented in |
|---|---|---|---|---|
| **Shadow-DOM internal resets** | `@websublime/line-core/styles/reset.*.css` (modular, per-element category) | Inside each component's shadow root, on the native elements it renders (`<input>`, `<button>`, etc.) | Automatic via `static styles` on each component | §14.3–§14.7 |
| **Light-DOM consumer reset** | `@websublime/line-tokens/reset` (single file, opt-in subpath) | Outside components — on slotted content (`<h2 slot="title">`, `<p>`), or anywhere in the consumer's light DOM | Manual — consumer `@import`s it once at the top of their app CSS | §14.10 |

The shadow-DOM resets are **internal infrastructure** — components carry them automatically, and a consumer never imports them. The light-DOM reset is an **optional convenience** for consumers who want a baseline on the surrounding page; consumers using their own reset (`normalize.css`, modern resets) skip it. Both apply zero opinion — they neutralise defaults without introducing colour, spacing, or typography.

### 14.3 Modular CSS Reset — Zero Overhead Per Component

**Principle: a component never carries CSS for elements it doesn't render.** A `<line-badge>` has no `<input>` — it must not carry input resets. A `<line-slider>` has no `<textarea>` — it must not carry textarea resets.

The reset system is split into independent CSS files. Each file targets a specific category of native elements. Components import only the modules they need.

**File structure:**

```
packages/line-core/src/styles/
├── reset.common.css       ← ALL components get this (minimal)
├── reset.input.css        ← Components with <input> in shadow DOM
├── reset.button.css       ← Components with <button> in shadow DOM
├── reset.textarea.css     ← Components with <textarea> in shadow DOM
├── reset.select.css       ← Components with <select> in shadow DOM
├── reset.range.css        ← Range/slider components
├── reset.progress.css     ← Progress/meter components
├── reset.summary.css      ← Details/summary components
├── reset.fieldset.css     ← Fieldset/legend components
├── reset.table.css        ← Table components
├── reset.scrollbar.css    ← Scroll area components
└── index.ts               ← Exports all modules as CSSStyleSheet objects
```

### 14.4 Reset Module Contents

#### `reset.common.css` — Every component

The minimum shared baseline. Every component declares it; `LineElement` does not inject it (§14.6).

```css
/* Box model */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Focus — removed from all internal elements.
 * Machine drives data-focus-visible on host.
 * Consumer/theme styles focus via ::part() or --line-focus-ring-* */
*:focus {
  outline: none;
}

/* Selection — inherit, don't impose */
::selection {
  background: var(--line-selection-bg, Highlight);
  color: var(--line-selection-color, HighlightText);
}

/* Images/SVGs — block display, constrained */
img, svg {
  display: block;
  max-width: 100%;
}

/* Anchor reset */
a {
  color: inherit;
  text-decoration: none;
}

/* Hidden attribute must always win */
[hidden] {
  display: none !important;
}
```

#### `reset.input.css` — Input, PasswordInput, SearchInput, DateInput, NumberInput, Combobox

```css
input {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  word-spacing: inherit;
  background: transparent;
  border: 0;
  border-radius: 0;
  -webkit-border-radius: 0;
  padding: 0;
  margin: 0;
  outline: none;
  width: 100%;
}

/* Number spinner arrows */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}

/* Search cancel button */
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-decoration {
  -webkit-appearance: none;
}

/* Date/time picker indicators */
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  display: none;
}

/* Password reveal icon (Edge/Chrome) */
input[type="password"]::-ms-reveal,
input[type="password"]::-webkit-credentials-auto-fill-button {
  display: none;
}

/* File input button */
input[type="file"]::file-selector-button {
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}

/* Placeholder */
::placeholder {
  color: inherit;
  opacity: 0.5;
}

/* Autofill detection via animation trick */
@keyframes line-autofill-start { from { --line-autofill: 1; } }
@keyframes line-autofill-cancel { from { --line-autofill: 1; } }

input:-webkit-autofill {
  animation-name: line-autofill-start;
}
input:not(:-webkit-autofill) {
  animation-name: line-autofill-cancel;
}

/* Autofill background neutralisation */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: inherit;
  -webkit-box-shadow: 0 0 0px 1000px transparent inset;
  transition: background-color 5000s ease-in-out 0s;
}
```

#### `reset.button.css` — Button, IconButton, SplitButton

```css
button {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  margin: 0;
  outline: none;
  cursor: pointer;
  line-height: inherit;
}

button:disabled {
  cursor: not-allowed;
}
```

#### `reset.textarea.css` — Textarea

```css
textarea {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  word-spacing: inherit;
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  margin: 0;
  outline: none;
  resize: none;
  width: 100%;
}

textarea::placeholder {
  color: inherit;
  opacity: 0.5;
}
```

#### `reset.select.css` — Select (native fallback scenarios)

```css
select {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  color: inherit;
  background: transparent;
  background-image: none;
  border: 0;
  border-radius: 0;
  padding: 0;
  margin: 0;
  outline: none;
  width: 100%;
}
```

#### `reset.range.css` — Slider, RangeSlider, AngleSlider

```css
input[type="range"] {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  outline: none;
  width: 100%;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
}

input[type="range"]::-moz-range-thumb {
  border: 0;
  background: transparent;
}

input[type="range"]::-webkit-slider-runnable-track {
  background: transparent;
}

input[type="range"]::-moz-range-track {
  background: transparent;
}
```

#### `reset.progress.css` — Progress, ProgressRing, Gauge/Meter

```css
progress, meter {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  border: 0;
  background: transparent;
  width: 100%;
}

/* Progress — WebKit */
progress::-webkit-progress-bar { background: transparent; }
progress::-webkit-progress-value { background: transparent; }

/* Progress — Gecko */
progress::-moz-progress-bar { background: transparent; }

/* Meter — WebKit */
meter::-webkit-meter-bar { background: transparent; border: 0; }
meter::-webkit-meter-optimum-value { background: transparent; }
meter::-webkit-meter-suboptimum-value { background: transparent; }
meter::-webkit-meter-even-less-good-value { background: transparent; }

/* Meter — Gecko */
meter::-moz-meter-bar { background: transparent; }
```

#### `reset.summary.css` — Accordion, Collapsible

```css
summary {
  list-style: none;
  cursor: pointer;
}

summary::-webkit-details-marker {
  display: none;
}

summary::marker {
  content: '';
}
```

#### `reset.fieldset.css` — Fieldset

```css
fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

legend {
  padding: 0;
}
```

#### `reset.table.css` — Table, DataGrid

```css
table {
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
}

th, td {
  padding: 0;
  text-align: inherit;
  font-weight: inherit;
}
```

#### `reset.scrollbar.css` — ScrollArea

```css
/* Standard properties (Firefox + Chrome 121+) */
:host {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

/* WebKit (Chrome < 121, Safari) */
::-webkit-scrollbar {
  width: var(--line-scrollbar-size, 8px);
  height: var(--line-scrollbar-size, 8px);
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: var(--line-scrollbar-radius, 4px);
}
```

### 14.5 Build Pipeline — CSS Files to Shared `CSSStyleSheet` Objects

The `.css` files are real, standalone, editable files in the repository. At build time, Vite inlines them as strings. The core package exports them as singleton `CSSStyleSheet` objects.

```typescript
// packages/line-core/src/styles/index.ts
import commonCSS from './reset.common.css?inline';
import inputCSS from './reset.input.css?inline';
import buttonCSS from './reset.button.css?inline';
import textareaCSS from './reset.textarea.css?inline';
import selectCSS from './reset.select.css?inline';
import rangeCSS from './reset.range.css?inline';
import progressCSS from './reset.progress.css?inline';
import summaryCSS from './reset.summary.css?inline';
import fieldsetCSS from './reset.fieldset.css?inline';
import tableCSS from './reset.table.css?inline';
import scrollbarCSS from './reset.scrollbar.css?inline';

function createSheet(css: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  return sheet;
}

export const commonReset = createSheet(commonCSS);
export const inputReset = createSheet(inputCSS);
export const buttonReset = createSheet(buttonCSS);
export const textareaReset = createSheet(textareaCSS);
export const selectReset = createSheet(selectCSS);
export const rangeReset = createSheet(rangeCSS);
export const progressReset = createSheet(progressCSS);
export const summaryReset = createSheet(summaryCSS);
export const fieldsetReset = createSheet(fieldsetCSS);
export const tableReset = createSheet(tableCSS);
export const scrollbarReset = createSheet(scrollbarCSS);
```

**How it works at each stage:**

| Stage | What happens |
|-------|-------------|
| **Source** | Real `.css` files in `packages/line-core/src/styles/`. Editable, lintable, reviewable. |
| **Build** | Vite `?inline` reads each CSS file and embeds it as a JavaScript string constant. Tree-shaking removes unused modules. |
| **Runtime** | `createSheet()` runs once per module (singleton). Creates a `CSSStyleSheet` object in memory. |
| **Adoption** | Components declare resets in `static styles`. Lit merges them with component-specific styles into `adoptedStyleSheets`. |
| **Instances** | 1000 `<line-input>` instances share the same `inputReset` object by reference. Zero duplication. |

**Browser support for `adoptedStyleSheets`:** Chrome 73+, Firefox 101+, Safari 16.4+. All within line://ui's target (latest 2 stable).

### 14.6 Component Usage

Each component declares exactly which reset modules it needs:

```typescript
// line-input.ts — needs common + input resets
import { commonReset, inputReset } from '@websublime/line-core/styles';
import { css } from 'lit';

class LineInput extends LineElement {
  static styles = [commonReset, inputReset, css`
    :host { display: inline-flex; }
    /* component-specific styles */
  `];
}
```

```typescript
// line-badge.ts — needs common only (no native form elements)
import { commonReset } from '@websublime/line-core/styles';
import { css } from 'lit';

class LineBadge extends LineElement {
  static styles = [commonReset, css`
    :host { display: inline-flex; }
  `];
}
```

```typescript
// line-accordion.ts — needs common + summary resets
import { commonReset, summaryReset } from '@websublime/line-core/styles';
import { css } from 'lit';

class LineAccordion extends LineElement {
  static styles = [commonReset, summaryReset, css`
    :host { display: block; }
  `];
}
```

```typescript
// line-table.ts — needs common + table resets
import { commonReset, tableReset } from '@websublime/line-core/styles';
import { css } from 'lit';

class LineTable extends LineElement {
  static styles = [commonReset, tableReset, css`
    :host { display: block; }
  `];
}
```

```typescript
// line-slider.ts — needs common + range resets
import { commonReset, rangeReset } from '@websublime/line-core/styles';
import { css } from 'lit';

class LineSlider extends LineElement {
  static styles = [commonReset, rangeReset, css`
    :host { display: block; }
  `];
}
```

**The `commonReset` is NOT injected automatically by `LineElement`.** Each component explicitly declares it. This keeps the base class clean and makes dependencies visible in the component source. If a future component genuinely needs zero reset (e.g., a wrapper that renders nothing), it can omit it.

### 14.7 Reset Module to Component Mapping

Which modules each component category uses:

| Component | `common` | `input` | `button` | `textarea` | `select` | `range` | `progress` | `summary` | `fieldset` | `table` | `scrollbar` |
|-----------|:--------:|:-------:|:--------:|:----------:|:--------:|:-------:|:----------:|:---------:|:----------:|:-------:|:-----------:|
| Button, IconButton | x | | x | | | | | | | | |
| ButtonGroup | x | | | | | | | | | | |
| SplitButton | x | | x | | | | | | | | |
| Input, PasswordInput, SearchInput, DateInput | x | x | | | | | | | | | |
| NumberInput | x | x | x | | | | | | | | |
| Textarea | x | | | x | | | | | | | |
| Select | x | | | | x | | | | | | |
| Combobox | x | x | | | | | | | | | |
| Slider, RangeSlider | x | | | | | x | | | | | |
| Field | x | | | | | | | | | | |
| Fieldset | x | | | | | | | | x | | |
| Checkbox, Radio, Switch | x | | | | | | | | | | |
| Accordion, Collapsible | x | | | | | | | x | | | |
| Progress, Gauge/Meter | x | | | | | | x | | | | |
| Table, DataGrid | x | | | | | | | | | x | |
| ScrollArea | x | | | | | | | | | | x |
| Chip, AvatarGroup | x | | x | | | | | | | | |
| Badge, Alert, Avatar, Separator, Skeleton, Spinner, Card, Empty State, Presence, all Static | x | | | | | | | | | | |
| Dialog, Sheet, Popover, Tooltip, Toast | x | | | | | | | | | | |
| Editable | x | x | | | | | | | | | |
| FileUpload | x | x | | | | | | | | | |
| TagInput | x | x | | | | | | | | | |
| Rating | x | | | | | | | | | | |

### 14.8 State Reflection — Pseudo-Class Equivalents

Native pseudo-classes don't work on custom elements. line://ui provides two parallel APIs for consumers:

**API 1: Host data attributes** (works everywhere, simple CSS selectors)

```css
line-input[data-focused] { /* focused state */ }
line-input[data-disabled] { /* disabled state */ }
line-input[data-invalid] { /* invalid state */ }
```

**API 2: `CustomStateSet` via `ElementInternals`** (modern, `:state()` pseudo-class)

```css
line-input:state(focused) { /* focused state */ }
line-input:state(disabled) { /* disabled state */ }
line-input:state(invalid) { /* invalid state */ }
```

**Both APIs reflect the same machine state simultaneously.** `LineElement` attaches `ElementInternals` for every component and keeps it in an ES `#private` field. Subclasses reach it through a Symbol key that `line-core` exports, and the `FormAssociated` mixin reuses it. The key is a plain `Symbol(...)`, not `Symbol.for`. The key's description is `line.internals`, not `internals` or `privateInternals`, and the accessor lives on the prototype, so axe's WCCG lookup does not find it (R8 §2.4; Phase 1 spec §10 SD19 as amended by AM-002 and AM-004, task C23). The base class handles the wiring:

```typescript
// In @websublime/line-core
export const INTERNALS = Symbol('line.internals');

// In LineElement
#internals = this.attachInternals();

protected get [INTERNALS](): ElementInternals {
  return this.#internals;
}

protected reflectState(name: string, active: boolean) {
  // Data attribute (universal); toggleAttribute keeps a kebab-case name such as focus-visible verbatim
  this.toggleAttribute(`data-${name}`, active);

  // CustomStateSet (modern); the guard keeps the data attribute working where internals have no states
  if (active) this.#internals.states?.add(name);
  else this.#internals.states?.delete(name);
}
```

**Complete state mapping:**

| Machine state | Host attribute | CustomStateSet | Replaces native |
|---------------|---------------|---------------|-----------------|
| focused | `data-focused` | `:state(focused)` | `:focus` |
| focus-visible | `data-focus-visible` | `:state(focus-visible)` | `:focus-visible` |
| hovered | `data-hovered` | `:state(hovered)` | `:hover` |
| active | `data-active` | `:state(active)` | `:active` |
| disabled | `data-disabled` | `:state(disabled)` | `:disabled` |
| readonly | `data-readonly` | `:state(readonly)` | `:read-only` |
| required | `data-required` | `:state(required)` | `:required` |
| checked | `data-checked` | `:state(checked)` | `:checked` |
| indeterminate | `data-indeterminate` | `:state(indeterminate)` | `:indeterminate` |
| invalid | `data-invalid` | `:state(invalid)` | `:invalid` (also works natively via `setValidity()`) |
| valid | `data-valid` | `:state(valid)` | `:valid` (also works natively via `setValidity()`) |
| empty | `data-empty` | `:state(empty)` | `:placeholder-shown` |
| filled | `data-filled` | `:state(filled)` | -- |
| loading | `data-loading` | `:state(loading)` | -- |
| pressed | `data-pressed` | `:state(pressed)` | -- |
| expanded | `data-expanded` | `:state(expanded)` | `:open` |
| editing | `data-editing` | `:state(editing)` | -- |
| error | `data-error` | `:state(error)` | -- |
| autofill | `data-autofill` | `:state(autofill)` | `:-webkit-autofill` |
| open | `data-open` | `:state(open)` | `:open` |

**Note on `:valid` / `:invalid`:** These two are special — they work natively on form-associated custom elements via `ElementInternals.setValidity()`. We still reflect them as data attributes and CustomStateSet for consistency, but the native pseudo-classes also work. A consumer can use EITHER `line-input:invalid` OR `line-input[data-invalid]` OR `line-input:state(invalid)`.

**Note on `:state()` browser support:** Chrome 125+, Firefox 126+, Safari 17.4+. Chrome 90–124 support only the older `:--foo` syntax. line://ui's latest-2 browser target (PRD §1.7) lies inside the `:state()` range. The `data-*` attributes provide a universal fallback that works everywhere.

### 14.9 Focus Management

Focus is the most visible cross-browser inconsistency. line://ui standardises it:

**Internal elements:** All `outline: none` via `reset.common.css`. No browser focus ring leaks through.

**Host element:** The machine determines when focus is visible (keyboard vs pointer). `data-focus-visible` is set on the host ONLY for keyboard focus. Each interactive component draws a default ring on `::part(root)` under `[data-focus-visible]` through its `--line-{component}-focus-ring` token, which defaults to `var(--line-focus-ring, 2px solid currentColor)`. The fallback keeps the ring visible when the theme layer is absent, because `--line-focus-ring` resolves through the accent role (WCAG 2.4.7). The theme or consumer restyles it:

```css
/* Theme default — consumes a role token (resolves through the active accent hue) */
line-input[data-focus-visible]::part(root) {
  outline: 2px solid var(--line-accent-border); /* step 7 of accent */
  outline-offset: 2px;
}

/* Consumer override */
line-input[data-focus-visible]::part(root) {
  box-shadow: 0 0 0 3px rgba(200, 255, 0, 0.4);
  outline: none;
}
```

**`delegatesFocus`:** For components where the host should be focusable and delegate to the first focusable internal element, set `delegatesFocus: true` on the shadow root:

```typescript
this.attachShadow({ mode: 'open', delegatesFocus: true });
```

Useful for Input, Textarea, SearchInput — clicking anywhere on the component focuses the internal `<input>`. Supported in Chrome 53+, Firefox 94+, Safari 15+.

### 14.10 Consumer-Side Reset for Slotted Content

`@websublime/line-tokens` exports an optional `reset.css` for consumers who want to neutralise browser defaults on slotted (light-DOM) content. This is NOT applied automatically — consumers opt in by importing it. The reset lives in `line-tokens` (foundation layer L0) because it is a zero-opinion baseline applied **before** any tokens, palettes, or themes — see PRD §9.9 for the export contract.

**Usage:**

```css
@import '@websublime/line-tokens/reset';
/* or: <link rel="stylesheet" href="@websublime/line-tokens/dist/reset.min.css"> */
```

Every reset rule sits inside the cascade layer `line` (`@layer line`, PRD §9.12), and every selector uses `:where()` for zero specificity. A consumer rule outside `@layer` beats the reset at any specificity and in any order. A consumer stylesheet that declares its own layers starts with `@layer line;` or puts `line` first in its order statement, and its layered rules then beat the reset.

**Scope — the reset covers seven categories:**

| # | Category | Target components | What it resets |
|---|----------|-------------------|----------------|
| 1 | Global slotted content | Any element with a `line-*` class | Margin, padding, font inheritance, list-style, media sizing on common HTML elements (`h1`–`h6`, `p`, `ul`, `ol`, `img`, `svg`, etc.) |
| 2 | Field component | `line-field` | Labels, hint/error slots — margin, padding, font inheritance |
| 3 | Form-adjacent components | `line-input`, `line-textarea`, `line-select`, `line-number-field`, `line-combobox`, `line-pin-input` | Labels, hint/error/description slots — margin, padding, font inheritance |
| 4 | Content containers | `line-card`, `line-dialog`, `line-alert`, `line-drawer`, `line-popover`, `line-tooltip`, `line-callout`, `line-banner` | Headings, paragraphs, lists — margin, padding, list-style |
| 5 | Navigation components | `line-tabs`, `line-breadcrumb`, `line-menu`, `line-pagination`, `line-navigation-menu` | Links, lists — text-decoration, color, margin, padding, list-style |
| 6 | Slotted button resets | `line-dialog`, `line-alert`, `line-drawer`, `line-toolbar`, `line-card` | Bare `<button>` elements — appearance, background, border, cursor |
| 7 | Slotted table resets | `line-card`, `line-dialog`, `line-drawer` | `<table>`, `<th>`, `<td>` — border-collapse, spacing, alignment |

**Example (field component):**

```css
@layer line {
  :where(line-field) :where(label),
  :where(line-field) :where(span[slot="hint"]),
  :where(line-field) :where(span[slot="error"]) {
    margin: 0;
    padding: 0;
    font: inherit;
  }
}
```

---

## 15. Native Element Requirements Matrix

### 15.1 When to Use Native Elements Inside Shadow DOM

Some components MUST render a native HTML element inside their shadow DOM because certain platform APIs are only available on native elements.

**Components that REQUIRE a native element internally:**

| Component | Internal element | APIs that require it |
|-----------|-----------------|---------------------|
| Input | `<input>` | IME composition, autofill, password managers, selection API (`setSelectionRange`, `selectionStart`), mobile keyboard hints (`inputmode`, `enterkeyhint`), speech-to-text |
| PasswordInput | `<input type="password">` | Password manager detection (1Password, Bitwarden, LastPass look for this) |
| SearchInput | `<input>` | Autofill, IME |
| DateInput | `<input>` (per segment) | IME for segment values, keyboard navigation |
| Textarea | `<textarea>` | IME, selection API, speech-to-text, undo/redo stack |
| FileUpload | `<input type="file">` | OS file dialog (no JS API exists to open it) |
| NumberInput | `<input type="text" inputmode="numeric">` | Mobile numeric keyboard |

**Components that do NOT need a native element:**

Checkbox, Radio, Switch, Select, Slider, Range Slider, Color Picker, Date Picker (calendar UI), Rating, Toggle Group, Combobox (dropdown part), Editable (preview mode), and all non-form components. These use `ElementInternals` for form participation and fully custom rendering for visuals.

### 15.2 Delegation Pattern

When a native element lives inside the shadow DOM, the custom element must delegate certain APIs that only exist on the native element:

```typescript
class LineInput extends LineElement {
  get #input(): HTMLInputElement {
    return this.shadowRoot!.querySelector('input')!;
  }

  // Selection API — only available on HTMLInputElement
  select() { this.#input.select(); }
  setSelectionRange(start: number, end: number, direction?: string) {
    this.#input.setSelectionRange(start, end, direction);
  }
  get selectionStart() { return this.#input.selectionStart; }
  set selectionStart(v) { this.#input.selectionStart = v; }
  get selectionEnd() { return this.#input.selectionEnd; }
  set selectionEnd(v) { this.#input.selectionEnd = v; }
  get selectionDirection() { return this.#input.selectionDirection; }
  setRangeText(...args: Parameters<HTMLInputElement['setRangeText']>) {
    this.#input.setRangeText(...args);
  }
}
```

The internal native element is always exposed as `::part(input)` so the consumer can style it:

```css
line-input::part(input) {
  caret-color: var(--line-accent-solid); /* role token; resolves through active accent hue */
}
```

### 15.3 Autofill Detection

Browser autofill forces a background colour (typically light yellow) that cannot be prevented via CSS alone. The `reset.input.css` module includes an animation-based detection trick that works across all browsers:

```css
/* Already in reset.input.css */
@keyframes line-autofill-start { from { --line-autofill: 1; } }
@keyframes line-autofill-cancel { from { --line-autofill: 1; } }
input:-webkit-autofill { animation-name: line-autofill-start; }
input:not(:-webkit-autofill) { animation-name: line-autofill-cancel; }
```

The component listens for the animation and reflects state:

```typescript
this.#input.addEventListener('animationstart', (e) => {
  if (e.animationName === 'line-autofill-start') {
    this.reflectState('autofill', true);
  }
  if (e.animationName === 'line-autofill-cancel') {
    this.reflectState('autofill', false);
  }
});
```

Consumer styles the autofilled state:

```css
line-input[data-autofill]::part(root) {
  background: var(--line-warning-2);
}
```

---

## 16. Unsolvable Browser Limitations

Some browser-imposed behaviours have **no CSS or JavaScript workaround**. The reset modules cannot fix them. This section documents every known case and line://ui's strategy for each.

### 16.1 The Core Principle

> When a native element cannot be fully neutralised, **don't use it visually**. Use it as an invisible data channel and render the visible UI entirely with custom markup.

This is the fundamental reason line://ui exists. If browsers let you fully style every native control, headless libraries wouldn't need to exist.

### 16.2 Complete Inventory of Unsolvable Cases

#### Input Date/Time — Picker Icon (Firefox)

| | |
|---|---|
| **Problem** | Firefox renders a calendar icon on `<input type="date">`, `<input type="time">`, and `<input type="datetime-local">`. There is NO pseudo-element to target it. `appearance: none` does NOT remove it. |
| **Affects** | `<line-date-input>`, `<line-time-picker>` — any component using native date/time inputs internally |
| **line://ui strategy** | `<line-date-input>` does NOT use `<input type="date">`. It uses `<input type="text">` with segment masking (day/month/year as separate navigable segments). No native picker icon exists to leak through. The date machine manages the segment state. |

#### Input Date/Time — Picker Popup Cannot Be Prevented

| | |
|---|---|
| **Problem** | Even with the icon hidden (Chrome/Safari), clicking the native date input may still open the browser's calendar popup. There is no way to prevent this via CSS or `preventDefault()`. |
| **Affects** | Any component using `<input type="date/time/datetime-local/month/week">` |
| **line://ui strategy** | Same as above — use `<input type="text">` with custom segment navigation. The native picker never exists. `<line-date-picker>` renders its own calendar popup via Zag.js, completely independent of the browser. |

#### Input Number — Spinner Arrows (Partial)

| | |
|---|---|
| **Problem** | Chrome/Safari: `::-webkit-inner-spin-button { display: none }` works. Firefox: `appearance: textfield` removes them BUT also changes the input's validation behaviour. There is no way in Firefox to hide the arrows while keeping `type="number"` validation. |
| **Affects** | `<line-number-input>` |
| **line://ui strategy** | Use `<input type="text" inputmode="numeric" pattern="[0-9]*">`. This gives the mobile numeric keyboard without native spinner arrows in ANY browser. Validation is handled by the Zag.js machine, not native number type. The internal `::part(increment)` and `::part(decrement)` are custom elements rendered by the component. |

#### Select — Dropdown Options List

| | |
|---|---|
| **Problem** | `<option>` elements inside a `<select>` dropdown are rendered by the OS, not the browser. They cannot be styled with CSS in any browser. `appearance: none` removes the select arrow but does NOT affect the dropdown list. |
| **Affects** | Any component using native `<select>` for the dropdown |
| **line://ui strategy** | `<line-select>` does NOT use a native `<select>` element. It renders a custom trigger via `::part(trigger)` and a custom dropdown via Popover/floating positioning (Zag.js select machine). Options are `<line-select-item>` custom elements. No native `<option>` elements exist. Form value is set via `ElementInternals.setFormValue()`. |

#### Select — Mobile OS Picker (iOS Flipwheel, Android Spinner)

| | |
|---|---|
| **Problem** | On iOS, a native `<select>` opens the system flipwheel. On Android, it opens a system spinner/dialog. These provide excellent UX for their platform. A custom `<select>` replacement loses this UX entirely. |
| **Affects** | `<line-select>` on mobile |
| **line://ui strategy** | Documented trade-off. `<line-select>` provides consistent cross-platform UI (custom dropdown). Consumers who prefer the native mobile picker for specific use cases can use a native `<select>` with `<line-field>` — the Field accepts any form control via slot. A future `native-mobile` prop is a nice-to-have post-1.0. |

#### File Input — OS Dialog

| | |
|---|---|
| **Problem** | There is NO JavaScript API to open a file dialog programmatically without a native `<input type="file">`. The `showOpenFilePicker()` API exists but is Chrome-only. |
| **Affects** | `<line-file-upload>` |
| **line://ui strategy** | A hidden `<input type="file">` lives inside the shadow DOM. It is invisible (zero dimensions, `opacity: 0`, `position: absolute`). The visible UI is fully custom — drop zone, file list, previews. Clicking the custom trigger calls `.click()` on the hidden native input. |

#### Color Input — OS Color Dialog

| | |
|---|---|
| **Problem** | `<input type="color">` opens the OS-level color picker. This cannot be styled, prevented, or replaced. |
| **Affects** | Would affect any component using native `<input type="color">` |
| **line://ui strategy** | `<line-color-picker>` does NOT use `<input type="color">`. It renders its own spectrum/hue/alpha UI via the Zag.js color-picker machine. Form value is set via `ElementInternals.setFormValue()`. No OS dialog involved. |

#### Autofill — Forced Background Colour

| | |
|---|---|
| **Problem** | When a browser autofills an `<input>`, it forces a background colour that CANNOT be prevented via CSS. `background: transparent !important` is ignored. |
| **Affects** | Any component with `<input>` in shadow DOM |
| **line://ui strategy** | Mitigation, not solution. The `reset.input.css` includes the `transition: background-color 5000s` hack that delays the forced background indefinitely. The animation-based autofill detection (section 15.3) reflects `data-autofill` on the host so consumers can apply their own override styling. This is the best possible workaround — no library has a complete fix. |

#### Password Managers — Shadow DOM Detection

| | |
|---|---|
| **Problem** | Password managers (1Password, Bitwarden, LastPass) look for `<input type="password">` to inject their autofill UI. Some managers detect inputs inside shadow DOM, some don't. |
| **Affects** | `<line-password-input>` |
| **line://ui strategy** | `<line-password-input>` always uses a real `<input type="password">` inside shadow DOM. The `name` and `autocomplete` attributes are forwarded from the host to the internal input. This maximises compatibility. Managers that don't support shadow DOM detection will miss it — this is a known limitation of ALL Web Component form libraries. |

#### Scrollbar — Firefox Styling Limitations

| | |
|---|---|
| **Problem** | Firefox only supports `scrollbar-width` and `scrollbar-color`. Chrome/Safari support the full `::-webkit-scrollbar-*` family. There is no way to achieve the same level of scrollbar customisation in Firefox as in Chrome. |
| **Affects** | `<line-scroll-area>` |
| **line://ui strategy** | `<line-scroll-area>` uses the Zag.js scroll-area machine which renders its OWN scrollbar overlay. The native scrollbar is hidden. The custom scrollbar is rendered as `::part(scrollbar-thumb)` and `::part(scrollbar-track)`. Consistent across all browsers. |

#### Details/Summary — Animation

| | |
|---|---|
| **Problem** | The native `<details>` element has no built-in animation for open/close. The new `::details-content` pseudo-element (Chrome 131+) is not supported in Firefox or Safari. |
| **Affects** | Would affect any component using native `<details>` for disclosure |
| **line://ui strategy** | `<line-accordion>` and `<line-collapsible>` do NOT use native `<details>`. They use Zag.js accordion/collapsible machines with custom rendering. The `<line-presence>` component handles enter/exit animations. Fully cross-browser. |

#### Textarea — Resize Handle Appearance

| | |
|---|---|
| **Problem** | `resize: none` removes the handle completely. But if you WANT a resize handle with custom styling, there is no standard pseudo-element. Chrome/Safari have `::-webkit-resizer` but Firefox has nothing. |
| **Affects** | `<line-textarea>` |
| **line://ui strategy** | `resize: none` is set in `reset.textarea.css`. If the consumer wants resize, `<line-textarea>` exposes an `auto-resize` prop (machine-driven auto-height) or a `resize` prop that re-enables native resize. A custom resize handle rendered as `::part(resize-handle)` is a nice-to-have post-1.0. |

### 16.3 Summary — Strategy Per Case

| Problem | Strategy | Native element used? |
|---------|----------|---------------------|
| Date/time picker icon (Firefox) | **Avoid** — use `<input type="text">` with segment masking | No native date input |
| Date/time picker popup | **Avoid** — custom calendar/time UI via Zag.js | No native date input |
| Number spinner arrows (Firefox) | **Avoid** — use `<input type="text" inputmode="numeric">` | Text input, not number |
| Select dropdown options | **Avoid** — fully custom dropdown, no native `<select>` | No native select |
| Mobile OS select picker | **Documented trade-off** — custom dropdown on all platforms | No native select |
| File dialog | **Hidden native** — invisible `<input type="file">`, custom visible UI | Hidden file input |
| Color dialog | **Avoid** — fully custom color picker UI | No native color input |
| Autofill forced background | **Mitigate** — delay hack + detection + state reflection | Native input (unavoidable) |
| Password manager detection | **Best effort** — real `<input type="password">` + attribute forwarding | Native password input |
| Scrollbar styling (Firefox) | **Replace** — custom scrollbar overlay, native hidden | Native scrollbar hidden |
| Details animation | **Avoid** — custom disclosure components with Presence | No native details |
| Textarea resize handle | **Reset** — `resize: none`, custom auto-resize or re-enable via prop | Native textarea |

**Pattern summary:** The dominant strategy is **avoidance** — don't use the native element that causes the problem. Render custom UI powered by Zag.js machines. Use `ElementInternals` for form integration. The native element only appears when there is literally no alternative (file dialog, password manager detection, text input for IME/autofill).

---

## 17. Agent-Driven UI

An AI agent can compose an interface from line://ui components at runtime. The opt-in package `@websublime/line-genui` (from Phase 1) holds the component descriptors, the catalogs and the A2UI renderer. Components stay protocol-unaware, and no A2UI, AG-UI or MCP import enters `line-components` or `line-core`. Evidence and sources live in `docs/research/00-research-generative-ui.md`; the product view lives in PRD Appendix D.

### 17.1 Layers

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

- The app owns the transport and the glue.
- `line-genui` depends on `line-core`. `line-components` is a peer loaded lazily through descriptor `load()`; `line-icons` is a peer for the `A2uiIconMap` and `A2uiIconName` types only (`import type`; the shipped `.d.ts` references `@websublime/line-icons/a2ui`), never loaded at run time (Phase 1 spec §10 SD9, AM-008, AM-009). No package depends on `line-genui`.
- Consumer `::part()` and `--line-*` rules style agent-built UI exactly as they style hand-written UI.

### 17.2 Agent contract

Every component spec states these rules in its Agent contract section (PRD §8.1). They are normative from Phase 1 on.

| # | Rule |
|---|------|
| C1 | Every public input is a JSON-serialisable attribute or property (string, number, boolean, string enum, string array, number array). An input that JSON cannot carry either gets a JSON-serialisable alternative or stays out of the descriptor's prop schema, and the spec's Agent contract section records the reason. |
| C2 | Slots are documented with `@slot` and classified as single (`ComponentId`) or multiple (`ChildList`). |
| C3 | Events are documented with `@fires` and a typed `detail`, and every event name carries the `line-` prefix (Law 2, §9). A value-bearing component is one whose descriptor binding map names a value prop. It emits `line-change` with `detail.value` on commit and `line-input` with `detail.value` on live edits. No component dispatches an unprefixed `input` or `change` event. |
| C4 | Form-associated components (§7) expose `value` as a property and accept external validity. An attribute or property sets custom validity through the `FormAssociated` mixin's `setValidity` and reflects the invalid state (`data-invalid` and `:state(invalid)`, §14.8). The visible message stays in `<line-field>`'s `error` slot, which the renderer fills. |
| C5 | The host accepts `aria-label` and `aria-description`, or a documented label property. The component applies the accessible name to the element that carries the role, which is either the host itself or the inner focusable element (§14.9 `delegatesFocus`). |
| C6 | Semantic variants, when a component has them, are reflected attributes with closed enums that carry no styles. |
| C7 | CEM JSDoc is complete, with `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated`. |
| C8 | Rendering with missing or partial props degrades to an empty or neutral state. |
| C9 | A value-bearing component (C3) or a compound component names exactly one commit event. A value-bearing component uses `line-change` (C3), and so does a compound component that is also value-bearing, such as a radio group or a select. A compound component that is not value-bearing names its own `line-`-prefixed commit event. A compound component holds more than one interactive element and turns interaction among them into one committed result, as tabs, a radio group, a select or a menu do. ButtonGroup is not compound, because its buttons act on their own and commit no shared result. AvatarGroup is not compound, because its expand control and overflow popover commit nothing. The commit event fires on the host once per committed result. It never fires for an interaction that commits nothing, such as a focus move, arrow navigation that only moves focus, hover or the opening of a popup. A WAI-ARIA radio group or a tab list with automatic activation commits on arrow keys, so those arrow keys fire the event. The commit event bubbles, so an ancestor such as a `<form>` can listen for it. C9 does not require `composed`. A host nested inside another component's shadow root leaves that choice to the enclosing component's spec. The descriptor binding map (§17.3) records the event as the commit event, and consumers bind to it, for example as an htmx `hx-trigger`. |

### 17.3 Descriptors and catalogs

- Each component has one protocol-neutral descriptor in `line-genui/src/catalog/`. `line-components` gains no Zod or A2UI dependency.
- A descriptor holds these fields:
  - the catalog name, the tag, and `load()`, which imports the component subpath;
  - the prop schema and the slot map;
  - the binding map (prop → property or attribute, the value prop, the commit event that §17.2 rule C9 names);
  - the action map (prop → DOM event);
  - the accessibility requirements and the agent-facing description;
  - the `agentExposed` flag, which defaults to `true`.
- Descriptors are written on the Zod 3 API and reuse the `@a2ui/web_core` common-type schemas (`DynamicString`, `ComponentId`, `ChildList`, `Action` and their siblings) in the catalogs. Only the Zod 3 API composes with those schemas.
- The Custom Elements Manifest enriches descriptions and deprecations. It cannot be the only source, because its types are plain text and it carries no ARIA metadata. Form association appears in it only as the inherited static member `formAssociated`.
- A drift test fails when a descriptor names an attribute, property, slot or event that the `line-components` `custom-elements.json` lacks (Phase 1 spec §10 SD26).
- A coverage test fails when a `@websublime/line-components` component in the CEM has no descriptor. `<line-a2ui-surface>` lives in `line-genui`, so the test does not cover it.
- Every component keeps a descriptor. A component that makes no sense to an agent carries `agentExposed: false` with a reason, and the emitters leave flagged descriptors out of the catalogs and the frontend-tool schemas.
- The emitters produce the A2UI v0.9.1 catalog JSON for the `line` catalog and the frontend-tool schemas (`{name, description, parameters}`). An A2UI v1.0 emitter follows when v1.0 is final.
- line://ui ships two catalogs, versioned independently.
  - The `line` catalog carries the full vocabulary under its own versioned `catalogId`. Any incompatible change gets a new id. `@websublime/line-genui/catalog.json` holds its emitted JSON.
  - A2UI v0.9.1 publishes no standalone catalog meta-schema, so the `line` catalog is checked against published artifacts. Its inline form validates against `client_capabilities.json#/$defs/Catalog`, `web_core` reads it back with `Catalog.fromJson`, and its `validationSchema` compiles.
  - The `basic` catalog registers line components under the A2UI basic catalog id `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json`, so agents that know only the basic catalog render with line://ui. Its JSON Schema is A2UI's own, so line://ui registers implementations under the upstream id and does not re-emit it. The v0.9.1 protocol examples and `@ag-ui/a2ui-middleware` use other ids. The catalog answers only to the v0_9 id, and the AG-UI recipe server sets `defaultCatalogId` to it (Phase 1 spec §10 SD43).
- Frontend-tool parameters are literal and flat. They carry no `$ref`, `oneOf`, `allOf`, recursion or open maps, and no A2UI common types or dynamic bindings. The emitted tool definitions are accepted by OpenAI and Anthropic in strict mode and by Gemini. Strict mode needs `additionalProperties: false` on every object, and Gemini `parameters` allows neither `additionalProperties` nor `const`. The emitter therefore builds one flat literal model per descriptor and serialises it per provider. Gemini gets `parameters` with `nullable` (Phase 1 spec §10 SD48). The catalogs keep the common types and dynamic bindings, and the flat rule does not cover them.
- Every tool description stays at or under 1024 characters. This is a self-imposed cap that matches OpenAI's observed function-description limit; no provider documents it.

Coverage of the `basic` catalog grows by phase. An unmapped basic type renders an inert placeholder and raises `line-a2ui-error`.

| A2UI basic component | line://ui target | Phase |
|----------------------|------------------|-------|
| Text | Native `<p>`, `<h1>`–`<h5>`, `<small>` by `variant`; `<span>` inside Button (Phase 1 spec §10 SD59) | 1 |
| Image | Native `<img>` behind the URL policy; `variant: "avatar"` → Avatar | 1 |
| Icon | `<line-icon>`. The surface maps the A2UI icon name through its `iconMap` property, an `A2uiIconMap` that the consumer fills with `a2uiIconMap(set, { library })` from `@websublime/line-icons/a2ui` (Phase 1 spec AM-006, decision D-M; AM-008; shape in §17.4). A2UI also accepts `{ "svgPath": … }`. The surface renders it through the `<line-icon>` `path` property (Phase 1 spec §10 SD33) | 1 |
| Video, AudioPlayer | Native `<video>` and `<audio controls>` | 1 |
| Row, Column, List | `<line-stack>` | 1 |
| Divider | `<line-separator>` | 1 |
| Button | `<line-button>` | 1 |
| TextField | `<line-input>`, `<line-textarea>`, `<line-password-input>`, `<line-number-input>`, wrapped in `<line-field>` for the label | 2 |
| CheckBox | `<line-checkbox>` | 2 |
| ChoicePicker | `<line-radio-group>`, a checkbox group, `<line-select>` or `<line-toggle-group>` | 2 |
| Slider | `<line-slider>` | 2 |
| DateTimeInput | `<line-date-input>` | 2 |
| Tabs | `<line-tabs>` | 3 |
| Modal | `<line-dialog>` | 3 |
| ChoicePicker, DateTimeInput refinements | Combobox, Date Picker, Time Picker | 4 |
| Card | `<line-card>` | 5 |
| Video, AudioPlayer refinements | Video Player, Audio Player | 8 |

### 17.4 Renderer

`<line-a2ui-surface>` in `@websublime/line-genui/a2ui` renders A2UI messages with line components. `@a2ui/web_core` keeps the surface model, the data model, bindings, functions and checks; the surface owns the DOM projection.

| Topic | Rule | Reason |
|-------|------|--------|
| Render root | Light DOM | Document `::part()` rules cannot reach elements inside another shadow root (Law 1) |
| Loading | Lazy `import()` through each descriptor's `load()`; no eager `define()` | Custom elements upgrade when their module arrives (Law 6) |
| Composition | The surface creates elements by tag and wires children through slots | Orchestrator pattern (Law 4) |
| Events | `line-a2ui-action` carries the resolved A2UI `action` message; `line-a2ui-error` carries an A2UI `error` message | The app sends both through its transport. AG-UI defines no error channel, so the AG-UI recipe logs an error locally and sends nothing (Phase 1 spec §10 SD65) |
| Errors | A `processMessages` throw rejects its whole message, and a rejected `updateComponents` applies nothing. The surface catches every `web_core` throw. An unknown type reaches the surface as a resolver error, and the surface renders an inert placeholder for that node. A missing child stays hidden until it arrives and raises no error. The surface passes `RELAXED_VALIDATION`, so a cycle rejects its message (Phase 1 spec §10 SD52, SD54) | Law 9 |
| Theme | Agent theme hints are ignored by default | The host owns styling |
| Text | Plain text by default; Markdown only through an opt-in sanitising renderer | Agent strings are untrusted |
| URLs | A URL policy hook with the default allowlist `https:`, `http:`, `mailto:`, `tel:`; `requiresUserActivation` is honoured | Upstream does not check media URLs |
| Limits | Configurable maximum node count, depth and data-model size | Hostile or runaway agents |
| Accessibility | One live region per surface; `aria-busy` during batches; required names validated. The live region announces the value of the `live-update-text` attribute (default "Content updated.") once per batch that changed the DOM, and the value of `live-error-text` (default "Some content could not be shown.") on error, so the consumer localises both (MANIFESTO Out of Scope; Phase 1 spec AM-013). The surface never moves focus to another component. Its reconciler keeps focus across reorders. On a reparent the surface uses `moveBefore()` where the browser has it, and otherwise returns focus to the same `instanceId` at the end of the batch | Law 3 |
| Icons | The consumer sets the `iconMap` property to the result of `a2uiIconMap(set, { library })` from `@websublime/line-icons/a2ui`, where `set` is `'lucide'` or `'phosphor'` and `library` is the key the consumer registered that set under. The result has the type `A2uiIconMap = Readonly<Record<A2uiIconName, A2uiIconEntry>>`, with `A2uiIconEntry = { library: string; name: string; weight?: string; mirror: boolean }`, keyed by A2UI name; the helper copies `library` into each entry and returns a null-prototype frozen object. `A2uiIconName` is the union of the 59 A2UI v0.9.1 `Icon.name` enum values, kept in `packages/line-icons/src/a2ui/` and exported from `./a2ui` beside `A2uiIconEntry`, `A2uiIconMap` and `a2uiIconMap` (R10 §2.1, P2; R1 §2.6; Phase 1 spec AM-010). `line-genui` imports these types with `import type` only, so `./a2ui` has no runtime import of `line-icons`. For an A2UI `Icon.name`, literal or bound, the surface looks the name up with `Object.hasOwn` and renders `<line-icon>` with `library`, `name`, `weight` and `mirror` from the map entry. With `iconMap` unset, or a name absent from it (a bound `constructor` included), the node stays neutral and the surface raises `line-a2ui-error`. Setting or replacing `iconMap` projects every Icon node of the surface again. A resolver rejection (a 404, CORS, CSP, a missing `base`, an unset registry) leaves `<line-icon>` neutral and raises no surface error (Phase 1 spec AM-006, decision D-M; AM-008) | The surface sees the map but not the resolver |

The surface projects directly on the `web_core` models and binder (`NodeResolver`). Miguel chose this technique on 2026-10-19 from the R2 evidence, over light-DOM adapter elements rendered through `renderA2uiNode`. The surface keeps its own reconciliation, keyed by `instanceId` and preserving focus, and its own effect lifecycle. It loads no Lit and no `@experimental` `A2uiLitElement`. The surface extends `HTMLElement`, not `LineElement`, and imports no `line-core` module that loads `lit` at run time (Phase 1 spec AM-012, AM-014). Unknown types reach it from the resolver, and so do cycles when no `validationConfig` is set.

The "Lit owns DOM" clause of Law 5 governs `line-components` components. The surface is a light-DOM orchestrator in `line-genui`, its reconciler is its rendering cycle, and no other code mutates its DOM. The surface still keeps no styles in TypeScript and no business logic in render (Phase 1 spec §6.G.4, AM-002, AM-004).

Importing `@websublime/line-genui/catalog` defines no element. Importing `@websublime/line-genui/a2ui` defines only `line-a2ui-surface`.

### 17.5 Transports

The app owns the transport. line://ui documents transports as Storybook recipes and ships no transport code. Phase 1 ships recipes for AG-UI, A2A, MCP and SSE and none for WebSocket or `fetch`-stream JSONL (PRD §7.3 item 8; Phase 1 spec AM-012).

| Transport | Inbound | Outbound |
|-----------|---------|----------|
| AG-UI 1.0, `@ag-ui/a2ui-middleware` convention | `ACTIVITY_SNAPSHOT` with `activityType: "a2ui-surface"` and `content.a2ui_operations` | `forwardedProps.a2uiAction` on the next run |
| A2A | DataPart with `mimeType: application/a2ui+json` in the part `metadata`. The A2UI v0.9.1 extension spec requires `data` to be an array of messages. The v0.9.1 protocol text and both reference implementations send one message per part, and the Python implementation still sends `application/json+a2ui` for v0.8 and v0.9. The recipe accepts an array or a single message per DataPart and both MIME types, and targets A2A v1.0 with `@a2a-js/sdk` 1.3.0 (Phase 1 spec §10 SD66) | DataPart with `[action]` or `[error]`; capabilities in message metadata |
| MCP | Tool result `EmbeddedResource` with `application/a2ui+json` | `tools/call` of `a2ui_action` or `a2ui_error` |
| SSE | One message per SSE event | POST |
| WebSocket, `fetch` streams | JSONL | POST |

Recipes pin the middleware version, as the documented server convention or in a mock producer that mirrors its output, because the middleware does not run fully in a browser.

### 17.6 MCP Apps

- line://ui works unchanged inside an MCP Apps View, which is one HTML document in a sandboxed iframe, when the lazy component chunks are inlined into the View or load from a CDN origin that the View declares. The docs show `vite-plugin-singlefile` first and a CDN listed in `resourceDomains` as the alternative (Phase 1 spec §10 SD68).
- `@websublime/line-themes/hosts/mcp-apps.css` is a CSS-only bridge. It maps the standard MCP host colour, font and border-radius variables on the reference list (Phase 1 spec §6.G.6) onto line theme aliases or `line-tokens` primitives, so `line-themes` gains no runtime (Law 10).
- The app applies `hostContext.styles.variables` and `hostContext.theme` with the ext-apps SDK (`applyHostStyleVariables`, `applyDocumentTheme`). The theme call sets `color-scheme` for `light-dark()`.
- The bridge sets a `line-tokens` primitive with a `body`-scoped `var(--host, inherit)` and copies no literal, because a primitive cannot fall back to itself (Phase 1 spec §10 SD17).
- One shipped `line-tokens` rule reads, on `html`, a primitive the bridge sets: `:where(html) { --line-focus-ring: … }` (`packages/line-tokens/src/focus-ring.css:19`). The bridge redeclares `--line-focus-ring` on `body` with the same composition, names only, so the composed ring follows the host ring colour (Phase 1 spec §6.G.6, AM-004, AM-005).

### 17.7 Stability

- The agent contract (§17.2), the descriptor API and both catalogs follow the PRD §7.1 breaking-changes policy.
- The A2UI renderer (`@websublime/line-genui/a2ui`) ships as a preview. It may change in any minor release and sits outside the PRD §7.1 policy until it targets a final A2UI v1.0.
- `@websublime/line-icons/a2ui` follows the same preview status until A2UI v1.0, because its `A2uiIconName`, `A2uiIconEntry` and `A2uiIconMap` types and its `a2uiIconMap` helper feed the preview property `iconMap` (Phase 1 spec AM-008, AM-011).
- `line-genui` pins `@a2ui/web_core` exactly, because upstream ships breaking changes in minor versions.

### 17.8 Deferred and rejected

| Item | Decision | Trigger to revisit |
|------|----------|--------------------|
| WebMCP for form-associated elements | Defer | WebMCP spec issue #94 resolved and a second engine signals support |
| MCP Apps host element (`<line-mcp-app-frame>`) | Defer | line://ui targets chat hosts; needs a sandbox-proxy origin and a security review |
| Server-side A2UI → `<line-*>` HTML | Defer | A later phase spec takes it up; the Phase 1 spec lists it as a non-goal (Phase 1 spec §2). The HTMX spike (H1) reported on 2026-10-12 and informs this item without deciding it (`docs/retrospective/00-phase-00-retro.md`). |
| Model-authored `<line-*>` markup | Reject | The Sanitizer API reaches Baseline and an allowlist story exists |
| json-render and OpenUI renderers | Out of scope | Upstream ships a web-components renderer |
| Headless chat primitives | Separate catalogue question | A product decision |
| Dev-time AI (Storybook 11 MCP, llms.txt from the CEM) | Schedule with Storybook 11 | Storybook 11 stable |

### 17.9 Phase 1 spec answers

- `LineElement` keeps the internals in an ES `#private` field, and subclasses reach them through a Symbol key that `line-core` exports (Phase 1 spec §10 SD19 as amended by AM-002).
- A session advertises the basic catalog id only when the consumer opts in, until basic coverage is complete (Phase 1 spec §10 SD44).
- Portal, Presence and Visually Hidden carry `agentExposed: false`, each with a recorded reason (Phase 1 spec §10 SD38).
- The `mcp-apps.css` reference list is the role-matched subset under a written rule, and every excluded key is listed with its reason (Phase 1 spec §10 SD62, §6.G.6).
