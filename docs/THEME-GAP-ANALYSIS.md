# THEME-GAP-ANALYSIS v2.0

> **line://ui** · `@websublime/line-theme` · branch `next`
>
> Updated: 2026-03-12 — adds WCAG contrast audit (§A), missing design system
> layers (§B), theme output restructuring (§C), and preset concept (§D).

---

## Table of Contents

1. [Gap Summary Matrix](#1-gap-summary-matrix)
2. [Critical Gaps (runtime breakage)](#2-critical-gaps)
3. [Major Gaps (architectural)](#3-major-gaps)
4. [Minor Gaps (quality)](#4-minor-gaps)
5. [§A — WCAG Contrast Audit](#a--wcag-contrast-audit)
6. [§B — Missing Design System Layers](#b--missing-design-system-layers)
7. [§C — Theme Output Restructuring](#c--theme-output-restructuring)
8. [§D — Preset: Out-of-the-Box Component Styles](#d--preset-out-of-the-box-component-styles)
9. [What IS Correct](#what-is-correct)
10. [Critical Fix Order](#critical-fix-order)

---

## 1. Gap Summary Matrix

| # | Severity | Gap | Status |
|---|----------|-----|--------|
| 1 | CRITICAL | `postcss-jit-props` not activated — 7 tokens undefined | Open |
| 2 | CRITICAL | ~160 utility tokens unprefixed (`--font-sans` → `--line-font-sans`) | Open |
| 3 | CRITICAL | 9 tokens used in normalize/rules but never defined anywhere | Open |
| 4 | MAJOR | `custom/*` demo files imported in production `line.css` | Open |
| 5 | MAJOR | `general.css` utility classes missing `:where()` wrapper | Open |
| 6 | MAJOR | Semantic alias layer (`aliases.css`) does not exist | Open |
| 7 | MAJOR | No `exports` field in `package.json` | Open |
| 8 | MINOR | Invalid CSS transition syntax in `general.css` | Open |
| 9 | MINOR | Deprecated `::-moz-selection` (removed Firefox 62) | Open |
| 10 | MINOR | `mixins.css` references unprefixed tokens | Open |
| 11 | MINOR | `custom/*` files use unprefixed shadow tokens | Open |
| **12** | **CRITICAL** | **19 of 28 palettes fail WCAG AA for `.line-is-*` solid backgrounds** | **NEW** |
| **13** | **MAJOR** | **Zero foundation tokens for z-index, opacity, motion, radius, border-width, focus-ring** | **NEW** |
| **14** | **MAJOR** | **No `--line-{palette}-contrast` token — contrast text choice is hardcoded** | **NEW** |
| **15** | **MAJOR** | **`--line-dark` / `--line-light` referenced in general.css but only defined inside schemas — breaks when no schema is active** | **NEW** |
| **16** | **MAJOR** | **Foundation tokens and semantic roles mixed in single `rules.css` — prevents headless "tokens only" consumption** | **NEW** |
| **17** | **MAJOR** | **No component-level token layer (`--line-button-*`, `--line-input-*`)** | **NEW** |
| **18** | **MAJOR** | **No preset/skin package — zero out-of-the-box component visual styles** | **NEW** |

---

## 2. Critical Gaps

### Gap 1 — `postcss-jit-props` NOT activated

**File:** `postcss.config.mjs`
**Impact:** 7 tokens referenced in `normalize.css` are never injected into the output.

The plugin is installed (`node_modules/postcss-jit-props`) but not added to the
PostCSS pipeline. There is a TODO comment on line 9.

Tokens that resolve to empty:

| Token | Used in | Effect |
|-------|---------|--------|
| `--ease-2` | `normalize.css` | Focus transitions broken |
| `--radius-2` | `normalize.css` | Zero border-radius on inputs |
| `--radius-3` | `normalize.css` | Zero border-radius on dialogs |
| `--border-size-1` | `normalize.css` | Invisible borders on fieldsets |
| `--border-size-2` | `normalize.css` | Zero hr height |
| `--border-size-3` | `normalize.css` | Missing thick borders |
| `--surface-4` | `normalize.css` | Missing surface color |

**Fix:** Either activate the plugin OR define the tokens explicitly in
`rules.css` with `--line-` prefix. Recommendation: define explicitly so we
own the values and don't depend on Open Props defaults.

### Gap 2 — Utility tokens UNPREFIXED ✅ RESOLVED (E8 T1)

**Status:** All foundation tokens now live in `tokens/` directory with proper `--line-*` prefix (~299 core tokens across 11 family files). The unprefixed tokens in `rules.css` are now redundant and will be removed when E8 T2 (semantic.css) cleans up rules.css.

**Original issue:** `rules.css` (~160 occurrences) defined tokens without `--line-` prefix.

**Fix applied:** E8 T1 created `tokens/` directory with all tokens properly prefixed. Remaining cleanup: remove redundant unprefixed tokens from rules.css (tracked in E8 T2).

### Gap 3 — 9 undefined tokens

Tokens referenced but never defined in any file:

| Token | Source | Note |
|-------|--------|------|
| `--ease-2` | normalize.css | No easing scale exists |
| `--radius-2` | normalize.css | No radius scale exists |
| `--radius-3` | normalize.css | No radius scale exists |
| `--border-size-1` | normalize.css | No border-width scale exists |
| `--border-size-2` | normalize.css | No border-width scale exists |
| `--border-size-3` | normalize.css | No border-width scale exists |
| `--surface-4` | normalize.css | No surface tokens exist |
| `--nice-inner-radius` | normalize.css | Computed from `--radius-3` (also undefined) |
| `--line-dark` / `--line-light` | general.css | Only defined inside schemas, not in rules.css |

**Fix:** Define all missing scales in `rules.css` with `--line-` prefix.
See Gap 13 for the complete token coverage needed.

### Gap 12 — WCAG Contrast Failure on Solid Backgrounds (NEW)

**Impact:** 19 of 28 palettes fail WCAG AA (4.5:1) for normal text when
using `.line-is-{palette}` utility classes. These classes set a level-9
solid background with either level-1 (light) or level-12 (dark) text.

#### Full audit results

| Palette | Current text | Ratio | Grade | Fix |
|---------|-------------|-------|-------|-----|
| amber | level-12 ✓ | 7.2:1 | AAA ✅ | — |
| yellow | level-12 ✓ | 8.0:1 | AAA ✅ | — |
| sky | level-12 ✓ | 7.9:1 | AAA ✅ | — |
| lime | level-12 ✓ | 6.9:1 | AA ✅ | — |
| mint | level-12 ✓ | 6.6:1 | AA ✅ | — |
| indigo | level-1 | 5.2:1 | AA ✅ | — |
| plum | level-1 | 4.7:1 | AA ✅ | — |
| purple | level-1 | 5.1:1 | AA ✅ | — |
| violet | level-1 | 5.4:1 | AA ✅ | — |
| **blue** | **level-1** | **3.2:1** | **⚠️ AA-large** | `→ #000` (6.5:1 AA) |
| **red** | **level-1** | **3.8:1** | **⚠️ AA-large** | `→ #000` (5.4:1 AA) |
| **crimson** | **level-1** | **3.8:1** | **⚠️ AA-large** | `→ #000` (5.5:1 AA) |
| **pink** | **level-1** | **4.0:1** | **⚠️ AA-large** | `→ #000` (5.1:1 AA) |
| **tomato** | **level-1** | **3.8:1** | **⚠️ AA-large** | `→ #000` (5.4:1 AA) |
| **orange** | **level-1** | **3.0:1** | **❌ FAIL** | `→ #000` (6.9:1 AA) |
| **cyan** | **level-1** | **2.9:1** | **❌ FAIL** | `→ #000` (7.0:1 AA) |
| **teal** | **level-1** | **3.0:1** | **⚠️ AA-large** | `→ #000` (6.9:1 AA) |
| **green** | **level-1** | **3.1:1** | **⚠️ AA-large** | `→ #000` (6.7:1 AA) |
| **grass** | **level-1** | **3.0:1** | **❌ FAIL** | `→ #000` (6.9:1 AA) |
| **gray** | **level-1** | **3.3:1** | **⚠️ AA-large** | `→ #000` (6.3:1 AA) |
| **mauve** | **level-1** | **3.7:1** | **⚠️ AA-large** | `→ #000` (5.5:1 AA) |
| **slate** | **level-1** | **3.6:1** | **⚠️ AA-large** | `→ #000` (5.6:1 AA) |
| **sage** | **level-1** | **3.5:1** | **⚠️ AA-large** | `→ #000` (5.9:1 AA) |
| **olive** | **level-1** | **3.5:1** | **⚠️ AA-large** | `→ #000` (5.9:1 AA) |
| **sand** | **level-1** | **3.4:1** | **⚠️ AA-large** | `→ #000` (6.0:1 AA) |
| **brown** | **level-1** | **3.5:1** | **⚠️ AA-large** | `→ #000` (6.0:1 AA) |
| **bronze** | **level-1** | **4.0:1** | **⚠️ AA-large** | `→ #000` (5.1:1 AA) |
| **gold** | **level-1** | **3.1:1** | **⚠️ AA-large** | `→ #000` (6.6:1 AA) |

**Key finding:** Switching failing palettes from level-1 to level-12 does NOT
reliably fix contrast (crimson, pink, red, tomato, bronze still fail both
ways). The only universal solution is using pure `#fff` or `#000` as the
contrast color, chosen per palette.

#### Solution: `--line-{palette}-contrast` token

Add a dedicated contrast token to each palette color file:

```css
/* colors/blue.css — append at end of :root block */
--line-blue-contrast: #000;

/* colors/violet.css */
--line-violet-contrast: #fff;
```

**Classification by contrast color:**

| Use `#fff` (white text) | Use `#000` (dark text) |
|------------------------|----------------------|
| indigo, plum, purple, violet | All other 24 palettes |

Then update all 28 schema files:

```css
/* BEFORE (blue.css schema) */
:where(.line-is-blue) {
  color: var(--line-blue-1);            /* ← hardcoded, fails AA */
  background-color: var(--line-blue-9);
}

/* AFTER */
:where(.line-is-blue) {
  color: var(--line-blue-contrast);     /* ← #000, 6.5:1 AA ✅ */
  background-color: var(--line-blue-9);
}
```

This approach follows Radix Colors v3 which introduced a dedicated `contrast`
scale for exactly this reason. The token is set per-palette at the color
definition level, so dark mode schemas can also override it if needed.

**Also expose as semantic token:**

```css
/* In each schema */
:where(.line-schema-blue) {
  --line-solid-text: var(--line-blue-contrast);
}
```

Components and presets use `--line-solid-text` for any text on `--line-solid-background`.

---

## 3. Major Gaps

### Gap 4 — Demo files in production bundle

**File:** `line.css` (lines 34–61)
**Impact:** 28 `custom/*` demo files imported into the production output,
inflating bundle size and leaking demo code.

**Fix:** Remove all `@import "./custom/*"` lines from `line.css`.

### Gap 5 — Utility classes missing `:where()` wrapper

**File:** `general.css`
**Impact:** Utility classes have normal specificity instead of zero. Consumer
overrides require `!important`.

**Fix:** Wrap in `:where()` (already done for schemas).

### Gap 6 — Semantic alias layer missing

**Impact:** No `aliases.css` maps foundation → semantic roles. Components
cannot reference `--line-primary`, `--line-danger`, etc.

Scheduled for P1-E1-T1 but file does not exist.

### Gap 7 — No `exports` field in `package.json`

**Impact:** Granular imports (`@websublime/line-theme/tokens`) impossible.
Consumers must import the entire bundle.

**Fix:** See §C for the full exports structure.

### Gap 13 — Missing Foundation Token Scales ✅ RESOLVED (E8 T1)

**Status:** All foundation token scales are now defined in `tokens/` directory. Z-index (14 tokens), opacity (3), durations (12), easing (81), border-radius (29 incl. drawn/blob/conditional), focus-ring (3), aspect-ratio (6).

**Original impact:** The following scales were completely absent from
`rules.css`:

| Missing Scale | Tokens needed | Used by |
|---------------|--------------|---------|
| **z-index** | `--line-z-dropdown`, `--line-z-sticky`, `--line-z-fixed`, `--line-z-overlay`, `--line-z-modal`, `--line-z-popover`, `--line-z-toast`, `--line-z-tooltip` | Dialog, Popover, Tooltip, Toast, Dropdown, Drawer, Combobox, Overlay |
| **opacity** | `--line-opacity-disabled`, `--line-opacity-overlay`, `--line-opacity-placeholder` | All disabled states, overlays, placeholder text |
| **motion / duration** | `--line-duration-instant` (50ms), `--line-duration-fast` (150ms), `--line-duration-normal` (300ms), `--line-duration-slow` (500ms), `--line-duration-glacial` (1000ms) | Every animated component |
| **motion / easing** | `--line-ease-default`, `--line-ease-in`, `--line-ease-out`, `--line-ease-in-out`, `--line-ease-spring` | Every animated component |
| **border-radius** | `--line-radius-1` (2px), `--line-radius-2` (4px), `--line-radius-3` (8px), `--line-radius-4` (12px), `--line-radius-5` (16px), `--line-radius-round` (9999px) | Button, Input, Card, Dialog, Badge, Avatar, Tooltip |
| **border-width** | `--line-border-1` (1px), `--line-border-2` (2px), `--line-border-3` (4px) | Input, Card, Separator, Table, Fieldset |
| **focus ring** | `--line-ring-width` (2px), `--line-ring-offset` (2px), `--line-ring-color` (var(--line-ui-border)) | Every interactive component |
| **aspect-ratio** | `--line-ratio-square` (1), `--line-ratio-landscape` (4/3), `--line-ratio-portrait` (3/4), `--line-ratio-wide` (16/9), `--line-ratio-ultrawide` (21/9) | AspectRatio, Image, Video |

#### Recommended additions to `rules.css`

```css
:where(html) {
  /* ── Z-Index ── */
  --line-z-dropdown: 50;
  --line-z-sticky: 100;
  --line-z-fixed: 200;
  --line-z-overlay: 300;
  --line-z-modal: 400;
  --line-z-popover: 500;
  --line-z-toast: 600;
  --line-z-tooltip: 700;

  /* ── Opacity ── */
  --line-opacity-disabled: 0.5;
  --line-opacity-overlay: 0.75;
  --line-opacity-placeholder: 0.5;

  /* ── Motion: Duration ── */
  --line-duration-instant: 50ms;
  --line-duration-fast: 150ms;
  --line-duration-normal: 300ms;
  --line-duration-slow: 500ms;
  --line-duration-glacial: 1000ms;

  /* ── Motion: Easing ── */
  --line-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --line-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --line-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --line-ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
  --line-ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* ── Border Radius ── */
  --line-radius-1: 0.125rem;
  --line-radius-2: 0.25rem;
  --line-radius-3: 0.5rem;
  --line-radius-4: 0.75rem;
  --line-radius-5: 1rem;
  --line-radius-round: 9999px;

  /* ── Border Width ── */
  --line-border-1: 1px;
  --line-border-2: 2px;
  --line-border-3: 4px;

  /* ── Focus Ring ── */
  --line-ring-width: 2px;
  --line-ring-offset: 2px;
  --line-ring-color: var(--line-ui-border);

  /* ── Aspect Ratio ── */
  --line-ratio-square: 1;
  --line-ratio-landscape: 4 / 3;
  --line-ratio-portrait: 3 / 4;
  --line-ratio-wide: 16 / 9;
  --line-ratio-ultrawide: 21 / 9;
}
```

### Gap 14 — No `--line-{palette}-contrast` token (NEW)

See Gap 12 for full details. Each of the 28 color files needs a
`--line-{palette}-contrast` token, and each schema needs a
`--line-solid-text` semantic variable.

### Gap 15 — `--line-dark` / `--line-light` scoping error (NEW)

**File:** `general.css` references `var(--line-dark)` and `var(--line-light)`.
These tokens are only defined inside `.line-schema-*` selectors, not in
`rules.css`. When no schema class is applied, they resolve empty.

**Fix:** Define fallback values in `rules.css`:

```css
:where(html) {
  --line-light: var(--line-white, #f1f1f1);
  --line-dark: var(--line-black, #030303);
}
```

Schemas override these when active.

### Gap 16 — `rules.css` mixes foundation and semantic tokens — PARTIALLY RESOLVED (E8 T1)

**Status:** Foundation tokens are now in `tokens/` directory (E8 T1 complete). Semantic defaults still need extraction from `rules.css` into `semantic.css` (tracked in E8 T2). Redundant unprefixed foundation tokens in rules.css lines 39-205 need removal as part of T2 cleanup.

**Original impact:** `rules.css` contained both foundation tokens (`--font-sans`,
`--size-3`, `--shadow-1`) and the semantic role map (`--line-background`,
`--line-solid-background`, etc. via `light-dark()`).

**Fix applied (partial):** `tokens/` directory created with all foundation tokens properly prefixed.

**Remaining:** Split `rules.css` into:

| File | Contents | Status |
|------|----------|--------|
| `tokens/` directory | Foundation: typography, sizing, borders, shadows, easing, z-index, aspects, durations, opacity, focus-ring, absolute colors | ✅ Done (E8 T1) |
| `semantic.css` | Gray-based `light-dark()` defaults mapping gray scale to `--line-background`, `--line-solid-background`, etc. | Done (uses `light-dark()` with `color-scheme` trigger) |

### Gap 17 — No component-level token layer (NEW)

**Impact:** There is no intermediate token layer between semantic tokens
and component CSS. Components hardcode spacing, radius, and height values
instead of referencing component-scoped tokens.

Example of what should exist:

```css
/* In the preset, not in the theme */
line-button {
  --line-button-height-sm: 2rem;
  --line-button-height-md: 2.5rem;
  --line-button-height-lg: 3rem;
  --line-button-radius: var(--line-radius-2);
  --line-button-padding-x: var(--line-size-4);
  --line-button-font-weight: var(--line-font-weight-5);
  --line-button-font-size: var(--line-font-size-2);
}
```

This is not a theme responsibility — it belongs in the **preset** layer
(see §D).

### Gap 18 — No preset/skin package (NEW)

See §D for full concept.

---

## 4. Minor Gaps

### Gap 8 — Invalid CSS transition syntax

**File:** `general.css`

```css
/* CURRENT — invalid */
transition: colors ease-in-out delay-150;

/* CORRECT */
transition-property: color, background-color, border-color;
transition-timing-function: ease-in-out;
transition-duration: 150ms;
```

### Gap 9 — Deprecated `::-moz-selection`

Removed in Firefox 62. Use `::selection` only.

### Gap 10 — `mixins.css` references unprefixed tokens

`var(--font-size-$(size))` → should be `var(--line-font-size-$(size))`.

### Gap 11 — `custom/*` demo files use unprefixed shadow tokens

`var(--shadow-3)` → should be `var(--line-shadow-3)`.

---

## §A — WCAG Contrast Audit

### Methodology

For each of the 28 palettes, we calculated the WCAG 2.1 relative luminance
contrast ratio between:

1. The `.line-is-{palette}` text color (level-1 or level-12) against the
   background color (level-9)
2. Pure `#fff` against level-9
3. Pure `#000` against level-9

### Results Summary

**Currently passing (9 palettes):**
amber ✅, yellow ✅, sky ✅, lime ✅, mint ✅ — already use dark text (level-12)
indigo ✅, plum ✅, purple ✅, violet ✅ — white text (level-1) works

**Currently failing (19 palettes):**
blue, red, crimson, pink, tomato, orange, cyan, teal, green, grass,
gray, mauve, slate, sage, olive, sand, brown, bronze, gold

**After applying `--line-{palette}-contrast` fix (28/28 pass AA):**

| Contrast group | Palettes | Token value |
|---------------|----------|-------------|
| Dark text on bright/medium bg | amber, yellow, lime, mint, sky, blue, red, crimson, pink, tomato, orange, cyan, teal, green, grass, gray, mauve, slate, sage, olive, sand, brown, bronze, gold | `#000` |
| Light text on dark bg | indigo, plum, purple, violet | `#fff` |

### Background on level-9 contrast problem

The 12-step palette scale (derived from Radix Colors) was designed for
UI element states, not for text-on-solid contrast. Levels 1–12 distribute
perceptual lightness across the range but do not guarantee that level-1
or level-12 achieves 4.5:1 against level-9. This is a known limitation
that Radix addressed in v3 by introducing a dedicated `contrast` scale.

---

## §B — Missing Design System Layers

### What a complete design system needs

A design system is organised in layers. Each layer builds on the previous.
Here is the full taxonomy and what line://ui has versus what it needs:

| Layer | Purpose | line://ui status |
|-------|---------|-----------------|
| **L0 — Primitives** | Raw values: hex colors, px/rem, ms, cubic-bezier | ✅ Palette files (28 × 12 steps) |
| **L1 — Foundation tokens** | Named scales: `--line-font-size-2`, `--line-radius-3`, `--line-shadow-2` | ⚠️ Partial — typography, sizing, shadows exist but UNPREFIXED; z-index, opacity, motion, radius, border-width, focus-ring, aspect-ratio MISSING |
| **L2 — Semantic roles** | Context-mapped: `--line-background`, `--line-solid-background`, `--line-high-contrast` | ✅ Exists in schemas (12-step → semantic) |
| **L3 — Semantic aliases** | Intent-mapped: `--line-primary`, `--line-danger`, `--line-success`, `--line-warning`, `--line-info`, `--line-neutral` | ❌ Missing (Gap 6 — `aliases.css` scheduled but not created) |
| **L4 — Component tokens** | Scoped: `--line-button-radius`, `--line-input-height`, `--line-dialog-overlay-opacity` | ❌ Missing (Gap 17) |
| **L5 — Component styles** | Visual opinions: border-radius, padding, shadow, animation per component | ❌ Missing (Gap 18 — the "preset" concept) |

### Layer details

#### L1 — Foundation tokens (to complete)

What exists (after prefixing):

- `--line-font-sans/serif/mono` — font families ✅
- `--line-font-weight-1..9` — weight scale ✅
- `--line-font-lineheight-0..9` — line-height scale ✅
- `--line-font-letterspacing-0..9` — letter-spacing scale ✅
- `--line-font-size-0..9` + fluid variants — type scale ✅
- `--line-size-1..15` + fluid + content + relative variants — spacing/sizing ✅
- `--line-shadow-1..6` + inner variants — elevation ✅
- `--line-white`, `--line-black` — absolute values ✅

What is MISSING:

- `--line-z-*` — z-index scale (8 tokens)
- `--line-opacity-*` — opacity scale (3 tokens)
- `--line-duration-*` — motion duration (5 tokens)
- `--line-ease-*` — motion easing (5 tokens)
- `--line-radius-*` — border-radius scale (6 tokens)
- `--line-border-*` — border-width scale (3 tokens)
- `--line-ring-*` — focus ring (3 tokens)
- `--line-ratio-*` — aspect ratio (5 tokens)
- `--line-{palette}-contrast` — per-palette contrast color (28 tokens)

Total missing: ~66 tokens.

#### L3 — Semantic aliases (to create)

The alias layer maps one or more palettes to intent names. Consumers
configure their brand by choosing which palette backs each alias.

```css
/* aliases.css — default mapping */
:where(html) {
  /* Primary */
  --line-primary: var(--line-blue-9);
  --line-primary-hover: var(--line-blue-10);
  --line-primary-text: var(--line-blue-contrast);
  --line-primary-subtle: var(--line-blue-3);
  --line-primary-outline: var(--line-blue-7);

  /* Danger */
  --line-danger: var(--line-red-9);
  --line-danger-hover: var(--line-red-10);
  --line-danger-text: var(--line-red-contrast);
  --line-danger-subtle: var(--line-red-3);
  --line-danger-outline: var(--line-red-7);

  /* Success */
  --line-success: var(--line-green-9);
  /* ... */

  /* Warning */
  --line-warning: var(--line-amber-9);
  /* ... */

  /* Info */
  --line-info: var(--line-cyan-9);
  /* ... */

  /* Neutral */
  --line-neutral: var(--line-gray-9);
  /* ... */
}
```

Consumer overrides their brand:

```css
:root {
  --line-primary: var(--line-violet-9);
  --line-primary-hover: var(--line-violet-10);
  --line-primary-text: var(--line-violet-contrast);
}
```

#### L4 — Component tokens (preset responsibility)

See §D. These live in the preset package, not in the theme.

---

## §C — Theme Output Restructuring

### Current state

Single monolithic output: `line.css` imports everything including demos.

### Proposed structure

```
@websublime/line-theme/
├── dist/
│   ├── tokens.min.css              ← L1: foundation tokens only (no colors, no semantic)
│   ├── semantic.min.css            ← L2: gray-based light-dark() defaults
│   ├── normalize.min.css           ← Document reset (optional)
│   ├── utilities.min.css           ← .line-is-* utility classes
│   ├── aliases.min.css             ← L3: primary/danger/success/warning/info/neutral
│   │
│   ├── colors/
│   │   ├── blue.min.css            ← --line-blue-1..12 + --line-blue-contrast
│   │   ├── red.min.css
│   │   └── ... (28 files)
│   │
│   ├── schemas/
│   │   ├── blue.min.css            ← .line-schema-blue + .line-is-blue variants
│   │   ├── red.min.css
│   │   └── ... (28 files)
│   │
│   ├── themes/
│   │   ├── blue.min.css            ← colors/blue + schemas/blue combined
│   │   ├── red.min.css
│   │   └── ... (28 files)
│   │
│   └── line.min.css                ← Everything bundled (quick start)
```

### `package.json` exports

```json
{
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

### Consumer usage patterns

```css
/* ── Headless: zero opinions, I style everything ── */
/* (import nothing from theme, use ::part() directly) */

/* ── Tokens only: I have my own colors ── */
@import '@websublime/line-theme/tokens';

/* ── Foundation + document reset ── */
@import '@websublime/line-theme/tokens';
@import '@websublime/line-theme/normalize';

/* ── Single palette ── */
@import '@websublime/line-theme/tokens';
@import '@websublime/line-theme/normalize';
@import '@websublime/line-theme/themes/blue';
@import '@websublime/line-theme/aliases';

/* ── Full: everything ── */
@import '@websublime/line-theme';

/* ── Full + preset (out-of-the-box) ── */
@import '@websublime/line-theme';
@import '@websublime/line-presets';
```

---

## §D — Preset: Out-of-the-Box Component Styles

### The naming question

The **theme** package provides design tokens and color palettes. But when a
consumer wants "I install and it looks good", they need visual opinions
applied to each component — border-radius, padding, shadows, animation,
variant styles. What is this called?

| Term | Used by | Fit for line://ui |
|------|---------|-------------------|
| **preset** | Park UI (on Ark UI), Panda CSS | ✅ Best fit — communicates "ready-to-use visual configuration, swappable" |
| skin | Traditional UI lib term | Reasonable but dated |
| recipe | Panda CSS | Too granular — refers to a single component, not a collection |
| kit | Generic | Too vague |
| flavor | Quasar Framework | Uncommon |
| appearance | VS Code | Collides with CSS `appearance` property |

**Recommendation: `preset`**

The word communicates exactly the right thing: "pre-set visual decisions
that you can swap or override." It's the term used by Park UI, which has
the identical architecture to ours — headless components (Ark UI) + styled
layer on top (Park UI presets).

### Architecture

```
@websublime/line-core              → L0: headless Web Components (behavior + accessibility)
@websublime/line-theme             → L1-L3: design tokens + palettes + schemas + aliases
@websublime/line-presets    → L4-L5: component tokens + visual styles (the "default look")
@websublime/line-preset-minimal    → L4-L5: alternative minimal style (future)
```

### What a preset contains

A preset is a **CSS-only package**. It targets components from the outside
using `::part()` selectors and host element selectors. It imports nothing
from `line-core` — no JS, no component registration.

```
@websublime/line-presets/
├── src/
│   ├── button.css        ← styles for line-button
│   ├── input.css         ← styles for line-input
│   ├── dialog.css        ← styles for line-dialog
│   ├── card.css          ← styles for line-card
│   ├── ...               ← one file per component (or grouped by category)
│   └── index.css         ← @import all
├── dist/
│   ├── preset.min.css    ← everything
│   ├── button.min.css    ← individual component (tree-shaking)
│   └── ...
└── package.json
```

### How a preset styles components

```css
/* presets/src/button.css */

/* ── Component tokens (L4) — consumers can override these ── */
line-button {
  --line-button-height-sm: 2rem;
  --line-button-height-md: 2.5rem;
  --line-button-height-lg: 3rem;
  --line-button-radius: var(--line-radius-2);
  --line-button-padding-x: var(--line-size-4);
  --line-button-font-weight: var(--line-font-weight-5);
  --line-button-font-size: var(--line-font-size-2);
  --line-button-transition: var(--line-duration-fast) var(--line-ease-default);
}

/* ── Base styles (L5) ── */
line-button::part(root) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--line-button-height-md);
  padding-inline: var(--line-button-padding-x);
  border-radius: var(--line-button-radius);
  font-weight: var(--line-button-font-weight);
  font-size: var(--line-button-font-size);
  transition: all var(--line-button-transition);
  cursor: pointer;
}

/* ── Variant: solid ── */
line-button[data-variant="solid"]::part(root) {
  background-color: var(--line-solid-background);
  color: var(--line-solid-text);
}
line-button[data-variant="solid"]:hover::part(root) {
  background-color: var(--line-solid-hover);
}

/* ── Variant: outline ── */
line-button[data-variant="outline"]::part(root) {
  background-color: transparent;
  color: var(--line-high-contrast);
  border: var(--line-border-1) solid var(--line-ui-border);
}
line-button[data-variant="outline"]:hover::part(root) {
  background-color: var(--line-ui-hover-background);
}

/* ── Variant: ghost ── */
line-button[data-variant="ghost"]::part(root) {
  background-color: transparent;
  color: var(--line-high-contrast);
}
line-button[data-variant="ghost"]:hover::part(root) {
  background-color: var(--line-ui-hover-background);
}

/* ── Sizes ── */
line-button[data-size="sm"]::part(root) {
  height: var(--line-button-height-sm);
  font-size: var(--line-font-size-1);
}
line-button[data-size="lg"]::part(root) {
  height: var(--line-button-height-lg);
  font-size: var(--line-font-size-3);
}

/* ── States ── */
line-button[data-disabled]::part(root) {
  opacity: var(--line-opacity-disabled);
  cursor: not-allowed;
}
line-button[data-loading]::part(root) {
  opacity: var(--line-opacity-disabled);
  cursor: wait;
}

/* ── Focus ring ── */
line-button:focus-visible::part(root) {
  outline: var(--line-ring-width) solid var(--line-ring-color);
  outline-offset: var(--line-ring-offset);
}
```

### Why `::part()` and not adoptedStyleSheets?

A preset that injects styles via `adoptedStyleSheets` requires the component
to import and activate the preset at the JS level. This couples the headless
component to a specific preset and defeats the purpose.

`::part()` works from the outside — the consumer imports a CSS file and
components get styled automatically. The component remains fully headless.
All it needs to expose is the right `part` attributes on its shadow DOM
elements (already specified in our component spec template).

### Consumer override pattern

```css
/* Consumer wants larger buttons globally */
line-button {
  --line-button-height-md: 3rem;
  --line-button-radius: var(--line-radius-3);
}

/* Consumer wants a specific button to look different */
.hero-cta::part(root) {
  background: linear-gradient(135deg, var(--line-blue-9), var(--line-violet-9));
}
```

### Component token convention

Preset component tokens use the `--line-{component}-*` naming convention
(e.g., `--line-button-radius`, `--line-input-height`). This convention is
part of the public API and distinguishes them from:

- `--line-*` — theme tokens (global, part of the design system contract)
- `--line-{component}-*` — preset tokens (component-scoped, overridable)

Consumers override with the same name on the component host element:

```css
line-button { --line-button-radius: var(--line-radius-round); }
```

### Preset variants (future)

Different presets can offer fundamentally different aesthetics:

| Preset | Aesthetic | Use case |
|--------|-----------|----------|
| `line-presets` | Balanced, rounded, neutral | General purpose |
| `line-preset-minimal` | Sharp corners, thin borders, sparse | Dashboards, tools |
| `line-preset-soft` | Large radius, pastels, gentle shadows | Consumer apps |
| `line-preset-brutalist` | No radius, thick borders, high contrast | Portfolio, editorial |

All presets consume the same theme tokens. Swapping a preset changes the
entire visual character without touching the theme or the components.

---

## What IS Correct

- Palette files (`--line-blue-1` through `--line-blue-12`) ✅
- Schema files (`.line-schema-blue`, `.line-is-blue`) ✅
- Semantic role variables (`--line-background`, `--line-solid-background`) ✅
- Dark mode mechanism (`light-dark()` + `color-scheme` property, with `.dark`/`.light` class as secondary trigger for shadow tokens) ✅
- PostCSS pipeline plugins (all present except jit-props) ✅
- Build script (`src/build.ts`) ✅
- Package name (`@websublime/line-theme`) ✅
- 5 of 28 palettes already use correct dark text on bright backgrounds
  (amber, yellow, lime, mint, sky) ✅
- Schema utility classes use `:where()` for zero specificity ✅

---

## Critical Fix Order

### Phase 0 — Stop the bleeding (runtime breakage)

```
P0-1. Prefix all tokens in rules.css (Gap 2)
P0-2. Prefix all references in normalize.css, general.css, mixins.css (Gap 2)
P0-3. Define missing scales: radius, border-width, easing (Gaps 1, 3, 13)
P0-4. Add --line-{palette}-contrast to all 28 color files (Gap 14)
P0-5. Update all 28 schemas to use contrast token (Gap 12)
P0-6. Define --line-dark/--line-light fallbacks in rules.css (Gap 15)
P0-7. Remove custom/* imports from line.css (Gap 4)
```

### Phase 1 — Architecture

```
P1-1. Split rules.css into tokens.css + semantic.css (Gap 16)
P1-2. Add missing foundation scales (z-index, opacity, motion, focus-ring, aspect-ratio) (Gap 13)
P1-3. Create aliases.css (Gap 6)
P1-4. Wrap general.css utilities in :where() (Gap 5)
P1-5. Add exports field to package.json (Gap 7)
P1-6. Fix invalid transitions, remove deprecated selectors (Gaps 8, 9)
```

### Phase 2 — Preset

```
P2-1. Create @websublime/line-presets package
P2-2. Define component tokens for Phase 1 components (Button, Input, etc.)
P2-3. Write ::part() styles for each component as specs get implemented
```

---

> **Maps to PRODUCT-PLAN tasks:**
> P0-1/P0-2 → P0-E1-T2/T3 (prefix)
> P0-3 → P0-E2-T1 (jit-props / define tokens)
> P0-7 → P0-E2-T3 (remove demos)
> P1-5 → P0-E3-T6 (exports)
> P1-3 → P1-E1-T1 (aliases)
> P2-* → NEW tasks to add to PRODUCT-PLAN
