/**
 * One `line-core` module graph under `bun test` from a dependent package (C23, spec §6.C.2, AM-050).
 *
 * `LineElement` and `INTERNALS` come from `@websublime/line-core` and `FormAssociated` from
 * `@websublime/line-core/mixins/form-associated`, both through the declared dependency (spec §7.8 rule 1),
 * so this file needs `bun run build` first, as the CI unit tier has. The subpath must hand back the root's
 * function, and an element built from both must reach its internals through the root's Symbol.
 *
 * @module __tests__/form-associated-graph
 */

import { describe, expect, test } from 'bun:test';
import { INTERNALS, LineElement, FormAssociated as rootFormAssociated } from '@websublime/line-core';
import { FormAssociated } from '@websublime/line-core/mixins/form-associated';

class LineGraphComponentsHost extends FormAssociated(LineElement) {}
customElements.define('line-test-graph-components', LineGraphComponentsHost);

describe('line-core module graph from line-components', () => {
  test('the subpath FormAssociated is the root function', () => {
    expect(FormAssociated).toBe(rootFormAssociated);
  });

  test('a FormAssociated(LineElement) instance reaches its internals through INTERNALS', () => {
    const el = document.createElement('line-test-graph-components') as LineGraphComponentsHost;
    const internals = Reflect.get(el, INTERNALS) as { host?: HTMLElement } | undefined;
    expect(internals?.host).toBe(el);
    expect(el.checkValidity()).toBe(true);
  });
});
