---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-badge>` at `@websublime/line-components/badge`, a small status marker for a count, a short label or, with an empty slot, a dot; `variant` (`neutral`, `info`, `success`, `warning`, `danger`) gives a text badge a soft fill and a dot a solid one, and a host `aria-label` makes any badge an `img` with that name while an unnamed dot stays hidden. The `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `Badge`, whose `label` the surface writes as the badge text; a Badge with neither `label` nor `accessibility.label` renders the missing-name placeholder.
