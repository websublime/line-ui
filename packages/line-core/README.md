# @websublime/line-core

`LineElement` base class, Zag.js state-machine controller, shared style mixins, and reactive controllers for line://ui components. Lit 3 + Shadow DOM.

## Entry points

| Import | Exports |
| --- | --- |
| `@websublime/line-core` | `LineElement`, `INTERNALS` and `FormAssociated` (+ `FormAssociatedMembers` type). The other mixins load from `@websublime/line-core/mixins/<name>`; `@websublime/line-core/mixins/form-associated` re-exports `FormAssociated` from the root. |
| `@websublime/line-core/machine` | `LineMachineController` (+ `LineMachineControllerOptions` type) — the Lit `ReactiveController` adapter around Zag.js — and four of the five values `@zag-js/vanilla` exports: `VanillaMachine`, `normalizeProps`, `spreadProps`, `mergeProps` (+ `Attrs` type); `toStyleString` is left out. `bindable` is intentionally not re-exported. |

Components must never import `@zag-js/vanilla` directly (Biome `noRestrictedImports` enforces this outside `line-core`). `LineMachineController` implements Manifesto Law 9: if the machine fails to start it flips `fallback` to `true`, logs to `console.error`, and re-renders instead of throwing at the consumer.

A component passes its machine props to `LineMachineController` as a function of its own properties, `props: () => ({ disabled: this.disabled })`. The controller hands that function to the machine when it starts and to `updateProps` on every host update, so `watch` trackers and guards see each property change. Components never call `updateProps` themselves.

Every `LineElement` attaches its `ElementInternals` once, in its constructor, and keeps them private. A subclass or mixin reaches them as `this[INTERNALS]`, a protected accessor keyed by the exported `Symbol('line.internals')`; no public `internals` property exists and nothing is registered on `globalThis`. `LineElement` is not form-associated; `FormAssociated(LineElement)` opts in and reuses the same internals. `FormAssociated` lives in the root entry, and its `./mixins/form-associated` subpath re-exports it through the bare specifier `@websublime/line-core`, so both specifiers share one `INTERNALS` Symbol wherever that specifier resolves to the root module: through `exports` in a bundler, on unpkg raw through the import map's `@websublime/line-core` entry, and on jsDelivr `+esm` only when every `@websublime/*` URL on the page names the same exact version, such as `@0.2.0`, never a range such as `@0.2` or `@latest` (a range root URL and the subpath's rewritten self-reference become two modules with two Symbols). The two CDN cases follow from how each CDN resolves the bare specifier and have not yet been checked end to end. The protected `reflectState(name, active)` writes machine state to the host as the attribute `data-<name>` and the custom state `:state(<name>)`, both verbatim, so `focus-visible` becomes `data-focus-visible` and `:state(focus-visible)`.
