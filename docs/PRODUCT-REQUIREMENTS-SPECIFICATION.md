# line://ui — Product Requirements Specification

**Date:** 2026-03-12
**Author:** Miguel Ramos
**Status:** Approved
**Version:** 0.7.0

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
| Theming | Headless default; optional 28-palette theme package | 30+ built-in themes | Adobe Spectrum theme | No built-in themes | Fluent Design theme |
| SSR/SSG | Investigation planned post-Phase 1 | Partial (Astro, 11ty) | Limited | Limited | Limited |

A detailed competitive component-by-component gap analysis is available in [`COMPETITIVE-COMPONENT-ANALYSIS.md`](./COMPETITIVE-COMPONENT-ANALYSIS.md).

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
2. **Theme as accelerator** — The theme package provides ready-to-go themes. Import one and everything works. Never mandatory.
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
| i18n — Localization | Localization of component labels (e.g., "Close", "Dismiss") is the consumer's responsibility via slots and attributes |
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
| Foundation Tokens | Explicitly defined in `tokens.css` (sizes, shadows, easings, typography, z-index, opacity, motion, radius, border-width, focus-ring) — all `--line-*` prefixed |
| Color Tokens | **Custom 12-level semantic system** (28 palettes, light/dark mode) |
| CSS Processing | **PostCSS** (latest stable, with updated plugins) |
| All dependencies | **Latest stable versions** |

### 2.1 Stack Rationale

**Bun** — Faster runtime, faster installs, native workspace support. Replaces Node.js + pnpm. Vite is kept for builds as its library mode with Rolldown is more mature than Bun's bundler for library output.

**Vite 7+ with Rolldown** — Rolldown (Rust-based) replaces Rollup internally in Vite 7. Same configuration API, significantly faster builds. Vite 7 stabilises the Rolldown integration that was experimental in earlier versions.

**Biome** — Single tool for lint + format. Rust-based, orders of magnitude faster. Replaces ~10 packages: eslint, prettier, eslint-plugin-import, eslint-plugin-unicorn, eslint-config-prettier, etc.

**Zag.js** — Production-ready state machines for 50+ UI patterns. Framework-agnostic with official Lit adapter (`@zag-js/element`). WAI-ARIA accessibility built-in. Keyboard navigation, focus management, all solved.

**Foundation Tokens** — All foundation tokens are explicitly defined in `tokens/` (a directory of per-family CSS files with a barrel `tokens.css`) under the `--line-*` prefix. Open Props served as a design reference for initial values but is NOT used at runtime or build time. Core families provide ~299 tokens (typography, sizing, borders, shadows, easing, z-index, aspects, durations, opacity, focus-ring, absolute colors). Decorative families (animations, gradients, masks, layouts, highlights, SVG) add ~114 more. All ~413 tokens are owned, versioned, and documented within the theme package.

**Custom Color System** — 12 semantic levels per palette (background to high-contrast), inspired by Radix Colors. The heart of the theming system with 28 palettes supporting light/dark mode.

---

## 3. Component Architecture

Cross-cutting architectural decisions — composition patterns, state management tiers, styling conventions, base class design, bundle splitting rules, and detailed per-component architectural debates — are documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

Key architectural principles referenced throughout this document:

| Principle | Summary | Reference |
|-----------|---------|-----------|
| Composition via slot | Components connect via `<slot>`, not imports. Field does not import Input. Independence is the default. | ARCHITECTURE §2 |
| Slot vs Internal Part rule | Consumer controls content → slot. Component coordinates state → internal part. | ARCHITECTURE §3 |
| Dual-layer CSS | `--line-*` custom properties for token adjustments. `::part()` for total visual control. | ARCHITECTURE §4 |
| Three tiers | Pre-built (Zag.js machine), Custom (`createMachine`), Static (no machine). | ARCHITECTURE §8 |
| Form association | Opt-in `formAssociated` mixin via `ElementInternals`. Native `<form>` participation. | ARCHITECTURE §7 |
| Bundle splitting | Families share one entrypoint. Independent components get separate entrypoints. Slot = independence. | ARCHITECTURE §12 |
| Field as orchestrator | Connects label/hint/error to any control via slot + events. Does not import controls. | ARCHITECTURE §9 |
| Parts naming | Shared vocabulary across components: `root`, `trigger`, `content`, `overlay`, etc. | ARCHITECTURE §5 |

---

## 4. Component Catalogue

Each component has a product-level description below and a detailed technical specification in `.spec/`. Specs follow the template defined in [`COMPONENT-SPEC-TEMPLATE.md`](../.spec/COMPONENT-SPEC-TEMPLATE.md).

### 4.1 Primitives Base

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Button | Custom | Primary interactive element for triggering actions. Supports form submit/reset | [spec](../.spec/0002-button.md) |
| IconButton | Custom | Icon-only action button. Requires accessible label for screen readers | [spec](../.spec/0003-icon-button.md) |
| ButtonGroup | Static | Visually groups related buttons with border collapse and shared navigation | [spec](../.spec/0004-button-group.md) |
| SplitButton | Custom | Primary action with dropdown for alternatives. Composes Button + Menu internally | [spec](../.spec/0005-split-button.md) |
| Alert | Static | Inline persistent feedback for info, warnings, errors, or success states | [spec](../.spec/0006-alert.md) |
| Badge | Static | Small status indicator — count, dot, or label variant | [spec](../.spec/0007-badge.md) |
| Chip | Static | Display tag with optional remove. Used for categories, filters, selections | [spec](../.spec/0008-chip.md) |
| Avatar | Static | User or entity representation with image, initials fallback, and status | [spec](../.spec/0009-avatar.md) |
| AvatarGroup | Custom | Stacked avatars with overflow counter. Expands on hover, popover on overflow click | [spec](../.spec/0010-avatar-group.md) |
| Separator | Static | Visual divider between content sections. Horizontal or vertical | [spec](../.spec/0011-separator.md) |
| Visually Hidden | Static | Accessibility utility — hides content visually, available to screen readers | [spec](../.spec/0012-visually-hidden.md) |
| Portal | Static | Renders child content outside its DOM parent | [spec](../.spec/0013-portal.md) |
| Icon | Static | Framework-agnostic icon wrapper with pluggable library registry | [spec](../.spec/0014-icon.md) |
| Kbd / Shortcut | Static | Keyboard shortcut display with OS-aware rendering (Cmd vs Ctrl) | [spec](../.spec/0015-kbd.md) |
| Skeleton | Static | Placeholder loading indicator with pulse or wave animation | [spec](../.spec/0016-skeleton.md) |
| Presence | Pre-built | Controls mount/unmount animations for enter/exit transitions | [spec](../.spec/0017-presence.md) |
| Stack | Static | Flex layout helper for vertical or horizontal stacking with gap | [spec](../.spec/0018-stack.md) |
| Grid | Static | CSS Grid layout wrapper with responsive column control | [spec](../.spec/0019-grid.md) |
| Center | Static | Centering utility for horizontal, vertical, or both axes | [spec](../.spec/0020-center.md) |
| Aspect Ratio | Static | Maintains fixed width-to-height ratio for responsive media | [spec](../.spec/0021-aspect-ratio.md) |
| Spinner | Static | Standalone loading indicator. CSS-only animation, no visual opinion | [spec](../.spec/0022-spinner.md) |

