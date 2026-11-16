import { z } from 'zod';
import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Grid descriptor (`docs/specs/0019-grid.md` Descriptor fields). */
export const gridDescriptor = defineDescriptor({
  name: 'Grid',
  tag: 'line-grid',
  load: () => import('@websublime/line-components/grid'),
  description:
    "A layout container that places its children in a grid of equal columns that adapts to the width it has. Put the children in `children`, in reading order; they fill the grid row by row. `columns` sets the most columns in a row, from `1` to `12` (default). `minColumnWidth` sets how narrow a column may get before the grid moves to fewer columns: `xxs`, `xs` (default), `sm` or `md`, or `none` to keep all `columns` at any width. Leave both out for as many medium-width columns as fit. `gap` sets the spacing on a scale from `0` (none) to `5` (widest); leave it out for a medium gap. `align` places each child within its row: `stretch` (default), `start`, `center` or `end`; `justifyItems` does the same within its column. A grid follows the page's writing direction and adds nothing to what assistive technology announces.",
  toolDescription:
    "A layout container that places its children in a grid of equal columns that adapts to the width it has. The app places the children inside it, in reading order; they fill the grid row by row. `columns` sets the most columns in a row, from `1` to `12` (default). `minColumnWidth` sets how narrow a column may get before the grid moves to fewer columns: `xxs`, `xs` (default), `sm` or `md`, or `none` to keep all `columns` at any width. Leave both out for as many medium-width columns as fit. `gap` sets the spacing on a scale from `0` (none) to `5` (widest); leave it out for a medium gap. `align` places each child within its row: `stretch` (default), `start`, `center` or `end`; `justifyItems` does the same within its column. A grid follows the page's writing direction and adds nothing to what assistive technology announces.",
  props: {
    columns: z
      .enum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
      .describe('The most columns in a row, from `1` to `12` (default).')
      .optional(),
    minColumnWidth: z
      .enum(['none', 'xxs', 'xs', 'sm', 'md'])
      .describe(
        'How narrow a column may get before the grid moves to fewer columns: `xxs`, `xs` (default), `sm` or `md`, or `none` to keep all `columns` at any width.',
      )
      .optional(),
    gap: z
      .enum(['0', '1', '2', '3', '4', '5'])
      .describe('The spacing between children, from `0` (none) to `5` (widest); unset gives a medium gap.')
      .optional(),
    align: z
      .enum(['start', 'center', 'end', 'stretch'])
      .describe('How each child sits within its row: `stretch` (default), `start`, `center` or `end`.')
      .optional(),
    justifyItems: z
      .enum(['start', 'center', 'end', 'stretch'])
      .describe('How each child sits within its column: `stretch` (default), `start`, `center` or `end`.')
      .optional(),
    children: commonProp('ChildList', 'The child components, in reading order.').optional(),
  },
  slots: { children: '' },
  bindings: {
    props: {
      columns: { kind: 'attribute', name: 'columns' },
      minColumnWidth: { kind: 'attribute', name: 'min-column-width' },
      gap: { kind: 'attribute', name: 'gap' },
      align: { kind: 'attribute', name: 'align' },
      justifyItems: { kind: 'attribute', name: 'justify-items' },
    },
  },
  actions: {},
  accessibility: { hostNaming: { kind: 'never' } },
});
