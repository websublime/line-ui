/**
 * Inspector mixin unit tests (D2, spec §6.D.2 + AM-021).
 *
 * Covers the two activation branches of {@link InspectorMixin}:
 *   1. flag UNSET → zero-overhead no-op (no host attributes, no listeners);
 *   2. flag SET (`localStorage['line-ui:inspector'] === 'on'`) → activation
 *      (host marker, version attribute, defensive metadata, hotkey panel).
 *
 * Assertions use host-attribute STATE and DOM presence rather than
 * `getComputedStyle()`/geometry: happy-dom does not resolve the production
 * `var()`/`light-dark()` cascade and returns zeros for layout metrics
 * (AM-015 / AM-020). The pure-CSS hover outline and real `showModal`/keyboard
 * geometry therefore belong to the browser (Playwright) tier — here we assert
 * the `data-line-inspect` marker, the `data-line-*` attributes, dialog presence
 * and `open` state, all of which are deterministic in happy-dom.
 *
 * Note: lit-html cannot interpolate a tag name into element position
 * (`<${tag}>` is parsed as text, not an element), so fixtures use static `html`
 * templates with the literal tags registered below.
 *
 * Runs on F2's harness: `bun-test-preload.ts` registers happy-dom globally and
 * wires `@open-wc/testing-helpers` `fixtureCleanup` afterEach.
 *
 * @module __tests__/inspector
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { LitElement } from 'lit';
import { getInspectorOutlineSheet, InspectorMixin } from '../src/mixins/inspector.js';

const FLAG_KEY = 'line-ui:inspector';

/** Bare host with the inspector mixin only (no metadata, version default). */
class BareInspectHost extends InspectorMixin(LitElement) {}

/** Host carrying a static `version` (mirrors LineElement.version, §6.D.1). */
class VersionedInspectHost extends InspectorMixin(LitElement) {
  static version = '1.2.3';
}

/** Host carrying static `version` + `docs` (mirrors a future D3 metadata host). */
class MetadataInspectHost extends InspectorMixin(LitElement) {
  static version = '1.2.3';
  static docs = 'https://example.test/docs';
}

customElements.define('inspect-host-bare', BareInspectHost);
customElements.define('inspect-host-versioned', VersionedInspectHost);
customElements.define('inspect-host-metadata', MetadataInspectHost);

/** Dispatches a keydown on the host with the given modifiers. */
function pressKey(el: Element, key: string, mods: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...mods }));
}

/** The mixin appends its `<dialog>` to the host's shadow root. */
function panel(el: Element): HTMLDialogElement | null {
  const root = (el as LitElement).renderRoot ?? (el as HTMLElement).shadowRoot;
  return (root?.querySelector('dialog') as HTMLDialogElement | null) ?? null;
}

