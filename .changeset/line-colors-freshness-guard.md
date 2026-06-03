---
"@websublime/line-colors": patch
---

Add `scripts/verify-palettes-fresh.mjs`, a CI freshness guard for the generated `line-colors` palette CSS. On every PR it re-runs `scripts/generate-palettes.mjs` into a temporary directory and byte-compares the result against the committed `packages/line-colors/src/` tree (31 per-hue files + `special.css` + the `index.css` barrel), failing on any drift — hand-edits to generated files, stale files the generator no longer emits, or uncommitted generator output. This enforces the D2 regeneration policy (generated CSS is committed; regenerate only on a `@radix-ui/colors` bump). Wiring this guard into `checks.yml` is owned by Stream F (F4); the §6.F.5 pipeline already lists the run-line.
