/**
 * `FormAssociated` identity across the root and `./mixins/form-associated` on the built output
 * (C23, spec §6.C.2, AM-050).
 *
 * Both specifiers resolve by self-reference through the package's own `exports` (spec §7.8 rule 2), so
 * this file needs `bun run build` first, as the CI unit tier has. The subpath must re-export the root
 * through a bare `@websublime/line-core` import, never a copy, so one `INTERNALS` Symbol serves both.
 *
 * @module __tests__/form-associated-identity
 */

import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { INTERNALS, LineElement, FormAssociated as rootFormAssociated } from '@websublime/line-core';
import { FormAssociated } from '@websublime/line-core/mixins/form-associated';

/** Resolved path of a self-referenced specifier, or `null` when Bun cannot resolve it (rule 2). */
function resolveOnDisk(specifier: string): string | null {
  try {
    const path = fileURLToPath(import.meta.resolve(specifier));
    return existsSync(path) ? path : null;
  } catch {
    return null;
  }
}

class LineGraphCoreHost extends FormAssociated(LineElement) {}
customElements.define('line-test-graph-core', LineGraphCoreHost);

describe('FormAssociated on the built output', () => {
  test('the root and the subpath export the same function', () => {
    expect(FormAssociated).toBe(rootFormAssociated);
  });

  test('dist/mixins/form-associated.js re-exports the bare root specifier', () => {
    const path = resolveOnDisk('@websublime/line-core/mixins/form-associated');
    expect(path).not.toBeNull();
    const source = readFileSync(path as string, 'utf8');
    expect(source).toMatch(/from\s*["']@websublime\/line-core["']/);
    expect(source).not.toMatch(/function|Symbol\(/);
  });

  test('a FormAssociated(LineElement) instance reaches its internals through INTERNALS', () => {
    const el = document.createElement('line-test-graph-core') as LineGraphCoreHost;
    const internals = Reflect.get(el, INTERNALS) as { host?: HTMLElement } | undefined;
    expect(internals?.host).toBe(el);
    expect(el.checkValidity()).toBe(true);
  });
});
