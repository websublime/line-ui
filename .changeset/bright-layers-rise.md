---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-portal>` at `@websublime/line-components/portal`, which paints its slotted content in the browser top layer, above clipping, transforms and stacking contexts, while the content keeps its DOM position, so it keeps its inherited theme, direction and language, its events, its form owner and its focus and reading order; `disabled` renders the content in place, and `bringToFront()` raises the box above a modal dialog opened after it. `@websublime/line-genui/catalog` exports `portalDescriptor`, which is not agent-exposed, so the `line` catalog, `catalog.json` and the frontend tools leave it out.
