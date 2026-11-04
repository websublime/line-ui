/**
 * The surface limits: node count, depth and data-model size (Phase 1 spec §6.G.4 Limits; ARCH §17.4; §10 SD53,
 * SD56).
 *
 * A breach rejects its message before it applies. The check walks the tree the message would leave, as
 * `NodeResolver` would build it from the root, because `web_core` reports a message to the resolver only after it
 * applies, and its depth limit is unreliable with `allowMissingRoot: true` (R2 §2.6).
 *
 * @module a2ui/limits
 */

import type { Catalog, ComponentApi } from '@a2ui/web_core/catalog';
import { extractRefFields, MAX_DYNAMIC_CHILD_LIST_SIZE } from '@a2ui/web_core/resolution';
import { DataModel, type SurfaceModel } from '@a2ui/web_core/state';
import { isJsonObject as isRecord, type JsonObject as Json } from './guards.js';

/** The three limits of a surface, each a positive integer. */
export interface Limits {
  /** The most nodes a surface holds: component definitions, and nodes of the resolved tree, placeholders included. */
  readonly maxNodes: number;
  /** The deepest the resolved tree goes, the root at depth 1. */
  readonly maxDepth: number;
  /** The most UTF-8 bytes of `JSON.stringify` of the data model, measured as it stands after the message. */
  readonly maxDataModelSize: number;
}

/** The name of one limit. */
export type LimitName = keyof Limits;

/**
 * The limits a surface applies while an attribute leaves one unset, from the G4 stress test, sized on the slowest
 * engine (§6.G.4 Limits; §10 SD56; §12 AM-078): 1,000 nodes, depth 32, and 1,048,576 UTF-8 bytes of
 * `JSON.stringify` of the data model.
 */
export const DEFAULT_LIMITS: Limits = Object.freeze({
  maxNodes: 1_000,
  maxDepth: 32,
  maxDataModelSize: 1_048_576,
});

/** A breached limit: which one, the value the message would reach (at least) and the limit. */
export interface LimitBreach {
  readonly limit: LimitName;
  readonly value: number;
  readonly max: number;
}

/**
 * Returns `value` when it is a positive integer, as an attribute string or a number, and `undefined` otherwise:
 * `0`, a negative number, a non-integer and any other text keep the default (§6.G.4 Limits; MANIFESTO Law 9).
 *
 * @param value The attribute value.
 */
export function positiveInteger(value: string | null): number | undefined {
  if (value === null || !/^\s*\+?\d+\s*$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : undefined;
}

/**
 * The UTF-8 byte length of `text`, as `new TextEncoder().encode(text).byteLength` counts it, a lone surrogate
 * included (3 bytes, U+FFFD), without allocating the encoding.
 *
 * @param text The text.
 */
export function utf8Length(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit < 0x80) bytes += 1;
    else if (unit < 0x800) bytes += 2;
    else if (unit >= 0xd800 && unit <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        i++;
      } else bytes += 3;
    } else bytes += 3;
  }
  return bytes;
}

/** The size of a data model, as `maxDataModelSize` measures it. */
export function dataModelSize(data: unknown): number {
  return utf8Length(JSON.stringify(data) ?? '');
}

/** One component definition of the candidate tree. */
interface CandidateComponent {
  readonly type: string;
  readonly properties: Json;
  readonly catalog: Catalog<ComponentApi> | undefined;
}

/** JSON Pointer segments, decoded the way `DataModel` decodes them. */
function segments(path: string): string[] {
  return path
    .split('/')
    .filter((part) => part.length > 0)
    .map((part) => part.replace(/~([01])/g, (_, digit: string) => (digit === '1' ? '/' : '~')));
}

/** Reads `path` from `data` the way `DataModel.get` does. */
function readPath(data: unknown, path: string): unknown {
  let current = data;
  for (const segment of segments(path)) {
    if (current === null || typeof current !== 'object') return undefined;
    if (Array.isArray(current)) {
      if (!/^(0|[1-9]\d*)$/.test(segment)) return undefined;
      current = current[Number(segment)];
    } else {
      if (!Object.hasOwn(current, segment)) return undefined;
      current = (current as Json)[segment];
    }
  }
  return current;
}

/** Resolves `path` against the data path `base`, the way `DataContext.resolvePath` does. */
function resolvePath(path: string, base: string): string {
  if (path.startsWith('/')) return path;
  let prefix = base.endsWith('/') && base.length > 1 ? base.slice(0, -1) : base;
  if (path === '' || path === '.') return prefix || '/';
  if (prefix === '/') prefix = '';
  return `${prefix}/${path}`;
}

/**
 * Copies the containers along `path` so that `DataModel.set` on the copy changes nothing the live model holds.
 * The rest of the tree stays shared, so the cost is the length of the path, not the size of the model.
 */
