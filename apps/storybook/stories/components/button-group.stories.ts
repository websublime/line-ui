import '@websublime/line-components/button-group';
import '@websublime/line-components/button';
import '@websublime/line-components/icon-button';
import '@websublime/line-components/icon';
import '@websublime/line-tokens/focus-ring';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { ButtonGroupOrientation } from '@websublime/line-components/button-group';
import { html, type TemplateResult } from 'lit';
import { registerStoryIcons } from '../agent-ui/story-icons.js';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-button-group> stories (spec 0004-button-group.md). The autodocs page reads the
// attributes, slot and custom properties from the shipped Custom Elements Manifest that
// preview.ts registers. The stories import only the token families the group and its
// buttons use; the line-tokens barrel carries reset.css, which would restyle the docs
// page. The Lucide files are self-hosted under public/icons/.

registerStoryIcons();

const DESCRIPTION = `\`<line-button-group>\` groups related buttons into one toolbar. The group is one Tab stop, and the arrow keys move focus between its buttons (APG Toolbar).

\`\`\`html
<line-button-group aria-label="Text formatting">
  <line-button pressed="false">Bold</line-button>
  <line-button pressed="false">Italic</line-button>
  <line-button pressed="false">Underline</line-button>
</line-button-group>
\`\`\`

- **Name it.** The \`toolbar\` role sits on the host, so the host \`aria-label\`, or \`aria-labelledby\` pointing at a visible heading, names it. A toolbar without a name passes axe, so nothing reports it: name every toolbar.
- **Its buttons.** The \`<line-button>\` and \`<line-icon-button>\` children of the default slot are the toolbar's buttons; a child with \`hidden\` is left out. Other children render and take no part in the arrow keys, and a native \`<button>\` keeps its own Tab stop. The group writes \`tabindex\` and \`data-line-button-group-position\` (\`first\`, \`middle\`, \`last\`, \`only\`) on its buttons and removes both from a button that leaves.
- **Keys.** Tab enters on the first enabled button, and later on the one that last had focus. \`orientation="horizontal"\` (the default) takes Left and Right, mirrored right-to-left; \`orientation="vertical"\` takes Up and Down. Home and End jump to the ends, and \`loop\` wraps. Enter and Space belong to the focused button.
- **Disabled and loading.** The arrows skip a disabled button and keep a loading one. When the focused button is disabled, hidden or removed, focus moves to the next enabled button, else the previous one.
- **Corners.** The group squares the corners between its buttons through their \`--line-button-radius\` and \`--line-icon-button-radius\` tokens; \`--line-button-group-radius\` sets the outer corners and \`--line-button-group-gap\` the space between buttons (default \`0\`).
- **Vertical widths.** In a vertical group each button is as wide as its content. For one width, stretch each button's inner button: \`line-button-group[orientation='vertical'] > *::part(root) { inline-size: 100%; }\`.
- Use a toolbar for three or more controls. Two buttons side by side belong in \`<line-stack orientation="horizontal">\`, and buttons that each need a Tab stop, such as OK and Cancel, too.`;

interface ButtonGroupArgs {
  label: string;
  orientation: ButtonGroupOrientation;
  loop: boolean;
}

const group = ({ label, orientation, loop }: ButtonGroupArgs, items: TemplateResult): TemplateResult =>
  html`<line-button-group aria-label=${label} orientation=${orientation} ?loop=${loop}>${items}</line-button-group>`;

const FORMATTING = html`<line-button pressed="false">Bold</line-button>
  <line-button pressed="false">Italic</line-button>
  <line-button pressed="false">Underline</line-button>`;

const meta = {
  title: 'Components/Button Group',
  component: 'line-button-group',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { label: 'Text formatting', orientation: 'horizontal', loop: false },
  argTypes: {
    label: { control: 'text', description: 'The host `aria-label`, the toolbar name' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
  render: (args) => group(args, FORMATTING),
} satisfies Meta<ButtonGroupArgs>;

export default meta;

type Story = StoryObj<ButtonGroupArgs>;

export const Default: Story = {};

export const IconButtons: Story = {
  name: 'Icon buttons',
  args: { label: 'Zoom' },
  render: (args) =>
    group(
      args,
      html`<line-icon-button aria-label="Zoom out"><line-icon library="lucide" name="zoom-out"></line-icon></line-icon-button>
        <line-button>100%</line-button>
        <line-icon-button aria-label="Zoom in"><line-icon library="lucide" name="zoom-in"></line-icon></line-icon-button>`,
    ),
};

export const Vertical: Story = {
  args: { label: 'Tools', orientation: 'vertical', loop: true },
  render: (args) =>
    group(
      args,
      html`<line-button>Select</line-button>
        <line-button>Crop</line-button>
        <line-button>Export</line-button>`,
    ),
};

export const DisabledAndLoading: Story = {
  name: 'Disabled and loading',
  args: { label: 'Document' },
  render: (args) =>
    group(
      args,
      html`<line-button>Save</line-button>
        <line-button disabled>Undo</line-button>
        <line-button loading>Publish<line-icon slot="loading" library="lucide" name="loader-circle"></line-icon></line-button>`,
    ),
};

export const RightToLeft: Story = {
  name: 'Right to left',
  render: (args) => html`<div dir="rtl">${group(args, FORMATTING)}</div>`,
};
