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
│  L2 — Semantic Roles           (semantic-defaults + schemas) │
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
│   ├── rules.css            → SPLIT INTO tokens.css + semantic-defaults.css
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
├── semantic-defaults.css    → NEW (extracted from rules.css)
└── line.css                 → REWRITE (new import order, no custom/*)
```

### Target dist/ output

```
packages/theme/dist/
├── tokens.min.css                ← L1: foundation only
├── semantic-defaults.min.css     ← L2: gray prefers-color-scheme
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

> **Goal:** Create `tokens.css` — the color-free, opinion-free token layer.

### Step 1.1 — Create `src/tokens.css`

Extract all foundation scales from the prefixed `rules.css` into a new file.
Add the missing scales (z-index, opacity, motion, radius, border-width,
focus-ring, aspect-ratio).

```css
/* ═══════════════════════════════════════════════════════════
   tokens.css — line://ui Foundation Tokens (L1)

   Color-free. Semantic-free. Pure scales.
   Import this alone for a headless setup with consistent
   spacing, typography, and motion.
   ═══════════════════════════════════════════════════════════ */

/* ── Typography ── */

:where(html) {
  --line-font-sans: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu,
    Cantarell, Noto Sans, sans-serif;
  --line-font-serif: ui-serif, serif;
  --line-font-mono: Dank Mono, Operator Mono, Inconsolata, Fira Mono,
    ui-monospace, SF Mono, Monaco, Droid Sans Mono, Source Code Pro, monospace;

  /* Weight */
  --line-font-weight-1: 100;
  --line-font-weight-2: 200;
  --line-font-weight-3: 300;
  --line-font-weight-4: 400;
  --line-font-weight-5: 500;
  --line-font-weight-6: 600;
  --line-font-weight-7: 700;
  --line-font-weight-8: 800;
  --line-font-weight-9: 900;

  /* Line Height */
  --line-font-lineheight-0: 0.95;
  --line-font-lineheight-1: 1.1;
  --line-font-lineheight-2: 1.25;
  --line-font-lineheight-3: 1.375;
  --line-font-lineheight-4: 1.5;
  --line-font-lineheight-5: 1.75;
  --line-font-lineheight-6: 2;
  --line-font-lineheight-7: 2.25;
  --line-font-lineheight-8: 2.5;
  --line-font-lineheight-9: 3;

  /* Letter Spacing */
  --line-font-letterspacing-0: -0.05em;
  --line-font-letterspacing-1: 0.025em;
  --line-font-letterspacing-2: 0.05em;
  --line-font-letterspacing-3: 0.075em;
  --line-font-letterspacing-4: 0.15em;
  --line-font-letterspacing-5: 0.5em;
  --line-font-letterspacing-6: 0.75em;
  --line-font-letterspacing-7: 1em;
  --line-font-letterspacing-8: 1.5em;
  --line-font-letterspacing-9: 2em;

  /* Font Size */
  --line-font-size-0: 0.5rem;
  --line-font-size-1: 0.75rem;
  --line-font-size-2: 1rem;
  --line-font-size-3: 1.1rem;
  --line-font-size-4: 1.25rem;
  --line-font-size-5: 1.5rem;
  --line-font-size-6: 2rem;
  --line-font-size-7: 2.5rem;
  --line-font-size-8: 3rem;
  --line-font-size-9: 3.5rem;
  --line-font-size-fluid-0: clamp(0.75rem, 2vw, 1rem);
  --line-font-size-fluid-1: clamp(1rem, 4vw, 1.5rem);
  --line-font-size-fluid-2: clamp(1.5rem, 6vw, 2.5rem);
  --line-font-size-fluid-3: clamp(2rem, 9vw, 3.5rem);
}

/* ── Sizing / Spacing ── */

:where(html) {
  --line-size-000: -0.5rem;
  --line-size-00: -0.25rem;
  --line-size-1: 0.25rem;
  --line-size-2: 0.5rem;
  --line-size-3: 1rem;
  --line-size-4: 1.25rem;
  --line-size-5: 1.5rem;
  --line-size-6: 1.75rem;
  --line-size-7: 2rem;
  --line-size-8: 3rem;
  --line-size-9: 4rem;
  --line-size-10: 5rem;
  --line-size-11: 7.5rem;
  --line-size-12: 10rem;
  --line-size-13: 15rem;
  --line-size-14: 20rem;
  --line-size-15: 30rem;

  /* Fluid */
  --line-size-fluid-1: clamp(0.5rem, 1vw, 1rem);
  --line-size-fluid-2: clamp(1rem, 2vw, 1.5rem);
  --line-size-fluid-3: clamp(1.5rem, 3vw, 2rem);
  --line-size-fluid-4: clamp(2rem, 4vw, 3rem);
  --line-size-fluid-5: clamp(4rem, 5vw, 5rem);
  --line-size-fluid-6: clamp(5rem, 7vw, 7.5rem);
  --line-size-fluid-7: clamp(7.5rem, 10vw, 10rem);
  --line-size-fluid-8: clamp(10rem, 20vw, 15rem);
  --line-size-fluid-9: clamp(15rem, 30vw, 20rem);
  --line-size-fluid-10: clamp(20rem, 40vw, 30rem);

  /* Content widths */
  --line-size-content-1: 20ch;
  --line-size-content-2: 45ch;
  --line-size-content-3: 60ch;

  /* Header widths */
  --line-size-header-1: 20ch;
  --line-size-header-2: 25ch;
  --line-size-header-3: 35ch;

  /* Breakpoints */
  --line-size-xxs: 240px;
  --line-size-xs: 360px;
  --line-size-sm: 480px;
  --line-size-md: 768px;
  --line-size-lg: 1024px;
  --line-size-xl: 1440px;
  --line-size-xxl: 1920px;

  /* Relative (ch-based) */
  --line-size-relative-000: -0.5ch;
  --line-size-relative-00: -0.25ch;
  --line-size-relative-1: 0.25ch;
  --line-size-relative-2: 0.5ch;
  --line-size-relative-3: 1ch;
  --line-size-relative-4: 1.25ch;
  --line-size-relative-5: 1.5ch;
  --line-size-relative-6: 1.75ch;
  --line-size-relative-7: 2ch;
  --line-size-relative-8: 3ch;
  --line-size-relative-9: 4ch;
  --line-size-relative-10: 5ch;
  --line-size-relative-11: 7.5ch;
  --line-size-relative-12: 10ch;
  --line-size-relative-13: 15ch;
  --line-size-relative-14: 20ch;
  --line-size-relative-15: 30ch;
}

/* ── Border Radius ── */

:where(html) {
  --line-radius-1: 0.125rem;  /* 2px  — pills, tags */
  --line-radius-2: 0.25rem;   /* 4px  — inputs, buttons */
  --line-radius-3: 0.5rem;    /* 8px  — cards, dialogs */
  --line-radius-4: 0.75rem;   /* 12px — large cards */
  --line-radius-5: 1rem;      /* 16px — hero sections */
  --line-radius-round: 9999px;/* Full round — avatars, pills */
}

/* ── Border Width ── */

:where(html) {
  --line-border-1: 1px;       /* Default borders */
  --line-border-2: 2px;       /* Emphasis borders, focus rings */
  --line-border-3: 4px;       /* Heavy dividers */
}

/* ── Shadows / Elevation ── */

:where(html) {
  --line-shadow-color: 220 3% 15%;
  --line-shadow-strength: 1%;
  --line-inner-shadow-highlight: inset 0 -0.5px 0 0 #fff2, inset 0 0.5px 0 0 #0007;

  --line-shadow-1: 0 1px 2px -1px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 9%));
  --line-shadow-2:
    0 3px 5px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 3%)),
    0 7px 14px -5px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 5%));
  --line-shadow-3:
    0 -1px 3px 0 hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 2%)),
    0 1px 2px -5px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 2%)),
    0 2px 5px -5px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 4%)),
    0 4px 12px -5px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 5%)),
    0 12px 15px -5px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 7%));
  --line-shadow-4:
    0 -2px 5px 0 hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 2%)),
    0 1px 1px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 3%)),
    0 2px 2px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 3%)),
    0 5px 5px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 4%)),
    0 9px 9px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 5%)),
    0 16px 16px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 6%));
  --line-shadow-5:
    0 -1px 2px 0 hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 2%)),
    0 2px 1px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 3%)),
    0 5px 5px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 3%)),
    0 10px 10px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 4%)),
    0 20px 20px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 5%)),
    0 40px 40px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 7%));
  --line-shadow-6:
    0 -1px 2px 0 hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 2%)),
    0 3px 2px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 3%)),
    0 7px 5px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 3%)),
    0 12px 10px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 4%)),
    0 22px 18px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 5%)),
    0 41px 33px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 6%)),
    0 100px 80px -2px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 7%));
  --line-inner-shadow-0: inset 0 0 0 1px hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 9%));
  --line-inner-shadow-1:
    inset 0 1px 2px 0 hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 9%)),
    var(--line-inner-shadow-highlight);
  --line-inner-shadow-2:
    inset 0 1px 4px 0 hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 9%)),
    var(--line-inner-shadow-highlight);
  --line-inner-shadow-3:
    inset 0 2px 8px 0 hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 9%)),
    var(--line-inner-shadow-highlight);
  --line-inner-shadow-4:
    inset 0 2px 14px 0 hsl(var(--line-shadow-color) / calc(var(--line-shadow-strength) + 9%)),
    var(--line-inner-shadow-highlight);
}

