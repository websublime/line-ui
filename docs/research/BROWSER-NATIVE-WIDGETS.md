# HTML Elements with Browser-Native Widgets

**Date:** 2026-03-12
**Context:** Research for line://ui — identifying all HTML elements where browsers render their own UI controls (pickers, sliders, dropdowns, etc.) that differ visually and behaviourally across Chrome, Safari, and Firefox.

---

## Why this matters for line://ui

These are the elements where:
1. The browser imposes its own visual UI that developers cannot fully style
2. The look and behaviour differs across Chrome/Safari/Firefox
3. A headless Web Component replacement provides the most value

---

## Category 1: Input Types with Native Pickers

These input types trigger a browser-provided popup/overlay picker UI. The `showPicker()` API confirms which ones the platform considers "picker-enabled".

| Element | Widget | Chrome | Safari | Firefox | Styleable? |
|---------|--------|--------|--------|---------|------------|
| `<input type="date">` | Calendar popup | Full calendar dropdown | Spinners per segment (day/month/year) | Dropdown calendar (different from Chrome) | No — picker is in user-agent shadow DOM |
| `<input type="time">` | Time picker | Dropdown with hour/minute/AM-PM | Spinners per segment | Dropdown with scrollable columns | No |
| `<input type="datetime-local">` | Date + time picker | Combined calendar + time dropdown | Combined spinners | Combined dropdown | No |
| `<input type="month">` | Month picker | Scrollable month/year grid | Spinners | Dropdown month/year | No |
| `<input type="week">` | Week picker | Calendar with week highlight | **Not supported** — falls back to text | Dropdown calendar with week numbers | No |
| `<input type="color">` | Colour picker | Full system colour dialog (OS-level) | macOS native colour wheel | Compact swatch grid + custom hex input | No |
| `<input type="file">` | File dialog | OS file picker (button + filename) | OS file picker (button + "No file chosen") | OS file picker (button + "No file selected") | Button only — partial via `::file-selector-button` |

### Notes:
- `showPicker()` works on: `date`, `month`, `week`, `time`, `datetime-local`, `color`, `file`
- Safari renders date/time inputs as segmented spinners (scroll each segment), not calendar dropdowns
- Firefox's date picker looks completely different from Chrome's
- `week` is not implemented in Safari at all

---

## Category 2: Input Types with Built-in UI Controls

These inputs don't open a picker popup, but render browser-specific interactive UI elements inside the field itself.

| Element | Widget | Chrome | Safari | Firefox | Styleable? |
|---------|--------|--------|--------|---------|------------|
| `<input type="range">` | Slider track + thumb | Rounded track with circular thumb | Rounded track with circular thumb (slightly different size) | Square-ish track with circular thumb | Partial — `::webkit-slider-thumb`, `::-moz-range-thumb` (different pseudo-elements per engine) |
| `<input type="number">` | Spinner arrows (increment/decrement) | Up/down arrows inside field (appear on hover) | Up/down arrows (always visible) | Up/down arrows inside field (appear on hover, different styling) | Partial — can hide with `appearance: textfield` + `::-webkit-inner-spin-button` |
| `<input type="search">` | Clear button (×) | × button appears when field has value | × button appears (slightly different icon) | × button appears | Partial — `::-webkit-search-cancel-button` (no Firefox equivalent) |
| `<input type="password">` | Reveal/eye icon | No native toggle (Chrome recently added one behind flag) | Keychain integration icon | No native toggle | No |
| `<input type="checkbox">` | Checkmark box | Square with checkmark animation | Rounded square with check | Square with check (different stroke) | No — `appearance: none` then restyle from scratch |
| `<input type="radio">` | Radio circle | Circle with fill dot | Circle with fill dot (different size) | Circle with fill dot | No — `appearance: none` then restyle |

