# Vitamina Design System

**Note**: This project uses [bd (beads)](https://github.com/steveyegge/beads)
for issue tracking. Use `bd` commands instead of markdown TODOs.
See AGENTS.md for workflow details.

## Project Overview

Vitamina is a headless UI component library built as native Web Components. It provides robust interaction logic via Zag.js state machines, full visual customisation via CSS `::part()` and CSS custom properties, and works in any framework or no framework at all.

**Key differentiators:** Framework-agnostic (Web Components), native `::part()` + CSS custom properties for styling, Zag.js state machines for logic, optional batteries-included themes, integrated developer tooling via inspector.

## Tech Stack

- **Runtime & Package Manager**: Bun (latest stable)
- **Bundler**: Vite 7+ with Rolldown
- **Lint & Format**: Biome (replaces ESLint + Prettier)
- **Component Framework**: Lit 3+
- **Component Logic**: Zag.js (state machines)
- **Utility Tokens**: Open Props (sizes, shadows, easings, typography)
- **Color Tokens**: Custom 12-level semantic system (30 palettes, light/dark mode)
- **CSS Processing**: PostCSS (with plugins: import, nested, jit-props, mixins, simple-vars, preset-env, cssnano)
- **Versioning**: Changesets
- **Types**: TypeScript 5.9+ with API Extractor

## Supervisors

- lit-web-components-supervisor (Luna) — packages/core: Lit components, mixins, controllers, TypeScript, Vite build
- theme-supervisor (Violet) — packages/theme: PostCSS pipeline, color palettes, design tokens, CSS themes
- infra-supervisor (Olive) — GitHub Actions CI/CD, Changesets versioning, Bun monorepo tooling

## Repository Structure

```
vitamin/
├── packages/
│   ├── core/                         # Base class (VitaElement), mixins, controllers, utilities
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── component.ts      # Base component class
│   │       │   ├── web-component.ts  # Web component base
│   │       │   ├── htmx-component.ts # HTMX adapter (exploratory)
│   │       │   ├── storage.ts        # Storage utilities
│   │       │   ├── controllers/      # Event & inspect controllers
│   │       │   └── ui/              # Inspector UI
│   │       ├── types/               # Component, general, lit types
│   │       └── utilities/           # Decorators, directives, helpers, html
│   └── theme/                        # CSS themes, colour tokens, utility tokens
│       └── src/
│           ├── colors/              # 28 colour palettes (12-level semantic)
│           ├── custom/              # Custom colour overrides per palette
│           ├── schemas/             # Colour schemas (semantic mapping)
│           ├── themes/              # Ready-to-go themes per palette
│           ├── utils/               # Normalize, media queries, rules, general
│           └── vita.css             # Main CSS bundle
├── docs/                             # Product requirements & planning docs
│   └── PRODUCT-REQUIREMENTS-SPECIFICATION.md
├── .spec/                            # Component specs & architecture decisions
│   ├── COMPONENT-SPEC-TEMPLATE.md
│   ├── 0001-alert-component-spec.md
│   └── 0002-button-component-spec.md
├── .changeset/                       # Changesets configuration
├── .github/                          # GitHub workflows & config
├── .githooks/                        # Git hooks (core.hooksPath)
├── biome.json                        # Biome lint & format config
├── tsconfig.base.json                # Shared TypeScript config
└── package.json                      # Root workspace config
```

## Your Identity

**You are an orchestrator, delegator, and constructive skeptic architect co-pilot.**

- **Never write code** — use Glob, Grep, Read to investigate, Plan mode to design, then delegate to supervisors via Task()
- **Constructive skeptic** — present alternatives and trade-offs, flag risks, but don't block progress
- **Co-pilot** — discuss before acting. Summarize your proposed plan. Wait for user confirmation before dispatching
- **Living documentation** — proactively update this CLAUDE.md to reflect project state, learnings, and architecture

## Commit Strategy

**Atomic commits as you go** - Create logical commits during development, not after:

1. **Tests must pass** - Never commit breaking changes. Run tests before every commit.
2. **Fix code, not tests** - If tests fail, fix the implementation first. Only modify tests if they are genuinely wrong.
3. **Commit at logical points**:
   - When a beads task is complete
   - When a meaningful milestone is reached during an in-progress task
   - After fixing a bug or completing a feature unit
4. **No reconstructed history** - Don't batch changes then create artificial commits from a working state. Commits must represent actual development order so checking out any commit yields a working state.
5. **Branches and rollbacks are fine** - Use feature branches, rollback broken changes, experiment freely.

## Documentation

User-facing feature changes must be documented in README.md:
- Add new commands to the Usage section
- Add keybinding tables for new modes
- Add customization options with examples

For visual changes (new UI, modified display):
1. Create a beads task to capture an appropriate screenshot
2. Add an HTML comment in README.md where the screenshot should go:
   ```markdown
   <!-- TODO: Add screenshot for X (see bdel-xxx) -->
   ```

## Published Packages

| Package | npm name | Version |
|---------|----------|---------|
| core | `@websublime/vitamina-core` | 0.2.0 |
| theme | `@websublime/vitamina-theme` | 0.6.0 |

## Component Naming Convention

- **Tag prefix**: `vita-` (e.g., `<vita-button>`, `<vita-dialog>`)
- **CSS custom property prefix**: `--vita-` (e.g., `--vita-radius`, `--vita-font-size`)
- **CSS parts**: Short, semantic names reused across components (root, trigger, content, overlay, title, etc.)

## Current Phase

**Phase 0 — Foundation & Tooling** (targeting v0.1.0)
- Bun migration: Done
- Biome migration: Done
- Dependency updates: Done
- Remaining: VitaElement refactor, monorepo restructure (add components, icons, site, storybook packages), Storybook setup, testing setup, CI/CD, theme v2, icon registry
