import { defineDescriptor } from '../descriptor.js';

/** The Spinner descriptor (`docs/specs/0022-spinner.md` Descriptor fields). */
export const spinnerDescriptor = defineDescriptor({
  name: 'Spinner',
  tag: 'line-spinner',
  load: () => import('@websublime/line-components/spinner'),
  description:
    'A loading indicator, a small ring that spins while something is in progress, such as data loading into a panel or a list. Set `accessibility.label` to what is loading, such as "Loading orders"; assistive technology then finds the spinner as a progress bar with that name. A Spinner node without a label does not render. The spinner shows no percentage, takes no input and is not interactive. Place it where the content will appear, and replace it with the content once the content arrives. It spins at the size and in the colour of the surrounding text; the app styles its size and speed. To keep the shape of content that is still loading, use Skeleton instead.',
  toolDescription:
    'A loading indicator, a small ring that spins while something is in progress, such as data loading into a panel or a list. Always set `accessibilityLabel` to what is loading, such as "Loading orders"; assistive technology then finds the spinner as a progress bar with that name, and without it the spinner tells assistive technology nothing. The spinner shows no percentage, takes no input and is not interactive. Place it where the content will appear, and replace it with the content once the content arrives. It spins at the size and in the colour of the surrounding text; the app styles its size and speed. To keep the shape of content that is still loading, use Skeleton instead.',
  props: {},
  slots: {},
  bindings: { props: {} },
  actions: {},
  accessibility: {
    requiredName: [{ kind: 'accessibilityLabel' }],
    hostNaming: { kind: 'always' },
  },
});
