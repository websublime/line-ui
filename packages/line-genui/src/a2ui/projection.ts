/**
 * The direct projection of a `NodeResolver` tree onto `line-*` and native elements in the surface's light DOM
 * (Phase 1 spec §6.G.4 "Projection and messages", "Accessibility", "Basic mapping", "`line` catalog Icon";
 * ARCH §17.3, §17.4; R2 §5a).
 *
 * Each resolved node gets one view with one effect, which applies the node's props to its element and reconciles
 * its children. A view's element is a signal, so a parent re-renders when a child swaps between its element and a
 * placeholder. Elements are keyed by `instanceId`: the resolver replaces a node when its position changes, and the
 * successor takes over its predecessor's element, which keeps focus (R2 §2.8).
 *
 * @module a2ui/projection
 */

import { effect, getValue, peekValue, type Signal, setValue, signal } from '@a2ui/web_core/reactivity';
import { type ComponentNode, isComponentNode, ResolvedBinding, WritableBinding } from '@a2ui/web_core/resolution';
import type { A2uiIconMap } from '@websublime/line-icons/a2ui';
import { BASIC_CATALOG_ID, type BasicTarget, basicImplementations } from '../catalog/basic.js';
import type { LineDescriptor } from '../catalog/descriptor.js';
import { descriptors } from '../catalog/index.js';
import { LINE_CATALOG_ID } from '../catalog/line.js';
import type { SurfaceErrorCode } from './errors.js';
import { isJsonObject } from './guards.js';
import type { Reconciler } from './reconciler.js';
import { allowedUrl, type UrlPolicy } from './url-policy.js';

/** A consumer Markdown renderer, the `markdownRenderer` property: it returns the node to insert for a Text value. */
export type MarkdownRenderer = (markdown: string) => Node;

/** What the projection needs from its surface. */
export interface ProjectionHost {
  readonly reconciler: Reconciler;
  /** Raises `line-a2ui-error` with a surface code. */
  raise(code: SurfaceErrorCode, message: string, extra: Record<string, unknown>): void;
  /** Raises `line-a2ui-error` for a thrown value, with its `web_core` code when it has one. */
  thrown(err: unknown, extra?: Record<string, unknown>): void;
  /** Loads a descriptor's component once; the surface holds `aria-busy` until it settles. */
  load(descriptor: LineDescriptor): void;
}

/** Where a node sits: inside a Button, whose Text renders as `<span>` (ARCH §17.3; §10 SD59). */
interface Context {
  readonly inButton: boolean;
}

const ROOT_CONTEXT: Context = { inButton: false };

/** The target of a node, from the `basic` map or the `line` catalog. */
type Target =
  | Exclude<BasicTarget, { kind: 'component' }>
  | {
      readonly kind: 'component';
      readonly descriptor: LineDescriptor;
      readonly attributes: Readonly<Record<string, string>>;
      /** The basic type, for its props that differ from the descriptor's, or `undefined` for a `line` node. */
      readonly basicType: string | undefined;
    };

/** The agent-exposed `line` descriptors by catalog name. */
const LINE_DESCRIPTORS: ReadonlyMap<string, LineDescriptor> = new Map(
  descriptors.filter((descriptor) => descriptor.agentExposed).map((descriptor) => [descriptor.name, descriptor]),
);

/** Basic props that bind to a differently named descriptor prop (ARCH §17.3 table; §6.G.4 Basic mapping). */
const BASIC_PROP_NAMES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  List: { direction: 'orientation' },
  Divider: { axis: 'orientation' },
};

/** A basic node's props under the descriptor's names, such as List `direction` as Stack `orientation`. */
function renamed(props: Record<string, unknown>, basicType: string | undefined): Record<string, unknown> {
  const names = basicType ? BASIC_PROP_NAMES[basicType] : undefined;
  if (!names) return props;
  const own = { ...props };
  for (const [from, to] of Object.entries(names)) {
    own[to] = props[from];
    delete own[from];
  }
  return own;
}

