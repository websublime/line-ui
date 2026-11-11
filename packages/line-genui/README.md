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
| `@websublime/line-genui/catalog` | Descriptors, the `line` catalog emitters, the frontend-tool emitter and the `basic` implementation map. Defines no element, and its own modules touch no DOM at load. Unbundled, the `@a2ui/web_core/v0_9` module it imports loads Lit, which touches the DOM when it loads; a bundler drops it. |
| `@websublime/line-genui/catalog.json` | The `line` catalog document, JSON (see below). |
| `@websublime/line-genui/a2ui` | The A2UI session and `<line-a2ui-surface>`. Defines `line-a2ui-surface` and nothing else; each component loads on first use. Preview. |
| `@websublime/line-genui/custom-elements.json` | The Custom Elements Manifest of `<line-a2ui-surface>`. |

The package has no root `.` export.

## Descriptors (`./catalog`)

A descriptor tells the agent-facing layers how to use one `line-components` component. Its fields are the catalog name, the tag, `load()` (a dynamic import of the component subpath), a Zod 3 prop schema built on the `@a2ui/web_core` common types, the slot, binding and action maps, the accessibility requirements, the agent-facing description, the optional tool description (`toolDescription`), which only the frontend tools read, and `agentExposed` (default `true`; `false` takes `agentHiddenReason`).

```ts
import { Catalog } from '@a2ui/web_core/catalog';
import { buttonDescriptor, descriptors } from '@websublime/line-genui/catalog';

const catalog = new Catalog('https://example.com/catalog.json', '0.9', [...descriptors]);
catalog.toJson(); // component and property descriptions, with `$ref`s to the common types
await buttonDescriptor.load(); // defines <line-button>
```

| Export | What it is |
| --- | --- |
| `alertDescriptor`, `avatarDescriptor`, `badgeDescriptor`, `buttonDescriptor`, `buttonGroupDescriptor`, `chipDescriptor`, `iconDescriptor`, `iconButtonDescriptor`, `separatorDescriptor`, `stackDescriptor` | The descriptors of Alert, Avatar, Badge, Button, ButtonGroup, Chip, Icon, IconButton, Separator and Stack |
| `descriptors` | Every descriptor above |
| `defineDescriptor(init)` | Builds a descriptor from its fields and its own props; `agentExposed` defaults to `true` |
| `componentSchema(description, props)` | The strict prop schema: `props` plus the A2UI `accessibility` object, described and annotated with the `ComponentCommon` mixin |
| `commonProp(type, description)` | A common-type prop (`DynamicString`, `DynamicBoolean`, `DynamicNumber`, `ComponentId`, `ChildList`, `Action`) whose description reaches `toJson()` beside a `$ref`; describe an enum or another plain prop with `.describe()` |
| `LineDescriptor` and the field types | The descriptor type, its binding (attribute, property, surface lookup, text or URL), slot and action maps, and its accessibility requirements. A text binding (`{ kind: 'text' }`) writes the prop's string as the host's text content, so it lands in the default slot; a descriptor with one has no slot map. A URL binding (`{ kind: 'url', use, name }`) sets the attribute `name` only to a URL the surface's URL policy allows for `use` (`image`, `video` or `audio`), and removes it otherwise |

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
| `BasicImplementationMap`, `BasicImplementation`, `BasicTarget`, `BasicComponentTarget`, `BasicTypeName`, `BasicTextVariant`, `TargetAttributes` | The types of the `basic` map |

### The `basic` implementation map

line renders the A2UI basic catalog under its upstream id and does not re-emit its JSON Schema. The map holds the 10 basic types Phase 1 renders; the other 8 are unmapped, and the surface renders an inert placeholder for them and raises `line-a2ui-error`. Each entry pairs the type's `web_core` `ComponentApi` with its target. The map is frozen and has a `null` prototype; look a type up with `Object.hasOwn`.

| Basic type | Target |
| --- | --- |
| Text | `{ kind: 'text' }`: `<h1>`–`<h5>`, `<small>` for `caption`, `<p>` for `body`, by `variant`; `<span>` inside a Button |
| Image | `{ kind: 'native' }`: `<img>`, behind the URL policy for `image`; `byVariant` routes `variant: "avatar"` to the Avatar descriptor, `<line-avatar>`, with `url` as `src` behind the same policy and `description` as `name`; `fit` is ignored |
| Video, AudioPlayer | `{ kind: 'native' }`: `<video>`, and `<audio controls>`, behind the URL policy for `video` and `audio` |
| Icon | `{ kind: 'component' }`: the Icon descriptor, `<line-icon>` |
| Row, Column, List | `{ kind: 'component' }`: the Stack descriptor, `<line-stack>`, with `orientation="horizontal"`, `orientation="vertical"` and `role="list"` |
| Divider | `{ kind: 'component' }`: the Separator descriptor, `<line-separator>` |
| Button | `{ kind: 'component' }`: the Button descriptor, `<line-button type="button">`, so an agent Button never submits or resets a host form around the surface |

