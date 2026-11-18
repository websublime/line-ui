---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-spinner>` at `@websublime/line-components/spinner`, a loading ring in the text's colour and size with `size` steps `1`–`6`, `speed` `slow`/`normal`/`fast`, a reduced-motion pulse and a forced-colors gap; a `label`, `aria-label` or `aria-labelledby` makes it a named indeterminate progress bar and without one it is hidden. `@websublime/line-genui/catalog` exports `spinnerDescriptor`, so the `line` catalog, `catalog.json` and the frontend tools gain `Spinner`, named through a required `accessibility.label`.
