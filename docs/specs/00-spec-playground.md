# SPEC: Multi-Schema Playground (Phase 0, Epic 10)

**Status:** APPROVED
**Author:** Ada (architect)
**Date:** 2026-05-12
**Phase:** 0 — Foundation
**Tier:** N/A (showcase application, not a published library component)
**Source Manifesto:** `docs/MANIFESTO.md`
**Source PRD:** `docs/PRD.md` (v0.7.0, APPROVED) — §9.14 (vita → line migration), §14 (showcase)
**Source Architecture:** `docs/ARCHITECTURE.md` — Composition Patterns, CSS dual-layer strategy, headless pattern
**Source Plan:** `docs/plans/00-plan-foundation.md` — Epic 10 (Multi-Schema Playground)
**Sibling Spec:** `docs/specs/00-spec-showcase.md` — App shell, navigation, panel registration
**Tracking bead:** `line-ui-m3d` (E10) and its child tasks `line-ui-m3d.1` … `line-ui-m3d.8`

---

## 0. Foreword — Architectural Constraint (NON-NEGOTIABLE)

Every composition block in this spec MUST follow the headless pattern. Quoting the
project memory entry `playground-headless-pattern`:

> All playground composition blocks must be separate custom elements following the
> headless pattern. Components define structure + layout only, expose `::part()` for
> every styleable zone, and accept generic CSS custom properties (NO `--line-*`
> tokens internally). The design system is applied FROM OUTSIDE by the consumer
> (`sc-page-playground`) via `::part()` selectors and host-level custom properties.
> This mirrors how real users will consume line://ui components.

The reference implementation is `apps/showcase/src/components/sc-product-card.ts`
(refactored in bead `line-ui-m3d.8`). Every block specified here MUST mirror that
contract:

1. The block's `static styles` references zero `--line-*` tokens internally.
2. Every styleable visual zone is exposed via `part="..."`.
3. Generic, block-scoped custom properties (`--card-*`, `--title-*`, `--chip-*`,
   `--button-*`, …) are declared on `:host` with neutral defaults.
4. The host page (`sc-page-playground`) applies design system tokens externally,
   either via `::part()` selectors or by setting the host custom properties.

Implementations that bake `--line-*` tokens into block internals must be rejected
in review, even if the visual result looks correct.

---

## Part A — Requirements

### 1. Description

The Multi-Schema Playground is an interactive page inside the showcase application
(`apps/showcase/`) where the line://ui team experiments with multi-schema visual
compositions before any of those patterns are committed to the homepage
(Epic 9, `sc-page-home`) or the Themes page (Epic 9.12, `sc-page-themes`).

The current showcase is monochromatic: schema is applied globally on `<body>`, so
every element resolves through a single palette. Real-world design systems
(Radix UI Themes, Spectrum, Material) routinely mix schemas on the same page —
neutral surfaces with colored accents, intent colors that stay fixed while the
brand accent changes, complementary tiers in a pricing table. The playground
materialises this in a dedicated panel so we can validate the composition
recipes against the actual `line-theme` token system before redesigning the
homepage.

The page consists of a sticky sidebar with explanatory notes and an editable
config of accent-reactive elements, alongside a scrollable content column hosting
**five composition blocks** plus the configuration system itself, each a separate
headless custom element wired to the nav-bar schema picker.

### 2. Use Cases

- **Validating accent propagation before E9.12** — Confirm that the nav schema
  picker correctly cascades into accent-responsive zones (price badges, primary
  CTAs, focus rings, progress fills) across heterogeneous compositions without
  bleeding into neutral surfaces.
- **Experimenting with complementary schemas** — Validate the static
  `COMPLEMENT_MAP` lookup (warm ↔ cool) on the pricing block so the homepage
  redesign can adopt the same pattern with confidence.
- **Demonstrating the headless pattern to consumers** — The playground doubles
  as the canonical example of how external consumers should style a line://ui
  component: `::part()` selectors + host custom properties on the consumer side,
  zero `--line-*` tokens inside the component.
- **Stress-testing mixed intent + accent** — Co-locate fixed intent schemas
  (success/green, warning/amber, danger/red) and a variable accent in the same
  block (Dashboard / Notifications) to prove they can coexist without conflict.
- **Sandbox for accent reactivity toggling** — `sc-schema-mapper` lets the
  developer toggle individual zones on/off, observing in real time which CSS
  vars actually drive the visual change.

### 3. When NOT to Use

| If you need... | Use instead |
|----------------|-------------|
| A production-ready, polished home page or marketing landing | `sc-page-home` (Epic 9) |
| A reference page that previews all 28 ready-to-go themes | `sc-page-themes` (Epic 9.12) |
| To test a single library component in isolation with controls | Storybook story (Epic 5 — `docs/specs/00-spec-storybook.md`) |
| To inspect L0/L2/L3 token tables, palette swatches, or alias breakdowns | `sc-page-colors`, `sc-page-semantic`, `sc-page-elements` (see `docs/specs/00-spec-showcase.md` §4) |
| A user-editable theme generator with CSS export | `sc-page-generator` (showcase §4.11) |
| To validate native form association or full a11y of a library component | A dedicated Storybook story or component spec — playground blocks are showcase-only |

### 4. User Expectations (acceptance criteria)

- When the user navigates to **Playground** in the nav, `<sc-page-playground>`
  mounts inside `<main>` with the persisted panel restored from
  `localStorage('line-panel')`.
- When the nav schema picker changes, every accent-responsive zone across all
  blocks updates **without** a page reload and **without** a re-mount of any
  block (Lit reactivity only).
- The page container itself never receives a `.line-schema-*` class — only
  individual blocks or sub-zones do. Light/dark is the only global state on the
  page root.
