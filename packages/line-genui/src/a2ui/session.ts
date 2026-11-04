/**
 * The A2UI session: one `web_core` `MessageProcessor` with the `line` and `basic` catalogs registered, fed one
 * message at a time (Phase 1 spec §6.G.4 "Projection and messages"; ARCH §17.4; R2 §5a).
 *
 * @module a2ui/session
 */

import { Catalog, type ComponentApi, createFunctionImplementation } from '@a2ui/web_core/catalog';
import { MessageProcessor, RELAXED_VALIDATION } from '@a2ui/web_core/processing';
import type { SurfaceModel } from '@a2ui/web_core/state';
import { BASIC_FUNCTIONS, OpenUrlApi } from '@a2ui/web_core/v0_9';
import { BASIC_CATALOG_ID, basicImplementations } from '../catalog/basic.js';
import { descriptors } from '../catalog/index.js';
import { lineCatalog } from '../catalog/line.js';
import { A2UI_VERSION, type A2uiActionMessage, type A2uiErrorMessage, surfaceError, toA2uiError } from './errors.js';
import { isJsonObject, type JsonObject } from './guards.js';
import { checkLimits, childrenFirst, DEFAULT_LIMITS, type Limits } from './limits.js';
import { allowedUrl, type UrlPolicy } from './url-policy.js';

/**
 * What a `<line-a2ui-surface>` gives the session it attaches to: its surface id, its limits and URL policy, and
 * the start and end of each transport batch that names it.
 */
export interface SessionHost {
  readonly surfaceId: string;
  readonly limits: Limits;
  readonly urlPolicy: UrlPolicy | undefined;
  batchStart(): void;
  batchEnd(): void;
}

type Listener<T> = (value: T) => void;

/** The surface id a batch element names, read before `web_core` parses it, so a rejected element still names it. */
function surfaceIdOf(message: unknown): string | undefined {
  if (!isJsonObject(message)) return undefined;
  if (typeof message.surfaceId === 'string') return message.surfaceId;
  for (const body of Object.values(message)) {
    if (isJsonObject(body) && typeof body.surfaceId === 'string') return body.surfaceId;
  }
  return undefined;
}

/** The `version` values of the A2UI v0.9 envelopes the session accepts (§10 SD45; §12 AM-083). */
const V09_VERSIONS: Readonly<Record<string, true>> = { 'v0.9': true, 'v0.9.1': true };

/** A `{ messages: […] }` wrapper, which `processMessages` also takes. */
const isWrapper = (value: unknown): value is JsonObject & { messages: unknown[] } =>
  isJsonObject(value) && Object.hasOwn(value, 'messages') && Array.isArray(value.messages);

/** The action keys of an A2UI v0.9 envelope, one of which it carries (§6.G.4; §12 AM-084). */
const V09_ACTIONS = ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface'] as const;

/**
 * Whether `element` is an A2UI v0.9 envelope as the session accepts it (§6.G.4; §12 AM-083, AM-084): a `version` of
 * `v0.9` or `v0.9.1`, no own `type`, and exactly one own v0.9 action key. `web_core` treats any object with an
 * internal-operation `type` as a raw operation before it picks a version adapter (`message-processor.js:366-379`),
 * so a `type` must never reach it. Own-property checks only, so nothing inherited counts either way.
 */
function isV09Envelope(element: unknown): element is JsonObject {
  if (!isJsonObject(element) || isWrapper(element) || Object.hasOwn(element, 'type')) return false;
  const version = Object.hasOwn(element, 'version') ? element.version : undefined;
  if (typeof version !== 'string' || !Object.hasOwn(V09_VERSIONS, version)) return false;
  return V09_ACTIONS.filter((key) => Object.hasOwn(element, key)).length === 1;
}

/** One message of a batch as the session reads it: a v0.9 envelope to apply, or a shape it rejects. */
type Unit =
  | { readonly kind: 'message'; readonly message: JsonObject; readonly surfaceId: string }
  | { readonly kind: 'unsupported'; readonly surfaceId: string };

