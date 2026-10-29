import '@websublime/line-components/separator';
import '@websublime/line-components/stack';
import '@websublime/line-tokens/border-width';
import '@websublime/line-tokens/layouts';
import '@websublime/line-tokens/sizing';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { SeparatorOrientation } from '@websublime/line-components/separator';
import { html } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-separator> stories (spec 0011-separator.md). The autodocs page reads the
// attributes and custom properties from the shipped Custom Elements Manifest
// that preview.ts registers. The stories import the thickness token and, for
// the row layouts, `line-stack` with its gap tokens; the preview loads the theme.
// Separator takes the `separator` role through ElementInternals, which the
// addon panel's axe 4.11.4 cannot see, so the panel reports a false
// `aria-prohibited-attr` on the Labelled story (spec A11y, "What axe proves here").

interface SeparatorArgs {
  orientation: SeparatorOrientation;
  decorative: boolean;
}

const meta = {
  title: 'Components/Separator',
  component: 'line-separator',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes } },
  args: { orientation: 'horizontal', decorative: false },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
  render: ({ orientation, decorative }) =>
    html`<line-stack orientation=${orientation === 'vertical' ? 'horizontal' : 'vertical'} gap="3">
      <span>Account</span>
      <line-separator orientation=${orientation} ?decorative=${decorative}></line-separator>
      <span>Billing</span>
    </line-stack>`,
} satisfies Meta<SeparatorArgs>;

export default meta;

type Story = StoryObj<SeparatorArgs>;

export const Default: Story = {};

export const Vertical: Story = {
  render: () =>
    html`<line-stack orientation="horizontal" align="center" gap="3">
      <a href="#docs">Docs</a>
      <line-separator orientation="vertical"></line-separator>
      <a href="#blog">Blog</a>
      <line-separator orientation="vertical"></line-separator>
      <a href="#changelog">Changelog</a>
    </line-stack>`,
};

export const Labelled: Story = {
  render: () =>
    html`<p>Profile</p>
      <line-separator aria-label="Advanced settings"></line-separator>
      <p>Advanced settings</p>`,
};

export const Decorative: Story = {
  render: () =>
    html`<line-stack gap="3">
      <p>Intro</p>
      <line-separator decorative></line-separator>
      <line-stack orientation="horizontal" align="center" gap="3">
        <span>One</span>
        <line-separator decorative orientation="vertical"></line-separator>
        <span>Two</span>
      </line-stack>
    </line-stack>`,
};

export const CustomTokens: Story = {
  name: 'Custom tokens',
  render: () =>
    html`<style>
        line-separator.accent {
          --line-separator-color: var(--line-accent-9);
          --line-separator-thickness: var(--line-border-2);
          margin-block: 1rem;
        }
      </style>
      <p>Above</p>
      <line-separator class="accent"></line-separator>
      <p>Below</p>`,
};
