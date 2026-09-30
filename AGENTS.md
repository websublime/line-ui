# Agent Instructions

`CLAUDE.md` is the contract and `docs/PROCESS.md` is the methodology. Both load in every session. This file
holds only the rules that apply to any agent regardless of harness.

## Tracking

- Git is the system of record. Tasks live in the phase ledger `docs/plans/NN-tasks-<slug>.md`; scope and
  acceptance criteria live in the plan and the spec. No external tracker, no markdown TODO lists.
- Every change rides a branch off `main` and lands through a PR that Miguel merges (`docs/PROCESS.md` §6).
- Planning artifacts stay under `docs/`. The repository root holds only permanent project files.

## Non-Interactive Shell Commands

Shell aliases may add `-i` to `cp`, `mv`, and `rm`, which hangs an agent on a y/n prompt. Always pass the
non-interactive flag.

```bash
cp -f source dest
mv -f source dest
rm -f file
rm -rf directory
cp -rf source dest
```

Other commands that may prompt: `scp` and `ssh` take `-o BatchMode=yes`; `brew` takes
`HOMEBREW_NO_AUTO_UPDATE=1`.

## Session Completion

`docs/PROCESS.md` §6 defines session end. Never leave work stranded locally; if the push fails, resolve and
retry.
