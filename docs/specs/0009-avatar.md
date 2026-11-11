# Avatar

| Field | Value |
|-------|-------|
| Status | `approved` (Miguel, 2026-11-11) |
| Phase | `1` |
| Tier | `Static` (Phase 1 spec §6.C.4 C10 row, `docs/specs/01-spec-core-primitives.md:1166`; PRD §4.1, `docs/PRD.md:253`; ARCH §8, `docs/ARCHITECTURE.md:410`; ARCH §13.2, `docs/ARCHITECTURE.md:605`) |
| Tag | `line-avatar` |
| Entrypoint | `@websublime/line-components/avatar` (Phase 1 spec §4.2, `:249`, `:298`) |
| Form-associated | `no` (Phase 1 spec §6.C.4 C10 row) |
| PRD catalogue entry | PRD §4.1, `Avatar` row (`docs/PRD.md:253`) |
| Ledger row | `01-C10` (`docs/plans/01-tasks-core-primitives.md:56`) |
| Governing sections | Phase 1 spec §4 (`:249`, `:298`), §6.C.0, §6.C.4 (C10 row `:1166`, notes `:1178-1183`), §6.C.6 (`:1218-1233`), §6.G.1–§6.G.5, §7.4, §7.8, §10 SD4, SD12, SD31, SD34, SD37, SD38, SD39, SD57, SD98, SD99, §12 AM-021, AM-058, AM-092, AM-094; ARCH (v0.8.26) §3, §5, §8, §12, §13.2, §14.6–§14.8, §17.2–§17.4; PRD §4.1, §5.2, §8; MANIFESTO Laws 1–5, 9, Out of Scope; R7 §2.4, §6 OQ6; R8 §2.2; R9 §2.1 |

Text marked `[INFERENCE]` has no probe or source behind it yet. Miguel decided Open Questions F1–F13 on 2026-11-11 and approved the spec the same day; Part B states those decisions. The orchestrator defaults D1–D17 stand as drafted (Miguel, 2026-11-11).

---

## Probes

Throwaway probes ran on 2026-11-10 to inform F1–F7, F11 and F12 and defaults D5, D6 and D14. Their code lived in `packages/line-components/temp/c10-probe/`, which `.gitignore` ignores through its `temp` entry, and was deleted after the run. Nothing of it is committed.

### Setup

| Item | Value |
|---|---|
| Host | macOS 27.2, arm64; Bun 1.4.3 |
| Runner | Playwright 1.64.0 with its own engines, chromium 156.0.8078.4, firefox 157.0 and webkit 27.2; one config with three projects |
| Pages | served by `page.route` on `http://probe.test/`: `/ok.png` a valid 4×4 PNG, `/slow.png` the same after 400 ms, any other path a 404 |
| axe | `@axe-core/playwright` 4.14.0 with axe-core 4.14.0, one run per case, once with the §7.4 tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and once with every rule |
| Chromium accessibility tree | a CDP session, `Accessibility.getFullAXTree`, walked from each case's wrapper through `DOM.querySelector` and `DOM.describeNode`, reading `role` and `name` of every node that is not ignored |
| Other engines | an internals read-back and Playwright's `ariaSnapshot()`, which Playwright computes itself from the DOM |

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `bunx playwright test -c packages/line-components/temp/c10-probe/playwright.config.ts` | 0 | 9 passed; discarded, because Firefox rejected the hand-written PNG (`load` with `naturalWidth` 0, then `error`) |
| 2 | `python3 -c …` writing a 4×4 PNG with correct CRCs through `zlib` | 0 | base64 PNG for the fixture |
| 3 | the command of row 1 | 0 | 9 passed (45.0 s) |
| 4 | the command of row 1, with the wrapper cases of P5 and the eager case of P4 added | 0 | 9 passed (45.5 s); the results below |
| 5 | the command of row 1 with the filter `initials` | 0 | 3 passed (2.0 s); P6 |
| 6 | `node v.mjs` printing `browser.version()` per engine | 0 | the versions above |
| 7 | `rm -rf packages/line-components/temp/c10-probe` | 0 | deleted |

The probe host `<probe-avatar>` was a plain `HTMLElement` with an open shadow root. It attached its `ElementInternals` in a class field, as `LineElement` does (`packages/line-core/src/line-element.ts:31`). It set `data-state` to `loading`, then `loaded` or `error` from the `load` and `error` events of its image, and CSS showed the image only while `loaded` and the fallback otherwise. A `mode` attribute placed the role and the name.

| Mode | Shadow tree and semantics |
|---|---|
| `host-img` | `internals.role = 'img'`, named by the host `aria-label`; inner `<img alt="">`, fallback `<span>` with the `fallback` slot, `status` slot |
| `inner-wrap` | no host role; `<span part="root"><span role="img" aria-label="…"><img alt=""><span><slot name="fallback"></span></span><slot name="status"></span>`, the label from a `label` attribute |
| `inner-img` | no host role; `<img alt="…">` and a fallback `<span role="img" aria-label="…">`, the label from a `label` attribute; the status slot outside both |
| `slotted` | no host role; the consumer's light-DOM `<img alt="…">` in the default slot, tracked by the host |
| `host-none` | `internals.role = 'none'`, inner tree as `host-img` |
| `host-hidden` | `internals.ariaHidden = 'true'`, inner tree as `host-img` |
| `inner-hidden` | no host role; inner `<img alt="">` and the fallback `<span aria-hidden="true">` |

Each case put `<span slot="fallback">AS</span>` in the fallback slot, named "Ana Silva" unless it says unnamed, and, where it says status, `<span slot="status" role="img" aria-label="Online">` in the status slot. Each case was mounted twice in one `<main>`, alone in a `<div>` and as the only content of `<a href="#">`. The probe did not use Lit or `LineElement` [INFERENCE: neither changes what an engine exposes for a given shadow tree or internals value].

### P1 — Chromium accessibility tree

| Case | Alone | Name of the enclosing link |
|---|---|---|
| `host-img`, loaded | `image` "Ana Silva" | "Ana Silva" |
| `host-img`, error | `image` "Ana Silva" over `StaticText` "AS" | "Ana Silva" |
| `host-img`, loaded, status | `image` "Ana Silva" over `image` "Online" | **"Ana Silva"**; the status is left out |
| `host-img`, unnamed, loaded | `image` "" | "" |
| `host-img`, unnamed, error | `image` "" over `StaticText` "AS" | "" |
| `inner-wrap`, loaded | `generic` "" over `image` "Ana Silva" | "Ana Silva" |
| `inner-wrap`, error | `generic` "" over `image` "Ana Silva" over `StaticText` "AS" | "Ana Silva" |
| `inner-wrap`, loaded, status | `generic` "" over `image` "Ana Silva" and `image` "Online" | **"Ana Silva Online"** |
| `inner-wrap`, unnamed, error | `generic` "" over `image` "" over `StaticText` "AS" | "" |
| `inner-wrap`, host `aria-label` only | `generic` "Ana Silva" over `image` "" | "Ana Silva" |
| `inner-img`, loaded | `generic` "" over `image` "Ana Silva" | "Ana Silva" |
| `inner-img`, error | `generic` "" over `image` "Ana Silva" over `StaticText` "AS" | "Ana Silva" |
| `inner-img`, loaded, status | `generic` "" over `image` "Ana Silva" and `image` "Online" | "Ana Silva Online" |
| `inner-img`, unnamed, loaded | `generic` "" over `image` "" | "" |
| `slotted`, loaded | `generic` "" over `image` "Ana Silva" | "Ana Silva" |
| `slotted`, error | `generic` "" over `StaticText` "AS" | **"AS"**; the name left with the hidden image |
| `host-none`, error, status | `StaticText` "AS", `image` "Online" | "AS Online" |
| `host-hidden`, error, status | nothing | "Online" |
| `inner-hidden`, error | `generic` "" | "" |
| `inner-hidden`, loaded, status | `generic` "" over `image` "Online" | "Online" |

- An `img` role on the host keeps a slotted status out of the name of a link around the avatar, because ARIA makes the children of `img` presentational. A role on a shadow element that leaves the `status` slot outside it gives "Ana Silva Online".
- A host `aria-label` on a host with no role names a `generic` node, which ARIA prohibits (R8 `docs/research/01-research-accessibility.md:55`), and leaves the inner `img` unnamed.
- A consumer image named by its `alt` loses the name when it is hidden on error; the link is then named by the initials, "AS".
- `role = 'none'` on the host hides nothing; the initials and the status stay exposed.
- With an internals-hidden host, Chromium still puts the status "Online" in the link's name [INFERENCE: the same quirk as `0007-badge.md` Probe P1, cause unknown].
- Chromium exposes a role-less host of these modes as an unnamed `generic` [INFERENCE: `display: inline-block` with `position: relative` may cause it; not isolated].

### P2 — Internals read-back and Playwright `ariaSnapshot()`, three engines

| Check | chromium | firefox | webkit |
|---|---|---|---|
| Internals read-back of every case | the value each `mode` wrote: `role` `img` or `none`, `ariaHidden` `true`; every other value `null` | same | same |
| `ariaSnapshot()` of `host-img`, loaded, alone | empty | empty | empty |
| `ariaSnapshot()` of `host-img`, loaded, status, in the link | `link "Ana Silva"` over `img "Online"` | same | same |
| `ariaSnapshot()` of `inner-wrap`, loaded | `img "Ana Silva"` | same | same |
| `ariaSnapshot()` of `inner-wrap`, loaded, status, in the link | `link "Ana Silva Online"` over `img "Ana Silva"` and `img "Online"` | same | same |
| `ariaSnapshot()` of `host-hidden`, error, status | `text: AS`, `img "Online"` | same | same |

