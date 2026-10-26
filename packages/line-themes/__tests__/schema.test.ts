/**
 * Schema parity + alias-count tests (C9, spec §6.C.7, AC: aliases.css = 54 vars).
 *
 * Covers:
 *   (a) Zod validators reject invalid hue/role inputs and accept valid ones.
 *   (b) Generated CSS dist files exist for every schema member (parity):
 *       31 accent role maps ↔ ACCENT_HUES, 6 gray role maps ↔ GRAY_HUES,
 *       31 palette files ↔ HUES. Each file resolves through the `exports` of
 *       `@websublime/line-colors` or of this package, and the resolved path is
 *       checked on disk (PRD §5.2 rules 1 and 2).
 *   (b') The committed role-map sources match the schema lists EXACTLY: the
 *       file set of `src/accent/` equals HUES and `src/gray/` equals GRAY_HUES,
 *       so a stale extra file fails (AM-052). This reads `src/`, not `dist/`,
 *       because the build never cleans `dist/`.
 *   (c) `aliases.css` declares EXACTLY 54 `--line-*` variables
 *       (ALIASES[9] × ROLES[6] = 54).
 *   (d) `semantics.css` matches SEMANTIC_MAP exactly. The declared role set
 *       equals the map's keys, and every `--line-*` declaration is
 *       `var(--line-<mapped hue>-<same suffix>)` (AM-061, plan §7.2).
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
import { fileURLToPath } from 'node:url';
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
  SEMANTIC_MAP,
} from '@websublime/line-schemas';

const THEMES_SRC = resolve(import.meta.dirname, '../src');

/**
 * Resolves `specifier` and returns the file path, or `undefined` when the file
 * is missing. Node returns the path of a missing wildcard target and Bun throws,
 * so the path is checked on disk and a throw counts as missing.
 */
function resolveBuilt(specifier: string): string | undefined {
  try {
    const path = fileURLToPath(import.meta.resolve(specifier));
    return existsSync(path) ? path : undefined;
  } catch {
    return undefined;
  }
}

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
      const specifier = `@websublime/line-colors/${hue}`;
      expect(resolveBuilt(specifier), `missing palette dist: ${specifier}`).toBeDefined();
    }
  });

  test('every ACCENT_HUES member has a line-themes accent role-map dist file (31)', () => {
    for (const hue of ACCENT_HUES) {
      const specifier = `@websublime/line-themes/accent/${hue}`;
      expect(resolveBuilt(specifier), `missing accent role-map dist: ${specifier}`).toBeDefined();
    }
  });

  test('every GRAY_HUES member has a line-themes gray role-map dist file (6)', () => {
    for (const hue of GRAY_HUES) {
      const specifier = `@websublime/line-themes/gray/${hue}`;
      expect(resolveBuilt(specifier), `missing gray role-map dist: ${specifier}`).toBeDefined();
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
    const path = resolveBuilt('@websublime/line-themes/aliases');
    if (!path) throw new Error('missing aliases dist: @websublime/line-themes/aliases');
    const aliasesCss = readFileSync(path, 'utf-8');
    // Count custom-property DECLARATIONS (`--line-*:`). dist is single-line
    // minified, so count `:`-terminated occurrences rather than lines.
    const declarations = aliasesCss.match(/--line-[a-z0-9-]+\s*:/g) ?? [];
    expect(declarations.length).toBe(54);
    // Sanity: matches the schema math ALIASES[9] × ROLES[6].
    expect(ALIASES.length * ROLES.length).toBe(54);
  });
});

/** Sentinel key for declarations whose name is not `--line-<role>-<suffix>`. */
const MALFORMED = '<malformed>';

/**
 * Derives role → hue from EVERY `--line-*` custom-property declaration in
 * `semantics.css`. A valid declaration is `--line-<role>-<suffix>:
 * var(--line-<hue>-<suffix>)`, where the suffix is a step, an alpha step or
 * `contrast` and matches on both sides, with no fallback and no literal.
 * A declaration with a bad value adds `<invalid: …>` to its role's entry. A
 * declaration with a bad name goes under the MALFORMED key. Unknown roles,
 * hyphenated ones included, enter the role set. A role that references more
 * than one entry maps to the sorted list joined by `|`, so any drift fails
 * the equality check with a readable diff.
 */
function deriveSemanticMap(css: string): Record<string, string> {
  const entriesByRole = new Map<string, Set<string>>();
  const add = (role: string, entry: string) => {
    if (!entriesByRole.has(role)) entriesByRole.set(role, new Set());
    entriesByRole.get(role)?.add(entry);
  };
  for (const [, name, rawValue] of css.matchAll(/(--line-[a-z0-9-]+)\s*:\s*([^;]*);/g)) {
    const value = rawValue.trim();
    const nameMatch = /^--line-([a-z][a-z0-9-]*?)-(a?\d+|contrast)$/.exec(name);
    if (!nameMatch) {
      add(MALFORMED, `${name}: ${value}`);
      continue;
    }
    const [, role, suffix] = nameMatch;
    const valueMatch = /^var\(--line-([a-z]+)-(a?\d+|contrast)\)$/.exec(value);
    if (valueMatch && valueMatch[2] === suffix) {
      add(role, valueMatch[1]);
    } else {
      add(role, `<invalid: ${name}: ${value}>`);
    }
  }
  return Object.fromEntries([...entriesByRole].map(([role, entries]) => [role, [...entries].sort().join('|')]));
}

describe('SEMANTIC_MAP ↔ semantics.css (AM-061)', () => {
  const css = readFileSync(resolve(THEMES_SRC, 'semantics.css'), 'utf-8');
  const derived = deriveSemanticMap(css);

  test('semantics.css declares exactly the SEMANTIC_MAP roles', () => {
    expect(Object.keys(derived).sort()).toEqual(Object.keys(SEMANTIC_MAP).sort());
  });

  test('each semantic role references exactly the hue SEMANTIC_MAP names', () => {
    expect(derived).toEqual({ ...SEMANTIC_MAP });
  });
});
