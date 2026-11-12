# @websublime/line-components

Headless web component implementations for the line://ui design system. Each component ships as its own subpath
that registers one tag. The root entry registers nothing and exports only the icon registry hook,
`setIconRegistry` and the `LineIconRegistry` type.

| Subpath | Registers |
|---------|-----------|
| `@websublime/line-components/alert` | `<line-alert>` |
| `@websublime/line-components/avatar` | `<line-avatar>` |
| `@websublime/line-components/avatar-group` | `<line-avatar-group>` |
| `@websublime/line-components/badge` | `<line-badge>` |
| `@websublime/line-components/button` | `<line-button>` |
| `@websublime/line-components/button-group` | `<line-button-group>` |
| `@websublime/line-components/chip` | `<line-chip>` |
| `@websublime/line-components/icon` | `<line-icon>` |
| `@websublime/line-components/icon-button` | `<line-icon-button>` |
| `@websublime/line-components/separator` | `<line-separator>` |
| `@websublime/line-components/stack` | `<line-stack>` |
| `@websublime/line-components/visually-hidden` | `<line-visually-hidden>` |
| `@websublime/line-components/portal` | `<line-portal>` |

```js
import '@websublime/line-components/button';
```

The package ships `custom-elements.json`, the Custom Elements Manifest of every component.

## Stack

`<line-stack>` lays out its children in one row or one column with a gap between them. The host is the flex
container, it adds no role, and it exposes no `::part()`; style it directly with `line-stack { … }`.

| Attribute | Values | Default |
|-----------|--------|---------|
| `orientation` | `vertical`, `horizontal` | `vertical` |
| `justify` | `start`, `center`, `end`, `spaceBetween`, `spaceAround`, `spaceEvenly`, `stretch` (every item grows) | `start` |
| `align` | `start`, `center`, `end`, `stretch` | `stretch` |
| `gap` | `0`–`5` on the `--line-layout-gap-*` scale | step `2` |
| `wrap` | boolean | off |

```html
<line-stack orientation="horizontal" justify="spaceBetween" align="center" gap="3">
  <span>Title</span>
  <line-button>Edit</line-button>
</line-stack>
```

The gap reads `--line-stack-gap`, so load `@websublime/line-tokens/sizing` and `@websublime/line-tokens/layouts`
or set `--line-stack-gap` yourself; without them the gap is `0`. For a list, put `role="list"` on the host and
`role="listitem"` on each child.

## Separator

`<line-separator>` draws a thin line between sections of content. The host is the line, it renders nothing
inside, and it exposes no `::part()`; style it directly with `line-separator { … }`. It adds no margin, so the
surrounding layout, such as a `<line-stack>` `gap`, spaces it.

| Attribute | Values | Default |
|-----------|--------|---------|
| `orientation` | `horizontal`, `vertical` | `horizontal` |
| `decorative` | boolean | off |

```html
<line-separator></line-separator>
<line-stack orientation="horizontal" align="center">
  <a href="/docs">Docs</a>
  <line-separator orientation="vertical"></line-separator>
  <a href="/blog">Blog</a>
</line-stack>
```

Assistive technology announces it as a separator, with the host `aria-label` as its name when one is set. The
role and orientation are `ElementInternals` defaults, so an author `role` or `aria-*` attribute wins. Set
`decorative` when the line only adds visual rhythm, so assistive technology skips it, and give a decorative
separator no `aria-label`. The line is a border side coloured by `--line-separator-color` (default
`var(--line-gray-6, currentColor)`) and as thick as `--line-separator-thickness` (default
`var(--line-border-1, 1px)`), so it stays visible without `line-themes`, `line-tokens` and in forced-colors mode.

## Icon

`<line-icon>` draws one glyph at the size and in the colour of the surrounding text. Register your icon sets
once with `setIconRegistry` from the root entry; any object with `resolve(library, name, options?)` fits, such as
the `IconRegistry` of `@websublime/line-icons`.

