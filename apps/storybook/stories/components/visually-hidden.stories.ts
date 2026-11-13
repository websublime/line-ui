import '@websublime/line-components/visually-hidden';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-visually-hidden> stories (spec 0012-visually-hidden.md, decision D11). The autodocs page reads the default
// slot from the shipped Custom Elements Manifest that preview.ts registers. Visually Hidden reads no token, so the
// stories import none; the preview loads the theme. The Badge example is the Badge story "Count with hidden words".

const DESCRIPTION = `\`<line-visually-hidden>\` holds content that assistive technology reads and the screen does not show. The host draws nothing and takes no space, in a block, flex or grid parent alike.

\`\`\`html
<a href="/pricing">Read more<line-visually-hidden> about pricing</line-visually-hidden></a>
\`\`\`

- **Reading.** The content is read where it sits, and inside a link, a button or a heading it joins that element's name, such as "Read more about pricing".
- **Order.** Put the hidden words after a control's visible words, so the control's name starts with what users see and speech-input users can say it.
- **Focus.** While focus is inside, the content shows, so a skip link appears when a keyboard user reaches it. Place the shown content with consumer CSS on \`line-visually-hidden:focus-within\`.
- **Removing content.** Use \`hidden\` on the host to remove the words for everyone. Do not use \`aria-hidden\`, because Chromium keeps the words in the name of a control around them.
- **Naming.** Do not put \`aria-label\` on the host. It has no role a name could attach to. To name a line component, use its own \`aria-label\`.
- **Announcing.** Visually Hidden announces nothing when its content changes. Use Alert or a live region for a message that must be heard.
- **Before the upgrade.** The words show until the module runs. To hide them before then, add this rule to the page:

\`\`\`css
line-visually-hidden:not(:defined):not(:focus-within) {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
\`\`\``;

/** The skip link of the Skip link stories, with the Consumer styling rule that places it while it has focus (F2). */
const skipLink = html`<style>
    line-visually-hidden.skip:focus-within {
      position: fixed;
      inset-block-start: 0.5rem;
      inset-inline-start: 0.5rem;
      z-index: 10;
    }
  </style>
  <line-visually-hidden class="skip"><a href="#main">Skip to main content</a></line-visually-hidden>
  <main id="main" tabindex="-1">
    <h1>Orders</h1>
    <p>Three orders wait for review.</p>
  </main>`;

const meta = {
  title: 'Components/Primitives Base/Visually Hidden',
  id: 'components-visually-hidden',
  component: 'line-visually-hidden',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  render: () => html`<a href="#pricing">Read more<line-visually-hidden> about pricing</line-visually-hidden></a>`,
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const InALink: Story = {
  name: 'In a link',
  parameters: { docs: { description: { story: 'The link is named "Read more about pricing".' } } },
};

export const InAButton: Story = {
  name: 'In a button',
  parameters: { docs: { description: { story: 'The button is named "Delete draft Quarterly report".' } } },
  render: () =>
    html`<button type="button">Delete<line-visually-hidden> draft Quarterly report</line-visually-hidden></button>`,
};

export const SectionHeading: Story = {
  name: 'Section heading',
  parameters: {
    docs: { description: { story: 'A heading that names the section for screen-reader navigation.' } },
  },
  render: () =>
    html`<h2><line-visually-hidden>Account settings</line-visually-hidden></h2>
      <p>Email, password and two-step sign-in.</p>`,
};

export const SkipLink: Story = {
  name: 'Skip link',
  parameters: {
    docs: {
      description: {
        story: 'The skip link stays hidden until a keyboard user tabs to it; the story `<style>` places it then.',
      },
    },
  },
  render: () => skipLink,
};

export const SkipLinkFocused: Story = {
  name: 'Skip link focused',
  parameters: {
    docs: { description: { story: 'The same markup with focus on the skip link, which shows while it has focus.' } },
  },
  render: () => skipLink,
};
