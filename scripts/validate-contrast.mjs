#!/usr/bin/env bun

/**
 * scripts/validate-contrast.mjs — line-colors WCAG contrast validator (C10).
 *
 * Bun script (Node-compatible APIs + bun's native TS import) invoked per
 * docs/specs/00-spec-design-system.md §6.C.3 (C10, lines 666-674) and §6.F.5
 * line 1363:
 *   - run: bun run scripts/validate-contrast.mjs   (zero args)
 *
 * For each of the 31 HUES × {light, dark} it computes the WCAG 2.1 contrast
 * ratio between that hue's base step-9 solid hex (from @radix-ui/colors) and its
 * static contrast token (PER_HUE_CONTRAST[H] = '#000' | '#fff', from
 * line-schemas/contrast-table) — the on-color a consumer paints over a step-9
 * solid fill (PRD §9.6, step 9 = solid brand). It fails the build on any pair
 * that falls below the threshold, naming the hue, mode, and ratio.
 *
 * THRESHOLD — 3:1 (AM-014, spec §6.C.3 line 668). This is the WCAG AA floor for
 * large text / non-text UI — the bar Radix engineers its step-9 solid surfaces
 * and their paired contrast tokens to. The originally specified 4.5:1
 * normal-text floor is UNSATISFIABLE for the verbatim-adopted Radix palette: 34
 * of the 62 (hue × mode) pairs fall below it (worst case 2.97:1), so a literal
 * 4.5:1 validator would exit non-zero on a clean tree forever. See the AM-014
 * amendment log and SPEC_DRIFT-1 in the bead investigation.
 *
 * ALLOWLIST — exactly one documented upstream exception (AM-014, spec §6.C.3
 * line 669): orange in BOTH light and dark mode. Radix orange-9 (#f76b15) vs the
 * white contrast token measures 2.97:1 — a genuine upstream Radix Colors
 * characteristic, not a bug in our table. An allowlisted pair is reported as a
 * WARNING instead of failing; but the validator FAILS if its computed ratio
 * drops below the recorded value, so a future @radix-ui/colors bump that
 * regresses orange further surfaces loudly rather than slipping through.
 *
 * BASE SCALES ONLY (spec §6.C.3 line 667): the P3 variants are NOT
 * contrast-validated — P3 is a colour-space (gamut) upgrade, not a luminance
 * change, and radixColors[`${H}P3`] returns `color(display-p3 …)` strings rather
 * than hex. Only radixColors[H] (light) and radixColors[`${H}Dark`] (dark) are
 * read, both keyed `{H}9` (the object name carries the Dark variant, the step
 * key does not — AM-011).
 *
 * WCAG MATH IS SHARED (C7, line-ui-7qm.3.7): the WCAG 2.1 relative-luminance,
 * contrast-ratio, hex parsing, and the THRESHOLD / SOLID_STEP constants now live
 * in the shared helper named by §6.C.5 (packages/line-utils/src/contrast.ts).
 * This validator imports them from that source module — the single source of
 * truth — rather than inlining its own copy. The helpers are imported via their
 * `.ts` SOURCE path (not the `@websublime/line-utils` package specifier),
 * matching the line-schemas source imports below: there is no line-utils symlink
 * in root node_modules, and this validator runs inside line-colors' build
 * (a leaf package with no dependency on line-utils), so line-utils/dist is not
 * guaranteed to exist at validate time. Importing the source removes that
 * build-order hazard while preserving the no-inline-copy intent.
 *
 * CI WIRING — out of scope here (spec §6.C.3 line 674, AM-014): .github/
 * workflows/checks.yml is owned by Stream F → F4 (line-ui-7qm.6.4,
 * infra-supervisor) per §6.F.5, which already enumerates this script's run-line.
 * This validator's C5 surface is local: exit 0 against the committed palette
 * (emitting the orange allowlist warnings), exit non-zero — naming hue, mode,
 * and ratio — on any non-allowlisted pair below 3:1. This script MUST NOT create
 * or modify the workflow file, mirroring the AM-013 split for C4.
 */

