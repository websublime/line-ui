---
"@websublime/line-themes": patch
---

The Radix `gray` hue is renamed `neutral`: tokens `--line-neutral-*`, export `@websublime/line-colors/neutral`, `@websublime/line-themes` subpaths `accent/neutral` and `gray/neutral`, attribute value `data-accent="neutral"` / `data-gray="neutral"`, and `neutral` in `HUES` and `GRAY_HUES`. The old hue names collided with the gray role. The gray role (`--line-gray-*`, its aliases, `data-gray`) is unchanged.