- Playwright's snapshot reads no internals value. It sees a role on a shadow element in all three engines, so it can check a shadow role cross-engine where it cannot check an internals role (D14).

### P3 — axe

The results were the same in chromium, firefox and webkit, and the same with the §7.4 tags as with every rule.

| Case | Alone | In the link |
|---|---|---|
| `inner-wrap`, unnamed, error | `role-img-alt` | `role-img-alt` |
| `inner-wrap`, host `aria-label` only | `role-img-alt` | `role-img-alt` |
| `inner-img`, unnamed, loaded | `image-alt` | `image-alt`, `link-name` |
| `inner-img`, unnamed, error | `role-img-alt` | `role-img-alt` |
| `slotted`, unnamed, loaded | `image-alt` | `image-alt`, `link-name` |
| `host-img`, unnamed, loaded | none | `link-name` |
| `host-hidden`, error, status | none | `link-name` |
| `inner-hidden`, error | none | `link-name` |
| every other case, `host-img` unnamed with initials included | none | none |

- axe checks a role or an `<img>` in an open shadow root and in light DOM, and flags it unnamed (`role-img-alt`, `image-alt`).
- axe ignores the internals role, so an unnamed `host-img` passes unless an enclosing link ends up without a name (Phase 1 spec §7.4, `:2122-2123`).

### P4 — Image events, three engines

An `<img alt="">` in an open shadow root went through the steps below; the log recorded each event and `complete` and `naturalWidth` right after each step.

| Step | chromium | firefox | webkit |
|---|---|---|---|
| set `src` to a slow URL | `load` after about 400 ms | same | same |
| set `src` to a 404 URL | `error` about 2 ms later | same | same |
| set `src` to a good URL | `load` about 2 ms later | same | same |
| remove the `src` attribute | no event; `complete` `true`, `naturalWidth` 0 | same | same |
| set the good URL again (cached) | `complete` `true` at once, then `load` | `complete` `false` at once, then `load` | as chromium |
| set `src` to `""` | `error` | same | same |
| set a slow URL, then a good URL 100 ms later | one `load`, for the good URL; no `abort`, no event for the slow one | same | same |
| set `src` to `http://[bad` | `error` | same | same |
| set a `data:` GIF | `load` | same | same |

| Hidden image | chromium | firefox | webkit |
|---|---|---|---|
| `loading="lazy"`, `display: none`, in the viewport | never loads (`complete` `false` after 1.5 s) | same | same |
| `loading="lazy"`, `visibility: hidden` | loads | same | same |
| `loading="lazy"`, `opacity: 0` | loads | same | same |
| eager, `display: none` | loads | same | same |

- Every `src` that is set fires exactly one `load` or `error` for the URL that is current, cached or not, so the component never needs to read `complete` (D6).
- Removing `src` fires nothing, so the component clears its flags itself; an empty `src` fires `error`, so a blank `src` is treated as absent (D6).
- A hidden lazy image loads only when it keeps a box, so the inactive image is hidden with `visibility`, not `display` (D5).

### P5 — Custom properties across a group (three engines, identical)

`<probe-sized>` declared `--line-avatar-size: 32px` on `:host` and `48px` on `:host([size=lg])`. `<probe-group>` set `--line-avatar-size: 40px`, a 2px ring width and `margin-inline-start: -8px` on `::slotted(*)`. `<probe-fallback>` declared nothing on `:host` and read `var(--line-avatar-size, 32px)`; `<probe-inherit-group>` set `--line-avatar-size: 40px` on its own `:host`.

| Case | Size |
|---|---|
| `probe-sized size="lg"` alone | 48 |
| `probe-sized size="lg"` slotted in `probe-group` | **40**; the group's `::slotted` beats the avatar's `:host([size])` |
| the same, with a document rule `#doc probe-sized { --line-avatar-size: 56px }` | 56; the document rule beats both |
| `probe-sized` inside `<a>` inside `probe-group` | **32**; `::slotted` reaches only the `<a>`, and the avatar's `:host` default blocks inheritance |
| `probe-fallback` inside `<a>` inside `probe-inherit-group` | **40**; inherited through the wrapper |
| `probe-fallback` slotted in `probe-inherit-group` | 40 |
| `probe-fallback` alone | 32 |

- The ring width and the negative margin from `::slotted(*)` reached each directly slotted host.

### P6 — Initials rule (three engines, identical)

`Intl.Segmenter` exists in all three. The rule took the first grapheme of the first and of the last whitespace-separated word, then `toLocaleUpperCase(lang)`.

| `name` | `lang` | Initials |
|---|---|---|
| "Ana Silva" | `en` | "AS" |
| "  ana   maria  silva " | `en` | "AS" |
| "Ana" | `en` | "A" |
| "王小明" | `zh` | "王" |
| "Émile Zola", precomposed and with a combining accent | `fr` | "ÉZ" for both |
| "👩‍💻 Dev Team" | `en` | "👩‍💻T" |
| "ilker ışık" | `tr` | "İI" |
| "ilker ışık" | `en` | "II" |
| "" | `en` | "" |

### What the probes settle

- A role on a shadow element that wraps the image and the fallback, with the `status` slot outside it, names the avatar once, keeps a named status in the enclosing link's name, and is visible to axe and to Playwright (P1–P3; F2, F6).
- A role on the host through internals drops a slotted status from the enclosing name and is invisible to axe and Playwright (P1–P3; F2).
- A name on the consumer's light-DOM `<img alt>` vanishes when the image is hidden on error (P1; F1).
- The `load` and `error` events alone drive the fallback switch, and a removed or blank `src` needs its own branch (P4; F5, D6).
- A size or ring that a group must reach through a wrapper such as a link crosses only when the avatar reads the property with a fallback and declares no default on `:host` (P5; F7, F12).
- Initials need graphemes and the element's language, and still differ by locale (P6; F4).

### What automation cannot observe

- What a screen reader says for any case. VoiceOver and NVDA may still read the presentational children of a host `img` [INFERENCE: not run].
- Firefox and WebKit exposure to assistive technology. The read-back proves values, and the snapshot is Playwright's own computation (Phase 1 spec `:1180`; §12 AM-058).

---

## Part A — Requirements

### Overview

#### Description

`<line-avatar>` is a small picture that stands for a person or an organisation: a photo, a logo, or the initials of a name when there is no picture (PRD §4.1, `docs/PRD.md:253`). The consumer sets `src` to an image URL and `name` to the name. The component shows the image once it has loaded, and shows the fallback while it loads, when it fails and when there is none (F1, F5). The fallback is the consumer's `fallback` slot content, or initials the component takes from `name` (F4). A consumer who needs `srcset`, `<picture>` or an inline SVG logo puts that element in the default slot instead (F1). Assistive technology meets one image named by `name`, or by the host `aria-label` when the spoken name should differ; an avatar with neither is decorative and silent (F2, F3). A `status` slot places a presence marker, such as a green `<line-badge>` dot named "Online", over the corner, and its name follows the avatar's (F6). Size, corner radius, colours, a separating ring and the status visibility are `--line-avatar-*` tokens that a container can set by inheritance, which is how `<line-avatar-group>` (row 01-C11) stacks avatars without importing this component (F7, F8, F12). It holds no machine, takes no focus and fires no event (ARCH §13.2, `docs/ARCHITECTURE.md:605`).

#### Use cases

- A user's photo beside a comment, a message or a list row, with the name written next to it; the avatar is decorative (F3).
- The account button in a header, where the avatar is the only content of a link or button and gives it its name, such as "Ana Silva" (probe P1).
- A person's presence, a green dot named "Online" in the `status` slot, read after the name as "Ana Silva Online" (F6; probe P1).
- An organisation's logo as an inline `<svg>` in the default slot, with a square radius set through `--line-avatar-radius` (F1, F8).
- Initials when a person has no photo or the photo fails, such as "AS" for "Ana Silva" (F4).
- A stack of participants inside `<line-avatar-group>` with an overlap ring and a "+3" overflow (row 01-C11; F12).
- An agent-built avatar on `<line-a2ui-surface>`, from a `line` catalog `Avatar` node or a basic catalog `Image` node with `variant: "avatar"` (Phase 1 spec §6.C.4, `:1182`; F9–F11).

#### Anti-patterns

- A content picture, a product photo or an illustration. Use a native `<img>`, or `Image` on the agent path.
- A symbol or a glyph. Use `<line-icon>` (`0014-icon.md`).
- A clickable avatar on its own. Avatar takes no focus; put it inside a link or a `<line-button>`, which then takes the avatar's name (probe P1).
- A presence state carried by colour alone. WCAG 1.4.1 forbids it (MANIFESTO Law 3, `docs/MANIFESTO.md:43`); name the status element, such as `aria-label="Online"` on the badge (F6).
- An avatar named twice, with `name` set and the same name written next to it. Leave the avatar decorative instead (F3).
- An image URL from untrusted input in hand-written markup. The component applies no URL policy; only `<line-a2ui-surface>` does (D15).

#### User expectations

- The picture appears as soon as it has loaded, with no broken-image icon and no alt text drawn in its place (D5).
- While the picture loads or after it fails, the initials or the consumer's fallback show in the same circle (F4, F5).
- A screen reader announces the avatar once, by the person's name, or not at all when the name is written beside it (F2, F3).
- A presence marker is announced with its own name after the person's (F6).
- The avatar never takes focus and never moves focus.
- Consumer CSS on `line-avatar`, `::part(root)`, `::part(image)` and `::part(fallback)` overrides every visual default (ARCH §4).

### Connections

