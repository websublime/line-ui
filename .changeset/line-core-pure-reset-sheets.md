---
"@websublime/line-core": patch
---

Unused reset sheets from `@websublime/line-core/styles` now tree-shake: each sheet is marked pure, so a bundle keeps only the sheets it imports.
