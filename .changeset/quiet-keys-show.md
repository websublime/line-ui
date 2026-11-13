---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-kbd>` at `@websublime/line-components/kbd`, which draws a keyboard shortcut written once in `keys`, such as `mod+k` or `g i`, as `⌘K` with hidden words on Apple devices and as `Ctrl+K` elsewhere, with a `platform` override, a fallback slot and replaceable words through `LineKbd.keyLabels` and `key-labels`. `@websublime/line-genui/catalog` exports `kbdDescriptor`, so the `line` catalog, `catalog.json` and the frontend tools gain `Kbd` with one `keys` prop.
