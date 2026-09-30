---
"@websublime/line-core": minor
---

Add `LineMachineController` (D6), the Lit `ReactiveController` adapter around Zag.js, at `@websublime/line-core/machine` together with the four public `@zag-js/vanilla` primitives (`VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps`) and the `Attrs` type. A machine that fails to start flips the controller into static fallback (`fallback === true`, `console.error`, re-render) instead of throwing at the consumer (Manifesto Law 9); pass `staticFallbackOnFailure: false` to opt out.
