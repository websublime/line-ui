# Research: Theming showcase on the Astro site (R10)

**Row:** `01-Z15` (Phase 2 plan §5.1 R10, decision O5 (b))
**Date:** 2026-11-26
**Repo sources:** `docs/plans/02-plan-essential-forms.md` §1, §2.8, §4.0, §4.6, §5.1 R1, R4, R8, R10, §5.4 O5, §5.5, §5.7, §6, §7.3; `docs/PRD.md` (v0.8.36) §5.2.1, §5.3, §7.4, §9.3–§9.9, §9.12, §9.14, Appendix C; `docs/ARCHITECTURE.md` (v0.8.28) §4, §12, §16.2, §17.2, §17.3; `docs/MANIFESTO.md` Principles 1, 4, 5, Laws 2–4, 7–10, Out of Scope; `docs/plans/01-plan-core-primitives.md` §5.4 O3; `docs/specs/01-spec-core-primitives.md` §6.S.1, §10 SD72, SD98, §12 AM-109; `docs/specs/00-spec-design-system.md` AM-014; `docs/retrospective/01-phase-01-retro.md`; `docs/research/01-research-site-dogfooding.md` (R12); `apps/site/**`; `apps/storybook/.storybook/preview.ts`, `stories/theming.mdx`; `packages/line-tokens/src`, `line-colors`, `line-schemas/src`, `line-themes/src`, `line-utils/src/contrast.ts`; `packages/line-components/src/{button,icon-button,chip,badge,alert}`; `scripts/validate-contrast.mjs`; `.github/workflows/deploy-site.yml`, `checks.yml`
**Status:** Evidence. Research carries no rules (`docs/PROCESS.md` §1). Recommendations are marked as such; every decision is an open question in §6.

> **TL;DR**
>
> - Today line://ui exposes four theme axes and two knobs: the accent hue (`data-accent`, 31 hues, none means indigo), the gray hue (`data-gray`, 6 hues, none means the auto pair), the colour scheme (`color-scheme`, the only mode switch), and the shadow strengths (`--line-shadow-strength`, `--line-shadow-strength-dark`). The semantic roles are fixed by design. There is no radius, density or scaling axis in any package or in the PRD.
> - The five Phase 2 controls map onto those axes: Select → accent (32 options, grouped), Radio Group → gray (6 hues), Switch → gray auto-pair on or off, Toggle Group (single) → light, dark or system, Slider → shadow strength. Each mapping puts a concrete requirement on its component spec, for example Toggle Group must expose `deselectable: false`, because Zag defaults it to `true`.
> - A live switch is one attribute or property write. In a probe the role tokens of a nested `[data-accent]` scope recomputed in the same task in Chromium, Firefox and WebKit, and `color-scheme` on the scope flipped its `light-dark()` values. But `--line-focus-ring-color`, the gradient, highlight and SVG tokens resolve on `html` and keep the page accent inside a scoped preview. A site rule that recomposes the ring on the scope fixes the ring in all three engines.
> - Contrast is the main risk. The primary Button, IconButton and pressed primary Chip paint `--line-accent-contrast` on `--line-accent-solid`. That pair is below 4.5:1 for 34 of the 62 hue × mode pairs (minimum 2.97:1, orange). Only 11 hues pass in both modes. `validate-contrast` gates 3:1 on that one pair (Phase 00 spec AM-014), while PRD §5.2.1 still says 4.5:1. A showcase that offers all 31 accents will show combinations that fail axe `color-contrast` on component labels.
> - The site needs every palette for a full browser. The `line-colors` barrel is 123,326 B raw and 23,896 B gzipped, against today's whole page stylesheet of 108,302 B raw and 15,790 B gzipped.
> - Stream S cannot open its PR before the five controls are done (plan §6). Those controls sit in the "other 12" wave after stream F, the Input, Field and Checkbox set, and stream G. Every merge to `main` that touches `apps/site/**` deploys to production, so a scaffold PR would publish a partial showcase.

---

## 1. Question

Plan §5.1 R10: "Per O5 (b): the showcase scope on the Astro site, with the Phase 2 controls as its UI" (`docs/plans/02-plan-essential-forms.md:272`). O5 (b) makes the showcase dogfood Select, Slider, Switch, Radio Group and Toggle Group and gate the exit (`:346-354`). PRD v0.8.36 §7.4 states the criterion: "The site's Theming showcase (§5.3) is built with Phase 2 line://ui components and is live at `line-ui.websublime.com`" (`docs/PRD.md:985`, `:987`). PRD §5.3 describes the section as an "Interactive theme browser section on the site" (`:584`).

- **Q1** What can a visitor browse and change, mapped to what `line-themes` and the tokens expose today?
- **Q2** Which Phase 2 control drives each axis, and what must each control support for it?
- **Q3** How do theme changes apply live on a static Astro page, what does the preview render, and how is the state shared?
- **Q4** How does the site load the components, and how does stream S depend on the five controls?
- **Q5** What do accessibility and the MANIFESTO laws require, and what evidences the exit criterion?
- **Q6** Which scope options exist, and what does each cost?

## 2. Findings

