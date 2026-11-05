import { type A2uiMessage, SURFACE_ID, showcaseData } from '../agent-ui/a2ui-fixtures.js';

// What the in-memory A2A and MCP agents answer to the A2UI messages a recipe sends (Phase 1 spec §6.G.7). The SSE
// recipe's Service Worker, a plain script under public/, keeps its own copy of the same answers.

/** The `name` of an A2UI `action` message, or `undefined` when `message` is not one. */
export function actionNameOf(message: unknown): string | undefined {
  if (typeof message !== 'object' || message === null || !('action' in message)) return undefined;
  const { action } = message;
  if (typeof action !== 'object' || action === null || !('name' in action)) return undefined;
  return String(action.name);
}

/** Whether `message` is an A2UI `error` message. */
export const isErrorMessage = (message: unknown): boolean =>
  typeof message === 'object' && message !== null && 'error' in message;

/** The agent's answer to an action: the surface title names the action it received. */
export const titleUpdate = (actionName: string): A2uiMessage => ({
  version: 'v0.9.1',
  updateDataModel: { surfaceId: SURFACE_ID, path: '/title', value: `${showcaseData.title}: ${actionName} received` },
});
