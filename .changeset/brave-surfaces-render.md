---
"@websublime/line-genui": minor
---

`@websublime/line-genui/a2ui` (Preview) now ships `<line-a2ui-surface>` and `Session`: an A2UI v0.9 renderer that accepts only v0.9 and v0.9.1 messages (anything else raises `UNSUPPORTED_MESSAGE`) and projects the `line` and basic catalogs onto line://ui components in the light DOM, loading each component on first use, with node, depth and data-model limits (`max-nodes` 1000, `max-depth` 32, `max-data-model-size` 1 MiB), a URL policy hook (`urlPolicy`), an opt-in Markdown hook (`markdownRenderer`), the `iconMap` property, one live region, and `line-a2ui-action` and `line-a2ui-error` events ready for the transport; every Button it renders is `type="button"`, so an agent never submits or resets a host form, and the `line` catalog Button no longer takes `type`, `name` or `value`; the package also exports `./custom-elements.json`.
