# SPEC: Phase 1 — Core Primitives

**Status:** APPROVED — Miguel on 2026-10-20, with every §10 row approved; amended by AM-001–AM-048 (§12)
**Author:** line://ui orchestrator (row 00-Z46)
**Date:** 2026-10-20
**Phase target:** line://ui v0.2.0
**Source PRD:** [`docs/PRD.md`](../PRD.md) (v0.8.27, APPROVED; approved against v0.8.19; amended by AM-001–AM-048)
**Source Plan:** [`docs/plans/01-plan-core-primitives.md`](../plans/01-plan-core-primitives.md) (APPROVED, revision 00-Z45, factual corrections 00-Z46, coherence revision 00-Z48)
**Source Architecture:** [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) (v0.8.12; approved against v0.8.5; amended by AM-001–AM-044)
**Source Research:**
- R1 — [`docs/research/01-research-a2ui-web-core.md`](../research/01-research-a2ui-web-core.md)
- R2 — [`docs/research/01-research-projection-technique.md`](../research/01-research-projection-technique.md)
- R3 — [`docs/research/01-research-descriptor-api.md`](../research/01-research-descriptor-api.md)
- R4 — [`docs/research/01-research-custom-elements-manifest.md`](../research/01-research-custom-elements-manifest.md)
- R5 — [`docs/research/01-research-mcp-apps.md`](../research/01-research-mcp-apps.md)
- R6 — [`docs/research/01-research-transports.md`](../research/01-research-transports.md)
- R7 — [`docs/research/01-research-zag-machines.md`](../research/01-research-zag-machines.md)
- R8 — [`docs/research/01-research-accessibility.md`](../research/01-research-accessibility.md)
- R9 — [`docs/research/01-research-packaging.md`](../research/01-research-packaging.md)
- R10 — [`docs/research/01-research-icon.md`](../research/01-research-icon.md)
- R10 round 2 — [`docs/research/01-research-icon-round2.md`](../research/01-research-icon-round2.md) (row 00-Z47, delivered)
- R11 — [`docs/research/01-research-typescript-7.md`](../research/01-research-typescript-7.md)
- R12 — [`docs/research/01-research-site-dogfooding.md`](../research/01-research-site-dogfooding.md)

> **What this document is.** The implementation specification for Phase 1 of line://ui. It is the implementable contract for the 9th package, the layer edges, the manifests, the platform and release tasks, the stream C prerequisites, the component contract table, stream G, the documentation, the landing page and the cross-cutting test rules. Section §10 records every decision it rests on.
>
> **What this document is NOT.** It is not a planning document. Scope, streams, dependencies and the exit criteria belong to the plan. It is not a research document. Facts come from the research notes R1–R12 and their addenda, not from new investigation. It is not a component spec. Each component's internals belong to its own `docs/specs/NNNN-<component>.md` (plan §2.3).

---

## 1. Goals

1. Ship the agent-driven UI foundation as `@websublime/line-genui`, the 9th published package, with descriptors, the `line` and `basic` catalogs, the frontend-tool emitter, the `<line-a2ui-surface>` preview, the CEM drift and coverage tests, the MCP Apps bridge and the transport recipes (plan §1, §2.1; PRD §7.3).
2. Ship the 20 core primitives in the `@websublime/line-components` umbrella, one subpath each (plan §1, §2.2).
3. Ship the validating set Button, Icon, Stack and Separator first, without descriptors (plan §1; PRD §7.3).
4. Let stream G validate on that set and add its descriptors (plan §1, §4.1).
5. Ship the other 16 components, each with its descriptor in the same PR (plan §1, §4.3).
6. Build the site landing page with Phase 1 components and deploy it at `line-ui.websublime.com` (plan §1, §2.8).
7. Move the workspace to TypeScript 7.x, with every `.d.ts` emitted by 7.x `tsc` (plan §2.9; D1).
8. Scaffold, wire and release `line-genui` with its layer edges, its trusted publisher and a first version of `0.2.0` (plan §2.6, §2.7).
9. Release every package at `0.2.0` through `release.yml` with provenance (plan §2.7, §7.4).

---

## 2. Non-Goals

These stay out of Phase 1, and no task in this spec introduces them (plan §3).

- Phase 2+ components (PRD §7.4 onward) and the basic-catalog types they bring (plan §3; ARCH §17.3).
- An A2UI v1.0 emitter, until v1.0 is final (plan §3; ARCH §17.3).
- The ARCH §17.8 items, each with the revisit trigger that plan §3 tabulates: WebMCP for form-associated elements, `<line-mcp-app-frame>`, server-side A2UI → `<line-*>` HTML, model-authored `<line-*>` markup, json-render and OpenUI renderers, headless chat primitives, and dev-time AI.
- Transport code. Transports exist as Storybook recipes only (plan §3; ARCH §17.5).
- `LineHtmxElement`, deferred until after 1.0 (plan §3).
- SSR and SSG investigation (plan §3; PRD §1.7).
- `line-form` and cross-field validation (plan §3).
- Utility classes. line://ui ships none (PRD §9.13; plan §7.4; §10 SD1).
- Component internals: parts, slots, custom properties, keyboard maps, roles left open in §6.C.4 and machine shapes. Each component spec owns them (plan §2.3).

---

## 3. Architecture Summary

### 3.1 Packages and apps

Phase 1 completes the target layout of 9 published packages and 2 apps (PRD §6.1). `line-genui` is the only new package (PRD §6.1, plan §2.6).

```
                       ┌──────────────────────── runtime ────────────────────────┐
 apps (private, not published)
   apps/site ─────────devDeps──────────┐         apps/storybook ──devDeps──┐
                                       ▼                                   ▼
                     @websublime/line-genui  (NEW, opt-in, Appendix D)
                       │ dependency             ┆ peer (lazy import())     ┆ peer (import type only)
                       ▼                        ▼                          ▼
                     @websublime/line-core ◄── @websublime/line-components    @websublime/line-icons
                       (LineElement,            │  (20 subpaths, Phase 1)        │
                        machine, styles)        ├──► line-themes ──► line-colors │
                                                │         └────────► line-schemas◄── line-utils
                                                ├──► line-utils                  │
                                                └──► line-tokens ◄───────────────┘
 externals (never inlined): lit, @zag-js/*, @a2ui/web_core, zod, every @websublime/* (§10 SD2)
```

- Arrows point from the dependent to its dependency (PRD §6.1 "Dependency rules").
- `line-genui -> line-core` is a `dependencies` edge. `line-components` is a peer loaded lazily through descriptor `load()`; `line-icons` is a peer for the `A2uiIconMap` and `A2uiIconName` types only (`import type`; the shipped `.d.ts` references `@websublime/line-icons/a2ui`), never loaded at run time (PRD §6.1, ARCH §17.1; §12 AM-008, L3R4-03; §12 AM-009, L3R5-01).
- No package depends on `line-genui` (PRD §6.1, ARCH §17.1).
- Apps reference `@websublime/*` only in `devDependencies` (`scripts/lint-layers.mjs:181-205`).
- `@websublime/line-testing` (`packages/line-testing/`) is a private workspace package, `"private": true` and never published, that holds the test helpers shared across packages (PRD §5.2, §6.1; §4.6; §6.Z.3). `lint-layers` treats a private package as an app (`scripts/lint-layers.mjs:181-205`), so `line-testing` holds no `@websublime/*` in `dependencies` or `peerDependencies`. `verify-pack` and `scripts/publish.mjs` skip it through `discoverPublishable` (`scripts/verify-pack.mjs:44-48`). A devDependency on it is not a layer edge (§3.2; §12 AM-048).

### 3.2 Layer edges

`dependencies` and `peerDependencies` both count as edges (PRD §7.3 item 9, plan §4.2 P2). `devDependencies` do not count (`scripts/lint-layers.mjs:12-16`).

| Package | Allowed `@websublime/*` edges | Field | Change in Phase 1 | Source |
|---|---|---|---|---|
| `line-tokens` | none (leaf) | — | none | Phase 00 spec §6.B |
| `line-colors` | none (leaf) | — | none | Phase 00 spec §6.B |
| `line-schemas` | none (leaf) | — | none | Phase 00 spec §6.B |
| `line-themes` | `line-colors`, `line-schemas` | `dependencies` | none | Phase 00 spec §6.B |
| `line-utils` | `line-schemas` | `dependencies` | none | Phase 00 spec §6.B |
| `line-core` | none | — | none | Phase 00 spec §6.B |
| `line-components` | `line-core`, `line-tokens`, `line-themes`, `line-utils` | `dependencies` | none | Phase 00 spec §6.B |
| `line-icons` | `line-tokens` | `dependencies` | none | Phase 00 spec §6.B |
| `line-genui` | `line-core` | `dependencies` | new row | PRD §6.1, §7.3 item 9 |
| `line-genui` | `line-components`, `line-icons` | `peerDependencies` | new row | PRD §6.1, §7.3 item 9 |

### 3.3 `ALLOWED_EDGES` change

Task P2 replaces the table in `scripts/lint-layers.mjs:59-68` with the block below. It also updates the header comment at `scripts/lint-layers.mjs:32-35` and `:47-58` so the source of truth reads "Phase 00 spec §6.B and Phase 1 spec §3.2".

```js
const ALLOWED_EDGES = Object.freeze({
  'line-tokens': new Set(),
  'line-colors': new Set(),
  'line-schemas': new Set(),
  'line-themes': new Set(['line-colors', 'line-schemas']),
  'line-utils': new Set(['line-schemas']),
  'line-core': new Set(),
  'line-components': new Set(['line-core', 'line-tokens', 'line-themes', 'line-utils']),
  'line-icons': new Set(['line-tokens']),
  'line-genui': new Set(['line-core', 'line-components', 'line-icons']),
});
```

- The guard already merges `dependencies` and `peerDependencies` before it checks an edge (`scripts/lint-layers.mjs:187-190`). P2 changes no checking logic.
- The field split in §3.2 (dependency versus peer) is a manifest contract that §4.1 fixes. `lint-layers` checks only the edge set.

## 4. Package Inventory & Exports

Only manifests that change in Phase 1 appear here. `line-tokens`, `line-colors`, `line-schemas` and `line-utils` keep their Phase 00 manifests except for the `version` bump (§7.2). P8 changes no script in the `tsc -b` packages among them (§7.1; §12 AM-032, L3R23-06). Blocks are JSONC. Comments name the task and the decision.

**Ownership by file class (§12 AM-022).** The table says which supervisor edits each class of file, whatever task the change rides on. Each P, C, G, D and S owner is the accountable supervisor (the Owner lines in §6 and the owners in plan §4.0): the one who runs the task on its branch; Z rows name the main session (plan §4.0 Z row; §12 AM-026, R19-L1-03). `git-workflow-manager` opens the PR (PROCESS §4, §6). When the task touches a class that the table gives to the other supervisor, the orchestrator (main session or `sdlc`) dispatches the other supervisor, one after the other on the same task branch, for the classes the Phase 1 spec §4 table gives it. The second dispatch adds no changeset entry; the accountable supervisor writes the changeset entry last, after the other dispatch returns, and names every published package the branch changed. "infra" cites `.claude/agents/infra-supervisor.md` and "wc" cites `.claude/agents/webcomponents-supervisor.md`. Where neither definition names a class, the row says so and follows the closest stated scope.

| File class | Edited by | Evidence |
|---|---|---|
| `.github/workflows/*` and `.githooks/*` | infra-supervisor | infra:98 ("GitHub Actions workflows under `.github/workflows/`"), :100 ("Git hooks under `.githooks/`"); wc:111 escalates "CI/CD, hooks" |
| `playwright.config.ts` and `bun-test-preload.ts` (this list is closed) | infra-supervisor | infra:104 ("Test harness plumbing (`bun-test-preload.ts`, Playwright config)") |
| Root `package.json` (scripts and `devDependencies`) and `bun.lock` | infra-supervisor | infra:88 ("`package.json` # root scripts"), :97 ("Bun workspace topology, root scripts"); wc:111 escalates "workspace topology". Neither definition names root `devDependencies` or `bun.lock`; the closest stated scope is workspace topology (infra:97) |
| Per-package `package.json` build wiring: scripts, `dependencies`, `peerDependencies`, `devDependencies`, `files`, `customElements`, `sideEffects`, and every `exports` entry the `exports` row below does not cover (P1 `./catalog` and `./a2ui`, P10 `./custom-elements.json` in `line-components`) | infra-supervisor | infra:97 ("per-package `package.json` build wiring and `exports` maps") |
| Per-package build config: `packages/*/vite.config.mjs`, `packages/*/tsconfig*.json` and `packages/*/custom-elements-manifest.config.mjs` (P10, G4), with P10's removal of the root `custom-elements-manifest.config.mjs` (§5), except the `vite.config.mjs` entry that a C or G row adds for the subpath it ships, which follows the `exports` row below (§4.2, "Each C task adds its own `exports` key and its own `vite.config.mjs` entry") | infra-supervisor | Neither definition names these files; wc:103 claims declaration output and wc:106 tests, but neither names these config files; the closest stated scope is infra:97 ("per-package `package.json` build wiring") |
| An `exports` entry that a C or G row adds for the subpath it ships: C1–C20 in `line-components` (§4.2, "Each C task adds its own `exports` key"); C22 `./registry`, `./resolvers/lucide` and `./resolvers/phosphor` and G2 `./a2ui` in `line-icons` (§4.3); G2 `./catalog.json` and G4 `./custom-elements.json` in `line-genui` (§4.1); G6 `./hosts/mcp-apps.css` in `line-themes` (§4.4) | webcomponents-supervisor | Orchestrator default kept from §12 AM-021 against infra:97: the entry exposes the source the row ships (wc:95-99, :101) |
| `apps/site` scaffold and deploy config, `apps/site/package.json` included | infra-supervisor | infra:87 ("`apps/site/` # Astro scaffold + Cloudflare Pages deploy"), :103 ("`apps/site` scaffold and its deploy config") |
| `apps/storybook` build wiring: `.storybook/main.ts`, the wiring in `.storybook/preview.ts`, `apps/storybook/package.json` | infra-supervisor | infra:104 ("Storybook build wiring") |
| `apps/site` page content and its tests | webcomponents-supervisor | Neither definition names site content; the closest stated scope is infra:107 ("docs content → `webcomponents-supervisor`") |
| Storybook stories and MDX | webcomponents-supervisor | wc:83 ("`apps/storybook/` # Storybook 10 + MDX docs"), :105 ("Storybook MDX docs") |
| Package source: `packages/*/src/` (`line-core/src/styles` and `line-testing/src/` included), `packages/line-core/__experimental__/` (the unbuilt H1 htmx spike, `line-core` code; §6.Z.3; §12 AM-048), CSS, every file under a package's `__tests__/` and under `apps/storybook/__tests__/` (package tests, with their mocks and fixtures, including the P5 bundle-splitting and registration harness, the P7 axe helper, the P11 visual helper, the P12 Roles visual files with their committed baselines, each C row's `.visual.ts` file and committed baselines, the C21 update-rate harness and the htmx harness self-test; the htmx harness itself lives in `packages/line-testing/src/`, §6.Z.3; §12 AM-048), package `README.md` and other docs content under `packages/*` | webcomponents-supervisor | wc:95-104, :97 ("shadow-DOM reset sheets"), :106 ("Tests for everything above"); infra:107 ("Package source, components, tokens, themes, docs content → `webcomponents-supervisor`") |
| `biome.json` | webcomponents-supervisor | wc:87 (tree), :106 ("Biome compliance"); the infra scope list (infra:96-104) does not name it |
| Generator scripts, `scripts/emit-catalog.mjs` included | webcomponents-supervisor | wc:95-96 ("and their generator scripts"); wc:99 gives it the catalogs that `emit-catalog.mjs` writes; neither definition names `emit-catalog.mjs` |
| `scripts/publish.mjs` and `.changeset/config.json` | infra-supervisor | infra:101 ("Changesets config and the release pipeline"), :118-119 ("stable and canary publishes run `scripts/publish.mjs`") |
| `scripts/lint-layers.mjs` | infra-supervisor | infra:123 ("`scripts/lint-layers.mjs` runs in CI"). wc:84 lists the file in its tree and wc:124 requires it to pass, but neither scope list names it; the closest stated scope is infra:123 |
| `scripts/verify-pack.mjs` and `scripts/report-size.mjs` | infra-supervisor | Neither scope list names them (infra:54 and wc:53 list `verify-pack` only as a Verify-record command). `verify-pack.mjs` runs as a `checks.yml` step (`.github/workflows/checks.yml:27`) and P5 adds `report-size.mjs` as one (§6.P.5), so the closest stated scope is infra:98 (workflows) and :101 (release pipeline) |
| `.npmrc` and `bunfig.toml` | infra-supervisor | infra:102 ("`.npmrc`, `bunfig.toml`") |
| `tsconfig.base.json` and `vite.config.shared.mjs` | infra-supervisor | infra:89 and wc:87 list both in their trees; neither scope list names them; the closest stated scope is infra:97 ("build wiring") |
| Any other file, including `packages/*/LICENSE`, the task's changeset entry and its `AM-nnn` rows | the accountable owner (the main session for Z rows) | No class above. Both definitions name changeset entries (infra:86, wc:106) |

### 4.1 `@websublime/line-genui` (new)

```jsonc
{
  "name": "@websublime/line-genui",
  "version": "0.1.0",                              // P1; seeded so a minor changeset yields 0.2.0 (§10 SD3, R9 §2.6)
  "type": "module",
  "license": "MIT",
  "files": ["dist", "src", "custom-elements.json"],// Phase 00 spec AM-036 pattern; G4: shipped manifest (§10 SD94)
  "repository": {                                  // Phase 00 spec AM-038: trusted publishing and provenance match this url
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-genui"
  },
  // no "sideEffects" field (§10 SD4, SD5); ./a2ui calls customElements.define() at module top
  "customElements": "./custom-elements.json",     // G4 (§10 SD94)
  "publishConfig": { "access": "public" },
  "exports": {
    "./custom-elements.json": "./custom-elements.json",   // G4 (§10 SD94)
    "./catalog": {                                 // PRD Appendix D: descriptors, catalogs, emitters; touches no DOM
      "types": "./dist/catalog/index.d.ts",
      "import": "./dist/catalog/index.js"
    },
    "./catalog.json": "./dist/catalog.json",       // PRD Appendix D; key added by G2 with its emitter; scripts/emit-catalog.mjs writes the file (§6.G.2)
    "./a2ui": {                                    // PRD Appendix D: session and <line-a2ui-surface>, Preview status
      "types": "./dist/a2ui/index.d.ts",
      "import": "./dist/a2ui/index.js"
    }
  },
  "dependencies": {
    "@a2ui/web_core": "0.14.0",                    // exact pin (§10 SD6, PRD §2 Agent-Driven UI row, R1 §2.1; §12 AM-009, L2R5-01)
    "@websublime/line-core": "workspace:^",
    "zod": "^3.25.76"                              // Zod 3 API (plan §5.6 defaults, R3 §2.2, R1 §2.2)
  },
  "peerDependencies": {                            // line-components: loaded lazily through descriptor load(); line-icons: A2uiIconMap and A2uiIconName types only (import type; the .d.ts references @websublime/line-icons/a2ui), never loaded at run time (PRD §6.1, ARCH §17.1; §10 SD9; §12 AM-008; §12 AM-009, L3R5-01)
    "@websublime/line-components": "workspace:^0.1.0 || ^0.2.0",   // two-minor range (§7.2; §10 SD76; §12 AM-028, AM-030); the first PR of a later phase that adds a minor changeset for line-components or line-icons widens this range on main before changeset version builds that phase's Version PR, for example || ^0.3.0
    "@websublime/line-icons": "workspace:^0.1.0 || ^0.2.0"
  },
  "devDependencies": {                             // P1: build order only, not a layer edge (§3.2; §12 AM-016, L3R10-03); same range as the peers at P1; the Phase 1 Version PR rewrites them to workspace:^0.2.0 (§7.2; §12 AM-028, AM-030)
    "@websublime/line-components": "workspace:^0.1.0 || ^0.2.0",
    "@websublime/line-icons": "workspace:^0.1.0 || ^0.2.0"
  },
  "scripts": {
    "build": "vite build && bun run ../../scripts/emit-catalog.mjs && tsc -p tsconfig.json --noEmit false --emitDeclarationOnly && bun run analyze",   // §10 SD7, D1; emit-catalog added by G2 after vite build, which empties dist/ (§6.G.2); analyze added by G4
    "analyze": "custom-elements-manifest analyze --config custom-elements-manifest.config.mjs",            // G4 (§10 SD94)
    "dev": "trap 'kill 0' INT TERM; vite build --watch & tsc -p tsconfig.json --noEmit false --emitDeclarationOnly --watch & wait",
    "clean": "rm -rf dist custom-elements.json",
    "typecheck": "tsc --noEmit"
  }
}
```

- The package has no root `"."` export. PRD Appendix D lists four `line-genui` surfaces, `./catalog`, `./catalog.json`, `./a2ui` and `./custom-elements.json`, and none is the root (§10 SD8).
- `@a2ui/web_core` 0.14.0 declares `lit ^3.3.3` and `zod ^3.25.76` among seven dependencies and no peers (R1 §2.2). A clean install resolves one `lit` and one `zod` (R1 §2.2, P4).
- `@a2ui/web_core` moves to a newer version only through an AM after the R1 and R2 probes run again (§10 SD6).
- Every bare specifier that `dist/` imports MUST appear in `dependencies` or `peerDependencies` (§10 SD2). A G task that adds a direct import of a package adds the declaration in the same PR. `./a2ui` never imports `lit` (§6.G.4).
- `vite.config.mjs` calls the shared factory as `shared({ root: import.meta.dirname, entries: { 'catalog/index': 'src/catalog/index.ts', 'a2ui/index': 'src/a2ui/index.ts' } })` (P1). The factory before P9 reads only `pkg.entries` (`vite.config.shared.mjs:10-16`) and ignores `root`, so P1 builds whether it lands before or after P9 (§12 AM-020, L3R14-10).
- P1 ships the manifest without the `customElements` field, the `custom-elements.json` `files` entry, the `./custom-elements.json` export and the `analyze` script. G4 adds them with the analyser config, as G2 adds `./catalog.json` (§10 SD23, SD94).
- The `peerDependencies` carry no `peerDependenciesMeta`. PRD §6.1 and ARCH §17.1 name both as peers, and no decision makes either optional (§10 SD9).
- At P1, both peers, and the two `devDependencies` that repeat them, use the range `workspace:^0.1.0 || ^0.2.0` (§10 SD76; §12 AM-028). The Phase 1 Version PR keeps the peers and rewrites the two `devDependencies` to `workspace:^0.2.0`, and a canary pins both fields to the snapshot version (`updateInternalDependencies: "patch"`, `.changeset/config.json:13`; `@changesets/apply-release-plan` 7.1.1 `src/utils.ts:69-80`, `src/version-package.ts:109-112`; §12 AM-030). Changesets reads `workspace:^` as `^<old version>`, and a `minor` peer bump that leaves the declared range bumps `line-genui` to `major` (`@changesets/assemble-release-plan` 6.0.10 `src/determine-dependents.ts:217-219, :266-269`). §7.2 gives the probe and the per-phase widening duty, which applies to the `peerDependencies`; the `devDependencies` follow Changesets. `verify-pack` packs the stable peer range unchanged, as `^0.1.0 || ^0.2.0` (`scripts/verify-pack.mjs:60-64`).
- The `devDependencies` repeat both peers so that `bun --filter './packages/*' build` builds `line-components` and `line-icons` before `line-genui` on a clean checkout. The `line-genui` `tsc --emitDeclarationOnly` reads their built declarations: the `import type` from `@websublime/line-icons/a2ui` and the descriptor `load()` imports of `@websublime/line-components/<c>`. Bun 1.4.3 orders `--filter` scripts by `dependencies` and `devDependencies` and not by `peerDependencies` [probe 2026-10-20, not in the research: three workspace packages under `/tmp`; with peers only, the dependent started before either peer finished; with devDependencies, or peers plus devDependencies, it started after both]. Phase 00 spec line 399 says Bun orders by `dependencies` only; the probe shows that `devDependencies` also order. Phase 00 spec line 1815 and the `.github/workflows/checks.yml:22` comment say that Bun `--filter` ignores `devDependencies` ordering; P1 corrects all three (§6.P.1; §12 AM-017, L3R11-04). `lint-layers` does not read `devDependencies` (`scripts/lint-layers.mjs:12-16`; §12 AM-016, L3R10-03); C2's `line-icons` devDependency in `line-components` is the same case (§4.2).
- `line-genui` uses `line-core` only through modules that load no `lit`, and through types, for example `import type { LineElement }` in descriptor typings, which emits no import. The `line-core` root `"."` re-exports `LineElement` (`packages/line-core/src/index.ts:1`), which extends `LitElement` (`packages/line-core/src/line-element.ts:1, :19`); the built root loads `lit` (`packages/line-core/dist/index.js:4`), so `line-genui` takes no runtime import from `"."`. `./machine` and `./mixins/*` import `lit` only with `import type` (`packages/line-core/src/machine/line-machine-controller.ts:21`; `src/mixins/direction.ts:1`, `inspector.ts:1`, `metadata.ts:1`), which `verbatimModuleSyntax` erases (`tsconfig.base.json:22`). At run time `./mixins/*` loads nothing from `lit` (`packages/line-core/dist/mixins/*.js` hold no import), and `./machine` loads only `@zag-js/vanilla` (`packages/line-core/src/machine/line-machine-controller.ts:20`; `dist/machine/index.js:1`). `./styles` imports no `lit` (`packages/line-core/src/styles/index.ts`). Only modules that load `lit` at run time are barred, so today that is the root `"."` alone. Which Lit-free `line-core` modules `line-genui` imports at run time is left to G1 and G4 [INFERENCE: no research note lists them]. The `line-genui → line-core` dependency edge stays as ARCH §17.1 and PRD §6.1 state (§3.2; §12 AM-012, L3R7-04).
- `./catalog` also imports no module that touches the DOM at load, `./styles` included. `./styles` calls `new CSSStyleSheet()` when the module loads (`packages/line-core/src/styles/index.ts:24-25, :30-40`), and the P1 contract keeps `./catalog` free of DOM access (§6.P.1; PRD Appendix D; §12 AM-015, L3R9-04).

### 4.2 `@websublime/line-components`

```jsonc
{
  "name": "@websublime/line-components",
  "version": "0.1.2",                              // released at 0.2.0 by the Phase 1 minor changeset (§7.2)
  "type": "module",
  "license": "MIT",
  "files": ["dist", "src", "custom-elements.json"],// P10: shipped manifest (D8)
  "repository": {
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-components"
  },
  // "sideEffects" removed (§10 SD4, AM to Phase 00 spec §4.7)
  "customElements": "./custom-elements.json",     // P10 (D8)
  "publishConfig": { "access": "public" },
  "exports": {
    ".":                     { "types": "./dist/index.d.ts",                  "import": "./dist/index.js" },
    "./custom-elements.json": "./custom-elements.json",
    "./button":              { "types": "./dist/button/index.d.ts",           "import": "./dist/button/index.js" },
    "./icon":                { "types": "./dist/icon/index.d.ts",             "import": "./dist/icon/index.js" },
    "./stack":               { "types": "./dist/stack/index.d.ts",            "import": "./dist/stack/index.js" },
    "./separator":           { "types": "./dist/separator/index.d.ts",        "import": "./dist/separator/index.js" },
    "./icon-button":         { "types": "./dist/icon-button/index.d.ts",      "import": "./dist/icon-button/index.js" },
    "./button-group":        { "types": "./dist/button-group/index.d.ts",     "import": "./dist/button-group/index.js" },
    "./alert":               { "types": "./dist/alert/index.d.ts",            "import": "./dist/alert/index.js" },
    "./chip":                { "types": "./dist/chip/index.d.ts",             "import": "./dist/chip/index.js" },
    "./badge":               { "types": "./dist/badge/index.d.ts",            "import": "./dist/badge/index.js" },
    "./avatar":              { "types": "./dist/avatar/index.d.ts",           "import": "./dist/avatar/index.js" },
    "./avatar-group":        { "types": "./dist/avatar-group/index.d.ts",     "import": "./dist/avatar-group/index.js" },
    "./visually-hidden":     { "types": "./dist/visually-hidden/index.d.ts",  "import": "./dist/visually-hidden/index.js" },
    "./portal":              { "types": "./dist/portal/index.d.ts",           "import": "./dist/portal/index.js" },
    "./kbd":                 { "types": "./dist/kbd/index.d.ts",              "import": "./dist/kbd/index.js" },
    "./skeleton":            { "types": "./dist/skeleton/index.d.ts",         "import": "./dist/skeleton/index.js" },
    "./presence":            { "types": "./dist/presence/index.d.ts",         "import": "./dist/presence/index.js" },
    "./grid":                { "types": "./dist/grid/index.d.ts",             "import": "./dist/grid/index.js" },
    "./center":              { "types": "./dist/center/index.d.ts",           "import": "./dist/center/index.js" },
    "./aspect-ratio":        { "types": "./dist/aspect-ratio/index.d.ts",     "import": "./dist/aspect-ratio/index.js" },
    "./spinner":             { "types": "./dist/spinner/index.d.ts",          "import": "./dist/spinner/index.js" }
  },
  "dependencies": {
    "@websublime/line-core": "workspace:^",
    "@websublime/line-themes": "workspace:^",
    "@websublime/line-tokens": "workspace:^",
    "@websublime/line-utils": "workspace:^",
    "@zag-js/core": "^1.46.0",                     // P9 (§10 SD2); ButtonGroup custom machine (§10 SD10)
    "@zag-js/presence": "^1.46.0",                 // added by C16 (Presence, Pre-built, plan §2.2)
    "@zag-js/toggle": "^1.46.0",                   // added by C8 (Chip, Pre-built, §10 SD11)
    "lit": "^3.3.3"                                // P9 (§10 SD2)
  },
  "devDependencies": {
    "@websublime/line-icons": "workspace:^",       // C2 tests only; not a layer edge (§3.2; §12 AM-008, L2R4-02; §12 AM-032, L3R23-11)
    "@websublime/line-schemas": "workspace:^"      // P12 Roles visual tests only; not a layer edge (§3.2; §12 AM-047)
  },
  "scripts": {
    "build": "vite build && tsc -p tsconfig.json --noEmit false --emitDeclarationOnly && bun run analyze",  // P8, P10
    "analyze": "custom-elements-manifest analyze --config custom-elements-manifest.config.mjs",            // P10
    "dev": "trap 'kill 0' INT TERM; vite build --watch & tsc -p tsconfig.json --noEmit false --emitDeclarationOnly --watch & wait",
    "clean": "rm -rf dist custom-elements.json",
    "typecheck": "tsc --noEmit && tsc -p tsconfig.test.json --noEmit"   // second half added by C2 (§12 AM-008, L2R4-02)
  }
}
```

Entrypoints and tags (plan §2.2, §10 SD12, ARCH §12):

| Task | Subpath | Registers | Kind |
|---|---|---|---|
| C1 | `./button` | `line-button` | independent |
| C2 | `./icon` | `line-icon` | independent |
| C3 | `./stack` | `line-stack` | independent (§10 SD12) |
| C4 | `./separator` | `line-separator` | independent (§10 SD12) |
| C5 | `./icon-button` | `line-icon-button` | independent |
| C6 | `./button-group` | `line-button-group` | independent; slots its buttons (ARCH §13.1) |
| C7 | `./alert` | `line-alert` | independent |
| C8 | `./chip` | `line-chip` | independent |
| C9 | `./badge` | `line-badge` | independent (§10 SD12) |
| C10 | `./avatar` | `line-avatar` | independent |
| C11 | `./avatar-group` | `line-avatar-group` | independent; takes avatars through a slot (§10 SD4) |
| C12 | `./visually-hidden` | `line-visually-hidden` | independent (§10 SD12) |
| C13 | `./portal` | `line-portal` | independent (§10 SD12) |
| C14 | `./kbd` | `line-kbd` | independent; one tag with OS-aware rendering (§10 SD12) |
| C15 | `./skeleton` | `line-skeleton` | independent (§10 SD12) |
| C16 | `./presence` | `line-presence` | independent |
| C17 | `./grid` | `line-grid` | independent (§10 SD12) |
| C18 | `./center` | `line-center` | independent (§10 SD12) |
| C19 | `./aspect-ratio` | `line-aspect-ratio` | independent (§10 SD12) |
| C20 | `./spinner` | `line-spinner` | independent |

- Each C task adds its own `exports` key and its own `vite.config.mjs` entry `'<c>/index': 'src/<c>/index.ts'` in the same PR. The table is the final map at phase exit.
- The root `"."` stays types and shared utilities only and registers no element (ARCH §12). It exports `setIconRegistry` and the `LineIconRegistry` type (§6.C.3; §12 AM-004, D-R, L3R2-06).
- No component module imports another component module (§10 SD4, MANIFESTO Law 4, Law 6). Default Rolldown chunking applies (§10 SD4).
- `src/shared/` holds code that is not a component. Its modules are `src/shared/button-machine.ts`, the Button machine that C1 and C5 import, and `src/shared/icon-registry.ts`, the icon registry that `setIconRegistry()` and `LineIcon.registry` share through one `globalThis` symbol key, whose slot holds `{ registry, events }` (§6.C.3). Law 4 does not apply to them, and their code lands in a shared chunk (§12 AM-002, D-L3-06; §12 AM-004, D-R; §12 AM-006, D-G; §12 AM-008, L3R4-01; ARCH §13.1 for the Button machine; ARCH §11 for the icon registry; §12 AM-005, L2R3-12).
- The `dependencies` list MUST equal the set of bare specifiers that `dist/` imports, apart from `@websublime/*` packages already listed (§10 SD2). The list above is the expected phase-exit set. `@zag-js/vanilla` is absent because components reach it through `@websublime/line-core/machine` (`packages/line-core/src` imports, R7 §2.1), and the Biome `noRestrictedImports` rule rejects a direct import outside `line-core` (`biome.json:44-48`; §10 SD13; §12 AM-005, L2R3-13).
- C2 adds `"@websublime/line-icons": "workspace:^"` to `devDependencies`, `packages/line-components/__tests__/registry.types.ts` and `packages/line-components/tsconfig.test.json`, which the `typecheck` script runs, so the C2 type-level case compiles against the real `IconRegistry`. `devDependencies` are not layer edges (`scripts/lint-layers.mjs:12-16`; §3.2; §12 AM-008, L2R4-02).
- P12 adds `"@websublime/line-schemas": "workspace:^"` to `devDependencies`, so the Roles visual files import `ACCENT_HUES` and `GRAY_HUES` by package name. Bun installs workspaces in isolated mode and resolves no undeclared workspace package from `packages/line-components/__tests__/`. `devDependencies` are not layer edges (`scripts/lint-layers.mjs:13-16`; §3.2; §6.P.12; §12 AM-047).

### 4.3 `@websublime/line-icons`

```jsonc
{
  "name": "@websublime/line-icons",
  "version": "0.1.0",                              // released at 0.2.0 (§7.2)
  "type": "module",
  "license": "MIT",
  "files": ["dist", "src"],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-icons"
  },
  "sideEffects": false,                            // unchanged (R10 §2.4; R10 round 2 §2.5)
  "publishConfig": { "access": "public" },
  "exports": {
    ".":                    { "types": "./dist/index.d.ts",              "import": "./dist/index.js" },              // kept (Phase 00 consumers)
    "./registry":           { "types": "./dist/registry.d.ts",           "import": "./dist/registry.js" },           // plan §2.5, PRD §6.2
    "./resolvers/lucide":   { "types": "./dist/resolvers/lucide.d.ts",   "import": "./dist/resolvers/lucide.js" },   // plan §2.5
    "./resolvers/phosphor": { "types": "./dist/resolvers/phosphor.d.ts", "import": "./dist/resolvers/phosphor.js" }, // plan §2.5
    "./a2ui":               { "types": "./dist/a2ui/index.d.ts",         "import": "./dist/a2ui/index.js" }          // §10 SD14, SD15
  },
  "dependencies": {
    "@websublime/line-tokens": "workspace:^"
  },
  "peerDependencies": {
    "lucide-static": "^1.16.0",
    "@phosphor-icons/core": "^2.1.1"
  },
  "peerDependenciesMeta": {
    "lucide-static": { "optional": true },
    "@phosphor-icons/core": { "optional": true }
  },
  "scripts": {
    "build": "tsc -b",                             // tsc 7.x after P8 (D1)
    "dev": "tsc -b --watch",
    "clean": "rm -rf dist tsconfig.tsbuildinfo",
    "typecheck": "tsc --noEmit"
  }
}
```

- `./a2ui` holds the map of the A2UI icon names as per-set data and exports the helper `a2uiIconMap(set, { library })` and the types `A2uiIconName`, `A2uiIconMap` and `A2uiIconEntry`; the consumer passes the helper's result to the surface `iconMap`. `A2uiIconName` is the union of the 59 A2UI v0.9.1 `Icon.name` enum values, kept in `packages/line-icons/src/a2ui/` (R10 §2.1, P2; R1 §2.6) (§10 SD14, SD15; §12 AM-006, D-M; §12 AM-008, L3R4-03; §12 AM-010, L3R5-04). §6.C.3 states the decided icon surface in full.
- `@websublime/line-icons/a2ui` follows the preview status of `@websublime/line-genui/a2ui` until A2UI v1.0, because its types and helper feed the preview property `iconMap`. The rest of `line-icons` follows PRD §7.1 (ARCH §17.7; PRD Appendix D; §12 AM-008, L3R4-06; §12 AM-011, L3R6-03).
- The `exports` map and `sideEffects: false` stay as written under the fetch mechanism (§10 SD89). Keeping `"."` with its re-exports is safe under `sideEffects: false` (R10 round 2 §2.5, P3).
- `createLucideResolver({ base })` and `createPhosphorResolver({ base, weight? })` take a required `base` option (§10 SD90; §6.C.3). This breaks Phase 00 callers of `createLucideResolver()` and `createPhosphorResolver({ weight })` without `base` (`packages/line-icons/README.md:21-22`). The break lands in the C22 `minor`, and the C22 changeset records it (PRD §7.1 pre-1.0). No deprecation cycle applies, because today's form renders no icon without consumer bundler configuration, and on neither CDN path (R10 round 2 §2.2, §2.6; §10 SD93).
- The mechanism adds no dependency to `line-icons` (R10 round 2 §4).
- `lucide-static` `latest` was 1.60.0 on 2026-10-20 (npm registry). The C22 owner re-checks the peer floor (§6.C.3).

### 4.4 `@websublime/line-themes`

```jsonc
{
  "name": "@websublime/line-themes",
  "version": "0.1.2",                              // released at 0.2.0 (§7.2)
  "type": "module",
  "license": "MIT",
  "files": ["dist"],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/websublime/line-ui.git",
    "directory": "packages/line-themes"
  },
  "sideEffects": ["*.css"],
  "publishConfig": { "access": "public" },
  "exports": {
    ".": "./dist/index.css",
    "./accent/*": "./dist/accent/*.css",
    "./gray/*": "./dist/gray/*.css",
    "./semantics": "./dist/semantics.css",
    "./aliases": "./dist/aliases.css",
    "./defaults": "./dist/defaults.css",
    "./hosts/mcp-apps.css": "./dist/hosts/mcp-apps.css"   // G6 (PRD Appendix D, PRD §7.3 item 7)
  },
  "dependencies": {
    "@websublime/line-colors": "workspace:^",
    "@websublime/line-schemas": "workspace:^"
  },
  "devDependencies": {
    "@websublime/line-tokens": "workspace:^"       // Z5 tests only (shadows.e2e.ts, cascade-layer.e2e.ts); L3 → L0, not a layer edge (§3.2; §6.Z.3; §12 AM-048)
  },
  "scripts": {
    "build": "postcss src/index.css -o dist/index.css && postcss 'src/*.css' -d dist && postcss 'src/accent/*.css' -d dist/accent && postcss 'src/gray/*.css' -d dist/gray && postcss 'src/hosts/*.css' -d dist/hosts",
    "dev": "trap 'kill 0' INT TERM; postcss src/index.css -o dist/index.css --watch & postcss 'src/*.css' -d dist --watch & postcss 'src/accent/*.css' -d dist/accent --watch & postcss 'src/gray/*.css' -d dist/gray --watch & postcss 'src/hosts/*.css' -d dist/hosts --watch & wait",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  }
}
```

- The export key keeps the `.css` suffix because PRD Appendix D and PRD §7.3 name the specifier `@websublime/line-themes/hosts/mcp-apps.css`.
- `src/index.css` does not import the bridge [INFERENCE: the bridge targets MCP Apps views only, PRD Appendix D "Tiers"] (§10 SD16).
- The bridge adds no dependency and no runtime code (MANIFESTO Law 10, §10 SD17).
- The `lint-layers` prefix audit already scans every CSS file under `src/` and `dist/` (`scripts/lint-layers.mjs:268-295`). PRD §7.3 requires the bridge to pass it.
- Z5 adds `"@websublime/line-tokens": "workspace:^"` to `devDependencies`, so `shadows.e2e.ts` and `cascade-layer.e2e.ts` load the `line-tokens` CSS by package name. The edge points down the layer order, L3 → L0, and `devDependencies` are not layer edges (PRD §5.2, §6.1; `scripts/lint-layers.mjs:13-16`; §3.2; §6.Z.3; §12 AM-048).

### 4.5 `@websublime/line-core`

The `exports` map, `files`, `sideEffects` and `dependencies` stay as in `packages/line-core/package.json:1-48`. No decision changes them.

| Task | Change | Public surface |
|---|---|---|
| C21 | `LineMachineController` calls `updateProps` on every host update (D7). It carries the measured cost budget of §10 SD18; the first machine row past the budget adds the fallback (§12 AM-020, L3R14-04) | No new export. The fallback is a `VanillaMachine` subclass internal to `./machine` (§10 SD18) |
| C23 | `LineElement` attaches `ElementInternals` for every component and keeps it in an ES `#private` field. Subclasses reach it as `this[INTERNALS]`, through a Symbol key that `line-core` exports, a plain `Symbol('line.internals')` and not `Symbol.for`. `FormAssociated` reuses it. No `globalThis` registration (§10 SD19; §12 AM-002) | A new `INTERNALS` export from `"."`. No public `internals` property. `LineElement` stays exported from `"."` |
| P5 | `/* @__PURE__ */` on each `createSheet()` call in `src/styles/index.ts:30-40` (§10 SD20, R9 §2.1) | None. `./styles` keeps its exports (Phase 00 spec §6.D.7) |
| P8 | `build` becomes `vite build && tsc -p tsconfig.json --noEmit false --emitDeclarationOnly`; `dev` gains the `tsc --watch` half, and the watch build keeps `dist/` (`build.emptyOutDir: false` in watch mode, §7.1, §6.P.9) [INFERENCE: `tsc --watch` with `--emitDeclarationOnly` beside `vite build --watch` not probed] (§10 SD7, D1; §12 AM-006, L2R3-04; §12 AM-008, L2R4-05) | None |
| Z5 | `devDependencies` gain `"@websublime/line-testing": "workspace:^"`, `"htmx2": "npm:htmx.org@2.0.11"` and `"htmx4": "npm:htmx.org@4.0.0"`. The harness self-test imports `@websublime/line-testing/htmx`, and the `__experimental__/htmx/example/server.ts` spike resolves `htmx2` and `htmx4` from the package (§6.Z.3; §12 AM-048) | None |

- After Z5 the packed `line-core` manifest names the unpublished `@websublime/line-testing` (`^0.0.0`) in `devDependencies`. This is harmless, because consumers never install `devDependencies` and the `@websublime` scope belongs to the org (§4.6; §6.Z.3; §12 AM-048).

### 4.6 `@websublime/line-testing` (new, private)

```jsonc
{
  "name": "@websublime/line-testing",
  "version": "0.0.0",
  "private": true,                                 // never published; verify-pack and publish.mjs skip it, lint-layers treats it as an app (§3.1)
  "type": "module",
  "exports": {
    "./htmx": "./src/htmx.ts"                      // TypeScript source that Playwright loads (§6.Z.3)
  },
  "dependencies": {
    "htmx2": "npm:htmx.org@2.0.11",                // exact; moved from the root devDependencies (Phase 00 spec AM-077)
    "htmx4": "npm:htmx.org@4.0.0"
  },
  "peerDependencies": {
    "playwright": "^1.64.0"                        // src/htmx.ts imports expect and test as values; the root range (PRD §5.2 rule 6)
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

`packages/line-testing/tsconfig.json`:

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true, "types": ["node"] },   // TypeScript 7 defaults types to []; node:url needs "node"
  "include": ["src/**/*"]
}
```

- Z5 creates the package with `package.json`, `tsconfig.json`, a short `README.md` and `src/htmx.ts` (§6.Z.3; §12 AM-048).
- The package holds no `@websublime/*` in `dependencies` or `peerDependencies`, because `lint-layers` treats a private package as an app (`scripts/lint-layers.mjs:181-205`).
- `src/htmx.ts` imports `expect` and `test` from `playwright/test` as values (`htmx-harness.ts:23`), so the package declares `playwright` as a peer at the root range `^1.64.0`. Bun links the one `.bun/playwright@1.64.0` store path for the root and the package, so one Playwright instance runs [review-gate lens probe, 2026-10-23] (PRD §5.2 rule 6; §6.G.2).
- `tsconfig.json` sets `types: ["node"]`. TypeScript 7 defaults `types` to `[]`, so without it the `node:url` import of `src/htmx.ts` fails with TS2591 [review-gate lens probe, 2026-10-23].
- `.changeset/config.json` lists `@websublime/line-testing` in `ignore`, as it lists the private `@websublime/line-storybook` and `@websublime/line-site`. No changeset may name the package. `@changesets/config` 3.1.4 skips `devDependencies` and private dependents in its skipped-package check, so `bun run status`, `changeset version` and `verify-pack` pass [review-gate lens probe, 2026-10-23]. infra-supervisor edits the file (§4 table).
- A package declares `"@websublime/line-testing": "workspace:^"` in `devDependencies` when its tests first import it. Z5 adds it to `line-core`; the first C row whose tests import it adds it to `line-components` (§6.Z.3).

## 5. Repository Layout

New and changed paths only. `+` marks a new path and `~` a changed one.

```
.github/workflows/checks.yml                         ~ P1 (line 22 comment, §4.1), P5 (zero-export smoke step removed; size report step added), P10 (Storybook analyze step removed)
.github/workflows/cdn-check.yml                       + C22 (workflow_dispatch CDN run; §6.P.6; §12 AM-016, L3R10-04; §12 AM-017, L3R11-03)
.github/workflows/visual-baselines.yml                + P11 (workflow_dispatch run that writes the Linux visual baselines, off pairs included; §6.P.11; §10 SD98; §12 AM-031, AM-033)
.github/workflows/visual-off-pairs.yml                + P11 (workflow_dispatch off-pair run before each release, recorded in the release PR; §6.P.11; §10 SD98; §12 AM-033)
.changeset/config.json                               ~ P3 (onlyUpdatePeerDependentsWhenOutOfRange set to true; §6.P.3; §7.2; §10 SD76; §12 AM-028); Z5 (`ignore` gains `@websublime/line-testing`; §4.6; §12 AM-048)
CODE_OF_CONDUCT.md                                   + Z1
README.md                                            ~ Z1 (code of conduct link)
CLAUDE.md                                            ~ P8 Tech Stack; Z5 Repository Structure (`line-testing`; §12 AM-048)
.claude/agents/webcomponents-supervisor.md           ~ P8 (lines 15, 72); Z5 (Project Structure tree names `line-testing`; the Changesets convention says each published package; §12 AM-048)
.gitignore                                           ~ P10 (drops `customElements.json` and the `analyze` reference in the line 7 comment; §12 AM-019, R13-L1-01); P11 (ignores `-visual-darwin.png` and `-visual-win32.png` under `*.visual.ts-snapshots/`; §6.P.11; §12 AM-034)
package.json                                         ~ P5 or C22 esbuild (whichever lands first), P7 @axe-core/playwright, P8 typescript 7.x, vite-plugin-dts removed, C22 webpack, G2 or G3 ajv and ajv-formats (whichever lands first), G3 gpt-tokenizer (§12 AM-016; §12 AM-017, L3R11-01); Z5 (htmx2 and htmx4 removed; §6.Z.3; §12 AM-048)
bun.lock                                             ~ every row that changes a dependency: P1, P5 or C22 (esbuild), P7, P8, P9, P12, Z5, C2, C8, C16, C22, G2 or G3 (ajv), G3, G4, G7, S1 (`bun install --frozen-lockfile`, `.github/workflows/checks.yml:19`; §12 AM-023, L3R16-06; §12 AM-048)
playwright.config.ts                                 ~ S1 (webServer for apps/site); C22 (testIgnore of **/*cdn.e2e.ts unless LINE_E2E_CDN is set; §6.P.6; §12 AM-016, L3R10-04; §12 AM-017, L3R11-03); P11 (`visual` project, Chromium only, testIgnore of **/*.off-pairs.visual.ts unless LINE_VISUAL_OFF_PAIRS is set; §6.P.11; §12 AM-031, AM-033)
biome.json                                           ~ P10 (files.includes drops `!**/customElements.json`; §12 AM-019, L3R13-03); G2 (files.includes excludes the vendored A2UI schema fixtures; §6.G.2; §12 AM-017, L3R11-02)
custom-elements-manifest.config.mjs                  - P10 (removed; replaced by the package config)
vite.config.shared.mjs                               ~ P8 (dts removed, watch keeps dist; §12 AM-008, L2R4-05), P9 (derived externals)
bun-test-preload.ts                                  ~ C23 (fake `attachInternals` from the line-core mock, because happy-dom has none; §7.8; §12 AM-020, L3R14-01; §12 AM-021, L3R15-01)
scripts/lint-layers.mjs                              ~ P2 (ALLOWED_EDGES, header)
scripts/verify-pack.mjs                              ~ P10 (customElements target check, both packages)
scripts/report-size.mjs                              + P5 (size report, §10 SD21)
scripts/emit-catalog.mjs                             + G2 (writes packages/line-genui/dist/catalog.json after vite build; §6.G.2; §12 AM-016, L3R10-02)
docs/specs/00-spec-design-system.md                  ~ AM rows of P1, P5, P8, P9, P10, G2, C23 (§12 AM-021, m3); Z5 (AM-077; §12 AM-048)
docs/specs/COMPONENT-SPEC-TEMPLATE.md                ~ Z5 (htmx Tests row points at `@websublime/line-testing/htmx`; §12 AM-048)
docs/retrospective/01-<slug>.md                      + Z3
docs/context/01-p4.md                                + P4 (evidence of §6.P.4 steps 1–6; §12 AM-036, AM-037)
docs/context/01-p13.md                               + P13 (evidence of §6.P.4 step 7; §12 AM-036, AM-037)
apps/site/package.json                               ~ S1 (@websublime/* devDependencies)
apps/site/src/pages/index.astro                      ~ S1
apps/site/__tests__/landing.e2e.ts                   + S1
apps/storybook/package.json                          ~ P10 (analyze script removed); G4 (@websublime/line-genui devDependency); G7 (@ag-ui/a2ui-middleware, @ag-ui/client, rxjs and @a2a-js/sdk devDependencies; §12 AM-016, L3R10-05)
apps/storybook/.storybook/main.ts                    ~ P10 (comment at :24)
apps/storybook/.storybook/preview.ts                 ~ P10 (setCustomElementsManifest, merged manifest); G4 (line-genui import)
apps/storybook/types/line-css.d.ts                   + P8 (ambient CSS module declarations)
apps/storybook/tsconfig.json                         ~ P8 (includes types/)
apps/storybook/stories/agent-driven-ui-samples/      + D1 (typechecked guide samples; §6.D.1; §12 AM-016, L3R10-08)
apps/storybook/__tests__/ag-ui-middleware.test.ts    + G7 (middleware comparison test, run by the "Unit tier" step; §6.G.7; §12 AM-019, L3R13-04)
packages/line-core/package.json                      ~ P8; Z5 (`@websublime/line-testing`, `htmx2` and `htmx4` devDependencies; §4.5; §6.Z.3; §12 AM-048)
packages/line-core/src/mixins/inspector.ts           ~ P8 (line 111 comment, by webcomponents-supervisor in the P8 PR; §4; §7.1; §12 AM-040, AM-041)
packages/line-core/vite.config.mjs                   ~ P9 (root: import.meta.dirname; §6.P.9; §12 AM-041)
packages/line-core/src/styles/index.ts               ~ P5 (PURE annotations)
packages/line-core/src/internals.ts                  + C23 (INTERNALS Symbol, imports nothing; §12 AM-004, L3R2-02)
packages/line-core/src/line-element.ts              ~ C23 (internals accessor, reflectState; §6.C.2)
packages/line-core/src/mixins/form-associated.ts    ~ C23 (reuses the base accessor, drops its `reflectState` override; §6.C.2; §12 AM-032, L3R23-09)
packages/line-core/src/index.ts                     ~ C23 (re-exports INTERNALS; §6.C.2)
packages/line-core/src/machine/line-machine-controller.ts  ~ C21 (updateProps on every host update; §6.C.1)
packages/line-core/src/machine/index.ts             ~ C21 (export count comment; §6.C.1)
packages/line-core/src/machine/                      ~ the first machine row past the C21 budget (`VanillaMachine` subclass; §10 SD18; §12 AM-020, L3R14-04)
packages/line-core/README.md                        ~ C21 (export count; §6.C.1)
packages/line-core/__tests__/                       + C21 (update-rate harness with a fixture machine; §10 SD28; §12 AM-020, L3R14-04)
packages/line-core/__tests__/mocks/element-internals.ts  ~ C23 (`restore()` puts back the previous `attachInternals`; §7.8; §12 AM-020, L3R14-01)
packages/line-core/__tests__/integration/htmx/htmx-harness.ts      - Z5 (moved to packages/line-testing/src/htmx.ts; §6.Z.3; §12 AM-048)
packages/line-core/__tests__/integration/htmx/htmx-harness.e2e.ts  ~ Z5 (imports `@websublime/line-testing/htmx`; probes and `/htmx/` fixture page stay; §6.Z.3)
packages/line-core/__experimental__/htmx/README.md   ~ Z5 (`:36-37` names the `line-core` devDependencies; the htmx locators at `:112-113`, `:133`, `:135`, `:139` and `:158` resolve under `packages/line-core/node_modules/`; §6.Z.3)
packages/line-core/__experimental__/htmx/example/server.ts  ~ Z5 (header comment at `:5`, by webcomponents-supervisor with the README; §6.Z.3)
packages/line-components/package.json                ~ P8, P9, P10, P12 (line-schemas devDependency; §6.P.12; §12 AM-047), C1–C20 (the first C row whose tests import `@websublime/line-testing` declares it as a devDependency; §6.Z.3; §12 AM-048), C2 (line-icons devDependency, typecheck; §12 AM-008, L2R4-02)
packages/line-components/tsconfig.test.json          + C2 (type-level tests; §12 AM-008, L2R4-02)
packages/line-components/vite.config.mjs             ~ P5 (drops the Phase 00 zero-export comment at lines 3-4; §12 AM-020, L3R14-12), P9 (root: import.meta.dirname; src/shared/* to dist/shared/[name].js), C1–C20 (one entry each)
packages/line-components/README.md                   ~ C1 (replaces the "Empty in Phase 00" sentence at line 3; §12 AM-020, L3R14-12)
packages/line-components/custom-elements-manifest.config.mjs  + P10
packages/line-components/__tests__/bundle-splitting.test.ts   + P5
packages/line-components/__tests__/line-element-identity.test.ts + P5 (§12 AM-020, L3R14-02)
packages/line-components/__tests__/manifest-paths.test.ts + C1 (CEM module paths resolve in the packed tarball; §6.C.6; §7.3; §12 AM-032, L3R23-03)
packages/line-components/src/<c>/                    + C1–C20 (ARCH §10)
packages/line-components/src/shared/button-machine.ts + C1 (shared Button machine, C5 imports it; §12 AM-002)
packages/line-components/src/shared/icon-registry.ts  + C2 (single icon registry; §12 AM-004, D-R)
packages/line-components/src/index.ts               ~ C2 (exports setIconRegistry and LineIconRegistry; §12 AM-004, D-R)
packages/line-components/__tests__/registry.types.ts  + C2 (LineIconRegistry type-level case; §12 AM-008, L2R4-02)
packages/line-components/__tests__/a11y/*.e2e.ts     + P7 harness, one file per component from C1 on
packages/line-components/__tests__/visual/story.ts   + P11 (opens a story on storybook-static, with optional globals and args, and takes its full-page screenshot; §6.P.11; §12 AM-031, AM-033)
packages/line-components/__tests__/visual/roles.visual.ts and roles.off-pairs.visual.ts, with their .visual.ts-snapshots/  + P12 (`design-system-roles--toolbar` under every `(accent, gray, mode)` combination, 62 default-pair and 310 off-pair Linux baselines; §6.P.12; §10 SD98; §12 AM-033, AM-035)
packages/line-components/__tests__/visual/<c>.visual.ts and <c>.visual.ts-snapshots/  + C1–C20 (one file per component and its committed Linux baselines; §6.P.11; §12 AM-031)
packages/line-components/__tests__/cdn.e2e.ts        + P6 (cdn-check.yml only; §6.P.6)
packages/line-genui/                                 + P1
  package.json  tsconfig.json  vite.config.mjs  README.md  LICENSE   (package.json peerDependencies and devDependencies on line-components and line-icons at `workspace:^0.1.0 || ^0.2.0`, §10 SD76, §12 AM-028; the devDependencies give the build order, §4.1, §12 AM-016, L3R10-03; LICENSE §12 AM-020, L3R14-08; G2 adds the `emit-catalog` build step and G4 the `analyze` script and step, `customElements` field and `files` entry)
  src/catalog/index.ts                               + P1 (G1–G3 fill it; C10 adds the `Image` `variant: "avatar"` route to the `basic` map, §6.C.4; §12 AM-021, L3R15-02)
  src/a2ui/index.ts                                  + P1 (G4 fills it)
  custom-elements-manifest.config.mjs                + G4 (surface manifest, §10 SD94)
  __tests__/                                         + G tasks
  __tests__/fixtures/a2ui-v0_9_1/                    + G2 (five A2UI v0.9.1 schema files from a2ui-project/a2ui cbaa5ee, SOURCE.md; §6.G.2; §12 AM-016, L3R10-01)
packages/line-icons/package.json                     ~ C22, G2 (./a2ui)
packages/line-icons/src/registry.ts                  + C22
packages/line-icons/__tests__/{registry,resolvers.lucide,resolvers.phosphor}.test.ts  ~ C22 (pass a `base` and mock `fetch`; §10 SD90; §12 AM-020, L3R14-11)
packages/line-icons/src/resolvers/{lucide,phosphor}.ts  ~ C22 (fetch from base, §10 SD89, SD90)
packages/line-icons/README.md                        ~ C22 (base URL, CSP, in-bundle recipe), G2 (`./a2ui` preview status; §12 AM-010)
packages/line-icons/__tests__/consumer-matrix.e2e.ts + C22 (bundler pages, Browser tier)
packages/line-icons/__tests__/consumer-matrix.cdn.e2e.ts + C22 (CDN-base pages, cdn-check.yml only; §6.C.3; §12 AM-016, L3R10-04)
packages/line-icons/src/a2ui/                        + G2 (per-set map, a2uiIconMap helper, and the `A2uiIconName`, `A2uiIconEntry` and `A2uiIconMap` types; §10 SD14, SD15; §12 AM-002; §12 AM-006, D-M; §12 AM-010)
packages/line-testing/                               + Z5 (private, never published; §4.6; §6.Z.3; §12 AM-048)
  package.json  tsconfig.json  README.md            (package.json and tsconfig.json by infra-supervisor; §4 table)
  src/htmx.ts                                        + Z5 (moved from packages/line-core/__tests__/integration/htmx/htmx-harness.ts; `routeHtmx` resolves `htmx<major>/dist/htmx.js` through `import.meta.resolve`)
packages/line-themes/package.json                    ~ G6 (`./hosts/mcp-apps.css` export; `src/hosts` step of `build` and `dev`, §4.4; §12 AM-023, L3R16-03); Z5 (`@websublime/line-tokens` devDependency; §4.4; §12 AM-048)
packages/line-themes/src/hosts/mcp-apps.css          + G6
packages/line-themes/__tests__/shadows.e2e.ts        + Z5 (moved from packages/line-tokens/__tests__/shadows.e2e.ts; loads the CSS by package name; §6.Z.3)
packages/line-themes/__tests__/auto-pair.e2e.ts      + Z5 (31 accents against PRD §9.5 in three engines; §6.Z.3)
packages/line-themes/__tests__/auto-pair.behaviour.test.ts  - Z5 (replaced by auto-pair.e2e.ts and defaults-selectors.test.ts; §6.Z.3)
packages/line-themes/__tests__/defaults-selectors.test.ts  + Z5 (selector contract of src/defaults.css, PRD §9.14 T4; §6.Z.3)
packages/line-themes/__tests__/{aliases-scope,cascade-layer,hue-role-names}.e2e.ts  ~ Z5 (package names, no relative path into a dist; §6.Z.3)
packages/line-themes/__tests__/{palette.snapshot,role-mapping.snapshot,schema}.test.ts  ~ Z5 (package names, no relative path into a dist; §6.Z.3)
packages/line-tokens/__tests__/shadows.e2e.ts        - Z5 (moved to packages/line-themes/__tests__/; §6.Z.3)
```

- `apps/storybook/types/line-css.d.ts` is a path choice [INFERENCE] (§10 SD22). Any `.d.ts` that `apps/storybook/tsconfig.json` includes satisfies R11 OQ2 (b).
- `packages/line-components/__tests__/` sits on the `verify-pack` denylist and never ships (`scripts/verify-pack.mjs:145-155`).

## 6. Implementation Detail Per Stream

### 6.P Platform and release

Owner of every P task is `infra-supervisor` (plan §4.0), as the accountable supervisor; file classes follow the §4 table (§12 AM-022). P8, P9 and P10 land after spec approval and before C1 (plan §6).

#### 6.P.1 P1 — Scaffold `packages/line-genui`

- **Owner:** infra-supervisor.
- **Deps:** spec APPROVED, P2.
- **Changes:**
  - `packages/line-genui/package.json` as in §4.1, without the `./catalog.json` key (G2 adds it), the `emit-catalog` step of `build` (G2 adds it) and the manifest keys and `analyze` script (G4 adds them, §10 SD94). It carries the §4.1 `devDependencies` on `@websublime/line-components` and `@websublime/line-icons`, so the `line-genui` build runs after theirs (§12 AM-016, L3R10-03). It declares both packages as `workspace:^0.1.0 || ^0.2.0` in `peerDependencies` and in `devDependencies` (§4.1; §10 SD76; §12 AM-028).
  - `packages/line-genui/tsconfig.json`, a copy of `packages/line-core/tsconfig.json:1-10`.
  - The comment of the "Build packages" step (`.github/workflows/checks.yml:22`) drops "Bun --filter ignores devDependencies ordering", which the §4.1 probe disproves (§12 AM-017, L3R11-04).
  - AM row to Phase 00 spec §5 (line 399, "orders scripts by `dependencies` only") and §6.F.5 (line 1815, the same `checks.yml` comment): Bun 1.4.3 `--filter` also orders by `devDependencies` (§4.1; §12 AM-017, L3R11-04).
  - `packages/line-genui/vite.config.mjs` with the two entries of §4.1.
  - `packages/line-genui/LICENSE`, a copy of `packages/line-core/LICENSE`. Phase 00 row Z5 ships a `LICENSE` in every package (`docs/plans/00-tasks-design-system.md:119`), and `verify-pack` does not require one (§12 AM-020, L3R14-08).
  - `src/catalog/index.ts` and `src/a2ui/index.ts` as zero-export modules (`export {};`), the Phase 00 precedent of `line-components` (Phase 00 spec §4.7). G2 adds the `./catalog.json` key with its emitter (§10 SD23).
  - `README.md` stating the Preview status of `./a2ui` (PRD Appendix D "Preview policy").
  - A `minor` changeset for `@websublime/line-genui` (§10 SD3).
- **Contract:**
  - The manifest MUST match §4.1 key for key.
  - The `@websublime/line-components` and `@websublime/line-icons` ranges in `peerDependencies` and `devDependencies` MUST read `workspace:^0.1.0 || ^0.2.0` (§10 SD76; §12 AM-028).
  - `src/catalog/` MUST NOT import from `src/a2ui/`, so `./catalog` touches no DOM (PRD Appendix D).
  - `bun install` MUST resolve `@a2ui/web_core` at exactly 0.14.0 (§10 SD6).
- **Acceptance:**
  - `bun run build` emits `dist/catalog/index.{js,d.ts}` and `dist/a2ui/index.{js,d.ts}`.
  - On a clean checkout with no `dist/` folder, `bun run build` starts the `line-genui` build only after the `line-components` and `line-icons` builds finish (§4.1; §12 AM-016, L3R10-03).
  - `bun run scripts/verify-pack.mjs` passes for nine packages.
  - `bun run scripts/lint-layers.mjs` passes with the real `line-genui` manifest.

#### 6.P.2 P2 — Layer edges

- **Owner:** infra-supervisor.
- **Deps:** spec APPROVED.
- **Changes:** `scripts/lint-layers.mjs:59-68` and its header comment, as §3.3 states.
- **Contract:**
  - `ALLOWED_EDGES` MUST equal the §3.3 block.
  - No other package entry gains `line-genui` (PRD §6.1).
- **Acceptance:**
  - `lint-layers` passes against a fixture manifest that declares the §3.2 `line-genui` edges [the check is run once by hand and recorded in the Verify record].
  - A throwaway manifest that adds `line-genui` to `line-components` `dependencies` fails the guard [the check is run once by hand and recorded in the Verify record].

#### 6.P.3 P3 — Publish, `verify-pack` and Changesets coverage of the 9th package

- **Owner:** infra-supervisor.
- **Deps:** P1.
- **Changes:**
  - None in `scripts/publish.mjs`. It calls `discoverPublishable()` (`publish.mjs:178`), which lists `packages/*` (`scripts/verify-pack.mjs:33-48`), and treats an E404 as new (`publish.mjs:115`; R9 §2.5; §12 AM-005, L2R3-06).
  - `.changeset/config.json` gains `"___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": { "onlyUpdatePeerDependentsWhenOutOfRange": true }`, set unconditionally (§7.2; §10 SD76; §12 AM-028). `@changesets/config` 3.1.4 reads the flag from that object (`dist/changesets-config.cjs.js:355`), and `@changesets/types` 6.1.0 declares it there (`src/index.ts:120, :124`). The `ignore` list needs no change, because it holds only the two apps (`.changeset/config.json:14`).
- **Contract:**
  - `discoverPublishable()` MUST list `@websublime/line-genui` (`scripts/verify-pack.mjs:45`).
  - `.changeset/config.json` MUST set `___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH.onlyUpdatePeerDependentsWhenOutOfRange` to `true` (§10 SD76).
  - The peer edges of `line-genui` MUST NOT push any package above `0.2.0` at the Phase 1 Version PR, or `line-genui` above a `0.2.0-` prerelease in a canary (§7.2).
- **Acceptance:**
  - `verify-pack` packs `line-genui` and reports zero failures, checks (a)–(e) included.
  - In a throwaway copy of the repo with one `minor` changeset for each of the nine packages (the §7.2 table; R9 §2.6 method), with `changelog: false` in the copy (R9 §2.6 set it for its snapshot run, `docs/research/01-research-packaging.md:291-292`) or with `GITHUB_TOKEN` set, `changeset version` yields `0.2.0` for all nine. P1's changeset is committed when P3 runs, and `@changesets/changelog-github` (`.changeset/config.json:3-8`) then fails both dry runs with the token error unless one of the two holds (lens probe 2026-10-21, `@changesets/cli` 2.31.1; §12 AM-032, L3R23-01). The Verify record lists the nine versions.
  - In a fresh throwaway copy, or the same copy reset to its state before `changeset version`, with the same nine changesets and the same changelog setting, `bun run snapshot:version` (`changeset version --snapshot`, `package.json:30`) under the repo snapshot config (`.changeset/config.json:16-19`) yields `line-genui` at a `0.2.0-` prerelease, not `1.0.0-`. The `changeset version` run above consumes the changesets, so a second run in that copy releases nothing (lens probe 2026-10-21; §12 AM-032, L2R23-01). The Verify record lists that version (§10 SD76; §12 AM-028).

#### 6.P.4 P4 — Trusted publisher bootstrap

- **Owner:** infra-supervisor, with Miguel for the npmjs.com steps.
- **Deps:** P1, P3.
- **Changes:** `docs/context/01-p4.md`, which records the evidence of steps 1–6: the canary versions that steps 2 and 5 publish, the `snapshot-deploy.yml` trusted publisher, the provenance of the step 5 canary and the step 6 token setting. The steps themselves run on npmjs.com and in the GitHub `npm` environment. A row that changes no file has no PR, so it has no Verify record (PROCESS §5: "No record, no PR", `docs/PROCESS.md:122`) and no `done` flip, which follows the PR merge (PROCESS §6, `docs/PROCESS.md:136-147`, `:167`). The P4 PR therefore adds this file. `docs/context/00-f3.md:85-90` listed the Phase 00 bootstrap steps, whose evidence row 00-F10 recorded (Phase 00 spec AM-042; §12 AM-036, AM-037, AM-045).
- **Contract:** P4 MUST follow path A, the Phase 00 spec AM-038 order (PRD §7.3 item 10, plan §2.6, R9 §2.5). P4 covers steps 1–6; step 7 is row P13 (§6.P.13; §12 AM-036, AM-037).

| Step | Action | Source |
|---|---|---|
| 1 | Create a short-lived granular token with publish access and store it as `NPM_TOKEN` in the `npm` environment | Phase 00 spec AM-038 (4), Phase 00 spec §7.2 |
| 2 | Run `snapshot-deploy.yml` on `main`. The token publishes the first `line-genui` canary, `0.2.0-<sha>-SNAPSHOT` [INFERENCE: extrapolated from R9's `0.0.0`-seed probe; the P3 snapshot dry run checks the `0.2.0-` prefix] | R9 §2.5 path A; §6.P.3; §10 SD3, SD76 |
| 3 | Delete the token from the environment and from npmjs.com | Phase 00 spec AM-038 |
| 4 | Add the trusted publisher for `snapshot-deploy.yml` with environment `npm` and "npm publish" ticked | Phase 00 spec AM-038 (4); R9 §2.5 |
| 5 | A `snapshot-deploy.yml` run from a `main` commit merged after step 2 publishes an OIDC canary within 48 hours of step 4. A dispatch at the step 2 commit computes the same versions and uploads nothing | Phase 00 spec §7.2 step (5); R9 §2.5 (48-hour expiry); `.changeset/config.json:18`; `scripts/publish.mjs:186`, `:194` |
| 6 | Once step 5 succeeds, set "Require 2FA and disallow tokens" on the package | Phase 00 spec §7.2 step (6), Phase 00 spec AM-040; R9 §2.5 path A |
| 7 | Add the trusted publisher for `release.yml` within the 48 hours before the Phase 1 Version PR merge (row P13) | Phase 00 spec AM-038 (5) |

- npm points `latest` at the first canary until the first stable ships (Phase 00 spec AM-042, R9 §2.5). This effect is accepted (§10 SD3).
- Step 2 is the first `snapshot-deploy` run after P1 merges, and no other `snapshot-deploy` run happens between the P1 merge and step 2. The workflow runs only on `workflow_dispatch` (`.github/workflows/snapshot-deploy.yml:2`). From the P1 merge on, a run also uploads `line-genui`, which no npm package or trusted publisher covers until step 2. `scripts/publish.mjs` uploads in dependency order and throws at the first failed `npm publish` (`publish.mjs:170`, `:178`, `:192-195`), so such a run would stop at `line-genui` after publishing the packages before it [INFERENCE: `npm publish` without auth exits non-zero] (§12 AM-032, L3R23-02).
- Step 4 runs when another row's merge to `main` is due within 48 hours, so that merge gives step 5 its commit. The P4 PR is opened after step 6 and is not that commit (§12 AM-037).
- `npm trust` and staged publishing need npm ≥ 11.15.0 (R9 §2.5). Path A uses the npmjs.com settings page and needs neither [INFERENCE: R9 does not state it].
- **Acceptance:**
  - `npm view @websublime/line-genui@<step 5 version> dist.attestations` shows a provenance attestation, and `dist-tags.canary` is that version; `latest` stays on the step 2 canary (§12 AM-038).
  - The package settings show the `snapshot-deploy.yml` trusted publisher and token publishing disallowed.
  - `docs/context/01-p4.md` records the step 2 and step 5 canary versions, the trusted publisher, the provenance and the token setting.

#### 6.P.5 P5 — Bundle-splitting verification

- **Owner:** infra-supervisor (file classes: §4 table; the `src/styles/index.ts` annotations are package source, §12 AM-022).
- **Deps:** P1, P9, C1. Blocks C2: P5 removes the "Zero-export smoke" step before C2 makes the `line-components` root export `setIconRegistry`, which that step rejects (`.github/workflows/checks.yml:29`; §6.C.0; §12 AM-019, L3R13-01). P1 is a Dep because the undeclared-specifier scan covers `line-genui` (§12 AM-020, L3R14-02). Each later C task extends the expected-tag table in the test.
- **Changes:**
  - `packages/line-components/__tests__/bundle-splitting.test.ts`, run by the existing "Unit tier" step (`.github/workflows/checks.yml:38-39`).
  - `packages/line-components/__tests__/line-element-identity.test.ts` (§7.5; §12 AM-020, L3R14-02).
  - Root `devDependencies` gain `"esbuild": "^0.28.2"` (R9 §3 probe 4 version). C22 also needs esbuild, so whichever of P5 and C22 lands first adds it (§12 AM-016).
  - `.github/workflows/checks.yml:28-29`, the "Zero-export smoke" step, is removed. The root-registers-nothing assertion of the harness replaces it (§10 SD24).
  - The comment at `packages/line-components/vite.config.mjs:3-4` ("Phase 00: dist/index.js must be a zero-export module") is removed with the criterion it states (§12 AM-020, L3R14-12).
  - `scripts/report-size.mjs` and the `createSheet` annotations (§7.6).
  - A "Size report" step after the "Pack verification (AM-036)" step (`.github/workflows/checks.yml:26-27`) runs `bun run scripts/report-size.mjs`. The step gates nothing (§10 SD21).
  - AM row to Phase 00 spec §9.1 and §6.F.5 for the removed RK11 smoke step and the added "Size report" step. §9.1 holds the zero-export criterion (`docs/specs/00-spec-design-system.md:2542`), and the step name cites it (`.github/workflows/checks.yml:28`). §6.F.5 lists the "Zero-export smoke" step (`docs/specs/00-spec-design-system.md:1821-1822`), and the row adds the "Size report" step after "Pack verification (AM-036)" there (`docs/specs/00-spec-design-system.md:1819-1820`; §12 AM-019, L2R13-01).
- **Contract:** §7.5 holds in full, except the `line-genui` registration row, which G4 adds to the harness (§6.G.4).
- **Acceptance:**
  - The test fails when a subpath registers a tag outside its §4.2 row.
  - The test fails when the esbuild bundle emits an `ignored-bare-import` warning.
  - An esbuild bundle (the §7.6 tool) of `import { commonReset } from '@websublime/line-core/styles'` from the tarball contains the `reset.common.css` string as built into the tarball's `dist/styles/index.js`, and none of the other ten built sheet strings; the minified build renames `createSheet`, so the check reads CSS, not call names. Its size is reported against R9's 1161 B for all 11 sheets (`packages/line-core/src/styles/index.ts:30`; R9 §2.1; §10 SD20; §12 AM-003, L2R2-12; §12 AM-005, L2R3-08; §12 AM-008, L2R4-07; §12 AM-009, L2R5-03).
  - `dist/` of `line-components` imports `@websublime/line-core` and `@websublime/line-core/styles` as bare specifiers (R9 §3 probe 6; §12 AM-020, L3R14-02).
  - A script check over `dist/**/*.js` of the three Vite packages finds no undeclared bare specifier. It runs inside `bundle-splitting.test.ts` (§12 AM-020, L3R14-02).
  - The identity test of §7.5 passes (plan §7.4; §12 AM-020, L3R14-02).

#### 6.P.6 P6 — CDN delivery check

- **Owner:** infra-supervisor.
- **Deps:** P4, C1, C2. P6's canary run uploads `line-genui` through the `snapshot-deploy.yml` trusted publisher that P4 step 4 adds and step 5 validates (§6.P.4; §12 AM-037). P6 runs against a `0.2.0` canary of `line-core` and `line-components` that contains C1 and C2, dispatched through `snapshot-deploy.yml` after C2 merges (§12 AM-036). The registry page uses an inline stub `LineIconRegistry` object, so P6 needs no `line-icons` canary. The P6 page uses no `line-icons` resolver; C22 precedes P6 only through C2 (§12 AM-008, L3R4-02, L2R4-01; §12 AM-009, L3R5-06; §12 AM-032, L3R23-02).
- **Changes:**
  - A Playwright file `packages/line-components/__tests__/cdn.e2e.ts` that runs only on `workflow_dispatch` and before each release, never on `pull_request` [INFERENCE: it needs published versions and live CDNs, R9 §2.3] (§10 SD25).
  - The CDN gate that C22 adds (§6.C.3). C22 blocks C2 and P6 needs a canary that contains C2, so C22 always lands first (§12 AM-016, L3R10-04; §12 AM-017, L3R11-03; file classes: §4 table, §12 AM-022):
    - `playwright.config.ts` gains `testIgnore: process.env.LINE_E2E_CDN ? [] : ['**/*cdn.e2e.ts']`. The pattern matches `cdn.e2e.ts` and `consumer-matrix.cdn.e2e.ts`, so the "Browser tier" step (`bun run e2e`, `.github/workflows/checks.yml:42-43`) skips both on `pull_request`.
    - `.github/workflows/cdn-check.yml`, triggered only by `workflow_dispatch`, runs `bun install --frozen-lockfile`, `bun run build` (the `playwright.config.ts` web servers serve the built output), `bunx playwright install --with-deps chromium firefox webkit` and `LINE_E2E_CDN=1 bunx playwright test cdn.e2e`. Before each release Miguel dispatches it and records the run in the release PR (§7.2; §12 AM-038).
  - The two documented paths in the Getting Started guide (task D3).
- **Contract:** §7.7 holds.
- **Acceptance:**
  - The jsDelivr page passes in Chromium, Firefox and WebKit.
  - The unpkg page passes in Chromium and WebKit. A Firefox failure caused by cold CORS or MIME errors is recorded with the response headers (R9 §2.3) [INFERENCE: R9 did not see MIME errors on the raw path].
  - The P6 PR Verify record records both runs; before each release the release PR records a new `cdn-check.yml` run (§9.4; §12 AM-037).
  - A registry set through `setIconRegistry` from the root `+esm` URL reaches a `<line-icon>` loaded from `icon/+esm`, which renders the icon. Each `+esm` URL inlines its own copy of `src/shared/icon-registry.ts` (jsDelivr issue #18337) [INFERENCE: not probed for `line-components`] (§6.C.3; §12 AM-006, D-G; §12 AM-007, L2R4-03).
  - Ordering case: the `<line-icon>` connects before `setIconRegistry` runs, and it still renders the icon (§6.C.3; §12 AM-008, L3R4-01).

#### 6.P.7 P7 — axe tier

- **Owner:** infra-supervisor.
- **Deps:** spec APPROVED. Blocks C1 (§10 SD86; plan §6). Component files land with C1 onwards (§12 AM-007, R4-L1-04).
- **Changes:**
  - Root `devDependencies` gain `"@axe-core/playwright": "^4.14.0"` (R8 §2.4).
  - A shared helper `packages/line-components/__tests__/a11y/axe.ts` that wraps `AxeBuilder` with the §7.4 ruleset.
  - Each component adds `<c>.e2e.ts` against its stories on `storybook-static` (port 4320, `playwright.config.ts:15-20`).
  - `@storybook/addon-a11y` stays in `apps/storybook/.storybook/main.ts:13` as the author panel (PRD §5.2).
- **Contract:** §7.4 holds.
- **Acceptance:**
  - The existing "Browser tier" step (`checks.yml:42-43`) runs the axe files in three engines.
  - A fixture with an unnamed inner `<button>` fails with `button-name` (R8 §2.4 fixture table).

#### 6.P.8 P8 — TypeScript 7 upgrade

- **Owner:** infra-supervisor.
- **Deps:** spec APPROVED. Blocks C1 (plan §6).
- **Changes:** §5 lists every file; §7.1 and the §6.P.8 Contract give the changes.
- **Contract:**
  - The same PR updates every live document that plan §2.9 lists, in one commit (plan §2.9).
  - The `inspector.ts:111` comment is package source, which the §4 table gives to webcomponents-supervisor. The orchestrator dispatches webcomponents-supervisor for it on the P8 branch, so the comment lands in the same PR but not in the one-commit document change (§4; plan §2.9; §12 AM-041).
  - The PR carries one AM row to the Phase 00 spec that covers these places: §3 diagram line 74; §6.A.3 `vite-plugin-dts` row (line 440) and `typescript` row (line 444); §6.B `line-core` row (line 610); §6.F.2 `vite.config.shared.mjs` block (lines 1670, 1685); §7.1 `emitDeclarationOnly` note (line 2450); §7.1 matrix (lines 2468–2469) (plan §2.9).
  - `docs/context/00-z20.md:49` stays as historical record (plan §2.9).
- **Acceptance:**
  - `bun run build`, `bun --filter '@websublime/*' typecheck` and `verify-pack` exit 0 on `typescript` 7.x.
  - `node_modules/.bin/tsc --version` prints 7.x.
  - `git grep -n 'vite-plugin-dts\|TypeScript 5\|5\.9\.3'` returns no hit in the files and Phase 00 spec places plan §2.9 lists or in `packages/line-core/src/mixins/inspector.ts`. Hits elsewhere are PROCESS §3 records or text that describes the TypeScript 5 history or P8, which P8 does not change (§12 AM-040, AM-041).

#### 6.P.9 P9 — `@websublime/*` external

- **Owner:** infra-supervisor.
- **Deps:** spec APPROVED, P8 (both edit `vite.config.shared.mjs`). Blocks C1.
- **Changes:**
  - `vite.config.shared.mjs` derives `external` from the package manifest (§10 SD2). The block below is the full file after P8 and P9.
  - Each `vite.config.mjs` passes `root: import.meta.dirname`.
  - `packages/line-components/package.json` removes `sideEffects` and declares `lit` and `@zag-js/core` (§4.2; §10 SD4, SD2). This baseline lands before C1 (§10 SD24).
  - An `output.chunkFileNames` function in `packages/line-components/vite.config.mjs` names the shared chunks of `src/shared/` modules `dist/shared/[name].js`, so the §7.5 isolation scan can tell shared code by path; the shared factory has no output hook for it, and default chunking stays (§10 SD4) [INFERENCE: not probed] (§12 AM-004, L3R2-08; §12 AM-005, L2R3-12).
  - AM row to Phase 00 spec §6.F.2 for the externals, and AM row to §4.7 for `sideEffects` (R9 §4).

```js
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';

// Shared Vite library-mode config factory (Phase 00 spec §6.F.2, Phase 1 spec P8, P9).
// Every name in `dependencies` and `peerDependencies`, and every subpath of it, stays external.
export default function shared(pkg) {
  const manifest = JSON.parse(readFileSync(join(pkg.root, 'package.json'), 'utf8'));
  const names = Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies });
  return defineConfig({
    build: {
      target: 'es2022',
      lib: { entry: pkg.entries, formats: ['es'] },
      rollupOptions: {
        external: (id) => names.some((name) => id === name || id.startsWith(`${name}/`)),
      },
      // Watch rebuilds keep dist/, so the `tsc --watch` declarations survive (§7.1; §12 AM-006, L2R3-04).
      emptyOutDir: !process.argv.includes('--watch'),
      sourcemap: true,
    },
  });
}
```

- **Contract:**
  - `line-core`, `line-components` and `line-genui` builds MUST leave every declared package external.
  - Every bare specifier in a built `dist/**/*.js` MUST name a declared package (§10 SD2).
- **Acceptance:**
  - `bun run build` passes with the derived externals, and `packages/line-core/dist/` still imports `lit` and `@zag-js/vanilla` as bare specifiers (`packages/line-core/dist/index.js:4`, `dist/machine/index.js:1`). Items that need a component in `line-components` are P5's (§6.P.5; §12 AM-020, L3R14-02).

#### 6.P.10 P10 — CEM wiring and packaging

- **Owner:** infra-supervisor.
- **Deps:** spec APPROVED, P8. Blocks the C1 Storybook docs and G5 (plan §6).
- **Changes:**
  - `packages/line-components/custom-elements-manifest.config.mjs`, written by the package build (§10 SD26):

```js
import { litPlugin } from '@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js';

// Shipped manifest (Phase 1 spec P10, D8). line-core sources are analysed so that
// inheritance from LineElement resolves by class name (R4 §2.3).
export default {
  globs: ['src/**/*.ts', '../line-core/src/**/*.ts'],   // [INFERENCE: the package-local ../line-core glob was not probed]
  exclude: ['**/*.test.ts', '**/*.stories.ts', '**/*.d.ts'],
  outdir: '.',
  packagejson: false,
  plugins: [...litPlugin()],
};
```

  - `packages/line-components/package.json` gains `customElements`, the `files` entry, the `./custom-elements.json` export and the `analyze` script (§4.2).
  - `apps/storybook/.storybook/preview.ts` imports the manifest through `@websublime/line-components/custom-elements.json` with `{ type: 'json' }` and calls `setCustomElementsManifest` before `preview` is exported (R4 §2.8). It imports `setCustomElementsManifest` from `@storybook/web-components-vite`, which re-exports `@storybook/web-components` (`node_modules/@storybook/web-components-vite/dist/index.d.ts:3`), as `preview.ts:6` already does for `Decorator` and `Preview` (§12 AM-017, L3R11-01). The JSON import type-checks without `resolveJsonModule` under the repo's `moduleResolution: bundler` [probe 2026-10-21, not in the research: tsc 5.9.3 and TypeScript 7.0.2 resolve and type `pkg/custom-elements.json` imported `with { type: 'json' }` through an `exports` key], so P10 changes no tsconfig for it (§12 AM-027).
  - `preview.ts` passes one manifest merged from the imported package manifests by concatenating their `modules` arrays (§10 SD94). G4 adds the `@websublime/line-genui/custom-elements.json` import once that manifest exists [INFERENCE: not probed; G4's acceptance checks that the Storybook API table for `<line-a2ui-surface>` renders].
  - `apps/storybook/.storybook/main.ts:24` loses the claim that the manifest loads on its own.
  - The root `custom-elements-manifest.config.mjs`, the `apps/storybook` `analyze` script, `customElements.json` in its `clean` script, and the "Storybook analyze (CEM)" step (`checks.yml:46-47`) are removed (§10 SD27).
  - `scripts/verify-pack.mjs:163` adds `customElements` to the `main`/`module`/`types` field list of check (a). The check then covers the `customElements` target of `line-components` and, once G4 lands, of `line-genui` (§10 SD94).
  - `.gitignore` drops its `customElements.json` line (`.gitignore:9`), whose producer, the `apps/storybook` `analyze` script, P10 removes, and the "(regenerated by `analyze`)" clause of the comment above it (`.gitignore:7`) (§12 AM-019, R13-L1-01). The existing unanchored `custom-elements.json` line (`.gitignore:10`) already ignores the `line-components` and `line-genui` package manifests.
  - `biome.json` drops `"!**/customElements.json"` from `files.includes` (`biome.json:91`) together with that `.gitignore` line (§12 AM-019, L3R13-03).
  - AM row to Phase 00 spec §6.A A2, §6.F.1, §6.F.5 and §7.3 for the move from a root-only manifest to a package manifest. §6.A A2 lists the `customElements.json` Biome ignore (`docs/specs/00-spec-design-system.md:429`), and §6.F.5 lists the "Storybook analyze (CEM)" step (`docs/specs/00-spec-design-system.md:1839-1840`) (§12 AM-019, L2R13-01; §12 AM-020, L2R14-01).
- **Contract:** §7.3 holds.
- **Acceptance:**
  - `verify-pack` fails when `custom-elements.json` is missing from the `line-components` tarball.
  - `apps/storybook/.storybook/preview.ts` calls `setCustomElementsManifest`, and the Storybook build passes with the `line-components` package manifest. The autodocs page of `line-button` is C1's check (§6.C.6; §12 AM-020, L3R14-03).
  - The analyser runs before the Storybook build by construction, because the root build runs packages before apps (`package.json:23`).

#### 6.P.11 P11 — Visual regression tier

- **Owner:** infra-supervisor (file classes: §4 table; the files under `packages/line-components/__tests__/visual/` are package tests, §12 AM-022).
- **Deps:** spec APPROVED. Blocks C1, as P7 does (§10 SD86, SD98; plan §6). P11 commits no `.visual.ts` file; the Roles visual files land in P12, which needs the P11 workflows on `main` (§6.P.12; see Timing). Component stories land with C1 onwards.
- **Changes:**
  - `playwright.config.ts` gains a fourth project, `{ name: 'visual', testMatch: 'packages/line-components/__tests__/visual/*.visual.ts', testIgnore: process.env.LINE_VISUAL_OFF_PAIRS ? [] : '**/*.off-pairs.visual.ts', use: { ...devices['Desktop Chrome'] } }`. A project `testMatch` takes precedence over the config `testMatch` (`playwright` 1.64.0 `lib/common/index.js:599`), so the visual files run only in this project, in Chromium. The three engine projects keep `packages/**/*.e2e.ts` and `apps/**/*.e2e.ts` (`playwright.config.ts:5`), which match no `.visual.ts` file. The `testIgnore` follows the C22 `LINE_E2E_CDN` pattern (§6.P.6): once P12 adds the Roles files, `--list` without `LINE_VISUAL_OFF_PAIRS` shows no `*.off-pairs.visual.ts` file in `[visual]`, and with it set shows `roles.off-pairs.visual.ts` (orchestrator probe 2026-10-21, `playwright` 1.64.0; §6.P.12; §12 AM-034, AM-036).
  - A shared helper `packages/line-components/__tests__/visual/story.ts` opens a story on `storybook-static` (port 4320, `playwright.config.ts:15-20`) at `/iframe.html?id=<story-id>&viewMode=story`, as the smoke tier does (`apps/storybook/__tests__/storybook-smoke.e2e.ts:69`), with an optional `&globals=` and `&args=` suffix, and calls ``expect(page).toHaveScreenshot(name, { fullPage: true })``, where `name` defaults to `` `${storyId}.png` ``.
  - Each C1–C20 row adds `packages/line-components/__tests__/visual/<c>.visual.ts` over its stories and commits the baselines beside it. Under the default path template `{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{-snapshotSuffix}{ext}` (`lib/worker/workerProcessEntry.js:1255`), whose suffix is `process.platform` (`lib/index.js:356`), a baseline of `<file>.visual.ts` is `<file>.visual.ts-snapshots/<name>-visual-linux.png`, for example `<c>.visual.ts-snapshots/<story-id>-visual-linux.png`.
  - `.github/workflows/visual-baselines.yml`, triggered only by `workflow_dispatch` on the branch picked at dispatch, runs on `ubuntu-latest`, as `checks.yml` does (`.github/workflows/checks.yml:9`), with `permissions: { contents: read }`. It runs `bun install --frozen-lockfile`, `bun run build` (the second web server serves the `storybook-static` the build writes, `playwright.config.ts:16-17`), `bunx playwright install --with-deps chromium` and `bunx playwright test --project=visual --update-snapshots` with `LINE_VISUAL_OFF_PAIRS=1`, so it writes the off-pair baselines too. It then uploads `packages/line-components/__tests__/visual/` with `actions/upload-artifact` pinned to a full commit SHA, the Phase 00 spec AM-040 pattern (`.github/workflows/deploy-site.yml:27`).
  - `.github/workflows/visual-off-pairs.yml`, triggered only by `workflow_dispatch`, runs on `ubuntu-latest` with `permissions: { contents: read }`, runs the same install and build steps, and runs `bunx playwright test --project=visual` with `LINE_VISUAL_OFF_PAIRS=1`, which compares the default and off-pair screenshots against the committed baselines (§12 AM-033).
  - `.gitignore` ignores `**/*.visual.ts-snapshots/*-visual-darwin.png` and `**/*.visual.ts-snapshots/*-visual-win32.png`. `git check-ignore` matches both patterns and leaves a `-visual-linux.png` file unignored (orchestrator probe 2026-10-21; §12 AM-034).
- **Baseline procedure:** a PR that adds or changes a story or a style it shows dispatches `visual-baselines.yml` on its branch, downloads the artifact, and commits the `-visual-linux.png` files that changed. The PR diff shows the changed baselines to the reviewer. Before each release, `visual-off-pairs.yml` is dispatched on `main`, and Miguel records the run in the release PR (§7.2; §10 SD98; §12 AM-033, AM-038).
- **Local runs:** under `CI=1`, a missing baseline fails the test ("A snapshot doesn't exist at …-visual-darwin.png, writing actual.", exit 1) and writes the actual image as a `-visual-darwin.png` file beside the test; with `--ignore-snapshots` the same run passes (exit 0) and writes no file (orchestrator probe 2026-10-21, `playwright` 1.64.0, darwin). Off Linux, the Verify record therefore runs `bun run e2e --ignore-snapshots` (`bun run` passes the flag to `playwright test`, `package.json:25`), and the CI "Browser tier" run is the visual evidence (§12 AM-034).
- **Timing:** GitHub dispatches a `workflow_dispatch` workflow only once its file is on the default branch (GitHub docs, "Manually running a workflow": "To trigger the `workflow_dispatch` event, your workflow must be in the default branch"; `docs/context/00-f3.md:31-32`), so no check that needs `visual-baselines.yml` or `visual-off-pairs.yml` runs before P11 merges. P11 commits no `.visual.ts` file, so the `visual` project runs no test and the "Browser tier" step passes (`playwright test --pass-with-no-tests`, `package.json:25`). The checks that need a dispatch run in P12, after P11 merges, as 00-F3 ran its first publish after its merge (`docs/context/00-f3.md:84-89`). PROCESS §6 binds one PR per row, and the merge flips the row to `done` (`docs/PROCESS.md:140-147`, `:167`; §12 AM-045), so the Roles visual files are their own row, P12 (§6.P.12; §12 AM-035).
- **Contract:**
  - The `visual` project MUST run Chromium only (§10 SD98).
  - Every committed baseline MUST come from a `visual-baselines.yml` run (§10 SD98).
  - Every story of every C1–C20 component MUST have a committed baseline (PRD §5.2; §6.C.6).
- **Acceptance:**
  - The existing "Browser tier" step (`bun run e2e`, `.github/workflows/checks.yml:42-43`) passes with the `visual` project defined.

#### 6.P.12 P12 — Roles visual baselines

- **Owner:** infra-supervisor (file classes: §4 table; the files under `packages/line-components/__tests__/visual/` are package tests, §12 AM-022).
- **Deps:** P11 (§6.P.11 Timing; §12 AM-035). Blocks C1, so the default pairs gate every PR from C1 on, as AM-033 decided (§10 SD86, SD98; §12 AM-033, AM-036).
- **Changes:** `packages/line-components/__tests__/visual/roles.visual.ts` and `roles.off-pairs.visual.ts` over the `Design System/Roles` story `Toolbar` (`design-system-roles--toolbar`), with their baselines from a `visual-baselines.yml` run on the PR branch (§10 SD98; §12 AM-033). PRD §5.2.1 requires a baseline for every supported `(accent, gray, mode)` combination:
  - `roles.visual.ts` holds the default pairs: each of the 31 `ACCENT_HUES` with the auto-paired gray, in light and dark, 62 screenshots at `&globals=accent:<hue>&args=mode:<mode>`. It runs in the "Browser tier" step and gates the merge.
  - `roles.off-pairs.visual.ts` holds the off pairs: each accent with each of the five `GRAY_HUES` that are not its auto pair, set explicitly, in light and dark, 310 screenshots at `&globals=accent:<hue>;gray:<gray>&args=mode:<mode>`. It runs only in `visual-off-pairs.yml` and does not gate a PR. PRD §5.2.1 defines an off pair as "a non-auto-paired gray with a given accent" (`docs/PRD.md:548`); each auto pair is one of the six `GRAY_HUES` (`packages/line-themes/src/defaults.css`), so the default pair is not repeated (§12 AM-035).
  - Both files import `ACCENT_HUES` and `GRAY_HUES` from `@websublime/line-schemas`, which `line-components` declares as a devDependency (§4.2; §12 AM-047).
  - `roles.off-pairs.visual.ts` declares all 372 `(accent, gray, mode)` tests, 31 accents by six grays by two modes, with the gray set explicitly. A worker-scoped Playwright fixture finds each accent's auto pair in Chromium from the computed cascade. It opens the story with only the accent global and reads `--line-gray-1` to `--line-gray-12` on `<html>`. It compares them with `--line-<gray>-1` to `--line-<gray>-12` of each gray and requires exactly one match; any other count fails the run. The test of the auto pair calls `test.skip` with the reason "default pair, covered by roles.visual.ts". 310 tests take a screenshot and 62 skip. The built `packages/line-themes/dist/defaults.css` is minified, so the fixture reads no CSS text (§12 AM-047).
  - Each call passes `story.ts` the `name` `` `toolbar-${accent}-${gray ?? 'auto'}-${mode}.png` ``, so under the §6.P.11 path template each combination has its own baseline, for example `roles.visual.ts-snapshots/toolbar-indigo-auto-dark-visual-linux.png` and `roles.off-pairs.visual.ts-snapshots/toolbar-indigo-sand-dark-visual-linux.png`; the default name `` `${storyId}.png` `` would give every combination one file (§12 AM-035).
  - The `accent` and `gray` globals set `data-accent` and `data-gray` on `<html>` (`apps/storybook/.storybook/preview.ts:19-29`); an unset `gray` global leaves the auto pair. Light or dark is the story's `mode` arg (`apps/storybook/stories/design-system/roles.stories.ts:63-66`), which sets `color-scheme` on the page (`:57-58`). On `storybook-static` (Storybook 10.6.2), `&globals=accent:indigo;gray:sand` set both attributes, `&args=mode:dark` set `color-scheme: dark`, and `&globals=accent:crimson` changed the `Toolbar` screenshot (orchestrator probe 2026-10-21; §12 AM-033).
- **Timing:** P12 opens after P11 merges, so `visual-baselines.yml` and `visual-off-pairs.yml` are on `main` and can be dispatched on a branch (§6.P.11 Timing). Before the P12 PR opens, the checks that need a dispatch run on a throwaway branch made from `main`, and the P12 PR Verify record (PROCESS §5) records them. `visual-baselines.yml` checks out the remote branch, so P12 commits and pushes `roles.visual.ts` and `roles.off-pairs.visual.ts` before the run. Their baselines arrive in a later commit, before the PR opens. The squash merge lands the files and their baselines on `main` in one commit, so no `.visual.ts` file lands on `main` without its baselines and the gate is never vacuous (§12 AM-034, AM-035, AM-047).
- **Contract:**
  - Every supported `(accent, gray, mode)` combination MUST have a committed baseline of `design-system-roles--toolbar`; the default pairs gate every PR, and the off pairs run before each release (PRD §5.2.1; §10 SD98; §12 AM-033).
- **Acceptance:**
  - Before the P12 PR opens, on a throwaway branch made from `main`: a throwaway `.visual.ts` file over an existing design-system story gets its baseline from a `visual-baselines.yml` run on that branch, and that run uploads an artifact that holds the `-visual-linux.png` baseline of that file. That baseline is downloaded and committed to the throwaway branch; a `visual-off-pairs.yml` dispatch on that branch then passes against it, and a second dispatch fails after a style change to that story. The P12 PR Verify record records the three runs (§12 AM-034, AM-035).
  - `--list` shows `roles.visual.ts` only under `[visual]`; the three engine projects run no `.visual.ts` file.
  - The "Browser tier" step runs `roles.visual.ts` against its 62 committed baselines and passes; a `visual-off-pairs.yml` dispatch on the P12 branch passes against the 310 committed off-pair baselines, and the P12 PR Verify record records it (§12 AM-033, AM-035).
  - On macOS, `bun run e2e --ignore-snapshots` passes with `roles.visual.ts` present and leaves no `-visual-darwin.png` file in the working tree (§12 AM-034, AM-035).

#### 6.P.13 P13 — Release trusted publisher

- **Owner:** infra-supervisor, with Miguel for the npmjs.com step.
- **Deps:** every other Phase 1 row except D3 and Z3, the rows the exit sweep files included (§6.D.3; §6.Z.2; §12 AM-037, AM-038). A trusted publisher that no publish validates expires 48 hours after creation (R9 §2.5; Phase 00 spec §7.2), so P13's ledger row stays `blocked` until the main session has run the exit sweep, the sweep's rows are `done` and Miguel has recorded the release-time runs on `main`, as D3 stays `blocked` until the Version PR merges (§6.D.3). The orchestrator (main session or `sdlc`) then flips the row `blocked → todo` (§6.Z; §12 AM-040, AM-041).
- **Changes:**
  - `docs/context/01-p13.md`, which records the evidence of §6.P.4 step 7: the `release.yml` trusted publisher. The step runs on npmjs.com; the file gives the row a PR, as §6.P.4 explains for P4 (§12 AM-036, AM-037).
  - A `minor` changeset for each package that the merged Phase 1 changesets do not bump at `minor` (`bun run changeset status`), so a package with only `patch` changesets also reaches `0.2.0`; Phase 00 precedent: Version PR #218 bumped `line-themes` and `line-components` only to `0.0.1` because their pending changesets were all `patch`, and row `00-Z6` fixed it (`docs/plans/00-tasks-design-system.md:120`) (§7.2; §10 SD75; §12 AM-039). The §4 catch-all row covers changeset entries (§12 AM-038).
- **Timing:** step 7 runs within the 48 hours before the Phase 1 Version PR merge (Phase 00 spec AM-038 (5)), so P13 lands in that window. The Version PR, which `changesets/action` opens, has no row, as in Phase 00 (Version PR #218, row `00-Z7`; §12 AM-037). P13 starts after the exit sweep has run and its rows are done, and after Miguel has recorded the release-time runs on `main` (§7.2). If the Version PR does not merge within 48 hours of step 7, Miguel recreates the `release.yml` trusted publisher before the merge (Phase 00 spec §7.2; §12 AM-038).
- **Contract:** P13 MUST follow path A, the Phase 00 spec AM-038 order, as §6.P.4 does.
- **Acceptance:**
  - The package settings show two trusted publishers before the first stable release (plan §7.4).
  - `docs/context/01-p13.md` records the `release.yml` trusted publisher.
  - `bun run changeset status` (`package.json:19`) lists all nine packages at `minor` (§7.2; §12 AM-038).

### 6.C Stream C — Core Primitives

#### 6.C.0 Overview and order

- Owner of every C task: `webcomponents-supervisor`, as the accountable supervisor (plan §4.0). File classes follow the §4 table; for example, the C22 CDN gate files and the C23 `bun-test-preload.ts` change are infra-supervisor edits (§12 AM-022).
- Stream C ships the 20 core primitives of PRD §4.1 (plan §2.2) and three `line-core`/`line-icons` prerequisites: C21, C22 and C23 (plan §4.3; §10 SD19).
- C21–C23 take numbers after the 20 component rows, so C1–C20 keep their component mapping (plan §4.3).

**Order (plan §4.3, §6)**

| Step | Tasks | Gate |
|---|---|---|
| 1 | C21, C23, P7, P8, P9, P10, P11, P12, Z5 | Spec APPROVED. All nine land before C1, P9 and P10 follow P8, and P12 follows P11 (plan §6; §6.P.9, §6.P.10, §6.P.12, §6.Z.3; §10 SD19, SD86, SD98; §12 AM-036, AM-048). |
| 2 | C22 | Lands before C2 (plan §6). It fetches icons from a consumer-set base URL (§10 SD89–SD92). |
| 3 | C1 Button, C2 Icon, C3 Stack, C4 Separator | Ship without descriptors. Stream G writes their descriptors (plan §4.3, PRD §7.3 validating set). P5 lands after C1 and before C2, because C2 makes the `line-components` root export `setIconRegistry` and the "Zero-export smoke" step that P5 removes rejects any root export (`.github/workflows/checks.yml:28-29`; §6.P.5; §12 AM-019, L3R13-01). |
| 4 | G1–G7 | Validate on C1–C4 (plan §6). |
| 5 | C5–C20 | After G1, G4 and G5; C12, C13 and C16 also after G3 (§10 SD86; §12 AM-020, L3R14-05; §12 AM-023, L2R16-02). Each ships its descriptor in the same PR (plan §2.2, §4.3). |

- Every C1–C20 row runs this sequence (plan §4.3).
  1. Component spec APPROVED (PRD §8.3).
  2. Implementation.
  3. Descriptor in the same PR (C5–C20 only).
  4. Storybook docs.
  5. CEM entry.
  6. Changeset.
- Component internals belong in the component specs `docs/specs/NNNN-<component>.md`, numbered by the PRD §4 spec link (plan §2.3).

#### 6.C.1 C21 — `LineMachineController.updateProps` (D7)

- **Owner:** `webcomponents-supervisor`.
- **Deps:** spec APPROVED. Blocks C1 (plan §6).
- **Changes**
  - `packages/line-core/src/machine/line-machine-controller.ts`: the controller calls `updateProps` on every host update, and a component declares its machine props as a function of its properties (plan §5.6 D7 (a); R7 §6 OQ1 (b)).
  - `packages/line-core/README.md:10` and `packages/line-core/src/machine/index.ts:2`: replace the "four public" count. `@zag-js/vanilla` exports five values and `line-core` leaves out `toStyleString` (Phase 00 spec AM-073). The listed names stay (plan §4.3).
  - An update-rate harness under `packages/line-core/__tests__/` [INFERENCE: location] that measures a fixture machine (§10 SD28; §12 AM-020, L3R14-04).

**Contract**

- The controller MUST call `updateProps` from its host-update path on every host update (plan §5.6 D7 (a)).
- A component MUST declare machine props as a function of its own properties. It MUST NOT call `updateProps` itself and MUST NOT send events from `updated()` to carry props (plan §5.6 D7 (b), (c) rejected).
- The controller MUST keep starting machines in `hostConnected` (R7 §6 OQ7 (a); §10 SD29; `packages/line-core/src/machine/line-machine-controller.ts:66`).
- Each `VanillaMachine.updateProps` call wraps the previous props source, and `prop()` re-runs the whole chain. A `prop()` read grew from 0.013 ms to 0.397 ms over 4,000 calls (R7 §2.3, probe P4).
- C21 MUST ship the harness that measures the host update rate of a machine and MUST set a budget (§10 SD18). The C21 PR records the budget and its unit, measured on a fixture machine, because no component machine exists before C1. The highest expected rate comes from agent data bindings that stream into props [INFERENCE] (§12 AM-020, L3R14-04).
- Each machine row, C1, C5, C6, C8, C11 and C16 (§6.C.4), MUST measure its component's host update rate as C21 does and record it in its PR. The first row whose rate exceeds the budget adds the subclass below; webcomponents-supervisor owns it (§6.C.6; §10 SD18; §12 AM-020, L3R14-04).
- C21 MUST file an upstream Zag issue on the nesting closure chain and link it from the task PR (§10 SD18; R7 §6 OQ1).
- If a measured rate exceeds the budget, `line-core` MUST ship a `VanillaMachine` subclass whose `updateProps` replaces the props source instead of nesting. The controller MUST use the subclass only for the components past the budget (§10 SD18). The first machine row past the budget adds it (§12 AM-020, L3R14-04).
- The subclass MUST stay inside `line-core`. Components never import `@zag-js/vanilla` (ARCH §8; `packages/line-core/README.md:12`).
- Zag stays on 1.x at `^1.46.0` until 2.0.0 ships stable (R7 §6 OQ8 (a); §10 SD30).

**Acceptance**

- A controller test proves a host property change reaches the machine guard on the next event without a component call.
- The C21 PR reports the budget and its unit, and the rate of the fixture machine (§12 AM-020, L3R14-04).
- The C21 PR links the upstream issue.
- README and `machine/index.ts` state the correct count.

#### 6.C.2 C23 — `LineElement` attaches `ElementInternals`

- **Owner:** `webcomponents-supervisor` (file classes: §4 table; plan §4.0; §12 AM-022).
- **Deps:** spec APPROVED. Blocks C1 (§10 SD19).
- **Changes**
  - `packages/line-core/src/line-element.ts`: attach internals once per element, keep them in an ES `#private` field and expose them through a Symbol-keyed accessor (§10 SD19; §12 AM-002; R8 §2.5 option (c)).
  - `packages/line-core/src/internals.ts` (+): defines `export const INTERNALS = Symbol('line.internals')` and imports nothing. `line-element.ts` and `mixins/form-associated.ts` import it, and `index.ts` re-exports it, so no import cycle forms (§10 SD19; §12 AM-002; §12 AM-004, L3R2-02).
  - `packages/line-core/src/line-element.ts:30-32`: replace the empty `reflectState` with a body that writes the host attribute with ``this.toggleAttribute(`data-${name}`, active)`` and the custom state `name` through `this.#internals.states?.add(name)` and `?.delete(name)`. The guard is the one the mixin override has (`form-associated.ts:135`), so `packages/line-core/__tests__/form-associated.test.ts:134-141`, which deletes `states` from the fake internals, keeps passing; without it the call throws `TypeError` (orchestrator probe 2026-10-21, Bun; R8 §2.5; ARCH §14.8; §12 AM-032, L3R23-09; §12 AM-034, L2R24-04, L3R24-03).
  - `packages/line-core/src/mixins/form-associated.ts:77-82`: drop its own `attachInternals()` call and reuse the base accessor through the Symbol key (§10 SD19). The mixin's `reflectState` override (`form-associated.ts:125-142`), which writes through `this.dataset[name]`, and the `dataset` sentences of its doc comment (`:59-64`) are removed, so form-associated components use the `LineElement` body (§12 AM-032, L3R23-09).
  - `bun-test-preload.ts` gives happy-dom a fake `HTMLElement.prototype.attachInternals` after `GlobalRegistrator.register()`, built from `FakeInternals` in `packages/line-core/__tests__/mocks/element-internals.ts`. happy-dom has none (`packages/line-core/__tests__/mocks/element-internals.ts:3`), and without it every unit test that builds a `LineElement` subclass throws, for example `packages/line-core/__tests__/direction.test.ts:45` and `line-machine-controller.test.ts:63` (§7.8; §12 AM-020, L3R14-01).
  - `installElementInternals()` in `packages/line-core/__tests__/mocks/element-internals.ts` keeps the `attachInternals` it finds, and its `restore()` puts that function back instead of deleting it (`:39`), so the preload fake survives tests that install the mock (§12 AM-020, L3R14-01).
  - AM row to Phase 00 spec §6.F.3, whose `bun-test-preload.ts` block (`docs/specs/00-spec-design-system.md:1694-1720`) has no `attachInternals` fake (§7.8; §12 AM-021, m3).

**Contract**

- `LineElement` MUST call `attachInternals()` once for every component and keep the result in an ES `#private` field (§10 SD19; §12 AM-002).
- Subclasses MUST reach the internals as `this[INTERNALS]`, an accessor on the `LineElement` prototype keyed by the Symbol that `line-core` exports. The key MUST be a plain `Symbol(...)`, not `Symbol.for(...)`. No public `internals` property exists at runtime (§10 SD19; §12 AM-002).
- The Symbol description MUST be `line.internals` and MUST NOT be `internals` or `privateInternals`. axe matches own-property symbols by those two descriptions through `Object.getOwnPropertySymbols(node)`, so the description and the prototype accessor keep the element outside axe's WCCG lookup (R8 §2.4; axe-core v4.14.0 `doc/element-internals.md`; axe-core 4.14.0 `axe.js` `_getElementInternals`; §12 AM-004, L3R2-01; §12 AM-005, L2R3-10).
- `FormAssociated` MUST reuse that accessor. A second `attachInternals()` throws `NotSupportedError` (R8 §2.5, probe P1).
- `LineElement` MUST NOT set `formAssociated`. Only §7 components opt in (MANIFESTO Law 7; ARCH §7).
- `LineElement.reflectState` MUST reflect machine state as both `data-<state>` and `:state(<state>)`, so ARCH §14.8 holds for every component, Chip, ButtonGroup, AvatarGroup and IconButton included (§10 SD19; ARCH §14.8).
- The attribute MUST be written with ``toggleAttribute(`data-${name}`, active)``, not through `dataset`, so a kebab-case state such as `focus-visible` (ARCH §14.8 table) keeps its name. In Chromium `dataset['focus-visible'] = ''` throws `SyntaxError`, and happy-dom does not throw, so the unit tier cannot catch it (lens probe 2026-10-21; §12 AM-032, L3R23-09).
- `line-core` MUST NOT register internals on `globalThis` (§10 SD19). The protocol is a draft and exposes form state (R8 §2.5).
- Interactive roles stay on inner native elements, so the internals carry state and not the role (§10 SD31; R8 §2.4).
- C23 MUST measure the per-element cost of `attachInternals()` and report it in the PR (§10 SD19; R8 §6 Q2).

**Acceptance**

- A plain `LineElement` subclass reflects `data-x` and `:state(x)` through `reflectState`.
- A `FormAssociated(LineElement)` subclass attaches internals exactly once and keeps its form behaviour.
- `packages/line-core/__tests__/form-associated.test.ts:134-141` ("reflectState still sets the data attribute when internals have no custom states") passes against the `LineElement` body (§12 AM-034, L3R24-03).
- In the browser tier, in Chromium, Firefox and WebKit, a plain `LineElement` subclass and a `FormAssociated(LineElement)` subclass reflect `focus-visible` as `data-focus-visible` and `:state(focus-visible)` with no throw (ARCH §14.8; §12 AM-032, L3R23-09).
- No `globalThis` write exists in `line-core` source.
- A plain `LineElement` subclass instance exposes none of `_internals`, `internals` and `internals_`, as own or inherited properties, nor an own symbol with the description `internals` or `privateInternals`, and the exported Symbol reaches its internals. axe reads the three string names through `node[propName]` (R8 §2.4; axe-core 4.14.0 `_getElementInternals`; §12 AM-004, L3R2-01; §12 AM-005, L2R3-10).
- The PR reports the measured per-element cost.
- `bun test` passes with the new `LineElement`, including `direction.test.ts` and `line-machine-controller.test.ts`, which install no mock (§12 AM-020, L3R14-01).

#### 6.C.3 C22 — `line-icons` resolvers for consumer bundles

- **Owner:** `webcomponents-supervisor` (file classes: §4 table; plan §4.0; §6.P.6; §12 AM-022).
- **Deps:** spec APPROVED. R10 round 2 is delivered (row `00-Z47`). Blocks C2 (plan §6).
- **Problem:** the reference resolvers use a template `import()` with a Vite-only `?raw` query (`packages/line-icons/src/resolvers/lucide.ts:8`, `phosphor.ts:16`). It renders no icon in Vite 8.3.4 or esbuild 0.28.2 output. webpack 5.112.0 does not build today's resolvers without a `?raw` rule, and the Phosphor resolver also needs an alias (R10 round 2 §2.2, P3, P4).
- **Changes**
  - `packages/line-icons/src/resolvers/lucide.ts` and `phosphor.ts` fetch the SVG from a base URL (§10 SD89).
  - `createLucideResolver` and `createPhosphorResolver` gain a required `base` option (§10 SD90).
  - The resolver docs in `packages/line-icons/README.md` show the base URLs, the CSP note and the in-bundle recipe below.
  - C22 adds the consumer matrix test in two files: `packages/line-icons/__tests__/consumer-matrix.e2e.ts` for the bundler pages and `packages/line-icons/__tests__/consumer-matrix.cdn.e2e.ts` for the CDN-base pages (§10 SD96; §12 AM-016, L3R10-04).
  - Root `devDependencies` gain `"webpack": "^5.112.0"` for the matrix (R10 round 2 §2.1; §10 SD96). esbuild is the P5 entry, `"esbuild": "^0.28.2"`; whichever of P5 and C22 lands first adds it (§12 AM-016).
  - C22 adds the CDN gate of §6.P.6, `testIgnore` in `playwright.config.ts` and `.github/workflows/cdn-check.yml` (§12 AM-016, L3R10-04; §12 AM-017, L3R11-03).
  - C22 adds `packages/line-icons/src/registry.ts` and the `./registry`, `./resolvers/lucide` and `./resolvers/phosphor` export keys of §4.3 (plan §2.5; §12 AM-002, L3-09).
  - `packages/line-icons/__tests__/registry.test.ts`, `resolvers.lucide.test.ts` and `resolvers.phosphor.test.ts` call `createLucideResolver()` and `createPhosphorResolver()` without `base` at `registry.test.ts:7, :8, :19, :30, :37`, `resolvers.lucide.test.ts:15` and `resolvers.phosphor.test.ts:18, :24, :28, :32, :37, :41, :45, :51`. C22 makes every call without `base` pass a `base`, and the tests mock `fetch` (§10 SD90; §12 AM-020, L3R14-11; §12 AM-021, m2).

**Mechanism (§10 SD89)**

- Both reference resolvers MUST fetch `new URL(file, base)` and return the response text (R10 round 2 §2.2 (d)).
- Fetch is the only probed mechanism that renders in Vite, esbuild and webpack builds and on the jsDelivr `+esm` and unpkg paths, for both sets and for any name of the set (R10 round 2 §2.2, §2.6).
- Bundlers see no icon import, so a consumer configures no bundler (R10 round 2 §2.2, §2.5).
- The entry weighs 1054–1334 B gzipped with no map, and each icon costs one request, 221–483 B gzipped for the five probed files (R10 round 2 §2.3).
- `assertIconName` MUST still run before any fetch, so an agent-supplied name cannot leave the icon directory (`packages/line-icons/src/resolvers/icon-name.ts:1-6`; R10 round 2 §4).
- A path-only base MUST resolve against `document.baseURI`. A path-only base threw "Invalid base URL" in all three engines until the probe resolved it so (R10 round 2 §2.2 (d)).

| Set | `file` relative to `base` | Example `base` (jsDelivr, pinned to the peer version) | Source |
|---|---|---|---|
| Lucide | `<name>.svg` | `https://cdn.jsdelivr.net/npm/lucide-static@<version>/icons/` | `lucide.ts:8`; R10 §2.2 |
| Phosphor | `<weight>/<name>.svg` for `regular`, `<weight>/<name>-<weight>.svg` for the other five weights | `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@<version>/assets/` | `phosphor.ts:15-16`; R10 §2.2 |

**Base URL (§10 SD90)**

- `base` MUST be a required option of `createLucideResolver` and `createPhosphorResolver`. `createPhosphorResolver` keeps its `weight` default beside it (`phosphor.ts:9`).
- Without `base`, the resolver MUST reject, and `<line-icon>` stays in the neutral C8 state (§10 SD92).
- line://ui MUST NOT make a third-party request unless the consumer sets `base`.
- The docs MUST show a jsDelivr URL pinned to the installed peer version and a self-host recipe that serves the peer's `icons/` or `assets/` folder.
- The docs MUST state the CSP need. `connect-src` MUST list the icon origin. `connect-src 'self'` blocked jsDelivr in all three engines, and adding `https://cdn.jsdelivr.net` let the icons through (R10 round 2 §2.7, P13).
- The docs MUST state that unpkg's 404 carries no CORS header. A missing icon there surfaces as a network `TypeError`, not a readable 404. jsDelivr's 404 keeps `access-control-allow-origin: *` (R10 round 2 §2.4, P6).
- The docs MUST give a recipe for consumers who want icons inside their bundle. It is a custom `IconResolver` with one literal `import()` per name, for example of `lucide-static/dist/esm/icons/<name>.mjs`. That form rendered in all three bundlers with no configuration (R10 round 2 §2.2 (b′)). `@phosphor-icons/core` 2.1.1 has no JS form of its icons, so the recipe covers Lucide only (R10 round 2 §6 Q3, P2).
- The `lucide-static` peer floor stays `^1.16.0` unless the C22 owner finds a mapped name missing. The mapped names were checked against 1.16.0, 1.56.0 and 1.59.0, while `latest` is 1.60.0 (R10 P4, P8; npm registry on 2026-10-20).

**Miss path (§10 SD92)**

- An unknown name, a 404, a CORS or CSP block, and a missing `base` MUST make the resolver reject (R10 round 2 §2.4; §10 SD90 for a missing `base`; §12 AM-017, L2R11-06).
- `<line-icon>` MUST catch the rejection and render the neutral C8 state. No error reaches the consumer (ARCH §17.2 C8; MANIFESTO Law 9).
- On the agent path, the surface raises `line-a2ui-error` only for an `Icon.name` absent from its `iconMap`, or when `iconMap` is unset (§10 SD33; §6.G.4; §12 AM-006, D-M, L3R3-04).
- A resolver rejection on the agent path (a 404, a CORS or CSP block, a missing `base`, an unset registry) leaves `<line-icon>` in the neutral C8 state and raises no surface error. `<line-icon>` emits no event for it, and the surface holds no registry (§12 AM-004, D-R; §12 AM-006, L3R3-04).

**Acceptance contract**

- A consumer production build with Vite 8, esbuild and webpack MUST render a resolved icon with no consumer bundler plugin (plan §2.5; R10 §6 Q3).
- A no-build page over jsDelivr `+esm` and a no-build page over unpkg raw files MUST render the same icon (R10 §6 Q3; §10 SD32).
- The ARCH §11 rule "zero icons bundled in `line-icons` core" holds (ARCH §11).
- The R10 round 2 matrix runs as C22's acceptance test. It covers Vite, esbuild and webpack builds of the packed tarball and the jsDelivr `+esm` and unpkg raw pages, in Chromium, Firefox and WebKit, for `house` in both sets, Phosphor `heart` with the `fill` weight, `rocket`, and the unknown `definitely-not-an-icon` (R10 round 2 §2.1, §2.2).
- The bundler pages use a self-hosted base and run in the "Browser tier" step. The CDN-base pages need live CDNs and run with P6 on `workflow_dispatch` and before each release, through the CDN gate of §6.P.6: `playwright.config.ts` ignores `**/*cdn.e2e.ts` unless `LINE_E2E_CDN` is set, and `.github/workflows/cdn-check.yml` sets it (§10 SD96, as SD25; §12 AM-016, L3R10-04).
- A resolver created without `base` rejects (§10 SD90).
- A Phosphor resolver called with `options.weight: 'fill'` fetches the `fill` file (§12 AM-004, D-W; §12 AM-006, L2R3-02; R10 §2.3).

The element-level acceptance items are C2 work and sit in "Icon surface acceptance" below (§12 AM-006, L2R3-02).

**Decided icon surface**

- `<line-icon>` takes the attributes `name`, `library`, `src`, `weight` and the boolean `mirror`, and has no default slot. `weight` reaches the registry as `options.weight` (§10 SD14; §12 AM-004, D-W; R10 §6 Q5, §2.3; PRD §4.1 Icon row). With `mirror` set, the `<line-icon>` stylesheet flips the glyph under `:dir(rtl)`; no TypeScript writes a style (§12 AM-006, L3R3-03; MANIFESTO Law 5).
- `<line-icon>` gains a JSON-serialisable `path` property that draws `<svg viewBox="0 0 24 24"><path>` and sets `d` through `setAttribute` (§10 SD33; R10 §2.1; ARCH §17.2 C1).
- An A2UI `Icon.name`, literal or bound, that is absent from the surface `iconMap` leaves the node in the neutral C8 state, and the surface raises `line-a2ui-error` (§10 SD33; §6.G.4; §12 AM-006, D-M; R1 §2.6).
- The A2UI name map lives in `line-icons` under a `./a2ui` subpath as per-set data (§10 SD14; R10 §6 Q1).
- Each map entry MUST carry the weight and the RTL mirror flag per name. Nine names mirror in RTL (§10 SD15; R10 §2.3).
- `./a2ui` MUST export a helper, `a2uiIconMap(set, { library })`. `set` is `'lucide' | 'phosphor'`, and `library` is the key under which the consumer registered that set (§10 SD14; §12 AM-006, D-M).
- `./a2ui` MUST export `type A2uiIconName`, the union of the 59 A2UI v0.9.1 `Icon.name` enum values (R10 §2.1, P2; R1 §2.6), kept in `packages/line-icons/src/a2ui/` (§12 AM-010, L3R5-04).
- `./a2ui` MUST export `type A2uiIconEntry = { library: string; name: string; weight?: string; mirror: boolean }` and `type A2uiIconMap = Readonly<Record<A2uiIconName, A2uiIconEntry>>`, keyed by A2UI name. `a2uiIconMap` copies `library` into each entry, writes the name in that set, `weight` and `mirror`, and returns a null-prototype frozen object (§12 AM-008, L3R4-03, L3R4-05).
- `line-genui` imports `A2uiIconMap` and `A2uiIconName` with `import type` only, so `./a2ui` of `line-genui` has no runtime import of `line-icons`, and `line-genui` never loads `line-icons` at run time (§12 AM-008, L3R4-03; §12 AM-009, L3R5-01).
- The consumer passes the result to the `<line-a2ui-surface>` property `iconMap`. On the agent path the surface looks the `Icon.name` up with `Object.hasOwn(iconMap, name)` and renders `<line-icon library name weight mirror>` from the entry (§6.G.4; §12 AM-006, D-M, L3R3-03; §12 AM-008, L3R4-05). The surface reads no set without `iconMap`.
- Setting or replacing `iconMap` MUST re-project every Icon node of the surface (§6.G.4; §12 AM-008, L3R4-04).
- `line-icons` MUST NOT pick a default set. The consumer registers one and names it in `a2uiIconMap` (§10 SD15; ARCH §11; §12 AM-006, D-M).
- The three Lucide collisions MUST be documented in the `./a2ui` docs (§10 SD15; R10 §2.3, §6 Q7).
- G2 owns `packages/line-icons/src/a2ui/` and its `./a2ui` export key (§12 AM-002, L3-09).

**Registry hook (§12 AM-002, D-L3-02; §12 AM-004, D-W, D-R)**

- `line-components` MUST define a structural registry interface, `LineIconRegistry`, with one method, `resolve(library: string, name: string, options?: { weight?: string }): Promise<string | SVGElement>`. `options` is a type literal, and `options.weight` carries the weight (§12 AM-004, D-W, L3R2-06; §12 AM-006, L3R3-05; R10 §2.3).
- The registry MUST live in one shared module, `packages/line-components/src/shared/icon-registry.ts`. The module stores the slot `{ registry, events }` at `globalThis[Symbol.for('line.icon-registry')]`, where `events` is an `EventTarget`. The slot is created on first access, by `setIconRegistry`, the `LineIcon.registry` getter or setter, or a `<line-icon>` connect, never at module load, so `define()` stays the only module-top side effect of `./icon`, and the root `"."` defines nothing and creates nothing (ARCH §12; §10 SD97 policy; §12 AM-010, L3R5-02). Every copy of the module reads and writes that one place, including the separate jsDelivr `+esm` bundles and other versions. R9 §2.3 shows separate `+esm` bundles; that each URL inlines its own copy of the module follows from jsDelivr issue #18337 [INFERENCE: not probed for `line-components`]. `setIconRegistry(registry)` and the static `LineIcon.registry` setter both write `registry` and dispatch a `line-icon-registry-change` event on `events`, named with the `line-` prefix because it is a cross-copy, cross-version contract (MANIFESTO Law 2; §12 AM-010, L3R5-03); the getter reads `registry` (§12 AM-004, D-R; §12 AM-006, D-G; §12 AM-007, L2R4-03; §12 AM-008, L3R4-01).
- `LineIconRegistry` and `setIconRegistry` MUST be exported from the `line-components` root `"."`, which defines no element (ARCH §12; §12 AM-004, D-R, L3R2-06).
- The consumer MUST be the only writer. It sets the registry through `setIconRegistry(registry)` or `LineIcon.registry`. `line-genui` MUST NOT write it, on the agent path or elsewhere (§12 AM-004, D-R).
- Every `<line-icon>` copy MUST subscribe to `events` through the global slot when it connects, unsubscribe when it disconnects, and resolve again on `line-icon-registry-change`. Setting the registry, through either API and from any module copy, therefore makes every connected `<line-icon>` resolve again, so an instance that connected before the registry was set leaves the C8 state (§12 AM-006, L3R3-06; §12 AM-008, L3R4-01; §12 AM-010, L3R5-03; ARCH §11).
- The `line-icons` `IconRegistry` satisfies the interface structurally through `resolve(library, name, options?)` (`packages/line-icons/src/index.ts:19`); its `IconResolverOptions` is an interface with an index signature (`index.ts:3-6`), and the C2 type-level case below checks the assignment [INFERENCE: not compiled]. `line-components` `src/` imports nothing from `line-icons`; only the C2 tests reach it, through a `devDependency`, so no layer edge is added (§3.2, §3.3; §12 AM-008, L2R4-02).
- With no registry set, a `name` lookup MUST leave `<line-icon>` in the neutral C8 state and MUST NOT throw (MANIFESTO Law 9; §10 SD92; §12 AM-004, L3R2-05).

**SVG injection (§10 SD91, SD95, SD97)**

C2 implements the icon surface above and this injection rule in `<line-icon>`.

- `<line-icon>` MUST parse every SVG string with `DOMParser` as `image/svg+xml`. The rule covers resolver output and the response of the `src` attribute (§10 SD91).
- `<line-icon>` MUST keep only the allowlisted elements and attributes below and drop everything else before it inserts the parsed node (§10 SD95).
- `<line-icon>` MUST drop every attribute on the never-pass list, and every attribute whose value contains `url(`, even where the attribute name is allowlisted (§10 SD95).
- A parsed document whose root is not `svg` MUST leave the neutral C8 state (R10 round 2 §2.7, P14).
- An `SVGElement` that a consumer's resolver returns MUST be inserted as is. The consumer built it, and no string sink is involved. The reference resolvers return strings (§10 SD95; `packages/line-icons/src/resolvers/lucide.ts:9`, `resolvers/phosphor.ts:17`).
- The string MUST pass through a Trusted Types policy named `line-icon` before `DOMParser` reads it. Under `require-trusted-types-for 'script'`, `DOMParser.parseFromString` rejects a plain string in all three engines (R10 round 2 §2.7, P13).
- `<line-icon>` MUST create the policy lazily, on the first SVG string it injects, once per realm behind a guard, when `trustedTypes` exists. The module MUST NOT create it at load, so `customElements.define()` always runs (§10 SD97; §12 AM-002; ARCH §12; MANIFESTO Law 6).
- If `createPolicy` throws, `<line-icon>` MUST render the neutral C8 state, and nothing reaches the consumer as an error (§10 SD97; MANIFESTO Law 9; ARCH §17.2 C8). It throws when the page's `trusted-types` list omits `line-icon`, or when a second copy of the module already created the policy.
- The docs MUST name the policy, so a page that enforces Trusted Types lists `trusted-types line-icon`.
- The parse step MUST keep elements in the SVG namespace only. Every Lucide and Phosphor SVG carries `xmlns` on the root `svg` (R10 round 2 addendum A1; §10 SD95; §12 AM-004, L2R2-05).
- The default `xmlns` declaration on the root `svg` MUST be accepted. Every prefixed namespace declaration (`xmlns:*`, for example `xmlns:xlink`) MUST be dropped, because `xlink:href` never passes (R10 round 2 addendum A1; §10 SD95; §12 AM-004, L2R2-05).
- The parse and allowlist step weighs about 0.5 KB gzipped [INFERENCE: not measured with the wider lists]. The R10 round 2 probe sanitiser weighed 477 B with the narrower lists (R10 round 2 §2.7).

| Allowlist | Entries | Source |
|---|---|---|
| Elements (9) | `svg`, `g`, `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon` | R10 round 2 §2.7, P14 for all but `g`; `g` is a design choice beyond the probe (§10 SD95) |
| Attributes, measured (23) | `class`, `cx`, `cy`, `d`, `fill`, `height`, `opacity`, `points`, `r`, `rx`, `ry`, `stroke`, `stroke-linecap`, `stroke-linejoin`, `stroke-width`, `viewBox`, `width`, `x`, `x1`, `x2`, `y`, `y1`, `y2` | The 22 Lucide attributes and the 4 Phosphor attributes of R10 round 2 §2.7, P14. The names come from the inventory of the 2143 `lucide-static` 1.56.0 files and the 9072 `@phosphor-icons/core` 2.1.1 files recorded in R10 round 2 addendum A1 |
| Attributes, presentation (10) | `transform`, `fill-rule`, `clip-rule`, `fill-opacity`, `stroke-opacity`, `stroke-dasharray`, `stroke-dashoffset`, `stroke-miterlimit`, `vector-effect`, `shape-rendering` | SVG 2 presentation attributes (W3C SVG 2, "Presentation attributes"). A design choice beyond the probe (§10 SD95) |
| Attributes, accessibility (3) | `aria-hidden`, `role`, `focusable` | WAI-ARIA attributes on SVG (W3C SVG 2) and the legacy `focusable` attribute. A design choice beyond the probe (§10 SD95) |

| Never passes | Entries | Reason |
|---|---|---|
| Attributes | `href`, `xlink:href`, `style`, every `on*` attribute, every attribute whose value contains `url(` | They load content, run script or reference other nodes (§10 SD95) |
| Elements | `script`, `style`, `foreignObject`, `use`, `a`, `image`, `defs`, `clipPath`, `mask`, `linearGradient`, `radialGradient`, `pattern` | They work through references or load content (§10 SD95) |

**SVG injection acceptance**

- A test SVG with `<script>`, `<foreignObject>`, `<a href="javascript:…">`, an `on*` attribute and a `style` attribute renders with all five removed, in Chromium, Firefox and WebKit.
- A `<use href="#x">` element and a `fill="url(#x)"` attribute are removed.
- A `g` element with `transform` and a `path` with `fill-rule="evenodd"` survive intact.
- Lucide `house` renders intact.
- A non-SVG document leaves the neutral C8 state.
- An `SVGElement` returned by a custom resolver is inserted unchanged.
- A page served with `require-trusted-types-for 'script'` and `trusted-types line-icon` renders the icon.
- A page served with `require-trusted-types-for 'script'` and `trusted-types other` leaves `<line-icon>` in the neutral C8 state, with no uncaught error (§10 SD97).
- An SVG with `xmlns:xlink` on its root renders with `xmlns:xlink` removed and the root `xmlns` kept (§10 SD95; §12 AM-004, L2R2-05).

**Icon surface acceptance (C2; §12 AM-006, L2R3-02)**

- A resolver created without `base` leaves `<line-icon>` in the neutral C8 state; the test builds the resolver from the `line-icons` devDependency (§10 SD92; §12 AM-008, L2R4-02).
- A `<line-icon name library>` with no registry set renders the neutral C8 state with no uncaught error (MANIFESTO Law 9; §12 AM-004, L3R2-05).
- A `<line-icon library="phosphor" name="heart" weight="fill">` passes `weight: "fill"` to the registry and renders the `fill` file (§12 AM-004, D-W; R10 §2.3).
- A connected `<line-icon>` in the C8 state renders its icon after `setIconRegistry(registry)` runs, and again after `LineIcon.registry` is set, including when the setter runs in another module copy that shares the global slot (§12 AM-006, L3R3-06; §12 AM-008, L3R4-01).
- A `<line-icon mirror>` renders flipped under `dir="rtl"` and unflipped under `dir="ltr"` (§12 AM-006, L3R3-03).
- Type-level: `export const r: LineIconRegistry = new IconRegistry()` compiles under TypeScript 7 in `__tests__/registry.types.ts`, which `typecheck` runs through `tsconfig.test.json`. The `export` keeps the Biome `noUnusedVariables` rule (`biome.json:33`) from flagging `r` (§4.2; §12 AM-006, L3R3-05; §12 AM-008, L2R4-02; §12 AM-032, L3R23-11).
- A missing or invalid icon leaves `<line-icon>` in the neutral C8 state, and nothing throws to the consumer (ARCH §17.2 C8; MANIFESTO Law 9). Today `IconRegistry.resolve` and the reference resolvers reject with a `[line-icons]` error, because each `throw` (`packages/line-icons/src/index.ts:21`; `resolvers/icon-name.ts:5`; `resolvers/phosphor.ts:13`) runs inside an `async` function; `<line-icon>` catches the rejection (§12 AM-006, L2R3-02; §12 AM-012, L2R7-01).
- Importing the root `"."` or `./icon` from the packed tarball leaves `globalThis[Symbol.for('line.icon-registry')]` `undefined` until first access (§12 AM-010, L3R5-02; §12 AM-011, L3R6-01).

#### 6.C.4 Component contract table (C1–C20)

Column notes:

- **Entry / tag** follows ARCH §12 and plan §2.2. The ten "family rule" rows are independents with one tag each, and Kbd / Shortcut is one tag `line-kbd` (§10 SD12).
- **Machine** follows plan §2.2 and PRD §4.1 unless a decision overrides it.
- **Role** names the decided placement. `—` means the component spec settles it from R8 §2.2.
- **htmx** follows rule C9 and plan §2.4. "Spec decides" means the spec runs the harness or marks the row `n/a` with a reason. "`n/a` expected" is a drafting expectation that each component spec confirms or overturns (§10 SD34).
- **Deps** lists the tasks that MUST merge before the row (plan §6; §10 SD86). C5 shares Button's machine through `src/shared/button-machine.ts` (ARCH §13.1; §12 AM-002). C6 opens with a probe across slotted `line-button` hosts (§10 SD10). C11 takes its avatars through a slot (§10 SD4).

| Task | Component | Deps | Spec file | Entry / tag | Tier and machine | Role placement | Form-assoc. | `agentExposed` | htmx row | The component spec still settles |
|---|---|---|---|---|---|---|---|---|---|---|
| C1 | Button | C21, C23, P7–P12, Z5 | `0002-button.md` | `./button` / `line-button` | Custom; press `idle → active` (§10 SD35) | Inner native `<button>`, host `aria-label` copied (§10 SD31) | Yes (ARCH §7; §10 SD36) | `true` | Spec decides; value-bearing only if a binding names a value prop (plan §2.4) | Parts, slots, loading part (ARCH §13.1, §13.5); screen-reader pass of the named `generic` host (R8 §6 Q1, Q5) |
| C2 | Icon | C21, C23, P5, P7–P12, C22, Z5 | `0014-icon.md` | `./icon` / `line-icon` | Static; resolvers through the `LineIconRegistry` interface, `resolve(library, name, options?)`, held in `src/shared/icon-registry.ts` at a `globalThis` symbol key whose slot holds `{ registry, events }`, which the consumer alone sets through `setIconRegistry()` or the static `LineIcon.registry`; the `line-icons` `IconRegistry` satisfies it, with no layer edge added (a `line-icons` devDependency only) (§6.C.3; §12 AM-002; §12 AM-004, D-W, D-R; §12 AM-006, D-G; §12 AM-008, L3R4-01, L2R4-02) | — (R8 §2.2) | No | `true` | `n/a` expected; not value-bearing [INFERENCE] | Decorative vs labelled semantics (R8 §2.2); implements the §6.C.3 icon surface with the `weight` and `mirror` attributes, registry hook, shared change notification, SVG injection rule and icon surface acceptance (§12 AM-006; §12 AM-008) |
| C3 | Stack | C21, C23, P7–P12, Z5 | `0018-stack.md` | `./stack` / `line-stack` | Static | — | No | `true` | `n/a` expected [INFERENCE] | Any `line-stack` list semantics beyond the A2UI `List` rule of §6.G.4 (R8 §6 Q11; §10 SD59) |
| C4 | Separator | C21, C23, P7–P12, Z5 | `0011-separator.md` | `./separator` / `line-separator` | Static | — | No | `true` | `n/a` expected [INFERENCE] | Orientation semantics (R8 §2.2) |
| C5 | IconButton | C21, C23, P7–P12, G1, G4, G5, C1, Z5 | `0003-icon-button.md` | `./icon-button` / `line-icon-button` | Custom; same machine as Button, imported from `src/shared/button-machine.ts` (ARCH §13.1; §12 AM-002) | Inner native `<button>` (§10 SD31) | No; `type="button"` only (§10 SD36) | `true` | Spec decides (plan §2.4) | Name sources it accepts (§6.C.5) |
| C6 | ButtonGroup | C21, C23, P7–P12, G1, G4, G5, C1, Z5 | `0004-button-group.md` | `./button-group` / `line-button-group` | Custom roving-focus `createMachine` on `@zag-js/core` 1.46.0 (§10 SD10) | `toolbar` (ARCH §13.1) | No | `true` | `n/a`; not compound (rule C9, plan §2.4) | Opens with the slotted roving-focus probe (§10 SD10; R8 §6 Q6) |
| C7 | Alert | C21, C23, P7–P12, G1, G4, G5, Z5 | `0006-alert.md` | `./alert` / `line-alert` | Static | — | No | `true` | `n/a` expected [INFERENCE] | `alert` vs `status` role (R8 §6 Q8; §10 SD37) |
| C8 | Chip | C21, C23, P7–P12, G1, G4, G5, Z5 | `0008-chip.md` | `./chip` / `line-chip` | Pre-built `@zag-js/toggle` 1.46.0; no remove button; not compound (§10 SD11) | Inner native `<button>` (§10 SD31) | No | `true` | Spec decides; value-bearing only if a binding names a value prop (plan §2.4) | Whether a binding names a value prop. If it does, `line-change` per ARCH §17.2 C3 and C9, and `line-input` only for live edits, which a toggle does not have; if not, no commit event (§12 AM-002; §12 AM-003, L3R2-07) |
| C9 | Badge | C21, C23, P7–P12, G1, G4, G5, Z5 | `0007-badge.md` | `./badge` / `line-badge` | Static | — | No | `true` | `n/a` expected [INFERENCE] | Count announcement [INFERENCE: R8 §2.2 covers dot-badge text, not counts] |
| C10 | Avatar | C21, C23, P7–P12, G1, G4, G5, Z5 | `0009-avatar.md` | `./avatar` / `line-avatar` | Static (plan §2.2; ARCH §13.2; PRD §4.1) | — | No | `true` | `n/a` expected [INFERENCE] | Slot and part details within ARCH §13.2 (§10 SD37) |
| C11 | AvatarGroup | C21, C23, P7–P12, G1, G4, G5, C10, Z5 | `0010-avatar-group.md` | `./avatar-group` / `line-avatar-group` | Custom (ARCH §13.2) | Overflow "+N" on an inner native `<button>` (§10 SD31) | No | `true` | `n/a`; not compound (rule C9, plan §2.4) | Overflow popover mechanism (R7 §6 OQ5); hover and focus expansion under WCAG 1.4.13 (R8 §6 Q10); avatars arrive by slot (§10 SD4) |
| C12 | Visually Hidden | C21, C23, P7–P12, G1, G3, G4, G5, Z5 | `0012-visually-hidden.md` | `./visually-hidden` / `line-visually-hidden` | Static | — | No | `false`: agent text that only screen readers hear (§10 SD38) | `n/a` expected [INFERENCE] | — |
| C13 | Portal | C21, C23, P7–P12, G1, G3, G4, G5, Z5 | `0013-portal.md` | `./portal` / `line-portal` | Static | — | No | `false`: moved nodes escape surface reconciliation [INFERENCE: not in R8] and focus order follows the move (§10 SD38; R8 §2.2) | `n/a` expected [INFERENCE] | Focus and reading order after the move (R8 §2.2) |
| C14 | Kbd / Shortcut | C21, C23, P7–P12, G1, G4, G5, Z5 | `0015-kbd.md` | `./kbd` / `line-kbd` (one tag, §10 SD12) | Static | — | No | `true` | `n/a` expected [INFERENCE] | OS-aware rendering (PRD §4.1) |
| C15 | Skeleton | C21, C23, P7–P12, G1, G4, G5, Z5 | `0016-skeleton.md` | `./skeleton` / `line-skeleton` | Static | — | No | `true` | `n/a` expected [INFERENCE] | Busy semantics (R8 §2.2) |
| C16 | Presence | C21, C23, P7–P12, G1, G3, G4, G5, Z5 | `0017-presence.md` | `./presence` / `line-presence` | Pre-built `@zag-js/presence` 1.46.0 | None; emits no ARIA (R8 §2.2) | No | `false`: needs host CSS exit animations, adds no meaning (§10 SD38) | `n/a` expected [INFERENCE] | Tracked node and unmount meaning, after the R7 §6 OQ2 three-engine probe (§10 SD37; R7 §6 OQ2, OQ3) |
| C17 | Grid | C21, C23, P7–P12, G1, G4, G5, Z5 | `0019-grid.md` | `./grid` / `line-grid` | Static | — | No | `true` | `n/a` expected [INFERENCE] | — |
| C18 | Center | C21, C23, P7–P12, G1, G4, G5, Z5 | `0020-center.md` | `./center` / `line-center` | Static | — | No | `true` | `n/a` expected [INFERENCE] | — |
| C19 | Aspect Ratio | C21, C23, P7–P12, G1, G4, G5, Z5 | `0021-aspect-ratio.md` | `./aspect-ratio` / `line-aspect-ratio` | Static | — | No | `true` | `n/a` expected [INFERENCE] | — |
| C20 | Spinner | C21, C23, P7–P12, G1, G4, G5, Z5 | `0022-spinner.md` | `./spinner` / `line-spinner` | Static, CSS-only (ARCH §13.5) | — | No | `true` | `n/a` expected [INFERENCE] | `status` vs `progressbar` vs `img`, label from the consumer (R8 §6 Q9; §10 SD37) |

- PRD v0.8.19 (§4.1, §4.11, §7.3), ARCH v0.8.5 §13.1 and plan §2.2 read "Custom" for ButtonGroup and "Pre-built" for Chip (§10 SD10, SD11).
- Every descriptor carries `agentExposed`, which defaults to `true`; a descriptor flagged `false` MUST carry a recorded reason (ARCH §17.3; §10 SD38).
- Roles set only through internals MUST get a screen-reader pass in their component spec (R8 §6 Q5; §10 SD39).
- Chip and AvatarGroup take the `common` and `button` reset modules, because each renders an inner native `<button>` (§10 SD31, SD84; ARCH §14.7). ButtonGroup and Presence keep `common` only (ARCH §14.7; §12 AM-002).
- C10 adds the `Image` `variant: "avatar"` route to the G2 `basic` map, so that variant renders `<line-avatar>` (ARCH §17.3; §6.G.2). Acceptance: on `<line-a2ui-surface>`, a message with the v0_9 basic id and an `Image` node with `variant: "avatar"` renders `<line-avatar>` (§12 AM-021, L3R15-02).
- C12, C13 and C16 carry `agentExposed: false` (§10 SD38). Acceptance for each, by descriptor identity: its descriptor's catalog name is not a key of `components` in the built `catalog.json`, and the G3 emitter, run over the built descriptor set, emits no tool for its descriptor. The catalog document keys each component by catalog name, not by tag (`docs/research/assets/01-r2/line-catalog.emitted.json:4-5`). G3 is a Dep of the three rows (§6.G.2, §6.G.3; §12 AM-021, L3R15-03; §12 AM-023, L2R16-01, L3R16-02).

#### 6.C.5 Button, IconButton, ButtonGroup and Chip semantics

**Button (C1)**

- The machine MUST model the press as `idle → active`, reflected as `data-active` and `:state(active)` (§10 SD35; ARCH §14.8; R7 §6 OQ4 (c)).
- An opt-in `pressed` attribute MUST make Button a toggle with `aria-pressed`, reflected as `data-pressed` and `:state(pressed)` (§10 SD35).
- `loading` and `disabled` MUST be props that guards read at event time, not finite states (§10 SD35; R7 §2.4 probe B1). Probe B1 tested `disabled` only; `loading` follows the same pattern [INFERENCE].
- A loading Button MUST stay focusable and expose `aria-disabled="true"` (§10 SD35; R7 §2.4; R8 §2.2) [INFERENCE: neither note applies `aria-disabled` to loading].
- The loading label MUST come from the consumer (§10 SD35; `docs/MANIFESTO.md:66`, component-level strings out of scope).
- ARCH v0.8.5 §13.1 carries the corrected state list (§10 SD35).
- The Button machine MUST live in `packages/line-components/src/shared/button-machine.ts`, so C5 imports it without importing Button (§12 AM-002; ARCH §13.1; MANIFESTO Law 4).
- C1 replaces the "Empty in Phase 00" sentence of `packages/line-components/README.md:3`, which stops being true once Button ships (§5; §12 AM-020, L3R14-12).

**IconButton (C5)**

- On the agent path the descriptor MUST mark the name required. The surface MUST replace a nameless node with a placeholder and raise `line-a2ui-error` before render (§10 SD36; ARCH §17.4).
- On hand-written markup the axe gate MUST catch a missing name through `button-name` on the inner native `<button>` (§10 SD36; R8 §2.4 probe P1; R2 §6 Q5).
- IconButton MUST be `type="button"` only and MUST NOT be form-associated. ARCH §7 stays unchanged (§10 SD36).
- IconButton MUST import its machine from `src/shared/button-machine.ts` and MUST NOT import Button's component module (§12 AM-002; ARCH §13.1).
- Acceptance: on `<line-a2ui-surface>`, an IconButton node without a name renders a placeholder and raises `line-a2ui-error` (§6.G.4; §12 AM-020, L3R14-06).

**ButtonGroup (C6)**

- ButtonGroup MUST discover its buttons through `slotchange` and MUST NOT import Button (§10 SD10; ARCH §13.1; MANIFESTO Law 4).
- The roving-focus machine is a custom `createMachine` on `@zag-js/core` 1.46.0 (§10 SD10; R7 §2.4; R8 §6 Q6).
- The component spec MUST open with a slotted roving-focus probe across `line-button` hosts with inner native buttons (§10 SD10).
- Revisit the machine when `@zag-js/toolbar` ships stable and the repo moves to Zag 2. Today only 2.0.0-next versions exist (§10 SD10; plan §2.2).

**Chip (C8)**

- Chip is separate from `Button[pressed]` by product role (PRD §4.1; §10 SD35).
- Chip uses `@zag-js/toggle` 1.46.0, with no remove button (§10 SD11; R7 §2.1, §2.4).

#### 6.C.6 Obligations of every C1–C20 row

| Obligation | Source |
|---|---|
| Pass the PRD §5.2 8-point checklist: render, reactive props, slots, parts, custom properties, events, keyboard, axe. Keyboard navigation is tested in the Playwright Browser tier (§7.8; §10 SD99) | PRD §5.2; plan §7.1 |
| Storybook docs complete | plan §4.3, §7.1 |
| Changeset entry | plan §4.3, §7.1 |
| CEM entry with complete JSDoc; `@fires` with typed `detail` is mandatory | ARCH §17.2 C3, C7; plan §4.3 |
| Fill the component's row in `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` | Phase 00 spec AM-048; plan §2.3 |
| Report gzipped size against the < 5 KB soft target, not gating. P5's first run of the "Size report" step reports every row merged before it; later rows report through the step (§12 AM-020, L3R14-09) | §7.6; plan §7.1; PRD §1.7 |
| Import no other component; compose through slots | §10 SD4; MANIFESTO Law 4; ARCH §12 |
| Spec APPROVED with the Agent contract section filled | plan §2.3, §7.1; PRD §8.1 |
| htmx Tests row filled, or `n/a` with a reason | plan §2.4, §7.1 |
| Agent-exposed C5–C20 rows add the component to the `<line-a2ui-surface>` render fixture and the surface axe test | plan §7.2; §6.G.4 |
| Machine rows (C1, C5, C6, C8, C11, C16) measure the host update rate and record it in the PR; the first row past the C21 budget adds the `line-core` `VanillaMachine` subclass, with a test that shows a flat `prop()` cost over 4,000 calls | §6.C.1; §10 SD18; §12 AM-020, L3R14-04 |
| Add `packages/line-components/__tests__/visual/<c>.visual.ts` over the component's stories and commit their Linux baselines from a `visual-baselines.yml` run | §6.P.11; §10 SD98; PRD §5.2 |

**Acceptance (stream)**

- Every C1–C20 row meets every obligation above and the table in §6.C.4.
- C21, C23, P7, P11, P12 and Z5 merged before C1; C22 and P5 merged before C2 (§12 AM-019, L3R13-01; §12 AM-031; §12 AM-036; §12 AM-048).
- C1's Storybook autodocs page shows the attributes, slots, events and CSS parts of `line-button` from the shipped manifest (§6.P.10; §12 AM-020, L3R14-03).
- C1 adds `packages/line-components/__tests__/manifest-paths.test.ts`, a `bun test` file that the "Unit tier" step runs (`.github/workflows/checks.yml:38-39`). On the packed `line-components` tarball, every module `path` of a custom-element declaration with a `tagName` in `custom-elements.json` names a file in the tarball, the filter R4 §2.7 advises (a `tagName` or a `custom-element-definition` export). Inherited `line-core` declarations such as `LineElement`, which has `customElement: true` and no `tagName` (R4 §2.2), keep `../line-core/…` paths that resolve to no file in the tarball, because the analyser writes each module `path` as the glob match (analyser 0.11.0 `cli.js:55-66`; §6.P.10 `globs`; §12 AM-040). Later rows keep it passing (§7.3; §12 AM-032, L3R23-03).

### 6.G Stream G — Agent-Driven UI Foundation (`@websublime/line-genui`)

#### 6.G.0 Stream overview and order

- Owner of every G task is webcomponents-supervisor, as the accountable supervisor (plan §4.0). File classes follow the §4 table; for example, the G2 `emit-catalog` step and the G4 `analyze` script are infra-supervisor edits (§12 AM-022).
- Stream G has no projection task. Miguel chose direct projection on `NodeResolver` on 2026-10-19 (plan §4.1, §5.6 PT; R2 §5a).
- G code MUST NOT start before P1 scaffolds `line-genui` and P2 adds its layer edges (plan §6).
- Stream G validates on C1–C4 (Button, Icon, Stack, Separator). It starts after they ship without descriptors (PRD §7.3; plan §6 step 5–6).
- Stream G writes the descriptors of C1–C4 (plan §4.1). C5–C20 each ship their descriptor in their own PR (plan §6 step 7).
- G5 also waits for P10, because the drift and coverage tests read the manifest P10 wires (plan §6).
- The first `line-genui` release waits for P4 and P13 (plan §6).

| Task | Content | PRD §7.3 item | Deps |
|---|---|---|---|
| G1 | Descriptor API, descriptors of C1–C4 | 2 | P1, P2, C1–C4 |
| G2 | `line` and `basic` catalog emitters | 3 | G1 |
| G3 | Frontend-tool emitter | 4 | G1 |
| G4 | `<line-a2ui-surface>` (preview) | 5 | G1, G2, P5 |
| G5 | CEM drift and coverage tests | 6 | G1, P10 |
| G6 | MCP Apps bridge `line-themes/hosts/mcp-apps.css` | 7 | P1, C1–C4 |
| G7 | Transport recipes in Storybook | 8 | G4, G6 |

- G6 touches only `line-themes`. Its dependencies on P1 and C1–C4 exist because the stream starts after P1 and C1–C4 (PRD §7.3; plan §6 step 6; §10 SD40; §12 AM-007, R4-L1-03).
- G7 depends on G4, because every recipe renders through the surface [INFERENCE], and on G6, whose `mcp-apps.css` export its MDX documents (§6.G.7; §10 SD40; §12 AM-040, AM-041).

#### 6.G.1 G1 — Descriptor API

- **Owner:** webcomponents-supervisor.
- **Deps:** P1, P2, C1–C4.
- **Changes:** `packages/line-genui/src/catalog/` (descriptor type, helpers, descriptors of C1–C4); it fills the module behind the `@websublime/line-genui/catalog` key that P1 adds (§4.1; plan §2.1 Appendix D table; §12 AM-023, L3R16-05).

**Fields.** A descriptor holds these fields (ARCH §17.3).

| Field | Content |
|---|---|
| Catalog name, tag, `load()` | `load()` imports the component subpath |
| Prop schema | Zod 3, reusing the `web_core` common types in the catalogs |
| Slot map | Slot names the surface wires children into |
| Binding map | Prop → property or attribute, the value prop, the commit event of rule C9 |
| Action map | Prop → DOM event |
| Accessibility requirements | Includes the required accessible name |
| Description | The agent-facing description |
| `agentExposed` | Defaults to `true`; `false` carries a reason |

**Contract**

- Descriptors MUST use the Zod 3 API. Only that API composes with the `web_core` common-type schemas (ARCH §17.3; R3 §2.2; plan §5.6 defaults).
- `line-components` MUST NOT gain a Zod or A2UI dependency (ARCH §17.3).
- A component description MUST reach the catalog through `spec(…, {mixins})`. `toJson()` drops it otherwise (R3 §2.4; §10 SD41).
- A property description MUST go through a line helper that writes the `REF:` marker. The upstream helpers emit a literal `${description}` and plain `.describe()` inlines a `oneOf` (R1 §2.4.3; §10 SD41).
- The accessibility requirements MUST name every required accessible name, because G4 checks them before render (§10 SD36).
- `agentExposed` MUST default to `true` (ARCH §17.3).
- Every component MUST keep a descriptor. A flagged descriptor MUST carry its reason (ARCH §17.3; plan §7.2).
- The emitters MUST leave flagged descriptors out of the catalogs and the tool schemas (ARCH §17.3).

The three Phase 1 components with `agentExposed: false` and their reasons (§10 SD38) are below.

| Component | Reason | Source |
|---|---|---|
| Portal | It moves nodes out of the surface, so they escape the `instanceId` reconciliation, the focus rule, the live region and `aria-busy` | R8 §2.2; ARCH §17.4 [INFERENCE on the escape] |
| Presence | It emits no ARIA and needs CSS exit animations, which the host owns [INFERENCE] | R8 §2.2; R7 §2.2; §12 AM-005, L2R3-13 |
| Visually Hidden | An untrusted agent could add text that only screen readers hear | ARCH §17.4 Text row [INFERENCE] |

**Acceptance**

- The descriptors of C1–C4 type-check on the Zod 3 API and compose with the `web_core` common types.
- A component description and a property description of Button both appear in `Catalog.toJson()` output (R3 §2.4; §12 AM-020, L3R14-07).
- Importing `@websublime/line-genui/catalog` defines no element (plan §7.2).

#### 6.G.2 G2 — Catalog emitters

- **Owner:** webcomponents-supervisor (file classes: §4 table; plan §4.0; §12 AM-022).
- **Deps:** G1.
- **Changes:** the `line` catalog emitter, `@websublime/line-genui/catalog.json`, the `basic` implementation map that the G4 session registers under the v0_9 id (§6.G.4; §12 AM-019, L3R13-02), the inline projection function, and `packages/line-icons/src/a2ui/` with its `./a2ui` export key. `./a2ui` holds the per-set map and exports the types `A2uiIconName` (the 59 A2UI v0.9.1 `Icon.name` values; R10 §2.1, P2), `A2uiIconMap` and `A2uiIconEntry`, and the helper `a2uiIconMap(set, { library })` that returns a null-prototype frozen `A2uiIconMap` for the surface `iconMap`, with `library` copied into each entry. The per-set map is not a public export (§4.3; ARCH §17.7; §12 AM-012, L3R7-02). `packages/line-icons/README.md` states the preview status of `./a2ui` (ARCH §17.7) (§6.C.3; §10 SD14; §12 AM-002, L3-09; §12 AM-006, D-M; §12 AM-008, L3R4-03, L3R4-05; §12 AM-010, L3R5-04, L3R5-05).
- **Catalog file:** `scripts/emit-catalog.mjs` writes `packages/line-genui/dist/catalog.json`. The `line-genui` `build` script runs it right after `vite build` and before `tsc`, because `vite build` empties `dist/` first (§4.1; §7.1; §6.P.9 `emptyOutDir`; §10 SD23). The script imports the emitter from the built `dist/catalog/index.js` and writes the document form of the `line` catalog. It sits beside the other repository scripts, as `scripts/validate-contrast.mjs` does for the `line-colors` build (§12 AM-016, L3R10-02).
- **Test inputs:** the five A2UI v0.9.1 schema files `client_capabilities.json`, `client_to_server.json`, `common_types.json`, `server_to_client.json` and `basic_catalog.json` (upstream `specification/v0_9_1/catalogs/basic/catalog.json`, the spike's name) are vendored into `packages/line-genui/__tests__/fixtures/a2ui-v0_9_1/`. They are copied once from `a2ui-project/a2ui` at commit `cbaa5ee62c737b50d0695c1e5794d0f648b61dca` (`specification/v0_9_1/json/` and `specification/v0_9_1/catalogs/basic/`), the commit and files the R2 spike fetched (R2 P3 and Sources; `docs/research/assets/01-r2/spike/scripts/fetch-spec.ts`; §12 AM-017, L2R11-03). A `SOURCE.md` beside them records the commit and the upstream paths. `@a2ui/web_core` 0.14.0 ships `src/v0_9/schemas/` and no `v0_9_1` folder [`npm pack @a2ui/web_core@0.14.0 --dry-run`, 2026-10-20; the two sets were not compared], so the tests do not read the schemas from it. G4 reuses the same files (§12 AM-016, L3R10-01).
- **Lint exclusion:** four of the five upstream files fail the Biome formatter, so the "Lint (biome check)" step (`.github/workflows/checks.yml:20-21`) would fail on them. G2 adds `"!**/__tests__/fixtures/a2ui-v0_9_1"` to the `biome.json` `files.includes` list (`biome.json:91`) (§12 AM-017, L3R11-02). G2 then runs `bun run lint:fix`; Biome wraps the array if the line exceeds 120 columns (`biome.json` `lineWidth`) (§12 AM-018, L2R12-01; §12 AM-019, L3R13-03). G2 carries an AM row to Phase 00 spec §6.A A2, whose Biome ignore list (`docs/specs/00-spec-design-system.md:429`) does not name the fixture folder (§12 AM-020, L2R14-01).
- **Test dependencies:** root `devDependencies` gain `"ajv": "^8.20.0"` and `"ajv-formats": "^3.0.1"` (R2 P2; spike `README.md:32`). The root manifest already holds the shared test tooling, for example `@happy-dom/global-registrator`, `@open-wc/testing-helpers` and `playwright` (`package.json:50-83`; §12 AM-017, L2R11-04). G3 also runs Ajv, so whichever of G2 and G3 lands first adds both (§12 AM-016, L3R10-01).

**`line` catalog**

- `catalog.json` MUST hold the document form of the `line` catalog, with `$defs/anyFunction` and `$defs/theme` added (R2 §2.7; §10 SD42).
- `toJson()` output as emitted MUST NOT ship as the file. Without `$defs/anyFunction` and `$defs/theme`, `common_types.json` and `server_to_client.json` do not compile against it (R2 §2.7). Only the inline projection is checked against the `Catalog` def (plan §5.6 D2; §10 SD42).
- The added defs MUST be `$defs/anyFunction: false` and an open `$defs/theme` (R2 §2.7; §12 AM-003, L2R2-08).
- line MUST ship a documented function that derives the inline projection. Client capabilities and the D2 criterion use that projection (§10 SD42).
- The `catalogId` MUST be `https://line-ui.websublime.com/a2ui/catalogs/line/v1/catalog.json` (§10 SD42).
- The id is an identifier. It need not resolve (§10 SD42).
- An incompatible change MUST bump `v1` to a new id (ARCH §17.3; §10 SD42).

**`basic` catalog**

- The session MUST register the `basic` implementations only under `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json` (R1 §2.6; §10 SD43).
- That registration MUST always be on (§10 SD43).
- `web_core` 0.14.0 knows no other basic id and throws `Catalog not found` on the `v0_9_1` id (R1 §2.6, P7, §5 item 5; R2 §2.6).
- line MUST NOT re-emit the basic JSON Schema (ARCH §17.3).
- Client capabilities MUST list the basic id only when the consumer opts in. This holds until basic coverage is complete (§10 SD44).
- Phase 1 maps 10 of 18 basic types (ARCH §17.3 table). They are Text, Image, Icon, Video, AudioPlayer, Row, Column, List, Divider and Button.
- G2 maps `Image` to native `<img>` for every `variant` until C10 adds the `variant: "avatar"` route to `<line-avatar>` (ARCH §17.3; §6.C.4; §12 AM-021, L3R15-02).
- An unmapped basic type MUST render an inert placeholder and raise `line-a2ui-error` (ARCH §17.3).

**Versions**

- Capabilities MUST advertise `['v0.9', 'v0.9.1']`. `['v0.9.1']` alone fails the published schema's required `v0.9` key (R1 P10, §6 Q8; §10 SD45).
- The session MUST accept both envelope versions (R1 §2.5.1; §10 SD45).
- Outbound messages MUST carry `v0.9.1` (R6 §2.2; R2 §2.6; §10 SD45).

**Acceptance**

- The inline projection of `catalog.json` validates against the A2UI v0.9.1 `client_capabilities.json#/$defs/Catalog` (plan §5.6 D2; plan §7.2).
- `web_core` reads the catalog back with `Catalog.fromJson`, and its `validationSchema` compiles (plan §7.2).
- Ajv 2020 compiles `common_types.json` and `server_to_client.json` against the shipped `catalog.json` (R2 §2.7; §12 AM-003, L2R2-08).
- A fixture descriptor with `agentExposed: false` is absent from the `line` catalog that the emitter writes. The Phase 1 flagged descriptors land with C12, C13 and C16, which check that their catalog names are not `components` keys of the built `catalog.json` (§6.C.4; §12 AM-021, L3R15-03; §12 AM-023, L2R16-01).
- The `basic` implementation map holds the 10 Phase 1 types listed above and no other, and a lookup by the v0_9 basic id returns it (§10 SD43; §12 AM-019, L3R13-02).
- The capabilities object validates against `client_capabilities.json` with and without the basic opt-in.

#### 6.G.3 G3 — Frontend-tool emitter

- **Owner:** webcomponents-supervisor (file classes: §4 table; plan §4.0; §12 AM-022).
- **Deps:** G1.
- **Changes:** the tool emitter in `packages/line-genui/src/catalog/`, its tests, the CI subset checks. Root `devDependencies` gain `"gpt-tokenizer": "^4.1.0"` for the o200k count (R3 §2.7), and `ajv` and `ajv-formats` as in §6.G.2 if G3 lands before G2 (§12 AM-016, L3R10-01). The subset checks and the per-tool byte and o200k print are `bun test` files in `packages/line-genui`, so the existing "Unit tier" step (`bun test`, `.github/workflows/checks.yml:38-39`) runs them on every PR (§12 AM-018, L3R12-03).

**Contract**

- The emitter MUST be a line-owned walker over the Zod 3 descriptor schema (§10 SD46).
- `zod-to-json-schema` is deprecated, and its `openAi` target drops optional-prop descriptions (R3 §2.1, §2.5).
- `Catalog.toJson()` writes common-type `$ref`s, so Button and Icon fail every strict subset (R3 §2.6).
- The walker MUST map dynamic types to their literal type, for example `DynamicString` to `string` (R3 §6 Q4).
- The walker MUST leave out `ComponentId`, `ChildList` and `Action` props [INFERENCE: these props carry tree structure and actions, not literal values] (§10 SD47).
- The walker MUST build one flat literal model per descriptor (§10 SD48).
- The output MUST keep `{name, description, parameters}` (ARCH §17.3; PRD Appendix D).
- `parameters` MUST carry no `$ref`, `oneOf`, `allOf`, recursion, open maps, common types or dynamic bindings (ARCH §17.3).
- The emitter MUST take a provider argument and serialise the model per provider (§10 SD48).

| Provider | Serialisation | Source |
|---|---|---|
| OpenAI strict | Every property in `required`; optional props typed `["T","null"]`; `additionalProperties: false`; no `allOf` | R3 §2.6 |
| Anthropic strict | `additionalProperties: false`; optional props allowed | R3 §2.6 |
| Gemini | `parameters` as an OpenAPI 3.0.3 subset; optional props with `nullable`; no `additionalProperties`, `const`, `$ref`, `oneOf`, `allOf` | R3 §2.6; §10 SD48 |

- A tool name MUST match `^[a-zA-Z0-9_-]{1,64}$`. All three providers accept it (R3 §2.6; §10 SD49).
- A tool description MUST stay at or under 1024 characters. The cap is self-imposed (ARCH §17.3; R3 §2.6, §5 item 3).
- CI MUST print bytes and o200k tokens per tool. The count reports and gates nothing (R3 §2.7; §10 SD50).
- The docs MUST state the Anthropic per-request caps: 20 strict tools, 24 optional params and 16 union-typed params across all strict schemas (R3 §2.6; §10 SD49).

**Acceptance.** Acceptance holds per tool (§10 SD49).

- Every emitted tool validates as JSON Schema under Ajv (§10 SD46).
- Every PR runs the offline R3 P11 subset checks for each provider in CI (R3 §3; §10 SD46, SD49).
- Every tool description is at or under 1024 characters, and every tool name matches the pattern.
- Before each release, Miguel calls each provider live with the emitted tools and records the result in the release PR (§7.2; §10 SD49).
- A fixture descriptor with `agentExposed: false` produces no tool. The Phase 1 flagged descriptors land with C12, C13 and C16, which depend on G3 and check that the emitter produces no tool for their descriptors (§6.C.4; §12 AM-021, L3R15-03; §12 AM-023, L2R16-01, L2R16-02).

#### 6.G.4 G4 — Surface `<line-a2ui-surface>`

- **Owner:** webcomponents-supervisor (file classes: §4 table; plan §4.0; §12 AM-022).
- **Deps:** G1, G2, P5 (its registration harness, §10 SD40); R2 decided (plan §6).
- **Changes:**
  - `packages/line-genui/src/a2ui/` (session, surface, reconciler), which fills the module behind the `@websublime/line-genui/a2ui` key that P1 adds (§4.1; §12 AM-023, L3R16-05); `line-genui` `dependencies`.
  - `packages/line-genui/custom-elements-manifest.config.mjs`, the `analyze` build step and the §4.1 manifest keys, so `line-genui` ships its own Custom Elements Manifest for `<line-a2ui-surface>` (§10 SD94).
  - The surface gains the property `iconMap`, typed `A2uiIconMap` through `import type` from `@websublime/line-icons/a2ui`, which takes the result of `a2uiIconMap(set, { library })` and has no default. `./a2ui` of `line-genui` has no runtime import of `line-icons` (§6.C.3; §12 AM-006, D-M; §12 AM-008, L3R4-03).
  - The surface gains the attributes `live-update-text` and `live-error-text`, reflected by the properties `liveUpdateText` and `liveErrorText`. Their defaults are the R2 spike strings "Content updated." and "Some content could not be shown." (R2 §6 Q3; `docs/research/assets/01-r2/spike/README.md:110, :116-117`; `docs/research/assets/01-r2/spike/src/surface-base.ts:7-8`; §12 AM-015, L2R9-01). The consumer localises the live region through them, because component-level strings are the consumer's responsibility via slots and attributes (MANIFESTO Out of Scope; §10 SD59; §12 AM-013, L3R7-01).
  - The surface's JSDoc documents its attributes and properties, `iconMap`, `liveUpdateText`, `liveErrorText`, `maxNodes`, `maxDepth`, `maxDataModelSize`, `urlPolicy` and `markdownRenderer` among them, and carries `@fires` for `line-a2ui-action` and `line-a2ui-error` (§10 SD94, SD61; §12 AM-006, D-M; §12 AM-013, L3R7-01; §12 AM-015, L3R9-05; §12 AM-032, L3R23-04).
  - The `@websublime/line-genui/custom-elements.json` import in the P10 merge in `apps/storybook/.storybook/preview.ts`. The existing unanchored `custom-elements.json` line of `.gitignore` (`.gitignore:10`) already ignores `packages/line-genui/custom-elements.json` (§12 AM-018, L3R12-04).
  - `"@websublime/line-genui": "workspace:^"` in the `apps/storybook` devDependencies, so that Storybook resolves `@websublime/line-genui` for that import and for the surface stories. `lint-layers` reads only the `dependencies` and `peerDependencies` of an app, so the devDependency passes the guard (`scripts/lint-layers.mjs:13-14, :182-186`; §12 AM-015, L3R9-01).
  - The G4 docs show the two consumer lines for icons, `setIconRegistry(registry)` from `@websublime/line-components` with a `line-icons` `IconRegistry`, and `surface.iconMap = a2uiIconMap('phosphor', { library: 'phosphor' })` from `@websublime/line-icons/a2ui`, where `library` repeats the registered key. The session never writes the registry (§6.C.3 registry hook; §12 AM-004, D-R; §12 AM-006, D-M).
- **Status:** preview. The export may change in any minor release and sits outside the PRD §7.1 policy until it targets a final A2UI v1.0 (ARCH §17.7; PRD Appendix D).

**Upstream pin**

- `line-genui` MUST pin `@a2ui/web_core` exactly at `0.14.0` (ARCH §17.7; §10 SD6).
- 0.13.0 lacks `validationSchema` and `spec()` mixins, which G2 and G1 need (R1 §6 Q1; R3 §2.4).
- R2 ran its spike on 0.14.0 (R2 §3).
- A newer version MUST land only through an AM, after the R1 and R2 probes run again on it (§10 SD6).

**Projection and messages**

- The surface MUST project directly on the `web_core` models and `NodeResolver` (ARCH §17.4; R2 §5a).
- The surface MUST load no Lit and no `A2uiLitElement` (ARCH §17.4).
- `<line-a2ui-surface>` MUST extend `HTMLElement`, as the R2 spike's surface does (`docs/research/assets/01-r2/spike/src/surface-base.ts:24`). It MUST NOT extend `LineElement`, which extends `LitElement` (`packages/line-core/src/line-element.ts:1, :19`). ARCH §17.4 states this exception to the ARCH §6 base-class tree (§12 AM-012, L3R7-04; §12 AM-014, L3R8-02).
- `./a2ui` MUST NOT import a `line-core` module that loads `lit` at run time, in particular not the root `"."`, which re-exports `LineElement` (`packages/line-core/src/index.ts:1`; `packages/line-core/dist/index.js:4`). `import type` from any `line-core` module is allowed, and so are `./machine`, `./mixins/*` and `./styles`, which load no `lit` at run time (§4.1; §12 AM-012, L3R7-04; §12 AM-014, L2R8-01).
- Law 5 reading: the "Lit owns DOM" clause of Law 5 governs `line-components` components. `<line-a2ui-surface>` is a light-DOM orchestrator in `line-genui`. Its own reconciler is its rendering cycle, and no other code mutates its DOM. The rest of Law 5 still holds for the surface: it keeps no styles in TypeScript and no business logic in render. Miguel approved this reading on 2026-10-20 (MANIFESTO Law 5; ARCH §17.4; §12 AM-002; §12 AM-004, L3R2-10, L3R2-09).
- The render root MUST be light DOM (ARCH §17.4).
- Components MUST load lazily through each descriptor's `load()` (ARCH §17.4).
- The session MUST register the `line` catalog under its id `https://line-ui.websublime.com/a2ui/catalogs/line/v1/catalog.json`, and that registration MUST always be on, beside the `basic` registration (§6.G.2; §10 SD42; §12 AM-032, L3R23-07).
- The session MUST call `processMessages` once per message. A bad message then drops only itself (R1 §2.7; R2 §2.6; §10 SD51).
- `aria-busy` MUST cover the whole transport batch (ARCH §17.4; R2 §2.8).
- The `MessageProcessor` MUST receive `RELAXED_VALIDATION` (R1 §2.7; §10 SD52).
- The surface MUST catch every `web_core` throw (ARCH §17.4).
- The surface MUST enforce the depth limit itself while it walks `NodeResolver`. `web_core` `maxDepth` is unreliable with `allowMissingRoot: true`, because the walk starts at each id in sorted order (R2 §2.6; §10 SD53).
- A cycle MUST reject its message. Under `RELAXED_VALIDATION`, `web_core` throws at message level (R1 §2.7; §10 SD54).
- An unknown type MUST render an inert placeholder for that node (ARCH §17.4).
- A pending child MUST stay hidden and raise no error (R1 §2.5.2). When it arrives, `web_core` disposes the placeholder and creates a new node (R2 §3 P9; `@a2ui/web_core` 0.14.0 `src/resolution/node-resolver.js`; §10 SD54; §12 AM-005, L2R3-05).

**Errors**

- `line-a2ui-error` MUST carry the generic A2UI form `{version, error: {code, surfaceId, message, …}}`, with the code the next two rules give (R2 §2.6; §10 SD55).
- An error that `web_core` throws or reports MUST carry its `web_core` 0.14.0 code, for example `CATALOG_ERROR` (R1 §2.1, §2.7).
- An error the surface raises itself MUST carry the surface's own code: `LIMIT_EXCEEDED` for a limit breach, `MARKDOWN_RENDER_ERROR` for a Markdown hook failure, `MISSING_ACCESSIBLE_NAME` for a missing accessible name (the R2 spike code, R2 §2.8) and `UNMAPPED_ICON` for an unmapped icon (§10 SD55; §12 AM-040).
- `line-a2ui-action` MUST carry the resolved A2UI `action` message (ARCH §17.4).

**Limits**

- Node count, depth and data-model size MUST have finite defaults (§10 SD56).
- A breach MUST reject the message and raise `line-a2ui-error` (§10 SD56).
- The default values come from a G4 stress test and land in this spec through an AM. No research note measured them (R1 §4; §10 SD56).
- The consumer MUST be able to override each limit, because ARCH §17.4 calls the limits configurable. The surface takes the attributes `max-nodes`, `max-depth` and `max-data-model-size`, reflected by the properties `maxNodes`, `maxDepth` and `maxDataModelSize`. Each takes a positive integer, and an unset value keeps the default. A value that is not a positive integer, such as `0`, a negative number or a non-integer, also keeps the default, and the surface throws nothing (MANIFESTO Law 9; §12 AM-016, L3R10-06). The unit of `max-data-model-size` lands with its default through the stress-test AM (ARCH §17.4; §12 AM-015, L3R9-05).

**URLs, text, theme**

- The URL policy MUST apply after the URL resolves against the document base (§10 SD57).
- The policy MUST cover Image, Video and Audio URLs and `openUrl` (§10 SD57).
- The default allowlist MUST be `https:`, `http:`, `mailto:`, `tel:` (ARCH §17.4). `mailto:` and `tel:` apply to media URLs only, because `web_core` `openUrl` accepts only `http:` and `https:` (R1 §2.6; §12 AM-005, L2R3-11).
- The default policy MUST reject `data:`. This is line policy: R5's default View CSP allows `data:` images and media (§10 SD57; §12 AM-005, L2R3-11).
- `requiresUserActivation` MUST be honoured (ARCH §17.4).
- The consumer MUST be able to add a URL policy through the property `urlPolicy`, typed `(url: URL, use: 'image' | 'video' | 'audio' | 'openUrl') => boolean`, with no attribute and no default. The surface calls it after the default policy with the URL resolved against the document base, and `false` keeps the URL from the DOM and from `openUrl`. A consumer policy can reject a URL the default allows and cannot admit one the default rejects. A throw from `urlPolicy` counts as `false` (ARCH §17.4; §10 SD57; §12 AM-032, L3R23-04; §12 AM-034, L3R24-05).
- Text MUST render as plain text by default (ARCH §17.4).
- Markdown MUST render only through a hook the consumer supplies, the property `markdownRenderer`, typed `(markdown: string) => Node`, with no attribute and no default. When it is set, the surface passes each Text value to it and inserts the returned node; when it is unset, Text renders as plain text. When the hook throws or returns a value that is not a `Node`, the surface renders the value as plain text and raises `line-a2ui-error`. The consumer owns sanitising, and line ships no renderer (§10 SD58; §12 AM-032, L3R23-04; §12 AM-034, L3R24-05).
- The surface calls `markdownRenderer` itself. It does not use `web_core` `setMarkdownRenderer`, which `./v0_9/basic_catalog` exports beside the basic Lit elements (R1 §2.3), because the surface loads no Lit (§12 AM-032, L3R23-04).
- Agent theme hints MUST be ignored by default (ARCH §17.4).

**Accessibility**

- The surface MUST check required names from the descriptor before render (§10 SD36, SD82).
- A node without a required name MUST become a placeholder and raise `line-a2ui-error` (§10 SD36, SD82).
- A DOM check after render leaves axe's `button-name` violation in place (R2 §2.8).
- Each surface MUST hold one live region (ARCH §17.4).
- The live region MUST announce the `live-update-text` value once per batch that changed the DOM, and the `live-error-text` value on error. The defaults are "Content updated." and "Some content could not be shown." (R2 §6 Q3; `docs/research/assets/01-r2/spike/README.md:110, :116-117`; `docs/research/assets/01-r2/spike/src/surface-base.ts:7-8`; §10 SD59; §12 AM-013, L3R7-01; §12 AM-015, L2R9-01).
- `line-stack` rendering a List MUST carry `role="list"` (R2 §6 Q4; §10 SD59).
- Each List item MUST carry `role="listitem"`: on the item `line-stack` when the item renders as `line-stack`, and otherwise on a `<div role="listitem">` wrapper around the rendered item (R2 §2.1, §6 Q4; §10 SD59).
- The surface MUST wrap Button text in a `<span>` (§10 SD59).
- The surface MUST NOT move focus to another component (ARCH §17.4; plan §5.6 D4).
- The reconciler MUST key by `instanceId` and keep focus across reorders (ARCH §17.4). It is the surface's rendering cycle under the Law 5 reading above (§12 AM-002).
- On a reparent, the surface MUST use `moveBefore()` where the browser has it, and otherwise return focus to the same `instanceId` at batch end (plan §5.6 D4).
- The docs MUST state the template-list limit. `instanceId` is unstable across template-array insertions and reorders (R2 §2.8; §10 SD60), so a kept element may rebind to another item [INFERENCE: not stated in R2].
- The revisit trigger for that limit is a2ui#1745 (R2 §6 Q1; §10 SD60).

**Basic mapping.** The Phase 1 targets follow the ARCH §17.3 table, including Text inside a Button, which renders as a `<span>` (ARCH §17.3; §10 SD59), except the `Image` `variant: "avatar"` route, which C10 adds (§6.G.2; §6.C.4; §12 AM-021, L3R15-02). Icon has the extra rules below (§10 SD15, SD33).

- An `{ "svgPath": … }` value MUST render through `<line-icon>` with its new `path` property (R10 §2.1; §10 SD33).
- `<line-icon>` then draws `<svg viewBox="0 0 24 24"><path>` and sets `d` through `setAttribute('d')` (§10 SD33).
- An `Icon.name`, literal or bound, MUST render through `<line-icon>` with `library`, `name`, `weight` and `mirror` set from its `iconMap` entry, found with `Object.hasOwn(iconMap, name)` (§10 SD15; §6.C.3; §12 AM-004, D-W; §12 AM-006, D-M, L3R3-03; §12 AM-008, L3R4-03, L3R4-05; R1 §2.6).
- An `Icon.name` that is not an own property of `iconMap`, or any `Icon.name` while `iconMap` is unset, MUST leave the node in the C8 neutral state and raise `line-a2ui-error` (§10 SD33; §12 AM-006, D-M; §12 AM-008, L3R4-05).
- Setting or replacing `iconMap` MUST re-project every Icon node of the surface (§6.C.3; §12 AM-008, L3R4-04).
- A resolver rejection behind a mapped name MUST leave `<line-icon>` in the C8 neutral state and raise no surface error (§10 SD92; §12 AM-006, L3R3-04).
- No resolver throw MUST reach the consumer (MANIFESTO Law 9).

**Acceptance**

- `<line-a2ui-surface>` renders C1–C4 from A2UI messages with zero axe-core violations (plan §7.2; evidence from P7).
- Each agent-exposed C5–C20 row adds its component to the surface render fixture and the surface axe test in its own PR (§6.C.6).
- Document `::part()` rules apply to the rendered elements (plan §7.2).
- G4 adds the `line-genui` registration row of §7.5 to the P5 harness. On the packed tarball, importing `./catalog` defines no element, and importing `./a2ui` defines only `line-a2ui-surface` (plan §7.2).
- A message with the v0_9 basic id renders mapped types and raises `line-a2ui-error` for each unmapped type (plan §7.2; §12 AM-019, L3R13-02).
- With the registry set by the consumer and `iconMap` set to `a2uiIconMap('phosphor', { library })`, a bound Icon `favorite` renders the Phosphor `fill` file through the `weight` from its map entry (§10 SD15; §12 AM-004, D-W; §12 AM-006, D-M).
- With `iconMap` unset, an Icon node stays in the C8 neutral state and the surface raises one `line-a2ui-error`; a name absent from the map does the same (§12 AM-006, D-M).
- Under `dir="rtl"`, an Icon `arrowBack` renders through `<line-icon mirror>` flipped (§10 SD15; §12 AM-006, L3R3-03; R10 §2.3).
- A mapped name whose resolver rejects (a 404) leaves `<line-icon>` in the C8 neutral state, and the surface raises no `line-a2ui-error` (§12 AM-006, L3R3-04).
- A bound Icon name `constructor` stays in the C8 neutral state and raises one `line-a2ui-error` (§12 AM-008, L3R4-05).
- Icon nodes rendered with `iconMap` unset render their icons after `iconMap` is set, and re-render from the new entries after it is replaced (§12 AM-008, L3R4-04).
- A List whose items render as `line-stack` and as other components passes axe `list` and `listitem` (R2 §6 Q4; §12 AM-003, L2R2-07).
- With the default attributes, a batch that changes the DOM makes the live region announce "Content updated.", and a rejected message makes it announce "Some content could not be shown."; with `live-update-text` and `live-error-text` set, the same two cases announce the configured text (§10 SD59; §12 AM-013, L3R7-01).
- A batch `[ok, invalid, ok]` applies the first and third message and raises one `line-a2ui-error`.
- A self-cycle rejects its message. A pending child shows nothing and raises no error until it arrives.
- An over-limit message is rejected with `line-a2ui-error`.
- With `max-nodes`, `max-depth` or `max-data-model-size` set below its default, a message that the default accepts is rejected with `line-a2ui-error` (§12 AM-015, L3R9-05).
- Every emitted `line-a2ui-error` validates against `client_to_server.json` (R2 §2.6).
- URLs with a disallowed scheme or `data:` do not reach the DOM.
- With `urlPolicy` set to reject one `https:` URL, an Image with that URL, which the default policy allows, does not reach the DOM (§12 AM-032, L3R23-04).
- With `markdownRenderer` set, a Text value renders as the node the hook returns; with it unset, the same value renders as plain text (§10 SD58; §12 AM-032, L3R23-04).
- With `urlPolicy` set to a function that throws, an Image whose URL the default policy allows does not reach the DOM (§12 AM-034, L3R24-05).
- With `markdownRenderer` set to a function that throws, and again to one that returns a string, a Text value renders as plain text and the surface raises `line-a2ui-error` (§12 AM-034, L3R24-05).
- A message with the `line` catalog id renders its components (§10 SD42; §12 AM-032, L3R23-07).
- A node of a fixture descriptor that marks its name required renders a placeholder and raises `line-a2ui-error` when the name is missing. The IconButton case is C5's (§6.C.5; §12 AM-020, L3R14-06).
- A focused element keeps focus across a reorder and a reparent in Chromium, Firefox and WebKit.
- The G4 stress test runs and its measured limits land through an AM.
- `package.json` lists `@a2ui/web_core` as exactly `0.14.0`.
- `verify-pack` fails when `custom-elements.json` is missing from the `line-genui` tarball (§10 SD94).
- On the packed `line-genui` tarball, the module `path` of the `<line-a2ui-surface>` declaration, a custom-element declaration with a `tagName`, in `custom-elements.json` names a file in the tarball; inherited `line-core` declarations follow the §7.3 rule (§7.3; §12 AM-032, L3R23-03; §12 AM-040).
- The Storybook API table for `<line-a2ui-surface>` renders its attributes, properties and both events from the merged manifest (§10 SD94).

#### 6.G.5 G5 — CEM drift and coverage tests

- **Owner:** webcomponents-supervisor.
- **Deps:** G1, P10, CEM entries of real components (plan §6).
- **Changes:** tests in `packages/line-genui`.

**Contract**

- The tests MUST read the `custom-elements.json` that the `line-components` build emits into the package (§10 SD26; §6.P.10, §7.3).
- The tests MUST look up entries by tag. `modules[]` order changes between runs (R4 §2.7).
- The drift test MUST fail when a descriptor names an attribute, property, slot or event that the manifest lacks (ARCH §17.3).
- The tests MUST apply the §7.3 content rules (§10 SD61; R4 §2.3, §2.4, §2.6).
- The drift test MUST read events only from `@fires` JSDoc.
- The tests MUST filter public members on `privacy`, `static` and `inheritedFrom`, read form association from the inherited static `formAssociated`, and take ARIA metadata from the descriptor.
- The coverage test MUST fail when a `line-components` component in the manifest has no descriptor. It does not cover `<line-a2ui-surface>` (ARCH §17.3).

**Acceptance**

- Both tests pass in the unit tier on the built manifest (plan §7.2).
- A descriptor that names a missing attribute fails the drift test.
- A component without a descriptor fails the coverage test.

#### 6.G.6 G6 — MCP Apps bridge

- **Owner:** webcomponents-supervisor (file classes: §4 table; §12 AM-022).
- **Deps:** P1, C1–C4 (§12 AM-007, R4-L1-03).
- **Changes:** `packages/line-themes/src/hosts/mcp-apps.css`; the `@websublime/line-themes/hosts/mcp-apps.css` export (plan §2.1 Appendix D table); the `postcss 'src/hosts/*.css' -d dist/hosts` step in the `line-themes` `build` and `dev` scripts, which `packages/line-themes/package.json:33-34` lacks today (§4.4; §12 AM-023, L3R16-03).

**Reference list**

- The bridge is CSS only, so `line-themes` gains no runtime (ARCH §17.6; MANIFESTO Law 10).
- The list MUST be the role-matched subset (§10 SD62).
- Under the written rule, a host key joins the list when line has one target with the same role (R5 §6 Q1; §10 SD62).
- The list MUST include 2 font families, 4 weights and the role-matched colours (§10 SD62).
- The list MUST also include the radii, sizes and line heights that the scale map matches (§10 SD62, SD63).
- The spec MUST list every excluded key with its reason (§10 SD62).
- The host publishes 76 keys (R5 §2.3).
- The table below lists every host key, each with its line target or its exclusion reason (§10 SD62; R5 §2.3, §6 Q3).

Reference host values come from `examples/basic-host/src/host-styles.ts` in `modelcontextprotocol/ext-apps` (`main`, read 2026-10-20), as R5 addendum A1 records. R5 §2.3 gives the same radii and size ranges. Line values come from `packages/line-themes/src/aliases.css:9-72`, `packages/line-tokens/src/typography.css:11-46`, `radii.css:9-15` and `focus-ring.css:16`.

**Mapping rules**

- A key joins by role match when a line target has the same role (§10 SD62).
- Each line target takes at most one key, because a custom property holds one value.
- Under nearest value, each host key is a candidate for the line step with the nearest value (§10 SD63). A key equally near two steps is a candidate for both. Each step takes its nearest candidate, and left-over keys leave the list.
- When two candidates are equally near, the key that comes first in the R5 §2.3 group order wins (§10 SD83). Text keys come before heading keys, and smaller steps before larger ones.
- Form **A** declares a line alias on `:where(html)` with the line step as fallback. Form **P** declares a line primitive on `body` with an `inherit` fallback (§10 SD17).
- Border width and shadows fall outside colour, font and radius, so they leave the list (ARCH §17.6; plan §7.2).
- The "Borderline calls" table at the end of §6.G.6 records each judgement call B1–B11 (§10 SD83).

| Key | On list | Line target | Form | Rule | Reason if excluded |
|---|---|---|---|---|---|
| `--color-background-primary` | Yes | `--line-gray-surface` | A | Role match: page surface (R5 §2.4b row 1) | — |
| `--color-background-secondary` | Yes | `--line-gray-bg` | A | Role match: subtle element background | — |
| `--color-background-tertiary` | Yes | `--line-gray-bg-hover` | A | Role match: third neutral background step (§10 SD83, B1) | — |
| `--color-background-inverse` | No | — | — | — | No line role for inverse (R5 §2.3) |
| `--color-background-ghost` | No | — | — | — | No line role for ghost (R5 §2.3) |
| `--color-background-info` | Yes | `--line-info-bg` | A | Role match: status background (§10 SD83, B2) | — |
| `--color-background-danger` | Yes | `--line-danger-bg` | A | Role match: status background (B2) | — |
| `--color-background-success` | Yes | `--line-success-bg` | A | Role match: status background (B2) | — |
| `--color-background-warning` | Yes | `--line-warning-bg` | A | Role match: status background (B2) | — |
| `--color-background-disabled` | No | — | — | — | No line role for disabled (R5 §2.3) |
| `--color-text-primary` | Yes | `--line-gray-text` | A | Role match: high-contrast text | — |
| `--color-text-secondary` | Yes | `--line-gray-text-low` | A | Role match: low-contrast text | — |
| `--color-text-tertiary` | No | — | — | — | No line role for a third text step (R5 §2.3) |
| `--color-text-inverse` | No | — | — | — | No line role for inverse |
| `--color-text-ghost` | No | — | — | — | No line role for ghost |
| `--color-text-info` | Yes | `--line-info-text-low` | A | Role match: status text (§10 SD83, B3) | — |
| `--color-text-danger` | Yes | `--line-danger-text-low` | A | Role match: status text (B3) | — |
| `--color-text-success` | Yes | `--line-success-text-low` | A | Role match: status text (B3) | — |
| `--color-text-warning` | Yes | `--line-warning-text-low` | A | Role match: status text (B3) | — |
| `--color-text-disabled` | No | — | — | — | No line role for disabled |
| `--color-border-primary` | Yes | `--line-gray-border` | A | Role match: neutral border (§10 SD83, B4) | — |
| `--color-border-secondary` | No | — | — | — | Line has one neutral border alias, taken by `--color-border-primary` (B4) |
| `--color-border-tertiary` | No | — | — | — | No line role for a third border step (R5 §2.3) |
| `--color-border-inverse` | No | — | — | — | No line role for inverse |
| `--color-border-ghost` | No | — | — | — | No line role for ghost |
| `--color-border-info` | Yes | `--line-info-border` | A | Role match: status border | — |
| `--color-border-danger` | Yes | `--line-danger-border` | A | Role match: status border | — |
| `--color-border-success` | Yes | `--line-success-border` | A | Role match: status border | — |
| `--color-border-warning` | Yes | `--line-warning-border` | A | Role match: status border | — |
| `--color-border-disabled` | No | — | — | — | No line role for disabled |
| `--color-ring-primary` | Yes | `--line-focus-ring-color` | P | Role match: the focus ring colour (B5) | — |
| `--color-ring-secondary` | No | — | — | — | Line has one ring colour, taken by `--color-ring-primary` (`focus-ring.css:16`) |
| `--color-ring-inverse` | No | — | — | — | No line role for inverse |
| `--color-ring-info` | No | — | — | — | No per-status ring colour in line |
| `--color-ring-danger` | No | — | — | — | No per-status ring colour in line |
| `--color-ring-success` | No | — | — | — | No per-status ring colour in line |
| `--color-ring-warning` | No | — | — | — | No per-status ring colour in line |
| `--font-sans` | Yes | `--line-font-sans` | P | Role match: sans family | — |
| `--font-mono` | Yes | `--line-font-mono` | P | Role match: mono family | — |
| `--font-weight-normal` | Yes | `--line-font-weight-4` | P | Nearest value: 400 → 400 | — |
| `--font-weight-medium` | Yes | `--line-font-weight-5` | P | Nearest value: 500 → 500 | — |
| `--font-weight-semibold` | Yes | `--line-font-weight-6` | P | Nearest value: 600 → 600 | — |
| `--font-weight-bold` | Yes | `--line-font-weight-7` | P | Nearest value: 700 → 700 | — |
| `--font-text-xs-size` | Yes | `--line-font-size-0` | P | Nearest value: 0.75rem → 0.75rem (wins the tie with heading-xs, B6) | — |
| `--font-text-sm-size` | No | — | — | — | Leftover: 0.875rem is 0.125rem from steps 0 and 1, both taken by exact matches |
| `--font-text-md-size` | Yes | `--line-font-size-1` | P | Nearest value: 1rem → 1rem (wins the tie with heading-md, B6) | — |
| `--font-text-lg-size` | Yes | `--line-font-size-2` | P | Nearest value: 1.125rem → 1.1rem | — |
| `--font-heading-xs-size` | No | — | — | — | Leftover: loses the tie at step 0 to text-xs |
| `--font-heading-sm-size` | No | — | — | — | Leftover: same as text-sm |
| `--font-heading-md-size` | No | — | — | — | Leftover: loses the tie at step 1 to text-md |
| `--font-heading-lg-size` | Yes | `--line-font-size-3` | P | Nearest value: 1.25rem → 1.25rem | — |
| `--font-heading-xl-size` | Yes | `--line-font-size-4` | P | Nearest value: 1.5rem → 1.5rem | — |
| `--font-heading-2xl-size` | Yes | `--line-font-size-5` | P | Nearest value: 1.875rem → 2rem | — |
| `--font-heading-3xl-size` | Yes | `--line-font-size-6` | P | Nearest value: 2.25rem → 2.5rem (equidistant from 2rem, which 2xl holds) | — |
| `--font-text-xs-line-height` | Yes | `--line-leading-3` | P | Nearest value: 1.4 → 1.375 (wins a five-way tie, B7) | — |
| `--font-text-sm-line-height` | No | — | — | — | Leftover: loses the tie at step 3 to text-xs |
| `--font-text-md-line-height` | Yes | `--line-leading-4` | P | Nearest value: 1.5 → 1.5 (wins the tie with text-lg) | — |
| `--font-text-lg-line-height` | No | — | — | — | Leftover: loses the tie at step 4 to text-md |
| `--font-heading-xs-line-height` | No | — | — | — | Leftover: loses the tie at step 3 to text-xs |
| `--font-heading-sm-line-height` | No | — | — | — | Leftover: loses the tie at step 3 to text-xs |
| `--font-heading-md-line-height` | No | — | — | — | Leftover: loses the tie at step 3 to text-xs |
| `--font-heading-lg-line-height` | No | — | — | — | Leftover: 1.3 is nearest step 2 (1.25), which heading-xl matches exactly |
| `--font-heading-xl-line-height` | Yes | `--line-leading-2` | P | Nearest value: 1.25 → 1.25 (B10) | — |
| `--font-heading-2xl-line-height` | No | — | — | — | Leftover: 1.2 is nearest step 2, which heading-xl matches exactly |
| `--font-heading-3xl-line-height` | Yes | `--line-leading-1` | P | Nearest value: 1.1 → 1.1 (B10) | — |
| `--border-radius-xs` | Yes | `--line-radius-1` | P | Nearest value: 2px → 2px | — |
| `--border-radius-sm` | Yes | `--line-radius-2` | P | Nearest value: 4px → 5px (wins the tie with md, B8) | — |
| `--border-radius-md` | No | — | — | — | Leftover: 6px is 1px from step 2, which sm wins by order |
| `--border-radius-lg` | No | — | — | — | Leftover: 8px is nearest step 2, which sm holds at 1px |
| `--border-radius-xl` | Yes | `--line-radius-3` | P | Nearest value: 12px → 1rem (16px) | — |
| `--border-radius-full` | Yes | `--line-radius-round` | P | Role match: fully rounded (B9) | — |
| `--border-width-regular` | No | — | — | — | Outside colour, font and radius (ARCH §17.6; plan §7.2) |
| `--shadow-hairline` | No | — | — | — | Outside colour, font and radius |
| `--shadow-sm` | No | — | — | — | Outside colour, font and radius |
| `--shadow-md` | No | — | — | — | Outside colour, font and radius |
| `--shadow-lg` | No | — | — | — | Outside colour, font and radius |

| Group | Keys | On list | Excluded |
|---|---|---|---|
| Colour | 37 | 19 | 18 |
| Font | 28 | 17 | 11 |
| Radius | 6 | 4 | 2 |
| Border width and shadow | 5 | 0 | 5 |
| Total | 76 | 40 | 36 |

| Exclusion reason | Keys |
|---|---|
| No line role (inverse ×4, ghost ×3, disabled ×3, text and border tertiary, four status rings) | 16 |
| Line target already taken by a role-matched key (`--color-border-secondary`, `--color-ring-secondary`) | 2 |
| Nearest-value leftover (4 sizes, 7 line heights, 2 radii) | 13 |
| Outside colour, font and radius (border width, 4 shadows) | 5 |

- The 40 keys land on 18 aliases (form A) and 22 primitives (form P).
- Line steps that get no host key keep their own value.

```css
@layer line {
  /* Form A: a line-themes alias, line step as fallback (R5 §2.4b row 1). */
  :where(html) {
    --line-gray-surface: var(--color-background-primary, var(--line-gray-2));
  }

  /* Form P: a line-tokens primitive, inherit fallback (R5 §2.4b row 3). */
  body {
    --line-radius-2: var(--border-radius-sm, inherit);
  }
}
```

**Scales and scope**

- Each host scale value MUST map to the nearest line reference value (R5 §6 Q3; §10 SD63).
- A host key without a match MUST leave the list (§10 SD63).
- Aliases (form A) MUST be declared on `:where(html)`, and primitives (form P) on `body` (§10 SD17, SD63).
- The bridge MUST NOT declare in nested `[data-accent]` or `[data-gray]` scopes (§10 SD63).
- Nested `[data-accent]` and `[data-gray]` scopes MUST fall back to line steps (§10 SD63).

**Load order**

- `mcp-apps.css` MUST load after the `line-themes` CSS (§10 SD85).
- Form A ties on specificity with the `line-themes` aliases, which sit on `:where(html, [data-accent], [data-gray])` inside the same `@layer line` (`packages/line-themes/src/aliases.css:6-7`). The sheet that loads later wins.
- The docs MUST state the order (§10 SD85).

**Primitive fallback**

- A key that maps onto a `line-tokens` primitive MUST use a `body`-scoped `var(--host, inherit)` (R5 §2.4b; §10 SD17).
- The bridge MUST NOT copy token literals (§10 SD17).
- Miguel approved the Law 10 reading that `line-themes` may name a token without copying its value (MANIFESTO Law 10; §10 SD17).
- Rules that read a primitive on `html` itself keep the token value. One shipped rule reads, on `html`, a primitive the bridge sets (a form P target): `:where(html)` composes `--line-focus-ring` from `--line-focus-ring-width`, `--line-focus-ring-style` and `--line-focus-ring-color` (`packages/line-tokens/src/focus-ring.css:19`; §12 AM-005, L2R3-09).
- The bridge MUST redeclare `--line-focus-ring` on `body` with the same composition, naming the three tokens and copying no value, so the composed ring follows the host ring colour set on `body` (B5; `focus-ring.css:19`; MANIFESTO Law 10; §10 SD17; §12 AM-004, L2R2-01).

**Acceptance**

- `mcp-apps.css` maps every key on the reference list to a line theme alias or token (plan §7.2).
- It passes `lint-layers` and the prefix audit (plan §7.2; R5 §2.4b).
- A G6 browser test covers the root scope and a nested `data-accent`/`data-gray` scope in Chromium, Firefox and WebKit (§10 SD17, SD63).
- The same test shows a host primitive value applied under `body` and the line value kept without a host value (R5 P6).
- The same test shows `--line-focus-ring` under `body` carrying the host `--color-ring-primary` value (§12 AM-004, L2R2-01).
- A G6 browser test loads `mcp-apps.css` after the `line-themes` CSS, in the documented order, and shows the host value on every form A alias (§10 SD85).

**Borderline calls**

| Id | Keys | Call made | Alternative |
|---|---|---|---|
| B1 | `--color-background-tertiary` | Maps to `--line-gray-bg-hover` | Excluded, which leaves 39 keys on the list |
| B2 | The four status backgrounds (`info`, `danger`, `success`, `warning`) | Map to `--line-<status>-bg` | Map to `--line-<status>-surface` |
| B3 | The four status text keys | Map to `--line-<status>-text-low` | Map to `--line-<status>-text` |
| B4 | `--color-border-primary`, `--color-border-secondary` | Primary takes `--line-gray-border`; secondary is excluded | Secondary takes `--line-gray-border` |
| B5 | `--color-ring-primary` | Maps to `--line-focus-ring-color` (form P) | — |
| B6 | `--font-text-xs-size` and `--font-heading-xs-size`; `--font-text-md-size` and `--font-heading-md-size` | The text keys win the ties at `--line-font-size-0` and `--line-font-size-1` | The heading keys win |
| B7 | The text-xs, text-sm, heading-xs, heading-sm and heading-md line heights | `--font-text-xs-line-height` wins the five-way tie at `--line-leading-3` | Another key in the tie wins |
| B8 | `--border-radius-sm`, `--border-radius-md` | `sm` wins the tie at `--line-radius-2` | `md` wins |
| B9 | `--border-radius-full` | Maps to `--line-radius-round` by role | Nearest value to `--line-radius-6` |
| B10 | `--font-heading-xl-line-height`, `--font-heading-3xl-line-height` | Heading line heights drive the shared `--line-leading-2` and `--line-leading-1` steps | — |
| B11 | `--border-radius-md`, `--border-radius-lg` | Both leave the list under nearest value. The round-4 option text had said all 6 radii | Map all 6 radii |

#### 6.G.7 G7 — Transport recipes

- **Owner:** webcomponents-supervisor (file classes: §4 table; plan §4.0; §12 AM-022).
- **Deps:** G4, G6. The MDX documents the `line-themes/hosts/mcp-apps.css` export that G6 ships (§6.G.6; §12 AM-040).
- **Changes:** Storybook stories and MDX under `apps/storybook`; the Bun test `apps/storybook/__tests__/ag-ui-middleware.test.ts`, which the existing "Unit tier" step (`bun test`, `.github/workflows/checks.yml:38-39`) runs, because the `bunfig.toml` `[test]` table ignores only `temp/**` (§12 AM-019, L3R13-04); and these `apps/storybook` devDependencies (§12 AM-016, L3R10-05). Vite bundles the client packages into the static Storybook (R6 §6 Q2 option (a); §10 SD64; §12 AM-016, L3R10-05). The middleware is server code (R6 TL;DR), and only the Bun test loads it (§12 AM-017, L2R11-07):
  - `@ag-ui/a2ui-middleware`, pinned as below.
  - `"@ag-ui/client": "1.0.3"` and `"rxjs": "7.8.1"`. The recipe uses `@ag-ui/client` against the mock producer (R6 TL;DR), and the Bun test repeats probe P5, which wraps an `AbstractAgent` stub from `@ag-ui/client` in the middleware (R6 §3 P5). The middleware declares both as peers (R6 §2.1). R6 §2.5 pins `@ag-ui/client` 1.0.3; `rxjs` 7.8.1 is the exact peer of the middleware and an exact dependency of the client (R6 §2.1, §3 P4) (§12 AM-017, L2R11-02).
  - `"@a2a-js/sdk": "1.3.0"` for the A2A recipe (R6 §2.2, §2.5; §10 SD66).
  - The MCP recipe imports no MCP SDK; SDK v2 appears in MDX only (§10 SD67). The SSE recipe uses the native `EventSource` (R6 §2.4).
- line ships no transport code. The app owns the transport (ARCH §17.5).
- WebSocket and `fetch`-stream JSONL, the fifth ARCH §17.5 row, get no Phase 1 recipe; Phase 1 ships the four recipes AG-UI, A2A, MCP and SSE (PRD §7.3 item 8; §12 AM-012, L3R7-03).

**AG-UI**

- The deployed story MUST use an in-browser mock producer (§10 SD64).
- The middleware does not run fully in a browser. It imports `crypto` and uses CommonJS-only `clarinet`. The render path ran in Chromium through esm.sh, but the action path throws under esm.sh's `crypto` stub (R6 §2.1).
- The mock MUST emit `ACTIVITY_SNAPSHOT` events with `activityType: "a2ui-surface"`, `replace: true` and a `messageId`, first with `status: building` and then with `a2ui_operations`, and accept `forwardedProps.a2uiAction` (R6 §2.1). It MUST also emit a `retrying` fixture and a `failed` fixture, each followed by an operations snapshot (§12 AM-006, L2R3-03) [INFERENCE: R6 observed only `building`; the `retrying` and `failed` fields come from the middleware type declarations, and no observation shows a snapshot after `failed`] (§12 AM-007, L2R4-04).
- The MDX MUST document the server convention pinned exactly to `@ag-ui/a2ui-middleware` 0.0.13, the npm `latest` on 2026-10-20 (npm registry; §10 SD64).
- A Bun test MUST run the pinned middleware and compare its output with the mock fixture for the observed `building` → operations sequence; the `retrying` and `failed` fixtures are outside the comparison (§10 SD64; §12 AM-007, L2R4-04).
- G7 MUST first re-run R6 probe P5 against 0.0.13. R6 observed P5 on 0.0.12 (R6 §2.1). A behaviour change lands as an AM row.
- The recipe server MUST set `defaultCatalogId` to the v0_9 basic id (§10 SD43).
- The middleware's own fallback id is `…/v0_9/basic_catalog.json`, which differs from the basic id `web_core` 0.13.0 uses (R6 §2.1).
- The recipe MUST log `line-a2ui-error` locally and send nothing (§10 SD65).
- The recipe MUST name the gap. AG-UI and the middleware define no error channel (R6 §5.1 item 1; ARCH §17.4; §12 AM-005, L2R3-13).
- The revisit trigger is a middleware release with an error path (§10 SD65).

**AG-UI lifecycle mapping (§10 SD59; §12 AM-004, L2R2-09)**

The recipe maps the `status` of each `ACTIVITY_SNAPSHOT`. The recipe never writes `aria-busy`; the surface owns it per batch (§6.G.4; §12 AM-006, L2R3-03). "Inert" means the HTML `inert` attribute on the surface host.

| Producer `status` | Recipe effect |
|---|---|
| `building`, `retrying` | A recipe-owned status line outside the surface shows the state |
| `failed` | The recipe sets `inert` on the surface host |
| Next operations snapshot | The recipe removes the status line and `inert` |

Source: R6 §2.1, §4, §6 Q7 (a) for showing the states; the status line is AM-006 and the `inert` attribute is AM-004 (§12 AM-004, L2R2-09; §12 AM-006, L2R3-03; §12 AM-007, L2R4-04).

**A2A**

- The recipe MUST accept an array or a single message per DataPart (R6 §2.2; §10 SD66).
- The recipe MUST accept `application/json+a2ui` beside `application/a2ui+json` (R6 §2.2; §10 SD66).
- The recipe MUST target A2A v1.0 with `@a2a-js/sdk` 1.3.0 (R6 §2.2; §10 SD66).
- The recipe MUST send only `application/a2ui+json`: `[action]` for an action, `[error]` for an error (ARCH §17.5; R6 §2.2; §10 SD66; §12 AM-041).
- Capabilities MUST travel in the message metadata (ARCH §17.5; §12 AM-032, L3R23-08).
- The recipe MUST send `line-a2ui-error` as `[error]`, an array that holds the `error` message, in an `application/a2ui+json` DataPart, because the A2UI v0.9.1 A2A extension requires `data` to be an array of messages (R6 §2.2, `docs/research/01-research-transports.md:115`). The client-to-server schema `client_to_server_list.json` takes a list as well [INFERENCE: R6 does not cite that file] (ARCH §17.4; §12 AM-040, AM-041).

**MCP**

- A2UI MUST arrive only as a tool-result `EmbeddedResource` (ARCH §17.5; §10 SD67).
- `_meta.ui.resourceUri` belongs to MCP Apps `ui://` resources (R6 §2.3).
- Capabilities MUST travel in `_meta.a2ui` per call (R6 §2.3; §10 SD67).
- MCP SDK v2 appears in MDX only (§10 SD67).
- The recipe MUST send an action as a `tools/call` of `a2ui_action` and an error as a `tools/call` of `a2ui_error` (ARCH §17.5; §12 AM-032, L3R23-08).

**SSE**

- One message travels per SSE event (ARCH §17.5).
- The stream MUST end with a named `end` event (R6 §2.4; §10 SD67).
- Capabilities MUST travel in the query string, because `EventSource` sends no body or header (R6 §2.4; §10 SD67).
- The recipe MUST send actions by POST (ARCH §17.5; §12 AM-032, L3R23-08).
- The recipe MUST send `line-a2ui-error` by POST, as the `error` message in JSON (ARCH §17.4; R6 §2.4; §12 AM-040).

**MCP Apps View delivery**

- The docs MUST show `vite-plugin-singlefile` first. It folds the lazy `load()` chunks into one file (R5 §2.2; §10 SD68) [INFERENCE: from the plugin source, R5 §2.2; no `line-genui` View was built (R5 §6 Q6), and the README warns of non-inlined chunks].
- The docs MUST show a CDN listed in `resourceDomains` as the alternative (R5 §2.2; §10 SD68).
- The docs MUST tell server authors to list font origins. The default CSP has no `font-src` (R5 §2.2; §10 SD68).
- The docs MUST import ext-apps 2.x from `./app-with-deps`. The main entry pulls Zod 4 peers into a Zod 3 app (R5 §2.1, §2.3, §4 (P7); §10 SD69).
- The docs MUST show the app applying `hostContext.styles.variables` and `hostContext.theme` with the ext-apps calls `applyHostStyleVariables` and `applyDocumentTheme`, which set the host values on `<html>` that `mcp-apps.css` reads and set `color-scheme` (ARCH §17.6; R5 §2.3; §12 AM-032, L3R23-08).

**Acceptance**

- Storybook holds one recipe per transport: AG-UI, A2A, MCP and SSE (plan §7.3).
- Each recipe renders C1–C4 through `<line-a2ui-surface>` in the deployed Storybook.
- The Bun comparison test passes on middleware 0.0.13.
- The A2A recipe renders both the array and the single-message DataPart.
- On the AG-UI mock, `building` and `retrying` show the recipe status line and leave `aria-busy` to the surface, `failed` sets `inert` on the surface host, and the next operations snapshot clears both (§12 AM-006, L2R3-03).
- A Button action in the A2A, MCP and SSE recipes leaves through the outbound path above: an `[action]` DataPart with capabilities in the message metadata, a `tools/call` of `a2ui_action`, and a POST (ARCH §17.5; §12 AM-032, L3R23-08).
- A `line-a2ui-error` from the surface in the A2A, MCP and SSE recipes leaves through the error path above: an `[error]` `application/a2ui+json` DataPart, a `tools/call` of `a2ui_error`, and a POST of the `error` message as JSON (ARCH §17.4, §17.5; §12 AM-040, AM-041).

### 6.D Stream D — Cross-Cutting Documentation

- Owner of every D task is webcomponents-supervisor (plan §4.0).
- Stream D documents what streams G and C ship (plan §4.4).

#### 6.D.1 D1 — Agent-driven UI guide

- **Owner:** webcomponents-supervisor.
- **Deps:** G1–G6.
- **Changes:** one Storybook MDX guide under `apps/storybook/stories/` [INFERENCE on the path, following Phase 00 spec §6.G] (§10 SD70).
- **Contract**
  - The guide MUST explain descriptors, `agentExposed` and the two catalogs (ARCH §17.3).
  - The guide MUST state the `line` catalog id and the basic opt-in rule (§10 SD42, SD43, SD44).
  - The guide MUST show the tool emitter with the provider argument, the 1024-character cap and the Anthropic per-request caps (§10 SD48, SD49).
  - The guide MUST state the preview status of `@websublime/line-genui/a2ui` and `@websublime/line-icons/a2ui` (ARCH §17.7; §12 AM-010, L3R5-05).
  - The guide MUST document the surface attributes `live-update-text` and `live-error-text`, their defaults "Content updated." and "Some content could not be shown.", and how the consumer localises the live region through them (§10 SD59; §12 AM-013, L3R7-01).
  - The guide MUST describe the URL policy and the `urlPolicy` property, the Markdown hook `markdownRenderer`, the limits and the error payload with the surface's own codes `LIMIT_EXCEEDED`, `MARKDOWN_RENDER_ERROR`, `MISSING_ACCESSIBLE_NAME` and `UNMAPPED_ICON` (§10 SD57, SD58, SD56, SD55; §12 AM-032, L3R23-04; §12 AM-040). It MUST document the attributes `max-nodes`, `max-depth` and `max-data-model-size` that override the limits (§12 AM-015, L3R9-05).
  - The guide MUST state the template-list focus limit and its trigger (§10 SD60).
  - The guide MUST describe the MCP Apps bridge and View delivery (§10 SD62, SD68).
- **Acceptance:** the guide builds in Storybook, and every code sample that imports `@websublime/*` compiles against the shipped exports. Each such sample is a `.ts` file in `apps/storybook/stories/agent-driven-ui-samples/`, which `apps/storybook/tsconfig.json` includes (`stories/**/*`), so the existing "Typecheck" step (`bun --filter '@websublime/*' typecheck`, `.github/workflows/checks.yml:24-25`) compiles it against the built declarations. The MDX shows each file through a Vite `?raw` import [INFERENCE: not probed]. A sample that imports a package no Phase 1 manifest declares, such as `@modelcontextprotocol/ext-apps/app-with-deps` (§10 SD69), stays an MDX code block and is not compiled (§12 AM-016, L3R10-08). A sample that imports CSS, such as the side-effect import `@websublime/line-themes/hosts/mcp-apps.css`, also stays an MDX code block and is not compiled (§12 AM-019, L3R13-05). These rules win over the first: a sample that also imports `@websublime/*` still stays MDX (§12 AM-017, L3R11-06).

#### 6.D.2 D2 — Recipes index

- **Owner:** webcomponents-supervisor.
- **Deps:** G7.
- **Changes:** one Storybook MDX page that links the four recipes.
- **Contract:** the index MUST list the four Phase 1 transports, AG-UI, A2A, MCP and SSE, each with its inbound and outbound shape and its pinned versions; WebSocket and `fetch`-stream JSONL get no Phase 1 recipe (ARCH §17.5; PRD §7.3 item 8; §10 SD66, SD64, SD67; §12 AM-012, L3R7-03).
- **Acceptance:** each link resolves in the deployed Storybook.

#### 6.D.3 D3 — Getting Started updates

- **Owner:** webcomponents-supervisor.
- **Deps:** C1–C20, G4, P6. D3's ledger row stays `blocked` until the Phase 1 Version PR merges, as Phase 00 row `00-Z29` is `blocked` on an outside event (`docs/plans/00-tasks-design-system.md:143`; plan §4.6) (§12 AM-039). The orchestrator (main session or `sdlc`) flips the row `blocked → todo` once that merge has happened (§6.Z; §12 AM-040, AM-041).
- **Timing:** D3 lands after the Phase 1 Version PR merges, so its install snippets and pinned CDN URLs point at the published `0.2.0` (§6.P.13; §12 AM-038).
- **Changes:** `apps/storybook/stories/getting-started.mdx` (Phase 00 spec §6.G.1).
- **Contract**
  - Getting Started MUST cover installing the Phase 1 components and the opt-in `line-genui` package (plan §4.4).
  - It MUST give full subpath URLs for CDN use (§10 SD32).
- **Acceptance:** each install snippet works as written. Each CDN snippet uses the URL form that the P6 check pages prove, and the snippets for the pages P6 covers work as written there (§6.P.6; §10 SD32; §12 AM-032, L3R23-13).

### 6.S Site

#### 6.S.1 S1 — Landing page

- **Owner:** webcomponents-supervisor (file classes follow the §4 table; for example, the `playwright.config.ts` change is an infra-supervisor edit; plan §4.0; §10 SD71; §12 AM-022).
- **Deps:** C1–C4 [INFERENCE: the hero, value proposition, features and Storybook link use the validating set]. S1 is one PR that opens when those rows are done. A section that needs another component adds that C row to S1's Deps through an AM (plan §2.8, §4.5; §12 AM-037).
- **Changes:**
  - `apps/site/src/pages/index.astro` with hero, value proposition, features and a Storybook link (plan §2.8, PRD §5.3).
  - `apps/site/package.json` `devDependencies` gain `@websublime/line-components`, `@websublime/line-themes` and every other `@websublime/*` package the page imports, as `workspace:^` (R12 §2.2, §3.2).
  - `playwright.config.ts` gains a third `webServer` entry that serves `apps/site/dist` through `astro preview` on its own port [INFERENCE: `astro preview` is not in R12; port number left to the implementer, distinct from 4319 and 4320] (§10 SD71).
  - `apps/site/__tests__/landing.e2e.ts`.
- **Contract:**
  - Each section loads its components through a processed `<script>import '@websublime/line-components/<c>';</script>` placed in that section (§10 SD72, R12 §2.1).
  - The page uses no Astro or Lit integration (§10 SD72, MANIFESTO Principle 5).
  - The guard test MUST assert that every `line-*` element on the built page matches `:defined` in Chromium, Firefox and WebKit (§10 SD72, R12 §6 Q3).
  - The `:not(:defined)` rule, the theme CSS scope and the stylesheet delivery are the implementer's choice, recorded in the PR (§10 SD73).
- **Acceptance:**
  - `bun run build` builds the site with the page.
  - The guard test fails when a section's `<script>` is removed by hand [run once, recorded in the Verify record].
  - The page passes the §7.4 axe ruleset.

### 6.Z Repo-wide

The PR that creates the Phase 1 ledger also aligns PROCESS §4 "Repo agents" (`docs/PROCESS.md:79-82`), the PROCESS §4 one-implementer rule (`docs/PROCESS.md:92-95`), the PROCESS §6 changeset step (`docs/PROCESS.md:151-152`), the `sdlc` implement routing by stream (`.claude/agents/sdlc.md:42`), the stream letters in the supervisor `description:` lines (`.claude/agents/webcomponents-supervisor.md:3`, `.claude/agents/infra-supervisor.md:3`), the supervisor changeset steps (`.claude/agents/webcomponents-supervisor.md:46-47`, `.claude/agents/infra-supervisor.md:47-48`), the supervisor escalation lines that route to the other supervisor (`.claude/agents/webcomponents-supervisor.md:111`, `.claude/agents/infra-supervisor.md:107`), aligned to route through the orchestrator (main session or `sdlc`), which dispatches the other supervisor on the same task branch, the `sdlc` Handoffs routing by work area (`.claude/agents/sdlc.md:57-58`), aligned so the §4 file-class table decides which supervisor edits each file, the PROCESS §6 row-flip owners (`docs/PROCESS.md:138-140`), aligned to add the `blocked → todo` flip owner (orchestrator), and the `CLAUDE.md:48` ledger pointer. No separate task does it (plan §4.6, §10 step 6; §12 AM-002). The aligned rule reads: one accountable implementer per task; the orchestrator (main session or `sdlc`) dispatches the other supervisor, one after the other on the same task branch, for the classes the Phase 1 spec §4 table gives it; the second dispatch adds no changeset entry; the accountable supervisor writes the changeset entry last, after the other dispatch returns, and names every published package the branch changed (§12 AM-025, AM-026, AM-027).

#### 6.Z.1 Z1 — Code of conduct

- **Owner:** main session (plan §4.0).
- **Deps:** none.
- **Changes:** `CODE_OF_CONDUCT.md` at the repository root. `README.md` links it.
- **Contract:**
  - The file MUST exist on `main` before the Phase 1 Version PR merges (PRD §10, plan §7.4).
  - The file MUST carry the Contributor Covenant, latest version (§10 SD74).
  - Miguel supplies the reporting contact in the Z1 PR (§10 SD74).
- **Acceptance:** the file exists and the README link resolves.

#### 6.Z.2 Z3 — Phase 1 retrospective

- **Owner:** main session.
- **Deps:** every other Phase 1 row (§10 SD87; §12 AM-009, R5-L1-01; §12 AM-036).
- **Timing:** Z3 lands after the Phase 1 Version PR merges, because it depends on D3, which lands after that merge (§6.D.3; §12 AM-038).
- **Exit sweep:** the main session runs the sweep over the live documents and the ledger before the last rows land (plan §7.4, §10 step 7). The sweep is not a row of its own: each finding becomes a new row, as the Phase 00 exit sweep filed row C18 (`docs/plans/00-tasks-design-system.md:53`, "found by the Phase 00 exit sweep"), and Z3's Deps take in those rows (§12 AM-036).
- **Changes:** `docs/retrospective/01-<slug>.md` with a hand-off to Phase 2 (plan §10 step 7).
- **Contract:**
  - The sweep MUST run before the last rows land (plan §7.4; retrospective lesson 9).
  - The retrospective MUST carry a hand-off section for Phase 2 (plan §7.4).
  - The Phase 2 hand-off MUST name the SD76 widening duty (§7.2; §12 AM-030).
- **Acceptance:** the sweep's findings are ledger rows, and the retrospective file exists with its hand-off section, which names the SD76 widening duty (§7.2; §10 SD87; §12 AM-032, L3R23-05).

#### 6.Z.3 Z5 — Workspace resolution in tests

- **Owner:** main session (plan §4.0 Z row). File classes follow the §4 table. The test files, `packages/line-testing/src/`, `packages/line-core/__experimental__/htmx/README.md` and the `example/server.ts:5` header comment are webcomponents-supervisor edits. `packages/line-core/__experimental__/` is `line-core` code in webcomponents-supervisor's scope (`.claude/agents/webcomponents-supervisor.md:98`), and the §4 package-source row names it. The manifests, the root `package.json`, `bun.lock`, `.changeset/config.json` and `packages/line-testing/tsconfig.json` are infra-supervisor edits (§12 AM-048).
- **Deps:** none. Z5 blocks C1–C20 (§6.C.0 step 1; §6.C.4; §10 SD86; §12 AM-048).
- **Changes:**
  - `packages/line-tokens/__tests__/shadows.e2e.ts` moves to `packages/line-themes/__tests__/shadows.e2e.ts`. It loads the `line-colors`, `line-themes` and `line-tokens` CSS by package name, where it read three `dist/` files by relative path (`shadows.e2e.ts:39-41`). `packages/line-themes/package.json` gains `"@websublime/line-tokens": "workspace:^"` in `devDependencies`, a test-only edge from L3 down to L0 (PRD §6.1; §4.4).
  - Six `line-themes` tests replace their relative paths into a `dist/` with package names: `aliases-scope.e2e.ts:31`, `cascade-layer.e2e.ts:19`, `hue-role-names.e2e.ts:33`, `palette.snapshot.test.ts:24`, the `dist/` parts of `schema.test.ts:43-44` and `role-mapping.snapshot.test.ts:24`. `line-colors` resolves through the existing `dependencies` entry, `line-tokens` through the new devDependency, and `line-themes` through a self-reference. `schema.test.ts` keeps reading `src/accent/` and `src/gray/` by relative path, because those are its own `src/` (Phase 00 spec §6.C.7).
  - `packages/line-testing/` is a new private package with `package.json` and `tsconfig.json` (§4.6), a short `README.md` and `src/htmx.ts`. `src/htmx.ts` is `packages/line-core/__tests__/integration/htmx/htmx-harness.ts`, moved. `routeHtmx` resolves `htmx<major>/dist/htmx.js` through `import.meta.resolve` from its own package, which declares `htmx2` and `htmx4`, where it built a path into the root `node_modules` (`htmx-harness.ts:103-113`). Its value imports of `expect` and `test` from `playwright/test` resolve through the package's `playwright` peer (§4.6).
  - `packages/line-core/__tests__/integration/htmx/htmx-harness.e2e.ts` imports `@websublime/line-testing/htmx`. The self-test, the probes `line-htmx-value-probe.ts` and `line-htmx-compound-probe.ts` and the `/htmx/` fixture page `index.html` stay in `line-core`.
  - `packages/line-core/package.json` gains the `devDependencies` `"@websublime/line-testing": "workspace:^"`, `"htmx2": "npm:htmx.org@2.0.11"` and `"htmx4": "npm:htmx.org@4.0.0"`. The `packages/line-core/__experimental__/htmx/example/server.ts` spike resolves `htmx2` and `htmx4` through `Bun.resolveSync` from its own directory (`server.ts:16-17`), so it keeps working (§4.5).
  - The root `package.json` drops `htmx2` and `htmx4`, and `bun.lock` follows. `.changeset/config.json` adds `@websublime/line-testing` to `ignore` (§4.6).
  - `packages/line-core/__experimental__/htmx/README.md:36-37` says that htmx comes from the `line-core` devDependencies `htmx2` and `htmx4`, where it names the root devDependencies. Its htmx source locators at `:112-113`, `:133`, `:135`, `:139` and `:158` now resolve under `packages/line-core/node_modules/` and say so. The `example/server.ts:5` header comment names the `line-core` devDependencies the same way.
  - `packages/line-themes/__tests__/auto-pair.e2e.ts` replaces `auto-pair.behaviour.test.ts`. It runs in the chromium, firefox and webkit projects (`playwright.config.ts:5`, `packages/**/*.e2e.ts`) and loads the built `line-colors` and `line-themes` CSS resolved by package name. It holds the PRD §9.5 auto-pair table as its oracle and reads `ACCENT_HUES` from `@websublime/line-schemas`, a `line-themes` dependency.
    - Each check compares `--line-<role>-1` to `--line-<role>-12`, `--line-<role>-a1` to `--line-<role>-a12` and `--line-<role>-contrast` with the `--line-<hue>-*` tokens of the expected hue. Both sides are computed values read on the same page in the same engine. The test never compares literal strings, because WebKit serializes `light-dark(color(display-p3 …))` where Chromium and Firefox give hex. Every value read MUST be non-empty.
    - (a) With no `data-accent` and no `data-gray`, the accent role equals indigo and the gray role equals slate.
    - (b) For each of the 31 `ACCENT_HUES`, `data-accent` alone sits on `<html>`, or on a scope under a parent whose `data-gray` differs from the expected pair, and the gray role equals the §9.5 auto-pair gray.
    - (c) An explicit `data-gray` wins over the auto pair.
    - (d) A nested scope with only `data-accent` takes its own auto pair under a parent whose gray differs from that pair (PRD §9.5 "Auto-pair in nested scopes").
    - A scope that inherits slate would let the slate-paired accents (slate, violet, iris, indigo, blue, sky, cyan) pass with their auto-pair block deleted [review-gate lens mutation probe, 2026-10-23].
  - `packages/line-themes/__tests__/defaults-selectors.test.ts` is a `bun test` over `src/defaults.css` with three checks. Every selector sits inside `:where()`. No selector uses a `[data-theme` aggregator (PRD §9.14 T4). Every `[data-accent="X"]` auto-pair selector carries `:not([data-gray])`. The browser test cannot see a missing guard, because `src/index.css` imports `defaults.css` before `gray/*.css` at equal specificity, so an explicit `data-gray` wins either way (`packages/line-themes/src/index.css:8-50`). No other test covers these checks, because `cascade-layer.test.ts` checks only the top-level nodes of each file.
  - The branch carries an empty changeset (`bun run empty`), because only tests and `devDependencies` change in published packages (PROCESS §6).
  - `line-components` does not change in Z5. The first C row whose tests import `@websublime/line-testing` adds it to the `line-components` `devDependencies` (§4.6).
- **Contract:**
  - A test MUST reach another workspace package only through that package's name, and the test's own package MUST declare it in `dependencies`, `peerDependencies` or `devDependencies`. Bun's isolated install enforces the rule, because an undeclared workspace package does not resolve (PRD §5.2 rule 1).
  - A test MUST reach its own package's build output, the targets of its `exports` (`dist/`), through its own package name, a self-reference through `exports`, so a broken `exports` entry fails the test. Resolving a wildcard export whose target does not exist returns the path in Node and in the Playwright loader, and throws in Bun 1.4.3 with a misleading "Cannot find package" message. A test that asserts a built file exists MUST check the resolved path on disk and MUST treat a throw as a missing file (PRD §5.2 rule 2).
  - A relative path MUST NOT reach into another package or into the package's own build output (`dist/`). A test MAY reach its own package's `src/` and `__tests__/` by a relative path, whether or not `files` ships them. The `line-core`, `line-components`, `line-icons`, `line-schemas` and `line-utils` manifests ship `src/` and map no `exports` to it. An app's tests MAY reach the app's own sources, such as `apps/storybook/stories/`, which `apps/storybook/__tests__/storybook-smoke.e2e.ts:92` reads (PRD §5.2 rule 3).
  - Test helpers that more than one package uses MUST live in the private package `@websublime/line-testing`, and each user MUST declare it as a devDependency (PRD §5.2 rule 4).
  - A test-only devDependency between design-system packages MUST point down the layer order (MANIFESTO Law 10). A test that needs a higher layer MUST live in that layer's package (PRD §5.2 rule 5).
  - A test MUST resolve a third-party package only through a manifest that declares it. Shared test tooling that every package uses, for example `playwright`, `@open-wc/testing-helpers` and `@happy-dom/global-registrator`, is declared in the root `devDependencies` (§6.G.2). A package MUST declare every third-party package that its own non-test code resolves. `line-testing` declares `htmx2` and `htmx4` in `dependencies` and `playwright` in `peerDependencies` (§4.6), and `line-core` declares `htmx2` and `htmx4` for its `__experimental__/htmx` spike (PRD §5.2 rule 6).
  - `line-testing` MUST stay `"private": true` and MUST hold no `@websublime/*` in `dependencies` or `peerDependencies` (§3.1).
- **Acceptance:**
  - No file under `packages/*/__tests__/` or `apps/*/__tests__/` reaches into another package, or into its own package's `dist/`, by a relative path. Relative paths to the package's own `src/` and `__tests__/`, and to an app's own sources such as `apps/storybook/stories/`, stay. A grep over the test files proves it.
  - Every workspace package that a test resolves is declared in the manifest of the test's package, and no test-only devDependency between design-system packages points up the layer order.
  - `auto-pair.e2e.ts` covers the 31 accents in chromium, firefox and webkit. Removing any one auto-pair block from `src/defaults.css` and rebuilding `line-themes` fails it. The Verify record shows this at least for a slate-paired accent (indigo) and for amber.
  - `defaults-selectors.test.ts` fails when one auto-pair selector loses `:not([data-gray])`.
  - The harness self-test passes through `@websublime/line-testing/htmx` on htmx 2 and htmx 4 in the three engines.
  - `bun test`, `bun run e2e`, `lint-layers`, `verify-pack` (which packs no `line-testing` tarball), `bun install --frozen-lockfile`, `bun --filter '@websublime/*' typecheck` (`line-testing` included) and `bun run status` pass, and no changeset names `@websublime/line-testing`.

## 7. Cross-Cutting Concerns

### 7.1 TypeScript 7 configuration and declaration wiring

Task P8 carries every change in this section (plan §2.9, D1, §10 SD7).

| File | Change | Source |
|---|---|---|
| `package.json` (root) | `"typescript": "^7.0.2"`; remove `"vite-plugin-dts"` | R11 §2.1; D1 (a) |
| `vite.config.shared.mjs` | Remove the `dts` import and plugin (lines 2, 24); add `emptyOutDir: !process.argv.includes('--watch')`, shown in the §6.P.9 block | D1 (a); §10 SD7; §12 AM-008, L2R4-05 |
| `packages/line-core/package.json` | `build` and `dev` as in §4.5 | §10 SD7; R11 §2.8 P-T (`build` only; §12 AM-006, L2R3-04) |
| `packages/line-components/package.json` | `build` and `dev` as in §4.2 | §10 SD7 |
| `packages/line-genui/package.json` | No P8 change; P1 writes `build` and `dev` as in §4.1 | §10 SD7; §6.P.1 (§12 AM-032, L3R23-12) |
| `packages/line-{schemas,utils,icons}/package.json` | No script change; `tsc -b` now runs 7.x | D1 (a) |
| `tsconfig.base.json` | No change; `declarationMap: true` stays (line 19) | §10 SD7 |
| `packages/line-core/src/mixins/inspector.ts` | The line 111 comment names TypeScript 7.x `tsc --emitDeclarationOnly`, not `vite-plugin-dts`; webcomponents-supervisor writes it in the P8 PR, outside the one-commit document change (§4; §6.P.8) | D1 (a); §12 AM-040, AM-041 |
| `apps/storybook/types/line-css.d.ts` | `declare module` lines for the six CSS specifiers R11 §2.7 RC1 lists | R11 OQ2 (b); plan §5.6 defaults |
| `apps/storybook/tsconfig.json` | Includes the new `.d.ts` | R11 OQ2 (b) |

- The Vite-built packages MUST emit every `.d.ts` with TypeScript 7.x `tsc --emitDeclarationOnly` (D1).
- `tsc` MUST run after `vite build`, because Vite empties `dist/` first, and again on every watch rebuild (Vite 8.3.4 `prepareOutDirPlugin`, `node_modules/vite/dist/node/chunks/node.js`). The watch build therefore sets `build.emptyOutDir: false` (§6.P.9), so the `tsc --watch` declarations survive rebuilds [INFERENCE: not probed] (§12 AM-006, L2R3-04).
- The `--noEmit false` flag overrides `noEmit: true` in each package tsconfig (`packages/line-core/tsconfig.json:4`).
- `--checkers` stays at its default (§10 SD7, R11 §2.4).
- No TypeScript 6.0 package enters the workspace (D1 (b) rejected).
- The `declare module` lines keep `noUncheckedSideEffectImports` on for every other import (R11 OQ2 (b)).
- The existing "Typecheck" step type-checks `apps/storybook` against the emitted `line-core` declarations. That step and `verify-pack` check (a) verify the output (§10 SD7; `checks.yml:24-27`).
- Editor tools for Astro and MDX that need the TypeScript API lose it until they support 7.x. No CI step checks `.astro` or `.mdx` (R11 §2.9).
- The CEM analyser parses with its own nested TypeScript 5.4.5 and does not read the workspace version (R4 §2.9).

### 7.2 Versioning and changesets

| Package | Version today | Phase 1 changeset | Version at phase exit | Source |
|---|---|---|---|---|
| `line-tokens` | 0.1.3 | `minor` | 0.2.0 | plan §7.4; PRD §7.3 |
| `line-colors` | 0.1.3 | `minor` | 0.2.0 | plan §7.4 |
| `line-schemas` | 0.1.1 | `minor` | 0.2.0 | plan §7.4 |
| `line-themes` | 0.1.2 | `minor` | 0.2.0 | plan §7.4 |
| `line-utils` | 0.1.0 | `minor` | 0.2.0 | plan §7.4 |
| `line-core` | 0.1.3 | `minor` | 0.2.0 | plan §7.4 |
| `line-components` | 0.1.2 | `minor` | 0.2.0 | plan §7.4 |
| `line-icons` | 0.1.0 | `minor` | 0.2.0 | plan §7.4 |
| `line-genui` | 0.1.0 (seeded by P1) | `minor` | 0.2.0 | §10 SD3; R9 §2.6 |

- Every package is released at `0.2.0` through `release.yml` with provenance (plan §7.4).
- A package that the merged Phase 1 changesets do not bump at `minor` (`bun run changeset status`), including one with only `patch` changesets, still needs a `minor` changeset before the Version PR, so all nine land at `0.2.0` [INFERENCE: plan §7.4 "Every package is released at `0.2.0`"] (§10 SD75; §12 AM-039).
- `0.1.0` of `line-genui` is never published (§10 SD3).
- Once `v0.2.0` ships, further Phase 1 changesets use `patch` (PROCESS §6).
- Canaries follow `0.2.0-<sha>-SNAPSHOT` (`.changeset/config.json:18`; R9 §2.6) [INFERENCE: extrapolated from R9's `0.0.0`-seed probe]. The P3 snapshot dry run checks the `line-genui` canary (§6.P.3).
- Without `onlyUpdatePeerDependentsWhenOutOfRange`, Changesets bumps a dependent to `major` on every `minor` or `major` bump of a peer. With the flag, it does so only when the new peer version leaves the declared range (`@changesets/assemble-release-plan` 6.0.10 `src/determine-dependents.ts:266-269`). Changesets reads `workspace:^` as `^<old version>` (`:217-219`), so `0.2.0` leaves it.
- `line-genui` therefore declares both peers, and at P1 the `devDependencies` that repeat them, as `workspace:^0.1.0 || ^0.2.0` (§4.1). The Phase 1 Version PR keeps the peers and rewrites the two `devDependencies` to `workspace:^0.2.0`; a canary pins both to the snapshot version (§4.1; §12 AM-030). P3 sets `___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH.onlyUpdatePeerDependentsWhenOutOfRange: true` in `.changeset/config.json` unconditionally (§6.P.3; §10 SD76; §12 AM-028).
- An orchestrator probe on 2026-10-21 (`@changesets/cli` 2.31.1, Bun 1.4.3; `line-genui` 0.1.0 with both peers also as `devDependencies`; one `minor` changeset per package) gave `line-genui` 0.2.0 with the two-minor range and the flag. `workspace:^` gave 1.0.0 with or without the flag, and the two-minor range without the flag gave 1.0.0.
- Each later phase that moves `line-components` or `line-icons` to a new minor widens both peer ranges in `packages/line-genui/package.json`, for example `|| ^0.3.0`, on `main` before `changeset version` builds that phase's Version PR, in the first PR of the phase that adds a `minor` changeset for `line-components` or `line-icons` (§10 SD76). The `devDependencies` follow Changesets.
- No script fails on a miss. A lens probe on 2026-10-21 gave `line-genui` 1.0.0 in the Version PR and a `1.0.0-<sha>-SNAPSHOT` canary. The snapshot guard accepts any `<x.y.z>-<sha>-SNAPSHOT` version, and the stable guard rejects only prerelease versions (`scripts/publish.mjs:39, :135-136, :144-145`). Miguel, who merges the Version PR, therefore checks the `line-genui` version (§12 AM-030; §12 AM-032, R23-L1-02).
- The Version PR has no row (§6.P.13). Miguel, who merges it, owns its release-time records: the `cdn-check.yml` runs (§6.P.6), the `visual-off-pairs.yml` run (§6.P.11) and the live provider calls (§6.G.3) (§12 AM-037). If the Version PR does not merge within 48 hours of §6.P.4 step 7, he recreates the `release.yml` trusted publisher before the merge (Phase 00 spec §7.2; §12 AM-038).
- P3 MUST prove the nine `0.2.0` versions and a `0.2.0-` `line-genui` canary in dry runs before the first `line-genui` release (§6.P.3).
- R9 §2.6 ran on `@changesets/cli` 2.31.1, the repo version. npm `latest` is 3.0.3. Phase 1 stays on 2.x [INFERENCE: no decision moves it] (§10 SD77).

### 7.3 Custom Elements Manifest

- Two manifests ship. The `line-components` build emits one into that package, and it serves the G5 tests, Storybook and consumers (§10 SD26, D8). The `line-genui` build emits one for `<line-a2ui-surface>` (§10 SD94).
- Storybook loads one manifest merged from both by concatenating their `modules` arrays (§6.P.10; §10 SD94).
- The analyser runs before the Storybook build, because `package.json:23` builds packages before apps (§10 SD26).
- `line-components` ships it with a `customElements` field, a `files` entry and an `exports` key (D8; §4.2).
- The analysis includes the `line-core` sources, because inheritance resolves by class name across the manifest (R4 §2.3).
- Module paths of custom-element declarations with a `tagName` (or a `custom-element-definition` export, R4 §2.7) MUST resolve to files inside the tarball. `files` ships `src`, so the analyser's `src/…` paths resolve [INFERENCE: R4 OQ5 notes paths may need to point at `dist`]. Inherited `line-core` declarations without a `tagName`, such as `LineElement` (R4 §2.2), keep `../line-core/…` paths that resolve to no file in the tarball (analyser 0.11.0 `cli.js:55-66`; §12 AM-040). C1 checks it on the packed `line-components` tarball, and G4 on the packed `line-genui` tarball (§6.C.6, §6.G.4; §12 AM-032, L3R23-03).
- Tests look up each element by tag, because `modules[]` order changes per run (R4 §2.7, P9).

Content rules (§10 SD61):

| Fact | Rule | Source |
|---|---|---|
| Events | `@fires` is mandatory for every event. The drift test reads only JSDoc-described events | R4 §2.4, OQ3 (a) |
| Public members | The tests filter on `privacy`, `static` and `inheritedFrom` | R4 §2.3, OQ6 (a) |
| Form association | The tests read the inherited static `formAssociated` | R4 §2.6, OQ1 (a) |
| ARIA role and states | The descriptor holds them. The manifest carries none | R4 OQ2 (a); ARCH §17.3 |
| `schemaVersion` | Kept as the analyser emits it (`1.0.0`) | R4 OQ8 (a) |
| Per-item deprecation | Class- and member-level only | R4 OQ7 (a); §10 SD61 |

- No analyser plugin beyond `litPlugin()` is added (§10 SD61).
- The G5 coverage test still covers `line-components` only. `<line-a2ui-surface>` lives in `line-genui`, so the test does not cover it (ARCH §17.3).

### 7.4 axe tier

| Item | Rule | Source |
|---|---|---|
| CI runner | Playwright with `@axe-core/playwright` 4.14.0 inside "Browser tier" | §10 SD78; R8 §2.4 |
| Engines | Chromium, Firefox, WebKit | `playwright.config.ts:22-26` |
| Ruleset | `withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])` | §10 SD79; axe-core tag documentation (`doc/API.md`, "Axe-core Tags") |
| Pass condition | Zero violations, as a failing check | plan §7.1, §7.2 |
| Targets | Every story of every component; the `<line-a2ui-surface>` stories; the landing page | plan §7.1, §7.2; S1 |
| Author panel | `@storybook/addon-a11y` stays and gates nothing | §10 SD78; PRD §5.2 |

- axe's naming rules ignore roles set only through `ElementInternals`, and axe skips closed shadow roots (R8 §2.4).
- Zero violations do not prove that an accessible name exists for such roles (R8 §2.4).
- Each component whose role lives only in internals gets a screen-reader pass recorded in its component spec (§10 SD39).
- Button, IconButton, Chip and the AvatarGroup overflow control put `button` on an inner native element, so axe's naming rules apply (§10 SD31).

### 7.5 Bundle splitting and isolation checks

All checks run on the packed tarball from `stageAndPack` (`scripts/verify-pack.mjs:71`), extracted into a temp `node_modules` layout. Testing the tarball rather than `dist/` is decided here; R9 §6 Q4 leaves it open (§10 SD4).

| Check | Method | Fails when | Source |
|---|---|---|---|
| Registration harness | Fresh happy-dom realm per subpath; wrap `customElements.define`; import the subpath; record names | A subpath registers a set other than its §4.2 row; the root `"."` registers anything | §10 SD4; R9 §2.2 |
| Isolation scan | esbuild `--metafile` bundle per subpath; scan inputs and tag strings. Modules under `src/shared/`, emitted to `dist/shared/**` (§6.P.9), are shared code and may sit in any bundle (§12 AM-002; §12 AM-004, L3R2-08) | A bundle holds another component's module or tag | §10 SD4; R9 §2.2 |
| esbuild consumer bundle | One bare-import bundle of every subpath through esbuild | esbuild emits `ignored-bare-import` | §10 SD4; R9 §2.1 |
| `instanceof` harness | Consumer bundle importing `@websublime/line-core` and a subpath | The element is not `instanceof` the imported `LineElement` | §10 SD2; R9 §2.1; plan §7.4 |
| `line-genui` registration | Same harness on `./catalog` and `./a2ui` | `./catalog` defines any element; `./a2ui` defines anything but `line-a2ui-surface` | PRD §7.3; R9 §2.2; added by G4 |
| Undeclared bare specifiers | Parse `dist/**/*.js` imports of the three Vite packages | A bare specifier names no declared package | §10 SD2 (P5; §12 AM-020, L3R14-02) |

- No `sideEffects` field exists on `line-components` or `line-genui`, so no static `sideEffects` check is needed (§10 SD4; R9 §2.2 static-check row).
- The checks run inside `bun test` (§10 SD4).
- Vite and webpack give no drop signal, so the matrix keeps one esbuild bundle only (§10 SD4; R9 §2.2).

### 7.6 Size measurement

| Item | Rule | Source |
|---|---|---|
| Quantity | Component only, with Lit, `line-core` and Zag external | §10 SD21; R9 §2.4 |
| Tool | esbuild `--bundle --minify --format=esm --target=es2022`, then `gzip -9 -n` | §10 SD21; R9 §2.4 |
| Artifact | The packed tarball | §10 SD21 |
| Output | A per-component table printed by `scripts/report-size.mjs` in the CI log | plan §7.1 "measured and reported" |
| Gate | None; the < 5 KB target is monitored, not blocking | PRD §1.6–§1.7; §10 SD21 |
| `line-core/styles` | Each `createSheet()` call carries `/* @__PURE__ */` [INFERENCE: per-sheet shaking not probed; P5 acceptance measures it] | §10 SD20; R9 §2.1 |

- The Vite report's per-file gzip equals `gzip -9 -n` of that `dist` file (R9 §2.4). It leaves out shared chunks and differs from the esbuild component-only figure, so it is a sanity check, not an equality check.
- The report also prints the shared baseline (Lit, `line-core`, `line-core/styles`, Zag core and vanilla) once, so readers see the first-component cost (R9 §2.4 table).
- `scripts/report-size.mjs` arrives with P5, after C1. P5's first run reports every row merged before it, and later rows report through the "Size report" step (§6.P.5; §12 AM-020, L3R14-09).

### 7.7 CDN contract

The docs promise two paths and the manifests gain no CDN field (§10 SD32).

| Path | URL form | Consumer setup | Known cost | Source |
|---|---|---|---|---|
| jsDelivr `+esm` | `https://cdn.jsdelivr.net/npm/@websublime/line-components@<v>/<subpath>/+esm` | None | Two copies of `lit-html` and `@lit/reactive-element` are accepted; each URL inlines its own copy of `src/shared/icon-registry.ts` (jsDelivr issue #18337) [INFERENCE: not probed for `line-components`], and the copies share one registry and its `line-icon-registry-change` events through `globalThis[Symbol.for('line.icon-registry')]` (§12 AM-006, D-G; §12 AM-007, L2R4-03; §12 AM-008, L3R4-01; §12 AM-010, L3R5-03); the endpoint carries a beta notice | §10 SD32; R9 §2.3 (separate `+esm` bundles); jsDelivr issue #18337 |
| unpkg raw | `https://unpkg.com/@websublime/line-components@<v>/dist/<c>/index.js` | A documented import map and `globalThis.process = { env: { NODE_ENV: 'production' } }` before the first module | One Lit copy; 84 requests for `line-core`; cold Firefox CORS errors seen | §10 SD32; R9 §2.3 |

- The docs give full subpath URLs. A bare package URL returns 404 on both CDNs and is not promised (§10 SD32; R9 §2.3).
- The 14-entry import map R9 §2.3 lists is the `line-core` baseline. P6 adds the entries that `line-components` needs, such as `@websublime/line-core`, `@websublime/line-core/` and each `@zag-js/*` package a component imports, and the docs list the final map [INFERENCE: the extra entries follow from §4.2 dependencies] (§10 SD80).
- The `process` shim is needed because Zag 1.46.0 ESM reads `process.env.NODE_ENV` (R9 §2.3).
- A `+esm` page that loads a `line-core` version other than the one a `line-components` bundle was built against gets two `LineElement` classes [INFERENCE from R9 §2.3 version pinning]. The docs pin one version for every `@websublime/*` URL on a page.
- P6 verifies both paths (§10 SD32; plan §7.4).

### 7.8 Test conventions

| Tier | Runner | Covers | Source |
|---|---|---|---|
| Unit | `bun test` on happy-dom (`bunfig.toml` preload). happy-dom has no `attachInternals`, so the preload installs a fake one from `packages/line-core/__tests__/mocks/element-internals.ts` (§6.C.2; §12 AM-020, L3R14-01) | Rendering, props, events, slots, machine wiring | PRD §5.2; Phase 00 spec §6.F.3 (§12 AM-020, L2R14-02) |
| Browser | Playwright, three engines, `*.e2e.ts`; `*cdn.e2e.ts` files run only in `.github/workflows/cdn-check.yml` (§6.P.6) | Focus, keyboard navigation (§10 SD99), axe, layout, everything happy-dom cannot model | PRD §5.2; `playwright.config.ts:22-26` (§12 AM-005, L2R3-13; §12 AM-016, L3R10-04; §12 AM-031) |
| Visual | Playwright `toHaveScreenshot` in the `visual` project, Chromium only, `*.visual.ts` on `storybook-static`; baselines from `.github/workflows/visual-baselines.yml`; off pairs only in `.github/workflows/visual-off-pairs.yml` (§6.P.11, §6.P.12) | Unintended visual changes in every story of every component, and in `design-system-roles--toolbar` under every `(accent, gray, mode)` combination | PRD §5.2, §5.2.1; §10 SD98 (§12 AM-031, AM-033) |
| Packaging | `bun test` on the packed tarball | §7.5 checks | §10 SD4 |

- The browser tier is the source of truth where the two tiers disagree (plan §8 "happy-dom gaps" row, retrospective lesson 2; happy-dom limits in R7 §2.3).
- Tests exercise the built artifact wherever the claim is about what ships (retrospective lesson 5, cited in R9 §2.2).
- Component tests take no DOM snapshots. They assert parts, attributes, slots and events through queries (§10 SD81).
- A component spec MAY use a string snapshot with the built-in serializer after a helper normalises the HTML (§10 SD81).
- No custom snapshot serializer is added until a component spec shows the built-in one limiting (§10 SD81; Phase 00 spec §6.C.7 note).
- Lit's template marker is random per load, so raw shadow `innerHTML` is not a stable snapshot (`node_modules/.bun/lit-html@3.3.3/node_modules/lit-html/development/lit-html.js:103`) [INFERENCE: that the markers stay in rendered DOM].
- Tags in test files use the `line-` prefix (`scripts/lint-layers.mjs:308-350`).
- Tests resolve workspace packages by name (PRD §5.2; §6.Z.3; §12 AM-048):
  1. A test MUST reach another workspace package only through that package's name, declared in `dependencies`, `peerDependencies` or `devDependencies` of the test's own package. Bun's isolated install leaves an undeclared workspace package unresolved.
  2. A test MUST reach its own package's build output, the targets of its `exports` (`dist/`), through its own package name, a self-reference through `exports`. Resolving a wildcard export whose target does not exist returns the path in Node and in the Playwright loader, and throws in Bun 1.4.3 with a misleading "Cannot find package" message. A test that asserts a built file exists MUST check the resolved path on disk and MUST treat a throw as a missing file.
  3. A relative path MUST NOT reach into another package or into the package's own build output (`dist/`). A test MAY reach its own package's `src/` and `__tests__/` by a relative path, whether or not `files` ships them. An app's tests MAY reach the app's own sources, such as `apps/storybook/stories/`.
  4. Test helpers that more than one package uses MUST live in the private package `@websublime/line-testing` (§4.6), and each user MUST declare it as a devDependency.
  5. A test-only devDependency between design-system packages MUST point down the layer order (MANIFESTO Law 10). A test that needs a higher layer MUST live in that layer's package.
  6. A test MUST resolve a third-party package only through a manifest that declares it. Shared test tooling that every package uses, for example `playwright`, `@open-wc/testing-helpers` and `@happy-dom/global-registrator`, is declared in the root `devDependencies` (§6.G.2). A package MUST declare every third-party package that its own non-test code resolves. `line-testing` declares `htmx2` and `htmx4` in `dependencies` and `playwright` in `peerDependencies` (§4.6), and `line-core` declares `htmx2` and `htmx4` for its `__experimental__/htmx` spike.

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A2UI churn. `web_core` ships breaking minors (0.12.0 → 0.13.0 in 11 days; 0.14.0 `latest` since 2026-10-17 with 12 entries marked BREAKING; plan §8, R1 §2.1) | High | High | `line-genui` pins `@a2ui/web_core` exactly at `0.14.0`. A newer version lands only through an AM after the R1 and R2 probes run again (§4.1, §6.G.4; §10 SD6). The surface keeps preview status (ARCH §17.7) |
| Zod split. The repo and `web_core` declare `zod ^3.25.76`, while Zod `latest` is 4.6.7 (plan §8) | Medium | High | Descriptors stay on the Zod 3 API (§6.G.1; R3 §2.2). The docs import ext-apps from `./app-with-deps`, so no Zod 4 peer enters a Zod 3 app (§6.G.7; §10 SD69). `./app-with-deps` inlines one Zod 4 copy, so the bundle carries Zod 3 and Zod 4 (153,363 B gzipped with the catalog imports, root `zod@3.25.76`; R3 §2.3) |
| The TypeScript 7.x move breaks the toolchain (R11 blocker B1; required change RC1, TS2882) | Medium | High | P8 emits declarations with 7.x `tsc --emitDeclarationOnly` and adds ambient CSS module lines (§6.P.8, §7.1; §10 SD7) |
| `line-components` inlines `line-core`, so consumers get two `LineElement` classes (R9 §2.1) | High | High | P9 derives `external` from each manifest before C1. The `instanceof` harness and the identity test run on the packed tarball (§6.P.5, §7.5; §10 SD2; §12 AM-020, L3R14-02) |
| The icon origin is unavailable or blocked by CSP. The resolvers fetch each SVG, unpkg answers some calls with 500 and its 404 lacks CORS, and `connect-src` must list the origin (R10 round 2 §2.4, §2.6, §2.7) | Medium | Medium | `base` is required, so no third-party request happens unless the consumer sets it. The docs give a self-host recipe and the CSP note. Every failure leaves `<line-icon>` in the neutral C8 state (§6.C.3; §10 SD90, SD92) |
| Repeated `updateProps` calls slow each machine down. One `prop()` read grew from 0.013 ms to 0.397 ms over 4,000 calls (R7 §2.3 P4) | Medium | Medium | C21 ships the update-rate harness and records a budget, and each machine row records its own rate. C21 files the upstream Zag issue. The first row past the budget adds a `line-core` `VanillaMachine` subclass that replaces the props source only for components past the budget (§6.C.1; §10 SD18; §12 AM-020, L3R14-04) |
| Changesets bumps `line-genui` to a major when its peer `line-components` or `line-icons` moves to a new minor outside the declared range, or when the flag is unset (`@changesets/assemble-release-plan` 6.0.10 `src/determine-dependents.ts:266-269`) | Medium | High | P1 declares both peers as `workspace:^0.1.0 \|\| ^0.2.0`, and P3 sets `onlyUpdatePeerDependentsWhenOutOfRange` unconditionally. P3 proves `0.2.0` for all nine packages and a `0.2.0-` `line-genui` canary in dry runs before the first `line-genui` release. The first PR of each later phase that adds a `minor` changeset for either peer widens the peer ranges on `main` before `changeset version` builds that phase's Version PR. No script fails on a miss, so Miguel, who merges the Version PR, checks the `line-genui` version (§4.1, §6.P.3, §7.2; §10 SD76; §12 AM-028, AM-030, AM-032) |
| Shipped manifest module paths point at files the tarball lacks (R4 OQ5) | Medium | Medium | `files` ships `src`. C1 checks the `line-components` module paths, and G4 the `line-genui` one, on the packed tarballs (§6.C.6, §6.G.4, §7.3; §12 AM-032, L3R23-03) |
| Anthropic strict mode caps each request at 20 strict tools, 24 optional params and 16 union-typed params across all strict schemas (R3 §2.6) | Medium | Medium | Acceptance holds per tool. The docs state the per-request caps, and a live provider call before each release is recorded in the release PR (§6.G.3; §10 SD49) |
| Catalog quality becomes the agent UX (plan §8) | High | Medium | Descriptions reach the catalog through `spec(…, {mixins})` and the `REF:` helper (§6.G.1; §10 SD41). Each component spec reviews its descriptor |
| Accessibility of agent-built trees is under-specified upstream (plan §8) | Medium | High | The surface checks required names before render, keeps one live region and follows the D4 focus rule. P7 runs the axe tier on the surface stories (§6.G.4, §7.4; §10 SD36, SD82) |
| axe's naming rules ignore roles set only through `ElementInternals` (R8 §2.4) | Medium | High | Interactive roles sit on inner native elements. Internals-only roles get a screen-reader pass in their component spec (§7.4; §10 SD31, SD39) |
| Template-list reorders may rebind a kept element to another item, because `instanceId` is unstable until a2ui#1745 (R2 §2.8) [INFERENCE: not stated in R2] (§12 AM-005, L2R3-07) | Medium | Medium | The docs state the limit, and a2ui#1745 is the revisit trigger (§6.G.4; §10 SD60) |
| Prompt injection through action labels (plan §8) | Medium | High | Agent strings stay untrusted and render as plain text. Markdown renders only through a consumer hook. The URL policy applies after base resolution and rejects `data:` (§6.G.4; §10 SD57, SD58) |
| Hostile or runaway agents exhaust the surface (ARCH §17.4) | Medium | High | Finite limits on node count, depth and data-model size. A breach rejects the message. The G4 stress test sets the values through an AM (§6.G.4; §10 SD56) |
| Scope creep toward a chat platform (plan §8) | Medium | Medium | Hold the §2 Non-Goals list. Headless chat primitives stay a product decision |
| happy-dom gaps hide browser bugs (plan §8) | High | Medium | The browser tier is the source of truth (§7.8) |
| Bugs show only in built output (plan §8) | Medium | High | Packaging checks run on the packed tarball, and the shipped manifest feeds the tests (§7.3, §7.5) |
| Eager imports in the catalog or surface regress Law 6 (plan §8) | Medium | High | Lazy `load()` per descriptor; the `line-genui` registration harness (§7.5); the "defines no element" criterion (§9.2) |
| The catalog schema weight grows per descriptor (plan §8; R3 §2.7) | Medium | Medium | CI prints bytes and o200k tokens per tool, report only (§6.G.3; §10 SD50) |
| CDN delivery breaks on one of the two promised paths (R9 §2.3) | Medium | Medium | P6 checks jsDelivr `+esm` and unpkg raw files before each release. The docs pin one version for every `@websublime/*` URL on a page (§6.P.6, §7.7; §10 SD32) |
| A2UI v1.0 goes final mid-phase (plan §8) | Low | Medium | The v1.0 emitter stays out of scope (§2). The surface keeps preview status |
| O4.a install scripts in `deploy-site.yml` (plan §8) | Medium | High | Ledger row `00-Z28` |
| O4.b Biome flag workaround (plan §8) | Low | Low | Ledger row `00-Z29`, blocked until the Biome release |
| O4.c stale Bun version in the Phase 00 spec (plan §8) | Low | Low | Ledger row `00-Z30` |

---

## 9. Acceptance Criteria

Phase 1 is complete when every item below holds. The list mirrors plan §7.1–§7.4 item by item. The 17 PRD §7.3 criteria keep their wording, and the plan's additions are in *italics*.

### 9.1 Components

- [ ] All listed components pass the 8-point test checklist (PRD §5.2)
  - Tasks: C1–C20 (§6.C.6).
  - Check: the "Unit tier" `bun test` and "Browser tier" `bun run e2e` steps in `.github/workflows/checks.yml` pass.
- [ ] Storybook documentation complete for every component
  - Tasks: C1–C20, P10.
  - Check: the Storybook build passes, and each component's autodocs page shows its attributes, slots, events and CSS parts from the shipped manifest (§6.P.10, §6.C.6).
- [ ] Zero axe-core violations
  - Tasks: P7, C1–C20.
  - Check: `packages/line-components/__tests__/a11y/<c>.e2e.ts` passes in three engines with the §7.4 ruleset.
- [ ] *Every story of every component, and the `Design System/Roles` `Toolbar` story under every `(accent, gray, mode)` combination, has a committed Chromium baseline, and the visual tier passes (PRD §5.2, §5.2.1).*
  - Tasks: P11, P12, C1–C20.
  - Check: the "Browser tier" step runs `packages/line-components/__tests__/visual/<c>.visual.ts` and `roles.visual.ts` in the `visual` project, each story and combination has a committed `-visual-linux.png` baseline from `visual-baselines.yml`, and the release PR records a passing `visual-off-pairs.yml` run (§6.P.11, §6.P.12; §10 SD98).
- [ ] CEM manifest generated and verified
  - Tasks: P10, G5.
  - Check: `bun run scripts/verify-pack.mjs` fails without `custom-elements.json` in the `line-components` tarball; the G5 drift and coverage tests pass.
- [ ] *Storybook loads the manifest through `setCustomElementsManifest`, and `@websublime/line-components` and `@websublime/line-genui` each ship one with a `customElements` field and a `files` entry (D8; §10 SD94).*
  - Tasks: P10, G4.
  - Check: `apps/storybook/.storybook/preview.ts` calls `setCustomElementsManifest` with the manifest merged from both packages; `verify-pack` check (a) covers the `customElements` field of both packages (§4.1, §4.2).
- [ ] Changeset entry for every component
  - Tasks: C1–C20.
  - Check: each component PR adds a `.changeset/*.md` entry (§6.C.6).
- [ ] *Every Phase 1 component spec is APPROVED before code, with the Agent contract section filled (hand-off item 4).*
  - Tasks: C1–C20, step 1 of the §6.C.0 sequence.
  - Check: each `docs/specs/NNNN-<component>.md` reads `**Status:** APPROVED` before its implementation PR opens.
- [ ] *Every component fills the htmx Tests row per C9 (harness run, or `n/a` with a reason).*
  - Tasks: C1–C20 (§6.C.4 htmx column).
  - Check: the component spec Tests row; the harness `@websublime/line-testing/htmx` (`packages/line-testing/src/htmx.ts`, §6.Z.3) where it applies.
- [ ] *Every component fills its row in `docs/COMPETITIVE-COMPONENT-ANALYSIS.md`.*
  - Tasks: C1–C20 (§6.C.6).
  - Check: the row exists for each of the 20 components.
- [ ] *Each component's gzipped size is measured and reported against the < 5 KB soft target (not gating, PRD §1.7).*
  - Tasks: P5, C1–C20.
  - Check: `scripts/report-size.mjs` prints the per-component table in the CI log (§7.6).

### 9.2 Agent-driven UI

- [ ] Every Phase 1 component in `@websublime/line-components` has an agent descriptor (exposed, or flagged `agentExposed: false` with a reason), and the CEM drift and coverage tests pass
  - Tasks: G1, G5, C5–C20.
  - Check: the G5 tests in `packages/line-genui` pass in the unit tier (§6.G.5).
- [ ] The inline form of `@websublime/line-genui/catalog.json` (the `line` catalog) validates against the A2UI v0.9.1 `client_capabilities.json#/$defs/Catalog`, `web_core` reads the catalog back with `Catalog.fromJson`, and the catalog's `validationSchema` compiles
  - Task: G2.
  - Check: the G2 tests listed in §6.G.2 Acceptance.
- [ ] The Phase 1 subset of the `basic` catalog is registered under the A2UI basic catalog id `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json`, and unmapped basic types render an inert placeholder and raise `line-a2ui-error`
  - Tasks: G2, G4, C10 (the `Image` `variant: "avatar"` route; §12 AM-021, L3R15-02).
  - Check: a message with the v0_9 basic id renders mapped types and raises `line-a2ui-error` for each unmapped type (§6.G.4); an `Image` with `variant: "avatar"` renders `<line-avatar>` (§6.C.4).
- [ ] The frontend-tool schemas validate as JSON Schema and use literal, flat parameters without the A2UI common types or dynamic bindings. The emitted tool definitions are accepted by OpenAI and Anthropic in strict mode and by Gemini, and every tool description stays at or under the self-imposed cap of 1024 characters
  - Task: G3.
  - Check: Ajv validation and the offline R3 P11 subset checks run in CI on every PR; the live provider calls are recorded in the release PR (§6.G.3).
- [ ] `@websublime/line-themes/hosts/mcp-apps.css` maps every MCP Apps standard host colour, font and border-radius variable on the reference list that the Phase 1 spec fixes, each to a line theme alias or token, and passes `lint-layers`
  - Task: G6.
  - Check: `bun run scripts/lint-layers.mjs` passes; the G6 browser test passes in three engines; the §6.G.6 key table is complete.
- [ ] `<line-a2ui-surface>` renders every agent-exposed Phase 1 component from A2UI messages with zero axe-core violations, and document `::part()` rules apply to the rendered elements
  - Tasks: G4 for C1–C4; C5–C20 for the rest; P7.
  - Check: the surface stories pass the §7.4 axe ruleset; the G4 acceptance tests in §6.G.4; each C5–C20 PR extends the surface render fixture (§6.C.6).
- [ ] Importing `@websublime/line-genui/catalog` defines no element; importing `@websublime/line-genui/a2ui` defines only `line-a2ui-surface`
  - Tasks: G1, G4 (on the P5 harness).
  - Check: the `line-genui` registration harness on the packed tarball (§7.5).

### 9.3 Documentation

- [ ] Storybook holds one recipe per transport (AG-UI, A2A, MCP, SSE)
  - Tasks: G7, D2.
  - Check: the four recipes render C1–C4 in the deployed Storybook; the Bun middleware comparison test passes (§6.G.7).
- [ ] The site landing page (hero, value proposition, features, Storybook link; PRD §5.3) is built with Phase 1 line://ui components and is live at `line-ui.websublime.com`
  - Task: S1.
  - Check: `apps/site/__tests__/landing.e2e.ts` asserts every `line-*` element is `:defined` in three engines; `deploy-site.yml` publishes the page (§6.S.1).

### 9.4 Platform and release

- [ ] Bundle splitting verified — families and independents work as documented
  - Task: P5.
  - Check: `packages/line-components/__tests__/bundle-splitting.test.ts` runs the §7.5 checks on the packed tarball.
- [ ] `scripts/lint-layers.mjs` carries the `line-genui` edges and passes
  - Task: P2.
  - Check: `ALLOWED_EDGES` equals the §3.3 block, and `bun run scripts/lint-layers.mjs` exits 0.
- [ ] The npm trusted publisher for `@websublime/line-genui` exists before its first release
  - Tasks: P4, P13.
  - Check: the package settings show two trusted publishers and token publishing disallowed (§6.P.4, §6.P.13).
- [ ] *CDN delivery through unpkg and jsDelivr is verified against the two-path contract of §10 SD32 (PRD §1.7).*
  - Tasks: P6, C22, D3.
  - Check: `packages/line-components/__tests__/cdn.e2e.ts` passes on both paths, and the release PR records both runs (§7.7). The C22 matrix tests `packages/line-icons/__tests__/consumer-matrix.e2e.ts` and `consumer-matrix.cdn.e2e.ts` render icons in three bundlers and on both CDN paths in three engines (§6.C.3).
- [ ] *The workspace builds, type-checks and emits declarations on TypeScript 7.x (O1). The Vite-built packages emit every `.d.ts` with 7.x `tsc --emitDeclarationOnly`, and the `tsc -b` packages with 7.x `tsc -b` (D1).*
  - Task: P8.
  - Check: `bun run build`, `bun --filter '@websublime/*' typecheck` and `verify-pack` exit 0; `tsc --version` prints 7.x (§6.P.8).
- [ ] *A consumer that imports `@websublime/line-core` and a `line-components` subpath gets one `LineElement` class (P9).*
  - Tasks: P9 (externals), P5 (checks; §12 AM-020, L3R14-02).
  - Check: `packages/line-components/__tests__/line-element-identity.test.ts` and the `instanceof` harness pass (§6.P.5, §7.5).
- [ ] *The Phase 1 spec records the utility-class decision (PRD §9.13).*
  - Check: §10 SD1.
- [ ] *Every package is released at `0.2.0` through `release.yml` with provenance, and `line-genui` gets its first release per the spec.*
  - Tasks: P3, P4, P13.
  - Check: the P3 dry run lists nine `0.2.0` versions; `npm view` shows `0.2.0` with provenance for all nine packages (§7.2).
- [ ] *A code of conduct is present before `v0.2.0` (PRD §10).*
  - Task: Z1.
  - Check: `CODE_OF_CONDUCT.md` exists on `main`, and the `README.md` link resolves.
- [ ] *Rows `00-Z28` and `00-Z30` are done, and row `00-Z29` is done or still blocked on the Biome release.*
  - Check: the ledger rows' status.
- [ ] *The exit sweep runs before the last rows land, its findings become ledger rows, and the Phase 1 retrospective is written with a hand-off to Phase 2 (retrospective lesson 9).*
  - Task: Z3.
  - Check: the retrospective file under `docs/retrospective/` exists with its hand-off section, which names the SD76 widening duty (§6.Z.2).

---

## 10. Design Decisions

Fork R1–R6 rows record Miguel's choice among options. Default R1–R4 rows record orchestrator defaults that Miguel confirmed when he chose "proceed as proposed" at the end of round 4. Default R5 and R6 rows record orchestrator defaults shown to Miguel with their rounds, to which he raised no objection. Drafting rows record choices the drafting made inside the decisions; Miguel approved them on 2026-10-20 after the draft. Decision rows record a choice Miguel made after approval, through the AM the row names. The Question column names the session id from the 00-Z46 decision record where one exists.

| ID | Question | Decision | Rejected | Evidence | Origin | Status |
|---|---|---|---|---|---|---|
| SD1 | Q13: Does line://ui ship utility classes (PRD §9.13)? | No. line://ui ships no utility classes | Ship a new set; rename the v0.7 set | PRD §9.13; plan §7.4 | Default R1 | Approved 2026-10-20 |
| SD2 | Q09: How do `@websublime/*` packages stay external (P9)? | Derive `external` from each manifest's `dependencies` and `peerDependencies`, by name or `name/…`; every bare specifier in `dist/` is declared | A `/^@websublime\//` regex; a per-package list | R9 §3 probe 6; ARCH §12; plan §7.4 | Default R1 | Approved 2026-10-20 |
| SD3 | Q14: What is the first `line-genui` version? | Seed `0.1.0`; a `minor` changeset yields `0.2.0`; `0.1.0` is never published; the canary-first effect on `latest` is accepted | Seed `0.0.0` to reach `0.1.0` | R9 §2.5, §2.6; PRD §7.1; plan §7.4 | Fork R1 | Approved 2026-10-20 |
| SD4 | Q08: What `sideEffects` value, chunk layout and isolation checks apply? | Remove the field; no component imports another (AvatarGroup by slot); default Rolldown chunks; registration harness, isolation scan and one esbuild consumer bundle on the packed tarball; AM to Phase 00 spec §4.7 | A `dist`+`src` glob; an explicit file list with a static check; `[]` with a named-import rule | R9 §2.1, §2.2; MANIFESTO Law 4, Law 6; ARCH §12 | Fork R1 | Approved 2026-10-20 |
| SD5 | Does `line-genui` carry `sideEffects`? | The field is omitted, extending §10 SD4, because `./a2ui` defines an element at module top | `sideEffects: false` | §10 SD4; R9 §2.1 | Drafting | Approved 2026-10-20 |
| SD6 | Q15: Which `@a2ui/web_core` version does `line-genui` pin? | Exactly `0.14.0`; a newer version only through an AM after the R1 and R2 probes run again | `0.13.0`; `latest` on the spec date as a range | R1 §2.1, §6 Q1; R2 §3; R3 §2.4; ARCH §17.7 | Fork R3 | Approved 2026-10-20 |
| SD7 | Q25: How does P8 wire TypeScript 7.x declarations (D1)? | Keep `declarationMap: true`; `build` runs `vite build && tsc -p tsconfig.json --noEmit false --emitDeclarationOnly`; `dev` adds `tsc --watch` [INFERENCE: `tsc --watch` with `--emitDeclarationOnly` not probed; R11 P-W ran `tsc -b --watch`], and the watch build sets `build.emptyOutDir: false` so the declarations survive rebuilds [INFERENCE: not probed] (AM-006); `verify-pack` and Typecheck verify; `--checkers` at its default | `declarationMap: false`; a `closeBundle` plugin; a pinned checker count or `--singleThreaded` | R11 §2.4, §2.8; plan §5.6 D1; Vite 8.3.4 `prepareOutDirPlugin` | Default R1 | Approved 2026-10-20 |
| SD8 | Does `line-genui` have a root export? | No `"."` export | A root barrel | PRD Appendix D | Drafting | Approved 2026-10-20 |
| SD9 | Are the `line-genui` peers optional? | `line-components` and `line-icons` are required peers, with no `peerDependenciesMeta` | Optional peers | PRD §6.1; ARCH §17.1 | Drafting | Approved 2026-10-20 |
| SD10 | Q17: Which machine drives the ButtonGroup toolbar, and what is its tier label? | A custom roving-focus `createMachine` on `@zag-js/core` 1.46.0, tier Custom, buttons found through `slotchange`; the component spec opens with a slotted roving-focus probe; revisit when `@zag-js/toolbar` ships stable and the repo moves to Zag 2 | `@zag-js/toolbar` 2.0.0-next; `@zag-js/toggle-group` roving focus | R7 §2.4 (`createMachine` API); R8 §6 Q6; plan §2.2, §5.6 D5 | Fork R2 | Approved 2026-10-20 |
| SD11 | Q18: Does Chip use `@zag-js/toggle` or a custom machine, and does it have a remove button? | Pre-built `@zag-js/toggle` 1.46.0, tier Pre-built, no remove button, not compound | A custom one-state machine; a sibling remove button | R7 §2.3, §2.4; R8 §2.2; plan §5.6 D6 | Fork R2 | Approved 2026-10-20 |
| SD12 | Q28: What entrypoints do the ten §12 family-rule components get? | Ten independents with one tag each; Kbd / Shortcut is one tag `line-kbd` at `./kbd` | Two tags under `./kbd`; two entrypoints; a Grid family | ARCH §12, §17.3; PRD §4.1; MANIFESTO Law 4 | Default R1 | Approved 2026-10-20 |
| SD13 | Does `line-components` declare `@zag-js/vanilla`? | No; components reach it through `@websublime/line-core/machine` | Declaring it | R7 §2.1; ARCH §8 | Drafting | Approved 2026-10-20 |
| SD14 | Q06: Does `<line-icon>` get a slot, and where does the A2UI name map live? | Attributes only (`name`, `library`, `src`, `weight`, boolean `mirror`), no slot; `weight` reaches the registry as `options.weight` (AM-004); `mirror` flips the glyph under `:dir(rtl)` in the component CSS (AM-006); the map is per-set data in the `line-icons` `./a2ui` subpath, owned by task G2 (AM-002), and `./a2ui` exports the helper `a2uiIconMap(set, { library })` (AM-006) | A default slot; the map in `line-genui`; the map in `line-components` `./icon` | R10 §6 Q1; ARCH §17.1; MANIFESTO Law 1 | Fork R2 | Approved 2026-10-20 |
| SD15 | Q49: What does the A2UI icon map hold? | No default set (the consumer registers one); each entry carries weight and the RTL mirror flag per name; the consumer passes `a2uiIconMap(set, { library })` to the surface property `iconMap`, and on the agent path the surface sets `<line-icon>` `library`, `name`, `weight` and `mirror` from the entry (AM-004, AM-006); `A2uiIconMap` is `Readonly<Record<A2uiIconName, A2uiIconEntry>>` keyed by A2UI name, with `library` copied into each entry, returned null-prototype and frozen, looked up with `Object.hasOwn`, and re-projected when `iconMap` changes (AM-008); `A2uiIconName` is the union of the 59 A2UI v0.9.1 `Icon.name` enum values, exported from `./a2ui` (AM-010); the three Lucide collisions are accepted and documented | Lucide or Phosphor as default; fill or drifted glyphs for the collisions; a fixed `iconSet` property whose value doubles as the `library` key (AM-006) | R10 §2.1, P2, §2.3, §2.5, §6 Q2, Q5, Q7; R1 §2.6; ARCH §11, §17.4 | Fork R2 | Approved 2026-10-20 |
| SD16 | Does the `line-themes` barrel import the MCP Apps bridge? | No; consumers import `./hosts/mcp-apps.css` on its own | Importing it from `src/index.css` | PRD Appendix D "Tiers" | Drafting | Approved 2026-10-20 |
| SD17 | Q30: How does `mcp-apps.css` handle `line-tokens` primitives? | A `body`-scoped `var(--host, inherit)` with no copied literals; Miguel approved the Law 10 reading that `line-themes` may name a token without copying its value; the bridge redeclares the composed `--line-focus-ring` on `body` by name (AM-004) | Copied literals; a second sheet in `line-tokens`; colour aliases only | R5 §2.4b; `packages/line-tokens/src/focus-ring.css:19`; MANIFESTO Law 10 | Fork R4 | Approved 2026-10-20 |
| SD18 | Q20: How does C21 bound the cost of repeated `updateProps` calls? | C21 ships the update-rate harness and sets a budget on a fixture machine; each machine row measures its component's rate; an upstream issue is filed; past the budget only, a `line-core` `VanillaMachine` subclass, added by the first row past the budget, replaces the props source (AM-020, AM-021) | Skip `updateProps` on shallow-equal props; wait for an upstream fix alone | R7 §2.3 P4, §6 OQ1; plan §5.6 D7 | Fork R1 | Approved 2026-10-20 |
| SD19 | Q31: How do components reach `ElementInternals`? | `LineElement` attaches internals for every component and keeps them in an ES `#private` field; subclasses reach them as `this[INTERNALS]`, a prototype accessor keyed by a plain `Symbol('line.internals')` that `line-core` exports from `src/internals.ts`; the description is neither `internals` nor `privateInternals`, so axe's WCCG lookup does not find it (AM-004); no public `internals` property; `FormAssociated` reuses it; no `globalThis` registration; a `line-core` task before C1 measures the per-element cost (AM-002) | A public-at-runtime `internals` property; an accessor on `FormAssociated` only; an opt-in controller; `globalThis` registration | R8 §2.4, §2.5, §6 Q2; ARCH §14.8 | Fork R1 | Approved 2026-10-20 |
| SD20 | Q43: Does `line-core/styles` tree-shake per sheet? | `/* @__PURE__ */` on each `createSheet()` call [INFERENCE: per-sheet shaking not probed; §6.P.5 acceptance measures it] | Leave as is; one subpath per sheet | R9 §2.1; Phase 00 spec §6.D.7 | Default R1 | Approved 2026-10-20 |
| SD21 | Q42: What does the < 5 KB soft target count? | The component alone with Lit, `line-core` and Zag external, measured with esbuild and `gzip -9 -n` on the packed tarball, reported per component, not gating | First-component cost; marginal cost over a baseline; size-limit with brotli | R9 §2.4, §6 Q6; PRD §1.6–§1.7 | Default R1 | Approved 2026-10-20 |
| SD22 | Where do the ambient CSS module declarations live? | `apps/storybook/types/line-css.d.ts`, included by `apps/storybook/tsconfig.json` | Another `.d.ts` path | R11 OQ2 (b) | Drafting | Approved 2026-10-20 |
| SD23 | Does P1 ship `line-genui` with empty modules? | P1 ships `./catalog` and `./a2ui` as zero-export modules; G2 adds the `./catalog.json` export key with its emitter | Shipping `./catalog.json` from P1 | Phase 00 spec §4.7 precedent; `scripts/verify-pack.mjs` check (a) | Drafting | Approved 2026-10-20 |
| SD24 | When does the `line-components` manifest baseline land, and what replaces the zero-export smoke step? | P9 removes `sideEffects` and declares `lit` and `@zag-js/core` before C1; P5 drops the Phase 00 zero-export smoke step through an AM to Phase 00 spec §9.1 | Landing the baseline with C1; keeping the smoke step | R9 §4; `.github/workflows/checks.yml:28-29`; Phase 00 spec §9.1 | Drafting | Approved 2026-10-20 |
| SD25 | When does the P6 CDN check run? | On `workflow_dispatch` and before each release, never on `pull_request`; `playwright.config.ts` ignores `**/*cdn.e2e.ts` unless `LINE_E2E_CDN` is set, and `.github/workflows/cdn-check.yml` sets it (AM-016) | Every PR | R9 §2.3 | Drafting | Approved 2026-10-20 |
| SD26 | Q22: Which manifest do the G5 tests read? | The `custom-elements.json` that the `line-components` build emits into the package; it also serves Storybook and consumers | `apps/storybook/customElements.json`; an in-memory manifest | R4 §2.3, §2.7; plan §5.6 D8 | Default R1 | Approved 2026-10-20 |
| SD27 | Where does the shipped manifest sit, and what goes away? | At the `line-components` root as `custom-elements.json` with a `./custom-elements.json` export; the root analyser config, the Storybook `analyze` script and the CI analyze step are removed; `verify-pack` check (a) gains `customElements` | A second root manifest for Storybook; a `dist/` location | §10 SD26; R4 §2.7, §2.8; plan §5.6 D8 | Drafting | Approved 2026-10-20 |
| SD28 | Where does the C21 update-rate benchmark live? | `packages/line-core/__tests__/`, as a harness on a fixture machine; the component rates are recorded in each machine row's PR (AM-020) | — | R7 §2.3 | Drafting | Approved 2026-10-20 |
| SD29 | R2 default: When does the controller start a machine? | In `hostConnected`, as today | After the first render | R7 §6 OQ7 | Default R2 | Approved 2026-10-20 |
| SD30 | R2 default: Which Zag major does Phase 1 use? | 1.x at `^1.46.0` until 2.0.0 ships stable | Zag 2.0.0-next | R7 §6 OQ8 | Default R2 | Approved 2026-10-20 |
| SD31 | Q45: Where does the role sit on interactive components? | An inner native `<button>` with host `aria-label` copied, for Button, IconButton, Chip and the AvatarGroup "+N" control | Host role through `ElementInternals` | R8 §2.2, §2.4, §6 Q1; ARCH §17.2 C5 | Fork R2 | Approved 2026-10-20 |
| SD32 | Q10: What CDN contract do the docs promise? | Two paths, no new manifest fields: jsDelivr `+esm` zero-config with two Lit copies accepted; unpkg raw files with a documented import map and a `process` shim; full subpath URLs; P6 verifies both | esm.unpkg.com; jsDelivr alone; `default`/`unpkg`/`jsdelivr` manifest fields | R9 §2.3; PRD §1.7 | Fork R1 | Approved 2026-10-20 |
| SD33 | Q05: What does the surface render for `svgPath` and for an unknown icon name? | `<line-icon>` gains a `path` property and draws `<svg viewBox="0 0 24 24"><path>` through `setAttribute('d')`; a name, literal or bound, absent from the surface `iconMap`, or any name while `iconMap` is unset, leaves the node in the C8 neutral state and raises `line-a2ui-error` (AM-006) | A placeholder for `svgPath`; a native `<svg>`; a fallback glyph | R10 §2.1; R1 §2.6, §2.7; ARCH §17.2 C1, C8; MANIFESTO Law 9 | Fork R3 | Approved 2026-10-20 |
| SD34 | What htmx outcome does the spec expect for the static rows? | `n/a` expected for the 14 static rows, confirmed or overturned by each component spec | Running the harness on every row | plan §2.4; ARCH §17.2 C9 | Drafting | Approved 2026-10-20 |
| SD35 | Q19: What do Button `pressed`, `loading` and `disabled` mean, and why is Chip not `Button[pressed]`? | The active press is `idle → active` (`data-active`, `:state(active)`); opt-in `pressed` is a toggle with `aria-pressed`; `loading` and `disabled` are props read by guards; a loading Button stays focusable with `aria-disabled`; the consumer supplies the loading text; Chip stays separate by role; ARCH §13.1 state list gets a text correction | `pressed` as active press only; `pressed` as toggle only; `loading`/`disabled` as finite states | R7 §2.4, §6 OQ4; R8 §2.2; ARCH §14.8 | Fork R2 | Approved 2026-10-20 |
| SD36 | Q16: How is the IconButton name checked, and is IconButton form-associated? | A descriptor-level required name; the surface rejects a nameless node to a placeholder with `line-a2ui-error` before render; the axe gate covers hand-written markup; `type="button"` only, not form-associated, ARCH §7 unchanged | A runtime dev warning; a DOM check after render alone; adding IconButton to ARCH §7 | R8 §2.4; R2 §2.8, §6 Q5; ARCH §13.1 | Fork R2 | Approved 2026-10-20 |
| SD37 | Q46–Q48: Presence tracking and unmount; AvatarGroup overflow; Alert and Spinner roles | Deferred to the component specs: Presence after the R7 §6 OQ2 three-engine probe (R7 §6 OQ2, OQ3); AvatarGroup (R7 §6 OQ5; R8 §6 Q10); Alert and Spinner (R8 §6 Q8, Q9). Avatar stays Static, as ARCH §13.2 and PRD §4.1 decide, which answers R7 §6 OQ6 (AM-002) | Deciding them in this spec | R7 §6 OQ2, OQ3, OQ5, OQ6; R8 §6 Q8–Q10; ARCH §13.2 | Default R2 | Approved 2026-10-20 |
| SD38 | Q11: Which components carry `agentExposed: false`? | Portal, Presence and Visually Hidden, each with a recorded reason | Portal and Presence only; none | R8 §2.2; R7 §2.2; ARCH §17.3, §17.9 | Fork R2 | Approved 2026-10-20 |
| SD39 | R2 default: How are roles set only through internals checked? | A screen-reader pass recorded in the component spec | No second check | R8 §2.4, §6 Q5 | Default R2 | Approved 2026-10-20 |
| SD40 | What do G6, G7 and G4 depend on beyond plan §6? | G6 on P1; G7 on G4 (AM-041: G7 also on G6); G4 on P5, whose harness gains the `line-genui` registration row | — | plan §6; §7.5 | Drafting | Approved 2026-10-20 |
| SD41 | Q54: How do descriptors attach descriptions? | Component descriptions through `spec(…, {mixins})`; property descriptions through a line helper that writes the `REF:` marker | Plain `.describe()`; the upstream helpers | R1 §2.4.3, §6 Q6; R3 §2.4, §6 Q6 | Default R3 | Approved 2026-10-20 |
| SD42 | Q53: What does `catalog.json` hold, and what is the `line` catalog id? | The document form with `$defs/anyFunction` and `$defs/theme`; a documented function derives the inline projection; id `https://line-ui.websublime.com/a2ui/catalogs/line/v1/catalog.json`, an identifier that need not resolve; `v1` bumps on an incompatible change | The inline form as the file; `toJson()` as emitted | R2 §2.7, §6 Q7; ARCH §17.3 | Fork R3 | Approved 2026-10-20 |
| SD43 | Q01a: Which catalog ids does the `basic` implementation answer to? | Only the v0_9 id `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json`, always registered; the AG-UI recipe server sets `defaultCatalogId` to it | Also the `v0_9_1` id; also the middleware fallback `…/v0_9/basic_catalog.json`; recipes on the `line` id only | R1 §2.4.1, §2.6; R6 §2.1; ARCH §17.3 | Fork R3 | Approved 2026-10-20 |
| SD44 | Q01b: Does a session advertise `basic` by default? | Capabilities list the basic id only on consumer opt-in until basic coverage is complete | Advertise by default; advertise a trimmed inline basic catalog | R1 §2.6; R6 §2.2, §2.3; ARCH §17.3 | Fork R3 | Approved 2026-10-20 |
| SD45 | Q50: Which protocol versions are advertised, accepted and emitted? | Advertise `v0.9` and `v0.9.1`; accept both; emit `v0.9.1` | Advertise `v0.9.1` alone | R1 §2.5.1, P10, §6 Q8; R2 §2.6 | Default R3 | Approved 2026-10-20 |
| SD46 | Q03a: How does the frontend-tool emitter build flat parameters? | A line-owned walker over the Zod 3 descriptor schema, checked with Ajv and the R3 P11 subset checks | `zod-to-json-schema`; `Catalog.toJson()` plus a rewrite; native `z.toJSONSchema` (Zod 4) | R3 §2.1, §2.2, §2.5, §6 Q2 | Fork R3 | Approved 2026-10-20 |
| SD47 | Which props does the tool walker leave out? | `ComponentId`, `ChildList` and `Action` props | Emitting them as literals | R3 §6 Q4 [INFERENCE: R3 does not name these props] | Drafting | Approved 2026-10-20 |
| SD48 | Q04: How does the emitter reach Gemini? | One flat literal model per descriptor, serialised per provider through a provider argument; Gemini gets `parameters` with `nullable` | Gemini `parametersJsonSchema` with the strict schema | R3 §2.6 | Fork R3 | Approved 2026-10-20 |
| SD49 | Q51: How is provider acceptance proved, and what tool-name pattern applies? | Per tool; offline subset checks in CI on every PR; a live call to each provider before each release recorded in the release PR; Anthropic per-request caps documented; names match `^[a-zA-Z0-9_-]{1,64}$` | Offline checks alone; live calls in CI | R3 §2.6, §3 | Fork R3 | Approved 2026-10-20 |
| SD50 | Q03b: Does a tool definition get a token budget? | Report only: CI prints bytes and o200k tokens per tool | No budget; a gating budget | R3 §2.7 | Default R3 | Approved 2026-10-20 |
| SD51 | Q02a: One `processMessages` call per message or per batch? | One call per message; a bad message drops only itself; `aria-busy` covers the batch | One call per batch | R1 §2.7; R2 §2.6, §2.8; R6 §2.2 | Default R3 | Approved 2026-10-20 |
| SD52 | Q02b: Which `validationConfig` does the surface pass? | `RELAXED_VALIDATION` | None; `STRICT_VALIDATION`; custom with `allowUnknownElements: false` | R1 §2.7; R2 §2.0 | Default R3 | Approved 2026-10-20 |
| SD53 | Q02d: Where does the depth limit live? | A surface-side counter while it walks `NodeResolver` | `web_core` `maxDepth`, which is unreliable with `allowMissingRoot: true` because the walk starts at each id in sorted order | R2 §2.6, §6 Q6; R1 §2.7 | Default R3 | Approved 2026-10-20 |
| SD54 | Q02 (K1): How do a cycle and a pending child behave (contradiction K1)? | A cycle rejects its message; a pending child stays hidden, is replaced on arrival and raises no error; ARCH §17.4 Errors row and plan §2.1 corrected | Treating a pending child as a resolver error | R1 §2.5.2, §2.7; R2 §3 P9; `@a2ui/web_core` 0.14.0 `src/resolution/node-resolver.js` | Fork R3 | Approved 2026-10-20 |
| SD55 | Q02c: What payload does `line-a2ui-error` carry? | The generic A2UI form `{version, error: {code, surfaceId, message, …}}` with the `web_core` code; an error the surface raises itself carries its own code, `LIMIT_EXCEEDED`, `MARKDOWN_RENDER_ERROR`, `MISSING_ACCESSIBLE_NAME` or `UNMAPPED_ICON` (AM-040) | `VALIDATION_FAILED` with a computed JSON Pointer `path`; a hybrid of both | R2 §2.6; R1 §2.7, §6 Q9 | Fork R3 | Approved 2026-10-20 |
| SD56 | Q32a: What are the default limits for node count, depth and data-model size? | Finite defaults; a breach rejects the message with `line-a2ui-error`; the values come from a G4 stress test through an AM; the consumer overrides each limit through `max-nodes`, `max-depth` and `max-data-model-size` (AM-015) | `web_core` constants; unlimited unless configured | R1 §2.7, §4; ARCH §17.4; AM-015 | Default R3 | Approved 2026-10-20 |
| SD57 | Q32b: How does the URL policy apply? | After resolution against the document base, to Image, Video and Audio URLs and `openUrl`; `mailto:` and `tel:` apply to media URLs only, because `openUrl` accepts only `http:` and `https:`; `data:` rejected as line policy; the consumer adds a policy through `urlPolicy`, applied after the default, which can only reject (AM-032) | Allowing `data:` for images | R1 §2.6; R2 spike surface; ARCH §17.4 | Default R3 | Approved 2026-10-20 |
| SD58 | Q32c: What shape does the Markdown opt-in take? | A surface hook the consumer supplies, the property `markdownRenderer` (AM-032); the consumer owns sanitising | A line-shipped renderer; plain text only | R1 §2.3; R6 §2.1; ARCH §17.4 | Default R3 | Approved 2026-10-20 |
| SD59 | Q59: What surface rendering details apply? | Live region announces the `live-update-text` value (default "Content updated.") once per batch that changed the DOM and the `live-error-text` value (default "Some content could not be shown.") on error, both settable by the consumer; `role="list"` on `line-stack` for List, and `role="listitem"` on each item `line-stack`, or on a `<div role="listitem">` wrapper when the item is not a `line-stack`; Button text in a `<span>`; the AG-UI recipe never writes `aria-busy`, shows `building`/`retrying` in a recipe-owned status line outside the surface, sets the HTML `inert` attribute on the surface host for `failed`, and removes it on the next operations snapshot (§6.G.7) (AM-002, AM-004, AM-006, AM-013) | `<p>` for Button text | R2 §2.1, §2.8, §6 Q3, Q4, Q8; R6 §2.1, §4, §6 Q7 (a); `docs/research/assets/01-r2/spike/README.md:110, :116-117`; `docs/research/assets/01-r2/spike/src/surface-base.ts:7-8`; MANIFESTO Out of Scope | Default R3 | Approved 2026-10-20 |
| SD60 | Q52: How does the reconciler treat template-list reorders? | Document the limit; revisit trigger a2ui#1745 | Keying by `componentId` plus data path; waiting for #1745 | R2 §2.8, §6 Q1; ARCH §17.4 | Default R3 | Approved 2026-10-20 |
| SD61 | Q44: What content rules govern the manifest? | `@fires` mandatory; tests filter on `privacy`, `static` and `inheritedFrom`; inherited static `formAssociated`; ARIA in the descriptor; `schemaVersion` as emitted; no analyser plugin | An ARIA plugin; a `schemaVersion` 2.1.0 plugin; a member-stripping plugin | R4 §2.3, §2.4, §2.6, §6 OQ1–OQ3, OQ6–OQ8 | Default R1 | Approved 2026-10-20 |
| SD62 | Q12: Which host keys are on the `mcp-apps.css` reference list? | The role-matched subset under a written rule. It holds 2 font families, 4 weights, the role-matched colours, and the radii, sizes and line heights that the scale map matches (§10 SD63). Every excluded key is listed with its reason | All 76 keys; the 71 colour, font and radius keys | R5 §2.3, §2.5, §6 Q1, Q3 | Fork R4 | Approved 2026-10-20 |
| SD63 | Q58: How do host scales align, and where is the bridge declared? | Nearest reference value; unmatched host keys leave the list; no declarations in nested `data-accent`/`data-gray` scopes, which fall back to line steps; G6 tests both scopes in three engines | A positional map; new roles; declaring in nested scopes | R5 §6 Q3, Q4 | Fork R4 | Approved 2026-10-20 |
| SD64 | Q24: What do the recipes pin from `@ag-ui/a2ui-middleware`? | An in-browser mock producer in the deployed story; an MDX server convention pinned to exactly 0.0.13; a Bun test that compares the pinned middleware with the mock | The MDX convention alone; the mock alone | R6 §2.1, §6 Q1, Q2; npm registry (`latest` 0.0.13 on 2026-10-20) | Default R4 | Approved 2026-10-20 |
| SD65 | Q23a: What does the AG-UI recipe do with `line-a2ui-error`? | Log it locally and send nothing; the recipe names the gap; revisit when the middleware ships an error path | An app-defined `forwardedProps.a2uiError` key; wait for upstream | R6 §2.1, §6 Q3 (AM-020) | Fork R4 | Approved 2026-10-20 |
| SD66 | Q23b: What does the A2A recipe accept and target? | An array or a single message per DataPart; `application/json+a2ui` accepted beside `application/a2ui+json`; A2A v1.0 with `@a2a-js/sdk` 1.3.0; send `application/a2ui+json` with `[action]` (AM-041: also `[error]`) | Array only; A2A v0.3 | R6 §2.2; ARCH §17.5 | Default R4 | Approved 2026-10-20 |
| SD67 | Q57: What are the MCP and SSE recipe conventions? | MCP: tool-result `EmbeddedResource` only, capabilities in `_meta.a2ui`, SDK v2 in MDX only. SSE: a named `end` event, capabilities in the query string | `_meta.ui.resourceUri`; an `extensions` entry; a closing message; capabilities in a header or first POST | R6 §2.3, §2.4, §6 Q6, Q9; ARCH §17.5 | Default R4 | Approved 2026-10-20 |
| SD68 | Q56: How does line://ui load into an MCP Apps View? | `vite-plugin-singlefile` first; a CDN listed in `resourceDomains` as the alternative; server authors list font origins; ARCH §17.6 condition stated | One path only | R5 §2.2, §5.2, §6 Q6, Q7 | Default R4 | Approved 2026-10-20 |
| SD69 | Q55: Which ext-apps entry do the docs show? | ext-apps 2.x `./app-with-deps` | The main entry; 1.7.5; inline helper copies | R5 §2.1, §2.3, §6 Q5; ARCH §17.6 | Default R4 | Approved 2026-10-20 |
| SD70 | Where does the D1 guide live? | One MDX file under `apps/storybook/stories/` | — | Phase 00 spec §6.G | Drafting | Approved 2026-10-20 |
| SD71 | How does the browser tier serve the landing page? | A third Playwright `webServer` runs `astro preview` on `apps/site/dist` [INFERENCE: `astro preview` is not in R12]; the port is left to the implementer | A different static server on `apps/site/dist` | R12 §6 Q3 | Drafting | Approved 2026-10-20 |
| SD72 | Q40: How does the landing page load components and guard registration? | A processed `<script>import</script>` per section, no Astro or Lit integration; a Playwright guard asserts every `line-*` is `:defined` in three engines; hand-written `<link rel="modulepreload">` is left to the S1 implementer (§10 SD73) (AM-002) | One shared module; a build-time HTML check; review only | R12 §2.1, §2.2, §6 Q3, Q4; MANIFESTO Principle 5 | Default R1 | Approved 2026-10-20 |
| SD73 | Q41: Unupgraded state, theme CSS scope, stylesheet delivery and hand-written `<link rel="modulepreload">` on the site? | Left to the S1 implementer and recorded in the PR (AM-002) | Fixing them in the spec | R12 §2.4, §2.5, §6 Q1, Q2, Q4, Q5 | Default R1 | Approved 2026-10-20 |
| SD74 | Which code of conduct text and contact does Z1 use? | The Contributor Covenant, latest version; Miguel supplies the reporting contact in the Z1 PR | — | PRD §10; plan §7.4 | Drafting | Approved 2026-10-20 |
| SD75 | Do untouched packages get a changeset? | Every package gets a `minor` changeset so all nine reach `0.2.0` | Bumping only changed packages | plan §7.4 | Drafting | Approved 2026-10-20 |
| SD76 | What if Changesets bumps `line-genui` to a major through its peers? | `line-genui` declares `line-components` and `line-icons` as `workspace:^0.1.0 \|\| ^0.2.0` in `peerDependencies` and, at P1, `devDependencies`; P3 sets `onlyUpdatePeerDependentsWhenOutOfRange` in `.changeset/config.json` unconditionally; the first PR of each later phase that adds a `minor` changeset for either package widens the peer ranges on `main` before `changeset version` builds that phase's Version PR, for example `\|\| ^0.3.0` (AM-028, AM-030). The `^0.1.0` arm keeps `bun install` working before the Version PR: Bun 1.4.3 fails on `workspace:^0.2.0` while the workspace is at 0.1.0. The published range also admits the 0.1.x peers, which lack the Phase 1 subpaths, so it differs from `>=0.1.0` only for versions from 0.3.0 up, later minors and majors alike (AM-030, AM-032) | Accepting a major; the open lower bound `workspace:>=0.1.0`, which gives no npm warning on an incompatible version | R9 §2.6 method; orchestrator probe 2026-10-21 (`@changesets/cli` 2.31.1: `line-genui` 0.2.0 with the two-minor range and the flag; 1.0.0 with `workspace:^`, with or without the flag); lens probe 2026-10-21 (Bun 1.4.3 `bun install` on `workspace:^0.2.0`; AM-030); `@changesets/assemble-release-plan` 6.0.10 `src/determine-dependents.ts:266-269` | Drafting | Approved 2026-10-20 |
| SD77 | Which `@changesets/cli` major does Phase 1 use? | Stay on 2.x (2.31.1) | Move to 3.x | R9 §2.6 | Drafting | Approved 2026-10-20 |
| SD78 | Q21: Which runner makes zero axe violations a failing CI check? | Playwright with `@axe-core/playwright` 4.14.0 as the gate; `@storybook/addon-a11y` stays as the author panel | Storybook addon plus Vitest addon; Playwright with the addon removed | R8 §2.4; PRD §5.2 | Default R1 | Approved 2026-10-20 |
| SD79 | R2 default: Which axe ruleset does the gate run? | WCAG 2.0 and 2.1 A and AA tags | Other tag sets | R8 §2.4, §6 Q4 | Default R2 | Approved 2026-10-20 |
| SD80 | Which import map does the unpkg path document? | P6 extends the 14-entry `line-core` map with the `line-components` entries; the docs pin one version for every `@websublime/*` URL on a page | The `line-core` map alone | R9 §2.3 | Drafting | Approved 2026-10-20 |
| SD81 | Q27: Do component tests add a custom DOM snapshot serializer? | No DOM snapshots; tests assert parts, attributes, slots and events through queries; a normalised string snapshot with the built-in serializer is allowed | A custom serializer or `@open-wc/semantic-dom-diff`; Playwright screenshots as the default | Phase 00 spec §6.C.7, §11 Q2; PRD §5.2 | Default R1 | Approved 2026-10-20 |
| SD82 | Q32d: Where does the surface check required accessible names? | A descriptor check before render; a nameless node becomes a placeholder and raises `line-a2ui-error` | A DOM check after render; both | R2 §2.8, §6 Q5; ARCH §17.3 | Fork R2 | Approved 2026-10-20 |
| SD83 | How does the G6 key map break ties and settle borderline role calls? | The tie-break rule and the borderline calls B1–B11 in §6.G.6 | Mapping all 6 radii by order; the alternatives in the §6.G.6 "Borderline calls" table | R5 §2.3, §2.4b; `packages/line-themes/src/aliases.css`; `packages/line-tokens/src/` | Drafting | Approved 2026-10-20 |
| SD84 | Which reset modules do Chip and AvatarGroup take (ARCH §14.7)? | `common` and `button`, because each renders an inner native `<button>` (§10 SD31) | `common` only | ARCH §14.7; R8 §2.2, §6 Q1, Q7 | Drafting | Approved 2026-10-20 |
| SD85 | In which order do `mcp-apps.css` and the `line-themes` CSS load? | `mcp-apps.css` loads after the `line-themes` CSS; the docs state the order; a G6 browser test checks it | Leaving the order unstated | `packages/line-themes/src/aliases.css:6-7`; §6.G.6 | Drafting | Approved 2026-10-20 |
| SD86 | Which tasks must merge before each C1–C20 row? | The §6.C.4 Deps column. P7 and P11 land before C1 (AM-031); P12 follows P11 (AM-035) and lands before C1 (AM-036); C5 and C6 depend on C1; C11 depends on C10; C5–C20 depend on G1, G4 and G5 (AM-020); C12, C13 and C16 also depend on G3 (AM-023); every C1–C20 row depends on Z5 (AM-048) | Only the plan §6 dependencies | plan §6; ARCH §13.1; §10 SD4, SD10 | Drafting | Approved 2026-10-20 |
| SD87 | Which task owns the exit sweep and the Phase 1 retrospective? | Task Z3, owned by the main session, writes the retrospective and depends on every other Phase 1 row (AM-009). The main session runs the exit sweep before the last rows land; the sweep is not a row, and each finding becomes a new row, as in Phase 00 (AM-036) | The sweep as Z3's own work, with two dependency sets in one Deps field (AM-037) | plan §7.4, §10 step 7 | Drafting | Approved 2026-10-20 |
| SD88 | Q07: Decide the resolver loading mechanism now, or after more research? | R10 round 2 first (row 00-Z47); settled by SD89–SD92 | Decide now from the contract; decide now on fetch-by-URL | R10 §3 P6, §6 Q3 | Fork R1 | Approved 2026-10-20 |
| SD89 | Q07a: Which mechanism do the reference resolvers use? | Both the Lucide and Phosphor resolvers fetch the SVG from a base URL. It is the only probed mechanism that renders in Vite, esbuild and webpack builds and on the jsDelivr `+esm` and unpkg paths, for both sets and any name of the set. The entry is about 1 KB with no map, and each icon costs one request | Lucide literal `.mjs` map for the A2UI names plus fetch for Phosphor; full Lucide `.mjs` map plus fetch for Phosphor; template `import()` with consumer fixes; `?raw` map; `import.meta.glob` | R10 round 2 §2.2, §2.3, §2.6 | Fork R5 | Approved 2026-10-20 |
| SD90 | Q07b: Who owns the base URL? | `base` is a required option of `createLucideResolver` and `createPhosphorResolver`. Without it the resolver rejects and `<line-icon>` stays neutral. No third-party request happens unless the consumer sets `base`. The docs show a jsDelivr URL pinned to the peer version and a self-host recipe | A default jsDelivr base | R10 round 2 §2.4, §2.6, §2.7, §6 Q4 | Fork R5 | Approved 2026-10-20 |
| SD91 | Q07c: How does `<line-icon>` inject an SVG string? | `DOMParser` (`image/svg+xml`) plus an allowlist, behind a Trusted Types policy named `line-icon` created when `trustedTypes` exists. It covers resolver output and the `src` attribute. A non-SVG document leaves the neutral C8 state. SD95 sets the allowlist and the `SVGElement` rule; SD97 sets the policy guard | `innerHTML` with the policy and no filter; resolvers that return `SVGElement` | R10 round 2 §2.7, P13, P14 | Fork R5 | Approved 2026-10-20 |
| SD92 | Q07d: What does a miss resolve to? | An unknown name, a 404, a CORS or CSP block, or a missing `base` makes the resolver reject. `<line-icon>` catches it and renders the neutral C8 state, and nothing reaches the consumer (Law 9). On the agent path the surface raises `line-a2ui-error` only for a name absent from `iconMap`, or when `iconMap` is unset (§10 SD33); a resolver rejection raises no surface error (AM-006) | Resolving to an empty value | R10 round 2 §2.4, §6 Q6; ARCH §17.2 C8 | Default R5 | Approved 2026-10-20 |
| SD93 | Does the required `base` get a deprecation cycle? | No. `createLucideResolver()` and `createPhosphorResolver({ weight })` without `base` break in the C22 `minor`, recorded in its changeset (PRD §7.1 pre-1.0). Today's form renders no icon without consumer bundler configuration, and on neither CDN path | Keeping the old form deprecated for one minor | R10 round 2 §2.2, §2.6; PRD §7.1; `packages/line-icons/README.md:21-22` | Fork R6 | Approved 2026-10-20 |
| SD94 | Where does the Storybook API documentation of `<line-a2ui-surface>` come from? | `line-genui` ships its own Custom Elements Manifest, with a `customElements` field, a `files` entry and a `./custom-elements.json` export. G4 adds the analyser config, the build step and the surface JSDoc with `@fires` for `line-a2ui-action` and `line-a2ui-error`. Storybook loads one manifest merged from both packages by concatenating their `modules` arrays. `verify-pack` check (a) covers the `line-genui` target. G5 coverage stays on `line-components` | Hand-written MDX for the surface API | plan §5.6 D8; R4 §2.7, §2.8; ARCH §17.3 | Fork R6 | Approved 2026-10-20 |
| SD95 | Which elements and attributes pass the injection step, and what happens to an `SVGElement` result? | Strings (resolver output and `src`) pass a presentation allowlist of 9 elements (`svg`, `g`, `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`) and 36 attributes (the 23 measured plus 10 SVG 2 presentation attributes and `aria-hidden`, `role`, `focusable`). Only SVG-namespace elements pass; the root `xmlns` declaration is accepted, and every `xmlns:*` declaration is dropped (AM-004). `href`, `xlink:href`, `style`, `on*`, any value containing `url(`, and the elements `script`, `style`, `foreignObject`, `use`, `a`, `image`, `defs`, `clipPath`, `mask`, gradients and `pattern` never pass. An `SVGElement` from a consumer's resolver is inserted as is | The narrow Lucide/Phosphor list with `SVGElement` inserted directly; every result through the narrow list | R10 round 2 §2.7, P14, addendum A1; W3C SVG 2 presentation attributes; ARCH §11 | Fork R6 | Approved 2026-10-20 |
| SD96 | Where does the C22 matrix test live, when do its pages run, and what does it add to the root manifest? | `packages/line-icons/__tests__/consumer-matrix.e2e.ts` for the bundler pages and `consumer-matrix.cdn.e2e.ts` for the CDN-base pages (AM-016). The bundler pages run in the Browser tier on a self-hosted base. The CDN-base pages run with P6 on `workflow_dispatch` and before each release, through the same gate (as SD25). Root `devDependencies` gain `webpack ^5.112.0` | Another path; running the CDN pages on every PR | R10 round 2 §2.1, §2.2; §10 SD25 | Drafting | Approved 2026-10-20 |
| SD97 | What happens when the `line-icon` Trusted Types policy cannot be created? | `<line-icon>` creates the policy lazily, on the first SVG string it injects, once per realm behind a guard, never at module load, so `define()` always runs. If `createPolicy` throws, because the page's `trusted-types` list omits `line-icon` or a second module copy already created it, `<line-icon>` renders the neutral C8 state and nothing reaches the consumer as an error (AM-002) | Letting the `TypeError` propagate; creating the policy at module load | R10 round 2 §2.7, P13; MANIFESTO Law 6, Law 9; ARCH §12, §17.2 C8 | Default R6 | Approved 2026-10-20 |
| SD98 | Does Phase 1 run visual regression, and how? | Yes. P11 adds Playwright `toHaveScreenshot` over the Storybook stories on `storybook-static`, in a `visual` project that runs Chromium only inside the "Browser tier" step. Baselines are generated on the CI Linux runner by the `workflow_dispatch` workflow `visual-baselines.yml`, which uploads them as an artifact that the PR author commits. Each C1–C20 row adds its stories' screenshots (AM-031). PRD §5.2.1 coverage: P12 baselines the `Design System/Roles` story `Toolbar` under every `(accent, gray, mode)` combination through the `accent` and `gray` globals and the `mode` arg; the default pairs (each accent with its auto-pair gray, light and dark) run on every PR and gate the merge; the off pairs run in the `workflow_dispatch` workflow `visual-off-pairs.yml` before each release, do not gate a PR, and the release PR records the run (AM-033). P11 adds the project, `story.ts`, both workflows and the `.gitignore` lines; P12 adds the Roles visual files and their baselines, because PROCESS §6 binds one PR per row (AM-035), and blocks C1, so the default pairs gate every PR from C1 on (AM-036) | Deferring visual regression to Phase 2; three engines; every combination on every PR; deferring §5.2.1 (AM-033) | PRD §5.2, §5.2.1; Phase 00 spec D3 (`docs/specs/00-spec-design-system.md:2636-2642`); `playwright` 1.64.0; `apps/storybook/.storybook/preview.ts:19-29`; `apps/storybook/stories/design-system/roles.stories.ts:63-66, :89-101` | Decision, Miguel 2026-10-21 (AM-031, AM-033) | Approved 2026-10-21 |
| SD99 | Which tier tests keyboard navigation? | The Playwright Browser tier in Chromium, Firefox and WebKit (§7.8). `storybook/test` play functions stay in stories as documentation of user flows; PRD §5.2 says so from v0.8.25 (AM-031) | Play functions run by the Storybook test-runner | PRD §5.2; `playwright.config.ts:22-26` | Decision, Miguel 2026-10-21 (AM-031) | Approved 2026-10-21 |

---

## 11. Open Questions

None.

---

## 12. Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
| AM-001 | 2026-10-20 | ledger 00-Z48 (factual correction, coherence review round 1) | Factual edits, no design change. L1-14/L2-01/L3-10: §10 intro drops ", except SD96, which is pending". L2-03: §6.G.2 says `toJson()` lacks `$defs/anyFunction` and `$defs/theme`, so the published schemas do not compile, and only the inline projection is checked against the `Catalog` def. L2-06: §7.4 and §8 say axe's naming rules ignore internals-only roles and axe skips closed shadow roots. L2-07: §7.1 says Astro and MDX editor tools lose the TypeScript API until they support 7.x. L2-09: §8 cites R11 blocker B1 and required change RC1 (TS2882). L2-10: locators fixed in §4.3 (R10 §2.4), §6.P.5 (R9 §3 probe 4), SD2 (R9 §3 probe 6), §7.8 (R7 §2.3) and SD46 (R3 §6 Q2). L2-11: SD10 Evidence and §6.C.5 cite R7 §2.4, R8 §6 Q6 and plan §2.2. L2-12: `[INFERENCE]` on the 0.5 KB size (§6.C.3), on `loading` in probe B1 (§6.C.5), on path A needing neither (§6.P.4), on `0.2.0-<sha>-SNAPSHOT` (§6.P.4, §7.2), and in SD47 and SD76; "stays focusable" cites R7 §2.4; the `withTags` strings cite the axe-core tag docs. L2-13: §6.G.7 says the middleware does not run fully in a browser. L2-14: §8 notes `./app-with-deps` still inlines Zod 4. L2-15: §6.G.4 and SD53 say `maxDepth` is unreliable with `allowMissingRoot: true`. L3-13: §6.C.5 says ARCH v0.8.5 §13.1 carries the corrected state list. L1-07: the §9.1 D8 criterion covers the `line-components` and `line-genui` manifests (tasks P10, G4). R10 round 2 addendum A1: the §6.C.3 `xmlns` rules first recorded here are design, so they moved to AM-004 (L2R2-05) | The round-1 coherence review found these statements misread their sources or left a fact unsourced | agent R1LensPlanPRD (L1-07, L1-14); agent R1LensSpecResearch (L2-01, L2-03, L2-06, L2-07, L2-09 to L2-15); agent R1LensSpecArch (L3-10, L3-13); R2 §2.6, §2.7; R3 §2.3; R6 §2.1; R7 §2.3, §2.4; R8 §2.4, §6 Q6; R9 §3; R10 §2.4; R10 round 2 addendum A1; R11 §2.9; PRD §6.3 |
| AM-002 | 2026-10-20 | ledger 00-Z48 (decision — Miguel chose the Law 5 reading that scopes Law 5 to `line-components` components over amending Law 5 and over building the surface on Lit; a structural registry interface with a static `LineIcon.registry` hook over a `line-components → line-icons` edge; the shared Button machine in `line-components` `src/shared/` over the machine in `line-core`; a `#private` internals field with an exported Symbol accessor over a public-at-runtime `internals` property; the ledger PR aligning PROCESS §4 and `CLAUDE.md` over task Z2; plus orchestrator defaults L3-05, L3-08, L3-09, L3-12, L2-02, L3-07, L2-04 and L2-08) | D-L3-01: §6.G.4 and SD17 record the Law 5 reading for the `<line-a2ui-surface>` reconciler. D-L3-02: §6.C.3 adds the registry hook (`resolve(library, name)`, static `LineIcon.registry`, satisfied by the `line-icons` `IconRegistry`, no layer edge), the C2 row states it, and G4 Changes set it on the agent path. D-L3-06: §4.2, §5, §6.C.4, §6.C.5 and the §7.5 isolation scan name `src/shared/button-machine.ts` as shared code. D-L2-05: §4.5, §6.C.2 and SD19 keep internals in a `#private` field reached through `INTERNALS`, a plain Symbol exported from `line-core`. D-L1-06: task Z2 leaves §6.Z, §5 and §9; §6.Z states that the ledger PR aligns PROCESS §4 and the `CLAUDE.md` pointer, and Z3's section becomes §6.Z.2. L3-05: §6.C.3 and SD97 create the Trusted Types policy lazily. L3-08: the C10 row and SD37 hold Avatar Static. L3-09: G2 owns `src/a2ui/` and `./a2ui` (§5, §6.C.3, §6.G.2, SD14); C22 Changes add `src/registry.ts` and three export keys. L3-12: §6.C.4 gives Presence the `common` reset only. L2-02: §6.G.4 and SD59 require `role="listitem"` on each List item; the C3 cell narrows. L3-07: the C8 cell uses `line-change`/`line-input` per C3 and C9. L2-04: §6.G.6 cites R5 addendum A1 and the §6.C.3 allowlist cites R10 round 2 addendum A1. L2-08: SD73 adds hand-written `modulepreload`; SD72 Evidence adds R12 §6 Q4 | The round-1 coherence review raised five design forks and eight gaps that the approved spec left open or settled against a higher document | agent R1LensSpecArch (L3-01, L3-02, L3-05 to L3-09, L3-12); agent R1LensSpecResearch (L2-02, L2-04, L2-05, L2-08); agent R1LensPlanPRD (L1-06); Miguel's decisions of 2026-10-20; MANIFESTO Law 4, Law 5, Law 6, Law 9; ARCH §11, §12, §13.1, §13.2, §14.7, §17.2; R2 §2.1; R5 addendum A1; R8 §2.4; R10 round 2 addendum A1; R12 §6 Q4 |
| AM-003 | 2026-10-20 | ledger 00-Z48 (factual correction, coherence review round 2) | Factual edits, no design change. L2R2-03: §8 says `./app-with-deps` inlines one Zod 4 copy beside Zod 3 (153,363 B gzipped, root `zod@3.25.76`). L2R2-04: §7.6 makes the Vite report a sanity check equal to `gzip -9 -n` of the `dist` file, not to the esbuild figure. L2R2-07: §6.G.4 and SD59 define the List wrapper (`<div role="listitem">` when the item is not a `line-stack`), cite R2 §2.1 and §6 Q4, and G4 acceptance adds a mixed-List axe check. L2R2-08: §6.G.2 cites plan §5.6 D2 and SD42, states `$defs/anyFunction: false` and an open `$defs/theme`, and acceptance adds the Ajv 2020 compile. L2R2-10: the §6.G.6 exclusion counts move `--color-ring-secondary` to "target already taken" (16 and 2). L2R2-11: §6.C.5 cites R7 §2.4 and R8 §2.2 with `[INFERENCE]` for `aria-disabled`. L2R2-12: `[INFERENCE]` on `@__PURE__` per-sheet shaking (§7.6, SD20), `tsc --watch` with `--emitDeclarationOnly` (SD7), the `../line-core` glob (§6.P.10), `astro preview` (§6.S.1, SD71), template-list rebinding (§6.G.4), the C9 count announcement and the C13 reconciliation note (§6.C.4), and MIME errors (§6.P.6); §6.P.5 acceptance adds the `commonReset` < 1161 B check; SD71's alternative becomes a different static server. L2R2-13: locators fixed in SD69 (R5 §2.3), §6.P.3 (`discoverPublishable()` at `scripts/publish.mjs:178`, which lists `packages/*` at `scripts/verify-pack.mjs:33-48`; corrected by AM-005, L2R3-06), §7.5 intro (tarball decided; R9 §6 Q4 open), §6.S.1 (plan §4.5; R12 §3.2), §6.G.2 (R1 §5 item 5; R6 §2.2), §6.G.4 (R2 §3 P9; SD82). L2R2-14: §6.G.7 says the middleware fallback id differs from the one `web_core` 0.13.0 uses and lists the mock fields `activityType`, `replace: true` and `messageId`; §6.G.4 uses "the codes `web_core` 0.14.0 raises" and "once per batch that changed the DOM". L3R2-07: the C8 cell limits `line-input` to live edits. L3R2-11, R2-L1-08: the header cites PRD v0.8.21 and ARCH v0.8.7, approved against v0.8.19 and v0.8.5, and the Status line names AM-001–AM-004. R2-L1-06: §9.4 cites the two-path contract of SD32. R2-L1-07: plan locators in SD87, §6.Z.2 and §7.8 become section locators | The round-2 coherence review found these statements misread their sources, left an inference unmarked or pointed at the wrong line | agent R2LensPlanPRD (R2-L1-06 to R2-L1-08); agent R2LensSpecResearch (L2R2-03, L2R2-04, L2R2-07, L2R2-08, L2R2-10 to L2R2-14); agent R2LensSpecArch (L3R2-07, L3R2-11); R1 §2.1, §2.7, §5; R2 §2.1, §2.7, §3, §6 Q4; R3 §2.3; R5 §2.3; R6 §2.1, §2.2; R7 §2.4; R8 §2.2; R9 §2.3, §2.4, §6 Q4; R11 §2.4; R12 §3.2; plan §4.5, §5.6 D2, §7.4, §10 |
| AM-004 | 2026-10-20 | ledger 00-Z48 (decision — Miguel chose a registry `resolve(library, name, options?)` with a `<line-icon>` `weight` attribute over one consumer-registered library per weight (D-W); a single consumer writer through `setIconRegistry()` in a shared `line-components` module over the surface also writing the registry through an `iconRegistry` property (D-R); plus orchestrator defaults L2R2-01, L2R2-05, L3R2-10, L3R2-02, L3R2-01/L2R2-06, L3R2-05, L3R2-08, L2R2-09, L3R2-06 and L3R2-09) | D-W: §6.C.3 types the registry `resolve(library, name, options?)` with `options.weight`, `<line-icon>` gains `weight`, the C2 row, SD14 and SD15 state it, §6.G.4 sets `weight` from the `line-icons/a2ui` map entry, and C2 and G4 acceptance add `fill`-weight cases. D-R: §4.2, §5, §6.C.3 and the C2 row put the registry in `src/shared/icon-registry.ts`, set once by the consumer through `setIconRegistry()` or `LineIcon.registry`, with `setIconRegistry` and `LineIconRegistry` exported from the root `"."`; `line-genui` never writes it, and G4 Changes document the consumer line. This replaces AM-002's "G4 Changes set it on the agent path". L2R2-01: §6.G.6 redeclares `--line-focus-ring` on `body` by name, and the G6 browser test covers it. L2R2-05: the §6.C.3 `xmlns` rules move here from AM-001; SD95 names them; injection acceptance adds "`xmlns:xlink` removed, root `xmlns` kept". L3R2-10, L3R2-09: §6.G.4 scopes the reading to the "Lit owns DOM" clause, and the surface keeps no styles in TypeScript and no business logic in render; SD17 drops the Law 5 sentence. L3R2-02: `INTERNALS` lives in `packages/line-core/src/internals.ts`, which imports nothing (§6.C.2, §5). L3R2-01, L2R2-06: §6.C.2 and SD19 make the `line.internals` description and the prototype accessor what keeps axe out, and acceptance checks `_internals`, `internals`, `internals_` and both symbol descriptions. L3R2-05: an unset registry MUST leave the C8 state and MUST NOT throw, with an acceptance case. L3R2-08: P9 emits `src/shared/*` to `dist/shared/[name].js`, and the §7.5 isolation scan treats `dist/shared/**` as shared. L2R2-09: the lifecycle mapping moves from §6.G.4 to the §6.G.7 AG-UI recipe, and "inert" is the HTML `inert` attribute on the surface host. L3R2-06: the type is `LineIconRegistry`, exported from the root `"."` | The round-2 coherence review found the AM-002 registry dropped the per-name weight, left two writers on one global hook, and recorded design rules as facts or inferences | agent R2LensSpecResearch (L2R2-01, L2R2-02, L2R2-05, L2R2-06, L2R2-09, L2R2-15); agent R2LensSpecArch (L3R2-01 to L3R2-06, L3R2-08 to L3R2-10); Miguel's decisions of 2026-10-20; MANIFESTO Law 5, Law 9, Law 10; ARCH §11, §12, §14.8, §17.4; `packages/line-icons/src/index.ts:19`; `packages/line-tokens/src/focus-ring.css:19`; R6 §4, §6 Q7; R8 §2.4; R10 §2.3; R10 round 2 addendum A1; axe-core v4.14.0 `doc/element-internals.md` |
| AM-005 | 2026-10-20 | ledger 00-Z48 (factual correction, coherence review round 3) | Factual edits, no design change. L2R3-05: §6.G.4 cites R1 §2.5.2 only for "pending placeholder, no error" and R2 §3 P9 and the `web_core` 0.14.0 `node-resolver.js` source for the new node; SD54 cites R2 §3 P9. L2R3-06: §6.P.3 says `publish.mjs` calls `discoverPublishable()` (`publish.mjs:178`), which lists `packages/*` (`verify-pack.mjs:33-48`), and treats an E404 as new (`publish.mjs:115`); the AM-003 locator is corrected. L2R3-07: §8 says template-list reorders "may rebind" a kept element, with the §6.G.4 marker. L2R3-08: §6.P.5 checks that an esbuild bundle of `commonReset` from `@websublime/line-core/styles` holds one `createSheet` call and no CSS of the other ten sheets, and reports its size against R9's 1161 B. L2R3-09: §6.G.6 says one shipped rule reads, on `html`, a primitive the bridge sets. L2R3-10: §6.C.2 cites the axe-core 4.14.0 `_getElementInternals` source, and acceptance requires the three string properties absent own or inherited. L2R3-11: §6.G.4 and SD57 present the `data:` rejection as line policy without R5 §2.2, and limit `mailto:` and `tel:` to media URLs (R1 §2.6). L2R3-12: §6.P.9 puts an `output.chunkFileNames` function in `packages/line-components/vite.config.mjs`, and §4.2 cites ARCH §11 for `icon-registry.ts`. L2R3-13: §4.1 cites PRD §2 line 178 (locator corrected by AM-007, L2R4-06); §7.8 cites `playwright.config.ts:22-26`; the Presence reason "which the host owns" gets `[INFERENCE]`; §4.2 cites `biome.json:44-48` for `@zag-js/vanilla`; §5 adds the C21 and C23 `line-core` paths; §6.G.7 cites R6 §5.1 item 1 for the missing error channel. L3R3-07 is ARCH-only (§17.8), and R3-L1-01 to R3-L1-04 are plan-only; the spec mirrors (§6.C.0, SD86, §6.S.1) already match. The header cites PRD v0.8.22 and ARCH v0.8.8 and names AM-001–AM-006 | The round-3 coherence review found these statements misread their sources, left an inference unmarked or pointed at the wrong line | agent R3LensSpecResearch (L2R3-05 to L2R3-13); agent R3LensSpecArch (L3R3-07); agent R3LensPlanPRD (R3-L1-01 to R3-L1-04); R1 §2.5.2, §2.6; R2 §2.8, §3 P9; R5 §2.2; R6 §5.1; R9 §2.1, §2.5; `@a2ui/web_core` 0.14.0 `src/resolution/node-resolver.js`; axe-core 4.14.0 `axe.js`; `scripts/publish.mjs:115`, `:178`; `scripts/verify-pack.mjs:33-48`; `packages/line-core/src/styles/index.ts:30`; `packages/line-tokens/src/focus-ring.css:16`, `:19`; `playwright.config.ts:22-26`; `biome.json:44-48`; PRD §2; ARCH §11 |
| AM-006 | 2026-10-20 | ledger 00-Z48 (decision — Miguel chose a `line-icons/a2ui` helper `a2uiIconMap(set, { library })` whose result the consumer passes to a new `<line-a2ui-surface>` property `iconMap` over a fixed `iconSet` property whose value doubles as the `library` key (D-M); registry storage at `globalThis[Symbol.for('line.icon-registry')]` over module-local storage with a CDN-specific docs rule (D-G); plus orchestrator defaults L3R3-03, L3R3-04, L3R3-05, L3R3-06, L2R3-02, L2R3-03, L2R3-04 and the G4 consumer docs lines) | D-M: §6.C.3 adds the helper and the `iconMap` rule; §6.G.2 Changes add the helper in `line-icons/a2ui`; §6.G.4 Changes add the surface property, Basic mapping renders `<line-icon library name weight mirror>` from the entry for a literal or bound `Icon.name`, and an unset `iconMap` or an absent name leaves C8 and raises `line-a2ui-error`; G4 acceptance sets `iconMap` to the Phosphor set; §5, SD14, SD15 and SD33 state it. D-G: §6.C.3, §4.2 and the C2 row store the registry at the `globalThis` symbol key, the §7.7 `+esm` row states that the per-URL copies share it, and P6 acceptance checks a root `+esm` registry reaching `<line-icon>` from `icon/+esm`. L3R3-03: `<line-icon>` gains a boolean `mirror` attribute flipped by its own CSS under `:dir(rtl)`, set by the surface from the entry, with C2 and G4 RTL cases. L3R3-04: §6.C.3 Miss path, Basic mapping and SD92 raise `line-a2ui-error` only for a name absent from `iconMap` (or `iconMap` unset); a resolver rejection leaves C8 with no surface error. L3R3-05: `LineIconRegistry.resolve` types `options` as `{ weight?: string }`, with a TypeScript 7 type-level case. L3R3-06: setting the registry makes connected `<line-icon>` instances resolve again, with an acceptance case. L2R3-02: the `<line-icon>` acceptance items leave C22 for a C2 "Icon surface acceptance" block; C22 keeps the resolver-level items. L2R3-03: the §6.G.7 AG-UI recipe never writes `aria-busy`, shows `building`/`retrying` in a recipe-owned status line, sets `inert` on `failed` and removes it on the next operations snapshot; the mock adds `retrying` and `failed` fixtures; G7 acceptance and SD59 state it; the source line credits the `inert` attribute to AM-004. L2R3-04: §6.P.9 sets `build.emptyOutDir: false` in watch mode; §4.5 and SD7 carry the marker; §7.1 limits R11 P-T to `build` and cites the Vite 8.3.4 `prepareOutDirPlugin` source. G4 docs: §6.G.4 Changes show `setIconRegistry(registry)` and `surface.iconMap = a2uiIconMap(...)` | The round-3 coherence review found the surface had no input naming the icon set or the `library` key, no carrier for the mirror flag, a registry that separate `+esm` bundles would not share, a surface error with no signal, two writers of `aria-busy`, C2 acceptance under C22, and `dev` scripts that lose declarations | agent R3LensSpecResearch (L2R3-01 to L2R3-04); agent R3LensSpecArch (L3R3-01 to L3R3-06); Miguel's decisions of 2026-10-20; MANIFESTO Law 5, Law 9; ARCH §11, §17.4; R1 §2.6; R6 §2.1, §4, §6 Q7; R9 §2.3; R10 §2.3, §6 Q2, Q5; Vite 8.3.4 `node_modules/vite/dist/node/chunks/node.js`; `packages/line-icons/src/index.ts:3-6`, `:19`; jsDelivr issue #18337 |
| AM-007 | 2026-10-20 | ledger 00-Z48 (factual correction, coherence review round 4) | Factual edits, no design change. L2R4-03: §6.C.3, §7.7 and P6 acceptance credit the per-URL copy of `icon-registry.ts` to jsDelivr issue #18337 with "[INFERENCE: not probed for `line-components`]"; R9 §2.3 stays only for the separate `+esm` bundles. L2R4-04: the §6.G.7 source line credits R6 Q7 (a) only for showing the states and names the status line AM-006; the mock line marks `retrying` and `failed` as type-declaration fields with no observed snapshot after `failed`; the Bun comparison covers the observed `building` → operations sequence. L2R4-06: §4.1 cites PRD §2 line 178, and the AM-005 text is corrected. R4-L1-01: §6.S.1 gives infra-supervisor the `playwright.config.ts` change only (SD71). R4-L1-03: G6 Deps read "P1, C1–C4" in §6.G.0 and §6.G.6, and the §6.G.0 note cites PRD §7.3 and plan §6 step 6. R4-L1-04: P7 Deps read "Blocks C1 (§10 SD86; plan §6)". The header cites PRD v0.8.23 and ARCH v0.8.9 and names AM-001–AM-008 | The round-4 coherence review found a source credited for what it does not say, two unmarked inferences, a stale locator and three Deps or owner lines that disagreed with the plan | agent R4LensSpecResearch (L2R4-03, L2R4-04, L2R4-06); agent R4LensPlanPRD (R4-L1-01, R4-L1-03, R4-L1-04); jsDelivr issue #18337; R6 §2.1, §6 Q7; R9 §2.3; R12 §2.6; PRD §2, §7.3; plan §4.0, §6 |
| AM-008 | 2026-10-20 | ledger 00-Z48 (decision — orchestrator defaults completing Miguel's round-3 decisions D-M and D-G; for Miguel's review at the 00-Z48 PR: L3R4-01, L3R4-02/L2R4-01, L3R4-03/L3R4-05, L3R4-04, L3R4-06, L2R4-02, L2R4-05 and L2R4-07) | L3R4-01: the §6.C.3 global slot holds `{ registry, events }` with `events` an `EventTarget`, created by whichever module copy runs first; `setIconRegistry` and the `LineIcon.registry` setter write `registry` and dispatch `change`; every `<line-icon>` copy subscribes through the slot on connect, unsubscribes on disconnect and re-resolves on `change`; §4.2, the C2 row, C2 acceptance and §7.7 state it, and P6 acceptance adds the case where `<line-icon>` connects before `setIconRegistry` runs. L3R4-02/L2R4-01: P6 Deps name the first `0.2.0` canary that contains C1 and C2, and the registry page uses an inline stub `LineIconRegistry`, so P6 needs no `line-icons` canary or C22. L3R4-03/L3R4-05: `line-icons/a2ui` exports `A2uiIconEntry = { library; name; weight?; mirror }` and `A2uiIconMap = Readonly<Record<A2uiIconName, A2uiIconEntry>>` keyed by A2UI name; `a2uiIconMap` copies `library` into each entry and returns a null-prototype frozen object; `line-genui` imports the type with `import type` only; the surface looks names up with `Object.hasOwn`; §4.3, §6.C.3, §6.G.2, §6.G.4 and SD15 state it, and G4 acceptance adds a bound name `constructor` raising one `line-a2ui-error`. L3R4-04: setting or replacing `iconMap` re-projects every Icon node, with a G4 acceptance line. L3R4-06: §4.3 puts `@websublime/line-icons/a2ui` under the preview status of `line-genui/a2ui` until A2UI v1.0. L2R4-02: C2 adds the `line-icons` `devDependency` (not a layer edge, §3.2), `__tests__/registry.types.ts` and a `tsconfig.test.json` that `typecheck` runs; §4.2, §5, §6.C.3 and C2 acceptance list them, and the "resolver created without `base`" item builds its resolver from the devDependency. L2R4-05: P8 owns the `emptyOutDir` watch line; §4.5, §5 and the §7.1 file table say so, and the §6.P.9 block keeps it. L2R4-07: P5 asserts the `commonCSS` text and none of the other ten sheets' CSS, because the minified build renames `createSheet` | The round-4 coherence review found that D-G gave the per-URL registry copies no shared change channel, that P6 depended on C1 alone, that the `iconMap` shape, lookup, re-projection and `./a2ui` status were unstated, that the C2 type-level case had no runner, that P8 and P9 both claimed the `emptyOutDir` line, and that the P5 check named a call the minifier renames | agent R4LensSpecArch (L3R4-01 to L3R4-06); agent R4LensSpecResearch (L2R4-01, L2R4-02, L2R4-05, L2R4-07); Miguel's decisions D-M and D-G of 2026-10-20 (AM-006); ARCH §11, §17.4, §17.7; PRD Appendix D; R1 §2.6; R9 §2.1, §2.3; jsDelivr issue #18337; `packages/line-components/tsconfig.json`; `.github/workflows/checks.yml:24-25`; `scripts/lint-layers.mjs:12-16`; Vite 8.3.4 `prepareOutDirPlugin` |
| AM-009 | 2026-10-20 | ledger 00-Z48 (factual correction, coherence review round 5) | Factual edits, no design change. L3R5-01/L2R5-04: `line-genui` imports `line-icons` types only and never loads it at run time (AM-008), so §3.1 prose and the diagram label, the §4.1 `peerDependencies` comment and §6.C.3 say that `line-components` is a peer loaded lazily through descriptor `load()` and `line-icons` is a peer for the `A2uiIconMap` and `A2uiIconName` types only (`import type`; the shipped `.d.ts` references `@websublime/line-icons/a2ui`), never loaded at run time; the peer stays (SD9). L3R5-06: P6 Deps say the P6 page uses no `line-icons` resolver and C22 precedes P6 only through C2. R5-L1-01: Z3 Deps and SD87 split the exit sweep, which has no row dependency and starts before the last rows land (plan §7.4), from the retrospective, which depends on every other Phase 1 row. L2R5-01: §4.1 cites "PRD §2, Agent-Driven UI row" instead of a line number; this supersedes the locator text in AM-005 (L2R3-13) and AM-007 (L2R4-06). L2R5-03: P5 checks that the bundle contains the `reset.common.css` string as built into the tarball's `dist/styles/index.js`, and none of the other ten built sheet strings. The header cites PRD v0.8.24 and ARCH v0.8.10 and names AM-001–AM-010 | The round-5 coherence review found the `line-icons` peer described as lazily loaded although `line-genui` only imports its types, a P6 Deps line that left the C22 relation unstated, a Z3 dependency that blocked the sweep it says starts early, a line-number locator, and a P5 check that named the source rather than the built string | agent R5LensSpecArch (L3R5-01, L3R5-06); agent R5LensSpecResearch (L2R5-01, L2R5-03, L2R5-04); agent R5LensPlanPRD (R5-L1-01); PRD §2, §6.1; ARCH §17.1; plan §7.4 |
| AM-010 | 2026-10-20 | ledger 00-Z48 (decision — orchestrator defaults completing Miguel's round-3 decisions D-G and D-M; for Miguel's review at the 00-Z48 PR: L3R5-02, L3R5-03, L3R5-04/L2R5-02 and L3R5-05) | L3R5-02: the §6.C.3 global slot is created on first access (`setIconRegistry`, the `LineIcon.registry` getter or setter, or a `<line-icon>` connect), never at module load, so `define()` stays the only module-top side effect of `./icon` and the root defines nothing and creates nothing, the same treatment as SD97's policy. L3R5-03: the event dispatched on the slot's `events` target is `line-icon-registry-change`, prefixed under Law 2 because it is a cross-copy, cross-version contract; §6.C.3 and §7.7 state it. L3R5-04/L2R5-02: `A2uiIconName` is the union of the 59 A2UI v0.9.1 `Icon.name` enum values, kept in `packages/line-icons/src/a2ui/` and exported from `./a2ui` beside `A2uiIconEntry`, `A2uiIconMap` and `a2uiIconMap`; §4.3, §6.C.3, §6.G.2 and SD15 list it. L3R5-05: G2 Changes add that `packages/line-icons/README.md` states the preview status of `./a2ui` (ARCH §17.7), and D1 states the preview status of both `line-genui/a2ui` and `line-icons/a2ui` | The round-5 coherence review found that AM-008 left the slot's creation time open, so a module-load write could break the root's no-side-effect contract, gave the cross-copy event an unprefixed name, used `A2uiIconName` without defining or exporting it, and stated the `line-icons/a2ui` preview status in the spec only | agent R5LensSpecArch (L3R5-02 to L3R5-05); agent R5LensSpecResearch (L2R5-02); Miguel's decisions D-G and D-M of 2026-10-20 (AM-006); MANIFESTO Law 2; ARCH §11, §12, §17.4, §17.7; R1 §2.6; R10 §2.1, P2; §10 SD97 |
| AM-011 | 2026-10-20 | ledger 00-Z48 (factual correction, coherence review round 6 minors) | Factual edits, no design change. L3R6-01: the C2 "Icon surface acceptance" block adds that importing the root `"."` or `./icon` from the packed tarball leaves `globalThis[Symbol.for('line.icon-registry')]` `undefined` until first access. L3R6-02/L2R6-01: the §5 layout line for `packages/line-icons/README.md` adds G2 (`./a2ui` preview status), and the `src/a2ui/` line lists the `A2uiIconName`, `A2uiIconEntry` and `A2uiIconMap` types. L3R6-03/R6-L1-01: §4.3 says "its types and helper" for `./a2ui`, and PRD Appendix D, plan §2.1 and ARCH §17.7 name the `A2uiIconName`, `A2uiIconEntry` and `A2uiIconMap` types and the `a2uiIconMap` helper | The round-6 coherence review found that AM-010 added the slot's first-access rule and the `./a2ui` types and README duty without an acceptance item or a §5 layout entry, and that the preview-status sentences still named one type | agent R6LensSpecArch (L3R6-01 to L3R6-03); agent R6LensSpecResearch (L2R6-01); agent R6LensPlanPRD (R6-L1-01); §12 AM-010 |
| AM-012 | 2026-10-20 | ledger 00-Z48 (factual correction, coherence review round 7; L3R7-04 as an orchestrator default for Miguel's review at the 00-Z48 PR) | Factual edits, no design change. L2R7-01: the C2 "Icon surface acceptance" block says `IconRegistry.resolve` and the reference resolvers already reject with a `[line-icons]` error, because each `throw` (`packages/line-icons/src/index.ts:21`; `resolvers/icon-name.ts:5`; `resolvers/phosphor.ts:13`) runs inside an `async` function, and `<line-icon>` catches the rejection; C22 Changes and acceptance list no throw-to-reject change, so they stay as written. L3R7-02: G2 Changes say `./a2ui` holds the per-set map, which is not a public export; the public exports stay the three types and `a2uiIconMap` (§4.3; ARCH §17.7). L3R7-03: §6.G.7 states that WebSocket and `fetch`-stream JSONL, the fifth ARCH §17.5 row, get no Phase 1 recipe (PRD §7.3 item 8), and the D2 contract lists the four recipes AG-UI, A2A, MCP and SSE; ARCH §17.5 states the same. L3R7-04: §6.G.4 says `<line-a2ui-surface>` extends `HTMLElement`, as the R2 spike's surface does, and `./a2ui` imports no `line-core` module that loads `lit`, the root `"."` included; §4.1 says `line-genui` uses `line-core` only through Lit-free modules and types (for example `import type` of `LineElement`), and the dependency edge stays as ARCH §17.1 and PRD §6.1 state. R7-L1-01 is plan-only (Status line). The header names AM-001–AM-013 | The round-7 coherence review found a C2 sentence that described the async resolvers as throwing, a G2 line that read as a public export of the per-set map, a D2 contract that left the fifth transport row open, and a surface whose base class and `line-core` imports were unstated although any root import loads Lit | agent R7LensSpecResearch (L2R7-01); agent R7LensSpecArch (L3R7-02 to L3R7-04); agent R7LensPlanPRD (R7-L1-01); `packages/line-icons/src/index.ts:19-21`; `packages/line-icons/README.md:24`; `packages/line-core/src/index.ts:1`; `packages/line-core/src/line-element.ts:1`; `docs/research/assets/01-r2/spike/src/surface-base.ts:24`; PRD §6.1, §7.3; ARCH §6, §17.1, §17.4, §17.5, §17.7 |
| AM-013 | 2026-10-20 | ledger 00-Z48 (decision — Miguel chose consumer-settable live-region attributes with English defaults over attributes with no default and over a MANIFESTO reading that keeps fixed English strings: L3R7-01) | `<line-a2ui-surface>` gains the attributes `live-update-text` and `live-error-text` (properties `liveUpdateText`, `liveErrorText`), whose defaults are the R2 spike strings "Content updated." and "Some content could not be shown."; §6.G.4 Changes add them and the JSDoc names them, the Accessibility rule announces their values, and G4 acceptance checks the announcement for an update and for an error with the defaults and with configured text; SD59 states it; D1 documents both attributes; ARCH §17.4 names them | The round-7 coherence review found that the live region announced a fixed English string the consumer could not replace, against the MANIFESTO rule that applies to Button's loading label, and that the error sentence was never given | agent R7LensSpecArch (L3R7-01); Miguel's decision of 2026-10-20; MANIFESTO Out of Scope (`docs/MANIFESTO.md:66`); R2 §2.8, §6 Q3; `docs/research/assets/01-r2/spike/src/surface-base.ts:7-8`; ARCH §17.4 |
| AM-014 | 2026-10-20 | ledger 00-Z48 (factual correction, coherence review round 8) | Factual edits, no design change; corrects AM-012's `line-core` wording. L3R8-01/L2R8-01: §4.1 says only the root `"."` loads `lit` at run time (`packages/line-core/dist/index.js:4`); `./machine` and `./mixins/*` reference `lit` through `import type` only, which `verbatimModuleSyntax` erases (`tsconfig.base.json:22`), so `./mixins/*` loads nothing from `lit` and `./machine` loads `@zag-js/vanilla` (`dist/machine/index.js:1`); §4.1 and §6.G.4 state one rule: only `line-core` modules that load `lit` at run time are barred from `line-genui`. L2R8-02: the `extends LitElement` locator is `line-element.ts:19`. L3R8-02: ARCH §17.4 states that the surface extends `HTMLElement`, not `LineElement`, and §6.G.4 cites it. L2R8-03: the C22 bundled-icons recipe cites R10 round 2 §6 Q3, P2. L2R8-04: the `<line-icon>` attributes bullet cites R10 §6 Q5. L2R8-05: the `vite-plugin-singlefile` claim carries an `[INFERENCE]`. L2R8-06: the Zod claim cites R5 §2.1, §2.3, §4 (P7). R8-L1-01 and R8-L1-02 are plan and PRD only (plan §2.1 and §3; PRD Appendix D). The header names AM-001–AM-014 | The round-8 coherence review found that AM-012 read type-only `lit` imports in `./machine` and `./mixins/*` as run-time loads, plus citation slips | agent R8LensSpecResearch (L2R8-01 to L2R8-06); agent R8LensSpecArch (L3R8-01, L3R8-02); agent R8LensPlanPRD (R8-L1-01, R8-L1-02); `packages/line-core/src/index.ts:1`; `packages/line-core/src/line-element.ts:1, :19`; `packages/line-core/dist/index.js:4`; `packages/line-core/src/machine/line-machine-controller.ts:20-21`; `packages/line-core/src/mixins/direction.ts:1`, `inspector.ts:1`, `metadata.ts:1`; `packages/line-core/dist/machine/index.js:1`; `tsconfig.base.json:22`; R10 round 2 §6 Q3, P2; R10 §6 Q5; R5 §2.1, §2.2, §2.3, §4 (P7), §6 Q6; ARCH §17.4, §17.5, §17.7; PRD Appendix D |
| AM-015 | 2026-10-20 | ledger 00-Z48 (factual correction and orchestrator defaults, coherence review round 9; L3R9-01 and L3R9-05 as orchestrator defaults for Miguel's review at the 00-Z48 PR) | L3R9-01: G4 Changes add `"@websublime/line-genui": "workspace:^"` to the `apps/storybook` devDependencies, which `lint-layers` does not guard for apps; §5 lists the G4 and G7 changes to `apps/storybook/package.json`. L3R9-02/L2R9-02: the Status, Source PRD and Source Architecture lines name AM-001–AM-015. L3R9-03/L2R9-03: the ARCH §17.4 sentence on the surface base class cites Phase 1 spec AM-012 and AM-014. L3R9-04: §4.1 says `./catalog` imports no module that touches the DOM at load, `./styles` included, and the dependency-declaration bullet no longer offers a direct `lit` import as its example; `./a2ui` never imports `lit`. L3R9-05: §6.G.4 Limits require that the consumer can override each limit through the attributes `max-nodes`, `max-depth` and `max-data-model-size` (properties `maxNodes`, `maxDepth`, `maxDataModelSize`); the names are an orchestrator default; G4 Changes name them in the JSDoc, G4 acceptance checks that a configured lower limit rejects a message the default accepts, and D1 documents them. L2R9-01: §6.G.4 Changes, the Accessibility rule and SD59 cite R2 §6 Q3 and the spike README for the two default strings, which R2 §2.8 does not contain; SD59 keeps R2 §2.8 for the live-region behaviour and the screen-reader pass. L2R9-04: the AM-014 Evidence cell lists the round-8 agents and sources. R9-L1-01 is plan and PRD only (plan Status and §2.1; PRD Appendix D and v0.8.24 note). The header names AM-001–AM-015 | The round-9 coherence review found a Storybook import with no declared dependency, header and ARCH citations that stopped at AM-013 or AM-012, a `./catalog` DOM rule that §4.1 did not state, limits that ARCH calls configurable with no override, a wrong R2 section for the default strings, an AM-014 Evidence cell without agents or sources, and round-6 history that credited the preview-bullet export names to round 6 | agent R9LensSpecArch (L3R9-01 to L3R9-05); agent R9LensSpecResearch (L2R9-01 to L2R9-04); agent R9LensPlanPRD (R9-L1-01); `apps/storybook/package.json:13-21`; `scripts/lint-layers.mjs:13-14, :182-186`; `packages/line-core/src/styles/index.ts:24-25, :30-40`; `docs/research/01-research-projection-technique.md:297` (R2 §6 Q3); `docs/research/assets/01-r2/spike/README.md:110, :116-117`; `docs/research/assets/01-r2/spike/src/surface-base.ts:7-8`; ARCH §17.4; PRD Appendix D |
| AM-016 | 2026-10-20 | ledger 00-Z48 (factual corrections and orchestrator defaults, coherence review round 10; the plumbing choices of L3R10-01 to L3R10-05 and L3R10-08 and the `@storybook/web-components` and esbuild sweep entries as orchestrator defaults for Miguel's review at the 00-Z48 PR) | L3R10-01: G2 vendors the five A2UI v0.9.1 schema files from `a2ui-project/a2ui` at `cbaa5ee` into `packages/line-genui/__tests__/fixtures/a2ui-v0_9_1/` with a `SOURCE.md`; root `devDependencies` gain `ajv` ^8.20.0 and `ajv-formats` ^3.0.1 (G2 or G3, whichever lands first) and `gpt-tokenizer` ^4.1.0 (G3). L3R10-02: G2 adds `scripts/emit-catalog.mjs`, which the `line-genui` `build` runs right after `vite build` to write `dist/catalog.json`. L3R10-03: P1 gives `line-genui` `devDependencies` on `line-components` and `line-icons`, because a probe showed that Bun 1.4.3 orders `--filter` scripts by `dependencies` and `devDependencies` but not by peers; §4.1 records the probe and that Phase 00 spec line 399 understates the ordering; no workflow or root script changes. L3R10-04: P6 or C22, whichever lands first, adds `testIgnore` of `**/*cdn.e2e.ts` unless `LINE_E2E_CDN` is set, and `.github/workflows/cdn-check.yml` on `workflow_dispatch`; C22 splits its CDN-base pages into `consumer-matrix.cdn.e2e.ts`; C22, §7.8, §9.4, SD25 and SD96 point to the gate. L3R10-05: G7 adds `@ag-ui/client` 1.0.3, `rxjs` 7.8.1 and `@a2a-js/sdk` 1.3.0 to the `apps/storybook` devDependencies and states that the MCP and SSE recipes import no SDK. L3R10-06: a limit value that is not a positive integer keeps the default, and the surface throws nothing. L3R10-07: the §5 `checks.yml` line names P5 and P10 and their removed steps; §5 adds `README.md ~ Z1`. L3R10-08: D1 compiles every sample that imports `@websublime/*` as a `.ts` file under `apps/storybook/stories/agent-driven-ui-samples/` through the Typecheck step; ext-apps samples stay uncompiled MDX. L2R10-02: the G4 JSDoc bullet cites AM-015, L3R9-05. L2R10-03: SD56 names the override attributes and cites AM-015. Sweep: P10 adds `@storybook/web-components` ^10.6.2 to the root `devDependencies` for `setCustomElementsManifest`; P5 or C22, whichever lands first, adds esbuild, since C22 can land before P5. L2R10-01 is ARCHITECTURE only (v0.8.10 note, rounds 5–10). R10-L1-01 is plan only (§3 transports bullet and Status). The header names AM-001–AM-016 | The round-10 coherence review found test, build and Storybook imports with no declaring task, a `./catalog.json` export with no build step, a `line-genui` declaration build that peers alone do not order, CDN pages that every PR would run, an open edge case in the limits rule, a stale §5 line, a D1 check with no named mechanism and three citation gaps | agent R10LensSpecArch (L3R10-01 to L3R10-08); agent R10LensSpecResearch (L2R10-01 to L2R10-03); agent R10LensPlanPRD (R10-L1-01); agent R10Fix (Bun ordering probe in `/tmp/bunfilter-exp`, Bun 1.4.3; `npm pack @a2ui/web_core@0.14.0 --dry-run`; dependency sweep); `docs/research/01-research-a2ui-web-core.md:272` (R1 P4); `docs/research/01-research-projection-technique.md:238-239, :309` (R2 P2, P3, Sources); `docs/research/assets/01-r2/spike/README.md:32-33`; `docs/research/assets/01-r2/spike/scripts/fetch-spec.ts`; `docs/research/01-research-descriptor-api.md:207` (R3 §2.7); `docs/research/01-research-transports.md:11, :63, :187-189, :211` (R6); `docs/research/01-research-custom-elements-manifest.md:173` (R4 §2.8); root `package.json:22, :46-80`; `bun.lock` (`@storybook/web-components-vite` 10.6.2); `playwright.config.ts:5`; `.github/workflows/checks.yml:22-25, :42-43`; `scripts/verify-pack.mjs:145-155`; `scripts/lint-layers.mjs:12-16`; `apps/storybook/tsconfig.json`; Phase 00 spec line 399; MANIFESTO Law 9 |
| AM-017 | 2026-10-20 | ledger 00-Z48 (factual corrections, coherence review round 11) | L3R11-01/L2R11-01/R11-L1-01: P10 drops the root `@storybook/web-components` devDependency and imports `setCustomElementsManifest` from `@storybook/web-components-vite`; §5 `package.json` drops the P10 entry. This corrects AM-016, whose Sweep said that `@storybook/web-components-vite` does not re-export the function. L3R11-02: G2 adds `!**/__tests__/fixtures/a2ui-v0_9_1` to the `biome.json` `files.includes`; §5 adds `biome.json ~ G2`. L3R11-03: C22 always adds the CDN gate, because C22 blocks C2 and P6 needs C2; infra-supervisor owns `playwright.config.ts` and `cdn-check.yml` within C22; P6 and the §5 lines point to C22. L3R11-04/L2R11-05: P1 fixes the `checks.yml:22` comment and carries a Phase 00 spec AM row for lines 399 and 1815; §4.1 and §5 name P1. L2R11-02: G7 cites R6 §2.1 and §3 P4 for `rxjs`. L2R11-03/L3R11-05: G2 writes the upstream paths in full. L2R11-04: G2 cites `package.json:50-83`; AM-016 Evidence should read `package.json:23, :50-83`. L2R11-06: the C22 miss path cites SD90 for a missing `base`. L2R11-07/L3R11-07: G7 says Vite bundles only the client packages and the middleware serves the Bun test only. L3R11-06: a D1 sample that imports an undeclared package stays MDX even if it imports `@websublime/*`. R11-L1-02 is plan only (§4.0 C row and Status). R11-L1-03 is PRD only (§6.5 workflow tree, v0.8.24 note). The header names AM-001–AM-017 | The round-11 coherence review found a false re-export claim behind a new root dependency, vendored fixtures that the Lint step rejects, a CDN gate rule whose condition the task order always decides, false Bun ordering statements with no fixing task, and six citation or wording gaps | agent R11LensSpecArch (L3R11-01 to L3R11-07); agent R11LensSpecResearch (L2R11-01 to L2R11-07); agent R11LensPlanPRD (R11-L1-01 to R11-L1-03); agent R11Fix (`bunx biome check` 2.5.15 on `specification/v0_9_1/json/common_types.json` at `cbaa5ee`: "Formatter would have printed the following content"; with the exclusion added, the file is not checked); `node_modules/@storybook/web-components-vite/dist/index.d.ts:3` (`export * from "@storybook/web-components";`, 10.6.2); `@storybook/web-components` 10.6.2 `dist/index.d.ts:42, :1117`; `apps/storybook/.storybook/preview.ts:6`; `biome.json:91`; `.github/workflows/checks.yml:20-22`; Phase 00 spec lines 399, 1815; root `package.json:23, :50-83`; `docs/research/assets/01-r2/spike/scripts/fetch-spec.ts:6-13`; `docs/research/01-research-transports.md:11, :63, :97, :210` (R6); `docs/research/01-research-icon-round2.md:152-154, :224` (R10 round 2); `.github/workflows/` listing |
| AM-018 | 2026-10-20 | ledger 00-Z48 (factual corrections, coherence review round 12) | R12-L1-01/L3R12-01: the §6.C.0 owner bullet and the C22 Owner line name infra-supervisor for the C22 CDN gate files `playwright.config.ts` (`testIgnore`) and `.github/workflows/cdn-check.yml`, as plan §4.0 and §6.S.1 do; this completes the owner split of AM-017 (L3R11-03). L3R12-02: P5 adds a "Size report" step after "Pack verification (AM-036)" that runs `bun run scripts/report-size.mjs` and gates nothing; the §5 `checks.yml` line names it. L3R12-03: G3 runs the subset checks and the per-tool byte and o200k print as `bun test` files in `packages/line-genui`, through the "Unit tier" step. L3R12-04: P10 and G4 add no `.gitignore` line, because the unanchored `custom-elements.json` line covers both package manifests; P10 drops the `customElements.json` line, whose producer it removes; the §5 `.gitignore` line names P10 only. L3R12-05: ARCH §17.3 names the `line-components` `custom-elements.json` as the drift test source (ARCH v0.8.10 note). L2R12-01: the G2 Lint exclusion states that Biome wraps the `files.includes` array one entry per line. The header names AM-001–AM-018 | The round-12 coherence review found an owner split that AM-017 left in two C lines, a size report with no CI step, G3 checks with no named CI step, `.gitignore` additions that the existing line already covers, a stale manifest name in ARCH §17.3, and a `biome.json` edit that fails the Lint step unless wrapped | agent R12bLensPlanPRD (R12-L1-01); agent R12bLensSpecArch (L3R12-01 to L3R12-05); agent R12bLensSpecResearch (L2R12-01); agent R12Fix (`biome check` on a `/tmp` copy of `biome.json` with the exclusion added: "Formatter would have printed the following content", one entry per line; after `biome check --write`, "No fixes applied"); `.gitignore:9-10`; `.github/workflows/checks.yml:26-27, :38-39`; `apps/storybook/package.json:9`; plan §4.0 |
| AM-019 | 2026-10-20 | ledger 00-Z48 (factual corrections and orchestrator defaults, coherence review round 13; the C2 → P5 ordering of L3R13-01 as an orchestrator default for Miguel's review at the 00-Z48 PR) | L3R13-01: C2 depends on P5, so P5 removes the "Zero-export smoke" step before C2 makes the `line-components` root export `setIconRegistry`; the C2 row of §6.C.4, the P5 Deps line, §6.C.0 order step 3, the §6.C.6 stream acceptance and plan §4.2 and §6 state it; SD24 stays. L3R13-02: the G2 acceptance item "a message with the v0_9 basic id renders mapped types and raises `line-a2ui-error` for each unmapped type" moves to G4; G2 keeps a registry-contents and catalog-id lookup check, its Changes name the `basic` implementation map that the G4 session registers, and §9.2 points to §6.G.4. L3R13-03/R13-L1-01: P10 also drops `"!**/customElements.json"` from `biome.json` `files.includes` and the `analyze` reference in the `.gitignore` line 7 comment; the §5 `biome.json` line names P10 and G2; the G2 Biome sentence becomes conditional on the 120-column `lineWidth`. L3R13-04: G7 names its test `apps/storybook/__tests__/ag-ui-middleware.test.ts`, which the "Unit tier" step runs, and §5 lists it. L3R13-05: D1 keeps samples that import CSS as uncompiled MDX code blocks; §7.1 does not describe D1 samples and stays. L2R13-01: the Phase 00 AM rows of P5 and P10 also name Phase 00 spec §6.F.5. L2R13-02: in AM-018, "as plan §4.0 and §6.S.1 do" means spec §6.S.1; the AM-018 row stays as written. The header names AM-001–AM-019 | The round-13 coherence review found that C2's root export would fail the zero-export step if C2 landed before P5, a G2 acceptance item that needs the G4 surface, a `biome.json` exclusion and a `.gitignore` comment left behind by the P10 removal, a G2 Biome sentence that wraps unconditionally, an unnamed G7 test file, CSS-importing D1 samples with no rule, Phase 00 §6.F.5 missing from two AM-row notes, and an ambiguous reference in AM-018 | agent R13LensSpecArch (L3R13-01 to L3R13-05); agent R13LensSpecResearch (L2R13-01, L2R13-02); agent R13LensPlanPRD (R13-L1-01); agent R13Fix (C1 adds no root export: §5 names only C2 for `packages/line-components/src/index.ts`); `.github/workflows/checks.yml:28-29` ("Zero-export smoke", `if (n !== 0)`), `:38-39` ("Unit tier", `bun test`); `biome.json:20` (`"lineWidth": 120`), `:91` (`"!**/customElements.json"`); `.gitignore:7` ("(regenerated by `analyze`)"); `bunfig.toml` `[test]` (`pathIgnorePatterns = ["temp/**"]`); `docs/specs/00-spec-design-system.md:1819-1822, :1839-1840` |
| AM-020 | 2026-10-20 | ledger 00-Z48 (merge-order corrections and orchestrator defaults, coherence review round 14; as orchestrator defaults for Miguel's review at the 00-Z48 PR: P1 as a P5 Dep (L3R14-02), the C21 split of SD18 and SD28 (L3R14-04) and G4 as a C5–C20 Dep (L3R14-05)) | L3R14-01: C23 gives happy-dom a fake `attachInternals` in `bun-test-preload.ts` from the `line-core` mock, and the mock's `restore()` puts the previous function back instead of deleting it; §5 and §7.8 state it. L3R14-02: the three P9 acceptance items (bare `line-core` imports in `line-components` `dist/`, the undeclared-specifier scan, the identity test) and the identity test file move to P5, and P5 gains P1 as a Dep so the scan covers `line-genui`; P9 checks the derived externals of `line-core` `dist/`; §5, §7.5, §8 and §9.4 follow. L3R14-03: the C1 autodocs item moves from P10 to the §6.C.6 stream acceptance; P10 checks that `preview.ts` calls `setCustomElementsManifest` and the Storybook build passes. L3R14-04: C21 ships the harness, the budget and its unit on a fixture machine; each machine row (C1, C5, C6, C8, C11, C16) records its own rate in its PR, and the first row past the budget adds the `line-core` `VanillaMachine` subclass, owned by webcomponents-supervisor; SD18, SD28, §4.5, §5, §6.C.6, §8 and plan §4.3 and §8 follow. L3R14-05: C5–C20 depend on G4; the §6.C.4 Deps column, §6.C.0 step 5, SD86 and plan §6 state it. L3R14-06: G4 tests the required-name rule with a fixture descriptor, and the IconButton case moves to C5 (§6.C.5). L3R14-07: the G1 description item checks `Catalog.toJson()` output. L3R14-08: P1 adds `packages/line-genui/LICENSE`, a copy of `packages/line-core/LICENSE`. L3R14-09: P5's first size report covers the rows merged before it (§6.C.6, §7.6). L3R14-10: the §4.1 factory call passes `root: import.meta.dirname`. L3R14-11: C22 updates the three `line-icons` unit tests that call the resolvers without `base`. L3R14-12: P5 drops the zero-export comment of `packages/line-components/vite.config.mjs`, and C1 updates `packages/line-components/README.md:3`. L2R14-01: the P10 Phase 00 AM row names §6.A A2, and G2 carries the same AM row for its fixture exclusion; §5 names G2. L2R14-02: the §7.8 Unit row cites Phase 00 spec §6.F.3. R14-L1-01: in the AM-019 Source cell, "the C2 → P5 ordering" means P5 lands before C2, as plan §6 draws it; the AM-019 row stays as written. L2R14-03: the SD65 Source cites R6 §2.1 and §6 Q3, whose options (b), (a) and (c) are the SD65 choice and alternatives. The header names AM-001–AM-020 | The round-14 merge-order walk found acceptance items that their task cannot meet with only its Deps (P9, P10, C21, G4), C5–C20 rows that could merge before the surface they extend, a unit tier that C23 breaks under happy-dom, a missing `LICENSE`, a factory call that fails if P1 lands after P9, unit tests and Phase 00 statements that C22, P5 and C1 leave stale, and four citation gaps | agent R14LensSpecArch (L3R14-01 to L3R14-12); agent R14LensSpecResearch (L2R14-01 to L2R14-03); agent R14LensPlanPRD (R14-L1-01); agent R14Fix (grep of `node_modules/.bun/happy-dom@20.14.6/node_modules/happy-dom/lib` for `attachInternals` or `ElementInternals`: 0 files; `bun.lock:1094` happy-dom 20.14.6); `packages/line-core/__tests__/mocks/element-internals.ts:3, :39`; `bun-test-preload.ts:40`; `packages/line-core/__tests__/direction.test.ts:45`; `packages/line-core/__tests__/line-machine-controller.test.ts:63`; `packages/line-core/dist/index.js:4`; `packages/line-core/dist/machine/index.js:1`; `vite.config.shared.mjs:10-16`; `packages/*/LICENSE` (8 files); `docs/plans/00-tasks-design-system.md:119` (Z5); `packages/line-icons/__tests__/registry.test.ts:7-8`, `resolvers.lucide.test.ts:15`, `resolvers.phosphor.test.ts:18`; `packages/line-components/vite.config.mjs:3-4`; `packages/line-components/README.md:3`; `docs/specs/00-spec-design-system.md:429, :1692-1694`; `docs/research/01-research-transports.md:78` (R6 §2.1, no error channel), `:255` (R6 §6 Q3 options) |
| AM-021 | 2026-10-20 | ledger 00-Z48 (owner and acceptance corrections, coherence review round 15; the G2, G4 and G7 build and Storybook owner splits and the C `exports` rule as orchestrator defaults for Miguel's review at the 00-Z48 PR) | L3R15-01: infra-supervisor owns the C23 `bun-test-preload.ts` change; the C23 Owner line and Changes, the §6.C.0 owner bullet, the §5 `bun-test-preload.ts` line and plan §4.0 C row state it. Sweep A (owner split by file): infra-supervisor also owns the root `package.json` `devDependencies` that C22 (webpack, esbuild), G2 (ajv, ajv-formats) and G3 (gpt-tokenizer, ajv, ajv-formats) add; the C22, G2 and G3 Owner lines and Changes, the §6.C.0 and §6.G.0 owner bullets, the §5 `package.json` line and plan §4.0 C and G rows state it. Orchestrator default: infra-supervisor also owns the G2 `emit-catalog` step of the `line-genui` `build` script, the G4 `analyze` script and `build` step and the G4 `customElements` field and `custom-elements.json` `files` entry in `packages/line-genui/package.json`, the G4 `apps/storybook` devDependency and `preview.ts` manifest import, and the G7 `apps/storybook` devDependencies (`.claude/agents/infra-supervisor.md:97, :104`); the G2, G4 and G7 Owner lines, §6.G.0, §5 and plan §4.0 G row state it. Orchestrator default: every row that adds its own subpath entry to an `exports` map keeps it with webcomponents-supervisor (C1–C20; C22; G2 `./catalog.json` and `line-icons` `./a2ui`; G4 `./custom-elements.json`; G6 `./hosts/mcp-apps.css`); P1 adds the `line-genui` `./catalog` and `./a2ui` keys (§4.1, SD23); §4 states the rule, §6.C.0 and §6.G.0 cite it, and plan §4.0 C and G rows state it. `biome.json` (G2) and `scripts/emit-catalog.mjs` (G2) stay unsplit: the infra-supervisor scope list (`.claude/agents/infra-supervisor.md:96-104`) names neither, and webcomponents-supervisor lists `biome.json` (`webcomponents-supervisor.md:87`) and generator scripts and the catalogs (`:95-96`, `:99`). L3R15-02: C10 adds the `Image` `variant: "avatar"` route to the `basic` map, with an acceptance item that a v0_9 basic `Image` with that variant renders `<line-avatar>` (§6.C.4); §6.G.2 says G2 maps `Image` to native `<img>` until C10; the §6.G.4 Basic mapping, the §5 `src/catalog/index.ts` line and §9.2 follow. L3R15-03: the G2 and G3 flagged-descriptor items test the emitters with a fixture descriptor that has `agentExposed: false`, and C12, C13 and C16 each check that their tag is absent from the built `catalog.json` and from the G3 tool output (§6.C.4). m1/L2R15-02/R15-L1-02: the SD18 Decision opens with the fixture-machine wording. m2/L2R15-01: the C22 test bullet lists every call without `base`; the AM-020 Evidence locators `registry.test.ts:7-8`, `resolvers.lucide.test.ts:15` and `resolvers.phosphor.test.ts:18` named one call per file only. m3: C23 carries an AM row to Phase 00 spec §6.F.3, and the §5 Phase 00 line names C23. R15-L1-01 is plan only (§6 graph line `G1, G4, G5 ────────► C5–C20`). R15-L1-03: the AM-020 L3R14-02 follow list should also name plan §4.2 P5 and §6. L2R15-03: the AM-020 L3R14-04 follow list should also name §6.C.1. The AM-020 row stays as written. The header names AM-001–AM-021 | The round-15 coherence review found a C23 file that the supervisor definitions give to infra-supervisor under a webcomponents-only owner, an ARCH §17.3 avatar route that no task owned, two flagged-descriptor acceptance items with nothing to check at merge, a stale SD18 clause, a partial locator list, a Phase 00 statement that C23 leaves stale, and three gaps in the AM-020 lists and the plan graph | agent R15LensSpecArch (L3R15-01 to L3R15-03, m1 to m3); agent R15LensSpecResearch (L2R15-01 to L2R15-03); agent R15LensPlanPRD (R15-L1-01 to R15-L1-03); agent R15Fix (owner sweep and acceptance sweep); `.claude/agents/infra-supervisor.md:88` (`package.json # root scripts`), `:97` ("Bun workspace topology, root scripts"), `:104` ("Test harness plumbing (`bun-test-preload.ts`, Playwright config)"); `docs/ARCHITECTURE.md:1552` (ARCH §17.3 Image row, "`variant: "avatar"` → Avatar"); §10 SD38; `packages/line-icons/__tests__/registry.test.ts:7, :8, :19, :30, :37`; `resolvers.lucide.test.ts:15`; `resolvers.phosphor.test.ts:18, :24, :28, :32, :37, :41, :45, :51`; `docs/specs/00-spec-design-system.md:1692-1720` (§6.F.3 preload block, no `attachInternals`); `bun-test-preload.ts:40` |
| AM-022 | 2026-10-21 | ledger 00-Z48 (decision: Miguel, file-class ownership rule) | §4 gains one table that says which supervisor edits each class of file, whatever task the change rides on. Owner lines and plan §4.0 name only the accountable supervisor, who runs the task, opens its PR and asks the other supervisor to make its classes' edits in the same PR, and point to the table. The table replaces the per-file splits of AM-017, AM-018 and AM-021: the C22 CDN gate, the C22, G2 and G3 root `devDependencies`, the C23 preload, the G2 `emit-catalog` step, the G4 `analyze` and Storybook wiring, the G7 Storybook devDependencies, the S1 `playwright.config.ts` change and the §4 `exports` paragraph, whose rule becomes a table row. The C22, C23, G2, G3, G4, G7 and S1 Owner lines and Changes, the §6.P intro, the P5 Owner line, §6.P.6, §6.C.0, §6.G.0, the G6 Owner line and the §5 annotations follow; §5 keeps its task attributions. This also settles R16-L1-01, L2R16-03 and L3R16-03 (the G6 `line-themes` script step and the C2 `devDependencies` are infra-supervisor edits), R16-L1-02 (the G4 `analyze` script and step fall in one class), R16-L1-03 and L3R16-04 (the P5 `src/styles/index.ts` annotations are package source), L3R16-06 (`bun.lock` has a class and a §5 line) and L3R16-07 (the S1 `apps/site/package.json` edit has a class). Rejected: one owner per task with cross-review; continuing per-file enumeration | Rounds 11, 12, 15 and 16 each found files that the per-file owner lists missed; round 16 found the G6 script step, the C2 `devDependencies`, the P5 annotations, `bun.lock` and the S1 `apps/site/package.json` edit | Miguel, 2026-10-21; agent R16LensPlanPRD (R16-L1-01 to R16-L1-03); agent R16LensSpecResearch (L2R16-03); agent R16LensSpecArch (L3R16-03, L3R16-04, L3R16-06, L3R16-07); `.claude/agents/infra-supervisor.md:86-89, :97-104, :107, :118-119, :123`; `.claude/agents/webcomponents-supervisor.md:83-87, :95-106, :111, :124`; `packages/line-themes/package.json:33-34` (no `src/hosts` step); `.github/workflows/checks.yml:19` (`bun install --frozen-lockfile`) |
| AM-023 | 2026-10-21 | ledger 00-Z48 (factual corrections, coherence review round 16) | L2R16-01/L3R16-02: C12, C13 and C16 check by descriptor identity: the catalog name is not a key of `components` in the built `catalog.json`, and G3 emits no tool for the descriptor; the G2 and G3 flagged-descriptor items point to that check (§6.C.4, §6.G.2, §6.G.3). L2R16-02/L3R16-01: G3 joins the Deps of C12, C13 and C16 in §6.C.4; §6.C.0 step 5, SD86 and plan §6 state it. L3R16-03: G6 Changes name the `src/hosts` step of the `line-themes` `build` and `dev` scripts, and so does the §5 `line-themes` line. L3R16-05: G1 and G4 Changes fill the module behind the `./catalog` and `./a2ui` keys that P1 adds. L3R16-06: §5 gains a `bun.lock` line naming every dependency-adding row. L2R16-04: AM-021's citation `webcomponents-supervisor.md:87` for `biome.json` should read `:106` ("Biome compliance"); line 87 is the Project Structure tree. L2R16-05: AM-021's Evidence range `docs/specs/00-spec-design-system.md:1692-1720` should read `:1694-1720`; line 1692 is the §6.F.3 heading, and §6.C.2 already cites `:1694-1720`. The AM-021 row stays as written. The header names AM-001–AM-023 | The round-16 coherence review found a flagged-descriptor check keyed by tag on a catalog keyed by name, a check that needs G3 on rows that do not depend on it, an undocumented G6 script step, G1/G4 wording that conflicts with §4.1, an unlisted `bun.lock`, and two AM-021 locators | agent R16LensSpecResearch (L2R16-01, L2R16-02, L2R16-04, L2R16-05); agent R16LensSpecArch (L3R16-01, L3R16-02, L3R16-03, L3R16-05, L3R16-06); `docs/research/assets/01-r2/line-catalog.emitted.json:4-5` (`"components": { "Button": …`); §6.G.3 (G3 Deps: G1); `packages/line-themes/package.json:33-34`; `.github/workflows/checks.yml:19`; `.claude/agents/webcomponents-supervisor.md:87, :106`; `docs/specs/00-spec-design-system.md:1692, :1694-1720` |
| AM-024 | 2026-10-21 | ledger 00-Z48 (factual corrections, coherence review round 17) | Factual edits to the §4 file-class table, no design change. L3R17-01: the test-harness row is a closed list, `playwright.config.ts` and `bun-test-preload.ts`; the package-source row gives webcomponents-supervisor every file under a package's `__tests__/` and under `apps/storybook/__tests__/`, naming the P5 bundle-splitting and registration harness, the P7 axe helper, the C21 update-rate harness and the htmx integration harness. L3R17-02: the package-source row reads "package `README.md` and other docs content under `packages/*`". L3R17-03: a per-package build config row gives infra-supervisor `vite.config.mjs`, `tsconfig*.json` and `custom-elements-manifest.config.mjs`, except the `vite.config.mjs` entry a C or G row adds for its subpath, which follows the `exports` row; the per-package `package.json` row adds `peerDependencies`. L2R17-01: the `verify-pack`/`report-size` row says neither scope list names them; infra:54 and wc:53 list `verify-pack` only as a Verify-record command. The header names AM-001–AM-024 | The round-17 coherence review found an open-ended harness row that overlapped package tests, a docs-content class wider than its source, per-package build config and `peerDependencies` in no row, and an evidence cell that missed two scope-list lines | agent R17LensSpecArch (L3R17-01, L3R17-02, L3R17-03); agent R17LensSpecResearch (L2R17-01); `.claude/agents/infra-supervisor.md:54, :97, :104`; `.claude/agents/webcomponents-supervisor.md:53`; §4.2 ("Each C task adds its own `exports` key and its own `vite.config.mjs` entry"); §5 (`custom-elements-manifest.config.mjs - P10 (removed; …)`, `packages/line-components/custom-elements-manifest.config.mjs + P10`) |
| AM-025 | 2026-10-21 | ledger 00-Z48 (factual corrections, coherence review round 18; L2R18-03 records AM-024's L3R17-03 build-config row as an orchestrator default for Miguel's review at the 00-Z48 PR) | Factual edits, no design change. L2R18-01: §4.1 says PRD Appendix D lists four `line-genui` surfaces and none is the root. R18-L1-01: the accountable supervisor runs the task on its branch and `git-workflow-manager` opens the PR (§4, plan §4.0). R18-L1-02: the main session dispatches the other supervisor, one after the other on the same task branch, for the classes the §4 table gives it; §6.Z and plan §4.0, §4.6 and §10 step 6 add `docs/PROCESS.md:92-95` to the ledger-PR alignment; this corrects the "opens its PR and asks the other supervisor" wording of AM-022. R18-L1-03/L3R18-01: the §6.C.0, §6.G.0 and §6.S.1 owner bullets say file classes follow the §4 table and give examples, not a list. L2R18-02: AM-024's Reason should read "two Verify-record lines", not "two scope-list lines". L2R18-03: AM-024's L3R17-03 row moves the C2 `tsconfig.test.json` and the G4 analyser config from the accountable supervisor to infra-supervisor; it is an orchestrator default for Miguel's review, as AM-021 labels its build-file split. L2R18-04: the build-config row cites wc:103 and wc:106. L2R18-05/L2R17-02: the `exports` row cites wc:95-99, :101. L2R18-06: §6.P.8 and plan §2.9 say "§3 diagram line 74". L2R18-07: §6.C.3 cites the resolver `return` lines. L2R18-08: §4.1 says `line-components` declares `line-icons` as a devDependency once C2 adds it. L2R18-09: §6.Z cites `docs/PROCESS.md:79-82`. L3R18-02: §6.G.4 says the G5 coverage test does not cover `<line-a2ui-surface>` because it lives in `line-genui`. L3R18-03: §6.C.4 says `agentExposed` defaults to `true` and a `false` flag needs a recorded reason. The header names AM-001–AM-025 | The round-18 coherence review found a surface count that misstates PRD Appendix D, a PR step and a cross-supervisor request that the supervisor definitions and PROCESS §4 forbid, owner bullets that read as complete lists, a design move labelled factual, and stale locators | agent R18LensPlanPRD (R18-L1-01 to R18-L1-03); agent R18LensSpecResearch (L2R18-01 to L2R18-09); agent R18LensSpecArch (L3R18-01 to L3R18-03); agent R17LensSpecResearch (L2R17-02); `docs/PRD.md:1786-1789`; `.claude/agents/infra-supervisor.md:23-24, :57-58, :66`; `.claude/agents/webcomponents-supervisor.md:22-23, :56-57, :65, :101, :103, :106`; `docs/PROCESS.md:79-82, :92-95`; `docs/specs/00-spec-design-system.md:48, :74`; `packages/line-icons/src/resolvers/lucide.ts:9`; `packages/line-icons/src/resolvers/phosphor.ts:17`; `docs/ARCHITECTURE.md:1533, :1537-1538`; `docs/PRD.md:1175` |
| AM-026 | 2026-10-21 | ledger 00-Z48 (factual corrections, coherence review round 19) | Factual edits, no design change. R19-L1-01/L2R19-01: the orchestrator (main session or `sdlc`) dispatches the other supervisor on the same task branch (§4, §6.Z; plan §4.0); the ledger-PR alignment list in §6.Z and plan §4.0, §4.6 and §10 step 6 adds `.claude/agents/sdlc.md:42` and the `description:` lines `.claude/agents/webcomponents-supervisor.md:3` and `.claude/agents/infra-supervisor.md:3`. L3R19-03: the second dispatch adds no changeset entry, and the accountable supervisor's entry covers every package the branch changed (§4, §6.Z; plan §4.0); the list adds `docs/PROCESS.md:151-152`, `.claude/agents/webcomponents-supervisor.md:46-47` and `.claude/agents/infra-supervisor.md:47-48`. R19-L1-02/L2R19-02: §4 and plan §4.0 cite PROCESS §4, §6 for `git-workflow-manager` opening the PR. R19-L1-03: each P, C, G, D and S owner is the accountable supervisor and Z rows name the main session (§4, plan §4.0); the catch-all row goes to the accountable owner. L3R19-02: the catch-all row names `packages/*/LICENSE`. L2R19-03: the §4.1 `lint-layers` sentence compares the two devDependencies. L2R19-04: SD38 cites ARCH §17.3, §17.9, not §17.4. L3R19-01: AM-025's L3R18-02 clause should read §7.3, not §6.G.4; AM-025 stays as the historical record. The header names AM-001–AM-026 | The round-18 rule named only the main session as dispatcher, left the second supervisor's changeset and the Z owner open, cited PROCESS §4 for a PROCESS §6 rule, gave `LICENSE` two possible rows, and left three agent files and two changeset lines outside the ledger-PR alignment; SD38 and AM-025 named the wrong sections | agent R19LensPlanPRD (R19-L1-01 to R19-L1-03); agent R19LensSpecResearch (L2R19-01 to L2R19-04); agent R19LensSpecArch (L3R19-01 to L3R19-03); `.claude/agents/sdlc.md:42`; `.claude/agents/webcomponents-supervisor.md:3, :46-47, :109`; `.claude/agents/infra-supervisor.md:3, :47-48, :108`; `docs/PROCESS.md:75, :79-82, :150-152, :161-162`; `docs/ARCHITECTURE.md:1533, :1538, :1638` |
| AM-027 | 2026-10-21 | ledger 00-Z48 (factual corrections, coherence review round 20) | Factual edits, no design change. R20-L1-01: the ledger-PR alignment list in §6.Z and plan §4.0, §4.6 and §10 step 6 adds the supervisor escalation lines that route to the other supervisor, `.claude/agents/webcomponents-supervisor.md:111` and `.claude/agents/infra-supervisor.md:107`, aligned to route through the orchestrator (main session or `sdlc`), which dispatches the other supervisor on the same task branch. L3R20-02: the accountable supervisor writes the changeset entry last, after the other dispatch returns, and names every published package the branch changed (§4, §6.Z; plan §4.0). L3R20-03: the P3 acceptance runs `changeset version` with one `minor` changeset for each of the nine packages in the §7.2 table. L2R20-01: §6.G.7 cites R6 §6 Q2 option (a), SD64 and AM-016 for the Vite bundling. L2R20-02: §6.G.3 cites R3 §5 item 3 for the self-imposed cap. L3R20-01 is rejected: a probe shows the `preview.ts` JSON manifest import type-checks without `resolveJsonModule`; §6.P.10 records this. The header names AM-001–AM-027 | The round-19 alignment list left out the escalation lines that send work straight to the other supervisor, the changeset timing was open, the P3 check did not say which changesets it runs, and two citations named research that does not state the fact | agent R20LensPlanPRD (R20-L1-01); agent R20LensSpecResearch (L2R20-01, L2R20-02); agent R20LensSpecArch (L3R20-01 rejected, L3R20-02, L3R20-03); orchestrator probe 2026-10-21 (tsc 5.9.3 and TypeScript 7.0.2 exit 0 on `import manifest from 'pkg/custom-elements.json' with { type: 'json' }` under `tsconfig.base.json` with `moduleResolution: bundler` and no `resolveJsonModule`, and report TS2322 on a wrong-type assignment); `.claude/agents/webcomponents-supervisor.md:111`; `.claude/agents/infra-supervisor.md:107`; `docs/research/01-research-transports.md:254`; `docs/research/01-research-descriptor-api.md:181, :268` |
| AM-028 | 2026-10-21 | ledger 00-Z48 (decision: Miguel, SD76 peer range) | L3R21-01: `line-genui` declares `@websublime/line-components` and `@websublime/line-icons` as `"workspace:^0.1.0 \|\| ^0.2.0"` in `peerDependencies` and `devDependencies` (§4.1, §5, §6.P.1). P3 sets `___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH.onlyUpdatePeerDependentsWhenOutOfRange: true` in `.changeset/config.json` unconditionally (§5, §6.P.3, §7.2). Each later phase that moves either package to a new minor widens the range in the same PR, for example `\|\| ^0.3.0` (§4.1, §7.2, §8). P3 acceptance adds a snapshot dry run that yields `line-genui` at a `0.2.0-` prerelease, and P4 step 2 points to it. §7.2, §8 and SD76 drop the fallback that set the flag only after a major bump. Rejected: the open lower bound `workspace:>=0.1.0`, which gives no npm warning on an incompatible version, and accepting `line-genui` 1.0.0, which contradicts PRD §7.1 and the nine `0.2.0` versions (plan §7.4; §10 SD75) | The round-21 review found that Changesets reads `workspace:^` as `^0.1.0` and bumps `line-genui` to 1.0.0 when its peers reach 0.2.0, with or without the flag. The P3 acceptance could not pass, the SD76 fallback changed nothing, and the P4 canary would be a `1.0.0-` prerelease | agent R21LensSpecArch (L3R21-01; snapshot probe gave `line-genui` `1.0.0-<sha>-SNAPSHOT` with `workspace:^`; Bun 1.4.3 installs the range and links the workspace package); Miguel's decision of 2026-10-21; orchestrator probe 2026-10-21 (`@changesets/cli` 2.31.1, Bun 1.4.3: `workspace:^` gave 1.0.0 with and without the flag; `workspace:^0.1.0 \|\| ^0.2.0` gave 1.0.0 without the flag, with the peer rewritten to `workspace:^0.2.0`, and 0.2.0 with it; `workspace:>=0.1.0` gave 0.2.0 with it); `@changesets/assemble-release-plan` 6.0.10 `src/determine-dependents.ts:217-219, :266-269`; `@changesets/config` 3.1.4 `dist/changesets-config.cjs.js:355`; `@changesets/types` 6.1.0 `src/index.ts:120, :124`; `.changeset/config.json:14, :16-19`; `package.json:30`; `scripts/verify-pack.mjs:60-64`; PRD §7.1 ("Major 1.0.0: When all phases are complete") |
| AM-029 | 2026-10-21 | ledger 00-Z48 (factual corrections, coherence review round 21) | Factual edits, no design change. R21-L1-01: the ledger-PR alignment list in §6.Z and plan §4.0, §4.6 and §10 step 6 adds the `sdlc` Handoffs lines `.claude/agents/sdlc.md:57-58`, aligned so the §4 file-class table decides which supervisor edits each file. R21-L1-02: the §6.C.0 row sequence and plan §4.3 put the CEM entry (step 5) before the changeset (step 6), so the changeset entry comes last. R21-L1-03: plan §5.6 D3 cites R3 §2.6, §2.7 and §5 item 3 for the self-imposed cap. The header names AM-001–AM-029 | The round-21 review found that the alignment list left out the `sdlc` Handoffs lines, which route work by area and conflict with the §4 table, that the row sequence put the changeset before a source edit, and that AM-027 fixed the R3 citation in the spec only | agent R21LensPlanPRD (R21-L1-01 to R21-L1-03); `.claude/agents/sdlc.md:14, :52, :57-58`; `docs/PROCESS.md:151`; `docs/research/01-research-descriptor-api.md:181, :220, :268` |
| AM-030 | 2026-10-21 | ledger 00-Z48 (factual corrections, coherence review round 22) | Factual edits, no design change; corrects the facts around AM-028 and keeps its decision. R22-L1-01/L2R22-03/L3R22-02: §4.1, §7.2, §8, SD76 and plan §2.7 time the widening duty: the first PR of a later phase that adds a `minor` changeset for `line-components` or `line-icons` widens the peer ranges on `main` before `changeset version` builds that phase's Version PR. §7.2 replaces "The P3 dry run and the snapshot path catch a miss": a miss gives `line-genui` 1.0.0 and a `1.0.0-<sha>-SNAPSHOT` canary, no script fails on it, and the Version PR reviewer checks the `line-genui` version; §6.Z.2 requires the Phase 2 hand-off to name the duty. R22-L1-02/L2R22-01/L3R22-01: §4.1 and §7.2 state the ranges at P1; the Phase 1 Version PR keeps the peers and rewrites the two `devDependencies` to `workspace:^0.2.0`, and a canary pins both to the snapshot version; the widening duty covers the peers. R22-L1-03/L2R22-04: SD76 adds that the `^0.1.0` arm keeps `bun install` working before the Version PR and that the published range admits the 0.1.x peers, so it differs from `>=0.1.0` only for later minors. L2R22-02: the §6.P.3 dry runs set `changelog: false` in the copy, as R9 §2.6 did, or leave the changesets uncommitted. The header names AM-001–AM-030 | The round-22 review found that "in the same PR" named no PR, that no check catches a missed widening, that the Version PR rewrites the `devDependencies` the spec said keep the peer range, that the SD76 rationale omitted why the `^0.1.0` arm stays and what it admits, and that the dry runs fail under `@changesets/changelog-github` without a token | agent R22LensPlanPRD (R22-L1-01 to R22-L1-03); agent R22LensSpecResearch (L2R22-01 to L2R22-04); agent R22LensSpecArch (L3R22-01, L3R22-02); lens probes 2026-10-21 (`@changesets/cli` 2.31.1, Bun 1.4.3); `.changeset/config.json:13`; `@changesets/apply-release-plan` 7.1.1 `src/utils.ts:69-80`, `src/version-package.ts:109-112`; `scripts/publish.mjs:39, :135-136, :144-145`; `docs/research/01-research-packaging.md:291-292` (R9 §2.6) |
| AM-031 | 2026-10-21 | ledger 00-Z48 (decision — Miguel chose visual regression in Phase 1, with Playwright `toHaveScreenshot` over the Storybook stories in Chromium only and baselines generated on the CI Linux runner and committed, over deferring it to Phase 2 and over three engines; and keyboard navigation tested in the Playwright Browser tier, with `storybook/test` play functions kept in stories as documentation, over play functions run by the Storybook test-runner: L3R23-10; the P11 file layout, project, workflow and baseline procedure as orchestrator defaults for Miguel's review at the 00-Z48 PR) | New task P11 (§6.P.11), owned by infra-supervisor, blocks C1 as P7 does: `playwright.config.ts` gains a `visual` project that matches `packages/line-components/__tests__/visual/*.visual.ts` in Chromium only and runs in the existing "Browser tier" step against `storybook-static` (port 4320); `__tests__/visual/story.ts` opens a story and takes its screenshot; `.github/workflows/visual-baselines.yml` runs on `workflow_dispatch` on `ubuntu-latest`, runs the project with `--update-snapshots` and uploads the baselines as an artifact that the PR author commits; each C1–C20 row adds `<c>.visual.ts` and its `-visual-linux.png` baselines. The §4 package-source row, §5, §6.C.0 step 1, the §6.C.4 Deps column (P7–P11), §6.C.6 obligations and stream acceptance, the §7.8 Visual row, the §9.1 italic criterion, SD86 and new SD98 state it. SD78 covers the axe runner only, so new SD99 records the Browser tier for keyboard navigation, and §6.C.6 and §7.8 cite it. The §10 intro names Decision rows. PRD v0.8.25 revises the §5.2 A11y and Interaction rows and lists `visual-baselines.yml` in §6.5; plan §2.6, §4.0, §4.2, §6 and §7.1 follow. ARCHITECTURE states no testing-tier rule, so AM-031 changes nothing there | The round-23 review found that PRD §5.2 put keyboard navigation in the Interaction row and listed a Visual Regression layer, while §7.8 tested keyboard in the Browser tier and had no visual tier, and that Phase 00 spec D3 had deferred visual regression to Phase 1 | agent R23LensSpecArch (L3R23-10); Miguel's decisions of 2026-10-21; PRD §5.2; `docs/specs/00-spec-design-system.md:2636-2642` (Phase 00 spec D3); `playwright.config.ts:5, :15-20, :22-26`; `playwright` 1.64.0 `lib/common/index.js:599`, `lib/worker/workerProcessEntry.js:1255`, `lib/index.js:356`; `.github/workflows/checks.yml:9, :42-43`; `.github/workflows/deploy-site.yml:27`; `apps/storybook/__tests__/storybook-smoke.e2e.ts:69`; `package.json:23, :25` |
| AM-032 | 2026-10-21 | ledger 00-Z48 (factual corrections and orchestrator defaults, coherence review round 23; L3R23-01 to L3R23-04 as orchestrator defaults for Miguel's review at the 00-Z48 PR) | L3R23-01: the §6.P.3 dry runs set `changelog: false` in the copy or run with `GITHUB_TOKEN` set; "or with the changesets left uncommitted" is dropped, because P1's committed changeset still triggers the token error. This corrects the L2R22-02 text of AM-030. L2R23-01: the snapshot dry run runs in a fresh copy, or the copy reset to its state before `changeset version`. L3R23-02: §6.P.4 states that step 2 is the first `snapshot-deploy` run after P1 merges and that no other run happens before it; P6 Deps add P4 step 2; plan §4.2 and §6 follow. L3R23-03: the CEM module-path check, which P10 never carried, moves to C1 (`packages/line-components/__tests__/manifest-paths.test.ts`, §6.C.6) and G4 (the `line-genui` case); §5, §7.3 and §8 point to them. L3R23-04: G4 names the properties `urlPolicy`, a consumer policy applied after the default that can only reject, and `markdownRenderer`, typed `(markdown: string) => Node`, which the surface calls itself instead of `web_core` `setMarkdownRenderer`; both join the JSDoc list, two acceptance items check them, SD57 and SD58 name them, and D1 documents them. L3R23-05/R23-L1-03: Z3 acceptance and the §9.4 check require the hand-off to name the SD76 widening duty. L3R23-06: §4 says P8 changes no script in the `tsc -b` packages. L3R23-07: G4 registers the `line` catalog under the SD42 id, always on, with an acceptance item. L3R23-08: G7 adds the A2A metadata capabilities, the MCP `tools/call` and SSE POST outbound paths and an acceptance item, and the MCP Apps View block adds the `applyHostStyleVariables` and `applyDocumentTheme` docs line. L3R23-09: C23 writes the attribute with ``toggleAttribute(`data-${name}`, active)``, removes the `form-associated.ts:125-142` override and the `dataset` sentences of its doc comment (`:59-64`), and adds a three-engine `focus-visible` case; §5 names the change; ARCH v0.8.11 §14.8 matches. L3R23-11: the §4.2 comment says "C2 tests only", and the C2 type-level example exports `r`. L3R23-12: the §7.1 `line-genui` row says P1 writes the scripts and P8 changes nothing. L3R23-13: D3 acceptance checks the CDN snippets against the URL form the P6 pages prove. L3R23-14: live Phase 00 AM numbers read "Phase 00 spec AM-0nn" (§4.1, §6.C.1, §6.C.6, §6.P.4); the quoted step name "Pack verification (AM-036)" (`.github/workflows/checks.yml:26`) stays. L3R23-15: ARCH v0.8.11 corrects §5, §10 and §14.4. R23-L1-02: §7.2, §8 and plan §2.7 name Miguel, who merges the Version PR, as the one who checks the `line-genui` version. R23-L1-04/L2R23-02: SD76 says the range differs from `>=0.1.0` for every version from 0.3.0 up; the AM-030 row stays as the record. R23-L1-01 is plan only (Status). The header names AM-001–AM-032 and cites PRD v0.8.25 and ARCH v0.8.11 | The round-23 review found that uncommitted changesets do not avoid the token error, that the snapshot dry run cannot reuse a consumed copy, that `snapshot-deploy` runs before P4 step 2 would fail at `line-genui`, a module-path check owned by a task that never ran it, unnamed URL-policy and Markdown hooks, an unchecked hand-off duty, an unregistered `line` catalog, missing outbound paths, a `dataset` write that throws for `focus-visible`, an incomplete SD76 comparison, an undefined Version PR checker and stale wording | agent R23LensPlanPRD (R23-L1-01 to R23-L1-04); agent R23LensSpecResearch (L2R23-01, L2R23-02); agent R23LensSpecArch (L3R23-01 to L3R23-09, L3R23-11 to L3R23-15); lens probes 2026-10-21 (`@changesets/cli` 2.31.1 token error with a committed changeset; Chromium `dataset['focus-visible']` `SyntaxError`; Biome `noUnusedVariables`); `.changeset/config.json:3-8`; `.github/workflows/snapshot-deploy.yml:2`; `scripts/publish.mjs:170, :178, :192-195`; `packages/line-core/src/mixins/form-associated.ts:59-64, :125-142`; `packages/line-core/src/line-element.ts:12-13`; `biome.json:33`; `docs/research/01-research-a2ui-web-core.md:92` (R1 §2.3, `setMarkdownRenderer`); `docs/research/01-research-mcp-apps.md:116-117` (R5 §2.3); ARCH §5, §10, §14.4, §14.8, §17.4, §17.5, §17.6 |
| AM-033 | 2026-10-21 | ledger 00-Z48 (decision — Miguel chose, for PRD §5.2.1, that P11 baselines the `Design System/Roles` story under every `(accent, gray, mode)` combination through the Storybook `accent` and `gray` globals, with the default pairs on every PR as a merge gate and the off pairs in a `workflow_dispatch` run before each release, non-gating for PRs and recorded in the release PR, over every combination on every PR and over deferring §5.2.1: R24-L1-01, L2R24-01, L3R24-02) | §6.P.11 adds `roles.visual.ts` (31 accents with the auto-pair gray, light and dark: 62 baselines, gating, URL `&globals=accent:<hue>&args=mode:<mode>`) and `roles.off-pairs.visual.ts` (31 accents with each of the six grays set explicitly, light and dark: 372 baselines, URL `&globals=accent:<hue>;gray:<gray>&args=mode:<mode>`), over `design-system-roles--toolbar` with full-page screenshots; the `visual` project ignores `*.off-pairs.visual.ts` unless `LINE_VISUAL_OFF_PAIRS` is set; `visual-baselines.yml` sets it so it writes every baseline; new `visual-off-pairs.yml` runs the comparison before each release; a Contract item and an acceptance item. The story is `Toolbar` and not `Bindings`: `Bindings` renders every accent panel in its own `data-accent` scope (`roles.stories.ts:36-41`), so the globals change only its root-scoped parts, while the `Toolbar` roles sit at the preview root and follow the globals (`:88-99`). Light and dark are the story's `mode` arg (`:63-66`), not a global. §5, the §4 package-source row, the §7.8 Visual row, the §9.1 criterion and SD98 state it; plan §2.6, §4.2 and §7.1 follow. The PRD text does not change | The round-24 review found that PRD §5.2.1, which Phase 00 D3 deferred to Phase 1, had no Phase 1 owner: P11 baselined component stories once, at the default globals | agent R24LensPlanPRD (R24-L1-01); agent R24LensSpecResearch (L2R24-01); agent R24LensSpecArch (L3R24-02); Miguel's decision of 2026-10-21; PRD §5.2.1 (`docs/PRD.md:543-547`); orchestrator probe 2026-10-21 on `storybook-static` (Storybook 10.6.2, `playwright` 1.64.0): `&globals=accent:indigo;gray:sand` set `data-accent="indigo"` and `data-gray="sand"` on `<html>`, `&args=mode:dark` set `color-scheme: dark`, `&globals=accent:crimson` changed the `Toolbar` screenshot; `apps/storybook/.storybook/preview.ts:19-29, :52`; `packages/line-schemas` `ACCENT_HUES` (31) and `GRAY_HUES` (6) |
| AM-034 | 2026-10-21 | ledger 00-Z48 (factual corrections and orchestrator defaults, coherence review round 24; L2R24-02/L3R24-01, R24-L1-02, L2R24-04/L3R24-03 and L3R24-05 as orchestrator defaults for Miguel's review at the 00-Z48 PR) | L2R24-02/L3R24-01: P11 lands in two PRs of its row. The first adds the `visual` project, `story.ts`, both workflows and the `.gitignore` lines and commits no `.visual.ts` file, so the `visual` project runs no test and `playwright test --pass-with-no-tests` passes. After it merges, the checks that need a dispatch run on a throwaway branch made from `main` and are recorded in the P11 ledger row, as 00-F3 did. The second PR commits the Roles files with their baselines from a dispatch on its branch, so no `.visual.ts` file lands without baselines; both PRs merge before C1. R24-L1-02: off Linux the Verify record runs `bun run e2e --ignore-snapshots`, the CI "Browser tier" run is the visual evidence, and `.gitignore` ignores `-visual-darwin.png` and `-visual-win32.png` under `*.visual.ts-snapshots/`; an acceptance item checks it. L2R24-04/L3R24-03: the C23 `LineElement` body keeps the `states` guard (`states?.add`, `states?.delete`), so `form-associated.test.ts:134-141` keeps passing; an acceptance item names it; ARCH v0.8.11 §14.8 matches. L3R24-05: a throw from `urlPolicy` counts as `false`; a throw or a non-`Node` from `markdownRenderer` renders the value as plain text and raises `line-a2ui-error`; one acceptance item each. L2R24-03: §6.P.11 names both config patterns, `packages/**/*.e2e.ts` and `apps/**/*.e2e.ts`. L3R24-04: ARCH v0.8.11 gives `packages/line-core/src/styles/` in §14.3 and §14.5. The header names AM-001–AM-034 | The round-24 review found that P11's acceptance needed a dispatch of a workflow not yet on `main`, that a local Browser tier run off Linux fails and leaves `-visual-darwin.png` files, that removing the mixin override dropped the `states` guard a unit test covers, that the two consumer hooks had no failure rule, and two stale paths | agent R24LensPlanPRD (R24-L1-02); agent R24LensSpecResearch (L2R24-02 to L2R24-04); agent R24LensSpecArch (L3R24-01, L3R24-03 to L3R24-05); GitHub docs on `workflow_dispatch` (the workflow must be on the default branch); `docs/context/00-f3.md:31-32, :84-89`; orchestrator probes 2026-10-21 (`playwright` 1.64.0, darwin: a missing baseline under `CI=1` exits 1 with "A snapshot doesn't exist at …-visual-darwin.png, writing actual." and writes that file; `--ignore-snapshots` exits 0 and writes none; `LINE_VISUAL_OFF_PAIRS` `testIgnore` in `--list`; `git check-ignore` on the two patterns; Bun: an unguarded `states.add` on internals without `states` throws `TypeError`); `playwright.config.ts:5`; `package.json:25`; `packages/line-core/src/mixins/form-associated.ts:135`; `packages/line-core/__tests__/form-associated.test.ts:134-141`; `packages/line-core/src/styles/` |
| AM-035 | 2026-10-21 | ledger 00-Z48 (factual corrections and orchestrator defaults, coherence review round 25; R25-L1-01, L2R25-01, L3R25-01 to L3R25-03 as orchestrator defaults for Miguel's review at the 00-Z48 PR; AM-031 and AM-033 decisions unchanged) | R25-L1-01: P11 no longer lands in two PRs of one row. P11 keeps the `visual` project, `story.ts`, both workflows and the `.gitignore` lines and still blocks C1; new task P12 (§6.P.12, owner infra-supervisor, Deps P11) adds `roles.visual.ts`, `roles.off-pairs.visual.ts` and their baselines, blocks no C row, and lands before the Phase 1 exit (§9.1). The checks that need the workflows on `main` move to P12: they run on a throwaway branch made from `main` before the P12 PR opens, and the P12 PR Verify record (PROCESS §5) records them. C1–C20 keep Deps P7–P11. §4 table, §5, §6.P.11, §6.C.0, §6.C.6, §7.8, §9.1, SD86 and SD98 follow; plan §4.2, §6 and Status follow. L2R25-01: the off-pair file covers each accent with each of the five `GRAY_HUES` that are not its auto pair, light and dark: 310 baselines, not 372. L3R25-03: each Roles call passes `name` `` `toolbar-${accent}-${gray ?? 'auto'}-${mode}.png` ``, so each combination has its own baseline. L3R25-02: the `--list` and macOS acceptance items move to P12, with `roles.visual.ts` present. L3R25-01: the throwaway-branch pass and fail are each shown by a `visual-off-pairs.yml` dispatch on that branch. R25-L1-02/L2R25-02: PRD v0.8.26 adds `visual-off-pairs.yml` to the §6.5 workflow tree and says in §5.2 and §5.2.1 that Phase 00 spec D3 deferred the visual strategy to Phase 1 and that §10 SD98 defines it; this supersedes AM-033's "The PRD text does not change"; the spec and plan "Source PRD" headers name v0.8.26. L2R25-03: SD98 cites `roles.stories.ts:89-101` for `Toolbar` (AM-033 keeps its `:88-99` as record). L2R25-04: §6.P.11 Timing cites GitHub's "Manually running a workflow" page beside `00-f3.md:31-32`. The header names AM-001–AM-035 | The round-25 review found that two PRs on one row break PROCESS §6 (the first merge flips P11 to `done` and makes C1 Ready before the Roles PR lands), that 62 of the 372 off-pair screenshots were default pairs, that the Roles calls shared one baseline name, that two first-PR acceptance items checked nothing, that the throwaway-branch item named no comparing run, and that the PRD omitted `visual-off-pairs.yml` and still gave the strategy to the Phase 0 spec | agent R25LensPlanPRD (R25-L1-01 to R25-L1-03); agent R25LensSpecResearch (L2R25-01 to L2R25-04); agent R25LensSpecArch (L3R25-01 to L3R25-03); `docs/PROCESS.md:130-140, :159`; PRD §5.2.1 (`docs/PRD.md:548`, "a non-auto-paired gray with a given accent"); `packages/line-schemas/src/hues.ts:67` (six `GRAY_HUES`); `packages/line-themes/src/defaults.css` (every `:not([data-gray])` auto pair maps to one of them); `docs/specs/00-spec-design-system.md:2636-2642` (D3); `apps/storybook/stories/design-system/roles.stories.ts:89-101`; `.github/workflows/checks.yml:2` (`on: [pull_request]`); GitHub docs, "Manually running a workflow" ("To trigger the `workflow_dispatch` event, your workflow must be in the default branch") |
| AM-036 | 2026-10-21 | ledger 00-Z48 (factual corrections and orchestrator defaults, coherence review round 26; R26-L1-01, R26-L1-02 and R26-L1-03 as orchestrator defaults for Miguel's review at the 00-Z48 PR; AM-031 and AM-033 decisions unchanged) | R26-L1-01 (L3R26-01): AM-035 let P12 land at any point before the Phase 1 exit, so PRs could merge with no default-pair gate, against AM-033 and SD98. P12 now blocks C1: P11 → P12 → C1, and the default pairs gate every PR from C1 on. C1–C20 Deps become P7–P12; §6.P.12, §6.C.0 step 1 (eight tasks), §6.C.6, SD86 and SD98 follow; plan §4.2, §6 graph and sequence follow. R26-L1-02: P4 changed no repository file, so under PROCESS §5–§6 it had no PR, no Verify record and no `done` flip (`docs/PROCESS.md:116`, `:130-140`, `:159`). P4 now covers §6.P.4 steps 1–5 and its PR adds `docs/context/01-p4.md` with the evidence, as `docs/context/00-f3.md:85-90` records the Phase 00 bootstrap. New row P13 (§6.P.13, owner infra-supervisor with Miguel for the npmjs.com steps, Deps P4) covers steps 6 and 7, adds `docs/context/01-p13.md`, and lands within the 48 hours before the Phase 1 Version PR merge. P6 Deps become P4, C1, C2, and the canary condition moves to P6 prose. §5, §6.C.6, §9 and plan §4.2 and §6 follow. R26-L1-03: the exit sweep is not a row; its findings become new rows, as the Phase 00 sweep filed C18 (`docs/plans/00-tasks-design-system.md:53`), and Z3's Deps are every other Phase 1 row; §6.Z.2, §9, SD87 and plan §4.6, §7.4 and §10 step 7 follow. The plan Status records round 26. R26-L1-05/L3R26-02: the P11 `--list` sentence defers to P12 and drops "only". R26-L1-06/L2R26-01/L3R26-03: the P12 throwaway-branch item commits the downloaded baseline before the `visual-off-pairs.yml` dispatch. R26-L1-07/L2R26-02/L2R26-03/L3R26-04: the §9.1 visual check cites §6.P.11 and §6.P.12; AM-035's list of followers omitted plan §2.6, which the same commit changed. R26-L1-04/L3R26-06: AM-035 and PRD v0.8.26 named "§5.2" for the Visual regression row; the row and coverage contract that changed are in §5.2.1 (`docs/PRD.md:529`, `:541`, `:544`), and the PRD v0.8.26 entry, unmerged, now says so. L3R26-05: §6.P.7 cites `playwright.config.ts:15-20`. | The round-26 review found that AM-035 dropped the AM-033 order that put the Roles default-pair gate before C1, that P4 changed no file and so could have no PR, Verify record or `done` flip, that Z3 carried two dependency sets in one `Deps` field, that the P11 `--list` sentence described P12, that the throwaway-branch item never committed its baseline, that §9.1 and AM-035 left out §6.P.12 and plan §2.6, that AM-035 and PRD v0.8.26 named §5.2 for a §5.2.1 change, and that §6.P.7 cited `playwright.config.ts:17-21` | agent R26LensPlanPRD (R26-L1-01 to R26-L1-07); agent R26LensSpecResearch (L2R26-01 to L2R26-03); agent R26LensSpecArch (L3R26-01 to L3R26-06); `docs/PROCESS.md:116` ("No record, no PR"), `:130-140`, `:159`; `docs/context/00-f3.md:85-90`; `docs/plans/00-tasks-design-system.md:53` ("found by the Phase 00 exit sweep"); `docs/PRD.md:529` (`#### 5.2.1`), `:541`, `:544`; `playwright.config.ts:15-20` |
| AM-037 | 2026-10-21 | ledger 00-Z48 (factual corrections and orchestrator defaults, coherence review round 27; R27-L1-02, R27-L1-03, R27-L1-04 and R27-L1-06 as orchestrator defaults for Miguel's review at the 00-Z48 PR; corrects the AM-036 P4/P13 split) | R27-L1-01 (L2R27-01): the token lock is now §6.P.4 step 6, run once step 5 succeeds, and the `release.yml` publisher is step 7. P4 covers steps 1–6 and `docs/context/01-p4.md` records them; P13 is step 7 only, retitled "Release trusted publisher". "Token publishing disallowed" moves to P4 Acceptance, and P13 keeps two trusted publishers. R27-L1-02 (L2R27-03): P13 Deps become every other Phase 1 row except Z3, the sweep-finding rows included, as Z3's Deps are written; the 48-hour Timing line stays, and Z3 still depends on P13. R27-L1-04 (L2R27-02, L3R27-01): step 5 runs from a `main` commit merged after step 2; a dispatch at the step 2 commit computes the same versions and uploads nothing. Step 4 runs when another row's merge to `main` is due within 48 hours, and the P4 PR is opened after step 6. R27-L1-03: S1 Deps become C1–C4 [INFERENCE], S1 is one PR, and a section that needs another component adds its C row through an AM; §6.S.1 and plan §2.8, §4.5 and §6 drop the per-section start. PRD §7.3 "Parallel… runs beside the component work" still holds. R27-L1-05: §6.P.13 cites Version PR #218 and row `00-Z7` for the Version PR having no row. R27-L1-06 (L3R27-03): P6 Acceptance records both runs in the P6 PR Verify record and a new `cdn-check.yml` run in each release PR; §7.2 names Miguel, who merges the Version PR, as owner of the CDN runs, the off-pair run and the live provider calls, and §6.G.3 follows. R27-L1-07 (L3R27-04): §6.Z.2 heading "Z3 — Phase 1 retrospective"; SD87 rejected option "The sweep as Z3's own work, with two dependency sets in one Deps field"; plan §4.0 Z row follows. R27-L1-08: plan §6 step 4 lists C21 and C23 before P12. L2R27-04: AM-036's R26-L1-02 follower list names §6.C.6 where the changed line is §6.G.0; the AM-036 row stays as written. L2R27-05: SD55 cites R1 §2.7, §6 Q9. L2R27-06: SD84 cites R8 §2.2, §6 Q1, Q7. L2R27-07: §6.C.5 cites R7 §2.1 for `@zag-js/toggle` 1.46.0. L3R27-02: the P6 Deps reason names the `snapshot-deploy.yml` trusted publisher. L3R27-05: §6.P.4 says `docs/context/00-f3.md:85-90` listed the Phase 00 steps and row 00-F10 recorded their evidence. §5, §6.P.4, §6.P.6, §6.P.13, §6.G.3, §6.S.1, §6.Z.2, §7.2, SD55, SD84, SD87 and plan §2.8, §4.0, §4.2, §4.5, §6 and Status follow. The header names AM-001–AM-037 | The round-27 review found that AM-036 put the token lock after the `release.yml` publisher, against the AM-038 order; that P13 was Ready from the P4 merge on, while its publisher expires 48 hours after creation; that step 5 at the step 2 commit publishes nothing; that S1 had no Deps list of rows; that P6 Acceptance named a release PR that does not exist at the P6 merge and the release-time records had no owner; that the Z3 heading still named the sweep; and eight smaller locator and wording errors | agent R27LensPlanPRD (R27-L1-01 to R27-L1-08); agent R27LensSpecResearch (L2R27-01 to L2R27-07); agent R27LensSpecArch (L3R27-01 to L3R27-05); `docs/specs/00-spec-design-system.md:2482` ("(6) Once step (5) succeeds, Miguel sets … Require two-factor authentication and disallow tokens"; "(5) … a `snapshot-deploy.yml` run from a new `main` commit"), `:517` (AM-040, "any token with write access to `@websublime` can still publish until the packages disallow tokens"), `:519` (AM-042, row `00-F10`); `docs/research/01-research-packaging.md:245` (48-hour expiry), `:270` ("OIDC canary within 48 h, then 'Require 2FA and disallow tokens'"); `.changeset/config.json:18` (`"prereleaseTemplate": "{commit}-SNAPSHOT"`); `scripts/publish.mjs:186` ("already published; skipping upload"), `:194` (`if (published && !opts.dryRun) continue;`); `docs/plans/00-tasks-design-system.md:121` (row Z7, "Miguel then merges Version PR #218"); `docs/PRD.md:921` |
| AM-038 | 2026-10-21 | ledger 00-Z48 (factual corrections and orchestrator defaults, coherence review round 28; R28-L1-01, L3R28-01 to L3R28-04 and the AM-number prefix as orchestrator defaults for Miguel's review at the 00-Z48 PR) | R28-L1-01: §6.P.13 Timing adds that P13 starts after the exit sweep has run and its rows are done, and after Miguel has recorded the release-time runs on `main` (§7.2); if the Version PR does not merge within 48 hours of step 7, Miguel recreates the `release.yml` trusted publisher before the merge (Phase 00 spec §7.2). The §7.2 release-time bullet adds the recreate duty. L3R28-01: P4 Acceptance reads `npm view @websublime/line-genui@<step 5 version> dist.attestations` for the provenance attestation and checks that `dist-tags.canary` is that version, because `latest` stays on the step 2 canary. L3R28-02: P13 Deps leave out D3 ("every other Phase 1 row except D3 and Z3"); §6.D.3 gains a Timing line: D3 lands after the Phase 1 Version PR merges, so its install snippets and pinned CDN URLs point at the published `0.2.0`. L3R28-03: §6.P.13 Changes add a `minor` changeset for each package that no merged Phase 1 changeset names (§7.2; §10 SD75), which the §4 catch-all row covers; P13 Acceptance adds `bun run changeset status` listing all nine packages at `minor`. L3R28-04: §6.Z.2 gains a Timing line: Z3 lands after the Phase 1 Version PR merges, because it depends on D3. R28-L1-02/L2R28-01/L3R28-05: §6.P.6 Changes read "Before each release Miguel dispatches it and records the run in the release PR", and the §6.P.11 Baseline procedure has Miguel record the `visual-off-pairs.yml` run (§7.2). L2R28-02: SD68 Evidence cites R5 §5.2. AM numbers: this spec now has its own AM-038, so the §6.P.4 step 6 source reads "Phase 00 spec AM-040"; plan §1.2, §2.1, §2.3, §2.6, §4.2, §4.3 and §5.6 write their Phase 00 spec AM numbers as "Phase 00 spec AM-0nn"; PRD v0.8.26 §7.3 item 10 reads "the Phase 00 spec AM-038 order" and its v0.8.26 note records it. Plan §4.2 P13, §4.4 D3, §6 graph and §6 sequence follow. The header names AM-001–AM-038 | The round-28 review found that the Version PR could be delayed past the 48-hour life of the `release.yml` publisher with no one owning its recreation; that the P4 acceptance read the `latest` tag, which stays on the token-published step 2 canary; that D3 had to merge before `0.2.0` existed on npm; that no row wrote the SD75 changesets for packages no Phase 1 branch changes; that Z3's place relative to the Version PR was unstated; that §6.P.6 still named "A maintainer"; that SD68 left out R5 §5.2; and that a new AM-038 here would collide with bare Phase 00 spec AM-038 citations | agent R28bLensPlanPRD (R28-L1-01, R28-L1-02); agent R28bLensSpecResearch (L2R28-01, L2R28-02); agent R28bLensSpecArch (L3R28-01 to L3R28-05); `docs/specs/00-spec-design-system.md:2482` ("created on each package within the 48 hours before the Version PR is merged, and recreated if they expired"); `npm view @websublime/line-core dist-tags --json --registry=https://registry.npmjs.org` (2026-10-21: `canary` `0.1.0-1b3a3c23ab5af04c04e30f2b939a39f7f98c11b0-SNAPSHOT`, `latest` `0.1.1`); `npm view @websublime/line-core@0.1.0-1b3a3c23ab5af04c04e30f2b939a39f7f98c11b0-SNAPSHOT dist.attestations --json` (2026-10-21: `provenance.predicateType` `https://slsa.dev/provenance/v1`); `package.json:19` (`"changeset": "changeset"`), `:28` (`"status": "changeset status --since=main"`); `bun run changeset status` (2026-10-21: "NO packages to be bumped at minor"); spec §4 catch-all row ("the task's changeset entry"); `docs/research/01-research-mcp-apps.md:255-259` (R5 §5.2) |
| AM-039 | 2026-10-21 | ledger 00-Z48 (factual corrections, coherence review round 29) | Factual edits, no design change; corrects AM-038's changeset rule. R29-L1-01/L2R29-01/L3R29-01: AM-038 added to P13 a `minor` changeset only for each package that no merged Phase 1 changeset names, so a package with only `patch` changesets would stop at `0.1.x`; §6.P.13 Changes, §7.2 and plan §4.2 P13 now add a `minor` changeset for each package that the merged Phase 1 changesets do not bump at `minor` (`bun run changeset status`). Phase 00 precedent: Version PR #218 bumped `line-themes` and `line-components` only to `0.0.1` because their pending changesets were all `patch`, and row `00-Z6` fixed it (`docs/plans/00-tasks-design-system.md:120`). R29-L1-02/L3R29-02/L2R29-02: §6.D.3 Deps and plan §4.4 add that D3's ledger row stays `blocked` until the Phase 1 Version PR merges, as Phase 00 row `00-Z29` is `blocked` on an outside event (`docs/plans/00-tasks-design-system.md:143`; plan §4.6); Z3 depends on every other Phase 1 row, D3 included, so Z3 stays not Ready until D3 is done (§6.Z.2). R29-L1-03/L2R29-03: plan §1.2, §5.4 O1, §5.4 O4.a and §8 write the remaining Phase 00 spec AM numbers (AM-063, AM-064, AM-067) as "Phase 00 spec AM-0nn" |
| AM-040 | 2026-10-21 | ledger 00-Z48 (factual corrections and orchestrator defaults, coherence review round 30; R30-L1-01, R30-L1-02/L2R30-01, L3R30-03, L3R30-04 and L3R30-05 as orchestrator defaults for Miguel's review at the 00-Z48 PR) | R30-L1-01: §6.P.13 Deps no longer says P13 is Ready only when the Version PR is next; P13's ledger row stays `blocked` until the main session has run the exit sweep, the sweep's rows are `done` and Miguel has recorded the release-time runs on `main`, as D3 stays `blocked` until the Version PR merges; plan §4.2 P13 and the §6 sequence follow. R30-L1-02/L2R30-01: the main session flips D3 and P13 `blocked → todo` when their outside condition holds (§6.D.3, §6.P.13; plan §4.2, §4.4), and the ledger-PR alignment list in §6.Z and plan §4.0, §4.6 and §10 step 6 adds the PROCESS §6 row-flip owners (`docs/PROCESS.md:139-141`), aligned to add the `blocked → todo` flip owner (orchestrator). L3R30-01: the C1 acceptance, the G4 acceptance and §7.3 check only custom-element declarations with a `tagName` (or a `custom-element-definition` export), as R4 §2.7 advises; inherited `line-core` declarations such as `LineElement` keep `../line-core/…` paths that resolve to no file in the tarball. L3R30-02: P8 also rewrites the `vite-plugin-dts` comment at `packages/line-core/src/mixins/inspector.ts:111` (§5, §7.1; plan §2.9); the P8 grep runs over the files and Phase 00 spec places plan §2.9 lists and that file, and names `docs/context/*`, plan §5.4 O1 and the plan and spec text that describes P8 as records. L3R30-03: §6.G.4 Basic mapping adds the SD59 Button-child Text → `<span>` exception beside the Image avatar route; ARCH v0.8.12 aligns the §17.3 Text row. L3R30-04: the G7 A2A recipe sends `line-a2ui-error` as an `error` message in an `application/a2ui+json` DataPart and the SSE recipe sends it by POST as JSON; G7 acceptance adds an error case for the A2A, MCP and SSE recipes. L3R30-05: §6.G.4 Errors limits the `web_core` code rule to errors `web_core` throws or reports and names the surface's own codes `LIMIT_EXCEEDED` (limit breach), `MARKDOWN_RENDER_ERROR` (Markdown hook failure), `MISSING_ACCESSIBLE_NAME` (missing accessible name, the R2 spike code) and `UNMAPPED_ICON` (unmapped icon); SD55 and D1 name them. L3R30-06: G7 Deps add G6; plan §6 follows. L3R30-07: ARCH §12 moves the citation "Phase 1 spec §4.3–§4.5, §10 SD4, SD5" to the sentence on the manifests and cites the harness sentence as "Phase 1 spec §7.5, §10 SD4" (ARCH v0.8.12). L3R30-08: §6.C.0 step 1 adds that P9 and P10 follow P8; plan §6 adds `P8 ──► P9, P10`. The header names AM-001–AM-040 and ARCH v0.8.12 | The round-30 review found that P13 became Ready before its start conditions, that no one owned the `blocked → todo` flip, that the C1 manifest-path test failed on inherited `line-core` declarations, that the P8 grep could not pass, that ARCH §17.3 and the spec disagreed on Button-child Text, that the A2A and SSE recipes had no error path, that the surface's own errors had no `web_core` code, that G7 could document `mcp-apps.css` before G6, a misplaced ARCH citation and two order edges missing from §6.C.0 and plan §6 | agent R30LensPlanPRD (R30-L1-01, R30-L1-02); agent R30LensSpecResearch (L2R30-01); agent R30LensSpecArch (L3R30-01 to L3R30-08); R4 `docs/research/01-research-custom-elements-manifest.md:69`, `:154`; analyser 0.11.0 `cli.js:55-66`; `packages/line-core/src/mixins/inspector.ts:111`; R6 `docs/research/01-research-transports.md:116`, `:177`; R2 `docs/research/01-research-projection-technique.md:162`; `docs/PROCESS.md:139-141` |
| AM-041 | 2026-10-21 | ledger 00-Z48 (factual corrections and orchestrator defaults, coherence review round 31; R31-L1-05, L3R31-01, L3R31-03/L2R31-03, L3R31-04/R31-L1-04/L2R31-01 and L3R31-05 as orchestrator defaults for Miguel's review at the 00-Z48 PR) | Completes AM-040. R31-L1-01: plan §2.1 Text row matches ARCH §17.3 (`<span>` inside Button, §10 SD59). R31-L1-02/L2R31-04/L3R31-02: the first §6.G.4 Errors rule carries the code the next two rules give, not always a `web_core` code. L3R31-01: G7 depends on G4 and G6 in the §6.G.0 table, the bullet under it and SD40. L3R31-03/L2R31-03: the A2A recipe sends `[action]` and `[error]` arrays in `application/a2ui+json` DataParts (§6.G.7 rules and Acceptance, SD66; ARCH §17.5 v0.8.12). L3R31-04/R31-L1-04/L2R31-01: the P8 grep keeps the check on the plan §2.9 places and `inspector.ts` and drops the closed record list (§6.P.8; plan §2.9). L3R31-05: webcomponents-supervisor writes the `inspector.ts:111` comment in the P8 PR, outside the one-commit document change (§5, §6.P.8, §7.1; plan §2.9). R31-L1-03/L2R31-02/L3R31-06: the PROCESS row-flip locator is `docs/PROCESS.md:138-140` (§6.Z; plan §4.0, §4.6, §10 step 6); AM-040's `:139-141` stays as recorded. R31-L1-05: the orchestrator (main session or `sdlc`) flips D3 and P13 `blocked → todo` (§6.D.3, §6.P.13; plan §4.2, §4.4, §6). L3R31-07: §6.G.4 Basic mapping counts Button-child Text as part of ARCH §17.3. L3R31-08: ARCH §12 and plan §2.6 cite Phase 1 spec §4, §4.3–§4.5, §10 SD4, SD5. L3R31-09: §5 lists `packages/line-core/vite.config.mjs` for P9 `root`, and the `line-components` P9 note adds `root`. L3R31-10: §6.P.8 Changes point to §7.1 and the Contract. L2R31-05: §5 column alignment | AM-040 left a Text row, an error-code rule, the G7 Deps, the A2A error shape, the P8 grep list, the P8 commit owner, a PROCESS locator and the flip-owner wording inconsistent | agent R31LensPlanPRD (R31-L1-01 to R31-L1-05); agent R31LensSpecResearch (L2R31-01 to L2R31-05); agent R31LensSpecArch (L3R31-01 to L3R31-10); `docs/PROCESS.md:138-140`; R6 `docs/research/01-research-transports.md:115`; `packages/line-core/vite.config.mjs:5`; ARCH `docs/ARCHITECTURE.md:1560` |
| AM-042 | 2026-10-21 | ledger 00-Z48 (factual corrections, coherence review round 32, diff-focused per Miguel's decision of 2026-10-21) | R32-L1-02/L3R32-02: the plan Status round-31 note lists §2.6, the findings R31-L1-01, R31-L1-03 to R31-L1-05, L3R31-05 and L3R31-08, and says R31-L1-02 lands in spec §6.G.4 and that plan §2.6 cites spec §4 for the packages that keep `sideEffects`. L3R32-01: §6.P.8 Changes says §5 lists every file and §7.1 and the §6.P.8 Contract give the changes. R32-L1-01: PRD §6.2 side-effect contract cites Phase 1 spec §4 beside §4.3–§4.5 (PRD v0.8.26 note). | Round 32 was clean on all three lenses; these are its minors R32-L1-01, R32-L1-02, L3R32-01 and L3R32-02. Factual corrections, no decision change. | Agents R32LensPlanPRD, R32LensSpecArch; `docs/PRD.md:708`; spec :129 |
| AM-043 | 2026-10-21 | ledger 00-Z48 (factual corrections, coherence review round 33, diff-focused) | R33-L1-01: the plan Status round-31 note lists every finding that changed the plan, other lenses' IDs included. R33-L1-02: one "and" in that note's list. | Round 33 was clean on all three lenses; these are its minors. No decision change. | Agent R33LensPlanPRD; spec §12 AM-041 |
| AM-044 | 2026-10-21 | ledger 00-Z48 (factual correction, coherence review round 34, diff-focused) | R34-L1-01: the plan Status round-33 sentence names the round-31 note and both of its corrections. | Round 34 was clean on all three lenses; this is its only minor. Rounds 32, 33 and 34 are three consecutive clean rounds. No decision change. | Agent R34LensPlanPRD |
| AM-045 | 2026-10-21 | ledger 00-Z49 (factual correction, Phase 1 ledger PR) | §6.P.4 Changes and §6.P.11 Timing cite the PROCESS lines as they stand after the 00-Z49 alignment: "No record, no PR" at `docs/PROCESS.md:122` (was `:116`), the §6 status and row-flip bullets at `:136-147` (was `:130-140`) and `:140-147` (was `:134-140`), and the one-PR-per-row bullet at `:167` (was `:159`). | Row 00-Z49 aligned PROCESS §4 and §6 as §6.Z requires (stream owners, one accountable implementer per task, the `blocked → todo` flip owner, the changeset step), which moved the cited lines. No rule and no design choice changes. The supervisor lines that §4 cites keep their numbers. | `docs/PROCESS.md:122`, `:136-147`, `:167` after commit "docs(process): 00-Z49 — Phase 1 stream owners, accountable implementer, blocked flips"; §6.Z |
| AM-046 | 2026-10-22 | ledger 01-P9 (factual correction) | Three edits. (1) §7.2 table, "Version today" column: `line-core` 0.1.1 → 0.1.2 and `line-components` 0.1.0 → 0.1.1; the "Version at phase exit" column stays 0.2.0. (2) §4.2 manifest block: `"version": "0.1.0"` → `"version": "0.1.1"`. (3) The Status line names AM-001–AM-046. | Version PR #284 bumped both packages through the 01-P8 patch changeset after the spec was written. No rule and no design choice changes, and the phase-exit 0.2.0 target is unchanged. | `packages/line-core/package.json:3`, `packages/line-components/package.json:3`; commit `e03ffcb` |
| AM-047 | 2026-10-22 | ledger 01-P12 (factual corrections; decision — Miguel chose a line-schemas devDependency of line-components over reading the hue lists from line-themes files by relative path, 2026-10-22) | Seven edits. (1) The Status line names AM-001–AM-047. (2) §7.2 table, "Version today" column: `line-core` 0.1.2 → 0.1.3 and `line-components` 0.1.1 → 0.1.2; the "Version at phase exit" column stays 0.2.0. (3) §4.2 manifest block: `"version": "0.1.1"` → `"version": "0.1.2"`, and `devDependencies` gains `"@websublime/line-schemas": "workspace:^"`, with a bullet on why. (4) §5 layout: the `packages/line-components/package.json` and `bun.lock` rows name P12. (5) §6.P.12 Changes: both Roles visual files import `ACCENT_HUES` and `GRAY_HUES` from `@websublime/line-schemas`. (6) §6.P.12 Changes: `roles.off-pairs.visual.ts` declares 372 tests, a worker-scoped fixture finds each auto pair from the computed cascade in Chromium and requires exactly one match, and the auto-pair test skips with the reason "default pair, covered by roles.visual.ts"; 310 screenshots run and 62 skip. (7) §6.P.12 Timing: the visual files are committed and pushed before the `visual-baselines.yml` run, their baselines arrive in a later commit before the PR opens, and the squash merge lands them together on `main`. | Bun installs workspaces in isolated mode, and `line-components` did not declare `@websublime/line-schemas`, so it did not resolve from `packages/line-components/__tests__/visual/`. Relative paths into another package are banned. The built `defaults.css` is minified (`[data-accent=amber]` without quotes), so the fixture reads the computed cascade and parses no CSS. `visual-baselines.yml` checks out the remote branch, so the visual files must be pushed before their baselines exist. Version PR #287 bumped `line-core` and `line-components` after the spec was written, the same drift as AM-046. The phase-exit 0.2.0 target is unchanged. | Probe 2026-10-22: `import.meta.resolve('@websublime/line-schemas')` from `packages/line-components/__tests__/visual/` gave ERR_MODULE_NOT_FOUND in Node and Bun; `packages/line-components/package.json:24-31` (no line-schemas); commit `57866e5` (#287); `packages/line-themes/dist/defaults.css`; `.github/workflows/visual-baselines.yml` (checkout of the branch) |
| AM-048 | 2026-10-23 | ledger 01-Z5 (decision — Miguel chose moving `shadows.e2e.ts` from `line-tokens` to `line-themes` with a `line-tokens` devDependency over keeping it in `line-tokens` with upward devDependencies and a `line-tokens` ↔ `line-themes` devDependency cycle; a private `@websublime/line-testing` package that holds the htmx harness over moving the harness into `line-components` and over deferring the choice to the first C row that needs it; a browser test of all 31 auto pairs on the built CSS over extending the string test to 31 pairs and over no change; PRD §5.2 as the home of the rule, mirrored in §7.8, over §7.8 only, 2026-10-23) | Seventeen edits. (1) The Status line names AM-001–AM-048, and the Source PRD line cites v0.8.27. (2) §3.1 gains a bullet: `line-testing` is private and never published, `lint-layers` treats it as an app, and a devDependency on it is not a layer edge. (3) §4 file-class table, package-source row: `line-testing/src/` is package source, the htmx harness lives there while its self-test stays under `line-core`, and `packages/line-core/__experimental__/` is package source, so its README and the `example/server.ts` comment are webcomponents-supervisor edits. (4) §4.4: the `line-themes` manifest gains the `@websublime/line-tokens` devDependency, with a bullet. (5) §4.5 gains a Z5 row for the `line-core` devDependencies and a bullet on the unpublished `@websublime/line-testing` that the packed `line-core` manifest names. (6) New §4.6 holds the `line-testing` manifest, with `htmx2` and `htmx4` in `dependencies` and `playwright` in `peerDependencies`, its `tsconfig.json` with `types: ["node"]`, and its entry in the `.changeset/config.json` `ignore` list. (7) §5 layout: rows for every new, moved, removed and changed path of Z5, and Z5 on the `.changeset/config.json`, `CLAUDE.md`, `.claude/agents/webcomponents-supervisor.md`, root `package.json`, `bun.lock`, Phase 00 spec, `COMPONENT-SPEC-TEMPLATE.md`, `line-core`, `line-components` and `line-themes` rows. (8) §6.C.0 order step 1 adds Z5 and reads "All nine". (9) §6.C.4 Deps column: every C1–C20 row ends with Z5. (10) §6.C.6 stream acceptance: Z5 merges before C1. (11) New §6.Z.3 Z5 with Owner, Deps, Changes, Contract and Acceptance. (12) §7.8 gains the six resolution rules. (13) §9.1 htmx check names the harness `@websublime/line-testing/htmx`. (14) SD86 adds Z5. (15) Rule 2 covers only the package's build output, the targets of its `exports` (`dist/`), and treats a resolution throw as a missing file. Rule 3 bars relative paths into another package or into the package's own `dist/`, lets a test reach its own package's `src/` and `__tests__/` whether or not `files` ships them, and lets an app's tests reach the app's own sources. Rule 6 resolves a third-party package only through a manifest that declares it. (16) The §6.Z.3 auto-pair test places each accent scope where an inherited gray cannot match the expected pair and compares the 12 steps, the 12 alpha steps and the contrast token as computed values on the same page in the same engine, and `defaults-selectors.test.ts` also checks the `:not([data-gray])` guard. (17) On the same branch, outside the spec, the `COMPONENT-SPEC-TEMPLATE.md:217` htmx Tests row points at `@websublime/line-testing/htmx`, and `.claude/agents/webcomponents-supervisor.md` names `line-testing` in its Project Structure tree and says "each published package" in its Changesets convention. | Bun installs workspaces in isolated mode, so an undeclared workspace package does not resolve by name. Eight test files read another package's `dist/`, or their own, by a relative path, which bypasses the manifests and `exports` maps that consumers use, so a broken `exports` entry or an undeclared edge passed. Declaring what `shadows.e2e.ts` reads would make `line-tokens` point up at L1 and L3 and, with `cascade-layer.e2e.ts`, form a `line-tokens` ↔ `line-themes` devDependency cycle that `lint-layers` does not see. The htmx harness is a helper that component suites reuse (Phase 00 spec AM-063), and a `line-components` suite could reach it only by a relative path into `line-core`. The auto-pair test string-matched two of the 31 accents that PRD §5.2.1 asks for. Rule 6 is narrower than the first dispatched wording, "a third-party package that only one package uses is declared by that package", which would have reversed SD96 and the G2 and G3 root devDependencies; that wording was an orchestrator default and does not override approved decisions (main session, 2026-10-23). Review gate iteration 1 (2026-10-23) found documentation gaps and changed no decision. The harness imports `expect` and `test` from `playwright/test` as values, so a manifest of `line-testing` must declare `playwright`. TypeScript 7 defaults `types` to `[]`, so the harness needs `types: ["node"]`. The two private apps sit in the Changesets `ignore` list, and `line-testing` joins them so no changeset names it. Bun 1.4.3 throws where Node returns a path for a missing wildcard target. `storybook-smoke.e2e.ts` reads its own app's MDX sources by relative path. A scope that inherits slate let the seven slate-paired accents pass with their auto-pair block deleted, and the browser cannot see a missing `:not([data-gray])` guard. Review gate iteration 2 (2026-10-23) scoped rules 2 and 3 by build output, because five published packages ship `src/` in `files` and map no `exports` to it, so a "shipped files" framing would have pushed their `src/` reads through `exports`. It also moved the `example/server.ts` comment from the catch-all row to webcomponents-supervisor, whose scope covers `line-core` code. Miguel approved PRD v0.8.27, this row and Phase 00 spec AM-077 on 2026-10-23. | Probes recorded in `docs/context/01-z5.md` (on `6fb61d3` and 2026-10-23): `import.meta.resolve` in Node and Bun failed for `@websublime/line-tokens` from `packages/line-themes/__tests__/` and for `line-colors` and `line-themes` from `packages/line-tokens/__tests__/`; `@websublime/line-themes` resolved to its own `dist/index.css` from `packages/line-themes/__tests__/`; inside a Playwright test in `line-themes` the loader resolved package names and self-references as Node does; in Node and the Playwright loader `import.meta.resolve('@websublime/line-themes/accent/not-a-hue')` returned a path whose file does not exist; Bun 1.4.3 ran `--filter` builds over a devDependency cycle with no error and picked its own order. Review-gate lens probes on 2026-10-23: Bun links one `.bun/playwright@1.64.0` store path for the root and `line-testing`; `tsc --noEmit` on the harness without `types: ["node"]` fails with TS2591 on `node:url`; with `@websublime/line-testing` in `ignore`, `bun run status`, `changeset version` and `verify-pack` pass, and `@changesets/config` 3.1.4 skips `devDependencies` and private dependents in its skipped-package check; Bun 1.4.3 throws "Cannot find package" on a missing wildcard target; a mutation probe deleted the auto-pair block of a slate-paired accent and an inherited-slate scope still passed. `scripts/lint-layers.mjs:13-16` (devDependencies ignored), `:181-205` (a private package is an app); `scripts/verify-pack.mjs:44-48` (`discoverPublishable` skips private packages); `packages/{line-core,line-components,line-icons,line-schemas,line-utils}/package.json` (`files` holds `src`, no `exports` target under `src/`); `.claude/agents/webcomponents-supervisor.md:98` (`line-core` in scope); `packages/line-core/__tests__/integration/htmx/htmx-harness.ts:23` (value imports), `:103-113`; `packages/line-themes/__tests__/auto-pair.behaviour.test.ts` (amber and violet only); `packages/line-themes/src/index.css:8-50` (import order); `apps/storybook/__tests__/storybook-smoke.e2e.ts:92`; `packages/line-core/__experimental__/htmx/example/server.ts:16-17` |

*End of spec.*
