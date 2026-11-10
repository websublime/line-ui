---
"@websublime/line-components": patch
"@websublime/line-core": patch
"@websublime/line-genui": minor
---

Add `<line-chip>` at `@websublime/line-components/chip`, a compact toggle button for a category or a filter: each press flips `pressed` and fires `line-change` with `{ value }`, it takes `variant` (`default`, `primary`) and `disabled`, slots for `prefix`, the label, `suffix` and an `indicator` shown only while pressed, and `--line-chip-*` tokens whose colours change when pressed; the `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `Chip`, whose `label` the surface writes as the chip's text through the new text binding and `textProp` name source.
