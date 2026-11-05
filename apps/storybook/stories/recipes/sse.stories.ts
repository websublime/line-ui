import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { createRecipe, RECIPE_CAPABILITIES } from './recipe-kit.js';

// The SSE recipe (Phase 1 spec §6.G.7 "SSE"; §10 SD67; §12 AM-088). A native `EventSource` receives one A2UI message
// per event until a named `end` event, with the capabilities in the query string; actions and `line-a2ui-error`
// leave by POST as JSON. In the deployed Storybook a Service Worker, `public/sse-recipe-sw.js`, plays the server.

/** Registers the Service Worker and resolves once it controls the page. */
async function serverReady(): Promise<void> {
  const { serviceWorker } = navigator;
  await serviceWorker.register(new URL('./sse-recipe-sw.js', document.baseURI));
  await serviceWorker.ready;
  if (serviceWorker.controller) return;
  await new Promise((resolve) => serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
}

function render(): HTMLElement {
  const recipe = createRecipe('SSE');
  const { surface } = recipe;
  const ready = serverReady();

  /** Opens one stream and feeds each message as it arrives; `request` picks what the server streams. */
  const listen = async (request?: string) => {
    await ready;
    const url = new URL('./sse-recipe/stream', document.baseURI);
    url.searchParams.set('capabilities', JSON.stringify(RECIPE_CAPABILITIES));
    if (request) url.searchParams.set('request', request);
    recipe.log('out', 'GET EventSource', { url: `${url.pathname}${url.search}` });
    const source = new EventSource(url);
    source.addEventListener('message', (event) => {
      const message: unknown = JSON.parse(event.data);
      recipe.log('in', 'SSE message', message);
      void surface.feed([message]);
    });
    // The named `end` event closes the stream; without it, EventSource reconnects when the server closes.
    source.addEventListener('end', () => {
      source.close();
      recipe.log('in', 'SSE end', {});
    });
    source.addEventListener('error', () => {
      if (source.readyState === EventSource.CLOSED) recipe.log('in', 'SSE error', { readyState: source.readyState });
    });
  };

  /** POSTs one A2UI message as JSON. */
  const post = async (channel: string, message: unknown) => {
    await ready;
    recipe.log('out', `POST ${channel}`, message);
    const response = await fetch(new URL('./sse-recipe/inbox', document.baseURI), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    recipe.log('in', `POST ${channel} ${response.status}`, await response.json());
  };

  recipe.onAction((message) => void post('action', message));
  recipe.onError((message) => void post('error', message));
  recipe.control('Ask for an A2UI v0.8 update', () => void listen('v0.8'));

  void listen();
  return recipe.root;
}

const meta = { title: 'Recipes/SSE', render } satisfies Meta;

export default meta;

export const EventStream: StoryObj = { name: 'Event stream' };
