/**
|--------------------------------------------------------------------------
| Copyright Websublime All Rights Reserved.
|--------------------------------------------------------------------------
|
| Use of this source code is governed by an MIT-style license that can be
| found in the LICENSE file at https://websublime.dev/license
|
*/

import { isStringified } from '../utilities/helpers';

/**
 * Wrapper api for local and session storage.
 *
 * @public
 */
function wrapStorage(storage: Storage) {
  const api = {
    clear: storage.clear.bind(storage),
    // eslint-disable-next-line unicorn/no-useless-undefined
    get<T = unknown>(key: string, defaults: unknown = undefined): T {
      const item = storage.getItem(key);
      return (item ? (isStringified(item) ? JSON.parse(item) : item) : defaults) as T;
    },
    getAll() {
      // eslint-disable-next-line unicorn/no-useless-undefined
      return Object.fromEntries(this.keys().map((key) => [key, this.get(key as string, undefined)]));
    },
    has(key: string) {
      return Boolean(storage.getItem(key));
    },
    key: storage.key.bind(storage),
    keys() {
      return Array.from({ length: this.size }, (_, index) => storage.key(index));
    },
    remove: storage.removeItem.bind(storage),
    set(key: string, value: unknown, stringify = true) {
      storage.setItem(key, stringify ? JSON.stringify(value) : (value as string));
    },
    get size() {
      return storage.length;
    }
  };

  return api;
}

/**
 * Wrapper api for local and session storage.
 *
 * @public
 */
const storage = {
  local: wrapStorage(localStorage),
  session: wrapStorage(sessionStorage)
};

export { storage };
