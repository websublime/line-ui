---
name: understand
description: Triage any first input before acting on it — ledger task or not, feature, bug, spike, research, idea, or question. Use at the start of every request, and again whenever a later phase finds evidence the current class did not account for. Classifies the request against docs/PROCESS.md §2, states the class and ceremony, locates the task in the phase ledger and spec, and writes back the understanding.
---

# Understand

Turn a first input into a request whose intent, class, and ceremony the developer has seen and can correct.

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
   section it points to. A row exists → the request is a `task` (or a `bug` against that task) and the spec
   section is the contract. No row → the work is off-plan; a ledger row is appended in the track step.
4. Classify the request against the ceremony table in `docs/PROCESS.md` §2. When two classes fit, take the
   heavier one.
5. Derive `<scope-slug>`. Use the ledger id lowercased with the phase prefix (`00-d4`) when a row exists,
   otherwise a kebab-case slug for the topic.
6. Write back your understanding to the developer.
   - The intended outcome and the success criteria (from the spec's acceptance criteria when a row exists).
   - What the developer or the spec stated, kept apart from what you assumed.
   - The class and the ceremony you picked, so the developer can override them.
   - The graph field from step 2.
7. Ask one focused question at a time when intent or evidence is missing. Refining the prompt is part of this
   phase.
8. Check the spec against reality before anyone implements. A contradiction found here is an `amendment` and
   lands as an `AM-nnn` row before the code (PROCESS §3).
9. For off-plan work that produces artifacts, write `docs/context/<scope-slug>.md` from
   `context-template.md`. Ledger tasks, plain questions, and the trivial class skip it — the spec section and
   the PR body carry the context.
10. List open forks for the decide phase. Do not resolve them yourself.

## Gate
Leave this phase only when the developer has seen the write-back, the class stands, and the evidence is enough
to act on.

## Ratchet
- Any phase can reopen this skill. Typical triggers are a contract change found during implement, a second
  package pulled in, or a bug whose fix touches a public interface.
- On a trigger, stop, tell the developer what you found, and reclassify.
- Reclassify upward only. A class never drops to a lighter ceremony mid-task.

## Guardrails
- A ledger row is an output of this phase when the work warrants one, never a precondition.
- Never start implementation from this phase. The ceremony decides the next phase.
- Never resolve a spec contradiction by choosing the code's side silently. The spec changes first, visibly.
- Converse in the developer's language. Write `context.md` and every artifact in English.
