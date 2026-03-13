# HTML Elements — Browser Defaults & DOM API Research

**Date:** 2026-03-12
**Context:** Research for line://ui — comprehensive inventory of everything browsers impose on HTML elements, and whether custom elements can inherit native DOM APIs.

---

## Part 1: Browser-Imposed Styles & Behaviours

Everything below is what the browser applies by default, without any author CSS. line://ui needs to neutralise or control ALL of this for every component.

### 1.1 Focus & Outline

| Behaviour | Chrome | Safari | Firefox |
|-----------|--------|--------|---------|
| `outline` on `:focus` | Blue 2px auto outline | Blue glow ring (box-shadow-like) | Dotted 1px dark outline |
| `outline` on `:focus-visible` | Same blue outline, only on keyboard focus | Same glow, only keyboard | Same dotted, only keyboard |
| `outline-offset` | 0px default | 0px default | 1px default |
| Tab order | Follows DOM + `tabindex` | Same | Same |
| Focus ring colour | `Highlight` system colour | System accent colour | `-moz-mac-focusring` or dark | 

**line://ui impact:** Every interactive component must reset `outline` and provide its own `:focus-visible` style via `::part()`. The consumer or theme controls the focus indicator — line://ui exposes it as `::part(focus-ring)` or via `--line-focus-ring-*` custom properties. The base class (LineElement) should apply `outline: none` on `:host` and let the machine-driven `data-focus-visible` attribute handle styling.

### 1.2 Form Elements — Default Styles

| Property | Chrome | Safari | Firefox |
|----------|--------|--------|---------|
| `font-family` | System UI / `-apple-system` | System UI | System UI |
| `font-size` | 13.333px (input, select, textarea) | 11px (smaller!) | 13.333px |
| `padding` | 1px 2px (input) | 1px (input) | 2px (input) |
| `border` | `2px inset` (archaic 3D border) | `1px solid` + inset shadow | `2px inset` |
| `border-radius` | 0px (input) | 5px (Safari rounds inputs by default!) | 0px |
| `margin` | 0 | 0 | 0 |
| `box-sizing` | `content-box` (all form elements!) | `content-box` | `content-box` |
| `background` | White | White with subtle gradient | White |
| `color` | `CanvasText` system colour | `CanvasText` | `CanvasText` |
| `line-height` | `normal` (varies) | `normal` | `normal` |
| `appearance` | `auto` (native look) | `auto` | `auto` |
| `-webkit-appearance` | `textfield` / `checkbox` etc. | `textfield` / `checkbox` | N/A |

**Key problems:**
- Safari adds `border-radius: 5px` to inputs by default — invisible until you try to style them
- All form elements use `content-box` not `border-box` — major gotcha
- Font size differs between Safari (11px) and Chrome/Firefox (13.333px)
- The `appearance: auto` forces native rendering — must be reset to `none`

### 1.3 Label Behaviour

| Behaviour | Chrome | Safari | Firefox |
|-----------|--------|--------|---------|
| `<label for="id">` click → focuses input | Yes | Yes | Yes |
| `<label>` wrapping input → click focuses | Yes | Yes | Yes |
| `cursor` on label | `default` | `default` | `default` |
| `user-select` | Normal (selectable) | Normal | Normal |
| Label + checkbox/radio click | Toggles the control | Toggles the control | Toggles the control |

**line://ui impact:** `<line-field>` must replicate label-to-input association. Since our label is in a `<slot>` and the input is in another slot (or shadow DOM), the native `for` attribute doesn't work cross-shadow-boundary. Field generates a unique ID and uses `aria-labelledby` + forwards click to `.focus()`.

### 1.4 Pseudo-Classes Applied Automatically

These CSS pseudo-classes are applied by the browser automatically. Consumers expect them to work.

