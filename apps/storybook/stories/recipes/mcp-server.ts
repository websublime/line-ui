import { basicShowcase, v08Envelope } from '../agent-ui/a2ui-fixtures.js';
import { actionNameOf, titleUpdate } from './agent-replies.js';
import type { WireDirection } from './recipe-kit.js';

// The MCP recipe's in-memory exchange (Phase 1 spec §6.G.7 "MCP"; §10 SD67; §12 AM-088). The client and the server
// pass JSON-RPC 2.0 requests and responses to each other as JSON text, in the page, with no MCP SDK. The server's
// tool results carry A2UI only as an `EmbeddedResource` with `application/a2ui+json`; the client sends actions and
// errors as `tools/call` of `a2ui_action` and `a2ui_error`, with the capabilities in `_meta.a2ui` on every call.

/** The A2UI MIME type of an `EmbeddedResource`. */
export const A2UI_MIME = 'application/a2ui+json';

/** The tool that renders the inbox; `{ protocol: 'v0.8' }` asks for an update in A2UI v0.8. */
export const SHOW_TOOL = 'show_inbox';

interface JsonRpcRequest {
  readonly jsonrpc: '2.0';
  readonly id: number;
  readonly method: string;
  readonly params?: Record<string, unknown>;
}

/** A content item of a tool result. */
type Content =
  | { readonly type: 'text'; readonly text: string }
  | {
      readonly type: 'resource';
      readonly resource: { readonly uri: string; readonly mimeType: string; readonly text: string };
      readonly annotations?: { readonly audience: readonly string[] };
    };

/** A tool result: a text fallback for hosts that do not render A2UI, and the A2UI messages as a resource. */
const a2uiResult = (text: string, messages: readonly unknown[]): { content: Content[] } => ({
  content: [
    { type: 'text', text },
    {
      type: 'resource',
      resource: { uri: 'a2ui://inbox/surface', mimeType: A2UI_MIME, text: JSON.stringify(messages) },
      annotations: { audience: ['user'] },
    },
  ],
});

/** The server: answers `tools/call` of the inbox tool, `a2ui_action` and `a2ui_error`. */
function serve(request: JsonRpcRequest): Record<string, unknown> {
  const reply = (result: unknown) => ({ jsonrpc: '2.0', id: request.id, result });
  if (request.method !== 'tools/call') {
    return { jsonrpc: '2.0', id: request.id, error: { code: -32601, message: `Method not found: ${request.method}` } };
  }
  const name = request.params?.name;
  const args = request.params?.arguments;
  if (name === SHOW_TOOL) {
    const legacy = typeof args === 'object' && args !== null && 'protocol' in args && args.protocol === 'v0.8';
    return reply(legacy ? a2uiResult('An inbox update.', [v08Envelope]) : a2uiResult('Your inbox.', basicShowcase));
  }
  if (name === 'a2ui_action') {
    const actionName = actionNameOf({ action: args }) ?? 'unknown';
    return reply(a2uiResult(`Action ${actionName} received.`, [titleUpdate(actionName)]));
  }
  if (name === 'a2ui_error') return reply({ content: [{ type: 'text', text: 'Error noted.' }] });
  return reply({ content: [{ type: 'text', text: `Unknown tool: ${String(name)}` }], isError: true });
}

/** A client of the in-memory server that sends A2UI capabilities in `_meta.a2ui` on each tool call. */
export interface McpClient {
  /** Calls a tool and returns the A2UI messages of the result's `application/a2ui+json` resources. */
  callTool(name: string, args: Record<string, unknown>): Promise<unknown[]>;
}

/**
 * Connects a client to a new in-memory server.
 *
 * @param capabilities The A2UI client capabilities, sent in `_meta.a2ui.clientCapabilities` on every call.
 * @param onWire Sees each JSON-RPC frame: the request out, the response in.
 */
export function connectServer(
  capabilities: unknown,
  onWire: (direction: WireDirection, channel: string, payload: unknown) => void,
): McpClient {
  let nextId = 1;
  return {
    async callTool(name, args) {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: nextId++,
        method: 'tools/call',
        params: { name, arguments: args, _meta: { a2ui: { clientCapabilities: capabilities } } },
      };
      onWire('out', `tools/call ${name}`, request);
      const response = JSON.parse(JSON.stringify(serve(JSON.parse(JSON.stringify(request)))));
      onWire('in', `tools/call ${name} result`, response);
      if (response.error) throw new Error(`[MCP recipe] ${response.error.message}`);
      const content: Content[] = response.result?.content ?? [];
      // A2UI arrives only as an EmbeddedResource with the A2UI MIME type; the text fallback is for other hosts.
      return content.flatMap((item) => {
        if (item.type !== 'resource' || item.resource.mimeType !== A2UI_MIME) return [];
        const payload: unknown = JSON.parse(item.resource.text);
        return Array.isArray(payload) ? payload : [payload];
      });
    },
  };
}
