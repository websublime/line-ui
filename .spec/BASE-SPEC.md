# SPEC: LineElement Base Class & Mixins (Phase 0, Epic 4)

**Status:** APPROVED
**Author:** Ada (architect)
**Date:** 2026-03-12
**Source PRD:** `docs/PRODUCT-REQUIREMENTS-SPECIFICATION.md` (v0.7.0, Approved)
**Source Architecture:** `docs/ARCHITECTURE.md` (sections 6, 7, 8)
**Source Plan:** `docs/PRODUCT-PLAN.md` (section 2.4, Epic 4)

---

## 1. Overview

This spec defines the foundational contracts for `LineElement` -- the base class that all 131 line://ui components will extend. It covers the three-tier architecture (Pre-built, Custom, Static), four composable mixins (FormAssociated, Inspector, Metadata, Direction), the Zag.js adapter integration, the exploratory HTMX adapter, test contracts, and lifecycle management.

This is an **architectural design spec**, not a UI component spec. Every API surface defined here becomes a contract that downstream components depend on. Breaking changes here cascade across the entire library.

### 1.1 What Exists Today

The current codebase in `packages/core/src/` provides:

- **`ComponentMixin`** (`lib/component.ts`): A mixin applied to `ReactiveElement` that provides `dir` (LTR/RTL), `inspect` (boolean), and `isLTR` (getter). Minimal -- lifecycle hooks (`connectedCallback`, `disconnectedCallback`, `updated`) are overridden but empty.
- **`ComponentElement`** (`lib/web-component.ts`): Extends `ComponentMixin(LitElement)`. Provides `registry` (frozen `ComponentMetadata`), `options` (generic typed), `isVita` (symbol check), and attaches `InspectController`. Constructor requires `ComponentMetadata`.
- **`InspectController`** (`lib/controllers/inspect-controller.ts`): Reactive controller that reads `localStorage('line-inspector')` on `hostConnected` and appends a `<ui-inspector>` element to the shadow root.
- **`UiInspector`** (`lib/ui/inspector.ts`): A full LitElement component (`<ui-inspector>`) that renders a hover overlay showing scope, version, and a link. Uses hard-coded gradient styles.
- **`ComponentHtmx`** (`lib/htmx-component.ts`): Empty shell extending `ComponentElement`. No HTMX logic.
- **`EventController`** (`lib/controllers/event-controller.ts`): Minimal controller with a `notify()` method that awaits `updateComplete`.
- **Types**: `ComponentMetadata` (name, description, link, qa, scope, version), `ComponentMixinInterface`, `WebComponentOptions`, `ControllerHost`.
- **`defineWebComponent()`** / **`defineHtmxComponent()`**: Registration helpers that set `componentOptions` on the prototype and call `customElements.define()`.

### 1.2 What Must Change

| Current | Target | Rationale |
|---------|--------|-----------|
| `ComponentMixin` + `ComponentElement` | `LineElement` class | Single entry point; mixin composition is opt-in via separate mixins, not baked into the base class (ARCH 6) |
| `vita-inspector` localStorage key | `line-inspector` | Branding refactor (PRD Appendix B, Appendix C) |
| `vita-` tag prefix / `VITA` symbol | `line-` / `LINE` symbol | Branding refactor (P0-E1-T6, P0-E1-T7) |
| No Zag.js integration | Three-tier machine lifecycle | ARCH 8 |
| No `FormAssociated` support | Opt-in mixin with `ElementInternals` | ARCH 7 |
| Inspector as controller | Inspector as mixin | Consistent mixin composition model |
| `ComponentMetadata` in constructor | Metadata mixin with static/decorator pattern | Eliminate constructor boilerplate |
| No direction detection | Direction mixin with inheritance | PRD 1.7 (RTL) |

---

## 2. LineElement Base Class

### 2.1 Class Hierarchy

```
LitElement (from Lit 3+)
  +-- LineElement (extends LitElement)
        |
        +-- Metadata mixin (always applied -- zero overhead)
        +-- Direction mixin (always applied -- zero overhead)
        |
        +-- Optional composition:
        |     +-- FormAssociated mixin (opt-in per component)
        |     +-- Inspector mixin (opt-in, feature-flagged at runtime)
        |
        +-- Machine tier (declared by subclass):
              +-- Pre-built (Zag.js package machine)
              +-- Custom (createMachine())
              +-- Static (no machine -- zero overhead)
```

`LineElement` **extends** `LitElement` directly. It does not wrap it, and it does not use an intermediate mixin on `ReactiveElement`. The rationale: Lit 3+ provides everything needed (shadow DOM, reactive properties, lifecycle). An intermediate `ReactiveElement` mixin adds complexity without benefit since all line://ui components render shadow DOM.

### 2.2 Three-Tier Architecture

Components declare their tier by implementing (or not implementing) the `machine` property. The base class handles all three cases automatically.

#### Tier Declaration

```typescript
// Pre-built: return a Zag.js machine from a @zag-js/* package
import * as dialog from '@zag-js/dialog';

class LineDialog extends LineElement {
  protected machine = dialog; // Pre-built machine module
}

// Custom: return a createMachine() result
import { createMachine } from '@zag-js/core';

class LineInput extends LineElement {
  protected machine = createMachine<InputSchema>({ ... }); // Custom machine
}

// Static: do not define machine (or set to undefined)
class LineBadge extends LineElement {
  // No machine property -- zero overhead
}
```

#### Zero-Overhead Guarantee for Static Components

When `machine` is `undefined` (the default), the base class:
- Does NOT import or reference any Zag.js code
- Does NOT allocate machine-related state
- Does NOT hook into machine lifecycle methods
- The `connectedCallback` and `disconnectedCallback` perform only Lit's standard work plus mixin hooks

This is achieved by a conditional check in lifecycle methods, not by separate class hierarchies. The Zag.js adapter code is tree-shakeable -- if no component in the consumer's bundle uses a machine, the adapter code is eliminated.

### 2.3 Public API Surface

#### Properties

