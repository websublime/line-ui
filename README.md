<div align="center">

<br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="branding/logo-wordmark.svg">
  <source media="(prefers-color-scheme: light)" srcset="branding/logo-wordmark-dark.svg">
  <img alt="line://ui" src="branding/logo-wordmark.svg" width="280">
</picture>

<br/>
<br/>

**Headless UI primitives as native Web Components.**<br/>
State machines. Zero visual opinion. Framework-agnostic.

<br/>

[![Version](https://img.shields.io/badge/version-0.7.0-c8ff00?style=flat-square&labelColor=1a1a1a)](https://github.com/websublime/vitamin/releases)
[![Components](https://img.shields.io/badge/components-131-c8ff00?style=flat-square&labelColor=1a1a1a)](./docs/PRD.md)
[![License](https://img.shields.io/badge/license-MIT-c8ff00?style=flat-square&labelColor=1a1a1a)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/types-included-c8ff00?style=flat-square&labelColor=1a1a1a)](https://www.typescriptlang.org/)

[Documentation](https://line-ui.websublime.com) · [Storybook](https://line-ui.websublime.com/storybook) · [Changelog](./CHANGELOG.md)

<br/>

</div>

---

## Why line://ui

Most headless libraries lock you into one framework. line://ui doesn't.

Built on **Web Components** and powered by **Zag.js state machines**, every component works natively in React, Vue, Svelte, Angular, Astro, HTMX — or plain HTML. No wrappers. No adapters. No rewrites.

```html
<!-- That's it. Works everywhere. -->
<line-dialog>
  <line-dialog-trigger>
    <button>Open</button>
  </line-dialog-trigger>
  <line-dialog-content>
    <line-dialog-title>Confirm</line-dialog-title>
    <p>Are you sure?</p>
    <line-dialog-close>Close</line-dialog-close>
  </line-dialog-content>
</line-dialog>
```

<br/>

## What makes it different

<table>
<tr>
<td width="50%">

### 🔩 &nbsp; State machines, not spaghetti

Every interactive component is powered by [Zag.js](https://zagjs.com) — explicit states, predictable transitions, built-in accessibility. No ad-hoc event handlers.

</td>
<td width="50%">

### 🎨 &nbsp; Dual-layer styling

Quick adjustments via `--line-*` custom properties. Total control via `::part()`. Use one, the other, or both. Your call.

</td>
</tr>
<tr>
<td width="50%">

### 📦 &nbsp; Tree-shakeable

Import only what you use. Each component is a separate entrypoint. A button doesn't drag in a dialog.

</td>
<td width="50%">

### 🌐 &nbsp; Truly framework-agnostic

Native Web Components. No React wrapper, no Vue adapter. Write `<line-button>` once, use it in any stack — today and five years from now.

</td>
</tr>
</table>

<br/>

## Quick start

```bash
npm install @websublime/line-components @websublime/line-theme
```

```css
/* Import a theme (or don't — components work headless) */
@import '@websublime/line-theme/themes/blue';
```

```html
<!-- Use components -->
<script type="module">
  import '@websublime/line-components/button'
  import '@websublime/line-components/field'
  import '@websublime/line-components/input'
</script>

<line-field>
  <span slot="label">Email</span>
  <line-input type="email" required>
    <line-icon slot="prefix" name="mail"></line-icon>
  </line-input>
  <span slot="hint">We'll never share your email</span>
</line-field>

<line-button type="submit">
  <line-icon slot="prefix" name="send"></line-icon>
  Subscribe
</line-button>
```

<br/>

## Style it your way

```css
/* Adjust preset component tokens */
line-button {
  --line-button-radius: var(--line-radius-round);
  --line-button-height-md: 3rem;
}

/* Full control: override parts */
line-button::part(root) {
  background: linear-gradient(135deg, #c8ff00, #00ff88);
  border: none;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

<br/>

## Component catalogue

131 components across 10 categories, delivered in 8 phases.

| Category | Count | Highlights |
|----------|-------|------------|
| **Primitives** | 21 | Button, Avatar, Badge, Alert, Chip, Spinner, Presence |
| **Forms — Essential** | 15 | Input, Field, Select, Checkbox, Switch, Editable |
| **Forms — Advanced** | 14 | Combobox, DatePicker, ColorPicker, FileUpload, TagInput |
| **Overlays** | 8 | Dialog, Sheet, Popover, Tooltip, Toast |
| **Navigation** | 10 | Tabs, Accordion, Menu, Menubar, Breadcrumb, Pagination |
| **Data Display** | 13 | Table, Carousel, TreeView, QRCode, Timer |
| **Layout** | 7 | AppShell, Sidebar, Splitter, FloatingPanel |
| **Desktop-Inspired** | 11 | CommandPalette, Spotlight, StatusBar, MasterDetail |
| **Innovative** | 15 | KanbanBoard, DataGrid, DiffViewer, WheelPicker, Tour |
| **Real-World** | 17 | AudioPlayer, ChatBubble, CookieConsent, Terminal |

> Full catalogue with specs: [`docs/PRD.md`](./docs/PRD.md)

<br/>

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────┐
│  Zag.js     │     │  Lit 3+ Shadow DOM                   │
│  Machine    │────▶│                                      │
│             │     │  <div part="root">                   │
│  • State    │     │    <slot name="prefix"></slot>       │
│  • A11y     │     │    <slot></slot>                     │
│  • Keyboard │     │    <slot name="suffix"></slot>       │
│  • Focus    │     │  </div>                              │
└─────────────┘     └──────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              ::part(root)    --line-*       Consumer CSS
              Total control   Quick adjust   Full override
```

Three tiers of components:

| Tier | What | Examples |
|------|------|---------|
| **Pre-built** | Uses `@zag-js/*` machine | Dialog, Select, Combobox, Tabs |
| **Custom** | Custom `createMachine()` | Input, Field, TagInput, Sidebar |
| **Static** | No machine, pure presentation | Badge, Separator, Card, Skeleton |

> Architecture details: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

<br/>

## Theming

28 colour palettes × 12 semantic levels × light/dark mode. Based on Radix Colors.

```html
<!-- Apply a schema to any container -->
<body class="line-schema-blue">
  <!-- Everything uses blue palette semantics -->
</body>

<!-- Or scope different palettes -->
<section class="line-schema-blue">...</section>
<aside class="line-schema-crimson">...</aside>
```

```js
// Toggle dark mode
document.documentElement.classList.add('dark')
```

<br/>

## Roadmap

```
Phase 0 ─── Foundation & Tooling ──────────── v0.1.0   ← current
Phase 1 ─── 20 core primitives ────────────── v0.2.0
Phase 2 ─── 15 essential forms ────────────── v0.3.0
Phase 3 ─── 16 overlays & navigation ──────── v0.4.0
Phase 4 ─── 13 advanced forms ─────────────── v0.5.0
Phase 5 ─── 15 data display & nav ─────────── v0.6.0
Phase 6 ─── 16 layout & desktop ───────────── v0.7.0
Phase 7 ─── 18 innovative ─────────────────── v0.8.0
Phase 8 ─── 18 real-world / domain ────────── v0.9.0
                                         ──── v1.0.0
```

<br/>

## Project structure

```
packages/
├── core/           ← LineElement base class, mixins, utilities
├── components/     ← All 131 components (tree-shakeable)
├── theme/          ← Design tokens, 28-palette colour system, semantic aliases
├── presets/        ← Visual presets (CSS-only, component styling)
├── icons/          ← Agnostic icon registry + resolvers
├── site/           ← Documentation site (Astro)
└── storybook/      ← Interactive component playground

docs/
├── MANIFESTO.md           ← Vision, principles, governing laws
├── PRD.md                 ← Product requirements (v0.7.0, APPROVED)
├── ARCHITECTURE.md        ← Cross-cutting architectural decisions
├── PRODUCT-PLAN.md        ← Multi-phase roadmap
├── plans/                 ← Per-phase plans (00-plan-foundation.md, …)
├── specs/
│   ├── COMPONENT-SPEC-TEMPLATE.md
│   ├── {NN}-spec-{name}.md    ← Phase-prefixed specs (00-spec-base.md, …)
│   └── archive/               ← Historical per-component specs
├── research/              ← Phase-prefixed research (00-research-*.md)
├── COMPETITIVE-COMPONENT-ANALYSIS.md
├── DESIGN-SYSTEM-IMPLEMENTATION-GUIDE.md
└── THEME-GAP-ANALYSIS.md
```

<br/>

## Tech stack

| | |
|---|---|
| **Runtime** | [Bun](https://bun.sh) |
| **Bundler** | [Vite 7+](https://vitejs.dev) with [Rolldown](https://rolldown.rs) |
| **Components** | [Lit 3+](https://lit.dev) |
| **State machines** | [Zag.js](https://zagjs.com) |
| **Tokens** | Custom foundation tokens (`tokens.css`) + 28-palette colour system |
| **Lint & format** | [Biome](https://biomejs.dev) |

<br/>

## Contributing

Components require a spec in `docs/specs/` before implementation — see [`COMPONENT-SPEC-TEMPLATE.md`](./docs/specs/COMPONENT-SPEC-TEMPLATE.md).

```bash
git clone https://github.com/websublime/vitamin.git
cd vitamin
bun install
bun run dev
```

<br/>

## License

[MIT](./LICENSE) — Made by [@websublime](https://github.com/websublime)

<div align="center">
<br/>
<br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="branding/symbol-mark.svg">
  <source media="(prefers-color-scheme: light)" srcset="branding/symbol-mark-dark.svg">
  <img alt="://" src="branding/symbol-mark.svg" width="32">
</picture>

<br/>
<br/>
</div>
