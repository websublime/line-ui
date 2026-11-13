import '@websublime/line-components/kbd';
import '@websublime/line-tokens/border-width';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-kbd> stories (spec 0015-kbd.md, decision D14). The autodocs page reads the attributes, slot, parts and custom
// properties from the shipped Custom Elements Manifest that preview.ts registers. The stories import only the token
// families Kbd reads; the line-tokens barrel carries reset.css, which would restyle the docs page. Every story sets
// `platform`, because `auto` follows the machine that renders it and each visual baseline needs one drawing.

const DESCRIPTION = `\`<line-kbd>\` shows a keyboard shortcut drawn for the user's device: \`⌘K\` on Apple devices and \`Ctrl+K\` elsewhere. It only shows the shortcut; the app binds and handles the keys.

\`\`\`html
<button type="button" aria-keyshortcuts="Meta+K">Search <line-kbd keys="mod+k">Ctrl+K</line-kbd></button>
\`\`\`

- **Grammar.** Write the shortcut once in \`keys\`. Join keys pressed together with \`+\`, such as \`mod+shift+p\`, and separate keys pressed one after another with a space, such as \`g i\`. \`mod\` is the main modifier, Command on Apple devices and Control elsewhere. Write the \`+\` key as \`plus\` and the space bar as \`space\`. Other named keys are \`ctrl\`, \`alt\`, \`shift\`, \`meta\`, \`enter\`, \`escape\`, \`backspace\`, \`delete\`, \`tab\`, \`up\`, \`down\`, \`left\`, \`right\`, \`pageup\`, \`pagedown\`, \`home\` and \`end\`; any other name draws its own text, such as \`K\` or \`F5\`.
- **Platform.** \`auto\`, the default, reads the browser. \`platform="apple"\` or \`platform="other"\` forces a drawing, as a docs page that shows both does.
- **Reading.** Glyphs carry hidden words, so assistive technology reads "Command K", and the keys join the name of a control around them, such as "Search Command K". A sequence reads "G then I".
- **\`aria-keyshortcuts\`.** Put it on the control the shortcut triggers, with the binding the app really handles, such as \`Meta+K\` on a Mac and \`Control+K\` elsewhere. Kbd writes nothing on that control.
- **Fallback text.** While \`keys\` yields no key, the host shows its own content as written, for a key the grammar lacks. Write the off-Apple drawing as text inside the host, such as \`Ctrl+K\`, so the page shows it until the module runs.
- **Words.** The words are English by default. Replace them app-wide through \`LineKbd.keyLabels\`, set before the hosts render, and per host through the \`key-labels\` attribute. An id is a word id, such as \`control\` or \`then\`, or a platform-qualified id, such as \`other.control\`. The attribute's platform-qualified id wins, then its bare id, then the static's platform-qualified id, then its bare id, then the English default.

\`\`\`js
import { LineKbd } from '@websublime/line-components/kbd';

LineKbd.keyLabels = { 'other.control': 'Strg', 'other.shift': 'Umschalt', then: 'dann' };
\`\`\`

- **Naming.** Do not put \`aria-label\` on the host. It has no role a name could attach to.
- **Not verified.** No check reads the Firefox or WebKit accessibility tree, and no screen reader was run.`;

