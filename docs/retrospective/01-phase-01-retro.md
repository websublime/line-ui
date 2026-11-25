# Phase 1 retrospective

## Summary

- Phase 1 shipped the first 20 line://ui components and the agent-driven UI foundation, `@websublime/line-genui`
  (PRD §7.3, ARCHITECTURE §17).
- It delivered 9 published packages (one new), 2 apps and 4 new GitHub Actions workflows, for 10 in total.
- Every package reached npm `latest` in `0.2.x` through `release.yml` with SLSA provenance. The phase-exit Version PR,
  #363, merged on 2026-11-24 and released the last four first `0.2.0`s.
- Row work ran from 2026-10-21 (#283, 01-P8) to 2026-11-25 (#364, 01-D3), 35 days. The ledger closed with 69 rows.
- The exit sweep ran on 2026-11-20, before the last rows landed, and filed row 01-Z10 (release-time records).
- The exit date of record is **2026-11-25**. On that date row 01-Z3 checked every spec §9 criterion in three slices
  (spec §6.Z.2, AM-115). The local slice ran each command once at `16d3e06`, the `main` commit of the #364 merge, in a
  detached worktree. The static slice read the files at that sha. The remote slice queried GitHub Actions, the
  Version PRs, the npm registry and the deployed URLs, and the main session opened the deployed recipes in a browser.
- No criterion failed, so the close filed no row. It found two factual errors that it corrected in place:
  - The §9.1 approval check named a `**Status:** APPROVED` line that component specs do not have (spec AM-116).
  - The `00-Z29` trigger named a Biome PR that already ships in 2.5.15 (see Open items).

## Exit criteria

Spec §9 mirrors plan §7.1–§7.4 item by item and keeps the 17 PRD §7.3 criteria in their own wording, so each row
below closes a spec box, its plan §7 twin and, where one exists, the PRD criterion. `S9.x.y` is bullet `y` of spec
§9.x in document order. "Pass" means the evidence was observed on 2026-11-25. Line locators cite `16d3e06`.

`checks.yml` runs only on `pull_request`, so `main` has no `checks` run. CI evidence for `16d3e06` comes from run
[45591598791](https://github.com/websublime/line-ui/actions/runs/45591598791) on the #364 head `e1cad58`, whose
tree (`71ae3d1`) equals the tree of `16d3e06`. All 17 steps of that run succeeded.

| ID | Criterion | Status | Evidence |
|---|---|---|---|
| S9.1.1 | All components pass the 8-point test checklist (PRD §5.2) | Pass | Local: the Unit tier `bun test --isolate` exits 0 with 1733 pass, 0 fail in 66 files. The Browser tier projects `chromium`, `firefox` and `webkit` have 0 failures. CI run 45591598791: `Unit tier` and `Browser tier` (`bun run e2e`, which includes `visual`) succeeded. |
| S9.1.2 | Storybook documentation complete for every component | Pass | Local: the Storybook build exits 0. A throwaway probe opened all 20 `components-<c>--docs` pages and matched the attributes, slots, events and CSS parts row for row against the shipped `line-components/custom-elements.json` (for example `line-button` 15/4/1/3). Remote: `deploy-storybook` run 45594358885 on `16d3e06` succeeded, and the deployed `index.json` lists the 20 autodocs entries. |
| S9.1.3 | Zero axe-core violations | Pass | Local: the 22 `packages/line-components/__tests__/a11y/*.e2e.ts` files pass in Chromium, Firefox and WebKit with 0 failures and 0 skips. |
| S9.1.4 | Every story and every Roles combination has a committed Chromium baseline; the visual tier passes; the release PR records a passing `visual-off-pairs.yml` run | Pass | 541 `-visual-linux.png` baselines are committed, each from a `visual-baselines.yml` run (the 10 latest all succeeded, the last 44541775928). CI run 45591598791 ran the `visual` project inside its successful `Browser tier`. #363's record comment [7139284214](https://github.com/websublime/line-ui/pull/363#issuecomment-7139284214), posted before the merge, cites `visual-off-pairs.yml` run 45446526724 (success, 544 passed, 62 skipped). Locally on macOS the 231 `visual` tests fail because only Linux baselines are committed (`.gitignore:21`). A run in the Playwright Linux image, which is not the runner that made the baselines, failed 68 Roles and Kbd screenshots by a few pixels. Neither run is the gate. |
| S9.1.5 | CEM manifest generated and verified | Pass | `verify-pack` exits 0 for 9 packages. With `custom-elements.json` moved out of `line-components` it exits 1 with "(a) export target ./custom-elements.json missing", and 0 again once restored. G5 `cem-drift.test.ts` (21) and `cem-coverage.test.ts` (3) pass. |
| S9.1.6 | Storybook loads the manifest through `setCustomElementsManifest`; `line-components` and `line-genui` each ship one with `customElements` and a `files` entry | Pass | `apps/storybook/.storybook/preview.ts:7-8` imports both manifests and `:14-17` merges them into `setCustomElementsManifest`. Both manifests declare `"customElements": "./custom-elements.json"` and list the file in `files`, as do the published `line-components@0.2.8` and `line-genui@0.2.0`. `scripts/verify-pack.mjs:160-176` check (a) iterates the field. |
| S9.1.7 | Changeset entry for every component | Pass | Each C1–C20 PR (#300, #316, #303, #305, #326–#328, #333–#338, #340–#346) adds a `.changeset/*.md`, and each appears as a changeset source in a Version PR changelog (#302, #304, #307, #313). |
| S9.1.8 | Every component spec APPROVED before code, with the Agent contract filled | Pass | Each of the 20 specs (`0002`–`0022`, without `0005`) entered `main` in its own implementation PR with its Status row at `:5` reading `approved` with Miguel's name and a date, and each approval date equals its PR's creation date. Each carries a filled `### Agent contract`, and no `TODO`, `TBD` or `<fill` remains. The check's `**Status:** APPROVED` wording did not match the template's Status row (`COMPONENT-SPEC-TEMPLATE.md:9`), and spec AM-116 corrects it. |
| S9.1.9 | Every component fills the htmx Tests row per C9 | Pass | All 20 rows are filled. Button (`0002-button.md:339`), IconButton (`0003-icon-button.md:334`) and Chip (`0008-chip.md:419`) run `@websublime/line-testing/htmx`, and their `*.htmx.e2e.ts` files pass in three engines, each skip an "(a) n/a" annotation. The other 17 rows read `n/a` with a reason. |
| S9.1.10 | Every component fills its row in `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` | Pass | `docs/COMPETITIVE-COMPONENT-ANALYSIS.md:32-51` holds the 20 rows, each with tag, subpath and spec file, and every C1–C20 PR modifies the file. |
| S9.1.11 | Each component's gzipped size is measured against the < 5 KB soft target | Pass | The `Size report` step of run 45591598791 prints the per-component table (`gh run view 45591598791 --log`). All 20 are under 5 KB gzip; the largest is `./avatar-group` at 3964 B and the smallest `./visually-hidden` at 346 B. The local run printed the same table. |
| S9.2.1 | Every component has an agent descriptor or `agentExposed: false` with a reason; the CEM drift and coverage tests pass | Pass | There are 20 descriptors for the 20 defined tags. Portal, Presence and Visually Hidden carry `agentExposed: false` with a reason. `cem-drift.test.ts` 21 pass and `cem-coverage.test.ts` 3 pass. |
| S9.2.2 | The inline `catalog.json` validates against A2UI v0.9.1 `Catalog`; `web_core` reads it back with `Catalog.fromJson`; `validationSchema` compiles | Pass | `packages/line-genui/__tests__/catalog-emitters.test.ts` passes all 16 tests, among them the three named assertions. |
| S9.2.3 | The Phase 1 `basic` subset is registered under the v0_9 basic id; unmapped types render an inert placeholder and raise `line-a2ui-error` | Pass | `catalog-emitters.test.ts` "a lookup by the v0_9 basic id returns the 10 Phase 1 types and no other". `a2ui-surface.test.ts` (117 pass) covers the mapped types, "each unmapped basic type renders an inert placeholder and raises one error" and "a basic Image with variant avatar renders line-avatar". The browser `a2ui-surface.e2e.ts` renders the avatar route in three engines. |
| S9.2.4 | Frontend-tool schemas validate, flat and literal; accepted by OpenAI and Anthropic in strict mode and by Gemini; Anthropic live call before each release; descriptions ≤ 1024 characters | Pass | `frontend-tools.test.ts` passes 303 tests: Ajv 2020-12 compile, the offline R3 P11 subset per provider, the strict serialisations and the 1024-character cap. The Unit tier passed on every recent PR head. #363's record comment cites the Anthropic live call on 2026-11-24, 17 of 17 tools with `strict: true`. The required `release-records` status on #363's head `472ef4e` is `success` (run 45449235184). |
| S9.2.5 | `hosts/mcp-apps.css` maps every reference-list key to a line alias or token and passes `lint-layers` | Pass | The §6.G.6 table and its summaries (`docs/specs/01-spec-core-primitives.md:1656-1750`) settle all 76 keys: 40 mapped and 36 excluded with a reason. Each of the 40 appears in `packages/line-themes/src/hosts/mcp-apps.css` with the same target and form (18 aliases on `:where(html)`, 22 primitives on `body`), and no excluded key appears. `lint-layers` exits 0. `mcp-apps.e2e.ts` passes 6 tests in each of three engines. |
| S9.2.6 | `<line-a2ui-surface>` renders every agent-exposed component with zero axe violations; document `::part()` rules apply | Pass | `a11y/a2ui-surface.e2e.ts` passes 18 tests in each of three engines. `line-genui/__tests__/a2ui-surface.e2e.ts` passes 10, including "document ::part() rules reach the rendered elements". All 13 agent-exposed C5–C20 PRs extend `apps/storybook/stories/agent-ui/a2ui-fixtures.ts` and the surface axe test, and the three flagged components touch neither. |
| S9.2.7 | `line-genui/catalog` defines no element; `line-genui/a2ui` defines only `line-a2ui-surface` | Pass | `bundle-splitting.test.ts` "line-genui registration (§7.5; §6.G.4)" passes both tests on the packed tarball. |
| S9.3.1 | Storybook holds one recipe per transport (AG-UI, A2A, MCP, SSE) | Pass | The deployed Storybook lists `recipes-ag-ui`, `recipes-a2a`, `recipes-mcp` and `recipes-sse`. The main session opened their stories on `https://line-ui-storybook.websublime.com`, and each rendered `line-a2ui-surface` with `line-stack`, `line-separator`, `line-button` and `line-icon`, with no undefined tag. `transport-recipes.e2e.ts` passes 24 tests in each of three engines, and the Bun middleware comparison test `ag-ui-middleware.test.ts` passes 4. |
| S9.3.2 | The site landing page is built with Phase 1 components and live at `line-ui.websublime.com` | Pass | The page serves the hero, the value proposition, six feature cards and Storybook links, with 18 distinct Phase 1 tags. `deploy-site.yml` run 45449463773 on `3d85dd6` succeeded; #364 touched no path that triggers it. `landing.e2e.ts` passes in three engines, including ":defined" and axe in light and dark. |
| S9.4.1 | Bundle splitting verified | Pass | `bundle-splitting.test.ts` passes 52 tests on the packed tarball: registration, isolation, the esbuild consumer bundle, the `line-genui` registration and bare specifiers. |
| S9.4.2 | `scripts/lint-layers.mjs` carries the `line-genui` edges and passes | Pass | `ALLOWED_EDGES` (`scripts/lint-layers.mjs:61-71`) equals the spec §3.3 block line for line, and `bun run scripts/lint-layers.mjs` exits 0. |
| S9.4.3 | The npm trusted publisher for `line-genui` exists before its first release | Pass | Miguel confirmed on 2026-11-25 that the package settings show two trusted publishers, `snapshot-deploy.yml` and `release.yml`, and token publishing disallowed. The registry agrees: every version after the P4 bootstrap canary was published by GitHub Actions OIDC, the snapshots by one publisher config and `0.2.0` (release run 44352740726) by a second. `docs/context/01-p4.md` and `01-p14.md` record both set-ups before #313 merged. |
| S9.4.4 | CDN delivery through unpkg and jsDelivr verified against the SD32 two-path contract | Pass | #363's record cites `cdn-check.yml` run 45448374870 (success, 11 passed, 1 skipped) against `0.2.8-d4e13c9…-SNAPSHOT`, after `snapshot-deploy` run 45446521793. Run 45589828377 against the released `line-components@0.2.8` also succeeded. The skip is the unpkg page in Firefox (AM-105). The C22 `consumer-matrix.e2e.ts` passes for vite, esbuild and webpack in three engines. |
| S9.4.5 | The workspace builds, type-checks and emits declarations on TypeScript 7.x | Pass | `bun run build` and `bun --filter '@websublime/*' typecheck` (12 workspaces) exit 0. `verify-pack` exits 0, and `tsc --version` prints 7.0.2. |
| S9.4.6 | One `LineElement` class for a consumer of `line-core` and a component subpath | Pass | `line-element-identity.test.ts` passes. |
| S9.4.7 | The spec records the utility-class decision (PRD §9.13) | Pass | Spec §10 SD1. |
| S9.4.8 | Every package is released in `0.2.x` through `release.yml` with provenance; `line-genui` gets its first release | Pass | npm `latest` is `0.2.x` for all nine packages, each with SLSA v1 provenance. Each first `0.2.0` names `.github/workflows/release.yml` on `refs/heads/main` in its attestation: `line-core` (#292), `line-components` (#299), `line-icons` (#311), `line-themes` and `line-genui` (#313), and `line-tokens`, `line-colors`, `line-schemas` and `line-utils` (#363). `bun run scripts/publish.mjs --dry-run` lists the nine at `0.2.x` with `line-genui` at 0.2.0 and publishes nothing. |
| S9.4.9 | A code of conduct is present before `v0.2.0` | Pass | `CODE_OF_CONDUCT.md` (Contributor Covenant 3.0, contact `hello@websublime.com`) landed with #329 on 2026-11-10, before the phase-exit Version PR #363, which is the deadline spec §6.Z.1 sets, and `README.md:82` links it. Under the per-package phase minor of row 01-Z6, four first `0.2.x` releases came before it: `line-core` 0.2.0 (#292, 2026-10-26), `line-components` 0.2.0 (#299, 2026-10-27), the first component, Button, in `line-components` 0.2.1 (#302, 2026-10-28), and `line-icons` 0.2.0 (#311, 2026-10-29). PRD §10 ties the code of conduct to the first published components, so the file trailed the first published component by 13 days. |
| S9.4.10 | Rows `00-Z28` and `00-Z30` done; `00-Z29` done or still blocked on the Biome release | Pass | `00-Z28` and `00-Z30` are `done` (#262, #264). `00-Z29` is `blocked`, and a probe showed that the panic it waits on persists: Biome 2.5.15 and 2.6.8 both panic with "path is expected to be under the root" when they format a directory outside the root with `vcs.useIgnoreFile` on. See Open items for its trigger. |
| S9.4.11 | The exit sweep runs before the last rows land, its findings become rows, and the retrospective is written with a Phase 2 hand-off | Pass | The sweep ran on 2026-11-20 (`docs/context/01-z10.md:8`) and filed Z10, which merged as #361 before P13 (#362) and D3 (#364). This file is the retrospective, and its hand-off names the SD76 widening duty. |

## What shipped

### Packages

| Package | npm `latest` | Phase 1 change |
|---|---|---|
| `@websublime/line-genui` | 0.2.0 | New. Descriptor API, `line` and `basic` A2UI v0.9.1 catalog emitters, the frontend-tool JSON Schema emitter, `<line-a2ui-surface>` (preview) on `@a2ui/web_core`, the CEM drift and coverage tests |
| `@websublime/line-components` | 0.2.8 | 20 components on per-component subpaths, with a shipped `custom-elements.json` |
| `@websublime/line-core` | 0.2.3 | `LineMachineController.updateProps` on every host update (C21, C24), `ElementInternals` behind `INTERNALS` (C23), the Zag 1.47 floor |
| `@websublime/line-icons` | 0.2.2 | Resolvers fetch from a consumer base URL, subpaths per library, `line-icons/a2ui` (C22, G2) |
| `@websublime/line-themes` | 0.2.1 | The MCP Apps bridge `hosts/mcp-apps.css` (G6) |
| `@websublime/line-tokens`, `line-colors`, `line-schemas`, `line-utils` | 0.2.0 | Phase-exit `minor` only (P13) |

`@websublime/line-testing` (row 01-Z5) is private at `0.0.0`, holds the shared htmx harness, and Changesets ignores it.
Phase 1 had 14 Version PRs: #284, #287, #292, #297, #299, #302, #304, #307, #309, #311, #313, #356, #358 and #363.

### Apps

| App | Phase 1 change |
|---|---|
| `apps/storybook` | The 20 component stories, grouped `Components/<PRD §4 category>/<Name>` with pinned ids (Z9), the Agent UI surface stories (G4), the transport recipes (G7), the Recipes index (D2), the CSS mask icons recipe (D4), the Agent-driven UI guide (D1), the Getting Started update (D3), and the merged `line-components` and `line-genui` manifests (P10, G4) |
| `apps/site` | The landing page built from the Phase 1 components (S1, AM-108–AM-111) |

### CI workflows

The six Phase 00 workflows stay. Phase 1 added four:

| Workflow | Row | Purpose |
|---|---|---|
| `visual-baselines.yml` | P11 #288 | Dispatch on a PR branch; writes the Chromium `-visual-linux.png` baselines |
| `visual-off-pairs.yml` | P11 #288 | Dispatch on `main` before each release; compares the 310 off-pair Roles baselines |
| `cdn-check.yml` | C22 #310 | Dispatch; runs the `*cdn.e2e.ts` specs against a canary or a release (inputs from P6, `run-name` from Z10) |
| `release-records.yml` | Z10 #361 | Posts the `release-records` status that branch protection requires on a Version PR (AM-114) |

`checks.yml` runs the Unit tier as `bun test --isolate` (AM-085) and lost the zero-export smoke step (P5).
`release.yml` and `snapshot-deploy.yml` build and publish in separate jobs (P16, AM-104).

### By stream

| Stream | Shipped | Main PRs |
|---|---|---|
| P — platform and release | `line-genui` scaffold and publish coverage, layer edges, the trusted publishers, bundle-splitting checks, the CDN check, the axe tier, TypeScript 7, externals, CEM packaging, the visual tier and its baselines, the phase-exit minors, the build/publish split | #283, #285, #286, #288, #289, #294, #298, #306, #312, #314, #315, #348–#351, #362 |
| C — core primitives | Button, Icon, Stack, Separator, IconButton, ButtonGroup, Alert, Chip, Badge, Avatar, AvatarGroup, Visually Hidden, Portal, Kbd, Skeleton, Presence, Grid, Center, Aspect Ratio, Spinner; the `line-core` and `line-icons` changes they needed (C21–C24); 8 bug rows (C25–C32) | #291, #293, #296, #300, #303, #305, #308, #310, #316–#318, #326–#328, #330, #333–#338, #340–#346, #354, #355, #357 |
| G — agent-driven UI | Descriptor API, catalog emitters, frontend tools, the surface, the CEM tests, the MCP Apps bridge, the transport recipes | #319–#325 |
| D — documentation | The agent-driven UI guide, the Recipes index, the Getting Started update, the CSS mask icons recipe | #347, #352, #359, #364 |
| S — site | The landing page | #353 |
| Z — repo-wide | Code of conduct, workspace resolution in tests, the per-package phase minor, the bridge specificity claim, line-locator realignment, Storybook categories, the release-time records, the exit and this retrospective | #290, #295, #329, #331, #332, #339, #360, #361 |

The Phase 1 spec closed with 116 amendments. Of AM-001–AM-115, 63 are factual corrections and 52 are decisions, and
AM-116 is a factual correction from this close. The 20 component specs carry 156 more, 137 at `16d3e06` and 19 from
this close. About 65 of them are locator-only realignments, 19 from this close. The PRD took revisions v0.8.20 to
v0.8.35.

## Lessons learned

1. **State a rule, not an enumerated list, when the set will grow.** Spec §6.G.3, §6.G.4 and SD47 listed the
   components that take no host name. Kbd, Skeleton, Grid, Center and Aspect Ratio each had to raise their row to
   `decision` and add an AM (AM-098, AM-099, AM-101–AM-103), and AM-098 also back-filled Alert. A rule such as "a
   `generic` host takes no name" would have needed one AM.
2. **Probe a claim before the docs or the descriptor state it.** Phase 1 escalated 14 times across 12 rows under the
   two-iteration rule (PROCESS §5). Several of them traced to unprobed claims: the Stack and Grid sizing in
   agent-facing descriptions (`docs/context/01-c18.md`, `01-c19.md`) and the G4 limit bypass through message shapes
   the tests had not tried (#321, AM-083, AM-084). Each fix was a new probe.
3. **Line locators drift with every revision note.** Z4 (AM-112) and Z8 (AM-091) realigned them, Miguel kept line
   locators over section-only citations, and PRD v0.8.33 and v0.8.34 alone still produced 30 locator-only component
   AMs. This close repeats it for PRD v0.8.35. The cost grows with every spec that cites the PRD by line.
4. **The platform matters, not only the engine.** Linux WebKit collapsed a Button inside the validation bubble
   (C1, found by the throwaway PR #301), focuses a button on click where macOS WebKit does not (`0004` AM-009 to
   AM-012), and Bun ran test files in a Linux readdir order that exposed a shared registry (#321). Local macOS runs
   cannot stand in for the Linux runner, and the visual baselines are Linux-only by design.
5. **Engine-only behaviours surface through dogfooding and the Browser tier.** The S1 landing page found C30 (legacy
   `align` centres text in Chromium and WebKit) and C31 (the `↩` emoji glyph on macOS). WebKit-only `slotchange`
   (`0006` AM-003), the Firefox RTL panel (`0010` AM-006) and Chromium's unresolved document `@keyframes` from a
   shadow root (`docs/context/01-c15.md`) came the same way.
6. **Fix a flaky test at its cause.** P15 found two copies of axe racing, and the tier had been silently auditing
   with axe 4.11.4 instead of 4.14.0 (#306). C32 replaced a fixed 5 s wait under WebKit load. Neither fix added a
   retry.
7. **happy-dom is still not a browser** (Phase 00 lesson 2). `HTMLSlotElement.assign()` appends instead of replacing
   (`0010` AM-002), one registry per process forced `bun test --isolate` (AM-085), and `attachInternals` is still
   faked in the preload.
8. **Upstream APIs move under an approved spec.** Zag `updateProps` (zag#3556, fixed for 1.47.0; C21, C24),
   `@a2ui/web_core` loading Lit unbundled (AM-065) and an O(n²) `NodeResolver` (#321), Storybook option labels and
   matchers (C26, C27), the CEM analyser (AM-054, C28), GitHub's `pull_request_target` default (01-Z10) and
   TypeScript 7 with no JS API (#283) each needed a row decision or an AM.
9. **A release duty with no row and no gate gets missed.** The spec put the release-time records on Miguel per
   Version PR, and nothing carried them. 11 of the 12 Version PRs from #287 to #358 merged without the
   `visual-off-pairs.yml` record, until the exit sweep filed Z10 and AM-114 made `release-records` a required status.
   #363 is the first Version PR gated by it and carries every record.
10. **Security review finds real defects in every publish- or agent-facing change.** It caught agent Buttons
    submitting host forms (G4, AM-081), a CSS-escaped `url(` in the icon sanitiser (`0014` AM-002), a forged
    `success` status through a fork PR (Z10), a newline in an artifact name escaping `packages/` (P16) and
    version-string injection into page scripts (P6).
11. **Classes ratchet upward when a spec draft meets the approved spec.** Eleven rows rose from `task` to
    `decision` (C11, C13–C15, C17–C19, C23, G1, G3, Z3). C13 reversed a PRD premise: Portal moves no node
    (PRD v0.8.33).
12. **Run the exit sweep early, again** (Phase 00 lesson 9). The 2026-11-20 sweep found Z10 in time for it to land
    before P13. The close then found two more factual errors, the §9.1 approval check and the `00-Z29` trigger, which
    no row had read since they were written.

## Open items

| Item | Detail | Owner |
|---|---|---|
| Release-record gaps before Z10 | `visual-off-pairs.yml` was due from #288 (2026-10-22) and is not recorded on #287, #292, #297, #299, #302, #304, #307, #309 or #311. `docs/context/01-z10.md:32` and the Z10 row list six of these and omit #287, #297 and #299. A passing run, 40645743993, exists on #302's base `00612da` but was not posted. `cdn-check.yml` was due from #310 and is missing on #311. #313 recorded the C22 matrix only, before P6 landed, and an Anthropic-only call under a deviation Miguel accepted before AM-113. The October records cannot be rebuilt, because those builds are no longer `latest` (`01-z10.md:42`). #356 and #358 were backfilled after their merges (01-Z10 F1). | Recorded only |
| `00-Z29` trigger | The row waits for "a Biome release after 2.5.15 [that] ships PR biomejs/biome#11869". #11869 merged on 2026-09-21 and its commit is already in 2.5.15, so every later release meets the trigger as written, yet 2.6.8 still panics (probe on 2026-11-25). This PR rewords the row and plan §5.4 O4.b and §11 to wait for a Biome release that fixes biomejs/biome#12158, checked by a format run outside the root without the flag. npm 2.6.9 could not be installed for the probe (`ETARGET` on its platform binary). | `00-Z29` |
| CDN literals in Getting Started | D3 pins `line-components@0.2.8` and `line-core@0.2.3` in the CDN snippets, which go stale at the next release (#364, Decisions). | No row yet |
| WebKit and `web_core` scaling | WebKit spends O(n²) inserting many children into a rendered `<line-stack>`, `web_core` costs O(N) per message, and there is no cap on surfaces per session (#321, "Known, recorded only"). | No row yet |
| `0019-grid.md:248` locator | It cites the Radix column of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md` at `:22`, which is Bits; Radix is `:21` (`docs/context/01-c18.md`, drift item 5). This PR fixes it in the `0019` locator AM. | Fixed here |
| Skeleton inside Aspect Ratio | `<line-skeleton>` in an Aspect Ratio box draws a 20 px bar, or nothing at 100% block size (`docs/context/01-c19.md`, drift item 6). | No row yet |
| CEM `type` of Button | The manifest lists the Button member `type` as `string` (#300, Open items 2). Whether a later row fixed it was not checked. | No row yet |
| `line-genui@0.0.0-stage` | `line-genui` lists the placeholder `0.0.0-stage` from the P4 bootstrap (`docs/context/01-p4.md:132`), as the five packages `00-Z21` cleaned in Phase 00 did. | No row yet |
| `snapshot-deploy.yml` publisher scope | It keeps `npm dist-tag` and `npm stage publish` against the security reviewer's advice, by Miguel's decision (`docs/context/01-p4.md:124`). | Recorded only |
| `release-records` limits | It does not defend against a write collaborator, and comment spam spends the `GITHUB_TOKEN` budget (spec §7.2; `docs/context/01-z10.md`). A new write collaborator reopens the question. | Recorded only |
| Repo agents not mounted | The `sdlc`, supervisor and `git-workflow-manager` agents were not mounted in the harness, so general subagents ran their checklists (#300, #353, #362, #364). | No row yet |
| Phase 1 spec locators in component specs | PROCESS §3 realigns live locators only when ARCHITECTURE or the PRD moves. Phase 1 spec AMs that added lines, such as AM-114 (sixteen lines in §7.2) and AM-115, moved the spec under the component specs' `docs/specs/01-spec-core-primitives.md:N` and Governing-sections locators. For example `0019-grid.md:7` cites the C17 row at `:1173`, which is the C12 row at `16d3e06`, and its SD12 locator `:2359` lands on a §9.4 check. | No row yet |

## Hand-off to Phase 2

1. **The SD76 widening duty.** Spec §7.2 states it: "Each later phase that moves `line-components` or `line-icons`
   to a new minor widens both peer ranges in `packages/line-genui/package.json`, for example `|| ^0.3.0`. The first
   PR of that phase that adds a `minor` changeset for either package does it on `main`, before `changeset version`
   builds a Version PR that carries that `minor` (§10 SD76; §12 AM-051). The `devDependencies` follow Changesets."
   Today both peers read `workspace:^0.1.0 || ^0.2.0` (`packages/line-genui/package.json:37-40`), and
   `.changeset/config.json` sets `onlyUpdatePeerDependentsWhenOutOfRange: true`. No script fails on a miss, so
   Miguel, who merges each Version PR, checks that no package goes past the phase's minor line, which is `0.3.x` in
   Phase 2 (PROCESS §6).
2. **The open items above become rows when Phase 2 opens**, or are closed by decision there, as the Phase 00 open
   items became rows `00-Z21` to `00-Z26`. The CDN literals in Getting Started need a refresh duty before the first
   Phase 2 release.
3. **Plan the locator cost.** Lesson 3 recurs with every PRD and ARCHITECTURE revision, and locators into the Phase 1
   spec already drift with no rule to realign them (Open items). The Phase 2 plan should decide how the component
   specs cite the PRD and the phase spec before the first Phase 2 component spec is written.
4. **Write rules, not lists, into the Phase 2 spec** wherever a set of components will grow (lesson 1), and require
   a probe for every agent-facing claim about layout or sizing (lesson 2).
5. **Phase 2 scope** is PRD §7.4: the 15 form components, the Field child-state detection, native-form
   participation, and the Theming showcase on the site.
