# line://ui — Competitive Component Analysis

This file compares line://ui with seven libraries, one component at a time. PRD [§1.3](./PRD.md#13-competitive-analysis) compares the libraries as a whole. Each Phase 1+ component spec records here what the other libraries ship for the same component, so the spec starts from known gaps. The competitor set comes from spec `docs/specs/00-spec-design-system.md` §6.G.4 (AM-048).

## How to fill

- A component spec appends its row to the table of its PRD §4 family, in the same PR as the spec.
- A cell holds the element or component name in that library, or `—` when the library ships no such primitive as of the row's check date.
- A footnote under the family table, keyed to the row, lists the source of every cell and the date they were checked.
- When an upstream library adds, renames or removes the primitive, update the cell, its source and the check date.

## Legend

| Column | Library | Package |
|---|---|---|
| line://ui | line://ui | `@websublime/line-components` |
| Web Awesome | Web Awesome | `@awesome.me/webawesome` |
| Spectrum | Spectrum Web Components | `@spectrum-web-components/*` |
| Lion | Lion | `@lion/ui` |
| Fluent UI Web Components | Fluent UI Web Components | `@fluentui/web-components` |
| Radix | Radix Primitives | `@radix-ui/react-*` |
| Bits | Bits UI | `bits-ui` |
| Ark | Ark UI | `@ark-ui/*` |

- `—` means the library ships no such primitive as of the row's check date. It never means "not checked".
- Notes holds the gap or the line://ui angle, stated as fact.

## 4.1 Primitives Base

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Button[^4.1-button] | `<line-button>` (planned, Phase 1, spec `0002-button.md`) | `<wa-button>` | `<sp-button>` | `<lion-button>` | `<fluent-button>` | — | `Button` | — | Radix Primitives and Ark UI ship no button primitive. Lion ships submit and reset as separate elements (`<lion-button-submit>`, `<lion-button-reset>`). |

[^4.1-button]: Button, checked 2026-10-08. line://ui: PRD §4.1 (Button, spec `0002-button.md`), PRD §7.3 (Phase 1), ARCHITECTURE §17 (`<line-button>`). Web Awesome: `custom-elements.json` of `@awesome.me/webawesome` 3.14.0 (`npm pack`), https://webawesome.com/docs/components/button/. Spectrum: `custom-elements.json` of `@spectrum-web-components/button` 1.12.4, https://opensource.adobe.com/spectrum-web-components/components/button/. Lion: `custom-elements.json` of `@lion/ui` 0.21.1, https://lion.js.org/components/button/overview/. Fluent UI Web Components: `custom-elements.json` of `@fluentui/web-components` 3.1.3, https://storybooks.fluentui.dev/web-components/?path=/docs/components-button-button--docs. Radix: the namespaces of `radix-ui` 1.7.0 (`dist/index.d.ts`) include no Button, `npm view @radix-ui/react-button` returns E404, and https://www.radix-ui.com/primitives/docs/overview/introduction lists no button page. Bits: the `Button` export of `bits-ui` 2.19.5 (`dist/bits/button`), https://bits-ui.com/docs/components/button. Ark: `@ark-ui/react` 5.39.3 has no `button` directory in `dist/components`, https://ark-ui.com/llms.txt lists no button page, and https://ark-ui.com/react/docs/components/button returns 404.

## 4.2 Forms — Essential

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|

## 4.3 Overlays & Feedback

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|

## 4.4 Navigation & Disclosure

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|

## 4.5 Forms — Advanced

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|

## 4.6 Data Display

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|

## 4.7 Layout & Containers

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|

## 4.8 Desktop-Inspired

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|

## 4.9 Innovative

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|

## 4.10 Real-World / Domain Components

| Component | line://ui | Web Awesome | Spectrum | Lion | Fluent UI Web Components | Radix | Bits | Ark | Notes |
|---|---|---|---|---|---|---|---|---|---|
