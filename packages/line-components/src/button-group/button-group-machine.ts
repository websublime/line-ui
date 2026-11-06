/**
 * The ButtonGroup roving-focus machine (spec `0004-button-group.md` States;
 * Phase 1 spec §6.C.4 C6 row, §6.C.5; §10 SD10).
 *
 * One finite state, `idle`. The roving position is context, `activeIndex`,
 * `-1` when no item can take focus. The host passes the item count, which
 * items the arrow keys pass over, whether the arrows wrap, and the callback
 * that focuses an item, as live props. The module knows nothing about the DOM
 * and imports no component (MANIFESTO Law 4).
 *
 * `send()` runs in a microtask (`@zag-js/vanilla` 1.47.0; spec probe P7), so
 * the host never reads `activeIndex` right after sending: it writes the tab
 * stops from `onMove` and in `updated()`.
 *
 * @module button-group/button-group-machine
 */

import { createMachine } from '@zag-js/core';

/** Machine props. The host passes them as a live function of its own state. */
export interface ButtonGroupMachineProps {
  /** How many items the group holds now. */
  count: number;
  /** `true` for an item the arrow keys pass over: a disabled button. */
  isSkipped: (index: number) => boolean;
  /** Whether the arrow keys wrap from the last item to the first and back. */
  loop: boolean;
  /** Focuses the item at `index`; the host also writes the tab stops there. */
  onMove: (index: number) => void;
}

export type ButtonGroupMachineEvent =
  | { type: 'MOVE'; to: 'next' | 'prev' | 'first' | 'last' }
  | { type: 'FOCUS_ITEM'; index: number }
  /**
   * After the items or their `disabled` state changed. `index` is the index the active element now has,
   * or the index it had when it left the items or turned disabled. `focus` asks `sync` to focus the item
   * it lands on, because the focused button was lost (spec decisions D12, D13, D16).
   */
  | { type: 'SYNC'; index: number; focus: boolean };

export interface ButtonGroupMachineSchema {
  props: ButtonGroupMachineProps;
  context: { activeIndex: number };
  state: 'idle';
  action: 'move' | 'setActive' | 'sync';
  event: ButtonGroupMachineEvent;
}

type PropReader = <K extends keyof ButtonGroupMachineProps>(key: K) => ButtonGroupMachineProps[K];

/** The first item from `start`, stepping by `step`, that the arrows do not pass over; `-1` when none. */
function scan(prop: PropReader, start: number, step: 1 | -1, loop: boolean): number {
  const count = prop('count');
  const isSkipped = prop('isSkipped');
  for (let n = 0, i = start; n < count; n++, i += step) {
    if (i < 0 || i >= count) {
      if (!loop) return -1;
      i = (i + count) % count;
    }
    if (!isSkipped(i)) return i;
  }
  return -1;
}

export const buttonGroupMachine = createMachine<ButtonGroupMachineSchema>({
  initialState: () => 'idle',
  context: ({ bindable }) => ({
    activeIndex: bindable<number>(() => ({ defaultValue: 0 })),
  }),
  states: {
    idle: {
      on: {
        MOVE: { actions: ['move'] },
        FOCUS_ITEM: { actions: ['setActive'] },
        SYNC: { actions: ['sync'] },
      },
    },
  },
  implementations: {
    actions: {
      move({ context, event, prop }) {
        if (event.type !== 'MOVE') return;
        const current = context.get('activeIndex');
        const last = prop('count') - 1;
        let target: number;
        if (event.to === 'first') target = scan(prop, 0, 1, false);
        else if (event.to === 'last') target = scan(prop, last, -1, false);
        else if (event.to === 'next') target = scan(prop, current + 1, 1, prop('loop'));
        else target = scan(prop, current - 1, -1, prop('loop'));
        if (target < 0 || target === current) return;
        context.set('activeIndex', target);
        prop('onMove')(target);
      },
      setActive({ context, event }) {
        if (event.type === 'FOCUS_ITEM') context.set('activeIndex', event.index);
      },
      sync({ context, event, prop }) {
        if (event.type !== 'SYNC') return;
        const count = prop('count');
        const from = Math.max(0, Math.min(event.index, count));
        // The item at `from` if it can take focus, else the next one, else the previous one (decision D12).
        let target = scan(prop, from, 1, false);
        if (target < 0) target = scan(prop, from - 1, -1, false);
        context.set('activeIndex', target);
        if (event.focus && target >= 0) prop('onMove')(target);
      },
    },
  },
});
