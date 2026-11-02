import '@websublime/line-components/icon';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { setIconRegistry } from '@websublime/line-components';
import { IconRegistry } from '@websublime/line-icons';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';
import { createPhosphorResolver } from '@websublime/line-icons/resolvers/phosphor';
import { html, nothing } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-icon> stories (spec 0014-icon.md). The autodocs page reads the
// attributes, part and custom property from the shipped Custom Elements
// Manifest that preview.ts registers. The icon files are self-hosted under
// public/icons/, so the stories make no third-party request. A labelled icon
// takes the `img` role through ElementInternals, which the addon panel's axe
// 4.11.4 cannot see, so the panel reports a false `aria-prohibited-attr` on the
// Labelled story (spec A11y, "What axe proves here").

const registry = new IconRegistry();
registry.register('lucide', createLucideResolver({ base: './icons/lucide/' }));
registry.register('phosphor', createPhosphorResolver({ base: './icons/phosphor/' }));
setIconRegistry(registry);

const DESCRIPTION = `\`<line-icon>\` draws one glyph at the size and in the colour of the surrounding text.

Register your icon sets once, then ask for a glyph by \`library\` and \`name\`:

\`\`\`js
import { setIconRegistry } from '@websublime/line-components';
import '@websublime/line-components/icon';
import { IconRegistry } from '@websublime/line-icons';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';

const registry = new IconRegistry();
registry.register('lucide', createLucideResolver({ base: '/icons/lucide/' }));
setIconRegistry(registry);
\`\`\`

- \`library\` has no default. A \`name\` without \`library\`, an unknown name or any failed load leaves an empty box of the icon's size and raises nothing.
- \`src\` loads an SVG file, and the \`path\` property draws path data in a 24 × 24 box. The first non-empty source of \`path\`, \`src\`, then \`name\` with \`library\` wins.
- The icon is decorative and hidden from assistive technology. A host \`aria-label\` or \`aria-labelledby\` makes it an image with that name.
- Size it with \`--line-icon-size\` (default \`1em\`) on the icon or on any ancestor; colour it with \`color\`. \`::part(svg)\` reaches the glyph.
- Every SVG string passes the Trusted Types policy \`line-icon\`. A page that enforces Trusted Types lists it beside Lit's own policy: \`trusted-types line-icon lit-html\`.
- A custom resolver may return an \`SVGElement\`, which is inserted unchanged. Return a fresh node per call, with \`aria-hidden="true"\` unless it should be announced.`;

interface IconArgs {
  library: string;
  name: string;
  weight: string;
  mirror: boolean;
}

const meta = {
  title: 'Components/Icon',
  component: 'line-icon',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { library: 'lucide', name: 'house', weight: '', mirror: false },
  argTypes: {
    library: { control: 'inline-radio', options: ['lucide', 'phosphor'] },
    name: { control: 'text' },
    weight: { control: 'inline-radio', options: ['', 'regular', 'fill'] },
  },
  render: ({ library, name, weight, mirror }) =>
    html`<line-icon library=${library} name=${name} weight=${weight || nothing} ?mirror=${mirror}></line-icon>`,
} satisfies Meta<IconArgs>;

export default meta;

type Story = StoryObj<IconArgs>;

export const Default: Story = {};

export const Labelled: Story = {
  render: () =>
    html`<p>
      Upload status:
      <line-icon library="lucide" name="circle-alert" aria-label="Error"></line-icon>
    </p>`,
};

export const Weight: Story = {
  render: () =>
    html`<p>
      <line-icon library="phosphor" name="heart"></line-icon> Regular
      <line-icon library="phosphor" name="heart" weight="fill"></line-icon> Fill
    </p>`,
};

export const MirrorRtl: Story = {
  name: 'Mirror (RTL)',
  render: () =>
    html`<p dir="ltr"><line-icon library="lucide" name="arrow-left" mirror></line-icon> Back (left to right)</p>
      <p dir="rtl"><line-icon library="lucide" name="arrow-left" mirror></line-icon> Back (right to left)</p>`,
};

export const Path: Story = {
  render: () => html`<p><line-icon .path=${'M12 2 L22 22 L2 22 Z'}></line-icon> Path data in a 24 × 24 box</p>`,
};

export const Src: Story = {
  render: () => html`<p><line-icon src="./icons/lucide/star.svg"></line-icon> Loaded from an SVG file</p>`,
};

export const SizeAndColour: Story = {
  name: 'Size and colour',
  render: () =>
    html`<style>
        .icon-row line-icon.accent {
          color: var(--line-accent-text);
        }
        .icon-row.large {
          --line-icon-size: 1.5em;
        }
      </style>
      <p class="icon-row">
        <line-icon library="lucide" name="check"></line-icon>
        <line-icon library="lucide" name="check" style="--line-icon-size: 2rem"></line-icon>
        <line-icon class="accent" library="lucide" name="check" style="--line-icon-size: 3rem"></line-icon>
      </p>
      <p class="icon-row large">
        Every icon in this row is 1.5em
        <line-icon library="lucide" name="house"></line-icon>
        <line-icon class="accent" library="phosphor" name="heart" weight="fill"></line-icon>
      </p>`,
};

export const Missing: Story = {
  name: 'Missing (C8)',
  render: () =>
    html`<style>
        .icon-missing line-icon {
          outline: 1px dashed currentColor;
        }
      </style>
      <p class="icon-missing">
        <line-icon library="lucide" name="definitely-not-an-icon"></line-icon> Unknown name
        <line-icon name="house"></line-icon> Name without library
      </p>`,
};

export const ForeignRole: Story = {
  name: 'Foreign role',
  render: () =>
    html`<p><line-icon src="./icons/foreign-role.svg"></line-icon> A file whose root carries role="img"</p>`,
};
