---
"@websublime/line-tokens": minor
---

Author the 18 token-family CSS files plus the light-DOM consumer reset and compose the `index.css` barrel. Primitives: `typography`, `sizing`, `shadows`, `easings`, `z-index`, `opacity`, `motion`, `radii`, `border-width`, `focus-ring`, `breakpoints`. Decoratives: `aspects`, `animations`, `gradients`, `masks`, `layouts`, `highlights`, `svg`. All custom properties are `--line-*` prefixed and singular; every declaration is wrapped in `:where(html)` for zero specificity. Decorative `gradients`/`highlights`/`svg` are structural-only — colour references defer to `var(--line-{hue}-{step})` tokens supplied by `line-colors`. The PostCSS build emits a flat `dist/index.css` barrel plus one `dist/*.css` per subpath.