### 4.2 Forms — Essential

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Input | Custom | Text input for email, tel, url, and plain text. Detects autofill | [spec](../.spec/0023-input.md) |
| PasswordInput | Custom | Password field with built-in visibility toggle | [spec](../.spec/0024-password-input.md) |
| SearchInput | Custom | Text input with built-in clear action | [spec](../.spec/0025-search-input.md) |
| DateInput | Custom | Masked date field with segment navigation. No popup | [spec](../.spec/0026-date-input.md) |
| Textarea | Custom | Multi-line text input with optional auto-resize | [spec](../.spec/0027-textarea.md) |
| Field | Custom | Orchestrates label, hint, error, and required indicator for any control | [spec](../.spec/0028-field.md) |
| Fieldset | Static | Semantic grouping of related controls with legend and disabled propagation | [spec](../.spec/0029-fieldset.md) |
| Checkbox | Pre-built | Binary or indeterminate selection control | [spec](../.spec/0030-checkbox.md) |
| Radio Group | Pre-built | Single selection from a set of options | [spec](../.spec/0031-radio-group.md) |
| Switch | Pre-built | Toggle between two states (on/off) | [spec](../.spec/0032-switch.md) |
| Select | Pre-built | Dropdown with search, groups, and keyboard navigation | [spec](../.spec/0033-select.md) |
| Toggle Group | Pre-built | Exclusive or multi-selection between segmented options | [spec](../.spec/0034-toggle-group.md) |
| Slider | Pre-built | Single-value selection along a range | [spec](../.spec/0035-slider.md) |
| Number Input | Pre-built | Numeric input with increment/decrement controls | [spec](../.spec/0036-number-input.md) |
| Editable | Pre-built | Click-to-edit inline text for tables, settings, profiles | [spec](../.spec/0037-editable.md) |

### 4.3 Overlays & Feedback

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Dialog | Pre-built | Modal or non-modal dialog for focused interactions | [spec](../.spec/0038-dialog.md) |
| Alert Dialog | Pre-built | Confirmation dialog requiring explicit user action | [spec](../.spec/0039-alert-dialog.md) |
| Sheet | Pre-built | Side panel — overlay or push mode, any edge | [spec](../.spec/0040-sheet.md) |
| Drawer | Pre-built | Temporary sliding panel for supplementary content | [spec](../.spec/0041-drawer.md) |
| Popover | Pre-built | Floating content anchored to a trigger | [spec](../.spec/0042-popover.md) |
| Tooltip | Pre-built | Brief contextual information on hover or focus | [spec](../.spec/0043-tooltip.md) |
| Hover Card | Pre-built | Rich preview content shown on hover | [spec](../.spec/0044-hover-card.md) |
| Toast | Pre-built | Transient notification with stacking and auto-dismiss | [spec](../.spec/0045-toast.md) |

### 4.4 Navigation & Disclosure

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Tabs | Pre-built | Switchable content panels with keyboard navigation | [spec](../.spec/0046-tabs.md) |
| Accordion | Pre-built | Vertically stacked collapsible sections | [spec](../.spec/0047-accordion.md) |
| Collapsible | Pre-built | Single expandable/collapsible content section | [spec](../.spec/0048-collapsible.md) |
| Menu / Context Menu | Pre-built | Dropdown or right-click menu with submenus | [spec](../.spec/0049-menu.md) |
| Navigation Menu | Pre-built | Site-level navigation with mega-menu support | [spec](../.spec/0050-navigation-menu.md) |
| Breadcrumb | Static | Hierarchical path showing current location | [spec](../.spec/0051-breadcrumb.md) |
| Breadcrumb Trail | Custom | Clickable breadcrumb with sibling dropdown at each level | [spec](../.spec/0052-breadcrumb-trail.md) |
| Pagination | Pre-built | Page-based navigation for large datasets | [spec](../.spec/0053-pagination.md) |
| Steps / Stepper | Pre-built | Visual progress indicator for multi-step processes | [spec](../.spec/0054-steps.md) |
| Menubar | Custom | Horizontal app-style menu bar for desktop-inspired interfaces | [spec](../.spec/0055-menubar.md) |

### 4.5 Forms — Advanced

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Combobox | Pre-built | Autocomplete input with filterable options | [spec](../.spec/0056-combobox.md) |
| Date Picker | Pre-built | Calendar popup for date selection | [spec](../.spec/0057-date-picker.md) |
| Date Range Picker | Pre-built | Two-calendar date range selection | [spec](../.spec/0058-date-range-picker.md) |
| Time Picker | Pre-built | Time selection with segments | [spec](../.spec/0059-time-picker.md) |
| Color Picker | Pre-built | Visual colour selection | [spec](../.spec/0060-color-picker.md) |
| Pin Input | Pre-built | Individual character inputs for OTP codes | [spec](../.spec/0061-pin-input.md) |
| Rating | Pre-built | Star or custom icon rating selection | [spec](../.spec/0062-rating.md) |
| Range Slider | Pre-built | Dual-thumb slider for value ranges | [spec](../.spec/0063-range-slider.md) |
| File Upload | Pre-built | Drag-and-drop file selection with validation | [spec](../.spec/0064-file-upload.md) |
| Signature Pad | Pre-built | Drawing canvas for capturing signatures | [spec](../.spec/0065-signature-pad.md) |
| Tag Input | Custom | Text-to-tags with autocomplete and reorder | [spec](../.spec/0066-tag-input.md) |
| Mention Input | Custom | Textarea with @mention and #channel inline | [spec](../.spec/0067-mention-input.md) |
| Search Field | Custom | Full search with suggestions and scoped filtering | [spec](../.spec/0068-search-field.md) |
| Wizard | Custom | Multi-step form with validation and branching | [spec](../.spec/0069-wizard.md) |

### 4.6 Data Display

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Table | Custom | Headless data table with sort, filter, and selection | [spec](../.spec/0070-table.md) |
| Card | Static | Composable container with header, body, and footer | [spec](../.spec/0071-card.md) |
| Progress | Pre-built | Linear or circular progress indicator | [spec](../.spec/0072-progress.md) |
| Progress Ring | Static | Multiple overlapping circular indicators | [spec](../.spec/0073-progress-ring.md) |
| Progress List | Custom | Real-time operation status list | [spec](../.spec/0074-progress-list.md) |
| Scroll Area | Pre-built | Custom styled scrollbar preserving native behaviour | [spec](../.spec/0075-scroll-area.md) |
| Carousel | Pre-built | Content slider with touch and keyboard | [spec](../.spec/0076-carousel.md) |
| Clipboard | Pre-built | Copy-to-clipboard with visual feedback | [spec](../.spec/0077-clipboard.md) |
| QR Code | Pre-built | Dynamic QR code generation | [spec](../.spec/0078-qr-code.md) |
| Timer | Pre-built | Countdown or stopwatch | [spec](../.spec/0079-timer.md) |
| Tree View | Pre-built | Hierarchical expandable data display | [spec](../.spec/0080-tree-view.md) |
| Gauge / Meter | Static | Semicircular arc with pointer and zones | [spec](../.spec/0081-gauge.md) |
| Empty State | Static | Placeholder for empty content areas | [spec](../.spec/0082-empty-state.md) |

### 4.7 Layout & Containers

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| App Shell | Static | Full application layout via slots | [spec](../.spec/0083-app-shell.md) |
| Sidebar | Custom | Collapsible side navigation with rail mode | [spec](../.spec/0084-sidebar.md) |
| Header / Toolbar | Static | Sticky top bar with slots | [spec](../.spec/0085-header.md) |
| Content Area | Static | Scrollable main content with max-width | [spec](../.spec/0086-content-area.md) |
| Panel | Custom | Collapsible container with header/body/footer | [spec](../.spec/0087-panel.md) |
| Splitter | Pre-built | Resizable panel divider | [spec](../.spec/0088-splitter.md) |
| Floating Panel | Pre-built | Draggable window with minimize/maximize/snap | [spec](../.spec/0089-floating-panel.md) |

### 4.8 Desktop-Inspired

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Command Palette | Custom | Cmd+K searchable command launcher | [spec](../.spec/0090-command-palette.md) |
| Spotlight | Custom | Global search overlay with preview | [spec](../.spec/0091-spotlight.md) |
| Status Bar | Static | Bottom information bar with widget slots | [spec](../.spec/0092-status-bar.md) |
| Activity Bar | Custom | Vertical icon bar for panel switching | [spec](../.spec/0093-activity-bar.md) |
| Notification Center | Custom | Grouped dismissable notification history | [spec](../.spec/0094-notification-center.md) |
| Properties Panel | Custom | Contextual property editor for selected items | [spec](../.spec/0095-properties-panel.md) |
| Minimap | Static | Miniature content preview with viewport indicator | [spec](../.spec/0096-minimap.md) |
| Master-Detail | Custom | Split view: list left, detail right | [spec](../.spec/0097-master-detail.md) |
| List View | Custom | Multi-select list with keyboard nav and reorder | [spec](../.spec/0098-list-view.md) |
| Segmented Control | Custom | Toggle between 2-5 options with sliding indicator | [spec](../.spec/0099-segmented-control.md) |
| Dock | Custom | macOS-style icon bar with magnification | [spec](../.spec/0100-dock.md) |

