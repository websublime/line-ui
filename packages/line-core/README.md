# @websublime/line-core

`LineElement` base class, Zag.js state-machine controller, shared style mixins, and reactive controllers for line://ui components. Lit 3 + Shadow DOM.

## Entry points

| Import | Exports |
| --- | --- |
| `@websublime/line-core` | `LineElement` and its mixins. |
| `@websublime/line-core/machine` | `LineMachineController` (+ `LineMachineControllerOptions` type) — the Lit `ReactiveController` adapter around Zag.js — and the four public `@zag-js/vanilla` primitives: `VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps` (+ `Attrs` type). `bindable` is intentionally not re-exported. |

Components must never import `@zag-js/vanilla` directly (Biome `noRestrictedImports` enforces this outside `line-core`). `LineMachineController` implements Manifesto Law 9: if the machine fails to start it flips `fallback` to `true`, logs to `console.error`, and re-renders instead of throwing at the consumer.
