# PROCESS — how we build line://ui

This is the **methodology** a fresh session needs (the *how*); `CLAUDE.md` is the *contract* (the *what*).
Imported into `CLAUDE.md` via `@`, so every session loads it. Keep it lean — it is always in context. When
another document repeats a rule from here, this file wins.

## 0. North star
Optimize for **correctness and completeness over speed**. Code follows the spec and the spec follows the PRD.
**Never simplify the solution to make progress; if you reach that point, stop and ask Miguel.** A blocked
assumption goes back to the document that made it; nothing pivots silently.

## 1. Documents and hierarchy
- `docs/MANIFESTO.md` = laws · `docs/PRD.md` = product truth (scope, roadmap, revision log) ·
  `docs/ARCHITECTURE.md` = system design · `docs/plans/NN-plan-<slug>.md` = phase scope, streams, acceptance
  criteria · `docs/research/NN-research-<slug>[-roundN].md` = validated facts · `docs/specs/NN-spec-<slug>.md` =
  the phase's implementation contract (APPROVED before code) · `docs/specs/NNNN-<component>.md` = component
  specs from Phase 1 (PRD §8) · `docs/plans/NN-tasks-<slug>.md` = task ledger, live state (§6) ·
  `docs/context/<scope-slug>.md` = understand write-back for off-plan work (§2, created on demand) ·
  `docs/retrospective/NN-<slug>.md` = phase retrospective.
- **Hierarchy: MANIFESTO > PRD > ARCHITECTURE > plan > spec > code.** A lower document that diverges from a
  higher one is the bug. Research is evidence and carries no rules. The ledger, context files, and
  retrospectives describe state and carry no rules either.
- `NN` is the two-digit phase number (`00` = foundation). One plan, one spec, one ledger per phase.

## 2. Lifecycle and ceremony
Every request runs `understand → decide → spec/plan → review → implement → verify → track`. The class picked in
understand (the `understand` skill) decides which phases run. Classes are ordered by weight; when two fit, take
the heavier one, and a class only ever moves up mid-task.

| # | Class | Fits when | Phases | Artifacts |
|---|---|---|---|---|
| 1 | question | an answer, no file changes | understand | none |
| 2 | trivial | a change to prose or comments outside published output: docs, READMEs, code comments, `docs/context/`, the ledger itself | understand → implement → verify → track | ledger row (stream `Z`), PR |
| 3 | change | off-plan work the spec neither requires nor forbids: a story, a helper, a dev dependency, a script tweak, a hook or CI edit | understand → decide → implement → verify → track | ledger row, `docs/context/`, PR |
| 4 | bug | behaviour contradicts the spec or the PRD | understand → implement → verify → track | new ledger row with `Deps` → the original task, PR; `AM-nnn` if the spec was wrong |
| 5 | task | a ledger row whose spec section is APPROVED | understand → implement → verify → track | PR; `AM-nnn` as the first commit when drift is found |
| 6 | amendment | the spec must change and no code follows in the same PR | understand → decide → review → implement → verify → track | `AM-nnn` row in a `docs(spec)` commit, ledger row, PR |
| 7 | decision | a product or architecture fork, or a spec change that alters a design choice | understand → decide → review → implement → verify → track | PRD revision-log entry, spec §10 row, or `AM-nnn` with trigger `decision`, ledger row, PR |
| 8 | phase | open Phase NN | full cycle | plan → research → spec → coherence review → ledger |

- **Anything that touches published output is at least `change`.** Published output means `packages/*/src`,
  generator inputs under `scripts/`, build and exports config, dependency versions, `.githooks/`, `.github/`.
  A one-line edit there is never `trivial`.
- **Ratchet upward only.** Evidence the class did not account for (a contract change during implement, a second
  package pulled in, a bug whose fix touches a public interface) sends the work back to understand and the class
  moves up. It never moves down mid-task.
