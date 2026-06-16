---
"@websublime/line-utils": patch
---

Harden the `mix.ts` `color-mix()` string builders against out-of-range percentages (line-ui-7qm.3.13, review-warning follow-up to C7).

- **`mix`, `withAlpha`, `tint`, `shade` now clamp their percentage argument to `[0, 100]`**: the `mix` weight, `withAlpha` `alphaPercent`, and `tint`/`shade` `amount` are passed through `Math.min(100, Math.max(0, x))` before being emitted, so an out-of-range caller (e.g. `withAlpha('var(--c)', 150)`) now produces valid in-range CSS (`color-mix(in srgb, transparent 0%, var(--c))`) instead of invalid text the browser would silently reject. Clamping a numeric percentage is input validation, not color evaluation, so the helpers remain pure string builders. `mix`'s `weight` stays optional — `undefined` is preserved (no percentage emitted) and is not clamped. In-range inputs are unaffected. Each helper's JSDoc `@param` now documents the `[0, 100]` clamp.
- **`NaN` percentages coerce to `0`**: the shared `clampPercent` helper now maps a passed `NaN` to `0` (the lower clamp bound), so a non-finite caller can never emit invalid `NaN%` CSS. All four helpers inherit this through `clampPercent`. `mix`'s `weight === undefined` branch is unchanged — only a passed `NaN` becomes `0`; `undefined` still omits the percentage entirely.