### 2.1 Q1: what is themeable today

| Axis | Mechanism | Values | Evidence |
|---|---|---|---|
| Accent hue | `data-accent="X"` on any element; the map sets `--line-accent-1..12`, `-a1..a12` and `-contrast` | The 31 `ACCENT_HUES`, which equal `HUES` and include the six grays. Without the attribute, `html` gets indigo | `packages/line-schemas/src/hues.ts:16-48`, `:58`; `packages/line-themes/src/accent/indigo.css:3-28`; `packages/line-themes/src/defaults.css:6-31`; PRD §9.4, §9.5 (`docs/PRD.md:1349-1373`) |
| Gray hue | `data-gray="Y"`; the map sets `--line-gray-*` | The six `GRAY_HUES`: neutral, mauve, slate, sage, olive, sand | `hues.ts:67`; `packages/line-themes/src/gray/slate.css:3-28` |
| Gray auto-pair | An element with `data-accent` and no `data-gray` gets the paired gray, nested scopes included | PRD §9.5 table: 31 accents onto 6 grays | `defaults.css:37` onward (one block per accent); PRD `:1375-1390` |
| Colour scheme | `color-scheme` on any element switches the `light-dark()` branch for its subtree, shadow roots included | `light`, `dark`, `light dark` (follow the OS) | PRD §9.8 (`:1485-1487`); v0.8.12 revision note (`:37`) |
| Shadow strength | `--line-shadow-strength` (1%) and `--line-shadow-strength-dark` (25%) are opacity knobs. The shadow tokens are declared in every theming scope | Percentages | `packages/line-tokens/src/shadows.css:13-17`, `:20-23`, `:25` |

- **Fixed by design.** The four semantic roles (`success` green, `warning` amber, `danger` red, `info` blue) live on `:where(html)` and never change with the theme (`packages/line-themes/src/semantics.css:3`; PRD T8, `:1718`; `packages/line-schemas/src/semantic-map.ts:9-14`). A showcase can display them but not change them.
- **Every theming scope gets its own aliases.** The 54 named aliases (`--line-{role}-surface` … `-text`) are declared in `:where(html, [data-accent], [data-gray])`, so they resolve per scope (`packages/line-themes/src/aliases.css:7`; `packages/line-schemas/src/aliases.ts:11-21`).
- **No other attribute exists.** There is no `data-theme` (T4, `docs/PRD.md:1714`) and no mode attribute or class (§9.8, `:1485`).
- **No radius, density or scaling axis exists.** `radii`, `sizing` and `typography` are fixed scales on `:where(html)` (`packages/line-tokens/src/radii.css:8-15`, `sizing.css:8-37`, `typography.css:9-53`). PRD §9 names none. Plan §5.5 lists "a control size scale" as an open spec-level question (`docs/plans/02-plan-essential-forms.md:415`). For comparison, the Radix Themes `Theme` component also exposes `radius`, `scaling` and `panelBackground` (radix-ui/themes `theme.props.tsx`).
- **Foundation tokens can still be overridden on a scope.** A consumer can override a foundation token on an element (ARCHITECTURE §4 Layer 1, `docs/ARCHITECTURE.md:240-248`). Seven Phase 1 components default their radius token to `--line-radius-2`: Alert, AvatarGroup content, ButtonGroup, Button, IconButton, Kbd and Skeleton (for example `packages/line-components/src/button/button.ts:116`). Badge and Chip use `--line-radius-round`. Probe 3.3 set `--line-radius-2: 12px` on a scope, and a token that read it below the scope resolved to `12px` in all three engines. A "radius" control is therefore possible as a consumer override that the site defines. It would not be a `line-themes` axis.
- **The data lists exist in TypeScript, except the auto-pair table.** `ACCENT_HUES`, `GRAY_HUES`, `STEPS`, `ALIASES`, `ROLES`, `SEMANTIC_MAP` and `PER_HUE_CONTRAST` are exported from `@websublime/line-schemas` (`packages/line-schemas/src/index.ts:6-29`). The Storybook theme toolbar already builds its menus from them (`apps/storybook/.storybook/preview.ts:19-60`). The auto-pair table has no TypeScript export. It exists only as hand-authored CSS (`defaults.css`) and as the oracle of a test (`packages/line-themes/__tests__/auto-pair.e2e.ts:29`). PRD §9.7 names the TS sources of truth, and the pair table is not among them (`docs/PRD.md:1437`).
- **Every hue named in an attribute must be imported** (PRD `:1608`). The site imports lime, olive and the four semantic hues today (`apps/site/src/pages/index.astro:4-11`).

### 2.2 Q2: which control drives each axis

Zag facts come from the 1.49.0 type declarations, the O4 baseline (plan §5.2). Requirements are inputs for the component specs; they are not decisions.