```typescript
abstract class LineElement extends LitElement {
  // --- Tier declaration ---

  /**
   * The Zag.js machine for this component.
   * - Pre-built: assign a @zag-js/* module (e.g., `import * as dialog from '@zag-js/dialog'`)
   * - Custom: assign a `createMachine()` result
   * - Static: leave undefined (default)
   *
   * @internal -- subclasses set this, consumers do not.
   */
  protected machine?: ZagMachineModule | ZagMachine;

  /**
   * Machine context properties. Subclasses override this to provide
   * initial context values derived from reactive properties.
   * Called on machine connect and on every relevant property change.
   *
   * @internal
   */
  protected machineContext?: Record<string, unknown>;

  // --- Identity ---

  /**
   * Whether this element is a line://ui component.
   * Checked via a shared Symbol. Useful for runtime detection
   * (e.g., Field detecting if a slotted child is a line://ui control).
   */
  readonly isLine: boolean; // always true
}
```

#### Methods

```typescript
abstract class LineElement extends LitElement {
  /**
   * Send an event to the running machine.
   * No-op if no machine is connected (static tier).
   */
  protected send(event: string, payload?: Record<string, unknown>): void;

  /**
   * Read a computed or context value from the machine.
   * Returns undefined if no machine is connected.
   */
  protected getContext<T>(key: string): T | undefined;

  /**
   * Emit a line://ui DOM event. All component events use this method
   * to ensure consistent event naming (line-*), bubbling, and composition.
   *
   * @param name - Event name WITHOUT the 'line-' prefix (added automatically)
   * @param detail - Event detail payload
   * @param options - Additional event options (defaults: bubbles=true, composed=true)
   */
  protected emitEvent<T>(name: string, detail?: T, options?: Partial<EventInit>): boolean;
}
```

#### Lifecycle Hooks for Subclasses

```typescript
abstract class LineElement extends LitElement {
  /**
   * Called after the machine connects and is running.
   * Override in subclasses that need to perform setup after
   * the machine is ready (e.g., register event listeners on
   * machine-managed elements).
   *
   * Not called for static-tier components.
   */
  protected machineConnected?(): void;

  /**
   * Called before the machine disconnects.
   * Override in subclasses that need cleanup before
   * machine teardown.
   *
   * Not called for static-tier components.
   */
  protected machineDisconnecting?(): void;
}
```

### 2.4 Machine Context Synchronization

For pre-built and custom machine tiers, the base class must synchronize Lit reactive properties with the Zag.js machine context. This is bidirectional:

**Lit -> Machine (property changes drive machine context):**

When a Lit reactive property changes (via `updated()`), the base class checks if the property name maps to a machine context key. If so, it calls the appropriate Zag.js API to update the context. Subclasses declare the mapping via `machineContext`:

```typescript
class LineDialog extends LineElement {
  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) modal = true;

  protected machine = dialog;

  protected get machineContext() {
    return {
      open: this.open,
      modal: this.modal,
      onOpenChange: (details: { open: boolean }) => {
        this.open = details.open;
        this.emitEvent('open-change', details);
      },
    };
  }
}
```

**Machine -> DOM (machine state drives rendering):**

The machine's `api` object (provided by Zag.js) exposes computed state and element props. Subclasses use these in their `render()` method:

```typescript
render() {
  const api = this.api; // provided by base class, undefined for static tier
  if (!api) return html`...`; // fallback for static or disconnected state

  return html`
    <div ${spread(api.getContentProps())} part="content">
      <slot></slot>
    </div>
  `;
}
```

### 2.5 Registration Helper

```typescript
/**
 * Register a line://ui custom element.
 *
 * @param tagName - The tag name including 'line-' prefix
 * @param elementClass - The LineElement subclass
 */
function defineElement<T extends LineElement>(
  tagName: `line-${string}`,
  elementClass: Constructor<T>
): Constructor<T>;
```

The registration helper:
- Validates the `line-` prefix (TypeScript enforced via template literal type)
- Guards against duplicate registration (`customElements.get()`)
- Does NOT set options on the prototype (the old `componentOptions` pattern is removed)

---

## 3. Mixin Composition

### 3.1 Mixin Pattern

All mixins follow the standard Lit mixin pattern (class expression applied to a constructor). Each mixin is independently importable from `@websublime/line-core/mixins/*`.

```typescript
// Mixin signature
type MixinFunction<T> = <Base extends Constructor<LitElement>>(
  base: Base
) => Base & Constructor<T>;
```

### 3.2 Composition Order

Mixins are applied in a specific order. Dependencies flow upward:

```
LitElement
  <- Direction mixin      (no dependencies)
  <- Metadata mixin       (no dependencies)
  <- Inspector mixin      (depends on: Metadata)
  <- FormAssociated mixin (no mixin dependencies, uses ElementInternals)
  = LineElement
```

In practice, `LineElement` applies Direction and Metadata automatically. Inspector and FormAssociated are opt-in.

**LineElement construction:**

```typescript
// Internal composition -- this is what LineElement does internally
const LineElementBase = MetadataMixin(DirectionMixin(LitElement));

export class LineElement extends LineElementBase {
  // ... base class implementation
}
```

**Opt-in mixins applied by component subclasses:**

```typescript
// A form-associated component
export class LineInput extends FormAssociatedMixin(LineElement) {
  static formAssociated = true; // required by the platform
  // ...
}

// Inspector is NOT a mixin applied at class level.
// It is a runtime behavior activated by feature flag.
// See section 3.4.
```

### 3.3 Metadata Mixin

Provides component identity metadata. Every line://ui component gets this automatically via `LineElement`.

#### Interface

```typescript
interface MetadataMixinInterface {
  /**
   * Component metadata. Set via the static `metadata` property
   * on the subclass. Frozen at construction time.
   */
  readonly componentMetadata: LineComponentMetadata;
}

interface LineComponentMetadata {
  /** Human-readable component name (e.g., "Dialog") */
  readonly name: string;

  /** Semantic version of the component (e.g., "0.2.0") */
  readonly version: string;

  /** URL to the component documentation */
  readonly docsUrl: string;

  /** Brief description of the component */
  readonly description: string;

  /** npm scope path (e.g., "@websublime/line-components/dialog") */
  readonly scope: string;

  /** QA identifier for testing (e.g., "line-dialog") */
  readonly qa: string;
}
```

