import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Skeleton descriptor (`docs/specs/0016-skeleton.md` Descriptor fields). */
export const skeletonDescriptor = defineDescriptor({
  name: 'Skeleton',
  tag: 'line-skeleton',
  load: () => import('@websublime/line-components/skeleton'),
  description:
    'A placeholder that stands in for content that is still loading, so the layout keeps its shape until the content arrives. `shape` is `rect` (default) for a block such as an image or a card, `circle` for an avatar or an icon, or `text` for lines of text sized to the surrounding font. `lines` sets how many lines or blocks to draw, one by default, with the last one shorter when there are several. The placeholder only shows that something is loading: it is not interactive, assistive technology skips it, and it takes no label. Replace it with the content once the content arrives.',
  props: {
    shape: z
      .enum(['rect', 'circle', 'text'])
      .describe(
        '`rect` (default) for a block, `circle` for an avatar or an icon, `text` for lines of text in the surrounding font.',
      )
      .optional(),
    lines: commonProp(
      'DynamicNumber',
      'How many lines or blocks to draw, from 1 to 20; the last of several is shorter.',
    ).optional(),
  },
  slots: {},
  bindings: {
    props: {
      shape: { kind: 'attribute', name: 'shape' },
      lines: { kind: 'attribute', name: 'lines' },
    },
  },
  actions: {},
  accessibility: { hostNaming: { kind: 'never' } },
});
