import { type AgentCard, type Message, type Part, Role } from '@a2a-js/sdk';
import {
  ClientFactory,
  ClientFactoryOptions,
  DefaultAgentCardResolver,
  JsonRpcTransportFactory,
} from '@a2a-js/sdk/client';
import {
  AgentEvent,
  type AgentExecutor,
  DefaultRequestHandler,
  defaultServerCallContextBuilder,
  InMemoryTaskStore,
  JsonRpcTransportHandler,
  UnauthenticatedUser,
} from '@a2a-js/sdk/server';
import {
  type A2uiMessage,
  BASIC_CATALOG_ID,
  basicShowcase,
  LINE_CATALOG_ID,
  v08Envelope,
} from '../agent-ui/a2ui-fixtures.js';
import { actionNameOf, isErrorMessage, titleUpdate } from './agent-replies.js';
import type { WireDirection } from './recipe-kit.js';

// The A2A recipe's in-memory A2A v1.0 server (Phase 1 spec §6.G.7 "A2A"; §10 SD66; §12 AM-088). The deployed
// Storybook is static, so the recipe's `@a2a-js/sdk` 1.3.0 client gets a `fetchImpl` that answers from the SDK's
// own server stack (`DefaultRequestHandler`, `JsonRpcTransportHandler`) running in the page. Every request and
// response still crosses the JSON-RPC wire as JSON.

/** The A2UI MIME type the A2UI v0.9.1 A2A extension names. */
export const A2UI_MIME = 'application/a2ui+json';

/** The deprecated MIME type the Python reference implementation still sends for v0.8 and v0.9. */
export const LEGACY_A2UI_MIME = 'application/json+a2ui';

/** How the agent packs its A2UI messages: one array per DataPart, or one message per DataPart. */
export type PartShape = 'array' | 'single';

/** The user text that asks for the inbox, and the one that asks for an update in A2UI v0.8. */
export const SHOW_REQUEST = 'Show my inbox';
export const BROKEN_REQUEST = 'Send an update in A2UI v0.8';

const AGENT_URL = 'https://agent.line-ui.invalid/a2a';

const card: AgentCard = {
  name: 'Inbox agent',
  description: 'Answers with an A2UI surface.',
  supportedInterfaces: [{ url: AGENT_URL, protocolBinding: 'JSONRPC', tenant: '', protocolVersion: '1.0' }],
  provider: undefined,
  version: '1.0.0',
  capabilities: {
    streaming: false,
    pushNotifications: false,
    extensions: [
      {
        uri: 'https://a2ui.org/a2a-extension/a2ui/v0.9.1',
        description: 'A2UI surfaces in DataParts',
        required: false,
        params: { supportedCatalogIds: [LINE_CATALOG_ID, BASIC_CATALOG_ID], acceptsInlineCatalogs: false },
      },
    ],
  },
  securitySchemes: {},
  securityRequirements: [],
  defaultInputModes: ['text/plain', A2UI_MIME],
  defaultOutputModes: ['text/plain', A2UI_MIME],
  skills: [],
  signatures: [],
};

/** A DataPart with A2UI `data` and the MIME type in the part `metadata`. */
const dataPart = (data: unknown, mimeType: string): Part => ({
  content: { $case: 'data', value: data },
  metadata: { mimeType },
  filename: '',
  mediaType: '',
});

const textPart = (text: string): Part => ({
  content: { $case: 'text', value: text },
  metadata: undefined,
  filename: '',
  mediaType: '',
});

/** A message with the A2UI capabilities in its metadata (A2UI v0.9.1 A2A extension). */
export function userMessage(parts: Part[], capabilities: unknown, contextId = ''): Message {
  return {
    messageId: crypto.randomUUID(),
    contextId,
    taskId: '',
    role: Role.ROLE_USER,
    parts,
    metadata: { a2uiClientCapabilities: capabilities },
    extensions: [],
    referenceTaskIds: [],
  };
}

