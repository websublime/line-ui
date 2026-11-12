/**
 * The AvatarGroup machine (spec `0010-avatar-group.md` States; Phase 1 spec
 * §6.C.4 C11 row; ARCH §13.2).
 *
 * Three states on ARCH §13.2's strict chain, `collapsed ↔ expanded ↔
 * overflow_open` (decision F12). The context records whether a mouse or pen
 * pointer is on the group (`hovered`), whether keyboard focus is within it
 * (`focused`), and whether Escape dismissed the expansion (`dismissed`,
 * decision D25). The host passes the number of children past `max` and the
 * callback that focuses the overflow button as live props. The module knows
 * nothing about the DOM and imports no component (MANIFESTO Law 4).
 *
 * The platform opens and closes the panel; the machine follows its `toggle`
 * events through `OPEN.CHANGE` (decision F1). One open passes `collapsed →
 * expanded → overflow_open`: the `forward` action sends the same event again.
 * One close passes `overflow_open → expanded`, and the `settle` action's
 * `SETTLE` moves on to `collapsed` when no source remains or the expansion was
 * dismissed.
 *
 * Zag picks a transition by event type only and runs its guards before its
 * actions, so the `OPEN.CHANGE` transitions read `event.open` through
 * `isOpening` and `isClosing`, and `noSource` reads `hovered` as `false` on
 * `HOVER.END` and `focused` as `false` on `FOCUS.OUT` (spec AM-001).
 *
 * `send()` runs in a microtask (`@zag-js/vanilla` 1.47.0), so the host reads
 * the state in `update()` and never right after sending.
 *
 * @module avatar-group/avatar-group-machine
 */

import { createGuards, createMachine, type Params, type Transition } from '@zag-js/core';

/** Machine props. The host passes them as a live function of its own state. */
export interface AvatarGroupMachineProps {
  /** The number of children past `max`; `0` when none (decision D23). */
  overflowCount: number;
  /** Focuses the overflow button (decision D7). */
  restoreFocus: () => void;
}

export type AvatarGroupMachineEvent =
  | { type: 'HOVER.START' }
  | { type: 'HOVER.END' }
  | { type: 'FOCUS.IN' }
  | { type: 'FOCUS.OUT' }
  | { type: 'DISMISS' }
  /**
   * The panel's `toggle` event: `open` from `ToggleEvent.newState` (decision D22), and `focusInside` from the
   * `beforetoggle` that preceded a close (decision D7).
   */
  | { type: 'OPEN.CHANGE'; open: boolean; focusInside: boolean }
  | { type: 'SETTLE' };

export type AvatarGroupMachineState = 'collapsed' | 'expanded' | 'overflow_open';

export interface AvatarGroupMachineSchema {
  props: AvatarGroupMachineProps;
  context: { hovered: boolean; focused: boolean; dismissed: boolean };
  state: AvatarGroupMachineState;
  action:
    | 'setHovered'
    | 'clearHovered'
    | 'setFocused'
    | 'clearFocused'
    | 'setDismissed'
    | 'clearDismissed'
    | 'forward'
    | 'settle'
    | 'restore';
  guard: 'notDismissed' | 'noSource' | 'settles' | 'hasOverflow' | 'isOpening' | 'isClosing';
  event: AvatarGroupMachineEvent;
}

type MachineParams = Params<AvatarGroupMachineSchema>;

const { and } = createGuards<AvatarGroupMachineSchema>();

/** Neither a pointer nor keyboard focus on the group once the current event applies (spec AM-001). */
function noSource({ context, event }: MachineParams): boolean {
  const hovered = event.type === 'HOVER.END' ? false : context.get('hovered');
  const focused = event.type === 'FOCUS.OUT' ? false : context.get('focused');
  return !(hovered || focused);
}

/** The events that only update `hovered` and `focused`, as every state handles them (States, "Context in every state"). */
const TRACK: Record<'HOVER.START' | 'HOVER.END' | 'FOCUS.IN' | 'FOCUS.OUT', Transition<AvatarGroupMachineSchema>> = {
  'HOVER.START': { actions: ['setHovered'] },
  'HOVER.END': { actions: ['clearHovered', 'clearDismissed'] },
  'FOCUS.IN': { actions: ['setFocused'] },
  'FOCUS.OUT': { actions: ['clearFocused', 'clearDismissed'] },
};

export const avatarGroupMachine = createMachine<AvatarGroupMachineSchema>({
  initialState: () => 'collapsed',
  context: ({ bindable }) => ({
    hovered: bindable<boolean>(() => ({ defaultValue: false })),
    focused: bindable<boolean>(() => ({ defaultValue: false })),
    dismissed: bindable<boolean>(() => ({ defaultValue: false })),
  }),
  states: {
    collapsed: {
      on: {
        ...TRACK,
        'HOVER.START': [
          { guard: 'notDismissed', target: 'expanded', actions: ['setHovered'] },
          { actions: ['setHovered'] },
        ],
        'FOCUS.IN': [
          { guard: 'notDismissed', target: 'expanded', actions: ['setFocused'] },
          { actions: ['setFocused'] },
        ],
        'OPEN.CHANGE': { guard: and('isOpening', 'hasOverflow'), target: 'expanded', actions: ['forward'] },
      },
    },
    expanded: {
      on: {
        ...TRACK,
        'HOVER.END': [
          { guard: 'noSource', target: 'collapsed', actions: ['clearHovered', 'clearDismissed'] },
          { actions: ['clearHovered', 'clearDismissed'] },
        ],
        'FOCUS.OUT': [
          { guard: 'noSource', target: 'collapsed', actions: ['clearFocused', 'clearDismissed'] },
          { actions: ['clearFocused', 'clearDismissed'] },
        ],
        DISMISS: { target: 'collapsed', actions: ['setDismissed'] },
        SETTLE: { guard: 'settles', target: 'collapsed' },
        'OPEN.CHANGE': { guard: and('isOpening', 'hasOverflow'), target: 'overflow_open' },
      },
    },
    overflow_open: {
      on: {
        // `HOVER.END` only clears `hovered`, so the pointer on the top-layer panel never collapses the group (probe P1).
        ...TRACK,
        'OPEN.CHANGE': { guard: 'isClosing', target: 'expanded', actions: ['restore', 'settle'] },
      },
    },
  },
  implementations: {
    guards: {
      notDismissed: ({ context }) => !context.get('dismissed'),
      noSource,
      settles: (params) => noSource(params) || params.context.get('dismissed'),
      hasOverflow: ({ prop }) => prop('overflowCount') > 0,
      isOpening: ({ event }) => event.type === 'OPEN.CHANGE' && event.open,
      isClosing: ({ event }) => event.type === 'OPEN.CHANGE' && !event.open,
    },
    actions: {
      setHovered: ({ context }) => context.set('hovered', true),
      clearHovered: ({ context }) => context.set('hovered', false),
      setFocused: ({ context }) => context.set('focused', true),
      clearFocused: ({ context }) => context.set('focused', false),
      setDismissed: ({ context }) => context.set('dismissed', true),
      // Clears only once the pointer and keyboard focus have both left the group (decision D25).
      clearDismissed: ({ context }) => {
        if (!(context.get('hovered') || context.get('focused'))) context.set('dismissed', false);
      },
      forward: ({ event, send }) => send(event.current()),
      settle: ({ send }) => send({ type: 'SETTLE' }),
      restore: ({ event, prop }) => {
        if (event.type === 'OPEN.CHANGE' && event.focusInside) prop('restoreFocus')();
      },
    },
  },
});
