/**
 * C21 update-rate measurement on a fixture machine (Phase 1 spec §6.C.1,
 * §10 SD18, SD28; §12 AM-020, L3R14-04).
 *
 * No component machine exists before C1, so the budget is set on this fixture:
 * a `createMachine` whose `level` prop is read by a guard and tracked by a
 * `watch`. The test prints the harness report and asserts only non-timing
 * invariants; timing never gates CI.
 *
 * @module __tests__/update-rate
 */

import { describe, expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { createMachine } from '@zag-js/core';
import { html as litHtml, type PropertyDeclarations } from 'lit';
import { LineElement } from '../src/line-element.js';
import { LineMachineController } from '../src/machine/index.js';
import {
  DEFAULT_CHECKPOINTS,
  formatUpdateRate,
  measureHostUpdates,
  measureVanillaChain,
  type UpdateRateReport,
} from './harness/update-rate.js';

interface FixtureSchema {
  props: { level?: number; limit?: number };
  refs: { seen: number };
  state: 'idle' | 'stepped';
  guard: 'isBelowLimit';
  action: 'recordLevel';
  event: { type: 'STEP' };
}

/** `STEP` is guarded by the `level` prop; a `watch` on `level` writes a ref, which re-renders nothing. */
const fixtureMachine = createMachine<FixtureSchema>({
  initialState: () => 'idle',
  refs: () => ({ seen: 0 }),
  watch({ track, prop, action }) {
    track([() => prop('level')], () => action(['recordLevel']));
  },
  states: {
    idle: { on: { STEP: { target: 'stepped', guard: 'isBelowLimit' } } },
    stepped: {},
  },
  implementations: {
    guards: {
      isBelowLimit: ({ prop }) => (prop('level') ?? 0) < (prop('limit') ?? Number.POSITIVE_INFINITY),
    },
    actions: {
      recordLevel: ({ prop, refs }) => refs.set('seen', prop('level') ?? 0),
    },
  },
});

class RateHost extends LineElement {
  static override properties: PropertyDeclarations = { level: { type: Number } };
  declare level: number;
  readonly ctrl = new LineMachineController<FixtureSchema>(this, {
    machine: fixtureMachine,
    props: () => ({ level: this.level, limit: 1_000_000 }),
  });
  renders = 0;

  constructor() {
    super();
    this.level = 0;
  }

  override render() {
    this.renders += 1;
    return litHtml`<p>${this.ctrl.state?.get()}</p>`;
  }
}
customElements.define('line-test-update-rate', RateHost);

function expectWellFormed(report: UpdateRateReport) {
  expect(report.samples.map((s) => s.updates)).toEqual([...DEFAULT_CHECKPOINTS]);
  for (const s of report.samples) {
    expect(Number.isFinite(s.updateMs) && s.updateMs >= 0).toBe(true);
    expect(Number.isFinite(s.propReadMs) && s.propReadMs >= 0).toBe(true);
  }
  expect(report.maxUpdates).toBeGreaterThanOrEqual(0);
}

describe('update-rate harness (C21 fixture machine)', () => {
  test('bare VanillaMachine: updateProps({}) + one prop() read', () => {
    let level = 0;
    const report = measureVanillaChain({
      label: 'fixture machine, VanillaMachine',
      machine: fixtureMachine,
      props: () => ({ level, limit: 1_000_000 }),
      mutate: (i) => {
        level = i + 1;
      },
      key: 'level',
    });
    console.info(formatUpdateRate(report));
    expectWellFormed(report);
  });

  test(
    'full host update through LineMachineController',
    async () => {
      const el = await fixture<RateHost>(html`<line-test-update-rate></line-test-update-rate>`);
      const rendersBefore = el.renders;
      let driven = 0;
      const report = await measureHostUpdates({
        label: 'fixture machine, <line-test-update-rate>',
        host: el,
        mutate: (i) => {
          el.level = i + 1;
          driven++;
        },
        readProp: () => el.ctrl.service?.prop('level'),
      });
      console.info(formatUpdateRate(report));
      expectWellFormed(report);

      // One render per driven update: no update loop, whatever the update count.
      expect(el.renders - rendersBefore).toBe(driven);
      // The watch re-ran on every update, and the guard reads the last level on the next event.
      expect(el.ctrl.refs?.get('seen')).toBe(driven);
      expect(el.ctrl.service?.prop('level')).toBe(driven);
      el.ctrl.send({ type: 'STEP' });
      await Promise.resolve();
      expect(el.ctrl.state?.get()).toBe('stepped');
    },
    { timeout: 120_000 },
  );
});
