# Vitamina — Product Requirements Specification

**Date:** 2026-03-11
**Author:** Miguel Ramos
**Status:** Revised Draft
**Version:** 0.2.0

---

## 1. Vision & Positioning

### 1.1 What is Vitamina

Vitamina is a headless UI component library built as native Web Components. It provides robust interaction logic via state machines, full visual customisation via CSS `::part()` and CSS custom properties, and works in any framework or no framework at all.

### 1.2 Positioning Statement

> Headless UI primitives as native Web Components. Logic via state machines, total customisation via CSS `::part()`. Framework-agnostic. Optional ready-to-go themes. Integrated developer tooling via inspector.

### 1.3 Competitive Analysis

#### Web Component Libraries Comparison

| Dimension | Vitamina | Shoelace | Spectrum | Lion | FAST |
|-----------|----------|----------|----------|------|------|
| Framework | Web Components (Lit 3+) | Web Components (Lit 3) | Web Components (LitElement) | Web Components (vanilla) | Web Components (FASTElement) |
| Approach | Headless-first + optional themes | Opinionated/styled | Opinionated (Adobe design) | Headless-first | Design system framework |
| State Management | Zag.js state machines | Custom + Popper.js | Custom internal | Custom vanilla JS | FASTElement reactivity |
| Customisation | `::part()` + CSS custom properties (dual-layer) | `::part()` + CSS custom properties | CSS variables; partial `::part()` | `::part()` + CSS custom properties | CSS variables; minimal `::part()` |
| Accessibility | WCAG 2.1 AA via Zag.js | WCAG 2.1 AA (mature) | WCAG 2.1 AA (Adobe standard) | WCAG 2.1 AA+ (core differentiator) | WCAG 2.1 AA (Microsoft standard) |
| Component Count | ~105+ (planned) | ~90+ (shipped) | ~40-50 | ~40+ | ~60+ |
| Ecosystem | Pre-launch | 20k+ weekly downloads | Enterprise (Adobe products) | Enterprise (ING banking) | Enterprise (Microsoft Fluent) |
| Theming | Headless default; optional 28-palette theme package | 30+ built-in themes | Adobe Spectrum theme | No built-in themes | Fluent Design theme |
| SSR/SSG | Investigation planned post-Phase 1 | Partial (Astro, 11ty) | Limited | Limited | Limited |

#### Framework-Specific Headless Libraries

The headless-first approach is validated across multiple framework ecosystems, but each is locked to its framework:

| Library | Framework | Components | Approach |
|---------|-----------|------------|----------|
| Radix UI | React-only | ~30+ | Headless primitives, className/CSS-in-JS |
| Bits UI | Svelte-only | ~40+ | Headless primitives, class props + data-* attributes. Inspired by Radix (API), Melt UI (architecture), React Spectrum (a11y) |
| Ark UI | React/Vue/Solid | ~40+ | Headless primitives powered by Zag.js state machines |

**Vitamina resolves this fragmentation** — the same headless primitives work in React, Vue, Svelte, Angular, or plain HTML via native Web Components. No adapters, no rewrites.

**Note:** Radix UI remains the most relevant comparison for the React audience:

| Aspect | Radix UI | Vitamina |
|--------|----------|----------|
| Framework | React-only | Framework-agnostic (Web Components) |
| Customisation | className / CSS-in-JS | Native `::part()` + CSS custom properties |
| Composition | JSX children | Slots + light DOM |
| State management | React hooks | Zag.js state machines |
| Cross-framework | Needs adapters | Works everywhere natively |
| Themes | Community-driven | Optional batteries-included themes |

#### Vitamina's Genuine Differentiators

- **State machines (Zag.js)** — Production-ready, framework-agnostic logic layer with built-in accessibility. No competitor in the Web Components space uses this approach.
- **Headless-first + optional themes** — Unlike Shoelace or Spectrum which ship opinionated styles, Vitamina defaults to zero visual opinion. Themes are an accelerator, never a requirement.
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

1. **Headless-first** — Components carry zero visual opinion. All styling is the consumer's responsibility via `::part()` and `--vita-*` custom properties.
2. **Theme as accelerator** — The theme package provides ready-to-go themes. Import one and everything works. Never mandatory.
3. **HTMX as exploration** — Web Components are browser-native. A `<vita-dialog>` works in plain HTML served by any backend. HTMX adds server-driven interactivity. First-class support to be explored and validated.
4. **Inspector as dev tooling** — Feature flag via localStorage. When active, every component exposes metadata: version, docs link, scope, QA tags. Useful for QA teams and integrating developers.

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
| Time-to-first-component | 15 minutes | A new developer can create and render a custom Vitamina component within 15 minutes using the docs |