import * as radixColors from '@radix-ui/colors';
import { PER_HUE_CONTRAST } from '../packages/line-schemas/src/contrast-table.ts';
import { HUES } from '../packages/line-schemas/src/hues.ts';
import { contrastRatio, SOLID_STEP, THRESHOLD } from '../packages/line-utils/src/contrast.ts';

/**
 * Documented upstream allowlist (AM-014, spec §6.C.3 line 669). EXACTLY one
 * entry: orange, both modes. `ratio` is the recorded measured contrast of
 * Radix orange-9 (#f76b15) vs the white contrast token. An allowlisted pair
 * warns instead of failing; but it FAILS if its computed ratio drops below the
 * recorded value (silent-regression guard on a @radix-ui/colors bump).
 *
 * To extend this list a contributor must record the measured ratio here AND
 * justify it as a genuine upstream Radix characteristic — never to silence a
 * regression introduced by our own table.
 * @type {ReadonlyArray<{ hue: string; mode: 'light' | 'dark'; ratio: number }>}
 */
const ALLOWLIST = [
  // One logical entry (orange) x 2 modes: the spec's "exactly one entry"
  // counts the logical exception, not the physical rows. Light and dark are
  // listed separately because each mode is validated against its own scale.
  { hue: 'orange', mode: 'light', ratio: 2.97 },
  { hue: 'orange', mode: 'dark', ratio: 2.97 },
];

/**
 * Resolve a Radix scale object by name, throwing on a missing object so a
 * @radix-ui/colors bump that drops a scale fails loudly rather than skipping a
 * hue silently. Mirrors generate-palettes.mjs `scale()`.
 * @param {string} name
 * @returns {Record<string, string>}
 */
function scale(name) {
  // Radix scales are looked up by a computed object name (e.g. `orangeDark`);
  // dynamic namespace access is intrinsic to iterating the palette by hue.
  // biome-ignore lint/performance/noDynamicNamespaceImportAccess: validator resolves scales by computed name
  const obj = radixColors[name];
  if (!obj) {
    throw new Error(`@radix-ui/colors export "${name}" not found`);
  }
  return obj;
}

/**
 * Read a step value from a Radix scale, throwing if the key is absent. Guards
 * against the AM-011 object-vs-step-key drift (the step key is `{H}9` on the
 * Dark object too — never `{H}Dark9`). Mirrors generate-palettes.mjs `step()`.
 * @param {Record<string, string>} obj
 * @param {string} objName
 * @param {string} key
 * @returns {string}
 */
function step(obj, objName, key) {
  const value = obj[key];
  if (value === undefined) {
    throw new Error(`@radix-ui/colors ${objName}.${key} is undefined`);
  }
  return value;
}

/**
 * Look up an allowlist entry for a (hue, mode) pair, or null if none.
 * @param {string} hue
 * @param {'light' | 'dark'} mode
 * @returns {{ hue: string; mode: 'light' | 'dark'; ratio: number } | null}
 */
function allowlistEntry(hue, mode) {
  return ALLOWLIST.find((e) => e.hue === hue && e.mode === mode) ?? null;
}

/**
 * Round a ratio to 2 decimals for stable, human-readable reporting.
 * @param {number} ratio
 * @returns {string}
 */
function fmt(ratio) {
  return ratio.toFixed(2);
}

/**
 * Classify one (hue, mode) step-9 / contrast-token pair.
 *
 * Outcomes:
 *  - `ok`   — ratio ≥ THRESHOLD (no allowlist involvement).
 *  - `warn` — allowlisted pair below THRESHOLD but still at/above its recorded
 *             ratio (documented upstream exception; reported, not failed).
 *  - `fail` — non-allowlisted pair below THRESHOLD, OR an allowlisted pair that
 *             regressed below its recorded ratio.
 *
 * The `1e-9` slack absorbs floating-point noise so a pair sitting exactly on its
 * recorded/threshold boundary is treated as passing.
 * @param {string} hue
 * @param {'light' | 'dark'} mode
 * @param {string} step9
 * @param {string} token
 * @returns {{ kind: 'ok' | 'warn' | 'fail'; message?: string }}
 */
