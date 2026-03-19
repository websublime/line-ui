# SHOWCASE-APP-SPEC — line://ui Design System Showcase Application

**Status:** APPROVED
**Created:** 2026-03-18
**Last updated:** 2026-03-19

---

## 1. Purpose

A Lit-based single-page application that serves as the interactive documentation, visual testing ground, and palette generator for the line://ui design system. It replaces the current static `packages/theme/index.html` showcase with a routed, categorized, and extensible application.

### 1.1 Goals

- **Comprehensive visualization** of all ~440 foundation tokens, 28 color palettes, 12 semantic roles, 54 alias variables, and native element resets
- **Dogfooding** — consumes `@websublime/line-theme` as a published package, validating exports
- **Palette generator** — users pick a base color and generate a full 12-level palette with live theme preview and CSS export
- **Extensible** — designed to accommodate component documentation when Phase 1+ components ship

### 1.2 Non-goals

- Component previews (deferred to Phase 1+)
- Storybook integration
- i18n
- Server-side rendering

---

## 2. Architecture

### 2.1 Location

```
apps/showcase/         # Separate app in monorepo (not inside packages/)
```

Rationale: apps vs packages separation is standard monorepo convention. The showcase is not a published library — it's a consumer of the design system, which makes it ideal dogfooding.

### 2.2 Tech Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Component framework | Lit 3+ | Project standard, dogfooding |
| Navigation | Panel-based (PanelKey) | Simpler than URL routing; single-page tool, not a multi-page site. State persisted in localStorage. See §10 Decision D2 |
| Color science | culori | 8KB, typed, OKLCH support for palette generation |
| Theme | @websublime/line-theme | Consumed as full bundle — validates exports |
| Build | Vite 7+ | Project standard |
| UI Font | Geist (Google Fonts) | Crisp sans-serif rendering across all browsers. See §10 Decision D3 |
| Code Font | IBM Plex Mono (Google Fonts) | Monospace for token names, code blocks, and code snippets only |

### 2.3 Dependency on Theme Package

The showcase imports the theme as a single full bundle:

```ts
import '@websublime/line-theme';  // Full bundle: all palettes, schemas, tokens, aliases, normalize
```

This validates that the full bundle export resolves correctly and includes all necessary CSS. Individual sub-path exports (`/tokens`, `/colors/*`, `/schemas/*`, `/aliases`) remain available for consumer apps that want tree-shaking.

### 2.4 Directory Structure

```
apps/showcase/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── app.ts                  # App shell + panel-based rendering
    ├── styles/
    │   └── showcase.css        # App-level styles (not distributed)
    ├── pages/
    │   ├── home.ts             # /
    │   ├── colors.ts           # /tokens/colors
    │   ├── typography.ts       # /tokens/typography
    │   ├── spacing.ts          # /tokens/spacing
    │   ├── motion.ts           # /tokens/motion
    │   ├── surfaces.ts         # /tokens/surfaces
    │   ├── decorative.ts       # /tokens/decorative
    │   ├── semantic.ts         # /semantic
    │   ├── elements.ts         # /elements
    │   ├── themes.ts           # /themes
    │   └── generator.ts        # /generator
    └── components/
        ├── sc-nav.ts           # Top bar navigation with inline pill nav + hamburger dropdown
        ├── sc-token-card.ts    # Reusable token display card
        ├── sc-code-block.ts    # Code snippet + copy-to-clipboard
        ├── sc-color-picker.ts  # HSL/OKLCH color picker for generator
        ├── sc-swatch.ts        # Color swatch with hover info
        └── sc-section.ts       # Section wrapper with title/description
```

Component prefix: `sc-` (showcase) to avoid collision with `line-` components.

---

## 3. Panels

Navigation is panel-based (not URL-routed). The app shell tracks the active panel via a `PanelKey` type and renders the corresponding page component via a switch statement. Panel state is persisted in `localStorage('line-panel')`. See §10 Decision D2.

