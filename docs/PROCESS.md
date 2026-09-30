# PROCESS — how we build line://ui

This is the **methodology** a fresh session needs (the *how*); `CLAUDE.md` is the *contract* (the *what*).
Imported into `CLAUDE.md` via `@`, so every session loads it. Keep it lean — it is always in context.

## 0. North star
Optimize for **correctness and completeness over speed**. The spec is the contract; code follows the spec, and
the spec follows the PRD. **Never simplify the solution to make progress; if you reach that point, stop and ask
Miguel.** Never pivot silently — a blocked assumption goes back to the document that made it.

## 1. Documents and hierarchy
- `docs/MANIFESTO.md` = laws · `docs/PRD.md` = product truth (scope, roadmap, revision log) ·
  `docs/ARCHITECTURE.md` = system design · `docs/plans/NN-plan-<slug>.md` = phase scope, streams, acceptance
  criteria · `docs/research/NN-research-<slug>[-roundN].md` = validated facts · `docs/specs/NN-spec-<slug>.md` =
  the phase's implementation contract (APPROVED before code) · `docs/specs/NNNN-<component>.md` = component
  specs from Phase 1 (PRD §8) · `docs/plans/NN-tasks-<slug>.md` = task ledger, live state (§6) ·
  `docs/context/<scope-slug>.md` = understand write-back for off-plan work (§2) ·
  `docs/retrospective/NN-<slug>.md` = phase retrospective.
- **Hierarchy: MANIFESTO > PRD > ARCHITECTURE > plan > spec > code.** A lower document that diverges from a
  higher one is the bug. Research is evidence, never normative. The ledger, context files, and retrospectives are
  descriptive, never normative — nothing binding may originate there.
- `NN` is the two-digit phase number (`00` = foundation). One plan, one spec, one ledger per phase.

## 2. Lifecycle and ceremony
Every request runs `understand → decide → spec/plan → review → implement → verify → track`. The class picked in
understand (the `understand` skill) decides which phases actually run.

| Class | Example | Phases | Artifacts |
|---|---|---|---|
| question | "how does auto-pair work" | understand | none |
| trivial | typo, comment, one-liner with no public-API change | understand → implement → track | commit on a branch, PR |
| bug | behaviour contradicts the spec | understand → implement → verify → track | ledger row, PR; AM row if the spec was wrong |
| task | a ledger row whose spec section is APPROVED | understand → implement → verify → track | PR; AM row on pre-implementation drift |
| amendment | spec contradicts reality or itself | understand → decide → review → track | `AM-nnn` row + `docs(spec)` commit |
| decision | product or architecture fork | understand → decide → review → track | PRD revision-log entry or spec §10 row |
| phase | open Phase NN | full cycle | plan → research → spec → coherence review → ledger |

- **Ratchet upward only.** Evidence the class did not account for (a contract change during implement, a second
  package pulled in, a bug whose fix touches a public interface) sends the work back to understand and the class
  moves up. It never moves down mid-task. When two classes fit, take the heavier one.
- **Opening a phase.** Plan APPROVED → one research note per §5 item of the plan → spec grounded in research
  only → coherence review passes **3 clean rounds** against plan, PRD, research → ledger created from the spec's
  streams → tasks delegated to supervisors → exit criteria (plan §7 / spec §9) → retrospective. Research that
  contradicts the plan returns to plan + PRD revision before any spec work (plan §5.2/R11 sets the pattern).
- **Specs are just-in-time** (PRD §8.2): the spec for a phase is written when that phase opens, using real
  learnings from the previous one. Later phases stay direction, not detail.

## 3. Decisions and drift
- **Product decisions** land as a dated entry in the PRD revision log (version bump, what changed, why, sections
  touched), with ARCHITECTURE, plan, and spec aligned in the **same commit**.
- **Phase decisions** made while authoring a spec land as rows in the spec's §10 and need Miguel's approval
  before the spec is APPROVED.
- **Drift** between the spec and reality (found before or during a task) lands as an `AM-nnn` row in the spec's
  amendment table — ID, date, trigger, change, reason, evidence — in its own `docs(spec): AM-nnn — …` commit
  that **precedes** the implementation commit on the same branch. Code never departs from the spec silently and
  the spec never changes silently.
- **Decision-change checklist.** When a name, version, contract, or scope changes, update every document that
  states the old fact in one commit. It is done only when a grep for the old framing returns **zero live hits**.
- **Genuine forks go to Miguel.** Use the question tool for real choices, never for defaults you can pick
  yourself. Each option names the concrete thing it decides.

## 4. Roles and orchestration
- **The main session is the orchestrator, not the implementer.** It investigates, classifies, decides with
  Miguel, delegates substantive work, reviews the returned diff, and runs the gates. It edits files directly only
  in conversation or for the trivial class. Anything touching a public interface, a spec, or more than one
  package goes to an agent.
