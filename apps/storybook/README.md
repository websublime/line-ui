# @websublime/line-storybook

Storybook 10 workspace for the line://ui design system, built on `@storybook/web-components-vite`. Private (never
published).

## Run

The preview loads the built CSS of `@websublime/line-colors` and `@websublime/line-themes`, so build the packages
first.

| Task | Command |
|---|---|
| Build packages, then Storybook | `bun run build` (repo root) |
| Dev server on port 6006 | `bun --filter '@websublime/line-storybook' dev` |
| Static build to `storybook-static/` | `bun --filter '@websublime/line-storybook' build` |
| Type-check config and stories | `bun --filter '@websublime/line-storybook' typecheck` |

## Theming toolbar

`.storybook/preview.ts` declares two toolbar menus, **Accent** and **Gray**, built from `ACCENT_HUES` and
`GRAY_HUES`. They set `data-accent` and `data-gray` on the preview `<html>`. The first item of each menu,
`default` and `auto`, removes its attribute, so the default accent and the auto-paired gray show.

The Radix gray hue is named `neutral` (`--line-neutral-*`); `--line-gray-*` is the gray role.

## Guides

- **Getting Started** installs the three CSS packages and shows a hello world themed with `data-accent`.
- **Theming** covers `data-accent` and `data-gray` scoping, the hue catalogue, gray auto-pairing, light and dark
  mode, the semantic roles and the named aliases. Its demo stories live in `stories/theming.stories.ts` under the
  `!dev` tag, so the sidebar lists only the guide.

## Design-system stories

- **Design System/Palettes** shows every hue in light and dark side by side: the 12 base steps
  `--line-{hue}-1..12`, the 12 alpha steps `--line-{hue}-a1..a12` over the mode's backdrop, and the contrast
  token on step 9.
- **Design System/Roles → All bindings** shows each role bound to every hue it can take: accent × 31 (gray
  auto-paired), gray × 6, and the four semantic roles. Each role shows its 12 steps, its contrast token on step 9,
  and its 9 aliases.
- **Design System/Roles → Toolbar** shows the six roles at the preview root, so the `data-accent` and `data-gray`
  attributes the toolbar sets on `<html>` drive the accent and gray roles.

The Roles stories have a `mode` control that switches `color-scheme` between light and dark.
