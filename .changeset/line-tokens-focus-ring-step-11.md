---
"@websublime/line-tokens": patch
---

`--line-focus-ring-color` is `var(--line-accent-11)` in light and dark mode (was `var(--line-accent-8)`), so the focus ring meets WCAG 2.1 SC 1.4.11, 3:1, against every gray, accent and semantic surface it sits on, in all 31 accents and 6 grays. Step 8 was below 3:1 on `--line-gray-1` in 196 of the 372 accent × gray × mode combinations. A build and CI check now fails on any ring colour below 3:1.