| Axis | Control | What the control must support |
|---|---|---|
| Accent (32 values: "indigo (default)" plus 31 hues) | Select | Single selection that the visitor cannot clear. Zag's `deselectable` clears on a click on the selected item (`select.types.d.ts:155-159`), so the spec must keep it off. A scrollable listbox of 32 items with typeahead. Item groups (`line-select-group` is in the `./select` family, `docs/ARCHITECTURE.md:579`; Zag `getItemGroupProps`), so that accents can be grouped by their auto-pair gray (PRD `:1377-1384`). A slotted swatch per item (Law 4). The value under its `name` in `FormData`. `line-change` with `detail.value` (C3, `docs/ARCHITECTURE.md:1578`). A listbox that the panel does not clip; Phase 2 has no Popover, and R4 settles the layer (plan `:266`) |
| Gray (6 hues) | Radio Group | Six radios with a visible label and a slotted swatch, horizontal orientation (`radio-group.types.d.ts:61`), arrow-key movement, a `disabled` state for the whole group (`:41`) while the auto-pair Switch is on, `line-change` (C9: a radio group is compound and value-bearing, `docs/ARCHITECTURE.md:1584`), form value |
| Gray auto-pair (on: no `data-gray`) | Switch | `checked` and `defaultChecked` (`switch.types.d.ts:45-50`), a label, `line-change` with a boolean, and native checkbox form semantics, where the value is present only when the switch is on (`:55-64`) |
| Colour scheme (System, Light, Dark) | Toggle Group, single mode | `multiple: false` with `deselectable: false`. Zag defaults `deselectable` to `true` (`toggle-group.types.d.ts:52-58`), which would let a second press leave no scheme. Three items with roving focus (`:37-47`). Accessible names when the items show only icons. A form value through `ElementInternals`, because Zag's toggle group has no native input (plan `:36-42`). The `line-change` detail shape is open: Zag holds `string[]` even in single mode (`:23`) |
| Shadow strength (0–100 %) | Slider | `min`, `max`, `step: 1` (`slider.types.d.ts:89-99`). `getAriaValueText` for "20 percent" (`:84`). `line-input` while dragging, so the preview updates live, and `line-change` on commit (C3). The keyboard steps (arrows, Page Up/Down, Home/End) |
| Optional, site-defined: radius, or the step of a token explorer | Slider, stepped | Discrete values with markers (`getMarkerGroupProps`, `getMarkerProps`, `slider.types.d.ts:241`, `:320-321`) and value text that names the step, for example "Step 9, solid" (`packages/line-schemas/src/steps.ts:12`; `aliases.ts:7-9`) |

- With this mapping all five controls do real work. The other mappings are open (§6 Q5). The Switch could instead apply the theme to the whole page (§2.3). Accent could instead be a Radio Group of 31 swatches, as the Radix theme panel does, which would leave Select without an axis.
- All five are form-associated (ARCHITECTURE §7, plan `:72-88`). Wrapping the panel in a `<form method="get">` with the names `accent`, `gray`, `auto`, `scheme` and `shadow` turns the URL state (§2.3) into each control's own `FormData` value. That dogfoods the Law 7 contract that plan §2.3 requires of every control. For Toggle Group it depends on the host-driven `setFormValue` that R1 settles.

### 2.3 Q3: applying changes live on a static page

**The mechanism.** A processed client module listens for `line-change` and `line-input` on the panel. It sets `data-accent` and `data-gray` on the preview scope, removes `data-gray` while auto-pair is on, sets `color-scheme` and writes the knob properties. Probe 3.2 measured this in Chromium 156, Firefox 157 and WebKit 27.2:

- Setting `data-accent` from `violet` to `tomato` on the scope recomputed the scope's `--line-accent-8`, `--line-accent-solid` and `--line-gray-1` before the next read, in the same task.
- Removing the attribute fell back to the page's lime.
- `color-scheme: dark` on the scope switched its `light-dark()` values to the dark branch.
- A nested `data-accent="violet"` with no `data-gray` took the slate auto-pair over the page's explicit olive, as PRD §9.5 states (`:1390`).
- R12 already showed that `--line-*` reaches the shadow DOM of an upgraded component on the Astro site (`docs/research/01-research-site-dogfooding.md:89`).

**Scoped preview or whole page.**

| | Preview region (`<section data-accent data-gray>`) | Whole page (attributes on `<html>`) |
|---|---|---|
| Site chrome | Keeps its lime and olive identity (`index.astro:20`; Phase 1 spec AM-109) | Follows the visitor's choice, header and links included |
| Controls | Can sit outside the scope and stay readable whatever the choice | Take every combination the visitor picks, failing ones included (§2.5) |
| Focus ring, gradients, highlight, SVG tokens | Keep the page accent; see below | Follow the choice |
| Shows nesting (PRD §9.4) | Yes: a preview can hold a nested scope | No |

