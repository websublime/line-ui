#!/usr/bin/env bun

/**
 * scripts/validate-contrast.mjs — line-colors WCAG contrast validator (C5).
 *
 * Bun script (Node-compatible APIs + bun's native TS import) invoked per
 * docs/specs/00-spec-design-system.md §6.C.3 (C5) and §6.F.5:
 *   - run: bun run scripts/validate-contrast.mjs   (zero args)
 *
 * For each of the 31 HUES × {light, dark} it computes the WCAG 2.1 contrast
 * ratio between that hue's base step-9 solid hex (from @radix-ui/colors) and
 * its contrast token for that mode, contrastFor(H, mode) = '#000' | '#fff' from
 * line-schemas/contrast-table: PER_HUE_CONTRAST[H] in light mode and
 * PER_HUE_CONTRAST_DARK[H] in dark (AM-092). The token is the on-color a
 * consumer paints over a step-9 solid fill (PRD §9.6, step 9 = solid brand).
 * It fails the build on any pair below the floor, naming the hue, mode, and
 * ratio, and on success names the lowest pair.
 *
 * FLOOR — TEXT_THRESHOLD, 4.5:1 (AM-092, which supersedes AM-014's 3:1). This
 * is the WCAG 2.1 AA floor for normal-size text (SC 1.4.3): the Button and Chip
 * `primary` labels (16px, weight 500) sit on step 9 (PRD §5.2.1).
 *
 * NO ALLOWLIST (AM-092 removed AM-014's `orange` entry). A pair below the floor
 * is fixed in the contrast tables, never excepted.
 *
 * STEP 9 ONLY: step 10, the `-solid-hover` alias, is not gated (§6.C.3).
 *
 * BASE SCALES ONLY (§6.C.3): the P3 variants are NOT contrast-validated — P3
 * is a colour-space (gamut) upgrade, not a luminance change, and
 * radixColors[`${H}P3`] returns `color(display-p3 …)` strings rather than hex.
 * Only radixColors[H] (light) and radixColors[`${H}Dark`] (dark) are read, both
 * keyed `{H}9` (the object name carries the Dark variant, the step key does not
 * — AM-011). `{H}` is the Radix SOURCE name from scripts/radix-sources.mjs, so
 * the hue `neutral` reads `gray` (AM-052).
 *
 * WCAG MATH IS SHARED (C7, line-ui-7qm.3.7): the relative-luminance and
 * contrast-ratio helpers and the TEXT_THRESHOLD / SOLID_STEP constants live in
 * packages/line-utils/src/contrast.ts (§6.C.5). This validator imports them via
 * their `.ts` SOURCE path (not the `@websublime/line-utils` package specifier),
 * matching the line-schemas source imports below: there is no line-utils
 * symlink in root node_modules, and this validator runs inside line-colors'
 * build (a leaf package with no dependency on line-utils), so line-utils/dist
 * is not guaranteed to exist at validate time.
 *
 * CI WIRING — out of scope here (§6.C.3 C5 scope note): .github/workflows/
 * checks.yml is owned by Stream F → F4 (line-ui-7qm.6.4, infra-supervisor) per
 * §6.F.5, which already enumerates this script's run-line. This script MUST NOT
 * create or modify the workflow file.
 */

import * as radixColors from '@radix-ui/colors';
import { contrastFor } from '../packages/line-schemas/src/contrast-table.ts';
import { HUES } from '../packages/line-schemas/src/hues.ts';
import { contrastRatio, SOLID_STEP, TEXT_THRESHOLD } from '../packages/line-utils/src/contrast.ts';
import { radixSource } from './radix-sources.mjs';

/** @typedef {'light' | 'dark'} Mode */
/** @typedef {{ hue: string; mode: Mode; step9: string; token: string; ratio: number }} Pair */

export const MODES = /** @type {const} */ (['light', 'dark']);

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
 * The base sRGB step-9 hex of `hue` in `mode`.
 * @param {string} hue
 * @param {Mode} mode
 * @returns {string}
 */
export function solidStep(hue, mode) {
  const src = radixSource(hue);
  const objName = mode === 'dark' ? `${src}Dark` : src;
  return step(scale(objName), objName, `${src}${SOLID_STEP}`);
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
 * One pair as `hue/mode: step-9 #hex vs #token = r:1`.
 * @param {Pair} pair
 * @returns {string}
 */
export function describePair(pair) {
  return `${pair.hue}/${pair.mode}: step-9 ${pair.step9} vs ${pair.token} = ${fmt(pair.ratio)}:1`;
}

/**
 * Measure every hue × {light, dark} step-9 / contrast-token pair and split out
 * those below TEXT_THRESHOLD. The `1e-9` slack absorbs floating-point noise so
 * a pair sitting exactly on the floor passes. `contrast` defaults to
 * line-schemas' contrastFor; tests pass another table to exercise a failure.
 * @param {(hue: string, mode: Mode) => string} [contrast]
 * @returns {{ pairs: Pair[]; failures: Pair[]; worst: Pair }}
 */
export function collectResults(contrast = contrastFor) {
  /** @type {Pair[]} */
  const pairs = [];
  for (const hue of HUES) {
    for (const mode of MODES) {
      const step9 = solidStep(hue, mode);
      const token = contrast(hue, mode);
      pairs.push({ hue, mode, step9, token, ratio: contrastRatio(step9, token) });
    }
  }
  const failures = pairs.filter((pair) => pair.ratio + 1e-9 < TEXT_THRESHOLD);
  const worst = pairs.reduce((low, pair) => (pair.ratio < low.ratio ? pair : low));
  return { pairs, failures, worst };
}

/**
 * Run the C5 gate over `contrast` (line-schemas' contrastFor by default) and
 * return the process exit code: 0 when every pair meets TEXT_THRESHOLD, naming
 * the lowest pair through `report.info`; 1 otherwise, naming each failing hue,
 * mode and ratio through `report.error`. Tests inject a failing table and a
 * capturing `report`, as verify-peer-ranges.mjs takes its runner.
 * @param {(hue: string, mode: Mode) => string} [contrast]
 * @param {{ info: (message: string) => void; error: (message: string) => void }} [report]
 * @returns {0 | 1}
 */
export function main(contrast = contrastFor, report = { info: console.info, error: console.error }) {
  const { pairs, failures, worst } = collectResults(contrast);

  if (failures.length === 0) {
    report.info(
      `validate-contrast: OK — ${pairs.length} step-9/contrast pairs (${HUES.length} hues × light/dark) meet ` +
        `≥ ${TEXT_THRESHOLD}:1; lowest ${describePair(worst)}.`,
    );
    return 0;
  }

  report.error(`validate-contrast: FAIL — ${failures.length} contrast violation(s):`);
  for (const pair of failures) {
    report.error(`  - ${describePair(pair)} — below the ${TEXT_THRESHOLD}:1 floor.`);
  }
  report.error(
    `Each (hue × mode) step-9 solid must reach ${TEXT_THRESHOLD}:1 against contrastFor(hue, mode). ` +
      'There is no allowlist (AM-092): fix PER_HUE_CONTRAST or PER_HUE_CONTRAST_DARK in ' +
      'packages/line-schemas/src/contrast-table.ts and regenerate line-colors.',
  );
  return 1;
}

if (import.meta.main) {
  process.exitCode = main();
}
