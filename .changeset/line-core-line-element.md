---
"@websublime/line-core": minor
---

Add the `LineElement` base class for all line://ui web components. `LineElement` composes the Direction, Metadata, and Inspector mixins over Lit's `LitElement`, establishing the mixin composition pattern (D1). It exposes a static `version` string and a protected `reflectState(name, active)` hook (overridden by the FormAssociated mixin). Per spec §6.D.1 it does NOT auto-inject `commonReset` and does NOT bake in `FormAssociated` — both stay opt-in. Ships identity (pass-through) stubs for the Inspector/Metadata/Direction mixins whose behaviour lands in D2/D3/D4.