/**
 * One element read as a message: a v0.9 envelope, or anything else, which the session does not accept. An envelope
 * goes on as a copy of its own properties, because `web_core` tests `'type' in message`, which an inherited `type`
 * would pass (`operations.js:33-38`; §12 AM-084).
 */
function unitOf(element: unknown, fallbackSurfaceId: string): Unit {
  const surfaceId = surfaceIdOf(element) ?? fallbackSurfaceId;
  if (!isV09Envelope(element)) return { kind: 'unsupported', surfaceId };
  return { kind: 'message', message: { ...element }, surfaceId };
}

/**
 * The messages of one batch element: an array of messages or a `{ messages }` wrapper unwraps one level, and each
 * inner element is judged on its own; an array or wrapper inside one is not a v0.9 envelope (§6.G.4; §12 AM-083).
 */
function unitsOf(element: unknown, fallbackSurfaceId: string): Unit[] {
  const inner = Array.isArray(element) ? element : isWrapper(element) ? element.messages : undefined;
  if (!inner) return [unitOf(element, fallbackSurfaceId)];
  const surfaceId = surfaceIdOf(element) ?? fallbackSurfaceId;
  return inner.map((item) => unitOf(item, surfaceId));
}

/**
 * The envelope with the components of its `updateComponents` body in children-first order, so `NodeResolver`
 * materializes each parent once ({@link childrenFirst}); any other envelope, or one it cannot read, as it is.
 */
function inApplyOrder(message: JsonObject, surface: SurfaceModel | undefined): JsonObject {
  const body = message.updateComponents;
  if (!(surface && isJsonObject(body) && Array.isArray(body.components))) return message;
  try {
    return { ...message, updateComponents: { ...body, components: childrenFirst(body.components, surface) } };
  } catch {
    return message;
  }
}

/** The fixed text of `UNSUPPORTED_MESSAGE`, which travels to the agent. */
const UNSUPPORTED_TEXT =
  'The message is not an A2UI v0.9 envelope; the surface accepts messages whose version is v0.9 or v0.9.1.';

/** Calls every listener, so one that throws neither stops the others nor reaches `web_core` (MANIFESTO Law 9). */
function notify<T>(listeners: ReadonlySet<Listener<T>>, value: T): void {
  for (const listener of listeners) {
    try {
      listener(value);
    } catch (err) {
      queueMicrotask(() => {
        throw err;
      });
    }
  }
}

/**
 * An A2UI session. It owns one `web_core` `MessageProcessor`, which holds the surface and data models, with the
 * `line` catalog under `https://line-ui.websublime.com/a2ui/catalogs/line/v1/catalog.json` and the `basic`
 * implementations under `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json`, both always on, and
 * `RELAXED_VALIDATION` (§6.G.4; §10 SD42, SD43, SD52).
 *
 * Feed it with {@link Session.process}, or through a surface's `feed()`. It accepts only A2UI v0.9 envelopes, whose
 * `version` is `v0.9` or `v0.9.1`; anything else raises `UNSUPPORTED_MESSAGE` before `web_core` sees it
 * (§6.G.4; §12 AM-083). Each message goes through its own limit check and its own `processMessages` call, so a
 * rejected message drops only itself (R1 §2.7; §10 SD51; §12 AM-082). Nothing `web_core` throws leaves the
 * session: each throw becomes an A2UI `error` message for {@link Session.onError}.
 *
 * Preview: `@websublime/line-genui/a2ui` may change in any minor release until it targets A2UI v1.0.
 *
 * @example
 * ```ts
 * const session = new Session();
 * surface.session = session; // <line-a2ui-surface surface-id="main">
 * session.process(messages, 'main');
 * ```
 */
export class Session {
  readonly #processor: MessageProcessor<ComponentApi>;
  readonly #errorListeners = new Set<Listener<A2uiErrorMessage>>();
  readonly #actionListeners = new Set<Listener<A2uiActionMessage>>();
  readonly #surfaceListeners = new Set<Listener<SurfaceModel>>();
  readonly #deletedListeners = new Set<Listener<string>>();
  readonly #hosts = new Map<string, Set<SessionHost>>();

