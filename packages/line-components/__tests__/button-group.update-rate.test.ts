/**
 * `<line-button-group>` host update rate (spec `0004-button-group.md` Tests, Update rate row;
 * Phase 1 spec §6.C.1, §6.C.6, §6.C.7; §10 SD18; §12 AM-055).
 *
 * Drives a connected `<line-button-group>` with four buttons through
 * `measureHostUpdates` by toggling `loop`, the host property that feeds the
 * machine props on the C24 `updateProps({})` signal (spec AM-001). The
 * machine's `prop` reader is the one `initialState` receives, captured by
 * wrapping it for this test. The test prints the report for the C6 PR and
 * asserts only non-timing invariants; timing never gates CI.
 *
 * @module __tests__/button-group.update-rate
 */

import { expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { DEFAULT_CHECKPOINTS, formatUpdateRate, measureHostUpdates } from '@websublime/line-testing/update-rate';
import type { PropFn } from '@zag-js/core';
import '../src/button/index.js';
import { type ButtonGroupMachineSchema, buttonGroupMachine } from '../src/button-group/button-group-machine.js';
import { LineButtonGroup } from '../src/button-group/index.js';

test(
  'host update rate of a connected <line-button-group>',
  async () => {
    let prop: PropFn<ButtonGroupMachineSchema> | undefined;
    const { initialState } = buttonGroupMachine;
    buttonGroupMachine.initialState = (params) => {
      prop = params.prop;
      return initialState(params);
    };
    let el: LineButtonGroup;
    try {
      el = await fixture<LineButtonGroup>(
        html`<line-button-group aria-label="Text formatting">
          <line-button>Bold</line-button>
          <line-button>Italic</line-button>
          <line-button>Underline</line-button>
          <line-button>Strike</line-button>
        </line-button-group>`,
      );
    } finally {
      buttonGroupMachine.initialState = initialState;
    }

    const report = await measureHostUpdates({
      label: '<line-button-group>',
      host: el,
      mutate: (i) => {
        el.loop = i % 2 === 0;
      },
      readProp: () => prop?.('loop'),
    });
    console.info(formatUpdateRate(report));

    expect(el).toBeInstanceOf(LineButtonGroup);
    expect(report.samples.map((s) => s.updates)).toEqual([...DEFAULT_CHECKPOINTS]);
    for (const s of report.samples) {
      expect(Number.isFinite(s.updateMs) && s.updateMs >= 0).toBe(true);
      expect(Number.isFinite(s.propReadMs) && s.propReadMs >= 0).toBe(true);
    }
    // The machine reads the live host props on every update.
    expect(prop?.('loop')).toBe(el.loop);
    expect(prop?.('count')).toBe(4);
  },
  { timeout: 120_000 },
);
