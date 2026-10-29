# Separator

| Field | Value |
|-------|-------|
| Status | `approved` (Miguel, 2026-10-29) |
| Phase | `1` |
| Tier | `Static` |
| Tag | `line-separator` |
| Entrypoint | `@websublime/line-components/separator` |
| Form-associated | `no` |
| PRD catalogue entry | PRD §4.1, `Separator` row |
| Ledger row | `01-C4` |
| Governing sections | Phase 1 spec §6.C.0, §6.C.4 (C4 row and notes), §6.C.6, §7.4, §8 (axe risk row), §10 SD12, SD19, SD31, SD34, SD39, §12 AM-058; ARCH §3, §4, §14.7, §14.8, §17.2–§17.3; PRD §4.1, §9 |

---

## Part A — Requirements

### Overview

#### Description

`<line-separator>` draws a thin line between sections of content, horizontal or vertical (PRD §4.1, `docs/PRD.md:251`). The host itself is the line, and the shadow root renders nothing. The host carries the ARIA `separator` role and its orientation as `ElementInternals` defaults, so assistive technology announces it as a separator, and any `role` or `aria-*` attribute the author writes wins (decision D1). A `decorative` attribute turns the role into `none`, so assistive technology skips the line (decision D2). Colour and thickness come from two `--line-separator-*` tokens over the theme and token layers, with fallbacks that keep the line visible when those layers are not loaded.

#### Use cases

- Divide groups of settings, fields or paragraphs in a column of content.
- Divide items in a row, such as toolbar groups or footer links, with `orientation="vertical"` inside a horizontal `<line-stack>`.
- Name a section boundary for screen-reader users with `aria-label`.
- Add visual rhythm with no meaning for assistive technology, with `decorative`.
- Render an A2UI `Divider` node on `<line-a2ui-surface>` (ARCH §17.3, `docs/ARCHITECTURE.md:1581`).

#### Anti-patterns

- A resizable split between panes. That is the APG Window Splitter, a focusable separator with a value, and it is out of scope (R8 `docs/research/01-research-accessibility.md:73`).
- Spacing alone. Use `<line-stack>` `gap` or consumer margins, because Separator adds no space around itself.
- A border on a card or panel. Style the container's own border.
- A thematic break between paragraphs of prose where a native element fits. A plain `<hr>` maps to `separator` with no custom element.

#### User expectations

- The line spans the full width of its container when horizontal, and the full height of its row when vertical.
- A screen reader announces a separator, with its name when one is given, and skips a decorative one.
- The line follows the theme's subtle-border colour and stays visible without the theme.
- Consumer CSS on `line-separator` overrides colour, thickness, size and spacing.

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| `<line-stack>` | parent | the Stack default slot; a vertical separator stretches across a horizontal Stack's cross axis, and Stack `gap` spaces it (Stack anti-patterns, `docs/specs/0018-stack.md:37`) |
| any container | parent | light DOM; Separator imports no other component (MANIFESTO Law 4; Phase 1 spec §6.C.6) |
| `<line-a2ui-surface>` | orchestrator | creates `line-separator` by tag for A2UI `Divider` and maps `axis` to `orientation` (ARCH §17.3) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| none | — | — |

- Separator has no C6 semantic variant.
- `orientation` is a layout prop and `decorative` a semantics prop (Props below). Neither one redeclares a token.

---

## Part B — Technical Specification

### Anatomy

```
<line-separator>             LineElement; the host is the drawn line and carries the internals role
└── #shadow-root             empty; render() returns nothing
```

- The host draws the line with one border side (CSS custom properties below). No inner element and no `::part()` exist (decision D1).
- The shadow root holds no slot, so light-DOM children are not rendered (C8). ARIA treats `separator` children as presentational anyway (R8 `:73`).
- `commonReset` stays in `static styles` because ARCH §14.7 maps Separator to it (`docs/ARCHITECTURE.md:1132`). It targets shadow-tree elements only (`packages/line-core/src/styles/reset.common.css:2-38`), so it reaches nothing here and does not touch the host.
- `:host { display: block }` beats the UA `[hidden]` rule, and the reset's `[hidden]` rule does not reach the host. The stylesheet therefore adds `:host([hidden]) { display: none }`, as Button and Stack do (`packages/line-components/src/button/button.ts:129-131`; Stack proof at `packages/line-components/__tests__/integration/stack/stack.e2e.ts:175-179`).

