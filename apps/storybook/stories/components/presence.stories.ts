import '@websublime/line-components/presence';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { LinePresence } from '@websublime/line-components/presence';
import { html } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-presence> stories (spec 0017-presence.md, decision D15). The autodocs page reads the attributes, events and
// part from the shipped Custom Elements Manifest that preview.ts registers. Presence ships no animation, so each story
// carries its own page keyframes, gated under `prefers-reduced-motion: no-preference` (F6 (a)), and a toggle button.
// The A11y and Visual tiers read each story after its animations settle.

const DESCRIPTION = `\`<line-presence>\` shows and hides its content with enter and exit animations that the page's own CSS defines. Setting \`present\` shows the content at once and lets an enter animation play. Clearing it keeps the content on screen while the exit animation plays, then hides it. Hidden content stays in the document with its state, but it leaves the screen, the Tab order and the accessibility tree. Presence adds no role and no meaning, and ships no animation: without the page's CSS it shows and hides in one frame.

\`\`\`html
<button type="button" aria-expanded="false" aria-controls="shipping">Shipping details</button>
<line-presence class="panel">
  <div id="shipping">Ships in two working days.</div>
</line-presence>
\`\`\`

\`\`\`css
@keyframes panel-in { from { opacity: 0; translate: 0 -0.5rem; } }
@keyframes panel-out { to { opacity: 0; translate: 0 -0.5rem; } }

@media (prefers-reduced-motion: no-preference) {
  line-presence.panel[data-open]::part(root) { animation: panel-in 150ms ease-out; }
  line-presence.panel:not([data-open])::part(root) { animation: panel-out 120ms ease-in; }
}
\`\`\`

- **Animate \`::part(root)\`.** Key the rules on the host state, \`[data-open]\` or \`:state(open)\`, and their negation for the exit; \`::part(root)\` takes no attribute selector after it. Use CSS animations, not transitions: the machine waits only for an animation, so \`animation: none\`, a \`0s\` duration, \`display: none\` or a transition end the exit in one frame.
- **Distinct keyframes.** Give the enter and the exit different keyframe names. The same keyframes played in reverse end every exit after the first reopen at once.
- **Reduced motion.** Presence changes nothing under \`prefers-reduced-motion: reduce\`. Gate your keyframes under \`prefers-reduced-motion: no-preference\`, as above, and the content shows and hides at once for users who ask for less motion.
- **Open at load.** \`skip-animation-on-mount\` blocks the enter animation at the first render and after the host is reinserted, until \`present\` first changes.
- **Events.** \`line-exit-complete\` fires when an exit ends and the content is hidden, \`line-enter-complete\` when an enter after the first render ends. Both bubble and are not composed; a nested presence's events reach its outer one, so check \`event.target\`. Removing the host cuts the exit and fires nothing.
- **Interrupted animations.** A close during an enter animation can skip the exit in Chromium and Firefox ([chakra-ui/zag#3656](https://github.com/chakra-ui/zag/issues/3656)), and fast toggling in Firefox can fire several \`line-exit-complete\` events, the last while the presence is open again. A handler checks \`present\` before it acts.
- **Focus.** Content that holds focus keeps it while it exits, and focus goes to \`body\` when the exit ends. Move focus first, usually back to the trigger.
- **Forms.** Hidden form controls still submit, as any \`display: none\` control does; disable them as well.
- **Semantics.** Presence has no role. The trigger carries \`aria-expanded\` and \`aria-controls\` itself; use a native \`<button type="button">\`, because \`<line-button>\` does not forward \`aria-expanded\`. Do not put \`aria-label\` on the host.
- **Before the module runs.** Closed content shows until the module runs. Hide it with a page rule:

\`\`\`css
line-presence:not(:defined):not([present]) {
  display: none;
}
\`\`\`

- **Not verified.** No check reads the Firefox or WebKit accessibility tree, and no screen reader was run.`;

const meta = {
  title: 'Components/Primitives Base/Presence',
  id: 'components-presence',
  component: 'line-presence',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** Flips `present` on the presence after the button, and keeps a disclosure button's `aria-expanded` in step. */
function toggle(event: Event): void {
  const button = event.currentTarget as HTMLButtonElement;
  const presence = button.nextElementSibling as LinePresence;
  presence.present = !presence.present;
  if (button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', String(presence.present));
}

const FADE = html`<style>
  @keyframes story-fade-in {
    from {
      opacity: 0;
    }
  }
  @keyframes story-fade-out {
    to {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    line-presence.fade[data-open]::part(root) {
      animation: story-fade-in 200ms ease-out;
    }
    line-presence.fade:not([data-open])::part(root) {
      animation: story-fade-out 200ms ease-in;
    }
  }
</style>`;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'A fade in and out; the button toggles `present`.' } },
  },
  render: () =>
    html`${FADE}<button type="button" @click=${toggle}>Toggle</button>
      <line-presence class="fade" present><p>Fades in and out.</p></line-presence>`,
};

export const Slide: Story = {
  parameters: {
    docs: {
      description: { story: 'A slide from above with a fade, keyed on `:state(open)` instead of `[data-open]`.' },
    },
  },
  render: () =>
    html`<style>
        @keyframes story-slide-in {
          from {
            opacity: 0;
            translate: 0 -0.5rem;
          }
        }
        @keyframes story-slide-out {
          to {
            opacity: 0;
            translate: 0 -0.5rem;
          }
        }
        @media (prefers-reduced-motion: no-preference) {
          line-presence.slide:state(open)::part(root) {
            animation: story-slide-in 150ms ease-out;
          }
          line-presence.slide:not(:state(open))::part(root) {
            animation: story-slide-out 120ms ease-in;
          }
        }
      </style>
      <button type="button" @click=${toggle}>Toggle</button>
      <line-presence class="slide" present><p>Slides in from above.</p></line-presence>`,
};

export const SkipAnimationOnMount: Story = {
  name: 'Skip animation on mount',
  parameters: {
    docs: {
      description: {
        story:
          'Open at load with `skip-animation-on-mount`: no enter animation at the first render; the first close and every later change animate.',
      },
    },
  },
  render: () =>
    html`${FADE}<button type="button" @click=${toggle}>Toggle</button>
      <line-presence class="fade" present skip-animation-on-mount><p>Welcome back.</p></line-presence>`,
};

export const ExitComplete: Story = {
  name: 'Exit complete',
  parameters: {
    docs: {
      description: {
        story:
          'The log lists `line-exit-complete` and `line-enter-complete` as each animation ends; a handler checks `present` before it acts.',
      },
    },
  },
  render: () => {
    const log = (event: Event) => {
      const presence = event.currentTarget as LinePresence;
      const list = presence.nextElementSibling as HTMLOListElement;
      const entry = document.createElement('li');
      entry.textContent = `${event.type} (present: ${presence.present})`;
      list.append(entry);
    };
    return html`${FADE}<button type="button" @click=${toggle}>Toggle</button>
      <line-presence class="fade" present @line-exit-complete=${log} @line-enter-complete=${log}>
        <p>Toggle to log the events.</p>
      </line-presence>
      <ol aria-label="Event log"></ol>`;
  },
};

export const Disclosure: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A disclosure the app builds: a native `<button type="button">` keeps `aria-expanded` and `aria-controls` in step, and Presence animates the panel.',
      },
    },
  },
  render: () =>
    html`${FADE}<button type="button" aria-expanded="true" aria-controls="story-shipping" @click=${toggle}>
        Shipping details
      </button>
      <line-presence class="fade" present>
        <div id="story-shipping">Ships in two working days.</div>
      </line-presence>`,
};