- The desktop layout shows a 260px sticky sidebar (top-anchored to the 52px
  nav height) and a scrolling content column up to 1400px wide.
- Below 768px the sidebar collapses into a mobile bar showing only the active
  accent name.
- Each block renders correctly in both light and dark mode (drives off the
  `:host([light])` selector).
- The sidebar config editor toggles which zones in each block respond to the
  accent picker; toggling off makes that zone revert to its block's base schema
  / neutral defaults.
- In `sc-login-block`, pressing `Enter` while focused on an input submits the
  block's form; pressing `Escape` clears any error state.
- In `sc-music-player`, the play/pause button toggles the play state visually
  (no audio API required) — the displayed progress is static.
- In `sc-pricing-block`, the Pro tier always reflects the picker accent and the
  Enterprise tier always reflects the complement looked up via `COMPLEMENT_MAP`.
- TypeScript compiles clean (`bun run typecheck`) and Biome lint passes on
  every file in the playground feature.

### 5. Connections

**Composes with (used together via slot or side-by-side):**

- `sc-product-card` — Headless product card consumed by `sc-page-playground`
  in two variants (slate, mauve). Established the headless pattern.
- `sc-login-block` — Headless login / sign-up form, neutral base + accent CTA.
- `sc-music-player` — Headless media player block, dark-forced surface.
- `sc-dashboard-block` — Headless dashboard with fixed-intent notifications and
  accent-reactive stat / toggles.
- `sc-pricing-block` — Headless 3-tier pricing comparison.
- `sc-schema-mapper` — Headless sidebar editor for `PlaygroundBlockConfig`
  entries.

**Depends on (requires another component to function):**

- `sc-app` (Epic 9, showcase shell) — Tracks `_panel`, `_schema`, `_light` and
  passes them to `sc-page-playground`.
- `sc-nav` (Epic 9.2) — Hosts the schema cycling chip that drives accent
  propagation.
- `@websublime/line-theme` — Provides all `--line-*` semantic tokens, palettes,
  L3 aliases, and `.line-schema-*` global declarations used by the consumer
  `::part()` selectors.

**Related (similar purpose, different use case):**

- `sc-page-themes` (Epic 9.12) — Will showcase the 28 theme bundles in their
  intended, polished form. The playground informs its design.
- `sc-page-home` (Epic 9.3) — Will pull validated patterns from the playground
  for the public homepage.
- `sc-page-generator` (Epic 9.13) — A different kind of experimentation: it
  generates custom palettes; the playground composes existing ones.

### 6. Variants

The **page itself** has no variants; it has a single layout.

The **composition blocks** carry their own variants, summarised in §15. Notably:

| Block | Variants |
|-------|----------|
| `sc-product-card` | `slate`, `mauve` (driven by class on the consumer) |
| `sc-login-block` | none in scope (error state is a runtime toggle, not a variant) |
| `sc-music-player` | none in scope |
| `sc-dashboard-block` | none in scope (the three notifications are part of the same render) |
| `sc-pricing-block` | none in scope; the Pro/Enterprise/Free tiers are a fixed 3-card composition |
| `sc-schema-mapper` | none in scope |

---

## Part B — Technical Specification

### 7. Anatomy

```
<sc-page-playground light schema="violet">
  ┌─────────────────────────────────────────────────────────────────────┐
  │ ::part(mobile-bar)   [<768px only]                                  │
  │   • ::part(mobile-accent-dot)   • ::part(mobile-accent-name)        │
  ├─────────────────────────────────────────────────────────────────────┤
  │ ::part(layout)  (flex row, max-width 1400)                          │
  │ ┌──────────────────────────┬──────────────────────────────────────┐ │
  │ │ ::part(sidebar) sticky   │ ::part(content) flex column          │ │
  │ │  • ::part(sidebar-title) │  ┌────────────────────────────────┐  │ │
  │ │  • ::part(sidebar-      │  │ ::part(block-wrapper)          │  │ │
  │ │      description)        │  │   <sc-login-block>             │  │ │
  │ │  • ::part(sidebar-      │  └────────────────────────────────┘  │ │
  │ │      accent)             │  ┌────────────────────────────────┐  │ │
  │ │     • ::part(accent-dot)│  │ ::part(block-wrapper)          │  │ │
  │ │     • ::part(accent-    │  │   <sc-product-card slate>      │  │ │
  │ │        name)             │  │   <sc-product-card mauve>      │  │ │
  │ │  • ::part(sidebar-note) │  └────────────────────────────────┘  │ │
  │ │  • <sc-schema-mapper>   │  ┌────────────────────────────────┐  │ │
  │ │      (config editor)     │  │ <sc-music-player>              │  │ │
  │ │                          │  └────────────────────────────────┘  │ │
  │ │                          │  ┌────────────────────────────────┐  │ │
  │ │                          │  │ <sc-dashboard-block>           │  │ │
  │ │                          │  └────────────────────────────────┘  │ │
  │ │                          │  ┌────────────────────────────────┐  │ │
  │ │                          │  │ <sc-pricing-block>             │  │ │
  │ │                          │  └────────────────────────────────┘  │ │
  │ └──────────────────────────┴──────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────────────────────┘
</sc-page-playground>
```

**Tags registered by this feature:**

| Tag | Role | Status |
|-----|------|--------|
| `<sc-page-playground>` | Page component — sidebar + content + mobile bar | implemented (T1) |
| `<sc-product-card>` | Headless e-commerce card | implemented (T3/T8) |
| `<sc-login-block>` | Headless login / sign-up form | planned (T2) |
| `<sc-music-player>` | Headless media block | planned (T4) |
| `<sc-dashboard-block>` | Headless dashboard with notifications + stats + toggles | planned (T5) |
| `<sc-pricing-block>` | Headless 3-tier pricing comparison | planned (T6) |
| `<sc-schema-mapper>` | Headless config editor (renders in the sidebar) | planned (T7) |

