# @websublime/line-components

Headless web component implementations for the line://ui design system. Each component ships as its own subpath
that registers one tag, and the root entry registers nothing.

| Subpath | Registers |
|---------|-----------|
| `@websublime/line-components/button` | `<line-button>` |
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
