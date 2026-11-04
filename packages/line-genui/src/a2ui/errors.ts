/**
 * The A2UI client-to-server messages the surface emits: `error` in its generic form and `action` (Phase 1 spec
 * §6.G.4 Errors; `client_to_server.json`; R2 §2.6; §10 SD55).
 *
 * @module a2ui/errors
 */

/** The A2UI protocol version of every message the surface emits. */
export const A2UI_VERSION = 'v0.9.1';

/**
 * The codes the surface raises itself (§6.G.4 Errors; §10 SD55; §12 AM-040). An error that `web_core` throws or
 * reports keeps its `web_core` 0.14.0 code instead, such as `CATALOG_ERROR` or `UNKNOWN_COMPONENT_TYPE`.
 *
 * - `LIMIT_EXCEEDED`: a message would breach `maxNodes`, `maxDepth` or `maxDataModelSize`, so it was rejected.
 * - `MARKDOWN_RENDER_ERROR`: `markdownRenderer` threw or returned a value that is not a `Node`.
 * - `MISSING_ACCESSIBLE_NAME`: a node whose descriptor requires a name has none.
 * - `UNMAPPED_ICON`: an Icon name is not an own property of `iconMap`, or `iconMap` is unset.
 * - `COMPONENT_LOAD_ERROR`: a descriptor's `load()` rejected, so its component never defines (§12 AM-077).
 * - `UNSUPPORTED_MESSAGE`: a batch element is not an A2UI v0.9 envelope, so it never reached `web_core` (§12 AM-083).
 */
export type SurfaceErrorCode =
  | 'LIMIT_EXCEEDED'
  | 'MARKDOWN_RENDER_ERROR'
  | 'MISSING_ACCESSIBLE_NAME'
  | 'UNMAPPED_ICON'
  | 'COMPONENT_LOAD_ERROR'
  | 'UNSUPPORTED_MESSAGE';

/** The generic A2UI error body: a code that is not `VALIDATION_FAILED`, the surface id, a message and any extras. */
export interface A2uiErrorBody {
  readonly code: string;
  readonly surfaceId: string;
  readonly message: string;
  readonly [key: string]: unknown;
}

/** An A2UI v0.9.1 `error` message in its generic form, the `detail` of `line-a2ui-error`. */
export interface A2uiErrorMessage {
  readonly version: typeof A2UI_VERSION;
  readonly error: A2uiErrorBody;
}

/** An A2UI v0.9.1 `action` message, the `detail` of `line-a2ui-action`. */
export interface A2uiActionMessage {
  readonly version: typeof A2UI_VERSION;
  readonly action: Readonly<Record<string, unknown>>;
}

/**
 * Converts anything `web_core` throws or reports into a generic A2UI `error` message. `web_core` errors carry no
 * wire-level JSON Pointer, so the `VALIDATION_FAILED` form is never produced, and a value without a string code
 * becomes `UNKNOWN_ERROR` (R1 §2.7, §6 Q9).
 *
 * @param err The thrown value or the `web_core` error payload.
 * @param surfaceId The surface the error belongs to.
 * @param extra Extra properties of the error body.
 */
export function toA2uiError(err: unknown, surfaceId: string, extra: Record<string, unknown> = {}): A2uiErrorMessage {
  const source = err !== null && typeof err === 'object' ? (err as Record<string, unknown>) : {};
  const code = typeof source.code === 'string' && source.code !== 'VALIDATION_FAILED' ? source.code : 'UNKNOWN_ERROR';
  const message = typeof source.message === 'string' ? source.message : String(err);
  return { version: A2UI_VERSION, error: { ...extra, code, surfaceId, message } };
}

/**
 * Builds an error the surface raises itself.
 *
 * @param code The surface's own code.
 * @param surfaceId The surface the error belongs to.
 * @param message A short description.
 * @param extra Extra properties of the error body, such as `componentId`.
 */
export function surfaceError(
  code: SurfaceErrorCode,
  surfaceId: string,
  message: string,
  extra: Record<string, unknown> = {},
): A2uiErrorMessage {
  return { version: A2UI_VERSION, error: { ...extra, code, surfaceId, message } };
}
