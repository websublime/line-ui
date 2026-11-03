import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Separator descriptor (`docs/specs/0011-separator.md` Descriptor fields). */
export const separatorDescriptor = defineDescriptor({
  name: 'Separator',
  tag: 'line-separator',
  load: () => import('@websublime/line-components/separator'),
  description:
    'A thin line that separates sections of content. `orientation` is `horizontal` (default) for a line across the full width between content stacked top to bottom, or `vertical` for a line between items placed side by side, such as inside a horizontal Stack. Assistive technology announces it as a separator. Set `decorative` when the line only adds visual rhythm, so assistive technology skips it, and give a decorative line no `accessibility.label`. Give a separator `accessibility.label` only when the section that follows needs a spoken name. It has no children and adds no spacing, so the surrounding layout sets the gap.',
  props: {
    orientation: z
      .enum(['horizontal', 'vertical'])
      .describe('`horizontal` (default) for a line across the width, `vertical` for a line between side-by-side items.')
      .optional(),
    decorative: commonProp(
      'DynamicBoolean',
      'Whether the line only adds visual rhythm, so assistive technology skips it.',
    ).optional(),
  },
  slots: {},
  bindings: {
    props: {
      orientation: { kind: 'attribute', name: 'orientation' },
      decorative: { kind: 'attribute', name: 'decorative' },
    },
  },
  actions: {},
  accessibility: { hostNaming: { kind: 'unlessTrue', prop: 'decorative' } },
});
