/**
 * CSS Snapshot Tests — detects unintended regressions in build output.
 *
 * Builds the theme package first, then snapshots key dist/ files.
 * On subsequent runs, changes to CSS output will be flagged.
 *
 * Uses bun:test's built-in snapshot mechanism (toMatchSnapshot).
 *
 * @module test/snapshot
 */

import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const THEME_ROOT = resolve(import.meta.dirname, '..');
const DIST_DIR = resolve(THEME_ROOT, 'dist');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readDistFile(relativePath: string): string | null {
  const fullPath = join(DIST_DIR, relativePath);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, 'utf-8');
}

function listDistFiles(subdir: string): string[] {
  const dir = join(DIST_DIR, subdir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.min.css'))
    .sort();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CSS Snapshot Tests', () => {
  // Ensure dist/ exists (build must run before snapshot tests)
  test('dist/ directory exists (build must run first)', () => {
    expect(existsSync(DIST_DIR)).toBe(true);
  });

  describe('Root-level bundles', () => {
    const rootFiles = [
      'tokens.min.css',
      'semantic.min.css',
      'aliases.min.css',
      'normalize.min.css',
      'utilities.min.css',
      'line.min.css'
    ];

    for (const file of rootFiles) {
      test(`${file} snapshot`, () => {
        const content = readDistFile(file);
        expect(content).not.toBeNull();
        expect(content).toMatchSnapshot();
      });
    }
  });

  describe('Per-palette color snapshots', () => {
    const colorFiles = listDistFiles('colors');

    test('28 color files exist in dist/colors/', () => {
      expect(colorFiles.length).toBe(28);
    });

    // Snapshot all 28 palettes — color files are the primary contrast-bearing
    // output and regressions in any of them must be caught.
    for (const file of colorFiles) {
      const palette = file.replace('.min.css', '');
      test(`colors/${palette}.min.css snapshot`, () => {
        const content = readDistFile(`colors/${file}`);
        expect(content).not.toBeNull();
        expect(content).toMatchSnapshot();
      });
    }
  });

  describe('Per-palette schema snapshots', () => {
    const schemaFiles = listDistFiles('schemas');

    test('28 schema files exist in dist/schemas/', () => {
      expect(schemaFiles.length).toBe(28);
    });

    for (const file of schemaFiles) {
      const palette = file.replace('.min.css', '');
      test(`schemas/${palette}.min.css snapshot`, () => {
        const content = readDistFile(`schemas/${file}`);
        expect(content).not.toBeNull();
        expect(content).toMatchSnapshot();
      });
    }
  });

  describe('Per-palette theme snapshots', () => {
    const themeFiles = listDistFiles('themes');

    test('28 theme files exist in dist/themes/', () => {
      expect(themeFiles.length).toBe(28);
    });

    for (const file of themeFiles) {
      const palette = file.replace('.min.css', '');
      test(`themes/${palette}.min.css snapshot`, () => {
        const content = readDistFile(`themes/${file}`);
        expect(content).not.toBeNull();
        expect(content).toMatchSnapshot();
      });
    }
  });

  describe('Token family snapshots', () => {
    const families = ['borders', 'typography', 'sizing', 'shadows', 'easing'];

    for (const family of families) {
      test(`tokens/${family}.min.css snapshot`, () => {
        const content = readDistFile(`tokens/${family}.min.css`);
        expect(content).not.toBeNull();
        expect(content).toMatchSnapshot();
      });
    }
  });

  describe('Build output completeness', () => {
    test('all expected dist/ subdirectories exist', () => {
      const expectedDirs = ['colors', 'schemas', 'themes', 'tokens'];
      for (const dir of expectedDirs) {
        const fullPath = join(DIST_DIR, dir);
        expect(existsSync(fullPath)).toBe(true);
      }
    });

    test('all 17 token family files exist in dist/tokens/', () => {
      const files = listDistFiles('tokens');
      expect(files.length).toBe(17);
    });
  });
});