No npm download or GitHub stars targets at this stage — premature for a pre-launch project.

### 1.7 Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| Browser support | Chrome, Firefox, Safari — latest 2 stable versions |
| Accessibility | WCAG 2.1 AA (Zag.js provides this natively for state-machine components) |
| Bundle size | Soft target < 5KB gzipped per component |
| SSR/SSG | Out of scope for Phase 0. Investigation planned post-Phase 1 for Astro, Nuxt, Next.js compatibility |
| CDN usage | To be defined |
| i18n — RTL | Supported natively via `dir` attribute |
| i18n — Localization | Localization of component labels (e.g., "Close", "Dismiss") is the consumer's responsibility via slots and attributes |

---

## 2. Technology Stack

| Layer | Choice |
|-------|--------|
| Runtime & Package Manager | **Bun** (latest stable) |
| Bundler | **Vite 7+ with Rolldown** |
| Lint & Format | **Biome** (replaces ESLint + Prettier) |
| Component Framework | **Lit 3+** (latest stable) |
| Component Logic | **Zag.js** (latest stable) |
| Utility Tokens | **Open Props** (sizes, shadows, easings, typography) |
| Color Tokens | **Custom 12-level semantic system** (maintained, superior to Open Props for colours) |
| CSS Processing | **PostCSS** (latest stable, with updated plugins) |
| All dependencies | **Latest stable versions** |

### 2.1 Stack Rationale

**Bun** — Faster runtime, faster installs, native workspace support. Replaces Node.js + pnpm. Vite is kept for builds as its library mode with Rolldown is more mature than Bun's bundler for library output.

**Vite 7+ with Rolldown** — Rolldown (Rust-based) replaces Rollup internally in Vite 7. Same configuration API, significantly faster builds. Vite 7 stabilises the Rolldown integration that was experimental in earlier versions.

**Biome** — Single tool for lint + format. Rust-based, orders of magnitude faster. Replaces ~10 packages: eslint, prettier, eslint-plugin-import, eslint-plugin-unicorn, eslint-config-prettier, etc.

**Zag.js** — Production-ready state machines for 50+ UI patterns. Framework-agnostic with official Lit adapter (`@zag-js/element`). WAI-ARIA accessibility built-in. Keyboard navigation, focus management, all solved.

**Open Props** — High-quality utility tokens maintained by Adam Argyle (Google Chrome team). Modular — import only what you need. Complements the custom color system.

**Custom Color System** — 12 semantic levels per palette (background to high-contrast), inspired by Radix Colors. Superior to Open Props for colour semantics and the heart of the theming system.

---

## 3. Component Architecture

### 3.1 Component Anatomy

```
┌──────────────────────────────────────────────┐
│  <vita-dialog>                               │
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

**Flow:** Zag.js manages all logic (state, transitions, a11y, keyboard, focus trapping) → Lit renders shadow DOM with `part` attributes on every relevant element → Consumer styles via `::part()` or applies a theme from the theme package.

### 3.2 Composition Model

**Hybrid approach:**

- **Simple components** (button, badge, avatar, toggle) — Single custom element with slots. No benefit in fragmenting.
- **Complex components** (dialog, combobox, menu, tabs, accordion) — Composable sub-components. Each sub-component exposes its own `::part()` selectors. The consumer decides what to render and where.

**Simple component example:**

```html
<vita-button>
  <vita-icon slot="icon" name="check"></vita-icon>
  Save
</vita-button>
```

**Complex component example (Radix-style):**

```html
<vita-dialog>
  <vita-dialog-trigger>
    <button>Open</button>
  </vita-dialog-trigger>
  <vita-dialog-content>
    <vita-dialog-title>Title</vita-dialog-title>
    <vita-dialog-close></vita-dialog-close>
    <p>Content</p>
  </vita-dialog-content>
