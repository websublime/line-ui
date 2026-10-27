/**
 * Update-rate harness (Phase 1 spec §6.C.1, §10 SD18, SD28; §12 AM-020, L3R14-04).
 *
 * `LineMachineController` hands the component's props function to the
 * `VanillaMachine` constructor as a live source and signals every host update
 * with `updateProps({})` (D7; spec §6.C.7). The empty patch stores nothing, so
 * one host update should cost the same however many the instance has already
 * had. The harness measures that cost at increasing accumulated update counts
 * on ONE instance, fits it to a line and derives how many updates the instance
 * takes before one update crosses the budget.
 *
 * It measures and reports; it never gates on timing. Machine rows (C1, C5, C6,
 * C8, C11, C16) point `measureHostUpdates` at their own connected host and a
 * mutator of one host property that feeds the machine props, print the report
 * with `formatUpdateRate` and record it in their PR. A row whose rate exceeds
 * the budget stops and returns to the orchestrator (spec §6.C.1).
 *
 * @module __tests__/harness/update-rate
 */

import type { Machine, MachineSchema } from '@zag-js/core';
import type { ReactiveElement } from 'lit';
import { VanillaMachine } from '../../src/machine/index.js';

/**
 * Budget: wall time of one host update, in milliseconds (C21; spec §10 SD18).
 * On the C21 fixture one host update costs 0.02–0.04 ms at 100 accumulated
 * updates. [INFERENCE] 1 ms keeps about ten components streaming in the same
 * 16.7 ms frame inside a 10 ms scripting share.
 */
export const UPDATE_BUDGET_MS = 1;

/**
 * [INFERENCE] Peak host updates per second from an agent data binding that
 * streams into props. A token stream delivers 30–100 chunks/s, each in its own
 * task, so Lit cannot fold them into one update; 60/s is the frame rate a
 * renderer that batches per frame holds.
 */
export const ASSUMED_STREAM_RATE = 60;

/** [INFERENCE] Seconds one instance keeps receiving a stream at the peak rate: one long agent response. */
export const ASSUMED_STREAM_SECONDS = 60;

/**
 * Accumulated host updates on one instance after which one host update must
 * still cost at most `UPDATE_BUDGET_MS` (C21): `ASSUMED_STREAM_RATE` ×
 * `ASSUMED_STREAM_SECONDS`. A machine whose `maxUpdates` falls below it is past
 * the budget.
 */
export const BUDGET_UPDATES = ASSUMED_STREAM_RATE * ASSUMED_STREAM_SECONDS;

export const DEFAULT_CHECKPOINTS: readonly number[] = [100, 1_000, BUDGET_UPDATES];

export interface UpdateRateOptions {
  /** Accumulated update counts at which to sample; ascending. Default `DEFAULT_CHECKPOINTS`. */
  checkpoints?: readonly number[];
  /** Updates timed one by one at each checkpoint; the sample keeps their median. Default 31. */
  samples?: number;
  /** `prop()` reads timed one by one at each checkpoint; the sample keeps their median. Default 31. */
  reads?: number;
  /** Per-update budget in ms. Default `UPDATE_BUDGET_MS`. */
  budgetMs?: number;
}

export interface UpdateRateSample {
  /** Updates the instance had accumulated when this sample began. */
  updates: number;
  /** Median wall time of one update, in ms: a full host update, or one `updateProps` call plus one `prop()` read. */
  updateMs: number;
  /** Median wall time of one `prop()` read at this update count, in ms. */
  propReadMs: number;
}

export interface UpdateRateReport {
  label: string;
  /** `host`: one sample is a full host update; `chain`: one `updateProps({})` call plus one `prop()` read. */
  kind: 'host' | 'chain';
  budgetMs: number;
  samples: UpdateRateSample[];
  /** Least-squares fit `updateMs ≈ baseMs + slopeMs × updates` over the samples. */
  baseMs: number;
  slopeMs: number;
  /** Accumulated updates at which one update reaches `budgetMs`; `Infinity` when the cost does not grow. */
  maxUpdates: number;
}

/** What `measureHostUpdates` drives. */
export interface UpdateRateTarget {
  /** Report label, e.g. the component tag. */
  label: string;
  /** A connected host whose `LineMachineController` was given a props function. */
  host: ReactiveElement;
  /** Changes one host property that feeds the machine props; `i` counts the updates driven so far. */
  mutate(i: number): void;
  /** One machine `prop()` read through the controller, e.g. `() => host.ctrl.service?.prop('disabled')`. */
  readProp(): unknown;
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
};

