import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Icon descriptor (`docs/specs/0014-icon.md` Descriptor fields). */
export const iconDescriptor = defineDescriptor({
  name: 'Icon',
  tag: 'line-icon',
  load: () => import('@websublime/line-components/icon'),
  description:
    "A small glyph from the app's icon set, drawn at the size and colour of the surrounding text. Set `name` to an A2UI icon name, such as `check` or `arrowBack`; the app looks it up in its icon map, and a name the map lacks renders an empty space and raises a surface error. Set `path` instead to SVG path data in a 24 by 24 box for a glyph outside the set. The icon is decorative, so assistive technology skips it; put the meaning in nearby text, such as the label of the Button it sits in. A mapped name flips in right-to-left layouts when the app's map marks it directional; set `mirror` on a directional `path` glyph, such as a back arrow, so it flips too.",
  props: {
    name: commonProp(
      'DynamicString',
      "An A2UI icon name, such as `check` or `arrowBack`, looked up in the app's icon map.",
    ).optional(),
    mirror: commonProp('DynamicBoolean', 'Whether a `path` glyph flips in right-to-left layouts.').optional(),
    path: commonProp(
      'DynamicString',
      'SVG path data in a 24 by 24 box, for a glyph outside the icon set; it wins over `name`.',
    ).optional(),
  },
  slots: {},
  bindings: {
    props: {
      name: {
        kind: 'surfaceLookup',
        surfaceProperty: 'iconMap',
        sets: [
          { kind: 'attribute', name: 'library' },
          { kind: 'attribute', name: 'name' },
          { kind: 'attribute', name: 'weight' },
          { kind: 'attribute', name: 'mirror' },
        ],
        skippedWhen: ['path'],
      },
      mirror: { kind: 'attribute', name: 'mirror' },
      path: { kind: 'property', name: 'path' },
    },
  },
  actions: {},
  accessibility: { hostNaming: { kind: 'never' } },
});