### 8. API

> All blocks are **headless**. Their CSS never references `--line-*`. The
> consumer (`sc-page-playground`) styles them via `::part()` selectors and
> by setting the block's `:host` custom properties. The tables below list
> the generic custom properties each block exposes and the parts available
> for external styling.

#### 8.1 `<sc-page-playground>`

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `light` | `boolean` (reflect: true) | `false` | Light mode flag; toggled by the app shell. |
| `schema` | `string` | `'violet'` | Active accent schema name from the nav picker. Passed to blocks. |
| `configs` (`@state`) | `PlaygroundBlockConfig[]` | `DEFAULT_BLOCK_CONFIGS` | Current accent-reactivity configuration (mutated by `sc-schema-mapper`). |

**Events:** None directly. The page consumes `sc-schema-change` events from the
app shell via the `schema` property.

**Slots:** None (the page composes blocks directly in its render method).

**Parts:**

| Part | Element | Purpose |
|------|---------|---------|
| `mobile-bar` | `<div>` | Top accent strip shown <768px |
| `mobile-accent-dot` | `<div>` | Colored dot in mobile bar |
| `mobile-accent-name` | `<span>` | Active schema text in mobile bar |
| `layout` | `<div>` | Two-column wrapper, max-width 1400px |
| `sidebar` | `<aside>` | Sticky sidebar |
| `sidebar-title` | `<h2>` | "Playground" heading |
| `sidebar-description` | `<p>` | Page description |
| `sidebar-accent` | `<div>` | Active-accent card |
| `accent-dot` | `<div>` | Colored dot inside `sidebar-accent` |
| `accent-name` | `<div>` | Schema name inside `sidebar-accent` |
| `sidebar-note` | `<p>` | Explanatory italic note |
| `content` | `<div>` | Right scrolling column |
| `block-wrapper` | `<div>` | Surrounds each block; carries neutral surface tokens |
| `product-grid` | `<div>` | 2-column grid for the product card row |

**Host data attributes:**

| Attribute | Condition | CSS usage |
|-----------|-----------|-----------|
| `[light]` | Light mode active | `:host([light]) ::part(...)` for mode overrides |

#### 8.2 `<sc-product-card>` (implemented — canonical reference)

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `heading` | `string` | `''` | Product title |
| `description` | `string` | `''` | Description text |
| `price` | `string` | `''` | Price string |
| `rating` | `string` | `''` | Visible rating glyphs (e.g. `'★★★★☆'`) |
| `ratingLabel` (`rating-label`) | `string` | `''` | A11y label |
| `imageSrc` (`image-src`) | `string` | `''` | Image URL |
| `imageAlt` (`image-alt`) | `string` | `''` | Image alt |
| `buttonLabel` (`button-label`) | `string` | `'Add to Cart'` | CTA label |
| `sizes` | `string` | `''` | Comma-separated chip labels |
| `activeSize` (`active-size`) | `number` | `-1` | Index of the active chip |
| `colors` | `{ color, label, selected? }[]` | `[]` | Color dot data (consumer-supplied) |

**Parts** (16 total): `card`, `image`, `image-placeholder`, `body`, `title`,
`description`, `price-row`, `price`, `rating`, `size-chips`, `chip`,
`chip-active`, `color-dots`, `dot`, `dot-selected`, `button`.

**Generic custom properties** (declared on `:host`):
`--card-radius`, `--card-padding`, `--card-gap`, `--card-image-height`,
`--card-border-width`, `--title-font-size`, `--title-font-weight`,
`--title-letter-spacing`, `--desc-font-size`, `--desc-line-height`,
`--price-font-size`, `--price-font-weight`, `--rating-font-size`,
`--rating-letter-spacing`, `--chip-min-width`, `--chip-height`,
`--chip-padding-inline`, `--chip-radius`, `--chip-font-size`,
`--chip-font-weight`, `--chip-border-width`, `--dot-size`,
`--dot-border-width`, `--button-padding`, `--button-radius`,
`--button-font-size`, `--button-font-weight`, `--placeholder-icon-size`.

#### 8.3 `<sc-login-block>` (planned — T2)

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `heading` | `string` | `'Sign in'` | Card heading text |
| `subtitle` | `string` | `''` | Card subtitle text |
| `submitLabel` (`submit-label`) | `string` | `'Sign in'` | Primary CTA label |
| `ssoLabel` (`sso-label`) | `string` | `'GitHub'` | Ghost SSO button label |
| `errorField` (`error-field`) | `'email' \| 'password' \| ''` | `''` | Drives the error state on one field |
| `errorMessage` (`error-message`) | `string` | `''` | Inline error copy |

**Events emitted:**

| Event | Detail | When fired |
|-------|--------|-----------|
| `sc-login-submit` | `{ email: string; password: string }` | User pressed Enter inside an input or clicked the primary CTA |

**Parts:** `card`, `heading`, `subtitle`, `field`, `field-error`, `label`,
`input`, `divider`, `divider-text`, `btn-submit`, `btn-sso`, `footer-link`.

**Generic custom properties (`:host`):**

