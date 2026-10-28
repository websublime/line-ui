/**
 * Update-rate harness, bare-machine half (Phase 1 spec §6.C.1, §10 SD18, SD28; §12 AM-020, AM-055).
 *
 * `measureVanillaChain` runs the update-rate measurement of
 * `@websublime/line-testing/update-rate` on a bare `VanillaMachine`, without
 * Lit. It stays in `line-core` because it constructs a `VanillaMachine`, which
 * only `line-core` may import. The budget constants, the report types and
 * `formatUpdateRate` live in `@websublime/line-testing/update-rate`.
 *
 * @module __tests__/harness/update-rate
 */

import {
  DEFAULT_CHECKPOINTS,
  fitUpdateRate,
  median,
  timeReads,
  UPDATE_BUDGET_MS,
  type UpdateRateOptions,
  type UpdateRateReport,
  type UpdateRateSample,
} from '@websublime/line-testing/update-rate';
import type { Machine, MachineSchema } from '@zag-js/core';
import { VanillaMachine } from '../../src/machine/index.js';

/** What `measureVanillaChain` drives. */
export interface VanillaChainTarget<T extends MachineSchema> {
  label: string;
  machine: Machine<T>;
  /** The props function a component would hand the controller; it reads state that `mutate` changes. */
  props: () => Partial<T['props']>;
  /** Changes the state `props` reads; `i` counts the `updateProps` calls so far. */
  mutate(i: number): void;
  /** The prop each sample reads. */
  key: keyof T['props'];
}

/**
 * The same measurement on a bare `VanillaMachine`, without Lit, wired as the
 * controller wires it: `props` goes to the constructor only, and every driven
 * update and every sample calls `updateProps({})`. One sample is `mutate` + one
 * `updateProps({})` call + one `prop(key)` read (R7 §2.3, probe P4).
 */
export function measureVanillaChain<T extends MachineSchema>(
  target: VanillaChainTarget<T>,
  options: UpdateRateOptions = {},
): UpdateRateReport {
  const { checkpoints = DEFAULT_CHECKPOINTS, samples = 31, reads = 31, budgetMs = UPDATE_BUDGET_MS } = options;
  const { machine, props, mutate, key } = target;
  const vanilla = new VanillaMachine(machine, props);
  vanilla.start();
  const result: UpdateRateSample[] = [];
  let calls = 0;
  try {
    for (const checkpoint of checkpoints) {
      while (calls < checkpoint) {
        mutate(calls++);
        vanilla.updateProps({});
      }
      const at = calls;
      const times: number[] = [];
      for (let s = 0; s < samples; s++) {
        const start = performance.now();
        mutate(calls++);
        vanilla.updateProps({});
        vanilla.prop(key);
        times.push(performance.now() - start);
      }
      result.push({ updates: at, updateMs: median(times), propReadMs: timeReads(() => vanilla.prop(key), reads) });
    }
  } finally {
    vanilla.stop();
  }
  return fitUpdateRate(target.label, 'chain', budgetMs, result);
}