const LOOKUP_OWNED = new WeakMap<LineDescriptor, ReadonlySet<string>>();

/**
 * The members a descriptor's surface lookup sets and the props that skip it, which the lookup owns, as Icon
 * `name` owns `mirror` and `path`; empty when the descriptor has no lookup.
 */
function lookupOwned(descriptor: LineDescriptor): ReadonlySet<string> {
  let owned = LOOKUP_OWNED.get(descriptor);
  if (!owned) {
    const names = new Set<string>();
    for (const binding of Object.values(descriptor.bindings.props)) {
      if (binding?.kind !== 'surfaceLookup') continue;
      for (const member of binding.sets) names.add(member.name);
      for (const prop of binding.skippedWhen) names.add(prop);
    }
    owned = names;
    LOOKUP_OWNED.set(descriptor, owned);
  }
  return owned;
}

/**
 * Fixed attributes of a `line` catalog node's element, as the `basic` map carries them for basic types: every
 * `line-button` the surface renders is `type="button"`, so an agent Button never submits or resets a host form
 * around the light-DOM surface (§6.G.4 Button; §12 AM-081).
 */
const LINE_ATTRIBUTES: Readonly<Record<string, Readonly<Record<string, string>>>> = { Button: { type: 'button' } };

function targetOf(catalogId: string | undefined, type: string): Target | undefined {
  if (catalogId === LINE_CATALOG_ID) {
    const descriptor = LINE_DESCRIPTORS.get(type);
    const attributes = Object.hasOwn(LINE_ATTRIBUTES, type) ? (LINE_ATTRIBUTES[type] ?? {}) : {};
    return descriptor ? { kind: 'component', descriptor, attributes, basicType: undefined } : undefined;
  }
  const basic = catalogId === undefined ? undefined : basicImplementations(catalogId);
  if (!(basic && Object.hasOwn(basic, type))) return undefined;
  const { target } = basic[type as keyof typeof basic];
  return target.kind === 'component' ? { ...target, basicType: type } : target;
}

/** The value of a resolved prop: the snapshot of a binding, or the literal. */
function unwrap(value: unknown): unknown {
  return value instanceof ResolvedBinding ? value.value : value;
}

function text(value: unknown): string {
  return typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : '';
}

/** A label that counts: non-empty after trimming whitespace (§6.G.4 Accessibility; §12 AM-068). */
function label(value: unknown): string | undefined {
  const string = text(unwrap(value));
  return string.trim() === '' ? undefined : string;
}

/** The child nodes a prop holds: one node, or the nodes of a child list. */
function childNodes(value: unknown): ComponentNode[] {
  if (isComponentNode(value)) return [value];
  return Array.isArray(value) ? value.filter(isComponentNode) : [];
}

/** Sets or removes an attribute: `true` → empty, `false`, `null`, `undefined` → removed. */
function setAttribute(element: Element, name: string, value: unknown): void {
  if (value === undefined || value === null || value === false) element.removeAttribute(name);
  else {
    const next = value === true ? '' : text(value);
    if (element.getAttribute(name) !== next) element.setAttribute(name, next);
  }
}

function setProperty(element: Element, name: string, value: unknown): void {
  const target = element as unknown as Record<string, unknown>;
  if (target[name] !== value) target[name] = value;
}

/** Sets an element's text content, updating its only Text node in place. */
function setText(element: Element, value: string): void {
  const only = element.firstChild;
  if (only && only === element.lastChild && only.nodeType === Node.TEXT_NODE) {
    if ((only as Text).data !== value) (only as Text).data = value;
  } else element.textContent = value;
}

