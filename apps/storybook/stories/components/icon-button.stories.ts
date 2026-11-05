import '@websublime/line-components/icon-button';
import '@websublime/line-components/icon';
import '@websublime/line-tokens/focus-ring';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { IconButtonVariant } from '@websublime/line-components/icon-button';
import { html } from 'lit';
import { registerStoryIcons } from '../agent-ui/story-icons.js';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-icon-button> stories (spec 0003-icon-button.md). The autodocs page reads the
// attributes, slots, events, parts and custom properties from the shipped Custom
// Elements Manifest that preview.ts registers. The stories import only the token
// families IconButton uses; the line-tokens barrel carries reset.css, which would
// restyle the docs page. The Lucide files are self-hosted under public/icons/.

registerStoryIcons();

const DESCRIPTION = `\`<line-icon-button>\` runs an action when the user activates it, and shows only an icon.

\`\`\`html
<line-icon-button variant="borderless" aria-label="Close dialog">
  <line-icon library="lucide" name="x"></line-icon>
</line-icon-button>
\`\`\`

- **Name it.** It has no visible text, so the host \`aria-label\` is its accessible name; it is copied, with \`aria-description\`, to the native \`<button>\` inside. The icon in the default slot is decorative and adds nothing to the name. Without \`aria-label\` the button has no name, and axe reports \`button-name\`. An \`aria-labelledby\` on the host does not reach the inner button; repeat the text in \`aria-label\`.
- **Not a form control.** The inner button is always \`type="button"\` and the host is not form-associated, so it never submits or resets a form, and a \`<fieldset disabled>\` ancestor does not disable it. Use \`<line-button type="submit">\` to submit.
- \`variant\` is \`default\`, \`primary\` or \`borderless\`. \`disabled\` removes it from the tab order. \`loading\` keeps it focusable, sets \`aria-disabled="true"\`, ignores presses and renders the \`loading\` slot; the name stays the \`aria-label\`, so change it while loading if the state should be announced. Hide \`::part(icon)\` under \`[data-loading]\` to keep the box square with a spinner.
- \`pressed="false"\` or \`pressed="true"\` makes a toggle: each press flips it, sets \`aria-pressed\` and fires \`line-change\` with \`{ value }\`. Keep one label in both states.
- The box is a square of at least \`--line-icon-button-size\` (default \`var(--line-size-7)\`), and a \`<line-icon>\` at its \`1em\` default follows \`--line-icon-button-font-size\`. The state shows as \`data-*\` attributes and \`:state()\` on the host for themes to style.`;

interface IconButtonArgs {
  label: string;
  icon: string;
  variant: IconButtonVariant;
  disabled: boolean;
  loading: boolean;
}

const meta = {
  title: 'Components/Icon Button',
  component: 'line-icon-button',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { label: 'Settings', icon: 'settings', variant: 'default', disabled: false, loading: false },
  argTypes: {
    label: { control: 'text', description: 'The host `aria-label`, the accessible name' },
    icon: { control: 'text', description: 'The Lucide name of the `<line-icon>` in the default slot' },
    variant: { control: 'inline-radio', options: ['default', 'primary', 'borderless'] },
  },
  render: ({ label, icon, variant, disabled, loading }) =>
    html`<line-icon-button variant=${variant} ?disabled=${disabled} ?loading=${loading} aria-label=${label}
      ><line-icon library="lucide" name=${icon}></line-icon
    ></line-icon-button>`,
} satisfies Meta<IconButtonArgs>;

export default meta;

type Story = StoryObj<IconButtonArgs>;

export const Default: Story = {};

export const Primary: Story = {
  args: { label: 'Add item', icon: 'plus', variant: 'primary' },
};

export const Borderless: Story = {
  args: { label: 'Close dialog', icon: 'x', variant: 'borderless' },
};

export const Disabled: Story = {
  args: { label: 'Delete', icon: 'trash-2', disabled: true },
};

export const Loading: Story = {
  name: 'Loading with the loading slot',
  args: { label: 'Refreshing', icon: 'refresh-cw', loading: true },
  render: ({ label, icon, variant, disabled, loading }) =>
    html`<style>
        .icon-button-story[data-loading]::part(icon) {
          display: none;
        }
      </style>
      <line-icon-button
        class="icon-button-story"
        variant=${variant}
        ?disabled=${disabled}
        ?loading=${loading}
        aria-label=${label}
        ><line-icon library="lucide" name=${icon}></line-icon
        ><line-icon slot="loading" library="lucide" name="loader-circle"></line-icon
      ></line-icon-button>`,
};

export const ToggleOff: Story = {
  name: 'Toggle off',
  args: { label: 'Mute', icon: 'volume-x' },
  render: ({ label, icon, variant }) =>
    html`<line-icon-button variant=${variant} pressed="false" aria-label=${label}
      ><line-icon library="lucide" name=${icon}></line-icon
    ></line-icon-button>`,
};

export const ToggleOn: Story = {
  name: 'Toggle on',
  args: { label: 'Mute', icon: 'volume-x' },
  render: ({ label, icon, variant }) =>
    html`<line-icon-button variant=${variant} pressed="true" aria-label=${label}
      ><line-icon library="lucide" name=${icon}></line-icon
    ></line-icon-button>`,
};