#### Declaration Pattern

Subclasses declare metadata via a static property:

```typescript
class LineDialog extends LineElement {
  static metadata: LineComponentMetadata = {
    name: 'Dialog',
    version: '0.2.0',
    docsUrl: 'https://line-ui.websublime.com/components/dialog',
    description: 'Modal or non-modal dialog for focused interactions',
    scope: '@websublime/line-components/dialog',
    qa: 'line-dialog',
  };
}
```

The mixin reads the static property in the constructor and freezes it as `this.componentMetadata`. It also sets `data-qa` on the host element:

```typescript
function MetadataMixin<T extends Constructor<LitElement>>(base: T) {
  class MetadataElement extends base {
    readonly componentMetadata: LineComponentMetadata;

    constructor(...args: any[]) {
      super(...args);
      const ctor = this.constructor as typeof MetadataElement & { metadata?: LineComponentMetadata };
      this.componentMetadata = Object.freeze(ctor.metadata ?? DEFAULT_METADATA);
      this.dataset.qa = this.componentMetadata.qa;
    }
  }
  return MetadataElement as T & Constructor<MetadataMixinInterface>;
}
```

### 3.4 Inspector Behavior

The Inspector provides a visual overlay showing component metadata when activated. It is a **built-in runtime behavior**, not a class-level mixin. Every `LineElement` includes the Inspector capability, but it activates only when the feature flag is set.

#### Activation

```javascript
// Enable inspector globally
localStorage.setItem('line-inspector', 'true');

// Disable inspector
localStorage.removeItem('line-inspector');
```

Individual components can also be inspected via the `inspect` attribute:

```html
<line-dialog inspect></line-dialog>
```

#### Interface

```typescript
interface InspectorMixinInterface {
  /** Whether this component is currently being inspected */
  inspect: boolean; // @property, reflected
}
```

#### Implementation Approach

The Inspector is built into `LineElement` as an always-present but dormant capability:

1. **On `connectedCallback`**: Check `localStorage.getItem('line-inspector')`. If `'true'` or if `this.inspect === true`, activate the inspector overlay.
2. **On activation**: Create and append a `<line-inspector>` element to the shadow root. This element (refactored from `<ui-inspector>`) renders the metadata overlay on hover.
3. **On deactivation / `disconnectedCallback`**: Remove the `<line-inspector>` element and clean up event listeners.

#### Inspector Element Refactoring

The existing `<ui-inspector>` element is refactored to `<line-inspector>` with these changes:

| Current | Target |
|---------|--------|
| `<ui-inspector>` tag | `<line-inspector>` tag |
| Hard-coded gradient styles | CSS parts: `::part(inspector-badge)`, `::part(inspector-overlay)` |
| Reads `host.registry` | Reads `host.componentMetadata` |
| `vita-inspector` localStorage key | `line-inspector` localStorage key |
| No docs link | Clickable docs link from `componentMetadata.docsUrl` |
| Shows scope + version only | Shows scope + version + description on expanded hover |

#### CSS Parts Exposed by Inspector

```css
::part(inspector-overlay)  /* The border/outline around the component */
::part(inspector-badge)    /* The floating badge showing scope + version */
::part(inspector-link)     /* The documentation link */
```

#### Inspector Interaction with Metadata

The Inspector reads from `this.componentMetadata` (provided by the Metadata mixin). This is the dependency: Inspector depends on Metadata. Since Metadata is always applied in `LineElement`, this dependency is always satisfied.

### 3.5 Direction Mixin

Handles LTR/RTL detection and `dir` attribute management.

#### Interface

```typescript
interface DirectionMixinInterface {
  /** Current text direction. Reflects to attribute. */
  dir: 'ltr' | 'rtl';

  /** Convenience getter: true when dir === 'ltr' */
  readonly isLTR: boolean;

  /** Convenience getter: true when dir === 'rtl' */
  readonly isRTL: boolean;
}
```

#### Implementation

```typescript
function DirectionMixin<T extends Constructor<LitElement>>(base: T) {
  class DirectionElement extends base implements DirectionMixinInterface {
    @property({ reflect: true })
    dir: 'ltr' | 'rtl' = 'ltr';

    get isLTR(): boolean { return this.dir === 'ltr'; }
    get isRTL(): boolean { return this.dir === 'rtl'; }

    override connectedCallback(): void {
      super.connectedCallback();
      // Inherit dir from closest ancestor with dir attribute
      if (!this.hasAttribute('dir')) {
        const inherited = this.closest('[dir]');
        if (inherited) {
          this.dir = (inherited.getAttribute('dir') as 'ltr' | 'rtl') ?? 'ltr';
        } else {
          this.dir = document.documentElement.dir as 'ltr' | 'rtl' || 'ltr';
        }
      }
    }
  }
  return DirectionElement as T & Constructor<DirectionMixinInterface>;
}
```

Key behaviors:
- **Attribute reflection**: `dir` reflects to the host attribute so CSS selectors (`:host([dir="rtl"])`) work.
- **Inheritance**: If no explicit `dir` attribute is set, the mixin inherits from the closest ancestor with a `dir` attribute, falling back to `document.documentElement.dir`.
- **No MutationObserver**: Direction is read once on connect. If the document direction changes dynamically, the component re-reads on next connect or via explicit attribute set. MutationObserver would add overhead to all 131 components for a rare use case.

### 3.6 FormAssociated Mixin

Opt-in mixin that makes a component participate in native HTML `<form>` elements via `ElementInternals`.

#### Interface

