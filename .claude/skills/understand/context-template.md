# <scope-slug> — context

## Source
- Ledger row: `<NN>-<ID>` (`docs/plans/NN-tasks-<slug>.md`), stream and Deps
- Spec section: `docs/specs/NN-spec-<slug>.md §x.y`, or "none — off-plan"
- Request: Miguel's prompt, refined
- Graph: `used | stale@<short-sha> | unavailable(<reason>)`

## Class and ceremony
- Class: a row from `docs/PROCESS.md` §2
- Ceremony: the phases this scope runs

## Understanding
- Outcome: what the change delivers and for whom
- Stated: what Miguel or the spec said
- Assumed: what we inferred and Miguel has not confirmed

## Acceptance criteria
- From the spec's acceptance criteria when a row exists, otherwise agreed with Miguel

## Affected packages and apps
- `@websublime/line-*` packages and `apps/*` touched, with the layer rule (downward only) checked

## Public surface touched
- Exports maps, `::part()` names, `--line-*` tokens, attributes, events, types

## Spec drift found
- Contradictions between spec and reality, each becoming an `AM-nnn` row before implementation, or none

## Open questions
- Forks for the decide phase, one per bullet
