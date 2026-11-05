# @websublime/line-genui

## 0.2.0

### Minor Changes

- [#321](https://github.com/websublime/line-ui/pull/321) [`a4ce07d`](https://github.com/websublime/line-ui/commit/a4ce07dc569a5f179fe2617085e22cc5404afcb4) Thanks [@miguelramos](https://github.com/miguelramos)! - `@websublime/line-genui/a2ui` (Preview) now ships `<line-a2ui-surface>` and `Session`: an A2UI v0.9 renderer that accepts only v0.9 and v0.9.1 messages (anything else raises `UNSUPPORTED_MESSAGE`) and projects the `line` and basic catalogs onto line://ui components in the light DOM, loading each component on first use, with node, depth and data-model limits (`max-nodes` 1000, `max-depth` 32, `max-data-model-size` 1 MiB), a URL policy hook (`urlPolicy`), an opt-in Markdown hook (`markdownRenderer`), the `iconMap` property, one live region, and `line-a2ui-action` and `line-a2ui-error` events ready for the transport; every Button it renders is `type="button"`, so an agent never submits or resets a host form, and the `line` catalog Button no longer takes `type`, `name` or `value`; the package also exports `./custom-elements.json`.

- [#320](https://github.com/websublime/line-ui/pull/320) [`6e0d1ae`](https://github.com/websublime/line-ui/commit/6e0d1aee291ad714ba2ab8061a2049fe50087d7c) Thanks [@miguelramos](https://github.com/miguelramos)! - `@websublime/line-genui/catalog` now emits the `line` A2UI catalog (`lineCatalogDocument`, `inlineCatalog`, `lineCapabilities`) and exports the `basic` implementation map (`basicImplementations`), the built document ships as `@websublime/line-genui/catalog.json`, and `@websublime/line-icons/a2ui` (Preview) adds `a2uiIconMap(set, { library })`, which maps the 59 A2UI icon names to Lucide or Phosphor for the surface `iconMap`.

- [#312](https://github.com/websublime/line-ui/pull/312) [`5f85db9`](https://github.com/websublime/line-ui/commit/5f85db92086097e484783d9c7253c7b14359557a) Thanks [@miguelramos](https://github.com/miguelramos)! - New package `@websublime/line-genui` with the `./catalog` and `./a2ui` entry points; both export nothing yet, and `./a2ui` has Preview status.

- [#326](https://github.com/websublime/line-ui/pull/326) [`c13a74f`](https://github.com/websublime/line-ui/commit/c13a74f9350bf163f3ac1da29176efcf90349332) Thanks [@miguelramos](https://github.com/miguelramos)! - Add `<line-icon-button>` at `@websublime/line-components/icon-button`, a square button that shows only an icon (slotted, part `icon`), takes its name from the host `aria-label`, is never a form submitter, and takes `variant`, `disabled`, `loading` and `pressed` (toggle, fires `line-change`); the `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `IconButton`, which `<line-a2ui-surface>` renders only when the node carries `accessibility.label`.

- [#319](https://github.com/websublime/line-ui/pull/319) [`fbaf4cb`](https://github.com/websublime/line-ui/commit/fbaf4cbfc162d764c97f440bdf819b5e95b54ac5) Thanks [@miguelramos](https://github.com/miguelramos)! - `@websublime/line-genui/catalog` now exports the descriptor API (`LineDescriptor`, `defineDescriptor`, `componentSchema`, `commonProp`) and the descriptors of Button, Icon, Separator and Stack, which a `@a2ui/web_core` `Catalog` takes as they are.

- [#323](https://github.com/websublime/line-ui/pull/323) [`f0c69d9`](https://github.com/websublime/line-ui/commit/f0c69d9eafc425c8e7a48aaa467688ed1c9f31a7) Thanks [@miguelramos](https://github.com/miguelramos)! - `@websublime/line-genui/catalog` now emits frontend tools (`frontendTools(descriptors, provider)`): one flat, literal `{name, description, parameters}` per agent-exposed descriptor, serialised for OpenAI strict, Anthropic strict or Gemini, with `accessibilityLabel` and `accessibilityDescription` on the Button and Separator tools. Descriptors gain an optional `toolDescription`, which the tool takes as its `description` in place of the agent-facing description; Button, Separator and Stack set one, and the `line` catalog is unchanged.

### Patch Changes

- Updated dependencies [[`59a2265`](https://github.com/websublime/line-ui/commit/59a22652ef36d38483bcec2638904559701b5e06)]:
  - @websublime/line-core@0.2.3
