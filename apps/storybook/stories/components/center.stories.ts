import '@websublime/line-components/center';
import '@websublime/line-components/stack';
import '@websublime/line-tokens/layouts';
import '@websublime/line-tokens/sizing';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { CenterAxis } from '@websublime/line-components/center';
import { html } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-center> stories (spec 0020-center.md, default D14). The autodocs page reads the attributes and slots from
// the shipped Custom Elements Manifest that preview.ts registers. The stories import the token families the
// line-stack of two stories reads; Center reads none. The outlined boxes of a set height are story markup, so the
// centring is visible; Center itself draws nothing.

const DESCRIPTION = `\`<line-center>\` centres its content horizontally, vertically or on both axes. The host is a flex container that lays its children out as one column, in source order and with no gap, and centres them in the writing direction of the page. \`axis\` picks the axes: \`both\` (default), \`horizontal\` (the inline axis) or \`vertical\` (the block axis). Content larger than the box starts at its start edge, so none of it is cut off.

\`\`\`html
<line-center style="min-block-size: 16rem">
  <p>No results</p>
</line-center>
\`\`\`

- **Height.** Vertical centring needs a height. Give \`line-center\` a \`block-size\` or \`min-block-size\`, or place it where a parent stretches it, such as a grid cell, a flex row or a horizontal \`<line-stack>\` at its default \`align\`. A vertical \`<line-stack>\` at its default \`justify\` does not stretch it top to bottom; with \`justify="stretch"\` it does.
- **In a flex row.** In a flex row, such as a horizontal \`<line-stack>\`, or in an \`auto\` grid track, \`line-center\` is as wide as its content, so horizontal centring has no room. Give it \`flex: 1\` or a width there, or set \`justify="stretch"\` on the Stack.
- **In a Stack.** In a \`<line-stack>\` whose \`align\` is not \`stretch\`, \`line-center\` is only as large as its content across the Stack, and the Stack's \`align\` places the box instead. \`justify="stretch"\` grows it along the Stack.
- **Several children.** Several children form one centred column with no gap. To space them, or to set them side by side, put a \`<line-stack>\` inside the Center.
- **Text.** Center moves boxes, not lines of text. To centre the lines of a paragraph, set \`text-align: center\` on the paragraph.
- **Display.** A \`display\` rule on \`line-center\` shows a hidden Center. Exclude \`[hidden]\`: \`line-center:not([hidden]) { display: inline-flex; }\`.
- **Names.** Without a role, Center is a \`generic\` element: do not give it an \`aria-label\`, which names nothing a user can reach. For a named group put \`role="group"\` and an \`aria-label\` on the host; for a landmark use \`role="region"\`.
- **Order.** Center keeps the source order. Consumer CSS that moves children with \`order\` or \`flex-direction: column-reverse\` makes the visual order differ from the reading and focus order; avoid it.
- **Not verified.** No check reads the Firefox or WebKit accessibility tree, and no screen reader was run.`;

interface CenterArgs {
  axis: CenterAxis;
}

const BOX = 'padding: 4px 8px; border: 1px solid currentColor;';
const FRAME = 'border: 1px dashed currentColor; block-size: 10rem;';

const meta = {
  title: 'Components/Primitives Base/Center',
  id: 'components-center',
  component: 'line-center',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { axis: 'both' },
  argTypes: {
    axis: { control: 'inline-radio', options: ['both', 'horizontal', 'vertical'] },
  },
  render: ({ axis }) => html`<line-center axis=${axis} style=${FRAME}><div style=${BOX}>Content</div></line-center>`,
} satisfies Meta<CenterArgs>;

export default meta;

type Story = StoryObj<CenterArgs>;

export const Default: Story = {
  parameters: { docs: { description: { story: 'One child, centred on both axes in a 10rem box.' } } },
};

export const Axes: Story = {
  parameters: {
    docs: {
      description: {
        story: '`both`, `horizontal` and `vertical` side by side; a one-axis Center keeps the other axis at its start.',
      },
    },
  },
  render: () =>
    html`<line-stack orientation="horizontal" justify="stretch">
      ${(['both', 'horizontal', 'vertical'] as const).map(
        (axis) => html`<line-center axis=${axis} style=${FRAME}><div style=${BOX}>${axis}</div></line-center>`,
      )}
    </line-stack>`,
};

export const SeveralChildren: Story = {
  name: 'Several children',
  parameters: {
    docs: {
      description: {
        story:
          'Three children form one centred column with no gap; a `line-stack` inside the second Center spaces them.',
      },
    },
  },
  render: () =>
    html`<line-stack gap="4">
      <line-center style=${FRAME}>
        <div style=${BOX}>One</div>
        <div style="${BOX} inline-size: 8rem">Two</div>
        <div style=${BOX}>Three</div>
      </line-center>
      <line-center style=${FRAME}>
        <line-stack gap="3" align="center">
          <div style=${BOX}>One</div>
          <div style="${BOX} inline-size: 8rem">Two</div>
          <div style=${BOX}>Three</div>
        </line-stack>
      </line-center>
    </line-stack>`,
};

export const Text: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A bare text node centred in a box, and an inline Center through `line-center.tile:not([hidden]) { display: inline-flex }`, holding a letter in a 2rem tile inside a line of text.',
      },
    },
  },
  render: () =>
    html`<style>
        line-center.tile:not([hidden]) {
          display: inline-flex;
          inline-size: 2rem;
          block-size: 2rem;
          border: 1px solid currentColor;
          vertical-align: middle;
        }
      </style>
      <line-center style=${FRAME}>Hello</line-center>
      <p>Signed in as <line-center class="tile">A</line-center> Ana Silva.</p>`,
};

export const InAHorizontalStack: Story = {
  name: 'In a horizontal Stack',
  parameters: {
    docs: {
      description: {
        story:
          'A Center beside a tall box: at the Stack\'s default `align` the Center is as tall as the row and as wide as its content, so only vertical centring shows; with `justify="stretch"` it also takes its share of the row and centres on both axes.',
      },
    },
  },
  render: () =>
    html`<line-stack gap="4">
      <line-stack orientation="horizontal">
        <div style="${BOX} inline-size: 8rem; block-size: 8rem">Image</div>
        <line-center style="border: 1px dashed currentColor"><div style=${BOX}>Caption</div></line-center>
      </line-stack>
      <line-stack orientation="horizontal" justify="stretch">
        <div style="${BOX} inline-size: 8rem; block-size: 8rem">Image</div>
        <line-center style="border: 1px dashed currentColor"><div style=${BOX}>Caption</div></line-center>
      </line-stack>
    </line-stack>`,
};

export const Overflow: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A child larger than its scrolling box starts at the start edge, so every part of it is reachable by scrolling.',
      },
    },
  },
  render: () =>
    html`<div
      tabindex="0"
      role="region"
      aria-label="Overflowing content"
      style="inline-size: 16rem; block-size: 8rem; overflow: auto; border: 1px dashed currentColor"
    >
      <line-center style="block-size: 100%">
        <div style="${BOX} flex: none; inline-size: 24rem; block-size: 12rem">Larger than the box</div>
      </line-center>
    </div>`,
};

export const AuthorGroup: Story = {
  name: 'Author group',
  parameters: {
    docs: {
      description: {
        story: '`role="group"` and an `aria-label` on the host name a group of two buttons.',
      },
    },
  },
  render: () =>
    html`<line-center role="group" aria-label="Actions" style=${FRAME}>
      <button type="button">Save</button>
      <button type="button">Cancel</button>
    </line-center>`,
};