</vita-dialog>
```

### 3.3 Tag Prefix

**`vita-`** — Short (4 chars + hyphen), brand-linked, no known conflicts with other design systems.

### 3.4 CSS Customisation — Dual Layer

**Layer 1: CSS Custom Properties (tokens) — Quick adjustments**

```css
vita-button {
  --vita-radius: 8px;
  --vita-font-size: 1rem;
  --vita-padding: 0.5rem 1rem;
}
```

**Layer 2: `::part()` — Total control over internal elements**

```css
vita-button::part(root) {
  background: linear-gradient(135deg, pink, purple);
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

Custom properties for consumers who want to adjust tokens without knowing internal structure. Parts for consumers who want absolute control. Complementary, not redundant.

**Custom property prefix:** `--vita-` (consistent with tag prefix).

### 3.5 CSS Parts Naming Convention

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
```

Short, semantic names reused across components. A developer who learns the parts of one component already knows others.

### 3.6 Base Class — VitaElement

**Note:** This describes the target architecture. The current codebase uses `ComponentElement` with `ComponentMixin`. The refactoring to `VitaElement` is a Phase 0 task.

```
LitElement
  └── VitaElement (refactored base class)
        ├── Inspector mixin (feature flag via localStorage)
        ├── Metadata mixin (version, docs, qa)
        ├── Direction mixin (LTR/RTL)
        └── Zag.js machine connection (lifecycle-managed)
              │
              ├── VitaButton extends VitaElement
              ├── VitaDialog extends VitaElement
              └── ...
```

- Zag.js connection lives in the base class — each component only declares which machine it uses; connect/disconnect is automatic via lifecycle.
- Simple components that don't use Zag.js (badge, separator, avatar) simply don't declare a machine — zero overhead.
- Inspector, metadata, and direction mixins are maintained conceptually but cleaned up.

**Component authoring example:**

```typescript
export class VitaDialog extends VitaElement {
  machine = dialog.machine({ id: this.id })

  render() {
    return html`
      <div part="overlay" ${spread(this.api.getBackdropProps())}></div>
      <div part="content" ${spread(this.api.getContentProps())}>
        <slot></slot>
      </div>
    `
  }
}
```

### 3.7 Component File Structure

```
packages/components/src/dialog/
├── dialog.ts              ← <vita-dialog> root
├── dialog-trigger.ts      ← <vita-dialog-trigger>
├── dialog-content.ts      ← <vita-dialog-content>
├── dialog-title.ts        ← <vita-dialog-title>
├── dialog-close.ts        ← <vita-dialog-close>
├── dialog.types.ts        ← Types/interfaces
└── index.ts               ← Public exports
```

### 3.8 Icon System

Abstract wrapper with an agnostic registry:

```html
<vita-icon name="check" library="phosphor"></vita-icon>
<vita-icon name="arrow-right" library="lucide"></vita-icon>
<vita-icon src="/my-icons/custom.svg"></vita-icon>
```

- `vita-icon` exposes a **registry** where the consumer registers icon libraries.
- Each library is a resolver: given a name, returns the SVG (URL, sprite, inline).
- The component renders the SVG inside shadow DOM with `part="svg"` for customisation.
- Zero icons bundled in core — the consumer brings their own.
- Ready-to-go themes declare a default library (e.g., Phosphor, Lucide, Heroicons) and register the resolver automatically.

---

## 4. Component Catalogue

### 4.1 Primitives Base

| Component | Zag.js | Notes |
|-----------|--------|-------|
| Button | No | Slots for icon + label |
| Badge | No | Status, count, dot variants |
| Avatar | No | Fallback to initials, group |
| Separator | No | Horizontal/vertical, optional label slot |
| Visually Hidden | No | A11y utility |
| Portal | No | Render outside DOM parent |
| Icon | No | Agnostic registry wrapper |
| Kbd / Shortcut | No | OS-aware (Cmd vs Ctrl) |
| Skeleton | No | Pulse/wave animation |
| Presence | Yes | Mount/unmount animations |
| Stack | No | Flex vertical/horizontal with gap |
| Grid | No | CSS Grid wrapper |
| Center | No | Centering utility |
| Aspect Ratio | No | Fixed ratio container |

### 4.2 Forms — Essential

| Component | Zag.js | Notes |
|-----------|--------|-------|
| Input | No | Text, email, password, etc. |
| Textarea | No | Auto-resize |
| Field | No | Wrapper: label + input + error + hint |
| Checkbox | Yes | `@zag-js/checkbox` |
| Radio Group | Yes | `@zag-js/radio-group` |
| Switch | Yes | `@zag-js/switch` |
| Select | Yes | `@zag-js/select` |
| Toggle Group | Yes | `@zag-js/toggle-group` |
| Slider | Yes | `@zag-js/slider` |
| Number Input | Yes | `@zag-js/number-input` |

### 4.3 Overlays & Feedback

| Component | Zag.js | Notes |
|-----------|--------|-------|
| Dialog | Yes | `@zag-js/dialog` — modal + non-modal |
| Alert Dialog | Yes | Dialog variant with confirm/cancel |
| Sheet | Yes | Side panel — overlay or push mode, any edge, header + footer slots |
| Drawer | Yes | Temporary sliding panel |
| Popover | Yes | `@zag-js/popover` |
| Tooltip | Yes | `@zag-js/tooltip` |
| Hover Card | Yes | `@zag-js/hover-card` |
| Toast | Yes | `@zag-js/toast` — stack, positions |

### 4.4 Navigation & Disclosure

| Component | Zag.js | Notes |
|-----------|--------|-------|
| Tabs | Yes | `@zag-js/tabs` |
| Accordion | Yes | `@zag-js/accordion` |
| Collapsible | Yes | `@zag-js/collapsible` |
| Menu / Context Menu | Yes | `@zag-js/menu` — nested, context |
| Navigation Menu | Yes | `@zag-js/navigation-menu` |
| Breadcrumb | No | Slots for items |
| Breadcrumb Trail | No | Clickable with dropdown showing siblings at each level |
| Pagination | Yes | `@zag-js/pagination` |
| Steps / Stepper | Yes | `@zag-js/steps` — visual indicator |

### 4.5 Forms — Advanced

| Component | Zag.js | Notes |
|-----------|--------|-------|
| Combobox | Yes | `@zag-js/combobox` — autocomplete |
| Date Picker | Yes | `@zag-js/date-picker` |
| Date Range Picker | Yes | `@zag-js/date-picker` range mode, two-calendar view |
| Time Picker | Yes | `@zag-js/time-picker` |
| Color Picker | Yes | `@zag-js/color-picker` |
| Pin Input | Yes | `@zag-js/pin-input` — OTP codes |
| Rating | Yes | `@zag-js/rating-group` |
| Range Slider | Yes | `@zag-js/range-slider` |
| File Upload | Yes | `@zag-js/file-upload` — drag & drop |
| Signature Pad | Yes | `@zag-js/signature-pad` |
| Tag Input | No | Text to tags, autocomplete, drag reorder, multi-paste |
| Mention Input | No | Textarea with @mention and #channel inline |
| Search Field | No | Suggestions dropdown, recent searches, scoped search |
| Wizard / Multi-step Form | No | Step validation, progress tracking, branching logic |
| OTP / Verification | No | Beyond pin input — timer, resend, paste from SMS |

### 4.6 Data Display

| Component | Zag.js | Notes |
|-----------|--------|-------|
| Table | No | Headless, sort/filter via API |
| Card | No | Composable: header, body, footer |
| Progress | Yes | `@zag-js/progress` — linear + circular |
| Progress Ring | No | Multiple overlapping rings, each a metric |
| Progress List / Task Steps | No | List of operations completing in real-time (pending → loading → done → error) |
| Scroll Area | Yes | `@zag-js/scroll-area` — custom scrollbars |
| Carousel | Yes | `@zag-js/carousel` |
| Clipboard | Yes | `@zag-js/clipboard` |
| QR Code | Yes | `@zag-js/qr-code` |
| Timer | Yes | `@zag-js/timer` — countdown/stopwatch |
| Tree View | Yes | `@zag-js/tree-view` |
| Gauge / Meter | No | Semicircular arc with pointer, coloured zones |
| Empty State | No | Composable: icon + title + description + action |

### 4.7 Layout & Containers

| Component | Zag.js | Notes |
|-----------|--------|-------|
| App Shell | No | Sidebar + header + main + footer via slots |
| Sidebar | No | Collapsible, rail mode (icons only), resizable |
| Header / Toolbar | No | Sticky, slots for logo, nav, actions |
| Content Area | No | Internal scroll, max-width, responsive padding |
| Panel | No | Header/body/footer, collapsible |
| Splitter / Resizable Panels | Yes | `@zag-js/splitter` |
| Floating Panel / Window | Yes | `@zag-js/floating-panel` — minimize, maximize, snap, z-order |

### 4.8 Desktop-Inspired

| Component | Zag.js | Notes |
|-----------|--------|-------|
| Command Palette / Command Bar | No | Cmd+K — sections, recent, fuzzy search, shortcuts display |
| Spotlight | No | Global search with preview pane |
| Status Bar | No | Bottom bar with contextual info, widget slots |
| Activity Bar | No | Vertical icon bar switching between panels |
| Notification Center | No | Side panel with notification history, grouped, dismissable |
| Properties Panel | No | Contextual panel showing/editing properties of selected item |
| Minimap | No | Miniature preview of long content with viewport indicator |
| Master-Detail | No | Split view: list left, detail right |
| List View | No | Multi-select (shift+click, cmd+click), keyboard nav, drag reorder, with/without icons |
| Segmented Control | No | Toggle between 2-5 options with sliding indicator |
| Dock | No | macOS-style icon magnification on hover |

### 4.9 Innovative

| Component | Zag.js | Notes |
|-----------|--------|-------|
| Kanban Board | No | Drag & drop columns + cards, headless |
| Timeline | No | Vertical/horizontal, branching |
| Data Grid | No | Virtual scrolling, inline edit, column resize, sort/filter |
| Infinite Scroll | No | Intersection Observer, skeleton/placeholder slots |
| Marquee | No | Continuous scrolling content |
| Spotlight Card | No | Cursor-following gradient/glow effect |
| Image Comparison | No | Before/after slider |
| Sparkline | No | Mini inline charts — line, bar, area |
| Flip Card | No | 3D flip animation, two slots (front/back) |
| Morph / Shared Layout | No | View Transitions API |
| Diff Viewer | No | Side-by-side or unified text diff |
| Wheel Picker | No | iOS-style rotary scroll selection |
| Angle Slider | Yes | `@zag-js/angle-slider` — rotary input |
| Highlight | Yes | `@zag-js/highlight` — text matching |
| Tour | Yes | `@zag-js/tour` — product tours |

### 4.10 Real-World / Domain Components

| Component | Notes |
|-----------|-------|
| Ballot / Poll | Voting with live animated results |
| Reaction Bar | Emoji reactions with counter, animation, toggle |
| Proof / Annotation | Positional pins/comments on images, layouts, documents |
| Price / Pricing Card | Currency, period, discount, strikethrough |
| Stat Card | Value + label + trend (up/down) + optional sparkline |
| Ticket / Pass | Visual notch, barcode/QR slot, tear line |
| Chat Bubble | Tail, status (sent/delivered/read), timestamp, reply, reactions slot |
| Audio Player | Headless controls: play/pause, waveform/progress, volume, speed |
| Video Player | Headless controls: play, seek, volume, fullscreen, PiP, captions |
| Cookie Consent | GDPR banner with category toggles, accept/reject/customise |
| Calendar / Event View | Day/week/month view with event slots (not date picker) |
| Terminal / Console | Monospace output, auto-scroll, ANSI colours, input line |
| Receipt / Invoice | Line items, subtotal, tax, total with parts per section |
| Changelog | Chronological list with version tags, categories, collapsible |
| Weather Card | Icon + temperature + condition + high/low, composable |
| Map Marker / Pin | Customisable marker with popover, for any map library |
| OTP / Verification | Beyond pin input — timer, resend, paste from SMS |

### 4.11 Catalogue Summary

| Category | Count |
|----------|-------|
| Primitives Base | 14 |
| Forms — Essential | 10 |
| Overlays & Feedback | 8 |
| Navigation & Disclosure | 9 |
| Forms — Advanced | 15 |
| Data Display | 13 |
| Layout & Containers | 7 |
| Desktop-Inspired | 11 |
| Innovative | 15 |
| Real-World / Domain | 17 |
| **Total** | **~105+** |

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
| Parts & Properties | Table of all `::part()` and `--vita-*` custom properties |
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
│   ├── Theming (how to apply themes)
│   ├── Customisation (parts & custom properties)
│   └── Icon Setup (registering icon libraries)
├── Foundation
│   ├── Colours (palettes + visual schemas)
│   ├── Typography (Open Props tokens)
│   ├── Spacing & Sizing
│   ├── Shadows & Elevation
│   └── Motion & Easings
├── Components
│   ├── Layout
│   ├── Forms
│   ├── Overlays
│   ├── Navigation
│   ├── Data Display
│   ├── Desktop-Inspired
│   ├── Innovative
│   └── Real-World
└── Patterns (component compositions)
    ├── Login Form
    ├── Dashboard Layout
    ├── Settings Page
    └── ...
```

**Patterns section:** Shows how to compose multiple Vitamina components together for real scenarios. Not components — recipes.

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

### 5.3 Public Site

**Tool:** Astro + MDX + Vitamina components (dogfooding).

**Deploy:** Cloudflare Pages.

**Site structure:**

| Section | Content |
|---------|---------|
| Landing page | Value proposition, hero, features |
| Docs | Per-component documentation with curated examples |
| Getting started | Installation, quick start, theming |
| Theming showcase | Interactive theme browser |
| Changelog | Release notes (auto-generated via Changesets) |
| Storybook link | Link to deployed Storybook |

**Storybook vs Site:**

| Site (public) | Storybook (dev/playground) |
|---------------|---------------------------|
| Landing page, branding | — |
| Curated docs with examples | Auto-generated API docs |
| Getting started, guides | — |
| Interactive theming showcase | Controls playground |
| Copy-paste snippets | All variants/edge cases |
| Changelog | — |
| Link to Storybook | Link to site |

### 5.4 Storybook Deployment

- **GitHub Pages** for production deployment.
- Automatic deployment per PR (preview link).
- Production deployment on merge to main.

---

## 6. Build & Release

### 6.1 Monorepo Structure

#### Current Structure

```
packages/
├── core/           ← Base class, mixins, utilities, helpers
└── theme/          ← Ready-to-go themes + colour tokens
```

**Published packages (current):**

| Package | npm name | Version |
|---------|----------|---------|
| core | `@websublime/vitamina-core` | 0.2.0 |
| theme | `@websublime/vitamina-theme` | 0.6.0 |

#### Target Structure — Phase 0

```
packages/
├── core/           ← Base class, mixins, utilities, helpers
├── components/     ← All UI components (vita-button, vita-dialog, etc.)
├── theme/          ← Ready-to-go themes + colour tokens
├── icons/          ← Icon registry + resolvers for popular libraries
├── site/           ← Astro site (not published to npm)
└── storybook/      ← Storybook config + stories (not published to npm)
```

**Published packages (target):**

| Package | npm name |
|---------|----------|
| core | `@websublime/vitamina-core` |
| components | `@websublime/vitamina-components` |
| theme | `@websublime/vitamina-theme` |
| icons | `@websublime/vitamina-icons` |

**Private packages:** `site`, `storybook` (not published).

### 6.2 Build — Vite 7+ with Rolldown

**Core package:**

```
src/ → Vite library mode → dist/
  ├── index.js          ← Main barrel
  ├── vita-element.js   ← Base class
  ├── mixins/           ← Individual mixins
  ├── utilities/        ← Helpers, decorators
  └── types/            ← .d.ts
```

**Components package — Tree-shakeable per-component:**

Each component is a separate entrypoint in `package.json`:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./button": "./dist/button/index.js",
    "./dialog": "./dist/dialog/index.js",
    "./tabs": "./dist/tabs/index.js"
  }
}
```

Consumer imports surgically:

```js
import '@websublime/vitamina-components/button'
import '@websublime/vitamina-components/dialog'
```

**Theme package:**

Individual CSS files per theme + complete bundle:

```json
{
  "exports": {
    ".": "./dist/vita.css",
    "./themes/blue": "./dist/themes/blue.css",
    "./themes/green": "./dist/themes/green.css"
  }
}
```

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
| Review & refactor Inspector | Existing component in core. Feature flag via localStorage, outline on hover, version display. Review current implementation, enhance with: docs/storybook link, exposed CSS parts, slot usage, optional metadata panel. Inspired by Bit.dev's original component inspection concept — unique differentiator in the Web Components space | | **P0** |
| Migrate to Bun | Runtime + workspaces, remove pnpm | Done (requires review) | |
| Migrate to Biome | Remove ESLint + Prettier + all plugins, configure Biome | Done (requires review) | |
| Update all dependencies | Lit 3+, Vite 7+ with Rolldown, PostCSS latest | Done (requires review) | |
| Refactor VitaElement | Base class with Zag.js lifecycle, mixins (inspector, metadata, direction). Zag.js integration is a future investigation — the `@zag-js/element` adapter maturity is a technical risk to be validated | |
| Restructure monorepo | 6 packages: core, components, theme, icons, site, storybook | |
| Setup Storybook 8 | `@storybook/web-components-vite` + CEM analyzer | |
| Setup testing | Bun test + `@open-wc/testing-helpers` + Playwright | |
| Setup CI/CD | GitHub Actions: checks, release, snapshot-deploy, snapshot-version | |
| Define RC pipeline | Release candidate pipeline for `next` branch | |
| npm scope | Configure `@websublime/vitamina-*` on npm | |
| Theme package v2 | Integrate Open Props (utility tokens) + maintain 12-level colour system | |
| Icon registry | Agnostic resolver system | |
| Base documentation | Getting started, theming guide, customisation guide in Storybook | |

**Deliverable:** Functional monorepo. Zero UI components, but any developer can create a Vitamina component with the base class and have everything working — build, test, docs, release.

**Version:** 0.1.0

### 7.3 Phase 1 — Core Primitives (v0.2.0)

| Component | Zag.js |
|-----------|--------|
| Button | No |
| Badge | No |
| Avatar | No |
| Separator | No |
| Visually Hidden | No |
| Portal | No |
| Icon | No |
| Kbd / Shortcut | No |
| Skeleton | No |
| Presence | Yes |
| Stack | No |
| Grid | No |
| Center | No |
| Aspect Ratio | No |

**~14 components.** Mostly simple, no Zag.js. Validates architecture, parts convention, per-component build pipeline, and automatic documentation.

**Parallel:** Landing page for site.

### 7.4 Phase 2 — Essential Forms (v0.3.0)

| Component | Zag.js |
|-----------|--------|
| Input | No |
| Textarea | No |
| Field | No |
| Checkbox | Yes |
| Radio Group | Yes |
| Switch | Yes |
| Select | Yes |
| Toggle Group | Yes |
| Slider | Yes |
| Number Input | Yes |

**~10 components.** First real Zag.js integration. Validates machine + Lit + parts pattern in forms.

**Parallel:** Theming showcase on site.

### 7.5 Phase 3 — Overlays & Navigation (v0.4.0)

| Component | Zag.js |
|-----------|--------|
| Dialog | Yes |
| Alert Dialog | Yes |
| Sheet | Yes |
| Drawer | Yes |
| Popover | Yes |
| Tooltip | Yes |
| Hover Card | Yes |
| Toast | Yes |
| Tabs | Yes |
| Accordion | Yes |
| Collapsible | Yes |
| Menu / Context Menu | Yes |
| Breadcrumb | No |
| Breadcrumb Trail | No |

**~14 components.** Complex components with focus management, portals, animations. Validates overlays and sub-component composition.

### 7.6 Phase 4 — Advanced Forms (v0.5.0)

| Component | Zag.js |
|-----------|--------|
| Combobox | Yes |
| Date Picker | Yes |
| Date Range Picker | Yes |
| Time Picker | Yes |
| Color Picker | Yes |
| Pin Input | Yes |
| Rating | Yes |
| Range Slider | Yes |
| File Upload | Yes |
| Signature Pad | Yes |
| Tag Input | No |
| Mention Input | No |
| Search Field | No |

**~13 components.** The most complex in the catalogue.

### 7.7 Phase 5 — Data Display & Advanced Navigation (v0.6.0)

| Component | Zag.js |
|-----------|--------|
| Table | No |
| Card | No |
| Progress | Yes |
| Progress Ring | No |
| Progress List / Task Steps | No |
| Scroll Area | Yes |
| Carousel | Yes |
| Pagination | Yes |
| Steps / Stepper | Yes |
| Wizard | No |
| Tree View | Yes |
| Navigation Menu | Yes |
| Clipboard | Yes |
| QR Code | Yes |
| Timer | Yes |

**~15 components.**

### 7.8 Phase 6 — Layout & Desktop-Inspired (v0.7.0)

| Component | Zag.js |
|-----------|--------|
| App Shell | No |
| Sidebar | No |
| Header / Toolbar | No |
| Content Area | No |
| Panel | No |
| Splitter | Yes |
| Floating Panel / Window | Yes |
| Status Bar | No |
| Activity Bar | No |
| Command Palette | No |
| Notification Center | No |
| Master-Detail | No |
| List View | No |
| Segmented Control | No |
| Minimap | No |

**~15 components.** Layout pieces and desktop patterns. Vitamina starts seriously differentiating here.

### 7.9 Phase 7 — Innovative (v0.8.0)

| Component | Zag.js |
|-----------|--------|
| Spotlight / Command Bar | No |
| Kanban Board | No |
| Timeline | No |
| Data Grid | No |
| Infinite Scroll | No |
| Dock | No |
| Marquee | No |
| Spotlight Card | No |
| Image Comparison | No |
| Sparkline | No |
| Flip Card | No |
| Morph / Shared Layout | No |
| Diff Viewer | No |
| Wheel Picker | No |
| Angle Slider | Yes |
| Highlight | Yes |
| Tour | Yes |
| Empty State | No |

**~18 components.**

### 7.10 Phase 8 — Real-World / Domain (v0.9.0)

| Component | Notes |
|-----------|-------|
| Ballot / Poll | Voting with live animated results |
| Reaction Bar | Emoji reactions |
| Proof / Annotation | Positional pins/comments |
| Price / Pricing Card | Currency, discount |
| Stat Card | Dashboard building block |
| Ticket / Pass | Visual notch, QR slot |
| Chat Bubble | Status, reply, reactions |
| Audio Player | Headless controls |
| Video Player | Headless controls |
| Cookie Consent | GDPR banner |
| Calendar / Event View | Day/week/month |
| Terminal / Console | Monospace output |
| Receipt / Invoice | Line items layout |
| Changelog | Release notes component |
| Gauge / Meter | Semicircular |
| Weather Card | Composable |
| Map Marker / Pin | Customisable marker with popover |
| OTP / Verification | Beyond pin input |

**~18 components.**

**Version after Phase 8: 1.0.0** — Full catalogue complete.

### 7.11 Roadmap Summary

```
Phase 0 ─── Foundation & Tooling ──────────── v0.1.0
Phase 1 ─── 14 core primitives ────────────── v0.2.0
Phase 2 ─── 10 essential forms ────────────── v0.3.0
Phase 3 ─── 14 overlays & navigation ──────── v0.4.0
Phase 4 ─── 13 advanced forms ─────────────── v0.5.0
Phase 5 ─── 15 data display & nav ─────────── v0.6.0
Phase 6 ─── 15 layout & desktop ───────────── v0.7.0
Phase 7 ─── 18 innovative ─────────────────── v0.8.0
Phase 8 ─── 18 real-world / domain ────────── v0.9.0
                                        ──── v1.0.0
                                    ~105+ components