| PanelKey | Page | Description |
|----------|------|-------------|
| `colors` | colors | L0: 28 palettes × 12 levels, contrast tokens, color-mix demo |
| `typography` | typography | 62 tokens: font families, sizes, weights, line-heights, letter-spacings |
| `spacing` | spacing | 74 tokens: rem, px, fluid, breakpoints, content/header widths, ch-based |
| `motion` | motion | 81 easings, 12 durations, 23 animations with live keyframe demos |
| `surfaces` | surfaces | 24 shadows, 29 borders/radii, 3 opacity, 3 focus ring, 6 aspects |
| `decorative` | decorative | 41 gradients/noise, 34 masks, 3 highlights, 3 SVG squircles, 4 layouts |
| `semantic` | semantic | L2 semantic defaults (light/dark), L3 aliases, override demo |
| `elements` | elements | Normalize/reset: all native HTML elements with applied tokens |
| `themes` | themes | Pre-built theme previews (each palette as color + schema bundle) |
| `generator` | generator | Palette generator: color picker → 12-level palette → theme preview → CSS export |

### 3.1 Panel Configuration

```ts
export type PanelKey =
  | 'colors' | 'typography' | 'spacing' | 'motion' | 'surfaces'
  | 'decorative' | 'semantic' | 'elements' | 'themes' | 'generator';

// In app shell — renders active panel via switch
private _renderPanel() {
  switch (this._panel) {
    case 'colors':     return html`<sc-page-colors></sc-page-colors>`;
    case 'typography': return html`<sc-page-typography></sc-page-typography>`;
    // ... etc
  }
}

// Navigation via custom events from sc-nav
@sc-navigate=${this._handleNavigate}   // detail: { panel: PanelKey }
@sc-schema-change=${this._handleSchemaChange}  // detail: { schema: string }
@sc-mode-change=${this._handleModeChange}      // detail: { light: boolean }
```

---

## 4. Page Specifications

### 4.1 Home (`/`)

**Purpose:** Landing page with overview and navigation cards.

**Content:**
- Hero: `line://ui` wordmark with accent `://`, tagline
- Summary stats: 440 tokens, 28 palettes, 336 color tokens, 54 aliases
- Navigation cards grid — one card per route with:
  - Category icon/color
  - Title + short description
  - Token count badge
  - Click navigates to route
- Dark/light mode toggle (persists across routes)
- Active schema picker (persists across routes)

### 4.2 Colors (`/tokens/colors`)

**Token count:** 28 palettes × 12 levels + 28 contrast = 364 color tokens

**Sections:**
1. **Active palette strip** — 12-step grid with hover inspection (token name, HSL value, semantic role)
2. **Contrast token demo** — solid-9 background with contrast text, WCAG ratio display
3. **All 28 palettes grid** — responsive `auto-fill minmax(80px, 1fr)` grid of mini swatches at level 9, click to switch active palette (deviates from original 14×2 fixed layout for better responsiveness across viewport sizes)
4. **Full palette explorer** — expandable view of all 12 levels for each palette
5. **Color-mix demo** — two palette selectors + range slider, 12-step blended strip using `color-mix(in oklch)`
6. **Copy-to-clipboard** — click any swatch to copy `var(--line-{palette}-{level})`

### 4.3 Typography (`/tokens/typography`)

**Token count:** 62 tokens

**Sections:**
1. **Font families** (19) — rendered sample text for each stack: system-ui, transitional, old-style, humanist, geometric-humanist, classical-humanist, neo-grotesque, monospace-slab-serif, monospace-code, industrial, rounded-sans, slab-serif, antique, didone, handwritten, sans, serif, mono
2. **Font sizes** (14) — static (size-0 through size-9) and fluid (fluid-0 through fluid-3) with rendered "Ag" samples and resolved px values
3. **Font weights** (9) — weight-1 through weight-9 with sample text at each weight
4. **Line heights** (10) — lineheight-0 through lineheight-9, paragraph samples showing vertical rhythm
5. **Letter spacing** (10) — letterspacing-0 through letterspacing-9, sample text with visible spacing differences

### 4.4 Spacing (`/tokens/spacing`)

**Token count:** 74 tokens

**Sections:**
1. **Rem sizes** (17) — size-000 through size-15, visual bars with rem and px values
2. **Px sizes** (17) — size-px-000 through size-px-15, identical visual with px denomination
3. **Fluid sizes** (10) — fluid-1 through fluid-10, resize container demo showing clamp behavior
4. **Content widths** (3) — content-1/2/3, nested container demo
5. **Header widths** (3) — header-1/2/3, header bar demo
6. **Breakpoints** (7) — xxs through xxl, responsive ruler with current viewport indicator
7. **Relative/ch sizes** (17) — relative-000 through relative-15, text-relative spacing demo

### 4.5 Motion (`/tokens/motion`)

**Token count:** 81 easings + 12 durations + 23 animations = 116 tokens