### States

| Field | Value |
|-------|-------|
| Machine | `none` (Static tier; ARCH §8; Phase 1 spec §6.C.4 C4 row) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| none | — | — | — |

Separator has no finite states and no state flags, so it writes no `data-*` attribute and no `:state()` (ARCH §14.8).

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| none | — | — |

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| none | — | — |

- MANIFESTO Law 1 holds, because the host is the only styleable zone and the consumer styles it directly with `line-separator { … }`.
- Consumer CSS on `line-separator` beats the `:host` rules for normal declarations (ARCH §4), as the Stack Browser tier proved for the same pattern (`packages/line-components/__tests__/integration/stack/stack.e2e.ts:153-173`).

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `orientation` | `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | yes | the line's direction; `vertical` also sets `ariaOrientation = 'vertical'` on the internals unless `decorative` is set |
| `decorative` | `decorative` | `boolean` | `false` | yes | sets the internals role to `none` and clears `ariaOrientation`, so the separator leaves the accessibility tree; the line still draws in its orientation |

- "Reflects" follows Stack AM-002. A value the author or code sets is written to the attribute, and a default leaves no attribute (Lit `useDefault: true`), so removing the attribute restores the default (`docs/specs/0018-stack.md:122`).
- An unknown `orientation` value behaves as `horizontal`, and the attribute keeps what the author wrote (C8). The converter follows Stack's `enumConverter` (`packages/line-components/src/stack/stack.ts:20-22`, `:43`).
- `orientation` uses the same name and values as `<line-stack>` (Stack AM-001), because `LineElement` already owns `direction` through `DirectionMixin` (`docs/specs/0018-stack.md:313`).
- A2UI basic `Divider.axis` (`horizontal | vertical`, default `horizontal`) maps one to one to `orientation` (`a2ui-project/a2ui@cbaa5ee` `specification/v0_9/catalogs/basic/catalog.json`, `Divider`).
- Styles key on `:host([orientation="vertical"])`. The `:host` rules cover the default, a missing attribute and an unknown value.
- The host also takes `aria-label` and `aria-description` as plain attributes. They apply to the host directly, because the role sits on the host (C5).

**Internals values**

| `orientation` | `decorative` | `internals.role` | `internals.ariaOrientation` |
|---|---|---|---|
| `horizontal`, missing or unknown | `false` | `'separator'` | `null` |
| `vertical` | `false` | `'separator'` | `'vertical'` |
| any | `true` | `'none'` | `null` |

- The component writes these through `this[INTERNALS]` (`packages/line-core/src/line-element.ts:31-36`; `INTERNALS` at `packages/line-core/src/internals.ts:13`, exported from `@websublime/line-core`, `packages/line-core/src/index.ts:2`) in the update cycle whenever `orientation` or `decorative` changes, starting with the first update.
- The component never writes a `role` or `aria-*` attribute. An author `role` or `aria-*` attribute therefore overrides the internals default (HTML §4.13.7.4, quoted in R8 `:141-142`).

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

Separator dispatches no event. It holds no value and takes no input, so C3 and C9 add nothing.

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-separator-color` | `var(--line-gray-6, currentColor)` | none; the host, as the colour of the drawn border side |
| `--line-separator-thickness` | `var(--line-border-1, 1px)` | none; the host, as the width of the drawn border side |

**Drawing**

| Orientation | Box | Line |
|---|---|---|
| horizontal | `display: block`; block size from the border alone; inline size `auto`, so it fills a block container | `border-block-start`, solid, `--line-separator-thickness` wide, `--line-separator-color` |
| vertical | `display: block`; `inline-size: 0`; `min-block-size: 1em`; block size `auto` | `border-inline-start`, same width and colour |

