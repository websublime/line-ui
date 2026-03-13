/**
|--------------------------------------------------------------------------
| Copyright Websublime All Rights Reserved.
|--------------------------------------------------------------------------
|
| Use of this source code is governed by an MIT-style license that can be
| found in the LICENSE file at https://websublime.dev/license
|
*/

import type { ReactiveController } from 'lit';

import type { ControllerHost } from '../../types/component';
import { storage } from '../storage';

/**
 * Inspector controller can give information about the component
 * metadata. It will also highlight the component when the mouse is over it.
 * A local storage variable (line-inspector property key) is used to enable/disable the inspector.
 * The inspector will be enabled by default when the component
 * is created if the local storage variable is set or when
 * property inspect is present in the component.
 *
 * @example
 * ```html
 * <card-component inspect></card-component>
 * ```
 *
 * @public
 */
export class InspectController implements ReactiveController {
  private host: ControllerHost;

  constructor(host: ControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    // eslint-disable-next-line unicorn/no-useless-undefined
    const enabled = storage.local.get('line-inspector', undefined);

    if (enabled && !this.host.inspect) {
      this.host.inspect = true;
      this.create();
    }
  }

  hostDisconnected() {}

  hostUpdated() {}

  hostRequestUpdate() {}

  hostUpdate() {}

  create() {
    const shellElement = Object.assign(document.createElement('ui-inspector'), {
      host: this.host
    });

    this.host.shadowRoot?.append(shellElement);
  }
}
