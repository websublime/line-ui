import '@websublime/line-components/grid';
import '@websublime/line-tokens/layouts';
import '@websublime/line-tokens/sizing';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { GridAlign, GridColumns, GridGap, GridMinColumnWidth } from '@websublime/line-components/grid';
import { html, nothing, type TemplateResult } from 'lit';
import { extractArgTypes } from './manifest-arg-types.js';

// <line-grid> stories (spec 0019-grid.md, default D15). The autodocs page reads the attributes, slots and custom
// properties from the shipped Custom Elements Manifest that preview.ts registers. The stories import only the token
// families Grid reads. The outlined boxes are story markup, so the layout is visible; Grid itself draws nothing.

const DESCRIPTION = `\`<line-grid>\` lays out its children in rows of equal columns. The host is the grid container and the children are its grid items, in source order, row by row, in the writing direction of the page. The column count adapts to the width the grid has: \`columns\` caps how many columns a row holds (\`1\`–\`12\`, at most 12 without it), and \`min-column-width\` sets how narrow a column may get before the grid moves to fewer columns (\`xxs\` 12rem, \`xs\` 16rem by default, \`sm\` 24rem, \`md\` 32rem, or \`none\` to keep all \`columns\` at any width). \`gap\` picks a step from \`0\` to \`5\` on the \`--line-layout-gap-*\` scale.

\`\`\`html
<line-grid columns="3" min-column-width="xxs">
  <article>One</article>
  <article>Two</article>
  <article>Three</article>
</line-grid>
\`\`\`

- **Lists.** A list of cards puts \`role="list"\` on the host and \`role="listitem"\` on each child. Without a role the grid is a \`generic\` element: do not give it an \`aria-label\`, which names nothing a user can reach.
- **Not a data grid.** Never put \`role="grid"\` on \`line-grid\`. That role claims an interactive widget with arrow-key navigation between cells, which Grid does not provide.
- **In a flex row.** In a flex row, such as a horizontal \`<line-stack>\`, or in an \`auto\` grid track, the grid sizes to its content, so its columns have no room. Give it \`flex: 1\` or a width there.
- **Zero.** Write \`0px\`, never a unitless \`0\`, when you set \`--line-grid-gap\`, \`--line-grid-column-gap\` or \`--line-grid-min-column-width\` to zero, because these tokens enter the column formula and a unitless \`0\` collapses the grid to one column.
- **Gaps.** Set \`--line-grid-row-gap\` and \`--line-grid-column-gap\` for different row and column gaps. Set the token, not \`column-gap\`, because the column formula reads the token.
- **Spanning.** \`grid-column: 1 / -1\` on a child takes a whole row at any column count. \`grid-column: span N\` works too, but in a grid whose count adapts it adds an implicit column once fewer than \`N\` columns fit; pair it with \`min-column-width="none"\` or a container query.
- **Order.** Grid keeps the source order. Consumer CSS that moves items with \`order\`, \`grid-row\` or \`grid-auto-flow: dense\` makes the visual order differ from the reading and focus order; avoid it.
- **Breakpoints.** Set \`--line-grid-columns\` or \`--line-grid-min-column-width\` from your own container or media query on an ancestor (Container query story).
- **Not verified.** No check reads the Firefox or WebKit accessibility tree, and no screen reader was run.`;

interface GridArgs {
  columns: GridColumns | '';
  minColumnWidth: GridMinColumnWidth | '';
  gap: GridGap | '';
  align: GridAlign;
  justifyItems: GridAlign;
  items: number;
}

const BOX = 'padding: 4px 8px; border: 1px solid currentColor;';

/** `count` outlined boxes labelled `Item 1` … `Item n`. */
const boxes = (count: number): TemplateResult[] =>
  Array.from({ length: count }, (_, index) => html`<div style=${BOX}>Item ${index + 1}</div>`);

const meta = {
  title: 'Components/Primitives Base/Grid',
  id: 'components-grid',
  component: 'line-grid',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { columns: '', minColumnWidth: '', gap: '', align: 'stretch', justifyItems: 'stretch', items: 6 },
  argTypes: {
    columns: {
      control: 'select',
      options: ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      description: 'Empty means no attribute',
    },
    minColumnWidth: {
      control: 'select',
      options: ['', 'none', 'xxs', 'xs', 'sm', 'md'],
      description: 'Empty means no attribute',
    },
    gap: { control: 'select', options: ['', '0', '1', '2', '3', '4', '5'], description: 'Empty means no attribute' },
    align: { control: 'inline-radio', options: ['start', 'center', 'end', 'stretch'] },
    justifyItems: { control: 'inline-radio', options: ['start', 'center', 'end', 'stretch'] },
    items: { control: { type: 'number', min: 0, max: 24 }, description: 'Number of story boxes in the default slot' },
  },
  render: ({ columns, minColumnWidth, gap, align, justifyItems, items }) =>
    html`<line-grid
      columns=${columns || nothing}
      min-column-width=${minColumnWidth || nothing}
      gap=${gap || nothing}
      align=${align}
      justify-items=${justifyItems}
      >${boxes(items)}</line-grid
    >`,
} satisfies Meta<GridArgs>;