- Both orientations set `align-self: stretch` and `flex-shrink: 0` on `:host`. A horizontal separator in a column Stack spans the full width whatever the Stack's `align` is. A vertical separator in a row Stack spans the row's height. Neither one shrinks to zero in a crowded flex line.
- `align-self: stretch` stretches only an item whose cross size is `auto` (CSS Flexbox 1 §9.4), so neither orientation sets an explicit cross size.
- Outside a flex or grid container, a vertical separator has no stretch to use, and its height would be zero. `min-block-size: 1em` keeps a line one text height tall there.
- The line is a border, not a background. In forced-colors mode the UA forces `background-color` to the opposite of the `color` system colour, which is `Canvas` for normal text, so a background line vanishes against the page. A border colour is forced to the colour an empty author style sheet gives, which is the text colour (CSS Color Adjust 1 §3.1, editor's draft read 2026-10-28).
- The rules set the border longhands, not the shorthand. An invalid `var()` in a shorthand makes every longhand fall back to its initial value, including `border-style: none`, which would hide the line (CSS Variables 1 invalid-at-computed-value-time rule).
- Separator sets no margin. Spacing comes from Stack `gap` or consumer CSS.
- `--line-gray-6` is the PRD §9 step for "Subtle borders / separators" (`docs/PRD.md:1274`). `line-themes` defines it per gray hue (`packages/line-themes/src/defaults.css:43`) and has no alias for step 6; `--line-gray-border` is step 7 (`packages/line-themes/src/aliases.css:24`).
- `--line-border-1` is `1px` (`packages/line-tokens/src/border-width.css:9`).
- Without `line-themes`, `--line-gray-6` is undefined, so the `currentColor` fallback draws the line in the text colour. Without `line-tokens`, the `1px` fallback applies. Without either fallback the line would vanish, unlike Stack's gap, whose undefined token leaves a usable zero gap. Button uses the same pattern for its focus ring (`docs/specs/0002-button.md:198`). Upstream `web_core` also falls back to `1px` and a literal colour (`a2ui-project/a2ui@cbaa5ee` `typescript/core/web_core/src/universal/basic_catalog/components/Divider.ts`).
- A consumer sets either token on `line-separator`, or overrides the border, size or margin directly (Consumer styling below).

#### Consumer styling

```css
/* Tokens: colour and thickness */
line-separator {
  --line-separator-color: var(--line-accent-9);
  --line-separator-thickness: var(--line-border-2);
}

/* Dashed line: the line is a border, so change its style on the drawn side only */
line-separator.dashed:not([orientation="vertical"]) {
  border-block-start-style: dashed;
}
line-separator.dashed[orientation="vertical"] {
  border-inline-start-style: dashed;
}

/* Spacing: Separator sets no margin */
line-separator {
  margin-block: 1rem;
}
line-separator[orientation="vertical"] {
  margin-block: 0;
  margin-inline: 0.5rem;
}
```

- These rules live in the outer tree. Normal outer declarations on `line-separator` beat the component's `:host` rules (ARCH §4), as the Stack Browser tier proved for the same pattern (`packages/line-components/__tests__/integration/stack/stack.e2e.ts:153-173`).
- No `::part()` exists, because the host is the only styleable zone.
- A label inside the line, such as `—— or ——`, is not supported. It needs a slot for the text and two line segments around it, which is a different anatomy from a host that is the line.

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

Separator takes no focus. A focusable separator (APG Window Splitter) is out of scope.

### A11y

| Field | Value |
|-------|-------|
| Role | `separator` on the host, as the `ElementInternals` default `internals.role`; `none` when `decorative` (decisions D1, D2; R8 `:73`) |
| ARIA attributes | none written by the component; `internals.ariaOrientation` is `'vertical'` for a vertical, non-decorative separator and `null` otherwise. An author `role` or `aria-*` attribute on the host overrides the internals defaults |
| Accessible name | optional for `separator` (R8 `:73`); the host `aria-label` names it directly, because the role sits on the host (C5); nothing is copied |
| Focus | none; the host is not focusable and does not delegate focus |

- **Placement.** Phase 1 spec §10 SD31 puts interactive roles on inner native elements. Separator is not interactive, so D1 places the role on the host through internals, and Phase 1 spec §6.C.4 requires the Browser-tier accessibility-tree check below for such roles (`docs/specs/01-spec-core-primitives.md:1172`; §10 SD39; §12 AM-058).
- **Engine support.** `ElementInternals.role` ships in Chrome 103 and the string `aria*` properties in Chrome 81; both ship in Firefox 119 and Safari 16.4 (R8 `:106-107`). Chromium exposes `internals.role = 'separator'` plus `ariaOrientation = 'vertical'` as a vertical separator (R8 `:145-146`, probe P1). Firefox and WebKit exposure was not probed.
- **Decorative with a name.** A decorative separator should carry no `aria-label`. ARIA's presentational-role conflict rule tells browsers to ignore `none` on an element with a global ARIA property such as `aria-label`, so such a host would surface as a named node [INFERENCE: ARIA 1.2 "Presentational Roles Conflict Resolution"; not probed]. The component does not intervene, and the docs and the agent-facing description say so.
- **Contrast.** Step 6 is a low-contrast step by design (PRD §9). WCAG 2.1 SC 1.4.11 asks 3:1 only for graphics required to understand the content, so a separator whose sections also differ by headings or spacing needs no more [INFERENCE: reading of SC 1.4.11; step-6 contrast not measured]. A consumer who relies on the line alone raises `--line-separator-color`.

**What axe proves here (R8 §2.4)**

- The axe gate runs axe-core 4.14.0 (`bun.lock:918`) through `@axe-core/playwright` 4.14.0 (`bun.lock:194`) on the §7.4 ruleset (`packages/line-components/__tests__/a11y/axe.ts:19`).
- axe 4.14.0 cannot see the separator role. Its internals lookup reads `globalThis._elementInternals`, the own properties `_internals`, `internals` and `internals_`, and own symbols described `internals` or `privateInternals` (`node_modules/.bun/axe-core@4.14.0/node_modules/axe-core/axe.js:23868-23936`). `LineElement` keeps its internals in a `#private` field behind a prototype accessor keyed by `Symbol('line.internals')`, which SD19 chose so that axe's lookup misses it (`internals.ts:1-13`). axe therefore sees a role-less custom element.
- A labelled host passes `aria-prohibited-attr` in 4.14.0. The rule (`axe.js:36815-36827`) calls `listProhibitedAttrs`, which returns an empty list for any valid custom-element name when no explicit role exists (`axe.js:32335-32336`), so the evaluate function returns `false` before it reads the label (`axe.js:32273-32274`).
- Zero violations in the Separator stories are therefore expected [INFERENCE: read from source; the A11y tier proves it]. They prove that the host and page break no §7.4 rule. They prove nothing about the `separator` role, its orientation or its name, because axe sees none of them (Phase 1 spec §7.4, `docs/specs/01-spec-core-primitives.md:2063-2064`).
- The Storybook addon panel resolves axe-core 4.11.4 (`bun.lock:1868`). That version has no internals lookup, and its `listProhibitedAttrs` has no custom-element exemption, so a role-less host gets `['aria-label', 'aria-labelledby']` as prohibited (`node_modules/.bun/axe-core@4.11.4/node_modules/axe-core/axe.js:26968-26977`). With no text content the evaluate function returns `true` (`axe.js:26960-26966`), so the panel shows a serious `aria-prohibited-attr` violation on the Labelled story. That finding is a false positive, because the host carries the `separator` role through internals. The panel gates nothing (Phase 1 spec §7.4 "Author panel" row; §10 SD78).
- Playwright `ariaSnapshot` cannot replace the accessibility-tree check either. Its injected script reads only the `role` attribute for an explicit role (`node_modules/.bun/playwright-core@1.64.0/node_modules/playwright-core/lib/coreBundle.js:20944`, `getExplicitAriaRole`), and the bundle has no `ElementInternals` reference, so a snapshot would show no separator node [INFERENCE: read from source, not probed]. This answers the open `ariaSnapshot` probe of R8 §6 Q5 (`:333-336`) for internals roles.

**Accessibility tree** (Phase 1 spec §6.C.4 notes, §7.4, §10 SD39, §12 AM-058)

- **Chromium accessibility tree, automated.** A Browser-tier test opens a CDP session with `page.context().newCDPSession(page)` and reads `Accessibility.getPartialAXTree` for each host. It asserts the following.
  - The default host has role `separator` and `orientation` `horizontal`, the implicit value Chromium reports (AM-001).
  - A host with `orientation="vertical"` has role `separator` and `orientation` `vertical`.
  - A host with `aria-label="Advanced settings"` has the name "Advanced settings".
  - A `decorative` host, in either orientation, has role `none` or is ignored.
  - An author `role="presentation"` or `aria-orientation="vertical"` attribute overrides the internals default.
- **Firefox and WebKit.** Playwright 1.64.0 offers no equivalent. CDP sessions are Chromium-only (`node_modules/.bun/playwright-core@1.64.0/node_modules/playwright-core/types/types.d.ts:10378`), and `page.accessibility` no longer exists in its types. The Browser tier instead reads the internals values back in all three engines through the `INTERNALS` symbol that `@websublime/line-core` already exports, as the unit tests do (`packages/line-components/__tests__/stack.test.ts:134`). The fixture module re-exports `INTERNALS`, and the test reads `Reflect.get(host, INTERNALS)` in the page. This adds no public API and no test hook to the package. It proves that each engine's `ElementInternals` holds `role` and `ariaOrientation` as the table above says. It does not prove that the engine exposes them to assistive technology.
- **Result, Chromium accessibility tree** (C4 Browser tier, `packages/line-components/__tests__/integration/separator/separator.e2e.ts`, 2026-10-29): every assertion above holds in Chromium. The default host is `separator` with `orientation` `horizontal`; `orientation="vertical"` gives `separator` with `orientation` `vertical`; `aria-label="Advanced settings"` gives that name; both decorative hosts and an author `role="presentation"` are ignored or `none`; an author `aria-orientation="vertical"` gives `orientation` `vertical`. The internals read-back holds the internals table in chromium, firefox and webkit (AM-001).
- A manual VoiceOver pass is not required (Phase 1 spec AM-058; Open Question 3).
- Firefox and WebKit exposure to assistive technology stays unverified by any check above; the gap is recorded here (Phase 1 spec AM-058; Open Question 17).

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `orientation` is a string enum and `decorative` a boolean |
| C2 | Slots carry `@slot` and a single or multiple classification | no slots |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | no events |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated |
| C5 | The host accepts an accessible name and applies it to the element with the role | the host carries the role through internals, so a host `aria-label` or `aria-description` applies directly and nothing is copied |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | no variants |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | the class JSDoc carries `@summary` and `@cssprop` for both tokens; no `@slot`, `@csspart` or `@fires`, because there are none; nothing is deprecated |
| C8 | Missing or partial props degrade to an empty or neutral state | with no attributes it is a horizontal `separator`; an unknown `orientation` behaves as `horizontal`; light-DOM children are not rendered; without the theme and token layers the line draws in `currentColor` at `1px` |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| none | — | — |

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `Separator` |
| Tag | `line-separator` |
| `load()` subpath | `@websublime/line-components/separator` |
| Prop schema | `orientation`, `decorative` |
| Slot map | none |
| Binding map | `orientation`, `decorative` → attribute; no value prop; no commit event |
| Action map | none |
| Accessibility requirements | none; a separator's name is optional (R8 `:73`) |
| Agent-facing description | A thin line that separates sections of content. `orientation` is `horizontal` (default) for a line across the full width between content stacked top to bottom, or `vertical` for a line between items placed side by side, such as inside a horizontal Stack. Assistive technology announces it as a separator. Set `decorative` when the line only adds visual rhythm, so assistive technology skips it, and give a decorative line no `aria-label`. Give a separator `aria-label` only when the section that follows needs a spoken name. It has no children and adds no spacing, so the surrounding layout sets the gap. |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C4 row) |

