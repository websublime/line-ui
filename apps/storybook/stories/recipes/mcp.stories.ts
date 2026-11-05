import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { connectServer, SHOW_TOOL } from './mcp-server.js';
import { createRecipe, RECIPE_CAPABILITIES } from './recipe-kit.js';

// The MCP recipe (Phase 1 spec §6.G.7 "MCP"; §10 SD67; §12 AM-088). The recipe calls a tool, renders the A2UI
// messages of the tool result's `application/a2ui+json` EmbeddedResource, and sends a Button action as a `tools/call`
// of `a2ui_action` and `line-a2ui-error` as a `tools/call` of `a2ui_error`, with the capabilities in `_meta.a2ui`.

function render(): HTMLElement {
  const recipe = createRecipe('MCP');
  const { surface } = recipe;
  const client = connectServer(RECIPE_CAPABILITIES, recipe.log);

  /** Calls one tool and renders the A2UI messages of its result as one batch. */
  const call = async (name: string, args: Record<string, unknown>) => {
    const messages = await client.callTool(name, args);
    if (messages.length > 0) await surface.feed(messages);
  };

  // The `action` and `error` bodies travel as the tool arguments.
  recipe.onAction((message) => void call('a2ui_action', { ...message.action }));
  recipe.onError((message) => void call('a2ui_error', { ...message.error }));
  recipe.control('Ask for an A2UI v0.8 update', () => void call(SHOW_TOOL, { protocol: 'v0.8' }));

  void call(SHOW_TOOL, {});
  return recipe.root;
}

const meta = { title: 'Recipes/MCP', render } satisfies Meta;

export default meta;

export const ToolResult: StoryObj = { name: 'Tool result' };