### 4.9 Innovative

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Kanban Board | Custom | Drag-and-drop workflow columns and cards | [spec](../.spec/0101-kanban-board.md) |
| Timeline | Static | Chronological event display with branching | [spec](../.spec/0102-timeline.md) |
| Data Grid | Custom | High-performance grid with virtual scrolling | [spec](../.spec/0103-data-grid.md) |
| Infinite Scroll | Custom | Intersection Observer-based infinite loading | [spec](../.spec/0104-infinite-scroll.md) |
| Marquee | Static | Continuous scrolling content | [spec](../.spec/0105-marquee.md) |
| Spotlight Card | Static | Cursor-following gradient glow effect | [spec](../.spec/0106-spotlight-card.md) |
| Image Comparison | Custom | Before/after slider for two images | [spec](../.spec/0107-image-comparison.md) |
| Sparkline | Static | Mini inline chart for data-dense contexts | [spec](../.spec/0108-sparkline.md) |
| Flip Card | Static | 3D flip animation between front and back | [spec](../.spec/0109-flip-card.md) |
| Morph | Static | Shared layout animation via View Transitions | [spec](../.spec/0110-morph.md) |
| Diff Viewer | Static | Side-by-side or unified text comparison | [spec](../.spec/0111-diff-viewer.md) |
| Wheel Picker | Custom | iOS-style rotary scroll selection | [spec](../.spec/0112-wheel-picker.md) |
| Angle Slider | Pre-built | Circular rotary input for angular values | [spec](../.spec/0113-angle-slider.md) |
| Highlight | Pre-built | Text matching and highlighting | [spec](../.spec/0114-highlight.md) |
| Tour | Pre-built | Step-by-step product tour | [spec](../.spec/0115-tour.md) |

### 4.10 Real-World / Domain Components

| Component | Tier | Description | Spec |
|-----------|------|-------------|------|
| Ballot / Poll | Custom | Voting with live animated results | [spec](../.spec/0116-ballot.md) |
| Reaction Bar | Custom | Emoji reactions with counter and toggle | [spec](../.spec/0117-reaction-bar.md) |
| Proof / Annotation | Custom | Positional pins/comments on images/documents | [spec](../.spec/0118-proof.md) |
| Price Card | Static | Currency display with period and discount | [spec](../.spec/0119-price-card.md) |
| Stat Card | Static | Dashboard metric with value, label, and trend | [spec](../.spec/0120-stat-card.md) |
| Ticket / Pass | Static | Visual ticket with notch and barcode/QR slot | [spec](../.spec/0121-ticket.md) |
| Chat Bubble | Static | Message with tail, status, and reactions | [spec](../.spec/0122-chat-bubble.md) |
| Audio Player | Custom | Headless audio controls | [spec](../.spec/0123-audio-player.md) |
| Video Player | Custom | Headless video controls with PiP and captions | [spec](../.spec/0124-video-player.md) |
| Cookie Consent | Custom | GDPR banner with category toggles | [spec](../.spec/0125-cookie-consent.md) |
| Calendar View | Custom | Day/week/month event calendar (not date picker) | [spec](../.spec/0126-calendar-view.md) |
| Terminal | Custom | Monospace console with ANSI colours | [spec](../.spec/0127-terminal.md) |
| Receipt | Static | Line item layout with subtotal and total | [spec](../.spec/0128-receipt.md) |
| Changelog | Static | Chronological release notes | [spec](../.spec/0129-changelog.md) |
| Weather Card | Static | Composable weather display | [spec](../.spec/0130-weather-card.md) |
| Map Marker | Custom | Customisable map pin with popover | [spec](../.spec/0131-map-marker.md) |
| OTP Verification | Custom | Complete verification flow with timer and resend | [spec](../.spec/0132-otp-verification.md) |

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
│   ├── Theming (how to apply themes)
│   ├── Customisation (parts & custom properties)
│   └── Icon Setup (registering icon libraries)
├── Foundation
│   ├── Colours (palettes + visual schemas)
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

The theme package requires additional testing beyond component-level tests to ensure token integrity, accessibility compliance, and visual correctness across all palettes and modes.

| Test Category | Tool / Approach | What it validates |
|---------------|----------------|-------------------|
| Build-time token validation | PostCSS plugin or build script | Cross-references all `var()` usage in source CSS against declared tokens in `tokens.css`, `colors/*.css`, `schemas/*.css`, and `aliases.css`. Fails the build if any token is referenced but undefined. |
| Build-time contrast validation | Automated WCAG AA checker | Verifies 4.5:1 minimum contrast for all 28 palettes × semantic pairs (solid-background vs solid-text, background vs high-contrast, etc.) × light/dark mode. Runs against generated CSS values. |
| Token parity tests | Bun test assertions | Asserts that light and dark mode variants declare identical token sets. Every `--line-*` token defined in `:where(html)` must also be defined in `:is(.dark)` (and vice versa). |
| CSS snapshot tests | Bun test + snapshot | Generates and snapshots the compiled CSS output per palette/theme combination. Detects unintended changes to token values, selector specificity, or output structure. |
| Visual regression (showcase app) | Playwright screenshots in CI | Captures screenshots of the `apps/showcase/` pages for each palette (28) × mode (light/dark) = 56 screenshots. Diffs against baseline to detect visual regressions. |
| `@property` registration with fallbacks | Development-time detection | Registers key tokens via CSS `@property` with obvious fallback values (e.g., `hotpink`) during development. Any `hotpink` visible in the UI indicates an undefined token, making missing tokens immediately visible without build tooling. |

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
| Theming showcase | Interactive theme browser (`apps/showcase/`) |
| Changelog | Release notes (auto-generated via Changesets) |
| Storybook link | Link to deployed Storybook |

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
├── components/     ← All UI components (line-button, line-dialog, etc.)
├── theme/          ← Ready-to-go themes + colour tokens
├── icons/          ← Icon registry + resolvers for popular libraries
├── site/           ← Astro site (not published to npm)
└── storybook/      ← Storybook config + stories (not published to npm)
```

**Published packages (target):**

| Package | npm name |
|---------|----------|
| core | `@websublime/line-core` |
| components | `@websublime/line-components` |
| theme | `@websublime/line-theme` |
| icons | `@websublime/line-icons` |

**Private packages:** `site`, `storybook` (not published).

### 6.2 Build — Vite 7+ with Rolldown

**Core package:**

```
src/ → Vite library mode → dist/
  ├── index.js          ← Main barrel
  ├── line-element.js   ← Base class
  ├── mixins/           ← Individual mixins (inspector, metadata, direction, form-associated)
  ├── utilities/        ← Helpers, decorators
  └── types/            ← .d.ts
```

**Components package — Tree-shakeable per-component:**

Each component family or independent component is a separate entrypoint in `package.json` (see §3.13 Bundle Splitting Rule):

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./button": "./dist/button/index.js",
    "./icon-button": "./dist/icon-button/index.js",
    "./button-group": "./dist/button-group/index.js",
    "./input": "./dist/input/index.js",
    "./password-input": "./dist/password-input/index.js",
    "./search-input": "./dist/search-input/index.js",
    "./date-input": "./dist/date-input/index.js",
    "./field": "./dist/field/index.js",
    "./fieldset": "./dist/fieldset/index.js",
    "./dialog": "./dist/dialog/index.js",
    "./tabs": "./dist/tabs/index.js",
    "./alert": "./dist/alert/index.js",
    "./chip": "./dist/chip/index.js",
    "./avatar": "./dist/avatar/index.js",
    "./avatar-group": "./dist/avatar-group/index.js"
  }
}
```

