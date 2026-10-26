/**
 * `defaults.css` selector contract (C9, Phase 00 spec §6.C.7, AM-077; PRD §9.14 T4).
 *
 * Reads this package's `src/defaults.css` and checks its selectors:
 *   (a) every selector sits inside `:where()`, so it adds no specificity;
 *   (b) no selector uses a `[data-theme` aggregator;
 *   (c) every `[data-accent="X"]` auto-pair selector carries `:not([data-gray])`.
 *
 * `src/index.css` imports `defaults.css` before `gray/*.css` at equal
 * specificity, so an explicit `data-gray` wins in the browser even without the
 * guard. Only this test sees a missing guard; `auto-pair.e2e.ts` checks the
 * cascade.
 *
 * @module __tests__/defaults-selectors
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(import.meta.dirname, '../src/defaults.css'), 'utf-8');

/** Every rule selector, comments stripped and the `@layer line` opener dropped (AM-058). */
const selectors = (css.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]+\{/g) ?? [])
  .map((selector) => selector.slice(0, -1).trim())
  .filter((selector) => selector !== '@layer line');

describe('defaults.css selector contract (PRD §9.14 T4)', () => {
  test('every selector sits inside :where() for zero specificity', () => {
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(selector.startsWith(':where(') && selector.endsWith(')'), `non-:where() selector: ${selector}`).toBe(true);
    }
  });

  test('no selector uses a [data-theme aggregator', () => {
    expect(css).not.toContain('[data-theme');
  });

  test('every [data-accent="X"] auto-pair selector carries :not([data-gray])', () => {
    const autoPairs = selectors.filter((selector) => /\[data-accent="[a-z]+"\]/.test(selector));
    expect(autoPairs.length).toBeGreaterThan(0);
    for (const selector of autoPairs) {
      expect(selector, `auto-pair selector without the guard: ${selector}`).toContain(':not([data-gray])');
    }
  });
});
