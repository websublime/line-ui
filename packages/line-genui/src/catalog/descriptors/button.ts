import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Button descriptor (`docs/specs/0002-button.md` Descriptor fields). */
export const buttonDescriptor = defineDescriptor({
  name: 'Button',
  tag: 'line-button',
  load: () => import('@websublime/line-components/button'),
  description:
    'A button that runs an action when the user activates it. Put its visible text in the default slot (`child`); a button without text needs `accessibility.label`. `variant` marks emphasis, with `primary` for the main action of a view, `borderless` for a low-emphasis action and `default` otherwise. `type` defaults to `submit`, so inside a form the button submits it; set `type` to `button` for an action that must not submit, or `reset` to clear the form. Set `disabled` when the action is unavailable and `loading` while it runs; a loading button stays focusable and ignores presses. Set `pressed` to `true` or `false` to make a toggle, so each press flips it and fires `line-change` with the new value. Leave `pressed` unset for a plain button.',
  props: {
    variant: z
      .enum(['default', 'primary', 'borderless'])
      .describe(
        'Emphasis: `primary` for the main action of a view, `borderless` for a low-emphasis action, `default` otherwise.',
      )
      .optional(),
    type: z
      .enum(['submit', 'reset', 'button'])
      .describe(
        'What the button does to a form it sits in: `submit` (default) submits it, `reset` clears it, `button` does neither.',
      )
      .optional(),
    disabled: commonProp('DynamicBoolean', 'Whether the action is unavailable.').optional(),
    loading: commonProp(
      'DynamicBoolean',
      'Whether the action is running; the button stays focusable and ignores presses.',
    ).optional(),
    pressed: commonProp(
      'DynamicBoolean',
      'The toggle state; set it to make a toggle button, and leave it unset for a plain button.',
    ).optional(),
    name: commonProp(
      'DynamicString',
      'The form field name that `value` goes under when the button submits a form.',
    ).optional(),
    value: commonProp('DynamicString', 'The value sent under `name` when the button submits a form.').optional(),
    child: commonProp('ComponentId', 'The ID of the component that holds the visible text, usually a Text.').optional(),
    action: commonProp('Action', 'The action that runs when the user activates the button.').optional(),
  },
  slots: { child: '' },
  bindings: {
    props: {
      variant: { kind: 'attribute', name: 'variant' },
      type: { kind: 'attribute', name: 'type' },
      disabled: { kind: 'attribute', name: 'disabled' },
      loading: { kind: 'attribute', name: 'loading' },
      name: { kind: 'attribute', name: 'name' },
      value: { kind: 'attribute', name: 'value' },
      pressed: { kind: 'property', name: 'pressed' },
    },
    value: { prop: 'pressed', commitEvent: 'line-change' },
  },
  actions: { action: { event: 'click', native: true } },
  accessibility: {
    requiredName: [{ kind: 'childText', prop: 'child' }, { kind: 'accessibilityLabel' }],
    hostNaming: { kind: 'always' },
  },
});