| Property | Controls |
|----------|----------|
| `--card-radius`, `--card-padding`, `--card-gap`, `--card-border-width` | Shell |
| `--heading-font-size`, `--heading-font-weight` | Heading typography |
| `--subtitle-font-size`, `--subtitle-line-height` | Subtitle typography |
| `--label-font-size`, `--label-font-weight` | Field label typography |
| `--input-height`, `--input-padding-inline`, `--input-radius`, `--input-border-width`, `--input-font-size` | Input geometry |
| `--input-focus-ring-width`, `--input-focus-ring-offset` | Focus ring geometry |
| `--button-padding`, `--button-radius`, `--button-font-size`, `--button-font-weight` | Both CTAs |
| `--divider-gap`, `--divider-font-size` | "or continue with" row |

**Host data attributes:**

| Attribute | Condition | CSS usage |
|-----------|-----------|-----------|
| `[data-error="email"]` / `[data-error="password"]` | `errorField` matches that field | Consumer scopes red tokens on `::part(field-error)` for the affected field only |

#### 8.4 `<sc-music-player>` (planned — T4)

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `trackTitle` (`track-title`) | `string` | `''` | Current track |
| `artist` | `string` | `''` | Current artist |
| `progress` | `number` | `40` | Progress percentage (0–100) |
| `volume` | `number` | `70` | Volume percentage (0–100) |
| `playing` | `boolean` (reflect) | `false` | Toggled by play/pause; consumer can flip styling via `[playing]` |
| `playlist` | `{ title: string; artist: string; active?: boolean }[]` | `[]` | Playlist rows |

**Events emitted:**

| Event | Detail | When fired |
|-------|--------|-----------|
| `sc-player-toggle` | `{ playing: boolean }` | User clicked the play/pause control |
| `sc-player-seek` | `{ value: number }` | User clicked the progress track (showcase-only; no audio) |
| `sc-player-volume` | `{ value: number }` | User clicked the volume track |

**Parts:** `card`, `album-art`, `track-info`, `track-title`, `artist`,
`progress`, `progress-track`, `progress-fill`, `progress-time`, `controls`,
`ctrl-btn`, `ctrl-play`, `volume`, `volume-icon`, `volume-track`,
`volume-fill`, `playlist`, `playlist-item`, `playlist-item-active`.

**Generic custom properties (`:host`):**

| Property | Controls |
|----------|----------|
| `--card-radius`, `--card-padding`, `--card-gap` | Shell |
| `--album-art-size`, `--album-art-radius`, `--album-art-gradient` | Art placeholder. `--album-art-gradient` is a *full* `background` value supplied by the consumer (string, not a token reference). |
| `--track-title-font-size`, `--track-title-font-weight` | Title typography |
| `--artist-font-size` | Artist typography |
| `--progress-height`, `--progress-radius` | Progress bar geometry |
| `--ctrl-size`, `--ctrl-radius`, `--ctrl-border-width`, `--ctrl-play-size` | Transport controls geometry |
| `--volume-height`, `--volume-radius` | Volume slider geometry |
| `--playlist-row-height`, `--playlist-row-padding`, `--playlist-active-border-width` | Playlist row geometry |
| `--surface-color-scheme` | A consumer-set value (`dark`, `light`, `dark light`) so the player can force its surface; see §16 D5. |

#### 8.5 `<sc-dashboard-block>` (planned — T5)

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `notifications` | `{ kind: 'success' \| 'warning' \| 'danger'; title: string; body: string }[]` | `[]` | Fixed-intent alerts |
| `stats` | `{ value: string; label: string; intent: 'info' \| 'success' \| 'warning' \| 'accent' }[]` | `[]` | Stat cards; `accent` reacts to the picker |
| `toggles` | `{ label: string; on: boolean }[]` | `[]` | Settings toggles |

**Events emitted:**

| Event | Detail | When fired |
|-------|--------|-----------|
| `sc-toggle-change` | `{ index: number; on: boolean }` | A toggle was flipped |

**Parts:** `container`, `section`, `section-title`, `notif-row`, `notif`,
`notif-success`, `notif-warning`, `notif-danger`, `notif-icon`, `notif-title`,
`notif-body`, `stats-grid`, `stat-card`, `stat-card-info`, `stat-card-success`,
`stat-card-warning`, `stat-card-accent`, `stat-value`, `stat-label`,
`toggle-list`, `toggle-row`, `toggle-label`, `toggle`, `toggle-on`, `toggle-off`.

**Generic custom properties (`:host`):**

| Property | Controls |
|----------|----------|
| `--container-radius`, `--container-padding`, `--section-gap` | Shell |
| `--section-title-font-size`, `--section-title-font-weight`, `--section-title-letter-spacing` | Section headings |
| `--notif-radius`, `--notif-padding`, `--notif-gap`, `--notif-border-width` | Notification geometry |
| `--stat-card-radius`, `--stat-card-padding`, `--stat-value-font-size`, `--stat-value-font-weight`, `--stat-label-font-size` | Stat geometry |
| `--toggle-row-height`, `--toggle-width`, `--toggle-radius`, `--toggle-thumb-size` | Toggle geometry |

#### 8.6 `<sc-pricing-block>` (planned — T6)

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `accentSchema` (`accent-schema`) | `string` | `''` | Active accent (used to compute the complement). Passed by the page. |
| `tiers` | `{ name: string; price: string; period?: string; features: { available: boolean; text: string }[]; cta: string; weight: 'ghost' \| 'solid' \| 'outline' }[]` | `[]` | Tier cards in display order |

**Events emitted:**

| Event | Detail | When fired |
|-------|--------|-----------|
| `sc-pricing-cta` | `{ tierIndex: number }` | A tier CTA was clicked |

**Parts:** `grid`, `tier-card`, `tier-card-featured`, `tier-card-enterprise`,
`badge`, `tier-name`, `price`, `price-amount`, `price-period`, `features`,
`feature`, `feature-check`, `feature-dash`, `cta`, `cta-ghost`, `cta-solid`,
`cta-outline`.