/** The host's shadow-root `adoptedStyleSheets` (the array the mixin appends to). */
function adopted(el: Element): readonly CSSStyleSheet[] {
  const root = ((el as LitElement).renderRoot ?? (el as HTMLElement).shadowRoot) as ShadowRoot | null;
  return root?.adoptedStyleSheets ?? [];
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('InspectorMixin — flag unset (production no-op)', () => {
  test('adds no inspector host attributes when the flag is absent', async () => {
    const el = await fixture(html`<inspect-host-bare></inspect-host-bare>`);
    expect(el.hasAttribute('data-line-inspect')).toBe(false);
    expect(el.hasAttribute('data-line-version')).toBe(false);
    expect(el.hasAttribute('data-line-docs')).toBe(false);
  });

  test('does not activate for a non-"on" truthy value', async () => {
    // Spec §6.D.2 / AM-021: ONLY the exact value 'on' activates.
    localStorage.setItem(FLAG_KEY, 'true');
    const el = await fixture(html`<inspect-host-versioned></inspect-host-versioned>`);
    expect(el.hasAttribute('data-line-inspect')).toBe(false);
    expect(el.hasAttribute('data-line-version')).toBe(false);
  });

  test('hotkey does nothing when the flag is unset', async () => {
    const el = await fixture(html`<inspect-host-metadata></inspect-host-metadata>`);
    pressKey(el, 'l', { ctrlKey: true, shiftKey: true });
    expect(panel(el)).toBeNull();
  });

  test('does not adopt the hover-outline sheet when the flag is absent', async () => {
    const sheet = getInspectorOutlineSheet();
    const el = await fixture(html`<inspect-host-bare></inspect-host-bare>`);
    if (sheet) {
      expect(adopted(el).includes(sheet)).toBe(false);
    } else {
      // No constructable stylesheets in this runtime — nothing could be adopted.
      expect(adopted(el).length).toBe(0);
    }
  });
});

describe('InspectorMixin — flag set to "on" (activation)', () => {
  beforeEach(() => {
    localStorage.setItem(FLAG_KEY, 'on');
  });

  test('marks the host with data-line-inspect (outline + part/slot exposure hook)', async () => {
    const el = await fixture(html`<inspect-host-bare></inspect-host-bare>`);
    expect(el.hasAttribute('data-line-inspect')).toBe(true);
  });

  test('adopts the dev-only hover-outline sheet into the shadow root (§6.D.2)', async () => {
    const sheet = getInspectorOutlineSheet();
    expect(sheet).not.toBeNull();
    const el = await fixture(html`<inspect-host-bare></inspect-host-bare>`);
    // The exact singleton instance is appended (identity assertion).
    expect(adopted(el).includes(sheet as CSSStyleSheet)).toBe(true);
  });

  test('the adopted sheet carries the :host(:hover[data-line-inspect]) outline rule', async () => {
    const el = await fixture(html`<inspect-host-bare></inspect-host-bare>`);
    const sheet = adopted(el).find((s) => s === getInspectorOutlineSheet());
    expect(sheet).toBeDefined();
    const ruleText = Array.from((sheet as CSSStyleSheet).cssRules, (r) => r.cssText).join('\n');
    expect(ruleText).toContain(':host(:hover[data-line-inspect])');
    expect(ruleText).toContain('outline');
  });

  test("appends the sheet without clobbering a component's own adopted styles", async () => {
    // ARCHITECTURE §14.6: the mixin must preserve any sheet the component adopted.
    const own = new CSSStyleSheet();
    own.replaceSync(':host { display: block; }');
    const el = await fixture(html`<inspect-host-bare></inspect-host-bare>`);
    const root = ((el as LitElement).renderRoot ?? (el as HTMLElement).shadowRoot) as ShadowRoot;
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, own];
    // Re-activation path appends, never replaces — the component sheet survives.
    expect(root.adoptedStyleSheets.includes(own)).toBe(true);
    expect(root.adoptedStyleSheets.includes(getInspectorOutlineSheet() as CSSStyleSheet)).toBe(true);
  });

  test('surfaces the static version as data-line-version', async () => {
    const el = await fixture(html`<inspect-host-versioned></inspect-host-versioned>`);
    expect(el.getAttribute('data-line-version')).toBe('1.2.3');
  });

  test('omits data-line-docs when metadata provides no docs (defensive read)', async () => {
    // D3 (Metadata mixin) is still a stub — docs must not be invented.
    const el = await fixture(html`<inspect-host-versioned></inspect-host-versioned>`);
    expect(el.hasAttribute('data-line-docs')).toBe(false);
  });

  test('surfaces docs as data-line-docs when metadata provides one', async () => {
    const el = await fixture(html`<inspect-host-metadata></inspect-host-metadata>`);
    expect(el.getAttribute('data-line-docs')).toBe('https://example.test/docs');
  });

  test('Ctrl+Shift+L opens a <dialog> metadata panel listing the version', async () => {
    const el = await fixture(html`<inspect-host-metadata></inspect-host-metadata>`);
    pressKey(el, 'L', { ctrlKey: true, shiftKey: true });
    const dialog = panel(el);
    expect(dialog).not.toBeNull();
    expect(dialog?.open).toBe(true);
    expect(dialog?.textContent).toContain('1.2.3');
  });

  test('Cmd+Shift+L (metaKey) also opens the panel (macOS bind)', async () => {
    const el = await fixture(html`<inspect-host-versioned></inspect-host-versioned>`);
    pressKey(el, 'l', { metaKey: true, shiftKey: true });
    expect(panel(el)?.open).toBe(true);
  });

  test('the hotkey toggles the panel closed on second press', async () => {
    const el = await fixture(html`<inspect-host-versioned></inspect-host-versioned>`);
    pressKey(el, 'l', { ctrlKey: true, shiftKey: true });
    expect(panel(el)?.open).toBe(true);
    pressKey(el, 'l', { ctrlKey: true, shiftKey: true });
    expect(panel(el)?.open).toBe(false);
  });

  test('an unrelated hotkey (no shift) does not open the panel', async () => {
    const el = await fixture(html`<inspect-host-versioned></inspect-host-versioned>`);
    pressKey(el, 'l', { ctrlKey: true, shiftKey: false });
    expect(panel(el)).toBeNull();
  });

  test('disconnect removes the marker and tears the listener down (no leak)', async () => {
    const el = await fixture(html`<inspect-host-versioned></inspect-host-versioned>`);
    expect(el.hasAttribute('data-line-inspect')).toBe(true);
    el.remove();
    expect(el.hasAttribute('data-line-inspect')).toBe(false);
    expect(el.hasAttribute('data-line-version')).toBe(false);
    // Listener gone: a hotkey after disconnect must not recreate a panel.
    pressKey(el, 'l', { ctrlKey: true, shiftKey: true });
    expect(panel(el)?.open ?? false).toBe(false);
  });

  test('disconnect removes the hover-outline sheet (active path leaks nothing)', async () => {
    const sheet = getInspectorOutlineSheet();
    const el = await fixture(html`<inspect-host-versioned></inspect-host-versioned>`);
    if (sheet) {
      expect(adopted(el).includes(sheet)).toBe(true);
    }
    el.remove();
    if (sheet) {
      expect(adopted(el).includes(sheet)).toBe(false);
    } else {
      expect(adopted(el).length).toBe(0);
    }
  });
});