  constructor() {
    // `openUrl` runs behind the surface's URL policy and only on a user activation (§6.G.4 URLs; §10 SD57).
    const openUrl = createFunctionImplementation({ ...OpenUrlApi, requiresUserActivation: true }, (args, context) =>
      this.#openUrl(args.url, context.surface?.id),
    );
    const functions = BASIC_FUNCTIONS.map((fn) => (fn.name === openUrl.name ? openUrl : fn));
    const basic = basicImplementations(BASIC_CATALOG_ID);
    const basicCatalog = new Catalog(
      BASIC_CATALOG_ID,
      '0.9',
      basic ? Object.values(basic).map((entry) => entry.api) : [],
      functions,
    );
    this.#processor = new MessageProcessor<ComponentApi>(
      [lineCatalog(descriptors), basicCatalog],
      (action) => notify(this.#actionListeners, { version: A2UI_VERSION, action: { ...action } }),
      { validationConfig: RELAXED_VALIDATION },
    );
    this.#processor.onSurfaceCreated((surface) => {
      surface.onError.subscribe((payload) => this.#emitError(toA2uiError(payload, surface.id)));
      notify(this.#surfaceListeners, surface);
    });
    this.#processor.onSurfaceDeleted((id) => notify(this.#deletedListeners, id));
  }

