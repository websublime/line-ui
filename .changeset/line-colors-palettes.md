---
"@websublime/line-colors": minor
---

Add the `scripts/generate-palettes.mjs` palette generator and the generated CSS it produces for `line-colors`: 31 per-hue scales (`{hue}.css`), `special.css`, and the `index.css` `@import` barrel. Each hue file emits base + alpha sRGB steps via `light-dark()`, a static `--line-{hue}-contrast` token sourced from `PER_HUE_CONTRAST`, and a wide-gamut P3 override inside `@supports (color: color(display-p3 1 1 1))` + `@media (color-gamut: p3)`. `special.css` emits the `blackA`/`whiteA` alpha scales outside `light-dark()` (identical in both modes) with `blackP3A`/`whiteP3A` upgrades inside the `@supports` block. All custom properties are `--line-*` prefixed; the PostCSS build emits one flat `dist/*.css` per subpath plus the `dist/index.css` barrel. Generated CSS is committed (regeneration policy D2).
