import type { LitElement } from 'lit';

/**
 * Generic constructor type used for Lit mixin composition.
 * Matches the shape declared in spec §6.D.5.
 */
// biome-ignore lint/complexity/noBannedTypes: `{}` is the conventional mixin base constraint.
// biome-ignore lint/suspicious/noExplicitAny: spec §6.D.5 mandates `any[]` for the mixin constructor signature.
type Constructor<T = {}> = new (...args: any[]) => T;

/** localStorage key whose value must equal {@link INSPECTOR_FLAG_ON} to activate. */
const INSPECTOR_FLAG_KEY = 'line-ui:inspector';
/** Authoritative activation value for {@link INSPECTOR_FLAG_KEY} (spec §6.D.2, AM-021). */
const INSPECTOR_FLAG_ON = 'on';

/**
 * The single dev-inspector hover-outline rule (spec §6.D.2).
 *
 * Drawn only while the inspector flag is `'on'` and the host is hovered — the
 * `data-line-inspect` marker (set in {@link InspectorElement.#activateInspector})
 * is the activation hook. A conventional dev-inspector outline: a 2px accent
 * outline with a small offset, self-contained in one rule so it adopts/removes
 * atomically.
 */
const INSPECTOR_OUTLINE_CSS = ':host(:hover[data-line-inspect]) { outline: 2px solid #4c8eff; outline-offset: 2px; }';

/**
 * Module-level singleton `CSSStyleSheet` carrying the hover-outline rule.
 *
 * Constructed once, lazily (and only when the inspector activates — never on the
 * production no-op path, so there is zero overhead when the flag is unset). The
 * same sheet instance is adopted by / removed from every active host's
 * `adoptedStyleSheets`, which is why it can be compared by identity in tests.
 *
 * Returns `null` when the runtime cannot construct a `CSSStyleSheet` (e.g. a DOM
 * shim without constructable stylesheets); activation then simply skips the
 * outline and the rest of the inspector still wires up.
 */
let inspectorOutlineSheet: CSSStyleSheet | null | undefined;

/**
 * Returns the singleton hover-outline `CSSStyleSheet`, constructing it lazily on
 * first call (returns `null` when constructable stylesheets are unavailable).
 *
 * Exported for the unit tier so a test can assert the active host's
 * `adoptedStyleSheets` contains exactly this instance — the deterministic signal
 * for the hover-outline contract (happy-dom cannot resolve the outline via
 * `getComputedStyle`; AM-015 / AM-020). Not part of the public package barrel.
 *
 * @internal
 */
export function getInspectorOutlineSheet(): CSSStyleSheet | null {
  if (inspectorOutlineSheet !== undefined) {
    return inspectorOutlineSheet;
  }
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(INSPECTOR_OUTLINE_CSS);
    inspectorOutlineSheet = sheet;
  } catch {
    inspectorOutlineSheet = null;
  }
  return inspectorOutlineSheet;
}

/**
 * Reads the inspector activation flag from `localStorage`.
 *
 * Returns `true` only when `localStorage['line-ui:inspector'] === 'on'`
 * (spec §6.D.2 / AM-021 — greenfield contract). Any access error (e.g. a
 * sandboxed context where `localStorage` throws) is swallowed and treated as
 * "off" so the no-op path is always safe in production.
 */
function isInspectorEnabled(): boolean {
  try {
    return globalThis.localStorage?.getItem(INSPECTOR_FLAG_KEY) === INSPECTOR_FLAG_ON;
  } catch {
    return false;
  }
}

