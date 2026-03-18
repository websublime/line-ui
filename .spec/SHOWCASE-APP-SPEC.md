# SHOWCASE-APP-SPEC — line://ui Design System Showcase Application

**Status:** DRAFT
**Created:** 2026-03-18
**Last updated:** 2026-03-18

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
| Router | @lit-labs/router | Official Lit router, reactive controllers, URLPattern API, lightweight |
| Color science | culori | 8KB, typed, OKLCH support for palette generation |
| Theme | @websublime/line-theme | Consumed as package — validates exports |
| Build | Vite 7+ | Project standard |
| Fonts | JetBrains Mono (Google Fonts) | Monospace aesthetic from current showcase |

### 2.3 Dependency on Theme Package

The showcase imports the theme as a real consumer would:

```ts
import '@websublime/line-theme';              // Full bundle
import '@websublime/line-theme/tokens';       // Just foundation tokens
import '@websublime/line-theme/colors/blue';  // Individual palette
import '@websublime/line-theme/schemas/blue'; // Schema mapping
import '@websublime/line-theme/aliases';      // Semantic aliases
```

This validates that `package.json` exports resolve correctly.

### 2.4 Directory Structure

```
apps/showcase/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── app.ts                  # App shell + router setup
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
    │   ├── presets.ts          # /presets
    │   └── generator.ts        # /generator
    └── components/
        ├── sc-nav.ts           # Sidebar navigation
        ├── sc-token-card.ts    # Reusable token display card
        ├── sc-code-block.ts    # Code snippet + copy-to-clipboard
        ├── sc-color-picker.ts  # HSL/OKLCH color picker for generator
        ├── sc-swatch.ts        # Color swatch with hover info
        └── sc-section.ts       # Section wrapper with title/description
```

Component prefix: `sc-` (showcase) to avoid collision with `line-` components.

---

## 3. Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | home | Overview with summary cards linking to each section |
| `/tokens/colors` | colors | L0: 28 palettes × 12 levels, contrast tokens, color-mix demo |
| `/tokens/typography` | typography | 62 tokens: font families, sizes, weights, line-heights, letter-spacings |
| `/tokens/spacing` | spacing | 74 tokens: rem, px, fluid, breakpoints, content/header widths, ch-based |
| `/tokens/motion` | motion | 81 easings, 12 durations, 23 animations with live keyframe demos |
| `/tokens/surfaces` | surfaces | 24 shadows, 29 borders/radii, 3 opacity, 3 focus ring, 6 aspects |
| `/tokens/decorative` | decorative | 41 gradients/noise, 34 masks, 3 highlights, 3 SVG squircles, 4 layouts |
| `/semantic` | semantic | L2 semantic defaults (light/dark), L3 aliases, override demo |
| `/elements` | elements | Normalize/reset: all native HTML elements with applied tokens |
| `/presets` | presets | Pre-built theme previews (each palette as a complete theme) |
| `/generator` | generator | Palette generator: color picker → 12-level palette → theme preview → CSS export |

### 3.1 Router Configuration

