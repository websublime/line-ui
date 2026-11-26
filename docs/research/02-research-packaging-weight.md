# Research: Packaging and weight — entry points for six Phase 2 components, Zag machine and `@internationalized/date` weight (R8)

**Row:** `01-Z23` (Phase 2 plan §5.1 R8)
**Date:** 2026-11-26
**Toolchain:** the row 01-Z14 baseline. Bun 1.4.5 (`/tmp/bun145`, because the workstation `bun` is 1.4.3), Node 22.23.5 for the package build (`/tmp/node-v22.23.5-darwin-arm64`), esbuild 0.28.2 (the repo's), Vite 8.3.8, Zag 1.49.0, Lit 3.3.3. `gzip -9 -n` from Apple gzip 487.40.2 on macOS 27.2.1 (arm64), cross-checked with GNU gzip 1.12 on Linux x86_64 (§3.4). No browser ran (§3).
**Repo sources** (locators at `origin/main` `9c9b1f4`; the Z23 ledger row at this branch): `docs/plans/02-plan-essential-forms.md` §1.1, §2.1, §2.6, §5.1 R1, R4, R5, R8, §5.3, §5.5, §5.7, §7.1, §8; `docs/PRD.md` (v0.8.36) §1.6, §1.7, §4.2, §7.4, §7.6, §7.8; `docs/ARCHITECTURE.md` (v0.8.28) §7, §8, §10, §12, §13.1, §14.10, §15.1, §16.2, §17.3, §17.4; `docs/MANIFESTO.md` Laws 4 and 6; `docs/specs/01-spec-core-primitives.md` §6.C.4, §7.5–§7.7, §10 SD4, SD12, SD20, SD21; `docs/research/01-research-packaging.md` (R9); `scripts/report-size.mjs`; `vite.config.shared.mjs`; `packages/line-components/{package.json,vite.config.mjs,src/**,__tests__/bundle-splitting.test.ts,__tests__/cdn.e2e.ts}`; `packages/line-core/src/machine/index.ts`; `packages/line-genui/src/catalog/descriptor.ts`; `docs/plans/01-tasks-core-primitives.md:130` (row Z23).
**Status:** Evidence. Research carries no rules (`docs/PROCESS.md` §1). Recommendations are marked as such; every decision is an open question in §6.

> **TL;DR**
>
> - ARCHITECTURE §12 already holds the rule that places the six components: "A component belongs to a family when it requires its parent to function" (`docs/ARCHITECTURE.md:554`). Checkbox, Switch, Slider and Number Input have no sub-element in their Zag 1.49.0 anatomy that a consumer authors, so each fits one independent entry with one tag, as the 20 Phase 1 subpaths are. Radio Group and Toggle Group are compound. Zag gives each item its own props per `value` (`getItemProps`), so an item element would need its group's machine to work. Under the "requires its parent" test, that makes each one a family (`./radio-group`, `./toggle-group`) that registers a group tag and an item tag.
> - The last sentence of the §12 rule says the opposite for items that are slotted: "Components connected via `<slot>` are always separate entrypoints — slots imply independence" (`:554`). MANIFESTO Law 6 says "Families share a subpath only when their slots make them inseparable" (`docs/MANIFESTO.md:49`). Slotted radio and toggle items meet both sentences, so the two documents give opposite answers. This is a document gap for the post-research revision (§5).
> - Under the Phase 1 rule SD21, the per-component size counts the component alone, with Lit, `line-core` and every `@zag-js/*` package external. The new machines therefore never appear in the size report. Measured the way `scripts/report-size.mjs` measures (esbuild `--bundle --minify --format=esm --target=es2022`, `gzip -9 -n`), the marginal gzip cost of each machine on top of the report's "Zag core + vanilla" row (7,493 B) is: Checkbox 5,085, Radio Group 5,901, Switch 5,090, Toggle Group 3,081, Slider 8,272 and Number Input 9,443. For the other Phase 2 machines: Select 26,738, Editable 5,314, PasswordInput 1,678, DateInput 16,507, and the `auto-resize` helper 546. Only Toggle Group, PasswordInput and `auto-resize` are under 5,000 B as the first machine. Checkbox and Switch fall between 5,000 and 5,120 B, so whether they pass depends on what "5 KB" means, which no document defines.
> - The machines share a lot of code. The six R8 machines together add 23,342 B over the baseline, against 36,872 B for the sum of their separate marginals. In an esbuild code-split build, each machine's own chunk is 1.8–8.0 KB (Checkbox 1,884, Switch 1,795, Radio Group 2,810, Toggle Group 2,012, Slider 5,805, Number Input 7,979). The shared Zag code (core, vanilla, store, utils and the `dom-query` helpers) pools into one 15,607 B chunk. Even with every other Phase 2 machine already loaded, Slider (5,577 B), Number Input (7,167 B), DateInput (15,362 B) and Select (21,591 B) still each add more than 5 KB.
> - `@internationalized/date` 3.12.4 is a peer of `@zag-js/date-input` (`>=3.0.0`). The machine uses 4,919 B gzipped of it (11,149 B for the whole package). DateInput's own machine code is larger than that: 10,456 B, of a 16,507 B marginal. Plan §8 names `@internationalized/date` as the threat to the DateInput target. Counting the machine, the machine code is the larger part. Under SD21 the machine is external, and `@internationalized/date` reaches the DateInput row only if line code imports it directly: `{ parseDate, CalendarDate }` alone weighs 3,590 B [INFERENCE: no DateInput code exists]. `@zag-js/number-input` depends on `@internationalized/number` 3.6.9, which adds 2,313 B.
> - Packaging consequences. Each machine becomes a `line-components` dependency, which the build keeps external. The six R8 machines add 8 bare specifiers to the 24-entry unpkg import map, and the full Phase 2 set adds 24. Each machine pins its Zag internals to one exact version, so a consumer lockfile with mixed Zag versions bundles two copies of `@zag-js/core`, observed in probe §3.3. The report's "Zag core + vanilla" row is not the R9 §2.4 row it cites: R9's 5,390 B came from named imports, and the report bundles `export *`.

---

## 1. Question

Plan §5.1 R8: "Entry points and families for the components ARCHITECTURE §12 does not list (Radio Group, Toggle Group, Checkbox, Switch, Slider, Number Input); gzipped weight of each new Zag machine and of `@internationalized/date` against the < 5 KB soft target" (`docs/plans/02-plan-essential-forms.md:270`). Plan §5.5 lists the entry points as a spec-level question (`:413`). Plan §2.6 says DateInput on `@zag-js/date-input` pulls `@internationalized/date` as a peer (`:159-160`). Plan §7.1 adds two italic criteria: sizes reported against the target, and bundle splitting verified for every Phase 2 subpath and family (`:481-482`).

- **Q1** What is the entry-point pattern today, and which checks enforce it?
- **Q2** Which entry and which tags fit each of the six components, under the §12 rule and the Zag 1.49.0 anatomy?
- **Q3** What does each new Zag 1.49.0 machine weigh, measured as `scripts/report-size.mjs` measures, against the < 5 KB soft target?
- **Q4** How much do the machines share once `@zag-js/core` is present, together and in a code-split bundle?
- **Q5** What do `@internationalized/date` (and `@internationalized/number`) weigh, and how do they arrive?

## 2. Findings

### 2.1 Q1: the entry-point pattern today

- **One subpath per entry, hand-listed in two places.** `packages/line-components/package.json:20-106` maps `"."`, `./custom-elements.json` and 20 component subpaths, each `{ types: ./dist/<c>/index.d.ts, import: ./dist/<c>/index.js }`. `packages/line-components/vite.config.mjs:9-31` lists the same 21 JS entries as `'<c>/index': 'src/<c>/index.ts'`. Each `src/<c>/index.ts` re-exports the class and types of one component (for example `src/chip/index.ts`).
- **Every Phase 1 subpath registers one tag.** `__tests__/bundle-splitting.test.ts:56-78` (`EXPECTED_TAGS`) expects `'.': []` and one `line-<c>` per subpath. Phase 1 spec SD12 made the ten "family rule" rows independents with one tag each (`docs/specs/01-spec-core-primitives.md:1161`, `:2395`). No family entry exists yet.
- **No component imports another.** SD4 removed `sideEffects`, kept default Rolldown chunks, and ruled that "no component imports another (AvatarGroup by slot)" (`:2387`). The isolation scan fails a bundle that holds another component's module, or a tag its entry's `ALLOWED_TAG_REFERENCES` row does not name (`:2170`; `bundle-splitting.test.ts:85-87` allows `./button-group` → `line-button`, `line-icon-button`). Shared code lives under `src/shared/` and lands in `dist/shared/`. Today that is `button-machine.js` and `icon-registry.js` (`vite.config.mjs:38-41`; observed in the built `dist/`).
- **Zag stays external.** The shared Vite config keeps every `dependencies` and `peerDependencies` name external (`vite.config.shared.mjs:6-17`). `dist/chip/index.js` imports `@zag-js/toggle` bare (observed). So every Phase 2 machine is a `line-components` `dependencies` entry, as `@zag-js/presence` and `@zag-js/toggle` are (`package.json:112-114`), and its bytes land in the consumer's bundle, not in `dist/`.
- **`line-genui` loads one subpath per descriptor.** `load: () => import('@websublime/line-components/<c>')` (`packages/line-genui/src/catalog/descriptor.ts:196-201`; for example `descriptors/chip.ts:8`). A family entry therefore registers the group and its items in one `load()`.
- **§12 lists, and ends with "etc."** The family table (`docs/ARCHITECTURE.md:573-584`) and the independents line (`:586`) name Phase 2's `./select` family and `./input`, `./password-input`, `./search-input`, `./date-input`, `./textarea`, `./field`, `./fieldset` and `./editable`. They do not name the six R8 components. The rule sentence (`:554`) is what applies to them.

### 2.2 Q2: entries and tags for the six components

**Anatomy and item API (Zag 1.49.0).**

| Component | Zag anatomy parts (`dist/<m>.anatomy.mjs:3`) | Per-item API | Fit under the §12 rule | Later PRD components on the same machine |
|---|---|---|---|---|
| Checkbox | `root`, `label`, `control`, `indicator` | none | Independent: no sub-element; O7 (a) composes `<line-fieldset>` of `<line-checkbox>`, so it must stand alone (`docs/ARCHITECTURE.md:1623`) | — |
| Switch | `root`, `label`, `control`, `thumb` | none | Independent | — |
| Slider | `root`, `label`, `thumb`, `valueText`, `track`, `range`, `control`, `markerGroup`, `marker`, `draggingIndicator` | `getThumbProps({ index })`, `getMarkerProps({ value })` | Independent; thumbs and markers are parts | Range Slider, Phase 4, "Pre-built" (`docs/PRD.md:331`, `:1030`) on the same multi-thumb machine [INFERENCE: Zag `slider` takes a value array; Range Slider's machine is not named in the PRD] |
| Number Input | `root`, `label`, `input`, `control`, `valueText`, `incrementTrigger`, `decrementTrigger`, `scrubber` | none | Independent; the steppers are internal parts (plan §5.5 slot/part rule; ARCH §16.2 `:1444`) | — |
| Radio Group | `root`, `label`, `item`, `itemText`, `itemControl`, `indicator` | `getItemProps`, `getItemTextProps`, `getItemControlProps`, `getItemHiddenInputProps`, each taking `{ value }` (`radio-group.connect.mjs:90`, `:136`, `:144`, `:155`) | Compound: an item has no state without the group's machine | Segmented Control, Phase 6, "Custom" (`docs/PRD.md:382`, `:1093`) |
| Toggle Group | `root`, `item` | `getItemProps({ value })` (`toggle-group.connect.mjs:60`) | Compound, as Radio Group | — |

- **The machines find items by id under the root.** Radio Group queries `input[type=radio]` owned by the root (`radio-group.dom.mjs:15-18`). Toggle Group queries every owned, enabled element under the root (`toggle-group.dom.mjs:7-10`). Whether item custom elements with shadow roots can satisfy those queries is R1's question (plan `:263`). The entry shape does not settle it [INFERENCE: `querySelectorAll` does not enter shadow roots].
- **ARCHITECTURE hints at item tags but names none.** §15.1 lists "Checkbox, Radio, Switch, …, Toggle Group" among the components without a native element (`docs/ARCHITECTURE.md:1339`). §13.1 says "ToggleButton — NOT a separate component; use ToggleGroup with single item" (`:604`). §17.3 maps ChoicePicker to `<line-radio-group>` and `<line-toggle-group>` (`:1623`). The §12 families name their items `<family>-item` or `<family>-trigger`: `line-select-item`, `line-menu-item`, `line-accordion-item`, `line-tab-trigger` (`:575-584`).
- **Number Input's tag has two names.** ARCHITECTURE §14.10 names `line-number-field` (`:1297`). §16.2 and §17.3 name `line-number-input` (`:1443`, `:1621`), and so does the PRD spec link `0036-number-input.md` (`docs/PRD.md:289`). Plan §5.7 already lists this gap (`docs/plans/02-plan-essential-forms.md:439`). The subpath follows the tag.
- **§16.2 says the steppers "are custom elements rendered by the component"** (`docs/ARCHITECTURE.md:1444`). Read literally, that means more tags under `./number-input`, which the registration harness would have to list. Plan §5.5 treats them as internal parts [INFERENCE: "custom elements" there means custom-rendered elements].

**What other web-component libraries ship** (from `npm pack`, 2026-11-26):

| Library | Radio items | How the entry registers them |
|---|---|---|
| Web Awesome 3.14.0 | `wa-radio-group` + `wa-radio` | Two entries, `dist-cdn/components/radio-group/radio-group.js` and `…/radio/radio.js`. The group entry imports `chunks/chunk.RV5MEM4L.js`, which defines `wa-radio` (`:126`), next to `chunk.IX2GQ2J6.js`, which defines `wa-radio-group` (`:336`). Importing the group registers both |
| Spectrum Web Components 1.12.6 | `sp-radio-group` + `sp-radio` | One package, `@spectrum-web-components/radio`, with two entry files. `sp-radio-group.js:1` defines only `sp-radio-group` |
| Fluent UI Web Components 3.2.5 | `fluent-radio-group` + `fluent-radio` | Separate `radio-group/define.js` and `radio/define.js`. The group's define imports no radio (`dist/esm/radio-group/define.js:1-3`) |

Web Awesome 3.14.0 also ships `wa-checkbox`, `wa-checkbox-group`, `wa-switch`, `wa-slider` and `wa-number-input` as separate entries (`dist-cdn/custom-elements.json`).

**The options for the two compound components:**

| Option | Entries and tags | Fit |
|---|---|---|
| (a) Family | `./radio-group` → `line-radio-group` + an item tag; `./toggle-group` → `line-toggle-group` + an item tag | The §12 "requires its parent" test; the §12 family precedents; one `line-genui` `load()`; the isolation scan accepts it, because a family is one module tree. It conflicts with the §12 slot sentence (§5) |
| (b) Separate item entries | `./radio-group` + `./radio-group-item` (or `./radio`); the group imports no item | The §12 slot sentence; Spectrum and Fluent. A consumer or `line-genui` needs two imports, and an item imported alone does nothing |
| (c) No item element | One tag; items come from data (an `items` property) or from slotted native elements, and the group renders them in its shadow root | One entry, no family. Per-item content (the R10 swatch per radio) then needs one named slot per item or a data API. MANIFESTO Law 4, "slots over props for content" (`docs/MANIFESTO.md:45`), weighs against data-only items |

Item tag names under (a) or (b): `line-radio-group-item` and `line-toggle-group-item` follow the §12 `<family>-item` pattern. `line-radio` follows the other libraries. `line-toggle` would read as the ToggleButton that §13.1 rules out, and Chip already runs on `@zag-js/toggle` (`docs/ARCHITECTURE.md:605`).

### 2.3 Q3: the weight of each Zag 1.49.0 machine

**Method.** Each measurement is the `measure()` of `scripts/report-size.mjs:81-94` (esbuild `stdin`, `--bundle --minify --format=esm --target=es2022`) followed by `gzip -9 -n` (`:74-78`), run in a probe consumer with every machine installed at 1.49.0 (§3.2). Components import `{ connect, machine }` from the machine package, as Chip does (`packages/line-components/src/chip/chip.ts:5`), so each row bundles those two names.

The measured entry aliased them, so that several machines could share one entry: `export { machine as machine_<m>, connect as connect_<m> } from '@zag-js/<m>'`, with `-` in `<m>` replaced by `_` (`machine as machine_checkbox, connect as connect_checkbox`). This applies to the "alone", "over B0", "over B1" and aggregate columns, to the §2.5 DateInput and Number Input share rows, to the §2.4 leave-one-out figures and to the §3.4 bundles. The "own" column, the `export *` column, the `{ parseDate, CalendarDate }` row and the §2.4 code-split entries used the unaliased names. The review gate re-ran the plain `export { connect, machine }` entry and got minified marginals 14–26 B smaller and gzip figures 4–10 B lower: Checkbox 5,081, Toggle Group 3,071, Slider 8,266, DateInput 16,497 (review round 1, 2026-11-26). No figure crosses 5,000 or 5,120 B between the two entries. The figures below are the aliased ones.

Select adds `collection`, which its items need. "B0" is the report's "Zag core + vanilla" row, `export * from '@zag-js/core'` and `@zag-js/vanilla` (`scripts/report-size.mjs:167-168`): 19,963 B minified, 7,493 B gzip.

"B1" adds the Phase 1 machines with their own short aliases, not the `machine_<m>` form: B0 plus `export { machine as m_presence, connect as c_presence } from '@zag-js/presence'` and `export { machine as m_toggle, connect as c_toggle } from '@zag-js/toggle'`. That gives 28,035 / 9,873 B. The "over B1" column, the "over B1" aggregates in §2.4, the leave-one-out figures and the "B1 + all" total were all measured on this B1. The review gate measured B1 with `machine_<m>` aliases at 28,059 / 9,877 B, and on that basis each "over B1" marginal shifts by 24 B minified and 4 B gzip (review round 2, 2026-11-26). That moves no figure across 5,000 or 5,120 B. The figures here are not recomputed.

The Phase 1 reference marginals (presence, toggle) were measured as B0 plus `export { machine as m, connect as c } from '@zag-js/<m>'`. A marginal is `gzip(base + machine) − gzip(base)`. esbuild replaces `process.env.NODE_ENV` with `"production"` when it minifies for the browser platform, so Zag's dev-only warnings are not in any figure. A `--define` changed nothing, and the unminified bundle reads `isDev = () => true` (probe 3.2).

All figures are bytes; the gzip figures come from Apple gzip (§3.4 has the GNU figures).

| Machine | Own package only, min / gzip | Alone, everything bundled, gzip | Marginal over B0, min / gzip | Marginal over B1, gzip | `export *` marginal over B0, gzip | < 5,000 B as the first machine over B0 |
|---|---|---|---|---|---|---|
| `@zag-js/checkbox` | 5,247 / 1,925 | 6,277 | 15,239 / 5,085 | 4,299 | 5,242 | no (5,085; < 5,120) |
| `@zag-js/radio-group` | 8,533 / 2,898 | 7,054 | 18,002 / 5,901 | 5,063 | 6,063 | no |
| `@zag-js/switch` | 4,963 / 1,847 | 6,272 | 15,122 / 5,090 | 4,305 | 5,238 | no (5,090; < 5,120) |
| `@zag-js/toggle-group` | 5,805 / 2,086 | 4,330 | 9,319 / 3,081 | 2,320 | 3,244 | yes |
| `@zag-js/slider` | 18,185 / 5,984 | 9,675 | 25,480 / 8,272 | 7,483 | 8,500 | no |
| `@zag-js/number-input` | 18,224 / 5,753 | 10,878 | 30,937 / 9,443 | 8,674 | 9,646 | no |
| `@zag-js/select` | 22,796 / 6,060 | 28,126 | 83,722 / 26,738 | 25,898 | 27,011 | no |
| `@zag-js/editable` | 7,953 / 2,719 | 6,413 | 16,275 / 5,314 | 4,525 | 5,506 | no |
| `@zag-js/password-input` | 3,481 / 1,407 | 2,321 | 4,543 / 1,678 | 1,196 | 1,828 | yes |
| `@zag-js/date-input` | 32,002 / 10,456 | 17,365 | 52,375 / 16,507 | 15,918 | 16,852 | no |
| `@zag-js/auto-resize` (`autoresizeTextarea`) | 1,276 / 620 | 799 | 1,549 / 546 | 414 | — | yes |
| For reference: Phase 1 `@zag-js/presence`, `@zag-js/toggle` | — | — | — / 1,732; — / 700 | — | — | yes |

- **Where the marginal goes.** Over B0, the machine package is only part of the cost. The rest is the `@zag-js/dom-query` helpers B0 does not use, plus each machine's extra packages. Minified bytes added over B0, from the esbuild metafile:
  - Checkbox: `checkbox` 4,798, `dom-query` 6,253, `focus-visible` 3,432, `anatomy` 651.
  - Radio Group: `radio-group` 7,980, `dom-query` 5,726, `focus-visible` 3,431.
  - Switch: like Checkbox, with `focus-visible`.
  - Toggle Group: `toggle-group` 5,319, `dom-query` 2,916.
  - Slider: `slider` 17,133, `dom-query` 6,071, `utils` 1,531.
  - Number Input: `number-input` 17,337, `@internationalized/number` 7,609, `dom-query` 4,501.
  - Select: `select` 21,587, `dom-query` 13,435, `collection` 8,553, `@floating-ui/*` 18,924, `popper` 7,304, `dismissable` 6,030, `interact-outside` 3,236, `focus-visible` 3,514.
  - DateInput: `date-input` 30,979, `@internationalized/date` 15,762, `live-region` 1,388, `date-utils` 1,102.
- **Every package is marked side-effect free, so unused exports shake out.** Each `@zag-js/*` package has `"sideEffects": false` (for example `@zag-js/checkbox/package.json:21`). Bundling `export *` instead of `{ connect, machine }` costs only 148–345 B more gzipped, which is the anatomy, `props` and `splitProps` code.
- **A real component, for scale.** The report run at this branch (§3.1) gives Chip, component only, 1,570 B and Presence 932 B. Chip with everything bundled (Lit, `line-core`, Zag, `@zag-js/toggle`) is 41,927 / 14,840 B. That figure was measured from the built `dist/`, not the packed tarball. A Phase 2 pre-built component adds its own component-only bytes to the machine figures above [INFERENCE: no Phase 2 component code exists to measure].
- **Under SD21 none of this is reported.** SD21 counts "the component alone with Lit, `line-core` and Zag external" (`docs/specs/01-spec-core-primitives.md:2404`; `scripts/report-size.mjs:34-35`, `:143-148`). The baseline table prints only "Zag core + vanilla" (`:167-171`). A Phase 2 component row will show its own bytes and no machine bytes, whichever machine it uses.

### 2.4 Q4: shared-chunk effects

**One bundle, several machines** (gzip; "sum" adds the single-machine marginals from §2.3):

| Set | Marginal min / gzip | Sum of single marginals, gzip | Shared saving |
|---|---|---|---|
| Six R8 machines over B0 | 82,565 / 23,342 | 36,872 | 13,530 (37 %) |
| Six R8 machines over B1 | 80,104 / 22,396 | 32,144 | 9,748 |
| All ten Phase 2 machines + `auto-resize` over B0 | 217,515 / 65,436 | 87,655 | 22,219 |
| All ten + `auto-resize` over B1 | 214,666 / 64,439 | 80,095 | 15,656 |
| B1 + all ten + `auto-resize`, total | 242,701 / 74,312 | — | — |

**Leave-one-out.** Here each figure is the cost of one machine when B1 and the other nine Phase 2 machines are already in the bundle: `gzip(all) − gzip(all without it)`, where the full bundle is 73,863 B. Checkbox 710, Switch 553, Radio Group 1,710, Toggle Group 1,347, Slider 5,577, Number Input 7,167, Select 21,591, Editable 1,840, PasswordInput 846, DateInput 15,362. Checkbox and Switch come out this low partly because their sources are near copies, and gzip compresses one against the other inside a single file. A code-split build does not get that effect [INFERENCE from the chunk sizes below].

**Code-split build.** This build uses esbuild with `splitting: true`. It has one entry for B0, plus one entry per machine (Phase 1 and Phase 2), each importing `VanillaMachine` and its machine, as a component module imports `line-core/machine`. The chunks below are minified and gzipped.

| Chunk | Min / gzip | Holds | Imported by |
|---|---|---|---|
| Shared Zag pool | 41,481 / 15,607 | `core`, `vanilla`, `store`, `utils`, `types`, every `dom-query` helper any two entries use, `proxy-compare` | every entry |
| `focus-visible` | 3,541 / 1,451 | `@zag-js/focus-visible` | Checkbox, Radio Group, Switch, Select |
| `interact-outside` | 3,367 / 1,449 | `@zag-js/interact-outside` | Select, Editable |
| `anatomy` | 658 / 410 | `@zag-js/anatomy` | every machine entry but Presence |
| Checkbox / Switch / Radio Group / Toggle Group | 5,011 / 1,884; 4,721 / 1,795; 8,208 / 2,810; 5,542 / 2,012 | the machine package | — |
| Slider / Number Input | 17,495 / 5,805; 25,264 / 7,979 (with `@internationalized/number`) | the machine package | — |
| Select / Editable / PasswordInput / DateInput | 62,927 / 20,167 (with `collection`, `popper`, `dismissable`, `@floating-ui/*`); 7,784 / 2,676; 3,346 / 1,369; 49,426 / 15,870 (with `@internationalized/date`, `date-utils`, `live-region`) | — | — |
| Presence / Toggle (Phase 1) | 4,196 / 1,498; 1,241 / 609 | — | — |

- In a code-split app, a page that loads one Phase 2 component pays the pooled shared chunk (15,607 B, against B0's 7,493 B). The bundler moves every `dom-query` helper that two entries share into it, not only the ones that page uses. That is esbuild's chunking. Rolldown and webpack may cut the chunks differently [INFERENCE: not probed].
- Later phases reuse the Phase 2 extras. At 1.49.0, `@zag-js/menu`, `popover`, `tooltip` and `combobox` depend on `@zag-js/popper` and, except `tooltip`, on `@zag-js/dismissable`. `@zag-js/date-picker` depends on `@zag-js/date-utils` and takes the same `@internationalized/date` peer (npm registry manifests, 2026-11-26). The DatePicker composition `<line-date-picker><line-date-input slot="trigger">` (`docs/ARCHITECTURE.md:624`) therefore pays for `@internationalized/date` once.
- **Sharing requires one Zag version.** Each machine pins its internal Zag packages exactly; for example `@zag-js/checkbox/package.json:33` has `"@zag-js/core": "1.49.0"`. `line-components` declares `^1.49.0` (`package.json:112-114`). Probe 3.3 installed `@zag-js/checkbox@1.48.0` next to `core` and `vanilla` 1.49.0. The install nested `checkbox/node_modules/@zag-js/core@1.48.0`. The bundle held two copies of `@zag-js/core` (4,399 + 912 B), two of `dom-query` (4,109 + 355 B) and three of `utils` (115 + 969 + 1,772 B).

### 2.5 Q5: `@internationalized/date` and `@internationalized/number`

| Bundle | Min / gzip |
|---|---|
| `export * from '@internationalized/date'` (3.12.4) | 33,673 / 11,149 |
| `{ parseDate, CalendarDate }` only | 10,232 / 3,590 |
| Its share of DateInput over B0 (DateInput with the package bundled minus external) | 15,126 / 4,919 |
| `export * from '@internationalized/number'` (3.6.9) | 7,614 / 2,557 |
| Its share of Number Input over B0 | 7,557 / 2,313 |

- **How it arrives.** `@zag-js/date-input` and `@zag-js/date-utils` declare `"@internationalized/date": ">=3.0.0"` as a peer (`@zag-js/date-input/package.json:41-42`; `@zag-js/date-utils/package.json:29-30`), with no upper bound. Bun 1.4.5 installed 3.12.4, npm `latest` (published 2026-09-01). `@zag-js/number-input` depends on `@internationalized/number` exactly `3.6.9` (`package.json:32`), so it arrives on its own.
- **What the machines import.** `date-input.machine.mjs:1` imports `DateFormatter` and `toCalendar`; `date-input.parse.mjs:1` imports `CalendarDate` and `parseDate`; `date-utils` adds calendar helpers. `number-input.utils.mjs:1` imports `NumberParser` only.
- **Both packages shake.** Both declare `"sideEffects": false` (`package.json:15`). Their `exports.import` targets (`dist/index.mjs`) import only relative modules (grep of `dist/**/*.mjs`). Only the legacy `module` build, `dist/private/CalendarDate.js`, imports `@swc/helpers`, and no esbuild bundle above contained `@swc/helpers`.
- **Against the target.** DateInput's machine code alone (10,456 B own, 15,870 B as a split chunk) exceeds 5 KB with no help from `@internationalized/date`, which adds 4,919 B on top. That holds when the machine counts. Under SD21 the machine is external, but `@internationalized/date` is not on the report's external list (`scripts/report-size.mjs:32-35`). A DateInput component that imports it itself, for example `parseDate` for a `value` attribute (§2.7), carries those bytes in its own row: `{ parseDate, CalendarDate }` is 10,232 / 3,590 B, and the Phase 1 component-only rows run from 346 to 3,964 B (§3.1). That is a path to a DateInput row above 5 KB [INFERENCE: no DateInput code exists to measure]. Plan §8 rates "`@internationalized/date` breaks the DateInput size target" at medium likelihood and low impact (`docs/plans/02-plan-essential-forms.md:517`). §5 records how the evidence bears on that row.

### 2.6 What the size report measures, and three details it leaves open

- **The baseline row is not R9's row.** R9 §2.4 reports "`@zag-js/core` + `@zag-js/vanilla` 14478 / 5390" (`docs/research/01-research-packaging.md:221`). At 1.46.0, `export { createMachine }` + `export { VanillaMachine }` reproduces exactly 14,478 / 5,390 B (probe 3.5). The report bundles `export *` from both packages, which gives 18,778 / 7,096 B at 1.46.0, 19,388 / 7,322 B at 1.47.0 and 19,963 / 7,493 B at 1.49.0. The named entry at 1.49.0 gives 15,664 / 5,796 B, and `line-core/machine`'s four `vanilla` re-exports (`packages/line-core/src/machine/index.ts:3`) give 18,984 / 7,124 B. The report's comment says the row follows "R9 §2.4 table" (`scripts/report-size.mjs:15`). Marginals over the `export *` row are the lowest of the three bases. Over a narrower base, the first machine costs more.
- **The unit is undefined.** "< 5KB" (`docs/PRD.md:153`, `:165`) and "< 5 KB" (spec §7.6, report header) never say 1,000 or 1,024. Checkbox (5,085 B) and Switch (5,090 B) pass under 5,120 and fail under 5,000, under both gzip implementations (§3.4). R9 observed that Vite's report prints 582 B as "0.58 kB", which is 1 kB = 1,000 B (`docs/research/01-research-packaging.md:232-233`).
- **The gzip implementation changes the bytes.** CI runs on `ubuntu-latest` (`.github/workflows/checks.yml:9`). GNU gzip 1.12 on Linux x86_64 and Apple gzip 487.40.2 differ by −109 to +30 B on the bundles above, at most 0.4 % (§3.4). No marginal in §2.3 crosses 5,000 or 5,120 B between the two.

### 2.7 Packaging consequences for `line-components`

- **Dependencies.** Each Phase 2 machine becomes a `dependencies` entry, which the derived externals keep out of `dist/` (`vite.config.shared.mjs:6-17`). If `line-components` code imports `@internationalized/date` itself, for example to parse a `value` attribute, that package must be declared as well. Otherwise the "Undeclared bare specifiers" check fails (`docs/specs/01-spec-core-primitives.md:2174`). If no line code imports it, the consumer's tree still has to satisfy the machine's peer.
- **The CDN import map.** The unpkg path needs one entry per bare specifier (spec §7.7, `:2205`; `packages/line-components/__tests__/cdn.e2e.ts:64-98` holds 24 rows). From the bare-import closure of each package's `dist/*.mjs`:
  - The six R8 machines add 8: `@zag-js/checkbox`, `radio-group`, `switch`, `toggle-group`, `slider`, `number-input`, `focus-visible` and `@internationalized/number`.
  - The rest of Phase 2 adds 16: `select`, `collection`, `dismissable`, `interact-outside`, `popper`, `@floating-ui/dom`, `@floating-ui/core`, `@floating-ui/utils`, `@floating-ui/utils/dom`, `editable`, `password-input`, `date-input`, `date-utils`, `live-region`, `@internationalized/date` and `auto-resize`.
  - None of them reads `process.env`. Only `@zag-js/store` and `@zag-js/utils` do, and they are already in the map.
  - [INFERENCE: not run on a CDN.]
- **Registration lists grow.** Each subpath adds an `EXPECTED_TAGS` row (`bundle-splitting.test.ts:52-55` says "Each C task adds its row here"). A family adds a row with two tags. If a group matches its items by tag name, it may also need an `ALLOWED_TAG_REFERENCES` row, as ButtonGroup has (AM-090).

## 3. Probes

All commands ran on 2026-11-26 on macOS 27.2.1 (arm64) in the worktree `line-ui-z23` (branch `docs/01-z23-r8-packaging-weight`, HEAD `5ae575e`, which is `origin/main` `9c9b1f4` plus the ledger commit). Dependencies came from `HOME=/tmp/emptyhome bun install --frozen-lockfile` (Bun 1.4.5, 728 packages). Throwaway files lived under `/tmp/z23-probes/` and were deleted afterwards; `git status` stayed clean.

**No browser probes.** Every claim in this note concerns bundles, manifests and source files. None concerns layout or behaviour in an engine, so plan §5.3's three-engine rule and the Linux WebKit rule had nothing to apply to. The questions that need engines (item elements inside shadow roots, machine DOM queries) are R1's (§2.2). Linux ran only `gzip`, in `ubuntu:24.04` under `docker run --rm --cpus 2 --memory 1g`. The local image was the linux/amd64 variant, so the run was x86_64 under emulation, the CI architecture.

| Engine | Probes run |
|---|---|
| Chromium 159.0.8154.6 | none (not needed) |
| Firefox 159.0 | none (not needed) |
| WebKit 27.2 build 2388, macOS | none (not needed) |
| WebKit 27.2 build 2388, Linux | none (not needed) |

### 3.1 Repo build and size report

| Command | Exit | Observed |
|---|---|---|
| `bun --filter './packages/*' build` (Bun 1.4.5, Node 22.23.5 on `PATH`) | 0 | 20.4 s |
| `bun scripts/report-size.mjs` | 0 | `line-components@0.2.8` packed. Component only, gzip: alert 1,556, aspect-ratio 618, avatar 1,869, avatar-group 3,964, badge 1,290, button 2,735, button-group 2,272, center 461, chip 1,570, grid 1,026, icon 1,990, icon-button 2,173, kbd 2,427, portal 691, presence 932, separator 643, skeleton 1,303, spinner 1,314, stack 890, visually-hidden 346. Baseline: Lit 15,468 / 5,943; `LineElement` 3,236 / 1,303; `line-core/styles` 4,310 / 1,222; Zag core + vanilla 19,963 / 7,493; `commonReset` alone 381 / 278 |
| esbuild CLI `--bundle --minify --format=esm --target=es2022` on `import '@websublime/line-components/chip'` from `packages/line-components` (built `dist/`, nothing external) | 0 | 41,927 / 14,840 B; with `./presence` added, 50,090 / 16,953 B |

### 3.2 Machine weights (`measure.mjs`, `split.mjs`)

- **Setup.** In `/tmp/z23-probes/consumer`, `bun add --exact esbuild@0.28.2 lit@3.3.3` plus `@zag-js/{core,vanilla,presence,toggle,checkbox,radio-group,switch,toggle-group,slider,number-input,select,editable,password-input,date-input,auto-resize}@1.49.0` resolved 43 packages. These included `@internationalized/date` 3.12.4 (auto-installed peer), `@internationalized/number` 3.6.9, `@floating-ui/dom` 1.8.0, `@floating-ui/core` 1.8.0, `@floating-ui/utils` 0.2.12 and `proxy-compare` 3.0.1. Every installed `@zag-js/*` package was 1.49.0.
- **`measure.mjs`.** This script copies `report-size.mjs`'s `measure()`: esbuild `build({ stdin, bundle, minify, format: 'esm', target: 'es2022', write: false })` with `metafile: true`, then `gzip -9 -n -c` through the CLI.
  - Rows: B0 and B1 as in §2.3. Per machine: alone (the aliased entry of §2.3, `export { machine as machine_<m>, connect as connect_<m> } from '@zag-js/<m>'`, nothing external); own (unaliased `export { machine, connect }` from `./node_modules/@zag-js/<m>/dist/index.mjs`, with `@zag-js/*`, `@internationalized/*`, `@floating-ui/*` and `@swc/*` external); `B0 + aliased machine`, `B1 + aliased machine`, `B0 + aliased machine` with `define: { 'process.env.NODE_ENV': '"production"' }`, and `B0 + export * from '@zag-js/<m>'`.
  - Aggregates and the `@internationalized/*` rows (with and without `external: ['@internationalized/date' | '@internationalized/number']`).
  - Exit 0, no esbuild warnings. The `define` rows equalled the plain rows. `esbuild` on B0 without `--minify` printed `isDev2 = () => true`, and the minified output held no `process.env`.
- **`split.mjs`.** This script computes the leave-one-out figures over `B1 + all ten`. It then runs an esbuild `entryPoints` build with `splitting: true` over `base.js` and one `<m>.js` per machine (`import { VanillaMachine } from '@zag-js/vanilla'; export { VanillaMachine }; export { machine, connect } from '@zag-js/<m>'`), with `write: false`, and runs `gzip -9 -n` on each output file. Chunk contents come from the metafile. Exit 0.

### 3.3 Version skew (`/tmp/z23-probes/skew`)

`bun add --exact @zag-js/core@1.49.0 @zag-js/vanilla@1.49.0 @zag-js/checkbox@1.48.0` produced this tree:

- 1.48.0: `node_modules/@zag-js/checkbox/node_modules/@zag-js/core`, and the hoisted `dom-query`, `utils`, `types`, `anatomy` and `focus-visible`.
- 1.49.0: the hoisted `core`, `vanilla` and `store`, and the copies nested under `core` and `vanilla`.

The B0 + checkbox bundle, 34,668 / 12,027 B, held two `@zag-js/core` copies, two `dom-query` copies and three `utils` copies (metafile, §2.4). The point of this probe is the duplication. Its size is not comparable with the aligned 1.49.0 rows, because checkbox 1.48.0 is different code.

### 3.4 Apple gzip against GNU gzip (`dump.mjs`)

`dump.mjs` wrote 26 of the §2.3 bundles to `/tmp/z23-probes/bundles/`. Apple gzip 487.40.2 compressed them on the host. `docker run --rm --cpus 2 --memory 1g -v …/bundles:/b:ro ubuntu:24.04` compressed them with GNU gzip 1.12 (linux/amd64). Selected rows, gzip bytes, Apple → GNU:

| Bundle | Apple | GNU | Δ |
|---|---|---|---|
| B0 | 7,493 | 7,503 | +10 |
| B0 + checkbox | 12,578 | 12,545 | −33 |
| B0 + radio-group | 13,394 | 13,351 | −43 |
| B0 + switch | 12,583 | 12,580 | −3 |
| B0 + toggle-group | 10,574 | 10,567 | −7 |
| B0 + slider | 15,765 | 15,743 | −22 |
| B0 + number-input | 16,936 | 16,907 | −29 |
| B0 + select | 34,231 | 34,188 | −43 |
| B0 + editable | 12,807 | 12,805 | −2 |
| B0 + password-input | 9,171 | 9,178 | +7 |
| B0 + date-input | 24,000 | 23,947 | −53 |
| B0 + six R8 | 30,835 | 30,726 | −109 |
| `@internationalized/date`, `export *` | 11,149 | 11,127 | −22 |

The GNU marginals over B0 are: Checkbox 5,042, Radio Group 5,848, Switch 5,077, Toggle Group 3,064, Slider 8,240, Number Input 9,404, Select 26,685, Editable 5,302, PasswordInput 1,675, DateInput 16,444, the six together 23,223.

### 3.5 Zag baseline entry shapes (`/tmp/z23-probes/zag1.46.0`, `zag1.47.0`)

`bun add --exact @zag-js/core@<v> @zag-js/vanilla@<v>`, then the esbuild CLI as in §3.1 and Apple gzip:

| Entry | 1.46.0 | 1.47.0 | 1.49.0 |
|---|---|---|---|
| `export *` core + `export *` vanilla (the report row) | 18,778 / 7,096 | 19,388 / 7,322 | 19,963 / 7,493 |
| `{ createMachine }` + `{ VanillaMachine }` (R9's row) | 14,478 / 5,390 | — | 15,664 / 5,796 |
| `{ VanillaMachine, normalizeProps, mergeProps, spreadProps }` | 17,844 / 6,748 (with `createMachine`) | — | 18,984 / 7,124 |

### 3.6 Upstream inspection

- Anatomies, connect and DOM files, `package.json` dependencies, peers and `sideEffects` of every installed package (§2.2, §2.5). `npm view`-equivalent registry reads (`curl https://registry.npmjs.org/<pkg>/latest` and `/<pkg>/1.49.0`) for `latest` versions and the `menu`, `popover`, `tooltip`, `combobox`, `dialog` and `date-picker` dependencies.
- `npm pack @awesome.me/webawesome@3.14.0 @fluentui/web-components @spectrum-web-components/radio @spectrum-web-components/action-group @spectrum-web-components/number-field` in `/tmp/z23-probes/packs`, which gave Fluent 3.2.5 and Spectrum 1.12.6 (§2.2).

## 4. Fit with line://ui

- **ARCHITECTURE §12 and MANIFESTO Law 6.** The "requires its parent" test places all six. Four are independents. The two compound ones depend on how slotted items are read (§5 gap 1).
- **MANIFESTO Law 4.** A family is one component's module tree, so a group that defines its item tag imports no other component. Option (c) avoids item elements altogether, at the cost of "slots over props for content".
- **Phase 1 spec SD4, SD12, §7.5.** A family subpath fits the registration harness and the isolation scan as they are. The harness needs a two-tag row, and possibly an `ALLOWED_TAG_REFERENCES` row.
- **SD21 and plan §7.1.** "Each component's gzipped size is reported" holds for component-only bytes. The machine weight, which §2.3 shows to be most of a pre-built component's cost, stays out of the report unless the report changes (§6 Q5).
- **PRD §1.6–§1.7.** The target is soft and "Monitored, not blocking" (`docs/PRD.md:153`). No figure here gates anything.
- **`line-genui`, ARCHITECTURE §17.4.** A family entry keeps one `load()` per descriptor. Option (b) would need the ChoicePicker mapping to load two subpaths.
- **R1, R4, R5.** Item elements inside shadow roots are R1's question. Select's 26.7 KB marginal, 21.6 KB of it on top of every other Phase 2 machine and mostly `@floating-ui` with `popper`, `dismissable` and `collection`, is evidence for R4's native-or-custom choice. DateInput's 16.5 KB marginal, with 10.5 KB of machine code, is evidence for R5's `@zag-js/date-input` or custom-machine choice.

## 5. Contradictions and gaps

None of these is R8's to resolve. Each goes to the post-research revision (plan §10 step 4) or to the spec.

1. **MANIFESTO Law 6 against ARCHITECTURE §12 on slots.** Law 6: "Families share a subpath only when their slots make them inseparable" (`docs/MANIFESTO.md:49`). §12: "Components connected via `<slot>` are always separate entrypoints — slots imply independence" (`docs/ARCHITECTURE.md:554`). For slotted radio and toggle items, Law 6 points to a shared subpath and the §12 sentence to separate ones. The §12 families (`./dialog`, `./tabs`, `./select`) are slotted children too, so the sentence also contradicts §12's own table. Under the hierarchy (`docs/PROCESS.md` §1), the lower document is the bug, but which reading was intended is a decision.
2. **Plan §8, the `@internationalized/date` risk row** (`docs/plans/02-plan-essential-forms.md:517`). The evidence contradicts the row only when the machine counts.
   - **Machine counted.** `@zag-js/date-input` breaks the target by its own code: 10,456 B own, 15,870 B as a split chunk, 15,362 B with every other machine present. `@internationalized/date` adds 4,919 B to that, so the row names the smaller cause. Read that way, the plan must return to the row before the spec (PROCESS §2).
   - **SD21 counting.** The machine is external, and the row's risk holds as written if line code imports `@internationalized/date` directly. The report does not keep that package external (`scripts/report-size.mjs:32-35`), and `{ parseDate, CalendarDate }` alone is 3,590 B gzip. Whether DateInput imports it, and so whether the row exceeds 5 KB, is open until code exists [INFERENCE].
   - The row's cause and its "Medium" likelihood therefore depend on the counting that §6 Q5 settles.
3. **Plan §7.1 italic criterion "Each component's gzipped size is reported against the < 5 KB soft target"** (`:481`). Under SD21 the report excludes every machine, so the criterion is met without the plan's §2.6 weight question ever reaching the report (`:159-160`). This is a gap, not a contradiction. The plan does not say which quantity counts, and Phase 1 SD21 does.
4. **ARCHITECTURE §12 lists entries without the six.** The independents line ends in "etc." (`docs/ARCHITECTURE.md:586`), and §10 shows a family layout (`:502-512`). With plan §5.3's "rules, not lists", the rule may be enough. If the list stays, it needs six rows.
5. **Number Input's tag** (`line-number-field` at `:1297`, `line-number-input` at `:1443`, `:1621`). This is already plan §5.7 row 5 (`docs/plans/02-plan-essential-forms.md:439`). It decides the subpath name.
6. **ARCHITECTURE §16.2 "custom elements rendered by the component"** for the steppers (`:1444`). A literal reading adds tags to `./number-input`, while plan §5.5 treats the steppers as parts.
7. **`scripts/report-size.mjs:15` says the Zag row follows "R9 §2.4 table".** It bundles `export *`, while R9 bundled named imports (§2.6). At 1.46.0 the two differ by 1,706 B gzip (7,096 against 5,390). This is a Phase 1 artifact, not a Phase 2 plan contradiction.
8. **"5 KB" has no unit** (`docs/PRD.md:153`, `:165`; spec §7.6). Two R8 machines sit between 5,000 and 5,120 B.

## 6. Recommendations and open questions for the post-research revision and the Phase 2 spec

1. **Independent entries.** `./checkbox` → `line-checkbox`, `./switch` → `line-switch`, `./slider` → `line-slider`, `./number-input` → `line-number-input`, each one tag as SD12 (recommended). The alternative `./number-field` → `line-number-field` follows ARCHITECTURE §14.10 (gap 5).
2. **Radio Group and Toggle Group.**
   - (a) Families `./radio-group` → `line-radio-group` + `line-radio-group-item` and `./toggle-group` → `line-toggle-group` + `line-toggle-group-item` (recommended). This follows the §12 "requires its parent" test and the `<family>-item` naming of the §12 families, and it keeps one `line-genui` `load()`.
   - (a′) The same families with `line-radio` as the radio item, as the other libraries name it.
   - (b) Separate item entries.
   - (c) No item element.
   - Whichever is chosen, R1 must show that the machine's item queries work with the chosen item DOM (§2.2).
3. **The slot wording** (gap 1). Which reading do MANIFESTO Law 6 and ARCHITECTURE §12 adopt? Either "inseparable slotted sub-components share a family subpath; independently usable components placed in another's slot (ButtonGroup's buttons, AvatarGroup's avatars) stay separate" (recommended, because it matches the §12 table and the Phase 1 precedents), or the literal §12 sentence (every slotted component is a separate entry).
4. **Rule or list in §12.** Does §12 keep the list and add the six (and the item tags), or state the rule with examples (recommended under plan §5.3)?
5. **What the soft target counts for pre-built components** (gap 3).
   - Keep SD21's component-only rows and add a per-machine table to `scripts/report-size.mjs`: each machine's marginal over the Zag baseline row, plus the code-split chunk size (recommended). The pre-built cost then becomes visible without becoming a gate.
   - Keep SD21 unchanged and record the machine weights once, in the spec.
   - Count component plus machine per row. Most pre-built rows would then exceed 5 KB (§2.3).
6. **The unit** (gap 8). 1 KB = 1,000 B, as Vite's report prints it and as R9 observed (recommended), or 1,024 B. Is the CI's GNU gzip the reference implementation (recommended, since that is where the report runs)?
7. **The report's Zag baseline row** (gap 7). Bundle what `line-core/machine` and a machine actually import, which gives a higher first-machine marginal, or keep `export *` and correct the comment (recommended: the smaller change, with the marginals in this note on the same basis).
8. **`@internationalized/date`, if DateInput uses `@zag-js/date-input`** (R5 decides that).
   - A `line-components` `dependencies` entry with a caret range on the current major, `^3.12.4` (recommended): the machine's unbounded peer is satisfied in every install, and the version the probes measured is the one consumers get.
   - A `line-components` peer, so the consumer installs it once for DateInput and the Phase 4 DatePicker.
   - Rely on the package manager installing the machine's peer [INFERENCE: install behaviour differs by package manager and was not probed].
9. **The plan §8 risk row** (gap 2). If Q5 counts the machine, should the row be restated as "DateInput's machine (`@zag-js/date-input` with `@internationalized/date`) exceeds the size target"? If SD21 stays, does the row keep its cause and name the direct import of `@internationalized/date` by line code as the trigger? Either way, what are its likelihood and impact?
10. **Zag version alignment** (§2.4, probe 3.3). Does `line-components` keep `^1.49.0` on every machine, or pin all `@zag-js/*` to one exact version so that consumer trees cannot split `@zag-js/core`? If it keeps carets, do the docs tell consumers to keep Zag aligned? Pinning is a dependency-policy decision for stream P, with no recommendation here.
11. **The CDN import map** (§2.7). Does the unpkg map in the docs and in `cdn.e2e.ts` grow one entry per component row (8 entries for the six R8 machines, 24 for all of Phase 2), or is it derived from each machine's dependency closure (recommended under plan §5.3, because the list grows with every row)?
12. **Range Slider and Segmented Control** (later phases). If they reuse the Slider and Radio Group machines, does the shared wrapper go under `src/shared/`, as `button-machine.ts` did (AM-002)? Phase 2 needs no action.

## 7. Sources

All retrieved or run 2026-11-26.

- Zag 1.49.0 packages (installed by Bun 1.4.5 into `/tmp/z23-probes/consumer/node_modules`): `@zag-js/{checkbox,radio-group,switch,toggle-group,slider,number-input,select,editable,password-input,date-input,auto-resize}` `dist/*.anatomy.mjs:3`, `radio-group.connect.mjs:90,136,144,155`, `radio-group.dom.mjs:15-18`, `toggle-group.connect.mjs:60`, `toggle-group.dom.mjs:7-10`, `number-input.utils.mjs:1`, `date-input.machine.mjs:1`, `date-input.parse.mjs:1`; `package.json` of each (`sideEffects`, dependencies, peers); `@zag-js/utils/dist/guard.mjs:2`, `warning.mjs:4,8`; `@zag-js/store/dist/utils.mjs:9`
- `@internationalized/date` 3.12.4 and `@internationalized/number` 3.6.9 `package.json:15` and `dist/**`
- npm registry: https://registry.npmjs.org/@internationalized/date (3.12.4, 2026-09-01), `@internationalized/number` 3.6.9, `@floating-ui/dom` 1.8.0, `@swc/helpers` 0.5.24, `esbuild` 0.28.2, `@zag-js/checkbox` versions (latest 1.49.0; 2.0.0-next.4 the newest pre-release); `@zag-js/{menu,popover,tooltip,combobox,dialog,date-picker}/1.49.0` manifests
- esbuild API, platform and the `process.env.NODE_ENV` default under minification: https://esbuild.github.io/api/#platform (and probe 3.2)
- esbuild API, code splitting: https://esbuild.github.io/api/#splitting
- Web Awesome 3.14.0 (`npm pack @awesome.me/webawesome@3.14.0`): `dist-cdn/custom-elements.json`, `dist-cdn/components/radio-group/radio-group.js`, `dist-cdn/chunks/chunk.RV5MEM4L.js:126`, `chunk.IX2GQ2J6.js:336`
- Spectrum Web Components 1.12.6 (`npm pack @spectrum-web-components/radio`): `package.json` `exports`, `sp-radio-group.js:1`
- Fluent UI Web Components 3.2.5 (`npm pack @fluentui/web-components`): `dist/esm/radio-group/define.js:1-3`, `dist/esm/radio/`
- GNU gzip 1.12 in `ubuntu:24.04` (linux/amd64); Apple gzip 487.40.2
- Probe artifacts (§3), deleted after the run
