import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The AspectRatio descriptor (`docs/specs/0021-aspect-ratio.md` Descriptor fields). */
export const aspectRatioDescriptor = defineDescriptor({
  name: 'AspectRatio',
  tag: 'line-aspect-ratio',
  load: () => import('@websublime/line-components/aspect-ratio'),
  description:
    "A box that keeps a fixed width-to-height ratio, such as a 16:9 frame. Put the content in `child`; to show several components, put them in a Stack and make the Stack the child. A child with no size of its own, such as a Stack or a Center, fills the box. `ratio` sets the shape: `square` (1:1, default), `landscape` (4:3), `portrait` (3:4), `widescreen` (16:9), `ultrawide` (18:5) or `golden` (1.618:1). The box takes its width from its container and its height from the ratio. In a horizontal Stack or a Grid at its default alignment, a taller neighbour stretches the box, which breaks the ratio or widens the box past its column; aligning the children to the start keeps the ratio. A vertical Stack with another alignment, a horizontal Stack whose children do not grow, and a Grid that places its children at the start, centre or end of their columns size the box from its content or its row's height. Content taller than the box spills past its bottom edge.",
  toolDescription:
    "A box that keeps a fixed width-to-height ratio, such as a 16:9 frame. The app places one component inside it, which may be a Stack that holds several. A child with no size of its own, such as a Stack or a Center, fills the box. `ratio` sets the shape: `square` (1:1, default), `landscape` (4:3), `portrait` (3:4), `widescreen` (16:9), `ultrawide` (18:5) or `golden` (1.618:1). The box takes its width from its container and its height from the ratio. In a horizontal Stack or a Grid at its default alignment, a taller neighbour stretches the box, which breaks the ratio or widens the box past its column; aligning the children to the start keeps the ratio. A vertical Stack with another alignment, a horizontal Stack whose children do not grow, and a Grid that places its children at the start, centre or end of their columns size the box from its content or its row's height. Content taller than the box spills past its bottom edge.",
  props: {
    ratio: z
      .enum(['square', 'landscape', 'portrait', 'widescreen', 'ultrawide', 'golden'])
      .describe(
        'The shape of the box: `square` (1:1, default), `landscape` (4:3), `portrait` (3:4), `widescreen` (16:9), `ultrawide` (18:5) or `golden` (1.618:1).',
      )
      .optional(),
    child: commonProp(
      'ComponentId',
      'The ID of the component the box holds; to hold several, a Stack that holds them.',
    ).optional(),
  },
  slots: { child: '' },
  bindings: {
    props: {
      ratio: { kind: 'attribute', name: 'ratio' },
    },
  },
  actions: {},
  accessibility: { hostNaming: { kind: 'never' } },
});
