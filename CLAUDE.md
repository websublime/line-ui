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
- **Foundation Tokens**: Explicitly defined in `tokens.css` (sizes, shadows, easings, typography, z-index, opacity, motion, radius, border-width, focus-ring) — 1:1 match with Open Props values, prefixed as `--line-*`
- **Color Tokens**: Custom 12-level semantic system (28 palettes, light/dark mode)
- **CSS Processing**: PostCSS (plugins: import, mixins, simple-vars, nested, preset-env, custom-media, cssnano)
- **Versioning**: Changesets
- **Types**: TypeScript 5.9+ with API Extractor

## Supervisors

- lit-web-components-supervisor (Luna) — packages/core: Lit components, mixins, controllers, TypeScript, Vite build
- theme-supervisor (Violet) — packages/theme: PostCSS pipeline, color palettes, design tokens, CSS themes
- infra-supervisor (Olive) — GitHub Actions CI/CD, Changesets versioning, Bun monorepo tooling

## Documentation Hierarchy

Agents and contributors must understand the documentation structure (mister-anderson v0.4.0 layout):

```
docs/MANIFESTO.md
│   Foundation — vision, principles, governing laws, out-of-scope. Every other
│   doc must align with the principles and governing laws here.
│
├── docs/PRD.md (v0.7.0, APPROVED)
│     What & Why — product vision, component catalogue (131 components),
│     design token decisions, roadmap, phases, success metrics
│
├── docs/ARCHITECTURE.md (APPROVED, living)
│     How — composition patterns, state management tiers (Pre-built/Custom/Static),
│     CSS dual-layer strategy, base class design, bundle splitting, form association
│
├── docs/plans/
│     When — per-phase execution plans (00-plan-foundation.md is APPROVED).
│     Each plan covers one phase: scope, epic/task breakdown, dependencies,
│     done criteria. Future phases (01-08) are split when reached via
│     /specification {NN}.
│
├── docs/PRODUCT-PLAN.md
│     Roadmap — multi-phase overview that bridges PRD and the per-phase plans.
│     Phase 0 detail is now in docs/plans/00-plan-foundation.md. Phases 1-8
│     remain as overviews here.
│
├── docs/specs/
│     Detail — architecture and per-component API contracts.
│     Naming: {NN}-spec-{name}.md (NN = phase number, e.g. 00-spec-base.md).
│     Every spec follows COMPONENT-SPEC-TEMPLATE.md and has a status
│     (DRAFT → APPROVED → IMPLEMENTED). Specs are created just-in-time
│     before implementation begins. Historical per-component specs live in
│     docs/specs/archive/.
│
├── docs/research/
│     Validation — research notes for plan assumptions, prefixed with phase
│     number (00-research-*.md).
│
├── docs/COMPETITIVE-COMPONENT-ANALYSIS.md
│     Positioning — component-by-component gap analysis vs Shoelace, Spectrum, etc.
│
├── docs/DESIGN-SYSTEM-IMPLEMENTATION-GUIDE.md
│     Layers — foundation tokens, semantic defaults, aliases, schemas, presets explained
│
└── docs/THEME-GAP-ANALYSIS.md
      Gaps — what is implemented vs what is specified, with actionable tasks
```

| Task | Start here |
|------|-----------|
| Understanding the product's foundational vision, principles, and laws | MANIFESTO |
| Understanding project goals, phases, decisions | PRD (`docs/PRD.md`) |
| Learning composition patterns, tier classification, CSS strategy | ARCHITECTURE |
| Understanding the multi-phase roadmap | `docs/PRODUCT-PLAN.md` |
| Working on a specific phase (scope, tasks, dependencies, done criteria) | `docs/plans/{NN}-plan-*.md` |
| Implementing any system or component | `docs/specs/` — find the matching `{NN}-spec-{name}.md` |
| Validating technical assumptions before spec | `docs/research/{NN}-research-*.md` |
| Comparing with competitors, identifying gaps | COMPETITIVE-COMPONENT-ANALYSIS |
| Understanding design system layers (tokens, aliases, presets) | DESIGN-SYSTEM-IMPLEMENTATION-GUIDE |
| Finding theme implementation gaps and next tasks | THEME-GAP-ANALYSIS |

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
├── docs/                             # Product, planning, and reference docs
│   ├── MANIFESTO.md                  # Vision, principles, governing laws (APPROVED)
│   ├── PRD.md                        # Product Requirements Specification (APPROVED)
│   ├── ARCHITECTURE.md               # Cross-cutting architectural decisions (APPROVED)
│   ├── PRODUCT-PLAN.md               # Multi-phase roadmap (overview)
│   ├── plans/                        # Per-phase plans (e.g. 00-plan-foundation.md)
│   ├── specs/                        # Architecture & component specs (API contracts)
│   │   ├── COMPONENT-SPEC-TEMPLATE.md    # Template for all specs
│   │   ├── {NN}-spec-{name}.md       # Phase-prefixed specs (e.g. 00-spec-base.md)
│   │   └── archive/                  # Historical per-component specs (0001-..., 0002-...)
│   ├── research/                     # Phase-prefixed research notes (00-research-*.md)
│   ├── COMPETITIVE-COMPONENT-ANALYSIS.md
│   ├── DESIGN-SYSTEM-IMPLEMENTATION-GUIDE.md
│   └── THEME-GAP-ANALYSIS.md
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
| presets | `@websublime/line-presets` | — | — |

> **Branding refactor pending (Phase 0):** Package names, CSS variables, class names, and tag prefixes must be migrated from `vita-*` to `line-*`. See PRD §9.14 for the full migration table.

## Naming Convention

- **Brand / wordmark**: `line://ui` (always lowercase, always with `://`)
- **Tag prefix**: `line-` (e.g., `<line-button>`, `<line-dialog>`)
- **CSS custom property prefix**: `--line-*` (e.g., `--line-radius-2`, `--line-blue-9`)
- **CSS class prefix**: `.line-` (e.g., `.line-schema-blue`, `.line-is-background`)
- **CSS parts**: Short, semantic names reused across components (root, trigger, content, overlay, title, etc.)
- **Base class**: `LineElement`
- **npm packages**: `@websublime/line-*`

