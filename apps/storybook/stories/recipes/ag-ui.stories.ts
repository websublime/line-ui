import type { AgentSubscriber } from '@ag-ui/client';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { ACTIVITY_TYPE, OPERATIONS_KEY } from './ag-ui-fixtures.js';
import { BROKEN_REQUEST, type Gate, MockA2uiAgent, type Scenario } from './ag-ui-producer.js';
import { createRecipe, type Recipe } from './recipe-kit.js';

// The AG-UI recipe (Phase 1 spec §6.G.7 "AG-UI" and "AG-UI lifecycle mapping"; §10 SD43, SD59, SD64, SD65).
// `@ag-ui/client` runs the in-browser mock producer; the recipe renders each `a2ui-surface` activity snapshot,
// maps its `status`, sends a Button action as `forwardedProps.a2uiAction` on the next run, and logs
// `line-a2ui-error` locally, because AG-UI and the middleware define no error channel.

interface AgUiArgs {
  /** The lifecycle the first run plays. */
  scenario: Scenario;
  /** `auto` plays a snapshot every `pace` ms; `manual` adds a "Next event" button that releases one. */
  step: 'auto' | 'manual';
  pace: number;
}

// tsconfig.base.json targets a lib without `Promise.withResolvers` (ES2024), so the gates use the executor form.

/** A gate that opens after `pace` ms. */
function timedGate(pace: number): Gate {
  return () => new Promise((resolve) => setTimeout(resolve, pace));
}

/** A gate that opens on each click of a recipe-owned "Next event" button; an early click is kept. */
function buttonGate(recipe: Recipe): Gate {
  const waiting: (() => void)[] = [];
  let credit = 0;
  recipe.control('Next event', () => {
    const next = waiting.shift();
    if (next) next();
    else credit++;
  });
  return () => {
    if (credit > 0) {
      credit--;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => waiting.push(resolve));
  };
}

/** The status line text of a `building` or `retrying` snapshot. */
function statusText(content: Record<string, unknown>): string {
  if (content.status === 'retrying') {
    return `Retrying the interface (attempt ${content.attempt} of ${content.maxAttempts})…`;
  }
  const tokens = typeof content.progressTokens === 'number' ? ` (about ${content.progressTokens} tokens)` : '';
  return `Building the interface${tokens}…`;
}

function render({ scenario, step, pace }: AgUiArgs): HTMLElement {
  const recipe = createRecipe('AG-UI');
  const { surface, status } = recipe;
  const gate = step === 'manual' ? buttonGate(recipe) : timedGate(pace);
  const agent = new MockA2uiAgent({
    scenario,
    gate,
    onInput: (input) => recipe.log('in', 'agent: RunAgentInput.forwardedProps', input.forwardedProps ?? {}),
  });

  // Every snapshot repeats `createSurface`; the renderer drops it once the surface exists, as the middleware's
  // own client does.
  const created = new Set<string>();
  const isRepeatedCreate = (operation: unknown): boolean => {
    if (typeof operation !== 'object' || operation === null || !('createSurface' in operation)) return false;
    const { createSurface } = operation;
    const surfaceId =
      typeof createSurface === 'object' && createSurface !== null && 'surfaceId' in createSurface
        ? String(createSurface.surfaceId)
        : '';
    if (created.has(surfaceId)) return true;
    created.add(surfaceId);
    return false;
  };

  const subscriber: AgentSubscriber = {
    onActivitySnapshotEvent: ({ event }) => {
      if (event.activityType !== ACTIVITY_TYPE) return;
      const { content } = event;
      const operations = content[OPERATIONS_KEY];
      if (Array.isArray(operations)) {
        // The next operations snapshot clears the status line and `inert`; the surface owns `aria-busy`.
        status.hidden = true;
        status.textContent = '';
        surface.inert = false;
        recipe.log('in', 'ACTIVITY_SNAPSHOT a2ui_operations', operations);
        void surface.feed(operations.filter((operation) => !isRepeatedCreate(operation)));
      } else if (content.status === 'building' || content.status === 'retrying') {
        recipe.log('in', `ACTIVITY_SNAPSHOT status: ${content.status}`, content);
        status.textContent = statusText(content);
        status.hidden = false;
      } else if (content.status === 'failed') {
        recipe.log('in', 'ACTIVITY_SNAPSHOT status: failed', content);
        status.hidden = true;
        status.textContent = '';
        surface.inert = true;
      }
    },
  };

  /** Starts a run; a consumer strips activity messages from the history it sends back (AG-UI 1.0). */
  const runAgent = (forwardedProps?: Record<string, unknown>) => {
    agent.setMessages(agent.messages.filter((message) => message.role !== 'activity'));
    void agent.runAgent(forwardedProps ? { forwardedProps } : {}, subscriber);
  };

  recipe.onAction((message) => {
    const forwardedProps = { a2uiAction: { userAction: message.action } };
    recipe.log('out', 'action: forwardedProps.a2uiAction', forwardedProps);
    runAgent(forwardedProps);
  });
  recipe.onError((message) => {
    // AG-UI and @ag-ui/a2ui-middleware define no error channel: log it here and send nothing (SD65).
    console.info('[AG-UI recipe] line-a2ui-error kept local; AG-UI has no error channel.', message);
    recipe.log('local', 'error: kept local (AG-UI has no error channel)', message);
  });
  recipe.control('Ask for an A2UI v0.8 update', () => {
    agent.addMessage({ id: crypto.randomUUID(), role: 'user', content: BROKEN_REQUEST });
    runAgent();
  });

  runAgent();
  return recipe.root;
}

const meta = {
  title: 'Recipes/AG-UI',
  args: { scenario: 'building', step: 'auto', pace: 800 },
  argTypes: {
    scenario: { control: 'inline-radio', options: ['building', 'retrying', 'failed'] },
    step: { control: 'inline-radio', options: ['auto', 'manual'] },
    pace: { control: { type: 'number', min: 0, step: 100 } },
  },
  render,
} satisfies Meta<AgUiArgs>;

export default meta;

type Story = StoryObj<AgUiArgs>;

export const Building: Story = {};

export const Retrying: Story = { args: { scenario: 'retrying' } };

export const Failed: Story = { args: { scenario: 'failed' } };
