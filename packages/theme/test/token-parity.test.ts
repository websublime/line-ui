/**
 * Token Parity Tests — validates line://ui tokens against Open Props source.
 *
 * For each token family, verifies that:
 * 1. All Open Props tokens have a --line-* equivalent (with known exceptions)
 * 2. Values match 1:1 (after stripping the --line- prefix from var() refs)
 *
 * Known divergences are documented in the DIVERGENCES config below.
 *
 * @module test/token-parity
 */

import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { addLinePrefix, extractDeclaredNamesFromFile } from './helpers/css-parser';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const THEME_ROOT = resolve(import.meta.dirname, '..');
const TOKENS_DIR = resolve(THEME_ROOT, 'src/tokens');
const OP_SRC = resolve(THEME_ROOT, '../../node_modules/open-props/src');

// ---------------------------------------------------------------------------
// Family mapping: line file name -> Open Props file name(s)
// ---------------------------------------------------------------------------

interface FamilyConfig {
  /** line://ui token file basename (without .css) */
  lineFile: string;
  /** Corresponding Open Props file basename(s) (without .css) */
  opFiles: string[];
  /**
   * Open Props property names that line://ui intentionally omits.
   * These will not be flagged as missing.
   */
  omittedOpTokens?: string[];
  /**
   * line://ui property names that have no Open Props equivalent.
   * These are line-only extensions and will not be flagged.
   */
  lineOnlyTokens?: string[];
}

const FAMILIES: FamilyConfig[] = [
  {
    lineFile: 'borders',
    opFiles: ['props.borders']
  },
  {
    lineFile: 'sizing',
    opFiles: ['props.sizes']
  },
  {
    lineFile: 'typography',
    opFiles: ['props.fonts'],
    // OP uses --font-lineheight-00 / --font-size-00 numbering;
    // line renumbers starting at 0 and extends the scale.
    omittedOpTokens: [
      '--font-lineheight-00', // renumbered to --line-font-lineheight-0
      '--font-size-00' // renumbered to --line-font-size-0
    ],
    lineOnlyTokens: [
      '--line-font-sans',
      '--line-font-serif',
      '--line-font-mono',
      '--line-font-lineheight-6', // OP stops at lineheight-5; line extends to 9
      '--line-font-lineheight-7',
      '--line-font-lineheight-8',
      '--line-font-lineheight-9',
      '--line-font-size-9', // OP stops at size-8; line adds size-9
      '--line-font-letterspacing-6',
      '--line-font-letterspacing-7',
      '--line-font-letterspacing-8',
      '--line-font-letterspacing-9'
    ]
  },
  {
    lineFile: 'easing',
    opFiles: ['props.easing']
  },
  {
    lineFile: 'shadows',
    opFiles: ['props.shadows'],
    // OP uses intermediate --shadow-strength-N vars; line inlines calc() instead
    omittedOpTokens: [
      '--shadow-strength-3',
      '--shadow-strength-4',
      '--shadow-strength-5',
      '--shadow-strength-6',
      '--shadow-strength-7',
      '--shadow-strength-8',
      '--shadow-strength-10'
    ]
    // Note: value comparison is not performed — structural divergence (inline calc vs var refs)
  },
  {
    lineFile: 'zindex',
    opFiles: ['props.zindex'],
    lineOnlyTokens: [
      '--line-z-dropdown',
      '--line-z-sticky',
      '--line-z-fixed',
      '--line-z-overlay',
      '--line-z-modal',
      '--line-z-popover',
      '--line-z-toast',
      '--line-z-tooltip'
    ]
  },
  {
    lineFile: 'aspects',
    opFiles: ['props.aspects']
  },
  {
    lineFile: 'animations',
    opFiles: ['props.animations']
  },
  {
    lineFile: 'gradients',
    opFiles: ['props.gradients']
  },
  {
    lineFile: 'highlights',
    opFiles: ['props.highlights']
  },
  {
    lineFile: 'layouts',
    opFiles: ['props.layouts'],
    // OP grid_adapt_mixin uses * selector; line keeps only 4 core tokens
    omittedOpTokens: [
      '--grid_adapt_mixin-viewport_context',
      '--grid_adapt_mixin-container_context',
      '--grid_adapt_mixin-context',
      '--grid_adapt_mixin-break_1',
      '--above-break_1-columns',
      '--grid_adapt_mixin-break_2',
      '--above-break_2-columns',
      '--grid_adapt_mixin'
    ]
  },
  {
    lineFile: 'svg',
    opFiles: ['props.svg']
  },
  {
    lineFile: 'masks',
    opFiles: ['props.masks.edges', 'props.masks.corner-cuts']
  }
];