- Stream G writes this descriptor in G1, because C4 ships without one (Phase 1 spec §6.C.0 step 3, `docs/specs/01-spec-core-primitives.md:912`).
- The prop schema carries no `aria-label`, as Button's does not (`docs/specs/0002-button.md:263`). How the surface passes a name to the host is Stream G's, settled in G1.
- The `basic` catalog maps A2UI `Divider` to `line-separator` and passes `axis` to `orientation` one to one (ARCH §17.3, `docs/ARCHITECTURE.md:1581`). `Divider` has only `axis` and requires only `component` (`a2ui-project/a2ui@cbaa5ee` `specification/v0_9/catalogs/basic/catalog.json`), so basic nodes are never decorative. The `line` catalog exposes `decorative` (R3 `docs/research/01-research-descriptor-api.md:232`).
- Upstream `web_core` renders `Divider` as an `<hr>` with a `--a2ui-divider-spacing` margin of 16px by default (`a2ui-project/a2ui@cbaa5ee` `typescript/core/web_core/src/universal/basic_catalog/components/Divider.ts`). Separator does not copy the margin; the enclosing `line-stack` gap spaces surface nodes.

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/separator` |
| Kind | `independent` (ARCH §12; Phase 1 spec §10 SD12) |
| Registers | `line-separator` |
| Reset modules | `commonReset` (ARCH §14.7, `docs/ARCHITECTURE.md:1132`) |

- Files: `src/separator/separator.ts` (class and `customElements.define`), `src/separator/separator.types.ts`, `src/separator/index.ts`.
- `package.json` gains the `./separator` export of Phase 1 spec §4.2 (`docs/specs/01-spec-core-primitives.md:243`), and the Vite build gains the `separator/index` entry next to `stack/index` (`packages/line-components/vite.config.mjs:15`).
- Stories import `@websublime/line-tokens/border-width`, which already has an ambient declaration (`apps/storybook/types/line-css.d.ts:7`); `line-colors` and `line-themes` load in the Storybook preview (`apps/storybook/.storybook/preview.ts:3-4`).

### Markup examples

```html
<!-- Default: horizontal, announced as a separator -->
<p>Account</p>
<line-separator></line-separator>
<p>Billing</p>

