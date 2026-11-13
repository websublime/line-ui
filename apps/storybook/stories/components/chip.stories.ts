import '@websublime/line-components/chip';
import '@websublime/line-components/icon';
import '@websublime/line-components/stack';
import '@websublime/line-tokens/border-width';
import '@websublime/line-tokens/focus-ring';
import '@websublime/line-tokens/layouts';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { ChipVariant } from '@websublime/line-components/chip';
import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { registerStoryIcons } from '../agent-ui/story-icons.js';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-chip> stories (spec 0008-chip.md, decision D12). The autodocs page reads the attributes, slots, events, parts
// and custom properties from the shipped Custom Elements Manifest that preview.ts registers. The stories import only
// the token families Chip and the filter-bar Stack use; the line-tokens barrel carries reset.css, which would restyle
// the docs page. The Lucide files are self-hosted under public/icons/. The Styled states stylesheet is story-local;
// the package ships the pressed colours and the focus ring, and no hover, active or disabled style.

registerStoryIcons();

/**
 * The Styled states story's stylesheet, scoped to the story; the docs snippet is the same rules without the scope.
 * The role aliases come from `line-themes`, which preview.ts loads.
 */
const STATE_CSS = `.styled-states line-chip:not([data-disabled]):hover { --line-chip-bg: var(--line-gray-bg-hover); }
.styled-states line-chip:not([data-disabled]):active { --line-chip-bg: var(--line-gray-bg-active); }
.styled-states line-chip[data-pressed]:not([data-disabled]):hover { --line-chip-bg: var(--line-accent-bg-hover); }
.styled-states line-chip[data-pressed]:not([data-disabled]):active { --line-chip-bg: var(--line-accent-bg-active); }
.styled-states line-chip[variant='primary']:not([data-pressed], [data-disabled]):hover { --line-chip-bg: var(--line-accent-surface); }
.styled-states line-chip[variant='primary'][data-pressed]:not([data-disabled]):hover { --line-chip-bg: var(--line-accent-solid-hover); --line-chip-border-color: var(--line-accent-solid-hover); }
.styled-states line-chip[data-disabled] { opacity: 0.5; }`;

const CUSTOM_CSS = `line-chip.dense {
  --line-chip-height: var(--line-size-5);
  --line-chip-padding-inline: var(--line-size-2);
  --line-chip-radius: var(--line-radius-2);
}
line-chip.dense[data-pressed]::part(root) {
  font-weight: 600;
}`;

const DESCRIPTION = `\`<line-chip>\` is a compact toggle button for a category, a filter or a selection. Each press turns it on or off.

\`\`\`html
<line-chip>In stock</line-chip>
<line-chip pressed>Free shipping</line-chip>
\`\`\`

- **A toggle.** \`pressed\` is a boolean attribute: present means on, absent or \`pressed="false"\` means off. Each press by pointer, Enter or Space flips it, sets \`aria-pressed\` on the native \`<button>\` inside and then fires \`line-change\` with \`{ value }\`, the new state. Setting \`pressed\` from code fires nothing. A \`click\` listener that calls \`preventDefault()\` cancels the flip. Several chips in a row each toggle on their own; use Radio Group or Toggle Group when only one option may be on.
- **Name it.** The slotted text names the chip, in tree order: the \`indicator\` (while pressed), \`prefix\`, the label and \`suffix\`. A decorative \`<line-icon>\` adds nothing, and text in \`suffix\`, such as a count, joins the name. \`aria-label\` on the host replaces the whole name, such as "Unread, 12 messages". Keep one label in both states, because \`aria-pressed\` carries the state.
- **Slots.** \`prefix\` takes a leading icon. \`indicator\` takes a pressed mark, such as a check icon, and renders only while the chip is on. \`suffix\` takes a count or an icon, never a remove button or another control, because a native \`<button>\` cannot hold one. Chip has no remove button; Tag Input covers removable tags.
- **Emphasis.** \`variant\` is \`default\` or \`primary\`. With \`line-themes\` loaded, an off chip takes the gray role and a pressed chip the soft accent; a \`primary\` chip is an accent outline when off and solid accent when pressed. Without \`line-themes\` every variant and state looks the same, so the \`indicator\` slot or your own CSS tells them apart.
- **Disabled.** \`disabled\` removes the chip from the tab order and blocks presses; no \`click\` reaches your listeners.
- **Not a form control.** The inner button is always \`type="button"\` and the host is not form-associated, so a chip never submits or resets a form, adds nothing to the form data, and a \`<fieldset disabled>\` ancestor does not disable it. Read \`pressed\` or listen to \`line-change\` instead.
- **A set of chips.** Chip has no group role. Wrap a filter bar in an element with \`role="group"\` and an \`aria-label\`, as the **Filter bar** story does.

### Styling states

The chip ships the pressed colours and the focus ring. Hover, active and disabled carry no style, so a theme or your own CSS styles them:

- \`:hover\` and \`:active\` match the host itself. \`[data-pressed]\`, \`[data-disabled]\` and \`[data-focus-visible]\` reflect the chip's state, with the same names as \`:state()\`, such as \`:state(pressed)\`.
- Set the \`--line-chip-*\` tokens under a state selector, so each state keeps its own colours. A token set on \`line-chip\` alone applies to every state, pressed included.

The **Styled states** story uses these rules:

\`\`\`css
${STATE_CSS.replaceAll('.styled-states ', '')}
\`\`\``;

