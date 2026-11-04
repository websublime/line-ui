// A2UI v0.9.1 message streams the <line-a2ui-surface> stories feed (Phase 1 spec §6.G.4). The C1–C4 render
// fixture: Button, Icon, Separator and Stack through both catalogs. Each C5–C20 row that is agent-exposed adds
// its component here and to the surface axe test (§6.C.6).

/** One A2UI message. */
export type A2uiMessage = Record<string, unknown>;

export const SURFACE_ID = 'main';
export const BASIC_CATALOG_ID = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';
export const LINE_CATALOG_ID = 'https://line-ui.websublime.com/a2ui/catalogs/line/v1/catalog.json';

const message = (body: A2uiMessage): A2uiMessage => ({ version: 'v0.9.1', ...body });
const create = (catalogId: string) => message({ createSurface: { surfaceId: SURFACE_ID, catalogId } });
const components = (list: A2uiMessage[]) => message({ updateComponents: { surfaceId: SURFACE_ID, components: list } });
const data = (path: string, value: unknown) => message({ updateDataModel: { surfaceId: SURFACE_ID, path, value } });
const text = (id: string, value: unknown, extra: A2uiMessage = {}) => ({
  id,
  component: 'Text',
  text: value,
  ...extra,
});
const event = (name: string, context: A2uiMessage = {}) => ({ event: { name, context } });

/** The A2UI basic catalog: Text, Row, Column, Divider, Icon and Button, with a bound title and an action. */
export const basicShowcase: A2uiMessage[] = [
  create(BASIC_CATALOG_ID),
  components([
    { id: 'root', component: 'Column', align: 'start', children: ['title', 'intro', 'rule', 'actions'] },
    text('title', { path: '/title' }, { variant: 'h2' }),
    text('intro', 'A basic catalog stream, rendered with line://ui components.'),
    { id: 'rule', component: 'Divider' },
    { id: 'actions', component: 'Row', align: 'center', children: ['save', 'split', 'like'] },
    {
      id: 'save',
      component: 'Button',
      variant: 'primary',
      child: 'saveLabel',
      action: event('save', { title: { path: '/title' } }),
    },
    text('saveLabel', 'Save'),
    { id: 'split', component: 'Divider', axis: 'vertical' },
    { id: 'like', component: 'Button', child: 'likeIcon', accessibility: { label: 'Like' }, action: event('like') },
    { id: 'likeIcon', component: 'Icon', name: 'favorite' },
  ]),
  data('/title', 'Inbox'),
];

/** The `line` catalog: Stack, Button, Icon and Separator under the `line` id. */
export const lineShowcase: A2uiMessage[] = [
  create(LINE_CATALOG_ID),
  components([
    {
      id: 'root',
      component: 'Stack',
      orientation: 'horizontal',
      align: 'center',
      gap: '2',
      children: ['home', 'sep', 'send', 'glyph'],
    },
    {
      id: 'home',
      component: 'Button',
      variant: 'borderless',
      child: 'homeIcon',
      accessibility: { label: 'Home' },
      action: event('home'),
    },
    { id: 'homeIcon', component: 'Icon', name: 'home' },
    { id: 'sep', component: 'Separator', orientation: 'vertical', decorative: true },
    { id: 'send', component: 'Button', variant: 'primary', accessibility: { label: 'Send' }, action: event('send') },
    { id: 'glyph', component: 'Icon', path: 'M12 2 L22 22 L2 22 Z' },
  ]),
];

/** An A2UI List whose items render as `line-stack` and as other elements. */
export const listShowcase: A2uiMessage[] = [
  create(BASIC_CATALOG_ID),
  components([
    {
      id: 'root',
      component: 'List',
      accessibility: { label: 'Messages' },
      children: { componentId: 'item', path: '/items' },
    },
    { id: 'item', component: 'Row', align: 'center', children: ['itemIcon', 'itemText'] },
    { id: 'itemIcon', component: 'Icon', name: 'home' },
    text('itemText', { path: 'label' }),
  ]),
  data('/items', [{ label: 'Draft saved' }, { label: 'Reply sent' }, { label: 'Archived' }]),
];

/** A List whose items are a mix: a Row renders as `line-stack`, a Text gets a `<div role="listitem">` wrapper. */
export const mixedListShowcase: A2uiMessage[] = [
  create(BASIC_CATALOG_ID),
  components([
    { id: 'root', component: 'List', children: ['row', 'plain', 'button'] },
    { id: 'row', component: 'Row', children: ['rowText'] },
    text('rowText', 'A Row item'),
    text('plain', 'A Text item'),
    { id: 'button', component: 'Button', child: 'buttonText', action: event('open') },
    text('buttonText', 'A Button item'),
  ]),
];

/** An unmapped basic type and a Button without a name: two inert placeholders and two `line-a2ui-error`s. */
export const errorShowcase: A2uiMessage[] = [
  create(BASIC_CATALOG_ID),
  components([
    { id: 'root', component: 'Column', children: ['kept', 'field', 'unnamed'] },
    text('kept', 'This text renders; the two placeholders after it do not.'),
    { id: 'field', component: 'TextField', label: 'Name' },
    { id: 'unnamed', component: 'Button', child: 'blank', action: event('x') },
    text('blank', ' '),
  ]),
];

/** A directional icon under `dir="rtl"`. */
export const rtlShowcase: A2uiMessage[] = [
  create(BASIC_CATALOG_ID),
  components([
    { id: 'root', component: 'Row', align: 'center', children: ['back', 'label'] },
    { id: 'back', component: 'Icon', name: 'arrowBack' },
    text('label', 'رجوع'),
  ]),
];