<!-- Vertical, between items in a row -->
<line-stack orientation="horizontal" align="center">
  <a href="/docs">Docs</a>
  <line-separator orientation="vertical"></line-separator>
  <a href="/blog">Blog</a>
</line-stack>

<!-- Named section boundary -->
<line-separator aria-label="Advanced settings"></line-separator>

<!-- Decorative: skipped by assistive technology -->
<line-separator decorative></line-separator>
<line-separator decorative orientation="vertical"></line-separator>

<!-- Tokens and consumer CSS -->
<style>
  line-separator.accent {
    --line-separator-color: var(--line-accent-9);
    --line-separator-thickness: var(--line-border-2);
    margin-block: 1rem;
  }
</style>
<line-separator class="accent"></line-separator>
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom | prop defaults and reflection; no attribute for a default; the `orientation` converter falling back to `horizontal` while the attribute keeps the author's value; removing an attribute restoring the default; `decorative` boolean parsing; the internals `role` and `ariaOrientation` for every row of the internals table, including `decorative` turned off again; no `role`, `aria-*` or `data-*` attribute written; author `role`, `aria-orientation` and `aria-label` left unchanged; an empty shadow root; light-DOM children not rendered; `packages/line-components/__tests__/manifest-paths.test.ts` on the packed tarball (Phase 1 spec §6.C.6) |
| Browser | Playwright `*.e2e.ts` on chromium, firefox and webkit | computed border side, width and colour per orientation; a horizontal separator at full width in a block container and in a column Stack with `align="center"`; a vertical separator at the row height in a horizontal Stack with `align="center"`, at `1em` outside flex, and not shrunk in a crowded row; `decorative` vertical still drawing vertical; `1px` and `currentColor` on a page without `line-tokens` and `line-themes`, and `--line-gray-6` with them; consumer CSS on `line-separator` beating the `:host` rules, covering the tokens, `margin-block` and `margin-inline`, and the Consumer styling dashed rules computing `dashed` on the drawn side of each orientation while the other side stays `none`; `<line-separator hidden>` rendering nothing; internals `role` and `ariaOrientation` read back through `INTERNALS`; in chromium only, the border colour under `page.emulateMedia({ forcedColors: 'active' })` differing from the page background (AM-001) |
| A11y | axe-core | zero violations (MANIFESTO Law 3) in every story: Default, Vertical, Labelled, Decorative and Custom tokens |
| Accessibility tree | Playwright CDP session in the Browser tier (chromium) | the Chromium accessibility-tree assertions in the A11y section; the result recorded there before merge (Phase 1 spec §10 SD39, §12 AM-058) |
| htmx | n/a | `n/a`. Separator is neither value-bearing nor compound, and it has no slot, so the harness has nothing to submit, trigger or swap (Phase 1 spec §10 SD34) |
| Visual | Playwright `separator.visual.ts` on the `visual` project | every Separator story, with Linux baselines from a `visual-baselines.yml` run (Phase 1 spec §6.C.6, §10 SD98) |

