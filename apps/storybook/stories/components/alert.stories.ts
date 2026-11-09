import '@websublime/line-components/alert';
import '@websublime/line-components/button';
import '@websublime/line-components/icon';
import '@websublime/line-components/icon-button';
import '@websublime/line-components/stack';
import '@websublime/line-tokens/border-width';
import '@websublime/line-tokens/focus-ring';
import '@websublime/line-tokens/layouts';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { AlertLive, AlertVariant } from '@websublime/line-components/alert';
import { html, type TemplateResult } from 'lit';
import { registerStoryIcons } from '../agent-ui/story-icons.js';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-alert> stories (spec 0006-alert.md, decision D16). The autodocs page reads the attributes, slots, parts and
// custom properties from the shipped Custom Elements Manifest that preview.ts registers. The stories import only the
// token families Alert and its slotted buttons use; the line-tokens barrel carries reset.css, which would restyle the
// docs page. The Lucide files are self-hosted under public/icons/.

registerStoryIcons();

const DISMISS_CODE = `<h2 id="notices" tabindex="-1">Notices</h2>
<line-alert id="features" variant="info">
  New features are available.
  <line-icon-button slot="actions" aria-label="Dismiss notice">
    <line-icon library="lucide" name="x"></line-icon>
  </line-icon-button>
</line-alert>
<script type="module">
  const notice = document.getElementById('features');
  notice.querySelector('[slot="actions"]').addEventListener('click', () => {
    notice.remove();
    document.getElementById('notices').focus();
  });
</script>`;

const DESCRIPTION = `\`<line-alert>\` is an inline box that tells the user about the state of something on the page: a saved change, a warning before an action, a failed payment, a piece of context. It stays until your code removes it and takes no focus.

\`\`\`html
<line-alert variant="danger">
  <line-icon slot="icon" library="lucide" name="circle-alert"></line-icon>
  <h3 slot="title">Payment failed</h3>
  <p>Check the card number and try again.</p>
  <line-button slot="actions" variant="primary">Retry</line-button>
</line-alert>
\`\`\`

- **Zones.** The \`icon\`, \`title\`, default and \`actions\` slots fill a two-column grid: the icon at the start of the first row, the title above the message beside it, and the actions in a wrapping row below the message. A zone whose slot is empty takes no space, and an alert with no content keeps its padded box. Slotted headings and paragraphs keep their browser margins unless you load \`@websublime/line-tokens/reset\`, which zeroes them inside \`line-alert\`.
- **Tone.** \`variant\` is \`neutral\` (default), \`info\`, \`success\`, \`warning\` or \`danger\`, and sets the colour tokens from the theme roles. State the tone in words too, in the title or the message, such as "Error: the payment failed", or name the icon with \`aria-label\`. Colour alone does not reach every user, and forced-colors mode draws every variant in the same system colours.
- **Live role.** By default the alert has no role and assistive technology reads it in page order. \`live="polite"\` gives the host the \`status\` role and \`live="assertive"\` the \`alert\` role, so a screen reader announces the alert when it appears or its text changes. Set \`live\` before you insert the alert or change its text, because switching the role on over text already in place gives no reliable announcement. Use \`assertive\` only for an error the user must hear at once. An author \`role\` or \`aria-live\` on the host wins.
- **Naming.** Name only a live alert, with \`aria-label\` on the host. With \`live\` off the host is a \`generic\` element, which takes no name.
- **Dismiss.** Alert ships no close button. Put one in \`actions\`, remove the alert in its click handler, and move focus to a named target, because focus on a removed button falls to the page body. The **Dismiss recipe** story does this:

\`\`\`html
${DISMISS_CODE}
\`\`\`

- Use Alert Dialog for a message that needs an answer, Toast for a message that goes away on its own, and the \`error\` slot of a field for one field's validation text.`;

interface AlertArgs {
  variant: AlertVariant;
  live: AlertLive;
  message: string;
}

const alert = ({ variant, live, message }: AlertArgs): TemplateResult =>
  html`<line-alert variant=${variant} live=${live}>${message}</line-alert>`;

/** Replaces the alert in the demo with a fresh copy, which a screen reader announces as a new live region. */
const insertAgain = (event: Event): void => {
  const current = (event.currentTarget as HTMLElement).closest('line-stack')?.querySelector('line-alert');
  current?.replaceWith(current.cloneNode(true));
};

