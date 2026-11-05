/**
 * The AG-UI recipe's mock producer against the pinned `@ag-ui/a2ui-middleware` (Phase 1 spec §6.G.7 "AG-UI";
 * §10 SD43, SD64; §12 AM-007, AM-017; ledger 01-G7).
 *
 * - Probe P5 again on 0.0.13 (R6 §3 P5): an `AbstractAgent` stub streams a `render_a2ui` tool call, wrapped by
 *   `new A2UIMiddleware({ injectA2UITool: true })` and run with `forwardedProps.a2uiAction.userAction`. The
 *   middleware injects the `render_a2ui` tool, turns the action into a `log_a2ui_event` tool call and result,
 *   and falls back to `…/v0_9/basic_catalog.json` when no catalog is configured.
 * - The middleware, configured as the MDX server convention says (`defaultCatalogId` set to the A2UI basic id),
 *   emits the mock's `building` → operations sequence for the same arguments. The `progressTokens` refreshes in
 *   between only repeat the `building` state. The `retrying` and `failed` fixtures are outside the comparison.
 *
 * @module apps/storybook/__tests__/ag-ui-middleware
 */

import { describe, expect, test } from 'bun:test';
import { A2UIMiddleware, type A2UIMiddlewareConfig } from '@ag-ui/a2ui-middleware';
import middlewareManifest from '@ag-ui/a2ui-middleware/package.json' with { type: 'json' };
import { AbstractAgent, type BaseEvent, EventType, type RunAgentInput } from '@ag-ui/client';
import { Observable } from 'rxjs';
import { BASIC_CATALOG_ID } from '../stories/agent-ui/a2ui-fixtures.js';
import {
  ACTIVITY_TYPE,
  BUILDING_SEQUENCE,
  MESSAGE_ID,
  MIDDLEWARE_VERSION,
  OPERATIONS_KEY,
  RENDER_ARGS,
  TOOL_CALL_ID,
} from '../stories/recipes/ag-ui-fixtures.js';

/** The streamed `render_a2ui` arguments, cut into model-sized deltas. */
const ARGS_JSON = JSON.stringify(RENDER_ARGS);
const DELTA_SIZE = 8;

const USER_ACTION = {
  name: 'save',
  surfaceId: RENDER_ARGS.surfaceId,
  sourceComponentId: 'save',
  timestamp: '2026-11-05T00:00:00.000Z',
  context: { title: 'Inbox' },
};

/** An agent that answers every run with one streamed `render_a2ui` call, and keeps the input it was given. */
class RenderStub extends AbstractAgent {
  input: RunAgentInput | undefined;

  run(input: RunAgentInput): Observable<BaseEvent> {
    this.input = input;
    const { threadId, runId } = input;
    return new Observable<BaseEvent>((subscriber) => {
      const emit = (event: Record<string, unknown>) => subscriber.next(event as BaseEvent);
      emit({ type: EventType.RUN_STARTED, threadId, runId });
      emit({
        type: EventType.TOOL_CALL_START,
        toolCallId: TOOL_CALL_ID,
        toolCallName: 'render_a2ui',
        parentMessageId: 'm1',
      });
      for (let at = 0; at < ARGS_JSON.length; at += DELTA_SIZE) {
        emit({ type: EventType.TOOL_CALL_ARGS, toolCallId: TOOL_CALL_ID, delta: ARGS_JSON.slice(at, at + DELTA_SIZE) });
      }
      emit({ type: EventType.TOOL_CALL_END, toolCallId: TOOL_CALL_ID });
      emit({ type: EventType.RUN_FINISHED, threadId, runId });
      subscriber.complete();
    });
  }
}