function spineCopy(data: unknown, path: string): unknown {
  if (data === null || typeof data !== 'object') return data;
  const root: unknown = Array.isArray(data) ? [...data] : { ...data };
  let current = root;
  for (const segment of segments(path)) {
    if (current === null || typeof current !== 'object') break;
    const container = current as Json;
    if (!Object.hasOwn(container, segment)) break;
    const child = container[segment];
    if (child === null || typeof child !== 'object') break;
    const copy: unknown = Array.isArray(child) ? [...child] : { ...child };
    container[segment] = copy;
    current = copy;
  }
  return root;
}

/** A node of the candidate tree: a component at a data path, under its parent. */
interface Frame {
  readonly id: string;
  readonly dataPath: string;
  readonly depth: number;
  readonly parent: Frame | undefined;
}

/** Whether the frame repeats a (component, data path) of its parent chain: a cyclic stand-in, as in `NodeResolver`. */
function isCyclic(frame: Frame): boolean {
  for (let up = frame.parent; up; up = up.parent) {
    if (up.id === frame.id && up.dataPath === frame.dataPath) return true;
  }
  return false;
}

/** The children of a static child list, a template and an array of nested references, as `NodeResolver` makes them. */
function* listChildren(value: unknown, dataPath: string, data: unknown): Generator<[unknown, string]> {
  if (Array.isArray(value)) {
    for (const item of value.slice(0, MAX_DYNAMIC_CHILD_LIST_SIZE)) {
      yield [isRecord(item) ? item.componentId : item, dataPath];
    }
    return;
  }
  // A template: one child per item of the bound array, scoped to the item (`GenericBinder`).
  if (!isRecord(value) || typeof value.path !== 'string' || !value.path) return;
  const listPath = resolvePath(value.path, dataPath);
  const items = readPath(data, listPath);
  if (!Array.isArray(items)) return;
  const count = Math.min(items.length, MAX_DYNAMIC_CHILD_LIST_SIZE);
  for (let index = 0; index < count; index++) yield [value.componentId, resolvePath(String(index), listPath)];
}

/** The (component id, data path) pairs an array of objects references through its `keys`. */
function* nestedChildren(value: unknown, keys: ReadonlySet<string>, dataPath: string): Generator<[unknown, string]> {
  if (!Array.isArray(value)) return;
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    for (const key of keys) yield [entry[key], dataPath];
  }
}

/** The (component id, data path) pairs a component references, read through its schema's reference fields. */
function* childrenOf(
  component: CandidateComponent,
  api: ComponentApi,
  dataPath: string,
  data: unknown,
): Generator<[unknown, string]> {
  for (const [key, ref] of extractRefFields(api.schema)) {
    const value = component.properties[key];
    if (ref.kind === 'single') yield [value, dataPath];
    else if (ref.kind === 'list') yield* listChildren(value, dataPath, data);
    else yield* nestedChildren(value, ref.keys, dataPath);
  }
}

/** The component ids a component references, its template's item component included, whatever the data holds. */
function referencedIds(component: CandidateComponent, api: ComponentApi): string[] {
  const ids: string[] = [];
  for (const [id] of childrenOf(component, api, '/', undefined)) if (typeof id === 'string') ids.push(id);
  for (const [key, ref] of extractRefFields(api.schema)) {
    const value = component.properties[key];
    if (ref.kind === 'list' && isRecord(value) && typeof value.componentId === 'string') ids.push(value.componentId);
  }
  return ids;
}

/**
 * Orders the components of one `updateComponents` body so that each comes after the components of the same body
 * it references. `web_core` applies the components in order, and `NodeResolver` re-materializes a parent each time
 * one of its pending children arrives, so a parent sent before its N children costs O(N²); sent after them, it
 * materializes once (`@a2ui/web_core` 0.14.0 `src/resolution/node-resolver.js`, `onComponentCreated`). The order
 * changes nothing else: `web_core` validates the whole body before it applies any of it. Returns `components`
 * unchanged when it holds anything this order cannot read.
 *
 * @param components The `components` array of the body.
 * @param surface The surface the body targets.
 */
export function childrenFirst(components: readonly unknown[], surface: SurfaceModel): readonly unknown[] {
  const inBody = new Map<string, unknown>();
  for (const update of components) {
    if (!isRecord(update) || typeof update.id !== 'string' || inBody.has(update.id)) return components;
    inBody.set(update.id, update);
  }
  const candidate = candidateComponents(surface, components);
  const children = (id: string): string[] => {
    const component = candidate.get(id);
    const api = component?.catalog?.components.get(component.type);
    return component && api ? referencedIds(component, api).filter((child) => inBody.has(child)) : [];
  };
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const root of inBody.keys()) postOrder(root, children, seen, ordered);
  return ordered.map((id) => inBody.get(id));
}

/**
 * Appends `root` and the ids under it that `seen` lacks to `out`, each after its children, with an explicit stack
 * so a deep chain cannot overflow the call stack. A cycle stops at the first repeat.
 */
