// A2UI v0.9.1 message streams the <line-a2ui-surface> stories feed (Phase 1 spec §6.G.4). The render fixture:
// Button, Icon, Separator and Stack (C1–C4) through both catalogs, IconButton (C5), ButtonGroup (C6), Alert (C7),
// Chip (C8), Badge (C9), Avatar (C10) and AvatarGroup (C11) through the `line` catalog, and a basic `Image` with
// `variant: "avatar"` (C10) through its own `catalogId`.
// Each C5–C20 row that is agent-exposed adds its component here and to the surface axe test (§6.C.6).

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

/** The component list of {@link basicShowcase}: Text, Row, Column, Divider, Icon and two Buttons with actions. */
export const showcaseComponents: A2uiMessage[] = [
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
];

/** The data model of {@link basicShowcase}: the title the `title` Text binds. */
export const showcaseData = { title: 'Inbox' };

/** The A2UI basic catalog: Text, Row, Column, Divider, Icon and Button, with a bound title and an action. */
export const basicShowcase: A2uiMessage[] = [
  create(BASIC_CATALOG_ID),
  components(showcaseComponents),
  data('/title', showcaseData.title),
];

/**
 * The `line` catalog: Stack, Button, Icon, Separator, IconButton, ButtonGroup, Chip, Badge, Avatar, AvatarGroup,
 * Alert and Kbd under the `line` id. The Alert's texts are basic catalog Text nodes, which a node selects with its own `catalogId`. Each Chip
 * takes its text from `label` and binds `pressed` to the data model. One Badge binds its count `label` to the data
 * model, and a dot Badge with no `label` is named by its `accessibility.label`. One Avatar binds its `src` and `name`
 * and holds a presence Badge in `status`; a basic `Image` with `variant: "avatar"` renders the second `line-avatar`.
 * One named AvatarGroup holds three Avatars with `max` 2, so "+1" opens a panel with the third, named by its
 * `overflowLabel`. A Kbd at the end of the toolbar shows the `mod+k` shortcut hint.
 */
