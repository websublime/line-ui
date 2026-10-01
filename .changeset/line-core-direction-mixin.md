---
"@websublime/line-core": minor
---

Implement the `DirectionMixin` (D4) for `LineElement`. Every Line element now exposes a read-only `direction` (`'ltr' | 'rtl'`) resolved from `:dir(rtl)`, so it follows `<html dir>`, nested `dir` regions, an author `dir` on the host, and `dir="auto"`. The element re-renders when a `dir` change in the document flips it. The mixin never writes the host `dir` attribute and leaves the native `HTMLElement.dir` alone; component CSS targets RTL with `:host(:dir(rtl))`.
