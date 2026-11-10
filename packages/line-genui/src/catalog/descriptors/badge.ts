import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Badge descriptor (`docs/specs/0007-badge.md` Descriptor fields). */
export const badgeDescriptor = defineDescriptor({
  name: 'Badge',
  tag: 'line-badge',
  load: () => import('@websublime/line-components/badge'),
  description:
    'A small status marker beside other content, such as an unread count next to Inbox or a "Beta" tag next to a heading. Set `label` to its short text: a number such as "5" or "99+", or a word or two. To show a dot instead, leave `label` empty and give `accessibility.label` the meaning, such as "New messages". `variant` sets the tone and colour: `info` for helpful context, `success` for a positive state, `warning` for something that needs attention, `danger` for an error or an urgent count, or `neutral` (default). Also state the meaning in words, because colour alone does not reach every user. A badge is not interactive and announces nothing on its own. Use Alert for a message that needs a sentence, and Chip for an option the user can turn on or off.',
  toolDescription:
    'A small status marker beside other content, such as an unread count next to Inbox or a "Beta" tag next to a heading. Set `label` to its short text: a number such as "5" or "99+", or a word or two. To show a dot instead, leave `label` empty and give `accessibilityLabel` the meaning, such as "New messages". `variant` sets the tone and colour: `info` for helpful context, `success` for a positive state, `warning` for something that needs attention, `danger` for an error or an urgent count, or `neutral` (default). Also state the meaning in words, because colour alone does not reach every user. A badge is not interactive and announces nothing on its own. Use Alert for a message that needs a sentence, and Chip for an option the user can turn on or off.',
  props: {
    label: commonProp(
      'DynamicString',
      'The short text: a number such as "5" or "99+", or a word or two; empty for a dot.',
    ).optional(),
    variant: z
      .enum(['neutral', 'info', 'success', 'warning', 'danger'])
      .describe(
        'The tone and colour: `info` for helpful context, `success` for a positive state, `warning` for something that needs attention, `danger` for an error or an urgent count, `neutral` (default) otherwise.',
      )
      .optional(),
  },
  slots: {},
  bindings: {
    props: {
      label: { kind: 'text' },
      variant: { kind: 'attribute', name: 'variant' },
    },
  },
  actions: {},
  accessibility: {
    requiredName: [{ kind: 'textProp', prop: 'label' }, { kind: 'accessibilityLabel' }],
    hostNaming: { kind: 'always' },
  },
});
