/**
 * `<line-a2ui-surface>`, the A2UI renderer of line://ui (Phase 1 spec §6.G.4; ARCH §17.4).
 *
 * @module a2ui/surface
 */

import { effect, getValue, peekValue, setValue } from '@a2ui/web_core/reactivity';
import { NodeResolver } from '@a2ui/web_core/resolution';
import type { SurfaceModel } from '@a2ui/web_core/state';
import type { A2uiIconMap } from '@websublime/line-icons/a2ui';
import type { LineDescriptor } from '../catalog/descriptor.js';
import { type A2uiActionMessage, type A2uiErrorMessage, surfaceError, toA2uiError } from './errors.js';
import { DEFAULT_LIMITS, type Limits, positiveInteger } from './limits.js';
import { type MarkdownRenderer, Projection } from './projection.js';
import { Reconciler } from './reconciler.js';
import type { Session, SessionHost } from './session.js';
import css from './surface.css?inline';
import type { UrlPolicy } from './url-policy.js';

/** The default `live-update-text`, the R2 spike string (R2 §6 Q3; §12 AM-013, AM-015). */
export const DEFAULT_LIVE_UPDATE_TEXT = 'Content updated.';
/** The default `live-error-text`, the R2 spike string (R2 §6 Q3; §12 AM-013, AM-015). */
export const DEFAULT_LIVE_ERROR_TEXT = 'Some content could not be shown.';

/** The delay before the live region writes its text, so the same text announces again after a clear. */
const ANNOUNCE_DELAY = 100;

/** Resolves on the next animation frame, or the next task where there is none. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });
}

/**
 * Fills the surface's shadow root: its stylesheet, its one live region and a default slot for the light DOM it
 * renders into (§6.G.4 Accessibility; ARCH §17.4). Returns the live region.
 */
function shadowParts(root: ShadowRoot): HTMLElement {
  const style = document.createElement('style');
  style.append(css);
  const live = document.createElement('div');
  live.setAttribute('data-line-a2ui-live', '');
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  root.append(style, live, document.createElement('slot'));
  return live;
}

/**
 * Renders the A2UI surface `surface-id` of an A2UI session with line://ui components, in its light DOM.
 *
 * Give it a `Session` through `session` and feed the session's messages with `feed()` or `session.process()`.
 * Each component loads on first use through its descriptor's `load()`. Agent text renders as plain text unless
 * `markdownRenderer` is set, agent URLs pass the URL policy, and agent theme hints are ignored. The surface holds
 * `aria-busy="true"` while a transport batch settles, announces "Content updated." through one live region after
 * a batch that changed it and "Some content could not be shown." after an error, and never moves focus to another
 * component.
 *
 * Preview: `@websublime/line-genui/a2ui` may change in any minor release until it targets A2UI v1.0.
 *
 * @summary The A2UI renderer: projects an A2UI surface onto line://ui components in the light DOM.
 *
 * @attr {string} surface-id - The id of the A2UI surface this element renders.
 * @attr {number} max-nodes - The most nodes a surface may hold, a positive integer; a message that would exceed it is rejected. Any other value keeps the default.
 * @attr {number} max-depth - The deepest the rendered tree may go, the root at depth 1, a positive integer; a message that would exceed it is rejected. Any other value keeps the default.
 * @attr {number} max-data-model-size - The largest the data model may grow, in UTF-8 bytes of its JSON text, a positive integer; a message that would exceed it is rejected. Any other value keeps the default.
 * @attr {string} live-update-text - What the live region announces after a batch that changed the surface. Default "Content updated.".
 * @attr {string} live-error-text - What the live region announces after an error. Default "Some content could not be shown.".
 *
 * @fires {CustomEvent<A2uiActionMessage>} line-a2ui-action - A user action on a component; `detail` is the resolved A2UI `action` message, ready for the transport. Bubbles and is composed.
 * @fires {CustomEvent<A2uiErrorMessage>} line-a2ui-error - A message was rejected, or a node could not render; `detail` is an A2UI `error` message in its generic form, ready for the transport. Bubbles and is composed.
 */
