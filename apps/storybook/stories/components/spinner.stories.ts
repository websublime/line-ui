import '@websublime/line-components/spinner';
import '@websublime/line-components/button';
import '@websublime/line-components/icon-button';
import '@websublime/line-components/icon';
import '@websublime/line-components/center';
import '@websublime/line-tokens/easings';
import '@websublime/line-tokens/motion';
import '@websublime/line-tokens/sizing';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { setIconRegistry } from '@websublime/line-components';
import { IconRegistry } from '@websublime/line-icons';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';
import { html } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-spinner> stories (spec 0022-spinner.md, decision D20). The autodocs page reads the attributes, parts and
// custom properties from the shipped Custom Elements Manifest that preview.ts registers. The stories import only the
// token families Spinner reads; the line-tokens barrel carries reset.css, which would restyle the docs page. The
// Lucide files are self-hosted under public/icons/. The visual tier captures each ring unrotated, because
// `toHaveScreenshot` cancels infinite animations to their initial state (D21).

const registry = new IconRegistry();
registry.register('lucide', createLucideResolver({ base: './icons/lucide/' }));
setIconRegistry(registry);

const DESCRIPTION = `\`<line-spinner>\` is a loading indicator, a small ring that turns while something is in progress. It draws in the colour and at the size of the surrounding text, and its motion is CSS only.

\`\`\`html
<section aria-busy="true" aria-label="Orders">
  <line-center><line-spinner size="5" label="Loading orders"></line-spinner></line-center>
</section>
\`\`\`

- **Naming.** Name a standalone spinner with \`label\`, \`aria-label\` or \`aria-labelledby\`, such as "Loading orders"; assistive technology then finds it as a progress bar with that name, and a host \`aria-label\` or \`aria-labelledby\` wins over \`label\`. Without a name the spinner is decorative and hidden. The component ships no default string: "Loading" is yours to write and localise.
- **In a button.** Leave a spinner in the \`loading\` slot of \`<line-button>\` or \`<line-icon-button>\` unnamed, and put the loading text beside it. A named spinner joins the button's name, so "Save" would become "Save Loading".
- **Busy region.** Put \`aria-busy="true"\` on the region that is loading while the spinner shows, and remove it when the content arrives; the spinner writes \`aria-busy\` nowhere. It says nothing when it goes away, so announce the result with a live region or an Alert.
- **Size and speed.** \`size\` takes the steps \`1\`–\`6\` (16, 20, 24, 28, 32 and 48 px at the default root font); without it the spinner takes the text size. \`speed\` is \`slow\` (2 s a turn), \`normal\` (1 s, the default) or \`fast\` (0.75 s). Beside text, a page rule \`line-spinner { vertical-align: middle; }\` centres the ring on the line.
- **Reduced motion.** When the user asks the system for reduced motion, the ring pulses in place for 2 s instead of turning. An app that keeps rotation under reduced motion does it with a page rule, \`line-spinner::part(root) { animation: <page keyframes> … }\`, and then owns that choice; the keyframe names \`line-spinner-spin\` and \`line-spinner-pulse\` are internal, so custom motion always goes through such a rule.
- **Motion longer than five seconds.** WCAG 2.2.2 asks for a way to pause, stop or hide motion that starts automatically, lasts more than five seconds and shows beside other content. A spinner shown after the user presses a button does not start automatically, and a spinner that is the only content is not beside other content. An app that shows a spinner beside usable content for longer removes or hides it within five seconds, gives a way to stop it, or sets a finite count through \`--line-spinner-iteration-count\`.
- **Forced colors.** The ring paints \`CanvasText\` with a \`Canvas\` gap, so it still reads as turning. A page rule that recolours the border through \`::part(root)\` carries its own \`@media (forced-colors: active)\` rule.
- **htmx.** \`<line-spinner class="htmx-indicator">\` with \`hx-indicator\` on the triggering element shows the spinner only while the request runs.
- **Not verified.** No check reads the Firefox or WebKit accessibility tree, and no screen reader was run.`;

const meta = {
  title: 'Components/Primitives Base/Spinner',
  id: 'components-spinner',
  component: 'line-spinner',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'An unnamed, decorative spinner beside the text that says what is happening.' } },
  },
  render: () => html`<p><line-spinner></line-spinner> Saving…</p>`,
};