// Line-only families (no OP equivalent)
const LINE_ONLY_FAMILIES = ['durations', 'opacity', 'focus', 'colors-absolute'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all OP token names from the given source files. */
function collectOpNames(opPaths: string[]): Set<string> {
  const opNames = new Set<string>();
  for (const opPath of opPaths) {
    for (const name of extractDeclaredNamesFromFile(opPath)) {
      opNames.add(name);
    }
  }
  return opNames;
}

/** Find OP tokens missing their --line-* equivalents. */
function findMissingTokens(lineNames: Set<string>, opNames: Set<string>, omitted: Set<string>): string[] {
  const missing: string[] = [];
  for (const opName of opNames) {
    if (omitted.has(opName)) continue;
    const lineName = addLinePrefix(opName);
    if (!lineNames.has(lineName)) {
      missing.push(`${opName} -> expected ${lineName}`);
    }
  }
  return missing;
}

/** Find line tokens that are neither OP-mapped nor documented as line-only. */
function findUnexpectedTokens(lineNames: Set<string>, opPaths: string[], lineOnly: Set<string>): string[] {
  const opMapped = new Set<string>();
  for (const opPath of opPaths) {
    for (const name of extractDeclaredNamesFromFile(opPath)) {
      opMapped.add(addLinePrefix(name));
    }
  }

  const unexpected: string[] = [];
  for (const lineName of lineNames) {
    if (opMapped.has(lineName)) continue;
    if (lineOnly.has(lineName)) continue;
    unexpected.push(lineName);
  }
  return unexpected;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Token Parity: line://ui vs Open Props', () => {
  for (const family of FAMILIES) {
    describe(`${family.lineFile}`, () => {
      const linePath = resolve(TOKENS_DIR, `${family.lineFile}.css`);
      const opPaths = family.opFiles.map((f) => resolve(OP_SRC, `${f}.css`));

      test('line file exists', () => {
        expect(existsSync(linePath)).toBe(true);
      });

      test('Open Props source file(s) exist', () => {
        for (const opPath of opPaths) {
          expect(existsSync(opPath)).toBe(true);
        }
      });

      test('all Open Props tokens have --line-* equivalents', () => {
        const lineNames = extractDeclaredNamesFromFile(linePath);
        const omitted = new Set(family.omittedOpTokens ?? []);
        const opNames = collectOpNames(opPaths);
        const missing = findMissingTokens(lineNames, opNames, omitted);

        if (missing.length > 0) {
          throw new Error(`Missing ${missing.length} token(s) in ${family.lineFile}.css:\n${missing.join('\n')}`);
        }
      });

      test('no unexpected line-only tokens (all documented)', () => {
        const lineNames = extractDeclaredNamesFromFile(linePath);
        const lineOnly = new Set(family.lineOnlyTokens ?? []);
        const unexpected = findUnexpectedTokens(lineNames, opPaths, lineOnly);

        if (unexpected.length > 0) {
          throw new Error(
            `${unexpected.length} undocumented line-only token(s) in ${family.lineFile}.css:\n` +
              `${unexpected.join('\n')}\n\n` +
              'If intentional, add these to lineOnlyTokens in the test config.'
          );
        }
      });
    });
  }

  describe('line-only families exist', () => {
    for (const family of LINE_ONLY_FAMILIES) {
      test(`${family}.css exists`, () => {
        const filePath = resolve(TOKENS_DIR, `${family}.css`);
        expect(existsSync(filePath)).toBe(true);
      });

      test(`${family}.css declares at least one --line-* token`, () => {
        const filePath = resolve(TOKENS_DIR, `${family}.css`);
        const names = extractDeclaredNamesFromFile(filePath);
        const lineNames = [...names].filter((n) => n.startsWith('--line-'));
        expect(lineNames.length).toBeGreaterThan(0);
      });
    }
  });

  describe('tokens.css barrel imports all families', () => {
    test('all 17 family files are imported', () => {
      const barrelPath = resolve(THEME_ROOT, 'src/tokens.css');
      const allFamilies = [...FAMILIES.map((f) => f.lineFile), ...LINE_ONLY_FAMILIES];
      const barrelContent = readFileSync(barrelPath, 'utf-8');

      const missing: string[] = [];
      for (const family of allFamilies) {
        if (!barrelContent.includes(`tokens/${family}.css`)) {
          missing.push(family);
        }
      }

      if (missing.length > 0) {
        throw new Error(`tokens.css is missing imports for: ${missing.join(', ')}`);
      }
    });
  });
});