**Generic custom properties (`:host`):**

| Property | Controls |
|----------|----------|
| `--grid-gap` | Card spacing |
| `--card-radius`, `--card-padding`, `--card-border-width` | Tier card shell |
| `--badge-radius`, `--badge-padding`, `--badge-font-size`, `--badge-font-weight` | "Recommended" badge |
| `--tier-name-font-size`, `--tier-name-font-weight` | Tier heading |
| `--amount-font-size`, `--amount-font-weight`, `--period-font-size` | Price typography |
| `--feature-font-size`, `--feature-gap` | Feature list |
| `--cta-padding`, `--cta-radius`, `--cta-font-size`, `--cta-font-weight`, `--cta-border-width` | All CTA variants |

#### 8.7 `<sc-schema-mapper>` (planned — T7)

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `configs` | `PlaygroundBlockConfig[]` | `[]` | Mirrors `sc-page-playground._configs` |

**Events emitted:**

| Event | Detail | When fired |
|-------|--------|-----------|
| `sc-config-change` | `{ blockId: string; selector: string; accentReactive: boolean }` | A toggle was flipped |

**Parts:** `mapper`, `block`, `block-title`, `base-chip`, `element-row`,
`element-label`, `element-toggle`, `element-toggle-on`, `element-toggle-off`.

**Generic custom properties (`:host`):**

| Property | Controls |
|----------|----------|
| `--mapper-gap`, `--block-padding`, `--block-radius` | Shell geometry |
| `--block-title-font-size`, `--block-title-font-weight` | Block heading |
| `--base-chip-radius`, `--base-chip-padding`, `--base-chip-font-size` | Read-only base schema chip |
| `--row-height`, `--row-gap` | Toggle row geometry |
| `--toggle-width`, `--toggle-height`, `--toggle-thumb-size`, `--toggle-radius` | Toggle geometry |

### 9. States & Machine

All blocks are **Static tier** — no Zag.js machine. The page is also static. The
only reactive state is Lit's own property/`@state` system:

- `sc-page-playground._configs` (state) drives accent-reactivity per block.
- `sc-product-card._imageError` (state) flips to placeholder on image load
  failure (reference pattern, see m3d.8 refactor).
- `sc-login-block` may carry a local `_focused` index to drive `::part(input)`
  focus styling and an `errorField` reflected attribute.
- `sc-music-player` carries `playing` as a reflected boolean.
- `sc-dashboard-block` carries the toggles state if not provided via property.

No state machine is required because none of the blocks model multi-stage UI
flows; they are presentation surfaces with at most one binary local state.

### 10. Keyboard Navigation

**Page-wide (`sc-page-playground`):**

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | Anywhere in the page | Moves through, in DOM order: sidebar schema-mapper toggles → first block's interactive elements → next block, etc. |
| `Shift+Tab` | Anywhere | Reverse tab order |

**Per-block additions:**

| Block | Key | Context | Action |
|-------|-----|---------|--------|
| `sc-login-block` | `Enter` | Focus inside an input | Submits the form; emits `sc-login-submit` |
| `sc-login-block` | `Escape` | Anywhere in the block | Clears `errorField` / `errorMessage` |
| `sc-login-block` | `Tab` | Inside the card | Email → Password → Submit → SSO → Footer link |
| `sc-music-player` | `Space` / `Enter` | Focus on play/pause | Toggles `playing` |
| `sc-music-player` | `←` / `→` | Focus on progress | Decrement / increment progress by 5 (showcase-only) |
| `sc-dashboard-block` | `Space` / `Enter` | Focus on a toggle | Flips that toggle |
| `sc-pricing-block` | `Enter` / `Space` | Focus on a CTA | Emits `sc-pricing-cta` |
| `sc-schema-mapper` | `Space` / `Enter` | Focus on a toggle | Flips that toggle |
| `sc-product-card` | `Tab` | Inside the card | Chips → dots → Add to Cart button |

### 11. Accessibility

**ARIA roles per block:**

| Block | Role / semantics |
|-------|------------------|
| `sc-page-playground` | The page is a `<main>` child; no ARIA role on the host itself. Sidebar uses `<aside>`. |
| `sc-product-card` | The root `card` is non-interactive; the button is a real `<button type="button">`. Rating gets `aria-label` from `rating-label`. |
| `sc-login-block` | Uses a native `<form>` element internally so the browser provides default form semantics; labels are real `<label for="…">`. Error messages use `role="alert"` on `::part(field-error)`. |
| `sc-music-player` | Card uses `role="region" aria-label="Music player"`. Controls are real `<button>`s with `aria-label` (Play, Previous, Next). Progress uses `role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"`. |
| `sc-dashboard-block` | Notifications use `role="status"` (success/warning) or `role="alert"` (danger). Stat cards are plain text. Toggles are real `<button role="switch" aria-checked>`. |
| `sc-pricing-block` | Tiers use `role="group" aria-labelledby="…"`. Feature checks use `aria-label="included"` / `aria-label="not included"`. |
| `sc-schema-mapper` | Toggles are real `<button role="switch" aria-checked aria-label>`. |

**Form association:**

Playground blocks do **NOT** use the `FormAssociated` mixin. They are showcase
components, not published library components — they exist behind a native
`<form>` element where applicable (`sc-login-block`) and rely on the browser's
default form behaviour (submit on Enter, reset, autocomplete). The
`ElementInternals`-based form association is a contract of the public library
(`LineElement`), not of showcase blocks.

**WCAG AA contrast** is enforced by the **consumer** (`sc-page-playground`)
applying semantic tokens via `::part()`. Because the headless block has no
tokens internally, the only contrast concern is on the consumer side; using
`--line-high-contrast` / `--line-low-contrast` / `--line-solid-text` from the
appropriate schema is sufficient.