- **Opening a phase.** Plan drafted → plan gate (plan↔PRD lens + Miguel) → APPROVED → one research note per §5
  item of the plan → spec grounded in research only → coherence review passes **3 clean rounds** with the lenses
  in §5 → ledger created from the spec's streams → tasks delegated to supervisors → exit criteria (plan §7 /
  spec §9) → retrospective. Research that contradicts the plan returns to plan + PRD revision before any spec
  work (plan §5.2/R11 sets the pattern).
- **Specs are just-in-time** (PRD §8.2). The spec for a phase is written when that phase opens, using real
  learnings from the previous one. Later phases stay as direction and are planned in detail only when they open.

## 3. Decisions and drift
- **Product decisions** land as a dated entry in the PRD revision log (version bump, what changed, why, sections
  touched), with ARCHITECTURE, plan, and spec aligned in the **same commit**.
- **Phase decisions** made while authoring a spec land as rows in the spec's §10 and need Miguel's approval
  before the spec is APPROVED. A fork the APPROVED spec is silent on lands as an `AM-nnn` row with trigger
  `decision`, approved by Miguel before the code that depends on it.
- **Drift** between the spec and reality lands as an `AM-nnn` row in the spec's amendment table — ID, date,
  trigger, change, reason, evidence — in its own `docs(spec): AM-nnn — …` commit that **precedes** the code
  that depends on it, on the same branch. A factual correction (the spec is wrong about an upstream API, a
  file path, a version) is written by whoever found it and reviewed in Verify. A correction that changes a
  design choice is a `decision` and stops for Miguel first. Code never departs from the spec silently and the
  spec never changes silently.
- **Decision-change checklist.** When a name, version, contract, or scope changes, update every document that
  states the old fact in one commit. It is done only when a grep for the old framing returns **zero live
  hits**. Live excludes amendment tables, revision logs, retrospectives, research notes, the ledger's `AM`
  column, and git history; those keep the old name as record.