Consumer imports surgically:

```js
import '@websublime/line-components/button'
import '@websublime/line-components/field'
import '@websublime/line-components/input'
```

**Theme package:**

Individual CSS files per theme + complete bundle:

```json
{
  "exports": {
    ".": "./dist/line.css",
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
| Migrate to Bun | Runtime + workspaces, remove pnpm | Review pending | |
| Migrate to Biome | Remove ESLint + Prettier + all plugins, configure Biome | Review pending | |
| Update all dependencies | Lit 3+, Vite 7+ with Rolldown, PostCSS latest | Review pending | |
| Refactor LineElement | Base class with Zag.js lifecycle, mixins (inspector, metadata, direction, form-associated). Zag.js integration is a future investigation — the `@zag-js/element` adapter maturity is a technical risk to be validated | | |
| FormAssociated mixin | Implement opt-in `formAssociated` mixin in LineElement using `ElementInternals`. Provides: `setFormValue()`, `reportValidity()`, `checkValidity()`, `:invalid`/`:valid` states | | |
| Restructure monorepo | 6 packages: core, components, theme, icons, site, storybook | | |
| Setup Storybook 8 | `@storybook/web-components-vite` + CEM analyzer | | |
| Setup testing | Bun test + `@open-wc/testing-helpers` + Playwright | | |
| Setup CI/CD | GitHub Actions: checks, release, snapshot-deploy, snapshot-version | | |
| Define RC pipeline | Release candidate pipeline for `next` branch | | |
| npm scope | Configure `@websublime/line-*` on npm | | |
| Theme package v2 | Define foundation tokens explicitly in `tokens.css` + maintain 12-level colour system | | |
| Icon registry | Agnostic resolver system | | |
| Base documentation | Getting started, theming guide, customisation guide in Storybook | | |
| Validate HTMX integration | Spike: validate `LineHtmxElement` adapter with `hx-*` forwarding, server-driven state, swap-aware lifecycle. Determine if exploratory or committed for Phase 1 | | P2 |

**Phase 0 Status:** Tasks marked "Review pending" are functionally complete but require verification of quality and integration before sign-off.

**Exit criteria:**
- All tasks marked "Done" with review completed
- Monorepo structure matches target
- A developer can create, build, test, and document a new component using LineElement
- FormAssociated mixin operational with native `<form>` elements
- CI/CD pipeline operational (checks + RC releases on `next`)

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

**20 components.** Validates architecture, parts convention, slot/part decision rule, per-component build pipeline, bundle splitting, and automatic documentation.

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

**15 components.** First real Zag.js integration — both pre-built and custom machines. Validates machine + Lit + parts pattern in forms. Validates Field orchestration, formAssociated integration, and the slot/part decision rule for internal elements (toggle, clear, increment).

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

Individual component specifications live in [`.spec/`](../.spec/). Each spec follows the template defined in [`COMPONENT-SPEC-TEMPLATE.md`](../.spec/COMPONENT-SPEC-TEMPLATE.md).

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

New components require a spec in `.spec/` before implementation begins. The spec must be in `approved` status before any code is written. Pull requests that add new components without a corresponding spec will be rejected.

---

## 9. Design Token System

> **Branding refactor required:** The existing theme package is published as `@websublime/vitamina-theme` v0.6.0 and uses unprefixed variables (`--blue-9`, `--background`) and unprefixed classes (`.schema-blue`, `.is-blue`). This section documents the **target architecture** using the `line://ui` branding (`--line-*` prefix, `.line-*` classes). The codebase refactor to align with this specification is a Phase 0 task (see [section 9.14](#914-branding-refactor-phase-0)).

### 9.1 Colour Palette System (Custom — 12 Semantic Levels)