**Sections:**
1. **Easing curves** — organized by category:
   - Standard (5), Ease In (5), Ease Out (5), Ease In-Out (5)
   - Elastic Out (5), Elastic In (5), Elastic In-Out (5)
   - Step (5), Spring (5), Bounce (5)
   - Named mathematical: Circ, Cubic, Expo, Quad, Quart, Quint, Sine (21)
   - Each with animated ball demo (click to play/stop)
   - Cubic-bezier visualization where applicable
2. **Durations** (12) — practical (instant, quick-1/2, moderate-1/2, gentle-1/2) and semantic (xfast, fast, normal, slow, glacial) with timed bar animations
3. **Animations** (23) — live demos of all keyframe animations:
   - fade-in, fade-in-bloom, fade-out, fade-out-bloom
   - scale-up, scale-down
   - slide-out-up/down/right/left, slide-in-up/down/right/left
   - shake-x, shake-y, shake-z
   - spin, ping, blink, float, bounce, pulse
   - Click to replay, toggle infinite loop

### 4.6 Surfaces (`/tokens/surfaces`)

**Token count:** 29 borders + 24 shadows + 3 opacity + 3 focus + 6 aspects = 65 tokens

**Sections:**
1. **Border sizes** (5) — border-size-1 through 5, boxes with increasing border width
2. **Border radii** (29):
   - Standard (6): radius-1 through 6
   - Drawn (6): radius-drawn-1 through 6
   - Round (1): radius-round (pill shape)
   - Blob (5): radius-blob-1 through 5
   - Conditional (6): radius-conditional-1 through 6 (responsive radii)
3. **Shadows/elevation** (13):
   - Outer shadows (6): shadow-1 through 6, stacked cards
   - Inner shadows (5): inner-shadow-0 through 4
   - Control variables: shadow-color, shadow-strength
   - Dark mode comparison side-by-side
4. **Opacity** (3) — disabled, overlay, placeholder, with visual demo on solid backgrounds
5. **Focus ring** (3) — ring-width, ring-offset, ring-color, interactive focus demo
6. **Aspect ratios** (6) — square, landscape, portrait, widescreen, ultrawide, golden, with image placeholders

### 4.7 Decorative (`/tokens/decorative`)

**Token count:** 41 gradients + 34 masks + 3 highlights + 3 SVG + 4 layouts = 85 tokens

**Sections:**
1. **Gradients** (30) — gradient-1 through 30, applied to cards/strips with gradient-space control
2. **Noise textures** (5) — noise-1 through 5, overlaid on color backgrounds
3. **Noise filters** (5) — noise-filter-1 through 5, applied to images
4. **Masks** (34):
   - Edge scoop (6), edge scalloped (7), edge drip (6), edge zig-zag (6)
   - Corner-cut circles (3), corner-cut squares (3), corner-cut angles (3)
   - Each applied to a colored rectangle showing the mask effect
5. **Highlights** (3) — highlight-size, highlight-color, highlight composite, on interactive elements
6. **SVG squircles** (3) — squircle-1 through 3, as clip-path on boxes
7. **Layouts** (4) — grid-cell, grid-cell-name, grid-ram, grid-holy-grail, rendered as layout demos

### 4.8 Semantic (`/semantic`)

**Content (migrated from current showcase L2+L3 sections):**
1. **L2 Semantic defaults** — 12 semantic tokens, light/dark side-by-side panels
2. **Themed semantic strip** — active schema applied
3. **Component preview** — card with solid/outline/subtle buttons, input, checkbox
4. **L3 Aliases** — 6 alias cards with expandable 9-token anatomy
5. **Button variants** — solid/outline/subtle for each alias
6. **Schema vs Aliases explainer** — text explanation of independent layers
7. **Override demo** — interactive palette picker, CSS code preview, live button preview, reset button

### 4.9 Elements (`/elements`)

**Purpose:** Visualize how normalize.css + reset.css affect native HTML elements.

**Sections (organized by element category):**
1. **Typography** — h1-h6, p, blockquote, cite, pre, code, kbd, samp, mark, small, strong, em, abbr, ins, u, sup, sub
2. **Lists** — ul, ol, dl/dt/dd, menu, li
3. **Tables** — table, thead, tbody, tfoot, tr, th, td, caption
4. **Forms** — input (text, email, password, number, search, url, tel, date, time, color, range), textarea, select, button, fieldset, legend, label, progress, meter, output
5. **Interactive** — details/summary, dialog, a (various states)
6. **Media** — img, figure/figcaption, video, audio, svg, canvas, iframe
7. **Structural** — hr, blockquote, figure