interface ChipArgs {
  label: string;
  variant: ChipVariant;
  pressed: boolean;
  disabled: boolean;
}

const meta = {
  title: 'Components/Primitives Base/Chip',
  id: 'components-chip',
  component: 'line-chip',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { label: 'In stock', variant: 'default', pressed: false, disabled: false },
  argTypes: {
    label: { control: 'text', description: 'Text in the default slot, the accessible name' },
    variant: { control: 'inline-radio', options: ['default', 'primary'] },
  },
  render: ({ label, variant, pressed, disabled }) =>
    html`<line-chip variant=${variant} ?pressed=${pressed} ?disabled=${disabled}>${label}</line-chip>`,
} satisfies Meta<ChipArgs>;

export default meta;

type Story = StoryObj<ChipArgs>;

export const Default: Story = {};

export const Pressed: Story = {
  args: { label: 'Free shipping', pressed: true },
};

export const Primary: Story = {
  args: { label: 'Open now', variant: 'primary' },
};

export const PrimaryPressed: Story = {
  name: 'Primary pressed',
  args: { label: 'Open now', variant: 'primary', pressed: true },
};

export const PrefixAndIndicator: Story = {
  name: 'Prefix and indicator',
  parameters: {
    docs: {
      description: {
        story:
          'A leading icon in `prefix` and a check in `indicator`, which renders only while the chip is on. Press the chip to see the check go. Both icons are decorative, so the name is the label alone.',
      },
    },
  },
  render: () =>
    html`<line-chip pressed>
      <line-icon slot="indicator" library="lucide" name="check"></line-icon>
      <line-icon slot="prefix" library="lucide" name="star"></line-icon>
      Favourites
    </line-chip>`,
};

export const SuffixCount: Story = {
  name: 'Suffix count',
  parameters: {
    docs: {
      description: {
        story:
          'A count in `suffix` joins the name, so this chip reads as "Unread 12". Set `aria-label` on the host for another reading.',
      },
    },
  },
  render: () => html`<line-chip>Unread <span slot="suffix">12</span></line-chip>`,
};

export const Disabled: Story = {
  args: { label: 'Out of season', disabled: true },
};

export const NamedByAriaLabel: Story = {
  name: 'Named by aria-label',
  parameters: {
    docs: {
      description: {
        story:
          'The host `aria-label` is copied to the inner button, where it replaces the name the slotted content gives: this chip reads as "Unread, 12 messages".',
      },
    },
  },
  render: () => html`<line-chip aria-label="Unread, 12 messages">Unread <span slot="suffix">12</span></line-chip>`,
};

export const FilterBar: Story = {
  name: 'Filter bar',
  parameters: {
    docs: {
      description: {
        story:
          'A horizontal `<line-stack>` with `wrap` lays out the chips, and its `role="group"` and `aria-label` name the set. Each chip toggles on its own.',
      },
    },
  },
  render: () =>
    html`<line-stack orientation="horizontal" wrap gap="2" role="group" aria-label="Filters">
      <line-chip pressed>In stock</line-chip>
      <line-chip>Free shipping</line-chip>
      <line-chip>On sale</line-chip>
      <line-chip variant="primary" pressed>Open now</line-chip>
    </line-stack>`,
};

export const StyledStates: Story = {
  name: 'Styled states',
  render: () =>
    html`${unsafeHTML(`<style>${STATE_CSS}</style>`)}
      <div class="styled-states" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
        <line-chip>In stock</line-chip>
        <line-chip pressed>Free shipping</line-chip>
        <line-chip variant="primary">Open now</line-chip>
        <line-chip variant="primary" pressed>Top rated</line-chip>
        <line-chip disabled>Out of season</line-chip>
        <line-chip disabled pressed>Archived</line-chip>
      </div>`,
};

export const CustomTokens: Story = {
  name: 'Custom tokens',
  parameters: {
    docs: {
      source: { code: `<style>\n${CUSTOM_CSS}\n</style>\n<line-chip class="dense" pressed>Archived</line-chip>` },
    },
  },
  render: () =>
    html`${unsafeHTML(`<style>${CUSTOM_CSS}</style>`)}
      <div style="display: flex; gap: 8px; align-items: center">
        <line-chip class="dense">Drafts</line-chip>
        <line-chip class="dense" pressed>Archived</line-chip>
      </div>`,
};
