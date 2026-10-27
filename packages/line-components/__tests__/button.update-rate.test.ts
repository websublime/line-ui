/**
 * `<line-button>` host update rate (spec `0002-button.md` Tests, Update rate row;
 * Phase 1 spec §6.C.1, §6.C.6; §10 SD18; §12 AM-055).
 *
 * Drives a connected `<line-button>` through `measureHostUpdates` by flipping
 * `pressed`, which feeds the machine props. The machine's `prop` reader is the
 * one `initialState` receives, captured by wrapping it for this test. The test
 * prints the report for the C1 PR and asserts only non-timing invariants;
 * timing never gates CI.
 *
 * @module __tests__/button.update-rate
 */

import { expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { DEFAULT_CHECKPOINTS, formatUpdateRate, measureHostUpdates } from '@websublime/line-testing/update-rate';
import type { PropFn } from '@zag-js/core';
import { LineButton } from '../src/button/index.js';
import { type ButtonMachineSchema, buttonMachine } from '../src/shared/button-machine.js';

test(
  'host update rate of a connected <line-button>',
  async () => {
    let prop: PropFn<ButtonMachineSchema> | undefined;
    const { initialState } = buttonMachine;
    buttonMachine.initialState = (params) => {
      prop = params.prop;
      return initialState(params);
    };
    let el: LineButton;
    try {
      el = await fixture<LineButton>(html`<line-button type="button" pressed="false">Bold</line-button>`);
    } finally {
      buttonMachine.initialState = initialState;
    }

    const report = await measureHostUpdates({
      label: '<line-button>',
      host: el,
      mutate: (i) => {
        el.pressed = i % 2 === 0;
      },
      readProp: () => prop?.('pressed'),
    });
    console.info(formatUpdateRate(report));

    expect(el).toBeInstanceOf(LineButton);
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