- **Tokens that resolve on `html`.** `line-tokens` declares `--line-focus-ring-color: var(--line-accent-8)` and the composed `--line-focus-ring` on `:where(html)` (`packages/line-tokens/src/focus-ring.css:12-19`). It does the same for `--line-gradient-*`, `--line-highlight-*` and `--line-svg-*` (`gradients.css:12`, `:24-30`; `highlights.css:11-13`; `svg.css:12`, `:36-37`). A custom property's `var()` is substituted where it is declared, and the descendants inherit the result. Probe 3.2 measured this. Inside a violet scope under a lime page, the outline colour was lime `rgb(141, 182, 84)` while `--line-accent-8` was violet, in all three engines. Gradients, highlight and SVG fill also stayed lime.
- Every interactive Phase 1 component draws its ring from `--line-focus-ring` (for example `button.ts:124`). So in a scoped preview a keyboard user sees the page accent's ring around a violet button.
- Shadows avoid this because `shadows.css` declares its colours in every theming scope (`shadows.css:25`; PRD §9.12 `:1682`).
- Probe 3.3 redeclared `--line-focus-ring-color` and `--line-focus-ring` on the scope, with the same composition the MCP Apps bridge uses on `body` (`packages/line-themes/src/hosts/mcp-apps.css:41`, `:65`). The ring then followed the scope's accent, `rgb(170, 153, 236)`, in all three engines.

**What the preview renders.** These Phase 1 components consume each role, so together they cover every role:

| Role | Component and variant | Tokens |
|---|---|---|
| accent solid | Button, IconButton `variant="primary"`; Chip `variant="primary"` pressed | `--line-accent-solid`, `--line-accent-contrast` (`button.ts:133-136`; `icon-button.ts:95`; `chip.ts:120-124`) |
| accent soft | Chip pressed; Button and IconButton `borderless` | `--line-accent-bg`, `-text`, `-border` (`chip.ts:108-118`; `button.ts:138-141`) |
| gray | Button default, Badge and Alert `neutral`, Separator, Skeleton, Kbd | `--line-gray-bg`, `-text` (`button.ts:117-118`; `badge.ts:69-70`; `alert.ts:85-86`) |
| semantic (fixed) | Badge and Alert `info`, `success`, `warning`, `danger` | `--line-{role}-bg`, `-text` (`badge.ts:86-106`; `alert.ts:101-124`) |

- The landing cards already combine these (`apps/site/src/components/Showcase.astro:20-39`) and pass axe in lime and olive. The preview can reuse them or hold a purpose-built set.
- The Phase 2 form controls can also sit inside the preview as a sample form. Then the controls show their own theming, at the cost of more dependencies (§6 Q1).

**Shareable state.**

| Option | Shape | Notes |
|---|---|---|
| Query string | `/theming/?accent=violet&gray=mauve&scheme=dark&shadow=12` | The native `GET` serialisation of the panel form (§2.2). `history.replaceState` keeps it current without navigation. Cloudflare Pages serves the static file for any query [INFERENCE: static hosting ignores the query; not probed] |
| Fragment | `#accent=violet&…` | Never reaches the server; not the form's native serialisation |

- **Validation.** An unknown hue must not reach the attribute, because an unimported or unknown hue leaves the role variables undefined (PRD `:1608`). The site can check values against `ACCENT_HUES` and `GRAY_HUES`. Whether the `line-schemas` import also pulls Zod into the client chunk through its top-level `z.enum` calls (`hues.ts:52`) is unmeasured [INFERENCE]; plain `includes()` checks avoid the schemas.
- **First paint.** Processed module scripts are deferred, so a shared link first paints the default theme and then switches. An `is:inline` script inside the preview element can apply the query before the rest of the region parses. Astro leaves such a script "as-is in the final output HTML", and it can import nothing (Astro directives reference), so it needs its own copy of the hue lists.

### 2.4 Q4: how the site loads components, and the stream S dependency

**Loading.** Phase 1 settled the path, and it carries over unchanged:

- Each section has a processed `<script>import '@websublime/line-components/<c>';</script>`, with no Astro or Lit integration (Phase 1 spec SD72, `docs/specs/01-spec-core-primitives.md:2446`; `apps/site/src/components/SiteHeader.astro:22-28`).
- A Playwright guard asserts that every `line-*` element is `:defined` in three engines, against the silent `sideEffects` drop (R12 §2.2; `apps/site/__tests__/landing.e2e.ts:42-57`). It runs on the fourth `webServer`, port 4322 (`landing.e2e.ts:15`).
- The showcase adds the subpaths of the five controls. Select's family is `./select` (`docs/ARCHITECTURE.md:579`). The subpaths of Radio Group, Toggle Group, Switch and Slider are R8's to settle (plan `:270`).
- Before upgrade, the light DOM of a Select shows its 32 item labels as plain text. That makes a `:not(:defined)` rule necessary for the listbox content. The landing page keeps light-DOM text visible for Law 8 (`apps/site/src/styles/site.css:3-20`).

**CSS weight.** The worktree build (§3.1) emits one stylesheet of 108,302 B raw and 15,790 B gzipped for tokens, six hues, the themes barrel and the site styles. A browser of all 31 accents needs every palette:

| Delivery | Raw / gzip |
|---|---|
| `line-colors` barrel (`dist/index.css`) | 123,326 / 23,896 B |
| One hue file (R12 §3.2, indigo) | 3,975 / 952 B |
| `line-themes` barrel, already on the page | 73,296 / 5,890 B |

- On its own route, the barrel loads only on that page. R12 §2.5 records that Astro merges CSS shared by pages into one chunk [INFERENCE: per-page splitting for the showcase route not built].
- Loading per-hue files on demand (a dynamic CSS import on selection) is the alternative. It costs a fetch before the new hue paints [INFERENCE: not probed].

