import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The IconButton descriptor (`docs/specs/0003-icon-button.md` Descriptor fields). */
export const iconButtonDescriptor = defineDescriptor({
  name: 'IconButton',
  tag: 'line-icon-button',
  load: () => import('@websublime/line-components/icon-button'),
  description:
    'A square button that shows only an icon and runs an action when the user activates it. Put an Icon in the default slot (`child`). It has no visible text, so it needs `accessibility.label`, the name assistive technology announces; a node without one is not rendered. `variant` marks emphasis, with `primary` for the main action of a view, `borderless` for a low-emphasis action and `default` otherwise. Set `disabled` when the action is unavailable and `loading` while it runs; a loading button stays focusable and ignores presses. Set `pressed` to `true` or `false` to make a toggle, so each press flips it and fires `line-change` with the new value. Leave `pressed` unset for a plain button. For a button with visible text, use Button.',
  toolDescription:
    'A square button that shows only an icon and runs an action when the user activates it. The tool sets no icon. Set `accessibilityLabel` to the text the button stands for; the app gives the button that text as its accessible name, and a button without it has no name. `variant` marks emphasis, with `primary` for the main action of a view, `borderless` for a low-emphasis action and `default` otherwise. Set `disabled` when the action is unavailable and `loading` while it runs; a loading button stays focusable and ignores presses. Set `pressed` to `true` or `false` to make a toggle, so each press flips it and fires `line-change` with the new value. Leave `pressed` unset for a plain button.',
  props: {
    variant: z
      .enum(['default', 'primary', 'borderless'])
      .describe(
        'Emphasis: `primary` for the main action of a view, `borderless` for a low-emphasis action, `default` otherwise.',
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
    child: commonProp('ComponentId', 'The ID of the component the button shows, usually an Icon.').optional(),
    action: commonProp('Action', 'The action that runs when the user activates the button.').optional(),
  },
  slots: { child: '' },
  bindings: {
    props: {
      variant: { kind: 'attribute', name: 'variant' },
      disabled: { kind: 'attribute', name: 'disabled' },
      loading: { kind: 'attribute', name: 'loading' },
      pressed: { kind: 'property', name: 'pressed' },
    },
    value: { prop: 'pressed', commitEvent: 'line-change' },
  },
  actions: { action: { event: 'click', native: true } },
  accessibility: {
    requiredName: [{ kind: 'accessibilityLabel' }],
    hostNaming: { kind: 'always' },
  },
});
