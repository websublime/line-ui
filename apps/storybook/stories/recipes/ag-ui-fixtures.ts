import {
  type A2uiMessage,
  BASIC_CATALOG_ID,
  SURFACE_ID,
  showcaseComponents,
  showcaseData,
  v08Envelope,
} from '../agent-ui/a2ui-fixtures.js';

// What the AG-UI recipe's mock producer emits (Phase 1 spec §6.G.7 "AG-UI"; §10 SD64). Each sequence mirrors the
// `ACTIVITY_SNAPSHOT` content that `@ag-ui/a2ui-middleware` 0.0.13 emits for one `render_a2ui` tool call, on one
// `messageId` with `replace: true` (R6 §2.1, probe P5). `__tests__/ag-ui-middleware.test.ts` runs the pinned
// middleware on RENDER_ARGS and compares its output with BUILDING_SEQUENCE. The retrying and failed sequences
// follow the middleware's type declarations and source; no probe observed a snapshot after `failed` (§12 AM-007).
// Pure data: the Bun test imports this module, so it imports no browser-only code.

/** The pinned middleware version this module mirrors; the MDX server convention names the same version. */
export const MIDDLEWARE_VERSION = '0.0.13';

/** The AG-UI activity type of an A2UI surface (`A2UIActivityType` in the middleware). */
export const ACTIVITY_TYPE = 'a2ui-surface';

/** The content key of the A2UI operations (`A2UI_OPERATIONS_KEY` in the middleware). */
export const OPERATIONS_KEY = 'a2ui_operations';

/** The `render_a2ui` tool call the producer answers, and the `messageId` every snapshot of it carries. */
export const TOOL_CALL_ID = 'call-inbox';
export const MESSAGE_ID = `a2ui-surface-${TOOL_CALL_ID}`;

/** The retry cap the middleware shows (`MAX_A2UI_ATTEMPTS` of `@ag-ui/a2ui-toolkit` 0.0.5). */
export const MAX_ATTEMPTS = 3;

/** The `render_a2ui` arguments the agent streams: a surface id, the C1–C4 component list and the data model. */
export const RENDER_ARGS = { surfaceId: SURFACE_ID, components: showcaseComponents, data: showcaseData };

/** The content of one `a2ui-surface` activity snapshot. */
export type ActivityContent = Record<string, unknown>;

/** One `ACTIVITY_SNAPSHOT` event as the middleware emits it. */
export interface A2uiActivitySnapshot {
  readonly type: 'ACTIVITY_SNAPSHOT';
  readonly messageId: string;
  readonly activityType: typeof ACTIVITY_TYPE;
  readonly content: ActivityContent;
  readonly replace: true;
}

const snapshot = (content: ActivityContent): A2uiActivitySnapshot => ({
  type: 'ACTIVITY_SNAPSHOT',
  messageId: MESSAGE_ID,
  activityType: ACTIVITY_TYPE,
  content,
  replace: true,
});

// The middleware writes every operation as `v0.9` and the recipe server sets `defaultCatalogId` to the basic id
// (§10 SD43); the middleware's own fallback, `…/v0_9/basic_catalog.json`, is not the basic id (R6 §2.1).
const op = (body: A2uiMessage): A2uiMessage => ({ version: 'v0.9', ...body });
const createSurface = op({ createSurface: { surfaceId: SURFACE_ID, catalogId: BASIC_CATALOG_ID } });
const updateComponents = op({ updateComponents: { surfaceId: SURFACE_ID, components: showcaseComponents } });
const updateDataModel = (value: unknown) => op({ updateDataModel: { surfaceId: SURFACE_ID, path: '/', value } });

/** The first lifecycle snapshot of a render. */
export const building = snapshot({ status: 'building' });

/** The snapshot the middleware paints once the component array closes: the surface and its components. */
export const painted = snapshot({ [OPERATIONS_KEY]: [createSurface, updateComponents] });

/** The snapshot the middleware emits once the `data` object closes: every operation again, with the data model. */
export const withData = (value: unknown = showcaseData) =>
  snapshot({ [OPERATIONS_KEY]: [createSurface, updateComponents, updateDataModel(value)] });

/**
 * The observed sequence (R6 §2.1, probe P5): `building`, then the operations. The middleware also refreshes
 * `building` with a `progressTokens` estimate while the arguments stream; the mock leaves those out, and the Bun
 * test checks that each one only repeats the `building` state.
 */
export const BUILDING_SEQUENCE: readonly A2uiActivitySnapshot[] = [building, painted, withData()];

/** A first attempt the middleware rejected, then a valid second attempt. */
export const RETRYING_SEQUENCE: readonly A2uiActivitySnapshot[] = [
  building,
  snapshot({
    status: 'retrying',
    attempt: 2,
    maxAttempts: MAX_ATTEMPTS,
    errors: [{ code: 'no_root', path: 'components', message: 'No component has id "root".' }],
  }),
  painted,
  withData(),
];

/** Every attempt failed; the agent then renders again, and the next operations snapshot replaces the failure. */
export const FAILED_SEQUENCE: readonly A2uiActivitySnapshot[] = [
  building,
  snapshot({
    status: 'failed',
    error: 'A2UI generation failed',
    attempts: [1, 2, 3].map((attempt) => ({
      attempt,
      ok: false,
      errors: [{ code: 'no_root', path: 'components', message: 'No component has id "root".' }],
    })),
    maxAttempts: MAX_ATTEMPTS,
  }),
  painted,
  withData(),
];

/** The render after an action: the producer answers `forwardedProps.a2uiAction` with a new title. */
export const actionSequence = (actionName: string): readonly A2uiActivitySnapshot[] => [
  building,
  painted,
  withData({ title: `${showcaseData.title}: ${actionName} received` }),
];

/** A render whose operations hold an A2UI v0.8 envelope, which the surface rejects with `UNSUPPORTED_MESSAGE`. */
export const BROKEN_SEQUENCE: readonly A2uiActivitySnapshot[] = [
  building,
  snapshot({ [OPERATIONS_KEY]: [v08Envelope] }),
];