/** The text of a node's Text descendants, the "child text" name source; `undefined` while one is pending. */
function childText(node: ComponentNode): string | undefined {
  if (node.state === 'pending') return undefined;
  if (node.isPlaceholder) return '';
  const props = getValue(node.props) as Record<string, unknown>;
  if (node.type === 'Text' && node.context?.componentModel.catalog.id === BASIC_CATALOG_ID)
    return text(unwrap(props.text));
  let result = '';
  for (const value of Object.values(props)) {
    for (const child of childNodes(value)) {
      const own = childText(child);
      if (own === undefined) return undefined;
      result += own;
    }
  }
  return result;
}

/**
 * The string of a text-binding prop, the "textProp" name source; `undefined` while the prop is bound to a path and
 * its value is `undefined`, such as a path the data model does not hold yet (§6.G.4 Accessibility; `0008-chip.md`
 * AM-001). `web_core` gives an omitted optional prop a read-only binding of `undefined`, which is no pending binding,
 * so it counts as an empty string (`0007-badge.md` F10).
 */
function boundText(value: unknown): string | undefined {
  return value instanceof WritableBinding && value.value === undefined ? undefined : text(unwrap(value));
}

/** One node's projection. */
interface View {
  readonly node: ComponentNode;
  readonly context: Context;
  /** The node on screen: its element, or a placeholder. */
  readonly element: Signal<Element | undefined>;
  /** The node's own element, once created, and its tag. */
  own: Element | undefined;
  ownTag: string | undefined;
  placeholders: Map<string, HTMLElement>;
  /** The last surface error raised for the node, so a condition raises once while it lasts. */
  raised: string | undefined;
}

/** An element waiting for a successor node under the same `instanceId`. */
interface Kept {
  owner: ComponentNode;
  readonly element: Element;
  readonly tag: string;
}

/** Projects the nodes of one surface. The surface owns it and mounts the resolver's root node. */
export class Projection {
  /** The surface's `iconMap`; setting it re-projects every Icon node (§6.C.3; §12 AM-008). */
  readonly iconMap: Signal<A2uiIconMap | undefined> = signal(undefined);
  readonly urlPolicy: Signal<UrlPolicy | undefined> = signal(undefined);
  readonly markdownRenderer: Signal<MarkdownRenderer | undefined> = signal(undefined);

  readonly #host: ProjectionHost;
  readonly #views = new WeakMap<ComponentNode, View>();
  readonly #kept = new Map<string, Kept>();
  readonly #items = new WeakMap<Element, HTMLElement>();
  readonly #actions = new WeakMap<Element, Map<string, unknown>>();
  readonly #listening = new WeakMap<Element, Set<string>>();

  constructor(host: ProjectionHost) {
    this.#host = host;
  }

  /** Returns the view of a root node, creating it on first use. */
  mountRoot(node: ComponentNode): Signal<Element | undefined> {
    return this.#mount(node, ROOT_CONTEXT).element;
  }

  /** The element currently projected for `instanceId`, if its node is alive. */
  elementFor(instanceId: string): Element | undefined {
    const kept = this.#kept.get(instanceId);
    return kept && !kept.owner.disposed ? kept.element : undefined;
  }

  /** The `instanceId` of the projected element that holds `target`, if any. */
  instanceIdOf(target: Node | null): string | undefined {
    if (!target) return undefined;
    let best: string | undefined;
    let depth = Number.POSITIVE_INFINITY;
    for (const [id, kept] of this.#kept) {
      if (kept.owner.disposed || !kept.element.contains(target)) continue;
      let d = 0;
      for (let n: Node | null = target; n && n !== kept.element; n = n.parentNode) d++;
      if (d < depth) {
        depth = d;
        best = id;
      }
    }
    return best;
  }

