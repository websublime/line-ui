---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-icon-button>` at `@websublime/line-components/icon-button`, a square button that shows only an icon (slotted, part `icon`), takes its name from the host `aria-label`, is never a form submitter, and takes `variant`, `disabled`, `loading` and `pressed` (toggle, fires `line-change`); the `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `IconButton`, which `<line-a2ui-surface>` renders only when the node carries `accessibility.label`.