export default meta;

type Story = StoryObj<GridArgs>;

export const Default: Story = {
  parameters: { docs: { description: { story: 'As many 16rem columns as fit, up to 12, with gap step `2`.' } } },
  render: ({ items }) => html`<line-grid>${boxes(items)}</line-grid>`,
};

export const ColumnCaps: Story = {
  name: 'Column caps',
  parameters: {
    docs: {
      description: {
        story: '`columns` 2, 3 and 4 with the default 16rem minimum: at most that many columns, fewer when narrow.',
      },
    },
  },
  render: () =>
    html`<line-grid columns="1" gap="4">
      ${(['2', '3', '4'] as const).map(
        (columns) => html`<line-grid columns=${columns}>${boxes(Number(columns) + 1)}</line-grid>`,
      )}
    </line-grid>`,
};

export const FixedColumns: Story = {
  name: 'Fixed columns',
  parameters: {
    docs: { description: { story: '`min-column-width="none"` keeps all `columns` at any width.' } },
  },
  render: () =>
    html`<line-grid columns="1" gap="4">
      <line-grid columns="2" min-column-width="none">${boxes(4)}</line-grid>
      <line-grid columns="4" min-column-width="none">${boxes(8)}</line-grid>
    </line-grid>`,
};

export const MinimumWidths: Story = {
  name: 'Minimum widths',
  parameters: {
    docs: { description: { story: '`min-column-width` `xxs` (12rem), `xs` (16rem), `sm` (24rem) and `md` (32rem).' } },
  },
  render: () =>
    html`<line-grid columns="1" gap="4">
      ${(['xxs', 'xs', 'sm', 'md'] as const).map(
        (width) => html`<line-grid min-column-width=${width}>
          <div style=${BOX}>${width}</div>
          ${boxes(5)}
        </line-grid>`,
      )}
    </line-grid>`,
};

export const GapScale: Story = {
  name: 'Gap scale',
  render: () =>
    html`<line-grid columns="1" gap="4">
      ${(['0', '1', '2', '3', '4', '5'] as const).map(
        (gap) => html`<line-grid columns="4" min-column-width="none" gap=${gap}>
          <div style=${BOX}>gap ${gap}</div>
          ${boxes(3)}
        </line-grid>`,
      )}
    </line-grid>`,
};

export const Alignment: Story = {
  args: { columns: '3', align: 'center', justifyItems: 'start' },
  parameters: {
    docs: {
      description: {
        story:
          '`align` places each child within its row and `justify-items` within its column; the middle child is taller.',
      },
    },
  },
  render: ({ align, justifyItems }) =>
    html`<line-grid columns="3" min-column-width="none" align=${align} justify-items=${justifyItems}>
      <div style=${BOX}>One</div>
      <div style=${BOX}>Two<br />two<br />two</div>
      <div style=${BOX}>Three</div>
    </line-grid>`,
};

export const AuthorList: Story = {
  name: 'Author-built list',
  parameters: {
    docs: {
      description: { story: '`role="list"` on the host and `role="listitem"` on each child; the list takes a name.' },
    },
  },
  render: () =>
    html`<line-grid role="list" aria-label="Products" min-column-width="xxs">
      <article role="listitem" style=${BOX}>Lamp</article>
      <article role="listitem" style=${BOX}>Chair</article>
      <article role="listitem" style=${BOX}>Desk</article>
    </line-grid>`,
};

export const ContainerQuery: Story = {
  name: 'Container query',
  parameters: {
    docs: {
      description: {
        story:
          'A `.sidebar` container sets `--line-grid-columns: 2` from `@container (min-width: 40rem)`: 1 column at 30rem, 2 at 60rem, and 3 in a 60rem container without the rule.',
      },
    },
  },
  render: () =>
    html`<style>
        .sidebar {
          container-type: inline-size;
        }
        @container (min-width: 40rem) {
          .sidebar line-grid {
            --line-grid-columns: 2;
          }
        }
      </style>
      <line-grid columns="1" gap="4">
        <div class="sidebar" style="inline-size: 30rem"><line-grid>${boxes(4)}</line-grid></div>
        <div class="sidebar" style="inline-size: 60rem"><line-grid>${boxes(4)}</line-grid></div>
        <div style="inline-size: 60rem"><line-grid>${boxes(4)}</line-grid></div>
      </line-grid>`,
};

export const FullRowChild: Story = {
  name: 'Full-row child',
  parameters: {
    docs: { description: { story: '`grid-column: 1 / -1` on a child takes a whole row at any column count.' } },
  },
  render: () =>
    html`<line-grid columns="3" min-column-width="xxs">
      <div style="${BOX} grid-column: 1 / -1">Banner</div>
      ${boxes(5)}
    </line-grid>`,
};
