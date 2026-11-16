import '@websublime/line-components/skeleton';
import '@websublime/line-tokens/easings';
import '@websublime/line-tokens/motion';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-skeleton> stories (spec 0016-skeleton.md, decision D13). The autodocs page reads the attributes, parts and
// custom properties from the shipped Custom Elements Manifest that preview.ts registers. The stories import only the
// token families Skeleton reads; the line-tokens barrel carries reset.css, which would restyle the docs page. The
// visual tier fast-forwards the two-cycle motion to its resting style (D14).

const DESCRIPTION = `\`<line-skeleton>\` is a placeholder that stands where content will appear once it loads, so the page keeps its layout while it waits. It draws a block, a circle or lines of text sized to the surrounding font, and it holds no content of its own: the app replaces it with the content.

\`\`\`html
<article aria-busy="true" aria-label="Profile">
  <line-skeleton shape="circle"></line-skeleton>
  <line-skeleton shape="text" lines="2"></line-skeleton>
</article>
\`\`\`

- **Busy region.** The placeholder is hidden from assistive technology. Put \`aria-busy="true"\` on the region that is loading, such as the card or the list, while the placeholders show, and remove it when the content arrives. To announce the load, use a live region or \`<line-spinner>\`.
- **Shapes.** \`shape\` is \`rect\` (default) for an image, a card or a block, \`circle\` for an avatar or an icon, and \`text\` for lines of text: each line takes one line box of the surrounding font. \`lines\` draws that many items, from 1 to 20, the last of several shorter.
- **Motion.** \`animation\` is \`pulse\` (default), \`wave\` or \`none\`. The motion stops after two cycles, 4 s with the default tokens, and does not run while the user asks the system for reduced motion. An app that keeps motion under reduced motion does it with a page rule, \`line-skeleton::part(item) { animation: <page keyframes> … }\`, and then owns that choice; the component's keyframe names are internal.
- **Colours and sizes.** Set \`--line-skeleton-bg\` and \`--line-skeleton-wave-color\` on the host, or app-wide through \`line-skeleton { … }\`, to choose the fill and the band; a value on an ancestor or \`:root\` does not reach the host. Size a placeholder through \`--line-skeleton-inline-size\` and \`--line-skeleton-block-size\` or \`::part(item)\`. Under forced colors every item paints \`GrayText\`.
- **Before the module runs.** The host takes no space until its module runs. Reserve it with a page rule:

\`\`\`css
line-skeleton:not(:defined) {
  display: block;
  block-size: var(--line-size-4);
}
\`\`\`

- **Naming.** Do not put \`aria-label\` on the host. It has no role a name could attach to. Do not put a skeleton alone inside a button or a link, which leaves the control without a name.
- **Not verified.** No check reads the Firefox or WebKit accessibility tree, and no screen reader was run.`;

const meta = {
  title: 'Components/Primitives Base/Skeleton',
  id: 'components-skeleton',
  component: 'line-skeleton',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  parameters: { docs: { description: { story: 'One `rect` item that pulses twice.' } } },
  render: () => html`<line-skeleton></line-skeleton>`,
};

export const Shapes: Story = {
  parameters: {
    docs: { description: { story: '`rect` for a block, `circle` for an avatar, `text` for a line of text.' } },
  },
  render: () =>
    html`<line-skeleton shape="rect"></line-skeleton>
      <p><line-skeleton shape="circle"></line-skeleton></p>
      <p><line-skeleton shape="text"></line-skeleton></p>`,
};

export const TextLines: Story = {
  name: 'Text lines',
  parameters: {
    docs: {
      description: {
        story: 'Three text lines beside a real paragraph of three lines: each line takes one line box of the font.',
      },
    },
  },
  render: () =>
    html`<div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--line-size-4)">
      <p><line-skeleton shape="text" lines="3"></line-skeleton></p>
      <p>One<br />Two<br />Three</p>
    </div>`,
};

export const Wave: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A band sweeps across twice, then the item rests on its plain fill.',
      },
    },
  },
  render: () => html`<line-skeleton animation="wave" lines="2"></line-skeleton>`,
};

export const NoAnimation: Story = {
  name: 'No animation',
  parameters: { docs: { description: { story: 'A still placeholder, as in a dense layout.' } } },
  render: () => html`<line-skeleton animation="none"></line-skeleton>`,
};

export const ProfileCard: Story = {
  name: 'Profile card',
  parameters: {
    docs: {
      description: {
        story: 'A busy `<article>` holds an avatar circle, two text lines and a block while its data loads.',
      },
    },
  },
  render: () =>
    html`<article aria-busy="true" aria-label="Profile" style="max-inline-size: 24rem">
      <div style="display: flex; align-items: center; gap: var(--line-size-3)">
        <line-skeleton shape="circle"></line-skeleton>
        <line-skeleton shape="text" lines="2" style="flex: 1"></line-skeleton>
      </div>
      <line-skeleton lines="3" style="margin-block-start: var(--line-size-3)"></line-skeleton>
    </article>`,
};

export const CustomTokens: Story = {
  name: 'Custom tokens',
  parameters: {
    docs: {
      description: {
        story:
          'The Consumer styling rules: a 40% title bar, the consumer colours for the fill and the band, a larger avatar and a pulse that keeps running.',
      },
    },
  },
  render: () =>
    html`<style>
        line-skeleton.title {
          --line-skeleton-inline-size: 40%;
          --line-skeleton-block-size: var(--line-size-6);
        }
        line-skeleton.brand {
          --line-skeleton-bg: oklch(92% 0.03 250);
          --line-skeleton-wave-color: oklch(97% 0.02 250);
        }
        line-skeleton.avatar {
          --line-skeleton-block-size: var(--line-size-9);
        }
        line-skeleton.long {
          --line-skeleton-iteration-count: infinite;
        }
      </style>
      <line-skeleton class="title"></line-skeleton>
      <p><line-skeleton class="brand" animation="wave" lines="2"></line-skeleton></p>
      <p><line-skeleton class="avatar" shape="circle"></line-skeleton></p>
      <p><line-skeleton class="long"></line-skeleton></p>`,
};