/**
 * Inspector mixin (D2 — dev-mode element inspection).
 *
 * Greenfield implementation (spec §6.D.2 / AM-021). There is **no** prior
 * in-tree Inspector to preserve; the legacy `<ui-inspector>` custom element was
 * deleted in re-init `939cad2`. Activation is the single contract
 * `localStorage.getItem('line-ui:inspector') === 'on'`.
 *
 * When the flag is **unset**, the mixin is a zero-overhead no-op: it adds no
 * host attributes, no listeners, and no inspection behaviour (production path).
 *
 * When the flag is **set to `'on'`**, on connect the mixin:
 * - sets `data-line-inspect` on the host — the activation marker that also
 *   drives the dev-only hover outline (`:host(:hover[data-line-inspect])`) and
 *   signals that parts/slots are exposed for inspection;
 * - adopts a dev-only singleton `CSSStyleSheet` carrying that hover-outline rule
 *   into the shadow root's `adoptedStyleSheets` (APPENDED, never replacing the
 *   array — a component's own styles are preserved; ARCHITECTURE §14.6);
 * - surfaces the component version as `data-line-version` (read defensively
 *   from the host's static `version`, default `'0.0.0'` per §6.D.1);
 * - surfaces metadata members **defensively** — the docs URL as
 *   `data-line-docs` only when the Metadata mixin (D3) has provided one
 *   (D3 is still a stub; D2 ships independently per ORCHESTRATOR_DECISION);
 * - installs a `keydown` listener for **`Ctrl+Shift+L`** (`Cmd+Shift+L` on
 *   macOS — §10/Q5) that toggles a `<dialog>` metadata panel in the shadow
 *   root, listing the version and any present metadata fields.
 *
 * On disconnect the listener, dialog, and outline sheet are torn down so the
 * active path leaks nothing. The file path, export name, and generic signature
 * are stable so `vite-plugin-dts` emits a deterministic `.d.ts` (D1 constraint).
 *
 * @see docs/specs/00-spec-design-system.md §6.D.2
 */
