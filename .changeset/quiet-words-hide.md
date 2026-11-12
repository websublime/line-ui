---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-visually-hidden>` at `@websublime/line-components/visually-hidden`, which keeps its slotted content in the accessibility tree and off the screen, takes no space in any layout, and shows the content while focus is inside it, so a skip link appears when a keyboard user reaches it; `@websublime/line-genui/catalog` exports `visuallyHiddenDescriptor`, which is not agent-exposed, so the `line` catalog, `catalog.json` and the frontend tools leave it out.
