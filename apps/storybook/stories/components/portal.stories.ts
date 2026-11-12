import '@websublime/line-components/portal';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { LinePortal } from '@websublime/line-components/portal';
import { html } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-portal> stories (spec 0013-portal.md, decision D11). The autodocs page reads the default slot, the root part
// and bringToFront() from the shipped Custom Elements Manifest that preview.ts registers. Portal reads no token; the
// story styles read the radii and sizing families imported here and the theme the preview loads. Each story places its box next to its own trigger through a
// story-unique anchor name, and the docs page renders each story in its own fixed-height iframe, so no box paints
// over the docs page or another story.

const DESCRIPTION = `\`<line-portal>\` shows its content in the browser top layer, above \`overflow\` clipping, transformed ancestors and stacking contexts. Nothing moves: the content stays where it is in the DOM.

\`\`\`html
<line-portal class="menu"><ul>…</ul></line-portal>
\`\`\`

- **In place.** The content keeps its theme, direction, language and inherited custom properties. Its events bubble through the host to its ancestors, and a form control in it still submits with its form.
- **Order.** Focus order and reading order follow the markup. Keep the Portal next to its trigger in the markup.
- **Placement.** The box sits at the logical start corner of the viewport, where an unplaced box covers the page and takes its clicks. Place it through \`::part(root):popover-open\`, for example under its trigger with CSS anchor positioning:

\`\`\`css
.trigger {
  anchor-name: --menu;
}
line-portal.menu::part(root):popover-open {
  position-anchor: --menu;
  inset: auto;
  inset-block-start: anchor(end);
  inset-inline-start: anchor(start);
}
\`\`\`

- **In place, without the top layer.** Set \`disabled\` to render the content in the flow of the host's parent.
- **Modal dialogs.** Top-layer boxes stack in the order they were shown, so a modal dialog opened after the Portal paints above it. Call \`bringToFront()\` after every \`showModal()\`, including each reopening. The call is synchronous, and does nothing before the first update, while an update that clears \`disabled\` is pending, while \`disabled\`, or while disconnected. A Portal outside the open modal dialog then paints above its backdrop, but its content stays inert.
- **Nested portals.** \`bringToFront()\` raises only its own box. Raise the outer Portal first, then the inner one; after clearing \`disabled\` on the outer Portal, \`await outer.updateComplete\` before raising the inner one.
- **Naming.** Do not put \`aria-label\` on the host. It has no role a name could attach to.
- **Not verified.** No check reads the Firefox or WebKit accessibility tree, and no screen reader was run on top-layer content.
- **Before the upgrade.** The content shows in place, clipped by its ancestors, until the module runs. To hide it before then, add this rule to the page:

\`\`\`css
line-portal:not(:defined) {
  display: none;
}
\`\`\``;

/** The look of every story's box: the theme surface, a border, padding. Portal itself draws nothing. */
const boxStyle = html`<style>
  line-portal::part(root):popover-open {
    background: var(--line-gray-surface);
    border: 1px solid var(--line-gray-border);
    border-radius: var(--line-radius-2);
    padding: var(--line-size-2);
  }
</style>`;

const meta = {
  title: 'Components/Portal',
  component: 'line-portal',
  tags: ['autodocs'],
  parameters: {
    docs: { extractArgTypes, description: { component: DESCRIPTION }, story: { inline: false, height: '320px' } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const EscapesAClippingCard: Story = {
  name: 'Escapes a clipping card',
  parameters: {
    docs: {
      description: {
        story: 'The menu paints under its Options trigger, outside the card that clips it with `overflow: hidden`.',
      },
    },
  },
  render: () =>
    html`${boxStyle}
      <style>
        .card-trigger {
          anchor-name: --portal-story-card;
        }
        line-portal.card-menu::part(root):popover-open {
          position-anchor: --portal-story-card;
          inset: auto;
          inset-block-start: anchor(end);
          inset-inline-start: anchor(start);
        }
      </style>
      <div class="card" style="overflow: hidden; inline-size: 16rem; block-size: 3rem; padding: var(--line-size-2); border: 1px solid var(--line-gray-border)">
        <button type="button" class="card-trigger">Options</button>
        <line-portal class="card-menu">
          <ul style="margin: 0; padding-inline-start: var(--line-size-5)">
            <li><a href="#rename">Rename</a></li>
            <li><a href="#delete">Delete</a></li>
          </ul>
        </line-portal>
      </div>`,
};

export const KeepsItsForm: Story = {
  name: 'Keeps its form',
  parameters: {
    docs: {
      description: { story: 'The field paints in the top layer and still submits with its form.' },
    },
  },
  render: () =>
    html`${boxStyle}
      <style>
        .form-save {
          anchor-name: --portal-story-form;
        }
        line-portal.form-panel::part(root):popover-open {
          position-anchor: --portal-story-form;
          inset: auto;
          inset-block-start: anchor(end);
          inset-inline-start: anchor(start);
        }
      </style>
      <form method="post" @submit=${(event: Event) => event.preventDefault()}>
        <line-portal class="form-panel"><label>Note <input name="note" /></label></line-portal>
        <button type="submit" class="form-save">Save</button>
      </form>`,
};

export const InAModalDialog: Story = {
  name: 'In a modal dialog',
  parameters: {
    docs: {
      description: {
        story:
          '"Open settings" calls `showModal()` and then `bringToFront()`, so the hint paints above the dialog, beside its Theme label and clear of the Close button.',
      },
    },
  },
  render: () =>
    html`${boxStyle}
      <style>
        .dialog-hint-anchor {
          anchor-name: --portal-story-dialog;
        }
        line-portal.dialog-hint::part(root):popover-open {
          position-anchor: --portal-story-dialog;
          inset: auto;
          inset-block-start: anchor(start);
          inset-inline-start: anchor(end);
          margin-inline-start: var(--line-size-5);
        }
      </style>
      <button
        type="button"
        class="open-settings"
        @click=${(event: Event) => {
          const root = (event.currentTarget as HTMLElement).parentElement as HTMLElement;
          (root.querySelector('dialog.settings') as HTMLDialogElement).showModal();
          (root.querySelector('line-portal.dialog-hint') as LinePortal).bringToFront();
        }}
      >
        Open settings
      </button>
      <dialog class="settings" aria-label="Settings">
        <p class="dialog-hint-anchor">Theme</p>
        <line-portal class="dialog-hint">Changes apply on save.</line-portal>
        <form method="dialog"><button type="submit">Close</button></form>
      </dialog>`,
};

export const Disabled: Story = {
  name: 'Disabled',
  parameters: {
    docs: { description: { story: 'With `disabled`, the words render in place, in the sentence.' } },
  },
  render: () => html`<p>Read <line-portal disabled>the words written here</line-portal> in line.</p>`,
};