- No update-rate row, because Separator is not a machine row (Phase 1 spec §6.C.6).
- The axe and visual tests run against the Storybook stories on port 4320 (Phase 1 spec §6.P.7, §6.P.11).
- The layout, internals and CDP tests need fixture pages under `packages/line-components/__tests__/integration/separator/`, one loading `@websublime/line-components/separator` with `line-tokens/border-width` and `line-themes`, and one without them, served by the existing port-4321 entry (`playwright.config.ts:21-26`), placed within the Phase 1 spec §4 file classes.
- `line-colors` is not a `line-components` dependency, so the fixture page with `line-themes` has no palette: `--line-gray-6` is `var(--line-sand-6)` there, which is guaranteed-invalid, and the line falls back to `currentColor`. The `--line-gray-6` test therefore sets the step-6 palette values on `html` itself and checks that the line takes the colour `--line-gray-6` resolves to (AM-001).
- The internals read-back fails loudly if the fixture's `INTERNALS` is a different Symbol copy from the component's, because `Reflect.get` then returns `undefined`.

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| 1 | Where does the role sit, and what is the anatomy? | Miguel | `ElementInternals` on the host sets `role = 'separator'` and `ariaOrientation`; the host is the drawn line; the shadow root renders nothing; no `::part()`; the host writes no `role` or `aria-*` attribute, so author attributes override; host `aria-label` names the separator directly (C5). An inner `<span part="root">` and an inner native `<hr part="root">` were rejected (Miguel, 2026-10-28) |
| 2 | How does a separator become decorative? | Miguel | A boolean `decorative` attribute sets the internals role to `none` and clears `ariaOrientation`, so the separator leaves the accessibility tree; agent-settable, after Radix and R3. No attribute, with the author writing `role="none"`, was rejected (Miguel, 2026-10-28) |
| 3 | Who runs the manual VoiceOver pass? | Miguel | Nobody: a manual VoiceOver pass is not required (Phase 1 spec AM-058, Miguel 2026-10-28) |
| 4 | What are the orientation values and default? | orchestrator | `orientation`: `horizontal \| vertical`, default `horizontal`, reflected per Stack AM-002; an unknown value behaves as `horizontal` and the attribute keeps the author's value (C8); same name and values as `<line-stack>` (Stack AM-001); A2UI `Divider.axis` maps one to one (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 5 | Which tokens set colour and thickness? | orchestrator | `--line-separator-color` over `--line-gray-6` (PRD §9 step 6) and `--line-separator-thickness` over `--line-border-1` (orchestrator default shown to Miguel on 2026-10-28, no objection; fallbacks in row 13) |
| 6 | How is the line sized? | orchestrator | Horizontal spans the inline axis; vertical spans the cross axis with `align-self: stretch` and has a block size outside flex; `:host([hidden]) { display: none }` as Button and Stack (orchestrator default shown to Miguel on 2026-10-28, no objection; the outside-flex size in row 14 and border drawing in row 15) |
| 7 | Does Separator add spacing? | orchestrator | No margin by default; spacing comes from Stack `gap` or consumer CSS (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 8 | Does Separator have variants, events, keyboard or focus? | orchestrator | None; not focusable; a focusable APG Window Splitter is out of scope (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 9 | How do `decorative` and `orientation` combine? | orchestrator | `decorative` is reflected; a decorative vertical separator still draws vertical (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 10 | What are the htmx row, `agentExposed` and descriptor plan? | orchestrator | htmx `n/a`, neither value-bearing nor compound; `agentExposed: true`; G1 writes the descriptor; catalog name `Separator`; `basic` maps `Divider` to `line-separator` with `axis` → `orientation` (orchestrator default shown to Miguel on 2026-10-28, no objection) |
| 11 | Does a horizontal separator set `ariaOrientation` explicitly? | orchestrator | No. `ariaOrientation` is `'vertical'` for a vertical separator and `null` otherwise. ARIA gives `separator` an implicit `horizontal` (R8 `:73`), Radix writes `aria-orientation` only for vertical (`radix-ui/primitives` `packages/react/separator/src/separator.tsx`, `main`, read 2026-10-28), and the default, unknown and decorative cases then share one `null` path. Writing `'horizontal'` explicitly was rejected as adding nothing an assistive technology reads (orchestrator default set while drafting, approved with the spec by Miguel on 2026-10-29) |
| 12 | How does `decorative` clear the semantics? | orchestrator | `internals.role = 'none'` and `internals.ariaOrientation = null`; turning `decorative` off restores `separator` and the orientation value. The component leaves an author `aria-label` alone on a decorative host, and the docs say a decorative separator carries no name. `internals.role = null` was rejected, because it leaves a `generic` host rather than the `none` D2 names; dropping `decorative` when a name is present was rejected as a silent override of the author (orchestrator default set while drafting, approved with the spec by Miguel on 2026-10-29) |
| 13 | What draws without `line-themes` or `line-tokens`? | orchestrator | The token defaults carry fallbacks, `var(--line-gray-6, currentColor)` and `var(--line-border-1, 1px)`, because the line would otherwise vanish. Button's focus ring uses the same pattern (`docs/specs/0002-button.md:198`), and upstream `web_core` falls back to `1px`. No fallback, as Stack has for its gap, was rejected because a zero gap stays usable while a missing line does not (orchestrator default set while drafting, approved with the spec by Miguel on 2026-10-29) |
| 14 | How tall is a vertical separator outside a flex or grid container? | orchestrator | `min-block-size: 1em`, with the block size left `auto` so `align-self: stretch` still applies in flex and grid. `block-size: 100%`, as upstream `web_core` uses, was rejected, because a percentage against an auto-height parent resolves to zero and an explicit block size blocks the flex stretch (CSS Flexbox 1 §9.4) (orchestrator default set while drafting, approved with the spec by Miguel on 2026-10-29) |
| 15 | Is the line a background or a border? | orchestrator | A border side (`border-block-start` horizontal, `border-inline-start` vertical) set through longhands. Forced-colors mode turns `background-color` into the page background, so a background line vanishes, while a border colour becomes the text colour (CSS Color Adjust 1 §3.1). The shown default allowed a border on evidence, and this is that evidence (orchestrator default set while drafting, approved with the spec by Miguel on 2026-10-29) |
| 16 | How does the Firefox and WebKit Browser tier check the semantics without exposing internals? | orchestrator | It reads `role` and `ariaOrientation` back through the `INTERNALS` symbol `@websublime/line-core` already exports, which adds no public API. It proves the values each engine holds, not what the engine exposes; the Chromium CDP check covers Chromium exposure (orchestrator default set while drafting, approved with the spec by Miguel on 2026-10-29) |
| 17 | Does any check cover Firefox's accessibility exposure of the internals role? | Miguel | (a) No check; Firefox stays covered by the internals read-back only, and the gap is recorded (Miguel, 2026-10-28). A Firefox VoiceOver run and a Firefox NVDA run on Windows were rejected |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change.

| ID | Date | Trigger | Change | Reason | Evidence |
|---|---|---|---|---|---|
| AM-001 | 2026-10-29 | factual correction (implementation, 01-C4) | Tests: a note says the `line-themes` fixture page has no palette, so the `--line-gray-6` test sets the step-6 palette values on `html`. A11y, Accessibility tree: the default host's `orientation` is `horizontal`, and the Chromium result is recorded. Tests, Browser row: the forced-colors `[INFERENCE]` tag is replaced by the Browser-tier proof | `line-colors` is not a dependency of `line-components`, so `--line-gray-6` resolves to the guaranteed-invalid value on that page and the test could not tell the theme colour from the `currentColor` fallback; the Browser tier proved the two inferences | Chromium probe on `integration/separator/index.html`: `--line-gray-6` computes empty and the border colour equals the text colour; `getPartialAXTree` on a default host returns `orientation` `horizontal`; `packages/line-components/__tests__/integration/separator/separator.e2e.ts`, 41 passed and 4 skipped (the two CDP tests outside chromium) on chromium, firefox and webkit |
