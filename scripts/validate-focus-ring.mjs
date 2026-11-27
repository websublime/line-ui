#!/usr/bin/env bun

/**
 * scripts/validate-focus-ring.mjs — focus-ring contrast validator (ledger 01-Z31, AM-093).
 *
 * Spec: docs/specs/00-spec-design-system.md §6.C.3, **Focus-ring contrast validation**; the value it gates is
 * §6.C.2, **Focus-ring colour**; the CI step is in the §6.F.5 `checks.yml` block.
 *
 *   bun run scripts/validate-focus-ring.mjs
 *
 * PRD §9.2 requires the focus ring to meet WCAG 2.1 SC 1.4.11, 3:1 against the colours adjacent to it. The ring
 * sits outside the component, on the surface the component is on, and its colour resolves on `html`, so a nested
 * `data-accent` or `data-gray` scope can put it on any hue's surface steps.
 *
 * The script reads the shipped `--line-focus-ring-color` from `packages/line-tokens/src/focus-ring.css`, which must
 * be exactly one `var(--line-accent-N)` declaration with N from 1 to 12; any other form fails, so the step measured
 * is the step that ships. For each mode and each of the 31 `HUES` as the ring hue, it compares step N with every
 * distinct surface: steps 2–3 of the 31 `HUES`, steps 1–3 of the 6 `GRAY_HUES` and step 3 of the 4 `SEMANTIC_MAP`
 * hues (the Alert fills). The listed 84 surfaces dedupe to 68, so 68 × 31 × 2 = 4 216 pairs. No allowlist.
 *
 * Hex values come from `@radix-ui/colors` base scales (light `{H}`, dark `{H}Dark`, step key `{H}{step}`); P3 is
 * not validated, for the reason given under C5. The ratio math is the shared `contrastRatio` of
 * `packages/line-utils/src/contrast.ts`, imported from source as `validate-contrast.mjs` does. The bar is this
 * script's own SC 1.4.11 constant, not that module's `THRESHOLD`, which serves the text pairs.
 *
 * `parseFocusRingStep` and `checkFocusRing` are exported for `scripts/__tests__/validate-focus-ring.test.ts`; the
 * CLI runs under `import.meta.main`.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as radixColors from '@radix-ui/colors';
import { GRAY_HUES, HUES } from '../packages/line-schemas/src/hues.ts';
import { SEMANTIC_MAP } from '../packages/line-schemas/src/semantic-map.ts';
import { contrastRatio } from '../packages/line-utils/src/contrast.ts';
import { radixSource } from './radix-sources.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const FOCUS_RING_CSS = resolve(ROOT, 'packages/line-tokens/src/focus-ring.css');

/** WCAG 2.1 SC 1.4.11 non-text contrast minimum. Independent of `THRESHOLD` in `line-utils/src/contrast.ts`. */
export const NON_TEXT_MIN_RATIO = 3;

export const MODES = /** @type {const} */ (['light', 'dark']);

const DECLARATION = /--line-focus-ring-color\s*:\s*([^;}]*)/g;
const ACCENT_VAR = /^var\(\s*--line-accent-([1-9]|1[0-2])\s*\)$/;

/**
 * The accent step N of the single `--line-focus-ring-color: var(--line-accent-N)` declaration in `css`. Throws, naming
 * the value found, on any other form (literal colour, another role, a `var()` fallback, `light-dark()`,
 * `color-mix()`, N outside 1–12) and on a missing or repeated declaration.
 * @param {string} css
 * @returns {number}
 */
export function parseFocusRingStep(css) {
  const values = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(DECLARATION)].map((match) => match[1].trim());
  if (values.length !== 1) {
    throw new Error(
      `expected exactly one --line-focus-ring-color declaration in focus-ring.css, found ${values.length}` +
        (values.length > 0 ? `: ${values.map((value) => JSON.stringify(value)).join(', ')}` : ''),
    );
  }
  const step = ACCENT_VAR.exec(values[0]);
  if (!step) {
    throw new Error(
      `--line-focus-ring-color is ${JSON.stringify(values[0])}; it must be var(--line-accent-N) with N from 1 to 12 ` +
        '(Phase 00 spec §6.C.3, AM-093).',
    );
  }
  return Number(step[1]);
}

/**
 * Every distinct surface the ring can sit on, as `{ hue, step }`: steps 2–3 of the 31 hues, steps 1–3 of the 6
 * gray hues and step 3 of the 4 semantic hues, overlaps counted once (68).
 * @returns {{ hue: string; step: number }[]}
 */