```ts
import { Router } from '@lit-labs/router';

// In app shell
private router = new Router(this, [
  { path: '/',                   render: () => html`<sc-page-home></sc-page-home>` },
  { path: '/tokens/colors',      render: () => html`<sc-page-colors></sc-page-colors>` },
  { path: '/tokens/typography',  render: () => html`<sc-page-typography></sc-page-typography>` },
  { path: '/tokens/spacing',     render: () => html`<sc-page-spacing></sc-page-spacing>` },
  { path: '/tokens/motion',      render: () => html`<sc-page-motion></sc-page-motion>` },
  { path: '/tokens/surfaces',    render: () => html`<sc-page-surfaces></sc-page-surfaces>` },
  { path: '/tokens/decorative',  render: () => html`<sc-page-decorative></sc-page-decorative>` },
  { path: '/semantic',           render: () => html`<sc-page-semantic></sc-page-semantic>` },
  { path: '/elements',           render: () => html`<sc-page-elements></sc-page-elements>` },
  { path: '/presets',            render: () => html`<sc-page-presets></sc-page-presets>` },
  { path: '/generator',          render: () => html`<sc-page-generator></sc-page-generator>` },
]);
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
3. **All 28 palettes grid** — 14×2 mini swatches at level 9, click to switch active palette
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

### 4.10 Presets (`/presets`)

**Purpose:** Preview ready-to-go theme combinations.

**Content:**
1. **Preset cards** — one per palette (28 total), each showing:
   - Full UI mockup (card, buttons, input, text) themed with that palette's schema
   - Light and dark mode side-by-side
   - Import snippet: `import '@websublime/line-theme/themes/blue'`
2. **Preset comparison** — select 2-3 presets to compare side-by-side
3. **Usage code** — how to apply a preset in a real app

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

Sidebar navigation present on all pages:
- Logo/wordmark at top
- Route links grouped by category (Tokens, Semantic, Elements, Tools)
- Active route indicator
- Dark/light mode toggle
- Schema palette picker (compact)
- Collapsible on mobile (hamburger)

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

- Persists across routes (stored in `localStorage`)
- Toggles `html.dark` / `html.light` class
- Smooth transition on all themed elements

### 6.2 Schema Palette Picker

- Compact picker in the nav sidebar
- Changes `body.line-schema-{palette}`
- Persists across routes (`localStorage`)
- Affects all pages that use semantic tokens

### 6.3 Copy-to-Clipboard

Every token, code snippet, and generated CSS should be copyable with one click. Visual feedback (checkmark icon, brief toast) on copy.

### 6.4 Search (Future)

Global token search (cmd+k) — deferred to post-launch iteration. Architecture should accommodate it (token registry data structure).

---

## 7. Token Inventory Summary

| Category | Tokens | Route |
|----------|--------|-------|
| Color palettes | 364 (28×13) | /tokens/colors |
| Typography | 62 | /tokens/typography |
| Sizing & spacing | 74 | /tokens/spacing |
| Easing | 81 | /tokens/motion |
| Animations | 46 (23 tokens + 23 keyframes) | /tokens/motion |
| Durations | 12 | /tokens/motion |
| Gradients & noise | 41 | /tokens/decorative |
| Masks | 34 | /tokens/decorative |
| Borders & radii | 29 | /tokens/surfaces |
| Shadows | 24 | /tokens/surfaces |
| Z-index & layers | 14 | /tokens/surfaces |
| Aspect ratios | 6 | /tokens/surfaces |
| Focus ring | 3 | /tokens/surfaces |
| Opacity | 3 | /tokens/surfaces |
| Highlights | 3 | /tokens/decorative |
| SVG squircles | 3 | /tokens/decorative |
| Layouts | 4 | /tokens/decorative |
| Colors absolute | 2 | /tokens/colors |
| Semantic defaults | 14 | /semantic |
| Aliases | 54 | /semantic |
| **Total** | **~873** | |

---

## 8. Migration Plan

### 8.1 Current Showcase → New App

The previous `packages/theme/index.html` + `src/main.ts` + `src/style.css` showcase has been removed. The theme package is now a pure design system package. `apps/showcase/` is the sole showcase application. Branding and design patterns from the original showcase are preserved in this spec (§4, §5) and in the git history of `task/line-ui-zpy-7-showcase-page`.

### 8.2 Phased Implementation

**Phase A — Scaffold & Core:**
1. Create `apps/showcase/` with Vite + Lit + @lit-labs/router
2. App shell with `sc-nav` sidebar, route configuration, dark/light toggle, schema picker
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
12. Presets page

**Phase D — Generator:**
13. Palette generator with culori
14. Theme preview
15. CSS export

### 8.3 Shared Components

Build as needed during page implementation. `sc-token-card`, `sc-code-block`, and `sc-swatch` should be built in Phase B as they're used across all token pages.

---

## 9. Acceptance Criteria

1. All ~873 tokens are visible and interactive somewhere in the app
2. Dark/light mode toggle works globally across all routes
3. Schema palette switching works globally
4. Every token name is copyable to clipboard
5. Color-mix demo uses native CSS `color-mix(in oklch)`
6. All 23 animations have live demos
7. All 81 easing curves have animated previews
8. Native HTML elements page covers all elements affected by normalize.css
9. Palette generator produces valid 12-level OKLCH palettes
10. Generated palettes can be exported as CSS, downloaded as .css file
11. Generated palettes show WCAG AA contrast check
12. App consumes `@websublime/line-theme` via package imports (dogfooding)
13. Presets page shows all 28 theme presets with light/dark comparison
14. Routes load lazily (code splitting)
15. App runs on Vite dev server with HMR