**Dependency.**

- Plan §6: "S Theming showcase (O5 (b)) ◄── Select, Slider, Switch, Radio Group, Toggle Group" (`docs/plans/02-plan-essential-forms.md:456`).
- The five controls are in the wave "C the other 12", after P (O4), F, the Input/Field/Checkbox set and G (`:452`). Select also waits on R4, and every control waits on R1.
- `deploy-site.yml` deploys on every push to `main` that touches `apps/site/**` or `packages/**` (`.github/workflows/deploy-site.yml:5`). A PR merged early is live at once.

| Work | Needs the controls? |
|---|---|
| Route, nav link, preview region with Phase 1 components, CSS loading, focus-ring recomposition | No |
| URL parse and serialise, hue validation, `is:inline` first-paint script | No |
| Contrast table (§2.5), e2e skeleton on port 4322 | No |
| The panel, the event wiring, the `FormData` round trip, the guard's expected tags | Yes |

- Phase 1 ran S1 as one PR that opened once every component it used was `done` (Phase 1 spec §6.S.1, `:1943-1962`; AM-109). The retrospective credits that page with finding C30 and C31 before the release (`docs/retrospective/01-phase-01-retro.md:134-135`).

### 2.5 Q5: accessibility, the laws, and the exit evidence

**Contrast.** Probe 3.4 computed WCAG 2.1 ratios from the `@radix-ui/colors` 3.0.0 base scales, which `validate-contrast` also reads. It used the shared `contrastRatio` (`packages/line-utils/src/contrast.ts:77`) over all 31 accents × 6 grays × 2 modes = 372 combinations. P3 values are not computed, as in the validator.

| Pair (where it is painted) | Bar | Below the bar | Minimum |
|---|---|---|---|
| `--line-accent-contrast` on `--line-accent-solid` (Button, IconButton primary; Chip primary pressed; site `.cta--primary`, `site.css:189-192`) | 4.5:1 (label text: Button is `1rem`, weight 500, `button.ts:122-123`) | 34 of 62 hue × mode pairs | 2.97 (orange) |
| `--line-accent-text-low` on `--line-gray-1` (site links, `site.css:66`) | 4.5:1 | 20 of 372 (amber, orange, teal, yellow; light) | 4.40 |
| `--line-accent-text-low` on `--line-gray-2` (text on a card surface) | 4.5:1 | 36 of 372 (amber, green, jade, orange, teal, yellow; light) | 4.26 |
| `--line-accent-text` on `--line-gray-2`; `--line-gray-text-low` on `--line-gray-2`; `--line-gray-text` on `--line-gray-bg` | 4.5:1 | 0 | 10.38; 5.62; 13.66 |
| `--line-success-text-low`, `--line-warning-text-low` on `--line-gray-2` | 4.5:1 | 186 of 372 each (every light combination) | 4.46; 4.36 |
| `--line-accent-8` ring on `--line-gray-1` | 3:1 (SC 1.4.11) | 196 of 372 | 1.86 |

- **Accents.** Only 11 hues pass the solid pair in both modes: amber, cyan, indigo, iris, lime, mint, plum, purple, sky, violet and yellow. The six grays used as accents fail only in light mode.
- **What the gate checks.** `validate-contrast` checks only the solid pair, at 3:1, with orange allowlisted at 2.97 (`scripts/validate-contrast.mjs:11-32`, `:82-86`; Phase 00 spec AM-014). PRD §5.2.1 still describes a 4.5:1 check over "relevant role pairs" (`docs/PRD.md:555`); see §5.
- **What axe would flag.** The landing page passes axe because lime and olive sit in the passing set (retrospective S9.3.2, `:51`). With a blue accent the primary Button label measures 3.26:1, which the axe `color-contrast` rule reports for normal-size text [INFERENCE: axe applies 4.5:1 to text below the large-text size; the showcase build not run].
- **Unaffected pairs.** The semantic Badge and Alert pairs (`-text` on `-bg`) and every gray text pair hold in all 372 combinations. The semantic `-text-low` failures do not depend on the visitor's choice. They matter only if the preview paints semantic `-text-low` on a surface.
- **The focus ring.** The ring pair is below 3:1 in more than half the combinations. WCAG 2.1 SC 1.4.11 asks 3:1 for the visual information that identifies a component's state, and its Understanding document covers focus indicators; axe does not test it. Plan §5.7 already tracks the step-7-versus-step-8 ring gap (`docs/plans/02-plan-essential-forms.md:443`).
- A showcase that offers every combination therefore shows failing ones by construction. The options are in §2.6 and §6 Q4.

**Laws.**