export class LineA2uiSurface extends HTMLElement implements SessionHost {
  static readonly observedAttributes: readonly string[] = ['surface-id'];

  readonly #reconciler = new Reconciler();
  readonly #projection: Projection;
  readonly #live: HTMLElement;
  readonly #observer: MutationObserver;
  #session: Session | undefined;
  #detachSession: (() => void)[] = [];
  #resolver: NodeResolver | undefined;
  #disposeRoot: (() => void) | undefined;
  readonly #loaded = new Set<string>();
  readonly #loading = new Set<Promise<unknown>>();
  #batches = 0;
  #batchErrors = 0;
  #changed = false;
  #focused: string | undefined;
  #settling: Promise<void> = Promise.resolve();
  #announceTimer: number | undefined;

  constructor() {
    super();
    this.#projection = new Projection({
      reconciler: this.#reconciler,
      raise: (code, message, extra) => this.#raise(surfaceError(code, this.surfaceId, message, extra)),
      thrown: (err, extra) => this.#raise(toA2uiError(err, this.surfaceId, extra)),
      load: (descriptor) => this.#load(descriptor),
    });
    this.#live = shadowParts(this.attachShadow({ mode: 'open' }));
    this.#observer = new MutationObserver((records) => this.#mutated(records));
    this.#observer.observe(this, { subtree: true, childList: true, attributes: true, characterData: true });
  }

  /** The id of the A2UI surface this element renders; reflects `surface-id`. */
  get surfaceId(): string {
    return this.getAttribute('surface-id') ?? '';
  }

  set surfaceId(value: string) {
    this.setAttribute('surface-id', value);
  }

  /**
   * The session whose surface `surface-id` this element renders. Setting it attaches the element and renders the
   * surface if the session holds it; `undefined` detaches it and clears the render.
   */
  get session(): Session | undefined {
    return this.#session;
  }

  set session(session: Session | undefined) {
    if (session === this.#session) return;
    this.#detach();
    this.#session = session;
    this.#attach();
  }

  /**
   * The A2UI icon map: the result of `a2uiIconMap(set, { library })` from `@websublime/line-icons/a2ui`. No
   * default. An Icon name renders through the entry `Object.hasOwn(iconMap, name)` finds; an unmapped name, or any
   * name while it is unset, leaves the icon empty and raises `line-a2ui-error`. Setting or replacing it re-renders
   * every Icon.
   */
  get iconMap(): A2uiIconMap | undefined {
    return peekValue(this.#projection.iconMap);
  }

  set iconMap(iconMap: A2uiIconMap | undefined) {
    setValue(this.#projection.iconMap, iconMap);
  }

  /**
   * A URL policy that runs after the default one, with the URL resolved against the document base, for Image,
   * Video and AudioPlayer URLs and `openUrl`. `false`, or a throw, keeps the URL from the DOM and from `openUrl`.
   * It can reject a URL the default allows and cannot admit one the default rejects (`https:`, `http:`, `mailto:`
   * and `tel:`; never `data:`). No default.
   */
  get urlPolicy(): UrlPolicy | undefined {
    return peekValue(this.#projection.urlPolicy);
  }

  set urlPolicy(policy: UrlPolicy | undefined) {
    setValue(this.#projection.urlPolicy, policy);
  }

  /**
   * A Markdown renderer for Text values; it returns the node to insert, and sanitising is the consumer's. When it
   * is unset, Text renders as plain text; when it throws or returns a value that is not a `Node`, the value renders
   * as plain text and the surface raises `line-a2ui-error`. No default.
   */
  get markdownRenderer(): MarkdownRenderer | undefined {
    return peekValue(this.#projection.markdownRenderer);
  }

  set markdownRenderer(renderer: MarkdownRenderer | undefined) {
    setValue(this.#projection.markdownRenderer, renderer);
  }

  /** The `max-nodes` limit in effect; reflects `max-nodes`. Setting a value that is not a positive integer keeps the default. */
  get maxNodes(): number {
    return positiveInteger(this.getAttribute('max-nodes')) ?? DEFAULT_LIMITS.maxNodes;
  }

  set maxNodes(value: number) {
    this.setAttribute('max-nodes', String(value));
  }

  /** The `max-depth` limit in effect; reflects `max-depth`. Setting a value that is not a positive integer keeps the default. */
  get maxDepth(): number {
    return positiveInteger(this.getAttribute('max-depth')) ?? DEFAULT_LIMITS.maxDepth;
  }

  set maxDepth(value: number) {
    this.setAttribute('max-depth', String(value));
  }

  /**
   * The `max-data-model-size` limit in effect, in UTF-8 bytes of `JSON.stringify` of the data model; reflects
   * `max-data-model-size`. Setting a value that is not a positive integer keeps the default.
   */
  get maxDataModelSize(): number {
    return positiveInteger(this.getAttribute('max-data-model-size')) ?? DEFAULT_LIMITS.maxDataModelSize;
  }

  set maxDataModelSize(value: number) {
    this.setAttribute('max-data-model-size', String(value));
  }

  /** What the live region announces after a batch that changed the surface; reflects `live-update-text`. */
  get liveUpdateText(): string {
    return this.getAttribute('live-update-text') ?? DEFAULT_LIVE_UPDATE_TEXT;
  }

  set liveUpdateText(value: string) {
    this.setAttribute('live-update-text', value);
  }

  /** What the live region announces after an error; reflects `live-error-text`. */
  get liveErrorText(): string {
    return this.getAttribute('live-error-text') ?? DEFAULT_LIVE_ERROR_TEXT;
  }

  set liveErrorText(value: string) {
    this.setAttribute('live-error-text', value);
  }

  /** The limits in effect, which the session checks each message against. */
  get limits(): Limits {
    return { maxNodes: this.maxNodes, maxDepth: this.maxDepth, maxDataModelSize: this.maxDataModelSize };
  }

  /**
   * Feeds one transport batch to the session, message by message, and resolves with how many messages applied
   * once the surface has settled: its components loaded and `aria-busy` cleared. Resolves with `0` without a
   * session.
   *
   * @param messages The A2UI messages of the batch, in order.
   */
  async feed(messages: readonly unknown[]): Promise<number> {
    const session = this.#session;
    if (!session) return 0;
    const applied = session.process(messages, this.surfaceId);
    await this.settled();
    return applied;
  }

  /** Resolves once every batch fed so far has settled. */
  async settled(): Promise<void> {
    let current: Promise<void>;
    do {
      current = this.#settling;
      await current;
    } while (current !== this.#settling);
  }

  attributeChangedCallback(name: string, previous: string | null, next: string | null): void {
    if (name === 'surface-id' && previous !== next && this.#session) {
      this.#detach();
      this.#attach();
    }
  }

  /** @internal Called by the session when a transport batch that names this surface starts. */
  batchStart(): void {
    if (this.#batches++ > 0) return;
    this.#batchErrors = 0;
    this.#changed = false;
    this.#observer.takeRecords();
    this.#reconciler.takeBlurred();
    const active = document.activeElement;
    this.#focused = active && this.contains(active) ? this.#projection.instanceIdOf(active) : undefined;
    this.setAttribute('aria-busy', 'true');
  }

  /** @internal Called by the session when that batch has gone through `web_core`. */
  batchEnd(): void {
    const previous = this.#settling;
    this.#settling = (async () => {
      await previous;
      do {
        await Promise.all([...this.#loading]);
        await nextFrame();
      } while (this.#loading.size > 0);
      this.#batches--;
      if (this.#batches === 0) this.#finishBatch();
    })();
  }

  #finishBatch(): void {
    this.#reconciler.sweep();
    // A move that could not use `moveBefore()` blurred the focused element: focus returns to the same `instanceId`
    // if focus went nowhere else (§6.G.4; plan §5.6 D4).
    const blurred = this.#reconciler.takeBlurred();
    const active = document.activeElement;
    if (blurred && this.#focused && (!active || active === document.body)) {
      const element = this.#projection.elementFor(this.#focused);
      if (element instanceof HTMLElement && element.isConnected) element.focus({ preventScroll: true });
    }
    this.#focused = undefined;
    this.#projection.purge();
    this.#mutated(this.#observer.takeRecords());
    this.removeAttribute('aria-busy');
    this.#observer.takeRecords();
    if (this.#batchErrors > 0) this.#announce(this.liveErrorText);
    else if (this.#changed) this.#announce(this.liveUpdateText);
  }

  #mutated(records: readonly MutationRecord[]): void {
    for (const record of records) {
      if (record.target === this && record.attributeName === 'aria-busy') continue;
      this.#changed = true;
      break;
    }
    // Outside a batch, children that left their parent go at once.
    if (this.#batches === 0 && records.length > 0) {
      this.#reconciler.sweep();
      this.#projection.purge();
    }
  }

  #attach(): void {
    const session = this.#session;
    if (!session) return;
    this.#detachSession = [
      session.attach(this),
      session.onError((message) => {
        if (message.error.surfaceId === this.surfaceId) this.#raise(message);
      }),
      session.onAction((message) => {
        if (message.action.surfaceId === this.surfaceId) this.#act(message);
      }),
      session.onSurface((model) => {
        if (model.id === this.surfaceId) this.#render(model);
      }),
      session.onSurfaceDeleted((id) => {
        if (id === this.surfaceId) this.#clear();
      }),
    ];
  }

  #detach(): void {
    for (const stop of this.#detachSession) stop();
    this.#detachSession = [];
    this.#clear();
  }

  #render(model: SurfaceModel): void {
    this.#clear();
    let resolver: NodeResolver;
    try {
      resolver = new NodeResolver(model);
    } catch (err) {
      this.#raise(toA2uiError(err, this.surfaceId));
      return;
    }
    this.#resolver = resolver;
    this.#disposeRoot = effect(() => {
      const root = getValue(resolver.rootNode);
      const element = root ? getValue(this.#projection.mountRoot(root)) : undefined;
      this.#reconciler.reconcile(this, element ? [element] : []);
    });
  }

  #clear(): void {
    this.#disposeRoot?.();
    this.#disposeRoot = undefined;
    this.#resolver?.dispose();
    this.#resolver = undefined;
    this.#reconciler.reconcile(this, []);
    this.#reconciler.sweep();
    this.#projection.purge();
  }

  #load(descriptor: LineDescriptor): void {
    // A tag the page defined already, from this or another copy of the component, needs no second load.
    if (this.#loaded.has(descriptor.tag) || customElements.get(descriptor.tag)) return;
    this.#loaded.add(descriptor.tag);
    const loading = descriptor.load().then(
      () => undefined,
      (err: unknown) => this.#raise(toA2uiError(err, this.surfaceId, { tag: descriptor.tag })),
    );
    this.#loading.add(loading);
    loading.finally(() => this.#loading.delete(loading));
  }

  #raise(message: A2uiErrorMessage): void {
    if (this.#batches > 0) this.#batchErrors++;
    else this.#announce(this.liveErrorText);
    this.dispatchEvent(new CustomEvent('line-a2ui-error', { detail: message, bubbles: true, composed: true }));
  }

  #act(message: A2uiActionMessage): void {
    this.dispatchEvent(new CustomEvent('line-a2ui-action', { detail: message, bubbles: true, composed: true }));
  }

  /** Clears the live region first, so the same text announces again. */
  #announce(text: string): void {
    const live = this.#live;
    window.clearTimeout(this.#announceTimer);
    live.replaceChildren();
    this.#announceTimer = window.setTimeout(() => live.replaceChildren(text), ANNOUNCE_DELAY);
  }
}
