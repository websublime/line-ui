---
"@websublime/line-core": minor
---

Add the modular shadow-DOM reset sheets (D7) at `@websublime/line-core/styles`: 11 singleton `CSSStyleSheet` exports (`commonReset`, `inputReset`, `buttonReset`, `textareaReset`, `selectReset`, `rangeReset`, `progressReset`, `summaryReset`, `fieldsetReset`, `tableReset`, `scrollbarReset`) built from the `reset.*.css` sources mandated by ARCHITECTURE §14.4, so a component adopts only the resets for the native elements it renders.