Each element shown in a card with:
- Rendered element
- Token name(s) that affect it
- Before/after toggle (with/without normalize)

### 4.10 Themes (`/themes`)

**Purpose:** Preview the 28 ready-to-go theme bundles from `packages/theme/src/themes/`. Each theme is a color palette + schema bundle (e.g., `blue-theme.css` = `colors/blue.css` + `schemas/blue.css`).

> **Note:** This page showcases **themes** (L0 color + L2 schema), not **presets** (L4+L5 component styles from `@websublime/line-presets`). The presets package does not exist yet (Phase 1, Epic 2). When it ships, it may get its own route or app.

**Content:**
1. **Theme cards** — one per palette (28 total), each showing:
   - Full UI mockup (card, buttons, input, text) themed with that palette's schema
   - Light and dark mode side-by-side
   - Import snippet: `import '@websublime/line-theme/themes/blue'`
2. **Theme comparison** — select 2-3 themes to compare side-by-side
3. **Usage code** — how to apply a theme in a real app

### 4.11 Generator (`/generator`)

**Purpose:** Create custom palettes from a base color.

**Algorithm:** Using `culori` with OKLCH color space:
1. User picks a base color (native `<input type="color">` + HSL/OKLCH sliders)
2. Generate 12-level palette by interpolating lightness in OKLCH:
   - Levels 1-2: very light (background use)
   - Levels 3-5: light (UI element backgrounds)
   - Levels 6-8: mid (borders, interactive)
   - Level 9: the base color (solid backgrounds)
   - Level 10: slightly darker (hover state)
   - Levels 11-12: dark (text)
3. Auto-calculate contrast token (WCAG AA: ≥4.5:1 ratio against level 9)
4. Generate dark mode palette (inverted lightness scale)

**Sections:**
1. **Color picker** — base color input with HSL/OKLCH sliders
2. **Generated palette** — 12-level strip with live preview
3. **Contrast check** — automatic WCAG AA/AAA rating for text on level 9
4. **Theme preview** — full UI mockup (card, buttons, inputs) using the generated palette
5. **Dark mode preview** — same mockup with auto-generated dark palette
6. **Export options:**
   - Copy CSS custom properties to clipboard
   - Download as `.css` file
   - Download as JSON (for tooling integration)

---

## 5. Shared Components

### 5.1 `sc-nav`

Horizontal top bar navigation, sticky at the top of the viewport:

**Layout:** Logo left → inline pill nav (desktop) → controls right (schema chip, mode toggle, hamburger menu)

**Properties:**
- `panel: PanelKey` — active panel (highlights corresponding nav button)
- `schema: string` — active schema name (displayed in chip)
- `light: boolean` (reflect: true) — light mode flag; dark is default

**Desktop (≥769px):** Inline horizontal nav buttons with animated pill/underline indicator that slides to the active item. Hamburger menu button also visible.

**Mobile (<768px):** Inline nav hidden, hamburger menu visible.

**Hamburger dropdown:** Visible on all screen sizes. Opens a panel below the top bar with a 5-column grid of nav buttons, "Current: {panel}" footer, and "tap to navigate" hint. Closes on outside click.

**Events emitted:**
- `sc-navigate` — `detail: { panel: PanelKey }` — user selected a panel
- `sc-schema-change` — `detail: { schema: string }` — schema cycled
- `sc-mode-change` — `detail: { light: boolean }` — mode toggled

**Styling:**
- Dark: frosted glass `rgba(8, 8, 8, 0.92)` with `backdrop-filter: blur(12px)`
- Light: `rgba(250, 250, 250, 0.97)`
- Uses semantic tokens for all colors (`--line-high-contrast`, `--line-low-contrast`, `--line-ui-border`, etc.)
- Uses `:host([light])` selectors for light mode (cross-browser, no `:host-context()`)

### 5.2 `sc-token-card`

Reusable card for displaying a token:
- Token name (`--line-*`)
- Resolved value
- Visual preview (color swatch, size bar, shadow, etc.)
- Copy button (copies `var(--line-*)`)

### 5.3 `sc-code-block`

Code snippet display:
- Syntax-highlighted CSS
- Copy-to-clipboard button
- Optional line numbers
- Dark theme (always dark, regardless of page mode)

