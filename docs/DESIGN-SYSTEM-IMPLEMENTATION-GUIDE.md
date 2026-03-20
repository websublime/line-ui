# DESIGN SYSTEM IMPLEMENTATION GUIDE

> **line://ui** · Design System Blueprint
>
> Version: 1.0.0 · Date: 2026-03-12
>
> This document is the step-by-step implementation guide to build the complete
> line://ui design system. For gap identification and diagnostics, see
> `THEME-GAP-ANALYSIS.md`.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Target File Structure](#2-target-file-structure)
3. [Phase 0 — Fix Critical Breakage](#3-phase-0--fix-critical-breakage)
4. [Phase 1 — Foundation Token Layer (L1)](#4-phase-1--foundation-token-layer-l1)
5. [Phase 2 — Semantic Defaults Layer (L2)](#5-phase-2--semantic-defaults-layer-l2)
6. [Phase 3 — Contrast Token System](#6-phase-3--contrast-token-system)
7. [Phase 4 — Semantic Aliases Layer (L3)](#7-phase-4--semantic-aliases-layer-l3)
8. [Phase 5 — Normalize & Utilities Cleanup](#8-phase-5--normalize--utilities-cleanup)
9. [Phase 6 — Build Pipeline & Exports](#9-phase-6--build-pipeline--exports)
10. [Phase 7 — Preset Package (L4 + L5)](#10-phase-7--preset-package-l4--l5)
11. [Phase 8 — Validation & Testing](#11-phase-8--validation--testing)
12. [Consumer Usage Patterns](#12-consumer-usage-patterns)
13. [Appendix A — Full Token Reference](#appendix-a--full-token-reference)
14. [Appendix B — Contrast Classification Map](#appendix-b--contrast-classification-map)
15. [Appendix C — Preset Component Token Reference](#appendix-c--preset-component-token-reference)

---

## 1. Architecture Overview

### Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│  L5 — Component Styles         (@websublime/line-preset-*)  │
│  Visual opinions: radius, padding, shadow per component     │
├─────────────────────────────────────────────────────────────┤
│  L4 — Component Tokens         (@websublime/line-preset-*)  │
│  Scoped: --line-button-radius, --line-input-height                  │
├─────────────────────────────────────────────────────────────┤
│  L3 — Semantic Aliases         (aliases.css)                │
│  Intent: --line-primary, --line-danger, --line-success       │
├─────────────────────────────────────────────────────────────┤
│  L2 — Semantic Roles           (semantic + schemas)           │
│  Context: --line-background, --line-solid-background         │
├─────────────────────────────────────────────────────────────┤
│  L1 — Foundation Tokens        (tokens.css)                 │
│  Scales: --line-font-*, --line-size-*, --line-radius-*       │
├─────────────────────────────────────────────────────────────┤
│  L0 — Primitives               (colors/*.css)               │
│  Raw values: --line-blue-1..12, --line-blue-contrast         │
├─────────────────────────────────────────────────────────────┤
│  Headless Components           (@websublime/line-core)       │
│  Behavior + Accessibility + Shadow DOM + ::part() surface    │
└─────────────────────────────────────────────────────────────┘
```

### Package Boundaries

| Package | Contains | Layers |
|---------|----------|--------|
| `@websublime/line-core` | Web Components (headless) + modular CSS resets | — |
| `@websublime/line-theme` | Design tokens + palettes + schemas + aliases | L0–L3 |
| `@websublime/line-presets` | Component tokens + visual styles | L4–L5 |

### Key Principle

Each layer is independently consumable. A consumer can stop at any layer:

- **Zero CSS** → headless, consumer styles everything
- **L1 only** → foundation tokens, consumer has own colors
- **L1 + L2** → foundation + gray semantic defaults
- **L1 + L0 + L2** → foundation + color palette + semantic mapping
- **L1–L3** → full theme with aliases
- **L1–L5** → full theme + preset (out-of-the-box look)

---

## 2. Target File Structure

### Current → Target mapping

```
packages/theme/src/
├── utils/
│   ├── rules.css            → SPLIT INTO tokens.css + semantic.css
│   ├── normalize.css        → KEEP (fix token references)
│   ├── general.css          → RENAME TO utilities.css (fix + wrap :where())
│   ├── mixins.css           → KEEP (fix token references)
│   └── media.css            → KEEP
├── colors/                  → KEEP (add --line-{palette}-contrast token)
│   ├── blue.css
│   └── ... (28 files)
├── schemas/                 → KEEP (update to use contrast token)
│   ├── blue.css
│   └── ... (28 files)
├── themes/                  → KEEP
│   ├── blue-theme.css
│   └── ... (28 files)
├── custom/                  → DELETE (demo files, not for production)
├── aliases.css              → NEW
├── tokens.css               → NEW (extracted from rules.css)
├── semantic.css             → NEW (extracted from rules.css)
└── line.css                 → REWRITE (new import order, no custom/*)
```

### Target dist/ output

```
packages/theme/dist/
├── tokens.min.css                ← L1: foundation only
├── semantic.min.css              ← L2: gray light-dark() defaults
├── normalize.min.css             ← Document reset
├── utilities.min.css             ← Utility classes
├── aliases.min.css               ← L3: primary/danger/success/warning/info
│
├── colors/
│   ├── blue.min.css              ← L0 per palette
│   └── ... (28 files)
│
├── schemas/
│   ├── blue.min.css              ← L2 per palette
│   └── ... (28 files)
│
├── themes/
│   ├── blue.min.css              ← L0 + L2 per palette
│   └── ... (28 files)
│
└── line.min.css                  ← Everything bundled
```

---

## 3. Phase 0 — Fix Critical Breakage

> **Goal:** Make the current CSS actually work. No architectural changes yet.

### Step 0.1 — Prefix all foundation tokens in `rules.css`

**File:** `src/utils/rules.css`

Every token defined under the `:where(html)` blocks (fonts, sizes, shadows)
must be prefixed with `--line-`.

**Mechanical transform — find → replace (in order):**

```
--font-sans          → --line-font-sans
--font-serif         → --line-font-serif
--font-mono          → --line-font-mono
--font-weight-       → --line-font-weight-
--font-lineheight-   → --line-font-lineheight-
--font-letterspacing-→ --line-font-letterspacing-
--font-size-         → --line-font-size-
--size-              → --line-size-
--shadow-color       → --line-shadow-color
--shadow-strength    → --line-shadow-strength
--shadow-            → --line-shadow-
--inner-shadow-      → --line-inner-shadow-
```

**Important:** Do the more specific patterns first (`--font-sans` before
`--font-`), and watch for self-references within shadow definitions.

**Example — before:**

```css
:where(html) {
  --font-sans: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;
  --size-1: 0.25rem;
  --shadow-color: 220 3% 15%;
  --shadow-1: 0 1px 2px -1px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 9%));
}
```

**Example — after:**

```css
:where(html) {
  --line-font-sans: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;
  --line-size-1: 0.25rem;
  --line-shadow-color: 220 3% 15%;
  --line-shadow-1: 0 1px 2px -1px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 9%));
}
```

### Step 0.2 — Prefix all references in normalize.css

**File:** `src/utils/normalize.css`

Apply the same prefix map to all `var()` calls:

```
var(--font-sans)           → var(--line-font-sans)
var(--font-lineheight-3)   → var(--line-font-lineheight-3)
var(--font-mono)           → var(--line-font-mono)
var(--font-size-0)         → var(--line-font-size-0)
var(--font-size-1)         → var(--line-font-size-1)
var(--font-size-2)         → var(--line-font-size-2)
var(--font-size-3)         → var(--line-font-size-3)
var(--font-size-4)         → var(--line-font-size-4)
var(--font-size-5)         → var(--line-font-size-5)
var(--font-size-6)         → var(--line-font-size-6)
var(--font-size-8)         → var(--line-font-size-8)
var(--font-weight-7)       → var(--line-font-weight-7)
var(--font-weight-9)       → var(--line-font-weight-9)
var(--font-lineheight-1)   → var(--line-font-lineheight-1)
var(--size-1)              → var(--line-size-1)
var(--size-2)              → var(--line-size-2)
var(--size-3)              → var(--line-size-3)
var(--size-4)              → var(--line-size-4)
var(--size-5)              → var(--line-size-5)
var(--size-8)              → var(--line-size-8)
var(--size-10)             → var(--line-size-10)
var(--size-content-1)      → var(--line-size-content-1)
var(--size-content-2)      → var(--line-size-content-2)
var(--size-content-3)      → var(--line-size-content-3)
var(--size-fluid-5)        → var(--line-size-fluid-5)
var(--size-header-1)       → var(--line-size-header-1)
var(--size-header-2)       → var(--line-size-header-2)
var(--size-header-3)       → var(--line-size-header-3)
var(--size-relative-4)     → var(--line-size-relative-4)
var(--shadow-6)            → var(--line-shadow-6)
var(--ease-2)              → var(--line-ease-default)          ← mapped to new scale
var(--radius-2)            → var(--line-radius-2)              ← mapped to new scale
var(--radius-3)            → var(--line-radius-3)              ← mapped to new scale
var(--border-size-1)       → var(--line-border-1)              ← mapped to new scale
var(--border-size-2)       → var(--line-border-2)              ← mapped to new scale
var(--border-size-3)       → var(--line-border-3)              ← mapped to new scale
var(--surface-4)           → var(--line-ui-hover-background)   ← mapped to semantic
var(--nice-inner-radius)   → var(--_nice-inner-radius)         ← local scope, no change needed
```

**Also update the `--nice-inner-radius` computed value:**

```css
/* BEFORE */
--nice-inner-radius: calc(var(--radius-3) - 2px);

/* AFTER */
--nice-inner-radius: calc(var(--line-radius-3) - 2px);
```

### Step 0.3 — Prefix references in mixins.css

**File:** `src/utils/mixins.css`

```css
/* BEFORE */
@define-mixin font-size $size {
  font-size: var(--font-size-$(size));
}

@define-mixin font-weight $weight {
  font-weight: var(--font-weight-$(weight));
}

/* AFTER */
@define-mixin font-size $size {
  font-size: var(--line-font-size-$(size));
}

@define-mixin font-weight $weight {
  font-weight: var(--line-font-weight-$(weight));
}
```

### Step 0.4 — Remove `custom/*` imports from `line.css`

**File:** `src/line.css`

Delete lines 34–61 (all `@import "./custom/*"` lines). These are demo
files that inflate the production bundle.

Optionally delete the entire `src/custom/` directory, or move it to a
`dev/` or `docs/` folder.

### Step 0.5 — Fix invalid CSS in `general.css`

**File:** `src/utils/general.css`

```css
/* BEFORE — invalid syntax */
transition: colors ease-in-out delay-150;

/* AFTER — valid */
transition-property: color, background-color, border-color;
transition-timing-function: var(--line-ease-default);
transition-duration: var(--line-duration-fast);
```

Apply this fix to every occurrence in `general.css` (there are 3).

Also remove the deprecated `::-moz-selection` block (lines 1–5). Keep
only `::selection`.

Also remove the `.carousel`, `.ripple`, `.shadown-current-color`,
`.tabular-numbers`, and `.line-is-tiny` rules — these are demo/experiment
code, not design system utilities.

---

## 4. Phase 1 — Foundation Token Layer (L1)

> **Goal:** Create `tokens/` directory — the color-free, opinion-free token layer.

### Step 1.1 — Create `src/tokens/` directory with per-family CSS files

The foundation token layer is split into per-family CSS files for independent
importability, with a barrel `tokens.css` that re-exports all families.

**Architecture:**

```
packages/theme/src/tokens/
  tokens.css            # Barrel — @imports all family files below
  typography.css        # Font families (19), weights (9), line-heights (10),
                        #   letter-spacings (10), font-sizes static (10) + fluid (4)
  sizing.css            # Rem (16), px (16), fluid (10), content (3),
                        #   header (3), breakpoints (7), relative (18)
  borders.css           # Border sizes (5), radii (6), drawn (6), round (1),
                        #   blob (5), conditional (6)
  shadows.css           # shadow-color, shadow-strength, shadow-1..6,
                        #   inner-shadow-0..4, inner-shadow-highlight + dark mode
  easing.css            # All 81 OP easing tokens (standard, in, out, in-out,
                        #   elastic, step, spring, bounce, named curves)
  zindex.css            # OP layers (6) + semantic z-index extensions (8)
  aspects.css           # All 6 OP aspect ratios (including golden)
  durations.css         # OP practical durations (7) + semantic extensions (5)
  opacity.css           # 3 semantic tokens (disabled, overlay, placeholder)
  focus.css             # 3 tokens (ring-width, ring-offset, ring-color)
  colors-absolute.css   # black, white + color-scheme declarations
```

**Token count:** ~302 unique CSS custom property declarations (plus 3 dark
mode shadow overrides). This is a full 1:1 Open Props match plus line://
extensions for semantics that Open Props does not provide.

**Key design decisions:**

- All custom properties use the `--line-` prefix
- All selectors use `:where(html)` for zero specificity
- Dark mode shadow overrides use `:where(html).dark` + `@media (prefers-color-scheme: dark)` (this is the **only exception** — all other tokens use `light-dark()` with `color-scheme` as the trigger)
- All values are hardcoded — no runtime `var()` dependency on Open Props
- Font families include all 19 OP stacks plus 3 custom aliases (sans/serif/mono)
- Line-heights extended from OP 7 to 10 tokens (added 2.25, 2.5, 3)
- Letter-spacings extended from OP 8 to 10 tokens (added 1.5em, 2em)
- Font-sizes renumbered: OP `--font-size-00..8` becomes `--line-font-size-0..9`
- Shadows inline the strength calc() instead of using OP's intermediate `--shadow-strength-N` variables
- Z-index uses semantic names (dropdown/sticky/fixed/overlay/modal/popover/toast/tooltip) alongside OP's generic layers
- Easing includes all 81 OP tokens (no reduction to 5 semantic aliases)
- Opacity placeholder value is 0.6 (distinct from disabled's 0.5)

Each family file can be imported independently via package.json exports
(configured in a separate task).

**Barrel file** (`src/tokens.css`):

```css
@import "./tokens/typography.css";
@import "./tokens/sizing.css";
@import "./tokens/borders.css";
@import "./tokens/shadows.css";
@import "./tokens/easing.css";
@import "./tokens/zindex.css";
@import "./tokens/aspects.css";
@import "./tokens/durations.css";
@import "./tokens/opacity.css";
@import "./tokens/focus.css";
@import "./tokens/colors-absolute.css";
```

**Token families summary:**

| File | Tokens | Source |
|------|--------|--------|
| `typography.css` | 61 | OP 19 families + 9 weights + 7 line-heights (+3 ext) + 8 letter-spacings (+2 ext) + 10 static sizes (renumbered) + 4 fluid |
| `sizing.css` | 74 | OP 16 rem + 16 px + 10 fluid + 3 content + 3 header + 7 breakpoint + 18 relative |
| `borders.css` | 29 | OP 5 border-sizes + 6 radii + 6 drawn + 1 round + 5 blob + 6 conditional |
| `shadows.css` | 17+3 | OP shadow-color, strength, highlight, shadow-1..6, inner-shadow-0..4 + 3 dark overrides |
| `easing.css` | 81 | OP all 81 (standard, in, out, in-out, elastic, step, spring, bounce, named) |
| `zindex.css` | 14 | OP 6 layers + 8 semantic extensions |
| `aspects.css` | 6 | OP all 6 (square, landscape, portrait, widescreen, ultrawide, golden) |
| `durations.css` | 12 | OP 7 practical + 5 semantic extensions |
| `opacity.css` | 3 | line:// only (disabled, overlay, placeholder) |
| `focus.css` | 3 | line:// only (ring-width, ring-offset, ring-color) |
| `colors-absolute.css` | 2+cs | line:// only (white, black, color-scheme) |
| **Total** | **~305** | |

### Step 1.2 — Delete the old `rules.css`

After extracting `tokens/` and `semantic.css` (next phase), delete
`src/utils/rules.css`. All its content will live in the new token files and
the semantic defaults layer.

---

## 5. Phase 2 — Semantic Defaults Layer (L2)

> **Goal:** Create `semantic.css` — gray-based default semantic roles.

### Step 2.1 — Create `src/semantic.css`

This file maps gray values to semantic role tokens using `light-dark()`.
It is independent from any palette. The active mode is determined by the
`color-scheme` property (set in `colors-absolute.css`).

```css
/* ═══════════════════════════════════════════════════════════
   semantic.css — line://ui Semantic Role Defaults (L2)

   Maps the neutral gray scale to semantic role tokens.
   Schemas (.line-schema-*) override these when active.
   Uses light-dark() with color-scheme as the single trigger.

   Requires: tokens.css (for --line-white, --line-black)
   ═══════════════════════════════════════════════════════════ */

:root {
  --line-background: light-dark(hsl(0, 0%, 99.0%), hsl(0, 0%, 9.5%));
  --line-subtle-background: light-dark(hsl(0, 0%, 97.5%), hsl(0, 0%, 10.5%));
  --line-ui-background: light-dark(hsl(0, 0%, 94.6%), hsl(0, 0%, 15.8%));
  --line-ui-hover-background: light-dark(hsl(0, 0%, 92.0%), hsl(0, 0%, 18.9%));
  --line-ui-active-background: light-dark(hsl(0, 0%, 89.5%), hsl(0, 0%, 21.7%));
  --line-subtle-border: light-dark(hsl(0, 0%, 86.8%), hsl(0, 0%, 24.7%));
  --line-ui-border: light-dark(hsl(0, 0%, 83.0%), hsl(0, 0%, 29.1%));
  --line-ui-border-hover: light-dark(hsl(0, 0%, 73.2%), hsl(0, 0%, 37.5%));
  --line-solid-background: light-dark(hsl(0, 0%, 55.2%), hsl(0, 0%, 43.0%));
  --line-solid-hover: light-dark(hsl(0, 0%, 50.3%), hsl(0, 0%, 50.7%));
  --line-low-contrast: light-dark(hsl(0, 0%, 39.3%), hsl(0, 0%, 69.5%));
  --line-high-contrast: light-dark(hsl(0, 0%, 12.5%), hsl(0, 0%, 93.5%));
  --line-solid-text: light-dark(#000, #fff);
  --line-light: var(--line-white);
  --line-dark: var(--line-black);
}
```

**Key additions vs current `rules.css`:**

- `--line-solid-text` — new token for text on solid backgrounds
- `--line-light` / `--line-dark` — now defined at root level (not only inside schemas)

---

## 6. Phase 3 — Contrast Token System

> **Goal:** Every palette declares its accessible contrast color. Every schema
> uses it.

### Step 3.1 — Add `--line-{palette}-contrast` to each color file

For each of the 28 color files in `src/colors/`, append a contrast token
at the end of the `:where(html)` light block AND the dark block.

**Classification:**

| Contrast value | Palettes (4) |
|---------------|--------------|
| `#fff` | indigo, plum, purple, violet |
| `#000` | All other 24 palettes |

**Example — `src/colors/blue.css`:**

```css
:where(html) {
  --line-blue-1: light-dark(hsl(206, 100%, 99.2%), hsl(205, 100%, 88.0%));
  /* ... all 12 levels use light-dark(lightVal, darkVal) ... */
  --line-blue-contrast: #000;              /* ← ADD: single value, not light-dark() */
}
```

All 12 palette levels use `light-dark()` to declare both mode values in a single block on `:where(html)`. The contrast token is a single static value (not wrapped in `light-dark()`) because it represents the WCAG-compliant text colour for the palette's level-9 solid background.

**Example — `src/colors/violet.css`:**

```css
:where(html) {
  --line-violet-1: light-dark(hsl(252, 100%, 99.0%), ...);
  /* ... */
  --line-violet-contrast: #fff;            /* ← white in both modes */
}
```

**Contrast token rule:** The contrast token is determined by the level-9 colour in each mode (this value is resolved at build time, not via `light-dark()`). In dark mode, level-9 becomes a much darker shade, so ALL palettes use `#fff` as their contrast color in dark mode. Only the light mode value differs across palettes (some use `#000`, some use `#fff`).

### Step 3.2 — Update all 28 schema files

In each schema file, update the `.line-is-{palette}` class and add the
`--line-solid-text` semantic token to the `.line-schema-{palette}` block.

**Example — `src/schemas/blue.css`:**

```css
/* ── Schema (add --line-solid-text) ── */

:where(.line-schema-blue) {
  --line-background: light-dark(var(--line-blue-1), var(--line-blue-12));
  /* ... all semantic roles use light-dark(lightLevel, darkLevel) ... */
  --line-solid-text: var(--line-blue-contrast);  /* ← ADD */
}

/* ── Utility: solid color class (fix contrast) ── */

:where(.line-is-blue) {
  color: var(--line-blue-contrast);
  background-color: light-dark(var(--line-blue-9), var(--line-blue-4));
  transition: all ease-in-out 150ms;

  &:hover {
    background-color: light-dark(var(--line-blue-10), var(--line-blue-3));
  }
}
```

Schema files use `light-dark()` to map semantic roles to palette levels in a single declaration block — no separate `:is(.dark)` override block is needed. The `light-dark()` function resolves based on the computed `color-scheme` property.

**Repeat for all 28 schema files.** The change is mechanical:

1. Replace `color: var(--line-{palette}-1)` → `color: var(--line-{palette}-contrast)` in `.line-is-{palette}`
2. Add `--line-solid-text: var(--line-{palette}-contrast)` to `.line-schema-{palette}`
3. Wrap light/dark level references in `light-dark()` (e.g., `light-dark(var(--line-blue-9), var(--line-blue-4))`)

**For the 5 palettes already using level-12 (amber, yellow, lime, mint, sky),**
the change is the same — `var(--line-{palette}-12)` → `var(--line-{palette}-contrast)`.
The contrast token resolves to `#000` which gives even better contrast than level-12.

---

## 7. Phase 4 — Semantic Aliases Layer (L3)

> **Goal:** Create `aliases.css` — intent-based tokens that components reference.

### Step 4.1 — Create `src/aliases.css`

```css
/* ═══════════════════════════════════════════════════════════
   aliases.css — line://ui Semantic Aliases (L3)

   Maps design intent (primary, danger, etc.) to palette tokens.
   Consumer overrides these to rebrand.

   Requires: at least one color palette + schema to be loaded.
   Default mapping: blue=primary, red=danger, green=success,
                    amber=warning, cyan=info, gray=neutral.
   ═══════════════════════════════════════════════════════════ */

:where(html) {
  /* ── Primary ── */
  --line-primary: var(--line-blue-9);
  --line-primary-hover: var(--line-blue-10);
  --line-primary-active: var(--line-blue-11);
  --line-primary-text: var(--line-blue-contrast);
  --line-primary-subtle: var(--line-blue-3);
  --line-primary-subtle-hover: var(--line-blue-4);
  --line-primary-outline: var(--line-blue-7);
  --line-primary-outline-hover: var(--line-blue-8);
  --line-primary-fg: var(--line-blue-11);

  /* ── Danger ── */
  --line-danger: var(--line-red-9);
  --line-danger-hover: var(--line-red-10);
  --line-danger-active: var(--line-red-11);
  --line-danger-text: var(--line-red-contrast);
  --line-danger-subtle: var(--line-red-3);
  --line-danger-subtle-hover: var(--line-red-4);
  --line-danger-outline: var(--line-red-7);
  --line-danger-outline-hover: var(--line-red-8);
  --line-danger-fg: var(--line-red-11);

  /* ── Success ── */
  --line-success: var(--line-green-9);
  --line-success-hover: var(--line-green-10);
  --line-success-active: var(--line-green-11);
  --line-success-text: var(--line-green-contrast);
  --line-success-subtle: var(--line-green-3);
  --line-success-subtle-hover: var(--line-green-4);
  --line-success-outline: var(--line-green-7);
  --line-success-outline-hover: var(--line-green-8);
  --line-success-fg: var(--line-green-11);

  /* ── Warning ── */
  --line-warning: var(--line-amber-9);
  --line-warning-hover: var(--line-amber-10);
  --line-warning-active: var(--line-amber-11);
  --line-warning-text: var(--line-amber-contrast);
  --line-warning-subtle: var(--line-amber-3);
  --line-warning-subtle-hover: var(--line-amber-4);
  --line-warning-outline: var(--line-amber-7);
  --line-warning-outline-hover: var(--line-amber-8);
  --line-warning-fg: var(--line-amber-11);

  /* ── Info ── */
  --line-info: var(--line-cyan-9);
  --line-info-hover: var(--line-cyan-10);
  --line-info-active: var(--line-cyan-11);
  --line-info-text: var(--line-cyan-contrast);
  --line-info-subtle: var(--line-cyan-3);
  --line-info-subtle-hover: var(--line-cyan-4);
  --line-info-outline: var(--line-cyan-7);
  --line-info-outline-hover: var(--line-cyan-8);
  --line-info-fg: var(--line-cyan-11);

  /* ── Neutral ── */
  --line-neutral: var(--line-gray-9);
  --line-neutral-hover: var(--line-gray-10);
  --line-neutral-active: var(--line-gray-11);
  --line-neutral-text: var(--line-gray-contrast);
  --line-neutral-subtle: var(--line-gray-3);
  --line-neutral-subtle-hover: var(--line-gray-4);
  --line-neutral-outline: var(--line-gray-7);
  --line-neutral-outline-hover: var(--line-gray-8);
  --line-neutral-fg: var(--line-gray-11);

}
```

**Alias anatomy (9 tokens per intent):**

| Token suffix | Maps to | Used for |
|-------------|---------|----------|
| (base) | level-9 | Solid background (buttons, badges) |
| `-hover` | level-10 | Hovered solid background |
| `-active` | level-11 | Active/pressed solid background |
| `-text` | contrast | Text on solid background |
| `-subtle` | level-3 | Subtle/ghost background |
| `-subtle-hover` | level-4 | Hovered subtle background |
| `-outline` | level-7 | Border/outline color |
| `-outline-hover` | level-8 | Hovered border |
| `-fg` | level-11 | Foreground text colored by intent |

**Consumer rebranding example:**

```css
/* Switch primary from blue to violet */
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

---

## 8. Phase 5 — Normalize & Utilities Cleanup

> **Goal:** Clean up remaining files to reference only `--line-` prefixed tokens.

### Step 5.1 — Fix `normalize.css`

All `var()` references should already be fixed in Phase 0 Step 0.2.
Verify no unprefixed `var(--` references remain:

```bash
grep -n 'var(--[^l]' src/utils/normalize.css
grep -n 'var(--l[^i]' src/utils/normalize.css
# Should return zero results (all should be var(--line-*))
```

### Step 5.2 — Rewrite `general.css` → `utilities.css`

Rename `src/utils/general.css` to `src/utils/utilities.css`.

Clean version:

```css
/* ═══════════════════════════════════════════════════════════
   utilities.css — line://ui Utility Classes

   Zero-specificity helpers for semantic role application.
   All wrapped in :where() to never win specificity battles.
   ═══════════════════════════════════════════════════════════ */

::selection {
  transition-property: color, background-color;
  transition-timing-function: var(--line-ease-default);
  transition-duration: var(--line-duration-fast);
  color: var(--line-low-contrast);
  background-color: var(--line-ui-active-background);
}

/* ── Background utilities ── */

:where(.line-is-background)         { background-color: var(--line-background); }
:where(.line-is-subtle-background)  { background-color: var(--line-subtle-background); }
:where(.line-is-active-background)  { background-color: var(--line-ui-active-background); }

:where(.line-is-ui-background) {
  background-color: var(--line-ui-background);
  transition-property: background-color;
  transition-timing-function: var(--line-ease-default);
  transition-duration: var(--line-duration-fast);
}

:where(.line-is-hover-background) {
  background-color: var(--line-ui-hover-background);
}

/* ── Solid background utilities ── */

:where(.line-is-solid-background) {
  background-color: var(--line-solid-background);
  transition-property: background-color;
  transition-timing-function: var(--line-ease-default);
  transition-duration: var(--line-duration-fast);
}

:where(.line-is-hover-solid) {
  background-color: var(--line-solid-hover);
}

/* ── Border utilities ── */

:where(.line-is-subtle-border) {
  border-color: var(--line-subtle-border);
  outline-color: var(--line-subtle-border);
}

:where(.line-is-ui-border) {
  border-color: var(--line-ui-border);
  outline-color: var(--line-ui-border);
  transition-property: border-color, outline-color;
  transition-timing-function: var(--line-ease-default);
  transition-duration: var(--line-duration-fast);
}

:where(.line-is-ui-hover) {
  border-color: var(--line-ui-border-hover);
  outline-color: var(--line-ui-border-hover);
}

/* ── Text utilities ── */

:where(.line-is-low-contrast)  { color: var(--line-low-contrast); }
:where(.line-is-high-contrast) { color: var(--line-high-contrast); }
:where(.line-is-light)         { color: var(--line-light); }
:where(.line-is-dark)          { color: var(--line-dark); }
:where(.line-is-white)         { color: var(--line-white); }
:where(.line-is-black)         { color: var(--line-black); }

/* ── Typographic utilities ── */

:where(.line-is-tabular-numbers) {
  font-variant-numeric: tabular-nums;
}
```

**Removed:** `.carousel`, `.ripple`, `.shadown-current-color`, `.line-is-tiny` —
these are demo code, not design system utilities.

### Step 5.3 — Update `line.css` import order

```css
/* ═══════════════════════════════════════════════════════════
   line.css — line://ui Complete Bundle
   ═══════════════════════════════════════════════════════════ */

/* L1 — Foundation */
@import "./tokens.css";

/* L2 — Semantic defaults (gray, light-dark()) */
@import "./semantic.css";

/* Normalize (document reset) */
@import "./utils/normalize.css";

/* Utilities */
@import "./utils/utilities.css";

/* L0 + L2 — All palettes (colors + schemas) */
@import "./themes/gray-theme.css";
@import "./themes/mauve-theme.css";
@import "./themes/slate-theme.css";
@import "./themes/sage-theme.css";
@import "./themes/olive-theme.css";
@import "./themes/sand-theme.css";
@import "./themes/tomato-theme.css";
@import "./themes/red-theme.css";
@import "./themes/crimson-theme.css";
@import "./themes/pink-theme.css";
@import "./themes/plum-theme.css";
@import "./themes/purple-theme.css";
@import "./themes/violet-theme.css";
@import "./themes/indigo-theme.css";
@import "./themes/blue-theme.css";
@import "./themes/cyan-theme.css";
@import "./themes/teal-theme.css";
@import "./themes/green-theme.css";
@import "./themes/grass-theme.css";
@import "./themes/brown-theme.css";
@import "./themes/bronze-theme.css";
@import "./themes/gold-theme.css";
@import "./themes/sky-theme.css";
@import "./themes/mint-theme.css";
@import "./themes/lime-theme.css";
@import "./themes/yellow-theme.css";
@import "./themes/amber-theme.css";
@import "./themes/orange-theme.css";

/* L3 — Aliases */
@import "./aliases.css";
```

---

## 9. Phase 6 — Build Pipeline & Exports

> **Goal:** Update PostCSS config, build script, and package.json exports.

### Step 6.1 — Update `postcss.config.mjs`

Remove the TODO comment. We are NOT activating `postcss-jit-props` because
we now define all tokens explicitly with `--line-` prefix. The Open Props
dependency can be removed from `devDependencies`.

```js
// No changes to the plugin list — jit-props is intentionally NOT used.
// All tokens are explicitly defined in tokens.css with --line-* prefix.
```

Optionally remove `open-props` and `postcss-jit-props` from `devDependencies`.

### Step 6.2 — Update build scripts in `package.json`

Add new scripts for the new entry points:

```json
{
  "scripts": {
    "build": "rm -rf dist && bun run typecheck && bun run src/build.ts",
    "typecheck": "tsc --noEmit",

    "css:all": "postcss src/line.css -o ./dist/line.min.css",
    "css:tokens": "postcss src/tokens.css -o ./dist/tokens.min.css",
    "css:semantic": "postcss src/semantic.css -o ./dist/semantic.min.css",
    "css:normalize": "postcss src/utils/normalize.css -o ./dist/normalize.min.css",
    "css:utilities": "postcss src/utils/utilities.css -o ./dist/utilities.min.css",
    "css:aliases": "postcss src/aliases.css -o ./dist/aliases.min.css",

    "css:colors:amber": "postcss src/colors/amber.css -o ./dist/colors/amber.min.css",
    "...": "... (keep existing 28 color scripts, update output paths to dist/colors/)",

    "css:schemas:amber": "postcss src/schemas/amber.css -o ./dist/schemas/amber.min.css",
    "...": "... (keep existing 28 schema scripts, update output paths to dist/schemas/)",

    "css:themes:amber": "postcss src/themes/amber-theme.css -o ./dist/themes/amber.min.css",
    "...": "... (keep existing 28 theme scripts, update output paths to dist/themes/)"
  }
}
```

**Output path changes:**

```
BEFORE                              AFTER
dist/colors-amber.min.css      →    dist/colors/amber.min.css
dist/schemas-amber.min.css     →    dist/schemas/amber.min.css
dist/theme-amber.min.css       →    dist/themes/amber.min.css
```

### Step 6.3 — Add `exports` field to `package.json`

```json
{
  "name": "@websublime/line-theme",
  "version": "0.7.0",
  "style": "dist/line.min.css",
  "exports": {
    ".": "./dist/line.min.css",
    "./tokens": "./dist/tokens.min.css",
    "./semantic": "./dist/semantic.min.css",
    "./normalize": "./dist/normalize.min.css",
    "./utilities": "./dist/utilities.min.css",
    "./aliases": "./dist/aliases.min.css",
    "./colors/*": "./dist/colors/*.min.css",
    "./schemas/*": "./dist/schemas/*.min.css",
    "./themes/*": "./dist/themes/*.min.css"
  },
  "files": [
    "dist/",
    "LICENSE.md",
    "README.md"
  ]
}
```

### Step 6.4 — Update `src/build.ts`

The build script already reads `css:*` scripts dynamically. No code change
needed — it will pick up the new scripts automatically. Just verify it
handles subdirectories in `dist/` (create `dist/colors/`, `dist/schemas/`,
`dist/themes/` before running).

Add a pre-build step to ensure output directories exist:

```ts
// Add at the top of the build script, after the imports
import { mkdirSync } from 'node:fs';

for (const dir of ['dist/colors', 'dist/schemas', 'dist/themes']) {
  mkdirSync(join(import.meta.dirname, '..', dir), { recursive: true });
}
```

---

## 10. Phase 7 — Preset Package (L4 + L5)

> **Goal:** Create `@websublime/line-presets` — the out-of-the-box look.

### Step 7.1 — Scaffold the package

```bash
# From monorepo root
mkdir -p packages/presets/src
mkdir -p packages/presets/dist
```

### Step 7.2 — Create `packages/presets/package.json`

```json
{
  "name": "@websublime/line-presets",
  "version": "0.1.0",
  "description": "Default visual preset for line://ui components",
  "type": "module",
  "style": "dist/preset.min.css",
  "exports": {
    ".": "./dist/preset.min.css",
    "./*": "./dist/*.min.css"
  },
  "peerDependencies": {
    "@websublime/line-theme": ">=0.7.0"
  },
  "scripts": {
    "build": "postcss src/index.css -o dist/preset.min.css"
  },
  "files": [
    "dist/",
    "LICENSE.md",
    "README.md"
  ],
  "author": {
    "email": "hello@miguelramos.dev",
    "name": "miguelramos",
    "url": "https://github.com/miguelramos"
  },
  "license": "ISC"
}
```

### Step 7.3 — Create `postcss.config.mjs`

```js
import cssNano from 'cssnano';
import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';

export default {
  plugins: [
    postcssImport(),
    postcssNested(),
    cssNano({ preset: 'default' })
  ]
};
```

### Step 7.4 — Create component style files

Each file follows the same pattern: component tokens (L4) → base styles (L5)
→ variants → sizes → states → focus ring.

**`src/index.css`:**

```css
/* line://ui Preset Default */
@import "./button.css";
@import "./input.css";
@import "./textarea.css";
@import "./checkbox.css";
@import "./radio.css";
@import "./switch.css";
@import "./select.css";
@import "./badge.css";
@import "./card.css";
@import "./dialog.css";
@import "./tooltip.css";
@import "./avatar.css";
/* ... add as components get implemented ... */
```

**`src/button.css` — full reference implementation:**

```css
/* ═══════════════════════════════════════════════════════════
   button.css — line-button preset styles

   Targets: <line-button> host + ::part(root)
   Depends: @websublime/line-theme tokens + aliases
   ═══════════════════════════════════════════════════════════ */

/* ── L4: Component Tokens ── */

line-button {
  /* Heights */
  --line-button-h-xs: 1.5rem;
  --line-button-h-sm: 2rem;
  --line-button-h-md: 2.5rem;
  --line-button-h-lg: 3rem;
  --line-button-h-xl: 3.5rem;

  /* Spacing */
  --line-button-px-xs: var(--line-size-2);
  --line-button-px-sm: var(--line-size-3);
  --line-button-px-md: var(--line-size-4);
  --line-button-px-lg: var(--line-size-5);
  --line-button-px-xl: var(--line-size-6);

  /* Typography */
  --line-button-font-size: var(--line-font-size-2);
  --line-button-font-weight: var(--line-font-weight-5);
  --line-button-line-height: 1;

  /* Shape */
  --line-button-radius: var(--line-radius-2);
  --line-button-border-width: var(--line-border-1);

  /* Motion */
  --line-button-transition: var(--line-duration-fast) var(--line-ease-default);
}

/* ── L5: Base Styles ── */

line-button::part(root) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--line-size-2);
  height: var(--line-button-h-md);
  padding-inline: var(--line-button-px-md);
  border-radius: var(--line-button-radius);
  border: var(--line-button-border-width) solid transparent;
  font-family: inherit;
  font-size: var(--line-button-font-size);
  font-weight: var(--line-button-font-weight);
  line-height: var(--line-button-line-height);
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition: color var(--line-button-transition),
              background-color var(--line-button-transition),
              border-color var(--line-button-transition),
              box-shadow var(--line-button-transition);
}

/* ── Variant: solid (default) ── */

line-button[data-variant="solid"]::part(root),
line-button:not([data-variant])::part(root) {
  background-color: var(--line-primary);
  color: var(--line-primary-text);
}
line-button[data-variant="solid"]:hover::part(root),
line-button:not([data-variant]):hover::part(root) {
  background-color: var(--line-primary-hover);
}
line-button[data-variant="solid"]:active::part(root),
line-button:not([data-variant]):active::part(root) {
  background-color: var(--line-primary-active);
}

/* ── Variant: outline ── */

line-button[data-variant="outline"]::part(root) {
  background-color: transparent;
  color: var(--line-primary-fg);
  border-color: var(--line-primary-outline);
}
line-button[data-variant="outline"]:hover::part(root) {
  background-color: var(--line-primary-subtle);
  border-color: var(--line-primary-outline-hover);
}
line-button[data-variant="outline"]:active::part(root) {
  background-color: var(--line-primary-subtle-hover);
}

/* ── Variant: ghost ── */

line-button[data-variant="ghost"]::part(root) {
  background-color: transparent;
  color: var(--line-primary-fg);
  border-color: transparent;
}
line-button[data-variant="ghost"]:hover::part(root) {
  background-color: var(--line-primary-subtle);
}
line-button[data-variant="ghost"]:active::part(root) {
  background-color: var(--line-primary-subtle-hover);
}

/* ── Variant: subtle ── */

line-button[data-variant="subtle"]::part(root) {
  background-color: var(--line-primary-subtle);
  color: var(--line-primary-fg);
  border-color: transparent;
}
line-button[data-variant="subtle"]:hover::part(root) {
  background-color: var(--line-primary-subtle-hover);
}

/* ── Variant: link ── */

line-button[data-variant="link"]::part(root) {
  background-color: transparent;
  color: var(--line-primary-fg);
  border-color: transparent;
  height: auto;
  padding-inline: 0;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
line-button[data-variant="link"]:hover::part(root) {
  color: var(--line-primary-active);
}

/* ── Intent: danger ── */

line-button[data-intent="danger"][data-variant="solid"]::part(root),
line-button[data-intent="danger"]:not([data-variant])::part(root) {
  background-color: var(--line-danger);
  color: var(--line-danger-text);
}
line-button[data-intent="danger"][data-variant="solid"]:hover::part(root),
line-button[data-intent="danger"]:not([data-variant]):hover::part(root) {
  background-color: var(--line-danger-hover);
}
line-button[data-intent="danger"][data-variant="outline"]::part(root) {
  color: var(--line-danger-fg);
  border-color: var(--line-danger-outline);
}
line-button[data-intent="danger"][data-variant="outline"]:hover::part(root) {
  background-color: var(--line-danger-subtle);
}
line-button[data-intent="danger"][data-variant="ghost"]::part(root) {
  color: var(--line-danger-fg);
}
line-button[data-intent="danger"][data-variant="ghost"]:hover::part(root) {
  background-color: var(--line-danger-subtle);
}

/* ── Sizes ── */

line-button[data-size="xs"]::part(root) {
  height: var(--line-button-h-xs);
  padding-inline: var(--line-button-px-xs);
  font-size: var(--line-font-size-0);
}
line-button[data-size="sm"]::part(root) {
  height: var(--line-button-h-sm);
  padding-inline: var(--line-button-px-sm);
  font-size: var(--line-font-size-1);
}
line-button[data-size="lg"]::part(root) {
  height: var(--line-button-h-lg);
  padding-inline: var(--line-button-px-lg);
  font-size: var(--line-font-size-3);
}
line-button[data-size="xl"]::part(root) {
  height: var(--line-button-h-xl);
  padding-inline: var(--line-button-px-xl);
  font-size: var(--line-font-size-4);
}

/* ── Width: full ── */

line-button[data-full-width]::part(root) {
  width: 100%;
}

/* ── States ── */

line-button[data-disabled]::part(root) {
  opacity: var(--line-opacity-disabled);
  cursor: not-allowed;
  pointer-events: none;
}

line-button[data-loading]::part(root) {
  opacity: var(--line-opacity-disabled);
  cursor: wait;
  pointer-events: none;
}

/* ── Focus Ring ── */

line-button:focus-visible::part(root) {
  outline: var(--line-ring-width) solid var(--line-ring-color);
  outline-offset: var(--line-ring-offset);
}
```

**`src/input.css` — reference:**

```css
/* ── L4: Component Tokens ── */

line-input {
  --line-input-h-sm: 2rem;
  --line-input-h-md: 2.5rem;
  --line-input-h-lg: 3rem;
  --line-input-px: var(--line-size-3);
  --line-input-radius: var(--line-radius-2);
  --line-input-border-width: var(--line-border-1);
  --line-input-font-size: var(--line-font-size-2);
  --line-input-transition: var(--line-duration-fast) var(--line-ease-default);
}

/* ── Base ── */

line-input::part(input) {
  height: var(--line-input-h-md);
  padding-inline: var(--line-input-px);
  border-radius: var(--line-input-radius);
  border: var(--line-input-border-width) solid var(--line-ui-border);
  background-color: var(--line-background);
  color: var(--line-high-contrast);
  font-family: inherit;
  font-size: var(--line-input-font-size);
  transition: border-color var(--line-input-transition),
              box-shadow var(--line-input-transition);
}

/* ── Variant: outline (default) ── */

line-input::part(input):hover,
line-input[data-hovered]::part(input) {
  border-color: var(--line-ui-border-hover);
}

line-input:focus-within::part(input),
line-input[data-focused]::part(input) {
  border-color: var(--line-primary);
  outline: var(--line-ring-width) solid var(--line-primary);
  outline-offset: -1px;
}

/* ── Variant: filled ── */

line-input[data-variant="filled"]::part(input) {
  background-color: var(--line-ui-background);
  border-color: transparent;
}
line-input[data-variant="filled"]:focus-within::part(input) {
  background-color: var(--line-background);
  border-color: var(--line-primary);
}

/* ── States ── */

line-input[data-disabled]::part(input) {
  opacity: var(--line-opacity-disabled);
  cursor: not-allowed;
}

line-input[data-invalid]::part(input) {
  border-color: var(--line-danger);
}
line-input[data-invalid]:focus-within::part(input) {
  outline-color: var(--line-danger);
}

/* ── Placeholder ── */

line-input::part(input)::placeholder {
  color: var(--line-low-contrast);
  opacity: var(--line-opacity-placeholder);
}

/* ── Sizes ── */

line-input[data-size="sm"]::part(input) {
  height: var(--line-input-h-sm);
  font-size: var(--line-font-size-1);
}
line-input[data-size="lg"]::part(input) {
  height: var(--line-input-h-lg);
  font-size: var(--line-font-size-3);
}
```

### Step 7.5 — More component presets

Follow the same pattern for each component. Here are the key tokens
and parts for the most common components:

| Component | Host element | Key `::part()` | Key tokens |
|-----------|-------------|----------------|------------|
| `line-button` | `line-button` | `root` | height, padding, radius, font |
| `line-input` | `line-input` | `input`, `root` | height, padding, radius, border |
| `line-textarea` | `line-textarea` | `textarea` | padding, radius, min-height |
| `line-checkbox` | `line-checkbox` | `control`, `indicator` | size, radius, border |
| `line-radio` | `line-radio` | `control`, `indicator` | size, border |
| `line-switch` | `line-switch` | `track`, `thumb` | width, height, radius |
| `line-select` | `line-select` | `trigger`, `content` | height, padding, radius |
| `line-badge` | `line-badge` | `root` | height, padding, radius, font |
| `line-card` | `line-card` | `root` | padding, radius, shadow |
| `line-dialog` | `line-dialog` | `overlay`, `content` | max-width, radius, shadow, padding |
| `line-tooltip` | `line-tooltip` | `content` | padding, radius, shadow, font-size |
| `line-avatar` | `line-avatar` | `root`, `image`, `fallback` | size, radius |
| `line-separator` | `line-separator` | `root` | color, width |
| `line-skeleton` | `line-skeleton` | `root` | radius, animation |
| `line-alert` | `line-alert` | `root` | padding, radius, border-width |
| `line-toast` | `line-toast` | `root` | padding, radius, shadow |

**Preset files should be created as component specs get approved** — each
spec defines the `part` names and data attributes that the preset targets.

---

## 11. Phase 8 — Validation & Testing

> **Goal:** Verify the design system works end-to-end.

### Step 8.1 — Token resolution check

Create a test HTML page that displays all token values:

```html
<html class="line-schema-blue">
<head>
  <link rel="stylesheet" href="@websublime/line-theme">
</head>
<body>
  <!-- Verify each layer resolves -->
  <div style="background: var(--line-background); color: var(--line-high-contrast)">
    L2: Semantic roles ✓
  </div>
  <div style="background: var(--line-primary); color: var(--line-primary-text)">
    L3: Aliases ✓
  </div>
  <div style="font-size: var(--line-font-size-4); padding: var(--line-size-3)">
    L1: Foundation tokens ✓
  </div>
</body>
</html>
```

### Step 8.2 — Contrast regression test

Script that reads all color files and validates `--line-{palette}-contrast`
yields ≥ 4.5:1 against the level-9 background. Run as part of CI.

### Step 8.3 — Build output validation

```bash
# Verify all expected files exist
ls dist/tokens.min.css
ls dist/semantic.min.css
ls dist/normalize.min.css
ls dist/utilities.min.css
ls dist/aliases.min.css
ls dist/colors/blue.min.css    # 28 files
ls dist/schemas/blue.min.css   # 28 files
ls dist/themes/blue.min.css    # 28 files
ls dist/line.min.css

# Verify no unprefixed tokens leaked
grep -r 'var(--font-' dist/ | grep -v 'var(--line-font-'
grep -r 'var(--size-' dist/ | grep -v 'var(--line-size-'
grep -r 'var(--shadow-' dist/ | grep -v 'var(--line-shadow-'
# Should all return zero results
```

### Step 8.4 — Granular import test

```css
/* Test: tokens only — should resolve all foundation values */
@import '@websublime/line-theme/tokens';

/* Test: tokens + single palette — should resolve colors + semantic */
@import '@websublime/line-theme/tokens';
@import '@websublime/line-theme/themes/blue';

/* Test: full + preset — should style components */
@import '@websublime/line-theme';
@import '@websublime/line-presets';
```

---

## 12. Consumer Usage Patterns

### Pattern A — Headless (zero CSS from theme)

```html
<link rel="stylesheet" href="my-styles.css">
<line-button>Click me</line-button>
```

Consumer writes all CSS targeting `::part()`. No theme imported.

### Pattern B — Tokens only (own design system)

```css
@import '@websublime/line-theme/tokens';
/* Consumer has their own colors and semantic roles */
```

Gets: spacing, typography, shadows, motion, radius, z-index.
Does NOT get: any colors, any semantic roles, any opinions.

### Pattern C — Single palette

```css
@import '@websublime/line-theme/tokens';
@import '@websublime/line-theme/normalize';
@import '@websublime/line-theme/themes/blue';
@import '@websublime/line-theme/aliases';
```

Gets: foundation + blue palette + semantic roles + aliases.
Consumer styles components themselves or adds preset.

### Pattern D — Full theme (quick start)

```css
@import '@websublime/line-theme';
```

Gets: everything (all 28 palettes, semantic defaults, aliases, normalize).

### Pattern E — Full theme + preset (out-of-the-box)

```css
@import '@websublime/line-theme';
@import '@websublime/line-presets';
```

Gets: everything + components look good immediately.
This is the "install and go" experience.

### Pattern F — Custom brand on preset

```css
@import '@websublime/line-theme';
@import '@websublime/line-presets';

/* Rebrand: violet instead of blue */
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

/* Override specific component tokens */
line-button {
  --line-button-radius: var(--line-radius-round);
}
```

---

## Appendix A — Full Token Reference

### Foundation Tokens (L1) — `tokens/` directory

Architecture: `packages/theme/src/tokens/` contains per-family CSS files with a barrel `tokens.css` that `@import`s all families. Each family is independently importable.

#### Core families (implemented — E8 T1)

| Family file | Categories | Count |
|-------------|-----------|-------|
| `typography.css` | 15 OP families + 3 custom stacks + 9 weights + 10 line-heights + 10 letter-spacings + 10 static sizes + 4 fluid sizes | 61 |
| `sizing.css` | 17 rem + 17 px + 10 fluid + 3 content + 3 header + 7 breakpoints + 17 relative | 74 |
| `borders.css` | 5 border-sizes + 6 radii + 6 drawn + 1 round + 5 blob + 6 conditional | 29 |
| `shadows.css` | shadow-color + shadow-strength + highlight + 6 outer + 5 inner (+ 3 dark overrides) | 14 |
| `easing.css` | 5 standard + 5 in + 5 out + 5 in-out + 15 elastic + 5 step + 10 aliases + 5 spring + 5 bounce + 21 named | 81 |
| `zindex.css` | 6 OP layers + 8 semantic extensions | 14 |
| `aspects.css` | 6 OP aspect ratios | 6 |
| `durations.css` | 7 OP practical + 5 semantic extensions | 12 |
| `opacity.css` | 3 semantic tokens (line:// extension) | 3 |
| `focus.css` | 3 focus-ring tokens (line:// extension) | 3 |
| `colors-absolute.css` | 2 absolute colors + color-scheme declarations | 2 |
| **Core subtotal** | | **~299** |

#### Decorative families (planned — E8 T10-T14)

| Family file | Source | Count |
|-------------|--------|-------|
| `animations.css` | props.animations.css — 23 tokens + 23 @keyframes | 23 |
| `gradients.css` | props.gradients.css — 30 gradients + space + 5 noise + 5 filters | 41 |
| `masks.css` | props.masks.edges.css + props.masks.corner-cuts.css | 34 |
| `layouts.css` | props.layouts.css — ~4 public tokens (internal mixin vars excluded) | 4 |
| `highlights.css` | props.highlights.css | 3 |
| `svg.css` | props.svg.css — 3 squircle tokens | 3 |
| **Decorative subtotal** | | **~108** |

| **Grand total** | | **~407** |

### Semantic Roles (L2) — per schema

| Token | Palette level | Purpose |
|-------|-------------|---------|
| `--line-background` | 1 | App background |
| `--line-subtle-background` | 2 | Subtle background |
| `--line-ui-background` | 3 | UI element background |
| `--line-ui-hover-background` | 4 | Hovered UI |
| `--line-ui-active-background` | 5 | Active UI |
| `--line-subtle-border` | 6 | Subtle borders |
| `--line-ui-border` | 7 | UI borders |
| `--line-ui-border-hover` | 8 | Hovered borders |
| `--line-solid-background` | 9 | Solid backgrounds |
| `--line-solid-hover` | 10 | Hovered solid |
| `--line-low-contrast` | 11 | Low-contrast text |
| `--line-high-contrast` | 12 | High-contrast text |
| `--line-light` | 1 | Light text |
| `--line-white` | 1 | White override |
| `--line-black` | 12 | Black override |
| `--line-dark` | 12 | Dark text |
| `--line-solid-text` | contrast | Text on solid bg |

### Semantic Aliases (L3) — per intent × 9 tokens

6 intents × 9 tokens = **54 tokens**

---

## Appendix B — Contrast Classification Map

### Light Mode

| `#fff` text (4 palettes) | `#000` text (24 palettes) |
|--------------------------|--------------------------|
| indigo, plum, purple, violet | amber, blue, bronze, brown, crimson, cyan, gold, grass, gray, green, lime, mauve, mint, olive, orange, pink, red, sage, sand, sky, slate, teal, tomato, yellow |

### Dark Mode

All 28 palettes use `#fff` (white) contrast text, because dark mode level-9
backgrounds are all dark enough.

---

## Appendix C — Preset Component Token Reference

### Naming convention

```
--line-<component>-<property>[-<variant>]

Examples:
--line-button-h-md          → button height, medium size
--line-button-px-sm         → button horizontal padding, small size
--line-button-radius        → button border radius
--line-input-border-width   → input border width
--line-dialog-overlay-opacity → dialog overlay opacity
```

### Component token convention

| Prefix | Meaning | Scope |
|--------|---------|-------|
| `--line-*` | Global theme tokens (e.g., `--line-radius-2`, `--line-primary`) | Theme package |
| `--line-{component}-*` | Component tokens defined by preset (e.g., `--line-button-radius`) | Preset package |

Consumers override preset tokens on the component host element:

```css
line-button { --line-button-radius: var(--line-radius-round); }
```

The `--line-{component}-*` convention is part of the public API — stable
across preset versions.

---

> **End of Implementation Guide**
>
> Cross-references:
> - Gap diagnostics: `THEME-GAP-ANALYSIS.md`
> - Architecture: `docs/ARCHITECTURE.md` (§14–§16 for component CSS resets)
> - Component specs: `.spec/COMPONENT-SPEC-TEMPLATE.md`
> - Product plan: `PRODUCT-PLAN.md` (P0-E1 through P2)