**Screen reader behaviour** is the browser default — no custom live regions
beyond `role="alert"` on the login error.

### 12. Bundle & Entrypoint

| | |
|---|---|
| **Entrypoint** | `apps/showcase/src/pages/playground.ts` (page) and `apps/showcase/src/components/sc-*.ts` (blocks) |
| **Type** | Application code (not published) |
| **Registers** | `sc-page-playground`, `sc-product-card`, `sc-login-block`, `sc-music-player`, `sc-dashboard-block`, `sc-pricing-block`, `sc-schema-mapper` |
| **Dependencies** | `lit`, `@websublime/line-theme` (consumed by the page for `::part()` styles) |
| **Build target** | `apps/showcase/` Vite bundle — not shipped to npm |

### 13. Markup Examples

**App-shell registration** (sibling of `docs/specs/00-spec-showcase.md` §3):

```ts
// apps/showcase/src/app.ts
import './pages/playground.js';

type PanelKey = 'home' | /* … */ | 'playground' | /* … */;

private _renderPanel() {
  switch (this._panel) {
    // …
    case 'playground':
      return html`
        <sc-page-playground
          ?light=${this._light}
          .schema=${this._schema}
        ></sc-page-playground>
      `;
  }
}
```

**Consumer applies tokens via `::part()` and host custom properties** (the
canonical example, lifted from the implemented slate / mauve variants):

```css
/* Inside sc-page-playground.styles */

.product-card-slate::part(card) {
  background: light-dark(var(--line-slate-2), var(--line-slate-11));
  border-color: light-dark(var(--line-slate-6), var(--line-slate-7));
}

.product-card-slate::part(title) {
  color: light-dark(var(--line-slate-12), var(--line-slate-1));
}

/* Shared accent zones — driven by the inherited body schema */
sc-product-card::part(price) { color: var(--line-solid-background); }
sc-product-card::part(rating) { color: var(--line-warning); }
sc-product-card::part(chip-active) {
  background: var(--line-solid-background);
  color: var(--line-solid-text);
  border-color: var(--line-solid-background);
}
sc-product-card::part(button) {
  background: var(--line-solid-background);
  color: var(--line-solid-text);
}
sc-product-card::part(button):hover {
  background: var(--line-solid-hover);
}
```

```html
<!-- And the markup, with per-instance schema via class -->
<div class="product-grid">
  <sc-product-card
    class="product-card-slate"
    heading="Classic Sneaker"
    price="$89.00"
    rating="★★★★☆"
    rating-label="4 out of 5 stars"
    sizes="S,M,L,XL"
    active-size="1"
    .colors=${[
      { color: 'var(--line-crimson-9)', label: 'Crimson' },
      { color: 'var(--line-violet-9)',  label: 'Violet'  },
      { color: 'var(--line-slate-9)',   label: 'Slate', selected: true }
    ]}
  ></sc-product-card>

  <sc-product-card
    class="product-card-mauve"
    heading="Heritage Backpack"
    price="$129.00"
    rating="★★★★★"
    rating-label="5 out of 5 stars"
    sizes="S,M,L,XL"
    active-size="0"
    .colors=${[
      { color: 'var(--line-indigo-9)',  label: 'Indigo' },
      { color: 'var(--line-teal-9)',    label: 'Teal', selected: true },
      { color: 'var(--line-crimson-9)', label: 'Crimson' }
    ]}
  ></sc-product-card>
</div>
```

### 14. Accent Propagation System

#### 14.1 Flow

```
[user clicks schema chip]
  → sc-nav emits 'sc-schema-change' { schema }
    → sc-app updates this._schema, sets body.line-schema-{schema}, persists 'line-schema'
      → sc-app re-renders <sc-page-playground .schema=${this._schema}>
        → sc-page-playground passes schema to each block
          → blocks render zones whose config entry is accentReactive=true with
            inherited --line-solid-background / --line-solid-text / --line-warning / …
            (custom properties cascade through shadow DOM boundaries)
```

Schema selectors (`.line-schema-*`) themselves do NOT pierce shadow DOM (see
finding `line-ui-p3v.59`). What does cross the boundary is **CSS custom property
inheritance**: once `--line-solid-background` is set on `<body>`, every shadow
root that uses `var(--line-solid-background)` resolves it from the inherited
chain. This is the foundation of the accent reactivity system.

#### 14.2 `PlaygroundBlockConfig` (final, expanded by T7)

