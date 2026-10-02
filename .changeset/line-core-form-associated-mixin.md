---
"@websublime/line-core": minor
---

Add the opt-in `FormAssociated` mixin (`@websublime/line-core/mixins/form-associated`): `class LineInput extends FormAssociated(LineElement) {}` makes a Line element a native form control backed by `ElementInternals` — its value submits with the form (`setFormValue`), it validates (`setValidity`, `checkValidity`, `reportValidity`, `:invalid` / `:valid`), and it receives the form lifecycle callbacks (`formResetCallback`, …). The `./mixins/*` subpaths now ship their JavaScript, not only their type declarations.
