import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Center descriptor (`docs/specs/0020-center.md` Descriptor fields). */
export const centerDescriptor = defineDescriptor({
  name: 'Center',
  tag: 'line-center',
  load: () => import('@websublime/line-components/center'),
  description:
    "A layout container that centres its content. Put the content in `child`; to centre several components, put them in a Stack and make the Stack the child. `axis` sets the direction: `both` (default), `horizontal` or `vertical`. Centring shows only where the box has spare room. At the root, or in a vertical Stack at its default alignment, the box is as wide as its container and as tall as its content, so only horizontal centring shows. In a horizontal Stack at its default alignment, the box is as tall as the row and as wide as its content, so only vertical centring shows. A Stack with another cross-axis alignment sizes the box to its content on that axis, and a Stack that makes its children grow along its length gives the box that length. Content larger than the box starts at its start edge, so none of it is cut off. Centring follows the page's writing direction and adds nothing to what assistive technology announces.",
  toolDescription:
    "A layout container that centres its content. The app places one component inside it, which may be a Stack that holds several. `axis` sets the direction: `both` (default), `horizontal` or `vertical`. Centring shows only where the box has spare room. At the root, or in a vertical Stack at its default alignment, the box is as wide as its container and as tall as its content, so only horizontal centring shows. In a horizontal Stack at its default alignment, the box is as tall as the row and as wide as its content, so only vertical centring shows. A Stack with another cross-axis alignment sizes the box to its content on that axis, and a Stack that makes its children grow along its length gives the box that length. Content larger than the box starts at its start edge, so none of it is cut off. Centring follows the page's writing direction and adds nothing to what assistive technology announces.",
  props: {
    axis: z
      .enum(['both', 'horizontal', 'vertical'])
      .describe('Which way to centre the content: `both` (default), `horizontal` or `vertical`.')
      .optional(),
    child: commonProp(
      'ComponentId',
      'The ID of the component to centre; to centre several, a Stack that holds them.',
    ).optional(),
  },
  slots: { child: '' },
  bindings: {
    props: {
      axis: { kind: 'attribute', name: 'axis' },
    },
  },
  actions: {},
  accessibility: { hostNaming: { kind: 'never' } },
});
