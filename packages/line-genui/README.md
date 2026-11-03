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
| `@websublime/line-genui/catalog` | Descriptors, the `line` catalog emitters and the `basic` implementation map. Defines no element, and its own modules touch no DOM at load. Unbundled, the `@a2ui/web_core/v0_9` module it imports loads Lit, which touches the DOM when it loads; a bundler drops it. |
| `@websublime/line-genui/catalog.json` | The `line` catalog document, JSON (see below). |
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

## The `line` catalog (`./catalog`, `./catalog.json`)

The `line` catalog holds every descriptor with `agentExposed: true` under the id `https://line-ui.websublime.com/a2ui/catalogs/line/v1/catalog.json`. The id is an identifier and need not resolve; an incompatible change to the catalog moves it to a new version segment, such as `v2`.

`@websublime/line-genui/catalog.json` is its A2UI v0.9 document form, emitted at build time: the layout of the A2UI basic catalog document, with `$defs/anyFunction: false` and an open `$defs/theme`, so the published `common_types.json` and `server_to_client.json` compile against it. Give it to an agent that reads a catalog document, or load it with `Catalog.fromJson`.

```ts
import catalog from '@websublime/line-genui/catalog.json' with { type: 'json' };
import { descriptors, inlineCatalog, lineCapabilities, lineCatalogDocument } from '@websublime/line-genui/catalog';

lineCatalogDocument(descriptors); // the same document, built at run time
inlineCatalog(catalog); // the inline form a renderer advertises
lineCapabilities(catalog); // { 'v0.9': …, 'v0.9.1': … }, the line id only
lineCapabilities(catalog, { basic: true }); // also lists the A2UI basic catalog id
```

| Export | What it is |
| --- | --- |
| `LINE_CATALOG_ID` | The `line` catalog id |
| `lineCatalog(descriptors)` | The `web_core` v0.9 `Catalog` of the agent-exposed descriptors, under `LINE_CATALOG_ID` |
| `lineCatalogDocument(descriptors)` | Its document form, the JSON that `catalog.json` holds |
| `inlineCatalog(document)` | The inline projection of a catalog document, which validates against `client_capabilities.json#/$defs/Catalog`. `web_core` derives it (`Catalog.fromJson`, then `MessageProcessor.getRendererCapabilities`), and writes each common-type reference as `#/$defs/<name>` |
| `lineCapabilities(document, { basic? })` | The client capabilities for `a2uiClientCapabilities`. `v0.9` and `v0.9.1` (`ADVERTISED_VERSIONS`) each list the `line` id and inline its projection. `basic: true` adds the basic catalog id, uninlined; it stays off by default until line maps every basic type |
| `BASIC_CATALOG_ID` | `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json`, the only v0.9 basic catalog id `web_core` 0.14.0 knows |
| `basicImplementations(catalogId)` | The `basic` implementation map for `BASIC_CATALOG_ID`, and `undefined` for any other id |
| `CatalogJson`, `InlineCatalog`, `LineCapabilities`, `LineCapabilitiesOptions`, `VersionCapabilities` | The types of the documents and capabilities above |
| `BasicImplementationMap`, `BasicImplementation`, `BasicTarget`, `BasicTypeName`, `BasicTextVariant`, `TargetAttributes` | The types of the `basic` map |

### The `basic` implementation map

line renders the A2UI basic catalog under its upstream id and does not re-emit its JSON Schema. The map holds the 10 basic types Phase 1 renders; the other 8 are unmapped, and the surface renders an inert placeholder for them and raises `line-a2ui-error`. Each entry pairs the type's `web_core` `ComponentApi` with its target. The map is frozen and has a `null` prototype; look a type up with `Object.hasOwn`.

| Basic type | Target |
| --- | --- |
| Text | `{ kind: 'text' }`: `<h1>`–`<h5>`, `<small>` for `caption`, `<p>` for `body`, by `variant`; `<span>` inside a Button |
| Image | `{ kind: 'native' }`: `<img>` for every `variant`, behind the URL policy for `image` |
| Video, AudioPlayer | `{ kind: 'native' }`: `<video>`, and `<audio controls>`, behind the URL policy for `video` and `audio` |
| Icon | `{ kind: 'component' }`: the Icon descriptor, `<line-icon>` |
| Row, Column, List | `{ kind: 'component' }`: the Stack descriptor, `<line-stack>`, with `orientation="horizontal"`, `orientation="vertical"` and `role="list"` |
| Divider | `{ kind: 'component' }`: the Separator descriptor, `<line-separator>` |
| Button | `{ kind: 'component' }`: the Button descriptor, `<line-button>` |

## Preview status of `./a2ui`

- `@websublime/line-genui/a2ui` may change in any minor release.
- `@websublime/line-genui/a2ui` sits outside the breaking-changes policy (PRD §7.1) until the package targets a final A2UI v1.0.
- The descriptor API and the catalogs in `./catalog` follow the normal policy.