/** The A2UI message the client sends, as the `[message]` array of an `application/a2ui+json` DataPart. */
export const a2uiPart = (message: unknown): Part => dataPart([message], A2UI_MIME);

/** The text of a user request. */
export const requestPart = (text: string): Part => textPart(text);

/** The A2UI messages of the parts that carry them: an array or a single message per DataPart, either MIME type. */
export function a2uiMessagesOf(parts: readonly Part[]): unknown[] {
  return parts.flatMap((part) => {
    const mimeType = part.metadata?.mimeType;
    if (part.content?.$case !== 'data' || (mimeType !== A2UI_MIME && mimeType !== LEGACY_A2UI_MIME)) return [];
    const { value } = part.content;
    return Array.isArray(value) ? value : [value];
  });
}

/** The A2UI messages an agent packs into parts: one array part, or one part per message as the Python agents do. */
function pack(messages: readonly A2uiMessage[], shape: PartShape): Part[] {
  if (shape === 'array') return [dataPart(messages, A2UI_MIME)];
  return messages.map((message) => dataPart({ ...message, version: 'v0.9' }, LEGACY_A2UI_MIME));
}

/** What the agent answers to one user message. */
function answer(request: Message, shape: PartShape): Part[] {
  const [incoming] = a2uiMessagesOf(request.parts);
  const actionName = actionNameOf(incoming);
  if (actionName !== undefined) return pack([titleUpdate(actionName)], shape);
  if (isErrorMessage(incoming)) return [textPart('Error noted.')];
  const text = request.parts.find((part) => part.content?.$case === 'text')?.content?.value;
  if (text === BROKEN_REQUEST) return [dataPart([v08Envelope], A2UI_MIME)];
  return pack(basicShowcase, shape);
}

/** Options of {@link connectAgent}. */
export interface AgentOptions {
  readonly shape: PartShape;
  /** Sees each frame on the wire: the JSON-RPC request body out, the response body in. */
  readonly onWire: (direction: WireDirection, channel: string, payload: unknown) => void;
}

/**
 * Starts the in-memory agent and returns an `@a2a-js/sdk` client connected to it through `fetchImpl`.
 *
 * @param options The part shape the agent answers in and the wire observer.
 */
export async function connectAgent({ shape, onWire }: AgentOptions) {
  const executor: AgentExecutor = {
    async execute(context, bus) {
      bus.publish(
        AgentEvent.message({
          messageId: crypto.randomUUID(),
          contextId: context.contextId,
          taskId: '',
          role: Role.ROLE_AGENT,
          parts: answer(context.userMessage, shape),
          metadata: undefined,
          extensions: [],
          referenceTaskIds: [],
        }),
      );
      bus.finished();
    },
    async cancelTask() {},
  };
  const rpc = new JsonRpcTransportHandler(new DefaultRequestHandler(card, new InMemoryTaskStore(), executor));

  const fetchImpl: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname.endsWith('/agent-card.json')) return Response.json(card);
    const body = JSON.parse(String(init?.body));
    onWire('out', `JSON-RPC ${body.method}`, body);
    const headers = new Headers(init?.headers);
    const version = headers.get('A2A-Version');
    const context = defaultServerCallContextBuilder({
      extensions: undefined,
      user: new UnauthenticatedUser(),
      headers: Object.fromEntries(headers),
      ...(version ? { requestedVersion: version } : {}),
    });
    const result = await rpc.handle(body, context);
    onWire('in', `JSON-RPC ${body.method} result`, result);
    return Response.json(result);
  };

  const factory = new ClientFactory(
    ClientFactoryOptions.createFrom(ClientFactoryOptions.default, {
      transports: [new JsonRpcTransportFactory({ fetchImpl })],
      cardResolver: new DefaultAgentCardResolver({ fetchImpl }),
    }),
  );
  return factory.createFromUrl(AGENT_URL);
}
