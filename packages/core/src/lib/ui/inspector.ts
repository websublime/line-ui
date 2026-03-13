/**
|--------------------------------------------------------------------------
| Copyright Websublime All Rights Reserved.
|--------------------------------------------------------------------------
|
| Use of this source code is governed by an MIT-style license that can be
| found in the LICENSE file at https://websublime.dev/license
|
*/

import { css, html, LitElement, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { LineElement } from '../web-component';

@customElement('ui-inspector')
export class UiInspector extends LitElement {
  static override styles = css`
    .vita-inspector-container {
      display: flex;
      justify-content: center;
      white-space: nowrap;
      width: -moz-fit-content;
      width: fit-content;
      padding: 2px;
      position: absolute;
      gap: 4px;
    }

    .vita-inspector-info:before {
      background: linear-gradient(to left top, #ff6995, #3ecdff);
      border-radius: inherit;
      content: '';
      inset: 0;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      padding: 2px;
      position: absolute;
      z-index: -1;
    }

    .vita-pkg-scope {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }

    .vita-pkg-version {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }

    .vita-pkg-scope,
    .vita-pkg-scope > a,
    .vita-pkg-version {
      background: #bd40f2;
      padding: 2px 4px;
      font-weight: 400;
      font-size: 10px;
      color: white;
    }
  `;

  isInspecting = false;

  hasInspectorVisible = false;

  host!: LineElement;

  set isHoverInspector(value: boolean) {
    this.isInspecting = value;
    this.hasInspectorVisible = value;
  }

  get isHoverInspector() {
    return this.isInspecting;
  }

  private listeners: Array<Array<string | ((event: MouseEvent) => unknown)>> = [];

  override createRenderRoot() {
    const root = super.createRenderRoot();

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const inspectMouseOver = (event: MouseEvent) => {
      event.preventDefault();

      this.hasInspectorVisible = true;
      this.requestUpdate();
    };

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const inspectMouseOut = (event: MouseEvent) => {
      event.preventDefault();

      const timeout = setTimeout(() => {
        this.hasInspectorVisible = false;
        this.requestUpdate();
        clearTimeout(timeout);
      }, 50);
    };

    this.host.addEventListener('mouseover', inspectMouseOver, false);
    this.host.addEventListener('mouseout', inspectMouseOut, false);

    this.listeners.push(['mouseover', inspectMouseOver], ['mouseout', inspectMouseOut]);

    return root;
  }

  hostDisconnected() {
    for (const listener of this.listeners) {
      const [type, listenerFunction] = listener as [string, (event: Event) => unknown];

      if (type && listenerFunction) {
        this.host.removeEventListener(type, listenerFunction);
      }
    }
  }

  private renderInspectorMarkup() {
    const rect = this.host.getBoundingClientRect();
    const { offsetHeight, offsetLeft, offsetTop, offsetWidth, registry } = this.host;
    const boundary = rect.top <= offsetHeight ? offsetHeight - 9 : -9;

    const { link, scope, version } = registry;

    return html`
      <style>
        .vita-inspector-info {
          position: absolute;
          border-radius: 11px;
          box-sizing: border-box;
          padding: 4px;
          pointer-events: none;
          top: ${offsetTop - 2}px;
          left: ${offsetLeft - 4}px;
          width: ${offsetWidth + 8}px;
          height: ${offsetHeight + 4}px;
        }

        .vita-inspector-container {
          top: ${boundary}px;
          pointer-events: all;
        }
      </style>
      <div class="vita-inspector-info">
        <div
          class="vita-inspector-container"
          @mouseenter="${() => (this.isHoverInspector = true)}"
          @mouseleave="${() => (this.isHoverInspector = false)}"
        >
          <div class="vita-pkg-scope">
            <a href="${link}" target="_blank" rel="noopener noreferrer">${scope}</a>
          </div>
          <div class="vita-pkg-version">${version}</div>
        </div>
      </div>
    `;
  }

  override render() {
    return this.hasInspectorVisible ? this.renderInspectorMarkup() : nothing;
  }
}
