import '@nudeui/icons';
import '@websublime/line-components/alert';
import '@websublime/line-components/button';
import '@websublime/line-components/chip';
import '@websublime/line-components/icon-button';
import '@websublime/line-tokens/border-width';
import '@websublime/line-tokens/focus-ring';
import '@websublime/line-tokens/layouts';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { installIconTokens } from './css-mask-icons.js';

// The CSS mask icons recipe (ledger 01-D4; ARCHITECTURE §11, "or anything else"). `@nudeui/icons` is the icon system
// CSS and loads into the document with this module; the tokens and the hover rule come from `installIconTokens`.
// Each example puts an empty element in a line://ui slot, and its masked pseudo-element paints the glyph. No
// component changes. `data-mask-icon` names the glyph each element paints and `data-mask-icon-missing` marks the one
// that paints nothing; css-mask-icons.e2e.ts reads both, and the docs source leaves them out.

installIconTokens();

type Story = StoryObj;

/** Renders `markup` in a row, or in `layout`, and shows it without the test hooks as the story's source. */
function example(markup: string, layout = 'display: flex; flex-wrap: wrap; gap: 8px; align-items: center'): Story {
  const code = markup.replace(/ data-mask-icon(-missing)?(="[^"]*")?/g, '');
  return {
    parameters: { docs: { source: { code, language: 'html' } } },
    render: () => html`<div style=${layout}>${unsafeHTML(markup)}</div>`,
  };
}

const meta = { title: 'Recipes/CSS mask icons' } satisfies Meta;

export default meta;

export const ButtonPrefixAndSuffix: Story = {
  name: 'Button prefix and suffix',
  ...example(`<line-button>
  <span slot="prefix" class="icon" style="--icon: var(--icon-check)" data-mask-icon="check"></span>
  Save
</line-button>
<line-button variant="primary">
  <span slot="prefix" class="icon" style="--icon: var(--icon-plus)" data-mask-icon="plus"></span>
  Add item
</line-button>
<line-button variant="borderless">
  Refresh
  <span slot="suffix" style="--icon-end: var(--icon-refresh-cw)" data-mask-icon="refresh-cw"></span>
</line-button>
<line-button>
  Settings
  <span slot="suffix" class="icon-end" style="--icon-end: var(--icon-settings)" data-mask-icon="settings"></span>
</line-button>`),
};

export const IconButtonIconOnly: Story = {
  name: 'IconButton, icon only',
  ...example(`<line-icon-button aria-label="Settings">
  <span class="icon" style="--icon: var(--icon-settings)" data-mask-icon="settings"></span>
</line-icon-button>
<line-icon-button variant="primary" aria-label="Add item">
  <span class="icon" style="--icon: var(--icon-plus)" data-mask-icon="plus"></span>
</line-icon-button>
<line-icon-button variant="borderless" aria-label="Close dialog">
  <span class="icon" style="--icon: var(--icon-x)" data-mask-icon="x"></span>
</line-icon-button>`),
};

export const ChipSlots: Story = {
  name: 'Chip prefix, suffix and indicator',
  ...example(`<line-chip pressed>
  <span slot="indicator" class="icon" style="--icon: var(--icon-check)" data-mask-icon="check"></span>
  <span slot="prefix" class="icon" style="--icon: var(--icon-star)" data-mask-icon="star"></span>
  Favourites
</line-chip>
<line-chip variant="primary">
  Refresh daily
  <span slot="suffix" class="icon-end" style="--icon-end: var(--icon-refresh-cw)" data-mask-icon="refresh-cw"></span>
</line-chip>`),
};

export const AlertIcon: Story = {
  name: 'Alert icon',
  ...example(
    `<line-alert variant="danger">
  <span slot="icon" class="icon" style="--icon: var(--icon-circle-alert)" data-mask-icon="circle-alert"></span>
  <strong slot="title">Error: payment failed</strong>
  Check the card number and try again.
</line-alert>
<line-alert variant="success">
  <span slot="icon" class="icon" style="--icon: var(--icon-check)" data-mask-icon="check"></span>
  Success: your changes were saved.
</line-alert>`,
    'display: grid; gap: 12px; max-inline-size: 480px',
  ),
};

export const HoverSwap: Story = {
  name: 'Swap on hover',
  ...example(`<line-button variant="borderless">
  <span slot="prefix" class="icon" style="--icon: var(--icon-star); --icon-hover: var(--icon-plus)" data-mask-icon="star"></span>
  Add to favourites
</line-button>`),
};

export const Size: Story = {
  name: 'Size',
  ...example(`<line-icon-button aria-label="Zoom out">
  <span class="icon" style="--icon: var(--icon-zoom-out)" data-mask-icon="zoom-out"></span>
</line-icon-button>
<line-icon-button aria-label="Refresh" style="--icon-style-size: 1.25em">
  <span class="icon" style="--icon: var(--icon-refresh-cw)" data-mask-icon="refresh-cw"></span>
</line-icon-button>
<line-icon-button aria-label="Zoom in" style="--icon-style-size: 1.5em">
  <span class="icon" style="--icon: var(--icon-zoom-in)" data-mask-icon="zoom-in"></span>
</line-icon-button>`),
};

export const MissingToken: Story = {
  name: 'A missing token',
  ...example(`<line-button>
  <span slot="prefix" class="icon" style="--icon: var(--icon-check)" data-mask-icon="check"></span>
  Save
</line-button>
<line-button>
  <span slot="prefix" class="icon" style="--icon: var(--icon-does-not-exist)" data-mask-icon-missing></span>
  Save
</line-button>`),
};
