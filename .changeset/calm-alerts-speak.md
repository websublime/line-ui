---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-alert>` at `@websublime/line-components/alert`, an inline message box with `icon`, `title`, default and `actions` slots laid out in a two-column grid, where an empty zone takes no space. `variant` (`neutral`, `info`, `success`, `warning`, `danger`) sets the `--line-alert-*` colour tokens from the theme roles. `live="polite"` or `live="assertive"` puts the `status` or `alert` role on the host through `ElementInternals`; by default the alert has no role. It ships no close button and takes no focus. The `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `Alert` (`variant`, `icon`, `title`, `children`, `actions`), which `<line-a2ui-surface>` renders without a live role or host name.
