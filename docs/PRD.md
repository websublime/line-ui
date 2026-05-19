# line://ui — Product Requirements Specification

**Date:** 2026-05-19
**Author:** Miguel Ramos
**Status:** APPROVED
**Version:** 0.8.2
**Manifesto:** [`docs/MANIFESTO.md`](./MANIFESTO.md)

---

## Revision Notes

- **v0.8.2 (2026-05-19) — Cross-doc gaps closed: `line-core` and `line-icons` exports documented in §6.2.** A linear cross-check against `docs/ARCHITECTURE.md` revealed that `@websublime/line-core/styles` (referenced 6 times across ARCHITECTURE §14.3–§14.7 + §14.2) was undocumented in the PRD's §6.2 build section. §6.2 now includes: the `styles/` directory in the core src tree (containing the 11 shadow-DOM modular reset sheets); a formal exports map for `@websublime/line-core` (with `.`, `./styles`, and `./mixins/*` subpaths); and a skeleton exports map for `@websublime/line-icons` (full surface finalised in Phase 1 when the icon registry is authored). The two-reset distinction (light-DOM consumer reset at `line-tokens/reset` vs shadow-DOM internal resets at `line-core/styles`) is explicitly cross-referenced. No design changes — pure documentation completeness.
- **v0.8.1 (2026-05-19) — `line-tokens` scope clarified to 18 families (11 primitive + 7 decorative) + reset.** The Phase 0 `line-tokens` package now ships: **11 primitive families** (typography, sizing, shadows, easings, z-index, opacity, motion, radii, border-width, focus-ring, breakpoints) — the essentials any consumer needs — and **7 decorative families** (aspects, animations, gradients, masks, layouts, highlights, svg) — optional and importable individually via subpath. A `./reset` subpath ships zero-opinion browser-defaults neutralisation, applied before any family. Colour-adjacent decorative families (gradients, highlights, svg) are **structural-only** in v0.8 — they reference palette tokens from `line-colors` rather than declaring absolute colour values, preserving Manifesto Law 10 (cross-layer separation). The v0.7 `colors-absolute` family is **removed**; consumers needing black/white absolutes use role-level `--line-{role}-contrast` tokens, palette extremes (`--line-gray-1` / `--line-gray-12`), or hardcoded values. See §9.9 for the full export contract.
- **v0.8.0 (2026-05-19) — Design system realigned to layered package model (5 packages), attribute-based multi-colour theming, Radix-fiel role separation.** The previously planned monolithic `@websublime/line-theme` is **replaced** by five separate packages: `@websublime/line-tokens`, `@websublime/line-colors`, `@websublime/line-schemas`, `@websublime/line-themes`, and `@websublime/line-utils`. Theme switching moves from class-based single-colour (`.line-schema-X`) to attribute-based independent role selection (`data-accent="X"` and `data-gray="Y"`). Palettes scale to 31 hues (Radix Colors 3.x). Semantic colours (`success`, `warning`, `danger`, `info`) are fixed at the root and no longer swappable per theme. The previous CSS-based `schema` concept is replaced by TS contracts (Zod + types) in `line-schemas`; CSS role mappings live in `line-themes`. Light/dark continues to live inside palettes via `light-dark()`. See §9 for full detail.
- **v0.7.0 (2026-03-12) — Branding refactor + 28-palette theme system + foundation tokens + semantic aliases + contrast tokens** (superseded by v0.8.0 in §9; pre-v0.8.0 history retained for traceability).

---

## 1. Vision & Positioning

### 1.1 What is line://ui

line://ui is a headless UI component library built as native Web Components. It provides robust interaction logic via state machines, full visual customisation via CSS `::part()` and CSS custom properties, and works in any framework or no framework at all.

### 1.2 Positioning Statement

> Headless UI primitives as native Web Components. Logic via state machines, total customisation via CSS `::part()`. Framework-agnostic. Optional ready-to-go themes. Integrated developer tooling via inspector.

### 1.3 Competitive Analysis

#### Web Component Libraries Comparison

| Dimension | line://ui | Shoelace | Spectrum | Lion | FAST |
|-----------|-----------|----------|----------|------|------|
| Framework | Web Components (Lit 3+) | Web Components (Lit 3) | Web Components (LitElement) | Web Components (vanilla) | Web Components (FASTElement) |
| Approach | Headless-first + optional themes | Opinionated/styled | Opinionated (Adobe design) | Headless-first | Design system framework |
| State Management | Zag.js state machines | Custom + Popper.js | Custom internal | Custom vanilla JS | FASTElement reactivity |
| Customisation | `::part()` + CSS custom properties (dual-layer) | `::part()` + CSS custom properties | CSS variables; partial `::part()` | `::part()` + CSS custom properties | CSS variables; minimal `::part()` |
| Accessibility | WCAG 2.1 AA via Zag.js | WCAG 2.1 AA (mature) | WCAG 2.1 AA (Adobe standard) | WCAG 2.1 AA+ (core differentiator) | WCAG 2.1 AA (Microsoft standard) |
| Component Count | 131 (planned) | ~90+ (shipped) | ~40-50 | ~40+ | ~60+ |
| Ecosystem | Pre-launch | 20k+ weekly downloads | Enterprise (Adobe products) | Enterprise (ING banking) | Enterprise (Microsoft Fluent) |
| Theming | Headless default; optional 5-package layered design system (31 Radix hues, attribute-based) | 30+ built-in themes | Adobe Spectrum theme | No built-in themes | Fluent Design theme |
| SSR/SSG | Investigation planned post-Phase 1 | Partial (Astro, 11ty) | Limited | Limited | Limited |

A detailed competitive component-by-component gap analysis is available in [`COMPETITIVE-COMPONENT-ANALYSIS.md`](./COMPETITIVE-COMPONENT-ANALYSIS.md) (to be created in Phase 0).

#### Framework-Specific Headless Libraries

The headless-first approach is validated across multiple framework ecosystems, but each is locked to its framework:

| Library | Framework | Components | Approach |
|---------|-----------|------------|----------|
| Radix UI | React-only | ~30+ | Headless primitives, className/CSS-in-JS |
| Bits UI | Svelte-only | ~40+ | Headless primitives, class props + data-* attributes. Inspired by Radix (API), Melt UI (architecture), React Spectrum (a11y) |
| Ark UI | React/Vue/Solid | ~40+ | Headless primitives powered by Zag.js state machines |

**line://ui resolves this fragmentation** — the same headless primitives work in React, Vue, Svelte, Angular, or plain HTML via native Web Components. No adapters, no rewrites.

**Note:** Radix UI remains the most relevant comparison for the React audience:

| Aspect | Radix UI | line://ui |
|--------|----------|-----------|
| Framework | React-only | Framework-agnostic (Web Components) |
| Customisation | className / CSS-in-JS | Native `::part()` + CSS custom properties |
| Composition | JSX children | Slots + light DOM |
| State management | React hooks | Zag.js state machines |
| Cross-framework | Needs adapters | Works everywhere natively |
| Themes | Community-driven | Optional batteries-included themes |

#### line://ui's Genuine Differentiators

- **State machines (Zag.js)** — Production-ready, framework-agnostic logic layer with built-in accessibility. No competitor in the Web Components space uses this approach.
- **Headless-first + optional themes** — Unlike Shoelace or Spectrum which ship opinionated styles, line://ui defaults to zero visual opinion. Themes are an accelerator, never a requirement.
- **Dual-layer CSS customisation** — Both `::part()` for total control and CSS custom properties for quick adjustments. Most competitors offer one or the other, not both as a deliberate strategy.
- **Inspector tooling** — Built-in developer tooling for QA and onboarding, unique in the Web Components ecosystem.
- **HTMX integration (exploratory)** — First-class support for server-rendered HTML workflows, targeting a growing segment underserved by existing component libraries.

#### Where Competitors Are Stronger

- **Shoelace** — Maturity and ecosystem. 20k+ weekly downloads, battle-tested in production, comprehensive documentation.
- **Spectrum / FAST** — Enterprise adoption. Backed by Adobe and Microsoft respectively, with dedicated teams and proven at scale.
- **Lion** — Accessibility DNA. Built by ING's accessibility-first engineering team, with the deepest WCAG compliance in the space.

#### Competitive Risks

- **Shoelace's maturity is an adoption barrier.** Mitigation: focus early phases on core components with superior developer experience (state machines, dual-layer customisation, inspector tooling).
- **Enterprise vendors have brand lock-in.** Mitigation: target teams who explicitly want framework-agnostic and customisation-first, rather than competing for enterprise design system budgets.

### 1.4 Core Principles

1. **Headless-first** — Components carry zero visual opinion. All styling is the consumer's responsibility via `::part()` and `--line-*` custom properties.
2. **Layered design system as accelerator** — Tokens, colours, schemas, themes, and utils ship as five separate packages with a strict downward dependency. Consumers pick the level of opinion they want: a project can import tokens alone, palettes alone, or the full design system. Never mandatory. See §9.
3. **Composition over configuration** — Components connect via `<slot>`, not props. A Field does not import an Input — it accepts any form control via slot. A DatePicker accepts any trigger via slot. Independence is the default.
4. **HTMX as exploration** — Web Components are browser-native. A `<line-dialog>` works in plain HTML served by any backend. HTMX adds server-driven interactivity. First-class support to be explored and validated.
5. **Inspector as dev tooling** — Feature flag via localStorage. When active, every component exposes metadata: version, docs link, scope, QA tags. Useful for QA teams and integrating developers.

### 1.5 Target Users

**Persona 1: Frontend Developer**

Builds SPAs or component-driven UIs. Wants headless components without framework lock-in. Values customisation via `::part()` and CSS custom properties. Frustrated with React-only libraries like Radix that require adapters or rewrites when switching frameworks.

**Persona 2: Backend Developer (HTMX / server-rendered)**

Serves HTML from any backend. Uses HTMX for interactivity. Wants Web Components that work in plain HTML without a build step or JavaScript framework. Values simplicity and progressive enhancement.

### 1.6 Objectives & Success Metrics

Soft targets (aspirational, not blocking):

| Metric | Target | Notes |
|--------|--------|-------|
| Bundle size | < 5KB gzipped per component | Monitored, not blocking |
| Accessibility | axe-core zero violations per component | Hard requirement per component spec |
| Time-to-first-component | 15 minutes | A new developer can create and render a custom line://ui component within 15 minutes using the docs |

No npm download or GitHub stars targets at this stage — premature for a pre-launch project.

### 1.7 Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| Browser support | Chrome, Firefox, Safari — latest 2 stable versions |
| Accessibility | WCAG 2.1 AA (Zag.js provides this natively for state-machine components) |
| Bundle size | Soft target < 5KB gzipped per component |
| SSR/SSG | Out of scope for Phase 0. Investigation planned post-Phase 1 for Astro, Nuxt, Next.js compatibility |
| CDN usage | CDN distribution via unpkg and jsdelivr from Phase 1 onwards. ESM builds are CDN-compatible by default via the package.json `exports` field |
| i18n — RTL | Supported natively via `dir` attribute |
| i18n — Localisation | Localisation of component labels (e.g., "Close", "Dismiss") is the consumer's responsibility via slots and attributes |
| Touch & pointer | All interactive components support both pointer and touch events. Zag.js handles this natively for pre-built machines; custom machines must follow the same pattern |
| Error handling | Components fail gracefully: if a Zag.js machine fails to initialise, the component renders in a static fallback state. No JavaScript errors thrown to the consumer |
| Progressive enhancement | Components that wrap native elements (Input, Textarea, Select) remain functional without JavaScript via light DOM fallback where feasible |

---

## 2. Technology Stack

