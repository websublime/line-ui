---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-presence>` at `@websublime/line-components/presence`, which shows and hides its content with enter and exit animations from your page's CSS on `::part(root)`: setting `present` shows the content, clearing it plays the exit animation and then hides the content with its state kept, `skip-animation-on-mount` blocks the enter animation at the first render, and `line-exit-complete` and `line-enter-complete` fire when each finishes. `@websublime/line-genui/catalog` exports `presenceDescriptor`, which is not agent-exposed, so the `line` catalog, `catalog.json` and the frontend tools leave it out.
