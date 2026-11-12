import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

const OPENING =
  'A row of overlapping avatars for the people or organisations on something, such as the members of a project or the people in a call.';
const REST =
  ' Set `max` to how many avatars show; the rest collapse into a "+N" button that opens a panel with the others. Set `overflowLabel` to the button\'s spoken name, with `{count}` where the number goes, such as "+{count} more members"; without it the button is announced as "+N". `size` sets the avatar size from `1` (smallest) to `5` (largest), and `spacing` the overlap from `0` (none) to `3` (most); leave them out for the defaults.';
const CLOSING =
  ' The avatars spread apart while the pointer or the keyboard focus is on the group. Use Avatar alone for one person, and a horizontal Stack for pictures that must not overlap.';

/** The AvatarGroup descriptor (`docs/specs/0010-avatar-group.md` Descriptor fields). */
export const avatarGroupDescriptor = defineDescriptor({
  name: 'AvatarGroup',
  tag: 'line-avatar-group',
  load: () => import('@websublime/line-components/avatar-group'),
  description: `${OPENING} Put Avatars in \`children\`, in order.${REST} Give \`accessibility.label\` a name for the whole group, such as "Project members".${CLOSING}`,
  // The tool leaves out the `children` ChildList and flattens `accessibility`, so its description names neither (§6.G.3).
  toolDescription: `${OPENING} The app places the avatars inside it.${REST} Set \`accessibilityLabel\` to a name for the whole group, such as "Project members".${CLOSING}`,
  props: {
    children: commonProp('ChildList', 'The avatars of the group, in order: Avatars.').optional(),
    max: commonProp(
      'DynamicNumber',
      'How many avatars show; the rest collapse into a "+N" button. Unset shows every avatar.',
    ).optional(),
    size: z
      .enum(['1', '2', '3', '4', '5'])
      .describe('The avatar size, from `1` (smallest) to `5` (largest); unset keeps the avatar default.')
      .optional(),
    spacing: z
      .enum(['0', '1', '2', '3'])
      .describe('How much the avatars overlap, from `0` (none) to `3` (most); unset gives a small overlap.')
      .optional(),
    overflowLabel: commonProp(
      'DynamicString',
      'The spoken name of the "+N" button, with `{count}` where the number goes, such as "+{count} more members".',
    ).optional(),
  },
  slots: { children: '' },
  bindings: {
    props: {
      max: { kind: 'attribute', name: 'max' },
      size: { kind: 'attribute', name: 'size' },
      spacing: { kind: 'attribute', name: 'spacing' },
      overflowLabel: { kind: 'attribute', name: 'overflow-label' },
    },
  },
  actions: {},
  accessibility: { hostNaming: { kind: 'always' } },
});
