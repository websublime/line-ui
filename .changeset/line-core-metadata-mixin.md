---
"@websublime/line-core": minor
---

Implement the `MetadataMixin` (D3) for `LineElement`. The mixin replaces its D1 identity stub with the four static metadata members every line://ui component carries (spec §6.D.3): `version` (semver string), `docs` (documentation URL), `qa` (`string[]` of tags), and `scope` (string). Components override them declaratively, e.g. `static version = '0.1.0'`. The mixin owns the DECLARATION only — surfacing the members as host attributes (`data-line-version`, `data-line-docs`, …) remains the Inspector mixin's (D2) responsibility, which reads them defensively off `this.constructor`. The export name, file path, and generic signature stay byte-stable from the stub (`.d.ts`-determinism invariant).
