# <scope-slug> — context

## Source
- Ledger row: `<NN>-<TASK>` (`docs/plans/NN-tasks-<slug>.md`) or none (off-plan)
- Spec section: `docs/specs/NN-spec-<slug>.md §x.y` or none
- Request: the developer's prompt, refined
- Graph: `used | stale@<short-sha> | unavailable(<reason>)`

## Class and ceremony
- Class: a row from `docs/PROCESS.md` §2
- Ceremony: the phases this scope runs

## Understanding
- Outcome: what the change delivers and for whom
- Stated: what the developer or the spec said
- Assumed: what we inferred and the developer has not confirmed

## Acceptance criteria
- From the spec's acceptance criteria when a row exists, otherwise agreed with the developer

## Affected packages and apps
- `@websublime/line-*` packages and `apps/*` touched, with the layer rule (downward only) checked

## Public surface touched
- Exports maps, `::part()` names, `--line-*` tokens, attributes, events, types

## Spec drift found
- Contradictions between spec and reality, each becoming an `AM-nnn` row before implementation, or none

## Open questions
- Forks for the decide phase, one per bullet