```typescript
interface FormAssociatedMixinInterface {
  /** The ElementInternals instance for this component */
  readonly internals: ElementInternals;

  /** The form this component is associated with (read-only) */
  readonly form: HTMLFormElement | null;

  /** The component's name for form data */
  name: string;

  /** The component's value for form data */
  value: string;

  /** Whether the component is disabled */
  disabled: boolean;

  /** Whether the component is required */
  required: boolean;

  /** The component's validity state */
  readonly validity: ValidityState;

  /** The component's validation message */
  readonly validationMessage: string;

  /** Whether the component will validate */
  readonly willValidate: boolean;

  /** Check validity without UI feedback */
  checkValidity(): boolean;

  /** Check validity with UI feedback (show validation message) */
  reportValidity(): boolean;

  /** Set a custom validation error message */
  setCustomValidity(message: string): void;

  // --- Form lifecycle callbacks (called by the platform) ---

  /** Called when the form is reset */
  formResetCallback(): void;

  /** Called when the form state is restored (e.g., back/forward navigation) */
  formStateRestoreCallback(state: string | FormData | File, mode: 'restore' | 'autocomplete'): void;

  /** Called when the component is associated with a form */
  formAssociatedCallback(form: HTMLFormElement | null): void;

  /** Called when the disabled state is inherited from a fieldset */
  formDisabledCallback(disabled: boolean): void;
}
```

#### Implementation

```typescript
function FormAssociatedMixin<T extends Constructor<LineElement>>(base: T) {
  class FormAssociatedElement extends base implements FormAssociatedMixinInterface {
    // Platform requirement: static flag
    static formAssociated = true;

    readonly internals: ElementInternals;

    @property({ reflect: true })
    name = '';

    @property()
    value = '';

    @property({ type: Boolean, reflect: true })
    disabled = false;

    @property({ type: Boolean, reflect: true })
    required = false;

    // Track the initial/default value for form reset
    private _defaultValue = '';

    constructor(...args: any[]) {
      super(...args);
      this.internals = this.attachInternals();
    }

    // --- Validity ---

    get form() { return this.internals.form; }
    get validity() { return this.internals.validity; }
    get validationMessage() { return this.internals.validationMessage; }
    get willValidate() { return this.internals.willValidate; }

    checkValidity(): boolean { return this.internals.checkValidity(); }
    reportValidity(): boolean { return this.internals.reportValidity(); }

    setCustomValidity(message: string): void {
      if (message) {
        this.internals.setValidity(
          { customError: true },
          message,
          this._getValidationAnchor()
        );
      } else {
        this.internals.setValidity({});
      }
    }

    // --- Form value ---

    /**
     * Update the form value. Subclasses call this when their
     * internal value changes (e.g., on input event).
     */
    protected setFormValue(value: string | FormData | File | null): void {
      this.internals.setFormValue(value);
    }

    /**
     * Set validity flags with a message. Subclasses call this
     * during their validation logic.
     */
    protected setValidity(
      flags: ValidityStateFlags,
      message?: string,
      anchor?: HTMLElement
    ): void {
      this.internals.setValidity(flags, message, anchor ?? this._getValidationAnchor());
    }

    // --- Form lifecycle callbacks ---

    formResetCallback(): void {
      this.value = this._defaultValue;
      this.internals.setFormValue(this._defaultValue);
      this.internals.setValidity({});
      this.requestUpdate();
    }

    formStateRestoreCallback(
      state: string | FormData | File,
      _mode: 'restore' | 'autocomplete'
    ): void {
      if (typeof state === 'string') {
        this.value = state;
        this.internals.setFormValue(state);
      }
    }

    formAssociatedCallback(_form: HTMLFormElement | null): void {
      // Subclasses can override for custom behavior
    }

    formDisabledCallback(disabled: boolean): void {
      this.disabled = disabled;
      this.requestUpdate();
    }

    override connectedCallback(): void {
      super.connectedCallback();
      this._defaultValue = this.value;
    }

    /**
     * Returns the element to anchor validation popups to.
     * Subclasses can override to point to a specific internal element
     * (e.g., the <input> inside a composite component).
     */
    protected _getValidationAnchor(): HTMLElement {
      return this;
    }

    // --- CSS pseudo-class support ---
    // :invalid and :valid pseudo-classes work automatically via ElementInternals.
    // No extra code needed -- the platform handles this based on setValidity().
  }

  return FormAssociatedElement as T & Constructor<FormAssociatedMixinInterface>;
}
```

#### Usage by Components

```typescript
// A form-associated component
export class LineInput extends FormAssociatedMixin(LineElement) {
  // static formAssociated = true is set by the mixin

  protected machine = inputMachine;

  @property()
  type: 'text' | 'email' | 'tel' | 'url' = 'text';

  private _onInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this.setFormValue(this.value);
    this.emitEvent('change', { value: this.value });
  }
}
```

#### Interaction with `:invalid` / `:valid` CSS Pseudo-Classes

When `ElementInternals.setValidity()` is called with error flags, the browser automatically applies `:invalid` to the host element. When validity is cleared, `:valid` applies. These pseudo-classes work in consumer CSS:

```css
line-input:invalid::part(root) {
  border-color: var(--line-danger-7);
}
```

No component-side JavaScript is needed for this -- it is a platform feature of `ElementInternals`.

---

## 4. Zag.js Adapter

### 4.1 Integration with `@zag-js/element`

The `@zag-js/element` package provides the official Lit adapter for Zag.js. It exposes a `useMachine()` function adapted for reactive controllers in Lit.

The `LineElement` base class uses this adapter internally. Subclasses never interact with `@zag-js/element` directly -- they declare a `machine` and a `machineContext`, and the base class handles connection, synchronization, and cleanup.

### 4.2 Pre-built Machine Wiring

For pre-built machines (e.g., `@zag-js/dialog`, `@zag-js/tabs`):

```typescript
import * as dialog from '@zag-js/dialog';

export class LineDialog extends LineElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean }) modal = true;

  protected machine = dialog;

  protected get machineContext() {
    return {
      id: this.id || this._generateId(),
      open: this.open,
      modal: this.modal,
      onOpenChange: (details: { open: boolean }) => {
        this.open = details.open;
        this.emitEvent('open-change', details);
      },
    };
  }

  render() {
    const api = this.api as dialog.Api;
    return html`
      <div ${spread(api.getBackdropProps())} part="overlay"></div>
      <div ${spread(api.getPositionerProps())}>
        <div ${spread(api.getContentProps())} part="content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
