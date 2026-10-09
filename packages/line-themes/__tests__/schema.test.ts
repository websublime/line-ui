/**
 * Schema parity + alias-count tests (C9, spec §6.C.7, AC: aliases.css = 54 vars).
 *
 * Covers:
 *   (a) Zod validators reject invalid hue/role inputs and accept valid ones.
 *   (b) Generated CSS dist files exist for every schema member (parity):
 *       31 accent role maps ↔ ACCENT_HUES, 6 gray role maps ↔ GRAY_HUES,
 *       31 palette files ↔ HUES.
 *   (b') The committed role-map sources match the schema lists EXACTLY: the
 *       file set of `src/accent/` equals HUES and `src/gray/` equals GRAY_HUES,
 *       so a stale extra file fails (AM-052). This reads `src/`, not `dist/`,
 *       because the build never cleans `dist/`.
 *   (c) `aliases.css` declares EXACTLY 54 `--line-*` variables
 *       (ALIASES[9] × ROLES[6] = 54).
 *
 * The line-schemas barrel resolves only from inside packages/line-themes/
 * (per-package symlink); these tests therefore live here by design
 * (spec §6.C.7). dist is gitignored/ephemeral — upstream packages must be
 * built first (repo root `test` script handles this).
 *
 * @module __tests__/schema
 */

import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ACCENT_HUES,
  AccentHueSchema,
  ALIASES,
  GRAY_HUES,
  GrayHueSchema,
  HUES,
  HueSchema,
  ROLES,
  RoleSchema,
} from '@websublime/line-schemas';

const THEMES_DIST = resolve(import.meta.dirname, '../dist');
const COLORS_DIST = resolve(import.meta.dirname, '../../line-colors/dist');
const THEMES_SRC = resolve(import.meta.dirname, '../src');

describe('schema validators', () => {
  test('HueSchema accepts valid hues and rejects invalid', () => {
    expect(HueSchema.safeParse('violet').success).toBe(true);
    expect(HueSchema.safeParse('amber').success).toBe(true);
    expect(HueSchema.safeParse('not-a-hue').success).toBe(false);
    expect(HueSchema.safeParse('').success).toBe(false);
    expect(HueSchema.safeParse(42).success).toBe(false);
  });

  test('GrayHueSchema accepts the 6 gray hues and rejects non-gray hues', () => {
    for (const hue of GRAY_HUES) {
      expect(GrayHueSchema.safeParse(hue).success).toBe(true);
    }
    // 'violet' is a valid Hue but NOT a GrayHue.
    expect(GrayHueSchema.safeParse('violet').success).toBe(false);
    expect(GrayHueSchema.safeParse('not-a-gray').success).toBe(false);
  });

  test('RoleSchema accepts the 6 roles and rejects invalid', () => {
    for (const role of ROLES) {
      expect(RoleSchema.safeParse(role).success).toBe(true);
    }
    expect(RoleSchema.safeParse('accent').success).toBe(true);
    expect(RoleSchema.safeParse('not-a-role').success).toBe(false);
  });

  test('AccentHueSchema equals HueSchema (all 31 hues valid as accent)', () => {
    expect(ACCENT_HUES.length).toBe(31);
    for (const hue of ACCENT_HUES) {
      expect(AccentHueSchema.safeParse(hue).success).toBe(true);
    }
  });
});

describe('schema ↔ dist file parity', () => {
  test('schema tuple cardinalities are as specified', () => {
    expect(HUES.length).toBe(31);
    expect(ACCENT_HUES.length).toBe(31);
    expect(GRAY_HUES.length).toBe(6);
    expect(ROLES.length).toBe(6);
    expect(ALIASES.length).toBe(9);
  });

  test('every HUES member has a line-colors palette dist file (31)', () => {
    for (const hue of HUES) {
      const path = resolve(COLORS_DIST, `${hue}.css`);
      expect(existsSync(path), `missing palette dist: ${path}`).toBe(true);
    }
  });

  test('every ACCENT_HUES member has a line-themes accent role-map dist file (31)', () => {
    for (const hue of ACCENT_HUES) {
      const path = resolve(THEMES_DIST, `accent/${hue}.css`);
      expect(existsSync(path), `missing accent role-map dist: ${path}`).toBe(true);
    }
  });

  test('every GRAY_HUES member has a line-themes gray role-map dist file (6)', () => {
    for (const hue of GRAY_HUES) {
      const path = resolve(THEMES_DIST, `gray/${hue}.css`);
      expect(existsSync(path), `missing gray role-map dist: ${path}`).toBe(true);
    }
  });
});

describe('schema ↔ src file set (exact)', () => {
  for (const [dir, hues] of [
    ['accent', HUES],
    ['gray', GRAY_HUES],
  ] as const) {
    test(`src/${dir}/ holds exactly one role map per schema hue`, () => {
      const files = readdirSync(resolve(THEMES_SRC, dir)).sort();
      expect(files).toEqual(hues.map((hue) => `${hue}.css`).sort());
    });
  }
});

describe('aliases.css variable count', () => {
  test('aliases.css declares EXACTLY 54 --line-* variables (ALIASES × ROLES)', () => {
    const path = resolve(THEMES_DIST, 'aliases.css');
    expect(existsSync(path), `missing aliases dist: ${path}`).toBe(true);
    const aliasesCss = readFileSync(path, 'utf-8');
    // Count custom-property DECLARATIONS (`--line-*:`). dist is single-line
    // minified, so count `:`-terminated occurrences rather than lines.
    const declarations = aliasesCss.match(/--line-[a-z0-9-]+\s*:/g) ?? [];
    expect(declarations.length).toBe(54);
    // Sanity: matches the schema math ALIASES[9] × ROLES[6].
    expect(ALIASES.length * ROLES.length).toBe(54);
  });
});
