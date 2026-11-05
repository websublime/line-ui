import '@websublime/line-genui/a2ui';

import {
  type A2uiActionMessage,
  type A2uiErrorMessage,
  type LineA2uiSurface,
  Session,
} from '@websublime/line-genui/a2ui';
import { a2uiIconMap } from '@websublime/line-icons/a2ui';
import { BASIC_CATALOG_ID, LINE_CATALOG_ID, SURFACE_ID } from '../agent-ui/a2ui-fixtures.js';
import { registerStoryIcons } from '../agent-ui/story-icons.js';

// The page frame every transport recipe shares (Phase 1 spec §6.G.7). A recipe is app code: it owns the transport
// and its producer, feeds `<line-a2ui-surface>` the messages that arrive, and sends what the surface raises. The
// frame adds a wire log, so the page shows each frame that crosses the transport, and recipe-owned controls.

registerStoryIcons();

/**
 * The A2UI client capabilities every recipe sends: the catalog ids the surface's session renders, the `line`
 * catalog and the A2UI basic catalog (`client_capabilities.json`, key `v0.9`). The recipes' agents accept no
 * inline catalog; an agent that does takes `lineCapabilities()` from `@websublime/line-genui/catalog`.
 */
export const RECIPE_CAPABILITIES = { 'v0.9': { supportedCatalogIds: [LINE_CATALOG_ID, BASIC_CATALOG_ID] } };

/** Where a wire-log entry travelled: out to the agent, in from it, or kept on the page. */
export type WireDirection = 'out' | 'in' | 'local';

/** One recipe on the page: the surface, the recipe status line, the controls and the wire log. */
export interface Recipe {
  /** The element the story returns. */
  readonly root: HTMLElement;
  /** The surface; a fresh `Session` renders surface `main`. */
  readonly surface: LineA2uiSurface;
  /** A recipe-owned status line outside the surface, hidden until a recipe shows it. */
  readonly status: HTMLElement;
  /** Adds a recipe-owned button below the surface. */
  control(label: string, onClick: () => void): HTMLButtonElement;
  /** Adds a wire-log entry; `payload` is shown as JSON, and `channel` names what travelled. */
  log(direction: WireDirection, channel: string, payload: unknown): void;
  /** Calls `handler` with each `line-a2ui-action` message the surface raises. */
  onAction(handler: (message: A2uiActionMessage) => void): void;
  /** Calls `handler` with each `line-a2ui-error` message the surface raises. */
  onError(handler: (message: A2uiErrorMessage) => void): void;
}

/** The `detail` of a surface event. */
function detailOf<T>(event: Event): T {
  if (!(event instanceof CustomEvent)) throw new TypeError(`[recipes] ${event.type} is not a CustomEvent`);
  return event.detail;
}

/**
 * Builds the frame of one recipe.
 *
 * @param name The transport name, used in the region label.
 */
export function createRecipe(name: string): Recipe {
  const root = document.createElement('section');
  root.setAttribute('aria-label', `${name} recipe`);
  root.dataset.recipe = name;
  root.style.cssText = 'display: grid; gap: 1rem; max-inline-size: 48rem;';

  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.dataset.recipeStatus = '';
  status.hidden = true;

  const surface: LineA2uiSurface = document.createElement('line-a2ui-surface');
  surface.surfaceId = SURFACE_ID;
  surface.iconMap = a2uiIconMap('phosphor', { library: 'phosphor' });
  surface.session = new Session();

  const controls = document.createElement('div');
  controls.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem;';

  const wire = document.createElement('details');
  wire.open = true;
  const summary = document.createElement('summary');
  summary.textContent = 'Wire log';
  const entries = document.createElement('ol');
  entries.dataset.wireLog = '';
  entries.style.cssText = 'display: grid; gap: 0.5rem; padding: 0; list-style: none;';
  wire.append(summary, entries);

  root.append(status, surface, controls, wire);

  return {
    root,
    surface,
    status,
    control(label, onClick) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', onClick);
      controls.append(button);
      return button;
    },
    log(direction, channel, payload) {
      const entry = document.createElement('li');
      entry.dataset.direction = direction;
      entry.dataset.channel = channel;
      const label = document.createElement('strong');
      label.textContent = `${direction === 'out' ? '→' : direction === 'in' ? '←' : '•'} ${channel}`;
      const body = document.createElement('pre');
      body.style.cssText = 'margin: 0; overflow: auto; max-block-size: 12rem;';
      body.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
      entry.append(label, body);
      entries.append(entry);
    },
    onAction(handler) {
      surface.addEventListener('line-a2ui-action', (event) => handler(detailOf<A2uiActionMessage>(event)));
    },
    onError(handler) {
      surface.addEventListener('line-a2ui-error', (event) => handler(detailOf<A2uiErrorMessage>(event)));
    },
  };
}
