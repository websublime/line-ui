/**
|--------------------------------------------------------------------------
| Copyright Websublime All Rights Reserved.
|--------------------------------------------------------------------------
|
| Use of this source code is governed by an MIT-style license that can be
| found in the LICENSE file at https://websublime.dev/license
|
*/

import { LitElement, type ReactiveElement } from 'lit';

import type { ComponentMetadata, WebComponentOptions } from '../types/component';
import type { Constructor } from '../types/general';
import { property } from '../utilities/decorators';

import { LineMixin } from './component';
import { InspectController } from './controllers/inspect-controller';

const id = Symbol.for('LINE');

/**
 * Extend your components from this. Will have QA tag and metadata
 * for the inspector.
 *
 * @public
 */
export class LineElement<Options = WebComponentOptions> extends LineMixin<Constructor<ReactiveElement>>(LitElement) {
  readonly componentOptions!: Options;
  declare inspect: boolean;

  private webComponentId = id;

  protected inspector = new InspectController(this);

  protected _options!: Options;

  set options(options: Options) {
    const oldValue = {
      ...this.componentOptions,
      ...this._options
    };

    this._options = {
      ...this.componentOptions,
      ...options
    };

    this.requestUpdate('options', oldValue);
  }

  get isLine() {
    return this.webComponentId === id;
  }

  /**
   * @public
   */
  @property({ type: Object })
  get options() {
    return this._options ?? this.componentOptions;
  }

  /**
   * @public
   */
  public registry: ComponentMetadata;

  constructor(registry: ComponentMetadata) {
    super();

    this.registry = Object.freeze(registry);
    this.dataset.qa = registry.qa;
  }
}

/**
 * Register a custom element Lit class component. This function will
 * also add the component options to the prototype.
 *
 * @public
 */
export function defineWebComponent<WebComponent extends LineElement>(
  name: string,
  component: Constructor<WebComponent>,
  options: WebComponentOptions = {}
): Constructor<WebComponent> {
  Object.defineProperty(component.prototype, 'componentOptions', {
    enumerable: true,
    value: options,
    writable: true
  });

  if (!window.customElements.get(name)) {
    window.customElements.define(name, component);
  }

  return component;
}