### 5.4 `sc-color-picker`

For the generator page:
- Native color input wrapper
- HSL sliders (hue, saturation, lightness)
- OKLCH display values
- Hex/HSL/OKLCH format toggle

### 5.5 `sc-swatch`

Color swatch element:
- Shows color as a box
- Hover: token name + resolved value tooltip
- Click: copy `var(--line-*)` to clipboard
- Configurable size (sm/md/lg)

### 5.6 `sc-section`

Page section wrapper:
- Title (h2/h3)
- Description text
- Optional token count badge
- Content slot

---

## 6. Global Features

### 6.1 Dark/Light Mode Toggle

- **Dark is the default.** The `light` boolean attribute toggles ON for light mode. See §10 Decision D4.
- Persists in `localStorage('line-mode')` as `'dark'` or `'light'`
- Toggles `html.dark` / `html.light` class on `document.documentElement`
- `color-scheme: dark` by default on `<html>`, `color-scheme: light` on `html.light`
- `<html class="dark">` set in `index.html` to prevent FOUC before JS hydrates
- Uses `:host([light])` CSS selectors in components (cross-browser; `:host-context()` is NOT supported in Firefox/Safari)
- Smooth transition via `--line-duration-moderate-1` and `--line-ease-2` tokens

### 6.2 Schema Palette Picker

- Compact **cycling chip button** in the top bar controls (not a dropdown). See §10 Decision D5.
- Shows a colored dot (using `--line-solid-background` accent) + current schema name
- Clicking cycles to the next schema in the 28-palette list
- Changes `body.line-schema-{palette}` class
- Persists in `localStorage('line-schema')`
- `<body class="line-schema-violet">` set in `index.html` to prevent FOUC
- Affects all pages that use semantic tokens

### 6.3 Copy-to-Clipboard

Every token, code snippet, and generated CSS should be copyable with one click. Visual feedback (checkmark icon, brief toast) on copy.

### 6.4 Search (Future)

Global token search (cmd+k) — deferred to post-launch iteration. Architecture should accommodate it (token registry data structure).

---

## 7. Token Inventory Summary

| Category | Tokens | Panel |
|----------|--------|-------|
| Color palettes | 364 (28×13) | colors |
| Typography | 62 | typography |
| Sizing & spacing | 74 | spacing |
| Easing | 81 | motion |
| Animations | 46 (23 tokens + 23 keyframes) | motion |
| Durations | 12 | motion |
| Gradients & noise | 41 | decorative |
| Masks | 34 | decorative |
| Borders & radii | 29 | surfaces |
| Shadows | 24 | surfaces |
| Z-index & layers | 14 | surfaces |
| Aspect ratios | 6 | surfaces |
| Focus ring | 3 | surfaces |
| Opacity | 3 | surfaces |
| Highlights | 3 | decorative |
| SVG squircles | 3 | decorative |
| Layouts | 4 | decorative |
| Colors absolute | 2 | colors |
| Semantic defaults | 14 | semantic |
| Aliases | 54 | semantic |
| **Total** | **~873** | |

---

## 8. Migration Plan

### 8.1 Current Showcase → New App

The previous `packages/theme/index.html` + `src/main.ts` + `src/style.css` showcase has been removed. The theme package is now a pure design system package. `apps/showcase/` is the sole showcase application. Branding and design patterns from the original showcase are preserved in this spec (§4, §5) and in the git history of `task/line-ui-zpy-7-showcase-page`.

### 8.2 Phased Implementation

**Phase A — Scaffold & Core:** ✅
1. ✅ Create `apps/showcase/` with Vite + Lit (panel-based, no router)
2. ✅ App shell with `sc-nav` top bar, panel rendering, dark/light toggle, schema cycling chip
3. Home page with navigation cards

**Phase B — Token Pages:**
4. Colors page (migrate from current L0 section + expand)
5. Typography page
6. Spacing page
7. Motion page (easings, durations, animations)
8. Surfaces page (shadows, borders, opacity, focus, aspects)
9. Decorative page (gradients, masks, highlights, SVG, layouts)

**Phase C — Semantic & Elements:**
10. Semantic page (migrate from current L2+L3 sections)
11. Elements page (native HTML element showcase)
12. Themes page

**Phase D — Generator:**
13. Palette generator with culori
14. Theme preview
15. CSS export

### 8.3 Shared Components

Build as needed during page implementation. `sc-token-card`, `sc-code-block`, and `sc-swatch` should be built in Phase B as they're used across all token pages.

