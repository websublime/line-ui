# @websublime/line-components

## 0.2.5

### Patch Changes

- [#333](https://github.com/websublime/line-ui/pull/333) [`2adcffc`](https://github.com/websublime/line-ui/commit/2adcffcdbe088afdb0e08c628759826217315bab) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-chip>` at `@websublime/line-components/chip`, a compact toggle button for a category or a filter: each press flips `pressed` and fires `line-change` with `{ value }`, it takes `variant` (`default`, `primary`) and `disabled`, slots for `prefix`, the label, `suffix` and an `indicator` shown only while pressed, and `--line-chip-*` tokens whose colours change when pressed; the `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `Chip`, whose `label` the surface writes as the chip's text through the new text binding and `textProp` name source.

- [#338](https://github.com/websublime/line-ui/pull/338) [`4441f25`](https://github.com/websublime/line-ui/commit/4441f25417b7cab89f130788b93af21ce5bb1a60) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-portal>` at `@websublime/line-components/portal`, which paints its slotted content in the browser top layer, above clipping, transforms and stacking contexts, while the content keeps its DOM position, so it keeps its inherited theme, direction and language, its events, its form owner and its focus and reading order; `disabled` renders the content in place, and `bringToFront()` raises the box above a modal dialog opened after it. `@websublime/line-genui/catalog` exports `portalDescriptor`, which is not agent-exposed, so the `line` catalog, `catalog.json` and the frontend tools leave it out.

- [#328](https://github.com/websublime/line-ui/pull/328) [`bec0308`](https://github.com/websublime/line-ui/commit/bec03081fb1fc82ccb881021ad9e032a25e05176) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-alert>` at `@websublime/line-components/alert`, an inline message box with `icon`, `title`, default, `actions` and `dismiss` slots laid out in a three-column grid, where an empty zone takes no space. `variant` (`neutral`, `info`, `success`, `warning`, `danger`) sets the `--line-alert-*` colour tokens from the theme roles. `live="polite"` or `live="assertive"` puts the `status` or `alert` role on the host through `ElementInternals`; by default the alert has no role. A click on the control in its `dismiss` slot fires a cancelable `line-dismiss`, after which the alert sets `hidden` on itself unless the event was cancelled; the consumer supplies the glyph and the name. It takes no focus. The `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `Alert` (`variant`, `icon`, `title`, `children`, `actions`, `dismiss`), which `<line-a2ui-surface>` renders without a live role or host name.

- [#316](https://github.com/websublime/line-ui/pull/316) [`9200079`](https://github.com/websublime/line-ui/commit/9200079739b950bab17ac0c19ed30a339dcc30f0) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-icon>` at `@websublime/line-components/icon` and `setIconRegistry` at the package root: a glyph from a registered icon set, an SVG file or SVG path data, sanitised through the Trusted Types policy `line-icon` and an allowlist, decorative unless labelled, and sized by `--line-icon-size`.

- [#330](https://github.com/websublime/line-ui/pull/330) [`062629f`](https://github.com/websublime/line-ui/commit/062629fa7df53680e950df5965e60388198ba645) Thanks [@miguelramos](https://github.com/miguelramos)! - `line-button-group` no longer lists a fake public `role` property in its custom elements manifest and Storybook controls.

- [#340](https://github.com/websublime/line-ui/pull/340) [`cbdab40`](https://github.com/websublime/line-ui/commit/cbdab40a9c6e02c5677db6bf5ebd3a872cec0d3c) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-kbd>` at `@websublime/line-components/kbd`, which draws a keyboard shortcut written once in `keys`, such as `mod+k` or `g i`, as `⌘K` with hidden words on Apple devices and as `Ctrl+K` elsewhere, with a `platform` override, a fallback slot and replaceable words through `LineKbd.keyLabels` and `key-labels`. `@websublime/line-genui/catalog` exports `kbdDescriptor`, so the `line` catalog, `catalog.json` and the frontend tools gain `Kbd` with one `keys` prop.

- [#326](https://github.com/websublime/line-ui/pull/326) [`c13a74f`](https://github.com/websublime/line-ui/commit/c13a74f9350bf163f3ac1da29176efcf90349332) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-icon-button>` at `@websublime/line-components/icon-button`, a square button that shows only an icon (slotted, part `icon`), takes its name from the host `aria-label`, is never a form submitter, and takes `variant`, `disabled`, `loading` and `pressed` (toggle, fires `line-change`); the `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `IconButton`, which `<line-a2ui-surface>` renders only when the node carries `accessibility.label`.

- [#337](https://github.com/websublime/line-ui/pull/337) [`ca842eb`](https://github.com/websublime/line-ui/commit/ca842ebeb28cf47b341e88278a5a079b4c4deb76) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-visually-hidden>` at `@websublime/line-components/visually-hidden`, which keeps its slotted content in the accessibility tree and off the screen, takes no space in any layout, and shows the content while focus is inside it, so a skip link appears when a keyboard user reaches it; `@websublime/line-genui/catalog` exports `visuallyHiddenDescriptor`, which is not agent-exposed, so the `line` catalog, `catalog.json` and the frontend tools leave it out.

- [#335](https://github.com/websublime/line-ui/pull/335) [`f73b929`](https://github.com/websublime/line-ui/commit/f73b929776d2ba81ce09634635536fc4af20d447) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-avatar>` at `@websublime/line-components/avatar`, a picture, logo or initials that stand for a person or an organisation: `src` draws the picture once it loads, the `fallback` slot or the initials of `name` show while it loads, fails or is missing, custom media such as a `<picture>` goes in the default slot, and a `status` slot places a presence marker that is read after the avatar's name. It reflects `data-loading` and `data-error`, is an image named by `name` or the host `aria-label` and is decorative without one, and reads every `--line-avatar-*` token with a fallback so a container sizes and rings it by inheritance. The `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `Avatar`; a descriptor binds a URL prop through the new URL binding (`{ kind: 'url', use, name }`), which the surface runs through its URL policy; and a basic catalog `Image` with `variant: "avatar"` renders `<line-avatar>`, with `url` as `src` behind the same policy and `description` as `name`.

- [#334](https://github.com/websublime/line-ui/pull/334) [`91e3359`](https://github.com/websublime/line-ui/commit/91e3359e42913a6d634b596b1971c241a1a04c8c) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-badge>` at `@websublime/line-components/badge`, a small status marker for a count, a short label or, with an empty slot, a dot; `variant` (`neutral`, `info`, `success`, `warning`, `danger`) gives a text badge a soft fill and a dot a solid one, and a host `aria-label` makes any badge an `img` with that name while an unnamed dot stays hidden. The `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `Badge`, whose `label` the surface writes as the badge text; a Badge with neither `label` nor `accessibility.label` renders the missing-name placeholder.

- [#336](https://github.com/websublime/line-ui/pull/336) [`fe3dce4`](https://github.com/websublime/line-ui/commit/fe3dce4a87d6390c3ae3e31c0edaa2cf1ee1603b) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-avatar-group>` at `@websublime/line-components/avatar-group`, a row of overlapping avatars named by its host `aria-label` or `aria-labelledby` (a `group` role). Every element child without `hidden` counts as one avatar; `max` keeps the first avatars in the stack and moves the rest into a native `popover` panel that a "+N" `<button>` opens, with focus back on "+N" after Escape, and `overflow-label` names "+N" from a template such as `"+{count} more members"`. The stack spreads toward inline-start on mouse or pen hover and on keyboard focus, never on touch, Escape dismisses the spread until the pointer and focus have both left, and "+N" stays under the pointer. `size` (`1`–`5`) and `spacing` (`0`–`3`) step the avatar size and the overlap, the group sets the avatar size and a 2px ring on its host for the avatars to inherit, and `data-expanded`, `data-open` and `data-focus-visible` reflect its state; it never imports or writes on its avatars. The `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `AvatarGroup`, with `children`, `max`, `size`, `spacing` and `overflowLabel`.

- [#327](https://github.com/websublime/line-ui/pull/327) [`04e1e33`](https://github.com/websublime/line-ui/commit/04e1e33073a4818efde5fe8f171ff806eaa13130) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-button-group>` at `@websublime/line-components/button-group`, a toolbar named by its host `aria-label` or `aria-labelledby`. It gives its slotted `<line-button>` and `<line-icon-button>` children one Tab stop with arrow-key focus (`orientation` `horizontal` or `vertical`, mirrored right-to-left, Home and End, wrap with `loop`). It skips disabled and hidden buttons, moves focus on when the focused button is disabled, hidden or removed, and squares the corners between its buttons (`--line-button-group-radius`, `--line-button-group-gap`). The `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `ButtonGroup`, which `<line-a2ui-surface>` renders only when the node carries `accessibility.label`. `<line-button>` and `<line-icon-button>` now stretch their inner button (`::part(root)`) to fill the host, so every button of a vertical group is as wide as the widest. Any layout that stretches a button stretches it too: in a default vertical `<line-stack>` or an A2UI `Column`, Buttons and IconButtons now render full width; set `align` on the Stack (`start`, `center` or `end`) to keep their content width.

- Updated dependencies [[`2adcffc`](https://github.com/websublime/line-ui/commit/2adcffcdbe088afdb0e08c628759826217315bab), [`59a2265`](https://github.com/websublime/line-ui/commit/59a22652ef36d38483bcec2638904559701b5e06), [`22e0844`](https://github.com/websublime/line-ui/commit/22e0844e74daa23049b617a7fe7724b6186d2762)]:
  - @websublime/line-core@0.2.3
  - @websublime/line-themes@0.2.0

## 0.2.4

### Patch Changes

- [#308](https://github.com/websublime/line-ui/pull/308) [`71e3d0e`](https://github.com/websublime/line-ui/commit/71e3d0e61281522db563553efc9e810109569a91) Thanks [@miguelramos](https://github.com/miguelramos)! - `<line-button>` keeps the `variant` and `type` attributes an author writes, including unknown values, and a bare button no longer carries `variant` or `type` attributes.

## 0.2.3

### Patch Changes

- [#305](https://github.com/websublime/line-ui/pull/305) [`0519606`](https://github.com/websublime/line-ui/commit/05196068b3f183fc085afb392c680d1fbd4e1cdf) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-separator>` at `@websublime/line-components/separator`: a horizontal or vertical line with the `separator` role through `ElementInternals`, a `decorative` attribute for role `none`, and `--line-separator-color` and `--line-separator-thickness` tokens.

## 0.2.2

### Patch Changes

- [#303](https://github.com/websublime/line-ui/pull/303) [`dd1d1f0`](https://github.com/websublime/line-ui/commit/dd1d1f04094c8baa47bf2597428a6ff6dca9df36) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-stack>` at `@websublime/line-components/stack`: a flex layout container with `orientation`, `justify`, `align`, `wrap` and a `gap` scale from `0` to `5` over `--line-stack-gap`.

## 0.2.1

### Patch Changes

- [#300](https://github.com/websublime/line-ui/pull/300) [`00612da`](https://github.com/websublime/line-ui/commit/00612dab2e7c798333218b7935045fa4b777c397) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-button>` at `@websublime/line-components/button`: a form-associated button with `submit`, `reset` and `button` types, `primary` and `borderless` variants, a `pressed` toggle that fires `line-change`, a `loading` state with its own slot, and `--line-button-*` tokens.

- Updated dependencies [[`00612da`](https://github.com/websublime/line-ui/commit/00612dab2e7c798333218b7935045fa4b777c397)]:
  - @websublime/line-core@0.2.2

## 0.2.0

### Minor Changes

- [#298](https://github.com/websublime/line-ui/pull/298) [`e95fa93`](https://github.com/websublime/line-ui/commit/e95fa93e87fee31449906e28edb21f6a6d9fe8b3) Thanks [@miguelramos](https://github.com/miguelramos)! - Ship the Custom Elements Manifest: the package now includes `custom-elements.json`, declared by the `customElements` field and the `./custom-elements.json` export.

## 0.1.4

### Patch Changes

- [#296](https://github.com/websublime/line-ui/pull/296) [`97c1d28`](https://github.com/websublime/line-ui/commit/97c1d283ef3533f0a1836c2978b9b283bda47ec5) Thanks [@miguelramos](https://github.com/miguelramos)! - Requires `@zag-js/core` ^1.47.0.

- Updated dependencies [[`97c1d28`](https://github.com/websublime/line-ui/commit/97c1d283ef3533f0a1836c2978b9b283bda47ec5)]:
  - @websublime/line-core@0.2.1

## 0.1.3

### Patch Changes

- Updated dependencies [[`a394d44`](https://github.com/websublime/line-ui/commit/a394d44c8ab7979c87d3beda19db37f2e3d5c8e2), [`67ff29c`](https://github.com/websublime/line-ui/commit/67ff29cce09e1ff9622f83adb97fab8e02e94d3c)]:
  - @websublime/line-core@0.2.0

## 0.1.2

### Patch Changes

- [#285](https://github.com/websublime/line-ui/pull/285) [`97f32c0`](https://github.com/websublime/line-ui/commit/97f32c056af2a072278790508a8a9568e45d8591) Thanks [@miguelramos](https://github.com/miguelramos)! - The library builds keep every declared dependency external, and `@websublime/line-components` now declares `lit` and `@zag-js/core` and no longer sets `sideEffects`.

- Updated dependencies [[`97f32c0`](https://github.com/websublime/line-ui/commit/97f32c056af2a072278790508a8a9568e45d8591)]:
  - @websublime/line-core@0.1.3

## 0.1.1

### Patch Changes

- [#283](https://github.com/websublime/line-ui/pull/283) [`3a04024`](https://github.com/websublime/line-ui/commit/3a04024cbb2eeab2f3b7b832c41e5d66b5749d31) Thanks [@miguelramos](https://github.com/miguelramos)! - Type declarations are now emitted by TypeScript 7 `tsc --emitDeclarationOnly` instead of `vite-plugin-dts`; no API change.

- Updated dependencies [[`3a04024`](https://github.com/websublime/line-ui/commit/3a04024cbb2eeab2f3b7b832c41e5d66b5749d31)]:
  - @websublime/line-core@0.1.2

## 0.1.0

### Minor Changes

- [#219](https://github.com/websublime/line-ui/pull/219) [`1b3a3c2`](https://github.com/websublime/line-ui/commit/1b3a3c23ab5af04c04e30f2b939a39f7f98c11b0) Thanks [@miguelramos](https://github.com/miguelramos)! - Ship the `line-components` umbrella package's Phase 00 release at `0.1.0`; it contains no components yet and stays empty until later phases add them.

### Patch Changes

- [#216](https://github.com/websublime/line-ui/pull/216) [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920) Thanks [@miguelramos](https://github.com/miguelramos)! - Packages now declare the MIT license (`"license": "MIT"`) and ship its text as a `LICENSE` file in each tarball.

- [#215](https://github.com/websublime/line-ui/pull/215) [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5) Thanks [@miguelramos](https://github.com/miguelramos)! - Published tarballs now ship the built `dist/` output and real version ranges for internal `@websublime/line-*` dependencies instead of `workspace:` ranges.

- [#217](https://github.com/websublime/line-ui/pull/217) [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f) Thanks [@miguelramos](https://github.com/miguelramos)! - Package manifests now declare their source repository (`github.com/websublime/line-ui` and the package directory), which npm provenance verification needs.

- Updated dependencies [[`7a56fc6`](https://github.com/websublime/line-ui/commit/7a56fc67b64b2ce5aea9c72cd3af3702466e0793), [`520fe15`](https://github.com/websublime/line-ui/commit/520fe1513a63cf41d89632f4fb45d2eef4949fc8), [`c18589a`](https://github.com/websublime/line-ui/commit/c18589aebf5fa8b1a84e012922eead8cf6ec9f2b), [`2bf244b`](https://github.com/websublime/line-ui/commit/2bf244b66476cacf6fc90b80d5eea3d8b435a5a5), [`3734a26`](https://github.com/websublime/line-ui/commit/3734a2626fa30159e0b2b6c9650974ef41908f53), [`01dee79`](https://github.com/websublime/line-ui/commit/01dee7916d3a0e36907e2c99e6b133adf7e046e7), [`9211e93`](https://github.com/websublime/line-ui/commit/9211e938b54436ee1ee1c1e36c4a25b578cf6bce), [`90069a8`](https://github.com/websublime/line-ui/commit/90069a820619c6d8bc483f38889d34a3d23821a8), [`b9f8040`](https://github.com/websublime/line-ui/commit/b9f8040482f0619582475b3a600ca312f297e408), [`96ff7be`](https://github.com/websublime/line-ui/commit/96ff7be098c55c9bc2655f79f9ea660d43b6940c), [`a049305`](https://github.com/websublime/line-ui/commit/a04930564f74cf873483f3084866b73c82209920), [`e165a05`](https://github.com/websublime/line-ui/commit/e165a05db211f0b945c8be8f1758f871eecadca5), [`e94e2a8`](https://github.com/websublime/line-ui/commit/e94e2a80185a7b907f52a985611a575977fabb1f)]:
  - @websublime/line-core@0.1.0
  - @websublime/line-themes@0.1.0
  - @websublime/line-tokens@0.1.0
  - @websublime/line-utils@0.1.0