| Pseudo-class | Applied to | Condition |
|--------------|-----------|-----------|
| `:focus` | Any focusable element | When element receives focus |
| `:focus-visible` | Any focusable element | When focus is from keyboard (heuristic varies!) |
| `:focus-within` | Any ancestor | When a descendant has focus |
| `:hover` | Any element | Pointer over element |
| `:active` | Any element | Mouse down on element |
| `:disabled` | Form controls | `disabled` attribute present |
| `:enabled` | Form controls | No `disabled` attribute |
| `:checked` | checkbox, radio, option | When selected |
| `:indeterminate` | checkbox, radio, progress | Indeterminate state |
| `:required` | Form controls | `required` attribute present |
| `:optional` | Form controls | No `required` attribute |
| `:valid` | Form controls | Passes constraint validation |
| `:invalid` | Form controls | Fails constraint validation |
| `:user-valid` | Form controls | Valid AFTER user interaction (new!) |
| `:user-invalid` | Form controls | Invalid AFTER user interaction (new!) |
| `:in-range` | `number`, `range`, `date` | Value within min/max |
| `:out-of-range` | `number`, `range`, `date` | Value outside min/max |
| `:placeholder-shown` | Input, textarea | Placeholder visible (no value) |
| `:autofill` | Input | Browser autofilled the value |
| `:-webkit-autofill` | Input (WebKit) | Same, vendor-prefixed |
| `:read-only` | Input, textarea | `readonly` attribute |
| `:read-write` | Input, textarea | Not readonly and not disabled |
| `:default` | Button, checkbox, radio, option | The default in the form |
| `:empty` | Any element | No children |
| `:visited` / `:link` | `<a>` | Link states |
| `:target` | Any element | Matches URL fragment |
| `:open` / `:closed` | `<details>`, `<dialog>`, `<select>` | Open/closed state (new!) |

**line://ui impact:** Most of these DON'T work on custom elements natively. `:disabled`, `:required`, `:valid`, `:invalid` ONLY work on native form controls. For custom elements with `formAssociated: true` + `ElementInternals`, only `:valid`/`:invalid` work (via `setValidity()`). The rest must be replicated with `data-*` host attributes:

| Native pseudo | line://ui equivalent |
|---------------|---------------------|
| `:disabled` | `[data-disabled]` + `CustomStateSet` → `:state(disabled)` |
| `:required` | `[data-required]` + `:state(required)` |
| `:checked` | `[data-checked]` + `:state(checked)` |
| `:focus-visible` | `[data-focus-visible]` + `:state(focus-visible)` |
| `:placeholder-shown` | `[data-empty]` |
| `:readonly` | `[data-readonly]` |
| `:valid` / `:invalid` | Works natively via `ElementInternals.setValidity()` |

**Note on `CustomStateSet`:** The `ElementInternals.states` API (`internals.states.add('checked')` → matches `:state(checked)`) is supported in Chrome 90+, Firefox 126+, Safari 17.4+. This is the modern way — `data-*` attributes are the fallback for older consumers.

### 1.5 Default Margins & Spacing

Elements with non-zero default margins or padding:

| Element | Default margin | Browser |
|---------|---------------|---------|
| `<body>` | `8px` all sides | All |
| `<h1>` | `0.67em` top/bottom | All |
| `<h2>` | `0.83em` top/bottom | All |
| `<h3>` | `1em` top/bottom | All |
| `<h4>` | `1.33em` top/bottom | All |
| `<p>` | `1em` top/bottom | All (slight differences) |
| `<ul>`, `<ol>` | `1em` top/bottom, `40px` left padding | All |
| `<blockquote>` | `40px` left/right margin | All |
| `<figure>` | `40px` left/right margin | All |
| `<hr>` | `0.5em` top/bottom margin, `1px` border | All |
| `<pre>` | `1em` top/bottom | All |
| `<fieldset>` | `2px` border, `0.35em 0.75em 0.625em` padding | Varies slightly! |
| `<legend>` | Complex positioning rules | Varies significantly! |
| `<button>` | `0` (Chrome), `1px 6px` (Firefox) | Inconsistent! |
| `<input>` | `0` (Chrome), slight differences | Minor inconsistencies |
| `<table>` | `2px` border-spacing | All |
| `<th>`, `<td>` | `1px` padding | All |

### 1.6 Default Display & Box Model

