/**
|--------------------------------------------------------------------------
| Copyright Websublime All Rights Reserved.
|--------------------------------------------------------------------------
|
| Use of this source code is governed by an MIT-style license that can be
| found in the LICENSE file at https://websublime.dev/license
|
*/

import type { PropertyValues, ReactiveElement } from 'lit';

import type { LineMixinInterface } from '../types/component';
import type { Constructor } from '../types/general';
import { property } from '../utilities/decorators';

export function LineMixin<T extends Constructor<ReactiveElement>>(superClass: T): T & Constructor<LineMixinInterface> {
  class SuperElement extends superClass {
    /**
     * @public
     */
    @property({ reflect: true })
    public override dir: 'ltr' | 'rtl' = 'ltr';

    /**
     * @public
     */
    @property({ reflect: true, type: Boolean })
    public inspect = false;

    /**
     * @public
     */
    public get isLTR(): boolean {
      return this.dir === 'ltr';
    }

    /**
     * @internal
     * @readonly
     */
    public override connectedCallback(): void {
      super.connectedCallback();
    }

    /**
     * @internal
     * @readonly
     */
    public override disconnectedCallback(): void {
      super.disconnectedCallback();
    }

    /**
     * @internal
     * @readonly
     */
    public override updated(changedProperties: PropertyValues) {
      super.updated?.(changedProperties);
    }
  }

  return SuperElement as Constructor<SuperElement> & T;
}
