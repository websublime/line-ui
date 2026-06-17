/**
 * Auto-pair cascade behaviour tests (C9, spec §6.C.7 + AM-015).
 *
 * The auto-pair behaviour is asserted by STRING-MATCHING the committed
 * `src/defaults.css` cascade rules — NOT via `getComputedStyle()`.
 *
 * Why string assertion (AM-015 / AM-020 spike): happy-dom (and jsdom) cannot
 * resolve the production `var()` chain through `getComputedStyle()`. A spike
 * (executed 2026-06-17) confirmed happy-dom CAN resolve a trivial hex-
 * terminated `var()` chain, but the real role variables bottom out in
 * `light-dark(#hex,#hex)`, which happy-dom neither stores nor computes — every
 * property consuming such a chain returns `""`. A computed-style read is
 * therefore unworkable for the real cascade, so the committed-CSS string
 * assertion is the spec-mandated method. C9 runs on F2's happy-dom harness and
 * provisions no DOM library of its own.
 *
 * Selector contract (PRD §9.14 T4): only `[data-accent]` / `[data-gray]`
 * attribute selectors, all wrapped in `:where(...)` for zero specificity.
 *
 * The four cascade cases verified (spec §6.C.7 table):
 *   1. default (no attrs)          → accent=indigo, gray=slate
 *   2. explicit accent only        → auto-pair fires (amber → sand)
 *   3. explicit accent + gray      → auto-pair SUPPRESSED via :not([data-gray])
 *   4. nested-scope override       → per-hue auto-pair (violet → slate)
 *
 * @module __tests__/auto-pair.behaviour
 */

import { beforeAll, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULTS_CSS = resolve(import.meta.dirname, '../src/defaults.css');

let css = '';

beforeAll(() => {
  css = readFileSync(DEFAULTS_CSS, 'utf-8');
});

/** Collapse whitespace so assertions are insensitive to formatting. */
function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Extract the declaration block body for a given selector from defaults.css.
 * Returns the normalized inner text (without braces), or null if absent.
 */
function blockFor(selector: string): string | null {
  const idx = css.indexOf(selector);
  if (idx === -1) return null;
  const open = css.indexOf('{', idx);
  const close = css.indexOf('}', open);
  if (open === -1 || close === -1) return null;
  return normalize(css.slice(open + 1, close));
}

describe('auto-pair cascade (string assertion against src/defaults.css, AM-015)', () => {
  // ── Case 1: default (no [data-accent]) → indigo accent, slate gray ───────
  describe('case 1 — default (no attributes)', () => {
    test('default accent block maps --line-accent-* ← indigo', () => {
      const block = blockFor(':where(html:not([data-accent]))');
      expect(block).not.toBeNull();
      expect(block).toContain('--line-accent-9: var(--line-indigo-9)');
      expect(block).toContain('--line-accent-contrast: var(--line-indigo-contrast)');
    });

    test('default gray block (no accent, no gray) maps --line-gray-* ← slate', () => {
      const block = blockFor(':where(html:not([data-accent]):not([data-gray]))');
      expect(block).not.toBeNull();
      expect(block).toContain('--line-gray-9: var(--line-slate-9)');
      expect(block).toContain('--line-gray-contrast: var(--line-slate-contrast)');
    });
  });

  // ── Case 2: explicit accent only → auto-pair fires (amber → sand) ────────
  describe('case 2 — explicit accent only (auto-pair fires)', () => {
    test('amber auto-pairs gray ← sand under :not([data-gray])', () => {
      const block = blockFor(':where([data-accent="amber"]:not([data-gray]))');
      expect(block).not.toBeNull();
      expect(block).toContain('--line-gray-9: var(--line-sand-9)');
      expect(block).toContain('--line-gray-contrast: var(--line-sand-contrast)');
    });
  });

  // ── Case 3: explicit accent + gray → auto-pair SUPPRESSED ────────────────
  // Suppression is verified INDIRECTLY: rather than rendering an explicit
  // accent+gray combination and asserting auto-pair did not fire, we assert
  // that every auto-pair selector carries the :not([data-gray]) guard. The
  // guard is the CSS mechanism that suppresses auto-pair, so its presence on
  // every rule proves suppression holds for any explicit [data-gray].
  describe('case 3 — explicit accent + gray (auto-pair suppressed, verified indirectly via the :not([data-gray]) guard)', () => {
    test('every auto-pair selector carries the :not([data-gray]) guard (suppression verified indirectly)', () => {
      // The :not([data-gray]) guard is what suppresses auto-pair when the
      // consumer sets an explicit [data-gray]. We do not assert the suppressed
      // outcome directly; instead we assert no auto-pair rule maps
      // --line-gray-* without that guard, which indirectly guarantees it.
      const autoPairRules = css.match(/:where\(\[data-accent="[a-z]+"\][^)]*\)/g) ?? [];
      expect(autoPairRules.length).toBeGreaterThan(0);
      for (const rule of autoPairRules) {
        expect(rule).toContain(':not([data-gray])');
      }
    });

    test('no auto-pair block uses an aggregator selector (PRD §9.14 T4)', () => {
      // Selector contract: only [data-accent] / [data-gray] attribute
      // selectors. No combined/aggregator selector such as [data-theme].
      expect(css).not.toContain('[data-theme');
    });
  });

  // ── Case 4: nested-scope override → per-hue auto-pair (violet → slate) ───
  describe('case 4 — nested-scope override (per-hue auto-pair)', () => {
    test('violet auto-pairs gray ← slate (distinct from amber → sand)', () => {
      const block = blockFor(':where([data-accent="violet"]:not([data-gray]))');
      expect(block).not.toBeNull();
      expect(block).toContain('--line-gray-9: var(--line-slate-9)');
      expect(block).toContain('--line-gray-contrast: var(--line-slate-contrast)');
    });

    test('violet and amber resolve to different gray families', () => {
      const violet = blockFor(':where([data-accent="violet"]:not([data-gray]))');
      const amber = blockFor(':where([data-accent="amber"]:not([data-gray]))');
      expect(violet).toContain('var(--line-slate-9)');
      expect(amber).toContain('var(--line-sand-9)');
      expect(violet).not.toContain('var(--line-sand-9)');
    });
  });

  // ── Selector hygiene: every selector is zero-specificity :where(...) ─────
  test('all role-map selectors are wrapped in :where() for zero specificity', () => {
    // Strip comments first so comment bodies are not mistaken for selectors.
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors = (stripped.match(/[^{}]+\{/g) ?? []).map((s) => s.trim());
    expect(selectors.length).toBeGreaterThan(0);
    for (const sel of selectors) {
      expect(sel.startsWith(':where('), `non-:where() selector: ${sel}`).toBe(true);
    }
  });
});