```

**Key points:**
- `machine` is assigned the entire Zag.js module (which exports `machine`, `connect`, etc.)
- `machineContext` returns the context object, including callback handlers that bridge to `emitEvent()`
- `this.api` is provided by the base class after machine connection. It is typed as `unknown` at the base level; subclasses cast it to the specific API type.
- `spread()` is a Lit directive that applies Zag.js element props (ARIA attributes, event handlers, etc.) to DOM elements.

### 4.3 Custom Machine Wiring

For custom machines via `createMachine()`:

```typescript
import { createMachine } from '@zag-js/core';

const inputMachine = createMachine<InputSchema>({
  props({ props }) {
    return { disabled: false, required: false, readOnly: false, ...props };
  },
  context({ prop, bindable }) {
    return {
      value: bindable(() => ({
        defaultValue: prop('defaultValue') ?? '',
        value: prop('value'),
        onChange(value) { prop('onChange')?.({ value }); },
      })),
    };
  },
  computed: {
    isEmpty({ context }) { return context.get('value') === ''; },
  },
  states: {
    idle: { on: { FOCUS: { target: 'focused' } } },
    focused: {
      on: {
        BLUR: { target: 'idle', actions: ['validate'] },
        CHANGE: { actions: ['setValue'] },
      },
    },
  },
});

export class LineInput extends FormAssociatedMixin(LineElement) {
  protected machine = inputMachine;

  protected get machineContext() {
    return {
      id: this.id || this._generateId(),
      value: this.value,
      disabled: this.disabled,
      required: this.required,
      onChange: (details: { value: string }) => {
        this.value = details.value;
        this.setFormValue(this.value);
        this.emitEvent('change', details);
      },
    };
  }
}
```

**Difference from pre-built:** The `machine` property receives a `createMachine()` result directly instead of a module. The base class detects which type it is and handles both.

### 4.4 Machine Type Detection

The base class detects the machine type via duck-typing:

```typescript
private _getMachineType(): 'prebuilt' | 'custom' | 'static' {
  if (!this.machine) return 'static';
  // Pre-built modules export a `machine` function and a `connect` function
  if ('machine' in this.machine && 'connect' in this.machine) return 'prebuilt';
  // Custom machines are direct createMachine() results
  return 'custom';
}
```

### 4.5 Event Forwarding

Zag.js machines emit events via callback props (e.g., `onOpenChange`, `onChange`, `onFocusChange`). The base class does NOT automatically forward these. Instead, subclasses explicitly bridge machine callbacks to DOM events via `emitEvent()` in their `machineContext` callbacks, as shown in the examples above.

This is intentional: automatic forwarding would create a leaky abstraction where internal machine events bleed into the public DOM API. Each component's spec defines exactly which events are public.

### 4.6 Machine Cleanup on Disconnect

When `disconnectedCallback` fires:

1. `machineDisconnecting()` hook is called (if defined by subclass)
2. The machine service is stopped
3. The API reference is nulled
4. All Zag.js-managed event listeners are automatically cleaned up (Zag.js handles this internally)

### 4.7 `spread()` Directive

Zag.js API methods return prop objects (e.g., `api.getContentProps()` returns `{ id, role, 'aria-modal': true, ... }`). These need to be applied to DOM elements. The `spread()` directive (from `@zag-js/element` or implemented as a custom Lit directive) applies all properties:

```typescript
html`<div ${spread(api.getContentProps())} part="content">...</div>`
```

This is imported from `@websublime/line-core/utilities/directives` and re-exported for component use.

---

## 5. HTMX Adapter

### 5.1 `LineHtmxElement` Concept

`LineHtmxElement` extends `LineElement` to add HTMX compatibility. The goal: any line://ui component can be extended with an HTMX variant that responds to server-driven state updates.

### 5.2 `hx-*` Attribute Forwarding

HTMX operates via `hx-*` attributes on DOM elements. Shadow DOM encapsulation prevents HTMX from seeing internal elements. `LineHtmxElement` solves this by:

1. **Collecting `hx-*` attributes** from the host element
2. **Forwarding them** to the appropriate internal element (typically the one with `part="root"` or the primary interactive element)
3. **Re-forwarding on mutation** if `hx-*` attributes change at runtime

```typescript
class LineHtmxElement extends LineElement {
  /**
   * Returns the element that should receive forwarded hx-* attributes.
   * Subclasses override to target a specific internal element.
   * Defaults to the first element with part="root" in the shadow root.
   */
  protected getHtmxTarget(): Element | null;

  /**
   * Called after HTMX performs a swap that affects this component.
   * Override for custom post-swap behavior.
   */
  protected htmxAfterSwap?(event: CustomEvent): void;

  /**
   * Called before HTMX performs a swap that affects this component.
   * Override to prepare for content replacement.
   */
  protected htmxBeforeSwap?(event: CustomEvent): void;
}
```

### 5.3 Server-Driven State Management

For components with Zag.js machines, HTMX can drive state by:
- Returning HTML with updated attributes (HTMX swaps the element; `attributeChangedCallback` triggers machine context update)
- Using `hx-vals` to send machine-relevant data
- Using HTMX events (`htmx:afterSwap`) to trigger machine transitions via `send()`

### 5.4 Swap-Aware Lifecycle Hooks

HTMX swaps can replace or modify component content. `LineHtmxElement` listens for HTMX events on the host:

```typescript
connectedCallback() {
  super.connectedCallback();
  this.addEventListener('htmx:beforeSwap', this._onBeforeSwap);
  this.addEventListener('htmx:afterSwap', this._onAfterSwap);
  this.addEventListener('htmx:afterSettle', this._onAfterSettle);
}
```

### 5.5 Go/No-Go Evaluation Criteria

The HTMX spike (P0-E4-T7) must evaluate and document:

| Criterion | Pass Condition |
|-----------|---------------|
| Attribute forwarding works | `hx-get`, `hx-post`, `hx-swap`, `hx-target` forward correctly through shadow DOM |
| Swap preserves machine state | After an HTMX swap of inner content, the machine state is not corrupted |
| No HTMX build dependency | HTMX remains a runtime-only dependency, not a build dependency |
| Performance | Attribute forwarding adds < 1ms to `connectedCallback` |
| Fallback | If HTMX is not loaded, `LineHtmxElement` behaves identically to `LineElement` |
| Real use case | At least one component (e.g., Dialog) works end-to-end with HTMX: trigger from server, content from server, state managed via attributes |

**Go**: All criteria pass. HTMX adapter is committed for Phase 1.
**No-go**: Any criterion fails without a viable workaround. HTMX adapter is deferred or dropped. Document findings.

---

## 6. Lifecycle Diagram

```
Constructor
  |  Metadata mixin: read static metadata, freeze, set data-qa
  |  Direction mixin: set default dir
  |  FormAssociated mixin (if applied): attachInternals()
  |  Identity: set isLine = true
  |
  v
