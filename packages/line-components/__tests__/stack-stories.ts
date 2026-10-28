/**
 * Every story of `apps/storybook/stories/components/stack.stories.ts`, by
 * Storybook id. The axe and visual tiers run over this list, and the axe file
 * checks it against the Storybook index.
 *
 * @module __tests__/stack-stories
 */
export const STACK_STORIES = [
  'components-stack--default',
  'components-stack--vertical',
  'components-stack--horizontal',
  'components-stack--justify-and-align',
  'components-stack--justify-stretch',
  'components-stack--gap-scale',
  'components-stack--wrap',
  'components-stack--author-list',
] as const;
