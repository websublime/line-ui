import '@websublime/line-components/aspect-ratio';
import '@websublime/line-components/center';
import '@websublime/line-components/grid';
import '@websublime/line-components/icon';
import '@websublime/line-components/stack';
import '@websublime/line-tokens/aspects';
import '@websublime/line-tokens/layouts';
import '@websublime/line-tokens/sizing';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { setIconRegistry } from '@websublime/line-components';
import type { AspectRatioPreset } from '@websublime/line-components/aspect-ratio';
import { IconRegistry } from '@websublime/line-icons';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-aspect-ratio> stories (spec 0021-aspect-ratio.md, default D15). The autodocs page reads the attribute, slot
// and custom property from the shipped Custom Elements Manifest that preview.ts registers. The stories import the
// `aspects` tokens the box reads and the `sizing` and `layouts` tokens of the Stack and Grid stories, because the
// preview loads only line-colors and line-themes. The Icon tile's glyph is self-hosted under public/icons/, so the
// stories make no third-party request, and the media are inline SVG data URLs. The dashed outlines are story markup,
// so the box is visible; Aspect Ratio itself draws nothing.

const registry = new IconRegistry();
registry.register('lucide', createLucideResolver({ base: './icons/lucide/' }));
setIconRegistry(registry);

const DESCRIPTION = `\`<line-aspect-ratio>\` holds its content at a fixed width-to-height ratio. The box takes its width from its container and its height from the ratio. \`ratio\` picks one of the six named ratios of the \`line-tokens\` \`aspects\` family: \`square\` (1:1, the default), \`landscape\` (4:3), \`portrait\` (3:4), \`widescreen\` (16:9), \`ultrawide\` (18:5) or \`golden\` (1.618:1). Any other ratio goes through its token, \`--line-aspect-ratio-ratio\`.

\`\`\`html
<line-aspect-ratio ratio="widescreen">
  <iframe src="https://player.example/v/42" title="Product tour" frameborder="0" allowfullscreen></iframe>
</line-aspect-ratio>

<style>
  line-aspect-ratio.cinema { --line-aspect-ratio-ratio: 21 / 9; }
</style>
\`\`\`

- **Children.** Every child shares the one cell and fills the box unless it sets its own size; a child with a smaller size sits at the start corner. Images and videos are cropped with \`object-fit: cover\`; an \`object-fit\` on the child wins.
- **Text.** A bare text node beside an element takes its own row below the cell. Wrap text in an element.
- **Long content.** The box keeps its ratio and never clips, so content taller than the box spills past its bottom edge over what follows. Set \`overflow: hidden\` on the box to clip it, and keep focus rings inside with an inset \`outline-offset\`.
- **In a flex row.** In a flex row, such as a horizontal \`<line-stack>\`, the box is as wide as its content and as tall as the row, so the ratio breaks. Give it a width or \`flex: 1\`, and set \`align="start"\` on the Stack.
- **In a Grid.** In a \`<line-grid>\` at its default \`align\`, a taller item in the same row stretches the box past its ratio, and \`justify-items\` other than \`stretch\` can widen it past its column. Keep \`justify-items\` at \`stretch\` and set \`align="start"\` on the Grid.
- **Display.** A \`display\` rule on \`line-aspect-ratio\` shows a hidden box. Exclude \`[hidden]\`: \`line-aspect-ratio:not([hidden]) { display: inline-grid; inline-size: 10rem; }\`.
- **Names.** Without a role, Aspect Ratio is a \`generic\` element: do not give it an \`aria-label\`, which names nothing a user can reach. Name the media instead (\`alt\`, \`title\`, \`aria-label\`). For a picture built from several elements, put \`role="img"\` and an \`aria-label\` on the box and \`alt=""\` on any decorative image inside; for a gallery item, use \`role="group"\`.
- **Not verified.** No check reads the Firefox or WebKit accessibility tree, and no screen reader was run.`;

interface AspectRatioArgs {
  ratio: AspectRatioPreset | undefined;
}

