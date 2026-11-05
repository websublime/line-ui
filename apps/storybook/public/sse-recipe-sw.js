// The SSE recipe's producer (Phase 1 spec §6.G.7 "SSE"; §10 SD67; §12 AM-088). The deployed Storybook is static,
// so this Service Worker plays the server: it answers the recipe's EventSource GET with `text/event-stream`, one
// A2UI message per event and a named `end` event, and takes the recipe's POSTs of `action` and `error` messages.
// It answers only the two recipe paths under its scope; every other request goes to the network untouched.
//
// It is the server, so it keeps its own copy of the messages the other recipes' agents send
// (stories/agent-ui/a2ui-fixtures.ts, `basicShowcase` and `v08Envelope`).

const SURFACE_ID = 'main';
const BASIC_CATALOG_ID = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';

const message = (body) => ({ version: 'v0.9.1', ...body });
const text = (id, value, extra = {}) => ({ id, component: 'Text', text: value, ...extra });
const event = (name, context = {}) => ({ event: { name, context } });

/** The inbox surface: the C1–C4 components of the A2UI basic catalog, with a bound title. */
const INBOX = [
  message({ createSurface: { surfaceId: SURFACE_ID, catalogId: BASIC_CATALOG_ID } }),
  message({
    updateComponents: {
      surfaceId: SURFACE_ID,
      components: [
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
      ],
    },
  }),
  message({ updateDataModel: { surfaceId: SURFACE_ID, path: '/title', value: 'Inbox' } }),
];

/** An update from an agent on A2UI v0.8, which the surface rejects with `UNSUPPORTED_MESSAGE`. */
const V08_UPDATE = [{ surfaceUpdate: { surfaceId: SURFACE_ID, components: [] } }];

/** One SSE event per A2UI message, then the named `end` event, so `EventSource` does not reconnect. */
const eventStream = (messages) =>
  `${messages.map((item) => `data: ${JSON.stringify(item)}\n\n`).join('')}event: end\ndata: {}\n\n`;

/** Whether the capabilities from the query string name a catalog this server renders with. */
function supportsBasic(raw) {
  try {
    const ids = JSON.parse(raw ?? 'null')?.['v0.9']?.supportedCatalogIds;
    return Array.isArray(ids) && ids.includes(BASIC_CATALOG_ID);
  } catch {
    return false;
  }
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (activation) => activation.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (fetchEvent) => {
  const { request } = fetchEvent;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(`${scope.pathname}sse-recipe/`)) return;
  const route = url.pathname.slice(scope.pathname.length);

  if (route === 'sse-recipe/stream' && request.method === 'GET') {
    // EventSource sends no body and no custom header, so the capabilities ride the query string.
    if (!supportsBasic(url.searchParams.get('capabilities'))) {
      fetchEvent.respondWith(
        new Response('The capabilities list no catalog this agent renders with.', { status: 400 }),
      );
      return;
    }
    const messages = url.searchParams.get('request') === 'v0.8' ? V08_UPDATE : INBOX;
    fetchEvent.respondWith(
      new Response(eventStream(messages), {
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' },
      }),
    );
  } else if (route === 'sse-recipe/inbox' && request.method === 'POST') {
    fetchEvent.respondWith(
      request.json().then(
        (body) => {
          const kind = body && typeof body === 'object' ? ['action', 'error'].find((key) => key in body) : undefined;
          return kind
            ? Response.json({ accepted: kind }, { status: 202 })
            : Response.json({ rejected: 'not an A2UI action or error message' }, { status: 400 });
        },
        () => Response.json({ rejected: 'not JSON' }, { status: 400 }),
      ),
    );
  }
});
