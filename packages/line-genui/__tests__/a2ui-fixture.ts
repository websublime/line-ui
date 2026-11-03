/**
 * Shared fixtures of the `./a2ui` unit tests (Phase 1 spec §6.G.4; ledger 01-G4): message builders, a mounted
 * `<line-a2ui-surface>` on a fresh `Session`, and the `client_to_server.json` check every emitted
 * `line-a2ui-error` and `line-a2ui-action` goes through (R2 §2.6).
 *
 * @module __tests__/a2ui-fixture
 */

import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { type A2uiActionMessage, type A2uiErrorMessage, type LineA2uiSurface, Session } from '../src/a2ui/index.js';
import { BASIC_CATALOG_ID } from '../src/catalog/index.js';

export type Message = Record<string, unknown>;

export const SURFACE = 'main';

export const message = (body: Message): Message => ({ version: 'v0.9.1', ...body });
export const create = (catalogId: string = BASIC_CATALOG_ID, surfaceId = SURFACE): Message =>
  message({ createSurface: { surfaceId, catalogId } });
export const components = (list: Message[], surfaceId = SURFACE): Message =>
  message({ updateComponents: { surfaceId, components: list } });
export const data = (path: string, value: unknown, surfaceId = SURFACE): Message =>
  message({ updateDataModel: { surfaceId, path, value } });
export const text = (id: string, value: unknown, extra: Message = {}): Message => ({
  id,
  component: 'Text',
  text: value,
  ...extra,
});
export const action = (name: string, context: Message = {}): Message => ({ event: { name, context } });

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const clientToServer = ajv.compile(
  JSON.parse(readFileSync(new URL('./fixtures/a2ui-v0_9_1/client_to_server.json', import.meta.url), 'utf8')) as object,
);

/** Every emitted message that fails `client_to_server.json`, with Ajv's errors; tests expect it empty. */
export const invalidMessages: { message: unknown; errors: unknown }[] = [];

/** Checks one emitted message against `client_to_server.json` and records it when it fails. */
export function checkClientMessage(emitted: unknown): void {
  if (!clientToServer(JSON.parse(JSON.stringify(emitted)))) {
    invalidMessages.push({ message: emitted, errors: clientToServer.errors });
  }
}

export interface Mounted {
  readonly surface: LineA2uiSurface;
  readonly session: Session;
  readonly errors: A2uiErrorMessage[];
  readonly actions: A2uiActionMessage[];
  /** Feeds one batch through the surface and resolves once it settles. */
  feed(...batch: Message[]): Promise<number>;
}

/**
 * Mounts a surface with `attributes` on a fresh session and records what it emits. Every emitted message is
 * checked against `client_to_server.json`.
 */
export function mount(attributes: Record<string, string> = {}): Mounted {
  const session = new Session();
  const surface = document.createElement('line-a2ui-surface');
  surface.setAttribute('surface-id', SURFACE);
  for (const [name, value] of Object.entries(attributes)) surface.setAttribute(name, value);
  const errors: A2uiErrorMessage[] = [];
  const actions: A2uiActionMessage[] = [];
  surface.addEventListener('line-a2ui-error', (event) => {
    const detail = (event as CustomEvent<A2uiErrorMessage>).detail;
    checkClientMessage(detail);
    errors.push(detail);
  });
  surface.addEventListener('line-a2ui-action', (event) => {
    const detail = (event as CustomEvent<A2uiActionMessage>).detail;
    checkClientMessage(detail);
    actions.push(detail);
  });
  document.body.append(surface);
  surface.session = session;
  return { surface, session, errors, actions, feed: (...batch) => surface.feed(batch) };
}

/** Waits for the live region, which writes its text 100 ms after the batch. */
export function liveText(surface: LineA2uiSurface): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(surface.shadowRoot?.querySelector('[role="status"]')?.textContent ?? ''), 150);
  });
}

/** Resolves after pending microtasks and one task, for updates outside a batch. */
export function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20));
}