### Notes:
- `range` requires different pseudo-elements for each engine (`::-webkit-slider-thumb` vs `::-moz-range-thumb` vs `::-ms-thumb`)
- `number` spinners can be removed with `appearance: textfield` + hiding the spinner pseudo
- `checkbox` and `radio` are now customisable via `appearance: none` + `accent-color`, but the native widget still shows by default
- `accent-color` CSS property tints native controls but doesn't change shape/size

---

## Category 3: Non-Input Elements with Browser-Native UI

| Element | Widget | Chrome | Safari | Firefox | Styleable? |
|---------|--------|--------|--------|---------|------------|
| `<select>` | Dropdown menu | OS-native dropdown on mobile; Chromium-styled on desktop | OS-native dropdown (very different look on macOS vs iOS) | Firefox-styled dropdown | Trigger partial (`appearance: none`), dropdown options: **NO** (until `base-select` / `::picker(select)` — Chrome 134+) |
| `<select multiple>` | Scrollable list | Scrollable box with OS-style selection | Scrollable box (different styling) | Scrollable box | Very limited |
| `<textarea>` | Resize handle | Bottom-right resize grip | Bottom-right resize grip (different icon) | Bottom-right resize grip | `resize: none` removes, but grip itself is not styleable |
| `<details>` / `<summary>` | Disclosure triangle | ▶ triangle, rotates on open | ▶ triangle (different size/position) | ▶ triangle (different default) | Partial — `::marker` or `list-style: none` + custom icon |
| `<dialog>` | Modal with backdrop | Renders `::backdrop` (grey overlay) | Renders `::backdrop` | Renders `::backdrop` | Yes — `::backdrop` is styleable, but focus trap behaviour differs |
| `<meter>` | Gauge bar | Green/yellow/red bar with gradient | Green/yellow/red bar (different gradient) | Green/yellow/red bar (different) | Different pseudo-elements per engine: `::-webkit-meter-bar` vs `::-moz-meter-bar` |
| `<progress>` | Progress bar | Blue animated bar | Blue bar (different animation) | Blue bar (different) | Different pseudo-elements: `::-webkit-progress-bar` / `::-webkit-progress-value` vs `::-moz-progress-bar` |
| `<video>` | Media controls | Play, seek, volume, fullscreen, PiP, captions, download | Play, seek, volume, fullscreen, PiP, AirPlay | Play, seek, volume, fullscreen, PiP | No — controls are in user-agent shadow DOM. Can hide with `controls` attr removal + custom UI |
| `<audio>` | Media controls | Play, seek, volume, mute, download | Play, seek, volume, mute | Play, seek, volume, mute | No — same as video. Must rebuild entirely |
| `<datalist>` | Suggestion dropdown (on any `<input list="...">`) | Chrome-styled dropdown below input | Safari-styled dropdown | Firefox-styled dropdown | No — dropdown appearance is entirely browser-controlled |
| Scrollbars | Track + thumb | Styleable via `::-webkit-scrollbar-*` | Styleable via `::-webkit-scrollbar-*` | Only `scrollbar-width` and `scrollbar-color` (no granular parts) | Inconsistent — WebKit has full pseudo-element set, Firefox has limited standard properties |

---

## Category 4: Pseudo-Elements for Native Controls (Cross-Browser Inconsistency)

These pseudo-elements exist but use **different names and capabilities** per engine:

| Control | WebKit (Chrome/Safari) | Gecko (Firefox) |
|---------|----------------------|-----------------|
| Range thumb | `::-webkit-slider-thumb` | `::-moz-range-thumb` |
| Range track | `::-webkit-slider-runnable-track` | `::-moz-range-track` |
| Progress bar fill | `::-webkit-progress-value` | `::-moz-progress-bar` |
| Progress bar track | `::-webkit-progress-bar` | (direct element styling) |
| Meter bar | `::-webkit-meter-bar` | `::-moz-meter-bar` |
| Meter optimum | `::-webkit-meter-optimum-value` | (no equivalent) |
| Meter sub-optimum | `::-webkit-meter-suboptimum-value` | (no equivalent) |
| Meter even-less-good | `::-webkit-meter-even-less-good-value` | (no equivalent) |
| Search cancel | `::-webkit-search-cancel-button` | (no equivalent) |
| Number spinner | `::-webkit-inner-spin-button` | (no equivalent, use `appearance: textfield`) |
| File button | `::file-selector-button` | `::file-selector-button` | ← This one IS standard |
| Scrollbar | `::-webkit-scrollbar`, `::-webkit-scrollbar-thumb`, `::-webkit-scrollbar-track` | `scrollbar-width`, `scrollbar-color` (limited) |
| Details marker | `::marker` / `summary::-webkit-details-marker` | `::marker` |
| Select dropdown | `::picker(select)` (Chrome 134+, experimental) | (not available) |
| Placeholder text | `::placeholder` | `::placeholder` | ← Standard, works everywhere |

---

## Summary: Complete Inventory

### Elements with picker popups (7)
`date`, `time`, `datetime-local`, `month`, `week`, `color`, `file`

### Elements with inline interactive UI (6)
`range`, `number`, `search`, `password`, `checkbox`, `radio`

### Non-input elements with browser-native UI (11)
`<select>`, `<select multiple>`, `<textarea>` (resize), `<details>`/`<summary>`, `<dialog>`, `<meter>`, `<progress>`, `<video>`, `<audio>`, `<datalist>`, scrollbars

### Total: 24 distinct HTML elements/types with browser-native widgets

---

## Relevance to line://ui

| line://ui Component | Replaces native | Why headless is better |
|---------------------|-----------------|----------------------|
| `<line-date-input>` | `<input type="date">` | Consistent segment navigation across all browsers. No random picker popup |
| `<line-date-picker>` | `<input type="date">` (popup) | Controlled calendar UI, composable with DateInput |
| `<line-time-picker>` | `<input type="time">` | Uniform time selection, no spinner vs dropdown inconsistency |
| `<line-color-picker>` | `<input type="color">` | Rich picker UI instead of OS-level dialog. Consistent across platforms |
| `<line-slider>` | `<input type="range">` | Custom parts, consistent track/thumb, no pseudo-element fragmentation |
| `<line-number-input>` | `<input type="number">` | Controlled increment/decrement as `::part()`, not hidden browser arrows |
| `<line-input type="search">` | `<input type="search">` | Internal clear part with consistent behaviour |
| `<line-password-input>` | `<input type="password">` | Built-in toggle part. Not waiting for browsers to ship reveal icons |
| `<line-checkbox>` | `<input type="checkbox">` | Full visual control via `::part()`. No `appearance: none` reset |
| `<line-switch>` | `<input type="checkbox">` | Distinct switch UI, not a hacked checkbox |
| `<line-radio-group>` | `<input type="radio">` | Full visual control via `::part()` |
| `<line-select>` | `<select>` | Fully styleable trigger AND dropdown. No OS-native black box |
| `<line-scroll-area>` | native scrollbar | Consistent custom scrollbar across all engines |
| `<line-accordion>` | `<details>`/`<summary>` | Proper accordion behaviour (exclusive), animation, machine states |
| `<line-dialog>` | `<dialog>` | Consistent focus trap, animation, backdrop behaviour across browsers |
| `<line-progress>` | `<progress>` | Single `::part()` API, not 3 different pseudo-element systems |
| `<line-file-upload>` | `<input type="file">` | Drag-and-drop, preview, validation. Not just a button |
| `<line-audio-player>` | `<audio controls>` | Headless controls. No browser-imposed UI |
| `<line-video-player>` | `<video controls>` | Headless controls. Custom UI, PiP, captions |
| `<line-combobox>` | `<input>` + `<datalist>` | Controlled dropdown, filtering, keyboard nav. Not browser-styled suggestions |

**20 out of 24 browser-native widgets are directly replaced by line://ui components.** The remaining 4 (`month`, `week`, `datetime-local`, `textarea` resize handle) are either niche or handled implicitly.