const liveDemo = (alertTemplate: TemplateResult): TemplateResult =>
  html`<line-stack gap="3">
    <div><line-button @click=${insertAgain}>Insert it again</line-button></div>
    ${alertTemplate}
  </line-stack>`;

const meta = {
  title: 'Components/Alert',
  component: 'line-alert',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { variant: 'neutral', live: 'off', message: 'Billing moves to the new dashboard on 1 December.' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['neutral', 'info', 'success', 'warning', 'danger'] },
    live: { control: 'inline-radio', options: ['off', 'polite', 'assertive'] },
    message: { control: 'text', description: 'Text in the default slot' },
  },
  render: (args) => alert(args),
} satisfies Meta<AlertArgs>;

export default meta;

type Story = StoryObj<AlertArgs>;

export const Default: Story = {};

export const Info: Story = {
  args: { variant: 'info', message: 'Tip: drafts are saved every minute.' },
};

export const Success: Story = {
  args: { variant: 'success', message: 'Success: your changes were saved.' },
};

export const Warning: Story = {
  args: { variant: 'warning', message: 'Warning: your trial ends in 3 days.' },
};

export const Danger: Story = {
  args: { variant: 'danger', message: 'Error: the payment could not be processed.' },
};

export const AllSlots: Story = {
  name: 'All slots',
  parameters: {
    docs: {
      description: {
        story:
          'The icon sits at the start of the first row, the title above the message, and the actions in a wrapping row below. The story zeroes the heading and paragraph margins, as `@websublime/line-tokens/reset` does inside `line-alert`.',
      },
    },
  },
  render: () =>
    html`<style>
        line-alert.all-slots :where(h3, p) {
          margin: 0;
        }
      </style>
      <line-alert class="all-slots" variant="danger">
      <line-icon slot="icon" library="lucide" name="circle-alert"></line-icon>
      <h3 slot="title">Payment failed</h3>
      <p>Check the card number and try again.</p>
      <line-button slot="actions" variant="primary">Retry</line-button>
      <line-button slot="actions" variant="borderless">Use another card</line-button>
    </line-alert>`,
};

export const LiveAssertive: Story = {
  name: 'Live assertive',
  parameters: {
    docs: {
      description: {
        story:
          '`live="assertive"` puts the `alert` role on the host. A screen reader interrupts to announce it when it is inserted, so keep it for an error the user must hear at once. The button inserts a fresh copy.',
      },
    },
  },
  render: () =>
    liveDemo(html`<line-alert variant="danger" live="assertive">Error: the form has 2 errors.</line-alert>`),
};

export const LivePolite: Story = {
  name: 'Live polite',
  parameters: {
    docs: {
      description: {
        story:
          '`live="polite"` puts the `status` role on the host, which a screen reader announces when the user is idle. A live alert may carry a name. The button inserts a fresh copy.',
      },
    },
  },
  render: () =>
    liveDemo(
      html`<line-alert variant="success" live="polite" aria-label="Upload">Success: all 12 files uploaded.</line-alert>`,
    ),
};

/** Removes the alert that holds the clicked button and moves focus to the section heading. */
const dismiss = (event: Event): void => {
  (event.currentTarget as HTMLElement).closest('line-alert')?.remove();
  document.getElementById('notices')?.focus();
};

export const DismissRecipe: Story = {
  name: 'Dismiss recipe',
  parameters: {
    docs: {
      description: {
        story:
          'Alert has no close button of its own. This recipe puts a dismiss button in `actions`, removes the alert on click and moves focus to the section heading, which carries `tabindex="-1"`.',
      },
      source: { code: DISMISS_CODE },
    },
  },
  render: () =>
    html`<h2 id="notices" tabindex="-1">Notices</h2>
      <line-alert id="features" variant="info">
        New features are available.
        <line-icon-button slot="actions" aria-label="Dismiss notice" @click=${dismiss}>
          <line-icon library="lucide" name="x"></line-icon>
        </line-icon-button>
      </line-alert>`,
};

export const CustomTokens: Story = {
  name: 'Custom tokens',
  render: () =>
    html`<style>
        line-alert.compact {
          --line-alert-padding: var(--line-size-2);
          --line-alert-radius: var(--line-radius-1);
        }
        line-alert.compact::part(title) {
          font-weight: 600;
        }
      </style>
      <line-alert class="compact" variant="warning">
        <span slot="title">Low disk space</span>
        Warning: 2 GB left on this device.
      </line-alert>`,
};
