# line://ui Design System

**Note**: This project uses [bd (beads)](https://github.com/steveyegge/beads)
for issue tracking. Use `bd` commands instead of markdown TODOs.
See AGENTS.md for workflow details.

## Project Overview

line://ui is a headless UI component library built as native Web Components. It provides robust interaction logic via Zag.js state machines, full visual customisation via CSS `::part()` and CSS custom properties, and works in any framework or no framework at all.

**Key differentiators:** Framework-agnostic (Web Components), native `::part()` + CSS custom properties for styling, Zag.js state machines for logic, optional batteries-included themes, integrated developer tooling via inspector.

## Tech Stack

- **Runtime & Package Manager**: Bun (latest stable)
- **Bundler**: Vite 7+ with Rolldown
- **Lint & Format**: Biome (replaces ESLint + Prettier)
- **Component Framework**: Lit 3+
- **Component Logic**: Zag.js (state machines)
- **Utility Tokens**: Open Props (sizes, shadows, easings, typography) — all rewritten to `--line-*` at build time
- **Color Tokens**: Custom 12-level semantic system (28 palettes, light/dark mode)
- **CSS Processing**: PostCSS (plugins: import, jit-props, mixins, simple-vars, nested, preset-env, custom-media, cssnano)
- **Versioning**: Changesets
- **Types**: TypeScript 5.9+ with API Extractor

## Supervisors

- lit-web-components-supervisor (Luna) — packages/core: Lit components, mixins, controllers, TypeScript, Vite build
- theme-supervisor (Violet) — packages/theme: PostCSS pipeline, color palettes, design tokens, CSS themes
- infra-supervisor (Olive) — GitHub Actions CI/CD, Changesets versioning, Bun monorepo tooling

## Documentation Hierarchy

Agents and contributors must understand the three-tier documentation structure:

```
docs/PRODUCT-REQUIREMENTS-SPECIFICATION.md (PRD v0.7.0)
│   What & Why — product vision, component catalogue (132 components),
│   design token decisions, roadmap, phases, success metrics
│
├── docs/ARCHITECTURE.md
│     How — composition patterns, state management tiers (Pre-built/Custom/Static),
│     CSS dual-layer strategy, base class design, bundle splitting, form association
│
├── docs/PRODUCT-PLAN.md
│     When — phased execution plan, epic/task breakdown, dependency graphs,
│     done criteria per phase, critical path
│
├── docs/COMPETITIVE-COMPONENT-ANALYSIS.md
│     Positioning — component-by-component gap analysis vs Shoelace, Spectrum, etc.
│
└── .spec/
      Detail — architecture and per-component API contracts.
      Every spec follows COMPONENT-SPEC-TEMPLATE.md and has a status
      (DRAFT → APPROVED → IMPLEMENTED). Specs are created just-in-time
      before implementation begins.
      Naming: {SYSTEM}-SPEC.md for infrastructure (BASE-SPEC, ICON-REGISTRY-SPEC,
      STORYBOOK-SPEC), {NNNN}-{component}.md for components (0002-button.md).
```

| Task | Start here |
|------|-----------|
| Understanding project goals, phases, decisions | PRD |
| Learning composition patterns, tier classification, CSS strategy | ARCHITECTURE |
| Understanding execution order, dependencies, done criteria | PRODUCT-PLAN |
| Implementing any system or component | `.spec/` — find the matching spec by name |
| Comparing with competitors, identifying gaps | COMPETITIVE-COMPONENT-ANALYSIS |

## Repository Structure

```
vitamin/
├── packages/
│   ├── core/                         # Base class (LineElement), mixins, controllers, utilities
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
│           ├── schemas/             # Colour schemas (semantic mapping)
│           ├── themes/              # Ready-to-go themes per palette
│           ├── utils/               # Normalize, media queries, rules, general
│           └── line.css             # Main CSS bundle (target, currently vita.css)
├── docs/                             # Product requirements & planning docs
│   ├── PRODUCT-REQUIREMENTS-SPECIFICATION.md
│   ├── ARCHITECTURE.md
│   ├── PRODUCT-PLAN.md
│   └── COMPETITIVE-COMPONENT-ANALYSIS.md
├── .spec/                            # Architecture & component specs (API contracts)
│   ├── COMPONENT-SPEC-TEMPLATE.md    # Template for all specs
│   ├── {SYSTEM}-SPEC.md              # Infrastructure specs (e.g., BASE-SPEC, ICON-REGISTRY-SPEC)
│   └── {NNNN}-{component}.md         # Per-component specs (e.g., 0002-button.md)
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

| Package | npm name (target) | npm name (current) | Version |
|---------|-------------------|---------------------|---------|
| core | `@websublime/line-core` | `@websublime/vitamina-core` | 0.2.0 |
| theme | `@websublime/line-theme` | `@websublime/vitamina-theme` | 0.6.0 |

> **Branding refactor pending (Phase 0):** Package names, CSS variables, class names, and tag prefixes must be migrated from `vita-*` to `line-*`. See PRD §9.14 for the full migration table.

## Naming Convention

- **Brand / wordmark**: `line://ui` (always lowercase, always with `://`)
- **Tag prefix**: `line-` (e.g., `<line-button>`, `<line-dialog>`)
- **CSS custom property prefix**: `--line-*` (e.g., `--line-radius-2`, `--line-blue-9`)
- **CSS class prefix**: `.line-` (e.g., `.line-schema-blue`, `.line-is-background`)
- **CSS parts**: Short, semantic names reused across components (root, trigger, content, overlay, title, etc.)
- **Base class**: `LineElement`
- **npm packages**: `@websublime/line-*`

