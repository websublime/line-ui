---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-grid>` at `@websublime/line-components/grid`, a layout container that places its children in rows of equal columns that adapt to its own width with no breakpoint: `columns` (`1`–`12`) caps how many columns a row holds, `min-column-width` (`xxs`, `xs`, `sm`, `md` or `none`) sets how narrow a column may get before the grid moves to fewer, `gap` (`0`–`5`) steps the spacing on the `--line-layout-gap-*` scale, and `align` and `justify-items` place each child within its cell, with the `--line-grid-*` tokens for consumer breakpoints and separate row and column gaps. `@websublime/line-genui/catalog` exports `gridDescriptor`, so the `line` catalog, `catalog.json` and the frontend tools gain `Grid` with its five layout props.
