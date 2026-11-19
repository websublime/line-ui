import { setIconRegistry } from '@websublime/line-components';
import {
  type A2uiActionMessage,
  type A2uiErrorMessage,
  type LineA2uiSurface,
  Session,
} from '@websublime/line-genui/a2ui';
import { IconRegistry } from '@websublime/line-icons';
import { a2uiIconMap } from '@websublime/line-icons/a2ui';
import { createPhosphorResolver } from '@websublime/line-icons/resolvers/phosphor';

/** The app's own transport: AG-UI, A2A, MCP, SSE or anything else. */
export interface Transport {
  send(message: A2uiActionMessage | A2uiErrorMessage): void;
}

const registry = new IconRegistry();
registry.register('phosphor', createPhosphorResolver({ base: '/icons/phosphor/' }));
setIconRegistry(registry);

/** Mounts a surface that renders the A2UI surface `main` and sends its actions and errors back. */
export function mountSurface(host: HTMLElement, transport: Transport): LineA2uiSurface {
  const surface = document.createElement('line-a2ui-surface');
  surface.surfaceId = 'main';

  // The live region speaks the page's language.
  surface.liveUpdateText = 'Conteúdo atualizado.';
  surface.liveErrorText = 'Parte do conteúdo não pôde ser mostrada.';

  // Tighter limits than the defaults of 1,000 nodes, depth 32 and 1 MiB of data model.
  surface.maxNodes = 300;
  surface.maxDepth = 12;
  surface.maxDataModelSize = 65_536;

  surface.iconMap = a2uiIconMap('phosphor', { library: 'phosphor' });
  surface.session = new Session();

  // Both events are `CustomEvent`s whose `detail` is the A2UI message, ready to send as it is.
  const forward = (event: Event): void => {
    if (event instanceof CustomEvent) transport.send(event.detail);
  };
  surface.addEventListener('line-a2ui-action', forward);
  surface.addEventListener('line-a2ui-error', forward);

  host.append(surface);
  return surface;
}

/** Feeds one transport batch and resolves with how many messages applied, once the surface has settled. */
export function receive(surface: LineA2uiSurface, batch: readonly unknown[]): Promise<number> {
  return surface.feed(batch);
}
