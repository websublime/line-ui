/**
 * `<line-avatar-group>` host update rate (spec `0010-avatar-group.md` Tests, Update rate row; Phase 1 spec §6.C.1,
 * §6.C.6, §6.C.7; §10 SD18; §12 AM-055).
 *
 * Drives a connected `<line-avatar-group>` with five avatars through `measureHostUpdates` by switching `max` between
 * 2 and 3, which changes the machine prop `overflowCount` between 3 and 2 on the C24 `updateProps({})` signal
 * (decision D23). The machine's `prop` reader is the one `initialState` receives, captured by wrapping it for this
 * test. The test prints the report for the C11 PR and asserts only non-timing invariants; timing never gates CI.
 *
 * @module __tests__/avatar-group.update-rate
 */

import { expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { DEFAULT_CHECKPOINTS, formatUpdateRate, measureHostUpdates } from '@websublime/line-testing/update-rate';
import type { PropFn } from '@zag-js/core';
import { type AvatarGroupMachineSchema, avatarGroupMachine } from '../src/avatar-group/avatar-group-machine.js';
import { LineAvatarGroup } from '../src/avatar-group/index.js';

test(
  'host update rate of a connected <line-avatar-group>',
  async () => {
    let prop: PropFn<AvatarGroupMachineSchema> | undefined;
    const { initialState } = avatarGroupMachine;
    avatarGroupMachine.initialState = (params) => {
      prop = params.prop;
      return initialState(params);
    };
    let el: LineAvatarGroup;
    try {
      el = await fixture<LineAvatarGroup>(
        html`<line-avatar-group aria-label="Project members" max="3">
          <line-avatar name="Ana Silva"></line-avatar>
          <line-avatar name="Rui Costa"></line-avatar>
          <line-avatar name="Marta Sousa"></line-avatar>
          <line-avatar name="João Lima"></line-avatar>
          <line-avatar name="Inês Rocha"></line-avatar>
        </line-avatar-group>`,
      );
    } finally {
      avatarGroupMachine.initialState = initialState;
    }

    const report = await measureHostUpdates({
      label: '<line-avatar-group>',
      host: el,
      mutate: (i) => {
        el.max = i % 2 === 0 ? 2 : 3;
      },
      readProp: () => prop?.('overflowCount'),
    });
    console.info(formatUpdateRate(report));

    expect(el).toBeInstanceOf(LineAvatarGroup);
    expect(report.samples.map((s) => s.updates)).toEqual([...DEFAULT_CHECKPOINTS]);
    for (const s of report.samples) {
      expect(Number.isFinite(s.updateMs) && s.updateMs >= 0).toBe(true);
      expect(Number.isFinite(s.propReadMs) && s.propReadMs >= 0).toBe(true);
    }
    // The machine reads the live host props on every update.
    el.max = 2;
    await el.updateComplete;
    expect(prop?.('overflowCount')).toBe(3);
    el.max = 3;
    await el.updateComplete;
    expect(prop?.('overflowCount')).toBe(2);
  },
  { timeout: 120_000 },
);
