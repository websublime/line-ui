# Research: DateInput (R5)

**Row:** `01-Z20` (Phase 2 plan §5.1 R5, §5.3)
**Date:** 2026-11-26 (all upstream sources retrieved and all probes run the same day)
**Repo sources:** `docs/plans/02-plan-essential-forms.md` §1, §2.1, §2.4, §2.6, §3, §5.1 R1, R3, R5, R6, R8, §5.3, §5.5, §5.7, §8; `docs/PRD.md` (v0.8.36) principle 3, §1.7, §4.2, §4.4, §7.4, §7.6; `docs/ARCHITECTURE.md` (v0.8.28) §7, §8, §12, §13.3, §13.4, §14, §15.1, §16.2, §16.3, §17.2, §17.3; `docs/MANIFESTO.md` principles 2, 3, Laws 1, 3, 5, 7–9, Out of Scope; `packages/line-core/src/machine/line-machine-controller.ts`; `scripts/report-size.mjs`; `docs/research/01-research-zag-machines.md`, `01-research-accessibility.md`. Repo locators resolve at `origin/main` `9c9b1f4`. Corrected 2026-11-27 (row 01-Z29): the `docs/PRD.md` locators here resolve at PRD v0.8.36 (`9c9b1f4`); PRD v0.8.37 and v0.8.38 each add one revision-note line, so at v0.8.38 every cited line after the revision notes sits two lines further down.
**Toolchain baseline:** the row 01-Z14 baseline. Bun 1.4.5 (`/tmp/bun145`, because the workstation `bun` is 1.4.3), `HOME=/tmp/emptyhome bun install --frozen-lockfile`, Playwright 1.65.1 (Chromium 159.0.8154.6, Firefox 159.0, WebKit 27.2 build 2388), Zag 1.49.0, Lit 3.3.3, esbuild 0.28.2 (the repo's, the bundler of `scripts/report-size.mjs`), axe-core 4.14.1, on macOS 27.2.1 arm64. Node was not needed (no Astro build). Linux WebKit ran in `mcr.microsoft.com/playwright:v1.65.1-noble` (§3.1).
**Status:** Evidence. Research carries no rules (`docs/PROCESS.md` §1). Recommendations are marked "(recommended)"; every decision is an open question in §6.

> **TL;DR**
>
> - `@zag-js/date-input` 1.49.0 is a two-state machine (`idle`, `focused`) with locale-aware segments from `Intl` through `@internationalized/date`. Each editable segment is a `<span contenteditable role="spinbutton" tabindex="0">`, plus a `role="group"` and a `type="hidden"` input. It matches neither ARCHITECTURE §15.1 ("`<input>` (per segment)", `docs/ARCHITECTURE.md:1332`) nor §16.2 ("`<input type="text">` with segment masking", `:1428`), which also disagree with each other.
> - Inside a shadow root, through a verbatim copy of `LineMachineController` with `getRootNode`, the machine ran with the same results in Chromium, Firefox, macOS WebKit and Linux WebKit. The results cover typing with auto-advance, arrows, Page Up/Down, Home/End, Backspace, label and pointer focus, RTL arrow order, 13 locale and granularity cases, zero axe violations, and the same `ariaSnapshot`. Linux WebKit differed from macOS WebKit in three places: where Tab reaches `<button>`s, pixel positions, and, on option (b) (the machine on native `<input>` segments, probe 3.6), focus ending on the month segment after typing instead of the year (cause not found). The CI runner is x86_64 and has not run these probes.
> - The pieces that touch the form contract all need the host. The hidden input has no form owner in a shadow root. Its value is the locale display string (`12/25/2026`), not an ISO date. Its `required` is a no-op, because hidden inputs are barred from constraint validation. The machine fires no change for `defaultValue`. Clearing one segment leaves the old value committed. `min`/`max` first commit an out-of-range date, then silently rewrite it on blur. The segments carry no `aria-required`.
> - Screen-reader and IME gaps: the live announcement says "Empty" in English in every locale, and no translation hook reaches it. Only ASCII digits are accepted, so full-width digits from a Japanese IME and Arabic-Indic digits are dropped in all three engines. IME composition text stays in the segment's DOM (Chromium CDP composition; Firefox `insertText`). Zag has no iOS VoiceOver workaround; React Aria switches segments to `role="textbox"` on iOS. That iOS point is not verified here. The machine also appends one `role="alert"` region per instance to `document.body`.
> - Weight, by the `report-size` bundling method: the machine and its Zag-only dependencies add 11,661 B gzipped over a named-import `core` + `vanilla` baseline (`{ createMachine }` + `{ VanillaMachine }`, 5,796 B), and `@internationalized/date` adds 4,905 B more. That is 16,566 B in all, about 3.3 times the < 5 KB soft target. R8 measures 16,507 B over the report's own `export *` row (B0, 7,493 B); the 59 B difference comes from the baseline. The whole `@internationalized/date` package is 11,149 B gzipped, and non-Gregorian calendars add 3,876 B.
> - Granularity `day`, `minute` and `second` work. Time-only works on 1.49.0 only through a custom `formatter`, and the probe committed `2026-11-26T14:30:00` with today's date. `maxGranularity` exists only on Zag 2.0.0-next. A2UI DateTimeInput (`enableDate`, `enableTime`, both default `false`, ISO 8601 `value`) is unchanged between v0.9.1 and v1.0. Its implementation guide says "Render using native date and time picker controls", against ARCHITECTURE §16.2.
> - The Phase 4 composition `<line-date-input slot="trigger">` (ARCHITECTURE §13.4) does not match Zag's date picker. There, `trigger` is a `<button aria-haspopup="grid">`, the typed field is a separate `input` part, and the popup anchors to `control`. React Aria's date picker likewise pairs a field with a separate trigger button.

---

## 1. Question

Plan §5.1 R5: "`@zag-js/date-input` vs a custom machine; its segments (`span` with `contentEditable` and `role: spinbutton`) vs ARCHITECTURE §15.1 "`<input>` (per segment)" and §16.2 "`<input type="text">` with segment masking"; `@internationalized/date` weight; locale and granularity; the A2UI DateTimeInput `enableTime`; the Phase 4 DatePicker composition (`slot="trigger"`)" (`docs/plans/02-plan-essential-forms.md:267`). Plan §5.3 requires three-engine probes for every agent-facing behaviour claim, and real browsers for form behaviour (`:291-296`).

| # | Sub-question |
|---|---|
| Q1 | What is `@zag-js/date-input` at 1.49.0: API, anatomy, dependencies, maturity? |
| Q2 | What DOM and accessibility semantics does it produce, how does the keyboard behave in three engines, and how do they compare with the ARCHITECTURE §15.1 and §16.2 shapes? |
| Q3 | How does it fit a form-associated host in a shadow root (plan §2.3, MANIFESTO Law 7)? |
| Q4 | What do the machine and `@internationalized/date` weigh against the < 5 KB soft target? |
| Q5 | Locale and granularity: segment order, labels, calendars, RTL, digits and IME, time segments, and the localisation of its strings. |
| Q6 | What does A2UI DateTimeInput (`enableDate`, `enableTime`) ask for at v0.9.1 and v1.0, and what can `<line-date-input>` render for it? |
| Q7 | Does the Phase 4 composition `<line-date-picker><line-date-input slot="trigger">` fit Zag's date picker? |
| Q8 | Which tier options exist (pre-built, custom, hybrid, masked), and what does each cost? |

## 2. Findings

### 2.1 Q1: the package

| Fact | Evidence |
|---|---|
| `latest` is 1.49.0, published 2026-11-22. `next` is 2.0.0-next.4. The first release was 1.35.3 on 2026-03-02, "Initial release of date input machine" (zag#2671) | `npm view @zag-js/date-input time dist-tags`; upstream `packages/machines/date-input/CHANGELOG.md` (main) |
| Dependencies are pinned to 1.49.0: `core`, `types`, `utils`, `anatomy`, `dom-query`, `date-utils` and `live-region`. The peer is `@internationalized/date >=3.0.0`, whose `latest` is 3.12.4 (2026-09-01, Apache-2.0, depends on `@swc/helpers`). The license is MIT and `sideEffects` is `false` | `npm view @zag-js/date-input@1.49.0 dependencies peerDependencies`; tarball `package.json:22` |
| Two states, `idle` and `focused`. The context holds `value: DateValue[]`, `placeholderValue`, per-group `displayValues` (`IncompleteDate`), `activeIndex`, `activeSegmentIndex` and `enteredKeys` | tarball `dist/date-input.machine.mjs:56-58`, `:68-123`; `dist/date-input.types.d.ts:177-204` |
| Props cover `locale` (default `en-US`), `timeZone` (default `UTC`), `granularity` (default `day`), `hourCycle`, `selectionMode` (`single`/`range`), `min`, `max`, `isDateUnavailable`, `createCalendar`, `translations` (`placeholder`, `segmentLabel`), `formatter`, `name`, `form`, `required`, `disabled`, `readOnly`, `invalid`, `dir` and `getRootNode` | `date-input.types.d.ts:39-175`; `date-input.props.mjs:4-37`; `date-input.machine.mjs:18-21` |
| Anatomy: `root`, `label`, `control`, `segmentGroup`, `segment`, `hiddenInput` | `date-input.anatomy.mjs:3` |
| The API returns `value`, `valueAsString`, `valueAsDate`, `setValue`, `clearValue`, `focus`, `getSegments` and the prop getters | `date-input.types.d.ts:300-360` |
| 17 credited CHANGELOG entries after the 1.35.3 initial release, among them #3071 (min/max reset during typing), #3116 and #3117 (time-only commits), "Allow typing dates using the locale's native numerals" (1.42.0, commit `ac7a81a`), #3526 (focus jumping back after Tab out, 1.47.0) and #3600 (segment labels and announcements follow `locale`, 1.49.0) | GitHub `chakra-ui/zag` issues and PRs; CHANGELOG `## 1.49.0`, `## 1.47.0`, `## 1.42.0` |
| `maxGranularity`, which allows a time-only input without a custom formatter, landed on the v2 line (zag#3433, merged 2026-11-01). It is in 2.0.0-next.4 (`date-input.types.d.ts:160`) and absent from 1.49.0 | `npm pack @zag-js/date-input@2.0.0-next.4`; grep of the 1.49.0 tarball: 0 hits |

### 2.2 Q2: semantics, keyboard, and the ARCHITECTURE shapes

**What 1.49.0 renders.** These come from the connect function in the 1.49.0 tarball, and probe 3.3 reproduced them in every engine.

- Each editable segment gets `role: "spinbutton"`, `tabIndex: 0` (none when disabled), `contentEditable` while editable, `inputMode: "numeric"` (not for `dayPeriod`/`era`), `enterKeyHint: "next"`, `aria-label` from `getSegmentLabel`, `aria-valuenow` (absent while a placeholder shows), `aria-valuetext` (the placeholder or the text), `aria-valuemin`, `aria-valuemax`, `aria-invalid`, `aria-readonly`, `aria-disabled` and `caret-color: transparent` (`dist/date-input.connect.mjs:136-162`).
- Literals get `aria-hidden="true"` (`:128-135`). The segment group is `role="group"` with `aria-labelledby` pointing at the label (`:109-124`). The label's `for` points at the hidden input (`:88`). A hidden input is not labelable, so the label names the group only through `aria-labelledby`. A label click focuses the first segment (`:92-95`).
- No segment carries `aria-required` or `aria-describedby`. `required` reaches only the hidden input (`:309`).
- The day segment's `aria-valuemax` is the calendar's maximum (31) whatever the month (`utils/incomplete-date.mjs:226-230`). Probe 3.3 typed 11/31/2026 and got `2026-11-30`, with 30 displayed, in every engine.

**What the engines expose (probe 3.3).**

| | Chromium 159 | Firefox 159 | WebKit 27.2 macOS | WebKit 27.2 Linux |
|---|---|---|---|---|
| Playwright `ariaSnapshot` | `group "Start date"` > `spinbutton "Month": mm`, `"Day": dd`, `"Year": yyyy` | same | same | same |
| Engine AX tree | CDP `Accessibility.getFullAXTree`: `group "Start date"`; each segment `spinbutton`, name `Month`/`Day`/`Year`, `editable: richtext`, `valuemin`/`valuemax` set, `valuetext: ""`, value `0` while a placeholder shows and the number once set; `required: false` | not observable | not observable | not observable |
| `Element.prototype.computedRole` | absent | absent | absent | absent |
| axe-core 4.14.1, WCAG 2.0/2.1 A and AA, four fields (empty, minute granularity, disabled, he-IL RTL) | 0 violations, 17 passes | 0 / 17 | 0 / 17 | 0 / 17 |

- `ariaSnapshot` is Playwright's own computation, not the engine's tree (`docs/research/01-research-accessibility.md:333-336`). Playwright 1.65 has no `page.accessibility`, so the Firefox and WebKit trees could not be read. What a screen reader announces was not tested in any engine.
- Chromium reports `valuetext: ""` for the span segments although `aria-valuetext` is set. On the native-input variant of probe 3.6 it reports `valuetext: "mm"`. Whether a screen reader then reads "0" for an empty span segment is unverified [INFERENCE].
- **iOS VoiceOver.** React Aria's segment hook, from which Zag's design follows (contenteditable `spinbutton` segments), switches to `role: "textbox"` on iOS: "spinbuttons cannot be focused with VoiceOver on iOS". It also prepends the field label to each segment name, "because VoiceOver on iOS does not announce groups" (`react-aria` 3.53.1 `dist/private/datepicker/useDateSegment.mjs:303-310`, `:319-324`). Zag 1.49.0 has no platform branch. Not verified here: no iOS device or VoiceOver automation was available.
- **Announcements.** The machine creates a `@zag-js/live-region` with `level: "assertive"` (`date-input.machine.mjs:240-247`). It is a `<span role="alert" aria-live="assertive" aria-atomic="true">` appended to `document.body` (`live-region` `dist/index.mjs:27`, `:41-48`). Each adjust, typed digit, Home/End or Backspace announces `"<segment label>, <text>"`, or `"<segment label>, Empty"` for a placeholder (`date-input.machine.mjs:415-427`, `"Empty"` at `:425`). Probe 3.3 read "Day, Empty" (en-US), and "Tag, 27" then "Tag, Empty" (de-DE), in every engine. Three instances made three regions in `body`, and removing them removed the regions.

**Keyboard (probe 3.3), identical in Chromium, Firefox, macOS WebKit and Linux WebKit.**

| Input | Result |
|---|---|
| Tab into the field | Focus on the first segment in locale order (month for en-US, day for en-GB/de-DE, year for ja-JP) |
| Tab / Shift+Tab | Every editable segment is a Tab stop: three for a date. Zag sets `tabIndex: 0` on each (`connect.mjs:140`) |
| Digits | Typing `1 2 2 5 2 0 2 6` filled 12/25/2026 and moved focus after each complete segment. The value committed only once every segment was filled (`2026-12-25`) |
| Arrow Up/Down | ±1, wrapping (month 12 → 1); each commits when the date is complete |
| Page Up/Down | ±2 months, ±7 days, ±5 years, ±2 hours, ±15 minutes (`utils/segments.mjs:45-58`) |
| Home / End | The segment's `aria-valuemin` / `aria-valuemax` |
| Arrow Left/Right | Previous/next segment. Under `dir="rtl"` (he-IL) Arrow Left moved day → month → year, which is leftward on screen (DOM order day, month, year; x positions decreasing) |
| Backspace | Removes the last digit (`27` → `2`), then clears to the placeholder |
| Pointer click on a segment, click on the label | Focuses that segment; focuses the first segment |

These follow the APG spinbutton keys: Up/Down change the value, Home/End set min/max, and Page Up/Down are an optional larger step (APG Spinbutton pattern). APG adds that text editing is best left to the browser, "which supply them for HTML inputs with type text and for elements with the contenteditable HTML attribute".

**The ARCHITECTURE shapes.** Probe 3.4 rendered both ARCHITECTURE shapes without a machine, plus native `<input type="date">`, each in a shadow root.

| Shape | Chromium AX | Tab stops (Chromium / Firefox / WebKit macOS / WebKit Linux) |
|---|---|---|
| Zag 1.49.0: `span[contenteditable][role=spinbutton]` per segment | `group` > 3 × `spinbutton` (richtext) | 3 / 3 / 3 / 3 |
| §15.1: `<input type="text" inputmode="numeric" aria-label>` per segment in a `role="group"` | `group` > 3 × `textbox` (plaintext) | 3 / 3 / 3 / 3 |
| §16.2: one `<input type="text">` with a mask | one `textbox "Date"`, value `12/25/2026` | 1 / 1 / 1 / 1 |
| Native `<input type="date">` | node `Date` > 3 × `spinbutton` + `button "Show date picker"` | 4 / 4 / 3 / 3 |

- On macOS WebKit, Tab skips `<button>` elements, as the macOS default keyboard-access setting does, so the probe saw `BODY` where Linux WebKit reached the `after` button. The field's own stops are the same on both.
- An `<input type="text">` may take `role="spinbutton"` (ARIA in HTML, `input type=text`: "Roles: combobox, searchbox or spinbutton"). Probe 3.6 shows the Zag machine can drive such inputs (§2.8).

### 2.3 Q3: form fit in a shadow root

Probe 3.5 hosted the machine in a `formAssociated` Lit element that calls `internals.setFormValue(value[0]?.toString() ?? null)` from `onValueChange`. Every row held in all four engine runs.

| Behaviour | Observation | Evidence |
|---|---|---|
| Scope | With `getRootNode: () => this.renderRoot`, the machine found its control, segments and focus targets inside the shadow root. `getById` uses `getRootNode().getElementById` (`dom-query` `dist/scope.mjs:6`, `:11`). `LineMachineController` reads `getRootNode` once at construction (`packages/line-core/src/machine/line-machine-controller.ts:24-25`) | probe 3.3 |
| Hidden input | `type="hidden"`, `form` owner `null` inside a `<form>`, so it adds nothing to `FormData`; `willValidate: false` | `connect.mjs:299-315`; probe 3.5 |
| Hidden input value | The locale display string from `formatter.format`: `12/25/2026`, `1/2/2026`, `14:30`, not an ISO string | `utils/formatting.mjs:8-15`, `:34-44`; probe 3.5 |
| Host value through `ElementInternals` | `FormData` had `d=2026-12-25`, the same string as a native `<input type="date" name="native">` beside it | probe 3.5 |
| `required` | Set on the hidden input, which HTML bars from constraint validation; `form.checkValidity()` returned `true` with a required, empty field | HTML, hidden state; probe 3.5 |
| `defaultValue` | `onValueChange` does not fire for it (bindable `onChange` runs on change only, `machine.mjs:85-91`), so the host must seed its own form value | probe 3.3 `start` row |
| A segment cleared after a complete entry | Display `12/dd/2026`; value, hidden input and `FormData` stay `2026-12-25` after blur. The machine commits a clear only once every segment is cleared (`machine.mjs:313-318`, `:469-473`) | probe 3.5 `staleClear` |
| `min="2026-01-01"`, typed `12/25/2020` | `onValueChange` first fired with `2020-12-25`; on blur `confirmPlaceholder` clamped the year and fired `2026-12-25` (`machine.mjs:450-456`; `date-utils` `dist/constrain.mjs:49-71`). There is no range-underflow state | probe 3.5 `minMax` |
| `disabled` | Segments lose `tabindex` and `contenteditable` | probe 3.5 |
| Paste | Parsed with `parseDate` (ISO only, `date-input.parse.mjs:3-7`): `2026-12-25` set the value in Chromium and both WebKits, and the field's own display format `12/25/2026` was ignored. In Firefox the synthetic `ClipboardEvent` carried no data, so paste is unverified there | probe 3.5 `paste` |

- MANIFESTO Law 7 makes "native `<form>` semantics … the only contract" (`docs/MANIFESTO.md:51`). Under it the host drives the value, the default, reset, disabled and validity. Zag's `name`, `form` and `required` props have no effect from inside a shadow root. This is R1's general finding (plan `:36-42`), confirmed here for this machine.
- ARCHITECTURE §17.2 C1 requires JSON-serialisable public inputs (`docs/ARCHITECTURE.md:1576`). Zag takes `DateValue` objects for `value`, `min`, `max` and `placeholderValue`, so the host converts ISO strings at its boundary. The probe did this with `parseDate`/`parseDateTime`.

### 2.4 Q4: weight

Method of `scripts/report-size.mjs`: esbuild `--bundle --minify --format=esm --target=es2022`, then `gzip -9 -n` (`scripts/report-size.mjs:8-17`). Packages are from npm at the versions in §2.1.

| Bundle | Raw B | gzip B |
|---|---|---|
| `@zag-js/core` `{ createMachine }` + `@zag-js/vanilla` `{ VanillaMachine }`, named imports (the baseline used below) | 15,664 | 5,796 |
| Baseline + `@zag-js/date-input` (`machine`, `connect`), `@internationalized/date` external | 53,026 | 17,457 |
| Baseline + `@zag-js/date-input` + `@internationalized/date` | 68,150 | 22,362 |
| Same + `createCalendar` (non-Gregorian calendars) | 78,242 | 26,238 |
| Whole `@internationalized/date` (`export *`) | 33,673 | 11,149 |
| `@internationalized/date` parse helpers and types alone (`parseDate`, `parseDateTime`, `parseTime`, `CalendarDate`, `CalendarDateTime`, `Time`, `today`, `getLocalTimeZone`) | 14,584 | 4,634 |

- **Marginal cost over the baseline:** 11,661 B gzipped for the machine and its Zag-only dependencies, plus 4,905 B for the part of `@internationalized/date` it uses, so 16,566 B in all, about 3.3 times the < 5 KB soft target (PRD §1.7, `docs/PRD.md:165`). With `createCalendar` the cost is 20,442 B.
- **The baseline differs from the report's row.** The baseline above is a named-import entry, `export { createMachine } from '@zag-js/core'` plus `export { VanillaMachine } from '@zag-js/vanilla'`. `scripts/report-size.mjs` bundles `export *` from both packages for its "Zag core + vanilla" row (`scripts/report-size.mjs:167-168`), 19,963 / 7,493 B at 1.49.0, which R8 uses as its baseline B0. Over B0, R8 measures DateInput's marginal at 16,507 B gzipped (`docs/research/02-research-packaging-weight.md`: its machine table, and its §5 gap 7 on the baseline row). The 59 B between 16,566 and 16,507 comes from the choice of baseline.
- **Raw bytes by package** in the full bundle (esbuild metafile): `@zag-js/date-input` 30,978, `@internationalized/date` 15,762, `vanilla` 7,373, `store` 3,114, `core` 2,961, `dom-query` 2,605, `utils` 1,941, `live-region` 1,388, `date-utils` 1,102, `anatomy` 651. Inside `date-input`, the largest files are the machine (9,894), `incomplete-date` (5,603), `connect` (4,808) and the locale placeholder table (3,354).
- The `report-size` component row keeps Zag external (SD21, `scripts/report-size.mjs:12-13`), so a pre-built DateInput row there would leave these bytes out. R8 owns how the report counts a pre-built machine (plan `:270`).

### 2.5 Q5: locale and granularity

Probe 3.3 listed segments as `[type|text|aria-label]` with literals quoted. Each case was identical in Chromium, Firefox, macOS WebKit and Linux WebKit.

| Case | Segments |
|---|---|
| en-US | `[month\|mm\|Month]"/"[day\|dd\|Day]"/"[year\|yyyy\|Year]` |
| en-GB | `[day\|dd\|Day]"/"[month\|mm\|Month]"/"[year\|yyyy\|Year]` |
| de-DE | `[day\|tt\|Tag]"."[month\|mm\|Monat]"."[year\|jjjj\|Jahr]` |
| pt-PT | `[day\|dd\|Dia]"/"[month\|mm\|Mês]"/"[year\|aaaa\|Ano]` |
| ja-JP | `[year\|年\|年]"/"[month\|月\|月]"/"[day\|日\|日]` |
| ar-EG | `[day\|يوم\|يوم]"‏/"[month\|شهر\|الشهر]"‏/"[year\|سنة\|السنة]` |
| he-IL, `dir="rtl"` | `[day\|יום\|יום]"."[month\|חודש\|חודש]"."[year\|שנה\|שנה]` |
| fa-IR with `createCalendar` (Persian) | `[year\|سال\|سال]"/"[month\|ماه\|ماه]"/"[day\|روز\|روز]` |
| en-US, `granularity="minute"` | date segments, `", "`, `"⁦"[hour\|––\|Hour]":"[minute\|––\|Minute]"⁩"" "[dayPeriod\|AM\|AM/PM]` |
| en-US, `granularity="second"`, `hourCycle: 24` | date segments, then hour, minute, second; no `dayPeriod` |
| de-DE, `granularity="minute"` | date segments, then `[hour\|––\|Stunde]":"[minute\|––\|Minute]`; 24-hour from the locale |
| en-US, time-only through a custom `formatter` (`hour`, `minute` only) | `"⁦"[hour\|––\|Hour]":"[minute\|––\|Minute]"⁩"" "[dayPeriod\|AM\|AM/PM]` |
| de-DE, time-only formatter | `[hour\|––\|Stunde]":"[minute\|––\|Minute]` |

- **Order and separators** come from `Intl.DateTimeFormat#formatToParts` through `DateFormatter` (`machine.mjs:31-39`). The formatter options always include `year`, `month` and `day` (`utils/segments.mjs:6-20`), so `granularity` only adds time segments. A time-only field needs the `formatter` prop on 1.49.0. Probe 3.3 typed `1 4 3 0` with `hourCycle: 24` and got `onValueChange` with `2026-11-26T14:30:00` (a `CalendarDateTime` carrying today's UTC date) and hidden value `14:30`, in every engine.
- **Labels** come from the platform: `Intl.DisplayNames(locale, { type: "dateTimeField" })` (`utils/segments.mjs:63-73`). They were identical across the four engine runs.
- **Placeholders** come from a table bundled in the package: `LOCALE_PLACEHOLDERS`, 76 locale keys (`utils/placeholders.mjs:3-406`). `translations.placeholder` overrides it (`date-input.types.d.ts:25-31`).
- **"Empty"** is a literal in the announcement (`machine.mjs:425`), outside `translations`.
- **Digits** (probe 3.3 `ime`, all engines). `isValidCharacter` accepts the locale's digits (`date-utils` `dist/locale.mjs:3-16`), but `updateSegmentValue` parses with `Number.parseInt` and returns early when that is `NaN` (`utils/input.mjs:4-6`, `:63`). Only ASCII digits are therefore accepted. An ASCII `5` in ar-EG displayed as `٥`. A typed `٥` (U+0665) in ar-EG, and full-width `１`/`５` (U+FF11/U+FF15) in en-US and ja-JP, changed nothing.
  - The 1.42.0 CHANGELOG entry "Allow typing dates using the locale's native numerals (e.g. Arabic-Indic `٠-٩` …)" does not hold for `date-input` 1.49.0. Its commit `ac7a81a` touched `date-utils` `locale.ts`, `date-input.connect.ts` and `date-picker.connect.ts`, and its e2e test covers the date picker. `src/utils/input.ts` on `main` still uses `Number.parseInt` (`:7-8`, `:79-104`).
- **IME composition.** Input Events lists `insertCompositionText` as part of IME composition with `beforeinput` not cancelable. Zag calls `preventDefault()` on it and sends the data (`connect.mjs:268-277`). The engine still inserts the composed text.
  - Chromium, CDP `Input.imeSetComposition` with `１２`: the month segment's DOM became `１２mm` and the machine state stayed empty.
  - Firefox: Playwright's `keyboard.insertText` arrives as `insertCompositionText` (`cancelable: false`) and left `１mm` in the segment.
  - Chromium and WebKit `insertText` is a cancelable `insertText` and left the DOM clean.
  - WebKit composition could not be driven (no IME API in Playwright).
  - React Aria handles this case by restoring the segment text on the `input` event (`useDateSegment.mjs:256-289`).
- **RTL:** as §2.2. The group carries `unicode-bidi: isolate` (`connect.mjs:122`), and time segments are wrapped in U+2066/U+2069 isolates (`utils/segments.mjs` `processSegments`).

### 2.6 Q6: A2UI DateTimeInput

| | v0.9.1 | v1.0 |
|---|---|---|
| Properties | `value` (DynamicString, "ISO 8601 format. If not yet set, initialize with an empty string"), `enableDate`, `enableTime` (boolean, `"default": false`), `min`, `max` (DynamicString, `format` `date` \| `time` \| `date-time`), `label`, plus `Checkable` (`checks`) | the same, plus `weight`; `Checkable` gives `@checks` (plan `:138`) |
| Required | `component`, `value` | `component`, `value` |
| Source | `catalogs/basic/v0_9_1/catalog.json:709-…` (`enableDate` `:731`, `enableTime` `:736`) | `catalogs/basic/v1/catalog.json:592-678` (`enableDate` `:608`, `enableTime` `:613`) |

- The v0_9 and v0_9_1 DateTimeInput schemas are identical (`diff` of the two `catalog.json` objects). Upstream is `a2ui-project/a2ui` at `36725ee` (2026-11-26).
- **Implementation guide** (v0_9_1 `:181-191`, v1 `:192-202`): "Render using native date and time picker controls." Both flags show both; `enableDate` alone shows a date picker; `enableTime` alone shows a time picker. The renderer "must convert the platform's native date/time format into a standard ISO 8601 string".
- **The reference renderer** derives `enableDate = props.enableDate ?? !enableTime` and `enableTime = props.enableTime ?? false`. With both flags absent, or `enableDate` absent and `enableTime: false`, it renders a date input. With both explicitly `false`, `??` keeps `false`, and it renders the label and no input at all (`@a2ui/web_core` 0.14.0, the repo pin, `src/universal/basic_catalog/components/DateTimeInput.js:65-66`, `:108-131`). It writes `YYYY-MM-DD` for a date, the `<input type="time">` value (`HH:MM`) for a time, and `${date}T${time}:00` for both (`:65-101`; upstream main `typescript/core/web_core/src/universal/basic_catalog/components/DateTimeInput.ts:152-190`).
- **What `<line-date-input>` on Zag 1.49.0 can render:**

| Flags | Segments | ISO the surface writes |
|---|---|---|
| both absent, or `enableDate` only | `granularity: "day"` | `CalendarDate.toString()` → `2026-12-25` |
| `enableDate` + `enableTime` | `granularity: "minute"` | `CalendarDateTime.toString()` → `2026-12-25T14:30:00` |
| `enableTime` only | custom `formatter` (probe) or Zag 2 `maxGranularity` | the time part of a `CalendarDateTime`, `14:30:00`; the date part is a placeholder and must be dropped |
| both `false` explicitly | — (the reference renderer renders the label and no input) | none |

- `min`/`max` arrive as ISO strings that may be a date, a time or a date-time. Zag's `min`/`max` compare dates only (`date-utils` `dist/constrain.mjs:49-52` uses `toCalendarDate`), so a time bound is not enforced by the machine.

### 2.7 Q7: the Phase 4 DatePicker composition

ARCHITECTURE §13.4: "DatePicker (Phase 4) — calendar popup via Zag.js, accepts any trigger via slot including DateInput", with `<line-date-picker><line-date-input slot="trigger"></line-date-input></line-date-picker>` (`docs/ARCHITECTURE.md:623-624`). PRD: "DatePicker composes with DateInput (Phase 2) as optional trigger" (`docs/PRD.md:1037`). MANIFESTO principle 3: "A `DatePicker` accepts any trigger via slot" (`docs/MANIFESTO.md:23`).

- **Zag's date picker separates the parts.** In `@zag-js/date-picker` 1.49.0 the anatomy has `control`, `input`, `trigger`, `positioner`, `content` and more (`dist/date-picker.anatomy.mjs:3`).
  - `trigger` is `type: "button"` with `aria-haspopup: "grid"`, `aria-expanded` and `aria-controls` (`dist/date-picker.connect.mjs:843-856`).
  - `input` is a text `<input>` with `parse`/`format` string props (`date-picker.types.d.ts:237-241`, `:451-461`).
  - The popup anchors to `control` (`date-picker.machine.mjs:683-685`).
  - Focus returns to the `input`, or else the trigger (`:1004-1011`).
  - The picker finds `input` parts with `queryAll(getControlEl, "[data-part=input]")` (`date-picker.dom.mjs:24`).
- **A slotted element is outside the picker's scope.** A slotted `<line-date-input>` lives in the picker's light DOM. `querySelectorAll` on the picker's shadow-root `control` does not return slotted nodes, so the picker machine cannot address the DateInput's segments or a hidden input through its parts [INFERENCE: standard DOM slotting; not probed in this note]. The two machines would have to meet through the DateInput's public surface: `value`, `line-change`, `focus()`.
- **The DateInput is a field, not a trigger.** A DateInput is a `group` of `spinbutton`s (§2.2). `aria-haspopup`/`aria-expanded` belong on the button that opens the popup.
  - React Aria's `useDatePicker` returns `groupProps` (`role: 'group'`), `fieldProps` for the DateField, a separate `buttonProps` with `aria-haspopup: 'dialog'`, and `dialogProps` (`react-aria` 3.53.1 `dist/private/datepicker/useDatePicker.mjs:98-158`).
  - The APG Date Picker Dialog example pairs a text input with a separate `<button aria-label="Choose Date">`.
  - APG also lists a "Date Picker Combobox", "an editable date input combobox that opens a dialog", in which the field itself opens the popup. That field is one editable text input acting as a combobox, not a group of spinbuttons (APG Dialog pattern, examples list).
  - In React Aria and in the APG dialog example, the field sits beside the trigger and is not the trigger. Only the APG combobox variant makes the field the opener, and it is a single text input.

### 2.8 Q8: tier options

| Option | What it is | For | Against |
|---|---|---|---|
| (a) Pre-built, as shipped | `@zag-js/date-input` 1.49.0 with `span[contenteditable][role=spinbutton]` segments | Locale order, labels, calendars, RTL, ranges and time segments work today in four engine runs (§2.5); APG keys; 0 axe violations; 17 credited upstream changes since 1.35.3 that a custom machine would not inherit (§2.1) | §2.3 form gaps, all solvable in the host; ASCII-only digits and composition residue (§2.5); English "Empty"; a `body` live region per instance; no iOS branch; 16.6 KB gzipped; contradicts §15.1 and §16.2 (§5) |
| (b) Hybrid | The same machine and props on `<input type="text" role="spinbutton">` segments (§15.1 shape) | Native text controls; Chromium AX exposes `valuetext` (`mm`) | Probe 3.6: works in Firefox and both WebKits, but in Chromium typing was dead until the host restored the caret after Zag's `onFocus`, which collapses the document selection onto the segment node (`connect.mjs:172-173`). Composition residue remains (`mm１２`), because the machine drops non-ASCII digits. Zag's `contentEditable` props must be filtered. Same weight as (a). Linux WebKit ended focus on the month after typing, where the others ended on the year (cause not established) |
| (c) Custom machine | `createMachine` with native `<input>` segments (§15.1), Gregorian through `Intl.DateTimeFormat#formatToParts`, `Intl.DisplayNames` and `Date` | No `@internationalized/date` for Gregorian; the repo owns IME and digit handling | Weight unmeasured [INFERENCE: smaller than 16.6 KB]. Non-Gregorian calendars need `@internationalized/date` or `Temporal`. `Temporal` is in Chromium 159, Firefox 159 and the WebKit 27.2 build (probe 3.7), but web-features lists Safari as "Not supported", so it misses PRD's "latest 2 stable" Safari (`docs/PRD.md:163`). The repo would re-derive the locale, segment and range logic the Zag fixes cover |
| (d) Single masked input | One `<input type="text">` (§16.2 shape) and a mask machine | One Tab stop; one textbox; native paste, IME and undo | No per-field semantics (`textbox`, not `spinbutton`); masks are locale-specific; no Zag machine exists; a custom machine all the same |

## 3. Probes

### 3.1 Setup

- **Workspace.** Everything lived under `/tmp/z20-probes/`, deleted at the end of the row. That held the tarballs (`npm pack` of `@zag-js/date-input@1.49.0`, `@zag-js/date-utils@1.49.0`, `@zag-js/live-region@1.49.0`, `@zag-js/date-picker@1.49.0`, `@zag-js/date-input@2.0.0-next.4`, `@internationalized/date@3.12.4`, `react-aria@3.53.1`, `@react-aria/datepicker@3.17.1`) and a Bun workspace (`bun add @zag-js/date-input@1.49.0 @zag-js/vanilla@1.49.0 @zag-js/core@1.49.0 @internationalized/date@3.12.4 lit@3.3.3`, with `HOME=/tmp/emptyhome`).
- **Probe element `z20-date-input`.** A `LitElement` with `static formAssociated = true` and `attachInternals()`. It drives the machine through a verbatim copy of `packages/line-core/src/machine/line-machine-controller.ts`: worktree HEAD `49d24c54`, SHA-256 `b2834c70…5e69b`, byte-identical to `9c9b1f4`.
  - Its props function passes `id`, `getRootNode: () => this.renderRoot`, `locale`, `granularity`, `hourCycle`, `dir`, `name`, `disabled`, `readOnly`, `required`, `timeZone`, `min`/`max` (through `parseDate`), `defaultValue` (through `parseDate` or `parseDateTime`) and `createCalendar` on request. In time-only mode it passes a `DateFormatter(locale, { hour: "numeric", minute: "2-digit", timeZone, hourCycle })` as `formatter`.
  - `onValueChange` records `{ iso: value[0]?.toString(), valueAsString }` and calls `internals.setFormValue(iso)`.
  - `render()` emits root, label, control, group, one `<span>` per segment and the hidden input. `updated()` applies `connect(service, normalizeProps)` getters with `@zag-js/vanilla` `spreadProps` and sets each segment's `textContent` from `segment.text`. Zag's props are therefore applied imperatively, not through a Lit directive. The component spec decides that.
  - The `native-segments` attribute renders `<input type="text">` for editable segments, drops `contenteditable`, and sets `.value`. The `fix-caret` attribute wraps Zag's `onFocus` and calls `setSelectionRange` at the end of the value after it.
  - Bundled with `bun build --format=iife --target=browser`.
- **Comparison element `z20-static`.** Shadow-root markup for the §15.1 shape (three `<input type="text" inputmode="numeric" aria-label>` in `role="group" aria-labelledby`), the §16.2 shape (one labelled text input), and a native `<input type="date">`.
- **Runner.** `run.mjs` imports the repo's `node_modules/playwright/index.mjs` (1.65.1) and runs one browser at a time, one worker. Each test uses `page.setContent` with a `<button id="before">`, the markup and a `<button id="after">`, then `addScriptTag` with the bundle. Input goes through `page.keyboard.press`, `keyboard.insertText`, `locator.click` and Chromium CDP (`Input.imeSetComposition`, `Input.insertText`, `Accessibility.getFullAXTree`). Page errors and console errors were collected: none in any test.
- **Linux WebKit.** `docker run --rm --cpus 2 --memory 1g --ipc=host -v <worktree>:/work:ro -v /tmp/z20-probes/w:/probes -w /probes -e PW=/work/node_modules/playwright/index.mjs -e ENGINES=webkit mcr.microsoft.com/playwright:v1.65.1-noble node run.mjs`. That is Ubuntu 24.04.5 aarch64, Node 26.13.1, WebKit build 2388 under `/ms-playwright`, with the repo's Playwright 1.65.1 JavaScript from the mounted `node_modules`; nothing was installed in the container. The CI runner is x86_64 Linux and has not run these probes.
- **Size and axe.** `size.mjs`, `size2.mjs` and `meta.mjs` called the repo's esbuild 0.28.2 API and `gzip -9 -n` (§2.4). `axe.mjs` injected `axe-core` 4.14.1 from the repo's `node_modules` and ran tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.

### 3.2 Engines

| Engine | Version | Where |
|---|---|---|
| Chromium | 159.0.8154.6 (headless shell 1255) | macOS 27.2.1 arm64 |
| Firefox | 159.0 (build 1572) | macOS 27.2.1 arm64 |
| WebKit | 27.2 (build 2388) | macOS 27.2.1 arm64 |
| WebKit | 27.2 (build 2388) | Linux aarch64 container (above) |

### 3.3 Machine in a shadow root (`run.mjs`: `semantics`, `typing`, `keys`, `ime`, `locales`, `timeOnly`, `rtl`, `day31`, `announce`, `liveRegionCount`; exit 0)

| Test | Chromium | Firefox | WebKit macOS | WebKit Linux |
|---|---|---|---|---|
| Starts (no static fallback), 0 page errors | yes | yes | yes | yes |
| DOM roles and ARIA attributes (§2.2) | as §2.2 | same | same | same |
| `ariaSnapshot` | group + 3 spinbuttons | same | same | same |
| Typing 12252026 → `2026-12-25`, auto-advance | yes | yes | yes | yes |
| Arrows, Page, Home/End, Backspace sequence (`keys.log`) | as §2.2 | identical | identical | identical |
| Tab stops through the field | month, day, year, `after` | same | month, day, year, `BODY` | month, day, year, `after` |
| Label click / segment click | month / year | same | same | same |
| 13 locale and granularity cases | §2.5 table | identical | identical | identical |
| Time-only formatter, typed `1430` | `2026-11-26T14:30:00` | same | same | same |
| he-IL RTL Arrow Left order | day → month → year | same | same | same (x positions differ by font metrics) |
| 11/31/2026 typed | `2026-11-30` | same | same | same |
| Announcements (en-US / de-DE) | "Day, Empty" / "Tag, 27", "Tag, Empty" | same | same | same |
| `body` live regions for 3 instances; after removal | 3; 0 | 3; 0 | 3; 0 | 3; 0 |
| Full-width `１` (insertText), en-US | ignored, DOM clean | ignored, DOM `１mm` | ignored, DOM clean | ignored, DOM clean |
| Arabic-Indic `٥`, ar-EG | ignored | ignored, DOM `٥يوم` | ignored | ignored |
| ASCII `5`, ar-EG | `٥`, advances | same | same | same |
| CDP composition `１２` | DOM `１２mm`, state empty | n/a | n/a | n/a |
| `beforeinput` for `press('5')` | `insertText`, cancelable | `insertText`, cancelable | `insertText`, cancelable | same |
| `beforeinput` for `insertText('5')` | `insertText`, cancelable | `insertCompositionText`, not cancelable | `insertText`, cancelable | same |

### 3.4 ARCHITECTURE shapes (`comparisons`; exit 0)

As the §2.2 shape table. Chromium AX: §15.1 inputs are `textbox` (plaintext) with names Month, Day, Year under `group "Date"`, and §16.2 is one `textbox "Date"`. Native date shows a `Date` node with three `spinbutton`s and a "Show date picker" `button`. Native date Tab stops: 4 in Chromium and Firefox, 3 in WebKit on both platforms.

### 3.5 Form behaviour (`typing`, `form`, `staleClear`, `minMax`, `paste`; exit 0)

Every row of the §2.3 table held identically in Chromium, Firefox, macOS WebKit and Linux WebKit, except paste in Firefox, where the synthetic event carried no data.

### 3.6 Hybrid on native inputs (`hybrid`, without and with `fix-caret`; exit 0)

| | Chromium | Firefox | WebKit macOS | WebKit Linux |
|---|---|---|---|---|
| Typing 12252026, as shipped props | nothing typed; `beforeinput` never fired after `keydown` | `2026-12-25` | `2026-12-25` | `2026-12-25` |
| Same with `fix-caret` | `2026-12-25` | `2026-12-25` | `2026-12-25` | `2026-12-25` |
| Focus after typing | year | year | year | month |
| Arrow Left, Up, Left, Home → | `1/26/2026`, `FormData d=2026-01-26` | same | same | same |
| Full-width `１` | ignored | DOM `1１` | ignored | ignored |
| CDP composition `１２` (fix-caret) | DOM `mm１２`, state empty | n/a | n/a | n/a |
| Chromium AX | `spinbutton` (plaintext), `valuetext: "mm"` | — | — | — |

### 3.7 Platform APIs (`temporal.mjs`; exit 0)

`typeof Temporal` is `"object"` in Chromium 159, Firefox 159 and WebKit 27.2 on macOS and Linux, and `Temporal.PlainDate.from('2026-12-25').withCalendar('persian')` succeeds in all of them. `Intl.DateTimeFormat('de-DE').formatToParts` gives `day,literal,month,literal,year`, and `Intl.DisplayNames('pt-PT', { type: 'dateTimeField' }).of('dayPeriod')` gives `am/pm`, in all of them. Shipping Safari has no `Temporal` per web-features (§7).

### 3.8 axe (`axe.mjs`; exit 0)

Zero violations and 17 passes in Chromium, Firefox, macOS WebKit and Linux WebKit, on four fields: empty, minute granularity with a value, disabled, and he-IL RTL. axe does not check the absent `aria-required`, the stale value or the announcement language.

## 4. Recommendations

Each recommendation is evidence for the post-research revision and the Phase 2 spec. None is a decision.

1. **Tier: pre-built `@zag-js/date-input` on contenteditable `spinbutton` segments (option (a), recommended).** It is the only option whose locale, calendar, RTL and range behaviour is already proven identical in all four engine runs. It follows the shape React Aria ships, and its gaps sit at the host boundary, where the shared form layer (plan O1 (a)) already sits. Alternatives: (b) the hybrid, which keeps the §15.1 wording true but needs a caret fix in Chromium and keeps the IME gap; (c) a custom machine, which owns IME and digits but re-derives what the upstream changes cover; (d) a masked single input, which loses per-field semantics.
2. **The host owns the form contract (recommended, under any option).**
   - `setFormValue` with an ISO string: a valid date string for `day`, a local date-time string for time granularities, so the value matches native `<input type="date">` and A2UI.
   - The host seeds the default itself, because `onValueChange` does not fire for it.
   - An empty value whenever the display is incomplete (recommended), instead of Zag's last committed value (§2.3 `staleClear`).
   - Validity computed by the component: `valueMissing` from `required`, `rangeUnderflow`/`rangeOverflow` from `min`/`max` without passing them to the machine's clamping (recommended), and a bad-input state for a partial entry.
   - `aria-required` on the segments, or on the group.
   - The alternative is to pass `min`/`max` to Zag and accept the silent rewrite on blur.
3. **Digits and IME (recommended).**
   - Normalise full-width and locale digits to ASCII before the machine sees them, with a `beforeinput` handler ahead of Zag's.
   - Restore the segment DOM after `insertCompositionText` on `input`, as React Aria does.
   - File both upstream with probe 3.3 as the reproduction.
   - The alternative is to accept ASCII-only entry. Japanese, Chinese and Arabic-script users would then need an ASCII keyboard mode.
4. **Strings.** The consumer supplies segment labels and placeholders through `translations` (plan `:419-420`). "Empty" has no hook in 1.49.0. Options: an upstream `translations` key (recommended, filed as an issue), or a host-owned live region that replaces Zag's (needs a way to turn Zag's off, which 1.49.0 lacks), or accept English.
5. **Live region.** Accept one `body` region per instance, or ask upstream for a `root`/opt-out. `@zag-js/live-region` already has a `root` option (`dist/index.mjs:25-27`), and the date-input machine does not pass it. This touches MANIFESTO Law 5 (§5 C4).
6. **ARCHITECTURE §15.1 and §16.2.** The post-research revision states the shape the spec picks. Under (a), §15.1's DateInput row becomes contenteditable spinbutton segments plus `ElementInternals`. Under any option, §16.2's "`<input type="text">` with segment masking" no longer describes the DateInput, unless (d) is chosen.
7. **A2UI mapping (recommended).**
   - Both flags absent, or `enableDate` only → `granularity: "day"`, ISO `YYYY-MM-DD`.
   - Both → `granularity: "minute"`, ISO `YYYY-MM-DDTHH:MM:SS`.
   - `enableTime` only → a time-only mode of `<line-date-input>` through the 1.49.0 `formatter`, writing the time part only. The alternatives are the inert placeholder until the Phase 4 Time Picker, or Zag 2 `maxGranularity`.
   - Both explicitly `false`: render nothing but the label, as the reference renderer does (§2.6), or default to a date field. Defaulting to a date departs from the reference renderer, which applies its date default only when `enableDate` is absent. This is a choice, not a recommendation.
8. **Phase 4 composition (recommended).** The DateInput takes the picker's field slot (for example `slot="input"`), and the DatePicker owns its trigger button and popup anchor. The two meet through `value`, `line-change` and `focus()`. The alternative is to keep `slot="trigger"` and give the DateInput `aria-haspopup`/`aria-expanded`, which would put popup semantics on a `group` of spinbuttons.
9. **Weight.** Report DateInput at its real marginal cost (16.6 KB gzipped, 20.4 KB with calendars) against the soft target, and let R8 decide how `report-size` counts pre-built machines. Under (a), keep `createCalendar` opt-in, so Gregorian consumers do not pay 3,876 B for calendars.

## 5. Contradictions and gaps

PROCESS §2: research that contradicts the plan returns to the plan and the PRD before spec work. These are flagged and left unresolved.

1. **ARCHITECTURE §15.1 vs §16.2 vs the candidate.** §15.1 requires "`<input>` (per segment)" for "IME for segment values, keyboard navigation" (`docs/ARCHITECTURE.md:1332`). §16.2 says "`<input type="text">` with segment masking" (`:1428`), repeated in §16.3 (`:1522-1523`). The Zag 1.49.0 shape is neither (§2.2). The plan already lists the §15.1/§16.2 conflict (plan `:437`). New evidence: native inputs do not by themselves solve the IME case for this machine (§3.6). PRD §4.2 calls DateInput a "Masked date field" (`docs/PRD.md:279`), and ARCHITECTURE §13.3 and §13.4 say "Masked segments" and "masked text field" (`docs/ARCHITECTURE.md:617`, `:622`), though no option except (d) masks.
2. **ARCHITECTURE §13.4 and PRD §7.6 vs Zag's date picker and APG.** ARCHITECTURE §13.4 composes `<line-date-picker><line-date-input slot="trigger">` (`docs/ARCHITECTURE.md:623-624`), and PRD §7.6 says "DatePicker composes with DateInput (Phase 2) as optional trigger" (`docs/PRD.md:1037`). Both conflict with a trigger that is a popup button and a field that is a separate part (§2.7). Related wording names no `slot="trigger"`: PRD principle 3 and MANIFESTO principle 3 ("A DatePicker accepts any trigger via slot", `docs/PRD.md:132`, `docs/MANIFESTO.md:23`) and the PRD §7.6 exit criterion "DatePicker + DateInput composition verified" (`docs/PRD.md:1041`). "Accepts any trigger via slot" still holds under the recommended design (recommendation 8), where the DatePicker keeps a slot for its own trigger and the DateInput takes the field slot. The Phase 4 spec comes later, but the wording is in today's ARCHITECTURE and PRD.
3. **MANIFESTO Out of Scope and PRD §1.7 localisation vs bundled strings.** "No bundled i18n" (`docs/MANIFESTO.md:66`; `docs/PRD.md:169`) vs the 1.49.0 placeholder table for 76 locales (`utils/placeholders.mjs:3-406`) and the fixed English "Empty" (`machine.mjs:425`). Consumer overrides exist for the table but not for "Empty".
4. **MANIFESTO Law 5 vs the machine's DOM effects.** "No DOM mutation outside Lit's reactive cycle" (`docs/MANIFESTO.md:47`) vs the live region appended to `document.body` (`machine.mjs:240-247`), the `requestAnimationFrame` segment focus (`:282-286`) and the selection collapse on focus (`connect.mjs:172-173`). Whether a machine effect counts as "outside Lit's reactive cycle" is for the spec to say. Phase 1's pre-built machines add nothing to `body`: `@zag-js/presence` and `@zag-js/toggle` 1.49.0 do not depend on `@zag-js/live-region`, and their `dist/*.mjs` contain no `appendChild` or `.body` (grep of the repo install).
5. **Plan §8 risk rating vs the measurement.** "`@internationalized/date` breaks the DateInput size target", with Likelihood "Medium" (`docs/plans/02-plan-essential-forms.md:517`). Measured, the pre-built option is 3.3 times the target (§2.4). The target is soft (PRD `:165`), so Impact "Low" stands.
6. **ARCHITECTURE §17.3 and the A2UI guide vs ARCHITECTURE §16.2.** §17.3 maps every DateTimeInput to `<line-date-input>` in Phase 2 (`docs/ARCHITECTURE.md:1625`). A time-only DateTimeInput needs a time-only mode that 1.49.0 offers only through a custom formatter (§2.6). Plan §2.4 says it "has no Phase 2 target yet" (plan `:127-128`), and §5.5 leaves it open (`:411`). The A2UI guide asks renderers to "Render using native date and time picker controls" (§2.6), which §16.2 rules out for line://ui (`docs/ARCHITECTURE.md:1428`, `:1436`).
7. **ARCHITECTURE §8 version.** "`@zag-js/date-input` exist[s] at 1.47.0" (`docs/ARCHITECTURE.md:416`) is already in plan §5.7 (`:442`); the baseline is 1.49.0.

No fact in ledger row 01-Z20 proved wrong. The plan's description of the segments (plan `:267`) and of the peer (plan `:159-160`) match the 1.49.0 tarball.

## 6. Open questions for the post-research revision and the Phase 2 spec

1. **Tier and shape.** Option (a) (recommended), (b), (c) or (d) of §2.8? This settles plan §5.5's tier question (plan `:404`), and the §15.1 and §16.2 rows follow it.
2. **Form value.** ISO strings through `setFormValue` (recommended)? An empty value while the display is incomplete (recommended), or Zag's last committed value?
3. **Range.** Component validity (`rangeUnderflow`/`rangeOverflow`) with `min`/`max` kept out of the machine (recommended), or Zag's silent clamp on blur? How does a time-only bound apply, since Zag compares dates only?
4. **IME and digits.** A host `beforeinput` normaliser plus composition restore (recommended), an upstream fix first, or ASCII-only entry?
5. **"Empty" and the live region.** An upstream translation key (recommended), a host-owned region, or accept English? Is a `body` live region per instance compatible with Law 5, or does the spec require a `root` inside the component?
6. **iOS VoiceOver.** Does the spec require a manual VoiceOver pass on iOS before DateInput ships, given React Aria's `textbox` switch (§2.2)? Nothing in this note could verify it.
7. **Screen-reader verification.** Phase 1's open item stands (`docs/research/01-research-accessibility.md:333-336`). For DateInput: Chromium CDP tree assertions, `ariaSnapshot`, or a manual pass per engine? Chromium's empty `valuetext` on span segments (§2.2) is a case for it.
8. **Time-only DateTimeInput.** A time-only mode of `<line-date-input>` through the 1.49.0 `formatter` (recommended), the inert placeholder until Phase 4, or waiting for Zag 2 `maxGranularity`? Shared with R6 (plan `:411`).
9. **A2UI defaults.** Is the reference renderer's "absent flags mean date" adopted? For both flags explicitly `false`, does the surface render only the label, as the reference renderer does, or default to a date field and depart from it?
10. **Phase 4 composition.** Does the revision change ARCHITECTURE §13.4 (`:623-624`) and PRD §7.6 (`:1037`) from `slot="trigger"` to a field slot with a picker-owned trigger (recommended), or does it keep the trigger wording for the Phase 4 spec to settle? PRD principle 3, MANIFESTO principle 3 and PRD `:1041` need no change under the recommendation.
11. **Weight accounting.** How does `report-size` count a pre-built machine and `@internationalized/date` (R8)? Is `@internationalized/date` a `dependency` or a `peerDependency` of `line-components` (Zag declares `>=3.0.0` as a peer)? Is `createCalendar` exposed, and as what attribute?
12. **Range selection.** Zag supports `selectionMode: "range"` (two groups, `name[0]`/`name[1]`). PRD §4.2 lists only a single DateInput. Is range out of Phase 2?
13. **Static fallback.** MANIFESTO Law 9 and plan §5.5 (`:416-417`): what does a DateInput render and submit when the machine fails? A native `<input type="date">` would reintroduce the §16.2 picker icon and popup. R1 owns the general rule.

## 7. Sources

All retrieved 2026-11-26.

- npm tarballs (`npm pack`): `@zag-js/date-input@1.49.0`, `@zag-js/date-input@2.0.0-next.4`, `@zag-js/date-utils@1.49.0`, `@zag-js/live-region@1.49.0`, `@zag-js/date-picker@1.49.0`, `@internationalized/date@3.12.4`, `react-aria@3.53.1`, `@react-aria/datepicker@3.17.1`; `@zag-js/dom-query@1.49.0` and `@zag-js/vanilla@1.49.0` from the probe workspace install
- npm registry: `npm view @zag-js/date-input time dist-tags dependencies peerDependencies`, `npm view @internationalized/date time license`, `npm view @zag-js/time-picker time` (last 1.22.1, 2025-08-27)
- Zag CHANGELOG: https://github.com/chakra-ui/zag/blob/main/packages/machines/date-input/CHANGELOG.md
- Zag issues and PRs: https://github.com/chakra-ui/zag/pull/2671, https://github.com/chakra-ui/zag/pull/3071, https://github.com/chakra-ui/zag/issues/3117, https://github.com/chakra-ui/zag/pull/3335 (closed unmerged), https://github.com/chakra-ui/zag/pull/3433 (merged to v2), https://github.com/chakra-ui/zag/pull/3526, https://github.com/chakra-ui/zag/pull/3600
- A2UI at `36725eee042da90c526f469f94246f96e16fdc35`: https://github.com/a2ui-project/a2ui/blob/36725eee042da90c526f469f94246f96e16fdc35/catalogs/basic/v0_9_1/catalog.json, `catalogs/basic/v1/catalog.json`, `catalogs/basic/v0_9_1/basic_catalog_implementation_guide.md`, `catalogs/basic/v1/basic_catalog_implementation_guide.md`, `typescript/core/web_core/src/universal/basic_catalog/components/DateTimeInput.ts`; versions: https://raw.githubusercontent.com/google/A2UI/main/specification/versions.json
- `@a2ui/web_core` 0.14.0 (repo pin): `src/universal/basic_catalog/components/DateTimeInput.js`, `src/v0_8/schemas/standard_catalog_definition.json`
- WAI-ARIA APG Spinbutton pattern: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
- WAI-ARIA APG Date Picker Dialog example: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/
- ARIA in HTML, `input type=text`: https://www.w3.org/TR/html-aria/#el-input-text
- Input Events Level 2, `inputType` table (`insertCompositionText`: part of IME composition, `beforeinput` not cancelable): https://w3c.github.io/input-events/
- Zag `main` `packages/machines/date-input/src/utils/input.ts`: https://github.com/chakra-ui/zag/blob/main/packages/machines/date-input/src/utils/input.ts; commit https://github.com/chakra-ui/zag/commit/ac7a81a3fcae86500cdf15703118318570f976d5
- HTML, hidden input barred from constraint validation: https://html.spec.whatwg.org/multipage/input.html#hidden-state-(type=hidden)
- HTML, valid date string: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
- web-features, Temporal: https://web-platform-dx.github.io/web-features-explorer/features/temporal/