- **Genuine forks go to Miguel** through the question tool (the harness's ask/AskUser tool). Defaults you can
  pick yourself, you pick and you say which you picked. Each option names the concrete thing it decides.

## 4. Roles and orchestration
- **The main session orchestrates and does not implement.** It investigates, classifies, decides with Miguel,
  creates the task branch, delegates the implement phase, reviews the returned diff, and runs the gates. It
  edits files directly only for the `trivial` class and for the ledger row flips that §6 assigns to it. Every
  other file change goes to an agent.
- **Repo agents** (`.claude/agents/`): `sdlc` runs the whole loop for one request when dispatched;
  `webcomponents-supervisor` implements packages, components, `line-genui`, Storybook docs and site content, and
  `infra-supervisor` implements workspace, build wiring, CI, hooks and release. The phase plan §4.0 names the
  accountable supervisor of each stream (Phase 1: streams C, G, D, S → `webcomponents-supervisor`; stream P →
  `infra-supervisor`), and the ledger row's Owner repeats it. `git-workflow-manager` owns the track step.
  **Harness agents:** `scout` for read-only research, `reviewer` and `security-reviewer` for the gates. When a
  harness agent is not mounted, a fresh general subagent runs the same §5 checklist and the PR body names which
  agent ran.
- **Models.** The main session runs on whatever model the developer selects. The supervisors run on Opus
  (frontmatter `model:`); `git-workflow-manager` on Sonnet; `sdlc` inherits the session model. The harness
  agents `reviewer`, `security-reviewer`, `scout`, `sonic` run on Opus through the repo-scoped
  `.omp/config.yml` (`task.agentModelOverrides`); that file never sets a global model.
- **`sdlc` waits by returning.** A subagent has no channel to Miguel. "Wait for Miguel" means return to the
  caller with the phase reached, the class, and the proposal or question; the caller relays, then re-dispatches
  `sdlc` with the answer and the state. The two gate iterations in §5 do not need Miguel; the escalation does.
- **One accountable implementer per task, on the task branch, in the shared working tree.** The phase spec's
  file-class table (Phase 1 spec §4) decides which supervisor edits each class of file. When a task touches a
  class the table gives the other supervisor, the orchestrator (main session or `sdlc`) dispatches that
  supervisor for those classes, one after the other on the same task branch; the second dispatch adds no
  changeset entry, and the accountable supervisor writes the changeset entry last, after the other dispatch
  returns (§6). Parallel writers are allowed only when their code file sets do not overlap, each on its own
  branch in its own worktree. The ledger is exempt from the overlap rule; on a ledger conflict keep both rows
  and never re-flip a row you do not own. Two agents never write the same branch at the same time. Agents
  write files and return short summaries; finding lists stay bounded (~12).
- **Understand opens at the code graph.** The graph is the `codebase-memory` MCP server in `.mcp.json`;
  `index_status` takes one required argument, `project` = the repository root path, and reports readiness
  plus the sha it was built at; `index_repository` rebuilds it for the main checkout — never for a throwaway
  worktree. The understand write-back carries one field,
  `graph: used | stale@<short-sha> | unavailable(<reason>)`; a non-`used` value names what answered instead.

## 5. Gates
Gates are proportional to the class. A phase is not locked until its gate passes.

| Gate | trivial | change / bug / task | amendment / decision | phase |
|---|---|---|---|---|
| **Review** (before implement) | none | orchestrator + Miguel read the understand write-back (`change` and `decision` also resolve their forks here) | `reviewer` lens on the doc diff + owning supervisor lens | plan gate (plan↔PRD lens + Miguel); coherence review with ≥3 lenses (plan↔PRD, spec↔research, spec↔ARCHITECTURE) + coordinator, 3 clean rounds |
| **Verify** (after implement) | `bun run lint` | Verify record (below) + `reviewer` checklist | Verify record on any code + `reviewer` checklist + zero-live-hits grep (§3) | every spec §9 criterion evidenced + full review |

- **Verify record.** The implementer runs `bun run lint`, `bun run build`, and `bun test packages/<name>` for
  every touched package that has test files, and lists a touched package without test files as "no test files"
  (root `bun run test` covers only the CSS packages). It also runs every `.github/workflows/checks.yml` step the
  change can affect, and always the generation and validation steps (`verify-pack`, `lint-layers`,
  `verify-palettes-fresh`, `validate-contrast`). The completion report lists each command and its result. The
  record travels in the handoff to `git-workflow-manager` and into the PR body. No record, no PR.
- **Reviewer checklist.** The `reviewer` receives the diff, the spec section, and the completion report, and
  answers each item: the code matches the spec section; every deviation has an `AM-nnn` row; the changeset
  entry exists when §6 requires one; `scripts/lint-layers.mjs` passes; tests cover the acceptance criteria;
  the completion report's "Deviations: none" is true. The verdict names the items checked.
- `security-reviewer` joins Verify for every class when the change touches `.github/`, `.githooks/`, release or
  publish config, scripts that read the environment or the network, or changes a dependency version.
- **A failed gate returns the work to the prior phase** (Verify → implement; Review → spec/plan). After **2
  iterations** without a pass, escalate to Miguel instead of looping.
- A finding is **RESOLVED only when the fix lands** — in the spec for spec drift, in code for code — never when
  it is merely agreed.

## 6. Tracking, branches, commits, PRs
- **Git is the system of record.** No external tracker. The ledger `docs/plans/NN-tasks-<slug>.md` holds one row
  per unit of work — `ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM` — with status
  `todo · in_progress · in_review · done · blocked`. **Ready** = `todo` with every dependency `done`. The row
  id is `<Stream><n>` inside the ledger and `<NN>-<Stream><n>` everywhere else (`D4` in the file, `00-D4` in
  branches, commits, PRs, dispatches).
- **Every PR has a row.** A row missing for the work at hand is appended during understand with status `todo`
  and the next number in its stream (highest existing + 1; gaps stay). Off-plan work joins the stream it
  touches; repo-wide work, process work, and `trivial` changes use stream `Z`. A bug against a `done` row is a
  new row whose `Deps` names the original; `done` never reopens.
- **Row flips have one owner each.** The orchestrator (main session or `sdlc`) flips `todo → in_progress` in
  the first commit on the new branch, and flips a `blocked` row to `todo` once the outside event it waits on
  has happened. `git-workflow-manager` flips `in_progress → in_review` with the PR number when it opens the PR,
  and flips any row whose PR has merged since to `done`. The merge itself is the done signal.
- **Branch off `main`, never commit to `main`.** The orchestrator creates the branch, named
  `<type>/<NN>-<id>-<slug>` in lowercase (`feat/00-d4-direction-mixin`, `docs/00-z3-am-022-reset-sheets`).
  `<type>` is one of `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`.
- **Commits** are Conventional Commits, `<type>(<scope>): <description>`, atomic, one concern each, made **on
  the branch as the work progresses** — tests pass at every commit and history is never reconstructed
  afterwards. `<scope>` is the package short name (`core`, `components`, `tokens`, `colors`, `schemas`,
  `themes`, `utils`, `icons`, `genui`, `storybook`, `site`) or one of `spec`, `plan`, `prd`, `ledger`, `process`,
  `agents`, `skills`, `docs`, `ci`, `hooks`, `repo`. The body names the row id (`00-D4`). A spec amendment
  commit precedes the code that depends on it. The implementer pushes the branch when its run ends, so nothing
  is stranded locally; it never opens the PR.
- **Changeset before the PR, every branch.** The accountable implementer's last step before handing off, after
  any dispatch of the other supervisor on the branch has returned (§4), is `bun run changeset`: pick every
  published package the branch changed (`src`, build or exports config, dependencies) and the semver bump —
  `patch` for fixes, `minor` for new capability, `major` for a breaking contract — and write a one-line
  consumer-facing summary. A branch that changed no published package runs `bun run empty` instead, so every PR
  carries a file under `.changeset/`. `bun run changeset status --since=origin/main` shows what the
  branch will bump. No changeset file, no PR. Once a package's first `minor` of a phase has shipped, that package's
  further changesets in that phase use `patch`, even for new capability, so its next minor stays the next phase's
  version (PRD §7.1, §6.5). Shipped means released by a merged Version PR. The implementer picks the bump against
  `main` as it stands when the PR opens. Before opening the PR, `git-workflow-manager` merges a freshly fetched `origin/main`
  (no rebase, no force-push), runs `bun run changeset status --since=origin/main --verbose` and sends back a `minor`
  that lists a version past the phase's minor line. This is the only statement of the rule; other files point here.
- **The PR opens only with a Verify record and a reviewer verdict in hand.** One PR per row, title
  `<NN>-<ID> — <task title>`, body with Understand (class, write-back), Decisions, Deviations and AM rows,
  Verify (the record, the reviewer verdict, which agents ran), Ledger (row change). `git-workflow-manager`
  opens it with `gh pr create`; **Miguel merges**.
- **Session end.** Branch pushed, ledger row current, nothing stranded locally.

## 7. Language, clarity, artifacts
- **Converse in Portuguese; write every artifact (code, docs, comments, commits, PRs) in English.**
- In always-on docs (`CLAUDE.md`, this file) prefer pointers over prose — they cost context every session.
- **Self-contained prose to Miguel.** Phase reports, gate verdicts, fork questions, and PR bodies must be
  resolvable from that message alone. Session-local ids (finding numbers, lens letters) are expanded on first
  mention; durable ids (`AM-nnn`, row ids, spec §) carry a one-clause anchor on first mention.
- **Fork questions name their object.** Each option describes the concrete thing it decides and never only a
  code coined earlier in the session. Findings arrive as `file:line` plus a one-line plain description.