```ts
// apps/showcase/src/pages/playground-config.ts

/**
 * One styleable zone inside a block that can be toggled accent-reactive.
 */
export interface BlockElementConfig {
  /** CSS selector fragment (without the leading dot) applied to the zone. */
  selector: string;
  /** Human label shown in sc-schema-mapper. */
  label: string;
  /** Whether the zone currently inherits the picker accent. */
  accentReactive: boolean;
}

/**
 * One composition block's accent-reactivity configuration.
 */
export interface PlaygroundBlockConfig {
  /** Unique block identifier ('login' | 'product' | 'player' | 'dashboard' | 'pricing'). */
  id: string;
  /** Sidebar title. */
  title: string;
  /** Schema applied to the block root wrapper. null = neutral defaults. */
  baseSchema: string | null;
  /** Complementary schema (only relevant for sc-pricing-block). */
  complementSchema?: string;
  /** Zones within the block whose accent reactivity can be toggled. */
  elements: BlockElementConfig[];
}

export const DEFAULT_BLOCK_CONFIGS: PlaygroundBlockConfig[] = [
  {
    id: 'login',
    title: 'Login / Sign-up',
    baseSchema: 'slate',
    elements: [
      { selector: 'btn-submit',  label: 'Submit button',     accentReactive: true },
      { selector: 'input-focus', label: 'Input focus ring',  accentReactive: true },
    ],
  },
  {
    id: 'product',
    title: 'Product Card',
    baseSchema: 'slate',
    elements: [
      { selector: 'price',        label: 'Price badge',         accentReactive: true },
      { selector: 'add-to-cart',  label: 'Add to Cart button',  accentReactive: true },
      { selector: 'chip-active',  label: 'Active size chip',    accentReactive: true },
    ],
  },
  {
    id: 'player',
    title: 'Music Player',
    baseSchema: 'gray',
    elements: [
      { selector: 'progress-fill',         label: 'Progress bar',          accentReactive: true },
      { selector: 'ctrl-play',             label: 'Play button',           accentReactive: true },
      { selector: 'playlist-item-active',  label: 'Active playlist row',   accentReactive: true },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    baseSchema: 'sand',
    elements: [
      { selector: 'stat-card-accent', label: 'Accent stat card', accentReactive: true },
      { selector: 'toggle-on',        label: 'Toggle (on)',      accentReactive: true },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing Table',
    baseSchema: null,
    elements: [
      { selector: 'tier-card-featured',   label: 'Pro tier card',                  accentReactive: true },
      { selector: 'tier-card-enterprise', label: 'Enterprise tier (complement)',   accentReactive: false },
      { selector: 'cta-solid',            label: 'Pro CTA button',                 accentReactive: true },
    ],
  },
];
```

#### 14.3 `COMPLEMENT_MAP` (for `sc-pricing-block`)

```ts
// apps/showcase/src/pages/playground-config.ts

export const COMPLEMENT_MAP: Record<string, string> = {
  // warm → cool
  amber:   'indigo', orange: 'indigo', tomato: 'indigo',
  red:     'violet', crimson: 'violet',
  pink:    'teal',   yellow:  'blue',
  // cool → warm
  blue:    'amber',  indigo:  'amber',
  violet:  'orange', purple:  'lime',
  cyan:    'pink',   teal:    'pink',
  sky:     'orange', mint:    'crimson',
  green:   'plum',   grass:   'plum',
  lime:    'purple',
  // neutrals → accents
  mauve:   'teal',   slate:   'amber',
  gray:    'blue',   sand:    'violet',
  sage:    'crimson', olive:  'violet',
  // earth → cool
  bronze:  'sky',    gold:    'sky',
  brown:   'sky',    plum:    'green',
};

export const complementSchema = (accent: string): string =>
  COMPLEMENT_MAP[accent] ?? 'indigo';
```

The map is intentionally static — it forms part of the documented "composition
recipe" referenced by future homepage work and is not derived algorithmically.

#### 14.4 Which CSS custom properties react to the accent?

The accent change updates only the variables that are scoped to a schema class.
For accent-reactive zones, the consumer uses these inherited tokens:

| Variable | Resolves through |
|----------|------------------|
| `--line-solid-background` | Active accent schema, level 9 |
| `--line-solid-text` | Active accent schema text-on-solid |
| `--line-solid-hover` | Active accent schema, level 10 |
| `--line-ui-border-hover` | Active accent schema, level 8 |
| `--line-high-contrast` / `--line-low-contrast` | Active schema (may be base or accent depending on placement) |

L3 alias tokens (`--line-warning`, `--line-success`, `--line-danger`,
`--line-info`, `--line-primary`) are **fixed-intent** and do NOT respond to the
accent picker — they resolve from `aliases.css` independent of any schema class.

### 15. Composition Block Inventory

| Tag | Status | Variants | Demonstrates | Bead |
|-----|--------|----------|--------------|------|
| `sc-product-card` | implemented | slate, mauve | Headless pattern; per-instance schema via class; rating intent alias; cross-schema dots | `line-ui-m3d.3`, `line-ui-m3d.8` |
| `sc-login-block` | planned | — | Neutral base + accent CTA; native `<form>`; error scoping via `data-error` attribute | `line-ui-m3d.2` |
| `sc-music-player` | planned | — | Forced dark surface; gradient album art via consumer-supplied background; transport controls | `line-ui-m3d.4` |
| `sc-dashboard-block` | planned | — | Mixed intent colors (success / warning / danger) coexisting with accent; toggles and stat reactivity via `PlaygroundBlockConfig` | `line-ui-m3d.5` |
| `sc-pricing-block` | planned | — | Complementary schema lookup; ghost / solid / outline CTA weight hierarchy; "Recommended" badge | `line-ui-m3d.6` |
| `sc-schema-mapper` | planned | — | The T7 reactivity engine — live-toggles accent participation per zone | `line-ui-m3d.7` |

### 16. Decision Log

#### D1 — Headless pattern is mandatory for all blocks (2026-03-27)

**Decision:** Every composition block in the playground MUST be a separate
custom element implementing the headless contract: structure + layout only,
zero `--line-*` tokens internally, every styleable zone exposed via `::part()`,
generic `:host` custom properties for structural overrides.

**Why:** The shadow DOM boundary defeats `.line-schema-*` class cascade — the
`:where(.line-schema-*)` selectors used in the global theme stylesheet are
declared in the light DOM and cannot reach selectors inside a shadow root. The
investigation in `line-ui-m3d.2` (and the refactor in `line-ui-m3d.8`) proved
that the only reliable way to drive theming through shadow DOM is by CSS
custom-property inheritance, which works regardless of class selectors. The
correct pattern is therefore: components are structural, the consumer applies
tokens externally — exactly how a real downstream user will consume line://ui
components.