```js
import { setIconRegistry } from '@websublime/line-components';
import '@websublime/line-components/icon';
import { IconRegistry } from '@websublime/line-icons';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';

const registry = new IconRegistry();
registry.register('lucide', createLucideResolver({ base: '/icons/lucide/' }));
setIconRegistry(registry);
```

| Attribute or property | Values | Default |
|-----------------------|--------|---------|
| `library` | the key a resolver is registered under | none |
| `name` | an icon name in that library | none |
| `weight` | passed to the resolver as `options.weight`, such as a Phosphor `fill` | none |
| `mirror` | boolean; flips the glyph in a right-to-left context | off |
| `src` | URL of an SVG file | none |
| `path` (property only) | SVG path data in a `0 0 24 24` box | none |

```html
<line-icon library="lucide" name="house"></line-icon>
<line-icon library="lucide" name="circle-alert" aria-label="Error"></line-icon>
<line-icon library="lucide" name="arrow-left" mirror></line-icon>
<line-icon src="/my-icons/logo.svg"></line-icon>
```

The first non-empty source of `path`, `src`, then `name` with `library` wins, with no fallback between them.
`library` has no default, so a `name` without `library`, an unknown name or any failed load leaves an empty box
of the icon's size and raises no error. `LineIcon.registry` reads and writes the same registry as
`setIconRegistry`; every connected icon, from any copy of the package, resolves again when either runs.

The icon is decorative and hidden from assistive technology. A host `aria-label` or `aria-labelledby` makes it an
image with that name. Both are `ElementInternals` defaults, so an author `role` or `aria-*` attribute wins. The
size comes from `--line-icon-size` (default `1em`), set on the icon or on any ancestor, and the colour from
`color`; `::part(svg)` reaches the glyph.

Every SVG string, from a resolver or from `src`, passes the Trusted Types policy `line-icon`, `DOMParser` and an
element and attribute allowlist that keeps vector shapes only. A page that enforces Trusted Types lists
`trusted-types line-icon lit-html`, because Lit creates its own `lit-html` policy. Two copies of the package on
one page each create a `line-icon` policy, which needs `'allow-duplicates'`; without it the second copy's icons
stay empty. A resolver may return an `SVGElement` instead, which is inserted unchanged, so return a fresh node per
call and give it `aria-hidden="true"` unless it should be announced.

## IconButton

`<line-icon-button>` runs an action and shows only an icon. It renders a native `<button type="button">` inside
its shadow root, so it never submits or resets a form, and it is not form-associated. Put the icon in its default
slot and name the button with the host `aria-label`, which is copied to the inner button; without it the button
has no name.

| Attribute | Values | Default |
|-----------|--------|---------|
| `variant` | `default`, `primary`, `borderless` | `default` |
| `disabled` | boolean | off |
| `loading` | boolean; keeps focus, sets `aria-disabled="true"` and renders the `loading` slot | off |
| `pressed` | `true`, `false`; makes a toggle that flips on each press and fires `line-change` | unset |
| `aria-label`, `aria-description` | copied to the inner button | none |

```html
<line-icon-button variant="borderless" aria-label="Close dialog">
  <line-icon library="lucide" name="x"></line-icon>
</line-icon-button>
<line-icon-button pressed="false" aria-label="Mute">
  <line-icon library="lucide" name="volume-x"></line-icon>
</line-icon-button>
```

The box is a square of at least `--line-icon-button-size` (default `var(--line-size-7)`, `2rem`), and the icon
follows `--line-icon-button-font-size`. `::part(root)`, `::part(icon)` and `::part(loading)` reach the inner
button and the wrappers of its two slots; the state shows as `data-*` attributes and `:state()` on the host.
A `<fieldset disabled>` ancestor does not disable it, because it is not form-associated; set `disabled` on it.

## ButtonGroup