export const lineShowcase: A2uiMessage[] = [
  create(LINE_CATALOG_ID),
  components([
    { id: 'root', component: 'Stack', gap: '3', children: ['toolbar', 'filters', 'team', 'notice'] },
    {
      id: 'toolbar',
      component: 'Stack',
      orientation: 'horizontal',
      align: 'center',
      gap: '2',
      children: ['home', 'sep', 'send', 'glyph', 'close', 'zoom', 'searchHint'],
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
    {
      id: 'close',
      component: 'IconButton',
      variant: 'borderless',
      child: 'closeIcon',
      accessibility: { label: 'Close' },
      action: event('close'),
    },
    { id: 'closeIcon', component: 'Icon', path: 'M6 6 L18 18 M18 6 L6 18' },
    {
      id: 'zoom',
      component: 'ButtonGroup',
      loop: true,
      children: ['zoomOut', 'zoomReset', 'zoomIn'],
      accessibility: { label: 'Zoom' },
    },
    { id: 'searchHint', component: 'Kbd', keys: 'mod+k' },
    {
      id: 'zoomOut',
      component: 'IconButton',
      child: 'zoomOutIcon',
      accessibility: { label: 'Zoom out' },
      action: event('zoomOut'),
    },
    { id: 'zoomOutIcon', component: 'Icon', path: 'M5 12 L19 12' },
    {
      id: 'zoomReset',
      component: 'IconButton',
      child: 'zoomResetIcon',
      accessibility: { label: 'Reset zoom' },
      action: event('zoomReset'),
    },
    { id: 'zoomResetIcon', component: 'Icon', path: 'M6 6 L18 6 L18 18 L6 18 Z' },
    {
      id: 'zoomIn',
      component: 'IconButton',
      child: 'zoomInIcon',
      accessibility: { label: 'Zoom in' },
      action: event('zoomIn'),
    },
    { id: 'zoomInIcon', component: 'Icon', path: 'M5 12 L19 12 M12 5 L12 19' },
    {
      id: 'notice',
      component: 'Alert',
      variant: 'danger',
      icon: 'noticeIcon',
      title: 'noticeTitle',
      children: ['noticeText'],
      actions: ['noticeRetry'],
      dismiss: 'noticeDismiss',
    },
    { id: 'noticeIcon', component: 'Icon', path: 'M12 2 L22 22 L2 22 Z' },
    text('noticeTitle', 'Payment failed', { variant: 'h3', catalogId: BASIC_CATALOG_ID }),
    text('noticeText', 'Check the card number and try again.', { catalogId: BASIC_CATALOG_ID }),
    { id: 'noticeRetry', component: 'Button', variant: 'primary', child: 'noticeRetryLabel', action: event('retry') },
    text('noticeRetryLabel', 'Retry', { catalogId: BASIC_CATALOG_ID }),
    {
      id: 'noticeDismiss',
      component: 'IconButton',
      variant: 'borderless',
      child: 'noticeDismissIcon',
      accessibility: { label: 'Dismiss' },
      action: event('dismissNotice'),
    },
    { id: 'noticeDismissIcon', component: 'Icon', path: 'M6 6 L18 18 M18 6 L6 18' },
    {
      id: 'filters',
      component: 'Stack',
      orientation: 'horizontal',
      align: 'center',
      gap: '2',
      children: ['inStock', 'freeShipping', 'results', 'fresh', 'me', 'teammate'],
    },
    { id: 'inStock', component: 'Chip', label: 'In stock', pressed: { path: '/filters/inStock' } },
    {
      id: 'freeShipping',
      component: 'Chip',
      label: 'Free shipping',
      variant: 'primary',
      pressed: { path: '/filters/freeShipping' },
    },
    { id: 'results', component: 'Badge', label: { path: '/filters/results' }, variant: 'info' },
    { id: 'fresh', component: 'Badge', variant: 'success', accessibility: { label: 'New arrivals' } },
    { id: 'me', component: 'Avatar', src: { path: '/user/photo' }, name: { path: '/user/name' }, status: 'presence' },
    { id: 'presence', component: 'Badge', variant: 'success', accessibility: { label: 'Online' } },
    {
      id: 'teammate',
      component: 'Image',
      catalogId: BASIC_CATALOG_ID,
      url: 'avatars/rui.svg',
      description: 'Rui Costa',
      variant: 'avatar',
    },
    {
      id: 'team',
      component: 'AvatarGroup',
      children: ['ana', 'rui', 'marta'],
      max: 2,
      overflowLabel: '+{count} more members',
      accessibility: { label: 'Project members' },
    },
    { id: 'ana', component: 'Avatar', src: 'avatars/ana.svg', name: 'Ana Silva' },
    { id: 'rui', component: 'Avatar', src: 'avatars/rui.svg', name: 'Rui Costa' },
    { id: 'marta', component: 'Avatar', name: 'Marta Sousa' },
  ]),
  data('/filters', { inStock: true, freeShipping: false, results: '24' }),
  data('/user', { photo: 'avatars/ana.svg', name: 'Ana Silva' }),
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

/**
 * An unmapped basic type, a Button without a name and a `line` catalog Badge with neither `label` nor
 * `accessibility.label`: three inert placeholders and three `line-a2ui-error`s.
 */
export const errorShowcase: A2uiMessage[] = [
  create(BASIC_CATALOG_ID),
  components([
    { id: 'root', component: 'Column', children: ['kept', 'field', 'unnamed', 'dot'] },
    text('kept', 'This text renders; the three placeholders after it do not.'),
    { id: 'field', component: 'TextField', label: 'Name' },
    { id: 'unnamed', component: 'Button', child: 'blank', action: event('x') },
    text('blank', ' '),
    { id: 'dot', component: 'Badge', catalogId: LINE_CATALOG_ID, variant: 'danger' },
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

/**
 * An A2UI v0.8 envelope, as an agent on the older protocol sends it. The surface applies nothing and raises
 * `UNSUPPORTED_MESSAGE`.
 */
export const v08Envelope: A2uiMessage = { surfaceUpdate: { surfaceId: SURFACE_ID, components: [] } };