export function InspectorMixin<T extends Constructor<LitElement>>(Base: T): T & Constructor<LitElement> {
  class InspectorElement extends Base {
    /** Active dialog panel while the inspector is enabled, else `null`. */
    #inspectorDialog: HTMLDialogElement | null = null;

    /** Bound keydown handler, retained so it can be removed on disconnect. */
    readonly #onInspectorKeydown = (event: KeyboardEvent): void => {
      // Ctrl+Shift+L (Windows/Linux) or Cmd+Shift+L (macOS) — §10/Q5.
      // `L` mnemonic for line://ui; avoids DevTools' Ctrl+Shift+I.
      if (!event.shiftKey || event.key.toLowerCase() !== 'l') {
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }
      event.preventDefault();
      this.#toggleInspectorPanel();
    };

    override connectedCallback(): void {
      super.connectedCallback();
      // No-op in production: nothing is wired unless the flag is 'on'.
      if (!isInspectorEnabled()) {
        return;
      }
      this.#activateInspector();
    }

    override disconnectedCallback(): void {
      this.#deactivateInspector();
      super.disconnectedCallback();
    }

    /**
     * Wire activation marker, host metadata attributes, the hotkey, and the
     * dev-only hover-outline stylesheet.
     */
    #activateInspector(): void {
      // Activation marker — also the hook for the `:host(:hover[...])` outline
      // and the signal that parts/slots are exposed for inspection.
      this.setAttribute('data-line-inspect', '');

      // Adopt the dev-only hover-outline sheet (spec §6.D.2). APPEND — never
      // replace — so a component's own `adoptedStyleSheets` are preserved
      // (ARCHITECTURE §14.6: the base/mixin must not clobber component styles).
      this.#adoptInspectorOutline();

      // Version: always available (LineElement.version static, §6.D.1).
      const version = this.#inspectorVersion();
      if (version) {
        this.setAttribute('data-line-version', version);
      }

      // Metadata: read defensively — D3 (Metadata mixin) is still a stub, so
      // `docs` may be absent. Render the attribute only when present.
      const docs = this.#inspectorDocs();
      if (docs) {
        this.setAttribute('data-line-docs', docs);
      }

      this.addEventListener('keydown', this.#onInspectorKeydown);
    }

    /**
     * Remove the hotkey, tear down the dialog, drop host attributes, and remove
     * the dev-only hover-outline sheet so the active path leaks nothing.
     */
    #deactivateInspector(): void {
      this.removeEventListener('keydown', this.#onInspectorKeydown);
      this.#inspectorDialog?.remove();
      this.#inspectorDialog = null;
      this.#releaseInspectorOutline();
      this.removeAttribute('data-line-inspect');
      this.removeAttribute('data-line-version');
      this.removeAttribute('data-line-docs');
    }

    /** The shadow root that carries `adoptedStyleSheets`, or `null`. */
    #inspectorRoot(): ShadowRoot | null {
      const root = (this.renderRoot ?? this.shadowRoot) as ShadowRoot | null;
      return root && 'adoptedStyleSheets' in root ? root : null;
    }

    /**
     * Append the singleton hover-outline sheet to the shadow root's
     * `adoptedStyleSheets` (idempotent — never duplicated, never replaces the
     * array). No-op when the sheet or root is unavailable.
     */
    #adoptInspectorOutline(): void {
      const sheet = getInspectorOutlineSheet();
      const root = this.#inspectorRoot();
      if (!(sheet && root)) {
        return;
      }
      if (root.adoptedStyleSheets.includes(sheet)) {
        return;
      }
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    }

    /**
     * Remove the singleton hover-outline sheet from the shadow root's
     * `adoptedStyleSheets`, preserving every other adopted sheet.
     */
    #releaseInspectorOutline(): void {
      const sheet = inspectorOutlineSheet;
      const root = this.#inspectorRoot();
      if (!(sheet && root)) {
        return;
      }
      if (!root.adoptedStyleSheets.includes(sheet)) {
        return;
      }
      root.adoptedStyleSheets = root.adoptedStyleSheets.filter((s) => s !== sheet);
    }

    /** Read the host's static `version`, defaulting to `''` when absent. */
    #inspectorVersion(): string {
      const ctor = this.constructor as { version?: unknown };
      return typeof ctor.version === 'string' ? ctor.version : '';
    }

    /** Read the host's static `docs` URL defensively (D3 may not provide one). */
    #inspectorDocs(): string {
      const ctor = this.constructor as { docs?: unknown };
      return typeof ctor.docs === 'string' ? ctor.docs : '';
    }

    /** Open the panel if closed, close it if already open. */
    #toggleInspectorPanel(): void {
      if (this.#inspectorDialog?.open) {
        this.#inspectorDialog.close();
        return;
      }
      this.#openInspectorPanel();
    }

    /** Build (once) and open the `<dialog>` metadata panel in the shadow root. */
    #openInspectorPanel(): void {
      const root = this.renderRoot ?? this.shadowRoot;
      if (!root) {
        return;
      }

      let dialog = this.#inspectorDialog;
      if (!dialog) {
        dialog = this.ownerDocument.createElement('dialog');
        dialog.setAttribute('part', 'inspector-panel');
        dialog.setAttribute('data-line-inspector-panel', '');
        this.#inspectorDialog = dialog;
        root.appendChild(dialog);
      }

      dialog.replaceChildren();
      const version = this.#inspectorVersion();
      if (version) {
        const row = this.ownerDocument.createElement('p');
        row.setAttribute('data-line-version', version);
        row.textContent = `version: ${version}`;
        dialog.appendChild(row);
      }
      const docs = this.#inspectorDocs();
      if (docs) {
        const link = this.ownerDocument.createElement('a');
        link.setAttribute('part', 'inspector-docs');
        link.href = docs;
        link.textContent = 'docs';
        dialog.appendChild(link);
      }

      // `showModal` is preferred but unsupported in some test DOMs; fall back
      // to the `open` attribute so behaviour stays assertable everywhere.
      if (typeof dialog.showModal === 'function') {
        try {
          dialog.showModal();
        } catch {
          dialog.open = true;
        }
      } else {
        dialog.open = true;
      }
    }
  }
  return InspectorElement;
}
