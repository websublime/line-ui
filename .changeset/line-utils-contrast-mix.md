---
"@websublime/line-utils": minor
---

Author `@websublime/line-utils` helpers (spec §6.C.5): `contrast.ts` and `mix.ts`, re-exported from the package barrel and via the `./contrast` / `./mix` subpath exports.

- **`contrast.ts` — WCAG 2.1 contrast helpers**: `hexToRgb`, `srgbToLinear`, `relativeLuminance`, `contrastRatio`, plus the `THRESHOLD` (3) and `SOLID_STEP` (9) constants. These are the single source of truth for the WCAG math previously inlined in `scripts/validate-contrast.mjs`; that validator now imports them from this module (via its `.ts` source path, matching the existing `line-schemas` source imports, to avoid a build-order hazard since the validator runs inside `line-colors`' build). The math is ported verbatim — the validator's output stays byte-identical (exit 0, the two documented orange allowlist warnings, and the "62 step-9/contrast pairs … meet ≥ 3:1" line).
- **`mix.ts` — CSS `color-mix()` string builders**: `mix(a, b, weight?, options?)`, `withAlpha(color, alphaPercent, options?)`, `tint(color, amount, options?)`, and `shade(color, amount, options?)`. All are pure string builders (no parsing or evaluation) that accept an optional `{ colorSpace }` (default `srgb`) drawn from the CSS `<color-interpolation-method>` spaces. `withAlpha('var(--c)', 40)` yields `color-mix(in srgb, transparent 60%, var(--c))` (40% opaque); `tint`/`shade` mix toward `white`/`black`.
