---
"@websublime/line-schemas": patch
"@websublime/line-colors": patch
---

Stream C review cleanups (line-ui-7qm.3.10, line-ui-7qm.3.11):

- **line-schemas — `StepSchema` derived from `STEPS`**: `StepSchema` is now built from the canonical `STEPS` tuple (a mapped tuple of `z.literal`s) instead of a hand-maintained 12-arm `z.union`, restoring the single-source-of-truth const+schema+type pattern used by every other contract module. The exported `Step` type and runtime validation behaviour are unchanged — it accepts exactly `1..12` and rejects everything else.
- **`scripts/verify-palettes-fresh.mjs` — multi-file drift reporting**: on failure the guard now reports a per-file differing-line count and an up-front tally (`N drifting files (M differing lines)`, plus any file-set violations), so a multi-hue `@radix-ui/colors` bump surfaces every affected file in a single CI run rather than one line at a time across successive runs. Pass/fail semantics are unchanged — any drift still exits non-zero.