/** Runs the stub behind the middleware and returns the stub and every event the subscriber saw. */
async function runMiddleware(config: A2UIMiddlewareConfig, forwardedProps?: Record<string, unknown>) {
  const agent = new RenderStub({ threadId: 'thread-1' });
  agent.use(new A2UIMiddleware(config));
  const events: BaseEvent[] = [];
  await agent.runAgent(
    { runId: 'run-1', ...(forwardedProps ? { forwardedProps } : {}) },
    { onEvent: ({ event }) => void events.push(event) },
  );
  const snapshots = events
    .filter((event) => event.type === EventType.ACTIVITY_SNAPSHOT)
    .map((event) => JSON.parse(JSON.stringify(event)) as Record<string, unknown>);
  return { agent, snapshots };
}

/** Whether a snapshot is a `progressTokens` refresh of the `building` state. */
const isProgress = ({ content }: Record<string, unknown>): boolean =>
  typeof content === 'object' && content !== null && 'progressTokens' in content;

describe(`@ag-ui/a2ui-middleware ${MIDDLEWARE_VERSION} (R6 probe P5)`, () => {
  test('the installed middleware is the pinned version', () => {
    expect(middlewareManifest.version).toBe(MIDDLEWARE_VERSION);
  });

  test('injects render_a2ui and turns forwardedProps.a2uiAction into a log_a2ui_event call and result', async () => {
    const { agent } = await runMiddleware({ injectA2UITool: true }, { a2uiAction: { userAction: USER_ACTION } });
    expect(agent.input?.tools.map((tool) => tool.name)).toEqual(['render_a2ui']);
    const [call, result] = (agent.input?.messages ?? []).slice(-2);
    expect(call?.role).toBe('assistant');
    expect(call && 'toolCalls' in call ? call.toolCalls?.map((toolCall) => toolCall.function.name) : []).toEqual([
      'log_a2ui_event',
    ]);
    expect(call && 'toolCalls' in call ? JSON.parse(call.toolCalls?.[0]?.function.arguments ?? '') : {}).toEqual(
      USER_ACTION,
    );
    expect(result?.role).toBe('tool');
    expect(result?.content).toBe(
      'User performed action "save" on surface "main" (component: save). Context: {"title":"Inbox"}',
    );
  });

  test('without defaultCatalogId the surface names the middleware fallback, not the A2UI basic id (SD43)', async () => {
    const { snapshots } = await runMiddleware({ injectA2UITool: true });
    // The last snapshot is the painted surface; its first operation is createSurface.
    const painted = snapshots.at(-1) as { content: Record<string, { createSurface?: { catalogId?: string } }[]> };
    const catalogId = painted.content[OPERATIONS_KEY]?.[0]?.createSurface?.catalogId;
    expect(catalogId).toBe('https://a2ui.org/specification/v0_9/basic_catalog.json');
    expect(catalogId).not.toBe(BASIC_CATALOG_ID);
  });
});

describe('the mock producer mirrors the middleware (§10 SD64)', () => {
  test('the middleware emits the mock building → operations sequence for the same render_a2ui arguments', async () => {
    const { snapshots } = await runMiddleware({ injectA2UITool: true, defaultCatalogId: BASIC_CATALOG_ID });

    const progress = snapshots.filter(isProgress);
    expect(progress.length).toBeGreaterThan(0);
    for (const refresh of progress) {
      expect(refresh).toEqual({
        type: 'ACTIVITY_SNAPSHOT',
        messageId: MESSAGE_ID,
        activityType: ACTIVITY_TYPE,
        content: { status: 'building', progressTokens: expect.any(Number) },
        replace: true,
      });
    }
    // Each refresh sits between the first building snapshot and the first operations snapshot.
    const firstOperations = snapshots.findIndex((snapshot) => OPERATIONS_KEY in (snapshot.content as object));
    expect(snapshots.findLastIndex(isProgress)).toBeLessThan(firstOperations);
    expect(snapshots.findIndex(isProgress)).toBeGreaterThan(0);

    expect(snapshots.filter((snapshot) => !isProgress(snapshot))).toEqual(
      JSON.parse(JSON.stringify(BUILDING_SEQUENCE)),
    );
  });
});