function timeReads(readProp: () => unknown, reads: number): number {
  const times: number[] = [];
  for (let r = 0; r < reads; r++) {
    const start = performance.now();
    readProp();
    times.push(performance.now() - start);
  }
  return median(times);
}

function report(
  label: string,
  kind: UpdateRateReport['kind'],
  budgetMs: number,
  samples: UpdateRateSample[],
): UpdateRateReport {
  const n = samples.length;
  const meanX = samples.reduce((sum, s) => sum + s.updates, 0) / n;
  const meanY = samples.reduce((sum, s) => sum + s.updateMs, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const s of samples) {
    sxy += (s.updates - meanX) * (s.updateMs - meanY);
    sxx += (s.updates - meanX) ** 2;
  }
  const slopeMs = sxx > 0 ? sxy / sxx : 0;
  const baseMs = meanY - slopeMs * meanX;
  let maxUpdates = Number.POSITIVE_INFINITY;
  if (baseMs >= budgetMs) maxUpdates = 0;
  else if (slopeMs > 0) maxUpdates = Math.floor((budgetMs - baseMs) / slopeMs);
  return { label, kind, budgetMs, samples, baseMs, slopeMs, maxUpdates };
}

/**
 * Drives `target.host` through host updates, one `mutate` + `updateComplete`
 * each, and samples the wall time of one host update and of one `prop()` read
 * at every checkpoint. The update count covers only the updates the harness
 * drives, not the re-renders a machine transition adds.
 */
export async function measureHostUpdates(
  target: UpdateRateTarget,
  options: UpdateRateOptions = {},
): Promise<UpdateRateReport> {
  const { checkpoints = DEFAULT_CHECKPOINTS, samples = 31, reads = 31, budgetMs = UPDATE_BUDGET_MS } = options;
  const { host, mutate, readProp } = target;
  const result: UpdateRateSample[] = [];
  let driven = 0;
  for (const checkpoint of checkpoints) {
    while (driven < checkpoint) {
      mutate(driven++);
      await host.updateComplete;
    }
    const at = driven;
    const times: number[] = [];
    for (let s = 0; s < samples; s++) {
      const start = performance.now();
      mutate(driven++);
      await host.updateComplete;
      times.push(performance.now() - start);
    }
    result.push({ updates: at, updateMs: median(times), propReadMs: timeReads(readProp, reads) });
  }
  return report(target.label, 'host', budgetMs, result);
}

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
  return report(target.label, 'chain', budgetMs, result);
}

/**
 * Plain-text table of a report, for the test log and the machine row's PR. The
 * budget verdict applies to `host` reports only; a `chain` report is the
 * diagnostic of the bare `VanillaMachine` path alone.
 */
export function formatUpdateRate(report: UpdateRateReport): string {
  const ms = (value: number) => value.toFixed(4);
  const rows = report.samples.map(
    (s) =>
      `  ${String(s.updates).padStart(7)} | ${ms(s.updateMs).padStart(9)} | ${ms(s.propReadMs).padStart(9)} | ${(1000 / s.updateMs).toFixed(0).padStart(9)}`,
  );
  const seconds = report.maxUpdates / ASSUMED_STREAM_RATE;
  const verdict = report.maxUpdates >= BUDGET_UPDATES ? 'within budget' : 'PAST budget';
  return [
    `update rate — ${report.label} (${report.kind === 'host' ? 'full host update' : 'updateProps({}) + one prop() read'})`,
    `  budget: ${report.budgetMs} ms per host update after ${BUDGET_UPDATES} accumulated updates on one instance`,
    '  updates | update ms |   prop ms | updates/s',
    ...rows,
    `  fit: ${ms(report.baseMs)} ms + ${(report.slopeMs * 1000).toFixed(4)} µs × updates`,
    `  updates before one update reaches ${report.budgetMs} ms: ${report.maxUpdates} (${Number.isFinite(seconds) ? seconds.toFixed(0) : '∞'} s at ${ASSUMED_STREAM_RATE} updates/s)${report.kind === 'host' ? ` — ${verdict}` : ''}`,
  ].join('\n');
}
