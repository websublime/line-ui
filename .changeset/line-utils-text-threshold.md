---
"@websublime/line-utils": patch
---

01-Z30: new export `TEXT_THRESHOLD`, 4.5, the WCAG 2.1 AA floor for normal-size text (SC 1.4.3), which the contrast validator now applies to every step-9 label pair. `THRESHOLD` stays 3, documented as the floor for non-text UI and large text.
