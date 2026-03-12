# SPEC: Storybook & Documentation Setup (Phase 0, Epic 5)

**Status:** APPROVED
**Author:** Ada (architect)
**Date:** 2026-03-12
**Source PRD:** `docs/PRODUCT-REQUIREMENTS-SPECIFICATION.md` (v0.7.0, Approved) -- sections 5.1, 5.2, 5.4
**Source Architecture:** `docs/ARCHITECTURE.md` (sections 4, 5, 6)
**Source Plan:** `docs/PRODUCT-PLAN.md` (section 2.5, Epic 5)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Stack Choices](#2-stack-choices)
3. [Package Location & Structure](#3-package-location--structure)
4. [Storybook Configuration](#4-storybook-configuration)
5. [CEM Analyzer Integration](#5-cem-analyzer-integration)
6. [Addon Strategy](#6-addon-strategy)
7. [Theme Switching](#7-theme-switching)
8. [Story Structure Conventions](#8-story-structure-conventions)
9. [Documentation Page Content Outlines](#9-documentation-page-content-outlines)
10. [Foundation Token Stories](#10-foundation-token-stories)
11. [Build & Deploy](#11-build--deploy)
12. [Test Contracts](#12-test-contracts)
13. [Implementation Tasks](#13-implementation-tasks)

---

## 1. Overview

This spec defines the setup and configuration decisions for Storybook 8 within the line://ui monorepo. It covers stack choices, CEM integration for auto-generated API docs, story conventions, addon strategy, theme switching mechanics, and documentation page content. The goal is to prevent ad-hoc decisions during implementation and establish conventions that scale from Phase 0 (foundation pages) through Phase 8 (132 components).

### 1.1 What This Spec Is

A **setup and configuration spec** -- lighter than a full architecture spec. It defines:

- What to install and how to configure it
- Conventions for story organization and naming
- Integration contracts between CEM, Storybook, and the theme package
- Content outlines for the initial documentation pages

### 1.2 What This Spec Is NOT

- Not a component spec (no Zag.js machines, no CSS parts)
- Not a per-story authoring guide (that emerges from Phase 1 when components exist)
- Not a site spec (the Astro site at `packages/site/` is separate)

---

## 2. Stack Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Storybook version | **Storybook 8** (latest stable) | Current major version; Web Components support is mature |
| Framework integration | **`@storybook/web-components-vite`** | Native Web Components renderer + Vite builder. No React/Vue wrapper needed |
| Builder | **Vite** (via `@storybook/builder-vite`) | Mandated by project constraints (Vite 7+). No Webpack |
| Story format | **CSF3** for component stories, **MDX** for documentation pages | CSF3 is the current standard for interactive stories; MDX for prose-heavy guide pages |
| CEM integration | **`@custom-elements-manifest/analyzer`** + **`@storybook/addon-docs`** | CEM is the source of truth for component API; Storybook reads `custom-elements.json` for auto-generated props/events/slots/parts tables |
| Package manager | **Bun** | Project-wide constraint. All `bun add`, `bun run`, `bun install` |

### 2.1 Decisions and Trade-offs

**CSF3 vs MDX for component stories:** CSF3 is chosen for component playground stories because it provides type-safe `args`, `play` functions for interaction tests, and better tooling support. MDX is reserved for documentation-only pages (Getting Started, Theming, Customisation, Foundation) where narrative text dominates and interactive controls are secondary.

**Single renderer:** We use `@storybook/web-components-vite` exclusively. No React or Vue renderers. Components are documented as native Web Components -- the same way consumers use them.

**Vite builder, not Webpack:** The project mandates Vite 7+. Storybook's Vite builder shares configuration with the project's existing Vite setup, avoiding a parallel build tool.

---

## 3. Package Location & Structure

The Storybook package lives at `packages/storybook/` as a **private** workspace package (never published to npm).

```
packages/storybook/
  package.json                    # Private workspace package
  tsconfig.json                   # Extends root tsconfig.base.json
  .storybook/
    main.ts                       # Storybook main configuration
    preview.ts                    # Global decorators, parameters, theme loading
    preview-head.html             # Inject theme CSS into preview iframe
    manager.ts                    # Manager UI customisation (branding, favicon)
    theme.ts                      # Storybook UI theme (line://ui branding)
  src/
    getting-started/
      Installation.mdx            # P0-E5-T3
      Theming.mdx                 # P0-E5-T4
      Customisation.mdx           # P0-E5-T5
      IconSetup.mdx               # P0-E7-T2 (Epic 7, not this spec)
    foundation/
      Colours.mdx                 # P0-E5-T6
      Colours.stories.ts          # Interactive palette browser (CSF3)
      Typography.mdx              # P0-E5-T6
      Typography.stories.ts       # Type scale previews
      Spacing.mdx                 # P0-E5-T6
      Spacing.stories.ts          # Spacing scale visualization
      Shadows.mdx                 # P0-E5-T6
      Shadows.stories.ts          # Shadow catalog
      Motion.mdx                  # P0-E5-T6
      Motion.stories.ts           # Easing/timing previews
    components/                   # Empty in Phase 0; populated from Phase 1
      primitives/
      forms/
      overlays/
      navigation/
      data-display/
      layout/
      desktop-inspired/
      innovative/
      real-world/
    patterns/                     # Empty in Phase 0; populated from Phase 2+
    helpers/
      theme-decorator.ts          # Decorator for palette/mode switching
      token-grid.ts               # Reusable grid renderer for token visualization
      palette-swatch.ts           # Swatch renderer for colour stories
```

### 3.1 package.json

```json
{
  "name": "@websublime/line-storybook",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "storybook build -o dist",
    "test": "test-storybook"
  },
  "devDependencies": {
    "@storybook/web-components-vite": "^8.x",
    "@storybook/addon-a11y": "^8.x",
    "@storybook/addon-essentials": "^8.x",
    "@storybook/addon-links": "^8.x",
    "@storybook/addon-themes": "^8.x",
    "@storybook/blocks": "^8.x",
    "@storybook/test": "^8.x",
    "@storybook/test-runner": "^0.x",
    "@custom-elements-manifest/analyzer": "^0.x",
    "storybook": "^8.x",
    "lit": "^3.x"
  }
}
```

Note: `@websublime/line-core`, `@websublime/line-components`, and `@websublime/line-theme` are referenced as workspace dependencies (`workspace:*`). They are added as components and theme become available post-branding refactor (P0-E1).

---

## 4. Storybook Configuration

### 4.1 main.ts

```typescript
// packages/storybook/.storybook/main.ts
import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: [
    '../src/getting-started/**/*.mdx',
    '../src/foundation/**/*.mdx',
    '../src/foundation/**/*.stories.ts',
    '../src/components/**/*.mdx',
    '../src/components/**/*.stories.ts',
    '../src/patterns/**/*.mdx',
    '../src/patterns/**/*.stories.ts',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'API',
  },
  staticDirs: ['../public'],
  async viteFinal(config) {
    // Extend with project-specific Vite configuration if needed
    return config;
  },
};

export default config;
```

Key decisions:
- **`stories` glob order:** Getting Started first, then Foundation, then Components, then Patterns. This controls the sidebar navigation order.
- **`autodocs: 'tag'`:** Only components explicitly tagged with `autodocs` get auto-generated API pages. This prevents noise from helper stories.
- **`staticDirs`:** A `public/` directory for static assets (logos, images for docs).

### 4.2 preview.ts

```typescript
// packages/storybook/.storybook/preview.ts
import type { Preview } from '@storybook/web-components';
import { withThemeByClassName } from '@storybook/addon-themes';

// Import the full theme bundle for Storybook previews
import '@websublime/line-theme/dist/line.min.css';

const preview: Preview = {
  parameters: {
    docs: {
      // Point to custom-elements.json for auto-generated API tables
      source: { type: 'dynamic' },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        method: 'configure',
        order: [
          'Getting Started',
          ['Installation', 'Theming', 'Customisation', 'Icon Setup'],
          'Foundation',
          ['Colours', 'Typography', 'Spacing', 'Shadows', 'Motion'],
          'Components',
          ['Primitives', 'Forms', 'Overlays', 'Navigation', 'Data Display',
           'Layout', 'Desktop-Inspired', 'Innovative', 'Real-World'],
          'Patterns',
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        Blue: 'line-schema-blue',
        Red: 'line-schema-red',
        Green: 'line-schema-green',
        Purple: 'line-schema-purple',
        Orange: 'line-schema-orange',
        Cyan: 'line-schema-cyan',
        Pink: 'line-schema-pink',
        Amber: 'line-schema-amber',
        Indigo: 'line-schema-indigo',
        Teal: 'line-schema-teal',
        Crimson: 'line-schema-crimson',
        Violet: 'line-schema-violet',
        Tomato: 'line-schema-tomato',
        Gold: 'line-schema-gold',
        Bronze: 'line-schema-bronze',
        Brown: 'line-schema-brown',
        Grass: 'line-schema-grass',
        Lime: 'line-schema-lime',
        Mint: 'line-schema-mint',
        Sky: 'line-schema-sky',
        Plum: 'line-schema-plum',
        Mauve: 'line-schema-mauve',
        Slate: 'line-schema-slate',
        Sage: 'line-schema-sage',
        Olive: 'line-schema-olive',
        Sand: 'line-schema-sand',
        Gray: 'line-schema-gray',
        Yellow: 'line-schema-yellow',
      },
      defaultTheme: 'Blue',
      parentSelector: 'body',
    }),
    withThemeByClassName({
      themes: {
        Light: '',
        Dark: 'dark',
      },
      defaultTheme: 'Light',
      parentSelector: 'html',
    }),
  ],
};

export default preview;
```

Key decisions:
- **Two `withThemeByClassName` decorators:** One for palette (schema class on `body`), one for mode (dark class on `html`). This matches the existing theme system where `.line-schema-blue` on a container activates the blue palette and `.dark` on an ancestor activates dark mode.
- **All 28 palettes registered:** Every palette from the theme package is available in the toolbar dropdown. This is essential for visual QA across palettes.
- **`parentSelector` placement:** Schema class goes on `body` (scoped to preview), dark class goes on `html` (matches real-world usage where `.dark` is on `<html>` or `<body>`).

### 4.3 CEM Manifest Path

The `custom-elements.json` manifest is generated at the component package root (`packages/components/custom-elements.json` or `packages/core/custom-elements.json` depending on which package contains the component source). Storybook reads it via a `setCustomElementsManifest` call in preview.ts:

```typescript
// Added to preview.ts after CEM is configured (P0-E5-T2)
import manifest from '@websublime/line-components/custom-elements.json';
import { setCustomElementsManifest } from '@storybook/web-components';

setCustomElementsManifest(manifest);
```

This line is added in task P0-E5-T2 once `packages/components/` exists (P0-E3-T1) and CEM analyzer is configured.

---

## 5. CEM Analyzer Integration

### 5.1 What CEM Provides

The Custom Elements Manifest (`custom-elements.json`) is a JSON file describing every custom element's public API:

- **Properties/Attributes** (name, type, default, description)
- **Events** (name, detail type, description)
- **Slots** (name, description)
- **CSS Parts** (name, description)
- **CSS Custom Properties** (name, default, description)
- **Methods** (public methods, parameters, return types)

Storybook reads this manifest and auto-generates the API documentation tab for each component -- no manual table maintenance.

### 5.2 CEM Analyzer Configuration

```javascript
// packages/components/custom-elements-manifest.config.mjs
export default {
  globs: ['src/**/!(*.test|*.stories).ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts'],
  outdir: '.',
  litelement: true,
  fast: false,
  plugins: [],
};
```

Key decisions:
- **Analyzer runs on `packages/components/`** where Lit component source lives (post-P0-E3-T1 restructure).
- **`litelement: true`** enables Lit-specific analysis (decorators like `@property`, `@state`, `@customElement`).
- **Exclude test and story files** from the manifest to keep it clean.
- **Output to package root** (`custom-elements.json`) so it can be referenced from package.json exports and consumed by Storybook.

### 5.3 CEM Generation Script

Add to `packages/components/package.json`:

```json
{
  "scripts": {
    "analyze": "cem analyze",
    "analyze:watch": "cem analyze --watch"
  },
  "customElements": "custom-elements.json"
}
```

The `customElements` field in package.json is the standard pointer that tools (including Storybook) use to find the manifest.

### 5.4 CEM Authoring Contract

For CEM to generate complete metadata, component authors MUST use JSDoc annotations on Lit components:

```typescript
/**
 * A button component for triggering actions.
 *
 * @slot - Default slot for button content
 * @slot prefix - Content before the label
 * @slot suffix - Content after the label
 *
 * @csspart root - The button element
 *
 * @cssprop [--line-button-radius=var(--line-radius-2)] - Border radius
 * @cssprop [--line-button-font-size=var(--line-font-size-1)] - Font size
 *
 * @fires line-press - Fired when the button is pressed
 *
 * @tag line-button
 */
@customElement('line-button')
export class LineButton extends LineElement {
  /** Whether the button is disabled */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** The button variant */
  @property({ type: String }) variant: 'solid' | 'outline' | 'ghost' = 'solid';
}
```

This contract is enforced by the CEM generation check in CI (P0-E6-T3).

---

## 6. Addon Strategy

### 6.1 Included Addons

| Addon | Purpose | Phase |
|-------|---------|-------|
| `@storybook/addon-essentials` | Controls, Actions, Viewport, Backgrounds, Docs, Measure, Outline | P0 |
| `@storybook/addon-a11y` | axe-core accessibility auditing in the panel | P0 |
| `@storybook/addon-links` | Cross-story linking (e.g., from Guide pages to component pages) | P0 |
| `@storybook/addon-themes` | Palette and light/dark mode switching in toolbar | P0 |
| `@storybook/test` | `play` functions for interaction testing within stories | P0 |
| `@storybook/test-runner` | Headless test execution of play functions in CI | P0-E6 |

### 6.2 Explicitly NOT Included

| Addon | Reason |
|-------|--------|
| `@storybook/addon-storysource` | Source is visible via the Docs tab code snippets. Dedicated addon adds complexity with marginal value |
| `storybook-addon-designs` | No Figma designs to link at this stage. Can be added later if needed |
| `@storybook/addon-interactions` | Subsumed by `@storybook/test` in Storybook 8 |

### 6.3 a11y Addon Configuration

```typescript
// In preview.ts parameters
a11y: {
  config: {
    rules: [
      // Disable rules that conflict with Shadow DOM rendering in Storybook
      // Adjust as needed during implementation
    ],
  },
},
```

The a11y panel runs axe-core on every story. Zero violations is a hard requirement per the PRD (section 1.6). Violations found in the a11y panel during development must be fixed before merging.

---

## 7. Theme Switching

### 7.1 Mechanism

The theme package uses a **CSS class** system:

1. **Palette activation:** `.line-schema-{palette}` class on a container (e.g., `.line-schema-blue` on `<body>`)
2. **Dark mode:** `.dark` class on an ancestor (typically `<html>`)
3. **Both are independent** -- any palette works in light or dark mode

> **Note:** The `.dark` class is NOT prefixed with `line-` (unlike `.line-schema-*` and `.line-is-*`). It remains `.dark` because it is a global mode toggle, not a component-scoped class. This was verified during the branding refactor (E1-T4).

Storybook's `@storybook/addon-themes` with `withThemeByClassName` maps directly to this system. Two toolbar dropdowns appear:

- **Palette dropdown:** Lists all 28 palettes. Applies `.line-schema-{palette}` to `<body>` in the preview iframe.
- **Mode dropdown:** Light / Dark. Applies `.dark` to `<html>` in the preview iframe.

### 7.2 CSS Loading

The full theme bundle (`line.css` / `line.min.css`) is imported in `preview.ts`. This makes all 28 palettes, all schemas, and all utility tokens available to every story. In production, consumers import only the palettes they need -- but in Storybook, having everything loaded enables instant palette switching.

### 7.3 Storybook UI Theme (Manager)

The Storybook manager UI (sidebar, toolbar, panels) is separately themed via `manager.ts` using `@storybook/theming`:

```typescript
// packages/storybook/.storybook/manager.ts
import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'line://ui',
    brandUrl: 'https://line-ui.websublime.com',
    // brandImage: '/logo.svg',  // Add when logo exists
    colorPrimary: 'hsl(206, 100%, 50%)',      // --blue-9
    colorSecondary: 'hsl(211, 90%, 42%)',      // --blue-11
  }),
});
```

This is cosmetic branding only -- it does not affect the component preview iframe.

---

## 8. Story Structure Conventions

### 8.1 File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Component story (CSF3) | `{ComponentName}.stories.ts` | `Button.stories.ts` |
| Component docs (MDX) | `{ComponentName}.mdx` | `Button.mdx` |
| Guide page (MDX only) | `{PageName}.mdx` | `Installation.mdx` |
| Foundation story (CSF3) | `{TokenType}.stories.ts` | `Colours.stories.ts` |
| Foundation docs (MDX) | `{TokenType}.mdx` | `Colours.mdx` |

### 8.2 Story Title Convention

Titles use `/` separators matching the sidebar hierarchy:

```typescript
// Guide pages
export default { title: 'Getting Started/Installation' };
export default { title: 'Getting Started/Theming' };

// Foundation
export default { title: 'Foundation/Colours' };

// Components (organized by category from PRD section 4)
export default { title: 'Components/Primitives/Button' };
export default { title: 'Components/Forms/Input' };
export default { title: 'Components/Overlays/Dialog' };

// Patterns
export default { title: 'Patterns/Floating Label Field' };
```

### 8.3 Per-Component Story Template (Phase 1+)

Every component gets a CSF3 file with these named exports:

```typescript
// Standard exports per component story file
export default meta;          // Meta with title, component, tags: ['autodocs']
export const Playground;      // Primary interactive story with all controls
export const Variants;        // All visual variants side by side
export const Sizes;           // All size variants (if applicable)
export const WithSlots;       // Demonstrates slot usage
export const Anatomy;         // Visual breakdown of parts
export const Accessibility;   // Story with a11y panel focus
export const ThemedLight;     // With theme applied, light mode
export const ThemedDark;      // With theme applied, dark mode
```

And an optional MDX companion for narrative documentation (Overview, when to use, anatomy diagram).

### 8.4 CSF3 Pattern for Web Components

Web Components in Storybook use a render function returning a Lit `html` template:

```typescript
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '@websublime/line-components/button';

const meta: Meta = {
  title: 'Components/Primitives/Button',
  component: 'line-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost'],
    },
    disabled: { control: 'boolean' },
  },
  render: (args) => html`
    <line-button
      variant=${args.variant}
      ?disabled=${args.disabled}
    >
      ${args.label}
    </line-button>
  `,
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  args: {
    label: 'Click me',
    variant: 'solid',
    disabled: false,
  },
};
```

Note: `argTypes` are partially auto-populated from the CEM manifest. Manual `argTypes` are only needed for slot content (like `label` above) or to override control types.

---

## 9. Documentation Page Content Outlines

### 9.1 Getting Started: Installation (P0-E5-T3)

**Format:** MDX

**Content outline:**

1. **Prerequisites** -- Bun, supported browsers
2. **Install the packages**
   - `bun add @websublime/line-components` (components)
   - `bun add @websublime/line-theme` (optional theme)
3. **Import a component**
   - ESM bare import: `import '@websublime/line-components/button'`
   - Side-effect registration (explain that importing registers the custom element)
4. **Use in HTML**
   - Plain HTML example
   - Minimal working example with a `<line-button>`
5. **Framework integration snippets**
   - Vanilla HTML (no framework)
   - Lit
   - React (using the Web Component directly, no wrapper)
   - Vue (using the Web Component directly)
   - Svelte
   - Angular
   - Each snippet shows: import, template usage, event handling
6. **CDN usage**
   - unpkg / jsdelivr ESM import for no-build-step usage
7. **TypeScript support**
   - Types are included; mention `HTMLElementTagNameMap` augmentation
8. **Next steps** -- links to Theming and Customisation guides

### 9.2 Getting Started: Theming (P0-E5-T4)

**Format:** MDX

**Content outline:**

1. **Headless by default** -- components ship with zero visual opinion
2. **The theme package**
   - What it provides: 28 color palettes, 12 semantic levels per palette, light/dark mode, utility tokens
   - How to install: `bun add @websublime/line-theme`
3. **Applying a theme**
   - Import the full bundle: `@import '@websublime/line-theme/dist/line.min.css'`
   - Or import a single palette: `@import '@websublime/line-theme/dist/theme-blue.min.css'`
   - Add the schema class: `<body class="line-schema-blue">`
4. **Light and dark mode**
   - Add `.dark` class to `<html>` or any ancestor
   - How the 12-level scale inverts in dark mode (levels 1-12 map to 12-1)
   - `prefers-color-scheme` media query integration
5. **The 12-level semantic scale**
   - Table: level 1 (background) through level 12 (high-contrast text)
   - Diagram showing the semantic role of each level
   - Semantic variable names: `--background`, `--subtle-background`, ..., `--high-contrast`
6. **Switching palettes**
   - Change the `.line-schema-{palette}` class -- all semantic variables remap instantly
   - Scoped palettes: apply `.line-schema-{palette}` to any container for section-level theming
7. **Available palettes** -- visual grid showing all 28 palettes with their 12 levels
8. **Next steps** -- link to Customisation guide, link to Foundation/Colours

### 9.3 Getting Started: Customisation (P0-E5-T5)

**Format:** MDX

**Content outline:**

1. **The dual-layer customisation model**
   - Layer 1: CSS custom properties (`--line-*`) for token-level adjustments
   - Layer 2: `::part()` for total visual control
   - When to use which
2. **CSS Custom Properties**
   - Global tokens: `--line-radius`, `--line-font-size`, `--line-padding`
   - Per-component tokens: `--line-button-radius`, `--line-button-font-size`
   - Override at any scope (global, component type, instance)
   - Code examples at each scope level
3. **CSS Parts**
   - What `::part()` is (brief explainer with MDN link)
   - Standard parts vocabulary: `root`, `trigger`, `content`, `overlay`, `title`, `close`, etc.
   - Code example: styling `line-button::part(root)` with full custom styles
   - Compound selectors: `line-button::part(root):hover`
   - Listing available parts for a component (reference the API tab)
4. **Slots**
   - Default slot, named slots
   - How to discover available slots (reference the API tab)
   - Code example: adding icons to prefix/suffix slots
5. **Combining all three**
   - Real-world example: a fully customised button with custom properties, part overrides, and slot content
6. **Advanced: Shadow DOM boundaries**
   - Why `::part()` exists (cannot style inside Shadow DOM with regular selectors)
   - Forwarding parts in composed components (`exportparts`)

### 9.4 Foundation Token Stories (P0-E5-T6)

See [section 10](#10-foundation-token-stories) for detailed content.

---

## 10. Foundation Token Stories

Foundation stories visualize the design token system. Each section has both an MDX explainer page and a CSF3 interactive story.

### 10.1 Colours

**MDX page content:**
- The 28-palette system and why it exists
- The 12-level semantic scale with role descriptions
- How schemas map palette values to semantic variables
- Light vs dark mode inversion logic

**CSF3 stories:**
- **AllPalettes:** Grid of all 28 palettes, each showing 12 swatches (levels 1-12). Responds to the light/dark toolbar toggle.
- **SemanticScale:** Single palette (selected via arg) showing all 12 levels with labels (`--background`, `--subtle-background`, ..., `--high-contrast`).
- **PaletteComparison:** Side-by-side view of 2-4 selected palettes for comparison.
- **DarkModeToggle:** Same palette in light and dark side by side.

**Implementation approach:** A reusable `<palette-swatch>` helper component (internal to Storybook, not published) renders a color swatch with hex value, HSL breakdown, and semantic label. The `Colours.stories.ts` file maps over the 28 palette names to generate the grid programmatically -- NOT 28 manually written stories.

**Data source:** The stories read CSS custom property values from the computed styles at runtime. This ensures the visualization always matches the actual theme output. No hardcoded color values in stories.

### 10.2 Typography

**MDX page content:**
- Open Props typography tokens used: `--line-font-size-*`, `--line-font-weight-*`, `--line-line-height-*`, `--line-font-*`
- How components reference type tokens
- Font loading considerations (no fonts bundled; consumer brings their own)

**CSF3 stories:**
- **TypeScale:** Visual ladder showing all font-size tokens applied to sample text.
- **FontWeights:** All weight tokens with sample text.
- **LineHeights:** Comparison of line-height tokens on multi-line text.

### 10.3 Spacing & Sizing

**MDX page content:**
- Open Props spacing tokens: `--line-size-*`
- Radius tokens: `--line-radius-*`
- How components use spacing tokens

**CSF3 stories:**
- **SpacingScale:** Boxes with each spacing token value, labeled and measured.
- **RadiusScale:** Boxes with each radius token applied to corners.

### 10.4 Shadows & Elevation

**MDX page content:**
- Open Props shadow tokens: `--line-shadow-*`
- Elevation hierarchy

**CSF3 stories:**
- **ShadowScale:** Cards with each shadow level applied, labeled.
- **ElevationStack:** Layered cards showing elevation hierarchy.

### 10.5 Motion & Easings

**MDX page content:**
- Open Props easing tokens: `--line-ease-*`
- Duration tokens
- When to use which easing curve

**CSF3 stories:**
- **EasingCurves:** Animated boxes demonstrating each easing token.
- **Durations:** Boxes animating at each duration token speed.

---

## 11. Build & Deploy

### 11.1 Local Development

```bash
cd packages/storybook
bun run dev          # Starts Storybook dev server on port 6006
```

### 11.2 Static Build

```bash
cd packages/storybook
bun run build        # Outputs to packages/storybook/dist/
```

Or from the root:

```bash
bun run --filter @websublime/line-storybook build
```

### 11.3 Deployment

**Target:** GitHub Pages (per PRD section 5.4).

- **Production:** Automatic deployment on merge to `main` via the release workflow (P0-E6-T4).
- **PR previews:** Automatic preview deployment per PR via the checks workflow (P0-E6-T3).
- **Output directory:** `packages/storybook/dist/` is the static build output.
- **Base URL:** Configure in `main.ts` via `viteFinal` if deployed to a subpath (e.g., `/storybook/`).

### 11.4 Build Dependencies

The Storybook build depends on:

1. Theme package built (`@websublime/line-theme` CSS outputs must exist)
2. Components package built (if component stories exist)
3. CEM manifest generated (`custom-elements.json` must exist)

The root-level `bun run build` must build packages in the correct order: theme -> core -> components -> storybook.

---

## 12. Test Contracts

### 12.1 Storybook Build Must Succeed

**Contract:** `bun run build` in `packages/storybook/` must exit with code 0. This is a CI check (P0-E6-T3).

**Validates:** All stories parse correctly, all imports resolve, no runtime errors during static build.

### 12.2 CEM Manifest Must Be Complete

**Contract:** After running `cem analyze` in `packages/components/`, the `custom-elements.json` file must contain an entry for every registered custom element.

**Validation (CI check):**
- Parse `custom-elements.json`
- For each component in the package exports, verify a matching `customElements` declaration exists
- Verify each declaration has `attributes`, `events`, `slots`, `cssParts`, and `cssProperties` arrays (may be empty, but must exist)

### 12.3 CEM and Storybook Integration Must Work

**Contract:** When Storybook loads with `setCustomElementsManifest(manifest)`, the API tab for any component tagged with `autodocs` must render a props table with at least one row.

**Validation:** Manual check during P0-E5-T2. Automated via Storybook test-runner interaction test in P0-E6.

### 12.4 Theme Switching Must Work

**Contract:** Changing the palette dropdown in the Storybook toolbar must change the CSS custom property values in the preview iframe.

**Validation:** A `play` function test on a foundation story:
1. Render a swatch that reads `--solid-background` computed value
2. Switch palette via toolbar API (or verify that the class is applied to `<body>`)
3. Assert the computed value changed

### 12.5 a11y Addon Must Run

**Contract:** The a11y panel must report results (pass or fail) for every component story. Zero violations is the target.

**Validation:** The Storybook test-runner with the a11y preset runs `axe` on every story in CI.

---

## 13. Implementation Tasks

Tasks are ordered by dependencies. Complexity estimates: S (< 2 hours), M (2-4 hours), L (4-8 hours).

| # | Task ID | Title | Description | Dependencies | Supervisor | Complexity |
|---|---------|-------|-------------|--------------|------------|------------|
| 1 | P0-E5-T1 | Setup Storybook 8 | Install `@storybook/web-components-vite` and all addons in `packages/storybook/`. Create `main.ts`, `preview.ts`, `manager.ts`, `theme.ts`. Configure Vite builder. Add scripts to `package.json`. Verify `bun run dev` starts and `bun run build` succeeds with an empty story set. | P0-E3-T3 (storybook package scaffold exists) | Luna | M |
| 2 | P0-E5-T2 | Configure CEM Analyzer | Install `@custom-elements-manifest/analyzer` in `packages/components/`. Create `custom-elements-manifest.config.mjs`. Add `analyze` scripts. Wire `setCustomElementsManifest()` in Storybook `preview.ts`. Verify API tab renders for a test component (can use `LineElement` or a minimal stub). | P0-E5-T1, P0-E4-T1 (LineElement exists to analyze) | Luna | M |
| 3 | P0-E5-T3 | Create Getting Started: Installation | Write `src/getting-started/Installation.mdx` per the content outline in section 9.1. Include code snippets for all 6 frameworks. Verify it renders correctly in Storybook. | P0-E5-T1 | Luna | S |
| 4 | P0-E5-T4 | Create Getting Started: Theming | Write `src/getting-started/Theming.mdx` per the content outline in section 9.2. Reference theme package CSS files. Include the 12-level scale diagram. Verify palette switching works via the toolbar when reading this page. | P0-E5-T1, P0-E2-T5 (theme pipeline verified) | Violet | S |
| 5 | P0-E5-T5 | Create Getting Started: Customisation | Write `src/getting-started/Customisation.mdx` per the content outline in section 9.3. Include interactive code examples showing `::part()` and CSS custom property overrides. | P0-E5-T1 | Luna | S |
| 6 | P0-E5-T6 | Create Foundation token stories | Build all 5 Foundation sections (Colours, Typography, Spacing, Shadows, Motion). Create helper components (`palette-swatch`, `token-grid`). Write both MDX pages and CSF3 interactive stories per section 10. This is the largest task in the epic. | P0-E5-T1, P0-E2-T5 (theme pipeline verified) | Violet | M |

### 13.1 Dependency Chain

```
P0-E3-T3 (storybook scaffold)
  |
  v
P0-E5-T1 (Storybook setup) -----> P0-E5-T3 (Installation guide)
  |                          -----> P0-E5-T5 (Customisation guide)
  |
  +-- P0-E4-T1 (LineElement) ----> P0-E5-T2 (CEM Analyzer)
  |
  +-- P0-E2-T5 (theme pipeline) -> P0-E5-T4 (Theming guide)
                                 -> P0-E5-T6 (Foundation tokens)
```

Tasks T3 and T5 can start immediately after T1. Tasks T4 and T6 require the theme pipeline (P0-E2-T5). Task T2 requires both T1 and the LineElement base class (P0-E4-T1).

### 13.2 Parallel Opportunities

- T3 (Installation) and T5 (Customisation) can run in parallel after T1 completes.
- T4 (Theming) and T6 (Foundation) can run in parallel after T1 + E2-T5 complete.
- T2 (CEM) is independent of the documentation tasks (T3-T6) and can run whenever E4-T1 is ready.

---

## Appendix A: Post-Phase 0 Conventions

These conventions are established now but only become relevant when component stories are authored in Phase 1+.

### A.1 Per-Component Storybook Sections (from PRD 5.1)

Every component story file should produce these documentation sections:

| Section | Source | Notes |
|---------|--------|-------|
| Overview | MDX companion file | Description, when to use, when not to use |
| Playground | CSF3 primary story | Interactive controls for all props |
| Anatomy | MDX or story | Visual diagram of parts and slots |
| Parts & Properties | Auto-generated from CEM | `::part()` names and `--line-*` custom properties |
| Slots | Auto-generated from CEM | Available slots |
| Accessibility | CSF3 story + MDX | Keyboard shortcuts, ARIA roles, screen reader behaviour |
| Examples | CSF3 named exports | Real variants -- themed and unthemed |
| API | Auto-generated from CEM (`autodocs` tag) | Props, events, methods, CSS custom properties |

### A.2 Interaction Testing Convention

Phase 1 stories should include `play` functions for critical user flows:

```typescript
export const ClickInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};
```

These are executed by `@storybook/test-runner` in CI (P0-E6-T3).
