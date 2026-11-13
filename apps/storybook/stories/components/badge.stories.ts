import '@websublime/line-components/badge';
import '@websublime/line-components/button';
import '@websublime/line-components/stack';
import '@websublime/line-components/visually-hidden';
import '@websublime/line-tokens/border-width';
import '@websublime/line-tokens/focus-ring';
import '@websublime/line-tokens/layouts';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { BadgeVariant } from '@websublime/line-components/badge';
import { html, type TemplateResult } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-badge> stories (spec 0007-badge.md, decision D11). The autodocs page reads the attributes, slots, parts and
// custom properties from the shipped Custom Elements Manifest that preview.ts registers. The stories import only the
// token families Badge and the slotted button use; the line-tokens barrel carries reset.css, which would restyle the
// docs page.

const DESCRIPTION = `\`<line-badge>\` is a small, non-interactive status marker: a count such as "5", a short label such as "Beta", or a dot. It takes no focus and handles no key.

\`\`\`html
<line-badge variant="danger">5</line-badge>
<line-badge variant="info">Beta</line-badge>
<line-badge variant="success" aria-label="Online"></line-badge>
\`\`\`

- **Count, label or dot.** Write the count or the label as text in the default slot. A badge whose slot holds no element and no text other than whitespace draws as a dot, and reflects \`data-empty\` and \`:state(empty)\` on the host.
- **Overflow.** The badge shows exactly the text you write and formats no number. For a capped count, write the cap yourself, such as "99+".
- **Tone.** \`variant\` is \`neutral\` (default), \`info\`, \`success\`, \`warning\` or \`danger\`, and colours the badge from the theme role: a count or a label takes the soft fill and text, as Alert does, and a dot the solid step. State the meaning in words too, in the badge or nearby, or name a dot. Colour alone does not reach every user, and forced-colors mode draws every tone in the same system colours.
- **Reading.** A count or a label is read as text where it sits, and inside a button or link it joins that control's name, such as "Inbox 5". To add words for assistive technology, put \`<line-visually-hidden>\` in the slot, such as \`5<line-visually-hidden> unread messages</line-visually-hidden>\`.
- **Naming.** A dot is hidden from assistive technology. When a dot carries meaning that nothing nearby states, name it with \`aria-label\` or \`aria-labelledby\` on the host; the badge then becomes an image with that name. The same attributes name a count or a label as a whole, such as \`aria-label="5 unread messages"\`. An author \`role\` or \`aria-hidden\` on the host wins.
- **Announcing a change.** A badge announces nothing when its text changes. For a count that must be heard, set \`aria-live="polite"\` on the host before the count changes; the count stays in the name of a button around it.
- **Placement.** The badge stays inline where you put it. To place it over the corner of another element, use that component's slot, such as Button's \`suffix\`, or your own CSS with \`position: relative\` on the anchor.
- Use Alert for a message that needs a sentence, and Chip for an option the user turns on or off.`;

interface BadgeArgs {
  variant: BadgeVariant;
  text: string;
}

const VARIANTS: readonly BadgeVariant[] = ['neutral', 'info', 'success', 'warning', 'danger'];

const meta = {
  title: 'Components/Primitives Base/Badge',
  id: 'components-badge',
  component: 'line-badge',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { variant: 'neutral', text: 'Beta' },
  argTypes: {
    variant: { control: 'inline-radio', options: [...VARIANTS] },
    text: { control: 'text', description: 'Text in the default slot; empty draws a dot' },
  },
  render: ({ variant, text }) => html`<line-badge variant=${variant}>${text}</line-badge>`,
} satisfies Meta<BadgeArgs>;

export default meta;

type Story = StoryObj<BadgeArgs>;

export const Label: Story = {};

export const Count: Story = {
  args: { variant: 'danger', text: '5' },
};

export const CountInAButton: Story = {
  name: 'Count in a button',
  parameters: {
    docs: {
      description: {
        story: 'The count sits in the Button `suffix` slot and joins the button name, "Inbox 5".',
      },
    },
  },
  render: () => html`<line-button>Inbox <line-badge slot="suffix" variant="danger">5</line-badge></line-button>`,
};