:where(html):is(.dark) {
  --line-shadow-color: 220 40% 2%;
  --line-shadow-strength: 25%;
}

/* ── Z-Index ── */

:where(html) {
  --line-z-dropdown: 50;
  --line-z-sticky: 100;
  --line-z-fixed: 200;
  --line-z-overlay: 300;
  --line-z-modal: 400;
  --line-z-popover: 500;
  --line-z-toast: 600;
  --line-z-tooltip: 700;
}

/* ── Opacity ── */

:where(html) {
  --line-opacity-disabled: 0.5;
  --line-opacity-overlay: 0.75;
  --line-opacity-placeholder: 0.5;
}

/* ── Motion: Duration ── */

:where(html) {
  --line-duration-instant: 50ms;
  --line-duration-fast: 150ms;
  --line-duration-normal: 300ms;
  --line-duration-slow: 500ms;
  --line-duration-glacial: 1000ms;
}

/* ── Motion: Easing ── */

:where(html) {
  --line-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --line-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --line-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --line-ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
  --line-ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* ── Focus Ring ── */

:where(html) {
  --line-ring-width: 2px;
  --line-ring-offset: 2px;
  --line-ring-color: var(--line-ui-border, hsl(0 0% 83%));
  /* Fallback value ensures ring works even without semantic layer */
}

/* ── Aspect Ratio ── */

:where(html) {
  --line-ratio-square: 1;
  --line-ratio-landscape: 4 / 3;
  --line-ratio-portrait: 3 / 4;
  --line-ratio-wide: 16 / 9;
  --line-ratio-ultrawide: 21 / 9;
}

/* ── Absolute Colors ── */

:where(html) {
  --line-white: #f1f1f1;
  --line-black: #030303;
}

/* ── Color Scheme ── */

:where(html) {
  &.dark { color-scheme: dark; }
  &.light { color-scheme: light; }
}
```

### Step 1.2 — Delete the old `rules.css`

After extracting tokens.css and semantic-defaults.css (next phase), delete
`src/utils/rules.css`. All its content will live in the two new files.

---

## 5. Phase 2 — Semantic Defaults Layer (L2)

> **Goal:** Create `semantic-defaults.css` — gray-based default semantic roles.

### Step 2.1 — Create `src/semantic-defaults.css`

This file contains only the `prefers-color-scheme` blocks that map gray
values to semantic role tokens. It is independent from any palette.

```css
/* ═══════════════════════════════════════════════════════════
   semantic-defaults.css — line://ui Semantic Role Defaults (L2)

   Maps the neutral gray scale to semantic role tokens.
   Schemas (.line-schema-*) override these when active.

   Requires: tokens.css (for --line-white, --line-black)
   ═══════════════════════════════════════════════════════════ */

@media (prefers-color-scheme: light) {
  :root {
    --line-background: hsl(0, 0%, 99.0%);
    --line-subtle-background: hsl(0, 0%, 97.5%);
    --line-ui-background: hsl(0, 0%, 94.6%);
    --line-ui-hover-background: hsl(0, 0%, 92.0%);
    --line-ui-active-background: hsl(0, 0%, 89.5%);
    --line-subtle-border: hsl(0, 0%, 86.8%);
    --line-ui-border: hsl(0, 0%, 83.0%);
    --line-ui-border-hover: hsl(0, 0%, 73.2%);
    --line-solid-background: hsl(0, 0%, 55.2%);
    --line-solid-hover: hsl(0, 0%, 50.3%);
    --line-low-contrast: hsl(0, 0%, 39.3%);
    --line-high-contrast: hsl(0, 0%, 12.5%);
    --line-solid-text: #000;
    --line-light: var(--line-white);
    --line-dark: var(--line-black);
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --line-background: hsl(0, 0%, 9.5%);
    --line-subtle-background: hsl(0, 0%, 10.5%);
    --line-ui-background: hsl(0, 0%, 15.8%);
    --line-ui-hover-background: hsl(0, 0%, 18.9%);
    --line-ui-active-background: hsl(0, 0%, 21.7%);
    --line-subtle-border: hsl(0, 0%, 24.7%);
    --line-ui-border: hsl(0, 0%, 29.1%);
    --line-ui-border-hover: hsl(0, 0%, 37.5%);
    --line-solid-background: hsl(0, 0%, 43.0%);
    --line-solid-hover: hsl(0, 0%, 50.7%);
    --line-low-contrast: hsl(0, 0%, 69.5%);
    --line-high-contrast: hsl(0, 0%, 93.5%);
    --line-solid-text: #fff;
    --line-light: var(--line-white);
    --line-dark: var(--line-black);
  }
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
  --line-blue-1: hsl(206, 100%, 99.2%);
  /* ... existing 2-12 ... */
  --line-blue-contrast: #000;              /* ← ADD */
}

:where(html):is(.dark) {
  --line-blue-12: hsl(212, 35.0%, 9.2%);
  /* ... existing 11-1 ... */
  --line-blue-contrast: #fff;              /* ← ADD (dark mode: always white) */
}
```

**Example — `src/colors/violet.css`:**

```css
:where(html) {
  --line-violet-1: hsl(252, 100%, 99.0%);
  /* ... */
  --line-violet-contrast: #fff;            /* ← white in light mode too */
}

:where(html):is(.dark) {
  /* ... */
  --line-violet-contrast: #fff;            /* ← stays white */
}
```

**Dark mode rule:** In dark mode, level-9 becomes a much darker shade, so
ALL palettes use `#fff` as their contrast color in dark mode. Only the
light mode differs.

### Step 3.2 — Update all 28 schema files

In each schema file, update the `.line-is-{palette}` class and add the
`--line-solid-text` semantic token to the `.line-schema-{palette}` block.

**Example — `src/schemas/blue.css`:**

```css
/* ── Schema (add --line-solid-text) ── */

:where(.line-schema-blue) {
  --line-background: var(--line-blue-1);
  /* ... existing mappings ... */
  --line-light: var(--line-blue-1);
  --line-dark: var(--line-blue-12);
  --line-solid-text: var(--line-blue-contrast);  /* ← ADD */
}

:is(.dark) :where(.line-schema-blue) {
  --line-background: var(--line-blue-12);
  /* ... existing dark mappings ... */
  --line-solid-text: var(--line-blue-contrast);  /* ← ADD */
}

/* ── Utility: solid color class (fix contrast) ── */

:where(.line-is-blue) {
  color: var(--line-blue-contrast);              /* ← CHANGE from var(--line-blue-1) */
  background-color: var(--line-blue-9);
  transition: all var(--line-duration-fast) var(--line-ease-default);

  &:hover {
    background-color: var(--line-blue-10);
  }
}

:is(.dark) :where(.line-is-blue) {
  color: var(--line-blue-contrast);              /* ← CHANGE from var(--line-blue-1) */
  background-color: var(--line-blue-4);
  transition: all var(--line-duration-fast) var(--line-ease-default);

  &:hover {
    background-color: var(--line-blue-3);
  }
}
```

**Repeat for all 28 schema files.** The change is mechanical:

1. Replace `color: var(--line-{palette}-1)` → `color: var(--line-{palette}-contrast)` in `.line-is-{palette}`
2. Add `--line-solid-text: var(--line-{palette}-contrast)` to `.line-schema-{palette}` (both light and dark)
3. Replace hardcoded `ease-in-out 150ms` → `var(--line-duration-fast) var(--line-ease-default)`

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

/* L2 — Semantic defaults (gray, prefers-color-scheme) */
@import "./semantic-defaults.css";

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
    "css:semantic": "postcss src/semantic-defaults.css -o ./dist/semantic-defaults.min.css",
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
    "./semantic": "./dist/semantic-defaults.min.css",
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
ls dist/semantic-defaults.min.css
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

### Foundation Tokens (L1) — `tokens.css`

| Category | Tokens | Count |
|----------|--------|-------|
| Font family | `--line-font-sans`, `--line-font-serif`, `--line-font-mono` | 3 |
| Font weight | `--line-font-weight-1..9` | 9 |
| Line height | `--line-font-lineheight-0..9` | 10 |
| Letter spacing | `--line-font-letterspacing-0..9` | 10 |
| Font size | `--line-font-size-0..9` + 4 fluid | 14 |
| Sizing | `--line-size-000..15` + 10 fluid + 3 content + 3 header + 7 breakpoints + 16 relative | 57 |
| Border radius | `--line-radius-1..5` + round | 6 |
| Border width | `--line-border-1..3` | 3 |
| Shadows | `--line-shadow-1..6` + inner 0..4 + highlight + color + strength | 13 |
| Z-index | `--line-z-dropdown..tooltip` | 8 |
| Opacity | `--line-opacity-disabled/overlay/placeholder` | 3 |
| Duration | `--line-duration-instant..glacial` | 5 |
| Easing | `--line-ease-default/in/out/in-out/spring` | 5 |
| Focus ring | `--line-ring-width/offset/color` | 3 |
| Aspect ratio | `--line-ratio-square/landscape/portrait/wide/ultrawide` | 5 |
| Absolute | `--line-white`, `--line-black` | 2 |
| **Total** | | **156** |

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
| `--line-solid-text` | contrast | Text on solid bg |
| `--line-light` | 1 | Light text |
| `--line-dark` | 12 | Dark text |

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
