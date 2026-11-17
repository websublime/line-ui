---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-aspect-ratio>` at `@websublime/line-components/aspect-ratio`, a layout container that holds its content at a fixed width-to-height ratio: `ratio` takes the six `line-tokens` aspect names (`square` by default, `landscape`, `portrait`, `widescreen`, `ultrawide`, `golden`) and any other ratio goes through `--line-aspect-ratio-ratio`; children fill the box, media are cropped with `object-fit: cover`, long content spills rather than being clipped, and it adds no role and takes no focus. `@websublime/line-genui/catalog` exports `aspectRatioDescriptor`, so the `line` catalog, `catalog.json` and the frontend tools gain `AspectRatio` with its `ratio` prop and, in the catalog, one `child`.
