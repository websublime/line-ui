---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-skeleton>` at `@websublime/line-components/skeleton`, a loading placeholder hidden from assistive technology that draws a block, a circle or lines of text sized to the surrounding font through `shape` and `lines`, pulses or sweeps a wave through `animation` (`pulse`, `wave`, `none`) for two cycles and not under reduced motion, and takes its fill and band colours from `--line-skeleton-bg` and `--line-skeleton-wave-color`. `@websublime/line-genui/catalog` exports `skeletonDescriptor`, so the `line` catalog, `catalog.json` and the frontend tools gain `Skeleton` with `shape` and `lines`.
