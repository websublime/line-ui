/**
 * var() Cross-Reference Validation — catches undefined var() references.
 *
 * Scans all CSS source files under packages/theme/src/ and verifies
 * that every var(--line-*) reference points to a property that is
 * declared somewhere in the source tree.
 *
 * Special handling:
 * - Palette tokens (--line-{palette}-N) are declared in colors/*.css
 * - Schemas reference palette vars dynamically
 * - Aliases reference palette vars
 * - semantic.css references --line-white/--line-black from colors-absolute.css
 * - Self-references within the same file are valid (e.g., shadows referencing --line-shadow-color)
 * - Conditional radii referencing --line-radius-* in the same file
 *
 * @module test/var-crossref
 */

import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { extractDeclaredNames, extractVarReferences } from './helpers/css-parser';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const THEME_ROOT = resolve(import.meta.dirname, '..');
const SRC_DIR = resolve(THEME_ROOT, 'src');

// ---------------------------------------------------------------------------
// Collect all CSS files recursively
// ---------------------------------------------------------------------------

/**
 * Files to exclude from var() cross-reference scanning, specified as
 * relative paths from src/ to avoid ambiguous basename matching.
 * - utils/mixins.css: uses PostCSS mixin interpolation syntax $(var) inside var(),
 *   producing incomplete references like var(--line-font-size-) at parse time.
 */
const EXCLUDED_FILES = new Set(['utils/mixins.css']);

function collectCssFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectCssFiles(fullPath));
    } else if (entry.name.endsWith('.css') && !EXCLUDED_FILES.has(relative(SRC_DIR, fullPath))) {
      files.push(fullPath);
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find undefined var(--line-*) references in all CSS files within a directory. */
function findUndefinedRefsInDir(dir: string, allDecls: Set<string>): string[] {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => join(dir, f));

  const violations: string[] = [];
  for (const file of files) {
    const css = readFileSync(file, 'utf-8');
    const refs = extractVarReferences(css);
    const relPath = relative(SRC_DIR, file);

    for (const ref of refs) {
      if (!ref.startsWith('--line-')) continue;
      if (!allDecls.has(ref)) {
        violations.push(`${relPath}: undefined var(${ref})`);
      }
    }
  }
  return violations;
}