The colour system is inspired by [Radix Colors](https://www.radix-ui.com/colors) and provides 28 colour-named palettes. Each palette defines 12 levels with hand-crafted HSL values for both light and dark modes.

**The 28 palettes:**

| Group | Palettes |
|-------|----------|
| Neutrals | gray, mauve, slate, sage, olive, sand |
| Warm | tomato, red, crimson, pink, plum, purple, violet |
| Cool | indigo, blue, cyan, teal |
| Nature | green, grass, lime, mint, sky |
| Earth | brown, bronze, gold |
| Alert | yellow, amber, orange |

All palettes are **colour-named** (not semantic). A semantic alias layer (`--line-primary-*`, `--line-danger-*`, etc.) is defined in [section 9.5](#95-semantic-alias-layer) and implemented in Phase 1.

**12-level structure per palette:**

| Level | Variable | Semantic Use |
|-------|----------|-------------|
| 1 | `--line-{color}-1` | App background |
| 2 | `--line-{color}-2` | Subtle background |
| 3 | `--line-{color}-3` | UI element background |
| 4 | `--line-{color}-4` | UI element hover background |
| 5 | `--line-{color}-5` | UI element active / selected background |
| 6 | `--line-{color}-6` | Subtle borders and separators |
| 7 | `--line-{color}-7` | UI element border and focus rings |
| 8 | `--line-{color}-8` | UI element border hover |
| 9 | `--line-{color}-9` | Solid backgrounds (primary action colour) |
| 10 | `--line-{color}-10` | Solid hover backgrounds |
| 11 | `--line-{color}-11` | Low-contrast text |
| 12 | `--line-{color}-12` | High-contrast text |

**Naming pattern:** `--line-{palette}-{level}`, e.g., `--line-blue-1`, `--line-crimson-9`, `--line-gray-12`.

Each palette file (e.g., `src/colors/blue.css`) defines light mode values on `:where(html)` and dark mode values on `:where(html):is(.dark)`:

```css
/* src/colors/blue.css */
:where(html) {
  --line-blue-1: hsl(206, 100%, 99.2%);
  --line-blue-2: hsl(210, 100%, 98.0%);
  /* ... through --line-blue-12 */
}

:where(html):is(.dark) {
  --line-blue-12: hsl(212, 35.0%, 9.2%);
  --line-blue-11: hsl(216, 50.0%, 11.8%);
  /* ... through --line-blue-1 — note: numbering is reversed in dark mode */
}
```

Dark mode values are **not** simply inverted — each level has independently crafted HSL values optimised for dark backgrounds. The level numbering reverses in dark mode (level 12 becomes the darkest, level 1 becomes the lightest) to maintain the semantic meaning: level 1 is always "background", level 12 is always "high contrast text", regardless of mode.

### 9.2 Variable Namespace

**Decision: All tokens use the `--line-*` prefix.** No exceptions. This provides zero collision risk, a single naming convention, and consistent branding across the design system.

| Token Category | Namespace | Examples | Defined In |
|----------------|-----------|----------|------------|
| Palette colours | `--line-{color}-{level}` | `--line-blue-1`, `--line-gray-12`, `--line-crimson-9` | `src/colors/*.css` |
| Semantic roles | `--line-{role}` | `--line-background`, `--line-solid-hover`, `--line-high-contrast` | `src/schemas/*.css`, `src/semantic.css` |
| Foundation tokens | `--line-{token}` | `--line-size-3`, `--line-font-size-2`, `--line-shadow-3` | `src/tokens.css` |
| Semantic aliases | `--line-{alias}[-{intent}]` | `--line-primary`, `--line-primary-hover`, `--line-danger-text` | `src/aliases.css` (Phase 1) |
| Component tokens | `--line-{component}-{prop}` | `--line-button-radius`, `--line-input-bg` | Component `:host` styles |
| CSS classes | `.line-{name}` | `.line-schema-blue`, `.line-is-blue`, `.line-is-background` | `src/schemas/*.css`, `src/utils/utilities.css` |

**Foundation token ownership:** All foundation tokens are explicitly defined in `src/tokens.css` with the `--line-*` prefix. Open Props was used as a design reference for initial values (sizes, shadows, typography scales) but is NOT a runtime or build-time dependency. The `postcss-jit-props` plugin and `open-props` package have been removed from the pipeline. Every token is owned, versioned, and documented within the theme package.

### 9.3 Foundation Token System

Foundation tokens are defined explicitly in `src/tokens.css` with the `--line-*` prefix. No external token library is used at runtime or build time. The `postcss-jit-props` plugin and `open-props` package have been removed from the pipeline. All tokens are owned, versioned, and documented within the theme package.

**Design system layer model:**

| Layer | Name | Source file | Contents |
|-------|------|------------|----------|
| L0 | Primitives | `colors/*.css` | Raw palette values: `--line-blue-1..12`, `--line-blue-contrast` |
| L1 | Foundation tokens | `tokens.css` | Named scales: typography, sizing, shadows, z-index, opacity, motion, radius, border-width, focus-ring, aspect-ratio |
| L2 | Semantic roles | `semantic.css` + `schemas/*.css` | Context-mapped: `--line-background`, `--line-solid-background`, `--line-solid-text` |
| L3 | Semantic aliases | `aliases.css` | Intent-mapped: `--line-primary`, `--line-danger`, etc. (6 aliases × 9 tokens = 54 variables) |
| L4 | Component tokens | `@websublime/line-presets` | Scoped: `--line-button-radius`, `--line-input-height` |
| L5 | Component styles | `@websublime/line-presets` | Visual opinions via `::part()` selectors |

**Foundation tokens (L1) — complete catalogue:**

| Category | Variables | Count |
|----------|-----------|-------|
| Font families | 15 OP stacks (`--line-font-system-ui` through `--line-font-handwritten`) + 3 custom (`--line-font-sans/serif/mono`) | 18 |
| Font weights | `--line-font-weight-1` through `--line-font-weight-9` | 9 |
| Font sizes | `--line-font-size-0..9` (static) + `--line-font-size-fluid-0..3` (fluid) | 14 |
| Line heights | `--line-font-lineheight-0..9` (OP 7 + 3 extensions) | 10 |
| Letter spacing | `--line-font-letterspacing-0..9` (OP 8 + 2 extensions) | 10 |
| Sizing (rem) | `--line-size-000..15` | 17 |
| Sizing (px) | `--line-size-px-000..15` | 17 |
| Sizing (fluid) | `--line-size-fluid-1..10` | 10 |
| Sizing (content/header) | `--line-size-content-1..3`, `--line-size-header-1..3` | 6 |
| Breakpoints | `--line-size-xxs` through `--line-size-xxl` | 7 |
| Sizing (relative) | `--line-size-relative-000..15` | 17 |
| Border sizes | `--line-border-size-1..5` | 5 |
| Border radii | `--line-radius-1..6` + round + 6 drawn + 5 blob + 6 conditional | 24 |
| Shadows | `--line-shadow-1..6` + inner 0..4 + highlight + color + strength | 14 |
| Z-index | `--line-layer-1..5` + `--line-layer-important` + `--line-z-dropdown..tooltip` (8 semantic) | 14 |
| Easing | Full 1:1 OP match: standard, in, out, in-out, elastic, step, spring, bounce, named curves | 81 |
| Durations | `--line-duration-instant..gentle-2` (OP 7) + `--line-duration-xfast..glacial` (5 semantic) | 12 |
| Opacity | `--line-opacity-disabled/overlay/placeholder` | 3 |
| Focus ring | `--line-ring-width/offset/color` | 3 |
| Aspect ratio | `--line-ratio-square..golden` | 6 |
| Absolute colours | `--line-white`, `--line-black` + color-scheme | 2 |

**Total: ~413 foundation tokens** (~299 core + ~114 decorative). Full definitions in `docs/DESIGN-SYSTEM-IMPLEMENTATION-GUIDE.md` Appendix A. Architecture: `tokens/` directory with per-family CSS files, each independently importable.

**Contrast tokens (L0):** Each of the 28 colour palettes also defines a `--line-{palette}-contrast` token (`#fff` or `#000`) that guarantees WCAG AA 4.5:1 contrast for text on level-9 solid backgrounds. See §9.15 for the full contrast system.

### 9.4 Schema System — Semantic Layer

Schemas map the 12 palette levels to **semantic role variables**. Each palette has a corresponding schema file (`src/schemas/{palette}.css`) scoped to a CSS class.

**The 14 semantic role variables:**

| Semantic Variable | Maps To (Light) | Maps To (Dark) | Purpose |
|-------------------|-----------------|----------------|---------|
| `--line-background` | `--line-{color}-1` | `--line-{color}-12` | App background |
| `--line-subtle-background` | `--line-{color}-2` | `--line-{color}-11` | Subtle background |
| `--line-ui-background` | `--line-{color}-3` | `--line-{color}-10` | UI element background |
| `--line-ui-hover-background` | `--line-{color}-4` | `--line-{color}-9` | Hovered UI element |
| `--line-ui-active-background` | `--line-{color}-5` | `--line-{color}-8` | Active / selected element |
| `--line-subtle-border` | `--line-{color}-6` | `--line-{color}-7` | Subtle borders |
| `--line-ui-border` | `--line-{color}-7` | `--line-{color}-6` | UI element borders |
| `--line-ui-border-hover` | `--line-{color}-8` | `--line-{color}-5` | Hovered borders |
| `--line-solid-background` | `--line-{color}-9` | `--line-{color}-4` | Solid backgrounds |
| `--line-solid-hover` | `--line-{color}-10` | `--line-{color}-3` | Hovered solid backgrounds |
| `--line-low-contrast` | `--line-{color}-11` | `--line-{color}-2` | Low-contrast text |
| `--line-high-contrast` | `--line-{color}-12` | `--line-{color}-1` | High-contrast text |
| `--line-light` | `--line-{color}-1` | `--line-{color}-12` | Lightest value in current mode |
| `--line-dark` | `--line-{color}-12` | `--line-{color}-1` | Darkest value in current mode |

**Activation mechanism — CSS class:**

```css
/* src/schemas/blue.css */
:where(.line-schema-blue) {
  --line-background: var(--line-blue-1);
  --line-subtle-background: var(--line-blue-2);
  /* ... all 14 semantic roles */
}

:is(.dark) :where(.line-schema-blue) {
  --line-background: var(--line-blue-12);
  --line-subtle-background: var(--line-blue-11);
  /* ... reversed mapping for dark mode */
}
```

The consumer applies a schema by adding a CSS class to any container:

```html
<!-- Full page schema -->
<body class="line-schema-blue">

<!-- Scoped schema (different section) -->
<section class="line-schema-blue">...</section>
<aside class="line-schema-crimson">...</aside>
```

This class-based scoping means **multiple schemas can coexist on the same page** — each container gets its own semantic colour context.

**Palette-specific utility classes (per schema):**

Each schema file also generates utility classes for direct use. Using blue as an example:

| Class | Light Mode | Dark Mode | Description |
|-------|------------|-----------|-------------|
| `.line-is-blue` | `color: --line-blue-1; bg: --line-blue-9` | `color: --line-blue-1; bg: --line-blue-4` | Solid button-like styling with hover |
| `.line-is-blue-color` | `color: --line-blue-12` | `color: --line-blue-1` | High-contrast text in palette |
| `.line-is-blue-low-contrast` | `color: --line-blue-11` | `color: --line-blue-2` | Low-contrast text |
| `.line-is-blue-high-contrast` | `color: --line-blue-12` | `color: --line-blue-1` | High-contrast text |
| `.line-is-blue-background` | `bg: --line-blue-1` | `bg: --line-blue-12` | App background |
| `.line-is-blue-subtle-background` | `bg: --line-blue-2` | `bg: --line-blue-11` | Subtle background |
| `.line-is-blue-ui-background` | `bg: --line-blue-3` (hover: 4) | `bg: --line-blue-10` (hover: 9) | UI element with hover |
| `.line-is-blue-solid-background` | `bg: --line-blue-9` | `bg: --line-blue-4` | Solid background |
| `.line-is-blue-border` | `border: --line-blue-7` (hover: 8) | `border: --line-blue-6` (hover: 5) | Border with hover |

All utility classes use `:where()` for zero specificity and `:is(.dark)` for dark mode overrides.

### 9.5 Semantic Alias Layer

A semantic alias layer maps intent-based names to specific palettes. This layer sits between palette tokens and component tokens, allowing consumers to remap semantic roles without touching component code.

**The 6 semantic aliases (Phase 1):**

| Alias | Default Palette | Purpose |
|-------|-----------------|---------|
| `primary` | blue | Brand colour, primary actions |
| `danger` | red | Errors, destructive actions |
| `success` | green | Confirmation, positive feedback |
| `warning` | amber | Caution, attention needed |
| `info` | cyan | Informational, contextual |
| `neutral` | gray | Default, content without emphasis |

Each alias provides 9 intent tokens (not all 12 palette levels — aliases map to component needs, not raw scale positions):

| Token suffix | Maps to palette level | Used for |
|-------------|----------------------|----------|
| (base) | level-9 | Solid background (buttons, badges) |
| `-hover` | level-10 | Hovered solid background |
| `-active` | level-11 | Active/pressed solid background |
| `-text` | contrast token | Text on solid background (WCAG AA) |
| `-subtle` | level-3 | Subtle/ghost background |
| `-subtle-hover` | level-4 | Hovered subtle background |
| `-outline` | level-7 | Border/outline colour |
| `-outline-hover` | level-8 | Hovered border |
| `-fg` | level-11 | Foreground text coloured by intent |

**Total: 6 aliases × 9 tokens = 54 variables.**

**Implementation:**

```css
/* src/aliases.css — theme defines the mapping */
:where(html) {
  --line-primary: var(--line-blue-9);
  --line-primary-hover: var(--line-blue-10);
  --line-primary-active: var(--line-blue-11);
  --line-primary-text: var(--line-blue-contrast);
  --line-primary-subtle: var(--line-blue-3);
  --line-primary-subtle-hover: var(--line-blue-4);
  --line-primary-outline: var(--line-blue-7);
  --line-primary-outline-hover: var(--line-blue-8);
  --line-primary-fg: var(--line-blue-11);

  --line-danger: var(--line-red-9);
  --line-danger-hover: var(--line-red-10);
  /* ... same 9-token pattern for all 6 aliases ... */
}
```

**Consumer remapping:**

```css
/* Consumer overrides "primary" to use violet instead of blue */
:root {
  --line-primary: var(--line-violet-9);
  --line-primary-hover: var(--line-violet-10);
  --line-primary-active: var(--line-violet-11);
  --line-primary-text: var(--line-violet-contrast);
  --line-primary-subtle: var(--line-violet-3);
  --line-primary-subtle-hover: var(--line-violet-4);
  --line-primary-outline: var(--line-violet-7);
  --line-primary-outline-hover: var(--line-violet-8);
  --line-primary-fg: var(--line-violet-11);
}
```

Components and presets use aliases for intent-driven styling (e.g., `--line-danger` for error button background, `--line-danger-text` for text on that background) and palette tokens for decorative or specific colour needs (e.g., `--line-blue-9` for a blue avatar background).

### 9.6 Theme Composition

A theme file imports a colour palette and its corresponding schema:

```css
/* src/themes/blue-theme.css — this is the entire file */
@import '../colors/blue.css';
@import '../schemas/blue.css';
```

**Theme = colour palette + schema.** No utility tokens, no icon registration, no additional configuration.

**Consumer usage:**

```css
/* Option 1: Full bundle — all 28 themes + utilities + normalize + aliases */
@import '@websublime/line-theme';

/* Option 2: Single theme only */
@import '@websublime/line-theme/tokens';
@import '@websublime/line-theme/normalize';
@import '@websublime/line-theme/themes/blue';
@import '@websublime/line-theme/aliases';

/* Option 3: Granular — palette and schema separately */
@import '@websublime/line-theme/tokens';
@import '@websublime/line-theme/colors/blue';
@import '@websublime/line-theme/schemas/blue';

/* Option 4: Tokens only — I have my own colours */
@import '@websublime/line-theme/tokens';

/* Option 5: Full theme + preset (out-of-the-box component styles) */
@import '@websublime/line-theme';
@import '@websublime/line-presets';
```

**The full bundle (`line.css`) import chain:**

```
line.css
├── tokens.css               ← L1: Foundation tokens (typography, sizing, shadows, motion, etc.)
├── semantic.css              ← L2: Gray-based prefers-color-scheme defaults
├── utils/normalize.css       ← Modern CSS reset (imports media.css internally)
├── utils/utilities.css       ← Utility classes mapping to semantic tokens
├── themes/*-theme.css (x28)  ← All 28 palette + schema pairs
└── aliases.css               ← L3: Semantic aliases (primary, danger, success, etc.)
```

**What themes do NOT include:**

- No utility token defaults (those live in `tokens.css`, always loaded)
- No icon library registration (theme is pure CSS, no JS side-effects)

**Custom theme contract (Phase 1 — documentation):**

A consumer creating a custom theme must provide:

1. A colour file with 12 levels (light + dark) following the `--line-{palette}-{level}` convention
2. A schema file mapping the 12 levels to the 14 semantic role variables
3. Optionally, override the semantic alias mapping to use their custom palette

A generator CLI (`line theme create --palette brand --base "#4F46E5"`) is a nice-to-have post-1.0.

### 9.7 Light/Dark Mode

Two coexisting mechanisms control light/dark mode:

**Mechanism 1: OS-level preference (automatic)**

In `semantic.css`, `@media (prefers-color-scheme: light/dark)` sets root-level semantic tokens on `:root`:

```css
@media (prefers-color-scheme: light) {
  :root {
    --line-background: hsl(0, 0%, 99.0%);
    --line-subtle-background: hsl(0, 0%, 97.5%);
    /* ... all 12 semantic roles — neutral/gray values */
    --line-white: #f1f1f1;
    --line-black: #030303;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --line-background: hsl(0, 0%, 9.5%);
    /* ... dark-optimised values */
  }
}
```

These provide **neutral (gray) defaults** for semantic tokens before any schema is applied. When the OS switches mode, these root tokens update automatically.

**Mechanism 2: Class-based override (manual)**

A `.dark` or `.light` class on `<html>` forces a mode regardless of OS preference:

```css
:where(html).dark { color-scheme: dark; }
:where(html).light { color-scheme: light; }
```

This class also triggers dark mode in:
- **Palette files:** `:where(html):is(.dark)` overrides palette level values
- **Schema files:** `:is(.dark) :where(.line-schema-*)` reverses the semantic mapping
- **Shadow tokens:** `:where(html):is(.dark)` adjusts shadow colour and strength

**How a consumer forces dark mode:**

```js
document.documentElement.classList.add('dark');
```

**Interaction between mechanisms:** The `.dark` class on `<html>` overrides palette and schema tokens via higher specificity (`:is(.dark)` vs bare `:where(html)`). However, the `semantic.css` root semantic tokens are set via `@media (prefers-color-scheme)` and are **not** overridden by the `.dark` class — they require a schema class to take effect. This means:

- Without a schema class: root tokens follow OS preference only
- With a schema class: schema tokens follow the `.dark` / `.light` class, overriding OS preference for that scope

### 9.8 PostCSS Pipeline

The build pipeline is defined in `postcss.config.mjs`:

```
postcss-import → postcss-mixins → postcss-simple-vars
    → postcss-nested → postcss-preset-env → postcss-custom-media → cssnano
```

| Plugin | Purpose | Notes |
|--------|---------|-------|
| `postcss-import` | Resolves `@import` statements, inlining all CSS into a single file | Runs first — all subsequent plugins see a flat file |
| `postcss-mixins` | Enables `@define-mixin` / `@mixin` syntax | Used for `font-size` and `font-weight` mixins |
| `postcss-simple-vars` | Enables `$variable` syntax (Sass-like variables) | Used in mixin parameter interpolation |
| `postcss-nested` | Enables `&` nesting syntax | Used throughout for nested selectors and dark mode variants |
| `postcss-preset-env` | Polyfills modern CSS features | Heavily restricted — most features disabled (see below) |
| `postcss-custom-media` | Resolves `@custom-media` queries into standard `@media` | Processes the breakpoint and preference queries from `media.css` |
| `cssnano` | Minifies output CSS | Default preset |

**`postcss-preset-env` configuration — most features explicitly disabled:**

```js
{
  autoprefixer: false,
  stage: 0,
  features: {
    'color-functional-notation': false,
    'custom-media-queries': { preserve: true },
    'custom-properties': false,        // CSS variables kept as-is (not resolved)
    'double-position-gradients': false,
    'focus-visible-pseudo-class': false,
    'focus-within-pseudo-class': false,
    'gap-properties': false,
    'logical-properties-and-values': false,
    'not-pseudo-class': false,
    'place-properties': false,
    'prefers-color-scheme-query': false
  }
}
```

This configuration ensures CSS custom properties are preserved in the output (not compiled away) and that modern CSS features already supported by target browsers are not unnecessarily polyfilled.

### 9.9 CSS Utilities

**`semantic.css`** — Foundation layer

- Light/dark mode root semantic tokens via `@media (prefers-color-scheme)`
- `color-scheme` declaration for `.dark` / `.light` classes
- All foundation tokens (typography, spacing, shadows — see [section 9.3](#93-foundation-token-system)), defined with `--line-*` prefix
- Dark mode shadow adjustments (darker shadow colour, higher strength)

**`normalize.css`** — Modern CSS reset

- Imports `media.css` internally
- `box-sizing: border-box` on all elements
- Zero-margin reset via `:where(:not(dialog))`
- Typographic defaults using `--line-font-sans`, `--line-font-lineheight-3`, `--line-font-size-*`
- Accessible defaults: `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`, `outline-offset: 5px` on `:focus-visible`
- Motion-safe transitions gated behind `@media (--motionOK)`
- Form element resets (font inheritance, padding, border-radius)
- Table styling with computed inner radius
- Semantic max-width constraints (`--line-size-content-*`, `--line-size-header-*`)
- Uses `:where()` throughout for zero specificity — consumer styles always win

**`utilities.css`** — Semantic utility classes

| Class | Maps To | Notes |
|-------|---------|-------|
| `.line-is-background` | `var(--line-background)` | Background colour |
| `.line-is-subtle-background` | `var(--line-subtle-background)` | Subtle background |
| `.line-is-ui-background` | `var(--line-ui-background)` | With transition |
| `.line-is-hover-background` | `var(--line-ui-hover-background)` | Hover state |
| `.line-is-active-background` | `var(--line-ui-active-background)` | Active state |
| `.line-is-subtle-border` | `var(--line-subtle-border)` | Border + outline |
| `.line-is-ui-border` | `var(--line-ui-border)` | With transition |
| `.line-is-ui-hover` | `var(--line-ui-border-hover)` | Border hover |
| `.line-is-solid-background` | `var(--line-solid-background)` | With transition |
| `.line-is-hover-solid` | `var(--line-solid-hover)` | Solid hover |
| `.line-is-low-contrast` | `var(--line-low-contrast)` | Text colour |
| `.line-is-high-contrast` | `var(--line-high-contrast)` | Text colour |
| `.line-is-light` / `.line-is-dark` | `var(--line-light)` / `var(--line-dark)` | Text colour |
| `.line-is-white` / `.line-is-black` | `var(--line-white)` / `var(--line-black)` | Fixed colours |


**`media.css`** — Custom media queries

| Category | Queries |
|----------|---------|
| Motion | `--motionOK`, `--motionNotOK` |
| Transparency | `--opacityOK`, `--opacityNotOK` |
| Data saver | `--useDataOK`, `--useDataNotOK` |
| Colour scheme | `--OSdark`, `--OSlight` |
| Contrast | `--highContrast`, `--lowContrast` |
| Orientation | `--portrait`, `--landscape` |
| Display | `--HDcolor` (high dynamic range) |
| Pointer | `--touch`, `--stylus`, `--pointer`, `--mouse` |
| Breakpoints | `--xxs-only` through `--xxl-n-above` (7 breakpoints, each with `-only`, `-n-above`, `-n-below` variants, plus `-phone` portrait combos for mobile sizes) |

Breakpoint values: xxs=240px, xs=360px, sm=480px, md=768px, lg=1024px, xl=1440px, xxl=1920px.

**`mixins.css`** — PostCSS mixins

Two utility mixins for shorthand token access:

```css
@define-mixin font-size $size {
  font-size: var(--line-font-size-$(size));
}

@define-mixin font-weight $weight {
  font-weight: var(--line-font-weight-$(weight));
}
```

Usage: `@mixin font-size 3;` compiles to `font-size: var(--line-font-size-3);`.

### 9.10 Token Flow — Global to Component to Consumer

The design token system follows a three-tier cascade:

```
┌─────────────────────────────────────────────────────────────────┐
│  Tier 1: Global Tokens (theme package)                          │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐    │
│  │ Palette        │  │ Foundation     │  │ Semantic (root) │    │
│  │ --line-blue-9  │  │ --line-size-3  │  │ --line-background│   │
│  │ --line-gray-12 │  │ --line-shadow-2│  │ --line-solid-hover│  │
│  │                │  │ --line-font-*  │  │ --line-high-contrast│ │
│  └──────┬─────────┘  └──────┬─────────┘  └────────┬────────┘   │
│         │                   │                      │            │
│         ▼                   ▼                      ▼            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Schema: .line-schema-blue maps palette → semantic        │ │
│  └────────────────────────────────────────────────────────────┘ │
│         │                                                       │
│         ▼                                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Aliases: --line-primary-9 → --line-blue-9 (Phase 1)      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Tier 2: Component Tokens (inside :host)                        │
│                                                                 │
│  :host {                                                        │
│    --line-button-radius: var(--line-radius-2);                  │
│    --line-button-bg: var(--line-solid-background);              │
│    --line-button-color: var(--line-high-contrast);              │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Tier 3: Consumer Overrides                                     │
│                                                                 │
│  /* Override a component token */                               │
│  line-button {                                                  │
│    --line-button-radius: 1rem;                                  │
│  }                                                              │
│                                                                 │
│  /* Or bypass tokens entirely via ::part() */                   │
│  line-button::part(root) {                                      │
│    border-radius: 0;                                            │
│    background: linear-gradient(135deg, pink, purple);           │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Key principle:** Each tier can be overridden by the tier below it. Component tokens reference global tokens as defaults. Consumer overrides win over component defaults. `::part()` overrides win over everything.

**Current state:** Tier 1 is implemented (requires branding refactor). Tier 2 and Tier 3 are architectural patterns to be implemented when components are built in Phase 1. The pattern is validated by Lit's CSS custom property inheritance through shadow DOM.

### 9.11 CSS Cascade Strategy

**Decision: `@layer` is not needed.** The `:where()` strategy is sufficient for the theme package, and shadow DOM provides natural encapsulation for component styles.

**The `:where()` strategy in practice:**

- Palette tokens: `:where(html)` — zero specificity
- Schema tokens: `:where(.line-schema-*)` — zero specificity
- Utility classes: `:where(.line-is-*)` — zero specificity
- Normalize reset: `:where(element)` — zero specificity
- Dark mode overrides: `:is(.dark)` — normal specificity (higher than `:where()`)

**Why `@layer` is not needed:**

1. **Theme package:** `:where()` gives all token declarations zero specificity. Any consumer rule wins automatically. No layers needed.
2. **Component package:** Shadow DOM encapsulates component styles. CSS custom properties inherit through the boundary. Consumer overrides via `::part()` or custom properties operate at the document level, naturally winning over shadow DOM internals.
3. **No cross-boundary conflicts:** There is no scenario where theme styles, component base styles, and consumer styles compete in the same cascade context. Each has its own scope (document `:where()`, shadow DOM, document selectors).

### 9.12 Package Exports and Build Outputs

**Package metadata (target):**

```json
{
  "name": "@websublime/line-theme",
  "version": "0.8.0",
  "style": "dist/line.min.css",
  "exports": {
    ".":           "./dist/line.min.css",
    "./tokens":    "./dist/tokens.min.css",
    "./semantic":  "./dist/semantic.min.css",
    "./normalize": "./dist/normalize.min.css",
    "./utilities": "./dist/utilities.min.css",
    "./aliases":   "./dist/aliases.min.css",
    "./colors/*":  "./dist/colors/*.min.css",
    "./schemas/*": "./dist/schemas/*.min.css",
    "./themes/*":  "./dist/themes/*.min.css"
  }
}
```

**Build outputs (all minified via cssnano):**

| Output | Export Specifier | Content | Use Case |
|--------|-----------------|---------|----------|
| `dist/line.min.css` | `.` | Full bundle: all layers + all 28 themes | Quick start |
| `dist/tokens.min.css` | `./tokens` | L1: Foundation tokens (no colours) | Headless setup |
| `dist/semantic.min.css` | `./semantic` | L2: Gray prefers-color-scheme defaults | Foundation + reset |
| `dist/normalize.min.css` | `./normalize` | CSS reset | Document reset |
| `dist/utilities.min.css` | `./utilities` | Semantic utility classes | Utility classes |
| `dist/aliases.min.css` | `./aliases` | L3: 6 aliases × 9 intent tokens | Intent tokens |
| `dist/colors/{palette}.min.css` | `./colors/*` | Single palette (12 levels + contrast token) | Granular: palette |
| `dist/schemas/{palette}.min.css` | `./schemas/*` | Single schema (semantic mapping + utility classes) | Granular: schema |
| `dist/themes/{palette}.min.css` | `./themes/*` | Single theme (colour + schema combined) | Single-palette setup |

Demo swatch files (`custom/*-custom.css`) are **excluded** from all build outputs. They belong in Storybook.

**Minimal consumer setup (single theme):**

```css
@import '@websublime/line-theme/tokens';
@import '@websublime/line-theme/normalize';
@import '@websublime/line-theme/themes/blue';
@import '@websublime/line-theme/aliases';
```

### 9.13 Decisions Log

All design token questions have been resolved. This table documents the decisions for traceability.

| # | Question | Decision | Phase |
|---|----------|----------|-------|
| T1 | Namespace prefix for all tokens | **`--line-*` prefix on everything** — palette, semantic, foundation, component tokens, and CSS classes. Single convention, zero collision risk. | Phase 0 |
| T2 | CSS `@layer` strategy | **Not needed.** `:where()` handles theme specificity. Shadow DOM handles component encapsulation. No scenario where layers add value. | Closed |
| T3 | Foundation token ownership | **All foundation tokens defined explicitly** in `tokens/` directory (per-family CSS files + barrel `tokens.css`). No `postcss-jit-props` or `open-props` runtime dependencies. Open Props used as a design reference only. All ~413 tokens (~299 core + ~114 decorative) owned by the theme package. | Phase 0 |
| T4 | Custom theme contract for consumers | **Document the contract in Phase 1** (colour file + schema file + optional alias override). Generator CLI is nice-to-have post-1.0. | Phase 1 |
| T5 | Demo swatch files in production bundle | **Remove from all build outputs.** Demo classes (`custom/*.css`) migrate to Storybook. | Phase 0 |
| T6 | Semantic alias layer | **6 aliases × 9 intent tokens = 54 variables.** Aliases: primary (blue), danger (red), success (green), warning (amber), info (cyan), neutral (gray). Intent tokens per alias: base, hover, active, text, subtle, subtle-hover, outline, outline-hover, fg. Consumer can remap any alias. | Phase 1 |

### 9.14 Branding Refactor (Phase 0)

The existing codebase uses legacy naming that must be migrated to `line://ui` branding:

| What | Current (legacy) | Target |
|------|-------------------|--------|
| Theme package name | `@websublime/vitamina-theme` | `@websublime/line-theme` |
| Main CSS bundle | `vita.css` / `vita.min.css` | `line.css` / `line.min.css` |
| Palette variables | `--blue-9` (unprefixed) | `--line-blue-9` |
| Semantic variables | `--background` (unprefixed) | `--line-background` |
| Foundation tokens | `--size-3` (unprefixed) | `--line-size-3` |
| Schema classes | `.schema-blue` | `.line-schema-blue` |
| Utility classes | `.is-blue`, `.is-background` | `.line-is-blue`, `.line-is-background` |
| Core package name | `@websublime/vitamina-core` | `@websublime/line-core` |
| Base class | `ComponentElement` / `ComponentMixin` | `LineElement` |
| Tag prefix | `vita-` | `line-` |

This refactor is mechanical and can be automated with find-and-replace across the theme and core packages. It should be completed early in Phase 0 before any new feature work begins.

---



### 9.15 Contrast Token System

Each of the 28 colour palettes declares a `--line-{palette}-contrast` token that guarantees WCAG AA (≥4.5:1) contrast for text on level-9 solid backgrounds.

**The problem:** The 12-step palette scale distributes perceptual lightness across the range but does not guarantee that level-1 or level-12 achieves 4.5:1 against level-9. Testing revealed 19 of 28 palettes fail WCAG AA for normal text when using white (level-1) text on solid (level-9) backgrounds. See `docs/THEME-GAP-ANALYSIS.md` §A for full audit results.

**The solution:** A dedicated contrast token per palette, set to pure `#fff` or `#000`:

```css
/* colors/blue.css — light mode */
--line-blue-contrast: #000;

/* colors/violet.css — light mode */
--line-violet-contrast: #fff;
```

**Classification:**

| Contrast value | Palettes |
|---------------|----------|
| `#fff` (light mode) | indigo, plum, purple, violet (4 palettes) |
| `#000` (light mode) | All other 24 palettes |
| `#fff` (dark mode) | All 28 palettes |

**Semantic integration:** Each schema exposes `--line-solid-text: var(--line-{palette}-contrast)`. The alias layer maps this as `--line-{alias}-text`. Components and presets use `--line-primary-text` (or equivalent) for text on solid backgrounds.

### 9.16 Preset Package

A **preset** is a CSS-only package that provides out-of-the-box visual styles for line://ui components. It targets components from the outside using `::part()` selectors and host element selectors. It imports nothing from `line-core` — no JS, no component registration.

**Package:** `@websublime/line-presets` (single package distributing N presets: default, minimal, etc.)

**Architecture:**

```
@websublime/line-core              → Headless Web Components (behaviour + accessibility)
@websublime/line-theme             → L0–L3: design tokens + palettes + schemas + aliases
@websublime/line-presets           → L4–L5: component tokens + visual styles (multiple presets in one package)
```

**Component token convention:** Presets define tokens on the component host using the `--line-{component}-{prop}` naming:

```css
line-button {
  --line-button-height-sm: 2rem;
  --line-button-height-md: 2.5rem;
  --line-button-height-lg: 3rem;
  --line-button-radius: var(--line-radius-2);
  --line-button-padding-x: var(--line-size-4);
}
```

Consumers override these on the same selector for quick adjustments, or use `::part()` for total control.

**Preset scaffold enters in Phase 1** alongside the first component implementations. Component styles are written as component specs get approved.

**Future presets:** Different presets can offer fundamentally different aesthetics (minimal, soft, brutalist) — all consuming the same theme tokens.

Full implementation details in `docs/DESIGN-SYSTEM-IMPLEMENTATION-GUIDE.md` Phase 7.

## 10. Community & Governance

- **Bug reports and feature requests** via GitHub Issues.
- **Pull requests welcome** — must include or reference a component spec.
- **No Discord or community chat** at this stage.
- **RFC process:** New components require a spec in `.spec/` before implementation begins.
- **Code of conduct:** To be added.

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

### Brand Accent

Primary accent: `#c8ff00` (electric green). Adapts to `#6d8a00` in light mode contexts.
