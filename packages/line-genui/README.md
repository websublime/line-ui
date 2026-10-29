# @websublime/line-genui

Agent-driven UI for line://ui: component descriptors, catalogs and tool emitters, and the A2UI renderer `<line-a2ui-surface>`.

## Install

```sh
bun add @websublime/line-genui @websublime/line-components @websublime/line-icons
```

`@websublime/line-components` and `@websublime/line-icons` are peer dependencies.

## Entry points

| Import | Exports |
| --- | --- |
| `@websublime/line-genui/catalog` | Descriptors, catalogs and emitters. No DOM access. |
| `@websublime/line-genui/a2ui` | The A2UI session and `<line-a2ui-surface>`. Preview. |

The package has no root `.` export. Both entry points are empty until the Phase 1 G rows land.

## Preview status of `./a2ui`

- `@websublime/line-genui/a2ui` may change in any minor release.
- `@websublime/line-genui/a2ui` sits outside the breaking-changes policy (PRD §7.1) until the package targets a final A2UI v1.0.
- The descriptor API and the catalogs in `./catalog` follow the normal policy.