export const CountWithHiddenWords: Story = {
  name: 'Count with hidden words',
  parameters: {
    docs: {
      description: {
        story:
          '`<line-visually-hidden>` in the badge adds words that only assistive technology reads; the button is named "Inbox 5 unread messages".',
      },
    },
  },
  render: () =>
    html`<button type="button">Inbox <line-badge>5<line-visually-hidden> unread messages</line-visually-hidden></line-badge></button>`,
};

export const Overflow: Story = {
  parameters: {
    docs: { description: { story: 'The consumer caps the count and writes "99+"; the badge formats no number.' } },
  },
  args: { variant: 'danger', text: '99+' },
};

export const DotDecorative: Story = {
  name: 'Dot decorative',
  parameters: {
    docs: {
      description: {
        story: 'The nearby text states the meaning, so the unnamed dot is hidden from assistive technology.',
      },
    },
  },
  render: () =>
    html`<line-stack orientation="horizontal" align="center" gap="2">
      <span>New messages</span>
      <line-badge variant="info"></line-badge>
    </line-stack>`,
};

export const DotNamed: Story = {
  name: 'Dot named',
  parameters: {
    docs: {
      description: {
        story:
          '`aria-label` names a dot whose meaning nothing nearby states; the badge becomes an image named "Online".',
      },
    },
  },
  render: () => html`<line-badge variant="success" aria-label="Online"></line-badge>`,
};

export const NamedCount: Story = {
  name: 'Named count',
  parameters: {
    docs: {
      description: {
        story: '`aria-label` names the count as a whole: an image named "5 unread messages" over the text "5".',
      },
    },
  },
  render: () => html`<line-badge variant="danger" aria-label="5 unread messages">5</line-badge>`,
};

/** A label, a count and a named dot of one tone. */
const tone = (variant: BadgeVariant, label: string): TemplateResult =>
  html`<line-stack orientation="horizontal" align="center" gap="2">
    <line-badge variant=${variant}>${label}</line-badge>
    <line-badge variant=${variant}>12</line-badge>
    <line-badge variant=${variant} aria-label=${`${label} status`}></line-badge>
  </line-stack>`;

export const Neutral: Story = { render: () => tone('neutral', 'Draft') };

export const Info: Story = { render: () => tone('info', 'Beta') };

export const Success: Story = { render: () => tone('success', 'Paid') };

export const Warning: Story = { render: () => tone('warning', 'Expiring') };

export const Danger: Story = { render: () => tone('danger', 'Overdue') };

/** Adds one to the count in the demo. */
const increment = (event: Event): void => {
  const badge = (event.currentTarget as HTMLElement).closest('line-stack')?.querySelector('line-badge');
  if (badge) badge.textContent = String(Number(badge.textContent) + 1);
};

export const LiveCountRecipe: Story = {
  name: 'Live count recipe',
  parameters: {
    docs: {
      description: {
        story:
          'The host carries `aria-live="polite"` from the start, so a screen reader can announce the new count when it changes. The button adds one to try it.',
      },
    },
  },
  render: () =>
    html`<line-stack orientation="horizontal" align="center" gap="2">
      <line-button @click=${increment}>Add a message</line-button>
      <span>Unread</span>
      <line-badge variant="danger" aria-live="polite">3</line-badge>
    </line-stack>`,
};

export const CustomTokens: Story = {
  name: 'Custom tokens',
  render: () =>
    html`<style>
        line-badge.large {
          --line-badge-height: var(--line-size-5);
          --line-badge-font-size: var(--line-font-size-1);
          --line-badge-dot-size: var(--line-size-3);
        }
        line-badge.large::part(root) {
          letter-spacing: 0.02em;
        }
      </style>
      <line-stack orientation="horizontal" align="center" gap="2">
        <line-badge class="large" variant="info">12</line-badge>
        <line-badge class="large" variant="info" aria-label="New"></line-badge>
      </line-stack>`,
};
