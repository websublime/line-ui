import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The ButtonGroup descriptor (`docs/specs/0004-button-group.md` Descriptor fields). */
export const buttonGroupDescriptor = defineDescriptor({
  name: 'ButtonGroup',
  tag: 'line-button-group',
  load: () => import('@websublime/line-components/button-group'),
  description:
    'A toolbar that groups three or more related buttons, such as text formatting or zoom controls, into one Tab stop; the user moves between the buttons with the arrow keys. Put Buttons or IconButtons in `children`, in order. It needs `accessibility.label`, the name assistive technology announces for the toolbar; a node without one is not rendered. `orientation` is `horizontal` (default) or `vertical`. Set `loop` to let the arrow keys wrap from the last button to the first. Each button keeps its own action. For buttons that each need their own Tab stop, or for fewer than three, use a horizontal Stack.',
  toolDescription:
    "A toolbar that groups three or more related buttons, such as text formatting or zoom controls, into one Tab stop; the user moves between the buttons with the arrow keys. The app places the buttons inside it. Set `accessibilityLabel` to the toolbar's name; the app gives the toolbar that name, and a toolbar without it has no name. `orientation` is `horizontal` (default) or `vertical`. Set `loop` to let the arrow keys wrap from the last button to the first.",
  props: {
    orientation: z
      .enum(['horizontal', 'vertical'])
      .describe('The axis the buttons sit on and the arrow keys follow: `horizontal` (default) or `vertical`.')
      .optional(),
    loop: commonProp('DynamicBoolean', 'Whether the arrow keys wrap from the last button to the first.').optional(),
    children: commonProp('ChildList', 'The buttons of the toolbar, in order: Buttons or IconButtons.').optional(),
  },
  slots: { children: '' },
  bindings: {
    props: {
      orientation: { kind: 'attribute', name: 'orientation' },
      loop: { kind: 'attribute', name: 'loop' },
    },
  },
  actions: {},
  accessibility: {
    requiredName: [{ kind: 'accessibilityLabel' }],
    hostNaming: { kind: 'always' },
  },
});