## Frontend tools (`./catalog`)

In the controlled tier the agent picks a component and fills its props through a tool call, and your app renders the call. `frontendTools(descriptors, provider)` emits one tool, `{ name, description, parameters }`, for each descriptor with `agentExposed: true`, and none for a descriptor with `agentExposed: false`. `name` is the catalog name, such as `Button`, and matches `^[a-zA-Z0-9_-]{1,64}$`. `parameters` is flat and literal: no `$ref`, `oneOf`, `allOf`, recursion, open map, A2UI common type or data binding; its `properties` object has a null prototype.

`description` is the descriptor's `toolDescription` when it sets one, and its agent-facing description otherwise, at most 1024 characters either way. A tool description names no parameter the tool lacks. Alert, Avatar, Badge, Button, ButtonGroup, IconButton, Separator and Stack set one, because their agent-facing descriptions, which the `line` catalog keeps, name props the tool leaves out (Alert `children`, `title`, `icon`, `actions` and `dismiss`, Avatar `status`, Button and IconButton `child`, ButtonGroup and Stack `children`) or the `accessibility` object, which the tool flattens (Badge, Button, ButtonGroup, IconButton, Separator). Chip and Icon set none, so their tools take their agent-facing descriptions. An empty or whitespace-only `toolDescription` is a descriptor error: the emitter throws and does not fall back to the agent-facing description.

```ts
import { descriptors, frontendTools } from '@websublime/line-genui/catalog';

// OpenAI Responses API, strict function calling
const openaiTools = frontendTools(descriptors, 'openai').map((tool) => ({ type: 'function', ...tool, strict: true }));

// Anthropic Messages API, strict tool use
const anthropicTools = frontendTools(descriptors, 'anthropic').map(({ name, description, parameters }) => ({
  name,
  description,
  input_schema: parameters,
  strict: true,
}));

// Gemini function calling: `parameters` is an OpenAPI 3.0.3 Schema
const geminiTools = [{ functionDeclarations: frontendTools(descriptors, 'gemini') }];
```

| Export | What it is |
| --- | --- |
| `frontendTools(descriptors, provider)` | The tools of the agent-exposed descriptors, in the order given, serialised for `provider`. Returns fresh objects. Throws when a name breaks the pattern, a `toolDescription` is empty or whitespace-only, a tool description exceeds 1024 characters, a prop is named `accessibilityLabel` or `accessibilityDescription` (with or without the accessibility parameters on that tool), or a prop has no literal form |
| `TOOL_PROVIDERS` | `['openai', 'anthropic', 'gemini']` |
| `FrontendTool`, `ToolParameters`, `ToolProperty`, `ToolProvider`, `ToolValueType` | The types of a tool, its parameters, one parameter, the provider and a parameter's literal type |

Each descriptor prop becomes a parameter as follows.

| Descriptor prop | Tool parameter |
| --- | --- |
| `DynamicString`, `DynamicBoolean`, `DynamicNumber` | `string`, `boolean`, `number`, with the prop's description |
| `z.enum` | A string enum, with the prop's description |
| `ComponentId`, `ChildList`, `Action` (Alert `icon`, `title`, `children`, `actions` and `dismiss`, Avatar `status`, Button and IconButton `child` and `action`, ButtonGroup and Stack `children`) | None: they carry tree structure and actions, not literal values |
| `accessibility` | `accessibilityLabel` and `accessibilityDescription`, optional strings, on Avatar, Badge, Button, ButtonGroup, Chip, IconButton and Separator; Alert, Icon and Stack take neither |

The provider decides how an optional parameter is written.

| Provider | `parameters` |
| --- | --- |
| `openai` | OpenAI strict: every parameter in `required`, an optional one typed `["T", "null"]` (an optional enum also lists `null`), `additionalProperties: false` |
| `anthropic` | Anthropic strict: optional parameters left out of `required`, `additionalProperties: false` |
| `gemini` | The Gemini `parameters` subset of OpenAPI 3.0.3: optional parameters marked `nullable: true` and left out of `required`; no `additionalProperties`, `const`, `$ref`, `oneOf` or `allOf` |

Anthropic caps one request at 20 strict tools, 24 optional parameters and 16 union-typed parameters across all strict schemas. Send fewer tools in a request whose tools exceed them.

### Rendering a tool call