| Layer | Choice |
|-------|--------|
| Runtime & Package Manager | **Bun** (latest stable) |
| Bundler | **Vite 7+ with Rolldown** |
| Lint & Format | **Biome** (replaces ESLint + Prettier) |
| Component Framework | **Lit 3+** (latest stable) |
| Component Logic | **Zag.js** (latest stable) |
| Foundation Tokens | `@websublime/line-tokens` — 18 families + browser-defaults reset. **Primitives (11):** typography, sizing, shadows, easings, z-index, opacity, motion, radii, border-width, focus-ring, breakpoints. **Decorative (7):** aspects, animations, gradients, masks, layouts, highlights, svg. All `--line-*` prefixed. |
| Colour Palettes | `@websublime/line-colors` — Radix Colors 3.x (31 hues × 12 steps), light/dark via CSS `light-dark()`, sourced from `@radix-ui/colors` npm |
| Schemas (TS) | `@websublime/line-schemas` — TS types + Zod validators (`HUES`, `ACCENT_HUES`, `GRAY_HUES`, `SEMANTIC_MAP`) |
| Role Mappings | `@websublime/line-themes` — CSS role mappings (`--line-accent-*`, `--line-gray-*`, semantics, aliases, auto-pair defaults) |
| Design System Utils | `@websublime/line-utils` — helpers (contrast, mix, etc.) |
| CSS Processing | **PostCSS** (latest stable: `postcss-import`, `postcss-nested`, `postcss-preset-env`, `cssnano`) — handles the design system CSS pipeline. Vite/Rolldown still handles component bundling. |
| All dependencies | **Latest stable versions** |

### 2.1 Stack Rationale

**Bun** — Faster runtime, faster installs, native workspace support. Replaces Node.js + pnpm. Vite is kept for builds as its library mode with Rolldown is more mature than Bun's bundler for library output.

**Vite 7+ with Rolldown** — Rolldown (Rust-based) replaces Rollup internally in Vite 7. Same configuration API, significantly faster builds. Vite 7 stabilises the Rolldown integration that was experimental in earlier versions.

**Biome** — Single tool for lint + format. Rust-based, orders of magnitude faster. Replaces ~10 packages: eslint, prettier, eslint-plugin-import, eslint-plugin-unicorn, eslint-config-prettier, etc.

**Zag.js** — Production-ready state machines for 50+ UI patterns. Framework-agnostic with official Lit adapter (`@zag-js/element`). WAI-ARIA accessibility built-in. Keyboard navigation, focus management, all solved.

**Foundation Tokens (`line-tokens`)** — Non-colour primitives, split into two tiers (18 families total) plus a baseline reset:

- **Primitive families (11):** typography, sizing, shadows, easings, z-index, opacity, motion, radii, border-width, focus-ring, breakpoints. Essentials any application needs.
- **Decorative families (7):** aspects (aspect-ratio tokens), animations (pre-built keyframes), gradients (structural — angles/stops/positions, no colour values), masks (CSS mask shapes), layouts (composition utilities), highlights (`::selection` and similar), svg (SVG structural tokens — stroke widths, mitres, etc., no colour values). Optional surface — consumers import only what they need via subpath.
- **`./reset` subpath:** zero-opinion browser-defaults neutralisation, applied before any family. Consumers may skip if they already use their own reset.

All `--line-*` prefixed. Token names remain singular (`--line-radius-1`, `--line-size-3`); the plural form (`radii`, `sizing`) is the family/export name only. Decorative families that historically reference colour values (e.g., gradients) are **restructured** so their colour terms come from `line-colors` palette tokens, not from absolute values — preserving the Manifesto Law 10 cross-layer separation. The previous `colors-absolute.css` family from v0.7 is **removed** for this reason; consumers needing black/white absolutes use the relevant Radix scale (e.g., `--line-gray-1` / `--line-gray-12`). Open Props served as a design reference for initial values but is NOT used at runtime or build time. Owned, versioned, and shipped as its own leaf package.

**Colour System (`line-colors` + `line-schemas` + `line-themes`)** — Radix-fiel. 31 hues x 12 steps (Radix Colors 3.x). `line-colors` ships pure palette CSS (`--line-amber-1..12`, etc.), sourced from `@radix-ui/colors` npm but committed into the repo so CI does not regenerate every build. `line-schemas` is the TS contract layer (Zod + types) declaring `HUES`, `ACCENT_HUES`, `GRAY_HUES`, and `SEMANTIC_MAP`. `line-themes` ships role-mapping CSS (`--line-accent-*`, `--line-gray-*`, semantic `--line-success/warning/danger/info-*`, named aliases, and the `[data-accent]` / `[data-gray]` selectors). Light/dark lives inside the palette via CSS `light-dark()` — themes are mono-declaration.

---

## 3. Component Architecture

Cross-cutting architectural decisions — composition patterns, state management tiers, styling conventions, base class design, bundle splitting rules, and detailed per-component architectural debates — are documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

Key architectural principles referenced throughout this document:

