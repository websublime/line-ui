import { INTERNALS, LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import { type ComplexAttributeConverter, css, type PropertyDeclarations } from 'lit';
import type { SeparatorOrientation } from './separator.types.js';

/** An unknown `orientation` behaves as `horizontal`; the attribute keeps what the author wrote (C8). */
const orientationConverter: ComplexAttributeConverter<SeparatorOrientation> = {
  fromAttribute: (value) => (value === 'vertical' ? 'vertical' : 'horizontal'),
};

/**
 * `<line-separator>` draws a thin line between sections of content. The host
 * is the line and the shadow root renders nothing. The host carries the
 * `separator` role and its orientation as `ElementInternals` defaults, so an
 * author `role` or `aria-*` attribute wins, and a host `aria-label` names it.
 * `decorative` sets the role to `none`, so assistive technology skips the
 * line; give a decorative separator no `aria-label`. It adds no spacing.
 *
 * @summary A thin horizontal or vertical line that separates sections of content.
 *
 * @cssprop [--line-separator-color=var(--line-gray-6, currentColor)] - Colour of the line.
 * @cssprop [--line-separator-thickness=var(--line-border-1, 1px)] - Thickness of the line.
 */
export class LineSeparator extends LineElement {
  static override properties: PropertyDeclarations = {
    orientation: { reflect: true, useDefault: true, converter: orientationConverter },
    decorative: { type: Boolean, reflect: true, useDefault: true },
  };

  // The line is one border side set through longhands: forced-colors mode keeps a border colour visible,
  // and an invalid var() in a shorthand would reset border-style to none (spec 0011-separator.md Drawing).
  static override styles = [
    commonReset,
    css`
      :host {
        --line-separator-color: var(--line-gray-6, currentColor);
        --line-separator-thickness: var(--line-border-1, 1px);

        display: block;
        align-self: stretch;
        flex-shrink: 0;
        border-block-start-style: solid;
        border-block-start-width: var(--line-separator-thickness);
        border-block-start-color: var(--line-separator-color);
      }

      :host([hidden]) {
        display: none;
      }

      :host([orientation='vertical']) {
        inline-size: 0;
        min-block-size: 1em;
        border-block-start-style: none;
        border-block-start-width: 0;
        border-inline-start-style: solid;
        border-inline-start-width: var(--line-separator-thickness);
        border-inline-start-color: var(--line-separator-color);
      }
    `,
  ];

  /** Direction of the line; an unknown value behaves as `horizontal`. */
  declare orientation: SeparatorOrientation;
  /** Removes the separator from the accessibility tree (role `none`); the line still draws. */
  declare decorative: boolean;

  constructor() {
    super();
    // `useDefault` keeps these initial values out of the attributes, so an unknown author value stays (C8).
    this.orientation = 'horizontal';
    this.decorative = false;
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    super.willUpdate(changed);
    // Lit leaves `useDefault` initial values out of the first `changed` map, so the first update always writes.
    if (this.hasUpdated && !changed.has('orientation') && !changed.has('decorative')) {
      return;
    }
    const internals = this[INTERNALS];
    internals.role = this.decorative ? 'none' : 'separator';
    internals.ariaOrientation = !this.decorative && this.orientation === 'vertical' ? 'vertical' : null;
  }
}

customElements.define('line-separator', LineSeparator);

declare global {
  interface HTMLElementTagNameMap {
    'line-separator': LineSeparator;
  }
}