export function surfaces() {
  const listed = [
    ...HUES.flatMap((hue) => [2, 3].map((step) => ({ hue, step }))),
    ...GRAY_HUES.flatMap((hue) => [1, 2, 3].map((step) => ({ hue, step }))),
    ...Object.values(SEMANTIC_MAP).map((hue) => ({ hue, step: 3 })),
  ];
  const seen = new Map();
  for (const surface of listed) seen.set(`${surface.hue}-${surface.step}`, surface);
  return [...seen.values()];
}

/**
 * The base-scale hex of `hue` at `step` in `mode`, throwing if @radix-ui/colors lacks the scale or the step.
 * @param {string} hue
 * @param {number} step
 * @param {'light' | 'dark'} mode
 * @returns {string}
 */
function hex(hue, step, mode) {
  const src = radixSource(hue);
  const name = mode === 'dark' ? `${src}Dark` : src;
  // biome-ignore lint/performance/noDynamicNamespaceImportAccess: the validator resolves scales by computed name
  const value = radixColors[name]?.[`${src}${step}`];
  if (value === undefined) throw new Error(`@radix-ui/colors ${name}.${src}${step} is undefined`);
  return value;
}

/**
 * Compares step `ringStep` of each of the 31 hues with every surface of `surfaces()`, in light and dark.
 * @param {number} ringStep
 * @returns {{
 *   pairCount: number;
 *   failures: { mode: string; ringHue: string; surfaceHue: string; surfaceStep: number; ratio: number }[];
 *   lowest: Record<string, { ringHue: string; surfaceHue: string; surfaceStep: number; ratio: number }>;
 * }}
 */
export function checkFocusRing(ringStep) {
  const failures = [];
  /** @type {Record<string, { ringHue: string; surfaceHue: string; surfaceStep: number; ratio: number }>} */
  const lowest = {};
  const surfaceList = surfaces();
  let pairCount = 0;
  for (const mode of MODES) {
    for (const ringHue of HUES) {
      const ring = hex(ringHue, ringStep, mode);
      for (const { hue: surfaceHue, step: surfaceStep } of surfaceList) {
        pairCount += 1;
        const ratio = contrastRatio(ring, hex(surfaceHue, surfaceStep, mode));
        const pair = { ringHue, surfaceHue, surfaceStep, ratio };
        if (!lowest[mode] || ratio < lowest[mode].ratio) lowest[mode] = pair;
        if (ratio + 1e-9 < NON_TEXT_MIN_RATIO) failures.push({ mode, ...pair });
      }
    }
  }
  return { pairCount, failures, lowest };
}

/**
 * One pair as printed: mode, ring hue and step, surface hue and step, and ratio.
 * @param {number} ringStep
 * @param {{ mode: string; ringHue: string; surfaceHue: string; surfaceStep: number; ratio: number }} pair
 * @returns {string}
 */
export function describePair(ringStep, { mode, ringHue, surfaceHue, surfaceStep, ratio }) {
  return `${mode}: ring ${ringHue} ${ringStep} on ${surfaceHue} ${surfaceStep} = ${ratio.toFixed(2)}:1`;
}

if (import.meta.main) {
  try {
    const ringStep = parseFocusRingStep(readFileSync(FOCUS_RING_CSS, 'utf8'));
    const { pairCount, failures, lowest } = checkFocusRing(ringStep);
    if (failures.length > 0) {
      console.error(
        `validate-focus-ring: FAIL — ${failures.length} of ${pairCount} pairs put var(--line-accent-${ringStep}) ` +
          `below ${NON_TEXT_MIN_RATIO}:1 (WCAG 2.1 SC 1.4.11; Phase 00 spec §6.C.3, AM-093):`,
      );
      for (const failure of failures) console.error(`  - ${describePair(ringStep, failure)}`);
      process.exit(1);
    }
    const lows = MODES.map((mode) => describePair(ringStep, { mode, ...lowest[mode] })).join('; ');
    console.info(
      `validate-focus-ring: OK — ${pairCount} ring/surface pairs for var(--line-accent-${ringStep}) meet ` +
        `≥ ${NON_TEXT_MIN_RATIO}:1; lowest per mode: ${lows}.`,
    );
  } catch (err) {
    console.error(`validate-focus-ring: ${err.message}`);
    process.exit(1);
  }
}
