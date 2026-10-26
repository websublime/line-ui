---
"@websublime/line-core": minor
---

`LineMachineController` now passes host props to the machine on every host update, so `watch` trackers and guards see each property change; the `props` option must be a function of the host's properties, `props: () => ({ disabled: this.disabled })`.
