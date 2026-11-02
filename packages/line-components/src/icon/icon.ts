import { INTERNALS, LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import { css, nothing, type PropertyDeclarations, type PropertyValues } from 'lit';
import {
  ICON_REGISTRY_CHANGE,
  iconRegistrySlot,
  type LineIconRegistry,
  setIconRegistry,
} from '../shared/icon-registry.js';
import { injectSvg, SVG_NS } from './svg-injection.js';

/** The properties that pick the glyph; a change to any of them resolves again. */
const SOURCE_PROPERTIES = ['path', 'src', 'name', 'library', 'weight'] as const;

/** The host attributes that name the icon and switch it from decorative to `img`. */
const NAME_ATTRIBUTES = ['aria-label', 'aria-labelledby'];

const filled = (value: string | undefined): value is string => typeof value === 'string' && value !== '';

/** The glyph for `path`: path data in a 24 × 24 box, filled with the text colour. */
function pathGlyph(d: string): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('part', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  const shape = document.createElementNS(SVG_NS, 'path');
  shape.setAttribute('d', d);
  svg.append(shape);
  return svg;
}

/** The text of `src`, resolved against `document.baseURI`; rejects on any failure. */
async function fetchSvg(src: string): Promise<string> {
  const response = await fetch(new URL(src, document.baseURI));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

/**
 * `<line-icon>` draws one glyph at the size and in the colour of the surrounding text. `name` and `library`
 * ask the registry set with `setIconRegistry()` or `LineIcon.registry`, `src` loads an SVG file, and the
 * `path` property draws path data in a 24 × 24 box; the first non-empty source of `path`, `src`, then `name`
 * with `library` wins. Every SVG string passes the Trusted Types policy `line-icon`, `DOMParser` and an
 * element and attribute allowlist. A missing source or any failed load leaves an empty box of the same size
 * and raises nothing.
 *
 * The icon is decorative and hidden from assistive technology. A host `aria-label` or `aria-labelledby`
 * makes it an `img` with that name. Both are `ElementInternals` defaults, so an author `role` or `aria-*`
 * attribute wins. Set `mirror` on a directional icon to flip it in right-to-left layouts.
 *
 * @summary A glyph from a registered icon set, an SVG file or SVG path data, sized and coloured by the text.
 *
 * @csspart svg - The root `<svg>` of a glyph built from a string, a file or `path`; absent while empty.
 *
 * @cssprop [--line-icon-size=1em] - Inline and block size of the icon; set it on the icon or on any ancestor.
 */
export class LineIcon extends LineElement {
  static override properties: PropertyDeclarations = {
    name: { reflect: true },
    library: { reflect: true },
    weight: { reflect: true },
    mirror: { type: Boolean, reflect: true, useDefault: true },
    src: { reflect: true },
    path: { attribute: false },
  };

  // `flex-shrink: 0` keeps the box in a flex row, because a percentage-sized `<svg>` gives the host no min-content size.
  static override styles = [
    commonReset,
    css`
      :host {
        display: inline-block;
        flex-shrink: 0;
        inline-size: var(--line-icon-size, 1em);
        block-size: var(--line-icon-size, 1em);
      }

      :host([hidden]) {
        display: none;
      }

      :host > svg {
        inline-size: 100%;
        block-size: 100%;
      }

      :host([mirror]:dir(rtl)) > svg {
        scale: -1 1;
      }
    `,
  ];

  static override get observedAttributes(): string[] {
    // biome-ignore lint/complexity/noThisInStatic: `super` runs Lit's getter for LineIcon; `LineElement.observedAttributes` lists LineElement's attributes only.
    return [...super.observedAttributes, ...NAME_ATTRIBUTES];
  }

  /**
   * The registry every `<line-icon>` copy resolves `name` and `library` through; the same slot as
   * `setIconRegistry()`. Setting it makes every connected icon resolve again.
   */
  static get registry(): LineIconRegistry | undefined {
    return iconRegistrySlot().registry;
  }

  static set registry(registry: LineIconRegistry | undefined) {
    setIconRegistry(registry);
  }

  /** The icon name in the set that `library` names; resolves only with a non-empty `library`. */
  declare name: string | undefined;
  /** The key the consumer registered a resolver under; there is no default set. */
  declare library: string | undefined;
  /** Passed to the registry as `options.weight` when non-empty, such as a Phosphor `fill`. */
  declare weight: string | undefined;
  /** Flips the glyph horizontally when the icon is in a right-to-left context. */
  declare mirror: boolean;
  /** URL of an SVG file, resolved against `document.baseURI`. */
  declare src: string | undefined;
  /**
   * SVG path data drawn in a `0 0 24 24` view box and filled with the text colour; property only. It wins
   * over `src` and `name`.
   */
  declare path: string | undefined;

  /** The glyph on screen; `undefined` in the empty state. */
  #glyph: SVGElement | undefined;
  /** The number of the newest resolution; an older result is dropped. */
  #request = 0;
  /** The registry events this icon listens to while connected. */
  #events: EventTarget | undefined;

  readonly #onRegistryChange = (): void => {
    if (this.#usesRegistry()) {
      this.#resolve();
    }
  };

  constructor() {
    super();
    this.mirror = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#events = iconRegistrySlot().events;
    this.#events.addEventListener(ICON_REGISTRY_CHANGE, this.#onRegistryChange);
    // A disconnected icon missed every registry change, so a reconnect resolves a registry source again.
    if (this.hasUpdated && this.#usesRegistry()) {
      this.#resolve();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#events?.removeEventListener(ICON_REGISTRY_CHANGE, this.#onRegistryChange);
    this.#events = undefined;
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    if (NAME_ATTRIBUTES.includes(name)) {
      this.#writeSemantics();
    }
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (!this.hasUpdated) {
      this.#writeSemantics();
    }
    if (!this.hasUpdated || SOURCE_PROPERTIES.some((property) => changed.has(property))) {
      this.#resolve();
    }
  }

  protected override render(): unknown {
    return this.#glyph ?? nothing;
  }

  /** Decorative with no name; `img` with a non-blank `aria-label` or a non-empty `aria-labelledby`. */
  #writeSemantics(): void {
    const named = Boolean(this.getAttribute('aria-label')?.trim() || this.getAttribute('aria-labelledby'));
    const internals = this[INTERNALS];
    internals.role = named ? 'img' : null;
    internals.ariaHidden = named ? null : 'true';
  }

  #usesRegistry(): boolean {
    return !(filled(this.path) || filled(this.src)) && filled(this.name) && filled(this.library);
  }

  /** Starts a resolution of the current source. `path` and no source apply at once; the others settle later. */
  #resolve(): void {
    const request = ++this.#request;
    if (filled(this.path)) {
      this.#show(request, pathGlyph(this.path));
    } else if (filled(this.src)) {
      void this.#settle(request, fetchSvg(this.src));
    } else if (filled(this.name) && filled(this.library)) {
      void this.#settle(request, this.#askRegistry(this.library, this.name, this.weight));
    } else {
      this.#show(request, undefined);
    }
  }

  async #askRegistry(library: string, name: string, weight: string | undefined): Promise<string | SVGElement> {
    const registry = iconRegistrySlot().registry;
    if (typeof registry?.resolve !== 'function') {
      throw new Error('no registry');
    }
    // No `options` without a weight, so the resolver keeps its own default.
    return filled(weight) ? registry.resolve(library, name, { weight }) : registry.resolve(library, name);
  }

  /** Shows what `pending` yields if `request` is still the newest; any failure is the empty state. */
  async #settle(request: number, pending: Promise<unknown>): Promise<void> {
    let glyph: SVGElement | undefined;
    try {
      const result = await pending;
      if (typeof result === 'string') {
        glyph = injectSvg(result);
      } else if (result instanceof SVGElement) {
        glyph = result;
      }
    } catch {
      glyph = undefined;
    }
    this.#show(request, glyph);
  }

  #show(request: number, glyph: SVGElement | undefined): void {
    if (request !== this.#request || glyph === this.#glyph) {
      return;
    }
    this.#glyph = glyph;
    this.requestUpdate();
  }
}

customElements.define('line-icon', LineIcon);

declare global {
  interface HTMLElementTagNameMap {
    'line-icon': LineIcon;
  }
}