| Law or principle | Constraint on the showcase |
|---|---|
| Principle 1, Law 10 (`docs/MANIFESTO.md:19`, `:57`) | The theme is an accelerator. The showcase can print the exact imports a combination needs (tokens, the chosen hues, themes; PRD `:1595-1608`) as the copyable snippet the Hero already has |
| Principle 4, Law 2 (`:25`, `:41`) | It changes `--line-*` properties and the exempt `data-accent` and `data-gray`. Mode stays `color-scheme` (PRD `:1485`), with no new site attribute |
| Principle 5 (`:27`); SD72 | Plain processed scripts, no framework integration |
| Law 3 (`:43`) | The contrast findings above |
| Law 4 (`:45`) | Swatches and icons enter the controls through slots |
| Law 7 (`:51`) | Form state through native `FormData` (§2.2) |
| Laws 8, 9 (`:53`, `:55`) | Without JavaScript, or if a control's machine fails, the preview still renders in the default theme and the page throws nothing. The controls cannot work before upgrade; R7 owns the progressive-enhancement question |
| Out of Scope, inline style (`:67`) | The site sets `color-scheme` and the knobs as a consumer. PRD §9.8 itself names `style.colorScheme`. No component API depends on inline style |

**Exit evidence.** PRD `:985` needs "built with Phase 2 line://ui components" and "live at `line-ui.websublime.com`". Following the Phase 1 record (retrospective S9.3.2, `:51`), the evidence would be:

- **Registration.** An `apps/site/__tests__/theming.e2e.ts` on the built site asserts that the five controls' tags and every other `line-*` tag are present and `:defined`, in three engines (the SD72 guard).
- **Driven by the controls.** The test operates each control by keyboard and asserts the effect on the scope: the attribute, the resolved role token, `color-scheme` and the knob. Presence alone does not show that the page is built with the controls.
- **Round trip.** Loading a shared URL sets the controls and the preview. A `FormData` read matches the URL.
- **Accessibility.** Axe passes under the contrast policy chosen in §6 Q4, in light and dark.
- **Live.** A green `deploy-site.yml` run on the merge commit, and the live URL serving the route with the controls.

### 2.6 Q6: scope options

| Option | Content | Cost |
|---|---|---|
| (a) Minimal theme browser | Accent (Select), gray (Radio Group), auto-pair (Switch), scheme (Toggle Group), shadow strength (Slider); a preview of Phase 1 components; URL state; a copyable snippet of attributes and imports | One route, one client module, the all-hue CSS on that route, one e2e file. Depends only on the five controls |
| (b) (a) plus a role inspector | Adds a 12-step strip per role with alias names, a stepped Slider for a step explorer, and a contrast readout per pair (AA, AA large, below) from a build-time table that uses `line-utils/contrast` and `PER_HUE_CONTRAST`; optionally a sample Phase 2 form in the preview | More UI and a generated table. Turns the §2.5 failures into stated facts rather than silent ones. A sample form adds Input, Field and Checkbox, which land earlier (plan `:452`) |
| (c) Full token explorer | Adds site-defined axes through scope overrides: radius (`--line-radius-*`), spacing, type scale; exports a CSS snippet | Invents radius and scaling axes that no package or PRD section defines (§2.1); the page would advertise behaviour the library does not ship. Largest build and test cost |

Cross-cutting choices: route `/theming/` or a section of `/` (PRD §5.3 lists the showcase as its own section, `:584`; a section on `/` changes the `EXPECTED_TAGS` equality in `landing.e2e.ts:21-40`), scoped preview or whole page (§2.3), and CSS delivery (§2.4).

**Recommendation (for Miguel to decide):**

- Option (a) plus the contrast readout of (b), on a `/theming/` route.
- A scoped preview, with the focus-ring recomposition in site CSS.
- Query-string state from the panel form.
- One S row that opens when the five controls are `done`, as S1 did.

The readout keeps the showcase honest about §2.5 without narrowing the 31 hues.

## 3. Probes

All commands ran on 2026-11-26 in the worktree `line-ui-z15` (branch `docs/01-z15-r10-theming-showcase`, HEAD `e0e0424`): Bun 1.4.3, Astro 7.3.8 (locked; npm `latest` is 7.4.13), Playwright 1.64.0, `@radix-ui/colors` 3.0.0. Throwaway scripts lived at the worktree root and were deleted afterwards; `git status` was clean.

### 3.1 Build and output

| Command | Exit | Observation |
|---|---|---|
| `bun --filter './packages/*' build` | 0 | 24.0 s |
| `bun --filter '@websublime/line-site' build` | 0 | 1 page in 1.70 s |
| `gzip -9 -n -c <file> \| wc -c` over `apps/site/dist` | 0 | `_astro/index.*.css` 108,302 / 15,790 B; `index.html` 13,962 / 3,616 B; ten section scripts and shared chunks, the largest `stack.*.js` 21,827 / 7,827 B and `if-defined.*.js` 17,231 / 6,293 B |
| Same over `packages/line-colors/dist/index.css`, `line-themes/dist/index.css`, `line-themes/dist/accent/violet.css`, `line-themes/dist/defaults.css` | 0 | 123,326 / 23,896; 73,296 / 5,890; 1,017 / 214; 31,008 / 1,215 B |

### 3.2 Nested scope (`bun .r10-probe.mjs`, exit 0)

`page.setContent` with the built tokens, the `line-colors` barrel and the `line-themes` barrel; `<html data-accent="lime" data-gray="olive">`, `color-scheme: light dark`; a `<section data-accent="violet">`; a second one with `color-scheme: dark`. Elements read `outline: var(--line-focus-ring)` and `color: var(--line-accent-8)`. Light media.

