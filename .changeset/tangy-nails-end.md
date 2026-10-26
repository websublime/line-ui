---
"@websublime/line-core": minor
---

`LineElement` now attaches `ElementInternals` once per element and reflects machine state as both `data-<state>` and `:state(<state>)` (kebab-case names such as `focus-visible` included); subclasses reach the internals through the new `INTERNALS` export, and `FormAssociated` (now also exported from `@websublime/line-core`, with `@websublime/line-core/mixins/form-associated` re-exporting it) reuses them.
