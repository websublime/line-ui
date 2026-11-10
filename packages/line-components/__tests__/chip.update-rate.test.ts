/**
 * `<line-chip>` host update rate (spec `0008-chip.md` Tests, Update rate row;
 * Phase 1 spec §6.C.1, §6.C.6, §6.C.7; §10 SD18; §12 AM-055).
 *
 * Drives a connected `<line-chip>` through `measureHostUpdates` by flipping
 * `pressed`, which feeds the `@zag-js/toggle` machine props on the C24
 * `updateProps({})` signal. The machine's `prop` reader is the one
 * `initialState` receives, captured by wrapping it for this test. The test
 * prints the report for the C8 PR and asserts only non-timing invariants;
 * timing never gates CI.
 *
 * @module __tests__/chip.update-rate
 */

import { expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { DEFAULT_CHECKPOINTS, formatUpdateRate, measureHostUpdates } from '@websublime/line-testing/update-rate';
import { machine } from '@zag-js/toggle';
import { LineChip } from '../src/chip/index.js';

type PropReader = Parameters<typeof machine.initialState>[0]['prop'];

test(
  'host update rate of a connected <line-chip>',
  async () => {
    let prop: PropReader | undefined;
    const { initialState } = machine;
    machine.initialState = (params) => {
      prop = params.prop;
      return initialState(params);
    };
    let el: LineChip;
    try {
      el = await fixture<LineChip>(html`<line-chip>In stock</line-chip>`);
    } finally {
      machine.initialState = initialState;
    }

    const report = await measureHostUpdates({
      label: '<line-chip>',
      host: el,
      mutate: (i) => {
        el.pressed = i % 2 === 0;
      },
      readProp: () => prop?.('pressed'),
    });
    console.info(formatUpdateRate(report));

    expect(el).toBeInstanceOf(LineChip);
    expect(report.samples.map((s) => s.updates)).toEqual([...DEFAULT_CHECKPOINTS]);
    for (const s of report.samples) {
      expect(Number.isFinite(s.updateMs) && s.updateMs >= 0).toBe(true);
      expect(Number.isFinite(s.propReadMs) && s.propReadMs >= 0).toBe(true);
    }
    // The machine reads the live host props on every update.
    expect(prop?.('pressed')).toBe(el.pressed);
  },
  { timeout: 120_000 },
);