| Check | Chromium 156.0.8078.4 | Firefox 157.0 | WebKit 27.2 |
|---|---|---|---|
| Scope `--line-accent-8` | violet `light-dark(#aa99ec, #6958ad)` | same | P3 violet |
| Scope `--line-focus-ring-color`, outline colour | lime `rgb(141, 182, 84)` | same | P3 lime |
| Scope `--line-gradient-1`, `--line-highlight-bg`, `--line-svg-fill` | lime values | same | same |
| Scope `--line-gray-1` | slate `#fcfcfd` (auto-pair over page olive) | same | P3 slate |
| Dark scope background | `rgb(17, 17, 19)` (slate-1 dark) | same | P3 |
| After `setAttribute('data-accent', 'tomato')`, same task | tomato `--line-accent-8`, `--line-accent-solid` `#e54d2e` | same | P3 tomato |
| After `removeAttribute('data-accent')` | lime again | same | same |

### 3.3 Knobs and the ring fix (`bun .r10-knobs.mjs`, exit 0)

| Check | Chromium | Firefox | WebKit |
|---|---|---|---|
| `border-radius: var(--line-radius-2)` (through an intermediate token), page / scope with `--line-radius-2: 12px` | `5px` / `12px` | same | same |
| `box-shadow: var(--line-shadow-2)` first-layer alpha, page / scope with `--line-shadow-strength: 20%` | 0.04 / 0.23 | same | same |
| Outline in a violet scope, plain / with the ring redeclared on the scope | lime / `rgb(170, 153, 236)` | same | P3 lime / P3 violet |

### 3.4 Contrast matrix (`bun .r10-contrast.mjs`, exit 0)

The script read the base scales by source name (`scripts/radix-sources.mjs`), as `validate-contrast` does, and applied `contrastRatio` to each pair of §2.5 over `HUES` × `GRAY_HUES` × {light, dark}. Solid pairs: 62, of which 34 were below 4.5 and 2 below 3. The hues that met 4.5 in both modes were amber, cyan, indigo, iris, lime, mint, plum, purple, sky, violet and yellow. Below 4.5: blue 3.26, bronze 3.59, brown 3.53, crimson 3.85, gold 3.65, grass 3.03, green 3.16, jade 3.15, orange 2.97, pink 4.12, red 3.91, ruby 3.89, teal 3.07 and tomato 3.87 in both modes; mauve 3.30, neutral 3.32, olive 3.34, sage 3.36, sand 3.34 and slate 3.30 in light. The counts match AM-014's "34 of the 62 … worst case 2.97:1".

### 3.5 Zag props

`curl -sL https://unpkg.com/@zag-js/<m>@1.49.0/dist/<m>.types.d.ts` for `toggle-group`, `slider`, `select`, `radio-group`, `switch`. npm `latest` of each was 1.49.0. The lines cited in §2.2 come from those files.

## 4. Fit with line://ui

- **Plan §2.8, §4.6, O5 (b).** Every option in §2.6 uses all five controls and keeps the showcase an exit criterion.
- **PRD §5.3.** "Interactive theme browser" is met by option (a). PRD §5.3 says "Astro + MDX" (`:571`); the showcase needs no MDX, as R12 found for the landing page.
- **PRD §9.4–§9.8.** The axes are exactly `data-accent`, `data-gray` with auto-pair, and `color-scheme`. A scoped preview demonstrates the "theming nests naturally" claim (`:1363-1368`).
- **PRD §5.2.1 and SD98.** The `(accent, gray, mode)` coverage contract is met in Storybook by the Roles story baselines: 62 default-pair and 310 off-pair (Phase 1 spec SD98, `:2472`). The showcase is a second surface for that space and does not replace it.
- **ARCHITECTURE §4.** Scope overrides of foundation and component tokens are documented consumer usage (`docs/ARCHITECTURE.md:240-263`).
- **ARCHITECTURE §16.2.** On mobile, Select shows its custom listbox, not the OS picker (`:1458-1460`). With 32 accents this is the documented trade-off.
- **Phase 1 precedent.** The Phase 1 landing page left out the Radix-style theme switcher only because plan O3 kept the showcase out of Phase 1 (`docs/plans/01-plan-core-primitives.md:419-425`; Phase 1 spec AM-109).

## 5. Contradictions and gaps

No finding contradicts plan §2.8, §4.6 or O5. Three gaps touch the showcase. None is R10's to fix; each is a candidate for the plan §5.7 table or a separate row.

