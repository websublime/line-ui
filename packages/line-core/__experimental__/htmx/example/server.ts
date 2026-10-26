/**
 * The H1 spike server (spec §6.H.1). A small `Bun.serve` that keeps the
 * counter state server-side and answers every htmx request with an HTML
 * fragment. `/?htmx=2` (the default) loads htmx 2.0.11 and `/?htmx=4` loads
 * htmx 4.0.0, both from the aliased `line-core` devDependencies `htmx2` and
 * `htmx4` (AM-060, AM-077). The example component is bundled once at start-up.
 *
 * Run from the repository root: `bun packages/line-core/__experimental__/htmx/example/server.ts`.
 * The server binds the loopback address 127.0.0.1 only, because its POST
 * routes mutate state. `PORT` overrides the default port 4330.
 *
 * @module __experimental__/htmx/example/server
 */

const HTMX_SCRIPTS = {
  '2': Bun.resolveSync('htmx2/dist/htmx.js', import.meta.dir),
  '4': Bun.resolveSync('htmx4/dist/htmx.js', import.meta.dir),
} as const;

const bundle = await Bun.build({ entrypoints: [`${import.meta.dir}/line-htmx-counter.ts`], target: 'browser' });
const [componentJs] = bundle.outputs;
if (!(bundle.success && componentJs)) {
  throw new AggregateError(bundle.logs, 'Bundling line-htmx-counter.ts failed');
}
const page = await Bun.file(`${import.meta.dir}/index.html`).text();

const state = { count: 0, previous: 0, publishes: 0, logs: 0, hostRequests: 0 };

const html = (body: string, status = 200): Response =>
  new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** What the server received, echoed into each fragment as evidence. */
function echo(req: Request, form: FormData | null): string {
  const url = new URL(req.url);
  const fields = form ? [...form].map(([key, value]) => `${key}=${String(value)}`).join(' ') : '';
  const header = req.headers.get('x-line-consumer') ?? 'none';
  return escapeHtml(`${req.method} ${url.pathname} [${fields || 'no fields'}] X-Line-Consumer: ${header}`);
}

function readout(req: Request, form: FormData | null, undo: boolean): Response {
  const undoButton = undo ? '<button part="undo" type="button" hx-post="/undo" hx-target="#readout">Undo</button>' : '';
  return html(`<data value="${state.count}">${state.count}</data> <small>${echo(req, form)}</small> ${undoButton}`);
}

async function step(req: Request, sign: 1 | -1): Promise<Response> {
  const form = await req.formData();
  const value = Number(form.get('step'));
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    return html(`<small>Step must be an integer from 1 to 100. ${echo(req, form)}</small>`, 422);
  }
  state.previous = state.count;
  state.count += sign * value;
  return readout(req, form, true);
}

const server = Bun.serve({
  hostname: '127.0.0.1',
  port: Number(process.env.PORT ?? 4330),
  routes: {
    '/': (req) => {
      const major = new URL(req.url).searchParams.get('htmx') ?? '2';
      if (major !== '2' && major !== '4') {
        return html('<p>Use <code>?htmx=2</code> or <code>?htmx=4</code>.</p>', 400);
      }
      return html(page.replace('<!-- htmx -->', `<script src="/vendor/htmx-${major}.js"></script>`));
    },
    '/vendor/htmx-2.js': () => new Response(Bun.file(HTMX_SCRIPTS['2'])),
    '/vendor/htmx-4.js': () => new Response(Bun.file(HTMX_SCRIPTS['4'])),
    '/line-htmx-counter.js': () => new Response(componentJs, { headers: { 'content-type': 'text/javascript' } }),
    '/value': { GET: (req) => readout(req, null, false) },
    '/inc': { POST: (req) => step(req, 1) },
    '/dec': { POST: (req) => step(req, -1) },
    '/undo': {
      POST: (req) => {
        state.count = state.previous;
        return readout(req, null, false);
      },
    },
    '/reset': {
      POST: (req) => {
        state.previous = state.count;
        state.count = 0;
        return readout(req, null, true);
      },
    },
    '/publish': {
      POST: (req) => {
        state.publishes += 1;
        return html(
          `<span slot="summary">Published count ${state.count} (#${state.publishes}) · ${echo(req, null)}</span>`,
        );
      },
    },
    '/log': {
      POST: async (req) => {
        state.logs += 1;
        const form = await req.formData().catch(() => null);
        return html(`<li>Count ${state.count} logged (#${state.logs}) · ${echo(req, form)}</li>`);
      },
    },
    '/host': {
      GET: (req) => {
        state.hostRequests += 1;
        return html(`Host request #${state.hostRequests} · ${echo(req, null)}`);
      },
    },
    '/submit': { POST: async (req) => html(echo(req, await req.formData())) },
    '/element': {
      GET: () => html('<line-htmx-counter id="from-server" operation="dec" resettable></line-htmx-counter>'),
    },
    '/baseline': { POST: (req) => html(echo(req, null)) },
  },
  fetch: () => html('Not found', 404),
});

console.info(`line-htmx spike on ${server.url} (htmx 2: ${server.url}?htmx=2, htmx 4: ${server.url}?htmx=4)`);