- **Repo agents** (`.claude/agents/`): `sdlc` runs the whole loop for one request; `webcomponents-supervisor`
  implements streams C, D, E, G, H (packages, components, tokens, docs); `infra-supervisor` implements streams
  A, B, F (workspace, CI, hooks, release); `git-workflow-manager` owns the track step. **Harness agents:**
  `scout` for read-only research, `reviewer` and `security-reviewer` for the gates.
- **One implementer per task, on the task branch, in the shared working tree.** Parallel writers are allowed
  only when their file sets do not overlap, each on its own branch in its own worktree. Two agents never write
  the same branch. Agents write files and return short summaries; finding lists stay bounded (~12).
- **Understand opens at the code graph.** The graph is the `codebase-memory` MCP server in `.mcp.json`;
  `index_status` reports readiness plus the sha it was built at, `index_repository` rebuilds it for the main
  checkout — never for a throwaway worktree. The understand write-back carries one field,
  `graph: used | stale@<short-sha> | unavailable(<reason>)`; a non-`used` value names what answered instead.

## 5. Gates
Gates are proportional to the class. A phase is not locked until its gate passes.

| Gate | trivial | task / bug | amendment / decision | phase |
|---|---|---|---|---|
| **Review** (before implement) | none | orchestrator + Miguel read the understand write-back | `reviewer` lens + owning supervisor lens | coherence review: ≥3 lenses (plan↔PRD, spec↔research, spec↔ARCHITECTURE) + coordinator, 3 clean rounds |
| **Verify** (after implement) | `bun run lint` + build of the touched package | `bun run lint`, `bun run build`, `bun test` for the touched packages, supervisor self-check, then a `reviewer` pass | `reviewer` pass on the doc diff + zero-live-hits grep (§3) | every spec §9 criterion evidenced + full review |

- `security-reviewer` joins Verify when the change touches `.github/`, `.githooks/`, release or publish config,
  scripts that read the environment or the network, or adds a dependency.
- **A failed gate returns the work to the prior phase** (Verify → implement; Review → spec/plan). After **2
  iterations** without a pass, escalate to Miguel instead of looping.
- A finding is **RESOLVED only when the fix lands** — in the spec for spec drift, in code for code — never when
  it is merely agreed.

## 6. Tracking, branches, commits, PRs
- **Git is the system of record.** No external tracker. The ledger `docs/plans/NN-tasks-<slug>.md` holds one row
  per task — `ID | Stream | Task | Owner | Deps | Status | Branch | PR | AM` — with status
  `todo · in_progress · in_review · done · blocked`. **Ready** = `todo` with every dependency `done`. The ledger
  row changes **in the same PR** as the work: `in_progress` when the branch opens, `in_review` when the PR opens
  with its number. The merge is the `done` signal; the next PR's track step flips merged rows to `done`.
- **Off-plan work** (a bug, a cleanup) gets a new ledger row in the stream it touches, next free number
  (`C13`, `C14` set the pattern); repo-wide work uses stream `Z`.
- **Branch off `main`, never commit to `main`.** Name: `<type>/<NN>-<task>-<slug>` (e.g.
  `feat/00-d4-direction-mixin`, `docs/00-am-022-reset-sheets`). `<type>` is one of `feat`, `fix`, `chore`,
  `docs`, `refactor`, `test`, `ci`.
- **Commits** are Conventional Commits, `<type>(<scope>): <description>`, atomic, one concern each, made **on
  the branch as the work progresses** — tests pass at every commit and history is never reconstructed
  afterwards. `<scope>` is the package short name (`core`, `components`, `tokens`, `colors`, `schemas`,
  `themes`, `utils`, `icons`, `storybook`, `site`) or `spec`, `plan`, `prd`, `ledger`, `ci`, `hooks`, `repo`.
  The body names the task id (`00-D4`). A spec amendment commit precedes the code that depends on it.
- **The PR opens only after Verify passes.** One PR per task, title `<NN>-<TASK> — <task title>`, body with
  Understand (class, write-back), Decisions, Deviations and AM rows, Verify (commands run, results, gate verdict),
  Ledger (row change). Claude opens it with `gh pr create`; **Miguel merges**. Every change to a published
  package carries a changeset entry (`bun run changeset`).
- **Session end.** Branch pushed, ledger row current, nothing stranded locally.

## 7. Language, clarity, artifacts
- **Converse in Portuguese; write every artifact (code, docs, comments, commits, PRs) in English.**
- In always-on docs (`CLAUDE.md`, this file) prefer pointers over prose — they cost context every session.
- **Self-contained prose to Miguel.** Phase reports, gate verdicts, fork questions, and PR bodies must be
  resolvable from that message alone. Session-local ids (finding numbers, lens letters) are expanded on first
  mention; durable ids (`AM-nnn`, task ids, spec §) carry a one-clause anchor on first mention.
- **Fork questions name their object.** Each option describes the concrete thing it decides, never only a code
  coined earlier in the session. Findings arrive as `file:line` plus a one-line plain description.