connectedCallback()
  |  LitElement: schedule first render
  |  Direction mixin: inherit dir from ancestor
  |  Inspector: check localStorage('line-inspector'), activate if enabled
  |  FormAssociated mixin (if applied): capture default value
  |  Machine (if declared): create machine service, provide machineContext
  |
  v
firstUpdated()
  |  LitElement: first render complete
  |  Machine (if declared): connect machine, obtain API
  |  machineConnected() hook called (if defined by subclass)
  |
  v
updated(changedProperties)
  |  LitElement: re-render complete
  |  Machine (if declared): sync changed properties to machine context
  |
  v
[component is live -- responds to property changes, user interaction, machine events]
  |
  v
disconnectedCallback()
  |  machineDisconnecting() hook called (if defined by subclass)
  |  Machine (if declared): stop machine service, null API reference
  |  Inspector: remove overlay element, clean up listeners
  |  LitElement: standard cleanup
```

**Where each mixin hooks in:**

```
                   constructor  connectedCallback  firstUpdated  updated  disconnectedCallback
                   ----------   -----------------  ------------  -------  --------------------
Metadata           X (freeze)
Direction          X (default)  X (inherit)
Inspector                       X (check flag)                            X (cleanup)
FormAssociated     X (internals) X (default val)
Machine (base)                  X (create)          X (connect)   X (sync) X (stop)
```

**Machine connect timing rationale:** The machine is created in `connectedCallback` but connected in `firstUpdated`. This ensures the shadow DOM is rendered before the machine attempts to query or modify internal elements. Zag.js machines often need to reference DOM elements (for focus management, ARIA, positioning), which only exist after the first render.

---

## 7. Test Contracts

Each piece must pass its test contracts before it is considered complete.

### 7.1 LineElement Base Class

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders without machine | A static-tier LineElement subclass renders its template without errors. No Zag.js code is executed. |
| 2 | Machine lifecycle (pre-built) | A pre-built machine connects after `firstUpdated`, provides a valid `api`, and disconnects on `disconnectedCallback`. |
| 3 | Machine lifecycle (custom) | A custom `createMachine()` result connects and disconnects identically to pre-built. |
| 4 | Machine context sync | Changing a Lit reactive property that maps to `machineContext` updates the running machine's context. |
| 5 | Machine event forwarding | A machine callback in `machineContext` that calls `emitEvent()` produces a DOM event with `line-` prefix, `bubbles: true`, `composed: true`. |
| 6 | `send()` no-op for static | Calling `send()` on a static-tier component does not throw. |
| 7 | `getContext()` returns undefined for static | Calling `getContext()` on a static-tier component returns `undefined`. |
| 8 | `isLine` identity | Every `LineElement` instance has `isLine === true`. |
| 9 | `emitEvent()` naming | `emitEvent('change', { value: 'x' })` dispatches a `CustomEvent` with type `line-change`. |
| 10 | Zero overhead verification | A static-tier component's `connectedCallback` does not reference Zag.js. (Verified via code inspection, not runtime test.) |
| 11 | `defineElement()` registration | `defineElement('line-test', TestElement)` registers the element. Duplicate calls do not throw. |
| 12 | `defineElement()` prefix enforcement | `defineElement('bad-name', TestElement)` fails at compile time (TypeScript template literal type). |
| 13 | Graceful machine failure | If a Zag.js machine fails to initialize (e.g., missing required context), the component renders in a fallback state without throwing to the consumer. (PRD 1.7: Error handling) |

### 7.2 Metadata Mixin

| # | Test | Assertion |
|---|------|-----------|
| 1 | Static metadata read | `componentMetadata` returns the frozen static metadata object. |
| 2 | Missing metadata fallback | A subclass without static `metadata` gets a default metadata object (all fields empty strings). |
| 3 | `data-qa` set | The host element has `data-qa` attribute matching `componentMetadata.qa`. |
| 4 | Immutability | Attempting to modify `componentMetadata` properties throws (Object.freeze). |

### 7.3 Direction Mixin

| # | Test | Assertion |
|---|------|-----------|
| 1 | Default direction | A component without explicit `dir` defaults to `'ltr'`. |
| 2 | Attribute inheritance | A component inside `<div dir="rtl">` inherits `dir === 'rtl'`. |
| 3 | Explicit attribute wins | `<line-test dir="rtl">` inside `<div dir="ltr">` has `dir === 'rtl'`. |
| 4 | `isLTR` / `isRTL` getters | When `dir === 'rtl'`, `isRTL` is `true` and `isLTR` is `false`. |
| 5 | Attribute reflection | Setting `this.dir = 'rtl'` programmatically reflects to the host attribute. |
| 6 | Document fallback | A component without any ancestor `dir` reads from `document.documentElement.dir`. |

### 7.4 Inspector Mixin

| # | Test | Assertion |
|---|------|-----------|
| 1 | Feature flag activation | Setting `localStorage('line-inspector', 'true')` before connecting the component activates the inspector overlay. |
| 2 | Feature flag deactivation | Without the localStorage key, no inspector overlay is rendered. |
| 3 | `inspect` attribute activation | `<line-test inspect>` activates the inspector overlay regardless of localStorage. |
| 4 | Overlay metadata | The inspector overlay displays `componentMetadata.scope` and `componentMetadata.version`. |
| 5 | Docs link | The inspector overlay includes a clickable link to `componentMetadata.docsUrl`. |
| 6 | Cleanup on disconnect | Removing the component from the DOM cleans up the inspector overlay and all event listeners. |
| 7 | CSS parts exposed | The inspector overlay exposes `inspector-overlay`, `inspector-badge`, and `inspector-link` parts. |

### 7.5 FormAssociated Mixin

| # | Test | Assertion |
|---|------|-----------|
| 1 | Form participation | A FormAssociated component inside a `<form>` appears in `new FormData(form)` with its `name` and `value`. |
| 2 | Form submit | A `<form>` containing a FormAssociated component with `name="email"` and `value="test@test.com"` includes `email=test@test.com` in the submitted FormData. |
| 3 | Form reset | Calling `form.reset()` restores the component's value to its initial value. |
| 4 | `checkValidity()` | Calling `checkValidity()` returns `false` when the component has validation errors set via `setValidity()`. |
| 5 | `reportValidity()` | Calling `reportValidity()` returns `false` and triggers the browser's validation UI. |
| 6 | `setCustomValidity()` | `setCustomValidity('Error')` makes `checkValidity()` return `false`. `setCustomValidity('')` clears it. |
| 7 | `:invalid` pseudo-class | After `setValidity({ valueMissing: true }, 'Required')`, the component matches `:invalid`. |
| 8 | `:valid` pseudo-class | After clearing validity, the component matches `:valid`. |
| 9 | `formDisabledCallback` | Disabling a parent `<fieldset>` sets `disabled = true` on the component. |
| 10 | `formStateRestoreCallback` | Browser back/forward restores the component's value. |
| 11 | `required` validation | A FormAssociated component with `required` and empty value fails validation with `valueMissing`. |
| 12 | `setFormValue()` updates FormData | Calling `setFormValue('new')` makes the new value appear in `new FormData(form)`. |

### 7.6 Zag.js Adapter

| # | Test | Assertion |
|---|------|-----------|
| 1 | Pre-built machine connects | A component using `@zag-js/dialog` has a valid `api` after `firstUpdated`. |
| 2 | Pre-built machine API | `api.getContentProps()` returns an object with ARIA attributes. |
| 3 | Custom machine connects | A component using `createMachine()` has a valid `api` after `firstUpdated`. |
| 4 | Machine state transitions | Sending an event via `send()` transitions the machine to the expected state. |
| 5 | Context change propagation | Changing a Lit property that maps to `machineContext` updates the machine and re-renders. |
| 6 | Callback-to-event bridge | A machine callback that calls `emitEvent()` dispatches the correct DOM event. |
| 7 | Disconnect cleanup | After `disconnectedCallback`, the machine service is stopped and `api` is `null`. |
| 8 | Reconnect | Removing and re-appending a component to the DOM creates a new machine connection. |
| 9 | `spread()` directive | `spread(api.getContentProps())` applies all returned attributes and event listeners to the target element. |
| 10 | Machine failure fallback | If machine initialization throws, the component renders without crashing. Console warning is emitted. |

### 7.7 HTMX Adapter

| # | Test | Assertion |
|---|------|-----------|
| 1 | `hx-*` attribute forwarding | `hx-get="/api"` on the host element is forwarded to the `getHtmxTarget()` element. |
| 2 | No HTMX fallback | Without HTMX loaded, `LineHtmxElement` behaves identically to `LineElement`. |
| 3 | Swap lifecycle hooks | `htmxBeforeSwap` and `htmxAfterSwap` are called during HTMX swap operations. |
| 4 | Machine state preservation | After an HTMX content swap, the machine state is not corrupted. |

---

## 8. Implementation Tasks

These map directly to `docs/PRODUCT-PLAN.md` section 2.4 (Epic 4) with added granularity.

| # | Task ID | Title | Description | Supervisor | Complexity |
|---|---------|-------|-------------|------------|------------|
| 1 | P0-E4-T1 | Refactor LineElement base class | Implement `LineElement` extending `LitElement` with three-tier machine support. Remove `ComponentMixin`, `ComponentElement`, `defineWebComponent()`. Create `defineElement()`. Implement `send()`, `getContext()`, `emitEvent()`, `machineConnected()`, `machineDisconnecting()` hooks. | Luna | L |
| 2 | P0-E4-T3 | Implement Metadata mixin | `MetadataMixin` with static metadata pattern, `componentMetadata` frozen property, `data-qa` attribute. | Luna | S |
| 3 | P0-E4-T4 | Implement Direction mixin | `DirectionMixin` with `dir`, `isLTR`, `isRTL`, ancestor inheritance. | Luna | S |
| 4 | P0-E4-T2 | Implement Inspector mixin | Refactor `InspectController` and `UiInspector` into Inspector behavior built into `LineElement`. Rename `<ui-inspector>` to `<line-inspector>`. Update localStorage key. Add CSS parts. Add docs link. | Luna | M |
| 5 | P0-E4-T5 | Implement FormAssociated mixin | `FormAssociatedMixin` with `ElementInternals`, `setFormValue()`, `setValidity()`, `checkValidity()`, `reportValidity()`, form lifecycle callbacks. | Luna | L |
| 6 | P0-E4-T6 | Validate Zag.js integration | Integrate `@zag-js/element` with `LineElement`. Validate pre-built (`@zag-js/dialog` or `@zag-js/presence`) and custom (`createMachine()`) machines. Implement `spread()` directive. Document maturity findings. | Luna | M |
| 7 | P0-E4-T7 | Validate HTMX integration | Spike: implement `LineHtmxElement` with `hx-*` forwarding, swap hooks. Evaluate against go/no-go criteria in section 5.5. Non-blocking. | Luna | M |

**Dependency chain:**
```
P0-E4-T3 (Metadata) ──┐
P0-E4-T4 (Direction) ──┼──> P0-E4-T1 (LineElement base) ──> P0-E4-T2 (Inspector)
                       │                                  ──> P0-E4-T5 (FormAssociated)
                       │                                  ──> P0-E4-T6 (Zag.js)
                       │                                  ──> P0-E4-T7 (HTMX)
