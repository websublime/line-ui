---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-alert>` at `@websublime/line-components/alert`, an inline message box with `icon`, `title`, default, `actions` and `dismiss` slots laid out in a three-column grid, where an empty zone takes no space. `variant` (`neutral`, `info`, `success`, `warning`, `danger`) sets the `--line-alert-*` colour tokens from the theme roles. `live="polite"` or `live="assertive"` puts the `status` or `alert` role on the host through `ElementInternals`; by default the alert has no role. A click on the control in its `dismiss` slot fires a cancelable `line-dismiss`, after which the alert sets `hidden` on itself unless the event was cancelled; the consumer supplies the glyph and the name. It takes no focus. The `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `Alert` (`variant`, `icon`, `title`, `children`, `actions`, `dismiss`), which `<line-a2ui-surface>` renders without a live role or host name.
