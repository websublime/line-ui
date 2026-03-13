/**
|--------------------------------------------------------------------------
| Copyright Websublime All Rights Reserved.
|--------------------------------------------------------------------------
|
| Use of this source code is governed by an MIT-style license that can be
| found in the LICENSE file at https://websublime.dev/license
|
*/

import type { WebComponentOptions } from '../types/component';
import type { Constructor } from '../types/general';

import { LineElement } from './web-component';

export class LineHtmxElement extends LineElement<WebComponentOptions> {}

/**
 * Register a custom element Lit class component. This function will
 * also add the component options to the prototype.
 *
 * @public
 */
export function defineHtmxComponent<HtmxComponent extends LineElement>(
  name: string,
  component: Constructor<HtmxComponent>,
  options: WebComponentOptions = {}
): Constructor<HtmxComponent> {
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