| Element | Default `display` | Notes |
|---------|------------------|-------|
| `<div>`, `<p>`, `<h1>`–`<h6>`, `<section>`, etc. | `block` | |
| `<span>`, `<a>`, `<strong>`, `<em>` | `inline` | |
| `<img>`, `<input>`, `<textarea>`, `<select>`, `<button>` | `inline-block` (or `inline`) | Replaced elements — behave as inline but have dimensions |
| `<table>` | `table` | |
| `<li>` | `list-item` | `::marker` pseudo |
| `<details>` | `block` | But internally complex |
| `<summary>` | `list-item` with `::marker` | The marker triangle |
| `<dialog>` | `none` (when closed), `block` (when open) | |
| `<meter>`, `<progress>` | `inline-block` | With internal structure |

### 1.7 Typography Defaults

| Property | Chrome | Safari | Firefox |
|----------|--------|--------|---------|
| Default font | `Times New Roman` (serif) | `Times New Roman` | `Times New Roman` |
| Default font size | `16px` on `<html>` | `16px` | `16px` |
| Form element font | Does NOT inherit! Uses system font | Does NOT inherit! | Does NOT inherit! |
| `<code>`, `<pre>`, `<kbd>` font | `monospace` at smaller size | `monospace` at smaller size | `monospace` |
| `<small>` | `font-size: smaller` | Same | Same |
| `<strong>`, `<b>` | `font-weight: bold` (700) | `font-weight: bold` | `font-weight: bolder` (Firefox differs!) |
| Line height | `normal` (~1.2) | `normal` | `normal` |

**Critical:** Form elements do NOT inherit `font-family` and `font-size` from their parent by default. You must explicitly set `font: inherit` or they use the system font. This catches people constantly.

### 1.8 Colour & Background Defaults

| Property | Light mode | Dark mode (system) |
|----------|-----------|-------------------|
| Text colour | `CanvasText` (black) | `CanvasText` (white) |
| Background | `Canvas` (white) | `Canvas` (dark) |
| Link colour | `LinkText` (blue) | `LinkText` (lighter blue) |
| Visited link | `VisitedText` (purple) | `VisitedText` |
| Selection | `Highlight` / `HighlightText` | Same system colours |
| Placeholder | Varies! Chrome uses `color: -internal-light-dark(...)` | Different per browser |
| `<mark>` | Yellow background | Yellow background |
| `<ins>` | None | None |
| `<del>` | `text-decoration: line-through` | Same |
| `::selection` | System highlight colour | System highlight colour (different per OS) |

### 1.9 Scrollbar Defaults

| Aspect | Chrome | Safari | Firefox |
|--------|--------|--------|---------|
| Width | ~15px (system dependent) | Overlay (appears on scroll, thinner) | ~15px |
| Style | Raised track + thumb | Overlay dark thumb, no track | Raised track + thumb |
| Styling API | `::-webkit-scrollbar-*` (7 pseudo-elements) | `::-webkit-scrollbar-*` | `scrollbar-width`, `scrollbar-color` ONLY |
| Hide | `::-webkit-scrollbar { display: none }` | Same | `scrollbar-width: none` |
| Overlay on macOS | Only with "When scrolling" preference | Default behaviour | Only with preference |

### 1.10 Animation & Transition Defaults

| Behaviour | Chrome | Safari | Firefox |
|-----------|--------|--------|---------|
| `transition` on load | Doesn't fire | Doesn't fire | May fire on some elements! |
| `<details>` open animation | None (instant) | None | None (CSS `::details-content` is new, Chrome 131+) |
| `<dialog>` open animation | Abrupt show | Abrupt show | Abrupt show |
| Reduced motion | Respects `prefers-reduced-motion` | Same | Same |
| Smooth scroll | `scroll-behavior: smooth` supported | Supported | Supported |

---

## Part 2: Can a Custom Element Inherit Native DOM APIs?

### The Question

Can `<line-input>` have `.value`, `.validity`, `.select()`, `.setSelectionRange()`, `.selectionStart`, `.selectionEnd` etc. — the full `HTMLInputElement` API — without using an actual `<input>` tag internally?

### The Short Answer

**No, not directly.** There are two paths, and both have significant trade-offs.

### Path A: Customized Built-In Elements (`extends HTMLInputElement`)

