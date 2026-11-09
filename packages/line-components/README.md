# @websublime/line-components

Headless web component implementations for the line://ui design system. Each component ships as its own subpath
that registers one tag. The root entry registers nothing and exports only the icon registry hook,
`setIconRegistry` and the `LineIconRegistry` type.

| Subpath | Registers |
|---------|-----------|
| `@websublime/line-components/alert` | `<line-alert>` |
| `@websublime/line-components/button` | `<line-button>` |
| `@websublime/line-components/button-group` | `<line-button-group>` |
| `@websublime/line-components/icon` | `<line-icon>` |
| `@websublime/line-components/icon-button` | `<line-icon-button>` |
| `@websublime/line-components/separator` | `<line-separator>` |
| `@websublime/line-components/stack` | `<line-stack>` |

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
composed). Unless a listener calls `preventDefault()`, the alert then sets `hidden` on itself. You pick the glyph and
the accessible name. Move focus in the handler to a named target, such as the section heading with `tabindex="-1"`,
because focus on the hidden control falls to the page body. A framework that re-renders the host from its own state
can clear `hidden`, so keep the visibility in that state. In a live alert the control's name is part of the live
region.
