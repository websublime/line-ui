import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Stack descriptor (`docs/specs/0018-stack.md` Descriptor fields). */
export const stackDescriptor = defineDescriptor({
  name: 'Stack',
  tag: 'line-stack',
  load: () => import('@websublime/line-components/stack'),
  description:
    "A layout container that places its children in one row or column with even spacing. Put the children in `children`. `orientation` is `vertical` (default) or `horizontal`; a horizontal stack follows the page's writing direction. `justify` spreads children along that axis: `start` (default), `center`, `end`, `spaceBetween`, `spaceAround`, `spaceEvenly`, or `stretch` to make every child grow to share the space. `align` places children across the axis: `stretch` (default), `start`, `center` or `end`. `gap` sets the spacing on a scale from `0` (none) to `5` (widest); leave it out for a medium gap. Set `wrap` to let children flow onto more lines when space runs out. Stack adds nothing to what assistive technology announces.",
  props: {
    orientation: z
      .enum(['horizontal', 'vertical'])
      .describe('The main axis: `vertical` (default) or `horizontal`.')
      .optional(),
    justify: z
      .enum(['start', 'center', 'end', 'spaceBetween', 'spaceAround', 'spaceEvenly', 'stretch'])
      .describe('How children spread along the main axis; `stretch` makes every child grow to share the space.')
      .optional(),
    align: z.enum(['start', 'center', 'end', 'stretch']).describe('How children sit across the main axis.').optional(),
    gap: z
      .enum(['0', '1', '2', '3', '4', '5'])
      .describe('The spacing between children, from `0` (none) to `5` (widest); unset gives a medium gap.')
      .optional(),
    wrap: commonProp('DynamicBoolean', 'Whether children flow onto more lines when space runs out.').optional(),
    children: commonProp('ChildList', 'The child components, in order.').optional(),
  },
  slots: { children: '' },
  bindings: {
    props: {
      orientation: { kind: 'attribute', name: 'orientation' },
      justify: { kind: 'attribute', name: 'justify' },
      align: { kind: 'attribute', name: 'align' },
      gap: { kind: 'attribute', name: 'gap' },
      wrap: { kind: 'attribute', name: 'wrap' },
    },
  },
  actions: {},
  accessibility: { hostNaming: { kind: 'listRole' } },
});
