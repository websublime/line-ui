/**
|--------------------------------------------------------------------------
| Copyright Websublime All Rights Reserved.
|--------------------------------------------------------------------------
|
| Use of this source code is governed by an MIT-style license that can be
| found in the LICENSE file at https://websublime.dev/license
|
*/

import type { ReactiveElement } from 'lit';

export interface WebComponentOptions {
  // eslint-disable-next-line no-use-before-define
  [key: string]: unknown;
}

export interface LineMixinInterface {
  inspect: boolean;
  isLTR: boolean;
  dir: 'ltr' | 'rtl';
}

export interface ComponentMetadata {
  description: string;
  link: string;
  name: string;
  qa: string;
  scope: string;
  version: string;
}

export type ControllerHost = ReactiveElement & { inspect: boolean; registry: ComponentMetadata };