`<line-button-group>` groups related buttons into one toolbar. The group is one Tab stop, and the arrow keys move
focus between its buttons. It carries the `toolbar` role on its host, so name it with `aria-label` or
`aria-labelledby`. It imports no button: the `<line-button>` and `<line-icon-button>` children of its default slot
are its buttons, and a child with the `hidden` attribute is left out. It writes `tabindex` and
`data-line-button-group-position` (`first`, `middle`, `last`, `only`) on those children and removes both from a
child that leaves.

| Attribute | Values | Default |
|-----------|--------|---------|
| `orientation` | `horizontal` (Left and Right arrows, mirrored right-to-left), `vertical` (Up and Down arrows) | `horizontal` |
| `loop` | boolean; the arrows wrap from the last button to the first and back | off |

Home and End move to the first and last button, and Tab returns to the button that last had focus. Disabled
buttons are skipped; loading buttons stay reachable. When the focused button is disabled, hidden or removed, focus
moves to the next button that is not disabled, else the previous one.

```html
<line-button-group aria-label="Text formatting">
  <line-button pressed="false">Bold</line-button>
  <line-button pressed="false">Italic</line-button>
  <line-button pressed="false">Underline</line-button>
</line-button-group>
```

The group squares the corners between its buttons by writing their `--line-button-radius` and
`--line-icon-button-radius` tokens; the outer corners take `--line-button-group-radius` (default
`var(--line-radius-2)`), and `--line-button-group-gap` (default `0`) spaces the buttons. Use a toolbar for three or
more controls; place fewer side by side with `<line-stack orientation="horizontal">`.

## Alert

`<line-alert>` is an inline box that tells the user about the state of something on the page, such as a saved
change, a warning or a failed payment. It stays until your code removes it or the user activates its dismiss
control, and it takes no focus. The `icon`, `title`, default, `actions` and `dismiss` slots take your content: the
icon sits at the start of the first row, the title above the message beside it, the dismiss control at the end of
the first row, and the actions in a wrapping row below the message. A zone whose slot is empty takes no space.

| Attribute | Values | Default |
|-----------|--------|---------|
| `variant` | `neutral`, `info`, `success`, `warning`, `danger` | `neutral` |
| `live` | `off`, `polite` (the `status` role), `assertive` (the `alert` role) | `off` |

```html
<line-alert variant="danger" live="assertive">
  <line-icon slot="icon" library="lucide" name="circle-alert"></line-icon>
  <h3 slot="title">Payment failed</h3>
  <p>Check the card number and try again.</p>
  <line-button slot="actions" variant="primary">Retry</line-button>
  <line-icon-button slot="dismiss" aria-label="Dismiss">
    <line-icon library="lucide" name="x"></line-icon>
  </line-icon-button>
</line-alert>
```

With `live` off, the host has no role. `polite` and `assertive` put the `status` or `alert` role on the host through
`ElementInternals`, with the role's live-region properties, from the moment the alert is inserted; how a screen
reader announces it is not verified by any automated check. Set `live` before you insert the alert or change its
text. An author `role` or `aria-live` on the host wins. Name only a live alert, with `aria-label`, because a host without a role takes no name. State the tone
in words too, such as "Error: …", because colour alone does not reach every user and forced-colors mode draws
every variant alike.

`variant` sets `--line-alert-bg`, `--line-alert-color`, `--line-alert-border-color` and `--line-alert-icon-color`
from the `line-themes` role aliases, such as `var(--line-danger-bg)`; `neutral` uses the `gray` role.
`--line-alert-border-width`, `--line-alert-radius`, `--line-alert-padding` and `--line-alert-gap` default to
`--line-border-1`, `--line-radius-2`, `--line-size-3` and `--line-size-2`. `::part(root)`, `::part(icon)`,
`::part(content)`, `::part(title)`, `::part(description)`, `::part(actions)` and `::part(dismiss)` reach the box and
its zones. Load `@websublime/line-tokens/reset` to zero the margins of slotted headings and paragraphs.