---

## 9. Acceptance Criteria

1. All ~873 tokens are visible and interactive somewhere in the app
2. Dark/light mode toggle works globally across all panels
3. Schema palette cycling works globally
4. Every token name is copyable to clipboard
5. Color-mix demo uses native CSS `color-mix(in oklch)`
6. All 23 animations have live demos
7. All 81 easing curves have animated previews
8. Native HTML elements page covers all elements affected by normalize.css
9. Palette generator produces valid 12-level OKLCH palettes
10. Generated palettes can be exported as CSS, downloaded as .css file
11. Generated palettes show WCAG AA contrast check
12. App consumes `@websublime/line-theme` via package imports (dogfooding)
13. Themes page shows all 28 theme bundles (color + schema) with light/dark comparison
14. Panel switching is instant (all pages imported upfront; code splitting deferred)
15. App runs on Vite dev server with HMR

---

## 10. Decision Log

### D1 — Top bar navigation instead of sidebar (2026-03-19)

**Decision:** Replace the sidebar navigation with a horizontal top bar containing inline pill nav (desktop), hamburger dropdown (all sizes), and compact controls.

**Why:** Mobile-first design, more content space, cleaner layout. The sidebar consumed 260px of horizontal space and required a different mobile layout. The top bar is consistent across breakpoints.

**Supersedes:** Original spec §5.1 (sidebar navigation).

### D2 — Panel-based rendering instead of URL router (2026-03-19)

**Decision:** Remove `@lit-labs/router` dependency. Use a `PanelKey` union type and `switch` statement to render the active page component. Panel state persisted in `localStorage('line-panel')`.

**Why:** The showcase is a single-page tool, not a multi-page site. URL routing added complexity (URLPattern polyfills, shadow DOM click interception, route configuration) without clear benefit. Panel switching is simpler and instant.

**Supersedes:** Original spec §2.2 (router row), §3.1 (router configuration).

### D3 — Geist + IBM Plex Mono instead of JetBrains Mono (2026-03-19)

**Decision:** Use Geist (Vercel, sans-serif) for all UI text. Use IBM Plex Mono for token names, code blocks, and code snippets only.

**Why:** JetBrains Mono caused blurry/soft rendering in Firefox, especially at smaller sizes and with `-webkit-font-smoothing: antialiased`. Geist provides crisp sans-serif rendering across all browsers. Separating UI font (sans) from code font (mono) follows standard design system practice.

**Supersedes:** Original spec §2.2 (fonts row).

### D4 — Dark as default mode (2026-03-19)

**Decision:** Dark mode is the default. The `light` boolean property/attribute is toggled ON for light mode. Uses `:host([light])` CSS selectors.

**Why:** (1) `:host-context()` has no Firefox/Safari support — a Chrome-only feature. `:host([light])` is cross-browser. (2) Design system showcases look best in dark mode. (3) `<html class="dark">` + `<body class="line-schema-violet">` set in index.html prevents FOUC before JS hydrates.

**Supersedes:** Original spec §6.1 (toggle between html.dark/html.light).

### D5 — Schema cycling chip instead of dropdown picker (2026-03-19)

**Decision:** Schema selection is a compact chip button that cycles through all 28 schemas on click, showing a colored accent dot + schema name.

**Why:** Simpler UX than a dropdown/select. Fits the compact top bar layout. 28 schemas are quickly cycleable. The accent dot provides immediate visual feedback of the active schema's color.

**Supersedes:** Original spec §6.2 (compact picker in nav sidebar).

### D6 — Semantic tokens for all UI colors (2026-03-19)

**Decision:** All UI elements in the showcase use semantic tokens from schemas (`--line-high-contrast`, `--line-low-contrast`, `--line-background`, `--line-subtle-background`, `--line-ui-background`, `--line-ui-border`, `--line-subtle-border`, `--line-solid-background`). Raw palette stops (`--line-gray-N`) are NOT used for UI elements.

**Why:** The gray palette scale is non-inverted — `--line-gray-1` is always light (~93-99%) and `--line-gray-12` is always dark (~9-12%) in both modes. Using raw stops like `--line-gray-8` (21.7% in dark mode) for text on a dark background produces ~2:1 contrast ratio — unreadable. Semantic tokens are designed to provide correct contrast in both modes.

**Impact:** All pages and shared components must follow this rule. The showcase must be the exemplar of proper token usage.
