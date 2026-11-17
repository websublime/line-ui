---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-center>` at `@websublime/line-components/center`, a layout container that centres its content horizontally, vertically or on both axes: `axis` (`both`, `horizontal`, `vertical`) picks the axes, several children form one centred column in source order, and content larger than the box starts at its start edge (`safe center`), so none of it is cut off. It adds no role, takes no focus and reads no token. `@websublime/line-genui/catalog` exports `centerDescriptor`, so the `line` catalog, `catalog.json` and the frontend tools gain `Center` with its `axis` prop and, in the catalog, one `child`.
