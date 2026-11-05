import '@websublime/line-components/button';
import '@websublime/line-tokens/focus-ring';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { ButtonType, ButtonVariant } from '@websublime/line-components/button';
import { html, nothing, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-button> stories (spec 0002-button.md). The autodocs page reads the
// attributes, slots, events and parts from the shipped Custom Elements
// Manifest that preview.ts registers. The stories import only the token
// families Button uses; the line-tokens barrel carries reset.css, which would
// restyle the docs page. The Styled states stylesheet is story-local; the
// package ships no state style besides the focus ring (spec AM-008).

interface ButtonArgs {
  label: string;
  variant: ButtonVariant;
  type: ButtonType;
  disabled: boolean;
  loading: boolean;
}

/** A 16 px decorative icon; the button's text names it. */
const icon = (slot: 'prefix' | 'suffix' | null, path: string): TemplateResult =>
  html`<svg slot=${slot ?? nothing} aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d=${path} /></svg>`;

const CHECK = 'M3 8.5l3 3 7-7';
const CHEVRON_DOWN = 'M4 6l4 4 4-4';
const GEAR =
  'M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3';

/**
 * The Styled states story's stylesheet, scoped to the story; the docs snippet is the same rules without the scope.
 * The role aliases come from `line-themes`, which preview.ts loads.
 */
const STATE_CSS = `.styled-states line-button:hover::part(root) { background: var(--line-gray-bg-hover); }
.styled-states line-button[data-active]::part(root) { background: var(--line-gray-bg-active); }
.styled-states line-button[variant='primary']:hover::part(root) { background: var(--line-accent-solid-hover); }
.styled-states line-button[variant='primary'][data-active]::part(root) { background: var(--line-accent-text-low); }
.styled-states line-button[variant='borderless']:hover::part(root) { background: var(--line-accent-bg-hover); }
.styled-states line-button[variant='borderless'][data-active]::part(root) { background: var(--line-accent-bg-active); }
.styled-states line-button[data-pressed]::part(root) { background: var(--line-accent-bg-active); color: var(--line-accent-text); }
.styled-states line-button:state(loading)::part(root) { cursor: progress; }
.styled-states line-button[data-disabled]::part(root) { opacity: 0.5; }`;

const DESCRIPTION = `\`<line-button>\` runs an action, submits or resets its form, or toggles with \`pressed\`.

### Styling states

The button draws only the focus ring. Hover, active, pressed, loading and disabled carry no style, so a theme or your own CSS styles them on the host and reaches the inner button through \`::part(root)\`:

- \`:hover\` and \`:active\` match the host itself, so there is no \`data-hovered\`.
- \`[data-active]\`, \`[data-pressed]\`, \`[data-loading]\`, \`[data-disabled]\` and \`[data-focus-visible]\` reflect the button's state, with the same names as \`:state()\`, such as \`:state(loading)\`. \`data-active\` also covers a press by Enter or Space.
- The \`line-themes\` role aliases give each state a colour step, such as \`--line-gray-bg-hover\`, \`--line-gray-bg-active\` and \`--line-accent-solid-hover\`.

The **Styled states** story uses these rules:

\`\`\`css
${STATE_CSS.replaceAll('.styled-states ', '')}
\`\`\``;

const meta = {
  title: 'Components/Button',
  component: 'line-button',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { label: 'Save', variant: 'default', type: 'submit', disabled: false, loading: false },
  argTypes: {
    label: { control: 'text', description: 'Text in the default slot' },
    variant: { control: 'inline-radio', options: ['default', 'primary', 'borderless'] },
    type: { control: 'inline-radio', options: ['submit', 'reset', 'button'] },
  },
  render: ({ label, variant, type, disabled, loading }) =>
    html`<line-button variant=${variant} type=${type} ?disabled=${disabled} ?loading=${loading}>${label}</line-button>`,
} satisfies Meta<ButtonArgs>;

export default meta;

type Story = StoryObj<ButtonArgs>;

export const Default: Story = {};

export const Primary: Story = {
  args: { label: 'Publish', variant: 'primary' },
};

export const Borderless: Story = {
  args: { label: 'Cancel', variant: 'borderless' },
};

export const PrefixAndSuffix: Story = {
  name: 'Prefix and suffix',
  render: ({ label, variant, disabled, loading }) =>
    html`<line-button variant=${variant} ?disabled=${disabled} ?loading=${loading}
      >${icon('prefix', CHECK)}${label}${icon('suffix', CHEVRON_DOWN)}</line-button
    >`,
};

export const Disabled: Story = {
  args: { label: 'Delete', disabled: true },
};

export const Loading: Story = {
  name: 'Loading with the loading slot',
  args: { loading: true },
  render: ({ label, variant, disabled, loading }) =>
    html`<line-button variant=${variant} ?disabled=${disabled} ?loading=${loading}
      >${label}<span slot="loading">Saving…</span></line-button
    >`,
};

export const ToggleOff: Story = {
  name: 'Toggle off',
  args: { label: 'Bold', type: 'button' },
  render: ({ label, variant }) =>
    html`<line-button variant=${variant} type="button" pressed="false">${label}</line-button>`,
};

export const ToggleOn: Story = {
  name: 'Toggle on',
  args: { label: 'Bold', type: 'button' },
  render: ({ label, variant }) =>
    html`<line-button variant=${variant} type="button" pressed="true">${label}</line-button>`,
};

export const AriaLabelOnly: Story = {
  name: 'aria-label only',
  args: { label: 'Settings', type: 'button' },
  render: ({ label, variant }) =>
    html`<line-button variant=${variant} type="button" aria-label=${label}>${icon(null, GEAR)}</line-button>`,
};

export const Form: Story = {
  name: 'In a form',
  render: () => {
    const show = (event: SubmitEvent) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      const sent = [...new FormData(form, event.submitter)].map(([key, value]) => `${key}=${String(value)}`);
      const output = form.querySelector('output');
      if (output) output.value = `Sent ${sent.join('&')}`;
    };
    return html`<form @submit=${show} style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
      <label>Email <input name="email" type="email" value="ada@example.com" /></label>
      <line-button variant="primary" name="intent" value="save">Save</line-button>
      <line-button name="intent" value="draft">Save draft</line-button>
      <line-button type="reset" variant="borderless">Reset</line-button>
      <output name="result" aria-live="polite"></output>
    </form>`;
  },
};

export const StyledStates: Story = {
  name: 'Styled states',
  render: () =>
    html`${unsafeHTML(`<style>${STATE_CSS}</style>`)}
      <div class="styled-states" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
        <line-button type="button">Default</line-button>
        <line-button type="button" variant="primary">Primary</line-button>
        <line-button type="button" variant="borderless">Borderless</line-button>
        <line-button type="button" pressed="false">Bold</line-button>
        <line-button type="button" pressed="true">Italic</line-button>
        <line-button type="button" loading>Save<span slot="loading">…</span></line-button>
        <line-button type="button" disabled>Delete</line-button>
      </div>`,
};
