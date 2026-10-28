/**
 * The Button press machine, shared by `<line-button>` and `<line-icon-button>`
 * (spec `0002-button.md` States; Phase 1 spec §6.C.5; ARCH §13.1).
 *
 * The press is the only finite state: `idle → active`. `disabled`, `loading`
 * and `pressed` are props that the `isInteractive` guard and the actions read
 * at event time. `ACTIVATE` flips a toggle through `onPressedChange`. A `watch`
 * cancels a running press when `disabled` or `loading` turns true. The module
 * knows nothing about forms or DOM events and imports no component
 * (MANIFESTO Law 4).
 *
 * @module shared/button-machine
 */

import { createMachine, type Service } from '@zag-js/core';

/** Machine props. A component passes them as a live function of its own properties. */
export interface ButtonMachineProps {
  disabled?: boolean | undefined;
  loading?: boolean | undefined;
  /** `undefined` means the button is not a toggle. */
  pressed?: boolean | undefined;
  /** Called with the next pressed state when an activation flips a toggle. */
  onPressedChange?: ((next: boolean) => void) | undefined;
}

export type ButtonMachineEvent =
  | { type: 'PRESS_START' }
  | { type: 'PRESS_END' }
  | { type: 'PRESS_CANCEL' }
  | { type: 'ACTIVATE' }
  | { type: 'FOCUS'; visible: boolean }
  | { type: 'BLUR' };

export interface ButtonMachineSchema {
  props: ButtonMachineProps;
  context: { focusVisible: boolean };
  state: 'idle' | 'active';
  guard: 'isInteractive';
  action: 'togglePressed' | 'setFocusVisible' | 'clearFocusVisible';
  event: ButtonMachineEvent;
}

export type ButtonService = Service<ButtonMachineSchema>;

export const buttonMachine = createMachine<ButtonMachineSchema>({
  initialState: () => 'idle',
  context: ({ bindable }) => ({
    focusVisible: bindable<boolean>(() => ({ defaultValue: false })),
  }),
  watch({ track, prop, guard, send }) {
    track([() => prop('disabled'), () => prop('loading')], () => {
      if (!guard('isInteractive')) send({ type: 'PRESS_CANCEL' });
    });
  },
  on: {
    ACTIVATE: { guard: 'isInteractive', actions: ['togglePressed'] },
    FOCUS: { actions: ['setFocusVisible'] },
    BLUR: { actions: ['clearFocusVisible'] },
  },
  states: {
    idle: {
      on: { PRESS_START: { target: 'active', guard: 'isInteractive' } },
    },
    active: {
      on: {
        PRESS_END: { target: 'idle' },
        PRESS_CANCEL: { target: 'idle' },
      },
    },
  },
  implementations: {
    guards: {
      isInteractive: ({ prop }) => !(prop('disabled') || prop('loading')),
    },
    actions: {
      togglePressed({ prop }) {
        const pressed = prop('pressed');
        if (pressed !== undefined) prop('onPressedChange')?.(!pressed);
      },
      setFocusVisible({ context, event }) {
        context.set('focusVisible', event.type === 'FOCUS' && event.visible === true);
      },
      clearFocusVisible({ context }) {
        context.set('focusVisible', false);
      },
    },
  },
});

/** What the inner native `<button>` and the host reflection read. */
export interface ButtonApi {
  active: boolean;
  /** `true` only on a pressed toggle. */
  pressed: boolean;
  loading: boolean;
  disabled: boolean;
  focusVisible: boolean;
  /** `!disabled && !loading`: whether an activation runs now. */
  interactive: boolean;
  /** ARIA and `disabled` for the inner `<button>`; an `undefined` attribute is left off. */
  buttonAttrs: {
    'aria-pressed': 'true' | 'false' | undefined;
    'aria-disabled': 'true' | undefined;
    disabled: boolean;
  };
}

function api(props: ButtonMachineProps, active: boolean, focusVisible: boolean): ButtonApi {
  const disabled = props.disabled === true;
  const loading = props.loading === true;
  return {
    active,
    pressed: props.pressed === true,
    loading,
    disabled,
    focusVisible,
    interactive: !(disabled || loading),
    buttonAttrs: {
      'aria-pressed': props.pressed === undefined ? undefined : (String(props.pressed) as 'true' | 'false'),
      'aria-disabled': loading && !disabled ? 'true' : undefined,
      disabled,
    },
  };
}

/** Reads the running machine at call time. */
export function connect(service: ButtonService): ButtonApi {
  const { prop } = service;
  return api(
    { disabled: prop('disabled'), loading: prop('loading'), pressed: prop('pressed') },
    service.state.matches('active'),
    service.context.get('focusVisible'),
  );
}

/** The same view without a machine, for the controller's static fallback (MANIFESTO Law 9). */
export function connectStatic(props: ButtonMachineProps): ButtonApi {
  return api(props, false, false);
}