| Component | Relation | Connects through |
|-----------|----------|------------------|
| `<line-badge>` | child | the `status` slot; a named dot such as `<line-badge slot="status" variant="success" aria-label="Online">`, positioned by Avatar's `::slotted([slot="status"])` rule (F6; `0007-badge.md` F8, which leaves the overlay to the anchor's slot). Avatar never imports Badge (MANIFESTO Law 4, `docs/MANIFESTO.md:45`; Phase 1 spec §6.C.6, `:1228`) |
| `<line-icon>` | child | the default slot, as custom media in place of the image (F1), or the `fallback` slot, as a fallback glyph (F4) |
| `<line-avatar-group>` (row 01-C11, `docs/specs/0010-avatar-group.md`, not yet written) | parent | its default slot; it sets `--line-avatar-size`, `--line-avatar-ring-width`, `--line-avatar-ring-color` and `--line-avatar-status-visibility` on its host or on `::slotted(*)`, and overlaps hosts through `::slotted(*)` `margin-inline-start`. It never imports Avatar and never writes attributes on slotted avatars (Phase 1 spec §10 SD4, `:2351`; §6.C.4, `:1153`, `:1167`; F12). The pinned contract is under Agent contract, "AvatarGroup contract" |
| `<line-button>`, links | parent | the default slot of the button or the content of the link; the avatar's name becomes the control's name, and a slotted status joins it (probe P1, with a native link) |
| `<line-stack>` | parent | beside a name in a horizontal Stack, with the avatar decorative (F3) |
| `<line-a2ui-surface>` | orchestrator | creates `line-avatar` by tag from a `line` catalog `Avatar` node or a basic `Image` node with `variant: "avatar"`, writes `src` behind the URL policy and `name`, wires a `status` child into the `status` slot, and sets `accessibility.label` as the host `aria-label` (ARCH §17.3, `docs/ARCHITECTURE.md:1611`; §17.4, `:1636`, `:1641`; F9–F11) |

### Variants

| Attribute | Values | Use when |
|-----------|--------|----------|
| none | — | — |

- Avatar has no `size` enum. Size is the `--line-avatar-size` token, read with a fallback so a container sets it by inheritance (F7).
- Avatar has no `shape` enum. The corner is the `--line-avatar-radius` token (F8).
- The image, initials and custom-media forms are not variants. They follow from `src`, the slots and the load state (F1, F5).

---

## Part B — Technical Specification

### Anatomy

```
<line-avatar>                                  LineElement; display: inline-block; position: relative; size from --line-avatar-size
└── #shadow-root
    ├── <span part="root" role="img"            the frame: radius, fill, ring, clip; role and aria-label only while named (F2, F3)
    │         aria-label="…">
    │   ├── <slot>                               custom media (F1); its fallback content is the image below
    │   │   └── <img part="image" alt="">        rendered while `src` is set; visible only after `load` (F5, D5)
    │   └── <span part="fallback">               visible while no image shows; aria-hidden="true" while decorative (F3)
    │       └── <slot name="fallback">           consumer fallback; its fallback content is the computed initials (F4)
    └── <slot name="status">                     presence marker over the inline-end, block-end corner (F6)
```

- Three zones follow ARCH §13.2, `docs/ARCHITECTURE.md:605`. The slots are the default, `fallback` and `status`; the parts are `root`, `image` and `fallback`. No other part is added (F6 option (b) names the one that would need an ARCH change).
- The image is an internal part because the component coordinates it with its load state; the fallback content and the status are slots because the consumer decides them (ARCH §3, `docs/ARCHITECTURE.md:219-226`).
- `root` is a one-cell grid. The image, the custom media and the fallback all sit in that cell; the inactive one is hidden with `visibility: hidden`, so a lazy image keeps loading (probe P4; D5). `root` clips with `overflow: hidden` and `border-radius`, and draws the ring as `box-shadow`, which the clip does not cut.
- The `status` slot sits outside `root`, so the clip leaves the marker whole and the marker's name stays outside the `img` role (probe P1; F2, F6).
- The host extends `LineElement` (`packages/line-core/src/line-element.ts:31-36`) without the `FormAssociated` mixin. `:host { display: inline-block; position: relative }` and `:host([hidden]) { display: none }`, because `display` on `:host` beats the UA `[hidden]` rule (`0007-badge.md` D3).
- The default slot holds custom media when it has an element assigned. Then the internal `<img>` is not rendered, `src` is ignored and the fallback stays hidden (F1).

### States

| Field | Value |
|-------|-------|
| Machine | `none` (Static tier; ARCH §8, `docs/ARCHITECTURE.md:410`; ARCH §13.2; Phase 1 spec §10 SD37, `:2384`, which answers R7 §6 OQ6 with Static) |

| State | Entered on | Left on | Host reflection |
|-------|------------|---------|-----------------|
| none | — | — | — |

| Flag | Source | Host reflection |
|------|--------|-----------------|
| `loading` (F5) | a non-blank `src` was set and neither `load` nor `error` has fired for it, with no custom media slotted | `data-loading`, `:state(loading)` through `reflectState` (`line-element.ts:46-53`; ARCH §14.8, `docs/ARCHITECTURE.md:1230`) |
| `error` (F5) | the image fired `error` for the current `src` | `data-error`, `:state(error)` (ARCH §14.8, `:1234`) |

| Situation | `loading` | `error` | Shows |
|---|---|---|---|
| no `src`, or a blank one, and no custom media | off | off | fallback |
| `src` set, waiting | on | off | fallback |
| `src` loaded | off | off | image |
| `src` failed | off | on | fallback |
| custom media slotted | off | off | custom media |

- The flags follow the image's `load` and `error` events, which fire once for every `src` that is set, cached or not (probe P4). An event for a `src` that is no longer current is dropped (D6).
- `loaded` is not a flag. ARCH §14.8 has no `loaded` row, and "`src` set, not loading, not error" selects it (F5).

### Slots

| Slot | Kind | Accepts |
|------|------|---------|
| `(default)` | `ComponentId` | custom media shown in place of the `src` image: an `<img>` with `srcset` or `loading="lazy"`, a `<picture>`, an inline `<svg>` or a `<line-icon>`. No load tracking; give it `alt=""` or no name, because the avatar's role makes it presentational (F1, F2) |
| `fallback` | `ComponentId` | the fallback content, such as initials written by the consumer or a `<line-icon>`; when empty, the component shows initials from `name` (F4) |
| `status` | `ComponentId` | one presence marker, such as a named `<line-badge>` dot; it carries its own name (F6) |

### Parts

| Part | Element | Purpose |
|------|---------|---------|
| `root` | `<span>` | the frame: size, radius, fill, ring and clip; the element with the `img` role while named |
| `image` | `<img>` | the `src` picture; `object-fit` from `--line-avatar-fit` |
| `fallback` | `<span>` | the fallback box, centred, holding the initials or the `fallback` slot, with its text colour and font |

### Props

| Property | Attribute | Type | Default | Reflects | Description |
|----------|-----------|------|---------|----------|-------------|
| `src` | `src` | `string` | `''` | no | the image URL; blank means no image (D6) |
| `name` | `name` | `string` | `''` | no | the person's or organisation's name; the accessible name unless the host has `aria-label`, and the source of the initials (F2, F4) |

- The host also takes `aria-label` and `aria-description` as observed attributes, as Badge does (`packages/line-components/src/badge/badge.ts:136-139`). A non-blank `aria-label` names the avatar in place of `name`; `aria-description` is copied to `root` (F2; D10).
- No `size`, `shape`, `loading`, `srcset`, `crossorigin` or `referrerpolicy` prop. Size and shape are tokens (F7, F8); native image attributes come with custom media in the default slot (F1; D16).

**Semantics on `root`** (F2, F3; D10)

| Accessible name (trimmed host `aria-label`, else trimmed `name`) | `root` `role` | `root` `aria-label` | `fallback` part `aria-hidden` | internal `<img>` `alt` |
|---|---|---|---|---|
| non-empty | `img` | the name | absent | `""` |
| empty (decorative) | absent | absent | `"true"` | `""` |

- The component writes these attributes in its own shadow tree during render, from `name` and the observed `aria-label` and `aria-description`. It writes no `role` or `aria-*` on the host and sets no internals role.
- A host `aria-label` stays on the host as the author wrote it, so Chromium also exposes a named `generic` host, as it does for Button (Phase 1 spec §6.C.4 C1 row, `:1157`; probe P1, the host `aria-label` case). `name` avoids it, and the docs lead with `name`.

### Events

| Event | `detail` type | Fires when |
|-------|---------------|------------|
| none | — | — |

