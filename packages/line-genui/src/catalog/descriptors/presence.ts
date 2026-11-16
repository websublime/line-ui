import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Presence descriptor (`docs/specs/0017-presence.md` Descriptor fields). */
export const presenceDescriptor = defineDescriptor({
  name: 'Presence',
  tag: 'line-presence',
  load: () => import('@websublime/line-components/presence'),
  description: 'Content that the host page shows and hides with its own enter and exit animations; `present` shows it.',
  props: {
    present: commonProp('DynamicBoolean', 'Whether the content is shown.').optional(),
    children: commonProp('ChildList', 'The child components, in order.').optional(),
  },
  slots: { children: '' },
  bindings: { props: { present: { kind: 'attribute', name: 'present' } } },
  actions: {},
  accessibility: { hostNaming: { kind: 'never' } },
  agentExposed: false,
  agentHiddenReason: 'It emits no ARIA and needs CSS exit animations, which the host owns.',
});