  /** Drops the elements whose node died and that no successor took over. */
  purge(): void {
    for (const [id, kept] of this.#kept) if (kept.owner.disposed) this.#kept.delete(id);
  }

  #mount(node: ComponentNode, context: Context): View {
    const known = this.#views.get(node);
    if (known) return known;
    const view: View = {
      node,
      context,
      element: signal<Element | undefined>(undefined),
      own: undefined,
      ownTag: undefined,
      placeholders: new Map(),
      raised: undefined,
    };
    this.#views.set(node, view);
    const target = node.isPlaceholder ? undefined : targetOf(node.context?.componentModel.catalog.id, node.type);
    if (!target) {
      // A pending child stays hidden and raises nothing; an unknown type or a cycle is an inert placeholder, and
      // `web_core` reports it (§6.G.4; R1 §2.5.2; ARCH §17.4).
      setValue(view.element, this.#placeholder(view, node.state === 'pending' ? 'pending' : node.state));
      return view;
    }
    node.addCleanup(
      effect(() => {
        try {
          this.#render(view, target);
        } catch (err) {
          this.#host.thrown(err, { componentId: node.componentId });
        }
      }),
    );
    return view;
  }

  #placeholder(view: View, reason: string): HTMLElement {
    let element = view.placeholders.get(reason);
    if (!element) {
      element = document.createElement('div');
      element.dataset.lineA2uiPlaceholder = reason;
      element.inert = true;
      element.hidden = reason === 'pending';
      view.placeholders.set(reason, element);
    }
    return element;
  }

