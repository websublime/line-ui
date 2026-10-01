/**
 * Shadow-DOM modular reset sheets unit tests (D7, spec §6.D.7 + AM-026/AM-027).
 *
 * Covers the §9.3 acceptance criterion — "11 modular reset sheets exist in
 * `packages/line-core/src/styles/` and export singleton `CSSStyleSheet`
 * objects" — and the consumer-visible failure modes around it:
 *   1. the module surface is exactly the 11 named sheets;
 *   2. each export is a constructed `CSSStyleSheet` whose rules come from its
 *      own `reset.*.css` source (a broken `?inline` import would produce an
 *      empty sheet — this is what the AM-026 preload plugin guards);
 *   3. the 11 sheets are distinct objects (no export aliases another);
 *   4. `inputReset` keeps both autofill-detection `@keyframes` rules — the
 *      contract ARCHITECTURE §15.3 relies on (AM-027).
 *
 * Runs on F2's harness: `bun-test-preload.ts` registers happy-dom globally
 * (which implements `CSSStyleSheet.replaceSync` / `cssRules`).
 *
 * @module __tests__/styles
 */

import { describe, expect, test } from 'bun:test';
import {
  buttonReset,
  commonReset,
  fieldsetReset,
  inputReset,
  progressReset,
  rangeReset,
  scrollbarReset,
  selectReset,
  summaryReset,
  tableReset,
  textareaReset,
} from '../src/styles/index.js';

/** Every export, keyed by name, with the selector proving it came from its own source file. */
const SHEETS: Record<string, { sheet: CSSStyleSheet; fingerprint: string }> = {
  commonReset: { sheet: commonReset, fingerprint: '[hidden]' },
  inputReset: { sheet: inputReset, fingerprint: 'input' },
  buttonReset: { sheet: buttonReset, fingerprint: 'button' },
  textareaReset: { sheet: textareaReset, fingerprint: 'textarea' },
  selectReset: { sheet: selectReset, fingerprint: 'select' },
  rangeReset: { sheet: rangeReset, fingerprint: 'input[type="range"]' },
  progressReset: { sheet: progressReset, fingerprint: 'progress, meter' },
  summaryReset: { sheet: summaryReset, fingerprint: 'summary' },
  fieldsetReset: { sheet: fieldsetReset, fingerprint: 'fieldset' },
  tableReset: { sheet: tableReset, fingerprint: 'table' },
  scrollbarReset: { sheet: scrollbarReset, fingerprint: ':host' },
};

const SHEET_NAMES = Object.keys(SHEETS).sort();

/** Whitespace-normalised selector (or at-rule prelude) text of every rule in a sheet. */
function ruleHeads(sheet: CSSStyleSheet): string[] {
  return Array.from(sheet.cssRules, (rule) => {
    const head = rule instanceof CSSStyleRule ? rule.selectorText : (rule.cssText.split('{')[0] ?? '');
    return head.replace(/\s+/g, ' ').trim();
  });
}

describe('@websublime/line-core/styles (D7)', () => {
  test('exports exactly the 11 named reset sheets', async () => {
    // Dynamic import on purpose: the namespace object is the surface under test.
    const namespace = await import('../src/styles/index.js');
    expect(Object.keys(namespace).sort()).toEqual(SHEET_NAMES);
  });

  test('inputReset keeps both autofill-detection @keyframes rules (AM-027)', () => {
    const keyframeNames = Array.from(inputReset.cssRules)
      .filter((rule): rule is CSSKeyframesRule => rule instanceof CSSKeyframesRule)
      .map((rule) => rule.name);
    expect(keyframeNames).toEqual(['line-autofill-start', 'line-autofill-cancel']);
  });

  for (const [name, { sheet, fingerprint }] of Object.entries(SHEETS)) {
    test(`${name} is a CSSStyleSheet built from its source file`, () => {
      expect(sheet).toBeInstanceOf(CSSStyleSheet);
      expect(sheet.cssRules.length).toBeGreaterThan(0);
      expect(ruleHeads(sheet)).toContain(fingerprint);
    });
  }

  test('the 11 sheets are distinct objects', () => {
    const unique = new Set(Object.values(SHEETS).map(({ sheet }) => sheet));
    expect(unique.size).toBe(11);
  });

  test('[hidden] keeps its !important priority in commonReset', () => {
    const hidden = Array.from(commonReset.cssRules).find(
      (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === '[hidden]',
    );
    expect(hidden?.style.getPropertyPriority('display')).toBe('important');
  });
});