A click on the control in the `dismiss` slot fires `line-dismiss` (`detail` `{}`, bubbling, cancelable, not
composed). Unless a listener calls `preventDefault()` on it, the alert then sets `hidden` on itself. A click that is
already cancelled when it reaches the `dismiss` slot, by the control, inside it or in a capture listener, does not
dismiss; a bubble listener on the host or the document, such as React's root-delegated `onClick`, runs too late, so
cancel `line-dismiss` to keep the alert shown. You pick the glyph and
the accessible name. Move focus in the handler to a named target, such as the section heading with `tabindex="-1"`,
because focus on the hidden control falls to the page body. A framework that re-renders the host from its own state
can clear `hidden`, so keep the visibility in that state. In a live alert the control's name is part of the live
region.

## Badge

`<line-badge>` is a small, non-interactive status marker: a count such as "5", a short label such as "Beta", or a
dot. Write the count or the label as text in the default slot; a badge whose slot holds no element and no text other
than whitespace draws as a dot and reflects `data-empty` and `:state(empty)` on the host. The badge formats no
number, so write a capped count yourself, such as "99+". It takes no focus and handles no key.

| Attribute | Values | Default |
|-----------|--------|---------|
| `variant` | `neutral`, `info`, `success`, `warning`, `danger` | `neutral` |
| `aria-label`, `aria-labelledby` | name the badge, which then has the `img` role | none |

```html
<line-button>Inbox <line-badge slot="suffix" variant="danger">5</line-badge></line-button>
<line-badge variant="info">Beta</line-badge>
<line-badge variant="success" aria-label="Online"></line-badge>
<line-badge aria-live="polite">3</line-badge>
```

A count or a label has no role: it is read as text where it sits, and inside a button or link it joins that
control's name, such as "Inbox 5". A dot is hidden from assistive technology. A non-blank `aria-label` or an
`aria-labelledby` on the host gives any badge the `img` role with that name, through `ElementInternals`, so an author
`role` or `aria-hidden` on the host wins. Name a dot whose meaning nothing nearby states, and state a tone in words
too, because colour alone does not reach every user. The badge announces nothing when its text changes; for a count
that must be heard, set `aria-live="polite"` on the host before the count changes. The badge stays inline: place it
over another element through that component's slot, such as Button's `suffix`, or with your own CSS.

`variant` sets `--line-badge-bg` and `--line-badge-color`, the soft fill and text of a count or a label, and
`--line-badge-dot-color`, the solid fill of a dot, from the `line-themes` role aliases, such as `var(--line-danger-bg)`,
`var(--line-danger-text)` and `var(--line-danger-solid)`; `neutral` uses the `gray` role. Without `line-themes`
a count keeps a transparent fill and the inherited text colour, and a dot draws in `currentColor`.
`--line-badge-radius`, `--line-badge-height`, `--line-badge-padding-inline`, `--line-badge-font-size`,
`--line-badge-font-weight` and `--line-badge-dot-size` default to `--line-radius-round`, `--line-size-4`,
`--line-size-1`, `--line-font-size-0`, `--line-font-weight-5` and `--line-size-2`. `::part(root)` reaches the box.

## Avatar

`<line-avatar>` is a small picture that stands for a person or an organisation: a photo, a logo, or the initials of
a name. Set `src` to the image URL and `name` to the name. The image shows once it has loaded; while it loads, when it
fails and when there is none, the fallback shows: the `fallback` slot, or the initials of `name`, the first character
of the first and the last word, uppercased for the nearest `lang`. For `srcset`, `<picture>`, lazy loading or an
inline SVG logo, put that element in the default slot; it replaces the `src` image and is not tracked. A `status`
slot places one presence marker over the inline-end, block-end corner. The avatar takes no focus and fires no event.

