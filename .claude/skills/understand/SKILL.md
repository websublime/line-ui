---
name: understand
description: Triage any first input before acting on it — ledger task or not, feature, bug, spike, research, idea, or question. Use at the start of every request, and again whenever a later phase finds evidence the current class did not account for. Classifies the request against docs/PROCESS.md §2, states the class and ceremony, locates or appends the ledger row and its spec section, and writes back the understanding.
---

# Understand

Turn a first input into a request whose intent, class, and ceremony Miguel has seen and can correct.

## When to use
- At the start of every request, in the main session and in the `sdlc` agent alike.
- Again at any phase that finds evidence the class did not account for (see Ratchet).

## Steps
1. Read the prompt for intent, scope, and the deliverable. Read the docs and code the request touches, in
   hierarchy order (`docs/PROCESS.md` §1): MANIFESTO law, PRD section, ARCHITECTURE section, plan, spec.
2. Open the code graph (`codebase-memory` in `.mcp.json`). Call `index_status`; use the graph when it is
   ready for the current sha, otherwise name what answered instead. Record the result as
   `graph: used | stale@<short-sha> | unavailable(<reason>)`.
3. Locate the work. Search the phase ledger `docs/plans/NN-tasks-<slug>.md` for a matching row and the spec
   section it points to. A row exists → the request is a `task`, and the spec section is the contract. No
   row → append one now with status `todo`, the next number in the stream it touches (stream `Z` for
   repo-wide, process, and `trivial` work), and `Deps` naming the original row when this is a bug against
   `done` work. Every class except `question` ends with a row.
4. Classify the request against the ceremony table in `docs/PROCESS.md` §2. Classes are ordered; when two
   fit, take the heavier one. Anything that touches published output is at least `change`.
5. Derive `<scope-slug>` from the row id, lowercased with the phase prefix (`00-d4`).
6. Write back your understanding to Miguel.
   - The intended outcome and the success criteria (from the spec's acceptance criteria for a `task`).
   - What Miguel or the spec stated, kept apart from what you assumed.
   - The class and the ceremony you picked, so Miguel can override them.
   - The graph field from step 2.
7. Ask one focused question at a time when intent or evidence is missing. Refining the prompt is part of this
   phase.
8. Check the spec section against reality before anyone implements. A factual contradiction stays inside the
   current class and becomes the first commit on the branch, an `AM-nnn` row (PROCESS §3). A contradiction
   that changes a design choice raises the class to `decision` and stops here for Miguel.
9. For the `change` and `decision` classes, write `docs/context/<scope-slug>.md` from `context-template.md`.
   The other classes skip it — the spec section and the PR body carry the context.
10. List open forks for the decide phase. Do not resolve them yourself.

## Gate
Leave this phase only when Miguel has seen the write-back, the class stands, the row exists, and the evidence
is enough to act on.

## Ratchet
- Any phase can reopen this skill. Typical triggers are a contract change found during implement, a second
  package pulled in, or a bug whose fix touches a public interface.
- On a trigger, stop, tell Miguel what you found, and reclassify.
- Reclassify upward only. A class never drops to a lighter ceremony mid-task.

## Guardrails
- The ledger row is an output of this phase; nothing downstream starts without it.
- Never start implementation from this phase. The ceremony decides the next phase.
- Never resolve a spec contradiction by choosing the code's side silently. The spec changes first, visibly.
- Converse in Portuguese. Write the context file and every artifact in English.
