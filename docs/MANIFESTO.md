# line://ui — Manifesto

**Status:** APPROVED
**Date:** 2026-05-19
**Source:** Distilled from PRD v0.7.0 §1 (Vision, Positioning, Core Principles, Non-Functional Requirements) and README "What makes it different". Revised 2026-05-19 to reflect the realigned design system (5-layer package model, attribute-based theming).

This manifesto is the foundation that the PRD, the architecture, and every downstream decision must align with. If a design or task contradicts a Governing Law below, the design is wrong — not the law.

---

## Vision

**line://ui delivers headless UI primitives as native Web Components — interaction logic via Zag.js state machines, total visual customisation via CSS `::part()` and `--line-*` custom properties — that work natively in any framework or no framework at all.**

---

## Principles

1. **Headless-first.** Components carry zero visual opinion in their core. All styling is the consumer's responsibility via `::part()` and `--line-*` custom properties. The optional theme package is an accelerator, never a requirement.

2. **State machines, not spaghetti.** Every interactive component is powered by Zag.js — explicit states, predictable transitions, built-in WCAG 2.1 AA accessibility, keyboard handling, and focus management. No ad-hoc event soup.

3. **Composition over configuration.** Components connect via `<slot>`, not props or imports. A `Field` does not import an `Input` — it accepts any control via slot. A `DatePicker` accepts any trigger via slot. Independence is the default; orchestration is opt-in.

4. **Dual-layer styling.** Two surfaces, one strategy. Use `--line-*` custom properties for fast token-level adjustments. Use `::part()` for total visual control. Both ship by default on every styleable zone.

5. **Framework-agnostic by construction.** Web Components are the contract. Write `<line-button>` once and use it in React, Vue, Svelte, Angular, Astro, HTMX, or plain HTML — today and five years from now. No adapters, no wrappers, no rewrites.

6. **Inspector as dev tooling.** Feature-flagged via `localStorage`. When active, every component exposes its metadata: version, docs link, scope, QA tags. A first-class affordance for QA teams and integrating developers, not an afterthought.

7. **HTMX as a first-class explorer.** The web is bigger than SPAs. Server-rendered, HTMX-driven workflows are an explicit target. The `LineHtmxElement` adapter is **exploratory** — Phase 0 validates feasibility (the `hx-*` forwarding, server-driven state, and swap-aware lifecycle); Phase 1 commitment depends on the outcome. Not an apology, an honest sequencing.

---

## Governing Laws

1. **Every styleable zone exposes a `::part()`.** A consumer must be able to retheme any visible surface without forking the component. Hidden internal nodes are never decorative.

2. **All public surface we author is `line-*` prefixed.** Tag names (`<line-button>`), CSS custom properties (`--line-*`), and base classes (`LineElement`). Standard HTML hooks (`data-*` for theme switching such as `data-accent` and `data-gray`, ARIA, etc.) follow web conventions and are exempt. No exceptions otherwise, no shadowing of host names.

3. **Consequence: WCAG 2.1 AA is non-negotiable for every shipped component.** Zag.js provides the foundation for state-machine components; static and custom-machine components must independently meet the bar (axe-core zero violations per spec).

4. **Composition over inheritance, slots over props for content.** A Component MUST NOT import another Component to compose its children. Slots and the orchestrator pattern are the only acceptable wiring.

5. **State machines own logic. Lit owns DOM. CSS owns visuals.** No business logic in render, no styles in TypeScript, no DOM mutation outside Lit's reactive cycle.

6. **Bundle isolation: a button must not drag in a dialog.** Each component is independently importable via subpath exports — `@websublime/line-components/button`, `@websublime/line-components/dialog`, etc. — published under a single umbrella package with one version and one changelog. Component files are side-effecting only by `customElements.define()`, so importing one component never executes another. Families share a subpath only when their slots make them inseparable.

7. **Form participation is opt-in via `FormAssociated` mixin and `ElementInternals`.** No bespoke form integration; native `<form>` semantics is the only contract.

8. **Progressive enhancement is preserved where the underlying native element supports it.** Components that wrap native controls (Input, Textarea, Select) remain functional in light DOM fallback when feasible.

9. **Failures are graceful.** A failed Zag.js machine renders the component in a static fallback state. Components never throw uncaught errors at the consumer.

10. **Design system is layered, not monolithic.** Tokens, colors, schemas, themes, and utils are separate packages with a strict downward dependency. Consumers pick the level of opinion they want — a project can import tokens alone, or palettes alone, or the full theme. Cross-layer leakage (palette values inside themes, semantic CSS inside tokens, runtime code inside CSS-only packages) is wrong.

---

## Out of Scope

- **Framework-specific bindings or adapters.** No React wrappers, no Vue plugins, no Svelte stores. Web Components is the contract; framework integration belongs to the consumer.
- **Opinionated default styling in the core package.** Visual themes ship as a separate, optional package. The core renders unstyled by design.
- **SSR/SSG as a v1 hard requirement.** Investigation for Astro / Nuxt / Next.js compatibility is planned post-Phase 1; it is not a launch blocker.
- **Localisation of component-level strings.** Labels like "Close", "Dismiss", "Loading" are the consumer's responsibility via slots and attributes. No bundled i18n.
- **Visual overrides via inline `style` attribute as a primary API.** `::part()` and `--line-*` custom properties are the supported surfaces. Inline styles are not extended.
- **Node.js / non-browser runtime targets.** Components target Chrome / Firefox / Safari (latest 2 stable). No Node DOM polyfill story.
- **Custom build tooling, custom test runners, custom linters.** The stack is Bun + Vite (Rolldown) + Biome. Replacements require an architectural justification, not a preference.

---

## Cross-References

- Product Requirements Specification — `docs/PRD.md`
- Architecture — `docs/ARCHITECTURE.md`
- Phase plans — `docs/plans/{NN}-plan-*.md`
- Component & system specs — `docs/specs/{NN}-spec-*.md`