/** A landscape SVG picture as a data URL, so cropping shows. */
const PICTURE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" fill="#1f6f78"/><circle cx="240" cy="60" r="28" fill="#f2c94c"/><path d="M0 200 L110 70 L190 160 L240 110 L320 200 Z" fill="#0b3c49"/></svg>',
)}`;

const FRAME = 'outline: 1px dashed currentColor;';
const LABEL = 'margin: 0; padding: 4px 8px;';

const meta = {
  title: 'Components/Primitives Base/Aspect Ratio',
  id: 'components-aspect-ratio',
  component: 'line-aspect-ratio',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { ratio: undefined },
  argTypes: {
    ratio: {
      control: 'select',
      options: [undefined, 'square', 'landscape', 'portrait', 'widescreen', 'ultrawide', 'golden'],
    },
  },
  render: ({ ratio }) =>
    html`<line-aspect-ratio ratio=${ifDefined(ratio)} style="inline-size: 16rem; ${FRAME}">
      <img src=${PICTURE} alt="Mountains under a yellow sun" />
    </line-aspect-ratio>`,
} satisfies Meta<AspectRatioArgs>;

export default meta;

type Story = StoryObj<AspectRatioArgs>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'No `ratio`: a square box, 16rem wide, with an image cropped to it.' } },
  },
  render: () =>
    html`<line-aspect-ratio style="inline-size: 16rem; ${FRAME}">
      <img src=${PICTURE} alt="Mountains under a yellow sun" />
    </line-aspect-ratio>`,
};

export const Ratios: Story = {
  parameters: {
    docs: {
      description: { story: 'The six named ratios in a Grid with `align="start"`, each labelled with its name.' },
    },
  },
  render: () =>
    html`<line-grid columns="3" align="start" gap="3" style="max-inline-size: 40rem">
      ${(['square', 'landscape', 'portrait', 'widescreen', 'ultrawide', 'golden'] as const).map(
        (ratio) =>
          html`<line-aspect-ratio ratio=${ratio} style=${FRAME}><p style=${LABEL}>${ratio}</p></line-aspect-ratio>`,
      )}
    </line-grid>`,
};

export const Media: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'An image, a `<video>` and an `<iframe>` in widescreen boxes. Each fills the box; the image and the video are cropped with `object-fit: cover`. Each medium carries its own name.',
      },
    },
  },
  render: () =>
    html`<line-stack gap="3" style="max-inline-size: 20rem">
      <line-aspect-ratio ratio="widescreen" style=${FRAME}>
        <img src=${PICTURE} alt="Mountains under a yellow sun" />
      </line-aspect-ratio>
      <line-aspect-ratio ratio="widescreen" style=${FRAME}>
        <video controls aria-label="Intro"></video>
      </line-aspect-ratio>
      <line-aspect-ratio ratio="widescreen" style=${FRAME}>
        <iframe title="Product tour" frameborder="0" srcdoc="<p>Product tour</p>"></iframe>
      </line-aspect-ratio>
    </line-stack>`,
};

export const CustomRatio: Story = {
  name: 'Custom ratio',
  parameters: {
    docs: {
      description: {
        story:
          'Any other ratio through the token: `--line-aspect-ratio-ratio: 21 / 9` from a class, and `9 / 16` inline.',
      },
    },
  },
  render: () =>
    html`<style>
        line-aspect-ratio.cinema {
          --line-aspect-ratio-ratio: 21 / 9;
        }
      </style>
      <line-stack orientation="horizontal" align="start" gap="3">
        <line-aspect-ratio class="cinema" style="inline-size: 21rem; ${FRAME}"><p style=${LABEL}>21 / 9</p></line-aspect-ratio>
        <line-aspect-ratio style="--line-aspect-ratio-ratio: 9 / 16; inline-size: 6rem; ${FRAME}"
          ><p style=${LABEL}>9 / 16</p></line-aspect-ratio
        >
      </line-stack>`,
};

export const CaptionOverlay: Story = {
  name: 'Caption overlay',
  parameters: {
    docs: {
      description: {
        story:
          'A caption with `align-self: end` shares the cell with the image and sits on its bottom edge. Wrap the caption in an element: a bare text node takes its own row below the cell.',
      },
    },
  },
  render: () =>
    html`<line-aspect-ratio ratio="landscape" style="inline-size: 20rem; ${FRAME}">
      <img src=${PICTURE} alt="Mountains under a yellow sun" />
      <p style="${LABEL} align-self: end; background: Canvas; color: CanvasText">Lisbon, 2026</p>
    </line-aspect-ratio>`,
};

export const IconTile: Story = {
  name: 'Icon tile',
  parameters: {
    docs: {
      description: {
        story: 'A 4rem square tile with a Center holding an icon; the icon carries the name through its `aria-label`.',
      },
    },
  },
  render: () =>
    html`<line-aspect-ratio style="inline-size: 4rem; ${FRAME}">
      <line-center><line-icon library="lucide" name="star" aria-label="Featured"></line-icon></line-center>
    </line-aspect-ratio>`,
};

export const InAGrid: Story = {
  name: 'In a Grid',
  parameters: {
    docs: {
      description: {
        story:
          'Widescreen boxes in a three-column `<line-grid>` beside a taller item. `align="start"` keeps each box at its ratio, and `justify-items` stays at `stretch`.',
      },
    },
  },
  render: () =>
    html`<line-grid columns="3" align="start" gap="3" style="max-inline-size: 40rem">
      <line-aspect-ratio ratio="widescreen" style=${FRAME}>
        <img src=${PICTURE} alt="Mountains under a yellow sun" />
      </line-aspect-ratio>
      <div style="${FRAME} block-size: 12rem"><p style=${LABEL}>A taller item</p></div>
      <line-aspect-ratio ratio="widescreen" style=${FRAME}><p style=${LABEL}>widescreen</p></line-aspect-ratio>
    </line-grid>`,
};

export const InAHorizontalStack: Story = {
  name: 'In a horizontal Stack',
  parameters: {
    docs: {
      description: {
        story:
          'A widescreen box beside a taller item in a horizontal `<line-stack>`: `align="start"` on the Stack and `flex: 1` on the box keep the ratio while the box takes the rest of the row.',
      },
    },
  },
  render: () =>
    html`<line-stack orientation="horizontal" align="start" gap="3" style="max-inline-size: 40rem">
      <div style="${FRAME} flex: none; inline-size: 8rem; block-size: 20rem"><p style=${LABEL}>A taller item</p></div>
      <line-aspect-ratio ratio="widescreen" style="flex: 1; ${FRAME}">
        <img src=${PICTURE} alt="Mountains under a yellow sun" />
      </line-aspect-ratio>
    </line-stack>`,
};

export const LongContent: Story = {
  name: 'Long content',
  parameters: {
    docs: {
      description: {
        story:
          'A paragraph taller than its ultrawide box spills past the bottom edge: the box keeps its ratio and clips nothing. Leave room after the box, or set `overflow: hidden` on it.',
      },
    },
  },
  render: () =>
    html`<div style="inline-size: 14rem; padding-block-end: 12rem">
      <line-aspect-ratio ratio="ultrawide" style=${FRAME}>
        <p style=${LABEL}>
          The box keeps its ratio whatever its content. This paragraph is much longer than the box is tall, so its
          lines run past the bottom edge, where they stay readable instead of being cut off. The box itself stays at
          its ultrawide ratio, and the text after it would sit under these lines, so leave room after the box or
          clip it with overflow: hidden.
        </p>
      </line-aspect-ratio>
    </div>`,
};

export const AuthorImageRole: Story = {
  name: 'Author image role',
  parameters: {
    docs: {
      description: {
        story:
          'A picture built from several elements: `role="img"` and an `aria-label` on the box name it as one image, and the decorative image inside takes `alt=""`.',
      },
    },
  },
  render: () =>
    html`<line-aspect-ratio ratio="golden" role="img" aria-label="Mountains at sunset, 2026" style="inline-size: 20rem; ${FRAME}">
      <img src=${PICTURE} alt="" />
      <p style="${LABEL} align-self: end; background: Canvas; color: CanvasText">2026</p>
    </line-aspect-ratio>`,
};