  /**
   * Processes one transport batch and returns how many A2UI v0.9 messages applied, counting each message of an
   * array or `{ messages }` wrapper on its own. Each batch element is a v0.9 envelope, or an array or wrapper that
   * unwraps one level into elements judged on their own; any other shape applies nothing and raises
   * `UNSUPPORTED_MESSAGE` (§6.G.4; §12 AM-083). Each envelope is one unit: one limit check, then one
   * `processMessages` call, so it applies whole or not at all; a message that `web_core` rejects, or that would
   * breach a limit of its surface, drops only itself and raises an error (§6.G.4 Errors, Limits; §10 SD51, SD56;
   * §12 AM-082). Each attached surface that the batch names holds `aria-busy` until the batch settles.
   *
   * @param messages The A2UI messages of the batch, in order.
   * @param fallbackSurfaceId The surface an error belongs to when its message names none.
   */
  process(messages: readonly unknown[], fallbackSurfaceId: string): number {
    const units = messages.flatMap((message) => unitsOf(message, fallbackSurfaceId));
    const hosts = new Set<SessionHost>();
    for (const id of new Set(units.map((unit) => unit.surfaceId))) {
      for (const host of this.#hosts.get(id) ?? []) hosts.add(host);
    }
    for (const host of hosts) host.batchStart();
    let applied = 0;
    try {
      for (const unit of units) {
        if (unit.kind === 'unsupported') {
          this.#emitError(surfaceError('UNSUPPORTED_MESSAGE', unit.surfaceId, UNSUPPORTED_TEXT));
        } else if (this.#apply(unit.message, unit.surfaceId)) applied++;
      }
    } finally {
      for (const host of hosts) host.batchEnd();
    }
    return applied;
  }

  /** Checks one v0.9 envelope against its surface's limits, then applies it in one call; returns whether it applied. */
  #apply(message: JsonObject, surfaceId: string): boolean {
    try {
      const surface = this.#processor.getSurface(surfaceId);
      const breach = checkLimits(message, surface, this.#limits(surfaceId));
      if (breach) {
        const text = `The message would take ${breach.limit} to ${breach.value}, over its limit of ${breach.max}.`;
        this.#emitError(surfaceError('LIMIT_EXCEEDED', surfaceId, text, { ...breach }));
        return false;
      }
      this.#processor.processMessages(inApplyOrder(message, surface) as never);
      return true;
    } catch (err) {
      this.#emitError(toA2uiError(err, surfaceId));
      return false;
    }
  }

  /**
   * Returns the client data model of the surfaces created with `sendDataModel`, for the transport to send with an
   * action, or `undefined` when there is none or `web_core` throws; a throw raises an error.
   *
   * @param fallbackSurfaceId The surface a throw is reported on.
   */
  dataModel(fallbackSurfaceId: string): unknown {
    try {
      return this.#processor.getRendererDataModel();
    } catch (err) {
      this.#emitError(toA2uiError(err, fallbackSurfaceId));
      return undefined;
    }
  }

  /** Listens to every A2UI `error` message of the session; returns the function that stops listening. */
  onError(listener: Listener<A2uiErrorMessage>): () => void {
    this.#errorListeners.add(listener);
    return () => this.#errorListeners.delete(listener);
  }

  /** Listens to every resolved A2UI `action` message of the session; returns the function that stops listening. */
  onAction(listener: Listener<A2uiActionMessage>): () => void {
    this.#actionListeners.add(listener);
    return () => this.#actionListeners.delete(listener);
  }

  /**
   * Listens to the surface models the session creates, starting with those it holds already; returns the
   * function that stops listening.
   */
  onSurface(listener: Listener<SurfaceModel>): () => void {
    this.#surfaceListeners.add(listener);
    for (const surface of this.#processor.getSurfaces().values()) listener(surface);
    return () => this.#surfaceListeners.delete(listener);
  }

  /** Listens to the ids of the surfaces a `deleteSurface` message removes; returns the function that stops. */
  onSurfaceDeleted(listener: Listener<string>): () => void {
    this.#deletedListeners.add(listener);
    return () => this.#deletedListeners.delete(listener);
  }

  /**
   * Attaches a surface element, which gives the session its limits, its URL policy and its batch hooks. The
   * surface calls it when its `session` is set; returns the function that detaches it.
   *
   * @param host The surface element.
   */
  attach(host: SessionHost): () => void {
    const id = host.surfaceId;
    let set = this.#hosts.get(id);
    if (!set) {
      set = new Set();
      this.#hosts.set(id, set);
    }
    set.add(host);
    return () => {
      set.delete(host);
      if (set.size === 0 && this.#hosts.get(id) === set) this.#hosts.delete(id);
    };
  }

  /** Disposes the processor and drops every listener. */
  dispose(): void {
    this.#processor.dispose();
    this.#errorListeners.clear();
    this.#actionListeners.clear();
    this.#surfaceListeners.clear();
    this.#deletedListeners.clear();
    this.#hosts.clear();
  }

  /**
   * The limits of the surfaces attached under `surfaceId`: each host's own value, which is its default when its
   * attribute is unset, so a consumer can raise a limit as well as lower it; with several hosts, the strictest wins.
   * The defaults when no surface is attached.
   */
  #limits(surfaceId: string): Limits {
    const [first, ...rest] = [...(this.#hosts.get(surfaceId) ?? [])].map((host) => host.limits);
    if (!first) return DEFAULT_LIMITS;
    return rest.reduce<Limits>(
      (strictest, own) => ({
        maxNodes: Math.min(strictest.maxNodes, own.maxNodes),
        maxDepth: Math.min(strictest.maxDepth, own.maxDepth),
        maxDataModelSize: Math.min(strictest.maxDataModelSize, own.maxDataModelSize),
      }),
      first,
    );
  }

  #emitError(message: A2uiErrorMessage): void {
    notify(this.#errorListeners, message);
  }

  /** Opens `raw` in a new browsing context when the default policy and every attached surface's policy allow it. */
  #openUrl(raw: unknown, surfaceId: string | undefined): void {
    if (typeof window === 'undefined' || typeof window.open !== 'function') return;
    const hosts = surfaceId === undefined ? undefined : this.#hosts.get(surfaceId);
    const base = document.baseURI;
    let url = allowedUrl(raw, 'openUrl', base, undefined);
    for (const host of hosts ?? []) {
      if (url) url = allowedUrl(url.href, 'openUrl', base, host.urlPolicy);
    }
    if (url) window.open(url.href, '_blank', 'noopener,noreferrer');
  }
}
