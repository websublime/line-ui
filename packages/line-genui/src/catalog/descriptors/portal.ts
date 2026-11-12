import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Portal descriptor (`docs/specs/0013-portal.md` Descriptor fields). */
export const portalDescriptor = defineDescriptor({
  name: 'Portal',
  tag: 'line-portal',
  load: () => import('@websublime/line-components/portal'),
  description:
    'Content that paints above the rest of the page, outside the box of its container, while it stays in place for focus, reading order and events.',
  props: {
    children: commonProp('ChildList', 'The child components, in order.').optional(),
  },
  slots: { children: '' },
  bindings: { props: {} },
  actions: {},
  accessibility: { hostNaming: { kind: 'never' } },
  agentExposed: false,
  agentHiddenReason:
    "It paints its content above the whole page, outside the surface, so an untrusted agent could cover the host's own UI.",
});