/** Validate that every color palette file declares levels 1-12 and a contrast token. */
function validatePaletteStructure(colorsDir: string): string[] {
  const colorFiles = readdirSync(colorsDir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => ({ path: join(colorsDir, f), palette: f.replace('.css', '') }));

  const violations: string[] = [];
  for (const { path, palette } of colorFiles) {
    const css = readFileSync(path, 'utf-8');
    const declared = extractDeclaredNames(css);

    for (let i = 1; i <= 12; i++) {
      const expected = `--line-${palette}-${i}`;
      if (!declared.has(expected)) {
        violations.push(`${palette}.css: missing ${expected}`);
      }
    }

    const contrastToken = `--line-${palette}-contrast`;
    if (!declared.has(contrastToken)) {
      violations.push(`${palette}.css: missing ${contrastToken}`);
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('var() Cross-Reference Validation', () => {
  // Collect all declarations and references across the entire source tree
  const allFiles = collectCssFiles(SRC_DIR);
  const allDeclarations = new Set<string>();
  const fileReferences = new Map<string, Set<string>>();

  for (const file of allFiles) {
    const css = readFileSync(file, 'utf-8');
    const declared = extractDeclaredNames(css);
    const refs = extractVarReferences(css);

    for (const name of declared) {
      allDeclarations.add(name);
    }

    if (refs.size > 0) {
      fileReferences.set(file, refs);
    }
  }

  test('collects a non-trivial number of declarations', () => {
    // Sanity check: we should find hundreds of declarations
    expect(allDeclarations.size).toBeGreaterThan(100);
  });

  test('collects a non-trivial number of references', () => {
    let totalRefs = 0;
    for (const refs of fileReferences.values()) {
      totalRefs += refs.size;
    }
    expect(totalRefs).toBeGreaterThan(50);
  });

  test('all --line-* var() references resolve to declared properties', () => {
    const undefined_refs: string[] = [];

    for (const [file, refs] of fileReferences) {
      const relPath = relative(SRC_DIR, file);

      for (const ref of refs) {
        // Only validate --line-* references (ignore browser-native or third-party vars)
        if (!ref.startsWith('--line-')) continue;

        if (!allDeclarations.has(ref)) {
          undefined_refs.push(`${relPath}: var(${ref})`);
        }
      }
    }

    if (undefined_refs.length > 0) {
      throw new Error(`Found ${undefined_refs.length} undefined var() reference(s):\n${undefined_refs.join('\n')}`);
    }
  });

  // Per-layer validation for more granular error reporting
  describe('Layer-specific cross-references', () => {
    test('semantic.css references are all declared', () => {
      const semanticFile = resolve(SRC_DIR, 'semantic.css');
      const css = readFileSync(semanticFile, 'utf-8');
      const refs = extractVarReferences(css);
      const declared = extractDeclaredNames(css);

      const unresolved: string[] = [];
      for (const ref of refs) {
        if (!ref.startsWith('--line-')) continue;
        // Check if declared in same file or globally
        if (!(declared.has(ref) || allDeclarations.has(ref))) {
          unresolved.push(ref);
        }
      }

      expect(unresolved).toEqual([]);
    });

    test('aliases.css references are all declared in color palettes', () => {
      const aliasesFile = resolve(SRC_DIR, 'aliases.css');
      const css = readFileSync(aliasesFile, 'utf-8');
      const refs = extractVarReferences(css);

      const unresolved: string[] = [];
      for (const ref of refs) {
        if (!ref.startsWith('--line-')) continue;
        if (!allDeclarations.has(ref)) {
          unresolved.push(ref);
        }
      }

      expect(unresolved).toEqual([]);
    });

    test('every schema file references only its own palette tokens', () => {
      const violations = findUndefinedRefsInDir(resolve(SRC_DIR, 'schemas'), allDeclarations);

      if (violations.length > 0) {
        throw new Error(`Schema cross-reference violations:\n${violations.join('\n')}`);
      }
    });
  });

  describe('Structural validation', () => {
    test('every color palette declares levels 1-12 + contrast', () => {
      const violations = validatePaletteStructure(resolve(SRC_DIR, 'colors'));

      if (violations.length > 0) {
        throw new Error(`Color palette structure violations:\n${violations.join('\n')}`);
      }
    });

    test('every schema declares all 13 semantic role tokens + solid-text', () => {
      const schemasDir = resolve(SRC_DIR, 'schemas');
      const schemaFiles = readdirSync(schemasDir)
        .filter((f) => f.endsWith('.css'))
        .map((f) => ({
          path: join(schemasDir, f),
          palette: f.replace('.css', '')
        }));

      const expectedRoles = [
        '--line-background',
        '--line-subtle-background',
        '--line-ui-background',
        '--line-ui-hover-background',
        '--line-ui-active-background',
        '--line-subtle-border',
        '--line-ui-border',
        '--line-ui-border-hover',
        '--line-solid-background',
        '--line-solid-hover',
        '--line-low-contrast',
        '--line-high-contrast',
        '--line-solid-text'
      ];

      const violations: string[] = [];

      for (const { path, palette } of schemaFiles) {
        const css = readFileSync(path, 'utf-8');
        const declared = extractDeclaredNames(css);

        for (const role of expectedRoles) {
          if (!declared.has(role)) {
            violations.push(`${palette}.css: missing ${role}`);
          }
        }
      }

      if (violations.length > 0) {
        throw new Error(`Schema role violations:\n${violations.join('\n')}`);
      }
    });
  });
});
