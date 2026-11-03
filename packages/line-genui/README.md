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
| `@websublime/line-genui/catalog` | Descriptors, catalogs and emitters. Defines no element, and its own modules touch no DOM at load. Unbundled, the `@a2ui/web_core/v0_9` module it imports loads Lit, which touches the DOM when it loads; a bundler drops it. |
| `@websublime/line-genui/a2ui` | The A2UI session and `<line-a2ui-surface>`. Preview. |

The package has no root `.` export. `./a2ui` is empty until the Phase 1 G4 row lands.

## Descriptors (`./catalog`)

A descriptor tells the agent-facing layers how to use one `line-components` component. Its fields are the catalog name, the tag, `load()` (a dynamic import of the component subpath), a Zod 3 prop schema built on the `@a2ui/web_core` common types, the slot, binding and action maps, the accessibility requirements, the agent-facing description and `agentExposed` (default `true`; `false` takes `agentHiddenReason`).

```ts
import { Catalog } from '@a2ui/web_core/catalog';
import { buttonDescriptor, descriptors } from '@websublime/line-genui/catalog';

const catalog = new Catalog('https://example.com/catalog.json', '0.9', [...descriptors]);
catalog.toJson(); // component and property descriptions, with `$ref`s to the common types
await buttonDescriptor.load(); // defines <line-button>
```

| Export | What it is |
| --- | --- |
| `buttonDescriptor`, `iconDescriptor`, `separatorDescriptor`, `stackDescriptor` | The descriptors of Button, Icon, Separator and Stack |
| `descriptors` | Every descriptor above |
| `defineDescriptor(init)` | Builds a descriptor from its fields and its own props; `agentExposed` defaults to `true` |
| `componentSchema(description, props)` | The strict prop schema: `props` plus the A2UI `accessibility` object, described and annotated with the `ComponentCommon` mixin |
| `commonProp(type, description)` | A common-type prop (`DynamicString`, `DynamicBoolean`, `DynamicNumber`, `ComponentId`, `ChildList`, `Action`) whose description reaches `toJson()` beside a `$ref`; describe an enum or another plain prop with `.describe()` |
| `LineDescriptor` and the field types | The descriptor type, its binding (attribute, property or surface lookup), slot and action maps, and its accessibility requirements |

## Preview status of `./a2ui`

- `@websublime/line-genui/a2ui` may change in any minor release.
- `@websublime/line-genui/a2ui` sits outside the breaking-changes policy (PRD §7.1) until the package targets a final A2UI v1.0.
- The descriptor API and the catalogs in `./catalog` follow the normal policy.
