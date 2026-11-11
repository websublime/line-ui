import '@websublime/line-components/avatar';
import '@websublime/line-components/badge';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, type TemplateResult } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-avatar> stories (spec 0009-avatar.md, decision D12). The autodocs page reads the attributes, slots, parts and
// custom properties from the shipped Custom Elements Manifest that preview.ts registers. The pictures are local files
// under public/avatars/, so no story makes a third-party request. The stories import only the token families Avatar
// and the slotted badge use; the line-tokens barrel carries reset.css, which would restyle the docs page.

const DESCRIPTION = `\`<line-avatar>\` is a small picture that stands for a person or an organisation: a photo, a logo, or the initials of a name. It takes no focus and fires no event.

\`\`\`html
<line-avatar src="/people/ana.jpg" name="Ana Silva"></line-avatar>
<line-avatar name="Ana Silva"></line-avatar>
\`\`\`

- **Image and fallback.** \`src\` draws the picture once it has loaded. While it loads, when it fails and when there is none, the fallback shows: the \`fallback\` slot, or the initials of \`name\`, the first character of the first and the last word, uppercased for the nearest \`lang\`. \`data-loading\` and \`data-error\`, with \`:state(loading)\` and \`:state(error)\`, follow the picture.
- **Custom media.** For \`srcset\`, \`<picture>\`, lazy loading or an inline SVG logo, put that element in the default slot. It replaces the \`src\` picture, and the avatar does not track whether it loads. Give it \`alt=""\`, because the avatar's name covers it.
- **Name.** The avatar is one image named by the host \`aria-label\`, or else by \`name\`. Leave \`name\` empty only when the same name is written next to the avatar; an avatar with no name is decorative and silent. \`aria-labelledby\` on the host is not supported.
- **Status.** The \`status\` slot places one presence marker, such as a \`<line-badge>\` dot, over the inline-end, block-end corner. Name the marker, such as \`aria-label="Online"\`; it is read after the avatar's name, so a link around it reads "Ana Silva Online". State presence in words or a name, never colour alone.
- **Tokens.** Every \`--line-avatar-*\` token is read with its default as a fallback and none is declared on the host, so a container sets size, ring and status visibility by inheritance, as \`<line-avatar-group>\` will.
- Use a native \`<img>\` for a content picture, and Icon for a symbol.`;

interface AvatarArgs {
  src: string;
  name: string;
}

const meta = {
  title: 'Components/Avatar',
  component: 'line-avatar',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { src: 'avatars/ana.svg', name: 'Ana Silva' },
  argTypes: {
    src: { control: 'text', description: 'The image URL; blank means no image' },
    name: { control: 'text', description: 'The accessible name and the source of the initials' },
  },
  render: ({ src, name }) => html`<line-avatar src=${src} name=${name}></line-avatar>`,
} satisfies Meta<AvatarArgs>;

export default meta;

type Story = StoryObj<AvatarArgs>;

const story = (text: string, render: () => TemplateResult): Story => ({
  parameters: { docs: { description: { story: text } } },
  render,
});

export const Photo: Story = {};

export const Initials: Story = story(
  'With no `src`, the avatar shows the initials of `name`, here "AS", and is still an image named "Ana Silva".',
  () => html`<line-avatar name="Ana Silva"></line-avatar>`,
);

export const ErrorFallback: Story = {
  name: 'Error fallback',
  ...story(
    'A `src` that fails sets `data-error` and keeps the initials; no broken-image icon draws.',
    () => html`<line-avatar src="avatars/missing.png" name="Rui Costa"></line-avatar>`,
  ),
};

export const DecorativeBesideAName: Story = {
  name: 'Decorative beside a name',
  ...story(
    'The name is written next to the avatar, so the avatar has no `name` and stays silent.',
    () => html`<span style="display: inline-flex; align-items: center; gap: 0.5rem">
      <line-avatar src="avatars/mia.svg"></line-avatar>
      <span>Mia Santos</span>
    </span>`,
  ),
};

export const FallbackSlot: Story = {
  name: 'Fallback slot',
  ...story(
    'Content in the `fallback` slot replaces the computed initials, here a person glyph.',
    () => html`<line-avatar name="Guest">
      <svg slot="fallback" viewBox="0 0 24 24" width="60%" height="60%" aria-hidden="true">
        <circle cx="12" cy="8" r="4" fill="currentColor"></circle>
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill="currentColor"></path>
      </svg>
    </line-avatar>`,
  ),
};