  /** The node's element for `tag`: its own, its predecessor's under the same `instanceId`, or a new one. */
  #element(view: View, tag: string): Element {
    if (view.own && view.ownTag === tag) return view.own;
    const id = view.node.instanceId;
    const kept = this.#kept.get(id);
    let element: Element;
    if (kept && kept.tag === tag && (kept.owner === view.node || kept.owner.disposed)) {
      kept.owner = view.node;
      element = kept.element;
    } else {
      element = document.createElement(tag);
      // Two live nodes may share an `instanceId` under different parents; only the first is kept.
      if (!kept || kept.owner.disposed || kept.owner === view.node)
        this.#kept.set(id, { owner: view.node, element, tag });
    }
    view.own = element;
    view.ownTag = tag;
    return element;
  }

  #show(view: View, element: Element): void {
    if (peekValue(view.element) !== element) setValue(view.element, element);
  }

  #raise(view: View, key: string, code: SurfaceErrorCode, message: string): void {
    if (view.raised === key) return;
    view.raised = key;
    this.#host.raise(code, message, { componentId: view.node.componentId });
  }

  #render(view: View, target: Target): void {
    const props = getValue(view.node.props) as Record<string, unknown>;
    if (target.kind === 'component') {
      this.#renderComponent(view, target, props);
      return;
    }
    let element: Element;
    if (target.kind === 'text') {
      const variant = text(props.variant);
      const tag = view.context.inButton
        ? target.inButton
        : (target.tagByVariant[variant as keyof typeof target.tagByVariant] ?? target.tagByVariant.body);
      element = this.#element(view, tag);
      this.#text(view, element, text(unwrap(props.text)));
    } else {
      element = this.#element(view, target.tag);
      this.#native(element, target, props);
    }
    this.#show(view, element);
  }

  #renderComponent(view: View, target: Extract<Target, { kind: 'component' }>, props: Record<string, unknown>): void {
    const name = this.#nameState(target.descriptor, props);
    if (name !== 'named') {
      // A pending name source keeps the node hidden; a missing name makes it a placeholder (§10 SD36, SD82).
      this.#show(view, this.#placeholder(view, name === 'pending' ? 'pending' : 'missing-name'));
      if (name === 'missing') {
        const message = `${view.node.type} '${view.node.componentId}' has no accessible name.`;
        this.#raise(view, 'name', 'MISSING_ACCESSIBLE_NAME', message);
      }
      return;
    }
    if (view.raised === 'name') view.raised = undefined;
    this.#host.load(target.descriptor);
    const element = this.#element(view, target.descriptor.tag);
    this.#bind(view, element, target, props);
    this.#events(element, target.descriptor, props);
    this.#children(element, target.descriptor, props);
    this.#show(view, element);
  }

  /** Whether a node that requires a name has one, before render (§6.G.4 Accessibility; §10 SD36, SD82). */
  #nameState(descriptor: LineDescriptor, props: Record<string, unknown>): 'named' | 'missing' | 'pending' {
    const sources = descriptor.accessibility.requiredName;
    if (!sources) return 'named';
    const accessibility = isJsonObject(props.accessibility) ? props.accessibility : {};
    let pending = false;
    for (const source of sources) {
      const texts =
        source.kind === 'accessibilityLabel'
          ? [text(unwrap(accessibility.label))]
          : source.kind === 'textProp'
            ? [boundText(props[source.prop])]
            : childNodes(props[source.prop]).map(childText);
      if (texts.some((own) => own !== undefined && own.trim() !== '')) return 'named';
      pending ||= texts.includes(undefined);
    }
    return pending ? 'pending' : 'missing';
  }

  #text(view: View, element: Element, value: string): void {
    const renderer = getValue(this.markdownRenderer);
    if (renderer) {
      // The message names the Text and the kind of failure only: the hook's own error text may hold consumer
      // internals, and the error travels to the agent.
      let threw = false;
      let rendered: unknown;
      try {
        rendered = renderer(value);
      } catch {
        threw = true;
      }
      if (rendered instanceof Node) {
        element.replaceChildren(rendered);
        return;
      }
      view.raised = undefined;
      const id = view.node.componentId;
      this.#raise(
        view,
        'markdown',
        'MARKDOWN_RENDER_ERROR',
        threw
          ? `markdownRenderer threw for Text '${id}'.`
          : `markdownRenderer returned a value that is not a Node for Text '${id}'.`,
      );
    }
    setText(element, value);
  }

  #native(element: Element, target: Extract<BasicTarget, { kind: 'native' }>, props: Record<string, unknown>): void {
    const url = allowedUrl(unwrap(props.url), target.url, document.baseURI, getValue(this.urlPolicy));
    setAttribute(element, 'src', url?.href);
    for (const [name, value] of Object.entries(target.attributes)) setAttribute(element, name, value);
    const accessibility = isJsonObject(props.accessibility) ? props.accessibility : {};
    const description = label(props.description);
    if (target.tag === 'img') {
      setAttribute(element, 'alt', description ?? label(accessibility.label) ?? '');
    } else {
      setAttribute(element, 'aria-label', label(accessibility.label) ?? description);
    }
    setAttribute(element, 'aria-description', label(accessibility.description));
  }

  /**
   * Applies the node's bound props, the target's fixed attributes and the host naming to the element. A text
   * binding writes the prop's string as the host's text content, which lands in the default slot (§12 AM-092); a URL
   * binding sets its attribute only to a URL the policy allows, and reads the policy inside the effect, so a new
   * policy re-projects the node (§12 AM-094).
   */
  #bind(
    view: View,
    element: Element,
    target: Extract<Target, { kind: 'component' }>,
    props: Record<string, unknown>,
  ): void {
    const { descriptor, basicType } = target;
    const own = renamed(props, basicType);
    const owned = lookupOwned(descriptor);
    if (owned.size > 0) this.#icon(view, element, own, basicType !== undefined);
    for (const [prop, binding] of Object.entries(descriptor.bindings.props)) {
      if (!binding || binding.kind === 'surfaceLookup' || owned.has(prop)) continue;
      if (binding.kind === 'text') {
        setText(element, text(unwrap(own[prop])));
        continue;
      }
      if (binding.kind === 'url') {
        const url = allowedUrl(unwrap(own[prop]), binding.use, document.baseURI, getValue(this.urlPolicy));
        setAttribute(element, binding.name, url?.href);
        continue;
      }
      if (owned.has(binding.name)) continue;
      if (binding.kind === 'attribute') setAttribute(element, binding.name, unwrap(own[prop]));
      else setProperty(element, binding.name, unwrap(own[prop]));
    }
    for (const [name, fixed] of Object.entries(target.attributes)) setAttribute(element, name, fixed);
    this.#hostNaming(element, descriptor, own);
  }

  /** Wires the action map's events and the value commit event (§6.G.1; ARCH §17.2 rule C9). */
  #events(element: Element, descriptor: LineDescriptor, props: Record<string, unknown>): void {
    for (const [prop, action] of Object.entries(descriptor.actions)) {
      if (action) this.#on(element, action.event, props[prop]);
    }
    const commit = descriptor.bindings.value;
    const member = commit ? descriptor.bindings.props[commit.prop] : undefined;
    if (commit && (member?.kind === 'attribute' || member?.kind === 'property')) {
      this.#onCommit(element, commit.commitEvent, member, props[commit.prop]);
    }
  }

  /** Projects the slotted children and reconciles them into the element; a `List` wraps them as list items. */
  #children(element: Element, descriptor: LineDescriptor, props: Record<string, unknown>): void {
    const slots = Object.entries(descriptor.slots);
    if (slots.length === 0) return;
    const isList = element.getAttribute('role') === 'list';
    const context: Context = { inButton: descriptor.tag === 'line-button' };
    const children: Element[] = [];
    for (const [prop, slot] of slots) {
      for (const child of childNodes(props[prop])) {
        const childElement = getValue(this.#mount(child, context).element);
        if (!childElement) continue;
        if (slot) childElement.setAttribute('slot', slot);
        else childElement.removeAttribute('slot');
        children.push(isList ? this.#listItem(childElement) : this.#unlisted(childElement));
      }
    }
    this.#host.reconciler.reconcile(element, children);
  }

  /**
   * Sets `accessibility.label` and `.description` as the host `aria-label` and `aria-description`, with the
   * `hostNaming` exceptions of the descriptor (§6.G.4 Accessibility; §12 AM-067, AM-068).
   */
  #hostNaming(element: Element, descriptor: LineDescriptor, props: Record<string, unknown>): void {
    const naming = descriptor.accessibility.hostNaming;
    const named =
      naming.kind === 'always' ||
      (naming.kind === 'listRole' && element.getAttribute('role') === 'list') ||
      (naming.kind === 'unlessTrue' && unwrap(props[naming.prop]) !== true);
    const accessibility = isJsonObject(props.accessibility) ? props.accessibility : {};
    setAttribute(element, 'aria-label', named ? label(accessibility.label) : undefined);
    setAttribute(element, 'aria-description', named ? label(accessibility.description) : undefined);
  }

  /**
   * Projects an Icon (§6.G.4 Basic mapping, "`line` catalog Icon"; §10 SD15, SD33). A path wins over a name and
   * skips the lookup; a name is looked up in `iconMap` with `Object.hasOwn`, and an unmapped name, or any name
   * while `iconMap` is unset, leaves the C8 neutral state and raises `UNMAPPED_ICON` once.
   */
  #icon(view: View, element: Element, props: Record<string, unknown>, basic: boolean): void {
    const name = unwrap(props.name);
    const path = basic ? (isJsonObject(name) ? name.svgPath : undefined) : unwrap(props.path);
    const iconMap = getValue(this.iconMap);
    const neutral = () => {
      for (const attribute of ['library', 'name', 'weight', 'mirror']) element.removeAttribute(attribute);
      setProperty(element, 'path', undefined);
    };
    if (typeof path === 'string' && path !== '') {
      for (const attribute of ['library', 'name', 'weight']) element.removeAttribute(attribute);
      setAttribute(element, 'mirror', !basic && unwrap(props.mirror) === true);
      setProperty(element, 'path', path);
      view.raised = undefined;
      return;
    }
    if (typeof name !== 'string' || name === '') {
      neutral();
      view.raised = undefined;
      return;
    }
    if (iconMap && Object.hasOwn(iconMap, name)) {
      const entry = iconMap[name as keyof A2uiIconMap];
      setProperty(element, 'path', undefined);
      setAttribute(element, 'library', entry.library);
      setAttribute(element, 'name', entry.name);
      setAttribute(element, 'weight', entry.weight);
      setAttribute(element, 'mirror', entry.mirror);
      view.raised = undefined;
      return;
    }
    neutral();
    this.#iconErrors(view, name, iconMap);
  }

  readonly #raisedMaps = new WeakMap<View, A2uiIconMap | undefined>();

  #iconErrors(view: View, name: string, iconMap: A2uiIconMap | undefined): void {
    const key = `icon:${name}`;
    if (view.raised === key && this.#raisedMaps.get(view) === iconMap) return;
    view.raised = undefined;
    this.#raisedMaps.set(view, iconMap);
    this.#raise(
      view,
      key,
      'UNMAPPED_ICON',
      iconMap
        ? `Icon '${view.node.componentId}' names '${name}', which iconMap does not map.`
        : `Icon '${view.node.componentId}' names '${name}', and iconMap is unset.`,
    );
  }

  /** A child of an A2UI `List`: a `line-stack` takes `role="listitem"`, anything else a wrapper that has it. */
  #listItem(child: Element): Element {
    if (child.localName === 'line-stack') {
      if (child.getAttribute('role') !== 'list') child.setAttribute('role', 'listitem');
      return child;
    }
    if (child instanceof HTMLElement && child.hidden) return child;
    let item = this.#items.get(child);
    if (!item) {
      item = document.createElement('div');
      item.setAttribute('role', 'listitem');
      this.#items.set(child, item);
    }
    this.#host.reconciler.reconcile(item, [child]);
    return item;
  }

  /** A child outside a `List` drops the `listitem` role a `List` gave it. */
  #unlisted(child: Element): Element {
    if (child.localName === 'line-stack' && child.getAttribute('role') === 'listitem') child.removeAttribute('role');
    return child;
  }

  /** Runs the element's current action closure on `event`; a rejection becomes `line-a2ui-error`. */
  #on(element: Element, event: string, action: unknown): void {
    let actions = this.#actions.get(element);
    if (!actions) {
      actions = new Map();
      this.#actions.set(element, actions);
    }
    actions.set(event, action);
    this.#listen(element, event, () => {
      const current = this.#actions.get(element)?.get(event);
      if (typeof current !== 'function') return;
      try {
        const result: unknown = current();
        if (result instanceof Promise) {
          result.catch((err: unknown) => this.#host.thrown(err));
        }
      } catch (err) {
        this.#host.thrown(err);
      }
    });
  }

  /** Writes the element's committed value back through its binding when it is writable (ARCH §17.2 rule C9). */
  #onCommit(
    element: Element,
    event: string,
    member: { readonly kind: 'attribute' | 'property'; readonly name: string },
    binding: unknown,
  ): void {
    let actions = this.#actions.get(element);
    if (!actions) {
      actions = new Map();
      this.#actions.set(element, actions);
    }
    actions.set(`commit:${event}`, binding);
    this.#listen(element, event, () => {
      const current = this.#actions.get(element)?.get(`commit:${event}`);
      if (!(current instanceof WritableBinding)) return;
      const next =
        member.kind === 'property'
          ? (element as unknown as Record<string, unknown>)[member.name]
          : element.getAttribute(member.name);
      try {
        current.set(next);
      } catch (err) {
        this.#host.thrown(err);
      }
    });
  }

  #listen(element: Element, event: string, listener: () => void): void {
    let events = this.#listening.get(element);
    if (!events) {
      events = new Set();
      this.#listening.set(element, events);
    }
    if (events.has(event)) return;
    events.add(event);
    element.addEventListener(event, listener);
  }
}
