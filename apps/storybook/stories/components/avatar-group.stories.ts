import '@websublime/line-components/avatar-group';
import '@websublime/line-components/avatar';
import '@websublime/line-components/badge';
import '@websublime/line-tokens/border-width';
import '@websublime/line-tokens/focus-ring';
import '@websublime/line-tokens/motion';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/shadows';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing, type TemplateResult } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-avatar-group> stories (spec 0010-avatar-group.md, decision D18). The autodocs page reads the attributes, slot,
// parts and custom properties from the shipped Custom Elements Manifest that preview.ts registers. The pictures are
// local files under public/avatars/, so no story makes a third-party request. The stories import only the token
// families the group, the avatars and the slotted badge use; the line-tokens barrel carries reset.css, which would
// restyle the docs page. The Expanded and Open stories render collapsed; the axe and visual tiers hover the group or
// click "+N" to reach their state (D26).

const DESCRIPTION = `\`<line-avatar-group>\` shows a row of overlapping avatars, such as the members of a project, and ends it with a "+N" button when there are more than \`max\`.

\`\`\`html
<line-avatar-group aria-label="Project members" max="3">
  <line-avatar src="/people/ana.jpg" name="Ana Silva"></line-avatar>
  <line-avatar src="/people/rui.jpg" name="Rui Costa"></line-avatar>
  <line-avatar name="Marta Sousa"></line-avatar>
  <line-avatar src="/people/joao.jpg" name="João Lima"></line-avatar>
  <line-avatar name="Inês Rocha"></line-avatar>
</line-avatar-group>
\`\`\`

- **Its avatars.** Every element child without \`hidden\` counts as one avatar: a \`<line-avatar>\`, or a link around one. The first \`max\` show in the stack and the rest move into a panel; without \`max\` every avatar shows. The group never writes on its children: it places each one by manual slot assignment, so a child's \`slot\` attribute has no effect, and it never imports Avatar.
- **"+N" and the panel.** "+N" is a native \`<button>\` that opens a native \`popover\` panel under it with the rest of the avatars. Enter, Space or a click opens it; Escape, a click outside or a second press closes it, and after Escape focus is back on "+N". \`data-open\` and \`:state(open)\` follow the panel.
- **Name it.** The \`group\` role sits on the host, so the host \`aria-label\`, or \`aria-labelledby\` pointing at a visible heading, names it. An unnamed group passes axe, so nothing reports it: name every group. "+N" is named by its visible text, or by \`overflow-label\`, a template such as \`"+{count} more members"\`; every \`{count}\` becomes the number, and a label without \`{count}\` follows the "+N". There are no plural rules, so \`"+{count} more members"\` reads "+1 more members".
- **Spreading.** While a mouse or pen pointer rests on the group, or keyboard focus is within it, the avatars spread apart so each face shows whole, and \`data-expanded\` with \`:state(expanded)\` is set. They spread toward inline-start, so "+N" stays under the pointer. Escape stacks them again until the pointer and focus have both left. A touch tap never spreads them by itself; the stack is spread while the panel is open.
- **Leave room before it.** The spread avatars overlap the content before the group by up to (avatars in the stack) × (overlap + gap), 36px with the defaults and \`max="3"\`, and an ancestor with \`overflow: hidden\` clips them. Leave that space at the group's inline-start, or cap the stack with \`max\`.
- **Size and spacing.** \`size\` from \`1\` to \`5\` sets the avatars and "+N" to \`--line-size-5\`…\`-9\`; \`spacing\` from \`0\` to \`3\` sets the overlap to \`0px\`, \`--line-size-1\`, \`-2\` or \`-3\`. The group sets \`--line-avatar-size\` and a 2px \`--line-avatar-ring-width\` on its host, and the avatars inherit them through any wrapper. Write a zero overlap or gap token as \`0px\`.
- **Panel position.** The panel opens under "+N", at its inline-start; it mirrors in a document whose \`<html>\` is right-to-left.
- Use \`<line-avatar>\` alone for one person, and \`<line-stack orientation="horizontal">\` for pictures that must not overlap.`;

interface AvatarGroupArgs {
  label: string;
  max: number;
  overflowLabel: string;
}

const PEOPLE = [
  html`<line-avatar src="avatars/ana.svg" name="Ana Silva"></line-avatar>`,
  html`<line-avatar src="avatars/rui.svg" name="Rui Costa"></line-avatar>`,
  html`<line-avatar name="Marta Sousa"></line-avatar>`,
  html`<line-avatar src="avatars/mia.svg" name="Mia Santos"></line-avatar>`,
  html`<line-avatar name="Inês Rocha"></line-avatar>`,
];

/** Leaves the room at inline-start that the spread stack overlaps (spec 0010-avatar-group.md F14). */
const room = (content: TemplateResult): TemplateResult =>
  html`<div style="padding-inline-start: var(--line-size-9)">${content}</div>`;