Your app renders the call: it creates the tool's element (`descriptor.tag`, after `await descriptor.load()`) and writes each argument as the descriptor's binding map says (`descriptor.bindings.props`); a text binding, such as Badge or Chip `label`, sets the argument as the element's text content, and a URL binding, such as Avatar `src`, sets the attribute only after your own URL policy allows the URL, because the surface's policy does not run on a tool call. Skip a `null` argument, which OpenAI sends for an unset optional parameter and Gemini may send. Apply `accessibilityLabel` and `accessibilityDescription` as `<line-a2ui-surface>` applies `accessibility.label` and `accessibility.description`, with the same exceptions:

- Set `accessibilityLabel` as the host `aria-label` and `accessibilityDescription` as the host `aria-description`.
- A value that is empty after trimming whitespace sets nothing.
- Separator: set neither while `decorative` is true, and remove both when `decorative` turns true.
- Alert, Icon and Stack tools carry neither parameter.

A tool-created Button has no `child`, because the tool leaves it out, so `accessibilityLabel` is its route to an accessible name. A tool-created IconButton has no icon for the same reason, and `accessibilityLabel` is its only name; the tool schema keeps it optional, so your app checks it. A tool-created ButtonGroup has no buttons, because the tool leaves `children` out; your app places them, and `accessibilityLabel` names the toolbar. A tool-created Alert has no content, because the tool leaves `icon`, `title`, `children`, `actions` and `dismiss` out; your app places the message, which states the tone in words, any action buttons and any dismiss button. On `<line-a2ui-surface>`, an Alert's `dismiss` IconButton keeps its own action, and the alert hides itself when the user activates it; it stays hidden if the agent sends the node again. A tool-created Chip takes its visible text and its name from `label`, a required parameter, and its `pressed` flips on each press and fires `line-change` with the new value. A tool-created Badge takes its text from `label`, an optional parameter; with no `label` it draws a dot, so your app gives it `accessibilityLabel`, which `<line-a2ui-surface>` requires in that case.

## The A2UI renderer (`./a2ui`)

```ts
import { setIconRegistry } from '@websublime/line-components';
import { Session } from '@websublime/line-genui/a2ui';
import { IconRegistry } from '@websublime/line-icons';
import { a2uiIconMap } from '@websublime/line-icons/a2ui';
import { createPhosphorResolver } from '@websublime/line-icons/resolvers/phosphor';

const registry = new IconRegistry();
registry.register('phosphor', createPhosphorResolver({ base: '/icons/phosphor/' }));
setIconRegistry(registry);

const surface = document.querySelector('line-a2ui-surface'); // <line-a2ui-surface surface-id="main">
surface.iconMap = a2uiIconMap('phosphor', { library: 'phosphor' });
surface.session = new Session();
surface.addEventListener('line-a2ui-action', (event) => transport.send(event.detail));
surface.addEventListener('line-a2ui-error', (event) => transport.send(event.detail));
await surface.feed(messages); // or session.process(messages, 'main')
```

| Export | What it is |
| --- | --- |
| `Session` | One `web_core` `MessageProcessor` with the `line` and `basic` catalogs and `RELAXED_VALIDATION`: `process(messages, fallbackSurfaceId)`, `onError`, `onAction`, `onSurface`, `onSurfaceDeleted`, `dataModel()`, `dispose()`. It accepts only A2UI v0.9 envelopes (`version` `v0.9` or `v0.9.1`), unwrapping an array or `{ messages }` wrapper one level; any other shape raises `UNSUPPORTED_MESSAGE` |
| `LineA2uiSurface` | The `<line-a2ui-surface>` class: attributes `surface-id`, `max-nodes`, `max-depth`, `max-data-model-size`, `live-update-text`, `live-error-text`; properties `session`, `iconMap`, `urlPolicy`, `markdownRenderer`; `feed()`, `settled()`; events `line-a2ui-action`, `line-a2ui-error` |
| `A2uiActionMessage`, `A2uiErrorMessage`, `A2uiErrorBody`, `SurfaceErrorCode` | The A2UI client-to-server messages the surface emits, and the codes it raises itself: `LIMIT_EXCEEDED`, `MARKDOWN_RENDER_ERROR`, `MISSING_ACCESSIBLE_NAME`, `UNMAPPED_ICON`, `COMPONENT_LOAD_ERROR`, `UNSUPPORTED_MESSAGE` |
| `Limits`, `LimitName`, `DEFAULT_LIMITS`, `UrlPolicy`, `UrlUse`, `MarkdownRenderer` | The types of the limits, the URL policy and the Markdown hook |

The Storybook page "Agent UI/A2UI Surface" documents the rest: the limits and their unit, the URL policy, Markdown, accessibility and the template-list limit.

## Preview status of `./a2ui`

- `@websublime/line-genui/a2ui` may change in any minor release.
- `@websublime/line-genui/a2ui` sits outside the breaking-changes policy (PRD §7.1) until the package targets a final A2UI v1.0.
- The descriptor API and the catalogs in `./catalog` follow the normal policy.