| Principle | Summary | Reference |
|-----------|---------|-----------|
| Composition via slot | Components connect via `<slot>`, not imports. Field does not import Input. Independence is the default. | [ARCHITECTURE → Composition Model](./ARCHITECTURE.md#2-composition-model) |
| Slot vs Internal Part rule | Consumer controls content → slot. Component coordinates state → internal part. | [ARCHITECTURE → Slot vs Internal Part — Decision Rule](./ARCHITECTURE.md#3-slot-vs-internal-part--decision-rule) |
| Dual-layer CSS | `--line-*` custom properties for token adjustments. `::part()` for total visual control. | [ARCHITECTURE → CSS Customisation — Dual Layer](./ARCHITECTURE.md#4-css-customisation--dual-layer) |
| Three tiers | Pre-built (Zag.js machine), Custom (`createMachine`), Static (no machine). | [ARCHITECTURE → State Management — Unified via Zag.js](./ARCHITECTURE.md#8-state-management--unified-via-zagjs) |
| Form association | Opt-in `formAssociated` mixin via `ElementInternals`. Native `<form>` participation. | [ARCHITECTURE → Form Association Strategy](./ARCHITECTURE.md#7-form-association-strategy) |
| Bundle splitting | Families share one entrypoint. Independent components get separate entrypoints. Slot = independence. | [ARCHITECTURE → Bundle Splitting Rule](./ARCHITECTURE.md#12-bundle-splitting-rule) |
| Field as orchestrator | Connects label/hint/error to any control via slot + events. Does not import controls. | [ARCHITECTURE → Field Architecture](./ARCHITECTURE.md#9-field-architecture) |
| Parts naming | Shared vocabulary across components: `root`, `trigger`, `content`, `overlay`, etc. | [ARCHITECTURE → CSS Parts Naming Convention](./ARCHITECTURE.md#5-css-parts-naming-convention) |

---

## 4. Component Catalogue

Each component has a product-level description below and a detailed technical specification in `docs/specs/`. Specs follow the template defined in [`COMPONENT-SPEC-TEMPLATE.md`](./specs/COMPONENT-SPEC-TEMPLATE.md) (to be created in Phase 0).

> **Note on spec links:** Spec links below point to files that will be created per phase as each component is approved (see §7 Roadmap and §8 Spec Lifecycle). Until then, the links will 404; specs are authored just-in-time before each phase begins.

### 4.1 Primitives Base

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Button | Custom | Primary interactive element for triggering actions. Supports form submit/reset | [spec](./specs/0002-button.md) |
| IconButton | Custom | Icon-only action button. Requires accessible label for screen readers | [spec](./specs/0003-icon-button.md) |
| ButtonGroup | Static | Visually groups related buttons with border collapse and shared navigation | [spec](./specs/0004-button-group.md) |
| SplitButton | Custom | Primary action with dropdown for alternatives. Composes Button + Menu internally | [spec](./specs/0005-split-button.md) |
| Alert | Static | Inline persistent feedback for info, warnings, errors, or success states | [spec](./specs/0006-alert.md) |
| Badge | Static | Small status indicator — count, dot, or label variant | [spec](./specs/0007-badge.md) |
| Chip | Static | Display tag with optional remove. Used for categories, filters, selections | [spec](./specs/0008-chip.md) |
| Avatar | Static | User or entity representation with image, initials fallback, and status | [spec](./specs/0009-avatar.md) |
| AvatarGroup | Custom | Stacked avatars with overflow counter. Expands on hover, popover on overflow click | [spec](./specs/0010-avatar-group.md) |
| Separator | Static | Visual divider between content sections. Horizontal or vertical | [spec](./specs/0011-separator.md) |
| Visually Hidden | Static | Accessibility utility — hides content visually, available to screen readers | [spec](./specs/0012-visually-hidden.md) |
| Portal | Static | Renders child content outside its DOM parent | [spec](./specs/0013-portal.md) |
| Icon | Static | Framework-agnostic icon wrapper with pluggable library registry. Icons are delivered via slot; `@websublime/line-icons` is the recommended default but any icon library (Lucide, Phosphor, Iconoir, etc.) is supported | [spec](./specs/0014-icon.md) |
| Kbd / Shortcut | Static | Keyboard shortcut display with OS-aware rendering (Cmd vs Ctrl) | [spec](./specs/0015-kbd.md) |
| Skeleton | Static | Placeholder loading indicator with pulse or wave animation | [spec](./specs/0016-skeleton.md) |
| Presence | Pre-built | Controls mount/unmount animations for enter/exit transitions | [spec](./specs/0017-presence.md) |
| Stack | Static | Flex layout helper for vertical or horizontal stacking with gap | [spec](./specs/0018-stack.md) |
| Grid | Static | CSS Grid layout wrapper with responsive column control | [spec](./specs/0019-grid.md) |
| Center | Static | Centering utility for horizontal, vertical, or both axes | [spec](./specs/0020-center.md) |
| Aspect Ratio | Static | Maintains fixed width-to-height ratio for responsive media | [spec](./specs/0021-aspect-ratio.md) |
| Spinner | Static | Standalone loading indicator. CSS-only animation, no visual opinion | [spec](./specs/0022-spinner.md) |

### 4.2 Forms — Essential

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Input | Custom | Text input for email, tel, url, and plain text. Detects autofill | [spec](./specs/0023-input.md) |
| PasswordInput | Custom | Password field with built-in visibility toggle | [spec](./specs/0024-password-input.md) |
| SearchInput | Custom | Text input with built-in clear action | [spec](./specs/0025-search-input.md) |
| DateInput | Custom | Masked date field with segment navigation. No popup | [spec](./specs/0026-date-input.md) |
| Textarea | Custom | Multi-line text input with optional auto-resize | [spec](./specs/0027-textarea.md) |
| Field | Custom | Orchestrates label, hint, error, and required indicator for any control | [spec](./specs/0028-field.md) |
| Fieldset | Static | Semantic grouping of related controls with legend and disabled propagation | [spec](./specs/0029-fieldset.md) |
| Checkbox | Pre-built | Binary or indeterminate selection control | [spec](./specs/0030-checkbox.md) |
| Radio Group | Pre-built | Single selection from a set of options | [spec](./specs/0031-radio-group.md) |
| Switch | Pre-built | Toggle between two states (on/off) | [spec](./specs/0032-switch.md) |
| Select | Pre-built | Dropdown with search, groups, and keyboard navigation | [spec](./specs/0033-select.md) |
| Toggle Group | Pre-built | Exclusive or multi-selection between segmented options | [spec](./specs/0034-toggle-group.md) |
| Slider | Pre-built | Single-value selection along a range | [spec](./specs/0035-slider.md) |
| Number Input | Pre-built | Numeric input with increment/decrement controls | [spec](./specs/0036-number-input.md) |
| Editable | Pre-built | Click-to-edit inline text for tables, settings, profiles | [spec](./specs/0037-editable.md) |

### 4.3 Overlays & Feedback

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Dialog | Pre-built | Modal or non-modal dialog for focused interactions | [spec](./specs/0038-dialog.md) |
| Alert Dialog | Pre-built | Confirmation dialog requiring explicit user action | [spec](./specs/0039-alert-dialog.md) |
| Sheet | Pre-built | Side panel — overlay or push mode, any edge | [spec](./specs/0040-sheet.md) |
| Drawer | Pre-built | Temporary sliding panel for supplementary content | [spec](./specs/0041-drawer.md) |
| Popover | Pre-built | Floating content anchored to a trigger | [spec](./specs/0042-popover.md) |
| Tooltip | Pre-built | Brief contextual information on hover or focus | [spec](./specs/0043-tooltip.md) |
| Hover Card | Pre-built | Rich preview content shown on hover | [spec](./specs/0044-hover-card.md) |
| Toast | Pre-built | Transient notification with stacking and auto-dismiss | [spec](./specs/0045-toast.md) |

### 4.4 Navigation & Disclosure

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Tabs | Pre-built | Switchable content panels with keyboard navigation | [spec](./specs/0046-tabs.md) |
| Accordion | Pre-built | Vertically stacked collapsible sections | [spec](./specs/0047-accordion.md) |
| Collapsible | Pre-built | Single expandable/collapsible content section | [spec](./specs/0048-collapsible.md) |
| Menu / Context Menu | Pre-built | Dropdown or right-click menu with submenus | [spec](./specs/0049-menu.md) |
| Navigation Menu | Pre-built | Site-level navigation with mega-menu support | [spec](./specs/0050-navigation-menu.md) |
| Breadcrumb | Static | Hierarchical path showing current location | [spec](./specs/0051-breadcrumb.md) |
| Breadcrumb Trail | Custom | Clickable breadcrumb with sibling dropdown at each level | [spec](./specs/0052-breadcrumb-trail.md) |
| Pagination | Pre-built | Page-based navigation for large datasets | [spec](./specs/0053-pagination.md) |
| Steps / Stepper | Pre-built | Visual progress indicator for multi-step processes | [spec](./specs/0054-steps.md) |
| Menubar | Custom | Horizontal app-style menu bar for desktop-inspired interfaces | [spec](./specs/0055-menubar.md) |

### 4.5 Forms — Advanced

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Combobox | Pre-built | Autocomplete input with filterable options | [spec](./specs/0056-combobox.md) |
| Date Picker | Pre-built | Calendar popup for date selection | [spec](./specs/0057-date-picker.md) |
| Date Range Picker | Pre-built | Two-calendar date range selection | [spec](./specs/0058-date-range-picker.md) |
| Time Picker | Pre-built | Time selection with segments | [spec](./specs/0059-time-picker.md) |
| Color Picker | Pre-built | Visual colour selection | [spec](./specs/0060-color-picker.md) |
| Pin Input | Pre-built | Individual character inputs for OTP codes | [spec](./specs/0061-pin-input.md) |
| Rating | Pre-built | Star or custom icon rating selection | [spec](./specs/0062-rating.md) |
| Range Slider | Pre-built | Dual-thumb slider for value ranges | [spec](./specs/0063-range-slider.md) |
| File Upload | Pre-built | Drag-and-drop file selection with validation | [spec](./specs/0064-file-upload.md) |
| Signature Pad | Pre-built | Drawing canvas for capturing signatures | [spec](./specs/0065-signature-pad.md) |
| Tag Input | Custom | Text-to-tags with autocomplete and reorder | [spec](./specs/0066-tag-input.md) |
| Mention Input | Custom | Textarea with @mention and #channel inline | [spec](./specs/0067-mention-input.md) |
| Search Field | Custom | Full search with suggestions and scoped filtering | [spec](./specs/0068-search-field.md) |
| Wizard | Custom | Multi-step form with validation and branching | [spec](./specs/0069-wizard.md) |

### 4.6 Data Display

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Table | Custom | Headless data table with sort, filter, and selection | [spec](./specs/0070-table.md) |
| Card | Static | Composable container with header, body, and footer | [spec](./specs/0071-card.md) |
| Progress | Pre-built | Linear or circular progress indicator | [spec](./specs/0072-progress.md) |
| Progress Ring | Static | Multiple overlapping circular indicators | [spec](./specs/0073-progress-ring.md) |
| Progress List | Custom | Real-time operation status list | [spec](./specs/0074-progress-list.md) |
| Scroll Area | Pre-built | Custom styled scrollbar preserving native behaviour | [spec](./specs/0075-scroll-area.md) |
| Carousel | Pre-built | Content slider with touch and keyboard | [spec](./specs/0076-carousel.md) |
| Clipboard | Pre-built | Copy-to-clipboard with visual feedback | [spec](./specs/0077-clipboard.md) |
| QR Code | Pre-built | Dynamic QR code generation | [spec](./specs/0078-qr-code.md) |
| Timer | Pre-built | Countdown or stopwatch | [spec](./specs/0079-timer.md) |
| Tree View | Pre-built | Hierarchical expandable data display | [spec](./specs/0080-tree-view.md) |
| Gauge / Meter | Static | Semicircular arc with pointer and zones | [spec](./specs/0081-gauge.md) |
| Empty State | Static | Placeholder for empty content areas | [spec](./specs/0082-empty-state.md) |

### 4.7 Layout & Containers

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| App Shell | Static | Full application layout via slots | [spec](./specs/0083-app-shell.md) |
| Sidebar | Custom | Collapsible side navigation with rail mode | [spec](./specs/0084-sidebar.md) |
| Header / Toolbar | Static | Sticky top bar with slots | [spec](./specs/0085-header.md) |
| Content Area | Static | Scrollable main content with max-width | [spec](./specs/0086-content-area.md) |
| Panel | Custom | Collapsible container with header/body/footer | [spec](./specs/0087-panel.md) |
| Splitter | Pre-built | Resizable panel divider | [spec](./specs/0088-splitter.md) |
| Floating Panel | Pre-built | Draggable window with minimise/maximise/snap | [spec](./specs/0089-floating-panel.md) |

### 4.8 Desktop-Inspired

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Command Palette | Custom | Cmd+K searchable command launcher | [spec](./specs/0090-command-palette.md) |
| Spotlight | Custom | Global search overlay with preview | [spec](./specs/0091-spotlight.md) |
| Status Bar | Static | Bottom information bar with widget slots | [spec](./specs/0092-status-bar.md) |
| Activity Bar | Custom | Vertical icon bar for panel switching | [spec](./specs/0093-activity-bar.md) |
| Notification Center | Custom | Grouped dismissable notification history | [spec](./specs/0094-notification-center.md) |
| Properties Panel | Custom | Contextual property editor for selected items | [spec](./specs/0095-properties-panel.md) |
| Minimap | Static | Miniature content preview with viewport indicator | [spec](./specs/0096-minimap.md) |
| Master-Detail | Custom | Split view: list left, detail right | [spec](./specs/0097-master-detail.md) |
| List View | Custom | Multi-select list with keyboard nav and reorder | [spec](./specs/0098-list-view.md) |
| Segmented Control | Custom | Toggle between 2-5 options with sliding indicator | [spec](./specs/0099-segmented-control.md) |
| Dock | Custom | macOS-style icon bar with magnification | [spec](./specs/0100-dock.md) |

### 4.9 Innovative

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Kanban Board | Custom | Drag-and-drop workflow columns and cards | [spec](./specs/0101-kanban-board.md) |
| Timeline | Static | Chronological event display with branching | [spec](./specs/0102-timeline.md) |
| Data Grid | Custom | High-performance grid with virtual scrolling | [spec](./specs/0103-data-grid.md) |
| Infinite Scroll | Custom | Intersection Observer-based infinite loading | [spec](./specs/0104-infinite-scroll.md) |
| Marquee | Static | Continuous scrolling content | [spec](./specs/0105-marquee.md) |
| Spotlight Card | Static | Cursor-following gradient glow effect | [spec](./specs/0106-spotlight-card.md) |
| Image Comparison | Custom | Before/after slider for two images | [spec](./specs/0107-image-comparison.md) |
| Sparkline | Static | Mini inline chart for data-dense contexts | [spec](./specs/0108-sparkline.md) |
| Flip Card | Static | 3D flip animation between front and back | [spec](./specs/0109-flip-card.md) |
| Morph | Static | Shared layout animation via View Transitions | [spec](./specs/0110-morph.md) |
| Diff Viewer | Static | Side-by-side or unified text comparison | [spec](./specs/0111-diff-viewer.md) |
| Wheel Picker | Custom | iOS-style rotary scroll selection | [spec](./specs/0112-wheel-picker.md) |
| Angle Slider | Pre-built | Circular rotary input for angular values | [spec](./specs/0113-angle-slider.md) |
| Highlight | Pre-built | Text matching and highlighting | [spec](./specs/0114-highlight.md) |
| Tour | Pre-built | Step-by-step product tour | [spec](./specs/0115-tour.md) |

### 4.10 Real-World / Domain Components

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Ballot / Poll | Custom | Voting with live animated results | [spec](./specs/0116-ballot.md) |
| Reaction Bar | Custom | Emoji reactions with counter and toggle | [spec](./specs/0117-reaction-bar.md) |
| Proof / Annotation | Custom | Positional pins/comments on images/documents | [spec](./specs/0118-proof.md) |
| Price Card | Static | Currency display with period and discount | [spec](./specs/0119-price-card.md) |
| Stat Card | Static | Dashboard metric with value, label, and trend | [spec](./specs/0120-stat-card.md) |
| Ticket / Pass | Static | Visual ticket with notch and barcode/QR slot | [spec](./specs/0121-ticket.md) |
| Chat Bubble | Static | Message with tail, status, and reactions | [spec](./specs/0122-chat-bubble.md) |
| Audio Player | Custom | Headless audio controls | [spec](./specs/0123-audio-player.md) |
| Video Player | Custom | Headless video controls with PiP and captions | [spec](./specs/0124-video-player.md) |
| Cookie Consent | Custom | GDPR banner with category toggles | [spec](./specs/0125-cookie-consent.md) |
| Calendar View | Custom | Day/week/month event calendar (not date picker) | [spec](./specs/0126-calendar-view.md) |
| Terminal | Custom | Monospace console with ANSI colours | [spec](./specs/0127-terminal.md) |
| Receipt | Static | Line item layout with subtotal and total | [spec](./specs/0128-receipt.md) |
| Changelog | Static | Chronological release notes | [spec](./specs/0129-changelog.md) |
| Weather Card | Static | Composable weather display | [spec](./specs/0130-weather-card.md) |
| Map Marker | Custom | Customisable map pin with popover | [spec](./specs/0131-map-marker.md) |
| OTP Verification | Custom | Complete verification flow with timer and resend | [spec](./specs/0132-otp-verification.md) |

### 4.11 Catalogue Summary

**By Category:**

| Category | Count |
|----------|-------|
| Primitives Base | 21 |
| Forms — Essential | 15 |
| Overlays & Feedback | 8 |
| Navigation & Disclosure | 10 |
| Forms — Advanced | 14 |
| Data Display | 13 |
| Layout & Containers | 7 |
| Desktop-Inspired | 11 |
| Innovative | 15 |
| Real-World / Domain | 17 |
| **Total** | **131** |

**By Tier:**

| Tier | Count | Description |
|------|-------|-------------|
| Pre-built | 46 | Uses existing `@zag-js/*` machine |
| Custom | 46 | Custom machine via `createMachine()` |
| Static | 39 | Purely presentational |
| **Total** | **131** |

---

## 5. Documentation & Testing

### 5.1 Storybook

**Tool:** Storybook 8+ with `@storybook/web-components-vite`.

**Per-component documentation:**

| Section | Content |
|---------|---------|
| Overview | Description, when to use, when not to use |
| Playground | Interactive story with controls for all props |
| Anatomy | Visual diagram of available parts and slots |
| Parts & Properties | Table of all `::part()` and `--line-*` custom properties |
| Slots | Available slots and what each accepts |
| Accessibility | Keyboard shortcuts, ARIA roles, screen reader behaviour |
| Examples | Real variants — with theme applied and without |
| API | Props, events, methods, CSS custom properties — auto-generated |

**Auto-generated API docs:**

```
Lit source → CEM Analyzer → custom-elements.json → Storybook reads → API docs
```

The `@custom-elements-manifest/analyzer` analyses Lit components and generates the manifest automatically — props, events, slots, CSS parts, CSS custom properties. Storybook reads the manifest and generates the API table without manual documentation.

**Storybook structure:**

```
Storybook
├── Getting Started
│   ├── Installation
│   ├── Theming (data-accent / data-gray attribute approach)
│   ├── Customisation (parts & custom properties)
│   └── Icon Setup (registering icon libraries)
├── Foundation
│   ├── Colours (31 Radix hues + role mappings)
│   ├── Typography (foundation tokens)
│   ├── Spacing & Sizing
│   ├── Shadows & Elevation
│   └── Motion & Easings
├── Components
│   ├── Primitives
│   ├── Forms
│   ├── Overlays
│   ├── Navigation
│   ├── Data Display
│   ├── Layout
│   ├── Desktop-Inspired
│   ├── Innovative
│   └── Real-World
└── Patterns (component compositions)
    ├── Floating Label Field
    ├── Login Form
    ├── Dashboard Layout
    ├── Settings Page
    └── ...
```

**Patterns section:** Shows how to compose multiple line://ui components together for real scenarios. Not components — recipes. Includes the floating label pattern with full CSS.

### 5.2 Testing Strategy

| Layer | Tool | What it tests |
|-------|------|---------------|
| Unit | Bun test + `@open-wc/testing-helpers` | Pure logic, helpers, utilities |
| Component | Bun test + `@open-wc/testing-helpers` | Rendering, props, events, slots |
| A11y | `@storybook/addon-a11y` + axe-core | ARIA compliance, keyboard nav |
| Visual Regression | Playwright screenshots in CI | Detect unintended visual changes |
| Interaction | `@storybook/test` (play functions) | Simulate user flows within stories |

**Minimum test coverage per component:**

1. Renders without errors
2. Reactive props work
3. Slots project content correctly
4. Parts are exposed and accessible via `::part()`
5. Custom properties apply
6. Events fire correctly
7. Keyboard navigation works
8. Accessibility passes (axe-core)

#### 5.2.1 Design System Testing

The design system packages (`line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils`) require additional testing beyond component-level tests to ensure token integrity, accessibility compliance, and visual correctness across all hues and modes.

| Test Category | Tool / Approach | What it validates |
|---------------|----------------|-------------------|
| Build-time token validation | PostCSS plugin or build script | Cross-references all `var()` usage in source CSS against declared tokens in `line-tokens`, `line-colors/src/*.css`, and `line-themes/src/**/*.css`. Fails the build if any token is referenced but undefined. |
| Build-time contrast validation | Automated WCAG AA checker | Verifies 4.5:1 minimum contrast for the 31 hues x relevant role pairs (solid step 9 vs contrast text, background vs high-contrast text, etc.) x light/dark mode. Runs against generated CSS values. |
| Schema validation tests | Bun test + Zod | Verifies that `HUES`, `ACCENT_HUES`, `GRAY_HUES`, and `SEMANTIC_MAP` in `line-schemas` parse cleanly and enumerations match the CSS files generated in `line-themes`. The schemas are the source-of-truth; CI fails on drift. |
| Token parity tests | Bun test assertions | Verifies that every palette token uses `light-dark()` with both a light and dark value in a single declaration. The contrast tokens are single static values, not `light-dark()` pairs. |
| Auto-pair default tests | Bun test assertions | Verifies that each `[data-accent="X"]:not([data-gray])` selector resolves to the documented auto-pair gray (e.g., `data-accent="indigo"` -> slate; `data-accent="amber"` -> sand). Drift fails CI. |
| CSS snapshot tests | Bun test + snapshot | Generates and snapshots the compiled CSS output per hue / role combination. Detects unintended changes to token values, selector specificity, or output structure. |
| Visual regression | Playwright screenshots in CI | Captures screenshots across the `(accent, gray, mode)` combination space. The rendering surface (Storybook stories, a sub-route in one of the apps, or another mechanism) is a spec-level decision; the PRD contract is the coverage definition below, not the surface. Diffs against baseline to detect visual regressions. The exact strategy (full Cartesian, sampling, per-package opt-in, tiered, on-touch) is a Phase 0 spec-level decision, not a PRD-level mandate. |
| `@property` registration with fallbacks | Development-time detection | Registers key tokens via CSS `@property` with obvious fallback values (e.g., `hotpink`) during development. Any `hotpink` visible in the UI indicates an undefined token, making missing tokens immediately visible without build tooling. |

**Visual regression coverage contract.** The PRD locks in *what* must be covered, not *how*. The full strategy — full Cartesian vs. sampling vs. per-package opt-in vs. tiered vs. on-touch — is defined in the Phase 0 design-system spec.

- Every supported `(accent, gray, mode)` combination must have a regression baseline.
- No visual bug in **default-paired combinations** (each accent with its Radix auto-pair gray per §9.5, in both light and dark mode) may reach `main`.
- **Off-pair combinations** (a non-auto-paired gray with a given accent) must be covered, but the frequency and selection mechanism is a spec-level decision.

### 5.3 Public Site

**Tool:** Astro + MDX + line://ui components (dogfooding).

**Deploy:** Cloudflare Pages.

**URL:** `line-ui.websublime.com`

**Site structure:**

| Section | Content |
|---------|---------|
| Landing page | Value proposition, hero, features |
| Docs | Per-component documentation with curated examples |
| Getting started | Installation, quick start, theming |
| Theming showcase | Interactive theme browser section on the site |
| Changelog | Release notes (auto-generated via Changesets) |
| Storybook link | Link to deployed Storybook |

### 5.4 Storybook Deployment

- **GitHub Pages** for production deployment.
- Automatic deployment per PR (preview link).
- Production deployment on merge to main.

---

## 6. Build & Release

### 6.1 Monorepo Structure

The layout is **8 published packages + 2 apps**: 5 design-system packages (`line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils`) and 3 runtime packages (`line-core`, `line-components`, `line-icons`). The `site` and `storybook` workspaces are **apps**, not libraries — they live under `apps/` and are not published to npm.

```
packages/                                 ← 8 published packages
├── core/             ← Base class + Zag adapter + inspector + mixins
├── icons/            ← Icon registry + resolvers for popular libraries
├── tokens/           ← L0 — non-colour: 11 primitive families + 7 decorative families + reset (see §9.1 / §9.9)
├── colors/           ← L1 — Radix palette CSS (--line-amber-1..12, etc.)
├── schemas/          ← L2 — TS types + Zod validators (HUES, ACCENT_HUES, GRAY_HUES, SEMANTIC_MAP)
├── themes/           ← L3 — CSS role mappings + semantics + aliases + auto-pair defaults
├── utils/            ← Design system helpers (contrast, mix, etc.)
└── components/       ← Umbrella package: all components, subpath-exported

apps/                                     ← 2 apps, not published
├── site/             ← Astro docs site (Cloudflare Pages)
└── storybook/        ← Storybook config + stories (GitHub Pages)
```

**Published packages (target — 8):**

| Package | npm name | Layer | Part of design system? |
|---------|----------|-------|------------------------|
| core | `@websublime/line-core` | runtime | No (runtime base) |
| components | `@websublime/line-components` | runtime | No (consumes the design system) |
| tokens | `@websublime/line-tokens` | L0 | Yes |
| colors | `@websublime/line-colors` | L1 | Yes |
| schemas | `@websublime/line-schemas` | L2 | Yes |
| themes | `@websublime/line-themes` | L3 | Yes |
| utils | `@websublime/line-utils` | helper | Yes |
| icons | `@websublime/line-icons` | runtime | **No — optional icon library, slot-delivered. Mirrors the Radix Themes / `@radix-ui/react-icons` split.** |

**Apps (not published):**

| App | Location | Purpose | Deploy target |
|-----|----------|---------|---------------|
| site | `apps/site/` | Astro docs site, dogfoods line://ui | Cloudflare Pages (`line-ui.websublime.com`) |
| storybook | `apps/storybook/` | Stories playground, CEM-driven API docs | GitHub Pages |

**`line-components` is a single umbrella package, not per-component packages.** All components ship inside one `@websublime/line-components` package with **one version and one changelog**. Each component is independently importable via a **subpath export** (`@websublime/line-components/button`, `@websublime/line-components/dialog`, etc.). Per Manifesto Law 6 (bundle isolation), component files are side-effecting only by `customElements.define()` at module top — importing one component never executes another. A central barrel that imports every component is explicitly forbidden. Families share a subpath only when their slots make them inseparable. This is **not** a Lerna-style "one package per component" layout; the umbrella keeps a single source of truth, while subpath exports preserve tree-shaking and bundle isolation.

**Dependency rules (Manifesto Law 10):** `themes -> colors + schemas`; `utils -> schemas`. `tokens`, `colors`, `schemas` are leaves. No cross-layer leakage (palette values inside themes, semantic CSS inside tokens, runtime code inside CSS-only packages) is allowed.

**`line-icons` position.** `@websublime/line-icons` is **not** part of the design system. The design system is exactly the five packages `line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils`. `line-icons` is a separate, optional icon library that shares the line://ui brand and naming conventions (`line-*` prefix). Components that need icons expose **slots** (per Manifesto Law 4: composition over inheritance, slots over props); consumers may fill those slots with `line-icons` or any other icon library (Lucide, Phosphor, Iconoir, `@radix-ui/react-icons`, etc.). Dependency direction is one-way: `line-icons -> line-tokens` is permitted (icons reuse icon-size / sizing tokens); the inverse is forbidden.

**Workspace tooling:** Bun workspaces (`bun.lock`, `bunfig.toml`, `bun --filter` build script already in place). Versioning via Changesets (published packages only). Package naming `@websublime/line-*`.

**Apps (private workspaces):** `apps/site`, `apps/storybook` — built and deployed by CI, never published to npm.

### 6.2 Build — Vite 7+ with Rolldown

**Core package (`@websublime/line-core`):**

```
src/ → Vite library mode → dist/
  ├── index.js          ← Main barrel (LineElement + mixins + utilities)
  ├── line-element.js   ← Base class
  ├── mixins/           ← Individual mixins (inspector, metadata, direction, form-associated)
  ├── utilities/        ← Helpers, decorators
  ├── styles/           ← Shadow-DOM internal reset sheets (reset.common.css, reset.input.css, reset.button.css, reset.textarea.css, reset.select.css, reset.range.css, reset.progress.css, reset.summary.css, reset.fieldset.css, reset.table.css, reset.scrollbar.css) exposed as singleton `CSSStyleSheet` objects via the `./styles` subpath — see [ARCHITECTURE.md §14.3–§14.7](./ARCHITECTURE.md#14-browser-defaults-neutralisation)
  └── types/            ← .d.ts
```

**Core exports map (`@websublime/line-core`):**

```json
{
  "exports": {
    ".":           { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./styles":    { "types": "./dist/styles/index.d.ts", "import": "./dist/styles/index.js" },
    "./mixins/*":  { "types": "./dist/mixins/*.d.ts", "import": "./dist/mixins/*.js" }
  }
}
```

The `./styles` subpath is consumed exclusively by components (each component imports only the reset sheets it needs via `static styles`). Consumers do **not** import `@websublime/line-core/styles` directly — these are shadow-DOM internal resets, distinct from the consumer-side light-DOM reset at `@websublime/line-tokens/reset` (see §9.9 and ARCHITECTURE §14.2 for the two-reset distinction).

**Icons package (`@websublime/line-icons`):**

Skeleton exports map (full surface is finalised in Phase 1 when the icon registry is authored — see PRD §7 Phase 0/1 boundaries and ARCHITECTURE §11):

```json
{
  "exports": {
    ".":           { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  }
}
```

The icons package consumes `@websublime/line-tokens` for icon-size and stroke-width tokens but exposes no CSS itself. Icon resolvers (Lucide, Phosphor, Iconoir, custom) are registered by the consumer at runtime; the registry API will likely add subpaths such as `./registry` and `./resolvers/*` in Phase 1.

**Components umbrella package — subpath exports per component:**

`@websublime/line-components` is a single umbrella package. Each component family or independent component is exposed as a **subpath export** in `package.json` (see [ARCHITECTURE → Bundle Splitting Rule](./ARCHITECTURE.md#12-bundle-splitting-rule)). There is no central barrel that imports every component; the root `"."` export is intentionally minimal (types and shared utilities only).

```json
{
  "exports": {
    "./button":         "./dist/button.js",
    "./icon-button":    "./dist/icon-button.js",
    "./button-group":   "./dist/button-group.js",
    "./input":          "./dist/input.js",
    "./password-input": "./dist/password-input.js",
    "./search-input":   "./dist/search-input.js",
    "./date-input":     "./dist/date-input.js",
    "./field":          "./dist/field.js",
    "./fieldset":       "./dist/fieldset.js",
    "./dialog":         "./dist/dialog.js",
    "./tabs":           "./dist/tabs.js",
    "./alert":          "./dist/alert.js",
    "./chip":           "./dist/chip.js",
    "./avatar":         "./dist/avatar.js",
    "./avatar-group":   "./dist/avatar-group.js"
  }
}
```

Each subpath entry may carry type-condition variants (`types`, `import`, `default`) where dual-publishing or `.d.ts` co-location requires it.

**Side-effect contract.** Each component file calls `customElements.define()` at module top — this is the only side-effect. Importing one component never imports another. The umbrella package therefore declares `"sideEffects"` listing exactly the per-component dist files, so bundlers can tree-shake unused subpaths even when consumers use the root specifier.

Consumer imports surgically:

```js
import '@websublime/line-components/button'
import '@websublime/line-components/field'
import '@websublime/line-components/input'
```

**Design system packages (5 packages, layered):**

Each package ships its own granular exports. Example (`@websublime/line-themes`):

```json
{
  "name": "@websublime/line-themes",
  "exports": {
    ".":                "./dist/index.css",
    "./accent/*":       "./dist/accent/*.css",
    "./gray/*":         "./dist/gray/*.css",
    "./semantics":      "./dist/semantics.css",
    "./aliases":        "./dist/aliases.css",
    "./defaults":       "./dist/defaults.css"
  }
}
```

`@websublime/line-colors` and `@websublime/line-tokens` follow the same per-hue / per-family granular pattern. `@websublime/line-schemas` ships TS only (no CSS). `@websublime/line-utils` ships TS helpers. See §9 for the full export contract.

### 6.3 Types

Dual generation:

1. **TypeScript declarations** (`.d.ts`) — Type safety in imports.
2. **Custom Elements Manifest** (`custom-elements.json`) — For Storybook, IDEs, and any tooling consuming the standard.

### 6.4 Release — Changesets

| Aspect | Choice |
|--------|--------|
| Versioning | **Changesets** |
| Registry | **npm public** |
| Snapshot releases | Maintained for canary testing |
| Changelog | Generated by Changesets → published on site |

**Release workflow:**

```
PR merged → main
  → CI: build all packages
  → CI: tests (bun test)
  → CI: visual regression (Playwright)
  → CI: Changesets detects version bump
  → CI: publish to npm
  → CI: deploy Storybook
  → CI: deploy site (if changed)
  → CI: generate GitHub release notes
```

### 6.5 CI/CD — GitHub Actions

```
Workflows:
├── checks.yml              ← PRs: build + test + lint
├── release.yml             ← main: Changesets publish + deploy
├── snapshot-deploy.yml     ← Snapshot deployment
└── snapshot-version.yml    ← Snapshot versioning
```

**PR checks:**

1. Bun install
2. Biome lint + format check
3. Build all packages
4. Bun test (unit + component)
5. Playwright visual regression
6. Storybook build + preview deploy
7. CEM generation check

#### Release Candidate Strategy

- Feature branches merge into `next`
- Merge to `next` triggers automatic release candidate (RC) builds
- No stable releases during Phase 0, only RCs
- Stable releases begin from Phase 1 onwards via merge to `main`

---

## 7. Roadmap & Phases

**Note:** Phase assignments may differ from catalogue categories due to complexity dependencies and incremental delivery strategy.

### 7.1 Versioning Strategy

- **Minor bump per phase:** 0.1.0 → 0.2.0 → 0.3.0 → ...
- **Major 1.0.0:** When all phases are complete.

#### Breaking Changes Policy

- **Pre-1.0:** Breaking changes are expected in minor bumps (0.x to 0.y), documented in changelogs via Changesets.
- **Post-1.0:** Strict semver — breaking changes only in major bumps with migration guides.
- **Deprecation:** Deprecated APIs are marked with JSDoc `@deprecated`, kept for at least 1 minor version, then removed in the next minor (pre-1.0) or major (post-1.0).

### 7.2 Phase 0 — Foundation (no UI components)

| Task | Detail | Status | Priority |
|------|--------|--------|----------|
| Review & refactor Inspector | Existing component in core. Feature flag via localStorage, outline on hover, version display. Review current implementation, enhance with: docs/storybook link, exposed CSS parts, slot usage, optional metadata panel. Inspired by Bit.dev's original component inspection concept — unique differentiator in the Web Components space | Todo | **P0** |
| Migrate to Bun | Runtime + workspaces, remove pnpm | Review pending | P0 |
| Migrate to Biome | Remove ESLint + Prettier + all plugins, configure Biome | Review pending | P0 |
| Update all dependencies | Lit 3+, Vite 7+ with Rolldown, PostCSS latest | Review pending | P0 |
| Refactor LineElement | Base class with Zag.js lifecycle (via the `@zag-js/element` adapter) and mixins (inspector, metadata, direction, form-associated). | Todo | P0 |
| FormAssociated mixin | Implement opt-in `formAssociated` mixin in LineElement using `ElementInternals`. Provides: `setFormValue()`, `reportValidity()`, `checkValidity()`, `:invalid`/`:valid` states | Todo | P0 |
| Restructure monorepo | 8 published packages + 2 apps. Packages: core, components (umbrella with per-component subpath exports), tokens, colors, schemas, themes, utils, icons (5 of which are the layered design system). Apps (not published): `apps/site`, `apps/storybook`. | Todo | P0 |
| Setup Storybook 8 | `@storybook/web-components-vite` + CEM analyzer | Todo | P1 |
| Setup testing | Bun test + `@open-wc/testing-helpers` + Playwright | Todo | P1 |
| Setup CI/CD | GitHub Actions: checks, release, snapshot-deploy, snapshot-version | Todo | P1 |
| Define RC pipeline | Release candidate pipeline for `next` branch | Todo | P1 |
| npm scope | Configure `@websublime/line-*` on npm | Todo | P0 |
| Design system v2 (5 packages) | Author the 5-package layered design system from scratch under `packages/`: `line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils`. Source palettes from `@radix-ui/colors` (31 hues x 12 steps). Build pipeline (PostCSS) generates `themes/src/accent/*.css` and `themes/src/gray/*.css` mechanically from the TS lists in `line-schemas`. Commit generated CSS into `line-colors/src/`. | Todo | P0 |
| Icon registry | Agnostic resolver system | Todo | P1 |
| Base documentation | Getting started, theming guide, customisation guide in Storybook | Todo | P1 |
| Validate HTMX integration | Spike: validate `LineHtmxElement` adapter with `hx-*` forwarding, server-driven state, swap-aware lifecycle. Determine if exploratory or committed for Phase 1 | Todo | P2 |

**Phase 0 Status:** Tasks marked "Review pending" are functionally complete but require verification of quality and integration before sign-off.

**Exit criteria:**
- All tasks marked "Done" with review completed.
- Monorepo structure matches target (8 published packages + 2 apps).
- All 5 design-system packages (`line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils`) authored under `packages/` with build pipeline operational (PostCSS for design system; Vite/Rolldown for component bundling).
- Palettes generated from `@radix-ui/colors` and committed; role mappings and auto-pair defaults functional; CSS snapshot tests pass.
- Schema-validation tests (Zod) pass; `HUES`, `ACCENT_HUES`, `GRAY_HUES`, `SEMANTIC_MAP` match the generated CSS.
- Build-time contrast validation passes for all 31 hues x relevant role pairs x light/dark.
- `LineElement` refactor complete: a developer can create, build, test, and document a new component using the base class and its mixins (inspector, metadata, direction, form-associated).
- FormAssociated mixin operational with native `<form>` elements (`setFormValue`, `reportValidity`, `checkValidity`, `:invalid`/`:valid` states verified).
- Inspector refactored and operational (feature flag via `localStorage`, hover outline, version display, metadata exposure).
- Icon registry operational (agnostic resolver verified with at least one icon library).
- HTMX integration spike completed; outcome (exploratory vs committed for Phase 1) documented.
- CI/CD pipeline operational (checks + RC releases on `next`; Storybook + site preview deploys verified).
- npm scope `@websublime/line-*` configured; packages publishable (verified via snapshot/canary tag).
- Base documentation published in Storybook (Getting Started, Theming, Customisation).

**Deliverable:** Functional monorepo. Zero UI components, but any developer can create a line://ui component with the base class and have everything working — build, test, docs, release.

**Version:** 0.1.0

### 7.3 Phase 1 — Core Primitives (v0.2.0)

| Component | Zag.js |
|-----------|--------|
| Button | Custom |
| IconButton | Custom |
| ButtonGroup | Static |
| Alert | Static |
| Chip | Static |
| Badge | Static |
| Avatar | Static |
| AvatarGroup | Custom |
| Separator | Static |
| Visually Hidden | Static |
| Portal | Static |
| Icon | Static |
| Kbd / Shortcut | Static |
| Skeleton | Static |
| Presence | Pre-built |
| Stack | Static |
| Grid | Static |
| Center | Static |
| Aspect Ratio | Static |
| Spinner | Static |

**20 components.** Validates architecture, parts convention, slot/part decision rule, umbrella build pipeline (subpath exports per component), bundle splitting, and automatic documentation.

**Exit criteria:**
- All listed components pass the 8-point test checklist (§5.2)
- Storybook documentation complete for every component
- Zero axe-core violations
- CEM manifest generated and verified
- Changeset entry for every component
- Bundle splitting verified — families and independents work as documented

**Parallel:** Landing page for site.

### 7.4 Phase 2 — Essential Forms (v0.3.0)

| Component | Zag.js |
|-----------|--------|
| Input | Custom |
| PasswordInput | Custom |
| SearchInput | Custom |
| DateInput | Custom |
| Textarea | Custom |
| Field | Custom |
| Fieldset | Static |
| Checkbox | Pre-built |
| Radio Group | Pre-built |
| Switch | Pre-built |
| Select | Pre-built |
| Toggle Group | Pre-built |
| Slider | Pre-built |
| Number Input | Pre-built |
| Editable | Pre-built |

**15 components.** First substantial Zag.js integration in forms — both pre-built and custom machines applied at scale. Validates machine + Lit + parts pattern in form contexts. Validates Field orchestration, formAssociated integration, and the slot/part decision rule for internal elements (toggle, clear, increment).

**Exit criteria:**
- All listed components pass the 8-point test checklist (§5.2)
- Field correctly detects child state via events, validity, and explicit props
- formAssociated components participate in native `<form>` submit, reset, and validation
- Storybook documentation complete for every component
- Floating label pattern documented in Storybook Patterns section
- Zero axe-core violations
- CEM manifest generated and verified
- Changeset entry for every component

**Parallel:** Theming showcase on site.

### 7.5 Phase 3 — Overlays & Navigation (v0.4.0)

| Component | Zag.js |
|-----------|--------|
| Dialog | Pre-built |
| Alert Dialog | Pre-built |
| Sheet | Pre-built |
| Drawer | Pre-built |
| Popover | Pre-built |
| Tooltip | Pre-built |
| Hover Card | Pre-built |
| Toast | Pre-built |
| Tabs | Pre-built |
| Accordion | Pre-built |
| Collapsible | Pre-built |
| Menu / Context Menu | Pre-built |
| SplitButton | Custom |
| Breadcrumb | Static |
| Breadcrumb Trail | Custom |
| Menubar | Custom |

**16 components.** Complex components with focus management, portals, animations. Validates overlays and sub-component composition. SplitButton enters here because it depends on Button (Phase 1) + Menu logic. Menubar enters here because it coordinates multiple Menu instances.

**Exit criteria:**
- All listed components pass the 8-point test checklist (§5.2)
- Storybook documentation complete for every component
- Zero axe-core violations
- CEM manifest generated and verified
- Changeset entry for every component

### 7.6 Phase 4 — Advanced Forms (v0.5.0)

| Component | Zag.js |
|-----------|--------|
| Combobox | Pre-built |
| Date Picker | Pre-built |
| Date Range Picker | Pre-built |
| Time Picker | Pre-built |
| Color Picker | Pre-built |
| Pin Input | Pre-built |
| Rating | Pre-built |
| Range Slider | Pre-built |
| File Upload | Pre-built |
| Signature Pad | Pre-built |
| Tag Input | Custom |
| Mention Input | Custom |
| Search Field | Custom |

**13 components.** The most complex in the catalogue. DatePicker composes with DateInput (Phase 2) as optional trigger.

**Exit criteria:**
- All listed components pass the 8-point test checklist (§5.2)
- DatePicker + DateInput composition verified
- Storybook documentation complete for every component
- Zero axe-core violations
- CEM manifest generated and verified
- Changeset entry for every component

### 7.7 Phase 5 — Data Display & Advanced Navigation (v0.6.0)

| Component | Zag.js |
|-----------|--------|
| Table | Custom |
| Card | Static |
| Progress | Pre-built |
| Progress Ring | Static |
| Progress List / Task Steps | Custom |
| Scroll Area | Pre-built |
| Carousel | Pre-built |
| Pagination | Pre-built |
| Steps / Stepper | Pre-built |
| Wizard / Multi-step Form | Custom |
| Tree View | Pre-built |
| Navigation Menu | Pre-built |
| Clipboard | Pre-built |
| QR Code | Pre-built |
| Timer | Pre-built |

**15 components.**

**Exit criteria:**
- All listed components pass the 8-point test checklist (§5.2)
- Storybook documentation complete for every component
- Zero axe-core violations
- CEM manifest generated and verified
- Changeset entry for every component

### 7.8 Phase 6 — Layout & Desktop-Inspired (v0.7.0)

| Component | Zag.js |
|-----------|--------|
| App Shell | Static |
| Sidebar | Custom |
| Header / Toolbar | Static |
| Content Area | Static |
| Panel | Custom |
| Splitter / Resizable Panels | Pre-built |
| Floating Panel / Window | Pre-built |
| Status Bar | Static |
| Activity Bar | Custom |
| Command Palette | Custom |
| Notification Center | Custom |
| Master-Detail | Custom |
| List View | Custom |
| Segmented Control | Custom |
| Minimap | Static |
| Properties Panel | Custom |

**16 components.** Layout pieces and desktop patterns. line://ui starts seriously differentiating here.

**Exit criteria:**
- All listed components pass the 8-point test checklist (§5.2)
- Storybook documentation complete for every component
- Zero axe-core violations
- CEM manifest generated and verified
- Changeset entry for every component

### 7.9 Phase 7 — Innovative (v0.8.0)

| Component | Zag.js |
|-----------|--------|
| Spotlight | Custom |
| Kanban Board | Custom |
| Timeline | Static |
| Data Grid | Custom |
| Infinite Scroll | Custom |
| Dock | Custom |
| Marquee | Static |
| Spotlight Card | Static |
| Image Comparison | Custom |
| Sparkline | Static |
| Flip Card | Static |
| Morph / Shared Layout | Static |
| Diff Viewer | Static |
| Wheel Picker | Custom |
| Angle Slider | Pre-built |
| Highlight | Pre-built |
| Tour | Pre-built |
| Empty State | Static |

**18 components.**

**Exit criteria:**
- All listed components pass the 8-point test checklist (§5.2)
- Storybook documentation complete for every component
- Zero axe-core violations
- CEM manifest generated and verified
- Changeset entry for every component

### 7.10 Phase 8 — Real-World / Domain (v0.9.0)

Phase 8 includes a **Notes** column for clarification — these domain components are less self-evident than the named primitives in earlier phases. Other phases use only Component + Zag.js columns.

| Component | Zag.js | Notes |
|-----------|--------|-------|
| Ballot / Poll | Custom | Voting with live animated results |
| Reaction Bar | Custom | Emoji reactions |
| Proof / Annotation | Custom | Positional pins/comments |
| Price / Pricing Card | Static | Currency, discount |
| Stat Card | Static | Dashboard building block |
| Ticket / Pass | Static | Visual notch, QR slot |
| Chat Bubble | Static | Status, reply, reactions |
| Audio Player | Custom | Headless controls |
| Video Player | Custom | Headless controls |
| Cookie Consent | Custom | GDPR banner |
| Calendar / Event View | Custom | Day/week/month |
| Terminal / Console | Custom | Monospace output |
| Receipt / Invoice | Static | Line items layout |
| Changelog | Static | Release notes component |
| Gauge / Meter | Static | Semicircular |
| Weather Card | Static | Composable |
| Map Marker / Pin | Custom | Customisable marker with popover |
| OTP / Verification | Custom | Beyond pin input |

**18 components.**

**Exit criteria:**
- All listed components pass the 8-point test checklist (§5.2)
- Storybook documentation complete for every component
- Zero axe-core violations
- CEM manifest generated and verified
- Changeset entry for every component

**Version after Phase 8: 1.0.0** — Full catalogue complete.

### 7.11 Nice-to-have (post-1.0)

| Component/Feature | Description |
|-------------------|-------------|
| FloatingField | Convenience component wrapping Field + floating label CSS. Pattern documented in Storybook covers 95% of cases |
| line-form | Convenience wrapper adding: submit handling with loading state, error distribution by `name`, focus-first-error. Each framework has its own form management — this is application-level |

### 7.12 Roadmap Summary

```
Phase 0 ─── Foundation & Tooling ──────────── v0.1.0
Phase 1 ─── 20 core primitives ────────────── v0.2.0
Phase 2 ─── 15 essential forms ────────────── v0.3.0
Phase 3 ─── 16 overlays & navigation ──────── v0.4.0
Phase 4 ─── 13 advanced forms ─────────────── v0.5.0
Phase 5 ─── 15 data display & nav ─────────── v0.6.0
Phase 6 ─── 16 layout & desktop ───────────── v0.7.0
Phase 7 ─── 18 innovative ─────────────────── v0.8.0
Phase 8 ─── 18 real-world / domain ────────── v0.9.0
                                        ──── v1.0.0
                                    131 components
```

---

## 8. Component Specifications

Individual component specifications live in [`docs/specs/`](./specs/). Each spec follows the template defined in [`COMPONENT-SPEC-TEMPLATE.md`](./specs/COMPONENT-SPEC-TEMPLATE.md) (to be created in Phase 0).

### 8.1 Spec Structure

Each spec has two clearly separated sections:

- **Part A — Requirements:** Description, use cases, anti-patterns, user expectations, connections to other components, variants. Written for PMs, designers, and developers evaluating the library.

- **Part B — Technical Specification:** Anatomy, API (props, events, slots, parts, CSS custom properties), machine states, keyboard navigation, accessibility, bundle/entrypoint details, and markup examples. Written for developers implementing or consuming the component.

### 8.2 Spec Lifecycle

| Status | Meaning |
|--------|---------|
| `proposed` | Draft written, not yet reviewed |
| `reviewed` | Reviewed by at least one other person |
| `approved` | Ready for implementation |
| `implemented` | Component shipped, spec is the source of truth |

Specs are created **just-in-time** — before each phase begins, not upfront for the entire catalogue. This avoids waste from decisions that change during implementation.

### 8.3 RFC Process

New components require a spec in `docs/specs/` before implementation begins. The spec must be in `approved` status before any code is written. Pull requests that add new components without a corresponding spec will be rejected.

---

## 9. Design System — Layered Package Model

> **Structural refactor required:** The repository workspace is already named `@websublime/line-ui`, but the target package layout (5 design-system packages + 3 runtime packages under `@websublime/line-*`) has not yet been authored under `packages/`. v0.8.0 stands up that layout with attribute-based multi-colour theming and Radix-fiel role separation. The codebase refactor to align with this specification is a Phase 0 task (see §9.13 Structural Refactor).

### 9.1 Layered Package Model

The design system comprises exactly **five separate packages** — `line-tokens`, `line-colors`, `line-schemas`, `line-themes`, and `line-utils` — each one a layer of opinion that consumers can pick from. `@websublime/line-icons` is a separate, optional icon library that follows the same naming conventions but is **not** part of the design system; it mirrors the Radix Themes / `@radix-ui/react-icons` split. Cross-layer leakage (palette values inside themes, semantic CSS inside tokens, runtime code inside CSS-only packages) is forbidden by Manifesto Law 10.

```
packages/
├── @websublime/line-tokens     L0  primitives + decorative (non-colour: 11 primitive + 7 decorative families + reset — see §9.9)
├── @websublime/line-colors     L1  Radix palette CSS, pure (--line-amber-1..12, etc.)
├── @websublime/line-schemas    L2  TS types + Zod validators (HUES, ACCENT_HUES, GRAY_HUES, SEMANTIC_MAP)
├── @websublime/line-themes     L3  CSS role mappings + semantics + aliases + auto-pair defaults
└── @websublime/line-utils      —   helpers (contrast, mix, etc.)
```

**Dependencies:** `themes -> colors + schemas`; `utils -> schemas`. `tokens`, `colors`, `schemas` are leaves. Dependencies are strictly downward; no upward or sideways imports.

**Consumer entry points:**

| Goal | Minimum import |
|------|----------------|
| Tokens only (no colour opinion) | `@websublime/line-tokens` |
| Tokens + Radix palettes (no role mapping) | `@websublime/line-tokens` + `@websublime/line-colors` |
| Full design system | `@websublime/line-tokens` + `@websublime/line-colors` + `@websublime/line-themes` |
| Validate hue/role choices at build time | add `@websublime/line-schemas` |
| Programmatic colour helpers | add `@websublime/line-utils` |

### 9.2 Colour System — Radix-fiel

The colour system is **faithful to Radix Colors 3.x**, not a custom 28-palette reinterpretation. `@websublime/line-colors` ships pure palette CSS files, one per hue, generated from the `@radix-ui/colors` npm package.

**31 hues total:**

| Group | Hues | Count |
|-------|------|-------|
| Saturated | tomato, red, ruby, crimson, pink, plum, purple, violet, iris, indigo, blue, cyan, teal, jade, green, grass, bronze, gold, brown, orange, amber, yellow, lime, mint, sky | 25 |
| Grayscales | gray, mauve, slate, sage, olive, sand | 6 |
| **Total** | | **31** |

`ACCENT_HUES` (the set of hues usable as accent) = all 31. `GRAY_HUES` (the set of hues usable as neutral / gray role) = only the 6 grayscales.

**12-step structure per hue (Radix-standard):**

| Step | Use |
|------|-----|
| 1 | App background |
| 2 | Subtle background — cards, panels |
| 3 | UI element background |
| 4 | UI element background hover |
| 5 | UI element background active |
| 6 | Subtle borders / separators |
| 7 | UI element border / focus ring |
| 8 | UI element border hover |
| 9 | Solid backgrounds (primary action) |
| 10 | Solid hover |
| 11 | Low-contrast text |
| 12 | High-contrast text |
| `contrast` | Foreground colour for text on step-9 solid (separate token) |

The 12 functional roles are Radix-standard; light and dark step values are independently crafted by Radix, not algorithmic inversions.

**Light/dark in the palette via `light-dark()`:**

```css
/* line-colors/src/blue.css */
:where(html) {
  --line-blue-1: light-dark(hsl(206, 100%, 99.2%), hsl(214, 60%, 9%));
  --line-blue-2: light-dark(hsl(210, 100%, 98.0%), hsl(214, 64%, 11%));
  /* ... through --line-blue-12 */
  --line-blue-contrast: #fff;   /* static, single value per hue — NOT light-dark() */
}
```

The active value is chosen by the browser via the computed `color-scheme` property (see §9.8). Themes are **mono-declaration** — they do not declare separate `{ light, dark }` blocks.

**Contrast tokens are static single values per hue (Radix Themes convention).** The 12 numeric steps are wrapped in `light-dark()` because they have distinct light- and dark-mode pixel values. The `--line-{hue}-contrast` token is **not** mode-aware: it is a single fixed colour per hue chosen so that text on step 9 meets WCAG AA in both modes. Most hues use `#fff` (white text on the saturated step 9); the bright-step-9 hues — `amber`, `yellow`, `lime`, `mint`, `sky`, `cyan` — use `#000` (black text). This mapping is a fixed per-hue table, not derived at runtime.

The role-level alias inherits from the hue-level token: `--line-accent-contrast` resolves to whatever `--line-{chosen-accent-hue}-contrast` evaluates to (selected via `data-accent`). Likewise for `--line-gray-contrast`, `--line-success-contrast`, etc. None of the contrast tokens — hue-level or role-level — are wrapped in `light-dark()`.

**Semantic-by-step, not mirror-by-mode.** Each of the 12 steps has a **fixed semantic function** that is identical in light and dark mode. Step 1 is always "app background"; step 9 is always "solid brand"; step 11 is always "low-contrast text"; step 12 is always "high-contrast text". The pixel values differ between modes — a step 1 in light mode is near-white, a step 1 in dark mode is near-black — but the **role of step N never changes**. This is the Radix Colors invariant.

This rules out an "inverted/mirrored" dark mode where step N in dark would map to step (13−N) in light. Such a model breaks all components that rely on a fixed per-step semantic and is **not** Radix-fiel.

### 9.3 Role-Based Theming

Components consume **role variables**, never hue variables directly. There are six roles:

| Role | Purpose | User-selectable? |
|------|---------|------------------|
| `accent` | Brand / primary action | Yes, via `data-accent` |
| `gray` | Neutrals (text, surfaces, borders) | Yes, via `data-gray` (or auto-paired from accent) |
| `success` | Confirmation, positive feedback | No — fixed at root (`green`) |
| `warning` | Caution | No — fixed at root (`amber`) |
| `danger` | Errors, destructive actions | No — fixed at root (`red`) |
| `info` | Informational | No — fixed at root (`blue`) |

**Why semantic roles are fixed:** A red error or green success is a usability invariant. Allowing them to be re-skinned per theme breaks user expectation and accessibility patterns. They live in `:root` and resolve to their mapped hue regardless of `data-accent` / `data-gray` choice.

**SEMANTIC_MAP (declared in `line-schemas`, applied in `line-themes/src/semantics.css`):**

```ts
export const SEMANTIC_MAP = {
  success: 'green',
  warning: 'amber',
  danger:  'red',
  info:    'blue',
} as const;
```

### 9.4 Theme Application — DOM Attributes (No `data-theme`)

Themes are **not entities**. A "theme" is the pair `(accent, gray)` chosen via two independent DOM attributes. There is no aggregator `data-theme="X"` attribute.

```html
<!-- Default theme (indigo accent, auto-paired slate gray) -->
<html>

<!-- Explicit accent, auto-paired gray -->
<html data-accent="amber">         <!-- pairs with sand -->

<!-- Explicit accent + explicit gray -->
<html data-accent="amber" data-gray="slate">

<!-- Scoped to a section: theming nests naturally -->
<section data-accent="violet">...</section>
<aside data-accent="crimson" data-gray="mauve">...</aside>
```

Because `accent` and `gray` are independently namespaced (`--line-accent-*` vs `--line-gray-*`), **multiple colour contexts can coexist on the same page** without conflict.

### 9.5 Defaults & Auto-Pairing

**Default accent (when no `data-accent` is set):** `indigo`.
**Default gray:** auto-paired from accent, Radix-style. If the consumer sets `data-accent` without `data-gray`, the gray role binds automatically to the curated neutral pair.

**Auto-pair table:**

| Accent | Paired gray |
|--------|-------------|
| `gray`, `mauve`, `slate`, `sage`, `olive`, `sand` (grayscales used as accent) | same as accent (self-paired) |
| `tomato`, `red`, `ruby`, `crimson`, `pink`, `plum`, `purple` | `mauve` |
| `violet`, `iris`, `indigo`, `blue`, `sky`, `cyan` | `slate` |
| `teal`, `jade`, `mint`, `green` | `sage` |
| `grass`, `lime` | `olive` |
| `bronze`, `gold`, `brown`, `amber`, `yellow`, `orange` | `sand` |

When a grayscale is used as accent, the gray role self-pairs (i.e., the same grayscale appears in both roles). This avoids a hue mismatch and follows Radix Themes convention.

**Implementation** (in `line-themes/src/defaults.css`): a `[data-accent="X"]:not([data-gray])` selector per accent maps the gray role to the paired hue. An explicit `data-gray="Y"` always wins.

**Auto-pair in nested scopes.** The selector `[data-accent="X"]:not([data-gray])` matches **any** element with `data-accent` and no `data-gray` — including nested elements. Consequently, when a nested element sets only `data-accent`, its gray role becomes the auto-pair for that accent and **overrides** any gray inherited from a parent scope. To preserve a parent's `data-gray` choice in a nested scope, set `data-gray` explicitly on the nested element (e.g., `<section data-accent="violet" data-gray="mauve">`).

### 9.6 Numeric API + Named Aliases

The canonical role API is **numeric** (1..12), mirroring Radix. Each role also exposes a sibling **contrast** token for accessible text on solid step-9 backgrounds:

```css
--line-accent-1     /* step 1 */
--line-accent-2
--line-accent-3
/* ... */
--line-accent-12
--line-accent-contrast   /* sibling token, not a numeric step */

--line-gray-1
/* ... */
--line-gray-12
--line-gray-contrast

--line-success-1..12, --line-success-contrast
--line-warning-1..12, --line-warning-contrast
--line-danger-1..12,  --line-danger-contrast
--line-info-1..12,    --line-info-contrast
```

On top of the numeric API, `line-themes` exposes **9 named aliases per role** — intent-driven names for the most common steps. Total: 9 aliases × 6 roles = **54 alias CSS vars** in addition to the numeric API. (The `--line-{role}-contrast` token already declared in the canonical numeric section is unchanged — it is the same variable, not duplicated.)

| Alias | Maps to | Intent |
|-------|---------|--------|
| `--line-{role}-surface` | step 2 | Subtle background (cards, panels) |
| `--line-{role}-bg` | step 3 | UI element background |
| `--line-{role}-bg-hover` | step 4 | UI element hover |
| `--line-{role}-bg-active` | step 5 | UI element active/pressed |
| `--line-{role}-border` | step 7 | UI element border / focus ring |
| `--line-{role}-solid` | step 9 | Primary solid (e.g. solid button bg) |
| `--line-{role}-solid-hover` | step 10 | Solid hover |
| `--line-{role}-text-low` | step 11 | Low-contrast text |
| `--line-{role}-text` | step 12 | High-contrast text |

The aliases apply uniformly to all six roles (accent, gray, success, warning, danger, info). Components are expected to consume aliases where intent is obvious (`--line-accent-solid`, `--line-danger-text`) and numeric tokens where precise step control is needed. Consumers should always pair `--line-{role}-solid` with `--line-{role}-contrast` (declared once in the canonical numeric section above; WCAG-guaranteed foreground; static single value, not wrapped in `light-dark()`) for accessible text on solid backgrounds.

### 9.7 Build Pipeline

| Concern | Tool |
|---------|------|
| CSS bundling | **PostCSS** (`postcss-import`, `postcss-nested`, `postcss-preset-env`, `cssnano`) |
| Component bundling | **Vite 7+ with Rolldown** (unchanged from §6.2) |
| Source-of-truth for hues | TS files in `line-schemas/src/` declare `HUES`, `ACCENT_HUES`, `GRAY_HUES`, `SEMANTIC_MAP` |
| Source-of-truth for palette values | `@radix-ui/colors` npm package |
| Palette generation | Build script reads `@radix-ui/colors`, emits `line-colors/src/{hue}.css`. **Generated CSS is committed** so CI does not regenerate every build. Regeneration runs only when bumping `@radix-ui/colors`. |
| Role-mapping generation | Build script reads `line-schemas` enumerations, emits `line-themes/src/accent/{hue}.css` and `line-themes/src/gray/{hue}.css` mechanically. |

**Why hybrid (npm source + committed generated CSS):** the npm package is the canonical source for palette values, but committing the generated CSS into the repo gives deterministic CI builds, reviewable diffs on palette updates, and zero runtime regeneration cost.

### 9.8 Light/Dark Mode

A single mechanism: the CSS `light-dark()` function, triggered by the computed `color-scheme` property. This is **unchanged** from v0.7.0 — only the surface area has been re-namespaced under roles.

```css
/* line-colors/src/blue.css */
--line-blue-9: light-dark(hsl(206 100% 50%), hsl(209 100% 60%));
```

Consumers toggle mode programmatically by setting `style.colorScheme` on `<html>`, or via `.dark` / `.light` classes on `<html>` (kept as a public API to handle shadow control tokens that cannot be wrapped in `light-dark()`).

**Shadow DOM compatibility:** `color-scheme` inherits through Shadow DOM boundaries, so all `light-dark()` tokens inside web components resolve correctly without polyfills.

### 9.9 Package Exports

**`@websublime/line-tokens`** — 18 non-colour families (11 primitive + 7 decorative) + browser-defaults reset:

```json
{
  "exports": {
    ".":              "./dist/index.css",
    "./reset":        "./dist/reset.css",

    "./typography":   "./dist/typography.css",
    "./sizing":       "./dist/sizing.css",
    "./shadows":      "./dist/shadows.css",
    "./easings":      "./dist/easings.css",
    "./z-index":      "./dist/z-index.css",
    "./opacity":      "./dist/opacity.css",
    "./motion":       "./dist/motion.css",
    "./radii":        "./dist/radii.css",
    "./border-width": "./dist/border-width.css",
    "./focus-ring":   "./dist/focus-ring.css",
    "./breakpoints":  "./dist/breakpoints.css",

    "./aspects":      "./dist/aspects.css",
    "./animations":   "./dist/animations.css",
    "./gradients":    "./dist/gradients.css",
    "./masks":        "./dist/masks.css",
    "./layouts":      "./dist/layouts.css",
    "./highlights":   "./dist/highlights.css",
    "./svg":          "./dist/svg.css"
  }
}
```

**Primitive families (11)** are essentials any consumer needs: typography, sizing, shadows, easings, z-index, opacity, motion, radii, border-width, focus-ring, breakpoints.

**Decorative families (7)** are optional and may be imported individually for fine-grained bundle control:

| Family | Purpose |
|---|---|
| `aspects` | Aspect-ratio tokens (16/9, 4/3, 1/1, etc.) |
| `animations` | Pre-built keyframe animations (fade, slide, pulse, etc.) |
| `gradients` | Structural gradient tokens — angles, stops, positions. Colour stops reference `line-colors` palette tokens; no absolute colours. |
| `masks` | CSS mask shapes (clip-path, mask-image structural definitions) |
| `layouts` | Composition utilities (common grid/flex patterns) |
| `highlights` | `::selection` and similar highlight styles |
| `svg` | SVG structural tokens (stroke widths, mitres, dash patterns) — no colour values |

The `./reset` subpath is the consumer-side reset that neutralises browser defaults — applied **before** any token family. It is foundation-layer (zero-opinion; only resets). Consumers who already use their own reset (e.g., `normalize.css`, modern resets) may skip this subpath. The `.` root export bundles all 18 families + reset.

**Note on colour-adjacent families.** `gradients`, `highlights`, and `svg` historically held colour values in v0.7 (`colors-absolute.css` etc.). In v0.8 they are **structural-only** — they reference palette tokens from `line-colors` rather than declaring absolute colour values. This preserves Manifesto Law 10 (cross-layer separation). The v0.7 `colors-absolute` family is **removed** entirely; consumers needing black/white absolutes use `--line-gray-1` / `--line-gray-12` or the relevant Radix scale.

**`@websublime/line-colors`** — Radix palette CSS, one file per hue:

```json
{
  "exports": {
    ".":           "./dist/index.css",
    "./amber":     "./dist/amber.css",
    "./blue":      "./dist/blue.css",
    "./indigo":    "./dist/indigo.css",
    "./slate":     "./dist/slate.css"
    /* ... 31 hues total ... */
  }
}
```

**`@websublime/line-schemas`** — TS only (no CSS export):

```json
{
  "exports": {
    ".": {
      "types":  "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

**`@websublime/line-themes`** — role mappings, semantics, aliases, defaults:

```json
{
  "exports": {
    ".":                "./dist/index.css",
    "./accent/*":       "./dist/accent/*.css",
    "./gray/*":         "./dist/gray/*.css",
    "./semantics":      "./dist/semantics.css",
    "./aliases":        "./dist/aliases.css",
    "./defaults":       "./dist/defaults.css"
  }
}
```

**`@websublime/line-utils`** — TS helpers:

```json
{
  "exports": {
    ".":          { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./contrast": { "types": "./dist/contrast.d.ts", "import": "./dist/contrast.js" },
    "./mix":      { "types": "./dist/mix.d.ts", "import": "./dist/mix.js" }
  }
}
```

**Minimal consumer setup (full design system, single accent + gray):**

```css
@import '@websublime/line-tokens';
@import '@websublime/line-colors/indigo';
@import '@websublime/line-colors/slate';
@import '@websublime/line-colors/green';   /* success */
@import '@websublime/line-colors/amber';   /* warning */
@import '@websublime/line-colors/red';     /* danger */
@import '@websublime/line-colors/blue';    /* info */
@import '@websublime/line-themes';         /* role mappings + semantics + aliases + defaults */
```

> **Note:** Any hue you reference via `data-accent` or `data-gray` must be imported above. The minimal setup imports `indigo` (default accent), `slate` (auto-paired gray), and the four semantic hues. If you set `data-accent="violet"`, add `@import '@websublime/line-colors/violet'` to the imports — otherwise the role variables will resolve to undefined values. For consumers who want every hue available, use the "Quick-start" block below.

```html
<html data-accent="indigo">
```

**Quick-start (full bundle, all 31 hues):**

```css
@import '@websublime/line-tokens';
@import '@websublime/line-colors';   /* all 31 hues */
@import '@websublime/line-themes';
```

### 9.10 PostCSS Configuration

Unchanged in intent from v0.7.0 — same plugins, same preserved CSS custom properties strategy. The pipeline now runs across the five design system packages.

```
postcss-import → postcss-nested → postcss-preset-env → cssnano
```

`postcss-preset-env` keeps `custom-properties: false` (CSS variables preserved as-is) and most modern features disabled, because the target browsers (Chrome / Firefox / Safari latest 2) already support them natively.

### 9.11 Token Flow — Global to Component to Consumer

The cascade is **unchanged in shape** from v0.7.0; only the names of the global tokens changed.

```
┌─────────────────────────────────────────────────────────────────┐
│  Tier 1: Global Tokens                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │ line-tokens  │  │ line-colors  │  │ line-themes        │     │
│  │ --line-size-3│  │ --line-blue-9│  │ --line-accent-solid│     │
│  │ --line-radius│  │ --line-amber │  │ --line-danger-text │     │
│  └──────────────┘  └──────────────┘  └────────────────────┘     │
│                                              │                  │
│                          [data-accent / data-gray attributes]   │
│                                              ▼                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Role variables resolve per (accent, gray) pair        │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Tier 2: Component Tokens (inside :host)                        │
│  :host {                                                        │
│    --line-button-radius: var(--line-radius-2);                  │
│    --line-button-bg:     var(--line-accent-solid);              │
│    --line-button-color:  var(--line-accent-contrast);           │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Tier 3: Consumer Overrides                                     │
│  line-button { --line-button-radius: 1rem; }                    │
│  line-button::part(root) { /* total control */ }                │
└─────────────────────────────────────────────────────────────────┘
```

**Key principle (unchanged):** each tier can be overridden by the tier below it. `::part()` overrides win over everything.

### 9.12 CSS Cascade Strategy

**Unchanged from v0.7.0:** `@layer` is not needed. The `:where()` strategy and Shadow DOM encapsulation together cover all cascade scenarios.

- All role declarations in `line-themes` use `:where([data-accent="X"])` / `:where([data-gray="Y"])` — zero specificity.
- Palette declarations in `line-colors` use `:where(html)` — zero specificity.
- Token declarations in `line-tokens` use `:where(html)` — zero specificity.
- Consumer rules always win.

### 9.13 Structural Refactor (Phase 0)

The repository root has already been re-branded to `@websublime/line-ui` (workspace name in `package.json`, repo name `line-ui`, npm scope `@websublime/line-*`). The remaining work is the **structural build-out** of the new package layout — there is no monolithic package currently published from this workspace to dismantle in place, but the 8 target packages (5 design-system + 3 runtime: `line-core`, `line-components`, `line-icons`) must be authored from scratch under `packages/`.

| What | Target (v0.8.0) |
|------|-----------------|
| Design system packages | `@websublime/line-tokens`, `line-colors`, `line-schemas`, `line-themes`, `line-utils` (5 packages) |
| Runtime packages | `@websublime/line-core`, `@websublime/line-components`, `@websublime/line-icons` |
| Theme switching | DOM attributes `data-accent="blue"` (+ optional `data-gray="slate"`) |
| Palette variables | `--line-blue-9` (all palette tokens `--line-{hue}-{step}`) |
| Role variables | `--line-accent-*`, `--line-gray-*`, `--line-success-*`, `--line-warning-*`, `--line-danger-*`, `--line-info-*` (role-namespaced) |
| Foundation tokens | `--line-{family}-{step}` (e.g. `--line-size-3`, `--line-radius-2`) |
| Number of hues | 31 (Radix Colors 3.x) |
| Utility classes | **Deferred to Phase 1 spec.** Specifics (ship, rename, or remove) are decided at spec time. With attribute-based theming the v0.7 utility-first pattern is largely redundant. Explicitly **not** part of the core design system contract. |
| Base class | `LineElement` |
| Tag prefix | `line-` |

This refactor is the initial authoring of the package layout in `packages/`, sourcing palette CSS from `@radix-ui/colors`, generating role mappings mechanically from `line-schemas` enumerations, and standing up the build pipeline (PostCSS + Vite/Rolldown). It is completed early in Phase 0 before any new feature work.

### 9.14 Decisions Log

| # | Question | Decision | Phase |
|---|----------|----------|-------|
| T1 | Namespace prefix for all tokens | `--line-*` prefix on everything (palette, role, semantic, foundation, component, alias). Single convention, zero collision risk. | Phase 0 |
| T2 | CSS `@layer` strategy | Not needed. `:where()` + Shadow DOM cover all cascade scenarios. | Closed |
| T3 | Foundation token ownership | `@websublime/line-tokens` owns all non-colour primitives. Open Props used as a design reference only — no runtime dependency. | Phase 0 |
| T4 | Theme switching mechanism | **DOM attributes (`data-accent`, `data-gray`)**, not CSS classes, not a single `data-theme` aggregator. Accent and gray are independent; semantic colours are fixed. (Option A in the design discussion.) | Phase 0 |
| T5 | Palette source-of-truth | **`@radix-ui/colors` npm package**, 31 hues x 12 steps. Generated palette CSS is **committed** into `line-colors/src/` so CI does not regenerate. Regenerate only on bumping `@radix-ui/colors`. | Phase 0 |
| T6 | Schema layer location | Schemas are **TS contracts** (types + Zod validators) in `@websublime/line-schemas`, not CSS files. CSS role mappings live in `@websublime/line-themes`. | Phase 0 |
| T7 | Numeric vs named API | **Both** — numeric API (`--line-accent-1..12`) is canonical; **9 named aliases per role** (54 total) sit on top for intent-driven consumption. The `--line-{role}-contrast` token is part of the canonical numeric API (see §9.6) and is not counted as an alias. (Option B in the design discussion.) | Phase 0 |
| T8 | Semantic colour mutability | **Fixed at root.** `success/warning/danger/info` are never re-skinned by theme choice. `SEMANTIC_MAP = { success: green, warning: amber, danger: red, info: blue }` lives in `line-themes/src/semantics.css` and resolves at `:root`. | Phase 0 |
| T9 | Default accent + gray | Default accent: `indigo`. Default gray: auto-paired from accent via Radix-style pairing table (§9.5). Explicit `data-gray` always wins. | Phase 0 |
| T10 | Contrast tokens | Each role exposes a `--line-{role}-contrast` token for text on step-9 solid backgrounds (WCAG AA guaranteed). Implemented in `line-colors` per hue (`--line-{hue}-contrast`) and surfaced through role mappings in `line-themes`. | Phase 0 |
| T11 | CSS pipeline | PostCSS (`postcss-import`, `postcss-nested`, `postcss-preset-env`, `cssnano`). Component bundling continues via Vite/Rolldown. | Phase 0 |

Full implementation details live in the Phase 0 spec (`docs/specs/00-spec-design-system.md`) (to be created in Phase 0 specification), produced during Stage 2 via `/specification 00`. The spec is the canonical source — there is no parallel implementation guide.

## 10. Community & Governance

- **Bug reports and feature requests** via GitHub Issues.
- **Pull requests welcome** — must include or reference a component spec.
- **No Discord or community chat** at this stage.
- **RFC process:** New components require a spec in `docs/specs/` before implementation begins.
- **Code of conduct:** Added before Phase 1 / v0.2.0 (when the first published components attract external contribution risk).

---

## Appendix A: HTMX Integration (Exploratory)

Web Components are browser-native. Any `<line-dialog>` works in plain HTML served by any backend. The HTMX adapter (`LineHtmxElement`) extends `LineElement` to add:

- `hx-*` attribute forwarding
- Server-driven state updates
- Swap-aware lifecycle hooks

This is exploratory and will be validated during Phase 0.

---

## Appendix B: Inspector System

Feature flag activated via `localStorage`:

```js
localStorage.setItem('line-inspector', 'true')
```

When active, every line://ui component exposes:

- Component version
- Documentation link
- npm scope
- QA tags
- Component description

Accessible via a visual overlay or programmatic API. Useful for QA teams, design reviews, and developer onboarding.

---

## Appendix C: Brand Identity

### Naming Convention

| Context | Format |
|---------|--------|
| Brand / wordmark | `line://ui` (always lowercase, always with `://`) |
| Tag prefix | `line-` |
| CSS custom properties | `--line-*` |
| npm packages | `@websublime/line-*` |
| Base class | `LineElement` |
| Component classes | `LineButton`, `LineDialog`, etc. |
| Repository | `websublime/line-ui` |
| Domain | `line-ui.websublime.com` |
| Symbol / favicon | `://` mark |

**Never use:** "Lineup UI", "LineUI", "LINEUP", "lineupui", "Line Up UI".

### Brand Symbol

The `://` mark — abstracted from the URI protocol notation — serves as the icon, favicon, and visual identity. The colon represents two connection nodes; the forward slashes represent the path forward.

### Brand Accent (marketing surface)

The line://ui marketing surface — website, logo, social media — uses an electric green accent: `#c8ff00`, adapting to `#6d8a00` in light contexts.

**This is distinct from the library's default component accent**, which is `indigo` and is selected via the `data-accent` attribute system (see §9.5 Defaults & Auto-Pairing). Consumers of the library are not steered toward electric green — they pick from the 31 Radix hues, with `indigo` as the auto-selected default.