const group = ({ label, max, overflowLabel }: AvatarGroupArgs, children: TemplateResult[] = PEOPLE) =>
  room(
    html`<line-avatar-group aria-label=${label} max=${max ?? nothing} overflow-label=${overflowLabel || nothing}
      >${children}</line-avatar-group
    >`,
  );

const meta = {
  title: 'Components/Avatar Group',
  component: 'line-avatar-group',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { label: 'Project members', max: 3, overflowLabel: '' },
  argTypes: {
    label: { control: 'text', description: 'The host `aria-label`, the group name' },
    max: { control: 'number', description: 'How many avatars show in the stack' },
    overflowLabel: { control: 'text', description: 'The "+N" name template, such as `+{count} more members`' },
  },
  render: (args) => group(args),
} satisfies Meta<AvatarGroupArgs>;

export default meta;

type Story = StoryObj<AvatarGroupArgs>;

const story = (text: string, render: (args: AvatarGroupArgs) => TemplateResult): Story => ({
  parameters: { docs: { description: { story: text } } },
  render,
});

export const Default: Story = story(
  'Five people with `max="3"`: three avatars show and "+2" opens a panel with the other two.',
  (args) => group(args),
);

export const NoOverflow: Story = {
  name: 'No overflow',
  ...story('Every avatar fits under `max`, so no "+N" renders.', (args) => group({ ...args, max: 5 })),
};

export const OverflowLabel: Story = {
  name: 'Overflow label',
  ...story(
    '`overflow-label="+{count} more members"` names "+2" as "+2 more members"; the visible text stays "+2".',
    (args) => group({ ...args, overflowLabel: '+{count} more members' }),
  ),
};

export const Sizes: Story = story(
  '`size` from `1` (smallest) to `5` (largest) sizes the avatars and "+N" together.',
  (args) =>
    html`<div style="display: grid; gap: var(--line-size-3)">
      ${(['1', '2', '3', '4', '5'] as const).map((size) =>
        room(
          html`<line-avatar-group aria-label=${`${args.label}, size ${size}`} max="3" size=${size}
            >${PEOPLE}</line-avatar-group
          >`,
        ),
      )}
    </div>`,
);

export const Spacing: Story = story(
  '`spacing` from `0` (no overlap) to `3` (most overlap) sets how far the stacked avatars overlap.',
  (args) =>
    html`<div style="display: grid; gap: var(--line-size-3)">
      ${(['0', '1', '2', '3'] as const).map((spacing) =>
        room(
          html`<line-avatar-group aria-label=${`${args.label}, spacing ${spacing}`} max="3" spacing=${spacing}
            >${PEOPLE}</line-avatar-group
          >`,
        ),
      )}
    </div>`,
);

export const Links: Story = story(
  'Each avatar is a link to a profile; the size and ring reach the avatars through the links, and each link is a Tab stop before "+N".',
  (args) =>
    group(
      { ...args, label: 'Authors', max: 2 },
      PEOPLE.slice(0, 4).map((avatar, i) => html`<a href=${`#author-${i + 1}`}>${avatar}</a>`),
    ),
);

export const WithStatus: Story = {
  name: 'With status',
  ...story(
    'Presence markers stay visible and announced in the stack; the group leaves `--line-avatar-status-visibility` to the consumer.',
    (args) =>
      group({ ...args, label: 'Online now' }, [
        html`<line-avatar src="avatars/ana.svg" name="Ana Silva"
          ><line-badge slot="status" variant="success" aria-label="Online"></line-badge
        ></line-avatar>`,
        html`<line-avatar src="avatars/rui.svg" name="Rui Costa"
          ><line-badge slot="status" variant="success" aria-label="Online"></line-badge
        ></line-avatar>`,
        html`<line-avatar src="avatars/logo.svg" name="WS Labs"></line-avatar>`,
      ]),
  ),
};

export const Expanded: Story = story(
  'Hover the group, or Tab to "+N": the avatars spread toward inline-start so each face shows whole, and "+N" stays put. Escape stacks them again.',
  (args) => group(args),
);

export const Open: Story = story(
  'Click "+N": the panel opens under it with the remaining avatars, and the stack stays spread while it is open.',
  (args) => group(args),
);

export const CustomTokens: Story = {
  name: 'Custom tokens',
  ...story(
    'Tokens and parts restyle the overlap, the spread gap, the ring, "+N" and the panel.',
    (args) => html`<style>
        .custom {
          --line-avatar-group-gap: var(--line-size-2);
          --line-avatar-group-overlap: var(--line-size-3);
          --line-avatar-group-content-radius: var(--line-radius-3);
          --line-avatar-ring-color: var(--line-accent-3);
          --line-avatar-bg: var(--line-accent-bg);
          --line-avatar-color: var(--line-accent-text);
        }
        .custom::part(overflow) {
          font-variant-numeric: tabular-nums;
        }
      </style>
      ${room(
        html`<line-avatar-group class="custom" aria-label=${args.label} max="3" size="4">${PEOPLE}</line-avatar-group>`,
      )}`,
  ),
};
