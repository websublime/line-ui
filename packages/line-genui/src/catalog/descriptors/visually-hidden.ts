import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Visually Hidden descriptor (`docs/specs/0012-visually-hidden.md` Descriptor fields). */
export const visuallyHiddenDescriptor = defineDescriptor({
  name: 'VisuallyHidden',
  tag: 'line-visually-hidden',
  load: () => import('@websublime/line-components/visually-hidden'),
  description:
    'Text that assistive technology reads and the screen does not show, such as words that complete the name of a link or a button. Content inside it that takes keyboard focus shows while it has focus.',
  props: {
    children: commonProp('ChildList', 'The child components, in order.').optional(),
  },
  slots: { children: '' },
  bindings: { props: {} },
  actions: {},
  accessibility: { hostNaming: { kind: 'never' } },
  agentExposed: false,
  agentHiddenReason: 'An untrusted agent could add text that only screen readers hear.',
});