```js
class LineInput extends HTMLInputElement {
  // Has FULL HTMLInputElement API: .value, .validity, .select(), etc.
}
customElements.define('line-input', LineInput, { extends: 'input' });
```

Usage: `<input is="line-input">` (not `<line-input>`)

**What you get:**
- Full `HTMLInputElement` API — `.value`, `.validity`, `.select()`, `.setSelectionRange()`, `.selectionStart`, `.selectionEnd`, `.files`, `.valueAsDate`, `.valueAsNumber`, etc.
- Native form participation — no `ElementInternals` needed
- All native pseudo-classes work (`:valid`, `:disabled`, `:required`, etc.)
- Progressive enhancement — renders as `<input>` if JS fails

**What you DON'T get:**
- **No Shadow DOM** — you cannot attach a shadow root to a built-in element. Zero encapsulation.
- **No `::part()`** — no shadow DOM means no parts, no internal structure. You can only style the element itself.
- **No Safari support. Ever.** WebKit marked this as "won't fix". Apple's position is ideological — they believe customized built-ins harm the web platform's long-term health. There's a polyfill (`@ungap/custom-elements-builtin`, ~1KB) but it has limitations.
- **Tag name is `<input>`, not `<line-input>`** — you use `<input is="line-input">`, breaking the brand identity.
- **No composition** — you can't have sub-components like `<line-input-prefix>`.

**Verdict for line://ui:** Dead end. No Shadow DOM = no `::part()` = no headless customisation. No Safari = no cross-browser. The tag name is `<input>` not `<line-input>`. Incompatible with every core principle.

### Path B: Autonomous Custom Element + ElementInternals

```js
class LineInput extends LitElement {
  static formAssociated = true;
  #internals = this.attachInternals();
  
  // Manually implement what you need:
  get value() { return this._value; }
  set value(v) { 
    this._value = v;
    this.#internals.setFormValue(v);
  }
}
customElements.define('line-input', LineInput);
```

Usage: `<line-input>` (proper custom element tag)

**What `ElementInternals` gives you (native, no polyfill):**
- `setFormValue(value)` — participates in `FormData`
- `setValidity(flags, message, anchor)` — constraint validation
- `checkValidity()` / `reportValidity()` — form validation API
- `.form` — reference to parent form
- `.validity` — `ValidityState` object
- `.validationMessage` — validation message string
- `.willValidate` — boolean
- `.labels` — associated `<label>` elements
- `formDisabledCallback()` — called when form/fieldset disables
- `formResetCallback()` — called on form reset
- `formStateRestoreCallback()` — called on browser restore (back/forward)
- ARIA properties: `.role`, `.ariaLabel`, `.ariaChecked`, etc.
- `CustomStateSet` (`.states`) — `:state(checked)`, `:state(disabled)`, etc.

**What `ElementInternals` does NOT give you:**
- `.select()` — must implement manually (delegate to internal `<input>`)
- `.setSelectionRange()` — must delegate to internal `<input>`
- `.selectionStart` / `.selectionEnd` — must delegate
- `.setRangeText()` — must delegate
- `.valueAsDate` / `.valueAsNumber` — must implement manually
- `.files` (for file input) — must implement manually
- `.type` — must implement as property
- `:disabled` / `:required` pseudo-class — use `CustomStateSet` → `:state(disabled)`
- `:checked` — use `:state(checked)`
- `:placeholder-shown` — use `[data-empty]` or `:state(empty)`
- Autocomplete / autofill integration — partially works (limited)
- Password manager integration — requires internal `<input type="password">`
- Speech-to-text / dictation — requires internal `<input>`
- IME (Input Method Editor) for CJK — requires internal `<input>`

### Path B Reality: The Hybrid Approach

In practice, every headless library (Radix, Ark UI, Shoelace, FAST) uses Path B with an **internal native `<input>` in the shadow DOM**. The custom element wraps a real `<input>` and delegates the APIs that can't be replicated:

```js
class LineInput extends LitElement {
  static formAssociated = true;
  #internals = this.attachInternals();
  
  // Delegation to internal <input>
  select() { this.shadowRoot.querySelector('input').select(); }
  setSelectionRange(...args) { this.shadowRoot.querySelector('input').setSelectionRange(...args); }
  get selectionStart() { return this.shadowRoot.querySelector('input').selectionStart; }
  
  // Own implementation via ElementInternals
  get value() { return this._value; }
  set value(v) {
    this._value = v;
    this.#internals.setFormValue(v);
  }
  
  render() {
    return html`<input part="input" @input=${this.#onInput} />`;
  }
}
```

**Why you NEED the internal `<input>`:**

1. **IME composition** — Chinese/Japanese/Korean input requires `compositionstart`/`compositionupdate`/`compositionend` events that only fire on `<input>`/`<textarea>`. A `<div contenteditable>` partially works but has different behaviour.

2. **Password managers** — 1Password, Bitwarden, LastPass etc. look for `<input type="password">` in the DOM. Without it, autofill doesn't work. Some password managers now detect shadow DOM inputs, but not all.

3. **Mobile keyboard hints** — `inputmode="email"`, `inputmode="numeric"`, `enterkeyhint="search"` etc. only work on `<input>` and `<textarea>`. A custom element without an internal input gets the default keyboard.

4. **Browser autofill** — Autocomplete for addresses, credit cards, names. Browsers look for `<input autocomplete="...">`. Without a real input, autofill breaks.

5. **Dictation / speech-to-text** — OS-level speech input targets native `<input>` and `<textarea>`. Doesn't work on custom elements.

6. **Selection API** — `selectionStart`, `selectionEnd`, `setSelectionRange()`, `setRangeText()`. These are only available on `HTMLInputElement` and `HTMLTextAreaElement`. No way to implement them on a `<div>`.

7. **Clipboard behaviour** — Cut/copy/paste with proper undo/redo stack. Native `<input>` has this. A custom element with `contenteditable` has a different (worse) undo model.

### The Answer for line://ui

**You cannot avoid `<input>` inside your shadow DOM for text-input components.** The platform APIs that matter (IME, password managers, autofill, selection, mobile keyboards) are only available on native `<input>` and `<textarea>`.

What you CAN do — and what line://ui already does — is:

1. **Wrap it** — The native `<input>` lives inside shadow DOM as `::part(input)`. The consumer sees `<line-input>`, not `<input>`.

2. **Control it** — The Zag.js machine manages all state. The internal `<input>` is a dumb rendering target that receives values from the machine.

3. **Expose it** — Via `::part(input)` the consumer can style the native input directly. Via delegation, `.select()`, `.setSelectionRange()` etc. work on the custom element.

4. **Add to it** — The wrapper adds what `<input>` can't do: prefix/suffix slots, clear button, password toggle, error states, all coordinated by the machine.

5. **Form-integrate it** — `ElementInternals` makes `<line-input>` a first-class form participant. `FormData` includes it. Validation works. Labels associate.

**For non-text components** (checkbox, radio, switch, slider, select, rating, color picker, date picker) — there's no need for an internal `<input>`. These are fully custom UI with `ElementInternals` providing form participation. The visual rendering is entirely custom, and the native equivalents don't provide any API that can't be replicated.

### Summary Matrix

| Component type | Internal native element | Reason |
|----------------|------------------------|--------|
| Text input | `<input>` in shadow DOM | IME, autofill, password managers, selection API, mobile keyboards |
| Password input | `<input type="password">` | Password manager detection |
| Search input | `<input>` | Autofill, IME |
| Textarea | `<textarea>` | IME, selection API, speech-to-text |
| File upload | `<input type="file">` | OS file dialog (no JS API to open it otherwise) |
| Checkbox | None needed | `ElementInternals` + custom rendering |
| Radio | None needed | `ElementInternals` + custom rendering |
| Switch | None needed | Custom rendering |
| Select | None needed | Custom dropdown, `ElementInternals` for form value |
| Slider / Range | None needed | Custom track/thumb, `ElementInternals` |
| Color picker | None needed | Custom spectrum/sliders |
| Date picker | None needed (or optional `<input>` for DateInput segments) | Custom calendar UI |
| Rating | None needed | Custom star rendering |
| Number input | Optional `<input type="text" inputmode="numeric">` | Mobile numeric keyboard |