| Attribute | Values | Default |
|-----------|--------|---------|
| `src` | an image URL; blank means no image | none |
| `name` | the accessible name and the source of the initials | none |
| `aria-label`, `aria-description` | a spoken name in place of `name`, and a description | none |

```html
<line-avatar src="/people/ana.jpg" name="Ana Silva"></line-avatar>
<line-avatar name="Ana Silva"></line-avatar>
<a href="/me">
  <line-avatar src="/people/ana.jpg" name="Ana Silva">
    <line-badge slot="status" variant="success" aria-label="Online"></line-badge>
  </line-avatar>
</a>
```

The avatar is one image to assistive technology: its `root` part carries the `img` role, named by the host
`aria-label` or else by `name`, and the picture and the initials stay presentational under it. An avatar with no name
is decorative and silent, so leave `name` empty only when the name is written beside it. Give custom media
`alt=""`. The status marker sits outside the image and names itself, so a link around the example above is named
"Ana Silva Online". `aria-labelledby` on the host is not supported. `data-loading` and `data-error`, with
`:state(loading)` and `:state(error)`, follow the `src` image.

Every `--line-avatar-*` token is read with its default as a fallback and none is declared on the host, so a
container sets them by inheritance: `--line-avatar-size` (`--line-size-7`), `--line-avatar-radius`
(`--line-radius-round`), `--line-avatar-bg` (`--line-gray-bg`), `--line-avatar-color` (`--line-gray-text`),
`--line-avatar-font-size` (40% of the size), `--line-avatar-font-weight` (`--line-font-weight-5`),
`--line-avatar-fit` (`cover`), `--line-avatar-ring-width` (`0px`), `--line-avatar-ring-color`
(`--line-gray-1`, or `Canvas` without `line-themes`), `--line-avatar-status-inset` (`0`) and
`--line-avatar-status-visibility` (`visible`). `::part(root)`, `::part(image)` and `::part(fallback)` reach the frame,
the picture and the fallback box.

## AvatarGroup

`<line-avatar-group>` shows a row of overlapping avatars, such as the members of a project, and ends it with a "+N"
button when there are more than `max`. Every element child without `hidden` counts as one avatar: a `<line-avatar>`,
or a link around one. The first `max` show in the stack and the rest move into a panel, a native `popover` that "+N"
opens; Escape, a click outside or a second press closes it, and after Escape focus returns to "+N". The group never
imports Avatar and never writes on its children: it places each one by manual slot assignment, so a child's `slot`
attribute has no effect.

| Attribute | Values | Default |
|-----------|--------|---------|
| `max` | an integer of 1 or more; how many avatars show in the stack | none: every avatar shows |
| `size` | `1`–`5`: the avatars and "+N" take `--line-size-5`…`-9` | none: the avatars' own size |
| `spacing` | `0`–`3`: the overlap is `0px`, `--line-size-1`, `-2` or `-3` | none: `--line-size-2` |
| `overflow-label` | the "+N" name, with every `{count}` replaced by the number; a label without `{count}` follows the "+N" | none: "+N" is the name |

```html
<line-avatar-group aria-label="Project members" max="3" overflow-label="+{count} more members">
  <line-avatar src="/people/ana.jpg" name="Ana Silva"></line-avatar>
  <line-avatar src="/people/rui.jpg" name="Rui Costa"></line-avatar>
  <line-avatar name="Marta Sousa"></line-avatar>
  <line-avatar src="/people/joao.jpg" name="João Lima"></line-avatar>
</line-avatar-group>
```