```

**Note:** Metadata and Direction are composed into LineElement, so they must be implemented first (or simultaneously with the base class). Inspector, FormAssociated, Zag.js, and HTMX all depend on the base class being in place.

**PRODUCT-PLAN refinement:** The original PRODUCT-PLAN (§2.4) shows T3 and T4 depending on T1. This spec refines that: T3 (Metadata) and T4 (Direction) have no dependencies and should be implemented before or in parallel with T1, since T1 composes them. The beads dependency graph should be updated accordingly.

---

## 9. Risks and Trade-offs

### 9.1 `@zag-js/element` Maturity

**Risk:** The `@zag-js/element` adapter is relatively new. Its API may change, or it may have undiscovered issues with Lit 3+ lifecycle.

**Mitigation:** P0-E4-T6 is a dedicated validation spike. If the adapter has issues, the fallback is a thin custom adapter wrapping `@zag-js/core` directly (the Zag.js core is stable and framework-agnostic).

### 9.2 Machine Connect Timing

**Trade-off:** Connecting the machine in `firstUpdated` (after first render) vs `connectedCallback` (before first render).

- **`firstUpdated` (chosen):** Shadow DOM elements exist when the machine connects. Zag.js can query them. Downside: the first render happens without the machine API, so the component may briefly render in a "no machine" state.
- **`connectedCallback`:** Machine connects earlier, but shadow DOM may not exist. Zag.js element queries would fail.

**Decision:** `firstUpdated`. The brief "no machine" state is invisible because `firstUpdated` fires synchronously after the first render, before the browser paints. The re-render triggered by machine connection is batched.

### 9.3 Mixin vs Inheritance for FormAssociated

**Trade-off:** FormAssociated as a mixin vs a separate base class (`LineFormElement`).

- **Mixin (chosen):** Composable. A component can be both FormAssociated and use a pre-built machine. Follows the existing mixin pattern.
- **Separate class:** Simpler for the 25 form components, but creates a parallel hierarchy that complicates the 106 non-form components.

### 9.4 Inspector as Built-in vs Mixin

**Trade-off:** Inspector behavior built into `LineElement` (every component gets it) vs a separate opt-in mixin.

- **Built-in (chosen):** The Inspector is a key differentiator (PRD 1.4). Every component should be inspectable when the feature flag is active. Making it opt-in risks components forgetting to apply it.
- **Opt-in mixin:** Slightly smaller base class for components that don't need inspection.

**Decision:** Built-in. The overhead is one `localStorage.getItem()` check in `connectedCallback`, which is negligible. The Inspector UI element is only created when the flag is active.

### 9.5 `emitEvent()` Prefix Enforcement

**Trade-off:** Automatic `line-` prefix in `emitEvent()` vs letting subclasses specify the full event name.

- **Automatic prefix (chosen):** Ensures consistency. `emitEvent('change')` always produces `line-change`. No component can accidentally emit an unprefixed event.
- **Manual naming:** More flexibility, but inconsistency risk across 131 components.

---

## 10. Open Questions

These require resolution during implementation or review:

1. **`@zag-js/element` API shape:** The exact API of `useMachine()` from `@zag-js/element` needs validation. The spec assumes it returns an `api` object, but the actual integration details depend on P0-E4-T6 findings.

2. **`spread()` directive source:** Should `spread()` come from `@zag-js/element`, from `@zag-js/core`, or be a custom Lit directive in `@websublime/line-core`? Depends on what `@zag-js/element` provides.

3. **Machine ID generation:** **RESOLVED** — Use `this.id` if the consumer sets an `id` attribute. Otherwise, generate a stable ID via a monotonic counter: `line-{tagName}-{counter}` (e.g., `line-dialog-1`, `line-dialog-2`). Counter is per-tag-name, reset on page load. This is lightweight, deterministic within a session, and avoids UUID overhead. Zag.js only requires uniqueness within the document, not globally.

4. **Inspector toggle at runtime:** **RESOLVED** — No dynamic toggle. Components check `localStorage` only on `connectedCallback`. Rationale: the Inspector is a development tool, not a production feature. Developers toggle it and refresh. A `storage` event listener on every component instance would add unnecessary overhead. If dynamic toggle is needed in the future, it can be added via a single `window.addEventListener('storage', ...)` that dispatches to a WeakSet of connected components.

---

## 11. File Structure (Target)

After implementation, `packages/core/src/` should look like:

```
packages/core/src/
  +-- index.ts                    # Public type exports
  +-- main.ts                     # Registration helpers, re-exports
  +-- version.ts                  # Package version constant
  +-- lib/
  |   +-- line-element.ts         # LineElement base class
  |   +-- line-htmx-element.ts    # LineHtmxElement (HTMX adapter)
  |   +-- define-element.ts       # defineElement() registration helper
  |   +-- mixins/
  |   |   +-- metadata.ts         # MetadataMixin
  |   |   +-- direction.ts        # DirectionMixin
  |   |   +-- form-associated.ts  # FormAssociatedMixin
  |   |   +-- index.ts            # Barrel export for mixins
  |   +-- inspector/
  |   |   +-- inspector.ts        # <line-inspector> element
  |   |   +-- inspector-behavior.ts  # Inspector activation logic
  |   +-- machine/
  |   |   +-- adapter.ts          # Zag.js adapter integration
  |   |   +-- types.ts            # Machine-related types
  |   +-- storage.ts              # localStorage/sessionStorage wrapper
  +-- types/
  |   +-- component.ts            # LineComponentMetadata, etc.
  |   +-- general.ts              # Constructor, ValueOf
  |   +-- lit.ts                  # Re-exported Lit types
  +-- utilities/
      +-- decorators.ts           # Re-exported Lit decorators
      +-- directives.ts           # spread() + other directives
      +-- helpers.ts              # General helpers
      +-- html.ts                 # HTML utilities
```

Files to remove:
- `lib/component.ts` (replaced by mixins)
- `lib/web-component.ts` (replaced by `line-element.ts`)
- `lib/htmx-component.ts` (replaced by `line-htmx-element.ts`)
- `lib/controllers/inspect-controller.ts` (replaced by `inspector/`)
- `lib/controllers/event-controller.ts` (replaced by `emitEvent()` on base class)
- `lib/ui/inspector.ts` (replaced by `inspector/inspector.ts`)
