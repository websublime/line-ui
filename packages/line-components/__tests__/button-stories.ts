/**
 * Every story of `apps/storybook/stories/components/button.stories.ts`, by
 * Storybook id. The axe and visual tiers run over this list, and the axe file
 * checks it against the Storybook index.
 *
 * @module __tests__/button-stories
 */
export const BUTTON_STORIES = [
  'components-button--default',
  'components-button--primary',
  'components-button--borderless',
  'components-button--prefix-and-suffix',
  'components-button--disabled',
  'components-button--loading',
  'components-button--toggle-off',
  'components-button--toggle-on',
  'components-button--aria-label-only',
  'components-button--form',
] as const;
