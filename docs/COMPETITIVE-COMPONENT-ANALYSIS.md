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
| Button[^4.1-button] | `<line-button>` (`@websublime/line-components/button`, spec `0002-button.md`) | `<wa-button>` | `<sp-button>` | `<lion-button>` | `<fluent-button>` | — | `Button` | — | Radix Primitives and Ark UI ship no button primitive. Lion ships submit and reset as separate elements (`<lion-button-submit>`, `<lion-button-reset>`). `<line-button>` is one form-associated element with a native `<button>` inside: `type` covers submit, reset and button, a temporary native submitter carries `name=value`, `event.submitter` and the `form*` overrides, and `pressed` makes it a toggle. |
| Stack[^4.1-stack] | `<line-stack>` (`@websublime/line-components/stack`, spec `0018-stack.md`) | — | — | — | — | — | — | — | None of the seven ships a stack element or component. Web Awesome ships `wa-stack`, `wa-cluster`, `wa-flank` and `wa-split` as CSS utility classes in `dist/styles/utilities/layout.css`, with no attributes and no agent contract. `<line-stack>` is the host itself as the flex container with a bare slot, so an author `role="list"` reaches its `role="listitem"` children; `orientation`, `justify` and `align` mirror the A2UI basic v0.9 `Row`, `Column` and `List` values, and `gap` is a closed `0`–`5` scale over `--line-layout-gap-*`. |

[^4.1-button]: Button, checked 2026-10-08; line://ui cell updated 2026-10-27. line://ui: shipped by ledger row 01-C1 at `@websublime/line-components/button` (`packages/line-components/src/button/button.ts`, spec `0002-button.md`), PRD §4.1, ARCHITECTURE §13.1. Web Awesome: `custom-elements.json` of `@awesome.me/webawesome` 3.14.0 (`npm pack`), https://webawesome.com/docs/components/button/. Spectrum: `custom-elements.json` of `@spectrum-web-components/button` 1.12.4, https://opensource.adobe.com/spectrum-web-components/components/button/. Lion: `custom-elements.json` of `@lion/ui` 0.21.1, https://lion.js.org/components/button/overview/. Fluent UI Web Components: `custom-elements.json` of `@fluentui/web-components` 3.1.3, https://storybooks.fluentui.dev/web-components/?path=/docs/components-button-button--docs. Radix: the namespaces of `radix-ui` 1.7.0 (`dist/index.d.ts`) include no Button, `npm view @radix-ui/react-button` returns E404, and https://www.radix-ui.com/primitives/docs/overview/introduction lists no button page. Bits: the `Button` export of `bits-ui` 2.19.5 (`dist/bits/button`), https://bits-ui.com/docs/components/button. Ark: `@ark-ui/react` 5.39.3 has no `button` directory in `dist/components`, https://ark-ui.com/llms.txt lists no button page, and https://ark-ui.com/react/docs/components/button returns 404.

[^4.1-stack]: Stack, checked 2026-10-28. line://ui: shipped by ledger row 01-C3 at `@websublime/line-components/stack` (`packages/line-components/src/stack/stack.ts`, spec `0018-stack.md`), PRD §4.1. Web Awesome: `dist-cdn/custom-elements.json` of `@awesome.me/webawesome` 3.14.0 (`npm pack`) declares no stack tag (the only layout-like tag is `wa-split-panel`, a resizable divider); `wa-stack` is a class in `dist/styles/utilities/layout.css`, https://webawesome.com/docs/utilities/layout/. Spectrum: the `dependencies` of `@spectrum-web-components/bundle` 1.12.5 list no stack package (`grid` is a virtualised item grid, `split-view` a resizable divider). Lion: `custom-elements.json` of `@lion/ui` 0.25.0 declares no stack tag. Fluent UI Web Components: `custom-elements.json` of `@fluentui/web-components` 3.1.3 declares no stack tag. Radix: the namespaces of `radix-ui` 1.8.1 (`dist/index.d.ts`) include no stack or flex primitive (Radix Themes, a separate styled package, has `Flex`). Bits: the `dist/bits` directories of `bits-ui` 2.20.2 include no stack. Ark: the `dist/components` directories of `@ark-ui/react` 5.39.3 include no stack (`drawer-stack` stacks drawers, not layout).

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