export const CustomMedia: Story = {
  name: 'Custom media',
  ...story(
    'A `<picture>` with a lazy image, and an inline SVG logo, replace the `src` picture through the default slot.',
    () => html`<span style="display: inline-flex; gap: 0.5rem">
      <line-avatar name="Rui Costa">
        <picture
          ><img alt="" loading="lazy" src="avatars/rui.svg" style="display: block; inline-size: 100%; block-size: 100%"
        /></picture>
      </line-avatar>
      <line-avatar name="WS Labs">
        <svg viewBox="0 0 96 96" aria-hidden="true">
          <rect width="96" height="96" fill="#111"></rect>
          <path
            d="M34 12c6 0 9 14 9 30h10c0-16 3-30 9-30s6 22-2 36c6 6 9 13 9 20 0 13-10 20-21 20S27 81 27 68c0-7 3-14 9-20-8-14-8-36-2-36z"
            fill="#fff"
          ></path>
        </svg>
      </line-avatar>
    </span>`,
  ),
};

export const Status: Story = story(
  'A named `<line-badge>` dot in the `status` slot marks presence; it is read after the name, "WS Labs Online".',
  () => html`<line-avatar src="avatars/logo.svg" name="WS Labs">
    <line-badge slot="status" variant="success" aria-label="Online"></line-badge>
  </line-avatar>`,
);

export const InALink: Story = {
  name: 'In a link',
  ...story(
    'The avatar is the only content of a link, which takes its name and the status name, "Ana Silva Online".',
    () => html`<a href="#profile">
      <line-avatar src="avatars/ana.svg" name="Ana Silva">
        <line-badge slot="status" variant="success" aria-label="Online"></line-badge>
      </line-avatar>
    </a>`,
  ),
};

export const SpokenNameOverride: Story = {
  name: 'Spoken name override',
  ...story(
    'A host `aria-label` names the avatar in place of `name`; the initials still come from `name`.',
    () => html`<line-avatar name="Ana Silva" aria-label="Ana Silva, team lead"></line-avatar>`,
  ),
};

export const CustomTokens: Story = {
  name: 'Custom tokens',
  ...story(
    'Tokens and parts restyle the frame, the fallback and the picture.',
    () => html`<style>
        .square {
          --line-avatar-size: var(--line-size-9);
          --line-avatar-radius: var(--line-radius-2);
        }
        .square::part(image) {
          filter: grayscale(1);
        }
        .square[data-error]::part(fallback),
        .square:not([src])::part(fallback) {
          font-weight: var(--line-font-weight-7);
        }
      </style>
      <span style="display: inline-flex; gap: 0.5rem">
        <line-avatar class="square" src="avatars/mia.svg" name="Mia Santos"></line-avatar>
        <line-avatar class="square" name="Mia Santos"></line-avatar>
      </span>`,
  ),
};

export const RingAndSizeFromAContainer: Story = {
  name: 'Ring and size from a container',
  ...story(
    'A container sets `--line-avatar-size`, `--line-avatar-ring-width` and `--line-avatar-status-visibility`, and every avatar inherits them, the one inside a link included, as `<line-avatar-group>` will (spec 0009-avatar.md, contract G1–G4).',
    () => html`<style>
        .stack {
          display: inline-flex;
          --line-avatar-size: var(--line-size-8);
          --line-avatar-ring-width: 2px;
          --line-avatar-status-visibility: hidden;
        }
        .stack > * + * {
          margin-inline-start: calc(var(--line-size-3) * -1);
        }
      </style>
      <span class="stack">
        <line-avatar src="avatars/ana.svg" name="Ana Silva"></line-avatar>
        <a href="#rui"><line-avatar src="avatars/rui.svg" name="Rui Costa"></line-avatar></a>
        <line-avatar src="avatars/logo.svg" name="WS Labs">
          <line-badge slot="status" variant="success" aria-label="Online"></line-badge>
        </line-avatar>
        <line-avatar name="Mia Santos"></line-avatar>
      </span>`,
  ),
};
