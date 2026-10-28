import '@websublime/line-components/stack';
import '@websublime/line-tokens/layouts';
import '@websublime/line-tokens/sizing';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { StackAlign, StackGap, StackJustify, StackOrientation } from '@websublime/line-components/stack';
import { html, nothing, type TemplateResult } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-stack> stories (spec 0018-stack.md). The autodocs page reads the
// attributes, slots and custom properties from the shipped Custom Elements
// Manifest that preview.ts registers. The stories import only the token
// families Stack uses. The outlined boxes are story markup, so the layout is
// visible; Stack itself draws nothing.

interface StackArgs {
  orientation: StackOrientation;
  justify: StackJustify;
  align: StackAlign;
  gap: StackGap | '';
  wrap: boolean;
  items: number;
}

const BOX = 'padding: 4px 8px; border: 1px solid currentColor;';

/** `count` outlined boxes labelled `Item 1` … `Item n`. */
const boxes = (count: number): TemplateResult[] =>
  Array.from({ length: count }, (_, index) => html`<div style=${BOX}>Item ${index + 1}</div>`);

const meta = {
  title: 'Components/Stack',
  component: 'line-stack',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes } },
  args: { orientation: 'vertical', justify: 'start', align: 'stretch', gap: '', wrap: false, items: 3 },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'spaceBetween', 'spaceAround', 'spaceEvenly', 'stretch'],
    },
    align: { control: 'inline-radio', options: ['start', 'center', 'end', 'stretch'] },
    gap: { control: 'select', options: ['', '0', '1', '2', '3', '4', '5'], description: 'Empty means no attribute' },
    items: { control: { type: 'number', min: 0, max: 12 }, description: 'Number of story boxes in the default slot' },
  },
  render: ({ orientation, justify, align, gap, wrap, items }) =>
    html`<line-stack orientation=${orientation} justify=${justify} align=${align} gap=${gap || nothing} ?wrap=${wrap}
      >${boxes(items)}</line-stack
    >`,
} satisfies Meta<StackArgs>;

export default meta;

type Story = StoryObj<StackArgs>;

export const Default: Story = {
  render: ({ items }) => html`<line-stack>${boxes(items)}</line-stack>`,
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
};

export const JustifyAndAlign: Story = {
  name: 'Justify and align',
  args: { orientation: 'horizontal', justify: 'spaceBetween', align: 'center' },
  render: ({ orientation, justify, align, gap }) =>
    html`<line-stack orientation=${orientation} justify=${justify} align=${align} gap=${gap || nothing}>
      <div style=${BOX}>Title</div>
      <div style="${BOX} padding-block: 16px">Edit</div>
    </line-stack>`,
};

export const JustifyStretch: Story = {
  name: 'Justify stretch',
  args: { orientation: 'horizontal', justify: 'stretch' },
};

export const GapScale: Story = {
  name: 'Gap scale',
  render: () =>
    html`<line-stack gap="4">
      ${(['0', '1', '2', '3', '4', '5'] as const).map(
        (gap) => html`<line-stack orientation="horizontal" gap=${gap}>
          <div style=${BOX}>gap ${gap}</div>
          <div style=${BOX}>Item</div>
          <div style=${BOX}>Item</div>
        </line-stack>`,
      )}
    </line-stack>`,
};

export const Wrap: Story = {
  args: { orientation: 'horizontal', wrap: true, items: 12 },
  render: ({ orientation, wrap, items }) =>
    html`<line-stack orientation=${orientation} ?wrap=${wrap} style="max-inline-size: 320px">${boxes(items)}</line-stack>`,
};

export const AuthorList: Story = {
  name: 'Author-built list',
  render: () =>
    html`<line-stack role="list" aria-label="Recent files">
      <div role="listitem">report.pdf</div>
      <div role="listitem">notes.md</div>
      <div role="listitem">budget.xlsx</div>
    </line-stack>`,
};
