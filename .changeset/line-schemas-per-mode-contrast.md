---
"@websublime/line-schemas": patch
---

01-Z30: the contrast tables now hold, for each hue and mode, whichever of `#000` and `#fff` has the higher WCAG 2.1 contrast on the Radix step 9, so every step-9 label reaches 4.5:1 (worst plum on `#fff`, 4.75:1). `BLACK_CONTRAST_HUES` grows from 6 to 20 hues (adds blue, bronze, brown, crimson, gold, grass, green, jade, orange, pink, red, ruby, teal, tomato), and `BlackContrastHue` widens with it. `PER_HUE_CONTRAST` keeps its type and holds the light-mode colour: `'#000'` for those 14 hues and the six grays (was `'#fff'`). New exports: `PER_HUE_CONTRAST_DARK`, the dark-mode table, where the six grays are `'#fff'`, and `contrastFor(hue, mode)`, which reads the table of a mode.
