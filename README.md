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

[![Version](https://img.shields.io/badge/version-0.7.0-c8ff00?style=flat-square&labelColor=1a1a1a)](https://github.com/websublime/line-ui/releases)
[![Components](https://img.shields.io/badge/components-131-c8ff00?style=flat-square&labelColor=1a1a1a)](./docs/PRD.md)
[![License](https://img.shields.io/badge/license-MIT-c8ff00?style=flat-square&labelColor=1a1a1a)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/types-included-c8ff00?style=flat-square&labelColor=1a1a1a)](https://www.typescriptlang.org/)

[Documentation](https://line-ui.websublime.com) · [Storybook](https://line-ui.websublime.com/storybook) · [Changelog](./CHANGELOG.md)

<br/>

</div>

---



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

## Tech stack

| | |
|---|---|
| **Runtime** | [Bun](https://bun.sh) |
| **Bundler** | [Vite 8+](https://vitejs.dev) with [Rolldown](https://rolldown.rs) |
| **Components** | [Lit 3+](https://lit.dev) |
| **State machines** | [Zag.js](https://zagjs.com) |
| **Tokens** | Custom foundation tokens (`tokens.css`) + 28-palette colour system |
| **Lint & format** | [Biome](https://biomejs.dev) |

<br/>

## Contributing

Components require a spec in `docs/specs/` before implementation — see [`COMPONENT-SPEC-TEMPLATE.md`](./docs/specs/COMPONENT-SPEC-TEMPLATE.md).

```bash
git clone https://github.com/websublime/line-ui.git
cd line-ui
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
