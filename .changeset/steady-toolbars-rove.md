---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-button-group>` at `@websublime/line-components/button-group`, a toolbar named by its host `aria-label` or `aria-labelledby`. It gives its slotted `<line-button>` and `<line-icon-button>` children one Tab stop with arrow-key focus (`orientation` `horizontal` or `vertical`, mirrored right-to-left, Home and End, wrap with `loop`). It skips disabled and hidden buttons, moves focus on when the focused button is disabled, hidden or removed, and squares the corners between its buttons (`--line-button-group-radius`, `--line-button-group-gap`). The `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `ButtonGroup`, which `<line-a2ui-surface>` renders only when the node carries `accessibility.label`.