function evaluatePair(hue, mode, step9, token) {
  const ratio = contrastRatio(step9, token);
  const prefix = `${hue}/${mode}: step-9 ${step9} vs ${token} = ${fmt(ratio)}:1`;
  const allow = allowlistEntry(hue, mode);

  if (allow) {
    if (ratio + 1e-9 < allow.ratio) {
      return {
        kind: 'fail',
        message:
          `${prefix} — REGRESSION below the recorded allowlist ratio ${fmt(allow.ratio)}:1. ` +
          'Update the allowlist only after confirming this is a genuine upstream @radix-ui/colors change.',
      };
    }
    return {
      kind: 'warn',
      message:
        `${prefix} — below the ${THRESHOLD}:1 floor but ALLOWLISTED ` +
        `(documented upstream Radix characteristic, recorded ${fmt(allow.ratio)}:1).`,
    };
  }

  if (ratio + 1e-9 < THRESHOLD) {
    return { kind: 'fail', message: `${prefix} — below the ${THRESHOLD}:1 floor.` };
  }
  return { kind: 'ok' };
}

/**
 * Evaluate all 31 hues × {light, dark} step-9 pairs, collecting failures and
 * allowlist warnings. The light and dark step-9 hexes are read with the AM-011
 * `{H}9` step key (never `{H}Dark9`); a missing key throws via `step()`.
 * @returns {{ failures: string[]; warnings: string[]; pairCount: number }}
 */
function collectResults() {
  /** @type {string[]} Non-allowlisted pairs below threshold, OR allowlisted pairs that regressed below their recorded ratio. */
  const failures = [];
  /** @type {string[]} Allowlisted pairs still at/above their recorded ratio — reported, not failed. */
  const warnings = [];
  let pairCount = 0;

  for (const hue of HUES) {
    const token = PER_HUE_CONTRAST[hue];
    const pairs = /** @type {const} */ ([
      ['light', step(scale(hue), hue, `${hue}${SOLID_STEP}`)],
      ['dark', step(scale(`${hue}Dark`), `${hue}Dark`, `${hue}${SOLID_STEP}`)],
    ]);

    for (const [mode, step9] of pairs) {
      pairCount += 1;
      const result = evaluatePair(hue, mode, step9, token);
      if (result.kind === 'fail') {
        failures.push(result.message);
      } else if (result.kind === 'warn') {
        warnings.push(result.message);
      }
    }
  }

  return { failures, warnings, pairCount };
}

function main() {
  const { failures, warnings, pairCount } = collectResults();

  for (const warn of warnings) {
    process.stderr.write(`validate-contrast: WARN — ${warn}\n`);
  }

  if (failures.length === 0) {
    console.info(
      `validate-contrast: OK — ${pairCount} step-9/contrast pairs (${HUES.length} hues × light/dark) meet ` +
        `≥ ${THRESHOLD}:1` +
        (warnings.length > 0 ? ` (${warnings.length} allowlisted warning(s) above).` : '.'),
    );
    return;
  }

  process.stderr.write(`\nvalidate-contrast: FAIL — ${failures.length} contrast violation(s):\n`);
  for (const err of failures) {
    process.stderr.write(`  - ${err}\n`);
  }
  process.stderr.write(
    '\nEach (hue × mode) step-9 solid must reach a ' +
      `${THRESHOLD}:1 contrast ratio against its PER_HUE_CONTRAST on-color, except documented ` +
      'allowlist entries. Fix the contrast token in packages/line-schemas/src/contrast-table.ts, ' +
      'or — for a genuine upstream change — record a justified allowlist entry in this script.\n',
  );
  process.exitCode = 1;
}

main();