The group carries the `group` role on its host, so name it with `aria-label` or `aria-labelledby`. While a mouse or
pen pointer rests on the group, or keyboard focus is within it, the avatars spread apart toward inline-start and "+N"
stays put; Escape stacks them again until the pointer and focus have both left, and a touch tap never spreads them by
itself. The spread avatars overlap the content before the group by up to (avatars in the stack) × (overlap + gap),
36px with the defaults and `max="3"`, so leave that space at its inline-start or cap the stack with `max`. The panel
opens under "+N" at the group's inline-start and follows the group's direction, also inside a subtree whose
direction differs from the page's; near a viewport edge it moves above "+N" or to its other side. `data-expanded`,
`data-open` and `data-focus-visible`, with `:state(expanded)`, `:state(open)` and `:state(focus-visible)`, follow the
stack, the panel and the keyboard focus on "+N". It fires no event.

The group sets `--line-avatar-ring-width` (`--line-border-2`) and, with `size`, `--line-avatar-size` on its host, and
the avatars inherit them through any wrapper; "+N" reads the Avatar tokens, so it matches an avatar. Its own tokens
are `--line-avatar-group-overlap` (`--line-size-2`), `--line-avatar-group-gap` (`--line-size-1`, the spread gap),
`--line-avatar-group-duration` (`--line-motion-fast`, `0s` under reduced motion), `--line-avatar-group-focus-ring`,
and `--line-avatar-group-content-bg`, `-border-color`, `-border-width`, `-radius`, `-shadow`, `-padding`, `-gap`,
`-offset` and `-max-inline-size` for the panel. Write a zero overlap or gap as `0px`. `::part(root)`,
`::part(overflow)` and `::part(content)` reach the "+N" wrapper with its focus ring, the "+N" button and the panel.

## Chip

`<line-chip>` is a compact toggle button for a category, a filter or a selection. Each press turns it on or off. It
renders a native `<button type="button" aria-pressed>` inside its shadow root, so it never submits or resets a form,
and it is not form-associated. The slotted text names it.

| Attribute | Values | Default |
|-----------|--------|---------|
| `pressed` | boolean; present is on, absent or `"false"` is off | off |
| `variant` | `default`, `primary` | `default` |
| `disabled` | boolean; removes the chip from the tab order and blocks presses | off |
| `aria-label`, `aria-description` | copied to the inner button | none |

```html
<line-stack orientation="horizontal" wrap role="group" aria-label="Filters">
  <line-chip pressed>In stock</line-chip>
  <line-chip>
    <line-icon slot="indicator" library="lucide" name="check"></line-icon>
    Free shipping
  </line-chip>
  <line-chip variant="primary">Unread <span slot="suffix">12</span></line-chip>
</line-stack>
```

Each press by pointer, Enter or Space flips `pressed` and then fires `line-change` (`detail` `{ value }`, the new
state, bubbling, not composed). Setting `pressed` from code fires nothing, and a `click` listener that calls
`preventDefault()` cancels the flip. While `disabled`, no `click` reaches your listeners. Several chips each toggle
on their own; wrap a set in an element with `role="group"` and an `aria-label`, because Chip has no group role.

The `prefix` slot takes a leading icon, the default slot the label, and the `suffix` slot a count or an icon, never a
remove button or another control. The `indicator` slot takes a pressed mark, such as a check icon, and renders only
while the chip is on. The name is the slotted content in that tree order, so a count in `suffix` joins it; a
decorative `<line-icon>` adds nothing, and the host `aria-label` replaces the whole name.

With `line-themes` loaded, an off chip takes the `gray` role and a pressed chip the soft `accent` role; a `primary`
chip is an accent outline when off and solid accent when pressed. The four rows set `--line-chip-bg`,
`--line-chip-color` and `--line-chip-border-color`. `--line-chip-radius`, `--line-chip-border-width`,
`--line-chip-height`, `--line-chip-padding-inline`, `--line-chip-gap`, `--line-chip-font-size`,
`--line-chip-font-weight` and `--line-chip-focus-ring` default to `--line-radius-round`, `--line-border-1`,
`--line-size-6`, `--line-size-3`, `--line-size-1`, `--line-font-size-1`, `--line-font-weight-5` and the focus ring.
Set a colour token under a state selector, such as `line-chip[data-pressed]`, because a token set on `line-chip`
alone applies to every state. `::part(root)`, `::part(indicator)` and `::part(label)` reach the inner button and the
wrappers of the indicator and the label; the state shows as `data-pressed`, `data-disabled` and
`data-focus-visible` and the matching `:state()` on the host. A `<fieldset disabled>` ancestor does not disable it.

