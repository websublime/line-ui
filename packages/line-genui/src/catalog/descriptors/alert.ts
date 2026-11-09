import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Alert descriptor (`docs/specs/0006-alert.md` Descriptor fields). */
export const alertDescriptor = defineDescriptor({
  name: 'Alert',
  tag: 'line-alert',
  load: () => import('@websublime/line-components/alert'),
  description:
    'An inline message box that tells the user about the state of something on the page, such as a saved change, a warning or an error. Put the message in `children`, an optional short heading in `title`, an optional Icon in `icon`, and optional Buttons for follow-up actions in `actions`. `variant` sets the tone and colour: `info` for helpful context, `success` for a completed action, `warning` for something that needs attention, `danger` for an error, or `neutral` (default). Also state the tone in words, such as a `title` "Payment failed", because colour alone does not reach every user. It stays on the page until the app removes it and never closes itself. Use it for messages that belong in the page, not for questions that need an answer.',
  toolDescription:
    'An inline message box that tells the user about the state of something on the page, such as a saved change, a warning or an error. The app places the message, an optional heading, an optional icon and any action buttons inside it, and that text should state the tone in words, such as "Payment failed", because colour alone does not reach every user. `variant` sets the tone and colour: `info` for helpful context, `success` for a completed action, `warning` for something that needs attention, `danger` for an error, or `neutral` (default). It stays on the page until the app removes it and never closes itself. Use it for messages that belong in the page, not for questions that need an answer.',
  props: {
    variant: z
      .enum(['neutral', 'info', 'success', 'warning', 'danger'])
      .describe(
        'The tone and colour: `info` for helpful context, `success` for a completed action, `warning` for something that needs attention, `danger` for an error, `neutral` (default) otherwise.',
      )
      .optional(),
    icon: commonProp('ComponentId', 'The ID of an optional Icon shown at the start of the alert.').optional(),
    title: commonProp('ComponentId', 'The ID of an optional short heading, usually a Text.').optional(),
    children: commonProp('ChildList', 'The message: the components that hold its text, in order.').optional(),
    actions: commonProp('ChildList', 'Optional Buttons for follow-up actions, in order.').optional(),
  },
  slots: { icon: 'icon', title: 'title', children: '', actions: 'actions' },
  bindings: {
    props: {
      variant: { kind: 'attribute', name: 'variant' },
    },
  },
  actions: {},
  accessibility: { hostNaming: { kind: 'never' } },
});