function postOrder(root: string, children: (id: string) => string[], seen: Set<string>, out: string[]): void {
  const stack: [string, boolean][] = [[root, false]];
  for (let top = stack.pop(); top; top = stack.pop()) {
    const [id, expanded] = top;
    if (expanded) {
      out.push(id);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push([id, true]);
    for (const child of children(id)) if (!seen.has(child)) stack.push([child, false]);
  }
}

/** The breach a node of the walk reaches, if any: its ordinal against `maxNodes`, its depth against `maxDepth`. */
function nodeBreach(ordinal: number, depth: number, limits: Limits): LimitBreach | undefined {
  if (ordinal > limits.maxNodes) return { limit: 'maxNodes', value: ordinal, max: limits.maxNodes };
  if (depth > limits.maxDepth) return { limit: 'maxDepth', value: depth, max: limits.maxDepth };
  return undefined;
}

/** Counts definitions and walks the candidate tree from the root, stopping at the first breach. */
function walk(
  components: ReadonlyMap<string, CandidateComponent>,
  data: unknown,
  rootId: string,
  limits: Limits,
): LimitBreach | undefined {
  if (components.size > limits.maxNodes) {
    return { limit: 'maxNodes', value: components.size, max: limits.maxNodes };
  }
  if (!components.has(rootId)) return undefined;
  let nodes = 0;
  const stack: Frame[] = [{ id: rootId, dataPath: '/', depth: 1, parent: undefined }];
  for (let frame = stack.pop(); frame; frame = stack.pop()) {
    nodes++;
    const breach = nodeBreach(nodes, frame.depth, limits);
    if (breach) return breach;
    const component = components.get(frame.id);
    const api = component?.catalog?.components.get(component.type);
    if (!(component && api) || isCyclic(frame)) continue;
    for (const [id, dataPath] of childrenOf(component, api, frame.dataPath, data)) {
      if (typeof id === 'string' && id) stack.push({ id, dataPath, depth: frame.depth + 1, parent: frame });
    }
  }
  return undefined;
}

/** Applies one raw component update to the candidate map, as `MessageProcessor.applyComponentUpdate` applies it. */
function applyUpdate(components: Map<string, CandidateComponent>, surface: SurfaceModel, update: unknown): void {
  if (!isRecord(update)) return;
  const { id, component, catalogId, metadata: _metadata, ...properties } = update;
  if (typeof id !== 'string' || !id) return;
  const existing = components.get(id);
  const type = typeof component === 'string' && component ? component : existing?.type;
  if (!type) return;
  const named = typeof catalogId === 'string' && catalogId ? surface.availableCatalogs.get(catalogId) : undefined;
  const catalog = named ?? (existing?.type === type ? existing.catalog : surface.defaultCatalog);
  components.set(id, { type, properties, catalog });
}

/** The candidate component map: the surface's definitions with `updates` applied as `web_core` applies them. */
function candidateComponents(surface: SurfaceModel, updates: readonly unknown[]): Map<string, CandidateComponent> {
  const components = new Map<string, CandidateComponent>();
  for (const [id, model] of surface.componentsModel.entries) {
    components.set(id, { type: model.type, properties: model.properties, catalog: model.catalog });
  }
  for (const update of updates) applyUpdate(components, surface, update);
  return components;
}

/** Checks the data model an `updateDataModel` body leaves, then the tree its templates expand to. */
function checkDataUpdate(update: Json, surface: SurfaceModel, limits: Limits): LimitBreach | undefined {
  const path = typeof update.path === 'string' && update.path ? update.path : '/';
  // `DataModel.set` on a copy of the path's containers gives the model exactly as `web_core` would leave it.
  const scratch = new DataModel(spineCopy(surface.dataModel.get('/'), path) as Json);
  scratch.set(path, update.value);
  const data: unknown = scratch.get('/');
  const size = dataModelSize(data);
  if (size > limits.maxDataModelSize) return { limit: 'maxDataModelSize', value: size, max: limits.maxDataModelSize };
  return walk(candidateComponents(surface, []), data, surface.rootId, limits);
}

/**
 * Checks one A2UI v0.9 envelope against `limits` before it applies, as one unit, and returns the first breach, or
 * `undefined` when it stays within every limit or changes neither the tree nor the data model (§6.G.4 Limits;
 * §12 AM-082, AM-083). A v0.9 envelope holds one operation: its `createSurface` carries no inline `components` or
 * `dataModel`, which the strict v0.9 schema of `web_core` 0.14.0 rejects, and `deleteSurface` adds nothing. A
 * malformed envelope is left to `web_core`, which rejects it with its own code.
 *
 * @param message One A2UI v0.9 envelope.
 * @param surface The surface the envelope targets, if it exists.
 * @param limits The limits of that surface.
 */
export function checkLimits(message: Json, surface: SurfaceModel | undefined, limits: Limits): LimitBreach | undefined {
  if (!surface) return undefined;
  try {
    const components = message.updateComponents;
    if (isRecord(components) && Array.isArray(components.components)) {
      const candidate = candidateComponents(surface, components.components);
      return walk(candidate, surface.dataModel.get('/'), surface.rootId, limits);
    }
    if (isRecord(message.updateDataModel)) return checkDataUpdate(message.updateDataModel, surface, limits);
  } catch {
    // An envelope the check cannot read is one `web_core` rejects, so it never applies.
  }
  return undefined;
}