export const Labelled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A standalone spinner named by `label`; assistive technology finds a progress bar named "Loading orders".',
      },
    },
  },
  render: () => html`<line-spinner label="Loading orders"></line-spinner>`,
};

export const Sizes: Story = {
  parameters: {
    docs: { description: { story: 'The steps `1`–`6`: 16, 20, 24, 28, 32 and 48 px at the default root font.' } },
  },
  render: () =>
    html`<p style="display: flex; align-items: center; gap: var(--line-size-3)">
      <line-spinner size="1"></line-spinner>
      <line-spinner size="2"></line-spinner>
      <line-spinner size="3"></line-spinner>
      <line-spinner size="4"></line-spinner>
      <line-spinner size="5"></line-spinner>
      <line-spinner size="6"></line-spinner>
    </p>`,
};

export const Speeds: Story = {
  parameters: {
    docs: { description: { story: '`slow` (2 s a turn), `normal` (1 s, the default) and `fast` (0.75 s).' } },
  },
  render: () =>
    html`<p style="display: flex; align-items: center; gap: var(--line-size-3)">
      <line-spinner size="5" speed="slow"></line-spinner>
      <line-spinner size="5" speed="normal"></line-spinner>
      <line-spinner size="5" speed="fast"></line-spinner>
    </p>`,
};

export const InAButton: Story = {
  name: 'In a Button',
  parameters: {
    docs: {
      description: {
        story:
          'A loading Button: the spinner stays unnamed and the slot carries the loading text, so the button keeps its name.',
      },
    },
  },
  render: () =>
    html`<line-button loading>
      Save
      <span slot="loading"><line-spinner></line-spinner> Saving…</span>
    </line-button>`,
};

export const InAnIconButton: Story = {
  name: 'In an IconButton',
  parameters: {
    docs: {
      description: { story: 'A loading IconButton, named by its own `aria-label`; the spinner stays unnamed.' },
    },
  },
  render: () =>
    html`<line-icon-button loading aria-label="Refresh">
      <line-icon library="lucide" name="refresh-cw"></line-icon>
      <line-spinner slot="loading"></line-spinner>
    </line-icon-button>`,
};

export const BusyRegion: Story = {
  name: 'Busy region',
  parameters: {
    docs: {
      description: {
        story: 'A loading panel: the region carries `aria-busy="true"` and the centred spinner is named.',
      },
    },
  },
  render: () =>
    html`<section aria-busy="true" aria-label="Orders" style="block-size: 8rem; display: grid">
      <line-center><line-spinner size="5" label="Loading orders"></line-spinner></line-center>
    </section>`,
};

export const CustomTokens: Story = {
  name: 'Custom tokens',
  parameters: {
    docs: {
      description: {
        story:
          'The Consumer styling rules: a brand colour and a thicker ring, a faint track with its own forced-colors rule, reverse motion through page keyframes, rotation kept under reduced motion, and a ring that stops after five turns.',
      },
    },
  },
  render: () =>
    html`<style>
        line-spinner.brand {
          --line-spinner-color: var(--line-accent-solid);
          --line-spinner-width: 0.1875em;
        }
        line-spinner.track::part(root) {
          border-color: color-mix(in srgb, currentColor 20%, transparent);
          border-block-start-color: currentColor;
        }
        @media (forced-colors: active) {
          line-spinner.track::part(root) {
            border-color: CanvasText;
            border-inline-end-color: Canvas;
          }
        }
        @keyframes page-sweep {
          to {
            transform: rotate(-1turn);
          }
        }
        line-spinner.reverse::part(root) {
          animation: page-sweep 1.5s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          line-spinner.keep::part(root) {
            animation: page-sweep 2s linear infinite;
          }
        }
        line-spinner.brief {
          --line-spinner-iteration-count: 5;
        }
      </style>
      <p style="display: flex; align-items: center; gap: var(--line-size-3)">
        <line-spinner class="brand" size="5"></line-spinner>
        <line-spinner class="track" size="5"></line-spinner>
        <line-spinner class="reverse" size="5"></line-spinner>
        <line-spinner class="keep" size="5"></line-spinner>
        <line-spinner class="brief" size="5"></line-spinner>
      </p>`,
};