1. **Contrast bar.** PRD §5.2.1 describes build-time validation at "4.5:1 minimum contrast for the 31 hues x relevant role pairs (solid step 9 vs contrast text, background vs high-contrast text, etc.)" (`docs/PRD.md:555`). The Phase 00 spec, through AM-014, and `scripts/validate-contrast.mjs` check one pair at 3:1 with an orange allowlist (`docs/specs/00-spec-design-system.md:489`, `:992`; `validate-contrast.mjs:18-32`). This predates Phase 2. PROCESS §1 makes the lower document the bug. Probe 3.4 reproduces the AM-014 numbers. Meanwhile the primary Button label is normal-size text, for which WCAG 2.1 SC 1.4.3 asks 4.5:1, and MANIFESTO Law 3 makes AA "non-negotiable for every shipped component" (`docs/MANIFESTO.md:43`).
2. **Html-scoped accent tokens.** The focus ring, gradient, highlight and SVG tokens resolve on `html` and do not follow a nested `data-accent` scope (probe 3.2). PRD §9.12 states the `:where(html)` scope with only the `shadows.css` exception (`:1682`), so the behaviour is as specified. Still, it qualifies PRD §9.4's "multiple colour contexts can coexist on the same page" (`:1368`) for those tokens.
3. **No TypeScript auto-pair table.** PRD §9.5 defines the pair table, but `line-schemas` exports no pair map. Showing "auto (slate)" in the UI needs a copy in the site or a new `line-schemas` export, which would be a published change.

## 6. Open questions for the post-research revision and the Phase 2 spec

1. **Scope.** Option (a), (a) with the (b) contrast readout (recommended), full (b) with a sample Phase 2 form, or (c) (§2.6)?
2. **Placement.** A `/theming/` route linked from the header (recommended), or a section of the landing page?
3. **Theming target.** A scoped preview (recommended) or the whole page? If scoped, is the focus ring recomposed in site CSS (probe 3.3), or do `focus-ring.css`, `gradients.css`, `highlights.css` and `svg.css` move to theming scopes as `shadows.css` did? The second is a published `line-tokens` change and its own row (gap 2).
4. **Contrast policy.** Which policy applies to the 34 failing solid pairs?
   - Offer all 31 accents with a computed readout, and gate axe on the default pairs of the passing hues plus a documented exclusion for the rest.
   - Narrow the accent list to the 11 passing hues; this narrows the PRD scope and needs Miguel.
   - Settle gap 1 first as a library decision (the PRD §5.2.1 bar against AM-014, and the primary label size).
5. **Control mapping.** Is §2.2 the mapping? In particular: does the Switch drive auto-pair or the whole-page toggle? Does the Slider drive the shadow strength (a real knob), a radius (site-defined), or a step explorer? Does accent use Select (32 options, grouped) or a Radio Group of swatches?
6. **Auto-pair source.** A copy of the PRD §9.5 table in the site, or a new `AUTO_PAIR` export in `line-schemas` (gap 3)?
7. **CSS delivery.** The `line-colors` barrel on the showcase route (+23,896 B gzipped), or per-hue files loaded on selection?
8. **Shareable state.** A query string from the panel's `GET` form (recommended) or a fragment? Is a shared link applied before first paint by an `is:inline` script with its own hue list, or is the default-theme flash accepted?
9. **Controls inside or outside the themed scope.** Inside, they show their own theming; outside, they stay readable under failing combinations.
10. **Sequencing.** One S row that opens when Select, Slider, Switch, Radio Group and Toggle Group are `done`, as S1 did (recommended)? Or rows that wire each control in as it lands, live on every merge (`deploy-site.yml:5`)?
11. **Requirements for the component specs.** Which of these go into the specs: Select item groups and slotted item content; Radio Group disabled as a whole; Toggle Group `deselectable: false` and its `line-change` detail shape (`string` or `string[]`); Slider `line-input` during drag and a value-text hook?
12. **Exit evidence.** Which combinations does the axe check of the showcase e2e cover? Does the showcase also get visual baselines, or does the SD98 Roles coverage stand?

## 7. Sources

All retrieved 2026-11-26.

- Zag 1.49.0 type declarations: https://unpkg.com/@zag-js/select@1.49.0/dist/select.types.d.ts, https://unpkg.com/@zag-js/slider@1.49.0/dist/slider.types.d.ts, https://unpkg.com/@zag-js/switch@1.49.0/dist/switch.types.d.ts, https://unpkg.com/@zag-js/radio-group@1.49.0/dist/radio-group.types.d.ts, https://unpkg.com/@zag-js/toggle-group@1.49.0/dist/toggle-group.types.d.ts
- npm registry `latest` (`curl https://registry.npmjs.org/<pkg>/latest`): `@zag-js/select`, `slider`, `switch`, `radio-group`, `toggle-group` (1.49.0); `astro` (7.4.13)
- Radix Themes `Theme` props (appearance, accentColor, grayColor, panelBackground, radius, scaling): https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/theme.props.tsx
- Radix Themes, Color: https://www.radix-ui.com/themes/docs/theme/color
- Astro directives reference, `is:inline`: https://docs.astro.build/en/reference/directives-reference/#isinline
- Astro, Scripts and event handling: https://docs.astro.build/en/guides/client-side-scripts/
- WCAG 2.1 Understanding SC 1.4.3 Contrast (Minimum): https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- WCAG 2.1 Understanding SC 1.4.11 Non-text Contrast: https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html
- axe-core rule `color-contrast`: https://dequeuniversity.com/rules/axe/4.10/color-contrast
- CSS Custom Properties Level 1, substitution at computed-value time: https://www.w3.org/TR/css-variables-1/#substitute-a-var
