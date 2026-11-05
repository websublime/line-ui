import { AbstractAgent, type AgentConfig, type BaseEvent, EventType, type RunAgentInput } from '@ag-ui/client';
import { Observable } from 'rxjs';
import {
  type A2uiActivitySnapshot,
  actionSequence,
  BROKEN_SEQUENCE,
  BUILDING_SEQUENCE,
  FAILED_SEQUENCE,
  RETRYING_SEQUENCE,
} from './ag-ui-fixtures.js';

// The AG-UI recipe's in-browser producer (Phase 1 spec §6.G.7 "AG-UI"; §10 SD64). `@ag-ui/a2ui-middleware` is
// server code that does not run fully in a browser (R6 §2.1), so the deployed story runs this `AbstractAgent`
// instead. It emits the activity snapshots the middleware emits for one `render_a2ui` call (`ag-ui-fixtures.ts`)
// and answers `forwardedProps.a2uiAction`.

/** The lifecycle the first run plays: a clean build, a rejected first attempt, or a failed generation. */
export type Scenario = 'building' | 'retrying' | 'failed';

/** Resolves when the producer may emit its next snapshot. */
export type Gate = () => Promise<void>;

/** The user message that asks the producer for a render the surface rejects. */
export const BROKEN_REQUEST = 'Send an update in A2UI v0.8';

const FIRST_RUN: Readonly<Record<Scenario, readonly A2uiActivitySnapshot[]>> = {
  building: BUILDING_SEQUENCE,
  retrying: RETRYING_SEQUENCE,
  failed: FAILED_SEQUENCE,
};

/** Options of {@link MockA2uiAgent}. */
export interface MockA2uiAgentOptions extends AgentConfig {
  readonly scenario: Scenario;
  readonly gate: Gate;
  /** Sees each run's input as the producer receives it. */
  readonly onInput?: (input: RunAgentInput) => void;
}

/** The user action a run carries in `forwardedProps.a2uiAction.userAction`, if any. */
function userActionOf(input: RunAgentInput): Record<string, unknown> | undefined {
  const props: unknown = input.forwardedProps;
  if (typeof props !== 'object' || props === null || !('a2uiAction' in props)) return undefined;
  const { a2uiAction } = props;
  if (typeof a2uiAction !== 'object' || a2uiAction === null || !('userAction' in a2uiAction)) return undefined;
  const { userAction } = a2uiAction;
  return typeof userAction === 'object' && userAction !== null ? { ...userAction } : undefined;
}

/** An AG-UI agent that plays the middleware's activity snapshots, one per gate. */
export class MockA2uiAgent extends AbstractAgent {
  readonly #options: MockA2uiAgentOptions;
  #runs = 0;

  constructor(options: MockA2uiAgentOptions) {
    super(options);
    this.#options = options;
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    this.#options.onInput?.(input);
    const sequence = this.#sequenceFor(input);
    const { threadId, runId } = input;
    return new Observable<BaseEvent>((subscriber) => {
      let open = true;
      const emit = (event: Record<string, unknown>) => subscriber.next(event as BaseEvent);
      (async () => {
        emit({ type: EventType.RUN_STARTED, threadId, runId });
        for (const snapshot of sequence) {
          await this.#options.gate();
          if (!open) return;
          emit({ ...snapshot });
        }
        emit({ type: EventType.RUN_FINISHED, threadId, runId });
        subscriber.complete();
      })().catch((error: unknown) => subscriber.error(error));
      return () => {
        open = false;
      };
    });
  }

  #sequenceFor(input: RunAgentInput): readonly A2uiActivitySnapshot[] {
    const first = this.#runs++ === 0;
    const action = userActionOf(input);
    if (action) return actionSequence(String(action.name));
    const last = input.messages.at(-1);
    if (last?.role === 'user' && last.content === BROKEN_REQUEST) return BROKEN_SEQUENCE;
    return first ? FIRST_RUN[this.#options.scenario] : BUILDING_SEQUENCE;
  }
}
