import { LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import { css, html, type PropertyDeclarations, type PropertyValues, type TemplateResult } from 'lit';

/**
 * `<line-portal>` shows its content in the browser top layer, above `overflow` clipping, transformed ancestors and
 * stacking contexts, while the content keeps its DOM position. Nothing moves: the content inherits theme, direction,
 * language and custom properties from where it sits, its events bubble through the host to its ancestors, a form
 * control in it still submits with its form, and Tab order and reading order follow the markup. Keep the Portal
 * next to its trigger in the markup.
 *
 * The box has no placement of its own beyond the logical start corner of the viewport, where an unplaced box covers
 * the page and takes its clicks. Place it through `::part(root):popover-open`, for example under its trigger with
 * CSS anchor positioning:
 *
 * ```css
 * .trigger {
 *   anchor-name: --menu;
 * }
 * line-portal.menu::part(root):popover-open {
 *   position-anchor: --menu;
 *   inset: auto;
 *   inset-block-start: anchor(end);
 *   inset-inline-start: anchor(start);
 * }
 * ```
 *
 * The content shows in place, clipped by its ancestors, until the module runs. To hide it before the upgrade, add
 * this rule to the page:
 *
 * ```css
 * line-portal:not(:defined) {
 *   display: none;
 * }
 * ```
 *
 * Set `disabled` to render the content in place, in the flow of the host's parent, without the top layer.
 *
 * Top-layer boxes stack in the order they were shown, so a modal dialog opened after the Portal connected paints
 * above it. Call `bringToFront()` after every `showModal()`. A Portal outside the open modal dialog then paints above
 * its backdrop, but its content stays inert. Nested portals are raised outer first, then inner.
 *
 * Do not put `aria-label` on the host, because it has no role a name could attach to.
 *
 * @summary Content that paints above the rest of the page while it stays in place in the DOM.
 *
 * @slot - The content shown in the top layer: any content.
 *
 * @csspart root - The top-layer box; place and size it through `::part(root):popover-open`.
 */
export class LinePortal extends LineElement {
  static override properties: PropertyDeclarations = {
    disabled: { type: Boolean, reflect: true },
  };

  // `display: contents` gives the host no box; `:host([hidden])` keeps `hidden` working over it (spec 0013-portal.md
  // D3). The reset and the start-corner placement reach the root only while it carries `popover`; without it, while
  // `disabled`, the root generates no box and its content lays out in place (D4; F4 (b)).
  static override styles = [
    commonReset,
    css`
      :host {
        display: contents;
      }

      :host([hidden]) {
        display: none;
      }

      [part='root'][popover] {
        position: fixed;
        inset: auto;
        inset-block-start: 0;
        inset-inline-start: 0;
        margin: 0;
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        overflow: visible;
        inline-size: auto;
        block-size: auto;
      }

      [part='root']:not([popover]) {
        display: contents;
      }
    `,
  ];

  /** Renders the content in place, in the flow of the host's parent, without the top layer. */
  declare disabled: boolean;

  constructor() {
    super();
    this.disabled = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // A reconnected host shows its box again: the UA hid it on disconnect (spec 0013-portal.md P5).
    this.requestUpdate();
  }

  override render(): TemplateResult {
    return this.disabled
      ? html`<div part="root"><slot></slot></div>`
      : html`<div part="root" popover="manual"><slot></slot></div>`;
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    const root = this.#showableRoot();
    if (root && !root.matches(':popover-open')) root.showPopover();
  }

  /**
   * Shows the box again so it paints above every top-layer box shown before the call, such as a modal dialog
   * opened after the Portal connected. Call it after every `showModal()`. It acts synchronously, and does nothing
   * before the first update, while an update that clears `disabled` is pending, while `disabled`, or while
   * disconnected; the pending update shows the box in the first two cases. It raises only this Portal's box: raise
   * nested portals outer first, then inner, and after clearing an outer `disabled`, `await outer.updateComplete`
   * before raising the inner one.
   */
  bringToFront(): void {
    const root = this.#showableRoot();
    if (!root) return;
    if (root.matches(':popover-open')) root.hidePopover();
    root.showPopover();
  }

  /**
   * The root, when the Popover API exists and the host is connected, not `disabled`, and the rendered root carries
   * `popover` (spec 0013-portal.md D7).
   */
  #showableRoot(): HTMLElement | null {
    if (!this.isConnected || this.disabled) return null;
    const root = this.renderRoot.querySelector<HTMLElement>('[part="root"]');
    if (!root?.hasAttribute('popover')) return null;
    if (typeof root.showPopover !== 'function' || typeof root.hidePopover !== 'function') return null;
    return root;
  }
}

customElements.define('line-portal', LinePortal);

declare global {
  interface HTMLElementTagNameMap {
    'line-portal': LinePortal;
  }
}
