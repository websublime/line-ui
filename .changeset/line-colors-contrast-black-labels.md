---
"@websublime/line-colors": patch
---

01-Z30: `--line-{hue}-contrast` reaches WCAG 2.1 AA 4.5:1 on step 9 in every hue and mode. It is `#000` (was `#fff`) for blue, bronze, brown, crimson, gold, grass, green, jade, orange, pink, red, ruby, teal and tomato, and `light-dark(#000, #fff)` (was `#fff`) for the six grays (mauve, neutral, olive, sage, sand, slate). Labels on these solids, the success, danger and info roles among them, turn black; the other 11 hues keep their value. Before, 34 of the 62 hue × mode pairs were below 4.5:1, worst orange at 2.97:1.
