import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Chip descriptor (`docs/specs/0008-chip.md` Descriptor fields). */
export const chipDescriptor = defineDescriptor({
  name: 'Chip',
  tag: 'line-chip',
  load: () => import('@websublime/line-components/chip'),
  description:
    'A compact toggle button for a category, a filter or a selection, such as "In stock" in a row of filters. Set `label` to its visible text, which is also its accessible name. Set `pressed` to `true` when the option is on and `false` when it is off. Each press flips it and fires `line-change` with the new value, so a `pressed` bound to the data model follows the user. `variant` marks emphasis, with `primary` for the main filters of a view and `default` otherwise. Set `disabled` when the option is unavailable; a disabled chip cannot be focused or pressed. Each chip toggles on its own, so several can be on at once. Do not use chips for a choice where only one option may be on, and use Button for an action that runs once.',
  props: {
    label: commonProp('DynamicString', 'The visible text, which is also the accessible name.'),
    variant: z
      .enum(['default', 'primary'])
      .describe('Emphasis: `primary` for the main filters of a view, `default` otherwise.')
      .optional(),
    pressed: commonProp('DynamicBoolean', 'Whether the option is on; each press flips it.').optional(),
    disabled: commonProp('DynamicBoolean', 'Whether the option is unavailable.').optional(),
  },
  slots: {},
  bindings: {
    props: {
      label: { kind: 'text' },
      variant: { kind: 'attribute', name: 'variant' },
      pressed: { kind: 'property', name: 'pressed' },
      disabled: { kind: 'attribute', name: 'disabled' },
    },
    value: { prop: 'pressed', commitEvent: 'line-change' },
  },
  actions: {},
  accessibility: {
    requiredName: [{ kind: 'textProp', prop: 'label' }, { kind: 'accessibilityLabel' }],
    hostNaming: { kind: 'always' },
  },
});