Avatar holds no value and no interactive element, so it is neither value-bearing nor compound (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`). The load state reaches CSS and code through the `loading` and `error` flags (F5; D7).

### CSS custom properties

| Property | Default | Used by part |
|----------|---------|--------------|
| `--line-avatar-size` | `var(--line-size-7)` (2rem) | host `inline-size` and `block-size`; `root` fills the host |
| `--line-avatar-radius` | `var(--line-radius-round)` | `root` |
| `--line-avatar-bg` | `var(--line-gray-bg)` | `root` (`background-color`, behind the fallback and transparent images) |
| `--line-avatar-color` | `var(--line-gray-text)` | `fallback` |
| `--line-avatar-font-size` | `calc(var(--line-avatar-size, var(--line-size-7)) * 0.4)` | `fallback` |
| `--line-avatar-font-weight` | `var(--line-font-weight-5)` | `fallback` |
| `--line-avatar-fit` | `cover` | `image` (`object-fit`) |
| `--line-avatar-ring-width` | `0px` | `root` (`box-shadow` spread) |
| `--line-avatar-ring-color` | `var(--line-gray-1, Canvas)` | `root` (`box-shadow` colour) |
| `--line-avatar-status-inset` | `0` | `::slotted([slot="status"])` (`inset-block-end`, `inset-inline-end`) |
| `--line-avatar-status-visibility` | `visible` | `::slotted([slot="status"])` (`visibility`) |

- Every token is read at its point of use with its default as the `var()` fallback, such as `inline-size: var(--line-avatar-size, var(--line-size-7))`. None is declared on `:host`, so a value set on any ancestor, the group host or a wrapping link included, reaches the avatar by inheritance (probe P5; F7, F12; D8). This departs from Badge, which declares its defaults on `:host` (`badge.ts:68-80`), and the departure is what lets row 01-C11 size avatars inside wrappers.
- `--line-avatar-ring-color` defaults to the gray scale's step 1, the app background, so the ring reads as a gap between overlapping avatars as in the target visual, and to `Canvas` without `line-themes` (`packages/line-themes/src/defaults.css:38`) [INFERENCE: matches the page only where the page background is gray step 1 or the UA default].
- `--line-avatar-status-visibility: hidden` removes the marker from view and from the accessibility tree [INFERENCE: `visibility: hidden` drops a node from the tree in all three engines; not probed here].
- A consumer rule on the slotted status element beats Avatar's `::slotted` rule, so the consumer can move the marker to another corner (probe P5: a document rule beat a shadow `::slotted` rule).
- Without `line-themes` the fill and text tokens are invalid at computed-value time, so the frame is transparent and the initials take the inherited text colour (`0006-alert.md` AM-002).
- The other defaults are D8: `--line-size-7` is `2rem` (`packages/line-tokens/src/sizing.css:16`), `--line-radius-round` is `1e5px` (`packages/line-tokens/src/radii.css:15`) and `--line-font-weight-5` is `500` (`packages/line-tokens/src/typography.css:23`).

### Keyboard

| Key | Action |
|-----|--------|
| none | — |

Avatar takes no focus and handles no key. The Browser tier proves only that Tab skips the host (Phase 1 spec §10 SD99, `:2446`).

### A11y

| Field | Value |
|-------|-------|
| Role | `img` on the shadow `root` while the avatar has a name; none while decorative (F2, F3; Semantics on `root` above). R8 gives Avatar `img`, or `none` when decorative (`docs/research/01-research-accessibility.md:71`) |
| ARIA attributes | on `root`: `aria-label`, `aria-description`; on the `fallback` part: `aria-hidden="true"` while decorative. None on the host |
| Accessible name | trimmed host `aria-label`, else trimmed `name`, written to `root`'s `aria-label`. The image and the initials stay presentational under the role, so a loaded image and its initials fallback have the same name, which R8 requires (`:71`; probe P1) |
| Focus | none; the host is not focusable and does not delegate focus |

- **Status (F6).** The `status` slot sits outside `root`, so a named marker keeps its own node and follows the avatar in an enclosing name, such as "Ana Silva Online" (probe P1). The marker names itself; Badge makes a named dot an `img` (`0007-badge.md` F4).
- **Decorative (F3).** An avatar with no name exposes nothing of its own: no role on `root`, `alt=""` on the image and a hidden fallback (probe P1, the `inner-hidden` cases). A slotted status stays exposed.
- **Proof (D14).** The role and name live in an open shadow root, not in internals, so the internals rule of Phase 1 spec §6.C.4 notes (`:1180`) does not apply. axe checks them, and flags an unnamed `role="img"` with `role-img-alt` (probe P3). Playwright's `ariaSnapshot()` sees them in all three engines (probe P2), and a Chromium CDP assertion proves the enclosing-name composition (probe P1).
- **Unnamed by mistake.** An avatar left without a name is decorative, as Icon and Badge are (F3), so no automated check catches a missing name. The JSDoc and the docs say to set `name` unless the name is written beside the avatar (D13).
- **Firefox and WebKit gap.** No check proves what Firefox and WebKit expose to assistive technology. The snapshot is Playwright's own computation (Phase 1 spec `:1180`; §12 AM-058). A manual screen-reader pass is optional and never blocks the row.

### Agent contract

#### Rules

| Rule | Summary | How this component meets it |
|------|---------|-----------------------------|
| C1 | Public inputs are JSON-serialisable attributes or properties | `src` and `name` are strings; `aria-label` and `aria-description` are strings; media, fallback and status arrive by slot |
| C2 | Slots carry `@slot` and a single or multiple classification | three `@slot` entries, each `ComponentId` (Slots) |
| C3 | Events carry `@fires`, a typed `detail` and the `line-` prefix | fires no event, so no `@fires`; not value-bearing |
| C4 | Form-associated components expose `value` and accept external validity | not form-associated (Phase 1 spec §6.C.4 C10 row) |
| C5 | The host accepts an accessible name and applies it to the element with the role | the host accepts `aria-label` and `aria-description`, and the documented label property `name`; the component applies the name to `root`, the element with the `img` role (F2) |
| C6 | Semantic variants are reflected closed enums that change only the defaults of the component's own tokens | no variants (F7, F8) |
| C7 | CEM JSDoc carries `@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires` and `@deprecated` | `@summary`, three `@slot`, three `@csspart`, eleven `@cssprop`; no event and nothing deprecated |
| C8 | Missing or partial props degrade to an empty or neutral state | with no attributes and no content it renders an empty, decorative frame in the neutral fill; a blank `src` is no image; a failed `src` shows the fallback; a blank `name` gives no initials |
| C9 | A value-bearing or compound component names exactly one bubbling commit event that fires once per committed result | neither value-bearing nor compound: no value prop and no interactive element |

#### Inputs outside the prop schema (C1)

| Input | Reason JSON cannot carry it | JSON-serialisable alternative |
|-------|-----------------------------|-------------------------------|
| Custom media in the default slot | it is markup the consumer writes, such as `<picture>` or `<svg>`; an agent cannot be trusted with it (ARCH §17.4 Text row, `docs/ARCHITECTURE.md:1640`) | `src` |
| Fallback content in the `fallback` slot | markup | initials from `name` (F4) |

#### Descriptor fields

| Field | Value |
|-------|-------|
| Catalog name | `Avatar` (D11) |
| Tag | `line-avatar` |
| `load()` subpath | `@websublime/line-components/avatar` |
| Prop schema | `src` (`DynamicString`, optional, through `commonProp`), `name` (`DynamicString`, optional), `status` (`ComponentId`, optional), plus `accessibility` from the `ComponentCommon` mixin (Phase 1 spec §6.G.1, `:1323`, `:1326`; F9) |
| Slot map | `status` → `status` (F9) |
| Binding map | `src` → URL binding `{ kind: 'url', use: 'image', name: 'src' }`, which the surface runs through its URL policy before it sets the attribute (F10); `name` → attribute `name`; no value prop and no commit event |
| Action map | none |
| Accessibility requirements | none required, so an avatar node without a name renders decorative (F11); `hostNaming: { kind: 'always' }`, so `accessibility.label` becomes the host `aria-label`, which the component copies to `root` (`packages/line-genui/src/catalog/descriptor.ts:153-157`; F2) |
| Agent-facing description | A picture that stands for a person or an organisation, such as a user's photo beside a comment or in an account menu. Set `src` to the image URL and `name` to the person's or organisation's name. Assistive technology announces the name, and while the image loads, fails or is missing the avatar shows the name's initials instead. Leave `name` empty only when the same name is already written next to the avatar, so it is not announced twice; the avatar is then decorative. To show presence, put a Badge in `status`, such as a `success` Badge with an empty label and the accessible label "Online". An avatar is not interactive. Use Image for any other picture, and Icon for a symbol. |
| Tool description | A picture that stands for a person or an organisation, such as a user's photo beside a comment or in an account menu. Set `src` to the image URL and `name` to the person's or organisation's name. Assistive technology announces the name, and while the image loads, fails or is missing the avatar shows the name's initials instead. Leave `name` empty only when the same name is already written next to the avatar, so it is not announced twice; the avatar is then decorative. An avatar is not interactive. Use Image for any other picture, and Icon for a symbol. |
| `agentExposed` | `true` (Phase 1 spec §6.C.4 C10 row; Avatar is none of the three SD38 exceptions, `:2385`) |

- The agent-facing description names `status`, a `ComponentId` prop the tool lacks, so the descriptor sets a tool description without that sentence (Phase 1 spec §6.G.3, `:1423`). The agent-facing description is 682 characters and the tool description 558, under the 1024 cap (`:1422`).
- The frontend tool carries `src`, `name`, `accessibilityLabel` and `accessibilityDescription`, because `hostNaming` is `always` (`packages/line-genui/src/catalog/tools.ts:144-148`, `:228`). The app renders a tool call, not the surface, so the URL policy of F10 does not cover a tool-created avatar; the G3 docs say so (Phase 1 spec §6.G.3, `:1405`).
- The surface wires a `status` child into the `status` slot by setting `slot="status"` on the child's element, the existing slot-map path (`packages/line-genui/src/a2ui/projection.ts:487-503`, `:497`).
- The drift test checks the `name` attribute, the `src` member of the URL binding and the `status` slot against the manifest (Phase 1 spec §6.G.5, `:1607`; F10).
- C10 ships its descriptor in the same PR, joins the `descriptors` array in catalog-name order (`packages/line-genui/src/catalog/index.ts:108-115`), and adds Avatar to the `<line-a2ui-surface>` render fixture and the surface axe test (Phase 1 spec §6.C.0, `:927`; §6.C.6, `:1231`).

#### URL policy (F10)

- A new binding kind joins `Binding` in `packages/line-genui/src/catalog/descriptor.ts:112-113`: `{ kind: 'url'; use: UrlUse; name: string }`. The surface resolves the prop through `allowedUrl(value, use, document.baseURI, urlPolicy)` (`packages/line-genui/src/a2ui/url-policy.ts:31-46`) and sets the attribute `name` to the resolved `href`, or removes it when the policy rejects the URL. Today `#bind` sets attributes with no policy (`projection.ts:450-472`), and only native targets go through `allowedUrl` (`:432-444`).
- The default policy applies: `https:`, `http:`, `mailto:`, `tel:`, never `data:` (`url-policy.ts:20`; Phase 1 spec §6.G.4, `:1499-1504`; §10 SD57). A rejected URL leaves no `src`, so the avatar shows its fallback (C8).
- The binding reads the surface's `urlPolicy` signal inside the node's effect, as `#native` does, so a new policy re-projects the node [INFERENCE: follows from `projection.ts:433` reading `getValue(this.urlPolicy)` inside the effect].
- Phase 1 spec AM-094 records the binding kind, with trigger `decision`, in its own commit before the code on the C10 branch. It edits §6.G.1 Fields (the Binding map row), §6.G.4 URLs (the binding kind covers a component's URL prop), §6.G.5 (the drift test checks the URL binding's member) and the ARCH §17.3 binding sentence, as AM-092 did for the text binding.

#### Basic `Image` `variant: "avatar"` route (F11)

| Basic `Image` prop | `<line-avatar>` | Note |
|---|---|---|
| `url` | `src`, through the URL binding with use `image` | the same policy the native `<img>` route applies (`projection.ts:433`) |
| `description` | `name` | the native route uses it as `alt` (`projection.ts:437-439`) |
| `fit` | ignored | the native route ignores it too (`projection.ts:432-444`); the host owns styling (ARCH §17.4 Theme row, `docs/ARCHITECTURE.md:1639`); consumers set `--line-avatar-fit` |
| `variant` | selects the target | `"avatar"` → `<line-avatar>`; every other value, and a missing one, keeps the native `<img>` |
| `accessibility.label`, `.description` | host `aria-label`, `aria-description` | `hostNaming: always`; the component copies them to `root` |

- `basic.ts` keeps one `Image` entry (`packages/line-genui/src/catalog/basic.ts:102-103`) and gains a per-variant target: `avatar` → `{ kind: 'component', descriptor: avatarDescriptor }`, the rest the existing native target. The map still holds 10 types (Phase 1 spec §6.G.2, `:1389`).
- `BASIC_PROP_NAMES` gains `Image: { url: 'src', description: 'name' }` (`projection.ts:64-67`).
- A node whose `variant` changes swaps between `<img>` and `<line-avatar>`, because `#element` creates a new element when the tag differs (`projection.ts:313-330`).
- An `Image` node with `variant: "avatar"` and no `description` and no `accessibility.label` renders a decorative avatar, as the same node with another variant renders `<img alt="">` (`projection.ts:439`; F11).
- The C10 acceptance (Phase 1 spec §6.C.4, `:1182`; §12 AM-021) holds when, on `<line-a2ui-surface>`, a message with the v0_9 basic id and an `Image` node with `variant: "avatar"` renders `<line-avatar>`, with `src` set from an allowed `url`, no `src` for a `data:` or rejected URL, and `name` from `description`, while an `Image` node with `variant: "mediumFeature"` still renders `<img>`.

#### AvatarGroup contract (F12)

Row 01-C11 relies on these facts of `<line-avatar>`, and C10 tests each one, so C11 lands without amending this spec.

| # | Avatar guarantees | C11 uses it to |
|---|---|---|
| G1 | the host is `display: inline-block` and its box is `--line-avatar-size` square | lay avatars in a row and overlap them with `::slotted(*) { margin-inline-start: … }` (probe P5) |
| G2 | `--line-avatar-size`, `--line-avatar-ring-width`, `--line-avatar-ring-color` and `--line-avatar-status-visibility` are read with fallbacks and never declared on `:host` | set them on its own `:host` or `::slotted(*)` and reach avatars inherited through any wrapper, such as a link (probe P5) |
| G3 | `root` draws the ring as `box-shadow: 0 0 0 var(--line-avatar-ring-width, 0px) var(--line-avatar-ring-color, …)`, outside the clip | draw the separating ring of the target visual |
| G4 | `--line-avatar-status-visibility: hidden` hides a slotted status from view and from the accessibility tree | hide presence markers inside a collapsed stack, if C11 decides to |
| G5 | `:host([hidden]) { display: none }` | hide avatars past `max` through `hidden`, if C11 decides to mutate that attribute, or through `::slotted(:nth-child(n + …))` otherwise |
| G6 | the token names `--line-avatar-bg`, `--line-avatar-color`, `--line-avatar-font-size`, `--line-avatar-font-weight` and `--line-avatar-radius` are stable public API | style the "+N" overflow `<button part="overflow">` to match an avatar (ARCH §5, `docs/ARCHITECTURE.md:327`) |
| G7 | the avatar's name sits on its own `img` node, never on the host | build the group's `group` or `list` semantics around named avatars (R8 `:72`) |
| G8 | Avatar defines no `size` attribute and fires no event | own `size` and `spacing` itself, as ARCH §13.2 gives them to AvatarGroup (`docs/ARCHITECTURE.md:606`), and track avatars through `slotchange` only (Phase 1 spec §10 SD4) |

### Bundle / entrypoint

| Field | Value |
|-------|-------|
| Subpath | `@websublime/line-components/avatar` |
| Kind | `independent` (Phase 1 spec §4.2, `:298`; ARCH §12, `docs/ARCHITECTURE.md:582`) |
| Registers | `line-avatar` |
| Reset modules | `commonReset` only (ARCH §14.7, `docs/ARCHITECTURE.md:1163`) |

- Files: `src/avatar/avatar.ts` (class and `customElements.define`) and `src/avatar/index.ts`. No `avatar.types.ts`, because Avatar has no enum.
- `package.json` gains the `./avatar` export (Phase 1 spec §4.2, `:249`), and the Vite build gains the `avatar/index` entry (`:310`). No new dependency.
- Avatar imports no other component, and AvatarGroup will not import Avatar (MANIFESTO Law 4; Phase 1 spec §10 SD4; R9 `docs/research/01-research-packaging.md:85-97` shows the chunk an import between the two would create).
- `line-genui` gains `src/catalog/descriptors/avatar.ts`, the `descriptors` entry, the URL binding kind (F10) and the `Image` avatar route (F11).

### Markup examples

```html
<!-- Photo, named: an img named "Ana Silva"; initials "AS" while loading or on error -->
<line-avatar src="/people/ana.jpg" name="Ana Silva"></line-avatar>

<!-- Initials only -->
<line-avatar name="Ana Silva"></line-avatar>

<!-- Decorative: the name is written next to it -->
<line-stack orientation="horizontal">
  <line-avatar src="/people/ana.jpg"></line-avatar>
  <span>Ana Silva</span>
</line-stack>

<!-- Consumer fallback content -->
<line-avatar src="/people/ana.jpg" name="Ana Silva">
  <line-icon slot="fallback" library="phosphor" name="user"></line-icon>
</line-avatar>

<!-- Custom media: responsive image and an inline SVG logo -->
<line-avatar name="Ana Silva">
  <img alt="" loading="lazy" src="/people/ana-64.jpg" srcset="/people/ana-64.jpg 1x, /people/ana-128.jpg 2x">
</line-avatar>
<line-avatar name="WS Labs" style="--line-avatar-radius: var(--line-radius-2)">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="…"></path></svg>
</line-avatar>

<!-- Status: read as "Ana Silva Online" inside a link -->
<a href="/me">
  <line-avatar src="/people/ana.jpg" name="Ana Silva">
    <line-badge slot="status" variant="success" aria-label="Online"></line-badge>
  </line-avatar>
</a>

<!-- Spoken name differs from the data name -->
<line-avatar src="/people/ana.jpg" name="Ana Silva" aria-label="Ana Silva, team lead"></line-avatar>

<!-- Tokens and parts -->
<style>
  line-avatar.large { --line-avatar-size: var(--line-size-9); }
  line-avatar[data-error]::part(fallback) { color: var(--line-danger-text); }
  line-avatar::part(image) { filter: grayscale(1); }
</style>
<line-avatar class="large" src="/people/ana.jpg" name="Ana Silva"></line-avatar>
```

- `<line-badge>` ships with row 01-C9, `<line-stack>` with 01-C3 and `<line-icon>` with 01-C2, so the stories can use them all.

A `line` catalog node the surface renders as the status example, with the name bound to the data model:

```json
[
  { "id": "me", "component": "Avatar", "src": { "path": "/user/photo" }, "name": { "path": "/user/name" }, "status": "presence" },
  { "id": "presence", "component": "Badge", "variant": "success", "accessibility": { "label": "Online" } }
]
```

A basic catalog node the surface renders as `<line-avatar src="https://example.com/ana.jpg" name="Ana Silva">`:

```json
{ "id": "ana", "component": "Image", "url": "https://example.com/ana.jpg", "description": "Ana Silva", "variant": "avatar" }
```

### Tests

| Tier | Runner | Covers |
|------|--------|--------|
| Unit | `bun test` on happy-dom | render with no errors; `src` renders the internal `<img>` and a blank or removed `src` renders none; the flags table through dispatched `load` and `error` events and the fake internals, including an event for a stale `src` dropped and a removed `src` clearing both flags (F5; D6); custom media in the default slot hiding the image and the fallback and clearing the flags (F1); the initials rule over the P6 names, a `fallback` slot that wins over computed initials, and a blank `name` giving none (F4; D9); the Semantics on `root` table for `name`, a host `aria-label` that wins, a blank `aria-label` counting as absent, `aria-description` copied, and the decorative row (F2, F3; D10); a change of `name`, `aria-label` or `aria-description` re-rendering `root`; no event of any kind; C8 with no attributes and no content |
| Browser | Playwright `*.e2e.ts` on chromium, firefox and webkit | Tab skips the host (Phase 1 spec §10 SD99); real loads through `page.route` as in probe P4: a good `src`, a 404, a change from good to 404 and back, a removed `src`, each flipping the flags and the visible zone; `ariaSnapshot()` of a named loaded avatar, a named failed avatar, a decorative one, and a named one with a status badge inside a link (`link "Ana Silva Online"`) in all three engines (D14); a Chromium CDP assertion of the same link names (probe P1); the computed token defaults and their inheritance through a wrapping link from a container that sets `--line-avatar-size`, the ring width and `--line-avatar-status-visibility` (contract G1–G4; probe P5); the status marker's position at the inline-end, block-end corner under `dir="ltr"` and `dir="rtl"` |
| A11y | axe-core | zero violations (MANIFESTO Law 3) in every Avatar story of D12 (Phase 1 spec §7.4, `:2118-2119`). A fixture with `role="img"` on `root` and no name is not shipped; probe P3 showed axe would flag it with `role-img-alt` |
| htmx | Playwright `*.e2e.ts` through the shared harness `@websublime/line-testing/htmx` (`packages/line-testing/src/htmx.ts`), on htmx 2 and htmx 4 in chromium, firefox and webkit | `n/a`: Avatar is neither value-bearing, because its descriptor binding map names no value prop, nor compound, because it holds no interactive element (ARCH §17.2 C3, C9, `docs/ARCHITECTURE.md:1574`, `:1580`; plan §2.4, `docs/plans/01-plan-core-primitives.md:172-175`). This confirms the Phase 1 spec's "`n/a` expected" (§6.C.4 C10 row; §10 SD34, `:2381`; F13) |
| Visual | Playwright `avatar.visual.ts` on the `visual` project | every Avatar story with Linux baselines from a `visual-baselines.yml` run, including a loaded image, initials, an error fallback, custom media, a status badge and the inherited ring and size (Phase 1 spec §6.C.6, `:1233`; §10 SD98, `:2445`) |
| Surface | `bun test` in `packages/line-genui/__tests__/a2ui-surface.test.ts`; Playwright axe in `packages/line-components/__tests__/a11y/a2ui-surface.e2e.ts` | a `line` catalog `Avatar` node renders `<line-avatar>` with `src` from an allowed URL and `name`, a bound `name` updates, a `data:`, `javascript:` or `urlPolicy`-rejected `src` leaves no attribute, a throwing `urlPolicy` leaves no attribute, and replacing `urlPolicy` re-projects (F10); a `status` child renders with `slot="status"` (F9); `accessibility.label` reaches the host `aria-label`; a node with no name renders a decorative avatar and raises nothing (F11); the basic `Image` route of F11, including the variant swap and the acceptance of Phase 1 spec `:1182`; the nodes join the surface render fixture and the surface axe test (§6.C.6, `:1231`) |
| Catalog and tools | `bun test` in `packages/line-genui/__tests__` | the CEM coverage and drift tests pass with the new descriptor, and a fixture URL binding whose member the manifest lacks fails the drift test (Phase 1 spec §6.G.5; F10); `catalog.json` holds `Avatar` and its inline projection validates (§6.G.2); the `Avatar` tool takes the tool description, stays at or under 1024 characters, and carries `src`, `name`, `accessibilityLabel` and `accessibilityDescription` and no `status` (§6.G.3) |
| Packaging | `bun test` on the packed tarball | the registration harness sees `./avatar` register `line-avatar` only, and the isolation scan finds no other component's module in its bundle (Phase 1 spec §7.5) |

- PRD §5.2 checklist mapping (`docs/PRD.md:514`; Phase 1 spec §6.C.6, `:1222`): render, reactive props, slots, parts, custom properties and events (none fired) run in the Unit tier, keyboard (Tab skips the host) in the Browser tier, and axe in the A11y tier.
- Avatar is not a machine row, so it measures no update rate (Phase 1 spec §6.C.6, `:1232`).
- Avatar sets no internals role, so the Browser tier runs no `INTERNALS` read-back (D14). It reads `:state(loading)` and `:state(error)` with `matches()`.
- The axe and visual tests run against the Storybook stories on port 4320; the story list lives in `packages/line-components/__tests__/avatar-stories.ts`, as `badge-stories.ts` does for Badge. Story images are local files under the Storybook static directory, so the visual baselines never depend on the network (D12). The load and token tests use fixture pages under `packages/line-components/__tests__/integration/avatar/`, served by the existing port-4321 `webServer` (`playwright.config.ts`).

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| F1 | Where does the image come from, and what does the default slot hold? | Miguel | resolved: option (a), `src` renders an internal `<img part="image">` and the default slot takes custom media that replaces it, with no load tracking (Miguel, 2026-11-11) |
| F2 | Which element carries the `img` role and the accessible name? | Miguel | resolved: option (b), `role="img"` and `aria-label` on the shadow `root`, named by the host `aria-label`, else `name`, with the `status` slot outside `root` (Miguel, 2026-11-11) |
| F3 | How does an avatar become decorative? | Miguel | resolved: option (a), implicit, Icon and Badge parity: an avatar with no name is decorative (Miguel, 2026-11-11) |
| F4 | Who produces the initials? | Miguel | resolved: option (b), computed from `name` by the D9 rule while the `fallback` slot is empty; slotted content wins (Miguel, 2026-11-11) |
| F5 | Does Avatar reflect its load state, and as which flags? | Miguel | resolved: option (a), `loading` and `error` as `data-*` and `:state()` (Miguel, 2026-11-11) |
| F6 | What does the `status` slot accept, how is it named, and does it get a wrapper part? | Miguel | resolved: option (a), any element, positioned by `::slotted([slot="status"])`, naming itself; no wrapper part (Miguel, 2026-11-11) |
| F7 | Is size a reflected enum or only a custom property? | Miguel | resolved: option (a), the `--line-avatar-size` token only, read with a fallback and never declared on `:host` (Miguel, 2026-11-11) |
| F8 | Is the shape a C6 variant? | Miguel | resolved: option (b), the `--line-avatar-radius` token only (Miguel, 2026-11-11) |
| F9 | Which props and slots does the descriptor expose to agents? | Miguel | resolved: option (a), `src`, `name` and a `status` child into the `status` slot (Miguel, 2026-11-11) |
| F10 | How does an agent's image URL reach `<line-avatar>` behind the URL policy? | Miguel | resolved: option (a), a URL binding kind `{ kind: 'url', use: 'image', name: 'src' }` that the surface runs through its URL policy (Miguel, 2026-11-11; Phase 1 spec AM-094) |
| F11 | How does a basic `Image` with `variant: "avatar"` map, and does an agent avatar require a name? | Miguel | resolved: option (a), `url` → `src`, `description` → `name`, `fit` ignored, no `requiredName`; a nameless node renders decorative (Miguel, 2026-11-11) |
| F12 | What contract does row 01-C11 AvatarGroup rely on? | Miguel | resolved: option (a), inherited tokens, contract G1–G8 (Miguel, 2026-11-11) |
| F13 | Does the htmx Tests row run? | Miguel | resolved: option (a), `n/a` (Miguel, 2026-11-11) |

**Orchestrator defaults** (Miguel left D1–D17 as drafted, 2026-11-11)

| # | Default | Basis |
|---|---------|-------|
| D1 | Static: no machine, no events, not value-bearing, not form-associated; `@zag-js/avatar` is not used | ARCH §13.2, `:605`; Phase 1 spec §10 SD37, `:2384`; R7 §6 OQ6 option (a), `docs/research/01-research-zag-machines.md:310` |
| D2 | Anatomy as drawn; host `display: inline-block; position: relative`; `:host([hidden]) { display: none }` | ARCH §13.2; Badge D3 (`0007-badge.md`) |
| D3 | No focus, no key handling, no `tabindex` | R8 Avatar row: Keyboard "None" (`docs/research/01-research-accessibility.md:71`) |
| D4 | Reset modules: `commonReset` only | ARCH §14.7, `:1163` |
| D5 | The fallback shows while loading, on error and with no image; the image shows only after `load`; image, custom media and fallback share one grid cell and the inactive zone gets `visibility: hidden`, never `display: none` | Probe P4: a lazy image with `display: none` never loads; no broken-image icon or alt text ever draws |
| D6 | Each `src` change sets `loading` and records the URL; `load` and `error` count only for the recorded URL; a blank or removed `src` removes the `<img>` `src` and clears both flags without waiting for an event; `complete` is never read | Probe P4: one event per set `src`, none on removal, `error` on `""`, Firefox `complete` `false` for a cached image |
| D7 | Flags reflected through `reflectState` once connected, as Badge does; no `line-load` or `line-error` event | `line-element.ts:46-53`; `badge.ts:204-205`; F5 |
| D8 | The eleven `--line-avatar-*` tokens of the CSS custom properties table, read with fallbacks and never declared on `:host` | Probe P5; F12 contract G2 |
| D9 | The initials rule splits the trimmed `name` on whitespace, takes the first grapheme (`Intl.Segmenter`, granularity `grapheme`) of the first word and, when there are two or more words, of the last word, and uppercases them with `toLocaleUpperCase(lang)`, where `lang` is the nearest `lang` attribute of the host or the document's; a blank `name` gives nothing | Probe P6; F4 (b) |
| D10 | The name is the trimmed host `aria-label`, else the trimmed `name`; `aria-description` is copied to `root` only while named; `aria-labelledby` on the host is not supported, because an id reference cannot cross into the shadow root, and the JSDoc says so | ARCH §17.2 C5, `:1576`; Badge D7 trimming rule (`0007-badge.md`) |
| D11 | Catalog name `Avatar`, `agentExposed: true` | PRD row name; Phase 1 spec C10 row |
| D12 | Stories: Photo, Initials, Error fallback, Loading (a never-resolving image), Decorative beside a name, Fallback slot, Custom media (`<picture>` and inline SVG), Status, In a link, Spoken name override, Custom tokens, Ring and size from a container. Images are local Storybook static files | One axe and one visual baseline per meaningful state (Phase 1 spec §6.C.6; `0007-badge.md` D11) |
| D13 | The class JSDoc tells authors to set `name` unless the name is written beside the avatar, to name a status marker, to give custom media `alt=""`, and that `aria-labelledby` is unsupported | Alert's JSDoc pattern (`packages/line-components/src/alert/alert.ts:40-46`); F2, F3, F6 |
| D14 | The Browser tier proves role and name with Playwright `ariaSnapshot()` in three engines and a Chromium CDP assertion of enclosing names; no `INTERNALS` read-back, because no role lives in internals | Probe P2 (the snapshot sees a shadow role); Phase 1 spec §6.C.4 notes, `:1180`, which govern internals roles only |
| D15 | The component applies no URL policy to hand-written `src`; only the surface does | Phase 1 spec §6.G.4, `:1499-1504`, places the policy on the surface; MANIFESTO Law 9 |
| D16 | No `loading`, `srcset`, `sizes`, `crossorigin` or `referrerpolicy` prop; consumers who need them use custom media in the default slot | F1 (a); C1 keeps the prop schema small |
| D17 | The C10 PR also fills the Avatar row of `docs/COMPETITIVE-COMPONENT-ANALYSIS.md`, writes the Storybook docs, reports the gzipped size, updates the `basic.ts` Image comment, lands the F10 Phase 1 spec AM before its code, and adds one changeset covering `line-components` and `line-genui` | Phase 1 spec §6.C.6, `:1223-1227`; PROCESS §3, §6 |

Miguel decided F1–F13 on 2026-11-11 and left D1–D17 as drafted. The option tables below stay as the record of what he weighed.

### F1 — Image source and the default slot

**Evidence.** ARCH §13.2 names the slots default, `fallback` and `status` and the parts `root`, `image` and `fallback`, and says nothing of what the default slot holds (`docs/ARCHITECTURE.md:605`). ARCH §3 makes an element the component coordinates with its state an internal part (`:219-226`), and the image's load state drives the fallback (R7 `docs/research/01-research-zag-machines.md:206-207`). In probe P1 a consumer `<img alt>` in light DOM is named while visible, but once it is hidden on error the name leaves with it and an enclosing link is named "AS". Probe P3 shows axe flagging an unnamed light-DOM `<img>` (`image-alt`). Probe P4 shows the events of an internal `<img>` driving the switch reliably in all three engines. On the agent path a URL must pass the surface's policy (Phase 1 spec §6.G.4, `:1499-1504`), which is simplest on an attribute (F10). `<picture>`, `srcset` and `loading="lazy"` exist only on native elements.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `src` plus custom media | `src` renders an internal `<img part="image">`; the default slot takes custom media (`<img srcset>`, `<picture>`, `<svg>`, `<line-icon>`) that replaces it, with no load tracking | One attribute for the common case and the agent path; native image features through the slot without new props (D16). Custom media that fails shows the browser's broken image, because nothing tracks it |
| (b) `src` only | no default slot; ARCH §13.2 drops "default" from Avatar's slots | Smallest API. No `<picture>`, `srcset` or SVG logo without new props; an ARCH change |
| (c) Slotted `<img>` only, Radix shape | no `src`; the consumer writes `<img alt>` in the default slot and the component tracks its events | Native features for free and works before upgrade. The name sits on the `alt` and vanishes on error (P1), so the component must copy it elsewhere; the surface must build a child `<img>` for agents |
| (d) Default slot as fallback text | `<line-avatar src>AS</line-avatar>`, Badge style; the `fallback` slot is dropped | Short markup, and the text binding of AM-092 fills it for agents. Two slots in ARCH §13.2 collapse to one; an ARCH change |

### F2 — Role and name placement

**Evidence.** R8 gives Avatar the `img` role with a required name, or `none` when decorative, and says "Initials fallback needs the same name" (`docs/research/01-research-accessibility.md:71`). ARCH §17.2 C5 has the host accept `aria-label` and `aria-description`, or a documented label property, and has the component apply the name to the element with the role (`docs/ARCHITECTURE.md:1576`). In probe P1 a host internals `img` names the avatar but leaves a slotted status out of an enclosing link's name ("Ana Silva", not "Ana Silva Online"), because the children of `img` are presentational. A role on a shadow element with the `status` slot outside it gives "Ana Silva Online", and a host `aria-label` on a role-less host names a prohibited `generic`. In probes P2 and P3 Playwright's snapshot and axe see a shadow role and miss an internals role, and axe flags an unnamed shadow role (`role-img-alt`). Icon and Badge use the internals `img` (`0014-icon.md` D1; `0007-badge.md` F4), but neither has a status child.

| Option | What it decides | Consequence |
|---|---|---|
| (a) Host internals `img`, Icon and Badge parity | `internals.role = 'img'` on the host, named by the host `aria-label` | One naming rule across Icon, Badge and Avatar. The status drops out of enclosing names (P1); proof needs CDP and read-back; axe and Playwright are blind to it (P2, P3) |
| (b) **Recommended.** `role="img"` on the shadow `root` | `root` wraps image and fallback and carries `role="img"` and `aria-label` from the host `aria-label`, else `name`; the `status` slot sits outside `root` | Status joins the enclosing name (P1); axe and Playwright check it in three engines (P2, P3). A host `aria-label` also leaves a named `generic` host in Chromium, as Button does (Phase 1 spec `:1157`) |
| (c) Alternating native elements | `<img alt="…">` while loaded; `role="img"` with `aria-label` on the fallback while not | Same exposure as (b) (P1, P3). Two elements carry the name and swap on every load change |
| (d) Light-DOM `<img alt>` | follows F1 (c) | axe checks the consumer's `alt`. The name vanishes on error (P1) |

### F3 — Decorative mode

**Evidence.** R8 allows `none` when decorative (`:71`). Icon and Badge are hidden unless named (`0014-icon.md` D1; `0007-badge.md` F4); Separator has an explicit `decorative` attribute (`docs/specs/0011-separator.md:112`). In probe P1, with no role on `root`, `alt=""` on the image and `aria-hidden` on the fallback, nothing of the avatar is exposed and a status stays (the `inner-hidden` cases), while `role = 'none'` on the host hides nothing. In probe P3 an unnamed `role="img"` fails axe `role-img-alt`, so an explicit mode lets axe catch a forgotten name. The basic `Image` renders `<img alt="">` when it has no `description` (`packages/line-genui/src/a2ui/projection.ts:439`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Implicit, Icon and Badge parity | no name → decorative: no role on `root`, hidden fallback, `alt=""` | One rule across Icon, Badge and Avatar; agents need nothing extra (F11). A forgotten name passes every automated check |
| (b) Explicit `decorative` boolean, Separator parity | without a name and without `decorative`, `root` keeps `role="img"` unnamed | axe flags the forgotten name (P3). One more attribute; the agent path then needs a name or `decorative`, which `requiredName` cannot express (`packages/line-genui/src/catalog/descriptor.ts:138-141`) |

### F4 — Initials

**Evidence.** The PRD row promises an "initials fallback" (`docs/PRD.md:253`). Component-level strings are the consumer's (`docs/MANIFESTO.md:66`); initials derive from consumer data, but the rule is cultural. In probe P6 a grapheme rule handles combining accents, emoji sequences and a CJK name in all three engines, and Turkish casing differs by `lang` ("İI" against "II"). On the agent path the text binding writes only the host's text, which lands in the default slot (`projection.ts:462-465`; Phase 1 spec AM-092), so it cannot fill the `fallback` slot, and the basic `Image` has no initials field (`@a2ui/web_core` 0.14.0 `src/v0_9/basic_catalog/components/basic_components.js:56-76`). Web Awesome takes an `initials` attribute [INFERENCE: from its docs, not checked against its manifest]; Radix and Ark leave initials to the consumer.

| Option | What it decides | Consequence |
|---|---|---|
| (a) Consumer content only | the `fallback` slot shows what the consumer writes; nothing is computed | No cultural rule in line. Agent avatars show an empty frame on error, because no agent route fills the `fallback` slot |
| (b) **Recommended.** Computed from `name`, slot wins | with an empty `fallback` slot the component renders initials by the D9 rule; any slotted content replaces them | Agents and hand-written markup get initials from one prop. A documented rule that is wrong for some naming cultures, which the slot overrides |
| (c) `initials` attribute | the consumer passes the text, such as `initials="AS"` | Explicit, no rule in line, agents can set it. A second string beside `name` for every avatar |

### F5 — Load state reflection

**Evidence.** ARCH §14.8 lists `loading` and `error` among reflected states, both as `data-*` and `:state()` (`docs/ARCHITECTURE.md:1230`, `:1234`), and has no `loaded`. Zag's avatar machine has `loading`, `loaded` and `error` (R7 `:206-207`). Badge was the first Static component to reflect a flag, `empty` (`0007-badge.md` States). In probe P4 `load` and `error` fire once per set `src`, so the flags are cheap to keep right.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `loading` and `error` | `data-loading`, `:state(loading)`, `data-error`, `:state(error)`; "loaded" is `[src]` with neither | Consumers style a fade-in or an error tint, and tests read the state. Uses only ARCH §14.8 names |
| (b) Add `loaded` | a third flag | Direct selector for the loaded state. ARCH §14.8 gains a row |
| (c) None | the switch stays internal | Smallest. No hook for a transition or an error style; tests read the shadow DOM |

### F6 — Status slot

**Evidence.** ARCH §13.2 gives Avatar a `status` slot and no part for it (`:605`); ARCH §5 has `indicator`, "State indicator" (`:315`). Badge leaves overlay placement to the anchor's slot (`0007-badge.md` F8) and makes a named dot an `img` (F4). In probe P1 a named marker in the `status` slot, outside the avatar's role, follows the avatar in an enclosing name ("Ana Silva Online"). In probe P5 a document rule beats a shadow `::slotted` rule, so the consumer can always reposition the marker. MANIFESTO Law 1 asks for a part on every styleable zone (`docs/MANIFESTO.md:39`); the slotted marker is the consumer's own element.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Any element, positioned by `::slotted` | one marker, usually a named `<line-badge>`; `::slotted([slot="status"])` places it at the inline-end, block-end corner with `--line-avatar-status-inset` and `--line-avatar-status-visibility`; the marker names itself | Stays inside ARCH §13.2; the consumer styles the marker directly. No `::part()` for the corner box |
| (b) Wrapper part `indicator` | `<span part="indicator"><slot name="status"></span>`, positioned by the component | `::part(indicator)` moves the marker. ARCH §13.2's part list gains `indicator`, an ARCH change |
| (c) Status in the name | the docs ask authors to write the status into the avatar's name, such as "Ana Silva, online", and the marker is `aria-hidden` | Works under any role placement, F2 (a) included. The status lives in two places and goes stale when one changes |

### F7 — Size

**Evidence.** Button has no size attribute (`docs/specs/0002-button.md:355`). C6 allows a variant to change only the defaults of the component's own tokens (`docs/ARCHITECTURE.md:1577`). ARCH §13.2 gives AvatarGroup a `size` prop (`:606`). In probe P5 an avatar that declares its size on `:host([size])` takes a group's `::slotted` value only as a direct child and keeps its own size inside a wrapping link, while an avatar that reads `var(--line-avatar-size, …)` with no `:host` declaration inherits through the wrapper.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Token only | `--line-avatar-size`, read with a fallback, never declared on `:host` | Any container sizes avatars by inheritance, wrappers included (P5). No named sizes; consumers write a length or a `--line-size-*` token |
| (b) Reflected enum | `size="sm \| md \| lg"` as a C6 variant over `--line-avatar-size` | Named sizes for authors and agents. `:host([size])` blocks inheritance, so AvatarGroup must use `::slotted` and avatars inside a link inside a group keep their own size (P5) |

### F8 — Shape

**Evidence.** The radius is the `--line-avatar-radius` token in either option. ARCH §17.4 ignores agent theme hints because the host owns styling (`docs/ARCHITECTURE.md:1639`). C6 variants are semantic (`:1577`); a square frame for an organisation is a convention, not a meaning [INFERENCE].

| Option | What it decides | Consequence |
|---|---|---|
| (a) `shape` variant | `shape="circle \| square"`, reflected, changing the `--line-avatar-radius` default (`--line-radius-round`, `--line-radius-2`) | Authors and agents pick a square for an organisation. A visual choice handed to agents, against the ARCH §17.4 theme rule |
| (b) **Recommended.** Token only | `--line-avatar-radius` | No variant and no agent styling. Square avatars need consumer CSS |

### F9 — Descriptor props and slot map

**Evidence.** Phase 1 spec §6.G.1 requires `DynamicString` for string props and keeps `ComponentId` for slot props (`:1326`). The surface wires a slot-map child by setting its `slot` attribute (`projection.ts:497`). The G3 walker drops `ComponentId` props from tools (`:1404`). Custom media and fallback markup cannot come from an agent (C1 table above).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `src`, `name`, `status` | `src` through the URL binding (F10), `name` → attribute, `status` (`ComponentId`) → slot `status` | Agents show a photo, initials and a presence Badge. A tool description without `status` (Descriptor fields) |
| (b) `src` and `name` only | no slot map | Simpler tool parity. Agents cannot show presence |
| (c) Add `fallback` as a `ComponentId` | an agent puts an Icon or a Text in the `fallback` slot | Agent-chosen fallback glyphs. A second way to fill the fallback beside `name` |

### F10 — URL policy on the agent path

**Evidence.** The surface's URL policy covers Image URLs (Phase 1 spec §6.G.4, `:1499-1504`; §10 SD57, `:2404`). Today only native targets run `allowedUrl` (`projection.ts:432-444`); component bindings set attributes unchecked (`:450-472`). The descriptor API has property, attribute, surface-lookup and text bindings (`descriptor.ts:84-113`); AM-092 added the text binding through the same kind of decision (Phase 1 spec `:2553`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** URL binding kind | `{ kind: 'url', use: 'image', name: 'src' }` in the descriptor; the surface runs the policy, then sets or removes the attribute | One rule for the `line` Avatar and the basic route, reusable by later media components. A Phase 1 spec AM (decision) to §6.G.1, §6.G.4, §6.G.5 and ARCH §17.3 |
| (b) Avatar special case in the projection | the projection checks `src` when the tag is `line-avatar` | No API change. A tag rule hidden in the surface that the descriptor does not declare, so the drift and tool tests cannot see it |
| (c) No `src` in the `line` catalog | the `line` `Avatar` shows initials only; image avatars come only from basic `Image` `variant: "avatar"`, handled as a native-like target | No API change. Two agent shapes for one component, and `line` catalog agents cannot show photos |

### F11 — Basic `Image` mapping and the agent name

**Evidence.** The basic `Image` carries `url`, `description`, `fit` and `variant` (`basic_components.js:56-76`). The native route uses `description`, else `accessibility.label`, as `alt`, and `""` when both are missing (`projection.ts:437-439`). `requiredName` sources are `childText`, `textProp` (a text-binding prop only) and `accessibilityLabel` (`descriptor.ts:133-141`; Phase 1 spec `:1512`). The name check reads the node's raw props before `renamed` maps them (`projection.ts:364`, `:457`). Badge requires a name because an unnamed dot carries meaning by colour alone (`0007-badge.md` F10); an avatar beside a written name carries none.

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Map, no requirement | `url` → `src`, `description` → `name`, `fit` ignored, `accessibility` → host; no `requiredName`; a nameless node renders decorative | Matches the native `Image` route, so basic agents never hit a placeholder. An agent can forget a name silently |
| (b) Map, name required | as (a) plus `requiredName`; a nameless node becomes a placeholder with `MISSING_ACCESSIBLE_NAME` | Every agent avatar is named. A decorative agent avatar beside a name is impossible; `requiredName` needs a new source kind for the attribute prop `name`, and the check must read renamed props |
| (c) Basic route only, no `line` Avatar descriptor | Avatar stays out of the `line` catalog | Smallest genui change. Phase 1 spec §6.C.4 lists C10 `agentExposed: true` and §6.C.6 requires a descriptor (`:1166`, `:1229`), so this needs a spec change |

### F12 — AvatarGroup contract

**Evidence.** AvatarGroup takes avatars through a slot and never imports Avatar (Phase 1 spec §10 SD4, `:2351`; §6.C.4, `:1153`, `:1167`). ARCH §13.2 gives AvatarGroup `max`, `size` and `spacing` (`:606`). The target visual shows avatars that overlap with a gap ring and end in a "+3" circle. In probe P5 `::slotted(*)` reaches only direct children and beats the avatar's `:host` rules, and inheritance through a wrapper works only without a `:host` declaration. MANIFESTO Law 5 keeps DOM mutation inside the component's own reactive cycle (`docs/MANIFESTO.md:47`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** Inherited tokens | contract G1–G8: Avatar reads size, ring and status visibility with fallbacks; AvatarGroup sets them on its host or `::slotted(*)` and overlaps through `::slotted(*)` margins | Works for direct children and for avatars wrapped in links (P5); no import and no attribute writes. Consumer rules on `line-avatar` beat the group, by design |
| (b) `::slotted` with `:host` defaults, Badge pattern | Avatar declares defaults on `:host`; AvatarGroup sets tokens through `::slotted(*)` only | Familiar pattern. Avatars wrapped in links keep their own size (P5) |
| (c) AvatarGroup writes attributes | AvatarGroup sets `size` and similar attributes on slotted avatars | Explicit values. Needs F7 (b), mutates the consumer's light DOM, and breaks for wrapped avatars |

### F13 — htmx row

**Evidence.** The htmx row applies to value-bearing or compound components (plan §2.4, `docs/plans/01-plan-core-primitives.md:172-175`). Avatar has no value prop (F9) and no interactive element (D3). The Phase 1 spec expects `n/a` (§6.C.4 C10 row; §10 SD34, `:2381`).

| Option | What it decides | Consequence |
|---|---|---|
| (a) **Recommended.** `n/a` | the Tests row says `n/a` with that reason | Confirms SD34. A server-swapped avatar is ordinary DOM, covered by the Unit and Browser tiers |
| (b) Run part (d) only | the harness swaps server content into the slots under htmx 2 and 4 | Proves slot swaps through htmx. Runs a row the template reserves for value-bearing and compound components |

---

## Amendments

PROCESS §3 requires that any change to this spec after approval lands as a row here, in the same commit as the change. The spec has no amendment yet.
