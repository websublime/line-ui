import type { Part } from '@a2a-js/sdk';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import {
  a2uiMessagesOf,
  a2uiPart,
  BROKEN_REQUEST,
  connectAgent,
  type PartShape,
  requestPart,
  SHOW_REQUEST,
  userMessage,
} from './a2a-agent.js';
import { createRecipe, RECIPE_CAPABILITIES } from './recipe-kit.js';

// The A2A recipe (Phase 1 spec §6.G.7 "A2A"; §10 SD66; §12 AM-041, AM-088). An `@a2a-js/sdk` 1.3.0 client speaks
// A2A v1.0 JSON-RPC to an in-memory agent. The recipe renders the A2UI messages of every DataPart whose `metadata`
// names `application/a2ui+json` or `application/json+a2ui`, an array or a single message per part, and sends a
// Button action as `[action]` and `line-a2ui-error` as `[error]` in an `application/a2ui+json` DataPart, with the
// capabilities in the message metadata.

interface A2aArgs {
  /** How the agent packs its A2UI messages. */
  shape: PartShape;
}

function render({ shape }: A2aArgs): HTMLElement {
  const recipe = createRecipe('A2A');
  const { surface } = recipe;
  let contextId = '';

  const client = connectAgent({ shape, onWire: recipe.log });

  /** Sends one user message and renders the A2UI messages of the reply as one batch. */
  const send = async (parts: Part[]) => {
    const reply = await (await client).sendMessage({
      tenant: '',
      message: userMessage(parts, RECIPE_CAPABILITIES, contextId),
      configuration: undefined,
      metadata: undefined,
    });
    contextId = reply.contextId;
    const replyParts = 'parts' in reply ? reply.parts : (reply.status?.message?.parts ?? []);
    const messages = a2uiMessagesOf(replyParts);
    if (messages.length > 0) await surface.feed(messages);
  };

  recipe.onAction((message) => void send([a2uiPart(message)]));
  recipe.onError((message) => void send([a2uiPart(message)]));
  recipe.control('Ask for an A2UI v0.8 update', () => void send([requestPart(BROKEN_REQUEST)]));

  void send([requestPart(SHOW_REQUEST)]);
  return recipe.root;
}

const meta = {
  title: 'Recipes/A2A',
  args: { shape: 'array' },
  argTypes: { shape: { control: 'inline-radio', options: ['array', 'single'] } },
  render,
} satisfies Meta<A2aArgs>;

export default meta;

type Story = StoryObj<A2aArgs>;

export const ArrayDataPart: Story = { name: 'Array DataPart' };

export const SingleMessageDataParts: Story = { name: 'Single-message DataParts', args: { shape: 'single' } };