```

---

## 8. Component Specification Template

Individual component specs live in `.spec/`. Architecture decisions are tracked alongside component specs.

### 8.1 Spec Template

```markdown
# XXXX. vita-{component} spec

Date: YYYY-MM-DD
Status: proposed | in-progress | done
Phase: {roadmap phase}

## Overview

Short description and when to use.

## Anatomy

Visual structure — which internal elements exist.

## Sub-components (if applicable)

- `vita-{component}-trigger`
- `vita-{component}-content`
- ...

## Parts

| Part | Element | Description |
|------|---------|-------------|
| root | div | Main container |
| ... | ... | ... |

## Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --vita-{component}-* | ... | ... |

## Slots

| Slot | Description |
|------|-------------|
| default | ... |
| ... | ... |

## Properties (attributes)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| ... | ... | ... | ... |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| ... | ... | ... |

## Keyboard

| Key | Description |
|-----|-------------|
| ... | ... |

## Accessibility

ARIA roles, states, and screen reader behaviour.

## Zag.js Machine (if applicable)

Which machine is used and what context/API it exposes.

## Examples

Basic and advanced usage snippets.
```

### 8.2 Directory Structure

```
.spec/
├── archive/
│   └── 0001-alert-component-spec.md
├── COMPONENT-SPEC-TEMPLATE.md
├── 0002-button-component-spec.md
├── 0003-tabs.md
└── ...
```

---

## 9. Design Token System

### 9.1 Colour System (Custom — 12 Semantic Levels)

Each palette provides 12 shades with semantic meaning:

| Level | Variable | Semantic Use |
|-------|----------|-------------|
| 1 | `--{color}-1` | Background |
| 2 | `--{color}-2` | Subtle background |
| 3 | `--{color}-3` | UI element background |
| 4 | `--{color}-4` | UI element hover background |
| 5 | `--{color}-5` | UI element active background |
| 6 | `--{color}-6` | Subtle border |
| 7 | `--{color}-7` | UI element border |
| 8 | `--{color}-8` | UI element border hover |
| 9 | `--{color}-9` | Solid background |
| 10 | `--{color}-10` | Solid hover |
| 11 | `--{color}-11` | Low contrast text |
| 12 | `--{color}-12` | High contrast text |

**28 colour palettes** with light/dark mode support. Palette coverage will be reviewed and potentially expanded in Phase 0.

### 9.2 Utility Tokens (Open Props)

Sourced from Open Props for non-colour tokens:

- Sizes & spacing
- Typography (font families, sizes, weights, line heights, letter spacing)
- Shadows & elevation
- Border radii
- Easings & animations
- Aspect ratios
- Z-index scale
- Gradients

### 9.3 Theme Structure

Each ready-to-go theme is a CSS file that:

1. Applies a colour palette as the active schema
2. Sets utility token defaults
3. Registers a default icon library
4. Supports light/dark mode via `prefers-color-scheme` and `.dark` class toggle

```css
/* Consumer usage */
@import '@websublime/vitamina-theme/themes/blue';
```

---

## 10. Community & Governance

- **Bug reports and feature requests** via GitHub Issues.
- **Pull requests welcome** — must include or reference a component spec.
- **No Discord or community chat** at this stage.
- **RFC process:** New components require a spec in `.spec/` before implementation begins.
- **Code of conduct:** To be added.

---

## Appendix A: HTMX Integration (Exploratory)

Web Components are browser-native. Any `<vita-dialog>` works in plain HTML served by any backend. The HTMX adapter (`VitaHtmxElement`) extends `VitaElement` to add:

- `hx-*` attribute forwarding
- Server-driven state updates
- Swap-aware lifecycle hooks

This is exploratory and will be validated during Phase 0.

---

## Appendix B: Inspector System

Feature flag activated via `localStorage`:

```js
localStorage.setItem('vita-inspector', 'true')
```

When active, every Vitamina component exposes:

- Component version
- Documentation link
- npm scope
- QA tags
- Component description

Accessible via a visual overlay or programmatic API. Useful for QA teams, design reviews, and developer onboarding.
