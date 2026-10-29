# @websublime/line-components

Headless web component implementations for the line://ui design system. Each component ships as its own subpath
that registers one tag, and the root entry registers nothing.

| Subpath | Registers |
|---------|-----------|
| `@websublime/line-components/button` | `<line-button>` |
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