## Visually Hidden

`<line-visually-hidden>` holds content that assistive technology reads and the screen does not show. The content
stays in the accessibility tree, is read where it sits, and joins the name of a link, a button or a heading around
it. The host draws nothing and takes no space in a block, flex or grid parent. It has no attributes, parts, tokens or
events; style it directly with `line-visually-hidden { … }`.

```html
<a href="/pricing">Read more<line-visually-hidden> about pricing</line-visually-hidden></a>
<button type="button">
  Inbox <line-badge>5<line-visually-hidden> unread messages</line-visually-hidden></line-badge>
</button>
<line-visually-hidden class="skip"><a href="#main">Skip to main content</a></line-visually-hidden>
```

While focus is inside the host, the content shows, so a skip link appears when a keyboard user reaches it. Place it
with your own CSS on `line-visually-hidden:focus-within`. Put hidden words after a control's visible words, so the
name starts with what users see. Use `hidden` on the host to remove the words for everyone, not `aria-hidden`,
because Chromium keeps an `aria-hidden` host's words in the name of a control around it. Give the host no
`aria-label`, because it has no role a name could attach to. It announces nothing when its content changes.

The hiding rule sits on `:host` with normal declarations, so your CSS on the host can show the words, such as at a
breakpoint. The words show until the module runs; to hide them before then, add this rule to the page:

```css
line-visually-hidden:not(:defined):not(:focus-within) {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

## Portal

`<line-portal>` shows its content in the browser top layer, above `overflow` clipping, transformed ancestors and
stacking contexts. Nothing moves: the content stays where it is in the DOM, so it keeps its theme, direction, language
and inherited custom properties, its events bubble through the host to its ancestors, a form control in it still
submits with its form, and focus order and reading order follow the markup. Keep the Portal next to its trigger. It
has one part, `root`, the top-layer box; one boolean, `disabled`; one method, `bringToFront()`; no tokens and no
events.

```html
<div class="card" style="overflow: hidden">
  <button type="button" class="trigger">Options</button>
  <line-portal class="menu">
    <ul>
      <li><a href="/rename">Rename</a></li>
    </ul>
  </line-portal>
</div>
```

The box sits at the logical start corner of the viewport, where an unplaced box covers the page and takes its clicks.
Place it through `::part(root):popover-open`, for example under its trigger with CSS anchor positioning:

```css
.trigger {
  anchor-name: --menu;
}
line-portal.menu::part(root):popover-open {
  position-anchor: --menu;
  inset: auto;
  inset-block-start: anchor(end);
  inset-inline-start: anchor(start);
}
```

`disabled` renders the content in place, in the flow of the host's parent, without the top layer; placement rules on
`:popover-open` never reach it. The host takes `hidden`.

Top-layer boxes stack in the order they were shown, so a modal dialog opened after the Portal paints above it. Call
`bringToFront()` after every `showModal()`, including each reopening of the same dialog. The call is synchronous and
does nothing before the first update, while an update that clears `disabled` is pending, while `disabled`, or while
disconnected. A Portal outside the open modal dialog then paints above its backdrop, but its content stays inert. The
call raises only its own box: raise nested portals outer first, then inner, and after clearing `disabled` on the
outer Portal, `await outer.updateComplete` before raising the inner one.

Give the host no `aria-label`, because it has no role a name could attach to. No check reads the Firefox or WebKit
accessibility tree, and no screen reader was run on top-layer content. The content shows in place, clipped by its
ancestors, until the module runs; to hide it before then, add this rule to the page:

```css
line-portal:not(:defined) {
  display: none;
}
```