const meta = {
  title: 'Components/Primitives Base/Kbd',
  id: 'components-kbd',
  component: 'line-kbd',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** A command palette trigger with the shortcut it opens on, and the binding on the button. */
const palette = (platform: 'apple' | 'other', binding: string) =>
  html`<button type="button" aria-keyshortcuts=${binding}>
    Search <line-kbd keys="mod+k" platform=${platform}>Ctrl+K</line-kbd>
  </button>`;

export const CommandPaletteApple: Story = {
  name: 'Command palette, Apple',
  parameters: {
    docs: {
      description: {
        story: 'Draws `⌘K`; the button is named "Search Command K" and carries `aria-keyshortcuts="Meta+K"`.',
      },
    },
  },
  render: () => palette('apple', 'Meta+K'),
};

export const CommandPaletteOther: Story = {
  name: 'Command palette, Other',
  parameters: {
    docs: {
      description: {
        story: 'Draws `Ctrl+K`; the button is named "Search Ctrl K" and carries `aria-keyshortcuts="Control+K"`.',
      },
    },
  },
  render: () => palette('other', 'Control+K'),
};

export const ThreeKeysApple: Story = {
  name: 'Three keys, Apple',
  parameters: {
    docs: { description: { story: '`mod+shift+p` draws `⇧⌘P`, with the modifiers in Apple order.' } },
  },
  render: () => html`<line-kbd keys="mod+shift+p" platform="apple"></line-kbd>`,
};

export const ThreeKeysOther: Story = {
  name: 'Three keys, Other',
  parameters: {
    docs: { description: { story: '`mod+shift+p` draws `Ctrl+Shift+P`, in the author order.' } },
  },
  render: () => html`<line-kbd keys="mod+shift+p" platform="other"></line-kbd>`,
};

export const Sequence: Story = {
  parameters: {
    docs: { description: { story: '`g i` draws two steps with a gap, read as "G then I".' } },
  },
  render: () => html`<p>Go to issues: <line-kbd keys="g i" platform="other"></line-kbd></p>`,
};

export const NamedKeys: Story = {
  name: 'Named keys',
  parameters: {
    docs: {
      description: { story: '`escape`, `enter`, `backspace` and `up`, drawn on each platform.' },
    },
  },
  render: () =>
    html`<p>
        Apple: <line-kbd keys="escape" platform="apple"></line-kbd> <line-kbd keys="enter" platform="apple"></line-kbd>
        <line-kbd keys="backspace" platform="apple"></line-kbd> <line-kbd keys="up" platform="apple"></line-kbd>
      </p>
      <p>
        Other: <line-kbd keys="escape" platform="other"></line-kbd> <line-kbd keys="enter" platform="other"></line-kbd>
        <line-kbd keys="backspace" platform="other"></line-kbd> <line-kbd keys="up" platform="other"></line-kbd>
      </p>`,
};

export const InAMenuItem: Story = {
  name: 'In a menu item',
  parameters: {
    docs: {
      description: {
        story: 'The menu item carries `aria-keyshortcuts="Meta+C"` and is named "Copy Command C".',
      },
    },
  },
  render: () =>
    html`<div role="menu" aria-label="Edit">
      <div role="menuitem" tabindex="0" aria-keyshortcuts="Meta+C">
        Copy <line-kbd keys="mod+c" platform="apple"></line-kbd>
      </div>
    </div>`,
};

export const FallbackText: Story = {
  name: 'Fallback text',
  parameters: {
    docs: {
      description: { story: 'With no `keys`, the host shows its own content as written, for a key the grammar lacks.' },
    },
  },
  render: () => html`<line-kbd platform="other">Fn</line-kbd>`,
};

export const CustomTokens: Story = {
  name: 'Custom tokens',
  parameters: {
    docs: {
      description: {
        story: 'The Consumer styling rules: keys as one pill through `::part()`, and larger keys through the tokens.',
      },
    },
  },
  render: () =>
    html`<style>
        line-kbd.compact::part(item) {
          border: 0;
          background: none;
          min-inline-size: 0;
          padding-inline: 0;
        }
        line-kbd.compact::part(root) {
          gap: 0;
          padding-inline: var(--line-size-1);
          border: 1px solid var(--line-gray-border);
          border-radius: var(--line-radius-2);
        }
        line-kbd.large {
          --line-kbd-font-size: var(--line-font-size-1);
          --line-kbd-min-size: var(--line-size-6);
        }
      </style>
      <p>Compact: <line-kbd class="compact" keys="mod+shift+p" platform="apple"></line-kbd></p>
      <p>Large: <line-kbd class="large" keys="mod+shift+p" platform="other"></line-kbd></p>`,
};

export const LocalisedWords: Story = {
  name: 'Localised words',
  parameters: {
    docs: {
      description: {
        story: '`key-labels` with German words: `Strg+Umschalt+P` off Apple, and "Befehl" as the hidden word on Apple.',
      },
    },
  },
  render: () =>
    html`<p>
        <line-kbd
          keys="mod+shift+p"
          platform="other"
          key-labels='{"other.control": "Strg", "other.shift": "Umschalt", "apple.meta": "Befehl"}'
        ></line-kbd>
      </p>
      <p>
        <line-kbd
          keys="mod+shift+p"
          platform="apple"
          key-labels='{"other.control": "Strg", "other.shift": "Umschalt", "apple.meta": "Befehl"}'
        ></line-kbd>
      </p>`,
};