**Supersedes:** Initial inline rendering in `sc-page-playground` (the original
T3 implementation that hardcoded `--line-slate-*` inside the page's styles).

#### D2 — Product card refactored from internal `--line-*` tokens to headless (2026-03-27)

**Decision:** The first implementation of T3 (`line-ui-m3d.3`) used `--line-*`
tokens directly inside the page's styles for the product card markup. Bead
`line-ui-m3d.8` refactored that into an extracted `<sc-product-card>` custom
element with zero `--line-*` references, 16 named `::part()` zones, and
generic `--card-*` / `--title-*` / `--chip-*` / `--button-*` / `--dot-*` host
custom properties.

**Why:** The original implementation worked only because it didn't actually use
a shadow DOM around the card — the markup was inlined in the page's render
method. As soon as multi-block isolation was needed (T2, T4–T6), the
inline-in-the-page approach would have prevented per-block headless reuse and
violated the design system's stated philosophy ("native `::part()` + CSS custom
properties for styling"). The refactor established the reference pattern that
all other blocks now follow.

**Supersedes:** The inline product card in `apps/showcase/src/pages/playground.ts`
prior to commit `6cc7f18` (`line-ui-m3d.8` close commit).

#### D3 — Playground uses panel-based rendering, not URL routing (inherited from showcase D2)

**Decision:** The playground is rendered as a `PanelKey` (`'playground'`)
inside `sc-app`'s switch statement. Panel state is persisted in
`localStorage('line-panel')`. No router is involved.

**Why:** Inherited from `docs/specs/00-spec-showcase.md` §10 Decision D2 — the
showcase is a single-page tool, not a multi-page site. Adding a route for the
playground would have required URLPattern polyfills, shadow DOM click
interception, and route configuration without observable benefit.

**Supersedes:** N/A — this is an explicit alignment with the parent showcase
spec, recorded here so downstream supervisors don't reinvent it.

#### D4 — Each block is a separate custom element, not a private render method (2026-03-27)

**Decision:** Each block (`sc-login-block`, `sc-music-player`,
`sc-dashboard-block`, `sc-pricing-block`, `sc-schema-mapper`) is a top-level
custom element registered in its own file under
`apps/showcase/src/components/`. Blocks are NOT private render methods on
`sc-page-playground`.

**Why:** Three forces converge on this choice. (1) The headless contract
requires a shadow DOM boundary around the block so that `::part()` selectors
have something to target — only a custom element provides that. (2) Each block
is independently styleable: the consumer can apply a different schema scope or
different host custom properties per instance (already demonstrated by the
slate / mauve product card variants). (3) Future extraction: once these
patterns mature, they will move into a dedicated `patterns` package or feed
the homepage redesign — having them already encapsulated as custom elements
makes that lift-and-shift trivial.

**Supersedes:** The placeholder approach in the initial T1 scaffold, where each
block was a `<div class="block-wrapper">` with placeholder text awaiting an
inline render.

#### D5 — Music player forces its own surface color scheme via a consumer-supplied custom property (2026-05-12)

**Decision:** `sc-music-player` does NOT force `color-scheme` or a `.dark` class
inside its own shadow DOM. Instead, it exposes a `--surface-color-scheme` host
custom property that the consumer (`sc-page-playground`) sets to `'dark'` so
that the player card always appears on a dark surface regardless of the page's
light/dark mode toggle.

**Why:** Forcing `color-scheme` inside the block would couple the headless
component to a global semantic (light/dark mode). The headless contract
demands the opposite: the block exposes a knob, the consumer turns it. The
consumer can then apply `:host([light]) sc-music-player { --surface-color-scheme: dark; }`
in `sc-page-playground` styles. This keeps the block reusable in contexts where
a light surface is desired.

**Supersedes:** The "force `.dark` on the wrapper or `color-scheme: dark` on
the wrapper element" approach suggested in `line-ui-m3d.4` design notes. The
spec resolves that open question.

---

## Implementation Tasks

These map 1:1 onto the existing m3d child beads. The spec consolidates their
acceptance criteria; the beads remain the source of truth for assignment and
tracking.

1. **T1** (`line-ui-m3d.1`) — Scaffold `<sc-page-playground>` and wire panel — **DONE**
2. **T2** (`line-ui-m3d.2`) — Build `<sc-login-block>` headless → `lit-web-components-supervisor`
3. **T3** (`line-ui-m3d.3` + `.8`) — `<sc-product-card>` headless refactor — **DONE**
4. **T4** (`line-ui-m3d.4`) — Build `<sc-music-player>` headless → `lit-web-components-supervisor`
5. **T5** (`line-ui-m3d.5`) — Build `<sc-dashboard-block>` headless → `lit-web-components-supervisor`
6. **T6** (`line-ui-m3d.6`) — Build `<sc-pricing-block>` headless + `COMPLEMENT_MAP` → `lit-web-components-supervisor`
7. **T7** (`line-ui-m3d.7`) — Build `<sc-schema-mapper>` + final `PlaygroundBlockConfig` → `lit-web-components-supervisor`

---

## Quality Checks

- [x] Requirements addressed (5 blocks + page + config system)
- [x] Trade-offs documented (D1–D5, plus the L3 alias vs accent split in §14)
- [x] Tasks actionable and map onto existing beads
- [x] Dependencies clear (E9 app shell + nav for accent propagation, line-theme for tokens)
- [x] Spec file written to `docs/specs/00-spec-playground.md`
- [x] Status: APPROVED, source PRD/Architecture/Plan referenced
- [x] Sibling spec (`00-spec-showcase.md`) cross-referenced
- [x] Headless pattern (Foreword + D1 + D2) recorded as non-negotiable
