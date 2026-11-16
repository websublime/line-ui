/**
 * `<line-presence>` host update rate (spec `0017-presence.md` Tests, Update
 * rate row, D18; Phase 1 spec §6.C.1, §6.C.6, §6.C.7; §10 SD18; §12 AM-055).
 *
 * Drives a connected `<line-presence>` through `measureHostUpdates` by
 * toggling `present`, which feeds the `@zag-js/presence` machine props on the
 * C24 `updateProps({})` signal. The machine's `prop` reader is the one
 * `initialState` receives, captured by wrapping it for this test. The test
 * prints the report for the C16 PR and asserts only non-timing invariants;
 * timing never gates CI.
 *
 * @module __tests__/presence.update-rate
 */

import { expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { DEFAULT_CHECKPOINTS, formatUpdateRate, measureHostUpdates } from '@websublime/line-testing/update-rate';
import { machine } from '@zag-js/presence';
import { LinePresence } from '../src/presence/index.js';

type PropReader = Parameters<typeof machine.initialState>[0]['prop'];

test(
  'host update rate of a connected <line-presence>',
  async () => {
    let prop: PropReader | undefined;
    const { initialState } = machine;
    machine.initialState = (params) => {
      prop = params.prop;
      return initialState(params);
    };
    let el: LinePresence;
    try {
      el = await fixture<LinePresence>(html`<line-presence present><p>Content</p></line-presence>`);
    } finally {
      machine.initialState = initialState;
    }

    const report = await measureHostUpdates({
      label: '<line-presence>',
      host: el,
      mutate: (i) => {
        el.present = i % 2 === 0;
      },
      readProp: () => prop?.('present'),
    });
    console.info(formatUpdateRate(report));

    expect(el).toBeInstanceOf(LinePresence);
    expect(report.samples.map((s) => s.updates)).toEqual([...DEFAULT_CHECKPOINTS]);
    for (const s of report.samples) {
      expect(Number.isFinite(s.updateMs) && s.updateMs >= 0).toBe(true);
      expect(Number.isFinite(s.propReadMs) && s.propReadMs >= 0).toBe(true);
    }
    // The machine reads the live host props on every update.
    expect(prop?.('present')).toBe(el.present);
  },
  { timeout: 120_000 },
);
