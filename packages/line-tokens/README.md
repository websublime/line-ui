# @websublime/line-tokens

Primitive design tokens (typography, sizing, shadows, easings, z-index, opacity, motion, radii, border-width, focus-ring, breakpoints) and decorative families (aspects, animations, gradients, masks, layouts, highlights, svg) for the line://ui design system.

## Shadows

The shadow scale (`--line-shadow-1..6`, `--line-shadow-inner-1..3`) takes its colour from `@websublime/line-colors` (`--line-neutral-*`), and `@websublime/line-themes` adds the gray tint. Light mode uses `--line-gray-12` and dark mode uses `--line-gray-1`, chosen by the `color-scheme` of the element that paints the shadow. With `line-tokens` alone every shadow token computes `none` until you set `--line-shadow-color`.

- `--line-shadow-color` is optional and replaces the gray-role colour in both modes. It takes an opaque colour, because each layer applies its own opacity on top of it. A `light-dark()` value gives each mode its own colour.
- `--line-shadow-strength` (1%) and `--line-shadow-strength-dark` (25%) set the base opacity in light and dark mode.
- These three knobs take effect at every theming scope (`html`, `[data-accent]`, `[data-gray]`) at or below the element that sets them.
- The colour tokens `--line-shadow-color-{2,3,4,5,6,7,9}` and the shadow tokens are derived values. An override of one on `<html>` stops at the first nested theming scope, so write it for `html, [data-accent], [data-gray]` to apply it everywhere.
