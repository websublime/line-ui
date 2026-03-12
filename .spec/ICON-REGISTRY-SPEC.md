# SPEC: Icon Registry & `<line-icon>` Component (Phase 0, Epic 7)

**Status:** APPROVED
**Author:** Ada (architect)
**Date:** 2026-03-12
**Source PRD:** `docs/PRODUCT-REQUIREMENTS-SPECIFICATION.md` (v0.7.0, Approved) -- sections 6.1, 7.2
**Source Architecture:** `docs/ARCHITECTURE.md` (section 11)
**Source Plan:** `docs/PRODUCT-PLAN.md` (section 2.7, Epic 7)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Icon Registry API](#2-icon-registry-api)
3. [`<line-icon>` Component](#3-line-icon-component)
4. [Loading Strategy](#4-loading-strategy)
5. [Integration with LineElement](#5-integration-with-lineelement)
6. [Integration with Themes](#6-integration-with-themes)
7. [Tree-shaking & Bundle Size](#7-tree-shaking--bundle-size)
8. [SSR Considerations](#8-ssr-considerations)
9. [TypeScript API Contracts](#9-typescript-api-contracts)
10. [Lifecycle & Sequence Diagrams](#10-lifecycle--sequence-diagrams)
11. [Test Contracts](#11-test-contracts)
12. [Implementation Tasks](#12-implementation-tasks)
13. [Risks and Trade-offs](#13-risks-and-trade-offs)
14. [Open Questions](#14-open-questions)
15. [File Structure (Target)](#15-file-structure-target)

---

## 1. Overview

This spec defines the icon registry system for line://ui. The system consists of two parts:

1. **Icon Registry** -- a framework-agnostic, singleton registry where consumers register icon libraries (resolvers). Zero icons are bundled. The consumer brings their own.
2. **`<line-icon>` Component** -- a Lit-based Web Component that resolves an icon name via the registry, fetches/inlines the SVG, and renders it in shadow DOM with full CSS part and custom property support.

The icon system lives in `packages/icons/` and is published as `@websublime/line-icons`. It depends on `@websublime/line-core` for `LineElement` and `defineElement()`.

### 1.1 Design Goals

- **Zero icons bundled** -- the registry is an empty container until the consumer registers resolvers.
- **Zero runtime cost when unused** -- if no icons are registered and no `<line-icon>` elements exist, the package contributes nothing to bundle or runtime.
- **Framework-agnostic** -- the registry is plain TypeScript with no DOM dependency. It can be used server-side.
- **Lazy by default** -- SVGs are fetched on demand, not eagerly loaded.
- **Cache once, render many** -- resolved SVGs are cached globally. Multiple `<line-icon name="check">` elements share one fetch.
- **Accessible** -- decorative icons are hidden from screen readers; meaningful icons require `label` for `aria-label`.

### 1.2 Usage Examples

**Registering an icon library:**

```typescript
import { registerIconLibrary } from '@websublime/line-icons';

// URL-based resolver (lazy fetch)
registerIconLibrary('phosphor', {
  resolver: (name) => `https://unpkg.com/@phosphor-icons/core/assets/regular/${name}.svg`,
});

// Inline SVG resolver (eager, for critical icons)
registerIconLibrary('app', {
  resolver: (name) => {
    const icons: Record<string, string> = {
      logo: '<svg viewBox="0 0 24 24">...</svg>',
      menu: '<svg viewBox="0 0 24 24">...</svg>',
    };
    return icons[name] ?? '';
  },
});
```

**Using icons in HTML:**

```html
<line-icon name="check" library="phosphor"></line-icon>
<line-icon name="arrow-right" library="lucide"></line-icon>
<line-icon name="logo" library="app" label="Company logo"></line-icon>
<line-icon src="/my-icons/custom.svg" label="Custom icon"></line-icon>
```

**Using icons inside other components (slot-based):**

```html
<line-button>
  <line-icon slot="prefix" name="check" library="phosphor"></line-icon>
  Save
</line-button>
```

---

## 2. Icon Registry API

### 2.1 Singleton Registry

The registry is a module-level singleton (not a class instance). It is a `Map<string, IconLibrary>` with convenience functions for registration and resolution.

**Why a singleton, not a class:**
- Icons are global by nature -- a `<line-icon name="check" library="phosphor">` anywhere in the DOM should resolve the same way.
- Avoids context-passing or dependency injection complexity in Web Components.
- Aligns with how `customElements.define()` works -- global registration.

### 2.2 `registerIconLibrary()`

```typescript
/**
 * Register an icon library with the global registry.
 *
 * @param name - Unique library name (e.g., 'phosphor', 'lucide', 'app')
 * @param library - Library configuration with a resolver function
 * @throws If a library with the same name is already registered (use `unregisterIconLibrary()` first)
 */
function registerIconLibrary(name: string, library: IconLibraryConfig): void;
```

Behavior:
- Throws if `name` is already registered. This prevents silent overwrites. Consumers must explicitly unregister first.
- The `name` `'default'` is reserved. When a `<line-icon>` has no `library` attribute, it uses `'default'`. Themes can register a default library automatically.

### 2.3 `unregisterIconLibrary()`

```typescript
/**
 * Remove a registered icon library.
 * Cached icons from this library are NOT purged (they remain valid SVG strings).
 * Active <line-icon> elements using this library are NOT re-resolved.
 *
 * @param name - Library name to remove
 */
function unregisterIconLibrary(name: string): void;
```

### 2.4 `registerIcon()`

```typescript
/**
 * Register a single icon directly, bypassing library resolvers.
 * Useful for one-off custom icons or overrides.
 *
 * The icon is stored in the global SVG cache under the key `${library}:${name}`.
 * If `library` is omitted, it defaults to `'default'`.
 *
 * @param name - Icon name
 * @param svg - SVG string (must be a valid <svg> element)
 * @param library - Optional library namespace (default: 'default')
 */
function registerIcon(name: string, svg: string, library?: string): void;
```

### 2.5 `resolveIcon()`

```typescript
/**
 * Resolve an icon by name and library. Returns the SVG string or null.
 * This is the internal resolution function used by <line-icon>.
 * Exposed publicly for advanced use cases (e.g., rendering icons
 * outside of <line-icon>, server-side rendering).
 *
 * Resolution order:
 * 1. Check the global SVG cache (previously resolved icons + registerIcon() entries)
 * 2. Call the library's resolver function
 * 3. If the resolver returns a URL string (starts with http/https or /), fetch the SVG
 * 4. If the resolver returns an SVG string (starts with <svg), use it directly
 * 5. Cache the result and return it
 *
 * @param name - Icon name
 * @param library - Library name (default: 'default')
 * @returns SVG string, or null if resolution fails
 */
async function resolveIcon(name: string, library?: string): Promise<string | null>;
```

### 2.6 `getIconLibrary()`

```typescript
/**
 * Retrieve a registered icon library configuration.
 * Returns undefined if the library is not registered.
 *
 * @param name - Library name
 */
function getIconLibrary(name: string): IconLibraryConfig | undefined;
```

### 2.7 Icon Resolution Strategy

```
<line-icon name="check" library="phosphor">

  1. Is "phosphor:check" in the SVG cache?
     YES → return cached SVG string
     NO  → continue

  2. Is "phosphor" a registered library?
     NO  → emit "line-icon-error" event, render nothing
     YES → continue

  3. Call resolver: library.resolver("check")
     → Returns a URL string (e.g., "https://unpkg.com/.../check.svg")
        → Fetch the URL
        → On success: sanitize SVG, cache as "phosphor:check", return SVG
        → On failure: emit "line-icon-error" event, render nothing
     → Returns an SVG string (starts with "<svg")
        → Sanitize, cache as "phosphor:check", return SVG
     → Returns empty string or undefined
        → emit "line-icon-error" event, render nothing
```

### 2.8 SVG Cache

The cache is a module-level `Map<string, string>` keyed by `${library}:${name}`.

```typescript
/**
 * Clear the global SVG cache. Useful for testing or when re-registering
 * libraries with updated resolvers.
 *
 * @param library - If provided, only clear icons from this library.
 *                  If omitted, clear the entire cache.
 */
function clearIconCache(library?: string): void;
```

---

## 3. `<line-icon>` Component

### 3.1 Component Tier

**Static** -- no Zag.js machine. `<line-icon>` is purely presentational. It resolves an SVG and renders it. Zero interaction state.

### 3.2 Attributes / Properties

| Attribute | Property | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `name` | `name` | `string` | `''` | Icon name to resolve via the library's resolver |
| `library` | `library` | `string` | `'default'` | Registered library name |
| `src` | `src` | `string` | `''` | Direct SVG URL. When set, bypasses the registry entirely |
| `label` | `label` | `string` | `''` | Accessible label. When set, renders `role="img"` and `aria-label`. When empty, renders `aria-hidden="true"` (decorative) |
| `size` | `size` | `string` | `''` | Shorthand for width/height. Accepts CSS values or token aliases (`xs`, `sm`, `md`, `lg`, `xl`). Maps to `--line-icon-size` |

### 3.3 CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--line-icon-size` | `1em` | Width and height of the icon |
| `--line-icon-color` | `currentColor` | Fill/stroke color |
| `--line-icon-stroke-width` | (not set) | Override stroke-width for stroke-based icon sets |

### 3.4 CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `root` | `<span>` | Outer wrapper |
| `svg` | `<svg>` | The inlined SVG element (available after resolution) |

### 3.5 Events

| Event | Detail | When |
|-------|--------|------|
| `line-icon-resolve` | `{ name: string, library: string }` | SVG successfully resolved and rendered |
| `line-icon-error` | `{ name: string, library: string, message: string }` | Resolution failed (library not found, fetch error, invalid SVG) |

### 3.6 Slots

None. `<line-icon>` does not accept children.

### 3.7 Accessibility

- **Decorative icons** (no `label`): `aria-hidden="true"`, `role="presentation"`. Screen readers skip them entirely.
- **Meaningful icons** (with `label`): `role="img"`, `aria-label` set to `label` value. Screen readers announce the label.
- **Icon-only buttons**: Use `<line-icon-button>` (Phase 1), which requires `aria-label` on the button itself. The icon inside is always decorative.

### 3.8 Shadow DOM Template

```html
<span part="root"
      role="${label ? 'img' : 'presentation'}"
      aria-label="${label || nothing}"
      aria-hidden="${label ? nothing : 'true'}"
      style="--line-icon-size: ${computedSize}">
  <!-- SVG is innerHTML-injected here after resolution -->
  <!-- The <svg> element gets part="svg" applied programmatically -->
</span>
```

### 3.9 Size Token Mapping

When `size` is a named alias, it maps to CSS values:

| Alias | CSS Value |
|-------|-----------|
| `xs` | `0.75rem` (12px) |
| `sm` | `1rem` (16px) |
| `md` | `1.25rem` (20px) |
| `lg` | `1.5rem` (24px) |
| `xl` | `2rem` (32px) |
| `2xl` | `2.5rem` (40px) |
| (CSS value) | Used directly |
| (empty) | Inherits from `--line-icon-size` or falls back to `1em` |

### 3.10 SVG Sanitization

Before injecting resolved SVGs into the shadow DOM, the component sanitizes them:

1. Parse the SVG string using `DOMParser`
2. Verify the root element is `<svg>`
3. Remove any `<script>` elements
4. Remove event handler attributes (`on*`)
5. Remove `<foreignObject>` elements
6. Ensure `fill="currentColor"` on the root `<svg>` if no explicit `fill` is set (enables CSS color inheritance)
7. Remove `width` and `height` attributes from the root `<svg>` (sizing is controlled via CSS)
8. Ensure `viewBox` is preserved
9. Serialize back to string

**Why DOMParser and not `innerHTML` directly:** Security. SVGs from external URLs must be sanitized before injection. The sanitization function is shared and testable.

---

## 4. Loading Strategy

### 4.1 Lazy by Default

Icons are resolved and fetched on demand when a `<line-icon>` element connects to the DOM. There is no preloading or eager fetching by default.

### 4.2 Deduplication

Multiple `<line-icon name="check" library="phosphor">` elements trigger only one fetch. The first element initiates the fetch; subsequent elements await the same promise. The result is cached globally.

```
Element A: <line-icon name="check" library="phosphor">
  → Cache miss → Starts fetch → Stores promise in pending map

Element B: <line-icon name="check" library="phosphor">
  → Cache miss → Finds pending promise → Awaits same promise

Fetch completes → Both elements render
```

Implementation: A `Map<string, Promise<string | null>>` tracks in-flight requests alongside the resolved `Map<string, string>` cache.

### 4.3 Eager Registration for Critical Icons

Consumers who want eager loading (e.g., icons visible above the fold) use `registerIcon()`:

```typescript
import { registerIcon } from '@websublime/line-icons';

// These are cached immediately -- no fetch needed when <line-icon> renders
registerIcon('logo', '<svg viewBox="0 0 24 24">...</svg>', 'app');
registerIcon('menu', '<svg viewBox="0 0 24 24">...</svg>', 'app');
```

### 4.4 `src` Attribute (Direct URL)

When `src` is set, the registry is bypassed entirely. The URL is fetched directly. The result is cached using the key `__src:${url}` to avoid re-fetching if multiple elements share the same `src`.

### 4.5 Fetch Options

The library config accepts an optional `fetchOptions` object for CORS, credentials, and headers:

```typescript
registerIconLibrary('private', {
  resolver: (name) => `https://icons.internal.corp/v2/${name}.svg`,
  fetchOptions: {
    credentials: 'include',
    headers: { 'X-Api-Key': '...' },
  },
});
```

---

## 5. Integration with LineElement

### 5.1 How Components Consume Icons Internally

line://ui components do NOT import or render `<line-icon>` internally. Icons in components are always consumer-provided via slots:

```html
<line-button>
  <line-icon slot="prefix" name="check" library="phosphor"></line-icon>
  Save
</line-button>

<line-field>
  <span slot="error">
    <line-icon name="alert-circle" library="phosphor"></line-icon>
    Invalid email
  </span>
</line-field>
```

This is consistent with the composition model (ARCH 2, ARCH 3): components connect via `<slot>`, not imports. A `<line-button>` does not know or care what its prefix slot contains.

### 5.2 Why No Internal Icon Dependencies

- **Tree-shaking**: If a Button imported `<line-icon>`, every consumer of Button would pull in the icon registry, even if they never use icons.
- **Flexibility**: Consumers can use any icon element, not just `<line-icon>`. An inline `<svg>` or a custom icon component works equally well in slots.
- **Bundle independence**: `@websublime/line-components` does not depend on `@websublime/line-icons`. They are sibling packages with no import relationship.

### 5.3 Exception: Theme-Provided Default Library

Ready-to-go themes (from `@websublime/line-theme`) MAY register a default icon library as a side effect. This is the mechanism described in ARCH 11: "Ready-to-go themes declare a default library and register the resolver automatically."

This is implemented as an optional JS module in the theme package:

```typescript
// @websublime/line-theme/icons (optional import)
import { registerIconLibrary } from '@websublime/line-icons';

registerIconLibrary('default', {
  resolver: (name) => `https://cdn.jsdelivr.net/npm/phosphor-icons@1.4.2/src/regular/${name}.svg`,
});
```

Consumers opt in by importing this module. It is never auto-imported by the CSS theme.

---

## 6. Integration with Themes

### 6.1 Color via `currentColor`

The sanitizer ensures `fill="currentColor"` on the root `<svg>` when no explicit fill is set. This means icon color inherits from the parent element's `color` property by default. Themes and consumers control icon color through CSS:

```css
/* Theme sets text color, icons inherit */
line-button::part(root) {
  color: var(--line-primary-11);
}

/* Direct icon color override */
line-icon {
  --line-icon-color: var(--line-danger-9);
}
```

### 6.2 Sizing via Design Tokens

Icons respect the `--line-icon-size` custom property, which can be set globally, per-component, or per-instance:

```css
/* Global default */
:root {
  --line-icon-size: 1.25rem;
}

/* Component-level */
line-button line-icon {
  --line-icon-size: 1em; /* relative to button font-size */
}
```

### 6.3 Stroke-Based Icon Sets

Some icon sets (Lucide, Feather) use strokes instead of fills. The `--line-icon-stroke-width` custom property allows theme-level control:

```css
line-icon {
  --line-icon-stroke-width: 1.5;
}
```

The component applies this to the SVG via inline style when the property is set.

---

## 7. Tree-shaking & Bundle Size

### 7.1 Zero Cost When Unused

The `@websublime/line-icons` package exports:
- The registry functions (`registerIconLibrary`, `registerIcon`, etc.) -- pure functions with no side effects
- The `<line-icon>` custom element definition

If a consumer never imports from `@websublime/line-icons`, it contributes zero bytes to the bundle. Vite/Rolldown tree-shakes the entire package.

### 7.2 Minimal Registry Cost

The registry itself (without `<line-icon>`) is approximately:
- Two `Map` instances (empty)
- Five exported functions
- Estimated: < 500 bytes gzipped

### 7.3 `<line-icon>` Component Cost

The component adds:
- `LineElement` extension (shared with all components)
- SVG sanitization function (~300 bytes gzipped)
- Render logic (~200 bytes gzipped)
- Estimated total: < 1.5KB gzipped (well under the 5KB soft target)

### 7.4 No Icons in the Bundle

The package ships zero SVG data. All icons come from:
- Consumer-registered resolvers (URL or inline)
- Direct `src` attribute URLs
- `registerIcon()` calls

### 7.5 Package Exports

```json
{
  "name": "@websublime/line-icons",
  "exports": {
    ".": "./dist/index.js",
    "./registry": "./dist/registry.js",
    "./icon": "./dist/icon.js"
  }
}
```

- `"."` -- barrel export (registry + component)
- `"./registry"` -- registry functions only (no DOM, no Lit dependency). Usable server-side.
- `"./icon"` -- `<line-icon>` component only (imports registry internally)

This split allows consumers who only need the registry (e.g., for SSR icon resolution) to avoid importing Lit.

---

## 8. SSR Considerations

### 8.1 Server-Side Registry

The registry (`registerIconLibrary`, `resolveIcon`) has no DOM dependency. It can run in Node.js, Bun, Deno, or any server runtime.

Server-side resolution flow:
1. Register libraries on the server
2. Call `resolveIcon(name, library)` to get the SVG string
3. Inline the SVG directly in the server-rendered HTML

### 8.2 `<line-icon>` in SSR Context

When `<line-icon>` is server-rendered (e.g., via Lit SSR or Declarative Shadow DOM):
- The component renders the `<span part="root">` wrapper with correct ARIA attributes
- The SVG content is resolved via `resolveIcon()` and inlined in the shadow DOM
- On hydration, the client-side component detects the existing SVG and skips re-fetching

### 8.3 Limitations

- URL-based resolvers require `fetch()` on the server. The server runtime must support `fetch()` (Bun and Node 18+ do natively).
- Cross-origin icon CDN URLs must be accessible from the server.

---

## 9. TypeScript API Contracts

### 9.1 Core Types

```typescript
/**
 * Configuration for a registered icon library.
 */
interface IconLibraryConfig {
  /**
   * Resolver function. Given an icon name, returns either:
   * - A URL string (http/https or /) to fetch the SVG from
   * - An SVG string (starts with '<svg') to use directly
   * - An empty string or undefined if the icon is not found
   */
  resolver: (name: string) => string | undefined;

  /**
   * Optional mutator applied to the SVG element after parsing
   * but before rendering. Useful for modifying attributes per-library
   * (e.g., adding classes, adjusting viewBox).
   */
  mutator?: (svg: SVGElement) => void;

  /**
   * Optional fetch options for URL-based resolvers.
   * Applied to every fetch() call for this library.
   */
  fetchOptions?: RequestInit;
}

/**
 * Metadata for an icon resolution event.
 */
interface IconResolveDetail {
  name: string;
  library: string;
}

/**
 * Metadata for an icon error event.
 */
interface IconErrorDetail {
  name: string;
  library: string;
  message: string;
}
```

### 9.2 Registry Functions

```typescript
function registerIconLibrary(name: string, config: IconLibraryConfig): void;
function unregisterIconLibrary(name: string): void;
function registerIcon(name: string, svg: string, library?: string): void;
function resolveIcon(name: string, library?: string): Promise<string | null>;
function getIconLibrary(name: string): IconLibraryConfig | undefined;
function clearIconCache(library?: string): void;
```

### 9.3 `<line-icon>` Component Interface

```typescript
interface LineIconProps {
  /** Icon name to resolve via the library's resolver */
  name: string;

  /** Registered library name */
  library: string;

  /** Direct SVG URL. Bypasses the registry when set */
  src: string;

  /** Accessible label. When empty, the icon is decorative (aria-hidden) */
  label: string;

  /** Size shorthand. Accepts aliases (xs, sm, md, lg, xl, 2xl) or CSS values */
  size: string;
}

/**
 * Events emitted by <line-icon>.
 */
interface LineIconEventMap {
  'line-icon-resolve': CustomEvent<IconResolveDetail>;
  'line-icon-error': CustomEvent<IconErrorDetail>;
}
```

### 9.4 Size Alias Type

```typescript
type IconSizeAlias = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const ICON_SIZE_MAP: Record<IconSizeAlias, string> = {
  xs: '0.75rem',
  sm: '1rem',
  md: '1.25rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '2.5rem',
};
```

---

## 10. Lifecycle & Sequence Diagrams

### 10.1 `<line-icon>` Render Lifecycle

```
connectedCallback()
  |  LineElement: standard setup (Metadata, Direction, Inspector)
  |  No machine (static tier)
  |
  v
firstUpdated()
  |  Read name, library, src attributes
  |  Trigger icon resolution
  |
  v
_resolveIcon()
  |  src set?
  |    YES → fetch src URL → sanitize → cache → render
  |    NO  → continue
  |  name set?
  |    YES → resolveIcon(name, library) → sanitize → render
  |    NO  → render empty
  |
  v
_renderSvg(svgString)
  |  Set innerHTML on root span
  |  Apply part="svg" to <svg> element
  |  Apply --line-icon-color and --line-icon-stroke-width
  |  Dispatch "line-icon-resolve" event
  |
  v
updated(changedProperties)
  |  If name, library, or src changed → re-trigger _resolveIcon()
```

### 10.2 Registry Resolution Sequence

```
<line-icon name="check" library="phosphor">
  │
  ├─ resolveIcon("check", "phosphor")
  │    │
  │    ├─ Cache lookup: "phosphor:check"
  │    │    HIT → return cached SVG
  │    │    MISS → continue
  │    │
  │    ├─ Pending lookup: "phosphor:check"
  │    │    HIT → await existing promise
  │    │    MISS → continue
  │    │
  │    ├─ Library lookup: "phosphor"
  │    │    MISS → return null (emit error)
  │    │    HIT → continue
  │    │
  │    ├─ Call resolver: phosphor.resolver("check")
  │    │    → "https://unpkg.com/.../check.svg"
  │    │
  │    ├─ Is URL? → fetch(url, library.fetchOptions)
  │    │    → Response text (SVG string)
  │    │
  │    ├─ Sanitize SVG
  │    │
  │    ├─ Apply mutator (if defined): library.mutator(svgElement)
  │    │
  │    ├─ Cache result: "phosphor:check" → sanitized SVG
  │    │
  │    └─ Return SVG string
  │
  └─ Render SVG in shadow DOM
```

### 10.3 Deduplication Flow

```
Time ──────────────────────────────────────────────►

Element A connects:
  resolveIcon("check", "phosphor")
  → cache MISS, pending MISS
  → create fetch promise, store in pending["phosphor:check"]
  → fetch starts...

Element B connects (fetch still in-flight):
  resolveIcon("check", "phosphor")
  → cache MISS, pending HIT
  → await pending["phosphor:check"]

Fetch completes:
  → sanitize SVG
  → cache["phosphor:check"] = sanitized SVG
  → delete pending["phosphor:check"]
  → Element A renders ← promise resolves
  → Element B renders ← same promise resolves

Element C connects (after fetch):
  resolveIcon("check", "phosphor")
  → cache HIT
  → return immediately (synchronous path)
```

---

## 11. Test Contracts

### 11.1 Icon Registry

| # | Test | Assertion |
|---|------|-----------|
| 1 | Register library | `registerIconLibrary('test', { resolver })` succeeds. `getIconLibrary('test')` returns the config. |
| 2 | Duplicate registration throws | Calling `registerIconLibrary('test', ...)` twice throws an error. |
| 3 | Unregister library | `unregisterIconLibrary('test')` removes the library. `getIconLibrary('test')` returns `undefined`. |
| 4 | Unregister non-existent | `unregisterIconLibrary('nonexistent')` does not throw. |
| 5 | Register single icon | `registerIcon('logo', '<svg>...</svg>')` caches the icon. `resolveIcon('logo')` returns the SVG. |
| 6 | Register single icon with library | `registerIcon('logo', '<svg>...</svg>', 'app')` caches under `app:logo`. |
| 7 | Resolve via URL resolver | A library whose resolver returns a URL triggers a fetch. The fetched SVG is returned. |
| 8 | Resolve via inline resolver | A library whose resolver returns an SVG string returns it directly without fetch. |
| 9 | Resolve unknown icon | `resolveIcon('nonexistent', 'test')` returns `null` when the resolver returns `undefined`. |
| 10 | Resolve unknown library | `resolveIcon('check', 'unregistered')` returns `null`. |
| 11 | Cache hit | After first resolution, a second `resolveIcon()` with the same arguments returns immediately from cache (no fetch). |
| 12 | Deduplication | Two concurrent `resolveIcon()` calls for the same icon trigger only one fetch. |
| 13 | Clear cache (all) | `clearIconCache()` empties the entire cache. Next `resolveIcon()` re-fetches. |
| 14 | Clear cache (library) | `clearIconCache('phosphor')` clears only phosphor icons. Other libraries remain cached. |
| 15 | Mutator applied | A library with a `mutator` function has it called with the parsed `SVGElement` before caching. |
| 16 | Fetch options forwarded | A library with `fetchOptions: { credentials: 'include' }` passes those options to `fetch()`. |

### 11.2 SVG Sanitization

| # | Test | Assertion |
|---|------|-----------|
| 1 | Valid SVG passes | A well-formed `<svg>` string passes sanitization unchanged (except attribute adjustments). |
| 2 | Script tags removed | An SVG containing `<script>` has it stripped. |
| 3 | Event handlers removed | An SVG with `onclick="..."` has the attribute removed. |
| 4 | foreignObject removed | An SVG containing `<foreignObject>` has it stripped. |
| 5 | fill=currentColor added | An SVG without explicit `fill` gets `fill="currentColor"` on the root element. |
| 6 | Explicit fill preserved | An SVG with `fill="#ff0000"` keeps its original fill. |
| 7 | Width/height removed | Root `<svg>` `width` and `height` attributes are removed. |
| 8 | viewBox preserved | The `viewBox` attribute is not modified. |
| 9 | Invalid SVG rejected | A string that does not parse as valid SVG returns `null`. |
| 10 | Non-SVG root rejected | An HTML string with a `<div>` root returns `null`. |

### 11.3 `<line-icon>` Component

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders with name + library | `<line-icon name="check" library="test">` resolves and renders the SVG inside its shadow DOM. |
| 2 | Renders with src | `<line-icon src="/test.svg">` fetches the URL and renders the SVG. |
| 3 | Decorative by default | `<line-icon name="check">` without `label` renders `aria-hidden="true"` and `role="presentation"`. |
| 4 | Meaningful with label | `<line-icon name="check" label="Approved">` renders `role="img"` and `aria-label="Approved"`. |
| 5 | Size alias | `<line-icon size="lg">` sets `--line-icon-size: 1.5rem` on the root element. |
| 6 | Size CSS value | `<line-icon size="3rem">` sets `--line-icon-size: 3rem` on the root element. |
| 7 | Color via currentColor | An icon's SVG `fill` is `currentColor`, inheriting from the parent's CSS `color`. |
| 8 | Custom property color | Setting `--line-icon-color: red` on the host changes the SVG fill to red. |
| 9 | Name change re-resolves | Changing `name` attribute from `"check"` to `"x"` triggers re-resolution and re-render. |
| 10 | Library change re-resolves | Changing `library` attribute triggers re-resolution. |
| 11 | Error event on missing library | `<line-icon name="x" library="unregistered">` emits `line-icon-error`. |
| 12 | Error event on fetch failure | A resolver returning a URL that 404s emits `line-icon-error`. |
| 13 | Resolve event on success | Successful resolution emits `line-icon-resolve`. |
| 14 | CSS part root | The root wrapper is exposed as `::part(root)`. |
| 15 | CSS part svg | After resolution, the SVG element is exposed as `::part(svg)`. |
| 16 | Empty render without name or src | `<line-icon>` with no `name` and no `src` renders an empty root span. |
| 17 | src takes precedence | `<line-icon name="check" library="test" src="/override.svg">` uses `src`, ignoring `name`/`library`. |
| 18 | axe-core clean | The component produces zero axe-core violations in both decorative and meaningful modes. |

---

## 12. Implementation Tasks

These map to `docs/PRODUCT-PLAN.md` section 2.7 (Epic 7).

| # | Task ID | Title | Description | Supervisor | Complexity | Dependencies |
|---|---------|-------|-------------|------------|------------|--------------|
| 1 | P0-E7-T1a | Implement icon registry module | Create `packages/icons/src/registry.ts` with `registerIconLibrary()`, `unregisterIconLibrary()`, `registerIcon()`, `resolveIcon()`, `getIconLibrary()`, `clearIconCache()`. Implement SVG cache, pending request deduplication, and resolution strategy. No DOM dependency. | Luna | M | P0-E3-T2 (icons package scaffold) |
| 2 | P0-E7-T1b | Implement SVG sanitizer | Create `packages/icons/src/sanitize.ts` with `sanitizeSvg()`. Parse via `DOMParser`, strip scripts/event handlers/foreignObject, ensure `fill="currentColor"`, remove width/height, preserve viewBox. Export for testing. | Luna | S | P0-E7-T1a |
| 3 | P0-E7-T1c | Implement `<line-icon>` component | Create `packages/icons/src/icon.ts` extending `LineElement` (static tier). Implement attribute handling, resolution triggering, SVG rendering, size mapping, accessibility attributes, CSS parts, events. Register via the Lit `@customElement('line-icon')` decorator, consistent with all other line://ui components. | Luna | M | P0-E7-T1a, P0-E7-T1b, P0-E4-T1 (LineElement base class) |
| 4 | P0-E7-T1d | Configure package exports | Set up `package.json` `exports` field with three entrypoints (`.`, `./registry`, `./icon`). Configure Vite library mode build. Generate TypeScript declarations. | Luna | S | P0-E7-T1c |
| 5 | P0-E7-T1e | Write unit tests for registry | Test all 16 registry test contracts (section 11.1). Mock `fetch()` for URL-based resolver tests. | Luna | M | P0-E7-T1a, P0-E6-T1 (test runner) |
| 6 | P0-E7-T1f | Write unit tests for sanitizer | Test all 10 sanitization test contracts (section 11.2). | Luna | S | P0-E7-T1b, P0-E6-T1 |
| 7 | P0-E7-T1g | Write component tests for `<line-icon>` | Test all 18 component test contracts (section 11.3). Uses `@open-wc/testing-helpers` for DOM rendering. Includes axe-core accessibility check. | Luna | M | P0-E7-T1c, P0-E6-T1 |
| 8 | P0-E7-T2 | Create Icon Setup guide story | Write the "Getting Started > Icon Setup" Storybook page. Content: how to register icon libraries, use `<line-icon>`, custom icons, `src` usage, size aliases, accessibility. Include interactive examples. | Luna | S | P0-E7-T1c, P0-E5-T1 (Storybook setup) |

**Dependency chain:**

```
P0-E3-T2 (icons scaffold) ──► P0-E7-T1a (registry) ──► P0-E7-T1b (sanitizer)
                                                     ──► P0-E7-T1e (registry tests)
P0-E4-T1 (LineElement) ──────────────────────────────┐
                                                      v
                              P0-E7-T1b ──────► P0-E7-T1c (component) ──► P0-E7-T1d (exports)
                                            ──► P0-E7-T1f (sanitizer tests)
                                                                       ──► P0-E7-T1g (component tests)
                                                                       ──► P0-E7-T2 (Storybook guide)
```

**Total estimated effort:** ~3-4 days for one developer.

---

## 13. Risks and Trade-offs

### 13.1 innerHTML for SVG Injection

**Risk:** Using `innerHTML` to inject SVGs into shadow DOM is a potential XSS vector.

**Mitigation:** The SVG sanitizer (section 3.10) strips all executable content before injection. The sanitizer is tested against adversarial inputs. Additionally, SVGs from registered resolvers are considered trusted because the consumer explicitly registered the library.

**Alternative considered:** Using `<img src="data:image/svg+xml,...">` or `<use href="...">`. Rejected because:
- `<img>` prevents CSS styling of SVG internals (no `currentColor`, no part styling)
- `<use>` has cross-origin limitations and cannot style SVG internals

### 13.2 Global Singleton Registry

**Trade-off:** A global singleton vs per-context registries.

- **Singleton (chosen):** Simple, predictable, matches `customElements.define()` semantics. One registration works everywhere.
- **Per-context:** More isolation (useful for micro-frontends), but adds complexity for consumers who would need to pass registries through the component tree.

**If micro-frontend isolation is needed later:** The registry module can be extended with a `createIconRegistry()` factory that returns an independent registry instance. `<line-icon>` would accept a `registry` property. This is a non-breaking addition.

### 13.3 DOMParser Availability in SSR

**Risk:** `DOMParser` is a browser API. Server runtimes may not provide it.

**Mitigation:** The sanitizer checks for `DOMParser` availability. In server contexts where `DOMParser` is not available:
- If a polyfill is installed (e.g., `linkedom`, `jsdom`), it is used.
- If no polyfill is available, sanitization is skipped and the raw SVG string is used. A console warning is emitted.
- The `./registry` entrypoint (without the component) never needs `DOMParser`.

### 13.4 Fetch Failures in Production

**Risk:** Icon CDN URLs may be unavailable (network issues, CDN downtime, CORS).

**Mitigation:**
- `line-icon-error` event lets consumers handle failures (e.g., show fallback text).
- The component renders an empty `<span>` on failure -- no layout shift, no broken images.
- Consumers can pre-register critical icons via `registerIcon()` to avoid fetch dependency for above-the-fold content.

### 13.5 Duplicate Registration Error vs Silent Overwrite

**Trade-off:** Throwing on duplicate `registerIconLibrary()` vs silently overwriting.

- **Throw (chosen):** Prevents accidental overwrites where two modules register the same library name with different resolvers. The consumer must explicitly `unregisterIconLibrary()` before re-registering. This makes misconfiguration visible.
- **Silent overwrite:** Convenient for hot-reload during development.

**Compromise for DX:** In development mode (detected via `import.meta.env?.DEV`), emit a console warning instead of throwing. In production, throw.

### 13.6 No Sprite Sheet Support

**Trade-off:** `<line-icon>` inlines individual SVGs. It does not support SVG sprite sheets (`<use href="#icon-name">`).

**Rationale:** Sprite sheets require the sprite to be in the same document. With shadow DOM, `<use>` cannot reference symbols in the light DOM. The inline approach is shadow DOM-compatible and cache-efficient (one fetch per unique icon, shared across all instances).

---

## 14. Resolved Questions

1. **Mutator API timing:** `mutator` receives the parsed `SVGElement` **after** sanitization. If a consumer's mutator adds unsafe content, that is their responsibility -- the sanitizer's job is to clean external/untrusted SVGs.

2. **Default library name:** `'default'` is a well-known, reserved library name. No mechanism to change it globally. Themes register under `'default'`. Consumers who want a different default can override by registering their resolver under `'default'`.

3. **SVG animation support:** SMIL animations (`<animate>`, `<animateTransform>`) are **preserved** by the sanitizer. SMIL is part of SVG and is not a security risk. Consumers can strip them in their `mutator` if desired.

---

## 15. File Structure (Target)

```
packages/icons/
  +-- package.json                  # @websublime/line-icons
  +-- tsconfig.json
  +-- vite.config.ts
  +-- src/
  |   +-- index.ts                  # Barrel: re-exports registry + icon
  |   +-- registry.ts               # Registry functions (no DOM dependency)
  |   +-- sanitize.ts               # SVG sanitization (uses DOMParser)
  |   +-- icon.ts                   # <line-icon> component (extends LineElement)
  |   +-- types.ts                  # IconLibraryConfig, IconResolveDetail, etc.
  |   +-- constants.ts              # ICON_SIZE_MAP, reserved names
  +-- tests/
  |   +-- registry.test.ts          # Registry unit tests
  |   +-- sanitize.test.ts          # Sanitizer unit tests
  |   +-- icon.test.ts              # <line-icon> component tests
  +-- dist/                         # Build output
      +-- index.js                  # Barrel
      +-- index.d.ts
      +-- registry.js               # Registry-only entrypoint
      +-- registry.d.ts
      +-- icon.js                   # Component-only entrypoint
      +-- icon.d.ts
```
