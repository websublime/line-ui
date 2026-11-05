# @websublime/line-themes

Role-mapped theme layers (accent, gray, semantics, aliases, defaults) consumed via CSS subpaths. Depends on `@websublime/line-colors` and `@websublime/line-schemas` (wired in B2).

Select a hue for a role with `data-accent="{hue}"` and `data-gray="{hue}"`. The Radix `gray` hue is `neutral` (`accent/neutral`, `gray/neutral`). The gray role keeps `--line-gray-*` and `data-gray`.

## Cascade layer

Every rule of this package sits inside the cascade layer `line`, and every selector uses `:where()`, except the `body` rule of the MCP Apps host bridge below. `@websublime/line-tokens`, `@websublime/line-colors` and `@websublime/line-themes` share that one layer. A rule of yours outside `@layer` beats every rule in `line` at any specificity and in any order. If your stylesheets declare their own layers, start them with `@layer line;` or put `line` first in your layer order statement, so every layer you declare later wins. Load the CSS as it is, because `@import '…' layer(line)` would nest the layer as `line.line`.

## MCP Apps host bridge

`@websublime/line-themes/hosts/mcp-apps.css` maps the MCP Apps host style variables onto line aliases and tokens. It is not part of the root barrel: `@websublime/line-themes` does not import it, so an MCP Apps view loads it on its own.

- Load it after the `line-themes` CSS. Its aliases tie on specificity with the `line-themes` aliases in the same `line` layer, so the later sheet wins.
- The ext-apps `applyHostStyleVariables` helper sets the host values as custom properties on `<html>`. `applyDocumentTheme` sets only `data-theme` and `color-scheme`, and no custom properties. A key the host leaves unset keeps the line value.
- The aliases (colours) apply at the root only. Nested `data-accent` and `data-gray` scopes keep the line steps.
- The primitives (fonts, weights, sizes, line heights, radii, focus-ring colour) are declared on `body`, so they apply from `body` down; `<html>` itself keeps the line tokens. The `body` selector is the one selector here outside `:where()`.
- While the bridge is loaded, `body` always recomposes `--line-focus-ring` from `--line-focus-ring-width`, `--line-focus-ring-style` and `--line-focus-ring-color`. An override of the composite `--line-focus-ring` on `:root` or `html` no longer reaches `body` and below, even when the host sends no ring colour; override the three part tokens instead.

```css
@import '@websublime/line-tokens';
@import '@websublime/line-colors';
@import '@websublime/line-themes';
@import '@websublime/line-themes/hosts/mcp-apps.css';
```
