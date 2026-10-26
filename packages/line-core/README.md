# @websublime/line-core

`LineElement` base class, Zag.js state-machine controller, shared style mixins, and reactive controllers for line://ui components. Lit 3 + Shadow DOM.

## Entry points

| Import | Exports |
| --- | --- |
| `@websublime/line-core` | `LineElement` and `INTERNALS`. The mixins load from `@websublime/line-core/mixins/<name>`. |
| `@websublime/line-core/machine` | `LineMachineController` (+ `LineMachineControllerOptions` type) — the Lit `ReactiveController` adapter around Zag.js — and the four public `@zag-js/vanilla` primitives: `VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps` (+ `Attrs` type). `bindable` is intentionally not re-exported. |

Components must never import `@zag-js/vanilla` directly (Biome `noRestrictedImports` enforces this outside `line-core`). `LineMachineController` implements Manifesto Law 9: if the machine fails to start it flips `fallback` to `true`, logs to `console.error`, and re-renders instead of throwing at the consumer.

Every `LineElement` attaches its `ElementInternals` once, in its constructor, and keeps them private. A subclass or mixin reaches them as `this[INTERNALS]`, a protected accessor keyed by the exported `Symbol('line.internals')`; no public `internals` property exists and nothing is registered on `globalThis`. `LineElement` is not form-associated; `FormAssociated(LineElement)` opts in and reuses the same internals. The protected `reflectState(name, active)` writes machine state to the host as the attribute `data-<name>` and the custom state `:state(<name>)`, both verbatim, so `focus-visible` becomes `data-focus-visible` and `:state(focus-visible)`.
